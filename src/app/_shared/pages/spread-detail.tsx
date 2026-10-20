import type { Metadata } from "next";

import { ARTICLES } from "@/data/articles";
import { PUBLIC_SPREADS, getSpread } from "@/data/spreads";
import { SPREAD_TOPICS } from "@/data/spread-topics";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { clampDescription, headline, pickTitle, stripCardCount } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl, noindexAlternates } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";
import { jsonLdScript } from "@/lib/seo/json-ld";
import { buildFaqPageJsonLd, buildSpreadFaqs, SPREAD_CATEGORY_TH } from "@/lib/seo/faq";
import { rotatingNeighborsGrouped } from "@/lib/seo/rotating-neighbors";
import { Ui2NextSteps } from "@/components/ui2/Ui2NextSteps";

const CATEGORY_EN: Record<string, string> = {
  general: "general",
  love: "love",
  career: "career",
  work: "career",
  money: "money",
  finance: "money",
  spiritual: "spiritual",
  decision: "decision-making",
};

/** พารามิเตอร์ของหน้าผัง 26 แบบ — ใช้ชุดเดียวกันทั้งสองภาษา */
export function spreadStaticParams() {
  return PUBLIC_SPREADS.map((spread) => ({ id: spread.id }));
}

/**
 * ⚙️ แกนกลางแบบซิงโครนัส — ใช้ได้ทั้งสองเครื่องมือเรนเดอร์
 * (Next ส่ง `params` มาเป็น Promise · Astro รู้ค่าตั้งแต่ `getStaticPaths` แล้ว)
 * ⚠️ ห้ามก็อปตรรกะ SEO นี้ไปไว้ในไฟล์ `.astro` เด็ดขาด — ต้องมีที่เดียว
 */
export function spreadDetailMetadata(id: string, locale: Locale): Metadata {
  const spread = getSpread(id);
  if (!spread) {
    return {
      title: locale === "en" ? "Spread not found" : "ไม่พบผังพยากรณ์",
      robots: { index: false, follow: true },
      alternates: noindexAlternates(),
    };
  }

  const isEnglish = locale === "en";
  const path = `/spreads/${spread.id}`;
  const cardCount = spread.positions.length;

  // ชื่อผังอังกฤษหลายอันมี "(10 Cards)" ติดมาในชื่ออยู่แล้ว ถ้าต่อ "10-Card Layout" ท้ายอีก
  // จะได้ title ยาว 118 ตัวอักษรและบอกจำนวนไพ่ซ้ำสองรอบ — เรียงจากยาวสุดไปสั้นสุด
  // แล้วให้ pickTitle เลือกตัวแรกที่ยังพอดีเพดาน (ดู src/lib/config/meta-length.ts)
  const nameEnShort = stripCardCount(spread.nameEn);
  const title = isEnglish
    ? pickTitle([
        `${nameEnShort} Tarot Spread (${cardCount} Cards)`,
        `${headline(nameEnShort)} Tarot Spread (${cardCount} Cards)`,
        `${headline(nameEnShort)} Tarot Spread`,
      ])
    : pickTitle(
        spread.seoTitleTh
          ? [
              `${spread.seoTitleTh} — วิธีอ่านทุกตำแหน่ง`,
              spread.seoTitleTh,
              `ผัง${spread.nameTh} ${cardCount} ใบ`,
            ]
          : [`ผัง${spread.nameTh} — วิธีอ่านไพ่ ${cardCount} ใบ`, `ผัง${spread.nameTh} ${cardCount} ใบ`],
      );

  const description = isEnglish
    ? clampDescription(
        spread.descriptionEn,
        `What each of the ${cardCount} positions means and how to read it.`,
      )
    : spread.seoDescriptionTh
      ? clampDescription(spread.seoDescriptionTh)
      : clampDescription(spread.description, `พร้อมความหมายครบทั้ง ${cardCount} ตำแหน่ง`);

  const keywords = isEnglish
    ? [
        `${spread.nameEn} spread`,
        `${spread.nameEn} tarot`,
        `${cardCount} card tarot spread`,
        `${cardCount} card reading`,
        "tarot spread positions",
        "free tarot spread",
      ]
    : [
        `ดูดวงไพ่ยิปซี ${cardCount} ใบ`,
        `เปิดไพ่ ${cardCount} ใบ`,
        `สุ่มไพ่ ${cardCount} ใบ`,
        `ดูดวง ${cardCount} ใบ`,
        `ไพ่ทาโร่ ${cardCount} ใบ`,
        `ไพ่ยิปซี ${cardCount} ใบ`,
        `ไพ่ยิปซี ${cardCount} ใบ ตำแหน่ง`,
        `เปิดไพ่ยิปซี ${cardCount} ใบ`,
        `ผัง${spread.nameTh}`,
        `${spread.nameTh} ตำแหน่งไพ่`,
        `${spread.nameTh} ความหมาย`,
        `ตำแหน่งไพ่ยิปซี ${spread.nameTh}`,
        "ความหมายตำแหน่งไพ่ยิปซี",
        "ดูดวงไพ่ยิปซีฟรี",
        "ผังพยากรณ์ไพ่ทาโรต์",
      ];

  const ogImages = buildPageOgImage({
    title: isEnglish ? spread.nameEn : spread.nameTh,
    eyebrow: isEnglish ? `${cardCount}-CARD SPREAD` : `ผังพยากรณ์ ${cardCount} ใบ`,
    cardImage: getCategoryCardImage(spread.defaultCategory),
    alt: isEnglish ? `${spread.nameEn} Tarot Spread` : `ผังพยากรณ์ ${spread.nameTh}`,
  });

  return {
    title,
    description,
    keywords,
    alternates: buildAlternates(path, { locale, englishTwin: true }),
    openGraph: {
      title,
      description,
      url: localizedUrl(path, locale),
      siteName: "SeerTarot",
      type: "article",
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

/**
 * ⚙️ เนื้อหาหน้าคู่มือผังแบบซิงโครนัส — รับผังที่หาเจอแล้วเข้ามาตรง ๆ
 * (Astro เรียกตัวนี้ · React ฝั่ง SSR เรนเดอร์คอมโพเนนต์แบบ async ไม่ได้)
 */
export function SpreadDetailContent({
  spread,
  locale,
  detail,
}: {
  spread: NonNullable<ReturnType<typeof getSpread>>;
  locale: Locale;
  /** island ของแผงรายละเอียดผัง — ส่งเข้ามาจากข้างนอกเสมอ */
  detail: ReactNode;
}) {
  const isEnglish = locale === "en";
  const standard = isStandardSpread(spread.id);
  const cardCount = spread.positions.length;
  const topicCrumb = spreadTopicCrumb(spread.id, locale);
  const categoryLabel = isEnglish
    ? CATEGORY_EN[spread.defaultCategory] ?? spread.defaultCategory
    : SPREAD_CATEGORY_TH[spread.defaultCategory] ?? spread.defaultCategory;

  /* บทความที่เกี่ยวข้องและผังใกล้เคียงย้ายไปอยู่ที่ `spreadDetailProps()` ท้ายไฟล์
     เพราะเป็น prop ของแผงรายละเอียด ไม่ได้ถูกใช้ในส่วนที่ไฟล์นี้เรนเดอร์เอง */

  const topicPhrase = spread.defaultCategory === "general" ? "" : `เรื่อง${categoryLabel}`;

  const howToSteps = isEnglish
    ? [
        {
          name: "Frame one clear question",
          text: `Narrow ${spread.defaultCategory === "general" ? "what you want to know" : `your ${categoryLabel} situation`} down to a single question. ${
            spread.yesNoMode
              ? "This spread reads a yes/no leaning well."
              : "Avoid questions that can only be answered yes or no."
          }`,
        },
        {
          name: "Shuffle and cut",
          text: "Hold the question in mind while you shuffle, and stop when it feels finished.",
        },
        {
          name: `Draw ${cardCount} ${cardCount === 1 ? "card" : "cards"}`,
          text: `Draw one card at a time into positions 1 through ${cardCount} without turning any of them face up yet.`,
        },
        {
          name: "Read each position, then the whole",
          text: "Read each card in the context of its position first, then step back and ask what story all the cards tell together.",
        },
      ]
    : [
        {
          name: "ตั้งคำถามให้ชัด",
          text: `นึกถึง${topicPhrase || "สิ่งที่อยากรู้"}ให้เป็นคำถามเดียว ${
            spread.yesNoMode
              ? "ผังนี้ตอบแนวโน้มใช่/ไม่ใช่ได้ดี"
              : "หลีกเลี่ยงคำถามที่ตอบแค่ใช่หรือไม่ใช่"
          }`,
        },
        { name: "สับและตัดไพ่", text: "ตั้งสมาธิที่คำถามระหว่างสับไพ่ แล้วหยุดเมื่อรู้สึกว่าพอ" },
        {
          name: `เลือกไพ่ ${cardCount} ใบ`,
          text: `เลือกไพ่ทีละใบวางตามตำแหน่งที่ 1 ถึง ${cardCount} โดยไม่เปิดดูหน้าไพ่`,
        },
        {
          name: "อ่านทีละตำแหน่งแล้วเชื่อมโยง",
          text: "อ่านความหมายไพ่ในบริบทของแต่ละตำแหน่งก่อน จากนั้นมองภาพรวมว่าไพ่ทุกใบเล่าเรื่องเดียวกันอย่างไร",
        },
      ];

  /* FAQPage JSON-LD = ชุดเดียวกับ FAQ ที่มองเห็นบนหน้า (`SpreadDetailClient.tsx`) — ตัวสร้างกลาง `buildSpreadFaqs` (A7-10) */
  const faqs = buildSpreadFaqs(spread, isEnglish, standard);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: isEnglish
        ? `How to read the ${spread.nameEn} tarot spread`
        : `วิธีดูดวงด้วยผัง${spread.nameTh}`,
      description: isEnglish ? spread.descriptionEn : spread.description,
      inLanguage: locale,
      step: howToSteps.map((step, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: step.name,
        text: step.text,
      })),
    },
    buildBreadcrumbJsonLd(locale, [
      homeCrumb(locale),
      { name: isEnglish ? "Tarot Spreads" : "คลังผังพยากรณ์", path: "/spreads" },
      ...(topicCrumb ? [{ name: topicCrumb.label, path: topicCrumb.path }] : []),
      { name: isEnglish ? spread.nameEn : spread.nameTh, path: `/spreads/${spread.id}` },
    ]),
    buildFaqPageJsonLd(faqs),
  ];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen p-4 font-sans text-ink sm:p-8">
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(block) }}
        />
      ))}

      {detail}
      {/* ไปต่อจากตรงนี้ — กล่องหลายขนาดแบบหน้าแรก (เจ้าของ 2026-10-17) */}
      <Ui2NextSteps isEn={isEnglish} keys={["cards", "daily", "journal", "questions"]} />
    </main>
  );
}

/** ข้อมูลประกอบที่แผงรายละเอียดผังต้องใช้ — ใช้ร่วมกันทั้งสองเครื่องมือเรนเดอร์ */
/**
 * หมวดที่ผังนี้สังกัด (หน้า `/spreads/topic/*`) — ใช้เป็นชั้นกลางของ breadcrumb ทั้งที่มองเห็นและ JSON-LD
 * ลิงก์ขึ้นหมวดด้วยคำที่คนค้น ("ดูดวงไพ่ยิปซี ความรัก") จากทุกผังลูก (GSC 2026-10-19: หน้าหมวดความรักอันดับ 39.5)
 * ผังที่ไม่อยู่ในหมวดใด = ไม่มีชั้นกลาง (breadcrumb เดิม)
 */
export function spreadTopicCrumb(spreadId: string, locale: Locale): { label: string; path: string } | undefined {
  const topic = Object.values(SPREAD_TOPICS).find((t) => t.spreadIds.includes(spreadId));
  if (!topic) return undefined;
  return {
    label: locale === "en" ? (topic.titleEn ?? topic.nameEn) : topic.titleTh,
    path: `/spreads/topic/${topic.slug}`,
  };
}

export function spreadDetailProps(spread: NonNullable<ReturnType<typeof getSpread>>, locale: Locale) {
  const isEnglish = locale === "en";
  const relatedArticles = isEnglish
    ? ARTICLES.filter((a) => a.targetSpreadId === spread.id && Boolean(a.contentEn)).slice(0, 6)
    : ARTICLES.filter((a) => a.targetSpreadId === spread.id).slice(0, 6);
  // หมุนวนตามตำแหน่งผัง — ไม่ใช่ 4 ผังแรกของหมวดชุดเดิมทุกหน้า (ดู rotating-neighbors.ts)
  const fallbackSpreads = rotatingNeighborsGrouped(
    PUBLIC_SPREADS,
    (s) => s.id === spread.id,
    (s) => s.defaultCategory === spread.defaultCategory,
    4,
    3,
  );
  return {
    spread,
    standard: isStandardSpread(spread.id),
    relatedArticles,
    fallbackSpreads,
    topicCrumb: spreadTopicCrumb(spread.id, locale),
  };
}
