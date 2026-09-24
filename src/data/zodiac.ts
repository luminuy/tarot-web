/**
 * ✦ ไพ่ทาโรต์ × 12 ราศี — แหล่งความจริงเดียวของความสัมพันธ์ระหว่างราศีกับไพ่
 * ===========================================================================
 *
 * ใช้ระบบ **Hermetic Order of the Golden Dawn** (ระบบเดียวกับที่ Pamela Colman Smith
 * กับ A.E. Waite ใช้ออกแบบสำรับ 1909) — ระบบนี้ผูกกับ **ราศีแบบสากล (Tropical)**
 * ที่อิงฤดูกาล ไม่ใช่ราศีแบบไทย (สุริยยาตร์/Sidereal) ที่เลื่อนไปราว 24 วัน
 * ➔ หน้าเว็บต้องบอกผู้ใช้เรื่องนี้ตรง ๆ (คนไทยหลายคนรู้จักราศีเกิดแบบไทยมาก่อน)
 *
 * แต่ละราศีผูกกับไพ่ 3 ชั้น:
 *   1. ไพ่ประจำราศี (Major Arcana) — เช่น ราศีเมษ = The Emperor
 *   2. ไพ่ดาวผู้ครองราศี (Major Arcana ของดาวเคราะห์) — เช่น ดาวอังคาร = The Tower
 *   3. ไพ่ 3 ช่วงของราศี (Decan · ช่วงละ ~10 วัน) — ไพ่เลข 2–10 ของชุดธาตุเดียวกัน
 *
 * ⚠️ ห้ามแก้รหัสไพ่ในไฟล์นี้โดยไม่แก้ฟิลด์ `astrology` ของไพ่ใบนั้นใน `src/data/cards/*` ด้วย
 *    ด่าน `scripts/qa/test-seo-wave4.ts` (ข้อ 15) เทียบสองที่นี้ทุกใบ — ข้อมูลในสารานุกรมกับหน้าราศี
 *    ต้องเล่าเรื่องเดียวกันเสมอ
 *
 * วันที่เป็นค่าเฉลี่ยที่ใช้กันทั่วไป (ตารางใน *Book of Thoth*) วันต่อราศีจริงคลาดได้ ±1 วันตามปี
 */

export type ZodiacElement = "fire" | "earth" | "air" | "water";
export type ZodiacModality = "cardinal" | "fixed" | "mutable";

/** วันเดือน (เดือน 1–12, วัน 1–31) ไม่ผูกกับปี */
export interface MonthDay {
  month: number;
  day: number;
}

export interface ZodiacDecan {
  /** วันแรกของช่วงนี้ — ช่วงสิ้นสุดวันก่อนหน้าช่วงถัดไป */
  start: MonthDay;
  /** ไพ่ประจำช่วง (รหัสเดียวกับ `src/data/cards`) */
  cardId: string;
  /** ดาวที่ครองช่วงนี้ (ตามระบบ Chaldean ของ Golden Dawn) */
  planetTh: string;
  planetEn: string;
}

export interface ZodiacCopy {
  /** ประโยคเดียวที่สรุปราศีผ่านเลนส์ไพ่ */
  tagline: string;
  /** ตัวตนของคนราศีนี้ (2–3 ประโยค) */
  nature: string;
  /** จุดแข็ง */
  strength: string;
  /** ด้านเงาที่ต้องระวัง */
  shadow: string;
  /** ความรัก */
  love: string;
  /** การงาน/เงิน */
  work: string;
  /** คำแนะนำจากไพ่ประจำราศี */
  advice: string;
}

export interface ZodiacSign {
  /** slug ของหน้าราศี (ดู `zodiacSignPath()` ใน src/lib/tarot/zodiac.ts) */
  id: string;
  nameTh: string;
  nameEn: string;
  element: ZodiacElement;
  modality: ZodiacModality;
  /** ไพ่ประจำราศี (Major Arcana) */
  majorCardId: string;
  /** ดาวผู้ครองราศี + ไพ่ประจำดาวนั้น */
  rulerTh: string;
  rulerEn: string;
  rulerCardId: string;
  /** 3 ช่วงของราศี เรียงตามวันที่ */
  decans: readonly [ZodiacDecan, ZodiacDecan, ZodiacDecan];
  th: ZodiacCopy;
  en: ZodiacCopy;
}

export const ZODIAC_ELEMENT_LABEL: Record<ZodiacElement, { th: string; en: string; suitTh: string; suitEn: string }> = {
  fire: { th: "ธาตุไฟ", en: "Fire", suitTh: "ชุดไม้เท้า (Wands)", suitEn: "Wands" },
  earth: { th: "ธาตุดิน", en: "Earth", suitTh: "ชุดเหรียญ (Pentacles)", suitEn: "Pentacles" },
  air: { th: "ธาตุลม", en: "Air", suitTh: "ชุดดาบ (Swords)", suitEn: "Swords" },
  water: { th: "ธาตุน้ำ", en: "Water", suitTh: "ชุดถ้วย (Cups)", suitEn: "Cups" },
};

export const ZODIAC_MODALITY_LABEL: Record<ZodiacModality, { th: string; en: string }> = {
  cardinal: { th: "จรราศี (ผู้ริเริ่ม)", en: "Cardinal (initiator)" },
  fixed: { th: "สถิรราศี (ผู้ยืนหยัด)", en: "Fixed (sustainer)" },
  mutable: { th: "อุภยราศี (ผู้ปรับตัว)", en: "Mutable (adapter)" },
};

const md = (month: number, day: number): MonthDay => ({ month, day });

export const ZODIAC_SIGNS: readonly ZodiacSign[] = [
  {
    id: "aries",
    nameTh: "ราศีเมษ",
    nameEn: "Aries",
    element: "fire",
    modality: "cardinal",
    majorCardId: "major-04",
    rulerTh: "ดาวอังคาร",
    rulerEn: "Mars",
    rulerCardId: "major-16",
    decans: [
      { start: md(3, 21), cardId: "wands-02", planetTh: "ดาวอังคาร", planetEn: "Mars" },
      { start: md(3, 31), cardId: "wands-03", planetTh: "ดวงอาทิตย์", planetEn: "Sun" },
      { start: md(4, 11), cardId: "wands-04", planetTh: "ดาวศุกร์", planetEn: "Venus" },
    ],
    th: {
      tagline: "ผู้นำที่ลงมือก่อนใคร — พลังของจักรพรรดิที่อยากสร้างอาณาจักรของตัวเอง",
      nature:
        "คนราศีเมษมีไฟในตัวสูง ตัดสินใจเร็ว และไม่ชอบรอให้ใครมาเปิดทางให้ ไพ่ The Emperor สะท้อนความอยากเป็นเจ้าของชีวิตตัวเอง อยากวางกติกาเอง และพร้อมรับผิดชอบสิ่งที่ตัวเองเริ่ม",
      strength: "กล้าเริ่ม กล้าชน และปกป้องคนที่รักได้จริง พอตั้งเป้าแล้วจะเดินหน้าไม่ถอย",
      shadow: "ใจร้อน อยากชนะจนลืมฟังคนอื่น เมื่อพลังของดาวอังคาร (The Tower) ล้นเกิน สิ่งที่สร้างไว้อาจพังเพราะอารมณ์ชั่ววูบ",
      love: "รักแบบตรงไปตรงมา ชอบเป็นฝ่ายเริ่มและอยากได้คนที่ตามทันจังหวะ ความสัมพันธ์จะไปได้ดีเมื่อยอมให้อีกฝ่ายได้นำบ้าง",
      work: "เหมาะกับงานบุกเบิก เปิดตลาดใหม่ หรือเป็นหัวหน้าทีม การเงินมาเร็วไปเร็ว ควรมีระบบเก็บเงินที่ไม่ต้องใช้ความอดทนมาก",
      advice: "The Emperor เตือนว่าผู้นำที่ดีไม่ได้ชนะทุกเรื่อง แต่สร้างโครงสร้างที่ยืนได้แม้วันที่ตัวเองไม่อยู่",
    },
    en: {
      tagline: "The one who moves first — an Emperor building a realm of their own.",
      nature:
        "Aries runs hot, decides fast and rarely waits for permission. The Emperor mirrors the urge to own your life, set your own rules and take responsibility for whatever you start.",
      strength: "Courage to begin, to compete and to protect the people you love. Once a goal is set, you do not back down.",
      shadow: "Impatience and a need to win that drowns out other voices. When Mars (The Tower) runs unchecked, what you built can collapse in one heated moment.",
      love: "Direct and eager to make the first move, drawn to partners who can keep pace. Love deepens when you let the other person lead sometimes.",
      work: "Made for pioneering roles, new markets and leading teams. Money comes fast and goes fast, so automate your savings.",
      advice: "The Emperor reminds you that real leadership is not winning every fight but building structures that stand when you are not there.",
    },
  },
  {
    id: "taurus",
    nameTh: "ราศีพฤษภ",
    nameEn: "Taurus",
    element: "earth",
    modality: "fixed",
    majorCardId: "major-05",
    rulerTh: "ดาวศุกร์",
    rulerEn: "Venus",
    rulerCardId: "major-03",
    decans: [
      { start: md(4, 21), cardId: "pentacles-05", planetTh: "ดาวพุธ", planetEn: "Mercury" },
      { start: md(5, 1), cardId: "pentacles-06", planetTh: "ดวงจันทร์", planetEn: "Moon" },
      { start: md(5, 11), cardId: "pentacles-07", planetTh: "ดาวเสาร์", planetEn: "Saturn" },
    ],
    th: {
      tagline: "ผู้รักษาคุณค่าที่ยั่งยืน — ครูผู้เชื่อในสิ่งที่พิสูจน์แล้วด้วยเวลา",
      nature:
        "คนราศีพฤษภหนักแน่น ใจเย็น และให้ค่ากับความมั่นคง ไพ่ The Hierophant สะท้อนคนที่ยึดหลักการ เคารพสิ่งที่สืบทอดกันมา และค่อย ๆ สร้างชีวิตทีละก้อนอิฐ",
      strength: "อดทน ไว้ใจได้ และมีรสนิยมดี ดาวศุกร์ (The Empress) ทำให้รู้จักความสุขเรียบง่ายและดูแลคนรอบตัวเก่ง",
      shadow: "ดื้อ ยึดติดกับวิธีเดิม และไม่ชอบการเปลี่ยนแปลงแม้รู้ว่าถึงเวลาแล้ว",
      love: "รักช้าแต่รักนาน แสดงความรักผ่านการดูแลและการกระทำมากกว่าคำพูด ต้องการความมั่นคงก่อนจะเปิดใจเต็มที่",
      work: "เก่งงานที่ต้องใช้ความละเอียดและความต่อเนื่อง เช่น การเงิน งานฝีมือ หรือธุรกิจที่โตช้าแต่มั่นคง เก็บเงินเก่งเป็นทุนเดิม",
      advice: "The Hierophant ชวนให้ถามตัวเองว่ากติกาที่ยึดอยู่ยังรับใช้ชีวิตเราอยู่ไหม หรือเราแค่กลัวที่จะเปลี่ยน",
    },
    en: {
      tagline: "Keeper of lasting value — a teacher who trusts what time has proven.",
      nature:
        "Taurus is steady, calm and devoted to security. The Hierophant reflects someone who honours principles and tradition and builds a life one brick at a time.",
      strength: "Patience, reliability and good taste. Venus (The Empress) gives you a gift for simple pleasures and caring for others.",
      shadow: "Stubbornness and clinging to the familiar, even when you know it is time to change.",
      love: "Slow to fall, long to stay. Love shows up as care and action more than words, and you open fully once you feel safe.",
      work: "Strong in roles that reward precision and consistency: finance, craft, or businesses that grow slowly but surely. Saving comes naturally.",
      advice: "The Hierophant asks whether the rules you keep still serve your life, or whether you are simply afraid to change.",
    },
  },
  {
    id: "gemini",
    nameTh: "ราศีเมถุน",
    nameEn: "Gemini",
    element: "air",
    modality: "mutable",
    majorCardId: "major-06",
    rulerTh: "ดาวพุธ",
    rulerEn: "Mercury",
    rulerCardId: "major-01",
    decans: [
      { start: md(5, 21), cardId: "swords-08", planetTh: "ดาวพฤหัสบดี", planetEn: "Jupiter" },
      { start: md(6, 1), cardId: "swords-09", planetTh: "ดาวอังคาร", planetEn: "Mars" },
      { start: md(6, 11), cardId: "swords-10", planetTh: "ดวงอาทิตย์", planetEn: "Sun" },
    ],
    th: {
      tagline: "นักสื่อสารสองขั้ว — ทุกการตัดสินใจคือการเลือกระหว่างสองเส้นทาง",
      nature:
        "คนราศีเมถุนหัวไว ช่างสงสัย และคุยได้กับทุกคน ไพ่ The Lovers ไม่ได้พูดแค่เรื่องความรัก แต่คือบทเรียนของการเลือก คนราศีนี้มองเห็นหลายทางเลือกเสมอ จึงต้องเรียนรู้ที่จะเลือกด้วยใจ",
      strength: "เรียนรู้เร็ว ปรับตัวเก่ง และพูดให้คนเข้าใจได้ง่าย ดาวพุธ (The Magician) ทำให้เปลี่ยนไอเดียเป็นของจริงได้",
      shadow: "คิดมากจนไม่ลงมือ เปลี่ยนใจบ่อย และบางครั้งพูดเก่งเกินกว่าที่ทำจริง",
      love: "ต้องการคนที่คุยสนุกและให้พื้นที่ส่วนตัว ความสัมพันธ์จะมั่นคงเมื่อกล้าเลือกและยืนยันการเลือกนั้น",
      work: "เหมาะกับงานสื่อสาร การตลาด การสอน การเขียน หรืองานที่ได้เจอคนและเรื่องใหม่ทุกวัน",
      advice: "The Lovers บอกว่าไม่มีทางเลือกไหนสมบูรณ์แบบ การเลือกที่ดีคือการเลือกที่ตรงกับคุณค่าของเรา",
    },
    en: {
      tagline: "The twin-minded messenger — every decision is a choice between two roads.",
      nature:
        "Gemini is quick, curious and can talk to anyone. The Lovers is less about romance than about choosing: you always see many paths, and your lesson is to choose with your heart.",
      strength: "Fast learning, easy adaptation and a gift for explaining. Mercury (The Magician) helps you turn ideas into reality.",
      shadow: "Overthinking instead of acting, changing your mind often, and sometimes talking more than doing.",
      love: "You need a partner who is fun to talk to and gives you space. Love steadies when you dare to choose and stand by that choice.",
      work: "Suited to communication, marketing, teaching, writing, or any role with new people and new topics every day.",
      advice: "The Lovers says no option is perfect. A good choice is one that matches your values.",
    },
  },
  {
    id: "cancer",
    nameTh: "ราศีกรกฎ",
    nameEn: "Cancer",
    element: "water",
    modality: "cardinal",
    majorCardId: "major-07",
    rulerTh: "ดวงจันทร์",
    rulerEn: "Moon",
    rulerCardId: "major-02",
    decans: [
      { start: md(6, 21), cardId: "cups-02", planetTh: "ดาวศุกร์", planetEn: "Venus" },
      { start: md(7, 2), cardId: "cups-03", planetTh: "ดาวพุธ", planetEn: "Mercury" },
      { start: md(7, 12), cardId: "cups-04", planetTh: "ดวงจันทร์", planetEn: "Moon" },
    ],
    th: {
      tagline: "นักรบผู้ปกป้องบ้าน — เปลือกแข็งด้านนอก หัวใจอ่อนโยนด้านใน",
      nature:
        "คนราศีกรกฎอ่อนไหว ผูกพันกับครอบครัว และจำความรู้สึกได้ยาวนาน ไพ่ The Chariot สะท้อนคนที่ใช้ความรักเป็นแรงขับ พร้อมพุ่งไปข้างหน้าเพื่อปกป้องคนที่อยู่ในรถคันเดียวกัน",
      strength: "ใส่ใจ เข้าใจคนอื่นลึกซึ้ง และมีสัญชาตญาณแม่นยำ ดวงจันทร์ (The High Priestess) ทำให้รู้สึกได้ก่อนที่คนอื่นจะพูด",
      shadow: "อารมณ์ขึ้นลงตามสิ่งรอบตัว เก็บความน้อยใจไว้คนเดียว และปิดตัวเองเมื่อรู้สึกไม่ปลอดภัย",
      love: "รักแบบทุ่มเทและอยากสร้างครอบครัว ต้องการคนที่ทำให้รู้สึกปลอดภัยพอจะเปิดเปลือกออกมา",
      work: "เก่งงานดูแลคน งานบริการ งานบ้านและอาหาร หรือธุรกิจครอบครัว มักเก็บเงินไว้เพื่อความมั่นคงของคนที่รัก",
      advice: "The Chariot บอกว่าอารมณ์คือม้าที่ต้องบังคับ ไม่ใช่ปล่อยให้พาไป ใช้ความรู้สึกเป็นแรงขับ ไม่ใช่พวงมาลัย",
    },
    en: {
      tagline: "The warrior who guards the home — a hard shell around a tender heart.",
      nature:
        "Cancer is sensitive, family-bound and remembers feelings for a long time. The Chariot shows someone driven by love, charging forward to protect everyone riding with them.",
      strength: "Care, deep empathy and sharp instinct. The Moon's card (The High Priestess) lets you feel what others have not yet said.",
      shadow: "Moods that rise and fall with your surroundings, quiet resentment, and retreating into your shell when you feel unsafe.",
      love: "Devoted and family-minded. You need someone who makes you feel safe enough to come out of your shell.",
      work: "Gifted at caring roles, hospitality, food and home, or family businesses. You save to keep loved ones secure.",
      advice: "The Chariot says emotions are horses to steer, not to be dragged by. Let feelings power you, not drive you.",
    },
  },
  {
    id: "leo",
    nameTh: "ราศีสิงห์",
    nameEn: "Leo",
    element: "fire",
    modality: "fixed",
    majorCardId: "major-08",
    rulerTh: "ดวงอาทิตย์",
    rulerEn: "Sun",
    rulerCardId: "major-19",
    decans: [
      { start: md(7, 22), cardId: "wands-05", planetTh: "ดาวเสาร์", planetEn: "Saturn" },
      { start: md(8, 2), cardId: "wands-06", planetTh: "ดาวพฤหัสบดี", planetEn: "Jupiter" },
      { start: md(8, 12), cardId: "wands-07", planetTh: "ดาวอังคาร", planetEn: "Mars" },
    ],
    th: {
      tagline: "หัวใจสิงห์ที่อ่อนโยน — พลังที่แท้จริงคือการควบคุมตัวเองได้",
      nature:
        "คนราศีสิงห์มีเสน่ห์ ใจกว้าง และอยากให้ชีวิตมีความหมาย ไพ่ Strength แสดงหญิงสาวที่ลูบหัวสิงโตอย่างอ่อนโยน นั่นคือบทเรียนของราศีนี้ พลังที่ยิ่งใหญ่ที่สุดไม่ใช่การข่ม แต่คือความอ่อนโยนที่มั่นคง",
      strength: "มั่นใจ อบอุ่น และทำให้คนรอบตัวมีกำลังใจ ดวงอาทิตย์ (The Sun) ทำให้ส่องสว่างได้ทุกที่ที่ไป",
      shadow: "ถือศักดิ์ศรีสูง อยากได้รับการยอมรับจนเจ็บง่าย และบางครั้งลืมว่าคนอื่นก็อยากมีที่ยืนบนเวทีเหมือนกัน",
      love: "รักแบบเต็มหัวใจ ชอบดูแลและเอาใจคนรัก ต้องการคนที่ชื่นชมและมองเห็นความตั้งใจของเรา",
      work: "เหมาะกับงานที่ได้แสดงตัวตน เช่น งานสร้างสรรค์ งานผู้นำ หรืองานหน้าฉาก ใช้เงินใจกว้าง ควรวางงบความสุขไว้ชัด ๆ",
      advice: "Strength บอกว่าไม่ต้องคำรามเพื่อให้คนเห็น ความใจเย็นและความเมตตาทำให้คนยอมรับเราได้ลึกกว่า",
    },
    en: {
      tagline: "A lion's heart held gently — true power is self-mastery.",
      nature:
        "Leo is charismatic, generous and wants life to mean something. Strength shows a woman calmly taming a lion: your lesson is that the greatest power is steady gentleness, not force.",
      strength: "Confidence, warmth and a gift for lifting others. The Sun makes you shine wherever you go.",
      shadow: "Pride, a need for recognition that bruises easily, and forgetting that others want a place on the stage too.",
      love: "Wholehearted and generous with affection. You need a partner who sees and appreciates your effort.",
      work: "Thrives where you can express yourself: creative work, leadership or front-of-stage roles. Generous with money, so set a clear budget for joy.",
      advice: "Strength says you do not need to roar to be seen. Calm and kindness earn deeper respect.",
    },
  },
  {
    id: "virgo",
    nameTh: "ราศีกันย์",
    nameEn: "Virgo",
    element: "earth",
    modality: "mutable",
    majorCardId: "major-09",
    rulerTh: "ดาวพุธ",
    rulerEn: "Mercury",
    rulerCardId: "major-01",
    decans: [
      { start: md(8, 23), cardId: "pentacles-08", planetTh: "ดวงอาทิตย์", planetEn: "Sun" },
      { start: md(9, 2), cardId: "pentacles-09", planetTh: "ดาวศุกร์", planetEn: "Venus" },
      { start: md(9, 12), cardId: "pentacles-10", planetTh: "ดาวพุธ", planetEn: "Mercury" },
    ],
    th: {
      tagline: "ผู้ถือตะเกียงแห่งความละเอียด — หาความจริงด้วยการสังเกตอย่างเงียบ ๆ",
      nature:
        "คนราศีกันย์ช่างสังเกต รอบคอบ และอยากทำทุกอย่างให้ดีที่สุด ไพ่ The Hermit แสดงผู้ถือตะเกียงเดินทางลำพัง สะท้อนคนที่ต้องการเวลาเงียบเพื่อคิด และมักเป็นแสงนำทางให้คนอื่นโดยไม่รู้ตัว",
      strength: "ละเอียด วิเคราะห์เก่ง และพร้อมช่วยเหลือแบบลงมือจริง ดาวพุธ (The Magician) ทำให้แก้ปัญหาเป็นระบบ",
      shadow: "วิจารณ์ตัวเองหนักเกินไป กังวลเรื่องเล็ก และรอให้ทุกอย่างสมบูรณ์แบบก่อนจะเริ่ม",
      love: "แสดงความรักผ่านการดูแลเรื่องเล็ก ๆ ในชีวิตประจำวัน ต้องการคนที่เห็นคุณค่าของความใส่ใจเงียบ ๆ",
      work: "เก่งงานที่ต้องการความแม่นยำ เช่น สุขภาพ การวิเคราะห์ บัญชี หรืองานบริการที่ต้องใส่ใจรายละเอียด",
      advice: "The Hermit บอกว่าแสงตะเกียงไม่ต้องสว่างทั้งโลก แค่พอให้เห็นก้าวถัดไปก็เดินต่อได้แล้ว",
    },
    en: {
      tagline: "The lantern-bearer of detail — finding truth through quiet observation.",
      nature:
        "Virgo is observant, careful and wants everything done well. The Hermit walks alone with a lantern: you need quiet time to think, and you often light the way for others without noticing.",
      strength: "Precision, analysis and hands-on help. Mercury (The Magician) makes you a systematic problem-solver.",
      shadow: "Harsh self-criticism, worrying over small things, and waiting for perfection before you start.",
      love: "You love through small daily acts of care and need someone who values quiet attention.",
      work: "Excels where accuracy matters: health, analysis, accounting, or service roles that reward attention to detail.",
      advice: "The Hermit says a lantern need not light the whole world, only enough to see the next step.",
    },
  },
  {
    id: "libra",
    nameTh: "ราศีตุลย์",
    nameEn: "Libra",
    element: "air",
    modality: "cardinal",
    majorCardId: "major-11",
    rulerTh: "ดาวศุกร์",
    rulerEn: "Venus",
    rulerCardId: "major-03",
    decans: [
      { start: md(9, 23), cardId: "swords-02", planetTh: "ดวงจันทร์", planetEn: "Moon" },
      { start: md(10, 3), cardId: "swords-03", planetTh: "ดาวเสาร์", planetEn: "Saturn" },
      { start: md(10, 13), cardId: "swords-04", planetTh: "ดาวพฤหัสบดี", planetEn: "Jupiter" },
    ],
    th: {
      tagline: "ผู้ถือตาชั่ง — แสวงหาความยุติธรรมและความงามที่สมดุล",
      nature:
        "คนราศีตุลย์มีเสน่ห์ เข้ากับคนง่าย และทนเห็นความไม่ยุติธรรมไม่ได้ ไพ่ Justice สะท้อนคนที่ชั่งน้ำหนักทุกเรื่องอย่างรอบด้าน และเชื่อว่าทุกการกระทำมีผลตามมาเสมอ",
      strength: "มองเห็นมุมของทุกฝ่าย เป็นคนกลางที่ดี และมีรสนิยมเรื่องความงาม ดาวศุกร์ (The Empress) ทำให้สร้างความกลมกลืนได้ทุกที่",
      shadow: "ตัดสินใจยากเพราะไม่อยากให้ใครเสียใจ ยอมเก็บความรู้สึกตัวเองไว้เพื่อรักษาบรรยากาศ",
      love: "ให้ความสำคัญกับความเป็นคู่ ต้องการความสัมพันธ์ที่เท่าเทียมและให้เกียรติกัน",
      work: "เหมาะกับงานกฎหมาย การเจรจา ออกแบบ ศิลปะ หรืองานประสานงานที่ต้องเชื่อมคนหลายฝ่าย",
      advice: "Justice บอกว่าความยุติธรรมรวมถึงความยุติธรรมต่อตัวเองด้วย การพูดความต้องการของเราไม่ใช่การทำลายสมดุล",
    },
    en: {
      tagline: "The scale-bearer — seeking fairness and balanced beauty.",
      nature:
        "Libra is charming, easy to be around and cannot stand injustice. Justice reflects someone who weighs every side and knows that every action has consequences.",
      strength: "Seeing every perspective, mediating well and a strong sense of beauty. Venus (The Empress) lets you create harmony anywhere.",
      shadow: "Struggling to decide because you do not want to hurt anyone, and hiding your own needs to keep the peace.",
      love: "Partnership matters deeply. You want a relationship that is equal and respectful.",
      work: "Suited to law, negotiation, design, the arts, or coordination roles that connect many people.",
      advice: "Justice says fairness includes being fair to yourself. Voicing your needs does not break the balance.",
    },
  },
  {
    id: "scorpio",
    nameTh: "ราศีพิจิก",
    nameEn: "Scorpio",
    element: "water",
    modality: "fixed",
    majorCardId: "major-13",
    rulerTh: "ดาวพลูโต",
    rulerEn: "Pluto",
    rulerCardId: "major-20",
    decans: [
      { start: md(10, 23), cardId: "cups-05", planetTh: "ดาวอังคาร", planetEn: "Mars" },
      { start: md(11, 2), cardId: "cups-06", planetTh: "ดวงอาทิตย์", planetEn: "Sun" },
      { start: md(11, 13), cardId: "cups-07", planetTh: "ดาวศุกร์", planetEn: "Venus" },
    ],
    th: {
      tagline: "ผู้เกิดใหม่จากเถ้าถ่าน — ปล่อยสิ่งเก่าให้ตายเพื่อให้ตัวจริงได้เกิด",
      nature:
        "คนราศีพิจิกลึกซึ้ง จริงจัง และมองทะลุผิวหน้าของทุกเรื่อง ไพ่ Death ไม่ได้หมายถึงความตาย แต่คือการเปลี่ยนผ่าน คนราศีนี้ผ่านการสูญเสียแล้วกลับมาแข็งแรงกว่าเดิมได้เสมอ",
      strength: "ใจแน่วแน่ ซื่อสัตย์ต่อคนที่ไว้ใจ และมีพลังฟื้นตัวสูง ดาวพลูโต (Judgement) ทำให้ตื่นรู้และเริ่มใหม่ได้หลังวิกฤต",
      shadow: "ระแวง เก็บความลับ ยึดติดกับความเจ็บ และบางครั้งอยากควบคุมทุกอย่างเพื่อไม่ให้ต้องเจ็บซ้ำ",
      love: "รักลึกและรักจริง ต้องการความซื่อสัตย์แบบไม่มีเงื่อนไข เมื่อไว้ใจแล้วจะผูกพันทั้งหัวใจ",
      work: "เก่งงานที่ต้องขุดลึก เช่น วิจัย จิตวิทยา การลงทุน การแพทย์ หรือการสืบหาความจริง",
      advice: "Death บอกว่าการปล่อยมือไม่ใช่ความพ่ายแพ้ บางอย่างต้องจบ เพื่อให้สิ่งที่ดีกว่ามีที่ให้เกิด",
    },
    en: {
      tagline: "Reborn from the ashes — letting the old die so the true self can live.",
      nature:
        "Scorpio is deep, intense and sees beneath the surface. Death is not about dying but about transformation: you pass through loss and return stronger every time.",
      strength: "Resolve, loyalty to those you trust and remarkable resilience. Pluto (Judgement) helps you awaken and begin again after a crisis.",
      shadow: "Suspicion, secrecy, holding on to old wounds, and wanting control so you never get hurt again.",
      love: "You love deeply and for real, and you need unconditional honesty. Once you trust, you bond with your whole heart.",
      work: "Excels at digging deep: research, psychology, investment, medicine or uncovering the truth.",
      advice: "Death says letting go is not defeat. Some things must end so something better has room to begin.",
    },
  },
  {
    id: "sagittarius",
    nameTh: "ราศีธนู",
    nameEn: "Sagittarius",
    element: "fire",
    modality: "mutable",
    majorCardId: "major-14",
    rulerTh: "ดาวพฤหัสบดี",
    rulerEn: "Jupiter",
    rulerCardId: "major-10",
    decans: [
      { start: md(11, 23), cardId: "wands-08", planetTh: "ดาวพุธ", planetEn: "Mercury" },
      { start: md(12, 3), cardId: "wands-09", planetTh: "ดวงจันทร์", planetEn: "Moon" },
      { start: md(12, 13), cardId: "wands-10", planetTh: "ดาวเสาร์", planetEn: "Saturn" },
    ],
    th: {
      tagline: "นักเดินทางผู้แสวงหาความหมาย — ผสมประสบการณ์ให้กลายเป็นปัญญา",
      nature:
        "คนราศีธนูรักอิสระ มองโลกในแง่ดี และอยากรู้ว่าชีวิตมีความหมายอะไร ไพ่ Temperance แสดงเทวดาที่เทน้ำระหว่างถ้วยสองใบ สะท้อนคนที่เรียนรู้จากการผสมหลายสิ่งเข้าด้วยกัน ทั้งผู้คน วัฒนธรรม และความเชื่อ",
      strength: "ใจกว้าง ตลก จริงใจ และมองภาพใหญ่เก่ง ดาวพฤหัสบดี (Wheel of Fortune) ทำให้มักมีโชคในจังหวะสำคัญ",
      shadow: "พูดตรงจนคนเจ็บ สัญญาเกินตัว และเบื่อง่ายเมื่อชีวิตเริ่มซ้ำเดิม",
      love: "ต้องการคู่ที่เป็นเพื่อนร่วมทางและให้อิสระ ความสัมพันธ์ที่ได้เรียนรู้และเติบโตไปด้วยกันจะทำให้อยู่ได้นาน",
      work: "เหมาะกับงานต่างประเทศ การสอน การท่องเที่ยว สื่อ หรืองานที่ได้ขยายโลกทัศน์ตลอดเวลา",
      advice: "Temperance บอกว่าความสุขอยู่ที่ความพอดี ไม่ต้องไปให้สุดทุกทาง ค่อย ๆ ผสมให้ลงตัว",
    },
    en: {
      tagline: "The seeker on the road — blending experience into wisdom.",
      nature:
        "Sagittarius loves freedom, stays optimistic and wants to know what life means. Temperance pours water between two cups: you grow by blending people, cultures and ideas.",
      strength: "Generosity, humour, honesty and big-picture thinking. Jupiter (Wheel of Fortune) often brings luck at key moments.",
      shadow: "Bluntness that stings, promising more than you can give, and boredom once life turns routine.",
      love: "You want a partner who is a fellow traveller and gives you freedom. Love lasts when you learn and grow together.",
      work: "Suited to international work, teaching, travel, media, or anything that keeps widening your world.",
      advice: "Temperance says happiness lives in balance. You do not have to go to every extreme; blend slowly until it fits.",
    },
  },
  {
    id: "capricorn",
    nameTh: "ราศีมังกร",
    nameEn: "Capricorn",
    element: "earth",
    modality: "cardinal",
    majorCardId: "major-15",
    rulerTh: "ดาวเสาร์",
    rulerEn: "Saturn",
    rulerCardId: "major-21",
    decans: [
      { start: md(12, 22), cardId: "pentacles-02", planetTh: "ดาวพฤหัสบดี", planetEn: "Jupiter" },
      { start: md(12, 31), cardId: "pentacles-03", planetTh: "ดาวอังคาร", planetEn: "Mars" },
      { start: md(1, 10), cardId: "pentacles-04", planetTh: "ดวงอาทิตย์", planetEn: "Sun" },
    ],
    th: {
      tagline: "นักปีนเขาผู้ไม่หยุด — ความทะเยอทะยานที่ต้องรู้ว่าอะไรผูกมัดเราอยู่",
      nature:
        "คนราศีมังกรมีวินัย ทำงานหนัก และมองระยะยาว ไพ่ The Devil ไม่ได้หมายถึงความชั่ว แต่คือโซ่ที่เราผูกตัวเองไว้ คนราศีนี้เก่งเรื่องโลกความจริงจนบางครั้งลืมว่าตัวเองมีสิทธิ์พัก",
      strength: "รับผิดชอบสูง อดทน และสร้างความสำเร็จที่จับต้องได้ ดาวเสาร์ (The World) ทำให้ไปถึงเส้นชัยได้จริงแม้ต้องใช้เวลา",
      shadow: "ยึดติดกับความสำเร็จ เงิน หรือภาพลักษณ์ จนกลายเป็นกรงที่ขังตัวเอง และแบกทุกอย่างไว้คนเดียว",
      love: "ดูเย็นชาภายนอกแต่จริงจังและมั่นคงมาก รักแบบวางแผนอนาคตด้วยกัน ต้องการคนที่อดทนรอให้เปิดใจ",
      work: "เหมาะกับงานบริหาร ธุรกิจ การเงิน หรือองค์กรที่มีบันไดให้ไต่ การเงินมั่นคงเพราะวางแผนเก่ง",
      advice: "The Devil บอกว่าโซ่ในภาพหลวมพอจะถอดออกเองได้ ลองถามว่าอะไรที่เรายึดไว้เพราะกลัว ไม่ใช่เพราะรัก",
    },
    en: {
      tagline: "The relentless climber — ambition that must know what binds it.",
      nature:
        "Capricorn is disciplined, hardworking and thinks long-term. The Devil is not evil but the chains we tie ourselves with: you are so good at the real world you forget you are allowed to rest.",
      strength: "Responsibility, endurance and tangible success. Saturn (The World) carries you over the finish line, however long it takes.",
      shadow: "Clinging to success, money or image until it becomes a cage, and carrying everything alone.",
      love: "Cool on the surface but serious and steady. You love by planning a future together and need someone patient enough to wait.",
      work: "Made for management, business, finance, or organisations with a ladder to climb. Planning keeps your finances solid.",
      advice: "The Devil notes that the chains in the picture are loose enough to lift off. Ask what you hold on to out of fear, not love.",
    },
  },
  {
    id: "aquarius",
    nameTh: "ราศีกุมภ์",
    nameEn: "Aquarius",
    element: "air",
    modality: "fixed",
    majorCardId: "major-17",
    rulerTh: "ดาวยูเรนัส",
    rulerEn: "Uranus",
    rulerCardId: "major-00",
    decans: [
      { start: md(1, 20), cardId: "swords-05", planetTh: "ดาวศุกร์", planetEn: "Venus" },
      { start: md(1, 30), cardId: "swords-06", planetTh: "ดาวพุธ", planetEn: "Mercury" },
      { start: md(2, 9), cardId: "swords-07", planetTh: "ดวงจันทร์", planetEn: "Moon" },
    ],
    th: {
      tagline: "ดวงดาวแห่งความหวัง — คิดต่าง เพื่อให้โลกดีขึ้นกว่าเดิม",
      nature:
        "คนราศีกุมภ์เป็นตัวของตัวเอง คิดนอกกรอบ และใส่ใจเรื่องส่วนรวม ไพ่ The Star แสดงหญิงสาวที่เทน้ำคืนสู่ผืนดินและสายน้ำ สะท้อนคนที่อยากเยียวยาโลกและเชื่อในอนาคตที่ดีกว่า",
      strength: "มีวิสัยทัศน์ เป็นมิตรกับทุกคน และกล้าแตกต่าง ดาวยูเรนัส (The Fool) ทำให้กล้ากระโดดไปยังสิ่งใหม่ที่คนอื่นยังไม่กล้า",
      shadow: "ห่างเหินทางอารมณ์ ดื้อในความคิดตัวเอง และบางครั้งรักมนุษยชาติมากกว่าคนตรงหน้า",
      love: "ต้องการคนที่เป็นเพื่อนสนิทก่อนเป็นคนรัก และเคารพพื้นที่ส่วนตัว ความสัมพันธ์ที่ไม่ครอบครองจะอยู่ได้นาน",
      work: "เหมาะกับเทคโนโลยี นวัตกรรม งานสังคม หรืองานที่ได้เปลี่ยนระบบเดิมให้ดีขึ้น",
      advice: "The Star บอกว่าความหวังต้องเริ่มจากการเติมน้ำให้ตัวเองก่อน แล้วจึงเทให้คนอื่น",
    },
    en: {
      tagline: "The star of hope — thinking differently to make the world better.",
      nature:
        "Aquarius is independent, original and cares about the collective. The Star pours water back to the earth and the stream: you want to heal the world and believe in a better future.",
      strength: "Vision, friendliness to all and the courage to be different. Uranus (The Fool) lets you leap toward what others do not dare try yet.",
      shadow: "Emotional distance, stubborn ideas, and sometimes loving humanity more than the person in front of you.",
      love: "You need a best friend before a lover, and respect for your space. Relationships without possessiveness last.",
      work: "Suited to technology, innovation, social causes, or anything that improves old systems.",
      advice: "The Star says hope starts by refilling your own cup before you pour for others.",
    },
  },
  {
    id: "pisces",
    nameTh: "ราศีมีน",
    nameEn: "Pisces",
    element: "water",
    modality: "mutable",
    majorCardId: "major-18",
    rulerTh: "ดาวเนปจูน",
    rulerEn: "Neptune",
    rulerCardId: "major-12",
    decans: [
      { start: md(2, 19), cardId: "cups-08", planetTh: "ดาวเสาร์", planetEn: "Saturn" },
      { start: md(3, 1), cardId: "cups-09", planetTh: "ดาวพฤหัสบดี", planetEn: "Jupiter" },
      { start: md(3, 11), cardId: "cups-10", planetTh: "ดาวอังคาร", planetEn: "Mars" },
    ],
    th: {
      tagline: "นักฝันใต้แสงจันทร์ — รับรู้สิ่งที่ตามองไม่เห็น",
      nature:
        "คนราศีมีนอ่อนโยน ช่างฝัน และเข้าใจความรู้สึกของคนอื่นเหมือนเป็นของตัวเอง ไพ่ The Moon สะท้อนโลกของจิตใต้สำนึก ความฝัน และสัญชาตญาณ คนราศีนี้เดินทางในโลกนั้นได้คล่องกว่าใคร",
      strength: "เห็นอกเห็นใจ มีจินตนาการ และมีสัญชาตญาณลึก ดาวเนปจูน (The Hanged Man) ทำให้มองเรื่องเดิมจากมุมใหม่ได้เสมอ",
      shadow: "หนีความจริง เชื่อคนง่าย และรับอารมณ์คนอื่นมาจนแยกไม่ออกว่าอะไรเป็นของตัวเอง",
      love: "รักแบบโรแมนติกและเสียสละ ต้องระวังการรักคนที่ภาพในหัวมากกว่าตัวจริง",
      work: "เหมาะกับงานศิลปะ ดนตรี การเยียวยา จิตวิญญาณ หรืองานช่วยเหลือผู้คน",
      advice: "The Moon บอกว่าไม่ใช่ทุกสิ่งที่เห็นในความมืดคือความจริง เชื่อสัญชาตญาณ แต่ตรวจสอบกับความจริงด้วย",
    },
    en: {
      tagline: "The dreamer under moonlight — sensing what the eye cannot see.",
      nature:
        "Pisces is gentle, dreamy and feels other people's emotions as if they were your own. The Moon reflects the subconscious, dreams and intuition, a world you navigate better than anyone.",
      strength: "Compassion, imagination and deep intuition. Neptune (The Hanged Man) always shows you a new angle on an old story.",
      shadow: "Escaping reality, trusting too easily, and absorbing others' moods until you cannot tell which are yours.",
      love: "Romantic and self-giving. Be careful not to fall for the person in your head rather than the one in front of you.",
      work: "Suited to art, music, healing, spirituality, or any work that helps people.",
      advice: "The Moon says not everything seen in the dark is true. Trust your instinct, then check it against reality.",
    },
  },
];

export function getZodiacSign(id: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((s) => s.id === id);
}
