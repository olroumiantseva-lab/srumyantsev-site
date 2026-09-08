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
      if (draft.scan_id && draft.scan_preview) {
        data = draft.scan_preview;
      } else {
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
          product_id:'contract_check_490',
          source_site:'proverjdo',
          resource_id:draft.scan_id,
          email,
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

  setupCheck();
  setupScan();
  setupPayment();
})();
