"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { CheckMarkIcon, HourglassIcon, SparkSealIcon } from "@/components/entitlement/EntitlementIcons";
import { getMemberBenefits, describeEntitlement, formatResetCountdown, resetClockLabel } from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useSessionUser } from "@/lib/auth/use-session";
import { useLocale } from "@/lib/i18n";

const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false }
);

/**
 * การ์ด "สิทธิ์การใช้งานของฉัน" บนหน้าบัญชี
 * ------------------------------------------------------------------
 * ก่อนหน้านี้ผู้ใช้ดูสิทธิ์ตัวเองได้จากป้ายเล็ก ๆ บนแถบหัวเท่านั้น (และมองไม่เห็นบนมือถือ)
 * หน้าบัญชีคือที่ที่คนไปหาคำตอบว่า "ฉันเหลือกี่ครั้ง / รีเซ็ตเมื่อไหร่ / โบนัสอยู่ไหน"
 */
export function EntitlementStatusCard() {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
  const { user } = useSessionUser();
  const [buyOpen, setBuyOpen] = useState(false);
  const [countdown, setCountdown] = useState("");
  const memberBenefits = getMemberBenefits(isEn);

  useEffect(() => {
    if (!ent?.resetAt) return;
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt, Date.now(), isEn));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt, isEn]);

  if (!view) return null;

  const bonus = ent?.bonusRemaining ?? 0;

  return (
    <div className="space-y-4 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] p-5 sm:p-6">
      <div className="flex items-center gap-2">
        
        <h2 className="font-serif-th text-base font-bold font-mystic-gold sm:text-lg">
          {isEn ? "My Reading Entitlement" : "สิทธิ์การใช้งานของฉัน"}
        </h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] px-4 py-3">
        <div className="space-y-1">
          <span className="block font-mono text-[13px] uppercase tracking-[0.16em] text-[#635B4E]">
            {view.isAdmin
              ? (isEn ? "Administrator" : "ผู้ดูแลระบบ")
              : view.isUnlimited
                ? (isEn ? "Unlimited Account" : "บัญชีไม่จำกัดสิทธิ์")
                : view.isGuest
                  ? (isEn ? "Guest Visitor" : "ผู้เยี่ยมชม")
                  : (isEn ? "Member" : "สมาชิก")}
          </span>
          <span className="block font-serif-th text-sm font-semibold text-[#2E211A]">{view.statusLine}</span>
        </div>
        <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
      </div>

      {view.isMember && !view.isUnlimited && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] px-3 py-2.5 font-serif-th text-[13px] text-[#2E211A]">
            <HourglassIcon className="h-4 w-4 shrink-0 text-[#8F5C1A]" />
            <span>
              {isEn
                ? `New free quota${countdown ? ` in ${countdown}` : ""} · Resets ${resetClockLabel(true)}`
                : `โควตาฟรีชุดใหม่${countdown ? ` ${countdown}` : ""} · รีเซ็ต${resetClockLabel(false)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] px-3 py-2.5 font-serif-th text-[13px] text-[#2E211A]">
            <SparkSealIcon className="h-4 w-4 shrink-0 text-[#8F5C1A]" />
            <span>
              {isEn ? (
                <>Purchased Tokens: <strong className="text-[#8F5C1A] font-bold">{bonus}</strong> · Never expires</>
              ) : (
                <>รอบที่เติมไว้ <strong className="text-[#8F5C1A] font-bold">{bonus}</strong> ครั้ง · ไม่มีวันหมดอายุ</>
              )}
            </span>
          </div>
        </div>
      )}

      {view.isGuest && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {memberBenefits.map((b) => (
            <li key={b.title} className="flex items-start gap-2 font-serif-th text-[13px] text-[#2E211A]">
              <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#8F5C1A]" />
              {b.title}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D9C8AC]/30 pt-3">
        <Link href="/" className="text-xs text-[#8F5C1A] underline transition-colors hover:text-[#2E211A] font-bold">
          {view.isGuest
            ? (isEn ? "Return to Tarot & Create Account" : "กลับไปเปิดไพ่และสมัครสมาชิก")
            : (isEn ? "Return to Tarot Reading" : "กลับไปเปิดไพ่")}
        </Link>
        {view.isMember && !view.isUnlimited && (
          <button
            type="button"
            onClick={() => setBuyOpen(true)}
            className="min-h-[40px] rounded-full border border-[#D9C8AC] bg-[#8F5C1A] hover:bg-[#74490F] px-4 py-2 font-serif-th text-xs font-semibold text-[#FFFFFF] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
          >
            
            {isEn ? "Get Reading Passes" : "เติมรอบเปิดไพ่"}
          </button>
        )}
      </div>

      <BuyCreditsModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} user={user} />
    </div>
  );
}
