(() => {
  const form = document.getElementById('ai-helper-payment-form');
  if (!form) return;
  const submit = form.querySelector('button[type="submit"]');
  const error = document.getElementById('ai-helper-payment-error');
  const idle = submit.textContent;
  const pageParams = new URLSearchParams(location.search);
  let source = String(pageParams.get('from') || '').trim();
  let placement = String(pageParams.get('placement') || '').trim();
  try {
    if (source) sessionStorage.setItem('ded.ai_helper.source', source);
    else source = sessionStorage.getItem('ded.ai_helper.source') || '';
    if (placement) sessionStorage.setItem('ded.ai_helper.placement', placement);
    else placement = sessionStorage.getItem('ded.ai_helper.placement') || '';
  } catch {}
  const track = (goal, params = {}) => {
    const payload = { product:'ai_helper_1490', source:source||'direct', placement, ...params };
    if (typeof window.dedTrack === 'function') window.dedTrack(goal, payload);
    else if (typeof window.ym === 'function') window.ym(111385663, 'reachGoal', goal, payload);
  };

  document.querySelectorAll('a[href="#buy"]').forEach((link) => {
    link.addEventListener('click', () => {
      track('ai_helper_product_click', {
        from: source || 'ai_helper_landing',
        placement: placement || (link.closest('.hero') ? 'landing_hero' : 'landing_body')
      });
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    if (!form.reportValidity()) return;
    const config = window.__SUPABASE_CONFIG__ || {};
    if (!config.url) { error.textContent = 'Оплата пока не настроена.'; return; }
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim().toLowerCase();
    submit.disabled = true;
    submit.textContent = 'Создаём платёж…';
    try {
      const headers = {'Content-Type':'application/json'};
      if (config.publishableKey) headers.apikey = config.publishableKey;
      const response = await fetch(`${config.url}/functions/v1/ai-helper-payment`, {
        method:'POST', headers,
        body: JSON.stringify({email})
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.payment_url || !payload.order_id || !payload.checkout_token) throw new Error(payload.message || 'Не удалось создать платёж.');
      localStorage.setItem(`ai_helper_checkout_${payload.order_id}`, payload.checkout_token);
      track('ai_helper_checkout');
      location.assign(payload.payment_url);
    } catch (e) {
      error.textContent = e instanceof Error ? e.message : 'Не удалось создать платёж.';
      submit.disabled = false;
      submit.textContent = idle;
    }
  });
})();