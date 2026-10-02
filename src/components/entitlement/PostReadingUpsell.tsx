"use client";

import { useEffect } from "react";

import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { CHEAPEST_PACKAGE_THB } from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useLocale } from "@/lib/i18n";

/**
 * ✦ การ์ดชวนดูผังใหญ่ท้ายคำทำนายฟรี
 * ---------------------------------------------------------------------------
 * จังหวะที่อ่านคำทำนายจบคือตอนที่ผู้ใช้อินกับเรื่องของตัวเองที่สุด — บอกตรงนั้นเลยว่า
 * "เรื่องเดียวกันนี้ ผังเซลติกครอสจะเห็นอะไรเพิ่ม" โดยโชว์ชื่อตำแหน่งที่ยังไม่ได้เปิดจริงจากผัง
 *
 * - ยังมีสิทธิ์ลองฟรี ➔ ปุ่มพาไปเปิดผังเซลติกครอสฟรี (ไม่หักสิทธิ์รายวัน)
 * - ใช้สิทธิ์ลองแล้ว ➔ ปุ่มเติมรอบ
 *
 * กติกา: ไม่ป๊อปอัปทับหน้าจอ · โชว์เฉพาะสมาชิกที่ยังไม่มีรอบที่ซื้อ และเพิ่งอ่านผังมาตรฐาน
 * ⚠️ ชื่อตำแหน่งส่งเข้ามาจากผังจริง (`positions`) — ห้ามพิมพ์เองในไฟล์นี้ ผังเปลี่ยนแล้วจะโกหก
 */
export function PostReadingUpsell({
  positions,
  premiumTrial,
  onBuyCredits,
}: {
  /** ชื่อตำแหน่งในผังเซลติกครอสที่ผังมาตรฐานไม่มี (ภาษาตามหน้า · ตัดเลขนำหน้าแล้ว) */
  positions: string[];
  premiumTrial: boolean;
  onBuyCredits: () => void;
}) {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";

  useEffect(() => {
    trackEntitlementEvent(premiumTrial ? "upsell_card_shown:trial" : "upsell_card_shown:credits");
  }, [premiumTrial]);

  return (
    <section
      aria-labelledby="post-reading-upsell"
      className="altar-panel-active space-y-4 p-5 sm:p-6"
    >
      <div className="space-y-1.5">
        {premiumTrial && (
          <span className="inline-block rounded-full bg-ok px-2.5 py-0.5 font-serif-th text-xs font-bold text-surface">
            {isEn ? "Free to try once" : "ลองฟรี 1 ครั้ง"}
          </span>
        )}
        <h3 id="post-reading-upsell" className="font-serif-th text-lg font-bold text-ink-deep">
          <ThaiPhrases>{isEn ? "Want the full picture of this?" : "อยากเห็นภาพเต็มของเรื่องนี้?"}</ThaiPhrases>
        </h3>
        <p className="font-serif-th text-sm leading-relaxed text-muted">
          {isEn
            ? "The 10-card Celtic Cross reads the same question far deeper — including what you haven't seen yet:"
            : "ผังเซลติกครอส 10 ใบ อ่านเรื่องเดียวกันได้ลึกกว่ามาก รวมถึงมุมที่คุณยังไม่ได้เห็น:"}
        </p>
      </div>

      <ul className="grid gap-2 sm:grid-cols-2">
        {positions.map((name) => (
          <li
            key={name}
            className="flex items-center gap-2 rounded-xl border border-line-warm bg-surface-warm px-3 py-2.5 font-serif-th text-sm text-ink-deep"
          >
            <SealedLockIcon className="h-4 w-4 shrink-0 text-gold-ink" />
            {name}
          </li>
        ))}
      </ul>

      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-serif-th text-xs text-muted">
          {premiumTrial
            ? isEn
              ? "Your free trial doesn't use today's free reading."
              : "สิทธิ์ลองฟรีไม่หักสิทธิ์เปิดไพ่ฟรีของวันนี้"
            : isEn
              ? `Top-ups from ${CHEAPEST_PACKAGE_THB} THB · pay once, never expires`
              : `เติมรอบเริ่ม ${CHEAPEST_PACKAGE_THB} บาท · จ่ายครั้งเดียว ไม่มีวันหมดอายุ`}
        </p>
        {premiumTrial ? (
          <Link
            href="/read/celtic-cross"
            prefetch={false}
            onClick={() => trackEntitlementEvent("upsell_card_click:trial")}
            className="btn-gold-glass inline-flex min-h-[48px] items-center justify-center px-6 font-serif-th text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
          >
            {isEn ? "Try the Celtic Cross free" : "ลองเปิดผังเซลติกครอสฟรี"}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              trackEntitlementEvent("upsell_card_click:credits");
              onBuyCredits();
            }}
            className="btn-gold-glass min-h-[48px] px-6 font-serif-th text-sm font-bold cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
          >
            {isEn ? "Top up to open big spreads" : "เติมรอบเพื่อเปิดผังใหญ่"}
          </button>
        )}
      </div>
    </section>
  );
}
