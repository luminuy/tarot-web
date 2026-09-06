import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DECK, cardById } from "@/data/cards";
import { CardDetailView } from "@/components/encyclopedia/CardDetailView";
import { RelatedCards } from "@/components/encyclopedia/RelatedCards";
import { CardSpreadLinks } from "@/components/encyclopedia/CardSpreadLinks";
import { CARD_GROUPS } from "@/data/cards/group-seo";
import { buildAlternates, localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, homeCrumb, type Crumb } from "../seo";

export interface CardDetailPageProps {
  params: Promise<{ id: string }>;
}

/** พารามิเตอร์ของหน้าไพ่ 78 ใบ — ใช้ชุดเดียวกันทั้งสองภาษา */
export function cardStaticParams() {
  return DECK.map((card) => ({ id: card.id }));
}

export async function buildCardDetailMetadata(
  { params }: CardDetailPageProps,
  locale: Locale,
): Promise<Metadata> {
  const { id } = await params;
  const card = cardById(id);

  if (!card) {
    return {
      title: locale === "en" ? "Tarot card not found" : "ไม่พบไพ่ทาโรต์",
      robots: { index: false, follow: true },
    };
  }

  const path = `/cards/${card.id}`;
  const isEnglish = locale === "en";

  const title = isEnglish
    ? `${card.nameEn} Tarot Card Meaning: Upright & Reversed`
    : `ความหมายไพ่ยิปซี ${card.nameTh} (${card.nameEn}) หัวตั้ง-หัวกลับ`;

  const description = isEnglish
    ? `What ${card.nameEn} means upright and reversed, across love, work, money, self, and general readings — with its ${card.astrologyEn ?? card.astrology} correspondence, element, and the original 1909 Rider-Waite artwork.`
    : `เจาะลึกความหมายไพ่ยิปซี ${card.nameTh} (${card.nameEn}) ทั้งหัวตั้งและหัวกลับ 5 หมวดชีวิต ความรัก การงาน การเงิน โหราศาสตร์ ${card.astrology} ธาตุ${card.element} ภาพดั้งเดิม 1909`;

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
      images: [
        {
          url: `/cards/${card.image}`,
          width: 300,
          height: 520,
          alt: isEnglish
            ? `${card.nameEn} from the 1909 Rider-Waite tarot deck`
            : `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`,
        },
      ],
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

export async function CardDetailBody({
  params,
  locale,
}: CardDetailPageProps & { locale: Locale }) {
  const { id } = await params;
  const card = cardById(id);

  if (!card) {
    notFound();
  }

  const isEnglish = locale === "en";
  const currentIndex = DECK.findIndex((c) => c.id === card.id);
  const prevCard = currentIndex > 0 ? DECK[currentIndex - 1] : undefined;
  const nextCard = currentIndex < DECK.length - 1 ? DECK[currentIndex + 1] : undefined;

  const cardJsonLd = {
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

  const breadcrumbJsonLd = buildBreadcrumbJsonLd(locale, buildCardCrumbs(card, locale));

  return (
    <main className="min-h-screen bg-[#FAF7F2] text-[#2E211A] p-4 sm:p-8 font-sans relative overflow-x-clip">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(cardJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <CardDetailView
        card={card}
        prevCard={prevCard}
        nextCard={nextCard}
        totalCards={DECK.length}
        currentIndex={currentIndex}
        related={
          <>
            <RelatedCards cardId={card.id} />
            <CardSpreadLinks card={card} locale={locale} />
          </>
        }
      />
    </main>
  );
}
