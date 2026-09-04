"use client";

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
}

const STORAGE_KEY = "tarot_reading_journal_v1";

/**
 * ดึงรายการประวัติจาก LocalStorage (Synchronous & Offline-First)
 */
export function getReadings(): SavedReadingItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * ดึงประวัติจากเซิร์ฟเวอร์สำหรับผู้ใช้ที่ล็อกอิน พร้อมซิงก์อัปเดตลง LocalStorage Cache
 */
export async function fetchServerReadings(): Promise<SavedReadingItem[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/journal", { cache: "no-store" });
    if (!res.ok) {
      return getReadings();
    }
    const data = (await res.json()) as { readings?: SavedReadingItem[] };
    if (data.readings && Array.isArray(data.readings)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.readings.slice(0, 50)));
      return data.readings;
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
    const updated = [newItem, ...current].slice(0, 50);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    // Dual-Mode Sync to server (Non-blocking)
    if (typeof window !== "undefined") {
      fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      }).catch(() => {
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dual-Mode Sync to server
    fetch(`/api/journal/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome, userNote }),
    }).catch(() => {});
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

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
    localStorage.removeItem(STORAGE_KEY);

    // Dual-Mode Sync to server
    fetch("/api/journal", {
      method: "DELETE",
    }).catch(() => {});
  }
}
