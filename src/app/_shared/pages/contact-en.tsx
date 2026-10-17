import type { Metadata } from "next";
import { RouteLink as Link } from "@/components/ui/RouteLink";

import { BRAND_SOCIAL_LINKS, BRAND_SOCIAL_PROFILES, buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN } from "@/lib/config/site";
import { clampDescription } from "@/lib/config/meta-length";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { SOCIAL_BADGE_STYLE, SocialGlyph } from "@/components/ui/SocialIcons";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { BxBack, BxChips, Ui2Bento } from "@/components/ui2/Ui2Blocks";
import { Ui2DocHead } from "@/components/ui2/Ui2PageHero";

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

const SOCIAL_NOTES: Record<string, string> = {
  LINE: "Chat with us and get daily card updates (Thai)",
  Facebook: "Card meanings and weekly readings (Thai)",
  TikTok: "Educational shorts on card symbolism and layout interpretations",
};


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

      <div className="v2-doc">
        <Ui2DocHead
          kind="letter"
          crumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
          title="Contact Us"
          lede="We personally review and attend to every message received."
        />

        <section className="page-band page-band-compact page-band-tint space-y-3">
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
          <section className="page-band page-band-compact space-y-3">
            <h2 className="text-lg font-bold text-gold-ink font-serif-th"><ThaiPhrases>Official Channels</ThaiPhrases></h2>
            <ul className="space-y-3">
              {BRAND_SOCIAL_LINKS.map((social) => (
                <li key={social.name} className="altar-card-porcelain !rounded-xl p-4 flex items-center gap-4">
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center w-11 h-11 rounded-full shrink-0 overflow-hidden shadow-[0_4px_12px_rgba(40,28,14,0.18)]"
                    style={SOCIAL_BADGE_STYLE[social.name]}
                  >
                    <SocialGlyph name={social.name} />
                  </span>
                  <span className="min-w-0 space-y-1">
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-base text-gold-ink underline hover:text-gold-ink-deep font-serif-th break-all"
                    >
                      {social.name} · {social.handle}
                    </a>
                    <span className="block text-xs text-muted font-serif-th">{SOCIAL_NOTES[social.name]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>

      {/* v4 (เจ้าของ 2026-10-17 "นำสองส่วนนี้ของหน้าแรกไปใช้กับหน้าอื่น") — หัวข้อที่เขียนมาได้เป็นกล่องหลายขนาดแบบ "ครบในที่เดียว" */}
      <div className="ui2-bk-wrap">
        <Ui2Bento
          id="contact-topics"
          kicker="Write to us"
          title="Inquiries We Welcome"
          tiles={[
            {
              key: "support",
              size: "wide",
              glow: "amber",
              lead: "Technical",
              title: "Support & Platform Glitches",
              desc: "Card display anomalies, stream interrupts, session recovery, or sign-in concerns. Accompanying screenshots are always appreciated.",
              visual: <BxChips items={["Cards not showing", "Stuck reading", "Sign-in"]} on={-1} />,
            },
            {
              key: "feedback",
              size: "tall",
              glow: "teal",
              center: true,
              lead: "Editorial",
              title: "& Interpretation Feedback",
              desc: "If any AI interpretation feels ungrounded, disquieting, or lacking ethical nuance, please let us know so we can refine our archetypal system.",
              visual: <BxBack />,
            },
            {
              key: "privacy",
              lead: "Data",
              title: "Privacy & Erasure Inquiries",
              desc: "Initiate self-service data management directly from our Privacy Policy page, or write to request manual verification and data deletion under PDPA, GDPR, or CCPA.",
              go: { href: "/en/privacy", label: "Open the Privacy Policy" },
            },
            {
              key: "partner",
              lead: "Professional",
              title: "Partnerships & Reader Affiliation",
              desc: "Collaborative opportunities, ethical outreach, and qualified practitioners interested in future sanctuary features.",
            },
          ]}
        />
      </div>

      {/* บทที่เหลือต่อเลขจากบทด้านบน (อีเมล + ช่องทางโซเชียลถ้ามี) */}
      <div className="v2-doc" style={{ counterReset: `doc-sec ${TIKTOK_URL ? 2 : 1}` }}>

        <section className="page-band page-band-compact space-y-3">
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

        <section className="page-band page-band-compact page-band-tint space-y-3">
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
