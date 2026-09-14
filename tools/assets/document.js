(() => {
  const byId = (id) => document.getElementById(id);

  const initCounters = () => {
    const source = byId('source-text');
    const context = byId('user-context');
    const sourceCount = byId('source-count');
    const contextCount = byId('context-count');
    if (!source || !context || !sourceCount || !contextCount) return;
    const updateCounts = () => {
      sourceCount.textContent = `${source.value.length.toLocaleString('ru-RU')} / 30 000`;
      contextCount.textContent = `${context.value.length.toLocaleString('ru-RU')} / 1 000`;
    };
    source.addEventListener('input', updateCounts);
    context.addEventListener('input', updateCounts);
    updateCounts();
  };

  const track = (goal, params = {}) => {
    if (typeof window.ym === 'function') window.ym(111385663, 'reachGoal', goal, params);
  };

  if (window.__SUPABASE_CONFIG__?.url && window.__SUPABASE_CONFIG__?.publishableKey) {
    initCounters();

    const resultStack = document.getElementById('result-stack');
    if (resultStack) {
      const formatDate = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))) return String(value ?? '');
        const [year, month, day] = String(value).split('-').map(Number);
        return new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
        }).format(new Date(Date.UTC(year, month - 1, day)));
      };

      const formatMoney = (value, currency) => {
        const amount = Number(value);
        if (!Number.isFinite(amount)) return String(value ?? '');
        try {
          return new Intl.NumberFormat('ru-RU', {
            style: 'currency', currency: currency || 'RUB', maximumFractionDigits: 2,
          }).format(amount);
        } catch {
          return `${amount.toLocaleString('ru-RU')} ${currency || ''}`.trim();
        }
      };

      const cleanLabel = (value) => String(value ?? '').trim().replace(/[\s.:;,]+$/u, '');

      const formatStructuredFacts = () => {
        resultStack.querySelectorAll('.result-card').forEach((card) => {
          const heading = card.querySelector(':scope > h2, :scope > summary');
          let title = heading?.textContent?.trim();
          if (title === 'Что стоит уточнить у специалиста') {
            heading.textContent = 'Что стоит уточнить';
            title = 'Что стоит уточнить';
          }
          if (title !== 'Сроки' && title !== 'Деньги') return;

          card.querySelectorAll('li').forEach((item) => {
            const raw = item.textContent.trim();
            if (!raw.startsWith('{')) return;
            let value;
            try { value = JSON.parse(raw); } catch { return; }
            if (!value || typeof value !== 'object' || Array.isArray(value)) return;

            if (title === 'Сроки') {
              const date = formatDate(value.date);
              const label = cleanLabel(value.label);
              const approximation = value.is_exact === false ? ' (примерно)' : '';
              item.textContent = label && date ? `${label}: ${date}${approximation}` : `${label || date}${approximation}`;
              return;
            }

            const label = cleanLabel(value.label);
            const amount = formatMoney(value.value, value.currency);
            const approximation = value.is_exact === false ? ' (примерно)' : '';
            item.textContent = label && amount ? `${label}: ${amount}${approximation}` : `${label || amount}${approximation}`;
          });
        });
      };

      const exportText = () => {
        const title = byId('result-title')?.textContent?.trim() || 'Результат разбора документа';
        const meta = byId('result-meta')?.textContent?.trim() || '';
        const body = resultStack.innerText.trim();
        return [title, meta, body, '', 'Разбор подготовлен сервисом «Дед попался в нейросети».', 'Сервис не заменяет консультацию профильного специалиста.']
          .filter(Boolean)
          .join('\n\n');
      };

      byId('result-download')?.addEventListener('click', () => {
        const text = exportText();
        if (!text.trim()) return;
        const stamp = new Date().toISOString().slice(0, 10);
        const blob = new Blob([`\uFEFF${text}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `razbor-dokumenta-${stamp}.txt`;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        const status = byId('result-export-status');
        if (status) status.textContent = 'Файл с результатом сохранён на устройство.';
        track('document_result_download');
      });

      const expandedForPrint = new Set();
      window.addEventListener('beforeprint', () => {
        resultStack.querySelectorAll('details.result-details').forEach((details) => {
          if (!details.open) {
            expandedForPrint.add(details);
            details.open = true;
          }
        });
      });
      window.addEventListener('afterprint', () => {
        expandedForPrint.forEach((details) => { details.open = false; });
        expandedForPrint.clear();
      });

      byId('result-print')?.addEventListener('click', () => {
        track('document_result_print');
        window.print();
      });

      new MutationObserver(formatStructuredFacts).observe(resultStack, { childList: true, subtree: true });
      formatStructuredFacts();
    }
    return;
  }

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
    initCounters();
    const source = byId('source-text');
    const context = byId('user-context');
    const formError = byId('analysis-error');
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
