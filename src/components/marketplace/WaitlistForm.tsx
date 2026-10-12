"use client";

import { useRef, useState } from "react";

/** รูปแบบอีเมลคร่าว ๆ ฝั่งหน้าเว็บ (ตัวจริงตรวจซ้ำที่ API) — ไว้บอกผู้ใช้ก่อนส่ง ไม่ใช่ด่านความปลอดภัย */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "แจ้งเตือนฉันเมื่อมีเวลาว่าง" — ทางออกเมื่อแม่หมอเต็ม/ยังไม่เปิดตาราง (แทนทางตัน)
 * ส่งอีเมลครั้งเดียวเมื่อมีเวลาว่าง แล้วลบอีเมลทิ้งทันที (PDPA) — บอกผู้ใช้ตรง ๆ ตรงนี้
 *
 * จัดวางตามความกว้างของฟอร์มเอง (container query) ไม่ใช่ความกว้างจอ:
 * ฟอร์มนี้อยู่ทั้งในหน้าจองเต็มจอและในการ์ดราคาคอลัมน์ขวาของหน้าแม่หมอ (กว้างราว 290px บนคอม)
 * เดิมใช้ `sm:flex-row` ตามจอ ➔ บนคอมช่องอีเมลกับปุ่มถูกจับเรียงแถวเดียวในการ์ดแคบ
 * ปุ่มโดนบีบจนคำว่า "แจ้งเตือนฉัน" หักทีละตัวอักษร และช่องอีเมลยืดสูงตามปุ่ม (เจ้าของเห็น 2026-10-12)
 * ตอนนี้: ฟอร์มกว้างไม่ถึง 24rem ➔ เรียงบน-ล่างเต็มความกว้าง · กว้างพอ ➔ แถวเดียว ปุ่มไม่หักบรรทัด
 *
 * ปุ่มกดได้เสมอ (ยกเว้นตอนกำลังส่ง) — ขาดอะไรบอกใต้ช่องนั้นแล้วพาไปที่ช่อง
 * เดิมปุ่มจางเทาจนกว่าจะกรอกครบ คนไม่รู้ว่าต้องทำอะไร (หลักเดียวกับปุ่มชำระเงินในหน้าจอง)
 */
export function WaitlistForm({ readerId, compact = false }: { readerId: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const emailId = `waitlist-${readerId}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    const trimmed = email.trim();
    const badEmail = !trimmed
      ? "กรอกอีเมลก่อน ระบบจะส่งข่าวไปที่อีเมลนี้"
      : !EMAIL_SHAPE.test(trimmed)
        ? "อีเมลดูไม่ครบ ลองตรวจอีกครั้ง เช่น name@gmail.com"
        : null;
    const badConsent = consent ? null : "ติ๊กยินยอมก่อน ระบบถึงจะส่งอีเมลแจ้งได้";
    setEmailError(badEmail);
    setConsentError(badConsent);
    if (badEmail) {
      emailRef.current?.focus();
      return;
    }
    if (badConsent) {
      consentRef.current?.focus();
      return;
    }

    setState("sending");
    try {
      const res = await fetch(`/api/marketplace/readers/${encodeURIComponent(readerId)}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, consent: true }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "ลงชื่อไม่สำเร็จ กรุณาลองใหม่");
        setState("idle");
        return;
      }
      setState("done");
    } catch {
      setError("เชื่อมต่อไม่ได้ กรุณาลองใหม่");
      setState("idle");
    }
  };

  if (state === "done") {
    return (
      <p role="status" className="rounded-xl border border-ok/30 bg-ok/10 p-3.5 text-[13px] leading-relaxed text-ink">
        <strong className="font-bold text-ok">ลงชื่อแล้ว</strong> · เราจะส่งอีเมลหาคุณครั้งเดียวทันทีที่แม่หมอมีเวลาว่าง
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={submit}
      className={`@container space-y-2.5 text-left font-serif-th ${compact ? "" : "rounded-2xl border border-line-warm bg-surface p-4"}`}
    >
      <p className="text-sm font-bold text-ink-deep">แจ้งเตือนฉันเมื่อมีเวลาว่าง</p>
      <div className="flex flex-col gap-2 @sm:flex-row">
        <label className="sr-only" htmlFor={emailId}>
          อีเมลของคุณ
        </label>
        <input
          ref={emailRef}
          id={emailId}
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
          }}
          placeholder="อีเมลของคุณ"
          maxLength={254}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? `${emailId}-err` : undefined}
          className={`glass-field h-11 w-full min-w-0 rounded-xl border px-3.5 text-base text-ink outline-none focus:border-gold-ink @sm:flex-1 ${
            emailError ? "border-err" : "border-line-interactive-warm"
          }`}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="btn-gold-glass flex h-11 w-full shrink-0 items-center justify-center whitespace-nowrap px-5 text-sm font-bold cursor-pointer disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2 @sm:w-auto"
        >
          {state === "sending" ? "กำลังลงชื่อ…" : "แจ้งเตือนฉัน"}
        </button>
      </div>
      {emailError && (
        <p id={`${emailId}-err`} role="alert" className="text-[13px] font-semibold leading-snug text-err">
          {emailError}
        </p>
      )}
      <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-muted">
        <input
          ref={consentRef}
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setConsentError(null);
          }}
          aria-invalid={consentError ? true : undefined}
          aria-describedby={consentError ? `${emailId}-consent-err` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 accent-gold-ink"
        />
        ยินยอมให้ส่งอีเมลแจ้งครั้งเดียว แล้วลบอีเมลทิ้งทันที ไม่ใช้ทำการตลาด
      </label>
      {consentError && (
        <p id={`${emailId}-consent-err`} role="alert" className="text-[13px] font-semibold leading-snug text-err">
          {consentError}
        </p>
      )}
      {error && (
        <p role="alert" className="text-[13px] text-err">
          {error}
        </p>
      )}
    </form>
  );
}
