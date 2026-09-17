(() => {
  const normalizePath = (value) => value.endsWith('/') ? value : `${value}/`;
  const path = normalizePath(window.location.pathname);

  const linksByPath = {
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': [
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 полезных задач для ChatGPT на каждый день'],
      ['/kak-ne-poteryat-perepiski-s-ii/', 'Как сохранить полезные переписки и рабочие промпты'],
      ['/rezyume-i-sobesedovanie-posle-45/', 'Как обновить резюме и подготовиться к собеседованию после 45'],
      ['/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/', 'Как пользоваться ИИ с телефона: голосом и фотографией']
    ],
    '/rezhimy-i-modeli-neyroseti/': [
      ['/rasshifrovka-audio-neyrosetyu/', 'Как расшифровывать аудио, встречи и надиктовки'],
      ['/tablitsy-i-tsifry-neyroset/', 'Как работать с таблицами, формулами и расчётами'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач, на которых удобно попробовать разные режимы']
    ],
    '/lichnaya-sistema-doveriya-neyroseti/': [
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить конкретный ответ нейросети'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя полностью доверять нейросети'],
      ['/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/', 'Как проверять тарифы, кредиты и коммунальные расчёты'],
      ['/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/', 'Как разбирать непонятные письма и уведомления']
    ],

    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': [
      ['/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/', 'Как правильно задавать вопросы ChatGPT'],
      ['/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/', 'Как объяснить непонятное письмо с помощью ИИ'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить, не соврала ли нейросеть']
    ],
    '/kak-ne-poteryat-perepiski-s-ii/': [
      ['/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/', 'Как правильно задавать вопросы ChatGPT'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач для ChatGPT на каждый день'],
      ['/rasshifrovka-audio-neyrosetyu/', 'Как превращать голосовые и встречи в полезный текст']
    ],
    '/rasshifrovka-audio-neyrosetyu/': [
      ['/rezhimy-i-modeli-neyroseti/', 'Как выбрать режим и модель под задачу'],
      ['/kak-ne-poteryat-perepiski-s-ii/', 'Как сохранять полезные переписки и результаты'],
      ['/tablitsy-i-tsifry-neyroset/', 'Как работать с таблицами и цифрами с помощью ИИ']
    ],
    '/rezyume-i-sobesedovanie-posle-45/': [
      ['/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/', 'Как задавать ИИ точные вопросы и получать полезные ответы'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач для ChatGPT на каждый день'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя полностью доверять нейросети']
    ],
    '/kak-proverit-ne-sovrala-li-neyroset/': [
      ['/lichnaya-sistema-doveriya-neyroseti/', 'Как собрать личную систему проверки ответов ИИ'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя доверять нейросети'],
      ['/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/', 'Как разобрать договор с помощью нейросети']
    ],
    '/chto-nelzya-doveryat-neyroseti/': [
      ['/lichnaya-sistema-doveriya-neyroseti/', 'Как собрать личную систему доверия к ответам ИИ'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить конкретный ответ нейросети'],
      ['/kak-ponyat-analizy-i-zaklyuchenie-vracha/', 'Как объяснить анализы и медицинское заключение']
    ],
    '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/': [
      ['/lichnaya-sistema-doveriya-neyroseti/', 'Как проверять ответы ИИ перед важным решением'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить цифры и расчёты нейросети'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя полностью доверять нейросети']
    ],
    '/tablitsy-i-tsifry-neyroset/': [
      ['/rezhimy-i-modeli-neyroseti/', 'Как выбрать режим и модель под расчёты и анализ'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверять цифры и факты в ответах ИИ'],
      ['/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/', 'Как разбирать тарифы, кредиты и коммунальные расчёты']
    ],
    '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/': [
      ['/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/', 'Как правильно задавать вопросы нейросети'],
      ['/rasshifrovka-audio-neyrosetyu/', 'Как превратить голосовую запись в полезный текст'],
      ['/10-zadach-dlya-chatgpt-na-kazhdyy-den/', '10 задач для ChatGPT на каждый день']
    ],
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': [
      ['/lichnaya-sistema-doveriya-neyroseti/', 'Как проверять ответы ИИ перед важным решением'],
      ['/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/', 'Как разобрать договор с помощью нейросети'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить ответ нейросети перед важным решением']
    ],

    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': [
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить факты и ссылки, которые назвала нейросеть'],
      ['/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/', 'Как объяснить непонятное письмо или официальный документ'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя полностью доверять нейросети']
    ],
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/': [
      ['/lichnaya-sistema-doveriya-neyroseti/', 'Как выстроить личную систему проверки ответов ИИ'],
      ['/kak-proverit-ne-sovrala-li-neyroset/', 'Как проверить, не ошиблась ли нейросеть'],
      ['/chto-nelzya-doveryat-neyroseti/', 'Что нельзя доверять нейросети']
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
