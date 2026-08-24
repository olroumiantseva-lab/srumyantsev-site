import Ajv2020 from "ajv/2020";
import resultSchema from "./document-result-schema.json" with { type: "json" };
import {
  HttpError,
  json,
  options,
  originAllowed,
  requireUser,
  safeError,
  validUuid,
} from "./http.ts";

const MAX_SOURCE_LENGTH = 30000;
const MAX_CONTEXT_LENGTH = 1000;
const MAX_BODY_BYTES = 65536;
const DEFAULT_TIMEOUT_MS = 25000;
const OPENAI_URL = "https://api.openai.com/v1/responses";
const allowedTypes = new Set([
  "letter",
  "contract",
  "bill",
  "notice",
  "instruction",
  "medical",
  "bank",
  "other",
  "unknown",
]);
const allowedGoals = new Set([
  "plain",
  "wants",
  "actions",
  "attention",
  "deadlines",
  "amounts",
  "terms",
  "risks",
  "specialist",
]);
const allowedFields = new Set([
  "request_id",
  "document_type",
  "goals",
  "source_text",
  "user_context",
]);
const Ajv2020Constructor = Ajv2020.default;
const validateResult = new Ajv2020Constructor({
  allErrors: false,
  strict: true,
}).compile(
  resultSchema,
);

const baseInstructions = [
  "Проанализируй только предоставленный текст документа.",
  "Не додумывай факты и не подменяй неопределённость догадкой.",
  "Не давай медицинских или юридических гарантий.",
  "Явно перечисляй неопределённости.",
  "Следуй JSON Schema результата.",
].join(" ");

type AnalyzePayload = {
  request_id: string;
  document_type: string;
  goals: string[];
  source_text: string;
  user_context: string;
};

type LogEntry = {
  request_id: string;
  code: string;
  duration_ms: number;
  error_type: string | null;
};

type Dependencies = {
  authenticate: (request: Request) => Promise<unknown>;
  fetch: typeof fetch;
  getEnv: (name: string) => string | undefined;
  isOriginAllowed: (request: Request) => boolean;
  log: (entry: LogEntry) => void;
  timeoutMs: number;
};

class AnalyzeError extends HttpError {
  constructor(
    status: number,
    code: string,
    message: string,
    public technicalType: string,
  ) {
    super(status, code, message);
  }
}

const defaultDependencies: Dependencies = {
  authenticate: requireUser,
  fetch,
  getEnv: (name) => Deno.env.get(name),
  isOriginAllowed: originAllowed,
  log: (entry) => console.log(JSON.stringify(entry)),
  timeoutMs: DEFAULT_TIMEOUT_MS,
};

function requestIdForLog(value: unknown): string {
  return validUuid(value) ? value : "invalid";
}

function parsePayload(value: unknown): AnalyzePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AnalyzeError(
      400,
      "INVALID_PAYLOAD",
      "Проверьте данные запроса.",
      "payload_shape",
    );
  }
  const payload = value as Record<string, unknown>;
  if (Object.keys(payload).some((key) => !allowedFields.has(key))) {
    throw new AnalyzeError(
      400,
      "INVALID_PAYLOAD",
      "Запрос содержит неподдерживаемые данные.",
      "unexpected_field",
    );
  }
  if (!validUuid(payload.request_id)) {
    throw new AnalyzeError(
      400,
      "INVALID_REQUEST_ID",
      "Обновите страницу и попробуйте ещё раз.",
      "request_id",
    );
  }
  if (typeof payload.source_text !== "string" || !payload.source_text.trim()) {
    throw new AnalyzeError(
      400,
      "EMPTY_DOCUMENT",
      "Добавьте текст документа.",
      "empty_source",
    );
  }
  if (payload.source_text.length > MAX_SOURCE_LENGTH) {
    throw new AnalyzeError(
      400,
      "DOCUMENT_TOO_LARGE",
      "Текст документа превышает лимит 30 000 символов.",
      "source_limit",
    );
  }
  if (
    typeof payload.document_type !== "string" ||
    !allowedTypes.has(payload.document_type)
  ) {
    throw new AnalyzeError(
      400,
      "INVALID_DOCUMENT_TYPE",
      "Выберите поддерживаемый тип документа.",
      "document_type",
    );
  }
  if (
    !Array.isArray(payload.goals) || payload.goals.length < 1 ||
    payload.goals.length > allowedGoals.size ||
    payload.goals.some((goal) =>
      typeof goal !== "string" || !allowedGoals.has(goal)
    ) || new Set(payload.goals).size !== payload.goals.length
  ) {
    throw new AnalyzeError(
      400,
      "INVALID_GOALS",
      "Выберите хотя бы одну корректную цель анализа.",
      "goals",
    );
  }
  if (
    payload.user_context !== undefined &&
    typeof payload.user_context !== "string"
  ) {
    throw new AnalyzeError(
      400,
      "INVALID_CONTEXT",
      "Дополнительный контекст должен быть текстом.",
      "context_type",
    );
  }
  const userContext = (payload.user_context as string | undefined) ?? "";
  if (userContext.length > MAX_CONTEXT_LENGTH) {
    throw new AnalyzeError(
      400,
      "CONTEXT_TOO_LARGE",
      "Сократите дополнительный контекст до 1 000 символов.",
      "context_limit",
    );
  }
  return {
    request_id: payload.request_id,
    document_type: payload.document_type,
    goals: payload.goals as string[],
    source_text: payload.source_text,
    user_context: userContext,
  };
}

function outputText(payload: Record<string, unknown>): string | null {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content)
      ? (item as Record<string, unknown>).content as unknown[]
      : [];
    for (const part of content) {
      if (
        part && typeof part === "object" &&
        (part as Record<string, unknown>).type === "output_text" &&
        typeof (part as Record<string, unknown>).text === "string"
      ) {
        return (part as Record<string, unknown>).text as string;
      }
    }
  }
  return null;
}

function usageFrom(payload: Record<string, unknown>) {
  const usage = payload.usage && typeof payload.usage === "object"
    ? payload.usage as Record<string, unknown>
    : {};
  return {
    input_tokens: typeof usage.input_tokens === "number"
      ? usage.input_tokens
      : 0,
    output_tokens: typeof usage.output_tokens === "number"
      ? usage.output_tokens
      : 0,
    total_tokens: typeof usage.total_tokens === "number"
      ? usage.total_tokens
      : 0,
  };
}

async function callOpenAI(
  deps: Dependencies,
  apiKey: string,
  model: string,
  payload: AnalyzePayload,
  signal: AbortSignal,
  retry: boolean,
) {
  const context = payload.user_context
    ? `\n\nДополнительный контекст пользователя:\n${payload.user_context}`
    : "";
  const response = await deps.fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      model,
      store: false,
      instructions: retry
        ? `${baseInstructions} Предыдущий результат не прошёл машинную проверку; сформируй новый результат строго по схеме.`
        : baseInstructions,
      input: `Заявленный тип: ${payload.document_type}\nЦели: ${
        payload.goals.join(", ")
      }\n\nДокумент:\n${payload.source_text}${context}`,
      text: {
        format: {
          type: "json_schema",
          name: "document_analyzer_result",
          strict: true,
          schema: resultSchema,
        },
      },
    }),
  });
  if (!response.ok) {
    throw new AnalyzeError(
      502,
      "OPENAI_ERROR",
      "Сервис анализа временно недоступен. Попробуйте позже.",
      `openai_http_${response.status}`,
    );
  }
  let responsePayload: unknown;
  try {
    responsePayload = await response.json();
  } catch {
    throw new AnalyzeError(
      502,
      "OPENAI_ERROR",
      "Сервис анализа вернул некорректный ответ.",
      "openai_response_json",
    );
  }
  if (!responsePayload || typeof responsePayload !== "object") {
    throw new AnalyzeError(
      502,
      "OPENAI_ERROR",
      "Сервис анализа вернул некорректный ответ.",
      "openai_response_shape",
    );
  }
  return responsePayload as Record<string, unknown>;
}

export function createAnalyzeDocumentHandler(
  overrides: Partial<Dependencies> = {},
) {
  const deps = { ...defaultDependencies, ...overrides };
  return async (request: Request): Promise<Response> => {
    const preflight = options(request);
    if (preflight) return preflight;
    const started = Date.now();
    let logRequestId = requestIdForLog(request.headers.get("x-request-id"));
    let code = "SERVER_ERROR";
    let errorType: string | null = null;
    try {
      if (request.method !== "POST") {
        throw new AnalyzeError(
          405,
          "METHOD_NOT_ALLOWED",
          "Метод не поддерживается.",
          "method",
        );
      }
      if (!deps.isOriginAllowed(request)) {
        throw new AnalyzeError(
          403,
          "ORIGIN_NOT_ALLOWED",
          "Источник запроса не разрешён.",
          "cors_origin",
        );
      }
      await deps.authenticate(request);
      const contentLength = Number(request.headers.get("content-length") ?? 0);
      if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        throw new AnalyzeError(
          413,
          "PAYLOAD_TOO_LARGE",
          "Запрос слишком большой.",
          "body_limit",
        );
      }
      let rawPayload: unknown;
      try {
        rawPayload = await request.json();
      } catch {
        throw new AnalyzeError(
          400,
          "INVALID_JSON",
          "Проверьте формат запроса.",
          "request_json",
        );
      }
      const payload = parsePayload(rawPayload);
      logRequestId = payload.request_id;
      const apiKey = deps.getEnv("OPENAI_API_KEY")?.trim() ?? "";
      const model = deps.getEnv("OPENAI_MODEL")?.trim() ?? "";
      if (!apiKey || !model) {
        throw new AnalyzeError(
          500,
          "SERVER_CONFIG",
          "Сервис анализа пока не настроен.",
          "missing_openai_config",
        );
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), deps.timeoutMs);
      try {
        for (let attempt = 0; attempt < 2; attempt += 1) {
          const openaiPayload = await callOpenAI(
            deps,
            apiKey,
            model,
            payload,
            controller.signal,
            attempt === 1,
          );
          const text = outputText(openaiPayload);
          let result: unknown;
          try {
            result = text ? JSON.parse(text) : null;
          } catch {
            result = null;
          }
          if (result && validateResult(result)) {
            code = "OK";
            const durationMs = Date.now() - started;
            return json(request, {
              result,
              meta: {
                request_id: payload.request_id,
                model,
                usage: usageFrom(openaiPayload),
                duration_ms: durationMs,
                attempts: attempt + 1,
              },
            });
          }
          if (attempt === 1) {
            throw new AnalyzeError(
              502,
              "INVALID_MODEL_OUTPUT",
              "Не удалось получить корректный структурированный результат.",
              "schema_validation",
            );
          }
        }
        throw new AnalyzeError(
          502,
          "INVALID_MODEL_OUTPUT",
          "Не удалось получить корректный структурированный результат.",
          "schema_validation",
        );
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        error = new AnalyzeError(
          504,
          "OPENAI_TIMEOUT",
          "Анализ занял слишком много времени. Попробуйте позже.",
          "timeout",
        );
      }
      code = error instanceof HttpError ? error.code : "SERVER_ERROR";
      errorType = error instanceof AnalyzeError
        ? error.technicalType
        : error instanceof HttpError
        ? error.code.toLowerCase()
        : "unexpected";
      return safeError(request, error);
    } finally {
      deps.log({
        request_id: logRequestId,
        code,
        duration_ms: Date.now() - started,
        error_type: errorType,
      });
    }
  };
}
