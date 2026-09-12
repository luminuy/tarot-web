"use client";

import { useLocale } from "@/lib/i18n";

/**
 * ⏭️ ลิงก์ข้ามไปเนื้อหาหลัก (Skip Link — WCAG 2.1 · SC 2.4.1 Bypass Blocks)
 * ---------------------------------------------------------------------------
 * หัวเว็บของเรามีจุดที่กด Tab ได้ 11 จุด (โลโก้ · สลับภาษา 2 · เข้าสู่ระบบ · เมนู
 * แล้วยังมีลิงก์ในแผงเมนูอีก 8 รายการ) ก่อนหน้านี้ผู้ใช้คีย์บอร์ดและ screen reader
 * ต้องไล่ผ่านทั้งหมดนั้น **ใหม่ทุกครั้งที่เปลี่ยนหน้า** กว่าจะถึงเนื้อหาจริง
 *
 * ⚠️ ต้องเป็น element แรกสุดใน <body> เสมอ — ถ้าไปอยู่หลัง element ที่โฟกัสได้
 * ตัวใดตัวหนึ่ง มันจะไม่ใช่ "ทางลัด" อีกต่อไป (ผู้ใช้ต้องกด Tab ผ่านตัวนั้นก่อนอยู่ดี)
 *
 * ⚠️ ห้ามใช้ `display: none` / `visibility: hidden` ซ่อน — เบราว์เซอร์จะไม่ให้โฟกัส
 * `sr-only` ของ Tailwind ใช้เทคนิค clip 1×1px ซึ่งยังโฟกัสได้ จึงเป็นวิธีเดียวที่ถูก
 * พอโฟกัสแล้ว `focus:not-sr-only` คืนค่าทั้งหมดกลับมาให้มองเห็นจริง
 *
 * ⚠️ ปลายทาง `#main-content` ต้องมี `tabIndex={-1}` ด้วย ไม่งั้นเบราว์เซอร์จะเลื่อนหน้า
 * ไปเฉย ๆ แต่ "โฟกัส" ยังค้างอยู่ที่ลิงก์ กด Tab ต่อก็เด้งกลับไปหัวเว็บเหมือนเดิม
 * (อาการนี้คือกับดักคลาสสิกของ skip link ที่ทำครึ่ง ๆ กลาง ๆ)
 *
 * z-index ต้องสูงกว่าหัวเว็บ (z-50) ไม่งั้นตอนโฟกัสจะโผล่มาใต้หัวเว็บจนมองไม่เห็น
 */
export function SkipToContent() {
  const { isEnglish } = useLocale();

  return (
    <a
      href="#main-content"
      data-floating=""
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-lg focus:border focus:border-gold focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-serif-th focus:font-bold focus:text-ink focus:shadow-overlay"
    >
      {isEnglish ? "Skip to main content" : "ข้ามไปยังเนื้อหาหลัก"}
    </a>
  );
}
