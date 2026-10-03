import { getSessionUser } from "@/lib/auth/session";
import { readCustomerRefFromCookie } from "@/lib/marketplace/customer-ref";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";

/**
 * 🔒 เป็นเจ้าของตั๋วนี้ไหม — จุดเดียวที่ทุกเส้นของลูกค้าใช้ตัดสิน (ดู · ยกเลิก · เลื่อน · จ่ายต่อ · ยืนยันจ่าย · รีวิว)
 * ---------------------------------------------------------------------------
 * ผ่านได้สองทาง:
 *   1. คุกกี้ `customerRef` ที่เราเซ็นเอง (เบราว์เซอร์ที่ใช้จอง หรือเบราว์เซอร์ที่เปิดลิงก์จากอีเมลยืนยัน)
 *   2. บัญชีสมาชิกที่ล็อกอินอยู่ตรงกับ `user_id` ของตั๋ว (จองตอนล็อกอิน ➔ เปิดได้ทุกเครื่อง)
 * ⚠️ ไม่ผ่านต้องตอบ 404 เสมอ ไม่ใช่ 403 — ไม่ยืนยันว่าเลขตั๋วนี้มีอยู่จริง
 */
export async function isTicketOwner(request: Request, ticket: Pick<QueueTicket, "customerRef" | "userId">): Promise<boolean> {
  const ref = await readCustomerRefFromCookie(request);
  if (ref && ticket.customerRef === ref) return true;
  if (!ticket.userId) return false;
  const user = await getSessionUser();
  return Boolean(user && user.id === ticket.userId);
}
