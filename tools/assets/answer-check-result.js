(() => {
  const config = window.__SUPABASE_CONFIG__ || {};
  const title = document.getElementById('answer-result-title');
  const summary = document.getElementById('answer-result-summary');
  const meta = document.getElementById('answer-result-meta');
  const error = document.getElementById('answer-result-error');
  const stack = document.getElementById('answer-result-stack');
  const exportPanel = document.getElementById('answer-export-panel');
  const upsellPanel = document.getElementById('answer-upsell-panel');
  const exportStatus = document.getElementById('answer-export-status');
  const invId = new URLSearchParams(location.search).get('InvId');
  let currentResult = null;

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
  const verdictLabel = { supported:'Подтверждается', questionable:'Нужно перепроверить', likely_wrong:'Вероятно ошибка', unverifiable:'Нельзя проверить без первоисточника' };
  const trustLabel = { high:'высокий', medium:'средний', low:'низкий' };
  const headline = (r) => (r.claims||[]).some(c=>c.verdict==='likely_wrong') ? 'В ответе есть вероятная ошибка' : r.trust_level==='low' ? 'Ответ требует серьёзной перепроверки' : r.trust_level==='medium' ? 'Ответ стоит использовать с оговорками' : 'Ответ в целом выглядит надёжно';

  function buildPlainText(r){
    const lines=['ПОЛНАЯ ПРОВЕРКА ОТВЕТА НЕЙРОСЕТИ','',r.summary||'',`Уровень доверия: ${trustLabel[r.trust_level]||r.trust_level||'не определён'}`,'','ОБЩИЙ ВЫВОД',r.final_verdict||'','','ПРОВЕРЕННЫЕ УТВЕРЖДЕНИЯ'];
    for(const c of r.claims||[]){lines.push('',`${verdictLabel[c.verdict]||c.verdict||'Без оценки'}: ${c.claim||''}`);if(c.reason)lines.push(c.reason);if(c.verification_action)lines.push(`Как проверить: ${c.verification_action}`);if(c.source_url)lines.push(`Источник: ${c.source_title||c.source_url} — ${c.source_url}`);}
    if((r.red_flags||[]).length){lines.push('','ЧТО ОСОБЕННО НАСТОРАЖИВАЕТ');for(const x of r.red_flags)lines.push(`• ${x}`);}
    if((r.contradictions||[]).length){lines.push('','ПРОТИВОРЕЧИЯ В ОТВЕТЕ');for(const x of r.contradictions)lines.push(`• ${x}`);}
    if((r.source_checklist||[]).length){lines.push('','ЧТО СТОИТ СВЕРИТЬ САМОСТОЯТЕЛЬНО');for(const x of r.source_checklist)lines.push(`• ${x}`);}
    lines.push('','Результат создан сервисом «Проверка ответа» — srumyantsev.ru');
    return lines.join('\n');
  }

  function addNextSteps(r){
    const items=[];
    if((r.claims||[]).some(c=>c.verdict==='likely_wrong')) items.push('Не используйте утверждения с пометкой «Вероятно ошибка», пока не сверите их с первоисточником.');
    if((r.claims||[]).some(c=>c.verdict==='unverifiable')) items.push('Найдите исходный документ, уведомление или договор для утверждений, которые нельзя проверить без первоисточника.');
    if((r.source_checklist||[]).length) items.push('Пройдите чек-лист «Что стоит сверить самостоятельно» перед тем, как принимать решение.');
    if(!items.length)return;
    const s=section('Что делать сейчас'); s.append(list(items.slice(0,3))); stack.append(s);
  }

  async function start() {
    await loadSdk();
    const client = window.supabase.createClient(config.url, config.publishableKey, { auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true} });
    const returnTo = `/tools/answer-check/result/?InvId=${encodeURIComponent(invId)}`;
    const loginUrl = `/tools/answer-check/login-v2/?return_to=${encodeURIComponent(returnTo)}&v=20260915-2315`;
    const { data:{session} } = await client.auth.getSession();
    if (!session) { location.replace(loginUrl); return; }
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
    currentResult=r;
    title.textContent=headline(r);
    if(summary) summary.textContent=r.summary || '';
    meta.textContent=`Уровень доверия к ответу: ${trustLabel[r.trust_level] || r.trust_level || 'не определён'}`;
    const intro=section('Общий вывод'); const p=document.createElement('p'); p.textContent=r.final_verdict || ''; intro.append(p); stack.append(intro);
    if((r.red_flags||[]).length){const s=section('Что особенно настораживает'); s.append(list(r.red_flags)); stack.append(s);}
    const claims=section('Проверенные утверждения');
    for(const c of r.claims||[]){const box=document.createElement('div'); box.className='answer-claim'; const badge=document.createElement('span'); badge.className='answer-verdict'; badge.textContent=verdictLabel[c.verdict] || c.verdict; const h=document.createElement('h3'); h.textContent=c.claim; const why=document.createElement('p'); why.textContent=c.reason; const action=document.createElement('p'); const strong=document.createElement('strong'); strong.textContent='Как проверить: '; action.append(strong,document.createTextNode(c.verification_action || '')); box.append(badge,h,why,action); if(c.source_url && /^https?:\/\//i.test(c.source_url)){const src=document.createElement('p'); src.className='answer-source'; const a=document.createElement('a'); a.href=c.source_url; a.target='_blank'; a.rel='noopener'; a.textContent=c.source_title || 'Источник'; src.append('Источник: ',a); box.append(src);} claims.append(box);} stack.append(claims);
    if((r.contradictions||[]).length){const s=section('Противоречия в ответе'); s.append(list(r.contradictions)); stack.append(s);}
    if((r.source_checklist||[]).length){const s=section('Что стоит сверить самостоятельно'); s.append(list(r.source_checklist)); stack.append(s);}
    addNextSteps(r);
    if(exportPanel) exportPanel.style.display='block';
    if(upsellPanel) upsellPanel.style.display='block';
  }

  document.getElementById('answer-copy-result')?.addEventListener('click',async()=>{if(!currentResult)return;try{await navigator.clipboard.writeText(buildPlainText(currentResult));if(exportStatus)exportStatus.textContent='Разбор скопирован в буфер обмена.';}catch{if(exportStatus)exportStatus.textContent='Не удалось скопировать автоматически. Попробуйте скачать TXT.';}});
  document.getElementById('answer-download-result')?.addEventListener('click',()=>{if(!currentResult)return;const blob=new Blob([buildPlainText(currentResult)],{type:'text/plain;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`proverka-otveta-${invId}.txt`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);if(exportStatus)exportStatus.textContent='TXT-файл сохранён.';});
  document.getElementById('answer-print-result')?.addEventListener('click',()=>window.print());

  start().catch(() => { if(title) title.textContent='Не удалось загрузить результат'; if(error) error.textContent='Обновите страницу и попробуйте ещё раз.'; });
})();
