-- Stage 6 expands document_sessions without rewriting existing rows.
-- Existing completed/failed/deleted rows keep payload_hash = null and lease_generation = 0.
--
-- Safe rollback (manual, after rolling all writers back to mock-analyze):
-- 1. Verify no row has status = 'processing'. Do not roll back while one exists.
-- 2. Drop the five lifecycle RPCs and document_analysis_session_debit_uidx.
-- 3. Restore the previous SELECT policy and status check.
-- 4. Drop payload_hash, lease_generation, lease_expires_at and processing_phase.
-- Completed sessions and ledger rows are otherwise unchanged. A rollback cannot preserve
-- in-flight work, which is why the zero-processing precondition is mandatory.

alter table public.document_sessions
  add column payload_hash text,
  add column lease_generation bigint not null default 0,
  add column lease_expires_at timestamptz,
  add column processing_phase text;

alter table public.document_sessions
  drop constraint document_sessions_status_check,
  add constraint document_sessions_status_check
    check (status in ('processing', 'completed', 'failed', 'deleted')),
  add constraint document_sessions_payload_hash_format
    check (payload_hash is null or payload_hash ~ '^[0-9a-f]{64}$'),
  add constraint document_sessions_lease_shape check (
    (
      status = 'processing'
      and payload_hash is not null
      and lease_generation > 0
      and lease_expires_at is not null
      and processing_phase in ('reserved', 'openai_inflight', 'persistence_pending')
    )
    or status <> 'processing'
  );

drop policy document_sessions_select_own_active on public.document_sessions;
create policy document_sessions_select_own_completed on public.document_sessions
for select to authenticated using (
  (select auth.uid()) = user_id
  and status = 'completed'
  and deleted_at is null
);

create unique index document_analysis_session_debit_uidx
on public.credit_transactions (reference_id)
where type = 'document_analysis';

create or replace function public.reserve_document_analysis(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text,
  p_document_type text,
  p_source_text text,
  p_user_context text,
  p_goals text[],
  p_title text,
  p_lease_seconds integer default 90
)
returns table(session_id uuid, request_status text, lease_generation bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.document_sessions%rowtype;
  v_balance integer;
  v_reserved integer;
  v_session_id uuid;
  v_generation bigint;
begin
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'USER_NOT_FOUND';
  end if;
  if p_payload_hash is null or p_payload_hash !~ '^[0-9a-f]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_PAYLOAD_HASH';
  end if;
  if p_source_text is null or char_length(btrim(p_source_text)) = 0 or char_length(p_source_text) > 30000 then
    raise exception using errcode = '22023', message = 'INVALID_DOCUMENT';
  end if;
  if p_user_context is not null and char_length(p_user_context) > 1000 then
    raise exception using errcode = '22023', message = 'INVALID_CONTEXT';
  end if;
  if p_lease_seconds < 60 or p_lease_seconds > 300 then
    raise exception using errcode = '22023', message = 'INVALID_LEASE';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select ds.* into v_session
  from public.document_sessions ds
  where ds.user_id = p_user_id and ds.request_id = p_request_id
  for update;

  if found then
    if v_session.payload_hash is distinct from p_payload_hash then
      raise exception using errcode = 'P0001', message = 'REQUEST_CONFLICT';
    end if;
    if v_session.status = 'completed' then
      return query select v_session.id, 'completed'::text, v_session.lease_generation;
      return;
    end if;
    if v_session.status = 'processing' then
      if v_session.processing_phase = 'persistence_pending' then
        return query select v_session.id, 'persistence_pending'::text, v_session.lease_generation;
        return;
      end if;
      if v_session.processing_phase = 'openai_inflight' then
        return query select v_session.id, 'recovery_required'::text, v_session.lease_generation;
        return;
      end if;
      if v_session.processing_phase = 'reserved' and v_session.lease_expires_at > now() then
        return query select v_session.id, 'reserved'::text, v_session.lease_generation;
        return;
      end if;
    end if;
  end if;

  select coalesce(sum(ct.amount), 0)::integer into v_balance
  from public.credit_transactions ct
  where ct.user_id = p_user_id;

  select count(*)::integer into v_reserved
  from public.document_sessions ds
  where ds.user_id = p_user_id
    and ds.status = 'processing'
    and (
      (ds.processing_phase = 'reserved' and ds.lease_expires_at > now())
      or ds.processing_phase in ('openai_inflight', 'persistence_pending')
    )
    and (v_session.id is null or ds.id <> v_session.id);

  if v_balance - v_reserved < 1 then
    raise exception using errcode = 'P0001', message = 'NO_CREDITS';
  end if;

  if v_session.id is null then
    insert into public.document_sessions (
      user_id, request_id, payload_hash, lease_generation, lease_expires_at,
      processing_phase, title, document_type, goals, source_text, user_context, result_json, status
    ) values (
      p_user_id, p_request_id, p_payload_hash, 1, now() + make_interval(secs => p_lease_seconds),
      'reserved', p_title, p_document_type, coalesce(p_goals, '{}'), p_source_text,
      nullif(p_user_context, ''), null, 'processing'
    ) returning id, document_sessions.lease_generation into v_session_id, v_generation;
  else
    update public.document_sessions ds
    set status = 'processing',
        lease_generation = ds.lease_generation + 1,
        lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        processing_phase = 'reserved',
        source_text = p_source_text,
        user_context = nullif(p_user_context, ''),
        goals = coalesce(p_goals, '{}'),
        result_json = null,
        deleted_at = null
    where ds.id = v_session.id
    returning ds.id, ds.lease_generation into v_session_id, v_generation;
  end if;

  return query select v_session_id, 'acquired'::text, v_generation;
end;
$$;

create or replace function public.mark_document_analysis_inflight(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text,
  p_lease_generation bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.document_sessions%rowtype;
begin
  select ds.* into v_session
  from public.document_sessions ds
  where ds.user_id = p_user_id and ds.request_id = p_request_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'SESSION_NOT_FOUND';
  end if;
  if v_session.payload_hash is distinct from p_payload_hash then
    raise exception using errcode = 'P0001', message = 'REQUEST_CONFLICT';
  end if;
  if v_session.lease_generation <> p_lease_generation then
    raise exception using errcode = 'P0001', message = 'STALE_LEASE';
  end if;
  if v_session.status <> 'processing' then
    raise exception using errcode = 'P0001', message = 'INVALID_ANALYSIS_STATE';
  end if;
  if v_session.processing_phase = 'openai_inflight' then
    return true;
  end if;
  if v_session.processing_phase <> 'reserved' or v_session.lease_expires_at <= now() then
    raise exception using errcode = 'P0001', message = 'INVALID_ANALYSIS_STATE';
  end if;
  update public.document_sessions
  set processing_phase = 'openai_inflight'
  where id = v_session.id;
  return true;
end;
$$;

create or replace function public.stage_document_analysis_result(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text,
  p_lease_generation bigint,
  p_result jsonb
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.document_sessions%rowtype;
begin
  select ds.* into v_session
  from public.document_sessions ds
  where ds.user_id = p_user_id and ds.request_id = p_request_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'SESSION_NOT_FOUND';
  end if;
  if v_session.payload_hash is distinct from p_payload_hash then
    raise exception using errcode = 'P0001', message = 'REQUEST_CONFLICT';
  end if;
  if v_session.lease_generation <> p_lease_generation then
    raise exception using errcode = 'P0001', message = 'STALE_LEASE';
  end if;
  if p_result is null or jsonb_typeof(p_result) <> 'object' then
    raise exception using errcode = '22023', message = 'INVALID_RESULT';
  end if;
  if v_session.status = 'processing' and v_session.processing_phase = 'persistence_pending' then
    if v_session.result_json = p_result then
      return true;
    end if;
    raise exception using errcode = 'P0001', message = 'RESULT_CONFLICT';
  end if;
  if v_session.status <> 'processing' or v_session.processing_phase <> 'openai_inflight' then
    raise exception using errcode = 'P0001', message = 'INVALID_ANALYSIS_STATE';
  end if;
  update public.document_sessions
  set processing_phase = 'persistence_pending', result_json = p_result
  where id = v_session.id;
  return true;
end;
$$;

create or replace function public.complete_document_analysis(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text,
  p_lease_generation bigint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.document_sessions%rowtype;
begin
  select ds.* into v_session
  from public.document_sessions ds
  where ds.user_id = p_user_id and ds.request_id = p_request_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'SESSION_NOT_FOUND';
  end if;
  if v_session.payload_hash is distinct from p_payload_hash then
    raise exception using errcode = 'P0001', message = 'REQUEST_CONFLICT';
  end if;
  if v_session.lease_generation <> p_lease_generation then
    raise exception using errcode = 'P0001', message = 'STALE_LEASE';
  end if;
  if v_session.status = 'completed' then
    return v_session.id;
  end if;
  if v_session.status <> 'processing' or v_session.processing_phase <> 'persistence_pending' then
    raise exception using errcode = 'P0001', message = 'INVALID_ANALYSIS_STATE';
  end if;

  update public.document_sessions
  set status = 'completed',
      lease_expires_at = null,
      processing_phase = null
  where id = v_session.id;

  insert into public.credit_transactions (user_id, amount, type, reference_id)
  values (p_user_id, -1, 'document_analysis', v_session.id::text)
  on conflict (user_id, type, reference_id) do nothing;

  return v_session.id;
end;
$$;

create or replace function public.abort_document_analysis(
  p_user_id uuid,
  p_request_id uuid,
  p_payload_hash text,
  p_lease_generation bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.document_sessions%rowtype;
begin
  select ds.* into v_session
  from public.document_sessions ds
  where ds.user_id = p_user_id and ds.request_id = p_request_id
  for update;
  if not found then
    return false;
  end if;
  if v_session.payload_hash is distinct from p_payload_hash then
    raise exception using errcode = 'P0001', message = 'REQUEST_CONFLICT';
  end if;
  if v_session.lease_generation <> p_lease_generation then
    raise exception using errcode = 'P0001', message = 'STALE_LEASE';
  end if;
  if v_session.status = 'completed' then
    return false;
  end if;
  if v_session.status <> 'processing' then
    return false;
  end if;

  update public.document_sessions
  set status = 'failed',
      source_text = null,
      user_context = null,
      goals = '{}',
      result_json = null,
      lease_expires_at = null,
      processing_phase = null
  where id = v_session.id;
  return true;
end;
$$;

revoke all on function public.reserve_document_analysis(uuid, uuid, text, text, text, text, text[], text, integer) from public, anon, authenticated;
revoke all on function public.mark_document_analysis_inflight(uuid, uuid, text, bigint) from public, anon, authenticated;
revoke all on function public.stage_document_analysis_result(uuid, uuid, text, bigint, jsonb) from public, anon, authenticated;
revoke all on function public.complete_document_analysis(uuid, uuid, text, bigint) from public, anon, authenticated;
revoke all on function public.abort_document_analysis(uuid, uuid, text, bigint) from public, anon, authenticated;
grant execute on function public.reserve_document_analysis(uuid, uuid, text, text, text, text, text[], text, integer) to service_role;
grant execute on function public.mark_document_analysis_inflight(uuid, uuid, text, bigint) to service_role;
grant execute on function public.stage_document_analysis_result(uuid, uuid, text, bigint, jsonb) to service_role;
grant execute on function public.complete_document_analysis(uuid, uuid, text, bigint) to service_role;
grant execute on function public.abort_document_analysis(uuid, uuid, text, bigint) to service_role;
