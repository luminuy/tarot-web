import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";

import {
  SPREAD_TOPICS,
  getAllTopicSlugs,
  getSpreadTopic,
  getSpreadsForTopic,
} from "@/data/spread-topics";
import { TopicSpreadList } from "@/components/spread/TopicSpreadList";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import type { Locale } from "@/lib/i18n/types";
import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

export interface SpreadTopicPageProps {
  params: Promise<{ category: string }>;
}

export function spreadTopicStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ category: slug }));
}

export async function buildSpreadTopicMetadata(
  { params }: SpreadTopicPageProps,
  locale: Locale,
): Promise<Metadata> {
  const { category } = await params;
  const topic = getSpreadTopic(category);
  if (!topic) {
    return {
      title: locale === "en" ? "Spread Topic Not Found" : "ไม่พบหมวดหมู่ผังพยากรณ์",
      robots: { index: false, follow: true },
    };
  }

  const isEnglish = locale === "en";
  const path = `/spreads/topic/${topic.slug}`;
  const title = isEnglish && topic.seoTitleEn ? topic.seoTitleEn : topic.seoTitle;
  const description = isEnglish && topic.metaDescriptionEn ? topic.metaDescriptionEn : topic.metaDescription;

  const topicTitle = isEnglish ? (topic.titleEn || topic.titleTh) : topic.titleTh;
  const ogImages = buildPageOgImage({
    title: topicTitle,
    eyebrow: isEnglish ? "LIFE THEME SPREADS" : "ผังพยากรณ์ตามหมวดชีวิต",
    cardImage: getCategoryCardImage(topic.slug),
    alt: title,
  });

  return {
    title,
    description,
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "website",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImages[0].url],
    },
  };
}

export async function SpreadTopicBody({
  params,
  locale,
}: SpreadTopicPageProps & { locale: Locale }) {
  const { category } = await params;
  const topic = getSpreadTopic(category);
  if (!topic) notFound();

  const isEnglish = locale === "en";
  const spreads = getSpreadsForTopic(topic);
  const allTopics = Object.values(SPREAD_TOPICS);
  const currentPath = `/spreads/topic/${topic.slug}`;
  const currentUrl = localizedUrl(currentPath, locale);

  const topicName = isEnglish && topic.nameEn ? topic.nameEn : topic.nameTh;
  const topicHeading = isEnglish && topic.headingEn ? topic.headingEn : topic.heading;
  const topicTagline = isEnglish && topic.taglineEn ? topic.taglineEn : topic.tagline;
  const editorialIntro = isEnglish && topic.editorialIntroEn ? topic.editorialIntroEn : topic.editorialIntro;
  const faqs = isEnglish && topic.faqsEn ? topic.faqsEn : topic.faqs;
  const metaDesc = isEnglish && topic.metaDescriptionEn ? topic.metaDescriptionEn : topic.metaDescription;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEnglish && topic.titleEn ? topic.titleEn : topic.titleTh,
    description: metaDesc,
    url: currentUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: spreads.length,
      itemListElement: spreads.map((spread, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: isEnglish ? spread.nameEn : spread.nameTh,
        description: isEnglish ? spread.descriptionEn : spread.description,
        url: localizedUrl(`/spreads/${spread.id}`, locale),
      })),
    },
  };

  const breadcrumbsJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "25 Tarot Spreads" : "ผังพยากรณ์ 25 แบบ", path: "/spreads" },
    { name: topicName, path: currentPath },
  ]);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-canvas text-ink p-4 sm:p-8 font-sans relative overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-6xl mx-auto space-y-10 py-6">
        {/* Breadcrumb Bar */}
        <nav aria-label="Breadcrumb" className="text-xs font-serif-th text-[#7A6F5D]">
          <ol className="flex items-center gap-2 flex-wrap">
            <li>
              <Link href="/" className="hover:text-ink transition-colors">
                {isEnglish ? "Home" : "หน้าแรก"}
              </Link>
            </li>
            <li aria-hidden="true" className="text-line">/</li>
            <li>
              <Link href="/spreads" className="hover:text-ink transition-colors">
                {isEnglish ? "25 Tarot Spreads" : "ผังพยากรณ์ 25 แบบ"}
              </Link>
            </li>
            <li aria-hidden="true" className="text-line">/</li>
            <li className="font-semibold text-ink" aria-current="page">
              {topicName}
            </li>
          </ol>
        </nav>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-line/60">
          <Link
            href="/spreads"
            className="px-4 py-1.5 rounded-full text-xs font-serif-th font-semibold whitespace-nowrap bg-inset text-[#5E5240] hover:bg-[#DDD8CD] transition-colors"
          >
            {isEnglish ? "All Spreads (25)" : "ผังทั้งหมด (25 ผัง)"}
          </Link>
          {allTopics.map((t) => {
            const isActive = t.slug === topic.slug;
            const tName = isEnglish && t.nameEn ? t.nameEn : t.nameTh;
            return (
              <Link
                key={t.slug}
                href={`/spreads/topic/${t.slug}`}
                className={`px-4 py-1.5 rounded-full text-xs font-serif-th font-semibold whitespace-nowrap transition ${
                  isActive
                    ? "bg-ink text-surface-warm shadow-xs"
                    : "bg-surface border border-line text-[#4A4338] hover:border-gold"
                }`}
              >
                {tName} ({t.spreadIds.length})
              </Link>
            );
          })}
        </div>

        {/* Hero Header */}
        <header className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-surface text-xs text-gold-ink font-serif-th font-semibold">
            {isEnglish
              ? `Topic Category · ${spreads.length} Dedicated Spreads`
              : `หมวดหมู่ผังพยากรณ์ · ${spreads.length} ผังเฉพาะทาง`}
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif-th text-ink tracking-tight leading-tight">
            {topicHeading}
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed font-serif-th">
            {topicTagline}
          </p>
        </header>

        {/* Editorial Guide Prose */}
        <section className="bg-surface rounded-2xl border border-line p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold font-serif-th text-ink border-b border-line-soft pb-3">
            {isEnglish
              ? `Guide to Reading ${topicName} Tarot Spreads`
              : `คู่มือการอ่านไพ่ทาโรต์หมวด${topic.nameTh}`}
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-[#4A4338] font-serif-th leading-relaxed">
            {editorialIntro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* Spreads Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif-th text-ink">
              {isEnglish
                ? "Select a Spread for Your Question"
                : "เลือกผังพยากรณ์ที่ตรงกับคำถามของคุณ"}
            </h2>
            <span className="text-xs font-serif-th text-[#7A6F5D]">
              {spreads.length} {isEnglish ? "spreads" : "รูปแบบ"}
            </span>
          </div>
          <TopicSpreadList spreads={spreads} />
        </section>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="bg-surface rounded-2xl border border-line p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-serif-th text-ink">
                {isEnglish
                  ? `Frequently Asked Questions About ${topicName}`
                  : `คำถามพบบ่อยเกี่ยวกับการดูดวงด้าน${topic.nameTh}`}
              </h2>
              <p className="text-xs text-[#7A6F5D] font-serif-th">
                {isEnglish
                  ? "Principles and practical advice for clear, resonant readings"
                  : "หลักการและข้อแนะนำเพื่อการเปิดไพ่ที่ให้คำตอบชัดเจนที่สุด"}
              </p>
            </div>
            <div className="divide-y divide-line-soft space-y-4 pt-2">
              {faqs.map((faq, index) => (
                <div key={index} className="pt-4 first:pt-0 space-y-1.5">
                  <h3 className="font-serif-th text-sm sm:text-base font-bold text-ink">
                    {faq.question}
                  </h3>
                  <p className="font-serif-th text-xs sm:text-sm text-[#5E5240] leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cross-Topic Internal Links Footer */}
        <section className="pt-8 border-t border-line/80 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-gold-ink font-semibold">
            {isEnglish ? "Explore Other Categories" : "สำรวจหมวดหมู่อื่นๆ ในวิหารพยากรณ์"}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {allTopics.map((t) => {
              const tName = isEnglish && t.nameEn ? t.nameEn : t.nameTh;
              return (
                <Link
                  key={t.slug}
                  href={`/spreads/topic/${t.slug}`}
                  className="p-3 rounded-xl border border-line bg-surface hover:border-gold text-center transition group"
                >
                  <div className="text-xs font-serif-th font-bold text-ink group-hover:text-gold-ink">
                    {tName}
                  </div>
                  <div className="text-[11px] text-[#7A6F5D] font-mono mt-0.5">
                    {t.spreadIds.length} {isEnglish ? "spreads" : "ผัง"}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-serif-th text-[#7A6F5D] pt-4">
            <Link href="/cards" className="hover:text-ink underline underline-offset-4">
              {isEnglish ? "78-Card Encyclopedia" : "สารานุกรมไพ่ 78 ใบ"}
            </Link>
            <span className="text-line">·</span>
            <Link href="/blog" className="hover:text-ink underline underline-offset-4">
              {isEnglish ? "Tarot Wisdom Codex" : "คัมภีร์บทความดูดวง"}
            </Link>
            <span className="text-line">·</span>
            <Link href="/" className="hover:text-ink underline underline-offset-4">
              {isEnglish ? "Return to Sanctuary" : "กลับสู่วิหารหลัก"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
