(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': {
      source: 'guide-letter',
      title: 'Не хотите разбирать документ вручную?',
      text: 'Загрузите документ — сервис бесплатно покажет первые 2–3 абзаца разбора, чтобы вы могли оценить результат. Он объяснит суть документа и выделит действительно важные моменты.',
      price: 'Разбор одного документа — 290 ₽. Не требуется регистрация и привязка карты к сервису.',
      button: 'Разобрать документ бесплатно'
    }
  };
  const config = configs[path];
  if (!config) return;

  const body = document.querySelector('.seo-body');
  if (!body || document.querySelector('[data-document-product-cta]')) return;

  const dateCard = document.querySelector('.guide-date-card');
  if (dateCard) {
    const labels = [...dateCard.querySelectorAll('small')];
    if (labels.length > 1) labels.slice(1).forEach((node) => node.remove());
  }

  const mainTemplateHeading = [...body.querySelectorAll('h2')]
    .find((node) => node.textContent.trim() === 'Как понять документ с помощью нейросети');
  if (mainTemplateHeading) {
    const section = mainTemplateHeading.closest('section');
    const intro = section?.querySelector('h2 + p');
    if (intro && !section.querySelector('[data-document-service-bridge]')) {
      const bridge = document.createElement('p');
      bridge.dataset.documentServiceBridge = 'true';
      bridge.innerHTML = 'Можно собирать такой разбор вручную по промптам ниже. А можно просто загрузить документ — сервис сам разложит его по срокам, суммам, требованиям, рискам и следующим шагам.';
      intro.insertAdjacentElement('afterend', bridge);
    }
  }

  const style = document.createElement('style');
  style.textContent = `
    .document-product-cta{margin:34px 0;padding:26px 28px;border:2px solid #58432f;border-radius:18px;background:#fff8e8;box-shadow:0 8px 0 rgba(88,67,47,.12)}
    .document-product-cta h2{margin:0 0 10px;font-size:clamp(26px,4vw,36px);line-height:1.08}
    .document-product-cta p{margin:0 0 18px;max-width:760px}
    .document-product-cta .document-product-price{font-weight:700;margin:14px 0 18px}
    .document-product-cta .button{display:inline-flex;text-decoration:none}
    .document-product-cta small{display:block;margin-top:12px;opacity:.72}
  `;
  document.head.appendChild(style);

  const makeCta = (variant) => {
    const box = document.createElement('aside');
    box.className = 'document-product-cta';
    box.dataset.documentProductCta = variant;
    box.innerHTML = `<h2>${config.title}</h2><p>${config.text}</p><p class="document-product-price">${config.price}</p><a class="button" href="/tools/document/?from=${encodeURIComponent(config.source)}&placement=${encodeURIComponent(variant)}">${config.button}</a><small>Сервис помогает понять документ, но не заменяет консультацию профильного специалиста.</small>`;
    box.querySelector('a').addEventListener('click', () => {
      if (typeof window.ym === 'function') {
        window.ym(111385663, 'reachGoal', 'document_product_click', {
          from: path,
          placement: variant,
          product: 'document_explain_290'
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
