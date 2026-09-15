import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DECK, cardById } from "@/data/cards";
import type { TarotCard } from "@/data/cards/types";
import { CardDetailView, type CardNavRef } from "@/components/encyclopedia/CardDetailView";
import { RelatedCards } from "@/components/encyclopedia/RelatedCards";
import { CardSpreadLinks } from "@/components/encyclopedia/CardSpreadLinks";
import { CARD_GROUPS } from "@/data/cards/group-seo";
import { buildAlternates, localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { clampDescription, pickTitle } from "@/lib/config/meta-length";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, homeCrumb, type Crumb } from "../seo";

export interface CardDetailPageProps {
  params: Promise<{ id: string }>;
}

/** พารามิเตอร์ของหน้าไพ่ 78 ใบ — ใช้ชุดเดียวกันทั้งสองภาษา */
export function cardStaticParams() {
  return DECK.map((card) => ({ id: card.id }));
}

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
    };
  }

  const path = `/cards/${card.id}`;
  const isEnglish = locale === "en";

  // ชื่อไพ่บางใบยาว (เช่น "Seven of Pentacles" / "ราชินีแห่งเหรียญ") ถ้าต่อท้ายเต็มสูตรทุกใบ
  // title จะทะลุเพดานที่ Google แสดงได้ — เรียงจากครบสุดไปสั้นสุดให้ pickTitle เลือกเอง
  const title = isEnglish
    ? pickTitle([
        `${card.nameEn} Tarot Card Meaning: Upright & Reversed`,
        `${card.nameEn} Meaning: Upright & Reversed`,
        `${card.nameEn} Tarot Card Meaning`,
      ])
    : pickTitle([
        `ความหมายไพ่ยิปซี ${card.nameTh} (${card.nameEn}) หัวตั้ง-หัวกลับ`,
        `ความหมายไพ่ยิปซี ${card.nameTh} หัวตั้ง-หัวกลับ`,
        `ความหมายไพ่ ${card.nameTh} (${card.nameEn})`,
      ]);

  const description = isEnglish
    ? clampDescription(
        `What ${card.nameEn} means upright and reversed — across love, work, money, and self, with its ${card.astrologyEn ?? card.astrology} correspondence.`,
        "Original 1909 Rider-Waite artwork.",
      )
    : clampDescription(
        `เจาะลึกความหมายไพ่ยิปซี ${card.nameTh} (${card.nameEn}) ทั้งหัวตั้งและหัวกลับ 5 หมวดชีวิต ความรัก การงาน การเงิน โหราศาสตร์ ${card.astrology} ธาตุ${card.element}`,
        "ภาพดั้งเดิม 1909",
      );

  const keywords = isEnglish
    ? [
        `${card.nameEn} meaning`,
        `${card.nameEn} tarot`,
        `${card.nameEn} reversed`,
        `${card.nameEn} love meaning`,
        `${card.nameEn} career meaning`,
        "rider waite tarot meanings",
      ]
    : [
        `ไพ่ ${card.nameTh}`,
        card.nameEn,
        `ความหมายไพ่ ${card.nameTh}`,
        `${card.nameTh} ความรัก`,
        `${card.nameTh} การงาน`,
        `${card.nameTh} กลับหัว`,
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

export async function buildCardDetailMetadata(
  { params }: CardDetailPageProps,
  locale: Locale,
): Promise<Metadata> {
  const { id } = await params;
  return cardDetailMetadata(id, locale);
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
 * ⚙️ เนื้อหาหน้าไพ่รายใบแบบซิงโครนัส — รับไพ่ที่หาเจอแล้วเข้ามาตรง ๆ
 * Astro เรียกตัวนี้ (React ฝั่ง SSR เรนเดอร์คอมโพเนนต์แบบ async ไม่ได้)
 * ส่วน Next เรียกผ่าน `CardDetailBody` ด้านล่างซึ่งรอ `params` ให้ก่อน
 */
/**
 * คลาสของ `<main>` หน้าไพ่รายใบ — ประกาศที่นี่ที่เดียว
 * ⚠️ หน้า `.astro` เรนเดอร์ `<main>` เอง (เพราะ island ต้องอยู่ระดับเทมเพลตของ Astro)
 *    ถ้าก็อปคลาสไปเขียนซ้ำ วันหนึ่งสองฝั่งจะหน้าตาไม่เหมือนกันโดยไม่มีใครเห็น
 */
export const CARD_DETAIL_MAIN_CLASS =
  "min-h-screen bg-surface-warm text-ink-deep p-4 sm:p-8 font-sans relative overflow-x-clip";

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
    inLanguage: locale,
  };
}

/** JSON-LD `BreadcrumbList` ของไพ่ใบนี้ */
export function cardDetailBreadcrumbJsonLd(card: TarotCard, locale: Locale) {
  return buildBreadcrumbJsonLd(locale, buildCardCrumbs(card, locale));
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

export function CardDetailContent({
  card,
  locale,
}: {
  card: TarotCard;
  locale: Locale;
}) {
  const { currentIndex, totalCards, prevCard, nextCard } = cardNeighbors(card);

  return (
    <main id="main-content" tabIndex={-1} className={CARD_DETAIL_MAIN_CLASS}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cardDetailJsonLd(card, locale)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cardDetailBreadcrumbJsonLd(card, locale)) }} />
      <CardDetailView
        card={card}
        prevCard={prevCard}
        nextCard={nextCard}
        totalCards={totalCards}
        currentIndex={currentIndex}
        related={<CardDetailRelated card={card} locale={locale} />}
      />
    </main>
  );
}

export async function CardDetailBody({
  params,
  locale,
}: CardDetailPageProps & { locale: Locale }) {
  const { id } = await params;
  const card = cardById(id);

  if (!card) {
    notFound();
  }

  return <CardDetailContent card={card} locale={locale} />;
}
