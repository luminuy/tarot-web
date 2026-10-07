/**
 * 🧪 วัดคุณภาพ AI ชั้น 1 บนคำตอบที่บันทึกไว้ (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E)
 * ---------------------------------------------------------------------------
 * ไม่เรียกโมเดลเลย ➔ รันใน CI ได้ทุก PR · รายงานอัตราผ่าน "ต่อเกณฑ์" (ไม่มีตารางอันดับใครแม่นสุด)
 *
 *   npm run ai:eval                       # snapshot ของ PROMPT_VERSION ปัจจุบัน (ไม่มี = บอกว่าวัดไม่ได้ · ไม่ล้ม)
 *   npm run ai:eval -- --version 20261003-1
 *   npm run ai:eval -- --mock             # ใช้คำอ่านสำรองออฟไลน์ (สิ่งที่ผู้ใช้เห็นตอนโมเดลล่ม) — CI ใช้โหมดนี้
 *   npm run ai:eval -- --strict           # ไม่มี snapshot = ล้ม (ใช้ตอนแตะ prompt)
 *
 * เคสวิกฤต/คำสั่งแฝง/PII ตรวจที่ด่านขาเข้าทุกโหมด (เป็นของที่ production ไม่ส่งไปโมเดล)
 */
import fs from "node:fs";
import { PROMPT_VERSION } from "../../src/lib/ai/prompt-version";
import { buildReadingMessage } from "../../src/lib/ai/prompt";
import { looksLikePromptInjection } from "../../src/lib/ai/prompt-guard";
import { streamMockGeminiReading } from "../../src/lib/ai/mock-reading";
import { checkQuestion } from "../../src/lib/safety/guardrails";
import { evaluateReading, summarizeEval, type EvalResult } from "../../src/lib/ai/eval/deterministic";
import type { Reading } from "../../src/lib/schema/reading";
import { contextForCase, loadSnapshot, type CaseLike } from "./lib/eval/snapshots";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

export interface EvalRunReport {
  mode: "snapshot" | "mock";
  version: string;
  evaluated: number;
  missing: number;
  ingress: { total: number; passed: number; failed: string[] };
  results: Array<{ id: string; pass: boolean; failed: string[] }>;
  summary: ReturnType<typeof summarizeEval>;
}

export async function runEval(opts: { mode: "snapshot" | "mock"; version: string }): Promise<EvalRunReport> {
  const cases: CaseLike[] = JSON.parse(fs.readFileSync("scripts/qa/fixtures/eval-cases.json", "utf8"));
  const results: EvalRunReport["results"] = [];
  const evals: EvalResult[] = [];
  const ingress = { total: 0, passed: 0, failed: [] as string[] };
  let missing = 0;

  for (const c of cases) {
    const ctx = contextForCase(c);
    if (!ctx) {
      results.push({ id: c.id, pass: false, failed: ["context"] });
      continue;
    }
    // ── ด่านขาเข้า (ไม่เรียกโมเดล) ──
    if (c.kind === "crisis" || c.kind === "injection" || c.kind === "pii") {
      ingress.total++;
      const ok =
        c.kind === "crisis"
          ? checkQuestion(c.question, c.lang ?? "th").block
          : c.kind === "injection"
            ? looksLikePromptInjection(c.question)
            : !/081-234-5678|@example\.com/.test(buildReadingMessage(ctx));
      if (ok) ingress.passed++;
      else ingress.failed.push(`${c.id}:${c.kind}`);
      if (c.kind !== "pii") continue;
    }

    let reading: Reading | null = null;
    if (opts.mode === "snapshot") {
      reading = loadSnapshot(opts.version, c.id)?.reading ?? null;
    } else {
      for await (const ev of streamMockGeminiReading(ctx)) if (ev.type === "done") reading = ev.reading;
    }
    if (!reading) {
      missing++;
      continue;
    }
    const res = evaluateReading({
      reading,
      cards: ctx.cards,
      reversed: ctx.drawn.map((d) => d.isReversed),
      lang: ctx.lang ?? "th",
      yesNoMode: ctx.spread.yesNoMode,
    });
    evals.push(res);
    results.push({ id: c.id, pass: res.pass, failed: res.checks.filter((x) => !x.pass).map((x) => `${x.id}${x.detail ? `(${x.detail})` : ""}`) });
  }
  return { mode: opts.mode, version: opts.version, evaluated: evals.length, missing, ingress, results, summary: summarizeEval(evals) };
}

async function main() {
  const mode = process.argv.includes("--mock") ? "mock" : "snapshot";
  const version = arg("version") ?? PROMPT_VERSION;
  const report = await runEval({ mode, version });

  console.log(`\n🧪 วัดคุณภาพชั้น 1 — ${mode === "mock" ? "คำอ่านสำรองออฟไลน์" : `snapshot ${version}`}`);
  console.log(`   ด่านขาเข้า (วิกฤต/คำสั่งแฝง/PII): ${report.ingress.passed}/${report.ingress.total}`);
  for (const f of report.ingress.failed) console.log(`   ❌ ${f}`);

  if (report.evaluated === 0) {
    console.log(`   ⚠️ ไม่มีคำตอบให้ตรวจ (${report.missing} เคสไม่มี snapshot) — รัน npm run ai:judge -- --set eval เพื่อเก็บ snapshot ก่อน`);
    process.exit(process.argv.includes("--strict") || report.ingress.failed.length > 0 ? 1 : 0);
  }

  console.log(`   ตรวจได้ ${report.evaluated} เคส · ผ่านครบทุกเกณฑ์ ${report.summary.passed}${report.missing ? ` · ไม่มี snapshot ${report.missing}` : ""}`);
  for (const [id, b] of Object.entries(report.summary.byCheck)) {
    console.log(`   ${b.pass === b.total ? "✅" : "❌"} ${id.padEnd(14)} ${b.pass}/${b.total}`);
  }
  for (const r of report.results.filter((x) => !x.pass).slice(0, 15)) console.log(`   · ${r.id}: ${r.failed.join(" · ")}`);

  const ok = report.summary.passed === report.evaluated && report.ingress.failed.length === 0;
  console.log(ok ? "\n✅ ชั้น 1 ผ่านครบ" : "\n❌ ชั้น 1 ไม่ผ่าน");
  process.exit(ok ? 0 : 1);
}

if (process.argv[1]?.endsWith("run-eval-snapshots.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
