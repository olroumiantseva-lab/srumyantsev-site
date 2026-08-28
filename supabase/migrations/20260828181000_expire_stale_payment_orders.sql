alter table public.payment_orders drop constraint payment_orders_status_check;
alter table public.payment_orders add constraint payment_orders_status_check
  check (status in ('pending', 'succeeded', 'failed', 'refunded', 'expired'));

create index if not exists payment_orders_pending_created_idx
  on public.payment_orders (created_at)
  where status = 'pending';

create or replace function public.expire_stale_payment_orders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update public.payment_orders
     set status = 'expired'
   where status = 'pending'
     and created_at < now() - interval '24 hours';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.expire_stale_payment_orders() from public, anon, authenticated;

create or replace function public.complete_robokassa_payment(p_order_id bigint, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
begin
  select po.* into v_order from public.payment_orders po where po.id = p_order_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'succeeded' then
    if v_order.user_id <> p_user_id then raise exception using errcode = 'P0001', message = 'ORDER_USER_CONFLICT'; end if;
    return false;
  end if;
  if v_order.status not in ('pending', 'expired') then raise exception using errcode = 'P0001', message = 'ORDER_NOT_PAYABLE'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  update public.payment_orders set status='succeeded', user_id=p_user_id, paid_at=now() where id=p_order_id;
  insert into public.purchases(user_id,provider,provider_payment_id,amount,currency,product_id,credits_added,status)
  values(p_user_id,'robokassa',p_order_id::text,v_order.amount_kopecks,'RUB','document_10',v_order.credits,'succeeded')
  on conflict(provider,provider_payment_id) do nothing;
  insert into public.credit_transactions(user_id,amount,type,reference_id)
  values(p_user_id,v_order.credits,'purchase','robokassa:'||p_order_id::text)
  on conflict(user_id,type,reference_id) do nothing;
  return true;
end;
$$;

revoke all on function public.complete_robokassa_payment(bigint,uuid) from public, anon, authenticated;
