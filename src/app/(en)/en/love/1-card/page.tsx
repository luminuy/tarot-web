import type { Metadata } from "next";

import { LoveOneCardClient } from "@/components/love/LoveOneCardClient";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { getCardWebpSrcSet } from "@/lib/tarot/card-image";

import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../../../../_shared/seo";
import { buildPageOgImage } from "@/lib/media/og-image";

/**
 * 💗 ดูดวงความรัก 1 ใบ ฉบับภาษาอังกฤษ (`/en/love/1-card`)
 *
 * เนื้อบทความเขียนขึ้นใหม่เป็นภาษาอังกฤษโดยตรง ไม่ใช่การแปลตรงตัวจากฉบับไทย
 * ⚠️ ห้ามเรียก dynamic API ใด ๆ ที่นี่ — หน้านี้ต้อง prerender ได้ (INC-0091)
 */
const PATH = "/love/1-card";

const TITLE = "One-Card Love Tarot: A Straight Answer";
const DESCRIPTION =
  "Pull one card about your love life and get a direct read — single, talking to someone, in a relationship, or still thinking about an ex.";

const loveOgImages = buildPageOgImage({
  title: "One-Card Love Tarot Reading",
  eyebrow: "HEART & RELATIONSHIP",
  cardImage: "major-06.jpg",
  alt: "One-card love tarot reading 1909 Rider-Waite",
});

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "love tarot reading",
    "one card love tarot",
    "free love tarot",
    "does he like me tarot",
    "ex tarot reading",
    "relationship tarot reading",
  ],
  alternates: buildAlternates(PATH, { locale: "en", englishTwin: true }),
  openGraph: {
    ...buildOpenGraph("en", { title: TITLE, description: DESCRIPTION, path: PATH, images: loveOgImages }),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [loveOgImages[0].url],
  },
};

const LOVE_FAQS_EN = [
  {
    q: "What kind of love question suits a one-card reading?",
    a: "Anything that wants a direction rather than a full story: how the connection stands right now, what you are not seeing, or what would actually help this week. One card is sharp precisely because it cannot hedge — if your question has several moving parts, a three-card spread will serve you better.",
  },
  {
    q: "Can tarot tell me how someone else feels about me?",
    a: "It can show you the shape of the connection — the intent, the atmosphere between you, and where the momentum is going — and that is genuinely useful. What it will not do is hand you a transcript of another person's private feelings. Read it as a description of the dynamic you are inside, and decide from there.",
  },
  {
    q: "Can I ask about an ex?",
    a: "Yes. There is a dedicated status for it, and the reading changes accordingly: it looks at what still needs healing on your side as well as whether the connection has any live current left in it. Both answers are worth having, and they are not the same question.",
  },
  {
    q: "How often should I ask the same love question?",
    a: "Once per question, and no more than about once a week if nothing has actually changed. Re-drawing on an unchanged situation does not produce new truth — it produces the answer you were hoping for, which is a different thing.",
  },
];

const LOVE_LINKS_EN = [
  { href: "/en/cards/major-06", label: "The Lovers card meaning" },
  { href: "/en/spreads", label: "25 tarot spreads" },
  { href: "/en/cards", label: "All 78 card meanings" },
  { href: "/en/daily", label: "Daily tarot card" },
];

const heroCardSrcSet = getCardWebpSrcSet("major-06.jpg");

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SeerTarot Love One-Card Oracle",
  operatingSystem: "All",
  applicationCategory: "LifestyleApplication",
  url: localizedUrl(PATH, "en"),
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LOVE_FAQS_EN.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

const breadcrumbJsonLd = buildBreadcrumbJsonLd("en", [
  homeCrumb("en"),
  { name: "Tarot Spreads", path: "/spreads" },
  { name: "One-Card Love Reading", path: PATH },
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

      <main className="min-h-screen bg-[#F3F0EA] py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          <LoveOneCardClient />

          <SeoArticleShell
            eyebrow="Reading for the heart"
            title="The One-Card Love Reading: Asking a Question That Can Actually Be Answered"
            faqs={LOVE_FAQS_EN}
            links={LOVE_LINKS_EN}
          >
            <p>
              Most love readings go wrong before a card is drawn, because the question was never answerable. &quot;Does
              he love me?&quot; asks the deck to report on somebody else&apos;s interior life. &quot;What am I not seeing
              about how this is going?&quot; asks about the thing you are actually inside of — and a single card can
              answer that with real precision.
            </p>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] pt-2">
              Four situations, four different readings
            </h3>
            <ul className="list-disc pl-5 space-y-2 text-[#635B4E]">
              <li>
                <strong className="text-[#29261F]">Single.</strong> The card speaks to what you are carrying into the
                next connection, and what would need to shift for it to land differently than the last one.
              </li>
              <li>
                <strong className="text-[#29261F]">Talking to someone, undefined.</strong> The most common and the most
                painful. Here the card reads the momentum: whether the ambiguity is a stage or a destination.
              </li>
              <li>
                <strong className="text-[#29261F]">In a relationship.</strong> The reading turns toward maintenance
                rather than prediction — what is being under-tended, and what a good week would actually look like.
              </li>
              <li>
                <strong className="text-[#29261F]">Thinking about an ex.</strong> Two threads get separated: what still
                needs healing regardless of them, and whether the connection has any live current left.
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-[#29261F] pt-2">
              Why one card, and why it is honest
            </h3>
            <p>
              A single card cannot hedge. It gives you one image to sit with instead of a narrative you can rearrange
              until it says what you wanted. The draw itself runs in your own browser through the Web Crypto API, and
              every reading publishes a SHA-256 commit-reveal proof you can check — the deck order was fixed before you
              chose, and no card is ever invented or swapped.
            </p>
          </SeoArticleShell>
        </div>
      </main>
    </>
  );
}
