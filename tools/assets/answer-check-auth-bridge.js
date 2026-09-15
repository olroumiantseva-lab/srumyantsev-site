(() => {
  const params = new URLSearchParams(location.search);
  const queryOrder = params.get('answer_check_order');
  const stored = localStorage.getItem('answer_check_return_to') || '';

  let returnUrl = null;
  if (queryOrder && /^\d+$/.test(queryOrder)) {
    returnUrl = new URL(`/tools/answer-check/result/?InvId=${encodeURIComponent(queryOrder)}`, location.origin);
  } else if (stored) {
    try { returnUrl = new URL(stored, location.origin); } catch {}
  }

  const config = window.__SUPABASE_CONFIG__ || {};
  if (!config.url || !config.publishableKey) return;

  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function resolveReturnUrl(client) {
    if (returnUrl && returnUrl.origin === location.origin && returnUrl.pathname === '/tools/answer-check/result/') {
      const orderId = returnUrl.searchParams.get('InvId');
      if (orderId && /^\d+$/.test(orderId)) return returnUrl;
    }

    const { data, error } = await client.functions.invoke('answer-check-latest-order', { body: {} });
    const orderId = data?.order_id;
    if (error || !orderId || !/^\d+$/.test(String(orderId))) return null;
    return new URL(`/tools/answer-check/result/?InvId=${encodeURIComponent(String(orderId))}`, location.origin);
  }

  async function finish(client, subscription) {
    if (subscription) subscription.unsubscribe();
    const target = await resolveReturnUrl(client);
    if (!target) return;
    localStorage.removeItem('answer_check_return_to');
    const orderId = target.searchParams.get('InvId');
    if (orderId) sessionStorage.removeItem(`answer_check_reauth_${orderId}`);
    location.replace(target.toString());
  }

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    const code = params.get('code');
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data: { session } } = await client.auth.getSession();
        if (session) return finish(client);
      }
    }

    let sub = null;
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) finish(client, sub);
    });
    sub = data.subscription;

    for (let i = 0; i < 40; i += 1) {
      const { data: { session } } = await client.auth.getSession();
      if (session) return finish(client, sub);
      await wait(250);
    }

    sub?.unsubscribe();
  }

  start().catch(() => {});
})();
