/**
 * ✦ การ์ดภาพสำหรับแชร์ลงโซเชียล (สตอรี่ 1080×1920 · โพสต์ 1080×1350)
 * ===========================================================================
 * ออกแบบใหม่ 2026-09-24 (เจ้าของ: "ออกแบบการ์ดที่จะแชร์ไปสื่อโซเชียลให้สวย ๆ หน่อย")
 * ของเดิมมีปัญหา 4 ข้อที่เห็นในภาพจริง — ทุกข้อมีกันซ้ำอยู่ในไฟล์นี้:
 *
 *   1. ข้อความเยื้องไปครึ่งขวา — พึ่ง `ctx.textAlign = "center"` ซึ่งบางเบราว์เซอร์/บางจังหวะไม่ได้ผล
 *      ➔ วัดความกว้างเองแล้ววางจาก x ซ้ายเสมอ (`drawCentered`) ไม่พึ่ง textAlign เลย
 *   2. ตัดคำไทยกลางคำ ("เปิดทา / ง ใหม่") — เดิมแยกทีละตัวอักษร
 *      ➔ ตัดตามคำด้วย `Intl.Segmenter("th")` (ไม่มี = ตัดตามกลุ่มอักขระ ไม่หั่นสระ/วรรณยุกต์)
 *   3. กล่องคำทำนายสูงถึงก้นภาพ ว่างครึ่งภาพ — เดิมให้กล่องยืดไปถึงขอบล่าง
 *      ➔ วัดความสูงเนื้อหาจริงก่อน แล้ววางกลุ่มกลางภาพให้อยู่กึ่งกลางช่องว่าง
 *   4. ฟอนต์ไม่ตรงกับเว็บ — เดิมเรียก "Noto Sans Thai" ซึ่งเว็บไม่ได้โหลด (เว็บตั้งชื่อ `notoSerifThai` / `sarabun`)
 *      ➔ ใช้ชื่อที่ประกาศใน globals.css และรอ `document.fonts.load` ก่อนวาด
 *
 * 🃏 กฎข้อ 14: ไพ่ที่ไม่มีภาพ = วาดกรอบเปล่า ห้ามหยิบภาพไพ่ใบอื่นมาแทน
 */

import { getCardImageSrc } from "@/lib/tarot/card-image";
import { fitTextToWidth } from "@/lib/text/thai-truncate";

export interface ShareCardItem {
  image?: string;
  id?: string;
  name: string;
  subName?: string;
  position: string;
  isReversed: boolean;
}

export interface ShareCardInput {
  format: "story" | "post";
  isEnglish: boolean;
  spreadName: string;
  question: string;
  personaName: string;
  summary: string;
  cards: ShareCardItem[];
}

const W = 1080;
const SERIF = "notoSerifThai";
const SANS = "sarabun";

const C = {
  bgTop: "#2A1E16",
  bgBottom: "#120D0A",
  gold: "#D2A354",
  goldSoft: "rgba(210, 163, 84, 0.55)",
  goldFaint: "rgba(210, 163, 84, 0.22)",
  cream: "#F6EAD7",
  creamSoft: "rgba(246, 234, 215, 0.72)",
  up: "#8FCB9A",
  rev: "#E8A197",
};

type Ctx = CanvasRenderingContext2D;

function font(ctx: Ctx, weight: number, size: number, family: string) {
  ctx.font = `${weight} ${size}px ${family}, ${family === SERIF ? '"Noto Serif Thai", serif' : '"Sarabun", sans-serif'}`;
}

/** วางข้อความกึ่งกลางที่ cx โดยวัดความกว้างเอง (ไม่พึ่ง textAlign — ดูข้อ 1 หัวไฟล์) */
function drawCentered(ctx: Ctx, text: string, cx: number, y: number) {
  ctx.textAlign = "left";
  ctx.fillText(text, Math.round(cx - ctx.measureText(text).width / 2), y);
}

/** แยกข้อความเป็นหน่วยที่ตัดบรรทัดได้ — ไทยตามคำ อังกฤษตามช่องว่าง */
function segments(text: string): string[] {
  try {
    const seg = new Intl.Segmenter("th", { granularity: "word" });
    return Array.from(seg.segment(text), (s) => s.segment);
  } catch {
    return Array.from(text);
  }
}

/** ตัดบรรทัดให้พอดีความกว้าง · เกิน maxLines = ตัดท้ายด้วย "…" */
function wrap(ctx: Ctx, text: string, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const part of segments(text.replace(/\s+/g, " ").trim())) {
    const test = line + part;
    if (ctx.measureText(test).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = part.trimStart();
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line.trim()) lines.push(line.trim());
  const consumed = lines.join("").replace(/\s/g, "").length;
  if (consumed < text.replace(/\s/g, "").length && lines.length) {
    // ข้อความยังเหลือ ➔ ต่อ "…" ท้ายบรรทัดสุดท้าย · ยาวเกินก็ย่อแบบไม่หั่นคลัสเตอร์ไทย (INC-0213)
    const withDots = `${lines[lines.length - 1]}…`;
    lines[lines.length - 1] =
      ctx.measureText(withDots).width <= maxWidth
        ? withDots
        : fitTextToWidth(withDots, (s) => ctx.measureText(s).width, maxWidth);
  }
  return lines;
}

/** ย่อให้พอดีบรรทัดเดียว — วัดความกว้างจริง ไม่หั่นคลัสเตอร์ไทย (INC-0213) */
function fit(ctx: Ctx, text: string, maxWidth: number): string {
  return fitTextToWidth(text, (s) => ctx.measureText(s).width, maxWidth);
}

function loadImage(src: string | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadCardImage(card: ShareCardItem): Promise<HTMLImageElement | null> {
  const first = await loadImage(getCardImageSrc(card.image, card.id) ?? undefined);
  if (first) return first;
  // CDN ล่ม ➔ ภาพไฟล์เดียวกันจากเครื่องเรา (ไม่ใช่ไพ่ใบอื่น)
  return loadImage(getCardImageSrc(card.image, card.id, { forceLocal: true }) ?? undefined);
}

async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    [`700 40px ${SERIF}`, `400 40px ${SERIF}`, `600 30px ${SANS}`, `400 30px ${SANS}`].map((f) =>
      document.fonts.load(f, "ดูดวงไพ่ทาโรต์ Tarot").catch(() => []),
    ),
  );
}

function drawBackground(ctx: Ctx, H: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, C.bgTop);
  bg.addColorStop(1, C.bgBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // แสงทองนุ่ม ๆ หลังไพ่
  const glow = ctx.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.42, W * 0.8);
  glow.addColorStop(0, "rgba(210, 163, 84, 0.30)");
  glow.addColorStop(0.55, "rgba(210, 163, 84, 0.08)");
  glow.addColorStop(1, "rgba(210, 163, 84, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // กรอบทองสองชั้น
  ctx.strokeStyle = C.goldSoft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 40, W - 80, H - 80, 28);
  ctx.stroke();
  ctx.strokeStyle = C.goldFaint;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(54, 54, W - 108, H - 108, 20);
  ctx.stroke();
}

function drawDivider(ctx: Ctx, y: number, half = 150) {
  const g = ctx.createLinearGradient(W / 2 - half, 0, W / 2 + half, 0);
  g.addColorStop(0, "rgba(210,163,84,0)");
  g.addColorStop(0.5, C.gold);
  g.addColorStop(1, "rgba(210,163,84,0)");
  ctx.strokeStyle = g;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(W / 2 - half, y);
  ctx.lineTo(W / 2 + half, y);
  ctx.stroke();
  ctx.fillStyle = C.gold;
  font(ctx, 400, 22, SERIF);
  drawCentered(ctx, "✦", W / 2, y + 8);
}

function drawPill(ctx: Ctx, text: string, cx: number, y: number, color: string, size: number) {
  font(ctx, 600, size, SANS);
  const w = ctx.measureText(text).width + size * 1.4;
  const h = size * 1.75;
  ctx.fillStyle = "rgba(246, 234, 215, 0.08)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = color;
  drawCentered(ctx, text, cx, y + size * 0.36);
}

function drawCard(ctx: Ctx, img: HTMLImageElement | null, x: number, y: number, w: number, h: number, reversed: boolean) {
  const r = Math.round(w * 0.06);
  ctx.save();
  ctx.shadowColor = "rgba(210, 163, 84, 0.45)";
  ctx.shadowBlur = 50;
  ctx.fillStyle = "#1C1510";
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
  ctx.restore();

  if (img) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
    if (reversed) {
      ctx.translate(x + w / 2, y + h / 2);
      ctx.rotate(Math.PI);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
    } else {
      ctx.drawImage(img, x, y, w, h);
    }
    ctx.restore();
  }

  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.stroke();
}

export async function renderShareCard(input: ShareCardInput): Promise<Blob> {
  const H = input.format === "story" ? 1920 : 1350;
  const story = input.format === "story";
  const t = input.isEnglish
    ? {
        tagline: "1909 Rider-Waite Tarot · AI Oracle",
        upright: "Upright",
        reversed: "Reversed",
        from: `Message from ${input.personaName}`,
        cta: "Draw your free card at seertarot.net",
        fair: "Provably-Fair SHA-256",
      }
    : {
        tagline: "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ 1909 Rider-Waite",
        upright: "หัวตั้ง",
        reversed: "กลับหัว",
        from: `สารจาก${input.personaName}`, // ชื่อแม่หมอขึ้นต้นด้วย "แม่หมอ"/"อาจารย์" อยู่แล้ว
        cta: "เปิดไพ่ฟรีที่ seertarot.net",
        fair: "สุ่มโปร่งใส Provably-Fair SHA-256",
      };

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.textBaseline = "alphabetic";

  const cards = input.cards.slice(0, 5);
  const [images] = await Promise.all([Promise.all(cards.map(loadCardImage)), ensureFonts()]);

  drawBackground(ctx, H);

  /* ── หัวภาพ: แบรนด์ ➔ คำโปรย ➔ ผัง ➔ คำถาม ─────────────────────────── */
  let y = story ? 150 : 118;
  ctx.fillStyle = C.gold;
  font(ctx, 700, story ? 34 : 30, SERIF);
  drawCentered(ctx, "S E E R T A R O T", W / 2, y);
  y += story ? 46 : 40;
  ctx.fillStyle = C.creamSoft;
  font(ctx, 400, story ? 26 : 23, SANS);
  drawCentered(ctx, t.tagline, W / 2, y);

  y += story ? 58 : 44;
  drawPill(ctx, fit(ctx, input.spreadName, 700), W / 2, y, C.gold, story ? 24 : 22);

  const question = input.question.trim();
  if (question) {
    y += story ? 92 : 74;
    ctx.fillStyle = C.cream;
    font(ctx, 700, story ? 50 : 42, SERIF);
    const qLines = wrap(ctx, `“${question}”`, W - 220, 2);
    for (const line of qLines) {
      drawCentered(ctx, line, W / 2, y);
      y += story ? 66 : 56;
    }
    y -= story ? 66 : 56;
  }
  const headerBottom = y + (story ? 40 : 30);

  /* ── ท้ายภาพ: ชวนเปิดไพ่ + ความโปร่งใส ───────────────────────────── */
  const footerTop = H - (story ? 190 : 176);
  drawDivider(ctx, footerTop + 12);
  ctx.fillStyle = C.cream;
  font(ctx, 600, story ? 34 : 30, SANS);
  drawCentered(ctx, t.cta, W / 2, footerTop + (story ? 76 : 66));
  ctx.fillStyle = C.goldSoft;
  font(ctx, 400, story ? 22 : 20, SANS);
  drawCentered(ctx, t.fair, W / 2, footerTop + (story ? 116 : 100));

  /* ── กลางภาพ: ไพ่ + ชื่อไพ่ + คำทำนาย — วัดก่อน แล้ววางกลางช่องว่าง ───── */
  const n = Math.max(cards.length, 1);
  const single = cards.length === 1;
  const gap = n > 3 ? 20 : 30;
  const maxRow = W - 200;
  let cardW = single ? (story ? 400 : 300) : Math.min(story ? 280 : 220, (maxRow - gap * (n - 1)) / n);
  cardW = Math.round(cardW);
  const cardH = Math.round(cardW * 1.72);
  const labelBlock = single ? (story ? 176 : 146) : 96;

  font(ctx, 400, story ? 36 : 31, SERIF);
  const summaryLineH = story ? 56 : 48;
  const summary = input.summary.trim();
  const available = footerTop - headerBottom - 40;
  const fixedMid = cardH + labelBlock + (summary ? (story ? 140 : 118) : 0);
  const maxSummaryLines = summary ? Math.max(2, Math.min(story ? 6 : 4, Math.floor((available - fixedMid) / summaryLineH))) : 0;
  const summaryLines = summary ? wrap(ctx, summary, W - 240, maxSummaryLines) : [];
  const midHeight = cardH + labelBlock + (summary ? (story ? 140 : 118) + summaryLines.length * summaryLineH : 0);
  let my = headerBottom + Math.max(20, (available - midHeight) / 2);

  // ไพ่
  const rowW = n * cardW + (n - 1) * gap;
  const startX = (W - rowW) / 2;
  cards.forEach((card, i) => {
    const cx = startX + i * (cardW + gap);
    drawCard(ctx, images[i], cx, my, cardW, cardH, card.isReversed);
  });
  my += cardH;

  // ชื่อไพ่ใต้ไพ่
  if (single) {
    const card = cards[0];
    ctx.fillStyle = C.cream;
    font(ctx, 700, story ? 52 : 44, SERIF);
    drawCentered(ctx, fit(ctx, card.name, W - 200), W / 2, my + (story ? 72 : 62));
    const sub = [card.subName, card.position].filter(Boolean).join(" · ");
    if (sub) {
      ctx.fillStyle = C.gold;
      font(ctx, 400, story ? 26 : 23, SANS);
      drawCentered(ctx, fit(ctx, sub, W - 240), W / 2, my + (story ? 112 : 96));
    }
    drawPill(ctx, card.isReversed ? t.reversed : t.upright, W / 2, my + (story ? 156 : 130), card.isReversed ? C.rev : C.up, story ? 20 : 18);
  } else {
    cards.forEach((card, i) => {
      const cx = startX + i * (cardW + gap) + cardW / 2;
      ctx.fillStyle = C.cream;
      font(ctx, 700, n > 3 ? 22 : 26, SERIF);
      drawCentered(ctx, fit(ctx, card.name, cardW + gap - 8), cx, my + 40);
      ctx.fillStyle = card.isReversed ? C.rev : C.gold;
      font(ctx, 400, n > 3 ? 18 : 20, SANS);
      const label = card.isReversed ? `${card.position} · ${t.reversed}` : card.position;
      drawCentered(ctx, fit(ctx, label, cardW + gap - 8), cx, my + 70);
    });
  }
  my += labelBlock;

  // คำทำนาย
  if (summaryLines.length) {
    drawDivider(ctx, my + 40, 110);
    ctx.fillStyle = C.gold;
    font(ctx, 600, story ? 26 : 23, SANS);
    drawCentered(ctx, fit(ctx, t.from, W - 240), W / 2, my + (story ? 104 : 90));
    ctx.fillStyle = C.cream;
    font(ctx, 400, story ? 36 : 31, SERIF);
    let ly = my + (story ? 104 : 90) + summaryLineH + 6;
    for (const line of summaryLines) {
      drawCentered(ctx, line, W / 2, ly);
      ly += summaryLineH;
    }
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas to Blob failed"))), "image/png");
  });
}
