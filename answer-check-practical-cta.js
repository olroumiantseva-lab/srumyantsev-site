(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/kak-proverit-sovet-neyroseti-pered-vazhnym-resheniem/': {
      mode: 'full',
      source: 'guide-important-decision',
      title: 'Есть готовый совет нейросети? Проверьте его до действия',
      text: 'Вставьте ответ, на который собираетесь опереться. Сервис выделит проверяемые утверждения, сверит важные факты и источники, покажет спорные места и что ещё нужно проверить самостоятельно.',
      terms: ['разберите совет на отдельные детали', 'что требует остановки', 'проверяйте то, что меняет решение']
    },
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/': {
      mode: 'soft',
      source: 'guide-medical-answer-check',
      title: 'Нейросеть объяснила анализы — проверьте уже её ответ',
      text: 'Если в ответе появились конкретные медицинские утверждения, ссылки, нормы или выводы, их можно отдельно проверить до того, как вы понесёте их врачу. Сервис не ставит диагноз и не заменяет врача.',
      terms: ['ии — переводчик и секретарь, а не врач', 'не спрашивайте', 'лекарства']
    },
    '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/': {
      mode: 'soft',
      source: 'guide-money-answer-check',
      title: 'Разобрали тариф или кредит — проверьте вывод нейросети',
      text: 'Суммы лучше сверять калькулятором и документом. А если нейросеть сделала вывод о тарифе, кредите, комиссии, правиле или выгодности варианта, готовый ответ можно отдельно проверить по фактам и источникам.',
      terms: ['сравнение и вопросы, а не финансовый совет', 'где ии ошибается', 'условия кредита']
    },
    '/moshenniki-dipfeyki-golos-rodstvennika/': {
      mode: 'inline',
      source: 'guide-fraud-answer-check',
      text: 'Если вы уже попросили нейросеть оценить письмо или сообщение, её вывод тоже не считается подтверждением подлинности. Проверка ответа поможет найти спорные утверждения, но решающее действие здесь — сменить канал связи и проверить отправителя самостоятельно.',
      terms: ['чем поможет нейросеть', 'голос и грамотное письмо', 'как проверить звонок']
    },
    '/kratkiy-pereskaz-video-youtube-neyrosetyu/': {
      mode: 'inline',
      source: 'guide-youtube-summary-answer-check',
      text: 'Пересказ помогает быстро понять ролик, но может исказить отдельный факт или вывод. Если в выжимке есть важные цифры, законы, медицинские или финансовые утверждения, готовый ответ можно проверить отдельно.',
      terms: ['для важных тем', 'получите выжимку без добавлений', 'провер']
    },
    '/ii-kak-domashniy-repetitor-dlya-rebenka/': {
      mode: 'inline',
      source: 'guide-tutor-answer-check',
      text: 'Перед тем как ребёнок запомнит конкретную дату, формулу, имя или правило из ответа ИИ, спорный ответ лучше сверить. Для сложного ответа можно использовать отдельную «Проверку ответа», а учебник оставить главным источником.',
      terms: ['сверить', 'не сделать уроки, а помочь понять', 'история']
    }
  };

  const config = configs[path];
  if (!config) return;
  const body = document.querySelector('.seo-body');
  if (!body || body.querySelector('[data-answer-check-practical-cta]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .answer-check-practical-inline{margin:22px 0;padding:0 0 0 16px;border-left:3px solid rgba(154,95,53,.55);font-size:.98em}
    .answer-check-practical-inline p{margin:0;max-width:800px}
    .answer-check-practical-inline a{font-weight:700;text-underline-offset:3px}
    .answer-check-practical-soft{margin:28px 0;padding:20px 22px;border-left:5px solid #9a5f35;background:#fff6e4;border-radius:12px}
    .answer-check-practical-soft h3{margin:0 0 8px;font-size:22px;line-height:1.2}
    .answer-check-practical-soft p{margin:0 0 12px;max-width:780px}
    .answer-check-practical-soft a{font-weight:800;text-underline-offset:3px}
    .answer-check-practical-soft small{display:block;margin-top:8px;opacity:.72}
    .answer-check-practical-full{margin:34px 0;padding:28px;border:2px solid #58432f;border-radius:18px;background:#fff6e4;box-shadow:0 8px 0 rgba(88,67,47,.12)}
    .answer-check-practical-full h2{margin:0 0 10px;font-size:clamp(27px,4vw,38px);line-height:1.08}
    .answer-check-practical-full p{margin:0 0 16px;max-width:800px}
    .answer-check-practical-full .answer-check-price{font-weight:800;margin:12px 0 18px}
    .answer-check-practical-full .button{display:inline-flex;text-decoration:none}
    .answer-check-practical-full small{display:block;margin-top:12px;opacity:.72;max-width:780px}
  `;
  document.head.appendChild(style);

  const placement = config.mode === 'full' ? 'guide_primary' : config.mode === 'inline' ? 'guide_inline' : 'guide_contextual';
  const href = `/tools/answer-check/?from=${encodeURIComponent(config.source)}&placement=${placement}`;

  const box = document.createElement('aside');
  box.dataset.answerCheckPracticalCta = config.mode;

  if (config.mode === 'full') {
    box.className = 'answer-check-practical-full';
    box.innerHTML = `<h2>${config.title}</h2><p>${config.text}</p><p class="answer-check-price">Предварительная проверка — бесплатно. Полная проверка — 290 ₽.</p><a class="button" href="${href}">Проверить ответ нейросети</a><small>Для лечения, крупных денег, права и безопасности результат проверки не заменяет профильного специалиста.</small>`;
  } else if (config.mode === 'soft') {
    box.className = 'answer-check-practical-soft';
    box.innerHTML = `<h3>${config.title}</h3><p>${config.text}</p><a href="${href}">Проверить ответ нейросети бесплатно →</a><small>Полная проверка — 290 ₽.</small>`;
  } else {
    box.className = 'answer-check-practical-inline';
    box.innerHTML = `<p>${config.text} <a href="${href}">Проверить ответ →</a></p>`;
  }

  const link = box.querySelector('a');
  link?.addEventListener('click', () => {
    if (typeof window.ym === 'function') {
      window.ym(111385663, 'reachGoal', 'answer_check_product_click', {
        from: path,
        source: config.source,
        placement,
        product: 'answer_check_290'
      });
    }
  });

  const sections = [...body.querySelectorAll(':scope > section')];
  const target = sections.find((section) => {
    const text = `${section.querySelector('h2')?.textContent || ''} ${section.querySelector('.section-label')?.textContent || ''}`.toLowerCase();
    return config.terms.some((term) => text.includes(term));
  });

  if (target) target.insertAdjacentElement('afterend', box);
  else if (config.mode === 'full' && sections[3]) sections[3].insertAdjacentElement('afterend', box);
  else if (config.mode === 'soft' && sections[4]) sections[4].insertAdjacentElement('afterend', box);
  else if (sections[2]) sections[2].insertAdjacentElement('afterend', box);
  else body.appendChild(box);
})();
