import type { Metadata } from "next";
import { DECK } from "@/data/cards";
import { CARD_GROUPS } from "@/data/cards/group-seo";
import { CardGroupView } from "@/components/encyclopedia/CardGroupView";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

const group = CARD_GROUPS.swords;

export const metadata: Metadata = {
  title: group.seoTitleTh,
  description: group.descriptionTh,
  alternates: {
    canonical: `${SITE_ORIGIN}/cards/swords`,
  },
  openGraph: {
    title: group.seoTitleTh,
    description: group.descriptionTh,
    url: `${SITE_ORIGIN}/cards/swords`,
    siteName: "SeerTarot",
    type: "website",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
  },
};

export default function SwordsPage() {
  const cards = DECK.filter((c) => c.suit === "swords");

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      <div className="max-w-6xl mx-auto relative z-10">
        <CardGroupView groupInfo={group} cards={cards} />
      </div>
    </main>
  );
}
