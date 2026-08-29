document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
  const telegram = 'https://t.me/ded_popalsya';
  const instagram = 'https://www.instagram.com/serge.systems/';

  const guides = {
    '/kakuyu-neyroset-vybrat-2026/': [
      {
        after: '01 ·', type: 'said',
        text: '«Я сначала тоже искал лучшую нейросеть. Потом понял: лучшая — та, которую я открыл и которой уже сегодня отдал нормальную задачу. Остальное легко превращается в коллекционирование отвёрток вместо ремонта.»'
      },
      {
        after: '04 ·', type: 'did',
        title: 'Я перестал выбирать по рейтингам',
        html: '<p><strong>Было:</strong> открывал обзоры, сравнивал модели, читал, у какой больше параметров и кто кого обогнал в тестах. Через полчаса знал про нейросети больше, а пользоваться так и не начал.</p><p><strong>Сделал:</strong> взял одну доступную модель и дал ей три своих задачи: объяснить письмо, привести в порядок текст и помочь сравнить два варианта.</p><p><strong>Стало:</strong> за вечер стало понятно, где она мне полезна, а где раздражает.</p><p><strong>Вывод:</strong> новичку важнее не выбрать навсегда, а быстро начать. Сменить нейросеть потом проще, чем сменить чайник.</p>'
      }
    ],
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': [
      {
        beforeFirstHeading: true, type: 'said',
        text: '«Нейросеть стала мне полезна не тогда, когда я узнал, что она умеет. А когда начал вспоминать про неё в тот момент, когда самому что-то делать лень.»'
      },
      {
        headingIncludes: '2. Составить вежливый', type: 'did',
        title: 'Письмо, которое я откладывал',
        html: '<p>Мне пришло письмо, на которое отвечать совсем не хотелось. Хамства там не было, но нужно было и отношения не испортить, и на шею никого не посадить.</p><p><strong>Было:</strong> минут десять начинал ответ, стирал и снова начинал.</p><p><strong>Сделал:</strong> дал нейросети переписку и объяснил, чего хочу добиться. Первый вариант был такой вежливый, будто я прошу прощения перед английской королевой. Попросил сделать короче и без реверансов.</p><p><strong>Стало:</strong> получил нормальную основу, поправил две фразы под себя и отправил.</p><p><strong>Вывод:</strong> иногда нейросеть нужна не для идеального текста, а просто чтобы убрать проблему чистого листа.</p>'
      },
      {
        headingIncludes: '6. Составить реалистичный', type: 'said',
        text: '«Есть одна вещь, которую нейросеть переносит хуже человека: когда человек врёт ей про самого себя. Напишете, что готовы работать по два часа каждый вечер, — получите прекрасный план. Даже если после восьми вечера вам нужен только чай и тишина.»'
      }
    ],
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': [
      {
        after: '01 ·', type: 'said',
        text: '«Я долго думал, что с нейросетью надо разговаривать каким-то специальным компьютерным языком. Оказалось наоборот: чем яснее я сам понимаю, чего хочу, тем меньше магии требуется.»'
      },
      {
        after: '04 ·', type: 'did',
        title: 'Одно слово испортило мне полчаса',
        html: '<p>Попросил однажды нейросеть «улучшить текст». Она честно улучшала: добавляла гладкость, красивые переходы и слова, которые я сам никогда не говорю.</p><p><strong>Было:</strong> пять вариантов, и каждый всё меньше был похож на меня.</p><p><strong>Сделал:</strong> перестал просить «улучшить». Написал конкретно: сократи на треть, убери канцелярит, сохрани факты и мой тон.</p><p><strong>Стало:</strong> следующий ответ уже можно было использовать.</p><p><strong>Вывод:</strong> плохой запрос часто не короткий. Он просто оставляет нейросети слишком много свободы там, где вам нужна точность.</p>'
      }
    ],
    '/kak-proverit-ne-sovrala-li-neyroset/': [
      {
        after: '02 ·', type: 'said',
        text: '«Самая опасная ошибка нейросети — не глупая. Глупую видно сразу. Опасная написана спокойно, грамотно и со ссылкой, которую очень хочется не проверять.»'
      },
      {
        after: '05 ·', type: 'did',
        title: 'Верховный суд, которого не было',
        html: '<p>Я попросил нейросеть помочь с отзывом на иск. Она написала всё убедительно: аргументы, формулировки и даже сослалась на обзор практики Верховного суда.</p><p><strong>Было:</strong> готовый на вид юридический аргумент.</p><p><strong>Сделал:</strong> полез искать первоисточник и проверять номер обзора.</p><p><strong>Стало:</strong> выяснилось, что такого обзора не существует. Ссылку нейросеть просто придумала.</p><p><strong>Вывод:</strong> номер дела, статья закона, исследование, фамилия, дата или сумма в ответе ИИ — не доказательство. Это приглашение открыть источник.</p>'
      }
    ],
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': [
      {
        after: '01 ·', type: 'said',
        text: '«У официальных писем есть странное свойство: читаешь все слова по отдельности — понимаешь. Читаешь всё предложение — уже нет. Вот здесь нейросеть мне особенно нравится как переводчик с казённого на человеческий.»'
      },
      {
        after: '04 ·', type: 'did',
        title: 'Сначала я хотел понять каждое слово',
        html: '<p>Когда приходит письмо из банка, ведомства или управляющей компании, первая привычка — разбираться по строчке. На третьем абзаце уже забываешь, что было в первом.</p><p><strong>Было:</strong> текст прочитан два раза, а главный вопрос всё тот же: «И что от меня хотят?»</p><p><strong>Сделал:</strong> начал просить нейросеть не пересказывать письмо, а отдельно назвать: кто пишет, что произошло, что требуется от меня, какой срок и что будет, если ничего не делать.</p><p><strong>Стало:</strong> вместо стены текста получается список действий, который можно проверить по оригиналу.</p><p><strong>Вывод:</strong> цель разбора письма — не понять каждую канцелярскую фразу. Цель — понять, надо ли вам что-то делать и когда.</p>'
      }
    ]
  };

  const specs = guides[path];
  if (!specs || document.querySelector('[data-ded-block]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .ded-block{position:relative;display:grid;grid-template-columns:92px minmax(0,1fr);gap:22px;margin:38px 0 44px;padding:26px 30px 26px 24px;border:3px solid var(--ink,#222);background:#fff7e7;box-shadow:7px 8px 0 rgba(138,91,48,.18);transform:rotate(-.15deg)}
    .ded-block--did{background:#f2e5c9}.ded-block__avatar{width:82px;height:82px;border:3px solid var(--ink,#222);border-radius:50%;object-fit:cover;background:#fff;transform:rotate(-2deg)}
    .ded-block__label{display:inline-block;margin:0 0 9px;padding:5px 9px;border:2px solid var(--ink,#222);background:#e7b64c;font:800 13px/1.1 system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-1deg)}
    .ded-block--did .ded-block__label{background:#d7c4a0}.ded-block__title{margin:0 0 10px!important;font:800 clamp(22px,3vw,30px)/1.15 "Segoe Print","Comic Sans MS",cursive!important;letter-spacing:-.025em}.ded-block__text{font:700 clamp(19px,2.3vw,25px)/1.45 Georgia,serif}.ded-block__body p{margin:0 0 12px!important;line-height:1.62}.ded-block__body p:last-child{margin-bottom:0!important}.ded-block__social{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;padding-top:14px;border-top:1px dashed rgba(30,30,30,.35)}.ded-block__social a{font-weight:800;text-decoration:underline;text-decoration-color:#c48a2c;text-decoration-thickness:2px;text-underline-offset:4px}.ded-block__social a:hover{opacity:.7}
    @media(max-width:620px){.ded-block{grid-template-columns:62px minmax(0,1fr);gap:14px;margin:30px 0 36px;padding:20px 18px 20px 16px;transform:none}.ded-block__avatar{width:58px;height:58px}.ded-block__label{font-size:11px}.ded-block__text{font-size:19px}.ded-block__social{grid-column:1/-1;margin-top:10px}}
  `;
  document.head.appendChild(style);

  const sections = Array.from(document.querySelectorAll('.seo-body > section, .seo-body > h2'));
  const numbered = Array.from(document.querySelectorAll('.seo-body > .numbered-section'));

  const makeBlock = (spec) => {
    const block = document.createElement('aside');
    block.className = `ded-block ded-block--${spec.type}`;
    block.dataset.dedBlock = spec.type;
    block.setAttribute('aria-label', spec.type === 'said' ? 'Дед сказал' : 'Дед сделал');
    const avatar = document.createElement('img');
    avatar.className = 'ded-block__avatar';
    avatar.src = '/sergey-author.png';
    avatar.alt = 'Сергей Румянцев — Дед попался в нейросети';
    const content = document.createElement('div');
    const label = document.createElement('div');
    label.className = 'ded-block__label';
    label.textContent = spec.type === 'said' ? 'Дед сказал' : 'Дед сделал';
    content.appendChild(label);
    if (spec.title) {
      const title = document.createElement('h3');
      title.className = 'ded-block__title';
      title.textContent = spec.title;
      content.appendChild(title);
    }
    const body = document.createElement('div');
    body.className = spec.type === 'said' ? 'ded-block__text' : 'ded-block__body';
    if (spec.text) body.textContent = spec.text;
    if (spec.html) body.innerHTML = spec.html;
    content.appendChild(body);
    const social = document.createElement('div');
    social.className = 'ded-block__social';
    social.innerHTML = `<a href="${telegram}" target="_blank" rel="noopener">Ещё истории в Telegram →</a><a href="${instagram}" target="_blank" rel="noopener">Короткие истории в Instagram →</a>`;
    content.appendChild(social);
    block.append(avatar, content);
    return block;
  };

  specs.forEach((spec) => {
    const block = makeBlock(spec);
    if (spec.beforeFirstHeading) {
      const body = document.querySelector('.seo-body');
      const firstHeading = body?.querySelector(':scope > h2, :scope > section');
      if (body && firstHeading) body.insertBefore(block, firstHeading);
      return;
    }
    if (spec.after) {
      const anchor = numbered.find((section) => section.querySelector(':scope > .section-label')?.textContent.trim().startsWith(spec.after));
      if (anchor) anchor.insertAdjacentElement('afterend', block);
      return;
    }
    if (spec.headingIncludes) {
      const heading = Array.from(document.querySelectorAll('.seo-body h2')).find((h) => h.textContent.includes(spec.headingIncludes));
      if (heading) {
        const parent = heading.closest('.numbered-section');
        (parent || heading).insertAdjacentElement('afterend', block);
      }
    }
  });
});
