"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * 📌 ปุ่ม "เริ่มเปิดไพ่" ลอยล่างจอบนมือถือ (แผนหน้าแรก ข้อ 5)
 * ===========================================================================
 * พอเลื่อนเลยแถบ "เลือกผัง" ลงไปอ่านเนื้อหาท้ายหน้า (ยาวราว 8 จอบนมือถือ) จะไม่มีปุ่มเริ่มให้กดอีกเลย
 * ปุ่มนี้โผล่เฉพาะช่วงนั้น แตะแล้วเลื่อนกลับขึ้นไปที่ "เปิดไพ่ด่วน" — ไม่เริ่มพิธีเอง จึงไม่กินสิทธิ์โดยไม่ตั้งใจ
 *
 * ซ่อนเมื่อ: ยังไม่เลื่อนเลยแถบเลือกผัง · ท้ายเว็บ (footer) โผล่ในจอ · แถบคุกกี้ยังเปิด = ยกปุ่มขึ้นเหนือแถบ
 * ⚠️ วาดผ่าน portal ไป body (INC-0243 — `.home-band` เป็น stacking context แยก)
 * ⚠️ HTML แรกไม่มีปุ่มนี้ (portal เกิดหลัง mount) และเป็น position: fixed จึงไม่ดันหน้า (CLS 0)
 */
export function HomeStickyCta({
  isEnglish,
  afterId,
  targetId,
}: {
  isEnglish: boolean;
  /** โผล่เมื่อ element นี้เลื่อนพ้นขอบบนจอไปแล้ว */
  afterId: string;
  /** แตะแล้วเลื่อนไปที่ element นี้ */
  targetId: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(false);
  // ความสูงแถบขอความยินยอมคุกกี้ (ถ้ายังเปิดอยู่) — ยกปุ่มขึ้นไปวางเหนือแถบแทนการซ่อนปุ่มทิ้ง
  // (คนส่วนใหญ่ไม่กดตอบแถบนั้นเลย ถ้าซ่อนตาม ปุ่มนี้จะแทบไม่เคยโผล่)
  const [dockHeight, setDockHeight] = useState(0);

  useEffect(() => {
    setMounted(true);
    let raf = 0;
    const update = () => {
      raf = 0;
      const after = document.getElementById(afterId);
      const footer = document.querySelector("footer");
      const pastSpreads = !!after && after.getBoundingClientRect().bottom < 0;
      const footerVisible = !!footer && footer.getBoundingClientRect().top < window.innerHeight;
      const dock = document.querySelector(".consent-dock");
      setDockHeight(dock ? Math.round(dock.getBoundingClientRect().height) : 0);
      setShown(pastSpreads && !footerVisible);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [afterId]);

  if (!mounted) return null;

  const goToTarget = () => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  return createPortal(
    // `inert` ตอนซ่อน — กด Tab แล้วต้องไม่ไปโฟกัสปุ่มที่มองไม่เห็น และโปรแกรมอ่านหน้าจอไม่อ่านเจอ
    <div
      className="home-sticky-cta"
      // ⚠️ `data-floating` ห้ามถอด — กฎ `body > *:not([data-floating])` ใน globals.css บังคับลูกตรงของ body
      //    ให้เป็น position: relative ปุ่มจะหลุดจาก fixed ไปต่อท้ายหน้า (เจอจริงตอนทดสอบ)
      data-floating="true"
      data-shown={shown ? "true" : "false"}
      data-home-section="sticky_cta"
      data-home-no-view
      inert={!shown}
      style={dockHeight ? { bottom: `calc(${dockHeight}px + 0.75rem)` } : undefined}
    >
      <button
        type="button"
        data-home-target="sticky:quick"
        onClick={goToTarget}
        className="btn-gold-glass tap-overlay flex h-12 w-full items-center justify-center font-serif-th text-sm font-bold"
      >
        {isEnglish ? "Draw your cards now" : "เริ่มเปิดไพ่เลย"}
      </button>
    </div>,
    document.body,
  );
}
