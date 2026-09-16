(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': {mode:'full',source:'guide-10-tasks-ai-helper',title:'Есть задача, которую вы повторяете постоянно?',text:'Не обязательно каждый раз заново объяснять нейросети контекст, стиль и ограничения. Настройте одного ИИ-помощника под одну повторяющуюся работу и используйте готовую персональную инструкцию в ChatGPT, Claude, Gemini, Алисе или другой текстовой нейросети.',terms:['что можно делать в chatgpt','составить вежливый ответ','превратить заметки в структуру']},
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': {mode:'full',source:'guide-prompts-ai-helper',title:'Не хотите каждый раз заново писать хороший промпт?',text:'Если одна и та же задача повторяется, контекст, формат ответа, ограничения и правила проверки можно собрать один раз. Сервис проведёт по настройке, даст пробный прогон и соберёт персональную инструкцию для вашего ИИ-помощника.',terms:['готовая рамка','как правильно составить запрос','дайте контекст']},
    '/pochemu-neyroset-daet-skuchnye-otvety/': {mode:'soft',source:'guide-boring-answers-ai-helper',title:'Если постоянно докручиваете ответы — закрепите правила один раз',text:'Для повторяющейся работы можно заранее зафиксировать ваш тон, формат, ограничения и правила проверки. Тогда новый чат начинается не с объяснений заново, а с уже настроенного помощника.',terms:['почему chatgpt и другие нейросети отвечают шаблонно','как улучшить ответ нейросети','просить варианты']},
    '/kak-ne-poteryat-perepiski-s-ii/': {mode:'soft',source:'guide-chat-history-ai-helper',title:'Важен не старый чат, а правила, по которым помощник работает',text:'Если вы возвращаетесь к одной и той же задаче, не нужно зависеть от одной длинной переписки. Соберите постоянную инструкцию: роль помощника, контекст, стиль, ограничения и проверку результата.',terms:['переписк','новый чат','контекст']},
    '/kak-sobrat-lichnuyu-bazu-znaniy-s-pomoshchyu-neyroseti/': {mode:'soft',source:'guide-knowledge-base-ai-helper',title:'Следующий шаг — настроить помощника под вашу систему работы',text:'База знаний хранит материалы. ИИ-помощник задаёт постоянные правила, как с ними работать: что выделять, в каком формате отвечать, чего не придумывать и что проверять перед результатом.',terms:['баз','система','нейросет']},

    '/kak-sdelat-neyroset-lichnym-pomoshchnikom/': {mode:'full',source:'guide-personal-helper-ai-helper',title:'Можно не собирать помощника вручную',text:'Вы уже знаете основу: одна повторяющаяся задача, понятный вход, формат результата, ограничения и проверка. В мастере можно пройти эти шаги по порядку, проверить помощника на реальной мини-задаче и получить готовую персональную инструкцию.',terms:['универсальная инструкция помощника','пример: помощник по письмам','один помощник']},
    '/kak-nauchit-neyroset-pisat-v-svoem-stile/': {mode:'full',source:'guide-writing-style-ai-helper',title:'Закрепите свой стиль в отдельном ИИ-помощнике',text:'Если вы регулярно пишете посты, письма или тексты, голосовой профиль, запреты, тон и формат можно собрать не для одного запроса, а как постоянные правила помощника. Сначала проверьте его на реальном тексте, затем сохраните готовую инструкцию.',terms:['голосового профиля','так не пишу','памятка']},
    '/svoya-biblioteka-promptov/': {mode:'soft',source:'guide-prompt-library-ai-helper',title:'Библиотека промптов хранит запросы. Помощник хранит правила всей задачи',text:'Если один и тот же шаблон уже используется регулярно, следующий шаг — собрать вокруг него постоянный контекст, стиль, ограничения и правила проверки. Тогда каждый новый чат не начинается с настройки заново.',terms:['повторяющихся задач','библиотек','шаблон']},
    '/kak-vesti-bolshoy-proekt-s-pomoshchyu-neyroseti/': {mode:'soft',source:'guide-long-project-ai-helper',title:'Для повторяющейся части проекта можно сделать отдельного помощника',text:'Большой проект состоит из разных задач, и делать одного помощника «для всего проекта» не нужно. Но повторяющуюся работу — протоколы, статусы, разбор заметок или подготовку следующего шага — можно закрепить отдельной персональной инструкцией.',terms:['пять опор длинного проекта','работайте с ближайшим этапом','фиксируйте то, что уже выбрано']},
    '/rasshifrovka-audio-neyrosetyu/': {mode:'soft',source:'guide-transcription-ai-helper',title:'Регулярно разбираете встречи или голосовые? Закрепите формат один раз',text:'Если после каждой расшифровки вы снова просите выделить решения, задачи, сроки и открытые вопросы, эти правила можно сохранить в отдельном ИИ-помощнике и использовать для каждой новой записи.',terms:['встреч','расшифров','получил текст']},

    '/neyroset-v-rabote-gde-ekonomit-chasy/': {mode:'full',source:'guide-ai-at-work-ai-helper',title:'Нашли повторяющуюся рабочую задачу? Настройте под неё помощника',text:'Если нейросеть уже экономит вам время на письмах, заметках, подготовке встреч или другой повторяющейся работе, не нужно каждый раз задавать одни и те же правила. Соберите одного помощника под конкретную задачу и используйте готовую персональную инструкцию снова и снова.',terms:['где ии действительно экономит','рабочие задачи','повторя']},
    '/kak-provesti-reviziyu-zhizni-s-pomoshchyu-ii/': {mode:'soft',source:'guide-life-audit-ai-helper',title:'Регулярный разбор дел можно превратить в отдельного помощника',text:'Если вы периодически выгружаете дела, документы, расходы и планы, помощник может каждый раз разбирать их по одним и тем же правилам: что срочно, что проверить, что отложить и какие данные ещё нужны.',terms:['выгрузить всё из головы','ближайших действий','план']},
    '/kak-prevratit-opyt-v-konsultatsiyu-ili-produkt-s-pomoshchyu-ii/': {mode:'soft',source:'guide-consulting-product-ai-helper',title:'Проводите похожие консультации? Закрепите рабочий сценарий один раз',text:'Для повторяющихся консультаций можно настроить помощника, который по вашим заметкам собирает итоги, договорённости, следующие шаги или черновик ответа клиенту — в вашем стиле и без выдуманных деталей.',terms:['консультац','повторяющуюся проблему','продукт']},
    '/kak-podgotovitsya-k-obrashcheniyu-v-bank-ili-vedomstvo-s-pomoshchyu-ii/': {mode:'soft',source:'guide-bank-agency-ai-helper',title:'Если обращения повторяются, задайте помощнику постоянные правила',text:'Помощник может каждый раз одинаково собирать факты, хронологию, документы, вопросы и недостающие данные — без необходимости заново объяснять структуру работы в каждом чате.',terms:['собрать факты','хронолог','обращен']},
    '/rezyume-i-sobesedovanie-posle-45/': {mode:'soft',source:'guide-resume-ai-helper',title:'Откликаетесь на несколько вакансий? Настройте помощника под адаптацию резюме',text:'Если вы регулярно меняете акценты резюме под вакансии или готовите ответы для собеседований, можно один раз закрепить ваш опыт, стиль, ограничения и правила проверки — а дальше работать с каждой новой вакансией по одной схеме.',terms:['адаптировать резюме','ваканси','собеседован']}
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
