"use client";

import { useEffect, useState } from "react";

import { QuotaPips } from "@/components/entitlement/QuotaPips";
import { CheckMarkIcon, HourglassIcon, SealedLockIcon } from "@/components/entitlement/EntitlementIcons";
import {
  MEMBER_BENEFITS,
  UPGRADE_COPY,
  describeEntitlement,
  formatResetCountdown,
  type UpgradeReason,
} from "@/lib/entitlement/copy";
import { trackEntitlementEvent } from "@/lib/entitlement/track";
import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * การ์ดกั้นสิทธิ์บนขั้นเลือกผัง
 * ------------------------------------------------------------------
 * ของเดิม: สิทธิ์หมด → **ลบหน้าเลือกผังทิ้งทั้งหน้า** เหลือกล่องเล็ก ๆ กล่องเดียว
 * ผู้ใช้จึงมองไม่เห็นว่าเว็บนี้มีอะไรให้บ้าง = เสียทั้งความรู้สึกและโอกาสสมัคร
 *
 * ของใหม่: ยัง **เลือกดูผังทั้ง 20 แบบได้ตามปกติ** (การดูไม่ใช่การใช้สิทธิ์)
 * แค่ขึ้นการ์ดอธิบายไว้ด้านบนว่าทำไมกดเริ่มไม่ได้ และทำอย่างไรต่อ
 * ส่วนการบังคับสิทธิ์จริงอยู่ฝั่ง server เสมอ (การซ่อนปุ่มไม่ใช่การบังคับสิทธิ์)
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

  return (
    <div className="space-y-8">
      <section
        aria-live="polite"
        className="altar-panel mx-auto max-w-2xl rounded-3xl border border-[#e5c07b]/35 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.75)] sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center self-center rounded-2xl border border-[#e5c07b]/40 bg-[#1a1030] text-[#ffd700] shadow-[0_0_20px_rgba(229,192,123,0.25)] sm:self-start">
            {isGuest ? <SealedLockIcon className="h-5 w-5" /> : <HourglassIcon className="h-5 w-5" />}
          </span>

          <div className="min-w-0 flex-1 space-y-4 text-center sm:text-left">
            <div className="space-y-2">
              <h2 className="font-serif-th text-lg font-bold font-mystic-gold sm:text-xl">{copy.title}</h2>
              <p className="font-serif-th text-sm leading-relaxed text-[#cfc8e2]">{copy.body}</p>
            </div>

            {/* สถานะสิทธิ์ + เวลารีเซ็ต */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-xl border border-[#e5c07b]/15 bg-[#0a0714]/70 px-3 py-2 sm:justify-start">
              <QuotaPips remaining={view.remaining} limit={view.limit} tone="empty" />
              <span className="font-serif-th text-[11px] text-[#9c93b8]">{view.statusLine}</span>
              {!isGuest && countdown && (
                <span className="font-serif-th text-[11px] text-[#e5c07b]">· โควตาใหม่ {countdown}</span>
              )}
            </div>

            {/* สิทธิ์ที่จะได้ — เฉพาะกรณีชวนสมัคร */}
            {isGuest && (
              <ul className="grid gap-1.5 text-left sm:grid-cols-2">
                {MEMBER_BENEFITS.map((b) => (
                  <li key={b.title} className="flex items-start gap-2 font-serif-th text-[11px] text-[#cfc8e2]">
                    <CheckMarkIcon className="mt-0.5 h-3 w-3 shrink-0 text-[#ffd700]" />
                    {b.title}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button
                type="button"
                onClick={() => onRequestUpgrade(reason)}
                className="flex-1 rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-3.5 font-serif-th text-sm font-bold text-[#05040a] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a]"
              >
                <span className="mr-1.5">✦</span>
                {copy.primaryLabel}
              </button>
              <button
                type="button"
                onClick={() => onRequestUpgrade("explore")}
                className="rounded-2xl border border-[#e5c07b]/30 px-5 py-3.5 font-serif-th text-xs text-[#cfc8e2] transition-colors hover:bg-[#191230] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700]"
              >
                เทียบสิทธิ์แต่ละแบบ
              </button>
            </div>

            <p className="font-serif-th text-[11px] leading-relaxed text-[#9c93b8]">{copy.reassurance}</p>
          </div>
        </div>
      </section>

      {/* ยังเลือกดูผังได้ตามปกติ — การดูไม่กินสิทธิ์ */}
      <div className="space-y-2">
        <p className="text-center font-serif-th text-[11px] text-[#9c93b8]">
          <span className="text-[#e5c07b]">✦</span> เลือกดูผังทั้งหมดไว้ก่อนได้ ผังที่เลือกไว้จะรออยู่ตรงนี้เมื่อคุณได้สิทธิ์แล้ว
        </p>
        {children}
      </div>
    </div>
  );
}
