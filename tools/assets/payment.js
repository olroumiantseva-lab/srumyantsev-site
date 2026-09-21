(function () {
  "use strict";
  const form = document.querySelector("[data-payment-form]");
  if (!form) return;
  const submit = form.querySelector("[data-payment-submit]");
  const errorBox = form.querySelector("[data-payment-error]");
  const idleLabel = submit.textContent;
  const track = (goal, params = {}) => {
    if (typeof window.dedTrack === "function") window.dedTrack(goal, { product: "document_explain_290", ...params });
    else if (typeof window.ym === "function") window.ym(111385663, "reachGoal", goal, { product: "document_explain_290", ...params });
  };
  function showError(message) { errorBox.textContent = message; errorBox.classList.remove("hidden"); }
  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    errorBox.classList.add("hidden");
    if (!form.reportValidity()) return;
    const config = window.__SUPABASE_CONFIG__ || {};
    const email = String(new FormData(form).get("email") || "").trim().toLowerCase();
    if (!config.url || !config.paymentFunction || !config.paymentProductId || !config.sourceSite) {
      showError("Оплата пока не настроена. Напишите Сергею в Telegram.");
      return;
    }
    submit.disabled = true;
    submit.textContent = "Создаём платёж…";
    try {
      const headers = { "Content-Type": "application/json" };
      if (config.publishableKey) headers.apikey = config.publishableKey;
      const response = await fetch(`${config.url}/functions/v1/${config.paymentFunction}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          product_id: config.paymentProductId,
          source_site: config.sourceSite,
        }),
      });
      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok || !payload.payment_url) throw new Error(payload.message || "Не удалось создать платёж.");
      track("document_checkout_start");
      window.location.assign(payload.payment_url);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Не удалось создать платёж. Попробуйте ещё раз.");
      track("document_checkout_error");
      submit.disabled = false;
      submit.textContent = idleLabel;
    }
  });
})();
