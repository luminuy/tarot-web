import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

/**
 * ✦ metadata ของหน้าสมุดดวง `/journal` · `/en/journal` (REFLECTION_JOURNAL_PLAN 1.3)
 * หน้าส่วนตัว — ข้อมูลทั้งหมดมาจากเครื่อง/API หลัง hydrate · ⚠️ noindex ห้ามหาย (เหมือน `/account` · S-03)
 */
export const journalMetadataTh: Metadata = {
  title: "สมุดดวงของฉัน",
  description: "บันทึกคำอ่านไพ่ทาโรต์ของคุณ เขียนสิ่งที่เกิดขึ้นจริง ดูใจที่เปลี่ยนไป และไพ่ที่วนมาหาคุณแบบซื่อตรง",
  robots: { index: false, follow: false },
  alternates: noindexAlternates(),
};

export const journalMetadataEn: Metadata = {
  title: "My Reading Journal",
  description: "Your tarot reading journal — record what really happened, track how you felt, and see which cards keep returning, honestly.",
  robots: { index: false, follow: false },
  alternates: noindexAlternates(),
};
