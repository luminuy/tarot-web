import { NextResponse } from "next/server";
import { z } from "zod";

import { cardById, DECK } from "@/data/cards";
import { PERSONAS } from "@/data/personas";
import { SYSTEM_CORE_KNOWLEDGE } from "@/lib/ai/prompt";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { ContentOverrideDoc } from "@/lib/content/overrides";
import { KEY, kvGetJSON, kvPutJSON, invalidateMemo } from "@/lib/platform/kv-store";

export const runtime = "nodejs";

const VALID_CARD_IDS = new Set(DECK.map((c) => c.id));
const VALID_PERSONA_IDS = new Set(PERSONAS.map((p) => p.id));

const str = (max: number) => z.string().max(max);

const CAT_KEYS = ["general", "love", "work", "money", "self"] as const;

const InterpretationPatch = z
  .object({ upright: str(2500).optional(), reversed: str(2500).optional() })
  .strict();

const CardOverride = z
  .object({
    meanings: z.partialRecord(z.enum(CAT_KEYS), InterpretationPatch).optional(),
    keywords: z
      .object({
        upright: z.array(str(40)).max(12).optional(),
        reversed: z.array(str(40)).max(12).optional(),
      })
      .strict()
      .optional(),
    yesNo: z.enum(["yes", "no", "maybe"]).optional(),
  })
  .strict();

const PersonaOverride = z
  .object({
    voice: str(9000).optional(),
    tagline: str(200).optional(),
    nameTh: str(60).optional(),
  })
  .strict();

const DocSchema = z
  .object({
    systemPrompt: str(24_000).optional(),
    personas: z.record(z.string(), PersonaOverride).optional(),
    cards: z.record(z.string(), CardOverride).optional(),
    // server เขียนทับเองเสมอ — ยอมรับตอน round-trip แต่ไม่ใช้ค่าจาก client
    updatedAt: z.number().optional(),
    updatedBy: z.string().max(120).optional(),
  })
  .strict();

/** GET /api/admin/content            → { doc, defaults: { systemCore, personas, cards:[{id,nameTh}] } }
 *  GET /api/admin/content?card=major-00 → { id, override, defaults:{ meanings, keywords, yesNo, nameTh } } */
export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const doc = (await kvGetJSON<ContentOverrideDoc>(KEY.contentOverride())) ?? {};
  const cardId = new URL(request.url).searchParams.get("card");

  if (cardId) {
    const card = cardById(cardId);
    if (!card) return NextResponse.json({ error: "ไม่พบไพ่นี้" }, { status: 404 });
    return NextResponse.json({
      id: card.id,
      nameTh: card.nameTh,
      override: doc.cards?.[card.id] ?? {},
      defaults: { meanings: card.meanings, keywords: card.keywords, yesNo: card.yesNo },
    });
  }

  return NextResponse.json({
    doc,
    defaults: {
      systemCore: SYSTEM_CORE_KNOWLEDGE,
      personas: PERSONAS.map((p) => ({
        id: p.id,
        nameTh: p.nameTh,
        tagline: p.tagline,
        voice: p.voice,
      })),
      cards: DECK.map((c) => ({ id: c.id, nameTh: c.nameTh, nameEn: c.nameEn })),
    },
  });
}

/** PUT /api/admin/content — เขียนทับเอกสาร override ทั้งก้อน (editor ส่งมาครบ) */
export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = DocSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", issues: parsed.error.issues.slice(0, 5) },
      { status: 400 },
    );
  }

  const clean: ContentOverrideDoc = {};

  const sp = parsed.data.systemPrompt?.trim();
  if (sp) clean.systemPrompt = sp;

  if (parsed.data.personas) {
    const personas: NonNullable<ContentOverrideDoc["personas"]> = {};
    for (const [id, o] of Object.entries(parsed.data.personas)) {
      if (!VALID_PERSONA_IDS.has(id)) {
        return NextResponse.json({ error: `persona id ไม่ถูกต้อง: ${id}` }, { status: 400 });
      }
      const entry: Record<string, string> = {};
      if (o.voice?.trim()) entry.voice = o.voice.trim();
      if (o.tagline?.trim()) entry.tagline = o.tagline.trim();
      if (o.nameTh?.trim()) entry.nameTh = o.nameTh.trim();
      if (Object.keys(entry).length) personas[id] = entry;
    }
    if (Object.keys(personas).length) clean.personas = personas;
  }

  if (parsed.data.cards) {
    const cards: NonNullable<ContentOverrideDoc["cards"]> = {};
    for (const [id, o] of Object.entries(parsed.data.cards)) {
      if (!VALID_CARD_IDS.has(id)) {
        return NextResponse.json({ error: `card id ไม่ถูกต้อง: ${id}` }, { status: 400 });
      }
      cards[id] = o;
    }
    if (Object.keys(cards).length) clean.cards = cards;
  }

  clean.updatedAt = Date.now();

  const size = JSON.stringify(clean).length;
  if (size > 200_000) {
    return NextResponse.json({ error: "เนื้อหารวมใหญ่เกิน 200KB" }, { status: 413 });
  }

  await kvPutJSON(KEY.contentOverride(), clean);
  invalidateMemo(KEY.contentOverride());

  const summary = [
    clean.systemPrompt ? "systemPrompt" : null,
    clean.personas ? `personas(${Object.keys(clean.personas).length})` : null,
    clean.cards ? `cards(${Object.keys(clean.cards).length})` : null,
  ]
    .filter(Boolean)
    .join(", ");
  await recordAudit("content_update", summary || "cleared");

  return NextResponse.json({ ok: true, updatedAt: clean.updatedAt, size });
}
