import type { Metadata } from "next";

/**
 * หน้าในกลุ่ม /reading เป็นห้องสนทนาเฉพาะรอบดูดวงของผู้ใช้แต่ละคน
 * อ่านสถานะจาก sessionStorage ทั้งหมด เปิดตรง ๆ จากผลค้นหาจะว่างเปล่าเสมอ
 * จึงต้อง noindex — และต้องประกาศเอง ไม่ใช่ปล่อยให้สืบทอด canonical "/" จาก layout แม่
 */
export const metadata: Metadata = {
  title: "ห้องสนทนากับแม่หมอ",
  robots: { index: false, follow: true },
};

export default function ReadingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
