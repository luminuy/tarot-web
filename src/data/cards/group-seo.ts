/**
 * src/data/cards/group-seo.ts
 * ข้อมูลเนื้อหาเชิงลึกและบทนำสำหรับหน้าหมวดหมู่ไพ่ยิปซี (SEO Wave 2)
 * ออกแบบด้วยตัวพิมพ์ Editorial Luxury ไร้อิโมจิดวงดาว (กฎเหล็กข้อ 2 และข้อ 10)
 * เนื้อหาแต่ละหมวดยาวกว่า 300 คำเพื่อมอบคุณค่าที่แท้จริง ไม่ใช่ thin content
 */

export interface CardGroupInfo {
  id: "major" | "minor" | "wands" | "cups" | "swords" | "pentacles";
  nameTh: string;
  nameEn: string;
  seoTitleTh: string;
  descriptionTh: string;
  elementTh?: string;
  elementEn?: string;
  cardCount: number;
  heroTaglineTh: string;
  heroTaglineEn: string;
  /** เนื้อหาบทนำเชิงลึก (ไทย) ความยาวอย่างน้อย 300-400 คำ */
  introContentTh: {
    paragraphs: string[];
    highlights: { title: string; desc: string }[];
  };
  introContentEn: {
    paragraphs: string[];
    highlights: { title: string; desc: string }[];
  };
}

export const CARD_GROUPS: Record<CardGroupInfo["id"], CardGroupInfo> = {
  major: {
    id: "major",
    nameTh: "ไพ่ชุดใหญ่ (Major Arcana)",
    nameEn: "Major Arcana",
    seoTitleTh: "ความหมายไพ่ยิปซี ชุดใหญ่ 22 ใบ (Major Arcana) ครบทุกใบ",
    descriptionTh:
      "เจาะลึกความหมายไพ่ยิปซีชุดใหญ่ 22 ใบ (Major Arcana) ครบทุกใบ ตั้งแต่ The Fool ถึง The World ถอดรหัสการเดินทางของดวงวิญญาณ บทเรียนชีวิต และความหมายหัวตั้ง-หัวกลับ ฉบับดั้งเดิม 1909 Rider-Waite",
    cardCount: 22,
    heroTaglineTh: "บทเรียนชีวิตและบททดสอบสำคัญของดวงวิญญาณ 22 ด่าน",
    heroTaglineEn: "The Soul's Archetypal Journey of 22 Cosmic Gateways",
    introContentTh: {
      paragraphs: [
        "ไพ่ทาโรต์ชุดใหญ่ หรือ Major Arcana ประกอบด้วยไพ่ทั้งหมด 22 ใบ เรียงลำดับตั้งแต่หมายเลข 0 (The Fool) ไปจนถึงหมายเลข 21 (The World) คำว่า 'Arcana' มาจากภาษาละตินที่แปลว่า 'ความลึกลับ' หรือ 'ความลับอันลึกซึ้ง' ไพ่ชุดนี้จึงทำหน้าที่เป็นแกนนำหลักของสำรับทาโรต์ เพื่อสื่อสารข้อความที่มีน้ำหนักมากที่สุดในการพยากรณ์",
        "ในทางจิตวิทยาเชิงลึกตามแนวคิดของ คาร์ล ยุง (Carl Jung) ไพ่ชุดใหญ่สะท้อนภาพแม่แบบจิตใต้สำนึก (Archetypes) ที่มนุษย์ทุกคนต้องเผชิญในชีวิตจริง เป็นการเดินทางที่นักวิชาการเรียกว่า 'The Fool's Journey' ซึ่งเริ่มต้นจากความไร้เดียงสาและการก้าวเดินสู่วิถีใหม่ของ The Fool ผ่านการฝึกฝนเจตจำนงของ The Magician การค้นหาปรีชาญาณภายในกับ The High Priestess จนก้าวผ่านวิกฤติต่างๆ เช่น The Tower และจบลงด้วยความตระหนักรู้อันสมบูรณ์ใน The World",
        "เมื่อไพ่ชุดใหญ่ปรากฏขึ้นในผังพยากรณ์ นั่นหมายความว่าคำถามนั้นกำลังเผชิญกับจุดเปลี่ยนสำคัญ เหตุการณ์ที่มีพลังของโชคชะตา หรือบทเรียนชีวิตระดับจิตวิญญาณที่ไม่สามารถควบคุมได้ด้วยเรื่องหยุมหยิมประจำวัน การอ่านไพ่ชุดใหญ่จึงต้องมองข้ามเหตุการณ์เฉพาะหน้า แล้วมุ่งเน้นไปที่ทัศนคติ การเติบโตภายใน และทิศทางระยะยาวของผู้รับคำพยากรณ์",
      ],
      highlights: [
        {
          title: "การเดินทางของ The Fool",
          desc: "ลำดับไพ่ 0 ถึง 21 เปรียบเสมือนขั้นตอนพัฒนาการทางจิตวิญญาณ จากความไร้เดียงสาสู่ความรู้แจ้ง",
        },
        {
          title: "พลังงานระดับโชคชะตา",
          desc: "ส่งผลกระทบต่อแก่นของชีวิตมากกว่าเหตุการณ์ชั่วคราว สะท้อนจุดเปลี่ยนสำคัญที่มิอาจหลีกเลี่ยง",
        },
        {
          title: "แม่แบบจิตใต้สำนึกสากล",
          desc: "สะท้อนสัจธรรมและสภาวะจิตของมนุษย์ทุกยุคสมัย ช่วยให้เข้าใจแรงขับเคลื่อนที่ซ่อนอยู่ลึกที่สุด",
        },
      ],
    },
    introContentEn: {
      paragraphs: [
        "The Major Arcana consists of 22 sacred cards numbered from 0 (The Fool) to 21 (The World). Originating from the Latin word 'arcanum' meaning mystery or deep secret, these trump cards form the spiritual spine of the tarot deck, delivering the most potent insights in any divination spread.",
        "In Jungian analytical psychology, the Major Arcana represents universal archetypes embedded within the collective unconscious. Known as 'The Fool's Journey', this symbolic progression traces the evolution of human consciousness—from the pure innocence of The Fool, through mastery of the conscious will with The Magician, inner wisdom of The High Priestess, through the purifying fires of The Tower, culminating in holistic integration with The World.",
        "When Major Arcana cards dominate a reading, they signal pivotal life turning points, karmic milestones, and lessons that transcend mundane routines. They invite you to look beyond superficial circumstances into the profound psychological and spiritual currents shaping your destiny.",
      ],
      highlights: [
        {
          title: "The Fool's Journey",
          desc: "A timeless narrative of spiritual awakening and psychological individuation from 0 to 21.",
        },
        {
          title: "Karmic Weight",
          desc: "Represents transformative life forces, major transitions, and macrocosmic destiny.",
        },
        {
          title: "Universal Archetypes",
          desc: "Mirrors inner psyche states and universal truths accessible across cultures and eras.",
        },
      ],
    },
  },

  minor: {
    id: "minor",
    nameTh: "ไพ่ชุดเล็ก (Minor Arcana)",
    nameEn: "Minor Arcana",
    seoTitleTh: "ความหมายไพ่ยิปซี ชุดเล็ก 56 ใบ (Minor Arcana) 4 ดอก",
    descriptionTh:
      "รวมความหมายไพ่ยิปซีชุดเล็ก 56 ใบ (Minor Arcana) ครบทั้ง 4 ดอก ไม้เท้า ถ้วย ดาบ เหรียญ สะท้อนเหตุการณ์ การตัดสินใจ และผู้คนในชีวิตประจำวัน พร้อมคำแปลหัวตั้ง-กลับหัว 1909 Rider-Waite",
    cardCount: 56,
    heroTaglineTh: "ภาพสะท้อนชีวิตประจำวัน อารมณ์ ความคิด และการกระทำของมนุษย์",
    heroTaglineEn: "The Everyday Symphony of Mind, Heart, Will, and World",
    introContentTh: {
      paragraphs: [
        "ไพ่ชุดเล็ก หรือ Minor Arcana ประกอบด้วยไพ่ 56 ใบ แบ่งออกเป็น 4 ดอก ดอกละ 14 ใบ ได้แก่ ไม้เท้า (Wands), ถ้วย (Cups), ดาบ (Swords), และเหรียญ (Pentacles) หากไพ่ชุดใหญ่คือภาพรวมของโชคชะตา ไพ่ชุดเล็กก็คือรายละเอียดปลีกย่อยของการดำเนินชีวิตจริง ที่ซึ่งเราต้องเผชิญกับอารมณ์ ความคิด การลงมือทำ และปฏิสัมพันธ์กับผู้คนรอบตัวในแต่ละวัน",
        "ในแต่ละดอกจะประกอบด้วยไพ่ตัวเลข 10 ใบ (Ace ถึง 10) และไพ่บุคคลราชสำนัก 4 ใบ (Page, Knight, Queen, King) ไพ่ตัวเลขแสดงถึงขั้นตอนและระดับความเข้มข้นของเหตุการณ์ ตั้งแต่จุดเริ่มต้น (Ace) การพัฒนา การเผชิญอุปสรรค จนถึงจุดสิ้นสุดของวงจร (10) ส่วนไพ่บุคคลสะท้อนถึงบทบาท บุคลิกภาพ วุฒิภาวะ หรือบุคคลที่มีบทบาทเข้ามาเกี่ยวข้องในชีวิตของผู้รับคำทำนาย",
        "ไพ่ชุดเล็กเชื่อมโยงกับธาตุทั้งสี่ตามหลักปรัชญาโบราณ ได้แก่ ธาตุไฟ ธาตุน้ำ ธาตุลม และธาตุดิน การทำความเข้าใจไพ่ชุดเล็กช่วยให้เราสามารถมองเห็นวิธีรับมือกับปัญหาเฉพาะหน้าได้อย่างเป็นรูปธรรม บอกเล่าทั้งสถานการณ์การงาน ปัญหารักสามเส้า การบริหารเงิน หรือการตัดสินใจที่ต้องลงมือกระทำจริง",
      ],
      highlights: [
        {
          title: "4 ดอก 4 ธาตุธรรมชาติ",
          desc: "แบ่งตามพลังงานพื้นฐาน: ไม้เท้า (ไฟ), ถ้วย (น้ำ), ดาบ (ลม), และเหรียญ (ดิน)",
        },
        {
          title: "ไพ่ตัวเลข Ace ถึง 10",
          desc: "แสดงวิวัฒนาการและลำดับขั้นของสถานการณ์ ตั้งแต่ประกายความคิดแรกสู่ผลลัพธ์ปลายทาง",
        },
        {
          title: "ไพ่บุคคลราชสำนัก (Court Cards)",
          desc: "สะท้อนระดับวุฒิภาวะ อุปนิสัย หรือบุคคลรอบข้างที่ส่งอิทธิพลต่อคำถามนั้นโดยตรง",
        },
      ],
    },
    introContentEn: {
      paragraphs: [
        "The Minor Arcana comprises 56 cards divided into four elemental suits of 14 cards each: Wands, Cups, Swords, and Pentacles. While the Major Arcana paints the grand strokes of spiritual destiny, the Minor Arcana illustrates the practical fabric of day-to-day existence—our decisions, relationships, emotional highs and lows, and material endeavors.",
        "Each suit contains ten pip cards (Ace through 10) and four Court cards (Page, Knight, Queen, King). The numbered cards depict sequential development from inception (Ace) through cultivation, trial, and fulfillment (10). The court cards portray personality types, maturity stages, behavioral styles, or real individuals influencing the querent's path.",
        "Rooted in the classical four elements (Fire, Water, Air, Earth), the Minor Arcana offers grounded, actionable counsel. It reveals how abstract possibilities manifest in tangible reality, equipping you to make clear choices in career negotiations, romantic dynamics, and resource management.",
      ],
      highlights: [
        {
          title: "Four Elemental Suits",
          desc: "Wands (Fire), Cups (Water), Swords (Air), and Pentacles (Earth) forming the human realm.",
        },
        {
          title: "Numbered Sequence (Ace–10)",
          desc: "Tracks the natural cycle of events from initial spark to culmination.",
        },
        {
          title: "Royal Court Cards",
          desc: "Embodies degrees of mastery, personal traits, and interpersonal interactions.",
        },
      ],
    },
  },

  wands: {
    id: "wands",
    nameTh: "ไม้เท้า (Suit of Wands)",
    nameEn: "Suit of Wands",
    seoTitleTh: "ความหมายไพ่ยิปซี ดอกไม้เท้า 14 ใบ (Wands) ธาตุไฟ",
    descriptionTh:
      "เจาะลึกความหมายไพ่ยิปซีดอกไม้เท้าครบ 14 ใบ (Suit of Wands) ตัวแทนแห่งธาตุไฟ พลังงาน ความมุ่งมั่น การงาน การเติบโต และแรงบันดาลใจ ทั้งหัวตั้งและกลับหัว 1909 Rider-Waite",
    elementTh: "ไฟ",
    elementEn: "Fire",
    cardCount: 14,
    heroTaglineTh: "พลังแห่งธาตุไฟ ความมุ่งมั่น การงาน ความคิดสร้างสรรค์ และแรงผลักดัน",
    heroTaglineEn: "The Spark of Fire: Passion, Ambition, Will, and Creative Drive",
    introContentTh: {
      paragraphs: [
        "ชุดไพ่ไม้เท้า (Wands) สอดคล้องกับ 'ธาตุไฟ' ซึ่งเป็นสัญลักษณ์ของความมีชีวิตชีวา พลังงาน การเคลื่อนไหว ความคิดสร้างสรรค์ เจตจำนงอันมุ่งมั่น และความปรารถนาในการเติบโตก้าวหน้า ในทางโหราศาสตร์ ไพ่ชุดนี้สัมพันธ์กับราศีธาตุไฟ ได้แก่ ราศีเมษ (Aries), ราศีสิงห์ (Leo), และราศีธนู (Sagittarius)",
        "ไพ่ไม้เท้าจะปรากฏขึ้นอย่างโดดเด่นเมื่อผู้รับคำทำนายกำลังถามถึงเรื่องการงาน โปรเจกต์ใหม่ ความทะเยอทะยาน การแข่งขัน การศึกษาต่อ หรือการเริ่มต้นสิ่งใหม่ที่ต้องอาศัยแรงกายและแรงใจ ไม้เท้าบอกเล่าเรื่องราวของประกายไฟตั้งแต่การได้รับแรงบันดาลใจแรก (Ace of Wands) การวางแผนขยายขอบเขต (Two of Wands) ไปจนถึงการแบกรับภาระหน้าที่อันหนักหน่วง (Ten of Wands)",
        "ในแง่ของความรัก ไพ่ไม้เท้าสะท้อนถึงแรงดึงดูดทางกายภาพ ความหลงใหล และความกระตือรือร้นในการพิชิตใจ ส่วนในตำแหน่งกลับหัว ไพ่ชุดนี้มักเตือนถึงภาวะหมดไฟ (Burnout), ความใจร้อนวู่วาม, การขาดทิศทางที่ชัดเจน, หรือความขัดแย้งที่เกิดจากอัตตา",
      ],
      highlights: [
        {
          title: "ธาตุไฟ (Fire Element)",
          desc: "ราศีเมษ, ราศีสิงห์, ราศีธนู ตัวแทนแห่งพลังงาน ความคิดสร้างสรรค์ และความทะเยอทะยาน",
        },
        {
          title: "แกนหลักด้านการงาน",
          desc: "สะท้อนความก้าวหน้าในอาชีพ การก่อตั้งธุรกิจ การแข่งขัน และการลงมือปฏิบัติจริง",
        },
        {
          title: "เจตจำนงและแรงผลักดัน",
          desc: "กระตุ้นให้ลงมือทำด้วยความกล้าหาญ เผชิญหน้ากับความท้าทายเพื่อบรรลุเป้าหมายที่ตั้งไว้",
        },
      ],
    },
    introContentEn: {
      paragraphs: [
        "The Suit of Wands corresponds to the element of Fire—the universal symbol of vital life force, dynamic action, boundless creativity, passionate ambition, and the assertive human will. Astrologically, it harmonizes with the fire signs: Aries, Leo, and Sagittarius.",
        "Wands emerge prominently in inquiries regarding career trajectory, entrepreneurial ventures, visionary pursuits, competition, and leadership. They narrate the odyssey of ignition—from the primordial spark of creative inspiration (Ace of Wands), to horizon-scanning planning (Two of Wands), through the demanding burdens of overcommitment (Ten of Wands).",
        "In relationship readings, Wands symbolize magnetic chemistry, enthusiasm, and daring pursuit. When reversed, the suit cautions against burnout, impetuous impatience, misplaced aggression, or creative paralysis resulting from scattered focus.",
      ],
      highlights: [
        {
          title: "Element of Fire",
          desc: "Aries, Leo, Sagittarius: Vitality, raw ambition, leadership, and visionary energy.",
        },
        {
          title: "Professional Growth",
          desc: "Illuminates career crossroads, enterprise building, and creative endeavors.",
        },
        {
          title: "Will and Purpose",
          desc: "Encourages courageous execution and the resilience to transform vision into victory.",
        },
      ],
    },
  },

  cups: {
    id: "cups",
    nameTh: "ถ้วย (Suit of Cups)",
    nameEn: "Suit of Cups",
    seoTitleTh: "ความหมายไพ่ยิปซี ดอกถ้วย 14 ใบ (Cups) ธาตุน้ำ",
    descriptionTh:
      "เจาะลึกความหมายไพ่ยิปซีดอกถ้วยครบ 14 ใบ (Suit of Cups) ตัวแทนแห่งธาตุน้ำ ความรัก อารมณ์ ความรู้สึก ความสัมพันธ์ และสัญชาตญาณ ทั้งหัวตั้งและกลับหัว 1909 Rider-Waite",
    elementTh: "น้ำ",
    elementEn: "Water",
    cardCount: 14,
    heroTaglineTh: "สายน้ำแห่งอารมณ์ ความรัก ความผูกพัน สัญชาตญาณ และความสงบในใจ",
    heroTaglineEn: "The Waters of the Soul: Love, Deep Connection, Emotion, and Intuition",
    introContentTh: {
      paragraphs: [
        "ชุดไพ่ถ้วย (Cups) สอดคล้องกับ 'ธาตุน้ำ' ซึ่งสะท้อนมิติอันลึกซึ้งของโลกภายใน จิตใจ ความรัก ความผูกพัน ความเห็นอกเห็นใจ จินตนาการ และสัญชาตญาณทางจิตวิญญาณ ในทางโหราศาสตร์ ไพ่ชุดถ้วยสัมพันธ์กับราศีธาตุน้ำ ได้แก่ ราศีกรกฎ (Cancer), ราศีพิจิก (Scorpio), และราศีมีน (Pisces)",
        "ไพ่ถ้วยคือหัวใจหลักในการทำนายเรื่องความรักและความสัมพันธ์ ทุกครั้งที่มีคำถามว่า 'เขารู้สึกอย่างไรกับเรา' หรือ 'ความสัมพันธ์จะพัฒนาไปในทิศทางใด' ไพ่ชุดนี้จะให้คำตอบที่ชัดเจนและตรงจุดที่สุด ไพ่ถ้วยแสดงถึงการเปิดใจรับความรัก (Ace of Cups), การแลกเปลี่ยนความรู้สึกที่งดงาม (Two of Cups), ความสุขร่วมกับมิตรสหาย (Three of Cups), ตลอดจนความผิดหวังและรอยแผลใจ (Five of Cups)",
        "นอกจากความรักระหว่างบุคคลแล้ว ไพ่ถ้วยยังสื่อถึงความสัมพันธ์กับตัวเราเอง การเยียวยาบาดแผลทางอารมณ์ การให้อภัย และการฟังสัญชาตญาณเสียงกระซิบจากภายใน เมื่อไพ่ถ้วยกลับหัว มักบ่งชี้ถึงภาวะอารมณ์แปรปรวน ความเหงา การยึดติดกับอดีต หรือการปิดกั้นหัวใจเพราะความกลัว",
      ],
      highlights: [
        {
          title: "ธาตุน้ำ (Water Element)",
          desc: "ราศีกรกฎ, ราศีพิจิก, ราศีมีน ตัวแทนแห่งความรู้สึก สัญชาตญาณ และสายใยแห่งความผูกพัน",
        },
        {
          title: "หัวใจแห่งความรักและความสัมพันธ์",
          desc: "ตอบคำถามเรื่องความในใจ คู่ครอง มิตรภาพ และความเข้าใจซึ่งกันและกันอย่างลึกซึ้ง",
        },
        {
          title: "การเยียวยาจิตวิญญาณ",
          desc: "ชี้นำการฟื้นฟูจิตใจ การปล่อยวางความเจ็บปวด และการค้นพบสันติสุขที่แท้จริงภายในตน",
        },
      ],
    },
    introContentEn: {
      paragraphs: [
        "The Suit of Cups aligns with the receptive element of Water—the sacred conduit of feelings, romantic devotion, psychological sensitivity, empathic resonance, and psychic intuition. In Western astrology, it mirrors the water triplicity: Cancer, Scorpio, and Pisces.",
        "Cups reign supreme in consultations exploring love, emotional vulnerability, and interpersonal connections. They unveil what words often conceal—from the overflowing vessel of unconditional love (Ace of Cups), harmonious mutual affection (Two of Cups), communal celebration (Three of Cups), to the poignant sorrow of emotional grief (Five of Cups).",
        "Beyond romance, Cups govern our relationship with our own interior landscape: emotional healing, forgiveness, poetic imagination, and spiritual peace. In inverted aspects, Cups warn against codependency, emotional escapism, chronic dissatisfaction, or guarded emotional withdrawal.",
      ],
      highlights: [
        {
          title: "Element of Water",
          desc: "Cancer, Scorpio, Pisces: Emotion, intuition, empathy, and subconscious depth.",
        },
        {
          title: "Core of Relationships",
          desc: "Explores heart-to-heart dynamics, true intentions, and lasting romantic bonds.",
        },
        {
          title: "Emotional Healing",
          desc: "Guides the release of past wounds and the cultivation of self-compassion.",
        },
      ],
    },
  },

  swords: {
    id: "swords",
    nameTh: "ดาบ (Suit of Swords)",
    nameEn: "Suit of Swords",
    seoTitleTh: "ความหมายไพ่ยิปซี ดอกดาบ 14 ใบ (Swords) ธาตุลม",
    descriptionTh:
      "เจาะลึกความหมายไพ่ยิปซีดอกดาบครบ 14 ใบ (Suit of Swords) ตัวแทนแห่งธาตุลม ความคิด สติปัญญา การตัดสินใจ ความจริง และอุปสรรคชีวิต ทั้งหัวตั้งและกลับหัว 1909 Rider-Waite",
    elementTh: "ลม",
    elementEn: "Air",
    cardCount: 14,
    heroTaglineTh: "คมดาบแห่งสติปัญญา ความคิด การสื่อสาร ความจริง และการตัดผ่านอุปสรรค",
    heroTaglineEn: "The Sword of Truth: Intellect, Decision, Clarity, and Mental Mastery",
    introContentTh: {
      paragraphs: [
        "ชุดไพ่ดาบ (Swords) สอดคล้องกับ 'ธาตุลม' ซึ่งเป็นตัวแทนของกระบวนการคิด สติปัญญา ตรรกะ เหตุผล การสื่อสาร การแสวงหาความจริง และความยุติธรรม ในทางโหราศาสตร์ ไพ่ชุดนี้สัมพันธ์กับราศีธาตุลม ได้แก่ ราศีเมถุน (Gemini), ราศีตุลย์ (Libra), และราศีกุมภ์ (Aquarius)",
        "ไพ่ดาบมักถูกมองว่าเป็นชุดไพ่ที่น่าเกรงขามที่สุด เพราะคมดาบเป็นอาวุธสองคมที่สามารถใช้ตัดผ่านความคลุมเครือเพื่อค้นหาความจริง หรืออาจหันกลับมาทำร้ายจิตใจด้วยความกังวลและความคิดมาก ไพ่ชุดนี้สะท้อนบททดสอบทางจิตวิทยา ตั้งแต่ความกระจ่างชัดแจ้งของสติปัญญา (Ace of Swords) ความเจ็บปวดจากความจริงที่ต้องยอมรับ (Three of Swords) ไปจนถึงการสิ้นสุดของความทุกข์ทรมาน (Ten of Swords)",
        "ในการทำนายชีวิตจริง ไพ่ดาบมักเตือนถึงการสื่อสารที่ตรงเกินไป การขัดแย้งทางความคิด ปัญหากฎหมาย หรือความจำเป็นต้องตัดสินใจอย่างเด็ดขาดโดยไม่ใช้อารมณ์ครอบงำ เมื่อไพ่ดาบกลับหัว มักสื่อถึงการคลี่คลายของความเครียด การมองเห็นทางออกจากวิกฤต หรือในทางตรงกันข้ามคือการหลอกลวงตนเองและปฏิเสธความจริง",
      ],
      highlights: [
        {
          title: "ธาตุลม (Air Element)",
          desc: "ราศีเมถุน, ราศีตุลย์, ราศีกุมภ์ ตัวแทนแห่งสติปัญญา ตรรกะ การสื่อสาร และความจริง",
        },
        {
          title: "คมดาบแห่งการตัดสินใจ",
          desc: "ช่วยแยกแยะระหว่างข้อเท็จจริงกับอคติ ชี้นำให้ตัดสินใจด้วยความหนักแน่นและเฉียบขาด",
        },
        {
          title: "การก้าวข้ามความเจ็บปวด",
          desc: "ชี้ให้เห็นรากเหง้าของความวิตกกังวล และมอบปัญญาเพื่อยุติความทุกข์ที่เกิดจากความคิด",
        },
      ],
    },
    introContentEn: {
      paragraphs: [
        "The Suit of Swords aligns with the element of Air—the domain of intellect, rational analysis, clear communication, the pursuit of truth, ethical justice, and mental resilience. Astrologically, it resonates with the air signs: Gemini, Libra, and Aquarius.",
        "Swords are often regarded as the most challenging suit because the blade is inherently double-edged: it cuts through delusion to reveal unvarnished truth, yet can inflict deep psychological wounds when weaponized by overthinking and fear. The suit illustrates mental crucibles—from razor-sharp breakthrough clarity (Ace of Swords), through heartbreak and cognitive dissonance (Three of Swords), to rock bottom liberation (Ten of Swords).",
        "In practical readings, Swords indicate analytical problem-solving, legal deliberations, ideological disputes, or tough decisions requiring objectivity over sentimentality. When reversed, Swords signal release from chronic anxiety, breakthrough resolution, or warning signs of self-deception and harsh speech.",
      ],
      highlights: [
        {
          title: "Element of Air",
          desc: "Gemini, Libra, Aquarius: Intellect, logic, honest dialogue, and impartial discernment.",
        },
        {
          title: "Decisive Discernment",
          desc: "Slices through confusion to establish objective clarity and courageous choices.",
        },
        {
          title: "Mental Transmutation",
          desc: "Exposes unconscious cognitive traps, leading toward mental liberation and inner peace.",
        },
      ],
    },
  },

  pentacles: {
    id: "pentacles",
    nameTh: "เหรียญ (Suit of Pentacles)",
    nameEn: "Suit of Pentacles",
    seoTitleTh: "ความหมายไพ่ยิปซี ดอกเหรียญ 14 ใบ (Pentacles) ธาตุดิน",
    descriptionTh:
      "เจาะลึกความหมายไพ่ยิปซีดอกเหรียญครบ 14 ใบ (Suit of Pentacles) ตัวแทนแห่งธาตุดิน การเงิน โชคลาภ ธุรกิจ ความมั่นคง และผลสัมฤทธิ์ในโลกความเป็นจริง ทั้งหัวตั้งและกลับหัว 1909 Rider-Waite",
    elementTh: "ดิน",
    elementEn: "Earth",
    cardCount: 14,
    heroTaglineTh: "ความมั่นคงแห่งธาตุดิน ทรัพย์สิน การเงิน การงานระยะยาว และความสำเร็จรูปธรรม",
    heroTaglineEn: "The Ground of Being: Wealth, Mastery, Stability, and Tangible Abundance",
    introContentTh: {
      paragraphs: [
        "ชุดไพ่เหรียญ (Pentacles หรือ Coins) สอดคล้องกับ 'ธาตุดิน' ซึ่งเป็นสัญลักษณ์ของความมั่นคง ความเป็นจริงทางกายภาพ โลกวัตถุ ทรัพย์สินเงินทอง ธุรกิจการค้า สุขภาพร่างกาย และผลลัพธ์ที่จับต้องได้ ในทางโหราศาสตร์ ไพ่ชุดนี้สัมพันธ์กับราศีธาตุดิน ได้แก่ ราศีพฤษภ (Taurus), ราศีกันย์ (Virgo), และราศีมังกร (Capricorn)",
        "ไพ่เหรียญคือตัวแทนของความอดทน การลงแรง และการสั่งสมความสำเร็จอย่างเป็นขั้นเป็นตอน ไพ่ชุดนี้จะปรากฏขึ้นเสมอเมื่อคำถามเกี่ยวข้องกับการลงทุน การซื้อขายอสังหาริมทรัพย์ สถานะทางการเงิน ความปลอดภัยในอาชีพการงาน หรือผลตอบแทนจากการทุ่มเททำงานหนัก แสดงตั้งแต่โอกาสทางการเงินใหม่ๆ (Ace of Pentacles), ทักษะความเชี่ยวชาญระดับมืออาชีพ (Eight of Pentacles), ไปจนถึงมรดกและความมั่งคั่งที่ยั่งยืน (Ten of Pentacles)",
        "ในมุมของชีวิตและจิตใจ ไพ่เหรียญสอนให้เราอยู่กับโลกแห่งความเป็นจริง รู้จักเห็นคุณค่าในสิ่งที่มี ดูแลสุขภาพร่างกาย และสร้างรากฐานที่มั่นคงให้แก่ตนเองและครอบครัว เมื่อไพ่เหรียญกลับหัว มักเตือนถึงความตระหนี่ถี่เหนียว ความโลภ หนี้สิน ปัญหาการจัดการเงิน หรือการมัวแต่แสวงหาวัตถุจนละเลยจิตวิญญาณ",
      ],
      highlights: [
        {
          title: "ธาตุดิน (Earth Element)",
          desc: "ราศีพฤษภ, ราศีกันย์, ราศีมังกร ตัวแทนแห่งความมั่นคง ความมั่งคั่ง และผลลัพธ์ที่เป็นรูปธรรม",
        },
        {
          title: "การเงินและธุรกิจ",
          desc: "ตอบโจทย์เรื่องการลงทุน รายได้ โชคลาภ ความปลอดภัยทางการเงิน และการวางแผนระยะยาว",
        },
        {
          title: "ความอดทนและความเชี่ยวชาญ",
          desc: "ส่งเสริมการทำงานด้วยความเพียรพยายาม การพัฒนาทักษะฝีมือ และการสร้างรากฐานที่แข็งแกร่ง",
        },
      ],
    },
    introContentEn: {
      paragraphs: [
        "The Suit of Pentacles (traditionally Coins or Disks) aligns with the enduring element of Earth—the tangible matrix of physical reality, material resources, financial security, somatic health, nature, craftsmanship, and grounded accomplishments. Astrologically, it reflects the earth signs: Taurus, Virgo, and Capricorn.",
        "Pentacles embody patient accumulation, practical stewardship, and manifest reality. They govern questions regarding wealth creation, property transactions, career longevity, and the tangible fruits of disciplined labor. The narrative unfolds from seeds of financial opportunity (Ace of Pentacles), through apprenticeship mastery (Eight of Pentacles), to generational legacy and generational security (Ten of Pentacles).",
        "Spiritually, Pentacles teach grounded mindfulness—honoring the body as a temple and anchoring vision into earthly substance. In reversed orientations, Pentacles warn against miserliness, greed, reckless financial mismanagement, or becoming so consumed by materialism that the soul's welfare is forgotten.",
      ],
      highlights: [
        {
          title: "Element of Earth",
          desc: "Taurus, Virgo, Capricorn: Stability, material security, bodily wellness, and pragmatic wisdom.",
        },
        {
          title: "Financial Stewardship",
          desc: "Addresses investments, long-term assets, sustainable enterprise, and resource management.",
        },
        {
          title: "Patient Mastery",
          desc: "Celebrates disciplined craft, meticulous work ethic, and enduring worldly achievement.",
        },
      ],
    },
  },
};
