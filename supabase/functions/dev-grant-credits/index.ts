import { HttpError, json, options, requireUser, safeError, validUuid } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return json(request, { error: "METHOD_NOT_ALLOWED", message: "Метод не поддерживается." }, 405);
  try {
    if (Deno.env.get("APP_ENV") === "production") throw new HttpError(404, "NOT_FOUND", "Страница не найдена.");
    const { user, admin } = await requireUser(request);
    const allowlist = new Set((Deno.env.get("DEV_CREDIT_EMAIL_ALLOWLIST") ?? "").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
    if (!user.email || !allowlist.has(user.email.toLowerCase())) throw new HttpError(403, "NOT_ALLOWED", "Тестовые кредиты недоступны.");
    const payload = await request.json();
    if (!validUuid(payload.request_id)) throw new HttpError(400, "INVALID_REQUEST_ID", "Некорректный идентификатор операции.");
    const { data, error } = await admin.rpc("dev_grant_credits", { p_user_id: user.id, p_amount: 10, p_reference_id: payload.request_id });
    if (error) throw error;
    return json(request, { balance: data });
  } catch (error) {
    return safeError(request, error);
  }
});
