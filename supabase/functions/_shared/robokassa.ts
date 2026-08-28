const encoder = new TextEncoder();

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function normalizeOutSum(value: string): string | null {
  if (!/^\d+(?:\.\d+)?$/.test(value)) return null;
  const [rubles, fraction = ""] = value.split(".");
  const kopecks = fraction.slice(0, 2).padEnd(2, "0");
  if (fraction.slice(2).replace(/0/g, "") !== "") return null;
  return `${rubles}.${kopecks}`;
}

export async function paymentSignature(
  login: string,
  outSum: string,
  invId: string,
  password: string,
  encodedReceipt?: string,
): Promise<string> {
  const parts = [login, outSum, invId];
  if (encodedReceipt) parts.push(encodedReceipt);
  parts.push(password);
  return await sha256Hex(parts.join(":"));
}

export async function resultSignature(outSum: string, invId: string, password: string): Promise<string> {
  return await sha256Hex(`${outSum}:${invId}:${password}`);
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left.toLowerCase());
  const b = encoder.encode(right.toLowerCase());
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
