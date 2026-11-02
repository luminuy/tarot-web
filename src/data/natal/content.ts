/**
 * 📖 คำอธิบายผังดวงกำเนิด (ไทย + อังกฤษ) — เนื้อหาเขียนเอง ประกอบด้วยโค้ด ไม่ใช้ AI
 * ===========================================================================
 *
 * วิธีประกอบ: ดาวแต่ละดวงมี "คำกริยา" (คุณ…ยังไง) · ราศีมี "ท่าที" (…อย่างไร) + จุดแข็ง + จุดระวัง ·
 * เรือนมี "เวที" (เกิดขึ้นในเรื่องไหน) ➔ ประกอบเป็นประโยคได้ครบทุกคู่ดาว×ราศี×เรือน (13×12×12)
 * โดยไม่ต้องเขียน 1,800 ย่อหน้า · ดวงจันทร์และลัคนาเขียนแยกราศีละย่อหน้า (สองจุดที่คนอ่านมากที่สุด)
 * ดวงอาทิตย์ใช้คำอธิบายราศีเดิมจาก `src/data/zodiac.ts` (ผ่านการตรวจมาแล้วในหน้าราศี)
 *
 * ⚠️ ห้ามอิโมจิ/สัญลักษณ์ (กฎเหล็ก 2) · ภาษาคน (กฎเหล็ก 10) · ไพ่ใช้ระบบ Golden Dawn ชุดเดียวกับหน้าราศี
 * เจ้าของ 2026-11-02 "เน้นความตรงแม่นยำ ไม่เอาตอบกลาง ๆ เซฟ · เข้าใจง่าย ตรงประเด็น ไม่กำกวม" ➔ เขียนเป็นข้อเท็จจริงของผัง
 * ไม่ใช้คำกั๊ก (อาจ · บางที · ค่อนข้าง · may · might) · ไม่เขียน "A หรือ B หรือ C" ที่ครอบทุกผล · คำแนะนำเป็นคำสั่งที่ทำได้จริง ·
 * แต่ยังไม่ทำนายเหตุร้าย ความตาย อุบัติเหตุ โรค การตั้งครรภ์ คดี หรือผลการลงทุน
 * ⏸️ รอแม่หมอตรวจเนื้อหา (เหมือนเนื้อหาราศีชุดอื่น) — ดู docs/plans/NATAL_CHART_PLAN_2026-10-27.md
 */
import type { AspectType, BodyId, ChartWarning, Dignity, Element, HouseSystem, Modality, PatternType } from "@/lib/astro/natal";

export type Lang = "th" | "en";
export interface T {
  th: string;
  en: string;
}

export interface BodyText {
  name: T;
  /** ป้ายสั้นบนวงผัง */
  short: T;
  /** ดาวนี้หมายถึงอะไร (ประโยคเดียว) */
  theme: T;
  /** คำนามสั้น ใช้ในมุมสัมพันธ์ ("…ของคุณ") */
  noun: T;
  /** คำกริยาหลัง "คุณ" — "You …" */
  verb: T;
  /** ไพ่ประจำดาว (Golden Dawn · ดาวนอกใช้ระบบสมัยใหม่) */
  cardId?: string;
  /** ดาวรุ่น: อยู่ราศีเดียวหลายปี */
  generational?: boolean;
}

export const BODY_TEXT: Record<BodyId, BodyText> = {
  sun: {
    name: { th: "ดวงอาทิตย์", en: "Sun" },
    short: { th: "อา", en: "Su" },
    theme: { th: "ตัวตนแกนกลาง เป้าหมาย และพลังชีวิต", en: "your core self, purpose and vitality" },
    noun: { th: "ตัวตนและเป้าหมาย", en: "identity and purpose" },
    verb: { th: "เป็นตัวของตัวเองและเปล่งประกาย", en: "express who you are and shine" },
    cardId: "major-19",
  },
  moon: {
    name: { th: "ดวงจันทร์", en: "Moon" },
    short: { th: "จ", en: "Mo" },
    theme: { th: "อารมณ์ ความต้องการลึก ๆ และสิ่งที่ทำให้ใจปลอดภัย", en: "your emotions, deep needs and what makes you feel safe" },
    noun: { th: "อารมณ์และความต้องการลึก ๆ", en: "emotional needs" },
    verb: { th: "รู้สึก ดูแลใจตัวเอง และหาความปลอดภัย", en: "feel, self-soothe and seek safety" },
    cardId: "major-02",
  },
  mercury: {
    name: { th: "ดาวพุธ", en: "Mercury" },
    short: { th: "พ", en: "Me" },
    theme: { th: "ความคิด การสื่อสาร และการเรียนรู้", en: "how you think, speak and learn" },
    noun: { th: "ความคิดและการสื่อสาร", en: "mind and communication" },
    verb: { th: "คิด สื่อสาร และเรียนรู้", en: "think, communicate and learn" },
    cardId: "major-01",
  },
  venus: {
    name: { th: "ดาวศุกร์", en: "Venus" },
    short: { th: "ศ", en: "Ve" },
    theme: { th: "ความรัก รสนิยม และสิ่งที่คุณให้คุณค่า", en: "love, taste and what you value" },
    noun: { th: "ความรักและรสนิยม", en: "love and values" },
    verb: { th: "รัก ให้คุณค่า และมีความสุขกับสิ่งสวยงาม", en: "love, value and enjoy beauty" },
    cardId: "major-03",
  },
  mars: {
    name: { th: "ดาวอังคาร", en: "Mars" },
    short: { th: "อ", en: "Ma" },
    theme: { th: "แรงขับ ความกล้า และวิธีลงมือ", en: "drive, courage and how you act" },
    noun: { th: "แรงขับและการลงมือ", en: "drive and action" },
    verb: { th: "ลงมือ ปกป้องตัวเอง และไล่ตามสิ่งที่ต้องการ", en: "act, defend yourself and go after what you want" },
    cardId: "major-16",
  },
  jupiter: {
    name: { th: "ดาวพฤหัสบดี", en: "Jupiter" },
    short: { th: "พฤ", en: "Ju" },
    theme: { th: "โอกาส ความเชื่อ และการเติบโต", en: "growth, faith and opportunity" },
    noun: { th: "โอกาสและความเชื่อ", en: "growth and faith" },
    verb: { th: "เติบโต มองหาความหมาย และเปิดรับโอกาส", en: "grow, seek meaning and welcome opportunity" },
    cardId: "major-10",
  },
  saturn: {
    name: { th: "ดาวเสาร์", en: "Saturn" },
    short: { th: "ส", en: "Sa" },
    theme: { th: "ความรับผิดชอบ ขีดจำกัด และบทเรียนที่ทำให้โต", en: "responsibility, limits and the lessons that mature you" },
    noun: { th: "ความรับผิดชอบและขีดจำกัด", en: "duty and limits" },
    verb: { th: "รับผิดชอบ วางรากฐาน และเผชิญข้อจำกัด", en: "take responsibility, build foundations and face limits" },
    cardId: "major-21",
  },
  uranus: {
    name: { th: "ดาวยูเรนัส", en: "Uranus" },
    short: { th: "ยู", en: "Ur" },
    theme: { th: "อิสรภาพ ความแปลกใหม่ และการเปลี่ยนแปลงฉับพลัน", en: "freedom, originality and sudden change" },
    noun: { th: "อิสรภาพและการเปลี่ยนแปลงฉับพลัน", en: "freedom and sudden change" },
    verb: { th: "แหกกรอบและเปลี่ยนแปลงอย่างฉับพลัน", en: "break patterns and change suddenly" },
    cardId: "major-00",
    generational: true,
  },
  neptune: {
    name: { th: "ดาวเนปจูน", en: "Neptune" },
    short: { th: "เน", en: "Ne" },
    theme: { th: "ความฝัน สัญชาตญาณ และสิ่งที่อยู่เหนือเหตุผล", en: "dreams, intuition and what lies beyond logic" },
    noun: { th: "ความฝันและสัญชาตญาณ", en: "dreams and intuition" },
    verb: { th: "ฝัน ใช้สัญชาตญาณ และหลอมรวมกับสิ่งที่ใหญ่กว่าตัวเอง", en: "dream, trust intuition and merge with something larger" },
    cardId: "major-12",
    generational: true,
  },
  pluto: {
    name: { th: "ดาวพลูโต", en: "Pluto" },
    short: { th: "พล", en: "Pl" },
    theme: { th: "อำนาจ การทิ้งของเก่า และการเกิดใหม่", en: "power, letting go and rebirth" },
    noun: { th: "อำนาจและการเปลี่ยนแปลงถึงราก", en: "power and deep change" },
    verb: { th: "เผชิญอำนาจ ปล่อยของเก่า และเกิดใหม่", en: "face power, release the old and transform" },
    cardId: "major-20",
    generational: true,
  },
  chiron: {
    name: { th: "ไครอน", en: "Chiron" },
    short: { th: "ไค", en: "Ch" },
    theme: { th: "บาดแผลเก่าที่กลายเป็นพลังเยียวยา", en: "the old wound that becomes your gift for healing" },
    noun: { th: "แผลใจและการเยียวยา", en: "wounding and healing" },
    verb: { th: "เจ็บ เรียนรู้จากแผล และช่วยเยียวยาคนอื่น", en: "hurt, learn from the wound and help others heal" },
  },
  node: {
    name: { th: "โหนดเหนือ", en: "North Node" },
    short: { th: "โหนด", en: "Nd" },
    theme: { th: "ทิศทางที่ชีวิตชวนให้เติบโต (ในโหราไทยคือราหู)", en: "the direction life invites you to grow toward" },
    noun: { th: "ทิศทางการเติบโต", en: "growth direction" },
    verb: { th: "เติบโตไปสู่ทิศทางใหม่", en: "grow toward something new" },
  },
  southNode: {
    name: { th: "โหนดใต้", en: "South Node" },
    short: { th: "โหนดใต้", en: "SN" },
    theme: { th: "สิ่งที่ถนัดอยู่แล้วจนเป็นนิสัยเดิม", en: "what you already know by heart, your comfort zone" },
    noun: { th: "นิสัยเดิมที่ถนัด", en: "comfort zone" },
    verb: { th: "ทำได้เองโดยไม่ต้องคิด", en: "do without thinking" },
  },
  lilith: {
    name: { th: "ลิลิธ", en: "Black Moon Lilith" },
    short: { th: "ลิลิธ", en: "Li" },
    theme: { th: "ด้านดิบที่ไม่ยอมให้ใครควบคุม", en: "the untamed part of you that refuses control" },
    noun: { th: "ด้านดิบที่ไม่ยอมใคร", en: "untamed self" },
    verb: { th: "ไม่ยอมให้ใครกดหรือควบคุม", en: "refuse to be controlled" },
  },
  fortune: {
    name: { th: "ส่วนแห่งโชค", en: "Part of Fortune" },
    short: { th: "โชค", en: "PF" },
    theme: { th: "จุดที่ชีวิตลื่นไหลและโชคมาหาเองตามธรรมชาติ", en: "where life flows easily and luck finds you" },
    noun: { th: "ความลื่นไหลและโชค", en: "ease and fortune" },
    verb: { th: "รู้สึกถึงความลื่นไหลและโชค", en: "feel ease and good fortune" },
  },
  vertex: {
    name: { th: "เวอร์เท็กซ์", en: "Vertex" },
    short: { th: "วท", en: "Vx" },
    theme: { th: "คนและเหตุการณ์ที่เหมือนโชคชะตาจัดมา", en: "people and events that feel fated" },
    noun: { th: "การพบเจอที่เหมือนชะตาจัดมา", en: "fated encounters" },
    verb: { th: "พบคนและเหตุการณ์ที่เหมือนโชคชะตาจัดมา", en: "meet people and events that feel fated" },
  },
  ceres: {
    name: { th: "ซีรีส", en: "Ceres" },
    short: { th: "ซีร", en: "Ce" },
    theme: { th: "วิธีดูแลและอยากได้รับการดูแล การเลี้ยงดู และความอุดมสมบูรณ์", en: "how you nurture and want to be nurtured" },
    noun: { th: "การดูแลและเลี้ยงดู", en: "nurturing" },
    verb: { th: "ดูแล เลี้ยงดู และหล่อเลี้ยงคนรอบตัว", en: "nurture and care for others" },
  },
  pallas: {
    name: { th: "พัลลัส", en: "Pallas" },
    short: { th: "พัล", en: "Pa" },
    theme: { th: "ปัญญา กลยุทธ์ และการมองเห็นรูปแบบ", en: "wisdom, strategy and pattern recognition" },
    noun: { th: "ปัญญาและกลยุทธ์", en: "wisdom and strategy" },
    verb: { th: "วางกลยุทธ์ แก้ปัญหา และมองเห็นภาพรวม", en: "strategize, solve problems and see patterns" },
  },
  juno: {
    name: { th: "จูโน", en: "Juno" },
    short: { th: "จูโน", en: "Jn" },
    theme: { th: "ความผูกมัด คู่ชีวิต และสิ่งที่ต้องการในความสัมพันธ์ระยะยาว", en: "commitment and what you need in a long-term partner" },
    noun: { th: "ความผูกมัดและคู่ชีวิต", en: "commitment" },
    verb: { th: "ผูกมัด ซื่อสัตย์ และสร้างความสัมพันธ์ระยะยาว", en: "commit and build lasting partnership" },
  },
  vesta: {
    name: { th: "เวสต้า", en: "Vesta" },
    short: { th: "เวส", en: "Vs" },
    theme: { th: "สิ่งที่คุณทุ่มเทอย่างตั้งใจ และไฟในใจที่ต้องรักษาไว้", en: "devotion, focus and the inner flame you tend" },
    noun: { th: "ความทุ่มเทและสมาธิ", en: "devotion and focus" },
    verb: { th: "ทุ่มเท จดจ่อ และรักษาสิ่งศักดิ์สิทธิ์ในใจ", en: "devote yourself and keep your focus" },
  },
  asc: {
    name: { th: "ลัคนา", en: "Ascendant" },
    short: { th: "ลัคนา", en: "AC" },
    theme: { th: "ภาพแรกที่คนเห็น และวิธีที่คุณเริ่มต้นสิ่งต่าง ๆ", en: "the first impression you give and how you begin things" },
    noun: { th: "ภาพลักษณ์และการเริ่มต้น", en: "persona and approach" },
    verb: { th: "ปรากฏตัวต่อโลกและเริ่มต้นสิ่งใหม่", en: "meet the world and begin new things" },
  },
  mc: {
    name: { th: "กลางฟ้า (MC)", en: "Midheaven (MC)" },
    short: { th: "MC", en: "MC" },
    theme: { th: "เป้าหมายชีวิต อาชีพ และภาพที่สังคมจดจำ", en: "your calling, career and public image" },
    noun: { th: "เป้าหมายชีวิตและอาชีพ", en: "career and calling" },
    verb: { th: "มุ่งสู่เป้าหมายชีวิตและบทบาทในสังคม", en: "pursue your calling and public role" },
  },
  dsc: {
    name: { th: "จุดตก (DSC)", en: "Descendant (DSC)" },
    short: { th: "DSC", en: "DC" },
    theme: { th: "คนแบบที่คุณดึงดูดเข้ามาเป็นคู่", en: "the kind of partner you attract" },
    noun: { th: "คู่และหุ้นส่วน", en: "partners" },
    verb: { th: "จับคู่และร่วมมือกับคนอื่น", en: "partner with others" },
  },
  ic: {
    name: { th: "ก้นฟ้า (IC)", en: "Imum Coeli (IC)" },
    short: { th: "IC", en: "IC" },
    theme: { th: "รากเหง้า บ้าน และโลกส่วนตัวที่สุด", en: "your roots, home and most private self" },
    noun: { th: "รากเหง้าและบ้าน", en: "roots and home" },
    verb: { th: "กลับไปหารากและพักใจ", en: "return to your roots and rest" },
  },
};

export interface SignText {
  style: T;
  gift: T;
  watch: T;
  keywords: T;
}

/** ท่าทีของแต่ละราศี (เรียง เมษ ➔ มีน) — ใช้ต่อท้ายคำกริยาของดาว */
export const SIGN_TEXT: readonly SignText[] = [
  {
    style: { th: "อย่างกล้า ตรง และรวดเร็ว", en: "boldly, directly and fast" },
    gift: { th: "ความกล้าที่จะเริ่มก่อนใคร", en: "the courage to go first" },
    watch: { th: "ความใจร้อนและหุนหันพลันแล่น", en: "impatience and acting on impulse" },
    keywords: { th: "กล้า ริเริ่ม แข่งขัน", en: "brave, pioneering, competitive" },
  },
  {
    style: { th: "อย่างหนักแน่น ช้าแต่มั่นคง และใช้ประสาทสัมผัส", en: "steadily, sensually and at your own pace" },
    gift: { th: "ความอดทนและการสร้างของที่จับต้องได้", en: "patience and building things that last" },
    watch: { th: "ความดื้อและการติดความสบาย", en: "stubbornness and clinging to comfort" },
    keywords: { th: "มั่นคง อดทน รักความงาม", en: "stable, patient, sensual" },
  },
  {
    style: { th: "อย่างคล่องแคล่ว อยากรู้อยากเห็น และหลากหลาย", en: "nimbly, curiously and in many directions" },
    gift: { th: "ไหวพริบและการเชื่อมโยงผู้คน", en: "quick wit and connecting people" },
    watch: { th: "ความว่อกแว่กและการไม่ลงลึก", en: "scattering yourself and staying on the surface" },
    keywords: { th: "ช่างพูด ปรับตัวเร็ว ขี้สงสัย", en: "curious, versatile, talkative" },
  },
  {
    style: { th: "อย่างอ่อนโยน ปกป้อง และใช้ความรู้สึกนำ", en: "tenderly, protectively and led by feeling" },
    gift: { th: "การดูแลเอาใจใส่", en: "nurturing and care" },
    watch: { th: "ความอ่อนไหวและการปิดตัวเองเมื่อเจ็บ", en: "moodiness and withdrawing when hurt" },
    keywords: { th: "อบอุ่น ห่วงใย รักบ้าน", en: "caring, protective, home-loving" },
  },
  {
    style: { th: "อย่างอบอุ่น เปิดเผย และอยากให้คนเห็นคุณค่า", en: "warmly, openly and wanting to be seen" },
    gift: { th: "ความมั่นใจและใจกว้าง", en: "confidence and generosity" },
    watch: { th: "การอยากได้รับการยอมรับจนลืมฟังคนอื่น", en: "needing applause so much you stop listening" },
    keywords: { th: "มั่นใจ ใจกว้าง สร้างสรรค์", en: "proud, generous, creative" },
  },
  {
    style: { th: "อย่างละเอียด ใส่ใจ และหาทางทำให้ดีขึ้น", en: "carefully, precisely and always improving" },
    gift: { th: "ความช่างสังเกตและฝีมือในการช่วยเหลือ", en: "a sharp eye and skillful service" },
    watch: { th: "การติตัวเองจนเหนื่อยและกังวลเกินเหตุ", en: "self-criticism and worry" },
    keywords: { th: "ละเอียด มีระบบ ช่างช่วย", en: "analytical, orderly, helpful" },
  },
  {
    style: { th: "อย่างประนีประนอม มีรสนิยม และคิดถึงอีกฝ่าย", en: "gracefully, diplomatically and with the other person in mind" },
    gift: { th: "การสร้างสมดุลและความยุติธรรม", en: "balance, fairness and charm" },
    watch: { th: "การตัดสินใจไม่ได้และการเอาใจคนจนลืมตัวเอง", en: "indecision and people-pleasing" },
    keywords: { th: "สมดุล ยุติธรรม มีเสน่ห์", en: "fair, charming, cooperative" },
  },
  {
    style: { th: "อย่างลึก เข้มข้น และทุ่มสุดตัว", en: "intensely, deeply and all-in" },
    gift: { th: "พลังที่เปลี่ยนวิกฤตเป็นโอกาส", en: "the power to turn crisis into renewal" },
    watch: { th: "ความหึงหวง ความลับ และการเก็บความแค้น", en: "jealousy, secrecy and holding grudges" },
    keywords: { th: "ลึกซึ้ง จริงจัง ทรงพลัง", en: "intense, loyal, transformative" },
  },
  {
    style: { th: "อย่างกว้าง ร่าเริง และมองหาความหมาย", en: "expansively, cheerfully and in search of meaning" },
    gift: { th: "ความหวังและการมองภาพใหญ่", en: "optimism and the big picture" },
    watch: { th: "การสัญญาเกินตัวและความไม่อดทนกับรายละเอียด", en: "overpromising and skipping the details" },
    keywords: { th: "ผจญภัย มองโลกดี ใฝ่รู้", en: "adventurous, optimistic, philosophical" },
  },
  {
    style: { th: "อย่างจริงจัง มีแผน และมองระยะยาว", en: "seriously, strategically and for the long run" },
    gift: { th: "ความอดทนและความรับผิดชอบ", en: "discipline and responsibility" },
    watch: { th: "ความเครียดและการแบกทุกอย่างไว้คนเดียว", en: "stress and carrying everything alone" },
    keywords: { th: "มุ่งมั่น มีวินัย ทะเยอทะยาน", en: "ambitious, disciplined, practical" },
  },
  {
    style: { th: "อย่างอิสระ แปลกใหม่ และคิดถึงส่วนรวม", en: "independently, inventively and for the collective" },
    gift: { th: "ความคิดก้าวหน้าและมิตรภาพ", en: "original ideas and friendship" },
    watch: { th: "ความห่างเหินทางอารมณ์และความดื้อในความคิดตัวเอง", en: "emotional distance and rigid opinions" },
    keywords: { th: "อิสระ ล้ำ เพื่อส่วนรวม", en: "independent, inventive, humanitarian" },
  },
  {
    style: { th: "อย่างอ่อนไหว เปี่ยมจินตนาการ และเห็นใจผู้อื่น", en: "softly, imaginatively and with compassion" },
    gift: { th: "ความเมตตาและศิลปะ", en: "compassion and artistry" },
    watch: { th: "การหนีความจริงและการไม่ตั้งขอบเขต", en: "escapism and weak boundaries" },
    keywords: { th: "เมตตา ช่างฝัน มีสัญชาตญาณ", en: "compassionate, dreamy, intuitive" },
  },
];

export interface HouseText {
  title: T;
  arena: T;
}

export const HOUSE_TEXT: readonly HouseText[] = [
  { title: { th: "ตัวตนและภาพลักษณ์", en: "Self and appearance" }, arena: { th: "ตัวตน รูปลักษณ์ และวิธีเริ่มต้นสิ่งต่าง ๆ", en: "your self-image, body and how you start things" } },
  { title: { th: "เงินและคุณค่าในตัวเอง", en: "Money and self-worth" }, arena: { th: "เงิน ทรัพย์สิน และความรู้สึกว่าตัวเองมีค่า", en: "money, possessions and self-worth" } },
  { title: { th: "การสื่อสารและการเรียนรู้", en: "Communication and learning" }, arena: { th: "การพูด การเขียน การเรียน พี่น้อง และการเดินทางใกล้ ๆ", en: "speaking, writing, learning, siblings and short trips" } },
  { title: { th: "บ้านและครอบครัว", en: "Home and family" }, arena: { th: "บ้าน ครอบครัว รากเหง้า และพื้นที่ปลอดภัยทางใจ", en: "home, family, roots and emotional security" } },
  { title: { th: "ความรักและความสร้างสรรค์", en: "Romance and creativity" }, arena: { th: "ความรักแบบหวานใจ งานสร้างสรรค์ ความสนุก และลูก", en: "romance, creative work, play and children" } },
  { title: { th: "งานประจำวันและสุขภาพ", en: "Daily work and health" }, arena: { th: "งานประจำ กิจวัตร สุขภาพ และการช่วยเหลือคนอื่น", en: "daily work, routines, health and service" } },
  { title: { th: "คู่ครองและหุ้นส่วน", en: "Partnership" }, arena: { th: "คู่ชีวิต หุ้นส่วน และความสัมพันธ์แบบหนึ่งต่อหนึ่ง", en: "partners, contracts and one-to-one relationships" } },
  { title: { th: "สิ่งที่แบ่งปันและการเปลี่ยนแปลงลึก", en: "Shared resources and transformation" }, arena: { th: "เงินร่วม หนี้ มรดก ความใกล้ชิดลึกซึ้ง และการเปลี่ยนแปลงครั้งใหญ่", en: "shared money, debt, inheritance, intimacy and deep change" } },
  { title: { th: "ความเชื่อและการเดินทางไกล", en: "Beliefs and long journeys" }, arena: { th: "การเรียนสูง ความเชื่อ ปรัชญา และการเดินทางไกล", en: "higher learning, beliefs, philosophy and travel abroad" } },
  { title: { th: "อาชีพและชื่อเสียง", en: "Career and reputation" }, arena: { th: "อาชีพ ชื่อเสียง ตำแหน่ง และภาพที่สังคมจดจำ", en: "career, status, reputation and public life" } },
  { title: { th: "เพื่อนและความฝัน", en: "Friends and hopes" }, arena: { th: "เพื่อน กลุ่ม เครือข่าย และความหวังในอนาคต", en: "friends, groups, networks and hopes for the future" } },
  { title: { th: "โลกภายในและสิ่งที่ซ่อนอยู่", en: "The inner world" }, arena: { th: "จิตใต้สำนึก การพักผ่อน การปล่อยวาง และสิ่งที่อยู่เบื้องหลัง", en: "the unconscious, rest, retreat and what happens behind the scenes" } },
];

export const ASPECT_TEXT: Record<AspectType, { name: T; meaning: T }> = {
  conjunction: { name: { th: "กุม (0 องศา)", en: "Conjunction (0)" }, meaning: { th: "สองพลังนี้หลอมเป็นเรื่องเดียวกัน แยกกันไม่ออก", en: "these two forces fuse into one theme you cannot separate" } },
  opposition: { name: { th: "เล็ง (180 องศา)", en: "Opposition (180)" }, meaning: { th: "สองพลังนี้ดึงกันคนละทาง คุณเห็นอีกด้านผ่านคนใกล้ตัว และต้องใช้ทั้งสองด้านให้สมดุล", en: "these pull opposite ways; you meet the other side in people close to you and must balance both" } },
  trine: { name: { th: "ตรีโกณ (120 องศา)", en: "Trine (120)" }, meaning: { th: "สองพลังนี้ไหลเข้าหากันง่าย เป็นพรสวรรค์ที่มีอยู่แล้ว และให้ผลเมื่อคุณตั้งใจใช้", en: "these flow together easily, a ready-made gift that pays off when you use it on purpose" } },
  square: { name: { th: "จตุโกณ (90 องศา)", en: "Square (90)" }, meaning: { th: "สองพลังนี้ขัดกัน ทุกครั้งที่ต้องใช้พร้อมกันคุณจะติดขัด และแรงกดดันนี้คือสิ่งที่ผลักให้คุณลงมือ", en: "these clash, so you get stuck when you need both at once, and that pressure is what drives you" } },
  sextile: { name: { th: "โยค (60 องศา)", en: "Sextile (60)" }, meaning: { th: "สองพลังนี้เกื้อหนุนกันเมื่อคุณลงมือ เป็นโอกาสที่ต้องคว้าเอง", en: "these support each other once you take action, an opportunity you have to seize" } },
  quincunx: { name: { th: "150 องศา (Quincunx)", en: "Quincunx (150)" }, meaning: { th: "สองพลังนี้ไม่เข้าขากัน วิธีที่ได้ผลกับด้านหนึ่งใช้กับอีกด้านไม่ได้ คุณต้องปรับทีละนิดตลอด", en: "these do not fit; what works for one fails the other, so you keep adjusting" } },
  semisextile: { name: { th: "30 องศา (Semi-sextile)", en: "Semi-sextile (30)" }, meaning: { th: "สองพลังนี้อยู่ติดกันแต่ไม่คุ้นกัน คุณต้องฝึกให้ทำงานร่วมกัน", en: "these sit side by side but feel unfamiliar; you have to train them to work together" } },
  semisquare: { name: { th: "45 องศา (Semi-square)", en: "Semi-square (45)" }, meaning: { th: "เป็นความหงุดหงิดเล็ก ๆ ที่สะสมจนต้องจัดการ", en: "small irritations that build up until you deal with them" } },
  sesquiquadrate: { name: { th: "135 องศา (Sesquiquadrate)", en: "Sesquiquadrate (135)" }, meaning: { th: "เป็นแรงตึงที่ปะทุเป็นพัก ๆ จัดการทันทีที่เริ่มรู้สึก อย่าปล่อยให้สะสม", en: "tension that flares up now and then; deal with it early, before it builds" } },
  quintile: { name: { th: "72 องศา (Quintile)", en: "Quintile (72)" }, meaning: { th: "เป็นพรสวรรค์เชิงสร้างสรรค์ที่ยิ่งฝึกยิ่งเก่ง", en: "a creative talent that grows with practice" } },
  biquintile: { name: { th: "144 องศา (Biquintile)", en: "Biquintile (144)" }, meaning: { th: "เป็นความสามารถเฉพาะตัวที่แสดงออกแบบไม่เหมือนใคร", en: "a distinctive talent expressed in your own unique way" } },
};

/** ดวงจันทร์ในแต่ละราศี (เรียง เมษ ➔ มีน) */
export const MOON_SIGN_TEXT: readonly T[] = [
  {
    th: "ใจคุณร้อนเร็วและหายเร็ว ต้องการพื้นที่ให้ได้ลงมือและตัดสินใจเอง เวลาอึดอัดจะอยากทำอะไรสักอย่างมากกว่านั่งคุยเรื่องความรู้สึก การได้ขยับร่างกายช่วยให้ใจกลับมานิ่ง",
    en: "Your feelings flare fast and fade fast. You need room to act and decide for yourself, and when upset you would rather do something than talk about it. Moving your body is how you calm down.",
  },
  {
    th: "ใจคุณสงบเมื่อชีวิตมั่นคง มีอาหารอร่อย ที่นอนสบาย และคนที่ไว้ใจได้ คุณไม่ชอบการเปลี่ยนแปลงกะทันหัน ความรักของคุณแสดงผ่านการดูแลที่จับต้องได้",
    en: "You feel safe when life is steady: good food, a comfortable bed and people you can trust. Sudden change unsettles you, and you show love through practical, physical care.",
  },
  {
    th: "ใจคุณต้องการการพูดคุยและเรื่องใหม่ ๆ ให้คิด เวลามีเรื่องค้างใจ การได้เล่าหรือเขียนออกมาช่วยได้มาก อารมณ์เปลี่ยนไวตามข้อมูลที่ได้รับ",
    en: "Your heart needs conversation and fresh ideas. When something bothers you, talking or writing it out helps most, and your mood shifts quickly with new information.",
  },
  {
    th: "ดวงจันทร์อยู่บ้านของตัวเอง ใจคุณลึกและอ่อนโยน จำความรู้สึกได้นาน ผูกพันกับครอบครัวและคนใกล้ชิดมาก ต้องมีมุมปลอดภัยให้กลับไปพักใจเสมอ",
    en: "The Moon is at home here. Your feelings run deep and tender, you remember emotional moments for a long time, and you bond strongly with family. You always need a safe nest to return to.",
  },
  {
    th: "ใจคุณต้องการการยอมรับและความอบอุ่นที่แสดงออกชัด ๆ คุณให้ความรักเต็มที่และอยากให้อีกฝ่ายเห็นคุณค่าแบบเดียวกัน คำชมจริงใจเติมพลังใจคุณได้ดีที่สุด",
    en: "You need warmth and recognition shown openly. You love generously and hope to be valued the same way, and sincere appreciation refuels you like nothing else.",
  },
  {
    th: "ใจคุณสงบเมื่อทุกอย่างเป็นระเบียบและได้ช่วยใครสักคน เวลากังวลคุณจะจัดของหรือวางแผนเพื่อให้รู้สึกควบคุมได้ ใจดีกับตัวเองให้เท่ากับที่ใจดีกับคนอื่น",
    en: "You feel calm when things are in order and you can be useful. When worried, you tidy or plan to regain control. Be as kind to yourself as you are to others.",
  },
  {
    th: "ใจคุณต้องการความสงบและความสัมพันธ์ที่ราบรื่น การทะเลาะทำให้คุณเหนื่อยใจมาก คุณอ่านใจคนอื่นได้ดี แต่ลืมถามใจตัวเอง ก่อนตอบตกลงใคร ให้ถามตัวเองก่อนว่าต้องการอะไร",
    en: "You need harmony and smooth relationships, and conflict drains you. You read others well but forget to check in with yourself. Before you say yes to anyone, ask what you want.",
  },
  {
    th: "ใจคุณลึกและเข้มข้น ไม่ไว้ใจใครง่าย ๆ แต่เมื่อไว้ใจแล้วจะผูกพันสุดใจ คุณเก็บความรู้สึกเก่ง และต้องการความจริงใจแบบไม่มีอะไรปิดบัง",
    en: "Your emotions are intense and private. You do not trust easily, but once you do your loyalty is total. You need honesty with nothing hidden.",
  },
  {
    th: "ใจคุณต้องการอิสระ การเดินทาง และเรื่องที่ให้ความหวัง ถ้ารู้สึกถูกขังจะอึดอัดทันที อารมณ์ดีขึ้นเร็วเมื่อได้เรียนรู้หรือได้ออกไปเห็นโลกกว้าง",
    en: "You need freedom, travel and something to believe in. Feeling fenced in makes you restless fast, and your mood lifts when you learn something new or see more of the world.",
  },
  {
    th: "ใจคุณแข็งแรงและพึ่งตัวเองได้ คุณไม่แสดงอารมณ์ให้ใครเห็นง่าย ๆ ความรู้สึกปลอดภัยมาจากการมีเป้าหมายและความสำเร็จที่จับต้องได้ ใส่เวลาพักลงในตารางเหมือนงานอื่น",
    en: "You are emotionally self-reliant and rarely show your feelings. Security comes from goals and tangible achievement. Put rest on your schedule like any other task.",
  },
  {
    th: "ใจคุณต้องการพื้นที่ส่วนตัวและเพื่อนที่เข้าใจความคิดแปลก ๆ ของคุณ คุณมองอารมณ์ตัวเองจากระยะห่างเหมือนคนดูอยู่ข้างนอก ใจจึงเย็นเร็ว แต่คนใกล้ตัวรู้สึกเข้าไม่ถึง บอกเขาตรง ๆ ว่าคุณรู้สึกอะไร",
    en: "You need personal space and friends who get your unusual ideas. You watch your feelings from a distance, which calms you fast but leaves loved ones feeling shut out. Tell them plainly what you feel.",
  },
  {
    th: "ใจคุณอ่อนไหวและรับรู้ความรู้สึกคนรอบตัวได้ราวกับเป็นของตัวเอง คุณเมตตามาก แต่ต้องมีเวลาอยู่เงียบ ๆ คนเดียวเพื่อชาร์จพลัง และต้องตั้งขอบเขตให้ชัด",
    en: "You are deeply sensitive and absorb other people's feelings as if they were your own. You are compassionate, but you need quiet time alone to recharge and firm boundaries to stay well.",
  },
];

/** ลัคนาในแต่ละราศี */
export const RISING_TEXT: readonly T[] = [
  {
    th: "คนเห็นคุณเป็นคนกระตือรือร้น ตรงไปตรงมา และกล้าเริ่มก่อน คุณเข้าหาชีวิตแบบลุยเลย แล้วค่อยปรับระหว่างทาง",
    en: "People see you as energetic, direct and quick to take the lead. You meet life head-on and adjust as you go.",
  },
  {
    th: "คนเห็นคุณเป็นคนใจเย็น น่าไว้ใจ และมีรสนิยม คุณเริ่มสิ่งใหม่อย่างระมัดระวัง แต่เมื่อเริ่มแล้วจะทำจนสำเร็จ",
    en: "People see you as calm, dependable and tasteful. You start new things carefully, but once you commit you see them through.",
  },
  {
    th: "คนเห็นคุณเป็นคนช่างคุย ไหวพริบดี และดูอ่อนกว่าวัย คุณเข้าหาชีวิตด้วยความอยากรู้ และชอบมีหลายเรื่องให้ทำพร้อมกัน",
    en: "People see you as chatty, quick-witted and youthful. You approach life with curiosity and like having several things going at once.",
  },
  {
    th: "คนเห็นคุณเป็นคนอบอุ่น อ่อนโยน และน่าเข้าใกล้ คุณดูท่าทีก่อนเปิดใจ และดูแลคนรอบตัวโดยไม่รู้ตัว",
    en: "People see you as warm, gentle and approachable. You test the waters before opening up, and you look after others without noticing.",
  },
  {
    th: "คนเห็นคุณเป็นคนมีเสน่ห์ มั่นใจ และโดดเด่น คุณเข้าหาชีวิตอย่างเปิดเผยและอยากให้สิ่งที่ทำมีความหมายต่อคนอื่น",
    en: "People see you as charismatic, confident and hard to miss. You meet life openly and want what you do to matter to others.",
  },
  {
    th: "คนเห็นคุณเป็นคนเรียบร้อย ช่างสังเกต และพึ่งพาได้ คุณเริ่มสิ่งใหม่ด้วยการศึกษาข้อมูลให้ครบก่อน",
    en: "People see you as neat, observant and reliable. You start new things by gathering the details first.",
  },
  {
    th: "คนเห็นคุณเป็นคนสุภาพ มีเสน่ห์ และเข้ากับคนง่าย คุณเข้าหาชีวิตผ่านความสัมพันธ์ และรู้ว่าเมื่อไรควรพูด เมื่อไรควรถอย",
    en: "People see you as polite, charming and easy to get along with. You approach life through relationships and know when to speak and when to step back.",
  },
  {
    th: "คนเห็นคุณเป็นคนลึกลับ มีพลัง และอ่านยาก คุณสังเกตคนอื่นก่อนเปิดเผยตัวเอง และมีสัญชาตญาณเรื่องคนที่แม่นยำ",
    en: "People see you as magnetic, intense and hard to read. You watch before you reveal yourself, and your instincts about people are sharp.",
  },
  {
    th: "คนเห็นคุณเป็นคนร่าเริง เปิดกว้าง และชอบผจญภัย คุณเข้าหาชีวิตแบบมองหาโอกาสและความหมายในทุกเรื่อง",
    en: "People see you as cheerful, open-minded and adventurous. You approach life looking for opportunity and meaning.",
  },
  {
    th: "คนเห็นคุณเป็นคนจริงจัง เป็นผู้ใหญ่ และน่าเชื่อถือ คุณเริ่มทุกอย่างอย่างมีแผน และยิ่งอายุมากยิ่งผ่อนคลายขึ้น",
    en: "People see you as serious, mature and trustworthy. You plan before you move, and you relax more as you get older.",
  },
  {
    th: "คนเห็นคุณเป็นคนเป็นมิตร มีเอกลักษณ์ และคิดไม่เหมือนใคร คุณเข้าหาชีวิตแบบไม่ยึดกรอบเดิม",
    en: "People see you as friendly, original and unconventional. You approach life without following the usual script.",
  },
  {
    th: "คนเห็นคุณเป็นคนอ่อนโยน ช่างฝัน และเข้าถึงง่าย คุณรับรู้บรรยากาศรอบตัวได้ไว และปรับตัวตามบรรยากาศนั้นทันที",
    en: "People see you as gentle, dreamy and easy to open up to. You sense the mood of a room quickly and adapt to it right away.",
  },
];

export const DIGNITY_TEXT: Record<Dignity, { name: T; meaning: T }> = {
  domicile: { name: { th: "เกษตร", en: "Domicile" }, meaning: { th: "อยู่ราศีบ้านของตัวเอง พลังนี้ทำงานได้เต็มที่และเป็นธรรมชาติ", en: "it is at home here, so this energy works fully and naturally" } },
  exaltation: { name: { th: "อุจจ์", en: "Exaltation" }, meaning: { th: "อยู่ราศีที่ยกย่องดาวนี้ พลังนี้โดดเด่นและคนรอบตัวเห็นชัด", en: "it is exalted here, so this energy stands out and others notice it" } },
  detriment: { name: { th: "ประ", en: "Detriment" }, meaning: { th: "อยู่ราศีตรงข้ามบ้านตัวเอง วิธีที่ดาวนี้ถนัดใช้ไม่ได้ผลตรง ๆ คุณต้องหาวิธีของตัวเอง และฝึกมากกว่าคนอื่น", en: "it is opposite its home, so the usual approach misfires; you must find your own way and practice more" } },
  fall: { name: { th: "นิจ", en: "Fall" }, meaning: { th: "อยู่ราศีที่พลังนี้อ่อน คุณไม่มั่นใจในเรื่องนี้ตั้งแต่ต้น ต้องฝึกจริงจังถึงจะใช้ได้เต็มที่", en: "it is weakest here, so you start out unsure in this area; steady practice makes it work fully" } },
};

export const ELEMENT_TEXT: Record<Element, { name: T; strong: T; weak: T }> = {
  fire: {
    name: { th: "ไฟ", en: "Fire" },
    strong: { th: "ธาตุไฟเด่น: มีพลัง กล้าเริ่ม และกระตือรือร้น ระวังหมดไฟเพราะเร่งเกินไป", en: "Strong fire: energetic, brave and enthusiastic. Watch out for burnout from pushing too hard." },
    weak: { th: "ธาตุไฟน้อย: แรงจูงใจไม่มาเอง ต้องจุดจากข้างนอก ออกกำลังกายและตั้งเป้าเล็ก ๆ ที่ทำเสร็จได้ในวันเดียว", en: "Little fire: motivation does not come on its own. Exercise and set small goals you can finish in a day." },
  },
  earth: {
    name: { th: "ดิน", en: "Earth" },
    strong: { th: "ธาตุดินเด่น: ติดดิน ทำได้จริง และสร้างความมั่นคงเก่ง ระวังยึดติดกับสิ่งที่คุ้นเคย", en: "Strong earth: grounded, practical and good at building security. Watch out for getting stuck in the familiar." },
    weak: { th: "ธาตุดินน้อย: ความคิดดีแต่ลงมือจริงยาก เขียนตารางเวลาและงบประมาณเป็นตัวเลข เพื่อให้เรื่องต่าง ๆ เกิดขึ้นจริง", en: "Little earth: great ideas, weak follow-through. Write schedules and budgets in numbers to make things real." },
  },
  air: {
    name: { th: "ลม", en: "Air" },
    strong: { th: "ธาตุลมเด่น: คิดเร็ว สื่อสารเก่ง และเข้าสังคมได้ดี ระวังคิดมากจนไม่ได้ลงมือ", en: "Strong air: quick thinking, articulate and sociable. Watch out for overthinking instead of acting." },
    weak: { th: "ธาตุลมน้อย: คุณรู้สึกก่อนแล้วค่อยหาคำอธิบาย ก่อนตัดสินใจเรื่องสำคัญ ให้เขียนออกมาหรือคุยกับคนที่ไว้ใจ", en: "Little air: you feel first and explain later. Before big decisions, write it down or talk it through." },
  },
  water: {
    name: { th: "น้ำ", en: "Water" },
    strong: { th: "ธาตุน้ำเด่น: อ่อนไหว เข้าใจคน และมีสัญชาตญาณสูง ระวังรับอารมณ์คนอื่นมาเป็นของตัวเอง", en: "Strong water: sensitive, empathic and intuitive. Watch out for absorbing other people's moods." },
    weak: { th: "ธาตุน้ำน้อย: คุณไม่ถนัดพูดเรื่องความรู้สึก เล่าความรู้สึกให้คนใกล้ชิดฟังทีละเรื่อง ความสัมพันธ์จะลึกขึ้น", en: "Little water: feelings are hard for you to put into words. Share one feeling at a time with someone close and your bonds deepen." },
  },
};

export const MODALITY_TEXT: Record<Modality, { name: T; strong: T }> = {
  cardinal: { name: { th: "จรราศี (ผู้ริเริ่ม)", en: "Cardinal" }, strong: { th: "จรราศีเด่น: ถนัดเริ่มต้นและผลักดันให้เกิดสิ่งใหม่", en: "Strong cardinal: you are a starter who gets things moving." } },
  fixed: { name: { th: "สถิรราศี (ผู้ยืนหยัด)", en: "Fixed" }, strong: { th: "สถิรราศีเด่น: หนักแน่น ทำต่อเนื่อง และไม่ยอมแพ้ง่าย", en: "Strong fixed: steady, persistent and hard to shake." } },
  mutable: { name: { th: "อุภยราศี (ผู้ปรับตัว)", en: "Mutable" }, strong: { th: "อุภยราศีเด่น: ยืดหยุ่น ปรับตัวเก่ง และเชื่อมคนหลายแบบเข้าหากัน", en: "Strong mutable: flexible, adaptable and good at bridging differences." } },
};

export const HEMISPHERE_TEXT: Record<"north" | "south" | "east" | "west", { name: T; meaning: T }> = {
  north: { name: { th: "ครึ่งล่าง (ใต้ขอบฟ้า)", en: "Below the horizon" }, meaning: { th: "ดาวส่วนใหญ่อยู่ใต้ขอบฟ้า: ชีวิตเน้นโลกภายใน ครอบครัว และการเติบโตส่วนตัวมากกว่าภาพในสังคม", en: "Most planets below the horizon: your life centers on your inner world, family and personal growth more than public image." } },
  south: { name: { th: "ครึ่งบน (เหนือขอบฟ้า)", en: "Above the horizon" }, meaning: { th: "ดาวส่วนใหญ่อยู่เหนือขอบฟ้า: ชีวิตหันออกสู่โลกภายนอก งาน และบทบาทในสังคม", en: "Most planets above the horizon: your life faces outward toward work, the world and your public role." } },
  east: { name: { th: "ครึ่งตะวันออก", en: "Eastern half" }, meaning: { th: "ดาวส่วนใหญ่อยู่ฝั่งตะวันออก: คุณกำหนดชีวิตเองได้มาก ถนัดเริ่มต้นด้วยตัวเอง", en: "Most planets in the east: you shape your own life and prefer to take the initiative." } },
  west: { name: { th: "ครึ่งตะวันตก", en: "Western half" }, meaning: { th: "ดาวส่วนใหญ่อยู่ฝั่งตะวันตก: ชีวิตเดินผ่านความสัมพันธ์และการร่วมมือกับคนอื่น", en: "Most planets in the west: your life unfolds through relationships and cooperation." } },
};

export const MOON_PHASE_TEXT: readonly { name: T; meaning: T }[] = [
  { name: { th: "เดือนดับ (จันทร์ใหม่)", en: "New Moon" }, meaning: { th: "เกิดช่วงเริ่มรอบใหม่ คุณมีพลังของผู้เริ่มต้น ทำตามสัญชาตญาณมากกว่าแผน", en: "Born at a new beginning: you carry a starter's energy and follow instinct more than plans." } },
  { name: { th: "ข้างขึ้นเสี้ยว", en: "Crescent" }, meaning: { th: "เกิดช่วงจันทร์เริ่มโต คุณมีแรงผลักดันที่จะก้าวพ้นสิ่งเก่าและสร้างทางของตัวเอง", en: "Born as the Moon starts to grow: you are driven to move past the old and make your own way." } },
  { name: { th: "ขึ้นครึ่งดวง", en: "First Quarter" }, meaning: { th: "เกิดช่วงจันทร์ครึ่งดวงขาขึ้น คุณเป็นคนลงมือ กล้าตัดสินใจเมื่อเจออุปสรรค", en: "Born at the first quarter: you are a doer who decides boldly in a crisis." } },
  { name: { th: "ข้างขึ้นเกือบเต็ม", en: "Gibbous" }, meaning: { th: "เกิดช่วงจันทร์ใกล้เต็ม คุณชอบปรับปรุงสิ่งต่าง ๆ ให้ดีขึ้นและอยากเข้าใจลึก ๆ", en: "Born as the Moon nears full: you refine, improve and seek to understand deeply." } },
  { name: { th: "จันทร์เพ็ญ", en: "Full Moon" }, meaning: { th: "เกิดช่วงจันทร์เต็มดวง คุณมองเห็นทั้งสองด้านของเรื่อง และเติบโตผ่านความสัมพันธ์", en: "Born at the full Moon: you see both sides and grow through relationships." } },
  { name: { th: "ข้างแรมเริ่มเว้า", en: "Disseminating" }, meaning: { th: "เกิดช่วงจันทร์เริ่มแรม คุณอยากแบ่งปันสิ่งที่รู้และเป็นครูโดยธรรมชาติ", en: "Born as the Moon begins to wane: you love to share what you know and teach naturally." } },
  { name: { th: "แรมครึ่งดวง", en: "Last Quarter" }, meaning: { th: "เกิดช่วงจันทร์ครึ่งดวงขาแรม คุณกล้าทิ้งความเชื่อเก่าและเปลี่ยนแนวทางเมื่อถึงเวลา", en: "Born at the last quarter: you dare to drop old beliefs and change course when it is time." } },
  { name: { th: "แรมเสี้ยวก่อนดับ", en: "Balsamic" }, meaning: { th: "เกิดช่วงท้ายรอบ คุณมีสัญชาตญาณลึก ชอบปิดเรื่องเก่าให้จบ และมองเห็นอนาคตได้ก่อนคนอื่น", en: "Born at the end of the cycle: deeply intuitive, good at closing chapters and sensing what comes next." } },
];

export const PATTERN_TEXT: Record<PatternType, { name: T; meaning: T }> = {
  "stellium-sign": { name: { th: "ดาวรวมกลุ่มในราศีเดียว", en: "Stellium in a sign" }, meaning: { th: "ดาวตั้งแต่ 3 ดวงขึ้นไปรวมกันในราศีนี้ พลังของราศีนี้เด่นมากในชีวิตคุณ", en: "Three or more planets gather in this sign, so its energy dominates your life." } },
  "stellium-house": { name: { th: "ดาวรวมกลุ่มในเรือนเดียว", en: "Stellium in a house" }, meaning: { th: "ดาวตั้งแต่ 3 ดวงขึ้นไปอยู่เรือนนี้ ชีวิตคุณทุ่มพลังไปที่เรื่องของเรือนนี้มาก", en: "Three or more planets fall in this house, so this area of life absorbs much of your energy." } },
  "grand-trine": { name: { th: "สามเหลี่ยมใหญ่ (Grand Trine)", en: "Grand Trine" }, meaning: { th: "ดาวสามดวงทำมุม 120 องศากันครบ เป็นพรสวรรค์ที่ไหลลื่นในธาตุนี้ ระวังสบายจนไม่ฝึกต่อ", en: "Three planets in mutual trine: a flowing gift in this element. Do not let ease stop you from developing it." } },
  "t-square": { name: { th: "รูปตัว T (T-square)", en: "T-square" }, meaning: { th: "ดาวสองดวงเล็งกัน และทั้งคู่ทำมุมฉากกับดาวดวงที่สาม แรงกดดันไหลมารวมที่ดาวยอด เป็นเครื่องยนต์ของความพยายามในชีวิต", en: "Two planets in opposition both square a third. Pressure converges on the apex planet and becomes the engine of your ambition." } },
  "grand-cross": { name: { th: "กากบาทใหญ่ (Grand Cross)", en: "Grand Cross" }, meaning: { th: "ดาวสี่ดวงทำมุมฉากและเล็งกันครบสี่ทิศ แรงกดดันมาจากหลายเรื่องพร้อมกัน คุณรับมือได้ด้วยการจัดลำดับให้ชัด", en: "Four planets locked in squares and oppositions: pressure comes from several sides at once. You cope by setting clear priorities." } },
  yod: { name: { th: "นิ้วพระเจ้า (Yod)", en: "Yod (Finger of God)" }, meaning: { th: "ดาวสองดวงทำมุม 60 องศากัน และทั้งคู่ทำมุม 150 องศากับดาวยอด เป็นภารกิจเฉพาะตัวที่ต้องปรับจูนไปตลอดชีวิต", en: "Two planets in sextile both quincunx an apex planet: a personal mission you keep fine-tuning throughout life." } },
  kite: { name: { th: "ว่าว (Kite)", en: "Kite" }, meaning: { th: "สามเหลี่ยมใหญ่ที่มีดาวดวงที่สี่เป็นหาง ช่วยเปลี่ยนพรสวรรค์ให้กลายเป็นผลงานจริง", en: "A Grand Trine with a fourth planet as its tail, turning natural talent into real achievement." } },
};

export const HOUSE_SYSTEM_TEXT: Record<HouseSystem, { name: T; note: T }> = {
  placidus: { name: { th: "Placidus (นิยมที่สุด)", en: "Placidus (most popular)" }, note: { th: "แบ่งตามเวลาที่จุดบนท้องฟ้าใช้ขึ้นถึงจุดสูงสุด เป็นค่าเริ่มต้นของเว็บโหราสากลส่วนใหญ่", en: "Divides by the time each point takes to rise to the meridian; the default on most astrology sites." } },
  koch: { name: { th: "Koch", en: "Koch" }, note: { th: "คล้าย Placidus แต่แบ่งตามเวลาขึ้นของจุดกลางฟ้า นิยมในยุโรป", en: "Similar to Placidus but based on the rising time of the Midheaven degree; popular in Europe." } },
  regiomontanus: { name: { th: "Regiomontanus", en: "Regiomontanus" }, note: { th: "แบ่งเส้นศูนย์สูตรฟ้าเท่า ๆ กัน นิยมในโหราศาสตร์ตอบคำถาม (Horary)", en: "Divides the celestial equator evenly; favored in horary astrology." } },
  campanus: { name: { th: "Campanus", en: "Campanus" }, note: { th: "แบ่งวงกลมแนวดิ่งตะวันออก-ตะวันตก (Prime Vertical) เท่า ๆ กัน", en: "Divides the prime vertical into equal parts." } },
  porphyry: { name: { th: "Porphyry", en: "Porphyry" }, note: { th: "แบ่งช่วงระหว่างลัคนากับกลางฟ้าออกเป็นสามส่วนเท่ากัน ระบบเก่าแก่ ใช้ได้ทุกละติจูด", en: "Trisects each quadrant between the angles; ancient and works at every latitude." } },
  equal: { name: { th: "Equal (เรือนละ 30 องศาจากลัคนา)", en: "Equal (30 degrees from the Ascendant)" }, note: { th: "ทุกเรือนกว้าง 30 องศาพอดี เริ่มนับจากลัคนา", en: "Every house is exactly 30 degrees, counted from the Ascendant." } },
  whole: { name: { th: "Whole Sign (หนึ่งราศีหนึ่งเรือน)", en: "Whole Sign" }, note: { th: "ราศีที่ลัคนาอยู่ทั้งราศีคือเรือน 1 ราศีถัดไปคือเรือน 2 ใกล้เคียงวิธีนับภพแบบโหราไทย", en: "The whole sign of the Ascendant is house 1, the next sign house 2, and so on; the oldest system." } },
};

export const WARNING_TEXT: Record<ChartWarning["code"], T> = {
  "polar-house-fallback": {
    th: "สถานที่เกิดอยู่ใกล้ขั้วโลกเกินกว่าที่ระบบเรือนนี้คำนวณได้ จึงใช้ระบบ Porphyry แทน",
    en: "The birthplace is too close to the pole for this house system, so Porphyry houses are used instead.",
  },
  "moon-sign-uncertain": {
    th: "ดวงจันทร์ย้ายราศีในวันที่คุณเกิด ถ้าไม่รู้เวลาเกิด ผังนี้แสดงราศีตอนเที่ยงวัน ถ้าคุณเกิดอีกฝั่งของเวลาที่ดวงจันทร์ย้าย ราศีจันทร์ของคุณคือราศีข้างเคียง ใส่เวลาเกิดเพื่อยืนยัน",
    en: "The Moon changed sign on your birthday. Without a birth time this shows the noon sign; if you were born on the other side of the change, yours is the neighboring sign. Add your birth time to confirm.",
  },
  "sign-change-on-day": {
    th: "มีดาวย้ายราศีในวันที่คุณเกิด ราศีของดาวเหล่านี้ขึ้นกับเวลาเกิด ใส่เวลาเกิดเพื่อยืนยัน",
    en: "Some planets changed sign on your birthday, so their sign depends on your birth time. Add it to confirm.",
  },
  "chiron-out-of-range": {
    th: "ไครอนคำนวณได้เฉพาะ ค.ศ. 1900–2100 จึงไม่แสดงในผังนี้",
    en: "Chiron is only available for 1900–2100, so it is not shown in this chart.",
  },
  "cusp-near": {
    th: "มีจุดสำคัญอยู่ใกล้รอยต่อราศีมาก ถ้าเวลาเกิดคลาดไปไม่กี่นาที ราศีของจุดเหล่านี้จะเปลี่ยน ตรวจเวลาเกิดกับสูติบัตรให้แน่",
    en: "Some key points sit right on a sign boundary. A few minutes' difference in birth time changes their sign, so check your time against your birth certificate.",
  },
};

export const POLARITY_TEXT: Record<"yang" | "yin", { name: T; meaning: T }> = {
  yang: { name: { th: "หยาง (ไฟ ลม)", en: "Yang (fire, air)" }, meaning: { th: "เน้นการแสดงออก ลงมือ และหันออกสู่ภายนอก", en: "Leans toward expression, action and the outer world." } },
  yin: { name: { th: "หยิน (ดิน น้ำ)", en: "Yin (earth, water)" }, meaning: { th: "เน้นการรับรู้ ไตร่ตรอง และหันเข้าหาภายใน", en: "Leans toward receptivity, reflection and the inner world." } },
};

export const DOMINANT_REASON_TEXT: Record<string, T> = {
  "chart-ruler": { th: "เจ้าเรือนลัคนา", en: "chart ruler" },
  luminary: { th: "ดวงสว่างหลัก", en: "luminary" },
  angular: { th: "อยู่เรือนมุม", en: "angular house" },
  "on-angle": { th: "ใกล้ลัคนา/กลางฟ้า", en: "close to an angle" },
  domicile: { th: "เกษตร", en: "domicile" },
  exaltation: { th: "อุจจ์", en: "exaltation" },
  debilitated: { th: "ประ/นิจ", en: "detriment/fall" },
  aspects: { th: "มุมสัมพันธ์หลัก", en: "major aspects" },
};

// ─────────────────────────── ตามเวลา: ดาวจร · ดาวก้าวหน้า · รีเทิร์น ───────────────────────────

/**
 * ดาวจรทำอะไรกับจุดที่ไปกระทบ — ต่อท้ายด้วย "เรื่อง…" / "your …" (`describeTimedAspect` · `describeTransitHouse`)
 * เป็นกริยาเดียวที่จริงทั้งมุมดีและมุมตึง (เจ้าของ 2026-11-02 "ไม่กำกวม") — ทางดี/ทางร้ายให้ `TRANSIT_TONE` บอก
 * ห้ามลงท้ายด้วย "เรื่อง" (ตัวประกอบเติมให้แล้ว) · ห้ามมีคำว่า "ช่วงนี้" (ด่านทดสอบดาวเดินเร็ว)
 */
export const TRANSIT_TEXT: Record<"sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "chiron" | "node", { effect: T; span: T }> = {
  sun: { effect: { th: "ส่องไฟให้", en: "spotlights" }, span: { th: "ราว 2 ถึง 3 วัน", en: "about 2 to 3 days" } },
  moon: { effect: { th: "ทำให้อารมณ์วันนี้วนอยู่กับ", en: "centers today's mood on" }, span: { th: "ไม่กี่ชั่วโมง", en: "a few hours" } },
  mercury: { effect: { th: "ดึงความคิดและบทสนทนาไปที่", en: "focuses your thoughts and talks on" }, span: { th: "ราว 1 ถึง 3 วัน (นานขึ้นช่วงถอยหลัง)", en: "about 1 to 3 days (longer when retrograde)" } },
  venus: { effect: { th: "ดึงความรักและความสุขมาที่", en: "draws love and pleasure into" }, span: { th: "ราว 2 ถึง 4 วัน", en: "about 2 to 4 days" } },
  mars: { effect: { th: "เร่งแรงลงมือใน", en: "fires up action in" }, span: { th: "ราว 3 ถึง 7 วัน", en: "about 3 to 7 days" } },
  jupiter: { effect: { th: "ขยายและเปิดโอกาสให้", en: "expands and opens opportunities for" }, span: { th: "หลายสัปดาห์", en: "several weeks" } },
  saturn: { effect: { th: "นำความรับผิดชอบและบททดสอบมาให้", en: "brings duty and tests to" }, span: { th: "หลายสัปดาห์ถึงหลายเดือน", en: "weeks to months" } },
  uranus: { effect: { th: "นำการเปลี่ยนแปลงฉับพลันมาสู่", en: "brings sudden change to" }, span: { th: "หลายเดือน", en: "several months" } },
  neptune: { effect: { th: "พาจินตนาการและอุดมคติเข้ามาใน", en: "brings imagination and ideals into" }, span: { th: "หลายเดือน", en: "several months" } },
  pluto: { effect: { th: "รื้อและเปลี่ยนแปลงถึงรากใน", en: "deeply overhauls" }, span: { th: "หลายเดือนถึงเป็นปี", en: "months to a year or more" } },
  chiron: { effect: { th: "นำแผลใจเก่าขึ้นมาให้เยียวยาใน", en: "brings old wounds up for healing in" }, span: { th: "หลายเดือน", en: "several months" } },
  node: { effect: { th: "ชี้ทิศทางชีวิตใหม่ผ่าน", en: "points a new life direction through" }, span: { th: "หลายเดือน", en: "several months" } },
};

/**
 * น้ำเสียงของมุมเมื่อเป็นดาวจร — ต่อหลัง "…ของคุณ " / "your … " · บอกทางเดียวให้ชัด แล้วตามด้วยสิ่งที่ต้องทำ
 * กลมกลืน = อะไรไปได้ดี ทำอะไร · ตึง = อะไรสะดุดจริง ทำอะไร (ไม่ปลอบว่า "ผลักให้เติบโต") · กุม = เรื่องนี้เด่นที่สุด ใช้อย่างไร
 */
export const TRANSIT_TONE: Record<"harmonious" | "tense" | "neutral", T> = {
  harmonious: { th: "มุมนี้หนุน เรื่องนี้ราบรื่นและได้ผลจริง ลงมือทำตอนนี้เลย", en: "with support; things go smoothly and pay off, so act on it now" },
  tense: { th: "มุมนี้ตึง สิ่งที่หวังกับสิ่งที่เกิดขึ้นจริงจะไม่ตรงกัน ปรับแผนให้ตรงกับความจริง", en: "under strain; hopes and reality will not match, so fit your plan to the facts" },
  neutral: { th: "มุมนี้ทับจุดพอดี เรื่องนี้จะเด่นชัดเป็นพิเศษ ทุ่มแรงไปที่เป้าหมายเดียว", en: "head-on; it takes center stage, so aim it at one goal" },
};

/**
 * น้ำเสียงเฉพาะดาว (แทน `TRANSIT_TONE` กลาง) — ดาวเดินเร็ว ดวงจันทร์ และไครอน ไม่มี `TRANSIT_KEY` ต่อท้าย
 * ประโยคกลาง "ปรับแผนให้ตรงกับความจริง" จึงไม่ตรงเรื่อง (อังคารจรตึง = ใจร้อน/ปะทะ · ไครอน = แผลเก่าถูกสะกิด) เจ้าของ 2026-11-02 "ตรงแม่นยำ"
 * ⚠️ ห้ามใช้คำว่า "ช่วงนี้" (ด่าน test-natal-chart ตรวจประโยคดาวจรของวันนี้) · ห้ามทำนายอุบัติเหตุ/โรค
 */
export const TRANSIT_TONE_BODY: Partial<Record<"sun" | "moon" | "mercury" | "venus" | "mars" | "chiron", { harmonious: T; tense: T }>> = {
  sun: {
    harmonious: { th: "มุมนี้หนุน คนเห็นผลงานของคุณง่าย เสนอตัวหรือขอสิ่งที่อยากได้ตอนนี้เลย", en: "with support; people notice your work easily, so put yourself forward now" },
    tense: { th: "มุมนี้ตึง อีโก้ของคุณชนกับคนอื่นง่าย ทำงานให้เสร็จก่อนแล้วค่อยขอเครดิต", en: "under strain; your ego clashes with others easily, so finish the work before you ask for credit" },
  },
  moon: {
    harmonious: { th: "มุมนี้หนุน ใจนิ่งและคุยเรื่องความรู้สึกได้ง่าย เปิดเรื่องที่ค้างในใจกับคนใกล้ตัวได้", en: "with support; you feel steady and can talk about feelings, so raise what has been on your mind" },
    tense: { th: "มุมนี้ตึง อารมณ์ขึ้นลงเร็ว อย่าตัดสินใจเรื่องใหญ่จนกว่าใจจะนิ่ง", en: "under strain; your mood swings fast, so hold big decisions until you feel calm" },
  },
  mercury: {
    harmonious: { th: "มุมนี้หนุน คุยรู้เรื่อง เจรจา เขียนงาน และเซ็นเอกสารได้ผลดี", en: "with support; talks, negotiation, writing and paperwork go well" },
    tense: { th: "มุมนี้ตึง สื่อสารคลาดกันง่าย ทวนข้อตกลงเป็นข้อความทุกครั้งก่อนเดินต่อ", en: "under strain; messages get crossed easily, so confirm every agreement in writing" },
  },
  venus: {
    harmonious: { th: "มุมนี้หนุน คนรอบตัวใจดีกับคุณ นัดเจอคนที่อยากใกล้ชิดได้เลย", en: "with support; people are warm to you, so meet the person you want to be close to" },
    tense: { th: "มุมนี้ตึง ใจอยากได้มากกว่าที่ควร ระวังใช้เงินตามอารมณ์และตามใจคนอื่นจนเสียเอง", en: "under strain; you want more than is wise, so watch impulse spending and pleasing others at your own cost" },
  },
  mars: {
    harmonious: { th: "มุมนี้หนุน แรงมาเต็ม ลงมือเรื่องที่ต้องใช้ความกล้าได้เลย", en: "with support; your energy is high, so tackle what takes courage now" },
    tense: { th: "มุมนี้ตึง ใจร้อนและปะทะคนง่าย นับถึงสิบก่อนตอบโต้ และอย่ารีบจนพลาด", en: "under strain; you are short-tempered and clash easily, so count to ten before you react and do not rush" },
  },
  chiron: {
    harmonious: { th: "มุมนี้หนุน แผลเก่าพร้อมให้เยียวยา คุยเรื่องที่เคยเจ็บกับคนที่ไว้ใจ", en: "with support; an old hurt is ready to heal, so talk it through with someone you trust" },
    tense: { th: "มุมนี้ตึง เรื่องเก่าที่เคยเจ็บถูกสะกิด อ่อนโยนกับตัวเอง และอย่าตอบโต้ด้วยความเจ็บ", en: "under strain; an old hurt gets touched, so be gentle with yourself and do not strike back from pain" },
  },
};

/** ข้างขึ้นข้างแรมก้าวหน้า: วงจรชีวิตราว 30 ปี แบ่งเป็น 8 ช่วง ช่วงละราว 3.5 ปี */
export const PROG_PHASE_TEXT: readonly T[] = [
  { th: "ช่วงเริ่มรอบใหม่ของชีวิต เมล็ดพันธุ์ของเรื่องใหม่ถูกปลูก ยังไม่ต้องเห็นภาพชัด ทำตามใจก่อน", en: "A new cycle begins. Seeds are planted; follow your instincts before the picture is clear." },
  { th: "ช่วงตั้งตัว เรื่องที่เริ่มไว้ต้องสู้กับแรงต้านจากของเก่า ยืนหยัดไว้ อย่าถอยกลับไปทางเดิม", en: "Establishing yourself: what you began meets resistance from the past. Hold your ground; do not slip back." },
  { th: "ช่วงลงมือและตัดสินใจ อุปสรรคบังคับให้เลือกทาง เลือกให้ชัดแล้วเดินต่อ", en: "Action and decisions: obstacles force a choice. Choose clearly and keep going." },
  { th: "ช่วงขัดเกลา ปรับปรุงสิ่งที่ทำให้ดีขึ้นก่อนถึงจุดสุกงอม", en: "Refining and improving before things reach full bloom." },
  { th: "ช่วงเห็นผล ทั้งสิ่งที่สำเร็จและสิ่งที่ยังขาดปรากฏชัด และคนใกล้ตัวสะท้อนให้เห็นว่าคุณเป็นคนแบบไหน", en: "Culmination: successes and gaps both show, and close people mirror who you are." },
  { th: "ช่วงแบ่งปัน ถ่ายทอดสิ่งที่เรียนรู้ให้คนอื่น", en: "Sharing what you have learned with others." },
  { th: "ช่วงปรับทิศ ทิ้งความเชื่อและบทบาทที่ไม่ใช่แล้ว", en: "Reorienting: drop the beliefs and roles that no longer fit." },
  { th: "ช่วงปิดรอบ พักใจ ปล่อยวาง และฟังเสียงข้างใน ก่อนรอบใหม่จะเริ่ม", en: "Closing the cycle: rest, release and listen inward before the next one begins." },
];

// ─────────────────────────── ดวงวันนี้ ───────────────────────────

/** ภาพรวมของวันจากมุมดาวจรเดินเร็ว (บอกวันนี้เป็นแบบไหนให้ชัด แล้วบอกว่าต้องทำอะไร · ไม่ทำนายเหตุร้าย) */
export const DAY_TONE_TEXT: Record<"flow" | "friction" | "mixed" | "intense" | "quiet", { title: T; text: T }> = {
  flow: {
    title: { th: "วันที่ลื่นไหล", en: "A flowing day" },
    text: { th: "ดาวเดินเร็ววันนี้ทำมุมเกื้อกูลกับผังของคุณ วันนี้ขอความช่วยเหลือ เปิดเรื่องที่ค้างคุยไว้ และดันงานที่ติดอยู่ให้เดินหน้า", en: "Today's fast planets support your chart. Ask for help, raise the talk you have put off and push stalled work forward." },
  },
  friction: {
    title: { th: "วันที่มีแรงเสียดทาน", en: "A day with friction" },
    text: { th: "ดาวเดินเร็วทำมุมตึงกับผังของคุณ วันนี้คุณจะรู้สึกถูกเร่งและขัดใจง่าย ใช้แรงนี้ปิดงานยากให้เสร็จ และเว้นจังหวะก่อนตอบโต้ทุกครั้ง", en: "Fast planets are pressing on your chart. You will feel rushed and easily irritated. Use the energy to finish hard tasks and pause before every reply." },
  },
  mixed: {
    title: { th: "วันที่มีทั้งแรงส่งและแรงต้าน", en: "A day of push and pull" },
    text: { th: "มีทั้งมุมเกื้อกูลและมุมตึงในวันเดียว ทำเรื่องที่ลื่นไหลก่อนเพื่อสร้างแรงส่ง แล้วจัดการเรื่องที่ติดขัดทีละเรื่อง", en: "Supportive and tense aspects arrive together. Do what flows first to build momentum, then fix sticking points one by one." },
  },
  intense: {
    title: { th: "วันที่เข้มข้น", en: "An intense day" },
    text: { th: "ดาวเดินเร็วมาทับจุดสำคัญในผังของคุณพอดี เรื่องที่ดาวดวงนั้นดูแลจะเด่นที่สุดของวัน ทุ่มแรงวันนี้ไปที่เรื่องนั้นเรื่องเดียว", en: "A fast planet sits right on a key point in your chart, making its themes today's main story. Put today's energy into that one area." },
  },
  quiet: {
    title: { th: "วันที่ฟ้าเงียบ", en: "A quiet sky" },
    text: { th: "ดาวเดินเร็ววันนี้ไม่ได้ทำมุมแน่นกับผังของคุณ ไม่มีแรงเร่งจากฟ้า ใช้วันนี้เคลียร์งานประจำและพักให้พอ", en: "No fast planet is tightly linked to your chart today, so nothing is pushing you. Clear routine work and rest well." },
  },
};

/** ข้างขึ้นข้างแรมของวันนี้ (ไม่ใช่ของวันเกิด) — วิธีใช้พลังของวัน · ต่อหลังชื่อข้างขึ้นข้างแรม (อังกฤษขึ้นต้นตัวเล็ก) */
export const MOON_PHASE_DAY_TEXT: readonly T[] = [
  { th: "ตั้งเป้าเรื่องใหม่เงียบ ๆ ยังไม่ต้องบอกใคร", en: "set a quiet intention and keep it to yourself for now." },
  { th: "เริ่มก้าวแรกเล็ก ๆ ของเรื่องที่ตั้งใจไว้", en: "take a small first step on what you intended." },
  { th: "อุปสรรคจะโผล่ขึ้นมา ตัดสินใจและลงมือแก้ทันที", en: "obstacles show up; decide and deal with them right away." },
  { th: "ขัดเกลาและปรับแผนให้ดีขึ้นก่อนเรื่องต่าง ๆ จะสุกงอม", en: "refine and adjust your plans before things peak." },
  { th: "อารมณ์ขึ้นสูง เรื่องต่าง ๆ ปรากฏชัด ถอยออกมามองภาพรวมก่อนตัดสินใจ", en: "feelings run high and things come to light; step back and see the whole picture before deciding." },
  { th: "แบ่งปันสิ่งที่ได้เรียนรู้และขอบคุณคนรอบตัว", en: "share what you learned and thank the people around you." },
  { th: "เลิกทำสิ่งที่ไม่ได้ผล และเคลียร์เรื่องค้าง", en: "drop what is not working and clear the backlog." },
  { th: "พัก ปล่อยวาง และฟังใจตัวเอง", en: "rest, let go and listen inward." },
];

// ─────────────────────────── ผังคู่ ───────────────────────────

export const SYN_CATEGORY_TEXT: Record<"bond" | "attraction" | "talk" | "stability" | "growth", { name: T; about: T }> = {
  bond: { name: { th: "ความผูกพันทางใจ", en: "Emotional bond" }, about: { th: "อาทิตย์ จันทร์ ศุกร์ ลัคนา ของสองคนต่อกัน: รู้สึกปลอดภัยและเป็นตัวเองได้แค่ไหน", en: "Sun, Moon, Venus and Ascendant links: how safe and at home you feel together" } },
  attraction: { name: { th: "แรงดึงดูด", en: "Attraction" }, about: { th: "ศุกร์ อังคาร พลูโต: ความหลงใหลและเคมี มุมตึงก็ดึงดูดแรงเหมือนกัน แต่ทะเลาะง่ายกว่า", en: "Venus, Mars and Pluto links: chemistry and desire. Tense aspects attract too, but spark more fights" } },
  talk: { name: { th: "การสื่อสาร", en: "Communication" }, about: { th: "ดาวพุธกับดาวสำคัญของอีกคน: คุยกันรู้เรื่องแค่ไหน", en: "Mercury links: how easily you understand each other" } },
  stability: { name: { th: "ความมั่นคงระยะยาว", en: "Long-term stability" }, about: { th: "เสาร์และพฤหัสกับดวงสว่าง: ความรับผิดชอบ ความเชื่อใจ และการพากันโต", en: "Saturn and Jupiter links: commitment, trust and growing together" } },
  growth: { name: { th: "การเติบโตร่วมกัน", en: "Growing together" }, about: { th: "โหนด พฤหัส ไครอน: ช่วยกันโตและช่วยกันหายจากแผลเก่าได้แค่ไหน", en: "Node, Jupiter and Chiron links: how much you help each other grow and heal" } },
};

/**
 * คู่ดาวสำคัญในผังคู่ (เรียงชื่อตามตัวอักษร คั่นด้วย "-") — ประโยคเฉพาะเมื่อกลมกลืน/ตึง (มุมกุมใช้ฝั่งกลมกลืน)
 * แต่ละข้อ: เกิดอะไรขึ้นระหว่างสองคน + สิ่งเดียวที่ต้องทำ · ไม่ตัดสินว่า "ไปรอด/ไม่รอด" · ไม่โทษฝ่ายใด (กติกา `src/lib/astro/synastry.ts`)
 */
export const SYN_PAIR_TEXT: Record<string, { harmonious: T; tense: T }> = {
  "moon-sun": {
    harmonious: { th: "คนหนึ่งให้ทิศทาง อีกคนให้ความอบอุ่น คุณสองคนเติมกันพอดีและอยู่ด้วยกันแล้วสบายใจ บอกกันบ่อย ๆ ว่าอีกฝ่ายช่วยคุณตรงไหน", en: "One gives direction, the other gives warmth; you complete each other and feel at ease. Tell each other often how the other helps you." },
    tense: { th: "ดึงดูดกันแรง แต่สิ่งที่คนหนึ่งต้องการขัดกับวิถีของอีกคน เรื่องเล็ก ๆ จึงกระทบกันบ่อย บอกกันให้ชัดว่าแต่ละคนต้องการอะไร", en: "A strong pull, but one's needs clash with the other's ways, so small things grate. Spell out what each of you needs." },
  },
  "moon-moon": {
    harmonious: { th: "ใจตรงกัน ต้องการการปลอบแบบเดียวกันและอยู่ด้วยกันแล้วสบายใจ เวลาแย่พร้อมกัน ให้ผลัดกันเป็นคนตั้งหลัก", en: "In tune: you need the same comfort and relax together. When both are down, take turns being the steady one." },
    tense: { th: "วิธีดูแลใจไม่เหมือนกัน สิ่งที่ปลอบคนหนึ่งได้ใช้กับอีกคนไม่ได้ ถามกันตรง ๆ ว่าเวลาแย่อยากให้ทำอะไร", en: "You soothe yourselves differently; what comforts one does nothing for the other. Ask directly what helps on bad days." },
  },
  "sun-sun": {
    harmonious: { th: "เป้าหมายชีวิตไปทางเดียวกัน เชียร์กันได้โดยไม่ต้องพยายาม เลือกเป้าหมายร่วมกันหนึ่งเรื่องแล้วลุยด้วยกัน", en: "Your goals align, so backing each other is easy. Pick one shared goal and chase it together." },
    tense: { th: "อัตตาสองคนชนกัน ต่างคนต่างอยากเป็นคนตัดสินใจ ตกลงกันให้ชัดว่าใครนำเรื่องไหน", en: "Your egos clash and both want the final say. Agree clearly who leads on what." },
  },
  "mars-venus": {
    harmonious: { th: "เคมีลงตัว คนหนึ่งกล้าเข้าหา อีกคนพร้อมตอบรับ แรงดึงดูดทางกายชัดเจน จีบกันต่อไปแม้คบกันนานแล้ว", en: "Natural chemistry: one pursues, the other welcomes it, and the physical pull is clear. Keep flirting even years in." },
    tense: { th: "แรงดึงดูดแรงมาก แต่หวานกับทะเลาะสลับกันเร็ว พูดความต้องการของตัวเองให้ชัดก่อนอารมณ์จะขึ้น", en: "Very strong attraction that flips fast between sweet and fighting. Say what you want clearly before tempers rise." },
  },
  "mars-mars": {
    harmonious: { th: "ลุยด้วยกันได้ดี จังหวะการลงมือตรงกัน หาโปรเจกต์ที่ต้องลงแรงทำด้วยกัน", en: "You act well as a team and move at the same pace. Take on a hands-on project together." },
    tense: { th: "พลังแรงทั้งคู่และไม่มีใครยอมใคร จึงเถียงกันเร็ว ออกกำลังกายด้วยกันเพื่อระบายแรงก่อนคุยเรื่องยาก", en: "Two strong drives and neither backs down, so fights flare fast. Work out together before hard talks." },
  },
  "venus-venus": {
    harmonious: { th: "รสนิยมและวิธีแสดงความรักคล้ายกัน มีความสุขกับสิ่งเดียวกัน วางแผนเดตจากสิ่งที่ชอบร่วมกัน", en: "Similar taste and love language; you enjoy the same things. Plan dates around what you both love." },
    tense: { th: "ให้คุณค่ากับคนละเรื่อง สิ่งที่คนหนึ่งให้เป็นความรัก อีกคนไม่รู้สึกถึงมัน ถามกันตรง ๆ ว่าแบบไหนที่ทำให้รู้สึกเป็นที่รัก", en: "You value different things: what one gives as love, the other does not feel. Ask directly what makes each of you feel loved." },
  },
  "moon-venus": {
    harmonious: { th: "อ่อนโยนต่อกันโดยธรรมชาติ ทั้งคู่รู้สึกเป็นที่รักและได้รับการดูแล ขอบคุณกันในเรื่องเล็ก ๆ ทุกวัน", en: "Naturally tender; you both feel loved and cared for. Thank each other for small things every day." },
    tense: { th: "ความรักมีจริง แต่วิธีแสดงออกไม่ตรงกับที่อีกคนต้องการ บอกกันตรง ๆ ว่าแบบไหนที่ใช่", en: "The love is real, but it is shown in ways the other does not need. Tell each other plainly what works." },
  },
  "mercury-mercury": {
    harmonious: { th: "คุยกันรู้เรื่อง ความคิดต่อกันติด ใช้จุดนี้คุยเรื่องยากให้จบ", en: "Easy conversation; your minds connect. Use it to settle hard topics." },
    tense: { th: "คิดและพูดคนละสไตล์ จึงเข้าใจผิดกันบ่อย ฟังให้จบแล้วทวนสิ่งที่ได้ยินก่อนตอบ", en: "Different styles cause frequent misunderstandings. Listen fully, then repeat back what you heard." },
  },
  "sun-venus": {
    harmonious: { th: "ชื่นชมกันและกัน คนหนึ่งทำให้อีกคนรู้สึกมีเสน่ห์ ชมกันออกมาเป็นคำพูด อย่าเก็บไว้ในใจ", en: "Mutual admiration; one makes the other feel attractive. Say the compliments out loud." },
    tense: { th: "ชอบกันแต่คาดหวังต่างกัน คนหนึ่งเอาใจจนลืมตัวเอง บอกความต้องการของตัวเองด้วย ไม่ใช่แค่ตามใจอีกฝ่าย", en: "Fondness with different expectations; one keeps pleasing and loses themselves. State your own needs too." },
  },
  "moon-saturn": {
    harmonious: { th: "ให้ความรู้สึกมั่นคง พึ่งพากันได้ในระยะยาว สร้างกิจวัตรร่วมกันที่ทำได้ทุกสัปดาห์", en: "A sense of security; you can rely on each other long-term. Build a weekly routine together." },
    tense: { th: "คนหนึ่งรู้สึกว่าอีกคนเย็นชาและเข้มงวด ความอบอุ่นไม่มาเอง แสดงความห่วงใยให้เห็นทุกวัน", en: "One feels the other is cold and strict. Warmth will not come by itself; show care openly every day." },
  },
  "saturn-sun": {
    harmonious: { th: "รับผิดชอบต่อกันและสร้างสิ่งที่ยั่งยืนด้วยกันได้ วางแผนระยะยาวร่วมกันให้ชัด", en: "Responsible toward each other and able to build something lasting. Make a clear long-term plan together." },
    tense: { th: "คนหนึ่งรู้สึกถูกอีกคนตัดสินและกดดัน ชมกันให้บ่อยขึ้น และติเฉพาะเรื่องที่สำคัญจริง", en: "One feels judged and pressured by the other. Praise more often and criticize only what truly matters." },
  },
  "saturn-venus": {
    harmonious: { th: "ความรักแบบจริงจังและซื่อสัตย์ ยิ่งคบนานยิ่งมั่นคง เติมความสนุกลงไปด้วย อย่าให้มีแต่หน้าที่", en: "Serious, loyal love that grows steadier with time. Add fun so it is not all duty." },
    tense: { th: "ความรักมาพร้อมความกังวลและระยะห่าง คนหนึ่งแสดงความรักน้อยกว่าที่อีกคนต้องการ นัดเวลาคุยเรื่องความรู้สึกกันเป็นประจำ", en: "Love comes with worry and distance; one shows less affection than the other needs. Set regular time to talk about feelings." },
  },
  "jupiter-sun": {
    harmonious: { th: "ทำให้กันและกันมองโลกในแง่ดีและกล้าฝันใหญ่ เปลี่ยนความฝันที่คุยกันไว้หนึ่งเรื่องให้เป็นแผนจริง", en: "You make each other optimistic and brave enough to dream big. Turn one shared dream into a real plan." },
    tense: { th: "เชียร์กันจนเกินตัว ทั้งเรื่องเงินและคำสัญญา ตรวจตัวเลขก่อนตัดสินใจเรื่องใหญ่ร่วมกันทุกครั้ง", en: "You push each other past your limits, with money and promises. Check the numbers before every big joint decision." },
  },
  "jupiter-venus": {
    harmonious: { th: "ใจกว้างต่อกันและอยู่ด้วยกันแล้วสนุก ชวนกันทำสิ่งที่ชอบเป็นประจำ", en: "Generous with each other and fun together. Make a habit of doing what you both enjoy." },
    tense: { th: "สนุกด้วยกันแต่ตามใจกันเกินพอดี ทั้งการกินและการใช้เงิน ตั้งงบใช้จ่ายร่วมกันให้ชัด", en: "Fun together, but you indulge each other too much, in food and spending. Set a clear shared budget." },
  },
  "node-sun": {
    harmonious: { th: "คนหนึ่งช่วยผลักอีกคนไปทางที่ชีวิตควรไป ความสัมพันธ์นี้ทำให้ทั้งคู่โตเร็ว คุยเป้าหมายชีวิตกันให้ชัด", en: "One pushes the other toward where life is heading, and you both grow fast. Talk openly about life goals." },
    tense: { th: "ความสัมพันธ์นี้บังคับให้ออกจากนิสัยเดิม จึงอึดอัดในช่วงแรก บอกกันตรง ๆ เมื่อเรื่องไหนฝืนเกินไป", en: "This bond forces you out of old habits, which feels uncomfortable at first. Say plainly when something feels forced." },
  },
  "moon-node": {
    harmonious: { th: "ผูกพันทางใจลึก เหมือนรู้จักกันมาก่อน ใช้ความคุ้นเคยนี้เป็นฐาน แล้วตั้งเป้าใหม่ร่วมกัน", en: "A deep emotional familiarity, as if you met before. Use it as a base and set new goals together." },
    tense: { th: "ผูกพันกันแน่น แต่ความคุ้นเคยดึงทั้งคู่ให้วนอยู่ที่เดิม เลือกการเติบโตก่อนความสบายใจ", en: "A tight bond, but familiarity keeps you both going in circles. Choose growth over comfort." },
  },
};

/**
 * ความหมายของมุมเมื่อเป็นมุมระหว่างสองคน (ประโยคกลาง ใช้เมื่อคู่ดาวไม่มีประโยคเฉพาะ)
 * ต่อหลัง "…ของ A กับ…ของ B: " และ "…ของความสัมพันธ์นี้: " (ผังรวม) — ห้ามเอ่ยชื่อคน · อังกฤษขึ้นต้นตัวเล็ก ไม่มีจุดท้าย
 */
export const SYN_ASPECT_MEANING: Partial<Record<AspectType, T>> = {
  conjunction: { th: "สองเรื่องนี้ของสองคนหลอมเข้าหากัน รู้สึกได้ชัดตั้งแต่แรกพบ", en: "these merge strongly between you and are felt from the first meeting" },
  opposition: { th: "ดึงดูดกันเพราะต่างกัน แต่ต่างคนต่างดึงไปคนละทาง ตกลงกันให้ชัดว่าเรื่องไหนใครยอม", en: "you attract because you differ but pull opposite ways; agree clearly who gives way on what" },
  trine: { th: "ไหลเข้าหากันง่าย เข้าใจกันโดยไม่ต้องอธิบาย", en: "this flows easily; you understand each other without explaining" },
  square: { th: "ขัดกันตรงนี้ เรื่องนี้จะเป็นจุดที่ทะเลาะกันซ้ำ ตกลงกติกาเรื่องนี้ให้ชัดก่อนมีปัญหา", en: "this clashes and is where the same fights repeat; set clear ground rules here early" },
  sextile: { th: "เกื้อหนุนกันเมื่อลงมือทำอะไรด้วยกัน เริ่มโปรเจกต์ร่วมกันหนึ่งเรื่อง", en: "you support each other when you do things together; start one joint project" },
  quincunx: { th: "จังหวะไม่ตรงกัน สิ่งที่คนหนึ่งคิดว่าช่วย อีกคนรู้สึกว่าไม่ใช่ ถามก่อนทำ อย่าเดาใจ", en: "your rhythms do not match; what one thinks helps, the other does not, so ask instead of guessing" },
};
