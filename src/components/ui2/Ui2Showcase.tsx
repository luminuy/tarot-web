/**
 * 🪟 โชว์เคส "รายชื่อหมวดซ้าย + หน้าต่างขวา" — ภาษาภาพชุดเดียวกับหน้า /spreads (เจ้าของ 2026-10-17)
 * ===========================================================================
 * เจ้าของ: "ทำไมหน้าอื่นไม่ทำแบบหน้าแรกกับหน้าผัง … การออกแบบยังคล้ายเดิม เหมือนการอัปเกรดมากกว่า"
 * ➔ ดึงชิ้นเอกลักษณ์ของ /spreads ออกมาเป็นของกลาง ใช้ได้ทุกหน้าที่มีเนื้อหาแบ่งหมวด
 *
 * หมวด = หน้าต่างหนึ่งบาน: แถบบน (ป้ายเลข + คำอังกฤษเอียง · ขีดความคืบหน้า · ลำดับ) ➔ หัวข้อ + คำโปรย + กล่องข้าง ➔ เนื้อหา
 * คอม ≥ 1200: รายชื่อหมวดเลขกำกับติดซ้าย (หมวดที่กำลังดูขยายใหญ่) · ต่ำกว่านั้น: แถบชิปหมวดติดใต้หัวเว็บ
 * หน้าต่างเรียงต่อกันครบทุกบาน (เนื้อหาทั้งหมดอยู่ใน HTML · ไม่มีสลับซ่อน) — สคริปต์ `astro/scripts/ui2-showcase.ts`
 * แค่บอกว่ากำลังดูหมวดไหน (IntersectionObserver · ไม่ผูกการเลื่อนทุกเฟรม)
 *
 * ไม่มี hook — ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และใน island · สไตล์ `src/styles/ui2-showcase.css`
 * ⚠️ ห้ามอีโมจิ/สัญลักษณ์ตกแต่ง (กฎเหล็ก 2) — ป้ายเลขเป็นตัวเลข คำเอียงเป็นตัวอักษร
 */
import type { CSSProperties, ReactNode } from "react";

import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

export interface Ui2ShowcaseSection {
  /** id ของหน้าต่าง (ใช้เป็นจุดกระโดด #id) */
  id: string;
  /** คำอังกฤษเอียงบนแถบหน้าต่าง เช่น "Major Arcana" */
  kicker: string;
  /** ชื่อหมวด (h2 · ชื่อในรายชื่อซ้าย) */
  title: string;
  /** ชื่อสั้นในรายชื่อ/ชิป (ไม่ใส่ = ใช้ title) */
  short?: string;
  lead?: ReactNode;
  /** บรรทัดเล็กใต้คำโปรย เช่น "22 ใบ · แตะไพ่เพื่ออ่านความหมาย" */
  meta?: ReactNode;
  /** สีหมวด 1–7 (`--ui2-note-N` · ไม่มีชมพู) */
  tone: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** ตัวเลขท้ายชื่อในรายชื่อซ้าย */
  count?: number;
  /** กล่องข้างหัวข้อ (เช่น "เริ่มที่ใบนี้") */
  aside?: ReactNode;
  /** ซ่อนหน้าต่างนี้ (เช่น ค้นหาแล้วไม่มีผลในหมวด) — ยังอยู่ใน DOM */
  hidden?: boolean;
  children: ReactNode;
}

/** ห่อวลี: หลายวลี ➔ ThaiPhrases · วลีเดียว ➔ `.tp` ตรง ๆ (แบบเดียวกับ Ui2PageHero · ด่าน thai-glyph) */
function Phrase({ text }: { text: string }) {
  return /\s/.test(text.trim()) ? <ThaiPhrases>{text}</ThaiPhrases> : <span className="tp">{text}</span>;
}

type Vars = CSSProperties & Record<`--${string}`, string>;

const tone = (t: number): Vars => ({ "--cat": `var(--ui2-note-${t})`, "--cat-ink": `var(--ui2-note-ink-${t})` });

export function Ui2Showcase({
  label,
  sections,
  className,
  before,
}: {
  /** aria-label ของทั้งโชว์เคส */
  label: string;
  sections: readonly Ui2ShowcaseSection[];
  className?: string;
  /** ของที่อยู่เหนือหน้าต่างแรกในคอลัมน์ขวา (เช่น สรุปผลค้นหา) */
  before?: ReactNode;
}) {
  const visible = sections.filter((s) => !s.hidden);
  const total = visible.length;
  return (
    <section className={`ui2-sx${className ? ` ${className}` : ""}`} data-sx="" aria-label={label}>
      {/* มือถือ/แท็บเล็ต: แถบชิปหมวดติดใต้หัวเว็บ */}
      <nav className="ui2-sx-chips" aria-label={label}>
        <div className="ui2-sx-chips-row">
          {visible.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="ui2-sx-chip" data-sx-link={s.id} style={tone(s.tone)}>
              <span className="ui2-sx-chip-dot" aria-hidden="true" />
              {s.short ?? s.title}
              {typeof s.count === "number" && <span className="ui2-sx-chip-n ui2-num">{s.count}</span>}
            </a>
          ))}
        </div>
      </nav>

      <div className="ui2-sx-stage">
        <nav className="ui2-sx-rail" aria-label={label}>
          <ol data-sx-rail="">
            {visible.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="ui2-sx-rail-link" data-sx-link={s.id} style={tone(s.tone)}>
                  <span className="ui2-sx-rail-n ui2-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className="ui2-sx-rail-name">{s.short ?? s.title}</span>
                  {typeof s.count === "number" && <span className="ui2-sx-rail-count ui2-num">{s.count}</span>}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="ui2-sx-panels">
          {before}
          {sections.map((s) => {
            const order = visible.indexOf(s) + 1;
            return (
              <article
                key={s.id}
                id={s.id}
                className="ui2-sx-win"
                data-sx-win={s.id}
                hidden={s.hidden || undefined}
                aria-labelledby={`${s.id}-title`}
                style={tone(s.tone)}
              >
                <header className="ui2-sx-bar">
                  <span className="ui2-sx-name">
                    <span className="ui2-sx-n ui2-num">{String(Math.max(order, 1)).padStart(2, "0")}</span>
                    <span className="ui2-accent">{s.kicker}</span>
                  </span>
                  <span className="ui2-sx-steps" aria-hidden="true">
                    {visible.map((v, j) => (
                      <span key={v.id} className={j + 1 === order ? "is-here" : j + 1 < order ? "is-past" : undefined} />
                    ))}
                  </span>
                  <span className="ui2-sx-step ui2-num">
                    {Math.max(order, 1)} <span className="ui2-sx-of">/ {total}</span>
                  </span>
                </header>
                <div className="ui2-sx-head">
                  <div className="ui2-sx-head-txt">
                    <h2 id={`${s.id}-title`} className="ui2-sx-title">
                      <Phrase text={s.title} />
                    </h2>
                    {s.lead && <p className="ui2-sx-lead">{s.lead}</p>}
                    {s.meta && <p className="ui2-sx-meta">{s.meta}</p>}
                  </div>
                  {s.aside && <div className="ui2-sx-aside">{s.aside}</div>}
                </div>
                <div className="ui2-sx-body">{s.children}</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** กล่อง "เริ่มที่นี่" ข้างหัวข้อหน้าต่าง (แบบ "เริ่มง่ายที่สุดในหมวดนี้" ของ /spreads) */
export function Ui2ShowcaseStarter({ kicker, name, extra, action }: { kicker: string; name: ReactNode; extra?: ReactNode; action: ReactNode }) {
  return (
    <div className="ui2-sx-start">
      <span className="ui2-sx-start-k">{kicker}</span>
      <span className="ui2-sx-start-name">
        {name}
        {extra && <span className="ui2-sx-start-n">{extra}</span>}
      </span>
      <span className="ui2-sx-start-act">{action}</span>
    </div>
  );
}
