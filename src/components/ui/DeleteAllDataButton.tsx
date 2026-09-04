"use client";

import { useState } from "react";

export function DeleteAllDataButton() {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "✦ ยืนยันการลบข้อมูลทั้งหมด?\n\nการดำเนินการนี้จะลบ:\n• ประวัติการเปิดไพ่ทั้งหมด (ทั้งในเครื่องและบนบัญชี)\n• ข้อมูลบัญชีผู้ใช้และบันทึกส่วนตัว\n• การตั้งค่าทั้งหมด\n\nข้อมูลจะไม่สามารถกู้คืนได้"
    );
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
      <span>{loading ? "กำลังลบข้อมูล..." : "ลบข้อมูลและบัญชีทั้งหมด"}</span>
    </button>
  );
}
