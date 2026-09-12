import type { Metadata } from "next";

import { DailyClient } from "@/components/daily/DailyClient";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../../../_shared/seo";
import { buildPageOgImage } from "@/lib/media/og-image";

/**
 * 🌅 ไพ่ประจำวันฉบับภาษาอังกฤษ (`/en/daily`)
 *
 * เนื้อบทความ SEO ของหน้านี้เขียนขึ้นใหม่เป็นภาษาอังกฤษโดยตรง (ไม่ใช่การแปลตรงตัว
 * จากฉบับไทย) เพราะกลุ่มคำค้นและวิธีเล่าเรื่องของสองภาษาต่างกัน
 *
 * ⚠️ ห้ามเรียก dynamic API ใด ๆ ที่นี่ — หน้านี้ต้อง prerender ได้ (INC-0091)
 */
const PATH = "/daily";

const TITLE = "Free Daily Tarot Card: Your Guidance for Today";
const DESCRIPTION =
  "Pull one tarot card for today and read what it means for your work, money, love, and state of mind — from the full 1909 Rider-Waite deck.";

const dailyOgImages = buildPageOgImage({
  title: "Free Daily Tarot Card",
  eyebrow: "DAILY GUIDANCE",
  cardImage: "major-19.jpg",
  alt: "Daily tarot card 1909 Rider-Waite",
});

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "daily tarot",
    "daily tarot card",
    "free daily tarot reading",
    "tarot card of the day",
    "one card tarot reading",
    "today's tarot",
  ],
  alternates: buildAlternates(PATH, { locale: "en", englishTwin: true }),
  openGraph: {
    ...buildOpenGraph("en", { title: TITLE, description: DESCRIPTION, path: PATH, images: dailyOgImages }),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [dailyOgImages[0].url],
  },
};

const DAILY_FAQS_EN = [
  {
    q: "When is the best time to pull a daily tarot card?",
    a: "First thing in the morning, before the day's noise starts. Sit with the question for a moment, notice how you actually feel, and then draw. The card is most useful as a lens for the day ahead rather than a verdict on it — pulling it early gives you the whole day to work with what it says.",
  },
  {
    q: "Can I draw a second daily card if I don't like the first one?",
    a: "You can, but it rarely helps. A daily draw is strongest as a single card held for the whole day; re-drawing until you get a card you like turns a reflection tool into a slot machine. If you have a specific question that a one-card pull cannot hold, use a three-card spread or the ten-card Celtic Cross instead.",
  },
  {
    q: "What does the daily reading actually cover?",
    a: "Five dimensions: the overall energy of the day, direction at work, money and resources, love and relationships, and one piece of practical counsel to carry with you. Each is read from the same card in a different context, the way a reader would move around a single card in a live reading.",
  },
  {
    q: "Is the shuffle actually random?",
    a: "Yes, and you can check it. The shuffle runs in your own browser through the Web Crypto API, and every reading publishes a SHA-256 commit-reveal proof you can verify independently. No card is ever invented, substituted, or held back.",
  },
];

const DAILY_LINKS_EN = [
  { href: "/en/cards", label: "All 78 card meanings" },
  { href: "/en/spreads", label: "25 tarot spreads" },
  { href: "/en/cards/major", label: "Major Arcana" },
  { href: "/en", label: "Start a full reading" },
];

const heroCardSrcSet = getCardWebpSrcSet("major-19.jpg");

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SeerTarot Daily Tarot",
  operatingSystem: "All",
  applicationCategory: "LifestyleApplication",
  url: localizedUrl(PATH, "en"),
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: DAILY_FAQS_EN.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd("en", [
  homeCrumb("en"),
  { name: "Daily Tarot", path: PATH },
]);

export default function Page() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        type="image/webp"
        fetchPriority="high"
        imageSrcSet={heroCardSrcSet ?? undefined}
        imageSizes="120px"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />

      <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F3F0EA] py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <DailyClient />

          <SeoArticleShell
            eyebrow="Working with a daily card"
            title="The Daily Tarot Draw: A Mirror for the Day, Not a Verdict on It"
            faqs={DAILY_FAQS_EN}
            links={DAILY_LINKS_EN}
          >
            <p>
              A daily tarot draw is not a forecast you are stuck with. In the tradition the 1909 Rider-Waite-Smith deck
              comes from, a single card pulled in the morning works as a lens: it names one theme clearly enough that you
              start noticing it. Carl Jung&apos;s account of archetypes and synchronicity describes the same mechanism in
              psychological language — the image does not cause the day, it gives you a vocabulary for reading it.
            </p>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] pt-2">
              How to get something real out of a one-card pull
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-[#635B4E]">
              <li>
                <strong className="text-[#29261F]">Draw before the day starts.</strong> Take one slow breath, notice the
                mood you are actually in rather than the one you would prefer, and then pull. A card drawn at 7am can
                change how you handle 3pm; a card drawn at 11pm can only explain it.
              </li>
              <li>
                <strong className="text-[#29261F]">Read the picture, not just the keyword.</strong> Pamela Colman
                Smith&apos;s illustrations carry the meaning in colour, posture, and where the figure is looking. Notice
                what the character is doing before you reach for a definition — the detail that catches your eye is
                usually the one worth sitting with.
              </li>
              <li>
                <strong className="text-[#29261F]">Look back at night.</strong> Before sleep, compare the card to what
                actually happened. Done for a month, this is the single fastest way to build real intuition, because you
                are training against outcomes instead of memorising lists.
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] pt-2">
              Why the shuffle is provably fair
            </h3>
            <p>
              Every shuffle here runs in your own browser through the Web Crypto API, and each reading publishes a
              SHA-256 commit-reveal proof so you can confirm the deck order was fixed before you chose. Nothing is
              weighted, nothing is withheld to sell you an upgrade, and no card is ever invented — if card data is
              missing, the reading stops and asks you to reload rather than substituting something plausible.
            </p>
          </SeoArticleShell>
        </div>
      </main>
    </>
  );
}
