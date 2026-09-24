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
 *
 * รองรับสองภาษา (`lang`) — ผู้ใช้หน้าอังกฤษต้องได้สรุปภาษาอังกฤษทั้งฉบับ ห้ามมีไทยปน
 * `dominantElement` คืนเป็นภาษาที่ขอ (ไทย: ไฟ/น้ำ/ลม/ดิน/สมดุล · อังกฤษ: Fire/Water/Air/Earth/Balanced)
 */
import { cardByIndex } from "@/data/cards";
import type { SavedReadingItem } from "@/lib/utils/history";

export type MonthlyLang = "th" | "en";

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

type Element = "ไฟ" | "น้ำ" | "ลม" | "ดิน";
type ElementKey = Element | "สมดุล";

const ELEMENTS: readonly Element[] = ["ไฟ", "น้ำ", "ลม", "ดิน"];

/** ป้ายธาตุที่ส่งกลับไปให้หน้าเว็บ — ภาษาเดียวกับที่ผู้ใช้เปิดอยู่ */
export const ELEMENT_LABEL: Record<ElementKey, Record<MonthlyLang, string>> = {
  ไฟ: { th: "ไฟ", en: "Fire" },
  น้ำ: { th: "น้ำ", en: "Water" },
  ลม: { th: "ลม", en: "Air" },
  ดิน: { th: "ดิน", en: "Earth" },
  สมดุล: { th: "สมดุล", en: "Balanced" },
};

const CATEGORY_LABEL: Record<string, Record<MonthlyLang, string>> = {
  love: { th: "ความรัก", en: "love" },
  work: { th: "การงาน", en: "work" },
  career: { th: "การงาน", en: "work" },
  money: { th: "การเงิน", en: "money" },
  finance: { th: "การเงิน", en: "money" },
  self: { th: "ตัวเอง", en: "yourself" },
  general: { th: "ภาพรวมชีวิต", en: "life in general" },
  decision: { th: "การตัดสินใจ", en: "decisions" },
  spiritual: { th: "จิตวิญญาณ", en: "your spiritual path" },
};

const ELEMENT_THEME: Record<Element, Record<MonthlyLang, string>> = {
  ไฟ: {
    th: "เดือนนี้คุณขับเคลื่อนด้วยความกล้าและการลงมือทำเป็นหลัก",
    en: "This month you have been driven mostly by courage and taking action.",
  },
  น้ำ: {
    th: "เดือนนี้อารมณ์และความรู้สึกเป็นแกนกลางของเรื่องที่คุณถาม",
    en: "This month, emotions and feelings sit at the heart of what you have been asking about.",
  },
  ลม: {
    th: "เดือนนี้ความคิด การตัดสินใจ และการสื่อสารเป็นเรื่องที่วนกลับมาบ่อย",
    en: "This month, thinking, deciding and communicating keep coming back.",
  },
  ดิน: {
    th: "เดือนนี้เรื่องงาน เงิน และความมั่นคงเป็นสิ่งที่คุณให้น้ำหนักที่สุด",
    en: "This month, work, money and security are what you have weighed most.",
  },
};

const ELEMENT_LESSON: Record<ElementKey, Record<MonthlyLang, string>> = {
  ไฟ: {
    th: "พลังของคุณอยู่ที่การเริ่มลงมือ แต่ก่อนตัดสินใจเรื่องใหญ่ให้เว้นจังหวะสักคืนเสมอ",
    en: "Your strength is in getting started, but always sleep on it before a big decision.",
  },
  น้ำ: {
    th: "ความรู้สึกของคุณเป็นเข็มทิศที่ดี แค่อย่าให้มันตัดสินใจแทนข้อเท็จจริงทั้งหมด",
    en: "Your feelings are a good compass — just don't let them outvote the facts.",
  },
  ลม: {
    th: "คุณคิดรอบด้านอยู่แล้ว สิ่งที่ขาดคือการเลือกและเริ่มทำจริงสักอย่าง",
    en: "You already think things through. What's missing is choosing one thing and actually starting.",
  },
  ดิน: {
    th: "ความมั่นคงที่คุณสร้างทีละก้าวคือจุดแข็ง อย่าลืมเผื่อที่ว่างให้ความสุขเล็ก ๆ ระหว่างทาง",
    en: "The stability you build step by step is your strength. Leave some room for small joys along the way.",
  },
  สมดุล: {
    th: "พลังของคุณกระจายหลายด้านพอ ๆ กัน ลองเลือกเรื่องที่สำคัญที่สุดมาหนึ่งเรื่องแล้วโฟกัสก่อน",
    en: "Your energy is spread across several areas. Pick the one that matters most and focus there first.",
  },
};

const ELEMENT_QUOTE: Record<ElementKey, Record<MonthlyLang, string>> = {
  ไฟ: {
    th: "ความกล้าไม่ได้แปลว่าไม่กลัว แต่คือการก้าวต่อทั้งที่ยังกลัว",
    en: "Courage isn't the absence of fear — it's taking the next step while you're still afraid.",
  },
  น้ำ: {
    th: "ใจที่อ่อนโยนกับตัวเองคือใจที่เข้มแข็งที่สุด",
    en: "A heart that is gentle with itself is the strongest heart of all.",
  },
  ลม: {
    th: "ความชัดเจนไม่ได้มาจากการคิดเพิ่ม แต่มาจากการลงมือทำหนึ่งอย่าง",
    en: "Clarity doesn't come from thinking more. It comes from doing one thing.",
  },
  ดิน: {
    th: "สิ่งที่ยั่งยืนทุกอย่างเริ่มจากก้าวเล็ก ๆ ที่ทำซ้ำทุกวัน",
    en: "Everything that lasts begins with small steps repeated every day.",
  },
  สมดุล: {
    th: "ชีวิตที่สมดุลไม่ใช่ชีวิตที่นิ่ง แต่คือชีวิตที่รู้ว่าจะเอนไปทางไหนเมื่อไร",
    en: "A balanced life isn't a still one — it's knowing which way to lean, and when.",
  },
};

export function buildOfflineMonthlySummary(journal: SavedReadingItem[], lang: MonthlyLang = "th"): MonthlySummaryPayload {
  const isEn = lang === "en";
  const total = journal.length;
  const elementCount: Record<Element, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };
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

  const sortedElements = ELEMENTS.map((e) => [e, elementCount[e]] as const).sort((a, b) => b[1] - a[1]);
  const dominant: ElementKey =
    sortedElements[0][1] > 0 && sortedElements[0][1] > sortedElements[1][1] ? sortedElements[0][0] : "สมดุล";
  const elName = (e: ElementKey) => ELEMENT_LABEL[e][lang];
  const cardName = (idx: number) => {
    const card = cardByIndex(idx);
    return card ? (isEn ? card.nameEn : card.nameTh) : undefined;
  };

  const ranked = [...cardFreq.entries()].sort((a, b) => b[1] - a[1]);
  const recurringCards = ranked.slice(0, 3).flatMap(([idx, count]) => {
    const name = cardName(idx);
    if (!name) return [];
    return [isEn ? `${name} (${count} ${count === 1 ? "time" : "times"})` : `${name} (ปรากฏ ${count} ครั้ง)`];
  });

  const synthesis: string[] = [];
  const lessons: string[] = [];

  // 1. หมวดที่ถามบ่อย — ต้องชนะขาดและถามอย่างน้อย 2 ครั้ง ไม่งั้นห้ามเรียกว่า "บ่อยที่สุด"
  const catRanked = [...catFreq.entries()].sort((a, b) => b[1] - a[1]);
  const topCat = catRanked[0] && catRanked[0][1] >= 2 && catRanked[0][1] > (catRanked[1]?.[1] ?? 0) ? catRanked[0] : undefined;
  const catLabel = topCat ? (CATEGORY_LABEL[topCat[0]] ?? CATEGORY_LABEL.general)[lang] : "";
  if (isEn) {
    const readingsWord = total === 1 ? "reading" : "readings";
    synthesis.push(
      topCat
        ? `Across the ${total} ${readingsWord} you saved, the topic you asked about most was ${catLabel} (${topCat[1]} ${topCat[1] === 1 ? "time" : "times"}).`
        : `You saved ${total} ${readingsWord} this round.`,
    );
  } else {
    synthesis.push(
      topCat
        ? `ตลอด ${total} ครั้งที่คุณเปิดไพ่และบันทึกไว้ เรื่องที่ถามบ่อยที่สุดคือหมวด${catLabel} (${topCat[1]} ครั้ง)`
        : `รอบนี้คุณเปิดไพ่และบันทึกไว้ ${total} ครั้ง`,
    );
  }

  // 2. ไพ่ที่กลับมาหาบ่อย — คำสำคัญต้องเป็นภาษาเดียวกับผู้ใช้ ห้ามเอาคำไทยไปใส่ประโยคอังกฤษ
  const top = ranked[0];
  const topCard = top && top[1] >= 2 ? cardByIndex(top[0]) : undefined;
  const topName = topCard ? (isEn ? topCard.nameEn : topCard.nameTh) : undefined;
  if (topCard && topName) {
    const kws = (isEn ? topCard.keywordsEn?.upright : topCard.keywords.upright)?.slice(0, 2) ?? [];
    if (isEn) {
      synthesis.push(
        kws[0]
          ? `The card that kept coming back was ${topName} (${top[1]} times). Its core message is "${kws[0]}", which is likely what life keeps reminding you of.`
          : `The card that kept coming back was ${topName} (${top[1]} times), which is likely what life keeps reminding you of.`,
      );
      if (kws[0]) {
        lessons.push(
          kws[1]
            ? `${topName} showing up again is a nudge to pay more attention to "${kws[0]}" and "${kws[1]}" in daily life.`
            : `${topName} showing up again is a nudge to pay more attention to "${kws[0]}" in daily life.`,
        );
      }
    } else {
      synthesis.push(
        `ไพ่ที่กลับมาหาคุณบ่อยที่สุดคือ${topName} (${top[1]} ครั้ง) ใจความของใบนี้คือ "${kws[0]}" ซึ่งน่าจะเป็นเรื่องที่ชีวิตกำลังย้ำเตือนคุณอยู่`,
      );
      lessons.push(
        kws[1]
          ? `${topName}ที่ออกซ้ำชวนให้ใส่ใจเรื่อง "${kws[0]}" และ "${kws[1]}" ในชีวิตประจำวันมากขึ้น`
          : `${topName}ที่ออกซ้ำชวนให้ใส่ใจเรื่อง "${kws[0]}" ในชีวิตประจำวันมากขึ้น`,
      );
    }
  } else if (cardTotal > 0) {
    synthesis.push(
      isEn
        ? "Your cards were spread out this round, with no card repeating — you are handling several things at once."
        : "ไพ่ในรอบนี้กระจายตัว ไม่มีใบไหนออกซ้ำ แปลว่าคุณกำลังรับมือกับหลายเรื่องไปพร้อมกัน",
    );
  }

  // 3. ธาตุเด่น
  if (dominant !== "สมดุล") {
    synthesis.push(
      isEn
        ? `${elName(dominant)} showed up most (${elementCount[dominant]} of ${cardTotal} cards). ${ELEMENT_THEME[dominant].en}`
        : `ธาตุ${elName(dominant)}ออกมามากที่สุด (${elementCount[dominant]} จาก ${cardTotal} ใบ) ${ELEMENT_THEME[dominant].th}`,
    );
  } else if (cardTotal > 0) {
    // เสมอกันที่อันดับหนึ่ง — บอกตามจริงว่าธาตุไหนบ้าง ห้ามเหมาว่า "ทั้งสี่ธาตุพอ ๆ กัน"
    const topCount = sortedElements[0][1];
    const tied = sortedElements.filter(([, c]) => c === topCount).map(([e]) => e);
    if (isEn) {
      const names = tied.map(elName);
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      synthesis.push(
        tied.length >= 4
          ? "All four elements showed up equally, so life right now asks you to look after several areas at once."
          : `${list} showed up equally (${topCount} cards each), so you are balancing more than one pull at the same time.`,
      );
    } else {
      synthesis.push(
        tied.length >= 4
          ? "ไพ่ทั้งสี่ธาตุออกมาเท่า ๆ กัน ชีวิตช่วงนี้จึงต้องดูแลหลายด้านไปพร้อมกัน"
          : `${tied.map((e) => `ธาตุ${elName(e)}`).join("กับ")}ออกมามากพอ ๆ กัน (${topCount} ใบเท่ากัน) ชีวิตช่วงนี้จึงมีสองแรงที่ต้องประคองไปพร้อมกัน`,
      );
    }
  }
  lessons.push(ELEMENT_LESSON[dominant][lang]);

  // 4. ไพ่กลับหัว
  const reversedPct = cardTotal > 0 ? Math.round((reversedTotal / cardTotal) * 100) : 0;
  if (cardTotal >= 3 && reversedPct >= 40) {
    synthesis.push(
      isEn
        ? `${reversedPct}% of your cards came up reversed, which suggests a lot is still held inside — not yet expressed or dealt with.`
        : `ไพ่กลับหัวมีถึง ${reversedPct}% บอกว่าหลายเรื่องยังติดค้างอยู่ข้างใน ยังไม่ได้แสดงออกหรือจัดการ`,
    );
  }

  // 5. ผลจริงที่ผู้ใช้บันทึก
  if (recorded > 0) {
    synthesis.push(
      isEn
        ? `Of the ${recorded} outcomes you recorded, ${accurate} came true or partly true.`
        : `จากที่คุณบันทึกผลจริงไว้ ${recorded} ครั้ง ตรงหรือตรงบางส่วน ${accurate} ครั้ง`,
    );
    // พูดเท่าที่ตัวเลขรองรับ — ตรง 1 ใน 2 ครั้งห้ามเรียกว่า "บ่อย"
    const lessonKey =
      notHappened > accurate ? "notYet" : recorded >= 3 && accurate / recorded >= 0.6 ? "trust" : "mixed";
    const OUTCOME_LESSON = {
      notYet: {
        th: "คำทำนายที่ยังไม่เกิดขึ้นไม่ได้แปลว่าผิดเสมอ ลองย้อนดูว่าคุณเลือกทำอะไรต่างไปจากตอนที่ถาม",
        en: "A reading that hasn't come true isn't always wrong — look back at what you chose to do differently after you asked.",
      },
      trust: {
        th: "ความรู้สึกแรกของคุณกับสิ่งที่ไพ่บอกไปทางเดียวกันบ่อย ลองเชื่อสัญชาตญาณตัวเองให้มากขึ้น",
        en: "Your first instinct and the cards often point the same way. Trust your intuition a little more.",
      },
      mixed: {
        th: "ผลจริงยังออกมาหลายแบบ ลองบันทึกต่ออีกสักพัก แล้วจะเห็นว่าเรื่องแบบไหนที่ไพ่สะท้อนชีวิตคุณได้ตรงที่สุด",
        en: "Your outcomes are still mixed. Keep recording for a while and you'll see which kinds of questions the cards reflect best for you.",
      },
    } as const;
    lessons.push(OUTCOME_LESSON[lessonKey][lang]);
  } else {
    lessons.push(
      isEn
        ? "Come back and record what actually happened once things play out — the patterns in your life will become much clearer."
        : "ลองกลับมาบันทึกผลจริงหลังเหตุการณ์ผ่านไป แล้วรูปแบบในชีวิตของคุณจะเห็นชัดขึ้นมาก",
    );
  }

  const title = isEn
    ? dominant === "สมดุล"
      ? topName
        ? `A month of balancing many things, with a reminder from ${topName}`
        : "A month of balancing many things at once"
      : topName
        ? `A month of ${elName(dominant)}, with a reminder from ${topName}`
        : `A month of ${elName(dominant)}`
    : dominant === "สมดุล"
      ? topName
        ? `เดือนแห่งการประคองหลายด้าน กับเสียงเตือนจาก${topName}`
        : "เดือนแห่งการประคองหลายด้านไปพร้อมกัน"
      : topName
        ? `เดือนแห่งธาตุ${elName(dominant)} กับเสียงเตือนจาก${topName}`
        : `เดือนแห่งธาตุ${elName(dominant)}`;

  return {
    title,
    totalReadings: total,
    accurateReadings: accurate,
    dominantElement: elName(dominant),
    recurringCards,
    synthesis: synthesis.join(" "),
    lifeLessons: lessons.slice(0, 3),
    empowermentQuote: ELEMENT_QUOTE[dominant][lang],
    fallback: true,
  };
}
