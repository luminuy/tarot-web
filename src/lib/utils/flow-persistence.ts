"use client";

import type { RitualStep } from "@/components/ui/RitualStepProgress";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { Reading } from "@/lib/schema/reading";
import type { Category } from "@/data/cards/types";

/**
 * 🔮 Flow Persistence — กันการดูดวงหลุดกลางคันเวลา refresh / กด back / สลับแท็บ
 *
 * server session มีอายุ ~60 นาที แต่ state ของ flow ทั้งหมดเดิมอยู่ใน useState ล้วน
 * ทำให้ refresh ทีเดียว = เด้งกลับขั้น 1 ทั้งที่ session ฝั่ง server ยังอยู่ (P1-U4)
 *
 * ใช้ `sessionStorage` (ไม่ใช่ localStorage) เพราะเป็นข้อมูลชั่วคราวของ "รอบ" การดูดวงนี้
 * ปิดแท็บแล้วให้หายไปเอง สอดคล้องนโยบาย PDPA — ไม่เก็บถาวรบนเครื่องหรือเซิร์ฟเวอร์
 */

const STORAGE_KEY = "tarot_flow_state_v1";

/** อายุสูงสุดที่ยอมให้กู้คืน — ตรงกับอายุ server session */
const MAX_AGE_MS = 60 * 60 * 1000;

export interface PersistedFlow {
  currentStep: RitualStep;
  spreadId: string;
  personaId: string;
  category: Category;
  question: string;
  nickname: string;
  situation: string;
  readingId: string | null;
  sessionToken: string | null;
  commitment: string;
  clientSeed: string;
  pickedIndices: number[];
  drawnCards: DrawnSlotCard[];
  revealedOrders: number[];
  activeCardIndex: number;
  readingResult: Partial<Reading> | null;
  proof: { serverSeed?: string; clientSeed?: string; commitment?: string };
  savedAt: number;
}

export function saveFlowState(state: Omit<PersistedFlow, "savedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedFlow = { ...state, savedAt: Date.now() };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage เต็ม / โหมดส่วนตัว — ปล่อยผ่าน ไม่ให้ flow พัง
  }
}

export function loadFlowState(): PersistedFlow | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedFlow;
    if (!parsed || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearFlowState();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearFlowState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
