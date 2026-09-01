import type { Category } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/tarot/shuffle";
import type { Reading } from "@/lib/schema/reading";
import type { SafetyFlag } from "@/lib/safety/guardrails";
import { kvGetJSON, kvPutJSON, KEY } from "@/lib/platform/kv-store";

/**
 * ที่เก็บสถานะการเปิดไพ่ระหว่างขั้นตอน (High-Resilience Edge-Ready Session Store)
 * รองรับทั้ง Next.js Serverless Environment, Local HMR และ Cloudflare Edge Workers
 */

export interface ReadingRecord {
  id: string;
  status: "DRAWING" | "READING" | "COMPLETED" | "FAILED";
  spreadId: string;
  category: Category;
  personaId: string;
  question: string;
  intake: { situation?: string; feeling?: string; hoped?: string };
  nickname?: string;
  safetyFlag: SafetyFlag;
  safetyGuard?: string;

  commitment: string;
  /** ห้ามส่งออกไปหา client จนกว่าจะอ่านเสร็จ */
  serverSeed: string;
  clientSeed?: string;
  drawn?: DrawnCard[];
  pickedIndices?: number[];

  result?: Reading;
  createdAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __tarot_readings_store__: Map<string, ReadingRecord> | undefined;
  // eslint-disable-next-line no-var
  var __tarot_rate_buckets_store__: Map<string, number[]> | undefined;
}

const readings: Map<string, ReadingRecord> =
  globalThis.__tarot_readings_store__ ?? (globalThis.__tarot_readings_store__ = new Map());

/** อายุของ record — 2 ชั่วโมงเพื่อป้องกัน Memory Leak */
const TTL_MS = 2 * 60 * 60 * 1000;
const MAX_IN_MEMORY_RECORDS = 5000;

function sweep() {
  const now = Date.now();
  const cutoff = now - TTL_MS;

  for (const [id, record] of readings) {
    if (record.createdAt < cutoff) {
      readings.delete(id);
    }
  }

  // LRU Eviction guard if capacity spikes
  if (readings.size > MAX_IN_MEMORY_RECORDS) {
    const oldestKeys = Array.from(readings.keys()).slice(0, Math.floor(MAX_IN_MEMORY_RECORDS * 0.2));
    for (const k of oldestKeys) {
      readings.delete(k);
    }
  }
}

export function saveReading(record: ReadingRecord): void {
  try {
    sweep();
    readings.set(record.id, { ...record });
  } catch (err) {
    console.error("Save reading error:", err);
  }
}

export function getReading(id: string): ReadingRecord | undefined {
  if (!id) return undefined;
  const record = readings.get(id);
  if (!record) return undefined;

  // Verify TTL freshness
  if (Date.now() - record.createdAt > TTL_MS) {
    readings.delete(id);
    return undefined;
  }

  return record;
}

export function updateReading(id: string, patch: Partial<ReadingRecord>): ReadingRecord | undefined {
  const existing = getReading(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  readings.set(id, next);
  return next;
}

const READING_KV_TTL_SEC = 7200; // 2 hours (ตรงกับ Session Token & Memory TTL)

export async function persistReading(record: ReadingRecord): Promise<void> {
  try {
    await kvPutJSON(KEY.reading(record.id), record, { expirationTtl: READING_KV_TTL_SEC });
  } catch {
    // Non-blocking graceful fallback if KV binding is absent in unit tests
  }
}

export async function loadReadingFromKV(id: string): Promise<ReadingRecord | null> {
  try {
    return await kvGetJSON<ReadingRecord>(KEY.reading(id));
  } catch {
    return null;
  }
}

export function clientKeyFromRequest(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * จำกัดจำนวนครั้งต่อ IP (Sliding Window Algorithm)
 */
const rateBuckets: Map<string, number[]> =
  globalThis.__tarot_rate_buckets_store__ ?? (globalThis.__tarot_rate_buckets_store__ = new Map());

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const hits = (rateBuckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (hits.length >= limit) {
    const oldest = hits[0];
    return { allowed: false, retryAfterSeconds: Math.ceil((windowMs - (now - oldest)) / 1000) };
  }

  hits.push(now);
  rateBuckets.set(key, hits);

  // Auto-cleanup rate buckets when collection exceeds 10,000 unique IPs
  if (rateBuckets.size > 10_000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => now - t >= windowMs)) rateBuckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
