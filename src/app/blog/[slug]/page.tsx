import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllArticles, getArticleBySlug, getRelatedArticles } from "@/data/articles";
import { SITE_ORIGIN, SITE_NAME_TH } from "@/lib/config/site";
import { ArticleReadingClient } from "./ArticleReadingClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    return {
      title: "ไม่พบบทความ | SeerTarot",
    };
  }

  const url = `${SITE_ORIGIN}/blog/${article.slug}`;

  return {
    title: `${article.title} | SeerTarot`,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      siteName: "SeerTarot",
      type: "article",
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export default async function ArticleDetailPage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = getRelatedArticles(slug, 3);
  const articleUrl = `${SITE_ORIGIN}/blog/${article.slug}`;

  // Schema.org Structured Data
  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
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

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "หน้าแรก",
        item: SITE_ORIGIN,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "คัมภีร์บทความ",
        item: `${SITE_ORIGIN}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  const jsonLdFaq =
    article.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faqs.map((faq) => ({
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
      {/* Inject Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }} />
      {jsonLdFaq && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }} />
      )}

      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        {/* Top Breadcrumb Navigation */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-xs font-serif-th text-[#635B4E] border-b border-[#D5CEC2]/40 pb-4 overflow-x-auto whitespace-nowrap"
        >
          <Link href="/" className="hover:text-[#A58A5C] transition-colors">
            หน้าแรก
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-[#A58A5C] transition-colors">
            คัมภีร์บทความ
          </Link>
          <span>/</span>
          <span className="text-[#29261F] truncate font-bold">{article.categoryTh}</span>
        </nav>

        {/* Client Interactive Reader Component */}
        <ArticleReadingClient article={article} relatedArticles={related} />
      </div>
    </main>
  );
}
