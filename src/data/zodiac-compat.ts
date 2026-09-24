/**
 * ✦ ความเข้ากันของสองราศี — คิดจาก "มุมระหว่างราศี" (ระยะห่างบนวงจักรราศี 0–6 ช่อง)
 * ===========================================================================
 * เป็นหลักพื้นฐานที่โหราศาสตร์ทั้งสากลและไทยใช้ตรงกัน (ตรีโกณ · โยค · จตุโกณ · เล็ง)
 * ระยะห่างบอกความสัมพันธ์ของธาตุและจังหวะชีวิต ไม่ได้บอกว่าคู่ไหน "ไปรอด" หรือ "ไม่รอด"
 * ➔ ข้อความต้องพูดถึงแนวโน้มและวิธีดูแลกัน ห้ามฟันธงเลิก/ไม่เลิก (กฎข้อ 10 + จรรยาบรรณหน้าเว็บ)
 *
 * ⚠️ ไฟล์นี้ถูกส่งเข้า island เครื่องคำนวณความเข้ากัน — เก็บให้สั้น (7 มุม × 2 ภาษา)
 */

export type ZodiacAspectDistance = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ZodiacAspectCopy {
  /** ชื่อมุม เช่น "ธาตุเดียวกัน (ตรีโกณ)" */
  name: string;
  /** ระดับความกลมกลืน 1–5 (แสดงเป็นจุด ✦ ตามกฎข้อ 2) */
  harmony: 1 | 2 | 3 | 4 | 5;
  /** ภาพรวมความสัมพันธ์ 2–3 ประโยค */
  summary: string;
  /** คำแนะนำสำหรับคู่นี้ — `{a}` / `{b}` จะถูกแทนด้วยชื่อไพ่ประจำราศีของแต่ละฝ่าย */
  advice: string;
}

export const ZODIAC_ASPECTS: Record<ZodiacAspectDistance, { th: ZodiacAspectCopy; en: ZodiacAspectCopy }> = {
  0: {
    th: {
      name: "ราศีเดียวกัน",
      harmony: 4,
      summary:
        "เหมือนส่องกระจก เข้าใจกันเร็วเพราะคิดและรู้สึกคล้ายกัน แต่จุดอ่อนก็เหมือนกันด้วย เวลามีปัญหาจึงมักติดอยู่ที่เดิมพร้อมกันทั้งคู่",
      advice: "ไพ่ {a} ของทั้งคู่คือใบเดียวกัน ลองผลัดกันเป็นฝ่ายเล่นด้านสว่างของไพ่ใบนี้ให้อีกคนเห็น แทนที่จะแข่งกันแสดงด้านเงา",
    },
    en: {
      name: "Same sign",
      harmony: 4,
      summary:
        "Like looking in a mirror. You understand each other quickly because you think and feel alike, but you also share the same blind spots and can get stuck in the same place together.",
      advice: "You share {a}. Take turns showing each other its bright side instead of competing in its shadow.",
    },
  },
  1: {
    th: {
      name: "ราศีติดกัน",
      harmony: 3,
      summary:
        "อยู่ติดกันบนวงจักรราศีแต่ธาตุต่างกัน จังหวะชีวิตจึงไม่ตรงกันนัก คนหนึ่งมักมีสิ่งที่อีกคนกำลังต้องเรียนรู้ ถ้าเปิดใจจะเป็นครูให้กันได้ดี",
      advice: "{a} กับ {b} มองโลกคนละมุม ลองถามกันว่า 'ถ้าเป็นเธอจะทำยังไง' ก่อนตัดสินใจเรื่องสำคัญ",
    },
    en: {
      name: "Neighbouring signs",
      harmony: 3,
      summary:
        "Side by side on the zodiac but different elements, so your rhythms rarely match. One of you usually has what the other is learning, and with an open mind you can teach each other well.",
      advice: "{a} and {b} see the world differently. Ask each other \"what would you do?\" before big decisions.",
    },
  },
  2: {
    th: {
      name: "ธาตุเกื้อกูล (โยค)",
      harmony: 4,
      summary:
        "ธาตุที่ช่วยกันโต ไฟกับลม หรือดินกับน้ำ เป็นคู่คิดและเพื่อนร่วมทางที่ดี คุยกันสนุก ช่วยกันผลักดันเป้าหมายได้โดยไม่ต้องพยายามมาก",
      advice: "พลังของ {a} กับ {b} ต่อกันได้ลื่น ลองตั้งเป้าหมายร่วมกันสักเรื่องแล้วแบ่งบทบาทตามจุดแข็งของไพ่แต่ละใบ",
    },
    en: {
      name: "Supportive elements (sextile)",
      harmony: 4,
      summary:
        "Elements that feed each other, fire with air or earth with water. You make great partners in thought and on the road, easy to talk to and able to push shared goals without much effort.",
      advice: "{a} and {b} flow well together. Set one shared goal and split the roles by each card's strength.",
    },
  },
  3: {
    th: {
      name: "มุมฉาก (จตุโกณ)",
      harmony: 2,
      summary:
        "จังหวะเดียวกันแต่ธาตุขัดกัน ต่างคนต่างอยากนำ จึงปะทะกันง่าย แต่แรงเสียดทานนี้เองที่ทำให้ทั้งคู่โตเร็วกว่าอยู่กับคนที่เหมือนตัวเอง",
      advice: "{a} กับ {b} ดึงกันคนละทาง ตกลงกติกาการทะเลาะไว้ก่อน เช่น พักสิบนาทีเมื่อเสียงเริ่มดัง แล้วค่อยคุยต่อ",
    },
    en: {
      name: "Square",
      harmony: 2,
      summary:
        "The same pace but clashing elements. You both want to lead, so friction comes easily, yet that friction helps you both grow faster than you would with someone like yourself.",
      advice: "{a} and {b} pull in different directions. Agree on rules for arguing, such as a ten-minute pause when voices rise.",
    },
  },
  4: {
    th: {
      name: "ธาตุเดียวกัน (ตรีโกณ)",
      harmony: 5,
      summary:
        "ธาตุเดียวกัน เข้าใจกันโดยไม่ต้องอธิบาย อยู่ด้วยกันแล้วสบายใจ เป็นคู่ที่กลมกลืนที่สุดบนวงจักรราศี ระวังแค่ความสบายจนไม่มีใครกล้าพาไปลองสิ่งใหม่",
      advice: "{a} กับ {b} เป็นพลังธาตุเดียวกัน ความสัมพันธ์ไหลลื่นอยู่แล้ว ลองพากันออกไปทำสิ่งที่ทั้งคู่ไม่เคยทำ เพื่อไม่ให้ความสบายกลายเป็นความเคยชิน",
    },
    en: {
      name: "Same element (trine)",
      harmony: 5,
      summary:
        "The same element, so you understand each other without explaining. Being together feels easy, the most harmonious pairing on the zodiac. Just watch that comfort does not stop you trying new things.",
      advice: "{a} and {b} share one element and already flow. Do something new together so ease does not become habit.",
    },
  },
  5: {
    th: {
      name: "มุมเฉียง",
      harmony: 2,
      summary:
        "ธาตุและจังหวะไม่มีอะไรตรงกันเลย เหมือนพูดคนละภาษา ต้องปรับตัวเข้าหากันมาก แต่ถ้าเรียนรู้ภาษาของอีกฝ่ายได้ จะเห็นโลกกว้างกว่าที่เคย",
      advice: "{a} กับ {b} แทบไม่มีจุดร่วมโดยธรรมชาติ อย่าเดาใจกัน ให้พูดความต้องการออกมาตรง ๆ แล้วถามกลับว่าเข้าใจตรงกันไหม",
    },
    en: {
      name: "Quincunx",
      harmony: 2,
      summary:
        "Nothing in your elements or pace lines up, like speaking different languages. It takes real adjustment, but if you learn each other's language you will see a wider world.",
      advice: "{a} and {b} share little by nature. Do not guess; say what you need plainly and check you understood each other.",
    },
  },
  6: {
    th: {
      name: "คู่ตรงข้าม (เล็ง)",
      harmony: 4,
      summary:
        "อยู่คนละฝั่งของวงจักรราศี ดึงดูดกันแรงเพราะอีกคนมีสิ่งที่เราขาด เติมเต็มกันได้ดีมาก แต่ถ้าไม่ยอมรับความต่าง ก็กลายเป็นการชักเย่อได้เหมือนกัน",
      advice: "{a} กับ {b} คือสองขั้วที่ต้องการกัน ลองชมสิ่งที่อีกฝ่ายทำได้แต่เราทำไม่ได้ วันละหนึ่งเรื่อง",
    },
    en: {
      name: "Opposites (opposition)",
      harmony: 4,
      summary:
        "Across the zodiac from each other, you attract strongly because each has what the other lacks. You can complete each other, but without accepting your differences it becomes a tug of war.",
      advice: "{a} and {b} are two poles that need each other. Each day, praise one thing the other can do that you cannot.",
    },
  },
};

/** ระยะห่างบนวงจักรราศี (0–6) จากลำดับราศี 0–11 */
export function zodiacDistance(indexA: number, indexB: number): ZodiacAspectDistance {
  const raw = Math.abs(indexA - indexB) % 12;
  return Math.min(raw, 12 - raw) as ZodiacAspectDistance;
}
