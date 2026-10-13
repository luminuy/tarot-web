/**
 * 🎨 SeerTarot UI 2.0 — สคริปต์ธรรมดาของหน้าแรก (ไม่ลาก React · แผน UI_2_0 หัวข้อ 3.3 · 5.2 · 6.2)
 * ===========================================================================
 *   1. ตัวกันพัง FPS — ระดับ full เท่านั้น วัดเวลาเฟรม 2 วินาทีแล้วหยุด (ไม่ใช่ลูปถาวร · ด่าน motion กฎ 3)
 *      ค่ากลาง > 22ms (ต่ำกว่า ~45fps) ➔ `data-fx="lite"` ทันที + จำใน sessionStorage + ส่ง `ui2_fx_downgrade`
 *   2. หยุดอนิเมชันวนเมื่อส่วนพ้นจอ — IntersectionObserver ตัวเดียวสลับ `data-inview` ของ `[data-anim-section]`
 *   3. นาฬิกานับถอยหลังไพ่ประจำวัน — HTML ส่ง `--` มาจากเซิร์ฟเวอร์ (กันเลขค้างจากตอนบิลด์ · กับดักข้อ 10)
 *      เดินทีละวินาที **เฉพาะตอนนาฬิกาอยู่ในจอ** · ถึงเที่ยงคืนเปลี่ยนป้ายเป็น "ไพ่ใบใหม่มาแล้ว"
 *   4. แถบปุ่มติดล่างจอ (มือถือ) — โผล่หลังเลื่อนพ้นหัวหน้า · ซ่อนเมื่อส่วนเปิดไพ่หรือส่วนปิดท้ายอยู่ในจอ
 *   6. หัวเว็บกระจกมืด — ตั้ง `data-ui2-over-dark` บน <html> เมื่อส่วนพื้นมืด (`[data-ui2-dark]`) อยู่ใต้แคปซูลหัวเว็บ
 *      (ผู้สังเกตการณ์ตัวที่สองที่เฝ้าแค่แถบบนสุดของจอ · ถอดออกเมื่อออกจากหน้าเลือก)
 *   7. แท็บคลังไพ่ (หัวเรื่องซ้าย ข้อมูลขวา) — ฟังคลิก/ลูกศรที่ document ตัวเดียว (ส่วนนี้ถูกถอด/ใส่ใหม่ได้)
 *      ทุกแผงอยู่ใน HTML แล้ว แค่สลับ `hidden` + `aria-selected` ตามแบบแท็บของ WAI-ARIA
 *   8. คลังไพ่เลื่อนแล้วสลับหัวข้อเอง (คอม ≥ 1024 · fastwork.com) — เปิดเฉพาะเมื่อแผงที่สูงที่สุดพอดีจอ ไม่งั้นคงแบบกดแท็บ
 *   9. ตัวเลขนับขึ้นตอนเลื่อนถึง (1909 · ตัวเลขในคลังไพ่) — HTML มีเลขจริงอยู่แล้ว (ไม่มี JS = เห็นเลขจริง)
 *  10. ลูกเล่นตามเมาส์ (ระดับ full · คอม ≥ 1024 · เมาส์จริง) — การ์ดลอยเอนตามเมาส์ ·
 *      การ์ดเอียง 3 มิติ + แสงสะท้อน · หลังไพ่โฮโลแกรม · ปุ่มแม่เหล็ก — ตัวฟังเดียว อัปเดตครั้งเดียวต่อเฟรม
 *   5. แม่หมอตัวจริงที่ว่างเร็วสุด — ยิง `/api/marketplace/readers/featured` ตอนกล่องใกล้จอเท่านั้น
 *      ใส่ข้อความด้วย textContent (ข้อมูลจากฐานข้อมูล ห้าม innerHTML) · ไม่มีใคร/อ่านไม่ได้ = ปล่อยลิงก์ล้วน
 *
 * ⚠️ ส่วนต่าง ๆ อยู่ใน island `TarotFlow` ซึ่งถอด/ใส่ DOM ใหม่เมื่อเข้า-ออกขั้นดูดวง (เหตุผลเดียวกับ home-track.ts)
 *    จึงสแกนหา element ใหม่เมื่อ DOM ที่เกี่ยวข้องถูกใส่เข้ามาเท่านั้น
 * ⚠️ งบ JS หน้าแรก: ไฟล์นี้รวมกับสคริปต์ระดับเอฟเฟกต์ต้อง ≤ 3KB gzip (หัวข้อ 5.3 · ด่าน test-bundle-budget)
 */
import { trackEvent } from "@/lib/analytics";
import { UI2_FX_STORAGE_KEY } from "@/app/_shared/ui2-fx";
import { bangkokNextMidnightISO } from "@/lib/time/bangkok";

const root = document.documentElement;

/* ── 1. ตัวกันพัง FPS ─────────────────────────────────────────────────── */
function guardFps(): void {
  if (root.getAttribute("data-fx") !== "full") return;
  const frames: number[] = [];
  let last = 0;
  let start = 0;
  const step = (t: number) => {
    if (last) frames.push(t - last);
    else start = t;
    last = t;
    if (t - start < 2000) {
      requestAnimationFrame(step);
      return;
    }
    // แท็บถูกซ่อนระหว่างวัด rAF หยุด = ช่องว่างยักษ์ ไม่ใช่ความช้าของเครื่อง — ไม่ตัดสิน
    if (document.hidden || frames.length < 20) return;
    const sorted = frames.sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    if (median <= 22) return;
    root.setAttribute("data-fx", "lite");
    try {
      sessionStorage.setItem(UI2_FX_STORAGE_KEY, "lite");
    } catch {
      /* โหมดส่วนตัว — ลดเฉพาะหน้านี้ */
    }
    trackEvent("ui2_fx_downgrade", { median_ms: Math.round(median), viewport_w: innerWidth });
  };
  requestAnimationFrame(step);
}
// หลัง hydrate: รอหน้าโหลดเสร็จแล้วว่างก่อนค่อยวัด ไม่งั้นงาน hydrate ของ island จะถูกนับเป็นความช้าของเครื่อง
const idle = (fn: () => void) =>
  "requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 3000 }) : setTimeout(fn, 1200);
if (document.readyState === "complete") idle(guardFps);
else addEventListener("load", () => idle(guardFps), { once: true });

/* ── 3. นาฬิกา ─────────────────────────────────────────────────────────── */
const CLOCK = "[data-ui2-clock]";
const visibleClocks = new Set<Element>();
let target = Date.parse(bangkokNextMidnightISO());
let timer = 0;
const pad = (n: number) => (n < 10 ? `0${n}` : String(n));

function paint(): void {
  const left = Math.max(0, target - Date.now());
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  const s = Math.floor((left % 60_000) / 1000);
  document.querySelectorAll<HTMLElement>(CLOCK).forEach((clock) => {
    if (left === 0) clock.setAttribute("data-done", "");
    clock.querySelectorAll<HTMLElement>("[data-u]").forEach((slot) => {
      const u = slot.dataset.u;
      const text = u === "h" ? pad(h) : u === "m" ? pad(m) : u === "s" ? pad(s) : `${pad(h)}:${pad(m)}:${pad(s)}`;
      if (slot.textContent !== text) slot.textContent = text;
    });
  });
}
function tick(): void {
  timer = 0;
  if (Date.now() >= target + 1000) target = Date.parse(bangkokNextMidnightISO()); // ข้ามเที่ยงคืนแล้ว เริ่มรอบใหม่ (แท็บเปิดค้างข้ามวัน)
  paint();
  if (visibleClocks.size > 0) timer = window.setTimeout(tick, 1000 - (Date.now() % 1000) + 20);
}

/* ── 2 + 4. ผู้สังเกตการณ์ตัวเดียว ───────────────────────────────────────── */
const sticky = () => document.querySelector<HTMLElement>("[data-ui2-sticky]");
const hidesSticky = new Set<Element>(); // ส่วนที่มีปุ่มเดียวกันอยู่แล้ว (เปิดไพ่ · ปิดท้าย) + หัวหน้า
function syncSticky(): void {
  const bar = sticky();
  if (!bar) return;
  const show = hidesSticky.size === 0 && scrollY > 400;
  if (show !== bar.hasAttribute("data-show")) bar.toggleAttribute("data-show", show);
}

const observer =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target;
            if (el.hasAttribute("data-anim-section")) el.toggleAttribute("data-inview", entry.isIntersecting);
            if (el.matches(CLOCK)) {
              if (entry.isIntersecting) visibleClocks.add(el);
              else visibleClocks.delete(el);
            }
            if (el.hasAttribute("data-ui2-readers") && entry.isIntersecting) {
              observer?.unobserve(el);
              void loadReaders().then((list) => fillReaders(el, list));
            }
            if (el.hasAttribute("data-ui2-hide-sticky")) {
              if (entry.isIntersecting) hidesSticky.add(el);
              else hidesSticky.delete(el);
            }
          }
          if (visibleClocks.size > 0 && !timer) tick();
          syncSticky();
        },
        { rootMargin: "120px 0px" },
      )
    : null;

/* ── 5. แม่หมอตัวจริง ────────────────────────────────────────────────── */
interface FeaturedReader {
  id: string;
  name: string;
  avatarUrl: string | null;
  specialties: string[];
  priceThb: number;
  live: boolean;
  nextSlot: number | null;
}
let readersRequest: Promise<FeaturedReader[]> | null = null;
const loadReaders = () =>
  (readersRequest ??= fetch("/api/marketplace/readers/featured", { credentials: "omit" })
    .then((r) => (r.ok ? r.json() : { readers: [] }))
    .then((d: { readers?: FeaturedReader[] }) => (Array.isArray(d.readers) ? d.readers : []))
    .catch(() => []));

function make<K extends keyof HTMLElementTagNameMap>(tag: K, cls: string, text?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  n.className = cls;
  if (text) n.textContent = text;
  return n;
}

function fillReaders(box: Element, readers: FeaturedReader[]): void {
  const list = box.querySelector<HTMLElement>("[data-ui2-readers-list]");
  if (!list || readers.length === 0 || list.childElementCount > 0) return;
  const en = box.getAttribute("data-ui2-readers") === "en";
  const when = new Intl.DateTimeFormat(en ? "en-GB" : "th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  for (const r of readers) {
    const li = make("li", "ui2-reader");
    const a = make("a", "ui2-reader-link");
    a.href = `/readers/${encodeURIComponent(r.id)}`;
    const avatar = make("span", "ui2-reader-avatar");
    avatar.setAttribute("aria-hidden", "true");
    if (r.avatarUrl && /^(https:\/\/|\/)/.test(r.avatarUrl)) {
      const img = make("img", "");
      img.src = r.avatarUrl;
      img.alt = "";
      img.loading = "lazy";
      img.width = 44;
      img.height = 44;
      avatar.append(img);
    } else avatar.textContent = r.name.slice(0, 1);
    const body = make("span", "ui2-reader-body");
    body.append(make("span", "ui2-reader-name", r.name));
    if (r.specialties.length) body.append(make("span", "ui2-reader-meta", r.specialties.join(" · ")));
    const slot = r.live
      ? en ? "Live queue open now" : "เปิดคิวสดอยู่ตอนนี้"
      : r.nextSlot
        ? `${en ? "Next free" : "ว่าง"} ${when.format(new Date(r.nextSlot))}`
        : "";
    body.append(make("span", `ui2-reader-meta${r.live ? " is-live" : ""}`, `${slot}${slot ? " · " : ""}${en ? "from" : "เริ่ม"} ${r.priceThb.toLocaleString(en ? "en-US" : "th-TH")} ${en ? "THB" : "บาท"}`));
    a.append(avatar, body);
    li.append(a);
    list.append(li);
  }
  list.hidden = false;
}

/* ── 6. หัวเว็บกระจกมืด ──────────────────────────────────────────────── */
const underHeader = new Set<Element>();
function syncHeader(): void {
  const dark = underHeader.size > 0;
  if (dark !== root.hasAttribute("data-ui2-over-dark")) root.toggleAttribute("data-ui2-over-dark", dark);
}
// แถบเฝ้า = 40px บนสุดของจอ (กึ่งกลางแคปซูลหัวเว็บ) — ส่วนมืดที่ตัดผ่านแถบนี้ = แคปซูลอยู่บนพื้นมืด
const headerObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) underHeader.add(e.target);
            else underHeader.delete(e.target);
          }
          syncHeader();
        },
        { rootMargin: `0px 0px -${Math.max(0, innerHeight - 40)}px 0px` },
      )
    : null;

const WATCHED = `[data-anim-section], ${CLOCK}, [data-ui2-hide-sticky], [data-ui2-readers], [data-ui2-dark]`;
const seen = new WeakSet<Element>();
function scan(): void {
  // element ที่ถูกถอดออกจาก DOM ไปแล้วต้องไม่ค้างอยู่ในชุดนับ ไม่งั้นนาฬิกาเดินต่อ/แถบซ่อนถาวร
  for (const set of [visibleClocks, hidesSticky, underHeader]) for (const el of set) if (!el.isConnected) set.delete(el);
  syncHeader();
  document.querySelectorAll(WATCHED).forEach((el) => {
    if (seen.has(el)) return;
    seen.add(el);
    if (observer) observer.observe(el);
    else el.setAttribute("data-inview", "");
    if (el.hasAttribute("data-ui2-dark")) headerObserver?.observe(el);
  });
  paint();
  syncSticky();
}
scan();
addEventListener("scroll", syncSticky, { passive: true });

let pendingScan = 0;
new MutationObserver((mutations) => {
  if (pendingScan) return;
  const hit = (n: Node) => n instanceof Element && (n.matches(WATCHED) || n.querySelector(WATCHED) !== null);
  // ระหว่างสตรีมคำทำนาย DOM เปลี่ยนถี่มาก — สแกนเฉพาะเมื่อ element ที่เกี่ยวข้องถูกใส่หรือถอดจริง
  const relevant = mutations.some((m) => Array.from(m.addedNodes).some(hit) || Array.from(m.removedNodes).some(hit));
  if (!relevant) return;
  pendingScan = requestAnimationFrame(() => {
    pendingScan = 0;
    scan();
  });
}).observe(document.body, { childList: true, subtree: true });

/* ── 7. แท็บคลังไพ่ ─────────────────────────────────────────────────────── */
const TAB = ".ui2-show-tab";
function selectTab(tab: HTMLElement, focus: boolean, fromScroll = false): void {
  const tabs = tab.parentElement?.querySelectorAll<HTMLElement>(TAB) ?? [];
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute("aria-controls") ?? "");
    if (panel) panel.hidden = !on;
  }
  if (focus) tab.focus();
  if (!fromScroll) scrollToTab(tab);
  // มือถือ: แถบหัวเรื่องเลื่อนแนวนอน — เลื่อนเม็ดที่เลือกให้อยู่ในแถบ (เลื่อนเฉพาะแถบ ไม่เลื่อนทั้งหน้า)
  const bar = tab.parentElement;
  if (bar && bar.scrollWidth > bar.clientWidth) {
    bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: "smooth" });
  }
}
document.addEventListener("click", (e) => {
  const tab = (e.target as Element | null)?.closest?.<HTMLElement>(TAB);
  if (tab) selectTab(tab, false);
});
document.addEventListener("keydown", (e) => {
  const tab = (e.target as Element | null)?.closest?.<HTMLElement>(TAB);
  if (!tab?.parentElement) return;
  const tabs = Array.from(tab.parentElement.querySelectorAll<HTMLElement>(TAB));
  const i = tabs.indexOf(tab);
  const k = e.key;
  const next =
    k === "ArrowDown" || k === "ArrowRight" ? i + 1 : k === "ArrowUp" || k === "ArrowLeft" ? i - 1 : k === "Home" ? 0 : k === "End" ? tabs.length - 1 : null;
  if (next === null) return;
  e.preventDefault();
  selectTab(tabs[(next + tabs.length) % tabs.length], true);
});

/* ── 8. คลังไพ่เลื่อนแล้วสลับหัวข้อเอง ─────────────────────────────────────────── */
const calm = () => root.getAttribute("data-fx") === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;
let scrolly: { sec: HTMLElement; marker: HTMLElement; tabs: HTMLElement[]; bar: HTMLElement; top: number; range: number } | null = null;
let lockUntil = 0;
function setupScrolly(): void {
  const sec = document.querySelector<HTMLElement>(".ui2-show-sec");
  if (scrolly && scrolly.sec !== sec) scrolly = null;
  if (!sec) return;
  sec.classList.remove("is-scrolly");
  scrolly = null;
  if (calm() || innerWidth < 1024 || innerHeight < 640) return;
  const card = sec.querySelector<HTMLElement>(".ui2-show-card");
  const show = sec.querySelector<HTMLElement>(".ui2-show");
  const bar = sec.querySelector<HTMLElement>(".ui2-show-tabs");
  if (!card || !show || !bar) return;
  const tabs = Array.from(bar.querySelectorAll<HTMLElement>(TAB));
  const panels = Array.from(sec.querySelectorAll<HTMLElement>(".ui2-show-panel"));
  // วัดความสูงทุกแผงครั้งเดียว (เปิดทีละแผงชั่วคราว) — การ์ดสูงคงที่ = เลื่อนแล้วไม่กระตุก
  const was = panels.map((p) => p.hidden);
  let max = 0;
  for (const p of panels) {
    panels.forEach((o) => (o.hidden = o !== p));
    max = Math.max(max, card.offsetHeight);
  }
  panels.forEach((p, i) => (p.hidden = was[i]));
  const top = (document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 78) + 20;
  if (max > innerHeight - top - 24) return;
  let marker = sec.querySelector<HTMLElement>("[data-show-marker]");
  if (!marker) {
    marker = document.createElement("div");
    marker.setAttribute("data-show-marker", "");
    show.before(marker);
  }
  sec.style.setProperty("--show-h", `${max}px`);
  sec.style.setProperty("--steps", String(tabs.length));
  sec.classList.add("is-scrolly");
  scrolly = { sec, marker, tabs, bar, top, range: (tabs.length - 1) * innerHeight * 0.7 };
  onScrolly();
}
let scrollyRaf = 0;
function onScrolly(): void {
  scrollyRaf = 0;
  const s = scrolly;
  if (!s) return;
  const p = Math.min(1, Math.max(0, (s.top - s.marker.getBoundingClientRect().top) / s.range));
  s.bar.style.setProperty("--p", p.toFixed(3));
  if (performance.now() < lockUntil) return;
  const tab = s.tabs[Math.round(p * (s.tabs.length - 1))];
  if (tab && tab.getAttribute("aria-selected") !== "true") selectTab(tab, false, true);
}
function scrollToTab(tab: HTMLElement): void {
  const s = scrolly;
  if (!s) return;
  const i = s.tabs.indexOf(tab);
  if (i < 0) return;
  lockUntil = performance.now() + 900;
  const y = scrollY + s.marker.getBoundingClientRect().top - s.top + (i / (s.tabs.length - 1)) * s.range;
  scrollTo({ top: Math.max(0, y), behavior: "smooth" });
}
addEventListener("scroll", () => {
  if (scrolly && !scrollyRaf) scrollyRaf = requestAnimationFrame(onScrolly);
}, { passive: true });
let resizeT = 0;
addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = window.setTimeout(setupScrolly, 200);
});

/* ── 9. ตัวเลขนับขึ้น ───────────────────────────────────────────────────── */
const COUNT = ".ui2-1909, .ui2-show-stats strong";
const counted = new WeakSet<Element>();
const countObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting || counted.has(e.target)) continue;
            counted.add(e.target);
            countObserver?.unobserve(e.target);
            const el = e.target as HTMLElement;
            const text = el.textContent?.trim() ?? "";
            if (!/^\d+$/.test(text) || calm()) continue;
            const end = Number(text);
            const t0 = performance.now();
            const dur = end > 100 ? 1400 : 900;
            const step = (t: number) => {
              const k = Math.min(1, (t - t0) / dur);
              el.textContent = String(Math.round(end * (1 - Math.pow(1 - k, 3))));
              if (k < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        },
        { threshold: 0.6 },
      )
    : null;
function watchCounts(): void {
  document.querySelectorAll(COUNT).forEach((el) => {
    if (!counted.has(el)) countObserver?.observe(el);
  });
}
watchCounts();
setupScrolly();
// ฟอนต์/ภาพโหลดเสร็จแล้วความสูงแผงเปลี่ยน ➔ วัดใหม่
document.fonts?.ready.then(setupScrolly);
addEventListener("load", setupScrolly, { once: true });
// ส่วนนี้อยู่ใน island ที่ถอด/ใส่ DOM ใหม่ได้ — สนใจเฉพาะตอนส่วนคลังไพ่/ตัวเลขถูกใส่เข้ามา (ไม่สแกนทุกการเปลี่ยนแปลงระหว่างสตรีมคำทำนาย)
new MutationObserver((ms) => {
  const hit = ms.some((m) =>
    Array.from(m.addedNodes).some((n) => n instanceof Element && (n.matches(`.ui2-show-sec, ${COUNT}`) || n.querySelector(".ui2-show-sec") !== null)),
  );
  if (!hit) return;
  setupScrolly();
  watchCounts();
}).observe(document.body, { childList: true, subtree: true });

/* ── 10. ลูกเล่นตามเมาส์ ─────────────────────────────────────────────────── */
const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
const TILT = ".ui2-tile, .ui2-show-topic, .ui2-show-major, .ui2-show-sign, .ui2-fq-mock";
let last: PointerEvent | null = null;
let fxRaf = 0;
let tilted: HTMLElement | null = null;
let magnet: HTMLElement | null = null;
const fxOn = () => root.getAttribute("data-fx") === "full" && innerWidth >= 1024 && finePointer.matches;
function untilt(): void {
  if (tilted) {
    tilted.classList.remove("is-tilting");
    tilted.style.setProperty("--ta", "0deg");
    tilted = null;
  }
}
function unmagnet(): void {
  if (magnet) {
    magnet.style.setProperty("--bx", "0");
    magnet.style.setProperty("--by", "0");
    magnet = null;
  }
}
function fxFrame(): void {
  fxRaf = 0;
  const e = last;
  if (!e || !fxOn()) return;
  const t = e.target instanceof Element ? e.target : null;
  const x = e.clientX;
  const y = e.clientY;
  // การ์ดลอยหัวหน้า
  const floats = document.querySelector<HTMLElement>(".ui2-floats");
  if (floats && floats.getBoundingClientRect().bottom > 0) {
    floats.style.setProperty("--mx", ((x / innerWidth) * 2 - 1).toFixed(3));
    floats.style.setProperty("--my", ((y / innerHeight) * 2 - 1).toFixed(3));
  }
  // การ์ดเอียง 3 มิติ
  const card = t?.closest<HTMLElement>(TILT) ?? null;
  if (card !== tilted) untilt();
  if (card) {
    if (!card.hasAttribute("data-tilt")) card.setAttribute("data-tilt", "");
    const r = card.getBoundingClientRect();
    const dx = Math.max(-1, Math.min(1, ((x - r.left) / r.width) * 2 - 1));
    const dy = Math.max(-1, Math.min(1, ((y - r.top) / r.height) * 2 - 1));
    card.style.setProperty("--tx", dx.toFixed(3));
    card.style.setProperty("--ty", dy.toFixed(3));
    card.style.setProperty("--ta", `${(Math.hypot(dx, dy) * 5).toFixed(2)}deg`);
    card.style.setProperty("--gx", `${Math.round((dx + 1) * 50)}%`);
    card.style.setProperty("--gy", `${Math.round((dy + 1) * 50)}%`);
    card.classList.add("is-tilting");
    tilted = card;
  }
  // หลังไพ่โฮโลแกรม
  const pick = t?.closest<HTMLElement>(".ui2-pick-card");
  if (pick) {
    const r = pick.getBoundingClientRect();
    pick.style.setProperty("--hx", `${Math.round(100 - ((x - r.left) / r.width) * 100)}%`);
    pick.style.setProperty("--hy", `${Math.round(100 - ((y - r.top) / r.height) * 100)}%`);
  }
  // ปุ่มแม่เหล็ก
  const btn = t?.closest<HTMLElement>(".ui2-btn") ?? null;
  if (btn !== magnet) unmagnet();
  if (btn) {
    if (!btn.hasAttribute("data-magnet")) btn.setAttribute("data-magnet", "");
    const r = btn.getBoundingClientRect();
    btn.style.setProperty("--bx", ((x - r.left - r.width / 2) * 0.16).toFixed(1));
    btn.style.setProperty("--by", ((y - r.top - r.height / 2) * 0.3).toFixed(1));
    magnet = btn;
  }
}
addEventListener(
  "pointermove",
  (e) => {
    if (e.pointerType !== "mouse") return;
    last = e;
    if (!fxRaf) fxRaf = requestAnimationFrame(fxFrame);
  },
  { passive: true },
);
document.documentElement.addEventListener("pointerleave", () => {
  last = null;
  untilt();
  unmagnet();
});
