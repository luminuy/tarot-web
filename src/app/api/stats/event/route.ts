import { NextResponse } from "next/server";
import { z } from "zod";

import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { recordEvent } from "@/lib/stats/record";

export const runtime = "nodejs";

/**
 * POST /api/stats/event — ให้ UI บันทึก event เชิงพฤติกรรมได้ (ผ่าน allowlist เท่านั้น)
 * ห้ามรับ metric อิสระ — กัน abuse ทำ KV counter บวม
 */
const ALLOWED = new Set([
  "signup_card_shown",
  "signup_card_clicked",
  "signup_card_dismissed",
]);

const Body = z.object({ name: z.string().max(60) });

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาต" }, { status: 403 });
  }
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !ALLOWED.has(parsed.data.name)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  recordEvent(parsed.data.name);
  return NextResponse.json({ ok: true });
}
