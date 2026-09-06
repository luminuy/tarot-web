import type { Metadata } from "next";
import { BirthCardCalculator } from "@/components/encyclopedia/BirthCardCalculator";
import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
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
    q: "ไพ่ทาโรต์ประจำตัว (Birth Card) คืออะไร?",
    a: "ไพ่ทาโรต์ประจำตัวคือไพ่ชุดใหญ่ (Major Arcana) ที่คำนวณจากผลรวมของวัน เดือน และปีเกิดของคุณ ทำหน้าที่เป็นแม่พิมพ์ต้นแบบทางจิตวิทยา (Jungian Archetype) และกระจกสะท้อนบทเรียนชีวิต แก่นแท้ของจิตวิญญาณ และพรสวรรค์ที่ติดตัวคุณมาตั้งแต่กำเนิด",
  },
  {
    q: "ไพ่บุคลิกภาพ (Personality Card) กับ ไพ่จิตวิญญาณ (Soul Card) ต่างกันอย่างไร?",
    a: "ไพ่บุคลิกภาพ (Personality Card) สะท้อนวิธีที่คุณปฏิสัมพันธ์กับโลกภายนอก พฤติกรรมที่ผู้คนมองเห็น และวิธีที่คุณรับมือกับชีวิตประจำวัน ส่วนไพ่จิตวิญญาณ (Soul Card) สะท้อนความปรารถนาลึกๆ เจตจำนงแห่งจิตวิญญาณ และการเติบโตทางปัญญาตลอดช่วงชีวิต",
  },
  {
    q: "หากคำนวณแล้วได้ไพ่ใบเดียว หมายความว่าอย่างไร?",
    a: "หากผลลัพธ์เป็นเลขโดดหลักเดียว (1-9) ไพ่ใบนั้นจะทำหน้าที่เป็นทั้งไพ่บุคลิกภาพและไพ่จิตวิญญาณในใบเดียวกัน ซึ่งหมายความว่าการแสดงออกภายนอกกับเจตนาภายในของคุณมีความเป็นอันหนึ่งอันเดียวกันอย่างลึกซึ้ง",
  },
  {
    q: "ไพ่ประจำตัวเปลี่ยนตามปีหรือตามวัยหรือไม่?",
    a: "ไพ่ประจำตัว (Birth Card) มาจากวันเกิดของคุณจึงไม่มีวันเปลี่ยนแปลงไปตลอดชีวิต แต่ในแต่ละปี คุณจะมี 'ไพ่ประจำปี' (Year Card) ที่เปลี่ยนไปตามรอบปีเกิด ซึ่งใช้ดูแนวโน้มบทเรียนชีวิตในแต่ละขวบปีได้",
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
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const breadcrumbs = [
    { label: "หน้าแรก", href: "/" },
    { label: "สารานุกรมไพ่ 78 ใบ", href: "/cards" },
    { label: "คำนวณไพ่ประจำตัว" },
  ];

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip">
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

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Ritual Hero */}
        <RitualHero
          breadcrumbs={breadcrumbs}
          badgeText="เลขศาสตร์ทาโรต์สากล"
          title="คำนวณไพ่ทาโรต์ประจำตัว"
          tagline="ค้นพบแม่พิมพ์จิตวิทยา (Archetype) และเจตนารมณ์แห่งจิตวิญญาณที่ซ่อนอยู่ในวันเกิดของคุณ ด้วยสำรับไพ่ดั้งเดิม 1909 Rider-Waite"
        />

        {/* Interactive Calculator Component */}
        <BirthCardCalculator />

        {/* Editorial Guide Article */}
        <SeoArticleShell
          eyebrow="ถอดรหัสจิตวิทยา"
          title="ศาสตร์แห่งไพ่ทาโรต์ประจำตัว: พิมพ์เขียวพลังงานและกระจกส่องจิตวิญญาณตลอดชีวิต"
          faqs={BIRTH_CARD_FAQS}
          links={[
            { label: "สารานุกรมไพ่ 78 ใบ", href: "/cards" },
            { label: "ดูดวงไพ่ยิปซีรายวัน", href: "/daily" },
            { label: "ดูดวงความรัก 1 ใบ", href: "/love/1-card" },
            { label: "ผังพยากรณ์ 25 แบบ", href: "/spreads" },
            { label: "เริ่มดูดวงที่หน้าแรก", href: "/" },
          ]}
        >
          <div className="space-y-4 text-xs sm:text-sm text-[#4A4338] font-sans leading-relaxed">
            <p>
              ในศาสตร์ไพ่ทาโรต์และเลขศาสตร์สากล วันเกิดของมนุษย์แต่ละคนไม่ใช่เรื่องบังเอิญ แต่เป็นหมุดหมายแห่งกาลเวลาที่กำหนดคลื่นความถี่พลังงาน
              (Vibrational Blueprint) และพิมพ์เขียวแห่งจิตวิญญาณ การคำนวณหาไพ่ทาโรต์ประจำตัว (Tarot Birth Card) ได้รับการวางรากฐานทางวิชาการ
              โดยนักค้นคว้าและปรมาจารย์ด้านไพ่ทาโรต์ร่วมสมัย เช่น Mary K. Greer (ผู้เขียนหนังสือ <em>Who Are You in the Tarot?</em>)
              และ Angeles Arrien ซึ่งผสานศาสตร์แห่งสัญลักษณ์วิทยาโบราณเข้ากับทฤษฎีแม่พิมพ์จิตวิทยาดั้งเดิม (Archetypes) ของ คาร์ล ยุง (Carl Gustav Jung)
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
              กลไกการคำนวณและมิติแห่งตัวเลข (Digit Reduction & Major Arcana)
            </h3>
            <p>
              การคำนวณไพ่ประจำตัวจะใช้วันที่ เดือน และปีเกิดที่เป็นปีสากล (คริสต์ศักราช ค.ศ.) มาบวกรวมกันเป็นผลรวมเดียว
              จากนั้นจึงทำการลดทอนตัวเลข (Digit Reduction) ให้เหลือค่าที่สอดคล้องกับไพ่ชุดใหญ่ (Major Arcana) หมายเลข 0 ถึง 21
              โดยไพ่ชุดใหญ่นี้เปรียบเสมือนการเดินทางของจิตวิญญาณ (The Fool’s Journey) ที่มนุษย์ทุกคนต้องผ่านด่านการเรียนรู้
            </p>
            <p>
              ในระบบเลขศาสตร์ทาโรต์ หากผลรวมขั้นแรกมีค่าตั้งแต่ 10 ถึง 21 ผลรวมนั้นจะเป็นตัวกำหนด <strong>ไพ่บุคลิกภาพ (Personality Card)</strong>
              และเมื่อนำตัวเลขสองหลักนั้นมาบวกกันอีกครั้ง จะได้ตัวเลขหลักเดียว (1-9) ซึ่งเป็นตัวแทนของ <strong>ไพ่จิตวิญญาณ (Soul Card)</strong>
              ส่วนผู้ที่มีผลลัพธ์เป็นตัวเลข 1 ถึง 9 ตั้งแต่แรก จะถือว่ามีพลังงานของไพ่บุคลิกภาพและจิตวิญญาณเป็นหนึ่งเดียวกันอย่างลึกซึ้ง
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
              ความสัมพันธ์ของคู่ไพ่แห่งดวงวิญญาณ (Archetypal Constellations)
            </h3>
            <p>
              คู่ไพ่ประจำตัวช่วยให้เราเข้าใจความขัดแย้งและความสมดุลภายในตนเอง ตัวอย่างเช่น:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[#5E5240]">
              <li>
                <strong>The Wheel of Fortune (10) และ The Magician (1):</strong> ผู้ที่ถือครองคู่ไพ่นี้มักเผชิญกับจุดเปลี่ยนและจังหวะชีวิตที่ไม่หยุดนิ่ง
                แต่มีพรสวรรค์ในการแปรเปลี่ยนวิกฤตให้เป็นโอกาสด้วยสติปัญญาและทักษะรอบด้าน
              </li>
              <li>
                <strong>Justice (11) และ The High Priestess (2):</strong> สะท้อนบุคคลผู้มีญาณหยั่งรู้ลึกซึ้ง ควบคู่กับความยึดมั่นในสัจธรรมและความยุติธรรม
                มักทำหน้าที่เป็นที่พึ่งทางปัญญาและผู้ไกล่เกลี่ยปัญหาให้ผู้อื่น
              </li>
              <li>
                <strong>The Hanged Man (12) และ The Empress (3):</strong> สัญลักษณ์แห่งการยอมจำนนเพื่อค้นพบมุมมองใหม่ นำไปสู่การกำเนิดของความคิดสร้างสรรค์
                และความอุดมสมบูรณ์ทางจิตใจ
              </li>
              <li>
                <strong>Death (13) และ The Emperor (4):</strong> พลังงานแห่งการผลัดเปลี่ยนโครงสร้างเดิม การทลายสิ่งเก่าที่ไม่จำเป็นเพื่อสถาปนาความมั่นคง
                และระเบียบวินัยใหม่อันแข็งแกร่ง
              </li>
              <li>
                <strong>Temperance (14) และ The Hierophant (5):</strong> การผสมผสานความเชื่อ ธรรมเนียมประเพณี เข้ากับความยืดหยุ่นและการประนีประนอม
                เพื่อสร้างสันติภาพและการเรียนรู้ทางจิตวิญญาณ
              </li>
              <li>
                <strong>The Devil (15) และ The Lovers (6):</strong> บททดสอบแห่งความปรารถนา กิเลส และพันธนาการทางใจ ซึ่งท้าทายให้มนุษย์เลือกเส้นทางแห่งความรักบริสุทธิ์
                และการตระหนักรู้ในอิสรภาพที่แท้จริง
              </li>
              <li>
                <strong>The Tower (16) และ The Chariot (7):</strong> พลังงานแห่งความมุ่งมั่นพุ่งทะยานที่ต้องผ่านบทเรียนการปล่อยวางตัวตน (Ego)
                เมื่อเผชิญกับการเปลี่ยนแปลงแบบฉับพลัน เพื่อสร้างความแข็งแกร่งจากภายใน
              </li>
              <li>
                <strong>The Star (17) และ Strength (8):</strong> ความหวัง การเยียวยาจิตวิญญาณ และพลังแห่งความอ่อนโยนที่สามารถสยบความดุร้ายของสัญชาตญาณได้อย่างสงบงาม
              </li>
              <li>
                <strong>The Moon (18) และ The Hermit (9):</strong> การเดินทางข้ามผ่านความกลัว ความกำกวม และภาพลวงตาในจิตใต้สำนึก โดยอาศัยแสงประทีปแห่งปัญญา
                และการปลีกวิเวกเพื่อค้นพบสัจธรรมในตน
              </li>
              <li>
                <strong>The Sun (19), The Wheel of Fortune (10) และ The Magician (1):</strong> กลุ่มไพ่สามประสานแห่งแสงสว่าง ความกระจ่างแจ้ง และความสำเร็จอันเบิกบาน
              </li>
              <li>
                <strong>Judgement (20) และ The High Priestess (2):</strong> เสียงเพรียกแห่งการตื่นรู้ทางจิตวิญญาณและการปลดปล่อยอดีตเพื่อเริ่มต้นชีวิตใหม่อย่างบริสุทธิ์
              </li>
              <li>
                <strong>The World (21) และ The Empress (3):</strong> ความสมบูรณ์แบบของการเดินทาง ความอุดมสมบูรณ์ และการรวมเป็นหนึ่งเดียวกับจักรวาล
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] pt-3">
              วิธีนำพลังงานไพ่ประจำตัวไปปรับใช้เพื่อการพัฒนาตนเอง
            </h3>
            <p>
              การรู้จักไพ่ทาโรต์ประจำตัวไม่ใช่การทำนายดวงชะตาแบบพยากรณ์ตายตัว แต่เป็นเครื่องมือสำหรับการใคร่ครวญตนเอง (Self-Reflection):
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-[#5E5240]">
              <li>
                <strong>โอบรับทั้งด้านสว่างและด้านเงา:</strong> ไพ่ทุกใบสะท้อนศักยภาพสูงสุดเมื่อมีสติ (Light Aspect)
                และความผิดพลาดที่อาจเกิดขึ้นเมื่อตกอยู่ใต้ความกลัว (Shadow Aspect) การตระหนักรู้ในไพ่ของตนเองช่วยให้คุณจับสัญญาณเตือนภัยได้ก่อนก้าวพลาด
              </li>
              <li>
                <strong>เข็มทิศในการตัดสินใจครั้งสำคัญ:</strong> เมื่อถึงทางแยกของชีวิต ให้ถามตนเองว่า การตัดสินใจแบบใดสอดคล้องกับคุณค่าและแม่พิมพ์ของไพ่ประจำตัวคุณมากที่สุด
              </li>
              <li>
                <strong>ใช้ภาพสัญลักษณ์ 1909 Rider-Waite เป็นจุดรวมสมาธิ:</strong> การเพ่งพินิจสัญลักษณ์ สี และท่าทางของตัวละครบนหน้าไพ่ดั้งเดิม 1909
                จะช่วยกระตุ้นการทำงานของจิตใต้สำนึกและเชื่อมโยงคุณเข้ากับปัญญาญาณภายใน
              </li>
            </ol>
          </div>
        </SeoArticleShell>
      </div>
    </main>
  );
}
