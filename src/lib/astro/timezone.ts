/**
 * 🕰️ เวลาท้องถิ่น ➔ เวลาสากล (UTC) สำหรับผังดวงกำเนิด
 * ===========================================================================
 * ใช้ฐานข้อมูลเขตเวลาของเบราว์เซอร์ผ่าน `Intl` (IANA tzdb) — รู้เวลาออมแสงและเขตเวลาย้อนหลังเอง
 * เช่น ไทยก่อน 1 เม.ย. 2463 ใช้เวลาท้องถิ่นกรุงเทพฯ +6:42:04 ไม่ใช่ +7
 * ไม่ต้องเก็บตารางเขตเวลาเองในบันเดิล
 */

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function formatter(zone: string): Intl.DateTimeFormat {
  let f = dtfCache.get(zone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      era: "short",
    });
    dtfCache.set(zone, f);
  }
  return f;
}

/** ส่วนต่างเวลาท้องถิ่นของเขต `zone` จาก UTC ณ ขณะ `utcMs` (หน่วยนาที · มีเศษได้ เช่น 402.07) */
export function zoneOffsetMinutes(zone: string, utcMs: number): number {
  const parts = formatter(zone).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? Number.NaN);
  const eraBc = parts.find((p) => p.type === "era")?.value === "BC";
  let year = get("year");
  if (eraBc) year = 1 - year;
  const asUtc = Date.UTC(year, get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  // Date.UTC ตีความปี 0–99 เป็น 1900+ ➔ ตั้งปีใหม่ตรง ๆ
  const d = new Date(asUtc);
  d.setUTCFullYear(year);
  const wholeSecondUtc = Math.floor(utcMs / 1000) * 1000;
  return (d.getTime() - wholeSecondUtc) / 60000;
}

/** เวลาท้องถิ่นตามนาฬิกาในเขต `zone` ➔ ขณะ UTC (ms) และส่วนต่างที่ใช้ */
export function localToUtc(
  zone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): { utcMs: number; offsetMinutes: number } {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  const wallFixed = new Date(wall);
  wallFixed.setUTCFullYear(year);
  const wallMs = wallFixed.getTime();
  // วนสองรอบพอ: เดาครั้งแรกด้วยส่วนต่าง ณ เวลานาฬิกา แล้วแก้ด้วยส่วนต่าง ณ ขณะที่ได้
  let offset = zoneOffsetMinutes(zone, wallMs);
  let utcMs = wallMs - offset * 60000;
  const offset2 = zoneOffsetMinutes(zone, utcMs);
  if (offset2 !== offset) {
    offset = offset2;
    utcMs = wallMs - offset * 60000;
  }
  return { utcMs, offsetMinutes: offset };
}

/** ส่วนต่างแบบระบุเอง (นาที) ➔ ขณะ UTC */
export function localToUtcFixed(
  offsetMinutes: number,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): number {
  const wall = new Date(Date.UTC(year, month - 1, day, hour, minute));
  wall.setUTCFullYear(year);
  return wall.getTime() - offsetMinutes * 60000;
}

/** แสดงส่วนต่างเป็น "UTC+7" / "UTC+6:42:04" / "UTC-5" */
export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? "-" : "+";
  const total = Math.round(Math.abs(offsetMinutes) * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (s) return `UTC${sign}${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  if (m) return `UTC${sign}${h}:${String(m).padStart(2, "0")}`;
  return `UTC${sign}${h}`;
}
