"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { SlotPicker } from "@/components/marketplace/SlotPicker";
import { WaitlistForm } from "@/components/marketplace/WaitlistForm";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { CONSULTATION_MINUTES } from "@/lib/marketplace/offer";
import { smoothScrollBehavior } from "@/lib/use-motion-safe";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  FREE_CANCEL_HOURS,
  MAX_RESCHEDULES,
  PAID_GRACE_MINUTES,
  formatSlotRange,
  relativeDayLabel,
  type SlotDay,
} from "@/lib/marketplace/booking-policy";

export type ConsultMode = "now" | "schedule";
type Step = "when" | "details";
type FieldKey = "nickname" | "question" | "consent";

interface BookingFlowProps {
  reader: { id: string; displayName: string; avatarUrl: string | null };
  /** ค่าปรึกษาของแม่หมอคนนี้ (แสดงผลเท่านั้น — ยอดที่เรียกเก็บจริงเซิร์ฟเวอร์คิดเอง) */
  priceThb: number;
  /** แม่หมอเปิดรับคิวสด ("คุยตอนนี้") อยู่ตอนโหลดหน้า */
  isLiveOpen: boolean;
  /** มีเวลาว่างให้นัดอย่างน้อยหนึ่งช่องตอนโหลดหน้า */
  hasSchedule: boolean;
  /** `?mode=` จากปุ่มบนหน้าแม่หมอ */
  initialMode: ConsultMode | null;
  /** `?slot=` จากปุ่ม "เวลาว่างเร็วที่สุด" — เป็นแค่ทางลัด เซิร์ฟเวอร์ตรวจซ้ำตอนจองเสมอ */
  initialSlot: number | null;
  /**
   * ✦ ลิงก์ห้องส่วนตัวที่แม่หมอส่งให้ (`/readers/room/<code>` · migrations/0032)
   * มี = ขั้นเดียว: ชื่อ ➔ จ่าย ➔ รอแม่หมอรับเข้าห้อง · คำถามไม่บังคับ · ใช้ได้แม้แม่หมอปิดคิวสด
   * (เซิร์ฟเวอร์ตรวจรหัสลิงก์เองทุกครั้ง — ค่านี้แค่บอกหน้าจอว่าต้องส่งรหัสไปด้วย)
   */
  invite?: { code: string; customerLabel: string | null };
}

const QUESTION_MAX = 1000;
const NICKNAME_MAX = 40;
/**
 * จำชื่อเล่นไว้ในเครื่องนี้ให้ครั้งหน้า (ไม่จำคำถาม — เป็นเรื่องส่วนตัว)
 * ใช้คีย์ชื่อเล่นกลางของเว็บในทะเบียน — ชื่อที่เคยกรอกตอนเปิดไพ่ก็เติมให้ด้วย
 * (เดิมประกาศคีย์ใหม่เป็นค่าคงที่ในไฟล์นี้ ซึ่งหลบด่านทะเบียนคีย์ได้ — ด่านตรวจแบบนั้นแล้ว)
 */
const NICKNAME_KEY = STORAGE_KEYS.nickname;
const HISTORY_MARK = "consultStep";

function initialModeOf(p: BookingFlowProps): ConsultMode {
  if (p.initialSlot && p.hasSchedule) return "schedule";
  if (p.initialMode === "schedule" && p.hasSchedule) return "schedule";
  return p.isLiveOpen ? "now" : "schedule";
}

function initialStepOf(p: BookingFlowProps, mode: ConsultMode): Step {
  if (mode === "schedule") return p.initialSlot ? "details" : "when";
  // คุยตอนนี้: กดมาจากปุ่ม "คุยตอนนี้" แล้ว หรือไม่มีทางอื่นให้เลือก ➔ ข้ามไปกรอกชื่อเลย
  return p.initialMode === "now" || !p.hasSchedule ? "details" : "when";
}

/**
 * ✦ หน้าจองปรึกษาแม่หมอแบบเต็มจอ — แบบหน้าจองของเว็บระดับโลก (Airbnb · Calendly · Zocdoc)
 * ---------------------------------------------------------------------------
 *   ① เวลา  ➔  ② ชื่อและคำถาม  ➔  ③ ชำระเงิน (Stripe)  ➔  หน้าคิว/นัด
 *
 * ทำไมไม่ใช่หน้าต่างลอยแบบเดิม (`BookQueueModal` — CONSULT_FLOW_UX_PLAN P2 · P4):
 * - บนมือถือหน้าต่างลอยเหลือพื้นที่เนื้อหา ~290px — ช่องเวลาและช่องติ๊กยินยอมตกใต้ขอบจอ
 * - กดย้อนกลับของเบราว์เซอร์ = หลุดออกจากหน้า (ที่นี่ = ถอยหนึ่งขั้น)
 *
 * กติกาหน้าจอ
 * - แตะเวลา = ไปขั้นถัดไปทันที (ไม่ต้องหาปุ่ม "ถัดไป")
 * - ปุ่มชำระเงิน **กดได้เสมอ** — ขาดอะไรขึ้นข้อความใต้ช่องนั้นและเลื่อนไปให้ (เดิมปุ่มจางเงียบ ๆ)
 * - แถบล่างติดจอ: สรุปเวลา + ยอด + ปุ่มหลักปุ่มเดียว
 * - ราคา/ความถูกต้องของเวลา เซิร์ฟเวอร์ตัดสินเอง (`POST /api/marketplace/tickets`) — หน้านี้แค่ส่งสิ่งที่ลูกค้าเลือก
 */
export function BookingFlow(props: BookingFlowProps) {
  const { reader, priceThb, isLiveOpen, hasSchedule, initialSlot, invite } = props;
  const bothModes = isLiveOpen && hasSchedule && !invite;

  const [mode, setMode] = useState<ConsultMode>(() => initialModeOf(props));
  const [step, setStep] = useState<Step>(() => initialStepOf(props, initialModeOf(props)));
  const [slot, setSlot] = useState<number | null>(initialSlot && hasSchedule ? initialSlot : null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [nickname, setNickname] = useState("");
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  // ม.26: ยินยอมเรื่องข้อมูลอ่อนไหวเป็นช่องแยก ไม่บังคับ และไม่ติ๊กไว้ก่อน (ม.19 ห้ามรวบกับการยอมรับเงื่อนไข)
  const [sensitiveConsent, setSensitiveConsent] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(0);

  const nicknameRef = useRef<HTMLInputElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  /** มีรายการประวัติ "กันชน" ของขั้นกรอกข้อมูลอยู่ไหม — กดย้อนกลับ = กลับไปขั้นเลือกเวลา */
  const guardRef = useRef(false);

  useEffect(() => {
    setNow(Date.now());
    // ลิงก์ห้องส่วนตัว: ชื่อที่แม่หมอพิมพ์ไว้ให้มาก่อน (แม่หมอเรียกลูกค้าแบบนี้อยู่แล้วใน LINE)
    if (invite?.customerLabel) {
      setNickname(invite.customerLabel.slice(0, NICKNAME_MAX));
      return;
    }
    try {
      const saved = window.localStorage.getItem(NICKNAME_KEY);
      if (saved) setNickname(saved.slice(0, NICKNAME_MAX));
    } catch {
      // โหมดส่วนตัว/ปิดที่เก็บข้อมูล — กรอกเองตามปกติ
    }
  }, [invite?.customerLabel]);

  // ลิงก์ "เวลาว่างเร็วที่สุด" อาจเก่าไปแล้ว (มีคนจองตัดหน้า) ➔ บอกตั้งแต่เปิดหน้า ไม่ใช่ตอนกดจ่าย
  useEffect(() => {
    if (!initialSlot || !hasSchedule) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/marketplace/readers/${encodeURIComponent(reader.id)}/slots`, { cache: "no-store" });
        const data = (await res.json().catch(() => ({}))) as { days?: SlotDay[] };
        if (cancelled || !res.ok || !data.days) return;
        const stillFree = data.days.some((d) => d.slots.includes(initialSlot));
        if (!stillFree) {
          setSlot(null);
          setStep("when");
          setNotice("เวลาที่เลือกไว้เพิ่งมีคนจองไป เลือกเวลาใหม่ได้เลย");
        }
      } catch {
        // เน็ตสะดุด — ปล่อยให้เซิร์ฟเวอร์ตรวจตอนจองตามปกติ
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialSlot, hasSchedule, reader.id]);

  // ปุ่มย้อนกลับของเบราว์เซอร์ในขั้นกรอกข้อมูล = กลับไปขั้นเลือกเวลา (ไม่หลุดออกจากหน้า)
  useEffect(() => {
    const onPop = () => {
      if (!guardRef.current) return;
      guardRef.current = false;
      setStep("when");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goDetails = useCallback(() => {
    setNotice(null);
    setStep("details");
    if (!guardRef.current) {
      const state = (window.history.state as Record<string, unknown> | null) ?? {};
      window.history.pushState({ ...state, [HISTORY_MARK]: "details" }, "");
      guardRef.current = true;
    }
    window.scrollTo({ top: 0 });
  }, []);

  const goWhen = useCallback(() => {
    setErrors({});
    if (guardRef.current) {
      // ถอนกันชนด้วยการย้อนจริง — popstate จะพาไปขั้นเลือกเวลาเอง ประวัติจึงไม่บวม
      window.history.back();
      return;
    }
    setStep("when");
    window.scrollTo({ top: 0 });
  }, []);

  const showNotice = (message: string) => {
    setNotice(message);
    requestAnimationFrame(() => noticeRef.current?.scrollIntoView({ block: "center", behavior: smoothScrollBehavior() }));
  };

  const validate = (): FieldKey | null => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!nickname.trim()) next.nickname = "ใส่ชื่อเล่นที่อยากให้แม่หมอเรียก";
    // ลิงก์ห้องส่วนตัว: คุยกับแม่หมอใน LINE มาแล้ว คำถามจึงไม่บังคับ (เล่าในห้องแทนได้)
    if (!invite && question.trim().length < 3) next.question = "เล่าเรื่องที่อยากถามสั้น ๆ สักประโยค";
    if (!consent) next.consent = "ติ๊กช่องนี้ก่อนชำระเงิน";
    setErrors(next);
    return (["nickname", "question", "consent"] as const).find((k) => next[k]) ?? null;
  };

  const focusField = (key: FieldKey) => {
    const el = key === "nickname" ? nicknameRef.current : key === "question" ? questionRef.current : consentRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: smoothScrollBehavior() });
    el.focus({ preventScroll: true });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    const missing = validate();
    if (missing) {
      focusField(missing);
      return;
    }
    if (mode === "schedule" && !slot) {
      goWhen();
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      window.localStorage.setItem(NICKNAME_KEY, nickname.trim());
    } catch {
      // ไม่จำก็ได้ ไม่กระทบการจอง
    }
    try {
      // ตัวตนลูกค้า (customerRef) เซิร์ฟเวอร์ออกให้เองผ่านคุกกี้ HttpOnly — ไคลเอนต์ไม่ต้องรู้ค่า (A2-13)
      // ราคาไม่ถูกส่งจากที่นี่โดยตั้งใจ — เซิร์ฟเวอร์คิดเอง
      const res = await fetch("/api/marketplace/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readerId: reader.id,
          kind: mode === "now" || invite ? "walkup" : "booking",
          slotStart: mode === "schedule" && !invite ? slot : undefined,
          nickname: nickname.trim(),
          question: question.trim(),
          consent: true,
          sensitiveConsent,
          inviteCode: invite?.code,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
        redirectUrl?: string;
        checkoutUrl?: string;
      };
      if (!res.ok) {
        setSubmitting(false);
        if (data.code === "slot_unavailable") {
          // เวลานี้เพิ่งถูกจองตัดหน้า ➔ กลับไปเลือกเวลา (ชื่อ/คำถามที่กรอกยังอยู่ครบ)
          setSlot(null);
          setRefreshKey((k) => k + 1);
          goWhen();
          setNotice(data.error || "เวลานี้เพิ่งมีคนจองไป เลือกเวลาใหม่ได้เลย");
          return;
        }
        if (mode === "now" && res.status === 409 && hasSchedule) {
          // แม่หมอเพิ่งปิดรับคิวสดระหว่างกรอก ➔ เสนอนัดเวลาแทนทันที
          setMode("schedule");
          goWhen();
          setNotice(data.error || "แม่หมอเพิ่งปิดรับคิวสด เลือกนัดเวลาแทนได้เลย");
          return;
        }
        showNotice(data.error || "จองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }
      // หน้าจ่ายเงินของ Stripe อยู่นอกเว็บเรา ➔ เปลี่ยนหน้าทั้งแท็บ (ไม่ใช่ router.push)
      const next = data.checkoutUrl || data.redirectUrl;
      if (next) window.location.assign(next);
      else setSubmitting(false);
    } catch {
      setSubmitting(false);
      showNotice("เชื่อมต่อไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่");
    }
  };

  /* ── ไม่มีทางให้จองเลย (ไม่เปิดคิวสด และไม่มีเวลาว่าง) ─────────────────────── */
  if (!isLiveOpen && !hasSchedule) {
    return (
      <div className="space-y-5">
        <ReaderSummary reader={reader} priceThb={priceThb} />
        <section className="altar-card-porcelain !rounded-2xl space-y-3 p-5 text-center">
          <h1 className="text-lg font-bold text-ink-deep">
            <ThaiPhrases>ตอนนี้แม่หมอยังไม่มีเวลาว่าง</ThaiPhrases>
          </h1>
          <p className="text-sm leading-relaxed text-muted">
            ฝากอีเมลไว้ได้ ระบบจะแจ้งทันทีที่แม่หมอเปิดเวลาใหม่ หรือทักแม่หมอที่ส่งลิงก์นี้ให้คุณ
          </p>
          <WaitlistForm readerId={reader.id} compact />
        </section>
      </div>
    );
  }

  const stepIndex = step === "when" ? 0 : 1;
  // ลิงก์ห้องส่วนตัวไม่มีขั้นเลือกเวลา — ขั้นตอนที่ลูกค้าเห็นคือ ชื่อ ➔ จ่าย ➔ เข้าห้อง
  const stepLabels = invite ? ["ชื่อเล่น", "ชำระเงิน", "เข้าห้องกับแม่หมอ"] : ["เลือกเวลา", "ชื่อและคำถาม", "ชำระเงิน"];
  const activeStep = invite ? (submitting ? 1 : 0) : submitting ? 2 : stepIndex;
  // "พรุ่งนี้ · จันทร์ 12 ต.ค. · 10:00–10:30 น." — วันอื่นมีชื่อวันอยู่ใน formatSlotRange แล้ว ไม่พิมพ์ซ้ำ
  const relative = slot && now ? relativeDayLabel(slot, now) : null;
  const whenLabel = invite
    ? "ห้องส่วนตัว · เข้าห้องเมื่อแม่หมอกดรับ"
    : mode === "now"
      ? "คุยตอนนี้ · เข้าคิวทันทีหลังชำระเงิน"
      : slot
        ? `${relative === "วันนี้" || relative === "พรุ่งนี้" ? `${relative} · ` : ""}${formatSlotRange(slot)}`
        : null;

  return (
    <div className="space-y-5">
      <ReaderSummary reader={reader} priceThb={priceThb} />

      <ol className="flex items-center gap-2" aria-label="ขั้นตอนการจอง">
        {stepLabels.map((label, i) => {
          const done = i < activeStep;
          const active = i === activeStep;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span aria-hidden="true" className={`h-1 rounded-full ${done || active ? "bg-gold-ink" : "bg-line-warm"}`} />
              <span className={`text-[12px] leading-tight ${active ? "font-bold text-ink-deep" : "text-muted"}`}>
                {i + 1}. {label}
                {done && <span className="sr-only"> (เสร็จแล้ว)</span>}
              </span>
            </li>
          );
        })}
      </ol>

      {notice && (
        <div
          ref={noticeRef}
          role="alert"
          className="rounded-xl border border-err/30 bg-err-wash p-3.5 text-[13px] leading-relaxed text-err"
        >
          {notice}
        </div>
      )}

      {step === "when" ? (
        <section aria-labelledby="when-heading" className="space-y-4">
          <h1 id="when-heading" className="text-xl font-bold text-ink-deep sm:text-2xl">
            <ThaiPhrases>{bothModes ? "อยากคุยตอนไหน" : "เลือกเวลาที่สะดวก"}</ThaiPhrases>
          </h1>

          {bothModes && (
            <div className="grid gap-2.5 sm:grid-cols-2" role="radiogroup" aria-label="รูปแบบการปรึกษา">
              {(
                [
                  { value: "now", title: "คุยตอนนี้", body: "แม่หมอออนไลน์อยู่ จ่ายแล้วเข้าคิวทันที", live: true },
                  { value: "schedule", title: "นัดเวลา", body: "เลือกวันและเวลาที่สะดวก", live: false },
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
                    className={`flex min-h-[64px] items-start gap-3 rounded-2xl border p-3.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink ${
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

          {mode === "schedule" ? (
            <SlotPicker
              readerId={reader.id}
              value={slot}
              refreshKey={refreshKey}
              showWaitlist
              onChange={(s) => {
                setSlot(s);
                goDetails();
              }}
            />
          ) : (
            <p className="rounded-2xl bg-inset-warm/70 p-4 text-[13px] leading-relaxed text-ink">
              ชำระเงินแล้วเข้าคิวทันที เปิดหน้าคิวทิ้งไว้ได้เลย ถึงตาคุณแล้วปุ่มเข้าห้องวิดีโอคอลจะขึ้นเอง
              ระหว่างรอยกเลิกได้ตลอด คืนเงินเต็มจำนวน
            </p>
          )}
        </section>
      ) : (
        <form id="booking-form" onSubmit={handleSubmit} noValidate className="space-y-5" aria-labelledby="details-heading">
          <h1 id="details-heading" className="text-xl font-bold text-ink-deep sm:text-2xl">
            <ThaiPhrases>{invite ? `ห้องคุยส่วนตัวกับ ${reader.displayName}` : "ชื่อและเรื่องที่อยากถาม"}</ThaiPhrases>
          </h1>
          {invite && (
            <p className="rounded-2xl border border-gold-ink/30 bg-inset-warm p-4 text-[13px] leading-relaxed text-ink">
              <ThaiPhrases>แม่หมอส่งลิงก์นี้ให้คุณคนเดียว ใส่ชื่อแล้วชำระเงิน จากนั้นรอในหน้าถัดไป แม่หมอกดรับเมื่อไร ห้องวิดีโอคอลเปิดทันที</ThaiPhrases>
            </p>
          )}

          {/* เวลาที่เลือก + เปลี่ยนได้ทันที */}
          <div className="flex items-center gap-3 rounded-2xl border border-line-warm bg-inset-warm/70 p-3.5">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-gold-ink" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <p className="min-w-0 flex-1 text-sm leading-snug">
              <span className="block text-[12px] text-muted">{mode === "now" ? "รูปแบบ" : "เวลานัด (เวลาไทย)"}</span>
              <strong className="font-bold text-ink-deep">{whenLabel ?? "ยังไม่ได้เลือกเวลา"}</strong>
            </p>
            {(bothModes || mode === "schedule") && (
              <button
                type="button"
                onClick={goWhen}
                className="tap-overlay-y shrink-0 text-[13px] font-semibold text-gold-ink underline underline-offset-2 cursor-pointer"
              >
                เปลี่ยน
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="consult-nickname" className="text-xs font-semibold tracking-wide text-gold-ink">
              ชื่อเล่นของคุณ
            </label>
            <input
              ref={nicknameRef}
              id="consult-nickname"
              autoComplete="nickname"
              enterKeyHint="next"
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                if (errors.nickname) setErrors((p) => ({ ...p, nickname: undefined }));
              }}
              placeholder="เช่น บีม, พลอย, บอส"
              maxLength={NICKNAME_MAX}
              aria-invalid={errors.nickname ? true : undefined}
              aria-describedby={errors.nickname ? "consult-nickname-err" : "consult-nickname-hint"}
              className={`altar-card-porcelain !rounded-lg w-full px-3.5 py-3 text-base text-ink-deep placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/30 ${
                errors.nickname ? "!border-err" : ""
              }`}
            />
            {errors.nickname ? (
              <p id="consult-nickname-err" className="text-[13px] font-semibold text-err">
                {errors.nickname}
              </p>
            ) : (
              <p id="consult-nickname-hint" className="text-[13px] text-muted">
                แม่หมอจะเรียกคุณด้วยชื่อนี้
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="consult-question" className="text-xs font-semibold tracking-wide text-gold-ink">
              อยากปรึกษาเรื่องอะไร{invite ? " (ไม่บังคับ)" : ""}
            </label>
            <textarea
              ref={questionRef}
              id="consult-question"
              rows={4}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (errors.question) setErrors((p) => ({ ...p, question: undefined }));
              }}
              placeholder="เช่น ความสัมพันธ์กับแฟนช่วงนี้ไม่ค่อยดี อยากรู้ว่าควรไปต่อหรือพอแค่นี้"
              maxLength={QUESTION_MAX}
              aria-invalid={errors.question ? true : undefined}
              aria-describedby={errors.question ? "consult-question-err" : "consult-question-hint"}
              className={`altar-card-porcelain !rounded-lg w-full resize-y px-3.5 py-3 text-base leading-relaxed text-ink-deep placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink/30 ${
                errors.question ? "!border-err" : ""
              }`}
            />
            <div className="flex items-start justify-between gap-3">
              {errors.question ? (
                <p id="consult-question-err" className="text-[13px] font-semibold text-err">
                  {errors.question}
                </p>
              ) : (
                <p id="consult-question-hint" className="text-[13px] text-muted">
                  {invite
                    ? "เล่าไว้ก่อนแม่หมอจะได้เตรียมตัว หรือเว้นไว้แล้วเล่าในห้องก็ได้"
                    : "เล่าสั้น ๆ ก็พอ AI จะสรุปให้แม่หมออ่านก่อนเริ่มคุย"}
                </p>
              )}
              <p className="shrink-0 font-mono text-[11px] text-muted" aria-hidden="true">
                {question.length}/{QUESTION_MAX}
              </p>
            </div>
          </div>

          <div
            className={`space-y-1.5 rounded-xl border p-3.5 ${errors.consent ? "border-err bg-err-wash/60" : "border-line-warm bg-surface/70"}`}
          >
            <label className="flex cursor-pointer select-none items-start gap-3 text-[13px] leading-relaxed text-ink">
              <input
                ref={consentRef}
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (errors.consent) setErrors((p) => ({ ...p, consent: undefined }));
                }}
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "consult-consent-err" : undefined}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-line-interactive-warm accent-gold-ink"
              />
              <span>
                ส่งชื่อเล่นและคำถามให้แม่หมอที่เลือกเพื่อดูดวงให้ฉัน และยอมรับเงื่อนไขการยกเลิกและคืนเงินด้านล่าง{" "}
                <Link href="/privacy" target="_blank" className="font-semibold text-gold-ink underline underline-offset-2">
                  (นโยบายความเป็นส่วนตัว)
                </Link>
              </span>
            </label>
            {errors.consent && (
              <p id="consult-consent-err" className="pl-8 text-[13px] font-semibold text-err">
                {errors.consent}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer select-none items-start gap-3 px-3.5 text-[13px] leading-relaxed text-ink">
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

          {/* เงื่อนไขยกเลิก — ตัวเลขชุดเดียวกับที่ระบบบังคับจริง */}
          <details className="group rounded-xl border border-line-warm text-[13px] leading-relaxed">
            <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 p-3.5">
              <span className="text-ink">
                <strong className="font-bold text-ink-deep">
                  {invite
                    ? "ยกเลิกได้ตลอดระหว่างรอแม่หมอรับเข้าห้อง"
                    : mode === "schedule"
                      ? `ยกเลิกฟรีก่อนนัด ${FREE_CANCEL_HOURS} ชม.`
                      : "ยกเลิกได้ตลอดระหว่างรอคิว"}
                </strong>{" "}
                · คืนเงินเต็มจำนวน
              </span>
              <span className="shrink-0 font-semibold text-gold-ink group-open:hidden">ดูเงื่อนไข</span>
              <span className="hidden shrink-0 font-semibold text-gold-ink group-open:inline">ซ่อน</span>
            </summary>
            <ul className="space-y-1 border-t border-line-warm px-3.5 pb-3.5 pt-3 text-ink">
              {(invite
                ? ["ยกเลิกได้ตลอดระหว่างรอแม่หมอรับเข้าห้อง คืนเงินเต็ม", "แม่หมอยกเลิก คืนเงินเต็มอัตโนมัติ"]
                : mode === "schedule"
                ? [
                    `ยกเลิกหรือเลื่อนนัดก่อนเวลานัด ${FREE_CANCEL_HOURS} ชม. คืนเงินเต็ม (เลื่อนได้ ${MAX_RESCHEDULES} ครั้ง)`,
                    `ยกเลิกน้อยกว่า ${FREE_CANCEL_HOURS} ชม. ก่อนนัด ไม่คืนเงิน`,
                    `จ่ายแล้วเพิ่งเห็นว่ากดเวลาผิด? ภายใน ${PAID_GRACE_MINUTES} นาทีหลังจ่าย ยกเลิกหรือเลื่อนได้ฟรี (นัดที่ห่างเกิน 1 ชม.)`,
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

          <div className="space-y-1.5 rounded-2xl bg-inset-warm/60 p-4 text-[13px] leading-relaxed text-ink">
            <p className="font-bold text-ink-deep">จ่ายแล้วเกิดอะไรต่อ</p>
            <p>
              {invite
                ? "ไปหน้ารอเข้าห้องทันที เปิดหน้านั้นทิ้งไว้ แม่หมอกดรับเมื่อไร ปุ่มเข้าห้องวิดีโอคอลจะขึ้นเอง"
                : mode === "schedule"
                  ? "ได้หน้ายืนยันนัดพร้อมลิงก์นัดของคุณ ถึงเวลานัดเปิดลิงก์นั้นแล้วกดเข้าห้องวิดีโอคอล"
                  : "เข้าคิวทันที เปิดหน้าคิวทิ้งไว้ ถึงตาคุณแล้วปุ่มเข้าห้องวิดีโอคอลจะขึ้นเอง"}
              {" "}คุยทาง LINE แทนได้ถ้าภาพหรือเสียงมีปัญหา
            </p>
          </div>
        </form>
      )}

      {/* แถบล่างติดจอ: สรุป + ปุ่มหลักปุ่มเดียว (ไม่มีปุ่มจางแบบเงียบ) */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-line-warm bg-surface px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-10px_30px_-24px_rgba(46,33,26,0.6)] sm:mx-0 sm:rounded-2xl sm:border">
        {step === "when" && mode === "schedule" ? (
          <div className="flex min-h-[52px] items-center justify-between gap-3">
            <p className="text-[13px] leading-snug text-ink">
              {slot ? (
                <>
                  <span className="block text-muted">เวลาที่เลือกไว้</span>
                  <strong className="font-bold text-ink-deep">{whenLabel}</strong>
                </>
              ) : (
                <>
                  <strong className="block font-bold text-ink-deep">แตะเวลาที่สะดวกด้านบน</strong>
                  <span className="text-muted">แล้วไปกรอกชื่อได้ทันที · ยังไม่ตัดเงิน</span>
                </>
              )}
            </p>
            {slot ? (
              <button
                type="button"
                onClick={goDetails}
                className="btn-gold-glass flex min-h-[48px] shrink-0 items-center justify-center gap-2 px-5 text-sm font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
              >
                ใช้เวลานี้
              </button>
            ) : (
              <span className="shrink-0 text-right leading-none">
                <span className="text-xl font-bold text-ink-deep">{priceThb}</span>
                <span className="ml-1 text-sm font-semibold text-ink-deep">บาท</span>
              </span>
            )}
          </div>
        ) : step === "when" ? (
          <button
            type="button"
            onClick={goDetails}
            className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
          >
            ถัดไป: ใส่ชื่อและคำถาม
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-muted">ยอดชำระ · ตัวต่อตัว {CONSULTATION_MINUTES} นาที</span>
              <span className="leading-none">
                <span className="text-xl font-bold text-ink-deep">{priceThb}</span>
                <span className="ml-1 text-sm font-semibold text-ink-deep">บาท</span>
              </span>
            </div>
            <button
              type="submit"
              form="booking-form"
              aria-disabled={submitting}
              className="btn-gold-glass flex min-h-[52px] w-full items-center justify-center gap-2 px-6 text-base font-bold cursor-pointer aria-disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
            >
              <LockIcon />
              {submitting ? "กำลังไปหน้าชำระเงิน…" : `ชำระเงิน ${priceThb} บาท`}
            </button>
            <p className="text-center text-[12px] leading-relaxed text-muted">
              ชำระผ่าน Stripe อย่างปลอดภัย · บัตรหรือพร้อมเพย์
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/** ใครกับใคร — ภาพแม่หมอ · ชื่อ · รูปแบบ · ราคา (หัวหน้าจองทุกขั้น) */
function ReaderSummary({ reader, priceThb }: { reader: BookingFlowProps["reader"]; priceThb: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[0_14px_30px_-26px_rgba(46,33,26,0.55)]">
      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-canvas text-lg font-bold text-gold-ink ring-2 ring-surface">
        {reader.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={reader.avatarUrl} alt="" /* ชื่อแม่หมออยู่ข้าง ๆ แล้ว (INC-0125) */ className="h-full w-full object-cover" />
        ) : (
          reader.displayName.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="break-words text-base font-bold leading-snug text-ink-deep">{reader.displayName}</p>
        <p className="text-[13px] text-muted">ตัวต่อตัว {CONSULTATION_MINUTES} นาที · วิดีโอคอล</p>
      </div>
      <p className="shrink-0 text-right leading-none">
        <span className="text-lg font-bold text-ink-deep">{priceThb}</span>
        <span className="ml-1 text-[13px] font-semibold text-ink-deep">บาท</span>
      </p>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
