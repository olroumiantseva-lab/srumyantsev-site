(() => {
  const status = document.getElementById('ai-helper-complete-status');
  const error = document.getElementById('ai-helper-complete-error');
  const fallback = document.getElementById('ai-helper-complete-fallback');
  const params = new URLSearchParams(location.search);
  const orderId = params.get('order_id') || '';
  const config = window.__SUPABASE_CONFIG__ || {};
  const key = `ai_helper_checkout_${orderId}`;
  const checkoutToken = localStorage.getItem(key) || '';

  const fail = (message) => {
    status.textContent = 'Не удалось открыть настройку автоматически.';
    error.textContent = message;
    fallback.style.display = 'block';
  };

  if (!/^\d+$/.test(orderId) || !checkoutToken || !config.url) {
    fail('Не найдено подтверждение покупки в этом браузере. Если оплата уже прошла, не оплачивайте повторно.');
    return;
  }

  let tries = 0;
  const run = async () => {
    tries += 1;
    try {
      const headers = {'Content-Type':'application/json'};
      if (config.publishableKey) headers.apikey = config.publishableKey;
      const response = await fetch(`${config.url}/functions/v1/ai-helper-success-access`, {
        method:'POST', headers, cache:'no-store',
        body: JSON.stringify({order_id:Number(orderId), checkout_token:checkoutToken})
      });
      const payload = await response.json().catch(() => ({}));
      if (response.ok && payload?.setup_url) {
        localStorage.removeItem(key);
        status.textContent = 'Оплата подтверждена. Открываем настройку…';
        location.replace(payload.setup_url);
        return;
      }
      if (response.status === 409 && tries < 61) {
        status.textContent = 'Оплата принята. Ждём подтверждение платёжной системы…';
        setTimeout(run, 2000);
        return;
      }
      fail(payload?.message || 'Платёж подтверждён не полностью. Попробуйте открыть страницу ещё раз через минуту.');
    } catch {
      if (tries < 61) { setTimeout(run, 2000); return; }
      fail('Не удалось связаться с сервисом. Попробуйте обновить страницу.');
    }
  };
  run();
})();