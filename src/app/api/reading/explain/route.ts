import { NextResponse } from "next/server";

import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { getContentOverrides, resolveCardByIndex } from "@/lib/content/overrides";
import { getSpread } from "@/data/spreads";
import { CARD_KEYWORDS_EN } from "@/data/cards/keywords-en";
import { THEME_LABEL, themesOf } from "@/data/cards/themes";
import type { Category, TarotCard } from "@/data/cards/types";
import { analyzeRelations } from "@/lib/tarot/relations";
import { CUSTOM_MAX_CARDS, CUSTOM_SPREAD_ID } from "@/lib/tarot/custom-spread";
import type { ExplainCard, ExplainResponse } from "@/lib/tarot/explain-types";

export const runtime = "nodejs";

/**
 * ✦ GET /api/reading/explain — "ทำไมแม่หมออ่านแบบนี้?" (แผน REFLECTION_JOURNAL_PLAN 1.2 · 1.6)
 * ---------------------------------------------------------------------------
 *   ?spread=<spreadId>&cards=12r,40,3&cat=love&lang=th
 *   cards = เลขไพ่ในสำรับ (0–77) เรียงตามลำดับตำแหน่ง · ต่อท้าย `r` = กลับหัว
 *
 * คืน "หลักฐานชุดเดียวกับที่แม่หมอ AI ได้รับ" — ความหมายไพ่ตามหมวด · ความหมายตำแหน่ง ·
 * ความเชื่อมโยงที่คำนวณได้ — **ไม่เรียก AI** และไม่มีข้อมูลส่วนตัวในคำขอ ➔ แคชที่ขอบได้
 * ความหมายอ่านผ่าน `resolveCardByIndex` ตัวเดียวกับ `/read` (รวมข้อความที่แอดมินแก้) ให้ตรงกับที่ AI เห็นจริง
 *
 * 🃏 กฎเหล็กข้อ 14: เลขไพ่ที่ไม่อยู่ในสำรับ/ซ้ำกัน/ผังไม่รู้จัก ➔ 400 พร้อมข้อความ "โหลดใหม่อีกครั้ง" ห้ามเดาไพ่แทน
 */

const CATEGORIES: readonly Category[] = ["general", "love", "work", "money", "self"];
const MAX_CARDS = 12;
const CACHE_OK = { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400" };
const NO_STORE = { "Cache-Control": "no-store" };

function bad(lang: "th" | "en", status = 400) {
  return NextResponse.json(
    {
      error:
        lang === "en"
          ? "Card data for this reading could not be found. Please reload."
          : "ไม่พบข้อมูลไพ่ของคำอ่านนี้ กรุณาโหลดใหม่อีกครั้ง",
    },
    { status, headers: NO_STORE },
  );
}

export async function GET(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return NextResponse.json({ error: "ไม่อนุญาตให้เข้าถึงจากภายนอก" }, { status: 403, headers: NO_STORE });
  }

  const url = new URL(request.url);
  const lang: "th" | "en" = url.searchParams.get("lang") === "en" ? "en" : "th";
  const isEn = lang === "en";
  const spreadParam = url.searchParams.get("spread") ?? "";
  /*
   * ✦ ผังที่สร้างเอง — เซิร์ฟเวอร์ไม่รู้ชื่อตำแหน่ง (ไม่รับข้อความของผู้ใช้ทาง URL ที่แคชที่ขอบ)
   * คืนช่องตำแหน่งว่าง แล้วหน้าเว็บเติมจากผังที่ตัวเองถืออยู่ (ส่วน `#pos=` ของลิงก์ ซึ่งไม่ถูกส่งมาที่เซิร์ฟเวอร์)
   */
  const isCustom = spreadParam === CUSTOM_SPREAD_ID;
  const spread = isCustom
    ? { positions: Array.from({ length: CUSTOM_MAX_CARDS }, () => ({ nameTh: "", nameEn: "", meaning: "", meaningEn: "" })) }
    : getSpread(spreadParam);
  const catParam = url.searchParams.get("cat") as Category | null;
  const category: Category = catParam && CATEGORIES.includes(catParam) ? catParam : "general";

  const tokens = (url.searchParams.get("cards") ?? "").split(",").filter(Boolean);
  if (!spread || tokens.length === 0 || tokens.length > MAX_CARDS || tokens.length > spread.positions.length) {
    return bad(lang);
  }

  const drawn: Array<{ cardIndex: number; isReversed: boolean }> = [];
  for (const t of tokens) {
    const m = /^(\d{1,2})(r?)$/.exec(t);
    if (!m) return bad(lang);
    drawn.push({ cardIndex: Number(m[1]), isReversed: m[2] === "r" });
  }
  if (new Set(drawn.map((d) => d.cardIndex)).size !== drawn.length) return bad(lang);

  const overrides = await getContentOverrides();
  const cards = drawn.map((d) => resolveCardByIndex(overrides, d.cardIndex));
  if (cards.some((c) => !c)) return bad(lang);
  const deck = cards as TarotCard[];

  const outCards: ExplainCard[] = deck.map((card, order) => {
    const { isReversed } = drawn[order];
    const pos = spread.positions[order];
    const thMeaning = card.meanings[category] ?? card.meanings.general;
    const enMeaning = card.meaningsEn?.[category] ?? card.meaningsEn?.general;
    const meaning = isEn
      ? (isReversed ? enMeaning?.reversed : enMeaning?.upright) ?? ""
      : isReversed
        ? thMeaning.reversed
        : thMeaning.upright;
    const kwEn = CARD_KEYWORDS_EN[card.id] ?? card.keywordsEn;
    const keywords = isEn
      ? (isReversed ? kwEn?.reversed : kwEn?.upright) ?? []
      : isReversed
        ? card.keywords.reversed
        : card.keywords.upright;
    return {
      order,
      cardId: card.id,
      name: isEn ? card.nameEn : card.nameTh,
      nameEn: card.nameEn,
      isReversed,
      keywords: [...keywords],
      meaning,
      position: {
        name: (isEn ? pos.nameEn : pos.nameTh) || pos.nameTh,
        meaning: (isEn ? pos.meaningEn : pos.meaning) || pos.meaning,
      },
      themes: themesOf(card.id, isReversed).map((t) => THEME_LABEL[t][lang]),
    };
  });

  const rel = analyzeRelations(deck.map((card, i) => ({ card, isReversed: drawn[i].isReversed })));
  const body: ExplainResponse = {
    cards: outCards,
    relations: {
      pairs: rel.pairs.map((p) => ({ a: p.a, b: p.b, kind: p.kind, note: isEn ? p.noteEn : p.noteTh, strength: p.strength })),
      clusters: rel.clusters.map((c) => ({ label: isEn ? c.labelEn : c.labelTh, positions: c.positions })),
      signals: rel.signals.map((s) => ({ id: s.id, note: isEn ? s.noteEn : s.noteTh, positions: s.positions })),
    },
  };
  return NextResponse.json(body, { headers: CACHE_OK });
}
