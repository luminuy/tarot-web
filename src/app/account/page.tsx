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
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans selection:bg-[#A58A5C]/20 selection:text-[#29261F]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#D5CEC2]/40 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#29261F] hover:text-[#A58A5C] transition-colors font-serif-th py-2 px-4 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] shadow-xs"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#756F66]">User Sanctuary &amp; Privacy</span>
        </div>

        <div className="text-center space-y-2 py-4">
          {/* ต้องมี wrapper ระดับ block คั่น — `.font-mystic-gold` เป็น display:inline-block
              ถ้าวางชิดกับ inline-flex หัวข้อจะไหลไปอยู่บรรทัดเดียวกับป้าย */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-[11px] text-[#A58A5C] font-bold shadow-xs">
              <span>✦</span> Sacred Sanctuary Profile <span>✦</span>
            </span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-[#29261F]">บัญชีและประวัติของคุณ</h1>
          <p className="text-xs sm:text-sm text-[#756F66] max-w-lg mx-auto">
            ควบคุมข้อมูลความเป็นส่วนตัว ประวัติคำทำนาย และการตั้งค่าตามสิทธิ์ PDPA
          </p>
        </div>

        {/* สิทธิ์การเปิดไพ่คงเหลือ · โควตารายวัน · โบนัสสะสม */}
        <EntitlementStatusCard />

        {/* Change Password & Security Card */}
        <ChangePasswordCard />

        {/* Privacy & PDPA Control Card */}
        <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 shadow-[0_10px_30px_rgba(42,38,31,0.06)]">
          <div className="flex items-center gap-2">
            <span className="text-[#A58A5C]">✦</span>
            <h2 className="font-serif-th text-base sm:text-lg font-bold text-[#29261F]">
              ความเป็นส่วนตัวและการจัดเก็บข้อมูล
            </h2>
          </div>
          <p className="text-xs text-[#756F66] leading-relaxed">
            ระบบของเรายึดหลักความเป็นส่วนตัวระดับสูงสุด ข้อมูลคำถามและประวัติการดูดวงทั้งหมดจะถูกจัดเก็บในเครื่องของคุณ
            (Local Storage) เท่านั้น โดยไม่มีการเก็บถาวรบนเซิร์ฟเวอร์
          </p>
          <div className="pt-3 border-t border-[#D5CEC2]/40 flex items-center justify-between flex-wrap gap-3">
            <Link href="/privacy" className="text-xs text-[#A58A5C] hover:text-[#29261F] underline font-bold">
              อ่านนโยบายความเป็นส่วนตัว (PDPA)
            </Link>
            <DeleteAllDataButton />
          </div>
        </div>
      </div>
    </main>
  );
}
