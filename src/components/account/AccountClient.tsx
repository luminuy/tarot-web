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
  RowText,
  SettingsRow,
  SettingsSection,
  StatTile,
} from "@/components/account/AccountParts";
import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";
import { useSessionUser, patchSessionUser, invalidateSessionCache } from "@/lib/auth/use-session";
import { clearPerUserBrowserData } from "@/lib/account/clear-user-data";
import { soundManager } from "@/lib/utils/audio";
import { useLocale } from "@/lib/i18n";
import {
  CHEAPEST_PACKAGE_THB,
  describeEntitlement,
  formatResetCountdown,
  getMemberBenefits,
} from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { ArrowIcon } from "@/components/ui/LineIcons";
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
    <div className="v3-ac-row">
      <RowIcon>{icon}</RowIcon>
      <span className="v3-ac-row-text">
        <span id={labelId} className="v3-ac-row-label">
          {label}
        </span>
        <span className="v3-ac-row-hint">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        disabled={saving}
        onClick={() => onChange(!checked)}
        className="v3-ac-switch"
      >
        <span aria-hidden="true" />
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

/** กล่อง "สมาชิกได้อะไรบ้าง" ของผู้ยังไม่เข้าสู่ระบบ (รายการเส้นซ้าย · กฎเหล็ก 2) */
function MemberPerks({ isEn, className }: { isEn: boolean; className?: string }) {
  return (
    <div className={`v3-ac-card${className ? ` ${className}` : ""}`}>
      <p className="v3-ac-perks-t">{isEn ? "What members get" : "สมาชิกได้อะไรบ้าง"}</p>
      <ul className="v3-ac-perks">
        {getMemberBenefits(isEn).map((b) => (
          <li key={b.title}>
            <ThaiPhrases>{b.title}</ThaiPhrases>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AccountClient() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const { user, loading } = useSessionUser();
  const guestLede = isEn
    ? "Free membership — keep your readings, get a free reading every day, and track how they turn out."
    : "สมัครฟรี เก็บประวัติการเปิดไพ่ ดูดวงฟรีทุกวัน และติดตามผลคำทำนายได้ต่อเนื่อง";
  const memberLede = isEn
    ? "Your readings, top-ups, history and email settings — all in one place."
    : "สิทธิ์ดูดวง เติมรอบ ประวัติคำทำนาย และการแจ้งเตือน รวมไว้ในที่เดียว";

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
    // สมุดดวง · ภาพสิทธิ์ · คำถามค้าง ของบัญชีนี้ต้องไม่ค้างให้คนถัดไปบนเครื่องเดียวกัน (A5-05 · A5-06)
    clearPerUserBrowserData();
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

  const signIn = () => {
    soundManager.playMenuTapSound();
    setAuthModalOpen(true);
  };

  return (
    <>
      <main id="main-content" tabIndex={-1} className={user ? "v3-ac has-user" : "v3-ac"}>
        {/* ── หัวหน้า: แถบครีม (ui2-dawn.css) — ซ้ายหัวข้อ · ขวาบัตรสมาชิก + ตัวเลขสรุป ──────────────
            ⚠️ h1 เดียวทุกสถานะ (กำลังโหลด · ยังไม่เข้าระบบ · เข้าแล้ว) — HTML ตอนบิลด์คือสถานะกำลังโหลด (ด่าน a11y) */}
        <header className="v3-ac-hero">
          <div className="v3-ac-hero-text">
            <p className="v3-ac-kicker">{isEn ? "SeerTarot account" : "บัญชีสมาชิก SeerTarot"}</p>
            <h1 className="v3-ac-title">
              {isEn ? (
                <>
                  My <span className="ui2-gold-night">account</span>
                </>
              ) : (
                <>
                  <span className="tp">บัญชี</span>
                  <span className="tp ui2-gold-night">ของฉัน</span>
                </>
              )}
            </h1>
            <p className="v3-ac-lede">
              {/* ระหว่างโหลด: วาดทั้งสองแบบ แล้วให้ CSS เลือกตามคุกกี้ใบ้ (`data-ac-hint` จาก account.astro)
                  ผู้เยี่ยมชมจึงเห็นโครงขนาดเท่าของจริงตั้งแต่เฟรมแรก หน้าไม่กระโดดตอน hydrate (A6-06) */}
              {loading ? (
                <>
                  <span className="v3-ac-when-guest"><ThaiPhrases>{guestLede}</ThaiPhrases></span>
                  <span className="v3-ac-when-member"><ThaiPhrases>{memberLede}</ThaiPhrases></span>
                </>
              ) : (
                <ThaiPhrases>{user ? memberLede : guestLede}</ThaiPhrases>
              )}
            </p>
            {(loading || !user) && (
              <button type="button" onClick={signIn} className={`ui2-btn ui2-btn-gold v3-ac-cta${loading ? " v3-ac-when-guest" : ""}`}>
                {isEn ? "Sign in / Sign up free" : "เข้าสู่ระบบ / สมัครฟรี"}
                <ArrowIcon className="v3-ac-cta-arrow" />
              </button>
            )}
          </div>

          <div className="v3-ac-hero-side">
            {/* โครงร่างระหว่างโหลด — สูงใกล้เคียงบัตรจริง หน้าไม่กระโดดตอนเซสชันมาถึง */}
            {loading && (
              <div className="v3-ac-card is-skel v3-ac-when-member" aria-hidden="true">
                <span className="v3-ac-avatar" />
                <span className="v3-ac-skel-line is-w1" />
                <span className="v3-ac-skel-line is-w2" />
              </div>
            )}
            {loading && <MemberPerks isEn={isEn} className="v3-ac-when-guest" />}

            {!loading && user && (
              <div className="v3-ac-card">
                <div className="v3-ac-card-top">
                  <span className="v3-ac-avatar">
                    {user.avatar ? (
                      /* ภาพประกอบล้วน — ชื่อผู้ใช้พิมพ์อยู่ข้าง ๆ แล้ว (INC-0125) */
                      <img src={user.avatar} alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{user.name ? user.name.slice(0, 2).toUpperCase() : "M"}</span>
                    )}
                  </span>
                  <span className="v3-ac-who">
                    <span className="v3-ac-name">
                      <ThaiPhrases>{user.name || (isEn ? "Member" : "สมาชิก")}</ThaiPhrases>
                    </span>
                    {user.email && <span className="v3-ac-email">{user.email}</span>}
                  </span>
                </div>
                <div className="v3-ac-chips">
                  <span className="v3-ac-chip">{providerLabel}</span>
                  {memberSince && <span className="v3-ac-chip">{memberSince}</span>}
                </div>

                {/* อีเมลยังไม่ยืนยัน — แจ้งในบัตรสมาชิก ที่เดียวที่ผู้ใช้จะเห็นแน่ ๆ */}
                {user.emailVerified === false && (
                  <div className="v3-ac-verify">
                    <div>
                      <p className="v3-ac-verify-t">{isEn ? "Please verify your email" : "ยืนยันอีเมลของคุณ"}</p>
                      <p className="v3-ac-verify-d">
                        {isEn
                          ? "Verify to receive follow-ups and the daily card by email."
                          : "ยืนยันก่อน จึงจะรับคำทำนายติดตามผลและดวงประจำวันทางอีเมลได้"}
                      </p>
                    </div>
                    <button type="button" onClick={handleResendVerify} className="v3-ac-verify-btn">
                      {resendStatus || (isEn ? "Resend link" : "ส่งลิงก์ยืนยันอีกครั้ง")}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── ตัวเลขสรุป 3 ช่อง: สิทธิ์วันนี้ · รอบที่เติม · วันต่อเนื่อง ── */}
            {user && view && (
              <div className="v3-ac-stats">
                <StatTile
                  label={isEn ? "Readings today" : "ดูดวงได้วันนี้"}
                  value={
                    view.isUnlimited ? (
                      isEn ? "Unlimited" : "ไม่จำกัด"
                    ) : (
                      <>
                        {/* สิทธิ์ฟรีของวันนี้เท่านั้น — รอบที่เติมไว้แยกไปช่องถัดไป (เดิมรวมกันจนขึ้น "4/1" ชวนงง) */}
                        {dailyFree}
                        <small>/{view.limit}</small>
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
                      <small>{isEn ? " days" : " วัน"}</small>
                    </>
                  }
                  sub={isEn ? "Daily card" : "ไพ่ประจำวัน"}
                />
              </div>
            )}

            {/* ── ยังไม่ได้เข้าสู่ระบบ: สมัครแล้วได้อะไร (รายการเส้นซ้าย · กฎเหล็ก 2) ── */}
            {!loading && !user && <MemberPerks isEn={isEn} />}
          </div>
        </header>

        <div className="v3-ac-body">
          <div className="v3-ac-col">
            {/* ── ดูดวงและเติมรอบ ── */}
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
                      <button type="button" onClick={openBuyCredits} className="v3-ac-btn">
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

            {/* ── ประวัติการดูดวง ── */}
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
                      <span className="v3-ac-badge">
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

          </div>

          <div className="v3-ac-col">
            {/* ── การแจ้งเตือนทางอีเมล (PDPA: สมัครใจทุกรายการ) ── */}
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
                  <p role="alert" className="v3-ac-alert">
                    {consentError}
                  </p>
                )}
              </SettingsSection>
            )}
            {/* ── เข้าสู่ระบบและความปลอดภัย ── */}
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

            {/* ── ความเป็นส่วนตัวและข้อมูล ── */}
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
              <div className="v3-ac-row is-stack">
                <span className="v3-ac-row-main">
                  <RowIcon tone="danger"><IconTrash /></RowIcon>
                  <RowText
                    label={isEn ? "Delete all my data" : "ลบข้อมูลทั้งหมดของฉัน"}
                    hint={isEn ? "Permanently removes your account and history" : "ลบบัญชีและประวัติทั้งหมดถาวร กู้คืนไม่ได้"}
                  />
                </span>
                <DeleteAllDataButton />
              </div>
            </SettingsSection>

            {/* ── ออกจากระบบ — ท้ายคอลัมน์ แยกจากทุกอย่าง (แบบหน้าบัญชีของเว็บใหญ่) ── */}
            {user && (
              <div className="v3-ac-out">
                <button type="button" onClick={handleLogout} className="v3-ac-out-btn">
                  <IconLogout />
                  {isEn ? "Sign out" : "ออกจากระบบ"}
                </button>
                <p className="v3-ac-out-note">
                  {isEn ? "Signed in as " : "เข้าสู่ระบบอยู่ในชื่อ "}
                  {user.email || user.name}
                </p>
              </div>
            )}
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
