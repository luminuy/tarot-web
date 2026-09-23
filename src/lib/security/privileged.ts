import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/auth/session";
import { TESTER_COOKIE_NAME, verifyTesterSessionLive } from "@/lib/auth/tester-auth";
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

/**
 * อีเมลในคุกกี้ต้อง "ยืนยันแล้ว" ตามฐานข้อมูลจริงก่อนให้สิทธิ์ไม่จำกัด (A1-11)
 * ⚠️ เดิมดูแค่อีเมลในคุกกี้ ซึ่งการสมัครด้วยอีเมลออกคุกกี้ให้ทันทีตอน `email_verified = 0`
 *    ใครก็สมัครด้วยอีเมลหุ้นส่วนที่ยังไม่เคยสมัคร (หรือเคยลบบัญชีไป) แล้วได้สิทธิ์ข้ามเพดาน
 *    ค่า AI รายวันทันที = เผาโควตา Groq/Gemini ของเว็บได้ไม่จำกัด
 */
async function ownsVerifiedEmail(userId: string, email: string): Promise<boolean> {
  try {
    const [{ getCachedUser }, { getUserById, normalizeEmail }] = await Promise.all([
      import("@/lib/auth/user-cache"),
      import("@/lib/users/users.repo"),
    ]);
    const dbUser = await getCachedUser(userId, getUserById);
    return !!dbUser?.emailVerified && !!dbUser.email && normalizeEmail(dbUser.email) === normalizeEmail(email);
  } catch {
    return false; // อ่านฐานข้อมูลไม่ได้ = ไม่ให้สิทธิ์พิเศษ (ผู้ใช้ยังใช้เว็บได้ตามเพดานปกติ)
  }
}

/**
 * true = "ผู้ทดสอบที่ได้รับอนุญาต" — ข้าม: rate limit ต่อ IP, concurrency, global spend cap, origin guard
 * ไม่ข้าม: safety checkQuestion, provably-fair integrity, body-size cap, auth ของ feature อื่น
 * 4 ทางเข้า:
 *   1) cookie แอดมิน `tarot_admin` (ล็อกอินที่ /admin) — ทดสอบผ่านเบราว์เซอร์
 *   2) cookie ผู้ทดสอบ `tarot_tester` (ล็อกอินที่ /tester) — หุ้นส่วน/ทีมงานใช้เว็บไม่จำกัด โดยไม่เห็นแผงแอดมิน
 *   3) บัญชีจริงที่อีเมลอยู่ใน `UNLIMITED_EMAILS` **และยืนยันอีเมลแล้ว** — ล็อกอินปกติ (Google/LINE/อีเมล) แล้วใช้ไม่จำกัด
 *   4) header `X-Tarot-Bypass: <RATE_LIMIT_BYPASS_TOKEN>` — curl / โหลดเทสต์ / CI
 * ทุกครั้งที่ใช้ → บันทึกลง stats (เห็นใน /admin)
 */
export async function isPrivilegedTestRequest(request: Request): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    // ⚠️ tarot_admin เป็น cookie แอดมินสำหรับเข้าใช้งานแผง /admin เท่านั้น
    // ต้องแยกขาดจากหน้าเว็บฝั่งผู้ใช้ ไม่นำมาใช้ตรวจสอบสิทธิ์ในหน้าเว็บทั่วไปเด็ดขาด
    const testerCookie = cookieStore.get(TESTER_COOKIE_NAME)?.value;
    // ต้องตรวจ allowlist ด้วย (T-15) — คุกกี้ที่ถูกถอนแล้วยังผ่านลายเซ็นได้
    if (testerCookie && (await verifyTesterSessionLive(testerCookie))) {
      recordEvent("ratelimit_bypass:tester");
      return true;
    }
    const user = await getSessionUser();
    if (user?.email && isUnlimitedEmail(user.email) && (await ownsVerifiedEmail(user.id, user.email))) {
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
