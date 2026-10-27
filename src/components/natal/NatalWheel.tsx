"use client";

import { ZODIAC_SIGNS } from "@/data/zodiac";
import { BODY_TEXT, type Lang } from "@/data/natal/content";
import { ASPECT_DEFS, SIGN_ELEMENT, norm360, type AspectType, type BodyId, type BodyPosition, type NatalChart } from "@/lib/astro/natal";

/**
 * 🪐 วงผังดวง (SVG) — ลัคนาอยู่ซ้าย (9 นาฬิกา) ราศีเดินทวนเข็มนาฬิกาแบบผังโหราสากล
 * ไม่รู้เวลาเกิด: ไม่มีเรือน/แกน ให้ราศีเมษอยู่ซ้าย
 * ดาวใช้ตัวย่อ (ไม่ใช้สัญลักษณ์ดาว — กฎเหล็ก 2) · ตารางใต้ผังคือข้อมูลเดียวกันในรูปข้อความ
 */

const C = 320;
const R_OUT = 290;
const R_SIGN = 246;
const R_LABEL = 204;
const R_DEG = 172;
const R_ASP = 132;
const R_HOUSE_N = 146;

const WHEEL_BODIES: readonly BodyId[] = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto", "chiron", "node", "lilith"];
const MIN_SEP = 10.5;

function pt(r: number, lon: number, ref: number): [number, number] {
  const th = ((180 + lon - ref) * Math.PI) / 180;
  return [C + r * Math.cos(th), C - r * Math.sin(th)];
}

/** กระจายตำแหน่งป้ายดาวไม่ให้ทับกัน (ดันออกจากกันทีละคู่จนห่างอย่างน้อย MIN_SEP องศา) */
function spread(lons: number[]): number[] {
  const n = lons.length;
  if (n < 2) return [...lons];
  const order = lons.map((l, i) => ({ l, i })).sort((a, b) => a.l - b.l);
  const pos = order.map((o) => o.l);
  for (let iter = 0; iter < 80; iter++) {
    let moved = false;
    for (let k = 0; k < n; k++) {
      const a = k;
      const b = (k + 1) % n;
      let gap = pos[b] - pos[a];
      if (b === 0) gap += 360;
      if (gap < MIN_SEP) {
        const push = (MIN_SEP - gap) / 2;
        pos[a] -= push;
        pos[b] += push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  const out = Array<number>(n);
  order.forEach((o, k) => (out[o.i] = norm360(pos[k])));
  return out;
}

function arcPath(r1: number, r2: number, from: number, to: number, ref: number): string {
  const [x1, y1] = pt(r2, from, ref);
  const [x2, y2] = pt(r2, to, ref);
  const [x3, y3] = pt(r1, to, ref);
  const [x4, y4] = pt(r1, from, ref);
  // เดินทวนเข็ม (sweep 0) บนจอเพราะแกน y กลับด้าน
  return `M${x1},${y1} A${r2},${r2} 0 0 0 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 0 1 ${x4},${y4} Z`;
}

export function NatalWheel({
  chart,
  lang,
  focus,
  onFocus,
  showMinor,
  outer,
}: {
  chart: NatalChart;
  lang: Lang;
  focus: BodyId | null;
  onFocus: (id: BodyId | null) => void;
  showMinor: boolean;
  /** วงนอก (ดาวจร/ดาวก้าวหน้า) — วาดเป็นแถบรอบวงราศี · เส้นมุมเปลี่ยนเป็นมุมระหว่างวงนอกกับผังเกิด */
  outer?: { bodies: readonly BodyPosition[]; aspects: readonly { a: BodyId; b: BodyId; type: AspectType; orb: number; maxOrb: number }[] };
}) {
  const asc = chart.bodies.find((b) => b.id === "asc");
  const mc = chart.bodies.find((b) => b.id === "mc");
  const ref = asc ? asc.lon : 0;
  const drawn = chart.bodies.filter((b) => WHEEL_BODIES.includes(b.id));
  const labelLon = spread(drawn.map((b) => b.lon));
  const posOf = new Map(drawn.map((b) => [b.id, b.lon]));
  if (asc) posOf.set("asc", asc.lon);
  if (mc) posOf.set("mc", mc.lon);
  const majorTypes = new Set(ASPECT_DEFS.filter((d) => d.major).map((d) => d.type));
  const toneOf = new Map(ASPECT_DEFS.map((d) => [d.type, d.tone]));
  const aspects = outer
    ? []
    : chart.aspects.filter((a) => posOf.has(a.a) && posOf.has(a.b) && (showMinor || majorTypes.has(a.type)) && a.type !== "conjunction");
  const R_OUT2 = R_OUT + 52;
  const outerBodies = outer ? outer.bodies.filter((b) => WHEEL_BODIES.includes(b.id)) : [];
  const outerLabelLon = spread(outerBodies.map((b) => b.lon));
  const outerPos = new Map(outerBodies.map((b) => [b.id, b.lon]));
  const axisR = outer ? R_OUT2 : R_OUT;

  const label =
    lang === "th"
      ? `วงผังดวงกำเนิด ${chart.houses ? "ลัคนาอยู่ด้านซ้าย" : "ไม่มีเรือนเพราะไม่ทราบเวลาเกิด"} รายละเอียดทั้งหมดอยู่ในตารางด้านล่าง`
      : `Natal chart wheel, ${chart.houses ? "Ascendant on the left" : "no houses because the birth time is unknown"}. Full details are in the tables below.`;

  return (
    <svg viewBox={outer ? "-90 -48 820 736" : "-36 0 712 640"} className="v2-nt-wheel" role="img" aria-label={label}>
      {outer && <circle cx={C} cy={C} r={R_OUT2} className="nw-outer-band" />}
      <circle cx={C} cy={C} r={R_OUT} className="nw-bg" />
      {/* วงราศี 12 ช่อง สีตามธาตุ */}
      {ZODIAC_SIGNS.map((s, i) => {
        const [lx, ly] = pt((R_OUT + R_SIGN) / 2, i * 30 + 15, ref);
        return (
          <g key={s.id}>
            <path d={arcPath(R_SIGN, R_OUT, i * 30, i * 30 + 30, ref)} className={`nw-sign nw-${SIGN_ELEMENT[i]}`} />
            <text x={lx} y={ly} className="nw-sign-label">
              {lang === "th" ? s.nameTh.replace("ราศี", "") : s.nameEn.slice(0, 3)}
            </text>
          </g>
        );
      })}
      {/* ขีดองศา ทุก 5 องศา (ทุก 10 ยาวกว่า) */}
      {Array.from({ length: 72 }, (_, k) => {
        const lon = k * 5;
        const len = k % 2 === 0 ? 9 : 5;
        const [x1, y1] = pt(R_SIGN, lon, ref);
        const [x2, y2] = pt(R_SIGN - len, lon, ref);
        return <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} className={k % 2 === 0 ? "nw-tick nw-tick-10" : "nw-tick"} />;
      })}
      <circle cx={C} cy={C} r={R_SIGN} className="nw-ring" />
      <circle cx={C} cy={C} r={R_ASP} className="nw-ring" />

      {/* เส้นแบ่งเรือน + เลขเรือน */}
      {chart.houses?.map((cusp, i) => {
        const next = chart.houses![(i + 1) % 12];
        const mid = cusp + norm360(next - cusp) / 2;
        const [x1, y1] = pt(R_ASP, cusp, ref);
        const [x2, y2] = pt(R_SIGN, cusp, ref);
        const [nx, ny] = pt(R_HOUSE_N, mid, ref);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} className="nw-cusp" />
            <text x={nx} y={ny} className="nw-house-n">
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* แกนลัคนา-จุดตก และกลางฟ้า-ก้นฟ้า */}
      {asc && mc && (
        <g>
          {[
            { lon: asc.lon, text: lang === "th" ? "ลัคนา" : "ASC" },
            { lon: asc.lon + 180, text: lang === "th" ? "จุดตก" : "DSC" },
            { lon: mc.lon, text: "MC" },
            { lon: mc.lon + 180, text: "IC" },
          ].map((ax) => {
            const [x1, y1] = pt(R_ASP, ax.lon, ref);
            const [x2, y2] = pt(R_OUT, ax.lon, ref);
            // ป้ายแกนซ้าย/ขวาชิดขอบด้านนอก (ไม่ให้ตัวหนังสือล้นกรอบภาพ) · บน/ล่างจัดกลาง
            const [px] = pt(R_OUT, ax.lon, ref);
            const side = px < C - 60 ? "end" : px > C + 60 ? "start" : "middle";
            const [tx, ty] = pt(side === "middle" ? axisR + 18 : axisR + 6, ax.lon, ref);
            return (
              <g key={ax.text}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} className="nw-axis" />
                <text x={tx} y={ty} className="nw-axis-label" style={{ textAnchor: side }}>
                  {ax.text}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* เส้นมุมสัมพันธ์ */}
      {aspects.map((a) => {
        const [x1, y1] = pt(R_ASP, posOf.get(a.a)!, ref);
        const [x2, y2] = pt(R_ASP, posOf.get(a.b)!, ref);
        const dim = focus !== null && a.a !== focus && a.b !== focus;
        const minor = !majorTypes.has(a.type);
        return (
          <line
            key={`${a.a}-${a.b}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`nw-asp nw-asp-${toneOf.get(a.type)}${minor ? " nw-asp-minor" : ""}${dim ? " is-dim" : ""}`}
            opacity={Math.max(0.35, 1 - a.orb / (a.maxOrb + 0.01))}
          />
        );
      })}

      {/* วงนอก: ดาวจร/ดาวก้าวหน้า + เส้นมุมไปหาดาวเกิด */}
      {outer?.aspects.map((a) => {
        const lonA = outerPos.get(a.a);
        const lonB = posOf.get(a.b);
        if (lonA === undefined || lonB === undefined) return null;
        const [x1, y1] = pt(R_ASP, lonA, ref);
        const [x2, y2] = pt(R_ASP, lonB, ref);
        const dim = focus !== null && a.b !== focus;
        return (
          <line
            key={`o-${a.a}-${a.b}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            className={`nw-asp nw-asp-${toneOf.get(a.type)}${dim ? " is-dim" : ""}`}
            opacity={Math.max(0.4, 1 - a.orb / (a.maxOrb + 0.01))}
          />
        );
      })}
      {outerBodies.map((b, i) => {
        const [tx1, ty1] = pt(R_OUT, b.lon, ref);
        const [tx2, ty2] = pt(R_OUT + 8, b.lon, ref);
        const [lx, ly] = pt(R_OUT + 28, outerLabelLon[i], ref);
        const short = BODY_TEXT[b.id].short[lang];
        return (
          <g key={`o-${b.id}`} aria-hidden="true">
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} className="nw-pos-tick" />
            <circle cx={lx} cy={ly} r={17} className="nw-planet-bg nw-outer" />
            <text x={lx} y={ly} className="nw-planet-label" style={{ fontSize: short.length > 3 ? 10 : short.length > 2 ? 12 : 16 }}>
              {short}
            </text>
          </g>
        );
      })}

      {/* ดาว: ขีดตำแหน่งจริงที่ขอบวงราศี + เส้นนำไปป้าย */}
      {drawn.map((b, i) => {
        const [tx1, ty1] = pt(R_SIGN, b.lon, ref);
        const [tx2, ty2] = pt(R_SIGN - 14, b.lon, ref);
        const [lx, ly] = pt(R_LABEL, labelLon[i], ref);
        const [lxl, lyl] = pt(R_LABEL + 16, labelLon[i], ref);
        const [dx, dy] = pt(R_DEG, labelLon[i], ref);
        const short = BODY_TEXT[b.id].short[lang];
        const isFocus = focus === b.id;
        return (
          <g
            key={b.id}
            className={`nw-planet${isFocus ? " is-focus" : ""}`}
            role="button"
            tabIndex={0}
            aria-label={`${BODY_TEXT[b.id].name[lang]} ${Math.floor(b.degInSign)}`}
            aria-pressed={isFocus}
            onClick={() => onFocus(isFocus ? null : b.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onFocus(isFocus ? null : b.id);
              }
            }}
          >
            <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} className="nw-pos-tick" />
            <line x1={tx2} y1={ty2} x2={lxl} y2={lyl} className="nw-leader" />
            <circle cx={lx} cy={ly} r={19} className="nw-planet-bg" />
            <text x={lx} y={ly} className="nw-planet-label" style={short.length > 2 ? { fontSize: short.length > 3 ? 11 : 14 } : undefined}>
              {short}
            </text>
            <text x={dx} y={dy} className="nw-planet-deg">
              {Math.floor(b.degInSign)}°{b.retrograde && !["node", "lilith"].includes(b.id) ? <tspan className="nw-retro"> R</tspan> : null}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
