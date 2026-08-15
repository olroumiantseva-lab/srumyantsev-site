from pathlib import Path

p = Path('pochemu-neyroset-daet-skuchnye-otvety/index.html')
s = p.read_text(encoding='utf-8')

repls = {
    '<meta property="article:modified_time" content="2026-08-11T00:00:00+03:00">': '<meta property="article:modified_time" content="2026-08-15T00:00:00+03:00">',
    '"dateModified":"2026-08-11"': '"dateModified":"2026-08-15"',
    '<small>Обновлено: 11 августа 2026</small>': '<small>Обновлено: 15 августа 2026</small>',
}
for old, new in repls.items():
    if old not in s:
        raise SystemExit(f'missing replacement marker: {old[:80]}')
    s = s.replace(old, new, 1)

marker = '<section class="numbered-section"><p class="section-label">04 · Приём 3</p><h2 id="priem-3">Поставить оппонента</h2>'
insert = '''<section class="numbered-section" id="pohvala-i-soglasie"><p class="section-label">04 · Сигнал</p><h2>Почему похвала в начале ответа нейросети может быть рискованна</h2><p>Фразы вроде «отличная идея», «вы очень точно заметили» или «это сильный подход» сами по себе ничего не доказывают. Нейросеть может начать с поддержки, а затем продолжить рассуждение внутри вашей исходной версии, не проверив, верна ли она.</p><p>Риск не в самой вежливости, а в том, что похвала снижает желание перепроверять ответ. Если вопрос важный, попросите модель отдельно назвать слабые места, привести аргументы против вашей позиции и указать, какие факты она не может подтвердить.</p><div class="prompt-box"><h3 class="prompt-title">Проверить похвалу</h3><blockquote>Не соглашайся со мной автоматически. Отдели факты от моих предположений, назови три причины, почему моя версия может быть неверной, и укажи, что нужно проверить по независимому источнику.</blockquote><button class="copy-prompt" type="button" aria-live="polite"><span aria-hidden="true">⧉</span>Скопировать</button></div></section>\n'''
if marker not in s:
    raise SystemExit('missing opponent marker')
s = s.replace(marker, insert + marker, 1)

visible_marker = '<details><summary>Почему нейросеть всегда со мной соглашается?</summary>'
visible_insert = '<details><summary>Почему похвала в начале ответа нейросети может быть рискованна?</summary><p>Похвала может создать ощущение, что ваша исходная версия уже подтверждена, хотя модель могла её не проверять. В важных вопросах просите отдельно назвать слабые места, аргументы против и факты, которые требуют независимой проверки.</p></details>'
if visible_marker not in s:
    raise SystemExit('missing visible FAQ marker')
pos = s.index(visible_marker)
end = s.index('</details>', pos) + len('</details>')
s = s[:end] + visible_insert + s[end:]

schema_marker = '{"@type":"Question","name":"Почему нейросеть всегда со мной соглашается?","acceptedAnswer":{"@type":"Answer","text":"Модели стремятся дать ответ, который устроит собеседника, поэтому на вопрос «я прав?» легко получить подтверждение. Чтобы получить проверку, просите раскритиковать ответ, привести аргументы против или сыграть скептика."}}'
schema_new = schema_marker + ',{"@type":"Question","name":"Почему похвала в начале ответа нейросети может быть рискованна?","acceptedAnswer":{"@type":"Answer","text":"Похвала может создать ощущение, что исходная версия уже подтверждена, хотя модель могла её не проверять. В важных вопросах просите назвать слабые места, аргументы против и факты, которые требуют независимой проверки."}}'
if schema_marker not in s:
    raise SystemExit('missing FAQ schema marker')
s = s.replace(schema_marker, schema_new, 1)

p.write_text(s, encoding='utf-8')
