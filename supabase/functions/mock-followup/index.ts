import { HttpError, json, options, requireUser, safeError, validUuid } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return json(request, { error: "METHOD_NOT_ALLOWED", message: "Метод не поддерживается." }, 405);
  try {
    const { user, admin } = await requireUser(request);
    const payload = await request.json();
    const sessionId = payload.session_id;
    const requestId = payload.request_id;
    const question = typeof payload.question === "string" ? payload.question.trim() : "";
    if (!validUuid(sessionId) || !validUuid(requestId)) throw new HttpError(400, "INVALID_REQUEST", "Обновите страницу и попробуйте ещё раз.");
    if (!question || question.length > 2000) throw new HttpError(400, "INVALID_QUESTION", "Введите короткий вопрос по документу.");
    if (Deno.env.get("APP_ENV") !== "production" && request.headers.get("x-dev-force-error") === "true") {
      throw new HttpError(500, "MOCK_FAILURE", "Не удалось ответить. Попробуйте ещё раз.");
    }
    const answer = "Это демонстрационный ответ этапа 3. Он сохранён на сервере и относится только к текущему разбору.";
    const { data, error } = await admin.rpc("add_mock_followup", {
      p_user_id: user.id, p_session_id: sessionId, p_request_id: requestId, p_question: question, p_answer: answer,
    });
    if (error) throw error;
    return json(request, { followups_used: data, answer });
  } catch (error) {
    return safeError(request, error);
  }
});
