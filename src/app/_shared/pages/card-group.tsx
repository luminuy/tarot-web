import type { Metadata } from "next";

import { CARD_SUMMARIES } from "@/data/cards/summary";
import { CARD_GROUPS, type CardGroupInfo } from "@/data/cards/group-seo";
import { CardGroupView } from "@/components/encyclopedia/CardGroupView";
import { buildAlternates } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import type { Locale } from "@/lib/i18n/types";

import { buildOpenGraph } from "../seo";

type GroupId = CardGroupInfo["id"];

/**
 * 🃏 หน้าหมวดหมู่ไพ่ 6 หน้า (`/cards/major` · `/cards/minor` · 4 ดอก)
 * ใช้โมดูลเดียวกันทั้งฝั่งไทยและฝั่งอังกฤษ ต่างกันแค่ค่า `locale` ที่ส่งเข้ามา
 */
export function buildCardGroupMetadata(groupId: GroupId, locale: Locale): Metadata {
  const group = CARD_GROUPS[groupId];
  const title = locale === "en" ? group.seoTitleEn : group.seoTitleTh;
  const description = locale === "en" ? group.descriptionEn : group.descriptionTh;
  const path = `/cards/${groupId}`;

  const ogImages = buildPageOgImage({
    title: locale === "en" ? group.nameEn : group.nameTh,
    eyebrow: locale === "en" ? "TAROT CARD SUIT & ARCANA" : "หมวดหมู่ไพ่ทาโรต์",
    cardImage: getCategoryCardImage(groupId),
    alt: title,
  });

  return {
    title,
    description,
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: buildOpenGraph(locale, { title, description, path, images: ogImages }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImages[0].url],
    },
  };
}

/** ไพ่ที่อยู่ในหมวดนั้น — `major`/`minor` กรองด้วย arcana ส่วน 4 ดอกกรองด้วย suit */
function cardsInGroup(groupId: GroupId) {
  if (groupId === "major" || groupId === "minor") {
    return CARD_SUMMARIES.filter((card) => card.arcana === groupId);
  }
  return CARD_SUMMARIES.filter((card) => card.suit === groupId);
}

export function CardGroupBody({ groupId }: { groupId: GroupId; locale: Locale }) {
  const group = CARD_GROUPS[groupId];

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      <div className="max-w-6xl mx-auto relative z-10">
        <CardGroupView groupInfo={group} cards={cardsInGroup(groupId)} />
      </div>
    </main>
  );
}
