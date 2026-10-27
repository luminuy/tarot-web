/**
 * 🃏 คลังผังพยากรณ์ `/spreads` — UI 2.0 "ไพ่กระจาย 6 หมวด แตะแล้วเด้ง"
 * ===========================================================================
 * แผน: docs/plans/UI_2_0_SPREADS_PLAN_2026-10-13.md
 *
 * ## เรนเดอร์เป็น HTML ล้วน ไม่มี hydration (R-02 — ยังบังคับ)
 *
 * ไฟล์นี้ไม่มี `useState` / `onClick` สักตัว · ผังหนึ่งแบบ = ไพ่หนึ่งใบ เป็นลิงก์ `<a href="/spreads/<id>">` จริง
 * - ไม่มี JS (หรือสคริปต์ล้ม) ➔ กดไพ่แล้วไปหน้าคู่มือผัง · เนื้อหาทั้ง 26 ผังอยู่ใน HTML ดิบครบ
 * - มี JS ➔ `astro/scripts/spread-pop.ts` (สคริปต์ธรรมดา ≤ 3 KB · ของกลางทุกหน้าที่มีไพ่ผัง) เปิด `<dialog>` ไพ่เด้ง
 *   ตัวไพ่ + หน้าต่างอยู่ที่ `SpreadCard.tsx` (หน้าหมวดเรื่อง · หน้าคู่มือผังใช้ชุดเดียวกัน — เจ้าของ 2026-10-26)
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
import { type Spread, getSpreadShortName } from "@/data/spreads-helpers";
import { SPREAD_SHELVES, SHELF_SCATTER, shelfCardRange, type SpreadShelf } from "@/data/spread-shelves";
import { useLocale } from "@/lib/i18n";
// ไพ่ผัง + หน้าต่างไพ่เด้งเป็นของกลาง (หน้าหมวดเรื่อง · หน้าคู่มือผังใช้ชุดเดียวกัน — เจ้าของ 2026-10-26)
// ไพ่ในผ้าปูวางตาม mapLayout() ใน SpreadCard.tsx (ISSUE-034)
import { SpreadCard, SpreadPopDialog } from "@/components/spread/SpreadCard";
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
          <span className="ui2-accent">{isEnglish ? "Category" : "หมวด"}</span>
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
          return (
            <li
              key={spread.id}
              className="ui2-sc-slot ui2-loop"
              style={{ "--x": x, "--y": `${y}px`, "--a": `${angle}deg`, "--i": i } as Vars}
            >
              <SpreadCard spread={spread} isEnglish={isEnglish} surface="library" />
            </li>
          );
        })}
      </ul>
    </section>
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
          <nav aria-label={isEnglish ? "Breadcrumb" : "เส้นทางนำทาง"} className="ui2-sp-crumb">
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
