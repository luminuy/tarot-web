import { localeHref } from "@/lib/i18n/paths";
import {
  Ui2BentoSection,
  Ui2ExploreSection,
  Ui2NotesSection,
  Ui2ShowcaseSection,
  Ui2StickyCta,
  Ui2VerifySection,
} from "@/components/home2/Ui2StaticSections";

/**
 * 📄 หน้าแรก ส่วน 4–8 (SeerTarot UI 2.0 · แบบ D+) — Server Component ล้วน เรนเดอร์เป็น HTML นิ่ง ไม่ hydrate
 * ===========================================================================
 * แผน: docs/plans/UI_2_0_PLAN_2026-10-12.md หัวข้อ 2
 *   4. เรื่องที่ค้างอยู่ในใจ…       (กลางคืน)  — แทน spread_select · more_ways บางส่วน
 *   5. สุ่มจริง / ตรวจได้           (แผ่นขาว)  — แทน how_it_works · heritage · proof บางส่วน
 *   6. ทุกอย่างอยู่ในที่เดียว         (กลางคืน)  — แทน proof (ตัวอย่างคำทำนาย)
 *   6.5 คลังไพ่ยิปซี (หัวเรื่องซ้าย ข้อมูลขวา) (กลางวัน) — ดูดวงตามเรื่อง · ผัง · ไพ่เด่น · ราศี · 5 ขั้นตอน · ทางลัด
 *   7. คำถามที่พบบ่อย (การ์ดมืด แถวสลับ) — faq
 *   (8. ปิดท้าย — ถอดตามคำสั่งเจ้าของ 2026-10-13 "เอาอันนี้ออก")
 * ส่วน 1–3 อยู่ใน island `TarotFlow` (ต้อง hydrate) — ดู `src/components/home/TarotFlow.tsx`
 *
 * ⚠️ ห้ามเป็น client component (ด่าน test-seo-wave4 P-03) · ใช้ `localeHref` แปลงลิงก์เอง
 * ⚠️ ห้ามทำลิงก์ภายในหาย (หัวข้อ 6.7) — รวมไว้ที่ `src/components/home2/explore-links.ts`
 */
export function HomeSeoContent({ isEnglish = false }: { isEnglish?: boolean }) {
  const href = (path: string) => localeHref(path, isEnglish ? "en" : "th");
  return (
    <div className="w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Ui2NotesSection isEnglish={isEnglish} href={href} />
        <Ui2VerifySection isEnglish={isEnglish} />
        {/* คลังไพ่ (สว่าง) มาก่อนกล่อง "ทุกอย่างในที่เดียว" (มืด) — คั่นช่วงมืดยาว 4 ส่วนติดกัน (เจ้าของสั่ง 2026-10-13 "ลองสลับ") */}
        <Ui2ShowcaseSection isEnglish={isEnglish} href={href} />
        <Ui2BentoSection isEnglish={isEnglish} href={href} />
        <Ui2ExploreSection isEnglish={isEnglish} href={href} />
      </div>
      <Ui2StickyCta isEnglish={isEnglish} />
    </div>
  );
}
