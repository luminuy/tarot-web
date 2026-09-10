/**
 * Speculation Rules — กฎอุ่นหน้าล่วงหน้าของเบราว์เซอร์ (ชั้นที่ Next คุมไม่ถึง)
 * ---------------------------------------------------------------------------
 * ⚠️ อ่านก่อนแก้ — บทเรียน INC-0106 และรอบสองของมัน
 *
 * ตอน INC-0106 เราไล่ปิด `prefetch={false}` ทั่วเว็บเพราะลิงก์ที่ prefetch ยิงถามผัง
 * เส้นทางวนไม่หยุด **แต่ชั้นนี้ถูกลืม** — Speculation Rules เป็นกฎที่เราสั่งเบราว์เซอร์
 * ตรง ๆ ผ่าน `<script type="speculationrules">` มันไม่สนใจ `prefetch={false}` ของ Next
 * เลยแม้แต่นิดเดียว จึงยังยิงคำขอต่อไปเงียบ ๆ หลังปิด prefetch ฝั่ง Next ไปแล้ว
 *
 * ต้นทุนจริงของแต่ละ eagerness (ทุกคำขอที่ยิงออกไป = ปลุก Worker 1 ครั้ง = เสียเงิน):
 *
 *   eager        ยิงทันทีที่เจอลิงก์ — ห้ามใช้เด็ดขาด
 *   moderate     ยิงตอนเมาส์ชี้ (~200ms) — บนกฎแบบ document (`where`) แปลว่า
 *                **ทุกลิงก์ในหน้า** หน้าแรกมีลิงก์ภายใน 40 เส้น `/cards` มากกว่านั้นอีก
 *                และเพดานของ Chrome คือ 50 เส้น/หน้า → เลื่อนอ่านเฉย ๆ เมาส์ผ่านไปเรื่อย
 *                ก็ยิงได้หลักสิบคำขอ ทั้งที่ผู้ใช้คลิกจริงแค่เส้นเดียว
 *   conservative ยิงตอนกดเมาส์ลง/แตะ — ผู้ใช้ตัดสินใจจะไปแล้ว คำขอที่ทิ้งเปล่าจึงเกือบเป็นศูนย์
 *                แต่ยังได้เปรียบเวลาราว 150ms ซึ่งเพียงพอให้รู้สึกว่าเปลี่ยนหน้าไว
 *
 * ────────────────────────────────────────────────────────────────
 * กติกาของบ้านนี้ (ด่านที่ 38 บังคับ — ดู scripts/qa/test-prefetch-loop.ts)
 *
 *  1. `prerender` ใช้ได้เฉพาะแบบ **รายการปิด** (`source: "list"`) เท่านั้น
 *     เพราะ prerender ไม่ได้แค่ดาวน์โหลด HTML — มัน **รัน JS ของทั้งหน้า** ด้วย
 *     (หน้าที่ถูก prerender จะยิง `/api/bootstrap` ของมันเองอีกเส้น)
 *     ถ้าปล่อยเป็นกฎแบบ document (`where`) ที่ครอบ `/*` ต้นทุนจะไม่มีเพดาน
 *  2. กฎแบบ document (`where`) ต้องเป็น `conservative` เท่านั้น
 *  3. ห้ามใช้ `eager` ทุกกรณี
 *  4. รายการ prerender ต้องไม่เกิน MAX_PRERENDER_LIST_URLS หน้า
 *
 * 🔬 วิธีวัดซ้ำด้วยมือ: เปิด DevTools ▸ Network กรอง `Doc` แล้วลากเมาส์ผ่านลิงก์ในหน้า
 *    ถ้ามีคำขอโผล่ตอน "ชี้" (ยังไม่กด) แปลว่ามีกฎไหนกลับไปเป็น moderate/eager แล้ว
 */

/** เส้นทางที่ห้ามอุ่นล่วงหน้าเด็ดขาด — เป็นเส้นไดนามิก/ต้องล็อกอิน อุ่นไปก็ใช้ไม่ได้ */
export const SPECULATION_EXCLUDED_PATHS = [
  "/api/*",
  "/admin/*",
  "/account/*",
  "/readers/console*",
  "/readers/queue/*",
] as const;

/** เพดานจำนวนหน้าในรายการ prerender — กันไม่ให้ค่อย ๆ บวมจนกลายเป็นกฎครอบทั้งเว็บ */
export const MAX_PRERENDER_LIST_URLS = 6;

/** หน้ายอดนิยมที่คุ้มค่าจะ prerender (ผู้ใช้เกือบทุกคนไปต่อที่หน้าเหล่านี้) */
export const PRERENDER_URLS_TH = ["/", "/cards", "/spreads", "/blog", "/daily"];
export const PRERENDER_URLS_EN = ["/en", "/en/cards", "/en/spreads", "/en/daily"];

type Eagerness = "conservative" | "moderate" | "eager";

type ListRule = { source: "list"; urls: string[]; eagerness: Eagerness };
type DocumentRule = {
  where: { and: ({ href_matches: string } | { not: { href_matches: string } })[] };
  eagerness: Eagerness;
};

export type SpeculationRules = {
  prerender: ListRule[];
  prefetch: DocumentRule[];
};

/** ลิงก์ภายในทั้งเว็บ ยกเว้นเส้นไดนามิก/ต้องล็อกอิน */
function internalLinksExcept(): DocumentRule["where"] {
  return {
    and: [
      { href_matches: "/*" },
      ...SPECULATION_EXCLUDED_PATHS.map((path) => ({ not: { href_matches: path } })),
    ],
  };
}

export function buildSpeculationRules(isEnglish: boolean): SpeculationRules {
  return {
    // รายการปิด: อุ่นเต็มรูปแบบเฉพาะหน้ายอดนิยม (Chrome จำกัด prerender ที่ 2 หน้าพร้อมกัน
    // สำหรับ moderate อยู่แล้ว ต้นทุนจึงมีเพดานชัดเจน แลกกับการเปลี่ยนหน้าแบบ 0ms)
    prerender: [
      {
        source: "list",
        urls: isEnglish ? PRERENDER_URLS_EN : PRERENDER_URLS_TH,
        eagerness: "moderate",
      },
    ],
    // ลิงก์ที่เหลือทั้งเว็บ: ดึงแค่ HTML และเฉพาะตอนผู้ใช้กดลงไปแล้ว
    prefetch: [{ where: internalLinksExcept(), eagerness: "conservative" }],
  };
}
