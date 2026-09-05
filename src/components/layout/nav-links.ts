import { DECK } from "@/data/cards";
import { ARTICLES } from "@/data/articles";
import { SPREADS } from "@/data/spreads";

export const COUNTS = {
  cards: DECK.length,        // 78
  articles: ARTICLES.length, // 24
  spreads: SPREADS.length,   // 20
} as const;

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface FooterColumn {
  title: string;
  links?: readonly NavLinkItem[];
  specialItems?: readonly {
    title: string;
    description: string;
    href?: string;
    badgeColor?: string;
  }[];
}

export const FOOTER_COLUMNS = [
  {
    title: "✦ ผังการเปิดไพ่",
    links: [
      { label: `คลังผังพยากรณ์ทั้งหมด (${COUNTS.spreads} แบบ)`, href: "/spreads" },
      { label: "ผังเซลติกครอส (Celtic Cross 10 ใบ)", href: "/spreads/celtic-cross" },
      { label: "ผัง 3 ใบ อดีต-ปัจจุบัน-อนาคต", href: "/spreads/three-card" },
      { label: "ผังทางแยกการตัดสินใจ (5 ใบ)", href: "/spreads/decision" },
      { label: "ผังดวงรายวัน (Daily Guidance 1 ใบ)", href: "/spreads/daily" },
    ],
  },
  {
    title: "✦ สารานุกรมไพ่ 78 ใบ",
    links: [
      { label: `คลังความหมายไพ่ครบ ${COUNTS.cards} ใบ`, href: "/cards" },
      { label: "The Fool · การเริ่มต้นและการผจญภัย", href: "/cards/major-00" },
      { label: "The Magician · พลังเจตจำนงและความคิดสร้างสรรค์", href: "/cards/major-01" },
      { label: "The High Priestess · ปัญญาญาณและความเงียบ", href: "/cards/major-02" },
      { label: "The World · ความสมบูรณ์และการสิ้นสุดที่งดงาม", href: "/cards/major-21" },
    ],
  },
  {
    title: "✦ คัมภีร์บทความ",
    links: [
      { label: `คลังบทความทั้งหมด (${COUNTS.articles} บทความ)`, href: "/blog" },
      { label: "วิธีตั้งคำถามไพ่ทาโรต์ให้ชัดเจน", href: "/blog/how-to-ask-tarot-questions" },
      { label: "ดูดวงความรัก 3 ใบ: เขารู้สึกอย่างไร", href: "/blog/tarot-love-3-cards-feelings" },
      { label: "คู่มือผังเซลติกครอส 10 ตำแหน่ง", href: "/blog/celtic-cross-spread-guide" },
      { label: "จิตวิทยาของ Carl Jung กับไพ่ทาโรต์", href: "/blog/tarot-and-carl-jung-psychology" },
    ],
  },
  {
    title: "✦ ปลอดภัย & โปร่งใส",
    items: [
      {
        title: "Provably Fair SHA-256",
        description: "การันตีสลับไพ่โปร่งใสตรวจสอบได้",
        color: "text-[#A58A5C]",
      },
      {
        title: "นโยบายความเป็นส่วนตัว (PDPA)",
        href: "/privacy",
      },
      {
        title: "สายด่วนสุขภาพจิต 1323",
        description: "ปรึกษาผู้เชี่ยวชาญโทรฟรี 24 ชม.",
        color: "text-[#3A7044]",
      },
      {
        title: "เหตุฉุกเฉิน 1669",
        description: "แจ้งเหตุเจ็บป่วยฉุกเฉิน 24 ชม.",
        color: "text-[#A6392C]",
      },
    ],
  },
] as const;
