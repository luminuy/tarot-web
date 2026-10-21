/**
 * 🎨 Cloudinary Dynamic Media & OpenGraph Composition Engine
 * -------------------------------------------------------------
 * ทำหน้าที่สร้าง URL สำหรับเจนภาพการ์ดแชร์ผลดวงไดนามิก (OpenGraph / Social Share 1200x630)
 * โดยการซ้อนเลเยอร์ผ่าน Cloudinary URL Transformation:
 *  - ไม่ต้องรัน Satori, Resvg-WASM หรือ Canvas หนัก ๆ บน Cloudflare Workers
 *  - ตัดภาระ CPU (0ms) และประหยัดหน่วยความจำ (RAM < 1MB)
 *  - cloud name มีค่าเริ่มต้นฝังไว้ที่ `DEFAULT_CLOUDINARY_CLOUD_NAME` (src/lib/config/site.ts)
 *    จึงทำงานได้ทั้งตอน dev, CI และ production โดยไม่ต้องพึ่ง env ที่อาจลืมตั้ง
 *    ตั้ง `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` เพื่อ override ได้ตามเดิม
 */

import { DEFAULT_CLOUDINARY_CLOUD_NAME } from "@/lib/config/site";

export interface CloudinaryShareCardParams {
  title?: string;
  spreadName?: string;
  cardImageNames?: string[]; // เช่น ['major-00.jpg', 'major-01.jpg']
}

function getCloudinaryCloudName(): string {
  const raw = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  const name = raw.trim().replace(/^["']+|["']+$/g, "");
  // ถ้า env ไม่ถูกส่งเข้ามาตอน build (เช่นขั้น verify ใน CI) ให้ใช้ค่าเริ่มต้นที่ฝังไว้
  // แทนการคืนค่าว่างแล้วปล่อยให้ทั้งเว็บถอยไปภาพแชร์ใบเดียวกันเงียบ ๆ
  return name || DEFAULT_CLOUDINARY_CLOUD_NAME;
}

export function isCloudinaryEnabled(): boolean {
  return Boolean(getCloudinaryCloudName());
}

/**
 * ตัดทอนข้อความให้สุภาพ ไม่ขาดกลางคำ และลงท้ายด้วย … หากถูกตัด
 */
export function truncateForOverlay(raw: string, maxChars: number): string {
  const text = raw.trim();
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  // ภาษาไทยไม่เว้นวรรคระหว่างคำ — ถ้าหาช่องว่างที่เหมาะไม่เจอ (>60% ของความยาว) ให้ตัดตรงแล้วเติม …
  const body = lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}

/** ตัวแบ่งคำไทย — มีใน Node 16+ และ Workers (V8) · ถ้าไม่มีถอยไปแบ่งตามช่องว่าง */
const THAI_WORD_SEGMENTER: Intl.Segmenter | null =
  typeof Intl !== "undefined" && typeof Intl.Segmenter === "function" ? new Intl.Segmenter("th", { granularity: "word" }) : null;

/**
 * แบ่งหัวเรื่องเป็นบรรทัดที่ขอบคำ (A7-11) — ภาษาไทยไม่เว้นวรรค ถ้าปล่อยให้ Cloudinary หักบรรทัดเอง
 * (`w_700,c_fit`) มันหักกลางคำแล้วแทรก `-` ปลายบรรทัด · ที่นี่แบ่งเป็นชั้นข้อความแยกบรรทัดละชั้นแทน
 * บรรทัดละไม่เกิน `lineChars` ตัวอักษร · เกิน `maxLines` บรรทัดตัดท้ายที่ขอบคำแล้วเติม …
 */
/**
 * ความกว้างที่มองเห็นโดยประมาณ (หน่วย = อักษรไทยตัวหนึ่ง) — ตัวละตินหนา 50px กว้างกว่าไทยราว 1.25 เท่า
 * (B3-01: หัวเรื่องอังกฤษ 27 ตัวเกิน w_700 แล้ว Cloudinary หักบรรทัดซ้อนจนตัวอักษรทับกัน)
 * ฝั่งไทยนับสระบน/ล่างเป็นหนึ่งตัวเหมือนเดิม (เผื่อที่ไว้ — ไม่เคยล้น)
 */
export function overlayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    if (ch === " ") w += 0.5;
    else if (/[A-Za-z0-9]/.test(ch)) w += 1.25;
    else w += 1;
  }
  return w;
}

/**
 * รวมเครื่องหมายเข้ากับคำข้างเคียงก่อนแบ่งบรรทัด (B3-01) — ตัวแบ่งคำตัด `(` `)` `:` `-` เป็นคำของตัวเอง
 * บรรทัดใหม่จึงขึ้นต้นด้วย ")" โดด ๆ หรือค้าง "(" ท้ายบรรทัด · คำประสม yes-or-no ถูกหักที่ขีด
 */
function glueTokens(tokens: string[]): string[] {
  const out: string[] = [];
  for (const tok of tokens) {
    const last = out[out.length - 1];
    const closes = /^[)\]}:;,.?!…%]/.test(tok);
    const hyphen = tok === "-" || tok === "–";
    if (last !== undefined && (closes || hyphen || /[(\[{\-–]$/.test(last))) {
      out[out.length - 1] = last + tok;
    } else {
      out.push(tok);
    }
  }
  return out;
}

export function splitTitleForOverlay(raw: string, lineChars = 27, maxLines = 2): string[] {
  const text = raw.replace(/\s+/g, " ").trim();
  if (!text) return [];
  const words = glueTokens(
    THAI_WORD_SEGMENTER ? [...THAI_WORD_SEGMENTER.segment(text)].map((x) => x.segment) : text.split(/(?<= )/),
  );
  const lines: string[] = [];
  let line = "";
  let truncated = false;
  for (const word of words) {
    if (overlayWidth((line + word).trimEnd()) <= lineChars) {
      line += word;
      continue;
    }
    if (line.trim()) lines.push(line.trimEnd());
    if (lines.length >= maxLines) {
      truncated = true;
      line = "";
      break;
    }
    // คำเดี่ยวยาวเกินบรรทัด (ไม่มีขอบคำให้หัก) — ตัดตรงเป็นทางสุดท้าย
    line = word.trimStart().length > lineChars ? word.trimStart().slice(0, lineChars) : word.trimStart();
  }
  if (line.trim() && lines.length < maxLines) lines.push(line.trimEnd());
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = `${last.length >= lineChars ? last.slice(0, lineChars - 1) : last}…`;
  }
  return lines.slice(0, maxLines);
}

/**
 * เข้ารหัสข้อความสำหรับ `l_text:` ของ Cloudinary
 *
 * ⚠️ ต้องเข้ารหัส `,` และ `/` **สองชั้น** — Cloudinary ถอด percent-encoding
 * ชั้นแรกออกก่อนแยกพารามิเตอร์ ถ้าส่ง `%2C` ไปตรง ๆ มันจะเห็นเป็นจุลภาคจริง
 * แล้วตอบ HTTP 400 ทั้งใบโดยไม่มีข้อความบอกสาเหตุ
 * (พิสูจน์แล้ว: หัวข้อ "ไพ่ทาโรต์ความรัก, อ่านยังไง?" = 400 · หลังแก้ = 200)
 */
export function encodeOverlayText(raw: string, maxChars: number): string {
  return encodeURIComponent(truncateForOverlay(raw, maxChars))
    .replace(/%2C/g, "%252C")
    .replace(/%2F/g, "%252F");
}

/**
 * สร้าง URL ภาพแชร์ผลทำนายขนาด 1200x630 ผ่าน Cloudinary URL Transformation
 * คืนค่า null เมื่อ cloud name ว่างเท่านั้น (ปัจจุบันมีค่าเริ่มต้นฝังไว้ จึงไม่เกิดในทางปฏิบัติ)
 */
export function buildCloudinaryShareImageUrl(params: CloudinaryShareCardParams): string | null {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName) return null;

  const { title = "คำทำนายไพ่ยิปซี", spreadName = "ผังพยากรณ์", cardImageNames = [] } = params;

  // เข้ารหัสข้อความภาษาไทยสำหรับ URL Transformation (แก้บั๊ก OG-01 & OG-06)
  const titleLines = splitTitleForOverlay(title).map((line) => encodeOverlayText(line, 40));
  const safeSpread = encodeOverlayText(spreadName, 40);
  const brand = encodeURIComponent("SEERTAROT · SANCTUARY");
  const foot = encodeURIComponent("PROVABLY-FAIR SHA-256 · SEERTAROT.NET");

  // เลือกภาพไพ่ 1909 ทางขวา (default: major-19.jpg หรือไพ่ใบแรก)
  const rawCard = cardImageNames[0] || "major-19.jpg";
  const cleanCard = rawCard.replace(/^\/?cards\//, "").replace(/\.webp$/, ".jpg");

  // Transformation Pipeline:
  // 1. ขนาดมาตรฐาน OpenGraph 1200x630 บนพื้นหลังไหมทองพรีเมียม #FAF7F2 โดยวางไพ่ไว้ทางขวา (c_pad,g_east)
  // 2. ปั๊มหัวแบรนด์, ชื่อผัง, และหัวข้อคำทำนายในฝั่งซ้ายที่ว่างเปล่า 100% ไร้การทับซ้อน (แก้บั๊ก M-01)
  // 3. ปรับแต่งคุณภาพและฟอร์แมตอัตโนมัติ (f_auto,q_auto)
  const transforms = [
    "w_1200,h_630,b_rgb:FAF7F2,c_pad,g_east",
    `l_text:Arial_22_bold:${brand},co_rgb:8F5C1A,g_north_west,x_80,y_70`,
    `l_text:Arial_30_bold:${safeSpread},co_rgb:8F5C1A,g_north_west,x_80,y_130`,
    // หัวเรื่องแยกชั้นละบรรทัดที่ขอบคำ (A7-11) · w_700,c_fit เหลือไว้เป็นตาข่ายกันล้นเท่านั้น
    ...titleLines.map((line, i) => `l_text:Arial_50_bold:${line},co_rgb:29261F,g_north_west,x_80,y_${190 + i * 62},w_700,c_fit`),
    `l_text:Arial_22:${foot},co_rgb:635B4E,g_south_west,x_80,y_70`,
    "f_auto,q_auto",
  ];

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms.join("/")}/https://seertarot.net/cards/${cleanCard}`;
}


