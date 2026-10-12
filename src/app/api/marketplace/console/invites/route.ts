import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { requireReader } from "@/lib/auth/reader-auth";
import {
  cancelInvite,
  createInvite,
  INVITE_LABEL_MAX,
  inviteState,
  inviteUrl,
  listReaderInvites,
  MAX_OPEN_INVITES,
} from "@/lib/marketplace/invites.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { consumeEdgeRateLimit, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";

export const runtime = "nodejs";

/**
 * ✦ /api/marketplace/console/invites — ลิงก์ห้องส่วนตัวของแม่หมอ (migrations/0032 · แผน CONSULT_FLOW คลื่น 7)
 * ---------------------------------------------------------------------------
 *   POST  { label? }                    ➔ สร้างลิงก์ใหม่ (ใช้ได้ 24 ชม. · ลูกค้าคนเดียว · จ่ายบนเว็บก่อนเข้าห้อง)
 *   PATCH { inviteId, action: "cancel" } ➔ ยกเลิกลิงก์ (มีคนกำลังจ่าย = ปล่อยที่ทันที · จ่ายแล้วยกเลิกที่การ์ดคิวแทน)
 * รายการลิงก์มากับ GET /api/marketplace/console/queue ทุก 5 วินาทีอยู่แล้ว ไม่มี GET แยก
 *
 * 🔒 แม่หมอเห็น/จัดการได้เฉพาะลิงก์ของตัวเอง (readerId มาจากโทเคนแผงเท่านั้น ไม่รับจาก body)
 */

const CreateSchema = z.object({
  label: z.string().max(INVITE_LABEL_MAX * 2).optional().nullable(),
});

const PatchSchema = z.object({
  inviteId: z.string().min(1).max(64),
  action: z.literal("cancel"),
});

/** กดสร้างลิงก์ได้ไม่เกิน 30 ครั้ง/ชม. ต่อแม่หมอ (นอกจากเพดานลิงก์ที่ยังไม่ได้ใช้ 10 อัน) */
const CREATE_LIMIT = { max: 30, windowSec: 3600 };

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403, "forbidden_origin");
  }
  const auth = await requireReader(request);
  if (!auth.success) return auth.response;
  const { readerId } = auth;

  const parsed = CreateSchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return apiFail("ชื่อลูกค้ายาวเกินไป", 400, "invalid_body");
  }

  try {
    const limit = await consumeEdgeRateLimit(edgeRateLimitKey("console-invite", readerId), CREATE_LIMIT);
    if (!limit.allowed) {
      const tooMany = apiFail("สร้างลิงก์ถี่เกินไป รอสักครู่แล้วลองใหม่", 429, "rate_limited");
      tooMany.headers.set("Retry-After", String(limit.retryAfterSec));
      return tooMany;
    }
    const now = Date.now();
    const created = await createInvite(readerId, parsed.data.label ?? null, now);
    if (!created.ok) {
      return apiFail(
        `มีลิงก์ห้องที่ยังไม่มีใครใช้ครบ ${MAX_OPEN_INVITES} ลิงก์แล้ว ยกเลิกลิงก์เก่าก่อนสร้างใหม่`,
        429,
        "too_many_invites",
      );
    }
    const { invite } = created;
    return apiOk(
      {
        invite: {
          id: invite.id,
          url: inviteUrl(invite.code),
          label: invite.label,
          state: inviteState(invite, null, now),
          ticketId: null,
          createdAt: invite.createdAt,
          expiresAt: invite.expiresAt,
        },
        invites: await listReaderInvites(readerId, now),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[API Console Invites POST Error]", err);
    return apiFail("สร้างลิงก์ห้องไม่สำเร็จ ลองใหม่อีกครั้ง", 500);
  }
}

export async function PATCH(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403, "forbidden_origin");
  }
  const auth = await requireReader(request);
  if (!auth.success) return auth.response;
  const { readerId } = auth;

  const parsed = PatchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return apiFail("รูปแบบข้อมูลคำขอไม่ถูกต้อง", 400, "invalid_body");
  }

  try {
    const result = await cancelInvite(readerId, parsed.data.inviteId);
    if (!result.ok) {
      return result.reason === "paid"
        ? apiFail("ลูกค้าจ่ายแล้ว ยกเลิกที่การ์ดคิวด้านล่างแทน (ระบบคืนเงินให้อัตโนมัติ)", 409, "invite_paid")
        : apiFail("ไม่พบลิงก์นี้ หรือยกเลิกไปแล้ว", 404, "not_found");
    }
    return apiOk({ releasedTicketId: result.releasedTicketId, invites: await listReaderInvites(readerId) });
  } catch (err) {
    console.error("[API Console Invites PATCH Error]", err);
    return apiFail("ยกเลิกลิงก์ไม่สำเร็จ ลองใหม่อีกครั้ง", 500);
  }
}
