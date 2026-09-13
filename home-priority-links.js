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
        <p class="section-kicker">Популярные задачи</p>
        <h2 id="home-priority-guides-title">Что ещё можно разобрать с нейросетью</h2>
      </div>
    </div>
    <div class="guide-grid home-priority-grid">
      <article class="guide-card guide-white"><h3>Проверить ответ нейросети</h3><p>Быстро проверить цифры, даты, ссылки и факты, прежде чем на них опираться.</p><a href="/kak-proverit-ne-sovrala-li-neyroset/">Проверить ответ →</a></article>
      <article class="guide-card guide-yellow"><h3>Разобрать договор перед подписанием</h3><p>Вытащить обязательства, сроки, деньги, штрафы и спорные формулировки.</p><a href="/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/">Разобрать договор →</a></article>
      <article class="guide-card guide-white"><h3>Понять анализы и заключение врача</h3><p>Расшифровать термины простыми словами и подготовить вопросы врачу.</p><a href="/kak-ponyat-analizy-i-zaklyuchenie-vracha/">Понять заключение →</a></article>
      <article class="guide-card guide-yellow"><h3>Разобраться с тарифами, кредитами и коммуналкой</h3><p>Сравнить цифры и условия, найти различия и проверить расчёты.</p><a href="/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/">Разобраться с деньгами →</a></article>
      <article class="guide-card guide-dark"><h3>Понять, что нельзя доверять нейросети</h3><p>Отделить полезную помощь от ситуаций, где решение должен принимать человек.</p><a href="/chto-nelzya-doveryat-neyroseti/">Где нельзя доверять ИИ →</a></article>
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
