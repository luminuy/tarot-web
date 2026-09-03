"use client";

import React, { useState } from "react";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { useSessionUser } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";

export function ChangePasswordCard() {
  const { user, refresh } = useSessionUser();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const strength = calculatePasswordStrength(newPassword);

  // ต้องอ่านจากฐานข้อมูลจริง (`hasPassword`) ไม่ใช่เดาจาก provider —
  // บัญชี Google/LINE ที่ตั้งรหัสผ่านเพิ่มไว้แล้วก็ต้องกรอกรหัสผ่านเดิม
  // ของเดิมเดาว่า `provider === "email"` เท่านั้น ทำให้คนกลุ่มนี้ส่งฟอร์มแล้วโดน
  // "กรุณาระบุรหัสผ่านเดิม" ทุกครั้งโดยไม่มีช่องให้กรอก
  const hasPassword = user?.hasPassword ?? user?.provider === "email";

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg("รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 10) {
      setErrorMsg("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          oldPassword: oldPassword || undefined,
          newPassword,
        }),
      });

      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        throw new Error(data.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }

      soundManager.playCardSelectSound();
      setSuccessMsg("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว ✦");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // token_version เพิ่งถูกเพิ่ม → ต้องอ่านโปรไฟล์ใหม่ (hasPassword เปลี่ยนเป็น true แล้ว)
      await refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[1.618rem] border border-[#D6B48D] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 shadow-xs text-left">
      <div className="flex items-center gap-2">
        <span className="text-[#CD9F5B]">✦</span>
        <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
          {hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านสำหรับเข้าสู่ระบบด้วยอีเมล"}
        </h2>
      </div>

      <p className="text-xs text-[#8C735D] leading-relaxed">
        {hasPassword
          ? "กำหนดรหัสผ่านใหม่เพื่อความปลอดภัย ระบบจะลงชื่อออกจากอุปกรณ์อื่นโดยอัตโนมัติ"
          : "คุณสามารถตั้งรหัสผ่านเพื่อเข้าสู่ระบบด้วยอีเมลได้ นอกเหนือจากการเข้าสู่ระบบผ่าน Google หรือ LINE"}
      </p>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-serif-th text-center">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-serif-th text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {hasPassword && (
          <div className="space-y-1">
            <label className="block text-xs text-[#5A432F] font-serif-th font-semibold">รหัสผ่านเดิม</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full h-10 px-3.5 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] text-sm focus:outline-none focus:border-[#CD9F5B] transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-xs text-[#5A432F] font-serif-th font-semibold">รหัสผ่านใหม่</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-[#8C735D] hover:text-[#5A432F] cursor-pointer"
            >
              {showPassword ? "ซ่อน" : "ดูรหัสผ่าน"}
            </button>
          </div>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="อย่างน้อย 10 ตัวอักษร"
            className="w-full h-10 px-3.5 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] text-sm focus:outline-none focus:border-[#CD9F5B] transition-colors"
          />
          {newPassword.length > 0 && (
            <div className="pt-1.5 space-y-1">
              <div className="w-full h-1.5 bg-[#D6B48D]/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.barColor} transition-all duration-300`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-serif-th">
                <span className="text-[#8C735D]">ความปลอดภัย:</span>
                <span className={strength.colorClass}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-[#5A432F] font-serif-th font-semibold">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ระบุรหัสผ่านให้ตรงกัน"
            className="w-full h-10 px-3.5 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] text-sm focus:outline-none focus:border-[#CD9F5B] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-5 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-semibold font-serif-th text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
        >
          {loading ? "กำลังบันทึก…" : "✦ บันทึกรหัสผ่าน"}
        </button>
      </form>
    </div>
  );
}
