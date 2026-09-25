"use client";

import React, { useEffect, useRef, useState } from "react";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { invalidateSessionCache } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup" | "forgot";
  /**
   * true เมื่อผู้ใช้ถูกพามาที่นี่จากกำแพงสิทธิ์
   * เดิมใช้โชว์กล่อง "สิ่งที่จะได้รับ" เหนือแท็บ — เจ้าของสั่งเอาออก (2026-09-24) ตอนนี้ไม่มีผลกับหน้าตาแล้ว
   * เก็บ prop ไว้ให้ผู้เรียกเดิมไม่พัง
   */
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

/**
 * ล็อกอิน/สมัครด้วยอีเมลเสร็จแล้วพาไปไหน
 *
 * ปกติไปหน้าแรก (ที่แสดงข้อความต้อนรับ) · ยกเว้นหน้าดูดวงรายผัง `/read/<ผัง>` ต้องกลับหน้าเดิม
 * — คนที่ติดกำแพงเข้าสู่ระบบตอนกด "เริ่มดูดวงด้วยผังนี้" ล็อกอินเสร็จแล้วต้องได้ดูผังนั้นต่อทันที
 * ไม่ใช่ตกหน้าแรกแล้วต้องย้อนไปหาผังในคลังใหม่ (หน้านั้นมี `TarotFlow` ที่อ่าน `auth_success` ได้เหมือนหน้าแรก)
 * Google/LINE ทำแบบนี้อยู่แล้วเพราะส่ง URL ปัจจุบันไปเป็น `returnUrl`
 */
function afterEmailAuthUrl(isEn: boolean, query: string): string {
  if (typeof window !== "undefined" && /^(\/en)?\/read\/[a-z0-9-]+\/?$/.test(window.location.pathname)) {
    return `${window.location.pathname}?${query}`;
  }
  return isEn ? `/en?${query}` : `/?${query}`;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "signin",
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
  /**
   * นับครั้งที่ส่งฟอร์ม — ใช้รีเซ็ตกล่อง Turnstile ทุกครั้งหลังส่ง (A4-13)
   * token ของ Turnstile ใช้ได้ครั้งเดียว เดิมรีเซ็ตเฉพาะตอนสลับโหมด พิมพ์รหัสผิดครั้งเดียว
   * แล้วกดใหม่ siteverify ตอบ duplicate ทุกครั้ง ผู้ใช้เข้าใจว่าล็อกอินพัง
   */
  const [turnstileAttempt, setTurnstileAttempt] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  /*
   * ✦ ขาเข้า/ขาออกของหน้าต่างนี้ทำด้วย **CSS keyframes ล้วน** ไม่ใช้ `motion` (INC-0128)
   *
   * ทำไมถึงรื้อออก — เจ้าของแจ้งว่า "เปิดในมือถือกระพริบมาก":
   *   1. `motion` คือ chunk 40 KB gzip ที่ต้องโหลด+คอมไพล์ให้เสร็จก่อนหน้าต่างจะโผล่ได้
   *      บนมือถือที่ CPU ช้ากว่าเดสก์ท็อป 4–6 เท่า ช่วงนี้คือ "แตะแล้วจอนิ่งไปครึ่งวินาที
   *      แล้วค่อยเด้งพรึ่บ" — วัดได้ว่ามีเฟรมยาว 150–180ms คาอยู่ตรงนั้น
   *   2. อนิเมชันฝั่ง JS ต้องจอง/คืนเลเยอร์ compositor เองทุกครั้ง จังหวะจอง-คืนนี่เอง
   *      ที่เห็นเป็นแสงวาบบนมือถือบางรุ่น · CSS keyframes ที่แตะแค่ opacity/transform
   *      เบราว์เซอร์ยกให้ compositor ทำตั้งแต่ต้นจนจบ ไม่มีจังหวะสลับ
   *   3. ได้ของแถม: chunk ของหน้าต่างเข้าสู่ระบบเหลือแค่โค้ดตัวเอง ไม่ลาก `motion` มาด้วย
   *
   * ⚠️ ห้ามเปลี่ยนกลับไปใช้ `motion` ที่ไฟล์นี้ · ถ้าจะแก้จังหวะ ให้แก้ที่คีย์เฟรมใน globals.css
   * ⚠️ `closeDelayMs` ต้องเท่ากับความยาวของ `.anim-scrim-out` / `.anim-modal-sink` เสมอ
   *    ถ้าไม่เท่า หน้าต่างจะหายวับก่อนอนิเมชันจบ (บทเรียนเดิม INC-0126 ในรูปแบบใหม่)
   */
  const closeDelayMs = 170;
  const [isMounted, setIsMounted] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setIsClosing(false);
      setIsMounted(true);
      return;
    }
    if (!isMounted || closeTimerRef.current) return;
    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, closeDelayMs);
  }, [isOpen, isMounted]);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  // เปิดหน้าต่างครั้งใหม่ต้องเคารพโหมดที่ผู้เรียกส่งมา
  // (มาจากกำแพงสิทธิ์ = ควรเปิดแท็บ "สมัครสมาชิก" ให้เลย ไม่ใช่ให้ผู้ใช้หาเอง)
  useEffect(() => {
    if (isOpen) setMode(initialMode);
  }, [isOpen, initialMode]);

  // เก็บ onClose ล่าสุดไว้ใน ref เพื่อไม่ต้องใส่ใน dependency ของ effect ด้านล่าง (ISSUE-029)
  // ผู้เรียกส่ง arrow function ใหม่ทุกเรนเดอร์ (`onClose={() => ...}`)
  // ถ้าใส่ไว้ใน deps -> effect เปิด/ปิดใหม่ทุกครั้งที่พ่อเรนเดอร์ และดึงโฟกัสออกจาก input ขณะพิมพ์
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Esc ปิด · ล็อกการเลื่อนพื้นหลัง · ขังโฟกัสไว้ในหน้าต่าง (a11y — ของเดิมไม่มีเลย)
  useEffect(() => {
    if (!isMounted) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
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
  }, [isMounted]);

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
    const currentPath = typeof window !== "undefined"
      ? (window.location.pathname + window.location.search)
      : (isEn ? "/en" : "/");
    const returnUrl = encodeURIComponent(currentPath || (isEn ? "/en" : "/"));
    window.location.href = `/api/auth/google?returnUrl=${returnUrl}`;
  };

  const handleLoginLine = () => {
    soundManager.playCardSelectSound();
    const currentPath = typeof window !== "undefined"
      ? (window.location.pathname + window.location.search)
      : (isEn ? "/en" : "/");
    const returnUrl = encodeURIComponent(currentPath || (isEn ? "/en" : "/"));
    window.location.href = `/api/auth/line?returnUrl=${returnUrl}`;
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
        window.location.href = afterEmailAuthUrl(isEn, "auth_success=1");
      } else if (mode === "signup") {
        const data = await postJson(
          "/api/auth/email/signup",
          { email: emailValue, password, name: nameValue, turnstileToken: turnstileToken ?? "" },
          isEn ? "Unable to create account" : "ไม่สามารถสร้างบัญชีได้"
        );
        soundManager.playCardSelectSound();
        if (data.user) {
          invalidateSessionCache();
          window.location.href = afterEmailAuthUrl(isEn, "auth_success=1&new_user=1");
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
      // token ถูกใช้ไปแล้วไม่ว่าผลจะเป็นอะไร — ขอใบใหม่ทุกครั้ง (เปิดด่านอยู่เท่านั้น)
      if (turnstileToken !== null) {
        setTurnstileToken("");
        setTurnstileAttempt((n) => n + 1);
      }
    }
  };

  if (!isMounted) return null;

  return (
    <div
      className={`fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-4 modal-scrim gpu-layer ${
        isClosing ? "anim-scrim-out" : "anim-scrim-in"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        /* 🪟 แผงกระจกของหน้าต่างลอย — ต้องเป็น `.altar-modal` (ทึบ 0.97) ไม่ใช่
           `.altar-card-porcelain` (0.62) เพราะแผงนี้วางอยู่บน `.modal-scrim` ที่เกือบดำ
           ถ้าโปร่งเท่าการ์ดในหน้า สีเข้มจะซึมขึ้นมาจนคอนทราสต์ตัวหนังสือตกทั้งใบ */
        className={`altar-modal !rounded-xl w-full max-w-md max-h-[calc(100svh-1.5rem)] sm:max-h-[calc(100svh-2rem)] flex flex-col relative overflow-hidden text-ink ${
          isClosing ? "anim-modal-sink" : "anim-modal-rise"
        }`}
      >
          {/* Close button with high-contrast luxury border */}
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? "Close authentication window" : "ปิดหน้าต่างเข้าสู่ระบบ"}
            /*
             * 🎯 T-31: 44×44 ไม่ใช่ 32×32 — นี่คือ modal ที่คนเจอบ่อยที่สุด (ผู้ใช้ที่ยังไม่ล็อกอิน
             * ทุกคนเจอ) และทราฟฟิกเว็บนี้เป็นมือถือ 85%+ · ด่าน tap-target เดิมตั้งเพดานไว้ 24px
             * จึงปล่อยผ่านมาตลอด · ขนาดไอคอนคงเดิม ขยายเฉพาะพื้นที่กด (ตรงกับ CardZoomModal)
             */
            className="glass-chip tap-overlay-y absolute top-4 right-4 z-10 w-11 h-11 text-ink hover:text-gold-ink text-xs flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>

          {/* ชั้นเนื้อหาที่เลื่อนได้ — `min-h-0` จำเป็นเพราะ flex item ปกติหดต่ำกว่าเนื้อหาไม่ได้ (INC: ล็อกอินตกขอบจอ) */}
          <div className="flex flex-col items-center min-h-0 overflow-y-auto overscroll-contain p-6 sm:p-8">

          {/* Seer Brand Logo Frame */}
          <div className="relative mb-3.5 group select-none">
            {/* Circular Seer Brand Logo */}
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-2 border-line overflow-hidden relative flex-shrink-0 bg-canvas group-hover:scale-105 transition duration-300 shadow-xs">
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
          <div className="space-y-1 text-center mb-4">
            <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-serif-th font-bold text-ink"><ThaiPhrases>
              {mode === "signin" && (isEn ? "Sign In" : "เข้าสู่ระบบ")}
              {mode === "signup" && (isEn ? "Create Free Account" : "สมัครสมาชิกฟรี")}
              {mode === "forgot" && (isEn ? "Reset Password" : "ตั้งรหัสผ่านใหม่ (ลืมรหัสผ่าน)")}
            </ThaiPhrases></h3>
            {mode === "forgot" && (
              <p className="text-xs text-muted font-serif-th max-w-xs mx-auto leading-relaxed">
                {isEn
                  ? "Enter your registered email address to receive a secure password reset link"
                  : "ระบุอีเมลของคุณ เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่อย่างปลอดภัย"}
              </p>
            )}
          </div>

          {/* Segmented Mode Switcher (Tab System) */}
          {mode !== "forgot" && (
            <div className="glass-chip w-full grid grid-cols-2 p-1 mb-4">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`tap-overlay-y py-2 rounded-full text-xs font-serif-th font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signin" ? "btn-gold-glass" : "text-muted hover:text-ink"
                }`}
              >
                
                <span>{isEn ? "Sign In" : "เข้าสู่ระบบ"}</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`tap-overlay-y py-2 rounded-full text-xs font-serif-th font-bold transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signup" ? "btn-gold-glass" : "text-muted hover:text-ink"
                }`}
              >
                
                <span>{isEn ? "Register" : "สมัครสมาชิก"}</span>
              </button>
            </div>
          )}

          {/* Feedback messages */}
          <div aria-live="polite" className="w-full">
            {errorMsg && (
              <div className="w-full mb-3 p-3 rounded-xl bg-err-wash border border-line text-err text-xs font-serif-th text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="w-full mb-3 p-3 rounded-xl bg-[#EBF3ED] border border-line text-ok text-xs font-serif-th text-center">
                {successMsg}
              </div>
            )}
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3.5">
            {mode === "signup" && (
              <div className="space-y-1.5 text-left">
                <label htmlFor="auth-name" className="block text-[13px] font-semibold text-ink font-serif-th">
                  {isEn ? "Name or Nickname" : "ชื่อหรือนามแฝง"}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gold pointer-events-none">
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
                    className="glass-field w-full h-11 pl-9 pr-3.5 rounded-xl border border-line-interactive text-ink text-xs font-serif-th placeholder-muted/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label htmlFor="auth-email" className="block text-[13px] font-semibold text-ink font-serif-th">
                {isEn ? "Email Address" : "ที่อยู่อีเมล"}
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-gold pointer-events-none">
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
                  className="glass-field w-full h-11 pl-9 pr-3.5 rounded-xl border border-line-interactive text-ink text-xs font-serif-th placeholder-muted/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label
                    htmlFor="auth-password"
                    className="block text-[13px] font-semibold text-ink font-serif-th"
                  >
                    {isEn ? "Password" : "รหัสผ่าน"}
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[13px] text-gold-ink hover:text-ink hover:underline cursor-pointer font-serif-th font-bold"
                    >
                      {isEn ? "Forgot password?" : "ลืมรหัสผ่าน?"}
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-gold pointer-events-none">
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
                    className="glass-field w-full h-11 pl-9 pr-12 rounded-xl border border-line-interactive text-ink text-xs font-serif-th placeholder-muted/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? (isEn ? "Hide password" : "ซ่อนรหัสผ่าน") : (isEn ? "Show password" : "แสดงรหัสผ่าน")}
                    className="tap-overlay-y absolute right-0 top-0 h-11 px-3.5 flex items-center justify-center text-muted hover:text-ink text-xs font-serif-th cursor-pointer rounded-r-xl transition-colors"
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
                            className={`h-1.5 rounded-full transition duration-300 ${
                              active
                                ? strength.score <= 1
                                  ? "bg-err"
                                  : strength.score === 2
                                    ? "bg-gold"
                                    : "bg-ok"
                                : "bg-inset"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[13px] font-serif-th text-muted">
                      <span>{isEn ? "Strength:" : "ความปลอดภัย:"}</span>
                      <span className={`font-semibold ${strength.colorClass}`}>{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ด่านกันบอท (แสดงเฉพาะเมื่อตั้งค่า Turnstile ครบ) */}
            <TurnstileWidget onToken={setTurnstileToken} resetKey={`${mode}-${turnstileAttempt}`} isEn={isEn} />

            {/* กำลังตรวจ Turnstile อยู่ — บอกผู้ใช้ว่าปุ่มกดไม่ได้เพราะอะไร
                ⚠️ ห่อด้วยกล่องที่จองความสูงไว้ เพราะบรรทัดนี้หายไปเองตอนผู้ใช้ผ่านด่าน
                ถ้าไม่จองที่ ปุ่ม "เข้าสู่ระบบ" จะเลื่อนขึ้นราว 11px พอดีจังหวะที่คนกำลังจะกด
                กล่องนี้มีเฉพาะตอนด่านเปิดจริง (`turnstileToken !== null`) จึงไม่เหลือที่ว่างลอย ๆ
                ให้คนที่ด่านปิด */}
            {turnstileToken !== null && (
              <div className="min-h-[18px]">
                {turnstileToken === "" && !loading && (
                  <p className="text-xs text-muted text-center flex items-center justify-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-full border-2 border-gold border-t-transparent animate-spin" />
                    {isEn ? "Verifying security…" : "กำลังตรวจสอบความปลอดภัย…"}
                  </p>
                )}
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || turnstileToken === ""}
              aria-busy={loading}
              className="btn-gold-glass w-full h-11.5 mt-2 font-bold font-serif-th text-xs sm:text-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>{isEn ? "Processing…" : "กำลังดำเนินการ…"}</span>
              ) : (
                <>
                  
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
            <div className="pt-3 text-xs font-serif-th text-muted">
              {isEn ? "Remembered your password? " : "จำรหัสผ่านได้แล้ว? "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-gold hover:underline font-bold cursor-pointer ml-1"
              >
                {isEn ? "Back to Sign In" : "กลับไปเข้าสู่ระบบ"}
              </button>
            </div>
          )}

          {/* Sanctuary Divider */}
          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-line/40" />
            <span className="px-3 text-[13px] text-muted font-serif-th font-medium">
              {isEn ? "Or continue with" : "หรือเชื่อมต่อทันทีด้วย"}
            </span>
            <div className="flex-1 border-t border-line/40" />
          </div>

          {/* World-Class Luxury Social OAuth Cards */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            {/* Google Sanctuary Card */}
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="glass-chip tap-overlay-y py-2.5 px-3.5 text-ink font-serif-th font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
            >
              <div className="glass-chip w-5 h-5 flex items-center justify-center flex-shrink-0">
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
              <span className="group-hover:text-gold transition-colors">Google</span>
            </button>

            {/* LINE Sanctuary Card */}
            <button
              type="button"
              onClick={handleLoginLine}
              className="tap-overlay-y py-2.5 px-3.5 rounded-full bg-surface hover:bg-[#F0FFF4] border border-[#06C755]/40 hover:border-[#06C755] text-ok font-serif-th font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 active:scale-95 group shadow-xs"
            >
              {/*
                ตราสัญลักษณ์ LINE — ฟองคำพูดเขียว + ตัวอักษร "LINE" สีขาว
                ⚠️ ของเดิมวาดตัวอักษรด้วย path เส้นเดียวที่คัดลอกมาผิด (`s-.5.2-.5.5`
                แทน `s.5.2.5.5`) ตัว N กับ E จึงบิดจนอ่านออกมาเป็นอักษรมั่ว ๆ ในวงกลม
                เขียนใหม่เป็นเส้น (stroke) ทรงเรขาคณิตตรงตามโลโก้จริง — อ่านออกทุกขนาด
                และแก้ง่ายเพราะพิกัดทุกตัวอ่านรู้เรื่อง ไม่ใช่ path ก้อนเดียวที่แก้ไม่ได้
              */}
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#06C755"
                  d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 3.8 7.9 9 8.6.4.1.9.3 1 .6.1.4 0 1.2-.1 1.7-.1.4-.4 1.7-.6 2.1-.2.5-.9 2 .8 1.1 1.8-.9 4.8-2.9 6.5-4.9 4.6-1.5 7.4-4.8 7.4-8.6z"
                />
                <g
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* L */}
                  <path d="M5.9 7.9v4.2h2.2" />
                  {/* I */}
                  <path d="M9.7 7.9v4.2" />
                  {/* N */}
                  <path d="M11.4 12.1V7.9l2.8 4.2V7.9" />
                  {/* E */}
                  <path d="M18.1 7.9h-2.4v4.2h2.4" />
                  <path d="M15.7 10h2.1" />
                </g>
              </svg>
              <span className="group-hover:text-[#06C755] transition-colors">LINE</span>
            </button>
          </div>

          </div>
      </div>
    </div>
  );
};
