"use client";

import { useEntitlement } from "@/lib/entitlement/use-entitlement";

/**
 * แสดงแทนหน้าเลือกผังเมื่อสิทธิ์เปิดไพ่หมด
 * - ผู้เยี่ยมชม: บล็อกเมื่อใช้สิทธิ์ฟรี 1 ครั้งแล้ว พร้อมปุ่มเข้าสู่ระบบ/สมัครสมาชิก
 * - สมาชิก: บล็อกเมื่อใช้โควตารายวัน (3 ครั้ง/วัน) ครบแล้ว พร้อมปุ่มเติมรอบเพิ่ม
 */
export function EntitlementGate({
  active,
  onOpenAuth,
  onOpenBuyCredits,
  children,
}: {
  active: boolean;
  onOpenAuth: () => void;
  onOpenBuyCredits?: () => void;
  children: React.ReactNode;
}) {
  const ent = useEntitlement();

  const blocked = active && !!ent && ent.enabled && !ent.canStartReading;
  if (!blocked) return <>{children}</>;

  const isGuest = ent!.kind === "guest";

  return (
    <div className="altar-panel mx-auto max-w-md rounded-3xl p-8 text-center space-y-5 border border-[#e5c07b]/40 shadow-[0_0_50px_rgba(0,0,0,0.85)]">
      <div className="text-3xl text-[#ffd700] filter drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">✦</div>
      {isGuest ? (
        <>
          <h2 className="font-serif-th text-xl font-bold bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] bg-clip-text text-transparent">
            สิทธิ์ดูดวงฟรี 1 ครั้งถูกใช้แล้ว
          </h2>
          <p className="font-serif-th text-sm leading-relaxed text-[#cfc8e2]">
            สมัครสมาชิกร่วมผูกดวงฟรี เพื่อรับสิทธิ์เปิดไพ่วันละ 3 ครั้ง คุยถามเจาะลึกกับแม่หมอต่อได้ และบันทึกประวัติดวงชะตาข้ามอุปกรณ์
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="w-full rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-3.5 font-serif-th text-sm font-bold text-[#05040a] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer"
          >
            ✦ สมัครสมาชิก / เข้าสู่ระบบ
          </button>
        </>
      ) : (
        <>
          <h2 className="font-serif-th text-xl font-bold bg-gradient-to-r from-[#d4af37] via-[#f7e7b4] to-[#c59b27] bg-clip-text text-transparent">
            โควตาดูดวงวันนี้ครบ 3 ครั้งแล้ว
          </h2>
          <p className="font-serif-th text-sm leading-relaxed text-[#cfc8e2]">
            โควตาฟรีประจำวัน (3 ครั้ง/วัน) จะรีเซ็ตใหม่ในวันพรุ่งนี้เวลา <strong className="text-[#ffd700]">00:00 น.</strong>
            <br />
            หากต้องการเปิดไพ่ถามดวงต่อทันที สามารถเลือกเติมรอบการเปิดไพ่ได้
          </p>

          <div className="pt-2 space-y-3">
            {onOpenBuyCredits && (
              <button
                type="button"
                onClick={onOpenBuyCredits}
                className="w-full rounded-2xl bg-gradient-to-r from-[#d4af37] via-[#f3e5ab] to-[#c59b27] px-6 py-3.5 font-serif-th text-sm font-bold text-[#05040a] shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all hover:opacity-95 active:scale-[0.98] cursor-pointer"
              >
                ✦ ซื้อรอบเปิดไพ่เพิ่มทันที (เริ่มต้น 59.-)
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
