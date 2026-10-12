"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WaitlistForm } from "@/components/marketplace/WaitlistForm";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import {
  bkkDateKey,
  dayChipParts,
  formatTime,
  pageOfDate,
  relativeDayLabel,
  relativeDayShort,
  resolveVisibleDay,
  soonestSlots,
  type SlotDay,
} from "@/lib/marketplace/booking-policy";

interface SlotPickerProps {
  readerId: string;
  value: number | null;
  onChange: (slotStart: number) => void;
  /** ตัดเวลานี้ออก (เวลานัดเดิมตอนเลื่อนนัด) */
  excludeSlot?: number | null;
  /** เปลี่ยนค่านี้เพื่อสั่งโหลดเวลาว่างใหม่ (เช่น หลังเจอ "เวลานี้เพิ่งมีคนจอง") */
  refreshKey?: number;
  /** แจ้งผู้ใช้ว่ามีเวลาว่างไหม (ใช้ซ่อน/แสดงทางเลือกนัดล่วงหน้า) */
  onLoaded?: (hasSlots: boolean) => void;
  /** เวลาเต็ม ➔ แสดงฟอร์ม "แจ้งเตือนฉันเมื่อมีเวลาว่าง" แทนทางตัน */
  showWaitlist?: boolean;
}

const PERIODS: { label: string; from: number; to: number }[] = [
  { label: "ช่วงเช้า", from: 0, to: 12 },
  { label: "ช่วงบ่าย", from: 12, to: 17 },
  { label: "ช่วงเย็น–ค่ำ", from: 17, to: 24 },
];

/** แถววันต่อหน้า — 4 ช่องพอดีจอมือถือ 360px โดยปุ่มยังกว้างพอกดด้วยนิ้ว */
const DAYS_PER_PAGE = 4;
/** ทางลัด "เวลาว่างเร็วที่สุด" กี่ช่อง */
const SOONEST_COUNT = 3;

/**
 * ✦ ตัวเลือกวันและเวลานัด — แบบหน้าจองของเว็บระดับโลก (Calendly · Zocdoc · Airbnb Experiences)
 * ---------------------------------------------------------------------------
 * ① "เวลาว่างเร็วที่สุด" 3 ช่อง (คนส่วนใหญ่อยากคุยเร็วที่สุด — แตะครั้งเดียวจบ)
 * ② แถววันแบบแบ่งหน้า ‹ › ทีละ 4 วัน ➔ ③ ช่องเวลาของวันที่เลือก แยกเช้า/บ่าย/ค่ำ อยู่ใต้แถววันทันที
 *
 * - แสดงเวลาไทยเสมอ (แม่หมอและลูกค้าอยู่ไทย · ข้อความบอกชัดว่าเป็นเวลาไทย)
 * - วันที่แตะล่าสุดชนะเสมอ (`resolveVisibleDay`) — เดิมเลือกเวลาไปแล้วแตะวันอื่นไม่เปลี่ยน (CONSULT_FLOW P1)
 * - เดิมแถววันวางครบ 13–14 ช่อง (4 แถว) จนช่องเวลาตกขอบจอมือถือ (P2) ➔ แบ่งหน้าแทน
 * - ⚠️ Zero-Clipping: ห้ามแถบเลื่อนแนวนอน (กฎเหล็กข้อ 3) — จึงใช้ปุ่ม ‹ › แบ่งหน้า
 * - เวลาที่แสดงเป็นแค่ "ที่ว่างตอนโหลด" — ด่านจริงอยู่ฝั่งเซิร์ฟเวอร์ (slotRejection + unique index)
 */
export const SlotPicker: React.FC<SlotPickerProps> = ({
  readerId,
  value,
  onChange,
  excludeSlot,
  refreshKey = 0,
  onLoaded,
  showWaitlist = false,
}) => {
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(null);
  /** หน้าที่ผู้ใช้กด ‹ › ไปเอง — null = ตามวันที่กำลังแสดงอยู่ */
  const [pageOverride, setPageOverride] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const timesRef = useRef<HTMLFieldSetElement>(null);
  // เก็บ callback ไว้ใน ref — ผู้เรียกส่งฟังก์ชันใหม่ทุกครั้งที่ render ไม่ต้องทำให้โหลดซ้ำ
  const onLoadedRef = useRef(onLoaded);
  useEffect(() => {
    onLoadedRef.current = onLoaded;
  }, [onLoaded]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/readers/${encodeURIComponent(readerId)}/slots`, { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { days?: SlotDay[]; error?: string };
      if (!res.ok || !data.days) {
        setError(data.error || "โหลดเวลาว่างไม่สำเร็จ");
        setDays([]);
        return;
      }
      const cleaned = data.days
        .map((d) => ({ ...d, slots: d.slots.filter((s) => s !== excludeSlot) }))
        .filter((d) => d.slots.length > 0);
      setDays(cleaned);
      setPageOverride(null);
      setNow(Date.now());
      onLoadedRef.current?.(cleaned.length > 0);
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
      setDays([]);
    }
  }, [readerId, excludeSlot]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const visibleDay = useMemo(() => resolveVisibleDay(days ?? [], value, activeDate), [days, value, activeDate]);
  const soonest = useMemo(() => soonestSlots(days ?? [], SOONEST_COUNT), [days]);

  if (days === null) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">กำลังโหลดเวลาว่าง…</span>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-inset-warm" />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-inset-warm" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-xl bg-inset-warm" />
          ))}
        </div>
      </div>
    );
  }

  if (days.length === 0) {
    return (
      <div className="rounded-2xl border border-line-warm bg-inset-warm/60 p-5 text-center">
        <p className="text-sm font-bold text-ink-deep">{error ? "โหลดเวลาว่างไม่สำเร็จ" : "ยังไม่มีเวลาว่างใน 14 วันนี้"}</p>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {error ? error : "แม่หมอยังไม่ได้เปิดตารางนัด หรือเวลาเต็มแล้ว ลองดูแม่หมอท่านอื่นได้"}
        </p>
        {error && (
          <button
            type="button"
            onClick={() => void load()}
            className="tap-overlay-y mt-3 text-[13px] font-semibold text-gold-ink underline underline-offset-2 cursor-pointer"
          >
            ลองอีกครั้ง
          </button>
        )}
        {!error && showWaitlist && (
          <div className="mt-4">
            <WaitlistForm readerId={readerId} compact />
          </div>
        )}
      </div>
    );
  }

  const pageCount = Math.ceil(days.length / DAYS_PER_PAGE);
  // ไม่ได้กด ‹ › เอง ➔ เปิดหน้าที่มีวันที่กำลังแสดงอยู่ (เช่น กลับมาจากขั้นถัดไปพร้อมเวลาเดิมที่อยู่หน้า 3)
  const safePage = Math.min(pageOverride ?? pageOfDate(days, visibleDay?.date ?? null, DAYS_PER_PAGE), pageCount - 1);
  const pageDays = days.slice(safePage * DAYS_PER_PAGE, safePage * DAYS_PER_PAGE + DAYS_PER_PAGE);
  const daySlots = visibleDay?.slots ?? [];
  const hourOf = (ms: number) => Number(formatTime(ms).slice(0, 2));
  const valueDate = value !== null ? bkkDateKey(value) : null;

  const pick = (s: number) => {
    setActiveDate(bkkDateKey(s));
    setPageOverride(null); // แตะทางลัดของวันที่อยู่หน้าอื่น ➔ แถววันตามไปหน้านั้น
    onChange(s);
  };

  const showDay = (date: string) => {
    setActiveDate(date);
    setPageOverride(null);
    // จอมือถือเตี้ย: ช่องเวลาของวันที่แตะอาจอยู่ใต้ขอบจอ/ใต้แถบล่างของหน้าจอง ➔ เลื่อนขึ้นมาให้เห็นทันที
    // (เลื่อนเฉพาะตอนมองไม่เห็น — จอใหญ่ที่เห็นอยู่แล้วต้องไม่กระตุก)
    requestAnimationFrame(() => {
      const el = timesRef.current;
      if (!el) return;
      if (el.getBoundingClientRect().top > window.innerHeight - 200) el.scrollIntoView({ block: "start", behavior: smoothScrollBehavior() });
    });
  };

  const arrowClass =
    "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line-warm bg-surface text-lg text-ink-deep transition-colors cursor-pointer hover:border-gold-ink disabled:cursor-default disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink";

  return (
    <div className="space-y-5">
      {soonest.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-ink-deep">เวลาว่างเร็วที่สุด</legend>
          <div className="grid grid-cols-3 gap-2">
            {soonest.map((s) => {
              const active = value === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => pick(s)}
                  className={`flex min-h-[52px] flex-col items-center justify-center rounded-xl border px-1 py-1.5 leading-tight transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                    active
                      ? "border-gold-ink bg-gold-ink text-surface"
                      : "border-line-interactive-warm bg-surface text-ink-deep hover:border-gold-ink"
                  }`}
                >
                  <span className={`text-[12px] ${active ? "text-surface/85" : "text-muted"}`}>{relativeDayShort(s, now)}</span>
                  <span className="text-base font-bold tabular-nums">{formatTime(s)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-[13px] font-bold text-ink-deep">{soonest.length > 0 ? "หรือเลือกวัน" : "เลือกวัน"}</legend>
        <div className="flex items-center gap-1.5">
          {pageCount > 1 && (
            <button
              type="button"
              onClick={() => setPageOverride(Math.max(0, safePage - 1))}
              disabled={safePage === 0}
              aria-label="ดูวันก่อนหน้า"
              className={arrowClass}
            >
              <span aria-hidden="true">‹</span>
            </button>
          )}
          <div className="grid min-w-0 flex-1 grid-cols-4 gap-1.5">
            {pageDays.map((d) => {
              const chip = dayChipParts(d.slots[0]);
              const rel = relativeDayShort(d.slots[0], now);
              const active = visibleDay?.date === d.date;
              const holdsChoice = valueDate === d.date && !active;
              return (
                <button
                  key={d.date}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${relativeDayLabel(d.slots[0], now)} ว่าง ${d.slots.length} เวลา${valueDate === d.date ? " (มีเวลาที่คุณเลือกไว้)" : ""}`}
                  onClick={() => showDay(d.date)}
                  className={`relative flex min-h-[64px] flex-col items-center justify-center rounded-2xl border px-0.5 py-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                    active
                      ? "border-gold-ink bg-gold-ink text-surface shadow-sm"
                      : "border-line-warm bg-surface text-ink-deep hover:border-gold-ink/60"
                  }`}
                >
                  <span className={`text-[11px] leading-tight ${active ? "text-surface/85" : "text-muted"}`}>
                    {rel === "วันนี้" || rel === "พรุ่งนี้" ? rel : chip.weekday}
                  </span>
                  <span className="text-lg font-bold leading-tight">{chip.day}</span>
                  <span className={`text-[11px] leading-tight ${active ? "text-surface/85" : "text-muted"}`}>{chip.month}</span>
                  {holdsChoice && (
                    <span aria-hidden="true" className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold-ink" />
                  )}
                </button>
              );
            })}
          </div>
          {pageCount > 1 && (
            <button
              type="button"
              onClick={() => setPageOverride(Math.min(pageCount - 1, safePage + 1))}
              disabled={safePage >= pageCount - 1}
              aria-label="ดูวันถัดไป"
              className={arrowClass}
            >
              <span aria-hidden="true">›</span>
            </button>
          )}
        </div>
      </fieldset>

      <fieldset ref={timesRef} className="space-y-3 scroll-mt-4">
        <legend className="mb-1 flex w-full items-baseline justify-between gap-2 text-[13px]">
          <span className="font-bold text-ink-deep">
            เวลาว่าง{visibleDay ? ` · ${relativeDayLabel(visibleDay.slots[0], now)}` : ""}
          </span>
          <span className="text-muted">เวลาประเทศไทย</span>
        </legend>
        {PERIODS.map((period) => {
          const inPeriod = daySlots.filter((s) => hourOf(s) >= period.from && hourOf(s) < period.to);
          if (inPeriod.length === 0) return null;
          return (
            <div key={period.label} className="space-y-1.5">
              <p className="text-[12px] text-muted">{period.label}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {inPeriod.map((s) => {
                  const active = value === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={active}
                      onClick={() => pick(s)}
                      className={`min-h-[44px] rounded-xl border text-sm font-semibold tabular-nums transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                        active
                          ? "border-gold-ink bg-gold-ink text-surface"
                          : "border-line-warm bg-surface text-ink-deep hover:border-gold-ink/60"
                      }`}
                    >
                      {formatTime(s)}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </fieldset>
    </div>
  );
};
