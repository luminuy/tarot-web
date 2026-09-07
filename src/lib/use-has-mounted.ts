import { useEffect, useState } from "react";

/**
 * true ก็ต่อเมื่อคอมโพเนนต์ mount บนเบราว์เซอร์แล้ว (เรนเดอร์แรกคืน false เสมอ)
 *
 * ทำไมต้องมี — เนื้อหาหลักของหน้าต้องออกมาที่สถานะปลายทางเสมอในเรนเดอร์แรก
 * ไม่งั้นมันถูกส่งออกไปเป็น `opacity:0` (หน้า /blog เคยส่งการ์ดบทความ 24 ใบออกไป
 * แบบมองไม่เห็น) ซึ่งเสียทั้ง LCP และการอ่านของบอทค้นหา และยังไม่ตรงกับฝั่งเบราว์เซอร์
 * ของผู้ใช้ที่เปิด prefers-reduced-motion จนเกิด hydration mismatch (ISSUE-008)
 * ส่วนการ mount รอบถัด ๆ ไป (เปลี่ยนแท็บ/ตัวกรอง) ยังได้อนิเมชันครบเหมือนเดิม
 *
 * ⚠️ อยู่แยกจาก `src/lib/motion.ts` โดยตั้งใจ — ไฟล์นั้น import `motion/react`
 * ที่หัวไฟล์ หน้าไหนที่ต้องการแค่ hook นี้จึงไม่ต้องแบก 39.8 KB ไปด้วย
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);
  return hasMounted;
}
