import React from "react";
import Link from "next/link";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";
import { EntitlementStatusCard } from "@/components/entitlement/EntitlementStatusCard";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";

export const metadata = {
  title: "บัญชีและประวัติการดูดวง | Sacred Account Sanctuary",
  description: "จัดการข้อมูลส่วนบุคคล สิทธิ์ความเป็นส่วนตัว และบันทึกประวัติการดูดวงไพ่ทาโรต์",
};

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#9c93b8]">User Sanctuary & Privacy</span>
        </div>

        <div className="text-center space-y-2 py-4">
          {/* ต้องมี wrapper ระดับ block คั่น — `.font-mystic-gold` เป็น display:inline-block
              ถ้าวางชิดกับ inline-flex หัวข้อจะไหลไปอยู่บรรทัดเดียวกับป้าย */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24] text-[11px] text-[#e5c07b]">
              <span>✦</span> Sacred Sanctuary Profile <span>✦</span>
            </span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold">
            บัญชีและประวัติของคุณ
          </h1>
          <p className="text-xs sm:text-sm text-[#9c93b8] max-w-lg mx-auto">
            ควบคุมข้อมูลความเป็นส่วนตัว ประวัติคำทำนาย และการตั้งค่าตามสิทธิ์ PDPA
          </p>
        </div>

        {/* สิทธิ์การเปิดไพ่คงเหลือ · โควตารายวัน · โบนัสสะสม */}
        <EntitlementStatusCard />

        {/* Change Password & Security Card */}
        <ChangePasswordCard />

        {/* Privacy & PDPA Control Card */}
        <div className="rounded-2xl border border-[#e5c07b]/25 bg-gradient-to-b from-[#130d24]/90 to-[#07040f]/90 p-5 sm:p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-[#ffd700]">✦</span>
            <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
              ความเป็นส่วนตัวและการจัดเก็บข้อมูล
            </h2>
          </div>
          <p className="text-xs text-[#9c93b8] leading-relaxed">
            ระบบของเรายึดหลักความเป็นส่วนตัวระดับสูงสุด ข้อมูลคำถามและประวัติการดูดวงทั้งหมดจะถูกจัดเก็บในเครื่องของคุณ (Local Storage) เท่านั้น โดยไม่มีการเก็บถาวรบนเซิร์ฟเวอร์
          </p>
          <div className="pt-3 border-t border-[#e5c07b]/15 flex items-center justify-between flex-wrap gap-3">
            <Link
              href="/privacy"
              className="text-xs text-[#e5c07b] hover:text-[#ffd700] underline"
            >
              อ่านนโยบายความเป็นส่วนตัว (PDPA)
            </Link>
            <DeleteAllDataButton />
          </div>
        </div>
      </div>
    </main>
  );
}
