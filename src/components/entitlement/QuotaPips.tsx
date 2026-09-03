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
      ? "bg-[#8C735D]/30"
      : tone === "low"
      ? "bg-[#CD9F5B] shadow-xs"
      : "bg-[#CD9F5B] shadow-xs";

  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`${dot} rounded-full transition-colors duration-300 ${
            i < lit ? litClass : "bg-[#D6B48D]/30 ring-1 ring-inset ring-[#D6B48D]/40"
          }`}
        />
      ))}
      {limit > 6 && <span className="ml-0.5 font-mono text-[10px] text-[#5A432F]">/{limit}</span>}
    </span>
  );
}
