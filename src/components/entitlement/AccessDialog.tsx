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
  ACCESS_PLANS,
  CHEAPEST_PACKAGE_THB,
  DAILY_LIMIT,
  MEMBER_BENEFITS,
  UPGRADE_COPY,
  describeEntitlement,
  formatResetCountdown,
  resetClockLabel,
  type UpgradeReason,
} from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

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
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
  const isOpen = reason !== null;

  useEffect(() => {
    if (reason) trackEntitlementEvent(`access_dialog_shown:${reason}`);
  }, [reason]);

  if (!isOpen) return null;

  const copy = UPGRADE_COPY[reason];
  const countdown = formatResetCountdown(ent?.resetAt ?? null);
  const isGuest = view?.isGuest ?? true;
  const showCredits = copy.primaryAction === "credits";

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
      <div className="space-y-6 text-[#5A432F]">
        {/* ป้ายบอกว่าหน้าต่างนี้เปิดขึ้นเพราะอะไร */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D6B48D] bg-[#FCF0E6] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#CD9F5B]">
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
          <div className="rounded-2xl border border-[#D6B48D] bg-[#FDF7F0] p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#8C735D]">
                  สถานะตอนนี้
                </span>
                <span className="block font-serif-th text-sm font-bold text-[#5A432F]">
                  {view.statusLine}
                </span>
              </div>
              <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
            </div>

            {!isGuest && (
              <div className="mt-3 flex items-center gap-2 border-t border-[#D6B48D]/30 pt-3 font-serif-th text-xs text-[#8C735D]">
                <HourglassIcon className="h-3.5 w-3.5 shrink-0 text-[#CD9F5B]" />
                <span>
                  โควตาฟรีชุดใหม่มาถึง{countdown ? ` ${countdown}` : ""} · รีเซ็ต{resetClockLabel()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* ── สิ่งที่ได้เพิ่ม ─────────────────────────────────────── */}
        {!showCredits && (
          <section className="space-y-3">
            <h3 className="font-serif-th text-sm font-bold text-[#5A432F]">
              <span className="text-[#CD9F5B]">✦</span> {view?.isMember ? "สิทธิประโยชน์ที่คุณได้รับ (สมาชิกทั่วไป)" : "สมัครสมาชิกฟรีแล้วได้อะไรบ้าง"}
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {MEMBER_BENEFITS.map((b) => (
                <li
                  key={b.title}
                  className="flex gap-2.5 rounded-xl border border-[#D6B48D] bg-[#FCF0E6] p-3 shadow-xs"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#CD9F5B]/20 text-[#CD9F5B]">
                    <CheckMarkIcon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif-th text-xs font-bold text-[#5A432F]">{b.title}</span>
                    <span className="block font-serif-th text-[11px] leading-relaxed text-[#8C735D]">
                      {b.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── ทางเลือกเมื่อโควตาวันนี้หมด ─────────────────────────── */}
        {showCredits && (
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] p-4 shadow-xs">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-[#5A432F]">
                <HourglassIcon className="h-4 w-4 text-[#CD9F5B]" /> รอโควตาฟรีรอบใหม่
              </span>
              <p className="font-serif-th text-[11px] leading-relaxed text-[#8C735D]">
                ไม่ต้องจ่ายอะไร กลับมาหลังเที่ยงคืนแล้วเปิดไพ่ได้อีก {DAILY_LIMIT} ครั้ง
                {countdown ? ` (${countdown})` : ""}
              </p>
            </div>
            <div className="rounded-2xl border-2 border-[#CD9F5B] bg-[#FDF7F0] p-4 shadow-xs">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-[#CD9F5B]">
                <CoinSealIcon className="h-4 w-4" /> ญาณพยากรณ์พิเศษ (ใช้ต่อได้ทันที)
              </span>
              <p className="font-serif-th text-[11px] leading-relaxed text-[#5A432F]">
                จ่ายครั้งเดียวเริ่มต้น {CHEAPEST_PACKAGE_THB} บาท · ปลดล็อกผังใหญ่ 10–12 ใบ และคุยถามแม่หมอเจาะลึกได้ไม่จำกัด ไม่มีวันหมดอายุ
              </p>
            </div>
          </section>
        )}

        {/* ── ตารางเทียบสิทธิ์ ────────────────────────────────────── */}
        {reason === "explore" && (
          <section className="grid gap-3 sm:grid-cols-3">
            {ACCESS_PLANS.map((plan) => {
              const isCurrent =
                (plan.id === "guest" && isGuest) || (plan.id === "member" && view?.isMember);
              const isSpecial = plan.id === "credits";
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-4 shadow-xs ${
                    isSpecial
                      ? "border-2 border-[#CD9F5B] bg-[#FFFFFF] shadow-sm"
                      : plan.highlight
                      ? "border border-[#CD9F5B]/80 bg-[#FDF7F0]"
                      : "border border-[#D6B48D]/60 bg-[#FCF0E6]"
                  }`}
                >
                  {isSpecial ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-[#CD9F5B] px-2 py-0.5 font-serif-th text-[9px] font-bold text-[#FDF7F0] shadow-xs">
                      ✦ ปลดล็อกขั้นสุด
                    </span>
                  ) : plan.highlight ? (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-[#E4C09F] border border-[#D6B48D] px-2 py-0.5 font-serif-th text-[9px] font-bold text-[#5A432F]">
                      {plan.highlight}
                    </span>
                  ) : null}
                  <span className="font-serif-th text-sm font-bold text-[#5A432F]">{plan.name}</span>
                  <span className="mt-1 font-mono text-lg font-bold text-[#CD9F5B]">{plan.price}</span>
                  <span className="font-serif-th text-[10px] text-[#8C735D]">{plan.priceNote}</span>
                  {isCurrent && (
                    <span className="mt-2 inline-flex w-fit rounded-md border border-[#D6B48D] bg-[#FCF0E6] px-1.5 py-0.5 font-serif-th text-[9px] text-[#5A432F]">
                      แผนปัจจุบันของคุณ
                    </span>
                  )}
                  <ul className="mt-3 space-y-1.5 border-t border-[#D6B48D]/30 pt-3">
                    {plan.features.map((f) => (
                      <li
                        key={f.label}
                        className={`flex items-start gap-1.5 font-serif-th text-[11px] leading-snug ${
                          f.included ? "text-[#5A432F]" : "text-[#8C735D]/50"
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 ${f.included ? "text-[#CD9F5B]" : "text-[#8C735D]/40"}`}>
                          {f.included ? (
                            <CheckMarkIcon className="h-3 w-3" />
                          ) : (
                            <DashMarkIcon className="h-3 w-3" />
                          )}
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
              className="w-full rounded-2xl bg-[#CD9F5B] hover:bg-[#B8853E] px-6 py-3.5 font-serif-th text-sm font-bold text-[#FDF7F0] shadow-sm transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
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
              className="w-full rounded-2xl bg-[#CD9F5B] hover:bg-[#B8853E] px-6 py-3.5 font-serif-th text-sm font-bold text-[#FDF7F0] shadow-sm transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
            >
              <span className="mr-1.5">✦</span>
              ปลดล็อกญาณพยากรณ์พิเศษ (เริ่ม {CHEAPEST_PACKAGE_THB}.-)
            </button>
          )}

          <button
            type="button"
            onClick={handleSecondary}
            className="w-full rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] hover:bg-[#FFFFFF] hover:border-[#CD9F5B] px-6 py-3 font-serif-th text-xs text-[#5A432F] font-semibold transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
          >
            {copy.secondaryLabel}
          </button>

          <p className="pt-1 text-center font-serif-th text-[11px] leading-relaxed text-[#8C735D]">
            {copy.reassurance}
          </p>
        </div>
      </div>
    </Modal>
  );
}
