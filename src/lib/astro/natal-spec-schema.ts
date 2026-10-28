import { z } from "zod";
import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";

/**
 * ✅ ตรวจข้อมูลเกิดที่เบราว์เซอร์ส่งมา (ใช้ร่วมกัน `/api/natal/chat` และ `/api/natal/report`)
 * ทุกช่องมีช่วงค่า · ข้อความอิสระ (ชื่อ · สถานที่) ผ่านด่านกันฉีดคำสั่ง · เขตเวลาต้องเป็นชื่อ IANA ที่ใช้ได้จริง
 */
export const noInjection = (label: string) =>
  z.string().refine((v) => !looksLikePromptInjection(v), { message: `${label} มีอักขระที่ไม่อนุญาต กรุณาพิมพ์เป็นข้อความธรรมดา` });

const isZone = (z0: string) => {
  try {
    new Intl.DateTimeFormat("en", { timeZone: z0 });
    return true;
  } catch {
    return false;
  }
};

export const SpecSchema = z.object({
  name: noInjection("ชื่อ").max(40),
  day: z.number().int().min(1).max(31),
  month: z.number().int().min(1).max(12),
  yearCe: z.number().int().min(1900).max(2100),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  timeKnown: z.boolean(),
  place: z.object({
    mode: z.enum(["thai", "world", "custom"]),
    label: noInjection("สถานที่").max(80),
    labelEn: noInjection("สถานที่").max(80).optional(),
    lat: z.number().min(-90).max(90),
    lon: z.number().min(-180).max(180),
    zone: z.string().max(64).refine(isZone, "เขตเวลาไม่ถูกต้อง").optional(),
    fixedOffset: z.number().int().min(-840).max(840).optional(),
    refId: z.string().max(40).optional(),
  }),
  houseSystem: z.enum(["placidus", "whole", "koch", "equal", "porphyry", "regiomontanus", "campanus"]),
  nodeType: z.enum(["true", "mean"]),
  orbScale: z.number().min(0.5).max(1.5),
  asteroids: z.boolean().optional(),
  zodiac: z.enum(["tropical", "lahiri"]).optional(),
});

