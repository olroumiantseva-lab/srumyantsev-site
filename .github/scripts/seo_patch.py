from pathlib import Path
import re, json

BASE='https://srumyantsev.ru'
PAGES={
 'index.html':('/', 'website', None, 'Главная'),
 'guides/index.html':('/guides/','website',None,'Гайды'),
 'praktikumy/index.html':('/praktikumy/','website',None,'Практикумы'),
 '10-zadach-dlya-chatgpt-na-kazhdyy-den/index.html':('/10-zadach-dlya-chatgpt-na-kazhdyy-den/','article','2026-08-05','10 задач, которые можно отдать ChatGPT уже сегодня'),
 'kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/index.html':('/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/','article','2026-08-04','Как объяснить непонятное письмо с помощью ИИ'),
 'kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/index.html':('/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/','article','2026-08-05','Как разговаривать с ИИ, чтобы он не нёс ерунду'),
 'neyroseti-posle-45-pervyy-rezultat/index.html':('/neyroseti-posle-45-pervyy-rezultat/','article','2026-08-04','Нейросети после 45: первый рабочий результат за 20 минут'),
 'kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/index.html':('/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/','article','2026-08-06','Как пользоваться ИИ с телефона: голосом и фотографией'),
 'kakuyu-neyroset-vybrat-2026/index.html':('/kakuyu-neyroset-vybrat-2026/','article','2026-08-06','Какую нейросеть выбрать в 2026 году'),
 'kak-proverit-ne-sovrala-li-neyroset/index.html':('/kak-proverit-ne-sovrala-li-neyroset/','article','2026-08-06','Как проверить, не соврала ли нейросеть'),
 'razbor-neponyatnogo-dokumenta/index.html':('/razbor-neponyatnogo-dokumenta/','article','2026-08-06','Разбор непонятного документа'),
}
DETAIL=set(PAGES)-{'index.html','guides/index.html','praktikumy/index.html'}
INTERNAL=['guides','praktikumy','10-zadach-dlya-chatgpt-na-kazhdyy-den','kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii','kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety','neyroseti-posle-45-pervyy-rezultat','kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey','kakuyu-neyroset-vybrat-2026','kak-proverit-ne-sovrala-li-neyroset','razbor-neponyatnogo-dokumenta']

def tag_replace(s, pattern, repl):
    return re.sub(pattern,repl,s,count=1,flags=re.I)

def ensure_meta(s, attr, key, value):
    pat=rf'<meta\s+{attr}="{re.escape(key)}"\s+content="[^"]*"\s*/?>'
    tag=f'<meta {attr}="{key}" content="{value}"/>'
    if re.search(pat,s,re.I): return re.sub(pat,tag,s,count=1,flags=re.I)
    return s.replace('</head>',tag+'</head>',1)

def ensure_link(s, rel, href):
    pat=rf'<link\s+rel="{re.escape(rel)}"\s+href="[^"]*"\s*/?>'
    tag=f'<link rel="{rel}" href="{href}"/>'
    if re.search(pat,s,re.I): return re.sub(pat,tag,s,count=1,flags=re.I)
    return s.replace('</head>',tag+'</head>',1)

def add_jsonld(s,obj,marker):
    if marker in s: return s
    tag='<script type="application/ld+json">'+json.dumps(obj,ensure_ascii=False,separators=(',',':'))+'</script>'
    return s.replace('</head>',tag+'</head>',1)

def normalize_links(s):
    for slug in INTERNAL:
        s=s.replace(f'href="/{slug}"',f'href="/{slug}/"')
        s=s.replace(f'content="{BASE}/{slug}"',f'content="{BASE}/{slug}/"')
    return s

for fn,(path,kind,pub,title) in PAGES.items():
    p=Path(fn); s=p.read_text(encoding='utf-8')
    s=re.sub(r'<meta name="codex-preview"[^>]*>','',s,flags=re.I)
    s=normalize_links(s)
    canonical=BASE+path
    s=ensure_link(s,'canonical',canonical)
    s=ensure_meta(s,'property','og:url',canonical)
    s=ensure_meta(s,'property','og:type','article' if kind=='article' else 'website')
    if kind=='article':
        s=ensure_meta(s,'property','article:published_time',pub+'T00:00:00+03:00')
        s=ensure_meta(s,'property','article:modified_time','2026-08-07T00:00:00+03:00')
        article={'@context':'https://schema.org','@type':'Article','headline':title,'url':canonical,'datePublished':pub,'dateModified':'2026-08-07','inLanguage':'ru-RU','author':{'@type':'Person','name':'Сергей Румянцев','url':BASE+'/'},'publisher':{'@type':'Person','name':'Сергей Румянцев','url':BASE+'/'}}
        s=add_jsonld(s,article,'"@type":"Article"')
    if fn!='index.html':
        parent_name='Гайды' if 'praktikum' not in fn and fn!='praktikumy/index.html' else 'Практикумы'
        parent_url=BASE+('/guides/' if parent_name=='Гайды' else '/praktikumy/')
        items=[{'@type':'ListItem','position':1,'name':'Главная','item':BASE+'/'},{'@type':'ListItem','position':2,'name':parent_name,'item':parent_url}]
        if fn in DETAIL: items.append({'@type':'ListItem','position':3,'name':title,'item':canonical})
        bc={'@context':'https://schema.org','@type':'BreadcrumbList','itemListElement':items}
        s=add_jsonld(s,bc,'"@type":"BreadcrumbList"')
    p.write_text(s,encoding='utf-8')

# duplicate old URL: keep page reachable but remove from index and point canonical to current URL
p=Path('kakuyu-neyroset-vybrat-v-2026-godu/index.html'); s=p.read_text(encoding='utf-8')
s=re.sub(r'<meta name="codex-preview"[^>]*>','',s,flags=re.I)
s=ensure_meta(s,'name','robots','noindex, follow')
s=ensure_meta(s,'name','googlebot','noindex, follow')
s=ensure_link(s,'canonical',BASE+'/kakuyu-neyroset-vybrat-2026/')
s=ensure_meta(s,'property','og:url',BASE+'/kakuyu-neyroset-vybrat-2026/')
p.write_text(s,encoding='utf-8')

# 404 variants: no indexing
for fn in ['404.html','404/index.html','_not-found/index.html']:
    p=Path(fn); s=p.read_text(encoding='utf-8')
    s=re.sub(r'<meta name="codex-preview"[^>]*>','',s,flags=re.I)
    s=ensure_meta(s,'name','robots','noindex, nofollow')
    s=ensure_meta(s,'name','googlebot','noindex, nofollow')
    p.write_text(s,encoding='utf-8')

# clean robots
Path('robots.txt').write_text('User-agent: *\nAllow: /\n\nSitemap: https://srumyantsev.ru/sitemap.xml\n',encoding='utf-8')

# consistent trailing-slash URLs; exclude duplicate old slug
urls=[
 ('/', '2026-08-07','weekly','1.0'),('/guides/','2026-08-07','weekly','0.8'),('/praktikumy/','2026-08-07','weekly','0.8'),
 ('/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/','2026-08-07','monthly','0.7'),('/10-zadach-dlya-chatgpt-na-kazhdyy-den/','2026-08-07','monthly','0.7'),('/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/','2026-08-07','monthly','0.7'),('/neyroseti-posle-45-pervyy-rezultat/','2026-08-07','monthly','0.7'),('/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/','2026-08-07','monthly','0.7'),('/kakuyu-neyroset-vybrat-2026/','2026-08-07','monthly','0.7'),('/kak-proverit-ne-sovrala-li-neyroset/','2026-08-07','monthly','0.7'),('/razbor-neponyatnogo-dokumenta/','2026-08-07','monthly','0.7')]
xml=['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u,d,f,pr in urls: xml.append(f'<url><loc>{BASE}{u}</loc><lastmod>{d}</lastmod><changefreq>{f}</changefreq><priority>{pr}</priority></url>')
xml.append('</urlset>')
Path('sitemap.xml').write_text('\n'.join(xml)+'\n',encoding='utf-8')

# sanity checks
for fn in PAGES:
    s=Path(fn).read_text(encoding='utf-8')
    assert 'codex-preview' not in s, fn
    assert '<link rel="canonical"' in s, fn
for fn in DETAIL:
    s=Path(fn).read_text(encoding='utf-8')
    assert '"@type":"Article"' in s and '"@type":"BreadcrumbList"' in s, fn
print('SEO patch complete')
