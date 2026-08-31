"use client";

import { useEffect } from "react";
import { warmupTarotAssets } from "@/lib/utils/cache";

/**
 * คอมโพเนนต์ทำงานเบื้องหลังเพื่ออุ่นเครื่อง Cache และโหลด Assets สำคัญล่วงหน้า
 */
export function AssetWarmup() {
  useEffect(() => {
    warmupTarotAssets();
  }, []);

  return null;
}
