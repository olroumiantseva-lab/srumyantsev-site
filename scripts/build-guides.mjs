import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const registryPath = path.join(root, "guides", "guides-registry.json");
const registry = JSON.parse(fs.readFileSync(registryPath, "utf8"));

const levels = {
  0: {
    title: "Ступень 0 — Начать",
    description: "Освоить основы и научиться безопасно пользоваться нейросетью.",
    routeHeading: "Пройдите по порядку",
    practicalHeading: "Попробуйте на реальной задаче",
  },
  1: {
    title: "Ступень 1 — Расширить возможности",
    description: "Освоить новые форматы и более сложные способы работы с ИИ.",
    routeHeading: "Маршрут",
    practicalHeading: "Примените в жизни",
  },
  2: {
    title: "Ступень 2 — Собрать систему",
    description: "Перейти от отдельных запросов к своей системе работы с нейросетью.",
    routeHeading: "Маршрут",
    practicalHeading: "Примените в жизни",
  },
};

const categories = [
  "Для жизни",
  "Документы и информация",
  "Работа и деньги",
  "Учёба и семья",
  "Проверка и безопасность",
  "Система работы",
  "Начать с ИИ",
];

const practicums = [
  { url: "/neyroseti-posle-45-pervyy-rezultat/", title: "Нейросети после 45: первый результат", description: "Первый практикум: выбрать сервис и решить рабочую задачу за 20 минут." },
  { url: "/razbor-neponyatnogo-dokumenta/", title: "Разбор непонятного документа", description: "Практикум по разбору письма, договора или квитанции без лишних догадок." },
  { url: "/telefon-vmesto-klaviatury/", title: "Телефон вместо клавиатуры", description: "Настроить телефон и выполнить три задания голосом и камерой за 20 минут." },
];

const indexationLinks = {
  "/kak-polzovatsya-ii-s-telefona-golosom-i-fotografiey/": "Камера пригодится не только для документов: по фотографии и точному описанию можно <a href=\"/kak-nayti-prichinu-neispravnosti-po-fotografii-s-pomoshchyu-ii/\">разобрать возможные причины бытовой неисправности</a>. Если на фото инструкция или длинное видео, пригодятся гайды о том, <a href=\"/kak-razobratsya-v-instruktsii-k-tehnike-s-pomoshchyu-ii/\">как разобраться в инструкции к технике</a> и <a href=\"/kratkiy-pereskaz-video-youtube-neyrosetyu/\">как получить краткий пересказ видео</a>.",
  "/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/": "Тот же принцип вопросов работает, когда ИИ становится <a href=\"/ii-kak-domashniy-repetitor-dlya-rebenka/\">домашним репетитором для ребёнка</a> или помогает <a href=\"/kak-vspomnit-zabytoe-slovo-s-pomoshchyu-neyroseti/\">вспомнить забытое слово</a>.",
  "/kak-proverit-ne-sovrala-li-neyroset/": "Особенно внимательно проверяйте ответы, если просите ИИ <a href=\"/kak-razobratsya-v-instruktsii-k-tehnike-s-pomoshchyu-ii/\">объяснить инструкцию к технике</a> или <a href=\"/kak-nayti-prichinu-neispravnosti-po-fotografii-s-pomoshchyu-ii/\">назвать возможную причину бытовой неисправности по фотографии</a>.",
  "/kak-razobratsya-v-instruktsii-k-tehnike-s-pomoshchyu-ii/": "Если техника уже ведёт себя необычно, используйте инструкцию вместе с фотографией и описанием симптомов: отдельный гайд показывает, <a href=\"/kak-nayti-prichinu-neispravnosti-po-fotografii-s-pomoshchyu-ii/\">как получить несколько гипотез и отделить безопасную проверку от ремонта</a>.",
  "/rezyume-i-sobesedovanie-posle-45/": "Если новая должность требует переобучения, начните с гайда о том, <a href=\"/kak-smenit-professiyu-posle-45-s-pomoshchyu-neyroseti/\">как проверить новую профессию после 45</a>. Если хочется не искать новую роль, а применить накопленные знания самостоятельно, разберите, <a href=\"/kak-prevratit-opyt-v-konsultatsiyu-ili-produkt-s-pomoshchyu-ii/\">как превратить опыт в консультацию или небольшой продукт</a>.",
  "/kak-smenit-professiyu-posle-45-s-pomoshchyu-neyroseti/": "Смена роли не единственный вариант: накопленные знания можно <a href=\"/kak-prevratit-opyt-v-konsultatsiyu-ili-produkt-s-pomoshchyu-ii/\">превратить в консультацию, разбор или небольшой продукт</a> и проверить на реальных людях.",
  "/uchitsya-s-neyrosetyu-yazyk-professiya-tehnika/": "Эту схему можно применить к трём конкретным задачам: <a href=\"/kak-smenit-professiyu-posle-45-s-pomoshchyu-neyroseti/\">проверить новую профессию</a>, превратить ИИ в <a href=\"/ii-kak-domashniy-repetitor-dlya-rebenka/\">домашнего репетитора</a> или <a href=\"/kak-vspomnit-zabytoe-slovo-s-pomoshchyu-neyroseti/\">вспомнить слово через уточняющие вопросы</a>.",
  "/kak-razobratsya-s-dengami-tarify-kredity-kommunalka/": "Если регулярные расходы смешались с документами и другими вопросами, сначала <a href=\"/kak-provesti-reviziyu-zhizni-s-pomoshchyu-ii/\">проведите общую ревизию дел с помощью ИИ</a>. Для разовой покупки используйте схему, которая помогает <a href=\"/kak-sravnit-tovary-s-pomoshchyu-neyroseti/\">сравнить товары без маркетингового шума</a>. Если расходы связаны с ремонтом, отдельно разберите <a href=\"/smeta-na-remont-s-pomoshchyu-ii/\">смету с помощью ИИ</a>.",
  "/tablitsy-i-tsifry-neyroset/": "Таблица особенно полезна, когда нужно <a href=\"/kak-sravnit-tovary-s-pomoshchyu-neyroseti/\">сравнить несколько товаров по своим критериям</a> или <a href=\"/smeta-na-remont-s-pomoshchyu-ii/\">проверить смету на ремонт</a>.",
  "/ii-v-poezdke-perevod-menyu-marshrut/": "Перед поездкой ИИ может помочь <a href=\"/kak-sravnit-tovary-s-pomoshchyu-neyroseti/\">сравнить нужные в дороге товары</a> и <a href=\"/kak-podobrat-podarok-s-pomoshchyu-neyroseti/\">подобрать подарок под конкретного человека</a>.",
  "/kak-sdelat-neyroset-lichnym-pomoshchnikom/": "Чтобы выбрать повторяющуюся задачу для помощника, сначала можно <a href=\"/kak-provesti-reviziyu-zhizni-s-pomoshchyu-ii/\">провести ревизию дел, документов, денег и планов</a>. Если задача длится не один день, переходите к схеме, которая помогает <a href=\"/kak-vesti-bolshoy-proekt-s-pomoshchyu-neyroseti/\">вести большой проект с ИИ</a>.",
  "/svoya-biblioteka-promptov/": "Для задачи на несколько недель одних шаблонов мало: нужен журнал решений и следующий шаг. Это разобрано в гайде о том, <a href=\"/kak-vesti-bolshoy-proekt-s-pomoshchyu-neyroseti/\">как вести большой проект с помощью нейросети</a>.",
  "/neyroset-v-rabote-gde-ekonomit-chasy/": "Следующий уровень — применить ИИ к большой задаче: <a href=\"/kak-vesti-bolshoy-proekt-s-pomoshchyu-neyroseti/\">вести проект от идеи до результата</a>, <a href=\"/kak-smenit-professiyu-posle-45-s-pomoshchyu-neyroseti/\">проверить новую профессию после 45</a> или <a href=\"/kak-prevratit-opyt-v-konsultatsiyu-ili-produkt-s-pomoshchyu-ii/\">собрать консультацию или небольшой продукт из своего опыта</a>.",
  "/rasshifrovka-audio-neyrosetyu/": "Если запись опубликована на YouTube, отдельная схема поможет <a href=\"/kratkiy-pereskaz-video-youtube-neyrosetyu/\">получить краткий пересказ видео и проверить главное</a>.",
  "/dlinnye-dokumenty-dogovor-otchet-kniga/": "Тот же подход к большим объёмам пригодится, чтобы <a href=\"/kratkiy-pereskaz-video-youtube-neyrosetyu/\">разобрать длинное видео</a>, <a href=\"/semeynyy-arhiv-vospominaniya-neyroset/\">собрать семейный архив воспоминаний</a> или <a href=\"/kak-razobratsya-v-instruktsii-k-tehnike-s-pomoshchyu-ii/\">найти нужный шаг в инструкции к технике</a>.",
  "/svoy-arhiv-dokumentov-neyroset/": "Если документы лишь одна часть общего завала, начните с <a href=\"/kak-provesti-reviziyu-zhizni-s-pomoshchyu-ii/\">ревизии дел, денег и личных планов с помощью ИИ</a>. Отдельный вид личного архива — семейные истории. Начать его поможет гайд о том, <a href=\"/semeynyy-arhiv-vospominaniya-neyroset/\">как записать и собрать воспоминания близких</a>.",
  "/kak-vesti-bolshoy-proekt-s-pomoshchyu-neyroseti/": "Если одновременно накопились разные дела, документы, платежи и планы, сначала <a href=\"/kak-provesti-reviziyu-zhizni-s-pomoshchyu-ii/\">проведите общую ревизию и выберите семь ближайших действий</a>.",
  "/kak-podobrat-film-ili-knigu-s-pomoshchyu-neyroseti/": "По похожей схеме можно <a href=\"/kak-podobrat-podarok-s-pomoshchyu-neyroseti/\">подобрать небанальный подарок</a> или <a href=\"/kak-vspomnit-zabytoe-slovo-s-pomoshchyu-neyroseti/\">найти слово, которое вертится на языке</a>.",
  "/svoe-delo-posle-50-s-neyrosetyami/": "Если дело строится на накопленном опыте, сначала разберите, <a href=\"/kak-prevratit-opyt-v-konsultatsiyu-ili-produkt-s-pomoshchyu-ii/\">как выбрать одну проблему и собрать простую консультацию или продукт</a>.",
  "/nastavnichestvo-uchit-drugih-podrabotka/": "Наставничество может остаться подработкой или стать одним из форматов, в которые вы <a href=\"/kak-prevratit-opyt-v-konsultatsiyu-ili-produkt-s-pomoshchyu-ii/\">упакуете профессиональный опыт</a>. Более широкий вариант разобран в гайде <a href=\"/svoe-delo-posle-50-s-neyrosetyami/\">«Своё дело после 50 с нейросетями»</a>.",
};

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const routeFor = (level) => registry
  .filter((guide) => guide.LEVEL === level && guide.TYPE === "route")
  .sort((a, b) => a.ROUTE_POSITION - b.ROUTE_POSITION);

const practicalFor = (level) => registry
  .filter((guide) => guide.LEVEL === level && guide.TYPE === "practical")
  .sort((a, b) => a.originalOrder - b.originalOrder);

const card = (guide, routeTotal) => {
  const badge = guide.TYPE === "route"
    ? `СТУПЕНЬ ${guide.LEVEL} · ШАГ ${guide.ROUTE_POSITION} ИЗ ${routeTotal}`
    : `СТУПЕНЬ ${guide.LEVEL} · ${guide.CATEGORY.toUpperCase()}`;
  return `<article class="guide-card" data-guide-card data-category="${escapeHtml(guide.CATEGORY)}" data-level="${guide.LEVEL}" data-type="${guide.TYPE}">
  <span class="guide-badge">${escapeHtml(badge)}</span>
  <h3><a href="${guide.url}">${guide.title}</a></h3>
  <p>${guide.description}</p>
  <small>${escapeHtml(guide.duration)}</small>
  <a class="guide-card-link" href="${guide.url}">${escapeHtml(guide.cta)} →</a>
</article>`;
};

const levelSection = (level) => {
  const route = routeFor(level);
  const practical = practicalFor(level);
  return `<section class="guide-level shell" id="level-${level}" aria-labelledby="level-${level}-title">
  <header class="level-heading">
    <p class="section-kicker">Ступень ${level}</p>
    <h2 id="level-${level}-title">${levels[level].title}</h2>
    <p>${levels[level].description}</p>
  </header>
  <div class="guide-group">
    <h3>${levels[level].routeHeading}</h3>
    <div class="guide-grid route-grid">${route.map((guide) => card(guide, route.length)).join("\n")}</div>
  </div>
  ${practical.length ? `<div class="guide-group">
    <h3>${levels[level].practicalHeading}</h3>
    <div class="guide-grid practical-grid">${practical.map((guide) => card(guide, route.length)).join("\n")}</div>
  </div>` : ""}
</section>`;
};

function buildCatalog() {
  const catalogPath = path.join(root, "guides", "index.html");
  const current = fs.readFileSync(catalogPath, "utf8");
  let head = current.match(/^[\s\S]*?<body>/)?.[0];
  const siteHeader = current.match(/<header class="site-header shell">[\s\S]*?<\/header>/)?.[0];
  let suffix = current.match(/<\/main>[\s\S]*$/)?.[0];
  if (!head || !siteHeader || !suffix) throw new Error("Cannot identify catalog shell");
  if (!head.includes('/guides/guides.css')) head = head.replace("</head>", '<link rel="stylesheet" href="/guides/guides.css"></head>');
  if (!suffix.includes('/guides/guides-filter.js')) suffix = suffix.replace("</body>", '<script src="/guides/guides-filter.js" defer></script></body>');

  const intro = registry.find((guide) => guide.url === "/kakuyu-neyroset-vybrat-2026/");
  const body = `<main>${siteHeader}
<section class="catalog-hero shell">
  <p class="section-kicker">Без кода и зауми</p>
  <h1>Гайды по нейросетям</h1>
  <p>Не нужно изучать всё подряд. Выберите, где вы сейчас — или сразу найдите нужную задачу.</p>
  <div class="catalog-hero-actions"><a class="button" href="#levels">Пройти по ступеням</a><a class="button button-light" href="#tasks">Найти гайд по задаче</a></div>
</section>
<section class="level-picker shell" id="levels" aria-labelledby="level-picker-title">
  <p class="section-kicker">Маршрут</p><h2 id="level-picker-title">Выберите ступень</h2>
  <div class="level-picker-grid">
    <article><span>0</span><h3>Ступень 0 — Начать</h3><p>Для тех, кто только осваивается с нейросетями.</p><a href="#level-0">Начать со ступени 0 →</a></article>
    <article><span>1</span><h3>Ступень 1 — Расширить возможности</h3><p>Для тех, кто уже умеет задавать простые вопросы и хочет решать более сложные задачи.</p><a href="#level-1">Перейти к ступени 1 →</a></article>
    <article><span>2</span><h3>Ступень 2 — Собрать систему</h3><p>Для тех, кто регулярно использует ИИ и хочет организовать работу с ним.</p><a href="#level-2">Перейти к ступени 2 →</a></article>
  </div>
</section>
<aside class="start-here shell" aria-labelledby="start-here-title">
  <div><p class="section-kicker">Быстрый старт</p><h2 id="start-here-title">Не знаете, с чего начать?</h2></div>
  <ol><li>Какую нейросеть выбрать</li><li>10 задач для ChatGPT</li><li>Как разговаривать с ИИ</li></ol>
  <a class="button" href="${intro.url}">Начать с первого гайда</a>
</aside>
<section class="task-picker shell" id="tasks" aria-labelledby="task-picker-title">
  <p class="section-kicker">По задаче</p><h2 id="task-picker-title">Или выберите, что хотите сделать</h2>
  <div class="guide-filters" role="group" aria-label="Фильтр гайдов по категории">
    <button type="button" data-filter="all" aria-pressed="true">Все</button>
    ${categories.map((category) => `<button type="button" data-filter="${escapeHtml(category)}" aria-pressed="false">${category}</button>`).join("\n    ")}
  </div>
  <p class="filter-status" aria-live="polite">Показаны все ${registry.length} гайдов</p>
</section>
<div class="guide-catalog" data-guide-catalog>${[0, 1, 2].map(levelSection).join("\n")}</div>
<section class="practicum-catalog shell" aria-labelledby="practicum-catalog-title">
  <header><p class="section-kicker">Сделать самому</p><h2 id="practicum-catalog-title">Практикумы</h2><p>Короткие занятия с конкретным результатом. Выберите задачу и пройдите её по шагам.</p></header>
  <div class="practicum-grid">${practicums.map((item) => `<article><h3><a href="${item.url}">${item.title}</a></h3><p>${item.description}</p><a class="text-link" href="${item.url}">Открыть практикум →</a></article>`).join("\n")}</div>
</section>
${suffix}`;
  fs.writeFileSync(catalogPath, (head + body).replace(/[ \t]+$/gm, ""));
}

function metaLabel(guide) {
  if (guide.META_LABEL) return guide.META_LABEL;
  if (guide.TYPE === "route") return `Ступень ${guide.LEVEL} · Шаг ${guide.ROUTE_POSITION} из ${routeFor(guide.LEVEL).length}`;
  return `Ступень ${guide.LEVEL} · ${guide.CATEGORY}`;
}

function followup(guide) {
  if (guide.TYPE === "practical") {
    const links = guide.RELATED_GUIDES.map((url) => registry.find((item) => item.url === url));
    return `<section class="guide-followup" aria-labelledby="guide-followup-title"><p class="section-kicker">Продолжить</p><h2 id="guide-followup-title">Что дальше</h2><div class="guide-followup-links">${links.map((item) => `<a href="${item.url}"><strong>${item.title}</strong><span>${item.description}</span></a>`).join("")}</div></section>`;
  }
  if (guide.NEXT_GUIDE) {
    const next = registry.find((item) => item.url === guide.NEXT_GUIDE);
    return `<section class="guide-followup" aria-labelledby="guide-followup-title"><p class="section-kicker">Маршрут</p><h2 id="guide-followup-title">Следующий шаг</h2><a class="guide-next-step" href="${next.url}"><span>Шаг ${next.ROUTE_POSITION} из ${routeFor(guide.LEVEL).length}</span><strong>${next.title}</strong></a></section>`;
  }
  if (guide.LEVEL < 2) {
    const next = routeFor(guide.LEVEL + 1)[0];
    return `<section class="guide-followup" aria-labelledby="guide-followup-title"><p class="section-kicker">Маршрут</p><h2 id="guide-followup-title">Перейти к следующей ступени</h2><a class="guide-next-step" href="${next.url}"><span>Ступень ${next.LEVEL} · Шаг 1 из ${routeFor(next.LEVEL).length}</span><strong>${next.title}</strong></a></section>`;
  }
  return `<section class="guide-followup guide-followup-note" aria-labelledby="guide-followup-title"><p class="section-kicker">Продолжение</p><h2 id="guide-followup-title">Другие гайды ступени 2 будут добавляться</h2><p>А пока можно выбрать следующую задачу в общем каталоге.</p><a class="text-link" href="/guides/#tasks">Найти другой гайд →</a></section>`;
}

function indexationLinkBlock(guide) {
  const content = indexationLinks[guide.url];
  return content ? `<section class="template-section indexation-links"><h2>Связанная задача</h2><p>${content}</p></section>` : "";
}

function updateGuidePages() {
  for (const guide of registry) {
    const pagePath = path.join(root, guide.url.slice(1), "index.html");
    let html = fs.readFileSync(pagePath, "utf8");
    if (!html.includes('/series-meta.css')) html = html.replace("</head>", '<link rel="stylesheet" href="/series-meta.css"></head>');

    const levelCard = `<p class="guide-level-card"><em><span class="guide-level-index">${metaLabel(guide)}</span><span class="guide-level-note">${guide.description}</span></em></p>`;
    if (html.includes('class="guide-level-card"')) {
      html = html.replace(/<p class="guide-level-card">[\s\S]*?<\/p>/, levelCard);
    } else if (html.includes('class="series-meta"')) {
      html = html.replace(/<div class="series-meta">[\s\S]*?<\/div>/, `<div class="series-meta"><span>${metaLabel(guide)}</span><span>${guide.description}</span></div>`);
    } else {
      const date = html.match(/<small>(?:Опубликовано|Обновлено):[\s\S]*?<\/small>/)?.[0];
      if (!date) throw new Error(`Date not found in ${guide.url}`);
      html = html.replace(date, `<div class="guide-meta-panel">${levelCard}<div class="guide-date-card">${date}</div></div>`);
    }

    html = html.replace(/<section class="guide-followup(?: [^"]*)?"[\s\S]*?<\/section>/g, "");
    html = html.replace(/<section class="template-section indexation-links">[\s\S]*?<\/section>/g, "");
    if (html.includes('<aside class="seo-cta">')) {
      html = html.replace('<aside class="seo-cta">', `${indexationLinkBlock(guide)}${followup(guide)}<aside class="seo-cta">`);
    } else if (html.includes('<footer class="article-footer">')) {
      html = html.replace('<footer class="article-footer">', `${indexationLinkBlock(guide)}${followup(guide)}<footer class="article-footer">`);
    } else {
      throw new Error(`Follow-up insertion point not found in ${guide.url}`);
    }
    fs.writeFileSync(pagePath, html);
  }
}

buildCatalog();
updateGuidePages();
console.log(`Built catalog and navigation for ${registry.length} guides`);
