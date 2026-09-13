(() => {
  const normalizePath = (value) => value.endsWith('/') ? value : `${value}/`;
  const path = normalizePath(window.location.pathname);

  const linksByPath = {
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': [
      ['/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/', 'Как объяснить непонятное письмо с помощью ИИ'],
      ['/kak-ponyat-analizy-i-zaklyuchenie-vracha/', 'Как понять анализы и заключение врача'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить, не соврала ли нейросеть']
    ],
    '/kak-proverit-ne-sovrala-li-neyroset/': [
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя доверять нейросети'],
      ['/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/', 'Как разобрать договор с помощью нейросети'],
      ['/kak-ponyat-analizy-i-zaklyuchenie-vracha/', 'Как использовать ИИ для объяснения анализов и заключения врача']
    ],
    '/chto-nelzya-doveryat-neyroseti/': [
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить конкретный ответ нейросети'],
      ['/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/', 'Как безопасно разобрать договор с помощью ИИ'],
      ['/kak-ponyat-analizy-i-zaklyuchenie-vracha/', 'Как объяснить анализы и медицинское заключение']
    ],
    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': [
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить факты и ссылки, которые назвала нейросеть'],
      ['/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/', 'Как объяснить непонятное письмо или официальный документ'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя полностью доверять нейросети']
    ],
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': [
      ['/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/', 'Как разобрать договор с помощью нейросети'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 полезных задач для ChatGPT на каждый день'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить ответ нейросети перед важным решением']
    ],
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/': [
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить, не ошиблась ли нейросеть'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя доверять нейросети'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач, которые можно поручить ChatGPT']
    ],
    '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/': [
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить цифры и расчёты нейросети'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя полностью доверять нейросети'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач для ChatGPT на каждый день']
    ]
  };

  const links = linksByPath[path];
  if (!links) return;

  const body = document.querySelector('.seo-body');
  if (!body || body.querySelector('#priority-related-guides')) return;

  const section = document.createElement('section');
  section.id = 'priority-related-guides';
  section.className = 'template-section priority-related-guides';
  section.innerHTML = `
    <p class="section-label">По теме</p>
    <h2>Что посмотреть дальше</h2>
    <ul class="priority-related-list">
      ${links.map(([href, label]) => `<li><a href="${href}">${label}</a></li>`).join('')}
    </ul>`;

  const style = document.createElement('style');
  style.textContent = `
    .priority-related-guides{margin-top:52px}
    .priority-related-list{margin:18px 0 0;padding-left:1.35em}
    .priority-related-list li{margin:10px 0;line-height:1.5}
    .priority-related-list a{text-decoration:underline;text-decoration-color:var(--ochre);text-decoration-thickness:2px;text-underline-offset:4px}
    .priority-related-list a:hover{color:var(--brown)}
  `;
  document.head.appendChild(style);

  const boundary = Array.from(body.querySelectorAll(':scope > .template-section, :scope > section'))
    .find((node) => node.querySelector('h2')?.textContent.trim().toLowerCase() === 'где провести границу');

  if (boundary) body.insertBefore(section, boundary);
  else body.appendChild(section);
})();
