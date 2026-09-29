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

export function isRequestAuthorizedOrigin(request: Request): boolean {
  // ช่องทางแอป (แผน IOS_APP_PLAN 4.1): ด่านนี้กัน CSRF ซึ่งเกิดจากเบราว์เซอร์แนบคุกกี้ให้เอง
  // หัว Authorization เบราว์เซอร์ไม่แนบให้ และเว็บอื่นตั้งข้ามโดเมนไม่ได้ถ้าเราไม่เปิด CORS
  // จึงไม่มีช่อง CSRF — ห้ามเปิด Access-Control-Allow-Headers: authorization เด็ดขาด
  if (readBearerToken(request.headers)) return true;

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
