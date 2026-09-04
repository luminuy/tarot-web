/**
 * 👀 Spatial Gaze & Posture Dialogue Engine
 * -----------------------------------------
 * ถอดรหัสทิศทางสายตาและภาษากายของตัวละครบนหน้าไพ่ 1909 Pamela Colman Smith
 * เพื่อวิเคราะห์ "บทสนทนาทางสายตา" (Gaze Dialogue) ระหว่างไพ่ที่วางข้างกันในผัง
 */

import type { TarotCard } from "@/data/cards";

export type GazeDirection =
  | "left" // มองซ้าย: อดีต, ความทรงจำ, การทบทวน, สิ่งที่ผ่านไปแล้ว
  | "right" // มองขวา: อนาคต, ก้าวต่อไป, การลงมือทำ, ความหวัง
  | "center" // มองตรง: เผชิญหน้าความจริงปัจจุบัน, ความซื่อสัตย์, การตัดสินใจ
  | "down" // ก้มหน้า: จมกับอารมณ์, จิตใต้สำนึก, ความเศร้า, การทบทวนภายใน
  | "up" // เงยหน้า: ศรัทธา, จินตนาการ, ความฝัน, การเชื่อมโยงจิตวิญญาณ
  | "hidden"; // ปิดตา/ไร้ใบหน้า: การหลีกเลี่ยงความจริง, สัญชาตญาณล้วนๆ

export type PostureType =
  | "seated" // นั่ง: อำนาจ, สมาธิ, ความมั่นคง, ความนิ่ง
  | "standing" // ยืน: การเตรียมพร้อม, การยืนหยัด, การสังเกต
  | "moving" // เคลื่อนไหว: การเดินทาง, การเปลี่ยนแปลง, การบุกเบิก
  | "fallen" // นอน/ล้ม: วิกฤต, การพักฟื้น, การยอมจำนน
  | "symbolic"; // ไร้ตัวบุคคล: พลังงานเชิงนามธรรมบริสุทธิ์

export interface CardGazeMetadata {
  gaze: GazeDirection;
  posture: PostureType;
  descriptionTh: string;
}

// ฐานข้อมูลทิศทางสายตาและภาษากายของไพ่ 78 ใบ (ฉบับ 1909 Rider-Waite)
const GAZE_REGISTRY: Record<string, CardGazeMetadata> = {
  // Major Arcana (22)
  "major-00": { gaze: "up", posture: "moving", descriptionTh: "ก้าวเดินริมหน้าผา แหงนมองฟ้าอย่างเปี่ยมศรัทธา" },
  "major-01": { gaze: "center", posture: "standing", descriptionTh: "ชี้ฟ้าชี้นิ้วลงดิน สายตามองตรงอย่างมั่นใจ" },
  "major-02": { gaze: "center", posture: "seated", descriptionTh: "นั่งนิ่งระหว่างเสาดำขาว สายตามองตรงหยั่งรู้" },
  "major-03": { gaze: "left", posture: "seated", descriptionTh: "เอนกายบนเบาะนุ่ม ทอดสายตาไปทางซ้ายอย่างอ่อนโยน" },
  "major-04": { gaze: "left", posture: "seated", descriptionTh: "นั่งบนบัลลังก์หิน สายตามองไปทางซ้ายอย่างเด็ดขาด" },
  "major-05": { gaze: "center", posture: "seated", descriptionTh: "นั่งประสานสายตาสั่งสอนศิษย์ที่หมอบอยู่เบื้องล่าง" },
  "major-06": { gaze: "up", posture: "standing", descriptionTh: "หญิงสาวมองเทวทูตบนฟ้า ชายหนุ่มมองหญิงสาว" },
  "major-07": { gaze: "center", posture: "standing", descriptionTh: "ยืนบนราชรถ สายตามุ่งมั่นมองตรงไปข้างหน้า" },
  "major-08": { gaze: "down", posture: "standing", descriptionTh: "โน้มตัวลงลูบคางสิงโตด้วยสายตาเปี่ยมเมตตา" },
  "major-09": { gaze: "down", posture: "standing", descriptionTh: "ยืนบนยอดเขา ก้มมองตะเกียงส่องทางในความมืด" },
  "major-10": { gaze: "center", posture: "symbolic", descriptionTh: "สฟิงซ์บนยอดกงล้อจ้องมองตรงอย่างเป็นกลาง" },
  "major-11": { gaze: "center", posture: "seated", descriptionTh: "ถือดาบและตราชั่ง สายตามองตรงอย่างเที่ยงธรรม" },
  "major-12": { gaze: "center", posture: "fallen", descriptionTh: "ห้อยหัวอย่างสงบ สายตามองตรงด้วยมุมมองใหม่" },
  "major-13": { gaze: "left", posture: "moving", descriptionTh: "อัศวินขี่ม้าหันมองไปทางซ้ายสู่ผู้คนที่จำนน" },
  "major-14": { gaze: "down", posture: "standing", descriptionTh: "เทวทูตหลุบตามองสายน้ำที่ถ่ายเทระหว่างสองถ้วย" },
  "major-15": { gaze: "center", posture: "seated", descriptionTh: "ปีศาจบนแท่นหิน จ้องมองตรงมาสะกดจิตผู้ดู" },
  "major-16": { gaze: "down", posture: "fallen", descriptionTh: "ผู้คนร่วงหล่นจากหอคอย สายตามองลงสู่พื้นดิน" },
  "major-17": { gaze: "down", posture: "standing", descriptionTh: "หญิงสาวคุกเข่าเทน้ำ สายตามองลงสู่สายน้ำและผืนดิน" },
  "major-18": { gaze: "up", posture: "symbolic", descriptionTh: "สุนัขและหมาป่าเงยหน้าหอนสู่ดวงจันทร์บนฟ้า" },
  "major-19": { gaze: "center", posture: "moving", descriptionTh: "เด็กน้อยบนม้าขาว สายตามองตรงด้วยรอยยิ้มเบิกบาน" },
  "major-20": { gaze: "up", posture: "standing", descriptionTh: "ผู้คนผุดจากหลุมศพ เงยหน้ามองเสียงแตรแห่งสัจธรรม" },
  "major-21": { gaze: "center", posture: "moving", descriptionTh: "หญิงสาวร่ายรำในพวงหรีด สายตามองตรงสู่ความสมบูรณ์" },

  // Wands (14)
  "wands-01": { gaze: "right", posture: "symbolic", descriptionTh: "มือแห่งสวรรค์ยื่นไม้เท้าที่ผลิยอดไปทางขวา" },
  "wands-02": { gaze: "right", posture: "standing", descriptionTh: "ยืนบนกำแพงปราสาท ถือลูกโลกทอดสายตามองไปทางขวา" },
  "wands-03": { gaze: "right", posture: "standing", descriptionTh: "หันหลังให้ผู้ดู สายตามองข้ามทะเลไปทางขวาสู่อนาคต" },
  "wands-04": { gaze: "center", posture: "standing", descriptionTh: "ผู้คนชูช่อดอกไม้หันหน้าฉลองตรงมายังผู้ดู" },
  "wands-05": { gaze: "center", posture: "moving", descriptionTh: "ชายหนุ่ม 5 คนต่อสู้ประลองไม้ สายตาปะทะกันชุลมุน" },
  "wands-06": { gaze: "right", posture: "moving", descriptionTh: "อัศวินขี่ม้าอย่างสง่างาม สายตามองไปข้างหน้าทางขวา" },
  "wands-07": { gaze: "down", posture: "standing", descriptionTh: "ยืนบนเนินสูง ก้มหน้าตั้งรับการโจมตีจากเบื้องล่าง" },
  "wands-08": { gaze: "right", posture: "symbolic", descriptionTh: "ไม้เท้า 8 ท่อนพุ่งทะยานข้ามฟ้าไปทางขวาอย่างรวดเร็ว" },
  "wands-09": { gaze: "left", posture: "standing", descriptionTh: "ยืนพิงไม้เท้า พันผ้าที่ศีรษะ สายตาระแวงมองไปทางซ้าย" },
  "wands-10": { gaze: "down", posture: "moving", descriptionTh: "ก้มหน้าก้มตาแบกไม้เท้า 10 ท่อนหนักอึ้งเข้าสู่เมือง" },
  "wands-11": { gaze: "up", posture: "standing", descriptionTh: "ถือไม้เท้า สายตาแหงนมองยอดไม้อย่างใคร่รู้" },
  "wands-12": { gaze: "right", posture: "moving", descriptionTh: "ม้าศึกพยศ อัศวินพุ่งทะยานไปทางขวาอย่างร้อนแรง" },
  "wands-13": { gaze: "center", posture: "seated", descriptionTh: "นั่งถือดอกทานตะวัน สายตามองตรงอย่างอบอุ่นมั่นใจ" },
  "wands-14": { gaze: "left", posture: "seated", descriptionTh: "นั่งบนบัลลังก์สิงโต สายตามองไปทางซ้ายอย่างเฉียบคม" },

  // Cups (14)
  "cups-01": { gaze: "down", posture: "symbolic", descriptionTh: "มือสวรรค์รองรับถ้วยน้ำพุหลั่งรินลงสู่ใบบัว" },
  "cups-02": { gaze: "center", posture: "standing", descriptionTh: "ชายหญิงยืนสบตากันตรง ๆ แลกเปลี่ยนถ้วยแห่งความรัก" },
  "cups-03": { gaze: "up", posture: "moving", descriptionTh: "หญิงสาว 3 คนเต้นรำ เงยหน้าชูถ้วยเฉลิมฉลองด้วยกัน" },
  "cups-04": { gaze: "down", posture: "seated", descriptionTh: "นั่งกอดอกใต้ต้นไม้ ก้มมองถ้วย 3 ใบ เมินถ้วยที่ยื่นมา" },
  "cups-05": { gaze: "down", posture: "standing", descriptionTh: "คลุมผ้าดำ ก้มมองถ้วยที่ล้ม 3 ใบ ละเลย 2 ใบด้านหลัง" },
  "cups-06": { gaze: "down", posture: "standing", descriptionTh: "เด็กชายก้มมองเด็กหญิงอย่างอบอุ่น ยื่นถ้วยดอกไม้ให้" },
  "cups-07": { gaze: "up", posture: "standing", descriptionTh: "หันหลังยืนมองขึ้นไปยังภาพมายา 7 ถ้วยในก้อนเมฆ" },
  "cups-08": { gaze: "right", posture: "moving", descriptionTh: "หันหลังเดินขึ้นเขา ละทิ้งถ้วย 8 ใบก้าวสู่ความสงบ" },
  "cups-09": { gaze: "center", posture: "seated", descriptionTh: "นั่งกอดอก ยิ้มอย่างพึงพอใจโดยมี 9 ถ้วยเรียงด้านหลัง" },
  "cups-10": { gaze: "up", posture: "standing", descriptionTh: "คู่รักโอบกอด ชูมือแหงนมองสายรุ้ง 10 ถ้วยบนฟ้า" },
  "cups-11": { gaze: "down", posture: "standing", descriptionTh: "ถือถ้วย ก้มมองปลาตัวน้อยที่โผล่ขึ้นมาอย่างประหลาดใจ" },
  "cups-12": { gaze: "right", posture: "moving", descriptionTh: "ขี่ม้าอย่างสุขุม ยื่นถ้วยไปข้างหน้าทางขวาด้วยความฝัน" },
  "cups-13": { gaze: "down", posture: "seated", descriptionTh: "นั่งริมทะเล จ้องมองถ้วยประดับเพชรด้วยความลุ่มลึก" },
  "cups-14": { gaze: "left", posture: "seated", descriptionTh: "นั่งบนบัลลังก์กลางทะเล สายตามองทอดไปทางซ้ายอย่างสุขุม" },

  // Swords (14)
  "swords-01": { gaze: "up", posture: "symbolic", descriptionTh: "มือสวรรค์ชูดาบยอดมงกุฎขึ้นสู่ท้องฟ้าอย่างเที่ยงตรง" },
  "swords-02": { gaze: "hidden", posture: "seated", descriptionTh: "ผูกผ้าปิดตา ถือดาบไขว้อก ปิดกั้นการรับรู้ภายนอก" },
  "swords-03": { gaze: "down", posture: "symbolic", descriptionTh: "หัวใจถูกแทงด้วยดาบ 3 เล่ม ท่ามกลางฝนตกกระหน่ำ" },
  "swords-04": { gaze: "down", posture: "fallen", descriptionTh: "อัศวินนอนพนมมือสงบนิ่งบนแท่น พักรบฟื้นฟูจิตใจ" },
  "swords-05": { gaze: "left", posture: "standing", descriptionTh: "ยิ้มเยาะเก็บดาบ สายตาเหลือบมองผู้แพ้ที่เดินจากไปทางซ้าย" },
  "swords-06": { gaze: "down", posture: "moving", descriptionTh: "นั่งก้มหน้าบนเรือข้ามฟาก มุ่งหน้าจากน้ำเชี่ยวสู่น้ำนิ่ง" },
  "swords-07": { gaze: "left", posture: "moving", descriptionTh: "ย่องถือดาบ 5 เล่มหนีไปทางขวา แต่เหลียวหลังมองซ้าย" },
  "swords-08": { gaze: "hidden", posture: "standing", descriptionTh: "ถูกมัดและปิดตา ล้อมรอบด้วยดาบ 8 เล่มในหล่มโคลน" },
  "swords-09": { gaze: "hidden", posture: "seated", descriptionTh: "นั่งเอามือปิดหน้าร้องไห้บนเตียง ท่ามกลางดาบ 9 เล่มในความมืด" },
  "swords-10": { gaze: "down", posture: "fallen", descriptionTh: "นอนคว่ำหน้าถูกดาบ 10 เล่มปักหลัง พระอาทิตย์เริ่มทอแสงขอบฟ้า" },
  "swords-11": { gaze: "left", posture: "standing", descriptionTh: "ถือดาบสองมืออย่างระแวดระวัง สายตาเหลียวมองไปทางซ้าย" },
  "swords-12": { gaze: "left", posture: "moving", descriptionTh: "ควบม้าพุ่งทะยานฟันดาบไปทางซ้ายอย่างดุดันไม่กลัวใคร" },
  "swords-13": { gaze: "right", posture: "seated", descriptionTh: "นั่งบนบัลลังก์ มือขวาชูดาบตรง มือซ้ายยื่นออกไปทางขวา" },
  "swords-14": { gaze: "center", posture: "seated", descriptionTh: "นั่งบนบัลลังก์ถือดาบ สายตาจ้องตรงอย่างเฉียบขาดไร้ความลำเอียง" },

  // Pentacles (14)
  "pentacles-01": { gaze: "center", posture: "symbolic", descriptionTh: "มือสวรรค์ยื่นเหรียญทองคำเหนือสวนดอกไม้อุดมสมบูรณ์" },
  "pentacles-02": { gaze: "down", posture: "moving", descriptionTh: "ร่ายรำเลี้ยงเหรียญในสัญลักษณ์อินฟินิตี้ สายตามองสลับไปมา" },
  "pentacles-03": { gaze: "up", posture: "standing", descriptionTh: "ช่างสลักแหงนมองแบบงาน ปรึกษากับพระและสถาปนิก" },
  "pentacles-04": { gaze: "center", posture: "seated", descriptionTh: "นั่งกอดเหรียญแน่น สายตามองตรงอย่างหวงแหนกลัวสูญเสีย" },
  "pentacles-05": { gaze: "down", posture: "moving", descriptionTh: "คนบาดเจ็บเดินฝ่าหิมะ ก้มหน้ามองพื้น ละเลยแสงไฟในโบสถ์" },
  "pentacles-06": { gaze: "down", posture: "standing", descriptionTh: "พ่อค้าถือตราชั่ง ก้มมองผู้ยากไร้และโปรยเหรียญให้" },
  "pentacles-07": { gaze: "down", posture: "standing", descriptionTh: "ยืนพิงจอบ ก้มมองพืชผลที่เพาะปลูกด้วยความอดทนรอคอย" },
  "pentacles-08": { gaze: "down", posture: "seated", descriptionTh: "นั่งก้มหน้าตั้งใจสลักเหรียญอย่างประณีตและมีสมาธิ" },
  "pentacles-09": { gaze: "left", posture: "standing", descriptionTh: "หญิงสาวในสวนองุ่น สายตามองทอดไปทางซ้ายอย่างสุขสงบ" },
  "pentacles-10": { gaze: "center", posture: "seated", descriptionTh: "ชายชรานั่งเล่นกับสุนัขหน้าซุ้มประตูครอบครัวอบอุ่น" },
  "pentacles-11": { gaze: "up", posture: "standing", descriptionTh: "ประคองเหรียญในมือ แหงนมองเหรียญด้วยความตั้งใจเรียนรู้" },
  "pentacles-12": { gaze: "right", posture: "standing", descriptionTh: "นั่งนิ่งบนม้าดำ ถือเหรียญมองไปข้างหน้าอย่างอดทนรอบคอบ" },
  "pentacles-13": { gaze: "down", posture: "seated", descriptionTh: "นั่งบนบัลลังก์กลางธรรมชาติ ก้มมองเหรียญทองอย่างทะนุถนอม" },
  "pentacles-14": { gaze: "left", posture: "seated", descriptionTh: "นั่งบนบัลลังก์วัวกระทิง สายตามองไปทางซ้ายอย่างมั่งคั่งและภูมิฐาน" },
};

export interface PairGazeInteraction {
  cardA: string;
  cardB: string;
  relation: "face-to-face" | "back-to-back" | "shared-vision" | "introspective" | "blindfolded";
  narrativeTh: string;
}

export interface GazeDialogueAnalysis {
  cardGazes: Array<{ cardName: string; gaze: GazeDirection; description: string }>;
  interactions: PairGazeInteraction[];
  dialogueNarrative: string;
}

/**
 * วิเคราะห์ความสัมพันธ์ทางสายตาระหว่างไพ่ที่เปิดได้
 */
export function analyzeSpatialGazeDialogue(cards: TarotCard[]): GazeDialogueAnalysis {
  const cardGazes: Array<{ cardName: string; gaze: GazeDirection; description: string }> = [];

  for (const card of cards) {
    const meta = GAZE_REGISTRY[card.id] || {
      gaze: "center",
      posture: "standing",
      descriptionTh: "สายตามองตรง",
    };
    cardGazes.push({
      cardName: card.nameTh,
      gaze: meta.gaze,
      description: meta.descriptionTh,
    });
  }

  const interactions: PairGazeInteraction[] = [];

  // วิเคราะห์คู่ไพ่ติดกัน (Adjacent Pairs)
  for (let i = 0; i < cards.length - 1 && interactions.length < 3; i++) {
    const cardA = cards[i];
    const cardB = cards[i + 1];
    const metaA = GAZE_REGISTRY[cardA.id];
    const metaB = GAZE_REGISTRY[cardB.id];

    if (!metaA || !metaB) continue;

    // 1. Blindfolded
    if (metaA.gaze === "hidden" || metaB.gaze === "hidden") {
      const blindCard = metaA.gaze === "hidden" ? cardA.nameTh : cardB.nameTh;
      interactions.push({
        cardA: cardA.nameTh,
        cardB: cardB.nameTh,
        relation: "blindfolded",
        narrativeTh: `การปิดกั้นสายตา: ไพ่ ${blindCard} อยู่ในสภาวะปิดตา/ไม่ยอมมอง บ่งบอกถึงการกลัวที่จะรับรู้ความจริงตรงหน้า`,
      });
      continue;
    }

    // 2. Face-to-Face (A มองขวาไปหา B, B มองซ้ายกลับมาหา A)
    if (metaA.gaze === "right" && metaB.gaze === "left") {
      interactions.push({
        cardA: cardA.nameTh,
        cardB: cardB.nameTh,
        relation: "face-to-face",
        narrativeTh: `การสบสายตากันตรง ๆ: ${cardA.nameTh} กำลังหันหน้าประสานสายตากับ ${cardB.nameTh} โดยตรง สื่อถึงการเผชิญหน้า การพร้อมเปิดอกคุย หรือประเด็นที่หนีไม่พ้น`,
      });
      continue;
    }

    // 3. Back-to-Back (A มองซ้ายหันหลังให้ B, B มองขวาหันหลังให้ A)
    if (metaA.gaze === "left" && metaB.gaze === "right") {
      interactions.push({
        cardA: cardA.nameTh,
        cardB: cardB.nameTh,
        relation: "back-to-back",
        narrativeTh: `การหันหลังให้กัน: ${cardA.nameTh} และ ${cardB.nameTh} กำลังมองไปคนละทิศทาง สื่อถึงความเหินห่าง การหลบเลี่ยง หรือการไม่ยอมรับฟังมุมมองของอีกฝ่าย`,
      });
      continue;
    }

    // 4. Shared Vision (มองไปทางขวาด้วยกันทั้งคู่)
    if (metaA.gaze === "right" && metaB.gaze === "right") {
      interactions.push({
        cardA: cardA.nameTh,
        cardB: cardB.nameTh,
        relation: "shared-vision",
        narrativeTh: `การมองไปข้างหน้าร่วมกัน: ทั้ง ${cardA.nameTh} และ ${cardB.nameTh} ทอดสายตามุ่งไปสู่อนาคตทางขวา พลังงานขับเคลื่อนไปในทิศทางเดียวกัน`,
      });
      continue;
    }

    // 5. Introspective (ก้มหน้ามองต่ำทั้งคู่)
    if (metaA.gaze === "down" && metaB.gaze === "down") {
      interactions.push({
        cardA: cardA.nameTh,
        cardB: cardB.nameTh,
        relation: "introspective",
        narrativeTh: `การดำดิ่งสู่ภายใน: ทั้งสองใบก้มหน้าลงต่ำ สื่อถึงการจมกับอารมณ์ความรู้สึกหรือการใคร่ครวญเงียบๆ ในใจ`,
      });
    }
  }

  // สร้าง Narrative
  const parts: string[] = [];
  if (interactions.length > 0) {
    parts.push(interactions.map((it) => `• ${it.narrativeTh}`).join("\n"));
  } else if (cards.length > 0) {
    const firstMeta = GAZE_REGISTRY[cards[0].id];
    if (firstMeta) {
      parts.push(`• สายตาของไพ่ใบหลัก (${cards[0].nameTh}): ${firstMeta.descriptionTh}`);
    }
  }

  return {
    cardGazes,
    interactions,
    dialogueNarrative: parts.join("\n"),
  };
}
