"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import { EyeIcon, KeyIcon } from "@/components/ui/LineIcons";
import "@/styles/v2-auth.css";

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
      <div className="v2-au-form">
        <div className="v2-au-head">
          <h1 className="v2-au-title">{isEn ? "This link has expired" : "ลิงก์นี้หมดอายุแล้ว"}</h1>
          <p className="v2-au-sub">
            {isEn
              ? "Reset links work for 15 minutes. Request a new one from the sign-in window."
              : "ลิงก์ตั้งรหัสผ่านใช้ได้ 15 นาที ขอลิงก์ใหม่ได้จากหน้าต่างเข้าสู่ระบบ"}
          </p>
        </div>
        <Link href={isEn ? "/en" : "/"} className="v2-au-submit">
          {isEn ? "Back to home" : "กลับหน้าแรก"}
        </Link>
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
    <form onSubmit={handleSubmit} className="v2-au-form" noValidate>
      <div className="v2-au-head">
        <h1 className="v2-au-title">{isEn ? "Set a new password" : "ตั้งรหัสผ่านใหม่"}</h1>
        <p className="v2-au-sub">{isEn ? "Save it and you're signed in right away." : "บันทึกแล้วเข้าสู่ระบบให้ทันที"}</p>
      </div>

      {/* ♿ R-21: ข้อความผิดพลาดต้องถูก "ประกาศ" ให้โปรแกรมอ่านหน้าจอ · ผูกกับช่องกรอกด้วย aria-describedby */}
      {errorMsg && (
        <div id="reset-password-error" role="alert" className="v2-au-msg is-err">
          {errorMsg}
        </div>
      )}

      <div className="v2-au-fields">
        <div className="v2-au-field">
          <label htmlFor="new-password">{isEn ? "New password" : "รหัสผ่านใหม่"}</label>
          <span className="v2-au-input">
            <KeyIcon />
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
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? (isEn ? "Hide password" : "ซ่อนรหัสผ่าน") : (isEn ? "Show password" : "แสดงรหัสผ่าน")}
              aria-pressed={showPassword}
              className="v2-au-eye"
            >
              <EyeIcon off={showPassword} />
            </button>
          </span>
          {password.length > 0 && (
            <div className="v2-au-strength">
              <span className="v2-au-bars" aria-hidden="true">
                {[1, 2, 3, 4].map((step) => (
                  <i
                    key={step}
                    className={strength.score >= step ? (strength.score <= 1 ? "is-weak" : strength.score === 2 ? "is-mid" : "is-good") : ""}
                  />
                ))}
              </span>
              <span>
                {isEn ? "Strength: " : "ความปลอดภัย: "}
                <b className={strength.colorClass}>{isEn ? getStrengthLabelEn(strength.score) : strength.label}</b>
              </span>
            </div>
          )}
        </div>

        <div className="v2-au-field">
          <label htmlFor="confirm-password">{isEn ? "Confirm new password" : "ยืนยันรหัสผ่านใหม่"}</label>
          <span className="v2-au-input">
            <KeyIcon />
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              required
              aria-invalid={errorMsg ? true : undefined}
              aria-describedby={errorMsg ? "reset-password-error" : undefined}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={isEn ? "Type it once more" : "พิมพ์ซ้ำอีกครั้ง"}
            />
          </span>
        </div>
      </div>

      <button type="submit" disabled={loading} className="v2-au-submit">
        {loading
          ? isEn ? "Saving…" : "กำลังบันทึก…"
          : isEn ? "Save and sign in" : "บันทึกและเข้าสู่ระบบ"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";

  /* หน้าตาเดียวกับหน้าต่างเข้าสู่ระบบ (AuthModal · v2-auth.css) — มาตรฐานเดียวทั้งเว็บ (เจ้าของ 2026-10-17) */
  return (
    <main id="main-content" tabIndex={-1} className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="v2-au w-full max-w-[460px] overflow-hidden">
        <Suspense
          fallback={<div className="v2-au-form v2-au-sub text-center">{isEn ? "Loading…" : "กำลังโหลด…"}</div>}
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
