"use client";

import { useEffect } from "react";
import { PurchasePanel } from "@/components/entitlement/PurchasePanel";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

import { Modal } from "@/components/ui/Modal";
import { QuotaPips } from "@/components/entitlement/QuotaPips";
import {
  CheckMarkIcon,
  DashMarkIcon,
  HourglassIcon,
  SealedLockIcon,
  SparkSealIcon,
} from "@/components/entitlement/EntitlementIcons";
import {
  CHEAPEST_PACKAGE_THB,
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
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

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

  /*
   * 💳 เหตุผลที่ต้อง "เติมรอบ" (โควตาหมด · ผังใหญ่ · แม่หมอพิเศษ · ถามต่อไม่จำกัด)
   * ➔ ขายในหน้าต่างนี้เลยด้วย `PurchasePanel` ชุดเดียวกับหน้าต่างเติมรอบ
   *
   * 🔴 เดิมหน้าต่างนี้มีกล่องสถานะ + กล่อง "เติมรอบ เปิดต่อได้เลย" + ปุ่ม แล้วกดปุ่มกลับไปเปิด
   *    **หน้าต่างที่สองที่ขายของซ้ำอีกรอบ** — เจ้าของเจอว่าซ้ำซ้อน ต้องกดสองชั้นกว่าจะถึงหน้าจ่ายเงิน
   */
  if (showCredits) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        maxWidth="lg"
        showCloseButton
        title={copy.title}
        description={<span className="font-serif-th leading-relaxed">{copy.body}</span>}
      >
        <div className="space-y-5 pt-1">
          {reason === "daily_exhausted" && (
            <p className="glass-chip mx-auto flex w-fit items-center gap-1.5 px-3 py-1.5 font-serif-th text-xs font-semibold text-ink-deep">
              <HourglassIcon className="h-3.5 w-3.5 text-gold-ink" />
              {isEn
                ? `Free reading back ${countdown || "after midnight"}`
                : `เปิดไพ่ฟรีได้อีกครั้ง${countdown ? ` ${countdown}` : "หลังเที่ยงคืน"}`}
            </p>
          )}
          <PurchasePanel
            onDone={onClose}
            onRequireAuth={() => {
              trackEntitlementEvent(`access_dialog_primary:${reason}`);
              onClose();
              onSignup();
            }}
          />
          <p className="text-center">
            <button
              type="button"
              onClick={handleSecondary}
              className="tap-overlay-y font-serif-th text-sm text-muted underline underline-offset-4 hover:text-ink-deep cursor-pointer"
            >
              {copy.secondaryLabel}
            </button>
          </p>
        </div>
      </Modal>
    );
  }

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
        {/* ป้ายบอกว่าหน้าต่างนี้เปิดขึ้นเพราะอะไร (เหตุผลที่ต้องเติมรอบใช้หน้าต่างแบบ PurchasePanel ข้างบน) */}
        <span className="glass-chip inline-flex items-center gap-1.5 px-3 py-1 font-serif-th text-xs font-semibold text-gold-ink">
          {reason === "explore" ? (
            <SparkSealIcon className="h-3.5 w-3.5" />
          ) : (
            <SealedLockIcon className="h-3.5 w-3.5" />
          )}
          {copy.eyebrow}
        </span>

        {/* ── สถานะสิทธิ์ปัจจุบัน ─────────────────────────────────── */}
        {view && (
            <div className="altar-panel !rounded-2xl p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="block font-serif-th text-xs text-muted">
                    {isEn ? "Current status" : "สถานะตอนนี้"}
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
                      ? `New daily readings arrive${countdown ? ` ${countdown}` : ""} · Resets ${resetClockLabel(true)}`
                      : `สิทธิ์ฟรีชุดใหม่มาถึง${countdown ? ` ${countdown}` : ""} · รีเซ็ต${resetClockLabel(false)}`}
                  </span>
                </div>
              )}
            </div>
          )}

        {/* ── สิ่งที่ได้เพิ่ม ─────────────────────────────────────── */}
          <section className="space-y-3">
            <h3 className="font-serif-th text-sm font-bold text-ink-deep"><ThaiPhrases>
              {view?.isMember
                ? isEn
                  ? "Your Active Member Benefits"
                  : "สิทธิประโยชน์ที่คุณได้รับ (สมาชิกทั่วไป)"
                : isEn
                  ? "Benefits of Creating a Free Account"
                  : "สมัครสมาชิกฟรีแล้วได้อะไรบ้าง"}
            </ThaiPhrases></h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {memberBenefits.map((b) => (
                <li key={b.title} className="glass-tile !rounded-lg flex gap-2.5 p-3">
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
                    <span className="glass-chip absolute -top-2.5 right-3 px-2 py-0.5 font-serif-th text-[12px] font-bold text-ink-deep">
                      {plan.highlight}
                    </span>
                  ) : null}
                  <span className="font-serif-th text-sm font-bold text-ink-deep">{plan.name}</span>
                  <span className="mt-1 font-mono text-lg font-bold text-gold-ink">{plan.price}</span>
                  <span className="font-serif-th text-[13px] text-muted">{plan.priceNote}</span>
                  {isCurrent && (
                    <span className="glass-tile !rounded mt-2 inline-flex w-fit px-1.5 py-0.5 font-serif-th text-[12px] text-ink-deep">
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
              className="btn-gold-glass w-full px-6 py-3.5 font-serif-th text-sm font-bold active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
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
              className="btn-gold-glass w-full px-6 py-3.5 font-serif-th text-sm font-bold active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
            >
              {isEn
                ? `See top-up packages (from ${CHEAPEST_PACKAGE_THB} THB)`
                : `ดูแพ็กเติมรอบ (เริ่ม ${CHEAPEST_PACKAGE_THB} บาท)`}
            </button>
          )}

          <button
            type="button"
            onClick={handleSecondary}
            className="glass-chip w-full px-6 py-3 font-serif-th text-sm text-ink-deep font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          >
            {copy.secondaryLabel}
          </button>

          <p className="pt-1 text-center font-serif-th text-[13px] leading-relaxed text-muted">{copy.reassurance}</p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-1">
            <Link
              href="/pricing"
              prefetch={false}
              className="text-xs text-gold-ink hover:text-gold-ink-deep font-serif-th underline underline-offset-4"
            >
              {isEn ? "Compare plans & prices" : "ดูราคาและเทียบสิทธิ์ทั้งหมด"}
            </Link>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuyCredits();
              }}
              className="text-xs text-gold-ink hover:text-gold-ink-deep font-serif-th underline underline-offset-4 cursor-pointer"
            >
              {isEn ? "Have a redeem code? Enter it here" : "มีรหัสแลกสิทธิ์? ใส่รหัสที่นี่"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
