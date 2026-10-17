/**
 * 👁️ หยุดของวนเมื่อส่วนพ้นจอ — สลับ `data-inview` ของ `[data-anim-section]` (กติกาเดียวกับหน้าแรก UI 2.0)
 * ใช้กับหน้าคืนท้องฟ้าที่ไม่มีสคริปต์หน้าแรก (คลัง /spreads · ไพ่รายวัน /daily)
 * ไม่มี JS = ไม่มี data-inview ➔ ของวนนิ่งทั้งหมด (หน้าตา lite แบบนิ่ง ยังเห็นครบ)
 */
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.toggleAttribute("data-inview", e.isIntersecting);
    },
    { rootMargin: "120px 0px" },
  );
  document.querySelectorAll("[data-anim-section]").forEach((el) => io.observe(el));
}
