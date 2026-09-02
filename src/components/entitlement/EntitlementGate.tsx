"use client";

import { useEffect, useState } from "react";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { HourglassIcon, SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import {
  DAILY_LIMIT,
  UPGRADE_COPY,
  describeEntitlement,
  formatResetCountdown,
  type UpgradeReason,
} from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * แถบแจ้งสิทธิ์บนขั้นเลือกผัง
 * ------------------------------------------------------------------
 * รุ่นแรก: สิทธิ์หมด → ลบหน้าเลือกผังทิ้งทั้งหน้า เหลือกล่องเล็ก ๆ กล่องเดียว
 * รุ่นสอง: การ์ดกั้นใบใหญ่คาไว้บนหัว — ยังเลือกผังได้ก็จริง แต่กินครึ่งจอมือถือ
 *          และพูดเรื่องเดียวกับหน้าต่างสิทธิ์ (AccessDialog) ซ้ำอีกรอบตอนกดเริ่ม
 *
 * รุ่นนี้ (Value-first + Just-in-time):
 *  1. เหลือ **แถบบาง 1 บรรทัด** บอกสถานะ ไม่ขวางทาง ไม่ใช่กำแพง
 *  2. เลือกดูผังทั้ง 20 แบบได้ตามปกติ (การดูไม่ใช่การใช้สิทธิ์)
 *  3. ปุ่ม "เริ่มเปิดไพ่" เปลี่ยนถ้อยคำล่วงหน้าเมื่อสิทธิ์หมด (กันเซอร์ไพรส์ตอนกด)
 *  4. ปิดการขายที่ AccessDialog ตอนกดจริง — จังหวะที่ผู้ใช้ตั้งใจสูงสุด
 *
 * การบังคับสิทธิ์จริงอยู่ฝั่ง server เสมอ (การซ่อนปุ่มไม่ใช่การบังคับสิทธิ์)
 */
export function EntitlementGate({
  active,
  onRequestUpgrade,
  children,
}: {
  active: boolean;
  onRequestUpgrade: (reason: UpgradeReason) => void;
  children: React.ReactNode;
}) {
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
  const [countdown, setCountdown] = useState("");

  const blocked = active && !!view && view.blocked;
  const reason: UpgradeReason = view?.blockedReason ?? "guest_used";

  useEffect(() => {
    if (blocked) trackEntitlementEvent(`gate_blocked_shown:${reason}`);
  }, [blocked, reason]);

  useEffect(() => {
    if (!ent?.resetAt) return;
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt]);

  if (!blocked || !view) return <>{children}</>;

  const copy = UPGRADE_COPY[reason];
  const isGuest = view.isGuest;

  const ctaLabel = isGuest ? "สมัครฟรี" : "เติมรอบเปิดไพ่";

  return (
    <div className="space-y-6">
      {/* แถบแจ้งสิทธิ์แบบบาง — บอกสถานะ ไม่ขวางทาง ไม่ซ้ำกับหน้าต่างสิทธิ์ตอนกดเริ่ม */}
      <div
        aria-live="polite"
        className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[#e5c07b]/30 bg-gradient-to-r from-[#160d2a]/90 to-[#0a0714]/90 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.55)] backdrop-blur"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5c07b]/35 bg-[#1a1030] text-[#ffd700]">
          {isGuest ? <SealedLockIcon className="h-4 w-4" /> : <HourglassIcon className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-serif-th text-xs font-semibold text-[#f5deaa] sm:text-sm">{copy.title}</p>
          <p className="font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
            {isGuest
              ? `สมัครฟรีเปิดต่อวันละ ${DAILY_LIMIT} ครั้ง · เลือกดูผังไว้ก่อนได้`
              : countdown
              ? `โควตาฟรีชุดใหม่ ${countdown} · เลือกดูผังไว้ก่อนได้`
              : view.statusLine}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <QuotaPips remaining={view.remaining} limit={view.limit} tone="empty" />
          <button
            type="button"
            onClick={() => onRequestUpgrade(reason)}
            className="min-h-[36px] shrink-0 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-4 py-1.5 font-serif-th text-[11px] font-bold text-[#05040a] shadow-[0_0_18px_rgba(212,175,55,0.35)] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a]"
          >
            <span className="mr-1">✦</span>
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* ยังเลือกดูผังได้ตามปกติ — การดูไม่กินสิทธิ์ */}
      {children}
    </div>
  );
}
