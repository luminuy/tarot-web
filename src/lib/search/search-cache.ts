import { redisGetJSON, redisSetJSON, isRedisEnabled } from "@/lib/platform/redis";
import type { SearchResult } from "./vectorize";

const TTL_SEC = 60 * 60 * 24; // 24 ชั่วโมง — corpus เปลี่ยนน้อยมาก

/** normalize ให้คำค้นที่ต่างกันแค่ช่องว่าง/ตัวพิมพ์ ใช้แคชก้อนเดียวกัน */
function cacheKey(q: string, type?: string, topK = 8): string {
  const norm = q.trim().toLowerCase().replace(/\s+/g, " ");
  return `app:search:${type ?? "all"}:${topK}:${norm}`;
}

export async function getCachedSearch(
  q: string,
  type?: string,
  topK = 8,
): Promise<SearchResult[] | null> {
  if (!(await isRedisEnabled())) return null;
  return redisGetJSON<SearchResult[]>(cacheKey(q, type, topK));
}

export async function setCachedSearch(
  q: string,
  results: SearchResult[],
  type?: string,
  topK = 8,
): Promise<void> {
  if (!(await isRedisEnabled())) return;
  await redisSetJSON(cacheKey(q, type, topK), results, TTL_SEC);
}
