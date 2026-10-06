import type { Metadata } from "next";
import { noindexAlternates } from "@/lib/config/site";

/**
 * ✦ metadata ของหน้าออกแบบผัง `/spreads/create` · `/en/spreads/create` (REFLECTION_JOURNAL_PLAN 1.8)
 * เครื่องมือส่วนตัว (ผังของฉัน + ลิงก์แบ่งปัน `?s=`) — noindex กันลิงก์แบ่งปันหลุดเข้าดัชนีค้นหา
 */
export const spreadBuilderMetadataTh: Metadata = {
  title: "ออกแบบผังไพ่ทาโรต์ของคุณเอง | SeerTarot",
  description: "สร้างผังไพ่ทาโรต์ 1–7 ใบที่ถามตรงกับใจคุณ เลือกตำแหน่งจากคลังที่แม่หมอเขียนไว้หรือเขียนเอง แล้วเปิดไพ่กับแม่หมอ AI ได้ทันที",
  robots: { index: false, follow: true },
  alternates: noindexAlternates(),
};

export const spreadBuilderMetadataEn: Metadata = {
  title: "Design Your Own Tarot Spread | SeerTarot",
  description: "Build a 1–7 card tarot spread that asks exactly what you mean — pick positions from our readers' library or write your own, then read it right away.",
  robots: { index: false, follow: true },
  alternates: noindexAlternates(),
};
