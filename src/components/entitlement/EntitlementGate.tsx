"use client";

import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * แสดงแทนหน้าเลือกผังเมื่อสิทธิ์เปิดไพ่หมด
 * - ผู้เยี่ยมชม: ปุ่มสมัคร
 * - สมาชิก: วันรีเซ็ต
 * ธงปิด หรือยังมีสิทธิ์ → ไม่แสดง (render children ต่อ)
 *
 * ใช้แบบ: <EntitlementGate active={currentStep === "SPREAD_SELECT"} onOpenAuth={...}>{หน้าเลือกผัง}</EntitlementGate>
 */
function fullResetLabel(iso: string | null): string {
  if (!iso) return "เร็ว ๆ นี้";
  const d = new Date(iso);
  const days = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  return `วัน${days[d.getDay()]}`;
}

export function EntitlementGate({
  active,
  onOpenAuth,
  children,
}: {
  active: boolean;
  onOpenAuth: () => void;
  children: React.ReactNode;
}) {
  const ent = useEntitlement();

  const blocked = active && !!ent && ent.enabled && !ent.canStartReading;
  if (!blocked) return <>{children}</>;

  const isGuest = ent!.kind === "guest";

  return (
    <div className="altar-panel mx-auto max-w-md rounded-3xl p-8 text-center space-y-5">
      <div className="text-3xl text-[#e5c07b]">✦</div>
      {isGuest ? (
        <>
          <h2 className="font-serif-th text-lg font-bold font-mystic-gold">ครั้งแรกจบแล้ว</h2>
          <p className="font-serif-th text-sm leading-relaxed text-[#cfc8e2]">
            สมัครสมาชิกเพื่อเปิดไพ่ต่อสัปดาห์ละ 3 ครั้ง คุยถามแม่หมอต่อได้ และเก็บดวงไว้ดูย้อนหลังทุกเครื่อง
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-3 font-serif-th text-sm font-bold text-[#05040a] shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all hover:opacity-95 active:scale-[0.98]"
          >
            สมัคร / เข้าสู่ระบบ
          </button>
        </>
      ) : (
        <>
          <h2 className="font-serif-th text-lg font-bold font-mystic-gold">ไพ่สำหรับสัปดาห์นี้ปิดวงแล้ว</h2>
          <p className="font-serif-th text-sm leading-relaxed text-[#cfc8e2]">
            กลับมาเปิดไพ่ใหม่ได้{" "}
            <strong className="text-[#f5deaa]">{fullResetLabel(ent!.resetAt)} 00:00 น.</strong>
            <br />
            ระหว่างนี้ยังเปิดดูดวงเดิม สารานุกรมไพ่ และคลังผังได้ตามปกติ
          </p>
        </>
      )}
    </div>
  );
}
