"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WaitlistForm } from "@/components/marketplace/WaitlistForm";
import {
  dayChipParts,
  formatTime,
  relativeDayLabel,
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

/**
 * ✦ ตัวเลือกวันและเวลานัด — แบบหน้าจองของเว็บระดับโลก (Calendly · Airbnb Experiences)
 * ---------------------------------------------------------------------------
 * แถววันที่ (เฉพาะวันที่มีเวลาว่าง) ➔ ช่องเวลาแยกเช้า/บ่าย/ค่ำ ➔ เลือกแล้วเห็นสรุปทันที
 * - แสดงเวลาไทยเสมอ (แม่หมอและลูกค้าอยู่ไทย · ข้อความบอกชัดว่าเป็นเวลาไทย)
 * - ⚠️ Zero-Clipping: แถววันที่ "ห่อบรรทัด" ไม่ใช้แถบเลื่อนแนวนอน (กฎเหล็กข้อ 3)
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
  const [now, setNow] = useState(() => Date.now());
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

  // วันที่เลือกอยู่: วันของเวลาที่เลือก ➔ วันที่เคยกด ➔ วันแรกที่มีเวลาว่าง
  const selectedDay = useMemo(() => {
    if (!days || days.length === 0) return null;
    const byValue = value ? days.find((d) => d.slots.includes(value)) : undefined;
    return byValue ?? days.find((d) => d.date === activeDate) ?? days[0];
  }, [days, value, activeDate]);

  if (days === null) {
    return (
      <div className="space-y-3" aria-busy="true" aria-live="polite">
        <span className="sr-only">กำลังโหลดเวลาว่าง…</span>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-inset-warm" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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

  const daySlots = selectedDay?.slots ?? [];
  const hourOf = (ms: number) => Number(formatTime(ms).slice(0, 2));

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-[13px] font-bold text-ink-deep">เลือกวัน</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {days.map((d) => {
            const chip = dayChipParts(d.slots[0]);
            const active = selectedDay?.date === d.date;
            return (
              <button
                key={d.date}
                type="button"
                aria-pressed={active}
                aria-label={`${relativeDayLabel(d.slots[0], now)} ว่าง ${d.slots.length} เวลา`}
                onClick={() => setActiveDate(d.date)}
                className={`flex min-h-[64px] flex-col items-center rounded-2xl border px-1 py-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                  active
                    ? "border-gold-ink bg-gold-ink text-surface shadow-sm"
                    : "border-line-warm bg-surface text-ink-deep hover:border-gold-ink/60"
                }`}
              >
                <span className={`text-[11px] ${active ? "text-surface/85" : "text-muted"}`}>{chip.weekday}</span>
                <span className="text-lg font-bold leading-tight">{chip.day}</span>
                <span className={`text-[11px] ${active ? "text-surface/85" : "text-muted"}`}>{chip.month}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="mb-1 flex w-full items-baseline justify-between gap-2 text-[13px]">
          <span className="font-bold text-ink-deep">
            เลือกเวลา{selectedDay ? ` · ${relativeDayLabel(selectedDay.slots[0], now)}` : ""}
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
                      onClick={() => onChange(s)}
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
