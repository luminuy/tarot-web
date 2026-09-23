"use client";

import type { RitualStep } from "@/components/home/ritual-step";
import type { DrawnSlotCard } from "@/components/spread/SpreadBoard";
import type { Reading } from "@/lib/schema/reading";
import type { Category } from "@/data/cards/types";
import { STORAGE_KEYS } from "@/lib/storage/keys";

/**
 * 🔮 Flow Persistence — กันการดูดวงหลุดกลางคันเวลา refresh / กด back / สลับแท็บ
 *
 * server session มีอายุ ~60 นาที แต่ state ของ flow ทั้งหมดเดิมอยู่ใน useState ล้วน
 * ทำให้ refresh ทีเดียว = เด้งกลับขั้น 1 ทั้งที่ session ฝั่ง server ยังอยู่ (P1-U4)
 *
 * ใช้ `sessionStorage` (ไม่ใช่ localStorage) เพราะเป็นข้อมูลชั่วคราวของ "รอบ" การดูดวงนี้
 * ปิดแท็บแล้วให้หายไปเอง สอดคล้องนโยบาย PDPA — ไม่เก็บถาวรบนเครื่องหรือเซิร์ฟเวอร์
 */

const STORAGE_KEY = STORAGE_KEYS.flowState;

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
  lang?: "th" | "en";
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

/**
 * ✦ ผังที่ "กดเริ่มดูดวงมาแล้ว แต่ติดกำแพงเข้าสู่ระบบ"
 *
 * ลิงก์ `/?spread=<id>` ถูกล้างออกจาก URL ทันทีที่หน้าแรกรับคำสั่ง (กันรีเฟรชแล้วเริ่มใหม่ทับรอบ)
 * ผู้เยี่ยมชมที่ติดกำแพงจึงล็อกอินแล้วถูกส่งกลับ `/` เปล่า ๆ — Google/LINE กลับไป URL ที่ถูกล้างแล้ว
 * ส่วนอีเมลส่งกลับ `/?auth_success=1` ตายตัว ➔ ผังที่เลือกหาย ต้องไปหาผังในคลังใหม่อีกรอบ
 * จำไว้ในแท็บนี้แทน แล้วให้หน้าแรกหยิบมาเริ่มต่อเองหลังล็อกอิน (ใช้ครั้งเดียวแล้วทิ้ง)
 */
const PENDING_SPREAD_KEY = STORAGE_KEYS.pendingSpread;
/** เผื่อเวลากรอกฟอร์ม/ยืนยันอีเมลพอประมาณ แต่ไม่ค้างจนกลายเป็นการเด้งเข้าผังแบบงง ๆ วันหลัง */
const PENDING_SPREAD_MAX_AGE_MS = 30 * 60 * 1000;

export function savePendingSpread(spreadId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_SPREAD_KEY, JSON.stringify({ spreadId, savedAt: Date.now() }));
  } catch {
    /* โหมดส่วนตัว — แค่ต้องเลือกผังใหม่หลังล็อกอินเหมือนเดิม ไม่กระทบความถูกต้อง */
  }
}

/** อ่านแล้วลบทิ้งทันที — ผังที่ค้างถูกใช้ได้ครั้งเดียว */
export function takePendingSpread(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_SPREAD_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(PENDING_SPREAD_KEY);
    const parsed = JSON.parse(raw) as { spreadId?: unknown; savedAt?: unknown };
    if (typeof parsed?.spreadId !== "string" || typeof parsed.savedAt !== "number") return null;
    if (Date.now() - parsed.savedAt > PENDING_SPREAD_MAX_AGE_MS) return null;
    return parsed.spreadId;
  } catch {
    return null;
  }
}

export function clearPendingSpread(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_SPREAD_KEY);
  } catch {
    /* noop */
  }
}
