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
    <main className="min-h-screen bg-[#FCF0E6] text-[#5A432F] p-4 sm:p-8 font-sans selection:bg-[#CD9F5B]/30 selection:text-[#5A432F]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#D6B48D]/30 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#5A432F] hover:text-[#CD9F5B] transition-colors font-serif-th py-1.5 px-3 rounded-2xl bg-[#FDF7F0] border border-[#D6B48D] shadow-xs"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <span className="text-xs font-mono text-[#8C735D]">User Sanctuary & Privacy</span>
        </div>

        <div className="text-center space-y-2 py-4">
          {/* ต้องมี wrapper ระดับ block คั่น — `.font-mystic-gold` เป็น display:inline-block
              ถ้าวางชิดกับ inline-flex หัวข้อจะไหลไปอยู่บรรทัดเดียวกับป้าย */}
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D6B48D] bg-[#FDF7F0] text-[11px] text-[#CD9F5B] font-bold shadow-xs">
              <span>✦</span> Sacred Sanctuary Profile <span>✦</span>
            </span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold">
            บัญชีและประวัติของคุณ
          </h1>
          <p className="text-xs sm:text-sm text-[#8C735D] max-w-lg mx-auto">
            ควบคุมข้อมูลความเป็นส่วนตัว ประวัติคำทำนาย และการตั้งค่าตามสิทธิ์ PDPA
          </p>
        </div>

        {/* สิทธิ์การเปิดไพ่คงเหลือ · โควตารายวัน · โบนัสสะสม */}
        <EntitlementStatusCard />

        {/* Change Password & Security Card */}
        <ChangePasswordCard />

        {/* Privacy & PDPA Control Card */}
        <div className="rounded-[1.618rem] border border-[#D6B48D] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#CD9F5B]">✦</span>
            <h2 className="font-serif-th text-base sm:text-lg font-bold font-mystic-gold">
              ความเป็นส่วนตัวและการจัดเก็บข้อมูล
            </h2>
          </div>
          <p className="text-xs text-[#8C735D] leading-relaxed">
            ระบบของเรายึดหลักความเป็นส่วนตัวระดับสูงสุด ข้อมูลคำถามและประวัติการดูดวงทั้งหมดจะถูกจัดเก็บในเครื่องของคุณ (Local Storage) เท่านั้น โดยไม่มีการเก็บถาวรบนเซิร์ฟเวอร์
          </p>
          <div className="pt-3 border-t border-[#D6B48D]/30 flex items-center justify-between flex-wrap gap-3">
            <Link
              href="/privacy"
              className="text-xs text-[#CD9F5B] hover:text-[#5A432F] underline font-bold"
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
