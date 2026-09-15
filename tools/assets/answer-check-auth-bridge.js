(() => {
  const stored = localStorage.getItem('answer_check_return_to') || '';
  let returnUrl;
  try { returnUrl = new URL(stored, location.origin); }
  catch { return; }
  if (returnUrl.origin !== location.origin || returnUrl.pathname !== '/tools/answer-check/result/') return;
  const orderId = returnUrl.searchParams.get('InvId');
  if (!orderId || !/^\d+$/.test(orderId)) return;

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

  async function finish(client) {
    localStorage.removeItem('answer_check_return_to');
    sessionStorage.removeItem(`answer_check_reauth_${orderId}`);
    location.replace(returnUrl.toString());
  }

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    if (code) {
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        const { data: { session } } = await client.auth.getSession();
        if (session) return finish(client);
      }
    }

    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        subscription.unsubscribe();
        finish(client);
      }
    });

    for (let i = 0; i < 40; i += 1) {
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        subscription.unsubscribe();
        return finish(client);
      }
      await wait(250);
    }

    subscription.unsubscribe();
  }

  start().catch(() => {});
})();
