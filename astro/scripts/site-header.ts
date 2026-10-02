/**
 * 🧭 หัวเว็บของหน้าที่ Astro เรนเดอร์ — ทำงานด้วยสคริปต์ธรรมดา ไม่ต้อง hydrate React
 * ===========================================================================
 *
 * markup ทั้งหมด (รวมลิ้นชักนำทางและไพ่ย่อในเมนู) ถูกเรนเดอร์ฝั่งเซิร์ฟเวอร์ไว้แล้ว
 * ไฟล์นี้ทำแค่ 4 อย่างที่ HTML ล้วนทำเองไม่ได้ — วิธีเดียวกับแท็บของคลังผัง (R-02):
 *
 *   1. เปิด/ปิดลิ้นชัก (สลับคลาสชุดเดียวกับที่ React เคยสลับ + `aria-expanded` / `aria-hidden`)
 *   2. พฤติกรรมของหน้าต่างลอย: ปิดด้วย Esc · กักโฟกัสไม่ให้หลุดไปหลังฉาก · ล็อกไม่ให้หน้าหลังเลื่อน
 *      · คืนโฟกัสให้ปุ่มเดิมตอนปิด (กติกาเดียวกับ `useDialogBehavior` ฝั่ง React — UX-08)
 *   3. ปุ่มสลับภาษา: จำภาษาไว้ที่เครื่อง แล้วพาไปยัง URL ฝาแฝดถ้ามี
 *   4. วัดความสูงจริงของหัวเว็บแล้วประกาศเป็น `--site-header-h` ให้ตัวกันที่ใช้ (INC-0109)
 *
 * ⚠️ ห้ามนำเข้าอะไรที่ลาก React ตามมา — ไฟล์นี้อยู่บนทุกหน้า
 */

import { LOCALE_COOKIE_KEY } from "@/lib/i18n/types";
import { hasSessionHint } from "@/lib/auth/session-hint";

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * หัวเว็บที่อยู่ใน island (หน้าแรก `/` · `/en` — `TarotFlow` เรนเดอร์หัวเว็บ React ของตัวเอง)
 * React คุมลิ้นชัก/ปุ่มภาษา/ความสูงเองครบแล้ว ถ้าสคริปต์นี้ผูกซ้ำจะมีตัวจัดการสองชุดแย่งกัน:
 * ปิดเมนูแล้ว cleanup ของ `useDialogBehavior` คืน `body.overflow = "hidden"` ทับ ➔ หน้าเลื่อนไม่ได้อีก (A4-03)
 * กติกา: สคริปต์นี้แตะเฉพาะหัวเว็บ static เท่านั้น
 */
function ownedByIsland(el: Element | null | undefined): boolean {
  return !!el?.closest("astro-island");
}

/** ปุ่ม/แผงของลิ้นชัก — ชื่อคลาสต้องตรงกับที่ `globals.css` และ React ใช้ทุกตัว */
function installNavDrawer(): void {
  const trigger = document.querySelector<HTMLButtonElement>('[aria-controls="sacred-nav-panel"]');
  const panel = document.getElementById("sacred-nav-panel");
  if (!trigger || !panel) return;
  if (ownedByIsland(trigger) || ownedByIsland(panel)) return;

  const scrim = document.querySelector<HTMLElement>("[data-nav-scrim]");
  const closeButton = panel.querySelector<HTMLButtonElement>("[data-nav-close]");
  let previousActive: HTMLElement | null = null;
  let originalOverflow = "";
  let open = false;

  const setOpen = (next: boolean) => {
    if (next === open) return;
    open = next;

    trigger.setAttribute("aria-expanded", String(next));
    trigger.classList.toggle("bg-inset", next);

    panel.setAttribute("aria-hidden", String(!next));
    panel.classList.toggle("nav-drawer-panel-entering", next);
    panel.classList.toggle("nav-drawer-panel-exiting", !next);
    scrim?.classList.toggle("nav-drawer-scrim-entering", next);
    scrim?.classList.toggle("nav-drawer-scrim-exiting", !next);

    if (next) {
      previousActive = document.activeElement as HTMLElement | null;
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      // รอให้แผงเข้าที่ก่อนค่อยย้ายโฟกัส ไม่งั้นเบราว์เซอร์จะเลื่อนหน้าไปหา element ที่ยังอยู่นอกจอ
      requestAnimationFrame(() => {
        (closeButton ?? panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR))?.focus();
      });
    } else {
      document.body.style.overflow = originalOverflow;
      previousActive?.focus?.();
      previousActive = null;
    }
  };

  trigger.addEventListener("click", () => setOpen(!open));
  scrim?.addEventListener("click", () => setOpen(false));
  closeButton?.addEventListener("click", () => setOpen(false));

  // ปิดเมื่อกดลิงก์ในลิ้นชัก — หน้าใหม่โหลดเต็มอยู่แล้ว แต่ต้องคืนสกรอลล์ก่อนออกจากหน้า
  panel.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    if (target?.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (!open) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // แผงอื่นในหน้าเดียวกันสั่งปิดเมนูได้ผ่าน event เดิมที่ฝั่ง React ใช้อยู่
  window.addEventListener("tarot:close-menus", (event) => {
    const detail = (event as CustomEvent<{ except?: string }>).detail;
    if (detail?.except !== "sacred-nav") setOpen(false);
  });
}

/**
 * ตัวเลือกภาษา (`LanguageSwitcher`) — ลิงก์ในแผงชี้ไปหน้าฝาแฝดเองอยู่แล้ว ไฟล์นี้แค่:
 *   · จำภาษาที่เลือกไว้ที่เครื่องก่อนเบราว์เซอร์เปลี่ยนหน้า
 *   · หน้าที่ไม่มีฝาแฝด (เป็นปุ่ม) ➔ จำภาษาอย่างเดียว แล้วย้ายเครื่องหมายถูก — ไม่รีโหลด (ไม่มีหน้าภาษาอื่นให้ไป)
 *   · คีย์บอร์ด: เปิดด้วยคีย์บอร์ดแล้วโฟกัสภาษาปัจจุบัน · ↑ ↓ เลื่อน · Esc ปิดแล้วคืนโฟกัสให้ปุ่ม · แตะนอกแผงปิด
 */
function installLanguageSwitcher(): void {
  const menu = document.querySelector<HTMLDetailsElement>("[data-locale-menu]");
  if (!menu || ownedByIsland(menu)) return;
  const summary = menu.querySelector("summary");
  const items = Array.from(menu.querySelectorAll<HTMLElement>("[data-locale-switch]"));

  const close = (refocus: boolean) => {
    menu.open = false;
    if (refocus) summary?.focus();
  };

  document.addEventListener("pointerdown", (e) => {
    if (menu.open && !menu.contains(e.target as Node)) close(false);
  });

  menu.addEventListener("toggle", () => {
    if (menu.open && summary?.matches(":focus-visible")) {
      items.find((el) => el.getAttribute("aria-current") === "true")?.focus();
    }
  });

  menu.addEventListener("keydown", (e) => {
    if (!menu.open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close(true);
      return;
    }
    const step = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = items.indexOf(document.activeElement as HTMLElement);
    items[(i + step + items.length) % items.length]?.focus();
  });

  items.forEach((item) => {
    item.addEventListener("click", (e) => {
      const next = item.dataset.localeSwitch === "en" ? "en" : "th";
      if (item.getAttribute("aria-current") === "true") {
        e.preventDefault();
        close(true);
        return;
      }
      try {
        document.cookie = `${LOCALE_COOKIE_KEY}=${next}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
        localStorage.setItem(LOCALE_COOKIE_KEY, next);
      } catch {
        // เขียนไม่ได้ (โหมดส่วนตัว) — ลิงก์ยังพาไปหน้าฝาแฝดได้ตามปกติ
      }
      if (item.tagName === "A") return; // ปล่อยให้ลิงก์พาไปหน้าฝาแฝด
      items.forEach((other) => {
        if (other === item) other.setAttribute("aria-current", "true");
        else other.removeAttribute("aria-current");
      });
      close(true);
    });
  });
}

/**
 * วัดความสูงจริงของหัวเว็บแล้วประกาศเป็น `--site-header-h`
 *
 * ค่าตั้งต้นใน `globals.css` ตรงกับความสูงจริงอยู่แล้ว ตัวนี้มีไว้กันเคสที่ CSS เดาไม่ได้:
 * ฟอนต์ไทยโหลดช้า · ข้อความอังกฤษยาวกว่าจนขึ้นบรรทัดใหม่ · ผู้ใช้ตั้งขนาดตัวอักษรใหญ่ในระบบ
 */
function installHeaderHeightObserver(): void {
  const header = document.querySelector<HTMLElement>("[data-site-header]");
  if (!header || typeof ResizeObserver === "undefined") return;
  if (ownedByIsland(header)) return;

  let rafId: number | undefined;
  let lastHeight = 0;

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    const height = Math.ceil(entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height);
    if (height <= 0 || height === lastHeight) return;
    lastHeight = height;
    // ⚠️ ความสูงตรงกับตัวกันที่อยู่แล้ว = ห้ามเขียน — ตั้ง custom property บน <html> = คำนวณสไตล์ใหม่ทั้งหน้า (INC-0248)
    const spacer = document.querySelector<HTMLElement>("[data-site-header-spacer]");
    if (spacer && spacer.offsetHeight === height) return;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--site-header-h", `${height}px`);
    });
  });

  observer.observe(header);
}

/**
 * 5. จุดทอง "ล็อกอินอยู่" บนปุ่มบัญชี (`HeaderAccount`) — อ่านจากคุกกี้ใบ้ของเซสชันเท่านั้น
 *    ไม่ยิง `/api/auth/me` (หน้าเนื้อหาไม่ต้องรู้ว่าใคร แค่รู้ว่ามีเซสชัน) · ตรงกับจุดทองของ `UserProfileBadge`
 */
function installAccountDot(): void {
  const dot = document.querySelector<HTMLElement>("[data-header-account-dot]");
  if (!dot || ownedByIsland(dot)) return;
  if (hasSessionHint()) dot.hidden = false;
}

/**
 * 6. คนที่ยังไม่ล็อกอินแตะปุ่มบัญชี ➔ เด้งหน้าต่างเข้าสู่ระบบในหน้าเดิม (เหมือนหน้าแรก) แทนการพาไป `/account`
 *    ล็อกอินอยู่แล้ว ➔ ปล่อยให้ลิงก์พาไปหน้าบัญชีตามปกติ
 *    React + AuthModal โหลดแยกชิ้น ตอนชี้/โฟกัส (โหลดล่วงหน้า) หรือแตะเท่านั้น — ไม่เข้าบันเดิลหัวเว็บ
 *    โหลดไม่สำเร็จ (เน็ตหลุด) ➔ ไปหน้า `/account` แทน ซึ่งมีปุ่มเข้าสู่ระบบอยู่ ผู้ใช้ไม่ติดทางตัน
 */
function installAccountAuth(): void {
  const link = document.querySelector<HTMLAnchorElement>("[data-header-account]");
  if (!link || ownedByIsland(link)) return;

  const load = () => import("./header-auth");
  const prefetch = () => {
    if (!hasSessionHint()) void load().catch(() => {});
  };
  link.addEventListener("pointerenter", prefetch, { once: true });
  link.addEventListener("focus", prefetch, { once: true });

  link.addEventListener("click", (event) => {
    if (hasSessionHint()) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    const locale = document.documentElement.lang === "en" ? "en" : "th";
    load()
      .then((m) => m.openHeaderAuth(locale))
      .catch(() => {
        window.location.href = link.href;
      });
  });
}

installNavDrawer();
installLanguageSwitcher();
installHeaderHeightObserver();
installAccountDot();
installAccountAuth();
