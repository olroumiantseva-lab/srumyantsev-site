alter table public.contract_scans
  add column request_fingerprint text;

create index contract_scans_fingerprint_created_idx
  on public.contract_scans(request_fingerprint, created_at desc)
  where request_fingerprint is not null;
