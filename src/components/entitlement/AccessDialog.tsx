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
      <div className="space-y-6 text-[#2E211A]">
        {/* ป้ายบอกว่าหน้าต่างนี้เปิดขึ้นเพราะอะไร */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D9C8AC] bg-[#F3EDE2] px-3 py-1 font-mono text-[13px] uppercase tracking-[0.18em] text-[#8F5C1A]">
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
          <div className="rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-4 sm:p-5 ">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="block font-mono text-[13px] uppercase tracking-[0.16em] text-[#635B4E]">
                  {isEn ? "Current Status" : "สถานะตอนนี้"}
                </span>
                <span className="block font-serif-th text-sm font-bold text-[#2E211A]">{view.statusLine}</span>
              </div>
              <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
            </div>

            {!isGuest && (
              <div className="mt-3 flex items-center gap-2 border-t border-[#D9C8AC]/30 pt-3 font-serif-th text-xs text-[#635B4E]">
                <HourglassIcon className="h-3.5 w-3.5 shrink-0 text-[#8F5C1A]" />
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
            <h3 className="font-serif-th text-sm font-bold text-[#2E211A]">
              <span className="text-[#8F5C1A]">✦</span>{" "}
              {view?.isMember
                ? (isEn ? "Your Active Member Benefits" : "สิทธิประโยชน์ที่คุณได้รับ (สมาชิกทั่วไป)")
                : (isEn ? "Benefits of Creating a Free Account" : "สมัครสมาชิกฟรีแล้วได้อะไรบ้าง")}
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {memberBenefits.map((b) => (
                <li key={b.title} className="flex gap-2.5 rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] p-3 ">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#8F5C1A]/20 text-[#8F5C1A]">
                    <CheckMarkIcon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif-th text-xs font-bold text-[#2E211A]">{b.title}</span>
                    <span className="block font-serif-th text-[13px] leading-relaxed text-[#635B4E]">{b.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── ทางเลือกเมื่อโควตาวันนี้หมด ─────────────────────────── */}
        {showCredits && (
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] p-4 ">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-[#2E211A]">
                <HourglassIcon className="h-4 w-4 text-[#8F5C1A]" />
                {isEn ? "Wait for Free Daily Renewal" : "รอโควตาฟรีรอบใหม่"}
              </span>
              <p className="font-serif-th text-[13px] leading-relaxed text-[#635B4E]">
                {isEn
                  ? `Completely free. Return after midnight for ${DAILY_LIMIT} fresh readings${countdown ? ` (${countdown})` : ""}.`
                  : `ไม่ต้องจ่ายอะไร กลับมาหลังเที่ยงคืนแล้วเปิดไพ่ได้อีก ${DAILY_LIMIT} ครั้ง${countdown ? ` (${countdown})` : ""}`}
              </p>
            </div>
            <div className="rounded-lg border-2 border-[#D9C8AC] bg-[#FFFFFF] p-4 ">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-[#8F5C1A]">
                <CoinSealIcon className="h-4 w-4" />
                {isEn ? "Sacred Tokens (Continue Now)" : "ญาณพยากรณ์พิเศษ (ใช้ต่อได้ทันที)"}
              </span>
              <p className="font-serif-th text-[13px] leading-relaxed text-[#2E211A]">
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
                      ? "border-2 border-[#D9C8AC] bg-[#FFFFFF]"
                      : plan.highlight
                        ? "border border-[#D9C8AC]/80 bg-[#FFFFFF]"
                        : "border border-[#D9C8AC]/60 bg-[#F3EDE2]"
                  }`}
                >
                  {isSpecial ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-[#8F5C1A] px-2 py-0.5 font-serif-th text-[12px] font-bold text-[#FFFFFF] ">
                      {isEn ? "✦ Highest Level" : "✦ ปลดล็อกขั้นสุด"}
                    </span>
                  ) : plan.highlight ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-[#F3EDE2] border border-[#D9C8AC] px-2 py-0.5 font-serif-th text-[12px] font-bold text-[#2E211A]">
                      {plan.highlight}
                    </span>
                  ) : null}
                  <span className="font-serif-th text-sm font-bold text-[#2E211A]">{plan.name}</span>
                  <span className="mt-1 font-mono text-lg font-bold text-[#8F5C1A]">{plan.price}</span>
                  <span className="font-serif-th text-[13px] text-[#635B4E]">{plan.priceNote}</span>
                  {isCurrent && (
                    <span className="mt-2 inline-flex w-fit rounded border border-[#D9C8AC] bg-[#F3EDE2] px-1.5 py-0.5 font-serif-th text-[12px] text-[#2E211A]">
                      {isEn ? "Your Current Plan" : "แผนปัจจุบันของคุณ"}
                    </span>
                  )}
                  <ul className="mt-3 space-y-1.5 border-t border-[#D9C8AC]/30 pt-3">
                    {plan.features.map((f) => (
                      <li
                        key={f.label}
                        className={`flex items-start gap-1.5 font-serif-th text-[13px] leading-snug ${
                          f.included ? "text-[#2E211A]" : "text-[#635B4E]"
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 ${f.included ? "text-[#8F5C1A]" : "text-[#635B4E]"}`}>
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
              className="w-full rounded-full bg-[#8F5C1A] hover:bg-[#74490F] px-6 py-3.5 font-serif-th text-sm font-bold text-[#FFFFFF] transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
            >
              <span className="mr-1.5">✦</span>
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
              className="w-full rounded-full bg-[#8F5C1A] hover:bg-[#74490F] px-6 py-3.5 font-serif-th text-sm font-bold text-[#FFFFFF] transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
            >
              <span className="mr-1.5">✦</span>
              {isEn
                ? `Unlock Sacred Tokens (From ${CHEAPEST_PACKAGE_THB}.-)`
                : `ปลดล็อกญาณพยากรณ์พิเศษ (เริ่ม ${CHEAPEST_PACKAGE_THB}.-)`}
            </button>
          )}

          <button
            type="button"
            onClick={handleSecondary}
            className="w-full rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] hover:bg-[#FFFFFF] hover:border-[#8F5C1A] px-6 py-3 font-serif-th text-xs text-[#2E211A] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
          >
            {copy.secondaryLabel}
          </button>

          <p className="pt-1 text-center font-serif-th text-[13px] leading-relaxed text-[#635B4E]">
            {copy.reassurance}
          </p>
        </div>
      </div>
    </Modal>
  );
}
