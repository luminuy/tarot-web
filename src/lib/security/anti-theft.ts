/**
 * 🛡️ Anti-Theft & Scraping Guard for Serverless Edge
 *
 * ตรวจสอบ Origin / Fetch Metadata ป้องกันไม่ให้เว็บไซต์อื่นหรือบอทภายนอก
 * ยิงเรียกใช้งาน AI Engine API หรือดูดข้อมูลคำทำนายไปใช้โดยไม่ได้รับอนุญาต
 */
export function isRequestAuthorizedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  // อนุญาต same-origin หรือ same-site
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return true;
  }

  const isAllowedHost = (hostname: string) => {
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".workers.dev") ||
      hostname === "luminuy.com" ||
      hostname.endsWith(".luminuy.com")
    );
  };

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

  const host = request.headers.get("host") || "";
  if (host && isAllowedHost(host.split(":")[0])) {
    return true;
  }

  // Allow GET requests for static navigation; reject origin-less POST requests from external callers
  return request.method === "GET";
}
