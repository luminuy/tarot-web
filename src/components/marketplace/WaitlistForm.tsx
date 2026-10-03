"use client";

import { useState } from "react";

/**
 * ✦ "แจ้งเตือนฉันเมื่อมีเวลาว่าง" — ทางออกเมื่อแม่หมอเต็ม/ยังไม่เปิดตาราง (แทนทางตัน)
 * ส่งอีเมลครั้งเดียวเมื่อมีเวลาว่าง แล้วลบอีเมลทิ้งทันที (PDPA) — บอกผู้ใช้ตรง ๆ ตรงนี้
 */
export function WaitlistForm({ readerId, compact = false }: { readerId: string; compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);
    try {
      const res = await fetch(`/api/marketplace/readers/${encodeURIComponent(readerId)}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), consent: true }),
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
    <form onSubmit={submit} className={`space-y-2.5 text-left font-serif-th ${compact ? "" : "rounded-2xl border border-line-warm bg-surface p-4"}`}>
      <p className="text-sm font-bold text-ink-deep">แจ้งเตือนฉันเมื่อมีเวลาว่าง</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor={`waitlist-${readerId}`}>
          อีเมลของคุณ
        </label>
        <input
          id={`waitlist-${readerId}`}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="อีเมลของคุณ"
          maxLength={254}
          className="glass-field min-h-[44px] flex-1 rounded-xl border border-line-interactive-warm px-3.5 text-sm text-ink outline-none focus:border-gold-ink"
        />
        <button
          type="submit"
          disabled={state === "sending" || !consent || !email.trim()}
          className="min-h-[44px] rounded-full bg-ink-deep px-5 text-sm font-bold text-surface transition-colors cursor-pointer hover:bg-gold-ink disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state === "sending" ? "กำลังลงชื่อ…" : "แจ้งเตือนฉัน"}
        </button>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[12px] leading-relaxed text-muted">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-gold-ink"
        />
        ยินยอมให้ส่งอีเมลแจ้งครั้งเดียว แล้วลบอีเมลทิ้งทันที ไม่ใช้ทำการตลาด
      </label>
      {error && (
        <p role="alert" className="text-[13px] text-err">
          {error}
        </p>
      )}
    </form>
  );
}
