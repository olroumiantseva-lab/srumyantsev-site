import * as pdfjsLib from "/tools/vendor/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/tools/vendor/pdf.worker.min.mjs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_LENGTH = 30000;
const PREVIEW_LENGTH = 240;
const TYPES = {
  pdf: {
    label: "PDF",
    mime: ["application/pdf"],
  },
  docx: {
    label: "DOCX",
    mime: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  },
  txt: {
    label: "TXT",
    mime: ["text/plain"],
  },
};

class FileExtractionError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const normalizeText = (value) => value
  .replace(/\r\n?/g, "\n")
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
  .replace(/[ \t]+\n/g, "\n")
  .replace(/\n{4,}/g, "\n\n\n")
  .trim();

const signature = (bytes) => {
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 1024));
  if (header.includes("%PDF-")) return "pdf";
  if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) return "docx";
  return "unknown";
};

function validateFile(file, bytes) {
  const extension = file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
  if (extension === "doc") throw new FileExtractionError("OLD_DOC", "Старый формат DOC не поддерживается. Сохраните документ как DOCX или TXT.");
  if (["jpg", "jpeg", "png", "gif", "webp", "heic", "tif", "tiff"].includes(extension)) {
    throw new FileExtractionError("IMAGE", "Изображения и сканы пока не поддерживаются. Добавьте PDF с текстовым слоем, DOCX или TXT.");
  }
  if (!TYPES[extension]) throw new FileExtractionError("EXTENSION", "Поддерживаются только файлы PDF, DOCX и TXT.");
  if (file.size === 0) throw new FileExtractionError("EMPTY", "Файл пуст. Выберите документ с текстом.");
  if (file.size > MAX_FILE_BYTES) throw new FileExtractionError("FILE_TOO_LARGE", "Файл больше 8 МБ. Выберите файл меньшего размера.");

  const detected = signature(bytes);
  if (detected !== "unknown" && detected !== extension) {
    throw new FileExtractionError("SIGNATURE_MISMATCH", "Содержимое файла не соответствует его расширению. Выберите исходный документ без переименования.");
  }
  if (extension === "pdf" && detected !== "pdf") throw new FileExtractionError("DAMAGED_PDF", "Не удалось распознать PDF. Возможно, файл повреждён или имеет неверный формат.");
  if (extension === "docx" && detected !== "docx") throw new FileExtractionError("DAMAGED_DOCX", "Не удалось распознать DOCX. Старые DOC и повреждённые файлы не поддерживаются.");
  if (extension === "txt" && detected !== "unknown") throw new FileExtractionError("SIGNATURE_MISMATCH", "Содержимое файла не соответствует формату TXT.");

  const mime = (file.type || "").toLowerCase();
  if (mime && !TYPES[extension].mime.includes(mime)) {
    throw new FileExtractionError("MIME", "Тип файла не соответствует его расширению. Выберите исходный PDF, DOCX или TXT.");
  }
  return extension;
}

async function extractPdf(bytes) {
  const task = pdfjsLib.getDocument({ data: bytes, isEvalSupported: false, useWorkerFetch: false });
  try {
    const pdf = await task.promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      let text = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        text += `${item.str}${item.hasEOL ? "\n" : " "}`;
      }
      pages.push(text.trim());
    }
    const result = normalizeText(pages.filter(Boolean).join("\n\n"));
    if (!result) throw new FileExtractionError("SCANNED_PDF", "В PDF не найден текстовый слой. Сканы и изображения пока не поддерживаются.");
    return result;
  } catch (error) {
    if (error instanceof FileExtractionError) throw error;
    if (error?.name === "PasswordException") throw new FileExtractionError("PROTECTED_PDF", "Защищённые паролем PDF не поддерживаются. Снимите защиту и попробуйте снова.");
    throw new FileExtractionError("DAMAGED_PDF", "Не удалось прочитать PDF. Возможно, файл повреждён или защищён.");
  } finally {
    await task.destroy().catch(() => {});
  }
}

async function extractDocx(buffer) {
  if (!window.mammoth?.extractRawText) throw new FileExtractionError("LIBRARY", "Не удалось загрузить локальный модуль DOCX. Обновите страницу.");
  try {
    const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
    const text = normalizeText(result.value || "");
    if (!text) throw new FileExtractionError("EMPTY_DOCX", "В DOCX не найден текст. Пустые документы и документы только с изображениями не поддерживаются.");
    return text;
  } catch (error) {
    if (error instanceof FileExtractionError) throw error;
    throw new FileExtractionError("DAMAGED_DOCX", "Не удалось прочитать DOCX. Возможно, файл повреждён или имеет неверный формат.");
  }
}

function extractTxt(bytes) {
  if (bytes.includes(0)) throw new FileExtractionError("BINARY_TXT", "TXT содержит бинарные данные. Сохраните документ как обычный текст UTF-8.");
  try {
    const text = normalizeText(new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^\uFEFF/, ""));
    if (!text) throw new FileExtractionError("EMPTY", "Файл пуст. Выберите документ с текстом.");
    return text;
  } catch (error) {
    if (error instanceof FileExtractionError) throw error;
    throw new FileExtractionError("TXT_ENCODING", "Не удалось прочитать TXT. Сохраните файл в кодировке UTF-8.");
  }
}

function init() {
  const input = document.getElementById("document-file");
  if (!input) return;
  const drop = document.getElementById("file-drop");
  const status = document.getElementById("file-status");
  const error = document.getElementById("file-error");
  const summary = document.getElementById("file-summary");
  const source = document.getElementById("source-text");
  let lastExtractedText = "";

  const clearSummary = () => {
    summary.classList.add("hidden");
    document.getElementById("file-name").textContent = "";
    document.getElementById("file-type").textContent = "";
    document.getElementById("file-text-size").textContent = "";
    document.getElementById("file-preview").textContent = "";
  };

  const showResult = (file, type, text) => {
    document.getElementById("file-name").textContent = file.name;
    document.getElementById("file-type").textContent = TYPES[type].label;
    document.getElementById("file-text-size").textContent = `${text.length.toLocaleString("ru-RU")} символов`;
    const compact = text.replace(/\s+/g, " ");
    document.getElementById("file-preview").textContent = compact.length > PREVIEW_LENGTH ? `${compact.slice(0, PREVIEW_LENGTH)}…` : compact;
    summary.classList.remove("hidden");
  };

  const processFile = async (file) => {
    if (!file) return;
    error.textContent = "";
    status.textContent = "Извлекаем текст в браузере…";
    clearSummary();
    drop.classList.add("is-processing");
    input.disabled = true;
    try {
      if (file.size > MAX_FILE_BYTES) throw new FileExtractionError("FILE_TOO_LARGE", "Файл больше 8 МБ. Выберите файл меньшего размера.");
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const type = validateFile(file, bytes);
      const text = type === "pdf" ? await extractPdf(bytes) : type === "docx" ? await extractDocx(buffer) : extractTxt(bytes);
      if (text.length > MAX_TEXT_LENGTH) {
        throw new FileExtractionError("TEXT_TOO_LONG", `В документе ${text.length.toLocaleString("ru-RU")} символов — больше лимита 30 000. Сократите документ и загрузите его снова.`);
      }
      lastExtractedText = text;
      source.value = text;
      source.dispatchEvent(new Event("input", { bubbles: true }));
      showResult(file, type, text);
      status.textContent = "Текст извлечён локально. Оригинальный файл никуда не отправлялся.";
    } catch (reason) {
      lastExtractedText = "";
      error.textContent = reason instanceof FileExtractionError ? reason.message : "Не удалось обработать файл. Попробуйте другой документ.";
      status.textContent = "";
    } finally {
      input.value = "";
      input.disabled = false;
      drop.classList.remove("is-processing", "is-dragging");
    }
  };

  input.addEventListener("change", () => processFile(input.files?.[0]));
  for (const eventName of ["dragenter", "dragover"]) {
    drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.add("is-dragging"); });
  }
  for (const eventName of ["dragleave", "dragend"]) drop.addEventListener(eventName, () => drop.classList.remove("is-dragging"));
  drop.addEventListener("drop", (event) => {
    event.preventDefault();
    drop.classList.remove("is-dragging");
    processFile(event.dataTransfer?.files?.[0]);
  });
  drop.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    input.click();
  });
  document.getElementById("file-remove").addEventListener("click", () => {
    if (source.value === lastExtractedText) {
      source.value = "";
      source.dispatchEvent(new Event("input", { bubbles: true }));
    }
    lastExtractedText = "";
    error.textContent = "";
    status.textContent = "";
    clearSummary();
  });
  window.__DOCUMENT_FILE_READY__ = true;
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
else init();
