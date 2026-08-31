"use client";

export interface SavedCardDetail {
  order: number;
  positionName: string;
  cardIndex: number;
  cardNameTh: string;
  cardNameEn: string;
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
    const updated = [newItem, ...current].slice(0, 50); // Keep last 50 readings in journal
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  return newItem;
}

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
  }
}

export function importReadings(newItems: SavedReadingItem[]): void {
  if (!Array.isArray(newItems) || newItems.length === 0) return;
  const current = getReadings();
  const existingIds = new Set(current.map((r) => r.id));
  const merged = [...current];

  for (const item of newItems) {
    if (!existingIds.has(item.id)) {
      merged.push(item);
      existingIds.add(item.id);
    }
  }

  merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const capped = merged.slice(0, 50);

  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  }
}

export function deleteReading(id: string): void {
  const current = getReadings();
  const filtered = current.filter((r) => r.id !== id);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

export function clearAllReadings(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
