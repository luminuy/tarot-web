"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";
import { EntitlementStatusCard } from "@/components/entitlement/EntitlementStatusCard";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";
import { useSessionUser, patchSessionUser, invalidateSessionCache } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import type { UpgradeReason } from "@/lib/entitlement/copy";

// INC-0130 / Rule 3.5: Dynamic modal imports placed outside <main> to avoid stacking context traps
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then((m) => m.AuthModal), {
  ssr: false,
});
const ReadingHistoryModal = dynamic(
  () => import("@/components/history/ReadingHistoryModal").then((m) => m.ReadingHistoryModal),
  { ssr: false },
);
const AccessDialog = dynamic(
  () => import("@/components/entitlement/AccessDialog").then((m) => m.AccessDialog),
  { ssr: false },
);
const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false },
);

export function AccountClient() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();

  const [pendingCount, setPendingCount] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [isUpdatingDigest, setIsUpdatingDigest] = useState(false);

  // Modal control states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [exploreReason, setExploreReason] = useState<UpgradeReason | null>(null);
  const [creditsModalOpen, setCreditsModalOpen] = useState(false);

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

  const handleUpdateConsent = async (consent: boolean) => {
    soundManager.playMenuTapSound();
    setIsUpdatingConsent(true);
    try {
      await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ marketing: consent }),
      });
      patchSessionUser({ marketingConsent: consent });
    } catch {
      // ignore
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  const handleUpdateDigest = async (enabled: boolean) => {
    soundManager.playMenuTapSound();
    setIsUpdatingDigest(true);
    try {
      await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ digest: enabled }),
      });
      patchSessionUser(enabled ? { digestEmail: true, marketingConsent: true } : { digestEmail: false });
    } catch {
      // ignore
    } finally {
      setIsUpdatingDigest(false);
    }
  };

  const handleResendVerify = async () => {
    soundManager.playMenuTapSound();
    setResendStatus(isEn ? "Sending…" : "กำลังส่ง…");
    try {
      const res = await fetch("/api/auth/email/resend", { method: "POST", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setResendStatus(isEn ? "Verification link sent" : "ส่งลิงก์ยืนยันแล้ว");
        setTimeout(() => setResendStatus(null), 4000);
      } else {
        setResendStatus(data.error || (isEn ? "Failed to send" : "ส่งไม่สำเร็จ"));
      }
    } catch {
      setResendStatus(isEn ? "An error occurred" : "เกิดข้อผิดพลาด");
    }
  };

  const handleLogout = async () => {
    soundManager.playMenuTapSound();
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // ignore
    }
    invalidateSessionCache();
    window.location.href = "/";
  };

  return (
    <>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen bg-canvas text-ink p-4 sm:p-8 font-sans selection:bg-gold/20 selection:text-ink"
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top back navigation */}
          <div className="pt-2">
            <Link
              href="/"
              onClick={() => soundManager.playMenuTapSound()}
              className="inline-flex items-center gap-1.5 text-xs font-serif-th text-muted hover:text-gold-ink transition-colors"
            >
              <span>←</span>
              <span>{isEn ? "Return to Sanctuary" : "กลับสู่วิหารพยากรณ์"}</span>
            </Link>
          </div>

          {/* Header Title & Intro */}
          <div className="text-center space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div>
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-line bg-surface text-[13px] text-gold-ink font-bold shadow-xs">
                Sacred Sanctuary Profile
              </span>
            </div>
            <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-ink leading-snug sm:leading-normal pt-1 [text-wrap:balance]">
              {isEn ? "Your Account & Sacred Archive" : "บัญชีและประวัติของคุณ"}
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-lg mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
              {isEn
                ? "Manage personal privacy, sacred reading archives, and data rights under PDPA & GDPR standards."
                : "ควบคุมข้อมูลความเป็นส่วนตัว ประวัติคำทำนาย และการตั้งค่าตามสิทธิ์ PDPA"}
            </p>
          </div>

          {/* Guest State Banner */}
          {!loading && !user && (
            <div className="rounded-xl border border-line bg-surface p-6 sm:p-8 text-center space-y-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
              <div className="w-12 h-12 rounded-full border border-line bg-canvas mx-auto flex items-center justify-center text-muted">
                <svg
                  className="w-6 h-6"
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
              </div>
              <div className="space-y-1">
                <h2 className="font-serif-th text-lg font-bold text-ink">
                  {isEn ? "Sign In to Access Your Sanctuary Profile" : "เข้าสู่ระบบเพื่อเข้าถึงบัญชีสมาชิกของคุณ"}
                </h2>
                <p className="text-xs text-muted max-w-md mx-auto leading-relaxed font-serif-th">
                  {isEn
                    ? "Connect your Google or LINE account to synchronize sacred readings, unlock daily quota benefits, and preserve your reflection history."
                    : "เชื่อมต่อบัญชีเพื่อบันทึกประวัติการเปิดไพ่ รับโควตาคำทำนายประจำวัน และติดตามผลลัพธ์คำทำนายอย่างต่อเนื่อง"}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playMenuTapSound();
                    setAuthModalOpen(true);
                  }}
                  className="tap-target px-6 py-2.5 rounded-full bg-ink text-canvas hover:bg-gold-ink text-xs font-bold font-serif-th transition-colors shadow-sm"
                >
                  {isEn ? "Sign In / Register" : "เข้าสู่ระบบ / สมัครสมาชิก"}
                </button>
              </div>
            </div>
          )}

          {/* Member Profile Identity Card */}
          {user && (
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative w-14 h-14 rounded-full border border-line bg-canvas overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-lg font-serif-th font-bold text-ink">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "M"}
                      </span>
                    )}
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-gold border-2 border-canvas"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink">
                        {user.name || (isEn ? "Sacred Member" : "สมาชิกวิหาร")}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full border border-line bg-canvas text-[11px] text-muted font-mono">
                        {user.provider === "google"
                          ? "Google Account"
                          : user.provider === "line"
                            ? "LINE Account"
                            : isEn
                              ? "Email Account"
                              : "บัญชีอีเมล"}
                      </span>
                    </div>
                    <p className="text-xs text-muted font-mono">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="tap-target px-3 py-1.5 rounded-full border border-line hover:border-crimson/40 hover:text-crimson text-xs text-muted font-serif-th transition-colors"
                  >
                    {isEn ? "Sign Out" : "ออกจากระบบ"}
                  </button>
                </div>
              </div>

              {/* Email Verification Status Notice */}
              {user.emailVerified === false && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-800 dark:text-amber-300 font-serif-th">
                      {isEn ? "Email verification required" : "ยังไม่ได้ยืนยันอีเมล"}
                    </p>
                    <p className="text-muted">
                      {isEn
                        ? "Please verify your email address to receive sacred daily digest updates."
                        : "โปรดยืนยันอีเมลเพื่อเปิดใช้งานการรับดวงประจำวันทางอีเมล"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="tap-target px-3 py-1.5 rounded-full border border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10 font-bold font-serif-th transition-colors whitespace-nowrap self-start sm:self-auto"
                  >
                    {resendStatus || (isEn ? "Resend Link" : "ส่งลิงก์ยืนยันอีกครั้ง")}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Pending Outcome Callout Card */}
          {user && pendingCount > 0 && (
            <div className="rounded-xl border border-gold/40 bg-gold/5 p-5 sm:p-6 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                    <h3 className="font-serif-th text-sm sm:text-base font-bold text-ink">
                      {isEn
                        ? `${pendingCount} Reading Outcome${pendingCount > 1 ? "s" : ""} Awaiting Review`
                        : `มีคำทำนายที่ถึงกำหนดติดตามผล ${pendingCount} รายการ`}
                    </h3>
                  </div>
                  <p className="text-xs text-muted font-serif-th leading-relaxed">
                    {isEn
                      ? "Reflect on past readings and record actual outcomes to deepen your sacred intuition."
                      : "คำทำนายที่คุณบันทึกไว้ถึงกำหนดเวลาสังเกตผลแล้ว ร่วมบันทึกความเป็นจริงเพื่อพัฒนาความเข้าใจตนเอง"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundManager.playMenuTapSound();
                    setHistoryModalOpen(true);
                  }}
                  className="tap-target px-4 py-2 rounded-full bg-ink text-canvas hover:bg-gold-ink text-xs font-bold font-serif-th transition-colors whitespace-nowrap shadow-xs self-start sm:self-auto"
                >
                  {isEn ? "Open Reading Journal" : "เปิดบันทึกคำทำนาย"}
                </button>
              </div>
            </div>
          )}

          {/* สิทธิ์การเปิดไพ่คงเหลือ · โควตารายวัน · โบนัสสะสม */}
          <EntitlementStatusCard />

          {/* Quick Hub Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                soundManager.playMenuTapSound();
                setHistoryModalOpen(true);
              }}
              className="p-4 rounded-xl border border-line bg-surface hover:border-gold text-left transition-colors shadow-xs group"
            >
              <div className="text-xs text-muted font-mono uppercase tracking-wider">
                {isEn ? "Sacred Archive" : "บันทึกคำทำนาย"}
              </div>
              <div className="text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors mt-0.5">
                {isEn ? "Reading History & Journal" : "ประวัติการเปิดไพ่"}
              </div>
              <div className="text-[11px] text-muted font-serif-th mt-1">
                {isEn ? "Review past readings and insights" : "ดูผลคำทำนายย้อนหลังและบันทึกข้อคิด"}
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.playMenuTapSound();
                setExploreReason("explore");
              }}
              className="p-4 rounded-xl border border-line bg-surface hover:border-gold text-left transition-colors shadow-xs group"
            >
              <div className="text-xs text-muted font-mono uppercase tracking-wider">
                {isEn ? "Privilege Tiers" : "สิทธิประโยชน์"}
              </div>
              <div className="text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors mt-0.5">
                {isEn ? "Compare Membership Plans" : "เปรียบเทียบทุกแพลน"}
              </div>
              <div className="text-[11px] text-muted font-serif-th mt-1">
                {isEn ? "Explore tiers, tokens, and daily limits" : "ดูโควตารายวันและแพ็กเกจเปิดไพ่พรีเมียม"}
              </div>
            </button>
          </div>

          {/* Notification & Communication Preferences (PDPA Opt-In) */}
          {user && (
            <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
              <div className="space-y-1">
                <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink">
                  {isEn ? "Notification Preferences (PDPA)" : "การแจ้งเตือนและความยินยอม (PDPA)"}
                </h2>
                <p className="text-xs text-muted font-serif-th leading-relaxed">
                  {isEn
                    ? "Control email notifications. All subscriptions are opt-in only and can be modified anytime."
                    : "ควบคุมการรับข้อมูลทางอีเมล ระบบปฏิบัติตามมาตรฐาน PDPA โดยต้องได้รับความยินยอมก่อนเสมอ"}
                </p>
              </div>

              <div className="divide-y divide-line/40 pt-1">
                {/* Toggle 1: Follow-up outcome notifications */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold font-serif-th text-ink">
                      {isEn ? "Reading Outcome Follow-ups" : "รับคำทำนายติดตามผล"}
                    </p>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {isEn
                        ? "Receive email notifications when your readings reach their reflection date."
                        : "รับการแจ้งเตือนทางอีเมลเมื่อคำทำนายถึงกำหนดติดตามผลลัพธ์"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!user.marketingConsent}
                      disabled={isUpdatingConsent}
                      onChange={(e) => handleUpdateConsent(e.target.checked)}
                      className="sr-only peer"
                      aria-label={isEn ? "Reading Outcome Follow-ups" : "รับคำทำนายติดตามผล"}
                    />
                    <div className="w-10 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-gold-ink" />
                  </label>
                </div>

                {/* Toggle 2: Daily Tarot Digest */}
                <div className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold font-serif-th text-ink">
                      {isEn ? "Daily Tarot Guidance via Email" : "รับดวงประจำวันทางอีเมล"}
                    </p>
                    <p className="text-[11px] text-muted leading-relaxed">
                      {isEn
                        ? "Receive a sacred card reading drawn at sunrise every morning (Opt-in only)."
                        : "รับไพ่ประจำวัน 1 ใบที่เปิดรับอรุณทุกเช้าทางอีเมล (ต้องยินยอมก่อนเสมอ)"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={!!user.digestEmail}
                      disabled={isUpdatingDigest}
                      onChange={(e) => handleUpdateDigest(e.target.checked)}
                      className="sr-only peer"
                      aria-label={isEn ? "Daily Tarot Guidance via Email" : "รับดวงประจำวันทางอีเมล"}
                    />
                    <div className="w-10 h-5 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:bg-gold-ink" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Change Password & Security Card */}
          <ChangePasswordCard />

          {/* Privacy & PDPA Control Card */}
          <div className="rounded-xl border border-line bg-surface p-5 sm:p-6 space-y-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
            <div className="space-y-1">
              <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink">
                {isEn ? "Privacy & Data Sovereign Rights" : "ความเป็นส่วนตัวและการจัดเก็บข้อมูล"}
              </h2>
              <p className="text-xs text-muted leading-relaxed font-serif-th">
                {isEn
                  ? "We uphold the highest standard of privacy. Your personal inquiries and reading reflections are preserved in your secure local storage, ensuring full sovereignty without unnecessary permanent server retention."
                  : "ระบบของเรายึดหลักความเป็นส่วนตัวระดับสูงสุด ข้อมูลคำถามและประวัติการดูดวงทั้งหมดจะถูกจัดเก็บในเครื่องของคุณ (Local Storage) เท่านั้น โดยไม่มีการเก็บถาวรบนเซิร์ฟเวอร์"}
              </p>
            </div>
            <div className="pt-3 border-t border-line/40 flex items-center justify-between flex-wrap gap-3">
              <Link href="/privacy" className="text-xs text-gold-ink hover:text-ink underline font-bold">
                {isEn ? "Read Privacy Policy (PDPA / GDPR)" : "อ่านนโยบายความเป็นส่วนตัว (PDPA)"}
              </Link>
              <DeleteAllDataButton />
            </div>
          </div>
        </div>
      </main>

      {/* INC-0130 / Rule 3.5: Modals placed strictly outside <main> */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />
      )}

      {historyModalOpen && (
        <ReadingHistoryModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
        />
      )}

      {exploreReason !== null && (
        <AccessDialog
          reason={exploreReason}
          onClose={() => setExploreReason(null)}
          onSignup={() => {
            setExploreReason(null);
            setAuthModalOpen(true);
          }}
          onSignin={() => {
            setExploreReason(null);
            setAuthModalOpen(true);
          }}
          onBuyCredits={() => {
            setExploreReason(null);
            setCreditsModalOpen(true);
          }}
        />
      )}

      {creditsModalOpen && (
        <BuyCreditsModal
          isOpen={creditsModalOpen}
          onClose={() => setCreditsModalOpen(false)}
          user={user}
          onRequireAuth={() => {
            setCreditsModalOpen(false);
            setAuthModalOpen(true);
          }}
        />
      )}
    </>
  );
}
