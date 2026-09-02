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
    <div className="rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 p-5 sm:p-6 space-y-4 shadow-xl text-left">
      <div className="flex items-center gap-2">
        <span className="text-[#ffd700]">✦</span>
        <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
          {hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านสำหรับเข้าสู่ระบบด้วยอีเมล"}
        </h2>
      </div>

      <p className="text-xs text-[#9c93b8] leading-relaxed">
        {hasPassword
          ? "กำหนดรหัสผ่านใหม่เพื่อความปลอดภัย ระบบจะลงชื่อออกจากอุปกรณ์อื่นโดยอัตโนมัติ"
          : "คุณสามารถตั้งรหัสผ่านเพื่อเข้าสู่ระบบด้วยอีเมลได้ นอกเหนือจากการเข้าสู่ระบบผ่าน Google หรือ LINE"}
      </p>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-serif-th text-center">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-serif-th text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {hasPassword && (
          <div className="space-y-1">
            <label className="block text-xs text-[#c4bcd8] font-serif-th">รหัสผ่านเดิม</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full h-10 px-3.5 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-xs text-[#c4bcd8] font-serif-th">รหัสผ่านใหม่</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-[#9c93b8] hover:text-white cursor-pointer"
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
            className="w-full h-10 px-3.5 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
          />
          {newPassword.length > 0 && (
            <div className="pt-1.5 space-y-1">
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.barColor} transition-all duration-300`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-serif-th">
                <span className="text-[#9c93b8]">ความปลอดภัย:</span>
                <span className={strength.colorClass}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-[#c4bcd8] font-serif-th">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ระบุรหัสผ่านให้ตรงกัน"
            className="w-full h-10 px-3.5 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-[#d4a72c] to-[#a27b14] hover:from-[#e5b83d] hover:to-[#b38c25] text-[#0b0714] font-semibold font-serif-th text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
        >
          {loading ? "กำลังบันทึก…" : "✦ บันทึกรหัสผ่าน"}
        </button>
      </form>
    </div>
  );
}
