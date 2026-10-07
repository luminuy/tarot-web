/**
 * 📸 คำตอบของโมเดลที่บันทึกไว้ (snapshot) ต่อ `PROMPT_VERSION` (REFLECTION_JOURNAL_PLAN 1.15 · แทร็ก E)
 * ---------------------------------------------------------------------------
 * ยิงโมเดลครั้งเดียว ➔ เก็บคำตอบ ➔ ให้คะแนนชั้น 1 (โค้ด) ใน CI ได้ทุก PR และให้คะแนนชั้น 2 ใหม่ได้
 * โดยไม่ต้องเรียกผู้ผลิตซ้ำ (ประหยัดโควตา — ต้นเหตุที่ baseline ค้างตั้งแต่ 2026-09-11)
 * โครง: scripts/qa/snapshots/<promptVersion>/<caseId>.json · ไม่มีข้อมูลผู้ใช้จริง (เคสสังเคราะห์ล้วน)
 */
import fs from "node:fs";
import path from "node:path";
import { DECK, cardById } from "../../../../src/data/cards";
import { getSpread } from "../../../../src/data/spreads";
import type { Category, TarotCard } from "../../../../src/data/cards/types";
import type { ReadingContext } from "../../../../src/lib/ai/prompt";
import type { Reading } from "../../../../src/lib/schema/reading";

export const SNAPSHOT_ROOT = path.join(process.cwd(), "scripts/qa/snapshots");

export interface CaseLike {
  id: string;
  category: string;
  spreadId: string;
  question: string;
  cardIds: string[];
  reversed: boolean[];
  personaId?: string;
  lang?: "th" | "en";
  kind?: string;
}

export interface Snapshot {
  caseId: string;
  promptVersion: string;
  model: string;
  provider: "groq" | "gemini" | "mock";
  createdAt: string;
  reading: Reading;
}

/** ประกอบ ReadingContext จากเคส — ใช้เลขไพ่จริงในสำรับ (ของเดิมใช้เลขตำแหน่งแทน ทำให้ cardIndex เพี้ยน) */
export function contextForCase(c: CaseLike): ReadingContext | null {
  const spread = getSpread(c.spreadId);
  if (!spread) return null;
  const cards = c.cardIds.map((id) => cardById(id));
  if (cards.some((x) => !x)) return null;
  return {
    personaId: c.personaId ?? null,
    spread,
    category: c.category as Category,
    question: c.question,
    intake: {},
    drawn: c.cardIds.map((id, i) => ({
      order: i,
      cardIndex: DECK.findIndex((d) => d.id === id),
      isReversed: Boolean(c.reversed?.[i]),
    })),
    cards: cards as TarotCard[],
    safety: { flag: "none", block: false },
    lang: c.lang ?? "th",
  } as ReadingContext;
}

export function snapshotPath(version: string, caseId: string): string {
  return path.join(SNAPSHOT_ROOT, version, `${caseId}.json`);
}

export function saveSnapshot(s: Snapshot): string {
  const p = snapshotPath(s.promptVersion, s.caseId);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
  return p;
}

export function loadSnapshot(version: string, caseId: string): Snapshot | null {
  const p = snapshotPath(version, caseId);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as Snapshot;
  } catch {
    return null;
  }
}

export function listSnapshotVersions(): string[] {
  if (!fs.existsSync(SNAPSHOT_ROOT)) return [];
  return fs.readdirSync(SNAPSHOT_ROOT).filter((d) => fs.statSync(path.join(SNAPSHOT_ROOT, d)).isDirectory()).sort();
}

export function loadSnapshots(version: string): Snapshot[] {
  const dir = path.join(SNAPSHOT_ROOT, version);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Snapshot;
      } catch {
        return null;
      }
    })
    .filter((s): s is Snapshot => s !== null);
}
