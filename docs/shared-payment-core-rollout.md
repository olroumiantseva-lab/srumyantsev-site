# Shared payment core rollout

Цель: выделить единое платёжное ядро для `ded` и `proverjdo`, не прерывая действующий продукт 290 ₽ / 10 разборов.

## Что меняется

- `products` — серверный каталог продуктов, цен и entitlement.
- `payment_orders` хранит `product_id`, `source_site`, сумму и snapshot entitlement на момент создания заказа.
- `entitlements` хранит не-кредитные права (`feature_access`, `session_unlock`).
- `create-payment` принимает только `email`, `product_id`, `source_site`; цену и чек берёт из БД.
- `robokassa-result` сверяет callback с суммой конкретного заказа и вызывает `complete_product_payment`.
- `complete_robokassa_payment` остаётся compatibility wrapper на период перехода.

## Первый продукт

`document_explain_290`

- source: `ded`
- amount: 29000 коп.
- entitlement: `credits`
- credits: 10

## Безопасный порядок выкладки

1. Применить миграцию `20260908150000_shared_payment_core.sql`.
2. Проверить, что старый `create-robokassa-payment` по-прежнему создаёт заказ 29000 коп. с `product_id=document_explain_290`, `source_site=ded`, 10 credits.
3. Задеплоить новую функцию `create-payment` (`verify_jwt=false`).
4. Задеплоить обновлённый `robokassa-result`.
5. В test mode вызвать `create-payment` с:
   ```json
   {"email":"<test>","product_id":"document_explain_290","source_site":"ded"}
   ```
6. Оплатить тестовый заказ и проверить:
   - `payment_orders.status=succeeded`;
   - одна строка `purchases`;
   - одна `credit_transactions` на +10;
   - повторный callback не добавляет ещё +10.
7. Только после успешного smoke переключить frontend «Деда» с `create-robokassa-payment` на `create-payment` и добавить `product_id/source_site` в запрос.
8. Старый endpoint удалить отдельной миграцией/PR после стабильной работы.

## Почему frontend переключается отдельно

GitHub Pages выкатывается после merge, а Supabase Edge Functions — отдельным деплоем. Если переключить frontend раньше backend, оплата остановится. Поэтому backend core и frontend cutover разделены.

## Следующий продукт

После smoke текущего товара можно добавить `contract_check_490` для `proverjdo` отдельной записью в `products`, не меняя платёжную функцию.
