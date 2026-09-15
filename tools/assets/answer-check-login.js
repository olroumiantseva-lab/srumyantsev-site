(() => {
  const config = window.__SUPABASE_CONFIG__ || {};
  const form = document.getElementById('answer-login-form');
  const email = document.getElementById('answer-login-email');
  const error = document.getElementById('answer-login-error');
  const success = document.getElementById('answer-login-success');
  if (!form || !config.url || !config.publishableKey) return;

  const query = new URLSearchParams(location.search);
  const rawReturn = query.get('return_to') || '/tools/answer-check/';
  let returnUrl;
  try { returnUrl = new URL(rawReturn, location.origin); }
  catch { returnUrl = new URL('/tools/answer-check/', location.origin); }
  if (returnUrl.origin !== location.origin || returnUrl.pathname !== '/tools/answer-check/result/') {
    returnUrl = new URL('/tools/answer-check/', location.origin);
  }
  const orderId = returnUrl.searchParams.get('InvId');

  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const authMessage = (authError) => {
    const code = String(authError?.code || '').toLowerCase();
    const message = String(authError?.message || '').toLowerCase();
    if (code.includes('over_request_rate_limit') || code.includes('rate_limit') || message.includes('rate limit') || message.includes('too many')) {
      return 'Слишком много запросов ссылки для входа. Подождите несколько минут и попробуйте ещё раз.';
    }
    if (message.includes('email rate limit')) {
      return 'Превышен лимит отправки писем. Подождите несколько минут и попробуйте ещё раз.';
    }
    if (message.includes('user not found') || message.includes('signup is disabled')) {
      return 'Учётная запись для этого email не найдена.';
    }
    return `Не удалось отправить ссылку: ${authError?.message || 'неизвестная ошибка Supabase Auth'}`;
  };

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    const hasAuthCallback = location.hash.includes('access_token=') || query.has('code') || query.has('token_hash');
    const { data: { session } } = await client.auth.getSession();
    if (session && hasAuthCallback) {
      location.replace(returnUrl.toString());
      return;
    }
    if (session) await client.auth.signOut();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      error.textContent = '';
      if (!email.checkValidity()) {
        error.textContent = 'Проверьте адрес электронной почты.';
        return;
      }
      if (!orderId || !/^\d+$/.test(orderId)) {
        error.textContent = 'Не найден номер оплаченной проверки.';
        return;
      }

      localStorage.setItem('answer_check_return_to', returnUrl.pathname + returnUrl.search);
      const button = form.querySelector('button');
      button.disabled = true;

      const callbackUrl = new URL('/tools/document/result/', location.origin);
      const { error: authError } = await client.auth.signInWithOtp({
        email: email.value.trim(),
        options: { emailRedirectTo: callbackUrl.toString(), shouldCreateUser: false },
      });

      button.disabled = false;
      if (authError) {
        localStorage.removeItem('answer_check_return_to');
        error.textContent = authMessage(authError);
        return;
      }
      form.classList.add('hidden');
      success.classList.remove('hidden');
    });
  }

  start().catch(() => {
    error.textContent = 'Не удалось загрузить вход. Обновите страницу.';
  });
})();
