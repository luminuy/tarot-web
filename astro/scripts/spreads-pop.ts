/**
 * 🃏 คลังผัง `/spreads` — ไพ่เด้ง (สคริปต์ธรรมดา ไม่ลาก React · งบ ≤ 3 KB gzip)
 * แผน: docs/plans/UI_2_0_SPREADS_PLAN_2026-10-13.md หัวข้อ 5
 *
 * 1. หยุดของวนเมื่อส่วนพ้นจอ — สลับ `data-inview` ของ `[data-anim-section]` (กติกาเดียวกับหน้าแรก)
 * 2. แตะไพ่ผัง ➔ เปิด `<dialog>` ตัวเดียวด้วย showModal() · ไพ่ใหญ่คัดลอกจากไพ่ใบที่แตะ (cloneNode)
 *    กดพร้อม Ctrl / ⌘ / Shift / Alt หรือคลิกกลาง = ปล่อยให้ลิงก์ทำงานตามปกติ (เปิดหน้าคู่มือ)
 * 3. ลิงก์ลึก `/spreads#spread-<id>` เปิดหน้าต่างของผังนั้นเอง · เปิด/ปิดใช้ history.replaceState (ไม่เพิ่มประวัติ)
 *
 * ⚠️ ไม่มี JS หรือสคริปต์ล้ม = ไพ่เป็นลิงก์ไปหน้าคู่มือผังตามปกติ (ไม่มีอะไรหาย)
 */

/* ── 1. ของวนหยุดนอกจอ ─────────────────────────────────────────────────── */
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.target.toggleAttribute("data-inview", e.isIntersecting);
    },
    { rootMargin: "120px 0px" },
  );
  document.querySelectorAll("[data-anim-section]").forEach((el) => io.observe(el));
}

/* ── 1b. แถบหมวดติดบนจอ — หมวดที่กำลังดูเรืองขึ้น (aria-current) · มือถือเลื่อนชิปให้อยู่ในจอ ── */
const stick = document.querySelector<HTMLElement>("[data-sp-stick]");
if (stick && "IntersectionObserver" in window) {
  const row = stick.firstElementChild as HTMLElement;
  const links = Array.from(stick.querySelectorAll<HTMLAnchorElement>("a[href^='#shelf-']"));
  const mark = (id: string | null) => {
    for (const a of links) {
      const on = a.getAttribute("href") === `#${id}`;
      if (on === (a.getAttribute("aria-current") === "true")) continue;
      if (on) {
        a.setAttribute("aria-current", "true");
        row.scrollTo({ left: a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
      } else a.removeAttribute("aria-current");
    }
  };
  const seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) mark(e.target.id);
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  document.querySelectorAll(".ui2-sp-shelf").forEach((el) => seen.observe(el));
  // พื้นทึบหลังแถบ = เฉพาะตอนแถบติดจอจริง (ตำแหน่งเท่ากับค่า top ของ sticky)
  // ⚠️ เดิมผูกกับ "มีหมวดเรือง" — หมวดแรกถึงกลางจอก่อนแถบติด พื้นทึบเลยบังหัวหน้าเหนือแถบ (เจ้าของแคป 2026-10-13)
  let raf = 0;
  const syncStuck = () => {
    raf = 0;
    const top = parseFloat(getComputedStyle(stick).top) || 0;
    const on = Math.abs(stick.getBoundingClientRect().top - top) < 1;
    if (on !== stick.hasAttribute("data-stuck")) stick.toggleAttribute("data-stuck", on);
  };
  addEventListener("scroll", () => (raf ||= requestAnimationFrame(syncStuck)), { passive: true });
  addEventListener("resize", () => (raf ||= requestAnimationFrame(syncStuck)), { passive: true });
  syncStuck();
  // เหนือหมวดแรก (หัวหน้า) = ไม่มีหมวดไหนเรือง
  const hero = document.querySelector(".ui2-sp-hero");
  if (hero)
    new IntersectionObserver((es) => es[0].isIntersecting && mark(null), { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
}

/* ── 2. ไพ่เด้ง ────────────────────────────────────────────────────────── */
const dialog = document.querySelector<HTMLDialogElement>("[data-spread-pop]");
const CARD = "a.ui2-spread-card[data-spread-id]";

if (dialog && typeof dialog.showModal === "function") {
  const pop = dialog;
  const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = pop) => root.querySelector(sel) as T;
  const big = $("[data-pop-card]");
  const list = $("[data-pop-list]");
  let from: HTMLElement | null = null;

  const open = (card: HTMLAnchorElement) => {
    const slot = card.parentElement as HTMLElement;
    const data = $("[data-pop]", slot);
    const shelf = card.closest("section") as HTMLElement;
    for (const v of ["--cat", "--cat-ink"]) pop.style.setProperty(v, shelf.style.getPropertyValue(v));

    big.replaceChildren(...Array.from(card.children, (n) => n.cloneNode(true)));
    big.querySelector("h3")?.replaceWith(Object.assign(document.createElement("p"), {
      className: "ui2-sc-band",
      textContent: card.querySelector("h3")?.textContent ?? "",
    }));
    $("[data-pop-cat]").textContent = data.dataset.cat ?? "";
    $("[data-pop-count]").textContent = $(".ui2-sc-count", card).textContent;
    $("[data-pop-premium]").hidden = !card.querySelector(".ui2-sc-lock");
    $("[data-pop-title]").textContent = data.dataset.name ?? "";
    $("[data-pop-tagline]").textContent = $("p", data).textContent;
    list.replaceChildren(...Array.from(data.querySelectorAll("li"), (li) => li.cloneNode(true)));
    list.classList.toggle("is-long", list.children.length > 6);
    // คัดลอกค่า href ดิบ (ไม่ใช่ `.href` ซึ่งเป็น URL เต็ม) — ลิงก์ในหน้าต่างหน้าตาเหมือนลิงก์อื่นในหน้า
    $("[data-pop-start]").setAttribute("href", $("[data-start]", data).getAttribute("href") ?? "");
    $("[data-pop-guide]").setAttribute("href", card.getAttribute("href") ?? "");

    from = card;
    if (!pop.open) pop.showModal();
    pop.scrollTop = 0;
    history.replaceState(history.state, "", `#${card.id}`);
  };

  document.addEventListener("click", (e) => {
    const card = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(CARD);
    if (!card || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open(card);
  });

  // ปิด: กากบาท · ปุ่มกลับ (มือถือ) · แตะพื้นหลัง (คลิกโดนตัว <dialog> เอง = นอกเนื้อหา) · Esc (เบราว์เซอร์ทำให้)
  // เก็บกวาดทันทีที่สั่งปิด (ไม่รออีเวนต์ close ซึ่งมาช้ากว่า) · เรียกซ้ำได้ไม่มีผล
  const done = () => {
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    from?.focus({ preventScroll: true });
  };
  pop.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t === pop || t.closest("[data-pop-close]")) {
      pop.close();
      done();
    }
  });
  pop.addEventListener("cancel", () => setTimeout(done));
  pop.addEventListener("close", () => {
    if (!pop.open) done();
  });

  // ชี้แถวตำแหน่ง ➔ ไพ่ใบนั้นในผ้าปูเรืองทอง
  const hot = (i: number) => {
    list.querySelectorAll("li").forEach((li, k) => li.toggleAttribute("data-hot", k === i));
    big.querySelectorAll(".ui2-sc-spot").forEach((s, k) => s.toggleAttribute("data-hot", k === i));
  };
  list.addEventListener("pointerover", (e) => {
    const li = (e.target as Element).closest("li");
    if (li) hot(Array.prototype.indexOf.call(list.children, li));
  });
  list.addEventListener("pointerleave", () => hot(-1));

  /* ── 3. ลิงก์ลึก ─────────────────────────────────────────────────────── */
  const deep = location.hash.startsWith("#spread-") && document.getElementById(location.hash.slice(1));
  if (deep instanceof HTMLAnchorElement && deep.matches(CARD)) open(deep);
}
