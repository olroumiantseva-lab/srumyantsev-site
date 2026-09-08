# Proverjdo production debugging

2026-09-08: fixed shared Supabase admin-key lookup so production Edge Functions can fall back to the platform-provided `SUPABASE_SERVICE_ROLE_KEY` when a separate `SUPABASE_SECRET_KEY(S)` is not configured.

Affected functions redeployed after the fix:
- contract-scan v2
- create-payment v4
- robokassa-result v6
- contract-result v2
