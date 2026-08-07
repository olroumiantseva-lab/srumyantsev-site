from pathlib import Path
import re, json
BASE='https://srumyantsev.ru'
ARTICLES=['10-zadach-dlya-chatgpt-na-kazhdyy-den/index.html','kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/index.html','kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/index.html','neyroseti-posle-45-pervyy-rezultat/index.html','kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/index.html','kakuyu-neyroset-vybrat-2026/index.html','kak-proverit-ne-sovrala-li-neyroset/index.html','razbor-neponyatnogo-dokumenta/index.html']
for fn in ARTICLES:
    p=Path(fn); s=p.read_text(encoding='utf-8')
    s=re.sub(r'"dateModified":"[^"]+"','"dateModified":"2026-08-07"',s)
    s=re.sub(r'Обновлено:\s*\d{1,2}\s+[а-яА-ЯёЁ]+\s+2026\s+года','Обновлено: 7 августа 2026 года',s)
    p.write_text(s,encoding='utf-8')

def set_noindex(fn,follow=False):
    p=Path(fn); s=p.read_text(encoding='utf-8')
    s=re.sub(r'<meta\s+name="robots"\s+content="[^"]*"\s*/?>','',s,flags=re.I)
    s=re.sub(r'<meta\s+name="googlebot"\s+content="[^"]*"\s*/?>','',s,flags=re.I)
    val='noindex, follow' if follow else 'noindex, nofollow'
    s=s.replace('</head>',f'<meta name="robots" content="{val}"/><meta name="googlebot" content="{val}"/></head>',1)
    p.write_text(s,encoding='utf-8')
for fn in ['404.html','404/index.html','_not-found/index.html']:
    set_noindex(fn,False)
set_noindex('kakuyu-neyroset-vybrat-v-2026-godu/index.html',True)

def fix_bc(fn,title,path):
    p=Path(fn); s=p.read_text(encoding='utf-8')
    bc={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Главная','item':BASE+'/'},{'@type':'ListItem','position':2,'name':'Практикумы','item':BASE+'/praktikumy/'},{'@type':'ListItem','position':3,'name':title,'item':BASE+path}]}
    tag='<script type="application/ld+json">'+json.dumps(bc,ensure_ascii=False,separators=(',',':'))+'</script>'
    s=re.sub(r'<script type="application/ld\+json">\{[^<]*"@type":"BreadcrumbList"[^<]*\}</script>',tag,s,count=1)
    p.write_text(s,encoding='utf-8')
fix_bc('neyroseti-posle-45-pervyy-rezultat/index.html','Нейросети после 45: первый рабочий результат за 20 минут','/neyroseti-posle-45-pervyy-rezultat/')
fix_bc('razbor-neponyatnogo-dokumenta/index.html','Разбор непонятного документа','/razbor-neponyatnogo-dokumenta/')

# validation
for fn in ['404.html','404/index.html','_not-found/index.html']:
    s=Path(fn).read_text(encoding='utf-8')
    assert len(re.findall(r'<meta\s+name="robots"',s,re.I))==1 and 'content="noindex, nofollow"' in s
for fn in ARTICLES:
    s=Path(fn).read_text(encoding='utf-8')
    assert '"dateModified":"2026-08-07"' in s
for fn in ['neyroseti-posle-45-pervyy-rezultat/index.html','razbor-neponyatnogo-dokumenta/index.html']:
    s=Path(fn).read_text(encoding='utf-8')
    assert '"name":"Практикумы","item":"https://srumyantsev.ru/praktikumy/"' in s
print('SEO fixup complete')
