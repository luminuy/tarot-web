/**
 * ⚖️ เทียบคู่แบบปิดชื่อ — prompt รุ่น A กับ B (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E ชั้น 2)
 * ---------------------------------------------------------------------------
 * ใช้ snapshot ที่เก็บไว้แล้วทั้งสองรุ่น (ไม่เรียกผู้ผลิตซ้ำ) แล้วถามผู้ตัดสินว่า "คำอ่านไหนดีกว่า"
 *   • ปิดชื่อ: ผู้ตัดสินเห็นแค่ "คำอ่าน 1 / 2" ไม่รู้ว่ารุ่นไหน
 *   • สลับตำแหน่ง: ถามสองรอบ (A ก่อน · B ก่อน) — ผลไม่ตรงกันข้ามตำแหน่ง = นับเสมอ (กันลำเอียงตำแหน่ง)
 *   • ผู้ตัดสินคนละตระกูลกับผู้ผลิตทั้งสองฝั่ง + สลับเมื่อโดน 429 (lib/eval/judges.ts)
 *   • รายงานอัตราชนะของ B พร้อมช่วงความเชื่อมั่น 95% (Wilson) — ไม่ใช่ตัวเลขเดี่ยวที่ดูแน่นอนเกินจริง
 *
 *   npm run ai:judge:ab -- --a 20261003-1 --b 20261006-1 [--limit 20]
 * ⚠️ ใช้คีย์ของนักพัฒนา (JUDGE_GEMINI_API_KEY / JUDGE_GROQ_API_KEY) — ห้ามผูกเข้า CI
 */
import fs from "node:fs";
import path from "node:path";
import { getSpread } from "../../src/data/spreads";
import { cardById } from "../../src/data/cards";
import { judgeWithRotation, parseJudgeJson } from "./lib/eval/judges";
import { loadSnapshot, type CaseLike } from "./lib/eval/snapshots";
import { combineSwapped, pairwiseSummary, type PairOutcome } from "./lib/eval/stats";

const arg = (n: string) => {
  const i = process.argv.indexOf(`--${n}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
};

export function pairwisePrompt(c: CaseLike, first: unknown, second: unknown): string {
  const cards = c.cardIds
    .map((id, i) => `- ${getSpread(c.spreadId)?.positions[i]?.nameTh ?? i + 1}: ${cardById(id)?.nameEn} ${c.reversed[i] ? "(reversed)" : "(upright)"}`)
    .join("\n");
  return `You are a strict evaluator of tarot readings. Compare two readings of the SAME cards for the SAME question.
Judge only: answers the question directly · grounded in the actual 1909 card imagery · concrete and actionable · not vague (no Barnum statements) · natural ${c.lang === "en" ? "English" : "Thai"}.
Ignore length unless it hurts clarity. Do not prefer a reading because of its position.

Question: "${c.question}"
Cards:
${cards}

Reading 1 (JSON):
${JSON.stringify(first)}

Reading 2 (JSON):
${JSON.stringify(second)}

Reply with JSON only: {"better":"1"|"2"|"tie","reason":"one short sentence"}`;
}

function verdict(text: string | undefined): "1" | "2" | "tie" {
  const v = String(parseJudgeJson(text ?? "")?.better ?? "tie");
  return v === "1" || v === "2" ? v : "tie";
}

async function main() {
  const a = arg("a");
  const b = arg("b");
  if (!a || !b) {
    console.log("ใช้: npm run ai:judge:ab -- --a <promptVersionA> --b <promptVersionB> [--limit N]");
    return;
  }
  const limit = Number(arg("limit") ?? 0);
  const cases: CaseLike[] = JSON.parse(fs.readFileSync("scripts/qa/fixtures/eval-cases.json", "utf8"));
  const benched = new Set<string>();
  const outcomes: Array<PairOutcome & { id: string }> = [];

  for (const c of cases) {
    if (limit > 0 && outcomes.length >= limit) break;
    const sa = loadSnapshot(a, c.id);
    const sb = loadSnapshot(b, c.id);
    if (!sa || !sb) continue;
    // ผู้ตัดสินต้องคนละตระกูลกับทั้งสองฝั่ง — ส่งชื่อผู้ผลิตทั้งคู่ให้ตัวกรอง
    const producers = [sa.model, sb.model];
    const producer = producers.join("|");
    const r1 = await judgeWithRotation(producers, pairwisePrompt(c, sa.reading, sb.reading), benched);
    const r2 = await judgeWithRotation(producers, pairwisePrompt(c, sb.reading, sa.reading), benched);
    if (!r1 || !r2) {
      console.log(`  ⚠️ ${c.id}: ไม่เหลือผู้ตัดสินที่ใช้ได้ (${producer})`);
      continue;
    }
    const o = combineSwapped(verdict(r1.text), verdict(r2.text));
    outcomes.push({ ...o, id: c.id });
    console.log(`  ${c.id}: ${o.winner === "tie" ? "เสมอ/ลำเอียงตำแหน่ง" : `ชนะ ${o.winner}`}`);
  }

  const sum = pairwiseSummary(outcomes);
  console.log(`\n⚖️ ${a} (A) ปะทะ ${b} (B) — ${sum.n} เคส`);
  console.log(`   A ชนะ ${sum.a} · B ชนะ ${sum.b} · เสมอ ${sum.ties}`);
  if (sum.a + sum.b > 0) {
    const w = sum.bWinRate;
    console.log(`   อัตราชนะของ B (ไม่นับเสมอ) ${(w.p * 100).toFixed(0)}% · ช่วงความเชื่อมั่น 95% ${(w.low * 100).toFixed(0)}–${(w.high * 100).toFixed(0)}%`);
    console.log(w.low > 0.5 ? "   🟢 B ดีกว่าอย่างมีนัย" : w.high < 0.5 ? "   🔴 B แย่กว่าอย่างมีนัย" : "   ⚪ ยังแยกไม่ออก (ช่วงคร่อม 50%) — อย่าสรุปว่าดีขึ้น");
  }
  const out = path.join("scripts/qa/reports", `pairwise-${a}-vs-${b}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify({ a, b, outcomes, summary: sum }, null, 2));
  console.log(`💾 ${out}`);
}

if (process.argv[1]?.endsWith("judge-pairwise.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
