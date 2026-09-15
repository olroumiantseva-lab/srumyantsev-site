(() => {
  const form = document.getElementById('answer-check-form');
  const result = document.getElementById('answer-check-preview');
  const error = document.getElementById('answer-check-error');
  const submit = document.getElementById('answer-check-submit');
  if (!form || !result || !submit) return;

  const endpoint = 'https://vhssshjcrirsuiijolwq.supabase.co/functions/v1/answer-check-scan';
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    result.classList.add('hidden');
    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = 'Проверяем…';

    try {
      const body = {
        original_question: form.elements.original_question.value.trim(),
        answer_text: form.elements.answer_text.value.trim(),
        mode: form.elements.mode.value,
      };
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(body),
      });
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
          <p class="section-kicker">Тест реальной оплаты</p>
          <h2>Открыть полную проверку — 19 ₽</h2>
          <p>В полной версии: все проверяемые утверждения, источники, сомнительные места, красные флаги и итоговая рекомендация.</p>
          <form action="https://vhssshjcrirsuiijolwq.supabase.co/functions/v1/answer-check-payment" method="post">
            <input type="hidden" name="run_id" value="${esc(data.run_id)}">
            <label class="field-label" for="answer-pay-email">Электронная почта</label>
            <input class="input" id="answer-pay-email" name="email" type="email" autocomplete="email" required placeholder="name@example.com">
            <label class="payment-consent"><input type="checkbox" required> <span>Принимаю <a href="/tools/document/offer/">оферту</a>, <a href="/tools/document/privacy/">политику конфиденциальности</a> и <a href="/tools/document/refund/">условия возврата</a>.</span></label>
            <button class="button button-full" type="submit">Оплатить 19 ₽ и открыть полный результат</button>
          </form>
        </div>`;
      result.classList.remove('hidden');
      result.scrollIntoView({behavior:'smooth', block:'start'});
    } catch (e) {
      error.textContent = e?.message || 'Не удалось выполнить проверку. Попробуйте ещё раз.';
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });
})();
