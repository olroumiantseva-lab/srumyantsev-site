import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import JSZip from "jszip";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
};

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

function makePdf(text = "") {
  const escaped = text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
  const stream = text ? `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET` : "q 0 0 120 80 re f Q";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, "binary"));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, "binary");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, "binary");
}

async function makeDocx(text) {
  const zip = new JSZip();
  zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.folder("_rels").file(".rels", `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.folder("word").file("document.xml", `<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

const txt = (value) => Buffer.from(value, "utf8");
const files = {
  txt: { name: "notice.txt", mimeType: "text/plain", buffer: txt("Ответ нужен до 25 августа. <script>не код</script>") },
  docx: { name: "contract.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: await makeDocx("Срок договора — один год.") },
  pdf: { name: "letter.pdf", mimeType: "application/pdf", buffer: makePdf("Text layer deadline 25 August") },
};

await new Promise((resolve) => server.listen(4176, "127.0.0.1", resolve));
const browser = await chromium.launch({ headless: true, args: ["--disable-gpu"] });
const externalRequests = [];
const browserErrors = [];

async function openApp(viewport) {
  const page = await browser.newPage({ viewport });
  page.on("request", (request) => {
    if (new URL(request.url()).hostname !== "127.0.0.1") externalRequests.push(request.url());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  await page.goto("http://127.0.0.1:4176/tools/document/app/", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.__DOCUMENT_FILE_READY__ === true);
  return page;
}

async function select(page, file) {
  await page.locator("#document-file").setInputFiles(file);
}

async function expectError(page, expected) {
  await page.locator("#file-error").filter({ hasText: expected }).waitFor({ state: "visible" });
  if (!await page.locator("#file-summary").isHidden()) throw new Error(`File summary visible after error: ${expected}`);
}

try {
  const mobile = await openApp({ width: 390, height: 844 });
  const dataTransfer = await mobile.evaluateHandle(({ bytes, name, mimeType }) => {
    const transfer = new DataTransfer();
    transfer.items.add(new File([new Uint8Array(bytes)], name, { type: mimeType }));
    return transfer;
  }, { bytes: [...files.txt.buffer], name: files.txt.name, mimeType: files.txt.mimeType });
  await mobile.locator("#file-drop").dispatchEvent("drop", { dataTransfer });
  await mobile.locator("#file-summary").waitFor({ state: "visible" });
  if (await mobile.locator("#file-name").textContent() !== files.txt.name) throw new Error("TXT filename missing");
  if (await mobile.locator("#file-type").textContent() !== "TXT") throw new Error("TXT type missing");
  if (!await mobile.locator("#source-text").inputValue().then((value) => value.includes("25 августа"))) throw new Error("TXT text not extracted");
  if (await mobile.locator("#file-preview script").count()) throw new Error("Preview interpreted document text as HTML");
  const mobileOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (mobileOverflow) throw new Error("File UI overflows on mobile");
  await mobile.close();

  const desktop = await openApp({ width: 1440, height: 1000 });
  await select(desktop, files.docx);
  await desktop.locator("#file-summary").waitFor({ state: "visible" });
  if (!await desktop.locator("#source-text").inputValue().then((value) => value.includes("один год"))) throw new Error("DOCX text not extracted");
  await select(desktop, files.pdf);
  await desktop.locator("#file-type").filter({ hasText: "PDF" }).waitFor({ state: "visible" });
  if (!await desktop.locator("#source-text").inputValue().then((value) => value.includes("Text layer deadline"))) throw new Error("PDF text layer not extracted");
  const desktopOverflow = await desktop.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (desktopOverflow) throw new Error("File UI overflows on desktop");
  await desktop.getByRole("button", { name: "Разобрать документ" }).click();
  await desktop.waitForURL("**/tools/document/result/");
  await desktop.close();

  const cases = [
    [{ name: "empty.txt", mimeType: "text/plain", buffer: Buffer.alloc(0) }, "Файл пуст"],
    [{ name: "scan.pdf", mimeType: "application/pdf", buffer: makePdf() }, "не найден текстовый слой"],
    [{ name: "broken.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("PK\x03\x04broken", "binary") }, "Не удалось прочитать DOCX"],
    [{ name: "renamed.txt", mimeType: "text/plain", buffer: makePdf("wrong extension") }, "не соответствует"],
    [{ name: "wrong-mime.txt", mimeType: "application/pdf", buffer: txt("plain text") }, "Тип файла не соответствует"],
    [{ name: "legacy.doc", mimeType: "application/msword", buffer: Buffer.from("legacy") }, "Старый формат DOC"],
    [{ name: "large.txt", mimeType: "text/plain", buffer: Buffer.alloc(8 * 1024 * 1024 + 1, 65) }, "больше 8 МБ"],
    [{ name: "long.txt", mimeType: "text/plain", buffer: txt("а".repeat(30001)) }, "больше лимита 30 000"],
  ];
  for (const [file, message] of cases) {
    const page = await openApp({ width: 900, height: 800 });
    await select(page, file);
    await expectError(page, message);
    await page.close();
  }

  if (externalRequests.length) throw new Error(`External requests during extraction: ${externalRequests.length}`);
  if (browserErrors.length) throw new Error(`Browser errors: ${browserErrors.join("; ")}`);
  console.log("PASS: TXT drag-drop, DOCX, text PDF, empty/scan/corrupt/mismatch/size/text limits, no external requests, mobile/desktop");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
