import * as pdfjsLib from "/tools/vendor/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "/tools/vendor/pdf.worker.min.mjs";

const MAX_FILE = 8 * 1024 * 1024;
const MAX_DOC = 4 * 1024 * 1024;
const MAX_TEXT = 30000;
const MAX_IMAGES = 10;
const MAX_IMAGE_PAYLOAD = 12_000_000;
const PREVIEW = 240;
const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
const LABEL = { pdf: "PDF", doc: "DOC", docx: "DOCX", txt: "TXT", images: "Фото/скан" };

class InputError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

const norm = (value) => String(value || "")
  .replace(/\r\n?/g, "\n")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
  .replace(/[ \t]+\n/g, "\n")
  .replace(/\n{4,}/g, "\n\n\n")
  .trim();
const ext = (file) => (file.name.split(".").pop() || "").toLowerCase();
const sig = (bytes) => {
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 1024));
  if (header.includes("%PDF-")) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "docx";
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) return "doc";
  return "unknown";
};
const b64 = (bytes) => {
  let value = "";
  for (let i = 0; i < bytes.length; i += 0x8000) value += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(value);
};

async function remoteExtract(payload) {
  const config = window.__SUPABASE_CONFIG__ || {};
  if (!config.url) throw new InputError("BACKEND", "Сервис чтения документа пока недоступен.");
  const response = await fetch(`${config.url}/functions/v1/document-input-extract`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(config.publishableKey ? { apikey: config.publishableKey } : {}) },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch {}
  if (!response.ok) throw new InputError(data.error || "EXTRACT_FAILED", data.message || "Не удалось прочитать документ.");
  const text = norm(data.text);
  if (!text) throw new InputError("EMPTY_TEXT", "В документе не удалось найти текст.");
  return text;
}

async function openPdf(bytes) {
  const task = pdfjsLib.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let n = 1; n <= pdf.numPages; n += 1) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) if ("str" in item) text += `${item.str}${item.hasEOL ? "\n" : " "}`;
      pages.push(text.trim());
    }
    return { task, pdf, text: norm(pages.filter(Boolean).join("\n\n")) };
  } catch (error) {
    await task.destroy().catch(() => {});
    if (error?.name === "PasswordException") throw new InputError("PROTECTED_PDF", "Защищённые паролем PDF не поддерживаются.");
    throw new InputError("DAMAGED_PDF", "Не удалось прочитать PDF.");
  }
}

async function pdfToImages(pdf) {
  if (pdf.numPages > MAX_IMAGES) throw new InputError("TOO_MANY_PAGES", `В скане ${pdf.numPages} страниц. За один раз можно обработать до ${MAX_IMAGES}.`);
  const images = [];
  for (let n = 1; n <= pdf.numPages; n += 1) {
    const page = await pdf.getPage(n);
    const base = page.getViewport({ scale: 1 });
    const scale = Math.min(2, 1600 / Math.max(base.width, 1));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext("2d", { alpha: false }), viewport }).promise;
    images.push(canvas.toDataURL("image/jpeg", 0.82));
  }
  return images;
}

async function docxText(buffer) {
  if (!window.mammoth?.extractRawText) throw new InputError("LIBRARY", "Не удалось загрузить модуль DOCX.");
  try {
    const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
    const text = norm(result.value);
    if (!text) throw new InputError("EMPTY_DOCX", "В DOCX не найден текст. Если это скан, добавьте страницы как фото или PDF.");
    return text;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError("DAMAGED_DOCX", "Не удалось прочитать DOCX.");
  }
}

function txtText(bytes) {
  try {
    const text = norm(new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, ""));
    if (!text) throw new InputError("EMPTY", "Файл пуст.");
    return text;
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError("TXT_ENCODING", "Не удалось прочитать TXT. Сохраните файл в UTF-8.");
  }
}

async function heicBlob(file) {
  if (typeof window.heic2any !== "function") throw new InputError("HEIC_LIBRARY", "Не удалось открыть HEIC. Обновите страницу или выберите JPG/PNG.");
  const converted = await window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.88 });
  return Array.isArray(converted) ? converted[0] : converted;
}

async function jpegData(file) {
  let blob = file;
  if (["heic", "heif"].includes(ext(file))) blob = await heicBlob(file);
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise((resolve, reject) => {
      const node = new Image();
      node.onload = () => resolve(node);
      node.onerror = reject;
      node.src = url;
    });
    const max = 1800;
    const scale = Math.min(1, max / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally { URL.revokeObjectURL(url); }
}

function init() {
  const input = document.getElementById("document-file");
  if (!input) return;
  const source = document.getElementById("source-text");
  const drop = document.getElementById("file-drop");
  const status = document.getElementById("file-status");
  const error = document.getElementById("file-error");
  const summary = document.getElementById("file-summary");

  const setSource = (text) => { source.value = text; source.dispatchEvent(new Event("input", { bubbles: true })); };
  const clearSummary = () => {
    summary?.classList.add("hidden");
    for (const id of ["file-name", "file-type", "file-text-size", "file-preview"]) document.getElementById(id).textContent = "";
  };
  const show = (name, type, text, detail) => {
    document.getElementById("file-name").textContent = name;
    document.getElementById("file-type").textContent = LABEL[type] || type;
    document.getElementById("file-text-size").textContent = detail;
    const compact = text.replace(/\s+/g, " ");
    document.getElementById("file-preview").textContent = compact.length > PREVIEW ? `${compact.slice(0, PREVIEW)}…` : compact;
    summary?.classList.remove("hidden");
  };
  const finish = (name, type, text, detail) => {
    if (text.length > MAX_TEXT) throw new InputError("TEXT_TOO_LONG", "Текст документа превышает 30 000 символов. Разделите документ на части.");
    setSource(text);
    show(name, type, text, detail);
    error.textContent = "";
  };

  const process = async (list) => {
    const files = [...(list || [])];
    if (!files.length) return;
    status.textContent = "Обрабатываем документ…";
    error.textContent = "";
    drop?.classList.add("is-processing");
    input.disabled = true;
    try {
      if (files.length > MAX_IMAGES) throw new InputError("TOO_MANY_FILES", `Можно добавить до ${MAX_IMAGES} фотографий страниц.`);
      if (files.some((file) => file.size > MAX_FILE)) throw new InputError("FILE_TOO_LARGE", "Один из файлов больше 8 МБ.");
      if (files.length > 1 && !files.every((file) => IMAGE_EXT.has(ext(file)))) throw new InputError("MULTI_ONLY_IMAGES", "Несколько файлов одновременно можно выбрать только для фотографий страниц.");

      if (files.length > 1 || IMAGE_EXT.has(ext(files[0]))) {
        const images = [];
        for (let i = 0; i < files.length; i += 1) {
          status.textContent = `Читаем фото ${i + 1} из ${files.length}…`;
          images.push(await jpegData(files[i]));
        }
        if (images.join("").length > MAX_IMAGE_PAYLOAD) throw new InputError("IMAGES_TOO_LARGE", "Фотографии слишком большие. Уменьшите количество или размер.");
        const text = await remoteExtract({ source_images: images });
        finish(files.length === 1 ? files[0].name : `${files.length} фото страниц`, "images", text, `${files.length} стр.`);
        status.textContent = "Фото прочитаны. Текст готов к анализу.";
        return;
      }

      const file = files[0];
      const extension = ext(file);
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const detected = sig(bytes);

      if (extension === "pdf") {
        if (detected !== "pdf") throw new InputError("DAMAGED_PDF", "Не удалось распознать PDF.");
        const { task, pdf, text } = await openPdf(bytes);
        try {
          if (text) {
            finish(file.name, "pdf", text, `${text.length.toLocaleString("ru-RU")} символов`);
            status.textContent = "Текст PDF извлечён локально.";
          } else {
            status.textContent = "PDF состоит из сканов. Читаем страницы…";
            const images = await pdfToImages(pdf);
            if (images.join("").length > MAX_IMAGE_PAYLOAD) throw new InputError("IMAGES_TOO_LARGE", "Скан PDF слишком большой. Разделите его на части.");
            const recognized = await remoteExtract({ source_images: images });
            finish(file.name, "images", recognized, `${images.length} стр.`);
            status.textContent = "Скан PDF прочитан. Текст готов к анализу.";
          }
        } finally { await task.destroy().catch(() => {}); }
        return;
      }
      if (extension === "docx") {
        if (detected !== "docx") throw new InputError("DAMAGED_DOCX", "Содержимое файла не соответствует DOCX.");
        const text = await docxText(buffer);
        finish(file.name, "docx", text, `${text.length.toLocaleString("ru-RU")} символов`);
        status.textContent = "Текст DOCX извлечён локально.";
        return;
      }
      if (extension === "txt") {
        const text = txtText(bytes);
        finish(file.name, "txt", text, `${text.length.toLocaleString("ru-RU")} символов`);
        status.textContent = "TXT готов к анализу.";
        return;
      }
      if (extension === "doc") {
        if (detected !== "doc") throw new InputError("DAMAGED_DOC", "Содержимое файла не соответствует старому DOC.");
        if (file.size > MAX_DOC) throw new InputError("DOC_TOO_LARGE", "DOC больше 4 МБ. Сохраните большой документ как DOCX.");
        status.textContent = "Читаем старый Word DOC…";
        const text = await remoteExtract({ source_doc: { name: file.name, base64: b64(bytes) } });
        finish(file.name, "doc", text, `${Math.round(file.size / 1024)} КБ`);
        status.textContent = "DOC прочитан. Текст готов к анализу.";
        return;
      }
      throw new InputError("EXTENSION", "Поддерживаются PDF, DOC, DOCX, TXT, JPG, PNG, WEBP, HEIC/HEIF.");
    } catch (reason) {
      setSource("");
      clearSummary();
      error.textContent = reason instanceof InputError ? reason.message : "Не удалось обработать документ.";
      status.textContent = "";
    } finally {
      input.value = "";
      input.disabled = false;
      drop?.classList.remove("is-processing", "is-dragging");
    }
  };

  input.addEventListener("change", () => process(input.files));
  for (const name of ["dragenter", "dragover"]) drop?.addEventListener(name, (event) => { event.preventDefault(); drop.classList.add("is-dragging"); });
  for (const name of ["dragleave", "dragend"]) drop?.addEventListener(name, () => drop.classList.remove("is-dragging"));
  drop?.addEventListener("drop", (event) => { event.preventDefault(); drop.classList.remove("is-dragging"); process(event.dataTransfer?.files); });
  drop?.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); input.click(); } });
  document.getElementById("file-remove")?.addEventListener("click", () => {
    setSource("");
    error.textContent = "";
    status.textContent = "";
    clearSummary();
  });
  window.__DOCUMENT_FILE_READY__ = true;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
