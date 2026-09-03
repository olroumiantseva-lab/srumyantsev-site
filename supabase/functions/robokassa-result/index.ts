import { createClient } from "npm:@supabase/supabase-js@2";
import { constantTimeEqual, normalizeOutSum, resultSignature } from "../_shared/robokassa.ts";
import { getSupabaseAdminKey } from "../_shared/supabase-admin-key.ts";

function text(body:string,status=200){return new Response(body,{status,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});}
function logPayment(event:string, fields:Record<string,unknown>={}){
  console.log(JSON.stringify({service:"document_payment",event,...fields}));
}

Deno.serve(async (request) => {
  if(request.method!=="POST"&&request.method!=="GET") return text("METHOD_NOT_ALLOWED",405);
  const started=Date.now();
  let logInvId="invalid";
  try {
    const params=request.method==="POST"?new URLSearchParams(await request.text()):new URL(request.url).searchParams;
    const rawOutSum=params.get("OutSum")??"";
    const outSum=normalizeOutSum(rawOutSum);
    const invId=params.get("InvId")??"", signature=params.get("SignatureValue")??"", isTest=params.get("IsTest")==="1";
    logInvId=/^\d+$/.test(invId)?invId:"invalid";
    if(!outSum||!/^\d+$/.test(invId)||!/^[0-9a-f]{64}$/i.test(signature)){
      logPayment("callback_rejected",{order_id:logInvId,reason:"bad_request",duration_ms:Date.now()-started});
      return text("bad request",400);
    }
    const password=Deno.env.get(isTest?"ROBOKASSA_TEST_PASSWORD_2":"ROBOKASSA_PASSWORD_2")??"";
    if(!password){
      logPayment("callback_failed",{order_id:logInvId,reason:"server_config",duration_ms:Date.now()-started});
      return text("server config",500);
    }
    const expected=await resultSignature(rawOutSum,invId,password);
    if(!constantTimeEqual(signature,expected)){
      logPayment("callback_rejected",{order_id:logInvId,reason:"bad_signature",duration_ms:Date.now()-started});
      return text("bad signature",403);
    }
    const url=Deno.env.get("SUPABASE_URL")??"", secret=getSupabaseAdminKey();
    if(!url||!secret){
      logPayment("callback_failed",{order_id:logInvId,reason:"server_config",duration_ms:Date.now()-started});
      return text("server config",500);
    }
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:order,error:orderError}=await admin.from("payment_orders").select("id,email,amount_kopecks,status,user_id").eq("id",invId).single();
    if(orderError||!order||order.amount_kopecks!==29000||outSum!=="290.00"){
      logPayment("callback_rejected",{order_id:logInvId,reason:"order_mismatch",duration_ms:Date.now()-started});
      return text("order mismatch",409);
    }
    let userId=order.user_id as string|null;
    if(!userId){
      const {data:created,error:createError}=await admin.auth.admin.createUser({email:order.email,email_confirm:true});
      if(createError){
        const {data:profile,error:profileError}=await admin.from("profiles").select("id").ilike("email",order.email).maybeSingle();
        if(profileError) throw profileError;
        userId=profile?.id??null;
        if(!userId) throw createError;
      } else userId=created.user.id;
    }
    const {error:rpcError}=await admin.rpc("complete_robokassa_payment",{p_order_id:Number(invId),p_user_id:userId});
    if(rpcError) throw rpcError;
    logPayment("callback_completed",{order_id:logInvId,mode:isTest?"test":"production",duration_ms:Date.now()-started});
    return text(`OK${invId}`);
  } catch(error) {
    console.error(JSON.stringify({
      service:"document_payment",
      event:"callback_failed",
      order_id:logInvId,
      error_type:error instanceof Error?error.name:"unknown",
      duration_ms:Date.now()-started,
    }));
    return text("temporary error",500);
  }
});
