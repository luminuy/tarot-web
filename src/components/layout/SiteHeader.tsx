"use client";

import { useEffect, useRef, type ReactNode } from "react";
// ลิงก์ภายในต้องอยู่ในต้นไม้ภาษาเดียวกับหน้าที่ผู้ใช้ยืนอยู่ — ดู src/components/ui/LocaleLink.tsx
import { LocaleLink as Link } from "@/components/ui/LocaleLink";
import { SacredNavDropdown } from "@/components/ui/SacredNavDropdown";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { HeaderAccount } from "@/components/layout/HeaderAccount";
import { useLocale } from "@/lib/i18n";
import { stripLocalePrefix } from "@/lib/i18n/paths";
import { useCurrentPath } from "@/components/layout/current-path";
import { headerNav, isActiveNavPath } from "@/components/layout/header-nav";

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

    let rafId: number | undefined;
    let lastHeight = 0;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      // อ่านค่าจาก ResizeObserverEntry โดยตรง ไม่ต้องเรียก getBoundingClientRect() ที่ทำให้เกิด forced reflow
      const h = Math.ceil(
        entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
      );
      if (h > 0 && h !== lastHeight) {
        lastHeight = h;
        /*
         * ⚠️ ความสูงตรงกับที่ตัวกันที่ใช้อยู่แล้ว (เคสปกติเกือบทุกครั้ง) = ห้ามเขียน (INC-0248)
         * การตั้ง custom property บน <html> ทำให้เบราว์เซอร์คำนวณสไตล์ใหม่ "ทั้งหน้า"
         * วัดบนหน้าแรก (มือถือจำลอง CPU ช้า 4 เท่า): UpdateLayoutTree 87ms ทุกครั้งที่ hydrate
         * — เขียนค่าเดิมซ้ำก็โดนเต็ม ๆ · อ่าน `offsetHeight` ตรงนี้ไม่บังคับจัดหน้า
         *   เพราะ ResizeObserver เรียกกลับหลังจัดหน้าเสร็จแล้ว
         */
        const spacer = el.previousElementSibling as HTMLElement | null;
        if (spacer?.hasAttribute("data-site-header-spacer") && spacer.offsetHeight === h) return;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--site-header-h", `${h}px`);
        });
      }
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
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
        className="w-full fixed top-0 inset-x-0 z-50"
      >
        {/*
          แถบเต็มกว้างแบบ Kazumi Clinic (เจ้าของเลือก 2026-10-02) — พื้นทึบ เส้นขอบล่างบาง ไม่มีมุมโค้ง/เงาลอย
          ⚠️ ห้ามใส่ `overflow-hidden` ที่ชั้นนี้ — แผงเมนูใหญ่และลิ้นชักที่กางลงมาจะถูกตัดหาย
          ⚠️ ห้ามใส่ `relative` ให้ชั้นใน — แผงเมนูใหญ่ (`absolute inset-x-0`) ต้องอ้างอิง <header> จึงกางเต็มจอ
        */}
        <div className="site-header-glass">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-[68px] sm:px-6">
            <Link
              href="/"
              prefetch={false}
              aria-label={isEnglish ? "SeerTarot — Return to Home" : "ดูดวงไพ่ทาโรต์ — กลับหน้าแรก"}
              className="group flex min-w-0 shrink items-center gap-2.5 sm:gap-3 select-none rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
            >
              <img
                src="/logo.webp"
                alt="SeerTarot"
                width={40}
                height={40}
                loading="eager"
                className="h-9 w-9 shrink-0 rounded-full border border-line object-cover transition-transform duration-300 group-hover:scale-[1.03] sm:h-10 sm:w-10"
              />
              <span className="flex flex-col whitespace-nowrap leading-none">
                <span className="font-serif-th text-[13.5px] tracking-[0.16em] text-ink sm:text-[1.05rem] sm:tracking-[0.2em]">SEERTAROT</span>
                <span className="mt-1 font-serif-th text-[10px] tracking-[0.12em] text-muted sm:mt-1.5 sm:text-[11px] sm:tracking-[0.14em]">
                  {isEnglish ? "1909 RIDER-WAITE" : "ดูดวงไพ่ทาโรต์"}
                </span>
              </span>
            </Link>

            <DesktopNav isEnglish={isEnglish} />

            <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
              <LanguageSwitcher />
              {/* ไม่มีใครส่ง toolbar มา (หน้าเนื้อหาทั่วไป) ➔ ใส่ปุ่มบัญชีให้เอง หัวเว็บทุกหน้าจะได้เหมือนหน้าแรก */}
              {toolbar ?? <HeaderAccount />}
              {nav ?? <SacredNavDropdown />}
            </div>
          </div>

          {breadcrumb ? (
            <div className="mx-auto max-w-6xl px-4 pb-2.5 sm:px-6">{breadcrumb}</div>
          ) : null}
        </div>
      </header>
    </>
  );
}

/**
 * เมนูเรียงกลางแถบ (lg+) — ข้อ "ดูดวง" กางแผงใหญ่เต็มกว้างตอนชี้/โฟกัส ด้วย CSS ล้วน (`group-hover` · `focus-within`)
 * ไม่ต้องมี state — หัวเว็บของหน้า Astro เป็น HTML นิ่งไม่ hydrate แผงนี้จึงต้องทำงานได้โดยไม่มี JS
 * ⚠️ แผงต้องเป็น `absolute` (ห้าม `fixed` — หัวเว็บมี transform จึงเป็น containing block ของลูกทุกตัว)
 */
function DesktopNav({ isEnglish }: { isEnglish: boolean }) {
  const currentPath = stripLocalePrefix(useCurrentPath());
  const nav = headerNav(isEnglish);
  const linkClass = (href: string) =>
    `flex h-16 sm:h-[68px] items-center whitespace-nowrap transition-colors hover:text-gold-ink focus-visible:outline-none focus-visible:text-gold-ink ${
      isActiveNavPath(currentPath, href) ? "text-gold-ink" : ""
    }`;

  return (
    <nav
      aria-label={isEnglish ? "Main menu" : "เมนูหลัก"}
      className="hidden items-center gap-7 font-serif-th text-[15px] text-ink lg:flex"
    >
      <div className="group/mega">
        <Link href={nav.reading.all.href} prefetch={false} className={`${linkClass("/read")} gap-1`}>
          {nav.reading.label}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-3.5 w-3.5 transition-transform group-hover/mega:rotate-180 group-focus-within/mega:rotate-180"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </Link>
        <div className="invisible absolute inset-x-0 top-full z-50 border-b border-line bg-canvas opacity-0 shadow-[0_24px_48px_-32px_rgba(42,38,31,0.35)] transition-[opacity,visibility] duration-150 group-hover/mega:visible group-hover/mega:opacity-100 group-focus-within/mega:visible group-focus-within/mega:opacity-100">
          <div className="mx-auto grid max-w-6xl grid-cols-3 gap-x-10 px-6 pb-8 pt-9">
            {nav.reading.groups.map((group) => (
              <div key={group.title}>
                <p className="text-sm font-bold text-ink">{group.title}</p>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} prefetch={false} className="text-sm text-muted transition-colors hover:text-gold-ink focus-visible:text-gold-ink focus-visible:outline-none">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-line">
            <div className="mx-auto max-w-6xl px-6 py-4">
              <Link href={nav.reading.all.href} prefetch={false} className="text-sm font-bold text-gold-ink hover:underline focus-visible:underline focus-visible:outline-none">
                {nav.reading.all.label} →
              </Link>
            </div>
          </div>
        </div>
      </div>
      {nav.links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          prefetch={false}
          aria-current={isActiveNavPath(currentPath, link.href) ? "page" : undefined}
          className={linkClass(link.href)}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
