import type { AdviceReviewer } from "./card-advice";

/**
 * ✦ มุมอ่านไพ่กลับหัวรายใบ (78 ใบ) — ตาม "หลักอ่านไพ่กลับหัว" ที่แม่หมออนุมัติแล้ว
 * ---------------------------------------------------------------------------
 * ⏳ สถานะ: ร่างรอบ 4 (2026-10-11) — ทุกแถวเป็น `pending` รอแม่หมอตรวจในชีท docs/review/READER_REVIEW_2026-10-11.md
 *    แถว pending ห้ามถึงมือผู้ใช้และห้ามเข้า prompt (กติกาเดียวกับ `card-advice.ts` · `combos.ts`)
 * ที่มา: ส่วนที่ 0 ของชีทรอบก่อน (READER_REVIEW_2026-10-10) อนุมัติ 4 มุม + 5 กฎ และจำนวนต่อมุม 21/33/9/15
 *    พร้อมเขียนว่าแต่ละใบดูได้ใน "ช่องมุมอ่านกลับหัว" — แต่ชีทไม่มีช่องนั้นจริง ทีมพัฒนา (Claude) จึงร่างรายใบ
 *    ให้ตรงกับคำแนะนำกลับหัวที่แม่หมออนุมัติแล้วใน `card-advice.ts` และตรงจำนวนในตารางนั้น
 * ใช้ที่: `buildReadingMessage()` — ไพ่กลับหัวที่แถว "ตรวจแล้ว" จะบอกโมเดลว่าบ้านนี้อ่านใบนี้ด้วยมุมไหน
 *    คำอ่าน AI กับคำแนะนำสำรองจึงเล่าเรื่องเดียวกัน ไม่ใช่ให้โมเดลเดามุมเองทุกครั้ง
 *    ⚠️ เปลี่ยนแถวไหนเป็น `reader:<ชื่อ>` = ข้อความ prompt เปลี่ยน ➔ ต้องขึ้น `PROMPT_VERSION` + รัน AI Judge ใน PR เดียวกัน
 * กติกาเขียน `note` (5 กฎในชีท): อยู่ในเรื่องเดียวกับหัวตั้ง · ไม่พลิกเป็นความหมายตรงข้าม · ไม่พูดแทนสภาพคนดู (ใช้ "อาจ…")
 *    · ไม่เดาว่าคนดูอยู่ในสถานการณ์ไหน · มุม "คลายลง หรือยังค้าง" ต้องพูดทั้งสองทาง
 *    ด่าน `scripts/qa/test-mock-reading.ts` ตรวจครบ 78 ใบ · จำนวนต่อมุมตรงตาราง · ไม่ว่าง/ไม่ยาวเกิน · ไม่มีคำพูดแทนสภาพ · pending ไม่เข้า prompt
 */

export type ReversalAngle = "blocked" | "imbalance" | "inward" | "easing";

/** 4 มุมตามตารางที่แม่หมออนุมัติ — `count` คือจำนวนใบในตารางนั้น (ด่านตรวจว่ารายใบรวมได้ตรง) */
export const REVERSAL_ANGLE_INFO: Record<
  ReversalAngle,
  { th: string; en: string; descTh: string; descEn: string; count: number }
> = {
  blocked: {
    th: "ติดขัด",
    en: "Blocked",
    descTh: "พลังดีของไพ่ยังมาไม่เต็ม ถูกบัง หรือล่าช้า",
    descEn: "the card's good energy has not fully arrived; it is covered or delayed",
    count: 21,
  },
  imbalance: {
    th: "มาก/น้อยเกิน",
    en: "Too much or too little",
    descTh: "คุณสมบัติของไพ่มากเกินไปหรือน้อยเกินไป",
    descEn: "the card's quality is overdone or underdone",
    count: 33,
  },
  inward: {
    th: "หันเข้าข้างใน",
    en: "Turned inward",
    descTh: "เรื่องของไพ่เกิดขึ้นในใจมากกว่าภายนอก",
    descEn: "the card's theme plays out inside rather than in the outside world",
    count: 9,
  },
  easing: {
    th: "คลายลง หรือยังค้าง",
    en: "Easing or lingering",
    descTh: "เรื่องหนักของไพ่อาจกำลังเบาลง หรืออาจยังค้างอยู่ในใจ",
    descEn: "the card's heavy theme may be easing, or may still linger",
    count: 15,
  },
};

export interface CardReversalAngle {
  angle: ReversalAngle;
  /** ใบนี้กลับหัวอ่านว่าอย่างไรในมุมนั้น — ไทย ≤ 90 ตัวอักษร · อังกฤษ ≤ 140 */
  note: { th: string; en: string };
  reviewedBy: AdviceReviewer;
}

/** ร่างรอบ 4 — ยังไม่มีคนตรวจ แม่หมอตรวจแล้วให้เปลี่ยนเป็น "reader:<ชื่อ>" ทีละแถว */
const PENDING = "pending" as const;
const r = (angle: ReversalAngle, th: string, en: string): CardReversalAngle => ({
  angle,
  note: { th, en },
  reviewedBy: PENDING,
});

export const REVERSAL_ANGLES: Record<string, CardReversalAngle> = {
  // ── ไพ่ชุดใหญ่ ──
  "major-00": r("imbalance", "ใจกล้าเริ่มใหม่อาจมากจนข้ามความเสี่ยง หรือน้อยจนไม่กล้าก้าว", "The urge to leap may run so high that risks get skipped, or so low that no step is taken."),
  "major-01": r("imbalance", "พลังทำให้เป็นจริงอาจล้นจนพูดเกินกว่าที่ทำได้ หรือมีอยู่แต่ไม่ได้ใช้", "The power to make things happen may spill into promising more than can be done, or sit unused."),
  "major-02": r("inward", "เสียงในใจมีอยู่ แต่อาจปนกับความกลัวหรือสิ่งที่เชื่อไว้ก่อน จนแยกไม่ออก", "The inner voice is there, but it may be tangled with fear or old assumptions until they are hard to tell apart."),
  "major-03": r("imbalance", "การดูแลอาจเทให้คนอื่นมากจนเหลือให้ตัวเองน้อยเกินไป", "Care may pour out to others until too little is left for yourself."),
  "major-04": r("imbalance", "ระเบียบและการควบคุมอาจแน่นจนแข็งทื่อ หรือหลวมจนเรื่องไม่มีหลัก", "Structure and control may be so tight they turn rigid, or so loose that things lose their footing."),
  "major-05": r("inward", "เรื่องกฎและความเชื่อหันเข้ามาในใจ ว่าสิ่งที่ทำตามอยู่ยังตรงกับที่ตัวเองเชื่อไหม", "Rules and beliefs turn inward: does what you follow still match what you truly believe?"),
  "major-06": r("blocked", "ความกลมกลืนและการเลือกจากใจยังมาไม่เต็ม ใจสองฝ่าย หรือใจกับคุณค่าของตัวเอง อาจยังไม่ตรงกัน", "Harmony and choosing from the heart have not fully arrived; two hearts, or your heart and your values, may not be aligned yet."),
  "major-07": r("imbalance", "แรงผลักไปข้างหน้าอาจกระจายหลายทางจนไม่ไปไหน หรือฝืนบังคับมากเกินไป", "Drive may scatter in too many directions to get anywhere, or turn into forcing things too hard."),
  "major-08": r("inward", "ความเข้มแข็งเป็นเรื่องข้างใน ความไม่มั่นใจหรือการตำหนิตัวเองอาจบังแรงที่มีอยู่", "Strength turns inward: self-doubt or harsh self-judgement may be hiding the strength you have."),
  "major-09": r("imbalance", "การปลีกตัวอาจนานจนกลายเป็นตัดขาด หรือสั้นจนคิดไม่ตกผลึก", "Withdrawal may last so long it becomes isolation, or be too brief to think things through."),
  "major-10": r("easing", "ช่วงที่เรื่องไม่เป็นใจอาจกำลังคลายลง หรืออาจยังวนอยู่", "A stretch of things not going your way may be easing, or may still be turning."),
  "major-11": r("imbalance", "ความยุติธรรมและความซื่อตรงอาจเอียงไปข้างหนึ่ง ทั้งกับคนอื่นและกับตัวเอง", "Fairness and honesty may tilt to one side, toward others or toward yourself."),
  "major-12": r("blocked", "การหยุดรอยังไม่ให้มุมมองใหม่ อาจกลายเป็นการค้างอยู่ที่เดิม", "The pause has not yet brought a new view and may be turning into staying stuck."),
  "major-13": r("easing", "การจบของเรื่องเก่าอาจกำลังคลายลง หรืออาจยังถูกยื้อไว้", "An ending may be loosening its hold, or may still be held on to."),
  "major-14": r("imbalance", "ความพอดีเสียสมดุล บางเรื่องอาจมากไป บางเรื่องอาจน้อยไป", "Balance is off: some things may be too much, others too little."),
  "major-15": r("easing", "สิ่งที่ผูกมัดอาจกำลังคลายลง หรืออาจยังรัดอยู่ โซ่ในภาพหลวมพอจะถอดได้เอง", "What binds may be loosening, or may still be tight; the chains on the card are loose enough to lift off."),
  "major-16": r("easing", "แรงสั่นสะเทือนอาจกำลังเบาลง หรืออาจยังค้าง เพราะความจริงบางอย่างยังไม่ถูกยอมรับ", "The upheaval may be easing, or may linger because some truth has not been faced yet."),
  "major-17": r("blocked", "ความหวังและการเยียวยายังมาไม่เต็ม อาจถูกความเหนื่อยหรือความท้อบังอยู่", "Hope and healing have not fully arrived; tiredness or discouragement may be covering them."),
  "major-18": r("easing", "ความคลุมเครือและความกลัวอาจกำลังจางลง หรืออาจยังบังให้มองไม่ชัด", "Confusion and fear may be fading, or may still be clouding the view."),
  "major-19": r("blocked", "ความสดใสและความสำเร็จยังมาไม่เต็ม อาจถูกความกังวลบัง ไม่ใช่ลางร้าย", "Brightness and success have not fully arrived and may be hidden behind worry; this is not a bad omen."),
  "major-20": r("inward", "การตัดสินหันเข้ามาในใจ อาจฟังเหมือนการตำหนิตัวเองเรื่องเก่า มากกว่าเสียงเรียกให้ก้าวต่อ", "Judgement turns inward and may sound more like blaming yourself for the past than a call to move on."),
  "major-21": r("blocked", "ความสำเร็จครบรอบยังมาไม่เต็ม อาจมีเรื่องค้างที่ทำให้ยังปิดเรื่องนี้ไม่ได้", "Completion has not fully arrived; loose ends may be keeping this chapter from closing."),

  // ── ไม้เท้า ──
  "wands-01": r("blocked", "ประกายไฟเริ่มต้นยังไม่ติด อาจมีบางอย่างขวาง หรือยังไม่ถึงจังหวะ", "The first spark has not caught yet; something may be in the way, or the timing is not right yet."),
  "wands-02": r("blocked", "แผนและการเลือกทางยังไม่ได้เริ่มเดิน อาจค้างอยู่ที่ความลังเล", "Plans and the choice of direction have not started moving and may be stuck in hesitation."),
  "wands-03": r("blocked", "ผลจากสิ่งที่ส่งออกไปยังมาไม่ถึง อาจช้ากว่าที่คิด", "What you sent out has not come back yet and may take longer than expected."),
  "wands-04": r("blocked", "ความมั่นคงและความสุขร่วมกันยังมาไม่เต็ม บรรยากาศรอบตัวอาจยังไม่นิ่ง", "Shared stability and celebration have not fully arrived; the atmosphere around you may still be unsettled."),
  "wands-05": r("imbalance", "การแข่งขันและความเห็นต่างอาจมากจนกลายเป็นทะเลาะ หรือเลี่ยงจนเรื่องสำคัญไม่ได้คุย", "Competition and disagreement may turn into needless fights, or be avoided until important things go unsaid."),
  "wands-06": r("inward", "เรื่องการยอมรับหันเข้ามาในใจ คุณค่าอาจไปผูกกับคำชมของคนอื่นมากกว่าที่ตัวเองเห็น", "Recognition turns inward: your sense of worth may hang more on others' praise than on how you see yourself."),
  "wands-07": r("imbalance", "การยืนหยัดปกป้องอาจมากจนเหนื่อยล้า หรือน้อยจนยอมถอยในเรื่องที่สำคัญ", "Defending your ground may go so far it wears you out, or so little that you give way on what matters."),
  "wands-08": r("blocked", "ความเร็วและข่าวที่รออาจล่าช้า เรื่องยังไม่เคลื่อนเร็วอย่างที่หวัง", "Speed and awaited news may be delayed; things are not moving as fast as hoped."),
  "wands-09": r("imbalance", "การระวังตัวอาจมากจนระแวงไปหมด หรือล้าจนไม่อยากยืนหยัดต่อ", "Guardedness may turn into suspicion of everything, or weariness may make it hard to hold on."),
  "wands-10": r("easing", "ภาระที่แบกอาจกำลังเบาลง หรืออาจยังหนักเกินไหว", "The load may be getting lighter, or may still be more than you can carry."),
  "wands-11": r("blocked", "ไฟของการเริ่มเรียนรู้ยังไม่ติดเต็มที่ ความตื่นเต้นอาจมาแล้วหายไว", "The fire of learning has not fully caught; excitement may come and go quickly."),
  "wands-12": r("imbalance", "ความกล้าลุยอาจมากจนใจร้อนบุ่มบ่าม หรือน้อยจนไม่ได้ออกตัว", "Boldness may tip into rash impatience, or drop so low that nothing gets started."),
  "wands-13": r("imbalance", "ความมั่นใจและความอบอุ่นอาจล้นจนกลายเป็นหึงหวง หรือพร่องจนหมดไฟ", "Confidence and warmth may overflow into jealousy, or run low into burnout."),
  "wands-14": r("imbalance", "ความเป็นผู้นำอาจมากจนตัดสินใจแทนคนอื่นหมด หรือน้อยจนไม่มีใครรู้ทิศทาง", "Leadership may tip into deciding everything for others, or fade until no one knows the direction."),

  // ── ถ้วย ──
  "cups-01": r("blocked", "ความรู้สึกและความรักใหม่ยังไหลไม่เต็ม ใจอาจยังปิดอยู่", "New feeling and love are not flowing fully yet; the heart may still be closed."),
  "cups-02": r("blocked", "ความเข้าใจกันของสองฝ่ายยังมาไม่เต็ม อาจมีเรื่องค้างใจที่ยังไม่ได้คุย", "Mutual understanding has not fully arrived; something unspoken may be in the way."),
  "cups-03": r("imbalance", "การสังสรรค์อาจมากจนดูดพลัง หรือน้อยจนรู้สึกห่างจากเพื่อน", "Socialising may be so much that it drains you, or so little that you feel apart from friends."),
  "cups-04": r("imbalance", "การถอยมาอยู่กับตัวเองอาจนานจนมองข้ามสิ่งที่ยื่นมาให้", "Withdrawing into yourself may go on long enough to miss what is being offered."),
  "cups-05": r("easing", "ความเสียใจกับสิ่งที่เสียไปอาจกำลังเบาลง หรืออาจยังค้างอยู่ในใจ", "Grief over what was lost may be easing, or may still linger in the heart."),
  "cups-06": r("imbalance", "การมองย้อนความหลังอาจมากจนไม่ได้มองข้างหน้า", "Looking back may take up so much room that the road ahead goes unseen."),
  "cups-07": r("imbalance", "ความฝันและทางเลือกอาจมากจนเลือกไม่ถูก หรือเพ้อฝันจนไม่ได้ลงมือ", "Dreams and options may be too many to choose from, or so dreamy that nothing gets done."),
  "cups-08": r("inward", "การจะเดินจากหรือไม่เป็นคำถามในใจ ว่าเป็นการหนีปัญหา หรือไปหาสิ่งที่ดีกว่า", "Whether to walk away becomes an inner question: escaping a problem, or going toward something better?"),
  "cups-09": r("inward", "ความสมหวังหันเข้ามาในใจ สิ่งที่ได้มาอาจยังไม่ใช่สิ่งที่ใจต้องการจริง", "Fulfilment turns inward: what you have may not yet be what your heart truly wants."),
  "cups-10": r("blocked", "ความอบอุ่นในบ้านและความสุขร่วมกันอาจยังมาไม่เต็มอย่างที่หวัง", "Warmth at home and shared happiness may not have fully arrived as hoped."),
  "cups-11": r("blocked", "ความรู้สึกอ่อนโยนและแรงบันดาลใจยังมาไม่เต็ม อารมณ์อาจยังไม่นิ่งพอจะตัดสินใจ", "Gentle feeling and inspiration have not fully arrived; emotions may not be settled enough to decide."),
  "cups-12": r("imbalance", "ความโรแมนติกอาจมากจนคำพูดหวานนำหน้าการกระทำ", "Romance may run ahead of action, with sweet words outpacing what gets done."),
  "cups-13": r("imbalance", "ความเห็นอกเห็นใจอาจมากจนแบกอารมณ์ของทุกคนไว้ หรือปิดใจจนไม่รับรู้อะไร", "Empathy may be so strong that you carry everyone's moods, or shut off until you feel nothing."),
  "cups-14": r("imbalance", "การคุมอารมณ์อาจแน่นจนเก็บกด หรือหลวมจนอารมณ์นำการตัดสินใจ", "Emotional control may be so tight that feelings are bottled up, or so loose that moods make the decisions."),

  // ── ดาบ ──
  "swords-01": r("blocked", "ความคิดที่ชัดและความจริงยังมาไม่เต็ม ข้อมูลอาจยังไม่พอ", "Clear thinking and the full truth have not arrived yet; the information may still be incomplete."),
  "swords-02": r("easing", "ภาวะเลือกไม่ได้อาจกำลังคลายลง หรืออาจยังติดอยู่ระหว่างสองทาง", "Indecision may be loosening, or may still hold you between two paths."),
  "swords-03": r("easing", "ความเจ็บปวดในใจอาจกำลังเบาลง หรืออาจยังเจ็บอยู่", "Heartache may be easing, or may still hurt."),
  "swords-04": r("easing", "ช่วงพักอาจใกล้ครบ หรืออาจยังต้องพักต่อ", "The time of rest may be nearly done, or more rest may still be needed."),
  "swords-05": r("easing", "ความขัดแย้งอาจกำลังจบลง หรืออาจยังคุกรุ่นอยู่", "The conflict may be winding down, or may still be simmering."),
  "swords-06": r("easing", "การก้าวออกจากเรื่องหนักอาจกำลังเดินหน้า หรืออาจยังติดอยู่ที่ฝั่งเดิม", "Moving away from a hard situation may be under way, or may still be stuck on the old shore."),
  "swords-07": r("inward", "เรื่องที่ปิดบังหันเข้ามาในใจ ความรู้สึกผิดหรือความลับอาจหนักอยู่ข้างใน", "What is hidden turns inward: guilt or a secret may be weighing on you inside."),
  "swords-08": r("inward", "ความรู้สึกติดอยู่อาจมาจากความคิดในหัว มากกว่าสิ่งที่ขวางอยู่จริง", "Feeling trapped may come more from thoughts in the mind than from anything really in the way."),
  "swords-09": r("easing", "ความกังวลยามค่ำคืนอาจกำลังเบาลง หรืออาจยังรบกวนการนอน", "Night-time worry may be easing, or may still be disturbing sleep."),
  "swords-10": r("easing", "จุดที่หนักที่สุดอาจกำลังคลายลง หรืออาจยังหนักอยู่ ไม่ต้องเร่งลุก", "The hardest point may be loosening, or may still weigh heavily; there is no need to rush getting up."),
  "swords-11": r("imbalance", "ความอยากรู้และความช่างพูดอาจมากจนกลายเป็นพูดเร็วเกินไปหรือซุบซิบ", "Curiosity and quick talk may tip into hasty words or gossip."),
  "swords-12": r("imbalance", "ความเด็ดขาดและความเร็วอาจมากจนคำพูดแรงเกินไป", "Decisiveness and speed may go so far that words turn harsh."),
  "swords-13": r("imbalance", "ความตรงไปตรงมาอาจมากจนเย็นชา หรือขาดความเห็นอกเห็นใจ", "Directness may grow cold or lose its compassion."),
  "swords-14": r("imbalance", "การใช้เหตุผลอาจมากจนกดความรู้สึกของคนอื่น", "Reason may be pressed so hard that it overrides other people's feelings."),

  // ── เหรียญ ──
  "pentacles-01": r("blocked", "โอกาสใหม่ด้านเงินหรืองานยังไม่สุกพอ รายละเอียดอาจยังไม่ครบ", "A new chance in money or work is not ripe yet; the details may not be complete."),
  "pentacles-02": r("imbalance", "การจัดสมดุลหลายเรื่องอาจรับไว้มากจนล้นมือ", "Juggling may have taken on more than can be kept in balance."),
  "pentacles-03": r("blocked", "การร่วมมือยังไม่ลงตัวเต็มที่ บทบาทหรือความคาดหวังอาจยังไม่ชัด", "Working together has not fully clicked; roles or expectations may still be unclear."),
  "pentacles-04": r("imbalance", "การเก็บรักษาอาจแน่นจนกลายเป็นยึดติด หรือหลวมจนรั่วไหล", "Holding on may grow so tight it becomes clinging, or so loose that things slip away."),
  "pentacles-05": r("easing", "ความลำบากด้านเงินหรือความรู้สึกขาดแคลนอาจกำลังเบาลง หรืออาจยังค้างอยู่", "Money hardship or a sense of lack may be easing, or may still be there."),
  "pentacles-06": r("imbalance", "การให้และการรับอาจเอียงไปข้างหนึ่ง หรือมีเงื่อนไขแอบแฝง", "Giving and receiving may tilt to one side, or come with hidden strings."),
  "pentacles-07": r("blocked", "ผลของสิ่งที่ลงแรงไว้ยังมาไม่ถึง อาจต้องปรับวิธีหรือให้เวลาเพิ่ม", "The results of your effort have not arrived yet; the method may need adjusting, or more time."),
  "pentacles-08": r("imbalance", "ความใส่ใจในงานอาจลดจนลวก หรือมากจนอยากให้สมบูรณ์แบบเกินไป", "Care for the work may slip into sloppiness, or swing into perfectionism."),
  "pentacles-09": r("imbalance", "การให้รางวัลตัวเองอาจเกินพอดี จนกลายเป็นใช้จ่ายเพื่อชดเชยความรู้สึก", "Rewarding yourself may go past enough and turn into spending to soothe feelings."),
  "pentacles-10": r("blocked", "ความมั่นคงของครอบครัวยังมาไม่เต็ม อาจมีเรื่องเงินหรือเรื่องเก่าในบ้านที่ยังค้างคา", "Family security has not fully settled; money or old matters at home may still be unresolved."),
  "pentacles-11": r("blocked", "ความตั้งใจเรียนรู้ยังไม่ต่อเนื่อง อาจเริ่มแล้วหยุดกลางทาง", "The will to learn is not steady yet; things may start and then stop halfway."),
  "pentacles-12": r("imbalance", "ความสม่ำเสมออาจมากจนจำเจ ติดอยู่กับกิจวัตรเดิม", "Steadiness may harden into a routine that never changes."),
  "pentacles-13": r("imbalance", "การดูแลคนอื่นอาจมากจนแบกทุกอย่างไว้คนเดียว", "Looking after others may grow until you carry everything alone."),
  "pentacles-14": r("imbalance", "การให้ค่ากับความมั่นคงทางเงินอาจมากจนวัดทุกอย่างด้วยเงิน", "Valuing financial security may go so far that everything is measured in money."),
};

/**
 * มุมอ่านกลับหัวที่ "ตรวจแล้ว" เท่านั้น — แถว pending คืน null เสมอ (ห้ามถึงมือผู้ใช้/โมเดล)
 * `table` เปิดไว้ให้ด่านทดสอบส่งตารางจำลองเข้ามาได้ โค้ดจริงใช้ค่าปริยาย
 */
export function reviewedReversalAngle(cardId: string, table: Record<string, CardReversalAngle> = REVERSAL_ANGLES): CardReversalAngle | null {
  const row = table[cardId];
  if (!row || row.reviewedBy === "pending") return null;
  return row;
}

/** บรรทัดเสริมใต้หัวไพ่กลับหัวใน prompt — คืน "" เมื่อแถวยังไม่ตรวจ (prompt จึงเหมือนเดิมทุกตัวอักษร) */
export function formatReversalAngleForPrompt(
  cardId: string,
  lang: "th" | "en",
  table: Record<string, CardReversalAngle> = REVERSAL_ANGLES,
): string {
  const row = reviewedReversalAngle(cardId, table);
  if (!row) return "";
  const info = REVERSAL_ANGLE_INFO[row.angle];
  return lang === "en"
    ? `\n  House reversal angle: ${info.en} (${info.descEn}). For this card: ${row.note.en}`
    : `\n  มุมอ่านกลับหัวที่บ้านนี้ใช้: ${info.th} (${info.descTh}) · ใบนี้: ${row.note.th}`;
}
