(() => {
  'use strict';

  const METRIKA_ID = 111385663;
  const ensureMetrika = () => {
    if (typeof window.ym === 'function') return;
    window.ym = function () { (window.ym.a = window.ym.a || []).push(arguments); };
    window.ym.l = Date.now();
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.appendChild(script);
    window.ym(METRIKA_ID, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
    });
  };
  ensureMetrika();

  const query = new URLSearchParams(location.search);
  let attributionSource = String(query.get('from') || '').trim();
  let attributionPlacement = String(query.get('placement') || '').trim();
  try {
    if (attributionSource) sessionStorage.setItem('ded.document.source', attributionSource);
    else attributionSource = sessionStorage.getItem('ded.document.source') || '';
    if (attributionPlacement) sessionStorage.setItem('ded.document.placement', attributionPlacement);
    else attributionPlacement = sessionStorage.getItem('ded.document.placement') || '';
  } catch {}

  const form = document.getElementById('document-preview-form');
  if (!form) return;
  const source = document.getElementById('source-text');
  const errorBox = document.getElementById('preview-error');
  const submit = document.getElementById('preview-submit');
  const result = document.getElementById('preview-result');
  const summary = document.getElementById('preview-summary');
  const analysis = document.getElementById('preview-analysis');
  const teaser = document.getElementById('preview-teaser');
  const paid = document.getElementById('preview-paid');

  const goalMap = { plain: 'simple', wants: 'wants', actions: 'actions', attention: 'attention' };
  const attribution = () => ({
    source: attributionSource || 'direct',
    placement: attributionPlacement || '',
    product: 'document_explain_290',
  });
  const track = (goal, params = {}) => {
    if (typeof window.ym === 'function') window.ym(METRIKA_ID, 'reachGoal', goal, { ...attribution(), ...params });
  };
  const setError = (message) => {
    errorBox.textContent = message;
    errorBox.classList.toggle('hidden', !message);
  };

  const requestPreview = async (cfg, text, goal) => {
    const endpoint = `${cfg.url}/functions/v1/${cfg.previewFunction || 'document-preview'}`;
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: cfg.publishableKey },
      body: JSON.stringify({ source_text: text, goal }),
    };
    let response = await fetch(endpoint, options);
    if (response.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      response = await fetch(endpoint, options);
    }
    return response;
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    setError('');
    const text = String(source?.value || '').trim();
    if (!text) {
      setError('Сначала добавьте документ, фотографии страниц или вставьте текст.');
      return;
    }
    const selected = String(new FormData(form).get('preview-goal') || 'plain');
    const goal = goalMap[selected] || 'simple';
    const cfg = window.__SUPABASE_CONFIG__ || {};
    if (!cfg.url || !cfg.publishableKey) {
      setError('Предварительный разбор пока недоступен.');
      return;
    }
    submit.disabled = true;
    submit.textContent = 'Разбираем документ…';
    track('document_preview_start', { goal });
    try {
      const response = await requestPreview(cfg, text, goal);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Не удалось выполнить предварительный разбор.');
      summary.textContent = data.summary || 'Предварительный разбор готов.';
      analysis.textContent = data.preview_analysis || '';
      teaser.replaceChildren();
      for (const item of Array.isArray(data.teaser_points) ? data.teaser_points : []) {
        const li = document.createElement('li');
        li.textContent = String(item);
        teaser.append(li);
      }
      result.classList.remove('hidden');
      paid.classList.remove('hidden');
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try { sessionStorage.setItem('ded.document.preview.run_id', String(data.run_id || '')); } catch {}
      const successParams = { goal, run_id: data.run_id || '' };
      track('document_preview_ready', successParams);
      track('document_preview_success', successParams);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Не удалось выполнить предварительный разбор.');
      track('document_preview_error', { goal });
    } finally {
      submit.disabled = false;
      submit.textContent = 'Показать бесплатный фрагмент разбора';
    }
  });

  paid?.querySelector('[data-payment-submit]')?.addEventListener('click', () => {
    track('document_preview_pay_click');
  });
})();
