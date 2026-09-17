/**
 * 🗂️ แท็บหมวดของคลังผัง — สคริปต์เล็ก ๆ แทน island ทั้งก้อน (R-02)
 * ===========================================================================
 *
 * การ์ดทั้ง 25 ใบถูกเรนเดอร์ไว้ใน HTML ตั้งแต่ตอนบิลด์แล้ว พร้อม `data-cats`
 * งานทั้งหมดของไฟล์นี้จึงเหลือแค่ "ซ่อน/แสดงการ์ด + ย้ายสถานะแท็บ"
 *
 * ทำไมถึงคุ้มกว่าการ hydrate `SpreadsLibrary`:
 * โหลดคลังทั้งก้อนเข้า React = React runtime + ข้อมูลผัง 25 แบบ (17.2 KB gzip)
 * วัดจริง 2026-09-17: JS ของหน้า `/spreads` **124.4 ➔ 99.4 KB gzip**
 *
 * ⚠️ ถ้าไม่มี JS เลย (หรือสคริปต์นี้ล้ม) หน้ายังใช้งานได้ — เห็นแท็บ "ยอดนิยมแนะนำ"
 * ที่เรนเดอร์มาจากเซิร์ฟเวอร์ · ลิงก์ผังทั้ง 25 ยังอยู่ครบในสารบัญท้ายหน้า
 */

const tablist = document.querySelector<HTMLElement>("[data-spreads-tablist]");
const panel = document.querySelector<HTMLElement>("[data-spreads-panel]");

if (tablist && panel) {
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>("[data-spread-tab]"));
  const cards = Array.from(panel.querySelectorAll<HTMLElement>("[data-spread-card]"));

  /** คลาสของแท็บที่ "ไม่ได้เลือก" — ตรงกับที่ `SpreadsLibrary.tsx` เรนเดอร์ออกมา */
  const IDLE_TAB = ["bg-inset", "text-ink", "hover:text-gold", "border", "border-line", "hover:border-gold"];

  function select(id: string, moveFocus: boolean): void {
    for (const tab of tabs) {
      const isActive = tab.dataset.spreadTab === id;
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      tab.classList.toggle("text-canvas", isActive);
      for (const cls of IDLE_TAB) tab.classList.toggle(cls, !isActive);
      // ไอคอนกับตัวเลขนับใช้สีตามสถานะแท็บ
      tab.querySelector("svg")?.classList.toggle("text-gold", isActive);
      tab.querySelector("svg")?.classList.toggle("text-muted", !isActive);
      const badge = tab.querySelector<HTMLElement>("span:last-child");
      badge?.classList.toggle("bg-white/20", isActive);
      badge?.classList.toggle("text-canvas", isActive);
      badge?.classList.toggle("bg-black/5", !isActive);
      badge?.classList.toggle("text-muted", !isActive);
      if (isActive && moveFocus) tab.focus();
    }

    for (const card of cards) {
      card.hidden = !(card.dataset.cats ?? "").split(" ").includes(id);
    }

    panel!.setAttribute("aria-labelledby", `library-tab-${id}`);

    /* เล่นคีย์เฟรมขาเข้าใหม่ทุกครั้งที่สลับแท็บ — ของเดิมได้ผลนี้จากการที่ React remount */
    panel!.classList.remove("anim-swap-rise-sm");
    void panel!.offsetWidth; // บังคับให้เบราว์เซอร์คำนวณใหม่ ไม่งั้นคลาสที่ถอดแล้วใส่กลับในเฟรมเดียวกันไม่มีผล
    panel!.classList.add("anim-swap-rise-sm");
  }

  tablist.addEventListener("click", (event) => {
    const tab = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-spread-tab]");
    if (tab?.dataset.spreadTab) select(tab.dataset.spreadTab, false);
  });

  tablist.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const current = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    const next = event.key === "ArrowRight" ? (current + 1) % tabs.length : (current - 1 + tabs.length) % tabs.length;
    event.preventDefault();
    select(tabs[next].dataset.spreadTab!, true);
  });
}
