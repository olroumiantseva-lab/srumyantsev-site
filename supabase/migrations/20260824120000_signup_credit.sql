alter table public.credit_transactions
drop constraint credit_transactions_type_check;

alter table public.credit_transactions
add constraint credit_transactions_type_check
check (type in ('purchase', 'document_analysis', 'signup_grant', 'dev_grant', 'refund', 'adjustment'));

create or replace function public.grant_initial_analysis(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.credit_transactions (user_id, amount, type, reference_id)
  values (p_user_id, 1, 'signup_grant', 'initial-analysis-v1')
  on conflict (user_id, type, reference_id) do nothing;
$$;

revoke all on function public.grant_initial_analysis(uuid) from public, anon, authenticated, service_role;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set email = excluded.email, updated_at = now();

  perform public.grant_initial_analysis(new.id);
  return new;
end;
$$;

insert into public.credit_transactions (user_id, amount, type, reference_id)
select p.id, 1, 'signup_grant', 'initial-analysis-v1'
from public.profiles p
on conflict (user_id, type, reference_id) do nothing;
