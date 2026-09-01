import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";
import { GUEST_LIMIT, type Viewer } from "@/lib/entitlement/entitlement";
import { isGuestUsedOnServer, readGuestCookie } from "@/lib/entitlement/guest";

/**
 * แปลง request → Viewer (สมาชิก หรือ ผู้เยี่ยมชม)
 * - สมาชิก: อ่านจากคุกกี้เซสชัน `tarot_auth_session`
 * - ผู้เยี่ยมชม: อ่านจากคุกกี้ `tarot_guest` (นับสิทธิ์ข้ามครั้ง) · ไม่มีคุกกี้ = ยังไม่เคยใช้
 */
export async function getViewer(_request?: Request): Promise<Viewer> {
  try {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value;
    if (token) {
      const user = await verifyUserSession(token);
      if (user?.id) return { kind: "member", userId: user.id };
    }
  } catch {
    // cookies() อาจ throw ในบางบริบท — ถือว่าเป็นผู้เยี่ยมชม
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
