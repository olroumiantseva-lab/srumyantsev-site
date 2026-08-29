(() => {
  const path = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
  const configs = window.__DED_PUBLICATION_CONFIGS__ || {};
  const config = configs[path];
  if (!config) return;

  const telegram = 'https://t.me/ded_popalsya';
  const instagram = 'https://www.instagram.com/serge.roumi/';

  const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  const addStyles = () => {
    if (document.getElementById('publication-v2-styles')) return;
    const style = document.createElement('style');
    style.id = 'publication-v2-styles';
    style.textContent = `
      .publication-v2 .seo-page>header h1,.publication-v2 .seo-article .seo-hero h1{font:800 clamp(42px,5.7vw,72px)/1.03 "Segoe Print","Comic Sans MS",cursive!important;letter-spacing:-.045em}
      .publication-v2 .seo-body h2{font:800 clamp(28px,3.7vw,40px)/1.12 "Segoe Print","Comic Sans MS",cursive!important;letter-spacing:-.03em}
      .publication-v2 .seo-body h3{font:800 clamp(21px,2.6vw,28px)/1.2 "Segoe Print","Comic Sans MS",cursive!important;letter-spacing:-.02em}
      .publication-v2 .prompt-box,.publication-v2 .warning-box,.publication-v2 .paper-card{border:3px solid var(--ink,#24221f)!important;box-shadow:6px 7px 0 rgba(72,52,31,.16);background:#fff8e8!important}
      .publication-v2 .faq-section{margin-top:52px}
      .publication-v2 .faq-section details{border-top:2px solid var(--ink,#24221f);padding:0}
      .publication-v2 .faq-section details:last-child{border-bottom:2px solid var(--ink,#24221f)}
      .publication-v2 .faq-section summary{cursor:pointer;list-style:none;padding:18px 36px 18px 0;font:800 20px/1.3 "Segoe Print","Comic Sans MS",cursive;position:relative}
      .publication-v2 .faq-section summary::-webkit-details-marker{display:none}
      .publication-v2 .faq-section summary::after{content:"+";position:absolute;right:4px;top:13px;font:800 28px/1 system-ui}
      .publication-v2 .faq-section details[open] summary::after{content:"–"}
      .publication-v2 .faq-section details p{padding:0 0 18px;margin:0;line-height:1.65}
      .publication-toc{background:var(--paper-2,#f6ead6);border:3px solid var(--ink,#24221f);box-shadow:6px 7px 0 rgba(72,52,31,.15);margin:0 0 48px;padding:22px 26px}
      .publication-toc strong{display:block;margin-bottom:12px;font:800 23px/1.2 "Segoe Print","Comic Sans MS",cursive}
      .publication-toc ol{margin:0;padding-left:22px} .publication-toc li{margin:7px 0;font-size:16px;line-height:1.45}
      .publication-toc a{text-decoration:underline;text-decoration-color:#c48a2c;text-decoration-thickness:2px;text-underline-offset:4px}
      .publication-illustration{margin:34px 0 42px} .publication-illustration img{display:block;width:100%;height:auto;border:3px solid var(--ink,#24221f);box-shadow:7px 7px 0 rgba(44,58,78,.2);background:#f6ead6}
      .publication-illustration figcaption{margin-top:10px;color:var(--brown,#765335);font:14px/1.5 Georgia,serif}
      .publication-v2 .ded-block{position:relative;display:grid;grid-template-columns:92px minmax(0,1fr);gap:22px;margin:38px 0 44px;padding:26px 30px 26px 24px;border:3px solid var(--ink,#222);background:#fff7e7;box-shadow:7px 8px 0 rgba(138,91,48,.18);transform:rotate(-.15deg)}
      .publication-v2 .ded-block--did{background:#f2e5c9} .publication-v2 .ded-block__avatar{width:82px;height:82px;border:3px solid var(--ink,#222);border-radius:50%;object-fit:cover;background:#fff;transform:rotate(-2deg)}
      .publication-v2 .ded-block__label{display:inline-block;margin:0 0 9px;padding:5px 9px;border:2px solid var(--ink,#222);background:#e7b64c;font:800 13px/1.1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-1deg)}
      .publication-v2 .ded-block--did .ded-block__label{background:#d7c4a0} .publication-v2 .ded-block__title{margin:0 0 10px!important;font:800 clamp(22px,3vw,30px)/1.15 "Segoe Print","Comic Sans MS",cursive!important}
      .publication-v2 .ded-block__text{font:700 clamp(19px,2.3vw,25px)/1.45 Georgia,serif} .publication-v2 .ded-block__body p{margin:0 0 12px!important;line-height:1.62}
      .publication-v2 .ded-block__social{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;padding-top:14px;border-top:1px dashed rgba(30,30,30,.35)} .publication-v2 .ded-block__social a{font-weight:800;text-decoration:underline;text-decoration-color:#c48a2c;text-decoration-thickness:2px;text-underline-offset:4px}
      @media(max-width:620px){
        .publication-v2 .seo-page>header h1,.publication-v2 .seo-article .seo-hero h1{font-size:40px!important}
        .publication-v2 .seo-body h2{font-size:29px!important}
        .publication-v2 .ded-block{grid-template-columns:62px minmax(0,1fr);gap:14px;margin:30px 0 36px;padding:20px 18px 20px 16px;transform:none}
        .publication-v2 .ded-block__avatar{width:58px;height:58px} .publication-v2 .ded-block__label{font-size:11px} .publication-v2 .ded-block__text{font-size:19px}
        .publication-v2 .ded-block__social{grid-column:1/-1;margin-top:10px}
      }
    `;
    document.head.appendChild(style);
  };

  const slugify = (text) => text.toLowerCase().trim().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,80);

  const normalizeFaq = () => {
    const body = document.querySelector('.seo-body');
    if (!body) return;
    let faq = body.querySelector('.faq-section') || Array.from(body.querySelectorAll(':scope > section')).find(s => /частые вопросы|вопросы и ответы|faq/i.test(s.querySelector('h2')?.textContent || ''));
    if (!faq) {
      faq = document.createElement('section');
      faq.className = 'faq-section';
      const label = document.createElement('p'); label.className='section-label'; label.textContent='FAQ';
      const h2 = document.createElement('h2'); h2.textContent='Последние три вопроса';
      faq.append(label,h2);
      const boundary = body.querySelector(':scope > .guide-followup') || null;
      body.insertBefore(faq,boundary);
    } else {
      faq.classList.add('faq-section');
      Array.from(faq.querySelectorAll(':scope > h3')).forEach(h3 => {
        const p = h3.nextElementSibling;
        if (!p || p.tagName !== 'P') return;
        const d=document.createElement('details'); const s=document.createElement('summary');
        s.textContent=h3.textContent.trim(); d.append(s,p.cloneNode(true)); h3.replaceWith(d); p.remove();
      });
    }
    const details = Array.from(faq.querySelectorAll(':scope > details'));
    const defaults = [
      [`С чего начать, если хочу попробовать ${config.topic}?`,`Возьмите один реальный пример, который нужен сегодня. Дайте нейросети только необходимые исходные данные и сначала получите черновик, а не окончательное решение.`],
      [`Что в этой задаче обязательно проверить самому?`,`Факты, цифры, сроки, имена, ссылки и любые условия, от которых зависит действие. Если цена ошибки высока, откройте первоисточник или обратитесь к специалисту.`],
      [`Как понять, что нейросеть действительно помогла?`,`Результат должен экономить время или делать следующий шаг понятнее. Если после ответа стало больше неопределённости, уточните задачу или вернитесь к исходному документу.`]
    ];
    for (let i=details.length;i<3;i++) {
      const [q,a]=defaults[i]; const d=document.createElement('details'); const s=document.createElement('summary'); const p=document.createElement('p');
      s.textContent=q; p.textContent=a; d.append(s,p); faq.appendChild(d);
    }
  };

  const normalizeFollowup = () => {
    const follow = document.querySelector('.guide-followup');
    if (!follow) return;
    const kicker=follow.querySelector('.section-kicker'); if(kicker) kicker.textContent='По теме';
    const h2=follow.querySelector('h2'); if(h2) h2.textContent='Читайте дальше';
    Array.from(follow.querySelectorAll('.guide-followup-links > a')).slice(3).forEach(a=>a.remove());
  };

  const addToc = () => {
    const body=document.querySelector('.seo-body'); if(!body || body.querySelector(':scope > .guide-toc, :scope > .publication-toc')) return;
    const headings=Array.from(body.querySelectorAll(':scope > section > h2')).filter(h=>!h.closest('.faq-section'));
    if(headings.length<3) return;
    const nav=document.createElement('nav'); nav.className='publication-toc'; nav.setAttribute('aria-label','Оглавление');
    const strong=document.createElement('strong'); strong.textContent='Оглавление'; const ol=document.createElement('ol');
    headings.forEach((h,i)=>{ if(!h.id) h.id=`section-${i+1}-${slugify(h.textContent)}`; const li=document.createElement('li'); const a=document.createElement('a'); a.href=`#${h.id}`; a.textContent=h.textContent.trim(); li.appendChild(a); ol.appendChild(li); });
    nav.append(strong,ol); body.insertBefore(nav,body.firstChild);
  };

  const svgUri = (caption,index) => {
    const safe = (s) => s.replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
    const words=safe(caption).split(' ');
    const lines=[]; let line='';
    words.forEach(w=>{ const test=(line+' '+w).trim(); if(test.length>34){lines.push(line); line=w;}else line=test; }); if(line) lines.push(line);
    const tspans=lines.slice(0,3).map((l,i)=>`<tspan x="120" dy="${i?42:0}">${l}</tspan>`).join('');
    const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="900" viewBox="0 0 1536 900"><rect width="1536" height="900" fill="#f5ead7"/><rect x="65" y="65" width="1406" height="770" rx="8" fill="#fff8e8" stroke="#24221f" stroke-width="6"/><circle cx="1300" cy="180" r="92" fill="#e7b64c" stroke="#24221f" stroke-width="5"/><text x="1300" y="198" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="700" fill="#24221f">${index+1}</text><text x="120" y="250" font-family="Georgia,serif" font-size="52" font-weight="700" fill="#24221f">${tspans}</text><path d="M120 520 H520" stroke="#24221f" stroke-width="6"/><rect x="120" y="590" width="300" height="110" fill="#e7b64c" stroke="#24221f" stroke-width="5"/><rect x="500" y="590" width="300" height="110" fill="#f2e5c9" stroke="#24221f" stroke-width="5"/><rect x="880" y="590" width="300" height="110" fill="#d9e1e8" stroke="#24221f" stroke-width="5"/><text x="270" y="658" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700">СИТУАЦИЯ</text><text x="650" y="658" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700">РАЗБОР</text><text x="1030" y="658" text-anchor="middle" font-family="Arial,sans-serif" font-size="32" font-weight="700">ВЫВОД</text></svg>`;
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  };

  const ensureThreeImages = () => {
    const body=document.querySelector('.seo-body'); if(!body) return;
    let count=body.querySelectorAll('.article-image img').length;
    if(count>=3) return;
    const sections=Array.from(body.querySelectorAll(':scope > .numbered-section, :scope > section')).filter(s=>!s.classList.contains('faq-section'));
    const slots=[2,Math.floor(sections.length/2),Math.max(2,sections.length-3)];
    let addIndex=0;
    while(count<3 && sections.length) {
      const caption=config.visuals[addIndex % config.visuals.length];
      const fig=document.createElement('figure'); fig.className='article-image publication-illustration'; fig.dataset.publicationIllustration=String(addIndex+1);
      const img=document.createElement('img'); img.src=svgUri(caption,addIndex); img.alt=caption; img.width=1536; img.height=900; img.loading='lazy'; img.decoding='async';
      const fc=document.createElement('figcaption'); fc.textContent=caption; fig.append(img,fc);
      const anchor=sections[Math.min(slots[addIndex],sections.length-1)]; anchor.insertAdjacentElement('afterend',fig);
      count++; addIndex++;
    }
  };

  const makeDed = (type,title,contentText) => {
    const block=document.createElement('aside'); block.className=`ded-block ded-block--${type}`; block.dataset.dedBlock=type;
    const avatar=document.createElement('img'); avatar.className='ded-block__avatar'; avatar.src='/sergey-author.png'; avatar.alt='Сергей Румянцев — Дед попался в нейросети';
    const content=document.createElement('div'); const label=document.createElement('div'); label.className='ded-block__label'; label.textContent=type==='said'?'Дед сказал':'Дед сделал'; content.appendChild(label);
    if(title){const h=document.createElement('h3');h.className='ded-block__title';h.textContent=title;content.appendChild(h);}
    const body=document.createElement('div'); body.className=type==='said'?'ded-block__text':'ded-block__body';
    if(type==='said') body.textContent=contentText;
    else {
      const parts=contentText.split('Вывод:'); const p=document.createElement('p'); p.textContent=parts[0].trim(); body.appendChild(p);
      if(parts[1]){const out=document.createElement('p'); out.innerHTML='<strong>Вывод:</strong> '+parts[1].trim(); body.appendChild(out);}
    }
    content.appendChild(body); const social=document.createElement('div'); social.className='ded-block__social';
    social.innerHTML=`<a href="${telegram}" target="_blank" rel="noopener">Ещё истории в Telegram →</a><a href="${instagram}" target="_blank" rel="noopener">Короткие истории в Instagram →</a>`;
    content.appendChild(social); block.append(avatar,content); return block;
  };

  const addDedBlocks = () => {
    if(document.querySelector('[data-ded-block]')) return;
    const sections=Array.from(document.querySelectorAll('.seo-body > .numbered-section, .seo-body > section')).filter(s=>!s.classList.contains('faq-section'));
    if(!sections.length) return;
    const said=makeDed('said','',config.said); sections[0].insertAdjacentElement('afterend',said);
    const did=makeDed('did',config.title,config.story); const anchor=sections[Math.min(3,sections.length-1)]; anchor.insertAdjacentElement('afterend',did);
  };

  onReady(() => {
    document.body.classList.add('publication-v2');
    addStyles();
    addToc();
    normalizeFaq();
    normalizeFollowup();
    ensureThreeImages();
    addDedBlocks();
  });
})();
