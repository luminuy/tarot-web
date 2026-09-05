import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ARTICLES } from "@/data/articles";
import { SPREADS, getSpread } from "@/data/spreads";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { OG_IMAGE_ALT, OG_IMAGE_URL, SITE_ORIGIN } from "@/lib/config/site";
import { SpreadDetailClient } from "./SpreadDetailClient";

interface Props {
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

export function generateStaticParams() {
  return SPREADS.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const spread = getSpread(id);
  if (!spread) return { title: "ไม่พบผังพยากรณ์", robots: { index: false, follow: true } };

  const title = `ผัง${spread.nameTh} — วิธีอ่านไพ่ ${spread.positions.length} ใบ`;
  const description = `${spread.description} เจาะลึกความหมายไพ่ทั้ง ${spread.positions.length} ตำแหน่ง พร้อมวิธีตั้งคำถามและอ่านผลด้วยไพ่ 1909 Rider-Waite`;
  const url = `${SITE_ORIGIN}/spreads/${spread.id}`;

  return {
    title,
    description,
    keywords: [
      `ผัง${spread.nameTh}`,
      `${spread.nameTh} ความหมาย`,
      `ดูดวงไพ่ ${spread.positions.length} ใบ`,
      "ผังพยากรณ์ไพ่ทาโรต์",
      "ไพ่ทาโรต์ 1909 Rider-Waite",
    ],
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "SeerTarot",
      type: "article",
    images: [{ url: OG_IMAGE_URL, width: 1200, height: 630, alt: OG_IMAGE_ALT }],
    },
    twitter: { card: "summary_large_image", title, description, images: [OG_IMAGE_URL] },
  };
}

export default async function SpreadDetailPage({ params }: Props) {
  const { id } = await params;
  const spread = getSpread(id);
  if (!spread) notFound();

  const url = `${SITE_ORIGIN}/spreads/${spread.id}`;
  const standard = isStandardSpread(spread.id);
  const categoryTh = CATEGORY_TH[spread.defaultCategory] ?? spread.defaultCategory;

  const relatedArticles = ARTICLES.filter((a) => a.targetSpreadId === spread.id).slice(0, 6);
  const otherSpreads = SPREADS.filter(
    (s) => s.id !== spread.id && s.defaultCategory === spread.defaultCategory,
  ).slice(0, 4);
  const fallbackSpreads = otherSpreads.length
    ? otherSpreads
    : SPREADS.filter((s) => s.id !== spread.id).slice(0, 4);

  const topicPhrase = spread.defaultCategory === "general" ? "" : `เรื่อง${categoryTh}`;
  const howToSteps = [
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
      name: `เลือกไพ่ ${spread.positions.length} ใบ`,
      text: `เลือกไพ่ทีละใบวางตามตำแหน่งที่ 1 ถึง ${spread.positions.length} โดยไม่เปิดดูหน้าไพ่`,
    },
    {
      name: "อ่านทีละตำแหน่งแล้วเชื่อมโยง",
      text: "อ่านความหมายไพ่ในบริบทของแต่ละตำแหน่งก่อน จากนั้นมองภาพรวมว่าไพ่ทุกใบเล่าเรื่องเดียวกันอย่างไร",
    },
  ];

  const faqs = [
    {
      question: `ผัง${spread.nameTh} เหมาะกับคำถามแบบไหน`,
      answer: `${spread.description} ${
        topicPhrase ? `จึงเหมาะกับ${topicPhrase}ที่อยากเห็นภาพรวมและปัจจัยรอบด้าน` : ""
      }`.trim(),
    },
    {
      question: `ผังนี้ใช้ไพ่กี่ใบ`,
      answer: `ผังนี้ใช้ไพ่ ${spread.positions.length} ใบ วางตามตำแหน่งที่กำหนดไว้`,
    },
    {
      question: standard
        ? "ผังนี้เปิดใช้ฟรีได้ไหม"
        : "ทำไมผังนี้เป็นผังพิเศษ",
      answer: standard
        ? "ได้ ผังนี้เป็นผังมาตรฐานที่สมาชิกทุกคนเปิดได้ตามโควตาปกติ"
        : "ผังนี้มีจำนวนไพ่มากและตีความละเอียด จึงสงวนไว้สำหรับผู้ถือสิทธิ์ญาณพยากรณ์พิเศษ",
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `วิธีดูดวงด้วยผัง${spread.nameTh}`,
      description: spread.description,
      inLanguage: "th",
      step: howToSteps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "หน้าแรก", item: SITE_ORIGIN },
        { "@type": "ListItem", position: 2, name: "คลังผังพยากรณ์", item: `${SITE_ORIGIN}/spreads` },
        { "@type": "ListItem", position: 3, name: spread.nameTh, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: { "@type": "Answer", text: f.answer },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-[#F3F0EA] p-4 font-sans text-[#29261F] sm:p-8">
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
