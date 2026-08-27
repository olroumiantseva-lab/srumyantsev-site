document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.back-to-top');
  if (button) {
    const updateVisibility = () => {
      const visible = window.scrollY > 500;
      button.classList.toggle('is-visible', visible);
      button.tabIndex = visible ? 0 : -1;
    };

    button.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    window.addEventListener('scroll', updateVisibility, { passive: true });
    updateVisibility();
  }

  const faq = document.querySelector('#faq-search');
  if (!faq) return;

  faq.classList.remove('template-section');
  faq.classList.add('faq-section');

  Array.from(faq.querySelectorAll(':scope > h3')).forEach((heading) => {
    const answer = heading.nextElementSibling;
    if (!answer || answer.tagName !== 'P') return;

    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = heading.textContent.trim();
    details.append(summary, answer.cloneNode(true));
    heading.replaceWith(details);
    answer.remove();
  });
});
