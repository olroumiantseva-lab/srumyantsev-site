# Supabase backend: «Разобрать документ»

## Состав

- `migrations/20260818220000_document_backend.sql` — схема, индексы, RLS и транзакционные RPC;
- `functions/mock-analyze` — авторизованный server mock + атомарное списание;
- `functions/mock-followup` — авторизованное уточнение, максимум три;
- `functions/delete-document` — очистка содержимого и soft-delete;
- `functions/dev-grant-credits` — закрытое тестовое начисление;
- `tests/database/rls_structure.test.sql` — структурные pgTAP-проверки RLS/grants.

## RLS кратко

`auth.users` является источником пользователей; `profiles.id` повторяет Auth UUID. На всех пяти public-таблицах включён RLS.

- `profiles`, `purchases`, `credit_transactions`: пользователь читает только строки с собственным `user_id`/`id`.
- `document_sessions`: пользователь читает только собственные и не удалённые разборы.
- `followup_messages`: чтение разрешено только через принадлежащую пользователю активную `document_session`.
- У `authenticated` нет прямых INSERT/UPDATE/DELETE grants на business-таблицы.
- Все мутации выполняются service-only `SECURITY DEFINER` функциями с пустым `search_path`, явным `p_user_id` из проверенного JWT и ownership-фильтрами.

Service-role key используется только Edge Functions. Frontend получает только project URL и publishable key.

## Атомарность и повтор запросов

`create_mock_document_session` берёт advisory transaction lock на пользователя, повторно считает ledger, проверяет баланс, создаёт session и debit в одной транзакции. `request_id` делает повтор безопасным: возвращается прежний session ID без второго списания.

`add_mock_followup` блокирует session row, проверяет владельца и лимит, затем одной транзакцией пишет user/assistant и увеличивает счётчик. Пара `(session_id, request_id, role)` исключает дубли при retry.

## Удаление

Удаление hard-delete'ит follow-up и очищает `source_text`, `user_context`, `result_json`, `goals` и title. Tombstone с `deleted_at` остаётся для технической целостности; ledger debit сохраняется и не содержит текста.

## Dev credits

Публичной кнопки нет. `dev-grant-credits` работает только если `APP_ENV != production`, JWT email входит в `DEV_CREDIT_EMAIL_ALLOWLIST`, и всегда начисляет фиксированные +10. Уникальный request ID делает начисление идемпотентным.

## Подключение test-проекта

1. Создать отдельный Supabase test project.
2. Применить migration через Supabase CLI `db push`.
3. Развернуть четыре Edge Functions.
4. Установить secrets из `.env.example`; добавить локальный origin в `ALLOWED_ORIGINS`.
5. В Auth URL Configuration добавить локальный `/tools/document/app/` как redirect URL.
6. Заполнить только безопасные значения `tools/assets/runtime-config.js`: URL и publishable key.
7. Запустить `scripts/test-document-backend-e2e.mjs` с test-only secret key в environment, не в файле.

Не использовать production-проект для dev credits или destructive E2E.
