import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ARTICLES } from "@/data/articles";
import { SPREADS, getSpread } from "@/data/spreads";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { clampDescription, headline, pickTitle, stripCardCount } from "@/lib/config/meta-length";
import { buildAlternates, localizedUrl } from "@/lib/config/site";
import { buildPageOgImage } from "@/lib/media/og-image";
import { getCategoryCardImage } from "@/lib/media/og-card-art";
import { SpreadDetailClient } from "@/components/spread/SpreadDetailClient";
import type { Locale } from "@/lib/i18n/types";

import { buildBreadcrumbJsonLd, homeCrumb } from "../seo";

export interface SpreadDetailPageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_TH: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  career: "การงาน",
  work: "การงาน",
  money: "การเงิน",
  finance: "การเงิน",
  spiritual: "จิตวิญญาณ",
  decision: "การตัดสินใจ",
};

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

/** พารามิเตอร์ของหน้าผัง 25 แบบ — ใช้ชุดเดียวกันทั้งสองภาษา */
export function spreadStaticParams() {
  return SPREADS.map((spread) => ({ id: spread.id }));
}

export async function buildSpreadDetailMetadata(
  { params }: SpreadDetailPageProps,
  locale: Locale,
): Promise<Metadata> {
  const { id } = await params;
  const spread = getSpread(id);
  if (!spread) {
    return {
      title: locale === "en" ? "Spread not found" : "ไม่พบผังพยากรณ์",
      robots: { index: false, follow: true },
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

export async function SpreadDetailBody({
  params,
  locale,
}: SpreadDetailPageProps & { locale: Locale }) {
  const { id } = await params;
  const spread = getSpread(id);
  if (!spread) notFound();

  const isEnglish = locale === "en";
  const standard = isStandardSpread(spread.id);
  const cardCount = spread.positions.length;
  const categoryLabel = isEnglish
    ? CATEGORY_EN[spread.defaultCategory] ?? spread.defaultCategory
    : CATEGORY_TH[spread.defaultCategory] ?? spread.defaultCategory;

  // คลังบทความฉบับอังกฤษแสดงเฉพาะบทความที่มี contentEn แล้ว
  const relatedArticles = isEnglish
    ? ARTICLES.filter((a) => a.targetSpreadId === spread.id && Boolean(a.contentEn)).slice(0, 6)
    : ARTICLES.filter((a) => a.targetSpreadId === spread.id).slice(0, 6);

  const otherSpreads = SPREADS.filter(
    (s) => s.id !== spread.id && s.defaultCategory === spread.defaultCategory,
  ).slice(0, 4);
  const fallbackSpreads = otherSpreads.length
    ? otherSpreads
    : SPREADS.filter((s) => s.id !== spread.id).slice(0, 4);

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

  const faqs = isEnglish
    ? [
        {
          question: `What kind of question is the ${spread.nameEn} spread good for?`,
          answer: `${spread.descriptionEn}${
            spread.defaultCategory === "general" ? "" : ` It suits ${categoryLabel} questions where you want the whole picture rather than a single answer.`
          }`,
        },
        {
          question: `How many cards does the ${spread.nameEn} spread use?`,
          answer: `This spread uses ${cardCount} ${cardCount === 1 ? "card" : "cards"}, each laid in a fixed position.`,
        },
        {
          question: standard ? "Is this spread free to use?" : "Why is this spread reserved?",
          answer: standard
            ? "Yes — this is a standard spread that every member can open within their normal quota."
            : "This spread uses many cards and takes a much longer interpretation, so it is reserved for holders of the extended reading entitlement.",
        },
      ]
    : [
        {
          question: `ผัง${spread.nameTh} เหมาะกับคำถามแบบไหน`,
          answer: `${spread.description} ${
            topicPhrase ? `จึงเหมาะกับ${topicPhrase}ที่อยากเห็นภาพรวมและปัจจัยรอบด้าน` : ""
          }`.trim(),
        },
        {
          question: `ผังนี้ใช้ไพ่กี่ใบ`,
          answer: `ผังนี้ใช้ไพ่ ${cardCount} ใบ วางตามตำแหน่งที่กำหนดไว้`,
        },
        {
          question: standard ? "ผังนี้เปิดใช้ฟรีได้ไหม" : "ทำไมผังนี้เป็นผังพิเศษ",
          answer: standard
            ? "ได้ ผังนี้เป็นผังมาตรฐานที่สมาชิกทุกคนเปิดได้ตามโควตาปกติ"
            : "ผังนี้มีจำนวนไพ่มากและตีความละเอียด จึงสงวนไว้สำหรับผู้ถือสิทธิ์ญาณพยากรณ์พิเศษ",
        },
      ];

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
      { name: isEnglish ? spread.nameEn : spread.nameTh, path: `/spreads/${spread.id}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-canvas p-4 font-sans text-ink sm:p-8">
      {jsonLd.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
        />
      ))}

      <SpreadDetailClient
        spread={spread}
        standard={standard}
        relatedArticles={relatedArticles}
        fallbackSpreads={fallbackSpreads}
      />
    </main>
  );
}
