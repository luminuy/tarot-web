import type { ReactNode } from "react";

import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

/**
 * ✦ ชิ้นส่วนหน้าบัญชี — UI 2.0 (เจ้าของ 2026-10-17 "หน้านี้ยังไม่ได้ทำใหม่เลย ทั้ง ui ทั้งสี")
 * ---------------------------------------------------------------------------
 * โครงเดียวทั้งหน้า: หนึ่งกลุ่ม = แผงครีมพาสเทล (`.page-band-tint` ➔ ui2-dawn.css สลับโทเคนเป็นกลางวันให้)
 * หัวกลุ่ม Anuphan อยู่ในแผง · แถวเป็นกระดาษขาวคั่นเส้นบาง · ไอคอนทองเข้มในช่องครีม
 * สไตล์: `src/styles/v3-account.css`
 *
 * ⚠️ ทุกกลุ่มต้องผ่าน `SettingsSection` และทุกบรรทัดต้องผ่าน `SettingsRow` (การ์ดสองระบบในหน้าเดียว ตาเห็นว่าเป็นคนละเว็บ)
 */

export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="v3-ac-sec page-band-tint">
      <div className="v3-ac-sec-head">
        <h2 id={id} className="v3-ac-sec-title">
          <ThaiPhrases>{title}</ThaiPhrases>
        </h2>
        {description && <p className="v3-ac-sec-desc">{description}</p>}
      </div>
      <div className="v3-ac-rows">{children}</div>
    </section>
  );
}

/** ไอคอนในช่องหน้าแถว — ทองเข้มบนครีม (ลบข้อมูล = แดง) */
export function RowIcon({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "danger" }) {
  return (
    <span aria-hidden="true" className={tone === "danger" ? "v3-ac-ico is-danger" : "v3-ac-ico"}>
      {children}
    </span>
  );
}

export function RowText({ label, hint }: { label: ReactNode; hint?: ReactNode }) {
  return (
    <span className="v3-ac-row-text">
      <span className="v3-ac-row-label">{label}</span>
      {hint && <span className="v3-ac-row-hint">{hint}</span>}
    </span>
  );
}

export function ChevronRight() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="v3-ac-chev"
      aria-hidden="true"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/**
 * แถวหนึ่งแถวในกลุ่ม
 * - `href` ➔ ลิงก์ทั้งแถว + ลูกศร · `onClick` ➔ ปุ่มทั้งแถว + ลูกศร
 * - `trailing` ➔ ของทางขวา (ค่า · ป้าย · สวิตช์ · ปุ่ม) — แถวที่มี trailing แบบโต้ตอบได้ห้ามส่ง href/onClick ซ้อน
 */
export function SettingsRow({
  icon,
  label,
  hint,
  trailing,
  href,
  onClick,
}: {
  icon?: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      {icon}
      <RowText label={label} hint={hint} />
      {trailing}
      {(href || onClick) && <ChevronRight />}
    </>
  );
  if (href) {
    return (
      <Link href={href} prefetch={false} className="v3-ac-row is-link">
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="v3-ac-row is-link">
        {body}
      </button>
    );
  }
  return <div className="v3-ac-row">{body}</div>;
}

/** ตัวเลขสรุปบนหัวหน้า — ป้าย · ตัวเลขใหญ่ · บรรทัดรอง (กระดาษขาวบนแถบครีม) */
export function StatTile({ label, value, sub }: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="v3-ac-stat">
      <span className="v3-ac-stat-k">{label}</span>
      <span className="v3-ac-stat-v">{value}</span>
      {sub && <span className="v3-ac-stat-sub">{sub}</span>}
    </div>
  );
}

/* ── ไอคอนเส้นชุดเดียวทั้งหน้า (stroke 1.8 · 24px viewBox) ───────────────────── */

function Line({ children, className = "v3-ac-svg" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconCards = () => (
  <Line>
    <rect x="3" y="5" width="11" height="15" rx="2" />
    <path d="M17 7.5 20 8.4a1.5 1.5 0 0 1 1 1.9l-3.4 10.3" />
  </Line>
);
export const IconTag = () => (
  <Line>
    <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z" />
    <circle cx="7.5" cy="7.5" r="1.3" />
  </Line>
);
export const IconTicket = () => (
  <Line>
    <path d="M3 9V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3a3 3 0 0 0 0 6v3a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-3a3 3 0 0 0 0-6z" />
    <path d="M13 5v14" strokeDasharray="2 2.5" />
  </Line>
);
export const IconSpark = () => (
  <Line>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </Line>
);
export const IconBook = () => (
  <Line>
    <path d="M4 19.5V5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z" />
    <path d="M6 21h14M9 7h7" />
  </Line>
);
export const IconMail = () => (
  <Line>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6 8.5-6" />
  </Line>
);
export const IconSun = () => (
  <Line>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Line>
);
export const IconKey = () => (
  <Line>
    <circle cx="8" cy="15" r="4" />
    <path d="m10.8 12.2 9.2-9.2M17 6l3 3M15 8l2 2" />
  </Line>
);
export const IconLogin = () => (
  <Line>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="M10 17l5-5-5-5M15 12H3" />
  </Line>
);
export const IconShield = () => (
  <Line>
    <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6z" />
    <path d="m9 12 2 2 4-4" />
  </Line>
);
export const IconTrash = () => (
  <Line>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </Line>
);
export const IconLogout = () => (
  <Line className="v3-ac-svg is-sm">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </Line>
);
