export type ProductRecord = {
  id: string;
  name: string;
  receipt_name: string;
  amount_kopecks: number;
  currency: string;
  allowed_source_sites: string[];
  entitlement_type: "credits" | "feature_access" | "session_unlock";
  entitlement_payload: Record<string, unknown>;
  active: boolean;
};

export function kopecksToOutSum(value: number): string {
  if (!Number.isInteger(value) || value <= 0) throw new Error("INVALID_AMOUNT");
  return (value / 100).toFixed(2);
}

export function creditsForProduct(product: ProductRecord): number {
  if (product.entitlement_type !== "credits") return 0;
  const value = Number(product.entitlement_payload?.credits ?? 0);
  if (!Number.isInteger(value) || value <= 0) throw new Error("INVALID_CREDIT_ENTITLEMENT");
  return value;
}

export function sourceAllowed(product: ProductRecord, sourceSite: string): boolean {
  return product.allowed_source_sites.includes(sourceSite);
}

export function robokassaReceipt(product: ProductRecord): string {
  return JSON.stringify({
    items: [{
      name: product.receipt_name,
      quantity: 1,
      sum: product.amount_kopecks / 100,
      payment_method: "full_payment",
      payment_object: "service",
      tax: "none",
    }],
  });
}
