import { getSessionUser } from "@/lib/auth/session";
import { GUEST_LIMIT, type Viewer } from "@/lib/entitlement/entitlement";
import { isGuestUsedOnServer, readGuestCookie } from "@/lib/entitlement/guest";

/**
 * แปลง request → Viewer (สมาชิก หรือ ผู้เยี่ยมชม)
 * - สมาชิก: อ่านจากคุกกี้เซสชัน `tarot_auth_session`
 * - ผู้เยี่ยมชม: อ่านจากคุกกี้ `tarot_guest` (นับสิทธิ์ข้ามครั้ง) · ไม่มีคุกกี้ = ยังไม่เคยใช้
 */
export async function getViewer(_request?: Request): Promise<Viewer> {
  try {
    // ผ่าน getSessionUser() เท่านั้น — เซสชันที่ถูกเพิกถอน (เปลี่ยนรหัสผ่าน/ลบบัญชี)
    // ต้องตกกลับไปนับสิทธิ์แบบผู้เยี่ยมชม ไม่ใช่ยังได้โควตาสมาชิกต่อ
    const user = await getSessionUser();
    if (user?.id) return { kind: "member", userId: user.id };
  } catch {
    // อ่านคุกกี้ไม่ได้ในบางบริบท — ถือว่าเป็นผู้เยี่ยมชม
  }

  const guest = await readGuestCookie();
  const gid = guest?.gid ?? "anon";
  let guestUsed = guest?.used ?? 0;

  // เครื่องหมายฝั่ง server ทับค่าคุกกี้ได้เสมอ — client ที่บล็อก guest-consume ยังโดนกั้น
  if (guestUsed < GUEST_LIMIT && (await isGuestUsedOnServer(gid).catch(() => false))) {
    guestUsed = GUEST_LIMIT;
  }

  return { kind: "guest", gid, guestUsed };
}
