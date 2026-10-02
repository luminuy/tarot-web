import type { FC } from "react";

import type { CreditPackage } from "@/lib/entitlement/packages";
import { pricePerReadingThb, savingsPercent } from "@/lib/entitlement/pricing";
import { PaymentCardIcon, QrCodeIcon } from "@/components/entitlement/EntitlementIcons";

/**
 * ✦ ชิ้นส่วนหน้าตาของแพ็กเติมรอบ — ใช้ร่วมกันระหว่างหน้าต่างเติมรอบกับหน้า /pricing
 * ไม่มี state ไม่มี hook จึงเรนเดอร์ได้ทั้งใน island และ HTML ล้วนของหน้า Astro
 */

/** ป้ายมุมการ์ด: "ยอดนิยม" มาก่อน · แพ็กอื่นที่ถูกกว่าต่อครั้งโชว์ "ประหยัด X%" */
export function packageBadge(pkg: CreditPackage, all: readonly CreditPackage[], isEn: boolean): string | null {
  if (pkg.isPopular) return isEn ? "Most popular" : "ยอดนิยม";
  const save = savingsPercent(pkg, all);
  if (save > 0) return isEn ? `Save ${save}%` : `ประหยัด ${save}%`;
  return null;
}

export function perReadingLabel(pkg: CreditPackage, isEn: boolean): string {
  const each = pricePerReadingThb(pkg);
  return isEn ? `≈ ฿${each} per reading` : `ตกครั้งละ ≈ ${each} บาท`;
}

export function creditsLabel(credits: number, isEn: boolean): string {
  return isEn ? `${credits} readings` : `${credits} ครั้ง`;
}

/** บรรทัดช่องทางชำระเงิน — เล็ก เงียบ อยู่ใต้ปุ่มจ่าย (แบบหน้าชำระเงินสากล ไม่ตะโกนเรื่องความปลอดภัย) */
export const PaymentMethodsNote: FC<{ isEn: boolean; className?: string }> = ({ isEn, className = "" }) => (
  <p className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-serif-th text-xs text-muted ${className}`}>
    <span>{isEn ? "Pay with" : "ชำระด้วย"}</span>
    <span className="inline-flex items-center gap-1">
      <PaymentCardIcon className="h-4 w-4" />
      {isEn ? "Card" : "บัตรเครดิต / เดบิต"}
    </span>
    <span className="inline-flex items-center gap-1">
      <QrCodeIcon className="h-4 w-4" />
      PromptPay
    </span>
  </p>
);
