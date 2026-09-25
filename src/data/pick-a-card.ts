/**
 * 🔮 ตัวตนของหัวข้อและกองไพ่ "Pick A Card (เลือกกองไพ่พยากรณ์)"
 * ===========================================================================
 * ## โครงสร้าง — แยก "ตัวตนของกอง" ออกจาก "คลังคำอ่าน"
 *
 * | ส่วน | อยู่ไฟล์ไหน | ใครโหลด |
 * |---|---|---|
 * | `PICK_A_CARD_TOPICS` (หัวข้อ · 4 กอง · คริสตัล · เนื้อหา SEO) | ไฟล์นี้ | ทุกที่ รวมถึงบันเดิลของเบราว์เซอร์ |
 * | `PICK_A_CARD_POOLS` (คลังคำอ่าน — ไพ่ 3 ใบ + ย่อหน้าประจำใบ) | [`pick-a-card-readings.ts`](./pick-a-card-readings.ts) | **ฝั่งเซิร์ฟเวอร์เท่านั้น** |
 *
 * ## ⚠️ ทำไมคลังคำอ่านถึงต้องอยู่คนละไฟล์ (ISSUE-050)
 *
 * คลังคำอ่านไทย+อังกฤษของทั้ง 8 หัวข้อหนักราว **1,600 บรรทัด** และผู้ใช้จะเห็นก็ต่อเมื่อ
 * เปิดกองแล้วเท่านั้น แต่ตอนที่ยังรวมอยู่ไฟล์เดียวกัน มันถูกลากเข้าบันเดิลของ `/pick-a-card`
 * **ตั้งแต่ไบต์แรก** (หน้านี้เคยหนัก 143 KB gzip = หนักที่สุดของเว็บ)
 *
 * ตอนนี้เซิร์ฟเวอร์เป็นผู้ประกอบย่อหน้าให้แล้วส่งมากับคำตอบของ `/api/reading/[id]/shuffle`
 * (ดู `src/lib/reading/derived-draw.ts`) เบราว์เซอร์จึงไม่ต้องรู้จักคลังคำอ่านเลยสักบรรทัด
 *
 * ⛔ **ห้าม import `pick-a-card-readings.ts` เข้าไฟล์ที่ฝั่งเบราว์เซอร์โหลด** (island · component ที่มี
 * `"use client"`) ไม่งั้นน้ำหนักทั้งก้อนจะกลับเข้าบันเดิลเงียบ ๆ อีกครั้ง — ด่าน `test-pick-a-card.ts` เฝ้าอยู่
 *
 * ## กติกาการเขียนเนื้อหา (ด่านที่ 76 บังคับ)
 *
 * - ย่อหน้าใน `currentSituation` / `hiddenLayer` / `oracleAdvice` **อ้างได้เฉพาะไพ่ของตำแหน่งตัวเอง**
 *   (ใบที่ 1 / 2 / 3 ตามลำดับ) ห้ามพูดถึงไพ่ใบอื่น เพราะใบอื่นถูกจั่วมาจากรายการอื่นในคลัง
 * - `theme` · `overview` · `affirmation` เดินทางไปกับ **ไพ่ใบแรก** จึงอ้างได้เฉพาะไพ่ใบแรก
 *
 * ⚠️ แก้เนื้อหาด้วยมือได้ แต่ต้องรัน `npx tsx scripts/qa/test-pick-a-card.ts` ทุกครั้ง
 */

export interface PickACardCardItem {
  cardId: string;
  isReversed: boolean;
  positionTh: string;
  positionEn: string;
}

export interface PickACardReading {
  theme: string;
  overview: string;
  currentSituation: string;
  hiddenLayer: string;
  oracleAdvice: string;
  affirmation: string;
}

/** กองที่ผู้ใช้เห็นและกดเลือก — เป็นตัวตน/บรรยากาศ ไม่ได้ผูกกับไพ่ใบใดใบหนึ่ง */
export interface PickACardSlot {
  id: string;
  number: number;
  crystalTh: string;
  crystalEn: string;
  crystalDescTh: string;
  crystalDescEn: string;
}

/** หนึ่งรายการในคลังคำอ่าน — ไพ่ 3 ใบพร้อมย่อหน้าประจำใบ */
export interface PickACardEntry {
  id: string;
  cards: [PickACardCardItem, PickACardCardItem, PickACardCardItem];
  readingTh: PickACardReading;
  readingEn: PickACardReading;
  targetSpreadId: string;
}

export interface PickACardTopic {
  id: string;
  slug: string;
  titleTh: string;
  titleEn: string;
  subtitleTh: string;
  subtitleEn: string;
  category: "love" | "career" | "spiritual";
  coverCardId: string;
  descriptionTh: string;
  descriptionEn: string;
  /** 4 กองที่ผู้ใช้เลือก */
  slots: readonly PickACardSlot[];
}

export const PICK_A_CARD_TOPICS: readonly PickACardTopic[] = [
  {
    id: "love-feelings",
    slug: "how-they-feel-about-you",
    titleTh: "เขาคิดยังไงกับเราในตอนนี้?",
    titleEn: "What Are They Thinking About You Right Now?",
    subtitleTh: "เจาะลึกความรู้สึกในใจ ความคิดที่เขาไม่เคยบอก และทิศทางความสัมพันธ์",
    subtitleEn: "Uncover their inner thoughts, unspoken emotions, and true intentions",
    category: "love",
    coverCardId: "major-02",
    descriptionTh: "สำหรับคนที่มีคนคุย คนในใจ แฟน หรือความสัมพันธ์ที่ยังคลุมเครือ หลับตา สูดหายใจเข้าลึก ๆ นึกถึงใบหน้าหรือชื่อของเขา แล้วเลือกกองไพ่ที่ดึงดูดใจคุณที่สุด",
    descriptionEn: "For anyone navigating a crush, situationship, partnership, or quiet longing. Close your eyes, take a deep breath, hold their name in your heart, and choose the pile that calls to you.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
      },
    ],
  },
  {
    id: "love-future",
    slug: "future-of-your-relationship",
    titleTh: "ทิศทางความรัก และความสัมพันธ์ในอนาคต",
    titleEn: "Future Direction of Your Relationship",
    subtitleTh: "ความรักของคุณกำลังเดินทางไปทางไหน และอะไรคือสิ่งที่จะช่วยให้ความสัมพันธ์เติบโต",
    subtitleEn: "Where is your love journey heading and what will foster profound harmony?",
    category: "love",
    coverCardId: "major-06",
    descriptionTh: "สำรวจแนวโน้มของหัวใจ ไม่ว่าคุณจะโสด กำลังคุย หรือมีคู่อยู่แล้ว ไพ่ทั้ง 4 กองจะช่วยสะท้อนเส้นทางข้างหน้าและข้อคิดเตือนใจ",
    descriptionEn: "Examine romantic currents ahead whether single, courting, or committed. These 4 piles unveil prospective milestones and intuitive wisdom.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
      },
    ],
  },
  {
    id: "career-finance",
    slug: "next-step-career-finance",
    titleTh: "ก้าวต่อไปเรื่องงาน และโอกาสการเงินใหม่",
    titleEn: "Your Next Step in Career & Finances",
    subtitleTh: "ตรวจเช็กจังหวะดวงการงาน การลงทุน และทิศทางสร้างรายได้ระลอกถัดไป",
    subtitleEn: "Discern upcoming professional pivots, financial openings, and strategic moves",
    category: "career",
    coverCardId: "pentacles-01",
    descriptionTh: "สำหรับคนที่กำลังมองหางานใหม่ คิดจะเริ่มต้นธุรกิจ หรือต้องการความชัดเจนเรื่องเงินและโปรเจกต์ข้างหน้า เลือกกองไพ่ที่ดึงดูดพลังงานคุณที่สุด",
    descriptionEn: "For pioneers seeking career breakthroughs, entrepreneurial leaps, or wealth milestones. Tune your focus and choose your guiding pile.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
      },
    ],
  },
  {
    id: "universe-guidance",
    slug: "urgent-message-from-the-universe",
    titleTh: "ข้อความเตือนสติ ที่จักรวาลอยากบอกคุณ",
    titleEn: "An Urgent Message from the Universe",
    subtitleTh: "สิ่งที่จิตวิญญาณของคุณต้องการได้ยินในตอนนี้ เพื่อเยียวยาและปลดล็อกพลังในตัวเอง",
    subtitleEn: "What your spirit needs to hear right now to heal, awaken, and flourish",
    category: "spiritual",
    coverCardId: "major-17",
    descriptionTh: "พักความวุ่นวายจากภายนอก ทำใจให้สงบ นึกถึงตนเองด้วยความรักและความเมตตา แล้วเลือกกองไพ่ที่ส่องประกายในใจคุณที่สุด",
    descriptionEn: "Quiet external noise, breathe with compassion toward your journey, and select the pile that resonates with your heart's sanctuary.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
      },
    ],
  },
  {
    id: "ex-return",
    slug: "will-they-come-back",
    titleTh: "เขาจะกลับมาไหม?",
    titleEn: "Will They Come Back?",
    subtitleTh: "อ่านใจคนที่เดินจากไป โอกาสที่จะกลับมา และสิ่งที่ขวางอยู่ตรงกลาง",
    subtitleEn: "Read the heart that walked away, the odds of return, and what stands between you",
    category: "love",
    coverCardId: "cups-06",
    descriptionTh: "สำหรับคนที่เพิ่งเลิกรา คนที่หายไปเงียบ ๆ หรือความสัมพันธ์ที่ยังไม่ได้ปิดให้จบ หลับตา หายใจเข้าลึก ๆ นึกถึงชื่อของเขา แล้วเลือกกองไพ่ที่ดึงดูดใจคุณที่สุด",
    descriptionEn: "For anyone freshly separated, ghosted, or holding a relationship that never properly closed. Close your eyes, breathe, hold their name, and choose the pile that pulls at you.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสิ่งที่มองไม่เห็น",
        crystalDescEn: "Stone of wisdom, intuition, and seeing what hides in plain sight",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจที่กลับมาเต็ม",
        crystalDescEn: "Stone of clarity, radiance, and restored inner strength",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจังหวะชีวิต",
        crystalDescEn: "Stone of truth, honesty, and recognising the timing of life",
      },
    ],
  },
  {
    id: "incoming-person",
    slug: "who-is-coming-into-your-life",
    titleTh: "คนที่กำลังจะเข้ามาในชีวิต",
    titleEn: "Who Is Coming Into Your Life",
    subtitleTh: "อ่านพลังงานของคนที่กำลังเดินเข้ามา สัญญาณที่จะได้เจอ และสิ่งที่ต้องเตรียมใจ",
    subtitleEn: "Read the energy of who is arriving, the signs of meeting, and what to prepare for",
    category: "love",
    coverCardId: "cups-12",
    descriptionTh: "สำหรับคนโสดที่กำลังรอใครสักคน หรือคนที่เพิ่งผ่านบทเก่ามาและอยากรู้ว่าบทใหม่หน้าตาเป็นอย่างไร หายใจเข้าลึก ๆ ถามใจตัวเองว่าอยากเจอคนแบบไหน แล้วเลือกกองที่สะดุดตาที่สุด",
    descriptionEn: "For anyone single and waiting, or freshly past an old chapter and curious what the next one looks like. Breathe, ask yourself who you hope to meet, and choose the pile that catches your eye.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสิ่งที่มองไม่เห็น",
        crystalDescEn: "Stone of wisdom, intuition, and seeing what hides in plain sight",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจที่กลับมาเต็ม",
        crystalDescEn: "Stone of clarity, radiance, and restored inner strength",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจังหวะชีวิต",
        crystalDescEn: "Stone of truth, honesty, and recognising the timing of life",
      },
    ],
  },
  {
    id: "money-month",
    slug: "money-luck-this-month",
    titleTh: "ดวงการเงินเดือนนี้",
    titleEn: "Your Money Luck This Month",
    subtitleTh: "อ่านกระแสเงินของเดือนนี้ รูรั่วที่มองไม่เห็น และโอกาสรายได้ที่กำลังมา",
    subtitleEn: "Read this month's cash flow, the leak you cannot see, and the income opening ahead",
    category: "career",
    coverCardId: "pentacles-01",
    descriptionTh: "สำหรับคนที่อยากรู้ว่าเดือนนี้เงินจะไหลไปทางไหน มีรายจ่ายอะไรที่ต้องระวัง และโอกาสรายได้ใหม่จะมาจากทางไหน หายใจเข้าลึก ๆ นึกถึงตัวเลขในบัญชีของคุณ แล้วเลือกกองที่สะดุดตาที่สุด",
    descriptionEn: "For anyone wondering where money flows this month, which expenses to watch, and where new income might come from. Breathe, picture your balance, and choose the pile that catches your eye.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสิ่งที่มองไม่เห็น",
        crystalDescEn: "Stone of wisdom, intuition, and seeing what hides in plain sight",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจที่กลับมาเต็ม",
        crystalDescEn: "Stone of clarity, radiance, and restored inner strength",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจังหวะชีวิต",
        crystalDescEn: "Stone of truth, honesty, and recognising the timing of life",
      },
    ],
  },
  {
    id: "others-view",
    slug: "what-people-think-of-you",
    titleTh: "สิ่งที่คนรอบตัวคิดกับคุณ",
    titleEn: "What People Around You Think",
    subtitleTh: "อ่านภาพที่คนอื่นเห็นในตัวคุณ สิ่งที่พูดกันลับหลัง และสิ่งที่ควรทำต่อจากนี้",
    subtitleEn: "How others see you, what is said behind your back, and what to do next",
    category: "spiritual",
    coverCardId: "wands-06",
    descriptionTh: "สำหรับคนที่สงสัยว่าคนที่ทำงาน เพื่อน หรือคนในครอบครัวมองคุณอย่างไรจริง ๆ หายใจเข้าลึก ๆ นึกถึงกลุ่มคนที่คุณอยากรู้ใจ แล้วเลือกกองไพ่ที่ดึงดูดคุณที่สุด",
    descriptionEn: "For anyone wondering how colleagues, friends, or family actually see them. Breathe, picture the group you have in mind, and choose the pile that draws you.",
    slots: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสิ่งที่มองไม่เห็น",
        crystalDescEn: "Stone of wisdom, intuition, and seeing what hides in plain sight",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจที่กลับมาเต็ม",
        crystalDescEn: "Stone of clarity, radiance, and restored inner strength",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจังหวะชีวิต",
        crystalDescEn: "Stone of truth, honesty, and recognising the timing of life",
      },
    ],
  },
];
