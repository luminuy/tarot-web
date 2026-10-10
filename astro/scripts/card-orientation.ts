/**
 * 🃏 สวิตช์ "ไพ่หัวตั้ง / ไพ่หัวกลับ" ของหน้าไพ่รายใบ — สคริปต์ธรรมดาแทน island ทั้งก้อน
 * ===========================================================================
 *
 * หน้าไพ่รายใบมี 174 หน้า และเคย hydrate React ทั้ง 184 KB เพียงเพื่อ **ปุ่มสองปุ่มนี้**
 * (ตรวจโค้ดแล้ว `CardDetailView` มี `useState` ตัวเดียวคือหัวไพ่ กับ `useEffect` ที่ยิงสถิติ)
 *
 * ตอนนี้เนื้อหาทั้งสองหัวไพ่ถูกเรนเดอร์ลง HTML ครบ แล้วซ่อนฝั่งที่ไม่ได้เลือกด้วย CSS
 * ไฟล์นี้จึงทำแค่สองอย่าง: สลับแอตทริบิวต์ `data-orientation` และยิงสถิติตอนเปิดหน้า
 *
 * ⚠️ ห้ามนำเข้าอะไรที่ลาก React ตามมา — และห้ามนำเข้าคลังไพ่ (`DECK` / `cardById`)
 *    เด็ดขาด เพราะจะมัดสำรับทั้ง 78 ใบลงบันเดิลของทุกหน้า (เคยเกิดจริง: 980 KB)
 */

import { trackEvent } from "@/lib/analytics";

const root = document.querySelector<HTMLElement>("[data-card-detail]");

if (root) {
  const tabs = root.querySelectorAll<HTMLButtonElement>("[data-orientation-set]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const next = tab.dataset.orientationSet === "reversed" ? "reversed" : "upright";
      if (root.dataset.orientation === next) return;

      root.dataset.orientation = next;
      tabs.forEach((other) => {
        other.setAttribute("aria-pressed", String(other.dataset.orientationSet === next));
      });
    });
  });

  /* สถิติการเปิดหน้าไพ่ — เดิมอยู่ใน `useEffect` ของคอมโพเนนต์ ใช้สัญญาเดียวกันเป๊ะ
     (ชื่อ event และคีย์ทั้งสามถูกด่าน `test-analytics-integrity` ตรวจอยู่) */
  const cardId = root.dataset.cardId;
  if (cardId) {
    trackEvent("card_detail_view", {
      card_id: cardId,
      card_name: root.dataset.cardName ?? "",
      category: root.dataset.cardElement ?? "",
    });
  }

  /*
   * ✦ แถบ "เปิดไพ่เลย" ติดล่างจอ (`CardDetailView` · มือถือ)
   * โผล่เมื่อปุ่มเปิดไพ่หลักเลื่อนพ้นขอบบนจอไปแล้ว · ซ่อนเมื่อปุ่มหลักกลับเข้าจอ หรือฟุตเตอร์เข้าจอ
   * (ไม่บังลิงก์ท้ายเว็บ) · หน้านี้ไม่มีปุ่มโซเชียลลอย (`SocialFloatingButtons` ซ่อนเอง) แถบจึงไม่ชนกับอะไร
   */
  const bar = root.querySelector<HTMLElement>("[data-read-sticky]");
  const cta = root.querySelector<HTMLElement>("[data-read-cta]");
  const footer = document.querySelector("footer");
  if (bar && cta && "IntersectionObserver" in window) {
    /*
     * ⚠️ observer ยิงเฉพาะตอน "สถานะเข้า/ออกจอเปลี่ยน" — เลื่อนเร็ว ๆ หรือกระโดดข้ามปุ่ม (ลิงก์ #anchor · ปัดแรง)
     *    จากใต้จอไปเหนือจอ สถานะยัง "ไม่อยู่ในจอ" เหมือนเดิม จึงไม่ยิงเลย (ลองแล้ว — แถบไม่โผล่)
     * ➔ ใช้สองตัว: `inView` = ปุ่มอยู่ในจอ · `reached` = ปุ่มอยู่ในจอ "หรือเหนือจอ" (ขยายขอบบนออกไปไกลมาก)
     *    เลื่อนเลยแล้ว = reached && !inView · ทุกการกระโดดข้ามจะเปลี่ยน `reached` อย่างน้อยหนึ่งตัวเสมอ
     */
    let inView = false;
    let reached = false;
    let footerInView = false;
    const sync = () => {
      const show = reached && !inView && !footerInView;
      if ((bar.dataset.visible === "true") === show) return;
      bar.dataset.visible = String(show);
      bar.inert = !show;
    };
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      sync();
    }).observe(cta);
    new IntersectionObserver(
      ([entry]) => {
        reached = entry.isIntersecting;
        sync();
      },
      { rootMargin: "1000000px 0px 0px 0px" },
    ).observe(cta);
    if (footer) {
      new IntersectionObserver(([entry]) => {
        footerInView = entry.isIntersecting;
        sync();
      }).observe(footer);
    }
  }
}
