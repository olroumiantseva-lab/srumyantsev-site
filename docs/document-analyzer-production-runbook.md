# Document Analyzer — production runbook

Release candidate: `document-analyzer-v1.0.0`
Baseline verified in production: 2026-09-02.

## Verified production path

- Robokassa production payment: PASS
- Robokassa callback and signature validation: PASS
- Idempotent credit grant: PASS
- Automatic receipt: PASS
- Receipt transfer to «Мой налог»: PASS
- Passwordless sign-in: PASS
- OpenAI document analysis: PASS
- One-credit debit: PASS
- Result persistence and reopen: PASS

## Safe telemetry

Edge Functions emit JSON logs without document text, email, payment credentials, signatures or OpenAI keys.

Payment events:

- `payment_link_created`
- `payment_link_failed`
- `callback_completed`
- `callback_rejected`
- `callback_failed`

Analysis events already include:

- `request_id`
- `code`
- `duration_ms`
- `error_type`

Use `order_id` to correlate payment creation and callback. Use `request_id` to correlate one analysis attempt.

## Daily checks during the first 10 customers

In Supabase Dashboard:

1. Edge Functions → `create-robokassa-payment`: no repeated `payment_link_failed`.
2. Edge Functions → `robokassa-result`: every paid order has `callback_completed`; investigate any `callback_failed`.
3. Edge Functions → `analyze-document`: investigate `OPENAI_ERROR`, `OPENAI_TIMEOUT`, `INVALID_MODEL_OUTPUT`, `PERSISTENCE_PENDING` or `RECOVERY_REQUIRED`.
4. Table `payment_orders`: no production order remains pending after confirmed payment.
5. Tables `credit_transactions` and `purchases`: one purchase and one credit grant per paid order.
6. OpenAI Platform: confirm normal usage and sufficient prepaid balance.

## Incident rules

- Paid, credits absent: do not ask the customer to pay again. Find the `order_id`, inspect callback logs, then replay only the verified Robokassa callback or grant credits through the production-safe payment RPC.
- Duplicate Robokassa callback: expected; idempotency must keep the balance unchanged.
- Analysis error before a valid model result: retry the same `request_id`; do not manually debit.
- `PERSISTENCE_PENDING`: retry the same request so the staged result can be committed without another OpenAI call.
- Unexpected credit mismatch: pause public promotion until the ledger and affected order are reconciled.

## Release procedure

1. Merge only after reviewing the payment telemetry diff.
2. Deploy `create-robokassa-payment` and `robokassa-result` to production.
3. Run signature tests; no real payment is required for a logging-only release.
4. Confirm one payment-link creation log from a non-payment navigation test.
5. Mark the deployed commit as `document-analyzer-v1.0.0`.
6. Do not change production functions directly; use a branch and PR.
