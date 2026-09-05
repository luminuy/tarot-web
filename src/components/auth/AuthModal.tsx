"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { invalidateSessionCache } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { CheckMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { DAILY_LIMIT, getMemberBenefits } from "@/lib/entitlement/copy";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useLocale } from "@/lib/i18n";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup" | "forgot";
  /** true เมื่อผู้ใช้ถูกพามาที่นี่จากกำแพงสิทธิ์ — แสดงสิ่งที่จะได้รับกำกับไว้ด้วย */
  fromEntitlementWall?: boolean;
}

/** ไอคอนเส้นในช่องกรอก — กฎทองข้อ 2 ห้ามใช้อิโมจิการ์ตูน */
const FieldIcon: React.FC<{ variant: "person" | "mail" | "key"; className?: string }> = ({
  variant,
  className = "w-3.5 h-3.5",
}) => (
  <svg viewBox="0 0 24 24" className={`stroke-current fill-none ${className}`} strokeWidth={1.6} aria-hidden="true">
    {variant === "person" && (
      <>
        <circle cx="12" cy="8.5" r="3.5" />
        <path d="M5.5 19.5a6.5 6.5 0 0113 0" strokeLinecap="round" />
      </>
    )}
    {variant === "mail" && (
      <>
        <rect x="3.2" y="5.5" width="17.6" height="13" rx="2.5" />
        <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
      </>
    )}
    {variant === "key" && (
      <>
        <circle cx="8.5" cy="12" r="3.5" />
        <path d="M12 12h8M17.5 12v3M20 12v2.4" strokeLinecap="round" />
      </>
    )}
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "signin",
  fromEntitlementWall = false,
}) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  // null = ด่านปิด/ยังไม่รู้ · "" = ด่านเปิดแต่ยังไม่ผ่าน · string = ผ่านแล้ว
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // เปิดหน้าต่างครั้งใหม่ต้องเคารพโหมดที่ผู้เรียกส่งมา
  // (มาจากกำแพงสิทธิ์ = ควรเปิดแท็บ "สมัครสมาชิก" ให้เลย ไม่ใช่ให้ผู้ใช้หาเอง)
  useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);

  // Esc ปิด · ล็อกการเลื่อนพื้นหลัง · ขังโฟกัสไว้ในหน้าต่าง (a11y — ของเดิมไม่มีเลย)
  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const focusTimer = requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>("input, button")?.focus();
    });

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
      cancelAnimationFrame(focusTimer);
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(password, isEn);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setErrorMsg(null);
    setSuccessMsg(null);
    setTurnstileToken(null);
  };

  const switchMode = (newMode: "signin" | "signup" | "forgot") => {
    soundManager.playCardSelectSound();
    setMode(newMode);
    resetForm();
  };

  const handleLoginGoogle = () => {
    soundManager.playCardSelectSound();
    window.location.href = "/api/auth/google";
  };

  const handleLoginLine = () => {
    soundManager.playCardSelectSound();
    window.location.href = "/api/auth/line";
  };

  /**
   * ยิง API แล้วอ่าน JSON แบบไม่พัง
   * ⚠️ `res.json()` เปล่า ๆ จะโยน "Unexpected end of JSON input" เมื่อเซิร์ฟเวอร์ตอบ
   * 500/502 โดยไม่มี body — ผู้ใช้จะเห็นข้อความภาษาอังกฤษของ JS แทนคำอธิบายไทย
   * (บทเรียน INC-0026 · เกิดจริงกับ signup บน production ตอนยังไม่ตั้งค่าอีเมล)
   */
  const postJson = async (url: string, payload: Record<string, unknown>, fallbackError: string) => {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error(isEn ? "Cannot connect to server. Please check your internet connection." : "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    }

    const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string; user?: unknown };
    if (!res.ok) {
      throw new Error(data.error || fallbackError);
    }
    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // กันกดส่งซ้ำระหว่างรอผล (ของเดิมกดรัวได้ → ชนเพดาน rate limit ตัวเอง)

    // เปิดใช้ Turnstile แต่ผู้ใช้ยังไม่ผ่านกล่องตรวจ → หยุดไว้ก่อน
    if (turnstileToken === "") {
      setErrorMsg(isEn ? "Please complete the security check to continue" : "กรุณายืนยันว่าคุณไม่ใช่บอตก่อนดำเนินการต่อ");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    // ตัดช่องว่างหัวท้ายเสมอ — คีย์บอร์ดมือถือเติมช่องว่างท้ายอีเมลให้อัตโนมัติบ่อยมาก
    const emailValue = email.trim();
    const nameValue = name.trim();

    try {
      if (mode === "signin") {
        await postJson(
          "/api/auth/email/login",
          { email: emailValue, password, turnstileToken: turnstileToken ?? "" },
          isEn ? "Incorrect email or password" : "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
        );
        soundManager.playCardSelectSound();
        invalidateSessionCache();
        window.location.href = "/?auth_success=1";
      } else if (mode === "signup") {
        const data = await postJson(
          "/api/auth/email/signup",
          { email: emailValue, password, name: nameValue, turnstileToken: turnstileToken ?? "" },
          isEn ? "Unable to create account" : "ไม่สามารถสร้างบัญชีได้"
        );
        soundManager.playCardSelectSound();
        if (data.user) {
          invalidateSessionCache();
          window.location.href = "/?auth_success=1&new_user=1";
        } else {
          setSuccessMsg(data.message || (isEn ? "A verification link has been sent to your email." : "ระบบได้ส่งข้อมูลการยืนยันไปยังอีเมลของคุณเรียบร้อยแล้ว"));
        }
      } else if (mode === "forgot") {
        // ต้องเช็ก res.ok ด้วย — ของเดิมโดน 429 แล้วยังขึ้น "ส่งลิงก์ให้แล้ว"
        // ผู้ใช้เลยนั่งรออีเมลที่ไม่มีวันมา
        const data = await postJson(
          "/api/auth/email/forgot",
          { email: emailValue, turnstileToken: turnstileToken ?? "" },
          isEn ? "Unable to send password reset link. Please try again." : "ไม่สามารถส่งลิงก์ตั้งรหัสผ่านใหม่ได้ กรุณาลองใหม่อีกครั้ง"
        );
        setSuccessMsg(data.message || (isEn ? "If an account exists for this email, we have sent a password reset link." : "หากมีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว"));
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : (isEn ? "An error occurred. Please try again." : "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#2E211A]/50 backdrop-blur-[3px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Backdrop click to close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          ref={dialogRef}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] p-6 sm:p-8 shadow-[0_20px_50px_rgba(42,38,31,0.18)] flex flex-col items-center relative overflow-hidden text-[#29261F]"
        >
          {/* Close button with high-contrast luxury border */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Close authentication window" : "ปิดหน้าต่างเข้าสู่ระบบ"}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-[#29261F] hover:text-[#A58A5C] hover:border-[#A58A5C] hover:bg-[#FFFFFF] text-xs flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>

          {/* Seer Brand Logo Frame */}
          <div className="relative mb-3.5 group select-none">
            {/* Circular Seer Brand Logo */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-[#D5CEC2] overflow-hidden relative flex-shrink-0 bg-[#F3F0EA] group-hover:scale-105 transition-all duration-300 shadow-xs">
              <img
                src="/logo.webp"
                alt="SeerTarot"
                width={72}
                height={72}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          </div>

          {/* Header Typography */}
          <div className="space-y-1 text-center mb-5">
            <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-serif-th font-bold text-[#29261F]">
              {mode === "signin" && (isEn ? "Sign In" : "เข้าสู่ระบบ")}
              {mode === "signup" && (isEn ? "Create Free Account" : "สมัครสมาชิกฟรี")}
              {mode === "forgot" && (isEn ? "Reset Password" : "ตั้งรหัสผ่านใหม่ (ลืมรหัสผ่าน)")}
            </h3>
            <p className="text-xs text-[#635B4E] font-serif-th max-w-xs mx-auto leading-relaxed">
              {mode === "signin" &&
                (isEn
                  ? `Sign in to receive ${DAILY_LIMIT} free daily readings and sync your tarot journal`
                  : `เข้าสู่ระบบเพื่อรับสิทธิ์เปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้ง พร้อมบันทึกประวัติการดูดวงของคุณ`)}
              {mode === "signup" &&
                (isEn
                  ? `Free account with no credit card required. Receive ${DAILY_LIMIT} daily readings & journal sync`
                  : `สมัครสมาชิกฟรี ไม่ต้องผูกบัตรเครดิต เปิดไพ่ได้ฟรีวันละ ${DAILY_LIMIT} ครั้ง`)}
              {mode === "forgot" &&
                (isEn
                  ? "Enter your registered email address to receive a secure password reset link"
                  : "ระบุอีเมลของคุณ เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่อย่างปลอดภัย")}
            </p>
          </div>

          {/* สิ่งที่จะได้รับ — แสดงเมื่อผู้ใช้ถูกพามาจากกำแพงสิทธิ์ จะได้รู้ว่าสมัครไปเพื่ออะไร */}
          {fromEntitlementWall && mode !== "forgot" && (
            <ul className="w-full mb-4 grid gap-1.5 rounded-xl border border-[#D5CEC2] bg-[#EAE7E0] p-3 shadow-xs">
              {getMemberBenefits(isEn).map((b) => (
                <li key={b.title} className="flex items-start gap-2 text-[13px] font-serif-th text-[#29261F]">
                  <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#A58A5C]" />
                  {b.title}
                </li>
              ))}
            </ul>
          )}

          {/* Segmented Mode Switcher (Tab System) */}
          {mode !== "forgot" && (
            <div className="w-full grid grid-cols-2 p-1 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] mb-4">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`py-2 rounded-full text-xs font-serif-th font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signin" ? "bg-[#29261F] text-[#F3F0EA] shadow-xs" : "text-[#635B4E] hover:text-[#29261F]"
                }`}
              >
                <span>✦</span>
                <span>{isEn ? "Sign In" : "เข้าสู่ระบบ"}</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-2 rounded-full text-xs font-serif-th font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signup" ? "bg-[#29261F] text-[#F3F0EA] shadow-xs" : "text-[#635B4E] hover:text-[#29261F]"
                }`}
              >
                <span>✨</span>
                <span>{isEn ? "Register" : "สมัครสมาชิก"}</span>
              </button>
            </div>
          )}

          {/* Feedback messages */}
          <div aria-live="polite" className="w-full">
            {errorMsg && (
              <div className="w-full mb-3 p-3 rounded-xl bg-[#FCEEEA] border border-[#D5CEC2] text-[#A6392C] text-xs font-serif-th text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="w-full mb-3 p-3 rounded-xl bg-[#EBF3ED] border border-[#D5CEC2] text-[#3A7044] text-xs font-serif-th text-center">
                {successMsg}
              </div>
            )}
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3.5">
            {mode === "signup" && (
              <div className="space-y-1.5 text-left">
                <label htmlFor="auth-name" className="block text-[13px] font-semibold text-[#29261F] font-serif-th">
                  {isEn ? "Name or Nickname" : "ชื่อหรือนามแฝง"}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#A58A5C] pointer-events-none">
                    <FieldIcon variant="person" />
                  </span>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isEn ? "e.g. Alex, Sarah, Morgan" : "เช่น ฟ้า, พลอย, บิ๊ก"}
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] text-[#29261F] text-xs font-serif-th placeholder-[#756F66]/50 focus:outline-none focus:border-[#A58A5C] focus:ring-1 focus:ring-[#A58A5C] transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label htmlFor="auth-email" className="block text-[13px] font-semibold text-[#29261F] font-serif-th">
                {isEn ? "Email Address" : "ที่อยู่อีเมล"}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#A58A5C] pointer-events-none">
                  <FieldIcon variant="mail" />
                </span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] text-[#29261F] text-xs font-serif-th placeholder-[#756F66]/50 focus:outline-none focus:border-[#A58A5C] focus:ring-1 focus:ring-[#A58A5C] transition-all"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="auth-password"
                    className="block text-[13px] font-semibold text-[#29261F] font-serif-th"
                  >
                    {isEn ? "Password" : "รหัสผ่าน"}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[13px] text-[#A58A5C] hover:text-[#29261F] hover:underline cursor-pointer font-serif-th font-bold"
                    >
                      {isEn ? "Forgot password?" : "ลืมรหัสผ่าน?"}
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#A58A5C] pointer-events-none">
                    <FieldIcon variant="key" />
                  </span>
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? (isEn ? "At least 10 characters" : "อย่างน้อย 10 ตัวอักษร") : "••••••••••"}
                    className="w-full h-11 pl-9 pr-12 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] text-[#29261F] text-xs font-serif-th placeholder-[#756F66]/50 focus:outline-none focus:border-[#A58A5C] focus:ring-1 focus:ring-[#A58A5C] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? (isEn ? "Hide password" : "ซ่อนรหัสผ่าน") : (isEn ? "Show password" : "แสดงรหัสผ่าน")}
                    className="absolute right-3 text-[#635B4E] hover:text-[#29261F] text-xs font-serif-th cursor-pointer px-1 py-0.5 rounded transition-colors"
                  >
                    {showPassword ? (isEn ? "Hide" : "ซ่อน") : (isEn ? "Show" : "ดู")}
                  </button>
                </div>

                {/* Gemstone Password Strength Meter on Signup */}
                {mode === "signup" && password.length > 0 && (
                  <div className="pt-2 space-y-1.5">
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4].map((step) => {
                        const active = strength.score >= step;
                        return (
                          <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              active
                                ? strength.score <= 1
                                  ? "bg-[#A6392C]"
                                  : strength.score === 2
                                    ? "bg-[#A58A5C]"
                                    : "bg-[#3A7044]"
                                : "bg-[#EAE7E0]"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[13px] font-serif-th text-[#635B4E]">
                      <span>{isEn ? "Strength:" : "ความปลอดภัย:"}</span>
                      <span className={`font-semibold ${strength.colorClass}`}>{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ด่านกันบอท (แสดงเฉพาะเมื่อตั้งค่า Turnstile ครบ) */}
            <TurnstileWidget onToken={setTurnstileToken} resetKey={mode} />

            {/* กำลังตรวจ Turnstile อยู่ — บอกผู้ใช้ว่าปุ่มกดไม่ได้เพราะอะไร */}
            {turnstileToken === "" && !loading && (
              <p className="text-xs text-[#635B4E] text-center flex items-center justify-center gap-1.5">
                <span className="inline-block w-3 h-3 rounded-full border-2 border-[#A58A5C] border-t-transparent animate-spin" />
                {isEn ? "Verifying security…" : "กำลังตรวจสอบความปลอดภัย…"}
              </p>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || turnstileToken === ""}
              aria-busy={loading}
              className="w-full h-11.5 mt-2 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-bold font-serif-th text-xs sm:text-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {loading ? (
                <span>{isEn ? "Processing…" : "กำลังดำเนินการ…"}</span>
              ) : (
                <>
                  <span className="text-sm">✦</span>
                  <span>
                    {mode === "signin" && (isEn ? "Sign In with Email" : "เข้าสู่ระบบด้วยอีเมล")}
                    {mode === "signup" && (isEn ? "Confirm Registration" : "ยืนยันการสมัครสมาชิก")}
                    {mode === "forgot" && (isEn ? "Send Reset Link" : "ส่งลิงก์รีเซ็ตรหัสผ่าน")}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher Return Link for Forgot Password */}
          {mode === "forgot" && (
            <div className="pt-3 text-xs font-serif-th text-[#635B4E]">
              {isEn ? "Remembered your password? " : "จำรหัสผ่านได้แล้ว? "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-[#A58A5C] hover:underline font-bold cursor-pointer ml-1"
              >
                {isEn ? "Back to Sign In" : "กลับไปเข้าสู่ระบบ"}
              </button>
            </div>
          )}

          {/* Sanctuary Divider */}
          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-[#D5CEC2]/40" />
            <span className="px-3 text-[13px] text-[#635B4E] font-serif-th font-medium">
              {isEn ? "Or continue with" : "หรือเชื่อมต่อทันทีด้วย"}
            </span>
            <div className="flex-1 border-t border-[#D5CEC2]/40" />
          </div>

          {/* World-Class Luxury Social OAuth Cards */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            {/* Google Sanctuary Card */}
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="py-2.5 px-3.5 rounded-full bg-[#FFFFFF] hover:bg-[#EAE7E0] border border-[#D5CEC2] hover:border-[#A58A5C] text-[#29261F] font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group shadow-xs"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 border border-[#D5CEC2]">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <span className="group-hover:text-[#A58A5C] transition-colors">Google</span>
            </button>

            {/* LINE Sanctuary Card */}
            <button
              type="button"
              onClick={handleLoginLine}
              className="py-2.5 px-3.5 rounded-full bg-[#FFFFFF] hover:bg-[#F0FFF4] border border-[#06C755]/40 hover:border-[#06C755] text-[#3A7044] font-serif-th font-semibold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group shadow-xs"
            >
              <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0 text-white">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 3.8 7.9 9 8.6.4.1.9.3 1 .6.1.4 0 1.2-.1 1.7-.1.4-.4 1.7-.6 2.1-.2.5-.9 2 .8 1.1 1.8-.9 4.8-2.9 6.5-4.9 4.6-1.5 7.4-4.8 7.4-8.6zm-14.7 2.7H6.5c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v4.5h2.3c.3 0 .5.2.5.5s-.2.5-.5.5zm2.6-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v5zm4.8 0c0 .3-.2.5-.5.5-.2 0-.4-.1-.5-.3L13.8 9v3.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s-.5.2-.5.5v5zm3.7-3.2h-2.3v1.4h2.3c.3 0 .5.2.5.5s-.2.5-.5.5h-2.8c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5h2.8c.3 0 .5.2.5.5s-.2.5-.5.5h-2.3v1.3h2.3c.3 0 .5.2.5.5s-.2.5-.5.5z" />
                </svg>
              </div>
              <span className="group-hover:text-[#06C755] transition-colors">LINE</span>
            </button>
          </div>

          {/* Cryptographic Assurance & PDPA Footnote */}
          <div className="mt-5 text-[13px] text-[#635B4E] font-serif-th text-center flex items-center justify-center gap-1 opacity-80">
            <span className="text-[#A58A5C]">✦</span>
            <span>
              {isEn
                ? "End-to-end encrypted · Export or delete your data anytime under PDPA"
                : "เข้ารหัสความปลอดภัยระดับสากล · ลบบัญชีและข้อมูลทั้งหมดได้ทุกเมื่อ"}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
