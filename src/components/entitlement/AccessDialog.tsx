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
      <div className="space-y-6 text-[#e2d9f3]">
        {/* ป้ายบอกว่าหน้าต่างนี้เปิดขึ้นเพราะอะไร */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5c07b]/35 bg-[#140b24] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#e5c07b]">
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
          <div className="rounded-2xl border border-[#e5c07b]/25 bg-[#0a0714]/80 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c93b8]">
                  สถานะตอนนี้
                </span>
                <span className="block font-serif-th text-sm font-semibold text-[#f5deaa]">
                  {view.statusLine}
                </span>
              </div>
              <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
            </div>

            {!isGuest && (
              <div className="mt-3 flex items-center gap-2 border-t border-[#e5c07b]/12 pt-3 font-serif-th text-xs text-[#9c93b8]">
                <HourglassIcon className="h-3.5 w-3.5 shrink-0 text-[#e5c07b]" />
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
            <h3 className="font-serif-th text-sm font-bold text-[#f5deaa]">
              <span className="text-[#e5c07b]">✦</span> สมัครสมาชิกฟรีแล้วได้อะไรบ้าง
            </h3>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {MEMBER_BENEFITS.map((b) => (
                <li
                  key={b.title}
                  className="flex gap-2.5 rounded-xl border border-[#e5c07b]/15 bg-[#100b20]/70 p-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e5c07b]/15 text-[#ffd700]">
                    <CheckMarkIcon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-serif-th text-xs font-semibold text-[#f5deaa]">{b.title}</span>
                    <span className="block font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
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
            <div className="rounded-2xl border border-[#e5c07b]/20 bg-[#100b20]/70 p-4">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-[#f5deaa]">
                <HourglassIcon className="h-4 w-4 text-[#e5c07b]" /> รอโควตาฟรีรอบใหม่
              </span>
              <p className="font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
                ไม่ต้องจ่ายอะไร กลับมาหลังเที่ยงคืนแล้วเปิดไพ่ได้อีก {DAILY_LIMIT} ครั้ง
                {countdown ? ` (${countdown})` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-[#ffd700]/45 bg-gradient-to-b from-[#1a1030] to-[#0c0718] p-4 shadow-[0_0_25px_rgba(229,192,123,0.12)]">
              <span className="mb-2 flex items-center gap-2 font-serif-th text-xs font-bold text-[#ffd700]">
                <CoinSealIcon className="h-4 w-4" /> เติมรอบไว้ใช้ต่อ
              </span>
              <p className="font-serif-th text-[11px] leading-relaxed text-[#cfc8e2]">
                จ่ายครั้งเดียวเริ่มต้น {CHEAPEST_PACKAGE_THB} บาท · รอบที่เติมไม่มีวันหมดอายุ และไม่ตัดเงินอัตโนมัติ
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
              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl border p-4 ${
                    plan.highlight
                      ? "border-[#ffd700]/55 bg-gradient-to-b from-[#1a1030] to-[#0c0718] shadow-[0_0_25px_rgba(229,192,123,0.14)]"
                      : "border-[#e5c07b]/18 bg-[#0a0714]/70"
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] px-2 py-0.5 font-serif-th text-[9px] font-bold text-[#0a0715]">
                      {plan.highlight}
                    </span>
                  )}
                  <span className="font-serif-th text-sm font-bold text-[#f5deaa]">{plan.name}</span>
                  <span className="mt-1 font-mono text-lg font-bold text-[#ffd700]">{plan.price}</span>
                  <span className="font-serif-th text-[10px] text-[#9c93b8]">{plan.priceNote}</span>
                  {isCurrent && (
                    <span className="mt-2 inline-flex w-fit rounded-md border border-[#e5c07b]/40 px-1.5 py-0.5 font-serif-th text-[9px] text-[#e5c07b]">
                      แผนปัจจุบันของคุณ
                    </span>
                  )}
                  <ul className="mt-3 space-y-1.5 border-t border-[#e5c07b]/12 pt-3">
                    {plan.features.map((f) => (
                      <li
                        key={f.label}
                        className={`flex items-start gap-1.5 font-serif-th text-[11px] leading-snug ${
                          f.included ? "text-[#cfc8e2]" : "text-[#9c93b8]/60"
                        }`}
                      >
                        <span className={`mt-0.5 shrink-0 ${f.included ? "text-[#ffd700]" : "text-[#9c93b8]/50"}`}>
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
          {/* สมาชิกที่กดดูเองไม่ต้องเห็นปุ่มชวนสมัครอีก */}
          {!(reason === "explore" && view?.isMember) && (
            <button
              type="button"
              onClick={handlePrimary}
              className="w-full rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-3.5 font-serif-th text-sm font-bold text-[#05040a] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0714]"
            >
              <span className="mr-1.5">✦</span>
              {copy.primaryLabel}
            </button>
          )}

          <button
            type="button"
            onClick={handleSecondary}
            className="w-full rounded-2xl border border-[#e5c07b]/25 bg-[#100b20] px-6 py-3 font-serif-th text-xs text-[#cfc8e2] transition-colors hover:bg-[#191230] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
          >
            {copy.secondaryLabel}
          </button>

          <p className="pt-1 text-center font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
            {copy.reassurance}
          </p>
        </div>
      </div>
    </Modal>
  );
}
