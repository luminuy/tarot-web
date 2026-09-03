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
    <main className="min-h-screen bg-[#F0E8DB] text-[#2E211A] p-4 sm:p-8 font-sans selection:bg-[#8F5C1A]/30 selection:text-[#2E211A]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#E4D8C4]/30 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#2E211A] hover:text-[#8F5C1A] transition-colors font-serif-th py-1.5 px-3 rounded-lg bg-[#FFFFFF] border border-[#E4D8C4] "
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#6F5B4A]">User Sanctuary & Privacy</span>
        </div>

        <div className="text-center space-y-2 py-4">
          {/* ต้องมี wrapper ระดับ block คั่น — `.font-mystic-gold` เป็น display:inline-block
              ถ้าวางชิดกับ inline-flex หัวข้อจะไหลไปอยู่บรรทัดเดียวกับป้าย */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#E4D8C4] bg-[#FFFFFF] text-[11px] text-[#8F5C1A] font-bold ">
              <span>✦</span> Sacred Sanctuary Profile <span>✦</span>
            </span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold">บัญชีและประวัติของคุณ</h1>
          <p className="text-xs sm:text-sm text-[#6F5B4A] max-w-lg mx-auto">
            ควบคุมข้อมูลความเป็นส่วนตัว ประวัติคำทำนาย และการตั้งค่าตามสิทธิ์ PDPA
          </p>
        </div>

        {/* สิทธิ์การเปิดไพ่คงเหลือ · โควตารายวัน · โบนัสสะสม */}
        <EntitlementStatusCard />

        {/* Change Password & Security Card */}
        <ChangePasswordCard />

        {/* Privacy & PDPA Control Card */}
        <div className="rounded-lg border border-[#E4D8C4] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 ">
          <div className="flex items-center gap-2">
            <span className="text-[#8F5C1A]">✦</span>
            <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
              ความเป็นส่วนตัวและการจัดเก็บข้อมูล
            </h2>
          </div>
          <p className="text-xs text-[#6F5B4A] leading-relaxed">
            ระบบของเรายึดหลักความเป็นส่วนตัวระดับสูงสุด ข้อมูลคำถามและประวัติการดูดวงทั้งหมดจะถูกจัดเก็บในเครื่องของคุณ
            (Local Storage) เท่านั้น โดยไม่มีการเก็บถาวรบนเซิร์ฟเวอร์
          </p>
          <div className="pt-3 border-t border-[#E4D8C4]/30 flex items-center justify-between flex-wrap gap-3">
            <Link href="/privacy" className="text-xs text-[#8F5C1A] hover:text-[#2E211A] underline font-bold">
              อ่านนโยบายความเป็นส่วนตัว (PDPA)
            </Link>
            <DeleteAllDataButton />
          </div>
        </div>
      </div>
    </main>
  );
}
