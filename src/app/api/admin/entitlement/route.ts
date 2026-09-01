import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { KEY, kvGetJSON, kvPutJSON, invalidateMemo } from "@/lib/platform/kv-store";

export const runtime = "nodejs";

const FLAG_KEY = KEY.flag("entitlement.enabled");
const Body = z.object({ enabled: z.boolean() });

/** GET — สถานะธงระบบสิทธิ์ปัจจุบัน */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const raw = await kvGetJSON<boolean | { value?: boolean }>(FLAG_KEY).catch(() => null);
  const enabled = raw === true || (!!raw && typeof raw === "object" && raw.value === true);
  return NextResponse.json({ enabled });
}

/** PUT — เปิด/ปิดระบบสิทธิ์ (ENTITLEMENT_PLAN ข้อ 8 · PR F) */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ต้องส่ง { enabled: boolean }" }, { status: 400 });
  }

  await kvPutJSON(FLAG_KEY, { value: parsed.data.enabled });
  invalidateMemo(FLAG_KEY);
  await recordAudit("entitlement_flag", parsed.data.enabled ? "enabled" : "disabled");

  return NextResponse.json({ ok: true, enabled: parsed.data.enabled });
}
