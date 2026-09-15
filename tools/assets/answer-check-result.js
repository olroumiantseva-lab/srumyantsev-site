(() => {
  const config = window.__SUPABASE_CONFIG__ || {};
  const title = document.getElementById('answer-result-title');
  const meta = document.getElementById('answer-result-meta');
  const error = document.getElementById('answer-result-error');
  const stack = document.getElementById('answer-result-stack');
  const invId = new URLSearchParams(location.search).get('InvId');
  if (!config.url || !config.publishableKey || !invId || !/^\d+$/.test(invId)) {
    if (title) title.textContent = 'Результат не найден';
    if (error) error.textContent = 'Проверьте ссылку после оплаты.';
    return;
  }

  const loadSdk = () => new Promise((resolve, reject) => {
    if (window.supabase) return resolve();
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
  const section = (heading) => { const s=document.createElement('section'); s.className='result-card'; const h=document.createElement('h2'); h.textContent=heading; s.append(h); return s; };
  const list = (values) => { const ul=document.createElement('ul'); for(const v of values||[]){const li=document.createElement('li'); li.textContent=String(v); ul.append(li);} return ul; };
  const verdictLabel = { supported:'Подтверждается', questionable:'Нужно проверить', likely_wrong:'Вероятно ошибка', unverifiable:'Нельзя проверить без первоисточника' };

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
    const returnTo = `/tools/answer-check/result/?InvId=${encodeURIComponent(invId)}`;
    const loginUrl = `/tools/answer-check/login/?return_to=${encodeURIComponent(returnTo)}`;
    const { data:{session} } = await client.auth.getSession();
    if (!session) {
      location.replace(loginUrl);
      return;
    }
    const { data, error:invokeError } = await client.functions.invoke('answer-check-result', { body:{order_id:Number(invId)} });
    if (invokeError || !data?.result) {
      const alreadyReset = sessionStorage.getItem(`answer_check_reauth_${invId}`) === '1';
      if (!alreadyReset) {
        sessionStorage.setItem(`answer_check_reauth_${invId}`, '1');
        await client.auth.signOut();
        localStorage.setItem('answer_check_return_to', returnTo);
        location.replace(loginUrl);
        return;
      }
      if (title) title.textContent = 'Полная проверка пока не открылась';
      if (error) error.textContent = data?.message || 'Не удалось подтвердить доступ к оплаченному результату.';
      return;
    }
    sessionStorage.removeItem(`answer_check_reauth_${invId}`);
    const r=data.result;
    title.textContent=r.summary || 'Полная проверка готова';
    meta.textContent=`Уровень доверия: ${r.trust_level || '—'}`;
    const intro=section('Итог'); const p=document.createElement('p'); p.textContent=r.final_verdict || ''; intro.append(p); stack.append(intro);
    const claims=section('Проверенные утверждения');
    for(const c of r.claims||[]){const box=document.createElement('div'); box.className='answer-claim'; const badge=document.createElement('span'); badge.className='answer-verdict'; badge.textContent=verdictLabel[c.verdict] || c.verdict; const h=document.createElement('h3'); h.textContent=c.claim; const why=document.createElement('p'); why.textContent=c.reason; const action=document.createElement('p'); action.innerHTML='<strong>Как проверить:</strong> '; action.append(document.createTextNode(c.verification_action || '')); box.append(badge,h,why,action); if(c.source_url && /^https?:\/\//i.test(c.source_url)){const src=document.createElement('p'); src.className='answer-source'; const a=document.createElement('a'); a.href=c.source_url; a.target='_blank'; a.rel='noopener'; a.textContent=c.source_title || 'Источник'; src.append('Источник: ',a); box.append(src);} claims.append(box);} stack.append(claims);
    if((r.red_flags||[]).length){const s=section('Красные флаги'); s.append(list(r.red_flags)); stack.append(s);}
    if((r.contradictions||[]).length){const s=section('Противоречия'); s.append(list(r.contradictions)); stack.append(s);}
    if((r.source_checklist||[]).length){const s=section('Что сверить самостоятельно'); s.append(list(r.source_checklist)); stack.append(s);}
  }
  start().catch(() => { if(title) title.textContent='Не удалось загрузить результат'; if(error) error.textContent='Обновите страницу и попробуйте ещё раз.'; });
})();
