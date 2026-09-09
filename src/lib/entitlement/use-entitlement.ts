"use client";

import { useEffect, useState } from "react";

import { hasSessionHint } from "@/lib/auth/session-hint";

/**
 * สถานะสิทธิ์ฝั่ง client — ดึงจาก GET /api/entitlement ครั้งเดียว แล้ว cache ระดับโมดูล
 * ให้ทุกคอมโพเนนต์ (QuotaBadge / AccessDialog / FollowUpChat) ใช้ค่าเดียวกัน
 * ห้ามคำนวณสิทธิ์เองฝั่งเบราว์เซอร์ — นี่แค่ "สะท้อน" ค่าจาก server เพื่อแสดงผล
 */

export interface ClientEntitlement {
  enabled: boolean;
  canStartReading: boolean;
  canChat: boolean;
  remaining: number | null;
  limit: number | null;
  dailyRemaining?: number | null;
  weeklyRemaining: number | null;
  bonusRemaining: number | null;
  /** true เฉพาะเมื่อผู้ใช้เคยซื้อ credits (purchase_*) และยังเหลือรอบอยู่ */
  hasPaidCredits?: boolean;
  resetAt: string | null;
  dailyFreeAvailable?: boolean;
  dailyStreak?: number;
  kind?: "guest" | "member";
  role?: string;
  reason?: string;
  announce?: boolean;
  announceResetDate?: string;
}

let cache: ClientEntitlement | null = null;
let inflight: Promise<ClientEntitlement | null> | null = null;
const listeners = new Set<(e: ClientEntitlement | null) => void>();

/**
 * แคชข้ามการโหลดหน้า (sessionStorage) — แคชระดับโมดูลด้านบนหายทุกครั้งที่เปลี่ยนหน้าแบบเต็ม
 * ผู้ชมที่เดินดูหลายหน้าจึงยิง `/api/entitlement` ใหม่ทุกหน้า ทั้งที่คำตอบเหมือนเดิม
 *
 * ⚠️ นี่คือค่า "ไว้แสดงผล" เท่านั้น การบังคับสิทธิ์จริงอยู่ฝั่งเซิร์ฟเวอร์ทุกเส้นทาง
 * และทุกจุดที่สิทธิ์ถูกใช้ไปจะเรียก `refreshEntitlement()` ซึ่งเขียนทับแคชนี้ทันที
 */
const STORE_KEY = "tarot_entitlement_snapshot";
const STORE_TTL_MS = 5 * 60_000;

function readStoredEntitlement(): ClientEntitlement | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; member: boolean; value: ClientEntitlement };
    if (!parsed?.value || Date.now() - parsed.at > STORE_TTL_MS) return null;
    // เพิ่งล็อกอินหรือเพิ่งออกจากระบบ → สิทธิ์คนละชุดกัน ต้องถามใหม่ ห้ามใช้ภาพเก่า
    if (parsed.member !== hasSessionHint()) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeStoredEntitlement(value: ClientEntitlement | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!value) window.sessionStorage.removeItem(STORE_KEY);
    else {
      window.sessionStorage.setItem(
        STORE_KEY,
        JSON.stringify({ at: Date.now(), member: hasSessionHint(), value }),
      );
    }
  } catch {
    // เขียน sessionStorage ไม่ได้ — กลับไปยิงถามทุกหน้าเหมือนเดิม ไม่กระทบความถูกต้อง
  }
}

/**
 * ขอสิทธิ์ล่าสุดจากเซิร์ฟเวอร์
 *
 * ใช้ `/api/bootstrap` เป็นหลักเพราะคำขอเดียวได้ทั้ง "ใครใช้อยู่" และ "สิทธิ์เท่าไร"
 * แล้วเติมผู้ใช้เข้าแคชเซสชันให้ด้วย — หน้าเว็บจึงไม่ต้องยิง `/api/auth/me` อีกเส้น
 * (ของเดิมยิงสองเส้นทุกครั้งที่เปิดหน้า = ปลุก Worker สองครั้ง)
 */
async function fetchEntitlement(): Promise<ClientEntitlement | null> {
  try {
    const res = await fetch("/api/bootstrap", { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      user?: unknown;
      entitlement?: ClientEntitlement;
    };
    const ent = (data?.entitlement ?? null) as ClientEntitlement | null;
    if (!ent) return null;

    // เติมผู้ใช้เข้าแคชเซสชันด้วย — โหลดแบบ dynamic กันวงจร import ระหว่างสองโมดูล
    try {
      const { seedSessionUser } = await import("@/lib/auth/use-session");
      seedSessionUser((data.user ?? null) as never);
    } catch {
      // เติมไม่สำเร็จก็แค่ทำให้ `/api/auth/me` ถูกยิงตามปกติ ไม่กระทบความถูกต้อง
    }

    writeStoredEntitlement(ent);
    return ent;
  } catch {
    return null;
  }
}

/**
 * ขอสิทธิ์ "เมื่อถึงเวลาที่ต้องใช้จริง" — สำหรับผู้ชมที่ยังไม่ล็อกอิน
 *
 * ผู้ชมจาก Google ส่วนใหญ่เข้ามาอ่านหน้าเดียวแล้วออกโดยไม่กดอะไรเลย การยิงถามสิทธิ์
 * ตั้งแต่ตอนเปิดหน้าจึงเป็นคำขอที่เสียเปล่าเกือบทั้งหมด · ให้เรียกตัวนี้ตอนผู้ใช้เริ่ม
 * ลงมือจริง (เลือกผัง / กดเปิดไพ่ / เปิดหน้าต่างเข้าสู่ระบบ) แทน
 *
 * ⚠️ ต้องเรียก **ก่อน** พาผู้ใช้เข้าสู่ขั้นตอนเปิดไพ่เสมอ ไม่งั้น UI จะเชียร์ให้กดเปิดไพ่
 * แล้วไปเจอ 403 กลางทาง (เหตุผลเดียวกับที่ `snapshot.ts` เขียนกำกับไว้)
 */
export async function ensureEntitlement(): Promise<ClientEntitlement | null> {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetchEntitlement().then((e) => {
      cache = e;
      inflight = null;
      listeners.forEach((fn) => fn(e));
      return e;
    });
  }
  return inflight;
}

export async function refreshEntitlement(): Promise<void> {
  cache = await fetchEntitlement();
  listeners.forEach((fn) => fn(cache));
}

export const mutateEntitlement = refreshEntitlement;

export function useEntitlement(): ClientEntitlement | null {
  const [state, setState] = useState<ClientEntitlement | null>(cache);

  useEffect(() => {
    listeners.add(setState);
    if (!cache) {
      // หยิบภาพสิทธิ์ล่าสุดของแท็บนี้มาใช้ก่อน ถ้ายังไม่หมดอายุก็ไม่ต้องยิงถามใหม่
      cache = readStoredEntitlement();
    }
    if (cache) {
      setState(cache);
    } else if (hasSessionHint()) {
      // ล็อกอินอยู่ → ต้องรู้สิทธิ์ตั้งแต่เปิดหน้า ไม่งั้นผังพรีเมียมจะขึ้น "ล็อก" ค้างให้คนจ่ายเงินเห็น
      void ensureEntitlement();
    }
    // ยังไม่ล็อกอิน → ไม่ยิงอะไรเลยตอนเปิดหน้า
    // ค่า `null` ทำให้ผังพรีเมียมแสดงเป็น "ล็อก" อยู่แล้ว ซึ่งตรงกับสิทธิ์จริงของผู้เยี่ยมชม
    // แล้วค่อยเรียก `ensureEntitlement()` ตอนผู้ใช้ลงมือจริง
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
