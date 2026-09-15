/**
 * คำอ่านสำรองออฟไลน์ (Mock Reading)
 * ---------------------------------------------------------------------------
 * ใช้เมื่อผู้ให้บริการ AI ทุกเจ้าใช้ไม่ได้จริง ๆ — ไม่มีคีย์ หรือทุกโมเดลไม่ตอบเลย
 * คำอ่านทุกบรรทัดประกอบจาก **ข้อมูลจริง** ของไพ่ที่จั่วได้ (สารานุกรม 78 ใบ + ตำแหน่งในผัง)
 * ไม่มีการกุไพ่หรือเดาความหมายขึ้นเอง (กฎเหล็กข้อ 14) และ usage = 0 เสมอ
 * ระบบจึงถือว่า "ไม่ใช่คำอ่านจริง" แล้วไม่หักสิทธิ์ผู้ใช้
 *
 * ⚠️ แยกไฟล์ออกจาก `gemini.ts` เพื่อให้ด่าน QA import มาทดสอบพฤติกรรมได้จริง
 * (`gemini.ts` มี `import "server-only"` จึงเรียกจากสคริปต์ทดสอบไม่ได้เลย
 *  ของเดิมจึงไม่เคยมีด่านไหนตรวจคำอ่านสำรองแม้แต่ด่านเดียว)
 */
import type { ReadingContext } from "@/lib/ai/prompt";
import type { Reading } from "@/lib/schema/reading";
import type { ReadingEvent, UsageInfo } from "@/lib/ai/types";
import { getPositionMeaning, getPositionName } from "@/data/spreads-helpers";
import { recordEvents } from "@/lib/stats/record";

// คำอ่านสำรองไม่ได้เรียกโมเดลจริง จึงไม่มีโทเค็นให้นับ — ศูนย์ทั้งชุดคือความจริง ไม่ใช่ค่าตั้งต้น
const DEFAULT_USAGE: UsageInfo = {
  inputTokens: 0,
  outputTokens: 0,
  cacheReadTokens: 0,
  cacheWriteTokens: 0,
};

/**
 * เหตุผลที่ต้องเสิร์ฟคำอ่านสำรอง — จดสถิติแยกกัน เพราะความหมายต่างกันคนละเรื่อง
 * `no_api_key` = ตั้งค่าผิด/ลืมใส่คีย์ (ต้องรีบแก้) · `all_models_down` = ปลายทางล่มชั่วคราว
 */
export type MockReason = "no_api_key" | "all_models_down";

/** ธาตุไทย → อังกฤษ ใช้เฉพาะคำอ่านสำรอง (คำอ่านจริงโมเดลเขียนเอง) */
const ELEMENT_EN: Record<string, string> = { ไฟ: "Fire", น้ำ: "Water", ลม: "Air", ดิน: "Earth" };

/** คำฟันธงฝั่งอังกฤษ — schema เก็บค่าเป็นไทยเสมอ ฝั่งแสดงผลค่อยแปลง */
const YES_NO_EN: Record<string, string> = { ใช่: "Yes", ไม่ใช่: "No", ยังไม่แน่: "Not yet certain" };

interface MockVars {
  nickname: string;
  count: number;
  question: string;
  verdict?: string;
}

/**
 * บทเปิดและบทสรุปของคำอ่านสำรอง — ครบทั้ง 5 บุคลิก × 2 ภาษา
 * ---------------------------------------------------------------------------
 * ⚠️ ต้องมีครบทุก id ใน `PERSONAS` — เดิมเขียนเป็น if/else 3 สาขา
 * บุคลิก `playful` กับ `master` จึงได้สำนวนของ `warm` ไปโดยไม่มีใครรู้
 * และทั้งก้อนเป็นภาษาไทยล้วน ผู้ใช้หน้าอังกฤษที่ตกมาถึงนี่จึงได้คำอ่านไทย
 */
const MOCK_VOICE: Record<
  string,
  Record<"th" | "en", { opening: (v: MockVars) => string; summary: (v: MockVars) => string }>
> = {
  warm: {
    th: {
      opening: (v) =>
        `สวัสดีค่ะคุณ${v.nickname} แม่หมอเปิดไพ่ทั้ง ${v.count} ใบให้แล้วนะคะ สำหรับคำถาม "${v.question}" ไพ่ส่งมอบความกระจ่างและพลังบวกมาให้อย่างอบอุ่นค่ะ`,
      summary: (v) =>
        `แม่หมอขอสรุปให้คุณ${v.nickname}ว่า สำหรับ "${v.question}" ทุกอย่างมีทางออกที่ดีเสมอ ขอให้มั่นใจในคุณค่าของตัวเองและก้าวไปข้างหน้าอย่างอบอุ่นใจนะคะ`,
    },
    en: {
      opening: (v) =>
        `Hello ${v.nickname}, all ${v.count} cards are laid out for your question "${v.question}". They arrive with warmth and a clear, kind light.`,
      summary: (v) =>
        `Here is what I want you to hold on to, ${v.nickname}: for "${v.question}" there is always a gentle way forward. Trust your own worth and take the next step at your own pace.`,
    },
  },
  playful: {
    th: {
      opening: (v) =>
        `มาแล้วคุณ${v.nickname} ไพ่ทั้ง ${v.count} ใบนอนเรียงรอตอบเรื่อง "${v.question}" อยู่ตรงนี้ บอกเลยว่าหน้าไพ่พูดแทนใจได้ชัดมาก`,
      summary: (v) =>
        `สรุปสั้น ๆ ให้คุณ${v.nickname}เลยนะ เรื่อง "${v.question}" ไม่ได้หนักอย่างที่คิด ไพ่ชี้ทางไว้ให้แล้ว เหลือแค่ลงมือทีละก้าวแบบไม่ต้องกดดันตัวเอง`,
    },
    en: {
      opening: (v) =>
        `Alright ${v.nickname}, all ${v.count} cards are on the table for "${v.question}" — and honestly, they are being refreshingly blunt about it.`,
      summary: (v) =>
        `Short version for you, ${v.nickname}: "${v.question}" is lighter than it feels right now. The cards already sketched the way out — just take it one unhurried step at a time.`,
    },
  },
  direct: {
    th: {
      opening: (v) =>
        `สวัสดีคุณ${v.nickname} ไพ่ทั้ง ${v.count} ใบสำหรับเรื่อง "${v.question}" วางเรียงออกมาตรงไปตรงมา ชัดเจนในทิศทางที่ต้องเลือก`,
      summary: (v) =>
        `สรุปสำหรับคำถาม "${v.question}": ความจริงปรากฏชัดเจนแล้ว อย่าปล่อยให้ความลังเลดึงเวลาไว้ จงตัดสินใจบนพื้นฐานของเหตุผลและความจริง`,
    },
    en: {
      opening: (v) =>
        `Straight to it, ${v.nickname}: all ${v.count} cards for "${v.question}" are laid out plainly, and the direction you have to choose is not ambiguous.`,
      summary: (v) =>
        `To close on "${v.question}": the picture is already clear. Do not let hesitation spend more of your time — decide on the facts in front of you.`,
    },
  },
  master: {
    th: {
      opening: (v) =>
        `สวัสดีครับคุณ${v.nickname} อาจารย์วางไพ่ครบทั้ง ${v.count} ใบสำหรับเรื่อง "${v.question}" แล้ว หน้าไพ่ชุดนี้อ่านเป็นลำดับขั้นได้ชัดเจน`,
      summary: (v) =>
        `สรุปแนวทางสำหรับ "${v.question}": ลำดับที่ 1 ตั้งเป้าหมายให้ชัด ลำดับที่ 2 จัดทรัพยากรและเวลาให้ตรงเป้า ลำดับที่ 3 ทบทวนผลเป็นระยะแล้วปรับแผนตามจริง`,
    },
    en: {
      opening: (v) =>
        `Let us begin, ${v.nickname}. All ${v.count} cards for "${v.question}" are now in position, and this spread reads as a clear sequence of steps.`,
      summary: (v) =>
        `The roadmap for "${v.question}": first, define the objective precisely. Second, align your time and resources behind it. Third, review the results at set intervals and adjust from evidence, not mood.`,
    },
  },
  mystic: {
    th: {
      opening: (v) =>
        `ยินดีต้อนรับสู่วิหารศักดิ์สิทธิ์ คุณ${v.nickname} สัมผัสแรกจากไพ่ทั้ง ${v.count} ใบปรากฏคลื่นพลังงานลี้ลับที่กำลังหมุนวนรอบคำถาม "${v.question}"`,
      summary: (v) =>
        `สารจากดวงดาวและไพ่สำหรับ "${v.question}": ม่านหมอกกำลังสลายตัว จงเชื่อมั่นในญาณหยั่งรู้ของคุณ แล้วทางข้างหน้าจะปรากฏอย่างแจ่มชัด`,
    },
    en: {
      opening: (v) =>
        `Welcome, ${v.nickname}. The first touch of all ${v.count} cards reveals the currents still circling your question "${v.question}".`,
      summary: (v) =>
        `What the cards hold for "${v.question}": the mist is thinning. Trust the knowing you already carry, and the path ahead will show itself clearly.`,
    },
  },
};

const resolveMockVoice = (personaId: string | null | undefined, lang: "th" | "en") =>
  (MOCK_VOICE[personaId ?? ""] ?? MOCK_VOICE.warm)[lang];

/**
 * ฟันธง ใช่/ไม่ใช่ ของคำอ่านสำรอง
 * ---------------------------------------------------------------------------
 * ใช้ค่า `yesNo` ที่ผูกไว้กับไพ่ทั้ง 78 ใบในสารานุกรม (ข้อมูลชุดเดียวกับที่ส่งให้
 * โมเดลจริงอ่าน) ไพ่กลับหัวสลับขั้ว yes↔no ส่วน maybe คงเดิม แล้วรวมคะแนนทั้งผัง
 * — ไม่ใช่การเดาและไม่ได้สร้างข้อมูลใหม่ขึ้นเอง
 *
 * เดิมคืน `null` เสมอ ➔ ผัง `yes-no` ที่ตกมาถึงคำอ่านสำรองจะไม่มีคำตอบให้ผู้ใช้เลย
 * เพราะ UI ซ่อนชิปคำตอบเมื่อค่าเป็น null (StreamReader.tsx)
 */
function resolveMockYesNo(ctx: ReadingContext): "ใช่" | "ไม่ใช่" | "ยังไม่แน่" | null {
  if (!ctx.spread.yesNoMode) return null;
  let score = 0;
  for (let i = 0; i < ctx.drawn.length; i++) {
    const card = ctx.cards[i];
    if (!card) continue;
    const polarity = card.yesNo === "yes" ? 1 : card.yesNo === "no" ? -1 : 0;
    score += ctx.drawn[i].isReversed ? -polarity : polarity;
  }
  return score > 0 ? "ใช่" : score < 0 ? "ไม่ใช่" : "ยังไม่แน่";
}

export async function* streamMockGeminiReading(
  ctx: ReadingContext,
  reason: MockReason = "all_models_down",
): AsyncGenerator<ReadingEvent> {
  const lang: "th" | "en" = ctx.lang === "en" ? "en" : "th";
  const isEn = lang === "en";

  /*
   * 📊 จดสถิติทุกครั้งที่คำอ่านสำรองถึงมือผู้ใช้
   * ทุกเส้นทางล้มเหลวอื่นจด recordEvent ไว้หมด ยกเว้นเส้นนี้ที่มีแค่ console.warn
   * ➔ แผงแอดมินจึงมองไม่เห็นเลยว่าผู้ใช้ได้คำอ่านสำรองบ่อยแค่ไหน
   */
  recordEvents([
    "ai_mock_served",
    `ai_mock_served:${reason}`,
    `ai_mock_served_cards:${ctx.drawn.length}`,
    `ai_mock_served_lang:${lang}`,
  ]);

  const nickname = ctx.nickname?.trim() || (isEn ? "friend" : "ผู้แสวงหาคำตอบ");
  const question = ctx.question?.trim() || (isEn ? "the road ahead" : "ภาพรวมดวงชะตา");
  const category = (ctx.category || "general") as "general" | "work" | "money" | "love" | "self";
  const voice = resolveMockVoice(ctx.personaId, lang);
  const vars: MockVars = { nickname, count: ctx.drawn.length, question };

  // 1. บทเปิดตามบุคลิกและภาษาของผู้ใช้
  const opening = voice.opening(vars);
  yield { type: "opening", text: opening };
  await new Promise((r) => setTimeout(r, 40));

  // 2. คำอ่านรายใบจากสารานุกรม 78 ใบ
  const cardsResult = [];
  let majorCount = 0;
  const elementCounts: Record<string, number> = { ไฟ: 0, น้ำ: 0, ลม: 0, ดิน: 0 };

  for (let i = 0; i < ctx.drawn.length; i++) {
    const d = ctx.drawn[i];
    const card = ctx.cards[i];
    if (!card) continue;

    if (card.arcana === "major") majorCount++;
    if (card.element && elementCounts[card.element] !== undefined) {
      elementCounts[card.element]++;
    }

    const pos = ctx.spread.positions[d.order];
    const posName = pos
      ? getPositionName(pos, isEn)
      : isEn
        ? `Position ${i + 1}`
        : `ตำแหน่งที่ ${i + 1}`;
    const posMeaning = pos
      ? getPositionMeaning(pos, isEn)
      : isEn
        ? "the energy held in this position"
        : "พลังงานในตำแหน่งนี้";

    const orientation = d.isReversed ? "reversed" : "upright";
    const cardName = isEn ? card.nameEn : card.nameTh;
    const catMeaning = isEn
      ? card.meaningsEn?.[category]?.[orientation] || card.meaningsEn?.general?.[orientation] || ""
      : card.meanings?.[category]?.[orientation] || card.meanings?.general?.[orientation] || "";
    const keywords = (
      isEn
        ? card.keywordsEn?.[orientation] || card.keywords?.[orientation]
        : card.keywords?.[orientation]
    )
      ?.slice(0, 3)
      .join(", ") || "";

    const headline = isEn
      ? `${cardName}${d.isReversed ? " (reversed)" : ""} in ${posName}`
      : `${cardName}${d.isReversed ? " (กลับหัว)" : ""} ในตำแหน่ง${posName}`;

    let reading = "";
    if (isEn) {
      reading = d.isReversed
        ? `${cardName} in ${posName} (${posMeaning}) points to energy that stalls or turns inward for a while. The keys here are "${keywords}". ${catMeaning}`
        : `${cardName} in ${posName} (${posMeaning}) is a clearly supportive signal. The keys here are "${keywords}". ${catMeaning}`;
    } else if (d.isReversed) {
      reading = `${cardName} ในตำแหน่ง ${posName} (${posMeaning}) บ่งบอกถึงภาวะที่พลังงานอาจสะดุดหรือมีความลังเลภายใน คีย์สำคัญคือ "${keywords}" คำแนะนำคือ ${catMeaning}`;
    } else {
      reading = `${cardName} ในตำแหน่ง ${posName} (${posMeaning}) เป็นสัญญาณเกื้อหนุนอย่างเด่นชัด คีย์สำคัญคือ "${keywords}" พลังงานบอกว่า ${catMeaning}`;
    }

    cardsResult.push({ position: d.order, headline, reading });
    yield { type: "card", position: d.order, headline, reading };
    await new Promise((r) => setTimeout(r, 35));
  }

  // 3. ความเชื่อมโยงของไพ่ทั้งผัง
  const dominantElement = Object.entries(elementCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "ดิน";
  const dominantElementLabel = isEn ? ELEMENT_EN[dominantElement] ?? "Earth" : dominantElement;
  const majorHeavy = majorCount >= Math.ceil(ctx.drawn.length / 2);
  let connections = "";
  if (isEn) {
    connections = majorHeavy
      ? `This spread carries ${majorCount} Major Arcana cards, which marks it as a genuine turning point rather than a passing episode.`
      : `The element of ${dominantElementLabel} runs through this spread, tying the cards together: steady, deliberate effort is what turns this into something you can hold.`;
  } else {
    connections = majorHeavy
      ? `ไพ่ชุดนี้มีไพ่ชุดใหญ่ (Major Arcana) ปรากฏขึ้นถึง ${majorCount} ใบ ชี้ว่าเรื่องนี้เป็นจุดเปลี่ยนสำคัญของชีวิตที่จักรวาลกำลังจัดสรร ไม่ใช่เรื่องบังเอิญเล็ก ๆ น้อย ๆ`
      : `พลังงานธาตุ${dominantElementLabel}ปรากฏเด่นชัดในผังนี้ ส่งพลังเชื่อมโยงให้เห็นว่า ความพยายามและการลงมือทำทีละก้าวของคุณจะนำพาผลลัพธ์ที่จับต้องได้มาให้`;
  }
  yield { type: "connections", text: connections };
  await new Promise((r) => setTimeout(r, 30));

  // 4. บทสรุป — โหมดฟันธงต้องขึ้นคำตอบให้ตรงกับ yesNoAnswer เสมอ (กัน YESNO_CONTRADICTION)
  const yesNoAnswer = resolveMockYesNo(ctx);
  let summary = voice.summary(vars);
  if (yesNoAnswer) {
    summary = isEn
      ? `Weighing all ${ctx.drawn.length} cards together for "${question}", the answer is ${YES_NO_EN[yesNoAnswer]}. ${summary}`
      : `ชั่งน้ำหนักไพ่ทั้ง ${ctx.drawn.length} ใบสำหรับ "${question}" แล้ว คำตอบคือ ${yesNoAnswer} ${summary}`;
  }
  yield { type: "summary", text: summary };
  await new Promise((r) => setTimeout(r, 30));

  // 5. คำแนะนำลงมือทำตามธาตุเด่น
  const ADVICE: Record<string, Record<"th" | "en", string[]>> = {
    ไฟ: {
      th: ["กล้าที่จะริเริ่มและลงมือทำทันทีที่มีโอกาส", "ระวังอารมณ์ใจร้อน ให้คิดอย่างรอบคอบก่อนเจรจา"],
      en: ["Start the thing while the opening is still there.", "Watch the short fuse — think it through before any difficult conversation."],
    },
    น้ำ: {
      th: ["รับฟังความรู้สึกและสัญชาตญาณภายในของตนเอง", "ให้เวลาตัวเองได้ผ่อนคลายและเคลียร์จิตใจให้แจ่มใส"],
      en: ["Listen to what your own feelings are telling you.", "Give yourself real rest and let your head clear before deciding."],
    },
    ลม: {
      th: ["รวบรวมข้อมูลและวิเคราะห์เหตุผลให้รอบด้าน", "สื่อสารอย่างตรงไปตรงมาและชัดเจนกับผู้เกี่ยวข้อง"],
      en: ["Gather the facts and weigh them from every side.", "Say what you mean, plainly, to the people involved."],
    },
    ดิน: {
      th: ["จัดระเบียบแผนงานและการเงินให้มั่นคงเป็นขั้นตอน", "อดทนและสร้างรากฐานที่แข็งแรงทีละก้าว"],
      en: ["Put your plan and your finances in order, one step at a time.", "Be patient and build the foundation properly before you scale."],
    },
  };
  const adviceList = [...(ADVICE[dominantElement] ?? ADVICE.ดิน)[lang]];

  const TIMING: Record<string, Record<"th" | "en", string>> = {
    ไฟ: { th: "ภายใน 1-2 สัปดาห์นี้", en: "within the next one to two weeks" },
    น้ำ: { th: "ภายใน 1 เดือนนี้", en: "within about a month" },
    ลม: { th: "เร็ว ๆ นี้ภายในไม่กี่วัน", en: "within the next few days" },
    ดิน: { th: "ภายใน 1-3 เดือนนี้", en: "over the next one to three months" },
  };

  const finalReading: Reading = {
    opening,
    cards: cardsResult,
    connections,
    summary,
    advice: adviceList,
    timing: (TIMING[dominantElement] ?? TIMING.ดิน)[lang],
    // mood เป็น enum ภายในสำหรับเลือกโทนสีหน้าเว็บ ไม่ได้แสดงผลเป็นข้อความ จึงคงค่าไทยไว้ทั้งสองภาษา
    mood: majorCount > 1 ? "ท้าทาย" : "อบอุ่น",
    yesNoAnswer,
  };

  yield { type: "done", reading: finalReading, usage: DEFAULT_USAGE, model: "mock-gemini", consistencyOk: true };
}
