import type { Metadata } from "next";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { noindexAlternates } from "@/lib/config/site";
import { ThaiPhrases } from "@/components/ui/ThaiPhrases";

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
  // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน) — ตัดทิ้ง
  alternates: noindexAlternates(),
};

export const notFoundMetadataEn: Metadata = {
  title: "Page Not Found",
  description: "The page you are looking for may have been moved or does not exist.",
  robots: { index: false, follow: true },
  // A6-01: หน้า noindex ห้ามสืบทอด canonical/hreflang ของหน้าแรก (สัญญาณขัดกัน) — ตัดทิ้ง
  alternates: noindexAlternates(),
};

const COPY = {
  th: {
    title: "ไม่พบหน้าที่คุณกำลังตามหา",
    desc: "หน้านี้อาจถูกย้ายหรือไม่เคยมีอยู่ ลองเลือกทางใดทางหนึ่งด้านล่างเพื่อกลับเข้าวิหารอีกครั้ง",
    navLabel: "ทางลัดกลับเข้าเว็บ",
    links: [
      { href: "/", label: "เริ่มดูดวงที่หน้าแรก" },
      { href: "/cards", label: "คัมภีร์ไพ่ 78 ใบ" },
      { href: "/spreads", label: "ผังพยากรณ์ 26 แบบ" },
      { href: "/blog", label: "บทความดูดวง" },
    ],
    helpline: "สายด่วนสุขภาพจิต 1323",
  },
  en: {
    title: "Page Not Found",
    desc: "The page you are looking for may have been moved or does not exist. Choose one of the paths below to return to the sanctuary.",
    navLabel: "Navigation shortcuts",
    links: [
      { href: "/en", label: "Home Reading Chamber" },
      { href: "/en/cards", label: "Tarot Encyclopedia (78 Cards)" },
      { href: "/en/spreads", label: "Sacred Spreads (26 Spreads)" },
      { href: "/en/daily", label: "Daily Oracle Card" },
    ],
    helpline: "Mental Health Support: Call 1323 (TH) or 988 (US)",
  },
} as const;

/**
 * เนื้อในของหน้า 404 **ล้วน ๆ ไม่มีหัวเว็บและฟุตเตอร์** (R-25)
 * ---------------------------------------------------------------------------
 * แยกออกมาเพราะหน้า 404 ต้องมีสองร่างที่ใช้ข้อความชุดเดียวกัน:
 *   • ฝั่ง Next  — `NotFoundBody` ข้างล่าง ห่อหัวเว็บ/ฟุตเตอร์ให้เสร็จในตัว
 *   • ฝั่ง Astro — `astro/pages/404.astro` ประกอบหัวเว็บเองด้วย island `client:idle`
 *     เพื่อให้เมนูมือถือกดได้จริง (เรนเดอร์ `<SiteHeader />` ตรง ๆ ใน Astro จะได้ HTML
 *     นิ่ง ๆ ที่กดไม่ได้)
 *
 * ⚠️ ข้อความอยู่ใน `COPY` ที่เดียว ห้ามคัดลอกไปเขียนซ้ำในไฟล์ `.astro`
 * สองหน้านี้ต้องพูดเหมือนกันเสมอ (บทเรียน INC-0112)
 */
export function NotFoundMain({ forcedLocale = "th" }: { forcedLocale?: "th" | "en" } = {}) {
  const copy = forcedLocale === "en" ? COPY.en : COPY.th;

  return (
    <main id="main-content" tabIndex={-1} className="min-h-[60vh] bg-canvas text-ink flex items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center space-y-8">
        <div className="space-y-4">
          <span aria-hidden="true" className="block text-4xl font-serif-th font-bold text-gold">404</span>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif-th leading-normal pt-1"><ThaiPhrases>
            {copy.title}
          </ThaiPhrases></h1>
          <p className="text-sm text-muted font-serif-th leading-relaxed">
            {copy.desc}
          </p>
        </div>

        <nav aria-label={copy.navLabel} className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          {copy.links.map((link) => (
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
          <span className="text-ok font-medium">{copy.helpline}</span>
        </p>
      </div>
    </main>
  );
}

/** เนื้อหน้า 404 พร้อมหัวเว็บและฟุตเตอร์กลาง — ทางออกจากหน้าต้องมีครบเหมือนหน้าอื่นทั้งเว็บ */
export function NotFoundBody({ forcedLocale = "th" }: { forcedLocale?: "th" | "en" } = {}) {
  return (
    <>
      <SiteHeader />
      <NotFoundMain forcedLocale={forcedLocale} />
      <SiteFooter spacing="tight" />
    </>
  );
}
