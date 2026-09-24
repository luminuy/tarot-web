/**
 * ✦ ดวงรายวัน 12 ราศี + ไพ่ประจำฤดูราศี (ช่วงที่ดวงอาทิตย์อยู่ในราศีหนึ่ง ≈ 1 เดือน)
 * ===========================================================================
 * ใช้สูตรเดียวกับ "ไพ่ประจำวันของทุกคน" (`daily-card.ts`) — คำนวณซ้ำได้และตรวจสอบเองได้:
 *
 *   ไพ่รายวันของราศี   = SHA-256("seertarot-zodiac-daily-v1:<ราศี>:<YYYY-MM-DD>")  ➔ uint32 mod 78
 *   ไพ่ประจำฤดูราศี    = SHA-256("seertarot-sun-season-v1:<ราศี>:<ปีที่ฤดูเริ่ม>")    ➔ uint32 mod 78
 *
 * ทุกคนในราศีเดียวกันเห็นไพ่ใบเดียวกันทั้งวัน (ทั้งฤดู) — ไม่ใช่การเปิดไพ่ส่วนตัว จึงไม่กินโควตา
 * วันที่อ่านจากนาฬิกาเซิร์ฟเวอร์ (เวลาไทย) เท่านั้น ไม่รับจากไคลเอนต์ (ไม่งั้นเลื่อนวันหาไพ่ที่ชอบได้)
 *
 * 🃏 กฎข้อ 14: ดัชนีไพ่ผิดช่วง = โยน error ให้เส้นทางตอบ 500 · ห้ามหยิบไพ่ใบอื่นมาแทน
 * ⚠️ ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น (ดึงสำรับเต็มพร้อมความหมาย)
 */

import { cardByIndex, DECK } from "@/data/cards";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { ZODIAC_SIGNS, type MonthDay } from "@/data/zodiac";
import { decanRanges, findThaiZodiacByDate, findZodiacByDate, thaiRanges } from "@/lib/tarot/zodiac";

const DAILY_SALT = "seertarot-zodiac-daily-v1";
const SEASON_SALT = "seertarot-sun-season-v1";

export interface ZodiacDayCard {
  sign: string;
  cardId: string;
  cardIndex: number;
  nameTh: string;
  nameEn: string;
  image: string;
  keywords: string[];
  keywordsEn: string[];
  message: string;
  messageEn: string;
  /** SHA-256 hex เต็มของสตริงเมล็ด — ผู้ใช้คำนวณซ้ำเองได้ */
  proof: string;
}

export interface SunSeason {
  /** ราศีสากลที่ดวงอาทิตย์อยู่วันนี้ */
  tropical: string;
  /** ราศีไทย (สุริยยาตร์) ที่ดวงอาทิตย์อยู่วันนี้ */
  thai: string;
  /** ราศีสากลถัดไป + วันที่ดวงอาทิตย์ย้ายเข้า */
  nextTropical: { sign: string; start: MonthDay };
  nextThai: { sign: string; start: MonthDay };
  /** ไพ่ประจำฤดูราศีสากลนี้ (ทั้งฤดูเห็นใบเดียวกัน) */
  card: ZodiacDayCard;
}

export interface ZodiacDaily {
  dateKey: string;
  signs: ZodiacDayCard[];
  season: SunSeason;
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function trim(text: string | undefined, max = 170): string {
  const clean = (text ?? "").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

async function cardFromSeed(sign: string, seed: string): Promise<ZodiacDayCard> {
  const proof = await sha256Hex(seed);
  const cardIndex = (parseInt(proof.slice(0, 8), 16) >>> 0) % DECK.length;
  const card = cardByIndex(cardIndex);
  if (!card) throw new Error(`zodiac-daily: ดัชนีไพ่ผิดช่วง ${cardIndex}`);
  return {
    sign,
    cardId: card.id,
    cardIndex,
    nameTh: card.nameTh,
    nameEn: card.nameEn,
    image: card.image,
    keywords: card.keywords.upright.slice(0, 3),
    keywordsEn: CARD_KEYWORDS_EN[card.id]?.upright.slice(0, 3) ?? [],
    message: trim(card.meanings.general.upright),
    messageEn: trim(card.meaningsEn?.general?.upright),
    proof,
  };
}

function parseDayKey(dateKey: string): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) throw new Error(`zodiac-daily: dateKey ผิดรูปแบบ "${dateKey}"`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** ราศีถัดไปตามลำดับจักรราศี */
function nextSignId(id: string): string {
  const i = ZODIAC_SIGNS.findIndex((s) => s.id === id);
  return ZODIAC_SIGNS[(i + 1) % 12].id;
}

/** ดวงรายวันทั้ง 12 ราศี + ฤดูราศีของวันนั้น (บริสุทธิ์ ไม่แตะ I/O) */
export async function computeZodiacDaily(dateKey: string): Promise<ZodiacDaily> {
  const { year, month, day } = parseDayKey(dateKey);
  const signs = await Promise.all(
    ZODIAC_SIGNS.map((s) => cardFromSeed(s.id, `${DAILY_SALT}:${s.id}:${dateKey}`)),
  );

  const tropical = findZodiacByDate(ZODIAC_SIGNS, month, day)?.sign;
  const thai = findThaiZodiacByDate(ZODIAC_SIGNS, month, day);
  if (!tropical || !thai) throw new Error(`zodiac-daily: หาราศีของวัน ${dateKey} ไม่เจอ`);

  const nextTropicalId = nextSignId(tropical.id);
  const nextThaiId = nextSignId(thai.id);
  const tropicalStart = decanRanges(ZODIAC_SIGNS).get(tropical.id)?.[0]?.start;
  /* ฤดูมังกรเริ่ม 22 ธ.ค. — วันที่ 1–19 ม.ค. ยังเป็นฤดูที่เริ่มปีก่อน ต้องใช้ปีที่ฤดูเริ่มเป็นเมล็ด
     ไม่งั้นไพ่ประจำฤดูจะเปลี่ยนกลางฤดูตอนข้ามปีใหม่ */
  const seasonYear = tropicalStart && tropicalStart.month > month ? year - 1 : year;
  const seasonCard = await cardFromSeed(tropical.id, `${SEASON_SALT}:${tropical.id}:${seasonYear}`);

  return {
    dateKey,
    signs,
    season: {
      tropical: tropical.id,
      thai: thai.id,
      nextTropical: { sign: nextTropicalId, start: decanRanges(ZODIAC_SIGNS).get(nextTropicalId)![0].start },
      nextThai: { sign: nextThaiId, start: thaiRanges(ZODIAC_SIGNS).get(nextThaiId)!.start },
      card: seasonCard,
    },
  };
}
