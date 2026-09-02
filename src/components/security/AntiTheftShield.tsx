"use client";

import { useEffect } from "react";
import { SITE_NAME_TH, SITE_ORIGIN } from "@/lib/config/site";

/**
 * 🛡️ AntiTheftShield — ระบบคุ้มครองลิขสิทธิ์และป้องกันการคัดลอก/ดูดข้อมูล
 *
 * 1. Console Intellectual Property Watermark: แสดงแถบคำเตือนลิขสิทธิ์ใน DevTools Console
 * 2. Smart Copy Attribution: แปะเครดิตและลิงก์ของวิหารอัตโนมัติเมื่อคัดลอกคำทำนาย
 * 3. Card Drag & Scraping Shield: ป้องกันการลากภาพไพ่ 1909 ออกไปเก็บโดยตรง
 */
export function AntiTheftShield() {
  useEffect(() => {
    // 1. 🛡️ Console Security & IP Protection Banner
    const isDev = process.env.NODE_ENV === "development";
    if (!isDev) {
      console.log(
        "%c🔮 SEERTAROT ORACLE %c PROTECTED INTELLECTUAL PROPERTY ",
        "background: #18122B; color: #F5DEAA; font-weight: bold; padding: 4px 8px; border-radius: 4px 0 0 4px; border: 1px solid #D4AF37;",
        "background: #4A0E4E; color: #FFF; font-weight: bold; padding: 4px 8px; border-radius: 0 4px 4px 0; border: 1px solid #D4AF37;"
      );
      console.log(
        "%c✦ สงวนลิขสิทธิ์ (c) 2026 SeerTarot (Jack Bank) & Core Contributors\n✦ ภายใต้สัญญาอนุญาต PolyForm Noncommercial 1.0.0 & CC BY-NC-ND 4.0\n❌ ห้ามคัดลอก ดัดแปลง ดูดข้อมูล (Scraping) หรือนำไปใช้ในเชิงพาณิชย์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร",
        "color: #D4AF37; font-size: 11px; line-height: 1.6;"
      );
    }

    // 2. 📋 Smart Copy Attribution Watermark (Scoped to prophecy text only)
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection) return;
      const text = selection.toString();
      if (!text || text.trim().length < 60) return;

      const anchor = selection.anchorNode?.parentElement;
      const isReadingContainer = anchor?.closest("[data-reading-result]") || anchor?.closest(".prose-oracle");
      if (!isReadingContainer) return;

      const watermark = `\n\n✦ คำทำนายพยากรณ์โดย: ${SITE_NAME_TH}\n✦ เว็บไซต์: ${SITE_ORIGIN}`;
      if (e.clipboardData) {
        e.preventDefault();
        e.clipboardData.setData("text/plain", text + watermark);
      }
    };

    // 3. 🖼️ Prevent Image Dragging on Cards
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === "IMG") {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("dragstart", handleDragStart);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("dragstart", handleDragStart);
    };
  }, []);

  return null;
}

export default AntiTheftShield;
