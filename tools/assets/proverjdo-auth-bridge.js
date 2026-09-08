(() => {
  const params = new URLSearchParams(location.search);
  const orderId = params.get('proverjdo_order');
  if (!orderId || !/^\d+$/.test(orderId)) return;

  document.body.dataset.protected = 'false';
  document.body.style.visibility = 'hidden';

  const config = window.__SUPABASE_CONFIG__ || {};
  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

  (async () => {
    try {
      await loadSdk();
      const client = window.supabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        document.body.style.visibility = '';
        return;
      }
      location.replace(`/proverjdo/result/?order_id=${encodeURIComponent(orderId)}`);
    } catch {
      document.body.style.visibility = '';
    }
  })();
})();
