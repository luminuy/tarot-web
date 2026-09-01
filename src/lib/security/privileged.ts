import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth/admin-auth";
import { TESTER_COOKIE_NAME, verifyTesterSession } from "@/lib/auth/tester-auth";
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
 * 3 ทางเข้า:
 *   1) cookie แอดมิน `tarot_admin` (ล็อกอินที่ /admin) — ทดสอบผ่านเบราว์เซอร์
 *   2) cookie ผู้ทดสอบ `tarot_tester` (ล็อกอินที่ /tester) — หุ้นส่วน/ทีมงานใช้เว็บไม่จำกัด โดยไม่เห็นแผงแอดมิน
 *   3) header `X-Tarot-Bypass: <RATE_LIMIT_BYPASS_TOKEN>` — curl / โหลดเทสต์ / CI
 * ทุกครั้งที่ใช้ → บันทึกลง stats (เห็นใน /admin)
 */
export async function isPrivilegedTestRequest(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (adminCookie && verifyAdminSession(adminCookie)) {
      recordEvent("ratelimit_bypass:admin");
      return true;
    }
    const testerCookie = cookieStore.get(TESTER_COOKIE_NAME)?.value;
    if (testerCookie && verifyTesterSession(testerCookie)) {
      recordEvent("ratelimit_bypass:tester");
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
