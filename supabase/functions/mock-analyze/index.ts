import { HttpError, json, options, requireUser, safeError, validUuid } from "../_shared/http.ts";

const allowedTypes = new Set(["letter", "contract", "bill", "notice", "instruction", "medical", "bank", "other", "unknown"]);
const allowedGoals = new Set(["plain", "wants", "actions", "attention", "deadlines", "amounts", "terms", "risks", "specialist"]);
const typeTitles: Record<string, string> = {
  letter: "Официальное письмо", contract: "Договор", bill: "Счёт или квитанция", notice: "Уведомление",
  instruction: "Инструкция", medical: "Медицинский документ", bank: "Уведомление банка", other: "Документ", unknown: "Документ",
};

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return json(request, { error: "METHOD_NOT_ALLOWED", message: "Метод не поддерживается." }, 405);
  try {
    const { user, admin } = await requireUser(request);
    const payload = await request.json();
    const requestId = payload.request_id;
    const sourceText = typeof payload.source_text === "string" ? payload.source_text : "";
    const userContext = typeof payload.user_context === "string" ? payload.user_context : "";
    const documentType = typeof payload.document_type === "string" ? payload.document_type : "unknown";
    const goals = Array.isArray(payload.goals) ? payload.goals.filter((goal: unknown) => typeof goal === "string") : [];

    if (!validUuid(requestId)) throw new HttpError(400, "INVALID_REQUEST_ID", "Обновите страницу и попробуйте ещё раз.");
    if (!sourceText.trim()) throw new HttpError(400, "EMPTY_DOCUMENT", "Вставьте текст документа.");
    if (sourceText.length > 30000) throw new HttpError(400, "DOCUMENT_TOO_LARGE", "Документ слишком большой. Сократите текст или вставьте только нужную часть.");
    if (userContext.length > 1000) throw new HttpError(400, "CONTEXT_TOO_LARGE", "Сократите дополнительный контекст до 1 000 символов.");
    if (!allowedTypes.has(documentType) || goals.some((goal: string) => !allowedGoals.has(goal))) throw new HttpError(400, "INVALID_SELECTION", "Проверьте выбранные параметры.");
    if (Deno.env.get("APP_ENV") !== "production" && request.headers.get("x-dev-force-error") === "true") {
      throw new HttpError(500, "MOCK_FAILURE", "Не удалось разобрать документ. Разбор не списан.");
    }

    const result = {
      document_type: typeTitles[documentType],
      summary: "Это демонстрационный серверный разбор. Документ сохранён, а ответ сформирован без подключения OpenAI.",
      what_it_means: "Рабочая версия этапа 3 проверяет авторизацию, сохранение данных и кредиты.",
      required_actions: ["Проверьте основные требования в исходном документе.", "Уточните места, которые нельзя определить однозначно."],
      deadlines: [], amounts: [],
      important_points: ["Сейчас используется серверный mock-response."],
      potential_risks: [],
      next_steps: ["Прочитайте структурированный результат.", "При необходимости задайте до трёх уточняющих вопросов."],
      questions_for_specialist: [],
      uncertainties: ["Содержательный анализ документа появится после отдельного подключения OpenAI."],
    };

    const { data, error } = await admin.rpc("create_mock_document_session", {
      p_user_id: user.id, p_request_id: requestId, p_document_type: documentType,
      p_source_text: sourceText, p_user_context: userContext, p_goals: goals,
      p_result: result, p_title: typeTitles[documentType],
    });
    if (error) throw error;
    return json(request, { session_id: data });
  } catch (error) {
    return safeError(request, error);
  }
});
