import { apiFail, apiOk } from "@/lib/api/envelope";
import { getSessionUser } from "@/lib/auth/session";
import { getBookingsByTicketIds } from "@/lib/marketplace/booking.repo";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import { listTicketsForOwner } from "@/lib/marketplace/queue.repo";
import { getReaderById } from "@/lib/marketplace/readers.repo";

export const runtime = "nodejs";

/**
 * GET /api/marketplace/my-bookings — "นัดของฉัน"
 * เห็นตั๋วของเบราว์เซอร์นี้ (คุกกี้) + ของบัญชีที่ล็อกอิน (ทุกเครื่อง) · ไม่มีทั้งสองอย่าง = รายการว่าง (ไม่ใช่ 401)
 * ⚠️ ไม่ส่งคำถาม/สรุป AI ออกไปในรายการ — เปิดดูรายละเอียดที่หน้าคิวซึ่งตรวจความเป็นเจ้าของอีกชั้น
 */
export async function GET(request: Request) {
  try {
    const [customerRef, user] = await Promise.all([
      readCustomerRefFromCookie(request),
      getSessionUser().catch(() => null),
    ]);
    const tickets = (await listTicketsForOwner({ customerRef, userId: user?.id ?? null })).filter(
      // ตั๋วที่ไม่เคยจ่ายเงินและหมดเวลาไปแล้วไม่ใช่ "นัด" — ไม่ต้องรกรายการ
      (t) => t.status !== "expired" || t.kind === "booking"
    );
    const bookings = await getBookingsByTicketIds(tickets.map((t) => t.id));
    const readerNames = new Map<string, { name: string; avatarUrl: string | null }>();
    for (const id of new Set(tickets.map((t) => t.readerId))) {
      const r = await getReaderById(id);
      if (r) readerNames.set(id, { name: r.displayName, avatarUrl: r.avatarUrl });
    }
    const items = tickets
      .map((t) => {
        const b = bookings.get(t.id);
        if (!b) return null;
        // ยังไม่จ่าย + หมดเวลาแล้ว = ไม่มีอะไรให้ทำต่อ ไม่แสดง
        if (b.status === "expired" && !b.refundStatus) return null;
        return {
          ticketId: t.id,
          readerId: t.readerId,
          readerName: readerNames.get(t.readerId)?.name ?? "แม่หมอ",
          readerAvatarUrl: readerNames.get(t.readerId)?.avatarUrl ?? null,
          kind: b.kind,
          slotStart: b.kind === "scheduled" ? b.slotStart : null,
          createdAt: t.createdAt,
          ticketStatus: t.status,
          bookingStatus: b.status,
          refundStatus: b.refundStatus,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    return apiOk({ items, signedIn: Boolean(user) });
  } catch (err) {
    console.error("[API My Bookings GET Error]", err);
    return apiFail("โหลดนัดของคุณไม่สำเร็จ", 500);
  }
}
