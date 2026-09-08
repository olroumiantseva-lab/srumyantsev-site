import { HttpError, json, options, originAllowed, requireUser, safeError } from "../_shared/http.ts";

Deno.serve(async (request) => {
  const preflight = options(request);
  if (preflight) return preflight;
  try {
    if (request.method !== "POST") throw new HttpError(405, "METHOD_NOT_ALLOWED", "Метод не поддерживается.");
    if (!originAllowed(request)) throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Запрос с этого сайта запрещён.");

    const { user, admin } = await requireUser(request);
    const payload = await request.json();
    const orderId = Number(payload.order_id);
    if (!Number.isInteger(orderId) || orderId <= 0) throw new HttpError(400, "INVALID_ORDER", "Некорректный номер заказа.");

    const { data: entitlement, error: entitlementError } = await admin
      .from("entitlements")
      .select("id,product_id,payment_order_id,resource_type,resource_id,status,entitlement_key")
      .eq("user_id", user.id)
      .eq("payment_order_id", orderId)
      .eq("product_id", "contract_check_490")
      .eq("status", "active")
      .maybeSingle();
    if (entitlementError) throw entitlementError;
    if (!entitlement || entitlement.resource_type !== "contract_scan" || !entitlement.resource_id) {
      throw new HttpError(403, "ENTITLEMENT_REQUIRED", "Полный разбор доступен только после оплаты.");
    }

    const { data: scan, error: scanError } = await admin
      .from("contract_scans")
      .select("id,role,focus,signed,status,full_result_json,created_at")
      .eq("id", entitlement.resource_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (scanError) throw scanError;
    if (!scan || !scan.full_result_json) throw new HttpError(404, "RESULT_NOT_FOUND", "Результат не найден.");

    return json(request, {
      order_id: orderId,
      scan_id: scan.id,
      role: scan.role,
      focus: scan.focus,
      signed: scan.signed,
      created_at: scan.created_at,
      result: scan.full_result_json,
    });
  } catch (error) {
    return safeError(request, error);
  }
});
