/**
 * 📊 หน้าแรก: นับว่าคนเลื่อนมาเห็น/กดส่วนไหน + เติมตัวนับคำทำนาย — สคริปต์ธรรมดา ไม่ลาก React
 * ===========================================================================
 * (แผนหน้าแรก ข้อ 3 และ 6)
 *   • `home_section_view` — ส่วนที่มี `data-home-section` โผล่ในจอครั้งแรก (ครั้งเดียวต่อการโหลดหน้า)
 *   • `home_click`        — แตะลิงก์/ปุ่มในส่วนนั้น · target = `data-home-target` หรือ path ของลิงก์
 *     ⚠️ ห้ามส่งข้อความในปุ่มหรือข้อความที่ผู้ใช้พิมพ์ (บางปุ่มมีชื่อเล่นผู้ใช้)
 *   • ตัวนับ `[data-reading-counter]` — ยิง `/api/stats/public` (แคชที่ขอบ) เมื่อเลื่อนมาใกล้เท่านั้น
 *     ยอดต่ำกว่า `data-min` หรืออ่านไม่ได้ = ปล่อยซ่อนไว้ตามเดิม
 *
 * ⚠️ ส่วนต่าง ๆ อยู่ใน slot ของ `TarotFlow` ซึ่งถูกถอดออกตอนเข้าขั้นดูดวงแล้วใส่ DOM ชุดใหม่กลับมา
 *    (เหตุผลเดียวกับ `home-rails.ts`) คลิกจึงดักที่ document ส่วนการเฝ้าดูจอสแกนหา element ใหม่ทุกครั้งที่ DOM เปลี่ยน
 */
import { trackEvent } from "@/lib/analytics";

const SECTION = "[data-home-section]";
const COUNTER = "[data-reading-counter]";

const seenSections = new Set<string>();
const watched = new WeakSet<Element>();
let counterValue: number | null | undefined; // undefined = ยังไม่ได้ยิง · null = อ่านไม่ได้
let counterRequest: Promise<number | null> | null = null;
const counterOf = new WeakMap<Element, HTMLElement>();

function sectionName(el: Element): string {
  return el.getAttribute("data-home-section") || "unknown";
}

function clickTarget(el: Element): string {
  const explicit = el.closest("[data-home-target]")?.getAttribute("data-home-target");
  if (explicit) return explicit.slice(0, 80);
  const link = el.closest("a[href]") as HTMLAnchorElement | null;
  if (link) {
    try {
      const url = new URL(link.href, location.href);
      return url.origin === location.origin ? `${url.pathname}${url.hash}` : url.hostname;
    } catch {
      return "link";
    }
  }
  return "button";
}

document.addEventListener(
  "click",
  (event) => {
    const el = (event.target as Element | null)?.closest("a, button, [role='button'], [data-home-target]");
    const section = el?.closest(SECTION);
    if (!el || !section) return;
    trackEvent("home_click", { section: sectionName(section), target: clickTarget(el) });
  },
  { capture: true },
);

function loadCounter(): Promise<number | null> {
  counterRequest ??= fetch("/api/stats/public", { credentials: "omit" })
    .then((r) => (r.ok ? r.json() : null))
    .then((d: { readings?: unknown } | null) => (typeof d?.readings === "number" ? d.readings : null))
    .catch(() => null)
    .then((value) => {
      counterValue = value;
      return value;
    });
  return counterRequest;
}

function fillCounter(el: HTMLElement, value: number | null): void {
  const min = Number(el.dataset.min ?? "0");
  if (value === null || !Number.isFinite(value) || value < min) return;
  const slot = el.querySelector("[data-reading-counter-value]");
  if (!slot) return;
  slot.textContent = value.toLocaleString(document.documentElement.lang === "en" ? "en-US" : "th-TH");
  el.hidden = false;
}

const sectionObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            sectionObserver?.unobserve(entry.target);
            const name = sectionName(entry.target);
            if (seenSections.has(name)) continue;
            seenSections.add(name);
            trackEvent("home_section_view", { section: name });
          }
        },
        { threshold: 0.35 },
      )
    : null;

const counterObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            counterObserver?.unobserve(entry.target);
            const el = counterOf.get(entry.target);
            if (el) void loadCounter().then((value) => fillCounter(el, value));
          }
        },
        { rootMargin: "600px 0px" },
      )
    : null;

function scan(): void {
  document.querySelectorAll(SECTION).forEach((el) => {
    if (watched.has(el)) return;
    watched.add(el);
    sectionObserver?.observe(el);
  });
  document.querySelectorAll<HTMLElement>(COUNTER).forEach((el) => {
    if (watched.has(el)) return;
    watched.add(el);
    // ได้ยอดมาแล้วตั้งแต่รอบก่อน (กลับมาจากขั้นดูดวง) — เติมเลย ไม่ต้องยิงซ้ำ
    if (counterValue !== undefined) {
      fillCounter(el, counterValue);
      return;
    }
    // ⚠️ เฝ้าที่ส่วนแม่ ไม่ใช่ตัวนับเอง — ตัวนับ `hidden` (display:none) ไม่มีวัน "โผล่ในจอ" ให้ observer เห็น
    const anchor = el.closest(SECTION) ?? el.parentElement;
    if (!anchor) return;
    counterOf.set(anchor, el);
    counterObserver?.observe(anchor);
  });
}

scan();
let pendingScan = 0;
const WATCHED = `${SECTION}, ${COUNTER}`;
// ระหว่างสตรีมคำทำนาย DOM เปลี่ยนถี่มาก — สแกนเฉพาะเมื่อมี element ที่เกี่ยวข้องถูกใส่เข้ามาจริง
new MutationObserver((mutations) => {
  if (pendingScan) return;
  const relevant = mutations.some((m) =>
    Array.from(m.addedNodes).some(
      (node) => node instanceof Element && (node.matches(WATCHED) || node.querySelector(WATCHED) !== null),
    ),
  );
  if (!relevant) return;
  pendingScan = requestAnimationFrame(() => {
    pendingScan = 0;
    scan();
  });
}).observe(document.body, { childList: true, subtree: true });
