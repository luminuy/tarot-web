/**
 * scripts/qa/test-mock-reading.ts
 * ---------------------------------------------------------------------------
 * 🧪 ด่านตรวจ "คำอ่านสำรองออฟไลน์" (src/lib/ai/mock-reading.ts)
 *
 * คำอ่านสำรองถึงมือผู้ใช้จริงเมื่อไม่มีคีย์ AI หรือทุกโมเดลไม่ตอบเลยสักตัว
 * ก่อนหน้านี้ไม่มีด่านไหนตรวจมันเลยแม้แต่ด่านเดียว จึงหลุดไป 4 เรื่องพร้อมกัน:
 * ไทยล้วนทั้งที่ผู้ใช้อยู่หน้าอังกฤษ · ไม่ฟันธง ใช่/ไม่ใช่ · รองรับบุคลิกแค่ 3 จาก 5
 * · และไม่จดสถิติเลยจนแผงแอดมินมองไม่เห็นว่าเกิดบ่อยแค่ไหน
 *
 * ตรวจ:
 * 1. ครบทุกบุคลิกใน PERSONAS และสำนวนต้องไม่ซ้ำกัน (ไม่มีตัวไหนตกไปใช้ของ warm เงียบ ๆ)
 * 2. lang="en" ต้องไม่มีอักษรไทยหลุดสักตัวในทุก event และทุกฟิลด์ของคำอ่าน
 * 3. ผัง yesNoMode ต้องฟันธง ใช่/ไม่ใช่/ยังไม่แน่ และ summary ต้องไม่ขัดกับคำตอบ
 * 4. ผังปกติต้อง yesNoAnswer = null
 * 5. คำอ่านครบทุกใบ ชื่อไพ่ตรงกับไพ่ที่จั่ว และไม่มีไพ่นอกชุด (กฎเหล็กข้อ 14)
 * 6. ต้องจดสถิติ ai_mock_served ทุกครั้งที่เสิร์ฟ
 *
 * รันด้วย: npx tsx scripts/qa/test-mock-reading.ts
 */

import fs from "node:fs";
import path from "node:path";

import { DECK, cardByIndex } from "../../src/data/cards";
import { getSpread } from "../../src/data/spreads";
import { PERSONAS } from "../../src/data/personas";
import { streamMockGeminiReading } from "../../src/lib/ai/mock-reading";
import { checkReadingConsistency } from "../../src/lib/ai/consistency";
import type { ReadingEvent } from "../../src/lib/ai/types";
import { YES_NO_DISPLAY_EN, type Reading } from "../../src/lib/schema/reading";

let passed = 0;
let failed = 0;

function check(title: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${title}`);
  } else {
    failed++;
    console.error(`  ❌ ${title}${detail ? ` — ${detail}` : ""}`);
  }
}

const THAI = /[฀-๿]/;

function buildCtx(opts: { spreadId: string; lang: "th" | "en"; personaId: string }) {
  const spread = getSpread(opts.spreadId)!;
  const drawn = spread.positions.map((_, i) => ({
    order: i,
    cardIndex: (i * 11 + 3) % 78,
    isReversed: i % 2 === 1,
  }));
  return {
    personaId: opts.personaId,
    spread,
    category: spread.defaultCategory,
    question: opts.lang === "en" ? "How will the months ahead unfold for me?" : "ช่วงนี้ชีวิตจะเป็นอย่างไร",
    intake: {},
    nickname: undefined,
    drawn,
    cards: drawn.map((d) => cardByIndex(d.cardIndex)!),
    safety: { flag: "none" as const, block: false },
    pastReading: undefined,
    lang: opts.lang,
  } satisfies Parameters<typeof streamMockGeminiReading>[0];
}

async function collect(ctx: Parameters<typeof streamMockGeminiReading>[0]) {
  const events: ReadingEvent[] = [];
  for await (const ev of streamMockGeminiReading(ctx)) events.push(ev);
  const done = events.find((e) => e.type === "done") as Extract<ReadingEvent, { type: "done" }> | undefined;
  return { events, reading: done?.reading as Reading | undefined, usage: done?.usage };
}

async function run() {
  console.log("══════════════════════════════════════════════════════════════════");
  console.log("🔮 [QA] คำอ่านสำรองออฟไลน์ (Mock Reading Fallback)");
  console.log("══════════════════════════════════════════════════════════════════\n");

  // ── 1. ครบทุกบุคลิก และสำนวนไม่ซ้ำกัน ──────────────────────────────
  console.log("🎭 1. รองรับครบทุกบุคลิกใน PERSONAS");
  for (const lang of ["th", "en"] as const) {
    const openings = new Map<string, string>();
    for (const persona of PERSONAS) {
      const { reading } = await collect(buildCtx({ spreadId: "three-card", lang, personaId: persona.id }));
      openings.set(persona.id, reading?.opening ?? "");
    }
    const unique = new Set(openings.values());
    check(
      `[${lang}] บทเปิดของทั้ง ${PERSONAS.length} บุคลิกต่างกันหมด`,
      unique.size === PERSONAS.length,
      `ซ้ำกัน ${PERSONAS.length - unique.size} ตัว (${[...openings].map(([id]) => id).join(", ")})`,
    );
    check(`[${lang}] ไม่มีบุคลิกไหนได้บทเปิดว่าง`, [...openings.values()].every((t) => t.length > 20));
  }

  // บุคลิกที่ไม่รู้จักต้องถอยไปใช้ warm ได้โดยไม่ล้ม
  const unknown = await collect(buildCtx({ spreadId: "three-card", lang: "th", personaId: "ไม่มีบุคลิกนี้" }));
  check("บุคลิกที่ไม่รู้จัก → ถอยไปใช้สำนวนเริ่มต้นได้ ไม่ล้ม", Boolean(unknown.reading?.opening));

  // ── 2. ภาษาอังกฤษต้องไม่มีอักษรไทยหลุด ─────────────────────────────
  console.log("\n🌐 2. หน้าอังกฤษต้องไม่มีอักษรไทยหลุด");
  for (const spreadId of ["daily", "yes-no", "three-card", "celtic-cross", "year-ahead"]) {
    for (const persona of PERSONAS) {
      const { events, reading } = await collect(buildCtx({ spreadId, lang: "en", personaId: persona.id }));
      const blob = JSON.stringify({ events, reading });
      // mood เป็น enum ภายในที่ไม่ได้แสดงผล ส่วน yesNoAnswer ถูกบังคับให้เป็นค่าไทยโดย
      // ReadingSchema (ฝั่งแสดงผลแปลงผ่าน YES_NO_DISPLAY_EN) — สองคีย์นี้จึงยกเว้นให้
      const scanned = blob
        .replace(/"mood":"[^"]*"/g, '"mood":""')
        .replace(/"yesNoAnswer":"[^"]*"/g, '"yesNoAnswer":""');
      const leak = scanned.match(THAI);
      check(
        `[en · ${spreadId} · ${persona.id}] ไม่มีอักษรไทยในคำอ่าน`,
        !leak,
        leak ? `พบ "${scanned.slice(Math.max(0, (leak.index ?? 0) - 40), (leak.index ?? 0) + 40)}"` : undefined,
      );
      check(`[en · ${spreadId} · ${persona.id}] มี timing ภาษาอังกฤษ`, Boolean(reading?.timing && !THAI.test(reading.timing)));
    }
  }

  // ── 3. โหมดฟันธง ใช่/ไม่ใช่ ────────────────────────────────────────
  console.log("\n⚖️ 3. ผัง yes-no ต้องฟันธงได้จริง");
  for (const lang of ["th", "en"] as const) {
    const ctx = buildCtx({ spreadId: "yes-no", lang, personaId: "warm" });
    const { reading } = await collect(ctx);
    check(`[${lang}] yesNoAnswer ไม่เป็น null`, Boolean(reading?.yesNoAnswer));
    check(
      `[${lang}] yesNoAnswer เป็นค่าที่ schema ยอมรับ`,
      ["ใช่", "ไม่ใช่", "ยังไม่แน่"].includes(reading?.yesNoAnswer ?? ""),
      String(reading?.yesNoAnswer),
    );
    const consistency = checkReadingConsistency(reading!, ctx.cards, {
      drawnCount: ctx.drawn.length,
      yesNoMode: true,
      pastReading: undefined,
    });
    const contradiction = consistency.issues.find((i) => i.code === "YESNO_CONTRADICTION");
    check(`[${lang}] summary ไม่ขัดแย้งกับคำตอบที่ฟันธง`, !contradiction, contradiction?.message);
  }

  // คำตอบต้องมาจากค่า yesNo ของไพ่จริง ไม่ใช่ค่าคงที่ — ยิงหลายชุดต้องได้คำตอบต่างกันบ้าง
  const answers = new Set<string>();
  for (let shift = 0; shift < 26; shift++) {
    const spread = getSpread("yes-no")!;
    const drawn = spread.positions.map((_, i) => ({ order: i, cardIndex: (i * 3 + shift) % 78, isReversed: false }));
    const ctx = {
      ...buildCtx({ spreadId: "yes-no", lang: "th", personaId: "warm" }),
      drawn,
      cards: drawn.map((d) => cardByIndex(d.cardIndex)!),
    } as Parameters<typeof streamMockGeminiReading>[0];
    const { reading } = await collect(ctx);
    answers.add(reading?.yesNoAnswer ?? "");
  }
  check("คำตอบผันตามไพ่ที่จั่วจริง (ไม่ใช่ค่าคงที่)", answers.size >= 2, `ได้ ${[...answers].join(" / ")}`);

  // ── 4. ผังปกติต้องไม่มีคำตอบ ใช่/ไม่ใช่ ─────────────────────────────
  console.log("\n🚫 4. ผังปกติต้องไม่ฟันธง ใช่/ไม่ใช่");
  for (const spreadId of ["daily", "three-card", "celtic-cross"]) {
    const { reading } = await collect(buildCtx({ spreadId, lang: "th", personaId: "warm" }));
    check(`[${spreadId}] yesNoAnswer = null`, reading?.yesNoAnswer == null, String(reading?.yesNoAnswer));
  }

  // ── 5. ความครบถ้วนของไพ่ (กฎเหล็กข้อ 14) ───────────────────────────
  console.log("\n🃏 5. ไพ่ครบและตรงกับที่จั่วจริง");
  for (const spreadId of ["daily", "three-card", "celtic-cross", "year-ahead"]) {
    for (const lang of ["th", "en"] as const) {
      const ctx = buildCtx({ spreadId, lang, personaId: "mystic" });
      const { reading, usage } = await collect(ctx);
      check(`[${lang} · ${spreadId}] คำอ่านครบ ${ctx.drawn.length} ใบ`, reading?.cards.length === ctx.drawn.length);
      const names = ctx.cards.map((c) => (lang === "en" ? c.nameEn : c.nameTh));
      check(
        `[${lang} · ${spreadId}] ชื่อไพ่ในคำอ่านตรงทุกตำแหน่ง`,
        (reading?.cards ?? []).every((c, i) => c.headline.includes(names[i])),
      );
      const consistency = checkReadingConsistency(reading!, ctx.cards, {
        drawnCount: ctx.drawn.length,
        yesNoMode: false,
        pastReading: undefined,
      });
      const foreign = consistency.issues.find((i) => i.code === "FOREIGN_CARD" || i.code === "MISSING_POSITION" || i.code === "DUPLICATE_POSITION");
      check(`[${lang} · ${spreadId}] ไม่มีไพ่นอกชุดที่จั่วจริง`, !foreign, foreign?.message);
      check(
        `[${lang} · ${spreadId}] usage = 0 (ระบบต้องไม่นับเป็นคำอ่านจริงและไม่หักสิทธิ์)`,
        (usage?.inputTokens ?? 0) === 0 && (usage?.outputTokens ?? 0) === 0,
      );
    }
  }

  // ── 6. ต้องจดสถิติทุกครั้งที่เสิร์ฟ ─────────────────────────────────
  console.log("\n📊 6. สถิติสำหรับแผงแอดมิน");
  const mockSrc = fs.readFileSync(path.resolve("src/lib/ai/mock-reading.ts"), "utf8");
  check('เรียก recordEvents("ai_mock_served")', /recordEvents\(\[[\s\S]*?"ai_mock_served"/.test(mockSrc));
  check("แยกสถิติตามสาเหตุ (no_api_key / all_models_down)", /ai_mock_served:\$\{reason\}/.test(mockSrc));
  // ── 6.5 คำฟันธงต้องถูกแปลก่อนแสดงผลฝั่งอังกฤษ ──────────────────────
  console.log("\n🔤 6.5 คำฟันธงฝั่งอังกฤษต้องถูกแปลก่อนแสดงผล");
  check(
    "YES_NO_DISPLAY_EN ครอบคลุมครบทั้ง 3 ค่าของ schema",
    ["ใช่", "ไม่ใช่", "ยังไม่แน่"].every((k) => Boolean(YES_NO_DISPLAY_EN[k]) && !THAI.test(YES_NO_DISPLAY_EN[k])),
  );
  const readerSrc = fs.readFileSync(path.resolve("src/components/reading/StreamReader.tsx"), "utf8");
  check(
    "StreamReader ใช้ YES_NO_DISPLAY_EN แทนการพิมพ์ค่าดิบในหน้าอังกฤษ",
    /YES_NO_DISPLAY_EN\[reading\.yesNoAnswer\]/.test(readerSrc),
  );

  const geminiSrc = fs.readFileSync(path.resolve("src/lib/ai/gemini.ts"), "utf8");
  const callSites = geminiSrc.match(/streamMockGeminiReading\(ctx[^)]*\)/g) ?? [];
  check(
    `ทุกจุดที่เรียกคำอ่านสำรองส่งสาเหตุมาด้วย (${callSites.length} จุด)`,
    callSites.length >= 2 && callSites.every((c) => /"(no_api_key|all_models_down)"/.test(c)),
    callSites.join(" | "),
  );

  // ── สรุป ────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════════════════════════════");
  console.log(`ผลรวม: ✅ ${passed} ผ่าน · ❌ ${failed} ตก (ไพ่ในสำรับ ${DECK.length} ใบ)`);
  console.log("══════════════════════════════════════════════════════════════════");
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error("💥 ด่านตรวจล้มเหลวด้วยข้อผิดพลาด:", err);
  process.exit(1);
});
