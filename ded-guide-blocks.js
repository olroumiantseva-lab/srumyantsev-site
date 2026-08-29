const initDedGuideBlocks = () => {
  const path = window.location.pathname.endsWith('/') ? window.location.pathname : `${window.location.pathname}/`;
  const telegram = 'https://t.me/ded_popalsya';
  const instagram = 'https://www.instagram.com/serge.roumi/';

  const guides = {
    '/kakuyu-neyroset-vybrat-2026/': [
      { after: '01 ·', type: 'said', text: '«Я сначала тоже искал лучшую нейросеть. Потом понял: лучшая — та, которую я открыл и которой уже сегодня отдал нормальную задачу. Остальное легко превращается в коллекционирование отвёрток вместо ремонта.»' },
      { after: '04 ·', type: 'did', title: 'Толик пришёл выбирать нейросеть', html: '<p>Сосед Толик зашёл с телефоном и вопросом: «Мне внук сказал поставить нейросеть. Какую?» Я уже приготовился читать ему лекцию про модели, но вовремя остановился.</p><p><strong>Было:</strong> три сервиса, десяток сравнений в интернете и человек, которому от этого только сложнее.</p><p><strong>Сделал:</strong> мы открыли по очереди Алису AI, GigaChat и DeepSeek и дали всем одну настоящую задачу — объяснить простыми словами письмо от управляющей компании, которое Толик получил утром.</p><p><strong>Стало:</strong> через десять минут он сам выбрал тот сервис, где ему было проще читать ответ и задавать уточняющие вопросы. Таблица рейтингов не понадобилась.</p><p><strong>Вывод:</strong> нейросеть лучше выбирать не по чужому обзору, а по своей задаче. Один бытовой тест полезнее двадцати сравнений.</p>' }
    ],
    '/10-zadach-dlya-chatgpt-na-kazhdyy-den/': [
      { beforeFirstHeading: true, type: 'said', text: '«Нейросеть стала мне полезна не тогда, когда я узнал, что она умеет. А когда начал вспоминать про неё в тот момент, когда самому что-то делать лень.»' },
      { headingIncludes: '6. Составить реалистичный', type: 'did', title: 'Внук приезжал на два дня', html: '<p>Внук из Москвы собирался приехать на выходные. План был отличный: заехать ко мне, встретиться с друзьями, сходить в музей, забрать покупку на другом конце города и вечером успеть на поезд.</p><p><strong>Было:</strong> на бумаге всё помещалось. Если не учитывать дорогу, очереди, обед и то, что люди иногда опаздывают.</p><p><strong>Сделал:</strong> я собрал адреса, время встреч и обязательные пункты, отдал список нейросети и попросил выстроить день с нормальными запасами между делами.</p><p><strong>Стало:</strong> сразу стало видно, что одна поездка ломает весь день. Её перенесли, а остальные дела спокойно уместились без забега с препятствиями.</p><p><strong>Вывод:</strong> хороший план — это не когда в него влезло всё. Это когда он пережил реальную жизнь.</p>' },
      { headingIncludes: '6. Составить реалистичный', type: 'said', text: '«Есть одна вещь, которую нейросеть переносит хуже человека: когда человек врёт ей про самого себя. Напишете, что готовы работать по два часа каждый вечер, — получите прекрасный план. Даже если после восьми вечера вам нужен только чай и тишина.»' }
    ],
    '/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/': [
      { after: '01 ·', type: 'said', text: '«Я долго думал, что с нейросетью надо разговаривать каким-то специальным компьютерным языком. Оказалось наоборот: чем яснее я сам понимаю, чего хочу, тем меньше магии требуется.»' },
      { after: '04 ·', type: 'did', title: 'Клиент попросил сделать текст понятнее', html: '<p>Клиент прислал описание услуги почти на две страницы и сказал: «Люди читают, но всё равно спрашивают, что именно мы делаем». Я сначала отправил текст нейросети с коротким «сделай понятнее».</p><p><strong>Было:</strong> в ответ получил гладкий рекламный текст с «эффективными решениями» и «индивидуальным подходом». Стало красивее, но не понятнее.</p><p><strong>Сделал:</strong> во втором заходе я описал конкретно: кто читатель, что он должен понять после первого экрана, какие факты нельзя потерять и какие слова мы сами никогда не используем.</p><p><strong>Стало:</strong> нейросеть собрала текст вокруг трёх вопросов клиента: что вы сделаете, сколько это займёт и что я получу на выходе. После моей правки страница стала заметно проще.</p><p><strong>Вывод:</strong> нейросеть не читает мысли заказчика. Чем точнее рамка задачи, тем меньше потом приходится спасать результат.</p>' }
    ],
    '/kak-proverit-ne-sovrala-li-neyroset/': [
      { after: '02 ·', type: 'said', text: '«Самая опасная ошибка нейросети — не глупая. Глупую видно сразу. Опасная написана спокойно, грамотно и со ссылкой, которую очень хочется не проверять.»' },
      { after: '05 ·', type: 'did', title: 'Верховный суд, которого не было', html: '<p>Я попросил нейросеть помочь с отзывом на иск. Она написала всё убедительно: аргументы, формулировки и даже сослалась на обзор практики Верховного суда.</p><p><strong>Было:</strong> готовый на вид юридический аргумент.</p><p><strong>Сделал:</strong> полез искать первоисточник и проверять номер обзора.</p><p><strong>Стало:</strong> выяснилось, что такого обзора не существует. Ссылку нейросеть просто придумала.</p><p><strong>Вывод:</strong> номер дела, статья закона, исследование, фамилия, дата или сумма в ответе ИИ — не доказательство. Это приглашение открыть источник.</p>' }
    ],
    '/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/': [
      { after: '01 ·', type: 'said', text: '«У официальных писем есть странное свойство: читаешь все слова по отдельности — понимаешь. Читаешь всё предложение — уже нет. Вот здесь нейросеть мне особенно нравится как переводчик с казённого на человеческий.»' },
      { after: '04 ·', type: 'did', title: 'После поликлиники осталось больше вопросов, чем ответов', html: '<p>После приёма знакомая показала мне выписку из поликлиники. Врач всё объяснил, но дома она открыла бумагу и упёрлась в сокращения и фразы вроде «рекомендовано динамическое наблюдение». Спросила меня: «Это что вообще значит и что мне теперь делать?»</p><p><strong>Было:</strong> один лист медицинского канцелярита и тревога от непонятных слов.</p><p><strong>Сделал:</strong> мы закрыли личные данные и попросили нейросеть только перевести формулировки на обычный язык и отдельно выписать вопросы, которые стоит уточнить у врача. Никаких диагнозов и советов по лечению.</p><p><strong>Стало:</strong> стало понятно, какие пункты просто описывают наблюдение, а какие вопросы нужно записать перед следующим приёмом.</p><p><strong>Вывод:</strong> иногда задача нейросети не дать ответ, а помочь человеку наконец сформулировать правильные вопросы специалисту.</p>' }
    ],
    '/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/': [
      { after: '01 ·', type: 'said', text: '«Я долго думал, что нейросеть — это история про компьютер и клавиатуру. Потом понял: камера и микрофон в телефоне убирают половину причин сказать “потом разберусь”.»' },
      { after: '03 ·', type: 'did', title: 'Оля сфотографировала квитанцию вместо того, чтобы её переписывать', html: '<p>Оля принесла коммунальную квитанцию и начала диктовать мне цифры: начислено, перерасчёт, какой-то долг, ещё две строки мелким шрифтом. На третьей цифре мы оба уже потерялись.</p><p><strong>Было:</strong> бумажка на столе, калькулятор в телефоне и обычное семейное «почему в этом месяце больше?».</p><p><strong>Сделал:</strong> сфотографировали квитанцию целиком, закрыв персональные данные, и попросили нейросеть разложить суммы по строкам: что начислено сейчас, где перерасчёт, где долг и какие цифры нужно проверить в личном кабинете.</p><p><strong>Стало:</strong> за пару минут получили понятную карту квитанции. Один вопрос остался — его уже задали управляющей компании.</p><p><strong>Вывод:</strong> камера полезна не тем, что «понимает документы», а тем, что вам не приходится вручную переносить в чат двадцать строк мелкого текста.</p>' }
    ],
    '/kak-razobrat-dogovor-s-pomoshchyu-neyroseti/': [
      { after: '01 ·', type: 'said', text: '«В договоре меня больше всего интересуют не красивые обещания, а четыре скучные вещи: сколько плачу, что обязаны сделать, когда это закончится и как из этого выйти.»' },
      { after: '04 ·', type: 'did', title: 'У клиента нашёлся платёж, которого он не заметил', html: '<p>Клиент собирался подписывать договор на услугу. Цена на первой странице выглядела нормально, поэтому он уже почти договорился о дате старта. Попросил меня только быстро посмотреть документ.</p><p><strong>Было:</strong> восемь страниц и понятная цена в коммерческом предложении.</p><p><strong>Сделал:</strong> я обезличил договор и попросил нейросеть собрать в одну таблицу все платежи, сроки и условия расторжения с номерами пунктов. Потом каждую строку сверил с оригиналом.</p><p><strong>Стало:</strong> в приложении обнаружился отдельный обязательный платёж за сопровождение, который в разговоре не обсуждали. Клиент задал вопрос до подписи, а не после первого счёта.</p><p><strong>Вывод:</strong> нейросеть здесь полезна как фонарик. Она быстро подсвечивает место, но читать сам пункт договора всё равно нужно своими глазами.</p>' }
    ],
    '/kak-ponyat-analizy-i-zaklyuchenie-vracha/': [
      { after: '01 ·', type: 'said', text: '«В медицине я от нейросети хочу не диагноз. Я хочу прийти к врачу и не тратить половину приёма на вопрос: “А это слово что означает?”»' },
      { after: '03 ·', type: 'did', title: 'Три непонятных слова превратились в пять вопросов врачу', html: '<p>После обследования у меня на руках оказалось заключение с несколькими терминами, которые я раньше не встречал. Можно было полезть по одному слову в поиск и за десять минут напугать себя половиной медицинской энциклопедии.</p><p><strong>Было:</strong> заключение врача, три непонятных термина и желание немедленно выяснить «что это значит».</p><p><strong>Сделал:</strong> убрал личные данные и попросил нейросеть только расшифровать термины обычными словами, не ставить диагноз и не оценивать серьёзность. Затем попросил составить вопросы для следующего разговора с врачом.</p><p><strong>Стало:</strong> вместо самодиагностики получил список из пяти конкретных вопросов: что означает формулировка именно в моём заключении, нужно ли что-то уточнить и когда вернуться на контроль.</p><p><strong>Вывод:</strong> хороший результат здесь — не «нейросеть всё объяснила». Хороший результат — вы лучше подготовились к разговору с врачом.</p>' }
    ],
    '/rezyume-i-sobesedovanie-posle-45/': [
      { after: '01 ·', type: 'said', text: '«После сорока пяти проблема резюме часто не в том, что опыта мало. Наоборот — его столько, что за ним перестаёт быть видно, зачем вас звать на собеседование.»' },
      { after: '03 ·', type: 'did', title: 'Из «руководил отделом» достали цифры', html: '<p>Знакомый попросил посмотреть резюме. Двадцать с лишним лет опыта, нормальная карьера — а первый экран был забит фразами «руководил», «контролировал», «обеспечивал взаимодействие».</p><p><strong>Было:</strong> солидный стаж, который выглядел как должностная инструкция.</p><p><strong>Сделал:</strong> я не просил нейросеть переписать резюме. Попросил её провести интервью: по каждому месту работы задавать вопросы про цифры, изменения, проблемы и то, что осталось работать после него.</p><p><strong>Стало:</strong> выяснилось, что за словом «руководил» прятались конкретные вещи: собрал команду, сократил срок обработки заказов, пересогласовал условия с поставщиками. Вот из этих фактов уже собрали резюме.</p><p><strong>Вывод:</strong> нейросеть особенно полезна не как автор резюме, а как дотошный интервьюер, который вытаскивает из памяти то, что вы сами считали «обычной работой».</p>' }
    ],
    '/moshenniki-dipfeyki-golos-rodstvennika/': [
      { after: '01 ·', type: 'said', text: '«Если звонящий торопит, пугает и не даёт положить трубку — мне уже неважно, насколько знакомым голосом он говорит. Я перезваниваю сам.»' },
      { after: '02 ·', type: 'did', title: 'Звонок «из банка» мы проверили одним обратным звонком', html: '<p>Мне позвонили якобы из банка. Голос спокойный, обращаются по имени, знают последние четыре цифры карты и говорят, что кто-то пытается провести операцию. Всё звучит достаточно убедительно, чтобы начать отвечать на вопросы.</p><p><strong>Было:</strong> входящий звонок, срочность и знакомая банковская лексика.</p><p><strong>Сделал:</strong> я ничего не стал выяснять с позвонившим, положил трубку и сам открыл приложение банка. Потом позвонил по номеру из официального приложения.</p><p><strong>Стало:</strong> никакой подозрительной операции банк не видел. Зато стало понятно, зачем в таких ситуациях нужен простой заранее установленный порядок действий.</p><p><strong>Вывод:</strong> нейросеть может помочь разобрать текст сообщения или признаки давления, но личность звонящего проверяет не ИИ. Её проверяет независимый канал связи.</p>' }
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
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initDedGuideBlocks, { once: true });
else initDedGuideBlocks();
