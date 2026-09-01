"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { soundManager } from "@/lib/utils/audio";

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup" | "forgot";
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = "signin",
}) => {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const strength = calculatePasswordStrength(password);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setErrorMsg(null);
    setSuccessMsg(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await fetch("/api/auth/email/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        }
        soundManager.playCardSelectSound();
        window.location.reload();
      } else if (mode === "signup") {
        const res = await fetch("/api/auth/email/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "ไม่สามารถสร้างบัญชีได้");
        }
        soundManager.playCardSelectSound();
        if (data.user) {
          window.location.reload();
        } else {
          setSuccessMsg(data.message || "ระบบได้ส่งข้อมูลการยืนยันไปยังอีเมลของคุณเรียบร้อยแล้ว");
        }
      } else if (mode === "forgot") {
        const res = await fetch("/api/auth/email/forgot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setSuccessMsg(data.message || "หากมีบัญชีนี้อยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-2xl"
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
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#130b24] via-[#090514] to-[#05030a] border border-[#e5c07b]/40 p-6 sm:p-8 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col items-center relative overflow-hidden z-10 select-none"
        >
          {/* Subtle Ambient Gold Aura */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-radial from-[#e5c07b]/15 via-transparent to-transparent pointer-events-none blur-2xl" />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#120a22] border border-[#e5c07b]/30 text-[#e5c07b] hover:text-[#ffd700] hover:border-[#ffd700] hover:bg-[#1f1138] text-xs flex items-center justify-center transition-all cursor-pointer shadow-md"
          >
            ✕
          </button>

          {/* Sacred Oracle Emblem */}
          <div className="relative mb-3">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#241344] via-[#140a28] to-[#0a0515] border border-[#e5c07b]/60 flex items-center justify-center text-2xl shadow-[0_0_25px_rgba(229,192,123,0.35)] relative group">
              <span className="text-[#ffd700] filter drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]">✦</span>
              {/* Rotating Sacred Dashed Ring */}
              <div className="absolute -inset-1.5 rounded-full border border-dashed border-[#e5c07b]/30 animate-[spin_60s_linear_infinite] pointer-events-none" />
            </div>
          </div>

          {/* Header Typography */}
          <div className="space-y-1 text-center mb-5">
            <h3
              id="auth-modal-title"
              className="text-xl sm:text-2xl font-serif-th font-bold bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] bg-clip-text text-transparent"
            >
              {mode === "signin" && "เข้าสู่วิหารศักดิ์สิทธิ์"}
              {mode === "signup" && "สมัครสมาชิกร่วมผูกดวง"}
              {mode === "forgot" && "ฟื้นฟูดวงชะตา (ลืมรหัสผ่าน)"}
            </h3>
            <p className="text-xs text-[#a79cc2] font-serif-th max-w-xs mx-auto leading-relaxed">
              {mode === "signin" && "บันทึกประวัติการเปิดไพ่ ซิงก์ดวงข้ามอุปกรณ์ และรับสิทธิ์รายสัปดาห์"}
              {mode === "signup" && "สร้างบัญชีใหม่เพื่อรับโบนัสเปิดไพ่ฟรี และบันทึกคำทำนายถาวร"}
              {mode === "forgot" && "ระบุอีเมลเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่อย่างปลอดภัย"}
            </p>
          </div>

          {/* Segmented Mode Switcher (Tab System) */}
          {mode !== "forgot" && (
            <div className="w-full grid grid-cols-2 p-1 rounded-2xl bg-[#090514] border border-[#e5c07b]/25 mb-4">
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`py-2 rounded-xl text-xs font-serif-th font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signin"
                    ? "bg-gradient-to-r from-[#e5c07b]/25 via-[#ffd700]/25 to-[#c59b27]/25 border border-[#ffd700]/60 text-[#ffd700] shadow-[0_0_12px_rgba(229,192,123,0.25)]"
                    : "text-[#9c93b8] hover:text-[#f5deaa]"
                }`}
              >
                <span>✦</span>
                <span>เข้าสู่ระบบ</span>
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`py-2 rounded-xl text-xs font-serif-th font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-[#e5c07b]/25 via-[#ffd700]/25 to-[#c59b27]/25 border border-[#ffd700]/60 text-[#ffd700] shadow-[0_0_12px_rgba(229,192,123,0.25)]"
                    : "text-[#9c93b8] hover:text-[#f5deaa]"
                }`}
              >
                <span>✨</span>
                <span>สมัครสมาชิก</span>
              </button>
            </div>
          )}

          {/* Feedback messages */}
          <div aria-live="polite" className="w-full">
            {errorMsg && (
              <div className="w-full mb-3 p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-rose-200 text-xs font-serif-th text-center shadow-lg">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="w-full mb-3 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-serif-th text-center shadow-lg">
                {successMsg}
              </div>
            )}
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3.5">
            {mode === "signup" && (
              <div className="space-y-1.5 text-left">
                <label htmlFor="auth-name" className="block text-[11px] font-semibold text-[#e5c07b] font-serif-th">
                  ชื่อหรือนามแฝง
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#9c93b8] text-xs pointer-events-none">👤</span>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ผู้แสวงหาคำตอบ"
                    className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-[#0b0617] border border-[#e5c07b]/25 text-[#f5deaa] text-xs font-serif-th placeholder-[#9c93b8]/50 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/40 transition-all shadow-inner"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label htmlFor="auth-email" className="block text-[11px] font-semibold text-[#e5c07b] font-serif-th">
                ที่อยู่อีเมล
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-[#9c93b8] text-xs pointer-events-none">✉️</span>
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 pl-9 pr-3.5 rounded-xl bg-[#0b0617] border border-[#e5c07b]/25 text-[#f5deaa] text-xs font-serif-th placeholder-[#9c93b8]/50 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/40 transition-all shadow-inner"
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="block text-[11px] font-semibold text-[#e5c07b] font-serif-th">
                    รหัสผ่าน
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-[11px] text-[#e5c07b] hover:text-[#ffd700] hover:underline cursor-pointer font-serif-th"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-[#9c93b8] text-xs pointer-events-none">🗝️</span>
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "อย่างน้อย 10 ตัวอักษร" : "••••••••••"}
                    className="w-full h-11 pl-9 pr-12 rounded-xl bg-[#0b0617] border border-[#e5c07b]/25 text-[#f5deaa] text-xs font-serif-th placeholder-[#9c93b8]/50 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700]/40 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    className="absolute right-3 text-[#9c93b8] hover:text-[#ffd700] text-xs font-serif-th cursor-pointer px-1 py-0.5 rounded transition-colors"
                  >
                    {showPassword ? "ซ่อน" : "ดู"}
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
                                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                  : strength.score === 2
                                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                  : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                : "bg-white/10"
                            }`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-serif-th text-[#9c93b8]">
                      <span>ความปลอดภัย:</span>
                      <span className={`font-semibold ${strength.colorClass}`}>{strength.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-11.5 mt-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] text-[#07050e] font-bold font-serif-th text-xs sm:text-sm shadow-[0_0_25px_rgba(229,192,123,0.4)] hover:opacity-95 hover:shadow-[0_0_30px_rgba(229,192,123,0.5)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span>กำลังดำเนินการ…</span>
              ) : (
                <>
                  <span className="text-sm">✦</span>
                  <span>
                    {mode === "signin" && "เข้าสู่ระบบด้วยอีเมล"}
                    {mode === "signup" && "ยืนยันการสมัครสมาชิก"}
                    {mode === "forgot" && "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher Return Link for Forgot Password */}
          {mode === "forgot" && (
            <div className="pt-3 text-xs font-serif-th text-[#9c93b8]">
              จำรหัสผ่านได้แล้ว?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="text-[#ffd700] hover:underline font-semibold cursor-pointer ml-1"
              >
                กลับไปเข้าสู่ระบบ
              </button>
            </div>
          )}

          {/* Sanctuary Divider */}
          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-[#e5c07b]/15" />
            <span className="px-3 text-[10px] text-[#9c93b8] font-serif-th tracking-wider">
              หรือเชื่อมต่อทันทีด้วย
            </span>
            <div className="flex-1 border-t border-[#e5c07b]/15" />
          </div>

          {/* World-Class Luxury Social OAuth Cards */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            {/* Google Sanctuary Card */}
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="py-2.5 px-3.5 rounded-xl bg-[#0c081a] hover:bg-[#160f2c] border border-[#e5c07b]/25 hover:border-[#ffd700]/60 text-[#f5deaa] font-serif-th font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
            >
              <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
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
              <span className="group-hover:text-white transition-colors">Google</span>
            </button>

            {/* LINE Sanctuary Card */}
            <button
              type="button"
              onClick={handleLoginLine}
              className="py-2.5 px-3.5 rounded-xl bg-[#08170e] hover:bg-[#0e2417] border border-[#06C755]/35 hover:border-[#06C755]/70 text-[#b4f3cd] font-serif-th font-semibold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 group"
            >
              <div className="w-5 h-5 rounded-full bg-[#06C755] flex items-center justify-center flex-shrink-0 shadow-sm text-white">
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 3.8 7.9 9 8.6.4.1.9.3 1 .6.1.4 0 1.2-.1 1.7-.1.4-.4 1.7-.6 2.1-.2.5-.9 2 .8 1.1 1.8-.9 4.8-2.9 6.5-4.9 4.6-1.5 7.4-4.8 7.4-8.6zm-14.7 2.7H6.5c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v4.5h2.3c.3 0 .5.2.5.5s-.2.5-.5.5zm2.6-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v5zm4.8 0c0 .3-.2.5-.5.5-.2 0-.4-.1-.5-.3L13.8 9v3.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s-.5.2-.5.5v5zm3.7-3.2h-2.3v1.4h2.3c.3 0 .5.2.5.5s-.2.5-.5.5h-2.8c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5h2.8c.3 0 .5.2.5.5s-.2.5-.5.5h-2.3v1.3h2.3c.3 0 .5.2.5.5s-.2.5-.5.5z" />
                </svg>
              </div>
              <span className="group-hover:text-white transition-colors">LINE</span>
            </button>
          </div>

          {/* Cryptographic Assurance & PDPA Footnote */}
          <div className="mt-5 text-[10px] text-[#7d7398] font-serif-th text-center flex items-center justify-center gap-1 opacity-80">
            <span>🔒</span>
            <span>เข้ารหัสลับความปลอดภัยระดับสูงตามมาตรฐานสากล</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
