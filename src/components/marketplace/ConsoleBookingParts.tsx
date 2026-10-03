"use client";

import { useMemo, useState } from "react";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";
import {
  canMarkNoShow,
  canStartBooking,
  EARLY_START_MINUTES,
  formatCountdown,
  formatMinutes,
  formatSlotRange,
  SLOT_MINUTES,
  WEEKDAY_LABELS,
  type ScheduleRule,
} from "@/lib/marketplace/booking-policy";

/** วันในสัปดาห์เรียงแบบปฏิทินไทย (จันทร์ก่อน) */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TIME_OPTIONS = Array.from({ length: (24 * 60) / SLOT_MINUTES + 1 }, (_, i) => i * SLOT_MINUTES);

interface DayRow {
  on: boolean;
  startMin: number;
  endMin: number;
}

/**
 * ✦ ตารางรับนัดประจำสัปดาห์ของแม่หมอ — แบบหน้าตั้งเวลาว่างของ Calendly
 * ---------------------------------------------------------------------------
 * หนึ่งแถวต่อวัน: สวิตช์เปิด/ปิด · เวลาเริ่ม · เวลาเลิก (ทีละ 30 นาที) ➔ บันทึกครั้งเดียวทั้งสัปดาห์
 * นัดที่ลูกค้าจ่ายแล้วไม่ถูกแตะ — ตารางใหม่มีผลกับเวลาว่างที่เปิดให้จองต่อจากนี้เท่านั้น
 */
export function ReaderScheduleEditor({
  schedule,
  authHeaders,
  onSaved,
}: {
  schedule: ScheduleRule[];
  authHeaders: () => HeadersInit;
  onSaved: (message: string) => void;
}) {
  const initial = useMemo(() => {
    const rows: Record<number, DayRow> = {};
    for (const wd of WEEK_ORDER) {
      const rule = schedule.find((r) => r.weekday === wd);
      rows[wd] = rule ? { on: true, startMin: rule.startMin, endMin: rule.endMin } : { on: false, startMin: 18 * 60, endMin: 22 * 60 };
    }
    return rows;
  }, [schedule]);
  const [rows, setRows] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  const update = (wd: number, patch: Partial<DayRow>) => setRows((r) => ({ ...r, [wd]: { ...r[wd], ...patch } }));

  const save = async () => {
    setSaving(true);
    setError(null);
    const rules: ScheduleRule[] = WEEK_ORDER.filter((wd) => rows[wd].on).map((wd) => ({
      weekday: wd,
      startMin: rows[wd].startMin,
      endMin: rows[wd].endMin,
    }));
    try {
      const res = await fetch("/api/marketplace/console/schedule", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ rules }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error || "บันทึกไม่สำเร็จ");
      else onSaved(rules.length ? "บันทึกตารางรับนัดแล้ว ลูกค้าเห็นเวลาว่างใหม่ทันที" : "ปิดรับนัดล่วงหน้าแล้ว");
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    }
    setSaving(false);
  };

  const selectClass =
    "min-h-[40px] rounded-lg border border-line-warm bg-surface px-2 text-sm tabular-nums text-ink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink disabled:opacity-40";

  return (
    <section aria-labelledby="schedule-heading" className="altar-card-porcelain !rounded-3xl space-y-4 p-5 sm:p-6">
      <div>
        <h2 id="schedule-heading" className="font-serif-th text-lg font-bold text-ink">ตารางรับนัดล่วงหน้า</h2>
        <p className="mt-0.5 font-serif-th text-xs leading-relaxed text-muted">
          ลูกค้าจองได้ล่วงหน้าสูงสุด 14 วัน ครั้งละ {SLOT_MINUTES} นาที และต้องจองก่อนเวลานัดอย่างน้อย 2 ชั่วโมง (เวลาประเทศไทย)
        </p>
      </div>

      <ul className="divide-y divide-line-warm/70 rounded-2xl border border-line-warm">
        {WEEK_ORDER.map((wd) => {
          const row = rows[wd];
          const invalid = row.on && row.endMin - row.startMin < SLOT_MINUTES;
          return (
            <li key={wd} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-3">
              <label className="flex w-32 cursor-pointer items-center gap-2.5 font-serif-th text-sm font-semibold text-ink-deep">
                <input
                  type="checkbox"
                  checked={row.on}
                  onChange={(e) => update(wd, { on: e.target.checked })}
                  className="h-4 w-4 accent-gold-ink"
                />
                {WEEKDAY_LABELS[wd]}
              </label>
              {row.on ? (
                <div className="flex items-center gap-2">
                  <select
                    aria-label={`เวลาเริ่มวัน${WEEKDAY_LABELS[wd]}`}
                    value={row.startMin}
                    onChange={(e) => update(wd, { startMin: Number(e.target.value) })}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.slice(0, -1).map((m) => (
                      <option key={m} value={m}>
                        {formatMinutes(m)}
                      </option>
                    ))}
                  </select>
                  <span className="text-muted" aria-hidden="true">–</span>
                  <select
                    aria-label={`เวลาเลิกวัน${WEEKDAY_LABELS[wd]}`}
                    value={row.endMin}
                    onChange={(e) => update(wd, { endMin: Number(e.target.value) })}
                    className={selectClass}
                  >
                    {TIME_OPTIONS.slice(1).map((m) => (
                      <option key={m} value={m}>
                        {formatMinutes(m)}
                      </option>
                    ))}
                  </select>
                  {invalid && <span className="font-serif-th text-xs text-err">เวลาเลิกต้องหลังเวลาเริ่ม</span>}
                </div>
              ) : (
                <span className="font-serif-th text-sm text-muted">ไม่รับนัด</span>
              )}
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 font-serif-th text-[13px] text-err">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={save}
          className="btn-gold-glass min-h-[44px] px-6 font-serif-th text-sm font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกตาราง"}
        </button>
      </div>
    </section>
  );
}

/**
 * ✦ นัดที่จะถึง — เรียงตามเวลา · ปุ่มตามจังหวะเวลาจริง (เริ่มนัดได้ก่อน 15 นาที · แจ้งลูกค้าไม่มาหลัง 15 นาที)
 */
export function UpcomingBookings({
  tickets,
  nowMs,
  busyId,
  onAction,
}: {
  tickets: QueueTicket[];
  nowMs: number;
  busyId: string | null;
  onAction: (ticketId: string, action: "accept" | "cancel" | "no_show") => void;
}) {
  const sorted = [...tickets].sort((a, b) => (a.slotStart ?? 0) - (b.slotStart ?? 0));
  return (
    <section aria-labelledby="bookings-heading" className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 id="bookings-heading" className="font-serif-th text-lg font-bold text-ink">นัดที่จะถึง</h2>
        <span className="rounded-full border border-gold-ink/20 bg-gold-ink/10 px-2.5 py-0.5 text-xs font-bold text-gold-ink">
          {sorted.length} นัด
        </span>
      </div>
      {sorted.length === 0 ? (
        <p className="altar-card-porcelain !rounded-2xl p-5 text-center font-serif-th text-sm text-muted">
          ยังไม่มีนัดที่ลูกค้าชำระเงินแล้ว
        </p>
      ) : (
        <ul className="altar-card-porcelain !rounded-2xl divide-y divide-line-warm/70">
          {sorted.map((t) => {
            const startable = canStartBooking(t.slotStart, nowMs);
            const noShow = canMarkNoShow(t.slotStart, nowMs);
            return (
              <li key={t.id} className="space-y-2.5 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-serif-th text-sm font-bold text-ink-deep">
                      {t.slotStart ? formatSlotRange(t.slotStart) : "-"}
                    </p>
                    <p className="font-serif-th text-[13px] text-muted">
                      คุณ{t.nickname || "ลูกดวง"} · {t.slotStart ? formatCountdown(t.slotStart, nowMs) : ""}
                    </p>
                  </div>
                  <span className="rounded-full border border-ok/30 bg-ok/10 px-2 py-0.5 font-serif-th text-[13px] font-semibold text-ok">
                    ชำระแล้ว
                  </span>
                </div>
                {t.screening?.brief && (
                  <details className="rounded-xl bg-inset-warm/60 p-3 font-serif-th text-xs text-ink">
                    <summary className="cursor-pointer font-bold text-gold-ink">สรุปเรื่องที่ถามโดย AI</summary>
                    <p className="mt-2 whitespace-pre-line leading-relaxed">{t.screening.brief}</p>
                  </details>
                )}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!startable || busyId === t.id}
                    onClick={() => onAction(t.id, "accept")}
                    title={startable ? undefined : `เริ่มได้ก่อนเวลานัด ${EARLY_START_MINUTES} นาที`}
                    className="btn-gold-glass min-h-[40px] px-4 font-serif-th text-xs font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    เริ่มนัด
                  </button>
                  {noShow && (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => {
                        if (window.confirm("แจ้งว่าลูกค้าไม่มาตามนัด? (ไม่มีการคืนเงิน)")) onAction(t.id, "no_show");
                      }}
                      className="min-h-[40px] rounded-full border border-line-warm px-4 font-serif-th text-xs font-semibold text-ink cursor-pointer"
                    >
                      ลูกค้าไม่มา
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busyId === t.id}
                    onClick={() => {
                      if (window.confirm("ยกเลิกนัดนี้? ลูกค้าจะได้รับเงินคืนเต็มจำนวนอัตโนมัติ")) onAction(t.id, "cancel");
                    }}
                    className="min-h-[40px] rounded-full px-4 font-serif-th text-xs font-semibold text-err cursor-pointer hover:bg-err/10"
                  >
                    ยกเลิก (คืนเงินเต็ม)
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
