/**
 * 📈 รายงานผู้บริหาร (แท็บ "แดชบอร์ดผู้บริหาร" ในแผงแอดมิน) — ส่วนคำนวณล้วน
 * ---------------------------------------------------------------------------
 * แยกจากส่วนอ่าน D1/KV (`executive-data.ts`) เพื่อให้ทดสอบได้โดยไม่ต้องมีฐานข้อมูล
 * และให้ฝั่งหน้าจอ import ชนิดข้อมูลได้โดยไม่ลาก D1 เข้าบันเดิล
 *
 * หลักที่ยึด:
 * - ทุกตัวเลขมีคู่เทียบ "ช่วงก่อนหน้า" ยาวเท่ากัน · ตัวเลขที่เทียบไม่ได้จริงให้ `prev = null` ไม่ใช่ 0
 * - รายได้นับเฉพาะเงินจริง — ตัด `simulator` และ Stripe โหมดทดสอบ (`cs_test_`) ออก แล้วรายงานจำนวนที่ตัดไว้
 * - "ชนโควตา" = ผู้ใช้ถูกกั้นสิทธิ์ทุกแบบ ยกเว้นเพดานงบ AI ของระบบ (`ai_cap_hit` ไม่ใช่ความต้องการซื้อ)
 * - นับเป็นจำนวนครั้ง (อีเวนต์) ไม่ใช่จำนวนคน — ตัวเลขอัตราจึงเป็นทิศทาง
 */

import { change, pctOf, summarize, type Counters, type CountRow } from "@/lib/stats/admin-metrics";

export const EXECUTIVE_RANGES = [7, 28, 90] as const;
export type ExecutiveRange = (typeof EXECUTIVE_RANGES)[number];

export interface Pair<T = number> {
  cur: T;
  /** ช่วงก่อนหน้า · `null` = เทียบไม่ได้ (ไม่มีข้อมูลหรือไม่มีความหมาย) */
  prev: T | null;
}

export type Product = "packs" | "consult" | "studio";

export const PRODUCT_NAME: Record<Product, string> = {
  packs: "แพ็กเติมรอบ",
  consult: "ปรึกษาแม่หมอ",
  studio: "AI ช่วยเขียน (แม่หมอ)",
};

export interface DailyPoint {
  day: string;
  started: number;
  completed: number;
  quotaHits: number;
  signups: number;
  revenueThb: number;
  aiCalls: number;
  failed: number;
}

export type InsightLevel = "alert" | "watch" | "good" | "info";

export interface Insight {
  level: InsightLevel;
  owner: "cmo" | "coo";
  title: string;
  detail: string;
}

/** แถวการจ่ายเงินที่รวมกลุ่มมาแล้วจาก D1 (หนึ่งแถวต่อ วัน × สินค้า × สถานะ × จริง/ทดสอบ) */
export interface PaymentGroupRow {
  day: string;
  product: Product;
  status: string;
  test: boolean;
  n: number;
  satang: number;
}

export interface ExecutiveD1Input {
  payments: PaymentGroupRow[] | null;
  signups: { day: string; n: number }[] | null;
  payers: Pair | null;
  members: { total: number; active: number; returning: number } | null;
  refundDue: { count: number; satang: number } | null;
  pending: number | null;
  feedback: { cur: { n: number; avg: number | null }; prev: { n: number; avg: number | null } } | null;
}

export interface ExecutiveReport {
  days: number;
  range: { from: string; to: string };
  prevRange: { from: string; to: string };
  generatedAt: number;
  kpi: {
    netRevenueThb: Pair;
    paidOrders: Pair;
    started: Pair;
    completed: Pair;
    completionPct: Pair<number | null>;
    signups: Pair | null;
    quotaHits: Pair;
    packOrders: Pair;
    quotaToPurchasePct: Pair<number | null>;
    payers: Pair | null;
    dailyCheckin: Pair;
    chat: Pair;
    feedbackCount: Pair | null;
    feedbackAvg: Pair<number | null> | null;
  };
  revenue: {
    byProduct: { product: Product; label: string; thb: Pair; orders: Pair }[];
    refundedThb: Pair;
    refundDue: { count: number; thb: number } | null;
    pending: number | null;
    testExcluded: number;
    available: boolean;
  };
  members: { total: number; active: number; returning: number } | null;
  ops: {
    aiCalls: Pair;
    avgLatencyMs: Pair<number | null>;
    failoverPct: Pair<number | null>;
    aiErrors: Pair;
    tokens: Pair;
    aiCapHit: Pair;
    readingFailed: Pair;
    checkoutFailed: Pair;
    purchaseGrantFailed: Pair;
    safetyBlocked: Pair;
    mockServed: Pair;
  };
  top: { categories: CountRow[]; spreads: CountRow[] };
  series: DailyPoint[];
  insights: Insight[];
}

const DAY_MS = 86_400_000;

/** คีย์วัน UTC `YYYY-MM-DD` ย้อนจาก `today` ไป `offset` วัน */
export function shiftDay(day: string, offset: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + offset * DAY_MS).toISOString().slice(0, 10);
}

/** รายการวันเรียงจากเก่าไปใหม่ `count` วัน จบที่ `last` */
export function dayList(last: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => shiftDay(last, i - count + 1));
}

/** ช่วงเวลา [เริ่ม, จบ) เป็นมิลลิวินาที ของช่วงวันปัจจุบันและช่วงก่อนหน้า */
export function rangeBounds(today: string, days: number) {
  const curFrom = shiftDay(today, -(days - 1));
  const prevFrom = shiftDay(curFrom, -days);
  return {
    curFrom,
    prevFrom,
    prevTo: shiftDay(curFrom, -1),
    curStartMs: Date.parse(`${curFrom}T00:00:00Z`),
    prevStartMs: Date.parse(`${prevFrom}T00:00:00Z`),
    endMs: Date.parse(`${today}T00:00:00Z`) + DAY_MS,
  };
}

function addInto(target: Counters, src: Counters | undefined) {
  if (!src) return;
  for (const [k, v] of Object.entries(src)) target[k] = (target[k] ?? 0) + v;
}

const quotaHitsOf = (s: ReturnType<typeof summarize>) => s.gating.total - s.gating.aiCapHit;
const roundThb = (satang: number) => Math.round(satang) / 100;

function pair(cur: number, prev: number | null): Pair {
  return { cur, prev };
}

/**
 * ประกอบรายงานจากตัวนับรายวัน (ครบ 2 ช่วง) + ข้อมูล D1
 * @param daily ตัวนับรายวันอย่างน้อย `days * 2` วันล่าสุด (คีย์ = วัน UTC)
 */
export function buildExecutiveReport(args: {
  days: number;
  today: string;
  daily: Record<string, Counters>;
  d1: ExecutiveD1Input;
  now?: number;
}): ExecutiveReport {
  const { days, today, daily, d1 } = args;
  const b = rangeBounds(today, days);
  const curDays = dayList(today, days);
  const prevDays = dayList(b.prevTo, days);

  const curDoc: Counters = {};
  const prevDoc: Counters = {};
  curDays.forEach((d) => addInto(curDoc, daily[d]));
  prevDays.forEach((d) => addInto(prevDoc, daily[d]));
  const cur = summarize(curDoc);
  const prev = summarize(prevDoc);

  // ── การจ่ายเงิน ──────────────────────────────────────────────
  const inCur = (day: string) => day >= b.curFrom && day <= today;
  const inPrev = (day: string) => day >= b.prevFrom && day <= b.prevTo;
  const payments = d1.payments ?? [];
  const real = payments.filter((r) => !r.test);
  const sum = (rows: PaymentGroupRow[], pick: (r: PaymentGroupRow) => number) => rows.reduce((s, r) => s + pick(r), 0);
  const paidIn = (period: (d: string) => boolean, product?: Product) =>
    real.filter((r) => r.status === "paid" && period(r.day) && (!product || r.product === product));
  const refundedIn = (period: (d: string) => boolean) => real.filter((r) => r.status === "refunded" && period(r.day));
  const payAvail = d1.payments !== null;
  const payPrev = (v: number) => (payAvail ? v : null);

  const byProduct = (Object.keys(PRODUCT_NAME) as Product[]).map((product) => ({
    product,
    label: PRODUCT_NAME[product],
    thb: pair(roundThb(sum(paidIn(inCur, product), (r) => r.satang)), payPrev(roundThb(sum(paidIn(inPrev, product), (r) => r.satang)))),
    orders: pair(sum(paidIn(inCur, product), (r) => r.n), payPrev(sum(paidIn(inPrev, product), (r) => r.n))),
  }));

  const netCur = roundThb(sum(paidIn(inCur), (r) => r.satang));
  const netPrev = roundThb(sum(paidIn(inPrev), (r) => r.satang));
  const packCur = sum(paidIn(inCur, "packs"), (r) => r.n);
  const packPrev = sum(paidIn(inPrev, "packs"), (r) => r.n);
  const quotaCur = quotaHitsOf(cur);
  const quotaPrev = quotaHitsOf(prev);

  // ── ชุดข้อมูลรายวัน ──────────────────────────────────────────
  const signupByDay = new Map((d1.signups ?? []).map((r) => [r.day, r.n]));
  const revenueByDay = new Map<string, number>();
  for (const r of paidIn(inCur)) revenueByDay.set(r.day, (revenueByDay.get(r.day) ?? 0) + r.satang);
  const series: DailyPoint[] = curDays.map((day) => {
    const s = summarize(daily[day]);
    return {
      day,
      started: s.usage.started,
      completed: s.usage.completed,
      quotaHits: quotaHitsOf(s),
      signups: signupByDay.get(day) ?? 0,
      revenueThb: roundThb(revenueByDay.get(day) ?? 0),
      aiCalls: s.ai.calls,
      failed: s.usage.failed,
    };
  });

  const signupsAvail = d1.signups !== null;
  const signupsIn = (period: (d: string) => boolean) => (d1.signups ?? []).filter((r) => period(r.day)).reduce((s, r) => s + r.n, 0);

  const kpi: ExecutiveReport["kpi"] = {
    netRevenueThb: pair(netCur, payPrev(netPrev)),
    paidOrders: pair(sum(paidIn(inCur), (r) => r.n), payPrev(sum(paidIn(inPrev), (r) => r.n))),
    started: pair(cur.usage.started, prev.usage.started),
    completed: pair(cur.usage.completed, prev.usage.completed),
    completionPct: { cur: cur.usage.completionPct, prev: prev.usage.completionPct },
    signups: signupsAvail ? pair(signupsIn(inCur), signupsIn(inPrev)) : null,
    quotaHits: pair(quotaCur, quotaPrev),
    packOrders: pair(packCur, payPrev(packPrev)),
    quotaToPurchasePct: { cur: pctOf(packCur, quotaCur), prev: payAvail ? pctOf(packPrev, quotaPrev) : null },
    payers: d1.payers,
    dailyCheckin: pair(cur.usage.dailyCheckin, prev.usage.dailyCheckin),
    chat: pair(cur.usage.chat, prev.usage.chat),
    feedbackCount: d1.feedback ? pair(d1.feedback.cur.n, d1.feedback.prev.n) : null,
    feedbackAvg: d1.feedback ? { cur: d1.feedback.cur.avg, prev: d1.feedback.prev.avg } : null,
  };

  const ops: ExecutiveReport["ops"] = {
    aiCalls: pair(cur.ai.calls, prev.ai.calls),
    avgLatencyMs: { cur: cur.ai.avgLatencyMs, prev: prev.ai.avgLatencyMs },
    failoverPct: { cur: pctOf(cur.ai.failover, cur.ai.calls), prev: pctOf(prev.ai.failover, prev.ai.calls) },
    aiErrors: pair(cur.ai.errors, prev.ai.errors),
    tokens: pair(cur.ai.tokensIn + cur.ai.tokensOut, prev.ai.tokensIn + prev.ai.tokensOut),
    aiCapHit: pair(cur.gating.aiCapHit, prev.gating.aiCapHit),
    readingFailed: pair(cur.usage.failed, prev.usage.failed),
    checkoutFailed: pair(cur.business.checkoutFailed, prev.business.checkoutFailed),
    purchaseGrantFailed: pair(cur.business.purchaseGrantFailed, prev.business.purchaseGrantFailed),
    safetyBlocked: pair(cur.safety.total, prev.safety.total),
    mockServed: pair(cur.ai.mockServed, prev.ai.mockServed),
  };

  const revenue: ExecutiveReport["revenue"] = {
    byProduct,
    refundedThb: pair(roundThb(sum(refundedIn(inCur), (r) => r.satang)), payPrev(roundThb(sum(refundedIn(inPrev), (r) => r.satang)))),
    refundDue: d1.refundDue ? { count: d1.refundDue.count, thb: roundThb(d1.refundDue.satang) } : null,
    pending: d1.pending,
    testExcluded: sum(
      payments.filter((r) => r.test && (inCur(r.day) || inPrev(r.day))),
      (r) => r.n,
    ),
    available: payAvail,
  };

  return {
    days,
    range: { from: b.curFrom, to: today },
    prevRange: { from: b.prevFrom, to: b.prevTo },
    generatedAt: args.now ?? Date.now(),
    kpi,
    revenue,
    members: d1.members,
    ops,
    top: { categories: cur.top.categories, spreads: cur.top.spreads },
    series,
    insights: buildInsights(kpi, ops, revenue),
  };
}

const fmtN = (n: number) => n.toLocaleString("th-TH");

/** เปอร์เซ็นต์เปลี่ยน — ฐานต่ำกว่า `minBase` ถือว่าน้อยเกินจะสรุป (`null`) */
function pctChange(p: Pair, minBase: number): number | null {
  if (p.prev == null || p.prev < minBase) return null;
  return change(p.cur, p.prev).pct;
}

const LEVEL_ORDER: Record<InsightLevel, number> = { alert: 0, watch: 1, good: 2, info: 3 };

/**
 * "สิ่งที่ต้องดู" — กฎตายตัว อ่านจากตัวเลขเท่านั้น (ไม่ใช้ AI · กฎ "ไม่ใช้ AI ในที่ที่คำนวณได้")
 * เรียงจากเรื่องเร่งด่วนไปเรื่องดี · ไม่เกิน 6 ข้อ
 */
export function buildInsights(
  kpi: ExecutiveReport["kpi"],
  ops: ExecutiveReport["ops"],
  revenue: ExecutiveReport["revenue"],
): Insight[] {
  const out: Insight[] = [];

  if (revenue.refundDue && revenue.refundDue.count > 0) {
    out.push({
      level: "alert",
      owner: "coo",
      title: `มีเงินต้องคืนลูกค้า ${fmtN(revenue.refundDue.count)} รายการ`,
      detail: `รวม ${fmtN(revenue.refundDue.thb)} บาท · ดูที่แท็บ "การจอง & การเงิน"`,
    });
  }

  const payFails = ops.checkoutFailed.cur + ops.purchaseGrantFailed.cur;
  if (payFails > 0) {
    out.push({
      level: "alert",
      owner: "coo",
      title: `ขั้นจ่ายเงินล้มเหลว ${fmtN(payFails)} ครั้ง`,
      detail: `เปิดหน้าจ่ายไม่สำเร็จ ${fmtN(ops.checkoutFailed.cur)} · จ่ายแล้วแต่ให้สิทธิ์ไม่สำเร็จ ${fmtN(ops.purchaseGrantFailed.cur)} — ส่งให้ทีมเทคนิคตรวจ`,
    });
  }

  const failRate = pctOf(ops.readingFailed.cur, kpi.started.cur);
  if (failRate != null && failRate >= 5 && kpi.started.cur >= 20) {
    out.push({
      level: "alert",
      owner: "coo",
      title: `เปิดไพ่ไม่สำเร็จ ${failRate}% ของครั้งที่เริ่ม`,
      detail: `${fmtN(ops.readingFailed.cur)} จาก ${fmtN(kpi.started.cur)} ครั้ง · ดูแท็บ "สุขภาพระบบ & AI"`,
    });
  }

  if (ops.aiCapHit.cur > 0) {
    out.push({
      level: "watch",
      owner: "coo",
      title: `ชนเพดานงบ AI ${fmtN(ops.aiCapHit.cur)} ครั้ง`,
      detail: "ผู้ใช้บางคนเปิดไพ่ไม่ได้เพราะงบ AI ของวันหมด — พิจารณาปรับเพดานหรือดูว่ามีการใช้ผิดปกติ",
    });
  }

  if (ops.failoverPct.cur != null && ops.failoverPct.cur >= 30 && ops.aiCalls.cur >= 20) {
    out.push({
      level: "watch",
      owner: "coo",
      title: `AI ตัวหลักล้มบ่อย สลับไปตัวสำรอง ${ops.failoverPct.cur}%`,
      detail: "คำอ่านยังออกได้ แต่ช้าลงและต้นทุนอาจสูงขึ้น",
    });
  }

  const cp = kpi.completionPct;
  if (cp.cur != null && cp.prev != null && kpi.started.cur >= 20) {
    const diff = cp.cur - cp.prev;
    if (diff <= -5) {
      out.push({
        level: "watch",
        owner: "cmo",
        title: `อัตราอ่านจบลดจาก ${cp.prev}% เหลือ ${cp.cur}%`,
        detail: "คนเริ่มเปิดไพ่แต่ไม่อ่านจนจบมากขึ้น — ดูว่าช้า ติดโควตา หรือหน้าจอมีปัญหา",
      });
    } else if (diff >= 5) {
      out.push({
        level: "good",
        owner: "cmo",
        title: `อัตราอ่านจบเพิ่มจาก ${cp.prev}% เป็น ${cp.cur}%`,
        detail: "สิ่งที่เปลี่ยนในช่วงนี้ได้ผล",
      });
    }
  }

  const startedPct = pctChange(kpi.started, 20);
  if (startedPct != null && Math.abs(startedPct) >= 20) {
    out.push({
      level: startedPct > 0 ? "good" : "watch",
      owner: "cmo",
      title: `คนเปิดไพ่${startedPct > 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(startedPct)}%`,
      detail: `${fmtN(kpi.started.prev ?? 0)} เป็น ${fmtN(kpi.started.cur)} ครั้ง เทียบช่วงก่อนหน้า`,
    });
  }

  if (revenue.available && kpi.quotaHits.cur >= 10 && kpi.packOrders.cur === 0) {
    out.push({
      level: "watch",
      owner: "cmo",
      title: `ชนโควตาฟรี ${fmtN(kpi.quotaHits.cur)} ครั้ง แต่ยังไม่มีใครซื้อแพ็ก`,
      detail: "มีคนอยากใช้ต่อแต่ไม่ซื้อ — ทบทวนข้อความ ราคา หรือจังหวะที่เสนอขาย",
    });
  }

  const revPct = pctChange(kpi.netRevenueThb, 500);
  if (revPct != null && Math.abs(revPct) >= 20) {
    out.push({
      level: revPct > 0 ? "good" : "watch",
      owner: "coo",
      title: `รายได้${revPct > 0 ? "เพิ่มขึ้น" : "ลดลง"} ${Math.abs(revPct)}%`,
      detail: `${fmtN(kpi.netRevenueThb.prev ?? 0)} เป็น ${fmtN(kpi.netRevenueThb.cur)} บาท`,
    });
  }

  if (out.length === 0) {
    out.push({
      level: "info",
      owner: "coo",
      title: "ไม่พบเรื่องผิดปกติในช่วงนี้",
      detail: "ตัวเลขหลักอยู่ในเกณฑ์ปกติ หรือยังน้อยเกินกว่าจะสรุป",
    });
  }

  return out.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]).slice(0, 6);
}
