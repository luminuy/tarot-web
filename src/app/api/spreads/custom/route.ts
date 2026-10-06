import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { parseCustomSpread } from "@/lib/tarot/custom-spread.server";
import { createCustomSpread, CUSTOM_SPREADS_PER_USER, listCustomSpreads } from "@/lib/tarot/custom-spread.repo";

export const runtime = "nodejs";

/**
 * ✦ GET/POST /api/spreads/custom — ผังที่ออกแบบเอง (REFLECTION_JOURNAL_PLAN 1.8)
 * สมาชิกเท่านั้นที่บันทึกลงบัญชี (ผู้เยี่ยมชมเก็บไว้ในเครื่องตัวเอง) · ตรวจด่านเดียวกับ `/start` ทุกครั้ง
 */
export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ", spreads: [] }, { status: 401 });
  const spreads = await listCustomSpreads(user.id);
  return NextResponse.json({ spreads, limit: CUSTOM_SPREADS_PER_USER }, { headers: { "Cache-Control": "no-store, private" } });
}

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { spread?: unknown; lang?: unknown };
  const lang = body.lang === "en" ? "en" : "th";
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json(
      { error: lang === "en" ? "Sign in to save spreads to your account." : "เข้าสู่ระบบเพื่อบันทึกผังไว้ในบัญชี" },
      { status: 401 },
    );
  }

  const gate = checkRateLimit(`custom_spread_write:${user.id}`, { maxRequests: 20, windowSeconds: 60 });
  if (!gate.allowed) return createRateLimitResponse(gate.retryAfterSeconds, lang === "en" ? "Too many saves — please wait a moment." : "บันทึกถี่เกินไป กรุณารอสักครู่");

  const parsed = parseCustomSpread(body.spread, lang);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const saved = await createCustomSpread(user.id, parsed.input);
  if (!saved) {
    return NextResponse.json(
      {
        error:
          lang === "en"
            ? `You can keep up to ${CUSTOM_SPREADS_PER_USER} spreads — delete one you no longer use first.`
            : `เก็บผังได้สูงสุด ${CUSTOM_SPREADS_PER_USER} ผัง ลบผังที่ไม่ได้ใช้ก่อนนะ`,
      },
      { status: 409 },
    );
  }
  return NextResponse.json({ spread: saved, warnings: parsed.warnings }, { status: 201 });
}
