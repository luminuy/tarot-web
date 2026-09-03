"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculatePasswordStrength } from "@/lib/auth/strength";
import { soundManager } from "@/lib/utils/audio";

export const dynamic = "force-dynamic";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const strength = calculatePasswordStrength(password);

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-center text-2xl mx-auto shadow-xs">
          ✕
        </div>
        <h2 className="text-xl font-bold font-serif-th text-[#5A432F]">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
        <p className="text-xs text-[#8C735D] font-serif-th leading-relaxed max-w-sm mx-auto">
          ไม่พบ Token สำหรับการตั้งรหัสผ่านใหม่ หรือลิงก์นี้อาจหมดอายุไปแล้ว (อายุ 15 นาที)
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block py-2.5 px-6 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-semibold text-xs font-serif-th shadow-xs transition-colors"
          >
            ✦ กลับสู่วิหารหลัก
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
      return;
    }

    if (password.length < 10) {
      setErrorMsg("รหัสผ่านต้องมีความยาวอย่างน้อย 10 ตัวอักษร");
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
        throw new Error(data.error || "ไม่สามารถตั้งรหัสผ่านใหม่ได้");
      }

      soundManager.playCardSelectSound();
      router.push("/?pw_reset=1");
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-serif-th text-center">
          {errorMsg}
        </div>
      )}

        <div className="space-y-1">
          <label htmlFor="new-password" className="block text-xs text-[#5A432F] font-serif-th font-semibold">
            รหัสผ่านใหม่
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="อย่างน้อย 10 ตัวอักษร"
              className="w-full h-11 px-3.5 pr-10 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] text-sm focus:outline-none focus:border-[#CD9F5B] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C735D] hover:text-[#5A432F] text-xs cursor-pointer"
            >
              {showPassword ? "ซ่อน" : "ดู"}
            </button>
          </div>

          {/* Strength Meter */}
          {password.length > 0 && (
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
          <label htmlFor="confirm-password" className="block text-xs text-[#5A432F] font-serif-th font-semibold">
            ยืนยันรหัสผ่านใหม่อีกครั้ง
          </label>
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="ระบุรหัสผ่านให้ตรงกัน"
            className="w-full h-11 px-3.5 rounded-xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] text-sm focus:outline-none focus:border-[#CD9F5B] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-semibold font-serif-th text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
        >
          {loading ? (
            <span>กำลังบันทึกรหัสผ่านใหม่…</span>
          ) : (
            <>
              <span>✦</span>
              <span>บันทึกรหัสผ่านใหม่และเข้าสู่ระบบ</span>
            </>
          )}
        </button>
      </form>
    );
  }

  export default function ResetPasswordPage() {
    return (
      <main className="min-h-screen bg-[#FCF0E6] text-[#5A432F] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[1.618rem] bg-[#FFFFFF] border border-[#D6B48D] p-6 sm:p-8 shadow-md relative overflow-hidden text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] text-[#CD9F5B] flex items-center justify-center text-2xl shadow-xs mx-auto">
            ✦
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-serif-th font-bold font-mystic-gold">
              ตั้งรหัสผ่านใหม่
            </h1>
            <p className="text-xs text-[#8C735D] font-serif-th leading-relaxed">
              กำหนดรหัสผ่านใหม่สำหรับบัญชี SeerTarot ของคุณ
            </p>
          </div>

          <Suspense
            fallback={
              <div className="py-8 text-center text-xs text-[#8C735D] font-serif-th animate-pulse">
                กำลังโหลดข้อมูล…
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
  );
}
