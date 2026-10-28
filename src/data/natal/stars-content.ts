/**
 * ความหมายดาวฤกษ์และจุด Lots สองภาษา — สรุปแบบเป็นกลางจากธรรมเนียมโหราตะวันตก (Ptolemy · Robson · Brady)
 * ไม่ใช้คำขู่หรือฟันธงเหตุร้าย (กติกาเดียวกับคำอธิบายผังดวง)
 */
import type { LotId } from "@/lib/astro/lots";
import type { T } from "./content";

export const STAR_TEXT: Record<string, { th: string; meaning: T }> = {
  Algol: { th: "อัลกอล", meaning: { th: "พลังเข้มข้น ความหลงใหล และการเผชิญความกลัวของตัวเอง", en: "intensity, passion and facing your own fears" } },
  Alcyone: { th: "อัลไซโอนี (กลุ่มดาวลูกไก่)", meaning: { th: "วิสัยทัศน์ ความเข้าใจลึก และความอ่อนไหว", en: "vision, deep insight and sensitivity" } },
  Aldebaran: { th: "อัลเดบารัน (ดาวฤกษ์หลวง)", meaning: { th: "ความกล้า ความซื่อตรง สำเร็จได้เมื่อรักษาคุณธรรม", en: "courage and integrity; success that rests on honesty" } },
  Rigel: { th: "ไรเจล", meaning: { th: "การเรียนรู้ การสอน และความสำเร็จจากความเพียร", en: "learning, teaching and success through effort" } },
  Capella: { th: "คาเพลลา", meaning: { th: "ความอยากรู้ ความเป็นอิสระ และความคล่องตัว", en: "curiosity, independence and agility" } },
  Bellatrix: { th: "เบลลาทริกซ์", meaning: { th: "ความเด็ดขาดและการลุกขึ้นปกป้องสิ่งที่ถูก", en: "decisiveness and standing up for what is right" } },
  Betelgeuse: { th: "บีเทลจุส", meaning: { th: "ความสำเร็จ โชค และเกียรติ", en: "success, good fortune and honour" } },
  Sirius: { th: "ซิริอุส", meaning: { th: "ความทะเยอทะยาน ความทุ่มเท และชื่อเสียง", en: "ambition, devotion and renown" } },
  Canopus: { th: "คาโนปุส", meaning: { th: "การเดินทาง การนำทาง และการถ่ายทอดความรู้", en: "voyages, guidance and passing on knowledge" } },
  Castor: { th: "แคสเตอร์", meaning: { th: "ไหวพริบ ความคิด และการเขียน", en: "wit, intellect and writing" } },
  Pollux: { th: "พอลลักซ์", meaning: { th: "ความกล้า ความมุ่งมั่น และจิตใจนักสู้", en: "boldness, drive and a fighting spirit" } },
  Procyon: { th: "โปรซีออน", meaning: { th: "จังหวะเร็ว โอกาสที่มาไว ต้องรักษาให้ต่อเนื่อง", en: "quick rises and opportunities that need follow-through" } },
  Regulus: { th: "เรกูลัส (ดาวฤกษ์หลวง)", meaning: { th: "ความเป็นผู้นำ เกียรติ และความสำเร็จ ที่ยั่งยืนเมื่อไม่ใช้ความแค้น", en: "leadership, honour and success that lasts when free of revenge" } },
  Zosma: { th: "ซอสมา", meaning: { th: "ความเห็นใจคนที่อ่อนแอกว่า และการเป็นที่พึ่ง", en: "empathy for the vulnerable and being a support" } },
  Denebola: { th: "เดเนบอลา", meaning: { th: "ความคิดนอกกรอบและการยืนนอกกระแส", en: "unconventional thinking and standing apart" } },
  Vindemiatrix: { th: "วินเดเมียทริกซ์", meaning: { th: "ความรอบคอบและการเก็บเกี่ยวผลงาน", en: "prudence and reaping what you sow" } },
  Algorab: { th: "อัลกอแรบ", meaning: { th: "ความมุ่งมั่นสูงและความแนบเนียน", en: "strong determination and finesse" } },
  Spica: { th: "สไปกา (ดาวจิตรา)", meaning: { th: "พรสวรรค์ ความงาม และความสำเร็จที่ได้มาอย่างงดงาม", en: "gifts, brilliance and graceful success" } },
  Arcturus: { th: "อาร์คตุรุส (ดาวสวาติ)", meaning: { th: "การเบิกทางใหม่และความรุ่งเรืองจากเส้นทางของตัวเอง", en: "pathfinding and prosperity on your own road" } },
  Alkaid: { th: "อัลไคด์", meaning: { th: "ความเป็นผู้นำและความตั้งใจแน่วแน่", en: "leadership and firm resolve" } },
  Zubenelgenubi: { th: "ซูเบนเอลเจนูบี", meaning: { th: "ความยุติธรรมและการปรับสิ่งที่เอียงให้สมดุล", en: "justice and restoring balance" } },
  Zubeneschamali: { th: "ซูเบนเอสชามาลี", meaning: { th: "ความทะเยอทะยานทางสังคมและการได้รับการยอมรับ", en: "social ambition and recognition" } },
  Alphecca: { th: "อัลเฟกกา", meaning: { th: "ความงาม ศิลปะ และเกียรติ", en: "beauty, art and honour" } },
  Antares: { th: "แอนทาเรส (ดาวฤกษ์หลวง)", meaning: { th: "ความกล้า ความเข้มข้น และพลังที่ต้องใช้อย่างมีสติ", en: "courage and intensity, best used with awareness" } },
  Vega: { th: "เวกา", meaning: { th: "เสน่ห์ ศิลปะ ดนตรี และความมีชื่อเสียง", en: "charisma, art, music and renown" } },
  Altair: { th: "อัลแทร์", meaning: { th: "ความกล้าและความทะเยอทะยาน", en: "boldness and ambition" } },
  "Deneb Algedi": { th: "เดเนบ อัลเจดี", meaning: { th: "กฎเกณฑ์ ความยุติธรรม และการปกป้อง", en: "law, justice and protection" } },
  "Deneb Adige": { th: "เดเนบ", meaning: { th: "สติปัญญา การเรียนรู้ และศิลปะ", en: "intellect, learning and art" } },
  Fomalhaut: { th: "โฟมาลฮอท (ดาวฤกษ์หลวง)", meaning: { th: "อุดมคติ ความฝัน และการรักษาความบริสุทธิ์ใจ", en: "idealism, dreams and keeping your intentions pure" } },
  Scheat: { th: "เชียต", meaning: { th: "ความคิดสร้างสรรค์และความเป็นอิสระ", en: "creativity and independence" } },
  Markab: { th: "มาร์กาบ", meaning: { th: "ความมั่นคงและความสำเร็จจากความตั้งใจ", en: "steadiness and achievement through intent" } },
  Achernar: { th: "อะเคอร์นาร์", meaning: { th: "ความสำเร็จและการเปลี่ยนแปลงไปในทางที่ดี", en: "success and change for the better" } },
  Polaris: { th: "โพลาริส (ดาวเหนือ)", meaning: { th: "ทิศทางและเป้าหมายที่ชัดเจน", en: "direction and a clear purpose" } },
  Hamal: { th: "ฮามาล", meaning: { th: "ความเป็นตัวของตัวเองและความแน่วแน่", en: "independence and persistence" } },
  Mirach: { th: "มิราค", meaning: { th: "ความงาม ความรัก และการให้อภัย", en: "beauty, love and forgiveness" } },
};

export const LOT_TEXT: Record<LotId, { name: T; meaning: T }> = {
  fortune: { name: { th: "Lot of Fortune (โชค)", en: "Lot of Fortune" }, meaning: { th: "ร่างกาย ทรัพย์ และสิ่งที่ชีวิตมอบให้", en: "the body, wealth and what life brings you" } },
  spirit: { name: { th: "Lot of Spirit (จิตวิญญาณ)", en: "Lot of Spirit" }, meaning: { th: "เจตนา การกระทำ และอาชีพที่เลือกเอง", en: "intention, action and chosen work" } },
  eros: { name: { th: "Lot of Eros (ความปรารถนา)", en: "Lot of Eros" }, meaning: { th: "ความรัก ความปรารถนา และสิ่งที่ดึงดูดใจ", en: "love, desire and what attracts you" } },
  victory: { name: { th: "Lot of Victory (ชัยชนะ)", en: "Lot of Victory" }, meaning: { th: "ศรัทธา ความหวัง และความสำเร็จ", en: "faith, hope and success" } },
  necessity: { name: { th: "Lot of Necessity (ข้อจำกัด)", en: "Lot of Necessity" }, meaning: { th: "ข้อจำกัด การต่อสู้ และสิ่งที่ต้องยอมรับ", en: "constraints, struggles and what must be accepted" } },
  courage: { name: { th: "Lot of Courage (ความกล้า)", en: "Lot of Courage" }, meaning: { th: "ความกล้า ความเด็ดขาด และการลงมือ", en: "boldness, daring and taking action" } },
  nemesis: { name: { th: "Lot of Nemesis (บทเรียน)", en: "Lot of Nemesis" }, meaning: { th: "สิ่งที่อยู่เหนือการควบคุมและบทเรียนจากการสูญเสีย", en: "what lies beyond control and lessons from loss" } },
};
