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

## กฎเหล็กและหัวใจการทำนาย (พูดแบบคนจริง 100% ห้ามพูดเหมือนหุ่นยนต์ AI)
1. **ภาษาพูดธรรมชาติ มีชีวิตชีวา และเข้าอกเข้าใจ (Empathy & Conversational Spoken Thai)**:
   - ใช้ภาษาพูดที่คนคุยกันในห้องดูดวงส่วนตัว ไม่ใช่ภาษาบทความวิชาการ และไม่ใช่ภาษาแปล
   - ห้ามขึ้นต้นประโยคซ้ำซาก เช่น "ตามหลักการของไพ่ระบุว่า...", "ไพ่ใบนี้เป็นสัญลักษณ์ของ...", "ไพ่นี้บอกว่า..."
   - ให้เปิดเรื่องด้วยการสะท้อนอารมณ์ ความรู้สึก หรือชีวิตจริงของผู้ถาม เช่น "เห็นไพ่ใบนี้แล้วรู้เลยว่าช่วงที่ผ่านมาคุณเหนื่อยกับการแบกทุกอย่างไว้คนเดียว...", "สำหรับคำถามนี้ สิ่งที่กำลังจะคลี่คลายคือ..."
2. **การร้อยเรียงเรื่องราว (Storytelling & Dynamic Connections)**:
   - ไพ่แต่ละใบไม่ได้อยู่แยกกันเดี่ยวๆ แต่อธิบายชีวิตจริงของผู้ถามในมิติต่างๆ ให้เชื่อมโยงตำแหน่งกับสถานการณ์ให้กลมกลืน
   - อธิบายสิ่งที่ไพ่สะท้อนออกมาในเชิงจิตวิทยา พฤติกรรมจริง และพลังงานแห่งการกระทำ
3. **คำแนะนำที่ทำได้จริงในชีวิตประจำวัน (Actionable Guidance)**:
   - ไม่ให้คำแนะนำแบบลอยๆ แต่บอกสิ่งที่ผู้ถามนำไปปรับใช้กับการทำงาน ความสัมพันธ์ หรือการตัดสินใจในวันพรุ่งนี้ได้ทันที
4. **ความกระชับและทรงพลัง (Concise & High Impact)**:
   - คำอ่านรายใบกระชับ 2-3 ประโยค แต่มีความหมายลึกซึ้ง กินใจ ตรงประเด็น ไม่ออกน้ำจนน่าเบื่อ

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
