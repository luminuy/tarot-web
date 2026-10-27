/**
 * 🛎️ ชิ้นกลาง UI 2.0 ของหน้าย่อยระบบแม่หมอ — โปรไฟล์ · หน้าจอง · หน้าคิว · นัดของฉัน · ห้องส่วนตัว · แผงแม่หมอ
 * ===========================================================================
 * ภาษาภาพชุดเดียวกับหน้ารวม /readers และหน้าบัญชี (เจ้าของ 2026-10-26 "ทำเลย" · ขึ้น preview ก่อน)
 * - `ConsultHero` = หัวหน้าแถบครีมรุ่งอรุณ (`.v3-cs-hero` อยู่ในรายชื่อหัวหน้าของ ui2-dawn.css) — ซ้ายข้อความ · ขวาของเสริม
 * - `ConsultWindow` = หน้าต่างครีมบนท้องฟ้ากลางคืน (`.page-band-tint` ➔ ui2-dawn.css สลับโทเคนเป็นกลางวัน
 *   การ์ดเดิม `altar-card-porcelain` ข้างในเป็นกระดาษขาว · ปุ่ม `btn-gold-glass` เป็นปุ่มดำ)
 * หน้าที่ใช้ต้องอยู่ใต้ `.ui2-pg` และโหลด `ui2-page.css` + `v3-consult.css`
 *
 * ไม่มี hook — ใช้ได้ทั้งคอมโพเนนต์ฝั่งเซิร์ฟเวอร์และฝั่ง client
 * ⚠️ ห้ามอีโมจิ/รูปทรงตกแต่ง (กฎเหล็ก 2) · ห้ามชื่อ/ราคา/รีวิวสมมุติ — ข้อมูลแม่หมอมาจากฐานข้อมูลเท่านั้น
 */
import type { ReactNode } from "react";

export interface ConsultHeroProps {
  kicker?: ReactNode;
  /** หัวข้อใหญ่ของหัวหน้า — ห่อวลีไทย (ThaiPhrases / `.tp`) มาจากผู้เรียก */
  title: ReactNode;
  /** หน้าที่มี h1 อยู่ในเนื้อหาแล้ว (เช่น ขั้นตอนจอง) ใช้ "p" — ทุกหน้าต้องมี h1 เดียว */
  titleAs?: "h1" | "p";
  titleId?: string;
  lede?: ReactNode;
  /** ฝั่งขวาบนคอม / ใต้ข้อความบนมือถือ (เช่น บัตรแม่หมอ · สวิตช์คิวสด) */
  aside?: ReactNode;
  /** ใต้คำโปรย (ป้าย · ปุ่ม) */
  children?: ReactNode;
  /** หัวหน้าเตี้ย — หน้าที่เนื้อหาหลักต้องอยู่ในจอแรก (หน้าจอง · หน้าคิว · แผงแม่หมอ) */
  compact?: boolean;
}

export function ConsultHero({ kicker, title, titleAs = "h1", titleId, lede, aside, children, compact }: ConsultHeroProps) {
  const Title = titleAs;
  return (
    <header className={`v3-cs-hero${compact ? " is-compact" : ""}${aside ? " has-aside" : ""}`}>
      <div className="v3-cs-hero-text">
        {kicker && <p className="v3-cs-kicker">{kicker}</p>}
        <Title id={titleId} className="v3-cs-title">
          {title}
        </Title>
        {lede && <p className="v3-cs-lede">{lede}</p>}
        {children}
      </div>
      {aside && <div className="v3-cs-hero-side">{aside}</div>}
    </header>
  );
}

export function ConsultWindow({
  children,
  className = "",
  narrow,
  label,
  labelledBy,
}: {
  children: ReactNode;
  className?: string;
  /** หน้าต่างแคบสำหรับฟอร์ม/สถานะ (หน้าจอง · หน้าคิว · นัดของฉัน) */
  narrow?: boolean;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-label={label}
      aria-labelledby={labelledBy}
      className={`page-band-tint v3-cs-win${narrow ? " is-narrow" : ""}${className ? ` ${className}` : ""}`}
    >
      {children}
    </section>
  );
}
