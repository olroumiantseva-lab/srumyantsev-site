import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const registry = JSON.parse(fs.readFileSync(path.join(root, "guides", "guides-registry.json"), "utf8"));
const expectedCategories = new Set(["Начать с ИИ", "Для жизни", "Документы и информация", "Работа и деньги", "Учёба и семья", "Проверка и безопасность", "Система работы"]);
const expectedCounts = { "0-route": 6, "0-practical": 6, "1-route": 7, "1-practical": 8, "2-route": 6, "2-practical": 3 };

assert.equal(registry.length, 36, "Registry must contain 36 guides");
assert.equal(new Set(registry.map((guide) => guide.url)).size, 36, "Guide URLs must be unique");

for (const guide of registry) {
  assert.ok([0, 1, 2].includes(guide.LEVEL), `Invalid level: ${guide.url}`);
  assert.ok(["route", "practical"].includes(guide.TYPE), `Invalid type: ${guide.url}`);
  assert.ok(expectedCategories.has(guide.CATEGORY), `Invalid category: ${guide.url}`);
  assert.ok(fs.existsSync(path.join(root, guide.url.slice(1), "index.html")), `Missing page: ${guide.url}`);
  if (guide.TYPE === "route") assert.ok(Number.isInteger(guide.ROUTE_POSITION), `Missing route position: ${guide.url}`);
  if (guide.TYPE === "practical") assert.equal(guide.ROUTE_POSITION, undefined, `Practical guide has route position: ${guide.url}`);
}

for (const [key, expected] of Object.entries(expectedCounts)) {
  const [level, type] = key.split("-");
  const matches = registry.filter((guide) => guide.LEVEL === Number(level) && guide.TYPE === type);
  assert.equal(matches.length, expected, `Wrong count for ${key}`);
  if (type === "route") assert.deepEqual(matches.map((guide) => guide.ROUTE_POSITION).sort((a, b) => a - b), Array.from({ length: expected }, (_, index) => index + 1), `Route positions are not continuous for level ${level}`);
}

const chats = registry.find((guide) => guide.url === "/kak-ne-poteryat-perepiski-s-ii/");
assert.deepEqual([chats.LEVEL, chats.TYPE, chats.ROUTE_POSITION], [1, "route", 7], "Chat history guide classification is wrong");

const catalog = fs.readFileSync(path.join(root, "guides", "index.html"), "utf8");
const catalogCards = [...catalog.matchAll(/<article class="guide-card" data-guide-card[\s\S]*?<\/article>/g)];
assert.equal(catalogCards.length, 36, "Catalog HTML must contain 36 cards without JavaScript");
assert.ok(catalogCards.every((match) => !/\shidden(?:[=\s>])/.test(match[0])), "A catalog card is hidden in source HTML");
const catalogUrls = catalogCards.map((match) => match[0].match(/<h3><a href="([^"]+)"/)?.[1]);
assert.equal(new Set(catalogUrls).size, 36, "Catalog HTML URLs must be unique");
assert.deepEqual(new Set(catalogUrls), new Set(registry.map((guide) => guide.url)), "Catalog and registry URLs differ");

function gitHead(file) {
  try {
    return execFileSync("git", ["show", `HEAD:${file.replaceAll("\\", "/")}`], { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

for (const guide of registry) {
  const relative = path.join(guide.url.slice(1), "index.html");
  const current = fs.readFileSync(path.join(root, relative), "utf8");
  const before = gitHead(relative);
  const canonical = (text) => text?.match(/<link rel="canonical" href="([^"]+)"\s*\/?\s*>/)?.[1];
  assert.equal(canonical(current), `https://srumyantsev.ru${guide.url}`, `Wrong canonical: ${guide.url}`);
  if (before) assert.equal(canonical(current), canonical(before), `Canonical changed: ${guide.url}`);
  assert.ok(current.includes("guide-followup"), `Missing follow-up block: ${guide.url}`);
  for (const script of current.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(script[1]);
}

const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const guide of registry) assert.ok(sitemap.includes(`https://srumyantsev.ru${guide.url}`), `Missing sitemap URL: ${guide.url}`);

const documents = [path.join(root, "guides", "index.html"), ...registry.map((guide) => path.join(root, guide.url.slice(1), "index.html"))];
for (const documentPath of documents) {
  const html = fs.readFileSync(documentPath, "utf8");
  for (const match of html.matchAll(/href="(\/[^"]*)"/g)) {
    const href = match[1].split("#")[0].split("?")[0];
    if (!href) continue;
    const target = href.endsWith("/") ? path.join(root, href, "index.html") : path.join(root, href);
    const fallback = path.join(root, href, "index.html");
    assert.ok(fs.existsSync(target) || fs.existsSync(fallback), `Broken internal link ${match[1]} in ${path.relative(root, documentPath)}`);
  }
}

console.log("PASS: 36 guides, routes 6/7/6, practical 6/8/3, canonicals and links intact");
