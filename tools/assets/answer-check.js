(() => {
  const form = document.getElementById('answer-check-form');
  const result = document.getElementById('answer-check-preview');
  const error = document.getElementById('answer-check-error');
  const submit = document.getElementById('answer-check-submit');
  const fileInput = document.getElementById('answer-file');
  const fileStatus = document.getElementById('answer-file-status');
  if (!form || !result || !submit) return;

  const endpoint = 'https://vhssshjcrirsuiijolwq.supabase.co/functions/v1/answer-check-scan';
  const MAX_FILE = 8 * 1024 * 1024;
  const allowedExt = new Set(['jpg', 'jpeg', 'pdf', 'heic', 'heif']);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let heicLoader = null;
  const q = new URLSearchParams(location.search);
  let source = String(q.get('from') || '').trim();
  let placement = String(q.get('placement') || '').trim();
  try {
    if (source) sessionStorage.setItem('ded.answer_check.source', source);
    else source = sessionStorage.getItem('ded.answer_check.source') || '';
    if (placement) sessionStorage.setItem('ded.answer_check.placement', placement);
    else placement = sessionStorage.getItem('ded.answer_check.placement') || '';
  } catch {}
  const track = (goal, params = {}) => {
    const payload = { product: 'answer_check_290', source: source || 'direct', placement, ...params };
    if (typeof window.dedTrack === 'function') window.dedTrack(goal, payload);
    else if (typeof window.ym === 'function') window.ym(111385663, 'reachGoal', goal, payload);
  };

  function extOf(name) {
    const parts = String(name || '').toLowerCase().split('.');
    return parts.length > 1 ? parts.pop() : '';
  }

  function validateFile(file) {
    if (!file) return;
    const ext = extOf(file.name);
    if (!allowedExt.has(ext)) throw new Error('Поддерживаются только JPG, PDF и HEIC.');
    if (file.size > MAX_FILE) throw new Error('Файл больше 8 МБ. Выберите файл меньшего размера.');
  }

  function loadHeic2Any() {
    if (window.heic2any) return Promise.resolve(window.heic2any);
    if (heicLoader) return heicLoader;
    heicLoader = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => window.heic2any ? resolve(window.heic2any) : reject(new Error('HEIC_CONVERTER_MISSING'));
      script.onerror = () => reject(new Error('HEIC_CONVERTER_LOAD_FAILED'));
      document.head.appendChild(script);
    });
    return heicLoader;
  }

  async function prepareFile(file) {
    if (!file) return null;
    validateFile(file);
    const ext = extOf(file.name);
    if (ext !== 'heic' && ext !== 'heif') return file;
    if (fileStatus) fileStatus.textContent = 'Преобразуем HEIC в JPG…';
    try {
      const convert = await loadHeic2Any();
      const converted = await convert({ blob: file, toType: 'image/jpeg', quality: 0.92 });
      const blob = Array.isArray(converted) ? converted[0] : converted;
      const base = file.name.replace(/\.(heic|heif)$/i, '');
      const jpeg = new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
      if (jpeg.size > MAX_FILE) throw new Error('После преобразования файл больше 8 МБ.');
      if (fileStatus) fileStatus.textContent = `HEIC готов: ${jpeg.name}`;
      return jpeg;
    } catch {
      throw new Error('Не удалось прочитать HEIC. Попробуйте сохранить изображение как JPG и загрузить снова.');
    }
  }

  fileInput?.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file) { if (fileStatus) fileStatus.textContent = ''; return; }
    try {
      validateFile(file);
      if (fileStatus) fileStatus.textContent = `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} МБ`;
    } catch (e) {
      if (fileStatus) fileStatus.textContent = '';
      error.textContent = e?.message || 'Проверьте файл.';
      fileInput.value = '';
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    result.classList.add('hidden');
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = 'Проверяем…';

    try {
      const answerText = form.elements.answer_text.value.trim();
      const selectedFile = fileInput?.files?.[0] || null;
      if (!answerText && !selectedFile) throw new Error('Вставьте ответ нейросети или загрузите JPG, PDF или HEIC.');
      if (answerText && answerText.length < 40 && !selectedFile) throw new Error('Вставьте ответ нейросети целиком — хотя бы несколько предложений.');

      const preparedFile = await prepareFile(selectedFile);
      track('answer_check_free_start', { mode: form.elements.mode.value, input_type: preparedFile ? 'file' : 'text' });
      let response;
      if (preparedFile) {
        const body = new FormData();
        body.append('original_question', form.elements.original_question.value.trim());
        body.append('answer_text', answerText);
        body.append('mode', form.elements.mode.value);
        body.append('answer_file', preparedFile, preparedFile.name);
        response = await fetch(endpoint, { method: 'POST', body });
      } else {
        const body = {
          original_question: form.elements.original_question.value.trim(),
          answer_text: answerText,
          mode: form.elements.mode.value,
        };
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body),
        });
      }

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.run_id) throw new Error(data.message || 'Не удалось выполнить проверку.');

      const flags = Array.isArray(data.first_claims) ? data.first_claims : [];
      const flagHtml = flags.length ? flags.map((c) => `
        <li class="answer-preview-item">
          <strong>${esc(c.claim)}</strong>
          <span>${esc(c.reason)}</span>
        </li>`).join('') : '<li class="answer-preview-item"><span>В первых пунктах явных проблем не найдено.</span></li>';

      result.innerHTML = `
        <div class="panel answer-preview-card">
          <p class="section-kicker">Предварительный результат</p>
          <h2 class="answer-preview-title">${esc(data.summary || 'Проверка готова')}</h2>
          <p class="answer-preview-text">${esc(data.preview_analysis || '')}</p>
          <h3>Что проверить в первую очередь</h3>
          <ul class="answer-preview-list">${flagHtml}</ul>
        </div>
        <div class="price-card answer-pay-card">
          <p class="section-kicker">Полная проверка</p>
          <h2>Открыть полную проверку — 290 ₽</h2>
          <p>В полной версии: все проверяемые утверждения, источники, сомнительные места, красные флаги, противоречия, чек-лист и итоговая рекомендация.</p>
          <form id="answer-check-payment-form" action="https://vhssshjcrirsuiijolwq.supabase.co/functions/v1/answer-check-payment" method="post">
            <input type="hidden" name="run_id" value="${esc(data.run_id)}">
            <label class="field-label" for="answer-pay-email">Электронная почта</label>
            <input class="input" id="answer-pay-email" name="email" type="email" autocomplete="email" required placeholder="name@example.com">
            <label class="payment-consent"><input type="checkbox" required> <span>Принимаю <a href="/tools/document/offer/">оферту</a>, <a href="/tools/document/privacy/">политику конфиденциальности</a> и <a href="/tools/document/refund/">условия возврата</a>.</span></label>
            <button class="button button-full" type="submit">Оплатить 290 ₽ и открыть полный результат</button>
          </form>
        </div>`;
      result.classList.remove('hidden');
      track('answer_check_preview_ready', { mode: form.elements.mode.value, run_id: data.run_id });
      const paymentForm = document.getElementById('answer-check-payment-form');
      paymentForm?.addEventListener('submit', () => {
        track('answer_check_checkout', { run_id: data.run_id });
      }, { once: true });
      result.scrollIntoView({behavior:'smooth', block:'start'});
    } catch (e) {
      error.textContent = e?.message || 'Не удалось выполнить проверку. Попробуйте ещё раз.';
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });
})();
