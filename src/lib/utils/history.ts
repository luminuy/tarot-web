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
    const updated = [newItem, ...current].slice(0, 30); // Keep last 30 readings
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  }

  return newItem;
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
