/**
 * 💾 ผังดวงที่ผู้ใช้กดบันทึกไว้ในเครื่องนี้ (`/natal-chart`)
 * ---------------------------------------------------------------------------
 * - บันทึกเมื่อผู้ใช้กดปุ่มเองเท่านั้น (ค่าเริ่มต้น = ไม่บันทึก) · อยู่ใน localStorage ของเครื่องนี้ ไม่ส่งขึ้นเซิร์ฟเวอร์
 * - ลบได้ทีละผัง · ปุ่มลบข้อมูลทั้งหมด (PDPA) ล้าง localStorage ทั้งก้อนอยู่แล้ว
 * - เก็บเฉพาะข้อมูลที่ใช้สร้างผังซ้ำ (วันเวลาสถานที่ + ค่าตั้ง) ไม่เก็บผลคำนวณ
 */
import { STORAGE_KEYS } from "@/lib/storage/keys";
import type { HouseSystem, NodeType } from "./natal";

export interface SavedPlace {
  mode: "thai" | "world" | "custom";
  label: string;
  labelEn?: string;
  lat: number;
  lon: number;
  /** เขตเวลา IANA (ระบุพิกัดเอง = ไม่มี) */
  zone?: string;
  /** ระบุพิกัดเอง: ส่วนต่างจาก UTC (นาที) */
  fixedOffset?: number;
  /** รหัสจังหวัด (โหมดจังหวัดในไทย) */
  refId?: string;
}

export interface SavedChart {
  id: string;
  name: string;
  day: number;
  month: number;
  yearCe: number;
  hour: number;
  minute: number;
  timeKnown: boolean;
  place: SavedPlace;
  houseSystem: HouseSystem;
  nodeType: NodeType;
  orbScale: number;
  savedAt: number;
}

const MAX = 20;

function isSaved(x: unknown): x is SavedChart {
  const c = x as SavedChart;
  return (
    !!c &&
    typeof c.id === "string" &&
    typeof c.yearCe === "number" &&
    typeof c.month === "number" &&
    typeof c.day === "number" &&
    !!c.place &&
    typeof c.place.lat === "number" &&
    typeof c.place.lon === "number"
  );
}

export function loadSavedCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.natalCharts);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(isSaved) : [];
  } catch {
    // โหมดส่วนตัว/ปิดการเก็บข้อมูล: ใช้งานต่อได้แค่ไม่มีรายการที่บันทึกไว้
    return [];
  }
}

function write(list: SavedChart[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEYS.natalCharts, JSON.stringify(list));
    return true;
  } catch {
    // ที่เก็บเต็มหรือถูกปิด — แจ้งผู้ใช้ผ่านค่าที่คืน ไม่ต้องโยนต่อ
    return false;
  }
}

/** บันทึก (ผังที่ข้อมูลเกิดเหมือนเดิมเขียนทับของเดิม) · คืนรายการใหม่ หรือ null ถ้าบันทึกไม่ได้ */
export function saveChart(entry: Omit<SavedChart, "id" | "savedAt">): SavedChart[] | null {
  const list = loadSavedCharts();
  const same = (c: SavedChart) =>
    c.yearCe === entry.yearCe &&
    c.month === entry.month &&
    c.day === entry.day &&
    c.hour === entry.hour &&
    c.minute === entry.minute &&
    c.timeKnown === entry.timeKnown &&
    c.place.lat === entry.place.lat &&
    c.place.lon === entry.place.lon;
  const prev = list.find(same);
  const item: SavedChart = { ...entry, id: prev?.id ?? `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, savedAt: Date.now() };
  const next = [item, ...list.filter((c) => c !== prev)].slice(0, MAX);
  return write(next) ? next : null;
}

export function deleteSavedChart(id: string): SavedChart[] {
  const next = loadSavedCharts().filter((c) => c.id !== id);
  write(next);
  return next;
}
