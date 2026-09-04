import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ARTICLES } from "@/data/articles";
import { SPREADS, getSpread } from "@/data/spreads";
import { SpreadPositionMap } from "@/components/spread/SpreadPositionMap";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { SITE_ORIGIN } from "@/lib/config/site";

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
  if (!spread) return { title: "ไม่พบผังพยากรณ์ | SeerTarot" };

  const title = `ผัง${spread.nameTh} — วิธีอ่านและความหมายไพ่ ${spread.positions.length} ใบ | SeerTarot`;
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
    },
    twitter: { card: "summary_large_image", title, description },
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

      <div className="mx-auto max-w-4xl space-y-10 pb-20">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 overflow-x-auto whitespace-nowrap border-b border-[#D5CEC2]/40 pb-4 font-serif-th text-xs text-[#635B4E]"
        >
          <Link href="/" className="transition-colors hover:text-[#A58A5C]">
            หน้าแรก
          </Link>
          <span>/</span>
          <Link href="/spreads" className="transition-colors hover:text-[#A58A5C]">
            คลังผังพยากรณ์
          </Link>
          <span>/</span>
          <span className="truncate font-bold text-[#29261F]">{spread.nameTh}</span>
        </nav>

        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px] font-serif-th">
            <span className="rounded-full border border-[#D5CEC2] bg-[#EAE7E0] px-2.5 py-0.5 font-mono font-bold">
              {spread.positions.length} ใบ
            </span>
            <span className="rounded-full border border-[#D5CEC2] bg-white px-2.5 py-0.5">
              หมวด {categoryTh}
            </span>
            <span className="rounded-full border border-[#D5CEC2] bg-white px-2.5 py-0.5">
              {standard ? "ผังมาตรฐาน" : "✦ ญาณพิเศษ"}
            </span>
          </div>
          <h1 className="font-serif-th text-3xl font-bold leading-tight sm:text-4xl [text-wrap:balance]">
            ผัง{spread.nameTh}
          </h1>
          <p className="font-serif-th text-lg text-[#A58A5C] [text-wrap:balance]">{spread.tagline}</p>
          <p className="max-w-2xl font-serif-th leading-relaxed text-[#29261F] [text-wrap:pretty]">
            {spread.description}
          </p>
          <Link
            href={`/?spread=${spread.id}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#29261F] px-6 py-3 font-serif-th text-sm font-bold text-[#F3F0EA] transition-all hover:bg-[#A58A5C] active:scale-[0.98]"
          >
            ✦ {standard ? "เริ่มดูดวงด้วยผังนี้" : "เปิดผังพยากรณ์พิเศษนี้"}
          </Link>
        </header>

        <section className="grid gap-8 sm:grid-cols-[minmax(0,240px)_1fr] sm:items-start">
          <div>
            <SpreadPositionMap positions={spread.positions} />
            <p className="mt-2 text-center text-xs text-[#635B4E]">
              ลำดับการวางไพ่ 1–{spread.positions.length}
            </p>
          </div>
          <div>
            <h2 className="font-serif-th text-xl font-bold">ความหมายแต่ละตำแหน่ง</h2>
            <ol className="mt-4 space-y-3">
              {spread.positions.map((pos, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 rounded-lg border border-[#D5CEC2] bg-white p-3"
                >
                  <span className="flex-shrink-0 font-mono text-sm font-bold text-[#A58A5C]">
                    #{idx + 1}
                  </span>
                  <div className="font-serif-th">
                    <strong className="text-[#29261F]">{pos.nameTh}</strong>{" "}
                    <span className="leading-relaxed text-[#635B4E]">— {pos.meaning}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section>
          <h2 className="font-serif-th text-xl font-bold">วิธีอ่านผังนี้</h2>
          <ol className="mt-4 space-y-3">
            {howToSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3 font-serif-th">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#29261F] text-xs font-bold text-[#F3F0EA]">
                  {idx + 1}
                </span>
                <div>
                  <strong className="text-[#29261F]">{step.name}</strong>
                  <p className="leading-relaxed text-[#635B4E]">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h2 className="font-serif-th text-xl font-bold">คำถามที่พบบ่อย</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={idx}
                className="rounded-lg border border-[#D5CEC2] bg-white p-4 font-serif-th"
              >
                <summary className="cursor-pointer font-bold text-[#29261F]">{faq.question}</summary>
                <p className="mt-2 leading-relaxed text-[#635B4E]">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {relatedArticles.length > 0 && (
          <section>
            <h2 className="font-serif-th text-xl font-bold">บทความที่เกี่ยวข้อง</h2>
            <ul className="mt-4 space-y-2">
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/blog/${a.slug}`}
                    className="font-serif-th text-[#A58A5C] underline-offset-2 hover:underline"
                  >
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="font-serif-th text-xl font-bold">ผังอื่นที่น่าสนใจ</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {fallbackSpreads.map((s) => (
              <Link
                key={s.id}
                href={`/spreads/${s.id}`}
                className="rounded-lg border border-[#D5CEC2] bg-white p-4 transition-colors hover:border-[#A58A5C]"
              >
                <p className="font-serif-th font-bold text-[#29261F]">{s.nameTh}</p>
                <p className="mt-1 font-serif-th text-xs text-[#635B4E]">{s.tagline}</p>
              </Link>
            ))}
          </div>
          <Link
            href="/spreads"
            className="mt-4 inline-block font-serif-th text-sm text-[#A58A5C] hover:underline"
          >
            ← ดูคลังผังพยากรณ์ทั้งหมด
          </Link>
        </section>
      </div>
    </main>
  );
}
