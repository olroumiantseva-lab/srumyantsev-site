(() => {
  const COUNTER_ID = 111385663;

  const sendGoal = (goal, params = {}) => {
    if (typeof window.ym !== 'function') return;
    window.ym(COUNTER_ID, 'reachGoal', goal, params);
  };

  const normalizePath = (href) => {
    try {
      const url = new URL(href, window.location.origin);
      return url.origin === window.location.origin ? url.pathname : url.href;
    } catch {
      return href || '';
    }
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link) return;

    const href = link.getAttribute('href') || '';
    const from = window.location.pathname;
    const to = normalizePath(href);
    const params = {
      from,
      to,
      page: from,
      anchor: link.textContent.trim().slice(0, 120)
    };

    if (link.hasAttribute('data-guide-product')) {
      const destination = new URL(href, window.location.origin);
      const goals = {
        '/tools/ai-helper/': 'ai_helper_product_click',
        '/tools/answer-check/': 'answer_check_product_click',
        '/tools/document/': 'document_product_click',
        '/tools/important-letter/': 'important_letter_product_click'
      };
      const goal = goals[destination.pathname];
      if (goal) sendGoal(goal, {
        ...params,
        source: destination.searchParams.get('from') || from,
        placement: destination.searchParams.get('placement') || 'guide_link'
      });
      return;
    }

    if (link.hasAttribute('data-guide-link')) {
      sendGoal('related_guide_click', params);
      return;
    }

    if (link.closest('#priority-related-guides')) {
      sendGoal('related_guide_click', params);
      return;
    }

    if (link.closest('#home-priority-guides') || link.closest('.guide-card')) {
      if (href.startsWith('/') && href !== '/guides/' && href !== '/praktikumy/') {
        sendGoal('guide_open', params);
      }
    }

    if (href.includes('t.me/ded_popalsya')) {
      sendGoal('telegram_click', params);
      return;
    }

    if (href.includes('max.ru/')) {
      sendGoal('max_click', params);
      return;
    }

    if (href === '/praktikumy/' || href.startsWith('/praktikumy/')) {
      sendGoal('practice_click', params);
    }
  }, { capture: true });
})();
