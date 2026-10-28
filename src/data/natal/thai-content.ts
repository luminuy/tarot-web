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
    { name: "ศุภะ", en: "Supha", meaning: { th: "สิ่งดีงาม เกียรติยศ", en: "blessings and honour" } },
    { name: "กัมมะ", en: "Kamma", meaning: { th: "การงาน หน้าที่", en: "work and duty" } },
    { name: "ลาภะ", en: "Labha", meaning: { th: "โชคลาภ วาสนา", en: "fortune and gains" } },
    { name: "พยายะ", en: "Phayaya", meaning: { th: "ความเจ็บป่วย อุปสรรค", en: "illness and setbacks" } },
    { name: "ทาสี", en: "Thasi", meaning: { th: "ผู้ช่วยหญิง บริวารหญิง", en: "female helpers" } },
    { name: "ทาสา", en: "Thasa", meaning: { th: "ผู้ช่วยชาย บริวารชาย", en: "male helpers" } },
  ],
];

/** ดาวเสวยอายุ: บรรยากาศทั่วไปของช่วงนั้นตามธรรมชาติของดาว (ไม่ฟันธงเหตุการณ์) */
export const MAHA_TAKSA_TONE: Record<ThaiPlanet, T> = {
  1: { th: "ช่วงที่เรื่องตัวตน เกียรติ และความรับผิดชอบเด่น", en: "a time when self, honour and responsibility come forward" },
  2: { th: "ช่วงที่เรื่องอารมณ์ ความรัก และคนรอบตัวเด่น", en: "a time when feelings, love and the people around you come forward" },
  3: { th: "ช่วงที่ต้องใช้แรง ความกล้า และการแข่งขัน", en: "a time that calls for energy, courage and competition" },
  4: { th: "ช่วงของการเรียน การสื่อสาร และการค้า", en: "a time of learning, communication and trade" },
  5: { th: "ช่วงของความรู้ ผู้ใหญ่อุปถัมภ์ และการเติบโต", en: "a time of knowledge, mentors and growth" },
  6: { th: "ช่วงของความสุข ศิลปะ ความรัก และทรัพย์", en: "a time of pleasure, art, love and wealth" },
  7: { th: "ช่วงที่ต้องอดทน รับผิดชอบหนัก และสร้างความมั่นคง", en: "a time of patience, heavy duty and building stability" },
  8: { th: "ช่วงที่มีความเปลี่ยนแปลง ความอยากได้ และเรื่องไม่คาดฝัน", en: "a time of change, desire and the unexpected" },
};
