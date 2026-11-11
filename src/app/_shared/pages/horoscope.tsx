import type { Metadata } from "next";
import type { ReactNode } from "react";

import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { Ui2Window } from "@/components/ui2/Ui2Showcase";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";
import { SeoArticleShell, type SeoFaqItem } from "@/components/seo/SeoArticleShell";
import { CardImage } from "@/components/card/CardImage";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { ZODIAC_ELEMENT_LABEL, ZODIAC_SIGNS, type ZodiacElement, type ZodiacSign } from "@/data/zodiac";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { decanRanges, formatMonthDay, HOROSCOPE_PATH, thaiRanges, ZODIAC_INDEX_PATH, zodiacSignPath } from "@/lib/tarot/zodiac";

import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

/**
 * 🌤️ ดูดวงรายวัน 12 ราศี — `/horoscope` (ภาษาไทยอย่างเดียว)
 * ===========================================================================
 * ทำไมมีหน้านี้ (GSC 2026-11-09): คำ "ดูดวงรายวัน" · "ดูดวงวันนี้" ไม่มีหน้าไหนของเราขึ้นผลค้นหาเลย
 * ทั้งที่เครื่องไพ่รายวันของ 12 ราศีมีอยู่แล้ว (`ZodiacDaily` + `/api/daily-card/zodiac`) แต่ฝังอยู่ใน
 * `/cards/zodiac` ซึ่งชื่อหน้ารับคำ "ไพ่ประจำราศี" ➔ หน้านี้เป็นหน้ารวมที่ชื่อ หัวข้อ และเนื้อหาตรงคำ "ดูดวงรายวัน 12 ราศี"
 *
 * ⚠️ แบ่งเจ้าของคำ (ห้ามแย่งกันเอง — บทเรียนรอบ 2026-11-03):
 *   - หน้านี้            = ดูดวงรายวัน 12 ราศี · ดูดวงวันนี้ตามราศี (หน้ารวม)
 *   - `/cards/zodiac/<ราศี>` = ดูดวงราศี…วันนี้ (รายราศี · title เดิมรับคำนี้อยู่แล้ว) ➔ **ห้ามสร้างหน้ารายราศีซ้ำใต้ /horoscope**
 *   - `/daily`           = ดูดวงไพ่ยิปซีรายวัน (ไพ่ส่วนตัว 1 ใบ)
 *   - `/cards/zodiac`    = ไพ่ประจำราศี
 *
 * กฎข้อ 4 และ 14: ไพ่ของวันมาจาก island ตัวเดิม (คว่ำจนผู้ใช้แตะ · ดึงไม่ได้ซ่อนทั้งกล่อง) — ส่วน HTML นิ่งของหน้านี้
 * ไม่มีไพ่ของวันและไม่คำนวณอะไรที่ขึ้นกับวันที่ (หน้า prerender · INC-0223) ภาพไพ่ที่เห็นคือไพ่ประจำราศีซึ่งเป็นข้อมูลคงที่
 * ไม่มีฝาแฝด `/en/horoscope` (ตลาดไทยก่อน · เจ้าของ 2026-09-09) จึงไม่ประกาศ hreflang
 */

const PAGE_NAME = "ดูดวงรายวัน 12 ราศี";

const cardById = new Map(CARD_SUMMARIES.map((c) => [c.id, c]));

/** กฎข้อ 14: รหัสไพ่ที่หาไม่เจอ = ข้อมูลเสีย ต้องล้มตอนบิลด์ ห้ามเดาไพ่ใบอื่นมาแทน */
function card(id: string) {
  const found = cardById.get(id);
  if (!found) throw new Error(`horoscope: ไม่พบไพ่ "${id}" ในสำรับ — ตรวจ src/data/zodiac.ts`);
  return found;
}

const RANGES = decanRanges(ZODIAC_SIGNS);
const THAI_RANGES = thaiRanges(ZODIAC_SIGNS);

function westernRange(sign: ZodiacSign): string {
  const r = RANGES.get(sign.id);
  if (!r) throw new Error(`horoscope: ไม่พบช่วงวันเกิดของ ${sign.id}`);
  return `${formatMonthDay(r[0].start, false)} – ${formatMonthDay(r[2].end, false)}`;
}

function thaiRange(sign: ZodiacSign): string {
  const r = THAI_RANGES.get(sign.id);
  if (!r) throw new Error(`horoscope: ไม่พบช่วงวันเกิดแบบไทยของ ${sign.id}`);
  return `${formatMonthDay(r.start, false)} – ${formatMonthDay(r.end, false)}`;
}

export function horoscopeMetadata(): Metadata {
  const title = pickTitle([
    "ดูดวงรายวัน 12 ราศี ดวงวันนี้ด้วยไพ่ยิปซี เปิดฟรีทุกวัน",
    "ดูดวงรายวัน 12 ราศี ดวงวันนี้ด้วยไพ่ยิปซี ฟรี",
    "ดูดวงรายวัน 12 ราศี ด้วยไพ่ยิปซี",
  ]);
  const description = clampDescription(
    "ดูดวงรายวันครบ 12 ราศี เปิดไพ่ยิปซีของราศีคุณวันละใบ เปลี่ยนใหม่ทุกเที่ยงคืน พร้อมวิธีอ่านไพ่ตามธาตุของราศี",
    "ดูฟรี ไม่ต้องสมัครสมาชิก",
  );
  const images = buildPageOgImage({
    title: PAGE_NAME,
    eyebrow: "ดวงวันนี้ด้วยไพ่ยิปซี",
    cardImage: "major-19.jpg",
    alt: "ดูดวงรายวัน 12 ราศี ด้วยไพ่ยิปซี 1909 Rider-Waite",
  });
  return {
    title,
    description,
    keywords: ["ดูดวงรายวัน", "ดูดวงรายวัน 12 ราศี", "ดูดวงวันนี้", "ดวงวันนี้ 12 ราศี", "ดูดวงรายวันไพ่ยิปซี", "ดวงรายวันตามราศี"],
    alternates: buildAlternates(HOROSCOPE_PATH, { locale: "th" }),
    openGraph: {
      title,
      description,
      url: localizedUrl(HOROSCOPE_PATH, "th"),
      siteName: "SeerTarot",
      type: "website",
      locale: "th_TH",
      images,
    },
    twitter: { card: "summary_large_image", title, description, images: [images[0].url] },
  };
}

/* ───────────────────────── เนื้อหาคงที่ ───────────────────────── */

type Suit = "wands" | "cups" | "swords" | "pentacles";

const SUIT_LABEL: Record<Suit, string> = {
  wands: "ชุดไม้เท้า",
  cups: "ชุดถ้วย",
  swords: "ชุดดาบ",
  pentacles: "ชุดเหรียญ",
};

/** ความสัมพันธ์ของธาตุ — หลักธาตุของสาย Golden Dawn (ไฟคู่ลม · น้ำคู่ดิน หนุนกัน / ไฟกับน้ำ · ลมกับดิน ตรงข้าม) */
type Relation = "same" | "support" | "neutral" | "opposite";

const RELATION_LABEL: Record<Relation, string> = {
  same: "ธาตุเดียวกับราศี",
  support: "ธาตุที่หนุนราศี",
  neutral: "ธาตุต่างจังหวะ",
  opposite: "ธาตุตรงข้ามราศี",
};

interface ElementGuide {
  element: ZodiacElement;
  rows: { suit: Suit; relation: Relation; text: string }[];
}

/**
 * วิธีอ่านไพ่ของวันเทียบกับธาตุของราศี — เรียงจากชุดที่เข้ากับราศีที่สุดไปชุดที่ต้องปรับตัวที่สุด
 * ⚠️ เนื้อหาเขียนเอง รอแม่หมอตรวจ (คิวเดียวกับเนื้อหาอื่นใน MASTER_PLAN) — แก้ถ้อยคำได้ แต่คู่ธาตุห้ามสลับ
 *    ด่าน `test-seo-wave4` ตรวจว่าแต่ละธาตุมีครบ 4 ชุด และความสัมพันธ์ตรงตามหลักธาตุ
 */
export const HOROSCOPE_ELEMENT_GUIDE: ElementGuide[] = [
  {
    element: "fire",
    rows: [
      {
        suit: "wands",
        relation: "same",
        text: "วันของคุณ พลังกับจังหวะเข้าทางกัน มีเรื่องไหนอยากเริ่มให้เริ่มวันนี้ ระวังอย่างเดียวคือใจร้อนจนข้ามรายละเอียด",
      },
      {
        suit: "swords",
        relation: "support",
        text: "ความคิดช่วยพัดไฟให้ลุก เหมาะกับการคุย วางแผน และตัดสินใจเรื่องที่ค้างไว้ พูดตรงได้ แต่เลือกคำสักนิด",
      },
      {
        suit: "pentacles",
        relation: "neutral",
        text: "งานจุกจิก เรื่องเงิน และสิ่งที่ต้องทำให้เสร็จทีละขั้น ไม่หวือหวา แต่เป็นวันที่เก็บผลได้จริงถ้ายอมอยู่กับงานตรงหน้า",
      },
      {
        suit: "cups",
        relation: "opposite",
        text: "วันนี้ความรู้สึกมาก่อนความเร็ว ไพ่ชวนให้ช้าลงและฟังคนใกล้ตัว อาจขัดใจบ้างเพราะไม่ใช่จังหวะที่คุณถนัด",
      },
    ],
  },
  {
    element: "earth",
    rows: [
      {
        suit: "pentacles",
        relation: "same",
        text: "วันของคุณ เรื่องงาน เงิน และสุขภาพเดินได้มั่นคง เหมาะกับการลงมือทำสิ่งที่วางแผนไว้ ระวังแค่การยึดวิธีเดิมจนไม่ลองทางที่ง่ายกว่า",
      },
      {
        suit: "cups",
        relation: "support",
        text: "ความรู้สึกดี ๆ มาช่วยให้วันนุ่มขึ้น เหมาะกับการดูแลคนใกล้ตัว และบอกความในใจที่ปกติคุณมักเก็บไว้",
      },
      {
        suit: "wands",
        relation: "neutral",
        text: "มีแรงผลักให้ขยับเร็วกว่าที่คุณชอบ ลองรับไว้สักเรื่อง โอกาสบางอย่างไม่รอให้พร้อมครบทุกข้อ",
      },
      {
        suit: "swords",
        relation: "opposite",
        text: "มีเรื่องให้คิดและต้องคุยมากกว่าที่อยากคุย อาจมีข่าวหรือคำพูดที่ทำให้แผนสะดุด ฟังให้จบก่อนแล้วค่อยตัดสิน",
      },
    ],
  },
  {
    element: "air",
    rows: [
      {
        suit: "swords",
        relation: "same",
        text: "วันของคุณ หัวแล่น พูดแล้วคนเข้าใจ เหมาะกับการเจรจา งานเขียน การสอบ หรือเคลียร์เรื่องที่ค้าง ระวังคิดวนจนไม่ได้ลงมือ",
      },
      {
        suit: "wands",
        relation: "support",
        text: "ไอเดียได้เชื้อไฟ เรื่องที่คิดไว้มีแรงพอจะเริ่มจริง ชวนคนมาร่วมได้ วันนี้คนตอบรับง่าย",
      },
      {
        suit: "cups",
        relation: "neutral",
        text: "ความรู้สึกเข้ามาแทรกเหตุผล ไม่ต้องรีบอธิบายทุกอย่างเป็นคำพูด บางเรื่องวันนี้แค่อยู่ข้าง ๆ กันก็พอ",
      },
      {
        suit: "pentacles",
        relation: "opposite",
        text: "วันนี้ต้องลงรายละเอียดและนั่งทำงานให้จบ ตัวเลขกับเอกสารสำคัญกว่าคำพูด อาจอึดอัดบ้าง แต่ได้งานเป็นชิ้นเป็นอัน",
      },
    ],
  },
  {
    element: "water",
    rows: [
      {
        suit: "cups",
        relation: "same",
        text: "วันของคุณ ความรู้สึกชัดและลางสังหรณ์แม่น เหมาะกับเรื่องความรัก ครอบครัว และงานที่ใช้ใจ ระวังรับอารมณ์คนอื่นมาแบกจนเหนื่อย",
      },
      {
        suit: "pentacles",
        relation: "support",
        text: "มีหลักให้ยืน เรื่องเงิน บ้าน และงานประจำเดินเรียบ เหมาะกับการทำสิ่งที่ทำให้รู้สึกมั่นคง",
      },
      {
        suit: "swords",
        relation: "neutral",
        text: "วันนี้ต้องใช้เหตุผลมากกว่าความรู้สึก คำพูดตรง ๆ ของบางคนอาจฟังแข็ง แต่ช่วยให้เห็นภาพชัดขึ้น",
      },
      {
        suit: "wands",
        relation: "opposite",
        text: "จังหวะรอบตัวเร็วและแรงกว่าที่ใจคุณอยากได้ อาจมีคนเร่งหรือเรื่องด่วนเข้ามา เลือกทำเรื่องเดียวที่สำคัญจริง ที่เหลือปล่อยผ่านได้",
      },
    ],
  },
];

export const HOROSCOPE_FAQ: SeoFaqItem[] = [
  {
    q: "ดวงรายวัน 12 ราศีเปลี่ยนตอนกี่โมง?",
    a: "เปลี่ยนทุกวันตอนเที่ยงคืนตามเวลาประเทศไทย แต่ละราศีได้ไพ่ใหม่วันละหนึ่งใบ เปิดดูกี่ครั้งในวันเดียวกันก็เป็นใบเดิม",
  },
  {
    q: "ควรดูดวงรายวันตามราศีแบบสากลหรือแบบไทย?",
    a: "ไพ่ทาโรต์ถูกออกแบบคู่กับราศีแบบสากลที่นับตามวันที่ในปฏิทิน เช่น ราศีเมษเริ่ม 21 มีนาคม ส่วนราศีแบบไทยช้ากว่าราว 24 วัน ถ้าคุณคุ้นกับราศีแบบไทยมาตลอดก็ใช้ราศีนั้นได้ หรือเปิดดูทั้งสองราศีแล้วสังเกตว่าใบไหนตรงกับวันของคุณมากกว่า",
  },
  {
    q: "ดูดวงรายวันตามราศีแม่นแค่ไหน?",
    a: "ดวงรายวันตามราศีเป็นภาพรวมของคนทั้งราศี ทุกคนในราศีเดียวกันเห็นไพ่ใบเดียวกัน จึงเหมาะใช้เป็นข้อคิดประจำวัน ไม่ใช่คำทำนายเฉพาะตัว ถ้าอยากได้คำตอบของตัวเอง ให้เปิดไพ่ประจำวันส่วนตัว ซึ่งคุณเป็นคนสับและเลือกไพ่เอง",
  },
  {
    q: "ดูดวงรายวัน 12 ราศีกับไพ่ยิปซีรายวันต่างกันอย่างไร?",
    a: "ดูดวงรายวัน 12 ราศีให้ไพ่ราศีละหนึ่งใบ เห็นเหมือนกันทั้งราศี ส่วนไพ่ยิปซีรายวันเป็นไพ่ของคุณคนเดียว คุณสับไพ่และเลือกเองจากสำรับ 78 ใบ แล้วได้คำอ่านครบทั้งการงาน การเงิน และความรัก",
  },
  {
    q: "ดูดวงรายวันที่นี่ต้องสมัครสมาชิกหรือเสียเงินไหม?",
    a: "ไม่ต้อง ดูดวงรายวันครบ 12 ราศีเปิดดูได้ฟรีทุกวันโดยไม่ต้องสมัครสมาชิก",
  },
];

const HOW_IT_WORKS = [
  {
    title: "ราศีละหนึ่งใบต่อวัน",
    body: "แต่ละราศีได้ไพ่หนึ่งใบจากสำรับ 1909 Rider-Waite ครบ 78 ใบ เปลี่ยนใบใหม่ทุกเที่ยงคืนตามเวลาไทย",
  },
  {
    title: "ไม่มีใครเลือกไพ่ให้",
    body: "ไพ่ของวันคำนวณจากชื่อราศีกับวันที่ ได้ผลเดิมทุกครั้งที่คำนวณซ้ำ จึงไม่มีใครเปลี่ยนไพ่ให้ถูกใจได้ รวมถึงเราเอง",
  },
  {
    title: "คุณเป็นคนเปิดเอง",
    body: "ไพ่คว่ำไว้จนกว่าคุณจะแตะ และทุกคนในราศีเดียวกันเห็นใบเดียวกันทั้งวัน",
  },
];

const HOROSCOPE_LINKS = [
  { label: "ดูดวงไพ่ยิปซีรายวัน (ไพ่ของคุณเอง)", href: "/daily" },
  { label: "ดูดวงไพ่ยิปซี 7 วันข้างหน้า", href: "/spreads/weekly" },
  { label: "ดูดวงไพ่ยิปซีรายเดือน", href: "/spreads/monthly" },
  { label: "ดูดวงความรัก 1 ใบ", href: "/love/1-card" },
  { label: "ไพ่ประจำราศี 12 ราศี", href: ZODIAC_INDEX_PATH },
  { label: "ผังดวงกำเนิดแบบละเอียด", href: "/natal-chart" },
];

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}

/** `daily` = island ไพ่รายวัน 12 ราศี (ตัวเดียวของหน้านี้ที่ใช้ JS) ส่งเข้ามาจากไฟล์ `.astro` */
export function HoroscopeBody({ daily }: { daily: ReactNode }) {
  const breadcrumbs = [{ label: "หน้าแรก", href: "/" }, { label: PAGE_NAME }];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd("th", [homeCrumb("th"), { name: PAGE_NAME, path: HOROSCOPE_PATH }]);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOROSCOPE_FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen text-ink py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip"
    >
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <div className="max-w-4xl mx-auto space-y-10">
        <RitualHero
          tone="star"
          breadcrumbs={breadcrumbs}
          badgeText="ดวงวันนี้ด้วยไพ่ยิปซี"
          title={PAGE_NAME}
          accent="12 ราศี"
          tagline="ดวงวันนี้ของแต่ละราศี เปิดด้วยไพ่ยิปซี 1909 Rider-Waite ราศีละหนึ่งใบ เปลี่ยนใหม่ทุกเที่ยงคืน เลือกราศีของคุณแล้วแตะไพ่เปิดดูได้เลย ฟรี ไม่ต้องสมัครสมาชิก"
        />

        {/* ห่อ div — <astro-island> เป็น display:contents จึงไม่รับ margin จาก space-y (แบบเดียวกับ /cards/zodiac) */}
        <Ui2Window n="01" kicker="ดวงวันนี้" tone={4}>
          <div id="horoscope-today">{daily}</div>
        </Ui2Window>

        {/* 12 ราศี — ลิงก์เข้าหน้ารายราศีที่มีอยู่แล้ว ด้วยคำที่คนค้น ("ดูดวงราศี…วันนี้" = title ของหน้าปลายทาง) */}
        <Ui2Window n="02" kicker="เลือกราศี" tone={7}>
          <section aria-labelledby="horoscope-signs" className="space-y-4">
            <div className="space-y-1 text-center">
              <h2 id="horoscope-signs" className="text-xl sm:text-2xl font-serif-th font-bold text-ink">
                <ThaiPhrases>ดูดวงวันนี้รายราศี ครบ 12 ราศี</ThaiPhrases>
              </h2>
              <p className="text-xs sm:text-sm text-muted font-sans">
                หน้าของแต่ละราศีมีไพ่วันนี้ ไพ่ประจำราศี นิสัย ความรัก และการงาน ช่วงวันเกิดบอกไว้ทั้งแบบสากลและแบบไทย
              </p>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {ZODIAC_SIGNS.map((sign) => {
                const major = card(sign.majorCardId);
                return (
                  <li key={sign.id}>
                    <Link
                      href={zodiacSignPath(sign.id)}
                      className="group flex items-center gap-3 rounded-xl border border-line-warm bg-surface/70 px-3 py-2 hover:border-gold-ink transition-colors"
                    >
                      <CardImage
                        image={major.image}
                        cardId={major.id}
                        alt=""
                        sizes="36px"
                        className="w-9 aspect-[1/1.7] rounded border border-line-warm object-cover shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-serif-th font-bold text-ink group-hover:text-gold-ink transition-colors">
                            ดูดวง{sign.nameTh}วันนี้
                          </span>
                          <span className="text-xs font-serif-th font-semibold text-gold-ink">
                            {ZODIAC_ELEMENT_LABEL[sign.element].th}
                          </span>
                        </span>
                        <span className="block text-[12px] text-muted font-sans">
                          สากล {westernRange(sign)} · ไทย {thaiRange(sign)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="text-center text-sm font-sans text-muted">
              ไม่แน่ใจว่าตัวเองราศีอะไร{" "}
              <Link href={ZODIAC_INDEX_PATH} className="underline text-gold-ink">
                หาราศีจากวันเกิด
              </Link>
            </p>
          </section>
        </Ui2Window>

        {/* วิธีอ่านไพ่ของวันเทียบกับธาตุของราศี */}
        <Ui2Window n="03" kicker="อ่านไพ่ตามธาตุ" tone={3}>
          <section aria-labelledby="horoscope-elements" className="space-y-5">
            <div className="space-y-1 text-center">
              <h2 id="horoscope-elements" className="text-xl sm:text-2xl font-serif-th font-bold text-ink">
                <ThaiPhrases>ไพ่วันนี้ออกชุดไหน แปลว่าอะไรกับราศีของคุณ</ThaiPhrases>
              </h2>
              <p className="text-xs sm:text-sm text-muted font-sans leading-relaxed">
                ไพ่ใบเดียวกันให้ความรู้สึกต่างกันในแต่ละราศี เพราะไพ่ทุกชุดมีธาตุของตัวเอง ไม้เท้าคือไฟ ถ้วยคือน้ำ ดาบคือลม
                เหรียญคือดิน เปิดไพ่ของวันแล้วเทียบกับธาตุของราศีคุณตามตารางนี้
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {HOROSCOPE_ELEMENT_GUIDE.map((group) => {
                const label = ZODIAC_ELEMENT_LABEL[group.element];
                const signs = ZODIAC_SIGNS.filter((s) => s.element === group.element);
                return (
                  <div key={group.element} className="altar-card-porcelain rounded-xl p-4 space-y-3">
                    <h3 className="font-serif-th font-bold text-ink">
                      <ThaiPhrases>{`ราศี${label.th} ${signs.map((s) => s.nameTh.replace("ราศี", "")).join(" ")}`}</ThaiPhrases>
                    </h3>
                    <dl className="space-y-3">
                      {group.rows.map((row) => (
                        <div key={row.suit} className="border-l-2 border-gold-ink pl-3 space-y-0.5">
                          <dt className="text-sm font-serif-th font-bold text-ink">
                            {SUIT_LABEL[row.suit]}{" "}
                            <span className="text-xs font-semibold text-gold-ink">{RELATION_LABEL[row.relation]}</span>
                          </dt>
                          <dd className="text-sm text-ink font-sans leading-relaxed">{row.text}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-ink font-sans leading-relaxed border-l-2 border-gold-ink pl-3">
              ถ้าไพ่วันนี้เป็นไพ่ชุดใหญ่ 22 ใบ เช่น The Sun หรือ The Tower ให้น้ำหนักมากกว่าปกติ
              ไพ่ชุดใหญ่พูดถึงเรื่องที่ใหญ่กว่าเหตุการณ์ประจำวัน และมักเป็นเรื่องที่อยู่กับคุณนานกว่าหนึ่งวัน
            </p>
          </section>
        </Ui2Window>

        {/* ที่มาของไพ่รายวัน — บอกตรง ๆ ว่าเป็นดวงภาพรวมของทั้งราศี */}
        <Ui2Window n="04" kicker="ที่มาของไพ่" tone={5}>
          <section aria-labelledby="horoscope-how" className="space-y-4">
            <h2 id="horoscope-how" className="text-xl sm:text-2xl font-serif-th font-bold text-ink text-center">
              <ThaiPhrases>ดวงรายวันของเรา ได้ไพ่มาอย่างไร</ThaiPhrases>
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {HOW_IT_WORKS.map((item) => (
                <div key={item.title} className="altar-card-porcelain rounded-xl p-4 space-y-1.5">
                  <h3 className="font-serif-th font-bold text-ink">
                    <ThaiPhrases>{item.title}</ThaiPhrases>
                  </h3>
                  <p className="text-sm text-ink font-sans leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link href="/daily" className="btn-gold-glass inline-block py-3 px-8 text-sm font-serif-th font-bold">
                เปิดไพ่ประจำวันของคุณเอง
              </Link>
            </div>
          </section>
        </Ui2Window>

        <SeoArticleShell
          eyebrow="คู่มือดูดวงรายวัน"
          title="ดูดวงรายวันด้วยไพ่ยิปซี ใช้อย่างไรให้ได้ประโยชน์"
          faqs={HOROSCOPE_FAQ}
          links={HOROSCOPE_LINKS}
        >
          <div className="space-y-4 text-xs sm:text-sm text-muted font-sans leading-relaxed">
            <p>
              ดวงรายวันที่ดีไม่ได้บอกว่าวันนี้จะเกิดอะไรขึ้น แต่บอกว่าวันนี้ควรใส่ใจเรื่องไหน เปิดไพ่ของราศีคุณตอนเช้า
              จำภาพไพ่กับคำสำคัญไว้ แล้วใช้เป็นหลักตอนต้องตัดสินใจเรื่องเล็ก ๆ ระหว่างวัน
              ตกเย็นลองนึกย้อนว่าไพ่ตรงกับเรื่องไหนของวันนี้ ทำต่อเนื่องสักสัปดาห์จะเริ่มเห็นว่าไพ่ชุดไหนพูดกับคุณชัดที่สุด
            </p>
            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-2">
              <ThaiPhrases>เกิดช่วงรอยต่อราศี ใช้ราศีไหนดี</ThaiPhrases>
            </h3>
            <p>
              วันที่ดวงอาทิตย์ย้ายราศีคลาดได้หนึ่งวันตามแต่ละปี คนที่เกิดวันรอยต่อจึงมักไม่แน่ใจว่าตัวเองอยู่ราศีไหน
              อีกเรื่องคือราศีแบบไทยช้ากว่าแบบสากลราว 24 วัน คนที่เกิดปลายเดือนอาจเป็นคนละราศีในสองระบบ
              วิธีที่ง่ายที่สุดคือเปิดไพ่ของทั้งสองราศีติดกันสักสองสามวัน แล้วใช้ราศีที่ไพ่ตรงกับชีวิตจริงมากกว่า
            </p>
            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-2">
              <ThaiPhrases>อยากได้ดวงที่เป็นของคุณคนเดียว</ThaiPhrases>
            </h3>
            <p>
              ราศีเกิดบอกได้แค่ตำแหน่งดวงอาทิตย์ คนราศีเดียวกันจึงมีวันที่ต่างกันได้มาก ถ้าอยากได้คำตอบเฉพาะตัว
              มีสองทาง ทางแรกคือเปิดไพ่ประจำวันที่คุณสับและเลือกเอง ทางที่สองคือสร้างผังดวงกำเนิดจากวัน เวลา
              และสถานที่เกิด เพื่อดูว่าดาววันนี้แตะเรื่องไหนในผังของคุณ
            </p>
          </div>
        </SeoArticleShell>
      </div>
      <Ui2NextSteps isEn={false} keys={["daily", "natal", "spreads", "journal"]} />
    </main>
  );
}
