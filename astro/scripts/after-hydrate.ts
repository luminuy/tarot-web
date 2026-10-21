/*
 * ⚠️ ห้ามแตะ DOM ใน island ก่อน React hydrate เสร็จ (B1 2026-10-20)
 * ส่วนต่าง ๆ ของหน้าแรกอยู่ใน island `TarotFlowRoot` — สคริปต์หน้า (ui2-home · home-track) รันก่อน React ทำงาน แล้วเปลี่ยนตัวหนังสือ
 * (นาฬิกา · ตัวเลขนับขึ้น · รายชื่อแม่หมอ · ตัวนับคำทำนาย) และ attribute ใน HTML ที่ React กำลังจะรับช่วง ➔ React 19 โยน #418
 * แล้วทิ้ง HTML ทั้งก้อนมาวาดใหม่ฝั่งเบราว์เซอร์ (หน้ากระพริบ · เสีย TBT · อนิเมชันเข้าฉากเล่นซ้ำ)
 * `TarotFlowRoot` ตั้ง `data-ui2-hydrated` + ส่ง `ui2:hydrated` จาก effect (effect รันหลัง hydrate commit เท่านั้น)
 * — Astro ถอด `ssr` ออกตั้งแต่สั่ง hydrateRoot ซึ่งเร็วกว่าตอน React ทำเสร็จจริง จึงใช้สัญญาณนั้นไม่ได้
 * island ไม่ hydrate เลย (สคริปต์โหลดไม่ขึ้น) ➔ เริ่มเองหลัง 10 วินาที (ไม่มี React ให้ชนแล้ว)
 */
export function afterHydrate(run: () => void): void {
  if (document.documentElement.hasAttribute("data-ui2-hydrated") || !document.querySelector("astro-island")) {
    run();
    return;
  }
  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    run();
  };
  addEventListener("ui2:hydrated", go, { once: true });
  setTimeout(go, 10_000);
}
