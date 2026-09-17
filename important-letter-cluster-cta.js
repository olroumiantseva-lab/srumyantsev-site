(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/kak-podgotovitsya-k-obrashcheniyu-v-bank-ili-vedomstvo-s-pomoshchyu-ii/': {
      source: 'guide-bank-agency-letter',
      title: 'Факты собраны? Превратите их в готовое письмо',
      text: 'Укажите, кому пишете, что произошло и чего хотите добиться. Сервис бесплатно покажет начало письма. Полный готовый текст — 390 ₽.',
      button: 'Написать важное письмо'
    },
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': {
      source: 'guide-incoming-letter-reply',
      title: 'Поняли, что вам написали? Теперь можно подготовить ответ',
      text: 'Передайте сервису факты, документы и желаемый результат. Он бесплатно покажет начало ответа, а полный готовый текст можно открыть за 390 ₽.',
      button: 'Подготовить ответное письмо'
    }
  };

  const config = configs[path];
  if (!config) return;

  const body = document.querySelector('.seo-body');
  if (!body || document.querySelector('[data-important-letter-cta]')) return;

  // На этих двух страницах продукт «Важное письмо» ближе к намерению пользователя,
  // поэтому убираем ранее добавленные CTA разбора документа, чтобы не конкурировать самим с собой.
  document.querySelectorAll('[data-document-product-cta]').forEach((node) => node.remove());
  document.querySelectorAll('[data-document-service-bridge]').forEach((node) => node.remove());

  const style = document.createElement('style');
  style.textContent = `
    .important-letter-cta{margin:34px 0;padding:26px 28px;border:2px solid #58432f;border-radius:18px;background:#fff8e8;box-shadow:0 8px 0 rgba(88,67,47,.12)}
    .important-letter-cta h2{margin:0 0 10px;font-size:clamp(26px,4vw,36px);line-height:1.08}
    .important-letter-cta p{margin:0 0 18px;max-width:760px}
    .important-letter-cta .important-letter-price{font-weight:700;margin:14px 0 18px}
    .important-letter-cta .button{display:inline-flex;text-decoration:none}
    .important-letter-cta small{display:block;margin-top:12px;opacity:.72}
  `;
  document.head.appendChild(style);

  const makeCta = (placement) => {
    const box = document.createElement('aside');
    box.className = 'important-letter-cta';
    box.dataset.importantLetterCta = placement;
    box.innerHTML = `<h2>${config.title}</h2><p>${config.text}</p><p class="important-letter-price">Начало — бесплатно · полный текст — 390 ₽ · без подписки</p><a class="button" href="/tools/important-letter/?from=${encodeURIComponent(config.source)}&placement=${encodeURIComponent(placement)}">${config.button}</a><small>Сервис пишет только по фактам и документам, которые вы предоставили. Даты, суммы и реквизиты перед отправкой нужно проверить.</small>`;
    const link = box.querySelector('a');
    link?.addEventListener('click', () => {
      if (typeof window.ym === 'function') {
        window.ym(111385663, 'reachGoal', 'important_letter_guide_click', {
          from: path,
          source: config.source,
          placement,
          product: 'important_letter_390'
        });
      }
    });
    return box;
  };

  const firstSection = body.querySelector(':scope > section');
  if (firstSection) firstSection.insertAdjacentElement('afterend', makeCta('after_intro'));
  else body.prepend(makeCta('after_intro'));

  const sections = [...body.querySelectorAll(':scope > section')];
  const lastSection = sections.at(-1);
  if (lastSection && sections.length > 2) lastSection.insertAdjacentElement('beforebegin', makeCta('before_finish'));
})();
