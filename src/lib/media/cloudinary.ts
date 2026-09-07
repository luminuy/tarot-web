/**
 * 🎨 Cloudinary Dynamic Media & OpenGraph Composition Engine
 * -------------------------------------------------------------
 * ทำหน้าที่สร้าง URL สำหรับเจนภาพการ์ดแชร์ผลดวงไดนามิก (OpenGraph / Social Share 1200x630)
 * โดยการซ้อนเลเยอร์ผ่าน Cloudinary URL Transformation:
 *  - ไม่ต้องรัน Satori, Resvg-WASM หรือ Canvas หนักๆ บน Cloudflare Workers
 *  - ตัดภาระ CPU (0ms) และประหยัดหน่วยความจำ (RAM < 1MB)
 *  - หากไม่ได้ตั้งค่า NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ระบบจะคืนค่า null
 *    เพื่อให้แอปถอยไปใช้ระบบ Client Canvas + R2 เดิมอัตโนมัติ (Zero Breaking Change)
 */

export interface CloudinaryShareCardParams {
  title?: string;
  spreadName?: string;
  cardImageNames?: string[]; // เช่น ['major-00.jpg', 'major-01.jpg']
}

export function getCloudinaryCloudName(): string {
  const name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
  return name.trim().replace(/^["']+|["']+$/g, "");
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
 * คืนค่า null หากไม่ได้กำหนด NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 */
export function buildCloudinaryShareImageUrl(params: CloudinaryShareCardParams): string | null {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName) return null;

  const { title = "คำทำนายไพ่ยิปซี", spreadName = "ผังพยากรณ์", cardImageNames = [] } = params;

  // เข้ารหัสข้อความภาษาไทยสำหรับ URL Transformation (แก้บั๊ก OG-01 & OG-06)
  const safeTitle = encodeOverlayText(title, 60);
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
    `l_text:Arial_50_bold:${safeTitle},co_rgb:29261F,g_north_west,x_80,y_190,w_700,c_fit`,
    `l_text:Arial_22:${foot},co_rgb:635B4E,g_south_west,x_80,y_70`,
    "f_auto,q_auto",
  ];

  return `https://res.cloudinary.com/${cloudName}/image/fetch/${transforms.join("/")}/https://seertarot.net/cards/${cleanCard}`;
}


