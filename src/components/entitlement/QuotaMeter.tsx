"use client";

import { useEffect, useState } from "react";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { describeEntitlement, formatResetCountdown } from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useLocale } from "@/lib/i18n";

/**
 * ป้ายสิทธิ์บนแถบหัว — บอกตลอดเวลาว่าเปิดไพ่ได้อีกกี่ครั้ง
 * ---------------------------------------------------------
 * ของเดิม (`QuotaBadge`) เป็น `hidden sm:inline-flex` คนใช้มือถือจึงไม่เห็นสิทธิ์ตัวเองเลย
 * จนกระทั่งโดนบล็อกกลางทาง — ตัวนี้แสดงทุกขนาดจอ (มือถือย่อเหลือจุดไฟ + ตัวเลข)
 * และกดเพื่อเปิดหน้าต่างรายละเอียดสิทธิ์ได้เสมอ
 */
export function QuotaMeter({ onOpenDetails }: { onOpenDetails: () => void }) {
  const { locale, isEnglish } = useLocale();
  const isEn = isEnglish || locale === "en";
  const ent = useEntitlement();
  const view = describeEntitlement(ent, isEn);
  const [countdown, setCountdown] = useState("");

  // นับถอยหลังจุดรีเซ็ตแบบสด — อัปเดตนาทีละครั้งก็พอ (ไม่เปลืองเฟรม)
  useEffect(() => {
    if (!ent?.resetAt) {
      setCountdown("");
      return;
    }
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt, Date.now(), isEn));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt, isEn]);

  // ถ้ายังไม่รู้สิทธิ์ หรือระบบสิทธิ์ปิดอยู่ (view === null) ให้คืน null ทันที
  // ป้องกันอาการ Ghost Slot: ช่องปุ่มโครงกระดูกโผล่มาแวบหนึ่งแล้วหายไป
  if (!view) return null;

  const unlimited = view.isUnlimited;
  const empty = view.tone === "empty";

  const title = unlimited
    ? (isEn ? "Unlimited account access (Click for details)" : "บัญชีนี้ใช้ได้ไม่จำกัด (กดเพื่อดูรายละเอียดสิทธิ์)")
    : (isEn
      ? `${view.statusLine}${countdown && !empty ? ` · Resets in ${countdown}` : ""} — Click for details`
      : `${view.statusLine}${countdown && !empty ? ` · รีเซ็ต${countdown}` : ""} — กดเพื่อดูรายละเอียดสิทธิ์`);

  const srLabel = unlimited
    ? (isEn ? "Unlimited readings" : "สิทธิ์ไม่จำกัด")
    : (isEn
      ? `Reading quota: ${view.statusLine}${countdown && empty ? ` Resets in ${countdown}` : ""}`
      : `สิทธิ์เปิดไพ่: ${view.statusLine}${countdown && empty ? ` รีเซ็ต${countdown}` : ""}`);

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      title={title}
      aria-label={srLabel}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 py-1 sm:px-3 font-serif-th text-[13px] font-semibold whitespace-nowrap transition-colors select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A] ${
        unlimited
          ? "bg-[#F3EDE2] text-[#8F5C1A] hover:bg-[#EFE6D6]"
          : empty
            ? "bg-[#F3EDE2] text-[#635B4E] hover:bg-[#EFE6D6]"
            : "bg-[#F3EDE2] text-[#8F5C1A] hover:bg-[#EFE6D6]"
      }`}
    >
      {unlimited ? (
        <>
          <span className="text-[#8F5C1A]">✦</span>
          <span className="hidden sm:inline">{isEn ? "Unlimited" : "ไม่จำกัดสิทธิ์"}</span>
          <span
            translate="no"
            className="rounded-full bg-[#8F5C1A]/15 px-1.5 py-0.5 font-mono text-[12px] font-bold text-[#8F5C1A]"
          >
            VIP
          </span>
        </>
      ) : empty ? (
        <>
          <SealedLockIcon className="h-3.5 w-3.5 text-[#635B4E]" />
          <span className="hidden sm:inline">{view.badgeLabel}</span>
          <span className="sm:hidden font-mono">0/{view.limit}</span>
        </>
      ) : (
        <>
          <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} size="sm" />
          <span className="hidden sm:inline">{view.badgeLabel}</span>
          <span className="sm:hidden font-mono">
            {/* มีรอบที่เติมไว้ ยอดรวมจะเกินเพดานรายวัน — โชว์เศษส่วนแล้วอ่านเป็น "6/3" งง */}
            {view.remaining > view.limit ? view.remaining : `${view.remaining}/${view.limit}`}
          </span>
        </>
      )}
    </button>
  );
}
