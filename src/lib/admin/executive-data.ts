/**
 * 📈 รายงานผู้บริหาร — ส่วนอ่านข้อมูล (D1 + ตัวนับรายวัน) แล้วส่งให้ `buildExecutiveReport()`
 * ---------------------------------------------------------------------------
 * แต่ละคำถาม D1 แยก try ของตัวเอง: ตารางไหนอ่านไม่ได้ = `null` (หน้าจอขึ้น "อ่านไม่ได้")
 * ไม่ใช่ 0 — สำหรับหน้าจอผู้บริหาร "ไม่มีข้อมูล" กับ "ยอดเป็นศูนย์" ต้องแยกกันให้ออก
 *
 * PDPA: คืนแค่ยอดรวม ไม่มีอีเมล ชื่อ หรือรหัสผู้ใช้ออกจากไฟล์นี้
 */

import { getStripeAdminSummary, stripeKeyMode, type StripeAdminSummary } from "@/lib/marketplace/payment-gateway";
import { getAppDB } from "@/lib/platform/db";
import { getStats } from "@/lib/stats/read";
import { utcDay } from "@/lib/stats/record";
import { STUDIO_PASS_ORDER_PREFIX } from "@/lib/studio/plan";

import {
  buildExecutiveReport,
  rangeBounds,
  type ExecutiveD1Input,
  type ExecutiveReport,
  type PaymentGroupRow,
  type Product,
} from "./executive-report";

/** วัน UTC ของแถวที่เก็บเวลาเป็น epoch ms — ตัดรอบเดียวกับตัวนับสถิติ */
const DAY_SQL = "strftime('%Y-%m-%d', created_at / 1000, 'unixepoch')";

async function safe<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function readD1(today: string, days: number): Promise<ExecutiveD1Input> {
  const empty: ExecutiveD1Input = {
    payments: null,
    signups: null,
    payers: null,
    members: null,
    refundDue: null,
    pending: null,
    feedback: null,
  };
  const db = await safe(() => getAppDB());
  if (!db) return empty;
  const b = rangeBounds(today, days);

  const payments = await safe(async () => {
    // เติมเครดิต = `ord_` · AI ช่วยเขียนของแม่หมอ = `stp_` · ที่เหลือคือค่าปรึกษาแม่หมอ
    // ทดสอบ = ตัวจำลอง (`simulator`) หรือ Stripe โหมดทดสอบ (`cs_test_`) — ไม่ใช่เงินจริง
    // การจองฟรี (`comp` · free-consult.ts) ไม่ใช่ยอดขาย จึงไม่นับเป็นคำสั่งซื้อเลย
    const { results } = await db
      .prepare(
        `SELECT ${DAY_SQL} AS day,
                CASE WHEN order_id LIKE 'ord\\_%' ESCAPE '\\' THEN 'packs'
                     WHEN order_id LIKE ? ESCAPE '\\' THEN 'studio'
                     ELSE 'consult' END AS product,
                status,
                CASE WHEN provider = 'simulator' OR provider_ref LIKE 'cs\\_test\\_%' ESCAPE '\\' THEN 1 ELSE 0 END AS test,
                COUNT(*) AS n,
                COALESCE(SUM(amount_satang), 0) AS satang
           FROM payments
          WHERE created_at >= ? AND created_at < ? AND status IN ('paid', 'refunded') AND provider != 'comp'
          GROUP BY day, product, status, test`,
      )
      .bind(`${STUDIO_PASS_ORDER_PREFIX.replace(/_/g, "\\_")}%`, b.prevStartMs, b.endMs)
      .all<{ day: string; product: Product; status: string; test: number; n: number; satang: number }>();
    return (results ?? []).map<PaymentGroupRow>((r) => ({
      day: r.day,
      product: r.product,
      status: r.status,
      test: Number(r.test) === 1,
      n: Number(r.n),
      satang: Number(r.satang),
    }));
  });

  // การจองฟรี (`comp` · free-consult.ts) ไม่ใช่การขาย — ไม่นับเป็นผู้จ่ายเงิน
  const realOnly = "provider NOT IN ('simulator', 'comp') AND (provider_ref IS NULL OR provider_ref NOT LIKE 'cs\\_test\\_%' ESCAPE '\\')";

  const [signups, payersCur, payersPrev, members, refundDue, pending, fbCur, fbPrev] = await Promise.all([
    safe(async () => {
      const { results } = await db
        .prepare(`SELECT ${DAY_SQL} AS day, COUNT(*) AS n FROM users WHERE created_at >= ? AND created_at < ? GROUP BY day`)
        .bind(b.prevStartMs, b.endMs)
        .all<{ day: string; n: number }>();
      return (results ?? []).map((r) => ({ day: r.day, n: Number(r.n) }));
    }),
    ...[
      [b.curStartMs, b.endMs],
      [b.prevStartMs, b.curStartMs],
    ].map(([from, to]) =>
      safe(async () => {
        const r = await db
          .prepare(
            `SELECT COUNT(DISTINCT user_id) AS n FROM payments
              WHERE status = 'paid' AND user_id IS NOT NULL AND created_at >= ? AND created_at < ? AND ${realOnly}`,
          )
          .bind(from, to)
          .first<{ n: number }>();
        return Number(r?.n ?? 0);
      }),
    ),
    safe(async () => {
      const r = await db
        .prepare(
          `SELECT COUNT(*) AS total,
                  SUM(CASE WHEN last_seen_at >= ? THEN 1 ELSE 0 END) AS active,
                  SUM(CASE WHEN last_seen_at >= ? AND created_at < ? THEN 1 ELSE 0 END) AS returning_users
             FROM users WHERE deleted_at IS NULL`,
        )
        .bind(b.curStartMs, b.curStartMs, b.curStartMs)
        .first<{ total: number; active: number | null; returning_users: number | null }>();
      return { total: Number(r?.total ?? 0), active: Number(r?.active ?? 0), returning: Number(r?.returning_users ?? 0) };
    }),
    safe(async () => {
      const r = await db
        .prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(amount_satang), 0) AS s FROM payments WHERE refund_due = 1 AND ${realOnly}`)
        .first<{ n: number; s: number }>();
      return { count: Number(r?.n ?? 0), satang: Number(r?.s ?? 0) };
    }),
    safe(async () => {
      const r = await db
        .prepare(`SELECT COUNT(*) AS n FROM payments WHERE status = 'pending' AND created_at >= ? AND ${realOnly}`)
        .bind(b.curStartMs)
        .first<{ n: number }>();
      return Number(r?.n ?? 0);
    }),
    ...[
      [b.curStartMs, b.endMs],
      [b.prevStartMs, b.curStartMs],
    ].map(([from, to]) =>
      safe(async () => {
        const r = await db
          .prepare("SELECT COUNT(*) AS n, AVG(rating) AS avg FROM user_feedback WHERE created_at >= ? AND created_at < ?")
          .bind(from, to)
          .first<{ n: number; avg: number | null }>();
        return { n: Number(r?.n ?? 0), avg: r?.avg == null ? null : Math.round(Number(r.avg) * 10) / 10 };
      }),
    ),
  ]);

  return {
    payments,
    signups: signups as { day: string; n: number }[] | null,
    payers: payersCur == null ? null : { cur: payersCur as number, prev: payersPrev as number | null },
    members: members as ExecutiveD1Input["members"],
    refundDue: refundDue as ExecutiveD1Input["refundDue"],
    pending: pending as number | null,
    feedback:
      fbCur == null
        ? null
        : {
            cur: fbCur as { n: number; avg: number | null },
            prev: (fbPrev as { n: number; avg: number | null } | null) ?? { n: 0, avg: null },
          },
  };
}

export interface NavBadges {
  /** เงินจริงที่ต้องคืนลูกค้าแต่ยังไม่ได้คืน */
  refundDue: number | null;
  /** แม่หมอสมัครเข้ามา รอแอดมินตรวจ */
  pendingReaders: number | null;
  /** ความเห็นจากผู้ใช้ใน 7 วันล่าสุด */
  newFeedback: number | null;
  /** โหมดคีย์ Stripe — `test` = ป้ายเตือนบนหัวแอดมินว่ายังไม่ใช่เงินจริง */
  stripeMode: "live" | "test" | null;
}

/** ตัวเลขเตือนบนเมนูข้างของแอดมิน — นับอย่างเดียว 3 คำถาม เบาพอจะเรียกทุกครั้งที่เปลี่ยนแท็บ */
export async function getNavBadges(): Promise<NavBadges> {
  const db = await safe(() => getAppDB());
  if (!db) return { refundDue: null, pendingReaders: null, newFeedback: null, stripeMode: stripeKeyMode() };
  const count = (sql: string, ...args: unknown[]) =>
    safe(async () => Number((await db.prepare(sql).bind(...args).first<{ n: number }>())?.n ?? 0));
  const [refundDue, pendingReaders, newFeedback] = await Promise.all([
    count(
      "SELECT COUNT(*) AS n FROM payments WHERE refund_due = 1 AND provider != 'simulator' AND (provider_ref IS NULL OR provider_ref NOT LIKE 'cs\\_test\\_%' ESCAPE '\\')",
    ),
    count("SELECT COUNT(*) AS n FROM readers WHERE status = 'pending'"),
    count("SELECT COUNT(*) AS n FROM user_feedback WHERE created_at >= ?", Date.now() - 7 * 86_400_000),
  ]);
  return { refundDue, pendingReaders, newFeedback, stripeMode: stripeKeyMode() };
}

/** รายงานผู้บริหารช่วง `days` วันล่าสุด (รวมวันนี้) เทียบช่วงก่อนหน้ายาวเท่ากัน + สรุปเงินจาก Stripe */
export async function getExecutiveReport(days: number): Promise<ExecutiveReport & { stripe: StripeAdminSummary }> {
  const today = utcDay();
  const b = rangeBounds(today, days);
  const [stats, d1, stripe] = await Promise.all([
    getStats(days * 2),
    readD1(today, days),
    getStripeAdminSummary(Math.floor(b.curStartMs / 1000), Math.floor(b.endMs / 1000)),
  ]);
  return { ...buildExecutiveReport({ days, today, daily: stats.daily, d1 }), stripe };
}
