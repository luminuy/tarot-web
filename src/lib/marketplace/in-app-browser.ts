/**
 * 📱 เบราว์เซอร์ที่ฝังอยู่ในแอป (LINE · Facebook · Instagram · TikTok) — ตรรกะบริสุทธิ์ ไม่แตะ DOM
 * ---------------------------------------------------------------------------
 * ลูกค้าแม่หมอส่วนใหญ่มาจากลิงก์ในแชต LINE หรือคลิป TikTok จึงเปิดเว็บใน "เบราว์เซอร์ของแอป" ซึ่ง:
 *   1. มีคุกกี้แยกจาก Safari/Chrome — จองในแอป LINE แล้วเปิดลิงก์คิวจากปฏิทิน (เปิดใน Safari) = ไม่เจอนัด
 *   2. บางแอปไม่ให้หน้าเว็บขอกล้อง/ไมโครโฟน — วิดีโอคอลเปิดไม่ได้
 * (CONSULT_FLOW_UX_PLAN P6 · P7)
 *
 * ทางออก: พาไปเปิดใน Safari/Chrome **พร้อมลิงก์นัดส่วนตัว** (ลิงก์เซ็นชุดเดียวกับอีเมลยืนยัน) ให้นัดตามไปด้วย
 * - LINE รองรับพารามิเตอร์ `openExternalBrowser=1` — เปิดลิงก์นั้นในเบราว์เซอร์หลักของเครื่องให้เอง
 * - แอปอื่นไม่มีทางสั่งจากหน้าเว็บ ➔ บอกวิธีกดเปิดเอง + ปุ่มคัดลอกลิงก์
 */

export type InAppBrowser = "line" | "facebook" | "instagram" | "tiktok";

/** อ่านจาก user agent — คืน null เมื่อเป็นเบราว์เซอร์ปกติ */
export function detectInAppBrowser(userAgent: string | null | undefined): InAppBrowser | null {
  const ua = userAgent ?? "";
  if (!ua) return null;
  // LINE: "... Safari Line/14.9.0" (iOS) · "... Line/14.9.0/IAB" (Android) — ตัวพิมพ์ใหญ่ L เสมอ
  if (/\bLine\/\d/.test(ua)) return "line";
  // Instagram ต้องมาก่อน Facebook — UA ของ Instagram บนบางเครื่องมีคำว่า FBAN ปนด้วย
  if (/\bInstagram\b/.test(ua)) return "instagram";
  if (/\bFBA[NV]\/|\bFB_IAB\b|\bFBIOS\b|\bFB4A\b/.test(ua)) return "facebook";
  if (/BytedanceWebview|musical_ly|\bTikTok\b|\btrill_\d/i.test(ua)) return "tiktok";
  return null;
}

export const IN_APP_BROWSER_LABEL: Record<InAppBrowser, string> = {
  line: "LINE",
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
};

/** ลิงก์ที่แอป LINE จะเปิดใน Safari/Chrome ให้เอง (คงพารามิเตอร์เดิมไว้ครบ) */
export function withLineExternalBrowser(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("openExternalBrowser", "1");
    return u.toString();
  } catch {
    return url;
  }
}
