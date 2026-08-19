import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const args = process.argv.slice(2);
const execute = args.includes("--execute");
const dryRun = args.includes("--dry-run");
const modelAt = args.indexOf("--model");
const model = modelAt >= 0 ? args[modelAt + 1] : "";
if (!model) throw new Error("Pass an explicit model with --model MODEL_ID");
if (execute === dryRun) throw new Error("Choose exactly one: --dry-run or --execute");
if (execute && !process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required only with --execute");

const schema = JSON.parse(fs.readFileSync(path.join(root, "result.schema.json"), "utf8"));
const caseFiles = fs.readdirSync(path.join(root, "cases")).filter((name) => name.endsWith(".json")).sort();
if (caseFiles.length !== 22) throw new Error(`Expected 22 cases, found ${caseFiles.length}`);
if (dryRun) {
  console.log(`DRY RUN: ${caseFiles.length} cases would run sequentially with model ${model}; no API calls made`);
  process.exit(0);
}

const runId = new Date().toISOString().replaceAll(":", "-");
const runDir = path.join(root, "results", runId);
fs.mkdirSync(runDir, { recursive: true });
const manifest = { run_id: runId, model, started_at: new Date().toISOString(), cases: [] };
const instructions = "Проанализируй только предоставленный текст. Не додумывай факты. Не давай медицинских или юридических гарантий. Явно перечисляй неопределённости. Верни результат строго по JSON Schema.";

for (const name of caseFiles) {
  const expected = JSON.parse(fs.readFileSync(path.join(root, "cases", name), "utf8"));
  const document = fs.readFileSync(path.resolve(path.join(root, "cases"), expected.fixture), "utf8");
  const started = Date.now();
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        store: false,
        instructions,
        input: `Заявленный тип: ${expected.document_type}\n\nДокумент:\n${document}`,
        text: { format: { type: "json_schema", name: "document_analyzer_result", strict: true, schema } }
      })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status} ${payload?.error?.code ?? "unknown"}`);
    const outputText = payload.output?.flatMap((item) => item.content ?? []).find((item) => item.type === "output_text")?.text;
    if (!outputText) throw new Error("Response has no output_text");
    const record = { case_id: expected.id, model, status: "completed", duration_ms: Date.now() - started, response_id: payload.id, usage: payload.usage, output: JSON.parse(outputText) };
    fs.writeFileSync(path.join(runDir, `${expected.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
    manifest.cases.push({ case_id: expected.id, status: record.status, duration_ms: record.duration_ms });
  } catch (error) {
    const record = { case_id: expected.id, model, status: "failed", duration_ms: Date.now() - started, error: error instanceof Error ? error.message : "Unknown error" };
    fs.writeFileSync(path.join(runDir, `${expected.id}.json`), `${JSON.stringify(record, null, 2)}\n`);
    manifest.cases.push({ case_id: expected.id, status: record.status, duration_ms: record.duration_ms });
  }
}
manifest.finished_at = new Date().toISOString();
manifest.summary = {
  completed: manifest.cases.filter((item) => item.status === "completed").length,
  failed: manifest.cases.filter((item) => item.status === "failed").length
};
fs.writeFileSync(path.join(runDir, "_run.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`DONE: saved ${manifest.cases.length} results (${manifest.summary.completed} completed, ${manifest.summary.failed} failed) to ${path.relative(process.cwd(), runDir)}`);
if (manifest.summary.failed) process.exitCode = 1;
