import type { Category } from "@/data/cards/types";
import type { DrawnCard } from "@/lib/shuffle";
import type { Reading } from "@/lib/reading-schema";
import type { SafetyFlag } from "@/lib/safety";

/**
 * ที่เก็บสถานะการเปิดไพ่ระหว่างขั้นตอน
 * ใช้ globalThis เพื่อรักษา Session ข้าม Module HMR และ API Routes ใน Next.js
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

/** อายุของ record — กันหน่วยความจำบวมจากคนที่เปิดค้างไว้แล้วไม่กลับมา */
const TTL_MS = 2 * 60 * 60 * 1000;

function sweep() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, record] of readings) {
    if (record.createdAt < cutoff) readings.delete(id);
  }
}

export function saveReading(record: ReadingRecord): void {
  sweep();
  readings.set(record.id, record);
}

export function getReading(id: string): ReadingRecord | undefined {
  return readings.get(id);
}

export function updateReading(id: string, patch: Partial<ReadingRecord>): ReadingRecord | undefined {
  const existing = readings.get(id);
  if (!existing) return undefined;
  const next = { ...existing, ...patch };
  readings.set(id, next);
  return next;
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "127.0.0.1";
}

/**
 * จำกัดจำนวนครั้งต่อ IP
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

  // กันแมปโตไม่จำกัดเมื่อมี IP แปลก ๆ เข้ามาเรื่อย ๆ
  if (rateBuckets.size > 10_000) {
    for (const [k, v] of rateBuckets) {
      if (v.every((t) => now - t >= windowMs)) rateBuckets.delete(k);
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
