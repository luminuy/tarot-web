import { NextResponse } from "next/server";
import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { getBookingByTicketId, isPaidBooking } from "@/lib/marketplace/booking.repo";
import { getQueueTicketById } from "@/lib/marketplace/queue.repo";
import { createReview, REVIEW_COMMENT_MAX } from "@/lib/marketplace/reviews.repo";
import { isTicketOwner } from "@/lib/marketplace/ticket-owner";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";

export const runtime = "nodejs";

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(REVIEW_COMMENT_MAX).optional(),
});

/**
 * POST /api/marketplace/tickets/[id]/review — รีวิวหลังคุยจบ
 * เงื่อนไขครบทุกข้อเท่านั้น: เจ้าของตั๋ว · แม่หมอปิดคิวแล้ว (`handed_off`) · จ่ายเงินจริง · ยังไม่เคยรีวิว
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const { id } = await params;
  try {
    const parsed = ReviewSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return apiFail("กรุณาให้คะแนน 1–5 ดาว", 400);

    const ticket = await getQueueTicketById(id);
    if (!ticket || !(await isTicketOwner(request, ticket))) return apiFail("ไม่พบตั๋วคิวที่ระบุ", 404);
    if (ticket.status !== "handed_off") return apiFail("รีวิวได้หลังคุยกับแม่หมอจบแล้ว", 409);
    if (!isPaidBooking(await getBookingByTicketId(ticket.id))) return apiFail("รีวิวได้เฉพาะการปรึกษาที่ชำระเงินแล้ว", 409);

    const result = await createReview({
      ticketId: ticket.id,
      readerId: ticket.readerId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
      nickname: ticket.nickname,
    });
    if (!result.ok) return apiFail(result.error, result.status);
    return apiOk({ rating: result.review.rating });
  } catch (err) {
    console.error("[API Review POST Error]", err);
    return apiFail("บันทึกรีวิวไม่สำเร็จ กรุณาลองใหม่", 500);
  }
}
