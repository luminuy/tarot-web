import type { Metadata } from "next";
import Link from "next/link";

import { buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";

/**
 * 🏛️ หน้า "เกี่ยวกับเรา"
 *
 * ⚠️ หน้านี้มีไว้เพื่อ **ความน่าเชื่อถือ** โดยเฉพาะ ไม่ใช่หน้าการตลาด
 *
 * ที่มา: รอบตรวจ SEO 2026-09-11 พบจาก Search Console ว่า **127 จาก 151 หน้าไทย
 * ติดสถานะ "พบแล้ว — ยังไม่ได้จัดทำดัชนี" และ Google ไม่เคยคลานเลยสักครั้ง**
 * เว็บที่ให้คำแนะนำเกี่ยวกับชีวิต (ใกล้โซน YMYL) แต่ไม่มีหน้าไหนบอกว่าใครรับผิดชอบ
 * ไม่มีช่องทางติดต่อ และผู้เขียนเป็นเพียงชื่อสมมติ = สัญญาณความเสี่ยงตรง ๆ
 *
 * ⚠️ กติกาของหน้านี้ — ห้ามละเมิดเด็ดขาด:
 * 1. **ห้ามกุคุณวุฒิ ใบรับรอง ประสบการณ์ หรือตัวตนของคนที่ไม่มีอยู่จริง**
 *    การสร้าง E-E-A-T ปลอมคือการหลอกทั้งผู้ใช้และ Google และย้อนกลับมาทำลายเว็บเอง
 * 2. **ต้องบอกตรง ๆ ว่าคำทำนายสร้างด้วย AI** — นี่ไม่ใช่จุดอ่อนที่ต้องซ่อน
 *    แต่เป็นจุดต่างที่คู่แข่งรายใหญ่ไม่มี เพราะของเรา "ตรวจสอบได้"
 * 3. ทุกข้อความบนหน้านี้ต้องเป็นความจริงที่พิสูจน์ได้จากตัวระบบเอง
 */

const aboutOgImages = buildPageOgImage({
  title: "เกี่ยวกับ SeerTarot",
  eyebrow: "วิหารพยากรณ์ไพ่ทาโรต์",
  cardImage: "major-02.jpg",
  alt: "เกี่ยวกับ SeerTarot วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์",
});

/* ⚠️ ห้ามใส่คำว่า "SeerTarot" ใน TITLE — layout ต่อท้าย " · SeerTarot" ให้เองทุกหน้า
   ใส่เองจะกลายเป็นชื่อแบรนด์ซ้ำสองรอบ และด่านที่ 41 จะตกทันที
   เพดาน: ส่วนที่หน้าเขียนเองต้อง ≤ 60 ตัวอักษร (ดู `lib/config/meta-length.ts`) */
const TITLE = "เกี่ยวกับเรา — ใครอยู่เบื้องหลังและคำทำนายมาจากไหน";
const DESCRIPTION =
  "SeerTarot คือใคร คำทำนายสร้างขึ้นอย่างไร ระบบสุ่มไพ่ตรวจสอบได้จริงแบบไหน และเรารับผิดชอบอะไรบ้าง — เปิดเผยทุกขั้นตอนอย่างตรงไปตรงมา";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: buildAlternates("/about"),
  openGraph: {
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/about`,
    siteName: "SeerTarot",
    type: "website",
    locale: "th_TH",
    images: aboutOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    images: [aboutOgImages[0].url],
  },
};

export default function AboutPage() {
  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd("th", [
    homeCrumb("th"),
    { name: "เกี่ยวกับเรา", path: "/about" },
  ]);

  /* AboutPage schema — บอก Google ตรง ๆ ว่าหน้านี้อธิบาย "ตัวตนขององค์กร"
     ซึ่งเป็นสิ่งที่ Quality Rater Guidelines มองหาเป็นอันดับแรกในเว็บให้คำแนะนำ */
  const jsonLdAbout = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/about`,
    inLanguage: "th",
    mainEntity: {
      "@type": "Organization",
      name: "SeerTarot Sanctuary",
      alternateName: "วิหารพยากรณ์ไพ่ทาโรต์",
      url: SITE_ORIGIN,
      email: DEFAULT_SUPPORT_EMAIL,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: DEFAULT_SUPPORT_EMAIL,
        availableLanguage: ["th", "en"],
      },
    },
  };

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdAbout) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-3 pb-6 border-b border-[#D5CEC2]/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#29261F] font-serif-th">เกี่ยวกับ SeerTarot</h1>
          <p className="text-xs text-[#635B4E]">ใครอยู่เบื้องหลัง และคำทำนายมาจากไหน</p>
        </div>

        <section className="space-y-3">
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            SeerTarot คือเว็บดูดวงไพ่ยิปซีและไพ่ทาโรต์ออนไลน์ ที่สร้างขึ้นด้วยความตั้งใจเดียว —
            ทำให้การเปิดไพ่บนอินเทอร์เน็ต <strong>ตรวจสอบได้จริง</strong> ไม่ใช่แค่สุ่มภาพขึ้นมาแล้วบอกว่านี่คือดวงของคุณ
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            เราเป็นทีมเล็ก ๆ ที่ดูแลเว็บนี้ด้วยตัวเอง ไม่ได้อยู่ในเครือสำนักข่าวหรือบริษัทดูดวงใด
            สิ่งที่เราทำได้และทำมาตลอดคือ เปิดเผยกลไกทุกอย่างให้คุณตรวจสอบเองได้
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">คำทำนายมาจากไหน</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            <strong>คำทำนายบนเว็บนี้เขียนโดยปัญญาประดิษฐ์ (AI) ที่เราออกแบบและปรับแต่งเอง</strong> ไม่ใช่หมอดูมนุษย์
            เราบอกเรื่องนี้ตรง ๆ ตั้งแต่ต้น เพราะคิดว่าคุณควรรู้ว่ากำลังอ่านอะไรอยู่
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            AI ของเราไม่ได้เดาคำตอบลอย ๆ แต่อ่านจากความหมายดั้งเดิมของไพ่แต่ละใบตามตำรา 1909 Rider-Waite-Smith
            ประกอบกับตำแหน่งที่ไพ่ใบนั้นตกในผัง และคำถามที่คุณถาม แล้วเรียบเรียงออกมาเป็นภาษาที่อ่านเข้าใจ
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            ถ้าคุณอยากคุยกับคนจริง ๆ เรามีหน้า{" "}
            <Link href="/readers" prefetch={false} className="text-[#8F5C1A] underline hover:text-[#A58A5C]">
              แม่หมอตัวจริง
            </Link>{" "}
            แยกไว้ต่างหาก และจะบอกเสมอว่าอันไหนคือ AI อันไหนคือคน
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">ไพ่ถูกสุ่มจริงไหม — พิสูจน์ได้</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            นี่คือเรื่องที่เราให้ความสำคัญที่สุด เว็บดูดวงทั่วไปไม่มีทางให้คุณรู้เลยว่าไพ่ถูกสุ่มจริง
            หรือถูกเลือกมาให้ทีหลังเพื่อให้เข้ากับคำทำนาย
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            เราใช้ระบบ <strong>Provably Fair</strong> แบบเดียวกับที่ใช้ตรวจสอบความยุติธรรมในระบบสุ่มระดับสากล
            ก่อนคุณจะเลือกไพ่ ระบบจะ <strong>ล็อกลำดับไพ่ทั้งสำรับไว้ก่อนแล้ว</strong> และแสดงค่าแฮช SHA-256
            ของลำดับนั้นให้คุณเห็น เมื่อเปิดไพ่เสร็จ ระบบจะเปิดเผยลำดับจริงให้คุณนำไปตรวจย้อนได้ว่าตรงกับค่าแฮชเดิม
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            แปลว่า <strong>เราไม่สามารถเปลี่ยนไพ่ของคุณหลังจากคุณเลือกแล้วได้เลย</strong> แม้จะอยากทำก็ทำไม่ได้
            เพราะค่าแฮชจะไม่ตรงทันที และคุณตรวจเองได้ทุกครั้ง
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">สำรับไพ่ที่เราใช้</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            เราใช้ภาพไพ่จากสำรับ <strong>1909 Rider-Waite-Smith</strong> ต้นฉบับ ครบทั้ง 78 ใบ
            ซึ่งเป็นสำรับที่เป็นรากของการอ่านไพ่ทาโรต์สมัยใหม่แทบทั้งหมด
          </p>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            เรามีกฎภายในข้อหนึ่งที่เข้มมาก คือ <strong>ห้ามสร้างไพ่ปลอมขึ้นมาเองเด็ดขาด</strong> ถ้าข้อมูลไพ่ใบไหน
            มีปัญหา ระบบจะแจ้งให้คุณโหลดใหม่ แทนที่จะแอบใส่ไพ่ใบอื่นแทนให้เนียน ๆ
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">สิ่งที่เราไม่ใช่ และไม่รับทำ</h2>
          <ul className="space-y-2 text-sm text-[#29261F] list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการเงิน</strong> — คำทำนายมีไว้เพื่อทบทวนความคิดและให้กำลังใจ
              ถ้าคุณมีเรื่องสุขภาพ คดีความ หรือการลงทุน โปรดปรึกษาผู้เชี่ยวชาญตัวจริง
            </li>
            <li>
              <strong>ไม่ทำนายเรื่องความเป็นความตาย โรคร้าย หรือชี้ชะตาแบบฟันธง</strong>
            </li>
            <li>
              <strong>ไม่ขายเครื่องราง ไม่รับแก้กรรม ไม่มีการเรียกเก็บเงินเพื่อสะเดาะเคราะห์</strong>
            </li>
            <li>
              <strong>ไม่เอาคำถามหรือบันทึกของคุณไปเทรนโมเดล AI</strong> — รายละเอียดอยู่ใน{" "}
              <Link href="/privacy" prefetch={false} className="text-[#8F5C1A] underline hover:text-[#A58A5C]">
                นโยบายความเป็นส่วนตัว
              </Link>
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">ถ้าคุณกำลังรู้สึกแย่มาก</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            ถ้าระบบตรวจพบว่าคำถามของคุณมีสัญญาณของการทำร้ายตัวเอง เราจะหยุดการทำนายทันที
            และแสดงช่องทางขอความช่วยเหลือแทน เพราะเรื่องแบบนี้ไม่ควรฝากไว้กับไพ่
          </p>
          <div className="rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 space-y-1">
            <p className="text-sm text-[#29261F] font-serif-th">
              <strong>สายด่วนสุขภาพจิต กรมสุขภาพจิต — โทร 1323</strong> (ฟรี ตลอด 24 ชั่วโมง)
            </p>
            <p className="text-xs text-[#635B4E] font-serif-th">
              ถ้าอยู่ต่างประเทศ ใช้สายด่วนในพื้นที่ของคุณ เช่น 988 ในสหรัฐอเมริกา
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-[#A58A5C] font-serif-th">ติดต่อเรา</h2>
          <p className="text-sm text-[#29261F] leading-relaxed font-serif-th">
            มีอะไรอยากบอก อยากติ อยากแจ้งปัญหา หรือเจอคำทำนายที่ไม่เหมาะสม เขียนมาได้เลยที่{" "}
            <a
              href={`mailto:${DEFAULT_SUPPORT_EMAIL}`}
              className="text-[#8F5C1A] underline hover:text-[#A58A5C] break-all"
            >
              {DEFAULT_SUPPORT_EMAIL}
            </a>{" "}
            เราอ่านทุกฉบับ · ดูช่องทางทั้งหมดได้ที่หน้า{" "}
            <Link href="/contact" prefetch={false} className="text-[#8F5C1A] underline hover:text-[#A58A5C]">
              ติดต่อเรา
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
