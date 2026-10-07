import type { Metadata } from "next";
import type { ReactNode } from "react";

import { buildAlternates, DEFAULT_SUPPORT_EMAIL, SITE_ORIGIN, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { buildBreadcrumbJsonLd, homeCrumb } from "@/app/_shared/seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { getCreditPackages } from "@/lib/entitlement/packages";
import { CHEAPEST_PACKAGE_THB, DAILY_LIMIT, READINGS_EN } from "@/lib/entitlement/copy";
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

/** ตารางเทียบสิทธิ์ — แถว: สิ่งที่ได้ · คอลัมน์: สมาชิกฟรี / แพ็กเติมรอบ (true = มี · false = ไม่มี · ข้อความ = มีแบบมีเงื่อนไข) */
type Cell = boolean | string;
function compareRows(locale: Locale): Array<{ label: string; free: Cell; paid: Cell }> {
  if (locale === "en") {
    return [
      { label: "Standard 1–4 card spreads", free: `${DAILY_LIMIT} a day`, paid: true },
      { label: "Big 5–12 card spreads (Celtic Cross and more)", free: false, paid: true },
      { label: "Master readers", free: false, paid: true },
      { label: "Follow-up questions", free: "2 per reading", paid: "Unlimited" },
      { label: "Reading history on every device", free: true, paid: true },
      { label: "78-card meanings and articles", free: true, paid: true },
      { label: "Expiry", free: "Resets at midnight", paid: "Never expires" },
    ];
  }
  return [
    { label: "ผังมาตรฐาน 1–4 ใบ", free: `วันละ ${DAILY_LIMIT} ครั้ง`, paid: true },
    { label: "ผังใหญ่ 5–12 ใบ (เซลติกครอส ฯลฯ)", free: false, paid: true },
    { label: "แม่หมอพิเศษ 2 ท่าน", free: false, paid: true },
    { label: "ถามแม่หมอต่อหลังเปิดไพ่", free: "2 คำถามต่อรอบ", paid: "ไม่จำกัด" },
    { label: "เก็บประวัติคำทำนายข้ามเครื่อง", free: true, paid: true },
    { label: "ความหมายไพ่ 78 ใบและบทความ", free: true, paid: true },
    { label: "อายุของสิทธิ์", free: "รีเซ็ตทุกเที่ยงคืน", paid: "ไม่มีวันหมดอายุ" },
  ];
}

function CompareCell({ value, isEn }: { value: Cell; isEn: boolean }) {
  if (value === true) {
    return (
      <>
        <CheckMarkIcon className="mx-auto h-5 w-5 text-gold-ink" />
        <span className="sr-only">{isEn ? "Included" : "มี"}</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <DashMarkIcon className="mx-auto h-5 w-5 text-muted" />
        <span className="sr-only">{isEn ? "Not included" : "ไม่มี"}</span>
      </>
    );
  }
  return <span className="font-serif-th text-xs text-ink-deep sm:text-sm">{value}</span>;
}

export function PricingBody({ locale, plans }: { locale: Locale; plans: ReactNode }) {
  const isEn = locale === "en";
  const c = COPY[locale];
  const faqs = faqItems(locale);
  const rows = compareRows(locale);
  const packages = getCreditPackages(isEn);

  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd(locale, [homeCrumb(locale), { name: c.crumb, path: PATH }]);
  const jsonLdFaq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale,
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  /*
   * Search Console (2026-10-06) แจ้งว่าข้อมูลผู้ขายขาด image (ร้ายแรง) · description · shippingDetails
   * - image ใช้ภาพสินค้าจัตุรัสชุดเดียวกับหน้าจ่ายเงิน Stripe (`public/checkout/credits.jpg` · ดู `checkoutArtUrl`
   *   — ไม่ import ตรงเพราะไฟล์นั้นดึง node:crypto เข้ามา)
   * - shippingDetails = ของดิจิทัล ได้รอบทันทีหลังจ่าย ไม่มีค่าส่ง (ข้อเท็จจริง ไม่ใช่นโยบายใหม่)
   * ⚠️ ไม่ใส่ hasMerchantReturnPolicy จนกว่าเจ้าของจะประกาศนโยบายคืนเงิน (ดูหัวไฟล์)
   * ⚠️ ห้ามใส่ review / aggregateRating ที่ไม่ได้มาจากรีวิวจริง — Google ลงโทษรีวิวที่เว็บเขียนให้ตัวเอง
   */
  const shippingDetails = {
    "@type": "OfferShippingDetails",
    shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "THB" },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "TH" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 0, unitCode: "DAY" },
    },
  };
  const jsonLdOffers = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: isEn ? "SeerTarot reading top-ups" : "แพ็กเติมรอบดูดวง SeerTarot",
    description: c.description,
    image: `${SITE_ORIGIN}/checkout/credits.jpg`,
    url: localizedUrl(PATH, locale),
    brand: { "@type": "Brand", name: "SeerTarot" },
    offers: packages.map((p) => ({
      "@type": "Offer",
      name: p.name,
      price: p.priceThb,
      priceCurrency: "THB",
      availability: "https://schema.org/InStock",
      url: `${SITE_ORIGIN}${isEn ? "/en" : ""}${PATH}`,
      shippingDetails,
    })),
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdBreadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdFaq) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLdOffers) }} />

      <div className="mx-auto max-w-6xl space-y-16 px-4 pt-12 sm:px-6 sm:pt-16">
        {/* ── หัวหน้า — ไม่มีกล่อง ตัวอักษรสีหมึกเท่านั้น (สีทองบนพื้นไล่สีคอนทราสต์ไม่ผ่าน · HANDOFF_GLASS_HOME 2.4) ── */}
        <header className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="font-serif-th text-sm font-semibold text-muted">{isEn ? "Pricing" : "ราคาและแพ็กเกจ"}</p>
          <h1 className="font-serif-th text-3xl font-bold leading-snug text-ink-deep sm:text-5xl">
            <ThaiPhrases>{isEn ? "Read free every day. Top up when you want more." : "ดูดวงฟรีทุกวัน เติมรอบเมื่ออยากถามเพิ่ม"}</ThaiPhrases>
          </h1>
          <p className="mx-auto max-w-2xl font-serif-th text-base leading-relaxed text-muted sm:text-lg">
            <ThaiPhrases>
              {isEn
                ? `Pay once — no subscription, and purchased readings never expire. Packages from ${CHEAPEST_PACKAGE_THB} THB.`
                : `จ่ายครั้งเดียว ไม่มีรายเดือน รอบที่เติมไม่มีวันหมดอายุ · แพ็กเริ่มต้น ${CHEAPEST_PACKAGE_THB} บาท`}
            </ThaiPhrases>
          </p>
        </header>

        {/* ── แพ็ก (island) ───────────────────────────────────────── */}
        {/* แถบสีสลับแบบหน้าแรก (`page-band`): แพ็ก (อ่อน) · ตารางเทียบ (ใส) · คำถาม (อ่อน) · ปิดท้าย (ใส) */}
        <section aria-labelledby="pricing-packages" className="page-band page-band-tint">
          <h2 id="pricing-packages" className="sr-only">
            {isEn ? "Plans and packages" : "แพ็กเกจทั้งหมด"}
          </h2>
          {plans}
        </section>

        {/* ── ตารางเทียบสิทธิ์ ────────────────────────────────────── */}
        <section aria-labelledby="pricing-compare" className="page-band mx-auto max-w-4xl space-y-6">
          <h2 id="pricing-compare" className="text-center font-serif-th text-2xl font-bold text-ink-deep sm:text-3xl">
            <ThaiPhrases>{isEn ? "Compare plans" : "เทียบสิทธิ์ทั้งหมด"}</ThaiPhrases>
          </h2>
          <div className="altar-panel">
            <table className="w-full table-fixed border-collapse text-left">
              <caption className="sr-only">{isEn ? "Free membership compared with top-up packages" : "เทียบสมาชิกฟรีกับแพ็กเติมรอบ"}</caption>
              <thead>
                <tr className="border-b border-line-warm/70">
                  <th scope="col" className="px-4 py-4 font-serif-th text-sm font-semibold text-muted sm:px-5">
                    {isEn ? "Feature" : "สิ่งที่ได้"}
                  </th>
                  <th scope="col" className="w-[92px] px-2 py-4 text-center font-serif-th text-sm font-bold text-ink-deep sm:w-44 sm:px-3">
                    {isEn ? "Free member" : "สมาชิกฟรี"}
                  </th>
                  <th scope="col" className="w-[92px] px-2 py-4 text-center font-serif-th text-sm font-bold text-gold-ink sm:w-44 sm:px-3">
                    {isEn ? "Top-up" : "แพ็กเติมรอบ"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label} className="border-b border-line-warm/40 last:border-0">
                    <th scope="row" className="px-4 py-3.5 font-serif-th text-sm font-normal text-ink-deep sm:px-5">
                      {r.label}
                    </th>
                    <td className="px-2 py-3.5 text-center sm:px-3">
                      <CompareCell value={r.free} isEn={isEn} />
                    </td>
                    <td className="px-2 py-3.5 text-center sm:px-3">
                      <CompareCell value={r.paid} isEn={isEn} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── คำถามที่พบบ่อย ──────────────────────────────────────── */}
        <section aria-labelledby="pricing-faq" className="page-band page-band-tint mx-auto max-w-3xl space-y-6">
          <h2 id="pricing-faq" className="text-center font-serif-th text-2xl font-bold text-ink-deep sm:text-3xl">
            <ThaiPhrases>{isEn ? "Frequently asked questions" : "คำถามที่พบบ่อย"}</ThaiPhrases>
          </h2>
          <div className="altar-panel divide-y divide-line-warm/50 px-5 sm:px-6">
            {faqs.map((f) => (
              <details key={f.q} className="group py-4">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 font-serif-th text-base font-semibold text-ink-deep">
                  {f.q}
                  <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 fill-none stroke-current text-muted transition-transform duration-150 group-open:rotate-180"
                    strokeWidth={2}
                  >
                    <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="pt-2 font-serif-th text-sm leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── ปิดท้าย ─────────────────────────────────────────────── */}
        <section className="page-band mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="font-serif-th text-xl font-bold text-ink-deep sm:text-2xl">
            <ThaiPhrases>{isEn ? "Not sure yet? Start free." : "ยังไม่แน่ใจ? เริ่มดูดวงฟรีก่อน"}</ThaiPhrases>
          </h2>
          <p className="font-serif-th text-sm text-muted">
            {isEn ? "Draw your first reading today — no card needed." : "เปิดไพ่ใบแรกได้วันนี้ ไม่ต้องใช้บัตร"}
          </p>
          <a
            href={isEn ? "/en" : "/"}
            className="btn-glass-primary inline-flex min-h-[48px] items-center justify-center px-8 font-serif-th text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-ink focus-visible:ring-offset-2"
          >
            {isEn ? "Start a free reading" : "เริ่มดูดวงฟรี"}
          </a>
        </section>
      </div>
    </main>
  );
}
