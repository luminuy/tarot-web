"use client";

import { CardImage } from "@/components/card/CardImage";
import { GoldMark } from "@/components/ui/GoldMark";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

import { Ui2Clock } from "./Ui2Clock";
import { useDailyCard } from "./use-daily-card";

/**
 * 🎨 UI 2.0 ส่วน 1 · หัวหน้า (แผน UI_2_0 หัวข้อ 2 · 5.1 · 6.2)
 * ===========================================================================
 * ⚠️ ข้อความ `<h1>` ต้องเหมือนเดิมทุกตัวอักษร และเป็นหัวข้อแรกของ `<main>` (ด่าน a11y + SEO)
 *    "แม่หมอ AI" ห่อ span สีทองได้ — textContent ของ h1 ยังเท่าเดิม
 * ⚠️ มือถือ: ปุ่มหลักต้องอยู่ใน 600px แรก (ที่ 390×844) · นาฬิกาย่อเป็นชิปบรรทัดเดียวใต้ปุ่ม
 *    นาฬิกาตัวใหญ่อยู่ส่วนปิดท้าย · แท็บเล็ต/คอมเห็นนาฬิกากล่องในหัวหน้าด้วย
 * ⚠️ ภาพที่ใหญ่ที่สุดในจอแรกต้องไม่ใช่ภาพไพ่ — LCP คือ h1 · การ์ดลอยเป็นภาพประกอบล้วน (`aria-hidden`)
 *    ขนาด w128 (`thumb`) ลำดับโหลดต่ำ · ใบที่ 5–8 (จอ ≥ 768) โหลดแบบ lazy
 */

const FLOAT_CARDS = [
  { id: "major-17", th: "ดวงดาว", en: "The Star", wordTh: "ความหวัง", wordEn: "Hope" },
  { id: "major-06", th: "คู่รัก", en: "The Lovers", wordTh: "ทางเลือก", wordEn: "Choice" },
  { id: "major-10", th: "กงล้อแห่งโชคชะตา", en: "Wheel of Fortune", wordTh: "จุดเปลี่ยน", wordEn: "Turning point" },
  { id: "major-02", th: "นักบวชหญิง", en: "The High Priestess", wordTh: "สัญชาตญาณ", wordEn: "Intuition" },
  { id: "major-21", th: "โลก", en: "The World", wordTh: "สำเร็จ", wordEn: "Completion" },
  { id: "major-18", th: "ดวงจันทร์", en: "The Moon", wordTh: "ความฝัน", wordEn: "Dreams", far: true },
  { id: "major-00", th: "คนเขลา", en: "The Fool", wordTh: "เริ่มต้นใหม่", wordEn: "New start", far: true },
  { id: "major-03", th: "จักรพรรดินี", en: "The Empress", wordTh: "การดูแล", wordEn: "Nurture", far: true },
] as const;

export function Ui2Hero({ isEnglish, streak = 0 }: { isEnglish: boolean; streak?: number }) {
  const daily = useDailyCard();
  const dailyName = daily ? (isEnglish ? daily.nameEn : daily.nameTh) : null;

  return (
    <section
      className="ui2-sec ui2-day ui2-hero"
      data-home-section="hero"
      data-anim-section
      data-ui2-hide-sticky
      aria-labelledby="ui2-hero-title"
    >
      <div className="ui2-aurora" aria-hidden="true">
        <span className="ui2-blob ui2-blob-amber ui2-loop" />
        <span className="ui2-blob ui2-blob-gold ui2-loop" />
        <span className="ui2-blob ui2-blob-teal ui2-loop" />
      </div>
      <div className="ui2-grain" aria-hidden="true" />

      <div className="ui2-floats" aria-hidden="true">
        {FLOAT_CARDS.map((card, i) => (
          <div key={card.id} className={`ui2-fc ui2-loop${"far" in card ? " ui2-fc-far" : ""}`}>
            <span className="ui2-fc-card">
              <CardImage
                cardId={card.id}
                alt=""
                thumb
                sizes="(min-width: 1024px) 112px, (min-width: 768px) 96px, 54px"
                loading={i < 4 ? "eager" : "lazy"}
                fetchPriority="low"
              />
            </span>
            <span className="ui2-fc-tag">
              <b>{isEnglish ? card.en : card.th}</b>
              {isEnglish ? card.wordEn : card.wordTh}
            </span>
          </div>
        ))}
      </div>

      <div className="ui2-hero-inner">
        <p className="ui2-chip">
          <GoldMark className="ui2-mark" />
          {isEnglish ? "Authentic 1909 deck · truly random, verifiable" : "สำรับ 1909 แท้ · สุ่มจริง ตรวจสอบได้"}
        </p>

        <h1 id="ui2-hero-title" className="ui2-h1">
          <ThaiPhrases>
            {isEnglish ? (
              <>
                Interactive 1909 Rider-Waite Tarot with <span className="tp ui2-gold-day ui2-loop">AI Oracle</span>
              </>
            ) : (
              <>
                ดูดวงไพ่ยิปซี ไพ่ทาโรต์ออนไลน์ ฟรี กับ<span className="tp ui2-gold-day ui2-loop">แม่หมอ AI</span>
              </>
            )}
          </ThaiPhrases>
        </h1>

        <p className="ui2-hero-sub">
          {isEnglish
            ? "Hold one question in mind, then pick the card with your own hand. The oracle reads each card for you, with the reasons why."
            : "ตั้งใจถามหนึ่งเรื่อง แล้วหยิบไพ่ด้วยมือคุณเอง แม่หมออ่านให้ทีละใบ พร้อมเหตุผล"}
        </p>

        <div className="ui2-hero-ctas">
          <a href="#home-quick" className="ui2-btn" data-home-target="hero:quick">
            <span className="ui2-btn-ring ui2-loop" aria-hidden="true" />
            {isEnglish ? "Draw 1 card now" : "เปิดไพ่ด่วน 1 ใบ"}
            <span className="ui2-btn-arrow" aria-hidden="true" />
          </a>
          <Link href="/daily" prefetch={false} className="ui2-btn-ghost ui2-daily-btn" data-home-target="hero:daily">
            <GoldMark className="ui2-mark" />
            <span className="ui2-daily-name">
              {isEnglish ? "Today's card" : "ไพ่วันนี้"}
              {dailyName ? ` · ${dailyName}` : ""}
              {streak >= 2 ? (isEnglish ? ` · ${streak}-day streak` : ` · ต่อเนื่อง ${streak} วัน`) : ""}
            </span>
          </Link>
        </div>

        <Ui2Clock isEnglish={isEnglish} variant="chip" />
        <Ui2Clock isEnglish={isEnglish} variant="cells" />
      </div>
    </section>
  );
}
