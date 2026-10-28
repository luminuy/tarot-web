/**
 * ⭐ ดาวฤกษ์ที่โหราศาสตร์ใช้ (ดาวฤกษ์หลวง 4 ดวง · Behenian 15 ดวง · ดาวสว่างอื่น) + ดาวในผังที่ทับดาวฤกษ์
 * ---------------------------------------------------------------------------
 * พิกัด ICRS (J2000) และการเคลื่อนที่เฉพาะ (proper motion) จาก Hipparcos/SIMBAD ตามที่รวมไว้ใน `sefstars.txt`
 * ของ Swiss Ephemeris — ใช้เฉพาะตัวเลขข้อเท็จจริงทางดาราศาสตร์
 * ตำแหน่ง ณ วันเกิด: เลื่อนตาม proper motion แล้วให้ astronomy-engine ทำการหมุนควง nutation และ aberration
 * (`DefineStar` ➔ `GeoVector` ➔ `Ecliptic` = สุริยวิถีจริงของวันนั้น) · ด่านเทียบลองจิจูด ค.ศ. 2000 กับตารางอ้างอิง
 */
import { Body, DefineStar, Ecliptic, GeoVector, MakeTime } from "astronomy-engine";
import { angularDistance, norm360, zodiacShift, type BodyId, type NatalChart } from "./natal";

/** [ชื่อ, รหัสไบเออร์ย่อ, RA ชั่วโมง, Dec องศา, pmRA×cosDec (mas/ปี), pmDec (mas/ปี), ความสว่าง] */
const STARS: readonly [string, string, number, number, number, number, number][] = [
  ["Algol", "bePer", 3.1361479, 40.9556467, 2.99, -1.66, 2.12],
  ["Alcyone", "etTau", 3.79141015, 24.1051356, 19.34, -43.67, 2.87],
  ["Aldebaran", "alTau", 4.59867752, 16.5093024, 63.45, -188.94, 0.86],
  ["Rigel", "beOri", 5.24229781, -8.2016384, 1.31, 0.5, 0.13],
  ["Capella", "alAur", 5.2781552, 45.9979915, 75.25, -426.89, 0.08],
  ["Bellatrix", "gaOri", 5.4188509, 6.3497033, -8.11, -12.88, 1.64],
  ["Betelgeuse", "alOri", 5.91952927, 7.407064, 27.54, 11.3, 0.42],
  ["Sirius", "alCMa", 6.75247702, -16.7161159, -546.01, -1223.07, -1.46],
  ["Canopus", "alCar", 6.39919719, -52.6956614, 19.93, 23.24, -0.74],
  ["Castor", "alGem", 7.57663144, 31.8882822, -191.45, -145.19, 1.58],
  ["Pollux", "beGem", 7.75526385, 28.0261989, -626.55, -45.8, 1.14],
  ["Procyon", "alCMi", 7.65503319, 5.2249876, -714.59, -1036.8, 0.37],
  ["Regulus", "alLeo", 10.13953083, 11.9672088, -248.73, 5.59, 1.4],
  ["Zosma", "deLeo", 11.23513928, 20.5237181, 143.42, -129.88, 2.53],
  ["Denebola", "beLeo", 11.81766065, 14.5720581, -497.68, -114.67, 2.13],
  ["Vindemiatrix", "epVir", 13.03627718, 10.9591504, -273.8, 19.96, 2.79],
  ["Algorab", "deCrv", 12.49773755, -16.5154312, -210.49, -138.74, 2.94],
  ["Spica", "alVir", 13.41988316, -11.1613195, -42.35, -30.67, 0.97],
  ["Arcturus", "alBoo", 14.26102002, 19.1824092, -1093.39, -2000.06, -0.05],
  ["Alkaid", "etUMa", 13.79234382, 49.3132667, -121.17, -14.91, 1.86],
  ["Zubenelgenubi", "al2Lib", 14.84797586, -16.0417765, -105.68, -68.4, 2.75],
  ["Zubeneschamali", "beLib", 15.28344828, -9.3829144, -98.1, -19.65, 2.62],
  ["Alphecca", "alCrB", 15.57813, 26.7146928, 120.27, -89.58, 2.24],
  ["Antares", "alSco", 16.49012769, -26.4320026, -12.11, -23.3, 0.91],
  ["Vega", "alLyr", 18.61564899, 38.7836889, 200.94, 286.23, 0.03],
  ["Altair", "alAql", 19.84638849, 8.8683212, 536.23, 385.29, 0.76],
  ["Deneb Algedi", "deCap", 21.78401229, -16.1272871, 261.7, -296.7, 2.83],
  ["Deneb Adige", "alCyg", 20.69053198, 45.2803388, 2.01, 1.85, 1.25],
  ["Fomalhaut", "alPsA", 22.96084618, -29.622237, 328.95, -164.67, 1.16],
  ["Scheat", "bePeg", 23.06290485, 28.0827871, 187.65, 136.93, 2.42],
  ["Markab", "alPeg", 23.07934818, 15.2052671, 60.4, -41.3, 2.48],
  ["Achernar", "alEri", 1.62856819, -57.2367528, 87.0, -38.24, 0.46],
  ["Polaris", "alUMi", 2.53030404, 89.264109, 44.48, -11.85, 2.02],
  ["Hamal", "alAri", 2.11955714, 23.4624176, 188.55, -148.08, 2.01],
  ["Mirach", "beAnd", 1.16220108, 35.6205576, 175.9, -112.2, 2.05],
];

export const ROYAL_STARS = new Set(["Aldebaran", "Regulus", "Antares", "Fomalhaut"]);
export const BEHENIAN_STARS = new Set(["Algol", "Alcyone", "Aldebaran", "Capella", "Sirius", "Procyon", "Regulus", "Alkaid", "Algorab", "Spica", "Arcturus", "Alphecca", "Antares", "Vega", "Deneb Algedi"]);

export interface StarPosition {
  name: string;
  bayer: string;
  /** ลองจิจูดสุริยวิถี (สายนะ หรือ นิรายนะตามผัง) */
  lon: number;
  /** ละติจูดสุริยวิถี */
  lat: number;
  mag: number;
}

const J2000_MS = Date.UTC(2000, 0, 1, 12);

/** ตำแหน่งดาวฤกษ์ทุกดวง ณ ขณะ `utcMs` (ระบบราศีตาม `zodiac`) */
export function fixedStarPositions(utcMs: number, zodiac?: NatalChart["input"]["zodiac"]): StarPosition[] {
  const years = (utcMs - J2000_MS) / (365.25 * 86400000);
  const time = MakeTime(new Date(utcMs));
  const ay = zodiacShift(zodiac, utcMs);
  return STARS.map(([name, bayer, ra, dec, pmra, pmdec, mag]) => {
    const decNow = dec + (pmdec * years) / 3.6e6;
    const cosd = Math.cos((dec * Math.PI) / 180);
    const raNow = ra + (cosd > 1e-6 ? (pmra * years) / 3.6e6 / cosd / 15 : 0);
    DefineStar(Body.Star1, raNow, decNow, 1000);
    const e = Ecliptic(GeoVector(Body.Star1, time, true));
    return { name, bayer, lon: norm360(e.elon - ay), lat: e.elat, mag };
  });
}

export interface StarContact {
  star: StarPosition;
  body: BodyId;
  orb: number;
}

/** จุดในผังที่ใช้ดูดาวฤกษ์ — ดาวหลัก + มุมฟ้า (orb 1 องศาตามธรรมเนียม · ดวงอาทิตย์/จันทร์/มุมฟ้า 1.5) */
const CONTACT_BODIES: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "node", "asc", "mc", "fortune"];

export function starContacts(chart: NatalChart, stars = fixedStarPositions(chart.input.utcMs, chart.input.zodiac)): StarContact[] {
  const out: StarContact[] = [];
  for (const b of chart.bodies) {
    if (!CONTACT_BODIES.includes(b.id)) continue;
    const maxOrb = ["sun", "moon", "asc", "mc"].includes(b.id) ? 1.5 : 1;
    for (const s of stars) {
      // ดาวฤกษ์ที่ละติจูดสุริยวิถีห่างมาก (เช่น ดาวเหนือ) ไม่ได้อยู่ใกล้ดาวจริง ๆ — ใช้ลองจิจูดตามธรรมเนียมโหรตะวันตก
      const orb = angularDistance(b.lon, s.lon);
      if (orb <= maxOrb) out.push({ star: s, body: b.id, orb });
    }
  }
  return out.sort((a, b) => a.orb - b.orb);
}
