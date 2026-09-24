/**
 * 🔐 หน้าต่างเข้าสู่ระบบของปุ่มบัญชีบนหัวเว็บ (หน้าที่ Astro เรนเดอร์)
 * ===========================================================================
 * หัวเว็บของหน้า Astro เป็น HTML นิ่ง ไม่ hydrate — ปุ่มบัญชี (`HeaderAccount`) จึงเป็นลิงก์ `/account`
 * ไฟล์นี้ทำให้คนที่ยังไม่ล็อกอิน "แตะแล้วเด้งหน้าต่างเข้าสู่ระบบ" เหมือนหน้าแรก (คำสั่งเจ้าของ 2026-09-24)
 *
 * โหลดแบบ dynamic import จาก `site-header.ts` ตอนชี้/แตะปุ่มเท่านั้น
 * ➔ React + AuthModal ไม่เข้าบันเดิลของหน้าที่ไม่มีใครกดปุ่มนี้ (หน้าส่วนใหญ่ไม่มี island เลย)
 * สร้างรากแยกของตัวเองครั้งเดียว แล้วสลับ `isOpen` — อนิเมชันขาออกของ Modal จะได้เล่นจนจบ
 */

import { createRoot, type Root } from "react-dom/client";

import { AuthModal } from "@/components/auth/AuthModal";
import { LocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/types";

let root: Root | null = null;

export function openHeaderAuth(locale: Locale): void {
  if (!root) {
    const host = document.createElement("div");
    host.setAttribute("data-header-auth-root", "");
    document.body.appendChild(host);
    root = createRoot(host);
  }
  const render = (isOpen: boolean) => {
    root?.render(
      <LocaleProvider forcedLocale={locale}>
        <AuthModal isOpen={isOpen} onClose={() => render(false)} />
      </LocaleProvider>,
    );
  };
  render(true);
}
