"use client";

import { useEffect, useState } from "react";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import { describeEntitlement, formatResetCountdown } from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * ป้ายสิทธิ์บนแถบหัว — บอกตลอดเวลาว่าเปิดไพ่ได้อีกกี่ครั้ง
 * ---------------------------------------------------------
 * ของเดิม (`QuotaBadge`) เป็น `hidden sm:inline-flex` คนใช้มือถือจึงไม่เห็นสิทธิ์ตัวเองเลย
 * จนกระทั่งโดนบล็อกกลางทาง — ตัวนี้แสดงทุกขนาดจอ (มือถือย่อเหลือจุดไฟ + ตัวเลข)
 * และกดเพื่อเปิดหน้าต่างรายละเอียดสิทธิ์ได้เสมอ
 */
export function QuotaMeter({ onOpenDetails }: { onOpenDetails: () => void }) {
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
  const [countdown, setCountdown] = useState("");

  // นับถอยหลังจุดรีเซ็ตแบบสด — อัปเดตนาทีละครั้งก็พอ (ไม่เปลืองเฟรม)
  useEffect(() => {
    if (!ent?.resetAt) {
      setCountdown("");
      return;
    }
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt]);

  // ถ้ายังไม่รู้สิทธิ์ หรือระบบสิทธิ์ปิดอยู่ (view === null) ให้คืน null ทันที
  // ป้องกันอาการ Ghost Slot: ช่องปุ่มโครงกระดูกโผล่มาแวบหนึ่งแล้วหายไป
  if (!view) return null;

  const unlimited = view.isUnlimited;
  const empty = view.tone === "empty";

  const title = unlimited
    ? "บัญชีนี้ใช้ได้ไม่จำกัด (กดเพื่อดูรายละเอียดสิทธิ์)"
    : `${view.statusLine}${countdown && !empty ? ` · รีเซ็ต${countdown}` : ""} — กดเพื่อดูรายละเอียดสิทธิ์`;

  const srLabel = unlimited
    ? "สิทธิ์ไม่จำกัด"
    : `สิทธิ์เปิดไพ่: ${view.statusLine}${countdown && empty ? ` รีเซ็ต${countdown}` : ""}`;

  return (
    <button
      type="button"
      onClick={onOpenDetails}
      title={title}
      aria-label={srLabel}
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-2 py-1 sm:px-2.5 font-serif-th text-[10px] font-semibold whitespace-nowrap transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B] ${
        unlimited
          ? "border-[#CD9F5B] bg-[#FDF7F0] text-[#CD9F5B] shadow-xs hover:scale-105"
          : empty
          ? "border-[#D6B48D] bg-[#FCF0E6] text-[#8C735D] hover:border-[#CD9F5B] hover:bg-[#FFFFFF]"
          : "border-[#D6B48D] bg-[#FDF7F0] text-[#5A432F] hover:border-[#CD9F5B] hover:bg-[#FFFFFF] shadow-xs"
      }`}
    >
      {unlimited ? (
        <>
          <span className="animate-pulse text-[#CD9F5B]">✦</span>
          <span className="hidden sm:inline">ไม่จำกัดสิทธิ์</span>
          <span translate="no" className="rounded bg-[#CD9F5B]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#5A432F]">
            VIP
          </span>
        </>
      ) : empty ? (
        <>
          <SealedLockIcon className="h-3.5 w-3.5 text-[#8C735D]" />
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
