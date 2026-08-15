from pathlib import Path

p = Path('kak-razobratsya-s-dengami-tarify-kredity-kommunalka/index.html')
s = p.read_text(encoding='utf-8')

repls = {
    '<meta property="article:modified_time" content="2026-08-12T00:00:00+03:00">': '<meta property="article:modified_time" content="2026-08-15T00:00:00+03:00">',
    '"dateModified":"2026-08-12"': '"dateModified":"2026-08-15"',
    '<small>Обновлено: 12 августа 2026</small>': '<small>Обновлено: 15 августа 2026</small>',
    '<p class="seo-lead">Разбираем коммунальную квитанцию, кредитные условия и регулярные списания, а каждую важную цифру сверяем по официальным данным</p>': '<p class="seo-lead">Можно ли доверять ИИ при расчёте коммунальных услуг, кредита или тарифа? Нейросеть помогает разобрать квитанцию и условия, но каждую важную цифру нужно сверять по официальным данным.</p>',
}
for old, new in repls.items():
    if old not in s:
        raise SystemExit(f'missing replacement marker: {old[:80]}')
    s = s.replace(old, new, 1)

marker = '<section class="numbered-section" id="svyaz">'
block = '''<section class="numbered-section" id="proverka-rascheta"><p class="section-label">05 · Проверка расчёта</p><h2>Можно ли доверять ИИ при расчёте коммунальных услуг</h2><p>Использовать нейросеть как второй калькулятор можно, но её результат не подтверждает правильность начисления. Модель может неверно прочитать цифру на квитанции, перепутать единицы измерения, применить устаревший тариф или ошибиться в арифметике.</p><p>Надёжная схема такая: возьмите тариф, показания и формулу из квитанции, договора или официального кабинета поставщика; попросите ИИ показать расчёт по шагам; затем пересчитайте итог обычным калькулятором и сравните с документом. Если суммы расходятся, уточняйте начисление у поставщика или управляющей организации.</p></section>\n'''
if marker not in s:
    raise SystemExit('missing svyaz marker')
s = s.replace(marker, block + marker, 1)

visible = '<h2>Частые вопросы</h2>'
visible_new = '<h2>Частые вопросы</h2><details><summary>Можно ли верить ИИ при расчёте коммунальных услуг?</summary><p>Использовать его для промежуточного расчёта можно, но итог нужно сверить по действующему тарифу, показаниям, формуле из квитанции и обычному калькулятору. Правильность начисления подтверждает поставщик или управляющая организация.</p></details>'
if visible not in s:
    raise SystemExit('missing FAQ heading')
s = s.replace(visible, visible_new, 1)

schema = '"mainEntity":[{'
schema_new = '"mainEntity":[{"@type":"Question","name":"Можно ли верить ИИ при расчёте коммунальных услуг?","acceptedAnswer":{"@type":"Answer","text":"Использовать ИИ для промежуточного расчёта можно, но итог нужно сверить по действующему тарифу, показаниям, формуле из квитанции и обычному калькулятору. Правильность начисления подтверждает поставщик или управляющая организация."}},{'
if schema not in s:
    raise SystemExit('missing FAQ schema marker')
s = s.replace(schema, schema_new, 1)

p.write_text(s, encoding='utf-8')

# trigger
