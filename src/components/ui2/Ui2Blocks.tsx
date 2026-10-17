/**
 * 🧱 บล็อกกลางจากหน้าแรก — "กล่องหลายขนาด (bento)" + "แถวสลับซ้ายขวา (ภาพจำลอง ↔ ข้อความ)"
 * ===========================================================================
 * เจ้าของ 2026-10-17: "นำสองส่วนนี้ไปใช้กับหน้าอื่น … ปรับใช้ในส่วนการออกแบบอื่นก็ได้ ไม่จำเป็นต้องตรงหมวด"
 * ➔ ภาษาภาพเดียวกับ `Ui2BentoSection` และ `Ui2ExploreSection` ของหน้าแรก (src/components/home2/Ui2StaticSections.tsx)
 *    แต่เป็นของกลางที่รับเนื้อหาอะไรก็ได้ · สไตล์ `src/styles/ui2-blocks.css` (นำเข้าโดย ui2-page.css)
 *
 * - `Ui2Bento` — หัวส่วนกลาง + กล่องมืด 4 ขนาด (wide · tall · md · sm) · คำแรกของหัวข้อเป็นสีทอง
 *   ภาพในกล่อง: `BxFan` (ไพ่ 3 ใบ ใบกลางเด่น + แผงคำอ่าน) · `BxBack` (หลังไพ่ใบใหญ่ + แสงทอง) ·
 *   `BxStrip` (แถบไพ่ย่อ) · `BxChips` · `BxStat` (ตัวเลขใหญ่)
 * - `Ui2FeatureRows` — แถวสลับ: แผงภาพจำลองพื้นครีมพาสเทล ↔ หัวข้อใหญ่ + คำตอบ (คอม ≥ 1024 สลับข้างทุกแถว)
 *   + รายการพับ "คำถามอื่น ๆ" ต่อท้าย (ไม่บังคับ) · ภาพจำลอง: `FrMock` + `FrPanel` · `FrFan` · `FrList` · `FrInput` · `FrBig`
 *
 * ไม่มี hook — ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และใน island
 * ⚠️ ภาพจำลองเป็นภาพประกอบ (`aria-hidden`) — ข้อความจริงอยู่ฝั่งตัวหนังสือเสมอ (บอท/โปรแกรมอ่านจอเห็นครบ)
 * ⚠️ ไพ่ในภาพประกอบเลือกตามความหมายดั้งเดิมของไพ่ ไม่ใช่ผลเปิดไพ่ของใคร (กฎเหล็ก 14 ไม่เกี่ยว) · ใช้ `<CardImage thumb>` เสมอ
 * ⚠️ ห้ามอีโมจิ/สัญลักษณ์ตกแต่ง (กฎเหล็ก 2) — รายการใช้เส้นซ้าย · ลิงก์ใช้ตัวหนังสือ
 */
import type { ReactNode } from "react";

import { CardImage } from "@/components/card/CardImage";
import { RouteLink as Link } from "@/components/ui/RouteLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/** ห่อวลี: หลายวลี ➔ ThaiPhrases · วลีเดียว ➔ `.tp` (ด่าน thai-glyph) */
function Phrase({ text }: { text: string }) {
  return /\s/.test(text.trim()) ? <ThaiPhrases>{text}</ThaiPhrases> : <span className="tp">{text}</span>;
}

function BlockHead({ id, kicker, title, lede }: { id: string; kicker?: string; title: string; lede?: ReactNode }) {
  return (
    <div className="ui2-bk-head">
      {kicker ? <span className="ui2-bk-kicker">{kicker}</span> : null}
      <h2 id={id} className="ui2-bk-h2">
        <Phrase text={title} />
      </h2>
      {lede ? <p className="ui2-bk-lede">{lede}</p> : null}
    </div>
  );
}

/* ── กล่องหลายขนาด ─────────────────────────────────────────────────────── */

export interface Ui2BentoTile {
  key: string;
  /** wide = กว้าง 2 ช่อง · tall = สูง 2 แถว · md = ช่องเดียวแต่เต็มแถวบนแท็บเล็ต · sm = ช่องเดียว (ค่าเริ่มต้น) */
  size?: "wide" | "tall" | "md" | "sm";
  /** ป้ายเล็กสีเขียวน้ำทะเลเหนือหัวข้อ เช่น "พิธีเช้า · 2 นาที" */
  label?: string;
  /** คำแรกของหัวข้อ (สีทอง) */
  lead: string;
  /** ส่วนที่เหลือของหัวข้อ */
  title?: string;
  desc?: ReactNode;
  /** ทั้งกล่องเป็นลิงก์ (ห้ามมีลิงก์ซ้อนข้างใน) */
  href?: string;
  /** ลิงก์ท้ายกล่อง (ใช้เมื่อกล่องไม่ใช่ลิงก์ทั้งกล่อง) */
  go?: { href: string; label: string };
  /** บรรทัดเล็กท้ายกล่อง (กล่องที่เป็นลิงก์ทั้งกล่อง) */
  hint?: string;
  visual?: ReactNode;
  /** แสงในกล่อง */
  glow?: "amber" | "teal";
  /** จัดกลาง (เหมาะกับกล่องสูงที่มีหลังไพ่ใบใหญ่) */
  center?: boolean;
}

export function Ui2Bento({
  id,
  kicker,
  title,
  lede,
  tiles,
  className,
}: {
  id: string;
  kicker?: string;
  title: string;
  lede?: ReactNode;
  tiles: readonly Ui2BentoTile[];
  className?: string;
}) {
  return (
    <section className={`ui2-bk ${className ?? ""}`} aria-labelledby={id} data-anim-section="">
      <BlockHead id={id} kicker={kicker} title={title} lede={lede} />
      <div className="ui2-bx">
        {tiles.map((t) => {
          const cls = `ui2-bx-tile is-${t.size ?? "sm"}${t.center ? " is-center" : ""}`;
          const body = (
            <>
              {t.glow ? <span className={`ui2-bx-glow is-${t.glow}`} aria-hidden="true" /> : null}
              {t.label ? <span className="ui2-bx-label">{t.label}</span> : null}
              <h3 className="ui2-bx-title">
                <b className="tp">{t.lead}</b>
                {t.title ? (
                  <>
                    {" "}
                    <Phrase text={t.title} />
                  </>
                ) : null}
              </h3>
              {t.desc ? <p className="ui2-bx-desc">{t.desc}</p> : null}
              {t.visual}
              {t.hint ? <span className="ui2-bx-hint">{t.hint}</span> : null}
              {!t.href && t.go ? (
                <Link href={t.go.href} prefetch={false} className="ui2-bx-go">
                  {t.go.label}
                </Link>
              ) : null}
            </>
          );
          return t.href ? (
            <Link key={t.key} href={t.href} prefetch={false} className={cls}>
              {body}
            </Link>
          ) : (
            <div key={t.key} className={cls}>
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** ไพ่ 3 ใบ (ใบกลางยกขึ้น ขอบทองเรือง) + แผงคำอ่านของใบกลาง */
export function BxFan({
  cards,
  label,
  text,
  chip,
}: {
  cards: readonly (readonly [string, string])[];
  label?: string;
  text?: ReactNode;
  chip?: string;
}) {
  const focus = Math.floor(cards.length / 2);
  return (
    <span className="ui2-bx-fan">
      <span className="ui2-bx-fan-cards" aria-hidden="true">
        {cards.map(([cardId], i) => (
          <span key={cardId} className={i === focus ? "is-focus" : undefined}>
            <CardImage cardId={cardId} alt="" thumb sizes="80px" />
          </span>
        ))}
      </span>
      {label || text ? (
        <span className="ui2-bx-panel">
          {label ? <span className="ui2-bx-panel-k">{label}</span> : null}
          {text ? <span className="ui2-bx-panel-t">{text}</span> : null}
          {chip ? <span className="ui2-bx-chip">{chip}</span> : null}
        </span>
      ) : null}
    </span>
  );
}

/** หลังไพ่ใบใหญ่กลางกล่อง + แสงทองเต้น (หลังไพ่วาดด้วย CSS ไม่ใช่ภาพไพ่ใบใด · วนเฉพาะระดับ full) */
export function BxBack() {
  return (
    <span className="ui2-bx-back-wrap" aria-hidden="true">
      <span className="ui2-bx-burst ui2-loop" />
      <span className="ui2-bx-back ui2-loop" />
    </span>
  );
}

/** แถบไพ่ย่อ — `null` = ช่องว่าง · ช่องสุดท้ายว่าง = "ช่องถัดไป" เรืองทอง */
export function BxStrip({ ids }: { ids: readonly (string | null)[] }) {
  return (
    <span className="ui2-bx-strip" style={{ gridTemplateColumns: `repeat(${ids.length}, minmax(0, 1fr))` }} aria-hidden="true">
      {ids.map((cardId, i) =>
        cardId ? (
          <span key={i}>
            <CardImage cardId={cardId} alt="" thumb sizes="48px" />
          </span>
        ) : (
          <span key={i} className={i === ids.length - 1 ? "is-next" : "is-empty"} />
        ),
      )}
    </span>
  );
}

export function BxChips({ items, on = 0 }: { items: readonly string[]; on?: number }) {
  return (
    <span className="ui2-bx-chips" aria-hidden="true">
      {items.map((c, i) => (
        <span key={c} className={i === on ? "is-on" : undefined}>
          {c}
        </span>
      ))}
    </span>
  );
}

/** ตัวเลขใหญ่ + หน่วย (ตัวเลขต้องมาจากข้อมูลจริงเสมอ) */
export function BxStat({ value, unit }: { value: ReactNode; unit: string }) {
  return (
    <span className="ui2-bx-stat">
      <b className="ui2-num">{value}</b>
      <span>{unit}</span>
    </span>
  );
}

/* ── แถวสลับซ้ายขวา ─────────────────────────────────────────────────────── */

export interface Ui2FeatureRow {
  id?: string;
  /** ป้ายเล็กเหนือหัวข้อ */
  kicker?: string;
  title: string;
  body: ReactNode;
  mock: ReactNode;
  link?: { href: string; label: string };
}

export function Ui2FeatureRows({
  id,
  kicker,
  title,
  lede,
  rows,
  rest,
  restLabel,
  className,
}: {
  id: string;
  kicker?: string;
  title: string;
  lede?: ReactNode;
  rows: readonly Ui2FeatureRow[];
  /** รายการพับต่อท้าย (เช่น คำถามที่เหลือ) */
  rest?: readonly { id?: string; q: string; a: ReactNode }[];
  restLabel?: string;
  className?: string;
}) {
  return (
    <section className={`ui2-bk ui2-fr ${className ?? ""}`} aria-labelledby={id}>
      <BlockHead id={id} kicker={kicker} title={title} lede={lede} />
      <div className="ui2-fr-rows">
        {rows.map((r, i) => (
          <article key={r.id ?? i} id={r.id} className="ui2-fr-row">
            {r.mock}
            <div className="ui2-fr-text">
              {r.kicker ? <span className="ui2-fr-kicker">{r.kicker}</span> : null}
              <h3 className="ui2-fr-q">
                <Phrase text={r.title} />
              </h3>
              <div className="ui2-fr-a">{r.body}</div>
              {r.link ? (
                <Link href={r.link.href} prefetch={false} className="ui2-fr-go">
                  {r.link.label}
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      {rest && rest.length > 0 ? (
        <>
          {restLabel ? <p className="ui2-fr-more">{restLabel}</p> : null}
          <div className="ui2-fr-list">
            {rest.map((f) => (
              <details key={f.id ?? f.q} id={f.id} className="ui2-fr-faq">
                <summary>
                  <span>{f.q}</span>
                  <span className="ui2-fr-plus" aria-hidden="true" />
                </summary>
                <div className="ui2-fr-faq-a">{f.a}</div>
              </details>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

/** แผงภาพจำลองพื้นครีมพาสเทล (ภาพประกอบล้วน) */
export function FrMock({ children, tint = "gold" }: { children: ReactNode; tint?: "gold" | "teal" | "violet" }) {
  return (
    <div className={`ui2-fr-mock is-${tint}`} aria-hidden="true">
      {children}
    </div>
  );
}

/** แผงกระดาษขาวในภาพจำลอง */
export function FrPanel({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="ui2-fr-panel">
      {label ? <span className="ui2-fr-label">{label}</span> : null}
      {children}
    </div>
  );
}

/** ไพ่กางเป็นพัด (ใบกลางใหญ่สุด) */
export function FrFan({ cards }: { cards: readonly string[] }) {
  return (
    <div className="ui2-fr-fan">
      {cards.map((cardId) => (
        <CardImage key={cardId} cardId={cardId} alt="" thumb sizes="74px" className="ui2-fr-card" />
      ))}
    </div>
  );
}

/** รายการเส้นทองซ้าย (ไม่มีเครื่องหมายถูก · กฎเหล็ก 2) · `boxed` = กล่องครีมทีละบรรทัด */
export function FrList({ items, boxed }: { items: readonly ReactNode[]; boxed?: boolean }) {
  return (
    <ul className={boxed ? "ui2-fr-boxes" : "ui2-fr-checks"}>
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

/** ช่องพิมพ์จำลอง (แว่นขยายวาดด้วย CSS เป็นไอคอนใช้งาน ไม่ใช่ของประดับ) */
export function FrInput({ title, text }: { title?: string; text: string }) {
  return (
    <>
      {title ? <span className="ui2-fr-ask">{title}</span> : null}
      <span className="ui2-fr-input">{text}</span>
    </>
  );
}

/** ตัวเลข/คำใหญ่ในแผง */
export function FrBig({ children }: { children: ReactNode }) {
  return <span className="ui2-fr-big ui2-num">{children}</span>;
}

/** แถวเม็ดในแผง (เช่น ช่องทางเข้าสู่ระบบ · ช่องทางจ่าย) */
export function FrPills({ items }: { items: readonly string[] }) {
  return (
    <span className="ui2-fr-pills">
      {items.map((t) => (
        <span key={t}>{t}</span>
      ))}
    </span>
  );
}
