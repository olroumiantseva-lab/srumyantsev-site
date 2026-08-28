import { HttpError, json, options, requireUser, safeError, validUuid } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return json(request, { error: "METHOD_NOT_ALLOWED", message: "Метод не поддерживается." }, 405);
  try {
    const { user, admin } = await requireUser(request);
    const payload = await request.json();
    if (!validUuid(payload.session_id)) throw new HttpError(400, "INVALID_SESSION", "Некорректный разбор.");
    const { data, error } = await admin.rpc("soft_delete_document_session", { p_user_id: user.id, p_session_id: payload.session_id });
    if (error) throw error;
    if (!data) throw new HttpError(404, "NOT_FOUND", "Разбор не найден.");
    return json(request, { deleted: true });
  } catch (error) {
    return safeError(request, error);
  }
});
