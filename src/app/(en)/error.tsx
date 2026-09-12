"use client";

/*
 * ⚠️ ทั้งสองกลุ่มเส้นทางต้องมีไฟล์นี้เสมอ — Next.js ผูก error boundary กับ
 * "ตำแหน่งไฟล์ในต้นไม้เส้นทาง" ไม่ใช่กับคอมโพเนนต์ ถ้ากลุ่มไหนไม่มี
 * error ของกลุ่มนั้นจะตกไปที่ global-error ซึ่งเป็นหน้าเปล่าไม่มีทางไปต่อ
 */
export { SharedErrorBoundary as default } from "@/app/_shared/pages/error-boundary";
