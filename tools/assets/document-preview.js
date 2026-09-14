(() => {
  'use strict';
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
  const track = (goal, params = {}) => {
    if (typeof window.ym === 'function') window.ym(111385663, 'reachGoal', goal, params);
  };
  const setError = (message) => {
    errorBox.textContent = message;
    errorBox.classList.toggle('hidden', !message);
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
      const response = await fetch(`${cfg.url}/functions/v1/${cfg.previewFunction || 'document-preview'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: cfg.publishableKey },
        body: JSON.stringify({ source_text: text, goal }),
      });
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
      track('document_preview_ready', { goal, run_id: data.run_id || '' });
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
