document.addEventListener('DOMContentLoaded', () => {
  const extraStyles = document.createElement('style');
  extraStyles.textContent = `
    .guide-toc{background:var(--paper-2);border:3px solid var(--ink);box-shadow:6px 7px 0 #8a5b3040;margin:0 0 54px;padding:24px 26px 22px;transform:rotate(-.2deg)}
    .guide-toc-title{display:block;margin-bottom:14px;font:800 24px/1.2 "Segoe Print","Comic Sans MS",cursive}
    .guide-toc ol{list-style:decimal!important;margin:0;padding-left:24px}.guide-toc li{margin:7px 0!important;padding-left:4px!important;font-size:16px!important;line-height:1.45!important}
    .guide-toc a{text-decoration:underline;text-decoration-color:var(--ochre);text-decoration-thickness:2px;text-underline-offset:4px}
    .guide-toc a:hover{color:var(--brown)}
    .guide-bullets{list-style:disc!important;padding-left:1.45em!important}.guide-bullets>li{margin:8px 0!important;padding-left:4px!important}
    .guide-numbered-list{list-style:decimal!important;padding-left:1.55em!important}.guide-numbered-list>li{margin:8px 0!important;padding-left:5px!important}
    .guide-family-teaching .seo-hero h1{margin:24px 0;font:800 clamp(46px,6vw,78px)/1.02 "Segoe Print","Comic Sans MS",cursive;letter-spacing:-.045em}
    .guide-family-teaching .teaching-step-title{margin:30px 0 12px;font:800 clamp(23px,3vw,32px)/1.2 "Segoe Print","Comic Sans MS",cursive;letter-spacing:-.025em}
    .phone-guide-faq{margin-top:58px!important}
    .phone-guide-visual{background:linear-gradient(135deg,#f8eedc 0 52%,#e8c98f 52% 100%)}
    .phone-guide-visual .guide-art-card:nth-child(2){background:var(--ochre)}
    @media(max-width:560px){.guide-toc{margin-bottom:42px;padding:20px 18px;transform:none}.guide-toc-title{font-size:21px}.guide-toc li{font-size:15px!important}.guide-family-teaching .seo-hero h1{font-size:42px}.guide-family-teaching .teaching-step-title{font-size:23px}.phone-guide-faq{margin-top:44px!important}}
  `;
  document.head.appendChild(extraStyles);

  const button = document.querySelector('.back-to-top');
  if (button) {
    const updateVisibility = () => {
      const visible = window.scrollY > 500;
      button.classList.toggle('is-visible', visible);
      button.tabIndex = visible ? 0 : -1;
    };

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  const faq = document.querySelector('#faq-search');
  if (faq) {
    faq.classList.remove('template-section');
    faq.classList.add('faq-section');

    Array.from(faq.querySelectorAll(':scope > h3')).forEach((heading) => {
      const answer = heading.nextElementSibling;
      if (!answer || answer.tagName !== 'P') return;

      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = heading.textContent.trim();
      details.append(summary, answer.cloneNode(true));
      heading.replaceWith(details);
      answer.remove();
    });
  }

  const normalizePath = (path) => path.endsWith('/') ? path : `${path}/`;
  const path = normalizePath(window.location.pathname);
  const tocPaths = new Set([
    '/kakuyu-neyroset-vybrat-2026/',
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/',
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/',
    '/kak-proverit-ne-sovrala-li-neyroset/',
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/',
    '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/',
    '/chto-nelzya-doveryat-neyroseti/',
    '/kartinki-neyrosetyu-otkrytki-avatarka/',
    '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/',
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/'
  ]);

  const findSectionByNumber = (number) => Array.from(document.querySelectorAll('.seo-body > section')).find((section) => {
    const label = section.querySelector(':scope > .section-label');
    return label?.textContent.trim().startsWith(`${number} ·`);
  });

  const addBulletClass = (number) => {
    const section = findSectionByNumber(number);
    section?.querySelectorAll(':scope > ul').forEach((list) => list.classList.add('guide-bullets'));
  };

  const applyThirdBatchFormatting = () => {
    if (path === '/chto-nelzya-doveryat-neyroseti/') {
      const section = findSectionByNumber('13');
      const list = section?.querySelector(':scope > ul');
      if (list) {
        const ordered = document.createElement('ol');
        ordered.className = 'guide-numbered-list';
        while (list.firstChild) ordered.appendChild(list.firstChild);
        list.replaceWith(ordered);
      }
    }

    if (path === '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/') {
      ['09', '10', '13'].forEach(addBulletClass);
    }

    if (path === '/kak-ponyat-analizy-i-zaklyuchenie-vracha/') {
      ['07', '10'].forEach(addBulletClass);
    }

    if (path === '/kak-nauchit-blizkogo-polzovatsya-neyrosetyu/') {
      document.body.classList.add('guide-family-teaching');

      const section04 = findSectionByNumber('04');
      section04?.querySelectorAll(':scope > h3').forEach((heading) => heading.classList.add('teaching-step-title'));

      const section07 = findSectionByNumber('07');
      if (section07 && !section07.querySelector(':scope > ul')) {
        const paragraphs = Array.from(section07.querySelectorAll(':scope > p:not(.section-label)'));
        if (paragraphs.length) {
          const list = document.createElement('ul');
          list.className = 'guide-bullets';
          paragraphs.forEach((paragraph) => {
            const item = document.createElement('li');
            item.innerHTML = paragraph.innerHTML;
            list.appendChild(item);
            paragraph.remove();
          });
          section07.appendChild(list);
        }
      }

      addBulletClass('11');
    }
  };

  const slugify = (text) => text
    .toLowerCase()
    .trim()
    .replace(/ё/g, 'е')
    .replace(/[^a-zа-я0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

  const addToc = () => {
    if (!tocPaths.has(path)) return;
    const body = document.querySelector('.seo-body');
    if (!body) return;

    body.querySelectorAll(':scope > .toc, :scope > section > .toc').forEach((legacyToc) => legacyToc.remove());
    if (body.querySelector(':scope > .guide-toc')) return;

    const headings = Array.from(body.querySelectorAll(':scope > h2, :scope > section > h2'))
      .filter((heading) => {
        const text = heading.textContent.trim().toLowerCase();
        return text && text !== 'где провести границу' && !heading.closest('.faq-section');
      });
    if (headings.length < 2) return;

    const used = new Set();
    headings.forEach((heading, index) => {
      if (!heading.id) {
        const base = slugify(heading.textContent) || `section-${index + 1}`;
        let id = base;
        let n = 2;
        while (document.getElementById(id) || used.has(id)) id = `${base}-${n++}`;
        heading.id = id;
      }
      used.add(heading.id);
    });

    const nav = document.createElement('nav');
    nav.className = 'guide-toc';
    nav.setAttribute('aria-label', 'Оглавление');
    const title = document.createElement('strong');
    title.className = 'guide-toc-title';
    title.textContent = 'Оглавление';
    const list = document.createElement('ol');

    headings.forEach((heading) => {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#${heading.id}`;
      link.textContent = heading.textContent.trim();
      item.appendChild(link);
      list.appendChild(item);
    });

    nav.append(title, list);
    body.insertBefore(nav, body.firstChild);
  };

  const phonePath = '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/';

  const makePhoneIllustration = (cards, caption, index) => {
    const figure = document.createElement('figure');
    figure.className = 'article-image guide-inline-illustration phone-guide-illustration';
    figure.dataset.phoneIllustration = String(index + 1);

    const visual = document.createElement('div');
    visual.className = 'guide-visual phone-guide-visual';
    visual.setAttribute('role', 'img');
    visual.setAttribute('aria-label', caption);

    cards.forEach((label) => {
      const card = document.createElement('span');
      card.className = 'guide-art-card';
      card.textContent = label;
      visual.appendChild(card);
    });

    const figcaption = document.createElement('figcaption');
    figcaption.textContent = caption;
    figure.append(visual, figcaption);
    return figure;
  };

  const addPhoneIllustrations = () => {
    if (path !== phonePath) return;
    const body = document.querySelector('.seo-body');
    if (!body || body.querySelector('[data-phone-illustration]')) return;

    const sections = Array.from(body.querySelectorAll(':scope > .numbered-section'));
    const specs = [
      { after: 1, cards: ['Голос', 'Вопрос', 'Ответ'], caption: 'На телефоне запрос можно просто наговорить: формулировку не обязательно печатать и доводить до идеала.' },
      { after: 3, cards: ['Фото', 'Текст', 'Понять'], caption: 'Камера превращает квитанцию, письмо или инструкцию в материал для разбора прямо на месте.' },
      { after: 6, cards: ['Скриншот', 'Ошибка', 'Действие'], caption: 'Если непонятное уже на экране, скриншот обычно полезнее пересказа ошибки своими словами.' }
    ];

    specs.forEach((spec, index) => {
      const anchor = sections[Math.min(spec.after, sections.length - 1)];
      if (anchor) anchor.insertAdjacentElement('afterend', makePhoneIllustration(spec.cards, spec.caption, index));
    });
  };

  const addPhoneFaq = () => {
    if (path !== phonePath) return;
    const body = document.querySelector('.seo-body');
    if (!body || body.querySelector('#phone-guide-faq')) return;

    const questions = [
      ['Нужно ли печатать запрос нейросети на телефоне?', 'Нет. Можно использовать микрофон внутри чата или диктовку клавиатуры. Наговорите вопрос обычными словами, а если получилось сумбурно — попросите нейросеть сначала понять смысл запроса.'],
      ['Можно ли сфотографировать документ и попросить ИИ объяснить его?', 'Да, если снимок чёткий и текст читается. Перед отправкой уберите персональные, банковские и чужие данные. Важные суммы, сроки и требования потом сверяйте с оригиналом.'],
      ['Что лучше отправить: фотографию экрана или скриншот?', 'Если информация уже на экране телефона или компьютера, лучше сделать скриншот. На нём обычно меньше бликов и искажений, поэтому текст и сообщения об ошибках распознаются точнее.'],
      ['Что делать, если нейросеть не прочитала мелкий текст на фото?', 'Не просите её угадывать. Переснимите документ ровно сверху при хорошем свете или сделайте два крупных кадра — верхнюю и нижнюю часть страницы.'],
      ['Можно ли доверять совету ИИ по фотографии лекарства, прибора или документа?', 'Фотография подходит для объяснения текста, кнопок и подготовки вопросов. Решения о здоровье, деньгах, праве и безопасности нужно проверять по инструкции, официальному источнику или у специалиста.']
    ];

    const section = document.createElement('section');
    section.id = 'phone-guide-faq';
    section.className = 'faq-section phone-guide-faq';
    const label = document.createElement('p');
    label.className = 'section-label';
    label.textContent = 'Частые вопросы';
    const heading = document.createElement('h2');
    heading.textContent = 'Коротко о телефоне, голосе и фотографиях';

    section.append(label, heading);
    questions.forEach(([question, answer]) => {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = question;
      const paragraph = document.createElement('p');
      paragraph.textContent = answer;
      details.append(summary, paragraph);
      section.appendChild(details);
    });

    const boundary = Array.from(body.querySelectorAll(':scope > .template-section'))
      .find((sectionNode) => sectionNode.querySelector('h2')?.textContent.trim().toLowerCase() === 'где провести границу');
    if (boundary) body.insertBefore(section, boundary);
    else body.appendChild(section);
  };

  applyThirdBatchFormatting();
  addToc();
  addPhoneIllustrations();
  addPhoneFaq();
});

(() => {
  const script = document.createElement('script');
  script.src = '/ded-guide-blocks.js?v=1';
  script.defer = true;
  document.head.appendChild(script);
})();
