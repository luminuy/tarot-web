import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllArticles } from "@/data/articles";
import { BlogIndexClient } from "./BlogIndexClient";
import { SITE_ORIGIN } from "@/lib/config/site";

import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";

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
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans selection:bg-[#A58A5C]/20 selection:text-[#29261F]">
      {/* Schema.org Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }} />

      <div className="max-w-5xl mx-auto space-y-8 pb-16">
        {/* Navigation Breadcrumb & Sanctuary Controls */}
        <div className="flex items-center justify-between border-b border-[#D5CEC2]/40 pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-[#29261F] hover:text-[#8F5C1A] transition-colors font-serif-th py-2 px-4 rounded-full bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#8F5C1A] shadow-2xs group"
          >
            <span className="text-[#8F5C1A] transition-transform group-hover:-translate-x-0.5">←</span>
            <span>กลับหน้าดูดวงหลัก</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/spreads"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-serif-th text-[#635B4E] hover:text-[#8F5C1A] py-1.5 px-3 rounded-full bg-[#FFFFFF] border border-[#D5CEC2]/60 hover:border-[#8F5C1A] transition-all"
            >
              <span>✦</span> ผังพยากรณ์ 20 แบบ
            </Link>
            <Link
              href="/cards"
              className="hidden sm:inline-flex items-center gap-1 text-xs font-serif-th text-[#635B4E] hover:text-[#8F5C1A] py-1.5 px-3 rounded-full bg-[#FFFFFF] border border-[#D5CEC2]/60 hover:border-[#8F5C1A] transition-all"
            >
              <span>✦</span> ความหมายไพ่ 78 ใบ
            </Link>
            <SacredNavDropdown />
          </div>
        </div>

        {/* Sanctuary Codex Hero Header */}
        <div className="text-center space-y-3.5 py-6 sm:py-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#A58A5C]/60" />
            <span className="font-serif-th text-xs uppercase tracking-[0.25em] text-[#8F5C1A] font-bold">
              ✦ SEERTAROT WISDOM &amp; CODEX ✦
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#A58A5C]/60" />
          </div>
          <h1 className="font-serif-th text-2xl sm:text-4xl lg:text-5xl font-bold text-[#29261F] tracking-wide leading-tight py-0.5 [text-wrap:balance]">
            คัมภีร์บทความและสาระน่ารู้ไพ่ทาโรต์
          </h1>
          <p className="text-xs sm:text-base text-[#635B4E] font-serif-th leading-relaxed max-w-2xl mx-auto [text-wrap:balance]">
            เจาะลึกศาสตร์พยากรณ์ 1909 Rider-Waite ถอดรหัสสัญลักษณ์จิตวิทยาของ Carl Jung เทคนิคเปิดไพ่ความรัก การงาน และคู่มือไพ่ครบ 78 ใบ
          </p>
        </div>

        {/* Client Interactive Filter & Search */}
        <BlogIndexClient articles={articles} />
      </div>
    </main>
  );
}
