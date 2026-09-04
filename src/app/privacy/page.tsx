import React from "react";
import type { Metadata } from "next";
import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";
import { SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัวและ PDPA",
  description: "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของวิหารพยากรณ์ไพ่ทาโรต์ออนไลน์",
  // ⚠️ ทุกหน้าต้องประกาศ canonical ของตัวเอง — Next.js สืบทอด metadata จาก layout แม่
  // หน้านี้อยู่ใน sitemap แต่เคยประกาศ canonical ชี้กลับหน้าแรก = ขัดกันเองจนไม่ถูก index
  alternates: { canonical: `${SITE_ORIGIN}/privacy` },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F]">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-[#D5CEC2]/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#29261F] font-serif-th">นโยบายความเป็นส่วนตัว</h1>
          <p className="text-xs text-[#635B4E]">Privacy Policy &amp; PDPA Compliance</p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">1. ข้อมูลที่เราเก็บ</h2>
          <ul className="space-y-2 text-sm text-[#29261F] list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>ชื่อและรูปโปรไฟล์</strong> — หากคุณเข้าสู่ระบบผ่าน Google หรือ LINE
              เพื่อระบุตัวตนและแสดงผลในสมุดบันทึก
            </li>
            <li>
              <strong>อีเมล (ไม่บังคับ)</strong> — ใช้สำหรับส่งสรุปดวงหรือการเตือนติดตามผลคำทำนาย{" "}
              <em>เฉพาะเมื่อคุณให้ความยินยอม (Consent) เท่านั้น</em>
            </li>
            <li>
              <strong>ชื่อเล่น</strong> — ใช้เรียกคุณในคำทำนายอย่างอบอุ่น
            </li>
            <li>
              <strong>คำถามและไพ่ที่เปิดได้</strong> — ใช้สร้างคำทำนายและบันทึกประวัติการดูดวง
            </li>
            <li>
              <strong>บันทึกส่วนตัวและผลจริง (Outcome &amp; Note)</strong> — เพื่อให้คุณติดตามผลความแม่นยำในชีวิตจริง
            </li>
            <li>
              <strong>คุกกี้นับสิทธิ์ทดลอง (tarot_guest)</strong> — คุกกี้แบบ first-party (เฉพาะเว็บนี้)
              เก็บเพียงรหัสสุ่มและจำนวนครั้งที่ทดลองเปิดไพ่ฟรี ไม่มีข้อมูลส่วนบุคคล ไม่ใช้ติดตามข้ามเว็บ ·
              คุณลบได้จากการตั้งค่าเบราว์เซอร์ (จะได้สิทธิ์ทดลองใหม่)
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">2. สิ่งที่เราไม่ทำเด็ดขาด</h2>
          <ul className="space-y-2 text-sm text-[#29261F] list-disc list-inside leading-relaxed font-serif-th">
            <li>
              ✦ <strong>ไม่เอาข้อมูลคำถามหรือบันทึกของคุณไปเทรนโมเดล AI</strong> — ข้อมูลการดูดวงเป็นเรื่องส่วนบุคคล
            </li>
            <li>
              ✦ <strong>ไม่ขายหรือส่งต่อข้อมูลส่วนตัวให้บุคคลที่สาม</strong>
            </li>
            <li>
              ✦ <strong>ไม่ติดตามตัวตนข้ามเว็บไซต์ (No cross-site tracking)</strong>
            </li>
            <li>
              ✦ <strong>ไม่ส่งอีเมลโฆษณาโดยที่คุณไม่ยินยอม</strong>
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">
            3. การจัดเก็บข้อมูล (Data Retention &amp; Storage)
          </h2>
          <div className="text-sm text-[#29261F] leading-relaxed space-y-2 font-serif-th">
            <p>
              <strong>สำหรับผู้ใช้ทั่วไป (ไม่เข้าสู่ระบบ):</strong> ข้อมูลทั้งหมดจัดเก็บใน{" "}
              <strong>localStorage บนเบราว์เซอร์ของคุณเท่านั้น</strong>{" "}
              เซสชันการประมวลผลคำทำนายชั่วคราวบนเซิร์ฟเวอร์จะหมดอายุอัตโนมัติภายใน 2 ชั่วโมง
            </p>
            <p>
              <strong>สำหรับผู้ใช้ที่เข้าสู่ระบบ:</strong> บันทึกประวัติดูดวงจะถูกจัดเก็บอย่างปลอดภัยบน Cloudflare D1
              Database เพื่อให้คุณสามารถเปิดอ่านและซิงก์ประวัติข้ามอุปกรณ์ได้
              โดยคุณสามารถขอดาวน์โหลดหรือสั่งลบข้อมูลทั้งหมดได้ตลอดเวลา
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">
            4. สิทธิของคุณตามกฎหมาย PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)
          </h2>
          <ul className="space-y-2 text-sm text-[#29261F] list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>สิทธิในการลบข้อมูล (Right to Erasure)</strong> —
              สั่งลบประวัติและบัญชีทั้งหมดได้ทันทีผ่านปุ่มด้านล่าง
            </li>
            <li>
              <strong>สิทธิในการขอรับและโอนย้ายข้อมูล (Data Portability)</strong> —
              ดาวน์โหลดข้อมูลประวัติดูดวงของคุณเป็นไฟล์ JSON ครบถ้วน
            </li>
            <li>
              <strong>สิทธิในการถอนความยินยอม (Right to Withdraw Consent)</strong> —
              ปิดรับอีเมลติดตามผลหรือข่าวสารได้ตลอดเวลาในการตั้งค่าบัญชี
            </li>
            <li>
              <strong>สิทธิในการเข้าถึงและแก้ไขข้อมูล (Right of Access)</strong> —
              ตรวจสอบและแก้ไขบันทึกผลลัพธ์ดวงชะตาได้ในสมุดบันทึก
            </li>
          </ul>
        </section>

        {/* Section 5: AI Disclosure */}
        <section className="space-y-3 p-5 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] shadow-[0_10px_30px_rgba(42,38,31,0.04)]">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">
            5. การเปิดเผยเรื่อง AI (AI Transparency Disclosure)
          </h2>
          <div className="text-sm text-[#29261F] leading-relaxed space-y-2 font-serif-th">
            <p>
              ✦ คำทำนายทั้งหมดในวิหารนี้ <strong>สร้างขึ้นโดยปัญญาประดิษฐ์ (AI)</strong>{" "}
              ร่วมกับระบบสุ่มไพ่ทางคณิตศาสตร์ที่ตรวจสอบความโปร่งใสได้ (Provably-Fair)
            </p>
            <p>
              &quot;แม่หมอ&quot; ในระบบคือ <strong>บุคลิก AI (Persona)</strong> ที่ถูกออกแบบมาเพื่อมอบมุมมอง
              คำแนะนำเชิงบวก และพลังใจ ไม่ใช่การคุยกับหมอดูมนุษย์จริง
            </p>
          </div>
        </section>

        {/* Section 6: Safety */}
        <section className="space-y-3 p-5 rounded-xl bg-[#FFFFFF] border border-[#D5CEC2] shadow-[0_10px_30px_rgba(42,38,31,0.04)]">
          <h2 className="text-lg font-bold text-[#A6392C] font-serif-th">
            6. ความปลอดภัยของผู้ใช้ (Safety Guardrails)
          </h2>
          <div className="text-sm text-[#A6392C] leading-relaxed space-y-2 font-serif-th">
            <p>ระบบของเรามีตัวกรองความปลอดภัยที่ทำงานตลอดเวลา:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                ตรวจจับสัญญาณวิกฤตทางจิตใจ → แสดงสายด่วนสุขภาพจิต <strong>1323</strong> ทันที
              </li>
              <li>ห้าม AI วินิจฉัยโรค ทำนายสุขภาพ การตั้งครรภ์ หรือให้คำแนะนำทางการแพทย์</li>
              <li>ห้าม AI ให้คำแนะนำทางกฎหมายหรือทำนายผลคดีความ</li>
              <li>ห้าม AI ชี้แนะหุ้น คริปโต หรือการลงทุนที่มีความเสี่ยงทางการเงิน</li>
            </ul>
          </div>
        </section>

        {/* Section 7: Export & Delete Data */}
        <section className="pt-4 border-t border-[#D5CEC2]/40 space-y-4 font-serif-th">
          <h2 className="text-lg font-bold text-[#A58A5C]">7. จัดการข้อมูลส่วนบุคคลของคุณ</h2>
          <p className="text-xs text-[#635B4E]">
            คุณสามารถดาวน์โหลดสำเนาข้อมูลของคุณ หรือสั่งลบข้อมูลทั้งหมดทั้งในเครื่องและบนระบบเซิร์ฟเวอร์ได้อย่างสมบูรณ์
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/account/export"
              download
              className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] text-[#29261F] text-xs font-bold hover:bg-[#F3F0EA] hover:border-[#A58A5C] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <span>✦</span>
              <span>ดาวน์โหลดข้อมูลของฉัน (Export JSON)</span>
            </a>
            <DeleteAllDataButton />
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center pt-6 font-serif-th">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#29261F] hover:bg-[#A58A5C] text-[#F3F0EA] font-bold text-sm transition-all shadow-sm"
          >
            ← กลับสู่วิหารทาโรต์
          </a>
        </div>
      </div>
    </main>
  );
}
