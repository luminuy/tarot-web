/**
 * 🃏 ไพ่ผังเด้ง — ของกลางทุกหน้าที่มีไพ่ผัง (คลังผัง `/spreads` · หน้าหมวดเรื่อง `/spreads/topic/*` · หน้าคู่มือผัง `/spreads/<id>`)
 * แผน: docs/plans/UI_2_0_SPREADS_PLAN_2026-10-13.md หัวข้อ 5 + คำตอบเจ้าของข้อ 12 (2026-10-26)
 * ไพ่ + หน้าต่าง: `src/components/spread/SpreadCard.tsx` · สไตล์: `src/styles/ui2-spread-card.css`
 *
 * 1. แตะไพ่ผัง ➔ เปิด `<dialog>` ตัวเดียวด้วย show() + ฉากหลังของเราเอง · ไพ่ใหญ่คัดลอกจากไพ่ใบที่แตะ (cloneNode)
 *    ⚠️ ไม่ใช้ showModal(): เนื้อหาข้างหลังทั้งหน้ากลายเป็น inert ➔ คำนวณสไตล์ใหม่ทั้งหน้าทุกครั้งที่เปิด/ปิด
 *       วัดที่ CPU ×4: เปิด 149 ms (modal) เทียบ 20 ms (show) — แตะแล้วสะดุดบนมือถือกลางล่าง (B2 · 2026-10-21 · INC-0301)
 *       พฤติกรรมแบบ modal ทำเอง: ฉากหลังกดปิด · Esc ปิด · Tab วนในหน้าต่าง · aria-modal · ล็อกเลื่อน (CSS `html:has`)
 *    กดพร้อม Ctrl / ⌘ / Shift / Alt หรือคลิกกลาง = ปล่อยให้ลิงก์ทำงานตามปกติ (เปิดหน้าคู่มือ)
 * 2. ลิงก์ลึก `#spread-<id>` เปิดหน้าต่างของผังนั้นเอง · เปิด/ปิดใช้ history.replaceState (ไม่เพิ่มประวัติ)
 * 3. นับการแตะ `spread_card_tap` (เจ้าของ 2026-10-26 ตอบคำถามเปิดข้อ 2) — ส่งแค่ id ผัง · หมวด · ที่มา · ภาษา · path
 *    ⚠️ ส่ง **หลัง** หน้าต่างเปิดแล้ว ตอนเครื่องว่าง (requestIdleCallback) — ห้ามแย่งเฟรมเปิดหน้าต่าง (INC-0301 วัดไว้ 63–135 ms ที่ CPU ×4)
 *    ⚠️ ห้ามส่งข้อความใด ๆ ที่ผู้ใช้พิมพ์ (PDPA · ด่าน test-analytics-integrity)
 *
 * ⚠️ ไม่มี JS หรือสคริปต์ล้ม = ไพ่เป็นลิงก์ไปหน้าคู่มือผังตามปกติ (ไม่มีอะไรหาย)
 */
import { trackEvent } from "@/lib/analytics";

const CARD = "a.ui2-spread-card[data-spread-id]";

/** ข้อมูลที่ส่งไป GA4 — ไม่มีข้อมูลระบุตัวคน ไม่มีข้อความที่ผู้ใช้พิมพ์ */
function tapEvent(card: HTMLElement, action: "pop" | "link"): void {
  const surface = card.dataset.surface;
  trackEvent("spread_card_tap", {
    spread_id: card.dataset.spreadId ?? "",
    category: card.dataset.shelf ?? "",
    surface: surface === "topic" || surface === "detail_more" ? surface : "library",
    locale: document.documentElement.lang === "en" ? "en" : "th",
    page_path: location.pathname,
    action,
  });
}

/** นับการแตะไพ่ผัง — คิวไว้ทำตอนเครื่องว่าง ไม่บล็อกเฟรมที่ตอบการแตะ (INC-0301) */
function trackTap(card: HTMLElement, action: "pop" | "link"): void {
  const send = () => tapEvent(card, action);
  if ("requestIdleCallback" in window) requestIdleCallback(send, { timeout: 2000 });
  else setTimeout(send, 300);
}

export function initSpreadPop(): void {
  const dialog = document.querySelector<HTMLDialogElement>("[data-spread-pop]");

  // ไพ่ที่เปิดแท็บใหม่ (Ctrl / ⌘ / Shift / คลิกกลาง) — ลิงก์ทำงานตามปกติ แต่ยังนับว่าแตะใบนี้
  const onLinkTap = (e: MouseEvent) => {
    const card = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(CARD);
    if (card && (e.button === 1 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) trackTap(card, "link");
  };
  document.addEventListener("auxclick", onLinkTap);

  if (!dialog || typeof dialog.show !== "function") {
    // เบราว์เซอร์เก่าไม่มี <dialog> — ไพ่เป็นลิงก์ธรรมดา นับก่อนเปลี่ยนหน้า (gtag ส่งด้วย beacon)
    document.addEventListener("click", (e) => {
      const card = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(CARD);
      if (card && e.button === 0) tapEvent(card, "link");
    });
    return;
  }
  const pop = dialog;
  /*
   * หน้าต่างแบบไม่ modal ไม่ขึ้น top layer เอง — ย้ายไปไว้ใต้ <body> ตรง ๆ ไม่ให้ติด stacking context
   * ของ `div.relative.z-10` ที่ครอบหน้าอยู่ (บทเรียน INC-0243 · หัวเว็บ z-50 จะทับหน้าต่าง)
   * กล่องครอบมีคลาส `ui2-sp` ให้กฎ CSS ที่ขึ้นต้นด้วย `.ui2-sp` ยังใช้กับไพ่ใหญ่ที่คัดลอกมาได้เหมือนเดิม
   */
  const layer = Object.assign(document.createElement("div"), { className: "ui2-sp ui2-pop-layer" });
  // `data-floating` = ข้อยกเว้นของกฎที่ให้ลูกตรงของ <body> เป็น z-index 1 (ไม่งั้นหัวเว็บ z-50 ทับฉากหลัง)
  layer.setAttribute("data-floating", "");
  const scrim = Object.assign(document.createElement("div"), { className: "ui2-pop-scrim", hidden: true });
  layer.append(scrim, pop);
  document.body.append(layer);
  pop.setAttribute("aria-modal", "true");
  const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = pop) => root.querySelector(sel) as T;
  const big = $("[data-pop-card]");
  const list = $("[data-pop-list]");
  let from: HTMLElement | null = null;

  const open = (card: HTMLAnchorElement) => {
    const slot = card.parentElement as HTMLElement;
    const data = $("[data-pop]", slot);
    // สีหมวดอยู่ที่ตัวไพ่เอง (SpreadCard ใส่ไว้) — ใช้ได้ทุกหน้าโดยไม่ต้องพึ่งกล่องหมวดของคลังผัง
    for (const v of ["--cat", "--cat-ink"]) pop.style.setProperty(v, card.style.getPropertyValue(v));

    big.replaceChildren(...Array.from(card.children, (n) => n.cloneNode(true)));
    // ไพ่ใหญ่ไม่ใช่หัวข้อของหน้า — แถบชื่อเป็นข้อความธรรมดา (หัวข้อของหน้าต่างคือ h2 ในแผงข้อมูล)
    const band = big.querySelector(".ui2-sc-band");
    band?.replaceWith(Object.assign(document.createElement("p"), { className: "ui2-sc-band", textContent: band.textContent ?? "" }));
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
    if (!pop.open) {
      scrim.hidden = false;
      pop.show();
    } else {
      // เปิดอยู่แล้ว (สลับไพ่ผ่านลิงก์ลึก) — เลื่อนกลับบนสุด · เปิดใหม่ไม่ต้อง: กล่องเพิ่งถูกสร้างใหม่ อยู่บนสุดเอง (ไม่บังคับคำนวณเลย์เอาต์)
      pop.scrollTop = 0;
    }
    if (!pop.contains(document.activeElement)) $("[data-pop-close]").focus({ preventScroll: true });
    history.replaceState(history.state, "", `#${card.id}`);
  };

  document.addEventListener("click", (e) => {
    const card = (e.target as Element | null)?.closest?.<HTMLAnchorElement>(CARD);
    if (!card || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      onLinkTap(e);
      return;
    }
    e.preventDefault();
    open(card);
    trackTap(card, "pop");
  });

  // ปิด: กากบาท · ปุ่มกลับ (มือถือ) · แตะพื้นหลัง (คลิกโดนตัว <dialog> เอง = นอกเนื้อหา) · Esc
  // เก็บกวาดทันทีที่สั่งปิด (ไม่รออีเวนต์ close ซึ่งมาช้ากว่า) · เรียกซ้ำได้ไม่มีผล
  const done = () => {
    if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
    from?.focus({ preventScroll: true });
  };
  const close = () => {
    pop.close();
    done();
  };
  pop.addEventListener("click", (e) => {
    const t = e.target as Element;
    if (t === pop || t.closest("[data-pop-close]")) close();
  });
  scrim.addEventListener("click", close);
  // แบบไม่ modal ไม่มี Esc / กันโฟกัสหลุดให้ — ทำเองตรงนี้
  document.addEventListener("keydown", (e) => {
    if (!pop.open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const items = Array.from(
      pop.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hidden && el.getClientRects().length > 0);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !pop.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !pop.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  });
  pop.addEventListener("close", () => {
    scrim.hidden = true;
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

  /* ── ลิงก์ลึก (ไม่นับเป็นการแตะ) ─────────────────────────────────────── */
  const deep = location.hash.startsWith("#spread-") && document.getElementById(location.hash.slice(1));
  if (deep instanceof HTMLAnchorElement && deep.matches(CARD)) open(deep);
}
