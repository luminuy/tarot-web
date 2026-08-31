"use client";

import React, { useState, useEffect } from "react";
import type { UserProfile } from "@/lib/auth/edge-auth";
import { soundManager } from "@/lib/utils/audio";

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({ onOpenAuthModal }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user || null);
        setLoading(false);
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
        className="px-3.5 py-1.5 rounded-xl bg-[#140b24] border border-[#e5c07b]/40 text-[#f5deaa] hover:bg-[#201338] hover:border-[#ffd700] text-xs font-serif-th font-semibold shadow transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
      >
        <span className="text-[#e5c07b]">✦</span>
        <span>เข้าสู่ระบบ</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          soundManager.playCardSelectSound();
          setMenuOpen(!menuOpen);
        }}
        className="flex items-center gap-2 p-1 pl-2.5 pr-2 rounded-xl bg-[#140b24] border border-[#e5c07b]/40 text-xs text-[#f5deaa] hover:border-[#ffd700] transition-all cursor-pointer"
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
      </button>

      {menuOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0e081e] border border-[#e5c07b]/50 p-2 shadow-2xl z-50 space-y-1 font-serif-th text-xs">
          <div className="p-2 border-b border-[#e5c07b]/15 text-[11px] text-[#9c93b8]">
            <span className="block text-[#f5deaa] font-semibold truncate">{user.name}</span>
            <span className="text-[10px] opacity-75">{user.provider === "google" ? "Google Account" : "LINE Account"}</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left p-2 rounded-xl text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer"
          >
            🚪 ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
};
