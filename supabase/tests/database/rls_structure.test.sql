begin;
select plan(12);

select ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.purchases'::regclass), 'purchases RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.credit_transactions'::regclass), 'credit_transactions RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.document_sessions'::regclass), 'document_sessions RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.followup_messages'::regclass), 'followup_messages RLS enabled');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'profiles'), 1, 'profiles has one policy');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'purchases'), 1, 'purchases has one policy');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'credit_transactions'), 1, 'credits has one policy');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'document_sessions'), 1, 'sessions has one policy');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'followup_messages'), 1, 'followups has one policy');
select ok(not has_table_privilege('authenticated', 'public.document_sessions', 'INSERT'), 'authenticated cannot insert sessions directly');
select ok(not has_function_privilege('authenticated', 'public.dev_grant_credits(uuid,integer,text)', 'EXECUTE'), 'authenticated cannot call dev grant RPC');

select * from finish();
rollback;
