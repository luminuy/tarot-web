import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";

const privacyOgImages = buildPageOgImage({
  title: "นโยบายความเป็นส่วนตัวและ PDPA",
  eyebrow: "ความปลอดภัยและสิทธิข้อมูล",
  cardImage: "major-11.jpg",
  alt: "นโยบายความเป็นส่วนตัวและ PDPA SeerTarot",
});

export const privacyMetadataTh: Metadata = {
  title: "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA)",
  description:
    "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA B.E. 2562) และมาตรฐานสากลของวิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ SeerTarot",
  alternates: buildAlternates("/privacy", { englishTwin: true }),
  openGraph: {
    title: "นโยบายความเป็นส่วนตัวและ PDPA · SeerTarot",
    description:
      "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA B.E. 2562) และมาตรฐานสากลของวิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ SeerTarot",
    url: `${SITE_ORIGIN}/privacy`,
    siteName: "SeerTarot",
    type: "website",
    images: privacyOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "นโยบายความเป็นส่วนตัวและ PDPA · SeerTarot",
    description:
      "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล (PDPA B.E. 2562) และมาตรฐานสากลของวิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ SeerTarot",
    images: [privacyOgImages[0].url],
  },
};

/** `deleteButton` = ปุ่มลบข้อมูลทั้งหมด (island ตัวเดียวของหน้านี้) ส่งเข้ามาจากข้างนอก */
export function PrivacyBodyTh({ deleteButton }: { deleteButton: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-line/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif-th">
            นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคล
          </h1>
          <p className="text-xs text-muted">
            กรอบการปฏิบัติตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และมาตรฐานสากล (GDPR / CCPA)
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold font-serif-th">1. ข้อมูลที่เราเก็บ</h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>การระบุตัวตนและโปรไฟล์ (OAuth)</strong> — หากคุณเข้าสู่ระบบผ่าน Google หรือ LINE
              เราประมวลผลชื่อที่แสดง รูปโปรไฟล์ และรหัสประจำตัวบัญชีเพื่อระบุตัวตน รักษาความปลอดภัย
              และซิงก์สมุดบันทึกดวงชะตาข้ามอุปกรณ์ของคุณ
            </li>
            <li>
              <strong>บัญชีอีเมลและรหัสผ่าน (กรณีลงทะเบียนด้วยอีเมล)</strong> — เราจัดเก็บเฉพาะอีเมลและค่าแฮชของรหัสผ่านแบบเค็ม
              (PBKDF2/SHA-256) โดยไม่มีการจัดเก็บรหัสผ่านจริงในระบบเด็ดขาด
            </li>
            <li>
              <strong>อีเมลสำหรับการแจ้งเตือน (ไม่บังคับ)</strong> — ใช้สำหรับส่งสรุปดวงประจำวัน (Daily Digest)
              หรือการติดตามผลคำทำนาย <em>เฉพาะเมื่อคุณให้ความยินยอม (Consent) อย่างชัดแจ้งเท่านั้น</em> โดยคุณสามารถยกเลิกได้ตลอดเวลา
            </li>
            <li>
              <strong>ชื่อเล่นที่ต้องการให้เรียก</strong> — ใช้สำหรับเรียกคุณในคำทำนายอย่างอบอุ่นและเป็นกันเอง
            </li>
            <li>
              <strong>คำถามและไพ่ที่เปิดได้</strong> — ใช้ประมวลผลคำทำนายแบบเรียลไทม์ และบันทึกประวัติในสมุดบันทึกดวงชะตา
            </li>
            <li>
              <strong>บันทึกส่วนตัวและผลจริงในชีวิต (Outcome &amp; Note)</strong> — ข้อความสะท้อนความคิดและผลลัพธ์จริงที่คุณบันทึกเพิ่มเติมเพื่อประเมินความแม่นยำในชีวิตจริงของคุณเอง ข้อมูลนี้เป็นความลับส่วนบุคคลสูงสุด
            </li>
            <li>
              <strong>คุกกี้นับสิทธิ์ทดลอง (tarot_guest)</strong> — คุกกี้แบบ first-party ที่จำเป็นต่อการทำงาน (ไม่มีข้อมูลส่วนบุคคล ไม่ใช้ติดตามข้ามเว็บ)
              เก็บเพียงรหัสสุ่มและจำนวนครั้งที่ทดลองเปิดไพ่ฟรี คุณสามารถลบได้จากการตั้งค่าเบราว์เซอร์ได้ตลอดเวลา
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold font-serif-th">2. สิ่งที่เราไม่ทำเด็ดขาด (คำมั่นสัญญาความปลอดภัย)</h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>ไม่นำข้อมูลคำถามหรือบันทึกของคุณไปเทรนโมเดล AI</strong> — ข้อมูลการเปิดไพ่และการสะท้อนความคิดเป็นเรื่องส่วนบุคคลสูงสุด จะไม่มีการนำไปใช้ฝึกฝน ปรับแต่ง หรือป้อนเข้าสู่โมเดลปัญญาประดิษฐ์ใด ๆ ทั้งสิ้น
            </li>
            <li>
              <strong>ไม่ขาย ให้เช่า หรือเป็นนายหน้าส่งต่อข้อมูลส่วนบุคคล</strong> — เราไม่ขายหรือแลกเปลี่ยนข้อมูลของคุณแก่บริษัทโฆษณา นายหน้าค้าข้อมูล (Data Brokers) หรือบุคคลภายนอกไม่ว่าในกรณีใดทั้งสิ้น
            </li>
            <li>
              <strong>ไม่ติดตามตัวตนข้ามเว็บไซต์ (No Cross-Site Tracking)</strong> — เราไม่ใช้คุกกี้บุคคลที่สามหรือเทคโนโลยีติดตามพฤติกรรมของคุณบนเว็บไซต์ภายนอก
            </li>
            <li>
              <strong>ไม่ส่งอีเมลโฆษณาโดยไม่ได้รับความยินยอม</strong> — เราไม่ส่งข้อความส่งเสริมการขายหรือสแปมใด ๆ โดยปราศจากการขอความยินยอมล่วงหน้าอย่างโปร่งใส
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold font-serif-th">
            3. การจัดเก็บข้อมูลและสถาปัตยกรรมคลาวด์ (Data Retention &amp; Storage)
          </h2>
          <div className="text-sm text-ink leading-relaxed space-y-2 font-serif-th">
            <p>
              <strong>สำหรับผู้ใช้ทั่วไป (ไม่เข้าสู่ระบบ):</strong> ข้อมูลประวัติการเปิดไพ่ทั้งหมดจัดเก็บใน{" "}
              <strong>localStorage บนเบราว์เซอร์ของคุณเท่านั้น</strong>{" "}
              เซสชันการประมวลผลคำทำนายชั่วคราวบนเซิร์ฟเวอร์จะหมดอายุอัตโนมัติภายใน 2 ชั่วโมง
            </p>
            <p>
              <strong>สำหรับผู้ใช้ที่เข้าสู่ระบบ:</strong> บันทึกประวัติดูดวงและข้อมูลบัญชีจะถูกจัดเก็บอย่างปลอดภัยบน Cloudflare D1
              ฐานข้อมูลแบบกระจายศูนย์ระดับโลก พร้อมการเข้ารหัสความปลอดภัยทั้งขณะจัดเก็บ (Encryption at Rest) และขณะส่งผ่านเครือข่าย (TLS 1.3 In Transit)
              โดยคุณมีสิทธิสมบูรณ์ในการขอดาวน์โหลดหรือสั่งลบข้อมูลทั้งหมดได้ตลอดเวลา
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold font-serif-th">
            4. สิทธิของคุณตามกฎหมาย PDPA และมาตรฐานสากล
          </h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>สิทธิในการลบข้อมูล (Right to Erasure)</strong> —
              สั่งลบประวัติ บันทึก และบัญชีทั้งหมดได้อย่างสมบูรณ์ทันทีผ่านระบบบริการตนเองด้านล่าง
            </li>
            <li>
              <strong>สิทธิในการขอรับและโอนย้ายข้อมูล (Data Portability)</strong> —
              ดาวน์โหลดสำเนาข้อมูลประวัติดูดวงและบันทึกทั้งหมดของคุณในรูปแบบไฟล์ JSON ที่สามารถนำไปประมวลผลต่อได้
            </li>
            <li>
              <strong>สิทธิในการถอนความยินยอม (Right to Withdraw Consent)</strong> —
              ปิดรับอีเมลสรุปดวงประจำวันหรือข่าวสารได้ตลอดเวลาในการตั้งค่าบัญชี หรือผ่านลิงก์ยกเลิกในอีเมล
            </li>
            <li>
              <strong>สิทธิในการเข้าถึงและแก้ไขข้อมูล (Right of Access &amp; Rectification)</strong> —
              ตรวจสอบและแก้ไขบันทึกผลลัพธ์ดวงชะตาและข้อมูลส่วนตัวได้ในสมุดบันทึก
            </li>
            <li>
              <strong>สิทธิที่จะไม่ถูกเลือกปฏิบัติ (Right to Non-Discrimination)</strong> —
              การใช้สิทธิทางกฎหมายจะไม่กระทบต่อคุณภาพบริการหรือการคิดค่าบริการใด ๆ ทั้งสิ้น
            </li>
          </ul>
        </section>

        {/* Section 5: AI Disclosure */}
        <section className="altar-card-porcelain !rounded-xl space-y-3 p-5">
          <h2 className="text-lg font-bold text-gold font-serif-th">
            5. การเปิดเผยเรื่อง AI และความโปร่งใส (AI Transparency Disclosure)
          </h2>
          <div className="text-sm text-ink leading-relaxed space-y-2 font-serif-th">
            <p>
              คำทำนายทั้งหมดในวิหารนี้ <strong>สร้างขึ้นโดยปัญญาประดิษฐ์ (AI)</strong>{" "}
              ร่วมกับระบบสุ่มไพ่ทางคณิตศาสตร์ที่ตรวจสอบความโปร่งใสได้ (Provably-Fair SHA-256)
            </p>
            <p>
              &quot;แม่หมอ&quot; ในระบบคือ <strong>บุคลิก AI (Persona)</strong> ที่ถูกออกแบบมาเพื่อมอบมุมมอง
              คำแนะนำเชิงบวก การเจริญสติ และข้อคิดทางปรัชญา ไม่ใช่การคุยกับหมอดูมนุษย์จริงหรือผู้ให้คำปรึกษาทางการแพทย์
            </p>
            <p>
              <strong>นโยบายห้ามกุไพ่ปลอมเด็ดขาด (Zero Fabricated Cards Policy):</strong> ทุกการทำนายทำงานบนสำรับไพ่ 1909 Rider-Waite 78 ใบที่แท้จริง
              ระบบมีกลไกป้องกันการมโนหรือสร้างไพ่ที่ไม่มีอยู่จริง เพื่อรักษาความเที่ยงธรรม 100%
            </p>
          </div>
        </section>

        {/* Section 6: Safety */}
        <section className="altar-card-porcelain !rounded-xl space-y-3 p-5">
          <h2 className="text-lg font-bold text-err font-serif-th">
            6. ความปลอดภัยของผู้ใช้และข้อจำกัดความรับผิดชอบ (Safety Guardrails)
          </h2>
          <div className="text-sm text-err leading-relaxed space-y-2 font-serif-th">
            <p>ระบบของเรามีตัวกรองความปลอดภัยที่ทำงานตรวจจับความเสี่ยงตลอดเวลา:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong>การตรวจจับวิกฤตทางจิตใจ:</strong> เมื่อพบสัญญาณความทุกข์หรือสภาวะวิกฤต ระบบจะแสดงคำแนะนำและสายด่วนช่วยเหลือทันที:
                <ul className="pl-5 space-y-1 list-disc list-inside text-xs">
                  <li>สายด่วนสุขภาพจิต (กรมสุขภาพจิต ประเทศไทย): <strong>1323</strong> (โทรฟรีตลอด 24 ชั่วโมง)</li>
                  <li>สถาบันการแพทย์ฉุกเฉินแห่งชาติ (ประเทศไทย): <strong>1669</strong></li>
                  <li>สายด่วนสุขภาพจิตสากล (สหรัฐฯ และแคนาดา): <strong>988</strong></li>
                  <li>หน่วยบริการฉุกเฉินสหราชอาณาจักรและยุโรป: <strong>111 / 112 / 999</strong></li>
                </ul>
              </li>
              <li>
                <strong>ข้อห้ามทางการแพทย์:</strong> ห้าม AI วินิจฉัยโรค ทำนายสุขภาพ การตั้งครรภ์ หรือให้คำแนะนำทางการแพทย์
              </li>
              <li>
                <strong>ข้อห้ามทางกฎหมาย:</strong> ห้าม AI ให้คำแนะนำทางกฎหมาย หรือทำนายผลคดีความในกระบวนการยุติธรรม
              </li>
              <li>
                <strong>ข้อห้ามทางการเงิน:</strong> ห้าม AI ชี้แนะหุ้น คริปโตเคอร์เรนซี หรือการลงทุนที่มีความเสี่ยงทางการเงิน
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7: Export & Delete Data */}
        <section className="pt-4 border-t border-line/40 space-y-4 font-serif-th">
          <h2 className="text-lg font-bold text-gold">7. จัดการข้อมูลส่วนบุคคลของคุณ</h2>
          <p className="text-xs text-muted">
            คุณสามารถดาวน์โหลดสำเนาข้อมูลของคุณ หรือสั่งลบข้อมูลทั้งหมดทั้งในเครื่องและบนระบบเซิร์ฟเวอร์ได้อย่างสมบูรณ์
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/account/export"
              download
              className="glass-chip px-5 py-2.5 text-ink text-xs font-bold hover:bg-canvas transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>ดาวน์โหลดข้อมูลของฉัน (Export JSON)</span>
            </a>
            {deleteButton}
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center pt-6 font-serif-th">
          <a
            href="/"
            className="btn-gold-glass inline-flex items-center gap-2 px-6 py-3 font-bold text-sm"
          >
            ← กลับสู่วิหารทาโรต์
          </a>
        </div>
      </div>
    </main>
  );
}
