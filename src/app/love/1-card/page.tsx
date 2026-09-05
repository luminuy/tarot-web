import type { Metadata } from "next";
import Link from "next/link";
import { LoveOneCardClient } from "./LoveOneCardClient";
import { SITE_ORIGIN } from "@/lib/config/site";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";

export const metadata: Metadata = {
  title: "ดูดวงความรัก 1 ใบ ไพ่ยิปซีแม่นๆ ไขคำตอบสถานะหัวใจ (เปิดฟรี) | SeerTarot",
  description:
    "ดูดวงความรัก 1 ใบ ไพ่ยิปซีทาโรต์แท้ Rider-Waite 78 ใบ ไขทุกข้อสงสัยหัวใจ ทั้งคนโสด คนคุยสถานะไม่ชัดเจน มีคู่ หรือเพิ่งเลิกรา ไร้โฆษณา ไม่ต้องจ่ายเหรียญ สับไพ่ด้วยตนเอง",
  keywords: [
    "ดูดวงความรัก 1 ใบ",
    "ดูดวงความรัก",
    "ไพ่ยิปซีความรัก 1 ใบ",
    "ไพ่ทาโรต์ความรัก",
    "ดูดวงความรัก คนคุย",
    "ดูดวงคนโสด",
    "ดูดวงความรัก คนรักเก่า",
    "เปิดไพ่ความรักฟรี",
  ],
  alternates: {
    canonical: `${SITE_ORIGIN}/love/1-card`,
  },
  openGraph: {
    title: "ดูดวงความรัก 1 ใบ ไพ่ยิปซีแม่นๆ ไขคำตอบสถานะหัวใจ | SeerTarot",
    description:
      "เปิดไพ่ยิปซี 1 ใบตอบคำถามหัวใจ แม่นยำทุกสถานะ: โสดสนิท มีคนคุย มีคนรัก หรือคิดถึงคนเก่า ไร้โฆษณาคั่น",
    url: `${SITE_ORIGIN}/love/1-card`,
    siteName: "SeerTarot",
    locale: "th_TH",
    type: "website",
    images: [
      {
        url: `${SITE_ORIGIN}/cards/w512/major-06.webp`,
        width: 512,
        height: 878,
        alt: "The Lovers - ดูดวงความรัก 1 ใบ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ดูดวงความรัก 1 ใบ ไพ่ยิปซีแม่นๆ ไขคำตอบสถานะหัวใจ | SeerTarot",
    description:
      "เปิดไพ่ยิปซี 1 ใบตอบคำถามหัวใจ แม่นยำทุกสถานะ โสด/มีคนคุย/มีแฟน/คนเก่า ฟรี 100%",
    images: [`${SITE_ORIGIN}/cards/w512/major-06.webp`],
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
      name: "ดูดวงความรัก",
      item: `${SITE_ORIGIN}/spreads/topic/love`,
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "ไพ่ยิปซีความรัก 1 ใบ",
      item: `${SITE_ORIGIN}/love/1-card`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "การดูดวงความรัก 1 ใบ เหมาะกับคำถามแบบไหน?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "การเปิดไพ่ความรัก 1 ใบ เหมาะสำหรับการเช็กแนวโน้มพลังงานความรักปัจจุบัน คำตอบที่ต้องการความชัดเจนแบบกระชับตรงจุด หรือคำแนะนำเร่งด่วนว่าช่วงเวลานี้ควรทำตัวอย่างไรในเรื่องความสัมพันธ์",
      },
    },
    {
      "@type": "Question",
      name: "ดูดวงถามถึงคนคุยที่สถานะไม่ชัดเจน ไพ่จะบอกอะไรได้บ้าง?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ไพ่จะสะท้อนทิศทางของความสัมพันธ์ เจตนาและบรรยากาศระหว่างคุณกับเขา พร้อมให้คำแนะนำว่าควรเดินหน้าต่อ ถอยมาตั้งหลัก หรือควรรอเวลาที่เหมาะสม",
      },
    },
    {
      "@type": "Question",
      name: "สามารถเปิดไพ่ถามถึงคนรักเก่าได้ไหม?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ได้แน่นอน โดยระบบของ SeerTarot มีโหมดสถานะ 'เพิ่งเลิกรา/คิดถึงคนเก่า' โดยเฉพาะ ซึ่งจะวิเคราะห์ทั้งพลังงานเยียวยาจิตใจและแนวโน้มการคืนดีหรือการเริ่มต้นใหม่",
      },
    },
    {
      "@type": "Question",
      name: "เปิดไพ่ความรัก 1 ใบซ้ำได้บ่อยแค่ไหน?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "แนะนำให้ตั้งจิตอธิษฐานและเปิดเพียงครั้งเดียวต่อหนึ่งประเด็นคำถาม หรือสัปดาห์ละ 1 ครั้ง หากสถานการณ์ยังไม่มีการเปลี่ยนแปลงอย่างมีนัยสำคัญ เพื่อให้ได้คำทำนายที่สะท้อนสัจธรรมสูงสุด",
      },
    },
  ],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SeerTarot Love One-Card Oracle",
  operatingSystem: "All",
  applicationCategory: "LifestyleApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
  featureList: [
    "ระบบคัดเลือกสถานะความรัก 4 รูปแบบ (โสด/คนคุย/มีแฟน/คนเก่า)",
    "สับไพ่ด้วย Web Crypto API ป้องกันการล็อกผล 100%",
    "คำทำนายแยกตามสถานะความสัมพันธ์พร้อมคำแนะนำเจาะลึก",
    "สำรับแท้ 1909 Rider-Waite Smith คมชัดระดับพรีเมียม",
    "ไม่มีโฆษณาคั่น ไม่ต้องจ่ายเหรียญ ไม่จำกัดจำนวนครั้ง",
  ],
};

const heroCardSrcSet = getCardWebpSrcSet("major-06.jpg");

export default function LoveOneCardPage() {
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

      <LoveOneCardClient />

      {/* High-Authority Editorial Article & Knowledge Base */}
      <div className="bg-[#F3F0EA] pb-16 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <article className="rounded-3xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-12 space-y-8 shadow-[var(--shadow-raised)]">
            <div className="space-y-2 border-b border-[#E8E2D8] pb-4">
              <span className="text-[11px] font-mono tracking-widest uppercase text-[#8F5C1A] font-semibold">
                THE PSYCHOLOGY OF TAROT IN LOVE & RELATIONSHIPS
              </span>
              <h2 className="text-xl sm:text-3xl font-bold font-serif-th text-[#29261F] tracking-tight">
                ศาสตร์แห่งการดูดวงความรัก 1 ใบ: ถอดรหัสใจและสัญชาตญาณความสัมพันธ์
              </h2>
            </div>

            <div className="space-y-5 text-xs sm:text-sm text-[#4A4338] font-serif-th leading-relaxed">
              <p>
                ความรักเป็นหนึ่งในมิติที่ซับซ้อนและเปราะบางที่สุดของจิตใจมนุษย์ เมื่อเราตกอยู่ในห้วงแห่งความรัก
                ไม่ว่าจะเป็นช่วงเวลาที่หัวใจพองโต หรือช่วงเวลาที่สับสนคลุมเครือ จิตใจมักจะถูกครอบงำด้วยความคาดหวัง
                ความกลัว และความวิตกกังวล การเปิดไพ่ความรัก 1 ใบ (Love One-Card Oracle)
                จึงทำหน้าที่เสมือน &quot;จุดพักใจ&quot; ให้คุณได้ถอยออกมาหนึ่งก้าวเพื่อมองสถานการณ์ตามความเป็นจริง
              </p>

              <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
                เจาะลึก 4 สถานะความสัมพันธ์ผ่านมุมมองไพ่ทาโรต์
              </h3>
              <ul className="list-disc pl-5 space-y-2.5 text-[#5E5240]">
                <li>
                  <strong>คนโสด (Single):</strong> ไพ่จะสะท้อนพลังงานดึงดูดและสภาพจิตใจของคุณเป็นหลัก
                  หากคุณพร้อมเปิดรับรักใหม่ ไพ่จะชี้ถึงโอกาสและทิศทาง แต่หากในใจยังมีความกลัวหรือยังรักอิสระ
                  ไพ่จะเตือนให้คุณดูแลและเติมเต็มคุณค่าในตนเองก่อน
                </li>
                <li>
                  <strong>คนคุย / สถานะไม่ชัดเจน (Situationship):</strong> ปัญหาใหญ่ของคนคุยคือ &quot;ความไม่แน่นอน&quot;
                  ไพ่จะช่วยสะท้อนเจตนาของอีกฝ่าย และให้ข้อคิดว่าความสัมพันธ์นี้มีน้ำหนักพอที่จะพัฒนาต่อ หรือถึงเวลาที่คุณต้องขีดเส้นเพื่อรักษาศักดิ์ศรีของตนเอง
                </li>
                <li>
                  <strong>มีแฟน / คู่ครอง (Committed):</strong> ไพ่ช่วยตรวจเช็ก &quot;สุขภาพความสัมพันธ์&quot;
                  เช่น ความเข้าอกเข้าใจ การสื่อสาร และสิ่งที่ควรระวังไม่ให้ความเคยชินหรือภาระภายนอกมาบั่นทอนความหวาน
                </li>
                <li>
                  <strong>เพิ่งเลิกรา / คนเก่า (Ex / Healing):</strong> การเยียวยาหัวใจเป็นกระบวนการที่ต้องใช้เวลา
                  ไพ่จะบอกว่ายังมีโอกาสหวนคืน หรือถึงเวลาที่ต้องอภัยและปล่อยวางเพื่อเปิดรับบทเรียนชีวิตบทใหม่
                </li>
              </ul>

              <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
                ไพ่ชุดใหญ่ vs ไพ่ชุดเล็ก ในเรื่องความรัก
              </h3>
              <p>
                หากคุณเปิดได้ <strong>ไพ่ชุดใหญ่ (Major Arcana)</strong> เช่น The Lovers, The Empress, The Tower
                หรือ Judgement แสดงว่าความสัมพันธ์นี้เป็น &quot;บทเรียนสำคัญแห่งจิตวิญญาณ (Karmic Lesson)&quot;
                ที่มีผลต่อการเติบโตของคุณอย่างลึกซึ้ง แต่หากเปิดได้ <strong>ไพ่ชุดเล็ก (Minor Arcana)</strong>
                เช่น ไพ่ถ้วย (อารมณ์) ไพ่ไม้เท้า (แรงดึงดูด) ไพ่ดาบ (ความคิดขัดแย้ง) หรือไพ่เหรียญ (ความมั่นคง)
                นั่นหมายถึงพฤติกรรมในชีวิตประจำวันที่สามารถปรับเปลี่ยนและแก้ไขได้ทันที
              </p>
            </div>

            {/* Internal Navigation Links */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-serif-th text-[#7A6F5D] pt-6 border-t border-[#E8E2D8]">
              <Link href="/spreads/topic/love" className="hover:text-[#29261F] underline underline-offset-4">
                รวมผังดูดวงความรักทุกแบบ
              </Link>
              <span className="text-[#D5CEC2]">·</span>
              <Link href="/daily" className="hover:text-[#29261F] underline underline-offset-4">
                ดูดวงไพ่ยิปซีรายวัน
              </Link>
              <span className="text-[#D5CEC2]">·</span>
              <Link href="/cards/birth-card" className="hover:text-[#29261F] underline underline-offset-4">
                คำนวณไพ่ประจำตัว
              </Link>
              <span className="text-[#D5CEC2]">·</span>
              <Link href="/readers" className="hover:text-[#29261F] underline underline-offset-4">
                ปรึกษาแม่หมอตัวจริง
              </Link>
            </div>
          </article>
        </div>
      </div>
    </>
  );
}
