/**
 * ✦ ตารางคู่ไพ่ที่นักอ่านไพ่ใช้กันจริง (Curated Card Combinations) — แผน REFLECTION_JOURNAL_PLAN 1.1 ชั้นที่ 2
 * ---------------------------------------------------------------------------
 * ใช้เป็นแหล่งหลักฐาน `curated` ของ `src/lib/tarot/relations.ts` — **เฉพาะแถวที่คนตรวจแล้วเท่านั้น**
 *
 * ⚠️ สถานะ: ร่างตั้งต้น ~60 คู่โดยทีมพัฒนา จากความหมายคู่ไพ่ที่ใช้กันแพร่หลายในวงการ Rider-Waite
 *    ทุกแถวยังเป็น `reviewedBy: "pending"` ➔ `relations.ts` **ข้ามทั้งหมด** ผู้ใช้ยังไม่เห็นสักแถว
 *    และยังไม่ถูกส่งเข้า prompt — ต้องให้แม่หมอใน Marketplace ตรวจทีละแถวก่อน
 * ⚠️ ห้ามให้ AI สร้าง/เติม/แก้ตารางนี้ (แผน 1.1) — แก้ด้วยมือ และใส่ชื่อผู้ตรวจจริงทุกครั้ง
 *
 * วิธีตรวจ (สำหรับแม่หมอผู้ตรวจ):
 *   1. อ่าน noteTh / noteEn ว่าตรงกับที่ใช้อ่านจริงไหม แก้ถ้อยคำได้ (≤ 120 ตัวอักษร · ห้ามคำฟันธงอนาคต)
 *   2. ตรวจ `kind` — support = เสริมกัน · tension = ดึงกันคนละทาง · echo = สะท้อนเรื่องเดียวกัน
 *   3. ตรวจ `orientation` — "upright" = ใช้เมื่อหัวตั้งทั้งคู่ (ค่าตั้งต้นที่ปลอดภัย) · "any" = ทิศใดก็ได้
 *   4. เปลี่ยน `reviewedBy` เป็น `reader:<รหัสหรือชื่อแม่หมอ>` — แถวนั้นจะเริ่มแสดงบนเว็บทันที
 *   ด่าน `scripts/qa/test-card-relations.ts` ตรวจว่ารหัสไพ่มีจริง · ไม่มีคู่ซ้ำ · `reviewedBy` ไม่ว่าง ·
 *   แถว pending ไม่โผล่ในผล
 */

export type ComboKind = "support" | "tension" | "echo";

/** "pending" = ยังไม่มีคนตรวจ (ห้ามใช้) · "reader:<id>" = แม่หมอตัวจริงตรวจแล้ว */
export type ComboReviewer = "pending" | `reader:${string}`;

export interface CuratedCombo {
  /** รหัสไพ่สองใบ (ตาม `src/data/cards`) — ลำดับไม่มีผล */
  cards: readonly [string, string];
  /** "upright" = ใช้เฉพาะเมื่อทั้งสองใบหัวตั้ง · "any" = ทิศใดก็ได้ */
  orientation: "upright" | "any";
  kind: ComboKind;
  /** ประโยคเดียว ≤ 120 ตัวอักษร · บรรยายความหมายของคู่ ไม่ทำนายอนาคตแบบตายตัว */
  noteTh: string;
  noteEn: string;
  /** บังคับมีทุกแถว — ไม่มีชื่อผู้ตรวจ = ไม่มีวันถูกใช้ */
  reviewedBy: ComboReviewer;
}

const P = "pending" as const;

export const CURATED_COMBOS: readonly CuratedCombo[] = [
  // ── ไพ่ชุดใหญ่จับคู่กัน ──
  { cards: ["major-18", "major-11"], orientation: "upright", kind: "tension", noteTh: "ความจริงที่ยังพิสูจน์ไม่ได้ — รอข้อเท็จจริงให้ครบก่อนตัดสิน", noteEn: "A truth not yet provable — wait for the facts before you judge", reviewedBy: P },
  { cards: ["major-16", "major-17"], orientation: "upright", kind: "support", noteTh: "หลังสิ่งเดิมพังลง ความหวังและการเยียวยาค่อย ๆ กลับมา", noteEn: "After the collapse, hope and healing slowly return", reviewedBy: P },
  { cards: ["major-13", "major-00"], orientation: "upright", kind: "support", noteTh: "การจบเรื่องเก่าเปิดทางให้เริ่มต้นใหม่ด้วยใจที่เบาลง", noteEn: "An ending that clears the way for a lighter new start", reviewedBy: P },
  { cards: ["major-15", "major-06"], orientation: "upright", kind: "tension", noteTh: "แรงดึงดูดที่ปนกับการยึดติดหรือการควบคุม จนเลือกด้วยใจได้ยาก", noteEn: "Attraction tangled with attachment or control, making a free choice hard", reviewedBy: P },
  { cards: ["major-01", "major-02"], orientation: "upright", kind: "support", noteTh: "ลงมือข้างนอกและฟังเสียงข้างในไปพร้อมกัน — มีทั้งฝีมือและสัญชาตญาณ", noteEn: "Outer action and inner listening together — skill paired with intuition", reviewedBy: P },
  { cards: ["major-02", "major-18"], orientation: "upright", kind: "echo", noteTh: "ฟังสัญชาตญาณให้ดี แต่แยกให้ออกระหว่างลางสังหรณ์กับความกลัว", noteEn: "Trust your intuition, but tell real hunches apart from fears", reviewedBy: P },
  { cards: ["major-10", "major-21"], orientation: "upright", kind: "support", noteTh: "วงจรหนึ่งกำลังหมุนมาครบรอบอย่างสมบูรณ์", noteEn: "A cycle coming full circle", reviewedBy: P },
  { cards: ["major-10", "major-16"], orientation: "upright", kind: "tension", noteTh: "การเปลี่ยนแปลงที่มาแบบไม่ทันตั้งตัวและอยู่นอกการควบคุม", noteEn: "Change arriving suddenly, beyond your control", reviewedBy: P },
  { cards: ["major-05", "major-06"], orientation: "upright", kind: "tension", noteTh: "ทางเลือกของหัวใจชนกับกรอบเดิมหรือความคาดหวังของคนรอบตัว", noteEn: "A choice of the heart meeting tradition or other people's expectations", reviewedBy: P },
  { cards: ["major-20", "major-21"], orientation: "upright", kind: "support", noteTh: "การตื่นรู้ที่นำไปสู่การปิดบทอย่างภาคภูมิ", noteEn: "An awakening that lets a chapter close with pride", reviewedBy: P },
  { cards: ["major-21", "major-00"], orientation: "upright", kind: "echo", noteTh: "การเดินทางหนึ่งจบลงพร้อมกับก้าวแรกของการเดินทางใหม่", noteEn: "One journey ends as the first step of another begins", reviewedBy: P },
  { cards: ["major-12", "major-13"], orientation: "upright", kind: "echo", noteTh: "ยอมวางมุมมองเดิมลง การเปลี่ยนแปลงจึงเกิดขึ้นได้", noteEn: "Letting go of an old view so change can happen", reviewedBy: P },
  { cards: ["major-09", "major-02"], orientation: "upright", kind: "echo", noteTh: "คำตอบอยู่ข้างใน ต้องเงียบพอจะได้ยินมัน", noteEn: "The answer is within — you need enough quiet to hear it", reviewedBy: P },
  { cards: ["major-14", "major-17"], orientation: "upright", kind: "support", noteTh: "การฟื้นตัวแบบค่อยเป็นค่อยไป สม่ำเสมอ และไม่ฝืน", noteEn: "Gradual, steady healing without forcing it", reviewedBy: P },
  { cards: ["major-04", "major-03"], orientation: "upright", kind: "support", noteTh: "โครงสร้างที่มั่นคงกับการดูแลบ่มเพาะ ช่วยให้สิ่งที่สร้างเติบโตได้", noteEn: "Firm structure and nurturing care let what you build grow", reviewedBy: P },
  { cards: ["major-07", "major-08"], orientation: "upright", kind: "echo", noteTh: "ชนะได้ด้วยการคุมใจตัวเอง มากกว่าการใช้แรงบังคับ", noteEn: "Success through self-command rather than force", reviewedBy: P },
  { cards: ["major-19", "major-17"], orientation: "upright", kind: "support", noteTh: "ความหวังที่ค่อย ๆ กลายเป็นความสุขที่เห็นได้ชัด", noteEn: "Quiet hope turning into visible joy", reviewedBy: P },

  // ── ไพ่ชุดใหญ่กับไพ่ชุดเล็ก ──
  { cards: ["major-19", "wands-06"], orientation: "upright", kind: "support", noteTh: "ชัยชนะที่คนรอบตัวมองเห็นและยอมรับ", noteEn: "A victory others can see and recognise", reviewedBy: P },
  { cards: ["major-06", "cups-02"], orientation: "upright", kind: "support", noteTh: "ความรักที่ใจตรงกัน ทั้งสองฝ่ายเลือกกันและกัน", noteEn: "Mutual love — both hearts choosing each other", reviewedBy: P },
  { cards: ["major-17", "swords-03"], orientation: "upright", kind: "support", noteTh: "แผลใจกำลังเริ่มสมาน มีแสงหลังความเจ็บปวด", noteEn: "A hurt heart beginning to heal; light after the pain", reviewedBy: P },
  { cards: ["major-01", "wands-01"], orientation: "upright", kind: "support", noteTh: "มีทั้งประกายไอเดียและฝีมือพร้อมลงมือทำ", noteEn: "The spark of an idea and the skill to act on it", reviewedBy: P },
  { cards: ["major-07", "wands-08"], orientation: "upright", kind: "support", noteTh: "เรื่องเดินหน้าเร็ว ทิศทางชัด ขยับได้ทันใจ", noteEn: "Fast, focused momentum — things move quickly", reviewedBy: P },
  { cards: ["major-07", "wands-07"], orientation: "upright", kind: "echo", noteTh: "ต้องยืนหยัดและคุมทิศทางของตัวเองท่ามกลางแรงต้าน", noteEn: "Holding your course against resistance", reviewedBy: P },
  { cards: ["major-09", "swords-04"], orientation: "upright", kind: "echo", noteTh: "ต้องการเวลาอยู่กับตัวเองเพื่อพักและเรียบเรียงความคิด", noteEn: "A real need for solitude, rest and sorting your thoughts", reviewedBy: P },
  { cards: ["major-12", "swords-02"], orientation: "upright", kind: "echo", noteTh: "ยังค้างอยู่ระหว่างทางเลือก การหยุดรอคือคำตอบชั่วคราว", noteEn: "Suspended between choices; pausing is the answer for now", reviewedBy: P },
  { cards: ["major-14", "cups-02"], orientation: "upright", kind: "support", noteTh: "ความสัมพันธ์ที่ประคับประคองกันอย่างพอดีและอดทน", noteEn: "A relationship held in balance and patience", reviewedBy: P },
  { cards: ["major-04", "pentacles-04"], orientation: "upright", kind: "echo", noteTh: "ควบคุมและเก็บรักษาไว้แน่น จนเสี่ยงจะไม่ยืดหยุ่น", noteEn: "Firm control and holding on, at risk of becoming rigid", reviewedBy: P },
  { cards: ["major-03", "pentacles-09"], orientation: "upright", kind: "support", noteTh: "ความอุดมสมบูรณ์และความสบายที่สร้างขึ้นด้วยตัวเอง", noteEn: "Self-made abundance and comfort", reviewedBy: P },
  { cards: ["major-03", "pentacles-01"], orientation: "upright", kind: "support", noteTh: "การเติบโตที่เริ่มเป็นรูปธรรม จับต้องได้", noteEn: "Growth beginning to take tangible form", reviewedBy: P },
  { cards: ["major-08", "wands-09"], orientation: "upright", kind: "support", noteTh: "ความอดทนจากข้างใน ยังมีแรงพอจะไปต่อ", noteEn: "Inner strength, with enough left to keep going", reviewedBy: P },
  { cards: ["major-16", "swords-10"], orientation: "upright", kind: "echo", noteTh: "จุดต่ำสุดของเรื่องนี้ — จากตรงนี้มีแต่ทางขึ้น", noteEn: "The lowest point of this story — from here the way is up", reviewedBy: P },
  { cards: ["major-13", "cups-08"], orientation: "upright", kind: "echo", noteTh: "ถึงเวลาเดินออกจากสิ่งที่หมดความหมายต่อใจแล้ว", noteEn: "Time to walk away from what no longer holds meaning", reviewedBy: P },
  { cards: ["major-17", "cups-01"], orientation: "upright", kind: "support", noteTh: "ความหวังใหม่กับหัวใจที่เปิดรับอีกครั้ง", noteEn: "Renewed hope and a heart open again", reviewedBy: P },
  { cards: ["major-19", "cups-10"], orientation: "upright", kind: "support", noteTh: "ความสุขที่ได้แบ่งปันกับคนที่รัก", noteEn: "Joy shared with the people you love", reviewedBy: P },
  { cards: ["major-19", "cups-09"], orientation: "upright", kind: "support", noteTh: "ความพอใจในสิ่งที่ได้ สมหวังอย่างเห็นได้ชัด", noteEn: "Contentment — a wish visibly fulfilled", reviewedBy: P },
  { cards: ["major-15", "pentacles-04"], orientation: "upright", kind: "echo", noteTh: "ยึดติดกับเงินหรือความมั่นคงจนไม่กล้าปล่อยมือ", noteEn: "Clinging to money or security, afraid to let go", reviewedBy: P },
  { cards: ["major-15", "swords-08"], orientation: "upright", kind: "echo", noteTh: "ข้อจำกัดส่วนใหญ่อยู่ในความคิด ไม่ใช่โซ่ที่ล็อกไว้จริง", noteEn: "The limits live mostly in the mind, not in real chains", reviewedBy: P },
  { cards: ["major-18", "swords-07"], orientation: "upright", kind: "echo", noteTh: "มีบางอย่างยังไม่เปิดเผย ตรวจสอบให้ดีก่อนเชื่อ", noteEn: "Something is still hidden — check carefully before you trust", reviewedBy: P },
  { cards: ["major-18", "swords-09"], orientation: "upright", kind: "echo", noteTh: "ความกังวลยามค่ำคืนที่ขยายใหญ่เกินความจริง", noteEn: "Night-time worry growing larger than the facts", reviewedBy: P },
  { cards: ["major-11", "swords-02"], orientation: "upright", kind: "tension", noteTh: "เรื่องนี้ต้องตัดสินอย่างเป็นธรรม แต่ใจยังไม่ยอมมองให้ครบทุกด้าน", noteEn: "A fair decision is needed, but you are avoiding the full picture", reviewedBy: P },
  { cards: ["major-11", "swords-01"], orientation: "upright", kind: "support", noteTh: "ความจริงที่ชัดเจนช่วยให้ตัดสินได้ตรงและเป็นธรรม", noteEn: "Clear truth supporting a straight, fair decision", reviewedBy: P },
  { cards: ["major-11", "pentacles-06"], orientation: "upright", kind: "support", noteTh: "การให้และการรับที่สมดุลและเป็นธรรม", noteEn: "Giving and receiving in fair balance", reviewedBy: P },
  { cards: ["major-00", "wands-03"], orientation: "upright", kind: "support", noteTh: "พร้อมก้าวออกจากที่เดิมไปมองโลกที่กว้างขึ้น", noteEn: "Ready to step out toward wider horizons", reviewedBy: P },
  { cards: ["major-12", "pentacles-07"], orientation: "upright", kind: "echo", noteTh: "ผลยังไม่มา ต้องอดทนรอให้สิ่งที่ลงแรงไว้สุกงอม", noteEn: "Results are not ready yet — patience while your effort ripens", reviewedBy: P },
  { cards: ["major-20", "cups-06"], orientation: "upright", kind: "echo", noteTh: "เรื่องจากอดีตกลับมาให้ทบทวนและตัดสินใจใหม่", noteEn: "Something from the past returns to be revisited", reviewedBy: P },
  { cards: ["major-14", "swords-06"], orientation: "upright", kind: "support", noteTh: "ค่อย ๆ พาตัวเองออกจากช่วงวุ่นวายไปสู่ความสงบ", noteEn: "Gently moving from turmoil toward calm", reviewedBy: P },
  { cards: ["major-04", "wands-14"], orientation: "upright", kind: "support", noteTh: "ความเป็นผู้นำที่มีทั้งวิสัยทัศน์และโครงสร้างรองรับ", noteEn: "Leadership with both vision and structure behind it", reviewedBy: P },
  { cards: ["major-02", "cups-13"], orientation: "upright", kind: "echo", noteTh: "สัญชาตญาณลึกและความเข้าใจใจคนอื่นอย่างอ่อนโยน", noteEn: "Deep intuition and tender understanding of others", reviewedBy: P },
  { cards: ["major-06", "cups-12"], orientation: "upright", kind: "support", noteTh: "ข้อเสนอทางใจหรือการชวนเข้าหาความรัก", noteEn: "A romantic offer, an invitation of the heart", reviewedBy: P },

  // ── ไพ่ชุดเล็กจับคู่กัน ──
  { cards: ["swords-03", "cups-05"], orientation: "upright", kind: "echo", noteTh: "ความเสียใจที่ยังวนอยู่กับสิ่งที่เสียไป", noteEn: "Heartache still circling what was lost", reviewedBy: P },
  { cards: ["cups-02", "swords-03"], orientation: "upright", kind: "tension", noteTh: "ความรักที่มีรอยแผลหรือความจริงที่เจ็บปวดแทรกอยู่", noteEn: "Love touched by hurt or a painful truth", reviewedBy: P },
  { cards: ["pentacles-10", "cups-10"], orientation: "upright", kind: "support", noteTh: "ความมั่นคงทางบ้านและความสุขในครอบครัวมาพร้อมกัน", noteEn: "Material security and family happiness together", reviewedBy: P },
  { cards: ["wands-10", "pentacles-08"], orientation: "upright", kind: "tension", noteTh: "ความขยันที่เริ่มกลายเป็นภาระเกินตัว", noteEn: "Hard work turning into an overload", reviewedBy: P },
  { cards: ["wands-04", "cups-03"], orientation: "upright", kind: "support", noteTh: "ช่วงเวลาฉลองและความอบอุ่นกับคนรอบตัว", noteEn: "Celebration and warmth with the people around you", reviewedBy: P },
  { cards: ["wands-05", "swords-05"], orientation: "upright", kind: "echo", noteTh: "การแข่งขันที่อาจชนะ แต่ต้องแลกด้วยน้ำใจของคนรอบข้าง", noteEn: "A rivalry you might win at the cost of goodwill", reviewedBy: P },
  { cards: ["cups-04", "cups-01"], orientation: "upright", kind: "echo", noteTh: "มีสิ่งใหม่ยื่นมาให้ แต่ใจยังไม่ได้หันไปมอง", noteEn: "Something new is being offered that you have not noticed yet", reviewedBy: P },
  { cards: ["cups-07", "swords-02"], orientation: "upright", kind: "echo", noteTh: "ตัวเลือกเยอะจนยังตัดสินใจไม่ได้", noteEn: "Too many options, and no decision yet", reviewedBy: P },
  { cards: ["pentacles-01", "pentacles-08"], orientation: "upright", kind: "support", noteTh: "โอกาสใหม่ที่จะงอกงามได้ด้วยการฝึกฝนอย่างสม่ำเสมอ", noteEn: "A new opportunity that grows through steady practice", reviewedBy: P },
  { cards: ["pentacles-05", "pentacles-06"], orientation: "upright", kind: "support", noteTh: "ช่วงขาดแคลนที่มีคนยื่นมือเข้ามาช่วย", noteEn: "Hardship met with help or generosity", reviewedBy: P },
  { cards: ["pentacles-02", "wands-10"], orientation: "upright", kind: "tension", noteTh: "ต้องรักษาสมดุลหลายเรื่องพร้อมกันจนเริ่มล้า", noteEn: "Juggling too much at once and starting to tire", reviewedBy: P },
  { cards: ["pentacles-03", "wands-03"], orientation: "upright", kind: "support", noteTh: "งานที่ร่วมมือกันวางรากฐานไว้ดี พร้อมขยายต่อ", noteEn: "Collaborative groundwork, ready to expand", reviewedBy: P },
  { cards: ["swords-13", "swords-03"], orientation: "upright", kind: "echo", noteTh: "ประสบการณ์ที่เคยเจ็บทำให้มองตรงและพูดชัด", noteEn: "Past hurt sharpening honest clarity", reviewedBy: P },
  { cards: ["pentacles-14", "pentacles-10"], orientation: "upright", kind: "support", noteTh: "ความมั่งคั่งที่สร้างมาอย่างมั่นคงและยั่งยืน", noteEn: "Wealth built steadily and made to last", reviewedBy: P },
  { cards: ["cups-11", "cups-01"], orientation: "upright", kind: "echo", noteTh: "ความรู้สึกใหม่หรือข่าวดีทางใจกำลังเข้ามา", noteEn: "A new feeling or tender message arriving", reviewedBy: P },
  { cards: ["wands-12", "wands-08"], orientation: "upright", kind: "echo", noteTh: "พลังพุ่งแรง เรื่องเคลื่อนเร็วมาก ระวังข้ามรายละเอียด", noteEn: "Fiery haste — things move very fast; mind the details", reviewedBy: P },
];

/** คีย์คู่ไพ่แบบไม่สนลำดับ */
export function comboKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** แถวที่ผ่านการตรวจจากคนแล้วเท่านั้น — แถว `pending` / ว่าง ไม่มีวันหลุดออกไป */
export function reviewedCombos(list: readonly CuratedCombo[] = CURATED_COMBOS): CuratedCombo[] {
  return list.filter((c) => typeof c.reviewedBy === "string" && c.reviewedBy.startsWith("reader:") && c.reviewedBy.length > "reader:".length);
}
