"use client";

import { CardImage } from "@/components/card/CardImage";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { NOVEL_PATH, NOVEL_TITLE } from "@/data/novel-title";

import { Ui2Clock } from "./Ui2Clock";
import { useDailyCard } from "./use-daily-card";

/**
 * 🎨 UI 2.0 ส่วน 1 · หัวหน้า (แผน UI_2_0 หัวข้อ 2 · 5.1 · 6.2)
 * ===========================================================================
 * ⚠️ ข้อความ `<h1>` ต้องเหมือนเดิมทุกตัวอักษร และเป็นหัวข้อแรกของ `<main>` (ด่าน a11y + SEO)
 *    `<wbr>` ระหว่าง "ไพ่ทาโรต์" กับ "ออนไลน์" = จุดขึ้นบรรทัดแบบภาพต้นแบบ (คอม 2 บรรทัด) ไม่เพิ่มตัวอักษร
 *    "แม่หมอ AI" ห่อ span สีทองได้ — textContent ของ h1 ยังเท่าเดิม
 * ⚠️ มือถือ: ปุ่มหลักต้องอยู่ใน ~600px แรก (ที่ 390×844) · นาฬิกากล่องอยู่เหนือปุ่มตามภาพต้นแบบ D+ ทุกจอ
 *    (เจ้าของสั่ง 2026-10-13 "ปรับให้เหมาะสมกับทุก device" — ย่อกล่องบนมือถือแทนการย้ายลงใต้ปุ่ม)
 * ⚠️ ภาพที่ใหญ่ที่สุดในจอแรกต้องไม่ใช่ภาพไพ่ — LCP คือ h1 · การ์ดลอยเป็นภาพประกอบล้วน (`aria-hidden`)
 *    ขนาด w128 (`thumb`) ลำดับโหลดต่ำ · ใบที่ 5–8 (จอ ≥ 768) โหลดแบบ lazy
 */

/**
 * การ์ดลอย 8 ใบตามภาพต้นแบบ D+ (กรอบกระจกขาว + ชื่อไพ่/คำสำคัญในกรอบ) — ตำแหน่งต่อจออยู่ใน ui2.css (`.ui2-fc-<key>`)
 * มือถือ 6 ใบ (บน 4 · ข้างนาฬิกา 2 · ไม่มีป้าย) · แท็บเล็ต 6 ใบชิดขอบ · คอม/iPad แนวนอน ครบ 8 ใบ
 */
const FLOAT_CARDS = [
  { key: "star", id: "major-17", th: "ดวงดาว", en: "The Star", wordTh: "ความหวัง", wordEn: "Hope" },
  { key: "moon", id: "major-18", th: "ดวงจันทร์", en: "The Moon", wordTh: "สิ่งที่ซ่อนอยู่", wordEn: "What's hidden", far: true },
  { key: "lovers", id: "major-06", th: "คู่รัก", en: "The Lovers", wordTh: "เลือกด้วยใจ", wordEn: "Choose with heart" },
  { key: "fool", id: "major-00", th: "คนเขลา", en: "The Fool", wordTh: "เริ่มต้นใหม่", wordEn: "New start", far: true },
  { key: "wheel", id: "major-10", th: "กงล้อแห่งโชคชะตา", en: "Wheel of Fortune", wordTh: "จังหวะเปลี่ยน", wordEn: "Turning point" },
  { key: "empress", id: "major-03", th: "จักรพรรดินี", en: "The Empress", wordTh: "ความอุดมสมบูรณ์", wordEn: "Abundance", far: true },
  { key: "priestess", id: "major-02", th: "นักบวชหญิง", en: "The High Priestess", wordTh: "สัญชาตญาณ", wordEn: "Intuition" },
  { key: "world", id: "major-21", th: "โลก", en: "The World", wordTh: "ความสำเร็จ", wordEn: "Completion", far: true },
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
          <div key={card.id} className={`ui2-fc ui2-fc-${card.key} ui2-loop${"far" in card ? " ui2-fc-far" : ""}`}>
            <span className="ui2-fc-card">
              <CardImage
                cardId={card.id}
                alt=""
                thumb
                sizes="(min-width: 1280px) 142px, (min-width: 1024px) 116px, (min-width: 768px) 84px, 72px"
                loading={"far" in card || i > 4 ? "lazy" : "eager"}
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
                ดูดวงไพ่ยิปซี ไพ่ทาโรต์
                <wbr />
                ออนไลน์ ฟรี กับ<span className="tp ui2-gold-day ui2-loop">แม่หมอ AI</span>
              </>
            )}
          </ThaiPhrases>
        </h1>

        <p className="ui2-hero-sub">
          {isEnglish
            ? "Hold one question in mind, then pick the card with your own hand. The oracle reads each card for you, with the reasons why."
            : "ตั้งใจถามหนึ่งเรื่อง แล้วหยิบไพ่ด้วยมือคุณเอง แม่หมออ่านให้ทีละใบ พร้อมเหตุผล"}
        </p>

        <Ui2Clock isEnglish={isEnglish} />

        <div className="ui2-hero-ctas">
          <a href="#home-quick" className="ui2-btn" data-home-target="hero:quick">
            <span className="ui2-btn-ring ui2-loop" aria-hidden="true" />
            {isEnglish ? "Draw 1 card now" : "เปิดไพ่ด่วน 1 ใบ"}
          </a>
          <Link href="/daily" prefetch={false} className="ui2-btn-ghost ui2-daily-btn" data-home-target="hero:daily">
            {/* ภาพไพ่จิ๋วของไพ่วันนี้ตัวจริง (มาจากเซิร์ฟเวอร์) · ยังโหลดไม่เสร็จ = ไม่แสดงอะไร ห้ามเดาไพ่ (กฎเหล็ก 14) */}
            {daily ? (
              <span className="ui2-daily-thumb" aria-hidden="true">
                <CardImage cardId={daily.cardId} alt="" thumb sizes="22px" loading="lazy" fetchPriority="low" />
              </span>
            ) : null}
            <span className="ui2-daily-name">
              {isEnglish ? "Today's card" : "ไพ่วันนี้"}
              {dailyName ? ` · ${dailyName}` : ""}
              {streak >= 2 ? (isEnglish ? ` · ${streak}-day streak` : ` · ต่อเนื่อง ${streak} วัน`) : ""}
            </span>
          </Link>
        </div>

        {/* ทางเข้าของใหม่ใต้ปุ่มหลัก (ไม่ดันหัวข้อ/ปุ่มเดิม) — คอมเรียงแถวเดียว มือถือซ้อนกัน
            ผังดวงกำเนิดมาก่อนและขอบทอง (เจ้าของ 2026-10-29 "ต้องเด่น เพราะตัวทำเงินเลย")
            นิยาย (เจ้าของ 2026-10-27 "ทำยังไงให้เค้าเข้ามาแล้วรู้ว่ามี") ภาษาไทยอย่างเดียว เพราะนิยายไม่มีฉบับอังกฤษ */}
        <div className="ui2-hero-news">
          <Link href="/natal-chart" prefetch={false} className="ui2-hero-novel ui2-hero-natal" data-home-target="hero:natal">
            <span className="ui2-hero-novel-k">{isEnglish ? "Free" : "ฟรี"}</span>
            <span>{isEnglish ? "Natal chart and your tarot cards" : "ผังดวงกำเนิด พร้อมไพ่ประจำตัว"}</span>
          </Link>
          {!isEnglish && (
            <Link href={NOVEL_PATH} prefetch={false} className="ui2-hero-novel">
              <span className="ui2-hero-novel-k">ใหม่</span>
              <span>นิยาย {NOVEL_TITLE} สมาชิกอ่านฟรี</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
