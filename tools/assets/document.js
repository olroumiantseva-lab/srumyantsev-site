(() => {
  if (window.__SUPABASE_CONFIG__?.url && window.__SUPABASE_CONFIG__?.publishableKey) return;
  const byId = (id) => document.getElementById(id);

  const loginForm = byId('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = byId('email');
      const error = byId('login-error');
      if (!email.checkValidity()) {
        error.textContent = 'Проверьте адрес электронной почты.';
        email.focus();
        return;
      }
      error.textContent = '';
      loginForm.classList.add('hidden');
      byId('login-success').classList.remove('hidden');
      byId('login-success').focus();
    });
  }

  const analysisForm = byId('analysis-form');
  if (analysisForm) {
    const source = byId('source-text');
    const context = byId('user-context');
    const sourceCount = byId('source-count');
    const contextCount = byId('context-count');
    const formError = byId('analysis-error');
    const updateCounts = () => {
      sourceCount.textContent = `${source.value.length.toLocaleString('ru-RU')} / 30 000`;
      contextCount.textContent = `${context.value.length.toLocaleString('ru-RU')} / 1 000`;
    };
    source.addEventListener('input', updateCounts);
    context.addEventListener('input', updateCounts);
    updateCounts();
    analysisForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const length = source.value.trim().length;
      if (!length) {
        formError.textContent = 'Вставьте текст документа.';
        source.focus();
        return;
      }
      if (source.value.length > 30000) {
        formError.textContent = 'Документ слишком большой. Сократите текст или вставьте только нужную часть.';
        source.focus();
        return;
      }
      if (context.value.length > 1000) {
        formError.textContent = 'Дополнительный контекст слишком большой. Сократите его до 1 000 символов.';
        context.focus();
        return;
      }
      formError.textContent = '';
      window.location.assign('/tools/document/result/');
    });
  }

  const followupForm = byId('followup-form');
  if (followupForm) {
    let used = 0;
    const input = byId('followup-input');
    const remaining = byId('followup-remaining');
    const thread = byId('followup-thread');
    const limit = byId('followup-limit');
    followupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question || used >= 3) return;
      const user = document.createElement('div');
      user.className = 'message message-user';
      user.textContent = question;
      const answer = document.createElement('div');
      answer.className = 'message message-answer';
      answer.textContent = used === 0
        ? 'В документе указано, что ответ нужно дать до 25 августа. Способ отправки в этом фрагменте не указан.'
        : used === 1
          ? 'Нет. В представленном тексте нет требования оплатить какую-либо сумму.'
          : 'Не могу определить это из предоставленного текста. Стоит уточнить у отправителя документа.';
      thread.append(user, answer);
      used += 1;
      remaining.textContent = `Осталось уточнений: ${3 - used} из 3. Они не расходуют разборы.`;
      input.value = '';
      if (used === 3) {
        input.disabled = true;
        followupForm.querySelector('button').disabled = true;
        limit.classList.remove('hidden');
        limit.focus();
      } else {
        input.focus();
      }
    });
  }

  const historyList = byId('history-list');
  if (historyList) {
    historyList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-delete]');
      if (!button) return;
      if (window.confirm('Удалить этот разбор? Восстановить его будет нельзя.')) {
        button.closest('.history-card').remove();
        if (!historyList.querySelector('.history-card')) {
          byId('history-empty').classList.remove('hidden');
        }
      }
    });
  }
})();
