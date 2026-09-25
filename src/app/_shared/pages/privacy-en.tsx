import type { Metadata } from "next";
import type { ReactNode } from "react";
import { buildAlternates, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

const privacyOgImages = buildPageOgImage({
  title: "Privacy Policy & Data Rights",
  eyebrow: "Data Protection & Privacy",
  cardImage: "major-11.jpg",
  alt: "SeerTarot Privacy Policy, PDPA and GDPR Compliance",
});

export const privacyMetadataEn: Metadata = {
  title: "Privacy Policy & PDPA / GDPR Compliance",
  description:
    "Comprehensive Privacy Policy, PDPA B.E. 2562, and GDPR compliance framework for SeerTarot online interactive tarot sanctuary.",
  alternates: buildAlternates("/privacy", { locale: "en", englishTwin: true }),
  openGraph: {
    title: "Privacy Policy & PDPA / GDPR Compliance · SeerTarot",
    description:
      "Comprehensive Privacy Policy, PDPA B.E. 2562, and GDPR compliance framework for SeerTarot online interactive tarot sanctuary.",
    url: `${SITE_ORIGIN}/en/privacy`,
    siteName: "SeerTarot",
    type: "website",
    images: privacyOgImages,
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy & PDPA / GDPR Compliance · SeerTarot",
    description:
      "Comprehensive Privacy Policy, PDPA B.E. 2562, and GDPR compliance framework for SeerTarot online interactive tarot sanctuary.",
    images: [privacyOgImages[0].url],
  },
};

/** `deleteButton` = ปุ่มลบข้อมูลทั้งหมด (island ตัวเดียวของหน้านี้) ส่งเข้ามาจากข้างนอก */
export function PrivacyBodyEn({ deleteButton }: { deleteButton: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink">
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3 pb-6 border-b border-line/40">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink font-serif"><ThaiPhrases>
            Privacy Policy &amp; Data Protection
          </ThaiPhrases></h1>
          <p className="text-xs text-muted">
            Compliance Framework for PDPA (B.E. 2562), GDPR (EU 2016/679), and CCPA/CPRA
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif"><ThaiPhrases>1. Information We Collect</ThaiPhrases></h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed">
            <li>
              <strong>Identity &amp; Profile Details (OAuth)</strong> — When authenticating via Google or LINE,
              we process your public display name, profile avatar, and verified user identifier solely to secure
              your account and synchronize your reading journal across devices.
            </li>
            <li>
              <strong>Email Address (Optional)</strong> — Processed exclusively upon your affirmative, explicit
              consent to deliver opted-in daily fortune digests or reading follow-up reflections. You can opt out
              at any moment with a single click.
            </li>
            <li>
              <strong>Preferred Nickname</strong> — Used strictly to address you warmly during your reading sessions.
            </li>
            <li>
              <strong>Your zodiac sign (optional)</strong> — When you press &quot;Remember my sign for readings&quot; on the
              zodiac cards page, we store only the sign name in your browser and send it with reading requests so the oracle
              can notice your own cards. Your birthday is never sent or stored, and you can remove the sign on the same page.
            </li>
            <li>
              <strong>Inquiries &amp; Drawn Cards</strong> — Your submitted questions, selected spreads, and drawn tarot
              cards are processed in real time to generate algorithmic interpretations and preserve your journal history.
            </li>
            <li>
              <strong>Reflections &amp; Real-World Outcomes (Notes &amp; Feedback)</strong> — Optional personal notes and
              empirical outcome records stored to help you evaluate the qualitative resonance of your readings over time.
            </li>
            <li>
              <strong>Trial Quota Cookie (tarot_guest)</strong> — A strictly functional, first-party cookie containing
              only a cryptographically random identifier and your remaining complimentary trial counter. It collects
              zero personal data, performs zero cross-site tracking, and can be cleared via your browser settings at
              any time.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif"><ThaiPhrases>2. Prohibited Practices &amp; Core Commitments</ThaiPhrases></h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed">
            <li>
              <strong>Zero AI Training on Personal Readings</strong> — We never use your private questions, drawn
              cards, or journal reflections to train, calibrate, or fine-tune public or proprietary artificial
              intelligence models.
            </li>
            <li>
              <strong>No Sale or Commercial Data Brokering</strong> — We do not sell, rent, monetize, or disclose your
              personal information to commercial data brokers, advertising networks, or third parties under any
              circumstances.
            </li>
            <li>
              <strong>No Cross-Site Tracking</strong> — We do not employ third-party tracking cookies or fingerprinting
              technologies across external websites.
            </li>
            <li>
              <strong>No Unsolicited Marketing</strong> — We never distribute promotional communications or spam without
              prior, unbundled opt-in consent.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif"><ThaiPhrases>
            3. Data Storage, Retention &amp; Cloud Architecture
          </ThaiPhrases></h2>
          <div className="text-sm text-ink leading-relaxed space-y-2">
            <p>
              <strong>Anonymous Visitors (Unauthenticated):</strong> All reading history, selected spreads, and notes
              are retained exclusively within <strong>localStorage on your local browser</strong>. Ephemeral server-side
              processing caches expire automatically within two (2) hours.
            </p>
            <p>
              <strong>Registered Account Holders:</strong> Divination journals and account metadata are securely persisted
              on Cloudflare D1 distributed edge database instances with encryption at rest and in transit (TLS 1.3). You
              retain continuous, unilateral authority to export or irrevocably erase your stored records at any time.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-gold-ink font-serif"><ThaiPhrases>
            4. Your Legal Rights (PDPA, GDPR &amp; CCPA/CPRA)
          </ThaiPhrases></h2>
          <ul className="space-y-2 text-sm text-ink list-disc list-inside leading-relaxed">
            <li>
              <strong>Right to Erasure / &quot;Right to be Forgotten&quot;</strong> — Delete your complete reading history,
              reflections, and registered account permanently via the self-service controls below.
            </li>
            <li>
              <strong>Right to Data Portability</strong> — Instantly download an exhaustive, machine-readable JSON copy
              of your entire divination history and personal journal.
            </li>
            <li>
              <strong>Right to Withdraw Consent</strong> — Revoke consent for email digests or communications at any
              time through account preferences or direct unsubscribe links.
            </li>
            <li>
              <strong>Right of Access &amp; Rectification</strong> — Review, audit, and amend your personal reflection
              records and journal entries whenever desired.
            </li>
            <li>
              <strong>Non-Discrimination (CCPA/CPRA)</strong> — We will never deny services, degrade reading quality,
              or impose differing fees for exercising any of your statutory privacy rights.
            </li>
          </ul>
        </section>

        {/* Section 5: AI Disclosure */}
        <section className="altar-card-porcelain !rounded-xl space-y-3 p-5">
          <h2 className="text-lg font-bold text-gold-ink font-serif"><ThaiPhrases>
            5. Algorithmic Transparency &amp; AI Persona Disclosures
          </ThaiPhrases></h2>
          <div className="text-sm text-ink leading-relaxed space-y-2">
            <p>
              All divination interpretations in this sanctuary are <strong>generated by Artificial Intelligence</strong>{" "}
              orchestrated with provably-fair, mathematically verifiable card randomization (SHA-256 cryptographic proof).
            </p>
            <p>
              The &quot;Oracle&quot; and &quot;Tarot Readers&quot; across this platform are{" "}
              <strong>curated AI personas</strong> designed to facilitate mindful introspection, philosophical
              perspective, and contemplative guidance. They do not constitute human clairvoyants or accredited counselors.
            </p>
            <p>
              <strong>Zero Fabricated Cards Policy:</strong> Every reading operates strictly upon the authentic 78-card
              1909 Rider-Waite tarot deck. The system programmatically forbids hallucinated or fabricated cards.
            </p>
          </div>
        </section>

        {/* Section 6: Safety Guardrails */}
        <section className="altar-card-porcelain !rounded-xl space-y-3 p-5">
          <h2 className="text-lg font-bold text-err font-serif"><ThaiPhrases>
            6. User Safety Guardrails &amp; Health Disclaimers
          </ThaiPhrases></h2>
          <div className="text-sm text-err leading-relaxed space-y-2">
            <p>Our infrastructure enforces automated, continuous safety filters:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>
                <strong>Mental Health Crisis Detection:</strong> Automated intervention prompts immediately direct users
                in distress to certified crisis resources:
                <ul className="pl-5 space-y-1 list-disc list-inside text-xs">
                  <li>Thailand Department of Mental Health Hotline: <strong>1323</strong> (24/7 Free)</li>
                  <li>National Emergency Medical Service (Thailand): <strong>1669</strong></li>
                  <li>US &amp; Canada Suicide &amp; Crisis Lifeline: <strong>988</strong></li>
                  <li>UK &amp; Europe Emergency &amp; Crisis Support: <strong>111 / 112 / 999</strong></li>
                </ul>
              </li>
              <li>
                <strong>Medical &amp; Pregnancy Prohibition:</strong> The AI is strictly barred from offering medical
                diagnoses, health prognoses, pregnancy confirmations, or psychiatric evaluations.
              </li>
              <li>
                <strong>Legal Advice Prohibition:</strong> The AI is strictly barred from predicting court rulings or
                offering legal advice.
              </li>
              <li>
                <strong>Financial &amp; Investment Prohibition:</strong> The AI is strictly barred from providing
                stock, cryptocurrency, or speculative investment recommendations.
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7: Export & Delete Data */}
        <section className="pt-4 border-t border-line/40 space-y-4">
          <h2 className="text-lg font-bold text-gold-ink font-serif"><ThaiPhrases>7. Manage Your Personal Data</ThaiPhrases></h2>
          <p className="text-xs text-muted">
            You can download a complete JSON archive of your personal journal or permanently delete all local and cloud
            records with immediate effect.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/api/account/export"
              download
              className="glass-chip px-5 py-2.5 text-ink text-xs font-bold hover:bg-canvas transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Download My Data (Export JSON)</span>
            </a>
            {deleteButton}
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center pt-6">
          <a
            href="/en"
            className="btn-gold-glass inline-flex items-center gap-2 px-6 py-3 font-bold text-sm"
          >
            &larr; Return to Tarot Sanctuary
          </a>
        </div>
      </div>
    </main>
  );
}
