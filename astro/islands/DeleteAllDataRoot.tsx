import { DeleteAllDataButton } from "@/components/ui/DeleteAllDataButton";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

/** 🗑️ ปุ่มลบข้อมูลทั้งหมดตาม PDPA — island ตัวเดียวของหน้านโยบายความเป็นส่วนตัว */
export function DeleteAllDataRoot({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider forcedLocale={locale}>
      <DeleteAllDataButton />
    </LocaleProvider>
  );
}
