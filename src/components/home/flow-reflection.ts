"use client";

import { useMemo, useReducer } from "react";
import type { JournalThread } from "@/lib/journal/threads-client";
import type { MoodLevel } from "@/lib/journal/mood";
import type { CustomSpreadDef } from "@/lib/tarot/custom-spread-client";
import type { ReadingBasis } from "@/lib/tarot/explain-types";

/**
 * 🪞 สถานะประกอบรอบเปิดไพ่ที่มาจากแผนสมุดดวง — ตัวลดเดียว (REFLECTION_JOURNAL_PLAN · ratchet R-26)
 * ===========================================================================
 *
 * แผนสมุดดวงเพิ่มข้อมูลประกอบให้ `TarotFlow` 7 ชิ้น (ผังที่สร้างเอง · ใจก่อน/หลัง · id บันทึกที่เพิ่งเซฟ ·
 * เส้นเรื่องที่เปิดอยู่/ที่เลือกถามต่อ · บริบทแผง "ทำไมแม่หมออ่านแบบนี้")
 * ถ้าเป็น `useState` อิสระ 7 ตัว ด่าน `test-flow-overlay` (เพดาน 16) จะตก และ "เริ่มรอบใหม่"
 * ต้องจำรีเซ็ตให้ครบทุกตัวเอง (ลืมตัวเดียว = ใจของรอบเก่าติดไปบันทึกรอบใหม่)
 *
 * ## กติกาที่ตัวลดนี้บังคับ
 * 1. **เริ่มรอบใหม่ (`newRound`)** ล้างใจก่อน/หลัง · id บันทึก · เรื่องที่เลือก พร้อมกันเสมอ
 *    (ผังที่สร้างเอง/รายการเส้นเรื่องคงไว้ — เป็นของผู้ใช้ ไม่ใช่ของรอบ)
 * 2. **เริ่มอ่าน (`readingStarted`)** ล้าง id บันทึก + ใจหลังอ่าน และตั้งบริบทคำอ่านใหม่ (basis ว่าง)
 *    ใจหลังอ่านของรอบก่อนจึงไม่มีทางติดไปบันทึกของรอบนี้
 * 3. **เฟรม basis ที่มาช้า** เขียนได้เฉพาะเมื่อมีบริบทคำอ่านอยู่ (`basis`) — ไม่สร้างบริบทขึ้นเอง
 *
 * ⚠️ ตัวลด (`reflectionReducer`) ไม่มี I/O และไม่พึ่ง React — ทดสอบตรงใน `test-flow-overlay.ts`
 */

export interface ReadingInsight {
  spreadId: string;
  category: string;
  basis: ReadingBasis | null;
}

export interface ReflectionState {
  customDef: CustomSpreadDef | null;
  moodBefore: MoodLevel | null;
  moodAfter: MoodLevel | null;
  savedJournalId: string | null;
  openThreads: JournalThread[];
  chosenThread: { id: string; title: string } | null;
  readingInsight: ReadingInsight | null;
}

export const REFLECTION_INITIAL: ReflectionState = {
  customDef: null,
  moodBefore: null,
  moodAfter: null,
  savedJournalId: null,
  openThreads: [],
  chosenThread: null,
  readingInsight: null,
};

type Updater<T> = T | ((prev: T) => T);

export type ReflectionAction =
  | { [K in keyof ReflectionState]: { type: "set"; key: K; value: Updater<ReflectionState[K]> } }[keyof ReflectionState]
  | { type: "newRound" }
  | { type: "readingStarted"; spreadId: string; category: string }
  | { type: "basis"; basis: ReadingBasis };

export function reflectionReducer(state: ReflectionState, action: ReflectionAction): ReflectionState {
  switch (action.type) {
    case "set": {
      const prev = state[action.key];
      const next = typeof action.value === "function" ? (action.value as (p: typeof prev) => typeof prev)(prev) : action.value;
      return Object.is(next, prev) ? state : { ...state, [action.key]: next };
    }
    case "newRound":
      return { ...state, moodBefore: null, moodAfter: null, savedJournalId: null, chosenThread: null };
    case "readingStarted":
      return { ...state, savedJournalId: null, moodAfter: null, readingInsight: { spreadId: action.spreadId, category: action.category, basis: null } };
    case "basis":
      return state.readingInsight ? { ...state, readingInsight: { ...state.readingInsight, basis: action.basis } } : state;
  }
}

type Setter<K extends keyof ReflectionState> = (value: Updater<ReflectionState[K]>) => void;

/** ตัวลดพร้อมตัวตั้งค่าที่หน้าตาเหมือน `useState` (ตัวตั้งค่าคงที่ตลอดอายุคอมโพเนนต์) */
export function useFlowReflection() {
  const [state, dispatch] = useReducer(reflectionReducer, REFLECTION_INITIAL);
  const api = useMemo(() => {
    const setter = <K extends keyof ReflectionState>(key: K): Setter<K> => (value) => dispatch({ type: "set", key, value } as ReflectionAction);
    return {
      setCustomDef: setter("customDef"),
      setMoodBefore: setter("moodBefore"),
      setMoodAfter: setter("moodAfter"),
      setSavedJournalId: setter("savedJournalId"),
      setOpenThreads: setter("openThreads"),
      setChosenThread: setter("chosenThread"),
      newRound: () => dispatch({ type: "newRound" }),
      readingStarted: (spreadId: string, category: string) => dispatch({ type: "readingStarted", spreadId, category }),
      setBasis: (basis: ReadingBasis) => dispatch({ type: "basis", basis }),
    };
  }, []);
  return { state, ...api };
}
