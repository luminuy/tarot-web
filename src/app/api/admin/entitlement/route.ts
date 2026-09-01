import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getStats } from "@/lib/stats/read";
import { KEY, kvGetJSON, kvPutJSON, invalidateMemo } from "@/lib/platform/kv-store";

export const runtime = "nodejs";

const ENABLED_KEY = KEY.flag("entitlement.enabled");
const ANNOUNCE_KEY = KEY.flag("entitlement.announce");

const Body = z.object({
  enabled: z.boolean().optional(),
  announce: z.boolean().optional(),
  announceResetDate: z.string().max(40).optional(),
});

function truthy(raw: unknown): boolean {
  return raw === true || (!!raw && typeof raw === "object" && (raw as { value?: boolean }).value === true);
}

/** GET — สถานะธง + metric ที่ต้องเฝ้าดูใน 48 ชม.แรก */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const [enabledRaw, announceRaw, stats] = await Promise.all([
    kvGetJSON<unknown>(ENABLED_KEY).catch(() => null),
    kvGetJSON<{ value?: boolean; resetDate?: string }>(ANNOUNCE_KEY).catch(() => null),
    getStats(7).catch(() => null),
  ]);

  const r = stats?.range ?? {};
  return NextResponse.json({
    enabled: truthy(enabledRaw),
    announce: truthy(announceRaw),
    announceResetDate: announceRaw?.resetDate ?? "",
    metrics: {
      blockedStart: r.entitlement_blocked_start ?? 0,
      blockedRead: r.entitlement_blocked_read ?? 0,
      blockedChat: r.entitlement_blocked_chat ?? 0,
      guestConsumed: r.entitlement_guest_consumed ?? 0,
      aiCapHit: r.ai_cap_hit ?? 0,
      signupShown: r.signup_card_shown ?? 0,
      signupClicked: r.signup_card_clicked ?? 0,
      signupDismissed: r.signup_card_dismissed ?? 0,
    },
  });
}

/** PUT — เปิด/ปิดระบบสิทธิ์ + ประกาศ (ENTITLEMENT_PLAN ข้อ 8 / PR F) */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { enabled, announce, announceResetDate } = parsed.data;

  if (typeof enabled === "boolean") {
    await kvPutJSON(ENABLED_KEY, { value: enabled });
    invalidateMemo(ENABLED_KEY);
    await recordAudit("entitlement_flag", enabled ? "enabled" : "disabled");
  }
  if (typeof announce === "boolean" || typeof announceResetDate === "string") {
    const cur = (await kvGetJSON<{ value?: boolean; resetDate?: string }>(ANNOUNCE_KEY)) ?? {};
    await kvPutJSON(ANNOUNCE_KEY, {
      value: typeof announce === "boolean" ? announce : !!cur.value,
      resetDate: announceResetDate ?? cur.resetDate ?? "",
    });
    invalidateMemo(ANNOUNCE_KEY);
    await recordAudit("entitlement_announce", announce ? "on" : "off");
  }

  return NextResponse.json({ ok: true });
}
