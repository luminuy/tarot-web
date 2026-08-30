import React from "react";
import { notFound } from "next/navigation";
import { DECK, cardById } from "@/data/cards";
import { CardDetailView } from "@/components/encyclopedia/CardDetailView";
import type { Metadata } from "next";

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

  return {
    title: `ความหมายไพ่ ${card.nameTh} (${card.nameEn}) | 1909 Rider-Waite Tarot`,
    description: `เจาะลึกความหมายไพ่ ${card.nameTh} ทั้งหัวตั้งและหัวกลับ 5 หมวดชีวิต ความรัก การงาน การเงิน โหราศาสตร์ ${card.astrology} ธาตุ${card.element}`,
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

  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
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
