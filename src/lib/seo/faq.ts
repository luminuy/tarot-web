/**
 * คำถามที่พบบ่อย (FAQ) ชุดเดียวสำหรับทั้ง "ข้อความบนหน้า" และ JSON-LD `FAQPage`
 * ---------------------------------------------------------------------------
 * แนวทางของ Google: FAQPage ต้องตรงกับคำถาม/คำตอบที่ผู้ใช้เห็นบนหน้า (A7-10)
 * เดิมหน้าผังเขียนชุด FAQ ซ้ำสองที่ (หน้าเซิร์ฟเวอร์ + island) แล้วถ้อยคำเพี้ยนกัน
 * ทุกจุดที่วาด FAQ หรือเขียน FAQPage ต้องดึงจากไฟล์นี้ — ห้ามเขียนชุดคำถามใหม่ในหน้าอีก
 *
 * ⚠️ ไฟล์นี้ถูก import จาก island (`SpreadDetailClient` · `CardYesNoAnswer`) — ห้าม import ข้อมูลก้อนใหญ่
 *    (สำรับ 78 ใบ · รายการผังทั้งหมด) เข้ามา รับเป็นพารามิเตอร์แทน
 */

import type { Spread } from "@/data/spreads-helpers";
import { getSpreadDescription, getSpreadName } from "@/data/spreads-helpers";

export interface FaqItem {
  question: string;
  answer: string;
}

/** ชื่อหมวดของผังภาษาไทย — ใช้ทั้งหน้าผังฝั่งเซิร์ฟเวอร์และ island */
export const SPREAD_CATEGORY_TH: Record<string, string> = {
  general: "ทั่วไป",
  love: "ความรัก",
  career: "การงาน",
  work: "การงาน",
  money: "การเงิน",
  finance: "การเงิน",
  spiritual: "จิตวิญญาณ",
  decision: "การตัดสินใจ",
};

/** FAQ ของหน้าผังรายผัง (`/spreads/[id]` · `/en/spreads/[id]`) — ชุดที่แสดงบนหน้าและชุดใน JSON-LD เป็นชุดเดียวกัน */
export function buildSpreadFaqs(spread: Spread, isEnglish: boolean, standard: boolean): FaqItem[] {
  const cardCount = spread.positions.length;
  if (isEnglish) {
    return [
      {
        question: `What types of questions suit the ${getSpreadName(spread, true)}?`,
        answer: `${getSpreadDescription(spread, true)} It is designed to reveal hidden dynamics and offer practical guidance.`,
      },
      {
        question: "How many cards are drawn in this spread?",
        answer: `This layout uses ${cardCount} cards arranged in a deliberate geometric pattern.`,
      },
      {
        question: standard ? "Is this spread available on the standard tier?" : "Why is this spread designated as a Grand Spread?",
        answer: standard
          ? "Yes, this is an open spread available to all seekers under daily quota."
          : "This layout features complex multi-card geometry and deep syntheses, unlocked for seekers with Grand Oracle access.",
      },
    ];
  }
  const categoryLabel = SPREAD_CATEGORY_TH[spread.defaultCategory] ?? spread.defaultCategory;
  return [
    {
      question: `ผัง${spread.nameTh} เหมาะกับคำถามแบบไหน`,
      answer: `${spread.description} ${
        spread.defaultCategory !== "general" ? `จึงเหมาะกับเรื่อง${categoryLabel}ที่อยากเห็นภาพรวมและปัจจัยรอบด้าน` : ""
      }`.trim(),
    },
    {
      question: "ผังนี้ใช้ไพ่กี่ใบ",
      answer: `ผังนี้ใช้ไพ่ ${cardCount} ใบ วางตามตำแหน่งที่กำหนดไว้`,
    },
    {
      question: standard ? "ผังนี้เปิดใช้ฟรีได้ไหม" : "ทำไมผังนี้เป็นผังพิเศษ",
      answer: standard
        ? "ได้ ผังนี้เป็นผังมาตรฐานที่สมาชิกทุกคนเปิดได้ตามโควตาปกติ"
        : "ผังนี้มีจำนวนไพ่มากและตีความละเอียด จึงสงวนไว้สำหรับผู้ถือสิทธิ์ญาณพยากรณ์พิเศษ",
    },
  ];
}

/** หัวข้อ "ใช่หรือไม่" ของหน้าไพ่รายใบ — หัวข้อบนหน้า (`CardYesNoAnswer`) และคำถามใน FAQPage ใช้ข้อความนี้ตัวเดียว */
export function cardYesNoQuestion(card: { nameEn: string; nameTh: string }, isEnglish: boolean): string {
  return isEnglish ? `Is ${card.nameEn} a Yes or No Card?` : `ไพ่ ${card.nameTh} ใช่หรือไม่ (Yes / No)`;
}

/** บล็อก JSON-LD `FAQPage` จากชุด FAQ ที่แสดงบนหน้า */
export function buildFaqPageJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
