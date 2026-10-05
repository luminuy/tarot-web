"use client";

import { useEffect, useId, useState } from "react";
import dynamic from "next/dynamic";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";
import {
  IconBook,
  IconCards,
  IconKey,
  IconLogin,
  IconLogout,
  IconMail,
  IconShield,
  IconSpark,
  IconSun,
  IconTag,
  IconTicket,
  IconTrash,
  RowIcon,
  SettingsRow,
  SettingsSection,
  StatTile,
} from "@/components/account/AccountParts";
import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";
import { useSessionUser, patchSessionUser, invalidateSessionCache } from "@/lib/auth/use-session";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import {
  CHEAPEST_PACKAGE_THB,
  describeEntitlement,
  formatResetCountdown,
  getMemberBenefits,
} from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { CheckMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

// INC-0130 / Rule 3.5: Dynamic modal imports placed outside <main> to avoid stacking context traps
const AuthModal = dynamic(() => import("@/components/auth/AuthModal").then((m) => m.AuthModal), {
  ssr: false,
});
const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false },
);

/**
 * สวิตช์ความยินยอมในรูป "แถว" ของกลุ่มตั้งค่า — ใช้ `role="switch"` จริง ไม่ใช่ `<input>` ซ่อนที่วาดด้วย `peer-*`
 * เพราะโปรแกรมอ่านหน้าจอต้องได้ยินทั้ง "ชื่อสวิตช์" และ "สถานะเปิด/ปิด" ในจังหวะเดียว
 * ขนาดแตะ 44x24 ผ่านเกณฑ์ WCAG 2.2 (24px) และมีสถานะกำลังบันทึกเพื่อกันกดรัว
 */
function ConsentToggle({
  icon,
  label,
  hint,
  checked,
  saving,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  saving: boolean;
  onChange: (next: boolean) => void;
}) {
  const labelId = useId();
  return (
    <div className="flex min-h-[64px] items-center gap-3.5 px-4 py-3.5 sm:px-5">
      <RowIcon>{icon}</RowIcon>
      <div className="min-w-0 flex-1">
        <p id={labelId} className="font-serif-th text-sm font-bold text-ink-deep">
          {label}
        </p>
        <p className="mt-0.5 font-serif-th text-xs leading-relaxed text-muted">{hint}</p>
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

/** "สมาชิกตั้งแต่ ตุลาคม 2569" — ปฏิทินตามภาษาของหน้า (ไทย = พ.ศ.) · วันที่อ่านไม่ได้ = ไม่แสดง */
function memberSinceLabel(createdAt: string | undefined, isEn: boolean): string | null {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  const month = d.toLocaleDateString(isEn ? "en-US" : "th-TH", { month: "long", year: "numeric" });
  return isEn ? `Member since ${month}` : `สมาชิกตั้งแต่ ${month}`;
}

export function AccountClient() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();

  const [pendingCount, setPendingCount] = useState(0);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
  const [isUpdatingDigest, setIsUpdatingDigest] = useState(false);
  /** บันทึกความยินยอมไม่สำเร็จ — ต้องบอกผู้ใช้ ห้ามให้สวิตช์แสดงว่าบันทึกแล้ว (A4-07) */
  const [consentError, setConsentError] = useState<string | null>(null);

  // Modal control states
  const [authModalOpen, setAuthModalOpen] = useState(false);
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


  /*
   * ⚠️ `fetch` ไม่โยนเมื่อได้ 4xx/5xx — ต้องเช็ก `res.ok` เองก่อนเปลี่ยนสวิตช์ (A4-07)
   * เดิมเปลี่ยนสวิตช์ทันที เซสชันหมดอายุ/D1 ล่ม ผู้ใช้กดถอนความยินยอม (PDPA opt-out) เห็นสวิตช์ปิด
   * แต่ฐานข้อมูลยังเปิด แล้วยังได้อีเมลต่อ = ละเมิดการถอนความยินยอมโดยไม่รู้ตัว
   */
  const postConsent = async (body: Record<string, boolean>): Promise<boolean> => {
    setConsentError(null);
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      });
      if (res.ok) return true;
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setConsentError(
        data.error ||
          (isEn ? "Could not save your preference. Please try again." : "บันทึกการตั้งค่าไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"),
      );
    } catch {
      setConsentError(isEn ? "Connection lost. Your preference was not saved." : "เชื่อมต่อไม่ได้ การตั้งค่ายังไม่ถูกบันทึก");
    }
    return false;
  };

  const handleUpdateConsent = async (consent: boolean) => {
    soundManager.playMenuTapSound();
    setIsUpdatingConsent(true);
    try {
      if (await postConsent({ marketing: consent })) patchSessionUser({ marketingConsent: consent });
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
      if (await postConsent({ digest: enabled })) {
        patchSessionUser(enabled ? { digestEmail: true, marketingConsent: true } : { digestEmail: false });
      }
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

  // ✦ สมุดดวงย้ายเป็นหน้าเต็ม `/journal` (REFLECTION_JOURNAL_PLAN 1.3) — รายการ · ปฏิทิน · ภาพรวม
  const openJournal = () => {
    soundManager.playMenuTapSound();
    window.location.href = isEn ? "/en/journal" : "/journal";
  };

  const openBuyCredits = () => {
    soundManager.playMenuTapSound();
    setCreditsModalOpen(true);
  };

  const providerLabel =
    user?.provider === "google"
      ? isEn ? "Signed in with Google" : "เข้าสู่ระบบด้วย Google"
      : user?.provider === "line"
        ? isEn ? "Signed in with LINE" : "เข้าสู่ระบบด้วย LINE"
        : isEn
          ? "Signed in with email"
          : "เข้าสู่ระบบด้วยอีเมล";

  /* ── สิทธิ์เปิดไพ่ (เดิมอยู่ใน EntitlementStatusCard แยก — รวมเข้าโครงเดียวกับทั้งหน้า) ── */
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
  const bonus = ent?.bonusRemaining ?? 0;
  const dailyFree = Math.max(0, ent?.dailyRemaining ?? (view ? view.remaining - bonus : 0));
  const streak = ent?.dailyStreak ?? 0;
  const [countdown, setCountdown] = useState("");
  useEffect(() => {
    if (!ent?.resetAt) return;
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt, Date.now(), isEn));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt, isEn]);
  const hasTrial = Boolean(user && ent?.premiumTrialAvailable && !ent?.hasPaidCredits);
  const memberSince = memberSinceLabel(user?.createdAt, isEn);

  return (
    <>
      <main
        id="main-content"
        tabIndex={-1}
        className="min-h-screen text-ink px-4 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12 font-sans selection:bg-gold/20 selection:text-ink"
      >
        <div className="mx-auto max-w-2xl space-y-8 sm:space-y-10">
          {/* ── หัวหน้า: ตัวตนของผู้ใช้ (แบบ Apple ID — รูปใหญ่ · ชื่อ · อีเมล · วิธีเข้าสู่ระบบ) ──────
              สามสถานะต้องสูงใกล้เคียงกัน ไม่งั้นหน้ากระโดดตอนเซสชันโหลดเสร็จ */}
          {/* ⚠️ ทุกสถานะต้องมี <h1> หนึ่งเดียว — HTML ตอนบิลด์คือสถานะ "กำลังโหลด" (ด่าน a11y ตรวจ h1 เดี่ยว + ลำดับหัวข้อ) */}
          {(loading || !user) && <h1 className="sr-only">{isEn ? "My account" : "บัญชีของฉัน"}</h1>}

          {loading && (
            <div className="flex flex-col items-center gap-4 text-center" aria-hidden="true">
              <div className="h-20 w-20 rounded-full bg-inset-warm sm:h-24 sm:w-24" />
              <div className="h-6 w-44 rounded-full bg-inset-warm" />
              <div className="h-4 w-60 rounded-full bg-inset-warm" />
            </div>
          )}

          {!loading && user && (
            <header className="flex flex-col items-center gap-4 text-center">
              <div className="relative">
                <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-surface bg-inset-warm shadow-[0_10px_30px_-12px_rgba(78,54,32,0.45)] sm:h-24 sm:w-24">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      /* ภาพประกอบล้วน — ชื่อผู้ใช้พิมพ์อยู่ข้างล่างแล้ว (INC-0125) */
                      alt=""
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center font-serif-th text-2xl font-bold text-ink-deep">
                      {user.name ? user.name.slice(0, 2).toUpperCase() : "M"}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <h1 className="font-serif-th text-xs font-semibold text-muted">{isEn ? "My account" : "บัญชีของฉัน"}</h1>
                <p className="font-serif-th text-2xl font-bold leading-snug text-ink-deep sm:text-3xl">
                  <ThaiPhrases>{user.name || (isEn ? "Member" : "สมาชิก")}</ThaiPhrases>
                </p>
                {user.email && <p className="break-all font-serif-th text-sm text-muted">{user.email}</p>}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span className="glass-chip px-3 py-1 font-serif-th text-xs text-ink">{providerLabel}</span>
                {memberSince && <span className="glass-chip px-3 py-1 font-serif-th text-xs text-ink">{memberSince}</span>}
              </div>

              {/* อีเมลยังไม่ยืนยัน — แจ้งตรงใต้ชื่อ ที่เดียวที่ผู้ใช้จะเห็นแน่ ๆ */}
              {user.emailVerified === false && (
                <div className="flex w-full flex-col gap-3 rounded-2xl border border-err/30 bg-err-wash p-4 text-left sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-0.5">
                    <p className="font-serif-th text-sm font-bold text-err">
                      {isEn ? "Please verify your email" : "ยืนยันอีเมลของคุณ"}
                    </p>
                    <p className="font-serif-th text-xs leading-relaxed text-muted">
                      {isEn
                        ? "Verify to receive follow-ups and the daily card by email."
                        : "ยืนยันก่อน จึงจะรับคำทำนายติดตามผลและดวงประจำวันทางอีเมลได้"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResendVerify}
                    className="tap-overlay-y min-h-[44px] shrink-0 self-start whitespace-nowrap rounded-full border border-err/40 px-4 font-serif-th text-xs font-bold text-err transition-colors hover:bg-err hover:text-surface cursor-pointer sm:self-auto"
                  >
                    {resendStatus || (isEn ? "Resend link" : "ส่งลิงก์ยืนยันอีกครั้ง")}
                  </button>
                </div>
              )}
            </header>
          )}

          {/* ── ยังไม่ได้เข้าสู่ระบบ: บอกว่าสมัครแล้วได้อะไร แล้วให้กดปุ่มเดียว ─────────────────── */}
          {!loading && !user && (
            <section className="altar-card-porcelain !rounded-2xl space-y-5 p-6 text-center sm:p-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-inset-warm text-gold-ink">
                <IconLogin />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-serif-th text-xl font-bold text-ink-deep sm:text-2xl">
                  <ThaiPhrases>{isEn ? "Sign in to your account" : "เข้าสู่ระบบบัญชีของคุณ"}</ThaiPhrases>
                </h2>
                <p className="mx-auto max-w-md font-serif-th text-sm leading-relaxed text-muted">
                  {isEn
                    ? "Free membership — keep your readings, get a free reading every day, and track how they turn out."
                    : "สมัครฟรี — เก็บประวัติการเปิดไพ่ ดูดวงฟรีทุกวัน และติดตามผลคำทำนายได้ต่อเนื่อง"}
                </p>
              </div>
              <ul className="mx-auto grid max-w-md gap-2 text-left">
                {getMemberBenefits(isEn).map((b) => (
                  <li key={b.title} className="flex items-start gap-2.5 font-serif-th text-sm text-ink-deep">
                    <CheckMarkIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-gold-ink" />
                    {b.title}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => {
                  soundManager.playMenuTapSound();
                  setAuthModalOpen(true);
                }}
                className="btn-gold-glass min-h-[48px] w-full max-w-xs px-6 font-serif-th text-sm font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
              >
                {isEn ? "Sign in / Sign up free" : "เข้าสู่ระบบ / สมัครฟรี"}
              </button>
            </section>
          )}

          {/* ── ตัวเลขสรุป 3 ช่อง: สิทธิ์วันนี้ · รอบที่เติม · วันต่อเนื่อง ─────────────────────── */}
          {user && view && (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              <StatTile
                label={isEn ? "Readings today" : "ดูดวงได้วันนี้"}
                value={
                  view.isUnlimited ? (
                    isEn ? "Unlimited" : "ไม่จำกัด"
                  ) : (
                    <>
                      {/* สิทธิ์ฟรีของวันนี้เท่านั้น — รอบที่เติมไว้แยกไปช่องถัดไป (เดิมรวมกันจนขึ้น "4/1" ชวนงง) */}
                      {dailyFree}
                      <span className="text-sm font-semibold text-muted sm:text-base">/{view.limit}</span>
                    </>
                  )
                }
                sub={
                  view.isUnlimited
                    ? undefined
                    : countdown
                      ? isEn
                        ? `Resets ${countdown}`
                        : `รีเซ็ต${countdown}`
                      : undefined
                }
              />
              <StatTile
                label={isEn ? "Top-up readings" : "รอบที่เติมไว้"}
                value={bonus}
                sub={isEn ? "Never expire" : "ไม่มีวันหมดอายุ"}
              />
              <StatTile
                label={isEn ? "Daily streak" : "เปิดไพ่รายวันติดกัน"}
                value={
                  <>
                    {streak}
                    <span className="text-sm font-semibold text-muted sm:text-base">{isEn ? " days" : " วัน"}</span>
                  </>
                }
                sub={isEn ? "Daily card" : "ไพ่ประจำวัน"}
              />
            </div>
          )}

          {/* ── ดูดวงและเติมรอบ ─────────────────────────────────────────────────── */}
          {user && view && (
            <SettingsSection id="account-readings" title={isEn ? "Readings & top-ups" : "ดูดวงและเติมรอบ"}>
              {view.isUnlimited ? (
                <SettingsRow
                  icon={<RowIcon><IconSpark /></RowIcon>}
                  label={isEn ? "Unlimited account" : "บัญชีไม่จำกัดสิทธิ์"}
                  hint={view.statusLine}
                />
              ) : (
                <SettingsRow
                  icon={<RowIcon><IconCards /></RowIcon>}
                  label={isEn ? "Top up readings" : "เติมรอบดูดวง"}
                  hint={
                    isEn
                      ? `Pay once, no subscription · from ${CHEAPEST_PACKAGE_THB} THB`
                      : `จ่ายครั้งเดียว ไม่มีรายเดือน · เริ่ม ${CHEAPEST_PACKAGE_THB} บาท`
                  }
                  trailing={
                    <button
                      type="button"
                      onClick={openBuyCredits}
                      className="btn-gold-glass min-h-[40px] shrink-0 px-4 font-serif-th text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2 sm:px-5 sm:text-sm"
                    >
                      {isEn ? "Top up" : "เติมรอบ"}
                    </button>
                  }
                />
              )}
              {!view.isUnlimited && (
                <SettingsRow
                  icon={<RowIcon><IconSun /></RowIcon>}
                  label={isEn ? "Free reading today" : "สิทธิ์ดูดวงฟรีวันนี้"}
                  hint={view.statusLine}
                  trailing={<QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />}
                />
              )}
              {hasTrial && (
                <SettingsRow
                  icon={<RowIcon><IconSpark /></RowIcon>}
                  label={isEn ? "Free big-spread trial" : "สิทธิ์ลองผังใหญ่ฟรี"}
                  hint={
                    isEn
                      ? "Open a 5–12 card spread or a master reader once, free"
                      : "เปิดผัง 5–12 ใบ หรือแม่หมอพิเศษได้ฟรี 1 ครั้ง"
                  }
                  href="/read/celtic-cross"
                />
              )}
              <SettingsRow
                icon={<RowIcon><IconTag /></RowIcon>}
                label={isEn ? "Pricing & packages" : "ราคาและแพ็กเกจ"}
                hint={isEn ? "Compare every package" : "เทียบแพ็กเกจทั้งหมด"}
                href="/pricing"
              />
              <SettingsRow
                icon={<RowIcon><IconTicket /></RowIcon>}
                label={isEn ? "Redeem a code" : "ใส่รหัสแลกสิทธิ์"}
                hint={isEn ? "Have a gift or promo code?" : "มีรหัสของขวัญหรือรหัสโปรโมชั่น"}
                onClick={openBuyCredits}
              />
            </SettingsSection>
          )}

          {/* ── ประวัติการดูดวง ─────────────────────────────────────────────────── */}
          {user && (
            <SettingsSection id="account-history" title={isEn ? "Your readings" : "ประวัติการดูดวง"}>
              <SettingsRow
                icon={<RowIcon><IconBook /></RowIcon>}
                label={isEn ? "Reading history" : "ประวัติการเปิดไพ่"}
                hint={
                  pendingCount > 0
                    ? isEn
                      ? "Some readings are ready for follow-up — note what actually happened"
                      : "มีคำทำนายถึงเวลาติดตามผลแล้ว บันทึกสิ่งที่เกิดขึ้นจริงได้เลย"
                    : isEn
                      ? "Revisit your cards and readings"
                      : "ย้อนดูไพ่และคำทำนายที่เคยเปิด"
                }
                trailing={
                  pendingCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-gold-ink px-2.5 py-0.5 font-serif-th text-xs font-bold text-surface">
                      {isEn ? `${pendingCount} to review` : `รอติดตาม ${pendingCount}`}
                    </span>
                  ) : undefined
                }
                onClick={openJournal}
              />
              {/* นัดปรึกษาแม่หมอตัวจริง — จองตอนล็อกอินอยู่ = เห็นได้ทุกเครื่อง */}
              <SettingsRow
                icon={<RowIcon><IconTicket /></RowIcon>}
                label={isEn ? "My consultations" : "นัดปรึกษาแม่หมอ"}
                hint={isEn ? "Queues and bookings with real readers" : "คิวและนัดคุยกับแม่หมอตัวจริงของคุณ"}
                href="/readers/bookings"
              />
            </SettingsSection>
          )}

          {/* ── การแจ้งเตือนทางอีเมล (PDPA: สมัครใจทุกรายการ) ───────────────────────── */}
          {user && (
            <SettingsSection
              id="account-notifications"
              title={isEn ? "Email notifications" : "การแจ้งเตือนทางอีเมล"}
              description={
                isEn
                  ? "Opt-in only — turn on or off anytime."
                  : "สมัครใจทุกรายการ เปิดหรือปิดได้ทุกเมื่อ (PDPA)"
              }
            >
              <ConsentToggle
                icon={<IconMail />}
                label={isEn ? "Reading follow-ups" : "แจ้งเตือนติดตามผลคำทำนาย"}
                hint={
                  isEn
                    ? "An email when a reading reaches its follow-up date"
                    : "ส่งอีเมลเมื่อคำทำนายถึงเวลาติดตามผล"
                }
                checked={!!user.marketingConsent}
                saving={isUpdatingConsent}
                onChange={handleUpdateConsent}
              />
              <ConsentToggle
                icon={<IconSun />}
                label={isEn ? "Daily card by email" : "ดวงประจำวันทางอีเมล"}
                hint={
                  isEn
                    ? "One guiding card every morning · unsubscribe from any email"
                    : "ไพ่นำทางวันละ 1 ใบทุกเช้า · ยกเลิกได้จากในอีเมล"
                }
                checked={!!user.digestEmail}
                saving={isUpdatingDigest}
                onChange={handleUpdateDigest}
              />
              {consentError && (
                <p role="alert" className="px-5 py-3 font-serif-th text-xs text-err">
                  {consentError}
                </p>
              )}
            </SettingsSection>
          )}

          {/* ── เข้าสู่ระบบและความปลอดภัย ─────────────────────────────────────────── */}
          {user && (
            <SettingsSection id="account-security" title={isEn ? "Sign-in & security" : "การเข้าสู่ระบบและความปลอดภัย"}>
              <SettingsRow
                icon={<RowIcon><IconLogin /></RowIcon>}
                label={isEn ? "Sign-in method" : "วิธีเข้าสู่ระบบ"}
                hint={providerLabel}
              />
              {/* เปลี่ยน/ตั้งรหัสผ่าน — พับเก็บไว้ (<details>) ไม่ใช่ฟอร์มยาวคาหน้า */}
              <ChangePasswordCard icon={<RowIcon><IconKey /></RowIcon>} />
            </SettingsSection>
          )}

          {/* ── ความเป็นส่วนตัวและข้อมูล ───────────────────────────────────────────── */}
          <SettingsSection
            id="account-privacy"
            title={isEn ? "Privacy & your data" : "ความเป็นส่วนตัวและข้อมูลของคุณ"}
            description={
              isEn
                ? "Your questions and reading notes live on your own device — we keep no unnecessary copies."
                : "คำถามและประวัติการดูดวงเก็บไว้ในเครื่องของคุณ เราไม่เก็บสำเนาถาวรบนเซิร์ฟเวอร์โดยไม่จำเป็น"
            }
          >
            <SettingsRow
              icon={<RowIcon><IconShield /></RowIcon>}
              label={isEn ? "Privacy policy" : "นโยบายความเป็นส่วนตัว"}
              hint="PDPA · GDPR"
              href="/privacy"
            />
            <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <RowIcon tone="danger"><IconTrash /></RowIcon>
                <div className="min-w-0">
                  <p className="font-serif-th text-sm font-bold text-ink-deep">
                    {isEn ? "Delete all my data" : "ลบข้อมูลทั้งหมดของฉัน"}
                  </p>
                  <p className="mt-0.5 font-serif-th text-xs leading-relaxed text-muted">
                    {isEn ? "Permanently removes your account and history" : "ลบบัญชีและประวัติทั้งหมดถาวร กู้คืนไม่ได้"}
                  </p>
                </div>
              </div>
              <DeleteAllDataButton />
            </div>
          </SettingsSection>

          {/* ── ออกจากระบบ — ท้ายหน้า แยกจากทุกอย่าง (แบบหน้าบัญชีของเว็บใหญ่) ──────────────────── */}
          {user && (
            <div className="space-y-3 text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="altar-card-porcelain !rounded-2xl tap-overlay-y flex min-h-[52px] w-full items-center justify-center gap-2 font-serif-th text-sm font-bold text-ink-deep transition-colors hover:text-err cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
              >
                <IconLogout />
                {isEn ? "Sign out" : "ออกจากระบบ"}
              </button>
              <p className="font-serif-th text-xs text-muted">
                {isEn ? "Signed in as " : "เข้าสู่ระบบอยู่ในชื่อ "}
                {user.email || user.name}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* INC-0130 / Rule 3.5: Modals placed strictly outside <main> */}
      {authModalOpen && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
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
