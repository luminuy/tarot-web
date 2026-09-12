"use client";

import { useEffect } from "react";

import { Modal } from "@/components/ui/Modal";
import { QuotaPips } from "@/components/entitlement/QuotaPips";
import {
  CheckMarkIcon,
  CoinSealIcon,
  DashMarkIcon,
  HourglassIcon,
  SealedLockIcon,
  SparkSealIcon,
} from "@/components/entitlement/EntitlementIcons";
import {
  CHEAPEST_PACKAGE_THB,
  DAILY_LIMIT,
  READINGS_EN,
  describeEntitlement,
  formatResetCountdown,
  getAccessPlans,
  getMemberBenefits,
  getUpgradeCopy,
  resetClockLabel,
  type UpgradeReason,
} from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useLocale } from "@/lib/i18n";

/**
 * หน้าต่างสิทธิ์การใช้งาน — จุดเดียวที่อธิบายเรื่องสิทธิ์ทั้งหมด
 * ------------------------------------------------------------------
 * ของเดิมกระจายอยู่ 4 ที่ (แถบแดง error + AuthModal เด้งเอง + การ์ดกั้นผัง + ป้ายบนหัว)
 * ผู้ใช้จึงโดนข้อความซ้อนกัน 2 ชั้นพร้อมกันเวลาสิทธิ์หมด
 *
 * ตัวนี้รับ `reason` แล้วเลือกถ้อยคำ/ปุ่ม/เนื้อหาให้ตรงสถานการณ์เดียว:
 *  - guest_used      ผู้เยี่ยมชมใช้สิทธิ์ทดลองครบ  → ชวนสมัคร
 *  - daily_exhausted สมาชิกใช้โควตาวันนี้ครบ       → บอกเวลารีเซ็ต + เสนอเติมรอบ
 *  - members_only    ฟีเจอร์เฉพาะสมาชิก            → ชวนสมัคร
 *  - explore         ผู้ใช้กดดูเอง                  → ตารางเทียบสิทธิ์ ไม่กดดัน
 */
export function AccessDialog({
  reason,
  onClose,
  onSignup,
  onSignin,
  onBuyCredits,
}: {
  reason: UpgradeReason | null;
  onClose: () => void;
  onSignup: () => void;
  onSignin: () => void;
  onBuyCredits: () => void;
}) {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
  const isOpen = reason !== null;

  useEffect(() => {
    if (reason) trackEntitlementEvent(`access_dialog_shown:${reason}`);
  }, [reason]);

  if (!isOpen || !reason) return null;

  const copy = getUpgradeCopy(reason, isEn);
  const countdown = formatResetCountdown(ent?.resetAt ?? null, Date.now(), isEn);
  const isGuest = view?.isGuest ?? true;
  const showCredits = copy.primaryAction === "credits";
  const memberBenefits = getMemberBenefits(isEn);
  const accessPlans = getAccessPlans(isEn);

  const handlePrimary = () => {
    trackEntitlementEvent(`access_dialog_primary:${reason}`);
    onClose();
    if (copy.primaryAction === "credits") onBuyCredits();
    else onSignup();
  };

  const handleSecondary = () => {
    trackEntitlementEvent(`access_dialog_secondary:${reason}`);
    onClose();
    if (copy.primaryAction === "signup" && reason !== "explore") onSignin();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="2xl"
      showCloseButton
      title={copy.title}
      description={<span className="font-serif-th leading-relaxed">{copy.body}</span>}
    >
      <div className="space-y-6 text-ink-deep">
        {/* ป้ายบอกว่าหน้าต่างนี้เปิดขึ้นเพราะอะไร */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line-warm bg-inset-warm px-3 py-1 font-mono text-[13px] uppercase tracking-[0.18em] text-gold-ink">
          {showCredits ? (
            <HourglassIcon className="h-3.5 w-3.5" />
          ) : reason === "explore" ? (
            <SparkSealIcon className="h-3.5 w-3.5" />
          ) : (
            <SealedLockIcon className="h-3.5 w-3.5" />
          )}
          {copy.eyebrow}
        </span>

        {/* ── สถานะสิทธิ์ปัจจุบัน ─────────────────────────────────── */}
        {view && (
          <div className="rounded-lg border border-line-warm bg-surface p-4 sm:p-5 ">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="block font-mono text-[13px] uppercase tracking-[0.16em] text-muted">
                  {isEn ? "Current Status" : "สถานะตอนนี้"}
                </span>
                <span className="block font-serif-th text-sm font-bold text-ink-deep">{view.statusLine}</span>
              </div>
              <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
            </div>

            {!isGuest && (
              <div className="mt-3 flex items-center gap-2 border-t border-line-warm/30 pt-3 font-serif-th text-xs text-muted">
                <HourglassIcon className="h-3.5 w-3.5 shrink-0 text-gold-ink" />
                <span>
                  {isEn
                    ? `New daily readings arrive${countdown ? ` in ${countdown}` : ""} · Resets ${resetClockLabel(true)}`
                    : `โควตาฟรีชุดใหม่มาถึง${countdown ? ` ${countdown}` : ""} · รีเซ็ต${resetClockLabel(false)}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── สิ่งที่ได้เพิ่ม ─────────────────────────────────────── */}
        {!showCredits && (
          <section className="space-y-3">
            <h3 className="font-serif-th text-sm font-bold text-ink-deep">
              
              {view?.isMember
                ? (isEn ? "Your Active Member Benefits" : "สิทธิประโยชน์ที่คุณได้รับ (สมาชิกทั่วไป)")
                : (isEn ? "Benefits of Creating a Free Account" : "สมัครสมาชิกฟรีแล้วได้อะไรบ้าง")}
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {memberBenefits.map((b) => (
                <li key={b.title} className="flex gap-2.5 rounded-lg border border-line-warm bg-inset-warm p-3 ">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-ink/20 text-gold-ink">
                    <CheckMarkIcon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif-th text-xs font-bold text-ink-deep">{b.title}</span>
                    <span className="block font-serif-th text-[13px] leading-relaxed text-muted">{b.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── ทางเลือกเมื่อโควตาวันนี้หมด ─────────────────────────── */}
        {showCredits && (
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-line-warm bg-inset-warm p-4 ">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-ink-deep">
                <HourglassIcon className="h-4 w-4 text-gold-ink" />
                {isEn ? "Wait for Free Daily Renewal" : "รอโควตาฟรีรอบใหม่"}
              </span>
              <p className="font-serif-th text-[13px] leading-relaxed text-muted">
                {isEn
                  ? `Completely free. Return after midnight for ${DAILY_LIMIT} fresh ${READINGS_EN}${countdown ? ` (${countdown})` : ""}.`
                  : `ไม่ต้องจ่ายอะไร กลับมาหลังเที่ยงคืนแล้วเปิดไพ่ได้อีก ${DAILY_LIMIT} ครั้ง${countdown ? ` (${countdown})` : ""}`}
              </p>
            </div>
            <div className="rounded-lg border-2 border-line-warm bg-surface p-4 ">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-gold-ink">
                <CoinSealIcon className="h-4 w-4" />
                {isEn ? "Sacred Tokens (Continue Now)" : "ญาณพยากรณ์พิเศษ (ใช้ต่อได้ทันที)"}
              </span>
              <p className="font-serif-th text-[13px] leading-relaxed text-ink-deep">
                {isEn
                  ? `One-time purchase starting at ${CHEAPEST_PACKAGE_THB} THB · Unlock full 10–12 card spreads and unlimited archetypal dialogue. Never expires.`
                  : `จ่ายครั้งเดียวเริ่มต้น ${CHEAPEST_PACKAGE_THB} บาท · ปลดล็อกผังใหญ่ 10–12 ใบ และคุยถามแม่หมอเจาะลึกได้ไม่จำกัด ไม่มีวันหมดอายุ`}
              </p>
            </div>
          </section>
        )}

        {/* ── ตารางเทียบสิทธิ์ ────────────────────────────────────── */}
        {reason === "explore" && (
          <section className="grid gap-3 sm:grid-cols-3">
            {accessPlans.map((plan) => {
              const isCurrent = (plan.id === "guest" && isGuest) || (plan.id === "member" && view?.isMember);
              const isSpecial = plan.id === "credits";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-lg border p-4 ${
                    isSpecial
                      ? "border-2 border-line-warm bg-surface"
                      : plan.highlight
                        ? "border border-line-warm/80 bg-surface"
                        : "border border-line-warm/60 bg-inset-warm"
                  }`}
                >
                  {isSpecial ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-gold-ink px-2 py-0.5 font-serif-th text-[12px] font-bold text-surface ">
                      {isEn ? "Highest Level" : "ปลดล็อกขั้นสุด"}
                    </span>
                  ) : plan.highlight ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-inset-warm border border-line-warm px-2 py-0.5 font-serif-th text-[12px] font-bold text-ink-deep">
                      {plan.highlight}
                    </span>
                  ) : null}
                  <span className="font-serif-th text-sm font-bold text-ink-deep">{plan.name}</span>
                  <span className="mt-1 font-mono text-lg font-bold text-gold-ink">{plan.price}</span>
                  <span className="font-serif-th text-[13px] text-muted">{plan.priceNote}</span>
                  {isCurrent && (
                    <span className="mt-2 inline-flex w-fit rounded border border-line-warm bg-inset-warm px-1.5 py-0.5 font-serif-th text-[12px] text-ink-deep">
                      {isEn ? "Your Current Plan" : "แผนปัจจุบันของคุณ"}
                    </span>
                  )}
                  <ul className="mt-3 space-y-1.5 border-t border-line-warm/30 pt-3">
                    {plan.features.map((f) => (
                      <li
                        key={f.label}
                        className={`flex items-start gap-1.5 font-serif-th text-[13px] leading-snug ${
                          f.included ? "text-ink-deep" : "text-muted"
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 ${f.included ? "text-gold-ink" : "text-muted"}`}>
                          {f.included ? <CheckMarkIcon className="h-3 w-3" /> : <DashMarkIcon className="h-3 w-3" />}
                        </span>
                        {f.label}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        )}

        {/* ── ปุ่มลงมือ ───────────────────────────────────────────── */}
        <div className="space-y-2.5">
          {!(reason === "explore" && view?.isMember) ? (
            <button
              type="button"
              onClick={handlePrimary}
              className="w-full rounded-full bg-gold-ink hover:bg-gold-ink-deep px-6 py-3.5 font-serif-th text-sm font-bold text-surface transition active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              
              {copy.primaryLabel}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                trackEntitlementEvent("access_dialog_primary:explore_credits");
                onClose();
                onBuyCredits();
              }}
              className="w-full rounded-full bg-gold-ink hover:bg-gold-ink-deep px-6 py-3.5 font-serif-th text-sm font-bold text-surface transition active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              
              {isEn
                ? `Unlock Sacred Tokens (From ${CHEAPEST_PACKAGE_THB}.-)`
                : `ปลดล็อกญาณพยากรณ์พิเศษ (เริ่ม ${CHEAPEST_PACKAGE_THB}.-)`}
            </button>
          )}

          <button
            type="button"
            onClick={handleSecondary}
            className="w-full rounded-lg border border-line-warm bg-inset-warm hover:bg-surface hover:border-gold-ink px-6 py-3 font-serif-th text-xs text-ink-deep font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          >
            {copy.secondaryLabel}
          </button>

          <p className="pt-1 text-center font-serif-th text-[13px] leading-relaxed text-muted">
            {copy.reassurance}
          </p>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuyCredits();
              }}
              className="text-xs text-gold-ink hover:text-gold-ink-deep font-serif-th underline underline-offset-4 cursor-pointer"
            >
              {isEn ? "Have a redeem code? Click here" : "มีรหัสแลกสิทธิ์ใช่ไหม? กดที่นี่เพื่อแลกรับสิทธิ์"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
