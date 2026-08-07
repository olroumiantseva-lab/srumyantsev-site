document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.back-to-top');
  if (!button) return;

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
});
