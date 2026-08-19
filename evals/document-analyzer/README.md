# Evaluation set: «Разобрать документ»

Набор из 22 полностью синтетических русскоязычных документов для этапа 4. Реальные имена, адреса, телефоны, номера счетов, полисов и договоров не используются.

## Структура

- `cases/*.json` — эталонные факты и запреты для каждого кейса;
- `fixtures/*.txt` — исходные синтетические документы;
- `result.schema.json` — Structured Outputs schema результата анализатора;
- `evaluation.schema.json` — формат семантических verdicts;
- `evaluate-result.mjs` — детерминированный scorer с hard-fail правилами;
- `audit-evals.mjs` — финальный статический regression-аудит без API;
- `validate-evals.mjs` — локальная проверка целостности набора, без сети;
- `run-evals.mjs` — будущий последовательный запуск всех кейсов через одну модель;
- `results/` — результаты запусков; в Git хранится только `.gitkeep`.

## Категории

| Тип | Кейсов |
|---|---:|
| `letter` — официальное письмо | 3 |
| `contract` — договор | 3 |
| `bill` — счёт или квитанция | 3 |
| `notice` — уведомление | 3 |
| `instruction` — инструкция | 2 |
| `medical` — медицинский документ | 3 |
| `bank` — уведомление банка | 3 |
| `other` — прочее | 2 |
| **Всего** | **22** |

## Формат эталона

Каждый case содержит `must_find`, `must_not_infer`, `uncertainties`, `critical_failures`, а также нормализованные `expected_dates`, `expected_amounts`, `expected_obligations` и `document_type`. Пустой массив означает, что документ не содержит надёжного значения этого класса.

Абсолютные даты записаны как ISO `YYYY-MM-DD`. Относительные сроки имеют `kind`, `anchor`, `offset` и `computable`; вычисляемые сроки дополнительно содержат нормализованную дату, диапазон или timestamp. Суммы хранят числовое `value` и ISO-код валюты.

Scorer не ищет дословные фразы в ответе. Он принимает отдельные семантические verdicts с evidence по индексам критериев. Порог обычного прохождения — `0.8`; любой `must_not_infer_violations=true` или `critical_failure_violations=true` даёт итоговый `FAIL` независимо от общего score.

## Безопасный запуск

Проверка набора не использует OpenAI API:

```powershell
node evals/document-analyzer/validate-evals.mjs
node evals/document-analyzer/audit-evals.mjs
node evals/document-analyzer/run-evals.mjs --dry-run --model MODEL_ID
```

Реальный запуск намеренно требует одновременно `OPENAI_API_KEY`, `--model MODEL_ID` и `--execute`:

```powershell
node evals/document-analyzer/run-evals.mjs --execute --model MODEL_ID
```

Runner использует Responses API и strict JSON Schema, не подключает инструменты, выполняет кейсы последовательно и пишет отдельный JSON на кейс плюс `_run.json`. Модель не зафиксирована: её выбирают только после отдельного решения этапа 4.
