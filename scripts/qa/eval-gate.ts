/**
 * 🚧 ด่านกันถอยหลังของ prompt (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E)
 * ---------------------------------------------------------------------------
 * PR ที่แตะไฟล์ prompt ต้องมี:
 *   1. ชั้น 1 ผ่านครบบน snapshot ของ PROMPT_VERSION ใหม่ (ไม่ใช่ของเก่า — แก้ prompt แล้วต้องเก็บคำตอบใหม่)
 *   2. ชั้น 2 ไม่ต่ำกว่า baseline เกินช่วงความคลาดเคลื่อน (เทียบเฉพาะเคสที่ได้คะแนนทั้งสองรอบ)
 * PR ที่ไม่แตะ prompt ➔ ผ่านทันที (ไม่ต้องมีคีย์ ไม่เรียกโมเดล)
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/qa/eval-gate.ts [--base origin/main] [--baseline <version>]
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PROMPT_VERSION } from "../../src/lib/ai/prompt-version";
import type { JudgeReport } from "./judge-compare";
import { regressionCheck } from "./lib/eval/stats";
import { runEval } from "./run-eval-snapshots";

/** ไฟล์ที่ถือว่า "แตะ prompt" — แก้แล้วต้องวัดใหม่ */
export const PROMPT_FILES = [
  "src/lib/ai/prompt.ts",
  "src/lib/ai/prompt-guard.ts",
  "src/lib/ai/prompt-version.ts",
  "src/lib/ai/cosmic.ts",
  "src/lib/ai/karmic.ts",
  "src/lib/ai/memory.ts",
  "src/data/ai/exemplars.ts",
  "src/data/personas.ts",
];

export function touchesPrompt(changed: string[]): boolean {
  return changed.some((f) => PROMPT_FILES.includes(f) || f.startsWith("src/lib/ai/prompt"));
}

function latestReport(version: string): JudgeReport | null {
  const dir = "scripts/qa/reports";
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir).filter((f) => f.startsWith(`judge-${version}-`)).sort();
  if (!files.length) return null;
  return JSON.parse(fs.readFileSync(path.join(dir, files[files.length - 1]), "utf8")) as JudgeReport;
}

const scoresOf = (r: JudgeReport) =>
  Object.fromEntries(r.cases.filter((c) => typeof c.judge.average === "number").map((c) => [c.id, c.judge.average as number]));

async function main() {
  const bi = process.argv.indexOf("--base");
  const base = bi >= 0 ? process.argv[bi + 1] : "origin/main";
  let changed: string[] = [];
  try {
    changed = execSync(`git diff --name-only ${base}...HEAD`, { encoding: "utf8" }).split("\n").filter(Boolean);
  } catch {
    console.log(`⚠️ หา diff กับ ${base} ไม่ได้ — ถือว่าแตะ prompt (ปลอดภัยไว้ก่อน)`);
    changed = PROMPT_FILES;
  }
  if (!touchesPrompt(changed)) {
    console.log("✅ PR นี้ไม่แตะ prompt — ไม่ต้องวัดใหม่");
    return;
  }
  console.log(`🚧 PR แตะ prompt — ต้องมีผลวัดของ ${PROMPT_VERSION}`);

  const l1 = await runEval({ mode: "snapshot", version: PROMPT_VERSION });
  if (l1.evaluated === 0) {
    console.log(`❌ ไม่มี snapshot ของ ${PROMPT_VERSION} — รัน npm run ai:judge -- --set eval ก่อน`);
    process.exit(1);
  }
  const l1ok = l1.summary.passed === l1.evaluated && l1.ingress.failed.length === 0;
  console.log(`${l1ok ? "✅" : "❌"} ชั้น 1: ผ่าน ${l1.summary.passed}/${l1.evaluated} · ด่านขาเข้า ${l1.ingress.passed}/${l1.ingress.total}`);

  const bli = process.argv.indexOf("--baseline");
  const baselineVersion = bli >= 0 ? process.argv[bli + 1] : undefined;
  const current = latestReport(PROMPT_VERSION);
  const baseline = baselineVersion ? latestReport(baselineVersion) : null;
  let l2ok = true;
  if (!current || !baseline) {
    console.log(`⚠️ ชั้น 2: ${!current ? `ไม่มีรายงานผู้ตัดสินของ ${PROMPT_VERSION}` : "ไม่ได้ระบุ --baseline"} — ข้ามการเทียบ (ต้องแนบเหตุผลใน PR)`);
  } else {
    const r = regressionCheck(scoresOf(baseline), scoresOf(current));
    l2ok = r.ok;
    console.log(
      r.insufficient
        ? `⚠️ ชั้น 2: เคสที่ได้คะแนนทั้งสองรอบมีแค่ ${r.shared} — น้อยเกินจะสรุป`
        : `${r.ok ? "✅" : "❌"} ชั้น 2: ต่างจาก baseline ${r.delta >= 0 ? "+" : ""}${r.delta.toFixed(2)} (ยอมได้ถึง −${r.margin.toFixed(2)}) บน ${r.shared} เคส`,
    );
  }
  process.exit(l1ok && l2ok ? 0 : 1);
}

if (process.argv[1]?.endsWith("eval-gate.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
