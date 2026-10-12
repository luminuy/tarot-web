"use client";

import { useMemo, useState } from "react";
import type { QueueTicket } from "@/lib/marketplace/queue.repo";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import {
  bkkDateKey,
  bkkDayStart,
  BOOKING_HORIZON_DAYS,
  BUFFER_OPTIONS,
  DEFAULT_LEAD_MIN,
  dayChipParts,
  canMarkNoShow,
  canStartBooking,
  EARLY_START_MINUTES,
  formatCountdown,
  formatMinutes,
  formatLeadLabel,
  formatSlotRange,
  LEAD_OPTIONS_MIN,
  relativeDayLabel,
  formatTime,
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

export interface ReaderSettingsState {
  notifyEmail: string | null;
  bufferMin: number;
  dailyCap: number | null;
  /** รับนัดล่วงหน้าอย่างน้อยกี่นาที (migrations/0030) — เซิร์ฟเวอร์ส่งค่าเริ่มต้นมาให้เสมอ */
  leadMin?: number;
  blockedDates: string[];
  priceThb?: number;
}

/**
 * ✦ ตั้งค่าการรับนัด — แจ้งเตือนทางอีเมล · เวลาพัก · เพดานนัดต่อวัน · วันหยุดรายวัน
 * วันหยุด: แตะวันในอีก 14 วันข้างหน้าเพื่อปิดทั้งวัน (ทับตารางประจำสัปดาห์) ·
 * วันที่มีนัดจ่ายแล้วจะเตือนให้เห็น — ปิดวันไม่ยกเลิกนัดเดิมให้เอง (ต้องกดยกเลิกในรายการนัดซึ่งคืนเงินลูกค้า)
 */
export function ReaderBookingSettings({
  settings,
  bookedDates,
  nowMs,
  authHeaders,
  onSaved,
}: {
  settings: ReaderSettingsState;
  /** วันที่ (YYYY-MM-DD) ที่มีนัดจ่ายแล้ว → จำนวนนัด */
  bookedDates: Record<string, number>;
  nowMs: number;
  authHeaders: () => HeadersInit;
  onSaved: (message: string) => void;
}) {
  const [email, setEmail] = useState(settings.notifyEmail ?? "");
  const [bufferMin, setBufferMin] = useState(settings.bufferMin);
  const [dailyCap, setDailyCap] = useState<number | null>(settings.dailyCap);
  const [leadMin, setLeadMin] = useState<number>(settings.leadMin ?? DEFAULT_LEAD_MIN);
  const [blocked, setBlocked] = useState<Set<string>>(new Set(settings.blockedDates));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const days = useMemo(() => {
    const first = bkkDayStart(nowMs);
    return Array.from({ length: BOOKING_HORIZON_DAYS }, (_, i) => {
      const ms = first + i * 86_400_000 + 12 * 3_600_000; // เที่ยงวัน กันปัดข้ามวัน
      return { key: bkkDateKey(ms), chip: dayChipParts(ms) };
    });
  }, [nowMs]);

  const toggle = (key: string) =>
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/console/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ notifyEmail: email.trim() || null, bufferMin, dailyCap, leadMin, blockedDates: [...blocked] }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error || "บันทึกไม่สำเร็จ");
      else onSaved("บันทึกการตั้งค่าการรับนัดแล้ว ลูกค้าเห็นเวลาว่างใหม่ทันที");
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    }
    setSaving(false);
  };

  const selectClass =
    "min-h-[40px] rounded-lg border border-line-warm bg-surface px-2 font-serif-th text-sm text-ink-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink";

  return (
    <section aria-labelledby="settings-heading" className="altar-card-porcelain !rounded-3xl space-y-5 p-5 sm:p-6">
      <div>
        <h2 id="settings-heading" className="font-serif-th text-lg font-bold text-ink">ตั้งค่าการรับนัด</h2>
        {settings.priceThb && (
          <p className="mt-0.5 font-serif-th text-xs text-muted">
            ค่าปรึกษาของคุณ {settings.priceThb} บาทต่อครั้ง (ทีมงานเป็นผู้ตั้ง ติดต่อทีมงานเพื่อปรับราคา)
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1.5 sm:col-span-3">
          <span className="block font-serif-th text-[13px] font-bold text-ink-deep">อีเมลรับแจ้งเตือนนัดใหม่ / ยกเลิก</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="เช่น mor.ploy@gmail.com (เว้นว่าง = ไม่รับอีเมล)"
            autoComplete="email"
            className="glass-field min-h-[44px] w-full rounded-xl border border-line-interactive-warm px-3.5 font-serif-th text-sm text-ink outline-none focus:border-gold-ink"
          />
        </label>
        <label className="space-y-1.5">
          <span className="block font-serif-th text-[13px] font-bold text-ink-deep">รับนัดล่วงหน้าอย่างน้อย</span>
          <select value={leadMin} onChange={(e) => setLeadMin(Number(e.target.value))} className={`${selectClass} w-full`}>
            {LEAD_OPTIONS_MIN.map((m) => (
              <option key={m} value={m}>
                {formatLeadLabel(m)}
                {m === DEFAULT_LEAD_MIN ? " (ค่าเริ่มต้น)" : ""}
              </option>
            ))}
          </select>
          <span className="block font-serif-th text-[12px] leading-relaxed text-muted">
            ลูกค้าจองเวลาที่ใกล้กว่านี้ไม่ได้ — ตั้งสั้นลงถ้าอยากรับลูกค้าที่ทักมาแล้วอยากคุยเร็ว ๆ
          </span>
        </label>
        <label className="space-y-1.5">
          <span className="block font-serif-th text-[13px] font-bold text-ink-deep">พักระหว่างนัด</span>
          <select value={bufferMin} onChange={(e) => setBufferMin(Number(e.target.value))} className={`${selectClass} w-full`}>
            {BUFFER_OPTIONS.map((m) => (
              <option key={m} value={m}>
                {m === 0 ? "ไม่ต้องพัก (นัดติดกันได้)" : `พัก ${m} นาทีหลังแต่ละนัด`}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="block font-serif-th text-[13px] font-bold text-ink-deep">รับนัดไม่เกินวันละ</span>
          <select
            value={dailyCap ?? 0}
            onChange={(e) => setDailyCap(Number(e.target.value) || null)}
            className={`${selectClass} w-full`}
          >
            <option value={0}>ไม่จำกัด</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} นัด
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="font-serif-th text-[13px] font-bold text-ink-deep">วันหยุด (แตะเพื่อปิดรับนัดทั้งวัน)</legend>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {days.map(({ key, chip }) => {
            const off = blocked.has(key);
            const booked = bookedDates[key] ?? 0;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={off}
                onClick={() => toggle(key)}
                className={`relative flex min-h-[64px] flex-col items-center justify-center rounded-2xl border px-1 py-2 font-serif-th transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                  off ? "border-err/40 bg-err-wash text-err" : "border-line-warm bg-surface text-ink-deep hover:border-gold-ink/60"
                }`}
              >
                <span className="text-[11px]">{chip.weekday}</span>
                <span className={`text-lg font-bold leading-tight ${off ? "line-through" : ""}`}>{chip.day}</span>
                <span className="text-[11px]">{off ? "หยุด" : chip.month}</span>
                {booked > 0 && (
                  <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-gold-ink px-1 text-[11px] font-bold text-surface">
                    {booked}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {[...blocked].some((d) => (bookedDates[d] ?? 0) > 0) && (
          <p className="rounded-xl border border-gold-ink/30 bg-inset-warm p-3 font-serif-th text-[13px] text-ink">
            วันที่ปิดบางวันมีนัดที่ลูกค้าจ่ายแล้ว (ตัวเลขบนวัน) — การปิดวันไม่ยกเลิกนัดเดิมให้ ถ้าไม่สะดวกจริง กด
            &quot;ยกเลิก (คืนเงินเต็ม)&quot; ที่นัดนั้นในรายการด้านบน
          </p>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 font-serif-th text-[13px] text-err">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="btn-gold-glass min-h-[44px] px-6 font-serif-th text-sm font-bold cursor-pointer disabled:opacity-50"
        >
          {saving ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
        </button>
      </div>
    </section>
  );
}

/**
 * ✦ ส่งลิงก์ให้ลูกค้า — บอกแม่หมอก่อนส่งว่าลูกค้าที่เปิดลิงก์ "ตอนนี้" จะเจออะไร (CONSULT_FLOW_UX_PLAN ข้อ 2.1 · P3)
 * ---------------------------------------------------------------------------
 * ที่มา: แม่หมอส่งลิงก์ทาง LINE แล้วบอกลูกค้า "เลือกเวลาแล้วเข้าได้เลย" ทั้งที่ปิดคิวสดอยู่
 * ลูกค้าเลยเจอแค่เวลานัดอีกหลายชั่วโมง ("เข้าไม่ได้ · มันเลือกเวลาอื่น") — การ์ดนี้ทำให้เห็นก่อนกดส่ง
 */
export function ShareBookingLinkCard({
  bookingUrl,
  readerName,
  isLiveOpen,
  nextSlot,
  nowMs,
  toggling,
  onOpenLive,
}: {
  bookingUrl: string;
  readerName: string;
  isLiveOpen: boolean;
  /** เวลาว่างใกล้สุดที่ลูกค้าจองได้ตอนนี้ (null = ไม่มีใน 14 วัน) */
  nextSlot: number | null;
  nowMs: number;
  toggling: boolean;
  onOpenLive: () => void;
}) {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");
  const message = `จองคิวดูดวงกับ ${readerName} ได้ที่ลิงก์นี้เลยค่ะ ${bookingUrl}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    setTimeout(() => setCopied("idle"), 2500);
  };
  const nextLabel = nextSlot ? `${relativeDayLabel(nextSlot, nowMs)} ${formatTime(nextSlot)} น.` : null;

  return (
    <section aria-labelledby="share-link-heading" className="altar-card-porcelain !rounded-3xl space-y-4 p-5 sm:p-6">
      <div className="space-y-1">
        <h2 id="share-link-heading" className="font-serif-th text-lg font-bold text-ink">
          <ThaiPhrases>ส่งลิงก์ให้ลูกค้า</ThaiPhrases>
        </h2>
        <p className="font-serif-th text-[13px] text-muted">ลูกค้าเปิดลิงก์นี้แล้วจอง จ่ายเงิน และเข้าห้องคุยกับคุณได้เองครบในที่เดียว</p>
      </div>

      <div
        role="status"
        className={`rounded-2xl border p-4 font-serif-th text-[13px] leading-relaxed ${
          isLiveOpen ? "border-ok/30 bg-ok/10" : nextLabel ? "border-gold-ink/30 bg-inset-warm" : "border-err/30 bg-err-wash"
        }`}
      >
        <p className="font-bold text-ink-deep">ลูกค้าที่เปิดลิงก์ตอนนี้จะ…</p>
        {isLiveOpen ? (
          <p className="text-ink">กด &quot;คุยตอนนี้&quot; จ่ายเงิน แล้วเข้าคิวได้ทันที — กด &quot;เรียกคิวนี้&quot; ในรายการด้านล่างเมื่อพร้อมคุย</p>
        ) : nextLabel ? (
          <>
            <p className="text-ink">
              จองได้แค่เวลานัด เร็วสุด <strong className="font-bold">{nextLabel}</strong> — ยังคุยทันทีไม่ได้
            </p>
            <p className="mt-1 text-muted">ถ้าจะคุยกับลูกค้าตอนนี้ เปิดรับคิวสดก่อนส่งลิงก์</p>
          </>
        ) : (
          <>
            <p className="text-err font-semibold">จองไม่ได้เลย — ยังไม่เปิดคิวสดและไม่มีเวลาว่างใน 14 วัน</p>
            <p className="mt-1 text-muted">เปิดรับคิวสด หรือตั้งตารางรับนัดด้านล่างก่อนส่งลิงก์</p>
          </>
        )}
        {!isLiveOpen && (
          <button
            type="button"
            disabled={toggling}
            onClick={onOpenLive}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-full bg-ok px-5 text-sm font-bold text-white transition-opacity cursor-pointer hover:opacity-90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
          >
            {toggling ? "กำลังเปิด…" : "เปิดรับคิวสดตอนนี้"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={bookingUrl}
          aria-label="ลิงก์หน้าจองของคุณ"
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-line-interactive-warm bg-surface px-3 font-mono text-[12px] text-ink-deep"
        />
        <button
          type="button"
          onClick={() => void copy()}
          className="min-h-[46px] shrink-0 rounded-full border border-line-interactive-warm bg-surface px-5 font-serif-th text-sm font-semibold text-ink-deep transition-colors cursor-pointer hover:border-gold-ink"
        >
          <span aria-live="polite">{copied === "ok" ? "คัดลอกแล้ว ✓" : copied === "fail" ? "กดค้างที่ลิงก์เพื่อคัดลอก" : "คัดลอกลิงก์"}</span>
        </button>
        <a
          href={`https://line.me/R/msg/text/?${encodeURIComponent(message)}`}
          target="_blank"
          rel="noopener noreferrer"
          /* เขียวโทเคน ok (#3A7044 · ตัวขาว 5.9:1) — เขียว LINE สด #06C755 กับตัวขาวได้แค่ 2.26:1 (ดู globals.css .social-fab) */
          className="inline-flex min-h-[46px] shrink-0 items-center justify-center rounded-full bg-ok px-5 font-serif-th text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          ส่งทาง LINE
        </a>
      </div>
    </section>
  );
}
