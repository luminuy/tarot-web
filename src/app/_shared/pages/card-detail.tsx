import type { Metadata } from "next";

import { DECK, cardById } from "@/data/cards";
import type { TarotCard } from "@/data/cards/types";
import { type CardNavRef } from "@/components/encyclopedia/CardDetailView";
import { RelatedCards } from "@/components/encyclopedia/RelatedCards";
import { CardSpreadLinks } from "@/components/encyclopedia/CardSpreadLinks";
import { CARD_GROUPS } from "@/data/cards/group-seo";
import { buildYesNoAnswer } from "@/data/cards/yes-no";
import { buildFaqPageJsonLd, cardYesNoQuestion } from "@/lib/seo/faq";
import { buildAlternates, localizedUrl, SITE_ORIGIN, noindexAlternates } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, homeCrumb, type Crumb } from "../seo";

/**
 * ⚙️ แกนกลางแบบซิงโครนัส — ใช้ได้ทั้งสองเครื่องมือเรนเดอร์
 *
 * Next ส่ง `params` มาเป็น Promise (สัญญาของ App Router) ส่วน Astro รู้ค่า `id`
 * ตั้งแต่ `getStaticPaths` แล้ว · แยกแกนกลางออกมาเพื่อให้ **ตรรกะ SEO มีที่เดียว**
 * ห้ามก็อปตรรกะนี้ไปไว้ในไฟล์ `.astro` เด็ดขาด
 */
export function cardDetailMetadata(id: string, locale: Locale): Metadata {
  const card = cardById(id);

  if (!card) {
    return {
      title: locale === "en" ? "Tarot card not found" : "ไม่พบไพ่ทาโรต์",
      robots: { index: false, follow: true },
      alternates: noindexAlternates(),
    };
  }

  const path = `/cards/${card.id}`;
  const isEnglish = locale === "en";

  // ชื่อไพ่บางใบยาว (เช่น "Seven of Pentacles" / "ราชินีแห่งเหรียญ") ถ้าต่อท้ายเต็มสูตรทุกใบ
  // title จะทะลุเพดานที่ Google แสดงได้ — เรียงจากครบสุดไปสั้นสุดให้ pickTitle เลือกเอง
  const title = isEnglish
    ? pickTitle([
        `${card.nameEn} Meaning: Love, Career, Upright & Reversed`,
        `${card.nameEn} Tarot Meaning: Love & Career`,
        `${card.nameEn} Tarot Card Meaning: Upright & Reversed`,
        `${card.nameEn} Tarot Card Meaning`,
      ])
    : pickTitle([
        `ไพ่ ${card.nameEn} (${card.nameTh}) ความหมาย ความรัก การงาน`,
        `ไพ่ ${card.nameEn} (${card.nameTh}) ความหมาย ความรัก`,
        `ไพ่ ${card.nameEn} (${card.nameTh}) ความหมาย`,
        `ไพ่ ${card.nameEn} ความหมาย ความรัก การงาน`,
      ]);

  const description = isEnglish
    ? clampDescription(
        `Explore ${card.nameEn} tarot card meanings across love, career, finances, and self-growth, both upright and reversed, with ${card.astrologyEn ?? card.astrology} correspondence.`,
        "Original 1909 Rider-Waite artwork.",
      )
    : clampDescription(
        `ความหมายไพ่ทาโร่ ไพ่ยิปซี ${card.nameEn} (${card.nameTh}) ทั้งหัวตั้งและหัวกลับ 5 มิติชีวิต ความรัก การงาน การเงิน โหราศาสตร์ ${card.astrology} ธาตุ${card.element}`,
        "ภาพดั้งเดิม 1909 Rider-Waite",
      );

  const keywords = isEnglish
    ? [
        `${card.nameEn} meaning`,
        `${card.nameEn} tarot`,
        `${card.nameEn} yes or no`,
        `${card.nameEn} love meaning`,
        `${card.nameEn} career meaning`,
        `${card.nameEn} reversed`,
        `${card.nameEn} upright and reversed`,
        "rider waite tarot meanings",
      ]
    : [
        `ไพ่ ${card.nameEn}`,
        `ไพ่ ${card.nameTh}`,
        `${card.nameEn} ใช่หรือไม่`,
        `${card.nameTh} ใช่หรือไม่`,
        `${card.nameEn} ความหมาย`,
        `${card.nameEn} ความรัก`,
        `${card.nameEn} การงาน`,
        `${card.nameEn} กลับหัว`,
        `ความหมายไพ่ ${card.nameTh}`,
        `${card.nameTh} ความรัก`,
        `${card.nameTh} การงาน`,
        `${card.nameTh} กลับหัว`,
        `ไพ่ทาโร่ ${card.nameEn}`,
        "ความหมายไพ่ยิปซี",
        "ความหมายไพ่ทาโร่",
        "ไพ่ทาโรต์ 1909 Rider-Waite",
      ];

  const ogImages = buildPageOgImage({
    title: isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`,
    eyebrow: isEnglish ? "TAROT CARD MEANINGS" : "คัมภีร์ไพ่ทาโรต์",
    cardImage: card.image,
    alt: isEnglish
      ? `${card.nameEn} from the 1909 Rider-Waite tarot deck`
      : `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`,
  });

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "article",
      url: localizedUrl(path, locale),
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImages[0].url],
    },
    alternates: buildAlternates(path, { locale, englishTwin: true }),
  };
}

/**
 * Breadcrumb ลำดับชั้นสมบูรณ์: หน้าแรก › คัมภีร์ไพ่ › [ชุดใหญ่/ชุดเล็ก › ดอก] › ชื่อไพ่
 * ทุกลิงก์ต้องอยู่ในภาษาเดียวกับหน้าเสมอ (`/en/...` ต้องไม่ชี้กลับไปหน้าไทย)
 */
function buildCardCrumbs(card: (typeof DECK)[number], locale: Locale): Crumb[] {
  const isEnglish = locale === "en";
  const cardName = isEnglish ? card.nameEn : card.nameTh;
  const crumbs: Crumb[] = [
    homeCrumb(locale),
    { name: isEnglish ? "Tarot Card Meanings" : "คัมภีร์ไพ่ 78 ใบ", path: "/cards" },
  ];

  if (card.arcana === "major") {
    crumbs.push({ name: isEnglish ? "Major Arcana" : "ไพ่ชุดใหญ่ (Major Arcana)", path: "/cards/major" });
  } else {
    crumbs.push({ name: isEnglish ? "Minor Arcana" : "ไพ่ชุดเล็ก (Minor Arcana)", path: "/cards/minor" });
    if (card.suit && CARD_GROUPS[card.suit]) {
      const group = CARD_GROUPS[card.suit];
      crumbs.push({ name: isEnglish ? group.nameEn : group.nameTh, path: `/cards/${card.suit}` });
    }
  }

  crumbs.push({ name: cardName, path: `/cards/${card.id}` });
  return crumbs;
}

/**
 * คลาสของ `<main>` หน้าไพ่รายใบ — ประกาศที่นี่ที่เดียว
 * ⚠️ หน้า `.astro` เรนเดอร์ `<main>` เอง (เพราะ island ต้องอยู่ระดับเทมเพลตของ Astro)
 *    ถ้าก็อปคลาสไปเขียนซ้ำ วันหนึ่งสองฝั่งจะหน้าตาไม่เหมือนกันโดยไม่มีใครเห็น
 */
export const CARD_DETAIL_MAIN_CLASS =
  "min-h-screen text-ink-deep p-4 sm:p-8 font-sans relative overflow-x-clip";

/**
 * ไพ่ก่อนหน้า/ถัดไป และลำดับในสำรับ — ใช้ทั้งสองเครื่องมือเรนเดอร์
 *
 * ⚠️ คืนเฉพาะ 4 ฟิลด์ที่ปุ่มก่อนหน้า/ถัดไปใช้จริง (ดูเหตุผลที่ `CardNavRef`)
 */
export function cardNeighbors(card: TarotCard) {
  const currentIndex = DECK.findIndex((c) => c.id === card.id);
  const nav = (c: TarotCard | undefined): CardNavRef | undefined =>
    c && { id: c.id, image: c.image, nameTh: c.nameTh, nameEn: c.nameEn };
  return {
    currentIndex,
    totalCards: DECK.length,
    prevCard: nav(currentIndex > 0 ? DECK[currentIndex - 1] : undefined),
    nextCard: nav(currentIndex < DECK.length - 1 ? DECK[currentIndex + 1] : undefined),
  };
}

/** JSON-LD `DefinedTerm` ของไพ่ใบนี้ */
export function cardDetailJsonLd(card: TarotCard, locale: Locale) {
  const isEnglish = locale === "en";
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`,
    alternateName: isEnglish ? card.nameTh : card.nameEn,
    description: isEnglish
      ? `The meaning of ${card.nameEn} upright and reversed, its element, and its ${card.astrologyEn ?? card.astrology} correspondence.`
      : `ความหมายไพ่ทาโรต์ ${card.nameTh} ทั้งหัวตั้งและกลับหัว ธาตุ${card.element} โหราศาสตร์ ${card.astrology}`,
    inDefinedTermSet: localizedUrl("/cards", locale),
    url: localizedUrl(`/cards/${card.id}`, locale),
    image: `${SITE_ORIGIN}/cards/${card.image}`,
    // ไม่มี inLanguage — ไม่ใช่คุณสมบัติของ DefinedTerm (validator.schema.org เตือนทั้ง 156 หน้า · B3-06)
  };
}

/** JSON-LD `BreadcrumbList` ของไพ่ใบนี้ */
export function cardDetailBreadcrumbJsonLd(card: TarotCard, locale: Locale) {
  return buildBreadcrumbJsonLd(locale, buildCardCrumbs(card, locale));
}

/**
 * JSON-LD `FAQPage` สำหรับหน้าไพ่รายใบ — ใส่เฉพาะคำถามที่ผู้ใช้เห็นบนหน้าเป็นข้อความจริง (A7-10)
 * ตอนนี้มีข้อเดียวคือ "ใช่หรือไม่" (หัวข้อ h2 ของ `CardYesNoAnswer` · คำตอบคือคำอธิบายฝั่งหัวตั้งที่แสดงใต้หัวข้อ)
 * ความหมายรายด้าน (ความรัก · การงาน · กลับหัว) มีบนหน้าเป็นหัวข้อหมวด ไม่ใช่คำถาม จึงไม่ใส่ใน FAQPage
 */
export function cardDetailFaqJsonLd(card: TarotCard, locale: Locale) {
  const isEnglish = locale === "en";
  const yn = buildYesNoAnswer(card, true, isEnglish);
  return buildFaqPageJsonLd([{ question: cardYesNoQuestion(card, isEnglish), answer: yn.body }]);
}

/** ลิงก์ท้ายหน้า (ไพ่พลังงานใกล้เคียง + ผังที่เหมาะกับไพ่ใบนี้) — ไม่มีสถานะ ไม่ต้องใช้ JS */
export function CardDetailRelated({ card, locale }: { card: TarotCard; locale: Locale }) {
  return (
    <>
      <RelatedCards cardId={card.id} />
      <CardSpreadLinks card={card} locale={locale} />
    </>
  );
}
