import { cookies } from "next/headers";

import { AUTH_COOKIE_NAME, verifyUserSession } from "@/lib/auth/edge-auth";
import type { Viewer } from "@/lib/entitlement/entitlement";

/**
 * แปลง request → Viewer (สมาชิก หรือ ผู้เยี่ยมชม)
 * - สมาชิก: อ่านจากคุกกี้เซสชัน `tarot_auth_session`
 * - ผู้เยี่ยมชม: PR C จะเพิ่มคุกกี้ `tarot_guest` เพื่อนับสิทธิ์ข้ามครั้งจริง
 *   ตอนนี้ (PR B) คืน guestUsed = 0 เสมอ — ยังไม่บังคับใช้ (ธง entitlement.enabled ปิด)
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

  return { kind: "guest", gid: "anon", guestUsed: 0 };
}
