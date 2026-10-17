/**
 * 🪟 โชว์เคสกลาง — บอกว่ากำลังดูหมวดไหน (Ui2Showcase · src/styles/ui2-showcase.css)
 * ใส่ aria-current ให้ลิงก์ในรายชื่อซ้าย/แถบชิป + ตั้ง --p (เส้นความคืบหน้า) ที่ <ol> ของรายชื่อ
 * ⚠️ ใช้ IntersectionObserver เท่านั้น — ไม่ฟังการเลื่อนทุกเฟรม · เขียน style เฉพาะตอนหมวดเปลี่ยน (INC-0272)
 * ⚠️ เนื้อหาใน island ถูกเรนเดอร์ใหม่ได้ (เช่น ค้นหา) — สแกนใหม่เมื่อมีหน้าต่างถูกใส่/ถอด
 *
 * จอ < 1200: แถบชิปเป็นแท็บแบบส่วนโชว์เคสของหน้าแรก (เจ้าของ 2026-10-17 "สั่นเวลาเลื่อน" ➔ "แก้แบบหน้าแรกไปเลย")
 * แตะชิป = สลับไปหน้าต่างของหมวดนั้น เห็นทีละหน้าต่าง · แถบไม่ติดจอแล้ว (sticky ใต้หัวเว็บสั่นบน iOS · INC-0109)
 * ไม่มี JS = หน้าต่างทุกหมวดเรียงต่อกันตามเดิม ชิปเป็นลิงก์กระโดด (เนื้อหาทุกหมวดอยู่ใน HTML เสมอ)
 */
const seen = new WeakSet<Element>();

function setup(root: HTMLElement): void {
  if (seen.has(root)) return;
  seen.add(root);
  const rail = root.querySelector<HTMLElement>("[data-sx-rail]");
  const tabs = matchMedia("(max-width: 1199px)");
  let chosen = "";
  let current = "";
  const visible = new Map<string, number>();

  const mark = (id: string) => {
    if (!id || id === current) return;
    current = id;
    const wins = Array.from(root.querySelectorAll<HTMLElement>("[data-sx-win]:not([hidden])"));
    const i = wins.findIndex((w) => w.dataset.sxWin === id);
    root.querySelectorAll<HTMLElement>("[data-sx-link]").forEach((a) => {
      if (a.dataset.sxLink === id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    if (rail && wins.length > 1 && i >= 0) rail.style.setProperty("--p", (i / (wins.length - 1)).toFixed(3));
    // แถบชิปมือถือ: เลื่อนชิปที่เลือกให้อยู่ในแถบ (เลื่อนเฉพาะแถบ ไม่เลื่อนทั้งหน้า)
    const chip = root.querySelector<HTMLElement>(`.ui2-sx-chip[data-sx-link="${CSS.escape(id)}"]`);
    const row = chip?.parentElement;
    if (chip && row && row.scrollWidth > row.clientWidth) {
      row.scrollTo({ left: chip.offsetLeft - (row.clientWidth - chip.offsetWidth) / 2, behavior: "smooth" });
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.sxWin ?? "";
        if (e.isIntersecting) visible.set(id, e.intersectionRatio);
        else visible.delete(id);
      }
      // โหมดแท็บ: หมวดที่เลือกเป็นตัวบอก ไม่ใช่ตำแหน่งการเลื่อน
      if (tabs.matches) return;
      // หน้าต่างที่อยู่บนสุดในแถบกลางจอ = หมวดที่กำลังดู
      const wins = Array.from(root.querySelectorAll<HTMLElement>("[data-sx-win]:not([hidden])"));
      const top = wins.find((w) => visible.has(w.dataset.sxWin ?? ""));
      if (top) mark(top.dataset.sxWin ?? "");
    },
    { rootMargin: "-35% 0px -55% 0px" },
  );
  const observeAll = () => root.querySelectorAll<HTMLElement>("[data-sx-win]").forEach((w) => io.observe(w));
  observeAll();
  const first = root.querySelector<HTMLElement>("[data-sx-win]:not([hidden])");
  if (first) mark(first.dataset.sxWin ?? "");

  // ── แท็บ (จอ < 1200) — แสดงเฉพาะหน้าต่างที่มี data-sx-on (CSS ใน ui2-showcase.css) ──
  const pick = (want: string) => {
    const wins = Array.from(root.querySelectorAll<HTMLElement>("[data-sx-win]:not([hidden])"));
    const id = wins.some((w) => w.dataset.sxWin === want) ? want : (wins[0]?.dataset.sxWin ?? "");
    chosen = id;
    root.querySelectorAll<HTMLElement>("[data-sx-win]").forEach((w) => {
      const on = w.dataset.sxWin === id;
      if (on !== w.hasAttribute("data-sx-on")) w.toggleAttribute("data-sx-on", on);
    });
    current = "";
    mark(id);
  };
  // ลิงก์ลึก (#major · หรือจุดในหน้าต่าง) ➔ เปิดแท็บของหน้าต่างนั้นแล้วเลื่อนไปหา
  const openHash = (scroll: boolean) => {
    const hash = decodeURIComponent(location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    const win = target && root.contains(target) ? target.closest<HTMLElement>("[data-sx-win]") : null;
    if (!win) return false;
    pick(win.dataset.sxWin ?? "");
    if (scroll && tabs.matches) target!.scrollIntoView();
    return true;
  };
  if (!openHash(true)) pick(first?.dataset.sxWin ?? "");
  root.setAttribute("data-sx-tabs", "");
  addEventListener("hashchange", () => openHash(true));
  root.addEventListener("click", (e) => {
    if (!tabs.matches || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const chip = (e.target as Element).closest<HTMLAnchorElement>(".ui2-sx-chip");
    if (!chip) return;
    e.preventDefault();
    pick(chip.dataset.sxLink ?? "");
    history.replaceState(history.state, "", `#${chosen}`);
  });
  // กลับเป็นจอกว้าง ➔ รายชื่อซ้ายบอกตามการเลื่อนอีกครั้ง
  tabs.addEventListener("change", () => {
    current = "";
    if (tabs.matches) mark(chosen);
  });

  // ค้นหาแล้วซ่อน/ใส่หน้าต่าง ➔ ดูใหม่ (รวมรอบเดียวต่อเฟรม)
  let pending = 0;
  new MutationObserver(() => {
    if (pending) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      io.disconnect();
      visible.clear();
      current = "";
      observeAll();
      // ค้นหาแล้วหน้าต่างที่เลือกหาย ➔ ไปหน้าต่างแรกที่ยังเหลือ
      pick(chosen);
    });
  }).observe(root.querySelector(".ui2-sx-panels") ?? root, { childList: true, attributes: true, attributeFilter: ["hidden"], subtree: true });
}

function scan(): void {
  document.querySelectorAll<HTMLElement>("[data-sx]").forEach(setup);
}

if ("IntersectionObserver" in window) {
  scan();
  // island ที่ไฮเดรตทีหลังอาจแทนที่โชว์เคสทั้งก้อน — สแกนซ้ำหลังโหลดเสร็จครั้งเดียว (ไม่เฝ้า DOM ทั้งหน้า)
  addEventListener("load", scan, { once: true });
}
