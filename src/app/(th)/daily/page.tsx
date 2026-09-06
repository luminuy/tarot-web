import type { Metadata } from "next";
import { DailyClient } from "@/components/daily/DailyClient";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";

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
  alternates: buildAlternates("/daily", { locale: "th", englishTwin: true }),
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
        url: `${SITE_ORIGIN}/cards/w512b/major-19.webp`,
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
    images: [`${SITE_ORIGIN}/cards/w512b/major-19.webp`],
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

const DAILY_FAQS = [
  {
    q: "ดูดวงไพ่ยิปซีรายวันควรดูช่วงเวลาไหนดีที่สุด?",
    a: "แนะนำให้เปิดไพ่รายวันในช่วงเช้าหลังตื่นนอน หรือก่อนเริ่มทำภารกิจของวัน ทำจิตใจให้สงบ มีสมาธิ เพื่อให้ไพ่สะท้อนพลังงานและให้ข้อคิดเตือนใจสำหรับวันนั้นได้อย่างมีประสิทธิภาพสูงสุด",
  },
  {
    q: "สามารถเปิดไพ่ยิปซีรายวันซ้ำในวันเดียวกันได้หรือไม่?",
    a: "ไม่แนะนำให้เปิดซ้ำหลายรอบในวันเดียวกัน การเปิดไพ่รายวันมีพลังแม่นยำสูงสุดเมื่อเปิดวันละ 1 ครั้งตามสมาธิแรก หากมีคำถามเฉพาะเจาะจงในเรื่องอื่น แนะนำให้ใช้ผังพยากรณ์ 3 ใบ หรือผังเซลติกครอส 10 ใบแทน",
  },
  {
    q: "คำทำนายไพ่ยิปซีรายวันครอบคลุมเรื่องใดบ้าง?",
    a: "ผลทำนายไพ่รายวันของ SeerTarot ครอบคลุม 5 มิติสำคัญ ได้แก่ พลังงานภาพรวมประจำวัน, ทิศทางการงาน, สภาพคล่องการเงิน, ความรักความสัมพันธ์, และข้อคิดเตือนใจในการดำเนินชีวิต",
  },
];

const DAILY_LINKS = [
  { href: "/cards", label: "สารานุกรมไพ่ 78 ใบ" },
  { href: "/love/1-card", label: "ดูดวงความรัก 1 ใบ" },
  { href: "/cards/birth-card", label: "คำนวณไพ่ประจำตัว" },
  { href: "/spreads", label: "ผังพยากรณ์ 25 แบบ" },
];

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

      <main className="min-h-screen bg-[#F3F0EA] py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <DailyClient />

          <SeoArticleShell
            eyebrow="ทำความเข้าใจไพ่ยิปซีรายวัน"
            title="ศาสตร์แห่งการเปิดไพ่ยิปซีรายวัน: กระจกส่องจิตและสติสัมปชัญญะ"
            faqs={DAILY_FAQS}
            links={DAILY_LINKS}
          >
            <p>
              ในวิถีแห่งทาโรต์ดั้งเดิม การเปิดไพ่ประจำวัน (Daily Tarot Draw) มิใช่การทำนายโชคชะตาแบบงมงาย
              หากแต่เป็นเครื่องมือทางจิตวิทยาที่ทรงพลังในการสร้าง &quot;สติสัมปชัญญะประจำวัน&quot;
              ตามทฤษฎีจิตวิทยาวิเคราะห์ของ คาร์ล กุสตาฟ ยุง (Carl Gustav Jung) ไพ่ทาโรต์ทำหน้าที่เป็นตัวสะท้อน
              ภาพสัญลักษณ์ต้นแบบ (Archetypes) จากจิตไร้สำนึกร่วม (Collective Unconscious)
              และปรากฏการณ์ความพ้องพานของเหตุการณ์ (Synchronicity)
            </p>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] pt-2">
              วิธีรับพลังงานจากไพ่ประจำวันให้เกิดประโยชน์สูงสุด
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-[#635B4E]">
              <li>
                <strong className="text-[#29261F]">การตั้งจิตอธิษฐานในตอนเช้า:</strong> ก่อนเริ่มทำงาน ให้หลับตาและหายใจเข้าลึกๆ
                สังเกตอารมณ์ความรู้สึกปัจจุบัน แล้วจึงแตะเลือกไพ่ด้วยสมาธิที่นิ่งสงบ
              </li>
              <li>
                <strong className="text-[#29261F]">พิจารณาสัญลักษณ์ในภาพ 1909 Rider-Waite:</strong> สำรับดั้งเดิมของ อาเธอร์ เอ็ดเวิร์ด เวท
                และ พาเมลา คอลแมน สมิธ เต็มไปด้วยรหัสสัญลักษณ์ลึกซึ้ง เช่น สีสัน ธาตุประจำไพ่ และท่วงท่าของตัวละคร
                ซึ่งมักสื่อความหมายตรงกับสถานการณ์ที่คุณกำลังจะเผชิญ
              </li>
              <li>
                <strong className="text-[#29261F]">การทบทวนเมื่อสิ้นสุดวัน (Evening Reflection):</strong> ก่อนนอน ลองหวนนึกถึงไพ่ที่เปิดได้ในตอนเช้า
                เทียบกับเหตุการณ์จริงที่เกิดขึ้น เพื่อฝึกฝนสัญชาตญาณและการตระหนักรู้ในตนเอง
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] pt-2">
              ทำไมต้องใช้ระบบสุ่มแบบ Provably Fair?
            </h3>
            <p>
              ที่ SeerTarot เรายึดมั่นในความซื่อตรงและความโปร่งใสสูงสุด ทุกครั้งที่คุณกดสับไพ่
              ระบบจะเรียกใช้ Web Crypto API ในการสร้างเลขสุ่มตามหลักการเข้ารหัสสากล
              ไม่มีการล็อกผล ไม่มีการแอบแฝงโฆษณา และไม่มีการกุไพ่ใบใดขึ้นมาเองเด็ดขาด
              เพื่อให้คุณมั่นใจได้ว่าคำทำนายทุกใบมาจากสมาธิและกระแสจิตของคุณอย่างแท้จริง
            </p>
          </SeoArticleShell>
        </div>
      </main>
    </>
  );
}
