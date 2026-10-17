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

/* ── 1. ของวนหยุดนอกจอ (สคริปต์กลาง) ─────────────────────────────────── */
import "./ui2-inview";

/* ── 1a. ไพ่ตกแต่งหัวหน้าโผล่เมื่อภาพโหลดเสร็จ (ไม่เห็นกรอบขาวเปล่าแวบ · INC-0271) ── */
for (const card of document.querySelectorAll<HTMLElement>(".ui2-sp-deco-card")) {
  const img = card.querySelector("img");
  const ready = () => card.classList.add("is-ready");
  if (!img || (img.complete && img.naturalWidth > 0)) ready();
  else img.addEventListener("load", ready, { once: true });
}

/* ── 1b. แถบหมวด — มือถือเป็นแท็บสลับหมวด · จอกว้างรายชื่อซ้ายเรืองตามหมวดที่กำลังดู (aria-current) ── */
const stick = document.querySelector<HTMLElement>("[data-sp-stick]");
const show = document.querySelector<HTMLElement>("[data-sp-show]");
const scrolly = () => show?.classList.contains("is-scrolly") === true;
if (stick && "IntersectionObserver" in window) {
  const row = stick.firstElementChild as HTMLElement;
  // จอที่แถบชิปแสดง (< 768) = โหมดแท็บ (ดูด้านล่าง)
  const tabs = matchMedia("(max-width: 767px)");
  // แถบชิป (จอ < 1200) + รายชื่อหมวดซ้ายของโชว์เคส (จอ ≥ 1200) เรืองตามหมวดที่กำลังดู
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-sp-stick] a[href^='#shelf-'], .ui2-sp-rail a"));
  const mark = (id: string | null) => {
    // โหมดเลื่อนแล้วสลับหมวด: หน้าต่างซ้อนกันที่เดียว ➔ ข้อ 1c เป็นคนตั้งเอง
    if (scrolly()) return;
    for (const a of links) {
      const on = a.getAttribute("href") === `#${id}`;
      if (on === (a.getAttribute("aria-current") === "true")) continue;
      if (on) {
        a.setAttribute("aria-current", "true");
        if (stick.contains(a)) row.scrollTo({ left: a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
      } else a.removeAttribute("aria-current");
    }
  };
  const seen = new IntersectionObserver(
    (entries) => {
      if (tabs.matches) return;
      for (const e of entries) if (e.isIntersecting) mark(e.target.id);
    },
    { rootMargin: "-45% 0px -50% 0px" },
  );
  document.querySelectorAll(".ui2-sp-shelf").forEach((el) => seen.observe(el));
  // ── จอ < 768 (ที่แถบชิปแสดง): แท็บแบบส่วนโชว์เคสของหน้าแรก ──
  // เจ้าของ 2026-10-17 "สั่นเวลาเลื่อน" ➔ "แก้แบบหน้าแรกไปเลย" · sticky ใต้หัวเว็บสั่นบน iOS (INC-0109)
  // แตะชิป = สลับไปหมวดนั้น เห็นทีละหมวด · แถบไม่ติดจอ · ไม่มี JS = ทุกหมวดเรียงต่อกัน ชิปเป็นลิงก์กระโดด
  const shelves = Array.from(document.querySelectorAll<HTMLElement>(".ui2-sp-shelf"));
  let chosen = "";
  const pick = (want: string) => {
    chosen = shelves.some((s) => s.id === want) ? want : (shelves[0]?.id ?? "");
    for (const s of shelves) if ((s.id === chosen) !== s.hasAttribute("data-sp-on")) s.toggleAttribute("data-sp-on", s.id === chosen);
    if (tabs.matches) mark(chosen);
  };
  // ลิงก์ลึก #shelf-… หรือ #spread-… (ไพ่ผังในหมวด) ➔ เปิดแท็บของหมวดนั้น
  const openHash = (scroll: boolean) => {
    const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
    const shelf = target?.closest<HTMLElement>(".ui2-sp-shelf");
    if (!shelf) return false;
    pick(shelf.id);
    if (scroll && tabs.matches && target === shelf) shelf.scrollIntoView();
    return true;
  };
  if (!openHash(true)) pick("");
  stick.closest(".ui2-sp")?.setAttribute("data-sp-tabs", "");
  addEventListener("hashchange", () => openHash(true));
  stick.addEventListener("click", (e) => {
    if (!tabs.matches || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element).closest<HTMLAnchorElement>("a[href^='#shelf-']");
    if (!a) return;
    e.preventDefault();
    pick(a.getAttribute("href")!.slice(1));
    history.replaceState(history.state, "", `#${chosen}`);
  });
  tabs.addEventListener("change", () => tabs.matches && mark(chosen));
  // เหนือหมวดแรก (หัวหน้า) = ไม่มีหมวดไหนเรือง
  const hero = document.querySelector(".ui2-sp-hero");
  if (hero)
    new IntersectionObserver((es) => !tabs.matches && es[0].isIntersecting && mark(null), { rootMargin: "-45% 0px -50% 0px" }).observe(hero);
}

/* ── 1c. โชว์เคสหมวดแบบ fastwork.com/selling ─────────────────────────────────
   คอม ≥ 1200 · จอสูง ≥ 700 · ไม่ลดการเคลื่อนไหว · หน้าต่างที่สูงที่สุดพอดีจอ ➔ `is-scrolly`
   หน้าต่างค้างกลางจอ เลื่อนลง (หมวด−1) × 75vh แล้วสลับหมวดทีละบาน · ระดับ full แจกไพ่ใหม่ทุกครั้งที่สลับ
   เงื่อนไขไม่ครบ = หน้าต่างเรียงต่อกันตามปกติ (ระดับ full: แจกไพ่ตอนหน้าต่างเลื่อนเข้าจอครั้งแรก) */
if (show) {
  const root = document.documentElement;
  const wrap = show.querySelector<HTMLElement>(".ui2-sp-stage-wrap")!;
  const stage = show.querySelector<HTMLElement>("[data-sp-stage]")!;
  const panelsBox = show.querySelector<HTMLElement>(".ui2-sp-panels")!;
  const panels = Array.from(show.querySelectorAll<HTMLElement>(".ui2-sp-shelf"));
  const rail = Array.from(show.querySelectorAll<HTMLAnchorElement>(".ui2-sp-rail a"));
  const railList = show.querySelector<HTMLElement>(".ui2-sp-rail ol");
  const calm = () => root.getAttribute("data-fx") === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const full = () => root.getAttribute("data-fx") === "full" && innerWidth >= 1024 && !calm();
  let top = 0;
  let range = 0;
  let cur = -1;
  let lockUntil = 0;
  let raf = 0;

  const deal = (p: HTMLElement) => {
    p.classList.remove("is-wait", "is-deal");
    if (!full()) return;
    void p.offsetWidth; // เริ่มอนิเมชันใหม่ทุกครั้ง
    p.classList.add("is-deal");
  };
  const activate = (i: number) => {
    if (i === cur) return;
    const first = cur < 0;
    cur = i;
    panels.forEach((p, k) => p.toggleAttribute("data-active", k === i));
    rail.forEach((a, k) => (k === i ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current")));
    if (!first) deal(panels[i]);
  };
  const tick = () => {
    raf = 0;
    if (!scrolly()) return;
    const y = wrap.getBoundingClientRect().top;
    // ⚠️ ห้ามเขียน enter ลง style ของโชว์เคส (เดิม --enter) — ตัวแปร CSS สืบทอดลงทุกลูก
    //    เขียนทุกเฟรมที่เลื่อน = คำนวณสไตล์ใหม่ทั้งโชว์เคส 6 หมวด × ไพ่ทุกใบ (เครื่องหนักทั้งหน้า · 2026-10-17)
    const enter = Math.min(1, Math.max(0, 1 - (y - top) / (innerHeight * 0.55)));
    // หน้าต่างลอยขึ้นมาเกินครึ่งทาง ➔ แจกไพ่ของหมวดแรก (ครั้งเดียว)
    if (enter > 0.55 && panels[cur]?.classList.contains("is-wait")) deal(panels[cur]);
    const p = Math.min(1, Math.max(0, (top - y) / range));
    railList?.style.setProperty("--p", p.toFixed(3));
    if (performance.now() < lockUntil) return;
    activate(Math.round(p * (panels.length - 1)));
  };
  const goTo = (i: number, smooth: boolean) => {
    lockUntil = performance.now() + (smooth ? 900 : 0);
    activate(i);
    const y = scrollY + wrap.getBoundingClientRect().top - top + (i / (panels.length - 1)) * range;
    scrollTo({ top: Math.max(0, y), behavior: smooth ? "smooth" : "auto" });
  };

  // ระดับ full แบบเรียงต่อกัน: แจกไพ่ตอนหน้าต่างเข้าจอครั้งแรก (หน้าต่างที่อยู่ในจอแล้วไม่ต้องรอ)
  const dealOnView =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting || scrolly()) continue;
              dealOnView?.unobserve(e.target);
              deal(e.target as HTMLElement);
            }
          },
          { rootMargin: "0px 0px -18% 0px" },
        )
      : null;

  const setup = () => {
    // จัดหน้าต่างใหม่โดยไม่ให้มีการจางข้ามกัน (INC-0271) — ปลดหลังเบราว์เซอร์วาดสถานะใหม่แล้ว
    show.classList.add("is-setting");
    requestAnimationFrame(() => requestAnimationFrame(() => show.classList.remove("is-setting")));
    show.classList.remove("is-scrolly");
    panelsBox.style.zoom = "";
    panels.forEach((p) => {
      p.removeAttribute("data-active");
      p.classList.remove("is-wait", "is-deal");
    });
    dealOnView?.disconnect();
    cur = -1;
    const below = (el: HTMLElement) => el.getBoundingClientRect().top > innerHeight * 0.82;
    if (!calm() && innerWidth >= 1200 && innerHeight >= 700) {
      show.classList.add("is-scrolly");
      top = (document.querySelector<HTMLElement>("[data-site-header]")?.offsetHeight ?? 78) + 14;
      // หน้าต่างที่สูงที่สุดต้องพอดีจอ — จอโน้ตบุ๊ก (สูง ~760–800) ย่อหน้าต่างลงได้ถึง 78% ด้วย zoom (ย่อทั้งเลย์เอาต์ ไม่ใช่แค่ภาพ)
      // ย่อแล้วยังล้น = กลับไปเรียงต่อกัน (เจ้าของ 2026-10-16: จอโน้ตบุ๊กตกไปแบบเรียงต่อกันจนรายชื่อหมวดโผล่ชิดหัวหน้า)
      const room = innerHeight - top - 12;
      const fit = Math.min(1, (room - 4) / stage.offsetHeight);
      panelsBox.style.zoom = fit < 1 && fit >= 0.78 ? fit.toFixed(3) : "";
      if (stage.offsetHeight <= room) {
        range = (panels.length - 1) * innerHeight * 0.75;
        show.style.setProperty("--sp-steps-h", `${range}px`);
        if (full() && below(wrap)) panels[0].classList.add("is-wait");
        activate(0);
        tick();
        return;
      }
      show.classList.remove("is-scrolly");
    }
    if (!full()) return;
    for (const p of panels) {
      if (!below(p)) continue;
      p.classList.add("is-wait");
      dealOnView?.observe(p);
    }
  };

  // รายชื่อหมวด / แถบชิป ในโหมดเลื่อนแล้วสลับหมวด = เลื่อนไปช่วงของหมวดนั้น (ไม่กระโดดไป id ที่ซ้อนกันอยู่)
  document.addEventListener("click", (e) => {
    const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>("a[href^='#shelf-']");
    if (!a || !scrolly()) return;
    const i = panels.findIndex((p) => `#${p.id}` === a.getAttribute("href"));
    if (i < 0) return;
    e.preventDefault();
    goTo(i, true);
  });
  addEventListener("scroll", () => (raf ||= requestAnimationFrame(tick)), { passive: true });
  let resizeT = 0;
  addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(setup, 200);
  });
  setup();
  const hashed = location.hash.startsWith("#shelf-") ? panels.findIndex((p) => `#${p.id}` === location.hash) : -1;
  if (hashed >= 0 && scrolly()) goTo(hashed, false);
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
