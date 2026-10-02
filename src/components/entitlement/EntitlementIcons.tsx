/**
 * ไอคอนเส้นทองสำหรับ UI สิทธิ์การใช้งาน
 * กฎทองข้อ 2: ห้ามใช้อิโมจิการ์ตูน — ใช้ SVG เส้นที่วาดเองเท่านั้น
 */

import type { FC } from "react";

interface IconProps {
  className?: string;
}

const base = "stroke-current fill-none";

/** เครื่องหมายถูก — รายการที่ได้รับสิทธิ์ */
export const CheckMarkIcon: FC<IconProps> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 20 20" className={`${base} ${className}`} strokeWidth={2} aria-hidden="true">
    <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** ขีดกลาง — รายการที่ไม่รวมอยู่ในแผนนี้ */
export const DashMarkIcon: FC<IconProps> = ({ className = "w-3.5 h-3.5" }) => (
  <svg viewBox="0 0 20 20" className={`${base} ${className}`} strokeWidth={2} aria-hidden="true">
    <path d="M5 10h10" strokeLinecap="round" />
  </svg>
);

/** กุญแจล็อก — สถานะถูกกั้นสิทธิ์ */
export const SealedLockIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.6} aria-hidden="true">
    <rect x="5" y="10.5" width="14" height="9.5" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5" strokeLinecap="round" />
    <circle cx="12" cy="15.2" r="1.1" className="fill-current" />
  </svg>
);

/** นาฬิกาทราย — เวลารีเซ็ตโควตา */
export const HourglassIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.6} aria-hidden="true">
    <path d="M7 3h10M7 21h10" strokeLinecap="round" />
    <path d="M8 3v3.2c0 2 4 3.5 4 5.8s-4 3.8-4 5.8V21" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 3v3.2c0 2-4 3.5-4 5.8s4 3.8 4 5.8V21" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** ดาวประกาย — สิทธิ์ที่ยังเหลือ / โบนัส */
export const SparkSealIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.5} aria-hidden="true">
    <path d="M12 3l1.9 5.4L19.5 10l-5.6 1.6L12 17l-1.9-5.4L4.5 10l5.6-1.6L12 3z" strokeLinejoin="round" />
  </svg>
);

/** เหรียญ — แพ็กเกจเติมรอบ */
export const CoinSealIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.5} aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.6v8.8M9.6 9.8h3.6a1.9 1.9 0 010 3.8H9.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** บัตร — ช่องทางชำระด้วยบัตรเครดิต/เดบิต */
export const PaymentCardIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.6} aria-hidden="true">
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3 9.8h18M7 15h3.5" strokeLinecap="round" />
  </svg>
);

/** คิวอาร์ — ช่องทางชำระด้วย PromptPay */
export const QrCodeIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.6} aria-hidden="true">
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <path d="M14 14h2.5v2.5H14zM17.5 17.5H20V20h-2.5zM14 20h1M20 14v1" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** โล่ — ความปลอดภัยของการชำระเงิน */
export const ShieldCheckIcon: FC<IconProps> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={`${base} ${className}`} strokeWidth={1.6} aria-hidden="true">
    <path d="M12 3l7 3v5.5c0 4.3-3 7.9-7 9.5-4-1.6-7-5.2-7-9.5V6l7-3z" strokeLinejoin="round" />
    <path d="M8.8 12.2l2.2 2.2 4.2-4.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
