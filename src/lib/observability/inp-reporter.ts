import { isMeasurableHostname } from "@/lib/config/site-constants";

/**
 * 📏 INP จากผู้ใช้จริงพร้อม "ตัวการ" (attribution) ➔ `POST /api/stats/inp` ➔ Analytics Engine `seertarot_rum`
 * ===========================================================================
 *
 * ## ทำไมต้องมี (รอบ 315 · 2026-10-26)
 * CrUX ของหน้าแรก: LCP ผู้ใช้จริง 1.4 วิ ผ่าน · ตัวที่ทำ Core Web Vitals ตกคือ **INP 215 ms** ตัวเดียว
 * แต่ CrUX บอกแค่ตัวเลข ไม่บอกว่าแตะอะไร หน้าไหน ช้าตรงช่วงไหน
 * วัดในเครื่อง (CPU ×4) ได้ 150–470 ms ส่วนใหญ่เป็น presentation delay และปิดอนิเมชันทั้งหมดลดได้แค่ ~20%
 * ➔ แก้ต่อแบบเดาไม่ได้ ต้องเห็นของจริงก่อน (WORK_LOG รอบ 313)
 *
 * ## ทำอะไร
 * - ฟัง Event Timing เก็บการแตะที่ช้าที่สุดของหน้า (นิยามเดียวกับ INP: ข้าม 1 ครั้งต่อทุก 50 การแตะ)
 * - แยกเวลาเป็น 3 ช่วง: รอคิว (input delay) · โค้ดจัดการ (processing) · รอวาด (presentation)
 * - เบราว์เซอร์มี Long Animation Frames ➔ เติมเวลาสไตล์+เลย์เอาต์ และงานวาดบนเธรดหลักของเฟรมนั้น
 *   presentation ที่เหลือหลังหักงานวาดบนเธรดหลัก = งาน compositor/raster/GPU (ข้อสงสัยหลักของรอบ 313)
 * - ส่ง **ครั้งเดียวตอนออกจากหน้า** (แท็บถูกซ่อน) และ **เฉพาะเมื่อ INP ≥ 200 ms** ("ต้องปรับปรุง" ตามเกณฑ์ CWV)
 *   ➔ หน้าที่เร็วอยู่แล้วไม่ยิงคำขอเพิ่มสักเส้น (ด่าน `test-request-budget` เกณฑ์ 6)
 *
 * ## 🔒 ความเป็นส่วนตัว
 * ไม่มีคุกกี้ · ไม่มีรหัสผู้ใช้ · ไม่ส่งข้อความบนจอ (ตัวระบุ element มีแค่ชื่อแท็ก/id/คลาส) · เส้นทางตัด query/hash ทิ้ง
 * ฝั่งเซิร์ฟเวอร์ไม่เก็บ IP · ชนิดเครื่องแบบหยาบจาก UA ตัวเดียวกับสถิติวิดีโอคอล (`call-metrics.ts`)
 * จึงไม่ผูกกับแถบยินยอม PDPA เหมือนสถิติวิดีโอคอล
 *
 * ⚠️ โหลดเป็นก้อนแยกตอนว่างผ่าน `inp-loader.ts` (ทุกหน้า ทั้ง Astro และ Next) — ห้าม import ไฟล์นี้ตรง ๆ จากสคริปต์ฝั่งเบราว์เซอร์
 *    และห้ามนำเข้า zod/React หรือโมดูลฝั่งเซิร์ฟเวอร์
 *    สคีมาตรวจฝั่งเซิร์ฟเวอร์อยู่ที่ `inp-metrics.ts` (นำเข้าค่าคงที่จากไฟล์นี้ ไม่ใช่กลับกัน)
 * เบราว์เซอร์ที่ไม่มี Event Timing แบบมี `interactionId` (Safari ตอนนี้) ➔ ไม่ทำอะไรเลย (CrUX ก็นับ INP จาก Chrome)
 */

/** ส่งเฉพาะ INP ตั้งแต่ค่านี้ขึ้นไป — เส้นแบ่ง "ดี" กับ "ต้องปรับปรุง" ของ Core Web Vitals */
export const INP_REPORT_THRESHOLD_MS = 200;
export const INP_ENDPOINT = "/api/stats/inp";
/** อักษรที่ยอมให้อยู่ในตัวระบุ element/สคริปต์ — ฝั่งเซิร์ฟเวอร์ตรวจด้วยแบบเดียวกัน (กันข้อความอิสระเข้าสถิติ) */
export const TOKEN_PATTERN = /^[\w\-#.>:/@]*$/;
const clean = (s: string, max: number) => s.replace(/[^\w\-#.>:/@]/g, "").slice(0, max);

/** ข้อมูลที่ส่งหนึ่งครั้งต่อหน้า (ความหมายคอลัมน์ใน Analytics Engine อยู่ที่ `inp-metrics.ts`) */
export interface InpReport {
  /** เส้นทางตอนที่แตะ (ไม่มี query/hash) */
  route: string;
  /** ตัวระบุ element ที่ถูกแตะ เช่น `section.ui2-hero>a.ui2-btn` — ไม่มีข้อความบนจอ */
  target: string;
  /** ชนิด event ที่ช้าที่สุดของการแตะนั้น (pointerup · click · keydown …) */
  event: string;
  /** ระดับเอฟเฟกต์ UI 2.0 ตอนนั้น (`data-fx` = full · lite · off) */
  fx: string;
  /** ค่า INP (ms) */
  duration: number;
  inputDelay: number;
  processing: number;
  presentation: number;
  /** hit = เจอเฟรมยาวของการแตะนี้ · miss = เบราว์เซอร์รองรับแต่เฟรมไม่ยาวพอจะถูกบันทึก · none = ไม่รองรับ */
  loaf: "hit" | "miss" | "none";
  /** เวลาคำนวณสไตล์+เลย์เอาต์ของเฟรมนั้น (-1 = ไม่มีข้อมูล) */
  styleLayout: number;
  /** งานวาดบนเธรดหลักหลังโค้ดจัดการจบ (rAF + สไตล์ + เลย์เอาต์ + paint) (-1 = ไม่มีข้อมูล) */
  renderMain: number;
  /** สคริปต์ที่กินเวลานานสุดในเฟรมนั้น (ชนิด:ผู้เรียก หรือ path ไฟล์) */
  loafScript: string;
  /** จำนวนการแตะทั้งหน้า */
  interactions: number;
  /** แตะก่อนหน้าโหลดเสร็จ (สคริปต์ยัง hydrate อยู่) */
  beforeLoad: boolean;
  /** หน่วยความจำเครื่องแบบหยาบ (GB · 0 = ไม่รู้) */
  deviceMemory: number;
  /** จำนวนแกน CPU (0 = ไม่รู้) */
  cpuCores: number;
  /** สคริปต์ที่นานสุดในเฟรมยาวที่กำลังรันตอนแตะ — ตัวการของ "รอคิว" ("" = ไม่มีเฟรมยาว หรือเฟรมนั้นไม่มีสคริปต์) */
  blockScript: string;
  /** เฟรมยาวนั้นยังเหลืออีกกี่ ms ตอนแตะ (-1 = ไม่มีเฟรมยาวขวาง) */
  blockRemaining: number;
  /** เวลาสไตล์+เลย์เอาต์ของเฟรมที่ขวาง (-1 = ไม่มีข้อมูล) — สูง = อนิเมชัน/เลย์เอาต์กินเธรด ไม่ใช่สคริปต์ */
  blockStyleLayout: number;
}

/** ส่วนของ PerformanceEventTiming ที่ใช้ (structural — ด่านทดสอบป้อนของปลอมได้) */
export interface EventTimingLike {
  name: string;
  startTime: number;
  duration: number;
  processingStart: number;
  processingEnd: number;
  interactionId?: number;
  target?: Element | null;
}

/** ส่วนของ PerformanceLongAnimationFrameTiming ที่ใช้ */
export interface LongFrameLike {
  startTime: number;
  duration: number;
  renderStart: number;
  styleAndLayoutStart: number;
  scripts?: { duration: number; invoker?: string; invokerType?: string; sourceURL?: string }[];
}

interface Interaction {
  id: number;
  duration: number;
  entries: EventTimingLike[];
  target: string;
  route: string;
  beforeLoad: boolean;
}

/** เก็บไว้แค่ 10 การแตะที่ช้าที่สุด — พอสำหรับข้าม 1 ต่อ 50 ไปถึง 500 การแตะ */
const KEEP = 10;

const SIMPLE_NAME = /^[\w-]{1,32}$/;

/** ตัวระบุ element แบบสั้น: ไล่ขึ้นไม่เกิน 3 ชั้น หยุดที่ตัวที่มี id · เลือกคลาส `ui2-*` ก่อนคลาสยูทิลิตี
 *  ใช้เฉพาะชื่อแบบง่าย (id ของ React `useId` และคลาส Tailwind แบบมี `[ ]`/`:` ถูกข้าม) */
export function describeElement(el: Element | null | undefined): string {
  const parts: string[] = [];
  for (let node = el ?? null, depth = 0; node && depth < 3 && node.tagName !== "BODY"; node = node.parentElement, depth++) {
    let part = node.tagName.toLowerCase();
    const id = SIMPLE_NAME.test(node.id) ? node.id : "";
    if (id) {
      part += `#${id}`;
    } else {
      const classes = Array.from(node.classList).filter((c) => SIMPLE_NAME.test(c));
      const named = classes.filter((c) => c.startsWith("ui2-"));
      const picked = (named.length ? named : classes).slice(0, 2);
      if (picked.length) part += `.${picked.join(".")}`;
    }
    parts.unshift(part);
    if (id) break;
  }
  return clean(parts.join(">"), 120);
}

const ms = (n: number) => Math.max(0, Math.round(n));

type FrameScript = NonNullable<LongFrameLike["scripts"]>[number];

const topScriptOf = (f: LongFrameLike | undefined): FrameScript | undefined =>
  f?.scripts?.reduce<FrameScript | undefined>((a, b) => (!a || b.duration > a.duration ? b : a), undefined);

/** `ชนิด:ผู้เรียก@ไฟล์` เช่น `user-callback:IntersectionObserverCallback@BaseLayout.Ab12.js`
 *  ผู้เรียกของ callback เป็นชื่อกลาง ๆ (วัดจริง: แตะท้ายเว็บรอคิว 369 ms เพราะ IntersectionObserverCallback) — ต้องมีชื่อไฟล์ถึงจะรู้ว่าของใคร */
function scriptLabel(s: FrameScript | undefined): string {
  if (!s) return "";
  const file = (s.sourceURL ?? "").split(/[?#]/)[0].split("/").pop() ?? "";
  const invoker = (s.invoker ?? "").split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/, "");
  return clean(`${s.invokerType ?? ""}:${invoker}${file ? `@${file}` : ""}`, 80);
}

/** ตัวเก็บข้อมูล (ไม่แตะ DOM/เครือข่าย) — แยกออกมาให้ด่านทดสอบป้อน entry ปลอมได้ */
export function createInpTracker(context: {
  route: () => string;
  /** การแตะที่เริ่ม ณ เวลานี้เกิดก่อนหน้าโหลดเสร็จไหม — ดูจากเวลาของ entry (ตัวเก็บโหลดทีหลัง entry ในบัฟเฟอร์จึงมาถึงหลังโหลดเสร็จเสมอ) */
  beforeLoad: (startTime: number) => boolean;
  /** เบราว์เซอร์รองรับ Long Animation Frames หรือไม่ (แยก "ไม่รองรับ" ออกจาก "เฟรมไม่ยาวพอจะถูกบันทึก") */
  framesSupported: boolean;
  describe?: (el: Element | null | undefined) => string;
}) {
  const describe = context.describe ?? describeElement;
  let longest: Interaction[] = [];
  let frames: LongFrameLike[] = [];
  const seen = new Set<number>();

  return {
    addEvents(entries: readonly EventTimingLike[]): void {
      for (const e of entries) {
        const id = e.interactionId;
        if (!id) continue;
        seen.add(id);
        let item = longest.find((i) => i.id === id);
        if (item) {
          item.entries.push(e);
          item.duration = Math.max(item.duration, e.duration);
          if (!item.target && e.target) item.target = describe(e.target);
        } else if (longest.length < KEEP || e.duration > longest[longest.length - 1].duration) {
          item = { id, duration: e.duration, entries: [e], target: describe(e.target), route: context.route(), beforeLoad: context.beforeLoad(e.startTime) };
          longest.push(item);
        } else {
          continue;
        }
        longest.sort((a, b) => b.duration - a.duration);
        if (longest.length > KEEP) longest = longest.slice(0, KEEP);
      }
    },

    addFrames(entries: readonly LongFrameLike[]): void {
      frames = frames.concat(entries).slice(-30);
    },

    /** ข้อมูลของ INP ตอนนี้ — `null` ถ้ายังไม่มีการแตะหรือเร็วกว่าเกณฑ์ */
    report(interactionCount: number, extra: Pick<InpReport, "fx" | "deviceMemory" | "cpuCores">): InpReport | null {
      if (longest.length === 0) return null;
      const count = Math.max(interactionCount, seen.size);
      const worst = longest[Math.min(longest.length - 1, Math.floor(count / 50))];
      if (worst.duration < INP_REPORT_THRESHOLD_MS) return null;

      /* entry ที่ยาวสุดกำหนดเฟรมที่วาด — นับเฉพาะ entry ที่วาดในเฟรมเดียวกัน (±8 ms ตามความละเอียดของ duration)
         pointerdown ที่วาดไปก่อนหน้าแล้วไม่นับ ไม่งั้นเวลาที่นิ้วค้างบนจอจะถูกนับเป็น "โค้ดจัดการ" */
      const main = worst.entries.reduce((a, b) => (b.duration > a.duration ? b : a));
      const renderEnd = main.startTime + main.duration;
      const frame = worst.entries.filter((e) => Math.abs(e.startTime + e.duration - renderEnd) <= 8);
      const start = Math.min(...frame.map((e) => e.startTime));
      const pStart = Math.min(...frame.map((e) => e.processingStart));
      const pEnd = Math.max(...frame.map((e) => e.processingEnd));

      /* เฟรมยาวที่ครอบช่วงโค้ดจัดการ = เฟรมที่รันโค้ดแล้ววาดผลของการแตะนี้
         (เฟรมยาวก่อนหน้าที่ทำให้ "รอคิว" ไม่ใช่เฟรมนี้ — ห้ามเลือกด้วยการทับช่วงกว้าง ๆ) */
      const best = frames.find((f) => f.startTime <= pStart + 1 && f.startTime + f.duration >= pEnd - 1);
      const frameEnd = best ? best.startTime + best.duration : 0;
      /* เฟรมยาวที่กำลังรันอยู่ตอนนิ้วแตะ = ตัวการของ "รอคิว" (วัดในเครื่อง: แตะ FAQ/ท้ายเว็บหน้าแรกช้าเพราะช่วงนี้เกือบทั้งหมด) */
      const blocker = frames.find((f) => f.startTime <= start && f.startTime + f.duration > start);
      const blockerEnd = blocker ? blocker.startTime + blocker.duration : 0;

      return {
        route: worst.route,
        target: worst.target,
        event: main.name.slice(0, 24),
        fx: extra.fx,
        duration: ms(worst.duration),
        inputDelay: ms(pStart - start),
        processing: ms(pEnd - pStart),
        presentation: ms(renderEnd - pEnd),
        loaf: best ? "hit" : context.framesSupported ? "miss" : "none",
        styleLayout: best && best.styleAndLayoutStart > 0 ? ms(frameEnd - best.styleAndLayoutStart) : -1,
        renderMain: best && best.renderStart > 0 ? ms(frameEnd - Math.max(best.renderStart, pEnd)) : -1,
        loafScript: scriptLabel(topScriptOf(best)),
        interactions: Math.max(1, count),
        beforeLoad: worst.beforeLoad,
        deviceMemory: extra.deviceMemory,
        cpuCores: extra.cpuCores,
        blockScript: scriptLabel(topScriptOf(blocker)),
        blockRemaining: blocker ? ms(blockerEnd - start) : -1,
        blockStyleLayout: blocker && blocker.styleAndLayoutStart > 0 ? ms(blockerEnd - blocker.styleAndLayoutStart) : -1,
      };
    },

    reset(): void {
      longest = [];
      frames = [];
      seen.clear();
    },
  };
}

function sendReport(report: InpReport): void {
  const body = JSON.stringify(report);
  try {
    if (navigator.sendBeacon?.(INP_ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    // ส่งผ่าน beacon ไม่ได้ (บางเบราว์เซอร์ในแอป) — ลอง fetch แบบ keepalive แทน
  }
  void fetch(INP_ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => {},
  );
}

/**
 * เริ่มเก็บ INP ของหน้านี้ — เรียกครั้งเดียวต่อเอกสาร (ทั้งฝั่ง Astro และ Next) · คืนฟังก์ชันเลิกฟัง
 * ส่งตอนแท็บถูกซ่อนครั้งแรก · กลับมาจาก bfcache = เริ่มนับใหม่ (เป็นการเปิดหน้าอีกครั้งในสายตาผู้ใช้)
 */
export function installInpReporter(): () => void {
  if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") return () => {};
  if (!isMeasurableHostname(window.location.hostname)) return () => {};
  const supported = PerformanceObserver.supportedEntryTypes ?? [];
  if (!supported.includes("event")) return () => {};

  const framesSupported = supported.includes("long-animation-frame");
  const tracker = createInpTracker({
    route: () => window.location.pathname.slice(0, 120),
    beforeLoad: (t) => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      return !nav || nav.loadEventEnd === 0 || t < nav.loadEventEnd;
    },
    framesSupported,
  });
  let sent = false;

  const events = new PerformanceObserver((list) => tracker.addEvents(list.getEntries() as unknown as EventTimingLike[]));
  events.observe({ type: "event", buffered: true, durationThreshold: 40 } as PerformanceObserverInit);
  const frames = framesSupported
    ? new PerformanceObserver((list) => tracker.addFrames(list.getEntries() as unknown as LongFrameLike[]))
    : null;
  frames?.observe({ type: "long-animation-frame", buffered: true });

  const flush = () => {
    if (sent) return;
    /* entry ที่ยังค้างในคิวของ observer (ยังไม่ถึงรอบ callback) — ตอนปิดแท็บไม่มีรอบถัดไปแล้ว */
    if (frames) tracker.addFrames(frames.takeRecords() as unknown as LongFrameLike[]);
    tracker.addEvents(events.takeRecords() as unknown as EventTimingLike[]);
    const nav = navigator as Navigator & { deviceMemory?: number };
    const report = tracker.report((performance as Performance & { interactionCount?: number }).interactionCount ?? 0, {
      fx: document.documentElement.getAttribute("data-fx") ?? "",
      deviceMemory: nav.deviceMemory ?? 0,
      cpuCores: nav.hardwareConcurrency ?? 0,
    });
    if (!report) return;
    sent = true;
    sendReport(report);
  };
  const onHidden = () => {
    if (document.visibilityState === "hidden") flush();
  };
  const onShow = (e: PageTransitionEvent) => {
    if (!e.persisted) return;
    sent = false;
    tracker.reset();
  };

  document.addEventListener("visibilitychange", onHidden);
  window.addEventListener("pagehide", flush);
  window.addEventListener("pageshow", onShow);

  return () => {
    events.disconnect();
    frames?.disconnect();
    document.removeEventListener("visibilitychange", onHidden);
    window.removeEventListener("pagehide", flush);
    window.removeEventListener("pageshow", onShow);
  };
}
