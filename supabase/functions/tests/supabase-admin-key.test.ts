import { getSupabaseAdminKey } from "../_shared/supabase-admin-key.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function env(values: Record<string, string | undefined>) {
  return (name: string) => values[name];
}

Deno.test("reads the default key from SUPABASE_SECRET_KEYS", () => {
  const key = getSupabaseAdminKey(env({
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "json-secret" }),
    APP_ENV: "production",
  }));
  assert(key === "json-secret", "default secret key was not selected");
});

Deno.test("prefers SUPABASE_SECRET_KEY", () => {
  const key = getSupabaseAdminKey(env({
    SUPABASE_SECRET_KEY: "direct-secret",
    SUPABASE_SECRET_KEYS: JSON.stringify({ default: "json-secret" }),
    SUPABASE_SERVICE_ROLE_KEY: "legacy-secret",
    APP_ENV: "test",
  }));
  assert(key === "direct-secret", "direct secret key did not win");
});

Deno.test("production does not use SUPABASE_SERVICE_ROLE_KEY", () => {
  const key = getSupabaseAdminKey(env({
    SUPABASE_SERVICE_ROLE_KEY: "legacy-secret",
    APP_ENV: "production",
  }));
  assert(key === "", "production accepted the legacy key");
});

Deno.test("test and local environments allow the legacy fallback", () => {
  for (const appEnv of ["test", "local", undefined]) {
    const key = getSupabaseAdminKey(env({
      SUPABASE_SERVICE_ROLE_KEY: "legacy-secret",
      APP_ENV: appEnv,
    }));
    assert(
      key === "legacy-secret",
      `legacy fallback failed for ${appEnv ?? "unset"}`,
    );
  }
});

Deno.test("malformed SUPABASE_SECRET_KEYS returns no key without disclosure", () => {
  const malformed = '{"default":"sensitive-value"';
  let thrown: unknown;
  let key = "";
  try {
    key = getSupabaseAdminKey(env({
      SUPABASE_SECRET_KEYS: malformed,
      SUPABASE_SERVICE_ROLE_KEY: "legacy-secret",
      APP_ENV: "test",
    }));
  } catch (error) {
    thrown = error;
  }
  assert(key === "", "malformed JSON did not fail closed");
  assert(thrown === undefined, "malformed JSON escaped through an error");
});
