import type { Metadata } from "next";
import { RouteLink as Link } from "@/components/ui/RouteLink";

import { BRAND_SOCIAL_PROFILES, buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import { clampDescription } from "@/lib/config/meta-length";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * ✉️ Contact Us Page (English Twin)
 *
 * Provides genuine, verified communication channels for international visitors.
 * Direct parity with src/app/(th)/contact/page.tsx.
 */

const contactOgImages = buildPageOgImage({
  title: "Contact SeerTarot",
  eyebrow: "SACRED ORACLE SANCTUARY",
  cardImage: "major-08.jpg",
  alt: "Contact the SeerTarot Sanctuary Team",
});

/* ⚠️ Do not include "SeerTarot" in TITLE — layout appends " · SeerTarot" automatically */
const TITLE = "Contact Us — Inquiries, Feedback & Technical Support";
const DESCRIPTION = clampDescription(
  "Official contact channels for SeerTarot Sanctuary. Reach out for technical support, reading feedback, data privacy requests, or partnerships."
);

const TIKTOK_URL = BRAND_SOCIAL_PROFILES.find((u) => u.includes("tiktok.com"));

export const contactMetadataEn: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: buildAlternates("/contact", { englishTwin: true, locale: "en" }),
  openGraph: {
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/en/contact`,
    siteName: "SeerTarot",
    type: "website",
    locale: "en_US",
    images: contactOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: `${TITLE} · SeerTarot`,
    description: DESCRIPTION,
    images: [contactOgImages[0].url],
  },
};

export function ContactBodyEn() {
  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd("en", [
    homeCrumb("en"),
    { name: "Contact Us", path: "/contact" },
  ]);

  const jsonLdContact = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: TITLE,
    description: DESCRIPTION,
    url: `${SITE_ORIGIN}/en/contact`,
    inLanguage: "en",
    mainEntity: {
      "@type": "Organization",
      name: "SeerTarot Sanctuary",
      alternateName: "Online Rider-Waite Tarot Sanctuary",
      url: `${SITE_ORIGIN}/en`,
      email: DEFAULT_SUPPORT_EMAIL,
      sameAs: [...BRAND_SOCIAL_PROFILES],
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: DEFAULT_SUPPORT_EMAIL,
        availableLanguage: ["en", "th"],
      },
    },
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdContact) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdBreadcrumbs) }} />

      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        <div className="text-center space-y-3 pb-6 border-b border-line/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif-th"><ThaiPhrases>Contact Us</ThaiPhrases></h1>
          <p className="text-xs text-muted">We personally review and attend to every message received.</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>Electronic Mail</ThaiPhrases></h2>
          <div className="altar-card-porcelain !rounded-xl p-4 space-y-2">
            <a
              href={`mailto:${DEFAULT_SUPPORT_EMAIL}`}
              className="text-base text-gold-ink underline hover:text-gold-ink-deep font-serif-th break-all"
            >
              {DEFAULT_SUPPORT_EMAIL}
            </a>
            <p className="text-xs text-muted font-serif-th">
              Primary sanctuary channel · Inquiries answered within 1–3 business days
            </p>
          </div>
        </section>

        {TIKTOK_URL && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>Official Channels</ThaiPhrases></h2>
            <div className="altar-card-porcelain !rounded-xl p-4 space-y-2">
              <a
                href={TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base text-gold-ink underline hover:text-gold-ink-deep font-serif-th break-all"
              >
                TikTok · @seerada.tarot
              </a>
              <p className="text-xs text-muted font-serif-th">Educational shorts on card symbolism and layout interpretations</p>
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>Inquiries We Welcome</ThaiPhrases></h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed font-serif-th">
            <li>
              <strong>Technical Support & Platform Glitches</strong> — Card display anomalies, stream interrupts, session recovery, or sign-in concerns. Accompanying screenshots are always appreciated.
            </li>
            <li>
              <strong>Editorial & Interpretation Feedback</strong> — If any AI interpretation feels ungrounded, disquieting, or lacking ethical nuance, please let us know so we can refine our archetypal system.
            </li>
            <li>
              <strong>Data Privacy & Erasure Inquiries</strong> — Initiate self-service data management directly from our{" "}
              <Link href="/en/privacy" prefetch={false} className="text-gold-ink underline hover:text-gold-ink">
                Privacy Policy
              </Link>{" "}
              page, or write to request manual verification and data deletion under PDPA, GDPR, or CCPA.
            </li>
            <li>
              <strong>Professional Partnerships & Reader Affiliation</strong> — Collaborative opportunities, ethical outreach, and qualified practitioners interested in future sanctuary features.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>Matters Outside Our Scope</ThaiPhrases></h2>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            We do not conduct manual readings via email, perform karmic or ritualistic interventions, or provide licensed medical, legal, or financial counsel. If you wish to draw cards, please visit our{" "}
            <Link href="/en" prefetch={false} className="text-gold-ink underline hover:text-gold-ink">
              Sanctuary Home
            </Link>{" "}
            to explore our 26 interactive spreads.
          </p>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            If you are navigating severe emotional distress or thoughts of self-harm, please connect immediately with professional crisis services: call or text <strong>988</strong> (Suicide & Crisis Lifeline in the US and Canada), dial <strong>111 / 999</strong> (UK), <strong>112</strong> (EU), <strong>1323</strong> (Thailand Mental Health Hotline), or contact your local emergency department. Our email channel cannot provide immediate crisis care.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>About the Sanctuary</ThaiPhrases></h2>
          <p className="text-sm text-ink leading-relaxed font-serif-th">
            To learn more about our philosophy, cryptographic Provably Fair random generation, and historical 1909 Rider-Waite heritage, visit our{" "}
            {/* ⚠️ ยังไม่มีหน้า /en/about — ลิงก์เดิมชี้ไปหน้านั้นแล้วได้ 404 (พบจากด่านลิงก์ภายใน · 2026-09-23)
                ชี้หน้าภาษาไทยไปก่อน และบอกผู้อ่านตรง ๆ ว่าเป็นภาษาไทย */}
            <Link href="/about" prefetch={false} className="text-gold-ink underline hover:text-gold-ink">
              About Us
            </Link>{" "}
            page (in Thai).
          </p>
        </section>
      </div>
    </main>
  );
}
