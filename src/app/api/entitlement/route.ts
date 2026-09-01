import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth/admin-auth";

import { getEntitlement } from "@/lib/entitlement/entitlement";
import { isEntitlementEnabled } from "@/lib/entitlement/flag";
import { getViewer } from "@/lib/entitlement/viewer";
import { KEY, kvGetJSON } from "@/lib/platform/kv-store";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";

export const runtime = "nodejs";

/**
 * GET /api/entitlement — คืนสถานะสิทธิ์ปัจจุบันให้ UI ใช้แสดงผล
 * (ห้าม UI คำนวณสิทธิ์เอง — การซ่อนปุ่มไม่ใช่การบังคับสิทธิ์)
 *
 * เมื่อผู้ใช้เป็น Admin / Master หรือธงปิด: คืนสิทธิ์แบบ "ไม่จำกัด"
 * `announce` = ประกาศล่วงหน้าว่าระบบสิทธิ์กำลังจะมา (แสดงแบนเนอร์)
 */
export async function GET(request: Request) {
  const [enabled, privileged, announceDoc] = await Promise.all([
    isEntitlementEnabled(),
    isPrivilegedTestRequest(request),
    kvGetJSON<{ value?: boolean; resetDate?: string }>(KEY.flag("entitlement.announce"), 30_000).catch(
      () => null,
    ),
  ]);
  const announce =
    !enabled && !!announceDoc && announceDoc.value === true
      ? { announce: true, announceResetDate: announceDoc.resetDate ?? "" }
      : { announce: false, announceResetDate: "" };

  if (privileged) {
    // `isPrivilegedTestRequest` เป็นจริงได้ 4 ทาง (แอดมิน / ผู้ทดสอบ / อีเมล unlimited / bypass token)
    // แต่มีแค่ "แอดมินจริง" เท่านั้นที่ควรเห็นทางเข้าแผง /admin บน UI
    // ถ้าเหมารวมเป็น role=admin ทั้งหมด ผู้ทดสอบจะถูกพาไปหน้าที่ตัวเองไม่มีสิทธิ์ (เจตนาของ /tester คือไม่ให้เห็นแผงแอดมิน)
    const isRealAdmin = await cookies()
      .then((c) => verifyAdminSession(c.get(ADMIN_COOKIE_NAME)?.value))
      .catch(() => false);

    return NextResponse.json({
      enabled: true,
      canStartReading: true,
      canChat: true,
      remaining: 9999,
      limit: 9999,
      dailyRemaining: 9999,
      weeklyRemaining: 9999,
      bonusRemaining: 9999,
      resetAt: null,
      kind: "member",
      dailyFreeAvailable: true,
      dailyStreak: 99,
      role: isRealAdmin ? "admin" : "unlimited",
      ...announce,
    });
  }

  if (!enabled) {
    return NextResponse.json({
      enabled: false,
      canStartReading: true,
      canChat: true,
      remaining: null,
      limit: null,
      weeklyRemaining: null,
      bonusRemaining: null,
      resetAt: null,
      kind: "member",
      ...announce,
    });
  }

  const viewer = await getViewer(request);
  const ent = await getEntitlement(viewer);
  return NextResponse.json({ enabled: true, ...ent, ...announce });
}
