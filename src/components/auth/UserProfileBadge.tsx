"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { invalidateSessionCache, patchSessionUser, useSessionUser } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";

export interface UserProfileBadgeProps {
  onOpenAuthModal: () => void;
  /** อุ่นเครื่อง chunk ของหน้าต่างเข้าสู่ระบบตั้งแต่เมาส์/โฟกัสแตะปุ่ม (ยังไม่ต้องกด) */
  onPrefetchAuth?: () => void;
  onOpenPlans?: () => void;
  onBuyCredits?: () => void;
}

/**
 * ฟังก์ชันช่วยสำหรับการอัปเดตความยินยอมการแจ้งเตือน (ส่งออกเพื่อรองรับ QA และคอมโพเนนต์อื่น)
 */
export async function handleUpdateConsent(consent: boolean) {
  soundManager.playMenuTapSound();
  await fetch("/api/account/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ marketing: consent }),
  }).catch(() => {});
  patchSessionUser({ marketingConsent: consent });
}

/**
 * สมัคร/ยกเลิก "ดวงประจำวัน" ทางอีเมล — ค่าเริ่มต้นปิดเสมอ (opt-in เท่านั้น · PDPA)
 * เปิดตัวนี้แล้วเซิร์ฟเวอร์จะเปิด marketing_consent ให้ครบคู่ด้วย เพราะคิวส่งบังคับทั้งสองธง
 */
export async function handleUpdateDigest(enabled: boolean) {
  soundManager.playMenuTapSound();
  await fetch("/api/account/consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ digest: enabled }),
  }).catch(() => {});
  patchSessionUser(enabled ? { digestEmail: true, marketingConsent: true } : { digestEmail: false });
}

/**
 * ออกจากระบบ ล้างแคชเซสชันและรีโหลดหน้าเว็บ
 */
export async function handleLogout() {
  soundManager.playMenuTapSound();
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } catch {
    // ต่อเซิร์ฟเวอร์ไม่ได้ — ยังต้องล้างสถานะฝั่งหน้าเว็บและรีโหลดอยู่ดี
  }
  invalidateSessionCache();
  window.location.reload();
}

export const UserProfileBadge: React.FC<UserProfileBadgeProps> = ({
  onOpenAuthModal,
  onPrefetchAuth,
}) => {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();
  const [pendingCount, setPendingCount] = useState(0);

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

  if (loading) {
    return (
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line bg-surface flex items-center justify-center text-muted opacity-60 pointer-events-none select-none">
        <span className="sr-only">{isEn ? "Loading profile…" : "กำลังโหลดข้อมูล…"}</span>
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
        onMouseEnter={onPrefetchAuth}
        onFocus={onPrefetchAuth}
        className="tap-overlay px-3.5 py-1.5 rounded-full border border-line bg-surface hover:border-gold hover:text-gold-ink text-xs font-medium text-ink transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-gold/30 shadow-xs"
      >
        <span>{isEn ? "Sign In" : "เข้าสู่ระบบ"}</span>
      </button>
    );
  }

  return (
    <Link
      href="/account"
      onClick={() => soundManager.playMenuTapSound()}
      className="tap-overlay relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-line bg-surface hover:border-gold text-ink transition-colors shadow-xs group focus:outline-none focus:ring-2 focus:ring-gold/40"
      aria-label={user.name ? `${user.name} - ${isEn ? "Member Account" : "บัญชีสมาชิก"}` : (isEn ? "Member Account" : "บัญชีสมาชิก")}
      title={isEn ? "Member Sanctuary Profile" : "หน้าบัญชีสมาชิก"}
    >
      {user.avatar ? (
        <img
          src={user.avatar}
          alt=""
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="text-xs sm:text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
          {user.name ? (
            user.name.slice(0, 2).toUpperCase()
          ) : (
            <svg
              className="w-4 h-4 text-muted group-hover:text-ink transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </span>
      )}

      {/* จุดสถานะสมาชิกสีทอง (Gold member indicator dot) */}
      <span
        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-gold border-2 border-canvas"
        aria-hidden="true"
      />

      {/* ป้ายแจ้งเตือนคำทำนายที่ถึงกำหนดติดตามผล */}
      {pendingCount > 0 && (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-crimson rounded-full shadow-xs ring-2 ring-canvas flex items-center justify-center leading-none animate-pulse"
          aria-label={isEn ? `${pendingCount} pending outcomes` : `มีคำทำนายรอติดตามผล ${pendingCount} รายการ`}
        >
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
    </Link>
  );
};
