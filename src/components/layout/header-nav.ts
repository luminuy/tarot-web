import { COUNTS } from "@/components/layout/nav-links";

/**
 * 🧭 เมนูหลักของหัวเว็บ — ข้อมูลชุดเดียวที่แถบเมนูเดสก์ท็อปและลิ้นชักมือถือใช้ร่วมกัน
 * ---------------------------------------------------------------------------
 * โครงตามแบบ "Kazumi Clinic" ที่เจ้าของเลือก (2026-10-02): หัวข้อหลัก 5 ข้อเรียงเหมือนกันทั้งคอมและมือถือ
 *   ดูดวง ▾ (แผงใหญ่ 3 กลุ่ม) · ความหมายไพ่ · บทความ · ปรึกษาแม่หมอ · ราคา
 * มือถือใช้หัวข้อชุดเดียวกัน + คำอธิบายสั้น (`sublabel`) และภาพไพ่ (`cardId`) ต่อแถว
 *
 * กติกาถ้อยคำ (เจ้าของสั่ง "ได้มาตรฐาน เข้าใจง่าย"): หัวข้อเป็นคำนามสั้นแบบเว็บทั่วไป
 * บอกตรง ๆ ว่ากดแล้วได้อะไร · ไม่ใช้ศัพท์เฉพาะของบ้านนี้ (เช่น "วิหาร" · "พิธีกรรม")
 *
 * ⚠️ เพิ่มหน้าใหม่ที่นี่ที่เดียว — เมนูสองชุดจะได้ไม่เพี้ยนกัน
 * ⚠️ ห้าม import ข้อมูลก้อนใหญ่ (DECK · SPREADS · ARTICLES) — ไฟล์นี้อยู่ในหัวเว็บทุกหน้า ใช้ COUNTS แทน (P-01)
 */

export interface HeaderNavLink {
  label: string;
  href: string;
  /** คำอธิบายสั้นใต้ชื่อ (ลิ้นชักมือถือ) */
  sublabel: string;
  /** ภาพไพ่ประจำแถว (ลิ้นชักมือถือ) */
  cardId: string;
}

export interface HeaderNavGroup {
  title: string;
  links: HeaderNavLink[];
}

export interface HeaderNav {
  /** หัวข้อ "ดูดวง" — ชื่อ · กลุ่มในแผงใหญ่ · ลิงก์ท้ายแผง */
  reading: { label: string; groups: HeaderNavGroup[]; all: { label: string; href: string } };
  /** หัวข้อหลักที่เหลือ เรียงตามลำดับบนแถบ */
  links: HeaderNavLink[];
}

export function headerNav(isEn: boolean): HeaderNav {
  return {
    reading: {
      label: isEn ? "Readings" : "ดูดวง",
      groups: [
        {
          title: isEn ? "Quick reading · 1 card" : "ดูดวงด่วน · ไพ่ 1 ใบ",
          links: [
            {
              label: isEn ? "Daily tarot" : "ไพ่ยิปซีรายวัน",
              href: "/daily",
              sublabel: isEn ? "Today's work, money & love" : "ดวงวันนี้ การงาน การเงิน ความรัก",
              cardId: "major-19",
            },
            {
              label: isEn ? "Love tarot" : "ดูดวงความรัก",
              href: "/love/1-card",
              sublabel: isEn ? "Single, dating, together or apart" : "โสด คนคุย มีแฟน หรือเพิ่งเลิกกัน",
              cardId: "major-06",
            },
            {
              label: isEn ? "Pick a card" : "Pick A Card เลือกกองไพ่",
              href: "/pick-a-card",
              sublabel: isEn ? "Choose 1 of 4 piles for your message" : "เลือก 1 ใน 4 กอง แล้วอ่านคำทำนาย",
              cardId: "major-17",
            },
          ],
        },
        {
          title: isEn ? "In-depth reading · several cards" : "ดูดวงละเอียด · หลายใบ",
          links: [
            {
              label: isEn ? "Past · present · future" : "อดีต ปัจจุบัน อนาคต (3 ใบ)",
              href: "/read/three-card",
              sublabel: isEn ? "Where it came from and where it's going" : "ที่มา ตอนนี้ และทางข้างหน้า",
              cardId: "major-14",
            },
            {
              label: isEn ? "In-depth love reading" : "ดวงความรักเจาะลึก (5 ใบ)",
              href: "/read/love",
              sublabel: isEn ? "Their feelings and where it's heading" : "ความรู้สึกของเขา และอนาคตของความรัก",
              cardId: "cups-02",
            },
            {
              label: isEn ? "Celtic Cross" : "เซลติกครอส (10 ใบ)",
              href: "/read/celtic-cross",
              sublabel: isEn ? "The full picture of a big question" : "ภาพรวมเรื่องสำคัญแบบละเอียดที่สุด",
              cardId: "major-21",
            },
          ],
        },
        {
          title: isEn ? "Your personal cards" : "ไพ่ประจำตัว",
          links: [
            {
              label: isEn ? "Birth card" : "ไพ่ประจำวันเกิด",
              href: "/cards/birth-card",
              sublabel: isEn ? "Your personality & soul cards" : "ไพ่บุคลิกและจิตวิญญาณจากวันเกิด",
              cardId: "major-10",
            },
            {
              label: isEn ? "Zodiac tarot cards" : "ไพ่ประจำราศี",
              href: "/cards/zodiac",
              sublabel: isEn ? "The tarot card of each of the 12 signs" : "ไพ่ทาโรต์ของทั้ง 12 ราศี",
              cardId: "major-18",
            },
          ],
        },
        {
          // ✦ หน้าใหม่จากแผน REFLECTION_JOURNAL_PLAN (ขึ้น 2026-10-07) — เดิมไม่มีในเมนู เจ้าของหาไม่เจอ
          title: isEn ? "Your journal & tools" : "สมุดดวงและเครื่องมือ",
          links: [
            {
              label: isEn ? "My tarot journal" : "สมุดดวงของฉัน",
              href: "/journal",
              sublabel: isEn ? "Past readings, moods and stories you follow" : "ย้อนดูคำอ่าน ใจก่อน-หลัง และเรื่องที่ติดตาม",
              cardId: "major-20",
            },
            {
              label: isEn ? "Design your own spread" : "ออกแบบผังเอง",
              href: "/spreads/create",
              sublabel: isEn ? "Set 1–7 card positions for your question" : "ตั้งตำแหน่งไพ่ 1–7 ใบตามเรื่องของคุณ",
              cardId: "major-03",
            },
            {
              label: isEn ? "Popular tarot questions" : "คำถามที่คนถามไพ่บ่อย",
              href: "/questions",
              sublabel: isEn ? "20 common questions and the right spread" : "20 คำถามยอดฮิต พร้อมผังที่เหมาะ",
              cardId: "major-05",
            },
          ],
        },
      ],
      all: { label: isEn ? `See all ${COUNTS.spreads} spreads` : `ดูผังไพ่ทั้งหมด ${COUNTS.spreads} แบบ`, href: "/spreads" },
    },
    links: [
      {
        label: isEn ? "Card meanings" : "ความหมายไพ่",
        href: "/cards",
        sublabel: isEn ? `All ${COUNTS.cards} tarot cards explained` : `ความหมายไพ่ทาโรต์ครบ ${COUNTS.cards} ใบ`,
        cardId: "major-01",
      },
      {
        label: isEn ? "Articles" : "บทความ",
        href: "/blog",
        sublabel: isEn ? "Tarot guides and reading tips" : "ความรู้ไพ่ทาโรต์และเคล็ดลับการดูดวง",
        cardId: "major-09",
      },
      {
        label: isEn ? "Consult a reader" : "ปรึกษาแม่หมอ",
        href: "/readers",
        sublabel: isEn ? "Book a session with a real reader" : "จองคิวคุยกับแม่หมอตัวจริง",
        cardId: "major-02",
      },
      {
        label: isEn ? "Pricing" : "ราคา",
        href: "/pricing",
        sublabel: isEn ? "Free daily · pay once, no subscription" : "ดูฟรีทุกวัน · เติมรอบจ่ายครั้งเดียว",
        cardId: "pentacles-01",
      },
    ],
  };
}

/** ลิงก์นี้คือหน้าปัจจุบัน (หรือหน้าลูกของมัน) ไหม — path ต้องตัด `/en` ออกก่อน */
export function isActiveNavPath(currentPath: string, href: string): boolean {
  return currentPath === href || (href !== "/" && currentPath.startsWith(href + "/"));
}
