"use client";

/**
 * ช่องทางเดียวสำหรับ "ขอเปิดหน้าต่างสิทธิ์" จากคอมโพเนนต์ที่อยู่ลึก
 * ------------------------------------------------------------------
 * ก่อนหน้านี้แต่ละจุดเรียก `window.dispatchEvent(new Event("tarot:open-auth"))` เอง
 * ทำให้ทุกกำแพงสิทธิ์เด้งหน้าต่างเข้าสู่ระบบเหมือนกันหมด ไม่รู้ว่าผู้ใช้ติดเพราะอะไร
 * ตัวนี้พก "เหตุผล" ไปด้วย หน้า flow หลักจึงเลือกถ้อยคำและปุ่มให้ตรงสถานการณ์ได้
 */

import type { UpgradeReason } from "@/lib/entitlement/copy";

const EVENT_NAME = "tarot:upgrade";

/** เปิดหน้าต่างสิทธิ์พร้อมเหตุผล (เรียกจากคอมโพเนนต์ไหนก็ได้) */
export function requestUpgrade(reason: UpgradeReason): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<UpgradeReason>(EVENT_NAME, { detail: reason }));
}

/** ให้หน้า flow หลักรับฟัง — คืนฟังก์ชันยกเลิกการฟัง */
export function onUpgradeRequest(handler: (reason: UpgradeReason) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (e: Event) => {
    const reason = (e as CustomEvent<UpgradeReason>).detail;
    handler(reason ?? "explore");
  };
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
