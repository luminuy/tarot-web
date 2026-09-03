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

      const data = await res.json().catch(() => ({}) as { error?: string });
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
    <div className="rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 text-left">
      <div className="flex items-center gap-2">
        <span className="text-[#8F5C1A]">✦</span>
        <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
          {hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่านสำหรับเข้าสู่ระบบด้วยอีเมล"}
        </h2>
      </div>

      <p className="text-xs text-[#635B4E] leading-relaxed">
        {hasPassword
          ? "กำหนดรหัสผ่านใหม่เพื่อความปลอดภัย ระบบจะลงชื่อออกจากอุปกรณ์อื่นโดยอัตโนมัติ"
          : "คุณสามารถตั้งรหัสผ่านเพื่อเข้าสู่ระบบด้วยอีเมลได้ นอกเหนือจากการเข้าสู่ระบบผ่าน Google หรือ LINE"}
      </p>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-[#FCEEEA] border border-[#D9C8AC] text-[#A6392C] text-xs font-serif-th text-center">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-lg bg-[#EBF3ED] border border-[#D9C8AC] text-[#3A7044] text-xs font-serif-th text-center">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {hasPassword && (
          <div className="space-y-1">
            <label className="block text-xs text-[#2E211A] font-serif-th font-semibold">รหัสผ่านเดิม</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full h-10 px-3.5 rounded-lg bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] text-sm focus:outline-none focus:border-[#8F5C1A] transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="block text-xs text-[#2E211A] font-serif-th font-semibold">รหัสผ่านใหม่</label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-[#635B4E] hover:text-[#2E211A] cursor-pointer"
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
            className="w-full h-10 px-3.5 rounded-lg bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] text-sm focus:outline-none focus:border-[#8F5C1A] transition-colors"
          />
          {newPassword.length > 0 && (
            <div className="pt-1.5 space-y-1">
              <div className="w-full h-1.5 bg-[#F3EDE2]/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.barColor} transition-all duration-300`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[13px] font-serif-th">
                <span className="text-[#635B4E]">ความปลอดภัย:</span>
                <span className={strength.colorClass}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label className="block text-xs text-[#2E211A] font-serif-th font-semibold">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ระบุรหัสผ่านให้ตรงกัน"
            className="w-full h-10 px-3.5 rounded-lg bg-[#F3EDE2] border border-[#D9C8AC] text-[#2E211A] text-sm focus:outline-none focus:border-[#8F5C1A] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-5 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] text-[#FFFFFF] font-semibold font-serif-th text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
        >
          {loading ? "กำลังบันทึก…" : "✦ บันทึกรหัสผ่าน"}
        </button>
      </form>
    </div>
  );
}
