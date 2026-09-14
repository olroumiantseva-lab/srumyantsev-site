(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const commonPrice = 'Разбор одного документа — 290 ₽. Не требуется регистрация и привязка карты к сервису.';
  const commonButton = 'Разобрать документ бесплатно';
  const commonDisclaimer = 'Сервис помогает понять документ, но не заменяет консультацию профильного специалиста.';
  const configs = {
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': {
      source: 'guide-letter',
      title: 'Не хотите разбирать документ вручную?',
      text: 'Загрузите документ — сервис бесплатно покажет первые 2–3 абзаца разбора, чтобы вы могли оценить результат. Он объяснит суть документа и выделит действительно важные моменты.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/dlinnye-dokumenty-dogovor-otchet-kniga/': {
      source: 'guide-long-document',
      title: 'Есть конкретный документ, который нужно разобрать?',
      text: 'Если не хочется собирать разбор вручную по нескольким промптам, загрузите документ в сервис. Сначала вы бесплатно увидите первые 2–3 абзаца, а полный разбор отдельно соберёт требования, сроки, суммы, важные условия, риски и следующие шаги.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/kak-proverit-ne-sovrala-li-neyroset/': {
      source: 'guide-fact-check',
      title: 'Нужно разобрать сам документ, а не пересказ?',
      text: 'Загрузите исходный документ в сервис. Он работает от текста документа, отдельно показывает важные факты и то, что из документа определить нельзя. Первые 2–3 абзаца разбора можно посмотреть бесплатно.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/chto-nelzya-doveryat-neyroseti/': {
      source: 'guide-trust-boundary',
      title: 'Сначала понять документ — потом принимать решение',
      text: 'Если перед вами письмо, договор, квитанция или уведомление, сервис поможет разложить его содержание по фактам, срокам, суммам и следующим шагам. Первые 2–3 абзаца разбора доступны бесплатно.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/': {
      source: 'guide-money-documents',
      title: 'Есть квитанция, тариф или условия, которые нужно разобрать?',
      text: 'Загрузите документ — сервис выделит суммы, сроки, условия, возможные риски и то, что нужно уточнить. Первые 2–3 абзаца разбора можно посмотреть бесплатно перед оплатой полного результата.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': {
      source: 'guide-contract',
      title: 'Хотите проверить свой договор на практике?',
      text: 'Загрузите договор в сервис. Он выделит платежи, сроки, обязанности, штрафы, условия расторжения, возможные риски и вопросы, которые стоит уточнить. Первые 2–3 абзаца разбора можно посмотреть бесплатно.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/kak-podgotovitsya-k-obrashcheniyu-v-bank-ili-vedomstvo-s-pomoshchyu-ii/': {
      source: 'guide-bank-agency',
      title: 'Перед обращением сначала разберите документ',
      text: 'Если обращение начинается с письма, уведомления, ответа банка или ведомства, загрузите документ в сервис. Он поможет выделить требования, сроки, суммы, спорные места и вопросы, которые стоит задать. Первые 2–3 абзаца разбора — бесплатно.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/': {
      source: 'guide-phone-photo',
      title: 'Сфотографировали документ? Его можно сразу разобрать',
      text: 'Загрузите фото, скан, PDF или Word в сервис. Он объяснит содержание документа простыми словами и выделит важные сроки, суммы, требования и следующие шаги. Первые 2–3 абзаца разбора можно посмотреть бесплатно.',
      price: commonPrice,
      button: commonButton,
      disclaimer: commonDisclaimer
    },
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/': {
      source: 'guide-medical-document',
      title: 'Нужно объяснить медицинский документ простыми словами?',
      text: 'Загрузите заключение, выписку, результаты обследования или анализов. Сервис поможет объяснить термины, выделить факты из документа и подготовить вопросы врачу. Первые 2–3 абзаца разбора можно посмотреть бесплатно.',
      price: commonPrice,
      button: 'Объяснить медицинский документ',
      disclaimer: 'Сервис не ставит диагноз, не назначает лечение и не заменяет консультацию врача.'
    }
  };
  const config = configs[path];
  if (!config) return;

  const body = document.querySelector('.seo-body');
  if (!body || document.querySelector('[data-document-product-cta]')) return;

  const dateCard = document.querySelector('.guide-date-card');
  if (dateCard) {
    const labels = [...dateCard.querySelectorAll('small')];
    const updated = labels.filter((node) => node.textContent.trim().startsWith('Обновлено:'));
    const keep = updated[0] || labels[0];
    labels.forEach((node) => { if (node !== keep) node.remove(); });
  }

  if (path === '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/') {
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
    box.innerHTML = `<h2>${config.title}</h2><p>${config.text}</p><p class="document-product-price">${config.price}</p><a class="button" href="/tools/document/?from=${encodeURIComponent(config.source)}&placement=${encodeURIComponent(variant)}">${config.button}</a><small>${config.disclaimer || commonDisclaimer}</small>`;
    box.querySelector('a').addEventListener('click', () => {
      if (typeof window.ym === 'function') {
        window.ym(111385663, 'reachGoal', 'document_product_click', {
          from: path,
          source: config.source,
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
