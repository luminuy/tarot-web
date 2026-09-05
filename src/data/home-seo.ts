/**
 * src/data/home-seo.ts
 * ฐานข้อมูลคำถามที่พบบ่อย (FAQ), ขั้นตอนการดูดวง (HowTo), และตัวสร้าง Schema.org JSON-LD
 * สำหรับหน้าแรกของ SeerTarot (seertarot.net)
 */

import { SITE_ORIGIN } from "@/lib/config/site";

export interface HomeFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface HomeHowToStep {
  name: string;
  text: string;
  url: string;
  image: string;
}

export const HOME_FAQS: HomeFaqItem[] = [
  {
    id: "faq-free-reading",
    question: "ดูดวงไพ่ทาโรต์ออนไลน์ที่ SeerTarot มีค่าใช้จ่ายหรือไม่?",
    answer:
      "คุณสามารถดูดวงไพ่ทาโรต์ออนไลน์ได้ฟรี โดยมีโควตาเปิดไพ่ประจำวันให้ทุกคนได้ใช้งานโดยไม่มีค่าใช้จ่าย และหากต้องการเปิดผังพยากรณ์ขนาดใหญ่พิเศษหรือปรึกษาเจาะลึกเพิ่มเติม สามารถเลือกปลดล็อกโควตาหรือสมัครสมาชิกตามความต้องการได้",
  },
  {
    id: "faq-accuracy",
    question: "การเปิดไพ่ทาโรต์บนระบบออนไลน์ มีความแม่นยำเทียบเท่ากับการไปพบหมอดูจริงหรือไม่?",
    answer:
      "ความแม่นยำของไพ่ทาโรต์ขึ้นอยู่กับสมาธิ ความตั้งใจ และเจตจำนงของผู้ถามในขณะเปิดไพ่ ระบบ SeerTarot ออกแบบให้คุณเป็นผู้สับไพ่และเลือกจับไพ่ 78 ใบด้วยมือของคุณเองจริงๆ ไม่ใช่การสุ่มอัตโนมัติจากคอมพิวเตอร์ จากนั้นแม่หมอ AI ซึ่งได้รับการเทรนด้วยคัมภีร์สัญลักษณ์วิทยา 1909 Rider-Waite ดั้งเดิมและจิตวิทยาเชิงลึกจะทำหน้าที่แปลความหมายและสะท้อนสภาวะจิตใจให้อย่างแม่นยำตรงไปตรงมา",
  },
  {
    id: "faq-provably-fair",
    question: "ระบบสับไพ่ Provably Fair คืออะไร และการันตีความโปร่งใสอย่างไร?",
    answer:
      "Provably Fair คือเทคโนโลยีการเข้ารหัสทางคณิตศาสตร์ด้วย SHA-256 แบบเดียวกับที่ใช้ในระบบความปลอดภัยระดับสากล ระบบจะเข้ารหัสลำดับของสำรับไพ่ล่วงหน้าก่อนที่คุณจะเริ่มจับไพ่ (Commitment) และส่งหลักฐานกุญแจให้คุณตรวจสอบได้หลังเปิดไพ่เสร็จ (Reveal) เพื่อการันตี 100% ว่าไม่มีการล็อกผล ไม่มีการเปลี่ยนไพ่ลับหลัง และทุกใบมาจากความสุ่มที่บริสุทธิ์",
  },
  {
    id: "faq-frequency",
    question: "ควรเปิดไพ่ทาโรต์บ่อยแค่ไหน และมีข้อควรระวังอย่างไรบ้าง?",
    answer:
      "สำหรับเรื่องทั่วไป แนะนำให้เปิดไพ่วันละ 1 ครั้ง หรือเปิดเมื่อมีเรื่องสำคัญที่ต้องตัดสินใจ หลีกเลี่ยงการเปิดไพ่ซ้ำๆ ในคำถามเดิมภายในวันเดียวกัน เพราะจะทำให้จิตใจสับสนและสูญเสียสมาธิ และที่สำคัญที่สุดคือ ไพ่ทาโรต์เป็นเพียงเข็มทิศสะท้อนทางเลือก การตัดสินใจและการลงมือทำยังคงเป็นพลังอำนาจของคุณเองเสมอ",
  },
  {
    id: "faq-rws-1909",
    question: "ไพ่ทาโรต์ชุด 1909 Rider-Waite-Smith แตกต่างจากไพ่สำรับอื่นอย่างไร?",
    answer:
      "สำรับ 1909 Rider-Waite-Smith (วาดโดย Pamela Colman Smith ภายใต้การดูแลของ Arthur Edward Waite) เป็นสำรับคลาสสิกมาตรฐานสากลที่เป็นต้นแบบของไพ่ทาโรต์ทั่วโลก จุดเด่นคือไพ่ทุกใบทั้งชุดใหญ่ (Major Arcana 22 ใบ) และชุดย่อย (Minor Arcana 56 ใบ) ล้วนมีภาพวาดที่มีชีวิตและเต็มไปด้วยสัญลักษณ์ลี้ลับ เช่น ทิศทางสายตา ท่าทาง ภูมิทัศน์ และสีสัน ทำให้สามารถสื่อสารกับจิตใต้สำนึกได้อย่างลึกซึ้ง",
  },
  {
    id: "faq-good-questions",
    question: "คำถามแบบใดที่เหมาะสำหรับการถามไพ่ทาโรต์มากที่สุด?",
    answer:
      "คำถามปลายเปิดที่เน้นความเข้าใจและการพัฒนา เช่น 'แนวโน้มของสถานการณ์นี้คืออะไร?', 'ฉันควรปรับตัวอย่างไรเพื่อแก้ไขปัญหานี้?', หรือ 'อะไรคือสิ่งที่ฉันกำลังมองข้ามในความสัมพันธ์?' จะให้คำตอบที่ทรงคุณค่าและมีประโยชน์ต่อการใช้ชีวิตมากกว่าคำถามที่คาดหวังเพียงคำตอบว่า ใช่ หรือ ไม่",
  },
];

export const HOME_FAQS_EN: HomeFaqItem[] = [
  {
    id: "faq-free-reading",
    question: "Is online tarot divination on SeerTarot free of charge?",
    answer:
      "Yes, you can consult the tarot for free. We provide daily card reading allocations for everyone at no cost. For expansive grand spreads or in-depth counseling sessions, quota unlocks and premium options are available according to your needs.",
  },
  {
    id: "faq-accuracy",
    question: "Is an online tarot reading as accurate as visiting an in-person reader?",
    answer:
      "Tarot accuracy hinges upon the querent's mindfulness, intentionality, and focus. SeerTarot is engineered so that you physically shuffle and draw from all 78 cards with your own touch—never through arbitrary computer automation. Our AI oracles, trained in 1909 Rider-Waite symbolism and depth psychology, translate and mirror your psychological state with unfiltered resonance.",
  },
  {
    id: "faq-provably-fair",
    question: "What is Provably Fair shuffling, and how does it guarantee transparency?",
    answer:
      "Provably Fair is a cryptographic verification system using SHA-256, identical to protocols used in high-security environments. The deck sequence is hashed and sealed before you pick your cards (Commitment), and the cryptographic key is revealed afterward (Reveal) so you can independently verify that the deck was never manipulated.",
  },
  {
    id: "faq-frequency",
    question: "How often should I consult the tarot, and what guidelines should I follow?",
    answer:
      "For general guidance, once daily or whenever facing a significant crossroads is ideal. Avoid repeatedly asking the identical question in a single day, as anxiety disrupts clarity. Most importantly, tarot serves as an intuitive compass; ultimate choice and sovereign agency always remain entirely in your hands.",
  },
  {
    id: "faq-rws-1909",
    question: "How does the 1909 Rider-Waite-Smith deck differ from other tarot decks?",
    answer:
      "Created by Pamela Colman Smith under the direction of Arthur Edward Waite, the 1909 deck established the worldwide gold standard. It was the first deck where every single card—both 22 Major Arcana and 56 Minor Arcana—features rich narrative scenes with posture, eye direction, landscape, and color symbolism that speak directly to the subconscious.",
  },
  {
    id: "faq-good-questions",
    question: "What types of questions work best for tarot consultations?",
    answer:
      "Open-ended questions focused on growth and situational dynamics—such as 'What energies are currently at play in this situation?', 'How can I navigate this challenge constructively?', or 'What blind spot am I overlooking in this relationship?'—yield far deeper, more transformative guidance than simple yes-or-no queries.",
  },
];

export function getHomeFaqs(isEnglishOrLocale?: boolean | string): HomeFaqItem[] {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? HOME_FAQS_EN : HOME_FAQS;
}

export const HOME_HOW_TO_STEPS: HomeHowToStep[] = [
  {
    name: "1. เลือกผังการเปิดไพ่",
    text: "เลือกรูปแบบการวางไพ่ที่ตรงกับเรื่องที่ต้องการถาม เช่น ผัง 1 ใบสำหรับดวงประจำวัน, ผัง 3 ใบสำหรับอดีต-ปัจจุบัน-อนาคต, หรือผังเซลติกครอส 10 ใบสำหรับส่องชะตาชีวิตเจาะลึก",
    url: `${SITE_ORIGIN}/#spread-select`,
    image: `${SITE_ORIGIN}/cards/major-01.jpg`,
  },
  {
    name: "2. สงบจิตใจและตั้งเจตจำนง",
    text: "สูดลมหายใจลึกๆ พิมพ์ชื่อ คำถาม และบริบทสั้นๆ พร้อมเลือกแม่หมอ AI ที่มีแนวทางการให้คำปรึกษาตรงกับใจคุณ",
    url: `${SITE_ORIGIN}/#intention-select`,
    image: `${SITE_ORIGIN}/cards/major-02.jpg`,
  },
  {
    name: "3. สับไพ่ด้วยตนเอง",
    text: "กดปุ่มสับไพ่ด้วยมือคุณเอง ระบบจะใช้ Web Crypto API และ Provably Fair SHA-256 ในการเรียงสลับไพ่ 78 ใบอย่างโปร่งใส",
    url: `${SITE_ORIGIN}/#shuffle`,
    image: `${SITE_ORIGIN}/cards/major-10.jpg`,
  },
  {
    name: "4. สัมผัสและเลือกหยิบไพ่",
    text: "แผ่สำรับไพ่ 78 ใบ แล้วใช้มือของคุณแตะเลือกไพ่ทีละใบตามจำนวนที่ผังกำหนดด้วยความตั้งใจ",
    url: `${SITE_ORIGIN}/#pick-cards`,
    image: `${SITE_ORIGIN}/cards/major-17.jpg`,
  },
  {
    name: "5. รับคำพยากรณ์และสนทนาต่อเนื่อง",
    text: "แตะพลิกหน้าไพ่ 1909 Rider-Waite ด้วยตนเอง อ่านคำพยากรณ์ที่สตรีมสด และสามารถพิมพ์แชทถามตอบเจาะลึกกับแม่หมอ AI ได้ทันที",
    url: `${SITE_ORIGIN}/#reading`,
    image: `${SITE_ORIGIN}/cards/major-19.jpg`,
  },
];

export const HOME_HOW_TO_STEPS_EN: HomeHowToStep[] = [
  {
    name: "1. Choose Your Spread",
    text: "Select an archetypal layout tailored to your inquiry, from a 1-card daily compass and 3-card temporal spread to the 10-card Celtic Cross.",
    url: `${SITE_ORIGIN}/#spread-select`,
    image: `${SITE_ORIGIN}/cards/major-01.jpg`,
  },
  {
    name: "2. Set Your Intention & Focus",
    text: "Take a deep breath, formulate your inquiry sincerely, and choose the AI oracle archetype whose tone and lineage best serve you.",
    url: `${SITE_ORIGIN}/#intention-select`,
    image: `${SITE_ORIGIN}/cards/major-02.jpg`,
  },
  {
    name: "3. Shuffle with Your Own Touch",
    text: "Shuffle the complete 78-card deck via Web Crypto API with Provably Fair SHA-256 cryptographic randomness.",
    url: `${SITE_ORIGIN}/#shuffle`,
    image: `${SITE_ORIGIN}/cards/major-10.jpg`,
  },
  {
    name: "4. Select and Draw Cards",
    text: "The deck fans out across an illuminated altar. Use your fingertips to deliberately select each card, infusing your energy into the draw.",
    url: `${SITE_ORIGIN}/#pick-cards`,
    image: `${SITE_ORIGIN}/cards/major-17.jpg`,
  },
  {
    name: "5. Receive Wisdom & Converse",
    text: "Turn over authentic 1909 Rider-Waite cards, listen to streaming interpretations, and converse in depth with your AI oracle.",
    url: `${SITE_ORIGIN}/#reading`,
    image: `${SITE_ORIGIN}/cards/major-19.jpg`,
  },
];

export function getHomeHowToSteps(isEnglishOrLocale?: boolean | string): HomeHowToStep[] {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  return isEn ? HOME_HOW_TO_STEPS_EN : HOME_HOW_TO_STEPS;
}

export function generateFaqJsonLd(isEnglishOrLocale?: boolean | string) {
  const faqs = getHomeFaqs(isEnglishOrLocale);
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateHowToJsonLd(isEnglishOrLocale?: boolean | string) {
  const isEn = typeof isEnglishOrLocale === "boolean" ? isEnglishOrLocale : isEnglishOrLocale === "en";
  const steps = getHomeHowToSteps(isEnglishOrLocale);
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isEn
      ? "How to Consult 1909 Rider-Waite Tarot Online with SeerTarot"
      : "วิธีดูดวงไพ่ทาโรต์ออนไลน์ 1909 Rider-Waite กับ SeerTarot",
    description: isEn
      ? "Step-by-step divination: physically shuffle, draw 78 cards with personal agency, and receive interpretations with Provably Fair verification."
      : "ขั้นตอนการสับไพ่ เลือกไพ่ 78 ใบด้วยตนเอง และรับคำทำนายจากแม่หมอ AI พร้อมระบบตรวจสอบความโปร่งใส Provably Fair",
    totalTime: "PT3M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: isEn ? "USD" : "THB",
      value: "0",
    },
    supply: [
      {
        "@type": "HowToSupply",
        name: isEn ? "Authentic 78-Card 1909 Rider-Waite Tarot Deck" : "สำรับไพ่ทาโรต์ 1909 Rider-Waite ดั้งเดิม 78 ใบ",
      },
    ],
    tool: [
      {
        "@type": "HowToTool",
        name: isEn ? "Web Browser or Mobile Device" : "เว็บเบราว์เซอร์หรือสมาร์ทโฟน",
      },
    ],
    step: steps.map((s, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: s.name,
      text: s.text,
      url: s.url,
      image: s.image,
    })),
  };
}
