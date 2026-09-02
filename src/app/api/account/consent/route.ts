import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth/session";
import { setMarketingConsent } from "@/lib/users/users.repo";

export const runtime = "nodejs";

const ConsentSchema = z.object({
  marketing: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const parsed = ConsentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "รูปแบบข้อมูลความยินยอมไม่ถูกต้อง" }, { status: 400 });
    }

    await setMarketingConsent(user.id, parsed.data.marketing);
    return NextResponse.json({ success: true, marketing: parsed.data.marketing });
  } catch (error) {
    console.error("[Marketing Consent API Error]:", error);
    return NextResponse.json({ error: "ไม่สามารถบันทึกความยินยอมได้" }, { status: 500 });
  }
}
