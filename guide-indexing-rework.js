(() => {
  const normalizePath = (value) => value.endsWith('/') ? value : `${value}/`;
  const path = normalizePath(window.location.pathname);

  const configs = {
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': {
      title: 'ChatGPT для начинающих: 10 полезных задач на каждый день',
      description: '10 практических задач для ChatGPT на каждый день: письма, документы, планы, сравнение вариантов, тексты и готовые запросы для начинающих.',
      h1: '10 полезных задач для ChatGPT на каждый день',
      heading: 'С чего начать: не изучать ChatGPT, а дать ему одну реальную задачу',
      text: [
        'Самый быстрый способ понять ChatGPT — не читать список функций, а поручить ему то, что вы и так собирались делать сегодня. Ответить на письмо, объяснить документ, сравнить варианты, составить план или привести в порядок заметки.',
        'Ниже — десять сценариев с готовыми формулировками. Выберите один, подставьте свои данные и после первого ответа обязательно уточните результат: что сократить, что проверить и чего не хватает.'
      ],
      links: [
        ['/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/', 'Как правильно задавать вопросы ChatGPT'],
        ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить ответ ChatGPT'],
        ['/chto-nelzya-zagruzhat-v-neyroset/', 'Что нельзя загружать в нейросеть']
      ],
      video: {
        id: '3n3BDmb_QEg',
        title: 'ChatGPT 2026 с нуля: функции и реальные задачи',
        caption: 'Большой русскоязычный разбор ChatGPT для начинающих: голос, файлы, поиск, промпты и работа с реальными задачами.',
        uploadDate: '2026-01-03',
        duration: 'PT42M'
      }
    },
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': {
      title: 'Как правильно задавать вопросы ChatGPT: формула промпта',
      description: 'Как написать хороший запрос для ChatGPT: контекст, задача, ограничения, формат ответа и уточняющие вопросы. Простая формула без магических промптов.',
      h1: 'Как правильно задавать вопросы ChatGPT, чтобы получать полезные ответы',
      heading: 'Хороший промпт — это не заклинание, а нормальная постановка задачи',
      text: [
        'Качество ответа чаще всего зависит не от длины промпта, а от четырёх вещей: что происходит, какой результат нужен, какие есть ограничения и в каком виде вы хотите получить ответ.',
        'Не пытайтесь написать идеальный запрос с первого раза. Дайте нейросети контекст, попросите черновик, затем уточните слабые места. Такой диалог обычно работает лучше, чем один огромный «универсальный промпт».'
      ],
      links: [
        ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач для ChatGPT на каждый день'],
        ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить факты в ответе нейросети'],
        ['/svoya-biblioteka-promptov/', 'Как собрать свою библиотеку промптов']
      ],
      video: {
        id: 'CpV0ACaet5k',
        title: 'Как писать промпты для ChatGPT: полный разбор',
        caption: 'Видео показывает ту же базовую механику на примерах: роль, контекст, задача, критерии и итерации после первого ответа.',
        uploadDate: '2025-11-18',
        duration: 'PT18M'
      }
    },
    '/kak-proverit-ne-sovrala-li-neyroset/': {
      title: 'Как проверить ответ ChatGPT: 5 способов найти ошибки',
      description: 'Как проверить ответ ChatGPT и другой нейросети: источники, даты, цифры, цитаты и второе мнение. Пять способов заметить выдуманные факты.',
      h1: 'Как проверить ответ ChatGPT и понять, не выдумала ли нейросеть факты',
      heading: 'Уверенный тон ответа ничего не доказывает',
      text: [
        'Нейросеть может правильно объяснить сложную тему и в той же фразе придумать дату, ссылку или название документа. Поэтому проверять нужно не весь ответ одинаково, а прежде всего проверяемые утверждения: цифры, имена, нормы, цитаты, источники и события.',
        'Простой принцип: чем дороже ошибка, тем ближе вы должны подойти к первоисточнику. Для бытового совета достаточно здравого смысла. Для закона, лечения, денег и обязательств — нужен официальный документ или профильный специалист.'
      ],
      links: [
        ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя доверять нейросети'],
        ['/dve-neyroseti-v-pare-vtoroe-mnenie/', 'Как получить второе мнение другой нейросети'],
        ['/kak-proverit-sovet-neyroseti-pered-vazhnym-resheniem/', 'Как проверять совет перед важным решением']
      ]
    },
    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': {
      title: 'Как проверить договор с помощью ChatGPT: риски и условия',
      description: 'Как разобрать договор с помощью ChatGPT: найти деньги, сроки, штрафы, расторжение и спорные условия. Пошаговая проверка перед подписанием.',
      h1: 'Как проверить договор с помощью ChatGPT перед подписанием',
      heading: 'Сначала вытащите из договора то, чем вы реально рискуете',
      text: [
        'Не начинайте с просьбы «проверь договор». Сначала попросите отдельно собрать деньги, сроки, обязанности, штрафы, основания для расторжения и пункты, где одна сторона получает заметно больше прав, чем другая.',
        'После этого возвращайтесь к оригиналу и сверяйте каждый важный вывод. Нейросеть удобна как навигатор по тексту, но не как последний судья: юридически значимые формулировки нужно читать в самом договоре.'
      ],
      links: [
        ['/dlinnye-dokumenty-dogovor-otchet-kniga/', 'Как работать с длинным документом'],
        ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить выводы нейросети'],
        ['/chto-nelzya-zagruzhat-v-neyroset/', 'Как обезличить документ перед загрузкой']
      ]
    },
    '/kak-ne-poteryat-perepiski-s-ii/': {
      title: 'Как сохранить переписку ChatGPT: чаты, история и промпты',
      description: 'Как не потерять полезную переписку с ChatGPT: как называть чаты, что сохранять отдельно, как вести библиотеку промптов и личную базу знаний.',
      h1: 'Как сохранить переписку ChatGPT и не потерять полезные ответы',
      heading: 'Чат — рабочее место, а не архив',
      text: [
        'Полезные ответы лучше не хранить только внутри одного длинного диалога. Через месяц трудно вспомнить, где именно был хороший промпт, финальная версия письма или важный вывод.',
        'Рабочая схема простая: понятное название чата, отдельная заметка для проверенных промптов и отдельное место для результатов, которые понадобятся снова. Тогда история чатов остаётся контекстом, а не единственным хранилищем.'
      ],
      links: [
        ['/svoya-biblioteka-promptov/', 'Как собрать библиотеку промптов'],
        ['/kak-sobrat-lichnuyu-bazu-znaniy-s-pomoshchyu-neyroseti/', 'Как собрать личную базу знаний'],
        ['/chto-nelzya-zagruzhat-v-neyroset/', 'Что не стоит хранить и загружать в нейросеть']
      ]
    },
    '/moshenniki-dipfeyki-golos-rodstvennika/': {
      title: 'Дипфейки и голос родственника: как распознать мошенников',
      description: 'Как действовать, если звонят или присылают голосовое от имени родственника: признаки дипфейка, проверочный вопрос и безопасный алгоритм действий.',
      h1: 'Дипфейк и голос родственника: как проверить, что вам звонит не мошенник',
      heading: 'Главная защита — не распознавать голос, а менять канал связи',
      text: [
        'Современная подделка голоса может звучать убедительно, особенно когда человек напуган и его торопят. Поэтому опасно строить защиту только на попытке услышать «неестественные интонации».',
        'Если просят деньги, код, срочное действие или секретность — прервите разговор и сами перезвоните человеку по сохранённому номеру. Ещё лучше заранее договориться в семье о контрольном вопросе, ответ на который нельзя узнать из социальных сетей.'
      ],
      links: [
        ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверять сомнительную информацию'],
        ['/chto-nelzya-doveryat-neyroseti/', 'Где нельзя полагаться на ИИ'],
        ['/chto-nelzya-zagruzhat-v-neyroset/', 'Какие личные данные нельзя загружать']
      ],
      video: {
        id: 'CLNahsvDLN0',
        title: 'Как мошенники используют дипфейки и клонирование голоса',
        caption: 'Документальный разбор с примерами голосовых и видеодипфейков и рекомендациями, как снизить риск обмана.',
        uploadDate: '2024-09-28',
        duration: 'PT50M'
      }
    },
    '/rezyume-i-sobesedovanie-posle-45/': {
      title: 'Резюме после 45: как обновить опыт с помощью ИИ',
      description: 'Как переписать резюме после 45 с помощью ChatGPT и ИИ: превратить большой опыт в конкретные результаты, адаптировать под вакансию и подготовиться к собеседованию.',
      h1: 'Резюме после 45: как показать опыт сильной стороной с помощью ИИ',
      heading: 'Проблема не в большом опыте, а в том, как он упакован',
      text: [
        'Резюме после 45 часто перегружено обязанностями за двадцать лет и плохо показывает, какую пользу человек приносит сейчас. Нейросеть помогает разложить опыт на задачи, результаты, цифры и навыки, а затем собрать короткую версию под конкретную вакансию.',
        'Но не просите ИИ «улучшить резюме» без исходных данных. Дайте вакансию, реальные достижения и ограничения: ничего не выдумывать, не менять должности и не приписывать навыки, которых у вас нет.'
      ],
      links: [
        ['/kak-smenit-professiyu-posle-45-s-pomoshchyu-neyroseti/', 'Как сменить профессию после 45'],
        ['/kak-nauchit-neyroset-pisat-v-svoem-stile/', 'Как научить ИИ писать в вашем стиле'],
        ['/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/', 'Как ставить задачу нейросети']
      ]
    }
  };

  const config = configs[path];
  if (!config) return;

  const esc = (value) => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const setMeta = (selector, attr, value) => {
    let el = document.querySelector(selector);
    if (!el) {
      el = document.createElement('meta');
      Object.entries(attr).forEach(([key,val]) => el.setAttribute(key,val));
      document.head.appendChild(el);
    }
    el.setAttribute('content', value);
  };

  const applyHead = () => {
    document.title = config.title;
    setMeta('meta[name="description"]', {name:'description'}, config.description);
    setMeta('meta[property="og:title"]', {property:'og:title'}, config.title);
    setMeta('meta[property="og:description"]', {property:'og:description'}, config.description);
    setMeta('meta[name="twitter:title"]', {name:'twitter:title'}, config.title);
    setMeta('meta[name="twitter:description"]', {name:'twitter:description'}, config.description);

    document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
      try {
        const data = JSON.parse(script.textContent);
        const patchArticle = (node) => {
          if (!node || typeof node !== 'object') return;
          if (node['@type'] === 'Article') {
            node.headline = config.h1;
            node.description = config.description;
            node.dateModified = '2026-09-12';
            if (!node.image) node.image = 'https://srumyantsev.ru/logo.png';
          }
          if (Array.isArray(node['@graph'])) node['@graph'].forEach(patchArticle);
        };
        patchArticle(data);
        script.textContent = JSON.stringify(data);
      } catch (_) {}
    });
  };

  const addStyles = () => {
    if (document.getElementById('guide-indexing-rework-styles')) return;
    const style = document.createElement('style');
    style.id = 'guide-indexing-rework-styles';
    style.textContent = `
      .indexing-rework-summary{margin:28px 0 42px;padding:24px 28px;border:3px solid var(--ink,#24221f);background:#fff8e8;box-shadow:6px 7px 0 rgba(72,52,31,.14)}
      .indexing-rework-summary h2{margin:0 0 14px!important;font-size:clamp(25px,3.4vw,34px)!important}.indexing-rework-summary p{margin:0 0 12px;line-height:1.68}.indexing-rework-summary p:last-child{margin-bottom:0}
      .indexing-rework-links{margin:46px 0 10px;padding:24px 28px;background:#f4ead8;border:1px solid rgba(70,55,40,.18);border-radius:18px}.indexing-rework-links h2{margin:0 0 14px!important}.indexing-rework-links ul{margin:0;padding-left:22px}.indexing-rework-links li{margin:9px 0;line-height:1.45}
      .guide-youtube-long{margin:44px 0;padding:24px;border:3px solid var(--ink,#24221f);background:#fbf5e9;box-shadow:6px 7px 0 rgba(72,52,31,.14)}.guide-youtube-long__kicker{margin:0 0 7px;font:800 12px/1.2 system-ui;letter-spacing:.08em;text-transform:uppercase;color:#8d694b}.guide-youtube-long h2{margin:0 0 10px!important}.guide-youtube-long__caption{margin:0 0 18px;line-height:1.6}.guide-youtube-long__frame{position:relative;aspect-ratio:16/9;background:#222;overflow:hidden;border-radius:14px}.guide-youtube-long__frame iframe,.guide-youtube-long__poster{position:absolute;inset:0;width:100%;height:100%;border:0}.guide-youtube-long__poster{cursor:pointer;background-position:center;background-size:cover;display:flex;align-items:center;justify-content:center}.guide-youtube-long__poster::after{content:'';position:absolute;inset:0;background:rgba(0,0,0,.22)}.guide-youtube-long__play{position:relative;z-index:1;padding:13px 18px;border-radius:999px;background:rgba(0,0,0,.82);color:#fff;font:800 16px/1.2 system-ui}.guide-youtube-long__play::before{content:'▶ ';}.guide-youtube-long__source{margin:12px 0 0;color:#77695c;font-size:14px;line-height:1.5}
      @media(max-width:560px){.indexing-rework-summary,.indexing-rework-links,.guide-youtube-long{padding:19px 18px;margin-left:0;margin-right:0}.guide-youtube-long__frame{border-radius:10px}}
    `;
    document.head.appendChild(style);
  };

  const addSummary = () => {
    const article = document.querySelector('.seo-page, .seo-article, article');
    const body = document.querySelector('.seo-body');
    if (!article || !body || body.querySelector('.indexing-rework-summary')) return;

    const h1 = article.querySelector('h1');
    if (h1) h1.textContent = config.h1;

    const dateNode = Array.from(article.querySelectorAll('small')).find(el => /обновлено/i.test(el.textContent));
    if (dateNode) dateNode.textContent = 'Обновлено: 12 сентября 2026';

    const section = document.createElement('section');
    section.className = 'indexing-rework-summary';
    section.innerHTML = `<h2>${esc(config.heading)}</h2>${config.text.map(p => `<p>${esc(p)}</p>`).join('')}`;

    const toc = body.querySelector(':scope > .guide-toc, :scope > .publication-toc');
    if (toc) toc.insertAdjacentElement('afterend', section);
    else body.insertBefore(section, body.firstChild);
  };

  const addLinks = () => {
    const body = document.querySelector('.seo-body');
    if (!body || body.querySelector('.indexing-rework-links')) return;
    const section = document.createElement('section');
    section.className = 'indexing-rework-links';
    section.innerHTML = `<h2>Что ещё пригодится по этой теме</h2><ul>${config.links.map(([href,label]) => `<li><a href="${esc(href)}">${esc(label)}</a></li>`).join('')}</ul>`;
    const followup = document.querySelector('.guide-followup');
    if (followup) followup.parentNode.insertBefore(section, followup);
    else body.appendChild(section);
  };

  const addVideo = () => {
    if (!config.video || document.querySelector('.guide-youtube-long')) return;
    const body = document.querySelector('.seo-body');
    if (!body) return;
    const v = config.video;
    const section = document.createElement('section');
    section.className = 'guide-youtube-long';
    section.innerHTML = `
      <p class="guide-youtube-long__kicker">Видео по теме</p>
      <h2>${esc(v.title)}</h2>
      <p class="guide-youtube-long__caption">${esc(v.caption)}</p>
      <div class="guide-youtube-long__frame"><button class="guide-youtube-long__poster" type="button" aria-label="Смотреть видео: ${esc(v.title)}" style="background-image:url('https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg')"><span class="guide-youtube-long__play">Смотреть на странице</span></button></div>
      <p class="guide-youtube-long__source">Видео размещено через официальный встраиваемый плеер YouTube и загружается только после нажатия.</p>`;

    const anchor = body.querySelector('.indexing-rework-links, .faq-section, .template-section');
    if (anchor) body.insertBefore(section, anchor); else body.appendChild(section);

    const frame = section.querySelector('.guide-youtube-long__frame');
    section.querySelector('.guide-youtube-long__poster').addEventListener('click', (event) => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = v.title;
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      event.currentTarget.replaceWith(iframe);
    });

    const schema = document.createElement('script');
    schema.type = 'application/ld+json';
    schema.textContent = JSON.stringify({
      '@context':'https://schema.org',
      '@type':'VideoObject',
      name:v.title,
      description:v.caption,
      thumbnailUrl:`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`,
      uploadDate:v.uploadDate,
      duration:v.duration,
      embedUrl:`https://www.youtube.com/embed/${v.id}`,
      mainEntityOfPage:`https://srumyantsev.ru${path}`
    });
    document.head.appendChild(schema);
  };

  const fixImageAlts = () => {
    document.querySelectorAll('.seo-page img, .seo-article img').forEach((img) => {
      if (img.getAttribute('alt')?.trim()) return;
      const caption = img.closest('figure')?.querySelector('figcaption')?.textContent?.trim();
      img.alt = caption || 'Иллюстрация к гайду «Дед попался в нейросети»';
    });
  };

  const run = () => {
    applyHead();
    addStyles();
    addSummary();
    addLinks();
    addVideo();
    fixImageAlts();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();
})();
