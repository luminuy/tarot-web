import type { Metadata } from "next";

/**
 * หน้าในกลุ่มนี้เป็น Client Component จึง `export const metadata` เองไม่ได้
 * จึงต้องประกาศผ่าน layout — และต้องประกาศจริง ไม่ใช่พึ่ง robots.txt อย่างเดียว
 * เพราะ URL ที่ถูกกันไม่ให้คลาน บอตจะ "มองไม่เห็น" คำสั่ง noindex แล้วยังโผล่ใน SERP ได้
 */
export const metadata: Metadata = {
  title: "ตั้งรหัสผ่านใหม่",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
