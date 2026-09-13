/**
 * 🛡️ Anti-Theft & Scraping Guard for Serverless Edge
 *
 * ตรวจสอบ Origin / Fetch Metadata ป้องกันไม่ให้เว็บไซต์อื่นหรือบอทภายนอก
 * ยิงเรียกใช้งาน AI Engine API หรือดูดข้อมูลคำทำนายไปใช้โดยไม่ได้รับอนุญาต
 */

import { isOwnHostname } from "@/lib/config/site";
export function isRequestAuthorizedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  // อนุญาต same-origin หรือ same-site
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
