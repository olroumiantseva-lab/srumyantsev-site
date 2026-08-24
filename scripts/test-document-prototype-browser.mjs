import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts", "document-prototype");
fs.mkdirSync(artifacts, { recursive: true });

const routes = [
  "/tools/document/",
  "/tools/login/",
  "/tools/document/app/",
  "/tools/document/result/",
  "/tools/document/history/",
];
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  let file = path.join(root, pathname);
  if (pathname.endsWith("/")) file = path.join(file, "index.html");
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(4174, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
const errors = [];

async function inspectRoute(page, route, label) {
  const response = await page.goto(`http://127.0.0.1:4174${route}`, { waitUntil: "networkidle" });
  if (response.status() !== 200) throw new Error(`${route}: HTTP ${response.status()}`);
  if (await page.locator("h1").count() !== 1) throw new Error(`${route}: expected exactly one h1`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error(`${route}: horizontal overflow at ${label}`);
  const smallControls = await page.locator("button, .button, input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea").evaluateAll((nodes) =>
    nodes.filter((node) => {
      const rect = node.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.height < 48;
    }).map((node) => `${node.tagName}:${node.textContent?.trim() || node.getAttribute("name") || node.id}:${node.getBoundingClientRect().height}`)
  );
  if (smallControls.length) throw new Error(`${route}: controls below 48px at ${label}: ${smallControls.join(", ")}`);
}

try {
  for (const viewport of [{ width: 390, height: 844, label: "mobile" }, { width: 1440, height: 1000, label: "desktop" }]) {
    const page = await browser.newPage({ viewport });
    page.on("pageerror", (error) => errors.push(`${viewport.label}: ${error.message}`));
    page.on("console", (message) => { if (message.type() === "error") errors.push(`${viewport.label}: ${message.text()}`); });
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.hostname !== "127.0.0.1") errors.push(`External request: ${request.url()}`);
    });
    for (const route of routes) await inspectRoute(page, route, viewport.label);
    await page.goto("http://127.0.0.1:4174/tools/document/", { waitUntil: "networkidle" });
    await page.screenshot({ path: path.join(artifacts, `landing-${viewport.label}.png`), fullPage: true });
    await page.close();
  }

  const flow = await browser.newPage({ viewport: { width: 390, height: 844 } });
  flow.on("pageerror", (error) => errors.push(`flow: ${error.message}`));
  await flow.goto("http://127.0.0.1:4174/tools/document/");
  await flow.getByRole("link", { name: "Разобрать документ — 290 ₽" }).click();
  if (!flow.url().endsWith("/tools/login/")) throw new Error("Landing CTA did not open login");
  await flow.getByRole("button", { name: "Получить ссылку для входа" }).click();
  if (!await flow.getByText("Проверьте адрес электронной почты.").isVisible()) throw new Error("Login empty-email validation missing");
  await flow.getByLabel("Введите email").fill("test@example.ru");
  await flow.getByRole("button", { name: "Получить ссылку для входа" }).click();
  await flow.getByRole("link", { name: "Продолжить в прототипе" }).click();
  if (!flow.url().endsWith("/tools/document/app/")) throw new Error("Login did not open app");
  if (await flow.locator('input[name="goal"]:checked').count() !== 4) throw new Error("Expected four default goals");
  const defaultGoals = await flow.locator('input[name="goal"]:checked').evaluateAll((nodes) => nodes.map((node) => node.parentElement.textContent.trim()));
  const expectedGoals = ["Объяснить простыми словами", "Что от меня хотят", "Что мне нужно сделать", "На что обратить внимание"];
  if (JSON.stringify(defaultGoals) !== JSON.stringify(expectedGoals)) throw new Error(`Wrong default goals: ${defaultGoals.join(", ")}`);
  if (await flow.getByText("Что делать дальше", { exact: true }).count()) throw new Error("App still contains duplicate 'Что делать дальше' goal");
  await flow.getByRole("button", { name: "Разобрать документ" }).click();
  if (!await flow.getByText("Вставьте текст документа.").isVisible()) throw new Error("Empty document validation missing");
  await flow.locator("#source-text").fill("Просим предоставить ответ не позднее 25 августа. При отсутствии ответа обращение будет рассмотрено по имеющимся материалам.");
  await flow.getByRole("button", { name: "Разобрать документ" }).click();
  await flow.waitForURL("**/tools/document/result/");
  for (const heading of ["Коротко", "Что от вас хотят", "Сроки", "Что делать дальше", "Возможные риски"]) {
    if (!await flow.getByRole("heading", { name: heading, exact: true }).isVisible()) throw new Error(`Open result block missing: ${heading}`);
  }
  const uncertainty = flow.locator("details", { hasText: "Что нельзя определить из документа" });
  if (await uncertainty.count() !== 1 || await uncertainty.getAttribute("open") !== null) throw new Error("Uncertainty must exist as a collapsed secondary block");
  if (await flow.locator(".result-risk").evaluate((node) => node.tagName) !== "SECTION") throw new Error("Significant risks must be open");
  for (const question of ["Как отправить ответ?", "Нужно ли платить?", "Можно продлить срок?"]) {
    await flow.getByLabel("Ваш вопрос").fill(question);
    await flow.getByRole("button", { name: "Спросить" }).click();
  }
  if (!await flow.getByText("Для этого документа использованы все 3 уточнения.", { exact: false }).isVisible()) throw new Error("Follow-up limit state missing");
  if (!await flow.getByLabel("Ваш вопрос").isDisabled()) throw new Error("Follow-up input is not disabled after three questions");
  await flow.screenshot({ path: path.join(artifacts, "result-mobile.png"), fullPage: true });
  await flow.getByRole("link", { name: "Открыть историю" }).click();
  await flow.waitForURL("**/tools/document/history/");
  if (await flow.locator(".history-card p").count()) throw new Error("History cards contain result/document fragments");
  if (await flow.locator(".history-card .status").count()) throw new Error("History cards contain status beyond approved metadata");
  flow.once("dialog", (dialog) => dialog.accept());
  await flow.locator("[data-delete]").first().click();
  if (await flow.locator(".history-card").count() !== 2) throw new Error("History delete did not remove a card");
  await flow.screenshot({ path: path.join(artifacts, "history-after-delete-mobile.png"), fullPage: true });
  await flow.close();

  if (errors.length) throw new Error(errors.join("; "));
  console.log("PASS: 5 routes × mobile/desktop, no overflow/external requests/console errors; mock flow, validation, 3 follow-ups and delete verified");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
