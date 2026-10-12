"use client";


import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { ReadingBasis } from "@/lib/tarot/explain-types";
import type { MoodLevel } from "@/lib/journal/mood";
import type { JournalRitual, RitualKind } from "@/lib/journal/journal-types";
import { stripEmoji } from "@/lib/text/no-emoji";
export interface SavedCardDetail {
  order: number;
  positionName: string;
  cardIndex: number;
  cardNameTh: string;
  cardNameEn?: string;
  isReversed: boolean;
  element?: string;
}

export type ReadingOutcome = "PENDING" | "ACCURATE" | "PARTIAL" | "NOT_HAPPENED";

export interface SavedReadingItem {
  id: string;
  date: string;
  nickname?: string;
  question: string;
  spreadId: string;
  spreadName: string;
  category: string;
  personaId: string;
  personaName: string;
  cards: SavedCardDetail[];
  summary: string;
  advice?: string[];
  timing?: string;
  /** สถานะผลลัพธ์จริงที่เกิดขึ้นในชีวิต */
  outcome?: ReadingOutcome;
  /** บันทึกส่วนตัวของผู้ใช้เกี่ยวกับเหตุการณ์จริง */
  userNote?: string;
  /** วันที่อัปเดตสถานะผลลัพธ์ล่าสุด */
  outcomeUpdatedAt?: string;
  /**
   * แถวนี้อ่านข้อมูลไพ่ไม่ออก (JSON เสียหาย) — UI ต้องบอกผู้ใช้ว่า "ข้อมูลเสียหาย
   * กรุณาโหลดใหม่" ห้ามแสดงเป็นการอ่านที่ดูเหมือนไม่มีไพ่เลย (กฎเหล็กข้อ 14 · T-47)
   */
  corrupted?: boolean;

  // ── สมุดดวง v2 (migrations/0022 · REFLECTION_JOURNAL_PLAN 1.3 · 1.9) ──
  /** ปักหมุด ✦ */
  pinned?: boolean;
  /** แท็กส่วนตัว ≤ 5 (หมวด `category` เป็นแท็กอัตโนมัติอยู่แล้ว ไม่ต้องซ้ำ) */
  tags?: string[];
  /** ใจตอนนี้ก่อนสับไพ่ / ก่อนพิธีเช้า (1..5 · ไม่มี = ข้าม) */
  moodBefore?: MoodLevel;
  /** ใจตอนนี้หลังอ่านจบ / รอบเย็น */
  moodAfter?: MoodLevel;
  /** ผู้ใช้ยินยอมให้แม่หมอ AI อ่านบันทึก · ใจ · แท็กของรายการนี้ (ค่าเริ่มต้น = ไม่ยินยอม) */
  shareWithAi?: boolean;
  /** หลักฐานคำอ่านรอบนั้น — ใช้/ไม่ใช้ประวัติ · คำถาม · รายละเอียด */
  basis?: ReadingBasis;
  /** "morning" = บันทึกจากพิธีเช้าหน้า /daily */
  ritualKind?: RitualKind;
  ritual?: JournalRitual;
  /** คลื่น 3 — เส้นเรื่อง/นัดกลับมาเช็ก (อ่านอย่างเดียวในคลื่นนี้) */
  threadId?: string;
  checkinAt?: string;
}

/** ช่องที่แก้ทีหลังได้ (PATCH `/api/journal/[id]`) — ห้ามมีคำถาม/ไพ่ (Provably Fair) */
export interface ReadingMetaPatch {
  outcome?: ReadingOutcome;
  userNote?: string;
  pinned?: boolean;
  tags?: string[];
  /** null = ล้างค่า */
  moodBefore?: MoodLevel | null;
  moodAfter?: MoodLevel | null;
  shareWithAi?: boolean;
  /** ผสานกับของเดิม */
  ritual?: JournalRitual;
  /** คลื่น 3 — ผูก/ถอดเส้นเรื่อง (ว่าง = ถอด) */
  threadId?: string | null;
  /** คลื่น 3 — นัดกลับมาเช็ก ISO (ว่าง = ยกเลิกนัด) */
  checkinAt?: string | null;
}

/**
 * แพตช์ที่ผู้ใช้ทำกับรายการที่ยังไม่ได้ id จากเซิร์ฟเวอร์ (`reading_…`) — ส่งต่อทันทีที่ได้ `rj_…`
 * กรณีจริง: อ่านจบ ➔ บันทึกอัตโนมัติ ➔ ผู้ใช้แตะ "ใจตอนนี้" ภายในเสี้ยววินาทีก่อน POST กลับมา
 * ถ้ายิง PATCH ไปที่ id ชั่วคราว เซิร์ฟเวอร์ตอบ 404 และค่าที่เลือกหายตอนซิงก์รอบหน้า
 */
const pendingServerPatches = new Map<string, ReadingMetaPatch>();

const STORAGE_KEY = STORAGE_KEYS.journal;

/**
 * เพดานจำนวนรายการที่เก็บบนเครื่องของผู้ใช้ที่ไม่ได้ล็อกอิน
 * เกินแล้วตัวเก่าสุดถูกตัดทิ้ง — **ต้องบอกผู้ใช้** เพราะสำหรับคนที่ไม่ได้ซิงก์
 * นี่คือการสูญหายจริงของสิ่งที่เขาเคยเห็นว่า "บันทึกไว้แล้ว" (T-46)
 */
export const LOCAL_HISTORY_LIMIT = 50;

/** true = การบันทึกครั้งล่าสุดทำให้รายการเก่าสุดถูกตัดทิ้งจริง */
const TRIM_NOTICE_KEY = STORAGE_KEYS.journalTrimNotice;

export function wasHistoryTrimmed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TRIM_NOTICE_KEY) === "1";
  } catch {
    return false;
  }
}

/** ผู้ใช้รับทราบการแจ้งเตือนแล้ว — ไม่ต้องบอกซ้ำจนกว่าจะเกิดการตัดรอบใหม่ */
export function acknowledgeHistoryTrimmed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TRIM_NOTICE_KEY);
  } catch {
    /* โหมดส่วนตัว — ปล่อยผ่าน */
  }
}

function markHistoryTrimmed(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TRIM_NOTICE_KEY, "1");
  } catch {
    /* โหมดส่วนตัว — ปล่อยผ่าน */
  }
}

/**
 * ดึงรายการประวัติจาก LocalStorage (Synchronous & Offline-First)
 */
/**
 * เขียน/ลบข้อมูลใน localStorage แบบไม่ทำให้ผู้เรียกพัง
 *
 * ⚠️ `localStorage.setItem` โยน error ได้จริงสองกรณี: พื้นที่เต็ม (QuotaExceededError)
 * และเบราว์เซอร์บล็อกที่เก็บข้อมูลเว็บไซต์ (SecurityError) · เดิมเขียนตรง ๆ ไม่มี try
 * ทำให้ `deleteReading()` / `updateReadingOutcome()` โยน error ทะลุออกจาก onClick
 * ของ ReadingHistoryModal จนโมดัลถูก error boundary ถอดทิ้งทั้งอัน
 * และใน TarotFlow error จาก `saveReading` ไปตกใน catch ของสตรีม
 * ทำให้ `trackEvent("reading_complete")` ไม่ถูกยิง — ยอดดูดวงสำเร็จหายเงียบ ๆ
 */
function writeStorage(value: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY, value);
    return true;
  } catch (err) {
    console.warn("[Journal] เขียนประวัติลงเครื่องไม่สำเร็จ:", err);
    return false;
  }
}

function clearStorage(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn("[Journal] ล้างประวัติในเครื่องไม่สำเร็จ:", err);
  }
}

/**
 * กวาดอิโมจิออกจากช่องที่ **AI เขียน** (สรุป · คำแนะนำ · ช่วงเวลา) ก่อนถึงจอ
 * คำอ่านเก่าก่อน 2026-10-07 มี 🧘 ติดมาในคำแนะนำข้อสุดท้าย · ข้อความที่ผู้ใช้เขียนเองไม่แตะ
 */
function cleanAiText(items: SavedReadingItem[]): SavedReadingItem[] {
  return items.map((it) => ({
    ...it,
    summary: typeof it.summary === "string" ? stripEmoji(it.summary) : it.summary,
    advice: Array.isArray(it.advice) ? it.advice.map((a) => (typeof a === "string" ? stripEmoji(a) : a)) : it.advice,
    timing: typeof it.timing === "string" ? stripEmoji(it.timing) : it.timing,
  }));
}

export function getReadings(): SavedReadingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? cleanAiText(parsed) : [];
  } catch {
    return [];
  }
}

/**
 * ดึงประวัติจากเซิร์ฟเวอร์สำหรับผู้ใช้ที่ล็อกอิน พร้อมซิงก์อัปเดตลง LocalStorage Cache
 */
export async function fetchServerReadings(opts?: {
  /**
   * ถามก่อนเขียนทับ localStorage — คืน false = ผู้เรียกแก้รายการไปแล้วระหว่างรอ (A3-08)
   * เดิมเขียนทับก่อนผู้เรียกจะได้เช็กรุ่น รายการที่เพิ่งลบจึงกลับมาในแคชของหน้าอื่น
   */
  shouldCommit?: () => boolean;
}): Promise<SavedReadingItem[]> {
  if (typeof window === "undefined") return [];
  // ประวัติฝั่งเซิร์ฟเวอร์มีเฉพาะของสมาชิก — ผู้ชมที่ยังไม่ล็อกอินเคยยิงเส้นนี้ทุกครั้งที่
  // เปิดหน้าแรกแล้วได้ 401 กลับมาเปล่า ๆ (คำขอที่ปลุก Worker ทิ้งฟรี ๆ หนึ่งครั้งต่อหนึ่งวิว)
  // `fetchSessionUser()` มีแคช/รวมคำขอซ้ำอยู่แล้ว จึงไม่ได้เพิ่มคำขอใหม่ให้สมาชิก
  const { fetchSessionUser } = await import("@/lib/auth/use-session");
  const viewer = await fetchSessionUser();
  if (!viewer) return getReadings();

  try {
    const res = await fetch("/api/journal", { cache: "no-store" });
    if (!res.ok) {
      return getReadings();
    }
    const data = (await res.json()) as { readings?: SavedReadingItem[] };
    if (data.readings && Array.isArray(data.readings)) {
      if (opts?.shouldCommit && !opts.shouldCommit()) return getReadings();
      writeStorage(JSON.stringify(data.readings.slice(0, LOCAL_HISTORY_LIMIT)));
      return cleanAiText(data.readings);
    }
  } catch (err) {
    console.warn("[Journal Sync Notice]:", err);
  }
  return getReadings();
}

/**
 * บันทึกการดูดวงใหม่ลง LocalStorage และซิงก์ขึ้นเซิร์ฟเวอร์แบบ Dual-Mode (Fire & Forget)
 */
export function saveReading(item: Omit<SavedReadingItem, "id" | "date">): SavedReadingItem {
  const current = getReadings();
  const newItem: SavedReadingItem = {
    ...item,
    id: `reading_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    date: new Date().toISOString(),
    outcome: item.outcome || "PENDING",
  };

  // Avoid duplicate saves for same question and exact cards within 1 minute
  const cardKey = (item.cards || []).map((c) => `${c.cardIndex}:${c.isReversed ? "rev" : "up"}`).join(",");
  const isDuplicate = current.some((r) => {
    const rCardKey = (r.cards || []).map((c) => `${c.cardIndex}:${c.isReversed ? "rev" : "up"}`).join(",");
    return (
      r.question === item.question &&
      rCardKey === cardKey &&
      Math.abs(new Date(r.date).getTime() - Date.now()) < 60000
    );
  });

  if (!isDuplicate) {
    // ✦ บันทึกคำอ่านครบ 2 ครั้ง = จังหวะที่เห็นคุณค่า (ชวนติดตั้งแอปได้ — REFLECTION_JOURNAL_PLAN 1.10)
    if (typeof window !== "undefined") void import("@/lib/pwa/pwa-client").then((m) => m.markPwaValueMoment("reading")).catch(() => {});
    const merged = [newItem, ...current];
    const updated = merged.slice(0, LOCAL_HISTORY_LIMIT);
    // T-46: ของเดิม `.slice(0, 50)` ตัดตัวเก่าสุดทิ้งเงียบ ๆ โดยไม่มีการแจ้งเลยสักครั้ง
    if (merged.length > updated.length) markHistoryTrimmed();
    if (typeof window !== "undefined") {
      writeStorage(JSON.stringify(updated));
    }

    // Dual-Mode Sync to server (Non-blocking)
    if (typeof window !== "undefined") {
      fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { reading?: { id?: string } } | null) => {
          // ⚠️ ต้องรับ id ที่เซิร์ฟเวอร์ออกให้ (`rj_…`) มาเขียนทับ id ชั่วคราวฝั่งเครื่อง
          // (`reading_…`) เพราะ SaveReadingSchema ไม่มีฟิลด์ id ฝั่งเซิร์ฟเวอร์จึงออก id ใหม่เสมอ
          // ถ้าไม่ซิงก์กลับ การกดให้คะแนนความแม่นหรือลบรายการทีหลังจะยิงไปที่ id ที่ไม่มีอยู่จริง
          // `UPDATE/DELETE ... WHERE id = ?` จะแมตช์ 0 แถวแบบเงียบ ๆ (route ไม่ได้เช็ก changes)
          // ผู้ใช้เห็นว่าสำเร็จ แต่พอ fetchServerReadings() ทับ localStorage รายการที่ลบก็กลับมา
          // และผลที่ให้ไว้ก็กลายเป็น PENDING เหมือนเดิม
          const serverId = data?.reading?.id;
          if (!serverId || serverId === newItem.id) return;
          const list = getReadings();
          const idx = list.findIndex((r) => r.id === newItem.id);
          if (idx === -1) return;
          list[idx] = { ...list[idx], id: serverId };
          writeStorage(JSON.stringify(list));
          const queued = pendingServerPatches.get(newItem.id);
          if (queued) {
            pendingServerPatches.delete(newItem.id);
            void sendMetaPatch(serverId, queued);
          }
        })
        .catch(() => {
          // Silently ignore 401 for anonymous users
        });
    }
  }

  return newItem;
}

/**
 * อัปเดตผลลัพธ์ความเป็นจริงในชีวิต (Outcome) และบันทึกส่วนตัว
 */
export function updateReadingOutcome(
  id: string,
  outcome: ReadingOutcome,
  userNote?: string
): void {
  const current = getReadings();
  const updated = current.map((r) => {
    if (r.id === id) {
      return {
        ...r,
        outcome,
        userNote: userNote !== undefined ? userNote : r.userNote,
        outcomeUpdatedAt: new Date().toISOString(),
      };
    }
    return r;
  });

  if (typeof window !== "undefined") {
    writeStorage(JSON.stringify(updated));

    // Dual-Mode Sync to server
    fetch(`/api/journal/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, userNote }),
    }).catch(() => {});
  }
}

/**
 * ✦ คิวแก้สมุดที่ส่งไม่ถึงเซิร์ฟเวอร์ (ออฟไลน์/เซิร์ฟเวอร์ล่ม) — REFLECTION_JOURNAL_PLAN 1.10 สมุดออฟไลน์
 * แพตช์ของรายการเดียวกันถูกรวมกัน (อันใหม่ทับอันเก่า · ritual ผสาน) · 401/4xx ไม่เข้าคิว (ผู้เยี่ยมชม/ข้อมูลผิด)
 * ส่งซ้ำด้วย `flushPendingJournalPatches()` (หน้าสมุดเรียกตอนเปิดและตอน `online`)
 */
const PENDING_KEY = STORAGE_KEYS.journalPendingPatches;

function readPending(): Record<string, ReadingMetaPatch> {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function writePending(map: Record<string, ReadingMetaPatch>): void {
  try {
    if (Object.keys(map).length === 0) localStorage.removeItem(PENDING_KEY);
    else localStorage.setItem(PENDING_KEY, JSON.stringify(map));
  } catch {
    /* โหมดส่วนตัว — ข้าม */
  }
}

function enqueuePatch(id: string, patch: ReadingMetaPatch): void {
  const map = readPending();
  const prev = map[id] ?? {};
  map[id] = { ...prev, ...patch, ...(prev.ritual || patch.ritual ? { ritual: { ...(prev.ritual ?? {}), ...(patch.ritual ?? {}) } } : {}) };
  writePending(map);
}

function sendMetaPatch(id: string, patch: ReadingMetaPatch): Promise<boolean> {
  return fetch(`/api/journal/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  })
    .then((res) => {
      if (res.status >= 500) enqueuePatch(id, patch);
      return res.ok;
    })
    .catch(() => {
      // ออฟไลน์ — ค่าอยู่ในเครื่องแล้ว เก็บไว้ส่งซ้ำเมื่อกลับมาออนไลน์
      enqueuePatch(id, patch);
      return false;
    });
}

/** ส่งแพตช์ที่ค้างอยู่ทั้งหมด — คืนจำนวนที่ส่งสำเร็จ */
export async function flushPendingJournalPatches(): Promise<number> {
  if (typeof window === "undefined" || !navigator.onLine) return 0;
  const map = readPending();
  const ids = Object.keys(map);
  if (ids.length === 0) return 0;
  writePending({});
  let ok = 0;
  for (const id of ids) {
    if (await sendMetaPatch(id, map[id])) ok++;
  }
  return ok;
}

/**
 * ✦ แก้ช่องเสริมของบันทึก (สมุดดวง v2) ในเครื่องทันที แล้วส่งขึ้นเซิร์ฟเวอร์แบบไม่รอ
 * คืนรายการหลังแก้ (ไม่พบ = undefined) · `ritual` ผสานกับของเดิม · ใจ = null คือล้างค่า
 */
export function updateReadingMeta(id: string, patch: ReadingMetaPatch): SavedReadingItem | undefined {
  const current = getReadings();
  let changed: SavedReadingItem | undefined;
  const updated = current.map((r) => {
    if (r.id !== id) return r;
    const next: SavedReadingItem = { ...r };
    if (patch.outcome !== undefined) {
      next.outcome = patch.outcome;
      next.outcomeUpdatedAt = new Date().toISOString();
    }
    if (patch.userNote !== undefined) next.userNote = patch.userNote || undefined;
    if (patch.pinned !== undefined) next.pinned = patch.pinned || undefined;
    if (patch.tags !== undefined) next.tags = patch.tags.length > 0 ? patch.tags : undefined;
    if (patch.moodBefore !== undefined) next.moodBefore = patch.moodBefore ?? undefined;
    if (patch.moodAfter !== undefined) next.moodAfter = patch.moodAfter ?? undefined;
    if (patch.shareWithAi !== undefined) next.shareWithAi = patch.shareWithAi || undefined;
    if (patch.ritual !== undefined) next.ritual = { ...(r.ritual ?? {}), ...patch.ritual };
    if (patch.threadId !== undefined) next.threadId = patch.threadId || undefined;
    if (patch.checkinAt !== undefined) next.checkinAt = patch.checkinAt || undefined;
    changed = next;
    return next;
  });
  if (typeof window === "undefined") return changed;
  if (changed) writeStorage(JSON.stringify(updated));

  if (id.startsWith("reading_")) {
    // ยังไม่ได้ id จากเซิร์ฟเวอร์ — รวมแพตช์ไว้ก่อน (ritual ผสานกัน) แล้วส่งตอนได้ `rj_…`
    const prev = pendingServerPatches.get(id) ?? {};
    pendingServerPatches.set(id, {
      ...prev,
      ...patch,
      ...(prev.ritual || patch.ritual ? { ritual: { ...(prev.ritual ?? {}), ...(patch.ritual ?? {}) } } : {}),
    });
  } else {
    void sendMetaPatch(id, patch);
  }
  return changed;
}

/**
 * ✦ ค้นสมุดฝั่งเซิร์ฟเวอร์ (สมาชิก · เกินที่โหลดไว้ในเครื่อง) — ล้มเหลว = คืนค่าว่าง ให้หน้าจอใช้ผลในเครื่องต่อ
 */
export async function searchServerReadings(query: string): Promise<SavedReadingItem[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(`/api/journal?q=${encodeURIComponent(query)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { readings?: SavedReadingItem[] };
    return Array.isArray(data.readings) ? cleanAiText(data.readings) : null;
  } catch {
    return null;
  }
}

/**
 * ซิงก์ประวัติทั้งหมดในเครื่อง (LocalStorage) ขึ้นเซิร์ฟเวอร์หลังล็อกอิน
 */
export async function syncAnonymousHistoryToServer(): Promise<{ merged: number; skipped: number }> {
  if (typeof window === "undefined") return { merged: 0, skipped: 0 };
  const localItems = getReadings();
  if (localItems.length === 0) return { merged: 0, skipped: 0 };

  try {
    const res = await fetch("/api/journal/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: localItems }),
    });

    if (res.ok) {
      const result = (await res.json()) as { merged: number; skipped: number };
      await fetchServerReadings(); // Re-sync latest from DB into cache
      return result;
    }
  } catch (err) {
    console.error("[Anonymous History Sync Error]:", err);
  }
  return { merged: 0, skipped: 0 };
}

/**
 * ลบประวัติดูดวง 1 รายการ
 */
export function deleteReading(id: string): void {
  const current = getReadings();
  const filtered = current.filter((r) => r.id !== id);
  if (typeof window !== "undefined") {
    writeStorage(JSON.stringify(filtered));

    // Dual-Mode Sync to server
    fetch(`/api/journal/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).catch(() => {});
  }
}

/**
 * ล้างประวัติดูดวงทั้งหมด
 */
export function clearAllReadings(): void {
  if (typeof window !== "undefined") {
    clearStorage();

    // Dual-Mode Sync to server
    fetch("/api/journal", {
      method: "DELETE",
    }).catch(() => {});
  }
}
