import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { creditsForProduct, kopecksToOutSum, ProductRecord, sourceAllowed } from "../_shared/payment-core.ts";

const product: ProductRecord = {
  id: "document_explain_290",
  name: "Разбор документов — 10 разборов",
  receipt_name: "Доступ к сервису разбора документов — 10 разборов",
  amount_kopecks: 29000,
  currency: "RUB",
  allowed_source_sites: ["ded"],
  entitlement_type: "credits",
  entitlement_payload: { credits: 10 },
  active: true,
};

Deno.test("kopecksToOutSum formats Robokassa amount", () => {
  assertEquals(kopecksToOutSum(29000), "290.00");
  assertEquals(kopecksToOutSum(149000), "1490.00");
});

Deno.test("kopecksToOutSum rejects invalid amount", () => {
  assertThrows(() => kopecksToOutSum(0));
  assertThrows(() => kopecksToOutSum(10.5));
});

Deno.test("credit product entitlement is server-defined", () => {
  assertEquals(creditsForProduct(product), 10);
});

Deno.test("source site must be explicitly allowed", () => {
  assertEquals(sourceAllowed(product, "ded"), true);
  assertEquals(sourceAllowed(product, "proverjdo"), false);
});
