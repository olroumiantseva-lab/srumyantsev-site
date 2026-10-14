import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { inspectCatalog } from "./guide-catalog-contract.mjs";

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.resolve(process.env.GUIDE_TEST_ARTIFACTS || path.join(root, "artifacts"));
const registry = JSON.parse(fs.readFileSync(path.join(root, "guides", "guides-registry.json"), "utf8"));
const catalog = fs.readFileSync(path.join(root, "guides", "index.html"), "utf8");
const { cards } = inspectCatalog(registry, catalog, (url) => fs.existsSync(path.join(root, url.slice(1), "index.html")) && fs.statSync(path.join(root, url.slice(1), "index.html")).isFile());
const expectedGuideCount = cards.length;
const expectedLifeGuides = cards.filter((guide) => guide.category === "Для жизни").length;
const practicumUrls = [
  "/neyroseti-posle-45-pervyy-rezultat/",
  "/razbor-neponyatnogo-dokumenta/",
  "/telefon-vmesto-klaviatury/",
];
fs.mkdirSync(artifacts, { recursive: true });

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".webp": "image/webp" };
const server = http.createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  let file = path.join(root, pathname);
  if (pathname.endsWith("/")) file = path.join(file, "index.html");
  if (!path.extname(file) && fs.existsSync(path.join(file, "index.html"))) file = path.join(file, "index.html");
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    response.writeHead(404).end("Not found");
    return;
  }
  response.writeHead(200, { "content-type": types[path.extname(file)] ?? "application/octet-stream" });
  fs.createReadStream(file).pipe(response);
});

await new Promise((resolve) => server.listen(4173, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true });
// Project browser checks are local-only: do not emit production analytics/backend requests.
const localOnly = route => new URL(route.request().url()).origin === "http://127.0.0.1:4173"
  ? route.continue()
  : route.fulfill({ status: 200, contentType: "application/javascript", body: "window.ym=function(){};" });
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await desktop.route("**/*", localOnly);
  const errors = [];
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto("http://127.0.0.1:4173/guides/", { waitUntil: "networkidle" });
  if (await desktop.locator("[data-guide-card]").count() !== expectedGuideCount) throw new Error(`Desktop does not contain ${expectedGuideCount} cards`);
  const levelZeroColor = await desktop.locator(".level-picker article").first().evaluate((card) => getComputedStyle(card).backgroundColor);
  if (levelZeroColor !== "rgb(245, 189, 76)") throw new Error(`Level 0 card is not yellow: ${levelZeroColor}`);
  await desktop.getByRole("button", { name: "Для жизни", exact: true }).click();
  const lifeVisible = await desktop.locator("[data-guide-card]:visible").count();
  if (lifeVisible !== expectedLifeGuides) throw new Error(`Expected ${expectedLifeGuides} life guides, found ${lifeVisible}`);
  await desktop.getByRole("button", { name: "Все", exact: true }).click();
  if (await desktop.locator("[data-guide-card]:visible").count() !== expectedGuideCount) throw new Error(`All filter did not restore ${expectedGuideCount} cards`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join("; ")}`);
  for (const url of practicumUrls) {
    if (await desktop.locator(`a[href="${url}"]`).count() === 0) throw new Error(`Desktop is missing practicum link ${url}`);
  }
  await desktop.screenshot({ path: path.join(artifacts, "guides-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.route("**/*", localOnly);
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto("http://127.0.0.1:4173/guides/", { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error("Mobile page has horizontal document overflow");
  await mobile.screenshot({ path: path.join(artifacts, "guides-mobile.png"), fullPage: true });

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  await noJs.route("**/*", localOnly);
  const noJsPage = await noJs.newPage();
  await noJsPage.goto("http://127.0.0.1:4173/guides/", { waitUntil: "load" });
  if (await noJsPage.locator("[data-guide-card]:visible").count() !== expectedGuideCount) throw new Error(`All ${expectedGuideCount} cards are not available without JavaScript`);
  for (const url of practicumUrls) {
    if (await noJsPage.locator(`a[href="${url}"]:visible`).count() === 0) throw new Error(`No-JS catalog is missing practicum link ${url}`);
  }
  await noJs.close();
  console.log(`PASS: filters, no JS, desktop/mobile; screenshots in ${artifacts}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
