/**
 * 📊 ด่านตัวเลขแผงสถิติแอดมินต้องมาจากของจริง (Admin Stats Keys Gate)
 * ---------------------------------------------------------------------------
 * ## ทำไมต้องมีด่านนี้ (ตรวจเจอ 2026-09-23)
 *
 * แผงสถิติขึ้นตัวเลขผิดเงียบ ๆ สองจุด โดยไม่มี error ให้เห็นเลย:
 *
 * 1. **โควตา AI วันนี้ "0 / 2,000" ตลอดกาล** — ตั้งแต่เปิด Upstash `bumpCounter()` เขียน
 *    ตัวนับลง Redis อย่างเดียว แต่ `/api/admin/stats` กับ `/api/admin/ai-health` อ่าน
 *    `KEY.aiCap(day)` ด้วย `kvGetJSON` ตรง ๆ ซึ่งว่างเสมอ (ขณะที่การ์ดข้าง ๆ ขึ้นเรียก AI 261 ครั้ง)
 * 2. **การ์ด failover ขึ้น 0 ตลอดกาล** — แผงอ่าน `ai_failover_groq_to_gemini`
 *    แต่ตัวบันทึกเขียน `ai_groq_failover` (ไม่เคยมีใครเขียนชื่อที่แผงอ่านเลย)
 *
 * ## ด่านนี้ตรวจ
 *
 * ก. ห้ามอ่านตัวนับที่ `bumpCounter()` เขียน (โควตา AI) ด้วย `kvGetJSON` นอกไฟล์ตัวนับ
 *    ➔ ต้องอ่านผ่าน `readCounter()` / `getAiUsageToday()` เท่านั้น
 * ข. ทุกชื่อเมตริกใน `src/lib/stats/admin-metrics.ts` ต้องมีจุดบันทึกจริงใน `src/`
 * ค. ตัวสรุปคำนวณถูก (ไม่นับซ้ำคีย์รายโมเดล · ตัวหาร 0 ได้ null ไม่ใช่ 0%)
 *
 * รันด้วย: npx tsx scripts/qa/test-admin-stats-keys.ts
 */
import fs from "node:fs";
import path from "node:path";

import { METRIC, PREFIX, change, pctOf, summarize } from "../../src/lib/stats/admin-metrics";
import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const METRICS_FILE = path.join(SRC, "lib/stats/admin-metrics.ts");

let failed = 0;
function check(title: string, ok: boolean, detail = "") {
  if (ok) console.log(`  ✅ ${title}`);
  else {
    failed++;
    console.error(`  ❌ ${title}${detail ? `\n${detail}` : ""}`);
  }
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(full);
  }
  return out;
}

console.log("📊 [QA] ตัวเลขแผงสถิติแอดมินต้องมาจากของจริง\n");

const files = walk(SRC);
assertNonEmptyCorpus("ไฟล์ .ts/.tsx ใน src", files);
const sources = files.map((f) => ({ rel: path.relative(ROOT, f), text: fs.readFileSync(f, "utf-8") }));

// ── ก. ตัวนับของ bumpCounter ห้ามอ่านจาก KV ตรง ๆ ─────────────────────────────
const COUNTER_OWNERS = new Set(["src/lib/platform/kv-counter.ts"]);
const directReads = sources.filter(
  (s) => !COUNTER_OWNERS.has(s.rel) && /kvGetJSON[^;]{0,80}KEY\.aiCap\s*\(/.test(s.text),
);
check(
  "ไม่มีจุดไหนอ่านตัวนับโควตา AI ด้วย kvGetJSON ตรง ๆ (ต้องผ่าน readCounter/getAiUsageToday)",
  directReads.length === 0,
  directReads.map((s) => `   · ${s.rel}`).join("\n") +
    "\n   ➔ เปิด Upstash อยู่ ตัวนับอยู่ใน Redis — KV ว่างเสมอ หน้าแอดมินจะขึ้น 0",
);

// ── ข. ทุกชื่อเมตริกที่แผงอ่านต้องมีคนเขียน ───────────────────────────────────
const writers = sources.filter((s) => path.join(ROOT, s.rel) !== METRICS_FILE && !s.rel.startsWith("src/components/admin/"));
const esc = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const missingExact = Object.values(METRIC).filter(
  (m) => !writers.some((s) => new RegExp(`["'\`]${esc(m)}["'\`]`).test(s.text)),
);
check(
  `เมตริกชื่อเต็มทุกตัวที่แผงอ่าน (${Object.values(METRIC).length} ตัว) มีจุดบันทึกจริงใน src/`,
  missingExact.length === 0,
  missingExact.map((m) => `   · "${m}" — ไม่มีใครบันทึก การ์ดที่อ่านชื่อนี้จะขึ้น 0 ตลอด`).join("\n"),
);

const missingPrefix = Object.values(PREFIX).filter(
  (p) => !writers.some((s) => new RegExp(`["'\`]${esc(p)}`).test(s.text)),
);
check(
  `เมตริกแบบ prefix ทุกตัว (${Object.values(PREFIX).length} ตัว) มีจุดบันทึกจริงใน src/`,
  missingPrefix.length === 0,
  missingPrefix.map((p) => `   · "${p}…"`).join("\n"),
);

// ── ค. ตัวสรุปคำนวณถูก ────────────────────────────────────────────────────────
const s = summarize({
  reading_started: 10,
  reading_completed: 8,
  "ai_call:groq": 6,
  "ai_call:gemini": 2,
  "ai_schema_fail:groq": 1,
  "ai_schema_fail:qwen3-32b": 1, // คีย์รายโมเดลของเหตุการณ์เดียวกัน — ห้ามนับซ้ำ
  "ai_error:gemini": 2,
  ai_groq_failover: 3,
  ai_latency_ms: 16_000,
  "category:love": 5,
  "category:work": 7,
});
check("อัตราอ่านจบ = 80%", s.usage.completionPct === 80, `ได้ ${s.usage.completionPct}`);
check("รวมเรียก AI = 8 · Groq 75%", s.ai.calls === 8 && s.ai.groqPct === 75, JSON.stringify(s.ai));
check("schema fail นับเฉพาะคีย์ผู้ให้บริการ (ไม่นับคีย์รายโมเดลซ้ำ)", s.ai.schemaFails === 1, `ได้ ${s.ai.schemaFails}`);
check("failover อ่านจาก ai_groq_failover", s.ai.failover === 3, `ได้ ${s.ai.failover}`);
check("เวลาเฉลี่ย = 2000 ms", s.ai.avgLatencyMs === 2000, `ได้ ${s.ai.avgLatencyMs}`);
check("หมวดยอดนิยมเรียงมากไปน้อย", s.top.categories[0]?.key === "work", JSON.stringify(s.top.categories));
check("ตัวหาร 0 ➔ null (แสดง — ไม่ใช่ 0%)", pctOf(3, 0) === null && summarize({}).ai.avgLatencyMs === null);
check("ส่วนต่าง: 0 ➔ 5 ไม่มีเปอร์เซ็นต์ · 10 ➔ 15 = +50%", change(5, 0).pct === null && change(15, 10).pct === 50);

if (failed > 0) {
  console.error(`\n❌ ไม่ผ่าน ${failed} ข้อ`);
  process.exit(1);
}
console.log("\n✨ ผ่านครบ — ตัวเลขในแผงสถิติมาจากของจริงทุกตัว");
