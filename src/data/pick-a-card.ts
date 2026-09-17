/**
 * 🔮 ข้อมูลระบบ "Pick A Card (เลือกกองไพ่พยากรณ์)"
 * ===========================================================================
 * บรรจุ 4 หัวข้อยอดนิยมระดับประเทศที่มีการค้นหาสูงสุด
 * แต่ละหัวข้อมี 4 กองไพ่ (16 กอง) พร้อมการ์ด 1909 Rider-Waite แท้ 3 ใบต่อกอง
 * และคำทำนายเจาะลึก 3 มิติ (ปัจจุบัน, สิ่งที่ซ่อนอยู่, คำแนะนำ)
 */

export interface PickACardCardItem {
  cardId: string;
  isReversed: boolean;
  positionTh: string;
  positionEn: string;
}

export interface PickACardPile {
  id: string; // e.g. "pile-1"
  number: number; // 1, 2, 3, 4
  crystalTh: string;
  crystalEn: string;
  crystalDescTh: string;
  crystalDescEn: string;
  cards: [PickACardCardItem, PickACardCardItem, PickACardCardItem];
  readingTh: {
    theme: string;
    overview: string;
    currentSituation: string;
    hiddenLayer: string;
    oracleAdvice: string;
    affirmation: string;
  };
  readingEn: {
    theme: string;
    overview: string;
    currentSituation: string;
    hiddenLayer: string;
    oracleAdvice: string;
    affirmation: string;
  };
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
  piles: [PickACardPile, PickACardPile, PickACardPile, PickACardPile];
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
    coverCardId: "major-02", // The High Priestess
    descriptionTh: "สำหรับคนที่มีคนคุย คนในใจ แฟน หรือความสัมพันธ์ที่ยังคลุมเครือ หลับตา สูดหายใจเข้าลึก ๆ นึกถึงใบหน้าหรือชื่อของเขา แล้วเลือกกองไพ่ที่ดึงดูดใจคุณที่สุด",
    descriptionEn: "For anyone navigating a crush, situationship, partnership, or quiet longing. Close your eyes, take a deep breath, hold their name in your heart, and choose the pile that calls to you.",
    piles: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
        cards: [
          { cardId: "cups-02", isReversed: false, positionTh: "ความรู้สึกในใจตอนนี้", positionEn: "Current Heart Space" },
          { cardId: "major-18", isReversed: false, positionTh: "สิ่งที่เขาเก็บซ่อนไว้", positionEn: "Hidden Undercurrents" },
          { cardId: "wands-04", isReversed: false, positionTh: "แนวโน้มและคำแนะนำ", positionEn: "Outcome & Oracle Guidance" },
        ],
        readingTh: {
          theme: "ความผูกพันที่กำลังเบ่งบาน แต่อัดแน่นไปด้วยความลังเลในใจ",
          overview: "เขารู้สึกดีกับคุณอย่างแท้จริง มีเคมีที่คลิกกันตั้งแต่แรกพบ แต่ลึก ๆ เขายังมีความกังวลจากอดีตที่ทำให้ไม่กล้าก้าวมาข้างหน้าเต็มตัว",
          currentSituation: "ไพ่ Two of Cups ชี้ชัดว่าเขามองคุณเป็นคนพิเศษที่พูดคุยด้วยแล้วสบายใจ เวลาอยู่ด้วยกันเขารู้สึกถึงความอบอุ่นและมีประกายความหวังว่าความสัมพันธ์นี้อาจพัฒนาไปได้ไกล",
          hiddenLayer: "ไพ่ The Moon เผยว่า แม้ข้างนอกเขาจะดูนิ่งหรือตอบช้า แต่ข้างในเต็มไปด้วยคำถาม เขาอาจยังกลัวความผิดหวังซ้ำรอยเก่า หรือกลัวว่าตัวเองจะดีไม่พอสำหรับคุณ จึงเลือกที่จะดูเชิงอยู่เงียบ ๆ",
          oracleAdvice: "ไพ่ Four of Wands สรุปว่าพื้นฐานความรู้สึกของเขานั้นมั่นคง ให้พื้นที่และเวลาเขาโดยไม่ต้องเร่งรัด การสื่อสารที่สม่ำเสมอและเป็นตัวของตัวเองจะสร้างสะพานเชื่อมใจให้เขาพร้อมเปิดตัวในที่สุด",
          affirmation: "ความสัมพันธ์ที่ดีไม่ต้องเหนื่อยวิ่งตาม ความจริงใจที่นิ่งสงบจะพาคนถูกคนเข้ามาหาคุณเอง",
        },
        readingEn: {
          theme: "Budding Kinship Clouded by Past Vulnerabilities",
          overview: "There is undeniable mutual chemistry and affection between you two, yet an echo of previous heartache makes them tread cautiously.",
          currentSituation: "The Two of Cups reflects genuine rapport. They cherish every conversation with you and sense a rare, harmonic resonance when in your presence.",
          hiddenLayer: "The Moon reveals deep-seated fears under the surface. Their occasional reservation is not a lack of interest, but an emotional defense mechanism guarding against past bruises.",
          oracleAdvice: "Four of Wands heralds stability and celebration ahead. Maintain consistent, pressure-free openness. As trust solidifies, they will step into the light with renewed certainty.",
          affirmation: "Authentic love blooms without force. My serene confidence is my most magnetic sanctuary.",
        },
        targetSpreadId: "how-they-feel",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
        cards: [
          { cardId: "swords-08", isReversed: false, positionTh: "ความรู้สึกในใจตอนนี้", positionEn: "Current Heart Space" },
          { cardId: "major-01", isReversed: false, positionTh: "สิ่งที่เขาเก็บซ่อนไว้", positionEn: "Hidden Undercurrents" },
          { cardId: "pentacles-01", isReversed: false, positionTh: "แนวโน้มและคำแนะนำ", positionEn: "Outcome & Oracle Guidance" },
        ],
        readingTh: {
          theme: "คนที่มีภาระผูกมัดหรือติดกับดักความคิด แต่แอบวางแผนเรื่องคุณอยู่",
          overview: "เขาคิดถึงคุณบ่อยครั้งจนตัวเขาเองยังแปลกใจ แต่เขากำลังเผชิญกับเงื่อนไขในชีวิตจริงที่ทำให้ยังขยับตัวตามใจอยากไม่ได้",
          currentSituation: "ไพ่ Eight of Swords สะท้อนว่าเขารู้สึกเหมือนติดอยู่ในกรอบ อาจเป็นภาระงาน ปัญหาครอบครัว หรือสถานการณ์ชีวิตที่ยังไม่ลงตัว ทำให้เขาแสดงออกได้จำกัด",
          hiddenLayer: "ไพ่ The Magician ยืนยันว่าเขาไม่ได้หมดใจ ตรงกันข้าม เขากำลังคิดหาวิธีแก้เกมและหาจังหวะที่เหมาะสมที่สุดในการก้าวเข้ามาหาคุณอีกครั้ง เขาอยากเป็นฝ่ายคุมสถานการณ์",
          oracleAdvice: "ไพ่ Ace of Pentacles สรุปว่าโอกาสใหม่ที่จับต้องได้กำลังจะเริ่มต้นขึ้น อย่าเพิ่งด่วนตัดสินเขาจากความเงียบ ให้โฟกัสที่การดูแลตัวเอง เมื่อชีวิตเขาคลี่คลาย เขาจะยื่นข้อเสนอที่จริงจังมาให้คุณ",
          affirmation: "ฉันมีคุณค่าในตัวเองโดยไม่ต้องรอการพิสูจน์จากใคร จังหวะเวลาที่ใช่จะนำพาสิ่งที่ดีที่สุดมาให้เสมอ",
        },
        readingEn: {
          theme: "Constrained Circumstances Harboring Deliberate Intent",
          overview: "They contemplate you far more than they outwardly convey, navigating practical constraints that currently restrict their freedom of action.",
          currentSituation: "Eight of Swords denotes feeling mentally boxed in by work pressures, family obligations, or unresolved logistics that drain their bandwidth.",
          hiddenLayer: "The Magician discloses resourceful contemplation. They are quietly formulating ways to bridge the divide and present their most capable self to you.",
          oracleAdvice: "Ace of Pentacles promises a grounded, tangible fresh start. Resist interpreting their quietness as disinterest; tend to your own garden while circumstances align.",
          affirmation: "My peace is rooted within. Right timing orchestrates every sacred arrival.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
        cards: [
          { cardId: "major-19", isReversed: false, positionTh: "ความรู้สึกในใจตอนนี้", positionEn: "Current Heart Space" },
          { cardId: "wands-06", isReversed: false, positionTh: "สิ่งที่เขาเก็บซ่อนไว้", positionEn: "Hidden Undercurrents" },
          { cardId: "cups-03", isReversed: false, positionTh: "แนวโน้มและคำแนะนำ", positionEn: "Outcome & Oracle Guidance" },
        ],
        readingTh: {
          theme: "ความรู้สึกอบอุ่น สดใส และภูมิใจที่มีคุณอยู่ในชีวิต",
          overview: "กองนี้พลังงานสว่างสดใสมาก เขามองคุณเป็นแรงบันดาลใจและเป็นคนที่พาความสดใสเข้ามาในวันที่เขาเหนื่อยล้า",
          currentSituation: "ไพ่ The Sun บอกว่าความรู้สึกของเขาเปิดเผย ตรงไปตรงมา และชื่นชมคุณอย่างจริงใจ คุณทำให้โลกของเขาดูมีสีสันขึ้นอย่างเห็นได้ชัด",
          hiddenLayer: "ไพ่ Six of Wands เผยว่าเขามองคุณเป็นคนที่มีเสน่ห์มาก และลึก ๆ เขาก็อยากเอาชนะใจคุณ อยากให้คุณมองว่าเขาเป็นคนที่ประสบความสำเร็จและพึ่งพาได้",
          oracleAdvice: "ไพ่ Three of Cups แนะนำให้รักษาบรรยากาศที่สบาย ๆ ชวนไปทานข้าวหรือทำกิจกรรมร่วมกัน ไม่ต้องกดดันเรื่องสถานะ ความผูกพันที่สร้างจากความเป็นเพื่อนที่จริงใจจะนำไปสู่ความรักที่ยั่งยืน",
          affirmation: "พลังบวกและความสดใสของฉันคือของขวัญอันล้ำค่าที่ดึงดูดความรักที่งดงามเข้ามา",
        },
        readingEn: {
          theme: "Radiant Admiration and Joyful Inspiration",
          overview: "A delightfully buoyant reading. They perceive you as a luminescent presence who brings spontaneous joy into their world.",
          currentSituation: "The Sun signifies unvarnished clarity and warm admiration. Your energy brings unfeigned smiles and unburdened enthusiasm to their spirit.",
          hiddenLayer: "Six of Wands points to subtle pride. They admire your caliber and eagerly desire to earn your recognition as a reliable, worthy counterpart.",
          oracleAdvice: "Three of Cups encourages lighthearted companionship. Gather, laugh, and explore shared pastimes. Camaraderie forms the most durable scaffold for lasting affection.",
          affirmation: "My authentic joy radiates grace and invites unhindered devotion.",
        },
        targetSpreadId: "how-they-feel",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
        cards: [
          { cardId: "major-14", isReversed: false, positionTh: "ความรู้สึกในใจตอนนี้", positionEn: "Current Heart Space" },
          { cardId: "swords-02", isReversed: false, positionTh: "สิ่งที่เขาเก็บซ่อนไว้", positionEn: "Hidden Undercurrents" },
          { cardId: "major-06", isReversed: false, positionTh: "แนวโน้มและคำแนะนำ", positionEn: "Outcome & Oracle Guidance" },
        ],
        readingTh: {
          theme: "การปรับสมดุล ความรู้สึกที่ลึกซึ้ง และทางแยกของการตัดสินใจ",
          overview: "ความสัมพันธ์นี้มีมิติทางจิตวิญญาณที่ลึกซึ้ง (Karmic Connection) เขารู้สึกผูกพันกับคุณอย่างประหลาด แต่กำลังชั่งน้ำหนักระหว่างเหตุผลกับความรู้สึก",
          currentSituation: "ไพ่ Temperance สะท้อนว่าเขากำลังประคองความรู้สึก พยายามปรับตัวเข้าหาคุณทีละนิด ไม่ต้องการทำอะไรที่บุ่มบ่ามจนเสียความสัมพันธ์",
          hiddenLayer: "ไพ่ Two of Swords เผยว่าเขามีทางเลือกหรือจุดที่ต้องตัดสินใจในใจ อาจเป็นการเลือกระหว่างความสบายใจกับการเปลี่ยนแปลงครั้งใหญ่ เขายังปิดตาไม่ยอมฟังเสียงใดเสียงหนึ่ง",
          oracleAdvice: "ไพ่ The Lovers ฟันธงว่า ในที่สุดความจริงใจและการเชื่อมโยงของหัวใจจะชนะ ขอให้คุณหนักแน่นและซื่อสัตย์ต่อความรู้สึกของตนเอง การเปิดอกคุยกันอย่างตรงไปตรงมาจะช่วยให้เขาตัดสินใจได้ง่ายขึ้น",
          affirmation: "ฉันคู่ควรกับความรักที่ชัดเจนและเลือกฉันด้วยหัวใจทั้งหมด",
        },
        readingEn: {
          theme: "Alchemical Balancing and the Threshold of Choice",
          overview: "A profound, soulful bond. They feel an uncanny familiarity with you, yet wrestle with harmonizing emotional desire against logical discretion.",
          currentSituation: "Temperance indicates thoughtful moderation. They are steadily attuning their rhythm to yours, loath to make impetuous missteps.",
          hiddenLayer: "Two of Swords exposes internal stalemate. They stand between two paths—perhaps past baggage versus new emotional frontiers—temporarily stalled in deliberation.",
          oracleAdvice: "The Lovers assures that deep spiritual harmony will resolve the impasse. Stand steadfast in your integrity. Honest, heart-centered dialogue will dissolve lingering hesitation.",
          affirmation: "I am deserving of a wholehearted love that chooses me unequivocally.",
        },
        targetSpreadId: "how-they-feel",
      },
    ],
  },
  {
    id: "love-future",
    slug: "future-of-your-relationship",
    titleTh: "ทิศทางความรักและความสัมพันธ์ในอนาคต",
    titleEn: "Future Direction of Your Relationship",
    subtitleTh: "ความรักของคุณกำลังเดินทางไปทางไหน และอะไรคือสิ่งที่จะช่วยให้ความสัมพันธ์เติบโต",
    subtitleEn: "Where is your love journey heading and what will foster profound harmony?",
    category: "love",
    coverCardId: "major-06", // The Lovers
    descriptionTh: "สำรวจแนวโน้มของหัวใจ ไม่ว่าคุณจะโสด กำลังคุย หรือมีคู่อยู่แล้ว ไพ่ทั้ง 4 กองจะช่วยสะท้อนเส้นทางข้างหน้าและข้อคิดเตือนใจ",
    descriptionEn: "Examine romantic currents ahead whether single, courting, or committed. These 4 piles unveil prospective milestones and intuitive wisdom.",
    piles: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
        cards: [
          { cardId: "cups-01", isReversed: false, positionTh: "พลังงานตั้งต้น", positionEn: "Seed Energy" },
          { cardId: "wands-02", isReversed: false, positionTh: "จุดเปลี่ยนสำคัญ", positionEn: "Turning Point" },
          { cardId: "cups-10", isReversed: false, positionTh: "ผลลัพธ์ปลายทาง", positionEn: "Ultimate Horizon" },
        ],
        readingTh: {
          theme: "การเริ่มต้นใหม่ที่นำไปสู่ความสุขสมบูรณ์ในครอบครัว",
          overview: "ความรักของคุณกำลังเข้าสู่ช่วงแห่งการฟื้นฟู ความรู้สึกที่เคยเหือดแห้งจะได้รับน้ำหล่อเลี้ยงใหม่ และนำไปสู่ความมั่นคงระยะยาว",
          currentSituation: "ไพ่ Ace of Cups บ่งบอกถึงหัวใจที่พร้อมจะรักอีกครั้ง มีโอกาสที่จะพบเจอคนที่เข้ากันได้ดี หรือความสัมพันธ์เดิมจะกลับมาหวานชื่น",
          hiddenLayer: "ไพ่ Two of Wands ชี้ว่าอีกไม่นานคุณหรือเขาจะต้องมองการณ์ไกล วางแผนร่วมกัน เช่น การย้ายมาอยู่ใกล้กัน หรือการตกลงเรื่องอนาคต",
          oracleAdvice: "ไพ่ Ten of Cups สัญญาณแห่งความสมบูรณ์แบบทางอารมณ์ คุณจะพบความสงบในใจและความรักที่ตอบสนองความต้องการของกันและกันได้อย่างลงตัว",
          affirmation: "ฉันพร้อมเปิดรับความรักที่อบอุ่น มั่นคง และเปี่ยมสุข",
        },
        readingEn: {
          theme: "Emotional Rebirth Culminating in Shared Domestic Bliss",
          overview: "Your romantic horizon experiences emotional renewal. Weary waters refresh into enduring sanctuary and profound emotional safety.",
          currentSituation: "Ace of Cups marks an overflowing chalice of fresh affection, heralding an awakening of heart-centered tenderness.",
          hiddenLayer: "Two of Wands signifies co-envisioning the horizon. Practical decisions regarding shared commitments or living arrangements approach.",
          oracleAdvice: "Ten of Cups heralds consummate emotional fulfillment. Peace and mutual cherishing anchor this bond for the long haul.",
          affirmation: "I welcome a nourishing partnership replete with enduring warmth and mutual grace.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
        cards: [
          { cardId: "swords-04", isReversed: false, positionTh: "พลังงานตั้งต้น", positionEn: "Seed Energy" },
          { cardId: "major-08", isReversed: false, positionTh: "จุดเปลี่ยนสำคัญ", positionEn: "Turning Point" },
          { cardId: "wands-03", isReversed: false, positionTh: "ผลลัพธ์ปลายทาง", positionEn: "Ultimate Horizon" },
        ],
        readingTh: {
          theme: "การพักรบเพื่อเยียวยาใจ นำไปสู่ความแข็งแกร่งและการขยายขอบเขต",
          overview: "ช่วงเวลานี้คือการถอยกลับมาฟื้นฟูจิตใจ การอดทนอย่างมีสติจะช่วยให้คุณก้าวข้ามอุปสรรคและได้พบกับเส้นทางที่กว้างไกลกว่าเดิม",
          currentSituation: "ไพ่ Four of Swords แนะนำให้หยุดความขัดแย้ง พักผ่อน และไม่เอาใจไปผูกไว้กับความกังวล การเว้นระยะจะช่วยให้มองเห็นความจริงได้ชัดเจนขึ้น",
          hiddenLayer: "ไพ่ Strength เผยถึงพลังใจอันเงียบสงบที่สามารถเอาชนะความเกรี้ยวกราดหรือความเอาแต่ใจได้ด้วยความเมตตาและความอ่อนโยน",
          oracleAdvice: "ไพ่ Three of Wands สรุปว่าเรือแห่งโอกาสกำลังแล่นเข้ามา หลังผ่านช่วงปรับตัว คุณจะได้ขยายขอบฟ้าความรัก อาจเป็นการเดินทางร่วมกันหรือพบรักจากต่างแดน",
          affirmation: "ความสงบนิ่งคือพลังที่ยิ่งใหญ่ที่สุดของฉันในการนำพาความรักที่ดีเข้ามา",
        },
        readingEn: {
          theme: "Quiet Sanctuary Yielding Radiant Resilience and Expansion",
          overview: "A deliberate interlude of emotional recalibration. Patience and compassionate mastery dissolve prior friction, opening expansive prospects.",
          currentSituation: "Four of Swords counsels restful non-reaction. Stepping back grants essential perspective and heals mental exhaustion.",
          hiddenLayer: "Strength illustrates gentle dominion over fear and impulsivity, proving that grace disarms hostility far better than aggression.",
          oracleAdvice: "Three of Wands envisions fleets returning laden with triumph. Broadened horizons, travel, or cross-cultural love emerge.",
          affirmation: "My serene patience is sovereign. I govern my emotional destiny with quiet grace.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
        cards: [
          { cardId: "major-10", isReversed: false, positionTh: "พลังงานตั้งต้น", positionEn: "Seed Energy" },
          { cardId: "pentacles-03", isReversed: false, positionTh: "จุดเปลี่ยนสำคัญ", positionEn: "Turning Point" },
          { cardId: "pentacles-10", isReversed: false, positionTh: "ผลลัพธ์ปลายทาง", positionEn: "Ultimate Horizon" },
        ],
        readingTh: {
          theme: "กงล้อโชคชะตาหมุนนำพาความมั่นคง มรดก และความผูกพันที่ยั่งยืน",
          overview: "วัฏจักรเก่ากำลังสิ้นสุดลง โชคชะตากำลังเหวี่ยงคนที่มีศีลเสมอกันเข้ามาเพื่อร่วมสร้างอนาคตที่มั่นคงและมั่งคั่งไปด้วยกัน",
          currentSituation: "ไพ่ Wheel of Fortune ชี้ว่าจังหวะเวลาแห่งการเปลี่ยนแปลงมาถึงแล้ว อะไรที่เคยติดขัดจะเริ่มคลายตัว เหตุการณ์บังเอิญที่มีความหมายจะเกิดขึ้น",
          hiddenLayer: "ไพ่ Three of Pentacles แสดงถึงการร่วมมือ การรับฟัง และการทำงานเป็นทีมในความสัมพันธ์ ทั้งสองฝ่ายจะเห็นคุณค่าของกันและกันในการสร้างรากฐาน",
          oracleAdvice: "ไพ่ Ten of Pentacles ผลลัพธ์สูงสุดของความมั่นคงทางชีวิต ทั้งเรื่องครอบครัว ฐานะ และความสัมพันธ์ที่ได้รับความยินยอมพร้อมใจจากทุกฝ่าย",
          affirmation: "ฉันเปิดรับความสัมพันธ์ที่อุดมสมบูรณ์ มั่นคง และเกื้อหนุนซึ่งกันและกันในทุกด้าน",
        },
        readingEn: {
          theme: "Fated Cycles Aligning for Enduring Legacy and Wealth",
          overview: "The wheel turns auspiciously. Synchronistic alignment introduces a resonant soul to co-build generational stability and shared prosperity.",
          currentSituation: "Wheel of Fortune heralds an inexorable turning point. Stagnant dilemmas untangle as serendipity takes the helm.",
          hiddenLayer: "Three of Pentacles emphasizes cooperative devotion. Mutual respect and complementary strengths establish a formidable foundation.",
          oracleAdvice: "Ten of Pentacles manifests lasting security, familial blessings, and multi-dimensional wealth.",
          affirmation: "I am divinely aligned with lasting stability, sacred collaboration, and generational abundance.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
        cards: [
          { cardId: "major-11", isReversed: false, positionTh: "พลังงานตั้งต้น", positionEn: "Seed Energy" },
          { cardId: "cups-08", isReversed: false, positionTh: "จุดเปลี่ยนสำคัญ", positionEn: "Turning Point" },
          { cardId: "major-17", isReversed: false, positionTh: "ผลลัพธ์ปลายทาง", positionEn: "Ultimate Horizon" },
        ],
        readingTh: {
          theme: "ความยุติธรรม การละทิ้งสิ่งที่ไม่ใช่ เพื่อพบกับแสงดาวแห่งความหวัง",
          overview: "ความสัมพันธ์นี้จะนำความจริงใจและความชัดเจนมาให้ อะไรที่ไม่ซื่อสัตย์จะต้องจบลงเพื่อเปิดทางให้ความรักที่บริสุทธิ์และแท้จริง",
          currentSituation: "ไพ่ Justice ยืนยันถึงผลของการกระทำ ความจริงจะปรากฏ คุณจะได้รับความยุติธรรมและความกระจ่างในเรื่องที่เคยสงสัย",
          hiddenLayer: "ไพ่ Eight of Cups แสดงถึงการกล้าเดินออกมาจากสิ่งที่ไม่อาจเติมเต็มจิตวิญญาณได้ เป็นการจากลาด้วยความเข้าใจ ไม่ใช่ด้วยความเคียดแค้น",
          oracleAdvice: "ไพ่ The Star ดวงดาวแห่งความหวังและการเยียวยา หลังจากคลื่นลมสงบ คุณจะพบกับความรักที่มอบแรงบันดาลใจและเยียวยาหัวใจได้อย่างอัศจรรย์",
          affirmation: "ฉันกล้าปล่อยมือจากสิ่งที่ไม่คู่ควร เพื่อเปิดรับความรักที่งดงามดั่งแสงดาว",
        },
        readingEn: {
          theme: "Karmic Rectitude: Departing the Stagnant to Greet the Star",
          overview: "Equilibrium restored through unequivocal clarity. Outworn illusions dissolve to make sovereign room for pure, restorative devotion.",
          currentSituation: "Justice ensures truth will reign. Ambiguities evaporate, delivering overdue resolution and moral fairness.",
          hiddenLayer: "Eight of Cups depicts courageous departure from emotional stagnation, walking away in dignified serenity rather than malice.",
          oracleAdvice: "The Star bestows celestial reassurance and radiant renewal. Following this threshold, profound spiritual love heals every ache.",
          affirmation: "I courageously release what does not honor my soul, walking into starlit belonging.",
        },
        targetSpreadId: "three-card",
      },
    ],
  },
  {
    id: "career-finance",
    slug: "next-step-career-finance",
    titleTh: "ก้าวต่อไปเรื่องงานและโอกาสการเงินใหม่",
    titleEn: "Your Next Step in Career & Finances",
    subtitleTh: "ตรวจเช็กจังหวะดวงการงาน การลงทุน และทิศทางสร้างรายได้ระลอกถัดไป",
    subtitleEn: "Discern upcoming professional pivots, financial openings, and strategic moves",
    category: "career",
    coverCardId: "pentacles-01", // Ace of Pentacles
    descriptionTh: "สำหรับคนที่กำลังมองหางานใหม่ คิดจะเริ่มต้นธุรกิจ หรือต้องการความชัดเจนเรื่องเงินและโปรเจกต์ข้างหน้า เลือกกองไพ่ที่ดึงดูดพลังงานคุณที่สุด",
    descriptionEn: "For pioneers seeking career breakthroughs, entrepreneurial leaps, or wealth milestones. Tune your focus and choose your guiding pile.",
    piles: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
        cards: [
          { cardId: "pentacles-08", isReversed: false, positionTh: "ทักษะและการลงมือทำ", positionEn: "Mastery & Craft" },
          { cardId: "wands-08", isReversed: false, positionTh: "กระแสโอกาสที่ไหลเข้ามา", positionEn: "Incoming Momentum" },
          { cardId: "pentacles-09", isReversed: false, positionTh: "ผลลัพธ์และความสำเร็จ", positionEn: "Financial Sovereignty" },
        ],
        readingTh: {
          theme: "ฝีมือเฉพาะทางที่สั่งสมมา กำลังจะผลิดอกออกผลเป็นความมั่งคั่งอิสระ",
          overview: "ความพยายามอย่างเงียบ ๆ ที่คุณทุ่มเทกำลังจะได้รับการยอมรับ มีเกณฑ์ได้รับข้อเสนอหรือความก้าวหน้าอย่างรวดเร็วเกินคาด",
          currentSituation: "ไพ่ Eight of Pentacles สะท้อนถึงการฝึกฝนความเชี่ยวชาญ คุณกำลังทำงานหนักและมีความประณีต ผลงานของคุณมีคุณภาพเป็นที่ประจักษ์",
          hiddenLayer: "ไพ่ Eight of Wands ชี้ว่าข่าวสารหรือการตอบรับจะเข้ามาอย่างรวดเร็ว การติดต่องานหรือข้อเสนอใหม่ ๆ จะถาโถมเข้ามาในเวลาอันสั้น",
          oracleAdvice: "ไพ่ Nine of Pentacles บ่งบอกถึงความมั่งคั่งและความภาคภูมิใจ คุณจะสามารถยืนหยัดบนลำแข้งของตนเองได้อย่างสง่างามและมีอิสรภาพทางการเงิน",
          affirmation: "ความมุ่งมั่นและทักษะของฉัน กำลังนำพาความมั่งคั่งที่ยั่งยืนเข้ามาสู่ชีวิต",
        },
        readingEn: {
          theme: "Diligence Transforming into Rapid Sovereign Prosperity",
          overview: "Your meticulous dedication behind closed doors now commands recognition. Rapid momentum propels you toward financial autonomy.",
          currentSituation: "Eight of Pentacles exemplifies artisan mastery. Your craftsmanship and attention to nuance distinguish you as an authority.",
          hiddenLayer: "Eight of Wands accelerates incoming communication. Contracts, approvals, or career opportunities arrive in swift succession.",
          oracleAdvice: "Nine of Pentacles celebrates refined independence. You attain the summit of self-made financial comfort and sovereign peace.",
          affirmation: "My relentless dedication bears bountiful, sovereign fruit. Abundance flows naturally to my craft.",
        },
        targetSpreadId: "career",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
        cards: [
          { cardId: "major-04", isReversed: false, positionTh: "ทักษะและการลงมือทำ", positionEn: "Mastery & Craft" },
          { cardId: "swords-06", isReversed: false, positionTh: "กระแสโอกาสที่ไหลเข้ามา", positionEn: "Incoming Momentum" },
          { cardId: "major-07", isReversed: false, positionTh: "ผลลัพธ์และความสำเร็จ", positionEn: "Financial Sovereignty" },
        ],
        readingTh: {
          theme: "การจัดระเบียบโครงสร้าง การพายเรือข้ามมรสุม และชัยชนะที่ยิ่งใหญ่",
          overview: "คุณกำลังออกจากจุดที่วุ่นวายเพื่อก้าวขึ้นสู่ตำแหน่งผู้นำ ความเด็ดขาดและวินัยจะพาคุณฝ่าฟันอุปสรรคจนคว้าชัยชนะได้สำเร็จ",
          currentSituation: "ไพ่ The Emperor ชี้ถึงความจำเป็นในการตั้งเป้าหมายที่ชัดเจน ใช้กฎเกณฑ์ วางแผนอย่างมีกลยุทธ์ และคุมทีมหรือตนเองให้อยู่ในระเบียบ",
          hiddenLayer: "ไพ่ Six of Swords บอกว่าคุณกำลังแล่นเรือออกจากปัญหาเดิม ๆ การเปลี่ยนสถานที่ทำงาน หรือการย้ายสายงานจะนำความสงบมาให้",
          oracleAdvice: "ไพ่ The Chariot สรุปว่าชัยชนะอยู่ไม่ไกล จงกุมบังเหียนของชีวิตให้มั่นคง ไม่ว่าจะเจอกับแรงเสียดทานใด ความตั้งใจจริงจะพาคุณเข้าเส้นชัย",
          affirmation: "ฉันเป็นผู้นำชีวิตของตนเอง ความมุ่งมั่นและวินัยคือเส้นทางสู่ความสำเร็จของฉัน",
        },
        readingEn: {
          theme: "Executive Strategy Navigating Storms to Sovereign Victory",
          overview: "Transitioning out of friction into definitive leadership. Uncompromising discipline steers you past turmoil toward decisive conquest.",
          currentSituation: "The Emperor demands structural rigor. Establish boundaries, orchestrate systems, and govern your affairs with authoritative foresight.",
          hiddenLayer: "Six of Swords signifies graceful departure from toxic environments toward smoother operational waters.",
          oracleAdvice: "The Chariot guarantees triumph through focused willpower. Harness divergent forces and drive unflinchingly toward the finish line.",
          affirmation: "I steer my enterprise with unshakeable discipline. Victory is my natural trajectory.",
        },
        targetSpreadId: "career",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
        cards: [
          { cardId: "wands-01", isReversed: false, positionTh: "ทักษะและการลงมือทำ", positionEn: "Mastery & Craft" },
          { cardId: "major-03", isReversed: false, positionTh: "กระแสโอกาสที่ไหลเข้ามา", positionEn: "Incoming Momentum" },
          { cardId: "pentacles-04", isReversed: false, positionTh: "ผลลัพธ์และความสำเร็จ", positionEn: "Financial Sovereignty" },
        ],
        readingTh: {
          theme: "ไฟไอเดียใหม่ที่จุดติด การงอกเงยของโปรเจกต์ และการเก็บรักษาความมั่งคั่ง",
          overview: "มีแรงบันดาลใจครั้งใหม่กำลังปะทุขึ้น การริเริ่มสิ่งใหม่ ๆ ในตอนนี้จะได้รับแรงสนับสนุนและออกดอกออกผลอย่างอุดมสมบูรณ์",
          currentSituation: "ไพ่ Ace of Wands ไฟแห่งการเริ่มต้น โอกาสใหม่ ไอเดียธุรกิจ หรือโปรเจกต์ที่คุณรู้สึกตื่นเต้นที่จะได้ลงมือทำ",
          hiddenLayer: "ไพ่ The Empress พลังแห่งการเติบโตและความอุดมสมบูรณ์ โปรเจกต์นี้มีศักยภาพในการทำกำไรสูงและจะได้รับการดูแลเอาใจใส่อย่างดี",
          oracleAdvice: "ไพ่ Four of Pentacles แนะนำให้บริหารจัดการรายรับรายจ่ายอย่างรัดกุม เมื่อหาเงินได้มากก็ต้องรู้จักเก็บออมเพื่อสร้างความมั่นคงระยะยาว",
          affirmation: "ไอเดียของฉันมีคุณค่าและสามารถสร้างความเจริญรุ่งเรืองให้กับชีวิตได้อย่างไม่จำกัด",
        },
        readingEn: {
          theme: "Ignited Innovation Nurtured into Generous Material Security",
          overview: "A spark of entrepreneurial genius ignites. Novel undertakings begun under this aegis flourish with lush abundance.",
          currentSituation: "Ace of Wands offers a lightning strike of inspiration. An invigorating project demands bold inception.",
          hiddenLayer: "The Empress radiates fertile expansion. Your ideas hold extraordinary commercial promise when nurtured with care.",
          oracleAdvice: "Four of Pentacles advises prudent asset custody. Consolidate your gains and build impenetrable fiscal fortresses.",
          affirmation: "My creative sparks manifest boundless commercial prosperity. I steward wealth wisely.",
        },
        targetSpreadId: "career",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
        cards: [
          { cardId: "major-09", isReversed: false, positionTh: "ทักษะและการลงมือทำ", positionEn: "Mastery & Craft" },
          { cardId: "swords-01", isReversed: false, positionTh: "กระแสโอกาสที่ไหลเข้ามา", positionEn: "Incoming Momentum" },
          { cardId: "major-21", isReversed: false, positionTh: "ผลลัพธ์และความสำเร็จ", positionEn: "Financial Sovereignty" },
        ],
        readingTh: {
          theme: "การค้นหาตัวตนที่แท้จริง การตัดสินใจที่เฉียบขาด และความสำเร็จระดับโลก",
          overview: "ช่วงเวลาแห่งการตกผลึกทางปัญญา คุณกำลังจะพบคำตอบว่างานแบบไหนที่ตอบโจทย์จิตวิญญาณของคุณอย่างแท้จริง และมันจะนำไปสู่ความสำเร็จสูงสุด",
          currentSituation: "ไพ่ The Hermit สะท้อนการหันกลับมาทบทวนตนเอง คุณอาจต้องการความเงียบเพื่อวางแผนระยะยาวมากกว่าการวิ่งตามกระแสสังคม",
          hiddenLayer: "ไพ่ Ace of Swords ความคิดที่แจ่มแจ้งและการฟันธง ความลังเลจะหมดไป คุณจะตัดสิ่งที่ไม่จำเป็นออกและมองเห็นทางออกที่เฉียบคม",
          oracleAdvice: "ไพ่ The World การปิดฉากวัฏจักรเก่าอย่างสมบูรณ์แบบเพื่อขึ้นสู่เวทีใหม่ที่ยิ่งใหญ่กว่าเดิม ความสำเร็จของคุณจะได้รับการยอมรับในระดับกว้าง",
          affirmation: "เมื่อฉันเดินตามแสงสว่างภายใน โลกทั้งใบจะเปิดทางให้ฉันประสบความสำเร็จอย่างงดงาม",
        },
        readingEn: {
          theme: "Inner Illumination and Incisive Insight Achieving Global Triumph",
          overview: "Profound intellectual synthesis. Deep soul-searching reveals your true vocation, paving the road to consummate culmination.",
          currentSituation: "The Hermit represents contemplative mastery. Solitary reflection yields higher clarity than chasing superficial trends.",
          hiddenLayer: "Ace of Swords cleaves through ambiguity. Uncompromising truth illuminates the exact strategic breakthrough required.",
          oracleAdvice: "The World heralds the triumphant completion of a major epoch. You ascend to an elevated arena of global recognition.",
          affirmation: "Guided by inner wisdom, I step onto the world stage with consummate grace and mastery.",
        },
        targetSpreadId: "career",
      },
    ],
  },
  {
    id: "universe-guidance",
    slug: "urgent-message-from-the-universe",
    titleTh: "ข้อความเตือนสติที่จักรวาลอยากบอกคุณ",
    titleEn: "An Urgent Message from the Universe",
    subtitleTh: "สิ่งที่จิตวิญญาณของคุณต้องการได้ยินในตอนนี้ เพื่อเยียวยาและปลดล็อกพลังในตัวเอง",
    subtitleEn: "What your spirit needs to hear right now to heal, awaken, and flourish",
    category: "spiritual",
    coverCardId: "major-17", // The Star
    descriptionTh: "พักความวุ่นวายจากภายนอก ทำใจให้สงบ นึกถึงตนเองด้วยความรักและความเมตตา แล้วเลือกกองไพ่ที่ส่องประกายในใจคุณที่สุด",
    descriptionEn: "Quiet external noise, breathe with compassion toward your journey, and select the pile that resonates with your heart's sanctuary.",
    piles: [
      {
        id: "pile-1",
        number: 1,
        crystalTh: "โรสควอตซ์ (Rose Quartz)",
        crystalEn: "Rose Quartz",
        crystalDescTh: "หินแห่งความอ่อนโยน การเปิดใจ และการเยียวยาความรู้สึก",
        crystalDescEn: "Stone of unconditional warmth, emotional vulnerability, and healing",
        cards: [
          { cardId: "major-12", isReversed: false, positionTh: "สภาวะปัจจุบัน", positionEn: "Current State" },
          { cardId: "major-00", isReversed: false, positionTh: "การตื่นรู้", positionEn: "Awakening" },
          { cardId: "cups-09", isReversed: false, positionTh: "พรจากจักรวาล", positionEn: "Cosmic Blessing" },
        ],
        readingTh: {
          theme: "การปล่อยวางการควบคุม เพื่อกระโดดเข้าสู่การเดินทางครั้งใหม่ที่มีความสุข",
          overview: "คุณอาจรู้สึกเหมือนชีวิตหยุดชะงักมาสักพัก แต่จักรวาลกำลังบอกว่านี่คือช่วงเวลาที่จิตวิญญาณกำลังพักผ่อนก่อนการเริ่มต้นครั้งสำคัญ",
          currentSituation: "ไพ่ The Hanged Man บอกว่าอย่าฝืนกระแสน้ำ บางครั้งการหยุดนิ่งและมองโลกจากมุมมองใหม่จะช่วยให้คุณเห็นทางออกที่ไม่เคยคิดถึง",
          hiddenLayer: "ไพ่ The Fool การก้าวกระโดดด้วยความไว้วางใจ อย่ากลัวที่จะเป็นมือใหม่อีกครั้ง การทิ้งสัมภาระเก่า ๆ จะทำให้คุณเบาสบายและบินได้สูงขึ้น",
          oracleAdvice: "ไพ่ Nine of Cups ไพ่แห่งความสมปรารถนา (Wish Card) สิ่งที่คุณแอบหวังไว้ในใจกำลังจะกลายเป็นจริง ขอให้เชื่อมั่นในคุณค่าของตนเอง",
          affirmation: "ฉันปล่อยวางอดีตด้วยรอยยิ้ม และพร้อมก้าวสู่การผจญภัยครั้งใหม่ด้วยความเบิกบาน",
        },
        readingEn: {
          theme: "Surrendering Control to Leap into Blessed Fulfillment",
          overview: "What feels like a pause is sacred gestation. The cosmos invites you to relinquish micro-management before an exhilarating fresh leap.",
          currentSituation: "The Hanged Man asks you to halt resistance. Seeing dilemmas from an inverted angle reveals solutions invisible to hurried minds.",
          hiddenLayer: "The Fool invites unburdened innocence. Do not fear beginning anew; discarding heavy baggage allows your wings to catch the wind.",
          oracleAdvice: "Nine of Cups—the quintessential Wish Card—confirms personal contentment. Your unspoken heartfelt wishes ripen into fruition.",
          affirmation: "I release outworn attachments with gratitude, welcoming my next adventure with open arms.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-2",
        number: 2,
        crystalTh: "อเมทิสต์ (Amethyst)",
        crystalEn: "Amethyst",
        crystalDescTh: "หินแห่งสติปัญญา ลางสังหรณ์ และความเข้าใจในสัจธรรม",
        crystalDescEn: "Stone of mental clarity, heightened intuition, and honest discernment",
        cards: [
          { cardId: "major-16", isReversed: false, positionTh: "สภาวะปัจจุบัน", positionEn: "Current State" },
          { cardId: "major-13", isReversed: false, positionTh: "การตื่นรู้", positionEn: "Awakening" },
          { cardId: "major-19", isReversed: false, positionTh: "พรจากจักรวาล", positionEn: "Cosmic Blessing" },
        ],
        readingTh: {
          theme: "ฟ้าผ่าที่ทำลายภาพลวงตา เพื่อเปิดทางให้ดวงอาทิตย์ที่แท้จริงส่องแสง",
          overview: "เหตุการณ์ไม่คาดฝันหรือความผิดหวังที่เกิดขึ้นเมื่อเร็ว ๆ นี้ ไม่ใช่การลงโทษ แต่เป็นการกวาดล้างสิ่งที่ไม่จริงออกไปเพื่อปกป้องคุณ",
          currentSituation: "ไพ่ The Tower กำแพงที่สร้างบนรากฐานที่ไม่แข็งแรงต้องพังทลายลง แม้จะรู้สึกตกใจ แต่คุณจะได้หลุดพ้นจากพันธนาการที่ขังคุณไว้",
          hiddenLayer: "ไพ่ Death การสิ้นสุดของบทเรียนเดิม ดักแด้กำลังจะกลายเป็นผีเสื้อ สิ่งที่จากไปจะถูกแทนที่ด้วยสิ่งที่ดีกว่าเดิมอย่างเทียบไม่ได้",
          oracleAdvice: "ไพ่ The Sun แสงสว่าง ความสุข และความสำเร็จอันยิ่งใหญ่รอคุณอยู่ข้างหน้า ฟ้าหลังฝนนี้จะงดงามและสดใสที่สุดในชีวิตของคุณ",
          affirmation: "ทุกการเปลี่ยนแปลงที่เกิดขึ้นในชีวิต ล้วนนำพาฉันไปสู่เวอร์ชันที่ดีที่สุดเสมอ",
        },
        readingEn: {
          theme: "Cataclysmic Awakening Cleansing the Way for Unclouded Radiance",
          overview: "Recent disruption was not punishment, but fierce celestial protection stripping away hollow illusions before true illumination.",
          currentSituation: "The Tower levels compromised structures. Though jarring, this collapse liberates you from subtle prisons.",
          hiddenLayer: "Death marks irreversible metamorphosis. The chrysalis shatters so your sovereign wings may unfold.",
          oracleAdvice: "The Sun guarantees absolute radiant clarity and joy. The skies clearing after this tempest reveal the brightest dawn of your life.",
          affirmation: "Every upheaval is divine redirection guiding me to my radiant highest self.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-3",
        number: 3,
        crystalTh: "ซิทริน (Citrine)",
        crystalEn: "Citrine",
        crystalDescTh: "หินแห่งความกระจ่างใส เปล่งประกาย และพลังใจอันเปี่ยมล้น",
        crystalDescEn: "Stone of sunny abundance, joyful confidence, and magnetic optimism",
        cards: [
          { cardId: "swords-03", isReversed: false, positionTh: "สภาวะปัจจุบัน", positionEn: "Current State" },
          { cardId: "major-17", isReversed: false, positionTh: "การตื่นรู้", positionEn: "Awakening" },
          { cardId: "wands-09", isReversed: false, positionTh: "พรจากจักรวาล", positionEn: "Cosmic Blessing" },
        ],
        readingTh: {
          theme: "การเยียวยาบาดแผลในอดีต แสงดาวนำทาง และความเข้มแข็งที่ไม่มีวันพ่าย",
          overview: "หากคุณกำลังรู้สึกเจ็บปวดหรืออกหัก จักรวาลอยากบอกว่าคุณไม่ได้อยู่ลำพัง บาดแผลนี้กำลังจะกลายเป็นภูมิคุ้มกันและพลังที่ยิ่งใหญ่ของคุณ",
          currentSituation: "ไพ่ Three of Swords ความเจ็บปวดที่ต้องยอมรับความจริง อนุญาตให้ตัวเองได้ร้องไห้และปลดปล่อยความเสียใจออกมาอย่างเต็มที่",
          hiddenLayer: "ไพ่ The Star น้ำทิพย์ชโลมใจและการเยียวยา คุณจะเริ่มมองเห็นความหวัง และพบว่าชีวิตยังมีแง่มุมที่งดงามรออยู่อีกมากมาย",
          oracleAdvice: "ไพ่ Nine of Wands คุณผ่านศึกหนักมาจนถึงด่านสุดท้ายแล้ว อย่าเพิ่งยอมแพ้ ความอดทนและความเข้มแข็งของคุณจะพาคุณข้ามเส้นชัยได้อย่างปลอดภัย",
          affirmation: "หัวใจของฉันได้รับการเยียวยาในทุก ๆ วัน ฉันเข้มแข็งและงดงามขึ้นเสมอ",
        },
        readingEn: {
          theme: "Healing Ancient Wounds under Guiding Starlight",
          overview: "If your spirit feels bruised by disappointment, know you are held. Sorrow is transmuting into profound resilience and empathic strength.",
          currentSituation: "Three of Swords acknowledges honest grief. Allow tears to cleanse the wound without self-judgment.",
          hiddenLayer: "The Star pours restorative balms upon your spirit. Hope reawakens as celestial alignment repairs your aura.",
          oracleAdvice: "Nine of Wands reminds you that you have weathered the fiercest storms. Stand tall; the threshold is won.",
          affirmation: "My heart mends with divine grace. Every scar is transmuted into enduring light.",
        },
        targetSpreadId: "three-card",
      },
      {
        id: "pile-4",
        number: 4,
        crystalTh: "ลาปิส ลาซูลี (Lapis Lazuli)",
        crystalEn: "Lapis Lazuli",
        crystalDescTh: "หินแห่งสัจธรรม ความจริงแท้ และการตระหนักรู้ในจิตวิญญาณ",
        crystalDescEn: "Stone of celestial truth, soul contracts, and unvarnished honesty",
        cards: [
          { cardId: "major-02", isReversed: false, positionTh: "สภาวะปัจจุบัน", positionEn: "Current State" },
          { cardId: "major-05", isReversed: false, positionTh: "การตื่นรู้", positionEn: "Awakening" },
          { cardId: "major-20", isReversed: false, positionTh: "พรจากจักรวาล", positionEn: "Cosmic Blessing" },
        ],
        readingTh: {
          theme: "การฟังเสียงญาณหยั่งรู้ การได้รับคำชี้แนะจากครูบาอาจารย์ และการตื่นรู้ครั้งใหญ่",
          overview: "คุณมีพลังทางจิตวิญญาณและสัมผัสที่หกที่เฉียบคมมากในตอนนี้ จักรวาลกำลังส่งเสียงเรียกให้คุณตื่นขึ้นมาทำภารกิจแห่งจิตวิญญาณของคุณ",
          currentSituation: "ไพ่ The High Priestess จงเชื่อมั่นในสัญชาตญาณแรกของคุณ คำตอบไม่ได้อยู่ข้างนอก แต่อยู่ในความเงียบสงบภายในใจคุณเอง",
          hiddenLayer: "ไพ่ The Hierophant ความรู้ ภูมิปัญญาโบราณ หรือครูบาอาจารย์กำลังจะเข้ามาให้คำแนะนำ การศึกษาหาความรู้เพิ่มเติมจะช่วยยกระดับจิตใจ",
          oracleAdvice: "ไพ่ Judgement เสียงแตรปลุกแห่งการคืนชีพ คุณกำลังได้รับการชำระล้างบาปเคราะห์ในอดีต และเกิดใหม่เป็นตัวคุณที่เปี่ยมไปด้วยปัญญาและความสุข",
          affirmation: "ฉันไว้วางใจในเสียงกระซิบของจิตวิญญาณ และพร้อมตอบรับการตื่นรู้ของชีวิต",
        },
        readingEn: {
          theme: "Intuitive Awakening, Sacred Counsel, and the Great Cosmic Rebirth",
          overview: "Heightened spiritual discernment. The veil is thin; the universe summons you to answer your soul's authentic calling.",
          currentSituation: "The High Priestess urges trust in your inner oracle. Your quiet hunches hold more truth than external chatter.",
          hiddenLayer: "The Hierophant brings sacred mentorship, lineage wisdom, and foundational principles that ground your expansion.",
          oracleAdvice: "Judgement sounds the awakening clarion. Past karmic chapters close; you rise renewed in sovereignty and purpose.",
          affirmation: "I heed my sacred intuition. I step fearlessly into my soul's highest calling.",
        },
        targetSpreadId: "three-card",
      },
    ],
  },
];

export function getPickACardTopicBySlug(slug: string): PickACardTopic | undefined {
  return PICK_A_CARD_TOPICS.find((t) => t.slug === slug || t.id === slug);
}
