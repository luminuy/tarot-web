import type { FC } from "react";

import type { CreditPackage } from "@/lib/entitlement/packages";
import { pricePerReadingThb, savingsPercent } from "@/lib/entitlement/pricing";
import { PaymentCardIcon, QrCodeIcon, ShieldCheckIcon } from "@/components/entitlement/EntitlementIcons";

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

/** แถบความมั่นใจใต้ปุ่มจ่ายเงิน — บอกช่องทางและว่าใครถือข้อมูลบัตร */
export const PaymentTrustRow: FC<{ isEn: boolean; className?: string }> = ({ isEn, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    <ul className="flex flex-wrap items-center justify-center gap-2" aria-label={isEn ? "Payment methods" : "ช่องทางชำระเงิน"}>
      <li className="glass-chip inline-flex items-center gap-1.5 px-3 py-1 font-serif-th text-xs font-semibold text-ink-deep">
        <PaymentCardIcon className="h-4 w-4 text-gold-ink" />
        {isEn ? "Credit / debit card" : "บัตรเครดิต / เดบิต"}
      </li>
      <li className="glass-chip inline-flex items-center gap-1.5 px-3 py-1 font-serif-th text-xs font-semibold text-ink-deep">
        <QrCodeIcon className="h-4 w-4 text-gold-ink" />
        PromptPay
      </li>
    </ul>
    <p className="flex items-start justify-center gap-1.5 text-center font-serif-th text-xs leading-relaxed text-muted">
      <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
      <span>
        {isEn
          ? "Secure checkout by Stripe — we never see your card number"
          : "ชำระผ่าน Stripe อย่างปลอดภัย เราไม่เห็นเลขบัตรของคุณ"}
      </span>
    </p>
  </div>
);
