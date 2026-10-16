/**
 * 🌌 หัวหน้า UI 2.0 กลาง — ภาษาภาพชุดเดียวกับหัวหน้า /spreads (เจ้าของ 2026-10-16 "ต้องสวย ต้องว้าว เหมือนหน้าที่ทำมาก่อนหน้านี้")
 * ===========================================================================
 * หัวเล็กสีทอง (เส้นทางหน้า) ➔ h1 (คำเน้นทองไล่สี) ➔ คำโปรย ➔ ปุ่ม ➔ บรรทัดเล็ก ➔ แคปซูลความน่าเชื่อถือ
 * ไพ่จริงลอย 2 แนวต่อข้าง (ระดับ full · lite เห็น 2 ใบนิ่งที่มุม) + แสงทองนุ่มกลางหัวข้อ
 * สไตล์: `src/styles/ui2-page.css` (`.ui2-ph*`) · เอฟเฟกต์ full: `ui2-page-fx.css`
 *
 * ไม่มี hook — ใช้ได้ทั้งคอมโพเนนต์ฝั่งเซิร์ฟเวอร์และใน island
 * ⚠️ ไพ่ลอยเป็นของตกแต่ง (alt ว่าง · aria-hidden) ไม่ใช่ผลการสุ่ม (กฎเหล็ก 14)
 * ⚠️ ห้ามอีโมจิ/สัญลักษณ์ตกแต่ง — ใช้ `GoldMark` (กฎเหล็ก 2)
 */
import type { ReactNode } from "react";

import { CardImage } from "@/components/card/CardImage";
import { GoldMark } from "@/components/ui/GoldMark";
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export interface Ui2Crumb {
  label: string;
  href?: string;
}

export interface Ui2PageHeroProps {
  crumbs?: Ui2Crumb[];
  /** h1 — ข้อความล้วน (ห่อวลีไทยให้เอง) · ใช้ `accent` ระบุคำที่จะเป็นทองไล่สี */
  title: string;
  accent?: string;
  /** แทน `title` เมื่อต้องจัด h1 เอง (ต้องห่อ ThaiPhrases เอง) */
  titleNode?: ReactNode;
  lede?: ReactNode;
  /** ปุ่ม — ใช้คลาส `ui2-btn ui2-btn-gold` / `ui2-btn-ghost` */
  actions?: ReactNode;
  note?: ReactNode;
  trust?: readonly string[];
  /** ไพ่จริงลอยข้างหัวข้อ (สูงสุด 6 ใบ: ใหญ่ซ้าย · กลางซ้าย · ใหญ่ขวา · กลางขวา · เล็กซ้ายบน · เล็กขวาบน) */
  cards?: readonly string[];
  /** เนื้อหาเพิ่มใต้หัวข้อ (เช่น ช่องค้นหา) */
  children?: ReactNode;
  /** หัวหน้าแบบเตี้ย (หน้าที่มีเนื้อหาหลักต่อทันที เช่น หน้าบทความ) */
  compact?: boolean;
  /** id ของ h1 (ให้ aria-labelledby) */
  titleId?: string;
}

const DEFAULT_CARDS = ["major-01", "major-02", "major-17", "major-10", "major-14", "major-04"] as const;
const CARD_SIZES = "(min-width: 768px) 128px, 44px";

/** ห่อวลี: หลายวลี ➔ ThaiPhrases · วลีเดียว ➔ `.tp` ตรง ๆ (ThaiPhrases ไม่ห่อข้อความวลีเดียว · ด่าน thai-glyph) */
function Phrase({ text }: { text: string }) {
  return /\s/.test(text.trim()) ? <ThaiPhrases>{text}</ThaiPhrases> : <span className="tp">{text}</span>;
}

function TitleWithAccent({ title, accent }: { title: string; accent?: string }) {
  const at = accent ? title.indexOf(accent) : -1;
  if (!accent || at < 0) return <Phrase text={title} />;
  const before = title.slice(0, at).trimEnd();
  const after = title.slice(at + accent.length).trimStart();
  return (
    <>
      {before && (
        <>
          <Phrase text={before} />{" "}
        </>
      )}
      <span className="tp ui2-ph-accent ui2-gold-night ui2-loop">{accent}</span>
      {after && (
        <>
          {" "}
          <Phrase text={after} />
        </>
      )}
    </>
  );
}

/**
 * หัวเล็กสีทอง = เส้นทางหน้า แบบเดียวกับหัวหน้า /spreads ที่เจ้าของรับแล้ว
 * ⚠️ ใช้ `<p>` ไม่ใช่ `<nav aria-label="Breadcrumb">` — globals.css ซ่อน nav เส้นทางทุกตัว (เจ้าของ 2026-09-24 "ไม่ต้องโชว์")
 *    แต่หัวเล็กทองของ 2.0 เป็นส่วนหนึ่งของดีไซน์ที่เจ้าของเห็นและรับบน /spreads (2026-10-16) · JSON-LD BreadcrumbList ยังอยู่ที่หน้าเดิม
 */
export function Ui2Crumbs({ crumbs }: { crumbs: Ui2Crumb[] }) {
  return (
    <p className="ui2-ph-crumb">
      {crumbs.map((crumb, i) => {
        const last = i === crumbs.length - 1;
        return (
          <span key={`${crumb.label}-${i}`} className="ui2-ph-crumb-i" aria-current={last ? "page" : undefined}>
            {crumb.href && !last ? <Link href={crumb.href}>{crumb.label}</Link> : crumb.label}
          </span>
        );
      })}
    </p>
  );
}

export function Ui2PageHero({
  crumbs,
  title,
  accent,
  titleNode,
  lede,
  actions,
  note,
  trust,
  cards = DEFAULT_CARDS,
  children,
  compact = false,
  titleId,
}: Ui2PageHeroProps) {
  return (
    <section className={compact ? "ui2-ph is-compact" : "ui2-ph"} data-anim-section="">
      <span className="ui2-ph-deco" aria-hidden="true">
        {cards.slice(0, 6).map((cardId, i) => (
          <span key={`${cardId}-${i}`} className={`ui2-ph-card ui2-loop ui2-ph-card-${i + 1}`}>
            <CardImage cardId={cardId} alt="" thumb sizes={CARD_SIZES} loading={i < 2 ? "eager" : "lazy"} fetchPriority="low" />
          </span>
        ))}
      </span>
      <div className="ui2-ph-inner">
        {crumbs && crumbs.length > 0 && <Ui2Crumbs crumbs={crumbs} />}
        <h1 id={titleId} className="ui2-ph-title">
          {titleNode ?? <TitleWithAccent title={title} accent={accent} />}
        </h1>
        {lede && <p className="ui2-ph-lede">{lede}</p>}
        {children}
        {actions && <div className="ui2-ph-actions">{actions}</div>}
        {note && <p className="ui2-ph-note">{note}</p>}
        {trust && trust.length > 0 && (
          <ul className="ui2-ph-trust">
            {trust.map((t) => (
              <li key={t}>
                <GoldMark className="ui2-mark" />
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** หัวส่วนแบบ 2.0: ป้ายเลข + คำอังกฤษเอียง · h2 · คำอธิบาย (ชุดเดียวกับสารบัญ /spreads) */
export function Ui2SectionHead({
  n,
  word,
  title,
  lede,
  id,
  align = "start",
}: {
  n?: string;
  word?: string;
  title: string;
  lede?: ReactNode;
  id?: string;
  align?: "start" | "center";
}) {
  return (
    <div className={align === "center" ? "ui2-sh is-center" : "ui2-sh"}>
      {(n || word) && (
        <span className="ui2-sp-badge ui2-sp-badge-gold ui2-sh-badge">
          {n && <span className="ui2-num">{n}</span>}
          {word && <span className="ui2-accent">{word}</span>}
        </span>
      )}
      <h2 id={id} className="ui2-sh-title">
        <Phrase text={title} />
      </h2>
      {lede && <p className="ui2-sh-lede">{lede}</p>}
    </div>
  );
}

/**
 * v2 หัวหน้าเตี้ยสำหรับ "หน้าเครื่องมือ" (ดูดวงความรัก · Pick A Card · ไพ่ประจำราศี) — เจ้าของ 2026-10-16 "สร้างใหม่เลย"
 * ไม่มีไพ่ลอย · สูงราวครึ่งของ Ui2PageHero ➔ ตัวเครื่องมือ (พัดไพ่ · กองไพ่ · หน้าปัด) ขึ้นในจอแรก
 * `tone` = สีแสงประจำหน้า (rose · indigo · star) · สไตล์ `.v2-th*` ใน ui2-page.css หัวข้อ 19
 */
export function Ui2TightHead({
  crumbs,
  title,
  accent,
  lede,
  trust,
  tone,
}: {
  crumbs?: Ui2Crumb[];
  title: string;
  accent?: string;
  lede?: ReactNode;
  trust?: readonly string[];
  tone?: "rose" | "indigo" | "star";
}) {
  return (
    <header className="v2-th" data-tone={tone} data-anim-section="">
      {crumbs && crumbs.length > 0 && <Ui2Crumbs crumbs={crumbs} />}
      <h1 className="v2-th-title">
        <TitleWithAccent title={title} accent={accent} />
      </h1>
      {lede && <p className="v2-th-lede">{lede}</p>}
      {trust && trust.length > 0 && (
        <ul className="v2-th-trust">
          {trust.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </header>
  );
}
