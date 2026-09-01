/**
 * src/lib/entitlement/packages.ts
 * แพ็กเกจเติมโควตาการเปิดไพ่ทาโรต์ (AI Reading Credit Packages)
 * ราคาคำนวณในหน่วย Integer Satang (1 THB = 100 satang)
 */

export interface CreditPackage {
  id: "pack_3" | "pack_10" | "pack_30";
  name: string;
  tagline: string;
  credits: number;
  priceThb: number;
  amountSatang: number;
  badge?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "pack_3",
    name: "แพ็กเกจเริ่มต้น 3 ครั้ง",
    tagline: "เหมาะสำหรับเปิดไพ่ดูดวงคำถามสำคัญเฉพาะหน้า",
    credits: 3,
    priceThb: 59,
    amountSatang: 5900,
    badge: "เริ่มต้น",
  },
  {
    id: "pack_10",
    name: "แพ็กเกจยอดนิยม 10 ครั้ง",
    tagline: "เปิดผังใหญ่และคุยถามเจาะลึกกับแม่หมอได้ต่อเนื่อง",
    credits: 10,
    priceThb: 149,
    amountSatang: 14900,
    badge: "✦ ยอดนิยม",
    isPopular: true,
  },
  {
    id: "pack_30",
    name: "แพ็กเกจมูจัดเต็ม 30 ครั้ง",
    tagline: "เปิดได้ไม่อั้น คุ้มค่าที่สุด ไม่มีวันหมดอายุ",
    credits: 30,
    priceThb: 299,
    amountSatang: 29900,
    badge: "✨ คุ้มค่าที่สุด",
    isBestValue: true,
  },
];

export function getCreditPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === id);
}
