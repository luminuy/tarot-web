"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { invalidateSessionCache, patchSessionUser, useSessionUser } from "@/lib/auth/use-session";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { describeEntitlement, CHEAPEST_PACKAGE_THB, DAILY_LIMIT, READINGS_EN } from "@/lib/entitlement/copy";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
  /** อุ่นเครื่อง chunk ของหน้าต่างเข้าสู่ระบบตั้งแต่เมาส์/โฟกัสแตะปุ่ม (ยังไม่ต้องกด) */
  onPrefetchAuth?: () => void;
  onOpenPlans?: () => void;
  onBuyCredits?: () => void;
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({ onOpenAuthModal, onPrefetchAuth, onOpenPlans, onBuyCredits }) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(menuOpen);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);
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

    // ⚠️ ห้ามยิง event / side effect ใด ๆ ข้างใน setState updater (ISSUE-028)
    // updater ต้องเป็น pure function — React เรียกซ้ำได้หลายครั้ง
    // อ่านค่าปัจจุบันจาก ref แล้วตัดสินใจตรงนี้แทน
    const willOpen = !menuOpenRef.current;
    if (willOpen) {
      window.dispatchEvent(new CustomEvent("tarot:close-menus", { detail: { except: "user-badge" } }));
    }
    setMenuOpen(willOpen);
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
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line bg-surface flex items-center justify-center text-muted opacity-60 pointer-events-none select-none">
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
        onPointerEnter={onPrefetchAuth}
        onFocus={onPrefetchAuth}
        onClick={() => {
          soundManager.playMenuTapSound();
          onOpenAuthModal();
        }}
        className="tap-overlay w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line bg-surface text-ink hover:border-gold hover:text-gold flex items-center justify-center transition-colors duration-150 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold select-none"
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
        className={`tap-overlay w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-colors duration-150 cursor-pointer flex items-center justify-center relative select-none shadow-xs ${
          menuOpen
            ? "bg-inset border-line text-ink"
            : "bg-surface text-ink hover:text-gold border-line hover:border-gold"
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
          className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-gold ring-1.5 ring-white"
        />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold text-surface text-[10px] font-bold flex items-center justify-center animate-pulse">
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
        className={`absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-surface border border-line shadow-[0_10px_30px_rgba(42,38,31,0.12)] p-3 z-50 overflow-x-hidden overflow-y-auto overscroll-contain max-h-[calc(100svh-4.5rem)] space-y-2 font-serif-th text-xs no-scrollbar dropdown-panel-base ${
          menuOpen ? "dropdown-panel-entering" : "dropdown-panel-exiting"
        }`}
      >
            {/* Ambient Top Foil Glow */}
            <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent -mt-0.5 mb-1" />

            {/* Member Profile Banner */}
            <div className="p-3 rounded-xl bg-surface border border-line flex items-center gap-3">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  /* ภาพประกอบล้วน — <span> ข้าง ๆ พิมพ์ชื่อผู้ใช้อยู่แล้ว (INC-0125) */
                  alt=""
                  className="w-11 h-11 rounded-full object-cover ring-1.5 ring-gold flex-shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-inset text-ink flex items-center justify-center font-bold text-base ring-1.5 ring-gold flex-shrink-0">
                  {user.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-ink truncate tracking-wide">{user.name}</span>
                {user.email && (
                  <span className="block text-[13px] text-muted truncate font-sans">{user.email}</span>
                )}
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[12px] text-ink bg-inset border border-line px-2 py-0.2 rounded-full inline-flex items-center gap-1">
                    
                    <span>{getProviderLabel()}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Sacred Plan & Quota Management Card */}
            <div className="p-3 rounded-xl bg-surface border border-line space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  
                  <span className="text-[13px] font-bold text-ink tracking-wide">
                    {isEn ? "Tier & Allowances" : "สิทธิ์และแพ็กเกจ"}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-canvas bg-ink px-2 py-0.5 rounded-full">
                  {view?.isUnlimited
                    ? "VIP UNLIMITED"
                    : view?.remaining != null
                      ? (isEn ? `${view.remaining}/${view.limit} left` : `เหลือ ${view.remaining}/${view.limit} ครั้ง`)
                      : (isEn ? "Sanctuary Member" : "สมาชิกวิหาร")}
                </span>
              </div>

              <div className="text-[13px] text-muted leading-relaxed">
                {view?.isUnlimited ? (
                  <p>{isEn ? "You have unrestricted readings and consultations." : "คุณมีสิทธิ์เปิดไพ่และสนทนาปรึกษาได้ไม่จำกัด"}</p>
                ) : (
                  <p>
                    {isEn
                      ? `${view?.limit ?? DAILY_LIMIT} free daily ${READINGS_EN}${ent?.bonusRemaining ? ` · +${ent.bonusRemaining} bonus credits` : ""}`
                      : `เปิดฟรีวันละ ${view?.limit ?? DAILY_LIMIT} ครั้ง${ent?.bonusRemaining ? ` · ญาณพิเศษสะสม +${ent.bonusRemaining} ครั้ง` : ""}`}
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
                  className="w-full py-2 px-3 rounded-full bg-ink hover:bg-gold text-canvas font-serif-th font-bold text-xs hover:scale-[1.01] transition duration-150 cursor-pointer flex items-center justify-between active:scale-[0.98] shadow-sm"
                >
                  <span className="flex items-center gap-1.5">
                    
                    <span>{isEn ? "Add Credits / Upgrade Tier" : "ซื้อรอบเพิ่ม / อัปเกรดญาณ"}</span>
                  </span>
                  <span className="text-[11px] bg-black/20 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {isEn ? `From ฿${CHEAPEST_PACKAGE_THB}` : `เริ่มต้น ฿${CHEAPEST_PACKAGE_THB}`}
                  </span>
                </button>
              )}

              {/* Direct Redeem Link */}
              {onBuyCredits && (
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setMenuOpen(false);
                      onBuyCredits();
                    }}
                    className="text-[11px] text-gold-ink hover:text-ink underline underline-offset-2 transition-colors cursor-pointer font-serif-th"
                  >
                    {isEn ? "Have a redeem code? Enter here" : "มีรหัสแลกสิทธิ์? กดใส่รหัสที่นี่"}
                  </button>
                </div>
              )}

              {/* Secondary Navigation: Compare Plans & Account Hub */}
              <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[12px]">
                {onOpenPlans && (
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playMenuTapSound();
                      setMenuOpen(false);
                      onOpenPlans();
                    }}
                    className="text-gold hover:text-ink transition-colors cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    
                    <span>{isEn ? "Compare All Plans" : "เปรียบเทียบทุกแพลน"}</span>
                  </button>
                )}
                <Link
                  href="/account"
                  onClick={() => {
                    soundManager.playMenuTapSound();
                    setMenuOpen(false);
                  }}
                  className="text-muted hover:text-ink transition-colors flex items-center gap-1 ml-auto font-medium"
                >
                  <span>{isEn ? "Account Settings" : "จัดการบัญชี"}</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Unverified Email Warning Badge */}
            {user.provider === "email" && user.emailVerified === false && (
              <div className="p-2.5 rounded-xl bg-err-wash border border-line text-err text-[13px] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-1">
                    
                    <span>{isEn ? "Email Not Verified" : "ยังไม่ยืนยันอีเมล"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="text-[12px] text-err hover:text-ink hover:underline font-bold cursor-pointer transition-colors"
                  >
                    {resendStatus || (isEn ? "Resend Link" : "ส่งลิงก์ใหม่")}
                  </button>
                </div>
              </div>
            )}

            {/* Pending Reviews Notification Callout */}
            {pendingCount > 0 && (
              <div className="p-2.5 rounded-full bg-inset border border-line text-ink text-[12px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  
                  <span>{isEn ? "Pending Outcomes" : "รอติดตามผลคำทำนาย"}</span>
                </span>
                <span className="font-bold bg-ink text-canvas px-2 py-0.5 rounded-full">
                  {isEn ? `${pendingCount} ${pendingCount === 1 ? "entry" : "entries"}` : `${pendingCount} รายการ`}
                </span>
              </div>
            )}

            {/* Marketing / Follow-up Consent Luxury Toggle */}
            <div className="p-2.5 rounded-xl bg-inset border border-line flex items-center justify-between">
              <div className="pr-2">
                <span className="block text-[13px] font-semibold text-ink">
                  {isEn ? "Follow-up Insights" : "รับคำทำนายติดตามผล"}
                </span>
                <span className="text-[12px] text-muted">
                  {isEn ? "Email updates when timing predictions arrive" : "แจ้งเตือนเมื่อถึงกำหนดคำทำนายทางอีเมล"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUpdateConsent(!user.marketingConsent)}
                className={`w-10 h-6 rounded-full transition-colors duration-150 p-0.5 relative cursor-pointer flex-shrink-0 border ${
                  user.marketingConsent ? "bg-ink border-ink" : "bg-surface border-line"
                }`}
                aria-label={isEn ? "Toggle follow-up prediction emails" : "เปิดปิดการรับอีเมลติดตามผล"}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-full transition-transform duration-150 ease-out ${
                    user.marketingConsent ? "bg-canvas translate-x-4" : "bg-muted translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-1 border-t border-line/40">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-left p-2.5 rounded-xl text-err hover:text-err hover:bg-err-wash border border-transparent hover:border-line transition-colors duration-150 cursor-pointer flex items-center justify-between group active:scale-98"
              >
                <span className="flex items-center gap-1.5 font-bold">
                  
                  <span>{isEn ? "Sign Out" : "ออกจากระบบ"}</span>
                </span>
                <span className="text-[13px] text-err group-hover:text-err group-hover:translate-x-0.5 transition">
                  →
                </span>
              </button>
            </div>
      </div>
    </div>
  );
};
