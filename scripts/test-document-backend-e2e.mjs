import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";
import { createClient } from "../supabase/functions/node_modules/@supabase/supabase-js/dist/index.mjs";

const root = path.resolve(import.meta.dirname, "..");
const url = process.env.SUPABASE_URL;
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !publishableKey || !secretKey) {
  throw new Error("Set SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY for a disposable test project");
}

const admin = createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const emails = { a: `document-a-${stamp}@example.com`, b: `document-b-${stamp}@example.com`, c: `document-c-${stamp}@example.com` };
const createdUsers = [];
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  if (pathname === "/tools/assets/runtime-config.js") {
    response.writeHead(200, { "content-type": types[".js"], "cache-control": "no-store" });
    response.end(`window.__SUPABASE_CONFIG__=${JSON.stringify({ url, publishableKey })};`);
    return;
  }
  let file = path.join(root, pathname);
  if (pathname.endsWith("/")) file = path.join(file, "index.html");
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { response.writeHead(404).end("Not found"); return; }
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true });
  if (error) throw error;
  createdUsers.push(data.user.id);
  return data.user;
}

async function magicLink(email) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email, options: { redirectTo: "http://127.0.0.1:4175/tools/document/app/" } });
  if (error) throw error;
  return data.properties.action_link;
}

async function browserSession(page) {
  const values = await page.evaluate(() => Object.values(localStorage));
  for (const value of values) {
    try {
      const parsed = JSON.parse(value);
      if (parsed?.access_token && parsed?.refresh_token) return parsed;
    } catch { /* not an auth entry */ }
  }
  throw new Error("Supabase browser session not found");
}

async function userClient(session) {
  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
  if (error) throw error;
  return client;
}

await new Promise((resolve) => server.listen(4175, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
try {
  const userA = await createUser(emails.a); const userB = await createUser(emails.b); const userC = await createUser(emails.c);

  const initialCredit = await admin.from("credit_transactions").select("amount,type,reference_id").eq("user_id", userC.id).eq("type", "signup_grant");
  if (initialCredit.error || initialCredit.data.length !== 1 || initialCredit.data[0].amount !== 1) throw new Error("New user did not receive exactly one signup credit");
  const { error: repeatAuthError } = await admin.auth.admin.updateUserById(userC.id, { email: emails.c });
  if (repeatAuthError) throw repeatAuthError;
  const repeatedCredit = await admin.from("credit_transactions").select("amount").eq("user_id", userC.id).eq("type", "signup_grant");
  if (repeatedCredit.error || repeatedCredit.data.length !== 1 || repeatedCredit.data[0].amount !== 1) throw new Error("Repeated registration changed signup credit");

  const pageA = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await pageA.goto(await magicLink(emails.a), { waitUntil: "domcontentloaded" });
  await pageA.waitForURL("**/tools/document/app/**");
  await pageA.getByText("Осталось разборов: 1").waitFor({ state: "visible" });
  await pageA.getByLabel("3. Вставьте текст документа").fill(`E2E-CANARY-${stamp}: просим ответить до пятницы.`);
  await pageA.getByRole("button", { name: "Разобрать документ" }).click();
  await pageA.waitForURL("**/tools/document/result/**");
  const sessionId = new URL(pageA.url()).searchParams.get("id");
  if (!sessionId) throw new Error("Analysis session ID missing");
  await pageA.getByText("Осталось разборов: 0").waitFor({ state: "visible" });
  for (const [index, question] of ["Первый вопрос", "Второй вопрос", "Третий вопрос"].entries()) {
    await pageA.getByLabel("Ваш вопрос").fill(question);
    await pageA.getByRole("button", { name: "Спросить" }).click();
    await pageA.getByText(`Осталось уточнений: ${2 - index} из 3.`, { exact: false }).waitFor({ state: "visible" });
  }
  if (!await pageA.getByLabel("Ваш вопрос").isDisabled()) throw new Error("Fourth follow-up is not blocked");
  const sessionA = await browserSession(pageA);
  const clientA = await userClient(sessionA);

  await pageA.goto("http://127.0.0.1:4175/tools/document/history/");
  await pageA.getByRole("link", { name: "Открыть" }).first().waitFor({ state: "visible" });
  await pageA.getByRole("link", { name: "Выйти" }).click();
  await pageA.waitForURL("**/tools/login/");
  await pageA.goto(await magicLink(emails.a), { waitUntil: "domcontentloaded" });
  await pageA.waitForURL("**/tools/document/app/**");
  await pageA.getByText("Осталось разборов: 0").waitFor({ state: "visible" });
  await pageA.goto("http://127.0.0.1:4175/tools/document/history/");
  await pageA.getByRole("link", { name: "Открыть" }).first().waitFor({ state: "visible" });

  const pageB = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await pageB.goto(await magicLink(emails.b), { waitUntil: "domcontentloaded" });
  await pageB.waitForURL("**/tools/document/app/**");
  await pageB.getByText("Осталось разборов: 1").waitFor({ state: "visible" });
  const sessionB = await browserSession(pageB); const clientB = await userClient(sessionB);
  const { data: foreignRows } = await clientB.from("document_sessions").select("id").eq("id", sessionId);
  if (foreignRows?.length) throw new Error("RLS leak: user B can read user A session");
  await pageB.goto(`http://127.0.0.1:4175/tools/document/result/?id=${sessionId}`);
  await pageB.getByText("Разбор не найден или был удалён.").waitFor({ state: "visible" });

  const balanceBeforeError = await clientA.rpc("get_my_credit_balance");
  const failed = await clientA.functions.invoke("mock-analyze", { headers: { "x-dev-force-error": "true" }, body: {
    request_id: crypto.randomUUID(), document_type: "letter", goals: ["plain"], source_text: "server error canary", user_context: "",
  }});
  if (!failed.error) throw new Error("Forced server error unexpectedly succeeded");
  const balanceAfterError = await clientA.rpc("get_my_credit_balance");
  if (balanceBeforeError.data !== balanceAfterError.data) throw new Error("Credit changed after server error");

  const { data: cLink } = await admin.auth.admin.generateLink({ type: "magiclink", email: emails.c });
  const clientC = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { error: verifyError } = await clientC.auth.verifyOtp({ token_hash: cLink.properties.hashed_token, type: "magiclink" });
  if (verifyError) throw verifyError;
  const firstAttempt = await clientC.functions.invoke("mock-analyze", { body: {
    request_id: crypto.randomUUID(), document_type: "letter", goals: ["plain"], source_text: "consume signup credit", user_context: "",
  }});
  if (firstAttempt.error || !firstAttempt.data?.session_id) throw new Error("Signup credit could not be used");
  const zeroAttempt = await clientC.functions.invoke("mock-analyze", { body: {
    request_id: crypto.randomUUID(), document_type: "letter", goals: ["plain"], source_text: "zero balance", user_context: "",
  }});
  if (!zeroAttempt.error) throw new Error("Zero-balance analysis unexpectedly succeeded");
  const { data: cSessions } = await admin.from("document_sessions").select("id").eq("user_id", userC.id);
  if (cSessions.length !== 1) throw new Error("Zero-balance attempt created an extra session");

  await pageA.goto("http://127.0.0.1:4175/tools/document/history/");
  pageA.once("dialog", (dialog) => dialog.accept());
  const currentCard = pageA.locator(".history-card").filter({ has: pageA.locator(`a[href*="${sessionId}"]`) });
  await currentCard.getByRole("button", { name: "Удалить" }).click();
  await currentCard.waitFor({ state: "detached" });
  const { data: tombstone } = await admin.from("document_sessions").select("source_text,user_context,result_json,deleted_at").eq("id", sessionId).single();
  if (!tombstone.deleted_at || tombstone.source_text || tombstone.user_context || tombstone.result_json) throw new Error("Delete did not redact document content");
  const { count: messages } = await admin.from("followup_messages").select("id", { count: "exact", head: true }).eq("document_session_id", sessionId);
  if (messages !== 0) throw new Error("Delete did not remove follow-up content");

  const expiredPage = await browser.newPage();
  await expiredPage.goto("http://127.0.0.1:4175/tools/login/#error=access_denied&error_description=expired");
  await expiredPage.getByText("Ссылка устарела или уже использована.", { exact: false }).waitFor({ state: "visible" });
  console.log("PASS: magic link, one idempotent signup credit, analysis/debit, 3 follow-ups, persistence, delete, A/B RLS, server error and zero balance");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  const cleanupErrors = [];
  for (const id of createdUsers) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) cleanupErrors.push(error.message);
  }
  if (cleanupErrors.length) throw new Error(`E2E user cleanup failed (${cleanupErrors.length})`);
}
