(() => {
  'use strict';

  const STORAGE_KEY = 'proverjdo.contract.v1';
  const byId = (id) => document.getElementById(id);
  const config = window.__SUPABASE_CONFIG__ || {};

  function saveDraft(payload) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }

  function loadDraft() {
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function setupCheck() {
    const form = byId('contract-check-form');
    if (!form) return;
    const source = byId('source-text');
    const error = byId('check-error');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const text = source?.value?.trim() || '';
      if (!text) {
        error.textContent = 'Сначала загрузите PDF, DOCX или TXT с текстовым слоем.';
        return;
      }
      const data = new FormData(form);
      saveDraft({
        source_text: text,
        role: String(data.get('role') || ''),
        focus: String(data.get('focus') || ''),
        signed: String(data.get('signed') || ''),
        created_at: new Date().toISOString(),
      });
      location.assign('../scan/');
    });
  }

  async function callFunction(name, body) {
    if (!config.url || !name) throw new Error('BACKEND_NOT_CONFIGURED');
    const response = await fetch(`${config.url}/functions/v1/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || 'REQUEST_FAILED');
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
    const page = document.body.dataset.page;
    if (page !== 'scan') return;
    const draft = loadDraft();
    if (!draft?.source_text) {
      location.replace('../check/');
      return;
    }
    const status = byId('scan-status');
    const content = byId('scan-content');
    const unavailable = byId('scan-unavailable');
    const scanFunction = config.contractScanFunction;
    if (!scanFunction) {
      status?.classList.add('hidden');
      unavailable?.classList.remove('hidden');
      return;
    }
    try {
      const data = await callFunction(scanFunction, {
        scenario: 'contract_check_preview',
        source_text: draft.source_text,
        role: draft.role,
        focus: draft.focus,
        signed: draft.signed,
      });
      renderScan(data);
      status?.classList.add('hidden');
      content?.classList.remove('hidden');
    } catch {
      if (status) status.textContent = 'Не удалось выполнить экспресс-проверку. Попробуйте ещё раз.';
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
      const paymentFunction = config.contractPaymentFunction;
      if (!paymentFunction) {
        error.textContent = 'Оплата 490 ₽ пока не включена в backend. Старый тариф 290 ₽ здесь намеренно не используется.';
        error.classList.remove('hidden');
        return;
      }
      submit.disabled = true;
      try {
        const draft = loadDraft();
        const email = String(new FormData(form).get('email') || '').trim().toLowerCase();
        const data = await callFunction(paymentFunction, {
          product_id: 'contract_check_490',
          email,
          context: draft ? { role: draft.role, focus: draft.focus, signed: draft.signed } : {},
        });
        if (!data.payment_url) throw new Error('PAYMENT_URL_MISSING');
        location.assign(data.payment_url);
      } catch {
        error.textContent = 'Не удалось создать платёж. Попробуйте ещё раз.';
        error.classList.remove('hidden');
        submit.disabled = false;
      }
    });
  }

  setupCheck();
  setupScan();
  setupPayment();
})();
