"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { invalidateSessionCache, patchSessionUser, useSessionUser } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";

const EASE = {
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({ onOpenAuthModal }) => {
  const { user, loading } = useSessionUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when receiving close event from another open menu
  useEffect(() => {
    const handleClose = (e: Event) => {
      const customEvent = e as CustomEvent<{ except?: string }>;
      if (customEvent.detail?.except !== "user-badge") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("tarot:close-menus", handleClose);
    return () => window.removeEventListener("tarot:close-menus", handleClose);
  }, []);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!user) {
      setPendingCount(0);
      return;
    }
    let alive = true;
    fetch("/api/journal/pending-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((res) => {
        if (alive && typeof res?.count === "number") setPendingCount(res.count);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user]);

  const toggleMenu = () => {
    soundManager.playMenuTapSound();
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        window.dispatchEvent(
          new CustomEvent("tarot:close-menus", { detail: { except: "user-badge" } })
        );
      }
      return next;
    });
  };

  const handleLogout = async () => {
    soundManager.playMenuTapSound();
    setMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // ต่อเซิร์ฟเวอร์ไม่ได้ — ยังต้องล้างสถานะฝั่งหน้าเว็บและรีโหลดอยู่ดี
    }
    // ล้างแคชก่อนรีโหลด ไม่งั้นหน้าที่โหลดใหม่อาจหยิบผู้ใช้คนเดิมจากแคชในหน่วยความจำ
    invalidateSessionCache();
    window.location.reload();
  };

  const handleUpdateConsent = async (consent: boolean) => {
    soundManager.playMenuTapSound();
    await fetch("/api/account/consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ marketing: consent }),
    }).catch(() => {});
    patchSessionUser({ marketingConsent: consent });
  };

  const handleResendVerify = async () => {
    soundManager.playMenuTapSound();
    setResendStatus("กำลังส่ง…");
    try {
      const res = await fetch("/api/auth/email/resend", { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
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

  const EASE_ENTER: [number, number, number, number] = [0.16, 1, 0.3, 1];
  const EASE_EXIT: [number, number, number, number] = [0.4, 0, 1, 1];

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: -8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.16,
        ease: EASE_ENTER,
        staggerChildren: 0.025,
        delayChildren: 0.01,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: {
        duration: 0.09,
        ease: EASE_EXIT,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: -4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.14, ease: EASE_ENTER },
    },
  };

  if (loading) {
    return (
      <div className="min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#140b24]/90 border border-[#e5c07b]/35 text-[#f5deaa] text-xs font-serif-th font-bold flex items-center gap-1.5 whitespace-nowrap select-none opacity-80 pointer-events-none">
        <span className="text-[#ffd700] text-xs">✦</span>
        <span>เข้าสู่ระบบ</span>
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={() => {
          soundManager.playMenuTapSound();
          onOpenAuthModal();
        }}
        className="min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#140b24]/90 border border-[#e5c07b]/35 text-[#f5deaa] hover:bg-[#201338] hover:border-[#ffd700] hover:text-[#ffd700] hover:shadow-[0_0_15px_rgba(229,192,123,0.25)] text-xs font-serif-th font-bold shadow transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] select-none"
      >
        <span className="text-[#ffd700] text-xs">✦</span>
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
    <div className="relative select-none" ref={containerRef}>
      {/* Refined Luxury Obsidian-Gold Trigger Button */}
      <button
        type="button"
        onClick={toggleMenu}
        className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-2xl transition-colors duration-150 cursor-pointer flex items-center gap-2 border shadow-sm relative select-none ${
          menuOpen
            ? "bg-[#201138] border-[#ffd700] text-[#ffd700] shadow-[0_0_18px_rgba(229,192,123,0.32),inset_0_1px_1px_rgba(255,215,0,0.3)]"
            : "bg-[#100b20]/90 text-[#f5deaa] hover:text-[#ffd700] border-[#e5c07b]/25 hover:border-[#ffd700]/60 hover:bg-[#181033] hover:shadow-[0_0_15px_rgba(229,192,123,0.2)]"
        }`}
        aria-expanded={menuOpen}
        aria-label="โปรไฟล์ผู้ใช้งาน"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover ring-1.5 ring-[#ffd700]/70 shadow-[0_0_8px_rgba(229,192,123,0.4)]"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#201338] text-[#ffd700] flex items-center justify-center font-bold text-[10px] ring-1.5 ring-[#ffd700]/50">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <span className="font-serif-th font-bold text-xs max-w-[85px] sm:max-w-[120px] truncate">{user.name}</span>
        <motion.svg
          viewBox="0 0 20 20"
          fill="currentColor"
          animate={{ rotate: menuOpen ? 180 : 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ transformOrigin: "50% 48%" }}
          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${menuOpen ? "text-[#ffd700]" : "text-[#c59b27]"}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </motion.svg>
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ffd700] text-[#05040a] text-[9px] font-bold flex items-center justify-center shadow-[0_0_8px_rgba(255,215,0,0.6)] animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* World-Class Obsidian Gold Floating Member Card */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="user-profile-panel"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ willChange: "transform, opacity" }}
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-3xl bg-[#0c071a] border border-[#e5c07b]/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.15)] p-3 z-50 overflow-hidden space-y-2 font-serif-th text-xs"
          >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#ffd700]/40 to-transparent -mt-0.5 mb-1" />

            {/* Member Profile Banner */}
            <motion.div variants={itemVariants} className="p-3 rounded-2xl bg-gradient-to-r from-[#1c1033] to-[#120a22] border border-[#e5c07b]/25 flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-1.5 ring-[#ffd700]/70 shadow-[0_0_12px_rgba(229,192,123,0.3)] flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-[#201338] text-[#ffd700] flex items-center justify-center font-bold text-base ring-1.5 ring-[#ffd700]/60 flex-shrink-0">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#f5deaa] truncate tracking-wide">
                  {user.name}
                </span>
                {user.email && (
                  <span className="block text-[11px] text-[#9c93b8] truncate font-sans">
                    {user.email}
                  </span>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#ffd700] bg-[#ffd700]/10 border border-[#ffd700]/25 px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                    <span>✦</span>
                    <span>{getProviderLabel()}</span>
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Unverified Email Warning Badge */}
            {user.provider === "email" && user.emailVerified === false && (
              <motion.div variants={itemVariants} className="p-2.5 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <span className="text-amber-400">✦</span>
                    <span>ยังไม่ยืนยันอีเมล</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="text-[10.5px] text-[#ffd700] hover:text-[#fff] hover:underline font-bold cursor-pointer transition-colors"
                  >
                    {resendStatus || "ส่งลิงก์ใหม่"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Pending Reviews Notification Callout */}
            {pendingCount > 0 && (
              <motion.div variants={itemVariants} className="p-2.5 rounded-2xl bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] text-[11px] flex items-center justify-between shadow-[0_0_12px_rgba(255,215,0,0.1)]">
                <span className="flex items-center gap-1.5">
                  <span>✦</span>
                  <span>รอติดตามผลคำทำนาย</span>
                </span>
                <span className="font-bold bg-[#ffd700]/20 px-2 py-0.5 rounded-full">
                  {pendingCount} รายการ
                </span>
              </motion.div>
            )}

            {/* Marketing / Follow-up Consent Luxury Toggle */}
            <motion.div variants={itemVariants} className="p-2.5 rounded-2xl bg-[#160c2b]/70 border border-[#e5c07b]/15 flex items-center justify-between">
              <div className="pr-2">
                <span className="block text-[11px] font-semibold text-[#f5deaa]">รับคำทำนายติดตามผล</span>
                <span className="text-[10px] text-[#9c93b8]">แจ้งเตือนเมื่อถึงกำหนดคำทำนายทางอีเมล</span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateConsent(!user.marketingConsent)}
                className={`w-10 h-6 rounded-full transition-all duration-150 p-0.5 relative cursor-pointer flex-shrink-0 border ${
                  user.marketingConsent
                    ? "bg-[#d4af37] border-[#ffd700] shadow-[0_0_12px_rgba(212,175,55,0.4)]"
                    : "bg-white/10 border-white/10 hover:bg-white/15"
                }`}
                aria-label="เปิดปิดการรับอีเมลติดตามผล"
              >
                <motion.div
                  animate={{ x: user.marketingConsent ? 16 : 0 }}
                  transition={{ duration: 0.14, ease: EASE_ENTER }}
                  className={`w-4.5 h-4.5 rounded-full shadow-md ${
                    user.marketingConsent ? "bg-[#090514]" : "bg-[#a99fc2]"
                  }`}
                />
              </button>
            </motion.div>

            {/* Logout Action */}
            <motion.div variants={itemVariants} className="pt-1 border-t border-[#e5c07b]/15">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left p-2.5 rounded-2xl text-rose-400 hover:text-rose-200 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-all duration-150 cursor-pointer flex items-center justify-between group active:scale-98"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="text-rose-400 group-hover:rotate-12 transition-transform">✦</span>
                  <span>ออกจากระบบ</span>
                </span>
                <span className="text-[11px] text-rose-400/60 group-hover:text-rose-300 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
