import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname);
const casesDir = path.join(root, "cases");
const allowedTypes = new Set(["letter", "contract", "bill", "notice", "instruction", "medical", "bank", "other"]);
const requiredArrays = ["must_find", "must_not_infer", "uncertainties", "critical_failures", "expected_dates", "expected_amounts", "expected_obligations"];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/;
const currencies = new Set(["RUB", "USD", "EUR"]);
const validDate = (value) => typeof value === "string" && isoDate.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const files = fs.readdirSync(casesDir).filter((name) => name.endsWith(".json")).sort();
if (files.length !== 22) throw new Error(`Expected 22 cases, found ${files.length}`);

const ids = new Set();
const counts = {};
for (const file of files) {
  const item = JSON.parse(fs.readFileSync(path.join(casesDir, file), "utf8"));
  if (!item.id || ids.has(item.id)) throw new Error(`Invalid or duplicate id in ${file}`);
  ids.add(item.id);
  if (!allowedTypes.has(item.document_type)) throw new Error(`Invalid document_type in ${file}`);
  if (item.document_date !== null && !validDate(item.document_date)) throw new Error(`Invalid document_date in ${file}`);
  for (const key of requiredArrays) if (!Array.isArray(item[key])) throw new Error(`${key} must be an array in ${file}`);
  for (const key of ["must_find", "must_not_infer", "uncertainties", "critical_failures", "expected_obligations"]) {
    if (item[key].some((value) => typeof value !== "string" || !value.trim())) throw new Error(`${key} has an invalid criterion in ${file}`);
  }
  if (!item.must_not_infer.length || !item.critical_failures.length) throw new Error(`Hard-fail criteria missing in ${file}`);
  for (const expected of item.expected_dates) {
    if (expected.date !== null && !validDate(expected.date)) throw new Error(`Non-comparable absolute date in ${file}`);
    if (expected.date === null) {
      if (!expected.kind || typeof expected.computable !== "boolean") throw new Error(`Unstructured relative date in ${file}`);
      if (expected.computable) {
        const hasComputed = validDate(expected.computed_date) || isoDateTime.test(expected.computed_datetime ?? "") || (validDate(expected.earliest_date) && validDate(expected.latest_date));
        if (!hasComputed) throw new Error(`Computable date lacks normalized result in ${file}`);
        const anchorValue = expected.anchor?.date ?? expected.anchor?.datetime;
        if (!validDate(anchorValue) && !isoDateTime.test(anchorValue ?? "")) throw new Error(`Computable date lacks an unambiguous anchor in ${file}`);
      } else if (!expected.anchor && !expected.recurrence) throw new Error(`Uncomputable date lacks anchor/recurrence metadata in ${file}`);
    }
  }
  for (const expected of item.expected_amounts) {
    if (!Number.isFinite(expected.value) || !currencies.has(expected.currency) || typeof expected.label !== "string" || !expected.label) throw new Error(`Invalid normalized amount in ${file}`);
  }
  const fixture = path.resolve(casesDir, item.fixture);
  if (!fixture.startsWith(path.join(root, "fixtures")) || !fs.existsSync(fixture)) throw new Error(`Missing fixture for ${file}`);
  const text = fs.readFileSync(fixture, "utf8").trim();
  if (!text || text.length > 30000) throw new Error(`Invalid fixture length for ${file}`);
  counts[item.document_type] = (counts[item.document_type] ?? 0) + 1;
}
JSON.parse(fs.readFileSync(path.join(root, "result.schema.json"), "utf8"));
JSON.parse(fs.readFileSync(path.join(root, "evaluation.schema.json"), "utf8"));
console.log(`PASS: ${files.length} cases, ${files.length} fixtures, normalized dates/amounts, schemas valid`);
console.log(JSON.stringify(counts));
