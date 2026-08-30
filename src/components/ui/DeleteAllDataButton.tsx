"use client";

import React from "react";

export function DeleteAllDataButton() {
  return (
    <button
      type="button"
      onClick={() => {
        const confirmed = window.confirm(
          "⚠️ คุณแน่ใจหรือไม่?\n\nการดำเนินการนี้จะลบ:\n• ประวัติการเปิดไพ่ทั้งหมด\n• บันทึกส่วนตัว\n• คะแนนความแม่นยำ\n• การตั้งค่าเสียง\n\nข้อมูลจะไม่สามารถกู้คืนได้"
        );
        if (confirmed) {
          localStorage.clear();
          window.location.href = "/";
        }
      }}
      className="px-5 py-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold hover:bg-rose-900/80 transition-all cursor-pointer"
    >
      🗑️ ลบข้อมูลทั้งหมดออกจากเบราว์เซอร์
    </button>
  );
}
