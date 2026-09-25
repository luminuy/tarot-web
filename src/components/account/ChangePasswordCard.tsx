"use client";

import React, { useId, useState } from "react";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { useSessionUser } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export function ChangePasswordCard() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, refresh } = useSessionUser();
  /*
   * 🏷️ ทั้งสามช่องมี <label> ที่ตาเห็นอยู่แล้ว แต่ไม่มี htmlFor ผูกกับ input เลย (UX-10)
   * สำหรับ screen reader จึงเป็น "ช่องรหัสผ่านไร้ชื่อ" สามช่องติดกัน แยกไม่ออกว่าอันไหนคืออันไหน
   * ⚠️ placeholder ไม่ใช่ label — มันหายไปทันทีที่เริ่มพิมพ์ และ screen reader หลายตัวไม่อ่านเลย
   */
  const oldPwId = useId();
  const newPwId = useId();
  const confirmPwId = useId();
  /* ♿ R-21: ไอดีของกล่องข้อความผิดพลาด — ผูกกับทุกช่องกรอกด้วย aria-describedby */
  const errorId = useId();
  const successId = useId();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const strength = calculatePasswordStrength(newPassword, isEn);

  // ต้องอ่านจากฐานข้อมูลจริง (`hasPassword`) ไม่ใช่เดาจาก provider
  const hasPassword = user?.hasPassword ?? user?.provider === "email";

  if (!user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg(isEn ? "The two passwords do not match." : "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (newPassword.length < 10) {
      setErrorMsg(
        isEn
          ? "New password must be at least 10 characters."
          : "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 10 ตัวอักษร"
      );
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
        throw new Error(data.error || (isEn ? "Unable to change password." : "ไม่สามารถเปลี่ยนรหัสผ่านได้"));
      }

      soundManager.playCardSelectSound();
      setSuccessMsg(isEn ? "Password changed successfully" : "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await refresh();
    } catch (err: any) {
      setErrorMsg(err.message || (isEn ? "An error occurred." : "เกิดข้อผิดพลาด"));
    } finally {
      setLoading(false);
    }
  };

  /*
   * 🔐 ทำไมการ์ดนี้ต้อง "พับเก็บ" ไม่ใช่กางฟอร์มค้างไว้
   * ผู้ใช้ส่วนใหญ่เข้าด้วย Google หรือ LINE และไม่เคยตั้งรหัสผ่านเลย
   * การกางช่องรหัสผ่านสามช่องค้างไว้กลางหน้าบัญชีทำให้คนเข้าใจผิดว่า "ต้องกรอก"
   * และดันเนื้อหาที่คนมาหาจริง (สิทธิ์ · บันทึกคำทำนาย) ตกจอไปเฉย ๆ
   * ใช้ <details> ของเบราว์เซอร์เอง — เปิดปิดได้ด้วยคีย์บอร์ดและโปรแกรมอ่านหน้าจอครบโดยไม่ต้องเขียน JS
   */
  return (
    <details className="group rounded-lg border border-line-warm bg-surface p-5 sm:p-6 text-left">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
        <span className="space-y-1">
          <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold"><ThaiPhrases>
            {hasPassword
              ? (isEn ? "Change Password" : "เปลี่ยนรหัสผ่าน")
              : (isEn ? "Set Email Password" : "ตั้งรหัสผ่านสำหรับเข้าสู่ระบบด้วยอีเมล")}
          </ThaiPhrases></h2>
          <span className="block text-xs text-muted leading-relaxed">
            {hasPassword
              ? (isEn
                ? "Set a new password for security. You will be automatically signed out from other devices."
                : "กำหนดรหัสผ่านใหม่เพื่อความปลอดภัย ระบบจะลงชื่อออกจากอุปกรณ์อื่นโดยอัตโนมัติ")
              : (isEn
                ? "Optional — sign in by email as well as Google or LINE."
                : "ตัวเลือกเสริม — ตั้งไว้เพื่อเข้าสู่ระบบด้วยอีเมลได้ นอกเหนือจาก Google หรือ LINE")}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="shrink-0 font-mono text-xs text-gold-ink transition-transform group-open:rotate-90"
        >
          ▸
        </span>
      </summary>

      <div className="space-y-4 pt-5">
      {/* ♿ R-21: `role="alert"` ทำให้โปรแกรมอ่านหน้าจออ่านข้อความทันทีที่โหนดปรากฏ
          ของเดิมข้อความโผล่บนจออย่างเดียว ผู้ใช้ที่มองไม่เห็นจึงไม่รู้ว่ากรอกผิด */}
      {errorMsg && (
        <div
          id={errorId}
          role="alert"
          className="p-3 rounded-lg bg-err-wash border border-line-warm text-err text-xs font-serif-th text-center"
        >
          {errorMsg}
        </div>
      )}

      {/* ผลสำเร็จใช้ `status` (polite) — ไม่ต้องขัดจังหวะสิ่งที่ผู้ใช้กำลังฟังอยู่ */}
      {successMsg && (
        <div
          id={successId}
          role="status"
          className="p-3 rounded-lg bg-[#EBF3ED] border border-line-warm text-ok text-xs font-serif-th text-center"
        >
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        {hasPassword && (
          <div className="space-y-1">
            <label htmlFor={oldPwId} className="block text-xs text-ink-deep font-serif-th font-semibold">
              {isEn ? "Current Password" : "รหัสผ่านเดิม"}
            </label>
            <input
              id={oldPwId}
              type={showPassword ? "text" : "password"}
              required
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? errorId : undefined}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full h-10 px-3.5 rounded-lg bg-inset-warm border border-line-interactive-warm text-ink-deep text-sm focus:outline-none focus:border-gold-ink transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label htmlFor={newPwId} className="block text-xs text-ink-deep font-serif-th font-semibold">
              {isEn ? "New Password" : "รหัสผ่านใหม่"}
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-xs text-muted hover:text-ink-deep cursor-pointer"
            >
              {showPassword ? (isEn ? "Hide" : "ซ่อน") : (isEn ? "Show" : "ดูรหัสผ่าน")}
            </button>
          </div>
          <input
            id={newPwId}
            type={showPassword ? "text" : "password"}
            required
            aria-invalid={errorMsg ? true : undefined}
            aria-describedby={errorMsg ? errorId : undefined}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={isEn ? "At least 10 characters" : "อย่างน้อย 10 ตัวอักษร"}
            className="w-full h-10 px-3.5 rounded-lg bg-inset-warm border border-line-interactive-warm text-ink-deep text-sm focus:outline-none focus:border-gold-ink transition-colors"
          />
          {newPassword.length > 0 && (
            <div className="pt-1.5 space-y-1">
              <div className="w-full h-1.5 bg-inset-warm/30 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.barColor} transition duration-300`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-[13px] font-serif-th">
                <span className="text-muted">{isEn ? "Security:" : "ความปลอดภัย:"}</span>
                <span className={strength.colorClass}>{strength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={confirmPwId} className="block text-xs text-ink-deep font-serif-th font-semibold">
            {isEn ? "Confirm New Password" : "ยืนยันรหัสผ่านใหม่อีกครั้ง"}
          </label>
          <input
            id={confirmPwId}
            type={showPassword ? "text" : "password"}
            required
            aria-invalid={errorMsg ? true : undefined}
            aria-describedby={errorMsg ? errorId : undefined}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={isEn ? "Re-enter new password" : "ระบุรหัสผ่านให้ตรงกัน"}
            className="w-full h-10 px-3.5 rounded-lg bg-inset-warm border border-line-interactive-warm text-ink-deep text-sm focus:outline-none focus:border-gold-ink transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="tap-overlay-y py-2.5 px-5 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-semibold font-serif-th text-xs transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98"
        >
          {loading
            ? (isEn ? "Saving..." : "กำลังบันทึก…")
            : (isEn ? "Save Password" : "บันทึกรหัสผ่าน")}
        </button>
      </form>
      </div>
    </details>
  );
}
