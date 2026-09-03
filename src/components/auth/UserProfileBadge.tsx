"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, type Variants } from "motion/react";
import { invalidateSessionCache, patchSessionUser, useSessionUser } from "@/lib/auth/use-session";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { describeEntitlement, CHEAPEST_PACKAGE_THB } from "@/lib/entitlement/copy";
import { soundManager } from "@/lib/utils/audio";

const EASE = {
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
} as const;

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
  onOpenPlans?: () => void;
  onBuyCredits?: () => void;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({
  onOpenAuthModal,
  onOpenPlans,
  onBuyCredits,
}) => {
  const { user, loading } = useSessionUser();
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
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
        duration: 0.15,
        ease: EASE_ENTER,
      },
    },
    exit: {
      opacity: 0,
      y: -6,
      transition: {
        duration: 0.1,
        ease: EASE_EXIT,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] text-[#5A432F] text-xs font-serif-th font-bold flex items-center gap-1.5 whitespace-nowrap select-none opacity-80 pointer-events-none">
        <span className="text-[#CD9F5B] text-xs">✦</span>
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
        className="min-h-[38px] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-[#FDF7F0] border border-[#D6B48D] text-[#5A432F] hover:bg-[#FFFFFF] hover:border-[#CD9F5B] hover:text-[#CD9F5B] text-xs font-serif-th font-bold shadow-xs transition-colors duration-150 cursor-pointer flex items-center gap-1.5 whitespace-nowrap active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] select-none"
      >
        <span className="text-[#CD9F5B] text-xs">✦</span>
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
      {/* Refined Luxury Trigger Button */}
      <button
        type="button"
        onClick={toggleMenu}
        className={`min-h-[38px] px-3 sm:px-3.5 py-1.5 rounded-2xl transition-colors duration-150 cursor-pointer flex items-center gap-2 border shadow-xs relative select-none ${
          menuOpen
            ? "bg-[#FFFFFF] border-[#CD9F5B] text-[#CD9F5B] shadow-xs"
            : "bg-[#FDF7F0] text-[#5A432F] hover:text-[#CD9F5B] border-[#D6B48D] hover:border-[#CD9F5B] hover:bg-[#FFFFFF]"
        }`}
        aria-expanded={menuOpen}
        aria-label="โปรไฟล์ผู้ใช้งาน"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-6 h-6 rounded-full object-cover ring-1.5 ring-[#CD9F5B] shadow-xs"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#E4C09F] text-[#5A432F] flex items-center justify-center font-bold text-[10px] ring-1.5 ring-[#D6B48D]">
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
          className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${menuOpen ? "text-[#CD9F5B]" : "text-[#8C735D]"}`}
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </motion.svg>
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#CD9F5B] text-[#FDF7F0] text-[9px] font-bold flex items-center justify-center shadow-xs animate-pulse">
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
            style={{
              WebkitBackfaceVisibility: "hidden",
              backfaceVisibility: "hidden",
            }}
            className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-[1.618rem] bg-[#FDF7F0] border border-[#D6B48D] shadow-lg p-3 z-50 overflow-hidden space-y-2 font-serif-th text-xs"
          >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#CD9F5B]/40 to-transparent -mt-0.5 mb-1" />

            {/* Member Profile Banner */}
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] flex items-center gap-3 shadow-xs">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 rounded-2xl object-cover ring-1.5 ring-[#CD9F5B] shadow-xs flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-[#E4C09F] text-[#5A432F] flex items-center justify-center font-bold text-base ring-1.5 ring-[#D6B48D] flex-shrink-0">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#5A432F] truncate tracking-wide">
                  {user.name}
                </span>
                {user.email && (
                  <span className="block text-[11px] text-[#8C735D] truncate font-sans">
                    {user.email}
                  </span>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#5A432F] bg-[#FCF0E6] border border-[#D6B48D] px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                    <span className="text-[#CD9F5B]">✦</span>
                    <span>{getProviderLabel()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sacred Plan & Quota Management Card */}
            <div className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#D6B48D] shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#CD9F5B] text-xs">✦</span>
                  <span className="text-[11px] font-bold text-[#5A432F] tracking-wide">สิทธิ์และแพ็กเกจ</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#FDF7F0] bg-[#CD9F5B] px-2 py-0.5 rounded-full">
                  {view?.isUnlimited
                    ? "VIP UNLIMITED"
                    : view?.remaining != null
                    ? `เหลือ ${view.remaining}/${view.limit} ครั้ง`
                    : "สมาชิกวิหาร"}
                </span>
              </div>

              <div className="text-[10.5px] text-[#8C735D] leading-relaxed">
                {view?.isUnlimited ? (
                  <p>คุณมีสิทธิ์เปิดไพ่และสนทนาปรึกษาได้ไม่จำกัด</p>
                ) : (
                  <p>
                    เปิดฟรีวันละ {view?.limit ?? 3} ครั้ง{ent?.bonusRemaining ? ` · ญาณพิเศษสะสม +${ent.bonusRemaining} ครั้ง` : ""}
                  </p>
                )}
              </div>

              {/* Primary Gold CTA to Buy Credits / Upgrade */}
              {onBuyCredits && (
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playMenuTapSound();
                    setMenuOpen(false);
                    onBuyCredits();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#CD9F5B] hover:bg-[#B8853E] text-[#FDF7F0] font-serif-th font-bold text-xs shadow-xs hover:scale-[1.01] transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.98]"
                >
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>ซื้อรอบเพิ่ม / อัปเกรดญาณ</span>
                  </span>
                  <span className="text-[10px] bg-black/15 px-1.5 py-0.5 rounded font-mono font-semibold">
                    เริ่มต้น ฿{CHEAPEST_PACKAGE_THB}
                  </span>
                </button>
              )}

              {/* Secondary Navigation: Compare Plans & Account Hub */}
              <div className="flex items-center justify-between pt-1 border-t border-[#D6B48D]/30 text-[10.5px]">
                {onOpenPlans && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setMenuOpen(false);
                      onOpenPlans();
                    }}
                    className="text-[#CD9F5B] hover:text-[#5A432F] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <span>✦</span>
                    <span>เปรียบเทียบทุกแพลน</span>
                  </button>
                )}
                <Link
                  href="/account"
                  onClick={() => {
                    soundManager.playMenuTapSound();
                    setMenuOpen(false);
                  }}
                  className="text-[#8C735D] hover:text-[#5A432F] transition-colors flex items-center gap-1 ml-auto font-medium"
                >
                  <span>จัดการบัญชี</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Unverified Email Warning Badge */}
            {user.provider === "email" && user.emailVerified === false && (
              <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-[11px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <span className="text-amber-600">✦</span>
                    <span>ยังไม่ยืนยันอีเมล</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="text-[10.5px] text-[#CD9F5B] hover:text-[#5A432F] hover:underline font-bold cursor-pointer transition-colors"
                  >
                    {resendStatus || "ส่งลิงก์ใหม่"}
                  </button>
                </div>
              </div>
            )}

            {/* Pending Reviews Notification Callout */}
            {pendingCount > 0 && (
              <div className="p-2.5 rounded-2xl bg-[#CD9F5B]/15 border border-[#CD9F5B]/30 text-[#5A432F] text-[11px] flex items-center justify-between shadow-xs">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#CD9F5B]">✦</span>
                  <span>รอติดตามผลคำทำนาย</span>
                </span>
                <span className="font-bold bg-[#CD9F5B] text-[#FDF7F0] px-2 py-0.5 rounded-full">
                  {pendingCount} รายการ
                </span>
              </div>
            )}

            {/* Marketing / Follow-up Consent Luxury Toggle */}
            <div className="p-2.5 rounded-2xl bg-[#FCF0E6] border border-[#D6B48D] flex items-center justify-between">
              <div className="pr-2">
                <span className="block text-[11px] font-semibold text-[#5A432F]">รับคำทำนายติดตามผล</span>
                <span className="text-[10px] text-[#8C735D]">แจ้งเตือนเมื่อถึงกำหนดคำทำนายทางอีเมล</span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateConsent(!user.marketingConsent)}
                className={`w-10 h-6 rounded-full transition-all duration-150 p-0.5 relative cursor-pointer flex-shrink-0 border ${
                  user.marketingConsent
                    ? "bg-[#CD9F5B] border-[#CD9F5B] shadow-xs"
                    : "bg-[#D6B48D]/30 border-[#D6B48D]"
                }`}
                aria-label="เปิดปิดการรับอีเมลติดตามผล"
              >
                <motion.div
                  animate={{ x: user.marketingConsent ? 16 : 0 }}
                  transition={{ duration: 0.14, ease: EASE_ENTER }}
                  className={`w-4.5 h-4.5 rounded-full shadow-xs ${
                    user.marketingConsent ? "bg-[#FFFFFF]" : "bg-[#8C735D]"
                  }`}
                />
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-1 border-t border-[#D6B48D]/30">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left p-2.5 rounded-2xl text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-300 transition-all duration-150 cursor-pointer flex items-center justify-between group active:scale-98"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="text-rose-600 group-hover:rotate-12 transition-transform">✦</span>
                  <span>ออกจากระบบ</span>
                </span>
                <span className="text-[11px] text-rose-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
