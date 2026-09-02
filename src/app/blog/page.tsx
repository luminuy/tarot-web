import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllArticles } from "@/data/articles";
import { BlogIndexClient } from "./BlogIndexClient";
import { SITE_ORIGIN } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "คัมภีร์บทความ & คู่มือดูดวงไพ่ยิปซี ทาโรต์ 1909 | SeerTarot Blog",
  description:
    "รวมบทความดูดวงไพ่ยิปซี ความรัก การงาน การเงิน ผังพยากรณ์ 20 แบบ และความหมายไพ่ 78 ใบ โดยแม่หมอแห่งวิหาร SeerTarot",
  keywords: [
    "ดูดวงไพ่ยิปซี",
    "บทความไพ่ทาโรต์",
    "ดูดวงความรัก",
    "ความหมายไพ่ยิปซี 78 ใบ",
    "ผังเซลติกครอส",
    "วิธีดูดวงด้วยตัวเอง",
  ],
  alternates: {
    canonical: `${SITE_ORIGIN}/blog`,
  },
  openGraph: {
    title: "คัมภีร์บทความ & คู่มือดูดวงไพ่ยิปซี ทาโรต์ 1909 | SeerTarot",
    description: "รวมบทความเจาะลึกศาสตร์ไพ่ทาโรต์ ความรัก การงาน และจิตวิทยาพยากรณ์",
    url: `${SITE_ORIGIN}/blog`,
    siteName: "SeerTarot",
    type: "website",
  },
};

export default function BlogPage() {
  const articles = getAllArticles();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "คัมภีร์บทความ & คู่มือดูดวงไพ่ยิปซี ทาโรต์ 1909 | SeerTarot Blog",
    description: "รวมบทความดูดวงไพ่ยิปซี ความรัก การงาน การเงิน ผังพยากรณ์ 20 แบบ และความหมายไพ่ 78 ใบ",
    url: `${SITE_ORIGIN}/blog`,
    inLanguage: "th",
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
      headline: article.title,
      description: article.description,
      url: `${SITE_ORIGIN}/blog/${article.slug}`,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt,
      author: {
        "@type": "Organization",
        name: "SeerTarot Sanctuary",
      },
    })),
  };

  const breadcrumbsJsonLd = {
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
    ],
  };

  return (
    <main className="min-h-screen bg-[#05040a] text-[#f5deaa] p-4 sm:p-8 font-sans selection:bg-[#ffd700]/30 selection:text-[#ffd700]">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />

      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Navigation Breadcrumb & Back button */}
        <div className="flex items-center justify-between border-b border-[#e5c07b]/20 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#e5c07b] hover:text-[#ffd700] transition-colors font-serif-th"
          >
            <span>←</span> กลับสู่วิหารพยากรณ์
          </Link>
          <div className="flex items-center gap-3 text-xs font-mono text-[#9c93b8]">
            <Link href="/spreads" className="hover:text-[#e5c07b] transition-colors">
              ผัง 20 แบบ
            </Link>
            <span>·</span>
            <Link href="/cards" className="hover:text-[#e5c07b] transition-colors">
              ไพ่ 78 ใบ
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center space-y-3 py-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-[#e5c07b]/30 bg-[#130d24] text-[11px] text-[#e5c07b] font-mono shadow-md">
            <span>✦</span> Sacred Knowledge & Wisdom <span>✦</span>
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl font-bold font-mystic-gold leading-tight">
            คัมภีร์บทความ & ศาสตร์ไพ่ทาโรต์
          </h1>
          <p className="text-xs sm:text-sm text-[#a99fc2] font-serif-th leading-relaxed">
            คู่มือการพยากรณ์ เจาะลึกความหมายไพ่ 78 ใบ เทคนิคเปิดไพ่ความรัก การงาน และจิตวิทยาเพื่อการพัฒนาตนเอง
          </p>
        </div>

        {/* Client Interactive Filter & Search */}
        <BlogIndexClient articles={articles} />
      </div>
    </main>
  );
}
