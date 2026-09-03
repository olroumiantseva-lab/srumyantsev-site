import { createClient } from "npm:@supabase/supabase-js@2";
import { HttpError, json, options, originAllowed, safeError } from "../_shared/http.ts";
import { paymentSignature } from "../_shared/robokassa.ts";
import { getSupabaseAdminKey } from "../_shared/supabase-admin-key.ts";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function logPayment(event:string, fields:Record<string,unknown>={}){
  console.log(JSON.stringify({service:"document_payment",event,...fields}));
}

Deno.serve(async (request) => {
  const preflight = options(request); if (preflight) return preflight;
  if (request.method !== "POST") return json(request,{error:"METHOD_NOT_ALLOWED",message:"Метод не поддерживается."},405);
  const started=Date.now();
  let orderId:string|null=null;
  try {
    if (!originAllowed(request)) throw new HttpError(403,"ORIGIN_NOT_ALLOWED","Запрос с этого сайта запрещён.");
    const payload = await request.json();
    const email = String(payload.email ?? "").trim().toLowerCase();
    if (!emailPattern.test(email) || email.length > 320) throw new HttpError(400,"INVALID_EMAIL","Проверьте адрес электронной почты.");
    const url=Deno.env.get("SUPABASE_URL")??"", secret=getSupabaseAdminKey();
    const isTest=Deno.env.get("APP_ENV")!=="production";
    const login=Deno.env.get("ROBOKASSA_MERCHANT_LOGIN")??"";
    const password=Deno.env.get(isTest?"ROBOKASSA_TEST_PASSWORD_1":"ROBOKASSA_PASSWORD_1")??"";
    if(!url||!secret||!login||!password) throw new HttpError(500,"SERVER_CONFIG","Оплата пока не настроена.");
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error:expireError}=await admin.rpc("expire_stale_payment_orders");
    if(expireError) throw expireError;
    const {data,error}=await admin.from("payment_orders").insert({email}).select("id").single();
    if(error) throw error;
    const invId=String(data.id), outSum="290.00";
    orderId=invId;
    const receipt=JSON.stringify({items:[{
      name:"Доступ к сервису разбора документов — 10 разборов",
      quantity:1,
      sum:290,
      payment_method:"full_payment",
      payment_object:"service",
      tax:"none",
    }]});
    const encodedReceipt=encodeURIComponent(receipt);
    const signature=await paymentSignature(login,outSum,invId,password,encodedReceipt);
    const paymentUrl=new URL("https://auth.robokassa.ru/Merchant/Index.aspx");
    paymentUrl.searchParams.set("MerchantLogin",login); paymentUrl.searchParams.set("OutSum",outSum);
    paymentUrl.searchParams.set("InvId",invId); paymentUrl.searchParams.set("Description","Доступ к сервису разбора документов — 10 разборов");
    paymentUrl.searchParams.set("Email",email); paymentUrl.searchParams.set("Receipt",encodedReceipt); paymentUrl.searchParams.set("SignatureValue",signature);
    if(isTest) paymentUrl.searchParams.set("IsTest","1");
    logPayment("payment_link_created",{order_id:invId,mode:isTest?"test":"production",duration_ms:Date.now()-started});
    return json(request,{payment_url:paymentUrl.toString(),order_id:invId});
  } catch(error) {
    logPayment("payment_link_failed",{
      order_id:orderId,
      error_code:error instanceof HttpError?error.code:"UNEXPECTED",
      duration_ms:Date.now()-started,
    });
    return safeError(request,error);
  }
});
