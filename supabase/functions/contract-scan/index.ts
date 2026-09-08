import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError, json, options, originAllowed, safeError } from "../_shared/http.ts";
import { getSupabaseAdminKey } from "../_shared/supabase-admin-key.ts";

const OPENAI_URL = "https://api.openai.com/v1/responses";
const MAX_SOURCE_LENGTH = 30000;
const MAX_BODY_BYTES = 65536;
const MAX_SCANS_PER_HOUR = 5;

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["risk_level","summary","findings","missing_terms","questions","checklist"],
  properties: {
    risk_level: { type: "string", enum: ["low","medium","high"] },
    summary: { type: "string" },
    findings: {
      type: "array",
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title","why","action"],
        properties: {
          title: { type: "string" },
          why: { type: "string" },
          action: { type: "string" }
        }
      }
    },
    missing_terms: { type: "array", maxItems: 10, items: { type: "string" } },
    questions: { type: "array", maxItems: 10, items: { type: "string" } },
    checklist: { type: "array", maxItems: 10, items: { type: "string" } }
  }
};

function outputText(payload: Record<string, unknown>): string | null {
  const output = Array.isArray(payload.output) ? payload.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = Array.isArray((item as Record<string, unknown>).content) ? (item as Record<string, unknown>).content as unknown[] : [];
    for (const part of content) {
      if (part && typeof part === "object" && (part as Record<string, unknown>).type === "output_text" && typeof (part as Record<string, unknown>).text === "string") {
        return (part as Record<string, unknown>).text as string;
      }
    }
  }
  return null;
}

async function fingerprint(request: Request): Promise<string> {
  const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "unknown";
  const ua = request.headers.get("user-agent") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${ua}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  const preflight = options(request); if (preflight) return preflight;
  try {
    if (request.method !== "POST") throw new HttpError(405,"METHOD_NOT_ALLOWED","Метод не поддерживается.");
    if (!originAllowed(request)) throw new HttpError(403,"ORIGIN_NOT_ALLOWED","Запрос с этого сайта запрещён.");
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) throw new HttpError(413,"PAYLOAD_TOO_LARGE","Документ слишком большой.");

    const payload = await request.json();
    const sourceText = typeof payload.source_text === "string" ? payload.source_text.trim() : "";
    const role = typeof payload.role === "string" ? payload.role.trim() : "";
    const focus = typeof payload.focus === "string" ? payload.focus.trim() : "";
    const signed = typeof payload.signed === "string" ? payload.signed.trim() : "";
    if (!sourceText) throw new HttpError(400,"EMPTY_DOCUMENT","Добавьте текст договора.");
    if (sourceText.length > MAX_SOURCE_LENGTH) throw new HttpError(400,"DOCUMENT_TOO_LARGE","Текст договора превышает 30 000 символов.");

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const secret = getSupabaseAdminKey();
    const apiKey = Deno.env.get("OPENAI_API_KEY") ?? "";
    const model = Deno.env.get("OPENAI_MODEL") ?? "";
    if (!url || !secret || !apiKey || !model) throw new HttpError(500,"SERVER_CONFIG","Проверка пока не настроена.");
    const admin = createClient(url, secret, { auth: { persistSession:false, autoRefreshToken:false } });

    const fp = await fingerprint(request);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await admin.from("contract_scans").select("id", { count: "exact", head: true }).eq("request_fingerprint", fp).gte("created_at", since);
    if (countError) throw countError;
    if ((count ?? 0) >= MAX_SCANS_PER_HOUR) throw new HttpError(429,"RATE_LIMIT","Слишком много проверок. Попробуйте позже.");

    const instructions = [
      "Проведи предварительную проверку договора по предоставленному тексту.",
      "Не выдумывай отсутствующие факты и не давай юридических гарантий.",
      "Ищи финансовые риски, сроки, ответственность, расторжение, скрытые обязанности и пробелы.",
      "Формулируй простым русским языком.",
      "Верни результат строго по JSON Schema."
    ].join(" ");

    const openai = await fetch(OPENAI_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        instructions,
        input: `Роль пользователя: ${role || "не указана"}\nФокус: ${focus || "все риски"}\nДоговор уже подписан: ${signed || "не указано"}\n\nДоговор:\n${sourceText}`,
        text: { format: { type: "json_schema", name: "contract_scan", strict: true, schema } }
      })
    });
    if (!openai.ok) throw new HttpError(502,"OPENAI_ERROR","Сервис проверки временно недоступен.");
    const raw = await openai.json();
    const text = outputText(raw as Record<string, unknown>);
    if (!text) throw new HttpError(502,"OPENAI_ERROR","Сервис проверки вернул некорректный ответ.");
    let full: any;
    try { full = JSON.parse(text); } catch { throw new HttpError(502,"OPENAI_ERROR","Сервис проверки вернул некорректный ответ."); }
    const findings = Array.isArray(full.findings) ? full.findings : [];

    const { data: scan, error: insertError } = await admin.from("contract_scans").insert({
      source_text: sourceText,
      role,
      focus,
      signed,
      status: "preview_ready",
      preview_json: {
        risk_level: full.risk_level,
        summary: full.summary,
        findings_count: findings.length,
        first_finding: findings[0] ?? null
      },
      full_result_json: full,
      request_fingerprint: fp
    }).select("id,expires_at").single();
    if (insertError) throw insertError;

    return json(request, {
      scan_id: scan.id,
      expires_at: scan.expires_at,
      risk_level: full.risk_level,
      summary: full.summary,
      findings_count: findings.length,
      findings: findings.slice(0,1)
    });
  } catch (error) {
    return safeError(request,error);
  }
});
