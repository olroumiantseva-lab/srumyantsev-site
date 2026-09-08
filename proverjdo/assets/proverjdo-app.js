(() => {
  'use strict';
  const STORAGE_KEY='proverjdo.contract.v2';
  const byId=(id)=>document.getElementById(id);
  const config=window.__SUPABASE_CONFIG__||{};
  const saveDraft=(v)=>sessionStorage.setItem(STORAGE_KEY,JSON.stringify(v));
  const loadDraft=()=>{try{return JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null')}catch{return null}};
  const riskLabel=(value)=>({low:'низкий',medium:'средний',high:'высокий'}[String(value||'').toLowerCase()]||'не определён');

  function setupCheck(){
    const form=byId('contract-check-form'); if(!form)return;
    const source=byId('source-text'), error=byId('check-error');
    form.addEventListener('submit',(event)=>{
      event.preventDefault(); if(!form.reportValidity())return;
      const text=source?.value?.trim()||'';
      if(!text){if(error)error.textContent='Сначала загрузите PDF, DOCX или TXT с текстовым слоем.';return;}
      const data=new FormData(form);
      saveDraft({source_text:text,role:String(data.get('role')||''),focus:String(data.get('focus')||''),signed:String(data.get('signed')||''),created_at:new Date().toISOString()});
      location.assign('../scan/');
    });
  }

  async function callFunction(name,body){
    if(!config.url||!name){const e=new Error('Backend не настроен в runtime-config.');e.code='BACKEND_NOT_CONFIGURED';throw e;}
    let response;
    try{
      response=await fetch(`${config.url}/functions/v1/${name}`,{method:'POST',headers:{'Content-Type':'application/json',...(config.publishableKey?{apikey:config.publishableKey}:{})},body:JSON.stringify(body)});
    }catch(cause){const e=new Error(`Сетевой запрос к Supabase не выполнен: ${cause?.message||'fetch failed'}`);e.code='NETWORK_ERROR';throw e;}
    const raw=await response.text();
    let payload={}; try{payload=raw?JSON.parse(raw):{}}catch{payload={message:raw||`HTTP ${response.status}`}}
    if(!response.ok){const e=new Error(payload.message||`HTTP ${response.status}`);e.code=payload.error||`HTTP_${response.status}`;e.httpStatus=response.status;throw e;}
    return payload;
  }

  function renderScan(data){
    if(byId('scan-risk'))byId('scan-risk').textContent=`Риск: ${riskLabel(data.risk_level)}`;
    if(byId('scan-count'))byId('scan-count').textContent=`${Number(data.findings_count||0)} замечаний`;
    if(byId('scan-facts'))byId('scan-facts').textContent=data.summary||'Экспресс-проверка завершена.';
    const first=Array.isArray(data.findings)?data.findings[0]:null;
    if(byId('scan-first-title'))byId('scan-first-title').textContent=first?.title||'Найден пункт, который стоит проверить';
    if(byId('scan-first-why'))byId('scan-first-why').textContent=first?.why||'Откройте полный разбор, чтобы увидеть объяснение.';
    if(byId('scan-first-action'))byId('scan-first-action').textContent=first?.action||'Уточните условие у второй стороны до подписания.';
  }

  async function setupScan(){
    if(document.body.dataset.page!=='scan')return;
    const draft=loadDraft(); if(!draft?.source_text){location.replace('../check/');return;}
    const status=byId('scan-status'),content=byId('scan-content');
    try{
      let data;
      if(draft.scan_id&&draft.scan_preview)data=draft.scan_preview;
      else{
        data=await callFunction(config.contractScanFunction,{source_text:draft.source_text,role:draft.role,focus:draft.focus,signed:draft.signed});
        if(!data.scan_id){const e=new Error('Backend не вернул scan_id.');e.code='SCAN_ID_MISSING';throw e;}
        saveDraft({...draft,scan_id:data.scan_id,scan_expires_at:data.expires_at,scan_preview:data});
      }
      renderScan(data);status?.classList.add('hidden');content?.classList.remove('hidden');
    }catch(error){
      if(status){
        if(error?.code==='RATE_LIMIT')status.textContent='Лимит бесплатных проверок исчерпан. Попробуйте позже.';
        else status.textContent=`Ошибка проверки: ${error?.code||'UNKNOWN'} · ${error?.message||'без описания'}`;
      }
      console.error('contract-scan failed',error);
    }
  }

  function setupPayment(){
    const form=byId('contract-payment-form'); if(!form)return;
    const error=byId('payment-error'),submit=form.querySelector('button[type="submit"]');
    form.addEventListener('submit',async(event)=>{
      event.preventDefault();if(!form.reportValidity())return;error?.classList.add('hidden');
      const draft=loadDraft();if(!draft?.scan_id){if(error){error.textContent='Сначала выполните бесплатную проверку договора.';error.classList.remove('hidden')}return;}
      submit.disabled=true;
      try{
        const email=String(new FormData(form).get('email')||'').trim().toLowerCase();
        const data=await callFunction(config.contractPaymentFunction,{product_id:'contract_check_490',source_site:'proverjdo',resource_id:draft.scan_id,email});
        if(!data.payment_url)throw new Error('PAYMENT_URL_MISSING');
        sessionStorage.setItem('proverjdo.payment.v1',JSON.stringify({order_id:data.order_id,scan_id:draft.scan_id,email}));location.assign(data.payment_url);
      }catch(e){if(error){error.textContent=`${e?.code||'PAYMENT_ERROR'} · ${e?.message||'Не удалось создать платёж.'}`;error.classList.remove('hidden')}submit.disabled=false;}
    });
  }

  const loadSdk=()=>new Promise((resolve,reject)=>{if(window.supabase)return resolve();const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';s.crossOrigin='anonymous';s.onload=resolve;s.onerror=()=>reject(new Error('SDK_LOAD_FAILED'));document.head.append(s)});
  function fillList(id,values){const node=byId(id);if(!node)return;node.replaceChildren();for(const value of Array.isArray(values)?values:[]){const li=document.createElement('li');li.textContent=String(value);node.append(li)}if(!node.children.length){const li=document.createElement('li');li.textContent='Отдельных пунктов не найдено.';node.append(li)}}
  function renderPaidResult(payload){const result=payload.result||{};byId('result-risk').textContent=`Риск: ${riskLabel(result.risk_level)}`;byId('result-summary').textContent=result.summary||'Разбор завершён.';byId('result-context').textContent=`Роль: ${payload.role||'не указана'} · Фокус: ${payload.focus||'все риски'} · Подписан: ${payload.signed==='yes'?'да':'нет'}`;const findings=byId('result-findings');findings.replaceChildren();for(const [index,item] of (Array.isArray(result.findings)?result.findings:[]).entries()){const card=document.createElement('article');card.className='risk-card';const h3=document.createElement('h3');h3.textContent=`${index+1}. ${item.title||'Риск'}`;const why=document.createElement('p'),ws=document.createElement('strong');ws.textContent='Почему это важно. ';why.append(ws,document.createTextNode(item.why||''));const action=document.createElement('p'),as=document.createElement('strong');as.textContent='Что сделать. ';action.append(as,document.createTextNode(item.action||''));card.append(h3,why,action);findings.append(card)}if(!findings.children.length){const box=document.createElement('div');box.className='panel';box.textContent='Существенных рисков не найдено.';findings.append(box)}fillList('result-missing',result.missing_terms);fillList('result-questions',result.questions);fillList('result-checklist',result.checklist);byId('result-status').classList.add('hidden');byId('result-content').classList.remove('hidden');byId('result-heading').textContent='Полный разбор договора'}
  async function setupPaidResult(){if(document.body.dataset.page!=='paid-result')return;try{await loadSdk();const client=window.supabase.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});const query=new URLSearchParams(location.search),orderId=query.get('order_id')||query.get('InvId');if(!orderId||!/^\d+$/.test(orderId))throw new Error('ORDER_NOT_FOUND');const{data:{session}}=await client.auth.getSession();if(!session){const bridge=`/tools/document/result/?proverjdo_order=${encodeURIComponent(orderId)}`;location.replace(`/tools/login/?return_to=${encodeURIComponent(bridge)}`);return}const{data,error}=await client.functions.invoke(config.contractResultFunction||'contract-result',{body:{order_id:Number(orderId)}});if(error||!data?.result)throw new Error(error?.context?.json?.message||'RESULT_NOT_FOUND');history.replaceState({},document.title,`${location.pathname}?order_id=${encodeURIComponent(orderId)}`);renderPaidResult(data)}catch(error){byId('result-status')?.classList.add('hidden');const box=byId('result-error');if(box){box.textContent=error?.message==='ORDER_NOT_FOUND'?'Не удалось определить оплаченный заказ.':'Не удалось открыть полный результат. Проверьте, что вошли с той же почтой, которую указали при оплате.';box.classList.remove('hidden')}}}
  setupCheck();setupScan();setupPayment();setupPaidResult();
})();
