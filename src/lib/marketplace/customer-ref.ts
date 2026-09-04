import { cookies } from "next/headers";
import { signPayload, verifyPayload } from "@/lib/auth/edge-auth";

export const CUSTOMER_REF_COOKIE = "tarot_customer_ref";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 วัน — คิวมีอายุสั้นกว่านี้มาก

/**
 * ⚠️ `customerRef` คือความลับแบบ bearer (ใครถือ = เป็นเจ้าของตั๋ว)
 * ห้ามรับผ่าน query string หรือ body เพื่อ "อ่าน" ข้อมูลเด็ดขาด — ต้องมาจาก cookie ที่เราเซ็นเองเท่านั้น
 * เหตุผล: คำถามดูดวงเป็นข้อมูลอ่อนไหวตาม PDPA · ค่าใน URL รั่วผ่าน access log / Referer / ประวัติเบราว์เซอร์
 */
export async function readCustomerRefFromCookie(request?: Request): Promise<string | null> {
  let token: string | undefined;
  if (request) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(new RegExp(`(?:^|; )${CUSTOMER_REF_COOKIE}=([^;]*)`));
    token = match ? decodeURIComponent(match[1]) : undefined;
  }
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(CUSTOMER_REF_COOKIE)?.value;
    } catch {
      // Not in a Next.js request context (e.g. standalone test runner)
    }
  }
  if (!token) return null;
  const payload = await verifyPayload<{ ref?: string }>(token);
  return typeof payload?.ref === "string" && payload.ref.length >= 6 ? payload.ref : null;
}

/** ปั๊ม cookie ให้ response — เรียกตอนสร้างตั๋วสำเร็จเท่านั้น */
export async function attachCustomerRefCookie(res: Response, ref: string): Promise<Response> {
  const token = await signPayload({ ref });
  res.headers.append(
    "Set-Cookie",
    `${CUSTOMER_REF_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SEC}` +
      (process.env.NODE_ENV === "production" ? "; Secure" : "")
  );
  return res;
}
