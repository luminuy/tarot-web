/**
 * 📖 คำอธิบายผังดวงกำเนิด (ไทย + อังกฤษ) — เนื้อหาเขียนเอง ประกอบด้วยโค้ด ไม่ใช้ AI
 * ===========================================================================
 *
 * วิธีประกอบ: ดาวแต่ละดวงมี "คำกริยา" (คุณ…ยังไง) · ราศีมี "ท่าที" (…อย่างไร) + จุดแข็ง + จุดระวัง ·
 * เรือนมี "เวที" (เกิดขึ้นในเรื่องไหน) ➔ ประกอบเป็นประโยคได้ครบทุกคู่ดาว×ราศี×เรือน (13×12×12)
 * โดยไม่ต้องเขียน 1,800 ย่อหน้า · ดวงจันทร์และลัคนาเขียนแยกราศีละย่อหน้า (สองจุดที่คนอ่านมากที่สุด)
 * ดวงอาทิตย์ใช้คำอธิบายราศีเดิมจาก `src/data/zodiac.ts` (ผ่านการตรวจมาแล้วในหน้าราศี)
 *
 * ⚠️ ห้ามอิโมจิ/สัญลักษณ์ (กฎเหล็ก 2) · ภาษาคน ไม่ฟันธง (กฎเหล็ก 10) · ไพ่ใช้ระบบ Golden Dawn ชุดเดียวกับหน้าราศี
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
    verb: { th: "วางกลยุทธ์ แก้ปัญหา และมองเห็นภาพรวม", en: "strategise, solve problems and see patterns" },
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
    gift: { th: "ความช่างสังเกตและฝีมือในการช่วยเหลือ", en: "a sharp eye and skilful service" },
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
  opposition: { name: { th: "เล็ง (180 องศา)", en: "Opposition (180)" }, meaning: { th: "สองพลังนี้ดึงกันคนละทาง ต้องหาจุดสมดุล และมักเห็นผ่านคนรอบตัว", en: "these pull in opposite directions; balance comes through relationships" } },
  trine: { name: { th: "ตรีโกณ (120 องศา)", en: "Trine (120)" }, meaning: { th: "สองพลังนี้ไหลเข้าหากันง่าย เป็นพรสวรรค์ที่อาจมองข้ามเพราะมันง่ายเกินไป", en: "these flow together easily, a gift you may overlook because it comes so naturally" } },
  square: { name: { th: "จตุโกณ (90 องศา)", en: "Square (90)" }, meaning: { th: "สองพลังนี้เสียดสีกันจนเกิดแรงผลัก เป็นบทเรียนที่ทำให้คุณแกร่งขึ้น", en: "these grind against each other and create drive, a lesson that makes you stronger" } },
  sextile: { name: { th: "โยค (60 องศา)", en: "Sextile (60)" }, meaning: { th: "สองพลังนี้เกื้อหนุนกันเมื่อคุณลงมือ เป็นโอกาสที่ต้องคว้าเอง", en: "these support each other once you take action, an opportunity you have to seize" } },
  quincunx: { name: { th: "150 องศา (Quincunx)", en: "Quincunx (150)" }, meaning: { th: "สองพลังนี้ไม่เข้าขากันโดยธรรมชาติ ต้องปรับจูนกันอยู่เรื่อย ๆ", en: "these do not naturally fit, so you keep adjusting between them" } },
  semisextile: { name: { th: "30 องศา (Semi-sextile)", en: "Semi-sextile (30)" }, meaning: { th: "สองพลังนี้เกี่ยวข้องกันเบา ๆ ค่อย ๆ เรียนรู้จากกัน", en: "a subtle link where each slowly learns from the other" } },
  semisquare: { name: { th: "45 องศา (Semi-square)", en: "Semi-square (45)" }, meaning: { th: "เป็นความระคายเคืองเล็ก ๆ ที่สะสมจนต้องจัดการ", en: "small irritations that build up until you deal with them" } },
  sesquiquadrate: { name: { th: "135 องศา (Sesquiquadrate)", en: "Sesquiquadrate (135)" }, meaning: { th: "เป็นแรงตึงที่ปะทุออกมาเป็นพัก ๆ", en: "tension that flares up from time to time" } },
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
    th: "ใจคุณสงบเมื่อทุกอย่างเป็นระเบียบและได้ช่วยใครสักคน เวลากังวลมักจัดของหรือวางแผนเพื่อให้รู้สึกควบคุมได้ อย่าลืมใจดีกับตัวเองเท่ากับที่ใจดีกับคนอื่น",
    en: "You feel calm when things are in order and you can be useful. Worry often sends you tidying or planning to regain control. Remember to be as kind to yourself as you are to others.",
  },
  {
    th: "ใจคุณต้องการความสงบและความสัมพันธ์ที่ราบรื่น การทะเลาะทำให้คุณเหนื่อยใจมาก คุณมักรู้ใจคนอื่นได้ดี แต่บางครั้งก็ลืมถามใจตัวเองว่าต้องการอะไร",
    en: "You need harmony and smooth relationships, and conflict drains you. You read other people well but sometimes forget to ask what you yourself want.",
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
    th: "ใจคุณแข็งแรงและพึ่งตัวเองได้ คุณไม่ค่อยแสดงอารมณ์ให้ใครเห็น ความรู้สึกปลอดภัยมาจากการมีเป้าหมายและความสำเร็จที่จับต้องได้ อย่าลืมให้ตัวเองได้พักบ้าง",
    en: "You are emotionally self-reliant and rarely show your feelings. Security comes from goals and tangible achievement. Remember that rest is allowed too.",
  },
  {
    th: "ใจคุณต้องการพื้นที่ส่วนตัวและเพื่อนที่เข้าใจความคิดแปลก ๆ ของคุณ คุณมักมองอารมณ์ตัวเองจากระยะห่างเหมือนนักสังเกตการณ์ ซึ่งช่วยให้ใจเย็น แต่บางครั้งก็ทำให้คนใกล้ตัวรู้สึกเข้าไม่ถึง",
    en: "You need personal space and friends who get your unusual ideas. You tend to observe your feelings from a distance, which keeps you calm but can make loved ones feel shut out.",
  },
  {
    th: "ใจคุณอ่อนไหวและรับรู้ความรู้สึกคนรอบตัวได้ราวกับเป็นของตัวเอง คุณเมตตามาก แต่ต้องมีเวลาอยู่เงียบ ๆ คนเดียวเพื่อชาร์จพลัง และควรตั้งขอบเขตให้ชัด",
    en: "You are deeply sensitive and absorb other people's feelings as if they were your own. You are compassionate, but you need quiet time alone to recharge and clear boundaries to stay well.",
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
    th: "คนเห็นคุณเป็นคนอบอุ่น อ่อนโยน และน่าเข้าใกล้ คุณดูท่าทีก่อนเปิดใจ และมักดูแลคนรอบตัวโดยไม่รู้ตัว",
    en: "People see you as warm, gentle and approachable. You test the waters before opening up, and you often look after others without noticing.",
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
    th: "คนเห็นคุณเป็นคนสุภาพ มีเสน่ห์ และเข้ากับคนง่าย คุณเข้าหาชีวิตผ่านความสัมพันธ์ และมักรู้จังหวะที่เหมาะสม",
    en: "People see you as polite, charming and easy to get along with. You approach life through relationships and have a good sense of timing.",
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
    en: "People see you as serious, mature and trustworthy. You plan before you move, and you tend to relax as you get older.",
  },
  {
    th: "คนเห็นคุณเป็นคนเป็นมิตร มีเอกลักษณ์ และคิดไม่เหมือนใคร คุณเข้าหาชีวิตแบบไม่ยึดกรอบเดิม",
    en: "People see you as friendly, original and a little unconventional. You approach life without following the usual script.",
  },
  {
    th: "คนเห็นคุณเป็นคนอ่อนโยน ช่างฝัน และเข้าถึงง่าย คุณรับรู้บรรยากาศรอบตัวได้ไว และมักปรับตัวตามสถานการณ์",
    en: "People see you as gentle, dreamy and easy to open up to. You sense the mood of a room quickly and adapt to it.",
  },
];

export const DIGNITY_TEXT: Record<Dignity, { name: T; meaning: T }> = {
  domicile: { name: { th: "เกษตร", en: "Domicile" }, meaning: { th: "อยู่ราศีบ้านของตัวเอง พลังนี้ทำงานได้เต็มที่และเป็นธรรมชาติ", en: "it is at home here, so this energy works fully and naturally" } },
  exaltation: { name: { th: "อุจจ์", en: "Exaltation" }, meaning: { th: "อยู่ราศีที่ยกย่องดาวนี้ พลังนี้โดดเด่นและมักได้รับการยอมรับ", en: "it is exalted here, so this energy stands out and is admired" } },
  detriment: { name: { th: "ประ", en: "Detriment" }, meaning: { th: "อยู่ราศีตรงข้ามบ้านตัวเอง ต้องปรับวิธีใช้พลังนี้ให้เข้ากับสถานการณ์ ยากกว่าแต่สอนอะไรได้มาก", en: "it is opposite its home, so you must adapt how you use it; harder, but it teaches a lot" } },
  fall: { name: { th: "นิจ", en: "Fall" }, meaning: { th: "อยู่ราศีที่พลังนี้อ่อน อาจรู้สึกไม่มั่นใจในเรื่องนี้ และเป็นจุดที่ฝึกแล้วเติบโตมาก", en: "it is weakest here, so you may feel unsure in this area; practice brings real growth" } },
};

export const ELEMENT_TEXT: Record<Element, { name: T; strong: T; weak: T }> = {
  fire: {
    name: { th: "ไฟ", en: "Fire" },
    strong: { th: "ธาตุไฟเด่น: มีพลัง กล้าเริ่ม และกระตือรือร้น ระวังหมดไฟเพราะเร่งเกินไป", en: "Strong fire: energetic, brave and enthusiastic. Watch out for burnout from pushing too hard." },
    weak: { th: "ธาตุไฟน้อย: อาจต้องหาแรงบันดาลใจจากภายนอก การออกกำลังกายและการตั้งเป้าเล็ก ๆ ช่วยจุดไฟได้", en: "Little fire: you may need outside inspiration. Exercise and small goals help light the spark." },
  },
  earth: {
    name: { th: "ดิน", en: "Earth" },
    strong: { th: "ธาตุดินเด่น: ติดดิน ทำได้จริง และสร้างความมั่นคงเก่ง ระวังยึดติดกับสิ่งที่คุ้นเคย", en: "Strong earth: grounded, practical and good at building security. Watch out for getting stuck in the familiar." },
    weak: { th: "ธาตุดินน้อย: ความคิดดีแต่ลงมือจริงยาก ลองใช้ตารางเวลาและงบประมาณช่วยให้เรื่องต่าง ๆ เป็นรูปธรรม", en: "Little earth: great ideas but follow-through is harder. Schedules and budgets help make things real." },
  },
  air: {
    name: { th: "ลม", en: "Air" },
    strong: { th: "ธาตุลมเด่น: คิดเร็ว สื่อสารเก่ง และเข้าสังคมได้ดี ระวังคิดมากจนไม่ได้ลงมือ", en: "Strong air: quick thinking, articulate and sociable. Watch out for overthinking instead of acting." },
    weak: { th: "ธาตุลมน้อย: อาจรู้สึกก่อนแล้วค่อยหาคำอธิบาย การเขียนหรือคุยกับคนที่ไว้ใจช่วยให้มองเห็นภาพชัดขึ้น", en: "Little air: you feel first and explain later. Writing or talking things through brings clarity." },
  },
  water: {
    name: { th: "น้ำ", en: "Water" },
    strong: { th: "ธาตุน้ำเด่น: อ่อนไหว เข้าใจคน และมีสัญชาตญาณสูง ระวังรับอารมณ์คนอื่นมาเป็นของตัวเอง", en: "Strong water: sensitive, empathic and intuitive. Watch out for absorbing other people's moods." },
    weak: { th: "ธาตุน้ำน้อย: อาจไม่ถนัดพูดเรื่องความรู้สึก การเปิดใจกับคนใกล้ชิดทีละนิดช่วยให้ความสัมพันธ์ลึกขึ้น", en: "Little water: feelings may be hard to put into words. Opening up a little at a time deepens your bonds." },
  },
};

export const MODALITY_TEXT: Record<Modality, { name: T; strong: T }> = {
  cardinal: { name: { th: "จรราศี (ผู้ริเริ่ม)", en: "Cardinal" }, strong: { th: "จรราศีเด่น: ถนัดเริ่มต้นและผลักดันให้เกิดสิ่งใหม่", en: "Strong cardinal: you are a starter who gets things moving." } },
  fixed: { name: { th: "สถิรราศี (ผู้ยืนหยัด)", en: "Fixed" }, strong: { th: "สถิรราศีเด่น: หนักแน่น ทำต่อเนื่อง และไม่ยอมแพ้ง่าย", en: "Strong fixed: steady, persistent and hard to shake." } },
  mutable: { name: { th: "อุภยราศี (ผู้ปรับตัว)", en: "Mutable" }, strong: { th: "อุภยราศีเด่น: ยืดหยุ่น ปรับตัวเก่ง และเชื่อมคนหลายแบบเข้าหากัน", en: "Strong mutable: flexible, adaptable and good at bridging differences." } },
};

export const HEMISPHERE_TEXT: Record<"north" | "south" | "east" | "west", { name: T; meaning: T }> = {
  north: { name: { th: "ครึ่งล่าง (ใต้ขอบฟ้า)", en: "Below the horizon" }, meaning: { th: "ดาวส่วนใหญ่อยู่ใต้ขอบฟ้า: ชีวิตเน้นโลกภายใน ครอบครัว และการเติบโตส่วนตัวมากกว่าภาพในสังคม", en: "Most planets below the horizon: your life centres on your inner world, family and personal growth more than public image." } },
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
  "grand-cross": { name: { th: "กากบาทใหญ่ (Grand Cross)", en: "Grand Cross" }, meaning: { th: "ดาวสี่ดวงทำมุมฉากและเล็งกันครบสี่ทิศ ชีวิตท้าทายแต่ทำให้คุณแข็งแกร่งและมีสมดุลมาก", en: "Four planets locked in squares and oppositions. Life is challenging, but it makes you strong and balanced." } },
  yod: { name: { th: "นิ้วพระเจ้า (Yod)", en: "Yod (Finger of God)" }, meaning: { th: "ดาวสองดวงทำมุม 60 องศากัน และทั้งคู่ทำมุม 150 องศากับดาวยอด เป็นภารกิจเฉพาะตัวที่ต้องปรับจูนไปตลอดชีวิต", en: "Two planets in sextile both quincunx an apex planet: a personal mission you keep fine-tuning throughout life." } },
  kite: { name: { th: "ว่าว (Kite)", en: "Kite" }, meaning: { th: "สามเหลี่ยมใหญ่ที่มีดาวดวงที่สี่เป็นหาง ช่วยเปลี่ยนพรสวรรค์ให้กลายเป็นผลงานจริง", en: "A Grand Trine with a fourth planet as its tail, turning natural talent into real achievement." } },
};

export const HOUSE_SYSTEM_TEXT: Record<HouseSystem, { name: T; note: T }> = {
  placidus: { name: { th: "Placidus (นิยมที่สุด)", en: "Placidus (most popular)" }, note: { th: "แบ่งตามเวลาที่จุดบนท้องฟ้าใช้ขึ้นถึงจุดสูงสุด เป็นค่าเริ่มต้นของเว็บโหราสากลส่วนใหญ่", en: "Divides by the time each point takes to rise to the meridian; the default on most astrology sites." } },
  koch: { name: { th: "Koch", en: "Koch" }, note: { th: "คล้าย Placidus แต่แบ่งตามเวลาขึ้นของจุดกลางฟ้า นิยมในยุโรป", en: "Similar to Placidus but based on the rising time of the Midheaven degree; popular in Europe." } },
  regiomontanus: { name: { th: "Regiomontanus", en: "Regiomontanus" }, note: { th: "แบ่งเส้นศูนย์สูตรฟ้าเท่า ๆ กัน นิยมในโหราศาสตร์ตอบคำถาม (Horary)", en: "Divides the celestial equator evenly; favoured in horary astrology." } },
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
    th: "ดวงจันทร์ย้ายราศีในวันที่คุณเกิด ถ้าไม่รู้เวลาเกิด ราศีของดวงจันทร์อาจเป็นราศีถัดไปหรือราศีก่อนหน้า",
    en: "The Moon changed sign on your birthday. Without a birth time, your Moon sign could be the neighbouring sign.",
  },
  "sign-change-on-day": {
    th: "มีดาวย้ายราศีในวันที่คุณเกิด ราศีของดาวเหล่านี้ขึ้นกับเวลาเกิด",
    en: "Some planets changed sign on your birthday, so their sign depends on your birth time.",
  },
  "chiron-out-of-range": {
    th: "ไครอนคำนวณได้เฉพาะ ค.ศ. 1900–2100 จึงไม่แสดงในผังนี้",
    en: "Chiron is only available for 1900–2100, so it is not shown in this chart.",
  },
  "cusp-near": {
    th: "มีจุดสำคัญอยู่ใกล้รอยต่อราศีมาก ถ้าเวลาเกิดคลาดไปไม่กี่นาที ราศีของจุดเหล่านี้อาจเปลี่ยนได้",
    en: "Some key points sit right on a sign boundary. A few minutes' difference in birth time could change their sign.",
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

/** ดาวจรทำอะไรกับจุดที่ไปกระทบ — ต่อท้ายด้วย "เรื่อง…" / "your …" */
export const TRANSIT_TEXT: Record<"sun" | "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune" | "pluto" | "chiron" | "node", { effect: T; span: T }> = {
  sun: { effect: { th: "ส่องไฟให้", en: "spotlights" }, span: { th: "ราว 2 ถึง 3 วัน", en: "about 2 to 3 days" } },
  moon: { effect: { th: "แต่งอารมณ์ของวันนี้ให้กับ", en: "colours today's mood around" }, span: { th: "ไม่กี่ชั่วโมง", en: "a few hours" } },
  mercury: { effect: { th: "ชวนให้คิด คุย และตัดสินใจเรื่อง", en: "gets you thinking and talking about" }, span: { th: "ราว 1 ถึง 3 วัน (นานขึ้นช่วงถอยหลัง)", en: "about 1 to 3 days (longer when retrograde)" } },
  venus: { effect: { th: "นำความรัก ความสุข และความง่ายมาให้", en: "brings warmth, pleasure and ease to" }, span: { th: "ราว 2 ถึง 4 วัน", en: "about 2 to 4 days" } },
  mars: { effect: { th: "ปลุกแรงผลัก ความกล้า หรือความหงุดหงิดให้", en: "fires up drive, courage or friction in" }, span: { th: "ราว 3 ถึง 7 วัน", en: "about 3 to 7 days" } },
  jupiter: { effect: { th: "ขยาย เปิดโอกาส และเพิ่มความมั่นใจให้", en: "expands and opens opportunities for" }, span: { th: "หลายสัปดาห์", en: "several weeks" } },
  saturn: { effect: { th: "ทดสอบ วางกรอบ และให้บทเรียนจริงจังกับ", en: "tests, structures and matures" }, span: { th: "หลายสัปดาห์ถึงหลายเดือน", en: "weeks to months" } },
  uranus: { effect: { th: "เขย่าให้เปลี่ยนแปลงฉับพลันและหาอิสระใน", en: "shakes up and frees" }, span: { th: "หลายเดือน", en: "several months" } },
  neptune: { effect: { th: "ทำให้ฝัน อ่อนไหว หรือสับสน และเปิดแรงบันดาลใจให้", en: "softens, inspires or blurs" }, span: { th: "หลายเดือน", en: "several months" } },
  pluto: { effect: { th: "รื้อและเปลี่ยนแปลงถึงรากให้", en: "transforms from the roots" }, span: { th: "หลายเดือนถึงเป็นปี", en: "months to a year or more" } },
  chiron: { effect: { th: "เปิดแผลเก่าขึ้นมาเพื่อเยียวยา", en: "reopens and heals old wounds around" }, span: { th: "หลายเดือน", en: "several months" } },
  node: { effect: { th: "ชี้ทิศทางชีวิตใหม่ผ่าน", en: "points a new life direction through" }, span: { th: "หลายเดือน", en: "several months" } },
};

/** น้ำเสียงของมุมเมื่อเป็นดาวจร */
export const TRANSIT_TONE: Record<"harmonious" | "tense" | "neutral", T> = {
  harmonious: { th: "ไปทางราบรื่น ลงมือเรื่องนี้ได้ง่ายกว่าปกติ", en: "in a flowing way; this is a good time to act on it" },
  tense: { th: "ผ่านแรงกดดันหรือความท้าทาย ซึ่งผลักให้คุณปรับตัวและเติบโต", en: "through pressure or challenge that pushes you to adjust and grow" },
  neutral: { th: "แบบตรงตัวและเข้มข้น", en: "directly and intensely" },
};

/** ข้างขึ้นข้างแรมก้าวหน้า: วงจรชีวิตราว 30 ปี แบ่งเป็น 8 ช่วง ช่วงละราว 3.5 ปี */
export const PROG_PHASE_TEXT: readonly T[] = [
  { th: "ช่วงเริ่มรอบใหม่ของชีวิต เมล็ดพันธุ์ของเรื่องใหม่ถูกปลูก ยังไม่ต้องเห็นภาพชัด ทำตามใจก่อน", en: "A new cycle begins. Seeds are planted; follow your instincts before the picture is clear." },
  { th: "ช่วงตั้งตัว เรื่องที่เริ่มไว้ต้องสู้กับแรงต้านจากของเก่า ต้องยืนหยัด", en: "Establishing yourself: what you began meets resistance from the past. Hold your ground." },
  { th: "ช่วงลงมือและตัดสินใจ เจออุปสรรคที่ต้องเลือกทางให้ชัด", en: "A time of action and decisions, when obstacles force clear choices." },
  { th: "ช่วงขัดเกลา ปรับปรุงสิ่งที่ทำให้ดีขึ้นก่อนถึงจุดสุกงอม", en: "Refining and improving before things reach full bloom." },
  { th: "ช่วงเห็นผล สิ่งที่ทำมาปรากฏชัด และความสัมพันธ์สะท้อนตัวคุณ", en: "Culmination: results become visible and relationships mirror you." },
  { th: "ช่วงแบ่งปัน ถ่ายทอดสิ่งที่เรียนรู้ให้คนอื่น", en: "Sharing what you have learned with others." },
  { th: "ช่วงปรับทิศ ทิ้งความเชื่อหรือบทบาทที่ไม่ใช่แล้ว", en: "Reorienting: letting go of beliefs or roles that no longer fit." },
  { th: "ช่วงปิดรอบ พักใจ ปล่อยวาง และฟังเสียงข้างใน ก่อนรอบใหม่จะเริ่ม", en: "Closing the cycle: rest, release and listen inward before the next one begins." },
];

// ─────────────────────────── ผังคู่ ───────────────────────────

export const SYN_CATEGORY_TEXT: Record<"bond" | "attraction" | "talk" | "stability" | "growth", { name: T; about: T }> = {
  bond: { name: { th: "ความผูกพันทางใจ", en: "Emotional bond" }, about: { th: "อาทิตย์ จันทร์ ศุกร์ ลัคนา ของสองคนต่อกัน: รู้สึกปลอดภัยและเป็นตัวเองได้แค่ไหน", en: "Sun, Moon, Venus and Ascendant links: how safe and at home you feel together" } },
  attraction: { name: { th: "แรงดึงดูด", en: "Attraction" }, about: { th: "ศุกร์ อังคาร พลูโต: ความหลงใหลและเคมี มุมตึงก็สร้างแรงดึงดูดได้ แต่ต้องจัดการให้ดี", en: "Venus, Mars and Pluto links: chemistry and desire. Tense aspects also attract, but need care" } },
  talk: { name: { th: "การสื่อสาร", en: "Communication" }, about: { th: "ดาวพุธกับดาวสำคัญของอีกคน: คุยกันรู้เรื่องแค่ไหน", en: "Mercury links: how easily you understand each other" } },
  stability: { name: { th: "ความมั่นคงระยะยาว", en: "Long-term stability" }, about: { th: "เสาร์และพฤหัสกับดวงสว่าง: ความรับผิดชอบ ความเชื่อใจ และการพากันโต", en: "Saturn and Jupiter links: commitment, trust and growing together" } },
  growth: { name: { th: "การเติบโตร่วมกัน", en: "Growing together" }, about: { th: "โหนด พฤหัส ไครอน: ความรู้สึกว่าพบกันด้วยเหตุผลบางอย่าง และช่วยเยียวยากัน", en: "Node, Jupiter and Chiron links: a sense of purpose and healing together" } },
};

/** คู่ดาวสำคัญในผังคู่ (เรียงชื่อตามตัวอักษร คั่นด้วย "-") — ประโยคเฉพาะเมื่อกลมกลืน/ตึง */
export const SYN_PAIR_TEXT: Record<string, { harmonious: T; tense: T }> = {
  "moon-sun": {
    harmonious: { th: "คู่คลาสสิกของความเข้ากัน คนหนึ่งให้ทิศทาง อีกคนให้ความอบอุ่น รู้สึกเหมือนรู้จักกันมานาน", en: "A classic sign of compatibility: one gives direction, the other warmth. It feels like you have known each other for years." },
    tense: { th: "ดึงดูดกันแรงแต่จังหวะไม่ตรง สิ่งที่คนหนึ่งต้องการกับสิ่งที่อีกคนเป็นต้องหาจุดกลาง", en: "A strong pull with mismatched timing: what one needs and what the other is must meet halfway." },
  },
  "moon-moon": {
    harmonious: { th: "ใจตรงกัน ต้องการสิ่งคล้ายกันเวลาเหนื่อยหรือเศร้า อยู่ด้วยกันแล้วสบายใจ", en: "Your hearts are in tune; you need similar things when tired or sad, and feel at ease together." },
    tense: { th: "วิธีดูแลใจไม่เหมือนกัน สิ่งที่ปลอบคนหนึ่งได้อาจไม่ได้ผลกับอีกคน ต้องถามกันตรง ๆ", en: "You soothe yourselves differently. Ask each other directly what helps." },
  },
  "sun-sun": {
    harmonious: { th: "เป้าหมายชีวิตไปทางเดียวกัน เชียร์กันได้โดยไม่ต้องพยายาม", en: "Your life goals point the same way, so supporting each other comes easily." },
    tense: { th: "อัตตาสองคนชนกันได้ง่าย ผลัดกันเป็นผู้นำแล้วความต่างจะกลายเป็นจุดแข็ง", en: "Egos can clash. Take turns leading and the difference becomes a strength." },
  },
  "mars-venus": {
    harmonious: { th: "เคมีลงตัว ความโรแมนติกกับความกล้าเข้าหากันพอดี", en: "Natural chemistry: romance and courage meet in balance." },
    tense: { th: "แรงดึงดูดแรงมาก แต่หวานกับร้อนสลับกันเร็ว ต้องพูดความต้องการให้ชัด", en: "Very strong attraction that swings between sweet and heated. Say what you want clearly." },
  },
  "mars-mars": {
    harmonious: { th: "ลุยด้วยกันได้ดี จังหวะการลงมือตรงกัน", en: "You act well as a team; your pace matches." },
    tense: { th: "พลังสองคนแรงทั้งคู่ เถียงกันง่าย หากิจกรรมให้ปล่อยพลังด้วยกัน", en: "Two strong drives that argue easily. Find activities to burn energy together." },
  },
  "venus-venus": {
    harmonious: { th: "รสนิยมและวิธีแสดงความรักคล้ายกัน มีความสุขกับสิ่งเดียวกัน", en: "Similar taste and love language; you enjoy the same things." },
    tense: { th: "ให้คุณค่ากับคนละเรื่อง ลองเรียนรู้ภาษารักของอีกฝ่าย", en: "You value different things. Learn each other's love language." },
  },
  "moon-venus": {
    harmonious: { th: "อ่อนโยนต่อกันโดยธรรมชาติ รู้สึกเป็นที่รักและได้รับการดูแล", en: "Naturally tender; you feel loved and cared for." },
    tense: { th: "ความรักมีแต่แสดงออกไม่ตรงกับที่อีกคนต้องการ บอกกันว่าแบบไหนที่ใช่", en: "Love is there but expressed in ways the other may not need. Tell each other what works." },
  },
  "mercury-mercury": {
    harmonious: { th: "คุยกันรู้เรื่อง ความคิดต่อกันติด", en: "Easy conversation; your minds connect." },
    tense: { th: "คิดและพูดคนละสไตล์ ฟังให้จบก่อนตอบจะช่วยได้มาก", en: "Different thinking styles. Listening fully before replying helps a lot." },
  },
  "sun-venus": {
    harmonious: { th: "ชื่นชมกันและกัน คนหนึ่งทำให้อีกคนรู้สึกมีเสน่ห์", en: "Mutual admiration; one makes the other feel attractive." },
    tense: { th: "ชอบกันแต่คาดหวังต่างกัน ระวังการเอาใจจนลืมตัวเอง", en: "Fondness with different expectations. Avoid pleasing at your own expense." },
  },
  "moon-saturn": {
    harmonious: { th: "ให้ความรู้สึกมั่นคง พึ่งพากันได้ในระยะยาว", en: "A sense of security and long-term reliability." },
    tense: { th: "อาจรู้สึกถูกจำกัดหรือเย็นชา ความอบอุ่นต้องตั้งใจแสดงออก", en: "One may feel restricted or chilled. Warmth needs to be shown on purpose." },
  },
  "saturn-sun": {
    harmonious: { th: "มีความรับผิดชอบต่อกัน สร้างสิ่งที่ยั่งยืนด้วยกันได้", en: "Commitment and the ability to build something lasting." },
    tense: { th: "คนหนึ่งอาจรู้สึกถูกตัดสินหรือกดดัน ชมกันให้บ่อยขึ้น", en: "One may feel judged or pressured. Praise each other more often." },
  },
  "saturn-venus": {
    harmonious: { th: "ความรักแบบจริงจังและซื่อสัตย์", en: "Serious, loyal love." },
    tense: { th: "ความรักมาพร้อมความกังวลหรือระยะห่าง ให้เวลากันและกันมากขึ้น", en: "Love mixed with worry or distance. Give it time." },
  },
  "jupiter-sun": {
    harmonious: { th: "ทำให้กันและกันมองโลกในแง่ดีและกล้าฝันใหญ่", en: "You make each other optimistic and brave enough to dream big." },
    tense: { th: "เชียร์กันจนเกินตัวได้ ช่วยกันเตือนเรื่องความพอดี", en: "You may encourage each other to overdo things. Keep each other grounded." },
  },
  "jupiter-venus": {
    harmonious: { th: "ความสุขและความใจกว้างต่อกัน ใช้เวลาด้วยกันแล้วสนุก", en: "Generosity and joy; time together feels abundant." },
    tense: { th: "สนุกด้วยกันแต่ระวังใช้จ่ายหรือตามใจกันเกินพอดี", en: "Fun together, but watch overspending and indulgence." },
  },
  "node-sun": {
    harmonious: { th: "ความรู้สึกว่าพบกันด้วยเหตุผลบางอย่าง ช่วยกันไปในทิศทางชีวิต", en: "A feeling of meeting for a reason; you help each other's life direction." },
    tense: { th: "ความสัมพันธ์ท้าทายให้ออกจากนิสัยเดิม", en: "The relationship challenges old habits." },
  },
  "moon-node": {
    harmonious: { th: "ผูกพันทางใจลึก เหมือนรู้จักกันมาก่อน", en: "A deep emotional familiarity, as if you met before." },
    tense: { th: "ความผูกพันที่ต้องเลือกระหว่างความคุ้นเคยกับการเติบโต", en: "A bond that asks you to choose growth over comfort." },
  },
};

/** ความหมายของมุมเมื่อเป็นมุมระหว่างสองคน (ประโยคกลาง ใช้เมื่อคู่ดาวไม่มีประโยคเฉพาะ) */
export const SYN_ASPECT_MEANING: Partial<Record<AspectType, T>> = {
  conjunction: { th: "สองเรื่องนี้ของสองคนหลอมเข้าหากัน รู้สึกได้ชัดตั้งแต่แรกพบ", en: "these merge strongly between you and are felt from the first meeting" },
  opposition: { th: "ดึงดูดกันเพราะต่างกัน ต้องหาจุดสมดุลระหว่างสองฝั่ง", en: "you are drawn together by difference and need to find a balance" },
  trine: { th: "ไหลเข้าหากันง่าย เข้าใจกันโดยไม่ต้องอธิบาย", en: "this flows easily; you understand each other without explaining" },
  square: { th: "เสียดสีกันบ้าง แต่แรงเสียดทานนี้ทำให้ทั้งคู่เติบโต", en: "there is friction here, and it makes you both grow" },
  sextile: { th: "เกื้อหนุนกันเมื่อลงมือทำอะไรด้วยกัน", en: "you support each other when you do things together" },
  quincunx: { th: "จังหวะไม่ค่อยตรงกัน ต้องปรับเข้าหากันเรื่อย ๆ", en: "your rhythms do not quite match, so you keep adjusting to each other" },
};
