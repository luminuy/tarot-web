"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { PublicReaderProfile } from "@/lib/marketplace/readers.repo";
import { CONSULTATION_MINUTES, readerPriceThb } from "@/lib/marketplace/offer";
import { WaitlistForm } from "@/components/marketplace/WaitlistForm";
import { FREE_CANCEL_HOURS, formatTime, relativeDayLabel, relativeDayShort } from "@/lib/marketplace/booking-policy";

interface ReaderDetailClientProps {
  reader: PublicReaderProfile;
  isLiveOpen: boolean;
  /** เวลาว่างที่เร็วที่สุด (ms) สูงสุด 3 ช่อง — ว่าง = ยังไม่เปิดตารางนัด หรือเต็มทุกช่องใน 14 วัน */
  quickSlots: number[];
  /** เวลาฝั่งเซิร์ฟเวอร์ตอน render — ใช้คำนวณ "วันนี้/พรุ่งนี้" ให้ HTML ตรงกันทั้งสองฝั่ง */
  nowMs: number;
}

/**
 * ✦ การ์ดจองคิว (ขวาของหน้าโปรไฟล์ · มือถือขึ้นต่อจากหัวโปรไฟล์) — CONSULT_FLOW_UX_PLAN ข้อ 1.5
 * ---------------------------------------------------------------------------
 * แบบการ์ดจองของเว็บระดับโลก: ราคา · สถานะเป็นภาษาคน · เวลาว่างเร็วที่สุดแตะได้ทันที · ปุ่มหลักปุ่มเดียว
 *
 *   แม่หมอออนไลน์ (เปิดคิวสด) ➔ "คุยตอนนี้" (หลัก) + "นัดเวลาอื่น" (รอง ถ้ามีตาราง)
 *   ไม่ออนไลน์ แต่มีตาราง     ➔ "เลือกเวลานัด" + ปุ่มลัดเวลาว่างเร็วที่สุด 3 ช่อง
 *   ไม่มีทั้งสองทาง          ➔ ไม่มีปุ่มจอง (บอกตรง ๆ + ฝากอีเมลรอเวลาว่าง) ไม่ให้กดแล้วไปเจอทางตัน
 *
 * ทุกปุ่มพาไปหน้าจองเต็มจอ `/readers/<id>/book` (เดิมเป็นหน้าต่างลอยที่คับจอมือถือ — P2 · P4)
 * มือถือ: แถบล่างติดจอโผล่เมื่อปุ่มหลักเลื่อนพ้นจอ — ปุ่มจองต้องเห็นเสมอ (หน้านี้ไม่มีปุ่มลอยโซเชียลแล้ว P5)
 */
export const ReaderDetailClient: React.FC<ReaderDetailClientProps> = ({ reader, isLiveOpen, quickSlots, nowMs }) => {
  const hasSchedule = quickSlots.length > 0;
  const price = readerPriceThb(reader);
  const bookHref = `/readers/${encodeURIComponent(reader.id)}/book`;
  const nextLabel = hasSchedule ? `${relativeDayLabel(quickSlots[0], nowMs)} ${formatTime(quickSlots[0])} น.` : null;
  const primary = isLiveOpen
    ? { href: `${bookHref}?mode=now`, label: "คุยตอนนี้" }
    : hasSchedule
      ? { href: bookHref, label: "เลือกเวลานัด" }
      : null;

  const primaryHref = primary?.href ?? null;
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta || !primaryHref || typeof IntersectionObserver === "undefined") return;
    const footer = document.querySelector("footer");
    const visible = new Map<Element, boolean>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) visible.set(e.target, e.isIntersecting);
      // ปุ่มหลักในการ์ดมองไม่เห็น และยังไม่ถึงท้ายเว็บ ➔ โชว์แถบล่าง (ถึงท้ายเว็บแล้วหลบ ไม่บังลิงก์ท้ายเว็บ)
      setShowBar(!visible.get(cta) && !(footer && visible.get(footer)));
    });
    io.observe(cta);
    if (footer) io.observe(footer);
    return () => io.disconnect();
  }, [primaryHref]);

  const primaryClass =
    "btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2";
  const secondaryClass =
    "flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line-interactive-warm bg-surface px-6 text-sm font-bold text-ink-deep transition-colors cursor-pointer hover:border-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2";

  return (
    <>
      <section aria-label="จองคิวปรึกษา" className="altar-card-porcelain !rounded-2xl space-y-5 p-5 sm:p-6">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold text-ink-deep">{price}</span>
          <span className="text-sm font-semibold text-ink-deep">บาท</span>
          <span className="text-sm text-muted">/ {CONSULTATION_MINUTES} นาที</span>
        </div>

        <div
          className={`flex items-start gap-2.5 rounded-xl border p-3 text-[13px] leading-relaxed ${
            isLiveOpen ? "border-ok/30 bg-ok/10" : "border-line-warm"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isLiveOpen ? "bg-ok animate-pulse" : "bg-muted"}`}
          />
          <p className="text-ink">
            {isLiveOpen ? (
              <>
                <strong className="block font-bold text-ok">พร้อมคุยตอนนี้</strong>
                แม่หมอออนไลน์อยู่ จ่ายแล้วเข้าคิวได้ทันที
              </>
            ) : hasSchedule ? (
              <>
                <strong className="block font-bold text-ink-deep">ตอนนี้ยังไม่เปิดคุยสด</strong>
                นัดเวลาได้ · ว่างเร็วสุด <strong className="font-bold text-ink-deep">{nextLabel}</strong>
              </>
            ) : (
              <>
                <strong className="block font-bold text-ink-deep">ตอนนี้ยังไม่มีเวลาว่าง</strong>
                ฝากอีเมลไว้ ระบบจะแจ้งทันทีที่แม่หมอเปิดเวลาใหม่
              </>
            )}
          </p>
        </div>

        {hasSchedule && !isLiveOpen && (
          <div className="space-y-2">
            <p className="text-[13px] font-bold text-ink-deep">เวลาว่างเร็วที่สุด · แตะเพื่อจอง</p>
            <ul className="grid grid-cols-3 gap-2">
              {quickSlots.map((s) => (
                <li key={s}>
                  <Link
                    href={`${bookHref}?slot=${s}`}
                    aria-label={`จองเวลา ${relativeDayLabel(s, nowMs)} ${formatTime(s)} น.`}
                    className="flex min-h-[52px] flex-col items-center justify-center rounded-xl border border-line-interactive-warm bg-surface px-1 py-1.5 leading-tight text-ink-deep transition-colors hover:border-gold-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
                  >
                    <span className="text-[12px] text-muted">{relativeDayShort(s, nowMs)}</span>
                    <span className="text-base font-bold tabular-nums">{formatTime(s)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {primary ? (
          <div ref={ctaRef} className="space-y-2.5">
            <Link href={primary.href} className={primaryClass}>
              {primary.label}
            </Link>
            {isLiveOpen && hasSchedule && (
              <Link href={`${bookHref}?mode=schedule`} className={secondaryClass}>
                นัดเวลาอื่น
              </Link>
            )}
          </div>
        ) : (
          <WaitlistForm readerId={reader.id} compact />
        )}

        {/* เงื่อนไขย่อ — เส้นซ้ายแทนไอคอนติ๊ก (กฎเหล็ก 2 · `.v3-cs-lines` ใน v3-consult.css) */}
        <ul className="v3-cs-lines">
          {[
            `ยกเลิกก่อนนัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็มจำนวน`,
            "ชำระก่อนคุย ผ่าน Stripe · บัตรหรือพร้อมเพย์",
            "คุยผ่านวิดีโอคอลในเว็บ หรือ LINE · ไม่ต้องลงแอป",
          ].map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      {/* มือถือ: แถบล่างติดจอ — ราคา + สถานะ + ปุ่มหลัก (โผล่เมื่อปุ่มในการ์ดเลื่อนพ้นจอ) */}
      {primary && (
        <div
          aria-hidden={!showBar}
          className={`v3-cs-bar fixed inset-x-0 bottom-0 z-30 border-t border-line-warm bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_30px_-24px_rgba(46,33,26,0.6)] transition-transform duration-200 lg:hidden ${
            showBar ? "translate-y-0" : "pointer-events-none translate-y-full"
          }`}
        >
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
            <p className="min-w-0 text-[13px] leading-snug">
              <span className="block">
                <strong className="text-lg font-bold text-ink-deep">{price}</strong>
                <span className="ml-1 text-ink-deep">บาท</span>
                <span className="text-muted"> / {CONSULTATION_MINUTES} นาที</span>
              </span>
              <span className={isLiveOpen ? "font-semibold text-ok" : "text-muted"}>
                {isLiveOpen ? "พร้อมคุยตอนนี้" : `ว่างเร็วสุด ${nextLabel}`}
              </span>
            </p>
            <Link
              href={primary.href}
              tabIndex={showBar ? undefined : -1}
              className="btn-gold-glass flex min-h-[48px] shrink-0 items-center justify-center gap-2 px-5 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
            >
              {primary.label}
            </Link>
          </div>
        </div>
      )}
    </>
  );
};
