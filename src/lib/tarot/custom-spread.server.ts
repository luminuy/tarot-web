import { z } from "zod";
import { looksLikePromptInjection, sanitizePromptValue } from "@/lib/ai/prompt-guard";
import type { Spread } from "@/data/spreads-helpers";
import {
  buildCustomSpread,
  CUSTOM_MAX_CARDS,
  CUSTOM_NAME_MAX,
  CUSTOM_POS_MEANING_MAX,
  CUSTOM_POS_NAME_MAX,
  type CustomSpreadInput,
  type LayoutId,
  validateCustomSpread,
} from "@/lib/tarot/custom-spread";

/**
 * ✦ ด่านฝั่งเซิร์ฟเวอร์ของผังที่สร้างเอง — ใช้ทั้ง API บันทึกผังและ `/start`
 *  1. Zod: รูปทรง + เพดานความยาว (ไม่เชื่อหน้าเว็บ)
 *  2. `validateCustomSpread`: กติกาเดียวกับที่หน้าสร้างผังแสดงให้ผู้ใช้เห็น
 *  3. `looksLikePromptInjection`: ด่านเดียวกับช่องคำถาม — ข้อความเหล่านี้ลงไปอยู่ใน prompt
 *  4. `sanitizePromptValue`: ทำ `<` `>` ให้ปิดแท็กของ prompt ไม่ได้ แม้หลุดด่าน 3
 */

const LAYOUT_IDS = ["row", "arc", "pyramid", "diamond", "grid", "cross", "rows"] as const satisfies readonly LayoutId[];

const text = (max: number) => z.string().max(max * 2);

export const CustomSpreadInputSchema = z.object({
  name: text(CUSTOM_NAME_MAX),
  layout: z.enum(LAYOUT_IDS),
  positions: z
    .array(
      z.object({
        nameTh: text(CUSTOM_POS_NAME_MAX),
        nameEn: text(CUSTOM_POS_NAME_MAX).optional(),
        meaning: text(CUSTOM_POS_MEANING_MAX),
        meaningEn: text(CUSTOM_POS_MEANING_MAX).optional(),
      }),
    )
    .min(1)
    .max(CUSTOM_MAX_CARDS),
});

function clean(input: CustomSpreadInput): CustomSpreadInput {
  return {
    name: sanitizePromptValue(input.name, CUSTOM_NAME_MAX),
    layout: input.layout,
    positions: input.positions.map((p) => ({
      nameTh: sanitizePromptValue(p.nameTh, CUSTOM_POS_NAME_MAX),
      ...(p.nameEn ? { nameEn: sanitizePromptValue(p.nameEn, CUSTOM_POS_NAME_MAX) } : {}),
      meaning: sanitizePromptValue(p.meaning, CUSTOM_POS_MEANING_MAX),
      ...(p.meaningEn ? { meaningEn: sanitizePromptValue(p.meaningEn, CUSTOM_POS_MEANING_MAX) } : {}),
    })),
  };
}

export type ParsedCustomSpread =
  | { ok: true; input: CustomSpreadInput; spread: Spread; warnings: string[] }
  | { ok: false; error: string };

export function parseCustomSpread(raw: unknown, lang: "th" | "en" = "th"): ParsedCustomSpread {
  const isEn = lang === "en";
  const shape = CustomSpreadInputSchema.safeParse(raw);
  if (!shape.success) return { ok: false, error: isEn ? "This spread isn't valid." : "ข้อมูลผังไม่ถูกต้อง" };

  const texts = [shape.data.name, ...shape.data.positions.flatMap((p) => [p.nameTh, p.nameEn ?? "", p.meaning, p.meaningEn ?? ""])];
  if (texts.some((t) => looksLikePromptInjection(t))) {
    return { ok: false, error: isEn ? "Some text isn't allowed." : "มีข้อความบางส่วนที่ไม่อนุญาต" };
  }

  const input = clean(shape.data);
  const check = validateCustomSpread(input, lang);
  if (!check.ok) return { ok: false, error: check.errors[0] };
  return { ok: true, input, spread: buildCustomSpread(input), warnings: check.warnings };
}
