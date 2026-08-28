create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_length check (char_length(email) between 3 and 320)
);

create unique index profiles_email_lower_uidx on public.profiles (lower(email));

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null,
  amount integer not null check (amount > 0),
  currency text not null default 'RUB' check (currency ~ '^[A-Z]{3}$'),
  product_id text not null,
  credits_added integer not null check (credits_added > 0),
  status text not null check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  created_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create index purchases_user_created_idx on public.purchases (user_id, created_at desc);

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount integer not null check (amount <> 0),
  type text not null check (type in ('purchase', 'document_analysis', 'dev_grant', 'refund', 'adjustment')),
  reference_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, type, reference_id)
);

create index credit_transactions_user_created_idx on public.credit_transactions (user_id, created_at desc);

create table public.document_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  request_id uuid not null,
  title text not null,
  document_type text not null,
  goals text[] not null default '{}',
  source_text text,
  user_context text,
  result_json jsonb,
  status text not null default 'completed' check (status in ('completed', 'failed', 'deleted')),
  followups_used smallint not null default 0 check (followups_used between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint document_sessions_title_length check (char_length(title) between 1 and 120),
  constraint document_sessions_type_length check (char_length(document_type) between 1 and 80),
  constraint document_sessions_source_length check (source_text is null or char_length(source_text) between 1 and 30000),
  constraint document_sessions_context_length check (user_context is null or char_length(user_context) <= 1000),
  constraint document_sessions_deleted_content check (
    deleted_at is null or (source_text is null and user_context is null and result_json is null and status = 'deleted')
  ),
  unique (user_id, request_id)
);

create index document_sessions_user_created_idx on public.document_sessions (user_id, created_at desc) where deleted_at is null;

create table public.followup_messages (
  id uuid primary key default gen_random_uuid(),
  document_session_id uuid not null references public.document_sessions(id) on delete cascade,
  request_id uuid not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now(),
  constraint followup_messages_content_length check (char_length(content) between 1 and 4000)
);

create index followup_messages_session_created_idx on public.followup_messages (document_session_id, created_at, id);
create unique index followup_messages_request_role_uidx on public.followup_messages (document_session_id, request_id, role);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create trigger document_sessions_set_updated_at before update on public.document_sessions
for each row execute function public.set_updated_at();

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
  return new;
end;
$$;

create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.profiles enable row level security;
alter table public.purchases enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.document_sessions enable row level security;
alter table public.followup_messages enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated using ((select auth.uid()) = id);

create policy purchases_select_own on public.purchases
for select to authenticated using ((select auth.uid()) = user_id);

create policy credit_transactions_select_own on public.credit_transactions
for select to authenticated using ((select auth.uid()) = user_id);

create policy document_sessions_select_own_active on public.document_sessions
for select to authenticated using ((select auth.uid()) = user_id and deleted_at is null);

create policy followup_messages_select_own_active on public.followup_messages
for select to authenticated using (
  exists (
    select 1 from public.document_sessions ds
    where ds.id = followup_messages.document_session_id
      and ds.user_id = (select auth.uid())
      and ds.deleted_at is null
  )
);

revoke all on public.profiles, public.purchases, public.credit_transactions, public.document_sessions, public.followup_messages from anon, authenticated;
grant select on public.profiles, public.purchases, public.credit_transactions, public.document_sessions, public.followup_messages to authenticated;

create or replace function public.get_my_credit_balance()
returns integer
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(ct.amount), 0)::integer
  from public.credit_transactions ct
  where ct.user_id = (select auth.uid());
$$;

revoke all on function public.get_my_credit_balance() from public, anon;
grant execute on function public.get_my_credit_balance() to authenticated;

create or replace function public.create_mock_document_session(
  p_user_id uuid,
  p_request_id uuid,
  p_document_type text,
  p_source_text text,
  p_user_context text,
  p_goals text[],
  p_result jsonb,
  p_title text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_session_id uuid;
begin
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;
  if p_source_text is null or char_length(btrim(p_source_text)) = 0 or char_length(p_source_text) > 30000 then
    raise exception using errcode = '22023', message = 'INVALID_DOCUMENT';
  end if;
  if p_user_context is not null and char_length(p_user_context) > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_CONTEXT';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  select id into v_session_id
  from public.document_sessions
  where user_id = p_user_id and request_id = p_request_id;
  if found then
    return v_session_id;
  end if;
  select coalesce(sum(amount), 0)::integer into v_balance
  from public.credit_transactions where user_id = p_user_id;
  if v_balance < 1 then
    raise exception using errcode = 'P0001', message = 'NO_CREDITS';
  end if;

  insert into public.document_sessions (
    user_id, request_id, title, document_type, goals, source_text, user_context, result_json, status
  ) values (
    p_user_id, p_request_id, p_title, p_document_type, coalesce(p_goals, '{}'), p_source_text,
    nullif(p_user_context, ''), p_result, 'completed'
  ) returning id into v_session_id;

  insert into public.credit_transactions (user_id, amount, type, reference_id)
  values (p_user_id, -1, 'document_analysis', v_session_id::text);

  return v_session_id;
end;
$$;

create or replace function public.add_mock_followup(
  p_user_id uuid,
  p_session_id uuid,
  p_request_id uuid,
  p_question text,
  p_answer text
)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used smallint;
begin
  select followups_used into v_used
  from public.document_sessions
  where id = p_session_id and user_id = p_user_id and deleted_at is null
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'SESSION_NOT_FOUND';
  end if;
  if exists (
    select 1 from public.followup_messages
    where document_session_id = p_session_id and request_id = p_request_id and role = 'assistant'
  ) then
    return v_used;
  end if;
  if v_used >= 3 then
    raise exception using errcode = 'P0001', message = 'FOLLOWUP_LIMIT';
  end if;
  if p_question is null or char_length(btrim(p_question)) = 0 or char_length(p_question) > 2000 then
    raise exception using errcode = '22023', message = 'INVALID_QUESTION';
  end if;

  insert into public.followup_messages (document_session_id, request_id, role, content)
  values (p_session_id, p_request_id, 'user', p_question), (p_session_id, p_request_id, 'assistant', p_answer);
  update public.document_sessions
  set followups_used = followups_used + 1
  where id = p_session_id
  returning followups_used into v_used;
  return v_used;
end;
$$;

create or replace function public.soft_delete_document_session(p_user_id uuid, p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.followup_messages fm
  using public.document_sessions ds
  where fm.document_session_id = ds.id and ds.id = p_session_id and ds.user_id = p_user_id;

  update public.document_sessions
  set source_text = null, user_context = null, result_json = null, goals = '{}',
      title = 'Удалённый разбор', status = 'deleted', deleted_at = now()
  where id = p_session_id and user_id = p_user_id and deleted_at is null;
  return found;
end;
$$;

create or replace function public.dev_grant_credits(
  p_user_id uuid,
  p_amount integer,
  p_reference_id text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if p_amount < 1 or p_amount > 100 or char_length(p_reference_id) not between 1 and 120 then
    raise exception using errcode = '22023', message = 'INVALID_DEV_GRANT';
  end if;
  insert into public.credit_transactions (user_id, amount, type, reference_id)
  values (p_user_id, p_amount, 'dev_grant', p_reference_id)
  on conflict (user_id, type, reference_id) do nothing;
  select coalesce(sum(amount), 0)::integer into v_balance
  from public.credit_transactions where user_id = p_user_id;
  return v_balance;
end;
$$;

revoke all on function public.create_mock_document_session(uuid, uuid, text, text, text, text[], jsonb, text) from public, anon, authenticated;
revoke all on function public.add_mock_followup(uuid, uuid, uuid, text, text) from public, anon, authenticated;
revoke all on function public.soft_delete_document_session(uuid, uuid) from public, anon, authenticated;
revoke all on function public.dev_grant_credits(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.create_mock_document_session(uuid, uuid, text, text, text, text[], jsonb, text) to service_role;
grant execute on function public.add_mock_followup(uuid, uuid, uuid, text, text) to service_role;
grant execute on function public.soft_delete_document_session(uuid, uuid) to service_role;
grant execute on function public.dev_grant_credits(uuid, integer, text) to service_role;

revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
