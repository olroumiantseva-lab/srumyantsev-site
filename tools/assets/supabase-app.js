(() => {
  const config = window.__SUPABASE_CONFIG__ ?? {};
  if (!config.url || !config.publishableKey) return;

  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error('SDK_LOAD_FAILED'));
    document.head.append(script);
  });

  const text = (node, value) => { if (node) node.textContent = value; };
  const byId = (id) => document.getElementById(id);
  const errorMessage = (error, fallback) => error?.context?.json?.message || error?.message || fallback;
  const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    const hash = new URLSearchParams(location.hash.slice(1));
    const query = new URLSearchParams(location.search);
    if (hash.get('error') || query.get('error')) {
      const target = byId('login-error');
      text(target, 'Ссылка устарела или уже использована. Получите новую ссылку для входа.');
      history.replaceState({}, document.title, location.pathname);
    }

    const { data: { session } } = await client.auth.getSession();
    const protectedPage = document.body.dataset.protected === 'true';
    if (protectedPage && !session) {
      location.replace(`/tools/login/?return_to=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    document.querySelectorAll('[data-logout]').forEach((link) => link.addEventListener('click', async (event) => {
      event.preventDefault();
      await client.auth.signOut();
      location.replace('/tools/login/');
    }));

    const loginForm = byId('login-form');
    if (loginForm) {
      if (session) {
        loginForm.classList.add('hidden');
        const success = byId('login-success');
        success.classList.remove('hidden');
        success.querySelector('h2').textContent = 'Вы уже вошли';
        success.querySelector('p').textContent = 'Можно продолжить работу с документами.';
      }
      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = byId('email');
        const error = byId('login-error');
        if (!email.checkValidity()) { text(error, 'Проверьте адрес электронной почты.'); email.focus(); return; }
        const button = loginForm.querySelector('button');
        button.disabled = true;
        text(error, '');
        const returnTo = query.get('return_to') || '/tools/document/app/';
        const allowedReturnPaths = new Set([
          '/tools/document/app/',
          '/tools/document/history/',
          '/tools/document/result/',
        ]);
        let returnToUrl;
        try {
          returnToUrl = new URL(returnTo, location.origin);
        } catch {
          returnToUrl = new URL('/tools/document/app/', location.origin);
        }
        const redirect = returnToUrl.origin === location.origin && allowedReturnPaths.has(returnToUrl.pathname)
          ? returnToUrl.toString()
          : new URL('/tools/document/app/', location.origin).toString();
        const { error: authError } = await client.auth.signInWithOtp({
          email: email.value.trim(),
          options: { emailRedirectTo: redirect, shouldCreateUser: false },
        });
        button.disabled = false;
        if (authError) { text(error, 'Не удалось отправить ссылку. Попробуйте ещё раз.'); return; }
        loginForm.classList.add('hidden');
        const success = byId('login-success');
        success.classList.remove('hidden');
        success.querySelector('h2').textContent = 'Проверьте почту';
        success.querySelector('p').textContent = 'Откройте одноразовую ссылку из письма. Она действует ограниченное время.';
        success.querySelector('a').classList.add('hidden');
        success.focus();
      });
    }

    if (!session) return;
    await refreshBalance(client);
    if (byId('analysis-form')) setupAnalysis(client);
    if (byId('history-list')) await loadHistory(client);
    if (document.body.dataset.page === 'result') await loadResult(client);
  }

  async function refreshBalance(client) {
    const { data, error } = await client.rpc('get_my_credit_balance');
    if (error) return;
    document.querySelectorAll('[data-balance]').forEach((node) => text(node, `Осталось разборов: ${data}`));
  }

  function selectedGoals() {
    return [...document.querySelectorAll('input[name="goal"]:checked')].map((input) => input.value);
  }

  function setupAnalysis(client) {
    const form = byId('analysis-form');
    const source = byId('source-text');
    const context = byId('user-context');
    const errorNode = byId('analysis-error');
    const button = form.querySelector('button[type="submit"]');
    const analysisFunction = config.analysisFunction || 'analyze-document';
    let activeRequestId = null;
    let activePayloadFingerprint = '';
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!source.value.trim()) { text(errorNode, 'Вставьте текст документа.'); source.focus(); return; }
      if (source.value.length > 30000) { text(errorNode, 'Документ слишком большой. Сократите текст или вставьте только нужную часть.'); return; }
      if (context.value.length > 1000) { text(errorNode, 'Сократите дополнительный контекст до 1 000 символов.'); return; }
      button.disabled = true;
      text(button, 'Разбираем…');
      text(errorNode, '');
      const payload = {
        document_type: form.elements['document-type'].value,
        goals: selectedGoals(), source_text: source.value, user_context: context.value,
      };
      const fingerprint = JSON.stringify(payload);
      if (!activeRequestId || activePayloadFingerprint !== fingerprint) {
        activeRequestId = crypto.randomUUID();
        activePayloadFingerprint = fingerprint;
      }
      const requestBody = { request_id: activeRequestId, ...payload };
      let response = await client.functions.invoke(analysisFunction, { body: requestBody });
      for (let poll = 0; !response.error && response.data?.status === 'processing' && poll < 20; poll += 1) {
        text(button, 'Разбор ещё выполняется…');
        await wait(1500);
        response = await client.functions.invoke(analysisFunction, { body: requestBody });
      }
      const { data, error } = response;
      if (error || !data?.session_id || ['processing', 'recovery_required'].includes(data.status)) {
        const fallback = data?.status === 'processing'
          ? 'Разбор ещё выполняется. Повторите проверку через минуту — новый запуск не создастся.'
          : data?.status === 'recovery_required'
          ? 'Запуск требует безопасного восстановления. Новый анализ автоматически не начнётся.'
          : 'Не удалось разобрать документ. Попробуйте ещё раз. Разбор не списан.';
        text(errorNode, errorMessage(error, fallback));
        button.disabled = false;
        text(button, 'Разобрать документ');
        await refreshBalance(client);
        return;
      }
      location.assign(`/tools/document/result/?id=${encodeURIComponent(data.session_id)}`);
    });
  }

  async function loadHistory(client) {
    const list = byId('history-list');
    const { data, error } = await client.from('document_sessions').select('id,title,document_type,created_at').order('created_at', { ascending: false });
    list.replaceChildren();
    if (error) { text(byId('history-error'), 'Не удалось загрузить историю. Попробуйте обновить страницу.'); return; }
    byId('history-empty').classList.toggle('hidden', data.length > 0);
    for (const item of data) list.append(renderHistoryCard(item, client));
  }

  function renderHistoryCard(item, client) {
    const article = document.createElement('article');
    article.className = 'history-card';
    const content = document.createElement('div');
    const meta = document.createElement('div');
    meta.className = 'history-meta';
    const date = document.createElement('span');
    date.textContent = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(item.created_at));
    const type = document.createElement('span');
    type.textContent = item.document_type;
    meta.append(date, type);
    const title = document.createElement('h2');
    title.style.fontSize = '27px';
    title.textContent = item.title;
    content.append(meta, title);
    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const open = document.createElement('a');
    open.className = 'button'; open.textContent = 'Открыть'; open.href = `/tools/document/result/?id=${encodeURIComponent(item.id)}`;
    const remove = document.createElement('button');
    remove.className = 'button button-danger'; remove.type = 'button'; remove.textContent = 'Удалить';
    remove.addEventListener('click', async () => {
      if (!confirm('Удалить этот разбор? Восстановить его будет нельзя.')) return;
      remove.disabled = true;
      const { error } = await client.functions.invoke('delete-document', { body: { session_id: item.id } });
      if (error) { remove.disabled = false; alert('Не удалось удалить разбор. Попробуйте ещё раз.'); return; }
      article.remove();
      if (!byId('history-list').children.length) byId('history-empty').classList.remove('hidden');
    });
    actions.append(open, remove);
    article.append(content, actions);
    return article;
  }

  async function loadResult(client) {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) { showResultError('Разбор не найден.'); return; }
    const { data: item, error } = await client.from('document_sessions').select('id,title,document_type,result_json,followups_used,created_at').eq('id', id).maybeSingle();
    if (error || !item) { showResultError('Разбор не найден или был удалён.'); return; }
    text(byId('result-title'), item.title);
    text(byId('result-meta'), `${item.document_type} · ${new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' }).format(new Date(item.created_at))}`);
    renderResult(item.result_json ?? {});
  }

  function showResultError(message) {
    const stack = byId('result-stack');
    stack.replaceChildren();
    const box = document.createElement('div'); box.className = 'notice'; box.textContent = message; stack.append(box);
    byId('followup-panel')?.classList.add('hidden');
  }

  function resultSection(title, content, kind = 'list', collapsible = false, extra = '') {
    if (!content || (Array.isArray(content) && !content.length)) return null;
    const container = document.createElement(collapsible ? 'details' : 'section');
    container.className = `result-card ${collapsible ? 'result-details' : ''} ${extra}`.trim();
    const heading = document.createElement(collapsible ? 'summary' : 'h2'); heading.textContent = title; container.append(heading);
    const body = document.createElement('div'); if (collapsible) body.className = 'result-details-body';
    if (kind === 'text') { const p = document.createElement('p'); p.textContent = content; body.append(p); }
    else { const ul = document.createElement('ul'); for (const value of content) { const li = document.createElement('li'); li.textContent = typeof value === 'string' ? value : JSON.stringify(value); ul.append(li); } body.append(ul); }
    container.append(body); return container;
  }

  function renderResult(result) {
    const stack = byId('result-stack'); stack.replaceChildren();
    const sections = [
      resultSection('Коротко', result.summary, 'text', false, 'result-summary'),
      resultSection('Что от вас хотят', result.required_actions),
      resultSection('Сроки', result.deadlines), resultSection('Деньги', result.amounts),
      resultSection('Что делать дальше', result.next_steps),
      resultSection('Возможные риски', result.potential_risks, 'list', false, 'result-risk'),
      resultSection('На что обратить внимание', result.important_points, 'list', true),
      resultSection('Что стоит уточнить у специалиста', result.questions_for_specialist, 'list', true),
      resultSection('Что нельзя определить из документа', result.uncertainties, 'list', true, 'result-uncertainty'),
    ].filter(Boolean);
    stack.append(...sections);
  }

  start().catch(() => {
    const node = byId('app-error') || byId('login-error');
    text(node, 'Не удалось загрузить приложение. Обновите страницу.');
  });
})();
