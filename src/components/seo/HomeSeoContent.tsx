"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { HOME_FAQS, HOME_HOW_TO_STEPS } from "@/data/home-seo";

export function HomeSeoContent() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full mt-16 sm:mt-24 pt-12 sm:pt-16 border-t border-[#D5CEC2]/60 space-y-16 sm:space-y-24 text-[#29261F]">
      {/* =========================================================================
          SECTION 1: วิธีดูดวงไพ่ทาโรต์ 5 ขั้นตอน (How It Works)
          ========================================================================= */}
      <section aria-labelledby="how-it-works-title" className="space-y-8 sm:space-y-12 max-w-5xl mx-auto px-4">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFE9DF] text-[#8F5C1A] text-xs font-serif-th tracking-widest uppercase">
            <span>✨</span> RITUAL PROCESS
          </div>
          <h2
            id="how-it-works-title"
            className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F] tracking-wide"
          >
            วิธีดูดวงไพ่ทาโรต์ออนไลน์ 5 ขั้นตอนศักดิ์สิทธิ์
          </h2>
          <p className="text-xs sm:text-sm text-[#635B4E] max-w-2xl mx-auto font-serif-th leading-relaxed">
            สัมผัสประสบการณ์เชื่อมโยงจิตใต้สำนึกด้วยการสับและเลือกหยิบไพ่ด้วยมือของคุณเอง
            พร้อมคำพยากรณ์เจาะลึกจากแม่หมอ AI ตามหลักสัญลักษณ์วิทยา 1909 Rider-Waite
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {HOME_HOW_TO_STEPS.map((step, idx) => (
            <div
              key={step.name}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] shadow-xs flex flex-col justify-between space-y-3 hover:border-[#8F5C1A] transition-all duration-300 group"
            >
              <div className="space-y-2.5">
                <div className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#D9C8AC] text-[#8F5C1A] font-serif-th font-bold text-sm flex items-center justify-center group-hover:bg-[#8F5C1A] group-hover:text-[#FFFFFF] transition-colors">
                  {idx + 1}
                </div>
                <h3 className="font-serif-th font-bold text-sm sm:text-base text-[#29261F]">
                  {step.name.replace(/^\d+\.\s*/, "")}
                </h3>
                <p className="font-serif-th text-xs text-[#635B4E] leading-relaxed">
                  {step.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ศาสตร์ 1909 RWS & PROVABLY FAIR (Text-Rich Explainer)
          ========================================================================= */}
      <section aria-labelledby="heritage-title" className="max-w-5xl mx-auto px-4">
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-br from-[#FFFFFF] to-[#FAF7F2] border border-[#D5CEC2] shadow-xs space-y-8">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[#8F5C1A] text-xs font-serif-th tracking-widest uppercase block">
              ✦ HERITAGE &amp; INTEGRITY
            </span>
            <h2 id="heritage-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F]">
              มนต์เสน่ห์ไพ่ 1909 Rider-Waite &amp; ระบบสับไพ่ Provably Fair
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#D9C8AC] flex items-center justify-center text-[#8F5C1A] text-lg font-serif-th">
                ✦
              </div>
              <h3 className="text-base font-serif-th font-bold text-[#29261F]">
                สำรับคลาสสิก 1909 ดั้งเดิม
              </h3>
              <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th leading-relaxed">
                ไพ่ทาโรต์ชุด 1909 Rider-Waite-Smith รังสรรค์ภาพโดย Pamela Colman Smith
                เป็นสำรับอันทรงคุณค่าที่บรรจุรหัสสัญลักษณ์ อัญเชิญพลังแห่งธาตุทั้งสี่ (ไฟ น้ำ ลม ดิน)
                และสะท้อนภาษากาย ทิศทางสายตา เพื่อสื่อสารกับจิตใต้สำนึกได้อย่างตรงจุดที่สุด
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#D9C8AC] flex items-center justify-center text-[#8F5C1A] text-lg font-serif-th">
                ✨
              </div>
              <h3 className="text-base font-serif-th font-bold text-[#29261F]">
                ระบบสุ่มโปร่งใส Provably Fair
              </h3>
              <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th leading-relaxed">
                แตกต่างจากระบบสุ่มทาโรต์ทั่วไป SeerTarot ผสานเทคโนโลยีเข้ารหัส SHA-256
                ล็อกลำดับสำรับไพ่ล่วงหน้าก่อนเปิด (Commit-Reveal) การันตี 100% ว่าไม่มีการแทรกแซง
                ไม่มีการล็อกผล ทุกใบที่ได้มาจากการสับไพ่และเลือกด้วยมือคุณเองอย่างแท้จริง
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF7F2] border border-[#D9C8AC] flex items-center justify-center text-[#8F5C1A] text-lg font-serif-th">
                ✦
              </div>
              <h3 className="text-base font-serif-th font-bold text-[#29261F]">
                จิตวิทยาและการพยากรณ์ AI
              </h3>
              <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th leading-relaxed">
                แม่หมอ AI ของเราได้รับการพัฒนาบนหลักการจิตวิเคราะห์เชิงลึกของ Carl Jung
                และคัมภีร์ Golden Dawn เคมีคู่ธาตุ วิเคราะห์พลังงานใต้คำถามเพื่อให้คำปรึกษาที่โอบอุ้มจิตใจ
                สร้างมุมมองใหม่ และเสริมพลังเจตจำนงให้คุณก้าวต่อไปได้อย่างมั่นใจ
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: ผังพยากรณ์และสารานุกรม 78 ใบ (Explore Spreads & Cards)
          ========================================================================= */}
      <section aria-labelledby="spreads-and-cards-title" className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[#8F5C1A] text-xs font-serif-th tracking-widest uppercase block">
              ✦ SPREADS &amp; CARDS
            </span>
            <h2 id="spreads-and-cards-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F]">
              ผังการเปิดไพ่พยากรณ์และสำรับไพ่ 78 ใบยอดนิยม
            </h2>
            <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th max-w-2xl">
              เลือกผังพยากรณ์ที่ตอบโจทย์ชีวิตของคุณ พร้อมเรียนรู้ความหมายไพ่ทาโรต์ 1909 ครบทั้ง 78 ใบ
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/spreads"
              className="text-xs font-serif-th font-semibold text-[#8F5C1A] hover:text-[#5E390A] transition-colors inline-flex items-center gap-1 group"
            >
              ดูผังทั้งหมด (20 ผัง) <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
            <span className="text-[#D5CEC2]">|</span>
            <Link
              href="/cards"
              className="text-xs font-serif-th font-semibold text-[#8F5C1A] hover:text-[#5E390A] transition-colors inline-flex items-center gap-1 group"
            >
              คลังไพ่ 78 ใบ <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>

        {/* Featured Spreads Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/spreads/celtic-cross"
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs group block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#D9C8AC] flex-shrink-0 bg-[#FAF7F2]">
                <CardImage image="major-10.jpg" alt="Celtic Cross Spread" className="w-full h-full object-cover" sizes="40px" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8F5C1A] font-semibold block">
                  10 CARDS
                </span>
                <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  ผังเซลติกครอส
                </h3>
              </div>
            </div>
            <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed">
              ผังราชาแห่งการพยากรณ์ ส่องชะตาชีวิตเจาะลึก 10 มิติ ทั้งจิตใต้สำนึก อุปสรรค และผลลัพธ์สูงสุด
            </p>
          </Link>

          <Link
            href="/spreads/three-cards"
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs group block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#D9C8AC] flex-shrink-0 bg-[#FAF7F2]">
                <CardImage image="major-17.jpg" alt="Three Cards Spread" className="w-full h-full object-cover" sizes="40px" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8F5C1A] font-semibold block">
                  3 CARDS
                </span>
                <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  ผัง 3 ใบ: อดีต-ปัจจุบัน-อนาคต
                </h3>
              </div>
            </div>
            <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed">
              ผังพยากรณ์สุดคลาสสิก เห็นภาพรวมเส้นทางชีวิต การเปลี่ยนแปลง และแนวโน้มข้างหน้าอย่างชัดเจน
            </p>
          </Link>

          <Link
            href="/spreads/two-paths"
            className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs group block"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-14 rounded-lg overflow-hidden border border-[#D9C8AC] flex-shrink-0 bg-[#FAF7F2]">
                <CardImage image="major-07.jpg" alt="Two Paths Decision Spread" className="w-full h-full object-cover" sizes="40px" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8F5C1A] font-semibold block">
                  5 CARDS
                </span>
                <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  ผังทางแยกการตัดสินใจ
                </h3>
              </div>
            </div>
            <p className="text-xs font-serif-th text-[#635B4E] leading-relaxed">
              เปรียบเทียบผลลัพธ์ของ 2 ทางเลือกอย่างเป็นกลาง ช่วยให้ตัดสินใจเรื่องสำคัญได้แม่นยำ
            </p>
          </Link>
        </div>

        {/* Featured Major Arcana Cards */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif-th font-bold text-sm sm:text-base text-[#29261F]">
              ✦ ไพ่ชุดใหญ่เมเจอร์ อาร์คานา (Major Arcana Highlights)
            </h3>
            <Link
              href="/cards"
              className="text-xs font-serif-th font-medium text-[#8F5C1A] hover:underline"
            >
              ดูทั้งหมด 78 ใบ
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { id: "major-00", nameTh: "เดอะฟูล", nameEn: "The Fool", img: "major-00.jpg" },
              { id: "major-01", nameTh: "เดอะเมจิเชียน", nameEn: "The Magician", img: "major-01.jpg" },
              { id: "major-02", nameTh: "เดอะไฮพรีสเตส", nameEn: "The High Priestess", img: "major-02.jpg" },
              { id: "major-06", nameTh: "เดอะเลิฟเวอร์ส", nameEn: "The Lovers", img: "major-06.jpg" },
              { id: "major-19", nameTh: "เดอะซัน", nameEn: "The Sun", img: "major-19.jpg" },
              { id: "major-21", nameTh: "เดอะเวิลด์", nameEn: "The World", img: "major-21.jpg" },
            ].map((card) => (
              <Link
                key={card.id}
                href={`/cards/${card.id}`}
                className="group flex flex-col items-center p-2.5 rounded-xl border border-[#D9C8AC]/40 hover:border-[#8F5C1A] bg-[#FAF7F2] hover:bg-[#FFFFFF] transition-all duration-200"
              >
                <div className="w-12 h-18 rounded-md overflow-hidden border border-[#D9C8AC] mb-2 shadow-2xs group-hover:scale-105 transition-transform duration-200">
                  <CardImage image={card.img} alt={card.nameEn} className="w-full h-full object-cover" sizes="48px" />
                </div>
                <span className="text-xs font-serif-th font-bold text-[#29261F] text-center line-clamp-1">
                  {card.nameTh}
                </span>
                <span className="text-[10px] text-[#635B4E] font-mono text-center line-clamp-1">
                  {card.nameEn}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: บทความและสาระน่ารู้ (Featured Articles)
          ========================================================================= */}
      <section aria-labelledby="articles-title" className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="text-[#8F5C1A] text-xs font-serif-th tracking-widest uppercase block">
              ✦ WISDOM &amp; ARTICLES
            </span>
            <h2 id="articles-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F]">
              คลังบทความและสาระน่ารู้เกี่ยวกับไพ่ทาโรต์
            </h2>
            <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th max-w-2xl">
              เจาะลึกเทคนิคการเปิดไพ่ ความหมายสัญลักษณ์โบราณ และศาสตร์จิตวิทยาไพ่ทาโรต์
            </p>
          </div>
          <Link
            href="/blog"
            className="text-xs font-serif-th font-semibold text-[#8F5C1A] hover:text-[#5E390A] transition-colors inline-flex items-center gap-1 group"
          >
            อ่านบทความทั้งหมด 20 เรื่อง <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              slug: "how-to-read-tarot-for-beginners",
              title: "วิธีเปิดไพ่ทาโรต์ด้วยตนเองสำหรับผู้เริ่มต้น: จากการตั้งจิตสู่คำทำนายที่แม่นยำ",
              category: "เทคนิคเปิดไพ่",
              desc: "คู่มือฉบับสมบูรณ์สำหรับการดูดวงไพ่ทาโรต์ด้วยตัวเอง วิธีตั้งจิตอธิษฐาน และการอ่านไพ่แบบไม่งมงาย",
            },
            {
              slug: "tarot-love-reading-guide",
              title: "ไพ่ทาโรต์บอกความรัก: วิธีดูดวงความสัมพันธ์ เนื้อคู่ และความรู้สึกของเขา",
              category: "ความรัก & สัมพันธ์",
              desc: "ถอดรหัสไพ่บอกรัก ไพ่เตือนภัยความสัมพันธ์ และวิธีถามไพ่เรื่องความรักให้ได้คำตอบที่แท้จริง",
            },
            {
              slug: "celtic-cross-spread-deep-dive",
              title: "ถอดรหัสผังเซลติกครอส (Celtic Cross): ความหมายทั้ง 10 ตำแหน่งแบบเจาะลึก",
              category: "ผังพยากรณ์",
              desc: "ทำความเข้าใจผังพยากรณ์ยอดนิยมตลอดกาล แกะรอยความเชื่อมโยงของไพ่แต่ละตำแหน่งอย่างละเอียด",
            },
            {
              slug: "jungian-psychology-and-tarot",
              title: "จิตวิทยาของ Carl Jung กับไพ่ทาโรต์: สัญลักษณ์ สภาวะจิตใต้สำนึก และการเติบโตของจิตวิญญาณ",
              category: "จิตวิทยา & AI",
              desc: "สำรวจความเชื่อมโยงระหว่าง Archetypes ของคาร์ล ยุง กับไพ่ทาโรต์ 1909 Rider-Waite",
            },
          ].map((art) => (
            <Link
              key={art.slug}
              href={`/blog/${art.slug}`}
              className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs group block space-y-2.5"
            >
              <span className="text-[11px] font-serif-th font-semibold text-[#8F5C1A] bg-[#FAF7F2] px-2.5 py-0.5 rounded-full border border-[#D9C8AC]">
                {art.category}
              </span>
              <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors line-clamp-2">
                {art.title}
              </h3>
              <p className="font-serif-th text-xs text-[#635B4E] line-clamp-2 leading-relaxed">
                {art.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: คำถามที่พบบ่อย (FAQ Accordion)
          ========================================================================= */}
      <section aria-labelledby="faq-title" className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-[#8F5C1A] text-xs font-serif-th tracking-widest uppercase block">
            ✦ FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 id="faq-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F]">
            คำถามที่พบบ่อยเกี่ยวกับการดูดวงไพ่ทาโรต์ (FAQ)
          </h2>
          <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th max-w-xl mx-auto">
            ไขข้อข้องใจเกี่ยวกับระบบดูดวงออนไลน์ ความแม่นยำ และหลักการทำงานของ SeerTarot
          </p>
        </div>

        <div className="space-y-3">
          {HOME_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-[#FFFFFF] border border-[#D5CEC2] overflow-hidden transition-colors duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left font-serif-th font-bold text-sm sm:text-base text-[#29261F] hover:text-[#8F5C1A] transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="text-[#8F5C1A] text-xs">✦</span>
                    {faq.question}
                  </span>
                  <span
                    className={`text-sm text-[#8F5C1A] transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className="px-5 pb-5 pt-1 text-xs sm:text-sm font-serif-th text-[#635B4E] leading-relaxed border-t border-[#D5CEC2]/40"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FAT FOOTER (Comprehensive Internal Link Architecture)
          ========================================================================= */}
      <footer className="w-full bg-[#1A1815] text-[#D5CEC2] pt-14 pb-10 border-t-2 border-[#8F5C1A]/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          {/* AI Disclosure Card */}
          <div className="flex items-start gap-4 p-5 rounded-xl bg-[#23201C] border border-[#D5CEC2]/20 shadow-sm">
            <div className="w-9 h-13 sm:w-10 sm:h-15 rounded-lg overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
              <CardImage
                image="major-02.jpg"
                alt="The High Priestess - ข้อควรทราบเกี่ยวกับการทำนาย"
                className="w-full h-full object-cover"
                sizes="40px"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className="text-[13px] font-bold text-[#A58A5C] uppercase tracking-wider font-serif-th">
                ข้อควรทราบเกี่ยวกับการทำนาย
              </h3>
              <p className="text-[13px] text-[#D5CEC2] leading-[1.7] font-serif-th">
                คำทำนายทั้งหมดประมวลผลด้วยระบบ AI จากหน้าไพ่ที่คุณเลือกและเปิดจริง จัดทำขึ้นเพื่อเป็นแนวทางและข้อคิดในการดำเนินชีวิต ไม่สามารถใช้แทนคำปรึกษาทางการแพทย์ กฎหมาย หรือการเงินได้ การตัดสินใจทุกอย่างยังคงเป็นของคุณเสมอ
              </p>
            </div>
          </div>

          {/* Top 4-Column Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {/* Col 1: ผังพยากรณ์ยอดนิยม */}
            <div className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                ✦ ผังการเปิดไพ่
              </h3>
              <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                <li>
                  <Link href="/spreads" className="hover:text-[#FAF7F2] transition-colors">
                    คลังผังพยากรณ์ทั้งหมด (20 แบบ)
                  </Link>
                </li>
                <li>
                  <Link href="/spreads/celtic-cross" className="hover:text-[#FAF7F2] transition-colors">
                    ผังเซลติกครอส (Celtic Cross 10 ใบ)
                  </Link>
                </li>
                <li>
                  <Link href="/spreads/three-cards" className="hover:text-[#FAF7F2] transition-colors">
                    ผัง 3 ใบ อดีต-ปัจจุบัน-อนาคต
                  </Link>
                </li>
                <li>
                  <Link href="/spreads/two-paths" className="hover:text-[#FAF7F2] transition-colors">
                    ผังทางแยกการตัดสินใจ (5 ใบ)
                  </Link>
                </li>
                <li>
                  <Link href="/spreads/daily-guidance" className="hover:text-[#FAF7F2] transition-colors">
                    ผังดวงประจำวัน (Daily Guidance)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: สารานุกรมไพ่ 78 ใบ */}
            <div className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                ✦ สำรับไพ่ 1909
              </h3>
              <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                <li>
                  <Link href="/cards" className="hover:text-[#FAF7F2] transition-colors">
                    สารานุกรมความหมายไพ่ 78 ใบ
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-00" className="hover:text-[#FAF7F2] transition-colors">
                    The Fool (0 · คนเขลาผู้กล้าหาญ)
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-01" className="hover:text-[#FAF7F2] transition-colors">
                    The Magician (I · ผู้สรรค์สร้าง)
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-02" className="hover:text-[#FAF7F2] transition-colors">
                    The High Priestess (II · สัญชาตญาณ)
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-06" className="hover:text-[#FAF7F2] transition-colors">
                    The Lovers (VI · ทางเลือกแห่งหัวใจ)
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-19" className="hover:text-[#FAF7F2] transition-colors">
                    The Sun (XIX · ความสุขและความสำเร็จ)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: บทความและสาระน่ารู้ */}
            <div className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                ✦ บทความน่ารู้
              </h3>
              <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                <li>
                  <Link href="/blog" className="hover:text-[#FAF7F2] transition-colors">
                    คลังบทความทั้งหมด 20 เรื่อง
                  </Link>
                </li>
                <li>
                  <Link href="/blog/how-to-read-tarot-for-beginners" className="hover:text-[#FAF7F2] transition-colors">
                    วิธีเปิดไพ่สำหรับผู้เริ่มต้น
                  </Link>
                </li>
                <li>
                  <Link href="/blog/tarot-love-reading-guide" className="hover:text-[#FAF7F2] transition-colors">
                    วิธีอ่านไพ่ทาโรต์เรื่องความรัก
                  </Link>
                </li>
                <li>
                  <Link href="/blog/celtic-cross-spread-deep-dive" className="hover:text-[#FAF7F2] transition-colors">
                    ถอดรหัสผังเซลติกครอส 10 ตำแหน่ง
                  </Link>
                </li>
                <li>
                  <Link href="/blog/jungian-psychology-and-tarot" className="hover:text-[#FAF7F2] transition-colors">
                    จิตวิทยาของ Carl Jung กับไพ่ทาโรต์
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: ความโปร่งใส & ช่วยเหลือ */}
            <div className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                ✦ ปลอดภัย &amp; โปร่งใส
              </h3>
              <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                <li>
                  <span className="text-[#A58A5C] font-semibold">Provably Fair SHA-256</span>
                  <p className="text-[11px] text-[#D5CEC2]/60">การันตีสลับไพ่โปร่งใสตรวจสอบได้</p>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#FAF7F2] transition-colors">
                    นโยบายความเป็นส่วนตัว (PDPA)
                  </Link>
                </li>
                <li className="pt-1">
                  <span className="text-[#3A7044] font-semibold">สายด่วนสุขภาพจิต 1323</span>
                  <p className="text-[11px] text-[#D5CEC2]/60">ปรึกษาผู้เชี่ยวชาญโทรฟรี 24 ชม.</p>
                </li>
                <li>
                  <span className="text-[#A6392C] font-semibold">เหตุฉุกเฉิน 1669</span>
                  <p className="text-[11px] text-[#D5CEC2]/60">แจ้งเหตุเจ็บป่วยฉุกเฉิน 24 ชม.</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Disclaimer Strip */}
          <div className="pt-8 border-t border-[#D5CEC2]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-serif-th text-[#D5CEC2]/70">
            <div className="flex items-center gap-2">
              <div className="w-5 h-7 rounded overflow-hidden border border-[#D5CEC2]/30 flex-shrink-0 bg-[#171512]">
                <CardImage image="major-01.jpg" alt="The Magician" className="w-full h-full object-cover" sizes="20px" />
              </div>
              <span>SeerTarot · วิหารพยากรณ์ไพ่ทาโรต์ 1909 Rider-Waite ออนไลน์</span>
            </div>
            <p className="text-center sm:text-right">
              © 2026 SeerTarot · สงวนลิขสิทธิ์ ·{" "}
              <Link href="/privacy" className="hover:text-[#FAF7F2] transition-colors underline">
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
