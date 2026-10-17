/**
 * กวาดอิโมจิและสัญลักษณ์ตกแต่งออกจากข้อความที่ผู้ใช้จะเห็น
 * ===========================================================================
 *
 * เจ้าของสั่ง (2026-10-07): หน้าเว็บต้องไม่มีอิโมจิหรือสัญลักษณ์ตกแต่งโผล่ในข้อความเลย
 * รวมถึง ✦ ✨ ที่กฎเหล็กข้อ 2 เคยอนุญาต — ของตกแต่งให้ใช้รูปทรง CSS/SVG แทน
 *
 * ข้อความที่เขียนเองในโค้ดมีด่าน `test-code-debt` (A5-03) เฝ้าอยู่แล้ว
 * แต่ข้อความที่ **AI เขียน** (คำอ่าน · แชท · สรุป) ด่านตรวจโค้ดมองไม่เห็น
 * โมเดลใส่อิโมจิมาเองได้ทุกเมื่อ จึงต้องกวาดตรงทางออกด้วยฟังก์ชันนี้
 *
 * ⚠️ โมดูลบริสุทธิ์ ไม่พึ่ง DOM — ด่าน CI ยิงเคสจริงผ่านฟังก์ชันนี้
 */

/**
 * อิโมจิทุกชนิด (`Extended_Pictographic` ครอบทั้งอิโมจิสีและสัญลักษณ์อย่าง ⚠ ★ ❌)
 * + ธงชาติ · สีผิว · ตัวต่ออิโมจิ (ZWJ · ตัวเลือกรูปแบบ) + ดาวสี่แฉก ✦ ✧
 */
/*
 * + ลูกศร · ติ๊ก/กากบาท · ดาว · รูปทรงเรขาคณิต · dingbats (เจ้าของ 2026-10-16 "อีโมจิอื่น ๆ ด้วยก็ไม่เอา")
 * ⚠️ ไม่รวม "•" — ตัวจัดรูปแบบแชท (format-chat-text) ใช้ "• **หัวข้อ:**" เป็นเครื่องหมายภายในให้คอมโพเนนต์แปลงเป็นการ์ด
 *    ตัวคอมโพเนนต์ตัดจุดนั้นทิ้งเองก่อนแสดง ถ้ากวาดที่นี่ การ์ดหัวข้อในแชทจะหายทั้งหมด
 */
const EMOJI_RUN =
  /[ \t]*(?:[\p{Extended_Pictographic}\p{Regional_Indicator}\u{1F3FB}-\u{1F3FF}\u{FE0E}\u{FE0F}\u{20E3}\u{200D}\u{2726}\u{2727}\u{2190}-\u{21FF}\u{2700}-\u{27BF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}])+[ \t]*/gu;

const HAS_EMOJI = /[\p{Extended_Pictographic}\p{Regional_Indicator}\u{2726}\u{2727}\u{FE0F}\u{2190}-\u{21FF}\u{2700}-\u{27BF}\u{25A0}-\u{25FF}\u{2B00}-\u{2BFF}]/u;

/** มีอิโมจิ/สัญลักษณ์ตกแต่งที่หน้าเว็บห้ามแสดงหรือไม่ */
export function hasEmoji(text: string): boolean {
  return HAS_EMOJI.test(text);
}

/**
 * ตัดอิโมจิออกโดยไม่ทิ้งช่องว่างเกิน
 * - ต้นบรรทัด/ท้ายบรรทัด ➔ ตัดช่องว่างที่ติดมาทิ้งด้วย ("🧘 ฝึกสติ" ➔ "ฝึกสติ")
 * - กลางประโยค ➔ เหลือช่องว่างเดียว ("SeerTarot ✨ เปิดไพ่" ➔ "SeerTarot เปิดไพ่")
 */
export function stripEmoji(text: string): string {
  if (!HAS_EMOJI.test(text)) return text;
  return text.replace(EMOJI_RUN, (match, offset: number, whole: string) => {
    const atLineStart = offset === 0 || whole[offset - 1] === "\n";
    const end = offset + match.length;
    const atLineEnd = end >= whole.length || whole[end] === "\n";
    return atLineStart || atLineEnd ? "" : " ";
  });
}

/** กวาดทุกสตริงในก้อนข้อมูล (คำอ่านทั้งก้อน · การ์ดรายใบ · อาร์เรย์คำแนะนำ) — คืนชนิดเดิม */
export function stripEmojiDeep<T>(value: T): T {
  if (typeof value === "string") return stripEmoji(value) as T;
  if (Array.isArray(value)) return value.map((v) => stripEmojiDeep(v)) as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = stripEmojiDeep(v);
    return out as T;
  }
  return value;
}
