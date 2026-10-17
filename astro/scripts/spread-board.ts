/**
 * 📐 กระดานพิมพ์เขียวของหน้าคู่มือผัง (/spreads/[id]) — แตะ/ชี้ไพ่ ➔ ป้ายใต้กระดานบอกตำแหน่ง + แถวในตารางสว่างตาม
 * หน้านี้ไม่ hydrate React (รอบ 97) จึงทำด้วยสคริปต์เล็ก ๆ ตัวนี้ · ข้อความป้ายอ่านจากแถวตารางที่ SSR ไว้แล้ว (ไม่มีข้อมูลซ้ำ)
 */
const board = document.querySelector<HTMLElement>(".v2-sd-board");
if (board) {
  const slots = Array.from(board.querySelectorAll<HTMLButtonElement>(".v2-sd-slot"));
  const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>(".v2-sd-ledger tbody tr"));
  const capN = board.querySelector(".v2-sd-cap-n");
  const capName = board.querySelector(".v2-sd-cap b");
  const capText = board.querySelector(".v2-sd-cap small");
  let current = 0;
  const select = (i: number) => {
    if (i === current) return;
    current = i;
    slots.forEach((slot, j) => slot.setAttribute("aria-pressed", String(i === j)));
    rows.forEach((row, j) => row.classList.toggle("is-active", i === j));
    const row = rows[i];
    if (capN) capN.textContent = String(i + 1);
    if (capName) capName.textContent = row?.querySelector("th")?.textContent ?? "";
    if (capText) capText.textContent = row?.lastElementChild?.textContent ?? "";
  };
  slots.forEach((slot, i) => {
    slot.addEventListener("click", () => select(i));
    slot.addEventListener("mouseenter", () => select(i));
  });
  rows.forEach((row, i) => row.addEventListener("mouseenter", () => select(i)));
}
