"use client";

import { useState } from "react";
import { useLocale } from "@/lib/i18n";

export function DeleteAllDataButton() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmMessage = isEn
      ? "✦ Confirm permanent deletion of all data?\n\nThis action will delete:\n• All reading history (both local and cloud)\n• User account details and personal reflection notes\n• All preferences and settings\n\nThis action cannot be undone."
      : "✦ ยืนยันการลบข้อมูลทั้งหมด?\n\nการดำเนินการนี้จะลบ:\n• ประวัติการเปิดไพ่ทั้งหมด (ทั้งในเครื่องและบนบัญชี)\n• ข้อมูลบัญชีผู้ใช้และบันทึกส่วนตัว\n• การตั้งค่าทั้งหมด\n\nข้อมูลจะไม่สามารถกู้คืนได้";

    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setLoading(true);
    try {
      await fetch("/api/account", { method: "DELETE" }).catch(() => {});
    } catch {
      // Ignore network errors
    }

    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="px-5 py-2.5 rounded-lg bg-[#A6392C]/80 border border-[#A6392C]/50 text-[#A6392C] text-xs font-bold hover:bg-[#A6392C]/80 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
    >
      <span>✦</span>
      <span>
        {loading
          ? (isEn ? "Deleting data..." : "กำลังลบข้อมูล...")
          : (isEn ? "Delete All Data & Account" : "ลบข้อมูลและบัญชีทั้งหมด")}
      </span>
    </button>
  );
}
