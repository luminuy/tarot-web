"use client";

import { useEffect, useRef, type ReactNode } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useLocale } from "@/lib/i18n";

export interface SiteHeaderProps {
  /**
   * "content" = หน้าเนื้อหาทั่วไป (โลโก้ + breadcrumb + เมนู) — ค่าเริ่มต้น
   * "app"     = หน้าดูดวงหลัก (มีช่อง toolbar สำหรับ UserProfileBadge / ปุ่มรีเซ็ต)
   */
  variant?: "content" | "app";
  /** breadcrumb ของหน้านั้น — ส่งเป็น ReactNode เพื่อให้แต่ละหน้าควบคุมเนื้อหาเอง */
  breadcrumb?: ReactNode;
  /** ปุ่มเพิ่มเติมฝั่งขวา (เฉพาะ variant="app" หรือหน้าที่ต้องการปุ่มพิเศษ) */
  toolbar?: ReactNode;
  /** เมนู dropdown — ส่งเข้ามาเพื่อให้หน้าแรกส่ง callback ได้ หน้าเนื้อหาส่ง <SacredNavDropdown /> เปล่า */
  nav?: ReactNode;
}

/**
 * 🏛️ Header กลางของทั้งวิหารพยากรณ์
 * ยึดการแสดงผล โลโก้ สลับภาษา และเมนูแบบสากล ตรึงบนสุดเหมือนกันทุกหน้า
 *
 * 🧭 ทำไมเป็น `position: fixed` ไม่ใช่ `position: sticky` (INC-0109)
 * ---------------------------------------------------------------------------
 * `sticky` ไม่ใช่ "ตรึง" — มันคือ "เลื่อนตามปกติ แล้วค่อยหยุดเมื่อชนขอบ"
 * เบราว์เซอร์ต้องคำนวณระยะเยื้องใหม่ทุกเฟรมจากตำแหน่งสกรอลล์ เทียบกับ *layout viewport*
 * บน iOS Safari ขอบบนของ layout viewport ขยับเองระหว่างเลื่อน (แถบ URL ย่อ/ขยาย
 * และ rubber-band) คนละจังหวะกับภาพที่ตาเห็น (visual viewport) ค่าที่คำนวณได้จึงแกว่ง
 * ผู้ใช้เห็นเป็นหัวเว็บ "สั่น" ตอนเลื่อนขึ้นลง — แก้ด้วยการบังคับเลเยอร์ compositor ไม่ได้
 * เพราะต้นเหตุอยู่ที่ *จุดอ้างอิง* ไม่ใช่ *เลเยอร์* (พิสูจน์แล้ว 2 รอบ: INC-0107 · INC-0108)
 *
 * `fixed` ไม่มีการคำนวณนั้นเลย — เบราว์เซอร์ตรึงเลเยอร์ไว้กับ viewport ตรง ๆ
 * (Blink ให้เหตุผล compositing ว่า `FixedPosition` + `AffectedByOuterViewportBoundsDelta`
 * คือกลไกที่ชดเชยแถบ URL ให้บนเธรด compositor — sticky ไม่ได้รับกลไกนี้)
 *
 * ⚠️ `fixed` = หลุดออกจาก flow → ต้องมีตัวกันที่ (`[data-site-header-spacer]`) เสมอ
 * ตัวกันที่อยู่ในคอมโพเนนต์นี้เอง ทุกหน้าที่เรียก <SiteHeader /> จึงได้ไปด้วยอัตโนมัติ
 * ห้ามลบ และห้ามแยกไปให้หน้าเรียกใส่เอง (จะลืมทีละหน้าแน่นอน)
 */
export function SiteHeader({
  variant = "content",
  breadcrumb,
  toolbar,
  nav,
}: SiteHeaderProps) {
  const { isEnglish } = useLocale();
  const headerRef = useRef<HTMLElement | null>(null);

  /*
   * วัดความสูงจริงของหัวเว็บแล้วประกาศเป็น `--site-header-h` ให้ตัวกันที่และ
   * `scroll-padding-top` ใช้ค่าเดียวกัน
   *
   * ค่าตั้งต้นใน globals.css ตรงกับความสูงจริงที่วัดไว้อยู่แล้ว (69px / 82px)
   * เอฟเฟกต์นี้จึงไม่ทำให้เกิด layout shift ตอนโหลด — มีไว้กันเคสที่ความสูงเปลี่ยน
   * โดยที่ CSS เดาไม่ได้: ฟอนต์ไทยโหลดช้า · ข้อความอังกฤษยาวกว่าจนขึ้นบรรทัดใหม่ ·
   * `toolbar` ของ variant="app" สูงกว่าปกติ · ผู้ใช้ตั้งขนาดตัวอักษรใหญ่ในระบบ
   * ถ้าไม่มีตัวนี้ ตัวกันที่จะเตี้ยกว่าหัวเว็บแล้วหัวเว็บจะทับเนื้อหาบรรทัดแรกทันที
   *
   * `offsetHeight` รวม `padding-top: env(safe-area-inset-top)` มาให้แล้ว
   * จึงเซ็ตเป็น px ดิบได้เลย ไม่ต้องบวก env() ซ้ำ
   */
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const publish = () => {
      // ปัดขึ้นเสมอ — ปัดลงแม้แค่เศษพิกเซลก็แปลว่าตัวกันที่เตี้ยกว่าหัวเว็บ = หัวเว็บกินเนื้อหา
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--site-header-h", `${h}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/*
        ตัวกันที่ของหัวเว็บที่หลุดจาก flow — สูงเท่าหัวเว็บเป๊ะ
        ห้ามใส่เนื้อหาใด ๆ ข้างใน และห้ามให้มันมีขอบ/เงา (จะเห็นเป็นเส้นซ้อนใต้หัวเว็บ)
      */}
      <div data-site-header-spacer="" aria-hidden="true" />

      <header
        ref={headerRef}
        data-site-header=""
        data-variant={variant}
        className="w-full border-b border-line bg-surface fixed top-0 inset-x-0 z-50 shadow-raised"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Luxury Brand Logo & Return to Home */}
          <Link
            href="/"
            aria-label={isEnglish ? "SeerTarot — Return to Home" : "ดูดวงไพ่ทาโรต์ — กลับหน้าแรก"}
            className="flex min-w-0 shrink items-center gap-2.5 sm:gap-3.5 cursor-pointer group select-none rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border border-line overflow-hidden relative flex-shrink-0 bg-canvas group-hover:scale-105 transition duration-300">
              <img
                src="/logo.webp"
                alt="SeerTarot"
                width={44}
                height={44}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>

            <div className="hidden min-w-0 flex-col justify-center sm:flex">
              <div className="flex min-w-0 items-center">
                <span className="font-serif-th text-sm sm:text-lg font-bold text-ink tracking-wide leading-snug py-0.5 whitespace-nowrap">
                  {isEnglish ? "SeerTarot Sanctuary" : "ดูดวงไพ่ทาโรต์"}
                </span>
              </div>
              <span className="hidden sm:block text-[13px] tracking-[0.22em] text-muted font-mono uppercase font-semibold">
                1909 RIDER-WAITE TAROT
              </span>
            </div>
          </Link>

          {/* Right Toolbar, Language Switcher & Navigation */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <LanguageSwitcher />
            {toolbar}
            {nav ?? <SacredNavDropdown />}
          </div>
        </div>

        {breadcrumb ? (
          <div className="max-w-6xl mx-auto px-4 pb-2.5 -mt-0.5">{breadcrumb}</div>
        ) : null}
      </header>
    </>
  );
}
