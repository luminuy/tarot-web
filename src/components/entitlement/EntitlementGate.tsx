"use client";

import { useEffect, useState } from "react";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { HourglassIcon, SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import {
  DAILY_LIMIT,
  GUEST_LIMIT,
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
        className="mx-auto flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border border-[#D9C8AC] bg-[#FFFFFF] px-4 py-3 "
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#D9C8AC] bg-[#F3EDE2] text-[#8F5C1A]">
          {isGuest ? <SealedLockIcon className="h-4 w-4" /> : <HourglassIcon className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-serif-th text-xs font-bold text-[#2E211A] sm:text-sm">{copy.title}</p>
          <p className="font-serif-th text-[11px] leading-relaxed text-[#6F5B4A]">
            {isGuest
              ? `ทดลองฟรีได้ ${GUEST_LIMIT} ครั้ง (ใช้ครบแล้ว) · สมัครสมาชิกฟรีแล้วเปิดได้วันละ ${DAILY_LIMIT} ครั้ง`
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
            className="min-h-[36px] shrink-0 rounded-full bg-[#8F5C1A] hover:bg-[#74490F] px-4 py-1.5 font-serif-th text-[11px] font-bold text-[#FFFFFF] transition-all active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F5C1A]"
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
