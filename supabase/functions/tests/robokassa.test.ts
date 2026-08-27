import { constantTimeEqual, normalizeOutSum, paymentSignature, resultSignature } from "../_shared/robokassa.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("normalizes Robokassa sums without accepting loose numeric input", () => {
  assert(normalizeOutSum("290") === "290.00", "integer sum");
  assert(normalizeOutSum("290.0") === "290.00", "single decimal");
  assert(normalizeOutSum("290.00") === "290.00", "two decimals");
  assert(normalizeOutSum("290.000") === null, "too many decimals");
  assert(normalizeOutSum("+290.00") === null, "signed sum");
});

Deno.test("SHA-256 signatures are deterministic and role-specific", async () => {
  const payment = await paymentSignature("shop", "290.00", "42", "password1");
  const result = await resultSignature("290.00", "42", "password2");
  assert(/^[0-9a-f]{64}$/.test(payment), "payment signature format");
  assert(/^[0-9a-f]{64}$/.test(result), "result signature format");
  assert(payment !== result, "password roles must not collide");
  assert(constantTimeEqual(payment, payment.toUpperCase()), "comparison is case-insensitive");
  assert(!constantTimeEqual(payment, result), "different signatures rejected");
});
