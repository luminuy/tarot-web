import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { TESTER_COOKIE_NAME, verifyTesterSession } from "@/lib/auth/tester-auth";
import { isUnlimitedEmail } from "@/lib/auth/unlimited-users";
import { recordEvent } from "@/lib/stats/record";

const MIN_BYPASS_LEN = 24;
const BYPASS_HEADER = "x-tarot-bypass";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    timingSafeEqual(bb, bb);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function isBypassConfigured(): boolean {
  return (process.env.RATE_LIMIT_BYPASS_TOKEN ?? "").trim().length >= MIN_BYPASS_LEN;
}

/**
 * true = "ผู้ทดสอบที่ได้รับอนุญาต" — ข้าม: rate limit ต่อ IP, concurrency, global spend cap, origin guard
 * ไม่ข้าม: safety checkQuestion, provably-fair integrity, body-size cap, auth ของ feature อื่น
 * 4 ทางเข้า:
 *   1) cookie แอดมิน `tarot_admin` (ล็อกอินที่ /admin) — ทดสอบผ่านเบราว์เซอร์
 *   2) cookie ผู้ทดสอบ `tarot_tester` (ล็อกอินที่ /tester) — หุ้นส่วน/ทีมงานใช้เว็บไม่จำกัด โดยไม่เห็นแผงแอดมิน
 *   3) บัญชีจริงที่อีเมลอยู่ใน `UNLIMITED_EMAILS` — ล็อกอินปกติผ่านหน้าต่างเข้าสู่ระบบ (Google/LINE/อีเมล) แล้วใช้ไม่จำกัด
 *   4) header `X-Tarot-Bypass: <RATE_LIMIT_BYPASS_TOKEN>` — curl / โหลดเทสต์ / CI
 * ทุกครั้งที่ใช้ → บันทึกลง stats (เห็นใน /admin)
 */
export async function isPrivilegedTestRequest(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    // ⚠️ tarot_admin เป็น cookie แอดมินสำหรับเข้าใช้งานแผง /admin เท่านั้น
    // ต้องแยกขาดจากหน้าเว็บฝั่งผู้ใช้ ไม่นำมาใช้ตรวจสอบสิทธิ์ในหน้าเว็บทั่วไปเด็ดขาด
    const testerCookie = cookieStore.get(TESTER_COOKIE_NAME)?.value;
    if (testerCookie && verifyTesterSession(testerCookie)) {
      recordEvent("ratelimit_bypass:tester");
      return true;
    }
    const user = await getSessionUser();
    if (user?.email && isUnlimitedEmail(user.email)) {
      recordEvent("ratelimit_bypass:unlimited_user");
      return true;
    }
  } catch {
    // cookies() may fail in certain environments/contexts
  }

  const provided = request.headers.get(BYPASS_HEADER) ?? "";
  const expected = (process.env.RATE_LIMIT_BYPASS_TOKEN ?? "").trim();
  if (expected.length >= MIN_BYPASS_LEN && safeEqual(provided, expected)) {
    recordEvent("ratelimit_bypass:token");
    return true;
  }

  return false;
}
