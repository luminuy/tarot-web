import type { Metadata } from "next";
import Link from "next/link";
import { BirthCardCalculator } from "@/components/encyclopedia/BirthCardCalculator";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card) — ค้นหาไพ่ประจำวันเกิดฟรี",
  description:
    "ค้นหาไพ่ทาโรต์ประจำตัว (Birth Card) จากวันเดือนปีเกิดของคุณ คำนวณตามหลักเลขศาสตร์สากล 1909 Rider-Waite พร้อมคำทำนายบุคลิกภาพ จิตวิญญาณ และแนวทางพัฒนาตนเอง ฟรี",
  keywords: [
    "ไพ่ทาโรต์ประจำตัว",
    "ไพ่ยิปซีประจำตัว",
    "คำนวณไพ่ประจำตัว",
    "birth card tarot",
    "ไพ่ประจำวันเกิด",
    "ดูดวงไพ่ยิปซีวันเกิด",
    "ค้นหาไพ่ทาโรต์ประจำตัว",
  ],
  alternates: {
    canonical: `${SITE_ORIGIN}/cards/birth-card`,
  },
  openGraph: {
    title: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card) · SeerTarot",
    description:
      "ค้นหาไพ่ทาโรต์ประจำตัว (Birth Card) จากวันเดือนปีเกิดของคุณ ตามหลักเลขศาสตร์ 1909 Rider-Waite",
    url: `${SITE_ORIGIN}/cards/birth-card`,
    siteName: "SeerTarot",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
  twitter: {
    card: "summary_large_image",
    title: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card) · SeerTarot",
    description:
      "ค้นหาไพ่ทาโรต์ประจำตัว (Birth Card) จากวันเดือนปีเกิดของคุณ ตามหลักเลขศาสตร์ 1909 Rider-Waite",
    images: [OG_IMAGE_URL],
  },
};

const BIRTH_CARD_FAQS = [
  {
    question: "ไพ่ทาโรต์ประจำตัว (Birth Card) คืออะไร?",
    answer:
      "ไพ่ทาโรต์ประจำตัวคือไพ่ชุดใหญ่ (Major Arcana) ที่คำนวณจากผลรวมของวัน เดือน และปีเกิดของคุณ ทำหน้าที่เป็นแม่พิมพ์ต้นแบบทางจิตวิทยา (Jungian Archetype) และกระจกสะท้อนบทเรียนชีวิต แก่นแท้ของจิตวิญญาณ และพรสวรรค์ที่ติดตัวคุณมาตั้งแต่กำเนิด",
  },
  {
    question: "ไพ่บุคลิกภาพ (Personality Card) กับ ไพ่จิตวิญญาณ (Soul Card) ต่างกันอย่างไร?",
    answer:
      "ไพ่บุคลิกภาพ (Personality Card) สะท้อนวิธีที่คุณปฏิสัมพันธ์กับโลกภายนอก พฤติกรรมที่ผู้คนมองเห็น และวิธีที่คุณรับมือกับชีวิตประจำวัน ส่วนไพ่จิตวิญญาณ (Soul Card) สะท้อนความปรารถนาลึกๆ เจตจำนงแห่งจิตวิญญาณ และการเติบโตทางปัญญาตลอดช่วงชีวิต",
  },
  {
    question: "หากคำนวณแล้วได้ไพ่ใบเดียว หมายความว่าอย่างไร?",
    answer:
      "หากผลลัพธ์เป็นเลขโดดหลักเดียว (1-9) ไพ่ใบนั้นจะทำหน้าที่เป็นทั้งไพ่บุคลิกภาพและไพ่จิตวิญญาณในใบเดียวกัน ซึ่งหมายความว่าการแสดงออกภายนอกกับเจตนาภายในของคุณมีความเป็นอันหนึ่งอันเดียวกันอย่างลึกซึ้ง",
  },
  {
    question: "ไพ่ประจำตัวเปลี่ยนตามปีหรือตามวัยหรือไม่?",
    answer:
      "ไพ่ประจำตัว (Birth Card) มาจากวันเกิดของคุณจึงไม่มีวันเปลี่ยนแปลงไปตลอดชีวิต แต่ในแต่ละปี คุณจะมี 'ไพ่ประจำปี' (Year Card) ที่เปลี่ยนไปตามรอบปีเกิด ซึ่งใช้ดูแนวโน้มบทเรียนชีวิตในแต่ละขวบปีได้",
  },
];

export default function BirthCardPage() {
  const url = `${SITE_ORIGIN}/cards/birth-card`;

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ระบบคำนวณไพ่ทาโรต์ประจำตัว (Tarot Birth Card Calculator)",
    description: "เครื่องมือคำนวณไพ่ประจำวันเกิดและไพ่จิตวิญญาณตามหลักเลขศาสตร์ไพ่ทาโรต์สากล",
    applicationCategory: "LifestyleApplication",
    url,
    inLanguage: "th",
    operatingSystem: "All",
  };

  const breadcrumbsJsonLd = {
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
        name: "สารานุกรมไพ่ 78 ใบ",
        item: `${SITE_ORIGIN}/cards`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "คำนวณไพ่ทาโรต์ประจำตัว",
        item: url,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BIRTH_CARD_FAQS.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-10 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#7A6F5D]">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-[#29261F] transition-colors">
                หน้าแรก
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#D5CEC2]">/</li>
            <li>
              <Link href="/cards" className="hover:text-[#29261F] transition-colors">
                สารานุกรมไพ่ 78 ใบ
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#D5CEC2]">/</li>
            <li className="font-semibold text-[#29261F]" aria-current="page">
              คำนวณไพ่ประจำตัว (Birth Card)
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-xs text-[#8F5C1A] font-serif-th font-semibold shadow-xs">
            ศาสตร์เลขศาสตร์ทาโรต์สากล (Tarot Numerology)
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold font-serif-th text-[#29261F] tracking-tight leading-tight">
            คำนวณไพ่ทาโรต์ประจำตัว
          </h1>
          <p className="text-xs sm:text-sm text-[#635B4E] leading-relaxed font-serif-th">
            ค้นพบแม่พิมพ์จิตวิทยา (Archetype) และเจตนารมณ์แห่งจิตวิญญาณที่ซ่อนอยู่ในวันเกิดของคุณ
            ด้วยสำรับไพ่ดั้งเดิม 1909 Rider-Waite
          </p>
        </header>

        {/* Interactive Calculator Component */}
        <BirthCardCalculator />

        {/* Editorial Guide Article */}
        <article className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-10 space-y-6 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-bold font-serif-th text-[#29261F] border-b border-[#E8E2D8] pb-4">
            ศาสตร์แห่งไพ่ทาโรต์ประจำตัว: กระจกส่องจิตวิญญาณตลอดชีวิต
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-[#4A4338] font-serif-th leading-relaxed">
            <p>
              ในศาสตร์ไพ่ทาโรต์ดั้งเดิม วันเกิดของเราไม่ใช่เพียงตัวเลขบนปฏิทิน หากแต่เป็นพิมพ์เขียวของคลื่นพลังงาน
              (Vibrational Blueprint) ที่กำหนดบทบาทและบทเรียนสำคัญในชีวิตมนุษย์ แนวคิดเรื่องไพ่ทาโรต์ประจำตัว
              (Birth Card) ได้รับการพัฒนาอย่างเป็นระบบโดยนักวิชาการและปรมาจารย์ด้านไพ่ทาโรต์สากล เช่น Mary K. Greer
              และ Angeles Arrien ซึ่งเชื่อมโยงตัวเลขเข้ากับแม่พิมพ์จิตวิทยาดั้งเดิม (Archetypes) ตามทฤษฎีของ คาร์ล ยุง (Carl Jung)
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-2">
              หลักการคำนวณและการทำงานของตัวเลข
            </h3>
            <p>
              การคำนวณไพ่ประจำตัวจะใช้วันเกิด เดือนเกิด และปีเกิด (ค.ศ.) มารวมกัน แล้วทำการลดทอนตัวเลข
              (Digit Reduction) จนได้ตัวเลขที่ตรงกับไพ่ชุดใหญ่ (Major Arcana) หมายเลข 0 ถึง 21 ไพ่ชุดใหญ่เหล่านี้
              คือตัวแทนของการเดินทางของจิตวิญญาณ (The Fool’s Journey) ซึ่งสะท้อนความท้าทาย พรสวรรค์ และจุดที่ต้องก้าวข้าม
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-2">
              วิธีนำพลังงานของไพ่ประจำตัวไปปรับใช้ในชีวิตจริง
            </h3>
            <ul className="list-disc pl-5 space-y-1.5 text-[#5E5240]">
              <li>
                <strong>ทำความเข้าใจจุดแข็งและจุดเปราะบาง:</strong> ไพ่ทุกใบมีทั้งด้านสว่าง (Upright) และด้านเงา (Reversed)
                การรู้จักไพ่ของตนเองช่วยให้คุณระมัดระวังไม่ให้ตกหลุมพรางของความกลัวหรือความวิตกกังวล
              </li>
              <li>
                <strong>ใช้เป็นเครื่องมือสะท้อนตนเองในยามสับสน:</strong> เมื่อต้องเผชิญหน้ากับการตัดสินใจครั้งใหญ่
                ลองกลับมาถามตนเองว่า ในฐานะผู้ถือพลังงานของไพ่ใบนี้ ทางเลือกใดคือวิถีทางที่สอดคล้องกับคุณค่าสูงสุดของคุณ
              </li>
              <li>
                <strong>เชื่อมโยงกับการฝึกสมาธิ:</strong> การนำภาพสัญลักษณ์ 1909 Rider-Waite ของไพ่ประจำตัวมาทำสมาธิ
                จะช่วยเปิดประตูสู่ปัญญาญาณภายในและความสงบสุขทางอารมณ์
              </li>
            </ul>
          </div>
        </article>

        {/* FAQs */}
        <section className="rounded-2xl border border-[#D5CEC2] bg-[#FFFFFF] p-6 sm:p-10 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold font-serif-th text-[#29261F]">
              คำถามพบบ่อยเกี่ยวกับไพ่ประจำตัว
            </h2>
            <p className="text-xs text-[#7A6F5D] font-serif-th">
              ความรู้ความเข้าใจเกี่ยวกับเลขศาสตร์และพลังงานไพ่ทาโรต์
            </p>
          </div>
          <div className="divide-y divide-[#E8E2D8] space-y-4 pt-2">
            {BIRTH_CARD_FAQS.map((faq, index) => (
              <div key={index} className="pt-4 first:pt-0 space-y-1.5">
                <h3 className="font-serif-th text-sm sm:text-base font-bold text-[#29261F]">
                  {faq.question}
                </h3>
                <p className="font-serif-th text-xs sm:text-sm text-[#5E5240] leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Navigation & Internal Links */}
        <div className="flex items-center justify-center gap-4 text-xs font-serif-th text-[#7A6F5D] pt-4">
          <Link href="/cards" className="hover:text-[#29261F] underline underline-offset-4">
            สารานุกรมไพ่ 78 ใบ
          </Link>
          <span className="text-[#D5CEC2]">·</span>
          <Link href="/spreads" className="hover:text-[#29261F] underline underline-offset-4">
            ผังพยากรณ์ 25 แบบ
          </Link>
          <span className="text-[#D5CEC2]">·</span>
          <Link href="/" className="hover:text-[#29261F] underline underline-offset-4">
            เริ่มดูดวงที่หน้าแรก
          </Link>
        </div>
      </div>
    </main>
  );
}
