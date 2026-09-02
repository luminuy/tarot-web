import React from "react";
import { notFound } from "next/navigation";
import { DECK, cardById } from "@/data/cards";
import { CardDetailView } from "@/components/encyclopedia/CardDetailView";
import { MysticBackground } from "@/components/ui/MysticBackground";
import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/config/site";

interface CardPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return DECK.map((card) => ({
    id: card.id,
  }));
}

export async function generateMetadata({ params }: CardPageProps): Promise<Metadata> {
  const { id } = await params;
  const card = cardById(id);

  if (!card) {
    return {
      title: "ไม่พบไพ่ทาโรต์ | Tarot Encyclopedia",
    };
  }

  const title = `ความหมายไพ่ ${card.nameTh} (${card.nameEn}) | 1909 Rider-Waite Tarot`;
  const description = `เจาะลึกความหมายไพ่ ${card.nameTh} (${card.nameEn}) ทั้งหัวตั้งและหัวกลับ 5 หมวดชีวิต ความรัก การงาน การเงิน โหราศาสตร์ ${card.astrology} ธาตุ${card.element} ภาพดั้งเดิม 1909`;

  return {
    title,
    description,
    keywords: [
      `ไพ่ ${card.nameTh}`,
      card.nameEn,
      `ความหมายไพ่ ${card.nameTh}`,
      `${card.nameTh} ความรัก`,
      `${card.nameTh} การงาน`,
      `${card.nameTh} กลับหัว`,
      "ไพ่ทาโรต์ 1909 Rider-Waite",
    ],
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_ORIGIN}/cards/${card.id}`,
      images: [
        {
          url: `/cards/${card.image}`,
          width: 300,
          height: 520,
          alt: `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`,
        },
      ],
    },
    alternates: {
      canonical: `${SITE_ORIGIN}/cards/${card.id}`,
    },
  };
}

export default async function CardDetailPage({ params }: CardPageProps) {
  const { id } = await params;
  const card = cardById(id);

  if (!card) {
    notFound();
  }

  const currentIndex = DECK.findIndex((c) => c.id === card.id);
  const prevCard = currentIndex > 0 ? DECK[currentIndex - 1] : undefined;
  const nextCard = currentIndex < DECK.length - 1 ? DECK[currentIndex + 1] : undefined;

  const cardJsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: `${card.nameTh} (${card.nameEn})`,
    alternateName: card.nameEn,
    description: `ความหมายไพ่ทาโรต์ ${card.nameTh} ทั้งหัวตั้งและกลับหัว ธาตุ${card.element} โหราศาสตร์ ${card.astrology}`,
    inDefinedTermSet: `${SITE_ORIGIN}/cards`,
    url: `${SITE_ORIGIN}/cards/${card.id}`,
    image: `${SITE_ORIGIN}/cards/${card.image}`,
    inLanguage: "th",
  };

  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700] relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(cardJsonLd) }}
      />
      <MysticBackground />
      <CardDetailView
        card={card}
        prevCard={prevCard}
        nextCard={nextCard}
        totalCards={DECK.length}
        currentIndex={currentIndex}
      />
    </main>
  );
}
