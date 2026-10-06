/**
 * 🧑‍🏫 ปรับเทียบผู้ตัดสิน LLM กับคน (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E ชั้น 3)
 * ---------------------------------------------------------------------------
 * แม่หมอใน Marketplace ให้คะแนน 20 เคสต่อรอบ (เกณฑ์เดียวกับผู้ตัดสิน 1–5) ลงไฟล์
 *   scripts/qa/fixtures/human-ratings/<promptVersion>.json
 *   [{ "caseId": "gold-001", "rater": "reader_x", "scores": { "onQuestion": 4, "actionable": 3, ... } }]
 * แล้วเทียบกับรายงานผู้ตัดสินของ prompt รุ่นเดียวกัน ➔ ความเห็นตรงกัน (ห่าง ≤ 1) + Spearman ต่อเกณฑ์
 * เห็นตรงกันต่ำ (< 70% หรือ Spearman < 0.4) = **เชื่อคะแนนผู้ตัดสินในเกณฑ์นั้นไม่ได้** — รายงานต้องบอกตรง ๆ
 *
 *   npm run ai:judge:calibrate -- --version 20261006-1
 * ไม่เรียกโมเดล · ไม่ต้องมีคีย์
 */
import fs from "node:fs";
import path from "node:path";
import { RUBRIC, type JudgeReport, type RubricKey } from "./judge-compare";
import { agreement } from "./lib/eval/stats";

export interface HumanRating {
  caseId: string;
  rater: string;
  scores: Partial<Record<RubricKey, number>>;
}

export const TRUST_MIN_WITHIN_ONE = 0.7;
export const TRUST_MIN_SPEARMAN = 0.4;

export function calibrate(human: HumanRating[], report: JudgeReport) {
  const judgeBy = new Map(report.cases.map((c) => [c.id, c.judge]));
  const rows: Array<{ key: RubricKey; label: string; n: number; withinOne: number; spearman: number; trusted: boolean }> = [];
  for (const r of RUBRIC) {
    const hs: number[] = [];
    const js: number[] = [];
    for (const h of human) {
      const hv = h.scores[r.key];
      const jv = judgeBy.get(h.caseId)?.[r.key];
      if (typeof hv === "number" && typeof jv === "number") {
        hs.push(hv);
        js.push(jv);
      }
    }
    const a = agreement(hs, js);
    rows.push({ key: r.key, label: r.label, n: a.n, withinOne: a.withinOne, spearman: a.spearman, trusted: a.n >= 10 && a.withinOne >= TRUST_MIN_WITHIN_ONE && a.spearman >= TRUST_MIN_SPEARMAN });
  }
  return rows;
}

function main() {
  const i = process.argv.indexOf("--version");
  const version = i >= 0 ? process.argv[i + 1] : undefined;
  if (!version) {
    console.log("ใช้: npm run ai:judge:calibrate -- --version <promptVersion>");
    return;
  }
  const humanPath = path.join("scripts/qa/fixtures/human-ratings", `${version}.json`);
  if (!fs.existsSync(humanPath)) {
    console.log(`ยังไม่มีคะแนนจากคน (${humanPath}) — ให้แม่หมอให้คะแนน 20 เคสก่อน`);
    return;
  }
  const reports = fs.existsSync("scripts/qa/reports")
    ? fs.readdirSync("scripts/qa/reports").filter((f) => f.startsWith(`judge-${version}-`)).sort()
    : [];
  if (reports.length === 0) {
    console.log(`ยังไม่มีรายงานผู้ตัดสินของ ${version}`);
    return;
  }
  const report = JSON.parse(fs.readFileSync(path.join("scripts/qa/reports", reports[reports.length - 1]), "utf8")) as JudgeReport;
  const human = JSON.parse(fs.readFileSync(humanPath, "utf8")) as HumanRating[];
  console.log(`\n🧑‍🏫 ปรับเทียบผู้ตัดสิน ${report.judgeModel} กับคน — ${version}`);
  for (const r of calibrate(human, report)) {
    console.log(
      `   ${r.trusted ? "✅" : "⚠️"} ${r.label.padEnd(30)} n=${r.n} · ห่าง≤1 ${(r.withinOne * 100).toFixed(0)}% · Spearman ${r.spearman.toFixed(2)}${r.trusted ? "" : " ➔ อย่าใช้คะแนนเกณฑ์นี้ตัดสินใจ"}`,
    );
  }
}

if (process.argv[1]?.endsWith("judge-calibration.ts")) main();
