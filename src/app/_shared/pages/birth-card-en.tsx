import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Ui2Crumbs, Ui2SectionHead } from "@/components/ui2/Ui2PageHero";
import { CardImage } from "@/components/card/CardImage";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { DECK } from "@/data/cards";
import type { BirthCardItem } from "@/lib/tarot/birth-card";
import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";

/**
 * 🎂 Tarot Birth Card Calculator — English Edition (`/en/cards/birth-card`)
 *
 * ⚠️ Keep MAJOR_CARDS strictly filtered to fields consumed by BirthCardCalculator.
 * Do not include keywords or keywordsEn, avoiding HTML payload inflation (INC-0103).
 *
 * ⚠️ Zero dynamic API calls: This route must remain 100% SSG prerenderable (INC-0091).
 */
const PATH = "/cards/birth-card";
const TITLE = "Tarot Birth Card Calculator: Discover Your Soul Archetype";
const DESCRIPTION =
  "Calculate your tarot birth card and soul card from your date of birth. Discover your life lessons and archetypes from the 1909 Rider-Waite Major Arcana.";

export const MAJOR_CARDS: BirthCardItem[] = DECK.filter((c) => c.arcana === "major").map((c) => ({
  id: c.id,
  arcana: c.arcana,
  suit: c.suit,
  number: c.number,
  nameTh: c.nameTh,
  nameEn: c.nameEn,
  image: c.image,
  element: c.element,
  astrology: c.astrology,
  astrologyEn: c.astrologyEn,
  numerology: c.numerology,
  numerologyEn: c.numerologyEn,
}));

const birthCardOgImages = buildPageOgImage({
  title: "Tarot Birth Card Calculator",
  eyebrow: "NUMEROLOGY ARCHETYPES",
  cardImage: "major-10.jpg",
  alt: "Tarot birth card calculator 1909 Rider-Waite",
});

export const birthCardMetadataEn: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "tarot birth card",
    "birth card calculator",
    "soul card tarot",
    "personality card tarot",
    "what is my tarot card",
    "tarot numerology",
    "major arcana birth card",
    "calculate birth card",
  ],
  alternates: buildAlternates(PATH, { locale: "en", englishTwin: true }),
  openGraph: {
    ...buildOpenGraph("en", {
      title: TITLE,
      description: DESCRIPTION,
      path: PATH,
      images: birthCardOgImages,
    }),
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [birthCardOgImages[0].url],
  },
};

const BIRTH_CARD_FAQS_EN = [
  {
    q: "What is a tarot birth card?",
    a: "A tarot birth card is a Major Arcana archetype derived from your complete date of birth using numerological reduction. Pioneered by contemporary tarot scholars including Mary K. Greer and Angeles Arrien, birth cards serve as psychological archetypes and lifelong spiritual mirrors, outlining your natural gifts, growth edges, and overarching soul lessons.",
  },
  {
    q: "What is the difference between a Personality Card and a Soul Card?",
    a: "Your Personality Card (determined by the initial sum reduced to a number between 10 and 21) governs how you interface with the external world—your visible behavior, conscious coping mechanisms, and worldly expression. Your Soul Card (reduced further to a single digit 1 through 9) reveals your deeper spiritual intention, enduring core values, and the inner wisdom you are invited to embody.",
  },
  {
    q: "What does it mean if I only have one birth card?",
    a: "If your date of birth reduces directly to a single digit from 1 to 9, that card functions as both your Personality Card and your Soul Card. In tarot numerology, this indicates a unified alignment where your outward persona and innermost spiritual purpose share the same archetypal current.",
  },
  {
    q: "Do tarot birth cards change over time or as I age?",
    a: "No, your birth cards remain constant throughout your entire lifetime because they are anchored to the date of your arrival. However, you also have a 'Year Card' calculated by adding your birth day and month to the current calendar year, which highlights the specific lessons and archetypal themes active during that particular 12-month chapter.",
  },
];

const BIRTH_CARD_LINKS_EN = [
  { href: "/en/cards", label: "78 Card Encyclopedia" },
  { href: "/en/daily", label: "Daily Tarot Card" },
  { href: "/en/love/1-card", label: "One Card Love Tarot" },
  { href: "/en/spreads", label: "26 Tarot Spreads" },
  { href: "/en", label: "Start a Reading" },
];

const BIRTH_STEPS_EN = [
  { title: "Add day, month and year", math: "14 + 2 + 1997 = 2013", text: "Use the Gregorian (CE) year. Entered a Buddhist Era year? We subtract 543 for you." },
  { title: "Add the digits", math: "2 + 0 + 1 + 3 = 6", text: "Keep adding digits until the number is 22 or less, matching the 22 Major Arcana (22 is The Fool, card 0)." },
  { title: "Meet your birth card", math: "6 = The Lovers", text: "Land on 10 to 21? Add those two digits once more to find your second card, the Soul Card." },
];

const BIRTH_PAIRS_EN: { cards: number[]; title: string; text: string }[] = [
  { cards: [10, 1], title: "The Wheel of Fortune & The Magician", text: "Life brings frequent turning points, and you have a gift for turning crisis into opportunity." },
  { cards: [11, 2], title: "Justice & The High Priestess", text: "Discernment meets inner knowing. Others often come to you for fair, wise counsel." },
  { cards: [12, 3], title: "The Hanged Man & The Empress", text: "Pausing to see from a new angle lets creativity and abundance flow." },
  { cards: [13, 4], title: "Death & The Emperor", text: "Clearing away worn-out structures to build a stronger, steadier order." },
  { cards: [14, 5], title: "Temperance & The Hierophant", text: "Blending tradition with flexibility to create harmony and spiritual learning." },
  { cards: [15, 6], title: "The Devil & The Lovers", text: "Exploring desire and attachment, and choosing the love that sets you free." },
  { cards: [16, 7], title: "The Tower & The Chariot", text: "Strong willpower that learns to let go of ego when sudden change arrives." },
  { cards: [17, 8], title: "The Star & Strength", text: "Hope, gentle resilience, and quiet courage that calms wild instincts." },
  { cards: [18, 9], title: "The Moon & The Hermit", text: "Walking through fear and uncertainty with inner wisdom as your lantern." },
  { cards: [19, 10, 1], title: "The Sun, The Wheel of Fortune & The Magician", text: "A rare trio of light, clarity, and joyful success." },
  { cards: [20, 2], title: "Judgement & The High Priestess", text: "A call to awaken, release the past, and begin again with a clear heart." },
  { cards: [21, 3], title: "The World & The Empress", text: "Wholeness, abundance, and a sense of oneness with the world." },
];

export function BirthCardBodyEn({ calculator }: { calculator: ReactNode }) {
  const url = localizedUrl(PATH, "en");

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Tarot Birth Card Calculator",
    description: "Calculate your tarot birth card and soul card based on universal numerology and 1909 Rider-Waite archetypes.",
    url,
    inLanguage: "en",
  };

  const breadcrumbJsonLd = buildBreadcrumbJsonLd("en", [
    homeCrumb("en"),
    { name: "78 Card Encyclopedia", path: "/cards" },
    { name: "Birth Card Calculator", path: PATH },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: BIRTH_CARD_FAQS_EN.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  };

  const breadcrumbs = [
    { label: "Home", href: "/en" },
    { label: "78 Card Encyclopedia", href: "/en/cards" },
    { label: "Birth Card Calculator" },
  ];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="min-h-screen text-ink pb-10 px-4 sm:px-6 font-sans relative overflow-x-clip"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(faqJsonLd) }}
      />

      <div className="v2-bcp">
        {/* v2 — จอแรกคือเครื่องคำนวณเลย (ดูเหตุผลที่ birth-card-th.tsx) */}
        <header className="v2-bcp-head">
          <Ui2Crumbs crumbs={breadcrumbs} />
          <h1 className="v2-bcp-title">
            Tarot <span className="ui2-gold-night">Birth Card</span> Calculator
            <span className="v2-bcp-title-sub">Hidden in your date of birth</span>
          </h1>
          <p className="v2-bcp-lede">
            Enter your birthday and see which Major Arcana card is yours, with a reading from the Oracle.
          </p>
        </header>

        <div className="v2-bcp-tool">{calculator}</div>

        <section className="v2-bcp-sec" aria-labelledby="bc-how">
          <Ui2SectionHead n="01" word="How it works" title="The birth card formula in 3 steps" id="bc-how" />
          <ol className="v2-bcp-steps">
            {BIRTH_STEPS_EN.map((step, i) => (
              <li key={step.title} className="v2-bcp-stepcard">
                <span className="v2-bcp-stepn" aria-hidden="true">{i + 1}</span>
                <h3>{step.title}</h3>
                <p className="v2-bcp-math">{step.math}</p>
                <p>{step.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="v2-bcp-sec" aria-labelledby="bc-pairs">
          <Ui2SectionHead
            n="02"
            word="Card pairs"
            title="What your two cards say"
            lede="Birth card pairs show the interplay between your outward persona and your inner calling. There are twelve."
            id="bc-pairs"
          />
          <ul className="v2-bcp-pairs">
            {BIRTH_PAIRS_EN.map((pair) => (
              <li key={pair.title} className="v2-bcp-pair">
                <span className="v2-bcp-pair-fan" aria-hidden="true">
                  {pair.cards.map((n) => (
                    <span key={n} className="v2-bcp-pair-card">
                      <CardImage cardId={`major-${String(n).padStart(2, "0")}`} alt="" thumb sizes="64px" loading="lazy" />
                    </span>
                  ))}
                </span>
                <div>
                  <h3>{pair.title}</h3>
                  <p>{pair.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Editorial Guide Article */}
        <SeoArticleShell
          eyebrow="Archetypal Psychology"
          title="The Wisdom of Tarot Birth Cards: Numerological Blueprints for Personal Growth"
          faqs={BIRTH_CARD_FAQS_EN}
          links={BIRTH_CARD_LINKS_EN}
        >
          <div className="space-y-4 text-xs sm:text-sm text-muted font-sans leading-relaxed">
            <p>
              In contemporary tarot and esoteric numerology, your date of birth is not regarded as an arbitrary
              chronological marker, but rather as an archetypal signature. It establishes a fundamental energetic
              blueprint that accompanies you through each chapter of life. The formal system of calculating tarot
              birth cards was synthesized by pioneering tarot scholars such as Mary K. Greer, author of the seminal
              work <em>Who Are You in the Tarot?</em>, alongside cultural anthropologist Angeles Arrien. Their work
              bridged ancient symbolic systems with Carl Gustav Jung’s analytical psychology, demonstrating that the
              twenty-two cards of the Major Arcana embody timeless patterns of human consciousness.
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3"><ThaiPhrases>
              The Calculation Mechanism and Numerical Reduction
            </ThaiPhrases></h3>
            <p>
              The calculation of your birth card begins by summing the four-digit year, month, and day of your birth
              using the standard Gregorian calendar. Through a systematic process of cross-addition and digit reduction,
              the resulting total is distilled into the numerical sphere of the Major Arcana, numbered 0 through 21.
              In tarot tradition, this sequence represents The Fool&apos;s Journey—the universal evolutionary odyssey from
              innocence and unformed potential to complete spiritual realization.
            </p>
            <p>
              When your initial calculation yields a two-digit sum between 10 and 21, that primary number designates
              your <strong>Personality Card</strong>. When those two digits are added together once more to produce a
              single digit between 1 and 9, the resulting card represents your <strong>Soul Card</strong>. For individuals
              whose initial sum reduces straight into the 1 to 9 bracket, that single Major Arcana figure serves as both
              Personality and Soul card, suggesting an innate coherence between outward engagement and inner purpose.
            </p>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3"><ThaiPhrases>
              Applying Your Birth Card for Conscious Self-Development
            </ThaiPhrases></h3>
            <p>
              Your tarot birth card is not a fatalistic forecast or an unalterable verdict; it is an introspective
              framework designed to foster self-inquiry and mindful living:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-muted">
              <li>
                <strong>Integrating Light and Shadow:</strong> Every Major Arcana archetype possesses both a luminous
                expression and a cautionary shadow. Recognizing your card&apos;s shadow tendencies—such as perfectionism,
                avoidance, or over-assertion—allows you to respond constructively before reactive habits take over.
              </li>
              <li>
                <strong>An Ethical Anchor in Crossroads:</strong> When confronted with complex career or relational
                decisions, your birth card provides a reflective touchstone. Asking how your archetypal figures would
                navigate the situation helps align your actions with your deepest values.
              </li>
              <li>
                <strong>Contemplating the 1909 Rider-Waite Iconography:</strong> Engaging meditatively with the authentic
                symbolism illustrated by Pamela Colman Smith under Arthur Edward Waite&apos;s direction stimulates the
                subconscious mind, unlocking layers of personal meaning that discursive reasoning alone cannot reach.
              </li>
            </ol>
          </div>
        </SeoArticleShell>
      </div>
      {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
      <Ui2NextSteps isEn={true} keys={["spreads", "daily", "journal", "cards"]} />
    </main>
  );
}
