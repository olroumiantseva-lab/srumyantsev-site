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

  async function waitForSession(client) {
    for (let i = 0; i < 20; i += 1) {
      const { data: { session } } = await client.auth.getSession();
      if (session) return session;
      await wait(250);
    }
    return null;
  }

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });

    const session = await waitForSession(client);
    if (!session) return;

    localStorage.removeItem('answer_check_return_to');
    location.replace(returnUrl.toString());
  }

  start().catch(() => {});
})();
