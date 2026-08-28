create table public.payment_orders (
  id bigint generated always as identity primary key,
  email text not null,
  amount_kopecks integer not null default 29000 check (amount_kopecks = 29000),
  credits integer not null default 10 check (credits = 10),
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  provider text not null default 'robokassa' check (provider = 'robokassa'),
  user_id uuid references public.profiles(id) on delete restrict,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_orders_email_length check (char_length(email) between 3 and 320),
  constraint payment_orders_paid_shape check ((status in ('succeeded', 'refunded')) = (paid_at is not null and user_id is not null))
);

create index payment_orders_email_created_idx on public.payment_orders (lower(email), created_at desc);

create trigger payment_orders_set_updated_at before update on public.payment_orders
for each row execute function public.set_updated_at();

alter table public.payment_orders enable row level security;
revoke all on public.payment_orders from public, anon, authenticated;

alter table public.credit_transactions drop constraint credit_transactions_type_check;
alter table public.credit_transactions add constraint credit_transactions_type_check
  check (type in ('purchase', 'document_analysis', 'dev_grant', 'signup_grant', 'refund', 'adjustment'));

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
  if v_order.status <> 'pending' then raise exception using errcode = 'P0001', message = 'ORDER_NOT_PENDING'; end if;
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
