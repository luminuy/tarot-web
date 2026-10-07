import { z } from "zod";
import { getSpread } from "@/data/spreads";
import type { Spread } from "@/data/spreads-helpers";
import { looksLikePromptInjection } from "@/lib/ai/prompt-guard";
import { parseCustomSpread } from "@/lib/tarot/custom-spread.server";
import { resolveRecordSpread } from "@/lib/tarot/record-spread";
import { CUSTOM_SPREAD_ID, type CustomSpreadInput } from "@/lib/tarot/custom-spread";
import { STUDIO_NOTE_MAX, STUDIO_PART_MAX } from "@/lib/studio/draft";
import { SHARE_EXPIRY_DAYS } from "@/lib/studio/share";

/**
 * 🧾 รูปข้อมูลขาเข้าของ Reader Studio — ตรวจที่นี่ที่เดียว (zod + ด่านคำสั่งแฝงสำหรับข้อความที่จะเข้า prompt)
 */

const trimmed = (max: number) => z.string().trim().max(max);
const nullableText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" ? v.trim().slice(0, max) || null : null));

export const ID = {
  client: /^rc_[0-9a-f-]{36}$/,
  reading: /^rr_[0-9a-f-]{36}$/,
  template: /^rt_[0-9a-f-]{36}$/,
};

export const SettingsSchema = z.object({
  brandName: nullableText(60),
  logoUrl: nullableText(500),
  brandColor: nullableText(9),
  contactLine: nullableText(120),
  showAiDisclosure: z.boolean(),
});

export const ClientSchema = z.object({
  displayName: trimmed(80).min(1),
  contact: nullableText(160),
  note: nullableText(2000),
});

export const CreateReadingSchema = z.object({
  clientId: z.string().regex(ID.client).nullable().optional(),
  title: trimmed(120).min(1),
  question: nullableText(500),
  spreadId: z.string().min(1).max(64),
  customSpread: z.unknown().optional(),
  templateId: z.string().regex(ID.template).optional(),
  /** เริ่มจากคิว/นัดที่จองผ่านเว็บ (`queue-import.ts`) */
  ticketId: z.string().regex(/^ticket_[0-9a-f]{16}$/).optional(),
});

const BodyPartSchema = z.object({
  key: z.string().regex(/^(intro|summary|closing|card:\d{1,2})$/),
  text: z.string().max(STUDIO_PART_MAX),
  origin: z.enum(["reader", "ai", "edited"]),
});

export const PatchReadingSchema = z.object({
  title: trimmed(120).min(1).optional(),
  // ไม่ใช้ nullableText — ต้องแยก "ไม่ได้ส่งมา" (undefined) ออกจาก "ลบคำถาม" (null)
  question: z.union([z.string().max(1000), z.null()]).optional(),
  clientId: z.string().regex(ID.client).nullable().optional(),
  notes: z.record(z.string().regex(/^(intro|summary|closing|\d{1,2})$/), z.string().max(STUDIO_NOTE_MAX)).optional(),
  body: z.array(BodyPartSchema).max(24).optional(),
  showAiDisclosure: z.boolean().optional(),
});

export const DrawSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("fair"), clientSeed: z.string().min(8).max(4096) }),
  z.object({
    mode: z.literal("manual"),
    cards: z.array(z.object({ cardIndex: z.number().int().min(0).max(77), isReversed: z.boolean() })).min(1).max(13),
  }),
]);

export const ShareSchema = z.object({
  expiresDays: z.number().int().refine((d) => (SHARE_EXPIRY_DAYS as readonly number[]).includes(d)),
  password: z.union([z.string().min(4).max(64), z.literal(""), z.null()]).optional(),
});

export const TemplateSchema = z.object({
  name: trimmed(60).min(1),
  intro: nullableText(1200),
  closing: nullableText(1200),
});

/** ข้อความของหมอที่จะเข้า prompt ร่าง — มีคำสั่งแฝง = ไม่รับ (บอกตรง ๆ ไม่ตัดเงียบ) */
export function findInjectedNote(texts: Array<string | null | undefined>): boolean {
  return texts.some((t) => typeof t === "string" && t.length > 0 && looksLikePromptInjection(t));
}

export type ResolvedStudioSpread = { ok: true; spreadId: string; customSpread: CustomSpreadInput | null; spread: Spread } | { ok: false; error: string };

/** ผังของคำอ่าน: ผังสาธารณะของเว็บ หรือผังที่หมอสร้างเอง (ตรวจด้วยด่านเดียวกับ /start) */
export function resolveStudioSpread(spreadId: string, customRaw: unknown): ResolvedStudioSpread {
  if (spreadId === CUSTOM_SPREAD_ID) {
    const parsed = parseCustomSpread(customRaw, "th");
    if (!parsed.ok) return { ok: false, error: parsed.error };
    return { ok: true, spreadId, customSpread: parsed.input, spread: parsed.spread };
  }
  const spread = getSpread(spreadId);
  if (!spread || spread.internal) return { ok: false, error: "ไม่พบผังนี้" };
  return { ok: true, spreadId, customSpread: null, spread };
}

/** ผังของคำอ่านที่บันทึกแล้ว — ไม่มี = undefined (ห้ามเดาผัง กฎเหล็กข้อ 14) */
export function spreadOfReading(r: { spreadId: string; customSpread: unknown }): Spread | undefined {
  return resolveRecordSpread({ spreadId: r.spreadId, customSpread: (r.customSpread ?? undefined) as CustomSpreadInput | undefined });
}

/** รูปผังแบบเบาสำหรับส่งให้หน้าเว็บ (ไม่ลากข้อมูลผังทั้งก้อน) */
export function spreadView(s: Spread) {
  return {
    nameTh: s.nameTh,
    positions: s.positions.map((p) => ({ nameTh: p.nameTh, meaning: p.meaning, x: p.x, y: p.y, rotate: p.rotate ?? 0 })),
  };
}
