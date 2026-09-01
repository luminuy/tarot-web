import { NextResponse } from "next/server";

import { getEntitlement } from "@/lib/entitlement/entitlement";
import { isEntitlementEnabled } from "@/lib/entitlement/flag";
import { getViewer } from "@/lib/entitlement/viewer";
import { KEY, kvGetJSON } from "@/lib/platform/kv-store";

export const runtime = "nodejs";

/**
 * GET /api/entitlement — คืนสถานะสิทธิ์ปัจจุบันให้ UI ใช้แสดงผล
 * (ห้าม UI คำนวณสิทธิ์เอง — การซ่อนปุ่มไม่ใช่การบังคับสิทธิ์)
 *
 * เมื่อธงปิด: คืน enabled=false + สิทธิ์แบบ "ไม่จำกัด" เพื่อให้ UI ไม่แสดง gate ใด ๆ
 * `announce` = ประกาศล่วงหน้าว่าระบบสิทธิ์กำลังจะมา (แสดงแบนเนอร์)
 */
export async function GET(request: Request) {
  const [enabled, announceDoc] = await Promise.all([
    isEntitlementEnabled(),
    kvGetJSON<{ value?: boolean; resetDate?: string }>(KEY.flag("entitlement.announce"), 30_000).catch(
      () => null,
    ),
  ]);
  const announce =
    !enabled && !!announceDoc && announceDoc.value === true
      ? { announce: true, announceResetDate: announceDoc.resetDate ?? "" }
      : { announce: false, announceResetDate: "" };

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
