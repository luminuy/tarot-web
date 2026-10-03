import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { requireAdmin } from "@/lib/auth/require-admin";
import { listAdminBookings, retryDueRefund } from "@/lib/marketplace/booking.repo";
import { calculateReaderEarnings } from "@/lib/marketplace/payments.repo";
import { listReaders } from "@/lib/marketplace/readers.repo";
import { listRecentReviews, setReviewHidden } from "@/lib/marketplace/reviews.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { recordAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

/**
 * GET /api/admin/bookings — แท็บ "การจอง & การเงิน" ของแผงแอดมิน
 * รายการจอง (เงินที่ต้องคืนแต่ยังคืนไม่สำเร็จขึ้นบนสุด) · ยอดรายได้ต่อแม่หมอ · รีวิวล่าสุด
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const [bookings, readers, reviews] = await Promise.all([
      listAdminBookings(),
      listReaders({ status: "approved" }),
      listRecentReviews(30),
    ]);
    const earnings = await Promise.all(
      readers.map(async (r) => ({ displayName: r.displayName, ...(await calculateReaderEarnings(r.id)) }))
    );
    return apiOk({
      bookings,
      refundDueCount: bookings.filter((b) => b.refundDue).length,
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
]);

/** POST /api/admin/bookings — ลองคืนเงินอีกครั้ง · ซ่อน/แสดงรีวิว (บันทึกลงประวัติแอดมินทุกครั้ง) */
export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403);
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const parsed = ActionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiFail("ข้อมูลไม่ถูกต้อง", 400);
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
