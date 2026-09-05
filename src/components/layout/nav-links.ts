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
    title: "ผังการเปิดไพ่",
    links: [
      { label: `คลังผังพยากรณ์ทั้งหมด (${COUNTS.spreads} แบบ)`, href: "/spreads" },
      { label: "ผังเซลติกครอส (Celtic Cross 10 ใบ)", href: "/spreads/celtic-cross" },
      { label: "ผัง 3 ใบ อดีต-ปัจจุบัน-อนาคต", href: "/spreads/three-card" },
      { label: "ผังทางแยกการตัดสินใจ (5 ใบ)", href: "/spreads/decision" },
      { label: "ผังดวงรายวัน (Daily Guidance 1 ใบ)", href: "/spreads/daily" },
    ],
  },
  {
    title: "สารานุกรมไพ่ 78 ใบ",
    links: [
      { label: `คลังความหมายไพ่ครบ ${COUNTS.cards} ใบ`, href: "/cards" },
      { label: "The Fool · การเริ่มต้นและการผจญภัย", href: "/cards/major-00" },
      { label: "The Magician · พลังเจตจำนงและความคิดสร้างสรรค์", href: "/cards/major-01" },
      { label: "The High Priestess · ปัญญาญาณและความเงียบ", href: "/cards/major-02" },
      { label: "The World · ความสมบูรณ์และการสิ้นสุดที่งดงาม", href: "/cards/major-21" },
    ],
  },
  {
    title: "คัมภีร์บทความ",
    links: [
      { label: `คลังบทความทั้งหมด (${COUNTS.articles} บทความ)`, href: "/blog" },
      { label: "วิธีตั้งคำถามไพ่ทาโรต์ให้ชัดเจน", href: "/blog/how-to-ask-tarot-questions" },
      { label: "ดูดวงความรัก 3 ใบ: เขารู้สึกอย่างไร", href: "/blog/tarot-love-3-cards-feelings" },
      { label: "คู่มือผังเซลติกครอส 10 ตำแหน่ง", href: "/blog/celtic-cross-spread-guide" },
      { label: "จิตวิทยาของ Carl Jung กับไพ่ทาโรต์", href: "/blog/tarot-and-carl-jung-psychology" },
    ],
  },
  {
    title: "ปลอดภัย & โปร่งใส",
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

export function getFooterColumns(isEnglish: boolean) {
  if (!isEnglish) return FOOTER_COLUMNS;

  return [
    {
      title: "Tarot Spreads",
      links: [
        { label: `All Spread Sanctuaries (${COUNTS.spreads})`, href: "/spreads" },
        { label: "Celtic Cross (10 Cards)", href: "/spreads/celtic-cross" },
        { label: "Past · Present · Future (3 Cards)", href: "/spreads/three-card" },
        { label: "The Decision Crossroads (5 Cards)", href: "/spreads/decision" },
        { label: "Daily Guidance (1 Card)", href: "/spreads/daily" },
      ],
    },
    {
      title: "78-Card Encyclopedia",
      links: [
        { label: `Complete 78-Card Directory`, href: "/cards" },
        { label: "The Fool · Beginnings & Leaps of Faith", href: "/cards/major-00" },
        { label: "The Magician · Willpower & Creativity", href: "/cards/major-01" },
        { label: "The High Priestess · Intuition & Silence", href: "/cards/major-02" },
        { label: "The World · Wholeness & Completion", href: "/cards/major-21" },
      ],
    },
    {
      title: "Sanctuary Journal",
      links: [
        { label: `All Wisdom Articles (${COUNTS.articles})`, href: "/blog" },
        { label: "How to Formulate Clear Tarot Inquiries", href: "/blog/how-to-ask-tarot-questions" },
        { label: "3-Card Love Reading: How They Truly Feel", href: "/blog/tarot-love-3-cards-feelings" },
        { label: "Celtic Cross 10-Position Mastery Guide", href: "/blog/celtic-cross-spread-guide" },
        { label: "Carl Jung's Archetypal Psychology & Tarot", href: "/blog/tarot-and-carl-jung-psychology" },
      ],
    },
    {
      title: "Ethics & Integrity",
      items: [
        {
          title: "Provably Fair SHA-256",
          description: "Verifiable cryptographic randomness",
          color: "text-[#A58A5C]",
        },
        {
          title: "Privacy Policy & Data Ethics",
          href: "/privacy",
        },
        {
          title: "988 Suicide & Crisis Lifeline",
          description: "Free & confidential 24/7 call/text",
          color: "text-[#3A7044]",
        },
        {
          title: "Emergency Services 911",
          description: "Immediate emergency assistance 24/7",
          color: "text-[#A6392C]",
        },
      ],
    },
  ];
}
