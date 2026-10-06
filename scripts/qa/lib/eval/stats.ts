/**
 * 📐 สถิติของงานวัดคุณภาพ AI (แทร็ก E) — ฟังก์ชันล้วน ทดสอบได้
 *   • ช่วงความเชื่อมั่น Wilson ของอัตราชนะ (เทียบคู่แบบปิดชื่อ)
 *   • ความเห็นตรงกันระหว่างผู้ตัดสิน LLM กับคน (ปรับเทียบ — ชั้น 3)
 *   • ด่านกันถอยหลัง: คะแนนรอบใหม่ต่ำกว่า baseline เกินช่วงความคลาดเคลื่อนไหม
 */

/** ช่วงความเชื่อมั่น 95% ของสัดส่วน (Wilson score) — ใช้กับตัวอย่างเล็กได้ดีกว่าสูตรปกติ */
export function wilson(successes: number, n: number, z = 1.96): { low: number; high: number; p: number } {
  if (n <= 0) return { low: 0, high: 1, p: 0 };
  const p = successes / n;
  const denom = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return { low: Math.max(0, (centre - margin) / denom), high: Math.min(1, (centre + margin) / denom), p };
}

export interface PairOutcome {
  /** ผลรวมของสองลำดับ (A ก่อน · B ก่อน) — "A" / "B" / "tie" (ผลไม่ตรงกันข้ามลำดับ = เสมอ) */
  winner: "A" | "B" | "tie";
}

/**
 * รวมผลสองรอบที่สลับตำแหน่งกัน — ถ้าผู้ตัดสินเปลี่ยนใจตามตำแหน่ง แปลว่าลำเอียงตำแหน่ง ➔ นับเสมอ
 * `first` = ผลตอนให้ A อยู่ตำแหน่ง 1 · `second` = ผลตอนให้ B อยู่ตำแหน่ง 1 (ทั้งคู่บอกเป็น "1" / "2" / "tie")
 */
export function combineSwapped(first: "1" | "2" | "tie", second: "1" | "2" | "tie"): PairOutcome {
  const a1 = first === "1" ? "A" : first === "2" ? "B" : "tie";
  const a2 = second === "1" ? "B" : second === "2" ? "A" : "tie";
  return { winner: a1 === a2 ? a1 : "tie" };
}

export function pairwiseSummary(outcomes: PairOutcome[]) {
  const a = outcomes.filter((o) => o.winner === "A").length;
  const b = outcomes.filter((o) => o.winner === "B").length;
  const ties = outcomes.length - a - b;
  const decided = a + b;
  return { a, b, ties, n: outcomes.length, bWinRate: wilson(b, decided) };
}

/** ความเห็นตรงกันคน ↔ ผู้ตัดสิน: ห่างไม่เกิน 1 คะแนน + สหสัมพันธ์อันดับ Spearman */
export function agreement(human: number[], judge: number[]): { withinOne: number; spearman: number; n: number } {
  const n = Math.min(human.length, judge.length);
  if (n === 0) return { withinOne: 0, spearman: 0, n: 0 };
  let close = 0;
  for (let i = 0; i < n; i++) if (Math.abs(human[i] - judge[i]) <= 1) close++;
  const rank = (xs: number[]) => {
    const idx = xs.map((v, i) => ({ v, i })).sort((p, q) => p.v - q.v);
    const r = new Array<number>(xs.length);
    for (let i = 0; i < idx.length; ) {
      let j = i;
      while (j + 1 < idx.length && idx[j + 1].v === idx[i].v) j++;
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[idx[k].i] = avg;
      i = j + 1;
    }
    return r;
  };
  const rh = rank(human.slice(0, n));
  const rj = rank(judge.slice(0, n));
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const mh = mean(rh);
  const mj = mean(rj);
  let num = 0;
  let dh = 0;
  let dj = 0;
  for (let i = 0; i < n; i++) {
    num += (rh[i] - mh) * (rj[i] - mj);
    dh += (rh[i] - mh) ** 2;
    dj += (rj[i] - mj) ** 2;
  }
  const spearman = dh === 0 || dj === 0 ? 0 : num / Math.sqrt(dh * dj);
  return { withinOne: close / n, spearman, n };
}

/**
 * ด่านกันถอยหลัง — เทียบเฉพาะเคสที่มีคะแนนทั้งสองรอบ (กันชุดเคสเปลี่ยนแล้วหลอกว่าดีขึ้น · judge-compare.ts)
 * ถอยหลัง = ค่าเฉลี่ยใหม่ต่ำกว่าเดิมเกิน `margin` (ค่าเริ่มต้น 2 × ความคลาดเคลื่อนมาตรฐานของผลต่าง · อย่างน้อย 0.15)
 */
export function regressionCheck(baseline: Record<string, number>, current: Record<string, number>, minMargin = 0.15) {
  const shared = Object.keys(baseline).filter((k) => typeof current[k] === "number");
  if (shared.length < 5) return { ok: true, insufficient: true, shared: shared.length, delta: 0, margin: 0 };
  const diffs = shared.map((k) => current[k] - baseline[k]);
  const mean = diffs.reduce((s, d) => s + d, 0) / diffs.length;
  const sd = Math.sqrt(diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / Math.max(1, diffs.length - 1));
  const margin = Math.max(minMargin, (2 * sd) / Math.sqrt(diffs.length));
  return { ok: mean >= -margin, insufficient: false, shared: shared.length, delta: mean, margin };
}
