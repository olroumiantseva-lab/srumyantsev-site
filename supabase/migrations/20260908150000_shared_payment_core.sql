create table public.products (
  id text primary key,
  name text not null,
  receipt_name text not null,
  amount_kopecks integer not null check (amount_kopecks > 0),
  currency text not null default 'RUB' check (currency = 'RUB'),
  allowed_source_sites text[] not null default array[]::text[],
  entitlement_type text not null check (entitlement_type in ('credits', 'feature_access', 'session_unlock')),
  entitlement_payload jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_id_format check (id ~ '^[a-z0-9][a-z0-9_-]{2,79}$'),
  constraint products_source_sites_nonempty check (cardinality(allowed_source_sites) > 0)
);

create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

alter table public.products enable row level security;
revoke all on public.products from public, anon, authenticated;

insert into public.products (
  id, name, receipt_name, amount_kopecks, allowed_source_sites, entitlement_type, entitlement_payload
) values (
  'document_explain_290',
  'Разбор документов — 10 разборов',
  'Доступ к сервису разбора документов — 10 разборов',
  29000,
  array['ded'],
  'credits',
  '{"credits":10}'::jsonb
);

alter table public.payment_orders
  drop constraint if exists payment_orders_amount_kopecks_check,
  drop constraint if exists payment_orders_credits_check;

alter table public.payment_orders
  add column product_id text references public.products(id) on delete restrict,
  add column source_site text,
  add constraint payment_orders_amount_positive check (amount_kopecks > 0),
  add constraint payment_orders_credits_nonnegative check (credits >= 0),
  add constraint payment_orders_source_site_format check (source_site is null or source_site ~ '^[a-z0-9][a-z0-9_-]{1,39}$');

update public.payment_orders
set product_id = 'document_explain_290', source_site = 'ded'
where product_id is null;

alter table public.payment_orders
  alter column product_id set default 'document_explain_290',
  alter column product_id set not null,
  alter column source_site set default 'ded',
  alter column source_site set not null;

-- Keep the legacy credits default of 10 until the old create-robokassa-payment
-- endpoint is retired. New create-payment always stores an explicit snapshot.

create index payment_orders_product_created_idx on public.payment_orders(product_id, created_at desc);
create index payment_orders_source_created_idx on public.payment_orders(source_site, created_at desc);

-- Purchases must also be able to record products whose entitlement is not credits.
alter table public.purchases drop constraint if exists purchases_credits_added_check;
alter table public.purchases add constraint purchases_credits_added_check check (credits_added >= 0);

create table public.entitlements (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  payment_order_id bigint not null references public.payment_orders(id) on delete restrict,
  entitlement_type text not null check (entitlement_type in ('feature_access', 'session_unlock')),
  entitlement_key text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'consumed', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entitlements_key_length check (char_length(entitlement_key) between 1 and 120),
  constraint entitlements_payment_key_unique unique(payment_order_id, entitlement_key)
);

create index entitlements_user_status_idx on public.entitlements(user_id, status, created_at desc);

create trigger entitlements_set_updated_at before update on public.entitlements
for each row execute function public.set_updated_at();

alter table public.entitlements enable row level security;
revoke all on public.entitlements from public, anon, authenticated;

create or replace function public.complete_product_payment(p_order_id bigint, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.payment_orders%rowtype;
  v_product public.products%rowtype;
  v_credits integer;
  v_entitlement_key text;
begin
  select po.* into v_order
  from public.payment_orders po
  where po.id = p_order_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'succeeded' then
    if v_order.user_id <> p_user_id then
      raise exception using errcode = 'P0001', message = 'ORDER_USER_CONFLICT';
    end if;
    return false;
  end if;

  if v_order.status not in ('pending', 'expired') then
    raise exception using errcode = 'P0001', message = 'ORDER_NOT_PAYABLE';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;

  select p.* into v_product
  from public.products p
  where p.id = v_order.product_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'PRODUCT_NOT_FOUND';
  end if;

  update public.payment_orders
  set status = 'succeeded', user_id = p_user_id, paid_at = now()
  where id = p_order_id;

  if v_product.entitlement_type = 'credits' then
    v_credits := coalesce((v_product.entitlement_payload->>'credits')::integer, v_order.credits, 0);
    if v_credits <= 0 then
      raise exception using errcode = 'P0001', message = 'INVALID_CREDIT_ENTITLEMENT';
    end if;
  else
    v_credits := 0;
  end if;

  insert into public.purchases(
    user_id, provider, provider_payment_id, amount, currency, product_id, credits_added, status
  ) values (
    p_user_id,
    'robokassa',
    p_order_id::text,
    v_order.amount_kopecks,
    'RUB',
    v_order.product_id,
    v_credits,
    'succeeded'
  )
  on conflict(provider, provider_payment_id) do nothing;

  if v_product.entitlement_type = 'credits' then
    insert into public.credit_transactions(user_id, amount, type, reference_id)
    values(p_user_id, v_credits, 'purchase', 'robokassa:' || p_order_id::text)
    on conflict(user_id, type, reference_id) do nothing;
  else
    v_entitlement_key := coalesce(
      nullif(v_product.entitlement_payload->>'key', ''),
      v_order.product_id
    );

    insert into public.entitlements(
      user_id, product_id, payment_order_id, entitlement_type, entitlement_key, payload
    ) values (
      p_user_id,
      v_order.product_id,
      p_order_id,
      v_product.entitlement_type,
      v_entitlement_key,
      v_product.entitlement_payload
    )
    on conflict(payment_order_id, entitlement_key) do nothing;
  end if;

  return true;
end;
$$;

revoke all on function public.complete_product_payment(bigint, uuid) from public, anon, authenticated;

-- Compatibility wrapper: the currently deployed Robokassa callback can continue to
-- call the old RPC name during the rollout.
create or replace function public.complete_robokassa_payment(p_order_id bigint, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select public.complete_product_payment(p_order_id, p_user_id);
$$;

revoke all on function public.complete_robokassa_payment(bigint, uuid) from public, anon, authenticated;
