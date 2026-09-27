/**
 * ⬅️➡️ ผูกปุ่มลูกศรของสไลด์การ์ดหน้าแรก (`HomeRailNav` + `.home-rail`) — สคริปต์ธรรมดา ไม่ลาก React
 * ===========================================================================
 * ส่วนเนื้อหาท้ายหน้าแรกเรนเดอร์เป็น HTML นิ่ง (ไม่ hydrate) ปุ่มจึงต้องมีคนผูกให้
 *   • แตะลูกศร ➔ เลื่อนทีละ 1 ใบ (ความกว้างการ์ด + ช่องว่าง) · ผู้ใช้ปิดแอนิเมชัน = กระโดดทันที
 *   • ถึงหัว/ท้ายแถว ➔ ปุ่มฝั่งนั้นจาง (disabled) แบบ apple.com
 *   • ฟังการเลื่อนแบบ passive + รวบเป็นเฟรมเดียวด้วย rAF — ปัดนิ้วไม่กระตุก
 *   • จอใหญ่ก็เป็นแถวปัด (2026-09-26) — แถวที่การ์ดพอดีไม่ต้องเลื่อน ปุ่มทั้งคู่ถูกปิด แล้ว CSS ซ่อนแถวปุ่ม
 *     ตรวจด้วย ResizeObserver (หลังเบราว์เซอร์จัดหน้าเสร็จ · ไม่บังคับ reflow) · แถวชุดใหม่จาก `TarotFlow` เริ่มเฝ้าตอนเมาส์/นิ้วแตะแถว
 *
 * ⚠️ ดักที่ระดับ document (event delegation) ไม่ผูกกับปุ่มทีละตัว — เนื้อหานี้เป็น slot ของ `TarotFlow`
 *    ซึ่งถอดออกตอนผู้ใช้เข้าขั้นดูดวง แล้วใส่ DOM ชุดใหม่กลับมาตอนกลับหน้าเลือกผัง
 *    ถ้าผูกทีละปุ่ม ชุดใหม่จะไม่มีตัวจัดการ ลูกศรกดไม่ติด
 */

const TRACK = "[data-rail-track]";

function railOf(
  el: Element | null
): { track: HTMLElement; prev: HTMLButtonElement | null; next: HTMLButtonElement | null } | null {
  const root = el?.closest<HTMLElement>("[data-rail]");
  const track = root?.querySelector<HTMLElement>(TRACK);
  if (!root || !track) return null;
  return {
    track,
    prev: root.querySelector<HTMLButtonElement>("[data-rail-prev]"),
    next: root.querySelector<HTMLButtonElement>("[data-rail-next]"),
  };
}

function step(track: HTMLElement): number {
  const first = track.firstElementChild as HTMLElement | null;
  const gap = parseFloat(getComputedStyle(track).columnGap) || 12;
  return first ? first.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
}

function syncButtons(track: HTMLElement): void {
  const rail = railOf(track);
  if (!rail) return;
  const max = track.scrollWidth - track.clientWidth;
  if (rail.prev) rail.prev.disabled = track.scrollLeft <= 4;
  if (rail.next) rail.next.disabled = track.scrollLeft >= max - 4;
}

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("click", (event) => {
  const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-rail-prev], [data-rail-next]");
  if (!button || button.disabled) return;
  const rail = railOf(button);
  if (!rail) return;
  const dir = button.hasAttribute("data-rail-prev") ? -1 : 1;
  rail.track.scrollBy({ left: dir * step(rail.track), behavior: reduced ? "auto" : "smooth" });
});

/* scroll ไม่ bubble — ดักแบบ capture ที่ document แทน แล้วรวบเป็นเฟรมเดียวต่อแถว */
const pending = new Set<HTMLElement>();
let raf = 0;
document.addEventListener(
  "scroll",
  (event) => {
    const target = event.target as Element | null;
    if (!(target instanceof HTMLElement) || !target.matches(TRACK)) return;
    pending.add(target);
    if (!raf) {
      raf = requestAnimationFrame(() => {
        raf = 0;
        pending.forEach(syncButtons);
        pending.clear();
      });
    }
  },
  { capture: true, passive: true }
);

/*
 * ตรวจทุกแถวตอนโหลด/เปลี่ยนขนาดจอ — แถวที่ไม่ล้นจะได้ซ่อนลูกศร (สองปุ่ม disabled)
 *
 * ⚠️ ห้ามอ่าน `scrollWidth` ตรง ๆ ตอนสคริปต์เริ่ม (INC-0247) — ตอนนั้นเบราว์เซอร์ยังไม่เคยจัดหน้าเลย
 *    การอ่านขนาดบังคับให้จัดทั้งหน้า (~2,000 ชิ้น) กลางสคริปต์ = Lighthouse "Forced reflow" 198ms
 *    ใช้ `ResizeObserver` แทน: เรียกกลับหลังเบราว์เซอร์จัดหน้าเสร็จเอง (ตอนเริ่ม observe หนึ่งครั้ง
 *    และทุกครั้งที่แถวเปลี่ยนขนาด ซึ่งครอบคลุมการหมุนจอ/ย่อหน้าต่างด้วย) อ่านขนาดตรงนั้นจึงไม่บังคับจัดซ้ำ
 */
const resizeObserver =
  "ResizeObserver" in window
    ? new ResizeObserver((entries) => {
        for (const entry of entries) {
          const track = entry.target as HTMLElement;
          // DOM ชุดเก่าที่ `TarotFlow` ถอดทิ้งแล้ว — เลิกเฝ้า ไม่ค้างไว้ในหน่วยความจำ
          if (!track.isConnected) resizeObserver?.unobserve(track);
          else syncButtons(track);
        }
      })
    : null;
const observed = new WeakSet<HTMLElement>();
function observeRail(track: HTMLElement): void {
  if (observed.has(track)) return;
  observed.add(track);
  if (resizeObserver) resizeObserver.observe(track);
  else requestAnimationFrame(() => syncButtons(track));
}
document.querySelectorAll<HTMLElement>(TRACK).forEach(observeRail);
/* `TarotFlow` ถอด/ใส่เนื้อหาชุดนี้ใหม่ได้ — ชุดใหม่ยังไม่ถูกเฝ้า เริ่มเฝ้าตอนผู้ใช้ชี้/แตะแถวครั้งแรก */
document.addEventListener(
  "pointerover",
  (event) => {
    const track = (event.target as Element | null)?.closest<HTMLElement>("[data-rail]")?.querySelector<HTMLElement>(TRACK);
    if (track) observeRail(track);
  },
  { passive: true }
);
