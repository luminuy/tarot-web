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
          theme: "หัวใจสองดวงที่จูนติดกันตั้งแต่ประโยคแรก",
          overview: "ความรู้สึกของเขาเริ่มจากความสบายใจที่หาไม่ได้ง่าย ๆ เขาไม่ได้มองคุณเป็นแค่คนคุยผ่าน ๆ แต่เป็นคนที่อยู่ด้วยแล้วได้เป็นตัวเอง",
          currentSituation: "ไพ่ Two of Cups ชี้ชัดว่าเขามองคุณเป็นคนพิเศษที่พูดคุยด้วยแล้วสบายใจ เวลาอยู่ด้วยกันเขารู้สึกถึงความอบอุ่นและมีประกายความหวังว่าความสัมพันธ์นี้อาจพัฒนาไปได้ไกล",
          hiddenLayer: "ไพ่ The Moon เผยว่า แม้ข้างนอกเขาจะดูนิ่งหรือตอบช้า แต่ข้างในเต็มไปด้วยคำถาม เขาอาจยังกลัวความผิดหวังซ้ำรอยเก่า หรือกลัวว่าตัวเองจะดีไม่พอสำหรับคุณ จึงเลือกที่จะดูเชิงอยู่เงียบ ๆ",
          oracleAdvice: "ไพ่ Four of Wands สรุปว่าพื้นฐานความรู้สึกของเขานั้นมั่นคง ให้พื้นที่และเวลาเขาโดยไม่ต้องเร่งรัด การสื่อสารที่สม่ำเสมอและเป็นตัวของตัวเองจะสร้างสะพานเชื่อมใจให้เขาพร้อมเปิดตัวในที่สุด",
          affirmation: "ความสัมพันธ์ที่ดีไม่ต้องเหนื่อยวิ่งตาม ความจริงใจที่นิ่งสงบจะพาคนถูกคนเข้ามาหาคุณเอง",
        },
        readingEn: {
          theme: "Two Hearts That Clicked From The First Conversation",
          overview: "Their feelings begin with a rare kind of ease. You are not passing company to them — you are the person they can be unguarded with.",
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
          theme: "ใจที่อยากขยับ แต่ชีวิตจริงยังมัดมือไว้",
          overview: "เขาไม่ได้เย็นชากับคุณ แต่ตอนนี้เขารู้สึกเหมือนถูกล้อมด้วยเงื่อนไขที่ยังแก้ไม่ตก ความเงียบหรือการตอบช้าจึงเป็นเรื่องของสถานการณ์มากกว่าความรู้สึก",
          currentSituation: "ไพ่ Eight of Swords สะท้อนว่าเขารู้สึกเหมือนติดอยู่ในกรอบ อาจเป็นภาระงาน ปัญหาครอบครัว หรือสถานการณ์ชีวิตที่ยังไม่ลงตัว ทำให้เขาแสดงออกได้จำกัด",
          hiddenLayer: "ไพ่ The Magician ยืนยันว่าเขาไม่ได้หมดใจ ตรงกันข้าม เขากำลังคิดหาวิธีแก้เกมและหาจังหวะที่เหมาะสมที่สุดในการก้าวเข้ามาหาคุณอีกครั้ง เขาอยากเป็นฝ่ายคุมสถานการณ์",
          oracleAdvice: "ไพ่ Ace of Pentacles สรุปว่าโอกาสใหม่ที่จับต้องได้กำลังจะเริ่มต้นขึ้น อย่าเพิ่งด่วนตัดสินเขาจากความเงียบ ให้โฟกัสที่การดูแลตัวเอง เมื่อชีวิตเขาคลี่คลาย เขาจะยื่นข้อเสนอที่จริงจังมาให้คุณ",
          affirmation: "ฉันมีคุณค่าในตัวเองโดยไม่ต้องรอการพิสูจน์จากใคร จังหวะเวลาที่ใช่จะนำพาสิ่งที่ดีที่สุดมาให้เสมอ",
        },
        readingEn: {
          theme: "A Willing Heart Held Back By Real-Life Knots",
          overview: "They are not cold towards you. They feel fenced in by circumstances they have not untangled yet, so silence here is logistics, not feeling.",
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
          theme: "ความชื่นชมที่เขาไม่คิดจะปิดบัง",
          overview: "พอพูดถึงคุณ พลังงานของเขาสว่างขึ้นทันที เขารู้สึกดีกับคุณแบบตรงไปตรงมา ไม่ซับซ้อน และไม่ต้องตีความอะไรมาก",
          currentSituation: "ไพ่ The Sun บอกว่าความรู้สึกของเขาเปิดเผย ตรงไปตรงมา และชื่นชมคุณอย่างจริงใจ คุณทำให้โลกของเขาดูมีสีสันขึ้นอย่างเห็นได้ชัด",
          hiddenLayer: "ไพ่ Six of Wands เผยว่าเขามองคุณเป็นคนที่มีเสน่ห์มาก และลึก ๆ เขาก็อยากเอาชนะใจคุณ อยากให้คุณมองว่าเขาเป็นคนที่ประสบความสำเร็จและพึ่งพาได้",
          oracleAdvice: "ไพ่ Three of Cups แนะนำให้รักษาบรรยากาศที่สบาย ๆ ชวนไปทานข้าวหรือทำกิจกรรมร่วมกัน ไม่ต้องกดดันเรื่องสถานะ ความผูกพันที่สร้างจากความเป็นเพื่อนที่จริงใจจะนำไปสู่ความรักที่ยั่งยืน",
          affirmation: "พลังบวกและความสดใสของฉันคือของขวัญอันล้ำค่าที่ดึงดูดความรักที่งดงามเข้ามา",
        },
        readingEn: {
          theme: "Admiration They Make No Attempt To Hide",
          overview: "Mention your name and their whole energy brightens. What they feel for you is plain, uncomplicated, and needs no decoding.",
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
          theme: "ความรู้สึกที่ค่อย ๆ ผสม ไม่รีบเทลงไปทั้งหมด",
          overview: "เขากำลังประคองความสัมพันธ์นี้อย่างระมัดระวัง ไม่ใช่เพราะไม่อิน แต่เพราะกลัวว่าความเร็วเกินไปจะทำให้สิ่งที่มีอยู่ตอนนี้เสียไป",
          currentSituation: "ไพ่ Temperance สะท้อนว่าเขากำลังประคองความรู้สึก พยายามปรับตัวเข้าหาคุณทีละนิด ไม่ต้องการทำอะไรที่บุ่มบ่ามจนเสียความสัมพันธ์",
          hiddenLayer: "ไพ่ Two of Swords เผยว่าเขามีทางเลือกหรือจุดที่ต้องตัดสินใจในใจ อาจเป็นการเลือกระหว่างความสบายใจกับการเปลี่ยนแปลงครั้งใหญ่ เขายังปิดตาไม่ยอมฟังเสียงใดเสียงหนึ่ง",
          oracleAdvice: "ไพ่ The Lovers ฟันธงว่า ในที่สุดความจริงใจและการเชื่อมโยงของหัวใจจะชนะ ขอให้คุณหนักแน่นและซื่อสัตย์ต่อความรู้สึกของตนเอง การเปิดอกคุยกันอย่างตรงไปตรงมาจะช่วยให้เขาตัดสินใจได้ง่ายขึ้น",
          affirmation: "ฉันคู่ควรกับความรักที่ชัดเจนและเลือกฉันด้วยหัวใจทั้งหมด",
        },
        readingEn: {
          theme: "Feelings Blended Slowly, Never Poured All At Once",
          overview: "They are handling this connection with deliberate care — not from indifference, but from a fear that rushing would cost what already exists.",
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
          theme: "ถ้วยใบใหม่ที่เพิ่งถูกเทจนล้น",
          overview: "หัวใจของคุณกำลังกลับมาพร้อมรักอีกครั้ง ไม่ว่าจะเป็นคนใหม่ที่เข้ามา หรือความรู้สึกเดิมที่ได้น้ำหล่อเลี้ยงใหม่ จังหวะนี้คือจังหวะของการเปิดใจ",
          currentSituation: "ไพ่ Ace of Cups บ่งบอกถึงหัวใจที่พร้อมจะรักอีกครั้ง มีโอกาสที่จะพบเจอคนที่เข้ากันได้ดี หรือความสัมพันธ์เดิมจะกลับมาหวานชื่น",
          hiddenLayer: "ไพ่ Two of Wands ชี้ว่าอีกไม่นานคุณหรือเขาจะต้องมองการณ์ไกล วางแผนร่วมกัน เช่น การย้ายมาอยู่ใกล้กัน หรือการตกลงเรื่องอนาคต",
          oracleAdvice: "ไพ่ Ten of Cups สัญญาณแห่งความสมบูรณ์แบบทางอารมณ์ คุณจะพบความสงบในใจและความรักที่ตอบสนองความต้องการของกันและกันได้อย่างลงตัว",
          affirmation: "ฉันพร้อมเปิดรับความรักที่อบอุ่น มั่นคง และเปี่ยมสุข",
        },
        readingEn: {
          theme: "A Fresh Cup Filled To The Brim",
          overview: "Your heart is ready to love again — through someone new, or through old feelings finally being watered. This is a season for opening up.",
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
          theme: "ช่วงพักรบที่จำเป็นก่อนจะก้าวต่อ",
          overview: "ทิศทางความรักของคุณเริ่มที่การพักใจ ไม่ใช่การรีบหาคำตอบ ยิ่งวางความกังวลลงได้เร็วเท่าไร ความชัดเจนก็มาถึงเร็วขึ้นเท่านั้น",
          currentSituation: "ไพ่ Four of Swords แนะนำให้หยุดความขัดแย้ง พักผ่อน และไม่เอาใจไปผูกไว้กับความกังวล การเว้นระยะจะช่วยให้มองเห็นความจริงได้ชัดเจนขึ้น",
          hiddenLayer: "ไพ่ Strength เผยถึงพลังใจอันเงียบสงบที่สามารถเอาชนะความเกรี้ยวกราดหรือความเอาแต่ใจได้ด้วยความเมตตาและความอ่อนโยน",
          oracleAdvice: "ไพ่ Three of Wands สรุปว่าเรือแห่งโอกาสกำลังแล่นเข้ามา หลังผ่านช่วงปรับตัว คุณจะได้ขยายขอบฟ้าความรัก อาจเป็นการเดินทางร่วมกันหรือพบรักจากต่างแดน",
          affirmation: "ความสงบนิ่งคือพลังที่ยิ่งใหญ่ที่สุดของฉันในการนำพาความรักที่ดีเข้ามา",
        },
        readingEn: {
          theme: "The Ceasefire Your Heart Needs Before Moving On",
          overview: "Your love life begins with rest, not with hunting for answers. The sooner the worrying is set down, the sooner clarity arrives.",
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
          theme: "กงล้อที่เพิ่งขยับ หลังหยุดนิ่งมานาน",
          overview: "จังหวะชีวิตกำลังเปลี่ยนมือ เรื่องที่เคยติดขัดจะเริ่มคลายตัว และความบังเอิญที่มีความหมายจะพาคนหรือโอกาสเข้ามาโดยที่คุณไม่ได้ออกแรงตาม",
          currentSituation: "ไพ่ Wheel of Fortune ชี้ว่าจังหวะเวลาแห่งการเปลี่ยนแปลงมาถึงแล้ว อะไรที่เคยติดขัดจะเริ่มคลายตัว เหตุการณ์บังเอิญที่มีความหมายจะเกิดขึ้น",
          hiddenLayer: "ไพ่ Three of Pentacles แสดงถึงการร่วมมือ การรับฟัง และการทำงานเป็นทีมในความสัมพันธ์ ทั้งสองฝ่ายจะเห็นคุณค่าของกันและกันในการสร้างรากฐาน",
          oracleAdvice: "ไพ่ Ten of Pentacles ผลลัพธ์สูงสุดของความมั่นคงทางชีวิต ทั้งเรื่องครอบครัว ฐานะ และความสัมพันธ์ที่ได้รับความยินยอมพร้อมใจจากทุกฝ่าย",
          affirmation: "ฉันไว้วางใจจังหวะเวลาของชีวิต และเปิดรับคนที่เข้ามาอย่างถูกที่ถูกเวลา",
        },
        readingEn: {
          theme: "A Wheel Turning After A Long Standstill",
          overview: "Your timing is changing hands. What felt stuck starts loosening, and meaningful coincidences bring people or openings without you chasing them.",
          currentSituation: "Wheel of Fortune heralds an inexorable turning point. Stagnant dilemmas untangle as serendipity takes the helm.",
          hiddenLayer: "Three of Pentacles emphasizes cooperative devotion. Mutual respect and complementary strengths establish a formidable foundation.",
          oracleAdvice: "Ten of Pentacles manifests lasting security, familial blessings, and multi-dimensional wealth.",
          affirmation: "I trust the timing of my life and welcome whoever arrives at the right moment.",
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
          theme: "ความจริงที่กำลังจะถูกวางบนตาชั่ง",
          overview: "สิ่งที่เคยคลุมเครือกำลังจะได้คำตอบที่ตรงไปตรงมา ความสัมพันธ์ข้างหน้าของคุณจะตั้งอยู่บนความชัดเจน ไม่ใช่การเดาใจกันอีกต่อไป",
          currentSituation: "ไพ่ Justice ยืนยันถึงผลของการกระทำ ความจริงจะปรากฏ คุณจะได้รับความยุติธรรมและความกระจ่างในเรื่องที่เคยสงสัย",
          hiddenLayer: "ไพ่ Eight of Cups แสดงถึงการกล้าเดินออกมาจากสิ่งที่ไม่อาจเติมเต็มจิตวิญญาณได้ เป็นการจากลาด้วยความเข้าใจ ไม่ใช่ด้วยความเคียดแค้น",
          oracleAdvice: "ไพ่ The Star ดวงดาวแห่งความหวังและการเยียวยา หลังจากคลื่นลมสงบ คุณจะพบกับความรักที่มอบแรงบันดาลใจและเยียวยาหัวใจได้อย่างอัศจรรย์",
          affirmation: "ฉันกล้าปล่อยมือจากสิ่งที่ไม่คู่ควร เพื่อเปิดทางให้ความรักที่ตรงไปตรงมาเข้ามาแทน",
        },
        readingEn: {
          theme: "The Truth About To Be Weighed Openly",
          overview: "What was blurred is about to be answered plainly. The relationship ahead of you rests on clarity, not on guessing each other's minds.",
          currentSituation: "Justice ensures truth will reign. Ambiguities evaporate, delivering overdue resolution and moral fairness.",
          hiddenLayer: "Eight of Cups depicts courageous departure from emotional stagnation, walking away in dignified serenity rather than malice.",
          oracleAdvice: "The Star bestows celestial reassurance and radiant renewal. Following this threshold, profound spiritual love heals every ache.",
          affirmation: "I release what does not honour me, making room for love that is honest and plain.",
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
          theme: "ฝีมือที่สั่งสมทีละวัน จนเริ่มเห็นผล",
          overview: "ตอนนี้คุณอยู่ในช่วงลงแรงอย่างประณีต งานที่ทำเงียบ ๆ กำลังสะสมเป็นความน่าเชื่อถือที่คนรอบตัวเริ่มมองเห็นแล้ว",
          currentSituation: "ไพ่ Eight of Pentacles สะท้อนถึงการฝึกฝนความเชี่ยวชาญ คุณกำลังทำงานหนักและมีความประณีต ผลงานของคุณมีคุณภาพเป็นที่ประจักษ์",
          hiddenLayer: "ไพ่ Eight of Wands ชี้ว่าข่าวสารหรือการตอบรับจะเข้ามาอย่างรวดเร็ว การติดต่องานหรือข้อเสนอใหม่ ๆ จะถาโถมเข้ามาในเวลาอันสั้น",
          oracleAdvice: "ไพ่ Nine of Pentacles บ่งบอกถึงความมั่งคั่งและความภาคภูมิใจ คุณจะสามารถยืนหยัดบนลำแข้งของตนเองได้อย่างสง่างามและมีอิสรภาพทางการเงิน",
          affirmation: "ความมุ่งมั่นและทักษะของฉัน กำลังนำพาความมั่งคั่งที่ยั่งยืนเข้ามาสู่ชีวิต",
        },
        readingEn: {
          theme: "Craft Built Day By Day, Now Starting To Show",
          overview: "You are in a season of precise, patient effort. The quiet work is compounding into credibility that people around you are beginning to notice.",
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
          theme: "ถึงเวลาวางโครงสร้างให้ชีวิตการงาน",
          overview: "ก้าวต่อไปของคุณต้องการเป้าหมายที่ชัด กติกาที่แน่นอน และการคุมเกมด้วยตัวเอง มากกว่าการรอให้สถานการณ์พาไป",
          currentSituation: "ไพ่ The Emperor ชี้ถึงความจำเป็นในการตั้งเป้าหมายที่ชัดเจน ใช้กฎเกณฑ์ วางแผนอย่างมีกลยุทธ์ และคุมทีมหรือตนเองให้อยู่ในระเบียบ",
          hiddenLayer: "ไพ่ Six of Swords บอกว่าคุณกำลังแล่นเรือออกจากปัญหาเดิม ๆ การเปลี่ยนสถานที่ทำงาน หรือการย้ายสายงานจะนำความสงบมาให้",
          oracleAdvice: "ไพ่ The Chariot สรุปว่าชัยชนะอยู่ไม่ไกล จงกุมบังเหียนของชีวิตให้มั่นคง ไม่ว่าจะเจอกับแรงเสียดทานใด ความตั้งใจจริงจะพาคุณเข้าเส้นชัย",
          affirmation: "ฉันเป็นผู้นำชีวิตของตนเอง ความมุ่งมั่นและวินัยคือเส้นทางสู่ความสำเร็จของฉัน",
        },
        readingEn: {
          theme: "Time To Build Structure Around Your Work Life",
          overview: "Your next step asks for clear targets, firm rules, and you holding the reins — rather than letting circumstances decide the pace.",
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
          theme: "ประกายไฟของงานใหม่ที่เพิ่งจุดติด",
          overview: "มีไอเดียหรือโอกาสที่ทำให้คุณใจเต้นอีกครั้ง จังหวะนี้เหมาะกับการเริ่มลงมือ มากกว่าการรอให้ทุกอย่างพร้อมร้อยเปอร์เซ็นต์",
          currentSituation: "ไพ่ Ace of Wands ไฟแห่งการเริ่มต้น โอกาสใหม่ ไอเดียธุรกิจ หรือโปรเจกต์ที่คุณรู้สึกตื่นเต้นที่จะได้ลงมือทำ",
          hiddenLayer: "ไพ่ The Empress พลังแห่งการเติบโตและความอุดมสมบูรณ์ โปรเจกต์นี้มีศักยภาพในการทำกำไรสูงและจะได้รับการดูแลเอาใจใส่อย่างดี",
          oracleAdvice: "ไพ่ Four of Pentacles แนะนำให้บริหารจัดการรายรับรายจ่ายอย่างรัดกุม เมื่อหาเงินได้มากก็ต้องรู้จักเก็บออมเพื่อสร้างความมั่นคงระยะยาว",
          affirmation: "ไอเดียของฉันมีคุณค่าและสามารถสร้างความเจริญรุ่งเรืองให้กับชีวิตได้อย่างไม่จำกัด",
        },
        readingEn: {
          theme: "The Spark Of New Work Just Catching Fire",
          overview: "An idea or opening has your pulse up again. This is a season for starting, not for waiting until every condition is perfect.",
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
          theme: "การถอยออกมาหาคำตอบให้ตัวเองก่อน",
          overview: "ก่อนจะขยับไปไหน คุณต้องการความเงียบเพื่อดูว่างานแบบไหนคุ้มกับเวลาชีวิตจริง ๆ ช่วงนี้การทบทวนมีค่ากว่าการวิ่งตามกระแส",
          currentSituation: "ไพ่ The Hermit สะท้อนการหันกลับมาทบทวนตนเอง คุณอาจต้องการความเงียบเพื่อวางแผนระยะยาวมากกว่าการวิ่งตามกระแสสังคม",
          hiddenLayer: "ไพ่ Ace of Swords ความคิดที่แจ่มแจ้งและการฟันธง ความลังเลจะหมดไป คุณจะตัดสิ่งที่ไม่จำเป็นออกและมองเห็นทางออกที่เฉียบคม",
          oracleAdvice: "ไพ่ The World การปิดฉากวัฏจักรเก่าอย่างสมบูรณ์แบบเพื่อขึ้นสู่เวทีใหม่ที่ยิ่งใหญ่กว่าเดิม ความสำเร็จของคุณจะได้รับการยอมรับในระดับกว้าง",
          affirmation: "เมื่อฉันเดินตามแสงสว่างภายใน โลกทั้งใบจะเปิดทางให้ฉันประสบความสำเร็จอย่างงดงาม",
        },
        readingEn: {
          theme: "Stepping Back To Find Your Own Answer First",
          overview: "Before moving anywhere, you need quiet to see which work is actually worth your life's hours. Reflection is worth more than chasing trends now.",
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
          theme: "จังหวะที่จักรวาลขอให้คุณหยุดฝืน",
          overview: "สิ่งที่รู้สึกเหมือนชีวิตหยุดนิ่ง จริง ๆ แล้วคือช่วงที่ให้คุณกลับหัวมองใหม่ ยิ่งเลิกดันให้ทุกอย่างเป็นดั่งใจ คำตอบจะยิ่งโผล่ขึ้นมาเอง",
          currentSituation: "ไพ่ The Hanged Man บอกว่าอย่าฝืนกระแสน้ำ บางครั้งการหยุดนิ่งและมองโลกจากมุมมองใหม่จะช่วยให้คุณเห็นทางออกที่ไม่เคยคิดถึง",
          hiddenLayer: "ไพ่ The Fool การก้าวกระโดดด้วยความไว้วางใจ อย่ากลัวที่จะเป็นมือใหม่อีกครั้ง การทิ้งสัมภาระเก่า ๆ จะทำให้คุณเบาสบายและบินได้สูงขึ้น",
          oracleAdvice: "ไพ่ Nine of Cups ไพ่แห่งความสมปรารถนา (Wish Card) สิ่งที่คุณแอบหวังไว้ในใจกำลังจะกลายเป็นจริง ขอให้เชื่อมั่นในคุณค่าของตนเอง",
          affirmation: "ฉันปล่อยวางอดีตด้วยรอยยิ้ม และพร้อมก้าวสู่การผจญภัยครั้งใหม่ด้วยความเบิกบาน",
        },
        readingEn: {
          theme: "The Moment The Universe Asks You To Stop Forcing",
          overview: "What feels like life standing still is really an invitation to see it from upside down. The less you force, the faster the answer surfaces.",
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
          theme: "กำแพงที่พังลง เพราะรากฐานมันไม่จริง",
          overview: "เรื่องที่สะเทือนใจเมื่อเร็ว ๆ นี้ไม่ใช่การลงโทษ แต่เป็นการรื้อสิ่งที่ไม่มั่นคงออก ก่อนที่คุณจะเผลอสร้างของจริงทับลงไปบนรากที่ทรุด",
          currentSituation: "ไพ่ The Tower กำแพงที่สร้างบนรากฐานที่ไม่แข็งแรงต้องพังทลายลง แม้จะรู้สึกตกใจ แต่คุณจะได้หลุดพ้นจากพันธนาการที่ขังคุณไว้",
          hiddenLayer: "ไพ่ Death การสิ้นสุดของบทเรียนเดิม ดักแด้กำลังจะกลายเป็นผีเสื้อ สิ่งที่จากไปจะถูกแทนที่ด้วยสิ่งที่ดีกว่าเดิมอย่างเทียบไม่ได้",
          oracleAdvice: "ไพ่ The Sun แสงสว่าง ความสุข และความสำเร็จอันยิ่งใหญ่รอคุณอยู่ข้างหน้า ฟ้าหลังฝนนี้จะงดงามและสดใสที่สุดในชีวิตของคุณ",
          affirmation: "ทุกการเปลี่ยนแปลงที่เกิดขึ้นในชีวิต ล้วนนำพาฉันไปสู่เวอร์ชันที่ดีที่สุดเสมอ",
        },
        readingEn: {
          theme: "A Wall Coming Down Because Its Foundation Was False",
          overview: "The recent shock was not punishment. It tore down what was never stable, before you built something real on a sinking foundation.",
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
          theme: "แผลที่ต้องยอมรู้สึกก่อน ถึงจะหาย",
          overview: "จักรวาลไม่ได้ขอให้คุณเข้มแข็งตลอดเวลา ช่วงนี้อนุญาตให้ตัวเองเสียใจได้เต็มที่ แล้วค่อยเก็บบทเรียนทีหลังก็ยังทัน",
          currentSituation: "ไพ่ Three of Swords ความเจ็บปวดที่ต้องยอมรับความจริง อนุญาตให้ตัวเองได้ร้องไห้และปลดปล่อยความเสียใจออกมาอย่างเต็มที่",
          hiddenLayer: "ไพ่ The Star น้ำทิพย์ชโลมใจและการเยียวยา คุณจะเริ่มมองเห็นความหวัง และพบว่าชีวิตยังมีแง่มุมที่งดงามรออยู่อีกมากมาย",
          oracleAdvice: "ไพ่ Nine of Wands คุณผ่านศึกหนักมาจนถึงด่านสุดท้ายแล้ว อย่าเพิ่งยอมแพ้ ความอดทนและความเข้มแข็งของคุณจะพาคุณข้ามเส้นชัยได้อย่างปลอดภัย",
          affirmation: "หัวใจของฉันได้รับการเยียวยาในทุก ๆ วัน ฉันเข้มแข็งและงดงามขึ้นเสมอ",
        },
        readingEn: {
          theme: "A Wound That Must Be Felt Before It Heals",
          overview: "The universe is not asking you to be strong around the clock. Let yourself grieve fully first; the lesson can be collected later.",
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
          theme: "เสียงข้างในที่ดังกว่าเสียงรอบตัว",
          overview: "สัญชาตญาณของคุณตอนนี้คมกว่าที่คิด คำตอบที่ตามหาไม่ได้อยู่ในคำแนะนำของใคร แต่อยู่ในความเงียบของคุณเอง",
          currentSituation: "ไพ่ The High Priestess จงเชื่อมั่นในสัญชาตญาณแรกของคุณ คำตอบไม่ได้อยู่ข้างนอก แต่อยู่ในความเงียบสงบภายในใจคุณเอง",
          hiddenLayer: "ไพ่ The Hierophant ความรู้ ภูมิปัญญาโบราณ หรือครูบาอาจารย์กำลังจะเข้ามาให้คำแนะนำ การศึกษาหาความรู้เพิ่มเติมจะช่วยยกระดับจิตใจ",
          oracleAdvice: "ไพ่ Judgement เสียงแตรปลุกแห่งการคืนชีพ คุณกำลังได้รับการชำระล้างบาปเคราะห์ในอดีต และเกิดใหม่เป็นตัวคุณที่เปี่ยมไปด้วยปัญญาและความสุข",
          affirmation: "ฉันไว้วางใจในเสียงกระซิบของจิตวิญญาณ และพร้อมตอบรับการตื่นรู้ของชีวิต",
        },
        readingEn: {
          theme: "The Voice Inside That Is Louder Than The Noise",
          overview: "Your intuition is sharper than you think right now. The answer you are hunting is not in anyone's advice — it is in your own quiet.",
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
