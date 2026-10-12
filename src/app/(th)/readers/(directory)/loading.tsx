/*
 * ⚠️ อยู่ในกลุ่ม `(directory)` โดยตั้งใจ — ครอบเฉพาะหน้ารวม `/readers` (ISSUE-056)
 * เดิมวางที่ `readers/loading.tsx` ซึ่งครอบทุกหน้าใต้ `/readers/*` รวมโปรไฟล์ `/readers/[id]`
 * Next จึงเริ่มสตรีม (ส่งสถานะ 200 ไปแล้ว) ก่อนหน้าโปรไฟล์จะรู้ว่าไม่มีแม่หมอคนนี้ ➔ `notFound()` ได้แค่ข้อความ ไม่ได้ 404 จริง
 * ห้ามย้ายกลับขึ้นไประดับ `readers/` — ด่าน test-marketplace-readers 19.10 ตรวจอยู่
 */
export { ReadersLoading as default } from "@/app/_shared/pages/loading-skeletons";
