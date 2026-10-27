/**
 * 🔎 ค้นหาเมืองเกิดทั่วโลก — ค้นในเครื่องผู้ใช้ทั้งหมด (คำค้นไม่ออกจากเครื่อง)
 * โหลดฐานข้อมูลเมือง (`cities-world.ts` · ~475 KB gzip) ครั้งเดียวเมื่อผู้ใช้เปิดช่องค้นหา
 */
import { CITY_ADMINS, CITY_ROWS, CITY_ZONES } from "@/data/natal/cities-world";

export interface CityHit {
  name: string;
  th: string;
  country: string;
  admin: string;
  lat: number;
  lon: number;
  zone: string;
  tier: number;
}

interface Indexed extends CityHit {
  key: string;
  keyTh: string;
}

let index: Indexed[] | null = null;

/** ตัดวรรณยุกต์/เครื่องหมายเสียงของอักษรละติน + ตัวพิมพ์เล็ก ("São Paulo" ➔ "sao paulo") */
export function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function build(): Indexed[] {
  if (index) return index;
  index = CITY_ROWS.split("\n").map((line) => {
    const [name, th, country, ai, lat, lon, zi, tier] = line.split("|");
    return {
      name,
      th,
      country,
      admin: CITY_ADMINS[Number(ai)] ?? "",
      lat: Number(lat),
      lon: Number(lon),
      zone: CITY_ZONES[Number(zi)],
      tier: Number(tier),
      key: fold(name),
      keyTh: th.replace(/\s+/g, ""),
    };
  });
  return index;
}

export function cityCount(): number {
  return build().length;
}

/**
 * ค้นหา: ขึ้นต้นตรงกันมาก่อน มีคำค้นอยู่ข้างในมาทีหลัง · ในกลุ่มเดียวกันเมืองใหญ่ก่อน
 * พิมพ์ "ชื่อเมือง, ประเทศ/รัฐ" ได้ (เช่น "springfield, illinois")
 */
export function searchCities(query: string, limit = 12): CityHit[] {
  const raw = query.trim();
  if (!raw) return [];
  const [cityPart, ...rest] = raw.split(",");
  const q = fold(cityPart);
  const qTh = cityPart.replace(/\s+/g, "");
  const extra = fold(rest.join(" "));
  const isThai = /[฀-๿]/.test(cityPart);
  if (!q && !qTh) return [];
  const scored: { c: Indexed; s: number }[] = [];
  for (const c of build()) {
    let s = -1;
    if (isThai) {
      if (!c.keyTh) continue;
      if (c.keyTh === qTh) s = 3;
      else if (c.keyTh.startsWith(qTh)) s = 2;
      else if (c.keyTh.includes(qTh)) s = 1;
    } else {
      if (c.key === q) s = 3;
      else if (c.key.startsWith(q)) s = 2;
      else if (q.length >= 3 && c.key.includes(q)) s = 1;
    }
    if (s < 0) continue;
    if (extra) {
      const hay = fold(`${c.admin} ${c.country}`);
      if (!hay.includes(extra)) continue;
    }
    // พิมพ์ไทย = ส่วนใหญ่หาเมืองไทย ➔ ดันเมืองไทยขึ้นก่อนเมืองต่างประเทศที่ชื่อไทยคล้ายกัน (เชียง ➔ เชียงใหม่ ก่อน เชียงรุ้ง)
    scored.push({ c, s: s * 100 + (isThai && c.country === "TH" ? 50 : 0) + c.tier });
  }
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, limit).map(({ c }) => ({
    name: c.name,
    th: c.th,
    country: c.country,
    admin: c.admin,
    lat: c.lat,
    lon: c.lon,
    zone: c.zone,
    tier: c.tier,
  }));
}
