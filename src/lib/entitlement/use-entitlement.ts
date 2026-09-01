"use client";

import { useEffect, useState } from "react";

/**
 * สถานะสิทธิ์ฝั่ง client — ดึงจาก GET /api/entitlement ครั้งเดียว แล้ว cache ระดับโมดูล
 * ให้ทุกคอมโพเนนต์ (QuotaBadge / EntitlementGate / FollowUpChat) ใช้ค่าเดียวกัน
 * ห้ามคำนวณสิทธิ์เองฝั่งเบราว์เซอร์ — นี่แค่ "สะท้อน" ค่าจาก server เพื่อแสดงผล
 */

export interface ClientEntitlement {
  enabled: boolean;
  canStartReading: boolean;
  canChat: boolean;
  remaining: number | null;
  limit: number | null;
  weeklyRemaining: number | null;
  bonusRemaining: number | null;
  resetAt: string | null;
  dailyFreeAvailable?: boolean;
  dailyStreak?: number;
  kind?: "guest" | "member";
  reason?: string;
  announce?: boolean;
  announceResetDate?: string;
}

let cache: ClientEntitlement | null = null;
let inflight: Promise<ClientEntitlement | null> | null = null;
const listeners = new Set<(e: ClientEntitlement | null) => void>();

async function fetchEntitlement(): Promise<ClientEntitlement | null> {
  try {
    const res = await fetch("/api/entitlement", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as ClientEntitlement;
  } catch {
    return null;
  }
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
    if (cache) {
      setState(cache);
    } else if (!inflight) {
      inflight = fetchEntitlement().then((e) => {
        cache = e;
        inflight = null;
        listeners.forEach((fn) => fn(e));
        return e;
      });
    }
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}
