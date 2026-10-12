/**
 * 🔑 อายุลิงก์เข้าแผงแม่หมอ (ISSUE-058 · CONSULT_FLOW_UX_PLAN ข้อ 3.5 — เจ้าของสั่ง 2026-10-12 "ทำให้หมดเลย")
 * ---------------------------------------------------------------------------
 * เดิมตายตัว 24 ชม. แม่หมอต้องขอลิงก์ใหม่จากแอดมินทุกวัน ➔ แอดมินเลือกได้ 1 · 7 · 30 วัน (ค่าเริ่มต้น 30 วัน)
 * คู่กับปุ่ม "ยกเลิกลิงก์เก่าทั้งหมด" (หมุน `readers.session_secret`) — ลิงก์อายุยาวปลอดภัยได้เพราะยกเลิกได้ทันที
 *
 * ⚠️ ไฟล์นี้ห้าม import ฐานข้อมูล — หน้าแอดมิน (ฝั่งเบราว์เซอร์) ใช้ร่วมกับ API
 */

export const CONSOLE_LINK_DAYS = [1, 7, 30] as const;
export type ConsoleLinkDays = (typeof CONSOLE_LINK_DAYS)[number];
export const DEFAULT_CONSOLE_LINK_DAYS: ConsoleLinkDays = 30;

/** ค่าที่ไม่อยู่ในตัวเลือก (พิมพ์ผิด/แก้ URL เอง) ➔ ค่าเริ่มต้น — ห้ามออกลิงก์อายุเกิน 30 วัน */
export function normalizeConsoleLinkDays(value: unknown): ConsoleLinkDays {
  const n = typeof value === "string" ? Number(value) : value;
  return (CONSOLE_LINK_DAYS as readonly unknown[]).includes(n) ? (n as ConsoleLinkDays) : DEFAULT_CONSOLE_LINK_DAYS;
}

/** "1 วัน" · "7 วัน" · "30 วัน" */
export function consoleLinkDaysLabel(days: ConsoleLinkDays): string {
  return `${days} วัน`;
}
