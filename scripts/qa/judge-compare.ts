/**
 * scripts/qa/judge-compare.ts
 * ---------------------------------------------------------------------------
 * 📊 ตรรกะ "เทียบผลก่อน/หลัง" ของ LLM Judge — แยกออกมาเป็นโมดูลล้วนเพื่อให้ทดสอบได้
 *
 * เดิมตรรกะนี้ฝังอยู่ใน `run-golden-judge.ts` ซึ่งเรียก `main()` ตอน import
 * จึงเขียนเทสต์จับพฤติกรรมไม่ได้เลย — และนั่นคือเหตุผลที่บั๊กด้านล่างรอดมาได้
 *
 * 🐛 บั๊กที่โมดูลนี้แก้: เดิมเทียบ "ค่าเฉลี่ยรวม" ของสองรอบตรง ๆ
 *    baseline `20260911-1` สำเร็จแค่ 16/30 เคส (อีก 14 เคสคำอ่านถูกตัดกลาง)
 *    ถ้ารอบถัดไปสำเร็จ 30/30 แล้วเอาค่าเฉลี่ยมาเทียบกันดื้อ ๆ ตัวเลขที่ได้
 *    บอกแค่ว่า "ชุดเคสเปลี่ยนไป" ไม่ได้บอกว่าคำอ่านดีขึ้นจริง แต่หน้าจอจะขึ้น
 *    "🟢 ดีขึ้น" ให้อ่านอย่างมั่นใจ
 * ➔ ต้องเทียบบนเคสที่ **สำเร็จทั้งสองรอบ** เท่านั้น และโชว์ความครอบคลุมกำกับเสมอ
 */

/** ภาคผนวก B — เกณฑ์ให้คะแนน 1-5 ทั้ง 6 ข้อ */
export const RUBRIC = [
  { key: "onQuestion", label: "ตอบตรงคำถาม" },
  { key: "cardGrounded", label: "ยึดกับภาพไพ่ 1909 จริง" },
  { key: "actionable", label: "ลงมือทำได้จริง" },
  { key: "personaFit", label: "ตรงบุคลิกแม่หมอ" },
  { key: "notVague", label: "ไม่กำกวม (ไม่ใช่ Barnum)" },
  { key: "thaiNatural", label: "ภาษาไทยถูกต้องและเป็นธรรมชาติ" },
] as const;

export type RubricKey = (typeof RUBRIC)[number]["key"];

export interface CaseResult {
  id: string;
  category: string;
  spreadId: string;
  personaId: string;
  model: string | null;
  elapsedMs: number;
  ok: boolean;
  error?: string;
  consistencyIssues: string[];
  thaiScore: number;
  thaiIssues: string[];
  judge: Partial<Record<RubricKey, number>> & { average?: number; comment?: string };
}

export interface JudgeReport {
  promptVersion: string;
  judgeModel: string;
  startedAt: string;
  cases: CaseResult[];
  summary: {
    total: number;
    succeeded: number;
    avgThaiScore: number;
    avgElapsedMs: number;
    consistencyIssueRate: number;
    rubric: Record<RubricKey, number>;
    overall: number;
  };
}

/** ต่ำกว่าสัดส่วนนี้ = เคสที่ทับกันน้อยเกินกว่าจะตัดสินแทนทั้งชุด */
export const SHARED_CASE_WARN_RATIO = 0.6;

/**
 * สร้างข้อความรายงานเปรียบเทียบ — คืนเป็นบรรทัด ๆ เพื่อให้เทสต์ยืนยันได้ตรง ๆ
 * (ฝั่งเรียกเป็นคนพิมพ์ออกจอเอง โมดูลนี้ไม่แตะ console)
 */
export function buildComparison(current: JudgeReport, previous: JudgeReport): string[] {
  const out: string[] = [];
  out.push(`\n📊 เทียบ ${previous.promptVersion} → ${current.promptVersion}`);
  out.push("─".repeat(70));

  /*
   * ⚠️ "สำเร็จ" ไม่ได้แปลว่า "มีคะแนน judge"
   * -------------------------------------------------------------------------
   * เคสที่ `ok: true` คือคำอ่านออกมาครบ แต่ **ผู้ตัดสินอาจล้มแยกต่างหาก**
   * (คีย์หมดโควตา · rate limit ของ Gemini · ตอบกลับผิดรูป) แล้วได้ `judge: {}`
   * baseline `20260911-1` เป็นแบบนั้นจริง 7 จาก 16 เคสที่สำเร็จ
   * ถ้านับเคสพวกนี้เข้ามาเทียบ ค่าเฉลี่ยฝั่งนั้นจะกลายเป็น 0 แล้วรายงานว่า
   * "0.00 → 5.00 🟢 ดีขึ้น" ทั้งที่ไม่เคยมีใครให้คะแนนมาก่อน — ผลลวงเต็ม ๆ
   * ➔ เทียบเฉพาะเคสที่ **มีคะแนน judge จริงทั้งสองรอบ** เท่านั้น
   */
  const scored = (c: CaseResult) =>
    c.ok && RUBRIC.some((r) => typeof c.judge[r.key] === "number");
  const prevOk = new Map(previous.cases.filter(scored).map((c) => [c.id, c]));
  const currOk = new Map(current.cases.filter(scored).map((c) => [c.id, c]));
  const shared = [...currOk.keys()].filter((id) => prevOk.has(id));

  const unscored = (r: JudgeReport) => r.cases.filter((c) => c.ok && !scored(c)).length;

  const cov = (r: JudgeReport) => `${r.summary.succeeded}/${r.summary.total}`;
  out.push(
    `  ความครอบคลุม   ${previous.promptVersion}: ${cov(previous)} เคส → ${current.promptVersion}: ${cov(current)} เคส`
  );
  const uPrev = unscored(previous);
  const uCurr = unscored(current);
  if (uPrev > 0 || uCurr > 0) {
    out.push(
      `  ⚠️ สำเร็จแต่ผู้ตัดสินไม่ได้ให้คะแนน: ${previous.promptVersion} ${uPrev} เคส · ${current.promptVersion} ${uCurr} เคส (ไม่นับเข้าการเทียบ)`
    );
  }
  out.push(`  เคสที่มีคะแนน judge ทั้งสองรอบ (ใช้เทียบจริง): ${shared.length} เคส`);
  out.push("─".repeat(70));

  if (shared.length === 0) {
    out.push("\n❌ ไม่มีเคสที่มีคะแนน judge ทั้งสองรอบเลย — เทียบไม่ได้");
    out.push("   ➔ รันซ้ำให้ได้ชุดเคสที่ทับกันก่อน แล้วค่อยตัดสินว่าดีขึ้นหรือแย่ลง");
    return out;
  }

  const avgOn = (m: Map<string, CaseResult>, key: RubricKey) => {
    const v = shared.map((id) => m.get(id)!.judge[key]).filter((n): n is number => typeof n === "number");
    return v.length > 0 ? v.reduce((a, b) => a + b, 0) / v.length : 0;
  };

  for (const r of RUBRIC) {
    const before = avgOn(prevOk, r.key);
    const after = avgOn(currOk, r.key);
    const delta = Math.round((after - before) * 100) / 100;
    const mark = delta > 0.05 ? "🟢 ดีขึ้น" : delta < -0.05 ? "🔴 แย่ลง" : "⚪ เท่าเดิม";
    out.push(
      `  ${r.label.padEnd(32)} ${before.toFixed(2)} → ${after.toFixed(2)}  (${delta >= 0 ? "+" : ""}${delta})  ${mark}`
    );
  }

  const thaiAvg = (m: Map<string, CaseResult>) =>
    shared.reduce((a, id) => a + (m.get(id)!.thaiScore || 0), 0) / shared.length;
  const tBefore = Math.round(thaiAvg(prevOk));
  const tAfter = Math.round(thaiAvg(currOk));
  out.push(
    `  ${"คะแนนภาษาไทยจากโค้ด (0-100)".padEnd(32)} ${tBefore} → ${tAfter}  (${tAfter - tBefore >= 0 ? "+" : ""}${tAfter - tBefore})`
  );

  const biggest = Math.max(previous.summary.total, current.summary.total);
  if (shared.length < biggest * SHARED_CASE_WARN_RATIO) {
    out.push(`\n🟡 เคสที่ทับกันมีแค่ ${shared.length} จาก ${biggest} — ตัวเลขข้างบนยังตัดสินแทนทั้งชุดไม่ได้`);
    out.push("   ➔ หาสาเหตุที่เคสล้มก่อนแล้วรันใหม่ — ที่เจอจริงคือ Groq ตอบ 429");
    out.push("     (`Request too large ... OTPM/TPM Limit`) เพราะ max_tokens ที่ขอต่อครั้งเกินเพดานต่อนาทีของ tier");
  }

  out.push("\n⚠️ judge คือตัวชี้วัดรอง — ถ้า judge บอกดีขึ้นแต่ ACCURATE จากคนจริงลดลง ให้เชื่อคนจริงและย้อนกลับทันที");
  return out;
}
