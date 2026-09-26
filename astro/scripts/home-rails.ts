/**
 * ⬅️➡️ ผูกปุ่มลูกศรของสไลด์การ์ดหน้าแรก (`HomeRailNav` + `.home-rail`) — สคริปต์ธรรมดา ไม่ลาก React
 * ===========================================================================
 * ส่วนเนื้อหาท้ายหน้าแรกเรนเดอร์เป็น HTML นิ่ง (ไม่ hydrate) ปุ่มจึงต้องมีคนผูกให้
 *   • แตะลูกศร ➔ เลื่อนทีละ 1 ใบ (ความกว้างการ์ด + ช่องว่าง) · ผู้ใช้ปิดแอนิเมชัน = กระโดดทันที
 *   • ถึงหัว/ท้ายแถว ➔ ปุ่มฝั่งนั้นจาง (disabled) แบบ apple.com
 *   • ฟังการเลื่อนแบบ passive + รวบเป็นเฟรมเดียวด้วย rAF — ปัดนิ้วไม่กระตุก
 *   • จอใหญ่ก็เป็นแถวปัด (2026-09-26) — แถวที่การ์ดพอดีไม่ต้องเลื่อน ปุ่มทั้งคู่ถูกปิด แล้ว CSS ซ่อนแถวปุ่ม
 *     ตรวจตอนโหลด · ตอนเปลี่ยนขนาดจอ · และตอนเมาส์/นิ้วแตะแถว (กรณี DOM ชุดใหม่จาก `TarotFlow`)
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

/* ตรวจทุกแถวตอนโหลด/เปลี่ยนขนาดจอ — แถวที่ไม่ล้นจะได้ซ่อนลูกศร (สองปุ่ม disabled) */
function syncAll(): void {
  document.querySelectorAll<HTMLElement>(TRACK).forEach(syncButtons);
}
syncAll();
let resizeRaf = 0;
window.addEventListener(
  "resize",
  () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(syncAll);
  },
  { passive: true }
);
/* `TarotFlow` ถอด/ใส่เนื้อหาชุดนี้ใหม่ได้ — ชุดใหม่ยังไม่ถูกตรวจ ตรวจตอนผู้ใช้ชี้/แตะแถวครั้งแรก */
const seen = new WeakSet<HTMLElement>();
document.addEventListener(
  "pointerover",
  (event) => {
    const track = (event.target as Element | null)?.closest<HTMLElement>("[data-rail]")?.querySelector<HTMLElement>(TRACK);
    if (!track || seen.has(track)) return;
    seen.add(track);
    syncButtons(track);
  },
  { passive: true }
);
