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
  /** ผู้ให้บริการที่ผลิตคำอ่านจริง — ไม่มีค่าในรายงานที่สร้างก่อน ISSUE-046 */
  provider?: "groq" | "gemini";
  /** ร่องรอยของผู้ให้บริการที่ล้มก่อนหน้า (ไว้ดูว่าทำไมถึงตกไป Gemini) */
  providerNotes?: string[];
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
    /**
     * จำนวนเคสที่ **ผู้ตัดสินให้คะแนนจริง** — ค่า rubric ทุกตัวเฉลี่ยจากตัวเลขนี้ ไม่ใช่จาก `total`
     * (baseline `20260911-1`: total 30 · succeeded 16 · judged 9 ➔ `onQuestion 4.44` มาจาก 9 เคส
     *  ถ้าไม่พิมพ์เลขนี้กำกับ คนอ่านรายงานจะเข้าใจว่าเฉลี่ยจาก 30 เคส — ISSUE-046)
     */
    judged?: number;
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

  const prevOk = new Map(previous.cases.filter((c) => c.ok).map((c) => [c.id, c]));
  const currOk = new Map(current.cases.filter((c) => c.ok).map((c) => [c.id, c]));
  const shared = [...currOk.keys()].filter((id) => prevOk.has(id));

  const cov = (r: JudgeReport) => `${r.summary.succeeded}/${r.summary.total}`;
  out.push(
    `  ความครอบคลุม   ${previous.promptVersion}: ${cov(previous)} เคส → ${current.promptVersion}: ${cov(current)} เคส`
  );
  out.push(`  เคสที่สำเร็จทั้งสองรอบ (ใช้เทียบจริง): ${shared.length} เคส`);
  out.push("─".repeat(70));

  if (shared.length === 0) {
    out.push("\n❌ ไม่มีเคสที่สำเร็จทั้งสองรอบเลย — เทียบไม่ได้");
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
    out.push("   ➔ หาสาเหตุที่เคสล้มก่อน (ส่วนใหญ่คือคำอ่านถูกตัดกลางเพราะโทเค็นไม่พอ) แล้วรันใหม่");
  }

  out.push("\n⚠️ judge คือตัวชี้วัดรอง — ถ้า judge บอกดีขึ้นแต่ ACCURATE จากคนจริงลดลง ให้เชื่อคนจริงและย้อนกลับทันที");
  return out;
}
