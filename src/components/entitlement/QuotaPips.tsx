"use client";

import type { QuotaTone } from "@/lib/entitlement/copy";

/**
 * จุดไฟบอกสิทธิ์คงเหลือ — อ่านออกในเสี้ยววินาทีโดยไม่ต้องอ่านตัวเลข
 * จุดสว่าง = สิทธิ์ที่ยังใช้ได้ · จุดมืด = ใช้ไปแล้ว
 * เพดานเกิน 6 จุดจะย่อเป็นตัวเลขแทน เพื่อไม่ให้แถบยาวเกินบนมือถือ
 */
export function QuotaPips({
  remaining,
  limit,
  tone,
  size = "md",
}: {
  remaining: number;
  limit: number;
  tone: QuotaTone;
  size?: "sm" | "md";
}) {
  const total = Math.max(1, Math.min(limit, 6));
  const lit = Math.max(0, Math.min(total, remaining));
  const dot = size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";

  const litClass =
    tone === "empty"
      ? "bg-[#9c93b8]/30"
      : tone === "low"
      ? "bg-[#f0a868] shadow-[0_0_6px_rgba(240,168,104,0.7)]"
      : "bg-[#ffd700] shadow-[0_0_6px_rgba(255,215,0,0.7)]";

  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`${dot} rounded-full transition-colors duration-300 ${
            i < lit ? litClass : "bg-[#e5c07b]/15 ring-1 ring-inset ring-[#e5c07b]/25"
          }`}
        />
      ))}
      {limit > 6 && <span className="ml-0.5 font-mono text-[10px] text-[#e5c07b]">/{limit}</span>}
    </span>
  );
}
