(() => {
  const buttons = [...document.querySelectorAll("[data-filter]")];
  const cards = [...document.querySelectorAll("[data-guide-card]")];
  const status = document.querySelector(".filter-status");
  if (!buttons.length || !cards.length) return;

  for (const button of buttons) {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let visible = 0;
      for (const card of cards) {
        const show = filter === "all" || card.dataset.category === filter;
        card.hidden = !show;
        if (show) visible += 1;
      }
      for (const candidate of buttons) candidate.setAttribute("aria-pressed", String(candidate === button));
      status.textContent = filter === "all"
        ? `Показаны все ${visible} гайдов`
        : `${filter}: ${visible}`;
    });
  }
})();
