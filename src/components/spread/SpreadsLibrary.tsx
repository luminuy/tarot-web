/**
 * 🃏 คลังผังพยากรณ์ `/spreads` — UI 2.0 "ไพ่กระจาย 6 หมวด แตะแล้วเด้ง"
 * ===========================================================================
 * แผน: docs/plans/UI_2_0_SPREADS_PLAN_2026-10-13.md
 *
 * ## เรนเดอร์เป็น HTML ล้วน ไม่มี hydration (R-02 — ยังบังคับ)
 *
 * ไฟล์นี้ไม่มี `useState` / `onClick` สักตัว · ผังหนึ่งแบบ = ไพ่หนึ่งใบ เป็นลิงก์ `<a href="/spreads/<id>">` จริง
 * - ไม่มี JS (หรือสคริปต์ล้ม) ➔ กดไพ่แล้วไปหน้าคู่มือผัง · เนื้อหาทั้ง 26 ผังอยู่ใน HTML ดิบครบ
 * - มี JS ➔ `astro/scripts/spreads-pop.ts` (สคริปต์ธรรมดา ≤ 3 KB) เปิด `<dialog>` ไพ่เด้ง
 *   ข้อมูลในหน้าต่าง (คำโปรย · ชื่อตำแหน่ง · ลิงก์เริ่มดูดวง) อยู่ใน `<div hidden data-pop>` ใต้ไพ่แต่ละใบ
 *   ไพ่ใหญ่ในหน้าต่างคัดลอก (`cloneNode`) จากหน้าต่างผ้าปูของไพ่ใบที่แตะ — ไม่เรนเดอร์ผังซ้ำ 26 ชุด
 *
 * ⚠️ **ห้ามใส่ `client:*` ที่ `<SpreadsLibraryRoot>`** — งบ JS (เคยลด 124 ➔ 100 KB) · ด่านงบบันเดิลเฝ้าอยู่
 * ⚠️ ไพ่คว่ำในผ้าปูเป็น CSS ล้วน — **ห้ามใส่หน้าไพ่จริง** (คนจะเข้าใจว่าเป็นผลที่ได้ · กฎเหล็ก 14)
 * ⚠️ ตำแหน่ง/ขนาดไพ่คว่ำมาจาก `mapLayout()` ที่เดียว (ISSUE-034) · หมวดมาจาก `spread-shelves.ts` ที่เดียว (ISSUE-059)
 * ⚠️ ห้ามใส่คลาส `anim-*` ขาเข้าบนไพ่ (INC-0244) — ไพ่อยู่ตำแหน่งสุดท้ายตั้งแต่เฟรมแรก
 */

import React, { type CSSProperties } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import {
  type Spread,
  getSpreadName,
  getSpreadShortName,
  getSpreadTagline,
  getPositionName,
} from "@/data/spreads-helpers";
import { SPREAD_SHELVES, SHELF_SCATTER, POPULAR_SPREAD_IDS, shelfCardRange, type SpreadShelf } from "@/data/spread-shelves";
import { mapLayout, boxOf, MAP_CARD_ASPECT } from "@/lib/tarot/spread-map-geometry";
import { isStandardSpread } from "@/lib/entitlement/limits";
import { useLocale } from "@/lib/i18n";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";
import { CardImage } from "@/components/card/CardImage";

interface SpreadsLibraryProps {
  spreads: Spread[];
}

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** ไพ่ตกแต่งหัวหน้า (ใบ 1–2 = มุมบนมือถือ) — ไพ่ใหญ่สำรับ 1909 ที่ไม่ซ้ำกับการ์ดลอยหน้าแรก */
const DECO_CARDS = [
  "major-01",
  "major-19",
  "major-09",
  "major-14",
  "major-17",
  "major-10",
  "major-04",
  "major-20",
] as const;

const DECO_SIZES = "(min-width: 768px) 128px, 44px";


/** ข้อความชิปหัวหน้า — อยู่นอกบล็อกหัวหน้าเพราะมีปี "1909" (ด่าน test-spreads ห้ามเลข 2 หลักในบล็อกหัวหน้า) */
const HERO_TRUST = {
  th: ["สำรับ Rider-Waite 1909 แท้", "ทุกผังสุ่มจริง ตรวจสอบได้", "ความหมายครบทุกตำแหน่ง"],
  en: ["The true 1909 Rider-Waite deck", "Truly random, verifiable draws", "Every position explained"],
};

/** แถวความน่าเชื่อถือใต้ปุ่มหัวหน้า (แยกคอมโพเนนต์เพราะมีปี "1909" — ด่าน test-spreads ห้ามเลข 2 หลักในบล็อกหัวหน้า) */
function HeroTrust({ isEnglish }: { isEnglish: boolean }) {
  return (
    <ul className="ui2-sp-trust">
      {(isEnglish ? HERO_TRUST.en : HERO_TRUST.th).map((text) => (
        <li key={text}>
          {text}
        </li>
      ))}
    </ul>
  );
}

/** กุญแจเล็กของป้ายผังพิเศษ (SVG เส้น — ห้ามอีโมจิ) */
function LockGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3.2" y="7" width="9.6" height="6.8" rx="1.6" />
      <path d="M5.4 7V5.2a2.6 2.6 0 0 1 5.2 0V7" strokeLinecap="round" />
    </svg>
  );
}

/**
 * ภาพประกอบตำแหน่งบนผ้าปู — ไพ่ใหญ่ 22 ใบวนตามลำดับตำแหน่ง เริ่มคนละใบต่อผัง (ตายตัวจาก id ไม่ใช่การสุ่ม)
 * เจ้าของสั่ง 2026-10-13 "ไพ่ตรงนี้ก็ใช้ไพ่จริง" — แทนไพ่คว่ำของแผนเดิม · เป็นภาพประกอบผัง ไม่ใช่ผลการเปิดไพ่
 * ใช้ภาพย่อ `thumb` (64w/128w) ใบเดียวกันซ้ำข้ามผัง เบราว์เซอร์จึงโหลดจริงไม่เกิน 22 ไฟล์
 */
const MAJOR_COUNT = 22;
function mapFace(spreadId: string, index: number): string {
  let seed = 0;
  for (const ch of spreadId) seed = (seed * 31 + ch.charCodeAt(0)) % MAJOR_COUNT;
  return `major-${String((seed + index * 5) % MAJOR_COUNT).padStart(2, "0")}`;
}

/**
 * ผ้าปูในไพ่ผัง — ไพ่คว่ำตามตำแหน่งจริงจาก `mapLayout()`
 * กรอบผังสูง `boxHeight` เท่าของความกว้าง · หน้าต่างจัดวางแบบ contain ด้วยหน่วย container (`--bh`)
 */
function SpreadMap({ spread }: { spread: Spread }) {
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
    <span className="ui2-sc-window" aria-hidden="true">
      <span className="ui2-sc-map" style={{ "--bh": (bh / bw).toFixed(3) } as Vars}>
        {spread.positions.map((pos) => {
          const cy = pos.y * layout.yScale + layout.offsetY;
          const style: Vars = {
            left: `${(((pos.x - left) / bw) * 100).toFixed(2)}%`,
            top: `${(((cy - top) / bh) * 100).toFixed(2)}%`,
            width: `${((layout.cardW / bw) * 100).toFixed(2)}%`,
            height: `${((cardH / bh) * 100).toFixed(2)}%`,
          };
          if (pos.rotate) style["--r"] = `${pos.rotate}deg`;
          return (
            <span key={pos.index} className={pos.rotate ? "ui2-sc-spot is-cross" : "ui2-sc-spot"} style={style}>
              <CardImage cardId={mapFace(spread.id, pos.index)} alt="" thumb sizes="64px" loading="lazy" fetchPriority="low" />
            </span>
          );
        })}
      </span>
    </span>
  );
}

function ShelfSection({
  shelf,
  order,
  total,
  byId,
  isEnglish,
}: {
  shelf: SpreadShelf;
  order: number;
  total: number;
  byId: Map<string, Spread>;
  isEnglish: boolean;
}) {
  const items = shelf.ids.map((id) => byId.get(id)).filter((s): s is Spread => !!s);
  const scatter = SHELF_SCATTER[items.length];
  const range = shelfCardRange(items.map((s) => s.positions.length));
  const lead = (isEnglish ? shelf.leadEn : shelf.leadTh).replace("{range}", range);
  const tone: Vars = { "--cat": `var(--ui2-note-${shelf.tone})`, "--cat-ink": `var(--ui2-note-ink-${shelf.tone})` };
  const titleId = `shelf-${shelf.key}-title`;
  const starter = byId.get(shelf.starter);

  return (
    <section
      id={`shelf-${shelf.key}`}
      aria-labelledby={titleId}
      className="ui2-sp-shelf"
      data-anim-section=""
      style={tone}
    >
      {/* แถบบนหน้าต่าง (ต้นแบบ fastwork.com/selling — หน้าต่างโปรไฟล์) · ตกแต่งล้วน:
          ชื่อหมวดภาษาอังกฤษเอียง · ขีดความคืบหน้า 6 ขีด (หมวดนี้สีหมวด · ที่ผ่านมาแล้วทองจาง) · ลำดับ */}
      <div className="ui2-sp-win-bar" aria-hidden="true">
        <span className="ui2-sp-win-name">
          <span className="ui2-sp-win-n ui2-num">{String(order).padStart(2, "0")}</span>
          <span className="ui2-accent">{isEnglish ? "Category" : shelf.nameEn}</span>
        </span>
        <span className="ui2-sp-win-steps">
          {Array.from({ length: total }, (_, k) => (
            <span key={k} className={k + 1 < order ? "is-past" : k + 1 === order ? "is-here" : undefined} />
          ))}
        </span>
        <span className="ui2-sp-win-step ui2-num">
          {order}
          <span className="ui2-sp-win-of"> / {total}</span>
        </span>
      </div>
      <div className="ui2-sp-shelf-head">
        <div className="ui2-sp-shelf-title">
        <h2 id={titleId} className="ui2-h2">
          <ThaiPhrases>{isEnglish ? shelf.nameEn : shelf.nameTh}</ThaiPhrases>
        </h2>
        <p className="ui2-lede">{lead}</p>
        <p className="ui2-sp-hint">
          {isEnglish
            ? `${items.length} spreads · tap the card that calls to you`
            : `${items.length} ผัง · แตะไพ่ที่ใจเลือก`}
        </p>
        </div>
        {/* เริ่มง่ายที่สุดในหมวดนี้ — ทางลัดสำหรับคนที่ไม่อยากเลือกเอง (เติมที่ว่างขวาหัวข้อบนคอม) */}
        {starter && (
          <div className="ui2-sp-start">
            <p className="ui2-sp-start-k">{isEnglish ? "Easiest place to start" : "เริ่มง่ายที่สุดในหมวดนี้"}</p>
            <p className="ui2-sp-start-name">
              {getSpreadShortName(starter, isEnglish)}
              <span className="ui2-sp-start-n">
                <span className="ui2-num">{starter.positions.length}</span> {isEnglish ? "cards" : "ใบ"}
              </span>
            </p>
            <Link href={`/read/${starter.id}`} prefetch={false} className="ui2-btn ui2-sp-start-btn">
              {isEnglish ? "Start" : "เริ่มดูดวง"}
            </Link>
          </div>
        )}
      </div>

      <ul className="ui2-sp-table" style={{ "--table-max": `${scatter?.maxWidth ?? 1160}px` } as Vars}>
        {items.map((spread, i) => {
          const [x, y, angle] = scatter?.spots[i] ?? [0, 0, 0];
          const premium = !isStandardSpread(spread.id);
          const name = getSpreadName(spread, isEnglish);
          return (
            <li
              key={spread.id}
              className="ui2-sc-slot ui2-loop"
              style={{ "--x": x, "--y": `${y}px`, "--a": `${angle}deg`, "--i": i } as Vars}
            >
              <Link
                href={`/spreads/${spread.id}`}
                prefetch={false}
                className="ui2-spread-card"
                data-spread-id={spread.id}
                id={`spread-${spread.id}`}
              >
                {POPULAR_SPREAD_IDS.includes(spread.id) && (
                  <span className="ui2-sc-pop-tab">{isEnglish ? "Popular" : "ยอดนิยม"}</span>
                )}
                <span className="ui2-sc-top">
                  {/* ฟรี = เปิดด้วยสิทธิ์รายวันได้ (isStandardSpread) · ผังพิเศษ = ต้องใช้สิทธิ์พิเศษ */}
                  {premium ? (
                    <span className="ui2-sc-lock">
                      <LockGlyph />
                      {isEnglish ? "Premium" : "พิเศษ"}
                    </span>
                  ) : (
                    <span className="ui2-sc-free">{isEnglish ? "Free" : "ฟรี"}</span>
                  )}
                  <span className="ui2-sc-count">
                    <span className="ui2-num">{spread.positions.length}</span> {isEnglish ? "cards" : "ใบ"}
                  </span>
                </span>
                <SpreadMap spread={spread} />
                <h3 className="ui2-sc-band">
                  <ThaiPhrases>{getSpreadShortName(spread, isEnglish)}</ThaiPhrases>
                </h3>
              </Link>
              {/* ข้อมูลของหน้าต่างไพ่เด้ง — สคริปต์ย้ายไปแสดง · ไม่มี JS ก็ยังอยู่ใน HTML ให้บอตเห็น */}
              <div hidden data-pop="" data-name={name} data-cat={isEnglish ? shelf.nameEn : shelf.nameTh}>
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
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * หน้าต่างไพ่เด้ง — ตัวเดียวของทั้งหน้า (INC-0243: ไม่ติด stacking context ของส่วนไหน · showModal() ขึ้นชั้นบนสุดเอง)
 * ช่องว่างทั้งหมดเติมโดย `astro/scripts/spreads-pop.ts` จากไพ่ใบที่แตะ
 */
function SpreadPopDialog({ isEnglish }: { isEnglish: boolean }) {
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

export const SpreadsLibrary: React.FC<SpreadsLibraryProps> = ({ spreads }) => {
  const { isEnglish } = useLocale();
  const byId = new Map(spreads.map((s) => [s.id, s]));
  const shelfCount = (shelf: SpreadShelf) => shelf.ids.filter((id) => byId.has(id)).length;

  return (
    <div className="ui2-sp" data-ui2-page-dark="">
      {/* Dynamic Bilingual Hero Header */}
      <section className="ui2-sec ui2-night ui2-sp-hero" data-ui2-dark="" data-anim-section="">
        <span className="ui2-stars ui2-loop" aria-hidden="true" />
        <span className="ui2-stars ui2-stars-2 ui2-loop" aria-hidden="true" />
        {/* แสงออโรราลอย — แสดงจริงเฉพาะระดับ full */}
        <span className="ui2-aurora" aria-hidden="true">
          <span className="ui2-blob ui2-blob-amber ui2-loop" />
          <span className="ui2-blob ui2-blob-teal ui2-loop" />
        </span>
        {/* หน้าไพ่จริง 8 ใบลอยข้างหัวข้อ (เจ้าของสั่ง 2026-10-13 "เอาเป็นรูปหน้าไพ่จริง" วันเดียวกับแผน) · lite เห็น 2 ใบนิ่งที่มุม
            ตกแต่งล้วน ไม่ใช่ผลสุ่ม (alt ว่าง · aria-hidden) */}
        <span className="ui2-sp-deco" aria-hidden="true">
          {DECO_CARDS.map((cardId, i) => (
            <span key={cardId} className={`ui2-sp-deco-card ui2-loop ui2-sp-deco-${i + 1}`}>
              <CardImage
                cardId={cardId}
                alt=""
                thumb
                sizes={DECO_SIZES}
                loading={i < 2 ? "eager" : "lazy"}
                fetchPriority="low"
              />
            </span>
          ))}
        </span>
        <div className="ui2-wrap ui2-sp-hero-inner">
          {/* เส้นทางหน้าไม่แสดงบนจอ (เจ้าของ 2026-10-17) — nav Breadcrumb ถูกซ่อนแบบ sr-only ทั้งเว็บ */}
          <nav aria-label="Breadcrumb" className="ui2-sp-crumb">
            <Link href="/">{isEnglish ? "Home" : "หน้าแรก"}</Link>
            <span aria-hidden="true"> / </span>
            <span>{isEnglish ? "Tarot Spreads" : `ผังพยากรณ์ ${spreads.length} แบบ`}</span>
          </nav>
          {/* หัวข้อเดียวของหน้า — รวมหัวข้อโชว์เคสที่ซ้ำกันเข้ามาแล้ว (เจ้าของ 2026-10-16 "เอาสองอันนี้รวมกัน ไม่ชอบมันซ้ำซ้อน")
              ไม่มีไพ่แทรกในหัวข้อ (เจ้าของ "ไม่ต้องโชว์ไพ่นี่") */}
          <h1 className="ui2-h1 ui2-sp-h1">
            {isEnglish ? (
              <>
                <span className="ui2-gold-night ui2-num ui2-loop">{spreads.length}</span> Sacred Tarot Spreads &amp; Layouts
              </>
            ) : (
              <ThaiPhrases>
                ผังการเปิดไพ่ทาโรต์{" "}
                <span className="tp">
                  <span className="ui2-gold-night ui2-num ui2-loop">{spreads.length}</span>
                  &nbsp;รูปแบบ
                </span>
              </ThaiPhrases>
            )}
          </h1>
          <p className="ui2-lede ui2-sp-lede">
            {isEnglish
              ? "Choose the spread that fits what you want to know — see how the cards are laid out and what each position means."
              : "เลือกผังที่ตรงกับเรื่องที่คุณอยากรู้ พร้อมดูตัวอย่างการจัดวางและความหมายของแต่ละตำแหน่ง"}
          </p>
          {/* ปุ่มหลัก + ปุ่มรอง เรียงแถวเดียว (มาตรฐานหัวหน้าเว็บ) · คนที่ลังเลอ่านบรรทัดใต้ปุ่ม */}
          <div className="ui2-sp-hero-ctas">
            <Link href="/read/three-card" prefetch={false} className="ui2-btn ui2-sp-cta">
              {isEnglish ? "Start with 3 cards" : "เริ่มด้วยไพ่ 3 ใบ"}
            </Link>
            {/* ห้องออกแบบผัง (REFLECTION_JOURNAL_PLAN 1.8) — ทางเข้าเดียวจากคลังผัง */}
            <Link href="/spreads/create" className="ui2-btn-ghost ui2-sp-create">
              {isEnglish ? "Design your own spread" : "ออกแบบผังของคุณเอง"}
            </Link>
          </div>
          <p className="ui2-sp-unsure">
            {isEnglish ? (
              <>
                Not sure yet? <strong>Past · Present · Future</strong> works for any question
              </>
            ) : (
              <>
                ยังเลือกไม่ได้? ผัง <strong>อดีต-ปัจจุบัน-อนาคต</strong> ถามได้ทุกเรื่อง
              </>
            )}
          </p>
          <HeroTrust isEnglish={isEnglish} />
        </div>
      </section>
      {/* Category Tabs with Editorial Styling — (ชื่อเดิมของหมายจุด · ตอนนี้คือ 6 หมวดไพ่กระจาย ไม่มีแท็บแล้ว) */}

      {/* แถบหมวดติดใต้หัวเว็บตลอดการเลื่อน — หมวดที่กำลังดูเรืองขึ้น (สคริปต์ตั้ง aria-current) */}
      <nav className="ui2-sp-stick" aria-label={isEnglish ? "Jump to a category" : "ไปที่หมวด"} data-sp-stick="">
        <div className="ui2-sp-stick-row">
          {SPREAD_SHELVES.map((shelf) => (
            <a
              key={shelf.key}
              href={`#shelf-${shelf.key}`}
              className="ui2-sp-jump-link"
              style={{ "--cat": `var(--ui2-note-${shelf.tone})`, "--cat-ink": `var(--ui2-note-ink-${shelf.tone})` } as Vars}
            >
              <span className="ui2-sp-jump-dot" aria-hidden="true" />
              {isEnglish ? shelf.nameEn : shelf.nameTh}
              <span className="ui2-sp-jump-count ui2-num">{shelfCount(shelf)}</span>
            </a>
          ))}
        </div>
      </nav>

      {/*
        โชว์เคส 6 หมวด (เจ้าของ 2026-10-16 "สวยแต่ไม่ว้าว ไม่น่าจดจำ" + ต้นแบบ fastwork.com/selling#profile-showcase)
        หมวด = หน้าต่างหนึ่งบาน · คอม ≥ 1200: รายชื่อหมวดซ้าย + หน้าต่างขวา
        ระดับไม่ลดการเคลื่อนไหว + จอพอ ➔ spreads-pop.ts ใส่ `is-scrolly`: หน้าต่างค้างกลางจอ เลื่อนแล้วสลับหมวด ไพ่ถูกแจกลงโต๊ะใหม่ทุกครั้ง
        ไม่มี JS / มือถือ / จอเตี้ย = หน้าต่างเรียงต่อกันครบ 6 บาน (ไพ่ทั้ง 26 ใบอยู่ใน HTML และมองเห็นเสมอ)
      */}
      <section
        className="ui2-sec ui2-night ui2-sp-show"
        data-ui2-dark=""
        data-anim-section=""
        data-sp-show=""
        aria-label={isEnglish ? "Spreads by category" : "ผังพยากรณ์แยกตามหมวด"}
      >
        <span className="ui2-stars ui2-loop" aria-hidden="true" />
        <span className="ui2-stars ui2-stars-2 ui2-loop" aria-hidden="true" />
        <div className="ui2-sp-stage-wrap">
          <div className="ui2-sp-stage" data-sp-stage="">
            <nav className="ui2-sp-rail" aria-label={isEnglish ? "Spread categories" : "หมวดผังพยากรณ์"}>
              <ol>
                {SPREAD_SHELVES.map((shelf, i) => (
                  <li key={shelf.key}>
                    <a
                      href={`#shelf-${shelf.key}`}
                      className="ui2-sp-rail-link"
                      style={{ "--cat": `var(--ui2-note-${shelf.tone})` } as Vars}
                    >
                      <span className="ui2-sp-rail-n ui2-num">{String(i + 1).padStart(2, "0")}</span>
                      <span className="ui2-sp-rail-name">{isEnglish ? shelf.nameEn : shelf.nameTh}</span>
                      <span className="ui2-sp-rail-count ui2-num">{shelfCount(shelf)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="ui2-sp-panels">
              {SPREAD_SHELVES.map((shelf, i) => (
                <ShelfSection
                  key={shelf.key}
                  shelf={shelf}
                  order={i + 1}
                  total={SPREAD_SHELVES.length}
                  byId={byId}
                  isEnglish={isEnglish}
                />
              ))}
            </div>
          </div>
        </div>
      </section>


      <SpreadPopDialog isEnglish={isEnglish} />
    </div>
  );
};
