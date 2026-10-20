import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { DailyArticle } from "@/components/daily/DailyArticle";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { CardImage } from "@/components/card/CardImage";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";

const dailyOgImages = buildPageOgImage({
  title: "ดูดวงไพ่ยิปซีรายวัน",
  eyebrow: "ไพ่นำทางประจำวัน",
  cardImage: "major-19.jpg",
  alt: "ดูดวงไพ่ยิปซีรายวัน 1909 Rider-Waite",
});

export const dailyMetadataTh: Metadata = {
  // layout เติมท้าย " · SeerTarot" ให้เองอยู่แล้ว — เขียน "| SeerTarot" เองอีกจะซ้ำสองรอบ
  title: "ดูดวงไพ่ยิปซีรายวัน ไพ่ทาโรต์นำทางวันนี้ ฟรี",
  description:
    "ดูดวงไพ่ยิปซีรายวันแม่น ๆ เปิดไพ่ 1 ใบทำนายพลังงานประจำวัน ทั้งการงาน การเงิน ความรัก และข้อคิดเตือนสติ ด้วยไพ่ 1909 Rider-Waite แท้ 78 ใบ ไร้โฆษณา",
  keywords: [
    "ดูดวงไพ่ยิปซีรายวัน",
    "ไพ่ยิปซีรายวัน",
    "ดูดวงรายวัน",
    "ไพ่ทาโรต์รายวัน",
    "ดูดวงไพ่ยิปซี 1 ใบ",
    "เปิดไพ่รายวันฟรี",
    "ดูดวงแม่น ๆ วันนี้",
  ],
  alternates: buildAlternates("/daily", { locale: "th", englishTwin: true }),
  openGraph: {
    title: "ดูดวงไพ่ยิปซีรายวัน ไพ่ทาโรต์นำทางวันนี้ · SeerTarot",
    description:
      "เปิดไพ่ยิปซี 1 ใบเช็กพลังงานประจำวัน ทั้งการงาน การเงิน ความรัก และข้อควรระวัง ด้วยสำรับ 1909 Rider-Waite แท้",
    url: `${SITE_ORIGIN}/daily`,
    siteName: "SeerTarot",
    locale: "th_TH",
    type: "website",
    images: dailyOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "ดูดวงไพ่ยิปซีรายวัน ไพ่ทาโรต์นำทางวันนี้ · SeerTarot",
    description:
      "เปิดไพ่ยิปซี 1 ใบเช็กพลังงานประจำวัน ทั้งการงาน การเงิน ความรัก และข้อควรระวัง ฟรีทุกวัน",
    images: [dailyOgImages[0].url],
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
  "@type": "WebPage",
  name: "ดูดวงไพ่ยิปซีรายวัน (SeerTarot Daily Tarot)",
  url: `${SITE_ORIGIN}/daily`,
};

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
  { href: "/cards", label: "สารานุกรมไพ่ 78 ใบ", note: "ความหมายไพ่ครบทั้งสำรับ 1909 ทุกด้านของชีวิต", card: "major-21" },
  { href: "/love/1-card", label: "ดูดวงความรัก 1 ใบ", note: "เช็กหัวใจวันนี้ ทั้งคนโสด คนคุย และคนมีคู่", card: "major-06" },
  { href: "/cards/birth-card", label: "คำนวณไพ่ประจำตัว", note: "ใส่วันเกิด แล้วดูไพ่ที่บอกตัวตนและพรสวรรค์", card: "major-09" },
  { href: "/spreads", label: "ผังพยากรณ์ 26 แบบ", note: "อยากถามลึกกว่า 1 ใบ เลือกผังที่ตรงเรื่อง", card: "major-10" },
];

/** ไพ่ตกแต่งรอบหัวหน้า (ภาพประกอบ ไม่ใช่ผลสุ่ม) — ไพ่ของแสงเช้า */
const DAILY_DECO_CARDS = ["major-19", "major-17", "major-01", "major-14", "major-21", "major-03"] as const;

/** `ritual` = พิธีเปิดไพ่ (island ตัวเดียวของหน้านี้) ส่งเข้ามาจากข้างนอก */
export function DailyBodyTh({ ritual }: { ritual: ReactNode }) {
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

      <main id="main-content" tabIndex={-1} data-ui2-page-dark="" className="ui2-dy ui2-dy-main min-h-screen font-sans relative overflow-x-clip px-4 sm:px-8">
        <DailyStage>{ritual}</DailyStage>

        <DailyArticle
          isEnglish={false}
          eyebrow="ทำความเข้าใจไพ่ยิปซีรายวัน"
          title="ศาสตร์แห่งการเปิดไพ่ยิปซีรายวัน: กระจกส่องจิตและสติสัมปชัญญะ"
          intro={
            <p>
              การเปิดไพ่ประจำวันไม่ใช่การทำนายโชคชะตาแบบงมงาย แต่เป็นวิธีง่าย ๆ ให้เราหยุดทบทวนใจตัวเองวันละครั้ง
              ภาพบนไพ่แต่ละใบเป็นเรื่องราวที่คนทุกยุคเข้าใจตรงกัน เช่น การเริ่มต้นใหม่ การรอคอย หรือการปล่อยวาง
              พอเห็นภาพแล้ว เรามักนึกถึงเรื่องที่กำลังเจออยู่ได้เอง
              (นักจิตวิทยา คาร์ล ยุง เรียกภาพแบบนี้ว่าภาพต้นแบบในใจคน)
            </p>
          }
          tipsTitle="วิธีรับพลังงานจากไพ่ประจำวัน ให้เกิดประโยชน์สูงสุด"
          tips={[
            {
              title: "ตั้งใจตอนเช้า",
              body: "ก่อนเริ่มทำงาน หลับตาหายใจเข้าลึก ๆ สังเกตอารมณ์ตอนนี้ แล้วค่อยแตะเลือกไพ่ด้วยใจที่นิ่ง",
            },
            {
              title: "ดูภาพไพ่ 1909 Rider-Waite ให้ละเอียด",
              body: "สำรับดั้งเดิมของ อาเธอร์ เอ็ดเวิร์ด เวท และ พาเมลา คอลแมน สมิธ ซ่อนความหมายไว้ในสี ธาตุ และท่าทางของตัวละคร ซึ่งมักตรงกับเรื่องที่คุณกำลังจะเจอ",
            },
            {
              title: "ทบทวนก่อนนอน",
              body: "นึกถึงไพ่ที่เปิดตอนเช้า เทียบกับเรื่องที่เกิดขึ้นจริง ทำทุกวันจะฝึกสัญชาตญาณและการรู้ทันใจตัวเองได้ดีที่สุด",
            },
          ]}
          trustTitle="ทำไมไพ่ของเราถึงสุ่มจริง ตรวจสอบได้?"
          trust={
            <p>
              ที่ SeerTarot เรายึดมั่นในความซื่อตรงและความโปร่งใสสูงสุด ทุกครั้งที่คุณกดสับไพ่
              ระบบจะสุ่มลำดับไพ่ด้วยตัวสุ่มมาตรฐานเดียวกับที่ใช้ในระบบความปลอดภัย
              แล้วล็อกลำดับไว้ให้คุณตรวจย้อนหลังได้ ไม่มีการแอบเลือกผล ไม่มีการแอบแฝงโฆษณา และไม่มีการกุไพ่ใบใดขึ้นมาเองเด็ดขาด
              เพื่อให้คุณมั่นใจได้ว่าคำทำนายทุกใบมาจากสมาธิและกระแสจิตของคุณอย่างแท้จริง
            </p>
          }
          faqs={DAILY_FAQS}
          links={DAILY_LINKS}
        />
        {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
        <Ui2NextSteps isEn={false} keys={["spreads", "pick", "journal", "questions"]} />
      </main>
    </>
  );
}

/**
 * 🌅 เวทีพิธีเช้า (UI 2.0 กลางคืน + แสงรุ่งอรุณ) — ใช้ร่วมกันทั้ง `/daily` และ `/en/daily`
 * ไพ่จริงลอยรอบหัวหน้า (ตกแต่งล้วน · aria-hidden) · lite เห็น 2 ใบนิ่งที่มุม
 */
export function DailyStage({ children }: { children: ReactNode }) {
  return (
    <section className="ui2-sec ui2-night ui2-dy-stage" data-ui2-dark="" data-anim-section="">
      <span className="ui2-stars ui2-loop" aria-hidden="true" />
      <span className="ui2-stars ui2-stars-2 ui2-loop" aria-hidden="true" />
      <span className="ui2-dy-dawn" aria-hidden="true" />
      <span className="ui2-dy-deco" aria-hidden="true">
        {DAILY_DECO_CARDS.map((cardId, i) => (
          <span key={cardId} className={`ui2-dy-deco-card ui2-loop ui2-dy-deco-${i + 1}`}>
            <CardImage cardId={cardId} alt="" thumb sizes="(min-width: 768px) 80px, 44px" loading={i < 2 ? "eager" : "lazy"} fetchPriority="low" />
          </span>
        ))}
      </span>
      {/* ห่อ div — <astro-island> เป็น display:contents */}
      <div className="ui2-wrap ui2-dy-wrap">{children}</div>
    </section>
  );
}
