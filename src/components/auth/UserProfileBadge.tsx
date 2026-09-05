"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { invalidateSessionCache, patchSessionUser, useSessionUser } from "@/lib/auth/use-session";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { describeEntitlement, CHEAPEST_PACKAGE_THB } from "@/lib/entitlement/copy";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
  onOpenPlans?: () => void;
  onBuyCredits?: () => void;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({ onOpenAuthModal, onOpenPlans, onBuyCredits }) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
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
        window.dispatchEvent(new CustomEvent("tarot:close-menus", { detail: { except: "user-badge" } }));
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
    setResendStatus(isEn ? "Sending…" : "กำลังส่ง…");
    try {
      const res = await fetch("/api/auth/email/resend", { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendStatus(isEn ? "✓ Sent" : "✓ ส่งแล้ว");
        setTimeout(() => setResendStatus(null), 3000);
      } else {
        setResendStatus(data.error || (isEn ? "Failed to send" : "ส่งไม่สำเร็จ"));
      }
    } catch {
      setResendStatus(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] flex items-center justify-center text-[#635B4E] opacity-60 pointer-events-none select-none">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 sm:w-5 sm:h-5"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
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
        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-[#29261F] hover:border-[#A58A5C] hover:text-[#A58A5C] flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C] select-none"
        aria-label={isEn ? "Sign In" : "เข้าสู่ระบบ"}
        title={isEn ? "Sign In" : "เข้าสู่ระบบ"}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </button>
    );
  }

  const getProviderLabel = () => {
    if (user.provider === "google") return "Google Account";
    if (user.provider === "line") return "LINE Account";
    return isEn ? "Email Account" : "บัญชีอีเมล";
  };

  return (
    <div className="relative select-none" ref={containerRef}>
      {/* Refined Luxury Trigger Button — Person Icon */}
      <button
        type="button"
        onClick={toggleMenu}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-colors duration-150 cursor-pointer flex items-center justify-center relative select-none shadow-xs ${
          menuOpen
            ? "bg-[#EAE7E0] border-[#D5CEC2] text-[#29261F]"
            : "bg-[#FFFFFF] text-[#29261F] hover:text-[#A58A5C] border-[#D5CEC2] hover:border-[#A58A5C]"
        }`}
        aria-expanded={menuOpen}
        aria-controls="user-profile-panel"
        aria-label={isEn ? `User Profile (${user.name})` : `โปรไฟล์ผู้ใช้งาน (${user.name})`}
        title={user.name}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
          aria-hidden="true"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        {/* Subtle Online / Member dot */}
        <span
          aria-hidden="true"
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#A58A5C] ring-1.5 ring-white"
        />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#A58A5C] text-[#FFFFFF] text-[10px] font-bold flex items-center justify-center animate-pulse">
            {pendingCount > 9 ? "9+" : pendingCount}
          </span>
        )}
      </button>

      {/* World-Class Obsidian Gold Floating Member Card — Hardware-Accelerated Zero-Stutter Layer */}
      <div
        id="user-profile-panel"
        role="region"
        aria-label={isEn ? `Account details for ${user.name}` : `ข้อมูลบัญชี ${user.name}`}
        aria-hidden={!menuOpen}
        className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] shadow-[0_10px_30px_rgba(42,38,31,0.12)] p-3 z-50 overflow-x-hidden overflow-y-auto overscroll-contain max-h-[calc(100dvh-4.5rem)] space-y-2 font-serif-th text-xs no-scrollbar dropdown-panel-base ${
          menuOpen ? "dropdown-panel-entering" : "dropdown-panel-exiting"
        }`}
      >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#A58A5C]/40 to-transparent -mt-0.5 mb-1" />

            {/* Member Profile Banner */}
            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-11 h-11 rounded-full object-cover ring-1.5 ring-[#A58A5C] flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#EAE7E0] text-[#29261F] flex items-center justify-center font-bold text-base ring-1.5 ring-[#A58A5C] flex-shrink-0">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[#29261F] truncate tracking-wide">{user.name}</span>
                {user.email && (
                  <span className="block text-[13px] text-[#635B4E] truncate font-sans">{user.email}</span>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[12px] text-[#29261F] bg-[#EAE7E0] border border-[#D5CEC2] px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                    <span className="text-[#A58A5C]">✦</span>
                    <span>{getProviderLabel()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sacred Plan & Quota Management Card */}
            <div className="p-3 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#A58A5C] text-xs">✦</span>
                  <span className="text-[13px] font-bold text-[#29261F] tracking-wide">
                    {isEn ? "Tier & Allowances" : "สิทธิ์และแพ็กเกจ"}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#F3F0EA] bg-[#29261F] px-2 py-0.5 rounded-full">
                  {view?.isUnlimited
                    ? "VIP UNLIMITED"
                    : view?.remaining != null
                      ? (isEn ? `${view.remaining}/${view.limit} left` : `เหลือ ${view.remaining}/${view.limit} ครั้ง`)
                      : (isEn ? "Sanctuary Member" : "สมาชิกวิหาร")}
                </span>
              </div>

              <div className="text-[13px] text-[#635B4E] leading-relaxed">
                {view?.isUnlimited ? (
                  <p>{isEn ? "You have unrestricted readings and consultations." : "คุณมีสิทธิ์เปิดไพ่และสนทนาปรึกษาได้ไม่จำกัด"}</p>
                ) : (
                  <p>
                    {isEn
                      ? `${view?.limit ?? 3} free daily readings${ent?.bonusRemaining ? ` · +${ent.bonusRemaining} bonus credits` : ""}`
                      : `เปิดฟรีวันละ ${view?.limit ?? 3} ครั้ง${ent?.bonusRemaining ? ` · ญาณพิเศษสะสม +${ent.bonusRemaining} ครั้ง` : ""}`}
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
                  className="w-full py-2 px-3 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-serif-th font-bold text-xs hover:scale-[1.01] transition-all duration-150 cursor-pointer flex items-center justify-between active:scale-[0.98] shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    <span>✨</span>
                    <span>{isEn ? "Add Credits / Upgrade Tier" : "ซื้อรอบเพิ่ม / อัปเกรดญาณ"}</span>
                  </span>
                  <span className="text-[11px] bg-black/20 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {isEn ? `From ฿${CHEAPEST_PACKAGE_THB}` : `เริ่มต้น ฿${CHEAPEST_PACKAGE_THB}`}
                  </span>
                </button>
              )}

              {/* Secondary Navigation: Compare Plans & Account Hub */}
              <div className="flex items-center justify-between pt-1 border-t border-[#D5CEC2]/40 text-[12px]">
                {onOpenPlans && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setMenuOpen(false);
                      onOpenPlans();
                    }}
                    className="text-[#A58A5C] hover:text-[#29261F] transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <span>✦</span>
                    <span>{isEn ? "Compare All Plans" : "เปรียบเทียบทุกแพลน"}</span>
                  </button>
                )}
                <Link
                  href="/account"
                  onClick={() => {
                    soundManager.playMenuTapSound();
                    setMenuOpen(false);
                  }}
                  className="text-[#635B4E] hover:text-[#29261F] transition-colors flex items-center gap-1 ml-auto font-medium"
                >
                  <span>{isEn ? "Account Settings" : "จัดการบัญชี"}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Unverified Email Warning Badge */}
            {user.provider === "email" && user.emailVerified === false && (
              <div className="p-2.5 rounded-xl bg-[#FCEEEA] border border-[#D5CEC2] text-[#A6392C] text-[13px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    <span className="text-[#A6392C]">✦</span>
                    <span>{isEn ? "Email Not Verified" : "ยังไม่ยืนยันอีเมล"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="text-[12px] text-[#A6392C] hover:text-[#29261F] hover:underline font-bold cursor-pointer transition-colors"
                  >
                    {resendStatus || (isEn ? "Resend Link" : "ส่งลิงก์ใหม่")}
                  </button>
                </div>
              </div>
            )}

            {/* Pending Reviews Notification Callout */}
            {pendingCount > 0 && (
              <div className="p-2.5 rounded-full bg-[#EAE7E0] border border-[#D5CEC2] text-[#29261F] text-[12px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="text-[#A58A5C]">✦</span>
                  <span>{isEn ? "Pending Outcomes" : "รอติดตามผลคำทำนาย"}</span>
                </span>
                <span className="font-bold bg-[#29261F] text-[#F3F0EA] px-2 py-0.5 rounded-full">
                  {isEn ? `${pendingCount} ${pendingCount === 1 ? "entry" : "entries"}` : `${pendingCount} รายการ`}
                </span>
              </div>
            )}

            {/* Marketing / Follow-up Consent Luxury Toggle */}
            <div className="p-2.5 rounded-xl bg-[#EAE7E0] border border-[#D5CEC2] flex items-center justify-between">
              <div className="pr-2">
                <span className="block text-[13px] font-semibold text-[#29261F]">
                  {isEn ? "Follow-up Insights" : "รับคำทำนายติดตามผล"}
                </span>
                <span className="text-[12px] text-[#635B4E]">
                  {isEn ? "Email updates when timing predictions arrive" : "แจ้งเตือนเมื่อถึงกำหนดคำทำนายทางอีเมล"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateConsent(!user.marketingConsent)}
                className={`w-10 h-6 rounded-full transition-colors duration-150 p-0.5 relative cursor-pointer flex-shrink-0 border ${
                  user.marketingConsent ? "bg-[#29261F] border-[#29261F]" : "bg-[#FFFFFF] border-[#D5CEC2]"
                }`}
                aria-label={isEn ? "Toggle follow-up prediction emails" : "เปิดปิดการรับอีเมลติดตามผล"}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full transition-transform duration-150 ease-out ${
                    user.marketingConsent ? "bg-[#F3F0EA] translate-x-4" : "bg-[#635B4E] translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-1 border-t border-[#D5CEC2]/40">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left p-2.5 rounded-xl text-[#A6392C] hover:text-[#A6392C] hover:bg-[#FCEEEA] border border-transparent hover:border-[#D5CEC2] transition-colors duration-150 cursor-pointer flex items-center justify-between group active:scale-98"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="text-[#A6392C] group-hover:rotate-12 transition-transform">✦</span>
                  <span>{isEn ? "Sign Out" : "ออกจากระบบ"}</span>
                </span>
                <span className="text-[13px] text-[#A6392C] group-hover:text-[#A6392C] group-hover:translate-x-0.5 transition-all">
                  →
                </span>
              </button>
            </div>
      </div>
    </div>
  );
};
