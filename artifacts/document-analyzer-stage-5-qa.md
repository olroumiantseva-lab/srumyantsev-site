# Этап 5: live smoke-тест `analyze-document`

Дата: 2026-08-25  
Статус: **PASS**

## Результат

В связанном Supabase test project заменён server-side secret `OPENAI_API_KEY` и выполнен ровно один авторизованный live smoke-тест Edge Function `analyze-document`.

- HTTP-статус: `200`;
- request ID: `eefe029c-5625-4aa1-a4e2-c15e4016f71b`;
- модель: `gpt-5.6-terra`;
- OpenAI-вызовов: `1`;
- попыток функции: `1`;
- usage: `484` input tokens, `398` output tokens, `882` total tokens;
- JSON Schema: `PASS`, результат валиден относительно `supabase/functions/_shared/document-result-schema.json`;
- содержательная smoke-проверка: `PASS`;
- расчётная стоимость: `$0.005744` по тарифу `$2` за 1 млн входных и `$12` за 1 млн выходных токенов.

Безопасные метаданные и verdict проверки: [artifacts/analyze-live-smoke.json](./analyze-live-smoke.json). Содержательный ответ модели удалён из артефакта.

## Безопасность

- Для smoke-деплоя retry был временно отключён, поэтому повторный OpenAI-вызов был технически невозможен.
- После теста штатный retry восстановлен, функция повторно развёрнута.
- Найдена ровно одна соответствующая запись в `function_logs` с `code=OK`.
- Application log содержит только `request_id`, `code`, `duration_ms` и `error_type`.
- Секреты авторизации и пользовательское содержимое в отчёт и application log не включались.
- Одноразовый тестовый пользователь удалён после запроса.

## Проверки после восстановления

- `deno test --allow-read --allow-env --config supabase/functions/deno.json supabase/functions/tests/analyze-document.test.ts`: `11 passed`, `0 failed`;
- постоянных изменений runtime-кода после восстановления нет;
- `analyze-document` повторно развёрнут со штатной двухпопытной политикой валидации ответа.

## Вывод

Этап 5 принят: server-side OpenAI secret работает, авторизованный live-вызов успешен, ответ соответствует JSON Schema, usage возвращается, стоимость укладывается в ожидаемый порядок, а application logs соблюдают установленный allowlist.
