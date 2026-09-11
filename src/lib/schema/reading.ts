import { z } from "zod";

/**
 * โครงคำตอบของแม่หมอ
 * บังคับให้โมเดลตอบเป็นโครงสร้าง ไม่ใช่ข้อความก้อนเดียว เพราะ:
 *  - UI ต้องโชว์คำอ่านทีละใบให้ตรงกับจังหวะที่ผู้ใช้พลิกไพ่
 *  - เก็บลงฐานข้อมูลแล้วนำกลับมาแสดง/แชร์ได้โดยไม่ต้อง parse ข้อความ
 *  - ตรวจได้ว่าโมเดลอ่านครบทุกใบจริง ไม่ข้ามใบไหน
 *
 * คำอธิบายใน .describe() ถูกส่งเข้า JSON Schema ให้โมเดลอ่าน
 * จึงเขียนให้เป็นคำสั่งไปในตัว ไม่ใช่แค่คอมเมนต์สำหรับคน
 */

export const CardReadingSchema = z.object({
  position: z
    .number()
    .int()
    .min(0)
    .describe("index ตำแหน่งตามที่ระบุในข้อมูลไพ่ที่ให้มา"),
  headline: z
    .string()
    .min(1)
    .max(80)
    .describe("พาดหัวสั้น 3-6 คำ ไม่เกิน 40 ตัวอักษร สรุปใจความของไพ่ใบนี้ในตำแหน่งนี้"),
  visualAnchor: z
    .string()
    .max(120)
    .optional()
    .describe("องค์ประกอบบนหน้าไพ่ 1909 ที่ใช้อ่านจริง เช่น 'สุนัขขาวเห่าที่เท้า'"),
  positionLink: z
    .string()
    .max(200)
    .optional()
    .describe("ไพ่ใบนี้ตอบมิติของตำแหน่งนี้อย่างไร"),
  questionLink: z
    .string()
    .max(200)
    .optional()
    .describe("เชื่อมกับส่วนไหนของคำถามผู้ถามโดยตรง"),
  reading: z
    .string()
    .min(1)
    .describe(
      "คำอ่านเชิงลึก (ยาวสำหรับผังน้อยใบ กระชับสำหรับผังเยอะใบ) เดินตามลำดับ: ภาพบนหน้าไพ่ 1909 จริง → จิตวิทยาใต้สำนึก → เชื่อมตำแหน่งในผัง + คำถามของผู้ถาม → ข้อคิดปลดล็อกที่ให้พลังใจ",
    ),
});

const YES_NO_EN_MAP: Record<string, "ใช่" | "ไม่ใช่" | "ยังไม่แน่"> = {
  yes: "ใช่",
  no: "ไม่ใช่",
  uncertain: "ยังไม่แน่",
  maybe: "ยังไม่แน่",
};

const MOOD_EN_MAP: Record<string, "สดใส" | "อบอุ่น" | "สงบ" | "ครุ่นคิด" | "ท้าทาย"> = {
  radiant: "สดใส",
  warm: "อบอุ่น",
  serene: "สงบ",
  reflective: "ครุ่นคิด",
  challenging: "ท้าทาย",
};

export const ReadingSchema = z.object({
  opening: z
    .string()
    .min(1)
    .describe("คำทักทายและความรู้สึกแรกเมื่อเห็นไพ่ทั้งชุด 2-3 ประโยค ห้ามเฉลยรายละเอียดรายใบตรงนี้"),
  cards: z
    .array(CardReadingSchema)
    .min(1)
    .describe("คำอ่านรายใบ ต้องมีครบทุกตำแหน่งที่ให้มา เรียงตาม position จากน้อยไปมาก"),
  connections: z
    .string()
    .describe(
      "ไพ่ทั้งชุดคุยกันอย่างไร 4-6 ประโยค — บทสนทนาทางสายตา การส่งพลังงานข้ามใบ เคมีธาตุ ตัวเลขซ้ำ ไพ่หัวกลับกระจุกตัว ไพ่ Major หลายใบ หรือไพ่ที่ให้คำตอบขัดกัน (ชี้เฉพาะความสัมพันธ์ที่มีอยู่จริง). ผังใบเดียวให้พูดถึงธาตุ/ตัวเลขของไพ่ใบนั้นแทน",
    ),
  summary: z
    .string()
    .min(1)
    .describe(
      "สรุปคำตอบต่อคำถามของผู้ถามโดยตรง หนักแน่น เปี่ยมพลังใจ 5-8 ประโยค และประโยคสุดท้ายต้องเป็น 1 คำถามชวนคิดทรงพลัง (Power Reflection Question)",
    ),
  advice: z
    .array(z.string().min(1))
    .min(2)
    .max(4)
    .describe(
      "3 ข้อ: 2 ข้อแรกเป็น Micro-Action ที่ลงมือทำได้จริงใน 24-48 ชม. (รูปธรรม ไม่ใช่คำปลอบใจ) · ข้อสุดท้ายเป็นกิจกรรมฝึกสติ 1 นาที ขึ้นต้นด้วย 🧘",
    ),
  timing: z
    .string()
    .min(1)
    .describe(
      "กรอบเวลาโดยประมาณที่เรื่องน่าจะขยับ อ้างอิงจากธาตุและตัวเลขของไพ่ ห้ามระบุวันที่แน่นอน ห้ามฟันธงเดือน",
    ),
  // .nullish() (ไม่ใช่แค่ .nullable()) เพราะโมเดลบางตัว (เช่น Gemini) ไม่รองรับ
  // null ใน JSON Schema แบบ enum จริง ๆ จึงมักตอบโดย "ไม่ใส่คีย์นี้มาเลย" หรือใส่ "" แทน null
  // ถ้า schema บังคับต้องมีคีย์นี้เสมอ การอ่านไพ่ปกติ (นอกโหมดใช่/ไม่ใช่) จะ parse fail ทุกครั้ง
  // preprocess แปลง "" ให้เป็น undefined ก่อน เพื่อกันกรณีโมเดลตอบสตริงว่างแทนการเว้นคีย์
  yesNoAnswer: z.preprocess(
    (v) => {
      if (v === "") return undefined;
      if (typeof v === "string") {
        const mapped = YES_NO_EN_MAP[v.trim().toLowerCase()];
        if (mapped) return mapped;
      }
      return v;
    },
    z
      .enum(["ใช่", "ไม่ใช่", "ยังไม่แน่"])
      .nullish()
      .describe("ใส่ค่าเฉพาะเมื่อโหมดใช่/ไม่ใช่ถูกเปิด นอกนั้นให้เว้นคีย์นี้ไว้หรือใส่ null"),
  ),
  mood: z.preprocess(
    (v) => {
      if (typeof v === "string") {
        const mapped = MOOD_EN_MAP[v.trim().toLowerCase()];
        if (mapped) return mapped;
      }
      return v;
    },
    z
      .enum(["สดใส", "อบอุ่น", "สงบ", "ครุ่นคิด", "ท้าทาย"])
      .describe("อารมณ์รวมของคำอ่านชุดนี้ ใช้ปรับบรรยากาศและสีของหน้าเว็บ"),
  ),
});

export type CardReading = z.infer<typeof CardReadingSchema>;
export type Reading = z.infer<typeof ReadingSchema>;

