/**
 * ✦ สรุปบทเรียนดวงประจำเดือนแบบออฟไลน์ (ไม่เรียก AI)
 * ---------------------------------------------------------------------------
 * ใช้เมื่อแม่หมอ AI ไม่ว่าง (ไม่มีคีย์ / ทุกโมเดลล่ม / ตอบกลับมาใช้ไม่ได้)
 *
 * ของเดิมมีสองปัญหา:
 *   1. โมเดลล่ม ➔ error 500 ให้ผู้ใช้ลองใหม่ (ได้อะไรกลับไปไม่ได้เลย)
 *   2. โมเดลตอบ JSON ไม่ครบ ➔ เติมช่องว่างด้วยประโยคเหมารวมที่ฝังในโค้ด
 *      ("พลังงานโดยรวมของคุณกำลังเคลื่อนเข้าสู่จุดเปลี่ยนที่สำคัญ") แล้วส่งเหมือนเป็นผลจาก AI
 *
 * ตอนนี้ทุกประโยคคำนวณจากประวัติจริงของผู้ใช้: หมวดที่ถามบ่อย · ไพ่ที่ออกซ้ำ (+ คำสำคัญจาก
 * สารานุกรม) · ธาตุเด่น · สัดส่วนไพ่กลับหัว · ผลจริงที่ผู้ใช้บันทึกไว้ — และติดธง `fallback: true`
 * ให้หน้าเว็บบอกผู้ใช้ตรง ๆ ว่าไม่ได้มาจาก AI
 *
 * ไพ่หาจาก `cardIndex` ในสำรับจริงเท่านั้น หาไม่เจอให้ข้าม ห้ามเดาใบแทน (กฎเหล็กข้อ 14)
 */
import { cardByIndex } from "@/data/cards";
import type { SavedReadingItem } from "@/lib/utils/history";

export interface MonthlySummaryPayload {
  title: string;
  totalReadings: number;
  accurateReadings: number;
  dominantElement: string;
  recurringCards: string[];
  synthesis: string;
  lifeLessons: string[];
  empowermentQuote: string;
  /** `true` = คำนวณจากประวัติโดยตรง ไม่ได้มาจากแม่หมอ AI — หน้าเว็บต้องบอกผู้ใช้ */
  fallback?: boolean;
}

const CATEGORY_TH: Record<string, string> = {
  love: "ความรัก",
  work: "การงาน",
  money: "การเงิน",
  self: "ตัวเอง",
  general: "ภาพรวมชีวิต",
};

const ELEMENT_THEME: Record<string, string> = {
  ไฟ: "เดือนนี้คุณขับเคลื่อนด้วยความกล้าและการลงมือทำเป็นหลัก",
  น้ำ: "เดือนนี้อารมณ์และความรู้สึกเป็นแกนกลางของเรื่องที่คุณถาม",
  ลม: "เดือนนี้ความคิด การตัดสินใจ และการสื่อสารเป็นเรื่องที่วนกลับมาบ่อย",
  ดิน: "เดือนนี้เรื่องงาน เงิน และความมั่นคงเป็นสิ่งที่คุณให้น้ำหนักที่สุด",
};

const ELEMENT_LESSON: Record<string, string> = {
  ไฟ: "พลังของคุณอยู่ที่การเริ่มลงมือ แต่ก่อนตัดสินใจเรื่องใหญ่ให้เว้นจังหวะสักคืนเสมอ",
  น้ำ: "ความรู้สึกของคุณเป็นเข็มทิศที่ดี แค่อย่าให้มันตัดสินใจแทนข้อเท็จจริงทั้งหมด",
  ลม: "คุณคิดรอบด้านอยู่แล้ว สิ่งที่ขาดคือการเลือกและเริ่มทำจริงสักอย่าง",
  ดิน: "ความมั่นคงที่คุณสร้างทีละก้าวคือจุดแข็ง อย่าลืมเผื่อที่ว่างให้ความสุขเล็ก ๆ ระหว่างทาง",
  สมดุล: "พลังของคุณกระจายหลายด้านพอ ๆ กัน ลองเลือกเรื่องที่สำคัญที่สุดมาหนึ่งเรื่องแล้วโฟกัสก่อน",
};

const ELEMENT_QUOTE: Record<string, string> = {
  ไฟ: "ความกล้าไม่ได้แปลว่าไม่กลัว แต่คือการก้าวต่อทั้งที่ยังกลัว",
  น้ำ: "ใจที่อ่อนโยนกับตัวเองคือใจที่เข้มแข็งที่สุด",
  ลม: "ความชัดเจนไม่ได้มาจากการคิดเพิ่ม แต่มาจากการลงมือทำหนึ่งอย่าง",
  ดิน: "สิ่งที่ยั่งยืนทุกอย่างเริ่มจากก้าวเล็ก ๆ ที่ทำซ้ำทุกวัน",
  สมดุล: "ชีวิตที่สมดุลไม่ใช่ชีวิตที่นิ่ง แต่คือชีวิตที่รู้ว่าจะเอนไปทางไหนเมื่อไร",
};

export function buildOfflineMonthlySummary(journal: SavedReadingItem[]): MonthlySummaryPayload {
  const total = journal.length;
  const elementCount: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };
  const cardFreq = new Map<number, number>();
  const catFreq = new Map<string, number>();
  let cardTotal = 0;
  let reversedTotal = 0;
  let accurate = 0;
  let recorded = 0;
  let notHappened = 0;

  for (const r of journal) {
    if (r.outcome && r.outcome !== "PENDING") recorded++;
    if (r.outcome === "ACCURATE" || r.outcome === "PARTIAL") accurate++;
    if (r.outcome === "NOT_HAPPENED") notHappened++;
    if (r.category) catFreq.set(r.category, (catFreq.get(r.category) ?? 0) + 1);
    for (const c of r.cards ?? []) {
      const card = cardByIndex(c.cardIndex);
      if (!card) continue; // กฎเหล็กข้อ 14 — ห้ามเดาใบแทน
      cardTotal++;
      if (c.isReversed) reversedTotal++;
      cardFreq.set(c.cardIndex, (cardFreq.get(c.cardIndex) ?? 0) + 1);
      if (elementCount[card.element] !== undefined) elementCount[card.element]++;
    }
  }

  const sortedElements = Object.entries(elementCount).sort((a, b) => b[1] - a[1]);
  const dominantElement =
    sortedElements[0] && sortedElements[0][1] > 0 && sortedElements[0][1] > (sortedElements[1]?.[1] ?? 0)
      ? sortedElements[0][0]
      : "สมดุล";

  const ranked = [...cardFreq.entries()].sort((a, b) => b[1] - a[1]);
  const recurringCards = ranked.slice(0, 3).flatMap(([idx, count]) => {
    const card = cardByIndex(idx);
    return card ? [`${card.nameTh} (ปรากฏ ${count} ครั้ง)`] : [];
  });

  const synthesis: string[] = [];
  const lessons: string[] = [];

  // 1. หมวดที่ถามบ่อย
  const topCat = [...catFreq.entries()].sort((a, b) => b[1] - a[1])[0];
  synthesis.push(
    topCat
      ? `ตลอด ${total} ครั้งที่คุณเปิดไพ่และบันทึกไว้ เรื่องที่ถามบ่อยที่สุดคือหมวด${CATEGORY_TH[topCat[0]] ?? "ภาพรวมชีวิต"} (${topCat[1]} ครั้ง)`
      : `ตลอด ${total} ครั้งที่คุณเปิดไพ่และบันทึกไว้`,
  );

  // 2. ไพ่ที่กลับมาหาบ่อย
  const top = ranked[0];
  const topCard = top ? cardByIndex(top[0]) : undefined;
  if (topCard && top[1] >= 2) {
    const kws = topCard.keywords.upright.slice(0, 2);
    synthesis.push(
      `ไพ่ที่กลับมาหาคุณบ่อยที่สุดคือ${topCard.nameTh} (${top[1]} ครั้ง) ใจความของใบนี้คือ "${kws[0]}" ซึ่งน่าจะเป็นเรื่องที่ชีวิตกำลังย้ำเตือนคุณอยู่`,
    );
    lessons.push(
      kws[1]
        ? `${topCard.nameTh}ที่ออกซ้ำชวนให้ใส่ใจเรื่อง "${kws[0]}" และ "${kws[1]}" ในชีวิตประจำวันมากขึ้น`
        : `${topCard.nameTh}ที่ออกซ้ำชวนให้ใส่ใจเรื่อง "${kws[0]}" ในชีวิตประจำวันมากขึ้น`,
    );
  } else if (cardTotal > 0) {
    synthesis.push("ไพ่ในรอบนี้กระจายตัว ไม่มีใบไหนออกซ้ำ แปลว่าคุณกำลังรับมือกับหลายเรื่องไปพร้อมกัน");
  }

  // 3. ธาตุเด่น
  if (dominantElement !== "สมดุล") {
    synthesis.push(
      `ธาตุ${dominantElement}ออกมามากที่สุด (${elementCount[dominantElement]} จาก ${cardTotal} ใบ) ${ELEMENT_THEME[dominantElement]}`,
    );
  } else if (cardTotal > 0) {
    // เสมอกันที่อันดับหนึ่ง — บอกตามจริงว่าธาตุไหนบ้าง ห้ามเหมาว่า "ทั้งสี่ธาตุพอ ๆ กัน"
    const topCount = sortedElements[0][1];
    const tied = sortedElements.filter(([, c]) => c === topCount).map(([e]) => `ธาตุ${e}`);
    synthesis.push(
      tied.length >= 4
        ? "ไพ่ทั้งสี่ธาตุออกมาเท่า ๆ กัน ชีวิตช่วงนี้จึงต้องดูแลหลายด้านไปพร้อมกัน"
        : `${tied.join("กับ")}ออกมามากพอ ๆ กัน (${topCount} ใบเท่ากัน) ชีวิตช่วงนี้จึงมีสองแรงที่ต้องประคองไปพร้อมกัน`,
    );
  }
  lessons.push(ELEMENT_LESSON[dominantElement] ?? ELEMENT_LESSON.สมดุล);

  // 4. ไพ่กลับหัว
  const reversedPct = cardTotal > 0 ? Math.round((reversedTotal / cardTotal) * 100) : 0;
  if (cardTotal >= 3 && reversedPct >= 40) {
    synthesis.push(`ไพ่กลับหัวมีถึง ${reversedPct}% บอกว่าหลายเรื่องยังติดค้างอยู่ข้างใน ยังไม่ได้แสดงออกหรือจัดการ`);
  }

  // 5. ผลจริงที่ผู้ใช้บันทึก
  if (recorded > 0) {
    synthesis.push(`จากที่คุณบันทึกผลจริงไว้ ${recorded} ครั้ง ตรงหรือตรงบางส่วน ${accurate} ครั้ง`);
    // พูดเท่าที่ตัวเลขรองรับ — ตรง 1 ใน 2 ครั้งห้ามเรียกว่า "บ่อย"
    lessons.push(
      notHappened > accurate
        ? "คำทำนายที่ยังไม่เกิดขึ้นไม่ได้แปลว่าผิดเสมอ ลองย้อนดูว่าคุณเลือกทำอะไรต่างไปจากตอนที่ถาม"
        : recorded >= 3 && accurate / recorded >= 0.6
          ? "ความรู้สึกแรกของคุณกับสิ่งที่ไพ่บอกไปทางเดียวกันบ่อย ลองเชื่อสัญชาตญาณตัวเองให้มากขึ้น"
          : "ผลจริงยังออกมาหลายแบบ ลองบันทึกต่ออีกสักพัก แล้วจะเห็นว่าเรื่องแบบไหนที่ไพ่สะท้อนชีวิตคุณได้ตรงที่สุด",
    );
  } else {
    lessons.push("ลองกลับมาบันทึกผลจริงหลังเหตุการณ์ผ่านไป แล้วรูปแบบในชีวิตของคุณจะเห็นชัดขึ้นมาก");
  }

  const title =
    dominantElement === "สมดุล"
      ? topCard && top[1] >= 2
        ? `เดือนแห่งการประคองหลายด้าน กับเสียงเตือนจาก${topCard.nameTh}`
        : "เดือนแห่งการประคองหลายด้านไปพร้อมกัน"
      : topCard && top[1] >= 2
        ? `เดือนแห่งธาตุ${dominantElement} กับเสียงเตือนจาก${topCard.nameTh}`
        : `เดือนแห่งธาตุ${dominantElement}`;

  return {
    title,
    totalReadings: total,
    accurateReadings: accurate,
    dominantElement,
    recurringCards,
    synthesis: synthesis.join(" "),
    lifeLessons: lessons.slice(0, 3),
    empowermentQuote: ELEMENT_QUOTE[dominantElement] ?? ELEMENT_QUOTE.สมดุล,
    fallback: true,
  };
}
