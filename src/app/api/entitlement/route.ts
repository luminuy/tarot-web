import { NextResponse } from "next/server";

import { getEntitlement } from "@/lib/entitlement/entitlement";
import { isEntitlementEnabled } from "@/lib/entitlement/flag";
import { SIGN_IN_GATE_REASON, isSignInRequired } from "@/lib/entitlement/signin-gate";
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
    return NextResponse.json({
      enabled: true,
      canStartReading: true,
      canChat: true,
      remaining: 9999,
      limit: 9999,
      dailyRemaining: 9999,
      weeklyRemaining: 9999,
      bonusRemaining: 9999,
      hasPaidCredits: true,
      resetAt: null,
      kind: "member",
      dailyFreeAvailable: true,
      dailyStreak: 99,
      role: "unlimited",
      ...announce,
    });
  }

  if (!enabled) {
    // ธงโควตาปิดอยู่ แต่ "ต้องล็อกอินก่อนเปิดไพ่" ไม่ได้ผูกกับธงนั้น (signin-gate.ts)
    // ผู้เยี่ยมชมจึงต้องได้ภาพสิทธิ์ที่ตรงกับด่านฝั่งเซิร์ฟเวอร์จริง ไม่งั้น UI จะเชียร์ให้กดเปิดไพ่
    // แล้วไปเจอ 403 กลางทาง — `enabled: true` ตรงนี้แปลว่า "หน้าจอต้องแสดงกำแพงสิทธิ์"
    const guestViewer = await getViewer(request);
    if (isSignInRequired(guestViewer)) {
      return NextResponse.json({
        enabled: true,
        canStartReading: false,
        canChat: false,
        remaining: 0,
        limit: 0,
        dailyRemaining: 0,
        weeklyRemaining: 0,
        bonusRemaining: 0,
        hasPaidCredits: false,
        resetAt: null,
        dailyFreeAvailable: true,
        dailyStreak: 0,
        kind: "guest",
        reason: SIGN_IN_GATE_REASON,
        ...announce,
      });
    }

    return NextResponse.json({
      enabled: false,
      canStartReading: true,
      canChat: true,
      remaining: null,
      limit: null,
      weeklyRemaining: null,
      bonusRemaining: null,
      hasPaidCredits: false,
      resetAt: null,
      kind: "member",
      ...announce,
    });
  }

  const viewer = await getViewer(request);
  const ent = await getEntitlement(viewer);
  return NextResponse.json({ enabled: true, ...ent, ...announce });
}
