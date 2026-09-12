import type { Metadata } from "next";
import { getArticleSummaries } from "@/data/articles";
import { BlogIndexClient } from "../../(th)/blog/BlogIndexClient";
import { buildAlternates, localizedUrl, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import type { Locale } from "@/lib/i18n/types";
import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

const PATH = "/blog";

const COPY = {
  th: {
    title: "คัมภีร์บทความและคู่มือดูดวงไพ่ยิปซี ทาโรต์ 1909",
    description:
      "รวมบทความดูดวงไพ่ยิปซี ความรัก การงาน การเงิน ผังพยากรณ์ 25 แบบ และความหมายไพ่ 78 ใบ โดยแม่หมอแห่งวิหาร SeerTarot",
    keywords: [
      "ดูดวงไพ่ยิปซี",
      "บทความไพ่ทาโรต์",
      "ดูดวงความรัก",
      "ความหมายไพ่ยิปซี 78 ใบ",
      "ผังเซลติกครอส",
      "วิธีดูดวงด้วยตัวเอง",
    ],
    blogName: "คัมภีร์บทความ & คู่มือดูดวงไพ่ยิปซี ทาโรต์ 1909 | SeerTarot Blog",
    blogDescription: "รวมบทความดูดวงไพ่ยิปซี ความรัก การงาน การเงิน ผังพยากรณ์ 25 แบบ และความหมายไพ่ 78 ใบ",
    crumb: "คัมภีร์บทความ",
  },
  en: {
    title: "Tarot Wisdom Codex: Guides, Meanings & Spreads",
    description:
      "Comprehensive tarot guides, 78 card meanings, love and career advice, and 25 classical spreads from the 1909 Rider-Waite-Smith tradition.",
    keywords: [
      "tarot articles",
      "tarot guide",
      "how to read tarot",
      "tarot card meanings",
      "celtic cross spread",
      "love tarot reading",
    ],
    blogName: "Tarot Wisdom Codex & Editorial Guides | SeerTarot Blog",
    blogDescription:
      "In-depth tarot guides, archetypal card interpretations, love and career advice, and 25 classical spreads.",
    crumb: "Wisdom Codex",
  },
} as const;

export function buildBlogIndexMetadata(locale: Locale): Metadata {
  const copy = COPY[locale];
  const isEnglish = locale === "en";
  const ogTitle = isEnglish
    ? "Tarot Wisdom Codex & Editorial Guides"
    : "คัมภีร์บทความและคู่มือดูดวงไพ่ยิปซี 1909";
  const ogDesc = isEnglish
    ? "Explore depth psychology, archetypal symbolism, and master guides for love, career, and 25 spreads."
    : "รวมบทความเจาะลึกศาสตร์ไพ่ทาโรต์ ความรัก การงาน และจิตวิทยาพยากรณ์";

  const ogImages = buildPageOgImage({
    title: ogTitle,
    eyebrow: isEnglish ? "TAROT CODEX & GUIDES" : "สารานุกรมและบทความ",
    cardImage: "major-09.jpg",
    alt: copy.title,
  });

  return {
    title: copy.title,
    description: copy.description,
    keywords: [...copy.keywords],
    alternates: buildAlternates(PATH, { locale, englishTwin: true }),
    openGraph: {
      title: ogTitle,
      description: ogDesc,
      url: localizedUrl(PATH, locale),
      siteName: "SeerTarot",
      type: "website",
      locale: isEnglish ? "en_US" : "th_TH",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDesc,
      images: [ogImages[0].url],
    },
  };
}

export function BlogIndexBody({ locale }: { locale: Locale }) {
  const articles = getArticleSummaries();
  const copy = COPY[locale];
  const isEnglish = locale === "en";

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: copy.blogName,
    description: copy.blogDescription,
    url: localizedUrl(PATH, locale),
    inLanguage: locale,
    publisher: {
      "@type": "Organization",
      name: "SeerTarot",
      url: SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/icons/icon-512x512.png`,
      },
    },
    blogPost: articles.map((article) => ({
      "@type": "BlogPosting",
      headline: isEnglish && article.titleEn ? article.titleEn : article.title,
      description: isEnglish && article.descriptionEn ? article.descriptionEn : article.description,
      url: localizedUrl(`/blog/${article.slug}`, locale),
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: {
        "@type": "Organization",
        name: "SeerTarot Sanctuary",
      },
    })),
  };

  const breadcrumbsJsonLd = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: copy.crumb, path: PATH },
  ]);

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans selection:bg-[#A58A5C]/20 selection:text-[#29261F]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        <BlogIndexClient articles={articles} />
      </div>
    </main>
  );
}
