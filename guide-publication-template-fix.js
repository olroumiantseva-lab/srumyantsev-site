(() => {
  const normalizePath = (value) => value.endsWith('/') ? value : `${value}/`;
  const path = normalizePath(window.location.pathname);
  const configs = window.__DED_PUBLICATION_CONFIGS__ || {};
  if (!configs[path]) return;

  const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  const convertGeneratedIllustrations = () => {
    document.querySelectorAll('.publication-illustration[data-publication-illustration]').forEach((figure) => {
      if (figure.querySelector('.guide-visual')) return;
      const caption = figure.querySelector('figcaption')?.textContent.trim() || 'Ситуация → Разбор → Вывод';
      const labels = caption.split('→').map((part) => part.trim()).filter(Boolean);
      while (labels.length < 3) labels.push(labels.length === 1 ? 'Разбор' : 'Вывод');

      const oldImage = figure.querySelector('img');
      const visual = document.createElement('div');
      visual.className = 'guide-visual';
      visual.setAttribute('role', 'img');
      visual.setAttribute('aria-label', caption);

      labels.slice(0, 3).forEach((label) => {
        const card = document.createElement('span');
        card.className = 'guide-art-card';
        card.textContent = label;
        visual.appendChild(card);
      });

      if (oldImage) oldImage.replaceWith(visual);
      figure.classList.add('guide-inline-illustration');
    });
  };

  const wrapQuestionHeading = (heading, compact = false) => {
    if (!heading || heading.closest('details, .faq-section, .ded-block')) return;
    const parentSection = heading.closest('.seo-body > section');
    if (!parentSection && heading.parentElement?.classList.contains('seo-body') === false) return;

    const details = document.createElement('details');
    details.className = compact ? 'guide-question guide-question-compact' : 'guide-question';
    const summary = document.createElement('summary');
    summary.textContent = heading.textContent.trim();
    const answer = document.createElement('div');
    answer.className = 'guide-question-answer';

    let node = heading.nextSibling;
    while (node) {
      const next = node.nextSibling;
      if (!parentSection && node.nodeType === Node.ELEMENT_NODE && /^(H2|SECTION|DETAILS)$/.test(node.tagName)) break;
      answer.appendChild(node);
      node = next;
    }

    heading.replaceWith(details);
    details.append(summary, answer);
  };

  const normalizeQuestionSections = () => {
    const body = document.querySelector('.seo-body');
    if (!body) return;

    Array.from(body.querySelectorAll(':scope > section')).forEach((section) => {
      if (section.classList.contains('faq-section') || section.querySelector(':scope > details.guide-question')) return;
      const heading = section.querySelector(':scope > h2');
      if (!heading || !heading.textContent.trim().includes('?')) return;
      wrapQuestionHeading(heading);
    });

    Array.from(body.querySelectorAll(':scope > h2')).forEach((heading) => {
      if (heading.textContent.trim().includes('?')) wrapQuestionHeading(heading);
    });

    Array.from(body.querySelectorAll('h3')).forEach((heading) => {
      if (heading.textContent.trim().includes('?')) wrapQuestionHeading(heading, true);
    });
  };

  onReady(() => {
    convertGeneratedIllustrations();
    normalizeQuestionSections();
  });
})();
