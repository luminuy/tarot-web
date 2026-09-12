import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

/**
 * 🚧 เนื้อหน้า 404 — ใช้ร่วมกันสองที่ (INC-0112)
 * ---------------------------------------------------------------------------
 * 1. `src/app/(th)/not-found.tsx` — ใช้ตอน `notFound()` ถูกเรียกจากหน้าในต้นไม้ไทย
 *    (เช่น `/cards/<ไอดีที่ไม่มีจริง>`) หน้านี้อยู่ใต้ root layout อยู่แล้ว
 * 2. `src/app/not-found.tsx` — ใช้ตอน URL **ไม่ตรงกับ route ไหนเลย** (เช่น `/zzz`)
 *    ชั้นนั้นอยู่นอก route group จึงไม่มี root layout ต้องเรนเดอร์ `<html>` เอง
 *
 * ⚠️ เว็บนี้มี root layout สองตัว (`(th)` และ `(en)`) ทั้งคู่อยู่ใน route group
 * Next จึงหา root not-found ไม่เจอ ถ้าไม่มีไฟล์ `src/app/not-found.tsx` วางไว้นอกกลุ่ม
 * ผลคือ URL ที่พิมพ์ผิดทุกเส้นจะได้หน้า 404 ดีฟอลต์ของ Next ("This page could not be
 * found.") ซึ่งเป็นภาษาอังกฤษล้วน ไม่มีแบรนด์ ไม่มีหัวเว็บ และไม่มีลิงก์กลับเข้าเว็บสักเส้น
 */
export const notFoundMetadata: Metadata = {
  title: "ไม่พบหน้าที่คุณกำลังตามหา",
  description: "หน้าที่คุณเปิดอาจถูกย้ายหรือไม่มีอยู่แล้ว กลับไปเลือกผังพยากรณ์หรือเปิดคัมภีร์ไพ่ 78 ใบได้ที่นี่",
  robots: { index: false, follow: true },
};

const LINKS = [
  { href: "/", label: "เริ่มดูดวงที่หน้าแรก" },
  { href: "/cards", label: "คัมภีร์ไพ่ 78 ใบ" },
  { href: "/spreads", label: "ผังพยากรณ์ 25 แบบ" },
  { href: "/blog", label: "บทความดูดวง" },
];

/** เนื้อหน้า 404 พร้อมหัวเว็บและฟุตเตอร์กลาง — ทางออกจากหน้าต้องมีครบเหมือนหน้าอื่นทั้งเว็บ */
export function NotFoundBody() {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="min-h-[60vh] bg-canvas text-ink flex items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center space-y-8">
          <div className="space-y-4">
            <span aria-hidden="true" className="block text-4xl font-serif-th font-bold text-gold">404</span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-th leading-normal pt-1">
              ไม่พบหน้าที่คุณกำลังตามหา
            </h1>
            <p className="text-sm text-muted font-serif-th leading-relaxed">
              หน้านี้อาจถูกย้ายหรือไม่เคยมีอยู่ ลองเลือกทางใดทางหนึ่งด้านล่างเพื่อกลับเข้าวิหารอีกครั้ง
            </p>
          </div>

          <nav aria-label="ทางลัดกลับเข้าเว็บ" className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-5 py-2.5 rounded-full bg-surface border border-line text-sm font-serif-th shadow-xs transition-colors hover:text-gold-ink hover:border-gold"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-xs text-muted font-serif-th">
            <span className="text-ok font-medium">สายด่วนสุขภาพจิต 1323</span>
          </p>
        </div>
      </main>
      <SiteFooter spacing="tight" />
    </>
  );
}
