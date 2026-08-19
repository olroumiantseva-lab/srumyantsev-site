import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const value = (flag) => { const at = args.indexOf(flag); return at >= 0 ? args[at + 1] : ""; };
const casePath = value("--case");
const judgmentsPath = value("--judgments");
if (!casePath || !judgmentsPath) throw new Error("Usage: node evaluate-result.mjs --case CASE.json --judgments JUDGMENTS.json");
const expected = JSON.parse(fs.readFileSync(path.resolve(casePath), "utf8"));
const judgments = JSON.parse(fs.readFileSync(path.resolve(judgmentsPath), "utf8"));
if (judgments.case_id !== expected.id) throw new Error("case_id does not match expected case");

function orderedVerdicts(name, criteria) {
  const rows = judgments[name];
  if (!Array.isArray(rows) || rows.length !== criteria.length) throw new Error(`${name}: expected ${criteria.length} semantic verdicts`);
  const ordered = [...rows].sort((a, b) => a.criterion_index - b.criterion_index);
  ordered.forEach((row, index) => {
    if (row.criterion_index !== index || typeof row.verdict !== "boolean" || typeof row.evidence !== "string") {
      throw new Error(`${name}: invalid verdict at criterion ${index}`);
    }
  });
  return ordered;
}

const mustFind = orderedVerdicts("must_find", expected.must_find);
const forbidden = orderedVerdicts("must_not_infer_violations", expected.must_not_infer);
const uncertainties = orderedVerdicts("uncertainties", expected.uncertainties);
const critical = orderedVerdicts("critical_failure_violations", expected.critical_failures);
const hardFailures = [
  ...forbidden.filter((item) => item.verdict).map((item) => ({ source: "must_not_infer", ...item })),
  ...critical.filter((item) => item.verdict).map((item) => ({ source: "critical_failures", ...item }))
];
const earned = mustFind.filter((item) => item.verdict).length + uncertainties.filter((item) => item.verdict).length;
const possible = mustFind.length + uncertainties.length;
const score = possible ? earned / possible : 1;
const passThreshold = 0.8;
const result = { case_id: expected.id, status: hardFailures.length || score < passThreshold ? "FAIL" : "PASS", score, pass_threshold: passThreshold, hard_failures: hardFailures };
console.log(JSON.stringify(result, null, 2));
if (result.status === "FAIL") process.exitCode = 1;
