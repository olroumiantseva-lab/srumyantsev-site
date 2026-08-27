import { createClient } from "npm:@supabase/supabase-js@2";
import { constantTimeEqual, normalizeOutSum, resultSignature } from "../_shared/robokassa.ts";

function text(body:string,status=200){return new Response(body,{status,headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-store"}});}

Deno.serve(async (request) => {
  if(request.method!=="POST"&&request.method!=="GET") return text("METHOD_NOT_ALLOWED",405);
  try {
    const params=request.method==="POST"?new URLSearchParams(await request.text()):new URL(request.url).searchParams;
    const outSum=normalizeOutSum(params.get("OutSum")??"");
    const invId=params.get("InvId")??"", signature=params.get("SignatureValue")??"", isTest=params.get("IsTest")==="1";
    if(!outSum||!/^\d+$/.test(invId)||!/^[0-9a-f]{64}$/i.test(signature)) return text("bad request",400);
    const password=Deno.env.get(isTest?"ROBOKASSA_TEST_PASSWORD_2":"ROBOKASSA_PASSWORD_2")??"";
    if(!password) return text("server config",500);
    const expected=await resultSignature(outSum,invId,password);
    if(!constantTimeEqual(signature,expected)) return text("bad signature",403);
    const url=Deno.env.get("SUPABASE_URL")??"", secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
    if(!url||!secret) return text("server config",500);
    const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:order,error:orderError}=await admin.from("payment_orders").select("id,email,amount_kopecks,status,user_id").eq("id",invId).single();
    if(orderError||!order||order.amount_kopecks!==29000||outSum!=="290.00") return text("order mismatch",409);
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
    return text(`OK${invId}`);
  } catch(error) { console.error("robokassa_result",error instanceof Error?error.message:"unknown"); return text("temporary error",500); }
});
