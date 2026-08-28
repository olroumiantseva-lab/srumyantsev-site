import { constantTimeEqual, normalizeOutSum, paymentSignature, resultSignature } from "../_shared/robokassa.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("normalizes Robokassa sums without accepting loose numeric input", () => {
  assert(normalizeOutSum("290") === "290.00", "integer sum");
  assert(normalizeOutSum("290.0") === "290.00", "single decimal");
  assert(normalizeOutSum("290.00") === "290.00", "two decimals");
  assert(normalizeOutSum("290.000000") === "290.00", "provider fixed precision");
  assert(normalizeOutSum("290.001") === null, "non-zero excess precision");
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

Deno.test("receipt participates in the payment signature", async () => {
  const receipt = encodeURIComponent(JSON.stringify({items:[{name:"service",quantity:1,sum:290,tax:"none"}]}));
  const withoutReceipt = await paymentSignature("shop", "290.00", "42", "password1");
  const withReceipt = await paymentSignature("shop", "290.00", "42", "password1", receipt);
  const expected = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`shop:290.00:42:${receipt}:password1`),
  );
  const expectedHex = [...new Uint8Array(expected)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  assert(withReceipt === expectedHex, "receipt signature formula");
  assert(withReceipt !== withoutReceipt, "receipt must change payment signature");
});
