import type { Metadata } from "next";
import { PUBLIC_SPREADS, getSpread } from "@/data/spreads";
import { clampDescription, pickTitle, stripCardCount } from "@/lib/config/meta-length";
import { noindexAlternates } from "@/lib/config/site";
import type { Locale } from "@/lib/i18n/types";

/**
 * 🔮 หน้าดูดวงรายผัง `/read/<ผัง>` (และ `/en/read/<ผัง>`) — 26 ผังต่อภาษา
 * ---------------------------------------------------------------------------
 * ปลายทางของปุ่ม "เริ่มดูดวงด้วยผังนี้" ทุกปุ่มในเว็บ (คลังผัง · คู่มือรายผัง · หน้าหมวด ·
 * หน้าไพ่รายใบ · Pick A Card) · เปิดมาแล้วอยู่ขั้น "ตั้งคำถาม" ของผังนั้นทันที
 * ไม่ผ่านหน้าแรกเลย (คำสั่งเจ้าของ 2026-09-23 · ทางเลือก ข.)
 *
 * ของเดิมทุกปุ่มชี้ `/?spread=<id>` = โหลดหน้าแรกทั้งหน้าก่อนแล้วค่อยกระโดดข้ามขั้น
 * ผู้ใช้จึงเห็น "เด้งกลับหน้าแรก" ทุกครั้ง · ลิงก์เก่าแบบนั้นยังใช้ได้ — หน้าแรกเด้งต่อมาที่นี่ให้
 *
 * ⚠️ `noindex` เสมอ (เคาะกับเจ้าของแล้ว) — หน้านี้มีแค่ชื่อผังกับช่องตั้งคำถาม 26 หน้าแทบเหมือนกัน
 *    ถ้าให้ index จะแย่งอันดับกับหน้าคู่มือ `/spreads/<ผัง>` ซึ่งเป็นหน้าที่ตั้งใจให้ติดค้นหา
 *    และคนที่มาจาก Google จะเจอกำแพงเข้าสู่ระบบเป็นอย่างแรก
 *
 * ⚠️ `follow: true` (ไม่ใช่ false แบบหน้าบัญชี) — ลิงก์ในหน้ายังพาบอตไปหน้าอื่นได้ตามปกติ
 *    และ **ไม่ใส่ canonical** — Google แนะนำว่า noindex คู่ canonical คือสัญญาณขัดกัน (A6-01)
 */
export function readSpreadStaticParams() {
  return PUBLIC_SPREADS.map((spread) => ({ id: spread.id }));
}

export function readSpreadMetadata(id: string, locale: Locale): Metadata {
  const spread = getSpread(id);
  const isEnglish = locale === "en";
  if (!spread) {
    return {
      title: isEnglish ? "Spread not found" : "ไม่พบผังพยากรณ์",
      robots: { index: false, follow: true },
      alternates: noindexAlternates(),
    };
  }

  // ชื่อผังมีจำนวนไพ่ติดมาในวงเล็บอยู่แล้ว ("ดวงรายวัน (ไพ่ 1 ใบ)") — ห้ามต่อจำนวนซ้ำ
  const title = isEnglish
    ? pickTitle([`Tarot Reading — ${spread.nameEn}`, `Tarot Reading — ${stripCardCount(spread.nameEn)}`])
    : pickTitle([`ดูดวงด้วยผัง${spread.nameTh}`, `ดูดวงด้วยผัง${spread.nameTh.replace(/\s*\(.*\)\s*$/u, "")}`]);

  return {
    title,
    description: clampDescription(isEnglish ? spread.descriptionEn : spread.description),
    robots: { index: false, follow: true },
    alternates: noindexAlternates(),
  };
}
