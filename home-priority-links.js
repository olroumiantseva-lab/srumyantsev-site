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
        <h2 id="home-priority-guides-title">Ещё десять задач, где ИИ реально полезен</h2>
      </div>
    </div>
    <div class="guide-grid home-priority-grid">
      <article class="guide-card guide-white"><h3>Разобрать непонятный документ</h3><p>Вытащить требования, сроки, риски и следующие действия.</p><a href="/razbor-neponyatnogo-dokumenta/">Открыть гайд →</a></article>
      <article class="guide-card guide-yellow"><h3>Получить второе мнение</h3><p>Проверить один ответ другой нейросетью и найти слабые места.</p><a href="/dve-neyroseti-v-pare-vtoroe-mnenie/">Открыть гайд →</a></article>
      <article class="guide-card guide-white"><h3>Собрать библиотеку промптов</h3><p>Хранить удачные рабочие запросы и не начинать каждый раз с нуля.</p><a href="/svoya-biblioteka-promptov/">Открыть гайд →</a></article>
      <article class="guide-card guide-yellow"><h3>Сэкономить часы на работе</h3><p>Найти повторяющиеся задачи, которые разумно отдать ИИ.</p><a href="/neyroset-v-rabote-gde-ekonomit-chasy/">Открыть гайд →</a></article>
      <article class="guide-card guide-dark"><h3>Выбрать модель и режим</h3><p>Понять, когда нужна быстрая модель, анализ, поиск или глубокое рассуждение.</p><a href="/rezhimy-i-modeli-neyroseti/">Открыть гайд →</a></article>
      <article class="guide-card guide-white"><h3>Проверять ответы по системе</h3><p>Разделить черновики, факты и решения с высокой ценой ошибки.</p><a href="/lichnaya-sistema-doveriya-neyroseti/">Открыть гайд →</a></article>
      <article class="guide-card guide-yellow"><h3>Навести порядок в документах</h3><p>Структура архива, понятные имена файлов и быстрый поиск.</p><a href="/svoy-arhiv-dokumentov-neyroset/">Открыть гайд →</a></article>
      <article class="guide-card guide-white"><h3>Учиться с нейросетью</h3><p>Использовать ИИ как репетитора, а не генератор готовых ответов.</p><a href="/uchitsya-s-neyrosetyu-yazyk-professiya-tehnika/">Открыть гайд →</a></article>
      <article class="guide-card guide-yellow"><h3>Разобраться в инструкции</h3><p>Найти нужный режим или действие без чтения руководства от корки до корки.</p><a href="/kak-razobratsya-v-instruktsii-k-tehnike-s-pomoshchyu-ii/">Открыть гайд →</a></article>
      <article class="guide-card guide-dark"><h3>Вести большой проект</h3><p>Не терять контекст, решения и исходные материалы в одном бесконечном чате.</p><a href="/kak-vesti-bolshoy-proekt-s-pomoshchyu-neyroseti/">Открыть гайд →</a></article>
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
