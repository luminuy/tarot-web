"use client";

import React, { useId, useState } from "react";
import { mutateEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * 🎟️ ช่องกรอกรหัสแลกสิทธิ์ — ใช้ร่วมกันระหว่างหน้าต่างเติมรอบกับหน้า /pricing
 * ต้องเข้าสู่ระบบก่อน (สิทธิ์ผูกกับบัญชี) — ยังไม่ล็อกอินให้เรียก `onRequireAuth`
 */
export function RedeemCodeForm({
  isEn,
  signedIn,
  onRequireAuth,
}: {
  isEn: boolean;
  signedIn: boolean;
  onRequireAuth?: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  /* ♿ R-21: ผูกข้อความผิดพลาดเข้ากับช่องกรอกที่ผิด */
  const errorId = useId();
  const inputId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) {
      if (onRequireAuth) onRequireAuth();
      else setError(isEn ? "Please sign in before redeeming a code." : "กรุณาเข้าสู่ระบบก่อนแลกรับสิทธิ์");
      return;
    }
    const trimmed = code.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/entitlement/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || (isEn ? "This code could not be redeemed." : "แลกรหัสนี้ไม่สำเร็จ"));
      } else {
        // ฝั่งอังกฤษประกอบข้อความเอง — เซิร์ฟเวอร์ส่งมาเป็นภาษาไทยชุดเดียว
        // และต้องแยกตามชนิดรหัส: VIP ปลดทุกผัง · โค้ดแจกได้แค่รอบเปิดไพ่เพิ่ม
        const enMessage =
          data.kind === "premium"
            ? `Redeemed — ${data.credits} premium readings unlocked (all spreads and master readers).`
            : `Redeemed — ${data.credits} extra readings added (used after today's free quota).`;
        setSuccess(isEn ? enMessage : data.message || "แลกรับสิทธิ์สำเร็จ");
        setCode("");
        mutateEntitlement();
      }
    } catch {
      setError(isEn ? "Network error. Please try again." : "เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label htmlFor={inputId} className="block font-serif-th text-xs font-semibold text-ink-deep">
        {isEn ? "Redeem code" : "รหัสแลกสิทธิ์"}
      </label>

      {error && (
        <p id={errorId} role="alert" className="rounded-lg bg-err-wash px-3 py-2 font-serif-th text-xs text-err">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-lg bg-ok/10 px-3 py-2 font-serif-th text-xs font-semibold text-ok">
          {success}
        </p>
      )}

      <div className="flex gap-2">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={isEn ? "e.g. VIP3-TAROT-2026" : "เช่น VIP3-TAROT-2026"}
          disabled={loading}
          className="glass-field min-h-[44px] min-w-0 flex-1 rounded-xl border border-line-interactive-warm px-3 font-mono text-sm uppercase tracking-wider text-ink-deep focus:border-gold-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="btn-glass-ghost min-h-[44px] shrink-0 px-4 font-serif-th text-sm font-bold text-ink-deep cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink"
        >
          {loading ? (isEn ? "Checking…" : "กำลังตรวจ…") : isEn ? "Redeem" : "แลกสิทธิ์"}
        </button>
      </div>
    </form>
  );
}
