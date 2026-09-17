"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";

export function DeleteAllDataButton() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmMessage = isEn
      ? "Confirm permanent deletion of all data?\n\nThis action will delete:\n• All reading history (both local and cloud)\n• User account details and personal reflection notes\n• All preferences and settings\n\nThis action cannot be undone."
      : "ยืนยันการลบข้อมูลทั้งหมด?\n\nการดำเนินการนี้จะลบ:\n• ประวัติการเปิดไพ่ทั้งหมด (ทั้งในเครื่องและบนบัญชี)\n• ข้อมูลบัญชีผู้ใช้และบันทึกส่วนตัว\n• การตั้งค่าทั้งหมด\n\nข้อมูลจะไม่สามารถกู้คืนได้";

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setLoading(true);
    try {
      await fetch("/api/account", { method: "DELETE" }).catch(() => {});
    } catch {
      // Ignore network errors
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Ignore storage restrictions
    }
    window.location.href = isEn ? "/en" : "/";
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
      className="tap-overlay-y px-5 py-2.5 rounded-full bg-err-wash border border-err/40 text-err text-xs font-bold hover:bg-err hover:text-surface hover:border-err transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-err"
    >
      <span>
        {loading
          ? (isEn ? "Deleting data..." : "กำลังลบข้อมูล...")
          : (isEn ? "Delete All Data & Account" : "ลบข้อมูลและบัญชีทั้งหมด")}
      </span>
    </button>
  );
}
