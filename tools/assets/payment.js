(function () {
  "use strict";
  const form = document.querySelector("[data-payment-form]");
  if (!form) return;
  const submit = form.querySelector("[data-payment-submit]");
  const errorBox = form.querySelector("[data-payment-error]");
  function showError(message) { errorBox.textContent = message; errorBox.classList.remove("hidden"); }
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorBox.classList.add("hidden");
    if (!form.reportValidity()) return;
    const config = window.__SUPABASE_CONFIG__ || {};
    const email = String(new FormData(form).get("email") || "").trim().toLowerCase();
    if (!config.url || !config.paymentFunction) { showError("Оплата пока не настроена. Напишите Сергею в Telegram."); return; }
    submit.disabled = true;
    submit.textContent = "Создаём платёж…";
    try {
      const response = await fetch(`${config.url}/functions/v1/${config.paymentFunction}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.payment_url) throw new Error(payload.message || "Не удалось создать платёж.");
      window.location.assign(payload.payment_url);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Не удалось создать платёж. Попробуйте ещё раз.");
      submit.disabled = false;
      submit.textContent = "Перейти к оплате — 290 ₽";
    }
  });
})();
