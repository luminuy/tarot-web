import type { Category } from "@/data/cards/types";

/**
 * ⚡ หัวข้อเปิดไพ่ด่วน 1 ใบ (love · work · money · general) — ข้อมูลล้วน แยกจากคอมโพเนนต์
 * ใช้ทั้งส่วน "ใจคุณเลือกเอง" ของหน้าแรก UI 2.0 (`src/components/home2/Ui2PickSection.tsx`)
 * และ `QuickFortunePicker` · แยกไฟล์เพื่อให้ island หน้าแรกไม่ต้องลาก JSX ของตัวเลือกเดิมมาทั้งก้อน
 * ด่าน `scripts/qa/test-quick-fortune.ts` ตรวจข้อมูลชุดนี้
 */
export interface QuickTopic {
  id: "love" | "work" | "money" | "general";
  category: Category;
  title: string;
  titleEn?: string;
  tagline: string;
  taglineEn?: string;
  defaultQuestion: string;
  defaultQuestionEn?: string;
  badge: string;
  badgeEn?: string;
  highlightText: string;
  highlightTextEn?: string;
  cardImage: string;
  cardAlt: string;
  cardAltEn?: string;
  elementalGlyph: string;
  elementalGlyphEn?: string;
  themeColors: {
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
    accentText: string;
    cardBorder: string;
  };
}

export const QUICK_TOPICS: QuickTopic[] = [
  {
    id: "love",
    category: "love",
    title: "ความรักและความสัมพันธ์",
    titleEn: "Love & Relationships",
    tagline: "เช็กความรู้สึก แนวโน้มหัวใจ คนคุย แฟน หรือคนโสด",
    taglineEn: "Heartspace dynamics, soul connection, partners, or dating clarity",
    defaultQuestion: "ภาพรวมความรักและความสัมพันธ์ตอนนี้เป็นอย่างไร และควรเปิดใจรับมืออย่างไร",
    defaultQuestionEn: "What is the present energy surrounding my love life and relationships, and how should I best navigate my heart?",
    badge: "ยอดนิยมอันดับ 1",
    badgeEn: "#1 Most Popular",
    highlightText: "เปิดไพ่ดูดวงความรัก",
    highlightTextEn: "Love Tarot Reading",
    cardImage: "major-06.jpg",
    cardAlt: "ไพ่ The Lovers - ความรักและการผูกพันทางจิตวิญญาณ",
    cardAltEn: "The Lovers - Sacred bond, emotional resonance, and spiritual choice",
    elementalGlyph: "ธาตุน้ำ · สายใยหัวใจ",
    elementalGlyphEn: "Water Element · Heartspace Bonds",
    themeColors: {
      badgeBg: "bg-[#FBF2EC]",
      badgeText: "text-[#9E4E28]",
      badgeBorder: "border-[#E8D0C3]",
      accentText: "text-[#9E4E28]",
      cardBorder: "#E0C9BB",
    },
  },
  {
    id: "work",
    category: "work",
    title: "การงาน & โอกาสใหม่",
    titleEn: "Career & New Horizons",
    tagline: "เจาะลึกทิศทางงาน การสอบ เลื่อนตำแหน่ง และอุปสรรค",
    taglineEn: "Professional trajectory, promotions, ventures, and breakthroughs",
    defaultQuestion: "ทิศทางการงานและโปรเจกต์ช่วงนี้จะราบรื่นไหม มีสิ่งใดที่ควรระวังเป็นพิเศษ",
    defaultQuestionEn: "What energies are guiding my career and creative projects right now, and what should I be mindful of?",
    badge: "ยอดนิยม",
    badgeEn: "High Impact",
    highlightText: "เปิดไพ่ดูดวงการงาน",
    highlightTextEn: "Career Tarot Reading",
    cardImage: "major-01.jpg",
    cardAlt: "ไพ่ The Magician - การริเริ่ม ทักษะ และการสร้างสรรค์โอกาส",
    cardAltEn: "The Magician - Conscious manifestation, creative mastery, and willpower",
    elementalGlyph: "ธาตุไฟ · ศักยภาพ & ลงมือทำ",
    elementalGlyphEn: "Fire Element · Agency & Action",
    themeColors: {
      badgeBg: "bg-[#F6EFE0]",
      badgeText: "text-gold-ink",
      badgeBorder: "border-[#E2D4BE]",
      accentText: "text-gold-ink",
      cardBorder: "#D9C8AC",
    },
  },
  {
    id: "money",
    category: "money",
    title: "การเงิน & โชคลาภ",
    titleEn: "Finances & Abundance",
    tagline: "ประเมินกระแสเงินสด ความคล่องตัว และจังหวะลงทุน",
    taglineEn: "Financial flow, material grounding, investments, and prosperity",
    defaultQuestion: "สภาพคล่องทางการเงินและโชคลาภช่วงนี้เป็นอย่างไร ควรบริหารจัดการอย่างไร",
    defaultQuestionEn: "What is the financial current around me at this time, and how can I best cultivate grounded stability?",
    badge: "เด่นชัด",
    badgeEn: "Clear Alignment",
    highlightText: "เปิดไพ่ดูดวงการเงิน",
    highlightTextEn: "Financial Tarot Reading",
    cardImage: "pentacles-01.jpg",
    cardAlt: "ไพ่ Ace of Pentacles - ความอุดมสมบูรณ์และโอกาสทางการเงิน",
    cardAltEn: "Ace of Pentacles - Seeds of material opportunity, security, and prosperity",
    elementalGlyph: "ธาตุดิน · ความมั่นคง & โชคลาภ",
    elementalGlyphEn: "Earth Element · Grounding & Wealth",
    themeColors: {
      badgeBg: "bg-[#F7F3DC]",
      badgeText: "text-[#8C6615]",
      badgeBorder: "border-[#E0D8B4]",
      accentText: "text-[#8C6615]",
      cardBorder: "#D8CEAA",
    },
  },
  {
    id: "general",
    category: "general",
    title: "ภาพรวมดวงชะตา & พลังงานวันนี้",
    titleEn: "Daily Energy & Universal Guidance",
    tagline: "สิ่งที่จักรวาลอยากบอก ข้อคิดนำทางชีวิตประจำวัน",
    taglineEn: "Core atmospheric guidance and mindfulness for today's journey",
    defaultQuestion: "ภาพรวมพลังงานดวงชะตาตอนนี้เป็นอย่างไร มีข้อคิดหรือคำเตือนใดที่ควรใส่ใจ",
    defaultQuestionEn: "What universal message or guiding principle does the cosmos offer for my journey today?",
    badge: "สมดุล",
    badgeEn: "Centered",
    highlightText: "เปิดไพ่รับพลังงานวันนี้",
    highlightTextEn: "Daily Guidance Reading",
    cardImage: "major-19.jpg",
    cardAlt: "ไพ่ The Sun - ความสว่างไสว พลังบวก และความจริงแห่งชีวิต",
    cardAltEn: "The Sun - Radiance, vitality, conscious clarity, and authentic joy",
    elementalGlyph: "นภากาศ · สัจธรรม & พลังบวก",
    elementalGlyphEn: "Quintessence · Cosmic Illumination",
    themeColors: {
      badgeBg: "bg-[#F0EEE6]",
      badgeText: "text-[#595042]",
      badgeBorder: "border-[#DAD4C7]",
      accentText: "text-[#595042]",
      cardBorder: "#D2CCC0",
    },
  },
];
