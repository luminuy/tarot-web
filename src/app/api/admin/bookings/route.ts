import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAdminBookings, retryDueRefund } from "@/lib/marketplace/booking.repo";
import {
  bangkokPeriodOf,
  calculateReaderEarnings,
  isPayoutPeriod,
  settleReaderPayout,
} from "@/lib/marketplace/payments.repo";
import { listReaders } from "@/lib/marketplace/readers.repo";
import { listRecentReviews, setReviewHidden } from "@/lib/marketplace/reviews.repo";
import { syncGatewayRefunds } from "@/lib/marketplace/refund-sync";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { recordAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

/**
 * GET /api/admin/bookings?period=YYYY-MM — แท็บ "การจอง & การเงิน" ของแผงแอดมิน
 * รายการจอง (เงินที่ต้องคืนแต่ยังคืนไม่สำเร็จขึ้นบนสุด) · ยอดรายได้ต่อแม่หมอของงวดนั้น (ค่าเริ่มต้น = เดือนนี้ เวลาไทย) · รีวิวล่าสุด
 * แม่หมอที่พักงาน/ยังไม่อนุมัติแต่มีรายได้หรือยอดโอนในงวดนั้นต้องยังโผล่ (ไม่งั้นยอดค้างโอนหายจากจอ)
 */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const raw = new URL(request.url).searchParams.get("period");
    const period = isPayoutPeriod(raw) ? raw : bangkokPeriodOf();
    const [bookings, readers, reviews] = await Promise.all([listAdminBookings(), listReaders(), listRecentReviews(30)]);
    const earnings = (
      await Promise.all(
        readers.map(async (r) => ({ displayName: r.displayName, status: r.status, ...(await calculateReaderEarnings(r.id, period)) }))
      )
    ).filter((e) => e.status === "approved" || e.grossSatang > 0 || e.paidOutSatang > 0);
    return apiOk({
      bookings,
      refundDueCount: bookings.filter((b) => b.refundDue).length,
      period,
      earnings,
      reviews,
    });
  } catch (err) {
    console.error("[API Admin Bookings GET Error]", err);
    return apiFail("โหลดข้อมูลการจองไม่สำเร็จ", 500);
  }
}

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("retry_refund"), paymentId: z.string().min(1) }),
  z.object({ action: z.literal("hide_review"), reviewId: z.string().min(1), hidden: z.boolean() }),
  z.object({ action: z.literal("sync_refunds") }),
  // ยอดโอนคำนวณฝั่งเซิร์ฟเวอร์จากงวดนั้นเสมอ — ไม่รับตัวเลขเงินจากหน้าเว็บ
  z.object({ action: z.literal("record_payout"), readerId: z.string().min(1), period: z.string().refine(isPayoutPeriod) }),
]);

/** POST /api/admin/bookings — ลองคืนเงินอีกครั้ง · บันทึกว่าโอนให้แม่หมอแล้ว · ซ่อน/แสดงรีวิว (บันทึกลงประวัติแอดมินทุกครั้ง) */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403);
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
    if (parsed.data.action === "sync_refunds") {
      // ไล่ถาม Stripe ว่ารายการที่เรายังถือว่า "จ่ายแล้ว" ถูกคืนเงินจากแดชบอร์ดไปหรือยัง ➔ ถอนรอบ/ยกเลิกนัดให้ตรง
      const result = await syncGatewayRefunds();
      await recordAudit("sync_refunds", `ตรวจ ${result.checked} · ถอนแล้ว ${result.applied} · คืนบางส่วน ${result.partial} · ถามไม่ได้ ${result.unreachable}`);
      return apiOk(result);
    }
    if (parsed.data.action === "record_payout") {
      const { readerId, period } = parsed.data;
      const result = await settleReaderPayout(readerId, period);
      if (!result.ok) return apiFail("งวดนี้ไม่มียอดค้างโอนให้แม่หมอคนนี้", 409);
      await recordAudit(
        "record_payout",
        `บันทึกโอนให้แม่หมอ ${readerId} งวด ${period}: ${(result.payout.netSatang / 100).toFixed(2)} บาท (${result.payout.id})`
      );
      return apiOk({ payout: result.payout, earnings: result.earnings });
    }
    if (parsed.data.action === "retry_refund") {
      const result = await retryDueRefund(parsed.data.paymentId);
      await recordAudit("retry_refund", `ลองคืนเงินอีกครั้ง ${parsed.data.paymentId}: ${result}`);
      if (result === "not_due") return apiFail("รายการนี้ไม่ได้ค้างคืนเงิน", 409);
      if (result === "failed") return apiFail("คืนเงินยังไม่สำเร็จ ตรวจในแดชบอร์ด Stripe", 502);
      return apiOk({ result });
    }
    const ok = await setReviewHidden(parsed.data.reviewId, parsed.data.hidden);
    await recordAudit("hide_review", `${parsed.data.hidden ? "ซ่อน" : "แสดง"}รีวิว ${parsed.data.reviewId}`);
    return ok ? apiOk({}) : apiFail("ไม่พบรีวิว", 404);
  } catch (err) {
    console.error("[API Admin Bookings POST Error]", err);
    return apiFail("ดำเนินการไม่สำเร็จ", 500);
  }
}
