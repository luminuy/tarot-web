/**
 * 🧾 สเปกข้อมูลเกิด ➔ ผังดวง (ใช้ซ้ำในผังคู่ — ฟอร์มหลักมีขั้นตอนเดียวกันใน `NatalChartApp.tsx`)
 */
import { computeNatalChart, type NatalChart } from "./natal";
import type { SavedChart } from "./saved-charts";
import { localToUtc, localToUtcFixed } from "./timezone";

export type ChartSpec = Omit<SavedChart, "id" | "savedAt">;

export function buildChart(spec: ChartSpec): NatalChart {
  const { place } = spec;
  const toUtc = (h: number, m: number) =>
    place.zone ? localToUtc(place.zone, spec.yearCe, spec.month, spec.day, h, m).utcMs : localToUtcFixed(place.fixedOffset ?? 0, spec.yearCe, spec.month, spec.day, h, m);
  return computeNatalChart({
    utcMs: spec.timeKnown ? toUtc(spec.hour, spec.minute) : toUtc(12, 0),
    timeKnown: spec.timeKnown,
    dayStartUtcMs: spec.timeKnown ? undefined : toUtc(0, 0),
    dayEndUtcMs: spec.timeKnown ? undefined : toUtc(23, 59),
    lat: place.lat,
    lon: place.lon,
    houseSystem: spec.houseSystem,
    nodeType: spec.nodeType,
    orbScale: spec.orbScale,
  });
}
