"use client";

import { useState } from "react";
import { deleteAllData } from "@/lib/account/delete-all-data";
import { useLocale } from "@/lib/i18n";

/**
 * 🗑️ ปุ่มลบข้อมูลและบัญชีทั้งหมดตาม PDPA
 * ---------------------------------------------------------------------------
 * ปุ่มเดียวกันนี้ถูกใช้สองแบบโดยตั้งใจ:
 *
 *   • `/account` — อยู่ใน island ที่ hydrate จริง ปุ่มทำงานด้วย `onClick` ข้างล่างนี้
 *   • `/privacy` · `/en/privacy` — เรนเดอร์เป็น HTML ล้วน **ไม่ hydrate** แล้วให้
 *     `astro/scripts/delete-all-data.ts` (สคริปต์ 20 บรรทัด) ผูกพฤติกรรมให้แทน
 *     จึงไม่ต้องลาก React 184 KB ลงหน้านโยบายเพื่อปุ่มปุ่มเดียว
 *
 * ⚠️ แอตทริบิวต์ `data-delete-all-data` · `data-label-idle` · `data-label-busy`
 *    คือสัญญากับสคริปต์ตัวนั้น **ห้ามถอดออกหรือเปลี่ยนชื่อโดยไม่แก้สคริปต์ด้วย**
 * ⚠️ ตรรกะการลบอยู่ที่ `@/lib/account/delete-all-data` ที่เดียว ห้ามคัดลอกมาไว้ที่นี่
 */
export function DeleteAllDataButton() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const [loading, setLoading] = useState(false);

  const labelIdle = isEn ? "Delete All Data & Account" : "ลบข้อมูลและบัญชีทั้งหมด";
  const labelBusy = isEn ? "Deleting data..." : "กำลังลบข้อมูล...";

  const handleDelete = async () => {
    setLoading(true);
    // ผู้ใช้กดยกเลิกตอนถามยืนยัน → คืนปุ่มให้กดได้เหมือนเดิม
    const proceeded = await deleteAllData(isEn);
    if (!proceeded) setLoading(false);
  };

  /*
   * ⚠️ ของเดิมเป็น `bg-err/80` + `text-err` = ตัวอักษรแดงบนพื้นแดง (คอนทราสต์ ~1.2:1)
   * ปุ่มลบข้อมูลถาวรเป็นปุ่มที่ต้อง "อ่านออกที่สุด" ในหน้า ไม่ใช่อ่านยากที่สุด
   * พื้นอ่อน + ตัวอักษรแดงเข้ม ผ่าน AA และยังอ่านเป็นปุ่มอันตรายชัดเจน
   */
  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      data-delete-all-data=""
      data-locale={isEn ? "en" : "th"}
      data-label-idle={labelIdle}
      data-label-busy={labelBusy}
      className="tap-overlay-y px-5 py-2.5 rounded-full bg-err-wash border border-err/40 text-err text-xs font-bold hover:bg-err hover:text-surface hover:border-err transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-err"
    >
      <span data-delete-all-data-label>{loading ? labelBusy : labelIdle}</span>
    </button>
  );
}
