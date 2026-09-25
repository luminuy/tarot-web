import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildPageOgImage } from "@/lib/media/og-image";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const pickACardOgImages = buildPageOgImage({
  title: "Pick A Card Tarot Reading",
  eyebrow: "Interactive 4-Pile Oracle",
  cardImage: "major-17.jpg",
  alt: "Pick A Card Tarot Reading 1909 Rider-Waite",
});

export const pickACardMetadataEn: Metadata = {
  // layout automatically appends " · SeerTarot" (12 chars). 47 + 12 = 59 <= 60 limit.
  title: "Pick A Card Reading: Love, Career & Soul Advice",
  description:
    "Choose 1 of 4 piles across 8 topics: what they think, will they return, who is coming, career, money, and the message the universe has for you. Free.",
  keywords: [
    "pick a card",
    "pick a card tarot",
    "pick a card love",
    "what are they thinking pick a card",
    "interactive tarot reading",
    "pick a card career",
    "free tarot oracle",
  ],
  alternates: buildAlternates("/pick-a-card", { locale: "en", englishTwin: true }),
  openGraph: {
    title: "Pick A Card Reading: Love, Career & Soul Advice · SeerTarot",
    description:
      "Select 1 of 4 sacred tarot piles to explore what they are thinking, prospective love horizons, and career crossroads with authentic 1909 Rider-Waite.",
    url: `${SITE_ORIGIN}/en/pick-a-card`,
    siteName: "SeerTarot",
    locale: "en_US",
    type: "website",
    images: pickACardOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "Pick A Card Reading: Love, Career & Soul Advice · SeerTarot",
    description:
      "Select 1 of 4 sacred tarot piles to explore what they are thinking, prospective love horizons, and career crossroads with authentic 1909 Rider-Waite.",
    images: [pickACardOgImages[0].url],
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: `${SITE_ORIGIN}/en`,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Pick A Card Reading",
      item: `${SITE_ORIGIN}/en/pick-a-card`,
    },
  ],
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is a Pick A Card reading and how does it work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A Pick A Card reading is an interactive divination ritual where cards are arranged into four thematic piles. By quieting the conscious mind and tuning into inner resonance, you select the pile whose energy calls to you most strongly to receive tailored intuitive counsel.",
      },
    },
    {
      "@type": "Question",
      name: "How can I choose my pile with the highest accuracy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Close your eyes, breathe deeply, and center your thoughts on your specific question or person. Upon opening your eyes, immediately select the pile, number, or crystal that catches your attention without overthinking.",
      },
    },
    {
      "@type": "Question",
      name: "Can I choose more than one pile or repeat the reading?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "If you feel equally drawn to two piles, both may hold complementary messages for your situation. However, avoid repeating the exact same question immediately. If you need bespoke granular clarity, consider a full 3D spread consultation with our AI Oracle.",
      },
    },
  ],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "SeerTarot Pick A Card Oracle",
  url: `${SITE_ORIGIN}/en/pick-a-card`,
};

const PICK_A_CARD_FAQS_EN = [
  {
    q: "What is a Pick A Card reading and how does it work?",
    a: "A Pick A Card reading is an interactive divination ritual where cards are arranged into four thematic piles. By quieting the conscious mind and tuning into inner resonance, you select the pile whose energy calls to you most strongly to receive tailored intuitive counsel.",
  },
  {
    q: "How can I choose my pile with the highest accuracy?",
    a: "Close your eyes, breathe deeply, and center your thoughts on your specific question or person. Upon opening your eyes, immediately select the pile, number, or crystal that catches your attention without overthinking.",
  },
  {
    q: "Can I choose more than one pile or repeat the reading?",
    a: "If you feel equally drawn to two piles, both may hold complementary messages for your situation. However, avoid repeating the exact same question immediately. If you need bespoke granular clarity, consider a full 3D spread consultation with our AI Oracle.",
  },
];

const PICK_A_CARD_LINKS_EN = [
  { href: "/en/daily", label: "Daily Tarot Reading" },
  { href: "/en/love/1-card", label: "Love One Card Draw" },
  { href: "/en/cards", label: "78 Tarot Cards Encyclopedia" },
  { href: "/en/spreads", label: "26 Sacred Spreads" },
];

export function PickACardBodyEn({ ritual }: { ritual: ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(softwareApplicationJsonLd) }}
      />

      <main id="main-content" tabIndex={-1} className="min-h-screen py-6 sm:py-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* ชื่อหน้า — เดิมหน้านี้ไม่มีหัวเรื่องบอกว่าเป็นหน้าอะไร <h1> คือหัวข้อที่เลือกอยู่ ("เขาคิดยังไงกับเรา…")
              ซึ่งไม่ตรงกับชื่อหน้าในผลค้นหา (เจ้าของทัก) · หัวข้อที่เลือกในพิธีจึงลดเป็น <h2> บนหน้านี้ */}
          <header className="text-center space-y-2 pt-2">
            <h1 className="text-2xl sm:text-4xl font-serif-th font-bold text-ink leading-snug [text-wrap:balance]">
              <ThaiPhrases>{"Pick A Card Tarot Reading"}</ThaiPhrases>
            </h1>
            <p className="text-sm sm:text-base text-muted font-serif-th leading-relaxed">
              <ThaiPhrases>{"Choose a topic, hold it in mind, and pick the pile that calls to you."}</ThaiPhrases>
            </p>
          </header>

          {/* ห่อ div — <astro-island> เป็น display:contents จึงไม่รับระยะจาก space-y ทำให้กล่องพิธีชิดกล่องบทความ */}
          <div>{ritual}</div>

          <SeoArticleShell
            eyebrow="The Science of Pile Divination"
            title="The Art of Pick A Card: Aligning Subconscious Intuition with Archetypal Wisdom"
            faqs={PICK_A_CARD_FAQS_EN}
            links={PICK_A_CARD_LINKS_EN}
          >
            <p>
              <strong>Pick A Card</strong> readings have captivated seekers worldwide because they
              grant the subconscious mind an active vehicle for self-reflection. Rather than passively
              receiving randomized outputs, the energetic resonance you feel toward a particular crystal
              or pile acts as a psychological mirror reflecting your present inner climate.
            </p>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink pt-2"><ThaiPhrases>
              Energetic Signatures of the Four Sacred Crystals
            </ThaiPhrases></h3>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>
                <strong className="text-ink">Pile 1 Rose Quartz:</strong> Stone of heart-centered tenderness,
                unconditional warmth, and emotional restoration. Ideal for soothing heartache and opening vulnerable channels.
              </li>
              <li>
                <strong className="text-ink">Pile 2 Amethyst:</strong> Stone of spiritual clarity, intuitive discernment,
                and psychic calm. Best for transcending anxiety and uncovering unvarnished truth.
              </li>
              <li>
                <strong className="text-ink">Pile 3 Citrine:</strong> Stone of radiant prosperity, joyful momentum,
                and creative manifestation. Ideal for career pivots, venture launches, and material growth.
              </li>
              <li>
                <strong className="text-ink">Pile 4 Lapis Lazuli:</strong> Stone of sovereign truth, karmic purpose,
                and timeless insight. Suitable for life-mission realignment and deep soul awakening.
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-serif-th font-bold text-ink pt-2"><ThaiPhrases>
              Translating Divination into Mindful Sovereignty
            </ThaiPhrases></h3>
            <p>
              Tarot cards are not rigid verdicts inscribed in stone; they function as a living compass
              illuminating latent momentum and prospective trajectories. Armed with these archetypal insights,
              your sovereign free will remains paramount in sculpting an empowered, graceful future.
            </p>
          </SeoArticleShell>
        </div>
      </main>
    </>
  );
}
