import type { ReactNode } from "react";

import { BirthCardBodyEn } from "@/app/_shared/pages/birth-card-en";
import { BirthCardBodyTh } from "@/app/_shared/pages/birth-card-th";
import { CardsAllBody } from "@/app/_shared/pages/cards-all";
import { CardsIndexBody } from "@/app/_shared/pages/cards-index";
import { CardGroupBody } from "@/app/_shared/pages/card-group";
import type { CardGroupInfo } from "@/data/cards/group-seo";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 📄 เปลือกบาง ๆ ของ "เนื้อหาหน้า" ที่ Astro เรนเดอร์เป็น HTML **โดยไม่ hydrate**
 * ===========================================================================
 * ทุกตัวในไฟล์นี้ใช้คอมโพเนนต์ตัวเดียวกับที่ Next เรนเดอร์ หน้าที่มีอย่างเดียวคือ
 * ครอบ `LocaleProvider` ให้ (คอมโพเนนต์ลูกหลายตัวเรียก `useLocale()`)
 *
 * ⚠️ ห้ามใส่คอมโพเนนต์ที่ต้อง hydrate ลงในไฟล์นี้เด็ดขาด — ไฟล์ที่มี island อยู่
 *    จะถูกมัดรวมลงบันเดิลฝั่งไคลเอนต์ทั้งไฟล์ (บทเรียน 928 KB ใน `CardDetailRelated.tsx`)
 *    ส่วนที่ต้องโต้ตอบให้ส่งเข้ามาทาง slot จากหน้า `.astro` แทน
 */
export function CardsIndexBodyRoot({ locale, explorer }: { locale: Locale; explorer: ReactNode }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardsIndexBody locale={locale} explorer={explorer} />
    </LocaleProvider>
  );
}

export function CardsAllBodyRoot({ locale, table }: { locale: Locale; table: ReactNode }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardsAllBody locale={locale} table={table} />
    </LocaleProvider>
  );
}

/** 6 หน้าหมวดหมู่ไพ่ — ไม่มีสถานะสักตัว จึงไม่ต้องใช้ JS เลยแม้แต่ไบต์เดียว */
export function CardGroupBodyRoot({
  groupId,
  locale,
}: {
  groupId: CardGroupInfo["id"];
  locale: Locale;
}) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <CardGroupBody groupId={groupId} locale={locale} />
    </LocaleProvider>
  );
}

export function BirthCardBodyThRoot({ calculator }: { calculator: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="th">
      <BirthCardBodyTh calculator={calculator} />
    </LocaleProvider>
  );
}

export function BirthCardBodyEnRoot({ calculator }: { calculator: ReactNode }) {
  return (
    <LocaleProvider forcedLocale="en">
      <BirthCardBodyEn calculator={calculator} />
    </LocaleProvider>
  );
}
