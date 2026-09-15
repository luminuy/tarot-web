import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RitualHero } from "@/components/reading/one-card/RitualHero";
import { SeoArticleShell } from "@/components/seo/SeoArticleShell";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { DECK } from "@/data/cards";
import type { BirthCardItem } from "@/lib/tarot/birth-card";
import { buildBreadcrumbJsonLd, buildOpenGraph, homeCrumb } from "../seo";

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
  { href: "/en/spreads", label: "25 Tarot Spreads" },
  { href: "/en", label: "Start a Reading" },
];

export function BirthCardBodyEn({ calculator }: { calculator: ReactNode }) {
  const url = localizedUrl(PATH, "en");

  const webAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Tarot Birth Card Calculator",
    description: "Calculate your tarot birth card and soul card based on universal numerology and 1909 Rider-Waite archetypes.",
    applicationCategory: "LifestyleApplication",
    url,
    inLanguage: "en",
    operatingSystem: "All",
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
      className="min-h-screen bg-canvas text-ink py-6 sm:py-10 px-4 sm:px-6 font-sans relative overflow-x-clip"
    >
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-10">
        {/* Ritual Hero */}
        <RitualHero
          breadcrumbs={breadcrumbs}
          badgeText="Tarot Numerology"
          title="Tarot Birth Card Calculator"
          tagline="Discover the psychological archetypes and lifelong soul lessons woven into your birth date through the authentic 1909 Rider-Waite deck."
        />

        {/* Interactive Calculator Component */}
        {calculator}

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

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3">
              The Calculation Mechanism and Numerical Reduction
            </h3>
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

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3">
              The Twelve Archetypal Constellations and Pairings
            </h3>
            <p>
              Working with birth card pairings illuminates the dynamic interplay between your conscious social persona
              and your deeper internal inclinations. Each classic pairing invites you to harmonize two complementary
              dimensions of experience:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-muted">
              <li>
                <strong>The Wheel of Fortune (10) and The Magician (1):</strong> Individuals navigating this constellation
                frequently encounter shifting circumstances and cyclical turning points. Their gift lies in harnessing
                focused willpower and resourcefulness to transmute unexpected volatility into creative momentum.
              </li>
              <li>
                <strong>Justice (11) and The High Priestess (2):</strong> A pairing of discernment and inner knowing.
                It brings together analytical fairness with profound intuitive insight, guiding individuals toward
                uncompromising truth, balance, and quiet moral clarity.
              </li>
              <li>
                <strong>The Hanged Man (12) and The Empress (3):</strong> The capacity to pause, surrender habitual
                control, and adopt unconventional viewpoints. Through intentional stillness, new creative fertility
                and emotional abundance are nurtured into being.
              </li>
              <li>
                <strong>Death (13) and The Emperor (4):</strong> The transformative mastery of structure and release.
                This pairing represents the courage to dissolve outworn patterns in order to establish resilient,
                sustainable foundations that serve long-term order.
              </li>
              <li>
                <strong>Temperance (14) and The Hierophant (5):</strong> The synthesis of traditional wisdom and
                spiritual flexibility. It represents the conscious alchemy of blending diverse perspectives, finding
                moderation, and translating sacred principles into everyday community life.
              </li>
              <li>
                <strong>The Devil (15) and The Lovers (6):</strong> The profound exploration of attachment, desire,
                and conscious choice. It challenges the soul to recognize unconscious conditioning and illusions of
                bondage, ultimately choosing authenticity and unconditional self-respect.
              </li>
              <li>
                <strong>The Tower (16) and The Chariot (7):</strong> Driven willpower tempered by humbling breakthroughs.
                This constellation teaches that true inner strength is forged when ego-driven ambition yields to sudden
                clarity, allowing for more authentic and purposeful self-direction.
              </li>
              <li>
                <strong>The Star (17) and Strength (8):</strong> Hope, gentle resilience, and quiet spiritual renewal.
                This pairing cultivates the profound courage required to meet primal instincts with patience and compassion,
                radiating calm faith even in the wake of trial.
              </li>
              <li>
                <strong>The Moon (18) and The Hermit (9):</strong> Navigation of subconscious depths and inner truth.
                By retreating into solitary reflection, the seeker illuminates shadows, demystifies fear, and returns
                with the lantern of self-validated insight.
              </li>
              <li>
                <strong>The Sun (19), The Wheel of Fortune (10), and The Magician (1):</strong> A unique three-card
                constellation radiating vitality, joy, and conscious manifestation. It represents the ability to align
                with life&apos;s natural rhythms and express truth with unclouded lucidity.
              </li>
              <li>
                <strong>Judgement (20) and The High Priestess (2):</strong> The spiritual awakening to a higher calling.
                Deep intuition meets the resonant sound of renewal, inviting the shedding of past regrets and a bold
                rebirth into purposeful living.
              </li>
              <li>
                <strong>The World (21) and The Empress (3):</strong> The realization of wholeness and generative joy.
                This constellation honors the completion of expansive karmic cycles and the celebration of life&apos;s
                abundant, interconnected tapestry.
              </li>
            </ul>

            <h3 className="text-base sm:text-lg font-bold font-serif-th text-ink pt-3">
              Applying Your Birth Card for Conscious Self-Development
            </h3>
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
    </main>
  );
}
