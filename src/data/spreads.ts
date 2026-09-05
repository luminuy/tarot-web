import type { Category } from "./cards/types";

/**
 * รูปแบบการวางไพ่ (Spread) 20 ผังพยากรณ์ยอดนิยม — ภาษาเข้าใจง่าย กระชับ สมดุล
 * รองรับทั้งภาษาไทยและ American English ระดับมืออาชีพ
 */

export interface SpreadPosition {
  index: number;
  nameTh: string;
  nameEn?: string;
  /** อธิบายว่าไพ่ตรงนี้ตอบคำถามอะไร — ส่งให้ AI ใช้ตีความ */
  meaning: string;
  meaningEn?: string;
  /** พิกัดบนผืนผ้าสำหรับจัดวาง UI (หน่วยเป็นสัดส่วน 0-1) */
  x: number;
  y: number;
  /** องศาการหมุนของไพ่ เช่น ไพ่ขวางใน Celtic Cross */
  rotate?: number;
}

export interface Spread {
  id: string;
  nameTh: string;
  nameEn: string;
  /** คำโปรยสั้น ๆ บนหน้าเลือก spread */
  tagline: string;
  taglineEn: string;
  description: string;
  descriptionEn: string;
  /** หมวดคำถามเริ่มต้น ใช้เลือกชุดความหมายไพ่ */
  defaultCategory: Category;
  positions: SpreadPosition[];
  /** ราคาเป็นเครดิต — 0 คือเปิดให้ใช้ฟรี */
  credits: number;
  /** ให้ผู้ใช้ที่ยังไม่ล็อกอินลองได้ไหม */
  guestAllowed: boolean;
  /** โหมดตอบ ใช่/ไม่ใช่ — จะให้ AI สรุปคำตอบชัดเจนเพิ่ม */
  yesNoMode?: boolean;
  /** ใช้กับ UI ผลลัพธ์แบบไหน — ไม่ระบุ = "full" (StreamReader เดิม) */
  resultStyle?: "quick" | "full";
}

export const SPREADS: Spread[] = [
  // ==========================================
  // หมวด 1: ยอดนิยม & คำถามด่วน (Quick & Core)
  // ==========================================
  {
    id: "daily",
    nameTh: "ดวงรายวัน (ไพ่ 1 ใบ)",
    nameEn: "Daily Tarot Guidance (1 Card)",
    tagline: "เช็กพลังงานและข้อคิดประจำวันนี้",
    taglineEn: "Check your energetic compass and daily inspiration",
    description:
      "เปิดไพ่ใบเดียวเพื่อรับพลังงานบวกและคำแนะนำในการใช้ชีวิตตลอดทั้งวัน เหมาะสำหรับเริ่มต้นเช้าวันใหม่อย่างมั่นใจ",
    descriptionEn:
      "Draw a single card to receive uplifting perspective and intuitive guidance for the day ahead.",
    defaultCategory: "general",
    credits: 0,
    guestAllowed: true,
    positions: [
      {
        index: 0,
        nameTh: "พลังงานและคำแนะนำวันนี้",
        nameEn: "Today's Energy & Counsel",
        meaning: "สิ่งที่ควรใส่ใจและแนวทางการรับมือตลอดวันนี้",
        meaningEn: "Core focal energy and intuitive navigation for your day",
        x: 0.5,
        y: 0.5,
      },
    ],
  },
  {
    id: "quick",
    nameTh: "ถามไวตอบตรง (ไพ่ 1 ใบ)",
    nameEn: "Direct Clarity (1 Card)",
    tagline: "มีเรื่องคาใจ เปิดใบเดียวรู้เรื่อง",
    taglineEn: "Pressing question? A single card for immediate clarity",
    description: "เหมาะสำหรับคนที่มีเรื่องสงสัยเฉพาะเจาะจง อยากได้คำตอบตรงไปตรงมา ชัดเจน ไม่ต้องอ้อมค้อม",
    descriptionEn: "Designed for specific, acute inquiries when you need unvarnished, direct truth without detours.",
    defaultCategory: "general",
    credits: 0,
    guestAllowed: true,
    resultStyle: "quick",
    positions: [
      {
        index: 0,
        nameTh: "คำตอบต่อเรื่องนี้",
        nameEn: "The Core Answer",
        meaning: "คำตอบตรงต่อคำถามที่ผู้ถามตั้งจิตถาม",
        meaningEn: "Direct, focused revelation regarding your inquiry",
        x: 0.5,
        y: 0.5,
      },
    ],
  },
  {
    id: "yes-no",
    nameTh: "ใช่หรือไม่ (ไพ่ 3 ใบ)",
    nameEn: "Yes or No (3 Cards)",
    tagline: "ลังเลตัดสินใจไม่ได้ ให้ไพ่ช่วยฟันธง",
    taglineEn: "Facing a dilemma? Let the cards reveal the balance",
    description:
      "ตอบคำถามที่อยากรู้ว่า 'ใช่' หรือ 'ไม่ใช่' พร้อมชี้แจงเหตุผลเบื้องหลัง และจุดที่ต้องระวังก่อนตัดสินใจ",
    descriptionEn:
      "Examines a decisive inquiry with an overarching Yes/No tendency, underlying catalyst, and blind spots to heed.",
    defaultCategory: "general",
    credits: 1,
    guestAllowed: false,
    yesNoMode: true,
    positions: [
      {
        index: 0,
        nameTh: "1. คำตอบสรุป (ใช่ / ไม่ใช่)",
        nameEn: "1. Core Tendency (Yes / No)",
        meaning: "แนวโน้มคำตอบหลักว่าไปในทิศทางใช่หรือไม่ใช่",
        meaningEn: "The prevailing momentum toward an affirmative or negative outcome",
        x: 0.5,
        y: 0.34,
      },
      {
        index: 1,
        nameTh: "2. เหตุผลเบื้องหลัง",
        nameEn: "2. Underlying Catalyst",
        meaning: "สาเหตุและปัจจัยที่ทำให้ผลลัพธ์ออกมาเป็นเช่นนี้",
        meaningEn: "The driving forces and roots shaping this direction",
        x: 0.3,
        y: 0.68,
      },
      {
        index: 2,
        nameTh: "3. ข้อควรระวัง",
        nameEn: "3. Crucial Blind Spot",
        meaning: "สิ่งที่ไม่ควรมองข้ามหรือจุดที่อาจทำให้ผลลัพธ์พลิกผัน",
        meaningEn: "Essential cautions or potential variables that could pivot the outcome",
        x: 0.7,
        y: 0.68,
      },
    ],
  },
  {
    id: "three-card",
    nameTh: "อดีต-ปัจจุบัน-อนาคต (ไพ่ 3 ใบ)",
    nameEn: "Past · Present · Future (3 Cards)",
    tagline: "มองเห็นที่มา สิ่งที่เป็นอยู่ และแนวโน้มข้างหน้า",
    taglineEn: "Understand origins, present reality, and emerging trajectory",
    description:
      "ผัง 3 ใบคลาสสิกยอดนิยม ช่วยให้เข้าใจว่าเรื่องนี้เริ่มต้นจากอะไร ตอนนี้อยู่จุดไหน และปลายทางจะมุ่งไปทิศทางใด",
    descriptionEn:
      "The classic timeless three-card layout tracing the arc of your situation through time.",
    defaultCategory: "general",
    credits: 1,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. อดีต (ที่มาของเรื่องนี้)",
        nameEn: "1. Past (Foundational Roots)",
        meaning: "รากของเรื่องนี้ สิ่งที่ผ่านมาแล้วและยังส่งผลต่อเนื่องมาถึงปัจจุบัน",
        meaningEn: "The roots and prior events actively influencing your present situation",
        x: 0.22,
        y: 0.5,
      },
      {
        index: 1,
        nameTh: "2. ปัจจุบัน (สิ่งที่เป็นอยู่ตอนนี้)",
        nameEn: "2. Present (Current Reality)",
        meaning: "สถานการณ์จริงในปัจจุบัน และสิ่งที่ผู้ถามกำลังเผชิญหน้าอยู่",
        meaningEn: "The immediate reality and energetic dynamics you currently face",
        x: 0.5,
        y: 0.5,
      },
      {
        index: 2,
        nameTh: "3. อนาคต (แนวโน้มข้างหน้า)",
        nameEn: "3. Future (Emerging Trajectory)",
        meaning: "ทิศทางที่เรื่องนี้กำลังจะมุ่งไป หากยังดำเนินต่อไปตามแนวทางปัจจุบัน",
        meaningEn: "Where momentum is carrying you if current patterns persist",
        x: 0.78,
        y: 0.5,
      },
    ],
  },
  {
    id: "situation-solution",
    nameTh: "ปัญหาและทางออก (ไพ่ 3 ใบ)",
    nameEn: "Challenge & Solution (3 Cards)",
    tagline: "หาทางสว่างและวิธีแก้ปัญหาที่ตรงจุด",
    taglineEn: "Find clarity and actionable resolution to impasse",
    description:
      "เหมาะสำหรับช่วงเวลาที่รู้สึกตัน เจอปัญหาไม่รู้จะแก้ยังไง ไพ่จะชี้ให้เห็นอุปสรรคที่แท้จริงและทางออกที่ดีที่สุด",
    descriptionEn:
      "Ideal for moments of stagnation. Illuminates the true nature of the problem and the best path forward.",
    defaultCategory: "general",
    credits: 1,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. สภาพปัญหาในตอนนี้",
        nameEn: "1. Current Landscape",
        meaning: "สภาพความเป็นจริงของปัญหาในขณะนี้",
        meaningEn: "The objective reality of the situation as it stands",
        x: 0.22,
        y: 0.5,
      },
      {
        index: 1,
        nameTh: "2. อุปสรรคที่ซ่อนอยู่",
        nameEn: "2. The Hidden Obstacle",
        meaning: "สิ่งที่ฉุดรั้งไว้ หรือสิ่งที่ไม่เป็นไปตามแผนการ",
        meaningEn: "The underlying friction, resistance, or subconscious block",
        x: 0.5,
        y: 0.5,
      },
      {
        index: 2,
        nameTh: "3. ทางออกและวิธีแก้ไข",
        nameEn: "3. Actionable Resolution",
        meaning: "แนวทางแก้ไขปัญหาที่เป็นรูปธรรมและดีที่สุดสำหรับผู้ถาม",
        meaningEn: "The most empowering concrete strategy and solution",
        x: 0.78,
        y: 0.5,
      },
    ],
  },
  {
    id: "mind-body-spirit",
    nameTh: "กาย-ใจ-จิตวิญญาณ (ไพ่ 3 ใบ)",
    nameEn: "Mind · Body · Spirit (3 Cards)",
    tagline: "เช็กความเหนื่อยล้า ฟื้นฟูสมดุลความสุข",
    taglineEn: "Check exhaustion, restore holistic harmony",
    description:
      "สำรวจความเหนื่อยล้าทางร่างกาย อารมณ์ที่ค้างคาในใจ และสิ่งที่จิตวิญญาณของคุณต้องการเพื่อกลับมามีความสุขอีกครั้ง",
    descriptionEn:
      "Explore physical vitality, emotional currents, and what your deeper soul seeks to reclaim peace.",
    defaultCategory: "general",
    credits: 1,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. สภาพร่างกายและความเหนื่อยล้า",
        nameEn: "1. Physical Vitality",
        meaning: "สภาพร่างกาย ความเครียดสะสม และการใช้พลังงานในชีวิตประจำวัน",
        meaningEn: "Physical fatigue, accumulated stress, and bodily rhythm",
        x: 0.25,
        y: 0.5,
      },
      {
        index: 1,
        nameTh: "2. สภาพจิตใจและอารมณ์",
        nameEn: "2. Emotional Landscape",
        meaning: "ความรู้สึก อารมณ์ที่ซ่อนอยู่ใต้ใจ และสิ่งที่รบกวนจิตใจ",
        meaningEn: "Subconscious feelings, emotional weight, and heart state",
        x: 0.5,
        y: 0.35,
      },
      {
        index: 2,
        nameTh: "3. สิ่งที่จิตวิญญาณต้องการเยียวยา",
        nameEn: "3. Soul Alignment",
        meaning: "ความต้องการแท้จริงของจิตใจ และวิธีฟื้นฟูพลังให้กลับมาสดใส",
        meaningEn: "What your higher self needs to renew its spark and tranquility",
        x: 0.75,
        y: 0.5,
      },
    ],
  },

  // ==========================================
  // หมวด 2: ความรัก & ความสัมพันธ์ (Love & Heart)
  // ==========================================
  {
    id: "love",
    nameTh: "ดวงความรักสองหัวใจ (ไพ่ 5 ใบ)",
    nameEn: "Two Hearts In-Depth Love Spread (5 Cards)",
    tagline: "ใจเรา ใจเขา และอนาคตความสัมพันธ์",
    taglineEn: "Your heart, their heart, and relationship outlook",
    description:
      "เปิดใจดูความสัมพันธ์แบบรอบด้าน เห็นทั้งความรู้สึกลึกๆ ของคุณ ของเขา สิ่งที่ดึงดูดกัน อุปสรรค และทิศทางว่าจะไปต่ออย่างไร",
    descriptionEn:
      "A comprehensive relationship reading unveiling feelings on both sides, mutual ties, friction, and destiny.",
    defaultCategory: "love",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. ใจของคุณ (ความรู้สึกจริง)",
        nameEn: "1. Your Heart (Authentic Feelings)",
        meaning: "ความรู้สึกและความต้องการที่แท้จริงในใจของผู้ถาม",
        meaningEn: "Your genuine emotions and desires in this connection",
        x: 0.25,
        y: 0.32,
      },
      {
        index: 1,
        nameTh: "2. ใจของเขา (มุมมองที่เขามีต่อคุณ)",
        nameEn: "2. Their Heart (Their Perspective)",
        meaning: "ความรู้สึกและมุมมองของอีกฝ่ายที่มีต่อคุณและความสัมพันธ์นี้",
        meaningEn: "How they perceive you and feel about the connection",
        x: 0.75,
        y: 0.32,
      },
      {
        index: 2,
        nameTh: "3. สิ่งที่เชื่อมใจกันไว้",
        nameEn: "3. Mutual Bond (Connecting Energy)",
        meaning: "พลังงานหรือสายใยที่ยังยึดเหนี่ยวคนสองคนนี้ไว้ด้วยกัน",
        meaningEn: "The core tie and shared frequency holding you together",
        x: 0.5,
        y: 0.55,
      },
      {
        index: 3,
        nameTh: "4. อุปสรรคของสองคน",
        nameEn: "4. Relationship Friction",
        meaning: "ปัญหา สิ่งที่ขัดขวาง หรือความไม่เข้าใจกันระหว่างคนสองคน",
        meaningEn: "Misunderstandings, obstacles, or shadows testing the union",
        x: 0.28,
        y: 0.78,
      },
      {
        index: 4,
        nameTh: "5. ทิศทางความสัมพันธ์ข้างหน้า",
        nameEn: "5. Relationship Trajectory",
        meaning: "แนวโน้มบทสรุปของความสัมพันธ์ และคำแนะนำในการปฏิบัติตัว",
        meaningEn: "The emerging outcome and empowering guidance for your heart",
        x: 0.72,
        y: 0.78,
      },
    ],
  },
  {
    id: "how-they-feel",
    nameTh: "ความในใจของเขา (ไพ่ 4 ใบ)",
    nameEn: "How They Truly Feel (4 Cards)",
    tagline: "ส่องความรู้สึกจริงและสิ่งที่เขาคิดกับเรา",
    taglineEn: "Peek into their true intentions and thoughts toward you",
    description:
      "สำหรับคนที่สงสัยว่าเขาคิดยังไง มีใจไหม สิ่งที่เขาแสดงออกตรงกับใจหรือเปล่า และเขาวางแผนจะทำอะไรต่อไป",
    descriptionEn:
      "For those wondering what they truly think, whether their actions match their feelings, and their next move.",
    defaultCategory: "love",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. ท่าทีที่เขาแสดงออกต่อหน้า",
        nameEn: "1. External Persona",
        meaning: "ภาพลักษณ์และท่าทีภายนอกที่เขาแสดงให้คุณเห็น",
        meaningEn: "The outward attitude and demeanor they project toward you",
        x: 0.5,
        y: 0.25,
      },
      {
        index: 1,
        nameTh: "2. ความรู้สึกลึกๆ ในใจที่ไม่ได้บอก",
        nameEn: "2. Hidden Subconscious Feelings",
        meaning: "ความรู้สึก อารมณ์ และความคิดส่วนลึกที่เขาเก็บไว้คนเดียว",
        meaningEn: "Unspoken emotions and vulnerabilities held privately inside",
        x: 0.25,
        y: 0.55,
      },
      {
        index: 2,
        nameTh: "3. สิ่งที่เขาคาดหวังจากคุณ",
        nameEn: "3. What They Expect From You",
        meaning: "สิ่งที่เขาต้องการหรือคาดหวังในความสัมพันธ์นี้",
        meaningEn: "Their underlying hopes, desires, or expectations in this dynamic",
        x: 0.75,
        y: 0.55,
      },
      {
        index: 3,
        nameTh: "4. สิ่งที่เขาน่าจะทำต่อไป",
        nameEn: "4. Their Next Probable Action",
        meaning: "แนวโน้มการกระทำและก้าวต่อไปของเขาในอนาคตอันใกล้",
        meaningEn: "Their impending moves and energetic momentum toward you",
        x: 0.5,
        y: 0.8,
      },
    ],
  },
  {
    id: "ex-reconciliation",
    nameTh: "แฟนเก่าจะกลับมาไหม (ไพ่ 4 ใบ)",
    nameEn: "Past Love & Reconciliation (4 Cards)",
    tagline: "เช็กโอกาสคืนดี ถ่านไฟเก่า และคำแนะนำ",
    taglineEn: "Examine reconciliation prospects, rekindled flames, and counsel",
    description:
      "สำหรับคนที่ยังคิดถึงคนเก่า อยากรู้ว่าเขายังคิดถึงเราไหม มีโอกาสได้กลับมาคุยหรือคืนดีกันไหม และเราควรมูฟออนหรือรอต่อ",
    descriptionEn:
      "For those reflecting on an ex-partner: explore lingering thoughts, closure, and whether to reconnect or move on.",
    defaultCategory: "love",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. ความรู้สึกที่เขายังมีต่อคุณ",
        nameEn: "1. Lingering Feelings",
        meaning: "ความรู้สึกและความทรงจำที่คนรักเก่ายังคงมีต่อผู้ถาม",
        meaningEn: "Memories and feelings they still hold regarding you",
        x: 0.3,
        y: 0.35,
      },
      {
        index: 1,
        nameTh: "2. สาเหตุที่ทำให้ห่างเหินกัน",
        nameEn: "2. Root of the Estrangement",
        meaning: "ปมปัญหาหรือต้นเหตุที่แท้จริงที่ทำให้ความสัมพันธ์ยุติลง",
        meaningEn: "The fundamental friction or catalyst that caused the distance",
        x: 0.7,
        y: 0.35,
      },
      {
        index: 2,
        nameTh: "3. โอกาสที่จะได้กลับมาคืนดี",
        nameEn: "3. Prospect of Reconciliation",
        meaning: "แนวโน้มและความเป็นไปได้ในการกลับมาคืนดีหรือปรับความเข้าใจ",
        meaningEn: "The probability of reconnecting and finding common ground",
        x: 0.3,
        y: 0.7,
      },
      {
        index: 3,
        nameTh: "4. คำแนะนำว่าควรไปต่อหรือมูฟออน",
        nameEn: "4. Soul Counsel: Wait or Move Forward",
        meaning: "คำแนะนำที่ดีที่สุดสำหรับหัวใจและอนาคตของคุณ",
        meaningEn: "The healthiest choice for your heart's long-term peace and growth",
        x: 0.7,
        y: 0.7,
      },
    ],
  },
  {
    id: "soulmate",
    nameTh: "ตามหาเนื้อคู่แท้ (ไพ่ 5 ใบ)",
    nameEn: "Soulmate & Divine Counterpart (5 Cards)",
    tagline: "ส่องลักษณะเนื้อคู่ จุดที่จะได้พบ และวาสนา",
    taglineEn: "Envision your counterpart's energy, meeting circumstances, and fate",
    description:
      "สำหรับคนโสดหรือคนที่ตามหารักแท้ ดูว่าเนื้อคู่ของคุณนิสัยเป็นอย่างไร จะเจอกันที่ไหน และต้องเตรียมตัวอย่างไร",
    descriptionEn:
      "For singles or seekers desiring true love: reveal traits of your divine counterpart, meeting circumstances, and inner preparation.",
    defaultCategory: "love",
    credits: 3,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. บุคลิกและลักษณะของเนื้อคู่",
        nameEn: "1. Counterpart Essence & Persona",
        meaning: "ลักษณะ นิสัย บุคลิกภาพ และพลังงานของคนที่เป็นคู่แท้ของคุณ",
        meaningEn: "The character, temperament, and vibrational energy of your soulmate",
        x: 0.5,
        y: 0.22,
      },
      {
        index: 1,
        nameTh: "2. สถานที่หรือช่องทางที่จะได้พบกัน",
        nameEn: "2. Meeting Arena & Setting",
        meaning: "บริบท สิ่งแวดล้อม หรือช่วงเวลาที่คุณและเขาจะได้โคจรมาเจอกัน",
        meaningEn: "The environment, timing, or circumstance under which paths will cross",
        x: 0.22,
        y: 0.52,
      },
      {
        index: 2,
        nameTh: "3. บททดสอบเมื่อได้เริ่มคบหา",
        nameEn: "3. Mutual Crucible & Growth",
        meaning: "ความท้าทายหรือสิ่งที่จะต้องปรับตัวร่วมกันเมื่อได้คบหา",
        meaningEn: "The growth edge and shared lessons that will test and refine the bond",
        x: 0.78,
        y: 0.52,
      },
      {
        index: 3,
        nameTh: "4. สิ่งที่คุณควรปรับเพื่อเปิดรับรักดีๆ",
        nameEn: "4. Inner Alignment Needed",
        meaning: "การพัฒนาตนเองและการเปิดใจเพื่อดึงดูดความรักที่ดีเข้ามา",
        meaningEn: "What to cultivate within yourself to become an open vessel for healthy love",
        x: 0.35,
        y: 0.8,
      },
      {
        index: 4,
        nameTh: "5. บทสรุปความรักเมื่อได้ครองคู่",
        nameEn: "5. Fulfillment of Union",
        meaning: "ภาพรวมความสุขและความมั่นคงเมื่อได้สร้างชีวิตคู่ร่วมกัน",
        meaningEn: "The overarching peace and harmony awaiting in true partnership",
        x: 0.65,
        y: 0.8,
      },
    ],
  },

  // ==========================================
  // หมวด 3: การงาน & การเงิน (Career & Wealth)
  // ==========================================
  {
    id: "career",
    nameTh: "ดวงการงาน & ความก้าวหน้า (ไพ่ 5 ใบ)",
    nameEn: "Career Direction & Growth (5 Cards)",
    tagline: "งานที่ทำอยู่จะรุ่งไหม โอกาสและความสำเร็จ",
    taglineEn: "Will your work flourish? Opportunities and career milestones",
    description:
      "วิเคราะห์ทิศทางการทำงาน จุดแข็งที่คุณควรดึงมาใช้ อุปสรรคที่ขัดขวาง โอกาสเติบโตใหม่ๆ และคำแนะนำสู่ความก้าวหน้า",
    descriptionEn:
      "Analyze professional trajectory, distinctive superpowers, hurdles, and auspicious avenues for advancement.",
    defaultCategory: "work",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. สถานการณ์งานปัจจุบัน",
        nameEn: "1. Current Professional Station",
        meaning: "จุดที่ผู้ถามยืนอยู่ในเส้นทางการทำงานขณะนี้",
        meaningEn: "Where you presently stand on your career pathway",
        x: 0.5,
        y: 0.28,
      },
      {
        index: 1,
        nameTh: "2. จุดแข็งที่คุณควรนำมาใช้",
        nameEn: "2. Core Strengths to Unleash",
        meaning: "ความสามารถ ทักษะ หรือข้อได้เปรียบที่ควรดึงมาใช้อย่างเต็มที่",
        meaningEn: "Distinct skills, talents, and superpowers you must leverage",
        x: 0.22,
        y: 0.52,
      },
      {
        index: 2,
        nameTh: "3. สิ่งที่ฉุดรั้งความก้าวหน้า",
        nameEn: "3. Subconscious Resistance",
        meaning: "อุปสรรคภายในหรือภายนอกที่ทำให้งานยังไม่ก้าวหน้าเท่าที่ควร",
        meaningEn: "Internal doubts or external bottlenecks curbing momentum",
        x: 0.78,
        y: 0.52,
      },
      {
        index: 3,
        nameTh: "4. โอกาสดีๆ ที่กำลังจะเข้ามา",
        nameEn: "4. Emerging Windows of Opportunity",
        meaning: "ลู่ทาง โครงการ หรือโอกาสใหม่ๆ ที่กำลังจะเปิดรับคุณ",
        meaningEn: "Incoming projects, alliances, or lucrative opportunities",
        x: 0.35,
        y: 0.78,
      },
      {
        index: 4,
        nameTh: "5. คำแนะนำเพื่อความสำเร็จในงาน",
        nameEn: "5. Strategic Career Blueprint",
        meaning: "ก้าวต่อไปที่เป็นรูปธรรมและส่งผลดีต่อชีวิตการทำงานมากที่สุด",
        meaningEn: "The highest-leverage next step for career fulfillment and triumph",
        x: 0.65,
        y: 0.78,
      },
    ],
  },
  {
    id: "money",
    nameTh: "ดวงการเงินและโชคลาภ (ไพ่ 4 ใบ)",
    nameEn: "Financial Flow & Prosperity (4 Cards)",
    tagline: "เงินไหลไปไหน จะมีโชคไหม ปลดล็อกความมั่งคั่ง",
    taglineEn: "Where does money flow? Prosperity and financial sovereignty",
    description:
      "ตรวจสภาพคล่องทางการเงิน ชี้จุดรั่วไหลที่ทำให้เก็บเงินไม่อยู่ แหล่งรายได้ที่จะงอกเงย และวิธีสร้างความมั่นคงมั่งคั่ง",
    descriptionEn:
      "Inspect cash flow vitality, subconscious spending leaks, burgeoning income sources, and wealth mindset.",
    defaultCategory: "money",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. สภาพคล่องทางการเงินตอนนี้",
        nameEn: "1. Current Financial State",
        meaning: "ภาพรวมสถานการณ์การเงินและพฤติกรรมการใช้เงินในปัจจุบัน",
        meaningEn: "Current liquidity, monetary dynamics, and cash flow reality",
        x: 0.28,
        y: 0.35,
      },
      {
        index: 1,
        nameTh: "2. รูรั่วทางการเงินที่ต้องระวัง",
        nameEn: "2. Unconscious Leakages",
        meaning: "จุดที่เงินไหลออกโดยไม่จำเป็น หรือค่าใช้จ่ายแฝงที่ต้องควบคุม",
        meaningEn: "Unnecessary expenses, habits, or financial drains to seal",
        x: 0.72,
        y: 0.35,
      },
      {
        index: 2,
        nameTh: "3. แหล่งเงินหรือโอกาสสร้างรายได้ใหม่",
        nameEn: "3. Channels of Abundance",
        meaning: "ช่องทางที่เงินจะงอกเงย หรือลู่ทางทำเงินที่ควรต่อยอด",
        meaningEn: "Promising avenues where wealth and resources can multiply",
        x: 0.28,
        y: 0.7,
      },
      {
        index: 3,
        nameTh: "4. วินัยและวิธีสร้างความมั่งคั่ง",
        nameEn: "4. Blueprint for Prosperity",
        meaning: "วิธีบริหารเงินที่จะเปลี่ยนฐานะทางการเงินของคุณให้มั่นคงที่สุด",
        meaningEn: "Disciplined strategy to anchor enduring financial independence",
        x: 0.72,
        y: 0.7,
      },
    ],
  },
  {
    id: "career-switch",
    nameTh: "ย้ายงานหรืออยู่ที่เดิม (ไพ่ 5 ใบ)",
    nameEn: "Career Pivot: Stay or Leap (5 Cards)",
    tagline: "เปรียบเทียบผลลัพธ์ถ้าอยู่ที่เดิม vs ถ้าไปที่ใหม่",
    taglineEn: "Compare staying at your current role vs. leaping to the new",
    description:
      "สำหรับคนที่กำลังลังเลเรื่องย้ายงาน เปรียบเทียบให้เห็นชัดเจนว่าถ้าทนอยู่ที่เดิมจะเป็นอย่างไร ถ้าก้าวไปที่ใหม่จะรุ่งไหม",
    descriptionEn:
      "For those weighing career moves: side-by-side comparison of staying put versus charting new territory.",
    defaultCategory: "work",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. สภาพแวดล้อมที่ทำงานปัจจุบัน",
        nameEn: "1. Current Workplace Reality",
        meaning: "ความรู้สึก บรรยากาศ และสถานการณ์จริงในที่ทำงานเดิม",
        meaningEn: "The environment, energetic toll, and reality of your present role",
        x: 0.5,
        y: 0.22,
      },
      {
        index: 1,
        nameTh: "2. ถ้าเลือกอยู่ที่เดิมต่อไป",
        nameEn: "2. Trajectory if You Remain",
        meaning: "ความก้าวหน้า รายได้ และความรู้สึกหากยังทำงานที่เดิมต่อไป",
        meaningEn: "Long-term outlook, earnings, and emotional state if you stay",
        x: 0.24,
        y: 0.52,
      },
      {
        index: 2,
        nameTh: "3. ถ้าตัดสินใจย้ายไปที่ใหม่",
        nameEn: "3. Trajectory if You Pivot",
        meaning: "โอกาส ความท้าทาย ผลตอบแทน และบรรยากาศในที่ทำงานใหม่",
        meaningEn: "Opportunities, challenges, compensation, and vibe in the new horizon",
        x: 0.76,
        y: 0.52,
      },
      {
        index: 3,
        nameTh: "4. ปัจจัยซ่อนเร้นที่ต้องระวัง",
        nameEn: "4. Overlooked Variables",
        meaning: "สิ่งที่คุณอาจมองข้าม หรือสิ่งที่ควรเตรียมตัวให้พร้อมก่อนย้าย",
        meaningEn: "Hidden blind spots, trade-offs, or prerequisites before leaping",
        x: 0.5,
        y: 0.55,
      },
      {
        index: 4,
        nameTh: "5. ทางเลือกที่ดีและปลอดภัยที่สุด",
        nameEn: "5. The Sovereign Choice",
        meaning: "บทสรุปและคำแนะนำว่าทางไหนจะส่งผลดีต่อชีวิตและอนาคตมากกว่า",
        meaningEn: "The most aligned, safe, and rewarding decision for your future",
        x: 0.5,
        y: 0.83,
      },
    ],
  },
  {
    id: "decision",
    nameTh: "ทางแยกสองทาง: เลือก A หรือ B (ไพ่ 5 ใบ)",
    nameEn: "The Crossroads: Path A vs. Path B (5 Cards)",
    tagline: "เมื่อต้องเลือกสองตัวเลือก ทางไหนจะพาไปสู่สิ่งที่ดีกว่า",
    taglineEn: "Facing two divergent choices? Discern which leads higher",
    description:
      "เหมาะสำหรับการตัดสินใจเรื่องสำคัญในชีวิต เปรียบเทียบผลลัพธ์ของทางเลือกที่ 1 กับทางเลือกที่ 2 พร้อมเปิดเผยปัจจัยที่คุณอาจมองข้าม",
    descriptionEn:
      "Weighing major life decisions: maps consequences of Path A versus Path B with hidden factors unveiled.",
    defaultCategory: "general",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. จุดที่คุณยืนอยู่และแก่นของเรื่อง",
        nameEn: "1. The Nexus & Core Dilemma",
        meaning: "แก่นแท้ของสถานการณ์ที่ทำให้คุณต้องตัดสินใจในครั้งนี้",
        meaningEn: "The core essence of the situation requiring this critical choice",
        x: 0.5,
        y: 0.22,
      },
      {
        index: 1,
        nameTh: "2. ผลลัพธ์หากเลือกทางเลือกที่ 1",
        nameEn: "2. Manifestation of Path A",
        meaning: "สิ่งที่จะเกิดขึ้นและผลกระทบหากคุณเลือกตัวเลือกแรก",
        meaningEn: "The unfolding trajectory and consequences of selecting Choice A",
        x: 0.24,
        y: 0.52,
      },
      {
        index: 2,
        nameTh: "3. ผลลัพธ์หากเลือกทางเลือกที่ 2",
        nameEn: "3. Manifestation of Path B",
        meaning: "สิ่งที่จะเกิดขึ้นและผลกระทบหากคุณเลือกตัวเลือกที่สอง",
        meaningEn: "The unfolding trajectory and consequences of selecting Choice B",
        x: 0.76,
        y: 0.52,
      },
      {
        index: 3,
        nameTh: "4. สิ่งที่มองไม่เห็น (ปัจจัยลับ)",
        nameEn: "4. The Veiled Variable",
        meaning: "ปัจจัยซ่อนเร้นหรือผลกระทบระยะยาวที่ผู้ถามอาจยังไม่ได้นึกถึง",
        meaningEn: "Underlying ripple effects or long-term considerations yet unseen",
        x: 0.5,
        y: 0.55,
      },
      {
        index: 4,
        nameTh: "5. คำแนะนำสรุปจากแม่หมอ",
        nameEn: "5. Oracle Synthesis",
        meaning: "มุมมองและคำแนะนำสุดท้ายที่จะช่วยให้คุณตัดสินใจได้อย่างสบายใจที่สุด",
        meaningEn: "Holistic perspective to help you decide with serenity and clarity",
        x: 0.5,
        y: 0.83,
      },
    ],
  },
  {
    id: "inner-potential",
    nameTh: "ปลดล็อกพลังในตัวคุณ (ไพ่ 4 ใบ)",
    nameEn: "Unlocking Inner Potential (4 Cards)",
    tagline: "ค้นพบพรสวรรค์ที่ซ่อนอยู่และวิธีก้าวกระโดด",
    taglineEn: "Discover dormant gifts and ignite your quantum breakthrough",
    description:
      "สำรวจตัวตน ค้นหาจุดแข็งพิเศษที่คุณอาจไม่เคยรู้มาก่อน ทลายความกลัวในใจ และค้นพบกุญแจที่จะทำให้ชีวิตคุณก้าวกระโดด",
    descriptionEn:
      "Deep self-inquiry: uncover dormant superpowers, dismantle self-limiting beliefs, and accelerate personal mastery.",
    defaultCategory: "work",
    credits: 2,
    guestAllowed: false,
    positions: [
      {
        index: 0,
        nameTh: "1. ตัวตนและพลังงานของคุณตอนนี้",
        nameEn: "1. Present Vibrational State",
        meaning: "ศักยภาพและพลังงานที่คุณกำลังใช้อยู่ในชีวิตปัจจุบัน",
        meaningEn: "Your current self-expression and utilized energy",
        x: 0.5,
        y: 0.25,
      },
      {
        index: 1,
        nameTh: "2. พรสวรรค์หรือความสามารถที่ซ่อนอยู่",
        nameEn: "2. Dormant Gifts & Superpowers",
        meaning: "ของขวัญ ทักษะพิเศษ หรือจุดเด่นที่คุณยังไม่ได้นำมาใช้อย่างเต็มที่",
        meaningEn: "Untapped natural talents and abilities awaiting conscious activation",
        x: 0.25,
        y: 0.55,
      },
      {
        index: 2,
        nameTh: "3. ความกลัวหรือสิ่งที่ฉุดรั้งคุณไว้",
        nameEn: "3. Subconscious Resistance",
        meaning: "ความเชื่อที่จำกัดตัวเอง ความกังวล หรืออุปสรรคทางความคิด",
        meaningEn: "Limiting fears, conditioning, or doubts stalling your ascent",
        x: 0.75,
        y: 0.55,
      },
      {
        index: 3,
        nameTh: "4. กุญแจสำคัญที่จะพาคุณก้าวกระโดด",
        nameEn: "4. The Breakthrough Catalyst",
        meaning: "การกระทำและวิธีคิดที่จะปลดล็อกศักยภาพสูงสุดในตัวคุณ",
        meaningEn: "The mindset and action that unlocks your highest potential",
        x: 0.5,
        y: 0.8,
      },
    ],
  },

  // ==========================================
  // หมวด 4: ผังใหญ่เจาะลึก & ไทม์ไลน์ (Master & Deep Insights)
  // ==========================================
  {
    id: "weekly",
    nameTh: "ดวงรายสัปดาห์ 7 วัน (ไพ่ 7 ใบ)",
    nameEn: "7-Day Weekly Forecast (7 Cards)",
    tagline: "ส่องพลังงานจันทร์ถึงอาทิตย์ วางแผนล่วงหน้า",
    taglineEn: "Map energetic tides Monday through Sunday to plan proactively",
    description:
      "เปิดไพ่ 7 ใบเรียงตามวันจันทร์ถึงอาทิตย์ ดูว่าวันไหนจะเฮง วันไหนต้องระวัง ช่วยให้คุณรับมือกับทุกสถานการณ์ได้อย่างมั่นใจตลอดสัปดาห์",
    descriptionEn:
      "A 7-card chronological spread charting energetic ebbs and peaks for each day of the upcoming week.",
    defaultCategory: "general",
    credits: 3,
    guestAllowed: false,
    positions: [
      { index: 0, nameTh: "วันจันทร์", nameEn: "Monday", meaning: "พลังงานและการเริ่มต้นในวันจันทร์", meaningEn: "Opening momentum and intentions for Monday", x: 0.15, y: 0.35 },
      { index: 1, nameTh: "วันอังคาร", nameEn: "Tuesday", meaning: "ความกระตือรือร้น การลงมือทำ และงานในวันอังคาร", meaningEn: "Drive, productivity, and execution for Tuesday", x: 0.38, y: 0.35 },
      { index: 2, nameTh: "วันพุธ", nameEn: "Wednesday", meaning: "การสื่อสาร การเจรจา และผู้คนในวันพุธ", meaningEn: "Communication, negotiations, and social ties on Wednesday", x: 0.62, y: 0.35 },
      { index: 3, nameTh: "วันพฤหัสบดี", nameEn: "Thursday", meaning: "การตัดสินใจ ความรู้ และความก้าวหน้าในวันพฤหัสบดี", meaningEn: "Wisdom, expansion, and strategic progress on Thursday", x: 0.85, y: 0.35 },
      { index: 4, nameTh: "วันศุกร์", nameEn: "Friday", meaning: "ความสัมพันธ์ การเงิน และความสุขในวันศุกร์", meaningEn: "Relationships, harmony, and celebration on Friday", x: 0.26, y: 0.7 },
      { index: 5, nameTh: "วันเสาร์", nameEn: "Saturday", meaning: "การพักผ่อน การสะสางเรื่องคั่งค้างในวันเสาร์", meaningEn: "Restoration, reflection, and clearing loose ends on Saturday", x: 0.5, y: 0.7 },
      { index: 6, nameTh: "วันอาทิตย์", nameEn: "Sunday", meaning: "การเติมเต็มพลังใจและการเตรียมพร้อมสำหรับสัปดาห์ถัดไป", meaningEn: "Spiritual replenishment and alignment for the week ahead", x: 0.74, y: 0.7 },
    ],
  },
  {
    id: "monthly",
    nameTh: "ดวงรายเดือน 4 สัปดาห์ (ไพ่ 4 ใบ)",
    nameEn: "4-Week Monthly Forecast (4 Cards)",
    tagline: "มองเห็นภาพรวมตลอดทั้งเดือน วางแผนล่วงหน้า",
    taglineEn: "Gain full-month perspective to master life's pacing",
    description:
      "ดูจังหวะชีวิตตลอด 4 สัปดาห์ในรอบเดือน ช่วยให้คุณรู้ล่วงหน้าว่าช่วงไหนเหมาะแก่การลุย ช่วงไหนควรเก็บตัว และจะปิดท้ายเดือนอย่างไร",
    descriptionEn:
      "Navigate the four weeks of your month to know when to sprint, when to conserve energy, and how to conclude.",
    defaultCategory: "general",
    credits: 2,
    guestAllowed: false,
    positions: [
      { index: 0, nameTh: "สัปดาห์ที่ 1 (ช่วงต้นเดือน)", nameEn: "Week 1 (Opening Currents)", meaning: "พลังงานเริ่มต้นและเป้าหมายหลักในสัปดาห์แรกของเดือน", meaningEn: "Foundational intentions and emerging energy in week one", x: 0.2, y: 0.5 },
      { index: 1, nameTh: "สัปดาห์ที่ 2 (ช่วงลุยงาน)", nameEn: "Week 2 (Active Momentum)", meaning: "ความคืบหน้า การปรับตัว และการจัดการกับเรื่องราวต่างๆ", meaningEn: "Progress, adaptation, and sustained effort in week two", x: 0.4, y: 0.5 },
      { index: 2, nameTh: "สัปดาห์ที่ 3 (จุดพีคและบททดสอบ)", nameEn: "Week 3 (Pivotal Peak & Test)", meaning: "จุดพีคสำคัญ โอกาส หรือบททดสอบที่ต้องตั้งรับ", meaningEn: "Key turning points, breakthroughs, or tests in week three", x: 0.6, y: 0.5 },
      { index: 3, nameTh: "สัปดาห์ที่ 4 (บทสรุปสิ้นเดือน)", nameEn: "Week 4 (Culmination & Harvest)", meaning: "ผลลัพธ์ การเก็บเกี่ยวผลประโยชน์ และบทสรุปปิดท้ายเดือน", meaningEn: "Harvest, integration, and concluding outcomes for the month", x: 0.8, y: 0.5 },
    ],
  },
  {
    id: "chakra",
    nameTh: "สแกนสมดุล 7 จักระ (ไพ่ 7 ใบ)",
    nameEn: "7 Chakras Energy Alignment (7 Cards)",
    tagline: "ตรวจเช็กจุดอุดตัน ฟื้นฟูพลังงานทั้ง 7 จุด",
    taglineEn: "Diagnose energetic blockages and realign your 7 energy centers",
    description:
      "สแกนพลังงาน 7 จุดสำคัญของร่างกาย ตั้งแต่ความมั่นคง ความคิดสร้างสรรค์ ความมั่นใจ ความรัก การสื่อสาร สัญชาตญาณ ไปจนถึงจิตวิญญาณ",
    descriptionEn:
      "A vibrational scan of your 7 primary energy centers: root security, sacral creativity, solar plexus power, heart love, throat truth, third eye intuition, and crown unity.",
    defaultCategory: "general",
    credits: 3,
    guestAllowed: false,
    positions: [
      { index: 0, nameTh: "1. ฐานราก (ความมั่นคง ปลอดภัย)", nameEn: "1. Root Chakra (Muladhara - Grounding & Safety)", meaning: "ความมั่นคงในชีวิต สุขภาพร่างกาย และความรู้สึกปลอดภัย", meaningEn: "Survival foundation, physical vitality, and feeling secure in the world", x: 0.5, y: 0.88 },
      { index: 1, nameTh: "2. ความคิดสร้างสรรค์ (อารมณ์ ความสุข)", nameEn: "2. Sacral Chakra (Svadhisthana - Emotion & Passion)", meaning: "ความคิดสร้างสรรค์ ความสุข และอารมณ์ความรู้สึก", meaningEn: "Emotional fluidity, creativity, intimacy, and sensuality", x: 0.5, y: 0.76 },
      { index: 2, nameTh: "3. พลังขับเคลื่อน (ความมั่นใจ อำนาจ)", nameEn: "3. Solar Plexus Chakra (Manipura - Willpower & Courage)", meaning: "ความมั่นใจในตนเอง อำนาจการตัดสินใจ และพลังในการลงมือทำ", meaningEn: "Personal power, self-esteem, autonomy, and execution", x: 0.5, y: 0.63 },
      { index: 3, nameTh: "4. หัวใจ (ความรัก เมตตา การเปิดใจ)", nameEn: "4. Heart Chakra (Anahata - Love & Compassion)", meaning: "ความรัก ความเมตตา ความสัมพันธ์ และการยอมรับตนเอง", meaningEn: "Unconditional love, forgiveness, empathy, and emotional healing", x: 0.5, y: 0.5 },
      { index: 4, nameTh: "5. การสื่อสาร (ความจริงใจ การพูด)", nameEn: "5. Throat Chakra (Vishuddha - Expression & Truth)", meaning: "การสื่อสาร การแสดงออกทางคำพูด และความจริงใจ", meaningEn: "Authentic communication, speaking your truth, and creative expression", x: 0.5, y: 0.37 },
      { index: 5, nameTh: "6. สัญชาตญาณ (ปัญญาญาณ วิสัยทัศน์)", nameEn: "6. Third Eye Chakra (Ajna - Intuition & Insight)", meaning: "สัญชาตญาณ ความคิดเฉียบแหลม และวิสัยทัศน์ข้างหน้า", meaningEn: "Inner vision, discernment, spiritual insight, and deep knowing", x: 0.5, y: 0.24 },
      { index: 6, nameTh: "7. จิตวิญญาณ (ความสงบสุขสูงสุด)", nameEn: "7. Crown Chakra (Sahasrara - Spiritual Connection)", meaning: "จิตวิญญาณ ความสงบสุขในใจ และการเชื่อมโยงกับสิ่งดีงาม", meaningEn: "Cosmic consciousness, transcendence, and divine alignment", x: 0.5, y: 0.12 },
    ],
  },
  {
    id: "celtic-cross",
    nameTh: "ส่องชะตาเจาะลึก 10 มิติ (เซลติกครอส)",
    nameEn: "The Celtic Cross: 10 Dimensions of Destiny (10 Cards)",
    tagline: "ผัง 10 ใบในตำนาน อ่านละเอียดและแม่นยำที่สุด",
    taglineEn: "The legendary 10-card master spread for utmost depth and precision",
    description:
      "ผังพยากรณ์ที่ละเอียดและทรงพลังที่สุด ส่องลึกถึงแก่นของปัญหา อดีตที่ผ่านมา อนาคตอันใกล้ ตัวตนของคุณ คนรอบข้าง ความหวัง ความกลัว และบทสรุปปลายทาง",
    descriptionEn:
      "The gold-standard ancient tarot spread revealing the heart of the matter, cross-currents, past roots, aspirations, near future, self-perception, environment, hopes/fears, and ultimate culmination.",
    defaultCategory: "general",
    credits: 5,
    guestAllowed: false,
    positions: [
      { index: 0, nameTh: "1. แก่นของเรื่อง (หัวใจของสถานการณ์)", nameEn: "1. The Heart of the Matter", meaning: "หัวใจสำคัญของเรื่องราวที่ผู้ถามกำลังเผชิญอยู่ในปัจจุบัน", meaningEn: "The essential core and primary energy of the situation you face", x: 0.32, y: 0.45 },
      { index: 1, nameTh: "2. สิ่งที่ขวางอยู่ (อุปสรรคตรงหน้า)", nameEn: "2. The Crossing Cross-Current", meaning: "อุปสรรค ความท้าทาย หรือแรงต้านที่พาดผ่านเรื่องนี้อยู่", meaningEn: "The immediate obstacle, friction, or catalyst crossing your path", x: 0.32, y: 0.45, rotate: 90 },
      { index: 2, nameTh: "3. ปมลึกในใจ (สาเหตุที่ซ่อนอยู่)", nameEn: "3. The Subconscious Root", meaning: "สาเหตุที่อยู่ใต้จิตสำนึก หรือต้นตอที่แท้จริงของเรื่องราว", meaningEn: "Underlying psychological drivers or subconscious origins", x: 0.32, y: 0.72 },
      { index: 3, nameTh: "4. อดีตที่เพิ่งผ่าน (สิ่งที่ส่งผลถึงตอนนี้)", nameEn: "4. The Passing Past", meaning: "เรื่องราวที่เพิ่งเกิดขึ้นและยังส่งแรงกระทบมาถึงปัจจุบัน", meaningEn: "Recent events that are receding but whose echoes still ripple", x: 0.14, y: 0.45 },
      { index: 4, nameTh: "5. สิ่งที่หวังไว้ (เป้าหมายในใจ)", nameEn: "5. Crown & Conscious Aspirations", meaning: "เป้าหมาย ความหวัง หรือสิ่งที่ผู้ถามคิดถึงและปรารถนามากที่สุด", meaningEn: "Conscious goals, highest aspirations, or ideal outcomes held in mind", x: 0.32, y: 0.18 },
      { index: 5, nameTh: "6. อนาคตอันใกล้ (สิ่งที่จะเกิดขึ้นเร็วๆ นี้)", nameEn: "6. Near Future Horizons", meaning: "เรื่องราวหรือเหตุการณ์ที่กำลังจะเข้ามาในระยะเวลาอันสั้น", meaningEn: "Immediate manifestations and events emerging in the near term", x: 0.5, y: 0.45 },
      { index: 6, nameTh: "7. ตัวคุณเอง (ท่าทีและพลังงานของคุณ)", nameEn: "7. The Self & Inner Stance", meaning: "ท่าที สภาพจิตใจ และพลังงานที่ผู้ถามกำลังใช้อยู่กับเรื่องนี้", meaningEn: "Your attitude, self-perception, and emotional stance within this dynamic", x: 0.72, y: 0.8 },
      { index: 7, nameTh: "8. คนรอบข้างและสภาพแวดล้อม", nameEn: "8. External Environment & Allies", meaning: "อิทธิพลจากบุคคลรอบตัว มุมมองของผู้อื่น และสิ่งแวดล้อม", meaningEn: "Influence of other people, collective atmosphere, and surrounding energies", x: 0.72, y: 0.6 },
      { index: 8, nameTh: "9. ความหวังและความกังวลลึกๆ", nameEn: "9. Hopes & Shadow Fears", meaning: "สิ่งที่ผู้ถามทั้งคาดหวังอยากให้เกิด และความกังวลลึกๆ ในใจ", meaningEn: "Deepest yearning intertwined with subconscious anxieties", x: 0.72, y: 0.4 },
      { index: 9, nameTh: "10. ผลลัพธ์สุดท้าย (บทสรุปปลายทาง)", nameEn: "10. Ultimate Culmination", meaning: "บทสรุปและปลายทางของเรื่องนี้ หากทุกอย่างยังดำเนินต่อไป", meaningEn: "The synthesized resolution and final outcome if trajectory continues", x: 0.72, y: 0.2 },
    ],
  },
  {
    id: "year-ahead",
    nameTh: "ดวงรายปี 12 เดือน (ไพ่ 12 ใบ)",
    nameEn: "Year Ahead: 12 Astrological Houses (12 Cards)",
    tagline: "ส่องจังหวะชีวิต 12 เดือนตลอดปีข้างหน้า",
    taglineEn: "A 12-month panoramic map of your upcoming year",
    description:
      "เปิดไพ่ 12 ใบเรียงตาม 12 เดือน ให้คุณเห็นภาพรวมของความรัก การงาน การเงิน และสุขภาพตลอดทั้งปี เพื่อวางแผนชีวิตได้อย่างราบรื่นและเฮงที่สุด",
    descriptionEn:
      "12 cards mapping the unfolding rhythm of each month or astrological house, offering strategic foresight for love, career, and spiritual evolution.",
    defaultCategory: "general",
    credits: 8,
    guestAllowed: false,
    positions: Array.from({ length: 12 }, (_, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return {
        index: i,
        nameTh: `เดือนที่ ${i + 1}`,
        nameEn: `Month ${i + 1}`,
        meaning: `พลังงานหลักและสิ่งที่ควรใส่ใจในเดือนที่ ${i + 1} นับจากวันที่เปิดไพ่`,
        meaningEn: `Primary energetic focus and wisdom for month ${i + 1} following your reading`,
        x: 0.5 + Math.cos(angle) * 0.34,
        y: 0.5 + Math.sin(angle) * 0.38,
      };
    }),
  },
];

export const SPREAD_BY_ID = new Map(SPREADS.map((s) => [s.id, s]));

export function getSpread(id: string): Spread | undefined {
  return SPREAD_BY_ID.get(id);
}

export function getSpreadName(spread: Spread, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (spread.nameEn || spread.nameTh) : spread.nameTh;
}

export function getSpreadTagline(spread: Spread, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (spread.taglineEn || spread.tagline) : spread.tagline;
}

export function getSpreadDescription(spread: Spread, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (spread.descriptionEn || spread.description) : spread.description;
}

export function getPositionName(pos: SpreadPosition, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (pos.nameEn || pos.nameTh) : pos.nameTh;
}

export function getPositionMeaning(pos: SpreadPosition, isEnglishOrLocale: boolean | string): string {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? (pos.meaningEn || pos.meaning) : pos.meaning;
}
