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
 * สร้าง URL ภาพแชร์ผลทำนายขนาด 1200x630 ผ่าน Cloudinary URL Transformation
 * คืนค่า null หากไม่ได้กำหนด NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
 */
export function buildCloudinaryShareImageUrl(params: CloudinaryShareCardParams): string | null {
  const cloudName = getCloudinaryCloudName();
  if (!cloudName) return null;

  const { title = "คำทำนายไพ่ยิปซี", spreadName = "ผังพยากรณ์" } = params;

  // เข้ารหัสข้อความภาษาไทยสำหรับ URL Transformation
  const safeTitle = encodeURIComponent(title.slice(0, 60));
  const safeSpread = encodeURIComponent(spreadName.slice(0, 40));

  // Transformation Pipeline:
  // 1. ขนาดมาตรฐาน OpenGraph 1200x630 พร้อมพื้นหลังโทนไหมทองพรีเมียม
  // 2. ปั๊มข้อความหัวข้อและชื่อผัง
  // 3. ปรับแต่งคุณภาพอัตโนมัติ (f_auto,q_auto)
  const transforms = [
    "w_1200,h_630,c_fill,b_rgb:FAF7F2",
    `l_text:Arial_28_bold:${safeSpread},co_rgb:8F5C1A,g_north_west,x_80,y_80`,
    `l_text:Arial_42_bold:${safeTitle},co_rgb:29261F,g_north_west,x_80,y_130`,
    "f_auto,q_auto",
  ];

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join("/")}/seertarot/og-base.png`;
}
