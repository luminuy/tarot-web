import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { redeemCodeForUser } from "@/lib/entitlement/redeem";
import { getEntitlementSnapshot } from "@/lib/entitlement/snapshot";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json(
      { error: "กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเพื่อนำสิทธิ์ไปผูกกับบัญชีของคุณ" },
      { status: 401 },
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "ข้อมูลคำขอไม่ถูกต้อง" }, { status: 400 });
  }

  const code = (body.code ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "กรุณาระบุรหัสแลกสิทธิ์" }, { status: 400 });
  }

  const result = await redeemCodeForUser(sessionUser.id, code);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const entitlement = await getEntitlementSnapshot(request);

  return NextResponse.json({
    ok: true,
    message: `แลกรับสิทธิ์สำเร็จ คุณได้รับสิทธิ์เปิดไพ่ทุกอย่างในเว็บจำนวน ${result.credits} ครั้ง`,
    credits: result.credits,
    code: result.code,
    title: result.title,
    entitlement,
  });
}
