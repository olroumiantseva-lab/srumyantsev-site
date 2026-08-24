import { createAnalyzeDocumentHandler } from "../_shared/analyze-document.ts";

const requestId = "11111111-1111-4111-8111-111111111111";
const allowedOrigin = "http://127.0.0.1:4174";
const validResult = {
  document_type: "letter",
  summary: "Краткое содержание.",
  what_it_means: "Документ требует ответа.",
  required_actions: ["Подготовить ответ."],
  deadlines: [{
    date: "2026-08-25",
    label: "Ответить до 25 августа",
    is_exact: true,
  }],
  amounts: [],
  important_points: ["Указан срок."],
  potential_risks: [],
  next_steps: ["Проверить реквизиты."],
  questions_for_specialist: [],
  uncertainties: [],
};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function basePayload(overrides: Record<string, unknown> = {}) {
  return {
    request_id: requestId,
    document_type: "letter",
    goals: ["plain", "actions"],
    source_text: "Обезличенный текст документа.",
    user_context: "",
    ...overrides,
  };
}

function request(
  payload: Record<string, unknown>,
  authorization = "Bearer test-token",
) {
  return new Request("https://test.functions.supabase.co/analyze-document", {
    method: "POST",
    headers: {
      Authorization: authorization,
      Origin: allowedOrigin,
      "Content-Type": "application/json",
      "x-request-id": requestId,
    },
    body: JSON.stringify(payload),
  });
}

function openAIResponse(output: string, status = 200) {
  return new Response(
    JSON.stringify({
      output: [{
        type: "message",
        content: [{ type: "output_text", text: output }],
      }],
      usage: { input_tokens: 120, output_tokens: 80, total_tokens: 200 },
    }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

function dependencies(
  fetchStub: typeof fetch,
  logs: unknown[] = [],
  timeoutMs = 100,
) {
  return {
    authenticate: async () => ({ user: { id: "test-user" } }),
    fetch: fetchStub,
    getEnv: (name: string) =>
      name === "OPENAI_API_KEY"
        ? "test-key"
        : name === "OPENAI_MODEL"
        ? "test-model"
        : undefined,
    isOriginAllowed: (value: Request) =>
      value.headers.get("origin") === allowedOrigin,
    log: (entry: unknown) => logs.push(entry),
    timeoutMs,
  };
}

Deno.test("analyze-document schema copy matches verified eval schema", async () => {
  const shared = await Deno.readTextFile(
    new URL("../_shared/document-result-schema.json", import.meta.url),
  );
  const verified = await Deno.readTextFile(
    new URL(
      "../../../evals/document-analyzer/result.schema.json",
      import.meta.url,
    ),
  );
  assert(shared === verified, "Shared result schema drifted from eval schema");
});

Deno.test("successful response uses configured model, store false and returns usage", async () => {
  let outbound: Record<string, unknown> | null = null;
  const logs: unknown[] = [];
  const fetchStub: typeof fetch = async (_input, init) => {
    outbound = JSON.parse(String(init?.body));
    return openAIResponse(JSON.stringify(validResult));
  };
  const handler = createAnalyzeDocumentHandler(dependencies(fetchStub, logs));
  const response = await handler(request(basePayload()));
  const body = await response.json();
  const sentBody = outbound as Record<string, unknown> | null;
  assert(response.status === 200, "Success status must be 200");
  assert(sentBody?.model === "test-model", "Model must come from OPENAI_MODEL");
  assert(sentBody?.store === false, "Responses API store must be false");
  assert(
    body.result.summary === validResult.summary,
    "Validated result missing",
  );
  assert(
    body.meta.usage.total_tokens === 200 && body.meta.attempts === 1,
    "Usage metadata missing",
  );
  assert(
    logs.length === 1 && (logs[0] as Record<string, unknown>).code === "OK",
    "Success log missing",
  );
});

Deno.test("invalid JSON retries once then returns safe error", async () => {
  let calls = 0;
  const handler = createAnalyzeDocumentHandler(dependencies(async () => {
    calls += 1;
    return openAIResponse("not-json-sensitive");
  }));
  const response = await handler(request(basePayload()));
  const text = await response.text();
  assert(response.status === 502, "Invalid JSON must return 502");
  assert(calls === 2, "Invalid JSON must retry exactly once");
  assert(
    !text.includes("not-json-sensitive"),
    "Raw model output leaked in error",
  );
});

Deno.test("schema violation retries once then fails", async () => {
  let calls = 0;
  const invalid = JSON.stringify({ ...validResult, summary: "" });
  const handler = createAnalyzeDocumentHandler(dependencies(async () => {
    calls += 1;
    return openAIResponse(invalid);
  }));
  const response = await handler(request(basePayload()));
  const body = await response.json();
  assert(
    response.status === 502 && body.error === "INVALID_MODEL_OUTPUT",
    "Schema violation must be rejected",
  );
  assert(calls === 2, "Schema violation must retry at most once");
});

Deno.test("timeout aborts OpenAI and returns 504", async () => {
  const fetchStub: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () =>
          reject(new DOMException("sensitive timeout detail", "AbortError")),
        { once: true },
      );
    });
  const handler = createAnalyzeDocumentHandler(dependencies(fetchStub, [], 5));
  const response = await handler(request(basePayload()));
  const text = await response.text();
  assert(response.status === 504, "Timeout must return 504");
  assert(!text.includes("sensitive timeout detail"), "Timeout detail leaked");
});

Deno.test("request without JWT returns 401 before payload processing", async () => {
  const logs: unknown[] = [];
  const handler = createAnalyzeDocumentHandler({
    log: (entry) => logs.push(entry),
  });
  const response = await handler(request(basePayload(), ""));
  assert(response.status === 401, "Missing JWT must return 401");
  assert(
    (await response.json()).error === "AUTH_REQUIRED",
    "Missing JWT error code mismatch",
  );
});

Deno.test("empty source text is rejected without OpenAI call", async () => {
  let called = false;
  const handler = createAnalyzeDocumentHandler(dependencies(async () => {
    called = true;
    return openAIResponse(JSON.stringify(validResult));
  }));
  const response = await handler(request(basePayload({ source_text: "   " })));
  assert(
    response.status === 400 && !called,
    "Empty source must fail before OpenAI",
  );
});

Deno.test("source text over 30000 characters is rejected", async () => {
  let called = false;
  const handler = createAnalyzeDocumentHandler(dependencies(async () => {
    called = true;
    return openAIResponse(JSON.stringify(validResult));
  }));
  const response = await handler(
    request(basePayload({ source_text: "x".repeat(30001) })),
  );
  assert(
    response.status === 400 && !called,
    "Oversized source must fail before OpenAI",
  );
  assert(
    (await response.json()).error === "DOCUMENT_TOO_LARGE",
    "Oversized source error mismatch",
  );
});

Deno.test("OpenAI HTTP error returns safe response", async () => {
  const handler = createAnalyzeDocumentHandler(
    dependencies(async () =>
      new Response(
        JSON.stringify({ error: { message: "sensitive upstream response" } }),
        { status: 500 },
      )
    ),
  );
  const response = await handler(request(basePayload()));
  const text = await response.text();
  assert(response.status === 502, "OpenAI failure must return 502");
  assert(
    !text.includes("sensitive upstream response"),
    "OpenAI error content leaked",
  );
});

Deno.test("logs and errors exclude document, context and model output", async () => {
  const documentSecret = "DOCUMENT-SECRET-7429";
  const contextSecret = "CONTEXT-SECRET-9138";
  const outputSecret = "MODEL-SECRET-6284";
  const logs: unknown[] = [];
  const handler = createAnalyzeDocumentHandler(
    dependencies(async () => openAIResponse(outputSecret), logs),
  );
  const response = await handler(
    request(
      basePayload({ source_text: documentSecret, user_context: contextSecret }),
    ),
  );
  const serializedLogs = JSON.stringify(logs);
  const errorText = await response.text();
  for (const secret of [documentSecret, contextSecret, outputSecret]) {
    assert(
      !serializedLogs.includes(secret),
      `Sensitive value leaked in logs: ${secret}`,
    );
    assert(
      !errorText.includes(secret),
      `Sensitive value leaked in error: ${secret}`,
    );
  }
  const keys = Object.keys(logs[0] as Record<string, unknown>).sort().join(",");
  assert(
    keys === "code,duration_ms,error_type,request_id",
    "Log contains fields outside the allowlist",
  );
});

Deno.test("file fields and unapproved origins are rejected", async () => {
  let called = false;
  const handler = createAnalyzeDocumentHandler(dependencies(async () => {
    called = true;
    return openAIResponse(JSON.stringify(validResult));
  }));
  const fileResponse = await handler(request(basePayload({ file: "base64" })));
  assert(
    fileResponse.status === 400 && !called,
    "Raw file field must be rejected",
  );
  const badOriginRequest = request(basePayload());
  badOriginRequest.headers.set("origin", "https://unapproved.example");
  const originResponse = await handler(badOriginRequest);
  assert(
    originResponse.status === 403 && !called,
    "Unapproved origin must be rejected",
  );
});
