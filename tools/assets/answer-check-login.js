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
  try { returnUrl = new URL(rawReturn, location.origin); } catch { returnUrl = new URL('/tools/answer-check/', location.origin); }
  const allowed = returnUrl.origin === location.origin && returnUrl.pathname === '/tools/answer-check/result/';
  if (!allowed) returnUrl = new URL('/tools/answer-check/', location.origin);

  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous'; script.onload = resolve; script.onerror = reject; document.head.appendChild(script);
  });
  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
    const { data:{session} } = await client.auth.getSession();
    if (session) { location.replace(returnUrl.toString()); return; }
    form.addEventListener('submit', async e => {
      e.preventDefault(); error.textContent=''; if(!email.checkValidity()){error.textContent='Проверьте адрес электронной почты.';return;}
      const button=form.querySelector('button');button.disabled=true;
      const { error:authError } = await client.auth.signInWithOtp({email:email.value.trim(),options:{emailRedirectTo:returnUrl.toString(),shouldCreateUser:false}});
      button.disabled=false;
      if(authError){error.textContent='Не удалось отправить ссылку. Проверьте, что используете email из оплаты.';return;}
      form.classList.add('hidden'); success.classList.remove('hidden');
    });
  }
  start().catch(()=>{error.textContent='Не удалось загрузить вход. Обновите страницу.';});
})();
