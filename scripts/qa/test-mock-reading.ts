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

  // ── 7. ผลตรวจ 2026-09-23 — ท่อ AI กลางของหน้า one-card / pick-a-card / birth-card ──
  console.log("\n🧯 7. ท่อสตรีมกลาง (useAiReading) และพิธีไพ่ใบเดียว");
  const hookSrc = fs.readFileSync(path.resolve("src/lib/reading/use-ai-reading.ts"), "utf8");
  check(
    'A3-01: useAiReading ฟัง event "error" จากเซิร์ฟเวอร์ (ไม่ตกไป default แล้วค้าง streaming)',
    /case\s+"error"\s*:[\s\S]{0,200}?type:\s*"fail"/.test(hookSrc),
  );
  check(
    "A3-01: สตรีมปิดโดยไม่มี done/error ต้องขึ้นข้อความผิดพลาด (ด่าน gotTerminal)",
    /if\s*\(\s*!gotTerminal\s*\)\s*\{[\s\S]{0,120}?type:\s*"fail"/.test(hookSrc),
  );
  const ritualSrc = fs.readFileSync(path.resolve("src/components/reading/one-card/OneCardRitual.tsx"), "utf8");
  check(
    "A3-02: OneCardRitual อ่านทิศไพ่จากเซิร์ฟเวอร์ (rawDrawn[0].isReversed)",
    /rawDrawn\[0\]\?\.isReversed/.test(ritualSrc),
  );
  check(
    "A3-02: ไพ่ที่เปิดแล้วส่ง isReversed ให้ TarotCard และห้ามใช้ keywords.upright ตายตัว",
    /isReversed=\{drawnReversed\}/.test(ritualSrc) && !/keywords\?\.upright/.test(ritualSrc),
  );
  for (const client of ["src/components/daily/DailyClient.tsx", "src/components/love/LoveOneCardClient.tsx"]) {
    const src = fs.readFileSync(path.resolve(client), "utf8");
    check(`A3-02: ${client} บันทึกทิศจริงลงประวัติ (ไม่ใช่ isReversed: false ตายตัว)`, !/isReversed:\s*false/.test(src));
  }

  // ── 8. ผลตรวจ 2026-09-23 คลื่น 3 — API คำทำนาย ───────────────────────
  console.log("\n🛡️ 8. API คำทำนาย (A2)");
  const readRouteSrc = fs.readFileSync(path.resolve("src/app/api/reading/[id]/read/route.ts"), "utf8");
  check(
    "A2-01: คำอ่านสำรอง (usage = 0) ไม่ถูกบันทึกเป็นผลถาวร",
    /const completed = realReading\s*\?\s*updateReading\(id, \{ status: "COMPLETED", result: event\.reading \}\)/.test(readRouteSrc),
  );
  const chatSrc = fs.readFileSync(path.resolve("src/app/api/reading/[id]/chat/route.ts"), "utf8");
  check(
    "A2-03: แชทต่อยอดใส่ promptGuard (สุขภาพ/กฎหมาย/พนัน/บุคคลที่สาม) ลง prompt ทั้งสองภาษา",
    /safetyVerdict\.promptGuard \|\| record\.safetyGuard/.test(chatSrc) && (chatSrc.match(/\$\{guardSection\}/g) ?? []).length === 2,
  );
  {
    const { POST: clarify } = await import("../../src/app/api/reading/clarify/route");
    const res = await clarify(
      new Request("https://seertarot.net/api/reading/clarify", {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net" },
        body: JSON.stringify({ question: "อยากตาย ควรทำยังไงดี", lang: "th" }),
      }),
    );
    const body = (await res.json()) as { needsClarification?: boolean; skipped?: boolean };
    check("A2-04: คำถามวิกฤตไม่ถูกส่งไปสร้างคำถามกลับ (ไหลเข้า /start ที่แสดงสายด่วนทันที)", body.needsClarification === false && body.skipped === true);
    const clarifySrc = fs.readFileSync(path.resolve("src/app/api/reading/clarify/route.ts"), "utf8");
    check("A2-04: clarify เรียก checkQuestion ก่อน evaluateClarification", clarifySrc.indexOf("checkQuestion(") > 0 && clarifySrc.indexOf("checkQuestion(") < clarifySrc.indexOf("await evaluateClarification("));
  }
  const dailySrc = fs.readFileSync(path.resolve("src/app/api/daily-card/route.ts"), "utf8");
  check(
    "A2-06: /api/daily-card ไม่มี max-age=3600 หรือ SWR 86400 ตายตัวข้ามเที่ยงคืน",
    /"Cache-Control": `public, max-age=\$\{browserMaxAge\}, s-maxage=\$\{secondsUntilMidnight\}, stale-while-revalidate=\$\{swr\}`/.test(dailySrc) &&
      !/stale-while-revalidate=86400/.test(dailySrc.replace(/\/\*[\s\S]*?\*\//g, "")),
  );
  const stripSrc = fs.readFileSync(path.resolve("src/components/reading/DailyCardStrip.tsx"), "utf8");
  check("A2-06: DailyCardStrip ตรวจ dateKey ของข้อมูลก่อนจำลงเครื่อง", /d\.dateKey === today/.test(stripSrc));
  {
    const { readWithIdleTimeout, StreamIdleTimeoutError } = await import("../../src/lib/ai/abort");
    const stalled = new ReadableStream<Uint8Array>({ start() {} }).getReader();
    let idleErr: unknown = null;
    await readWithIdleTimeout(stalled, { idleMs: 50 }).catch((e) => (idleErr = e));
    check("A2-15: สตรีมค้างเกินเพดานถูกตัดด้วย StreamIdleTimeoutError", idleErr instanceof StreamIdleTimeoutError);
    const ac = new AbortController();
    const stalled2 = new ReadableStream<Uint8Array>({ start() {} }).getReader();
    const pending = readWithIdleTimeout(stalled2, { idleMs: 5000, signal: ac.signal }).catch((e) => e as Error);
    ac.abort();
    const abortErr = await pending;
    check("A2-15: ลูกค้าปิดแท็บกลางสตรีมแล้วเลิกอ่านทันที (AbortError)", (abortErr as Error)?.name === "AbortError");
    for (const f of ["src/lib/ai/gemini.ts", "src/lib/ai/groq.ts"]) {
      const src = fs.readFileSync(path.resolve(f), "utf8");
      check(`A2-15: ${f} อ่านสตรีมผ่าน readWithIdleTimeout (ไม่มี reader.read() เปล่า)`, /readWithIdleTimeout\(reader/.test(src) && !/await reader\.read\(\)/.test(src));
    }
  }

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
