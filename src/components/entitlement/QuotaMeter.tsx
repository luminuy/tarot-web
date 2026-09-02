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
      className={`inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border px-2 py-1 sm:px-2.5 font-serif-th text-[10px] font-semibold whitespace-nowrap transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a] ${
        unlimited
          ? "border-[#ffd700] bg-gradient-to-r from-[#1c1233] to-[#2d184d] text-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.3)] hover:scale-105"
          : empty
          ? "border-[#f0a868]/50 bg-[#1c1024] text-[#f0c79a] hover:border-[#f0a868] hover:bg-[#241430]"
          : "border-[#e5c07b]/40 bg-[#140b24] text-[#f5deaa] hover:border-[#ffd700] hover:bg-[#1f1038]"
      }`}
    >
      {unlimited ? (
        <>
          <span className="animate-pulse text-[#ffd700]">✦</span>
          <span className="hidden sm:inline">ไม่จำกัดสิทธิ์</span>
          <span translate="no" className="rounded bg-[#ffd700]/20 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#ffd700]">
            VIP
          </span>
        </>
      ) : empty ? (
        <>
          <SealedLockIcon className="h-3.5 w-3.5 text-[#f0a868]" />
          <span className="hidden sm:inline">{view.badgeLabel}</span>
          <span className="sm:hidden font-mono">0/{view.limit}</span>
        </>
      ) : (
        <>
          <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} size="sm" />
          <span className="hidden sm:inline">{view.badgeLabel}</span>
          <span className="sm:hidden font-mono">
            {view.remaining}/{view.limit}
          </span>
        </>
      )}
    </button>
  );
}
