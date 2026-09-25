/**
 * 🪗 คอลัมน์ลิงก์ท้ายเว็บแบบแตะเปิด-ปิดบนมือถือ — สคริปต์ธรรมดา ไม่พึ่ง React
 * ===========================================================================
 * ท้ายเว็บบนมือถือสูง ~1,560px (เกือบ 2.5 จอ) เพราะลิงก์ 3 คอลัมน์เรียงยาวลงมา (เจ้าของขอให้กระชับ)
 *
 * ทำงานคู่กับ `SiteFooter` + กฎ `.footer-collapsible` ใน globals.css:
 *   • ติดคลาส `footer-collapsible` บน <html> ➔ CSS จึงเริ่มพับคอลัมน์ที่มี `data-footer-col` (มือถือเท่านั้น)
 *     ไม่มีสคริปต์ = ลิงก์กางครบเหมือนเดิม (ไม่มีวันซ่อนลิงก์โดยไม่มีปุ่มเปิด)
 *   • แตะปุ่ม `[data-footer-toggle]` ➔ สลับ `data-open` ที่คอลัมน์ + `aria-expanded` ที่ปุ่ม
 *
 * ⚠️ ลิงก์ทั้งหมดยังอยู่ใน HTML เสมอ (ซ่อนด้วย CSS) บอตเห็นครบ SEO ไม่เสีย
 * ⚠️ ดักคลิกที่ document (event delegation) — หน้า Astro เรนเดอร์ท้ายเว็บเป็น HTML นิ่ง ส่วนหน้าแรกเรนเดอร์ใน island
 *    ผูกทีละปุ่มจะหลุดเมื่อ React วาดท้ายเว็บชุดใหม่
 * ⚠️ เรียกซ้ำได้ (ทั้ง `astro/scripts/site-chrome.ts` และ `SiteFooter` บนหน้า Next) — มีธงกันผูกซ้ำ
 */
const FLAG = "__seertarotFooterAccordion";

export function installFooterAccordion(): void {
  if (typeof document === "undefined") return;
  const w = window as unknown as Record<string, boolean>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  document.documentElement.classList.add("footer-collapsible");
  document.addEventListener("click", (event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>("[data-footer-toggle]");
    const col = button?.closest<HTMLElement>("[data-footer-col]");
    if (!button || !col) return;
    const open = !col.hasAttribute("data-open");
    col.toggleAttribute("data-open", open);
    button.setAttribute("aria-expanded", String(open));
  });
}
