"use client";

import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * ป้ายบอกสิทธิ์เปิดไพ่คงเหลือ — วางข้าง UserProfileBadge บนแถบหัว
 * ธงปิด → ไม่แสดงอะไร (enabled=false)
 */
function resetLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const days = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
  return `รีเซ็ตวัน${days[d.getDay()]}`;
}

export function QuotaBadge() {
  const ent = useEntitlement();
  if (!ent || !ent.enabled) return null;

  const isGuest = ent.kind === "guest";
  const remaining = ent.remaining ?? 0;

  const text = isGuest
    ? remaining > 0
      ? "ทดลองฟรี 1 ครั้ง"
      : "ทดลองฟรีครบแล้ว"
    : remaining > 0
      ? `เปิดได้อีก ${remaining} ครั้ง · ${resetLabel(ent.resetAt)}`
      : `ปิดวงสัปดาห์นี้ · ${resetLabel(ent.resetAt)}`;

  const dim = remaining === 0;

  return (
    <span
      title={
        !isGuest && (ent.bonusRemaining ?? 0) > 0
          ? `รายสัปดาห์ ${ent.weeklyRemaining} + โบนัส ${ent.bonusRemaining}`
          : undefined
      }
      className={`hidden sm:inline-flex items-center gap-1 rounded-xl border px-2.5 py-1 text-[10px] font-serif-th font-semibold whitespace-nowrap ${
        dim
          ? "border-[#9c93b8]/30 bg-[#140b24]/60 text-[#9c93b8]"
          : "border-[#e5c07b]/40 bg-[#140b24] text-[#f5deaa]"
      }`}
    >
      <span className="text-[#e5c07b]">✦</span>
      {text}
    </span>
  );
}
