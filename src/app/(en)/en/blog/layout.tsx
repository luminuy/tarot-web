import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * 🇬🇧 คู่แฝดอังกฤษของ `src/app/(th)/blog/layout.tsx`
 *
 * ⚠️ ต้นไม้ `(en)` ไม่ได้ใช้ layout ร่วมกับต้นไม้ `(th)` แม้แต่ชั้นเดียว
 * (มันเป็น root layout คนละตัว — ดู `src/app/(en)/layout.tsx`)
 * เพิ่ม section layout ฝั่งไทยเมื่อไหร่ **ต้องมาเพิ่มฝั่งนี้ด้วยเสมอ**
 * ไม่งั้นหน้าอังกฤษทั้งหมวดจะไม่มีหัวเว็บและไม่มีฟุตเตอร์ (INC-0110)
 *
 * ห้ามยกไปไว้ที่ `src/app/(en)/en/layout.tsx` เด็ดขาด — ชั้นนั้นครอบหน้าแรก `/en`
 * ซึ่งเรนเดอร์ <SiteHeader /> ของตัวเองอยู่แล้วผ่าน TarotFlow จะได้หัวเว็บซ้อนสองอัน
 */
export default function EnBlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
