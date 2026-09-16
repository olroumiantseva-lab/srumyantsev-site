# Product 3 — AI Helper regression matrix

Date: 2026-09-16
Product: `ai_helper_1490`

## Quality gate

15 final-generation cases: 3 per scenario.

Scenarios:
- letters: ordinary client follow-up, conflict/ambiguity, bank/legal high-stakes correspondence;
- documents: contract fragment, unsupported payment demand, medical document terminology;
- content: practical AI post, product post without false promises, personal-style editing;
- meetings: meeting summary, diagnostic-question preparation, incomplete negotiation notes;
- notes: business ideas, travel notes with missing dates, technical notes separating documentation from hypothesis.

Automatic checks per final case:
1. master instruction is substantial, not a tiny template;
2. explicit personalization from user role/restrictions;
3. exactly 3 distinct starter requests;
4. at least 3 verification rules;
5. no invented autonomous access/actions;
6. quality checklist has at least 4 items.

Result: **15/15 cases passed, each 6/6.**

## Test-run gate

One live test prompt was run for each of the five scenarios through the same test-generation instructions used by the product:
- letters — follow-up after consultation;
- documents — payment terms from a contract fragment;
- content — Telegram post from one factual thesis;
- meetings — meeting notes with an unconfirmed launch date;
- notes — unordered business ideas.

Result: **5/5 passed.** No case claimed autonomous actions or invented access to external systems.

Observed behavior was aligned with the configured constraints. Examples included:
- unconfirmed meeting date explicitly marked as requiring confirmation;
- contract amount treated as unknown when only percentage was given;
- business ideas kept separate from actual decisions;
- content generation stayed within supplied facts;
- client email did not invent commitments beyond the notes.

## Technical gate before real payment

Verified in production Supabase:
- `ai_helper_1490` exists, active, amount `149000`, source `ded`, entitlement `session_unlock`;
- RLS enabled on `ai_helper_sessions` and `ai_helper_access_tokens`;
- malformed secure-result URL returns HTTP 400;
- malformed generate access returns HTTP 400;
- malformed Robokassa success callback returns HTTP 400;
- temporary regression runner was protected by a one-off QA key and is disabled after the run.

## Gate status

Quality gate: PASS
Test-run gate: PASS
Negative-access gate: PASS
Real payment / real secure-session E2E: NOT YET RUN — next step.
