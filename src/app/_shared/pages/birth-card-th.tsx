import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Ui2Crumbs, Ui2SectionHead } from "@/components/ui2/Ui2PageHero";
import { CardImage } from "@/components/card/CardImage";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { DECK } from "@/data/cards";
import type { BirthCardItem } from "@/lib/tarot/birth-card";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";

/**
 * ⚠️ ส่งเฉพาะฟิลด์ที่ `BirthCardCalculator` ใช้จริงเท่านั้น
 * ------------------------------------------------------------------
 * ก้อนนี้เป็น prop ของ client component ➔ ถูก serialize ลง flight payload (`__next_f`)
 * ในหน้า HTML ทุกครั้ง ทุกไบต์ที่ใส่เกินมาคือน้ำหนักที่ผู้ใช้ต้องดาวน์โหลดฟรี ๆ
 *
 * `keywords` / `keywordsEn` (รวม 12 KB ดิบ สำหรับไพ่ชุดใหญ่ 22 ใบ) **ไม่มีที่ไหนในคอมโพเนนต์เรียกใช้เลย**
 * เคยทำให้หน้านี้ทะลุงบ HTML (31 KB > 30 KB) จนด่าน Performance Budget ตกและ deploy ค้าง
 * ➔ ถ้าจะเพิ่มฟิลด์กลับเข้ามา ต้องมีที่เรียกใช้จริงก่อน แล้ววัดงบซ้ำด้วย `npm run test:budget`
 */
export const MAJOR_CARDS: BirthCardItem[] = DECK.filter((c) => c.arcana === "major").map((c) => ({
  id: c.id,
  arcana: c.arcana,
  suit: c.suit,
  number: c.number,
  nameTh: c.nameTh,
  nameEn: c.nameEn,
  image: c.image,
  element: c.element,
  astrology: c.astrology,
  astrologyEn: c.astrologyEn,
  numerology: c.numerology,
  numerologyEn: c.numerologyEn,
}));

const birthCardOgImages = buildPageOgImage({
  title: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card)",
  eyebrow: "ค้นหาไพ่ประจำวันเกิด",
  cardImage: "major-10.jpg",
  alt: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card) 1909 Rider-Waite",
});

export const birthCardMetadataTh: Metadata = {
  // GSC 2026-10-16: "ไพ่ประจำตัว" 26 แสดงผล 0 คลิก · "คำนวณไพ่ประจำตัว" ได้คลิก — ให้ title มีทั้งสองวลีตรงตัว
  title: "คำนวณไพ่ประจำตัว ไพ่ทาโรต์ประจำวันเกิด (Birth Card) ฟรี",
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
  alternates: buildAlternates("/cards/birth-card", { locale: "th", englishTwin: true }),
  openGraph: {
    title: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card) · SeerTarot",
    description:
      "ค้นหาไพ่ทาโรต์ประจำตัว (Birth Card) จากวันเดือนปีเกิดของคุณ ตามหลักเลขศาสตร์ 1909 Rider-Waite",
    url: `${SITE_ORIGIN}/cards/birth-card`,
    siteName: "SeerTarot",
    type: "website",
    images: birthCardOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "คำนวณไพ่ทาโรต์ประจำตัว (Birth Card) · SeerTarot",
    description:
      "ค้นหาไพ่ทาโรต์ประจำตัว (Birth Card) จากวันเดือนปีเกิดของคุณ ตามหลักเลขศาสตร์ 1909 Rider-Waite",
    images: [birthCardOgImages[0].url],
  },
};

const BIRTH_CARD_FAQS = [
  {
    q: "ไพ่ทาโรต์ประจำตัว (Birth Card) คืออะไร?",
    a: "ไพ่ทาโรต์ประจำตัวคือไพ่ชุดใหญ่ (Major Arcana) ที่คำนวณจากผลรวมของวัน เดือน และปีเกิดของคุณ เปรียบเหมือนกระจกที่สะท้อนนิสัยพื้นฐาน บทเรียนชีวิต และพรสวรรค์ที่ติดตัวคุณมาตั้งแต่เกิด",
  },
  {
    q: "ไพ่บุคลิกภาพ (Personality Card) กับ ไพ่จิตวิญญาณ (Soul Card) ต่างกันอย่างไร?",
    a: "ไพ่บุคลิกภาพ (Personality Card) สะท้อนวิธีที่คุณปฏิสัมพันธ์กับโลกภายนอก พฤติกรรมที่ผู้คนมองเห็น และวิธีที่คุณรับมือกับชีวิตประจำวัน ส่วนไพ่จิตวิญญาณ (Soul Card) สะท้อนความปรารถนาลึก ๆ เจตจำนงแห่งจิตวิญญาณ และการเติบโตทางปัญญาตลอดช่วงชีวิต",
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

/** สูตรสามขั้น (ตัวอย่างจริง: 14 ก.พ. 1997) — ตัวเลขตรงกับ `calculateBirthCard` */
const BIRTH_STEPS = [
  { title: "บวกวัน เดือน ปี ค.ศ.", math: "14 + 2 + 1997 = 2013", text: "ใช้ปีคริสต์ศักราช (ค.ศ.) ถ้ากรอกเป็น พ.ศ. ระบบลบ 543 ให้เอง" },
  { title: "บวกเลขทีละหลัก", math: "2 + 0 + 1 + 3 = 6", text: "บวกซ้ำจนเหลือไม่เกิน 22 ตรงกับไพ่ชุดใหญ่ 22 ใบ (22 คือ The Fool หมายเลข 0)" },
  { title: "ได้ไพ่ประจำตัว", math: "6 = The Lovers", text: "ถ้าได้ 10 ถึง 21 บวกสองหลักอีกครั้งเป็นไพ่ใบที่สอง (ไพ่จิตวิญญาณ)" },
];

/** คู่ไพ่ประจำตัว 12 แบบ (เลขไพ่ชุดใหญ่ · ไพ่บุคลิกภาพก่อน ไพ่จิตวิญญาณหลัง) */
const BIRTH_PAIRS: { cards: number[]; title: string; text: string }[] = [
  { cards: [10, 1], title: "The Wheel of Fortune และ The Magician", text: "เจอจุดเปลี่ยนบ่อย แต่มีพรสวรรค์เปลี่ยนวิกฤตเป็นโอกาสด้วยสติปัญญาและทักษะรอบด้าน" },
  { cards: [11, 2], title: "Justice และ The High Priestess", text: "ญาณหยั่งรู้ลึกซึ้งคู่กับความยึดมั่นในความถูกต้อง มักเป็นที่พึ่งและผู้ไกล่เกลี่ยให้คนอื่น" },
  { cards: [12, 3], title: "The Hanged Man และ The Empress", text: "ยอมหยุดเพื่อเห็นมุมใหม่ แล้วความคิดสร้างสรรค์และความอุดมสมบูรณ์ทางใจจะตามมา" },
  { cards: [13, 4], title: "Death และ The Emperor", text: "รื้อโครงสร้างเก่าที่ไม่จำเป็น เพื่อสร้างความมั่นคงและระเบียบใหม่ที่แข็งแรงกว่าเดิม" },
  { cards: [14, 5], title: "Temperance และ The Hierophant", text: "ผสมความเชื่อและธรรมเนียมเข้ากับความยืดหยุ่น เพื่อสร้างความสงบและการเรียนรู้ทางใจ" },
  { cards: [15, 6], title: "The Devil และ The Lovers", text: "บททดสอบของความปรารถนาและพันธนาการทางใจ ที่ท้าให้เลือกความรักที่ทำให้ใจเป็นอิสระ" },
  { cards: [16, 7], title: "The Tower และ The Chariot", text: "แรงมุ่งมั่นพุ่งไปข้างหน้า ที่ต้องเรียนรู้การปล่อยวางตัวตนเมื่อเจอการเปลี่ยนแปลงฉับพลัน" },
  { cards: [17, 8], title: "The Star และ Strength", text: "ความหวัง การเยียวยาใจ และความอ่อนโยนที่สยบความดุร้ายในตัวเองได้อย่างสงบ" },
  { cards: [18, 9], title: "The Moon และ The Hermit", text: "เดินผ่านความกลัวและความกำกวมในใจ โดยมีปัญญาเป็นตะเกียงส่องทาง" },
  { cards: [19, 10, 1], title: "The Sun, The Wheel of Fortune และ The Magician", text: "ไพ่สามใบแห่งแสงสว่าง ความชัดเจน และความสำเร็จที่เบิกบาน" },
  { cards: [20, 2], title: "Judgement และ The High Priestess", text: "เสียงเรียกให้ตื่นรู้ ปล่อยอดีตลง แล้วเริ่มต้นชีวิตใหม่อย่างบริสุทธิ์ใจ" },
  { cards: [21, 3], title: "The World และ The Empress", text: "การเดินทางที่ครบสมบูรณ์ ความอุดมสมบูรณ์ และความรู้สึกเป็นหนึ่งเดียวกับโลก" },
];

export function BirthCardBodyTh({ calculator }: { calculator: ReactNode }) {
  const url = `${SITE_ORIGIN}/cards/birth-card`;

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "ระบบคำนวณไพ่ทาโรต์ประจำตัว (Tarot Birth Card Calculator)",
    description: "เครื่องมือคำนวณไพ่ประจำวันเกิดและไพ่จิตวิญญาณตามหลักเลขศาสตร์ไพ่ทาโรต์สากล",
    url,
    inLanguage: "th",
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
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink pb-10 px-4 sm:px-6 font-sans relative overflow-x-clip">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />

      <div className="v2-bcp">
        {/*
          v2 (เจ้าของ 2026-10-16 "สร้างใหม่เลย ไม่ใช่เอา UI เก่ามาอัปเกรด") — จอแรกคือเครื่องคำนวณเลย
          v1: หัวใหญ่ + ไพ่ลอย ➔ เลื่อนลงไปกรอก ➔ เลื่อนอีกทีไปดูผล · v2: หัวสั้น ➔ โต๊ะกรอก+ช่องไพ่ในจอเดียว
        */}
        <header className="v2-bcp-head">
          <Ui2Crumbs crumbs={breadcrumbs} />
          <h1 className="v2-bcp-title">
            <span className="tp">คำนวณ</span>{" "}
            <span className="tp ui2-gold-night">ไพ่ทาโรต์ประจำตัว</span>
            <span className="v2-bcp-title-sub tp">จากวันเกิดของคุณ</span>
          </h1>
          <p className="v2-bcp-lede">
            <ThaiPhrases>ใส่วันเดือนปีเกิด แล้วรู้ทันทีว่าไพ่ชุดใหญ่ใบไหนคือตัวตนของคุณ พร้อมคำอ่านจากแม่หมอ</ThaiPhrases>
          </p>
        </header>

        {/* ห่อ div — <astro-island> เป็น display:contents */}
        <div className="v2-bcp-tool">{calculator}</div>

        {/* สูตรสามขั้น — ตัวอย่างจริงทีละขั้น แทนย่อหน้ายาวของ v1 */}
        <section className="v2-bcp-sec" aria-labelledby="bc-how">
          <Ui2SectionHead n="01" word="วิธีคำนวณ" title="สูตรไพ่ประจำตัว 3 ขั้น" id="bc-how" />
          <ol className="v2-bcp-steps">
            {BIRTH_STEPS.map((step, i) => (
              <li key={step.title} className="v2-bcp-stepcard">
                <span className="v2-bcp-stepn" aria-hidden="true">{i + 1}</span>
                <h3>
                  <ThaiPhrases>{step.title}</ThaiPhrases>
                </h3>
                <p className="v2-bcp-math">{step.math}</p>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* คู่ไพ่ 12 แบบ — ภาพไพ่จริงคู่กัน แทนรายการตัวหนังสือยาวของ v1 */}
        <section className="v2-bcp-sec" aria-labelledby="bc-pairs">
          <Ui2SectionHead
            n="02"
            word="คู่ไพ่"
            title="ไพ่สองใบของคุณ บอกอะไร"
            lede="คู่ไพ่ประจำตัวช่วยให้เข้าใจความขัดแย้งและความสมดุลในตัวเอง ทั้งหมดมี 12 แบบ"
            id="bc-pairs"
          />
          <ul className="v2-bcp-pairs">
            {BIRTH_PAIRS.map((pair) => (
              <li key={pair.title} className="v2-bcp-pair">
                <span className="v2-bcp-pair-fan" aria-hidden="true">
                  {pair.cards.map((n) => (
                    <span key={n} className="v2-bcp-pair-card">
                      <CardImage cardId={`major-${String(n).padStart(2, "0")}`} alt="" thumb sizes="64px" loading="lazy" />
                    </span>
                  ))}
                </span>
                <div>
                  <h3>{pair.title}</h3>
                  <p>{pair.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Editorial Guide Article */}
        <SeoArticleShell
          eyebrow="ถอดรหัสจิตวิทยา"
          title="ศาสตร์แห่งไพ่ทาโรต์ประจำตัว: พิมพ์เขียวพลังงาน และกระจกส่องจิตวิญญาณตลอดชีวิต"
          faqs={BIRTH_CARD_FAQS}
          links={[
            { label: "สารานุกรมไพ่ 78 ใบ", href: "/cards" },
            { label: "ผังดวงกำเนิด (ลัคนา ดาว 10 ดวง)", href: "/natal-chart" },
            { label: "ดูดวงไพ่ยิปซีรายวัน", href: "/daily" },
            { label: "ดูดวงความรัก 1 ใบ", href: "/love/1-card" },
            { label: "ผังพยากรณ์ 26 แบบ", href: "/spreads" },
            { label: "เริ่มดูดวงที่หน้าแรก", href: "/" },
          ]}
        >
          <div className="space-y-4 text-xs sm:text-sm text-muted font-sans leading-relaxed">
            <p>
              ในศาสตร์ไพ่ทาโรต์และเลขศาสตร์ เชื่อกันว่าวันเกิดบอกนิสัยพื้นฐานและเรื่องที่เราต้องเรียนรู้ในชีวิตได้
              วิธีหาไพ่ประจำวันเกิด (Tarot Birth Card) ที่ใช้กันแพร่หลายมาจากนักเขียนไพ่ทาโรต์ชื่อดัง
              เช่น Mary K. Greer (ผู้เขียนหนังสือ <em>Who Are You in the Tarot?</em>) และ Angeles Arrien
              ซึ่งมองภาพบนไพ่ชุดใหญ่เป็นเรื่องราวชีวิตที่คนทุกยุคเข้าใจตรงกัน (แนวคิดเดียวกับนักจิตวิทยา คาร์ล ยุง)
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3"><ThaiPhrases>
              วิธีคำนวณไพ่จากวันเกิด
            </ThaiPhrases></h3>
            <p>
              การคำนวณไพ่ประจำตัวจะใช้วันที่ เดือน และปีเกิดที่เป็นปีสากล (คริสต์ศักราช ค.ศ.) มาบวกรวมกันเป็นผลรวมเดียว
              จากนั้นเอาเลขแต่ละหลักมาบวกกันซ้ำจนเหลือเลขที่ตรงกับไพ่ชุดใหญ่ (Major Arcana) หมายเลข 0 ถึง 21
              โดยไพ่ชุดใหญ่นี้เปรียบเสมือนการเดินทางของจิตวิญญาณ (The Fool’s Journey) ที่มนุษย์ทุกคนต้องผ่านด่านการเรียนรู้
            </p>
            <p>
              ในระบบเลขศาสตร์ทาโรต์ หากผลรวมขั้นแรกมีค่าตั้งแต่ 10 ถึง 21 ผลรวมนั้นจะเป็นตัวกำหนด <strong>ไพ่บุคลิกภาพ (Personality Card)</strong>
              และเมื่อนำตัวเลขสองหลักนั้นมาบวกกันอีกครั้ง จะได้ตัวเลขหลักเดียว (1-9) ซึ่งเป็นตัวแทนของ <strong>ไพ่จิตวิญญาณ (Soul Card)</strong>
              ส่วนผู้ที่มีผลลัพธ์เป็นตัวเลข 1 ถึง 9 ตั้งแต่แรก จะถือว่ามีพลังงานของไพ่บุคลิกภาพและจิตวิญญาณเป็นหนึ่งเดียวกันอย่างลึกซึ้ง
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3"><ThaiPhrases>
              วิธีนำพลังงานไพ่ประจำตัว ไปปรับใช้เพื่อการพัฒนาตนเอง
            </ThaiPhrases></h3>
            <p>
              การรู้จักไพ่ทาโรต์ประจำตัวไม่ใช่การทำนายดวงชะตาแบบพยากรณ์ตายตัว แต่เป็นเครื่องมือสำหรับการใคร่ครวญตนเอง (Self-Reflection):
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-muted">
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
      {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
      <Ui2NextSteps isEn={false} keys={["spreads", "natal", "journal", "cards"]} />
    </main>
  );
}
