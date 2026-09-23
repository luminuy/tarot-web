/**
 * 📰 ปุ่มคัดลอกลิงก์ + สถิติการอ่านบทความ — สคริปต์ธรรมดาแทน island ทั้งก้อน
 * ===========================================================================
 *
 * หน้าบทความทั้ง 52 หน้า (26 เรื่อง × 2 ภาษา) เคย hydrate React 184 KB เพื่อของสองชิ้น:
 * ปุ่ม "คัดลอกลิงก์" กับการยิงสถิติ `blog_read` หนึ่งครั้งตอนเปิดหน้า
 *
 * ⚠️ ห้ามนำเข้าอะไรที่ลาก React ตามมา และห้ามนำเข้าคลังบทความทั้งก้อน
 *    (ค่าที่ต้องใช้ถูกส่งมาทางแอตทริบิวต์บน HTML แล้ว)
 */

import { trackEvent } from "@/lib/analytics";
import { copyToClipboard } from "@/lib/utils/clipboard";

const bar = document.querySelector<HTMLElement>("[data-article-share]");

if (bar) {
  const button = bar.querySelector<HTMLButtonElement>("[data-copy-link]");
  const label = bar.querySelector<HTMLElement>("[data-copy-label]");

  if (button && label) {
    const original = label.textContent ?? "";
    const copiedLabel = button.dataset.labelCopied ?? original;
    const failedLabel = button.dataset.labelFailed ?? original;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", async () => {
      /*
       * A8-08: โหลดเสียงตอนกดเท่านั้น — import แบบ static ทำให้ bundler ผูกชังก์ `audio` กับตัวช่วย
       * ที่อยู่ในชังก์ `react.*.js` ➔ หน้าบทความ (ไม่มี island เลย) โหลด React core ฟรี ๆ ทุกหน้า
       * ด่าน test-bundle-budget ตรวจว่าหน้าที่ไม่มี island ไม่มี React ใน closure
       */
      void import("@/lib/utils/audio").then(({ soundManager }) => soundManager.playMenuTapSound()).catch(() => {});
      const ok = await copyToClipboard(window.location.href);

      // A5-16: คัดลอกพลาด (LINE in-app · iOS WebView · http) ต้องบอกผู้ใช้ ไม่ใช่เงียบ
      // ป้ายมี aria-live="polite" — ทั้งสำเร็จและพลาดถูกประกาศให้ screen reader
      label.textContent = ok ? copiedLabel : failedLabel;
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        label.textContent = original;
      }, 2500);
    });
  }

  /* สถิติการอ่านบทความ — เดิมอยู่ใน `useEffect` ของคอมโพเนนต์ ใช้สัญญาเดิมทุกคีย์ */
  const slug = bar.dataset.articleSlug;
  if (slug) {
    trackEvent("blog_read", {
      slug,
      title: bar.dataset.articleTitle ?? "",
      category: bar.dataset.articleCategory ?? "",
    });
  }
}
