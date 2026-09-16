(() => {
  const root = document.getElementById('ai-helper-wizard');
  if (!root) return;

  const steps = [...root.querySelectorAll('.wizard-step')];
  const progress = [...root.querySelectorAll('.ai-helper-progress span')];
  const next = document.getElementById('wizard-next');
  const back = document.getElementById('wizard-back');
  const error = document.getElementById('wizard-error');
  const summary = document.getElementById('prototype-summary');
  const finish = document.getElementById('prototype-finish');
  const finalBox = document.getElementById('prototype-final');
  let current = 0;

  const labels = {
    letters: 'Письма и ответы',
    documents: 'Документы и сложные тексты',
    content: 'Посты и тексты',
    meetings: 'Встречи и задачи',
    notes: 'Заметки и порядок',
    brief: 'Кратко', balanced: 'По делу, но с деталями', detailed: 'Подробно',
    neutral: 'Нейтрально', warm: 'Тепло', business: 'Делово',
    paragraphs: 'Короткие абзацы', list: 'Список', table: 'Таблица, когда уместно', mixed: 'Смешанный формат',
    ask: 'Сначала задать уточняющий вопрос', draft: 'Сделать черновик и отметить пробелы',
    no_invent: 'Не придумывать факты',
    mark_assumptions: 'Отмечать предположения',
    missing_data: 'Сообщать о нехватке данных',
    verify_list: 'Перечислять, что проверить вручную',
    high_stakes: 'Не выдавать предположение за факт в важных темах'
  };

  const value = (id) => (document.getElementById(id)?.value || '').trim();
  const checked = (name) => root.querySelector(`[name="${name}"]:checked`)?.value || '';
  const rules = () => [...root.querySelectorAll('[name="rule"]:checked')].map((node) => labels[node.value] || node.value);

  const state = () => ({
    scenario: checked('scenario'),
    task_description: value('task-description'),
    user_role: value('user-role'),
    input_type: value('input-type'),
    desired_outcome: value('desired-outcome'),
    forbidden_actions: value('forbidden-actions'),
    detail_level: checked('detail'),
    tone: checked('tone'),
    output_format: value('output-format'),
    clarification_mode: checked('clarification'),
    must_include: value('must-include'),
    good_example: value('good-example'),
    bad_patterns: value('bad-patterns'),
    verification_rules: rules(),
    custom_rule: value('custom-rule'),
    test_input: value('test-input')
  });

  const validate = (index) => {
    const s = state();
    if (index === 0 && !s.scenario) return 'Выберите одну основную задачу помощника.';
    if (index === 0 && s.task_description.length < 12) return 'Опишите задачу чуть конкретнее — хотя бы одним предложением.';
    if (index === 1 && (!s.user_role || !s.input_type || !s.desired_outcome)) return 'Заполните роль, тип входных данных и желаемый результат.';
    if (index === 5 && s.test_input.length < 12) return 'Для проверки нужна одна реальная мини-задача.';
    return '';
  };

  const renderSummary = () => {
    const s = state();
    const lines = [
      `Сценарий: ${labels[s.scenario] || '—'}`,
      `Задача: ${s.task_description || '—'}`,
      `Роль: ${s.user_role || '—'}`,
      `На входе: ${s.input_type || '—'}`,
      `На выходе: ${s.desired_outcome || '—'}`,
      `Не делать: ${s.forbidden_actions || '—'}`,
      `Ответ: ${labels[s.detail_level] || '—'} · ${labels[s.tone] || '—'} · ${labels[s.output_format] || '—'}`,
      `Если данных не хватает: ${labels[s.clarification_mode] || '—'}`,
      `Обязательно выделять: ${s.must_include || '—'}`,
      `Что раздражает: ${s.bad_patterns || '—'}`,
      `Правила надёжности: ${[...s.verification_rules, s.custom_rule].filter(Boolean).join('; ') || '—'}`,
      `Тестовая задача: ${s.test_input || '—'}`
    ];
    summary.textContent = lines.join('\n\n');
    finalBox.textContent = lines.join('\n\n');
  };

  const show = (index) => {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => step.classList.toggle('is-active', i === current));
    progress.forEach((dot, i) => dot.classList.toggle('is-active', i <= current));
    back.classList.toggle('hidden', current === 0);
    next.textContent = current === steps.length - 1 ? 'Завершить прототип' : 'Дальше';
    error.classList.add('hidden');
    if (current === steps.length - 1) renderSummary();
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  next.addEventListener('click', () => {
    const message = validate(current);
    if (message) {
      error.textContent = message;
      error.classList.remove('hidden');
      return;
    }
    if (current === steps.length - 1) {
      renderSummary();
      root.classList.add('hidden');
      finish.classList.remove('hidden');
      finish.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    show(current + 1);
  });

  back.addEventListener('click', () => show(current - 1));
})();
