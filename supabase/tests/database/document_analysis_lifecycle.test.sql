begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select plan(55);

select has_column('public', 'document_sessions', 'payload_hash', 'sessions store payload hash');
select has_column('public', 'document_sessions', 'lease_generation', 'sessions store fencing generation');
select has_column('public', 'document_sessions', 'lease_expires_at', 'sessions store lease expiry');
select has_column('public', 'document_sessions', 'processing_phase', 'sessions store processing phase');
select has_function('public', 'reserve_document_analysis', array['uuid','uuid','text','text','text','text','text[]','text','integer'], 'reserve RPC exists');
select has_function('public', 'mark_document_analysis_inflight', array['uuid','uuid','text','bigint'], 'inflight RPC exists');
select has_function('public', 'stage_document_analysis_result', array['uuid','uuid','text','bigint','jsonb'], 'stage RPC exists');
select has_function('public', 'complete_document_analysis', array['uuid','uuid','text','bigint'], 'complete RPC exists');
select has_function('public', 'abort_document_analysis', array['uuid','uuid','text','bigint'], 'abort RPC exists');
select ok(not has_function_privilege('anon', 'public.reserve_document_analysis(uuid,uuid,text,text,text,text,text[],text,integer)', 'EXECUTE'), 'anon cannot reserve');
select ok(not has_function_privilege('authenticated', 'public.reserve_document_analysis(uuid,uuid,text,text,text,text,text[],text,integer)', 'EXECUTE'), 'authenticated cannot reserve');
select ok(has_function_privilege('service_role', 'public.reserve_document_analysis(uuid,uuid,text,text,text,text,text[],text,integer)', 'EXECUTE'), 'service role can reserve');
select ok(not has_function_privilege('authenticated', 'public.mark_document_analysis_inflight(uuid,uuid,text,bigint)', 'EXECUTE'), 'authenticated cannot mark inflight');
select ok(has_function_privilege('service_role', 'public.mark_document_analysis_inflight(uuid,uuid,text,bigint)', 'EXECUTE'), 'service role can mark inflight');
select ok(not has_function_privilege('authenticated', 'public.stage_document_analysis_result(uuid,uuid,text,bigint,jsonb)', 'EXECUTE'), 'authenticated cannot stage');
select ok(has_function_privilege('service_role', 'public.stage_document_analysis_result(uuid,uuid,text,bigint,jsonb)', 'EXECUTE'), 'service role can stage');
select ok(not has_function_privilege('authenticated', 'public.complete_document_analysis(uuid,uuid,text,bigint)', 'EXECUTE'), 'authenticated cannot complete');
select ok(has_function_privilege('service_role', 'public.complete_document_analysis(uuid,uuid,text,bigint)', 'EXECUTE'), 'service role can complete');
select ok(not has_function_privilege('authenticated', 'public.abort_document_analysis(uuid,uuid,text,bigint)', 'EXECUTE'), 'authenticated cannot abort');
select ok(has_function_privilege('service_role', 'public.abort_document_analysis(uuid,uuid,text,bigint)', 'EXECUTE'), 'service role can abort');
select ok(
  exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'document_analysis_session_debit_uidx'
      and indexdef like '%WHERE (type = ''document_analysis''::text)%'
  ),
  'database enforces one analysis debit per session'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  confirmed_at, created_at, updated_at,
  confirmation_token, email_change, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'authenticated', 'authenticated', 'stage6-db-test@example.com', '',
  now(), now(), now(), '', '', ''
);

select lives_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),'letter','synthetic input','',array['plain'],'Letter',90)$$,
  'first reserve succeeds'
);
select is((select processing_phase from public.document_sessions where request_id='11111111-1111-4111-8111-111111111111'),'reserved','new session is reserved');
select lives_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),'letter','synthetic input','',array['plain'],'Letter',90)$$,
  'same user and request id is idempotent'
);
select is((select count(*)::integer from public.document_sessions where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),1,'idempotent reserve creates no second session');
select throws_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('b',64),'letter','different input','',array['plain'],'Letter',90)$$,
  'P0001','REQUEST_CONFLICT','same request id with another payload conflicts'
);
select lives_ok(
  $$select public.mark_document_analysis_inflight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),1)$$,
  'reserved transitions to inflight'
);
select is((select processing_phase from public.document_sessions where request_id='11111111-1111-4111-8111-111111111111'),'openai_inflight','phase is inflight');
select lives_ok(
  $$select public.stage_document_analysis_result('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),1,'{"summary":"ok"}'::jsonb)$$,
  'inflight result is staged'
);
select lives_ok(
  $$select public.stage_document_analysis_result('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),1,'{"summary":"ok"}'::jsonb)$$,
  'lost stage response can retry idempotently'
);
select is((select processing_phase from public.document_sessions where request_id='11111111-1111-4111-8111-111111111111'),'persistence_pending','phase is persistence pending');
select lives_ok(
  $$select public.complete_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),1)$$,
  'first complete succeeds'
);
select lives_ok(
  $$select public.complete_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','11111111-1111-4111-8111-111111111111',repeat('a',64),1)$$,
  'repeated complete is idempotent'
);
select is((select count(*)::integer from public.credit_transactions where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and type='document_analysis'),1,'repeated complete creates one debit');

insert into public.credit_transactions(user_id,amount,type,reference_id)
values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,'dev_grant','stage6-extra-credit');
select lives_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),'letter','reserved takeover','',array['plain'],'Letter',90)$$,
  'second request reserves credit'
);
update public.document_sessions set lease_expires_at=now()-interval '1 second' where request_id='22222222-2222-4222-8222-222222222222';
select lives_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),'letter','reserved takeover','',array['plain'],'Letter',90)$$,
  'expired reserved lease can be transferred'
);
select is((select lease_generation from public.document_sessions where request_id='22222222-2222-4222-8222-222222222222'),2::bigint,'reserved takeover increments generation');
select throws_ok(
  $$select public.mark_document_analysis_inflight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),1)$$,
  'P0001','STALE_LEASE','stale generation cannot mark inflight'
);
select throws_ok(
  $$select public.stage_document_analysis_result('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),1,'{"summary":"stale"}'::jsonb)$$,
  'P0001','STALE_LEASE','stale generation cannot stage'
);
select throws_ok(
  $$select public.complete_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),1)$$,
  'P0001','STALE_LEASE','stale generation cannot complete'
);
select throws_ok(
  $$select public.abort_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),1)$$,
  'P0001','STALE_LEASE','stale generation cannot abort'
);
select lives_ok(
  $$select public.abort_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','22222222-2222-4222-8222-222222222222',repeat('c',64),2)$$,
  'current generation can abort reserved work'
);
select is(
  (select count(*)::integer from public.credit_transactions ct join public.document_sessions ds on ds.id::text=ct.reference_id where ds.request_id='22222222-2222-4222-8222-222222222222' and ct.type='document_analysis'),
  0,
  'abort creates no debit'
);

select lives_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333',repeat('d',64),'letter','inflight fence','',array['plain'],'Letter',90)$$,
  'third request reserves credit'
);
select lives_ok(
  $$select public.mark_document_analysis_inflight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333',repeat('d',64),1)$$,
  'third request enters inflight'
);
update public.document_sessions set lease_expires_at=now()-interval '1 second' where request_id='33333333-3333-4333-8333-333333333333';
select is(
  (select request_status from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333',repeat('d',64),'letter','inflight fence','',array['plain'],'Letter',90)),
  'recovery_required',
  'expired inflight is never taken over'
);
select is((select lease_generation from public.document_sessions where request_id='33333333-3333-4333-8333-333333333333'),1::bigint,'inflight generation remains fenced');
select lives_ok(
  $$select public.abort_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333',repeat('d',64),1)$$,
  'explicit current-generation abort releases inflight work'
);

select lives_ok(
  $$select * from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',repeat('e',64),'letter','persistence recovery','',array['plain'],'Letter',90)$$,
  'fourth request reserves credit'
);
select lives_ok(
  $$select public.mark_document_analysis_inflight('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',repeat('e',64),1)$$,
  'fourth request enters inflight'
);
select lives_ok(
  $$select public.stage_document_analysis_result('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',repeat('e',64),1,'{"summary":"saved"}'::jsonb)$$,
  'fourth result is staged'
);
update public.document_sessions set lease_expires_at=now()-interval '1 second' where request_id='44444444-4444-4444-8444-444444444444';
select is(
  (select request_status from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',repeat('e',64),'letter','persistence recovery','',array['plain'],'Letter',90)),
  'persistence_pending',
  'expired persistence pending only requests completion'
);
select lives_ok(
  $$select public.complete_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',repeat('e',64),1)$$,
  'persistence pending completes without OpenAI'
);
select is((select count(*)::integer from public.credit_transactions where user_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and type='document_analysis'),2,'two completed sessions have exactly two debits');
select is(
  (select request_status from public.reserve_document_analysis('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','44444444-4444-4444-8444-444444444444',repeat('e',64),'letter','persistence recovery','',array['plain'],'Letter',90)),
  'completed',
  'completed request is returned without new work'
);

select * from finish();
rollback;
