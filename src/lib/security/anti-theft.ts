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
  if (secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none") {
    return true;
  }

  // อนุญาต localhost / preview ใน dev mode
  const host = request.headers.get("host") || "";
  if (host.includes("localhost") || host.includes("127.0.0.1") || host.includes(".workers.dev") || host.includes("luminuy.com")) {
    return true;
  }

  if (origin) {
    if (origin.includes("localhost") || origin.includes("workers.dev") || origin.includes("luminuy.com")) {
      return true;
    }
    // Cross-origin ที่ไม่ได้รับอนุญาต
    return false;
  }

  if (referer) {
    if (referer.includes("localhost") || referer.includes("workers.dev") || referer.includes("luminuy.com")) {
      return true;
    }
  }

  // ปล่อยผ่านสำหรับ request ที่ไม่มี origin header เช่น mobile native webview
  return true;
}
