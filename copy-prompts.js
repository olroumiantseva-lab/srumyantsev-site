(() => {
  const copyFallback = (text) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  };

  document.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-prompt");
    if (!button) return;

    event.preventDefault();
    const prompt = button.closest(".prompt-box")?.querySelector("blockquote");
    const text = prompt?.innerText?.trim();
    if (!text) return;

    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      copied = copyFallback(text);
    }

    const original = button.innerHTML;
    button.innerHTML = copied
      ? '<span aria-hidden="true">✓</span>Скопировано'
      : '<span aria-hidden="true">!</span>Выделите текст вручную';
    window.setTimeout(() => {
      button.innerHTML = original;
    }, 1800);
  });

  const starterGuides = {
    "/kakuyu-neyroset-vybrat-2026/": [
      { cards: ["Задача", "Проверка", "Выбор"], caption: "Выбирайте нейросеть не по рейтингу, а по своей реальной задаче и удобству доступа." },
      { cards: ["Вопрос", "Ответ", "Уточнить"], caption: "Первый ответ — только начало. Полезный результат появляется после одного-двух уточнений." },
      { cards: ["Попробовать", "Сравнить", "Оставить"], caption: "За один вечер можно проверить несколько сервисов и оставить тот, который меньше мешает работать." }
    ],
    "/10-zadach-dlya-chatgpt-na-kazhdyy-den/": [
      { cards: ["Текст", "Письмо", "План"], caption: "Начинать проще с уже существующей задачи, а не с вопроса «что ты умеешь?»." },
      { cards: ["Черновик", "Правка", "Готово"], caption: "Нейросеть особенно полезна там, где нужно быстро получить черновик и затем довести его под себя." },
      { cards: ["1 задача", "Сегодня", "Проверить"], caption: "Не надо отдавать ИИ всё подряд. Достаточно снять одну повторяющуюся работу и оценить результат." }
    ],
    "/kak-razgovarivat-s-ii-chtoby-poluchat-luchshie-otvety/": [
      { cards: ["Контекст", "Задача", "Формат"], caption: "Чем яснее исходные условия, задача и форма ответа, тем меньше нейросети приходится угадывать." },
      { cards: ["Первый ответ", "Уточнение", "Лучше"], caption: "Хороший диалог с ИИ редко заканчивается одним сообщением: уточняйте, сокращайте и спорьте с ответом." },
      { cards: ["Факты", "Сомнение", "Проверка"], caption: "Если ответ влияет на деньги, здоровье, документы или решение — добавляйте отдельный шаг проверки." }
    ],
    "/kak-proverit-ne-sovrala-li-neyroset/": [
      { cards: ["Ответ", "Источник", "Сверить"], caption: "Уверенный тон ничего не доказывает. Проверка начинается с источника, даты и исходного документа." },
      { cards: ["Цитата", "Документ", "Найти"], caption: "Если нейросеть ссылается на документ, решение или исследование, сначала убедитесь, что оно вообще существует." },
      { cards: ["Важно", "Дважды", "Проверить"], caption: "Чем выше цена ошибки, тем меньше оснований принимать ответ нейросети на доверии." }
    ],
    "/kak-obyasnit-neponyatnoe-pismo-s-pomoshchyu-ii/": [
      { cards: ["Письмо", "Смысл", "Действие"], caption: "Сначала отделите содержание письма от сложной формы: что произошло и чего от вас хотят." },
      { cards: ["Термин", "Просто", "Пример"], caption: "Просите не пересказывать канцелярский текст, а переводить термины на обычный язык и приводить пример." },
      { cards: ["Срок", "Риск", "Вопрос"], caption: "После объяснения отдельно выпишите сроки, риски и вопросы, которые нужно задать отправителю или специалисту." }
    ]
  };

  const normalizePath = (path) => path.endsWith("/") ? path : `${path}/`;

  const makeQuestionDetails = (body) => {
    const isQuestion = (heading) => heading.textContent.trim().includes("?");

    body.querySelectorAll(":scope > section").forEach((section) => {
      if (section.querySelector(":scope > details.guide-question")) return;
      const heading = section.querySelector(":scope > h2");
      if (!heading || !isQuestion(heading)) return;

      const details = document.createElement("details");
      details.className = "guide-question";
      const summary = document.createElement("summary");
      summary.textContent = heading.textContent.trim();
      const answer = document.createElement("div");
      answer.className = "guide-question-answer";

      let node = heading.nextSibling;
      while (node) {
        const next = node.nextSibling;
        answer.appendChild(node);
        node = next;
      }
      heading.replaceWith(details);
      details.append(summary, answer);
    });

    Array.from(body.querySelectorAll(":scope > h2")).forEach((heading) => {
      if (!isQuestion(heading)) return;
      const details = document.createElement("details");
      details.className = "guide-question";
      const summary = document.createElement("summary");
      summary.textContent = heading.textContent.trim();
      const answer = document.createElement("div");
      answer.className = "guide-question-answer";

      let node = heading.nextSibling;
      while (node) {
        const next = node.nextSibling;
        if (node.nodeType === Node.ELEMENT_NODE && /^(H2|HR|SECTION|DETAILS)$/.test(node.tagName)) break;
        answer.appendChild(node);
        node = next;
      }
      heading.replaceWith(details);
      details.append(summary, answer);
    });
  };

  const makeIllustration = ({ cards, caption }, index) => {
    const figure = document.createElement("figure");
    figure.className = "article-image guide-inline-illustration";
    figure.dataset.guideIllustration = String(index + 1);

    const visual = document.createElement("div");
    visual.className = "guide-visual";
    visual.setAttribute("role", "img");
    visual.setAttribute("aria-label", caption);
    cards.forEach((label) => {
      const card = document.createElement("span");
      card.className = "guide-art-card";
      card.textContent = label;
      visual.appendChild(card);
    });

    const figcaption = document.createElement("figcaption");
    figcaption.textContent = caption;
    figure.append(visual, figcaption);
    return figure;
  };

  const addIllustrations = (body, illustrations) => {
    if (body.querySelector("[data-guide-illustration]")) return;
    let anchors = Array.from(body.querySelectorAll(":scope > section, :scope > details.guide-question, :scope > h2"));
    anchors = anchors.filter((node) => !node.classList.contains("guide-boundary-section"));
    if (!anchors.length) return;

    const rawPositions = [
      Math.min(1, anchors.length - 1),
      Math.max(0, Math.floor((anchors.length - 1) / 2)),
      Math.max(0, anchors.length - 2)
    ];
    const positions = [];
    rawPositions.forEach((position) => {
      let candidate = position;
      while (positions.includes(candidate) && candidate < anchors.length - 1) candidate += 1;
      while (positions.includes(candidate) && candidate > 0) candidate -= 1;
      if (!positions.includes(candidate)) positions.push(candidate);
    });

    illustrations.slice(0, positions.length).forEach((illustration, index) => {
      const anchor = anchors[positions[index]];
      anchor.insertAdjacentElement("afterend", makeIllustration(illustration, index));
    });
  };

  const refreshStarterGuide = () => {
    const path = normalizePath(window.location.pathname);
    const illustrations = starterGuides[path];
    if (!illustrations) return;

    const body = document.querySelector(".seo-body");
    if (!body) return;
    document.body.classList.add("guide-refresh-v2");

    makeQuestionDetails(body);

    body.querySelectorAll(".template-section h2").forEach((heading) => {
      if (heading.textContent.trim().toLowerCase() === "где провести границу") {
        heading.closest(".template-section")?.classList.add("guide-boundary-section");
      }
    });

    addIllustrations(body, illustrations);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", refreshStarterGuide, { once: true });
  } else {
    refreshStarterGuide();
  }
})();