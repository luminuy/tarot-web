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
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          className="w-full max-w-md rounded-3xl bg-[#0e081e]/98 border-2 border-[#e5c07b]/50 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.95)] flex flex-col items-center relative overflow-hidden"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-[#1b1230] border border-[#e5c07b]/30 text-[#e5c07b] hover:bg-[#e5c07b] hover:text-[#05040a] text-sm flex items-center justify-center transition-all cursor-pointer"
          >
            ✕
          </button>

          {/* Icon / Brand Aura */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2a1b4e] to-[#120a24] border border-[#e5c07b]/60 flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(229,192,123,0.3)] mb-4">
            ✦
          </div>

          <div className="space-y-1 text-center mb-6">
            <h3 id="auth-modal-title" className="text-xl sm:text-2xl font-serif-th font-bold font-mystic-gold">
              {mode === "signin" && "เข้าสู่วิหารศักดิ์สิทธิ์"}
              {mode === "signup" && "สมัครสมาชิกร่วมผูกดวง"}
              {mode === "forgot" && "ลืมรหัสผ่าน"}
            </h3>
            <p className="text-xs text-[#cfc8e2] font-serif-th max-w-xs mx-auto leading-relaxed">
              {mode === "signin" && "เข้าสู่ระบบเพื่อบันทึกประวัติการดูดวงและซิงก์ดวงชะตาข้ามอุปกรณ์"}
              {mode === "signup" && "สร้างบัญชีผู้ใช้ใหม่ด้วยอีเมลเพื่อเริ่มต้นบันทึกคำทำนาย"}
              {mode === "forgot" && "ระบุอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่"}
            </p>
          </div>

          {/* Feedback messages */}
          <div aria-live="polite" className="w-full mb-3">
            {errorMsg && (
              <div className="w-full p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-serif-th text-center">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="w-full p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-serif-th text-center">
                {successMsg}
              </div>
            )}
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-3.5">
            {mode === "signup" && (
              <div className="space-y-1 text-left">
                <label htmlFor="auth-name" className="block text-xs text-[#c4bcd8] font-serif-th">
                  ชื่อหรือนามแฝง
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="เช่น ผู้แสวงหาคำตอบ"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
                />
              </div>
            )}

            <div className="space-y-1 text-left">
              <label htmlFor="auth-email" className="block text-xs text-[#c4bcd8] font-serif-th">
                ที่อยู่อีเมล
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 px-3.5 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
              />
            </div>

            {mode !== "forgot" && (
              <div className="space-y-1 text-left">
                <div className="flex justify-between items-center">
                  <label htmlFor="auth-password" className="block text-xs text-[#c4bcd8] font-serif-th">
                    รหัสผ่าน
                  </label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-[#e5c07b] hover:underline cursor-pointer font-serif-th"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "signup" ? "อย่างน้อย 10 ตัวอักษร" : "••••••••••"}
                    className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9c93b8] hover:text-white text-xs cursor-pointer"
                  >
                    {showPassword ? "ซ่อน" : "ดู"}
                  </button>
                </div>

                {/* Password Strength meter on signup */}
                {mode === "signup" && password.length > 0 && (
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
            )}

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4a72c] to-[#a27b14] hover:from-[#e5b83d] hover:to-[#b38c25] text-[#0b0714] font-semibold font-serif-th text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <span>กำลังดำเนินการ…</span>
              ) : (
                <>
                  <span>✦</span>
                  <span>
                    {mode === "signin" && "เข้าสู่ระบบด้วยอีเมล"}
                    {mode === "signup" && "ยืนยันการสมัครสมาชิก"}
                    {mode === "forgot" && "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Mode Switcher */}
          <div className="pt-3 text-xs font-serif-th text-[#9c93b8]">
            {mode === "signin" && (
              <div>
                ยังไม่มีบัญชี?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="text-[#ffd700] hover:underline font-semibold cursor-pointer ml-1"
                >
                  สมัครสมาชิก
                </button>
              </div>
            )}
            {mode === "signup" && (
              <div>
                มีบัญชีอยู่แล้ว?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className="text-[#ffd700] hover:underline font-semibold cursor-pointer ml-1"
                >
                  เข้าสู่ระบบ
                </button>
              </div>
            )}
            {mode === "forgot" && (
              <div>
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
          </div>

          {/* Divider */}
          <div className="w-full flex items-center my-4">
            <div className="flex-1 border-t border-[#e5c07b]/20" />
            <span className="px-3 text-[11px] text-[#9c93b8] font-serif-th">หรือดำเนินการต่อด้วย</span>
            <div className="flex-1 border-t border-[#e5c07b]/20" />
          </div>

          {/* Social OAuth Login Buttons */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleLoginGoogle}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-medium text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-2 border border-gray-200 active:scale-95"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
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
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={handleLoginLine}
              className="py-2.5 px-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-medium text-xs shadow transition-all cursor-pointer flex items-center justify-center gap-2 border border-[#06C755] active:scale-95"
            >
              <svg className="w-4 h-4 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M24 10.3c0-4.8-5.4-8.8-12-8.8S0 5.5 0 10.3c0 4.3 3.8 7.9 9 8.6.4.1.9.3 1 .6.1.4 0 1.2-.1 1.7-.1.4-.4 1.7-.6 2.1-.2.5-.9 2 .8 1.1 1.8-.9 4.8-2.9 6.5-4.9 4.6-1.5 7.4-4.8 7.4-8.6zm-14.7 2.7H6.5c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v4.5h2.3c.3 0 .5.2.5.5s-.2.5-.5.5zm2.6-.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5s.5.2.5.5v5zm4.8 0c0 .3-.2.5-.5.5-.2 0-.4-.1-.5-.3L13.8 9v3.5c0 .3-.2.5-.5.5s-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5.2 0 .4.1.5.3l2.4 3.7V7.5c0-.3.2-.5.5-.5s.5.2.5.5v5zm3.7-3.2h-2.3v1.4h2.3c.3 0 .5.2.5.5s-.2.5-.5.5h-2.8c-.3 0-.5-.2-.5-.5V7.5c0-.3.2-.5.5-.5h2.8c.3 0 .5.2.5.5s-.2.5-.5.5h-2.3v1.3h2.3c.3 0 .5.2.5.5s-.2.5-.5.5z" />
              </svg>
              <span>LINE</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
