/**
 * 🌐 ข้อความผิดพลาดที่ผู้ใช้อ่านรู้เรื่อง — ตัวช่วยกลางของท่อเปิดไพ่ (A4-04)
 * ===========================================================================
 *
 * `fetch` ที่ล้มเพราะออฟไลน์/สัญญาณหลุดโยน `TypeError` ที่มีข้อความดิบของเบราว์เซอร์
 * ("Failed to fetch" · "Load failed" · "NetworkError when attempting to fetch resource.")
 * ถ้าเอา `err.message` ขึ้นจอตรง ๆ ผู้ใช้จะเห็นภาษาที่ไม่ตรงกับหน้าและไม่รู้ว่าต้องทำอะไร
 * ตัวนี้แปลงเฉพาะกรณีเครือข่ายเป็นข้อความสองภาษา ส่วนข้อความที่เซิร์ฟเวอร์ตั้งใจส่งมา (`data.error`)
 * ผ่านไปตรง ๆ เหมือนเดิม
 *
 * ⚠️ ไฟล์นี้เบาและไม่พึ่ง React — ใช้ได้ทั้งใน `TarotFlow` และ `use-ai-reading`
 */

const NETWORK_MESSAGE_RE =
  /failed to fetch|load failed|networkerror|network error|network request failed|network connection was lost|internet connection appears to be offline|fetch failed|err_network|err_internet|error in input stream/i;

/** `fetch` / การอ่านสตรีมล้มเพราะเครือข่าย (ไม่ใช่เซิร์ฟเวอร์ตอบผิดหรือผู้ใช้ยกเลิกเอง) */
export function isNetworkFailure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  // ทุกเอนจินโยน TypeError เมื่อ fetch หรือการอ่านสตรีมล้มจากเครือข่าย
  if (err instanceof TypeError) return true;
  const { name, message } = err as { name?: unknown; message?: unknown };
  if (name === "NetworkError" || name === "TimeoutError") return true;
  return typeof message === "string" && NETWORK_MESSAGE_RE.test(message);
}

export const NETWORK_ERROR_TH = "สัญญาณอินเทอร์เน็ตสะดุด ลองอีกครั้งนะคะ";
export const NETWORK_ERROR_EN = "Your connection dropped. Please check your internet and try again.";

/**
 * ข้อความที่จะขึ้นจอสำหรับข้อผิดพลาดหนึ่งครั้ง
 * - เครือข่ายล้ม ➔ ข้อความสองภาษาของหน้า
 * - ยกเลิกเอง (`AbortError`) ➔ ข้อความสำรอง (ปกติผู้เรียกดักไว้ก่อนแล้ว)
 * - นอกนั้น ➔ `err.message` ที่เซิร์ฟเวอร์ส่งมา ถ้าว่างใช้ข้อความสำรอง
 */
export function friendlyError(err: unknown, isEnglish: boolean, fallback: string): string {
  if ((err as { name?: unknown } | null)?.name === "AbortError") return fallback;
  if (isNetworkFailure(err)) return isEnglish ? NETWORK_ERROR_EN : NETWORK_ERROR_TH;
  const message = err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return message.trim() || fallback;
}
