import { NOVEL_CHAPTER_TEXT, NOVEL_PARTS, type NovelPartText } from "./novel-chapters";
import { NOVEL_PATH, NOVEL_TITLE } from "./novel-title";

export { NOVEL_PATH };

/**
 * 📖 นิยายของ SeerTarot — ข้อมูลเรื่อง (เขียนมือ) · ตัวบทอยู่ที่ `novel-chapters.ts` (สร้างจากสคริปต์)
 * ===========================================================================
 * เจ้าของสั่ง 2026-10-27 "อยากเปิดให้อ่านนิยายสำหรับ seertarot ที่แต่งไว้" · อ่านฟรีทุกบท · ภาษาไทยอย่างเดียว
 * ต้นฉบับ: Google Docs "The Broken Arcana" ➔ `npx tsx scripts/novel-import.ts <ไฟล์.md>` (ตัวบท + ภาค)
 *
 * ตัวละครทุกตัวคือไพ่ในสำรับ Rider-Waite — ภาพประกอบใช้ภาพไพ่ 1909 ของตัวละครนั้น (กฎเหล็ก 5 · 8)
 * ห้ามใช้ภาพตัวละครที่ AI วาด (มีในเอกสารสตอรี่บอร์ดของเจ้าของ แต่ผิดกฎภาพไพ่ของเว็บ)
 */

export const NOVEL = {
  /** ชื่อเรื่องที่เจ้าของตั้ง (2026-10-27) — แก้ที่ `novel-title.ts` ที่เดียว */
  title: NOVEL_TITLE,
  /** คำโปรยสั้นใต้ชื่อเรื่อง (หัวหน้า · meta description หน้ารวม) */
  tagline: "เด็กหนุ่มไร้ชะตากับนักมายากลจอมโกหก ในโลกที่ไพ่ทาโรต์ทุกใบมีชีวิต",
  synopsis: [
    "ในวันสุริยคราสที่ร้อยปีจะมีสักครั้ง เด็กหนุ่มเท้าเปล่าคนหนึ่งร่วงหล่นจากรอยแยกของฟ้าลงกลางพิธีของ The Hierophant เขาไม่มีชื่อ ไม่มีความทรงจำ และไม่มีเส้นด้ายแห่งโชคชะตาผูกอยู่เหมือนคนอื่น",
    "คนเดียวที่ยื่นมือเข้าช่วยคือ The Magician อัจฉริยะเวทน้ำแข็งที่มองเห็นเด็กหนุ่มเป็นแค่อาวุธชิ้นใหม่ การหลบหนีพาทั้งสองผ่านป่าบรรพกาลของ The Empress นครใต้ดินของพวกกบฏ ไปจนถึงหอคอยไร้เสียงของ The High Priestess ที่ซึ่งคำโกหกทุกคำเริ่มมีราคาที่ต้องจ่าย",
  ],
  /** ผู้แต่งที่แสดงบนหน้าและใน JSON-LD */
  author: "SeerTarot",
  publishedAt: "2026-10-27",
  updatedAt: "2026-10-27",
} as const;

/** ไพ่ของตัวละครที่ปรากฏในแต่ละบท — ใบแรกเป็นภาพประจำบท · เรียงตามบทบาทในบทนั้น */
const CHAPTER_CARDS: Record<number, readonly string[]> = {
  1: ["major-00", "major-01", "major-05", "cups-12"],
  2: ["major-01", "major-00", "major-03"],
  3: ["major-01", "major-00"],
  4: ["swords-11", "major-00", "major-01"],
  5: ["major-03", "major-00", "major-01"],
  6: ["major-03", "major-01", "major-00"],
  7: ["wands-12", "major-01", "major-00"],
  8: ["wands-12", "major-00", "major-01"],
  9: ["major-01", "major-00", "major-07"],
  10: ["major-04", "wands-12", "major-01", "major-00"],
  11: ["pentacles-13", "major-01", "major-00"],
  12: ["pentacles-13", "major-01", "major-00"],
  13: ["major-02", "major-00", "major-01"],
  14: ["major-02", "major-00", "major-01"],
  15: ["swords-14", "major-01", "major-00", "major-02"],
  16: ["swords-14", "major-01", "major-00", "major-02"],
  17: ["major-01", "major-00", "swords-14", "major-02"],
  18: ["major-00", "major-01"],
  19: ["major-05", "major-01"],
  20: ["major-04", "wands-12"],
  21: ["major-00", "major-01"],
};

export { NOVEL_PARTS };
export type NovelPart = NovelPartText;

/**
 * คำเตือนเนื้อหารายบท (กฎเหล็ก 6 · Safety Guard) — แสดงก่อนตัวบทพร้อมสายด่วน 1323
 * บทที่ 12 · 17 ตัวละครทำร้ายร่างกายตัวเองเพื่อเวทมนตร์ · บทที่ 18 ยืนริมหน้าผาหลังความสูญเสีย · บทอื่นมีเลือดและการต่อสู้ ซึ่งบอกไว้ที่หน้ารวมแล้ว
 */
const CHAPTER_CONTENT_NOTES: Record<number, string> = {
  12: "บทนี้มีฉากที่ตัวละครทำร้ายร่างกายตัวเองเพื่อแลกกับเวทมนตร์",
  17: "บทนี้มีฉากที่ตัวละครทำร้ายร่างกายตัวเองเพื่อแลกกับเวทมนตร์ และฉากเสียสละชีวิต",
  18: "บทนี้มีฉากความสูญเสีย และตัวละครยืนอยู่ริมหน้าผาในห้วงความเศร้า",
};

/** คำเตือนเนื้อหาทั้งเรื่อง — หน้ารวม */
export const NOVEL_CONTENT_NOTE = "เรื่องนี้เป็นแฟนตาซีโทนมืด มีฉากความรุนแรง เลือด และการบาดเจ็บ";

export interface NovelChapter {
  number: number;
  title: string;
  body: string;
  cards: readonly string[];
  contentNote?: string;
  /** เวลาอ่านโดยประมาณ (นาที) — ภาษาไทยราว 900 ตัวอักษรต่อนาที */
  readingMinutes: number;
}

export const NOVEL_CHAPTERS: readonly NovelChapter[] = NOVEL_CHAPTER_TEXT.map((c) => ({
  ...c,
  cards: CHAPTER_CARDS[c.number] ?? ["major-00"],
  contentNote: CHAPTER_CONTENT_NOTES[c.number],
  readingMinutes: Math.max(1, Math.round(c.body.length / 900)),
}));

export function novelChapterPath(number: number): string {
  return `${NOVEL_PATH}/${number}`;
}

export function getNovelChapter(number: number): NovelChapter | undefined {
  return NOVEL_CHAPTERS.find((c) => c.number === number);
}

/** ย่อหน้าแรกของบท (ตัดเครื่องหมายเน้น) — ใช้ทำคำโปรยใต้ชื่อบทและ meta description */
export function novelChapterLead(chapter: NovelChapter): string {
  const first = chapter.body.split(/\n{2,}/).find((p) => p.replace(/[*\s]/g, "").length > 40) ?? chapter.body;
  return first.replace(/\*+/g, "").replace(/\s+/g, " ").trim();
}

/** ภาคของบทนี้ */
export function novelPartOf(number: number): NovelPart {
  return [...NOVEL_PARTS].reverse().find((p) => number >= p.from) ?? NOVEL_PARTS[0];
}

/** บทในภาคนี้ (เรียงตามเลขบท) */
export function novelPartChapters(part: NovelPart): NovelChapter[] {
  const next = NOVEL_PARTS.find((p) => p.from > part.from);
  return NOVEL_CHAPTERS.filter((c) => c.number >= part.from && (!next || c.number < next.from));
}

/** บทนี้คือบทสุดท้ายของภาคที่จบแล้ว */
export function isNovelPartFinale(chapter: NovelChapter): boolean {
  const part = novelPartOf(chapter.number);
  const chapters = novelPartChapters(part);
  return part.complete && chapters[chapters.length - 1]?.number === chapter.number;
}

/** "ภาคที่ 1: The Awakening" (ไม่มีชื่อภาค = "ภาคที่ 1") */
export function novelPartLabel(part: NovelPart): string {
  return part.title ? `ภาคที่ ${part.number}: ${part.title}` : `ภาคที่ ${part.number}`;
}
