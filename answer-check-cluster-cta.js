(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/kakuyu-neyroset-vybrat-2026/': {
      mode: 'soft', source: 'guide-ai-choice',
      title: 'Получили первый ответ — не спешите ему верить',
      text: 'Когда попробуете выбранную нейросеть на реальной задаче, важные факты лучше перепроверить отдельно. Можно вставить готовый ответ в сервис: он бесплатно покажет уровень доверия и 1–2 места, которые стоит проверить.',
      terms: ['первые 10 минут', 'от входа до результата']
    },
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': {
      mode: 'soft', source: 'guide-10-tasks',
      title: 'Если ответ влияет на решение — проверьте его отдельно',
      text: 'Для письма или черновика достаточно доработать формулировку. Но если в ответе есть суммы, даты, законы, медицинские или финансовые выводы, лучше прогнать его через отдельную проверку.',
      terms: ['что можно делать', 'объяснить сложный текст']
    },
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': {
      mode: 'soft', source: 'guide-prompting',
      title: 'Самопроверка полезна, но это ещё не проверка фактов',
      text: 'Нейросеть может уверенно подтвердить собственную ошибку. Если ответ важный, вставьте его в отдельную проверку — сервис разберёт утверждения, источники и места, где факт мог превратиться в предположение.',
      terms: ['попросите проверить себя', 'самопровер']
    },
    '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/': {
      mode: 'soft', source: 'guide-phone',
      title: 'Ответ с телефона тоже можно проверить',
      text: 'Если нейросеть разобрала фото, письмо или скриншот и вы собираетесь действовать по её ответу, проверьте сам ответ отдельно. В сервис можно вставить текст или загрузить JPG, PDF или HEIC.',
      terms: ['сфотографировал и спросил', 'коротко о телефоне']
    },
    '/kak-proverit-ne-sovrala-li-neyroset/': {
      mode: 'full', source: 'guide-fact-check',
      title: 'Есть готовый ответ нейросети? Проверьте его целиком',
      text: 'Вставьте ответ ChatGPT, Claude, Gemini, Алисы, GigaChat или другой нейросети. Сервис выделит проверяемые утверждения, сверит важные факты и покажет места, которые требуют дополнительной проверки.',
      terms: ['где проверка обязательна', 'правда и выдумка']
    },
    '/chto-nelzya-doveryat-neyroseti/': {
      mode: 'full', source: 'guide-trust-boundary',
      title: 'Если цена ошибки высокая — проверьте ответ до решения',
      text: 'Для закона, денег, здоровья и других важных тем можно отдельно проверить уже готовый ответ нейросети. Сервис покажет уровень доверия, спорные утверждения, источники и что нужно сверить самостоятельно.',
      terms: ['можно ли доверять ответам', 'здоровье, деньги и права']
    },

    // Ступень 1 — второй маршрут. Здесь продукт появляется только там,
    // где он естественно продолжает действие читателя.
    '/rasshifrovka-audio-neyrosetyu/': {
      mode: 'inline', source: 'guide-audio-transcript',
      text: 'Если после расшифровки нейросеть ещё и сделала выводы по содержанию разговора, важные факты лучше проверить отдельно. Готовый ответ можно прогнать через сервис «Проверка ответа».',
      terms: ['что делать с расшифровкой', 'провер', 'ошиб']
    },
    '/dlinnye-dokumenty-dogovor-otchet-kniga/': {
      mode: 'soft', source: 'guide-long-document-answer-check',
      title: 'Разобрали документ — проверьте уже сам вывод нейросети',
      text: 'Разбор документа и проверка ответа — разные задачи. Если нейросеть сделала юридический, финансовый или иной важный вывод по PDF, можно отдельно проверить этот вывод: какие утверждения подтверждаются, а где модель могла додумать.',
      terms: ['три проверки', 'прочитала ли нейросеть', 'провер']
    },
    '/tablitsy-i-tsifry-neyroset/': {
      mode: 'soft', source: 'guide-tables-answer-check',
      title: 'Формула сошлась — но вывод тоже стоит проверить',
      text: 'Калькулятор проверит арифметику, но не смысл вывода. Если нейросеть объясняет цифры, тариф, расчёт или делает финансовое заключение, готовый ответ можно отдельно проверить по фактам и источникам.',
      terms: ['где ии', 'ошиб', 'провер']
    },
    '/dve-neyroseti-v-pare-vtoroe-mnenie/': {
      mode: 'full', source: 'guide-second-opinion-answer-check',
      title: 'Не хотите вручную сравнивать два ответа?',
      text: 'Можно вставить один готовый ответ в сервис. Он разобьёт его на проверяемые утверждения, отметит спорные места, сверит важные факты и покажет, что именно нужно проверить в первоисточнике.',
      terms: ['второе мнение', 'сравнить ответы', 'две нейросети']
    },
    '/pochemu-neyroset-otkazyvaetsya-otvechat/': {
      mode: 'inline', source: 'guide-refusal',
      text: 'Отказ нейросети и неправильный ответ — разные вещи. Если она всё-таки ответила, но вы сомневаетесь в фактах, можно отдельно проверить уже готовый ответ.',
      terms: ['почему', 'отказ', 'отвеч']
    },
    '/pochemu-neyroset-daet-skuchnye-otvety/': {
      mode: 'inline', source: 'guide-boring-answers',
      text: 'Когда добились более живого и конкретного ответа, не путайте убедительность с точностью. Если в тексте появились факты, цифры или ссылки, важные утверждения можно проверить отдельно.',
      terms: ['улучш', 'ответ', 'конкрет']
    },
    '/kak-ne-poteryat-perepiski-s-ii/': {
      mode: 'inline', source: 'guide-chat-history',
      text: 'Сохранять стоит не только удачные промпты, но и ответы, на которые вы потом опираетесь. Перед повторным использованием старого ответа проверьте, не устарели ли факты, даты и правила.',
      terms: ['сохраня', 'переписк', 'порядок']
    }
  };

  const config = configs[path];
  if (!config) return;
  const body = document.querySelector('.seo-body');
  if (!body || body.querySelector('[data-answer-check-cta]')) return;

  // На страницах, где проверка ответа — главный следующий шаг,
  // не показываем рядом конкурирующий продуктовый CTA.
  if (config.mode === 'full') {
    document.querySelectorAll('[data-document-product-cta], [data-document-soft-cta]').forEach((node) => node.remove());
  }
  if (path === '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/') {
    document.querySelector('[data-document-product-cta="before_finish"]')?.remove();
  }

  const style = document.createElement('style');
  style.textContent = `
    .answer-check-inline-cta{margin:22px 0;padding:0 0 0 16px;border-left:3px solid rgba(154,95,53,.55);font-size:.98em}
    .answer-check-inline-cta p{margin:0;max-width:800px}
    .answer-check-inline-cta a{font-weight:700;text-underline-offset:3px}
    .answer-check-soft-cta{margin:28px 0;padding:20px 22px;border-left:5px solid #9a5f35;background:#fff6e4;border-radius:12px}
    .answer-check-soft-cta h3{margin:0 0 8px;font-size:22px;line-height:1.2}
    .answer-check-soft-cta p{margin:0 0 12px;max-width:780px}
    .answer-check-soft-cta a{font-weight:800;text-underline-offset:3px}
    .answer-check-soft-cta small{display:block;margin-top:8px;opacity:.72}
    .answer-check-product-cta{margin:34px 0;padding:28px;border:2px solid #58432f;border-radius:18px;background:#fff6e4;box-shadow:0 8px 0 rgba(88,67,47,.12)}
    .answer-check-product-cta h2{margin:0 0 10px;font-size:clamp(27px,4vw,38px);line-height:1.08}
    .answer-check-product-cta p{margin:0 0 16px;max-width:800px}
    .answer-check-product-cta .answer-check-price{font-weight:800;margin:12px 0 18px}
    .answer-check-product-cta .button{display:inline-flex;text-decoration:none}
    .answer-check-product-cta small{display:block;margin-top:12px;opacity:.72;max-width:780px}
  `;
  document.head.appendChild(style);

  const placement = config.mode === 'full' ? 'guide_primary' : config.mode === 'inline' ? 'guide_inline' : 'guide_contextual';
  const href = `/tools/answer-check/?from=${encodeURIComponent(config.source)}&placement=${placement}`;
  const track = (link) => link.addEventListener('click', () => {
    if (typeof window.ym === 'function') {
      window.ym(111385663, 'reachGoal', 'answer_check_product_click', {
        from: path,
        source: config.source,
        placement,
        product: 'answer_check_290'
      });
    }
  });

  const box = document.createElement('aside');
  box.dataset.answerCheckCta = config.mode;
  if (config.mode === 'full') {
    box.className = 'answer-check-product-cta';
    box.innerHTML = `<h2>${config.title}</h2><p>${config.text}</p><p class="answer-check-price">Предварительная проверка — бесплатно. Полная проверка — 290 ₽.</p><a class="button" href="${href}">Проверить ответ нейросети</a><small>Можно вставить текст ответа или загрузить JPG, PDF или HEIC. Для важных решений результат проверки не заменяет профильного специалиста.</small>`;
  } else if (config.mode === 'inline') {
    box.className = 'answer-check-inline-cta';
    box.innerHTML = `<p>${config.text} <a href="${href}">Проверить ответ →</a></p>`;
  } else {
    box.className = 'answer-check-soft-cta';
    box.innerHTML = `<h3>${config.title}</h3><p>${config.text}</p><a href="${href}">Проверить ответ нейросети бесплатно →</a><small>Полная проверка — 290 ₽.</small>`;
  }
  track(box.querySelector('a'));

  const sections = [...body.querySelectorAll(':scope > section')];
  const target = sections.find((section) => {
    const text = `${section.querySelector('h2')?.textContent || ''} ${section.querySelector('.section-label')?.textContent || ''}`.toLowerCase();
    return config.terms.some((term) => text.includes(term));
  });

  if (target) target.insertAdjacentElement('afterend', box);
  else if (config.mode === 'full' && sections[1]) sections[1].insertAdjacentElement('afterend', box);
  else if (config.mode === 'inline' && sections[3]) sections[3].insertAdjacentElement('afterend', box);
  else if (sections[2]) sections[2].insertAdjacentElement('afterend', box);
  else body.appendChild(box);
})();
