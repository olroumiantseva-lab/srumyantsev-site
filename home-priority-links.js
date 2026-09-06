(() => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path !== '/') return;

  const anchor = document.querySelector('.practice.shell');
  if (!anchor || document.querySelector('#home-priority-guides')) return;

  const section = document.createElement('section');
  section.id = 'home-priority-guides';
  section.className = 'guides shell home-priority-guides';
  section.setAttribute('aria-labelledby', 'home-priority-guides-title');
  section.innerHTML = `
    <div class="section-head">
      <div>
        <p class="section-kicker">Полезно после первых шагов</p>
        <h2 id="home-priority-guides-title">Пять задач, которые стоит попробовать дальше</h2>
      </div>
    </div>
    <div class="guide-grid home-priority-grid">
      <article class="guide-card guide-white"><h3>ИИ с телефона: голосом и фотографией</h3><p>Как задавать вопросы без клавиатуры, разбирать фото, скриншоты и документы.</p><a href="/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/">Открыть гайд →</a></article>
      <article class="guide-card guide-yellow"><h3>Как понять анализы и заключение врача</h3><p>Перевести медицинские термины на понятный язык и подготовить вопросы врачу.</p><a href="/kak-ponyat-analizy-i-zaklyuchenie-vracha/">Открыть гайд →</a></article>
      <article class="guide-card guide-white"><h3>Как разобрать договор с помощью нейросети</h3><p>Найти обязательства, сроки, риски и пункты, которые стоит перепроверить.</p><a href="/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/">Открыть гайд →</a></article>
      <article class="guide-card guide-yellow"><h3>Тарифы, кредиты и коммуналка</h3><p>Разобрать условия, сравнить цифры и подготовить вопросы банку или поставщику.</p><a href="/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/">Открыть гайд →</a></article>
      <article class="guide-card guide-dark"><h3>Что нельзя доверять нейросети</h3><p>Где ИИ полезен как помощник, но не должен принимать решение за человека.</p><a href="/chto-nelzya-doveryat-neyroseti/">Открыть гайд →</a></article>
    </div>`;

  const style = document.createElement('style');
  style.textContent = `
    .home-priority-guides{padding-top:24px;padding-bottom:72px}
    .home-priority-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:18px}
    .home-priority-grid .guide-card{min-height:100%;display:flex;flex-direction:column}
    .home-priority-grid .guide-card h3{font-size:22px;line-height:1.15}
    .home-priority-grid .guide-card p{flex:1}
    @media(max-width:1100px){.home-priority-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:640px){.home-priority-guides{padding-bottom:48px}.home-priority-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
  anchor.parentNode.insertBefore(section, anchor);
})();
