/**
 * 🧩 "ของล่องหน" ของทุกหน้าที่ Astro เรนเดอร์ — เขียนเป็นสคริปต์ธรรมดา ไม่ใช่ island
 * ===========================================================================
 *
 * ## ทำไมต้องมีไฟล์นี้ (วัดจริง 2026-09-17)
 *
 * เดิมสามอย่างนี้ถูกห่อเป็น island `ClientChromeRoot` แล้ว hydrate ด้วย `client:idle`
 * ทั้งที่ **ไม่มีอะไรเป็น UI สักตัว** ผลคือทุกหน้าเนื้อหาต้องโหลด React 184 KB
 * มารันโค้ดไม่กี่สิบบรรทัด — วัดบนหน้า `/spreads` ด้วย Lighthouse (มือถือ · simulate):
 *
 *   | | เดิม (มี island) | เขียนเป็นสคริปต์ |
 *   | JS ที่โหลด | 278.7 KB | **1.8 KB** |
 *   | bootup-time | 140 ms | 39 ms |
 *   | script evaluation | 140 ms | 41 ms |
 *
 * ## ⚠️ กติกาของไฟล์นี้
 *
 * 1. **ห้ามคัดลอกตรรกะมาไว้ที่นี่** — ทุกอย่างเรียกจากโมดูลกลางที่ฝั่ง Next ใช้ตัวเดียวกัน
 *    (`@/lib/analytics-bootstrap` · `@/components/pwa/sw-register`) เพราะตรรกะความยินยอม
 *    PDPA ที่อยู่สองที่จะหลุดจากกันเสมอ
 * 2. **ห้ามนำเข้าอะไรที่ลาก React ตามมา** ไฟล์นี้อยู่บนทุกหน้า นำเข้าผิดตัวเดียว
 *    บันเดิลกลับไป 184 KB ทันที (กับดักเดียวกับที่เคยทำให้ island พองเป็น 980 KB)
 */

import { bootstrapAnalytics } from "@/lib/analytics-bootstrap";
import { setAnalyticsConsent } from "@/lib/analytics";
import { writeConsent, type ConsentChoice } from "@/lib/analytics-consent";
import {
  createSessionSkipFlag,
  isServiceWorkerAllowed,
  safeSessionStorage,
  setupServiceWorker,
  type SwContainerLike,
} from "@/components/pwa/sw-register";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import { SITE_NAME_TH, SITE_ORIGIN } from "@/lib/config/site-constants";

/* ── 1 · เกราะกันดูดเนื้อหา ─────────────────────────────────────────────────
   แปะเครดิตเมื่อคัดลอกคำทำนายยาว ๆ และกันลากภาพไพ่ 1909 ออกไปตรง ๆ */
function installAntiTheftShield(): void {
  const handleCopy = (e: ClipboardEvent) => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString();
    if (!text || text.trim().length < 60) return;

    const anchor = selection.anchorNode?.parentElement;
    const isReadingContainer =
      anchor?.closest("[data-reading-result]") || anchor?.closest(".prose-oracle");
    if (!isReadingContainer) return;

    const watermark = `\n\nคำทำนายพยากรณ์โดย: ${SITE_NAME_TH}\nเว็บไซต์: ${SITE_ORIGIN}`;
    if (e.clipboardData) {
      e.preventDefault();
      e.clipboardData.setData("text/plain", text + watermark);
    }
  };

  const handleDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null;
    if (target && target.tagName === "IMG") e.preventDefault();
  };

  document.addEventListener("copy", handleCopy);
  document.addEventListener("dragstart", handleDragStart);
}

/* ── 2 · Service Worker ────────────────────────────────────────────────────
   ⚠️ ตรรกะทั้งหมดอยู่ใน `sw-register.ts` โดยตั้งใจ (บทเรียน R-01: บั๊กที่ทำให้ผู้ใช้ใหม่
   โหลดเอกสารสองรอบซ่อนอยู่ในโค้ด 5 บรรทัดที่เคยฝังใน useEffect จนทดสอบไม่ได้)
   ด่าน `test-sw-reload.ts` เฝ้าอยู่ว่าตรรกะไม่ย้ายกลับมา */
function installServiceWorker(): void {
  if (!("serviceWorker" in navigator)) return;
  if (!isServiceWorkerAllowed(window.location.protocol, window.location.hostname)) return;

  setupServiceWorker({
    container: navigator.serviceWorker as unknown as SwContainerLike,
    reload: () => window.location.reload(),
    isDocumentReady: () => document.readyState === "complete",
    onWindowLoad: (fn) => window.addEventListener("load", fn, { once: true }),
    offWindowLoad: (fn) => window.removeEventListener("load", fn),
    onPageHide: (fn) => {
      window.addEventListener("pagehide", fn);
      return () => window.removeEventListener("pagehide", fn);
    },
    skipFlag: createSessionSkipFlag(safeSessionStorage(), STORAGE_KEYS.swSkipRequestedAt),
    log: (level, message, detail) => {
      if (level === "warn") console.warn(message, detail);
      else console.info(message);
    },
  });
}

/* ── 3 · แถบขอความยินยอม (PDPA) ────────────────────────────────────────────
   markup ของแถบถูกเรนเดอร์ฝั่งเซิร์ฟเวอร์ไว้แล้วเสมอ และซ่อนด้วย CSS จนกว่าสคริปต์
   ใน <head> จะตั้ง `data-consent-ask` ให้ (เฉพาะเครื่องที่ยังไม่เคยตัดสินใจ)
   ⚠️ ห้ามย้ายกลับไปเรนเดอร์หลังโหลด — ของเดิมทำแบบนั้นแล้วแถบกลายเป็นตัว LCP
   ของหน้าแรกที่วาดช้ากว่า FCP หลายวินาที (วัดจริงได้ LCP 9.6 วินาที) */
function installConsentBanner(): void {
  const banner = document.querySelector<HTMLElement>("[data-consent-banner]");
  if (!banner) return;

  const decide = (choice: ConsentChoice) => {
    writeConsent(choice); // จำไว้ต่อเครื่อง + ยิง event ให้ Meta Pixel เริ่มทำงาน
    setAnalyticsConsent(choice === "granted"); // Google Consent Mode v2
    // ถอดสวิตช์ CSS ทิ้งด้วย ไม่ใช่แค่ซ่อน markup — กันแถบกะพริบกลับมาหนึ่งเฟรม
    document.documentElement.removeAttribute("data-consent-ask");
    banner.remove();
  };

  banner
    .querySelector<HTMLButtonElement>("[data-consent-accept]")
    ?.addEventListener("click", () => decide("granted"));
  banner
    .querySelector<HTMLButtonElement>("[data-consent-reject]")
    ?.addEventListener("click", () => decide("denied"));
}

installAntiTheftShield();
installServiceWorker();
installConsentBanner();
bootstrapAnalytics();
