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
import { soundManager } from "@/lib/utils/audio";

const bar = document.querySelector<HTMLElement>("[data-article-share]");

if (bar) {
  const button = bar.querySelector<HTMLButtonElement>("[data-copy-link]");
  const label = bar.querySelector<HTMLElement>("[data-copy-label]");

  if (button && label) {
    const original = label.textContent ?? "";
    const copiedLabel = button.dataset.labelCopied ?? original;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;

    button.addEventListener("click", async () => {
      soundManager.playMenuTapSound();
      const ok = await copyToClipboard(window.location.href);
      if (!ok) return;

      label.textContent = copiedLabel;
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
