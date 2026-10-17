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

import { buildExecutiveReport } from "../../src/lib/admin/executive-report";
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

// ── ง. แดชบอร์ดผู้บริหาร (executive-report.ts) ─────────────────────────────
console.log("\nง. แดชบอร์ดผู้บริหาร — แบ่งช่วง · รายได้จริง · สิ่งที่ต้องดู");
{
  const today = "2026-10-17";
  const daily = {
    // ช่วงนี้ (7 วัน: 11–17 ต.ค.)
    "2026-10-17": { reading_started: 30, reading_completed: 24, entitlement_blocked_start: 10, ai_cap_hit: 2, "ai_call:groq": 20 },
    "2026-10-11": { reading_started: 10, reading_completed: 6 },
    // ช่วงก่อน (4–10 ต.ค.)
    "2026-10-10": { reading_started: 20, reading_completed: 18 },
    // นอกทั้งสองช่วง — ห้ามถูกนับ
    "2026-10-03": { reading_started: 999 },
  };
  const r = buildExecutiveReport({
    days: 7,
    today,
    daily,
    d1: {
      payments: [
        { day: "2026-10-16", product: "packs", status: "paid", test: false, n: 2, satang: 29_800 },
        { day: "2026-10-16", product: "packs", status: "paid", test: true, n: 5, satang: 99_900 },
        { day: "2026-10-12", product: "consult", status: "paid", test: false, n: 1, satang: 29_900 },
        { day: "2026-10-12", product: "consult", status: "refunded", test: false, n: 1, satang: 29_900 },
        { day: "2026-10-05", product: "packs", status: "paid", test: false, n: 1, satang: 5_900 },
      ],
      signups: [{ day: "2026-10-15", n: 3 }],
      payers: { cur: 2, prev: 1 },
      members: { total: 50, active: 10, returning: 4 },
      refundDue: { count: 1, satang: 29_900 },
      pending: 0,
      feedback: null,
    },
    now: 0,
  });
  check("ช่วงนี้ = 11–17 ต.ค. · ช่วงก่อน = 4–10 ต.ค.", r.range.from === "2026-10-11" && r.prevRange.to === "2026-10-10", JSON.stringify([r.range, r.prevRange]));
  check("ตัวนับนอกช่วงไม่ถูกนับ (เริ่ม 40 / ช่วงก่อน 20)", r.kpi.started.cur === 40 && r.kpi.started.prev === 20, JSON.stringify(r.kpi.started));
  check("รายได้ตัดรายการทดสอบ = 298 + 299 บาท", r.kpi.netRevenueThb.cur === 597 && r.kpi.netRevenueThb.prev === 59, JSON.stringify(r.kpi.netRevenueThb));
  check("รายงานจำนวนรายการทดสอบที่ตัด", r.revenue.testExcluded === 5, `ได้ ${r.revenue.testExcluded}`);
  check("ชนโควตาไม่รวมเพดานงบ AI", r.kpi.quotaHits.cur === 10, `ได้ ${r.kpi.quotaHits.cur}`);
  check("ซื้อแพ็กต่อการชนโควตา = 20%", r.kpi.quotaToPurchasePct.cur === 20, `ได้ ${r.kpi.quotaToPurchasePct.cur}`);
  check("ชุดรายวันยาว 7 วัน เรียงเก่าไปใหม่", r.series.length === 7 && r.series[0].day === "2026-10-11" && r.series[6].started === 30);
  check("สิ่งที่ต้องดู: เงินต้องคืนขึ้นเป็นเรื่องด่วนอันดับแรก", r.insights[0]?.level === "alert" && r.insights[0].title.includes("ต้องคืน"), JSON.stringify(r.insights[0]));
  check("สิ่งที่ต้องดู: เตือนชนเพดานงบ AI", r.insights.some((i) => i.title.includes("เพดานงบ AI")));
  const none = buildExecutiveReport({ days: 7, today, daily: {}, d1: { payments: null, signups: null, payers: null, members: null, refundDue: null, pending: null, feedback: null } });
  check("อ่าน D1 ไม่ได้ ➔ ช่วงก่อนเป็น null (ไม่ใช่ 0)", none.kpi.netRevenueThb.prev === null && none.kpi.signups === null && !none.revenue.available);
}

if (failed > 0) {
  console.error(`\n❌ ไม่ผ่าน ${failed} ข้อ`);
  process.exit(1);
}
console.log("\n✨ ผ่านครบ — ตัวเลขในแผงสถิติมาจากของจริงทุกตัว");
