/**
 * 🃏 ไพ่ผัง (หนึ่งผัง = ไพ่งาช้างหนึ่งใบ) + หน้าต่างไพ่เด้ง — ของกลางทุกหน้าที่โชว์ผัง
 * ===========================================================================
 * แผน: docs/plans/UI_2_0_SPREADS_PLAN_2026-10-13.md หัวข้อ 4–5 · คำตอบเจ้าของข้อ 12 (2026-10-26):
 *   "หน้าคู่มือรายผัง `/spreads/<id>` และหน้าหมวดเรื่อง `/spreads/topic/*` ใช้ไพ่ผังแบบเดียวกับคลังผัง"
 *
 * ใช้ที่: คลังผัง `/spreads` (SpreadsLibrary) · หน้าหมวดเรื่อง (TopicSpreadList) · หน้าคู่มือรายผัง (SpreadDetailClient)
 * สไตล์: `src/styles/ui2-spread-card.css` (ไฟล์เล็กแยก — หน้าอื่นไม่ต้องโหลดคลังผังทั้งไฟล์)
 * สคริปต์: `astro/scripts/spread-pop.ts` (เปิดหน้าต่าง + นับการแตะ `spread_card_tap`)
 *
 * ⚠️ เรนเดอร์เป็น HTML ล้วน ไม่มี state / onClick — ห้าม hydrate (R-02 · งบ JS)
 * ⚠️ ไพ่เป็น `<a href="/spreads/<id>">` จริง: ไม่มี JS = ไปหน้าคู่มือผัง · มี JS = เปิดหน้าต่างไพ่เด้ง
 * ⚠️ ตำแหน่ง/ขนาดไพ่ในผ้าปูมาจาก `mapLayout()` ที่เดียว (ISSUE-034) · สีหมวดมาจาก `spread-shelves.ts` ที่เดียว
 * ⚠️ หน้าไพ่ในผ้าปูเป็นภาพประกอบตำแหน่ง (เจ้าของ 2026-10-13 "ไพ่ตรงนี้ก็ใช้ไพ่จริง") ไม่ใช่ผลสุ่ม — เลือกตายตัวจาก id
 * ⚠️ ห้ามใส่คลาส `anim-*` ขาเข้าบนไพ่ (INC-0244)
 */

import type { CSSProperties } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import {
  type Spread,
  getSpreadName,
  getSpreadShortName,
  getSpreadTagline,
  getPositionName,
} from "@/data/spreads-helpers";
import { POPULAR_SPREAD_IDS, shelfOf } from "@/data/spread-shelves";
import { mapLayout, boxOf, MAP_CARD_ASPECT } from "@/lib/tarot/spread-map-geometry";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { CardImage } from "@/components/card/CardImage";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * ที่มาของการแตะไพ่ผัง — ส่งไป GA4 กับ event `spread_card_tap` (เจ้าของ 2026-10-26 ตอบคำถามเปิดข้อ 2)
 * library = คลังผัง `/spreads` · topic = หน้าหมวดเรื่อง · detail_more = "ผังอื่นที่น่าสนใจ" ท้ายหน้าคู่มือผัง
 */
export type SpreadCardSurface = "library" | "topic" | "detail_more";

/** สีหมวดของผัง (`--cat` / `--cat-ink`) — ผังที่ไม่อยู่หมวดไหน (ไม่ควรเกิด · ด่าน test-spreads) ใช้สีหมวดแรก */
export function spreadTone(spreadId: string): Vars {
  const tone = shelfOf(spreadId)?.tone ?? 4;
  return { "--cat": `var(--ui2-note-${tone})`, "--cat-ink": `var(--ui2-note-ink-${tone})` };
}

/** กุญแจเล็กของป้ายผังพิเศษ (SVG เส้น — ห้ามอีโมจิ) */
export function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.2" y="7" width="9.6" height="6.8" rx="1.6" />
      <path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ภาพประกอบตำแหน่งบนผ้าปู — ไพ่ใหญ่ 22 ใบวนตามลำดับตำแหน่ง เริ่มคนละใบต่อผัง (ตายตัวจาก id ไม่ใช่การสุ่ม)
 * ใช้ภาพย่อ `thumb` (64w/128w) ใบเดียวกันซ้ำข้ามผัง เบราว์เซอร์จึงโหลดจริงไม่เกิน 22 ไฟล์
 */
const MAJOR_COUNT = 22;
function mapFace(spreadId: string, index: number): string {
  let seed = 0;
  for (const ch of spreadId) seed = (seed * 31 + ch.charCodeAt(0)) % MAJOR_COUNT;
  return `major-${String((seed + index * 5) % MAJOR_COUNT).padStart(2, "0")}`;
}

/**
 * ผ้าปูในไพ่ผัง — ไพ่ตามตำแหน่งจริงจาก `mapLayout()`
 * กรอบผังสูง `boxHeight` เท่าของความกว้าง · หน้าต่างจัดวางแบบ contain ด้วยหน่วย container (`--bh`)
 *
 * `slots` (หน้าคู่มือผัง): ทุกตำแหน่งเป็นปุ่มแตะดูความหมาย (`astro/scripts/spread-board.ts`) แทนช่องตกแต่ง
 */
export function SpreadMap({
  spread,
  slots,
  imageSizes = "64px",
}: {
  spread: Spread;
  /** ชื่อตำแหน่ง (เรียงตามลำดับ) — ใส่เมื่อแต่ละตำแหน่งต้องเป็นปุ่มที่แตะได้ */
  slots?: readonly string[];
  imageSizes?: string;
}) {
  const layout = mapLayout(spread.positions);
  const cardH = layout.cardW * MAP_CARD_ASPECT;
  /*
   * ครอปกรอบให้พอดีกลุ่มไพ่จริง (เจ้าของ "ปรับขนาดไพ่ให้พอดีกรอบ") — ขยายทุกใบเท่ากัน ระยะห่างตาม mapLayout()
   * จึงไม่ทับกันเหมือนเดิม (ISSUE-034) · ผังไพ่น้อยใบ (1–3) กันไม่ให้ใบเดียวโตเต็มผ้าปู: ไพ่กว้างไม่เกิน 40% ของกลุ่ม
   */
  const boxes = spread.positions.map((pos) => boxOf(pos, layout));
  let left = Math.min(...boxes.map((b) => b.left));
  let right = Math.max(...boxes.map((b) => b.right));
  let top = Math.min(...boxes.map((b) => b.top));
  let bottom = Math.max(...boxes.map((b) => b.bottom));
  const minW = layout.cardW / 0.4;
  if (right - left < minW) {
    const grow = (minW - (right - left)) / 2;
    left -= grow;
    right += grow;
  }
  const minH = cardH / 0.62;
  if (bottom - top < minH) {
    const grow = (minH - (bottom - top)) / 2;
    top -= grow;
    bottom += grow;
  }
  const bw = right - left;
  const bh = bottom - top;
  return (
    <span className="ui2-sc-window" aria-hidden={slots ? undefined : "true"}>
      <span className="ui2-sc-map" style={{ "--bh": (bh / bw).toFixed(3) } as Vars}>
        {spread.positions.map((pos, i) => {
          const cy = pos.y * layout.yScale + layout.offsetY;
          const style: Vars = {
            left: `${(((pos.x - left) / bw) * 100).toFixed(2)}%`,
            top: `${(((cy - top) / bh) * 100).toFixed(2)}%`,
            width: `${((layout.cardW / bw) * 100).toFixed(2)}%`,
            height: `${((cardH / bh) * 100).toFixed(2)}%`,
          };
          if (pos.rotate) style["--r"] = `${pos.rotate}deg`;
          const className = pos.rotate ? "ui2-sc-spot is-cross" : "ui2-sc-spot";
          const face = (
            <CardImage cardId={mapFace(spread.id, pos.index)} alt="" thumb sizes={imageSizes} loading="lazy" fetchPriority="low" />
          );
          return slots ? (
            <button
              key={pos.index}
              type="button"
              className={`${className} v2-sd-slot`}
              style={style}
              aria-pressed={i === 0}
              aria-label={`${i + 1}. ${slots[i] ?? ""}`}
            >
              {face}
            </button>
          ) : (
            <span key={pos.index} className={className} style={style}>
              {face}
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** แถวบนของไพ่: ฟรี / ผังพิเศษ ซ้าย · จำนวนใบขวา */
function CardTop({ spread, isEnglish }: { spread: Spread; isEnglish: boolean }) {
  const n = spread.positions.length;
  return (
    <span className="ui2-sc-top">
      {/* ฟรี = เปิดด้วยสิทธิ์รายวันได้ (isStandardSpread) · ผังพิเศษ = ต้องใช้สิทธิ์พิเศษ */}
      {isStandardSpread(spread.id) ? (
        <span className="ui2-sc-free">{isEnglish ? "Free" : "ฟรี"}</span>
      ) : (
        <span className="ui2-sc-lock">
          <LockGlyph />
          {isEnglish ? "Premium" : "พิเศษ"}
        </span>
      )}
      <span className="ui2-sc-count">
        <span className="ui2-num">{n}</span> {isEnglish ? (n === 1 ? "card" : "cards") : "ใบ"}
      </span>
    </span>
  );
}

/**
 * ไพ่ผังที่แตะได้ + ข้อมูลของหน้าต่างไพ่เด้ง
 * ⚠️ คืน 2 ชิ้นพี่น้องกัน (ลิงก์ไพ่ + `<div hidden data-pop>`) — ผู้เรียกต้องห่อด้วยกล่องของตัวเองหนึ่งชั้น
 *    (`spread-pop.ts` หาข้อมูลจาก `card.parentElement`)
 */
export function SpreadCard({
  spread,
  isEnglish,
  surface,
  band = "h3",
}: {
  spread: Spread;
  isEnglish: boolean;
  surface: SpreadCardSurface;
  /** แถบชื่อผังเป็นหัวข้อ `h3` (คลังผัง) หรือข้อความธรรมดา (หน้าที่มีหัวข้อชื่อผังอยู่ข้าง ๆ แล้ว) */
  band?: "h3" | "p";
}) {
  const shelf = shelfOf(spread.id);
  const Band = band;
  return (
    <>
      <Link
        href={`/spreads/${spread.id}`}
        prefetch={false}
        className="ui2-spread-card"
        data-spread-id={spread.id}
        data-shelf={shelf?.key}
        data-surface={surface}
        id={`spread-${spread.id}`}
        style={spreadTone(spread.id)}
      >
        {POPULAR_SPREAD_IDS.includes(spread.id) && <span className="ui2-sc-pop-tab">{isEnglish ? "Popular" : "ยอดนิยม"}</span>}
        <CardTop spread={spread} isEnglish={isEnglish} />
        <SpreadMap spread={spread} />
        <Band className="ui2-sc-band">
          <ThaiPhrases>{getSpreadShortName(spread, isEnglish)}</ThaiPhrases>
        </Band>
      </Link>
      {/* ข้อมูลของหน้าต่างไพ่เด้ง — สคริปต์ย้ายไปแสดง · ไม่มี JS ก็ยังอยู่ใน HTML ให้บอตเห็น */}
      <div
        hidden
        data-pop=""
        data-name={getSpreadName(spread, isEnglish)}
        data-cat={shelf ? (isEnglish ? shelf.nameEn : shelf.nameTh) : ""}
      >
        <p>{getSpreadTagline(spread, isEnglish)}</p>
        <ol data-positions="">
          {spread.positions.map((pos) => (
            <li key={pos.index}>{getPositionName(pos, isEnglish).replace(/^\d+\.\s*/, "")}</li>
          ))}
        </ol>
        <Link href={`/read/${spread.id}`} prefetch={false} data-start="">
          {isEnglish ? "Start a reading with this spread" : "เริ่มดูดวงด้วยผังนี้"}
        </Link>
      </div>
    </>
  );
}

/**
 * ไพ่ผังใบใหญ่ของหน้าคู่มือผัง (ไม่ใช่ลิงก์ — เป็นผังของหน้านี้เอง) · ทุกตำแหน่งเป็นปุ่มแตะดูความหมาย
 * ป้ายใต้ไพ่และแถวในตารางตำแหน่งสว่างตาม (`astro/scripts/spread-board.ts`)
 */
export function SpreadHeroCard({
  spread,
  isEnglish,
  slots,
}: {
  spread: Spread;
  isEnglish: boolean;
  slots: readonly string[];
}) {
  return (
    <div className="ui2-spread-card ui2-sd-card" style={spreadTone(spread.id)}>
      <CardTop spread={spread} isEnglish={isEnglish} />
      <SpreadMap spread={spread} slots={slots} imageSizes="(min-width: 960px) 72px, 56px" />
      <p className="ui2-sc-band">
        <ThaiPhrases>{getSpreadShortName(spread, isEnglish)}</ThaiPhrases>
      </p>
    </div>
  );
}

/**
 * หน้าต่างไพ่เด้ง — ตัวเดียวต่อหน้า (INC-0243: สคริปต์ย้ายไปไว้ใต้ <body> จึงไม่ติด stacking context ของส่วนไหน)
 * ช่องว่างทั้งหมดเติมโดย `astro/scripts/spread-pop.ts` จากไพ่ใบที่แตะ
 */
export function SpreadPopDialog({ isEnglish }: { isEnglish: boolean }) {
  return (
    <dialog className="ui2-spread-pop" aria-labelledby="spread-pop-title" data-spread-pop="" data-anim-section="">
      <div className="ui2-pop-inner">
        <button
          type="button"
          className="ui2-pop-x"
          data-pop-close=""
          aria-label={isEnglish ? "Close and go back to all spreads" : "ปิด แล้วกลับไปเลือกไพ่ใบอื่น"}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />
          </svg>
        </button>
        <div className="ui2-pop-stage">
          <span className="ui2-pop-glow ui2-loop" aria-hidden="true" />
          <div className="ui2-spread-card ui2-pop-card" data-pop-card="" aria-hidden="true" />
        </div>
        <div className="ui2-pop-panel">
          <div className="ui2-pop-chips">
            <span className="ui2-pop-chip ui2-pop-chip-cat" data-pop-cat="" />
            <span className="ui2-pop-chip" data-pop-count="" />
            <span className="ui2-pop-chip ui2-pop-chip-premium" data-pop-premium="" hidden>
              <LockGlyph />
              {isEnglish ? "Premium spread" : "ผังพิเศษ"}
            </span>
          </div>
          <h2 id="spread-pop-title" className="ui2-pop-title" data-pop-title="" />
          <p className="ui2-pop-tagline" data-pop-tagline="" />
          <ol className="ui2-pop-list" data-pop-list="" />
          <div className="ui2-pop-actions">
            <a className="ui2-btn" data-pop-start="" href="#">
              <span className="ui2-btn-ring ui2-loop" aria-hidden="true" />
              {isEnglish ? "Start a reading with this spread" : "เริ่มดูดวงด้วยผังนี้"}
            </a>
            <a className="ui2-pop-guide" data-pop-guide="" href="#">
              {isEnglish ? "Read the spread guide" : "อ่านคู่มือผังนี้"}
            </a>
            <button type="button" className="ui2-pop-back" data-pop-close="">
              {isEnglish ? "Back to all spreads" : "กลับไปเลือกไพ่ใบอื่น"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
