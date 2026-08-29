(() => {
  const shorts = {
    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': {
      id: '7P9kOx9FrP0',
      title: 'Как я разбираю договор с помощью нейросети',
      caption: 'Коротко показываю, как сначала вытащить из договора деньги, сроки, штрафы и обязанности, а потом уже дочитывать документ самому.'
    },
    '/kak-proverit-ne-sovrala-li-neyroset/': {
      id: '4xV8K4NZz30',
      title: 'Нейросеть выдумала обзор Верховного суда',
      caption: 'Реальный случай: нейросеть уверенно вставила в отзыв на иск несуществующий обзор судебной практики. После этого я проверяю каждую важную ссылку.'
    },
    '/chto-nelzya-doveryat-neyroseti/': {
      id: 'EPKDJS3CMCc',
      title: 'Почему нельзя верить нейросети на слово',
      caption: 'Уверенный ответ ещё не означает правильный: в этом шортсе показываю, почему источники, даты и цифры нужно проверять отдельно.'
    },
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/': {
      id: '45X5ZRVBJUE',
      title: 'Как я попросил нейросеть объяснить заключение врача',
      caption: 'Нейросеть не ставит диагноз, но может перевести медицинские термины на обычный язык и помочь понять, о чём говорил врач.'
    },
    '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/': {
      id: '4PeFweCCZLU',
      title: 'Почему я почти перестал печатать запросы',
      caption: 'Показываю простой принцип голосового запроса: что случилось, какой результат нужен и какие есть ограничения.'
    },
    '/kak-nayti-prichinu-neispravnosti-po-fotografii-s-pomoshchyu-ii/': {
      id: 'Ihm8etabbsc',
      title: 'Ошибка котла по фотографии',
      caption: 'Сфотографировал код ошибки на котле и попросил нейросеть объяснить, что он означает и какие безопасные шаги можно проверить сначала.'
    },
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': {
      id: 'WB437vNHGYM',
      title: 'Как объяснить непонятное письмо простыми словами',
      caption: 'На примере письма из банка показываю: целиком даём текст нейросети и просим объяснить его как человеку, который видит тему впервые.'
    },
    '/dlinnye-dokumenty-dogovor-otchet-kniga/': {
      id: 'F4vzA5maLmw',
      title: 'Как быстро разобраться в длинном документе',
      caption: 'Короткий пример работы с длинной выпиской: сначала получить пересказ и ответы на вопросы, а уже потом возвращаться к нужным местам документа.'
    },
    '/chto-nelzya-zagruzhat-v-neyroset/': {
      id: 'z5LWz32Yj6g',
      title: 'Что происходит с личной перепиской в нейросети',
      caption: 'Напоминаю, почему для чувствительных тем важно понимать настройки истории, обучения и временных чатов.'
    },
    '/kak-sravnit-tovary-s-pomoshchyu-neyroseti/': {
      id: 'mh5qQoohLkI',
      title: 'Как нейросеть помогает выбрать товар без двадцати вкладок',
      caption: 'На простом примере с кофе показываю, как задать критерии выбора и получить несколько понятных вариантов для сравнения.'
    },
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': {
      id: 'WQeRWeI3pA0',
      title: 'Почему точный вопрос экономит час переделок',
      caption: 'Роль, задача, ситуация, формат и уточняющие вопросы — пять вещей, которые заметно улучшают ответ нейросети.'
    },
    '/kak-proverit-sovet-neyroseti-pered-vazhnym-resheniem/': {
      id: '_Xq3JhGjzT0',
      title: 'Как заставить нейросеть не поддакивать',
      caption: 'Для важных решений прошу нейросеть искать слабые места, давать контраргументы и проверять мою логику, а не просто соглашаться.'
    },
    '/rasshifrovka-audio-neyrosetyu/': {
      id: 'u5Z0S2qajno',
      title: 'Как использовать расшифровку разговора',
      caption: 'Показываю бытовой сценарий: записать разговор, получить текст и затем попросить нейросеть разложить его на конкретные пункты.'
    }
  };

  const path = location.pathname.endsWith('/') ? location.pathname : location.pathname + '/';
  const item = shorts[path];
  if (!item) return;

  const root = document.querySelector('.seo-body, article, main');
  if (!root || root.querySelector('.guide-youtube-short')) return;

  const style = document.createElement('style');
  style.textContent = `
    .guide-youtube-short{margin:42px auto;padding:24px;border:1px solid rgba(70,55,40,.14);border-radius:24px;background:#fbf5e9;box-shadow:0 12px 32px rgba(68,52,36,.08);max-width:720px}
    .guide-youtube-short__kicker{margin:0 0 6px;font-size:.82rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8d694b}
    .guide-youtube-short h2{margin:0 0 10px;font-family:"Segoe Print","Comic Sans MS",cursive;font-size:clamp(1.35rem,3vw,1.8rem);line-height:1.25}
    .guide-youtube-short__caption{margin:0 0 18px;color:#554a40;line-height:1.55}
    .guide-youtube-short__frame{position:relative;width:min(100%,360px);aspect-ratio:9/16;margin:0 auto;overflow:hidden;border-radius:20px;background:#111}
    .guide-youtube-short__frame iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
    @media(max-width:560px){.guide-youtube-short{margin:30px 0;padding:18px;border-radius:18px}.guide-youtube-short__frame{width:min(100%,320px)}}
  `;
  document.head.appendChild(style);

  const block = document.createElement('section');
  block.className = 'guide-youtube-short';
  block.innerHTML = `
    <p class="guide-youtube-short__kicker">Коротко на видео</p>
    <h2>${item.title}</h2>
    <p class="guide-youtube-short__caption">${item.caption}</p>
    <div class="guide-youtube-short__frame">
      <iframe
        src="https://www.youtube-nocookie.com/embed/${item.id}"
        title="${item.title}"
        loading="lazy"
        referrerpolicy="strict-origin-when-cross-origin"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen></iframe>
    </div>`;

  const anchor = root.querySelector('.faq-section, .guide-followup, [class*="followup"], section:has(details)');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(block, anchor);
  else root.appendChild(block);
})();
