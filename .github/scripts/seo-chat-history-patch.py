from pathlib import Path
import json, re

p = Path('kak-ne-poteryat-perepiski-s-ii/index.html')
s = p.read_text(encoding='utf-8-sig')

old_desc = 'Как сохранить переписки ChatGPT и других нейросетей: навести порядок в чатах, экспортировать историю, сохранить промпты отдельно и разобраться с памятью.'
new_desc = 'Как сохранить переписку ChatGPT и других нейросетей: экспортировать историю, перенести важный чат в Google Документы, сохранить промпты и не потерять нужные ответы.'
if old_desc not in s:
    raise SystemExit('Expected description not found')
s = s.replace(old_desc, new_desc)

old_lead = '<p class="seo-lead">Четыре привычки, которые помогают находить старые ответы и не зависеть от одного сервиса</p>'
new_lead = '<p class="seo-lead">Как сохранить переписку с ИИ, всю историю ChatGPT и важные ответы так, чтобы они не потерялись: наводим порядок в чатах, делаем экспорт, переносим нужное в Google Документы или заметки и отдельно храним удачные промпты.</p>'
if old_lead not in s:
    raise SystemExit('Expected lead not found')
s = s.replace(old_lead, new_lead, 1)

section = '''<section class="numbered-section" id="google-docs"><p class="section-label">06 · Отдельная копия</p><h2>Как сохранить переписку с ИИ в Google Документы</h2><p>Если нужен не весь архив аккаунта, а один полезный разговор, проще сохранить его как обычный документ. Так ответ останется у вас, даже если позже вы смените нейросеть или потеряете нужный чат в длинной истории.</p><ol><li>Откройте нужную переписку и выделите важную часть текста</li><li>Скопируйте её</li><li>Создайте документ в Google Документах</li><li>Вставьте текст и дайте документу понятное название — например «ЖКХ: разбор квитанции» или «Резюме: финальная версия»</li><li>Если в ответе есть важные ссылки, даты или цифры, сохраните их вместе с контекстом, а не отдельным фрагментом</li></ol><p>Для одной-двух ключевых переписок этого достаточно. Если нужно сохранить всю историю ChatGPT, используйте экспорт данных, описанный выше.</p></section>'''
marker = '<section class="numbered-section" id="kartochka">'
if 'id="google-docs"' not in s:
    if marker not in s:
        raise SystemExit('Card section marker not found')
    s = s.replace(marker, section + '\n\n' + marker, 1)

m = re.search(r'<script type="application/ld\+json">(\{"@context":"https://schema.org","@type":"Article".*?\})</script>', s)
if not m:
    raise SystemExit('Article JSON-LD not found')
article = json.loads(m.group(1))
article['description'] = new_desc
article_json = json.dumps(article, ensure_ascii=False, separators=(',', ':'))
s = s[:m.start(1)] + article_json + s[m.end(1):]

m = re.search(r'<script type="application/ld\+json">(\{"@context":"https://schema.org","@type":"FAQPage".*?\})</script>', s)
if not m:
    raise SystemExit('FAQ JSON-LD not found')
faq = json.loads(m.group(1))
extra = [
    ('Как сохранить переписку с ИИ в Google Документы?', 'Откройте нужный чат, скопируйте важную часть переписки и вставьте её в новый Google Документ. Дайте документу понятное название и сохраняйте вместе с ответом важный контекст, даты и ссылки.'),
    ('Что будет, если удалить чат с нейросетью?', 'После удаления чат может исчезнуть из истории аккаунта, а восстановление зависит от конкретного сервиса. Поэтому перед удалением важной переписки сначала сохраните нужный текст отдельно или сделайте экспорт данных, если такая функция доступна.')
]
existing = {q.get('name') for q in faq['mainEntity']}
for name, text in extra:
    if name not in existing:
        faq['mainEntity'].append({'@type':'Question','name':name,'acceptedAnswer':{'@type':'Answer','text':text}})
faq_json = json.dumps(faq, ensure_ascii=False, separators=(',', ':'))
s = s[:m.start(1)] + faq_json + s[m.end(1):]

assert '<title>Как сохранить переписку ChatGPT: чаты, история, память и промпты</title>' in s
assert 'id="google-docs"' in s
assert 'Как сохранить переписку с ИИ в Google Документы?' in s
assert 'Что будет, если удалить чат с нейросетью?' in s
assert s.count('111385663') >= 3, 'Metrika counter must be preserved'

p.write_text(s, encoding='utf-8')
