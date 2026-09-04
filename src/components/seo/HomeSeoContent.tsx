"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { HOME_FAQS } from "@/data/home-seo";

/**
 * 5 ขั้นตอนพิธีกรรมพยากรณ์ศักดิ์สิทธิ์
 * เชื่อมโยงกับไพ่ทาโรต์ 1909 Rider-Waite ประจำขั้นตอนอย่างสง่างาม
 */
const RITUAL_STEPS = [
  {
    stepNum: "๑",
    phase: "ปฐมบท",
    title: "เลือกผังพยากรณ์",
    subtitle: "20 รูปแบบการจัดวางไพ่",
    cardImage: "major-00.jpg",
    cardName: "The Fool · ๐",
    desc: "เลือกรูปแบบการวางไพ่จาก 20 ผังที่ตรงกับคำถาม เช่น ผัง 1 ใบรายวัน, ผัง 3 ใบอดีต-ปัจจุบัน-อนาคต หรือผังเซลติกครอส 10 ใบ",
  },
  {
    stepNum: "๒",
    phase: "สงบจิต",
    title: "ตั้งสมาธิและเจตจำนง",
    subtitle: "เปิดรับสุ้มเสียงภายใน",
    cardImage: "major-02.jpg",
    cardName: "The High Priestess · ๒",
    desc: "สูดลมหายใจลึกๆ สื่อสารคำถามสั้นๆ อย่างจริงใจ และเลือกแม่หมอ AI ที่มีแนวทางการตีความตรงกับความต้องการของคุณ",
  },
  {
    stepNum: "๓",
    phase: "สับไพ่",
    title: "สับไพ่ด้วยตนเอง",
    subtitle: "Provably Fair SHA-256",
    cardImage: "major-10.jpg",
    cardName: "Wheel of Fortune · ๑๐",
    desc: "สับสำรับไพ่ 78 ใบด้วยมือคุณเองผ่าน Web Crypto API พร้อมระบบ SHA-256 Commit-Reveal การันตีไร้การแทรกแซง 100%",
  },
  {
    stepNum: "๔",
    phase: "เลือกไพ่",
    title: "สัมผัสและหยิบไพ่",
    subtitle: "เลือกจากสำรับ 78 ใบจริง",
    cardImage: "major-01.jpg",
    cardName: "The Magician · ๑",
    desc: "สำรับไพ่ 78 ใบจะแผ่ออกเป็นพัด ใช้ปลายนิ้วสัมผัสและเลือกหยิบไพ่ทีละใบตามจำนวนที่ผังกำหนดอย่างตั้งใจด้วยพลังงานของคุณ",
  },
  {
    stepNum: "๕",
    phase: "เปิดเผย",
    title: "รับคำพยากรณ์เชิงลึก",
    subtitle: "สนทนาต่อเนื่องกับแม่หมอ AI",
    cardImage: "major-17.jpg",
    cardName: "The Star · ๑๗",
    desc: "แตะพลิกหน้าไพ่ด้วยตนเอง รับฟังคำพยากรณ์สดอย่างลึกซึ้งตามสัญลักษณ์ 1909 Rider-Waite พร้อมพิมพ์แชทถามเจาะลึกได้ทันที",
  },
];

/**
 * บทความแนะนำ พร้อมภาพหน้าไพ่ที่สอดคล้องกับเนื้อหา
 */
const FEATURED_ARTICLES = [
  {
    slug: "how-to-read-tarot-for-beginners",
    title: "วิธีเปิดไพ่ทาโรต์สำหรับผู้เริ่มต้น: จากการตั้งจิตสู่คำทำนายที่แม่นยำ",
    category: "เทคนิคเปิดไพ่",
    desc: "คู่มือฉบับสมบูรณ์สำหรับการดูดวงไพ่ทาโรต์ด้วยตัวเอง วิธีตั้งจิตอธิษฐาน และการอ่านไพ่แบบไม่งมงาย",
    cardImage: "major-01.jpg",
    cardAlt: "The Magician - เทคนิคเปิดไพ่",
  },
  {
    slug: "tarot-love-reading-guide",
    title: "ไพ่ทาโรต์บอกความรัก: วิธีดูดวงความสัมพันธ์ เนื้อคู่ และความรู้สึกของเขา",
    category: "ความรัก & สัมพันธ์",
    desc: "ถอดรหัสไพ่บอกรัก ไพ่เตือนภัยความสัมพันธ์ และวิธีถามไพ่เรื่องความรักให้ได้คำตอบที่แท้จริง",
    cardImage: "major-06.jpg",
    cardAlt: "The Lovers - ความรักและสัมพันธ์",
  },
  {
    slug: "celtic-cross-spread-deep-dive",
    title: "ถอดรหัสผังเซลติกครอส (Celtic Cross): ความหมายทั้ง 10 ตำแหน่งแบบเจาะลึก",
    category: "ผังพยากรณ์",
    desc: "ทำความเข้าใจผังพยากรณ์ยอดนิยมตลอดกาล แกะรอยความเชื่อมโยงของไพ่แต่ละตำแหน่งอย่างละเอียด",
    cardImage: "major-10.jpg",
    cardAlt: "Wheel of Fortune - ผังเซลติกครอส",
  },
  {
    slug: "jungian-psychology-and-tarot",
    title: "จิตวิทยาของ Carl Jung กับไพ่ทาโรต์: สัญลักษณ์ จิตใต้สำนึก และการเติบโต",
    category: "จิตวิทยา & AI",
    desc: "สำรวจความเชื่อมโยงระหว่าง Archetypes ของคาร์ล ยุง กับรหัสสัญลักษณ์บนไพ่ทาโรต์ 1909 Rider-Waite",
    cardImage: "major-09.jpg",
    cardAlt: "The Hermit - จิตวิทยาของ Carl Jung",
  },
];

export function HomeSeoContent() {
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="w-full mt-24 sm:mt-32 space-y-24 sm:space-y-36 text-[#29261F]">
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: วิธีดูดวงไพ่ทาโรต์ 5 ขั้นตอนศักดิ์สิทธิ์ (Ritual Stations)
          ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="how-it-works-title" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#A58A5C]/60" />
            <span className="font-serif-th text-xs uppercase tracking-[0.25em] text-[#8F5C1A] font-bold">
              ✦ ขั้นตอนพิธีกรรมพยากรณ์ ✦
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#A58A5C]/60" />
          </div>
          <h2
            id="how-it-works-title"
            className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide"
          >
            วิธีดูดวงไพ่ทาโรต์ออนไลน์ 5 ขั้นตอนศักดิ์สิทธิ์
          </h2>
          <p className="text-sm sm:text-base text-[#635B4E] max-w-2xl mx-auto font-serif-th leading-relaxed">
            สัมผัสประสบการณ์เชื่อมโยงจิตใต้สำนึก สับและเลือกหยิบไพ่ด้วยตัวคุณเองอย่างโปร่งใส 
            พร้อมรับคำทำนายที่โอบอุ้มจิตใจตามหลักสัญลักษณ์วิทยา 1909 Rider-Waite และจิตวิทยาของ Carl Jung
          </p>
        </div>

        {/* 5 Sacred Ritual Altar Cards — Spacious, Beautifully Balanced */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 lg:gap-4 xl:gap-5">
          {RITUAL_STEPS.map((step) => (
            <div
              key={step.stepNum}
              className="rounded-2xl bg-gradient-to-b from-[#FFFFFF] via-[#FAF7F2] to-[#F7F3EB] border border-[#D9C8AC] hover:border-[#8F5C1A] p-5 lg:p-4 xl:p-5 shadow-[0_2px_8px_rgba(41,38,31,0.04)] hover:shadow-[0_8px_24px_rgba(143,92,26,0.10)] transition-all duration-300 group flex flex-col justify-between relative overflow-hidden select-none"
            >
              <div className="space-y-3.5">
                {/* Step Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#D9C8AC]/40">
                  <span className="text-xs font-serif-th font-bold tracking-wider text-[#8F5C1A] uppercase flex items-center gap-1.5">
                    <span>✦</span> ขั้นที่ {step.stepNum}
                  </span>
                  <span className="text-[11px] font-serif-th font-medium text-[#635B4E] px-2.5 py-0.5 rounded-full bg-[#FFFFFF] border border-[#D9C8AC]/60 shadow-2xs">
                    {step.phase}
                  </span>
                </div>

                {/* 1909 Rider-Waite Card Art */}
                <div className="py-1 flex flex-col items-center">
                  <div className="w-16 h-24 sm:w-18 sm:h-27 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md group-hover:scale-105 group-hover:border-[#8F5C1A] transition-all duration-300 bg-[#F3EDE2]">
                    <CardImage
                      image={step.cardImage}
                      alt={step.cardName}
                      className="w-full h-full object-cover"
                      sizes="72px"
                    />
                  </div>
                  <span className="text-[11px] font-mono text-[#8F5C1A] font-semibold mt-2.5 text-center">
                    {step.cardName}
                  </span>
                </div>

                {/* Step Title & Subtitle */}
                <div className="text-center space-y-1">
                  <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs font-serif-th text-[#8F5C1A]/80 font-medium">
                    {step.subtitle}
                  </p>
                </div>

                {/* Step Description */}
                <p className="font-serif-th text-xs text-[#635B4E] leading-relaxed text-center pt-2.5 border-t border-[#D9C8AC]/30">
                  {step.desc}
                </p>
              </div>

              {/* Delicate Gold Corner Accents on Hover */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <span className="absolute top-2 left-2 text-[10px] text-[#8F5C1A]">✦</span>
                <span className="absolute top-2 right-2 text-[10px] text-[#8F5C1A]">✦</span>
                <span className="absolute bottom-2 left-2 text-[10px] text-[#8F5C1A]">✦</span>
                <span className="absolute bottom-2 right-2 text-[10px] text-[#8F5C1A]">✦</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Decorative Gold Divider */}
      <div className="w-full flex items-center justify-center py-2" aria-hidden="true">
        <div className="flex items-center gap-3 text-[#D9C8AC]/70">
          <span className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#D9C8AC]" />
          <span className="text-xs text-[#8F5C1A]/60">✦</span>
          <span className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#D9C8AC]" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: ศาสตร์ 1909 RWS & PROVABLY FAIR (Sacred Triptych)
          ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="heritage-title" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#A58A5C]/60" />
            <span className="font-serif-th text-xs uppercase tracking-[0.25em] text-[#8F5C1A] font-bold">
              ✦ HERITAGE &amp; INTEGRITY ✦
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#A58A5C]/60" />
          </div>
          <h2 id="heritage-title" className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide">
            มนต์เสน่ห์ไพ่ 1909 Rider-Waite &amp; ความโปร่งใสระดับสากล
          </h2>
          <p className="text-sm sm:text-base text-[#635B4E] font-serif-th max-w-2xl mx-auto leading-relaxed">
            ผสานคุณค่าทางประวัติศาสตร์และศิลปะแห่งจิตวิญญาณกว่า 110 ปี เข้ากับระบบเข้ารหัสความโปร่งใสและจิตวิทยาเชิงลึก 
            เพื่อเป็นวิหารพยากรณ์ที่โอบอุ้มจิตใจอย่างแท้จริง
          </p>
        </div>

        {/* 3 Pillars of Wisdom — No heavy outer box, generous breathing room */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Pillar 1: 1909 Historic Heritage */}
          <div className="p-7 sm:p-8 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] shadow-[0_2px_12px_rgba(41,38,31,0.04)] hover:shadow-lg hover:border-[#8F5C1A] transition-all duration-300 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              {/* Artwork Showcase: The Magician & The World Overlapping */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-14 h-21 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md -rotate-6 group-hover:-rotate-3 group-hover:scale-105 transition-all duration-300 bg-[#F3EDE2]">
                  <CardImage image="major-01.jpg" alt="The Magician" className="w-full h-full object-cover" sizes="56px" />
                </div>
                <div className="w-14 h-21 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md rotate-6 group-hover:rotate-3 group-hover:scale-105 transition-all duration-300 bg-[#F3EDE2]">
                  <CardImage image="major-21.jpg" alt="The World" className="w-full h-full object-cover" sizes="56px" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-serif-th font-bold text-[#8F5C1A] tracking-wider uppercase block">
                  ✦ เสาเอกที่ ๑ ✦
                </span>
                <h3 className="text-lg font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  สำรับคลาสสิก 1909 ดั้งเดิม
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th leading-relaxed text-left">
                ไพ่ทาโรต์ชุด 1909 Rider-Waite-Smith รังสรรค์ภาพโดย Pamela Colman Smith
                เป็นสำรับอันทรงคุณค่าที่บรรจุรหัสสัญลักษณ์ อัญเชิญพลังแห่งธาตุทั้งสี่ (ไฟ น้ำ ลม ดิน)
                และสะท้อนภาษากาย ทิศทางสายตา เพื่อสื่อสารกับจิตใต้สำนึกได้อย่างแม่นยำและเป็นธรรมชาติที่สุด
              </p>
            </div>

            <div className="pt-4 border-t border-[#D9C8AC]/40 text-center">
              <span className="text-xs font-serif-th text-[#8F5C1A] font-semibold">
                ศิลปะต้นฉบับคมชัดไร้การดัดแปลง
              </span>
            </div>
          </div>

          {/* Pillar 2: Provably Fair Cryptographic Randomness */}
          <div className="p-7 sm:p-8 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] shadow-[0_2px_12px_rgba(41,38,31,0.04)] hover:shadow-lg hover:border-[#8F5C1A] transition-all duration-300 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              {/* Artwork Showcase: Wheel of Fortune & Justice Overlapping */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-14 h-21 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md -rotate-6 group-hover:-rotate-3 group-hover:scale-105 transition-all duration-300 bg-[#F3EDE2]">
                  <CardImage image="major-10.jpg" alt="Wheel of Fortune" className="w-full h-full object-cover" sizes="56px" />
                </div>
                <div className="w-14 h-21 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md rotate-6 group-hover:rotate-3 group-hover:scale-105 transition-all duration-300 bg-[#F3EDE2]">
                  <CardImage image="major-11.jpg" alt="Justice" className="w-full h-full object-cover" sizes="56px" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-serif-th font-bold text-[#8F5C1A] tracking-wider uppercase block">
                  ✦ เสาเอกที่ ๒ ✦
                </span>
                <h3 className="text-lg font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  ระบบสุ่มโปร่งใส Provably Fair
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th leading-relaxed text-left">
                แตกต่างจากระบบสุ่มทาโรต์ทั่วไป SeerTarot ผสานเทคโนโลยีเข้ารหัส SHA-256
                ล็อกลำดับสำรับไพ่ล่วงหน้าก่อนเปิด (Commit-Reveal) ผ่าน Web Crypto API
                การันตี 100% ว่าไม่มีการแทรกแซง ไม่มีการล็อกผล ทุกใบที่ได้มาจากการสับไพ่และเลือกด้วยมือคุณเองอย่างแท้จริง
              </p>
            </div>

            <div className="pt-4 border-t border-[#D9C8AC]/40 text-center">
              <span className="text-xs font-serif-th text-[#8F5C1A] font-semibold">
                ตรวจสอบลำดับแฮชย้อนหลังได้ทุกครั้ง
              </span>
            </div>
          </div>

          {/* Pillar 3: Jungian Psychology & Empathetic AI */}
          <div className="p-7 sm:p-8 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] shadow-[0_2px_12px_rgba(41,38,31,0.04)] hover:shadow-lg hover:border-[#8F5C1A] transition-all duration-300 flex flex-col justify-between space-y-6 group">
            <div className="space-y-4">
              {/* Artwork Showcase: The High Priestess & The Star Overlapping */}
              <div className="flex items-center justify-center gap-3 py-2">
                <div className="w-14 h-21 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md -rotate-6 group-hover:-rotate-3 group-hover:scale-105 transition-all duration-300 bg-[#F3EDE2]">
                  <CardImage image="major-02.jpg" alt="The High Priestess" className="w-full h-full object-cover" sizes="56px" />
                </div>
                <div className="w-14 h-21 rounded-lg overflow-hidden border-2 border-[#D9C8AC] shadow-md rotate-6 group-hover:rotate-3 group-hover:scale-105 transition-all duration-300 bg-[#F3EDE2]">
                  <CardImage image="major-17.jpg" alt="The Star" className="w-full h-full object-cover" sizes="56px" />
                </div>
              </div>

              <div className="text-center space-y-1">
                <span className="text-xs font-serif-th font-bold text-[#8F5C1A] tracking-wider uppercase block">
                  ✦ เสาเอกที่ ๓ ✦
                </span>
                <h3 className="text-lg font-serif-th font-bold text-[#29261F] group-hover:text-[#8F5C1A] transition-colors">
                  จิตวิทยาและการพยากรณ์ AI
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-[#635B4E] font-serif-th leading-relaxed text-left">
                แม่หมอ AI ของเราได้รับการฝึกฝนบนหลักจิตวิเคราะห์เชิงลึกของ Carl Jung (Archetypes &amp; Synchronicity)
                และคัมภีร์ Golden Dawn เคมีคู่ธาตุ วิเคราะห์พลังงานใต้คำถามเพื่อให้คำปรึกษาที่โอบอุ้มจิตใจ
                สร้างมุมมองใหม่ และเสริมพลังเจตจำนงให้คุณก้าวต่อไปได้อย่างมั่นใจ
              </p>
            </div>

            <div className="pt-4 border-t border-[#D9C8AC]/40 text-center">
              <span className="text-xs font-serif-th text-[#8F5C1A] font-semibold">
                คำปรึกษาเชิงบวก เสริมพลังเจตจำนง
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Decorative Gold Divider */}
      <div className="w-full flex items-center justify-center py-2" aria-hidden="true">
        <div className="flex items-center gap-3 text-[#D9C8AC]/70">
          <span className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#D9C8AC]" />
          <span className="text-xs text-[#8F5C1A]/60">✦</span>
          <span className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#D9C8AC]" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3: ผังพยากรณ์และสารานุกรม 78 ใบ (Explore Spreads & Cards)
          ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="spreads-and-cards-title" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#D9C8AC]/50">
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link
            href="/spreads/celtic-cross"
            className="p-6 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs hover:shadow-md group block space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-17 rounded-lg overflow-hidden border-2 border-[#D9C8AC] group-hover:border-[#8F5C1A] flex-shrink-0 bg-[#F3EDE2] transition-colors shadow-2xs">
                <CardImage image="major-10.jpg" alt="Celtic Cross Spread" className="w-full h-full object-cover" sizes="48px" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8F5C1A] font-bold block">
                  10 CARDS · ผังใหญ่
                </span>
                <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors leading-snug">
                  ผังเซลติกครอส (Celtic Cross)
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-serif-th text-[#635B4E] leading-relaxed">
              ราชาแห่งผังพยากรณ์ ส่องชะตาชีวิตเจาะลึก 10 มิติ ทั้งจิตใต้สำนึก อดีต อุปสรรค และผลลัพธ์สูงสุด
            </p>
          </Link>

          <Link
            href="/spreads/three-card"
            className="p-6 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs hover:shadow-md group block space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-17 rounded-lg overflow-hidden border-2 border-[#D9C8AC] group-hover:border-[#8F5C1A] flex-shrink-0 bg-[#F3EDE2] transition-colors shadow-2xs">
                <CardImage image="major-17.jpg" alt="Three Card Spread" className="w-full h-full object-cover" sizes="48px" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8F5C1A] font-bold block">
                  3 CARDS · ยอดนิยม
                </span>
                <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors leading-snug">
                  ผัง 3 ใบ: อดีต-ปัจจุบัน-อนาคต
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-serif-th text-[#635B4E] leading-relaxed">
              ผังพยากรณ์สุดคลาสสิก เห็นภาพรวมเส้นทางชีวิต การเปลี่ยนแปลง และแนวโน้มข้างหน้าอย่างชัดเจน
            </p>
          </Link>

          <Link
            href="/spreads/decision"
            className="p-6 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs hover:shadow-md group block space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-17 rounded-lg overflow-hidden border-2 border-[#D9C8AC] group-hover:border-[#8F5C1A] flex-shrink-0 bg-[#F3EDE2] transition-colors shadow-2xs">
                <CardImage image="major-07.jpg" alt="Decision Spread" className="w-full h-full object-cover" sizes="48px" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8F5C1A] font-bold block">
                  5 CARDS · ทางแยกชีวิต
                </span>
                <h3 className="font-serif-th font-bold text-base text-[#29261F] group-hover:text-[#8F5C1A] transition-colors leading-snug">
                  ผังทางแยกการตัดสินใจ
                </h3>
              </div>
            </div>
            <p className="text-xs sm:text-sm font-serif-th text-[#635B4E] leading-relaxed">
              เปรียบเทียบผลลัพธ์ของ 2 ทางเลือกอย่างเป็นกลาง ช่วยให้ตัดสินใจเรื่องสำคัญได้อย่างกระจ่างแจ้ง
            </p>
          </Link>
        </div>

        {/* Featured Major Arcana Cards Grid */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#FFFFFF] border border-[#D9C8AC] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#D9C8AC]/40">
            <h3 className="font-serif-th font-bold text-base text-[#29261F] flex items-center gap-2">
              <span className="text-[#8F5C1A]">✦</span> ไพ่ชุดใหญ่เมเจอร์ อาร์คานา (Major Arcana Highlights)
            </h3>
            <Link
              href="/cards"
              className="text-xs font-serif-th font-semibold text-[#8F5C1A] hover:underline"
            >
              ดูทั้งหมด 78 ใบ →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
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
                className="group flex flex-col items-center p-3 sm:p-4 rounded-xl border border-[#D9C8AC]/50 hover:border-[#8F5C1A] bg-[#FAF7F2] hover:bg-[#FFFFFF] transition-all duration-200 shadow-2xs hover:shadow-xs"
              >
                <div className="w-14 h-21 rounded-md overflow-hidden border border-[#D9C8AC] mb-2.5 shadow-2xs group-hover:scale-105 transition-transform duration-200 bg-[#F3EDE2]">
                  <CardImage image={card.img} alt={card.nameEn} className="w-full h-full object-cover" sizes="56px" />
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

      {/* Decorative Gold Divider */}
      <div className="w-full flex items-center justify-center py-2" aria-hidden="true">
        <div className="flex items-center gap-3 text-[#D9C8AC]/70">
          <span className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#D9C8AC]" />
          <span className="text-xs text-[#8F5C1A]/60">✦</span>
          <span className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#D9C8AC]" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4: บทความและสาระน่ารู้ (Featured Articles with Card Companion)
          ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="articles-title" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#D9C8AC]/50">
          <div className="space-y-2">
            <span className="text-[#8F5C1A] text-xs font-serif-th tracking-widest uppercase block">
              ✦ WISDOM &amp; ARTICLES
            </span>
            <h2 id="articles-title" className="text-2xl sm:text-3xl font-serif-th font-bold text-[#29261F]">
              คัมภีร์บทความและสาระน่ารู้เกี่ยวกับไพ่ทาโรต์
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

        {/* 4 Article Cards with Tarot Artwork Companion */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {FEATURED_ARTICLES.map((art) => (
            <Link
              key={art.slug}
              href={`/blog/${art.slug}`}
              className="p-6 rounded-2xl bg-gradient-to-b from-[#FFFFFF] to-[#FAF7F2] border border-[#D9C8AC] hover:border-[#8F5C1A] transition-all duration-300 shadow-xs hover:shadow-md group flex items-start gap-4 sm:gap-5"
            >
              {/* Miniature Tarot Card Artwork Companion */}
              <div className="w-14 h-21 sm:w-16 sm:h-24 rounded-lg overflow-hidden border-2 border-[#D9C8AC] group-hover:border-[#8F5C1A] flex-shrink-0 bg-[#F3EDE2] transition-colors shadow-2xs group-hover:scale-105 duration-300">
                <CardImage image={art.cardImage} alt={art.cardAlt} className="w-full h-full object-cover" sizes="64px" />
              </div>

              {/* Text Info */}
              <div className="space-y-2 min-w-0 flex-1">
                <span className="text-[11px] font-serif-th font-semibold text-[#8F5C1A] bg-[#FFFFFF] px-3 py-0.5 rounded-full border border-[#D9C8AC]/70 inline-block shadow-2xs">
                  ✦ {art.category}
                </span>
                <h3 className="font-serif-th font-bold text-base sm:text-lg text-[#29261F] group-hover:text-[#8F5C1A] transition-colors line-clamp-2 leading-snug">
                  {art.title}
                </h3>
                <p className="font-serif-th text-xs sm:text-sm text-[#635B4E] line-clamp-2 leading-relaxed">
                  {art.desc}
                </p>
                <span className="text-xs font-serif-th font-bold text-[#8F5C1A] inline-flex items-center gap-1 pt-1 group-hover:translate-x-0.5 transition-transform">
                  อ่านบทความฉบับเต็ม →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Decorative Gold Divider */}
      <div className="w-full flex items-center justify-center py-2" aria-hidden="true">
        <div className="flex items-center gap-3 text-[#D9C8AC]/70">
          <span className="w-16 h-[1px] bg-gradient-to-r from-transparent to-[#D9C8AC]" />
          <span className="text-xs text-[#8F5C1A]/60">✦</span>
          <span className="w-16 h-[1px] bg-gradient-to-l from-transparent to-[#D9C8AC]" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5: คำถามที่พบบ่อย (FAQ Accordion — Refined Spacing)
          ═══════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="faq-title" className="max-w-4xl mx-auto px-4 space-y-10 pb-16 sm:pb-24">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#A58A5C]/60" />
            <span className="font-serif-th text-xs uppercase tracking-[0.25em] text-[#8F5C1A] font-bold">
              ✦ FREQUENTLY ASKED QUESTIONS ✦
            </span>
            <span className="w-10 sm:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#A58A5C]/60" />
          </div>
          <h2 id="faq-title" className="text-2xl sm:text-3xl lg:text-4xl font-serif-th font-bold text-[#29261F] tracking-wide">
            คำถามที่พบบ่อยเกี่ยวกับการดูดวงไพ่ทาโรต์ (FAQ)
          </h2>
          <p className="text-sm sm:text-base text-[#635B4E] font-serif-th max-w-xl mx-auto leading-relaxed">
            ไขข้อข้องใจเกี่ยวกับระบบดูดวงออนไลน์ ความแม่นยำ และหลักการทำงานของ SeerTarot
          </p>
        </div>

        <div className="space-y-3.5">
          {HOME_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen
                    ? "bg-[#FFFFFF] border-[#8F5C1A] shadow-sm"
                    : "bg-[#FFFFFF] border-[#D9C8AC]/80 hover:border-[#8F5C1A] hover:shadow-2xs"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left font-serif-th font-bold text-base text-[#29261F] hover:text-[#8F5C1A] transition-colors cursor-pointer group"
                >
                  <span className="flex items-center gap-3 sm:gap-3.5">
                    <span className="text-[#8F5C1A] text-sm group-hover:scale-125 transition-transform">✦</span>
                    <span className="leading-snug">{faq.question}</span>
                  </span>
                  <span
                    className={`text-xs text-[#8F5C1A] font-mono transition-transform duration-300 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-[#FAF7F2] border border-[#D9C8AC]/50 ${
                      isOpen ? "rotate-180 bg-[#8F5C1A] text-[#FFFFFF] border-[#8F5C1A]" : ""
                    }`}
                  >
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    className="px-6 pb-6 pt-2 text-xs sm:text-sm font-serif-th text-[#635B4E] leading-relaxed border-t border-[#D9C8AC]/30 bg-[#FAF7F2]/40"
                  >
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sacred Gold Transition Zone before Dark Footer */}
      <div className="w-full flex items-center justify-center py-4 sm:py-8" aria-hidden="true">
        <div className="flex items-center gap-3 text-[#D9C8AC]/70">
          <span className="w-20 sm:w-28 h-[1px] bg-gradient-to-r from-transparent to-[#D9C8AC]" />
          <span className="text-sm text-[#8F5C1A]/70">✦</span>
          <span className="w-20 sm:w-28 h-[1px] bg-gradient-to-l from-transparent to-[#D9C8AC]" />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: FAT FOOTER (Editorial Dark Quiet Luxury #171512)
          ═══════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-[#171512] text-[#D5CEC2] pt-16 pb-12 border-t border-[#D5CEC2]/30 relative overflow-hidden mt-16 sm:mt-24">
        {/* Ambient Gold Accent Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[1px] bg-gradient-to-r from-transparent via-[#A58A5C]/40 to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12 relative z-10">
          {/* Brand & Mission Statement */}
          <div className="flex flex-col items-center justify-center gap-3 border-b border-[#D5CEC2]/20 pb-8 text-center">
            <Link
              href="/"
              aria-label="SeerTarot — หน้าแรก"
              className="inline-flex items-center gap-3 group rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#A58A5C]"
            >
              <span className="w-11 h-11 rounded-full border border-[#A58A5C]/40 overflow-hidden bg-[#F3F0EA] flex-shrink-0 group-hover:scale-105 transition-transform duration-300">
                <img
                  src="/logo.webp"
                  alt="SeerTarot"
                  width={44}
                  height={44}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </span>
              <span className="font-serif-th text-lg font-bold tracking-wide text-[#F3F0EA]">
                SeerTarot
              </span>
            </Link>
            <p className="font-serif-th text-sm text-[#E4DECF] max-w-md">
              วิหารพยากรณ์ไพ่ทาโรต์ 1909 Rider-Waite ออนไลน์ — พื้นที่สงบสำหรับหยุด คิด ถาม และอ่านความหมายของตัวเอง
            </p>
          </div>

          {/* AI Disclosure Card */}
          <div className="flex items-start gap-4 p-5 rounded-xl bg-[#1F1C18] border border-[#D5CEC2]/20 shadow-sm">
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

          {/* 4-Column Internal Links Grid */}
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
                  <Link href="/spreads/three-card" className="hover:text-[#FAF7F2] transition-colors">
                    ผัง 3 ใบ อดีต-ปัจจุบัน-อนาคต
                  </Link>
                </li>
                <li>
                  <Link href="/spreads/decision" className="hover:text-[#FAF7F2] transition-colors">
                    ผังทางแยกการตัดสินใจ (5 ใบ)
                  </Link>
                </li>
                <li>
                  <Link href="/spreads/daily" className="hover:text-[#FAF7F2] transition-colors">
                    ผังดวงรายวัน (Daily Guidance 1 ใบ)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 2: สารานุกรมไพ่ 78 ใบ */}
            <div className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                ✦ สารานุกรมไพ่ 78 ใบ
              </h3>
              <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                <li>
                  <Link href="/cards" className="hover:text-[#FAF7F2] transition-colors">
                    คลังความหมายไพ่ครบ 78 ใบ
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-00" className="hover:text-[#FAF7F2] transition-colors">
                    The Fool · การเริ่มต้นและการผจญภัย
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-01" className="hover:text-[#FAF7F2] transition-colors">
                    The Magician · พลังเจตจำนงและความคิดสร้างสรรค์
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-02" className="hover:text-[#FAF7F2] transition-colors">
                    The High Priestess · ปัญญาญาณและความเงียบ
                  </Link>
                </li>
                <li>
                  <Link href="/cards/major-21" className="hover:text-[#FAF7F2] transition-colors">
                    The World · ความสมบูรณ์และการสิ้นสุดที่งดงาม
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: บทความน่ารู้ */}
            <div className="space-y-3">
              <h3 className="font-serif-th font-bold text-sm text-[#FAF7F2] tracking-wider uppercase border-b border-[#D5CEC2]/20 pb-2">
                ✦ คัมภีร์บทความ
              </h3>
              <ul className="space-y-2 text-xs font-serif-th text-[#D5CEC2]/80">
                <li>
                  <Link href="/blog" className="hover:text-[#FAF7F2] transition-colors">
                    คลังบทความทั้งหมด (20 บทความ)
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
