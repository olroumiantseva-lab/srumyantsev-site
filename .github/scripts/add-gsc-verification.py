from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
tag='<meta name="google-site-verification" content="fPKyrDXaGNy6pzk_JVWMnwP7C3hVFIYG8Few75Y2Ypc"/>'
if tag not in s:
    s=s.replace('</head>', tag+'</head>', 1)
p.write_text(s, encoding='utf-8')
assert tag in p.read_text(encoding='utf-8')
