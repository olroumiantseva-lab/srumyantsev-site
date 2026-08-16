import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const artifacts = path.join(root, "artifacts");
const registry = JSON.parse(fs.readFileSync(path.join(root, "guides", "guides-registry.json"), "utf8"));
const expectedLifeGuides = registry.filter((guide) => guide.CATEGORY === "Для жизни").length;
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
try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const errors = [];
  desktop.on("pageerror", (error) => errors.push(error.message));
  await desktop.goto("http://127.0.0.1:4173/guides/", { waitUntil: "networkidle" });
  if (await desktop.locator("[data-guide-card]").count() !== 33) throw new Error("Desktop does not contain 33 cards");
  await desktop.getByRole("button", { name: "Для жизни", exact: true }).click();
  const lifeVisible = await desktop.locator("[data-guide-card]:visible").count();
  if (lifeVisible !== expectedLifeGuides) throw new Error(`Expected ${expectedLifeGuides} life guides, found ${lifeVisible}`);
  await desktop.getByRole("button", { name: "Все", exact: true }).click();
  if (await desktop.locator("[data-guide-card]:visible").count() !== 33) throw new Error("All filter did not restore 33 cards");
  if (errors.length) throw new Error(`Browser errors: ${errors.join("; ")}`);
  await desktop.screenshot({ path: path.join(artifacts, "guides-desktop.png"), fullPage: true });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on("pageerror", (error) => errors.push(error.message));
  await mobile.goto("http://127.0.0.1:4173/guides/", { waitUntil: "networkidle" });
  const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error("Mobile page has horizontal document overflow");
  await mobile.screenshot({ path: path.join(artifacts, "guides-mobile.png"), fullPage: true });

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto("http://127.0.0.1:4173/guides/", { waitUntil: "load" });
  if (await noJsPage.locator("[data-guide-card]:visible").count() !== 33) throw new Error("Cards are not all available without JavaScript");
  await noJs.close();
  console.log(`PASS: filters, no JS, desktop/mobile; screenshots in ${artifacts}`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
