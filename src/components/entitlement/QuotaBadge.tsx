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

export function QuotaBadge({ onOpenBuyCredits }: { onOpenBuyCredits?: () => void }) {
  const ent = useEntitlement();
  if (!ent || !ent.enabled) return null;

  const isGuest = ent.kind === "guest";
  const remaining = ent.remaining ?? 0;

  const text = isGuest
    ? remaining > 0
      ? "ทดลองฟรี 1 ครั้ง"
      : "ทดลองฟรีครบแล้ว"
    : remaining > 0
      ? `เหลือ ${remaining} ครั้งวันนี้`
      : "ครบโควตาวันนี้ · รีเซ็ตเที่ยงคืน";

  const dim = remaining === 0;

  return (
    <button
      type="button"
      onClick={!isGuest ? onOpenBuyCredits : undefined}
      title={
        !isGuest
          ? `โควตาวันนี้ ${ent.dailyRemaining ?? ent.weeklyRemaining} + โบนัส ${ent.bonusRemaining} (คลิกเพื่อเติมโควตาเพิ่ม)`
          : undefined
      }
      className={`hidden sm:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-serif-th font-semibold whitespace-nowrap transition-all select-none ${
        dim
          ? "border-[#9c93b8]/30 bg-[#140b24]/60 text-[#9c93b8]"
          : "border-[#e5c07b]/40 bg-[#140b24] text-[#f5deaa] hover:border-[#ffd700] hover:bg-[#1f1038] cursor-pointer"
      }`}
    >
      <span className="text-[#e5c07b]">✦</span>
      <span>{text}</span>
      {!isGuest && (
        <span className="text-[9px] px-1 py-0.2 rounded bg-[#e5c07b]/20 text-[#ffd700] font-mono font-bold hover:bg-[#e5c07b]/35">
          +เติม
        </span>
      )}
    </button>
  );
}
