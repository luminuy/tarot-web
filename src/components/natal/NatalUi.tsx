import type React from "react";

/**
 * 🪐 ชิ้นส่วนหน้าตากลางของผลผังดวงทุกแท็บ (ผังเกิด · ตามเวลา · ผังคู่ · โหราไทย · ถามแม่หมอ)
 * สไตล์อยู่ใน `v2-natal.css` (`.v2-nr-*`) — ใช้ชุดเดียวกันทุกแท็บ หน้าตาจะได้ไม่แตกเป็นหลายแบบ
 */

/** หัวส่วน: เลขลำดับในวงกลม + หัวข้อ + คำอธิบายบรรทัดเดียว */
export function SectionHead({ id, n, title, children }: { id?: string; n?: number; title: string; children?: React.ReactNode }) {
  return (
    <header className="v2-nr-head">
      {n !== undefined && (
        <span className="v2-nr-head-n ui2-num" aria-hidden="true">
          {n}
        </span>
      )}
      <div className="min-w-0">
        <h3 id={id} className="v2-nr-head-t">
          {title}
        </h3>
        {children && <p className="v2-nr-head-d">{children}</p>}
      </div>
    </header>
  );
}

/** ป้าย "เปิด/ย่อ" ท้ายแถบพับ (ไม่ใช้ลูกศร — กฎเหล็ก 2) */
export function MoreLabel({ isTh, open = "เปิด", openEn = "Open" }: { isTh: boolean; open?: string; openEn?: string }) {
  return (
    <span className="v2-nt-more">
      <span className="v2-nt-more-open">{isTh ? open : openEn}</span>
      <span className="v2-nt-more-close">{isTh ? "ย่อ" : "Close"}</span>
    </span>
  );
}

/** กล่องสรุป: ป้ายซ้าย ข้อความขวา (จอเล็กซ้อนกัน) */
export function SummaryBox({ title, rows }: { title: string; rows: readonly { label: string; text: React.ReactNode }[] }) {
  if (!rows.length) return null;
  return (
    <div className="v2-nr-sum">
      <p className="v2-nr-sum-t">{title}</p>
      <dl>
        {rows.map((r) => (
          <div key={r.label}>
            <dt>{r.label}</dt>
            <dd>{r.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
