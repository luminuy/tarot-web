/**
 * ค่าคงที่ฝั่งแสดงผลของคำอ่าน — แยกออกจาก reading.ts เพราะไฟล์นั้น import zod
 * และสร้าง z.object() ระดับโมดูล (มี side effect ตัดทิ้งไม่ได้)
 * คอมโพเนนต์ฝั่งเบราว์เซอร์ import ค่าจาก reading.ts เมื่อไหร่ = ลาก zod ~21 KB gzip ติดไปด้วย
 * กติกา: ฝั่ง UI import ค่าจากไฟล์นี้ และใช้ `import type` กับ reading.ts เท่านั้น
 */

/**
 * คำฟันธงสำหรับ "แสดงผล" ฝั่งอังกฤษ — ค่าที่เก็บใน schema เป็นไทยเสมอ
 * เดิม UI พิมพ์ค่าดิบออกไปตรง ๆ ผู้ใช้หน้าอังกฤษจึงเห็น "Answer: ใช่"
 */
export const YES_NO_DISPLAY_EN: Record<string, string> = {
  ใช่: "Yes",
  ไม่ใช่: "No",
  ยังไม่แน่: "Not yet certain",
};
