"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { CheckMarkIcon, HourglassIcon, SparkSealIcon } from "@/components/entitlement/EntitlementIcons";
import {
  MEMBER_BENEFITS,
  describeEntitlement,
  formatResetCountdown,
  resetClockLabel,
} from "@/lib/entitlement/copy";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";
import { useSessionUser } from "@/lib/auth/use-session";

const BuyCreditsModal = dynamic(
  () => import("@/components/entitlement/BuyCreditsModal").then((m) => m.BuyCreditsModal),
  { ssr: false },
);

/**
 * การ์ด "สิทธิ์การใช้งานของฉัน" บนหน้าบัญชี
 * ------------------------------------------------------------------
 * ก่อนหน้านี้ผู้ใช้ดูสิทธิ์ตัวเองได้จากป้ายเล็ก ๆ บนแถบหัวเท่านั้น (และมองไม่เห็นบนมือถือ)
 * หน้าบัญชีคือที่ที่คนไปหาคำตอบว่า "ฉันเหลือกี่ครั้ง / รีเซ็ตเมื่อไหร่ / โบนัสอยู่ไหน"
 */
export function EntitlementStatusCard() {
  const ent = useEntitlement();
  const view = describeEntitlement(ent);
  const { user } = useSessionUser();
  const [buyOpen, setBuyOpen] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    if (!ent?.resetAt) return;
    const tick = () => setCountdown(formatResetCountdown(ent.resetAt));
    tick();
    const timer = setInterval(tick, 60_000);
    return () => clearInterval(timer);
  }, [ent?.resetAt]);

  if (!view) return null;

  const bonus = ent?.bonusRemaining ?? 0;

  return (
    <div className="space-y-4 rounded-[1.618rem] border border-[#D6B48D] bg-[#FFFFFF] p-5 shadow-xs sm:p-6">
      <div className="flex items-center gap-2">
        <span className="text-[#CD9F5B]">✦</span>
        <h2 className="font-serif-th text-base font-bold font-mystic-gold sm:text-lg">สิทธิ์การใช้งานของฉัน</h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D6B48D] bg-[#FCF0E6] px-4 py-3">
        <div className="space-y-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#8C735D]">
            {view.isAdmin
              ? "ผู้ดูแลระบบ"
              : view.isUnlimited
              ? "บัญชีไม่จำกัดสิทธิ์"
              : view.isGuest
              ? "ผู้เยี่ยมชม"
              : "สมาชิก"}
          </span>
          <span className="block font-serif-th text-sm font-semibold text-[#5A432F]">{view.statusLine}</span>
        </div>
        <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
      </div>

      {view.isMember && !view.isUnlimited && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl border border-[#D6B48D] bg-[#FDF7F0] px-3 py-2.5 font-serif-th text-[11px] text-[#5A432F]">
            <HourglassIcon className="h-4 w-4 shrink-0 text-[#CD9F5B]" />
            <span>
              โควตาฟรีชุดใหม่{countdown ? ` ${countdown}` : ""} · รีเซ็ต{resetClockLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#D6B48D] bg-[#FDF7F0] px-3 py-2.5 font-serif-th text-[11px] text-[#5A432F]">
            <SparkSealIcon className="h-4 w-4 shrink-0 text-[#CD9F5B]" />
            <span>
              รอบที่เติมไว้ <strong className="text-[#CD9F5B] font-bold">{bonus}</strong> ครั้ง · ไม่มีวันหมดอายุ
            </span>
          </div>
        </div>
      )}

      {view.isGuest && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {MEMBER_BENEFITS.map((b) => (
            <li key={b.title} className="flex items-start gap-2 font-serif-th text-[11px] text-[#5A432F]">
              <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#CD9F5B]" />
              {b.title}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#D6B48D]/30 pt-3">
        <Link href="/" className="text-xs text-[#CD9F5B] underline transition-colors hover:text-[#5A432F] font-bold">
          {view.isGuest ? "กลับไปเปิดไพ่และสมัครสมาชิก" : "กลับไปเปิดไพ่"}
        </Link>
        {view.isMember && !view.isUnlimited && (
          <button
            type="button"
            onClick={() => setBuyOpen(true)}
            className="min-h-[40px] rounded-xl border border-[#D6B48D] bg-[#CD9F5B] hover:bg-[#B8853E] px-4 py-2 font-serif-th text-xs font-semibold text-[#FDF7F0] transition-colors shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CD9F5B]"
          >
            <span className="mr-1.5 text-[#FDF7F0]">✦</span> เติมรอบเปิดไพ่
          </button>
        )}
      </div>

      <BuyCreditsModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} user={user} />
    </div>
  );
}
