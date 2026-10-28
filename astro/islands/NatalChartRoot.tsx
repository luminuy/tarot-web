import { useMemo } from "react";
import { NatalChartApp, type NatalCardItem } from "@/components/natal/NatalChartApp";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🪐 เครื่องสร้างผังดวงกำเนิด — ส่วนเดียวของหน้า `/natal-chart` ที่ต้องใช้ JS
 * ⚠️ รับไพ่เป็นสตริงอัด (`packNatalCards` ใน natal-chart.tsx) ห้าม import ข้อมูลไพ่/ตัวคำนวณดาวที่นี่
 *    ตัวคำนวณโหลดด้วย import() ตอนกดสร้างผัง (ด่าน `test-natal-chart` ข้อ 7)
 */
export function NatalChartRoot({ cardsPacked, locale }: { cardsPacked: string; locale: Locale }) {
  const cards = useMemo(() => unpackNatalCards(cardsPacked), [cardsPacked]);
  return (
    <LocaleProvider forcedLocale={locale}>
      <NatalChartApp cards={cards} />
    </LocaleProvider>
  );
}

/** แกะ `[id, ชื่อไทย, ชื่ออังกฤษ, คำสำคัญภาษาของหน้า][]` กลับเป็น NatalCardItem (หน้าใช้ `kw[lang]` ภาษาเดียว) */
export function unpackNatalCards(packed: string): NatalCardItem[] {
  return (JSON.parse(packed) as Array<[string, string, string, string]>).map(([id, nameTh, nameEn, kw]) => ({
    id,
    nameTh,
    nameEn,
    image: `${id}.jpg`,
    kw: kw ? { th: kw, en: kw } : undefined,
  }));
}
