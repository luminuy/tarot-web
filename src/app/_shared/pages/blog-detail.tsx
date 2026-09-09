import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  getAllArticles,
  getArticleBySlug,
  getRelatedArticles,
  ARTICLE_SLUG_ALIASES,
  getArticleTitle,
  getArticleDescription,
} from "@/data/articles";
import { buildAlternates, localizedUrl, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import type { Locale } from "@/lib/i18n/types";
import { ArticleReadingClient } from "../../(th)/blog/[slug]/ArticleReadingClient";
import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

export interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export function blogDetailStaticParams(locale: Locale) {
  const articles = getAllArticles();
  if (locale === "en") {
    // English static params only includes articles that have contentEn
    return articles
      .filter((article) => Boolean(article.contentEn))
      .map((article) => ({ slug: article.slug }));
  }
  const aliasSlugs = Object.keys(ARTICLE_SLUG_ALIASES);
  return [
    ...articles.map((article) => ({ slug: article.slug })),
    ...aliasSlugs.map((slug) => ({ slug })),
  ];
}

export async function buildBlogDetailMetadata(
  { params }: BlogDetailPageProps,
  locale: Locale,
): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: locale === "en" ? "Article Not Found" : "ไม่พบบทความ",
    };
  }

  const isEnglish = locale === "en";
  const path = `/blog/${article.slug}`;
  const title = isEnglish && article.seoTitleEn ? article.seoTitleEn : article.seoTitle;
  const description = isEnglish && article.descriptionEn ? article.descriptionEn : article.description;
  const articleTitle = getArticleTitle(article, locale);
  const articleDesc = getArticleDescription(article, locale);
  const englishTwin = Boolean(article.contentEn);

  const ogImages = buildPageOgImage({
    title: articleTitle,
    eyebrow: isEnglish ? "TAROT WISDOM & GUIDE" : "บทความไพ่ทาโรต์",
    cardImage: getCategoryCardImage(article.category),
    alt: articleTitle,
  });

  return {
    title,
    description,
    keywords: article.keywords,
    alternates: buildAlternates(path, { locale, englishTwin }),
    openGraph: {
      title: articleTitle,
      description: articleDesc,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "article",
      locale: isEnglish ? "en_US" : "th_TH",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: articleTitle,
      description: articleDesc,
      images: [ogImages[0].url],
    },
  };
}

export async function BlogDetailBody({
  params,
  locale,
}: BlogDetailPageProps & { locale: Locale }) {
  const { slug } = await params;
  if (slug in ARTICLE_SLUG_ALIASES) {
    const targetSlug = ARTICLE_SLUG_ALIASES[slug];
    const targetPath = locale === "en" ? `/en/blog/${targetSlug}` : `/blog/${targetSlug}`;
    redirect(targetPath);
  }

  const article = getArticleBySlug(slug);
  if (!article) {
    notFound();
  }

  if (locale === "en" && !article.contentEn) {
    notFound();
  }

  const isEnglish = locale === "en";
  const related = getRelatedArticles(slug, 3);
  const articleUrl = localizedUrl(`/blog/${article.slug}`, locale);
  const articleHeadline = isEnglish && article.titleEn ? article.titleEn : article.title;
  const articleDesc = isEnglish && article.descriptionEn ? article.descriptionEn : article.description;
  const effectiveFaqs = isEnglish && article.faqsEn && article.faqsEn.length > 0 ? article.faqsEn : article.faqs;

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: articleHeadline,
    description: articleDesc,
    image: [OG_IMAGE_URL],
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: locale,
    author: {
      "@type": "Organization",
      name: "SeerTarot Sanctuary",
      url: SITE_ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      name: "SeerTarot",
      url: SITE_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_ORIGIN}/icons/icon-512x512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": articleUrl,
    },
  };

  const jsonLdBreadcrumbs = buildBreadcrumbJsonLd(locale, [
    homeCrumb(locale),
    { name: isEnglish ? "Wisdom Codex" : "คัมภีร์บทความ", path: "/blog" },
    { name: articleHeadline, path: `/blog/${article.slug}` },
  ]);

  const jsonLdFaq =
    effectiveFaqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: effectiveFaqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans selection:bg-[#A58A5C]/20 selection:text-[#29261F]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />
      {jsonLdFaq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      )}

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <ArticleReadingClient article={article} relatedArticles={related} />
      </div>
    </main>
  );
}
