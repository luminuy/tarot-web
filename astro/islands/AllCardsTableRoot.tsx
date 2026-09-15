import { AllCardsTable } from "@/components/encyclopedia/AllCardsTable";
import { CARD_SUMMARIES } from "@/data/cards/summary";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/** 📋 ตารางไพ่ 78 ใบที่ค้นและกรองได้ — เหตุผลที่นำเข้าข้อมูลเองอยู่ใน `CardsExplorerRoot` */
export function AllCardsTableRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <AllCardsTable cards={CARD_SUMMARIES} />
    </LocaleProvider>
  );
}
