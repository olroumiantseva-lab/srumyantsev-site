import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname);
const readCase = (id) => JSON.parse(fs.readFileSync(path.join(root, "cases", `${id}.json`), "utf8"));
const byLabel = (item, part) => item.expected_dates.find((date) => date.label.includes(part));
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const relative = readCase("02-letter-relative");
assert(relative.document_date === "2026-10-10", "02: document_date missing");
assert(byLabel(relative, "5 рабочих").anchor.field === "received_at" && byLabel(relative, "5 рабочих").computable === false, "02: unknown receipt anchor must remain uncomputable");
const dependent = readCase("05-contract-services");
assert(byLabel(dependent, "3 рабочих").anchor.field === "acceptance_signed_at", "05: act anchor missing");
const appointment = readCase("16-medical-appointment");
assert(byLabel(appointment, "8 часов").computed_datetime === "2026-10-05T00:40:00+03:00", "16: computed preparation timestamp mismatch");
const range = readCase("17-medical-discharge");
assert(byLabel(range, "10–14").earliest_date === "2026-12-12" && byLabel(range, "10–14").latest_date === "2026-12-16", "17: normalized range mismatch");
const conflict = readCase("08-bill-conflict");
assert(conflict.expected_amounts.some((item) => item.value === 7500 && item.currency === "RUB") && conflict.expected_amounts.some((item) => item.value === 7000 && item.currency === "RUB"), "08: conflicting normalized amounts missing");
const changing = readCase("09-bill-overdue");
assert(changing.expected_amounts.some((item) => item.value === 12180 && item.currency === "RUB") && changing.must_not_infer.some((item) => item.includes("неизменными")), "09: changing charge guard missing");

const temp = fs.mkdtempSync(path.join(os.tmpdir(), "document-eval-audit-"));
try {
  const sample = readCase("01-letter-deadline");
  const verdicts = (items, verdict) => items.map((_, criterion_index) => ({ criterion_index, verdict, evidence: "Смысл проверен без дословного сравнения" }));
  const judgments = { case_id: sample.id, must_find: verdicts(sample.must_find, true), must_not_infer_violations: verdicts(sample.must_not_infer, false), uncertainties: verdicts(sample.uncertainties, true), critical_failure_violations: verdicts(sample.critical_failures, false) };
  const judgmentsFile = path.join(temp, "judgments.json");
  fs.writeFileSync(judgmentsFile, JSON.stringify(judgments));
  const evaluator = path.join(root, "evaluate-result.mjs");
  const caseFile = path.join(root, "cases", "01-letter-deadline.json");
  const pass = spawnSync(process.execPath, [evaluator, "--case", caseFile, "--judgments", judgmentsFile], { encoding: "utf8" });
  assert(pass.status === 0 && JSON.parse(pass.stdout).status === "PASS", "Semantic PASS fixture failed");
  judgments.must_not_infer_violations[0].verdict = true;
  fs.writeFileSync(judgmentsFile, JSON.stringify(judgments));
  const hardFail = spawnSync(process.execPath, [evaluator, "--case", caseFile, "--judgments", judgmentsFile], { encoding: "utf8" });
  const hardFailResult = JSON.parse(hardFail.stdout);
  assert(hardFail.status === 1 && hardFailResult.status === "FAIL" && hardFailResult.score === 1, "must_not_infer must FAIL independently of score");
  judgments.must_not_infer_violations[0].verdict = false;
  judgments.critical_failure_violations[0].verdict = true;
  fs.writeFileSync(judgmentsFile, JSON.stringify(judgments));
  const criticalFail = spawnSync(process.execPath, [evaluator, "--case", caseFile, "--judgments", judgmentsFile], { encoding: "utf8" });
  assert(criticalFail.status === 1 && JSON.parse(criticalFail.stdout).status === "FAIL", "critical_failure must force FAIL");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}

const runner = path.join(root, "run-evals.mjs");
const noExecute = spawnSync(process.execPath, [runner, "--model", "audit-placeholder"], { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "unused-audit-sentinel" } });
assert(noExecute.status !== 0 && `${noExecute.stderr}${noExecute.stdout}`.includes("Choose exactly one"), "Runner must reject invocation without --execute/--dry-run");
const dryRun = spawnSync(process.execPath, [runner, "--dry-run", "--model", "audit-placeholder"], { encoding: "utf8", env: { ...process.env, OPENAI_API_KEY: "unused-audit-sentinel" } });
assert(dryRun.status === 0 && dryRun.stdout.includes("no API calls made"), "Runner dry-run guard failed");
console.log("PASS: relative dates, ranges, amounts, hard-fails, semantic verdicts, and explicit --execute guard");
