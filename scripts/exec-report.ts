/**
 * scripts/exec-report.ts
 *
 * ดึงรายงานผู้บริหารตัวจริงจาก production แบบอ่านอย่างเดียว — ให้ผู้ช่วย `cmo` · `coo` · `cto`
 * ตอบจากตัวเลขจริงได้เอง ไม่ต้องรอเจ้าของส่งภาพหรือ CSV จากหน้าแอดมิน
 *
 * คำสั่ง:
 *   npm run exec:report                  สรุปช่วง 28 วัน เทียบช่วงก่อนหน้า (ข้อความอ่านง่าย)
 *   npm run exec:report -- --days 7      ช่วง 7 / 28 / 90 วัน
 *   npm run exec:report -- --json out.json   เก็บผลดิบทั้งก้อนลงไฟล์ด้วย
 *
 * ต้องมี env:
 *   ADMIN_REPORT_TOKEN       รหัสอ่านรายงาน (ตัวเดียวกับ secret บน Cloudflare · ยาว ≥ 32 ตัว)
 *   EXEC_REPORT_BASE_URL     (ไม่บังคับ) ค่าเริ่ม https://seertarot.net (ดู DEFAULT_BASE) — ใช้ http://localhost:3000 ตอนทดสอบในเครื่อง
 *
 * ⚠️ ขอบเขตของรหัสนี้: อ่านได้แค่ `GET /api/admin/executive` กับ `GET /api/admin/nav-badges`
 *    ซึ่งมีแต่ตัวเลขรวม ไม่มีอีเมล ชื่อ หรือรหัสผู้ใช้ · เขียนอะไรไม่ได้เลย (`requireAdminOrReportToken`)
 * ⚠️ ห้ามพิมพ์ค่ารหัสออกจอหรือใส่ลงไฟล์ผล
 */

import { writeFileSync } from "node:fs";

import type { ExecutiveReport, Pair } from "../src/lib/admin/executive-report";
import type { NavBadges } from "../src/lib/admin/executive-data";
import type { StripeAdminSummary } from "../src/lib/marketplace/payment-gateway";

const TIMEOUT_MS = 45_000;
/**
 * ⚠️ ยิงเข้าโดเมนหลัก ไม่ใช่ `*.workers.dev` — ตั้งแต่ 2026-10-19 (A10-07 · #706) `/api/*` บนโฮสต์ workers.dev
 *    ถูกส่งกลับโดเมนหลักด้วย 307 (ยกเว้น `/api/cron/*`) ให้ทุกคำขอผ่านกฎ WAF/เพดานถี่ของโซน · ห้ามเพิ่มข้อยกเว้นให้เส้นรายงาน
 *    วัดจริง 2026-10-20: container ของ Claude Code ยิง seertarot.net/api/admin/nav-badges ได้ตรง ไม่โดน challenge
 *    ตั้ง User-Agent เองเพราะกฎ WAF ของโซนบล็อก UA ของเครื่องมือ (curl ฯลฯ) ที่ /api/
 *    ถ้าวันหนึ่งได้หน้า "Just a moment..." (403) แปลว่า Bot Fight Mode เริ่มท้าทาย IP ของ container — ต้องตั้งกฎข้ามบน Cloudflare (เจ้าของ)
 */
const DEFAULT_BASE = "https://seertarot.net";
const RANGES = [7, 28, 90] as const;

type Report = ExecutiveReport & { stripe: StripeAdminSummary };

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function fail(msg: string): never {
  console.error(`\n[exec:report] ${msg}\n`);
  process.exit(1);
}

async function getJson<T>(base: string, path: string, token: string): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { authorization: `Bearer ${token}`, accept: "application/json", "user-agent": "SeerTarot-ExecReport/1.0" },
      signal: ctrl.signal,
    });
    const body = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
    if (!res.ok) fail(`${path} ตอบ ${res.status}: ${body?.error ?? "ไม่มีข้อความ"}`);
    if (!body) fail(`${path} ตอบไม่ใช่ JSON`);
    return body;
  } catch (err) {
    if ((err as Error).name === "AbortError") fail(`${path} ไม่ตอบภายใน ${TIMEOUT_MS / 1000} วินาที`);
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

const n = (v: number | null | undefined, unit = "") => (v == null ? "ไม่มีข้อมูล" : `${v.toLocaleString("th-TH")}${unit}`);

/** "12 (ช่วงก่อน 10 · +20%)" — ไม่มีช่วงก่อน = บอกตรง ๆ */
function cmp(p: Pair<number | null> | null | undefined, unit = ""): string {
  if (!p || p.cur == null) return "ไม่มีข้อมูล";
  if (p.prev == null) return `${n(p.cur, unit)} (ไม่มีตัวเทียบช่วงก่อน)`;
  const diff = p.cur - p.prev;
  const pct = p.prev === 0 ? null : Math.round((diff / p.prev) * 100);
  const change = diff === 0 ? "เท่าเดิม" : `${diff > 0 ? "+" : ""}${pct == null ? n(diff, unit) : `${pct}%`}`;
  return `${n(p.cur, unit)} (ช่วงก่อน ${n(p.prev, unit)} · ${change})`;
}

function ratio(a: number, b: number): string {
  return b > 0 ? (a / b).toFixed(2) : "ไม่มีข้อมูล";
}

function render(r: Report, b: NavBadges): string {
  const k = r.kpi;
  const o = r.ops;
  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# รายงานผู้บริหาร SeerTarot · ${r.days} วัน`);
  push(`ช่วงนี้ ${r.range.from} ถึง ${r.range.to} · เทียบ ${r.prevRange.from} ถึง ${r.prevRange.to} (วัน UTC ตัดรอบ 07:00 น. เวลาไทย)`);
  push(`ดึงเมื่อ ${new Date(r.generatedAt).toISOString()}`);
  push();
  push("## เรื่องด่วน (ควรเป็น 0)");
  push(`- เงินที่ต้องคืนลูกค้า: ${b.refundDue == null ? "อ่านไม่ได้" : `${b.refundDue} รายการ`}${r.revenue.refundDue ? ` · ${n(r.revenue.refundDue.thb, " บาท")}` : ""}`);
  push(`- จ่ายเงินแล้วให้สิทธิ์ไม่สำเร็จ: ${cmp(o.purchaseGrantFailed)}`);
  push(`- ชนเพดานงบ AI: ${cmp(o.aiCapHit)}`);
  push(`- แม่หมอรอตรวจใบสมัคร: ${n(b.pendingReaders)} · ความเห็นใหม่ 7 วัน: ${n(b.newFeedback)}`);
  push(`- Stripe: ${b.stripeMode === "live" ? "เงินจริง" : b.stripeMode === "test" ? "โหมดทดสอบ (ยังไม่ใช่เงินจริง)" : "ยังไม่ได้ตั้งค่า"}`);
  push();
  push("## รายได้ (เงินจริงเท่านั้น)");
  push(`- รายได้สุทธิ: ${cmp(k.netRevenueThb, " บาท")}`);
  push(`- คำสั่งซื้อที่จ่ายแล้ว: ${cmp(k.paidOrders)} · ผู้จ่าย: ${cmp(k.payers)}`);
  for (const p of r.revenue.byProduct) push(`  - ${p.label}: ${cmp(p.thb, " บาท")} · ${n(p.orders.cur)} คำสั่ง`);
  push(`- คืนเงินไปแล้ว: ${cmp(r.revenue.refundedThb, " บาท")} · ตัดรายการทดสอบออก ${n(r.revenue.testExcluded)} รายการ`);
  if (r.stripe?.configured) {
    const s = r.stripe;
    if (s.balance) push(`- ยอดใน Stripe: พร้อมโอน ${n(s.balance.availableThb, " บาท")} · รอเคลียร์ ${n(s.balance.pendingThb, " บาท")}`);
    if (s.period)
      push(`- Stripe ช่วงนี้: รับ ${n(s.period.grossThb, " บาท")} · ค่าธรรมเนียม ${n(s.period.feeThb, " บาท")} · สุทธิ ${n(s.period.netThb, " บาท")} · ข้อพิพาท ${s.period.disputes}${s.period.truncated ? " (ข้อมูลไม่ครบ เกิน 1,000 รายการ)" : ""}`);
    if (s.error) push(`- Stripe เตือน: ${s.error}`);
  }
  push();
  push("## การใช้งาน (การตลาด)");
  push(`- เริ่มเปิดไพ่: ${cmp(k.started)} · อ่านจบ: ${cmp(k.completed)} · อัตราอ่านจบ: ${cmp(k.completionPct, "%")}`);
  push(`- สมาชิกใหม่: ${cmp(k.signups)} · เช็กอินรายวัน: ${cmp(k.dailyCheckin)} · แชตถามต่อ: ${cmp(k.chat)}`);
  push(`- ชนโควตาฟรี: ${cmp(k.quotaHits)} · ซื้อแพ็ก: ${cmp(k.packOrders)} · ซื้อต่อการชนโควตา: ${cmp(k.quotaToPurchasePct, "%")}`);
  if (r.members) push(`- สมาชิกทั้งหมด ${n(r.members.total)} · ใช้งานในช่วงนี้ ${n(r.members.active)} · กลับมาใช้ ${n(r.members.returning)} (ไม่มีตัวเทียบช่วงก่อน)`);
  push(`- ความเห็นจากผู้ใช้: ${cmp(k.feedbackCount)} · คะแนนเฉลี่ย: ${cmp(k.feedbackAvg)}`);
  if (r.top.categories.length) push(`- หมวดคำถามยอดนิยม: ${r.top.categories.slice(0, 5).map((c) => `${c.key} ${c.count}`).join(" · ")}`);
  if (r.top.spreads.length) push(`- ผังยอดนิยม: ${r.top.spreads.slice(0, 5).map((c) => `${c.key} ${c.count}`).join(" · ")}`);
  push();
  push("## ระบบและ AI (การดำเนินงาน)");
  push(`- เรียก AI: ${cmp(o.aiCalls)} · ต่อการอ่านจบ 1 ครั้ง: ${ratio(o.aiCalls.cur, k.completed.cur)} (ช่วงก่อน ${o.aiCalls.prev != null && k.completed.prev != null ? ratio(o.aiCalls.prev, k.completed.prev) : "ไม่มีข้อมูล"})`);
  push(`- เวลาตอบเฉลี่ย: ${cmp(o.avgLatencyMs, " ms")} · สลับไปผู้ให้บริการสำรอง: ${cmp(o.failoverPct, "%")} · AI ผิดพลาด: ${cmp(o.aiErrors)}`);
  push(`- เปิดไพ่ล้ม: ${cmp(o.readingFailed)} · ต่อการเริ่ม: ${ratio(o.readingFailed.cur, k.started.cur)} · ชำระเงินล้ม: ${cmp(o.checkoutFailed)}`);
  push(`- กั้นด้วยระบบความปลอดภัย: ${cmp(o.safetyBlocked)} · ตอบด้วยคำอ่านสำรอง: ${cmp(o.mockServed)}`);
  push();
  push("## สิ่งที่ต้องดู (ระบบสรุปด้วยกฎตายตัว)");
  if (!r.insights.length) push("- ไม่มี");
  const LEVEL = { alert: "ด่วน", watch: "จับตา", good: "ดี", info: "แจ้งให้ทราบ" } as const;
  for (const i of r.insights) push(`- [${LEVEL[i.level]}] (${i.owner}) ${i.title} — ${i.detail}`);
  return lines.join("\n");
}

async function main() {
  const token = (process.env.ADMIN_REPORT_TOKEN ?? "").trim();
  if (token.length < 32) {
    fail("ยังไม่มี ADMIN_REPORT_TOKEN (อย่างน้อย 32 ตัวอักษร) — ดูวิธีตั้งใน docs/PENDING_SETUP.md หัวข้อรหัสอ่านรายงานผู้บริหาร");
  }
  const base = (process.env.EXEC_REPORT_BASE_URL || DEFAULT_BASE).replace(/\/+$/, "");
  const daysArg = Number(arg("days") ?? 28);
  if (!(RANGES as readonly number[]).includes(daysArg)) fail(`--days ต้องเป็น ${RANGES.join(" / ")}`);

  const [exec, nav] = await Promise.all([
    getJson<{ ok: boolean; report: Report }>(base, `/api/admin/executive?days=${daysArg}`, token),
    getJson<{ ok: boolean; badges: NavBadges }>(base, "/api/admin/nav-badges", token),
  ]);

  const out = arg("json");
  if (out) {
    writeFileSync(out, JSON.stringify({ source: base, report: exec.report, badges: nav.badges }, null, 2));
    console.error(`[exec:report] เก็บผลดิบที่ ${out}`);
  }
  console.log(render(exec.report, nav.badges));
}

main().catch((err) => fail(`ดึงรายงานไม่สำเร็จ: ${(err as Error).message}`));
