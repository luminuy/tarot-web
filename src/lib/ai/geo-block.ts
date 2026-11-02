/**
 * 🌏 แยก "ผู้ให้บริการ AI บล็อกเขตที่ Worker รันอยู่" ออกจากความผิดพลาดอื่น (INC-0314)
 * ---------------------------------------------------------------------------
 * อาการ (2026-11-01): Claude ตอบ 403 `{"error":{"type":"forbidden","message":"Request not allowed"}}`
 * แล้ว Gemini ล้มทุกโมเดลในวินาทีเดียวกัน ➔ คำอ่านตกไปใช้ตัวสำรองในเครื่อง
 * สาเหตุ: Worker รันในศูนย์ข้อมูลที่ใกล้ผู้ใช้ที่สุด ผู้ใช้ไทยบางเครือข่ายถูกส่งไปฮ่องกง (HKG)
 * ซึ่ง Anthropic / Gemini / OpenAI ไม่เปิดให้ใช้ ➔ ล้มพร้อมกันทุกเจ้า
 * แก้หลัก: `placement.region` ใน `wrangler.jsonc` ให้ Worker รันใกล้สิงคโปร์เสมอ
 * ไฟล์นี้: ใส่รหัสศูนย์ข้อมูลใน log + นับเหตุการณ์ ให้รู้ทันทีถ้ากลับมาเกิดอีก (เดิม log ไม่บอกว่ารันที่ไหน)
 */
import { currentColo } from "@/lib/platform/cf";
import { recordEvent } from "@/lib/stats/record";

/**
 * คำตอบที่ปฏิเสธเพราะที่ตั้งของผู้เรียก
 * - Anthropic: 403 "Request not allowed"
 * - Gemini: 400 FAILED_PRECONDITION "User location is not supported for the API use."
 * - OpenAI / Groq / OpenRouter: 403 "unsupported_country_region_territory" / "Country, region, or territory not supported"
 */
export function isGeoBlockedAiResponse(status: number, body: string): boolean {
  if (status === 403 && /Request not allowed|unsupported_country|region, or territory not supported/i.test(body)) return true;
  if (status === 400 && /location is not supported/i.test(body)) return true;
  return false;
}

/**
 * เรียกตอนผู้ให้บริการตอบไม่สำเร็จ — คืนข้อความ " colo=XXX[ geo-blocked]" ไว้ต่อท้าย log
 * และนับ `ai_geo_block:<provider>` เมื่อเป็นการบล็อกตามเขต
 */
export async function aiFailureContext(provider: "claude" | "gemini" | "groq" | "openrouter", status: number, body: string): Promise<{ note: string; geoBlocked: boolean }> {
  const colo = await currentColo().catch(() => null);
  const geoBlocked = isGeoBlockedAiResponse(status, body);
  if (geoBlocked) recordEvent(`ai_geo_block:${provider}`);
  return { note: `${colo ? ` colo=${colo}` : ""}${geoBlocked ? " geo-blocked" : ""}`, geoBlocked };
}
