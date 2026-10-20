/**
 * 🛡️ ด่านกัน CSRF และการเรียกข้ามเว็บ (ไม่ใช่ด่านกันบอท)
 * ---------------------------------------------------------------------------
 * ตรวจ Origin / Fetch Metadata เพื่อกันไม่ให้เว็บไซต์อื่นยิงเรียก API ของเราแทนผู้ใช้
 *
 * ⚠️ **บทเรียน T-14 — อย่าเข้าใจผิดว่านี่คือด่านกันบอทหรือกันการดูดข้อมูล**
 *
 * `sec-fetch-site` เป็นหัวที่ **เบราว์เซอร์** เติมให้เองและสคริปต์ในหน้าเว็บแก้ไม่ได้
 * นั่นทำให้มันกัน CSRF ได้จริง — แต่ `curl -H 'Sec-Fetch-Site: same-origin'` ผ่านทันที
 * เพราะโปรแกรมนอกเบราว์เซอร์ตั้งหัวอะไรก็ได้
 *
 * สรุปสิ่งที่ด่านนี้ทำได้จริง:
 *   ✅ กันเว็บอื่นเรียก API ของเราผ่านเบราว์เซอร์ของผู้ใช้ (CSRF)
 *   ❌ **ไม่กัน** สคริปต์ · บอท · หรือใครก็ตามที่ยิงตรงจากเซิร์ฟเวอร์
 *
 * ปลายทางที่ "เสียเงินจริง" จึงต้องมีด่านอื่นซ้อนอยู่ด้วยเสมอ — เพดานอัตราบน KV
 * (`lib/security/edge-ratelimit.ts`) · โควตาต่อผู้ใช้ · Turnstile · หรือโทเคนที่เซ็นชื่อ
 * ห้ามใช้ฟังก์ชันนี้เป็นด่านเดียวของปลายทางที่เรียกโมเดลหรือแจกสิทธิ์เด็ดขาด
 */

import { isOwnHostname } from "@/lib/config/site";

/**
 * โทเคนเซสชันจากแอป native: `Authorization: Bearer <payload>.<signature>`
 * ตรวจแค่ "รูปร่าง" ที่นี่ (ฟังก์ชันนี้เป็น sync) — ความถูกต้องของลายเซ็นและ token_version
 * ตรวจที่ `getSessionUser()` ทุกครั้ง
 */
const BEARER_TOKEN_SHAPE = /^Bearer [A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;

/** อ่านโทเคน Bearer จากคำขอ — คืน `null` ถ้าไม่มีหัวหรือรูปร่างไม่ใช่โทเคนเซสชัน */
export function readBearerToken(headers: Headers): string | null {
  const value = headers.get("authorization");
  if (!value || !BEARER_TOKEN_SHAPE.test(value)) return null;
  return value.slice("Bearer ".length);
}

/**
 * เส้นทาง "ก่อนล็อกอิน" ที่แอป native เรียกได้ทั้งที่ยังไม่มี Bearer (แอปยังไม่มีโทเคนจนกว่าจะล็อกอินสำเร็จ)
 * ทุกเส้นในรายการนี้ต้องมีด่านกันบอทของตัวเองซ้อนอยู่หลังด่านนี้เสมอ (Turnstile + เพดานครั้งที่ลองต่ออีเมล/IP)
 * ห้ามเพิ่มปลายทางที่เรียกโมเดล แจกสิทธิ์ หรือใช้เงิน — เส้นพวกนั้นแอปต้องล็อกอินก่อน (มี Bearer)
 */
const NATIVE_APP_PRELOGIN_PATHS = new Set(["/api/auth/email/login"]);

/**
 * คำขอก่อนล็อกอินจากแอป native (`X-Client: ios`) — ผ่านด่าน CSRF ได้เฉพาะเมื่อครบทุกข้อ:
 * - เป็น POST ไปยังเส้นใน `NATIVE_APP_PRELOGIN_PATHS` เท่านั้น
 * - **ไม่มี** `Origin` / `Referer` / `Sec-Fetch-Site` เลย — เบราว์เซอร์ส่งหัวเหล่านี้เสมอ
 *   คำขอจากเบราว์เซอร์จึงไม่เข้าทางนี้ และยังถูกตรวจ origin ตามปกติทุกประการ
 * - `X-Client` เป็นหัวที่ไม่ใช่ CORS-safelisted เว็บอื่นตั้งข้ามโดเมนไม่ได้ถ้าเราไม่เปิด CORS ให้หัวนี้
 *   (ห้ามเพิ่ม `x-client` ใน Access-Control-Allow-Headers เด็ดขาด)
 * ช่องทางชั่วคราวจนกว่า App Attest (แผน IOS_APP_PLAN 4.2) พร้อม — ด่านนี้ไม่ใช่ด่านกันบอท (ดูหัวไฟล์)
 */
function isNativeAppPreLoginRequest(request: Request): boolean {
  if (request.method !== "POST") return false;
  if (request.headers.get("x-client") !== "ios") return false;
  if (request.headers.has("origin") || request.headers.has("referer") || request.headers.has("sec-fetch-site")) {
    return false;
  }
  let pathname: string;
  try {
    pathname = new URL(request.url).pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
  return NATIVE_APP_PRELOGIN_PATHS.has(pathname);
}

export function isRequestAuthorizedOrigin(request: Request): boolean {
  // ช่องทางแอป (แผน IOS_APP_PLAN 4.1): ด่านนี้กัน CSRF ซึ่งเกิดจากเบราว์เซอร์แนบคุกกี้ให้เอง
  // หัว Authorization เบราว์เซอร์ไม่แนบให้ และเว็บอื่นตั้งข้ามโดเมนไม่ได้ถ้าเราไม่เปิด CORS
  // จึงไม่มีช่อง CSRF — ห้ามเปิด Access-Control-Allow-Headers: authorization เด็ดขาด
  if (readBearerToken(request.headers)) return true;
  if (isNativeAppPreLoginRequest(request)) return true;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  // อนุญาต same-origin หรือ same-site (กัน CSRF เท่านั้น — ดูคำเตือนหัวไฟล์)
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  const isAllowedHost = (hostname: string) => isOwnHostname(hostname);

  if (origin) {
    try {
      const parsedUrl = new URL(origin);
      if (isAllowedHost(parsedUrl.hostname)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  if (referer) {
    try {
      const parsedUrl = new URL(referer);
      if (isAllowedHost(parsedUrl.hostname)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  // Allow GET/HEAD requests for static navigation; reject origin-less mutating requests (POST, etc.)
  if (request.method === "GET" || request.method === "HEAD") {
    const host = request.headers.get("host") || "";
    if (host && isAllowedHost(host.split(":")[0])) {
      return true;
    }
  }

  return false;
}
