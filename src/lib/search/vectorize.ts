/**
 * 🔎 ค้นหาเชิงความหมาย (Semantic Search) ด้วย Cloudflare Vectorize + Workers AI
 * ---------------------------------------------------------------------------
 * corpus = ความหมายไพ่ 78 ใบ + บทความ ทั้งหมด
 * embedding = `@cf/baai/bge-m3` (multilingual · 1024 มิติ · ตรงกับ index `card-meanings`)
 *
 * ใช้ทำ: "ไพ่ที่พลังงานใกล้เคียง" ท้ายหน้ารายละเอียดไพ่, ช่องค้นหาในสารานุกรม,
 * แนะนำบทความจากผลไพ่
 *
 * ⚠️ degrade ปลอดภัย: ไม่มี binding (dev / ยังไม่ deploy) / index ว่าง →
 *    ฟังก์ชันค้นหาคืน [] และ UI ต้องซ่อนส่วนนั้นไปเอง — ไม่ throw
 *
 * ⚠️ ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น
 */

import { DECK } from "@/data/cards";
import { ARTICLES } from "@/data/articles";
import { getAiBinding } from "@/lib/platform/cf";
import { getVectorizeBinding } from "@/lib/platform/cf";

const EMBED_MODEL = "@cf/baai/bge-m3";
const EMBED_BATCH = 90;

export type SearchType = "card" | "article";

export interface SearchDoc {
  /** id ใน Vectorize เช่น `card:major-00` / `article:tarot-love-3-cards-feelings` */
  id: string;
  type: SearchType;
  /** ข้อความที่เอาไป embed */
  text: string;
  metadata: Record<string, string>;
}

export interface SearchResult {
  id: string;
  type: SearchType;
  score: number;
  /** slug ของบทความ หรือ id ของไพ่ */
  ref: string;
  title: string;
  subtitle: string;
}

/** สร้าง corpus ทั้งหมดจากข้อมูลในโค้ด (ไม่แตะ network) */
export function buildSearchCorpus(): SearchDoc[] {
  const docs: SearchDoc[] = [];

  for (const c of DECK) {
    const kw = [...c.keywords.upright, ...c.keywords.reversed].join(" ");
    docs.push({
      id: `card:${c.id}`,
      type: "card",
      text: `${c.nameTh} ${c.nameEn} ${kw} ${c.meanings.general.upright} ${c.meanings.love.upright} ${c.meanings.work.upright} ธาตุ${c.element} ${c.astrology}`,
      metadata: {
        type: "card",
        ref: c.id,
        title: c.nameTh,
        subtitle: c.nameEn,
      },
    });
  }

  for (const a of ARTICLES) {
    docs.push({
      id: `article:${a.slug}`,
      type: "article",
      text: `${a.title} ${a.description} ${a.keywords.join(" ")} ${a.categoryTh}`,
      metadata: {
        type: "article",
        ref: a.slug,
        title: a.title,
        subtitle: a.categoryTh,
      },
    });
  }

  return docs;
}

/** embed ข้อความหลายก้อนด้วย Workers AI — คืน [] ถ้า binding ไม่พร้อม */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const AI = await getAiBinding();
  if (!AI || texts.length === 0) return [];

  const out: number[][] = [];
  for (let i = 0; i < texts.length; i += EMBED_BATCH) {
    const chunk = texts.slice(i, i + EMBED_BATCH);
    const res = (await AI.run(EMBED_MODEL, { text: chunk })) as {
      data?: number[][];
      shape?: number[];
    };
    if (!res?.data || !Array.isArray(res.data)) return [];
    out.push(...res.data);
  }
  return out;
}

export interface RebuildReport {
  ok: boolean;
  embedded: number;
  upserted: number;
  error?: string;
}

/** สร้าง/อัปเดต index ใหม่ทั้งหมด — เรียกจาก endpoint แอดมินเท่านั้น */
export async function rebuildSearchIndex(): Promise<RebuildReport> {
  const vec = await getVectorizeBinding();
  if (!vec) return { ok: false, embedded: 0, upserted: 0, error: "ไม่มี Vectorize binding" };

  const corpus = buildSearchCorpus();
  const vectors = await embedTexts(corpus.map((d) => d.text));
  if (vectors.length !== corpus.length) {
    return {
      ok: false,
      embedded: vectors.length,
      upserted: 0,
      error: `embed ได้ ${vectors.length}/${corpus.length} — Workers AI ไม่พร้อมหรือโควตาหมด`,
    };
  }

  let upserted = 0;
  for (let i = 0; i < corpus.length; i += 100) {
    const batch = corpus.slice(i, i + 100).map((d, j) => ({
      id: d.id,
      values: vectors[i + j],
      metadata: d.metadata,
    }));
    await vec.upsert(batch);
    upserted += batch.length;
  }

  return { ok: true, embedded: vectors.length, upserted };
}

function toResult(match: { id: string; score: number; metadata?: Record<string, unknown> }): SearchResult | null {
  const m = match.metadata || {};
  const type = m.type as SearchType | undefined;
  if (type !== "card" && type !== "article") return null;
  return {
    id: match.id,
    type,
    score: match.score,
    ref: String(m.ref ?? ""),
    title: String(m.title ?? ""),
    subtitle: String(m.subtitle ?? ""),
  };
}

/** ค้นหาด้วยข้อความอิสระ */
export async function semanticSearch(
  query: string,
  opts: { topK?: number; type?: SearchType } = {},
): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const vec = await getVectorizeBinding();
  if (!vec) return [];

  const [embedding] = await embedTexts([q]);
  if (!embedding) return [];

  const topK = opts.topK ?? 8;
  const res = await vec.query(embedding, { topK: topK + 5, returnMetadata: "all" }).catch(() => null);
  if (!res?.matches) return [];

  return res.matches
    .map(toResult)
    .filter((r): r is SearchResult => !!r && (!opts.type || r.type === opts.type))
    .slice(0, topK);
}

/** ไพ่/บทความที่ใกล้เคียงกับ item ที่ระบุ (เช่นไพ่ใบหนึ่ง) */
export async function relatedTo(
  itemId: string,
  opts: { topK?: number; type?: SearchType } = {},
): Promise<SearchResult[]> {
  const vec = await getVectorizeBinding();
  if (!vec) return [];

  const own = await vec.getByIds([itemId]).catch(() => []);
  const vector = own[0]?.values;
  if (!vector) return [];

  const topK = opts.topK ?? 4;
  const res = await vec.query(vector, { topK: topK + 6, returnMetadata: "all" }).catch(() => null);
  if (!res?.matches) return [];

  return res.matches
    .filter((mt) => mt.id !== itemId)
    .map(toResult)
    .filter((r): r is SearchResult => !!r && (!opts.type || r.type === opts.type))
    .slice(0, topK);
}
