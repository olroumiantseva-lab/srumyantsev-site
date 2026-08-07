from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
tags=[
'<meta name="google-site-verification" content="fPKyrDXaGNy6pzk_JVWMnwP7C3hVFIYG8Few75Y2Ypc"/>',
'<meta name="yandex-verification" content="b7ee35519f8a8967"/>'
]
for tag in tags:
    if tag not in s:
        s=s.replace('</head>', tag+'</head>', 1)
p.write_text(s, encoding='utf-8')
out=p.read_text(encoding='utf-8')
for tag in tags:
    assert tag in out
