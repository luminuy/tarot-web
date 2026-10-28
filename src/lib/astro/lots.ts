/**
 * 🎯 จุด Lots 7 จุดของ Hermes (Paulus Alexandrinus ค.ศ. 378) — สูตรกลางวัน/กลางคืน
 * ตรงกับตารางใน Wikipedia "Arabic parts" (Hermetic lots) · ต้องรู้เวลาเกิด (ใช้ลัคนา)
 *   Fortune  = Asc + Moon − Sun      (กลางคืนสลับ)
 *   Spirit   = Asc + Sun − Moon
 *   Eros     = Asc + Venus − Spirit
 *   Victory  = Asc + Jupiter − Spirit
 *   Necessity= Asc + Fortune − Mercury
 *   Courage  = Asc + Fortune − Mars
 *   Nemesis  = Asc + Fortune − Saturn
 */
import { norm360, position, type BodyPosition, type NatalChart } from "./natal";

export type LotId = "fortune" | "spirit" | "eros" | "victory" | "necessity" | "courage" | "nemesis";
export const LOT_IDS: readonly LotId[] = ["fortune", "spirit", "eros", "victory", "necessity", "courage", "nemesis"];

export interface Lot {
  id: LotId;
  lon: number;
  sign: number;
  degInSign: number;
  house: number | null;
}

export function hermeticLots(chart: NatalChart): Lot[] | null {
  const g = (id: string) => chart.bodies.find((b) => b.id === id)?.lon;
  const asc = g("asc");
  const sun = g("sun");
  const moon = g("moon");
  const venus = g("venus");
  const mercury = g("mercury");
  const mars = g("mars");
  const jupiter = g("jupiter");
  const saturn = g("saturn");
  if (asc === undefined || sun === undefined || moon === undefined || chart.dayChart === null) return null;
  const day = chart.dayChart;
  // กลางวัน: Asc + A − B · กลางคืน: Asc + B − A
  const lot = (a: number, b: number) => norm360(day ? asc + a - b : asc + b - a);
  const fortune = lot(moon, sun);
  const spirit = lot(sun, moon);
  const vals: Record<LotId, number> = {
    fortune,
    spirit,
    eros: lot(venus!, spirit),
    victory: lot(jupiter!, spirit),
    necessity: lot(fortune, mercury!),
    courage: lot(fortune, mars!),
    nemesis: lot(fortune, saturn!),
  };
  return LOT_IDS.map((id) => {
    const p: BodyPosition = position("fortune", vals[id], 0, chart.houses);
    return { id, lon: p.lon, sign: p.sign, degInSign: p.degInSign, house: p.house };
  });
}
