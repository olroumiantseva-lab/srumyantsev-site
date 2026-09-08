(() => {
  'use strict';

  const STORAGE_KEY = 'proverjdo.contract.v2';
  const byId = (id) => document.getElementById(id);
  const config = window.__SUPABASE_CONFIG__ || {};

  function saveDraft(payload) { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); }
  function loadDraft() { try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); } catch { return null; } }

  function setupCheck() {
    const form = byId('contract-check-form');
    if (!form) return;
    const source = byId('source-text');
    const error = byId('check-error');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const text = source?.value?.trim() || '';
      if (!text) { error.textContent = 'Сначала загрузите PDF, DOCX или TXT с текстовым слоем.'; return; }
      const data = new FormData(form);
      saveDraft({ source_text:text, role:String(data.get('role')||''), focus:String(data.get('focus')||''), signed:String(data.get('signed')||''), created_at:new Date().toISOString() });
      location.assign('../scan/');
    });
  }

  async function callFunction(name, body) {
    if (!config.url || !name) throw new Error('BACKEND_NOT_CONFIGURED');
    const response = await fetch(`${config.url}/functions/v1/${name}`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', ...(config.publishableKey ? { apikey:config.publishableKey } : {}) },
      body:JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(payload.message || 'REQUEST_FAILED'); error.code = payload.error; throw error; }
    return payload;
  }

  function renderScan(data) {
    const risk = byId('scan-risk');
    const count = byId('scan-count');
    const facts = byId('scan-facts');
    const firstTitle = byId('scan-first-title');
    const firstWhy = byId('scan-first-why');
    const firstAction = byId('scan-first-action');
    if (risk) risk.textContent = `Риск: ${data.risk_level || 'не определён'}`;
    if (count) count.textContent = `${Number(data.findings_count || 0)} замечаний`;
    if (facts) facts.textContent = data.summary || 'Экспресс-проверка завершена.';
    const first = Array.isArray(data.findings) ? data.findings[0] : null;
    if (firstTitle) firstTitle.textContent = first?.title || 'Найден пункт, который стоит проверить';
    if (firstWhy) firstWhy.textContent = first?.why || 'Откройте полный разбор, чтобы увидеть объяснение.';
    if (firstAction) firstAction.textContent = first?.action || 'Уточните условие у второй стороны до подписания.';
  }

  async function setupScan() {
    if (document.body.dataset.page !== 'scan') return;
    const draft = loadDraft();
    if (!draft?.source_text) { location.replace('../check/'); return; }
    const status = byId('scan-status');
    const content = byId('scan-content');
    try {
      let data;
      if (draft.scan_id && draft.scan_preview) data = draft.scan_preview;
      else {
        data = await callFunction(config.contractScanFunction, { source_text:draft.source_text, role:draft.role, focus:draft.focus, signed:draft.signed });
        if (!data.scan_id) throw new Error('SCAN_ID_MISSING');
        saveDraft({ ...draft, scan_id:data.scan_id, scan_expires_at:data.expires_at, scan_preview:data });
      }
      renderScan(data);
      status?.classList.add('hidden');
      content?.classList.remove('hidden');
    } catch (error) {
      if (status) status.textContent = error?.code === 'RATE_LIMIT' ? 'Лимит бесплатных проверок исчерпан. Попробуйте позже.' : 'Не удалось выполнить экспресс-проверку. Попробуйте ещё раз.';
    }
  }

  function setupPayment() {
    const form = byId('contract-payment-form');
    if (!form) return;
    const error = byId('payment-error');
    const submit = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      error.classList.add('hidden');
      const draft = loadDraft();
      if (!draft?.scan_id) { error.textContent = 'Сначала выполните бесплатную проверку договора.'; error.classList.remove('hidden'); return; }
      submit.disabled = true;
      try {
        const email = String(new FormData(form).get('email') || '').trim().toLowerCase();
        const data = await callFunction(config.contractPaymentFunction, {
          product_id:'contract_check_490', source_site:'proverjdo', resource_id:draft.scan_id, email,
        });
        if (!data.payment_url) throw new Error('PAYMENT_URL_MISSING');
        sessionStorage.setItem('proverjdo.payment.v1', JSON.stringify({ order_id:data.order_id, scan_id:draft.scan_id, email }));
        location.assign(data.payment_url);
      } catch (e) {
        error.textContent = e?.message || 'Не удалось создать платёж. Попробуйте ещё раз.';
        error.classList.remove('hidden');
        submit.disabled = false;
      }
    });
  }

  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = () => reject(new Error('SDK_LOAD_FAILED'));
    document.head.append(script);
  });

  function fillList(id, values) {
    const node = byId(id); if (!node) return;
    node.replaceChildren();
    for (const value of Array.isArray(values) ? values : []) {
      const li = document.createElement('li'); li.textContent = String(value); node.append(li);
    }
    if (!node.children.length) { const li = document.createElement('li'); li.textContent = 'Отдельных пунктов не найдено.'; node.append(li); }
  }

  function renderPaidResult(payload) {
    const result = payload.result || {};
    byId('result-risk').textContent = `Риск: ${result.risk_level || 'не определён'}`;
    byId('result-summary').textContent = result.summary || 'Разбор завершён.';
    byId('result-context').textContent = `Роль: ${payload.role || 'не указана'} · Фокус: ${payload.focus || 'все риски'} · Подписан: ${payload.signed === 'yes' ? 'да' : 'нет'}`;
    const findings = byId('result-findings'); findings.replaceChildren();
    for (const [index, item] of (Array.isArray(result.findings) ? result.findings : []).entries()) {
      const card = document.createElement('article'); card.className = 'risk-card';
      const h3 = document.createElement('h3'); h3.textContent = `${index + 1}. ${item.title || 'Риск'}`;
      const why = document.createElement('p'); const whyStrong = document.createElement('strong'); whyStrong.textContent = 'Почему это важно. '; why.append(whyStrong, document.createTextNode(item.why || ''));
      const action = document.createElement('p'); const actionStrong = document.createElement('strong'); actionStrong.textContent = 'Что сделать. '; action.append(actionStrong, document.createTextNode(item.action || ''));
      card.append(h3, why, action); findings.append(card);
    }
    if (!findings.children.length) { const box = document.createElement('div'); box.className = 'panel'; box.textContent = 'Существенных рисков не найдено.'; findings.append(box); }
    fillList('result-missing', result.missing_terms);
    fillList('result-questions', result.questions);
    fillList('result-checklist', result.checklist);
    byId('result-status').classList.add('hidden');
    byId('result-content').classList.remove('hidden');
    byId('result-heading').textContent = 'Полный разбор договора';
  }

  async function setupPaidResult() {
    if (document.body.dataset.page !== 'paid-result') return;
    try {
      await loadSdk();
      const client = window.supabase.createClient(config.url, config.publishableKey, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
      const query = new URLSearchParams(location.search);
      const orderId = query.get('order_id') || query.get('InvId');
      if (!orderId || !/^\d+$/.test(orderId)) throw new Error('ORDER_NOT_FOUND');
      const { data:{ session } } = await client.auth.getSession();
      if (!session) {
        const bridge = `/tools/document/result/?proverjdo_order=${encodeURIComponent(orderId)}`;
        location.replace(`/tools/login/?return_to=${encodeURIComponent(bridge)}`);
        return;
      }
      const { data, error } = await client.functions.invoke(config.contractResultFunction || 'contract-result', { body:{ order_id:Number(orderId) } });
      if (error || !data?.result) throw new Error(error?.context?.json?.message || 'RESULT_NOT_FOUND');
      history.replaceState({}, document.title, `${location.pathname}?order_id=${encodeURIComponent(orderId)}`);
      renderPaidResult(data);
    } catch (error) {
      byId('result-status')?.classList.add('hidden');
      const box = byId('result-error');
      if (box) { box.textContent = error?.message === 'ORDER_NOT_FOUND' ? 'Не удалось определить оплаченный заказ.' : 'Не удалось открыть полный результат. Проверьте, что вошли с той же почтой, которую указали при оплате.'; box.classList.remove('hidden'); }
    }
  }

  setupCheck();
  setupScan();
  setupPayment();
  setupPaidResult();
})();
