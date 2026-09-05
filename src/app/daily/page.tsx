import type { Metadata } from "next";
import Link from "next/link";
import { DailyClient } from "./DailyClient";
import { SITE_ORIGIN } from "@/lib/config/site";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";

export const metadata: Metadata = {
  title: "ดูดวงไพ่ยิปซีรายวัน ไพ่ทาโรต์นำทางชีวิตวันนี้ (เปิดฟรีทุกวัน) | SeerTarot",
  description:
    "ดูดวงไพ่ยิปซีรายวันแม่นๆ เปิดไพ่ 1 ใบทำนายพลังงานประจำวัน ทั้งการงาน การเงิน ความรัก และข้อคิดเตือนสติ ด้วยไพ่ 1909 Rider-Waite แท้ 78 ใบ ไร้โฆษณากวนใจ สับไพ่โปร่งใสตรวจสอบได้",
  keywords: [
    "ดูดวงไพ่ยิปซีรายวัน",
    "ไพ่ยิปซีรายวัน",
    "ดูดวงรายวัน",
    "ไพ่ทาโรต์รายวัน",
    "ดูดวงไพ่ยิปซี 1 ใบ",
    "เปิดไพ่รายวันฟรี",
    "ดูดวงแม่นๆ วันนี้",
  ],
  alternates: {
    canonical: `${SITE_ORIGIN}/daily`,
  },
  openGraph: {
    title: "ดูดวงไพ่ยิปซีรายวัน ไพ่ทาโรต์นำทางชีวิตวันนี้ | SeerTarot",
    description:
      "เปิดไพ่ยิปซี 1 ใบเช็กพลังงานประจำวัน ทั้งการงาน การเงิน ความรัก และข้อควรระวัง ด้วยสำรับ 1909 Rider-Waite แท้",
    url: `${SITE_ORIGIN}/daily`,
    siteName: "SeerTarot",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: `${SITE_ORIGIN}/cards/w512/major-19.webp`,
        width: 512,
        height: 878,
        alt: "The Sun - ดูดวงไพ่ยิปซีรายวัน",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ดูดวงไพ่ยิปซีรายวัน ไพ่ทาโรต์นำทางชีวิตวันนี้ | SeerTarot",
    description:
      "เปิดไพ่ยิปซี 1 ใบเช็กพลังงานประจำวัน ทั้งการงาน การเงิน ความรัก และข้อควรระวัง ฟรีทุกวัน",
    images: [`${SITE_ORIGIN}/cards/w512/major-19.webp`],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "หน้าแรก",
      item: SITE_ORIGIN,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "ดูดวงไพ่ยิปซีรายวัน",
      item: `${SITE_ORIGIN}/daily`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "ดูดวงไพ่ยิปซีรายวันควรดูช่วงเวลาไหนดีที่สุด?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "แนะนำให้เปิดไพ่รายวันในช่วงเช้าหลังตื่นนอน หรือก่อนเริ่มทำภารกิจของวัน ทำจิตใจให้สงบ มีสมาธิ เพื่อให้ไพ่สะท้อนพลังงานและให้ข้อคิดเตือนใจสำหรับวันนั้นได้อย่างมีประสิทธิภาพสูงสุด",
      },
    },
    {
      "@type": "Question",
      name: "สามารถเปิดไพ่ยิปซีรายวันซ้ำในวันเดียวกันได้หรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ไม่แนะนำให้เปิดซ้ำหลายรอบในวันเดียวกัน การเปิดไพ่รายวันมีพลังแม่นยำสูงสุดเมื่อเปิดวันละ 1 ครั้งตามสมาธิแรก หากมีคำถามเฉพาะเจาะจงในเรื่องอื่น แนะนำให้ใช้ผังพยากรณ์ 3 ใบ หรือผังเซลติกครอส 10 ใบแทน",
      },
    },
    {
      "@type": "Question",
      name: "คำทำนายไพ่ยิปซีรายวันครอบคลุมเรื่องใดบ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ผลทำนายไพ่รายวันของ SeerTarot ครอบคลุม 5 มิติสำคัญ ได้แก่ พลังงานภาพรวมประจำวัน, ทิศทางการงาน, สภาพคล่องการเงิน, ความรักความสัมพันธ์, และข้อคิดเตือนใจในการดำเนินชีวิต",
      },
    },
  ],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ดูดวงไพ่ยิปซีรายวัน (SeerTarot Daily Tarot)",
  operatingSystem: "All",
  applicationCategory: "LifestyleApplication",
  url: `${SITE_ORIGIN}/daily`,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
};

const heroCardSrcSet = getCardWebpSrcSet("major-19.jpg");

export default function DailyTarotPage() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        type="image/webp"
        fetchPriority="high"
        imageSrcSet={heroCardSrcSet ?? undefined}
        imageSizes="120px"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />

      <DailyClient />

      {/* High-Authority Editorial Article & Knowledge Base */}
      <div className="bg-[#F3F0EA] pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <article className="rounded-3xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-12 space-y-8 shadow-[var(--shadow-raised)]">
            <div className="space-y-2 border-b border-[#E8E2D8] pb-4">
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#8F5C1A] font-semibold">
                THE PHILOSOPHY OF DAILY TAROT & SYNCHRONICITY
              </span>
              <h2 className="text-xl sm:text-3xl font-bold font-serif-th text-[#29261F] tracking-tight">
                ศาสตร์แห่งการเปิดไพ่ยิปซีรายวัน: กระจกส่องจิตและสติสัมปชัญญะ
              </h2>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-[#4A4338] font-serif-th leading-relaxed">
              <p>
                ในวิถีแห่งทาโรต์ดั้งเดิม การเปิดไพ่ประจำวัน (Daily Tarot Draw) มิใช่การทำนายโชคชะตาแบบงมงาย
                หากแต่เป็นเครื่องมือทางจิตวิทยาที่ทรงพลังในการสร้าง &quot;สติสัมปชัญญะประจำวัน&quot;
                ตามทฤษฎีจิตวิทยาวิเคราะห์ของ คาร์ล กุสตาฟ ยุง (Carl Gustav Jung) ไพ่ทาโรต์ทำหน้าที่เป็นตัวสะท้อน
                ภาพสัญลักษณ์ต้นแบบ (Archetypes) จากจิตไร้สำนึกร่วม (Collective Unconscious)
                และปรากฏการณ์ความพ้องพานของเหตุการณ์ (Synchronicity)
              </p>

              <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
                วิธีรับพลังงานจากไพ่ประจำวันให้เกิดประโยชน์สูงสุด
              </h3>
              <ul className="list-disc pl-5 space-y-2 text-[#5E5240]">
                <li>
                  <strong>การตั้งจิตอธิษฐานในตอนเช้า:</strong> ก่อนเริ่มทำงาน ให้หลับตาและหายใจเข้าลึกๆ
                  สังเกตอารมณ์ความรู้สึกปัจจุบัน แล้วจึงแตะเลือกไพ่ด้วยสมาธิที่นิ่งสงบ
                </li>
                <li>
                  <strong>พิจารณาสัญลักษณ์ในภาพ 1909 Rider-Waite:</strong> สำรับดั้งเดิมของ อาเธอร์ เอ็ดเวิร์ด เวท
                  และ พาเมลา คอลแมน สมิธ เต็มไปด้วยรหัสสัญลักษณ์ลึกซึ้ง เช่น สีสัน ธาตุประจำไพ่ และท่วงท่าของตัวละคร
                  ซึ่งมักสื่อความหมายตรงกับสถานการณ์ที่คุณกำลังจะเผชิญ
                </li>
                <li>
                  <strong>การทบทวนเมื่อสิ้นสุดวัน (Evening Reflection):</strong> ก่อนนอน ลองหวนนึกถึงไพ่ที่เปิดได้ในตอนเช้า
                  เทียบกับเหตุการณ์จริงที่เกิดขึ้น เพื่อฝึกฝนสัญชาตญาณและการตระหนักรู้ในตนเอง
                </li>
              </ul>

              <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
                ทำไมต้องใช้ระบบสุ่มแบบ Provably Fair?
              </h3>
              <p>
                ที่ SeerTarot เรายึดมั่นในความซื่อตรงและความโปร่งใสสูงสุด ทุกครั้งที่คุณกดสับไพ่
                ระบบจะเรียกใช้ Web Crypto API ในการสร้างเลขสุ่มตามหลักการเข้ารหัสสากล
                ไม่มีการล็อกผล ไม่มีการแอบแฝงโฆษณา และไม่มีการกุไพ่ใบใดขึ้นมาเองเด็ดขาด
                เพื่อให้คุณมั่นใจได้ว่าคำทำนายทุกใบมาจากสมาธิและกระแสจิตของคุณอย่างแท้จริง
              </p>
            </div>

            {/* Internal Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-serif-th text-[#7A6F5D] pt-6 border-t border-[#E8E2D8]">
              <Link href="/cards" className="hover:text-[#29261F] underline underline-offset-4">
                สารานุกรมไพ่ 78 ใบ
              </Link>
              <span className="text-[#D5CEC2]">·</span>
              <Link href="/love/1-card" className="hover:text-[#29261F] underline underline-offset-4">
                ดูดวงความรัก 1 ใบ
              </Link>
              <span className="text-[#D5CEC2]">·</span>
              <Link href="/cards/birth-card" className="hover:text-[#29261F] underline underline-offset-4">
                คำนวณไพ่ประจำตัว
              </Link>
              <span className="text-[#D5CEC2]">·</span>
              <Link href="/spreads" className="hover:text-[#29261F] underline underline-offset-4">
                ผังพยากรณ์ 25 แบบ
              </Link>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
