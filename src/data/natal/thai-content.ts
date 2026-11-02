/**
 * ข้อความของโหราไทย (ทักษา · มหาทักษา · เลข 7 ตัว) สองภาษา — ความหมายตามตำราที่อ้างใน `src/lib/astro/thai-astro.ts`
 * เขียนแบบบอกความหมายของตำแหน่ง ไม่ฟันธงดีร้ายของชีวิต (รอแม่หมอตรวจ)
 */
import type { ThaiPlanet, TaksaPosition } from "@/lib/astro/thai-astro";
import type { T } from "./content";

export const THAI_PLANET_NAME: Record<ThaiPlanet, T> = {
  1: { th: "อาทิตย์", en: "Sun" },
  2: { th: "จันทร์", en: "Moon" },
  3: { th: "อังคาร", en: "Mars" },
  4: { th: "พุธ", en: "Mercury" },
  5: { th: "พฤหัสบดี", en: "Jupiter" },
  6: { th: "ศุกร์", en: "Venus" },
  7: { th: "เสาร์", en: "Saturn" },
  8: { th: "ราหู", en: "Rahu" },
};

export const THAI_DAY_NAME: Record<ThaiPlanet, T> = {
  1: { th: "วันอาทิตย์", en: "Sunday" },
  2: { th: "วันจันทร์", en: "Monday" },
  3: { th: "วันอังคาร", en: "Tuesday" },
  4: { th: "วันพุธกลางวัน", en: "Wednesday (day)" },
  5: { th: "วันพฤหัสบดี", en: "Thursday" },
  6: { th: "วันศุกร์", en: "Friday" },
  7: { th: "วันเสาร์", en: "Saturday" },
  8: { th: "วันพุธกลางคืน (ราหู)", en: "Wednesday night (Rahu)" },
};

export const TAKSA_TEXT: Record<TaksaPosition, { name: T; meaning: T }> = {
  boriwan: { name: { th: "บริวาร", en: "Boriwan (companions)" }, meaning: { th: "ลูกหลาน ลูกน้อง และคนรอบตัวที่ช่วยเหลือ", en: "children, staff and the people around you who help" } },
  ayu: { name: { th: "อายุ", en: "Ayu (life)" }, meaning: { th: "สุขภาพ อารมณ์ และความเป็นอยู่", en: "health, mood and wellbeing" } },
  det: { name: { th: "เดช", en: "Det (power)" }, meaning: { th: "อำนาจ บารมี และความกล้า", en: "authority, prestige and courage" } },
  sri: { name: { th: "ศรี", en: "Sri (grace)" }, meaning: { th: "เสน่ห์ ความอ่อนโยน ความรัก และสิริมงคล", en: "charm, gentleness, love and good fortune" } },
  mula: { name: { th: "มูละ", en: "Mula (roots)" }, meaning: { th: "การเงิน ทรัพย์สิน และฐานะ", en: "money, property and standing" } },
  utsaha: { name: { th: "อุตสาหะ", en: "Utsaha (effort)" }, meaning: { th: "ความขยัน ความอดทน และความเพียร", en: "diligence, endurance and perseverance" } },
  montri: { name: { th: "มนตรี", en: "Montri (patrons)" }, meaning: { th: "ผู้ใหญ่ที่ให้การอุปถัมภ์ค้ำชู", en: "elders and patrons who support you" } },
  kalakini: { name: { th: "กาลกิณี", en: "Kalakini (misfortune)" }, meaning: { th: "สิ่งที่เป็นอุปสรรค ตำรานิยมเลี่ยงอักษรกลุ่มนี้ในชื่อ", en: "obstacles; tradition avoids these letters in names" } },
};

/** เลข 7 ตัว: ชื่อช่องของแต่ละฐาน (ฐานวัน · ฐานเดือน · ฐานปี) */
export const SEVEN_COLUMNS: readonly { name: string; en: string; meaning: T }[][] = [
  [
    { name: "อัตตะ", en: "Atta", meaning: { th: "ตนเอง", en: "yourself" } },
    { name: "หินะ", en: "Hina", meaning: { th: "ความเสื่อม ทางเสีย", en: "loss and decline" } },
    { name: "ธนัง", en: "Thanang", meaning: { th: "ทรัพย์สิน รายได้", en: "wealth and income" } },
    { name: "ปิตา", en: "Pita", meaning: { th: "บิดา ผู้ใหญ่ฝ่ายชาย", en: "father, male elders" } },
    { name: "มาตา", en: "Mata", meaning: { th: "มารดา ผู้เลี้ยงดู", en: "mother, carers" } },
    { name: "โภคา", en: "Phokha", meaning: { th: "สมบัติ ที่ดิน มรดก", en: "possessions, land, inheritance" } },
    { name: "มัชฌิมา", en: "Matchima", meaning: { th: "ความพอดี ปานกลาง", en: "balance, the middle way" } },
  ],
  [
    { name: "ตนุ", en: "Tanu", meaning: { th: "ตัวตน ร่างกาย", en: "self and body" } },
    { name: "กดุมภะ", en: "Kadumpha", meaning: { th: "ทรัพย์สิน การเงิน", en: "assets and money" } },
    { name: "สหัชชะ", en: "Sahatcha", meaning: { th: "เพื่อนฝูง ผู้ช่วยเหลือ", en: "friends and helpers" } },
    { name: "พันธุ", en: "Phanthu", meaning: { th: "ญาติพี่น้อง บ้าน", en: "relatives and home" } },
    { name: "ปุตตะ", en: "Putta", meaning: { th: "บุตรหลาน", en: "children" } },
    { name: "อริ", en: "Ari", meaning: { th: "ศัตรู อุปสรรค", en: "rivals and obstacles" } },
    { name: "ปัตนิ", en: "Patni", meaning: { th: "คู่ครอง", en: "partner" } },
  ],
  [
    { name: "มรณะ", en: "Morana", meaning: { th: "ความสูญเสีย การสิ้นสุด", en: "loss and endings" } },
    { name: "ศุภะ", en: "Supha", meaning: { th: "สิ่งดีงาม เกียรติยศ", en: "blessings and honor" } },
    { name: "กัมมะ", en: "Kamma", meaning: { th: "การงาน หน้าที่", en: "work and duty" } },
    { name: "ลาภะ", en: "Labha", meaning: { th: "โชคลาภ วาสนา", en: "fortune and gains" } },
    { name: "พยายะ", en: "Phayaya", meaning: { th: "ความเจ็บป่วย อุปสรรค", en: "illness and setbacks" } },
    { name: "ทาสี", en: "Thasi", meaning: { th: "ผู้ช่วยหญิง บริวารหญิง", en: "female helpers" } },
    { name: "ทาสา", en: "Thasa", meaning: { th: "ผู้ช่วยชาย บริวารชาย", en: "male helpers" } },
  ],
];

/**
 * ดาวเสวยอายุ: เรื่องที่เด่นของช่วงนั้นตามธรรมชาติของดาว + สิ่งที่ควรทำ (ไม่ทำนายเหตุการณ์ร้าย)
 * ต่อหลัง "ดาว…เสวยอายุ ถึงอายุ … · " และ "… rules until age …: " — อังกฤษขึ้นต้นตัวเล็ก ไม่มีจุดท้าย
 */
export const MAHA_TAKSA_TONE: Record<ThaiPlanet, T> = {
  1: { th: "ช่วงที่คุณต้องยืนเป็นผู้นำ เรื่องเกียรติและความรับผิดชอบมาก่อนเรื่องอื่น", en: "a time to step up and lead, with honor and responsibility first" },
  2: { th: "ช่วงที่อารมณ์ ความรัก และคนใกล้ตัวเป็นเรื่องหลัก ใจอ่อนไหวกว่าปกติ ดูแลใจตัวเองให้ดี", en: "a time when feelings, love and close people lead; you feel more, so look after your heart" },
  3: { th: "ช่วงที่ต้องสู้และแข่งขัน ได้ผลเมื่อลงมือเร็วและกล้าตัดสินใจ", en: "a time to compete; it pays to act fast and decide boldly" },
  4: { th: "ช่วงที่การเรียน การเจรจา และการค้าขายเป็นเรื่องหลัก ใช้ฝีมือพูดและเขียนให้เต็มที่", en: "a time when study, deals and trade lead; use your speaking and writing to the full" },
  5: { th: "ช่วงที่ความรู้และผู้ใหญ่อุปถัมภ์พาคุณเติบโต เรียนเพิ่มและเข้าหาคนที่เก่งกว่า", en: "a time when knowledge and mentors help you grow; study more and seek out people ahead of you" },
  6: { th: "ช่วงที่ความรัก ความสุข ศิลปะ และเรื่องเงินเด่น ใช้เสน่ห์ให้เป็นประโยชน์ แต่คุมการใช้จ่ายด้วย", en: "a time when love, pleasure, art and money stand out; use your charm, but watch your spending" },
  7: { th: "ช่วงที่งานหนักและความรับผิดชอบเพิ่มขึ้น อดทนทำทีละขั้น สิ่งที่สร้างไว้จะมั่นคง", en: "a time of heavy work and duty; go step by step, and what you build will last" },
  8: { th: "ช่วงที่มีความเปลี่ยนแปลงและเรื่องไม่คาดฝัน ความอยากได้พุ่งสูง ตั้งสติก่อนตัดสินใจเรื่องเงินและความสัมพันธ์", en: "a time of change and surprises when wants run high; think twice before money or relationship decisions" },
};
