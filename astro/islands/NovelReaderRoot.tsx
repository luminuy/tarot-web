import { NovelReader } from "@/components/novel/NovelReader";
import { LocaleProvider } from "@/lib/i18n";

/**
 * 📖 ตัวบทนิยาย (สมาชิกเท่านั้น) — `client:load` เพราะคนเปิดหน้านี้เพื่ออ่านทันที
 * ⚠️ ห้ามส่งตัวบทเป็น prop — prop ของ island ถูกเขียนลง HTML ทั้งก้อน (ส่งแค่เลขบท + ย่อหน้าตัวอย่าง)
 */
export function NovelReaderRoot({ number, teaser }: { number: number; teaser: string }) {
  return (
    <LocaleProvider forcedLocale="th">
      <NovelReader number={number} teaser={teaser} />
    </LocaleProvider>
  );
}
