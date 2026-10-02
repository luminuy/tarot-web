import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { getCreditPackages } from "@/lib/entitlement/packages";
import { getAccessPlans, CHEAPEST_PACKAGE_THB, DAILY_LIMIT, READINGS_EN } from "@/lib/entitlement/copy";
import { CheckMarkIcon, DashMarkIcon } from "@/components/entitlement/EntitlementIcons";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import type { Locale } from "@/lib/i18n/types";

/**
 * 💳 หน้า "ราคาและแพ็กเกจ" (`/pricing` · `/en/pricing`)
 * ===========================================================================
 * เจ้าของขอให้เรื่องเงิน "หาง่าย" — เดิมราคาอยู่ในหน้าต่างลอยที่เปิดได้จากหน้าแรกเท่านั้น
 * คนที่อยากรู้ว่า "ฟรีได้แค่ไหน / จ่ายเท่าไร / จ่ายยังไง" ไม่มีหน้าให้เปิดอ่านหรือส่งลิงก์ต่อ
 *
 * HTML ทั้งหน้าเป็นของ Astro (ไม่ hydrate) ยกเว้นการ์ดแพ็กที่มีปุ่มซื้อ ซึ่งส่งเข้ามาทาง slot `plans`
 *
 * ⚠️ ตัวเลขทุกตัว (ราคา · จำนวนรอบ · โควตาฟรี) ดึงจาก `packages.ts` / `limits.ts` เท่านั้น
 *    ห้ามพิมพ์ตัวเลขลงข้อความเอง — เปลี่ยนราคาแล้วหน้านี้จะโกหกลูกค้า
 * ⚠️ ห้ามเขียนนโยบายคืนเงินที่เจ้าของยังไม่ได้ประกาศ — FAQ บอกได้แค่ช่องทางติดต่อ
 */

const PATH = "/pricing";

/* ⚠️ ห้ามใส่คำว่า "SeerTarot" ใน TITLE — layout ต่อท้าย " · SeerTarot" ให้เองทุกหน้า */
const COPY = {
  th: {
    title: "ราคาและแพ็กเกจเติมรอบดูดวง — ดูฟรีทุกวัน จ่ายครั้งเดียว",
    description: `ดูดวงไพ่ทาโรต์ฟรีวันละ ${DAILY_LIMIT} ครั้ง อยากถามเพิ่มเติมรอบเริ่ม ${CHEAPEST_PACKAGE_THB} บาท จ่ายครั้งเดียว ไม่มีรายเดือน รอบไม่หมดอายุ ชำระด้วยบัตรหรือ PromptPay ผ่าน Stripe`,
    ogTitle: "ราคาและแพ็กเกจ",
    ogEyebrow: "ดูฟรีทุกวัน · จ่ายครั้งเดียว",
    crumb: "ราคาและแพ็กเกจ",
  },
  en: {
    title: "Pricing — Free Daily Tarot, Pay Once Top-Ups",
    description: `Read tarot free ${DAILY_LIMIT === 1 ? "once" : `${DAILY_LIMIT} times`} a day. Top up from ${CHEAPEST_PACKAGE_THB} THB when you want more — pay once, no subscription, readings never expire. Card or PromptPay via Stripe.`,
    ogTitle: "Pricing",
    ogEyebrow: "Free daily · Pay once",
    crumb: "Pricing",
  },
} as const;

function buildMetadata(locale: Locale): Metadata {
  const c = COPY[locale];
  const images = buildPageOgImage({ title: c.ogTitle, eyebrow: c.ogEyebrow, cardImage: "pentacles-01.jpg", alt: c.ogTitle });
  return {
    title: c.title,
    description: c.description,
    alternates: buildAlternates(PATH, { englishTwin: true, ...(locale === "en" ? { locale: "en" as const } : {}) }),
    openGraph: {
      title: `${c.title} · SeerTarot`,
      description: c.description,
      url: localizedUrl(PATH, locale),
      siteName: "SeerTarot",
      type: "website",
      locale: locale === "en" ? "en_US" : "th_TH",
      images,
    },
    twitter: { card: "summary_large_image", title: `${c.title} · SeerTarot`, description: c.description, images: [images[0].url] },
  };
}

export const pricingMetadataTh = buildMetadata("th");
export const pricingMetadataEn = buildMetadata("en");

function faqItems(locale: Locale): Array<{ q: string; a: string }> {
  if (locale === "en") {
    return [
      {
        q: "Can I read tarot for free?",
        a: `Yes. Members get ${DAILY_LIMIT} free ${READINGS_EN} every day with the standard 1–4 card spreads, reset at midnight Thailand time. Signing up is free with email, Google or LINE.`,
      },
      {
        q: "Is this a subscription? Will I be charged again?",
        a: "No. Each package is a one-time payment. Nothing renews and nothing is charged automatically.",
      },
      {
        q: "Do purchased readings expire?",
        a: "Never. Your free daily reading is used first; purchased readings are only used after that, whenever you like.",
      },
      {
        q: "How can I pay?",
        a: "Credit or debit card (Visa, Mastercard) and PromptPay, on Stripe's secure checkout page.",
      },
      {
        q: "Is it safe to pay?",
        a: "Payment happens on Stripe's own page. SeerTarot never sees or stores your card number.",
      },
      {
        q: "I paid but my readings did not show up. What now?",
        a: `Readings normally arrive right after payment. If they have not appeared within a few minutes, email ${DEFAULT_SUPPORT_EMAIL} with your account email and the time you paid.`,
      },
    ];
  }
  return [
    {
      q: "ดูดวงฟรีได้ไหม",
      a: `ได้ สมาชิกเปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้งด้วยผังมาตรฐาน 1–4 ใบ รีเซ็ตทุกเที่ยงคืนเวลาไทย สมัครฟรีด้วยอีเมล Google หรือ LINE`,
    },
    {
      q: "เป็นรายเดือนไหม จะโดนตัดเงินอัตโนมัติหรือเปล่า",
      a: "ไม่ใช่รายเดือน แต่ละแพ็กจ่ายครั้งเดียวจบ ไม่มีการต่ออายุและไม่ตัดเงินซ้ำ",
    },
    {
      q: "รอบที่เติมมีวันหมดอายุไหม",
      a: "ไม่มีวันหมดอายุ ระบบใช้สิทธิ์ฟรีของวันนั้นก่อน แล้วจึงหักรอบที่เติมไว้ ใช้เมื่อไหร่ก็ได้",
    },
    {
      q: "จ่ายเงินช่องทางไหนได้บ้าง",
      a: "บัตรเครดิตหรือเดบิต (Visa, Mastercard) และ PromptPay ผ่านหน้าชำระเงินของ Stripe",
    },
    {
      q: "จ่ายเงินปลอดภัยไหม",
      a: "การชำระเงินทำบนหน้าของ Stripe โดยตรง SeerTarot ไม่เห็นและไม่เก็บเลขบัตรของคุณ",
    },
    {
      q: "จ่ายแล้วแต่รอบไม่เข้า ต้องทำอย่างไร",
      a: `ปกติรอบจะเข้าบัญชีทันทีหลังจ่าย ถ้าผ่านไปไม่กี่นาทีแล้วยังไม่เข้า ส่งอีเมลมาที่ ${DEFAULT_SUPPORT_EMAIL} พร้อมอีเมลบัญชีและเวลาที่จ่าย`,
    },
  ];
}

const STEPS = {
  th: [
    { title: "เลือกแพ็ก", body: "เลือกจำนวนรอบที่ต้องการ แล้วกดซื้อ" },
    { title: "จ่ายที่หน้า Stripe", body: "จ่ายด้วยบัตรหรือสแกน PromptPay" },
    { title: "รอบเข้าบัญชีทันที", body: "กลับมาที่เว็บแล้วเปิดไพ่ต่อได้เลย" },
  ],
  en: [
    { title: "Pick a package", body: "Choose how many readings you want and tap buy" },
    { title: "Pay on Stripe", body: "Use a card or scan PromptPay" },
    { title: "Readings land instantly", body: "Come back and keep reading right away" },
  ],
} as const;

export function PricingBody({ locale, plans }: { locale: Locale; plans: ReactNode }) {
  const isEn = locale === "en";
  const c = COPY[locale];
  const faqs = faqItems(locale);
  const accessPlans = getAccessPlans(isEn).filter((p) => p.id !== "guest");
  const packages = getCreditPackages(isEn);

  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd(locale, [homeCrumb(locale), { name: c.crumb, path: PATH }]);
  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const jsonLdOffers = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: isEn ? "SeerTarot reading top-ups" : "แพ็กเติมรอบดูดวง SeerTarot",
    url: localizedUrl(PATH, locale),
    brand: { "@type": "Brand", name: "SeerTarot" },
    offers: packages.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.priceThb,
      priceCurrency: "THB",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}${isEn ? "/en" : ""}${PATH}`,
    })),
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdBreadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdOffers) }} />

      <div className="mx-auto max-w-5xl space-y-14 px-4 py-12 sm:px-6 sm:py-16">
        {/* ── หัวหน้า ─────────────────────────────────────────────── */}
        <header className="altar-panel mx-auto max-w-3xl space-y-3 px-5 py-7 text-center sm:px-8">
          <p className="font-serif-th text-sm font-semibold text-gold-ink">
            {isEn ? "Pricing" : "ราคาและแพ็กเกจ"}
          </p>
          <h1 className="font-serif-th text-2xl font-bold leading-snug text-ink-deep sm:text-4xl">
            <ThaiPhrases>{isEn ? "Read free every day. Top up only when you want more." : "ดูดวงฟรีทุกวัน เติมรอบเฉพาะตอนอยากถามเพิ่ม"}</ThaiPhrases>
          </h1>
          <p className="mx-auto max-w-2xl font-serif-th text-base leading-relaxed text-muted">
            {isEn
              ? `Members get ${DAILY_LIMIT} free ${READINGS_EN} a day. Packages start at ${CHEAPEST_PACKAGE_THB} THB — pay once, no subscription, and your readings never expire.`
              : `สมาชิกเปิดไพ่ฟรีวันละ ${DAILY_LIMIT} ครั้ง แพ็กเติมรอบเริ่มต้น ${CHEAPEST_PACKAGE_THB} บาท จ่ายครั้งเดียว ไม่มีรายเดือน และรอบที่เติมไม่มีวันหมดอายุ`}
          </p>
        </header>

        {/* ── การ์ดแพ็ก (island) ───────────────────────────────────── */}
        <section aria-labelledby="pricing-packages" className="space-y-6">
          <h2 id="pricing-packages" className="sr-only">
            {isEn ? "Top-up packages" : "แพ็กเติมรอบ"}
          </h2>
          {plans}
        </section>

        {/* ── ฟรีกับเติมรอบต่างกันอย่างไร ─────────────────────────── */}
        <section aria-labelledby="pricing-compare" className="space-y-5">
          <h2 id="pricing-compare" className="text-center font-serif-th text-xl font-bold text-ink-deep sm:text-2xl">
            <ThaiPhrases>{isEn ? "Free membership vs. top-ups" : "สมาชิกฟรีกับรอบที่เติม ต่างกันอย่างไร"}</ThaiPhrases>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {accessPlans.map((plan) => (
              <div key={plan.id} className={`${plan.id === "credits" ? "altar-panel-active" : "altar-panel"} p-5 sm:p-6`}>
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif-th text-base font-bold text-ink-deep"><ThaiPhrases>{plan.name}</ThaiPhrases></h3>
                  <span className="font-serif-th text-lg font-bold text-gold-ink">{plan.price}</span>
                </div>
                <p className="mt-0.5 font-serif-th text-[13px] text-muted">{plan.priceNote}</p>
                <ul className="mt-4 space-y-2 border-t border-line-warm/60 pt-4">
                  {plan.features.map((f) => (
                    <li
                      key={f.label}
                      className={`flex items-start gap-2 font-serif-th text-sm ${f.included ? "text-ink-deep" : "text-muted"}`}
                    >
                      {f.included ? (
                        <CheckMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
                      ) : (
                        <DashMarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                      )}
                      {f.label}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── จ่ายเงินยังไง ───────────────────────────────────────── */}
        <section aria-labelledby="pricing-how" className="space-y-5">
          <h2 id="pricing-how" className="text-center font-serif-th text-xl font-bold text-ink-deep sm:text-2xl">
            <ThaiPhrases>{isEn ? "How paying works" : "ซื้อแพ็กยังไง"}</ThaiPhrases>
          </h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            {STEPS[locale].map((s, i) => (
              <li key={s.title} className="altar-panel flex items-start gap-3 p-4">
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-ink font-serif-th text-sm font-bold text-surface"
                >
                  {i + 1}
                </span>
                <span>
                  <span className="block font-serif-th text-sm font-bold text-ink-deep">{s.title}</span>
                  <span className="block font-serif-th text-[13px] leading-relaxed text-muted">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── คำถามที่พบบ่อย ──────────────────────────────────────── */}
        <section aria-labelledby="pricing-faq" className="mx-auto max-w-3xl space-y-4">
          <h2 id="pricing-faq" className="text-center font-serif-th text-xl font-bold text-ink-deep sm:text-2xl">
            <ThaiPhrases>{isEn ? "Questions about paying" : "คำถามเรื่องการชำระเงิน"}</ThaiPhrases>
          </h2>
          <div className="space-y-2.5">
            {faqs.map((f) => (
              <details key={f.q} className="altar-panel group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-serif-th text-base font-semibold text-ink-deep">
                  {f.q}
                  <span aria-hidden="true" className="shrink-0 text-gold-ink transition-transform duration-150 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="pt-3 font-serif-th text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
