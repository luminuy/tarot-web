"use client";

import React, { useState, useEffect } from "react";
import type { UserProfile } from "@/lib/auth/edge-auth";
import { soundManager } from "@/lib/utils/audio";

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({ onOpenAuthModal }) => {
  const [user, setUser] = useState<
    (UserProfile & { marketingConsent?: boolean; emailVerified?: boolean }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
        if (data.user) {
          fetch("/api/journal/pending-count")
            .then((r) => r.json())
            .then((res) => {
              if (res.count && typeof res.count === "number") {
                setPendingCount(res.count);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    soundManager.playCardSelectSound();
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMenuOpen(false);
    window.location.reload();
  };

  const handleUpdateConsent = async (consent: boolean) => {
    soundManager.playCardSelectSound();
    await fetch("/api/account/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketing: consent }),
    }).catch(() => {});
    if (user) {
      setUser({ ...user, marketingConsent: consent });
    }
  };

  const handleResendVerify = async () => {
    soundManager.playCardSelectSound();
    setResendStatus("กำลังส่ง…");
    try {
      const res = await fetch("/api/auth/email/resend", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResendStatus("✓ ส่งแล้ว");
        setTimeout(() => setResendStatus(null), 3000);
      } else {
        setResendStatus(data.error || "ส่งไม่สำเร็จ");
      }
    } catch {
      setResendStatus("เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return <div className="w-20 h-8 rounded-xl bg-white/5 animate-pulse" />;
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          soundManager.playCardSelectSound();
          onOpenAuthModal();
        }}
        className="min-h-[36px] px-3 sm:px-3.5 py-1.5 rounded-xl bg-[#140b24] border border-[#e5c07b]/40 text-[#f5deaa] hover:bg-[#201338] hover:border-[#ffd700] text-xs font-serif-th font-semibold shadow transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
      >
        <span className="text-[#e5c07b]">✦</span>
        <span>เข้าสู่ระบบ</span>
      </button>
    );
  }

  const getProviderLabel = () => {
    if (user.provider === "google") return "Google Account";
    if (user.provider === "line") return "LINE Account";
    return "บัญชีอีเมล";
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          soundManager.playCardSelectSound();
          setMenuOpen(!menuOpen);
        }}
        className="flex items-center gap-2 p-1 pl-2.5 pr-2 rounded-xl bg-[#140b24] border border-[#e5c07b]/40 text-xs text-[#f5deaa] hover:border-[#ffd700] transition-all cursor-pointer relative"
      >
        <span className="font-serif-th font-semibold max-w-[100px] truncate">{user.name}</span>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover border border-[#e5c07b]/60"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#201338] text-[#e5c07b] flex items-center justify-center font-bold text-[10px] border border-[#e5c07b]/40">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ffd700] text-[#05040a] text-[9px] font-bold flex items-center justify-center shadow-md animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0e081e] border border-[#e5c07b]/50 p-2 shadow-2xl z-50 space-y-1 font-serif-th text-xs">
          <div className="p-2 border-b border-[#e5c07b]/15 text-[11px] text-[#9c93b8]">
            <span className="block text-[#f5deaa] font-semibold truncate">{user.name}</span>
            <span className="text-[10px] opacity-75">{getProviderLabel()}</span>
          </div>

          {/* Unverified Email Warning Badge */}
          {user.provider === "email" && user.emailVerified === false && (
            <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span>⚠️ ยังไม่ยืนยันอีเมล</span>
                <button
                  type="button"
                  onClick={handleResendVerify}
                  className="text-[10px] text-[#ffd700] hover:underline font-semibold cursor-pointer"
                >
                  {resendStatus || "ส่งลิงก์ใหม่"}
                </button>
              </div>
            </div>
          )}

          {pendingCount > 0 && (
            <div className="p-2 rounded-xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[11px] flex items-center justify-between">
              <span>✦ รอติดตามผล</span>
              <span className="font-bold">{pendingCount} รายการ</span>
            </div>
          )}

          <div className="p-2 text-[11px] text-[#c4b9db] border-b border-[#e5c07b]/10 flex items-center justify-between">
            <span>รับอีเมลติดตามผล</span>
            <button
              type="button"
              onClick={() => handleUpdateConsent(!user.marketingConsent)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-all ${
                user.marketingConsent
                  ? "bg-emerald-950/80 text-emerald-300 border border-emerald-500/40"
                  : "bg-white/5 text-stone-400 border border-stone-600/30 hover:text-stone-200"
              }`}
            >
              {user.marketingConsent ? "✓ เปิดรับ" : "ปิด"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>✦</span>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
};
