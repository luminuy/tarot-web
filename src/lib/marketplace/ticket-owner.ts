import { getSessionUser } from "@/lib/auth/session";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";

/**
 * 🔒 รหัสผู้ใช้ที่ "พิสูจน์ความเป็นเจ้าของบัญชีแล้ว" — ใช้เทียบกับ `queue_tickets.user_id` เท่านั้น (A1-04)
 * ---------------------------------------------------------------------------
 * บัญชี Google/LINE ผู้ให้บริการยืนยันตัวตนให้แล้ว ➔ ใช้ได้ทันที
 * บัญชีอีเมล ➔ ต้องกดลิงก์ยืนยันอีเมลแล้ว (`email_verified = 1`) — การสมัครออกคุกกี้ให้ก่อนยืนยันได้
 *   จึงห้ามให้คุกกี้ลักษณะนั้นเปิดตั๋ว/นัดที่ผูกกับ user id เดียวกัน
 * อ่านสถานะสดจาก D1 (ไม่ใช้แคชแสดงผล) · อ่านไม่ได้ = ไม่ผ่าน (fail-closed)
 */
export async function verifiedOwnerUserId(
  user: { id: string; provider?: string } | null | undefined,
): Promise<string | null> {
  if (!user?.id) return null;
  if (user.provider && user.provider !== "email") return user.id;
  try {
    const { getUserById } = await import("@/lib/users/users.repo");
    const row = await getUserById(user.id);
    return row?.emailVerified ? user.id : null;
  } catch {
    return null;
  }
}

/**
 * 🔒 เป็นเจ้าของตั๋วนี้ไหม — จุดเดียวที่ทุกเส้นของลูกค้าใช้ตัดสิน (ดู · ยกเลิก · เลื่อน · จ่ายต่อ · ยืนยันจ่าย · รีวิว)
 * ---------------------------------------------------------------------------
 * ผ่านได้สองทาง:
 *   1. คุกกี้ `customerRef` ที่เราเซ็นเอง (เบราว์เซอร์ที่ใช้จอง หรือเบราว์เซอร์ที่เปิดลิงก์จากอีเมลยืนยัน)
 *   2. บัญชีสมาชิกที่ล็อกอินอยู่ตรงกับ `user_id` ของตั๋ว (จองตอนล็อกอิน ➔ เปิดได้ทุกเครื่อง)
 *      — บัญชีอีเมลต้องยืนยันอีเมลแล้วเท่านั้น (`verifiedOwnerUserId`)
 * ⚠️ ไม่ผ่านต้องตอบ 404 เสมอ ไม่ใช่ 403 — ไม่ยืนยันว่าเลขตั๋วนี้มีอยู่จริง
 */
export async function isTicketOwner(request: Request, ticket: Pick<QueueTicket, "customerRef" | "userId">): Promise<boolean> {
  const ref = await readCustomerRefFromCookie(request);
  if (ref && ticket.customerRef === ref) return true;
  if (!ticket.userId) return false;
  const user = await getSessionUser();
  const ownerId = await verifiedOwnerUserId(user);
  return Boolean(ownerId && ownerId === ticket.userId);
}
