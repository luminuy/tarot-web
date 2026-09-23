"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  /*
   * ⚠️ token ต้องออกจากแถบ URL ทันทีที่หน้าเปิด (A4-14)
   * GA4 ส่ง `page_location` เป็น URL เต็มรวม query (บูตหลังผู้ใช้แตะ/พิมพ์ครั้งแรก ซึ่งต้องเกิดแน่
   * เพราะต้องพิมพ์รหัสใหม่) token ที่ตั้งรหัสผ่านได้จึงไปอยู่ในรายงาน GA4 · เก็บลง state แล้วลบจาก URL
   * (Service Worker ไม่แคชหน้านี้แล้ว — ดู public/sw.js)
   */
  const [token] = useState(() => searchParams.get("token"));
  useEffect(() => {
    if (window.location.search.includes("token=")) {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = calculatePasswordStrength(password);

  const getStrengthLabelEn = (score: number): string => {
    switch (score) {
      case 0:
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "Weak";
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-lg bg-err-wash border border-line-warm text-err flex items-center justify-center text-2xl mx-auto ">
          ✕
        </div>
        <h2 className="text-xl font-bold font-serif-th text-ink-deep">
          {isEn ? "Invalid or Expired Link" : "ลิงก์ไม่ถูกต้องหรือหมดอายุ"}
        </h2>
        <p className="text-xs text-muted font-serif-th leading-relaxed max-w-sm mx-auto">
          {isEn
            ? "No valid reset token was found, or this link has expired (15-minute validity)."
            : "ไม่พบ Token สำหรับการตั้งรหัสผ่านใหม่ หรือลิงก์นี้อาจหมดอายุไปแล้ว (อายุ 15 นาที)"}
        </p>
        <div className="pt-2">
          <Link
            href={isEn ? "/en" : "/"}
            className="inline-block py-2.5 px-6 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-semibold text-xs font-serif-th transition-colors"
          >
            {isEn ? "Return to Sanctuary" : "กลับสู่วิหารหลัก"}
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg(isEn ? "Passwords do not match" : "รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (password.length < 10) {
      setErrorMsg(isEn ? "Password must be at least 10 characters long" : "รหัสผ่านต้องมีความยาวอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/email/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ token, password }),
      });

      // กัน "Unexpected end of JSON input" เมื่อเซิร์ฟเวอร์ตอบโดยไม่มี body (INC-0026)
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || (isEn ? "Unable to reset password" : "ไม่สามารถตั้งรหัสผ่านใหม่ได้"));
      }

      soundManager.playCardSelectSound();
      router.push(isEn ? "/en?pw_reset=1" : "/?pw_reset=1");
    } catch (err: any) {
      setErrorMsg(err.message || (isEn ? "An error occurred. Please try again." : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {/* ♿ R-21: ข้อความผิดพลาดต้องถูก "ประกาศ" ให้โปรแกรมอ่านหน้าจอ ไม่ใช่แค่โผล่บนจอ
          `role="alert"` ทำให้อ่านทันทีที่โหนดปรากฏ · `id` ผูกกับช่องกรอกด้วย `aria-describedby`
          เพื่อให้ผู้ใช้ที่ย้อนกลับไปที่ช่องนั้นได้ยินว่าผิดตรงไหน (ไม่ใช่แค่ว่า "มีอะไรผิด") */}
      {errorMsg && (
        <div
          id="reset-password-error"
          role="alert"
          className="p-3 rounded-lg bg-err/60 border border-err/40 text-err text-xs font-serif-th text-center"
        >
          {errorMsg}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="new-password" className="block text-xs text-ink-deep font-serif-th font-semibold">
          {isEn ? "New Password" : "รหัสผ่านใหม่"}
        </label>
        <div className="relative">
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            required
            aria-invalid={errorMsg ? true : undefined}
            aria-describedby={errorMsg ? "reset-password-error" : undefined}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isEn ? "At least 10 characters" : "อย่างน้อย 10 ตัวอักษร"}
            className="w-full h-11 px-3.5 pr-10 rounded-lg bg-inset-warm border border-line-interactive-warm text-ink-deep text-sm focus:outline-none focus:border-gold-ink transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? (isEn ? "Hide password" : "ซ่อนรหัสผ่าน") : (isEn ? "Show password" : "แสดงรหัสผ่าน")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink-deep text-xs cursor-pointer"
          >
            {showPassword ? (isEn ? "Hide" : "ซ่อน") : (isEn ? "Show" : "ดู")}
          </button>
        </div>

        {/* Strength Meter */}
        {password.length > 0 && (
          <div className="pt-1.5 space-y-1">
            <div className="w-full h-1.5 bg-inset-warm/30 rounded-full overflow-hidden">
              <div
                className={`h-full ${strength.barColor} transition duration-300`}
                style={{ width: `${(strength.score / 4) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[13px] font-serif-th">
              <span className="text-muted">{isEn ? "Strength:" : "ความปลอดภัย:"}</span>
              <span className={strength.colorClass}>
                {isEn ? getStrengthLabelEn(strength.score) : strength.label}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="confirm-password" className="block text-xs text-ink-deep font-serif-th font-semibold">
          {isEn ? "Confirm New Password" : "ยืนยันรหัสผ่านใหม่อีกครั้ง"}
        </label>
        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          required
          aria-invalid={errorMsg ? true : undefined}
          aria-describedby={errorMsg ? "reset-password-error" : undefined}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder={isEn ? "Re-enter password to match" : "ระบุรหัสผ่านให้ตรงกัน"}
          className="w-full h-11 px-3.5 rounded-lg bg-inset-warm border border-line-interactive-warm text-ink-deep text-sm focus:outline-none focus:border-gold-ink transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-full bg-gold-ink hover:bg-gold-ink-deep text-surface font-semibold font-serif-th text-sm transition cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
      >
        {loading ? (
          <span>{isEn ? "Saving new password…" : "กำลังบันทึกรหัสผ่านใหม่…"}</span>
        ) : (
          <span>{isEn ? "Save New Password & Sign In" : "บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ"}</span>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] bg-surface-warm text-ink-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg bg-surface border border-line-warm p-6 sm:p-8 relative overflow-hidden text-center space-y-6">
        <div className="w-14 h-14 rounded-lg bg-inset-warm border border-line-warm text-gold-ink flex items-center justify-center text-2xl mx-auto font-bold">✓</div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-serif-th font-bold font-mystic-gold">
            {isEn ? "Reset Password" : "ตั้งรหัสผ่านใหม่"}
          </h1>
          <p className="text-xs text-muted font-serif-th leading-relaxed">
            {isEn ? "Set a new secure password for your SeerTarot account" : "กำหนดรหัสผ่านใหม่สำหรับบัญชี SeerTarot ของคุณ"}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-xs text-muted font-serif-th animate-pulse">
              {isEn ? "Loading…" : "กำลังโหลดข้อมูล…"}
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
