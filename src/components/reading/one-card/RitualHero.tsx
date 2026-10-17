/**
 * หัวหน้าของหน้าพิธีเปิดไพ่ / หน้าคำนวณ (ดูดวงความรัก 1 ใบ · ไพ่ประจำตัว · ไพ่ประจำราศี)
 * UI 2.0 (เจ้าของ 2026-10-16 "ต้องสวย ต้องว้าว เหมือนหน้าที่ทำมาก่อนหน้านี้") — ส่งต่อให้ `Ui2PageHero`
 * หัวเล็กสีทอง · h1 คำเน้นทอง · คำโปรย · แคปซูล (`badgeText`) · ไพ่จริงลอย 2 แนวต่อข้าง
 */
import { Ui2TightHead } from "@/components/ui2/Ui2PageHero";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface RitualHeroProps {
  breadcrumbs: BreadcrumbItem[];
  badgeText: string;
  title: string;
  tagline: string;
  /** คำใน `title` ที่จะเป็นทองไล่สี */
  accent?: string;
  /** ไพ่ลอยข้างหัวข้อ (ตกแต่ง ไม่ใช่ผลสุ่ม) */
  cards?: readonly string[];
  /** ข้อความเพิ่มในแคปซูลต่อจาก `badgeText` */
  trust?: readonly string[];
  /** สีแสงประจำหน้า (v2) */
  tone?: "rose" | "indigo" | "star";
}

/* v2 (2026-10-16 "สร้างใหม่เลย") — หัวเตี้ยไม่มีไพ่ลอย ให้พิธี/เครื่องมือขึ้นจอแรก · `cards` เก็บไว้เพื่อความเข้ากันได้ (ไม่แสดงแล้ว) */
export function RitualHero({ breadcrumbs, badgeText, title, tagline, accent, trust, tone }: RitualHeroProps) {
  return (
    <Ui2TightHead
      crumbs={breadcrumbs}
      title={title}
      accent={accent}
      lede={tagline}
      trust={[badgeText, ...(trust ?? [])]}
      tone={tone}
    />
  );
}
