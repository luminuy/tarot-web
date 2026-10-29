import { COUNTS } from "@/components/layout/nav-links";
import { NOVEL_PATH, NOVEL_TITLE } from "@/data/novel-title";

/**
 * 🧭 เมนูหลักของหัวเว็บ — ข้อมูลชุดเดียวที่แถบเมนูเดสก์ท็อปและลิ้นชักมือถือใช้ร่วมกัน
 * ---------------------------------------------------------------------------
 * โครงตามแบบ "Kazumi Clinic" ที่เจ้าของเลือก (2026-10-02): หัวข้อหลักเรียงเหมือนกันทั้งคอมและมือถือ
 *   ดูดวง ▾ (แผงใหญ่ 5 กลุ่ม) · ผังดวงกำเนิด · ความหมายไพ่ · บทความ · (นิยาย) · ปรึกษาแม่หมอ · ราคา
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
  /** หน้าที่ดันให้เด่น — สีทองบนแถบเมนูคอม · ป้าย "ใหม่" ในลิ้นชักมือถือ (ใช้กับหัวข้อหลักเท่านั้น) */
  featured?: boolean;
  /** แถบเมนูคอมแสดงเฉพาะจอ ≥ 1280 (ลิ้นชักมือถือแสดงเสมอ) — เมนูอังกฤษยาวกว่า ที่ 1024 ล้นทับปุ่มขวา 22px เมื่อมีผังดวงกำเนิด */
  wideOnly?: boolean;
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
          // ✦ หน้าหมวด `/spreads/topic/*` — เดิมไม่มีในเมนู (เจ้าของ 2026-10-20 "กลัวคนใช้ไม่รู้ หาไม่เจอ")
          //   ข้อความเป็นคำที่คนค้นจริง (GSC) · ภาพไพ่ชุดเดียวกับส่วนหมวดของหน้า /spreads
          title: isEn ? "Readings by topic" : "ดูดวงตามเรื่อง",
          links: [
            {
              label: isEn ? "Love" : "ดูดวงไพ่ยิปซีความรัก",
              href: "/spreads/topic/love",
              sublabel: isEn ? "5 spreads for singles, dating, exes and couples" : "5 ผัง คนโสด คนคุย แฟนเก่า คนมีคู่",
              cardId: "major-06",
            },
            {
              label: isEn ? "Career" : "ดูดวงการงาน",
              href: "/spreads/topic/career",
              sublabel: isEn ? "Job changes, promotion and crossroads" : "ย้ายงาน เลื่อนขั้น ทางแยกงาน",
              cardId: "major-07",
            },
            {
              label: isEn ? "Money & luck" : "ดูดวงการเงิน โชคลาภ",
              href: "/spreads/topic/money",
              sublabel: isEn ? "Cash flow and lucky chances" : "กระแสเงิน และโชคลาภ",
              cardId: "pentacles-01",
            },
            {
              label: isEn ? "Health & energy" : "ดูดวงสุขภาพ",
              href: "/spreads/topic/health",
              sublabel: isEn ? "Body, mind and spirit in balance" : "สมดุลกาย ใจ และจิตวิญญาณ",
              cardId: "major-14",
            },
            {
              label: isEn ? "Family" : "ดูดวงครอบครัว",
              href: "/spreads/topic/family",
              sublabel: isEn ? "Home and the people around you" : "คนในบ้าน และบริวาร",
              cardId: "cups-10",
            },
            {
              label: isEn ? "Study & exams" : "ดูดวงการเรียน",
              href: "/spreads/topic/study",
              sublabel: isEn ? "Exams, further study and focus" : "การสอบ เรียนต่อ และสมาธิ",
              cardId: "pentacles-08",
            },
          ],
        },
        {
          // ✦ ผังดวงกำเนิด `/natal-chart` (ขึ้น 2026-10-27) — เดิมไม่มีในเมนู (เจ้าของ 2026-10-29 "ยังไม่มีในเมนู")
          //   อยู่กลุ่มเดียวกับไพ่วันเกิด/ไพ่ราศี เพราะเป็นเครื่องมือจากวันเกิดเหมือนกัน
          title: isEn ? "Your chart & cards" : "ดวงและไพ่ประจำตัว",
          links: [
            {
              label: isEn ? "Natal chart" : "ผังดวงกำเนิด",
              href: "/natal-chart",
              sublabel: isEn ? "Rising sign, planets and houses, each with its tarot card" : "ลัคนา ดาว 10 ดวง เรือนชะตา พร้อมไพ่ประจำทุกตำแหน่ง",
              cardId: "major-21",
            },
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
      /* ผังดวงกำเนิดเป็นหัวข้อหลักข้อแรก (เจ้าของ 2026-10-29 "ต้องเด่น เพราะตัวทำเงินเลย")
         — ยังอยู่ในกลุ่ม "ดวงและไพ่ประจำตัว" ของแผงใหญ่ด้วย คนที่ไล่หาเครื่องมือจากวันเกิดเจอทั้งสองทาง */
      {
        label: isEn ? "Natal chart" : "ผังดวงกำเนิด",
        href: "/natal-chart",
        sublabel: isEn ? "Free: rising sign, 10 planets and a tarot card for each" : "คำนวณฟรี ลัคนา ดาว 10 ดวง พร้อมไพ่ประจำทุกตำแหน่ง",
        cardId: "major-21",
        featured: true,
      },
      {
        label: isEn ? "Card meanings" : "ความหมายไพ่",
        href: "/cards",
        sublabel: isEn ? `All ${COUNTS.cards} tarot cards explained` : `ความหมายไพ่ทาโรต์ครบ ${COUNTS.cards} ใบ`,
        cardId: "major-01",
      },
      {
        label: isEn ? "Articles" : "บทความ",
        href: "/blog",
        wideOnly: isEn,
        sublabel: isEn ? "Tarot guides and reading tips" : "ความรู้ไพ่ทาโรต์และเคล็ดลับการดูดวง",
        cardId: "major-09",
      },
      /* นิยาย The Broken Arcana (เจ้าของ 2026-10-27 "ทำยังไงให้เค้าเข้ามาแล้วรู้ว่ามี") — ภาษาไทยอย่างเดียว จึงไม่มีในเมนูอังกฤษ */
      ...(isEn
        ? []
        : [
            {
              label: "นิยาย",
              href: NOVEL_PATH,
              sublabel: `${NOVEL_TITLE} · สมาชิกอ่านฟรีทุกบท`,
              cardId: "major-00",
            },
          ]),
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
