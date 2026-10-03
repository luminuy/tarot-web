"use client";

import { useState } from "react";
import { SlotPicker } from "@/components/marketplace/SlotPicker";
import {
  buildIcs,
  CHECKOUT_EXPIRES_MINUTES,
  HOLD_MINUTES,
  dayChipParts,
  formatCountdown,
  formatSlotRange,
  formatTime,
  FREE_CANCEL_HOURS,
  googleCalendarUrl,
  MAX_RESCHEDULES,
} from "@/lib/marketplace/booking-policy";

/** ภาพรวมการจองที่ `GET /api/marketplace/tickets/[id]` ส่งมา (เฉพาะเจ้าของตั๋ว) */
export interface BookingView {
  id: string;
  kind: "scheduled" | "walkup";
  status: string;
  slotStart: number | null;
  slotEnd: number | null;
  holdExpiresAt: number | null;
  rescheduleCount: number;
  cancelledBy: string | null;
  refundStatus: "refunded" | "none" | "failed" | null;
  paid: boolean;
  amountSatang: number | null;
  cancel: { allowed: boolean; refund: boolean; reason: string };
  canReschedule: boolean;
  /** คะแนนที่ให้ไว้แล้ว (null = ยังไม่รีวิว) */
  reviewRating?: number | null;
  /** รีวิวได้ (คุยจบแล้ว · จ่ายแล้ว · ยังไม่เคยรีวิว) */
  canReview?: boolean;
}

/**
 * ✦ รอชำระเงิน — กันเวลาไว้ให้แล้ว เหลือจ่ายอย่างเดียว (ลูกค้ากดย้อนกลับจากหน้า Stripe / ปิดหน้าไปก่อน)
 */
export function PaymentPendingPanel({
  ticketId,
  booking,
  nowMs,
  confirming,
  priceThb,
}: {
  ticketId: string;
  booking: BookingView;
  nowMs: number;
  confirming: boolean;
  priceThb: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ที่นั่งถูกกันยาวกว่าอายุหน้าจ่ายเงิน 5 นาที (เผื่อ webhook มาช้า) — บอกลูกค้าตามอายุหน้าจ่ายเงินจริง
  const payDeadline = booking.holdExpiresAt ? booking.holdExpiresAt - (HOLD_MINUTES - CHECKOUT_EXPIRES_MINUTES) * 60000 : null;
  const minutesLeft = payDeadline ? Math.max(0, Math.floor((payDeadline - nowMs) / 60000)) : null;

  const resume = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/marketplace/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (res.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      setError(data.error || "เปิดหน้าชำระเงินไม่สำเร็จ กรุณาลองใหม่");
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
    }
    setBusy(false);
  };

  if (confirming) {
    return (
      <div className="space-y-3 py-6 text-center" role="status">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-gold-ink border-t-transparent" />
        <h3 className="text-lg font-bold text-ink">กำลังยืนยันการชำระเงิน…</h3>
        <p className="text-sm text-muted">ใช้เวลาไม่กี่วินาที ไม่ต้องกดจ่ายซ้ำ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gold-ink/30 bg-inset-warm p-4">
        <p className="text-[13px] font-semibold text-gold-ink">รอชำระเงิน</p>
        <h3 className="mt-0.5 text-lg font-bold text-ink-deep">
          {booking.kind === "scheduled" && booking.slotStart ? formatSlotRange(booking.slotStart, true) : "คิวสด · คุยทันทีที่ถึงคิว"}
        </h3>
        <p className="mt-2 flex items-start gap-2 rounded-xl bg-surface/70 p-2.5 text-[13px] leading-relaxed text-ink">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" aria-hidden="true">
            <rect x="4" y="11" width="16" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          ห้องคุยกับแม่หมอจะเปิดหลังชำระเงินเท่านั้น
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink">
          {minutesLeft !== null && minutesLeft > 0
            ? `ระบบกันเวลานี้ไว้ให้อีก ${minutesLeft} นาที ชำระเงินให้เสร็จเพื่อยืนยัน`
            : "เวลาที่กันไว้ใกล้หมดแล้ว ชำระเงินตอนนี้ หรือจองเวลาใหม่"}
        </p>
      </div>
      {error && (
        <p role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 text-[13px] text-err">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={resume}
        disabled={busy}
        className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer disabled:opacity-50"
      >
        {busy ? "กำลังไปหน้าชำระเงิน…" : `ชำระเงิน ${priceThb} บาท`}
      </button>
      <p className="text-center text-[12px] text-muted">
        จ่ายผ่าน PromptPay แล้ว? ธนาคารอาจใช้เวลายืนยันสักครู่ หน้านี้จะอัปเดตเองอัตโนมัติ
      </p>
    </div>
  );
}

/**
 * ✦ นัดยืนยันแล้ว — การ์ดวันเวลาใหญ่ · นับถอยหลัง · เพิ่มลงปฏิทิน (แบบหน้ายืนยันของ Airbnb/Calendly)
 */
export function BookingConfirmedPanel({
  booking,
  readerName,
  ticketId,
  nowMs,
}: {
  booking: BookingView;
  readerName: string;
  ticketId: string;
  nowMs: number;
}) {
  if (!booking.slotStart) return null;
  const chip = dayChipParts(booking.slotStart);
  const title = `ปรึกษาดวงกับ ${readerName} · SeerTarot`;
  const pageUrl = typeof window !== "undefined" ? window.location.origin + `/readers/queue/${ticketId}` : "";
  const details = `ถึงเวลาแล้วเปิดลิงก์นี้ในเครื่องที่ใช้จอง แล้วกดเข้าห้องวิดีโอคอล: ${pageUrl}`;

  const downloadIcs = () => {
    const ics = buildIcs({ uid: booking.id, slotStart: booking.slotStart as number, title, details, url: pageUrl });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "seertarot-booking.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-ok/30 bg-ok/10 p-4" role="status">
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ok font-bold text-white">
          ✓
        </span>
        <div className="space-y-0.5">
          <h3 className="text-lg font-bold text-ink">นัดของคุณยืนยันแล้ว</h3>
          <p className="text-sm leading-relaxed text-ink">
            ถึงเวลานัด เปิดหน้านี้ไว้ ปุ่มเข้าห้องวิดีโอคอลจะขึ้นทันทีที่แม่หมอเริ่ม
          </p>
        </div>
      </div>

      <div className="flex items-stretch overflow-hidden rounded-2xl border border-line-warm bg-surface">
        <div className="consult-stage flex w-24 shrink-0 flex-col items-center justify-center !rounded-none !border-0 !shadow-none py-4 text-center">
          <span className="text-[13px] text-gold-on-dark">{chip.weekday}</span>
          <span className="text-4xl font-bold leading-none text-surface">{chip.day}</span>
          <span className="mt-1 text-[13px] text-gold-on-dark">{chip.month}</span>
        </div>
        <div className="min-w-0 flex-1 space-y-1 p-4">
          <p className="text-2xl font-bold tabular-nums text-ink-deep">
            {formatTime(booking.slotStart)}–{formatTime(booking.slotStart + 30 * 60000)} น.
          </p>
          <p className="text-sm text-muted">เวลาประเทศไทย · ตัวต่อตัว 30 นาที</p>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-inset-warm px-2.5 py-0.5 text-[13px] font-semibold text-gold-ink">
            {formatCountdown(booking.slotStart, nowMs)}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <a
          href={googleCalendarUrl({ slotStart: booking.slotStart, title, details, location: pageUrl })}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-line-interactive-warm bg-surface px-4 text-sm font-semibold text-ink-deep transition-colors hover:border-gold-ink"
        >
          <CalendarIcon /> เพิ่มใน Google Calendar
        </a>
        <button
          type="button"
          onClick={downloadIcs}
          className="flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-line-interactive-warm bg-surface px-4 text-sm font-semibold text-ink-deep transition-colors cursor-pointer hover:border-gold-ink"
        >
          <CalendarIcon /> Apple / Outlook (.ics)
        </button>
      </div>
      <p className="text-center text-[12px] leading-relaxed text-muted">
        ลิงก์คิวนี้เปิดได้เฉพาะเบราว์เซอร์ที่ใช้จอง — ใช้เครื่องเดิมเข้าห้องตอนถึงเวลานัด
      </p>
    </div>
  );
}

/**
 * ✦ จัดการนัด — เลื่อน (ถ้ายังทำได้) · ยกเลิกพร้อมบอกผลเรื่องเงินก่อนกดยืนยัน
 */
export function ManageBooking({
  ticketId,
  readerId,
  booking,
  onChanged,
}: {
  ticketId: string;
  readerId: string;
  booking: BookingView;
  onChanged: (message: string) => void;
}) {
  const [panel, setPanel] = useState<"none" | "reschedule" | "cancel">("none");
  const [slot, setSlot] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const scheduled = booking.kind === "scheduled";
  const cancelConsequence = !booking.paid
    ? "ยังไม่มีการตัดเงิน ยกเลิกได้ทันที"
    : booking.cancel.refund
      ? "คืนเงินเต็มจำนวนเข้าช่องทางที่ชำระ ภายใน 5–10 วันทำการ"
      : `ยกเลิกน้อยกว่า ${FREE_CANCEL_HOURS} ชม. ก่อนนัด จะไม่ได้รับเงินคืน`;

  const doReschedule = async () => {
    if (!slot) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotStart: slot }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "เลื่อนนัดไม่สำเร็จ");
        setSlot(null);
        setRefreshKey((k) => k + 1);
      } else {
        setPanel("none");
        onChanged(`เลื่อนนัดเป็น ${formatSlotRange(slot)} แล้ว`);
      }
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    }
    setBusy(false);
  };

  const doCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}`, { method: "DELETE" });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error || "ยกเลิกไม่สำเร็จ");
      } else {
        setPanel("none");
        onChanged(data.message || "ยกเลิกแล้ว");
      }
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    }
    setBusy(false);
  };

  if (!booking.cancel.allowed && !booking.canReschedule) return null;

  return (
    <section aria-labelledby="manage-heading" className="altar-card-porcelain !rounded-3xl space-y-3 p-5 sm:p-6">
      <h2 id="manage-heading" className="font-bold text-ink">
        {scheduled ? "จัดการนัด" : booking.paid ? "จัดการคิว" : "จัดการการจอง"}
      </h2>

      {error && (
        <p role="alert" className="rounded-xl border border-err/30 bg-err-wash p-3 text-[13px] text-err">
          {error}
        </p>
      )}

      {panel === "none" && (
        <div className="divide-y divide-line-warm/70 rounded-2xl border border-line-warm">
          {scheduled && booking.paid && (
            <button
              type="button"
              disabled={!booking.canReschedule}
              onClick={() => setPanel("reschedule")}
              className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                <span className="block text-sm font-bold text-ink-deep">เลื่อนนัด</span>
                <span className="block text-[13px] text-muted">
                  {booking.canReschedule
                    ? `เลื่อนได้ ${MAX_RESCHEDULES} ครั้ง ก่อนนัด ${FREE_CANCEL_HOURS} ชม. ไม่มีค่าใช้จ่าย`
                    : booking.rescheduleCount >= MAX_RESCHEDULES
                      ? "ใช้สิทธิ์เลื่อนนัดครบแล้ว"
                      : `เลื่อนได้เฉพาะก่อนนัด ${FREE_CANCEL_HOURS} ชม.`}
                </span>
              </span>
              <span aria-hidden="true" className="text-muted">›</span>
            </button>
          )}
          {booking.cancel.allowed && (
            <button
              type="button"
              onClick={() => setPanel("cancel")}
              className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
            >
              <span>
                <span className="block text-sm font-bold text-err">{scheduled ? "ยกเลิกนัด" : "ยกเลิกคิว"}</span>
                <span className="block text-[13px] text-muted">{cancelConsequence}</span>
              </span>
              <span aria-hidden="true" className="text-muted">›</span>
            </button>
          )}
        </div>
      )}

      {panel === "reschedule" && (
        <div className="space-y-4">
          <SlotPicker
            readerId={readerId}
            value={slot}
            onChange={setSlot}
            excludeSlot={booking.slotStart}
            refreshKey={refreshKey}
          />
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              disabled={!slot || busy}
              onClick={doReschedule}
              className="btn-gold-glass flex min-h-[48px] flex-1 items-center justify-center px-5 text-sm font-bold cursor-pointer disabled:opacity-50"
            >
              {busy ? "กำลังเลื่อนนัด…" : slot ? `ยืนยันเลื่อนเป็น ${formatSlotRange(slot)}` : "เลือกเวลาใหม่"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="min-h-[48px] rounded-full px-5 text-sm font-semibold text-muted cursor-pointer hover:text-ink"
            >
              ไม่เลื่อน
            </button>
          </div>
        </div>
      )}

      {panel === "cancel" && (
        <div className="space-y-3 rounded-2xl border border-err/30 bg-err-wash p-4">
          <p className="text-sm font-bold text-err">{scheduled ? "ยืนยันยกเลิกนัดนี้?" : "ยืนยันยกเลิกคิวนี้?"}</p>
          <p className="text-[13px] leading-relaxed text-ink">{cancelConsequence}</p>
          <div className="flex flex-col gap-2 sm:flex-row-reverse">
            <button
              type="button"
              disabled={busy}
              onClick={doCancel}
              className="flex min-h-[46px] flex-1 items-center justify-center rounded-full bg-err px-5 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
            >
              {busy ? "กำลังยกเลิก…" : scheduled ? "ยกเลิกนัด" : "ยกเลิกคิว"}
            </button>
            <button
              type="button"
              onClick={() => setPanel("none")}
              className="min-h-[46px] rounded-full px-5 text-sm font-semibold text-muted cursor-pointer hover:text-ink"
            >
              ไม่ยกเลิก
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gold-ink" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 10h18" />
    </svg>
  );
}

/**
 * ✦ รีวิวหลังคุยจบ — แตะดาว + เขียนสั้น ๆ (ไม่บังคับ) · ส่งครั้งเดียว
 * รีวิวได้เฉพาะผู้ที่จ่ายเงินและคุยจบจริง (ตรวจที่เซิร์ฟเวอร์) — รีวิวบนหน้าแม่หมอจึงเชื่อถือได้
 */
export function ReviewPanel({
  ticketId,
  readerName,
  existingRating,
}: {
  ticketId: string;
  readerName: string;
  existingRating: number | null;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<number | null>(existingRating);

  if (done) {
    return (
      <p role="status" className="rounded-2xl border border-ok/30 bg-ok/10 p-4 text-center text-sm text-ink">
        <span className="text-gold-ink" aria-hidden="true">{"★".repeat(done)}</span>{" "}
        ขอบคุณสำหรับรีวิว ช่วยให้คนอื่นเลือกแม่หมอได้ง่ายขึ้นมาก
      </p>
    );
  }

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/tickets/${ticketId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setError(data.error || "ส่งรีวิวไม่สำเร็จ");
      else setDone(rating);
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
    }
    setBusy(false);
  };

  const shown = hover || rating;
  const labels = ["", "ไม่พอใจ", "พอใช้", "ดี", "ดีมาก", "ประทับใจมาก"];

  return (
    <div className="space-y-3 rounded-2xl border border-line-warm bg-surface p-4 text-left">
      <p className="text-sm font-bold text-ink-deep">ให้คะแนน {readerName}</p>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="คะแนน 1 ถึง 5 ดาว" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} ดาว`}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHover(n)}
            className={`grid h-11 w-11 place-items-center rounded-full text-3xl leading-none transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
              n <= shown ? "text-gold-ink" : "text-line-warm"
            }`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-[13px] text-muted" aria-live="polite">
          {labels[shown]}
        </span>
      </div>
      <label className="block space-y-1">
        <span className="text-[13px] text-muted">เล่าสั้น ๆ (ไม่บังคับ) · แสดงต่อสาธารณะโดยซ่อนชื่อเล่น</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="เช่น แม่หมออธิบายชัด ใจเย็น ได้แนวทางไปต่อ"
          className="glass-field w-full rounded-xl border border-line-interactive-warm p-3 text-sm text-ink outline-none focus:border-gold-ink"
        />
      </label>
      {error && (
        <p role="alert" className="text-[13px] text-err">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={!rating || busy}
        onClick={submit}
        className="btn-gold-glass flex min-h-[46px] w-full items-center justify-center px-5 text-sm font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "กำลังส่ง…" : "ส่งรีวิว"}
      </button>
    </div>
  );
}
