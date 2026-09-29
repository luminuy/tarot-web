/**
 * แปลงข้อความผิดพลาดดิบให้เป็นภาษาคน — ผู้ใช้ไม่ควรเห็น "Failed to fetch" หรือข้อความอังกฤษจากเครื่องยนต์
 * ข้อความภาษาไทยจากหลังบ้าน (เช่น "โควตาวันนี้หมดแล้ว") ผ่านไปตามเดิม เพราะเขียนมาให้คนอ่านอยู่แล้ว
 */
const NETWORK = /failed to fetch|network request failed|networkerror|load failed|timed? ?out|aborted|offline/i;
const HAS_THAI = /[฀-๿]/;

export const OFFLINE_MESSAGE = "เชื่อมต่ออินเทอร์เน็ตไม่ได้ ตรวจสัญญาณแล้วลองใหม่อีกครั้งนะ";

export function friendlyMessage(raw: unknown, fallback = "เกิดข้อผิดพลาด ลองใหม่อีกครั้งนะ"): string {
  const text = raw instanceof Error ? raw.message : typeof raw === "string" ? raw : "";
  if (!text) return fallback;
  if (NETWORK.test(text)) return OFFLINE_MESSAGE;
  return HAS_THAI.test(text) ? text : fallback;
}
