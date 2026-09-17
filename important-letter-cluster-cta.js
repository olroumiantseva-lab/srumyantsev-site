(() => {
  const path = location.pathname.replace(/\/+$/, '/') || '/';
  const configs = {
    '/kak-podgotovitsya-k-obrashcheniyu-v-bank-ili-vedomstvo-s-pomoshchyu-ii/': {
      source: 'guide-bank-agency-letter',
      title: 'Факты собраны? Превратите их в готовое письмо',
      text: 'Укажите, кому пишете, что произошло и чего хотите добиться. Сервис бесплатно покажет начало письма. Полный готовый текст — 390 ₽.',
      button: 'Написать важное письмо',
      mode: 'primary'
    },
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': {
      source: 'guide-incoming-letter-reply',
      title: 'Поняли, что вам написали? Теперь можно подготовить ответ',
      text: 'Передайте сервису факты, документы и желаемый результат. Он бесплатно покажет начало ответа, а полный готовый текст можно открыть за 390 ₽.',
      button: 'Подготовить ответное письмо',
      mode: 'primary'
    },
    '/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/': {
      source: 'guide-money-letter',
      title: 'Нашли спорное начисление или условие? Зафиксируйте обращение письменно',
      text: 'Укажите организацию, что произошло, суммы и чего хотите добиться. Сервис подготовит письмо по вашим фактам без выдуманных норм и обещаний.',
      button: 'Подготовить обращение',
      mode: 'contextual',
      keywords: ['коммун', 'банк', 'кредит', 'тариф', 'начислен', 'списан']
    },
    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': {
      source: 'guide-contract-letter',
      title: 'Разобрали договор? Теперь можно письменно зафиксировать позицию',
      text: 'Если нужно запросить разъяснение, изменение условия, возврат денег или ответ контрагента, сервис соберёт письмо по пунктам договора и вашим фактам.',
      button: 'Написать контрагенту',
      mode: 'contextual',
      keywords: ['растор', 'штраф', 'обязан', 'срок', 'услов', 'контраг']
    },
    '/kak-sravnit-predlozheniya-masterov-i-vybrat-podryadchika-s-pomoshchyu-ii/': {
      source: 'guide-contractor-letter',
      title: 'Нужно зафиксировать договорённости с подрядчиком?',
      text: 'Опишите согласованные работы, сроки, цену и что хотите получить в ответ. Сервис поможет собрать спокойное деловое письмо без лишней резкости.',
      button: 'Написать подрядчику',
      mode: 'contextual',
      keywords: ['подряд', 'мастер', 'срок', 'смет', 'услов', 'договор']
    }
  };

  const nativeLinks = {
    '/kak-nayti-prichinu-neispravnosti-po-fotografii-s-pomoshchyu-ii/': {
      source: 'guide-repair-service-letter',
      heading: 'Подготовьте нормальное описание для специалиста',
      html: 'Если нужен не короткий мессенджер, а полноценное обращение в сервисный центр, продавцу или управляющей компании, можно <a href="/tools/important-letter/?from=guide-repair-service-letter&placement=native">собрать важное письмо по своим фактам</a>: начало сервис покажет бесплатно.'
    },
    '/smeta-na-remont-s-pomoshchyu-ii/': {
      source: 'guide-estimate-letter',
      heading: 'Найдите расходы без цены и забытые категории',
      html: 'Если после проверки сметы нужно письменно запросить у подрядчика цены, состав работ или объяснение расхождений, можно <a href="/tools/important-letter/?from=guide-estimate-letter&placement=native">подготовить письмо подрядчику</a> по уже собранным фактам и цифрам.'
    },
    '/kak-splanirovat-remont-komnaty-s-pomoshchyu-neyroseti/': {
      source: 'guide-room-renovation-letter',
      heading: 'Сначала проверить, потом покупать',
      html: 'Когда план, сроки и объём работ согласованы, полезно зафиксировать их письменно. Для этого можно <a href="/tools/important-letter/?from=guide-room-renovation-letter&placement=native">подготовить деловое письмо мастеру или подрядчику</a> и проверить формулировки до отправки.'
    }
  };

  const body = document.querySelector('.seo-body');
  if (!body) return;

  const trackLink = (link, source, placement) => {
    link?.addEventListener('click', () => {
      if (typeof window.ym === 'function') {
        window.ym(111385663, 'reachGoal', 'important_letter_guide_click', {
          from: path,
          source,
          placement,
          product: 'important_letter_390'
        });
      }
    });
  };

  const native = nativeLinks[path];
  if (native && !document.querySelector('[data-important-letter-native]')) {
    const section = [...body.querySelectorAll(':scope > section')].find((node) =>
      node.querySelector('h2')?.textContent.trim() === native.heading
    );
    if (section) {
      const paragraph = document.createElement('p');
      paragraph.dataset.importantLetterNative = native.source;
      paragraph.innerHTML = native.html;
      section.appendChild(paragraph);
      trackLink(paragraph.querySelector('a'), native.source, 'native');
    }
  }

  const config = configs[path];
  if (!config || document.querySelector('[data-important-letter-cta]')) return;

  if (config.mode === 'primary') {
    document.querySelectorAll('[data-document-product-cta]').forEach((node) => node.remove());
    document.querySelectorAll('[data-document-service-bridge]').forEach((node) => node.remove());
  }

  const style = document.createElement('style');
  style.textContent = `
    .important-letter-cta{margin:34px 0;padding:26px 28px;border:2px solid #58432f;border-radius:18px;background:#fff8e8;box-shadow:0 8px 0 rgba(88,67,47,.12)}
    .important-letter-cta h2{margin:0 0 10px;font-size:clamp(26px,4vw,36px);line-height:1.08}
    .important-letter-cta p{margin:0 0 18px;max-width:760px}
    .important-letter-cta .important-letter-price{font-weight:700;margin:14px 0 18px}
    .important-letter-cta .button{display:inline-flex;text-decoration:none}
    .important-letter-cta small{display:block;margin-top:12px;opacity:.72}
    .important-letter-cta.contextual{padding:22px 24px;border-width:1px;box-shadow:0 5px 0 rgba(88,67,47,.1)}
    .important-letter-cta.contextual h2{font-size:clamp(23px,3vw,30px)}
  `;
  document.head.appendChild(style);

  const makeCta = (placement, contextual = false) => {
    const box = document.createElement('aside');
    box.className = `important-letter-cta${contextual ? ' contextual' : ''}`;
    box.dataset.importantLetterCta = placement;
    box.innerHTML = `<h2>${config.title}</h2><p>${config.text}</p><p class="important-letter-price">Начало — бесплатно · полный текст — 390 ₽ · без подписки</p><a class="button" href="/tools/important-letter/?from=${encodeURIComponent(config.source)}&placement=${encodeURIComponent(placement)}">${config.button}</a><small>Сервис пишет только по фактам и документам, которые вы предоставили. Даты, суммы и реквизиты перед отправкой нужно проверить.</small>`;
    trackLink(box.querySelector('a'), config.source, placement);
    return box;
  };

  if (config.mode === 'contextual') {
    const sections = [...body.querySelectorAll(':scope > section')];
    const keywordSection = sections.find((section) => {
      const text = section.textContent.toLowerCase();
      return (config.keywords || []).some((keyword) => text.includes(keyword));
    });
    const anchor = keywordSection || sections[Math.max(0, Math.floor(sections.length * 0.6))];
    if (anchor) anchor.insertAdjacentElement('afterend', makeCta('contextual', true));
    else body.appendChild(makeCta('contextual', true));
    return;
  }

  const firstSection = body.querySelector(':scope > section');
  if (firstSection) firstSection.insertAdjacentElement('afterend', makeCta('after_intro'));
  else body.prepend(makeCta('after_intro'));

  const sections = [...body.querySelectorAll(':scope > section')];
  const lastSection = sections.at(-1);
  if (lastSection && sections.length > 2) lastSection.insertAdjacentElement('beforebegin', makeCta('before_finish'));
})();
