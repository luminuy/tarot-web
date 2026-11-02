/**
 * 🔮 ถาม Selene เรื่องผังดวงกำเนิด — ตัวแปลงผังเป็นบริบทของ prompt + กติกาการตอบ
 * ---------------------------------------------------------------------------
 * - เจ้าของเคาะ 2026-10-28: ส่งข้อมูลเกิดทั้งหมดให้ AI ได้ **เมื่อผู้ใช้กดยินยอมก่อนถามเท่านั้น** · ใช้สิทธิ์ AI ตามเดิม
 * - เซิร์ฟเวอร์คำนวณผังเองจากข้อมูลเกิด (`buildChart`) ไม่รับผังสำเร็จรูปจากเบราว์เซอร์ — ตัวเลขทุกตัวใน prompt มาจากตัวคำนวณ
 *   ข้อความอิสระมีแค่ชื่อและชื่อสถานที่ ซึ่งผ่าน `sanitizePromptValue` ก่อนเข้า prompt
 * - ไฟล์นี้ใช้ฝั่งเซิร์ฟเวอร์ (ลากสำรับไพ่มาด้วย) · ค่าคงที่ที่หน้าเว็บใช้อยู่ใน `natal-ai-limits.ts`
 */
import { cardById } from "@/data/cards";
import { ASPECT_TEXT, BODY_TEXT, DIGNITY_TEXT, ELEMENT_TEXT, HOUSE_TEXT, MODALITY_TEXT, MOON_PHASE_TEXT, PATTERN_TEXT, type Lang } from "@/data/natal/content";
import { formatDegree, type BodyId, type NatalChart } from "./natal";
import { bodyName, cardsFor, signName } from "./natal-text";
import type { Highlight } from "./natal-insight";
import type { TransitResult } from "./techniques";

const MAIN: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node", "lilith", "asc", "mc", "fortune", "vertex", "ceres", "pallas", "juno", "vesta"];

/** ชื่อไพ่จากรหัส (หาไม่เจอ = ไม่พูดถึง · กฎเหล็กข้อ 14) */
function cardName(id: string | undefined, lang: Lang): string | null {
  const c = id ? cardById(id) : undefined;
  if (!c) return null;
  return lang === "th" ? `${c.nameTh} (${c.nameEn})` : c.nameEn;
}

/**
 * ผังดวง ➔ ข้อความบริบทสำหรับ prompt (ข้อมูลล้วน ไม่มีคำสั่ง)
 * `birthLine` = บรรทัดข้อมูลเกิดที่ผ่าน sanitize แล้ว · `transit` = ดาวจร ณ ตอนถาม (ไม่ส่ง = ไม่ใส่)
 * `highlights` = เรื่องเด่นที่โค้ดจัดลำดับแล้ว (`chartHighlights`) พร้อมรหัส h1… ให้โมเดลตอบตามน้ำหนักจริงของผัง
 */
export function formatChartForPrompt(chart: NatalChart, lang: Lang, birthLine: string, transit?: TransitResult, highlights?: readonly Highlight[]): string {
  const th = lang === "th";
  const L: string[] = [];
  const get = (id: BodyId) => chart.bodies.find((b) => b.id === id);
  L.push(th ? `ข้อมูลเกิด: ${birthLine}` : `Birth data: ${birthLine}`);
  L.push(
    chart.input.zodiac === "lahiri"
      ? th
        ? `ระบบราศี: นิรายนะ Lahiri (อายนางศ์ ${formatDegree(chart.ayanamsa)})`
        : `Zodiac: sidereal, Lahiri (ayanamsa ${formatDegree(chart.ayanamsa)})`
      : th
        ? "ระบบราศี: สายนะ (สากล)"
        : "Zodiac: tropical",
  );
  if (!chart.input.timeKnown) {
    L.push(th ? "ไม่ทราบเวลาเกิด: ไม่มีลัคนา กลางฟ้า และเรือนชะตา (ห้ามพูดถึงเรือนหรือลัคนา)" : "Birth time unknown: no Ascendant, Midheaven or houses (do not mention houses or rising sign).");
    if (chart.signChangesOnDay.includes("moon")) L.push(th ? "ดวงจันทร์ย้ายราศีในวันเกิด ราศีจันทร์ที่ให้ไว้อาจไม่ตรง" : "The Moon changed sign on the birth day; its sign is uncertain.");
  }

  L.push(th ? "\nตำแหน่งดาว (ราศี องศา · เรือน · สถานะ):" : "\nPlacements (sign degree · house · status):");
  for (const id of MAIN) {
    const b = get(id);
    if (!b) continue;
    const parts = [`${bodyName(id, lang)}: ${signName(b.sign, lang)} ${formatDegree(b.degInSign)}`];
    if (b.house) parts.push(th ? `เรือน ${b.house}` : `house ${b.house}`);
    if (b.retrograde && id !== "node") parts.push(th ? "ถอยหลัง" : "retrograde");
    if (b.dignities.length) parts.push(b.dignities.map((d) => DIGNITY_TEXT[d].name[lang]).join(", "));
    L.push(`- ${parts.join(" · ")}`);
  }

  if (chart.houses) {
    L.push(th ? "\nจุดเริ่มเรือน:" : "\nHouse cusps:");
    L.push(chart.houses.map((c, i) => `${i + 1}: ${signName(Math.floor(c / 30) % 12, lang)} ${formatDegree(c % 30)}`).join(" · "));
    L.push(th ? "เรือนแต่ละเรือนดูแลเรื่อง:" : "House topics:");
    L.push(HOUSE_TEXT.map((h, i) => `${i + 1} ${h.arena[lang]}`).join(" · "));
  }

  const aspects = [...chart.aspects].sort((a, b) => a.orb - b.orb).slice(0, 18);
  if (aspects.length) {
    L.push(th ? "\nมุมสัมพันธ์ที่แน่นที่สุด (orb):" : "\nTightest aspects (orb):");
    for (const a of aspects) L.push(`- ${bodyName(a.a, lang)} ${ASPECT_TEXT[a.type].name[lang]} ${bodyName(a.b, lang)} (${formatDegree(a.orb)})`);
  }
  if (chart.patterns.length) {
    L.push(th ? "\nรูปแบบในผัง:" : "\nChart patterns:");
    for (const p of chart.patterns) L.push(`- ${PATTERN_TEXT[p.type].name[lang]}: ${p.bodies.map((x) => bodyName(x, lang)).join(", ")}`);
  }

  const es = chart.distribution.elementScore;
  const ms = chart.distribution.modalityScore;
  const top = <K extends string>(r: Record<K, number>) => (Object.keys(r) as K[]).sort((a, b) => r[b] - r[a]);
  const el = top(es);
  const mo = top(ms);
  L.push(
    th
      ? `\nธาตุเด่น: ${ELEMENT_TEXT[el[0]].name.th} · ธาตุอ่อน: ${ELEMENT_TEXT[el[3]].name.th} · ลักษณะราศีเด่น: ${MODALITY_TEXT[mo[0]].name.th}`
      : `\nStrongest element: ${ELEMENT_TEXT[el[0]].name.en} · weakest: ${ELEMENT_TEXT[el[3]].name.en} · dominant modality: ${MODALITY_TEXT[mo[0]].name.en}`,
  );
  if (chart.chartRuler) L.push(th ? `เจ้าเรือนลัคนา: ${bodyName(chart.chartRuler, lang)}` : `Chart ruler: ${bodyName(chart.chartRuler, lang)}`);
  if (chart.dominantPlanets.length) L.push(th ? `ดาวเด่น: ${chart.dominantPlanets.slice(0, 3).map((p) => bodyName(p.id, lang)).join(", ")}` : `Dominant planets: ${chart.dominantPlanets.slice(0, 3).map((p) => bodyName(p.id, lang)).join(", ")}`);
  L.push(th ? `ข้างขึ้นข้างแรมตอนเกิด: ${MOON_PHASE_TEXT[chart.moonPhase.phase].name.th}` : `Birth moon phase: ${MOON_PHASE_TEXT[chart.moonPhase.phase].name.en}`);

  if (highlights?.length) {
    L.push(th ? "\nเรื่องเด่นที่สุดของผัง (SeerTarot คำนวณและเรียงจากน้ำหนักมากไปน้อย):" : "\nThe chart's strongest themes (calculated by SeerTarot, most important first):");
    highlights.forEach((h, i) => L.push(`h${i + 1}: ${h.title} (${h.basis}) | ${h.text}`));
  }

  // ไพ่ประจำตำแหน่ง (Golden Dawn) — ไพ่ที่คุยถึงได้มีแค่ชุดนี้ ไม่ใช่ไพ่ที่เปิด
  L.push(th ? "\nไพ่ทาโรต์ประจำตำแหน่ง (ระบบ Golden Dawn ไม่ใช่ไพ่ที่สุ่มเปิด):" : "\nTarot correspondences (Golden Dawn system, not drawn cards):");
  for (const id of ["sun", "moon", "asc"] as const) {
    const b = get(id);
    if (!b) continue;
    const c = cardsFor(b);
    const names = [cardName(c.sign, lang), cardName(c.decan, lang)].filter(Boolean);
    if (names.length) L.push(`- ${bodyName(id, lang)}: ${names.join(" + ")}`);
  }

  if (transit) {
    const slow = transit.aspects.filter((a) => ["jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"].includes(a.t)).sort((a, b) => a.orb - b.orb).slice(0, 6);
    const fast = transit.aspects.filter((a) => !["jupiter", "saturn", "uranus", "neptune", "pluto", "node", "chiron"].includes(a.t)).sort((a, b) => a.orb - b.orb).slice(0, 4);
    const date = new Date(transit.utcMs).toISOString().slice(0, 10);
    L.push(th ? `\nดาวจร ณ วันที่ ${date} (มุมกับผังเกิด):` : `\nTransits on ${date} (to the natal chart):`);
    for (const a of [...slow, ...fast]) L.push(`- ${bodyName(a.t, lang)}${th ? "จร" : " (transit)"} ${ASPECT_TEXT[a.type].name[lang]} ${bodyName(a.n, lang)}${th ? "เกิด" : " (natal)"} (${formatDegree(a.orb)})`);
    const moon = transit.bodies.find((b) => b.id === "moon");
    if (moon) L.push(th ? `- ดวงจันทร์วันนี้อยู่${signName(moon.sign, lang)}${moon.house ? ` เรือน ${moon.house}` : ""}` : `- Today's Moon: ${signName(moon.sign, lang)}${moon.house ? `, house ${moon.house}` : ""}`);
  }
  // คำอธิบายพื้นฐานของดาว (ช่วยให้ตอบตรงความหมายบ้านนี้)
  L.push(th ? "\nความหมายของดาวแต่ละดวง:" : "\nWhat each body governs:");
  L.push(MAIN.filter((id) => get(id)).map((id) => `${bodyName(id, lang)} = ${BODY_TEXT[id].theme[lang]}`).join(" · "));
  return L.join("\n");
}

/** กติกาการตอบของแม่หมอเมื่อคุยเรื่องผังดวง (ส่วนท้ายของ system prompt)
 * เจ้าของ 2026-11-02 "ตอบชัดจัดเต็ม ไม่เอาตอบกลาง ๆ เซฟ" ➔ ข้อ 4–5 ตอบตรง ฟันธงได้ ห้ามคำกั๊ก · ข้อ 6 คือเส้นที่ยังห้ามข้าม (ตาย อุบัติเหตุ โรค ตั้งครรภ์ ผลสุขภาพ กฎหมาย ลงทุน พนัน) */
export function natalAnswerRules(lang: Lang): string {
  return lang === "th"
    ? `## วิธีตอบเรื่องผังดวงกำเนิด
1. ตอบจากผังด้านบนเท่านั้น อ้างตำแหน่งจริงทุกครั้ง เช่น "ดาวศุกร์ราศีกรกฎในเรือน 7" ห้ามแต่งตำแหน่งหรือมุมที่ไม่มีในรายการ
2. ถ้าไม่ทราบเวลาเกิด ห้ามพูดถึงลัคนา กลางฟ้า หรือเรือน และบอกผู้ถามสั้น ๆ ว่าต้องรู้เวลาเกิดถึงจะดูเรื่องนั้นได้
3. ไพ่ทาโรต์ที่พูดถึงได้มีแค่ไพ่ประจำตำแหน่งในรายการ (ระบบ Golden Dawn) ห้ามพูดว่าเปิดไพ่ สุ่มไพ่ หรือได้ไพ่ใบอื่น
4. ตอบตรงและชัด: ประโยคแรกตอบคำถามทันทีเป็นข้อสรุปเดียว แล้วค่อยให้เหตุผลจากตำแหน่งดาว พูดเรื่องนิสัย จุดแข็ง จุดอ่อน ความรัก งาน เงิน และจังหวะเวลาแบบฟันธงได้เต็มที่ ถ้ามีวันที่ของดาวจรในข้อมูลให้บอกช่วงเวลาจริง
5. ห้ามคำกั๊ก เช่น "อาจจะ" "บางที" "ก็เป็นได้" "ขึ้นอยู่กับหลายปัจจัย" "ไม่มากก็น้อย" ห้ามประโยคกลาง ๆ ที่ใช้ได้กับทุกคน ถ้าผังมีทั้งแรงหนุนและแรงต้าน ให้บอกว่าฝั่งไหนหนักกว่าและเพราะดาวอะไร
6. ข้อยกเว้นเดียวที่ห้ามฟันธง: ห้ามทำนายความตาย อุบัติเหตุ โรค หรือการตั้งครรภ์ ห้ามรับรองผลสุขภาพ กฎหมาย การลงทุน หรือการพนัน ห้ามขู่ ให้แนะนำผู้เชี่ยวชาญเมื่อเกี่ยวข้อง
7. ปิดด้วยคำแนะนำที่ทำได้จริง 1 ถึง 2 ข้อ บอกให้ชัดว่าทำอะไร กับใคร หรือเมื่อไร
8. ภาษาไทยธรรมชาติแบบคนคุยกัน ประโยคสั้น เข้าใจง่าย ไม่ใช้ศัพท์หุ่นยนต์ ไม่ใช้อีโมจิหรือสัญลักษณ์ตกแต่ง ศัพท์โหราศาสตร์ให้อธิบายสั้น ๆ ในวงเล็บเมื่อจำเป็น
9. ยาว 3 ถึง 4 ย่อหน้าสั้น เว้นบรรทัดว่างระหว่างย่อหน้า ปิดท้ายด้วยคำถามชวนคุยต่อ 1 ประโยค
10. ถ้าคำถามไม่เกี่ยวกับผังดวงหรือชีวิตของผู้ถาม ให้ชวนกลับมาที่ผังอย่างสุภาพ
11. ให้น้ำหนักตาม "เรื่องเด่นที่สุดของผัง" (h1 สำคัญที่สุด) ถ้าคำถามกว้างให้เริ่มจากเรื่องอันดับต้น ๆ ห้ามพิมพ์รหัส h ในคำตอบ`
    : `## How to answer about the natal chart
1. Answer only from the chart above and cite real placements (for example "Venus in Cancer in the 7th house"). Never invent placements or aspects.
2. If the birth time is unknown, do not mention the Ascendant, Midheaven or houses; briefly say the birth time is needed for that.
3. The only tarot cards you may mention are the listed Golden Dawn correspondences. Never say you drew, shuffled or pulled any card.
4. Be direct: the first sentence answers the question with one clear conclusion, then back it with the placements. Speak decisively about character, strengths, weak spots, love, work, money and timing. When transit dates are in the data, name the real time window.
5. No hedging such as "maybe", "perhaps", "it could be", "it depends on many factors", and no generic lines that would fit anyone. If the chart has both support and friction, say which side is stronger and which planet makes it so.
6. The only things you must not call: never predict death, accidents, illness or pregnancy, never guarantee health, legal, investment or gambling outcomes, and never threaten. Suggest a professional when relevant.
7. End with one or two practical actions, saying clearly what to do, with whom or when.
8. Warm, natural American English in short, plain sentences. No emoji or decorative symbols. Briefly explain jargon in parentheses when needed.
9. Three to four short paragraphs separated by blank lines, ending with one caring follow-up question.
10. If the question is unrelated to the chart or the person's life, gently steer back to the chart.
11. Weigh your answer by "the chart's strongest themes" (h1 matters most). For broad questions, start from the top themes. Never print the h codes in your answer.`;
}
