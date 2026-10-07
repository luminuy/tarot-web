"use client";

import React, { useState } from "react";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { SlotPicker } from "@/components/marketplace/SlotPicker";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import { FREE_CANCEL_HOURS, MAX_RESCHEDULES, formatSlotRange } from "@/lib/marketplace/booking-policy";

export type BookingMode = "walkup" | "booking";

interface BookQueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  readerId: string;
  readerName: string;
  readerAvatarUrl?: string | null;
  isLiveOpen: boolean;
  /** แม่หมอเปิดตารางรับนัดไว้ (มีเวลาว่างอย่างน้อยหนึ่งช่องตอนโหลดหน้า) */
  hasSchedule: boolean;
  /** เปิดหน้าต่างมาที่ทางเลือกไหน (ปุ่มบนการ์ดจองบอกมาแล้ว) */
  initialMode?: BookingMode;
  initialQuestion?: string;
  readingSnapshot?: string;
  /** ค่าปรึกษาของแม่หมอคนนี้ (แสดงผลเท่านั้น — ยอดที่เรียกเก็บจริงเซิร์ฟเวอร์คิดเอง) */
  priceThb: number;
}

const QUESTION_MAX = 1000;

/**
 * ✦ จองและชำระเงิน — "จ่ายก่อน แล้วค่อยคุย" ในขั้นตอนที่สั้นที่สุด (เจ้าของสั่ง 2026-10-03)
 * ---------------------------------------------------------------------------
 *   ① เลือกเวลา ➔ ② ข้อมูลของคุณ ➔ ③ ชำระเงิน (หน้า Stripe) ➔ ได้คิว/นัด ➔ คุยกับแม่หมอ
 *
 * แบบหน้าชำระเงินของเว็บระดับโลก:
 * - แถบขั้นตอนบนสุด — รู้เสมอว่าอยู่ตรงไหน เหลืออีกกี่ขั้น และขั้นสุดท้ายคือ "ชำระเงิน"
 * - แถบล่างติดหน้าต่าง: สรุป (เวลา · ยอด) + ปุ่มหลักปุ่มเดียว — ไม่ต้องเลื่อนหาปุ่มบนมือถือ
 * - ทางเลือกเดียว (เช่น คิวสดอย่างเดียว / กด "คุยตอนนี้" มา) ➔ ข้ามขั้นเลือกเวลา
 * - เงื่อนไขยกเลิกสรุปบรรทัดเดียว กดดูรายละเอียดได้ (ตัวเลขชุดเดียวกับที่ระบบบังคับจริง)
 * - เวลาเพิ่งถูกจองไปตอนกดจ่าย ➔ กลับขั้นเลือกเวลา พร้อมเวลาว่างล่าสุด ข้อมูลที่กรอกยังอยู่
 */
export const BookQueueModal: React.FC<BookQueueModalProps> = ({
  isOpen,
  onClose,
  readerId,
  readerName,
  readerAvatarUrl,
  isLiveOpen,
  hasSchedule,
  initialMode,
  initialQuestion = "",
  readingSnapshot,
  priceThb,
}) => {
  const bothModes = isLiveOpen && hasSchedule;
  const [mode, setMode] = useState<BookingMode>(initialMode ?? (isLiveOpen ? "walkup" : "booking"));
  const hasWhenStep = hasSchedule;
  const [step, setStep] = useState<"when" | "details">(!hasWhenStep || initialMode === "walkup" ? "details" : "when");
  const [slot, setSlot] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState(initialQuestion);
  const [consent, setConsent] = useState(false);
  // ม.26: ยินยอมเรื่องข้อมูลอ่อนไหวเป็นช่องแยก ไม่บังคับ และไม่ติ๊กไว้ก่อน (ม.19 ห้ามรวบกับการยอมรับเงื่อนไข)
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const timeChosen = mode === "walkup" ? isLiveOpen : slot !== null;
  const detailsReady = consent && nickname.trim().length > 0 && question.trim().length >= 3;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!consent) {
      setError("กรุณาติ๊กยินยอมก่อนชำระเงิน");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // ตัวตนลูกค้า (customerRef) เซิร์ฟเวอร์ออกให้เองผ่านคุกกี้ HttpOnly — ไคลเอนต์ไม่ต้องรู้ค่า (A2-13)
      // ราคาไม่ถูกส่งจากที่นี่โดยตั้งใจ — เซิร์ฟเวอร์คิดเอง
      const res = await fetch("/api/marketplace/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerId,
          kind: mode,
          slotStart: mode === "booking" ? slot : undefined,
          nickname: nickname.trim(),
          question: question.trim(),
          readingSnapshot: readingSnapshot || undefined,
          consent: true,
          sensitiveConsent,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        redirectUrl?: string;
        checkoutUrl?: string;
      };
      if (!res.ok) {
        if (data.code === "slot_unavailable" && hasWhenStep) {
          setSlot(null);
          setRefreshKey((k) => k + 1);
          setStep("when");
        }
        setError(data.error || "จองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        setSubmitting(false);
        return;
      }

      // หน้าจ่ายเงินของ Stripe อยู่นอกเว็บเรา ➔ เปลี่ยนหน้าทั้งแท็บ (ไม่ใช่ router.push)
      const next = data.checkoutUrl || data.redirectUrl;
      if (next) window.location.assign(next);
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
      setSubmitting(false);
    }
  };

  const whenLabel =
    mode === "walkup" ? "คิวสด · คุยทันทีที่ถึงคิว" : slot ? formatSlotRange(slot) : "ยังไม่ได้เลือกเวลา";

  /* ── แถบขั้นตอน ─────────────────────────────────────────────────────────── */
  const steps = [...(hasWhenStep ? ["เลือกเวลา"] : []), "กรอกข้อมูล", "ชำระเงิน"];
  const current = submitting ? steps.length - 1 : step === "when" ? 0 : hasWhenStep ? 1 : 0;
  const stepper = (
    <ol className="mt-3 flex items-center gap-2" aria-label="ขั้นตอนการจอง">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span
              aria-hidden="true"
              className={`h-1 rounded-full ${done || active ? "bg-gold-ink" : "bg-line-warm"}`}
            />
            <span className={`text-[12px] leading-tight ${active ? "font-bold text-ink-deep" : "text-muted"}`}>
              {i + 1}. {label}
              {done && <span className="sr-only"> (เสร็จแล้ว)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );

  /* ── แถบล่างติดหน้าต่าง: สรุป + ปุ่มหลัก ─────────────────────────────────── */
  const footer = (
    <div className="space-y-2.5 font-serif-th">
      <div className="flex items-end justify-between gap-3">
        <p className="min-w-0 text-[13px] leading-snug text-ink">
          <span className="block text-muted">{mode === "walkup" ? "รูปแบบ" : "เวลานัด"}</span>
          <strong className="font-bold text-ink-deep">{whenLabel}</strong>
        </p>
        <p className="shrink-0 text-right leading-none">
          <span className="text-xl font-bold text-ink-deep">{priceThb}</span>
          <span className="ml-1 text-sm font-semibold text-ink-deep">บาท</span>
        </p>
      </div>
      {step === "when" ? (
        <button
          type="button"
          disabled={!timeChosen}
          onClick={() => {
            setError(null);
            setStep("details");
          }}
          className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
        >
          {timeChosen ? "ถัดไป" : "เลือกเวลาก่อน"} {timeChosen && <span aria-hidden="true">→</span>}
        </button>
      ) : (
        <button
          type="submit"
          form="booking-form"
          disabled={submitting || !detailsReady || !timeChosen}
          className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
        >
          <LockIcon />
          {submitting ? "กำลังไปหน้าชำระเงิน…" : `ชำระเงิน ${priceThb} บาท`}
        </button>
      )}
      <p className="text-center text-[12px] leading-relaxed text-muted">
        {step === "when"
          ? "ชำระเงินก่อนคุยกับแม่หมอ · ขั้นนี้ยังไม่ตัดเงิน"
          : "ชำระผ่าน Stripe อย่างปลอดภัย · บัตรหรือพร้อมเพย์"}
      </p>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={step === "when" ? "เลือกเวลาปรึกษา" : "ข้อมูลของคุณ"}
      description={stepper}
      footer={footer}
    >
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-err/30 bg-err-wash p-3 text-[13px] text-err font-serif-th">
          {error}
        </div>
      )}

      {step === "when" ? (
        <div className="space-y-5 font-serif-th">
          {bothModes && (
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="รูปแบบการปรึกษา">
              {(
                [
                  { value: "walkup", title: "คุยตอนนี้", body: "เข้าคิวสด แม่หมอเปิดรับอยู่", live: true },
                  { value: "booking", title: "นัดเวลาล่วงหน้า", body: "เลือกวันและเวลาที่สะดวก", live: false },
                ] as const
              ).map((opt) => {
                const active = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(opt.value)}
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
                      active ? "border-gold-ink bg-inset-warm ring-1 ring-gold-ink" : "border-line-warm bg-surface hover:border-gold-ink/60"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                        active ? "border-gold-ink" : "border-line-interactive-warm"
                      }`}
                    >
                      {active && <span className="h-2.5 w-2.5 rounded-full bg-gold-ink" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-ink-deep">
                        {opt.title}
                        {opt.live && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-ok animate-pulse" />}
                      </span>
                      <span className="block text-[13px] text-muted">{opt.body}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {mode === "booking" ? (
            <SlotPicker readerId={readerId} value={slot} onChange={setSlot} refreshKey={refreshKey} showWaitlist />
          ) : (
            <p className="rounded-2xl bg-inset-warm/70 p-4 text-[13px] leading-relaxed text-ink">
              ชำระเงินแล้วเข้าคิวทันที เปิดหน้าคิวทิ้งไว้ได้เลย ถึงตาคุณแล้วปุ่มเข้าห้องวิดีโอคอลจะขึ้นเอง
            </p>
          )}
        </div>
      ) : (
        <form id="booking-form" onSubmit={handleSubmit} className="space-y-5 font-serif-th">
          {/* ใครกับใคร — ภาพแม่หมอ + ปุ่มเปลี่ยนเวลา (เวลา/ยอดอยู่แถบล่างแล้ว ไม่พิมพ์ซ้ำ) */}
          <div className="flex items-center gap-3.5 rounded-2xl border border-line-warm bg-inset-warm/70 p-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas text-lg font-bold text-gold-ink ring-2 ring-surface">
              {readerAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={readerAvatarUrl} alt="" /* ชื่อแม่หมออยู่ข้าง ๆ แล้ว (INC-0125) */ className="h-full w-full object-cover" />
              ) : (
                readerName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="break-words text-sm font-bold text-ink-deep">{readerName}</p>
              <p className="text-[13px] text-muted">ตัวต่อตัว {CONSULTATION_MINUTES} นาที · วิดีโอคอลหรือ LINE</p>
            </div>
            {hasWhenStep && (
              <button
                type="button"
                onClick={() => setStep("when")}
                className="tap-overlay-y shrink-0 text-[13px] font-semibold text-gold-ink underline underline-offset-2 cursor-pointer"
              >
                เปลี่ยนเวลา
              </button>
            )}
          </div>

          <Field label="ชื่อเล่นของคุณ" hint="แม่หมอจะเรียกคุณด้วยชื่อนี้">
            {(field) => (
              <Input
                {...field}
                required
                autoComplete="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="เช่น บีม, พลอย, บอส"
                maxLength={40}
              />
            )}
          </Field>

          <div className="space-y-1">
            <Field label="อยากปรึกษาเรื่องอะไร" hint="เล่าสั้น ๆ ก็พอ AI จะสรุปให้แม่หมออ่านก่อนเริ่มคุย">
              {(field) => (
                <Textarea
                  {...field}
                  required
                  rows={3}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="เช่น ความสัมพันธ์กับแฟนช่วงนี้ไม่ค่อยดี อยากรู้ว่าควรไปต่อหรือพอแค่นี้"
                  maxLength={QUESTION_MAX}
                />
              )}
            </Field>
            <p className="text-right font-mono text-[11px] text-muted" aria-hidden="true">
              {question.length}/{QUESTION_MAX}
            </p>
          </div>

          {/* เงื่อนไขยกเลิก — สรุปบรรทัดเดียว กดดูเต็มได้ (ตัวเลขชุดเดียวกับที่ระบบบังคับ) */}
          <details className="group rounded-xl border border-line-warm text-[13px] leading-relaxed">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3.5">
              <span className="text-ink">
                <strong className="font-bold text-ink-deep">
                  {mode === "booking" ? `ยกเลิกฟรีก่อนนัด ${FREE_CANCEL_HOURS} ชม.` : "ยกเลิกได้ตลอดระหว่างรอคิว"}
                </strong>{" "}
                · คืนเงินเต็มจำนวน
              </span>
              <span className="shrink-0 font-semibold text-gold-ink group-open:hidden">ดูเงื่อนไข</span>
              <span className="hidden shrink-0 font-semibold text-gold-ink group-open:inline">ซ่อน</span>
            </summary>
            <ul className="space-y-1 border-t border-line-warm px-3.5 pb-3.5 pt-3 text-ink">
              {(mode === "booking"
                ? [
                    `ยกเลิกหรือเลื่อนนัดก่อนเวลานัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็ม (เลื่อนได้ ${MAX_RESCHEDULES} ครั้ง)`,
                    `ยกเลิกน้อยกว่า ${FREE_CANCEL_HOURS} ชม. ก่อนนัด ไม่คืนเงิน`,
                    "แม่หมอยกเลิก หรือไม่มาตามนัด คืนเงินเต็มอัตโนมัติ",
                  ]
                : ["ยกเลิกได้ตลอดระหว่างรอคิว คืนเงินเต็ม", "แม่หมอปิดคิวก่อนถึงตาคุณ คืนเงินเต็มอัตโนมัติ"]
              ).map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-ink" />
                  {line}
                </li>
              ))}
            </ul>
          </details>

          <label className="flex cursor-pointer select-none items-start gap-3 text-[13px] leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-interactive-warm accent-gold-ink"
            />
            <span>
              รับทราบว่าชื่อเล่นและคำถามจะส่งให้แม่หมอที่เลือกเพื่อดูดวงให้ฉัน และยอมรับเงื่อนไขการยกเลิกและคืนเงิน{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline underline-offset-2">
                (นโยบายความเป็นส่วนตัว)
              </Link>
            </span>
          </label>

          <label className="flex cursor-pointer select-none items-start gap-3 text-[13px] leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={sensitiveConsent}
              onChange={(e) => setSensitiveConsent(e.target.checked)}
              className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-interactive-warm accent-gold-ink"
            />
            <span>
              ไม่บังคับ: คำถามของฉันมีเรื่องสุขภาพ เพศวิถี หรือความเชื่อทางศาสนา และฉันยินยอมโดยชัดแจ้งให้แม่หมอที่เลือกใช้ข้อมูลนี้เพื่อดูดวงให้ฉันเท่านั้น
              ถ้าไม่ติ๊ก โปรดอย่าใส่เรื่องเหล่านี้ในคำถาม
            </span>
          </label>
        </form>
      )}
    </Modal>
  );
};

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
