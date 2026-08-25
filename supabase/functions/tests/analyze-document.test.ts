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
  overrides: Parameters<typeof createAnalyzeDocumentHandler>[0] = {},
) {
  return {
    authenticate: async () =>
      ({ user: { id: "test-user" }, admin: {} }) as never,
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
    reserve: async () => ({
      session_id: "22222222-2222-4222-8222-222222222222",
      request_status: "acquired" as const,
      lease_generation: 1,
    }),
    markInflight: async () => {},
    stage: async () => {},
    complete: async () => "22222222-2222-4222-8222-222222222222",
    abort: async () => {},
    sleep: async () => {},
    ...overrides,
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

Deno.test("completed idempotent request returns session without OpenAI", async () => {
  let openAICalls = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => ({
          session_id: "22222222-2222-4222-8222-222222222222",
          request_status: "completed",
          lease_generation: 1,
        }),
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const body = await response.json();
  assert(
    response.status === 200 && body.status === "completed",
    "Completed request must be reused",
  );
  assert(openAICalls === 0, "Completed request must not call OpenAI again");
});

Deno.test("active reserved request returns safe 202 without OpenAI", async () => {
  let openAICalls = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => ({
          session_id: "22222222-2222-4222-8222-222222222222",
          request_status: "reserved",
          lease_generation: 4,
        }),
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const body = await response.json();
  assert(
    response.status === 202 && body.status === "processing",
    "Processing request must return 202",
  );
  assert(
    body.request_id === requestId && body.session_id,
    "202 status must contain safe identifiers",
  );
  assert(openAICalls === 0, "Parallel request must not call OpenAI");
});

Deno.test("expired reserved takeover may start exactly one OpenAI call", async () => {
  let openAICalls = 0;
  let inflightMarks = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => ({
          session_id: "22222222-2222-4222-8222-222222222222",
          request_status: "acquired",
          lease_generation: 2,
        }),
        markInflight: async () => {
          inflightMarks += 1;
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  assert(response.status === 200, "Expired reserved takeover must complete");
  assert(
    inflightMarks === 1 && openAICalls === 1,
    "Takeover must cross inflight fence before one OpenAI call",
  );
});

Deno.test("expired openai_inflight returns recovery_required without OpenAI", async () => {
  let openAICalls = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => ({
          session_id: "22222222-2222-4222-8222-222222222222",
          request_status: "recovery_required",
          lease_generation: 1,
        }),
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const body = await response.json();
  assert(
    response.status === 202 && body.status === "recovery_required",
    "Inflight recovery status mismatch",
  );
  assert(openAICalls === 0, "Expired inflight request must not call OpenAI");
});

Deno.test("crash after valid OpenAI before stage forbids repeated OpenAI", async () => {
  let openAICalls = 0;
  let reserveCalls = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => {
          reserveCalls += 1;
          return {
            session_id: "22222222-2222-4222-8222-222222222222",
            request_status: reserveCalls === 1
              ? "acquired"
              : "recovery_required",
            lease_generation: 1,
          };
        },
        stage: async () => {
          throw new Error("stage network failure");
        },
      },
    ),
  );
  const first = await handler(request(basePayload()));
  assert(
    first.status === 503 &&
      (await first.json()).error === "PERSISTENCE_PENDING",
    "Stage failure must be controlled",
  );
  const second = await handler(request(basePayload()));
  assert(
    second.status === 202 &&
      (await second.json()).status === "recovery_required",
    "Inflight retry must require recovery",
  );
  assert(openAICalls === 1, "Crash before stage must never repeat OpenAI");
});

Deno.test("persistence_pending retries only complete", async () => {
  let openAICalls = 0;
  let completes = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => ({
          session_id: "22222222-2222-4222-8222-222222222222",
          request_status: "persistence_pending",
          lease_generation: 3,
        }),
        complete: async () => {
          completes += 1;
          return "22222222-2222-4222-8222-222222222222";
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  assert(response.status === 200, "Persistence recovery must complete");
  assert(
    completes === 1 && openAICalls === 0,
    "Persistence recovery must only call complete",
  );
});

Deno.test("lost stage response retries stage idempotently without repeating OpenAI", async () => {
  let openAICalls = 0;
  let stages = 0;
  let completes = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        stage: async () => {
          stages += 1;
          if (stages === 1) throw new Error("lost stage response");
        },
        complete: async () => {
          completes += 1;
          return "22222222-2222-4222-8222-222222222222";
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  assert(response.status === 200, "Idempotent stage retry must recover");
  assert(
    openAICalls === 1 && stages === 2 && completes === 1,
    "Only stage may repeat after lost stage response",
  );
});

Deno.test("payload hash conflict is rejected before OpenAI", async () => {
  let openAICalls = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => {
          throw new Error("REQUEST_CONFLICT");
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  assert(response.status === 409, "Payload conflict must return 409");
  assert(
    (await response.json()).error === "REQUEST_CONFLICT",
    "Payload conflict code mismatch",
  );
  assert(openAICalls === 0, "Payload conflict must not call OpenAI");
});

Deno.test("valid result retries only complete and never repeats OpenAI", async () => {
  let openAICalls = 0;
  let completes = 0;
  let aborts = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        complete: async () => {
          completes += 1;
          if (completes < 3) throw new Error("temporary database error");
          return "22222222-2222-4222-8222-222222222222";
        },
        abort: async () => {
          aborts += 1;
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  assert(response.status === 200, "Completion retry must recover");
  assert(openAICalls === 1, "Completion retry must not repeat OpenAI");
  assert(completes === 3, "Complete must use bounded retries");
  assert(aborts === 0, "Valid result must never be aborted");
});

Deno.test("exhausted complete leaves processing and does not abort or repeat OpenAI", async () => {
  let openAICalls = 0;
  let completes = 0;
  let aborts = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        complete: async () => {
          completes += 1;
          throw new Error("temporary database error");
        },
        abort: async () => {
          aborts += 1;
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const body = await response.json();
  assert(
    response.status === 503 && body.error === "PERSISTENCE_PENDING",
    "Completion exhaustion must be controlled",
  );
  assert(openAICalls === 1, "Completion failure must not repeat OpenAI");
  assert(completes === 3, "Completion retry count must be bounded");
  assert(aborts === 0, "Valid result with DB failure must remain processing");
});

Deno.test("expired persistence_pending retry completes with one total OpenAI call", async () => {
  let openAICalls = 0;
  let reserveCalls = 0;
  let completeCalls = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        openAICalls += 1;
        return openAIResponse(JSON.stringify(validResult));
      },
      [],
      100,
      {
        reserve: async () => {
          reserveCalls += 1;
          return {
            session_id: "22222222-2222-4222-8222-222222222222",
            request_status: reserveCalls === 1
              ? "acquired" as const
              : "persistence_pending" as const,
            lease_generation: 1,
          };
        },
        complete: async () => {
          completeCalls += 1;
          if (completeCalls <= 3) throw new Error("temporary database error");
          return "22222222-2222-4222-8222-222222222222";
        },
      },
    ),
  );
  const first = await handler(request(basePayload()));
  assert(
    first.status === 503 &&
      (await first.json()).error === "PERSISTENCE_PENDING",
    "First request must expose persistence pending",
  );
  const second = await handler(request(basePayload()));
  assert(second.status === 200, "Persistence retry must complete");
  assert(
    openAICalls === 1,
    "Expired persistence pending must not repeat OpenAI",
  );
  assert(completeCalls === 4, "Second request must retry only complete");
});

Deno.test("invalid JSON aborts without a repeated OpenAI call", async () => {
  let calls = 0;
  let aborts = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        calls += 1;
        return openAIResponse("not-json-sensitive");
      },
      [],
      100,
      {
        abort: async () => {
          aborts += 1;
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const text = await response.text();
  assert(response.status === 502, "Invalid JSON must return 502");
  assert(calls === 1, "Invalid JSON must not repeat OpenAI");
  assert(aborts === 1, "Invalid JSON must abort reservation");
  assert(
    !text.includes("not-json-sensitive"),
    "Raw model output leaked in error",
  );
});

Deno.test("schema violation aborts without a repeated OpenAI call", async () => {
  let calls = 0;
  let aborts = 0;
  const invalid = JSON.stringify({ ...validResult, summary: "" });
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () => {
        calls += 1;
        return openAIResponse(invalid);
      },
      [],
      100,
      {
        abort: async () => {
          aborts += 1;
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const body = await response.json();
  assert(
    response.status === 502 && body.error === "INVALID_MODEL_OUTPUT",
    "Schema violation must be rejected",
  );
  assert(calls === 1, "Schema violation must not repeat OpenAI");
  assert(aborts === 1, "Schema violation must abort reservation");
});

Deno.test("timeout leaves openai_inflight fenced and returns 504", async () => {
  let aborts = 0;
  const fetchStub: typeof fetch = (_input, init) =>
    new Promise((_resolve, reject) => {
      init?.signal?.addEventListener(
        "abort",
        () =>
          reject(new DOMException("sensitive timeout detail", "AbortError")),
        { once: true },
      );
    });
  const handler = createAnalyzeDocumentHandler(
    dependencies(fetchStub, [], 5, {
      abort: async () => {
        aborts += 1;
      },
    }),
  );
  const response = await handler(request(basePayload()));
  const text = await response.text();
  assert(response.status === 504, "Timeout must return 504");
  assert(
    aborts === 0,
    "Ambiguous timeout must remain fenced for explicit recovery",
  );
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
  let aborts = 0;
  const handler = createAnalyzeDocumentHandler(
    dependencies(
      async () =>
        new Response(
          JSON.stringify({ error: { message: "sensitive upstream response" } }),
          { status: 500 },
        ),
      [],
      100,
      {
        abort: async () => {
          aborts += 1;
        },
      },
    ),
  );
  const response = await handler(request(basePayload()));
  const text = await response.text();
  assert(response.status === 502, "OpenAI failure must return 502");
  assert(
    aborts === 1,
    "OpenAI failure before valid result must abort reservation",
  );
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
