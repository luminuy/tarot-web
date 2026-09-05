import type { Metadata } from "next";
import { AccountClient } from "@/app/account/AccountClient";

export const metadata: Metadata = {
  title: "บัญชีและประวัติการดูดวง | Sacred Account & Archive",
  description: "จัดการข้อมูลส่วนบุคคล สิทธิ์ความเป็นส่วนตัว และบันทึกประวัติการดูดวงไพ่ทาโรต์",
  // หน้าส่วนตัว — ต้อง noindex ไม่ใช่พึ่ง robots.txt อย่างเดียว
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountClient />;
}

