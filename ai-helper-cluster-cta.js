(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': {mode:'full',source:'guide-10-tasks-ai-helper',title:'Есть задача, которую вы повторяете постоянно?',text:'Не обязательно каждый раз заново объяснять нейросети контекст, стиль и ограничения. Настройте одного ИИ-помощника под одну повторяющуюся работу и используйте готовую персональную инструкцию в ChatGPT, Claude, Gemini, Алисе или другой текстовой нейросети.',terms:['что можно делать в chatgpt','составить вежливый ответ','превратить заметки в структуру']},
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': {mode:'full',source:'guide-prompts-ai-helper',title:'Не хотите каждый раз заново писать хороший промпт?',text:'Если одна и та же задача повторяется, контекст, формат ответа, ограничения и правила проверки можно собрать один раз. Сервис проведёт по настройке, даст пробный прогон и соберёт персональную инструкцию для вашего ИИ-помощника.',terms:['готовая рамка','как правильно составить запрос','дайте контекст']},
    '/pochemu-neyroset-daet-skuchnye-otvety/': {mode:'soft',source:'guide-boring-answers-ai-helper',title:'Если постоянно докручиваете ответы — закрепите правила один раз',text:'Для повторяющейся работы можно заранее зафиксировать ваш тон, формат, ограничения и правила проверки. Тогда новый чат начинается не с объяснений заново, а с уже настроенного помощника.',terms:['почему chatgpt и другие нейросети отвечают шаблонно','как улучшить ответ нейросети','просить варианты']},
    '/kak-ne-poteryat-perepiski-s-ii/': {mode:'soft',source:'guide-chat-history-ai-helper',title:'Важен не старый чат, а правила, по которым помощник работает',text:'Если вы возвращаетесь к одной и той же задаче, не нужно зависеть от одной длинной переписки. Соберите постоянную инструкцию: роль помощника, контекст, стиль, ограничения и проверку результата.',terms:['переписк','новый чат','контекст']},
    '/kak-sobrat-lichnuyu-bazu-znaniy-s-pomoshchyu-neyroseti/': {mode:'soft',source:'guide-knowledge-base-ai-helper',title:'Следующий шаг — настроить помощника под вашу систему работы',text:'База знаний хранит материалы. ИИ-помощник задаёт постоянные правила, как с ними работать: что выделять, в каком формате отвечать, чего не придумывать и что проверять перед результатом.',terms:['баз','система','нейросет']}
  };
  const config = configs[path];
  if (!config) return;
  const body = document.querySelector('.seo-body');
  if (!body || body.querySelector('[data-ai-helper-cta]')) return;
  const style = document.createElement('style');
  style.textContent = '.ai-helper-guide-full{margin:34px 0;padding:28px;border:2px solid #58432f;border-radius:18px;background:#fff6e4;box-shadow:0 8px 0 rgba(88,67,47,.12)}.ai-helper-guide-full h2{margin:0 0 10px;font-size:clamp(27px,4vw,38px);line-height:1.08}.ai-helper-guide-full p{margin:0 0 16px;max-width:800px}.ai-helper-guide-full .ai-helper-price{font-weight:800;margin:12px 0 18px}.ai-helper-guide-full .button{display:inline-flex;text-decoration:none}.ai-helper-guide-full small{display:block;margin-top:12px;opacity:.72;max-width:780px}.ai-helper-guide-soft{margin:28px 0;padding:20px 22px;border-left:5px solid #9a5f35;background:#fff6e4;border-radius:12px}.ai-helper-guide-soft h3{margin:0 0 8px;font-size:22px;line-height:1.2}.ai-helper-guide-soft p{margin:0 0 12px;max-width:780px}.ai-helper-guide-soft a{font-weight:800;text-underline-offset:3px}.ai-helper-guide-soft small{display:block;margin-top:8px;opacity:.72}';
  document.head.appendChild(style);
  const placement = config.mode === 'full' ? 'guide_primary' : 'guide_contextual';
  const href = `/tools/ai-helper/?from=${encodeURIComponent(config.source)}&placement=${placement}`;
  const box = document.createElement('aside');
  box.dataset.aiHelperCta = config.mode;
  if (config.mode === 'full') {
    box.className = 'ai-helper-guide-full';
    box.innerHTML = `<p class="section-kicker">Мой ИИ-помощник</p><h2>${config.title}</h2><p>${config.text}</p><p class="ai-helper-price">Один помощник под одну повторяющуюся задачу — 990 ₽. Разовая оплата.</p><a class="button" href="${href}">Настроить ИИ-помощника</a><small>Сначала вы проверите помощника на реальной мини-задаче и сможете скорректировать его перед финальной сборкой.</small>`;
  } else {
    box.className = 'ai-helper-guide-soft';
    box.innerHTML = `<h3>${config.title}</h3><p>${config.text}</p><a href="${href}">Настроить своего ИИ-помощника →</a><small>990 ₽ · один помощник под одну повторяющуюся задачу · без подписки.</small>`;
  }
  box.querySelector('a')?.addEventListener('click', () => {
    if (typeof window.ym === 'function') window.ym(111385663,'reachGoal','ai_helper_product_click',{from:path,source:config.source,placement,product:'ai_helper_1490'});
  });
  const sections = [...body.querySelectorAll(':scope > section')];
  const target = sections.find((section) => {
    const text = `${section.querySelector('h2')?.textContent || ''} ${section.querySelector('.section-label')?.textContent || ''}`.toLowerCase();
    return config.terms.some((term) => text.includes(term));
  });
  if (target) target.insertAdjacentElement('afterend', box);
  else if (config.mode === 'full' && sections[3]) sections[3].insertAdjacentElement('afterend', box);
  else if (sections[4]) sections[4].insertAdjacentElement('afterend', box);
  else body.appendChild(box);
})();
