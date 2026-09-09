import type { Metadata } from "next";

import "./globals.css";
import { LocaleProvider } from "@/lib/i18n";
import { fontVariables } from "./_shared/fonts";
import { NotFoundBody, notFoundMetadata } from "./_shared/pages/not-found";

/**
 * 🚧 หน้า 404 ของ **URL ที่ไม่ตรงกับ route ไหนเลยทั้งเว็บ** (เช่น `/zzz`, `/en/zzz`)
 *
 * ⚠️ ไฟล์นี้ต้องอยู่นอก route group (`(th)` / `(en)`) — root layout ทั้งสองตัวของเว็บนี้
 * อยู่ในกลุ่มทั้งคู่ Next จึงหา root not-found ไม่เจอถ้าไม่มีไฟล์นี้ ผลคือ URL ที่พิมพ์ผิด
 * ทุกเส้นได้หน้า 404 ดีฟอลต์ของ Next ("This page could not be found.") ภาษาอังกฤษล้วน
 * ไม่มีแบรนด์ ไม่มีหัวเว็บ และไม่มีลิงก์กลับเข้าเว็บสักเส้น (INC-0112)
 *
 * ⚠️ ห้ามเรนเดอร์ `<html>`/`<body>` เองที่นี่เด็ดขาด — Next ครอบเปลือก `<html><body>`
 * ของมันเองให้ชั้นนี้อยู่แล้ว (วัดจาก `.next/server/app/_not-found.html` จริง) การเรนเดอร์ซ้ำ
 * ทำให้ได้ `<html>` ซ้อนใน `<body>` ซึ่งเป็น HTML ที่ไม่ถูกต้อง เบราว์เซอร์จะทิ้ง `<head>`
 * ชั้นในทั้งก้อน จึงต้องหยิบเฉพาะของที่จำเป็นมาเอง: `globals.css` · ตัวแปรฟอนต์ ·
 * `LocaleProvider` (หัวเว็บและฟุตเตอร์เรียก `useLocale()` ถ้าไม่มี provider จะพังทั้งหน้า)
 */
export const metadata: Metadata = notFoundMetadata;

export default function GlobalNotFound() {
  return (
    <div className={`${fontVariables} min-h-dvh font-sans antialiased`}>
      <LocaleProvider>
        <NotFoundBody />
      </LocaleProvider>
    </div>
  );
}
