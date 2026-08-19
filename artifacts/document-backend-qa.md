# QA этапа 3: Supabase backend

Дата: 2026-08-19
Статус: **ОКОНЧАТЕЛЬНО ЗАКРЫТ — deployment и полный remote E2E завершены на отдельном Supabase test project.**

## Финальная проверка конфигурации

После исправления `.env.local` выполнен один read-only запрос к Supabase Management API без вывода секретов:

```text
UrlMatchesLinkedProject : True
PublishableKeyMatches   : True
SecretKeyMatches        : True
```

URL и оба ключа соответствуют linked test project. Этап 3 окончательно закрыт; к этапу 4 переход не выполнялся.

## Deployment test-контура

- Supabase CLI связан с проектом `document-analyzer-test`.
- Migration `20260818220000_document_backend.sql` применена; local и remote версии совпадают.
- Auth site URL и redirect URLs применены, включая `http://127.0.0.1:4175/tools/document/app/` для E2E.
- Test-only настройки Edge Functions применены: `APP_ENV=test` и локальный allowed origin.
- `mock-analyze`, `mock-followup`, `delete-document` и `dev-grant-credits` развёрнуты со статусом `ACTIVE` и `verify_jwt=true`.
- OpenAI, оплата и Cloudflare production routing не подключались.

## Результат полного remote E2E

```text
PASS: magic link, analysis/debit, 3 follow-ups, persistence, delete, A/B RLS, server error and zero balance
E2E exit code: 0
```

Сценарий создал временных пользователей A/B/C, начислил A и B по 10 тестовых кредитов и удалил пользователей в `finally`.

## Пройдено локально

### Edge Functions type check

```text
deno check --config supabase/functions/deno.json ...
Check mock-analyze/index.ts
Check mock-followup/index.ts
Check delete-document/index.ts
Check dev-grant-credits/index.ts
```

### Frontend syntax

```text
node --check tools/assets/document.js
node --check tools/assets/supabase-app.js
node --check scripts/test-document-backend-e2e.mjs
```

Все команды завершились с exit code 0.

### Browser regression

```text
PASS: 5 routes × mobile/desktop, no overflow/external requests/console errors; mock flow, validation, 3 follow-ups and delete verified
```

При пустом runtime config прототип сохраняет локальный fallback и не делает внешних запросов.

### Secret/log scan

```text
PASS: no service-role key identifiers in frontend
PASS: Edge Functions contain no payload logging
```

`git diff --check` завершился без ошибок.

## Покрытие remote E2E

`scripts/test-document-backend-e2e.mjs` успешно проверил на отдельном test project:

1. вход A по magic link;
2. создание разбора и баланс 10 → 9;
3. три уточнения и блокировку четвёртого;
4. logout и восстановление истории повторным magic link;
5. запрет B читать session A через RLS и URL;
6. отсутствие debit при принудительной server mock error;
7. запрет анализа при нулевом балансе;
8. удаление, redaction source/context/result и hard-delete follow-up;
9. понятное состояние истёкшей/некорректной ссылки;
10. удаление созданных E2E test users после прогона.

## Исправления E2E до PASS

В `scripts/test-document-backend-e2e.mjs` устранены гонки асинхронного браузерного сценария: добавлены readiness-gates после magic login, ожидание баланса и каждого follow-up, ожидание history/safe-not-found, ожидание удаления конкретной session-card и отдельная неавторизованная вкладка для expired-link проверки. Backend-схема и бизнес-логика не изменялись.

`.env.local` игнорируется Git и не добавлен в индекс.
