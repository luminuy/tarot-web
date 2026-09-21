"use client";

import { useEffect, useId, useState } from "react";
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

/* ───────────────────────────────────────────────────────────────────────────
 * ชิ้นส่วนหน้าตาที่ใช้ซ้ำทั้งหน้า
 *
 * ⚠️ ทั้งหน้าต้องใช้ "เปลือกการ์ดใบเดียวกัน" เสมอ
 * รอบก่อนหน้านี้หน้านี้มีการ์ดสองระบบปนกัน (`rounded-xl border-line` + เงาหนัก
 * ของหน้านี้เอง กับ `rounded-lg border-line-warm` ของการ์ดที่นำเข้ามา)
 * ตาเห็นทันทีว่าเป็นคนละเว็บมาต่อกัน — เปลือกกลางตัวนี้คือสิ่งที่กันไม่ให้เกิดซ้ำ
 * ─────────────────────────────────────────────────────────────────────────── */

const CARD_SHELL = "altar-card-porcelain !rounded-lg p-5 sm:p-6";

function SectionCard({
  title,
  description,
  children,
  tone = "plain",
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  tone?: "plain" | "danger";
}) {
  return (
    <section className={`${CARD_SHELL} space-y-4 ${tone === "danger" ? "border-err/30" : ""}`}>
      <div className="space-y-1">
        <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">{title}</h2>
        {description && (
          <p className="text-xs text-muted font-serif-th leading-relaxed">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * สวิตช์ความยินยอม — ใช้ `role="switch"` จริง ไม่ใช่ `<input>` ซ่อนที่วาดด้วย `peer-*`
 * เพราะโปรแกรมอ่านหน้าจอต้องได้ยินทั้ง "ชื่อสวิตช์" และ "สถานะเปิด/ปิด" ในจังหวะเดียว
 * ขนาดแตะ 44x24 ผ่านเกณฑ์ WCAG 2.2 (24px) และมีสถานะกำลังบันทึกเพื่อกันกดรัว
 */
function ConsentToggle({
  label,
  hint,
  checked,
  saving,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  saving: boolean;
  onChange: (next: boolean) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="space-y-0.5">
        <p id={labelId} className="text-xs font-bold font-serif-th text-ink-deep">
          {label}
        </p>
        <p className="text-xs text-muted leading-relaxed">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={saving}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
          checked ? "bg-gold-ink border-gold-ink" : "glass-field border-line-interactive-warm"
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 left-0.5 h-4.5 w-4.5 rounded-full transition-transform ${
            checked ? "translate-x-5 bg-surface" : "translate-x-0 bg-muted"
          }`}
        />
      </button>
    </div>
  );
}

/** ทางลัดหนึ่งช่อง — ทั้งช่องกดได้ ไม่ใช่ลิงก์เส้นเล็ก ๆ ในมุมการ์ด */
function HubTile({
  eyebrow,
  title,
  hint,
  badge,
  onClick,
}: {
  eyebrow: string;
  title: string;
  hint: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="glass-tile !rounded-lg group flex w-full flex-col items-start gap-1 p-4 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{eyebrow}</span>
        {badge && (
          <span className="rounded-full bg-gold-ink px-2 py-0.5 font-serif-th text-xs font-bold text-surface">
            {badge}
          </span>
        )}
      </span>
      <span className="font-serif-th text-sm font-bold text-ink-deep group-hover:text-gold-ink transition-colors">
        {title}
      </span>
      <span className="font-serif-th text-xs text-muted leading-relaxed">{hint}</span>
    </button>
  );
}

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
      // ต่อเซิร์ฟเวอร์ไม่ได้ — คงค่าเดิมไว้ ไม่แกล้งทำเป็นบันทึกสำเร็จ
    } finally {
      setIsUpdatingConsent(false);
    }
  };

  /**
   * สมัคร/ยกเลิก "ดวงประจำวัน" ทางอีเมล — ค่าเริ่มต้นปิดเสมอ (opt-in เท่านั้น · PDPA)
   * เปิดตัวนี้แล้วเซิร์ฟเวอร์จะเปิด marketing_consent ให้ครบคู่ด้วย เพราะคิวส่งบังคับทั้งสองธง
   */
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
      // ต่อเซิร์ฟเวอร์ไม่ได้ — คงค่าเดิมไว้ ไม่แกล้งทำเป็นบันทึกสำเร็จ
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
      // ต่อเซิร์ฟเวอร์ไม่ได้ — ยังต้องล้างสถานะฝั่งหน้าเว็บอยู่ดี
    }
    invalidateSessionCache();
    window.location.href = isEn ? "/en" : "/";
  };

  const openJournal = () => {
    soundManager.playMenuTapSound();
    setHistoryModalOpen(true);
  };

  const openBuyCredits = () => {
    soundManager.playMenuTapSound();
    setCreditsModalOpen(true);
  };

  const providerLabel =
    user?.provider === "google"
      ? "Google Account"
      : user?.provider === "line"
        ? "LINE Account"
        : isEn
          ? "Email Account"
          : "บัญชีอีเมล";

  return (
    <>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen text-ink px-4 py-6 sm:px-8 sm:py-10 font-sans selection:bg-gold/20 selection:text-ink"
      >
        <div className="mx-auto max-w-3xl space-y-5">
          {/* Top back navigation */}
          <Link
            href="/"
            onClick={() => soundManager.playMenuTapSound()}
            className="inline-flex items-center gap-1.5 text-xs font-serif-th text-muted hover:text-gold-ink transition-colors"
          >
            <span aria-hidden="true">←</span>
            <span>{isEn ? "Return to Sanctuary" : "กลับสู่วิหารพยากรณ์"}</span>
          </Link>

          {/* Header Title & Intro */}
          <div className="space-y-3 py-1 text-center sm:py-3">
            <span className="glass-chip inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-gold-ink">
              Sacred Sanctuary Profile
            </span>
            <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-ink leading-snug sm:leading-normal [text-wrap:balance]">
              {isEn ? "Your Account & Sacred Archive" : "บัญชีและประวัติของคุณ"}
            </h1>
            <p className="mx-auto max-w-lg font-serif-th text-xs sm:text-sm text-muted leading-relaxed [text-wrap:balance]">
              {isEn
                ? "Manage personal privacy, sacred reading archives, and data rights under PDPA & GDPR standards."
                : "ควบคุมข้อมูลความเป็นส่วนตัว ประวัติคำทำนาย และการตั้งค่าตามสิทธิ์ PDPA"}
            </p>
          </div>

          {/* ── ตัวตนของผู้ใช้ ─────────────────────────────────────────────
              สามสถานะต้องสูงใกล้เคียงกัน ไม่งั้นหน้ากระโดดตอนเซสชันโหลดเสร็จ */}
          {loading && (
            <div className={`${CARD_SHELL} flex items-center gap-4`} aria-hidden="true">
              <div className="glass-chip h-14 w-14 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded-full bg-inset-warm" />
                <div className="h-3 w-56 rounded-full bg-inset-warm" />
              </div>
            </div>
          )}

          {!loading && !user && (
            <section className={`${CARD_SHELL} space-y-4 text-center`}>
              <div className="glass-chip mx-auto flex h-12 w-12 items-center justify-center text-muted">
                <svg
                  className="h-6 w-6"
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
                <h2 className="font-serif-th text-lg font-bold font-mystic-gold">
                  {isEn ? "Sign In to Access Your Sanctuary Profile" : "เข้าสู่ระบบเพื่อเข้าถึงบัญชีสมาชิกของคุณ"}
                </h2>
                <p className="mx-auto max-w-md font-serif-th text-xs text-muted leading-relaxed">
                  {isEn
                    ? "Connect your Google or LINE account to synchronize sacred readings, unlock daily quota benefits, and preserve your reflection history."
                    : "เชื่อมต่อบัญชีเพื่อบันทึกประวัติการเปิดไพ่ รับโควตาคำทำนายประจำวัน และติดตามผลลัพธ์คำทำนายอย่างต่อเนื่อง"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundManager.playMenuTapSound();
                  setAuthModalOpen(true);
                }}
                className="tap-overlay-y rounded-full bg-gold-ink px-6 py-2.5 font-serif-th text-xs font-bold text-surface transition-colors hover:bg-gold-ink-deep cursor-pointer"
              >
                {isEn ? "Sign In / Register" : "เข้าสู่ระบบ / สมัครสมาชิก"}
              </button>
            </section>
          )}

          {user && (
            <section className={`${CARD_SHELL} space-y-4`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3.5">
                  <div className="glass-chip relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        /* ภาพประกอบล้วน — ชื่อผู้ใช้พิมพ์อยู่ข้าง ๆ แล้ว (INC-0125) */
                        alt=""
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="font-serif-th text-lg font-bold text-ink-deep">
                        {user.name ? user.name.slice(0, 2).toUpperCase() : "M"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-serif-th text-base sm:text-lg font-bold text-ink-deep">
                        {user.name || (isEn ? "Sacred Member" : "สมาชิกวิหาร")}
                      </h2>
                      <span className="glass-chip px-2 py-0.5 font-mono text-xs text-muted">
                        {providerLabel}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted break-all">{user.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="tap-overlay-y shrink-0 self-start rounded-full border border-line-interactive-warm px-4 py-2 font-serif-th text-xs font-semibold text-ink-deep transition-colors hover:border-err hover:text-err cursor-pointer sm:self-center"
                >
                  {isEn ? "Sign Out" : "ออกจากระบบ"}
                </button>
              </div>

              {/* Email Verification Status Notice */}
              {user.emailVerified === false && (
                <div className="flex flex-col gap-3 rounded-lg border border-err/30 bg-err-wash p-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="font-serif-th font-bold text-err">
                      {isEn ? "Email verification required" : "ยังไม่ได้ยืนยันอีเมล"}
                    </p>
                    <p className="text-muted leading-relaxed">
                      {isEn
                        ? "Verify your email address to receive follow-ups and the daily card by email."
                        : "ยืนยันอีเมลก่อน จึงจะรับคำทำนายติดตามผลและดวงประจำวันทางอีเมลได้"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="tap-overlay-y shrink-0 self-start whitespace-nowrap rounded-full border border-err/40 px-4 py-2 font-serif-th text-xs font-bold text-err transition-colors hover:bg-err hover:text-surface cursor-pointer sm:self-auto"
                  >
                    {resendStatus || (isEn ? "Resend Link" : "ส่งลิงก์ยืนยันอีกครั้ง")}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* สิทธิ์การเปิดไพ่คงเหลือ · โควตารายวัน · โบนัสสะสม · ปุ่มเติมรอบ · รหัสแลกสิทธิ์ */}
          <EntitlementStatusCard onBuyCredits={openBuyCredits} />

          {/* ทางลัดที่คนมาหน้านี้ต้องการจริง — รวมไว้ที่เดียว ไม่กระจายเป็นปุ่มซ้ำทั้งหน้า */}
          <SectionCard
            title={isEn ? "Member Shortcuts" : "ทางลัดของสมาชิก"}
            description={
              isEn
                ? "Your reading archive and the benefits of each membership tier."
                : "คลังคำทำนายของคุณ และสิทธิประโยชน์ของสมาชิกแต่ละระดับ"
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <HubTile
                eyebrow={isEn ? "Sacred Archive" : "บันทึกคำทำนาย"}
                title={isEn ? "Reading History & Journal" : "ประวัติการเปิดไพ่"}
                hint={
                  pendingCount > 0
                    ? isEn
                      ? "Readings have reached their reflection date — record what actually happened."
                      : "มีคำทำนายถึงกำหนดติดตามผลแล้ว บันทึกสิ่งที่เกิดขึ้นจริงได้เลย"
                    : isEn
                      ? "Review past readings and insights"
                      : "ดูผลคำทำนายย้อนหลังและบันทึกข้อคิด"
                }
                badge={
                  pendingCount > 0
                    ? isEn
                      ? `${pendingCount} to review`
                      : `รอติดตามผล ${pendingCount}`
                    : undefined
                }
                onClick={openJournal}
              />
              <HubTile
                eyebrow={isEn ? "Privilege Tiers" : "สิทธิประโยชน์"}
                title={isEn ? "Compare Membership Plans" : "เปรียบเทียบทุกแพลน"}
                hint={
                  isEn
                    ? "Explore tiers, tokens, and daily limits"
                    : "ดูโควตารายวันและแพ็กเกจเปิดไพ่พรีเมียม"
                }
                onClick={() => {
                  soundManager.playMenuTapSound();
                  setExploreReason("explore");
                }}
              />
            </div>
          </SectionCard>

          {/* Notification & Communication Preferences (PDPA Opt-In) */}
          {user && (
            <SectionCard
              title={isEn ? "Notification Preferences (PDPA)" : "การแจ้งเตือนและความยินยอม (PDPA)"}
              description={
                isEn
                  ? "Control email notifications. All subscriptions are opt-in only and can be modified anytime."
                  : "ควบคุมการรับข้อมูลทางอีเมล ทุกรายการเป็นการสมัครใจ เปิดหรือปิดเมื่อไรก็ได้"
              }
            >
              <div className="divide-y divide-line-warm/50">
                <ConsentToggle
                  label={isEn ? "Reading Outcome Follow-ups" : "รับคำทำนายติดตามผล"}
                  hint={
                    isEn
                      ? "Receive email notifications when your readings reach their reflection date."
                      : "รับการแจ้งเตือนทางอีเมลเมื่อคำทำนายถึงกำหนดติดตามผลลัพธ์"
                  }
                  checked={!!user.marketingConsent}
                  saving={isUpdatingConsent}
                  onChange={handleUpdateConsent}
                />
                <ConsentToggle
                  label={isEn ? "Daily Tarot Guidance via Email" : "รับดวงประจำวันทางอีเมล"}
                  hint={
                    isEn
                      ? "One card drawn at sunrise each morning · unsubscribe from any email."
                      : "ไพ่นำทางวันละ 1 ใบทุกเช้า · ยกเลิกได้ทุกเมื่อจากในอีเมล"
                  }
                  checked={!!user.digestEmail}
                  saving={isUpdatingDigest}
                  onChange={handleUpdateDigest}
                />
              </div>
            </SectionCard>
          )}

          {/* Change Password & Security Card — พับเก็บไว้ ไม่ใช่ฟอร์มยาวคาหน้า */}
          <ChangePasswordCard />

          {/* Privacy & PDPA Control Card */}
          <SectionCard
            title={isEn ? "Privacy & Data Sovereign Rights" : "ความเป็นส่วนตัวและข้อมูลของคุณ"}
            description={
              isEn
                ? "Your inquiries and reading reflections are preserved in your own device storage — we keep no unnecessary permanent copy on our servers."
                : "คำถามและประวัติการดูดวงของคุณถูกเก็บไว้ในเครื่องของคุณเอง เราไม่เก็บสำเนาถาวรไว้บนเซิร์ฟเวอร์โดยไม่จำเป็น"
            }
            tone="danger"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-warm/50 pt-4">
              <Link
                href="/privacy"
                className="font-serif-th text-xs font-bold text-gold-ink underline transition-colors hover:text-ink-deep"
              >
                {isEn ? "Read Privacy Policy (PDPA / GDPR)" : "อ่านนโยบายความเป็นส่วนตัว (PDPA)"}
              </Link>
              <DeleteAllDataButton />
            </div>
          </SectionCard>
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
