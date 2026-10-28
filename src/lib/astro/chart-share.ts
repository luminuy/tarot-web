/**
 * 🔗 ส่งผังให้เพื่อน — แปลงข้อมูลเกิด ➔ ลิงก์ `/natal-chart#add=…` และถอดกลับพร้อมตรวจค่าทุกช่อง
 * ---------------------------------------------------------------------------
 * - ข้อมูลอยู่หลังเครื่องหมาย `#` (fragment) ซึ่งเบราว์เซอร์ไม่ส่งให้เซิร์ฟเวอร์ · ผู้ใช้กดสร้างลิงก์เองเท่านั้น
 *   และหน้าจอเตือนว่าลิงก์มีวันเวลาสถานที่เกิด ส่งให้คนที่ไว้ใจ
 * - ฝั่งรับ: ถอดแล้วตรวจช่วงค่าทุกช่อง (ลิงก์แก้มือได้) · ผิดรูปแบบ = ปฏิเสธทั้งก้อน ไม่เดาค่าแทน
 * - บันทึกลงเครื่องเมื่อผู้รับกดบันทึกเองเท่านั้น
 */
import type { ChartSpec } from "./chart-spec";
import type { HouseSystem, NodeType, Zodiac } from "./natal";

const HOUSES: readonly HouseSystem[] = ["placidus", "whole", "koch", "equal", "porphyry", "regiomontanus", "campanus"];
const VERSION = 1;

function toB64Url(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64Url(s: string): string | null {
  try {
    const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function encodeChartShare(spec: ChartSpec): string {
  const p = spec.place;
  const compact = {
    v: VERSION,
    n: spec.name.slice(0, 40),
    y: spec.yearCe,
    m: spec.month,
    d: spec.day,
    h: spec.hour,
    i: spec.minute,
    t: spec.timeKnown ? 1 : 0,
    p: [p.mode, p.label.slice(0, 80), (p.labelEn ?? "").slice(0, 80), +p.lat.toFixed(4), +p.lon.toFixed(4), p.zone ?? "", p.fixedOffset ?? null, p.refId ?? ""],
    s: spec.houseSystem,
    o: spec.nodeType,
    r: spec.orbScale,
    z: spec.zodiac ?? "tropical",
  };
  return toB64Url(JSON.stringify(compact));
}

const int = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isInteger(v) && v >= lo && v <= hi ? v : null);
const num = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi ? v : null);
const str = (v: unknown, max: number) => (typeof v === "string" && v.length <= max && !/[<>]/.test(v) ? v : null);

function validZone(z: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: z });
    return true;
  } catch {
    return false;
  }
}

/** ถอดรหัสจากลิงก์ · ค่าใดผิดช่วง = คืน null ทั้งก้อน */
export function decodeChartShare(code: string): ChartSpec | null {
  if (!/^[A-Za-z0-9_-]{10,1200}$/.test(code)) return null;
  const json = fromB64Url(code);
  if (!json) return null;
  let o: Record<string, unknown>;
  try {
    o = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (o.v !== VERSION || !Array.isArray(o.p) || o.p.length !== 8) return null;
  const [mode, label, labelEn, lat, lon, zone, off, refId] = o.p as unknown[];
  const name = str(o.n, 40);
  const y = int(o.y, 1900, 2100);
  const m = int(o.m, 1, 12);
  const d = int(o.d, 1, 31);
  const h = int(o.h, 0, 23);
  const mi = int(o.i, 0, 59);
  const la = num(lat, -90, 90);
  const lo = num(lon, -180, 180);
  const lb = str(label, 80);
  const lbe = str(labelEn, 80);
  const zn = str(zone, 64);
  const ref = str(refId, 40);
  const s = typeof o.s === "string" && (HOUSES as readonly string[]).includes(o.s) ? (o.s as HouseSystem) : null;
  const nt = o.o === "true" || o.o === "mean" ? (o.o as NodeType) : null;
  const r = num(o.r, 0.5, 1.5);
  const z = o.z === "tropical" || o.z === "lahiri" ? (o.z as Zodiac) : null;
  if (name === null || y === null || m === null || d === null || h === null || mi === null || la === null || lo === null || lb === null || lbe === null || zn === null || ref === null) return null;
  if (s === null || nt === null || r === null || z === null || (o.t !== 0 && o.t !== 1)) return null;
  if (mode !== "thai" && mode !== "world" && mode !== "custom") return null;
  if (d > new Date(Date.UTC(y, m, 0)).getUTCDate()) return null;
  const fixedOffset = off === null ? undefined : int(off, -840, 840);
  if (fixedOffset === null) return null;
  if (zn && !validZone(zn)) return null;
  if (!zn && fixedOffset === undefined) return null;
  return {
    name,
    yearCe: y,
    month: m,
    day: d,
    hour: h,
    minute: mi,
    timeKnown: o.t === 1,
    place: { mode, label: lb, labelEn: lbe || undefined, lat: la, lon: lo, zone: zn || undefined, fixedOffset, refId: ref || undefined },
    houseSystem: s,
    nodeType: nt,
    orbScale: r,
    zodiac: z,
  };
}
