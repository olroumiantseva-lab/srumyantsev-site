# План этапа 3: backend, Supabase Auth и база

Статус: in progress; внешний E2E зависит от Supabase runtime/проекта.

## Фаза 1. Supabase schema и security contract

- добавить `supabase/config.toml`;
- создать migration с tables, constraints, indexes, triggers и RLS;
- создать service-only SQL functions для анализа, follow-up, удаления и dev credits;
- добавить pgTAP/security SQL tests.

## Фаза 2. Edge Functions

- общий auth/CORS/error helper без логирования payload;
- `mock-analyze`: validate → mock result → atomic RPC;
- `mock-followup`: validate → mock answer → atomic RPC;
- `delete-document`: ownership-safe soft delete;
- `dev-grant-credits`: non-production + email allowlist + idempotency.

## Фаза 3. Frontend integration

- runtime config только с project URL и publishable key;
- magic-link login, callback/session restore и logout;
- auth guards для app/result/history;
- real balance, create analysis, follow-up, history, open by ID and delete;
- сохранить Stage 2 visual contract и human-readable errors.

## Фаза 4. Verification

- статический secret scan и JS syntax checks;
- SQL lint/test при доступном Supabase runtime;
- browser E2E: magic link, credits, analysis, follow-ups, persistence, deletion, A/B isolation, server failure and zero balance;
- документировать доказательства и честно оставить runtime-dependent gates красными, если проект/локальный stack отсутствует.

## Challenge log

### Решает ли план задачу?

Да: auth, persistence, RLS, credits и mock server покрыты отдельными слоями и проверками. OpenAI/payment/Cloudflare исключены.

### Почему Edge Functions + service-only RPC

- Один client-only Supabase вариант проще, но позволяет подделывать result и усложняет атомарное списание.
- Edge-only последовательные inserts создают риск частичного списания при сбое.
- Выбранный вариант проверяет JWT на edge, а mutation выполняет одной транзакцией Postgres. Service role не покидает сервер.

### Нет ли платформы ради платформы?

Нет универсального product engine, ORM, отдельного API server или payment abstraction. Четыре узкие функции обслуживают один продукт.

## Запрет перехода

Не начинать OpenAI, оплату и production Cloudflare routing без отдельного подтверждения.
