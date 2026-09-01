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
  const [user, setUser] = useState<{ id: string; name?: string; email?: string } | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setUser(d?.user ?? null))
      .catch(() => {});
  }, []);

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
    <div className="space-y-4 rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 p-5 shadow-xl sm:p-6">
      <div className="flex items-center gap-2">
        <span className="text-[#ffd700]">✦</span>
        <h2 className="font-serif-th text-base font-bold font-mystic-gold sm:text-lg">สิทธิ์การใช้งานของฉัน</h2>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#e5c07b]/15 bg-[#0a0714]/70 px-4 py-3">
        <div className="space-y-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.16em] text-[#9c93b8]">
            {view.isAdmin
              ? "ผู้ดูแลระบบ"
              : view.isUnlimited
              ? "บัญชีไม่จำกัดสิทธิ์"
              : view.isGuest
              ? "ผู้เยี่ยมชม"
              : "สมาชิก"}
          </span>
          <span className="block font-serif-th text-sm font-semibold text-[#f5deaa]">{view.statusLine}</span>
        </div>
        <QuotaPips remaining={view.remaining} limit={view.limit} tone={view.tone} />
      </div>

      {view.isMember && !view.isUnlimited && (
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl border border-[#e5c07b]/12 bg-[#100b20]/60 px-3 py-2.5 font-serif-th text-[11px] text-[#cfc8e2]">
            <HourglassIcon className="h-4 w-4 shrink-0 text-[#e5c07b]" />
            <span>
              โควตาฟรีชุดใหม่{countdown ? ` ${countdown}` : ""} · รีเซ็ต{resetClockLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-[#e5c07b]/12 bg-[#100b20]/60 px-3 py-2.5 font-serif-th text-[11px] text-[#cfc8e2]">
            <SparkSealIcon className="h-4 w-4 shrink-0 text-[#e5c07b]" />
            <span>
              โบนัสสะสม <strong className="text-[#ffd700]">{bonus}</strong> ครั้ง · ไม่มีวันหมดอายุ
            </span>
          </div>
        </div>
      )}

      {view.isGuest && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {MEMBER_BENEFITS.map((b) => (
            <li key={b.title} className="flex items-start gap-2 font-serif-th text-[11px] text-[#cfc8e2]">
              <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#ffd700]" />
              {b.title}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e5c07b]/15 pt-3">
        <Link href="/" className="text-xs text-[#e5c07b] underline transition-colors hover:text-[#ffd700]">
          {view.isGuest ? "กลับไปเปิดไพ่และสมัครสมาชิก" : "กลับไปเปิดไพ่"}
        </Link>
        {view.isMember && !view.isUnlimited && (
          <button
            type="button"
            onClick={() => setBuyOpen(true)}
            className="min-h-[40px] rounded-xl border border-[#e5c07b]/40 bg-[#140b24] px-4 py-2 font-serif-th text-xs font-semibold text-[#f5deaa] transition-colors hover:border-[#ffd700] hover:bg-[#201338] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
          >
            <span className="mr-1.5 text-[#e5c07b]">✦</span> เติมรอบเปิดไพ่
          </button>
        )}
      </div>

      <BuyCreditsModal isOpen={buyOpen} onClose={() => setBuyOpen(false)} user={user} />
    </div>
  );
}
