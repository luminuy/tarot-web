import React from "react";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";

export const metadata = {
  title: "นโยบายความเป็นส่วนตัว | วิหารทาโรต์ออราเคิล",
  description: "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของวิหารพยากรณ์ไพ่ทาโรต์ออนไลน์",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#05040a] text-[#e2d9f3]">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-[#e5c07b]/20">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#e5c07b] via-[#f5deaa] to-[#c59b27] bg-clip-text text-transparent">
            นโยบายความเป็นส่วนตัว
          </h1>
          <p className="text-xs text-[#9c93b8]">Privacy Policy &amp; PDPA Compliance</p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#e5c07b]">1. ข้อมูลที่เราเก็บ</h2>
          <ul className="space-y-2 text-sm text-[#cfc8e2] list-disc list-inside leading-relaxed">
            <li><strong>ชื่อเล่น</strong> — ใช้เรียกคุณในคำทำนายเท่านั้น ไม่ได้เชื่อมกับตัวตนจริง</li>
            <li><strong>คำถามและบริบทสถานการณ์</strong> — ใช้ส่งให้ AI สร้างคำทำนายเฉพาะครั้ง จัดเก็บในเบราว์เซอร์ของคุณเท่านั้น (localStorage)</li>
            <li><strong>ไพ่ที่เปิดได้</strong> — ใช้ในการตีความ จัดเก็บในเบราว์เซอร์ของคุณ</li>
            <li><strong>คะแนนความแม่นยำ</strong> — ใช้ปรับปรุงคุณภาพ AI จัดเก็บในเบราว์เซอร์ของคุณ</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#e5c07b]">2. สิ่งที่เราไม่ทำเด็ดขาด</h2>
          <ul className="space-y-2 text-sm text-[#cfc8e2] list-disc list-inside leading-relaxed">
            <li>❌ <strong>ไม่เอาข้อมูลคำถามหรือบริบทของคุณไปเทรน AI</strong> — ข้อมูลของคุณไม่ได้ถูกนำไปใช้เป็น training data</li>
            <li>❌ <strong>ไม่ขายหรือแบ่งปันข้อมูลส่วนตัวให้บุคคลที่สาม</strong></li>
            <li>❌ <strong>ไม่ติดตามตัวตนข้ามเว็บไซต์</strong> — ไม่มี third-party tracking cookies</li>
            <li>❌ <strong>ไม่เก็บข้อมูลบนเซิร์ฟเวอร์ถาวร</strong> — Session ชั่วคราวในหน่วยความจำเท่านั้น หมดอายุภายใน 1 ชั่วโมง</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#e5c07b]">3. การจัดเก็บข้อมูล</h2>
          <div className="text-sm text-[#cfc8e2] leading-relaxed space-y-2">
            <p>
              ข้อมูลทั้งหมด (ประวัติการเปิดไพ่, คำถาม, บันทึกส่วนตัว) ถูกจัดเก็บใน <strong>localStorage ของเบราว์เซอร์คุณ</strong> เท่านั้น ไม่มีข้อมูลถูกส่งไปเก็บบนเซิร์ฟเวอร์ของเรา
            </p>
            <p>
              Session การเปิดไพ่บนเซิร์ฟเวอร์เป็นแบบชั่วคราว (in-memory) และ <strong>หมดอายุอัตโนมัติภายใน 60 นาที</strong> หลังเปิดไพ่เสร็จ
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#e5c07b]">4. สิทธิของคุณ (ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 — PDPA)</h2>
          <ul className="space-y-2 text-sm text-[#cfc8e2] list-disc list-inside leading-relaxed">
            <li><strong>สิทธิในการลบข้อมูล</strong> — คุณสามารถลบประวัติการเปิดไพ่และบันทึกทั้งหมดได้ทันทีผ่านปุ่ม &quot;ลบข้อมูลทั้งหมด&quot; ด้านล่าง หรือลบ localStorage ของเบราว์เซอร์</li>
            <li><strong>สิทธิในการเข้าถึง</strong> — ข้อมูลทั้งหมดอยู่ในเครื่องคุณ คุณเปิดดูได้ตลอดเวลาผ่านสมุดบันทึกดวง</li>
            <li><strong>สิทธิในการขอไม่ให้ประมวลผล</strong> — คุณสามารถหยุดใช้งานได้ทุกเมื่อโดยไม่มีผลกระทบใดๆ</li>
          </ul>
        </section>

        {/* Section 5: AI Disclosure */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#100b20] border border-[#e5c07b]/30">
          <h2 className="text-lg font-bold text-[#e5c07b]">5. การเปิดเผยเรื่อง AI</h2>
          <div className="text-sm text-[#cfc8e2] leading-relaxed space-y-2">
            <p>
              🤖 คำทำนายทั้งหมดในเว็บไซต์นี้ <strong>สร้างโดยปัญญาประดิษฐ์ (AI)</strong> ไม่ใช่คนจริง เราไม่ได้อ้างว่าเป็นหมอดูตัวจริง และไม่มีเจตนาให้ผู้ใช้เข้าใจผิดว่ากำลังคุยกับมนุษย์
            </p>
            <p>
              &quot;แม่หมอ&quot; ในระบบคือ <strong>บุคลิก AI (Persona)</strong> ที่ถูกออกแบบมาเพื่อสร้างประสบการณ์การอ่านไพ่ที่อบอุ่นและเป็นกันเอง
            </p>
          </div>
        </section>

        {/* Section 6: Safety */}
        <section className="space-y-3 p-5 rounded-2xl bg-[#100b20] border border-rose-500/30">
          <h2 className="text-lg font-bold text-rose-400">6. ความปลอดภัยของผู้ใช้</h2>
          <div className="text-sm text-[#cfc8e2] leading-relaxed space-y-2">
            <p>ระบบของเรามีตัวกรองความปลอดภัย 2 ชั้นที่ทำงานอัตโนมัติ:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>ตรวจจับสัญญาณวิกฤตทางจิตใจ → แสดงข้อมูลสายด่วนสุขภาพจิต <strong>1323</strong> ทันที</li>
              <li>ห้าม AI วินิจฉัยโรค ทำนายสุขภาพ การตั้งครรภ์ หรือให้คำแนะนำทางการแพทย์</li>
              <li>ห้าม AI ให้คำแนะนำทางกฎหมาย ทำนายผลคดีความ</li>
              <li>ห้าม AI ให้เลขหวย ชี้แนะหุ้น คริปโต หรือแนะนำการลงทุนเฉพาะเจาะจง</li>
            </ul>
          </div>
        </section>

        {/* Delete Data */}
        <section className="pt-4 border-t border-[#e5c07b]/20 space-y-3">
          <h2 className="text-lg font-bold text-rose-400">ลบข้อมูลทั้งหมดของฉัน</h2>
          <p className="text-xs text-[#9c93b8]">
            การดำเนินการนี้จะลบประวัติการเปิดไพ่ บันทึก คะแนน และข้อมูลทั้งหมดที่เก็บไว้ในเบราว์เซอร์ของคุณอย่างถาวร
          </p>
          <DeleteAllDataButton />
        </section>

        {/* Back to Home */}
        <div className="text-center pt-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#c59b27] via-[#f5deaa] to-[#e5c07b] text-[#05040a] font-bold text-sm shadow-lg hover:opacity-90 transition-all"
          >
            ← กลับสู่วิหารทาโรต์
          </a>
        </div>
      </div>
    </main>
  );
}
