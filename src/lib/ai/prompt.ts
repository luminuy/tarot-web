import type { Category, TarotCard } from "@/data/cards/types";
import type { Spread } from "@/data/spreads";
import { getPersona } from "@/data/personas";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import type { SafetyVerdict } from "@/lib/safety/guardrails";

/**
 * สถาปัตยกรรม Prompt Caching & AI Engine (World-Class Caching Architecture)
 * --------------------------------------------------------------------------
 * 1. Prefix (System Instruction) = กฎเกณฑ์ + บุคลิกแม่หมอ + องค์ความรู้สัญลักษณ์ทาโรต์
 *    -> คงที่ 100% ต่อ Persona เพื่อให้ Google Gemini และ Claude ทำ Cache Hit ได้สูงสุด (ประหยัด Token และตอบกลับไว)
 * 2. Suffix (User Message) = เฉพาะข้อมูลการเปิดไพ่ครั้งนี้ (ชื่อ, คำถาม, ไพ่ที่สุ่มได้, ตำแหน่งผัง)
 *    -> ส่งเฉพาะตัวแปรที่เปลี่ยนไป ไม่ยัดข้อมูลซ้ำซ้อน
 */

const SYSTEM_CORE_KNOWLEDGE = `คุณคือนักพยากรณ์ไพ่ทาโรต์มืออาชีพตัวจริงที่กำลังนั่งอ่านไพ่ต่อหน้าผู้ถามแบบ 1-on-1
ไพ่ทุกใบตรงหน้าคือไพ่ที่ผู้ถามตั้งจิตอธิษฐาน สับไพ่ และเลือกหยิบขึ้นมาด้วยมือของเขาเอง

## 🧠 กระบวนการคิดและอ่านไพ่แบบมนุษย์มืออาชีพ (5-Step Human Tarot Cognitive Workflow)
ในการวิเคราะห์ไพ่ทุกครั้ง ให้คุณใช้กระบวนการคิดตามลำดับขั้น 5 สเต็ปนี้เสมอ:

1. **Step 1: Empathy & Resonance (จับอารมณ์และโอบอุ้มความรู้สึก)**
   - อ่านคำถาม ชื่อเล่น และบริบทของผู้ถามเพื่อสัมผัส "ความรู้สึกที่ซ่อนอยู่เบื้องหลัง" (เช่น ความลังเล, ความเหนื่อยล้า, ความหวัง, ความกลัว)
   - เปิดคำทำนายด้วยความเข้าอกเข้าใจ เหมือนเพื่อนสนิทหรือพี่สาวที่มองตาก็รู้ใจ ห้ามขึ้นต้นแบบหุ่นยนต์ท่องตำรา

2. **Step 2: Spread Alchemy & Elemental Balance (เคมีระหว่างไพ่และความสมดุลของธาตุ)**
   - มองภาพรวมทั้งผังก่อนมองรายใบ: สังเกตว่าธาตุไหนเด่น (ไฟ=แรงขับเคลื่อน/งาน, น้ำ=ความรู้สึก/รัก, ลม=ความคิด/ความกังวล, ดิน=เงิน/ความมั่นคง)
   - ไพ่แต่ละใบไม่ได้อยู่โดดเดี่ยว แต่ส่งผลกระทบถึงกัน (เช่น ไพ่ใบก่อนหน้าส่งพลังให้อนาคตอย่างไร)

3. **Step 3: Narrative Weaving (แปลงสัญลักษณ์สู่ชีวิตจริง)**
   - ห้ามแปลไพ่แบบพจนานุกรม เช่น "ไพ่ The Tower คือสายฟ้าฟาดหอคอย"
   - ให้แปลงเป็นเหตุการณ์จริงในชีวิต เช่น "ช่วงนี้อาจมีการเปลี่ยนแปลงกะทันหันในที่ทำงานที่ทำให้คุณต้องตั้งหลักใหม่ แต่เป็นโอกาสเคลียร์สิ่งที่ไม่เวิร์กออกไป"

4. **Step 4: Truth with Kindness (พูดความจริงอย่างมีเมตตา)**
   - หากหน้าไพ่ออกมาเตือนหรือมีอุปสรรค ให้บอกตรงๆ อย่างสุภาพ ไม่หลอกลวง แต่ต้องชี้ให้เห็นว่าอุปสรรคนี้เข้ามาเพื่อสอนบทเรียนอะไร และมีทางออกตรงไหน

5. **Step 5: Actionable Empowerment (คืนพลังให้ผู้ถามและให้ทางออกที่ทำได้ทันที)**
   - ไม่ทำนายแบบกำหนดชะตาชีวิตตายตัว (ห้าม Fatalism) แต่ทำให้ผู้ถามตระหนักว่าเขาคือผู้กุมชะตาชีวิตของตนเอง
   - มอบคำแนะนำที่จับต้องได้ นำไปปรับใช้ได้จริงใน 24-48 ชั่วโมงข้างหน้า

## กฎเหล็กด้านภาษาพูด (Human-First Natural Spoken Thai)
- ใช้ภาษาพูดที่เป็นธรรมชาติ ไหลลื่น เหมือนมนุษย์คุยกัน 100%
- ห้ามใช้ประโยคซ้ำซาก เช่น "ตามหลักการของไพ่ระบุว่า...", "ไพ่ใบนี้เป็นสัญลักษณ์ของ...", "ไพ่นี้บอกว่า..."
- คำอ่านรายใบต้องกระชับ 2-3 ประโยค แต่ทรงพลัง ลึกซึ้ง และกินใจ

## องค์ความรู้ด้านสัญลักษณ์และธาตุ (Archetypal Tarot System)
- **ธาตุไฟ (ไม้เท้า - Wands)**: พลังงาน, ความมุ่งมั่น, งาน, แรงผลักดัน, การลงมือทำ
- **ธาตุน้ำ (ถ้วย - Cups)**: อารมณ์, ความรู้สึก, ความสัมพันธ์, สัญชาตญาณ, ความรัก
- **ธาตุลม (ดาบ - Swords)**: ความคิด, การตัดสินใจ, ตรรกะ, ความจริงที่ต้องเผชิญ, อุปสรรคในใจ
- **ธาตุดิน (เหรียญ - Pentacles)**: ความมั่นคง, การเงิน, ทรัพย์สิน, ร่างกาย, ผลลัพธ์ที่เป็นรูปธรรม
- **Major Arcana (0-21)**: บทเรียนชีวิตครั้งใหญ่, จุดเปลี่ยนชะตา, สิ่งที่อยู่นอกเหนือการควบคุมชั่วคราว
- **ไพ่หัวกลับ (Reversed)**: พลังงานที่ติดขัด, อุปสรรคภายในใจ, ความลังเล, หรือสัญญาณเตือนให้ชะลอเพื่อทบทวน

## กฎเหล็กด้านความปลอดภัยและจรรยาบรรณ
- ห้ามวินิจฉัยโรค ทำนายเรื่องสุขภาพ การตั้งครรภ์ ยา หรือความตาย
- ห้ามให้เลขหวย ชี้แนะหุ้น หรือฟันธงผลคดีกฎหมาย
- ทุกคำทำนายที่หนัก ต้องมีแสงสว่างและทางออกให้ผู้ถามเสมอ`;

/**
 * ส่วน Prefix คงที่สำหรับ Prompt Caching
 */
export function buildSystemPrompt(personaId: string | null | undefined): string {
  const persona = getPersona(personaId);
  return `${SYSTEM_CORE_KNOWLEDGE}

## น้ำเสียงและบุคลิกเฉพาะของคุณในครั้งนี้
คุณคือ "${persona.nameTh}" (${persona.tagline})
${persona.voice}`;
}

export interface ReadingContext {
  personaId?: string | null;
  spread: Spread;
  category: Category;
  question: string;
  intake: { situation?: string; feeling?: string; hoped?: string };
  drawn: DrawnCard[];
  cards: TarotCard[];
  safety: SafetyVerdict;
  nickname?: string;
}

/**
 * ส่วน Dynamic Suffix ที่เปลี่ยนไปตามแต่ละรอบ
 */
export function buildReadingMessage(ctx: ReadingContext): string {
  const { spread, category, question, intake, drawn, cards, safety, nickname } = ctx;

  const cardBlocks = drawn.map((d, i) => {
    const card = cards[i];
    const position = spread.positions[d.order] || { index: i + 1, nameTh: `ตำแหน่งที่ ${i + 1}`, meaning: "" };
    const orientation = d.isReversed ? "หัวกลับ (Reversed)" : "หัวตั้ง (Upright)";
    const meaning = d.isReversed
      ? card.meanings[category]?.reversed || card.meanings.general.reversed
      : card.meanings[category]?.upright || card.meanings.general.upright;
    const keywords = d.isReversed ? card.keywords.reversed : card.keywords.upright;

    return `• ตำแหน่งที่ ${position.index}: "${position.nameTh}" (มิตินี้บอกถึง: ${position.meaning})
  ไพ่ที่เปิดได้: ${card.nameTh} (${card.nameEn}) — ${orientation}
  ธาตุ: ${card.element} | พลังงานหลัก: ${keywords.join(" · ")}
  นัยสำคัญในหมวด${category}: ${meaning}`;
  });

  const intakeLines = [
    intake.situation && `สถานการณ์ปัจจุบัน: ${intake.situation}`,
    intake.feeling && `ความรู้สึกในใจตอนนี้: ${intake.feeling}`,
    intake.hoped && `สิ่งที่ใจหวังไว้: ${intake.hoped}`,
  ].filter(Boolean);

  const guard = safety.promptGuard
    ? `\n## ข้อพึงระวังพิเศษในการตอบ\n${safety.promptGuard}\n`
    : "";

  const yesNo = spread.yesNoMode
    ? `\n## โหมดฟันธง ใช่/ไม่ใช่\nกรอก yesNoAnswer เป็น "ใช่", "ไม่ใช่", หรือ "ยังไม่แน่" พร้อมเหตุผลสรุปใน summary\n`
    : "";

  return `## ข้อมูลผู้มาขอคำทำนาย
ชื่อผู้ถาม: ${nickname || "คุณ (ผู้มาขอคำทำนาย)"}
คำถามที่ตั้งจิตอธิษฐาน: "${question || "ภาพรวมพลังงานและทิศทางชีวิตในช่วงนี้"}"
${intakeLines.length ? `บริบทเพิ่มเติม:\n${intakeLines.join("\n")}` : ""}

## ผังไพ่ที่ใช้: ${spread.nameTh} (${spread.description})
หมวดคำทำนาย: ${category}

## ไพ่ที่ผู้ถามสุ่มเลือกหยิบได้จริง (${drawn.length} ใบ):
${cardBlocks.join("\n\n")}
${guard}${yesNo}
จงสวมบทบาทแม่หมอตามน้ำเสียงที่กำหนด และอ่านไพ่ชุดนี้ให้ผู้ถามด้วยความเข้าอกเข้าใจและเป็นธรรมชาติเหมือนคนจริงที่สุด`;
}
