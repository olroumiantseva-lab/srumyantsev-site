import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError, json, options, originAllowed, safeError } from "../_shared/http.ts";
import { creditsForProduct, kopecksToOutSum, ProductRecord, robokassaReceipt, sourceAllowed } from "../_shared/payment-core.ts";
import { paymentSignature } from "../_shared/robokassa.ts";
import { getSupabaseAdminKey } from "../_shared/supabase-admin-key.ts";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const idPattern = /^[a-z0-9][a-z0-9_-]{2,79}$/;
const sourcePattern = /^[a-z0-9][a-z0-9_-]{1,39}$/;

function logPayment(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ service: "payment_core", event, ...fields }));
}

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  if (request.method !== "POST") return json(request, { error: "METHOD_NOT_ALLOWED", message: "Метод не поддерживается." }, 405);

  const started = Date.now();
  let orderId: string | null = null;
  let productId = "invalid";

  try {
    if (!originAllowed(request)) throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Запрос с этого сайта запрещён.");

    const payload = await request.json();
    const email = String(payload.email ?? "").trim().toLowerCase();
    productId = String(payload.product_id ?? "").trim();
    const sourceSite = String(payload.source_site ?? "").trim();

    if (!emailPattern.test(email) || email.length > 320) throw new HttpError(400, "INVALID_EMAIL", "Проверьте адрес электронной почты.");
    if (!idPattern.test(productId)) throw new HttpError(400, "INVALID_PRODUCT", "Продукт не найден.");
    if (!sourcePattern.test(sourceSite)) throw new HttpError(400, "INVALID_SOURCE", "Источник продажи не поддерживается.");

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const secret = getSupabaseAdminKey();
    const isTest = Deno.env.get("APP_ENV") !== "production";
    const login = Deno.env.get("ROBOKASSA_MERCHANT_LOGIN") ?? "";
    const password = Deno.env.get(isTest ? "ROBOKASSA_TEST_PASSWORD_1" : "ROBOKASSA_PASSWORD_1") ?? "";
    if (!url || !secret || !login || !password) throw new HttpError(500, "SERVER_CONFIG", "Оплата пока не настроена.");

    const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error: expireError } = await admin.rpc("expire_stale_payment_orders");
    if (expireError) throw expireError;

    const { data: productData, error: productError } = await admin
      .from("products")
      .select("id,name,receipt_name,amount_kopecks,currency,allowed_source_sites,entitlement_type,entitlement_payload,active")
      .eq("id", productId)
      .eq("active", true)
      .maybeSingle();
    if (productError) throw productError;
    if (!productData) throw new HttpError(404, "PRODUCT_NOT_FOUND", "Продукт не найден или временно недоступен.");

    const product = productData as ProductRecord;
    if (product.currency !== "RUB") throw new HttpError(409, "UNSUPPORTED_CURRENCY", "Эта валюта пока не поддерживается.");
    if (!sourceAllowed(product, sourceSite)) throw new HttpError(403, "PRODUCT_SOURCE_NOT_ALLOWED", "Этот продукт недоступен на выбранном сайте.");

    const credits = creditsForProduct(product);
    const { data: order, error: orderError } = await admin
      .from("payment_orders")
      .insert({
        email,
        product_id: product.id,
        source_site: sourceSite,
        amount_kopecks: product.amount_kopecks,
        credits,
        entitlement_type: product.entitlement_type,
        entitlement_payload: product.entitlement_payload,
      })
      .select("id")
      .single();
    if (orderError) throw orderError;

    const invId = String(order.id);
    const outSum = kopecksToOutSum(product.amount_kopecks);
    orderId = invId;

    const receipt = robokassaReceipt(product);
    const encodedReceipt = encodeURIComponent(receipt);
    const signature = await paymentSignature(login, outSum, invId, password, encodedReceipt);
    const paymentUrl = new URL("https://auth.robokassa.ru/Merchant/Index.aspx");
    paymentUrl.searchParams.set("MerchantLogin", login);
    paymentUrl.searchParams.set("OutSum", outSum);
    paymentUrl.searchParams.set("InvId", invId);
    paymentUrl.searchParams.set("Description", product.name);
    paymentUrl.searchParams.set("Email", email);
    paymentUrl.searchParams.set("Receipt", encodedReceipt);
    paymentUrl.searchParams.set("SignatureValue", signature);
    if (isTest) paymentUrl.searchParams.set("IsTest", "1");

    logPayment("payment_link_created", {
      order_id: invId,
      product_id: product.id,
      source_site: sourceSite,
      amount_kopecks: product.amount_kopecks,
      entitlement_type: product.entitlement_type,
      mode: isTest ? "test" : "production",
      duration_ms: Date.now() - started,
    });

    return json(request, {
      payment_url: paymentUrl.toString(),
      order_id: invId,
      product_id: product.id,
      amount_kopecks: product.amount_kopecks,
      currency: product.currency,
    });
  } catch (error) {
    logPayment("payment_link_failed", {
      order_id: orderId,
      product_id: productId,
      error_code: error instanceof HttpError ? error.code : "UNEXPECTED",
      duration_ms: Date.now() - started,
    });
    return safeError(request, error);
  }
});
