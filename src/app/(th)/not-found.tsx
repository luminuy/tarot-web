import type { Metadata } from "next";

import { NotFoundBody, notFoundMetadata } from "../_shared/pages/not-found";

/**
 * หน้า 404 ของต้นไม้ไทย — ใช้ตอน `notFound()` ถูกเรียกจากหน้าในกลุ่มนี้
 * (เช่น `/cards/<ไอดีที่ไม่มีจริง>` หรือ `/blog/<สลักที่ไม่มีจริง>`)
 *
 * URL ที่ไม่ตรงกับ route ไหนเลยจะไปที่ `src/app/not-found.tsx` แทน (คนละไฟล์ เนื้อเดียวกัน)
 * เหตุผลเต็มอยู่ใน `src/app/_shared/pages/not-found.tsx`
 */
export const metadata: Metadata = notFoundMetadata;

export default function NotFound() {
  return <NotFoundBody />;
}
