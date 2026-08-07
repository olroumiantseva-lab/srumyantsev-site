from pathlib import Path

COUNTER = '111385663'
MARKER = f'<!-- Yandex.Metrika counter {COUNTER} -->'
SNIPPET = f'''{MARKER}<script type="text/javascript">(function(m,e,t,r,i,k,a){{m[i]=m[i]||function(){{(m[i].a=m[i].a||[]).push(arguments)}};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){{if(document.scripts[j].src===r){{return;}}}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)}})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id={COUNTER}','ym');ym({COUNTER},'init',{{ssr:true,webvisor:true,clickmap:true,ecommerce:'dataLayer',referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true}});</script><noscript><div><img src="https://mc.yandex.ru/watch/{COUNTER}" style="position:absolute;left:-9999px" alt="" /></div></noscript><!-- /Yandex.Metrika counter -->'''

changed = []
for p in sorted(Path('.').rglob('*.html')):
    if '.git' in p.parts or '.github' in p.parts:
        continue
    s = p.read_text(encoding='utf-8')
    if MARKER in s:
        continue
    if '</body>' not in s:
        raise RuntimeError(f'No </body> in {p}')
    s = s.replace('</body>', SNIPPET + '</body>', 1)
    p.write_text(s, encoding='utf-8')
    changed.append(str(p))

if not changed:
    raise RuntimeError('No HTML files changed')

for p in sorted(Path('.').rglob('*.html')):
    if '.git' in p.parts or '.github' in p.parts:
        continue
    s = p.read_text(encoding='utf-8')
    if s.count(MARKER) != 1:
        raise RuntimeError(f'Metrika marker count != 1 in {p}')
    if f"ym({COUNTER},'init'" not in s:
        raise RuntimeError(f'Metrika init missing in {p}')

print(f'Installed Yandex.Metrika {COUNTER} in {len(changed)} HTML files')
for x in changed:
    print(x)
