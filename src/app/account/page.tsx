import type { Metadata } from "next";
import Link from "next/link";
import { ChangePasswordCard } from "@/components/account/ChangePasswordCard";
import { EntitlementStatusCard } from "@/components/entitlement/EntitlementStatusCard";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";

export const metadata: Metadata = {
  title: "บัญชีและประวัติการดูดวง",
  description: "จัดการข้อมูลส่วนบุคคล สิทธิ์ความเป็นส่วนตัว และบันทึกประวัติการดูดวงไพ่ทาโรต์",
  // หน้าส่วนตัว — ต้อง noindex ไม่ใช่พึ่ง robots.txt อย่างเดียว
  // เพราะเมื่อบอตคลานไม่ได้ มันก็ "อ่านไม่เห็น" ว่าห้าม index แล้ว URL ยังโผล่ใน SERP ได้
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans selection:bg-[#A58A5C]/20 selection:text-[#29261F]">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-3 sm:space-y-4 py-4 sm:py-6">
          {/* ต้องมี wrapper ระดับ block คั่น — `.font-mystic-gold` เป็น display:inline-block
              ถ้าวางชิดกับ inline-flex หัวข้อจะไหลไปอยู่บรรทัดเดียวกับป้าย */}
          <div>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-[13px] text-[#A58A5C] font-bold shadow-xs">
              <span>✦</span> Sacred Sanctuary Profile <span>✦</span>
            </span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold text-[#29261F] leading-snug sm:leading-normal pt-1 [text-wrap:balance]">
            บัญชีและประวัติของคุณ
          </h1>
          <p className="text-xs sm:text-sm text-[#635B4E] max-w-lg mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
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
          <p className="text-xs text-[#635B4E] leading-relaxed">
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
