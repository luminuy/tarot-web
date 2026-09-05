import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

import {
  SPREAD_TOPICS,
  getAllTopicSlugs,
  getSpreadTopic,
  getSpreadsForTopic,
} from "@/data/spread-topics";
import { TopicSpreadList } from "@/components/spread/TopicSpreadList";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return getAllTopicSlugs().map((slug) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const topic = getSpreadTopic(category);
  if (!topic) return { title: "ไม่พบหมวดหมู่ผังพยากรณ์", robots: { index: false, follow: true } };

  const url = `${SITE_ORIGIN}/spreads/topic/${topic.slug}`;

  return {
    title: `${topic.seoTitle} · SeerTarot`,
    description: topic.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: `${topic.seoTitle} · SeerTarot`,
      description: topic.metaDescription,
      url,
      siteName: "SeerTarot",
      type: "website",
      images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
    },
    twitter: {
      card: "summary_large_image",
      title: topic.seoTitle,
      description: topic.metaDescription,
      images: [OG_IMAGE_URL],
    },
  };
}

export default async function TopicSpreadsPage({ params }: Props) {
  const { category } = await params;
  const topic = getSpreadTopic(category);
  if (!topic) notFound();

  const spreads = getSpreadsForTopic(topic);
  const allTopics = Object.values(SPREAD_TOPICS);
  const currentUrl = `${SITE_ORIGIN}/spreads/topic/${topic.slug}`;

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: topic.titleTh,
    description: topic.metaDescription,
    url: currentUrl,
    inLanguage: "th",
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: spreads.length,
      itemListElement: spreads.map((spread, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        name: spread.nameTh,
        description: spread.description,
        url: `${SITE_ORIGIN}/spreads/${spread.id}`,
      })),
    },
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
        name: "ผังพยากรณ์ 25 แบบ",
        item: `${SITE_ORIGIN}/spreads`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: topic.nameTh,
        item: currentUrl,
      },
    ],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: topic.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-[#F3F0EA] text-[#29261F] p-4 sm:p-8 font-sans relative overflow-x-clip">
      {/* Structural JSON-LD */}
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
              <Link href="/" className="hover:text-[#29261F] transition-colors">
                หน้าแรก
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#D5CEC2]">/</li>
            <li>
              <Link href="/spreads" className="hover:text-[#29261F] transition-colors">
                ผังพยากรณ์ 25 แบบ
              </Link>
            </li>
            <li aria-hidden="true" className="text-[#D5CEC2]">/</li>
            <li className="font-semibold text-[#29261F]" aria-current="page">
              {topic.nameTh}
            </li>
          </ol>
        </nav>

        {/* Category Navigation Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#D5CEC2]/60">
          <Link
            href="/spreads"
            className="px-4 py-1.5 rounded-full text-xs font-serif-th font-semibold whitespace-nowrap bg-[#EAE7E0] text-[#5E5240] hover:bg-[#DDD8CD] transition-colors"
          >
            ผังทั้งหมด (25 ผัง)
          </Link>
          {allTopics.map((t) => {
            const isActive = t.slug === topic.slug;
            return (
              <Link
                key={t.slug}
                href={`/spreads/topic/${t.slug}`}
                className={`px-4 py-1.5 rounded-full text-xs font-serif-th font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#29261F] text-[#FAF8F5] shadow-xs"
                    : "bg-[#FFFFFF] border border-[#D5CEC2] text-[#4A4338] hover:border-[#A58A5C]"
                }`}
              >
                {t.nameTh} ({t.spreadIds.length})
              </Link>
            );
          })}
        </div>

        {/* Hero Header */}
        <header className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D5CEC2] bg-[#FFFFFF] text-xs text-[#8F5C1A] font-serif-th font-semibold">
            หมวดหมู่ผังพยากรณ์ · {spreads.length} ผังเฉพาะทาง
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif-th text-[#29261F] tracking-tight leading-tight">
            {topic.heading}
          </h1>
          <p className="text-sm sm:text-base text-[#635B4E] leading-relaxed font-serif-th">
            {topic.tagline}
          </p>
        </header>

        {/* Editorial Guide Prose */}
        <section className="bg-[#FFFFFF] rounded-2xl border border-[#D5CEC2] p-6 sm:p-8 space-y-4 shadow-xs">
          <h2 className="text-base sm:text-lg font-bold font-serif-th text-[#29261F] border-b border-[#E8E2D8] pb-3">
            คู่มือการอ่านไพ่ทาโรต์หมวด{topic.nameTh}
          </h2>
          <div className="space-y-3 text-xs sm:text-sm text-[#4A4338] font-serif-th leading-relaxed">
            {topic.editorialIntro.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        </section>

        {/* Spreads Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold font-serif-th text-[#29261F]">
              เลือกผังพยากรณ์ที่ตรงกับคำถามของคุณ
            </h2>
            <span className="text-xs font-serif-th text-[#7A6F5D]">
              {spreads.length} รูปแบบ
            </span>
          </div>
          <TopicSpreadList spreads={spreads} />
        </section>

        {/* FAQ Section */}
        {topic.faqs.length > 0 && (
          <section className="bg-[#FFFFFF] rounded-2xl border border-[#D5CEC2] p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold font-serif-th text-[#29261F]">
                คำถามพบบ่อยเกี่ยวกับการดูดวงด้าน{topic.nameTh}
              </h2>
              <p className="text-xs text-[#7A6F5D] font-serif-th">
                หลักการและข้อแนะนำเพื่อการเปิดไพ่ที่ให้คำตอบชัดเจนที่สุด
              </p>
            </div>
            <div className="divide-y divide-[#E8E2D8] space-y-4 pt-2">
              {topic.faqs.map((faq, index) => (
                <div key={index} className="pt-4 first:pt-0 space-y-1.5">
                  <h3 className="font-serif-th text-sm sm:text-base font-bold text-[#29261F]">
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
        <section className="pt-8 border-t border-[#D5CEC2]/80 space-y-4">
          <h3 className="text-xs font-mono uppercase tracking-widest text-[#8F5C1A] font-semibold">
            สำรวจหมวดหมู่อื่นๆ ในวิหารพยากรณ์
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {allTopics.map((t) => (
              <Link
                key={t.slug}
                href={`/spreads/topic/${t.slug}`}
                className="p-3 rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] hover:border-[#A58A5C] text-center transition-all group"
              >
                <div className="text-xs font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A]">
                  {t.nameTh}
                </div>
                <div className="text-[11px] text-[#7A6F5D] font-mono mt-0.5">
                  {t.spreadIds.length} ผัง
                </div>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-serif-th text-[#7A6F5D] pt-4">
            <Link href="/cards" className="hover:text-[#29261F] underline underline-offset-4">
              สารานุกรมไพ่ 78 ใบ
            </Link>
            <span className="text-[#D5CEC2]">·</span>
            <Link href="/blog" className="hover:text-[#29261F] underline underline-offset-4">
              คัมภีร์บทความดูดวง
            </Link>
            <span className="text-[#D5CEC2]">·</span>
            <Link href="/" className="hover:text-[#29261F] underline underline-offset-4">
              กลับสู่วิหารหลัก
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
