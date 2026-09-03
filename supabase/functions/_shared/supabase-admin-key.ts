export type EnvReader = (name: string) => string | undefined;

export function getSupabaseAdminKey(
  getEnv: EnvReader = (name) => Deno.env.get(name),
): string {
  const secretKey = getEnv("SUPABASE_SECRET_KEY")?.trim();
  if (secretKey) return secretKey;

  const secretKeys = getEnv("SUPABASE_SECRET_KEYS");
  if (secretKeys) {
    try {
      const parsed: unknown = JSON.parse(secretKeys);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const defaultKey = (parsed as Record<string, unknown>).default;
        if (typeof defaultKey === "string" && defaultKey.trim()) {
          return defaultKey.trim();
        }
      }
    } catch {
      return "";
    }
  }

  if (getEnv("APP_ENV") !== "production") {
    return getEnv("SUPABASE_SERVICE_ROLE_KEY")?.trim() ?? "";
  }

  return "";
}
