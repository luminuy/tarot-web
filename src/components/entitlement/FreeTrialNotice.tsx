"use client";

import { useEffect, useState } from "react";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { HourglassIcon, SparkSealIcon } from "@/components/entitlement/EntitlementIcons";
import { DAILY_LIMIT, describeEntitlement, formatResetCountdown } from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * แถบบอกสิทธิ์ล่วงหน้าบนขั้นเลือกผัง
 * ------------------------------------------------------------------
 * หลักการ: **ห้ามให้ผู้ใช้เซอร์ไพรส์ตอนโดนบล็อก** — ต้องรู้ตั้งแต่ก่อนลงมือว่าเปิดได้กี่ครั้ง
 * และเมื่อหมดแล้วจะเกิดอะไรขึ้น (ของเดิมรู้ตอนกดปุ่มแล้วเจอแถบแดง)
 *
 * ไม่แสดงเมื่อ: ธงสิทธิ์ปิด · ผู้ดูแลระบบ · สิทธิ์หมดแล้ว (ปล่อยให้การ์ดกั้นสิทธิ์พูดแทน)
 */
export function FreeTrialNotice({ onOpenAccess }: { onOpenAccess: () => void }) {
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
  const [countdown, setCountdown] = useState("");

  const visible = !!view && !view.isUnlimited && !view.blocked;

  useEffect(() => {
    if (visible) trackEntitlementEvent("free_trial_notice_shown");
  }, [visible]);

  useEffect(() => {
    if (!ent?.resetAt) return;
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt]);

  // กันที่ไว้ระหว่างรอสิทธิ์จาก server — ไม่งั้นแถบนี้แทรกเข้ามาแล้วดันทั้งหน้าลง
  if (ent === null) {
    return (
      <div
        aria-hidden="true"
        className="mx-auto mb-6 h-[68px] max-w-2xl animate-pulse rounded-2xl border border-[#e5c07b]/12 bg-[#100b20]/40"
      />
    );
  }

  if (!visible || !view) return null;

  const isGuest = view.isGuest;

  return (
    <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-r from-[#120c22]/90 to-[#0a0714]/90 px-4 py-3 shadow-[0_10px_35px_rgba(0,0,0,0.55)]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e5c07b]/30 bg-[#1a1030] text-[#ffd700]">
        {isGuest ? <SparkSealIcon className="h-4 w-4" /> : <HourglassIcon className="h-4 w-4" />}
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="font-serif-th text-xs font-semibold text-[#f5deaa] sm:text-sm">
          {isGuest ? "เปิดไพ่ทดลองฟรีได้เลย ไม่ต้องสมัครสมาชิก" : view.statusLine}
        </p>
        <p className="font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">
          {isGuest
            ? `อ่านคำทำนายเต็มทุกองก์ · หลังใช้ครบ สมัครสมาชิกฟรีเพื่อเปิดไพ่ต่อวันละ ${DAILY_LIMIT} ครั้ง`
            : countdown
            ? `โควตาฟรีชุดใหม่ ${countdown} · รอบที่เติมไว้ใช้ได้ตลอด ไม่มีวันหมดอายุ`
            : "โควตาฟรีรีเซ็ตทุกเที่ยงคืน · รอบที่เติมไว้ใช้ได้ตลอด"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
        <button
          type="button"
          onClick={() => {
            trackEntitlementEvent("quota_meter_opened");
            onOpenAccess();
          }}
          className="min-h-[36px] rounded-xl border border-[#e5c07b]/30 px-3 py-1.5 font-serif-th text-[11px] text-[#e5c07b] transition-colors hover:border-[#ffd700] hover:text-[#ffd700] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
        >
          ดูสิทธิ์ทั้งหมด
        </button>
      </div>
    </div>
  );
}
