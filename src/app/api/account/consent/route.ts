import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { verifyUserSession } from "@/lib/auth/edge-auth";
import { setMarketingConsent } from "@/lib/users/users.repo";

export const runtime = "nodejs";

const ConsentSchema = z.object({
  marketing: z.boolean(),
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("tarot_auth_session")?.value;
    if (!token) {
      return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อนตั้งค่าความยินยอม" }, { status: 401 });
    }

    const user = await verifyUserSession(token);
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
