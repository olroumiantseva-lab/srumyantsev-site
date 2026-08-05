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
})();