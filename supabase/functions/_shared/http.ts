import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

const localOrigins = new Set(["http://127.0.0.1:4174", "http://localhost:4174"]);

function allowedOrigins(): Set<string> {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...localOrigins, ...configured]);
}

export function originAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  return !origin || allowedOrigins().has(origin);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") ?? "";
  const allowed = allowedOrigins();
  return {
    "Access-Control-Allow-Origin": allowed.has(origin) ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-request-id, x-dev-force-error",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
}

export function json(request: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) });
}

export function options(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}

type AuthContext = { user: User; admin: SupabaseClient };

export async function requireUser(request: Request): Promise<AuthContext> {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!token) throw new HttpError(401, "AUTH_REQUIRED", "Войдите, чтобы продолжить.");

  const url = Deno.env.get("SUPABASE_URL") ?? "";
  const publishable = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const secret = Deno.env.get("SUPABASE_SECRET_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!url || !publishable || !secret) throw new HttpError(500, "SERVER_CONFIG", "Сервис пока не настроен.");

  const authClient = createClient(url, publishable, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "AUTH_EXPIRED", "Ссылка или сеанс устарели. Войдите ещё раз.");

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  return { user: data.user, admin };
}

export class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

export function safeError(request: Request, error: unknown): Response {
  if (error instanceof HttpError) return json(request, { error: error.code, message: error.message }, error.status);
  const message = error instanceof Error ? error.message : "";
  if (message.includes("NO_CREDITS")) return json(request, { error: "NO_CREDITS", message: "Разборы закончились. Добавьте кредиты, чтобы продолжить." }, 409);
  if (message.includes("REQUEST_CONFLICT")) return json(request, { error: "REQUEST_CONFLICT", message: "Этот идентификатор запроса уже использован для другого документа." }, 409);
  if (message.includes("STALE_LEASE")) return json(request, { error: "ANALYSIS_SUPERSEDED", message: "Этот запуск уже обрабатывается другим запросом." }, 409);
  if (message.includes("FOLLOWUP_LIMIT")) return json(request, { error: "FOLLOWUP_LIMIT", message: "Для этого документа использованы все 3 уточнения." }, 409);
  if (message.includes("SESSION_NOT_FOUND")) return json(request, { error: "NOT_FOUND", message: "Разбор не найден." }, 404);
  return json(request, { error: "SERVER_ERROR", message: "Не удалось выполнить запрос. Попробуйте ещё раз." }, 500);
}

export function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
