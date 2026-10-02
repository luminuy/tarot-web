import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";

import { requireReader } from "@/lib/auth/reader-auth";
import {
  endCall,
  getCallView,
  joinCall,
  restartCall,
  sanitizeRelaySdp,
  submitAnswer,
  submitOffer,
  type CallRole,
} from "@/lib/marketplace/call.repo";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import { getQueueTicketById, type QueueTicket } from "@/lib/marketplace/queue.repo";
import { generateTurnIceServers, isTurnConfigured, revokeTurnCredential } from "@/lib/marketplace/turn";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { consumeEdgeRateLimit, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";

export const runtime = "nodejs";

/**
 * 📹 /api/marketplace/calls/[ticketId] — นัดเชื่อมสายวิดีโอคอลตัวต่อตัว (ลูกค้า ↔ แม่หมอ)
 *
 *   GET  ?as=customer|reader                    ➔ สถานะห้อง (offer ให้แม่หมอ · answer ให้ลูกค้า)
 *   POST { as, action: "join" }                 ➔ รหัสผ่าน TURN ชั่วคราว (เฉพาะ relay) + สถานะห้อง
 *   POST { as: "customer", action: "offer", round, sdp }
 *   POST { as: "reader",   action: "answer", round, sdp }
 *   POST { as, action: "restart" | "end" }
 *
 * 🔒 สิทธิ์: ลูกค้า = คุกกี้ customerRef ตรงกับตั๋ว · แม่หมอ = โทเคนแม่หมอเจ้าของคิว
 *    ไม่มีสิทธิ์ = 404 เสมอ (ไม่ยืนยันว่าตั๋วนี้มีอยู่จริง — แนวเดียวกับ /tickets/[id])
 * 🔒 คุยได้เฉพาะตอนตั๋วอยู่สถานะ `ready` (แม่หมอเรียกคิวแล้ว) เท่านั้น
 */

const RoleSchema = z.enum(["customer", "reader"]);

const PostSchema = z.discriminatedUnion("action", [
  z.object({ as: RoleSchema, action: z.literal("join") }),
  z.object({ as: z.literal("customer"), action: z.literal("offer"), round: z.number().int().positive(), sdp: z.string() }),
  z.object({ as: z.literal("reader"), action: z.literal("answer"), round: z.number().int().positive(), sdp: z.string() }),
  z.object({ as: RoleSchema, action: z.literal("restart") }),
  z.object({ as: RoleSchema, action: z.literal("end") }),
]);

/** ขอ TURN ได้ไม่เกิน 30 ครั้ง/ชม. ต่อตั๋วต่อฝั่ง · ส่งใบนัด/ต่อสายใหม่ได้ 120 ครั้ง/ชม. */
const JOIN_LIMIT = { max: 30, windowSec: 3600 };
const SIGNAL_LIMIT = { max: 120, windowSec: 3600 };

const notFound = () => apiFail("ไม่พบห้องวิดีโอคอลนี้", 404, "not_found");

async function resolveParticipant(
  request: Request,
  ticketId: string,
  role: CallRole,
): Promise<QueueTicket | null> {
  const ticket = await getQueueTicketById(ticketId);
  if (!ticket) return null;
  if (role === "customer") {
    const ref = await readCustomerRefFromCookie(request);
    return ref && ref === ticket.customerRef ? ticket : null;
  }
  const auth = await requireReader(request);
  return auth.success && auth.readerId === ticket.readerId ? ticket : null;
}

export async function GET(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const role = RoleSchema.safeParse(new URL(request.url).searchParams.get("as"));
  if (!role.success) return notFound();

  try {
    const ticket = await resolveParticipant(request, ticketId, role.data);
    if (!ticket) return notFound();

    if (ticket.status !== "ready") {
      // คิวถูกปิด/ส่งต่อแล้ว = สายจบ (และเพิกถอน TURN ที่อาจค้าง)
      const users = await endCall(ticketId, null);
      await Promise.all(users.map(revokeTurnCredential));
      return apiOk(
        { call: { round: 0, offer: null, answer: null, peerPresent: false, ended: true, endedBy: null }, ticketStatus: ticket.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const call = await getCallView(ticketId, role.data);
    return apiOk({ call, ticketStatus: ticket.status }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[API Call GET Error]", err);
    return apiFail("ไม่สามารถโหลดสถานะห้องได้", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  if (!isRequestAuthorizedOrigin(request)) {
    return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403, "forbidden_origin");
  }
  const { ticketId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return apiFail("รูปแบบข้อมูลคำขอไม่ถูกต้อง", 400, "invalid_body");
  }
  const input = parsed.data;

  try {
    const ticket = await resolveParticipant(request, ticketId, input.as);
    if (!ticket) return notFound();
    if (ticket.status !== "ready") {
      return apiFail("คิวนี้ปิดไปแล้ว", 409, "ticket_closed");
    }

    if (input.action === "end") {
      const users = await endCall(ticketId, input.as);
      await Promise.all(users.map(revokeTurnCredential));
      return apiOk();
    }

    const limit = await consumeEdgeRateLimit(
      edgeRateLimitKey(input.action === "join" ? "call-join" : "call-signal", `${ticketId}:${input.as}`),
      input.action === "join" ? JOIN_LIMIT : SIGNAL_LIMIT,
    );
    if (!limit.allowed) {
      const tooMany = apiFail("ต่อสายถี่เกินไป กรุณารอสักครู่แล้วลองใหม่", 429, "rate_limited");
      tooMany.headers.set("Retry-After", String(limit.retryAfterSec));
      return tooMany;
    }

    if (input.action === "join") {
      if (!isTurnConfigured()) {
        return apiFail("ระบบวิดีโอคอลยังไม่เปิดให้บริการ", 503, "video_unavailable");
      }
      const iceServers = await generateTurnIceServers();
      if (!iceServers) {
        return apiFail("เชื่อมต่อเซิร์ฟเวอร์วิดีโอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 502, "turn_failed");
      }
      const { view, previousTurnUser } = await joinCall(ticketId, input.as, iceServers[0]?.username ?? null);
      await revokeTurnCredential(previousTurnUser);
      return apiOk({ iceServers, call: view }, { headers: { "Cache-Control": "no-store" } });
    }

    if (input.action === "restart") {
      const ok = await restartCall(ticketId);
      return ok ? apiOk() : apiFail("สายนี้จบไปแล้ว", 409, "call_ended");
    }

    const sdp = sanitizeRelaySdp(input.sdp);
    if (!sdp.ok) {
      return apiFail(
        sdp.reason === "relay_required" ? "เชื่อมต่อเซิร์ฟเวอร์วิดีโอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" : "ข้อมูลการเชื่อมต่อไม่ถูกต้อง",
        400,
        sdp.reason,
      );
    }

    const ok =
      input.action === "offer"
        ? await submitOffer(ticketId, input.round, sdp.sdp)
        : await submitAnswer(ticketId, input.round, sdp.sdp);
    // รอบไม่ตรง = อีกฝั่งเพิ่งกดต่อสายใหม่ — ไคลเอนต์จะเห็นรอบใหม่ในการถามครั้งถัดไป
    return ok ? apiOk() : apiFail("รอบการเชื่อมต่อเปลี่ยนแล้ว", 409, "stale_round");
  } catch (err) {
    console.error("[API Call POST Error]", err);
    return apiFail("เกิดข้อผิดพลาดในห้องวิดีโอคอล", 500);
  }
}
