import { COUNTS } from "@/components/layout/nav-links";

/**
 * 🧭 เมนูหลักของหัวเว็บ — ข้อมูลชุดเดียวที่แถบเมนูเดสก์ท็อปและลิ้นชักมือถือใช้ร่วมกัน
 * ---------------------------------------------------------------------------
 * โครงตามแบบ "Kazumi Clinic" ที่เจ้าของเลือก (2026-10-02): เมนูข้อความเรียงกลางแถบ
 * ข้อแรก "ดูดวง" กางเป็นแผงใหญ่ (mega menu) แบ่งกลุ่ม · ที่เหลือเป็นลิงก์ตรง
 *
 * ⚠️ เพิ่มหน้าใหม่ที่นี่ที่เดียว — เดิมรายการเมนูเขียนแยกในลิ้นชัก พอเพิ่มหน้าแล้วลืมอีกที่ เมนูสองชุดจะไม่ตรงกัน
 * ⚠️ ห้าม import ข้อมูลก้อนใหญ่ (DECK · SPREADS · ARTICLES) — ไฟล์นี้อยู่ในหัวเว็บทุกหน้า ใช้ COUNTS แทน (P-01)
 */

export interface HeaderNavLink {
  label: string;
  href: string;
}

export interface HeaderNavGroup {
  title: string;
  links: HeaderNavLink[];
}

export interface HeaderNav {
  /** ข้อ "ดูดวง" — ชื่อปุ่ม · กลุ่มในแผงใหญ่ · ลิงก์ท้ายแผง */
  reading: { label: string; groups: HeaderNavGroup[]; all: HeaderNavLink };
  /** ลิงก์ตรงที่เหลือ เรียงตามลำดับบนแถบ */
  links: HeaderNavLink[];
}

export function headerNav(isEn: boolean): HeaderNav {
  return {
    reading: {
      label: isEn ? "Readings" : "ดูดวง",
      groups: [
        {
          title: isEn ? "Quick 1-card readings" : "เปิดไพ่ด่วน 1 ใบ",
          links: [
            { label: isEn ? "Daily tarot" : "ไพ่ยิปซีรายวัน", href: "/daily" },
            { label: isEn ? "Love tarot" : "ดูดวงความรัก", href: "/love/1-card" },
            { label: isEn ? "Pick a card (4 piles)" : "Pick A Card เลือกกองไพ่", href: "/pick-a-card" },
          ],
        },
        {
          title: isEn ? "In-depth spreads" : "ดูดวงเจาะลึกหลายใบ",
          links: [
            { label: isEn ? "Past · present · future (3 cards)" : "อดีต · ปัจจุบัน · อนาคต (3 ใบ)", href: "/read/three-card" },
            { label: isEn ? "Love spread" : "ผังความรัก", href: "/read/love" },
            { label: isEn ? "Celtic Cross (10 cards)" : "เซลติกครอส (10 ใบ)", href: "/read/celtic-cross" },
          ],
        },
        {
          title: isEn ? "Your personal cards" : "ไพ่ประจำตัวคุณ",
          links: [
            { label: isEn ? "Birth card" : "คำนวณไพ่ประจำตัว", href: "/cards/birth-card" },
            { label: isEn ? "Zodiac tarot cards" : "ไพ่ประจำราศี 12 ราศี", href: "/cards/zodiac" },
          ],
        },
      ],
      all: { label: isEn ? `All ${COUNTS.spreads} spreads` : `ผังทั้งหมด ${COUNTS.spreads} แบบ`, href: "/spreads" },
    },
    links: [
      { label: isEn ? "Card meanings" : "ความหมายไพ่", href: "/cards" },
      { label: isEn ? "Articles" : "บทความ", href: "/blog" },
      { label: isEn ? "Live readers" : "แม่หมอตัวจริง", href: "/readers" },
      { label: isEn ? "Pricing" : "ราคา", href: "/pricing" },
    ],
  };
}

/** ลิงก์นี้คือหน้าปัจจุบัน (หรือหน้าลูกของมัน) ไหม — path ต้องตัด `/en` ออกก่อน */
export function isActiveNavPath(currentPath: string, href: string): boolean {
  return currentPath === href || (href !== "/" && currentPath.startsWith(href + "/"));
}
