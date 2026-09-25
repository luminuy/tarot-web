"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { CheckMarkIcon, HourglassIcon, SparkSealIcon } from "@/components/entitlement/EntitlementIcons";
import { getMemberBenefits, describeEntitlement, formatResetCountdown, resetClockLabel } from "@/lib/entitlement/copy";
import { DailyStreakRibbon } from "@/components/daily/DailyStreakRibbon";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useSessionUser } from "@/lib/auth/use-session";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false }
);

export interface EntitlementStatusCardProps {
  /**
   * ให้หน้าที่ครอบเป็นคนเปิดหน้าต่าง "เติมรอบเปิดไพ่" เอง
   *
   * ⚠️ ส่งมาเมื่อไร การ์ดนี้จะ **ไม่** mount `BuyCreditsModal` ของตัวเอง
   * หน้าบัญชีมีหน้าต่างเติมรอบของมันอยู่แล้ว ถ้าปล่อยให้ทั้งสองที่ mount พร้อมกัน
   * จะได้หน้าต่างสองบานทับกันที่ปิดไม่พร้อมกัน (สถานะคนละก้อน)
   */
  onBuyCredits?: () => void;
}

/**
 * การ์ด "สิทธิ์การใช้งานของฉัน" บนหน้าบัญชี
 * ------------------------------------------------------------------
 * ก่อนหน้านี้ผู้ใช้ดูสิทธิ์ตัวเองได้จากป้ายเล็ก ๆ บนแถบหัวเท่านั้น (และมองไม่เห็นบนมือถือ)
 * หน้าบัญชีคือที่ที่คนไปหาคำตอบว่า "ฉันเหลือกี่ครั้ง / รีเซ็ตเมื่อไหร่ / โบนัสอยู่ไหน"
 */
export function EntitlementStatusCard({ onBuyCredits }: EntitlementStatusCardProps = {}) {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
  const { user } = useSessionUser();
  const [buyOpen, setBuyOpen] = useState(false);
  const openBuy = onBuyCredits ?? (() => setBuyOpen(true));
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
    <div className="space-y-4 rounded-lg border border-line-warm bg-surface p-5 sm:p-6">
      <div className="flex items-center gap-2">
        
        <h2 className="font-serif-th text-base font-bold font-mystic-gold sm:text-lg"><ThaiPhrases>
          {isEn ? "My Reading Entitlement" : "สิทธิ์การใช้งานของฉัน"}
        </ThaiPhrases></h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line-warm bg-inset-warm px-4 py-3">
        <div className="space-y-1">
          <span className="block font-mono text-[13px] uppercase tracking-[0.16em] text-muted">
            {view.isAdmin
              ? (isEn ? "Administrator" : "ผู้ดูแลระบบ")
              : view.isUnlimited
                ? (isEn ? "Unlimited Account" : "บัญชีไม่จำกัดสิทธิ์")
                : view.isGuest
                  ? (isEn ? "Guest Visitor" : "ผู้เยี่ยมชม")
                  : (isEn ? "Member" : "สมาชิก")}
          </span>
          <span className="block font-serif-th text-sm font-semibold text-ink-deep">{view.statusLine}</span>
        </div>
        <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
      </div>

      {/* วันต่อเนื่องของไพ่ประจำวัน — ซ่อนเองเมื่อยังไม่มี streak (ดู DailyStreakRibbon) */}
      <DailyStreakRibbon streak={ent?.dailyStreak ?? 0} isEnglish={isEn} />

      {view.isMember && !view.isUnlimited && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-line-warm bg-surface px-3 py-2.5 font-serif-th text-[13px] text-ink-deep">
            <HourglassIcon className="h-4 w-4 shrink-0 text-gold-ink" />
            <span>
              {isEn
                ? `New free quota${countdown ? ` in ${countdown}` : ""} · Resets ${resetClockLabel(true)}`
                : `โควตาฟรีชุดใหม่${countdown ? ` ${countdown}` : ""} · รีเซ็ต${resetClockLabel(false)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-line-warm bg-surface px-3 py-2.5 font-serif-th text-[13px] text-ink-deep">
            <SparkSealIcon className="h-4 w-4 shrink-0 text-gold-ink" />
            <span>
              {isEn ? (
                <>Purchased Tokens: <strong className="text-gold-ink font-bold">{bonus}</strong> · Never expires</>
              ) : (
                <>รอบที่เติมไว้ <strong className="text-gold-ink font-bold">{bonus}</strong> ครั้ง · ไม่มีวันหมดอายุ</>
              )}
            </span>
          </div>
        </div>
      )}

      {view.isGuest && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {memberBenefits.map((b) => (
            <li key={b.title} className="flex items-start gap-2 font-serif-th text-[13px] text-ink-deep">
              <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-gold-ink" />
              {b.title}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line-warm/30 pt-3">
        {view.isGuest ? (
          <Link href="/" className="text-xs text-gold-ink underline transition-colors hover:text-ink-deep font-bold">
            {isEn ? "Return to Tarot & Create Account" : "กลับไปเปิดไพ่และสมัครสมาชิก"}
          </Link>
        ) : (
          /* ทางเข้ารหัสแลกสิทธิ์ — เคยมีในแผงลอยเดิม แล้วหายไปตอนย้ายมาเป็นหน้าเต็ม
             ช่องกรอกรหัสอยู่ในหน้าต่างเดียวกับการเติมรอบ จึงเปิดบานเดียวกัน */
          <button
            type="button"
            onClick={openBuy}
            className="tap-overlay-y text-xs text-gold-ink underline transition-colors hover:text-ink-deep font-bold cursor-pointer"
          >
            {isEn ? "Have a redeem code? Enter it here" : "มีรหัสแลกสิทธิ์? กดใส่รหัสที่นี่"}
          </button>
        )}
        {view.isMember && !view.isUnlimited && (
          <button
            type="button"
            onClick={openBuy}
            className="tap-overlay-y min-h-[40px] rounded-full border border-line-warm bg-gold-ink hover:bg-gold-ink-deep px-4 py-2 font-serif-th text-xs font-semibold text-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          >
            {isEn ? "Get Reading Passes" : "เติมรอบเปิดไพ่"}
          </button>
        )}
      </div>

      {/* หน้าที่ครอบไม่ได้ส่ง onBuyCredits มา → การ์ดนี้ต้องยืนได้ด้วยตัวเอง */}
      {!onBuyCredits && <BuyCreditsModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} user={user} />}
    </div>
  );
}
