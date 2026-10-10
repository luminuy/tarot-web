/**
 * ✦ คำแนะนำลงมือทำรายใบ (78 ใบ × หัวตั้ง/กลับหัว) — ใช้ในคำอ่านสำรองออฟไลน์ (`src/lib/ai/mock-reading.ts`)
 * ---------------------------------------------------------------------------
 * ⚠️ สถานะ: ร่างโดยทีมพัฒนา (Claude) 2026-10-10 ตามคำอนุมัติของเจ้าของ ("แก้ได้ เดี๋ยวให้แม่หมอตรวจ")
 *    ยึดความหมายดั้งเดิมของ Rider-Waite และสารานุกรม 78 ใบของเว็บ ไม่แต่งความหมายใหม่
 *    เทียบรายใบกับ A. E. Waite, *The Pictorial Key to the Tarot* (1911, สาธารณสมบัติ) Part III
 *    https://en.wikisource.org/wiki/The_Pictorial_Key_to_the_Tarot/Part_3 — ชีทตรวจมีคอลัมน์ความหมายดั้งเดิมให้เทียบ
 *    (บางใบ Waite ให้ความหมายกลับหัวต่างจากสายปัจจุบัน เช่น กงล้อกลับหัว = "เพิ่มพูน" — ร่างนี้ยึดสารานุกรมของเว็บเป็นหลัก)
 *    **ทุกแถวยังเป็น `reviewedBy: "pending"` ➔ คำอ่านสำรองข้ามทั้งหมด ผู้ใช้ยังไม่เห็นสักแถว**
 *    แถวไหนแม่หมอตรวจแล้ว เปลี่ยนเป็น `reader:<ชื่อ>` ➔ เริ่มขึ้นเป็นคำแนะนำข้อแรกของคำอ่านสำรองทันที
 *    (กติกาเดียวกับคู่ไพ่ `combos.ts` — เนื้อหาด้านไพ่ที่ยังไม่มีคนตรวจ ห้ามถึงมือผู้ใช้)
 *
 * วิธีตรวจ (สำหรับแม่หมอผู้ตรวจ):
 *   1. อ่านทั้งไทยและอังกฤษ — เป็นสิ่งที่ "ลงมือทำได้จริงภายในไม่กี่วัน" ไหม · ตรงกับความหมายของใบนั้นไหม
 *   2. ห้ามฟันธงอนาคต ห้ามสั่งให้ติดต่อคนอื่นแบบเสี่ยง ห้ามแนะนำเรื่องการแพทย์/กฎหมาย/การลงทุนเฉพาะเจาะจง
 *   3. แก้ถ้อยคำได้ตามสบาย (ไทย ≤ 90 ตัวอักษร) แล้วเปลี่ยน `reviewedBy` เป็น `reader:<ชื่อหรือรหัสแม่หมอ>`
 *   ด่าน `scripts/qa/test-mock-reading.ts` ตรวจว่าครบ 78 ใบ · ไม่ว่าง · ไม่ยาวเกิน · อังกฤษไม่มีอักษรไทย · แถว pending ไม่โผล่
 */

export type AdviceReviewer = "pending" | `reader:${string}`;

export interface CardAdvice {
  upright: { th: string; en: string };
  reversed: { th: string; en: string };
  reviewedBy: AdviceReviewer;
}

const P = "pending" as const;
const a = (uTh: string, uEn: string, rTh: string, rEn: string): CardAdvice => ({
  upright: { th: uTh, en: uEn },
  reversed: { th: rTh, en: rEn },
  reviewedBy: P,
});

export const CARD_ADVICE: Record<string, CardAdvice> = {
  // ── ไพ่ชุดใหญ่ ──
  "major-00": a("ลองเริ่มสิ่งใหม่เล็ก ๆ 1 อย่างที่อยากทำมานาน โดยยังไม่ต้องรู้ทุกคำตอบ", "Start one small new thing you have wanted to try, without needing every answer first.", "ก่อนกระโดดเข้าเรื่องใหม่ เช็กความเสี่ยงที่ชัดที่สุด 1 ข้อให้เรียบร้อยก่อน", "Before you leap, check the single most obvious risk first."),
  "major-01": a("เขียนเป้าหมาย 1 ข้อ แล้วใช้สิ่งที่มีอยู่ในมือลงมือทันทีวันนี้", "Write down one goal and use what you already have to start on it today.", "ทบทวนว่าสิ่งที่พูดหรือสัญญาไว้ ทำได้จริงแค่ไหน แล้วปรับให้ตรงความจริง", "Check whether what you have promised is truly doable, and adjust it to reality."),
  "major-02": a("ให้เวลาเงียบกับตัวเอง 10 นาที แล้วจดสิ่งที่ใจรู้อยู่แล้วแต่ยังไม่ได้พูด", "Sit quietly for ten minutes and write down what you already know but have not said.", "แยกให้ออกว่าอะไรคือสัญชาตญาณ อะไรคือความกลัว ก่อนเชื่อความรู้สึกแรก", "Separate intuition from fear before you trust your first feeling."),
  "major-03": a("ดูแลตัวเองด้วยสิ่งที่ทำให้รู้สึกอุดมสมบูรณ์ เช่น อาหารดี ๆ หรือเวลาในธรรมชาติ", "Nourish yourself with something that feels abundant, like good food or time in nature.", "สังเกตว่าคุณให้คนอื่นจนตัวเองหมดแรงหรือเปล่า แล้วคืนเวลาให้ตัวเองบ้าง", "Notice whether you are giving until you are drained, and give some time back to yourself."),
  "major-04": a("วางแผนเรื่องนี้ให้เป็นขั้นตอนชัด ๆ แล้วกำหนดเส้นตายให้ตัวเอง", "Lay this out as clear steps and set yourself a deadline.", "ผ่อนการควบคุมลงบ้าง ลองถามความเห็นคนอื่นก่อนตัดสินใจเรื่องถัดไป", "Loosen your grip a little and ask for others' views before your next decision."),
  "major-05": a("ขอคำปรึกษาจากคนที่มีประสบการณ์ในเรื่องนี้สัก 1 คน", "Ask one experienced person for guidance on this.", "ถามตัวเองว่ากฎหรือความเชื่อไหนที่คุณทำตามโดยไม่ได้เห็นด้วยจริง", "Ask yourself which rule or belief you follow without truly agreeing with it."),
  "major-06": a("ตัดสินใจเรื่องสำคัญจากคุณค่าที่คุณยึดถือ ไม่ใช่จากความกลัวว่าจะเสียอะไรไป", "Make the important choice from your values, not from fear of losing something.", "เขียนสิ่งที่คุณต้องการจริง ๆ จากความสัมพันธ์นี้ แล้วดูว่าตรงกันไหม", "Write down what you truly want from this relationship and see whether it matches."),
  "major-07": a("เลือกทิศทางเดียวที่ชัด แล้วโฟกัสไปทางนั้นทั้งสัปดาห์นี้", "Pick one clear direction and focus on it for the whole week.", "หยุดดึงหลายเรื่องพร้อมกัน เลือกเรื่องที่สำคัญที่สุดก่อน 1 เรื่อง", "Stop pulling in several directions; choose the single most important one first."),
  "major-08": a("รับมือเรื่องยากด้วยความใจเย็น พูดให้นุ่มแต่หนักแน่น", "Meet the hard thing with calm — speak gently but firmly.", "ให้อภัยตัวเองที่ยังไม่เข้มแข็งพอในบางวัน แล้วเริ่มใหม่จากก้าวเล็ก ๆ", "Forgive yourself for the days you do not feel strong, and restart with a small step."),
  "major-09": a("ปลีกตัวสักช่วงสั้น ๆ เพื่อคิดเรื่องนี้ให้ตกผลึกก่อนตัดสินใจ", "Take a short step back to think this through before you decide.", "ถ้าเก็บตัวนานไป ลองทักคนที่ไว้ใจได้ 1 คนเพื่อคุยเรื่องที่คิดอยู่", "If you have withdrawn too long, reach out to one person you trust to talk it over."),
  "major-10": a("สังเกตโอกาสที่กำลังเข้ามา แล้วตอบรับสิ่งที่ตรงกับเป้าหมายของคุณ", "Watch for openings that are arriving and say yes to the ones that fit your goals.", "ยอมรับสิ่งที่ควบคุมไม่ได้ แล้วโฟกัสกับสิ่งเดียวที่คุณเปลี่ยนได้วันนี้", "Accept what you cannot control and focus on the one thing you can change today."),
  "major-11": a("รวบรวมข้อเท็จจริงให้ครบ แล้วตัดสินใจอย่างยุติธรรมกับทุกฝ่าย", "Gather the full facts, then decide fairly for everyone involved.", "ทบทวนว่ามีตรงไหนที่คุณยังไม่ซื่อตรงกับตัวเองหรือคนอื่น แล้วแก้ทีละจุด", "Check where you have not been honest with yourself or others, and fix it one point at a time."),
  "major-12": a("ลองมองเรื่องนี้จากมุมของอีกฝ่ายก่อนตัดสินใจขั้นต่อไป", "Look at this from the other side's view before your next move.", "ถ้ารอมานานแล้ว ตัดสินใจเรื่องเล็ก ๆ 1 เรื่องเพื่อให้ชีวิตเดินต่อ", "If you have been waiting too long, make one small decision to get things moving."),
  "major-13": a("ปล่อยสิ่งที่จบแล้ว 1 อย่าง เพื่อเปิดที่ว่างให้สิ่งใหม่", "Let go of one thing that has already ended to make room for what is new.", "สังเกตว่าคุณกำลังยื้อสิ่งที่ควรปล่อยไหม แล้วลองคลายมือทีละนิด", "Notice whether you are holding on to what should go, and loosen your grip bit by bit."),
  "major-14": a("หาจุดกึ่งกลางของเรื่องที่สุดโต่ง แล้วทำทีละนิดอย่างสม่ำเสมอ", "Find the middle ground in what has gone to extremes, and move steadily, little by little.", "สังเกตว่าเรื่องไหนในชีวิตที่มากหรือน้อยเกินไป แล้วปรับให้สมดุล 1 เรื่อง", "Notice what in your life is too much or too little, and rebalance one thing."),
  "major-15": a("ระบุนิสัยหรือความสัมพันธ์ที่ดึงพลังคุณ แล้ววางขอบเขต 1 ข้อ", "Name a habit or tie that drains you and set one boundary around it.", "คุณเริ่มมองเห็นทางออกแล้ว ลองก้าวออกจากสิ่งที่ผูกมัดทีละก้าว", "You are starting to see the way out; step away from what binds you one step at a time."),
  "major-16": a("เมื่อสิ่งเดิมพัง ให้เก็บส่วนที่ยังดีไว้ แล้วเริ่มสร้างใหม่บนฐานที่แข็งแรงกว่า", "When the old structure falls, keep what still works and rebuild on firmer ground.", "อย่าเลี่ยงความจริงที่รู้อยู่แล้ว เผชิญมันทีละเรื่องก่อนจะพังเอง", "Do not dodge the truth you already know; face it one piece at a time before it breaks open."),
  "major-17": a("ทำสิ่งเล็ก ๆ ที่ช่วยเติมความหวังให้ตัวเองทุกวันสัปดาห์นี้", "Do one small thing each day this week that restores your hope.", "ถ้ารู้สึกหมดหวัง ลองเขียนสิ่งเล็ก ๆ ที่ยังดีอยู่ 3 อย่าง", "If hope feels thin, write down three small things that are still good."),
  "major-18": a("รอให้ข้อมูลชัดก่อนตัดสินใจ อย่าเชื่อสิ่งที่ยังเป็นแค่การคาดเดา", "Wait for the facts before you decide; do not trust what is still guesswork.", "เมื่อหมอกเริ่มจาง ให้ตรวจข้อเท็จจริงอีกครั้งก่อนเดินต่อ", "As the fog lifts, check the facts once more before moving on."),
  "major-19": a("แบ่งปันความสำเร็จหรือข่าวดีกับคนที่คุณรัก แล้วรับพลังดี ๆ นั้นไว้", "Share a success or good news with someone you love and let the warmth in.", "อย่าปล่อยให้ความกังวลบังสิ่งดีที่มีอยู่ ลองจดเรื่องที่ขอบคุณ 3 อย่าง", "Do not let worry hide what is good; write down three things you are grateful for."),
  "major-20": a("ทบทวนบทเรียนที่ผ่านมา แล้วตัดสินใจครั้งใหม่ให้ชัดเจน", "Review what the past has taught you and make a clear new decision.", "หยุดตำหนิตัวเองเรื่องเก่า ให้อภัยแล้วเลือกก้าวต่อ", "Stop blaming yourself for the past; forgive and choose to move on."),
  "major-21": a("ฉลองสิ่งที่ทำสำเร็จ แล้วปิดเรื่องนี้ให้สมบูรณ์ก่อนเริ่มเรื่องใหม่", "Celebrate what you finished and close this chapter properly before the next one.", "เช็กว่ามีเรื่องค้างอะไรที่ทำให้เรื่องนี้ยังไม่จบ แล้วเก็บให้เรียบร้อย", "Check what loose end keeps this from finishing, and tie it up."),

  // ── ไม้เท้า ──
  "wands-01": a("ลงมือกับไอเดียใหม่ภายใน 48 ชั่วโมง ก่อนที่ไฟจะมอด", "Act on the new idea within 48 hours, before the spark fades.", "ถ้ายังไม่พร้อมเริ่ม ลองหาให้เจอว่าอะไรที่ทำให้ไฟยังไม่ติด", "If you are not ready to start, find out what is keeping the spark from catching."),
  "wands-02": a("วางแผนระยะยาวให้ชัด แล้วเลือกเส้นทางที่อยากไปจริง ๆ", "Make a clear long-range plan and choose the path you truly want.", "เลิกลังเลที่จุดเดิม ลองตัดสินใจก้าวเล็ก ๆ 1 ก้าวไปทางที่อยากไป", "Stop hovering at the same point; take one small step toward where you want to go."),
  "wands-03": a("ขยายมุมมองออกไป มองหาโอกาสที่ไกลกว่าที่เคยคิด", "Widen your view and look for opportunities further out than you thought.", "ถ้าผลยังมาไม่ถึง ทบทวนแผนเดิมแล้วปรับเวลาให้สมจริงขึ้น", "If results are slow, revisit the plan and set a more realistic timeline."),
  "wands-04": a("ฉลองความสำเร็จเล็ก ๆ กับคนใกล้ตัว ให้ความรู้สึกมั่นคงได้เติบโต", "Celebrate a small win with people close to you and let that sense of home grow.", "ถ้าบรรยากาศรอบตัวไม่มั่นคง ลองเริ่มจากทำให้มุมเล็ก ๆ ของตัวเองสงบก่อน", "If things feel unsettled, start by making one small corner of your life calm."),
  "wands-05": a("เปลี่ยนการแข่งขันเป็นการร่วมมือ ฟังความเห็นต่างก่อนตอบโต้", "Turn competition into cooperation; hear the other view before you push back.", "ถ้าเลี่ยงการคุยมานาน หยิบเรื่องที่ค้างใจขึ้นมาคุยตรง ๆ อย่างใจเย็น 1 เรื่อง", "If you have been avoiding the clash, calmly raise one lingering issue in the open."),
  "wands-06": a("ยอมรับคำชมและความสำเร็จอย่างภูมิใจ แล้วใช้ต่อยอดก้าวถัดไป", "Accept praise and success with pride, and use them to build your next step.", "อย่ารอคำยอมรับจากคนอื่นจนหยุดเดิน ให้คุณค่ากับความพยายามของตัวเองก่อน", "Do not stall waiting for others' approval; value your own effort first."),
  "wands-07": a("ยืนหยัดในจุดยืนของคุณอย่างสุภาพ เตรียมเหตุผลให้พร้อม", "Hold your ground politely and have your reasons ready.", "ถ้าเหนื่อยกับการต้องปกป้องตลอด เลือกปกป้องเฉพาะสิ่งที่สำคัญที่สุด", "If you are tired of defending everything, defend only what matters most."),
  "wands-08": a("ตอบรับข่าวหรือโอกาสที่เข้ามาเร็ว จัดลำดับให้ทันการณ์", "Respond quickly to news or chances that arrive, and prioritise to keep up.", "ถ้าเรื่องล่าช้า ใช้เวลานี้เตรียมตัวให้พร้อมแทนการเร่ง", "If things are delayed, use the time to prepare rather than force the pace."),
  "wands-09": a("พักให้พอแล้วสู้ต่อ คุณใกล้เส้นชัยกว่าที่คิด", "Rest enough, then keep going — you are closer to the finish than you think.", "ถ้ารู้สึกหวาดระแวงไปหมด ลองคุยกับคนที่ไว้ใจเพื่อเช็กว่ากังวลเกินจริงไหม", "If you feel on guard against everything, check with someone you trust whether the worry is real."),
  "wands-10": a("ลิสต์ภาระที่แบกอยู่ แล้วส่งต่อหรือวางลง 1 อย่างสัปดาห์นี้", "List what you are carrying and hand off or set down one thing this week.", "คุณเริ่มวางภาระได้แล้ว ทำต่อและอย่ารับงานใหม่เพิ่มจนล้นอีก", "You are starting to set the load down; keep going and do not take on too much again."),
  "wands-11": a("ลองสิ่งใหม่ด้วยความอยากรู้ ถามคำถามให้มากเหมือนผู้เริ่มต้น", "Try something new with curiosity and ask questions like a beginner.", "ถ้าไฟเริ่มต้นหายไว ลองตั้งเป้าเล็กที่ทำเสร็จได้ใน 1 วัน", "If your enthusiasm fades fast, set a small goal you can finish in a day."),
  "wands-12": a("กล้าลงมือแต่วางแผนสำรองไว้ด้วย อย่ารีบจนข้ามการเตรียมตัว", "Be bold, but keep a backup plan; do not rush past your preparation.", "ชะลอความใจร้อนลง คิดผลลัพธ์ให้ครบก่อนตัดสินใจกะทันหัน", "Slow your impatience and think through the outcome before any sudden move."),
  "wands-13": a("แสดงความมั่นใจและความอบอุ่นออกมา ให้คนรอบตัวได้เห็นพลังของคุณ", "Show your confidence and warmth so people around you see your strength.", "ถ้ารู้สึกหมดไฟหรือหึงหวง ลองกลับมาดูแลความมั่นใจในตัวเองก่อน", "If you feel drained or jealous, come back to caring for your own confidence first."),
  "wands-14": a("เป็นผู้นำด้วยวิสัยทัศน์ที่ชัด แล้วชวนคนอื่นให้เดินไปด้วยกัน", "Lead with a clear vision and invite others to come along.", "ระวังการตัดสินใจแทนคนอื่นทั้งหมด ฟังทีมก่อนสั่งการ", "Be careful not to decide everything for others; listen to the team before directing."),

  // ── ถ้วย ──
  "cups-01": a("เปิดใจรับความรักหรือความรู้สึกใหม่ที่เข้ามา โดยไม่ต้องรีบตั้งชื่อ", "Open your heart to the new feeling arriving, without rushing to name it.", "ถ้าใจยังปิด ลองเขียนความรู้สึกที่เก็บไว้ลงกระดาษ 5 นาที", "If your heart feels closed, write down the feelings you have held back for five minutes."),
  "cups-02": a("ให้เวลากับความสัมพันธ์แบบสองต่อสอง ฟังกันอย่างตั้งใจ", "Give one-to-one time to the relationship and truly listen to each other.", "ถ้าความสัมพันธ์สะดุด ลองคุยเรื่องที่ค้างใจกันอย่างใจเย็น 1 เรื่อง", "If the bond feels off, calmly talk through one thing left unsaid."),
  "cups-03": a("นัดเจอเพื่อนหรือคนที่ทำให้คุณยิ้ม แล้วฉลองเรื่องดีด้วยกัน", "Meet friends who make you smile and celebrate something good together.", "สังเกตว่าการสังสรรค์ช่วงนี้เติมพลังหรือดูดพลังคุณ แล้วเลือกให้เหมาะ", "Notice whether recent socialising fills you up or drains you, and choose accordingly."),
  "cups-04": a("ลองมองสิ่งที่มีอยู่ตรงหน้าใหม่ อาจมีโอกาสที่คุณยังไม่ได้สังเกต", "Look again at what is in front of you; there may be a chance you have missed.", "คุณเริ่มกลับมาสนใจโลกรอบตัวแล้ว ตอบรับคำชวน 1 อย่างที่เข้ามา", "You are re-engaging with the world; accept one invitation that comes your way."),
  "cups-05": a("ให้เวลาเสียใจกับสิ่งที่เสียไป แล้วหันมามองสิ่งที่ยังเหลืออยู่", "Give yourself time to grieve what was lost, then turn to what still remains.", "คุณกำลังฟื้นตัว ลองเขียนสิ่งที่ได้เรียนรู้จากเรื่องนี้ 1 ข้อ", "You are recovering; write down one thing this taught you."),
  "cups-06": a("ทำสิ่งที่ทำให้นึกถึงความสุขเรียบง่าย แต่อยู่กับปัจจุบันเป็นหลัก", "Do something that brings back simple joy, while staying rooted in the present.", "ถามตัวเองว่าคิดถึงคนนั้น หรือคิดถึงตัวเองในตอนนั้น ก่อนตัดสินใจกลับไป", "Ask whether you miss that person or who you were then, before deciding to go back."),
  "cups-07": a("จากทางเลือกที่มีมากมาย เลือก 1 ทางที่ทำได้จริงแล้วลงมือ", "From all the options, choose one that is truly doable and act on it.", "ความชัดเจนเริ่มกลับมา เขียนสิ่งที่ต้องการจริงให้เหลือข้อเดียว", "Clarity is returning; narrow what you really want to a single line."),
  "cups-08": a("ถ้ารู้แล้วว่าสิ่งนี้ไม่ใช่ทาง ให้กล้าเดินออกมาอย่างนุ่มนวล", "If you know this is not your path, have the courage to walk away gently.", "ก่อนเดินจากไป เช็กอีกครั้งว่ากำลังหนีปัญหา หรือออกไปหาสิ่งที่ดีกว่าจริง", "Before leaving, check whether you are escaping a problem or truly seeking something better."),
  "cups-09": a("ยอมรับความสุขที่ได้มาอย่างเต็มใจ แล้วขอบคุณตัวเองที่มาถึงตรงนี้", "Receive the happiness you have earned and thank yourself for getting here.", "ถามใหม่ว่าถ้าไม่มีใครมองอยู่ คุณอยากได้อะไรจริง ๆ", "Ask again: if nobody were watching, what would you truly want?"),
  "cups-10": a("ใช้เวลากับคนในบ้านหรือคนที่รักแบบไม่มีเรื่องงานมาคั่น", "Spend time with family or loved ones with no work in between.", "ถ้าบ้านไม่อบอุ่นอย่างที่หวัง เริ่มจากการพูดสิ่งที่ต้องการอย่างอ่อนโยน", "If home is not as warm as you hoped, start by gently saying what you need."),
  "cups-11": a("เปิดรับข่าวดีหรือความรู้สึกใหม่ ๆ อย่างอ่อนโยนและใจกว้าง", "Welcome good news or new feelings with gentleness and an open mind.", "อย่าเพิ่งตัดสินใจตอนอารมณ์อ่อนไหว รอให้ใจนิ่งก่อน", "Do not decide while you feel raw; wait until your heart settles."),
  "cups-12": a("ทำตามหัวใจแต่ดูการกระทำประกอบ ไม่ใช่แค่คำพูดหวาน", "Follow your heart, but look at actions as well as sweet words.", "ระวังการหลงไปกับภาพฝัน เช็กว่าสิ่งที่สัญญาไว้ทำได้จริงไหม", "Beware of getting lost in a dream; check whether the promises are real."),
  "cups-13": a("ดูแลความรู้สึกของตัวเองแบบเดียวกับที่คุณดูแลคนอื่น", "Care for your own feelings the way you care for others.", "ตั้งขอบเขตทางใจ อย่ารับอารมณ์ของคนอื่นมาแบกจนตัวเองหนัก", "Set emotional boundaries; do not carry others' moods until you are weighed down."),
  "cups-14": a("ตัดสินใจด้วยใจที่นิ่ง ฟังความรู้สึกแต่ไม่ให้อารมณ์นำ", "Decide from a calm heart; listen to feelings without letting them lead.", "ถ้ากำลังเก็บกดอารมณ์ไว้ ลองหาที่ปลอดภัยเพื่อระบายสักครั้ง", "If you are bottling things up, find a safe place to let them out once."),

  // ── ดาบ ──
  "swords-01": a("พูดความจริงให้ชัดเจนและตรงประเด็น ด้วยถ้อยคำที่สุภาพ", "Speak the truth clearly and to the point, with kind words.", "ก่อนตัดสินใจ หาข้อมูลเพิ่มให้ความคิดชัดขึ้นอีกนิด", "Before deciding, gather a bit more information so your thinking clears."),
  "swords-02": a("รวบรวมข้อมูลของทั้งสองทางให้ครบ แล้วตั้งเส้นตายในการตัดสินใจ", "Gather the facts for both options and set a deadline to decide.", "คุณเริ่มเห็นภาพชัดขึ้นแล้ว เลือกทางที่ใจหนักแน่นกว่า", "The picture is clearing; choose the path your heart feels steadier about."),
  "swords-03": a("ให้เวลาตัวเองเสียใจ อย่ารีบตัดสินความสัมพันธ์ทั้งหมดจากวันที่เจ็บที่สุด", "Give yourself time to hurt; do not judge the whole relationship by its worst day.", "คุณกำลังฟื้นจากความเจ็บ ทำสิ่งเล็ก ๆ ที่ช่วยเยียวยาใจทุกวัน", "You are healing; do one small thing each day that soothes your heart."),
  "swords-04": a("พักจริงจังสักช่วง ปิดการแจ้งเตือนแล้วให้ใจได้หยุดนิ่ง", "Take a real rest; turn off notifications and let your mind be still.", "พักมาพอแล้ว ค่อย ๆ กลับมาทำงานทีละนิดโดยไม่หักโหม", "You have rested enough; ease back into things gradually without overdoing it."),
  "swords-05": a("ถามตัวเองว่าชนะเรื่องนี้แล้วคุ้มกับสิ่งที่เสียไหม", "Ask whether winning this is worth what it costs.", "ถ้าความขัดแย้งจบแล้ว เปิดทางคืนดีด้วยการขอโทษหรือรับฟัง", "If the conflict is over, open the door to repair by apologising or listening."),
  "swords-06": a("ก้าวออกจากสถานการณ์ที่หนักไปสู่ที่ที่สงบกว่าทีละขั้น", "Move step by step from the heavy situation toward calmer water.", "ถ้ายังก้าวออกมาไม่ได้ ลองหาคนช่วยหรือที่พึ่ง 1 ราย", "If you cannot move on yet, find one person or resource to help."),
  "swords-07": a("วางแผนอย่างรอบคอบ และรักษาความซื่อตรงไว้แม้ไม่มีใครเห็น", "Plan carefully, and stay honest even when nobody is watching.", "ถ้ามีเรื่องที่ปิดบังอยู่ ลองหาจังหวะเปิดเผยอย่างเหมาะสม", "If something is being hidden, find the right moment to bring it into the open."),
  "swords-08": a("ลิสต์ทางเลือกที่มีจริงออกมา คุณอาจไม่ได้ติดอย่างที่คิด", "List the real options you have; you may be less trapped than you think.", "คุณเริ่มหลุดจากกรอบความคิดเดิมแล้ว ก้าวออกมาอีก 1 ก้าว", "You are breaking out of the old mindset; take one more step out."),
  "swords-09": a("เขียนความกังวลลงกระดาษก่อนนอน แล้วแยกว่าเรื่องไหนแก้ได้จริง", "Write your worries down before bed and sort out which ones you can actually solve.", "ถ้าความกังวลยังรบกวนการนอน ลองคุยกับคนที่ไว้ใจหรือผู้เชี่ยวชาญ", "If worry keeps disturbing your sleep, talk to someone you trust or a professional."),
  "swords-10": a("ยอมรับว่าเรื่องนี้จบแล้ว แล้วให้เวลาตัวเองค่อย ๆ ลุกขึ้นใหม่", "Accept that this has ended, and give yourself time to rise again.", "จุดต่ำสุดผ่านไปแล้ว เริ่มฟื้นตัวจากก้าวเล็กที่สุดที่ทำได้", "The lowest point has passed; start recovering with the smallest step you can take."),
  "swords-11": a("ตั้งคำถามและหาข้อมูลให้รอบด้านก่อนเชื่อเรื่องที่ได้ยิน", "Ask questions and check the facts before believing what you hear.", "ระวังคำพูดที่รีบเกินไปหรือการซุบซิบ คิดก่อนพูดสักนิด", "Watch for hasty words or gossip; think a moment before you speak."),
  "swords-12": a("ลงมือแก้ปัญหาอย่างตรงไปตรงมา แต่ฟังคนอื่นระหว่างทางด้วย", "Tackle the problem directly, but listen to others along the way.", "ชะลอความใจร้อน คำพูดที่แรงเกินไปอาจทำร้ายคนใกล้ตัว", "Slow down; words that are too sharp may hurt the people close to you."),
  "swords-13": a("ตัดสินใจด้วยเหตุผลที่ชัด และตั้งขอบเขตอย่างสุภาพแต่หนักแน่น", "Decide with clear reasoning and set boundaries politely but firmly.", "ความตรงไปตรงมาดี แต่ใส่ความเห็นอกเห็นใจลงไปในคำพูดด้วย", "Directness is good, but add some compassion to your words."),
  "swords-14": a("ใช้หลักการและข้อมูลนำการตัดสินใจ แล้วอธิบายเหตุผลให้คนอื่นเข้าใจ", "Let principles and facts lead the decision, then explain your reasoning clearly.", "ระวังการใช้เหตุผลกดคนอื่น ฟังความรู้สึกของอีกฝ่ายประกอบด้วย", "Be careful not to use logic to overpower others; hear their feelings too."),

  // ── เหรียญ ──
  "pentacles-01": a("เริ่มต้นเรื่องเงินหรืองานใหม่ด้วยแผนเล็ก ๆ ที่จับต้องได้", "Start the new money or work venture with a small, concrete plan.", "ก่อนลงเงินหรือแรงกับโอกาสใหม่ ตรวจรายละเอียดให้ครบก่อน", "Before putting money or effort into a new chance, check the details fully."),
  "pentacles-02": a("จัดตารางเวลาและเงินให้สมดุล เลือกสิ่งที่สำคัญก่อน 2 อย่าง", "Balance your time and money; put the two most important things first.", "ถ้ารับหลายอย่างจนล้น ตัดหรือเลื่อนออก 1 อย่าง", "If you are juggling too much, drop or postpone one thing."),
  "pentacles-03": a("ร่วมมือกับคนที่มีทักษะต่างจากคุณ แล้วให้เครดิตกันอย่างชัดเจน", "Work with people whose skills differ from yours and give credit clearly.", "ถ้าทีมไม่ลงตัว คุยเรื่องบทบาทและความคาดหวังให้ชัด", "If the team is not clicking, clarify roles and expectations."),
  "pentacles-04": a("เก็บออมอย่างมีแผน แต่เผื่อใจให้ใช้จ่ายกับสิ่งที่สำคัญบ้าง", "Save with a plan, but allow spending on what truly matters.", "ถ้ายึดเงินหรือสิ่งของแน่นเกินไป ลองแบ่งปันหรือปล่อยวางบ้าง", "If you hold on too tightly to money or things, try sharing or loosening your grip."),
  "pentacles-05": a("อย่าอายที่จะขอความช่วยเหลือ หาแหล่งช่วยเหลือที่มีอยู่ใกล้ตัว", "Do not be ashamed to ask for help; look for the support that is nearby.", "ช่วงยากเริ่มผ่านไป ค่อย ๆ วางแผนการเงินใหม่ทีละขั้น", "The hard stretch is easing; rebuild your finances step by step."),
  "pentacles-06": a("ให้และรับอย่างสมดุล ช่วยคนอื่นเท่าที่ไม่ทำให้ตัวเองลำบาก", "Give and receive in balance; help others without hurting yourself.", "เช็กว่าการช่วยเหลือที่ให้หรือรับมีเงื่อนไขแอบแฝงไหม", "Check whether the help you give or receive comes with hidden strings."),
  "pentacles-07": a("ทบทวนผลที่ลงแรงไปแล้ว แล้วตัดสินใจว่าจะลงต่อหรือปรับทาง", "Review what your effort has produced and decide whether to continue or adjust.", "ถ้าผลยังไม่มา อย่าเพิ่งท้อ ปรับวิธีเล็กน้อยแล้วให้เวลาอีกนิด", "If results have not come, do not give up yet; tweak your method and give it more time."),
  "pentacles-08": a("ฝึกฝนงานที่ทำซ้ำ ๆ ให้ดีขึ้นทีละนิดทุกวัน", "Practise your craft a little better every day.", "ถ้างานเริ่มน่าเบื่อจนลวก ลองตั้งเป้าคุณภาพเล็ก ๆ 1 ข้อ", "If work has become dull and sloppy, set one small quality goal."),
  "pentacles-09": a("ภูมิใจกับความมั่นคงที่สร้างมา แล้วให้รางวัลตัวเองอย่างพอดี", "Take pride in the stability you built and reward yourself sensibly.", "ระวังการใช้จ่ายเพื่ออวดหรือเพื่อชดเชยความรู้สึก", "Watch for spending to impress others or to soothe your feelings."),
  "pentacles-10": a("วางแผนการเงินระยะยาวเพื่อครอบครัวหรืออนาคตของคุณ", "Make a long-term financial plan for your family or future.", "ถ้ามีเรื่องเงินในครอบครัวค้างคา คุยกันให้ชัดและเป็นธรรม", "If family money issues linger, talk them through clearly and fairly."),
  "pentacles-11": a("เรียนรู้ทักษะใหม่ที่ใช้ได้จริง 1 อย่าง แล้วฝึกอย่างสม่ำเสมอ", "Learn one practical new skill and practise it steadily.", "ถ้าเริ่มแล้วไม่ต่อเนื่อง ตั้งเวลาเรียนสั้น ๆ ทุกวันแทน", "If you start but do not continue, set a short daily study time instead."),
  "pentacles-12": a("ทำงานอย่างสม่ำเสมอทีละขั้น ความช้าแต่มั่นคงคือจุดแข็ง", "Work steadily, step by step; slow and sure is your strength.", "ถ้ารู้สึกติดอยู่กับกิจวัตรเดิม ลองเปลี่ยนวิธีทำงานเล็กน้อย 1 อย่าง", "If you feel stuck in routine, change one small thing in how you work."),
  "pentacles-13": a("ดูแลทั้งงานและบ้านด้วยความใส่ใจ แล้วอย่าลืมดูแลตัวเองด้วย", "Tend to work and home with care, and remember to care for yourself too.", "ถ้าแบกทุกอย่างคนเดียว ลองขอให้คนในบ้านช่วยแบ่งเบา 1 เรื่อง", "If you are carrying everything alone, ask someone at home to share one task."),
  "pentacles-14": a("ใช้ประสบการณ์และความมั่นคงที่มี ช่วยวางรากฐานให้คนรอบตัว", "Use your experience and stability to help build a base for people around you.", "ระวังการวัดคุณค่าทุกอย่างด้วยเงิน ให้เวลากับเรื่องที่เงินซื้อไม่ได้", "Be careful not to measure everything by money; make time for what it cannot buy."),
};

/**
 * คำแนะนำรายใบที่ "ตรวจแล้ว" เท่านั้น — แถว pending คืน null เสมอ (ห้ามถึงมือผู้ใช้)
 */
export function reviewedCardAdvice(cardId: string, isReversed: boolean, lang: "th" | "en"): string | null {
  const row = CARD_ADVICE[cardId];
  if (!row || row.reviewedBy === "pending") return null;
  return (isReversed ? row.reversed : row.upright)[lang] || null;
}
