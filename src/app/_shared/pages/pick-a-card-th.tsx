import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";

const pickACardOgImages = buildPageOgImage({
  title: "Pick A Card เลือกกองไพ่พยากรณ์",
  eyebrow: "พยากรณ์ด้วยไพ่ 4 กอง",
  cardImage: "major-17.jpg",
  alt: "Pick A Card เลือกกองไพ่พยากรณ์ 1909 Rider-Waite",
});

export const pickACardMetadataTh: Metadata = {
  // layout เติมท้าย " · SeerTarot" ให้เองอยู่แล้ว — นับรวม 45 + 12 = 57 ตัวอักษร (ไม่เกินเพดาน 60)
  title: "Pick A Card เลือกกองไพ่พยากรณ์ ดูดวงแม่น ๆ ฟรี",
  description:
    "Pick A Card เลือกกองไพ่พยากรณ์ 8 หัวข้อ ทั้งเขาคิดยังไง เขาจะกลับมาไหม คนที่กำลังจะเข้ามา การงาน การเงิน และข้อความจากจักรวาล ฟรี ไร้โฆษณา",
  keywords: [
    "pick a card",
    "pick a card ความรัก",
    "เลือกกองไพ่",
    "ดูดวง pick a card",
    "pick a card เขาคิดยังไง",
    "pick a card การงาน",
    "ดูดวงไพ่ยิปซีฟรี",
  ],
  alternates: buildAlternates("/pick-a-card", { locale: "th", englishTwin: true }),
  openGraph: {
    title: "Pick A Card เลือกกองไพ่พยากรณ์ ดูดวงแม่น ๆ ฟรี · SeerTarot",
    description:
      "เลือกกองไพ่พยากรณ์ 4 กอง สำรวจความคิดในใจเขา ทิศทางความรัก และก้าวต่อไปเรื่องงานด้วยไพ่ 1909 Rider-Waite แท้",
    url: `${SITE_ORIGIN}/pick-a-card`,
    siteName: "SeerTarot",
    locale: "th_TH",
    type: "website",
    images: pickACardOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pick A Card เลือกกองไพ่พยากรณ์ ดูดวงแม่น ๆ ฟรี · SeerTarot",
    description:
      "เลือกกองไพ่พยากรณ์ 4 กอง สำรวจความคิดในใจเขา ทิศทางความรัก และก้าวต่อไปเรื่องงานด้วยไพ่ 1909 Rider-Waite แท้",
    images: [pickACardOgImages[0].url],
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
      name: "Pick A Card เลือกกองไพ่",
      item: `${SITE_ORIGIN}/pick-a-card`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "การดูดวงแบบ Pick A Card คืออะไรและทำงานอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pick A Card (เลือกกองไพ่พยากรณ์) คือรูปแบบการพยากรณ์ที่จัดกลุ่มไพ่ทาโรต์ออกเป็น 4 กอง โดยผู้ทำนายจะทำสมาธิแล้วเลือกกองไพ่ที่มีพลังงานดึงดูดใจตนเองมากที่สุด เพื่อรับฟังสารและคำชี้แนะในประเด็นที่ตนเองกำลังสงสัย",
      },
    },
    {
      "@type": "Question",
      name: "วิธีเลือกกองไพ่ให้แม่นยำที่สุดควรทำอย่างไร?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "หลับตา สูดลมหายใจเข้าลึก ๆ ช้า ๆ ทำจิตใจให้สงบ นึกถึงคำถามหรือบุคคลที่คุณต้องการถามอย่างชัดเจน จากนั้นลืมตาขึ้นมาและเลือกกองไพ่ที่คุณรู้สึกสะดุดตาหรือรู้สึกดึงดูดใจเป็นกองแรกโดยไม่ต้องใช้เหตุผลวิเคราะห์",
      },
    },
    {
      "@type": "Question",
      name: "สามารถเลือกดูมากกว่า 1 กอง หรือเลือกซ้ำได้หรือไม่?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "หากคุณรู้สึกดึงดูดใจกับ 2 กองพร้อมกัน สามารถอ่านคำทำนายของทั้งสองกองเพื่อประกอบกันได้ แต่ไม่แนะนำให้เปิดซ้ำในคำถามเดิมในทันที หากต้องการความชัดเจนเฉพาะเจาะจง แนะนำให้ใช้การเปิดไพ่ผังเต็มรูปแบบ 3D กับแม่หมอ AI",
      },
    },
  ],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SeerTarot Pick A Card Oracle",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "All",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "THB",
  },
  url: `${SITE_ORIGIN}/pick-a-card`,
};

const PICK_A_CARD_FAQS = [
  {
    q: "การดูดวงแบบ Pick A Card คืออะไรและทำงานอย่างไร?",
    a: "Pick A Card (เลือกกองไพ่พยากรณ์) คือรูปแบบการพยากรณ์ที่จัดกลุ่มไพ่ทาโรต์ออกเป็น 4 กอง โดยผู้ทำนายจะทำสมาธิแล้วเลือกกองไพ่ที่มีพลังงานดึงดูดใจตนเองมากที่สุด เพื่อรับฟังสารและคำชี้แนะในประเด็นที่ตนเองกำลังสงสัย",
  },
  {
    q: "วิธีเลือกกองไพ่ให้แม่นยำที่สุดควรทำอย่างไร?",
    a: "หลับตา สูดลมหายใจเข้าลึก ๆ ช้า ๆ ทำจิตใจให้สงบ นึกถึงคำถามหรือบุคคลที่คุณต้องการถามอย่างชัดเจน จากนั้นลืมตาขึ้นมาและเลือกกองไพ่ที่คุณรู้สึกสะดุดตาหรือรู้สึกดึงดูดใจเป็นกองแรกโดยไม่ต้องใช้เหตุผลวิเคราะห์",
  },
  {
    q: "สามารถเลือกดูมากกว่า 1 กอง หรือเลือกซ้ำได้หรือไม่?",
    a: "หากคุณรู้สึกดึงดูดใจกับ 2 กองพร้อมกัน สามารถอ่านคำทำนายของทั้งสองกองเพื่อประกอบกันได้ แต่ไม่แนะนำให้เปิดซ้ำในคำถามเดิมในทันที หากต้องการความชัดเจนเฉพาะเจาะจง แนะนำให้ใช้การเปิดไพ่ผังเต็มรูปแบบ 3D กับแม่หมอ AI",
  },
];

const PICK_A_CARD_LINKS = [
  { href: "/daily", label: "ดูดวงไพ่ยิปซีรายวัน" },
  { href: "/love/1-card", label: "ดูดวงความรัก 1 ใบ" },
  { href: "/cards", label: "สารานุกรมไพ่ 78 ใบ" },
  { href: "/spreads", label: "ผังพยากรณ์ 25 แบบ" },
];

export function PickACardBodyTh({ ritual }: { ritual: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareApplicationJsonLd) }}
      />

      <main id="main-content" tabIndex={-1} className="min-h-screen py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {ritual}

          <SeoArticleShell
            eyebrow="ศาสตร์แห่งการเลือกกองไพ่"
            title="พลังแห่งการเลือกกองไพ่ Pick A Card: เมื่อจิตใต้สำนึกนำทางความจริง"
            faqs={PICK_A_CARD_FAQS}
            links={PICK_A_CARD_LINKS}
          >
            <p>
              การพยากรณ์แบบ <strong>Pick A Card</strong> ได้รับความนิยมอย่างแพร่หลายทั่วโลก
              เนื่องจากเป็นการเปิดพื้นที่ให้จิตใต้สำนึก (Subconscious Mind)
              ได้มีบทบาทในการเลือกรับพลังงานสัญลักษณ์ที่สอดคล้องกับสภาวะจิตใจ ณ ขณะนั้น
              แทนที่จะเป็นการสุ่มแบบไร้จุดมุ่งหมาย สัญลักษณ์และหินคริสตัลประจำแต่ละกองทำหน้าที่เป็น
              &quot;หมุดหมายแห่งพลังงาน&quot; (Energetic Anchors) ช่วยให้คุณตั้งสมาธิได้ลึกซึ้งยิ่งขึ้น
            </p>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink pt-2">
              ความหมายของคริสตัลทั้ง 4 ชนิดประจำกองไพ่
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>
                <strong className="text-ink">กองที่ 1 โรสควอตซ์ (Rose Quartz):</strong> หินแห่งความอ่อนโยน
                การเปิดใจรับความรัก และการเยียวยาบาดแผลทางอารมณ์ เหมาะสำหรับคนที่ต้องการความอบอุ่นและคำปลอบประโลมใจ
              </li>
              <li>
                <strong className="text-ink">กองที่ 2 อเมทิสต์ (Amethyst):</strong> หินแห่งสติปัญญา สัญชาตญาณ
                และการมองเห็นความจริง เหมาะสำหรับผู้ที่กำลังสับสนและต้องการความชัดเจนในการตัดสินใจ
              </li>
              <li>
                <strong className="text-ink">กองที่ 3 ซิทริน (Citrine):</strong> หินแห่งความมั่งคั่ง พลังงานบวก
                และความสำเร็จ เหมาะสำหรับผู้ที่ต้องการแรงผลักดันเรื่องงาน การเงิน และโอกาสใหม่ ๆ ในชีวิต
              </li>
              <li>
                <strong className="text-ink">กองที่ 4 ลาปิส ลาซูลี (Lapis Lazuli):</strong> หินแห่งสัจธรรม
                การหยั่งรู้ และบทเรียนแห่งโชคชะตา เหมาะสำหรับการทบทวนเป้าหมายชีวิตและภารกิจแห่งจิตวิญญาณ
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink pt-2">
              ข้อแนะนำในการนำคำทำนายไปปรับใช้ในชีวิตจริง
            </h3>
            <p>
              คำทำนายไพ่ทาโรต์ไม่ใช่คำพิพากษาตายตัว หากแต่เป็นเหมือนแผนที่สะท้อนพลังงานในปัจจุบันและทิศทางที่น่าจะเป็นไป
              เมื่อคุณได้รับทราบข้อคิดเตือนใจและคำแนะนำจากไพ่แล้ว คุณยังมีเจตจำนงเสรี (Free Will)
              ในการเลือกตัดสินใจ ปรับปรุงพฤติกรรม และสร้างสรรค์อนาคตที่ดีขึ้นด้วยตัวของคุณเองเสมอ
            </p>
          </SeoArticleShell>
        </div>
      </main>
    </>
  );
}
