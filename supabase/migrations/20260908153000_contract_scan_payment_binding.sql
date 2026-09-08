create table public.contract_scans (
  id uuid primary key default gen_random_uuid(),
  source_site text not null default 'proverjdo' check (source_site = 'proverjdo'),
  source_text text not null,
  role text not null default '',
  focus text not null default '',
  signed text not null default '',
  status text not null default 'created' check (status in ('created','preview_ready','full_ready','failed','expired')),
  preview_json jsonb,
  full_result_json jsonb,
  user_id uuid references public.profiles(id) on delete set null,
  email text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_scans_source_length check (char_length(source_text) between 1 and 30000),
  constraint contract_scans_role_length check (char_length(role) <= 80),
  constraint contract_scans_focus_length check (char_length(focus) <= 120),
  constraint contract_scans_signed_length check (char_length(signed) <= 20),
  constraint contract_scans_email_length check (email is null or char_length(email) between 3 and 320)
);

create index contract_scans_expires_idx on public.contract_scans(expires_at) where status not in ('expired','failed');
create index contract_scans_user_created_idx on public.contract_scans(user_id, created_at desc) where user_id is not null;

create trigger contract_scans_set_updated_at before update on public.contract_scans
for each row execute function public.set_updated_at();

alter table public.contract_scans enable row level security;
revoke all on public.contract_scans from public, anon, authenticated;

alter table public.products
  add column resource_type text,
  add constraint products_resource_type_format check (resource_type is null or resource_type ~ '^[a-z0-9][a-z0-9_-]{2,39}$');

update public.products
set resource_type = 'contract_scan',
    entitlement_payload = entitlement_payload || '{"resource_type":"contract_scan"}'::jsonb
where id = 'contract_check_490';

alter table public.payment_orders
  add column resource_type text,
  add column resource_id uuid,
  add constraint payment_orders_resource_shape check ((resource_type is null) = (resource_id is null));

create index payment_orders_resource_idx on public.payment_orders(resource_type, resource_id) where resource_id is not null;

alter table public.entitlements
  add column resource_type text,
  add column resource_id uuid,
  add constraint entitlements_resource_shape check ((resource_type is null) = (resource_id is null));

create index entitlements_resource_idx on public.entitlements(resource_type, resource_id) where resource_id is not null;

create or replace function public.complete_product_payment(p_order_id bigint, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
  v_credits integer;
  v_entitlement_key text;
begin
  select po.* into v_order
  from public.payment_orders po
  where po.id = p_order_id
  for update;

  if not found then raise exception using errcode = 'P0001', message = 'ORDER_NOT_FOUND'; end if;
  if v_order.status = 'succeeded' then
    if v_order.user_id <> p_user_id then raise exception using errcode = 'P0001', message = 'ORDER_USER_CONFLICT'; end if;
    return false;
  end if;
  if v_order.status not in ('pending','expired') then raise exception using errcode = 'P0001', message = 'ORDER_NOT_PAYABLE'; end if;
  if not exists (select 1 from public.profiles p where p.id = p_user_id) then raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND'; end if;

  if v_order.resource_type = 'contract_scan' then
    if not exists (
      select 1 from public.contract_scans cs
      where cs.id = v_order.resource_id and cs.expires_at > now() and cs.status not in ('failed','expired')
    ) then
      raise exception using errcode = 'P0001', message = 'RESOURCE_NOT_FOUND';
    end if;
  elsif v_order.resource_type is not null then
    raise exception using errcode = 'P0001', message = 'RESOURCE_TYPE_UNSUPPORTED';
  end if;

  if v_order.entitlement_type = 'credits' then
    v_credits := coalesce((v_order.entitlement_payload->>'credits')::integer, v_order.credits, 0);
    if v_credits <= 0 then raise exception using errcode = 'P0001', message = 'INVALID_CREDIT_ENTITLEMENT'; end if;
  else
    v_credits := 0;
  end if;

  update public.payment_orders set status='succeeded', user_id=p_user_id, paid_at=now() where id=p_order_id;

  insert into public.purchases(user_id,provider,provider_payment_id,amount,currency,product_id,credits_added,status)
  values(p_user_id,'robokassa',p_order_id::text,v_order.amount_kopecks,'RUB',v_order.product_id,v_credits,'succeeded')
  on conflict(provider,provider_payment_id) do nothing;

  if v_order.entitlement_type = 'credits' then
    insert into public.credit_transactions(user_id,amount,type,reference_id)
    values(p_user_id,v_credits,'purchase','robokassa:'||p_order_id::text)
    on conflict(user_id,type,reference_id) do nothing;
  else
    v_entitlement_key := coalesce(nullif(v_order.entitlement_payload->>'key',''),v_order.product_id);
    insert into public.entitlements(user_id,product_id,payment_order_id,entitlement_type,entitlement_key,payload,resource_type,resource_id)
    values(p_user_id,v_order.product_id,p_order_id,v_order.entitlement_type,v_entitlement_key,v_order.entitlement_payload,v_order.resource_type,v_order.resource_id)
    on conflict(payment_order_id,entitlement_key) do nothing;
  end if;

  if v_order.resource_type = 'contract_scan' then
    update public.contract_scans
    set user_id=p_user_id, email=v_order.email
    where id=v_order.resource_id and user_id is null;
  end if;

  return true;
end;
$$;

revoke all on function public.complete_product_payment(bigint, uuid) from public, anon, authenticated;
