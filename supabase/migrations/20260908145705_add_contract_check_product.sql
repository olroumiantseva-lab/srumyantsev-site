insert into public.products (
  id,
  name,
  receipt_name,
  amount_kopecks,
  currency,
  allowed_source_sites,
  entitlement_type,
  entitlement_payload,
  active
) values (
  'contract_check_490',
  'Проверка договора перед подписанием',
  'Проверка договора перед подписанием',
  49000,
  'RUB',
  array['proverjdo'],
  'session_unlock',
  '{"key":"contract_check_full","scenario":"contract_check"}'::jsonb,
  true
)
on conflict (id) do update set
  name = excluded.name,
  receipt_name = excluded.receipt_name,
  amount_kopecks = excluded.amount_kopecks,
  currency = excluded.currency,
  allowed_source_sites = excluded.allowed_source_sites,
  entitlement_type = excluded.entitlement_type,
  entitlement_payload = excluded.entitlement_payload,
  active = excluded.active,
  updated_at = now();
