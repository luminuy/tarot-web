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
        <div className="w-14 h-14 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 flex items-center justify-center text-2xl mx-auto shadow-lg">
          ✕
        </div>
        <h2 className="text-xl font-bold font-serif-th text-white">ลิงก์ไม่ถูกต้องหรือหมดอายุ</h2>
        <p className="text-xs text-[#cfc8e2] font-serif-th leading-relaxed max-w-sm mx-auto">
          ไม่พบ Token สำหรับการตั้งรหัสผ่านใหม่ หรือลิงก์นี้อาจหมดอายุไปแล้ว (อายุ 15 นาที)
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-block py-2.5 px-6 rounded-xl bg-[#e5c07b] text-[#05040a] font-semibold text-xs font-serif-th shadow hover:bg-[#ffd700] transition-colors"
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
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

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
        <label htmlFor="new-password" className="block text-xs text-[#c4bcd8] font-serif-th">
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

        {/* Strength Meter */}
        {password.length > 0 && (
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
        <label htmlFor="confirm-password" className="block text-xs text-[#c4bcd8] font-serif-th">
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
          className="w-full h-11 px-3.5 rounded-xl bg-[#170e2c] border border-[#e5c07b]/30 text-white text-sm focus:outline-none focus:border-[#ffd700] transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-gradient-to-r from-[#d4a72c] to-[#a27b14] hover:from-[#e5b83d] hover:to-[#b38c25] text-[#0b0714] font-semibold font-serif-th text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
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
    <main className="min-h-screen bg-[#07040d] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1d1238] via-[#0b0617] to-[#05030a] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#0e081e]/98 border-2 border-[#e5c07b]/50 p-6 sm:p-8 shadow-[0_0_80px_rgba(0,0,0,0.95)] relative overflow-hidden text-center space-y-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2a1b4e] to-[#120a24] border border-[#e5c07b]/60 flex items-center justify-center text-2xl shadow-[0_0_30px_rgba(229,192,123,0.3)] mx-auto">
          ✦
        </div>

        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-serif-th font-bold font-mystic-gold">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="text-xs text-[#cfc8e2] font-serif-th leading-relaxed">
            กำหนดรหัสผ่านใหม่สำหรับบัญชี Luminuy Tarot ของคุณ
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-8 text-center text-xs text-[#9c93b8] font-serif-th animate-pulse">
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
