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

function sortedShpParts(shp: Record<string, string> = {}): string[] {
  return Object.entries(shp)
    .filter(([key]) => key.startsWith("Shp_"))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`);
}

export async function paymentSignature(
  login: string,
  outSum: string,
  invId: string,
  password: string,
  encodedReceipt?: string,
  shp: Record<string, string> = {},
): Promise<string> {
  const parts = [login, outSum, invId];
  if (encodedReceipt) parts.push(encodedReceipt);
  parts.push(password, ...sortedShpParts(shp));
  return await sha256Hex(parts.join(":"));
}

export async function resultSignature(
  outSum: string,
  invId: string,
  password: string,
  shp: Record<string, string> = {},
): Promise<string> {
  return await sha256Hex([outSum, invId, password, ...sortedShpParts(shp)].join(":"));
}

export function collectShp(params: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith("Shp_")) result[key] = value;
  }
  return result;
}

export function constantTimeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left.toLowerCase());
  const b = encoder.encode(right.toLowerCase());
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
