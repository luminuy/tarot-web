"use client";

import React, { useState } from "react";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { Modal } from "@/components/ui/Modal";
import { Field } from "@/components/ui/Field";
import { Input, Textarea } from "@/components/ui/Input";
import { SlotPicker } from "@/components/marketplace/SlotPicker";
import { CONSULTATION_MINUTES, CONSULTATION_PRICE_THB } from "@/lib/marketplace/offer";
import { CHECKOUT_EXPIRES_MINUTES, FREE_CANCEL_HOURS, formatSlotRange } from "@/lib/marketplace/booking-policy";

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
}

const QUESTION_MAX = 1000;

/**
 * ✦ หน้าต่างจอง + ชำระเงิน — สองขั้นแบบหน้าจองของเว็บระดับโลก (เจ้าของสั่ง 2026-10-03)
 * ---------------------------------------------------------------------------
 * 1. เมื่อไร — คุยตอนนี้ (คิวสด) หรือ เลือกวันและเวลานัด
 * 2. รายละเอียด + ชำระเงิน — สรุปการจองบนสุด · กรอกสองช่อง · นโยบายยกเลิก · ยอดชำระ ➔ หน้าจ่ายเงิน Stripe
 *
 * - ทางเลือกเดียว (เช่น เปิดแค่คิวสด) ➔ ข้ามขั้นที่ 1 ไปเลย ไม่ถามสิ่งที่ผู้ใช้ไม่ต้องตัดสินใจ
 * - นโยบายยกเลิกแสดง "ก่อนจ่าย" ตรงปุ่มจ่าย — ตัวเลขมาจาก booking-policy.ts ชุดเดียวกับที่ระบบบังคับจริง
 * - กดจ่ายแล้วเซิร์ฟเวอร์กันเวลาไว้ให้ระหว่างชำระเงิน · เวลาเพิ่งถูกจองไป ➔ กลับขั้นที่ 1 พร้อมโหลดเวลาว่างใหม่
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
}) => {
  const bothModes = isLiveOpen && hasSchedule;
  const [mode, setMode] = useState<BookingMode>(initialMode ?? (isLiveOpen ? "walkup" : "booking"));
  const [step, setStep] = useState<"when" | "details">(
    // คิวสดอย่างเดียว หรือกด "คุยตอนนี้" มาจากการ์ด ➔ ไม่มีอะไรให้เลือกในขั้นที่ 1
    !hasSchedule || initialMode === "walkup" ? "details" : "when"
  );
  const [slot, setSlot] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState(initialQuestion);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canContinue = mode === "walkup" ? isLiveOpen : slot !== null;
  const hasWhenStep = hasSchedule;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("กรุณากดยินยอมการส่งข้อมูลให้แม่หมอก่อนชำระเงิน");
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
          // เวลาเพิ่งถูกจองไป ➔ กลับไปเลือกใหม่ พร้อมเวลาว่างล่าสุด (ไม่ต้องกรอกใหม่ ข้อมูลยังอยู่)
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
    mode === "walkup" ? "คิวสด · คุยทันทีที่ถึงคิว" : slot ? formatSlotRange(slot, true) : "ยังไม่ได้เลือกเวลา";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="lg"
      title={step === "when" ? "เลือกเวลาปรึกษา" : "ยืนยันและชำระเงิน"}
      description={
        hasWhenStep ? (
          <span>
            ขั้นที่ {step === "when" ? 1 : 2} จาก 2 · {step === "when" ? "เลือกวันและเวลาที่สะดวก" : "กรอกสองช่องแล้วชำระเงิน"}
          </span>
        ) : (
          "กรอกสองช่องแล้วชำระเงิน เข้าคิวได้ทันที"
        )
      }
    >
      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-err/30 bg-err-wash p-3 text-[13px] text-err font-serif-th">
          {error}
        </div>
      )}

      {step === "when" ? (
        <div className="space-y-5 pt-1 font-serif-th">
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

          {mode === "booking" && (
            <SlotPicker readerId={readerId} value={slot} onChange={setSlot} refreshKey={refreshKey} />
          )}

          <div className="space-y-2">
            {mode === "booking" && slot && (
              <p className="text-center text-[13px] text-ink" aria-live="polite">
                เวลาที่เลือก: <strong className="font-bold text-ink-deep">{formatSlotRange(slot)}</strong>
              </p>
            )}
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
            >
              ถัดไป <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 pt-1 font-serif-th">
          {/* สรุปการจอง — ใคร · เมื่อไร · เท่าไร (แบบหัวใบเสร็จของหน้าจองทั่วโลก) */}
          <div className="rounded-2xl border border-line-warm bg-inset-warm/70">
            <div className="flex items-center gap-3.5 p-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas text-lg font-bold text-gold-ink ring-2 ring-surface">
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
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-line-warm/70 px-3.5 py-2.5">
              <p className="min-w-0 text-[13px] text-ink">
                <span className="text-muted">{mode === "walkup" ? "รูปแบบ" : "เวลานัด"} </span>
                <strong className="font-bold text-ink-deep">{whenLabel}</strong>
              </p>
              {hasWhenStep && (
                <button
                  type="button"
                  onClick={() => setStep("when")}
                  className="shrink-0 text-[13px] font-semibold text-gold-ink underline underline-offset-2 cursor-pointer"
                >
                  เปลี่ยน
                </button>
              )}
            </div>
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

          {/* นโยบายยกเลิก — แสดงก่อนจ่ายเสมอ (ตัวเลขชุดเดียวกับที่ระบบบังคับ) */}
          <div className="rounded-xl border border-line-warm p-3.5 text-[13px] leading-relaxed">
            <p className="font-bold text-ink-deep">การยกเลิกและคืนเงิน</p>
            <ul className="mt-1.5 space-y-1 text-ink">
              {(mode === "booking"
                ? [
                    `ยกเลิกหรือเลื่อนนัดก่อนเวลานัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็มจำนวน (เลื่อนได้ 1 ครั้ง)`,
                    `ยกเลิกน้อยกว่า ${FREE_CANCEL_HOURS} ชม. ก่อนนัด ไม่คืนเงิน`,
                    "แม่หมอยกเลิก หรือไม่มาตามนัด คืนเงินเต็มจำนวนอัตโนมัติ",
                  ]
                : [
                    "ยกเลิกได้ตลอดระหว่างรอคิว คืนเงินเต็มจำนวน",
                    "แม่หมอปิดคิวก่อนถึงตาคุณ คืนเงินเต็มจำนวนอัตโนมัติ",
                  ]
              ).map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-ink" />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <label className="flex cursor-pointer select-none items-start gap-3 rounded-xl border border-line-warm p-3.5 text-[13px] leading-relaxed text-ink">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-interactive-warm accent-gold-ink"
            />
            <span>
              ยินยอมส่งชื่อเล่นและคำถามให้แม่หมอ และยอมรับเงื่อนไขการยกเลิกด้านบน{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline underline-offset-2">
                (PDPA)
              </Link>
            </span>
          </label>

          <div className="space-y-2.5 border-t border-line-warm pt-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-ink">ยอดชำระ</span>
              <span className="text-xl font-bold text-ink-deep">
                {CONSULTATION_PRICE_THB} <span className="text-sm font-semibold">บาท</span>
              </span>
            </div>
            <button
              type="submit"
              disabled={submitting || !consent || !nickname.trim() || question.trim().length < 3 || !canContinue}
              className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
              {submitting ? "กำลังไปหน้าชำระเงิน…" : `ชำระเงิน ${CONSULTATION_PRICE_THB} บาท`}
            </button>
            <p className="text-center text-[12px] leading-relaxed text-muted">
              ชำระผ่าน Stripe · บัตรเครดิต/เดบิต หรือพร้อมเพย์ · เว็บเราไม่เก็บข้อมูลบัตร
              {mode === "booking" && <> · ระบบกันเวลานี้ไว้ให้ {CHECKOUT_EXPIRES_MINUTES - 1} นาทีระหว่างชำระเงิน</>}
            </p>
          </div>
        </form>
      )}
    </Modal>
  );
};
