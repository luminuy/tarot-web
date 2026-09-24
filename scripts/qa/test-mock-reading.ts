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
 * 7. (ยกเครื่อง 2026-09-24) น้ำเสียงต้องตรงกับไพ่: ไพ่ที่ไม่ใช่ขั้วหนุนห้ามถูกเขียนว่าเป็นแรงหนุน
 *    · บทเปิด/สรุปอิงไพ่จริง · หาไพ่ปลายทางจากชื่อช่อง · ผังใบเดียวไม่ขึ้น "ทั้ง 1 ใบ"
 *    · ไม่มีวงเล็บติดอักษรไทย · ข้อสุดท้ายของคำแนะนำเป็นฝึกสติ 🧘 · ไพ่ชุดเดิมได้คำอ่านเดิม
 *
 * รันด้วย: npx tsx scripts/qa/test-mock-reading.ts
 */

import fs from "node:fs";
import path from "node:path";

import { DECK, cardByIndex } from "../../src/data/cards";
import { getSpread } from "../../src/data/spreads";
import { PERSONAS } from "../../src/data/personas";
import { mockCardTone, streamMockGeminiReading } from "../../src/lib/ai/mock-reading";
import { READING_INITIAL, readingReducer } from "../../src/components/home/flow-reading";
import { buildOfflineMonthlySummary } from "../../src/lib/journal/monthly-offline";
import { buildOfflineChatReply, detectChatIntent } from "../../src/lib/ai/chat-fallback";
import type { SavedReadingItem } from "../../src/lib/utils/history";
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
    callSites.length >= 3 && callSites.every((c) => /"(no_api_key|all_models_down|incomplete_output)"/.test(c)),
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

  // ── 7. คุณภาพเนื้อหา (ยกเครื่อง 2026-09-24) ───────────────────────────
  console.log("\n✦ 7. น้ำเสียงตรงกับไพ่ · อิงไพ่จริง · ภาษาลื่น");
  const LIGHT_MARK: Record<"th" | "en", RegExp> = {
    th: /แรงหนุน|เปิดทางให้|ส่งสัญญาณดี|เกื้อหนุนอย่างเด่นชัด/,
    en: /source of support|opens the way|sends a good signal/,
  };
  const dailySpread = getSpread("daily")!;
  for (const lang of ["th", "en"] as const) {
    const bad: string[] = [];
    for (let idx = 0; idx < DECK.length; idx++) {
      for (const isReversed of [false, true]) {
        const card = cardByIndex(idx)!;
        const ctx = {
          ...buildCtx({ spreadId: "daily", lang, personaId: "warm" }),
          spread: dailySpread,
          drawn: [{ order: 0, cardIndex: idx, isReversed }],
          cards: [card],
        };
        const { reading } = await collect(ctx);
        const text = reading?.cards[0]?.reading ?? "";
        if (mockCardTone(card, isReversed) !== "light" && LIGHT_MARK[lang].test(text)) {
          bad.push(`${card.id}${isReversed ? "(R)" : ""}`);
        }
      }
    }
    check(
      `[${lang}] ไพ่ที่ไม่ใช่ขั้วหนุนไม่ถูกเขียนว่าเป็นแรงหนุน (78 ใบ × หัวตั้ง/กลับหัว)`,
      bad.length === 0,
      bad.slice(0, 8).join(", "),
    );
  }
  const tenSwords = DECK.find((c) => c.id === "swords-10")!;
  const tower = DECK.find((c) => c.id === "major-16")!;
  check("สิบแห่งดาบหัวตั้ง ไม่ถูกนับเป็นไพ่หนุน (บั๊กเดิม: \"สัญญาณเกื้อหนุนอย่างเด่นชัด\")", mockCardTone(tenSwords, false) !== "light");
  check("หอคอยกลับหัว ไม่ถูกนับเป็นไพ่หนุน (ไพ่ร้ายกลับหัวไม่ได้แปลว่าดี)", mockCardTone(tower, true) !== "light");

  // บทเปิด/บทสรุปต้องเปลี่ยนตามไพ่ ไม่ใช่ประโยคเหมารวม
  const withCards = (indices: number[], spreadId = "three-card", lang: "th" | "en" = "th") => {
    const base = buildCtx({ spreadId, lang, personaId: "warm" });
    const drawn = indices.map((cardIndex, order) => ({ order, cardIndex, isReversed: false }));
    return { ...base, drawn, cards: drawn.map((d) => cardByIndex(d.cardIndex)!) };
  };
  const idxOf = (id: string) => DECK.findIndex((c) => c.id === id);
  const bright = await collect(withCards([idxOf("major-19"), idxOf("cups-10"), idxOf("major-21")]));
  const heavy = await collect(withCards([idxOf("swords-10"), idxOf("swords-03"), idxOf("swords-09")]));
  check("บทเปิดต่างกันเมื่อไพ่ต่างกัน (ไม่ใช่ประโยคเหมารวม)", bright.reading?.opening !== heavy.reading?.opening);
  check("บทสรุปต่างกันเมื่อไพ่ต่างกัน", bright.reading?.summary !== heavy.reading?.summary);
  check(
    "บทสรุปผัง 3 ใบพูดถึงไพ่ปลายทาง (ใบในช่องอนาคต) ด้วยชื่อจริง",
    Boolean(bright.reading?.summary.includes(cardByIndex(idxOf("major-21"))!.nameTh)),
  );
  check("ไม่มีประโยคเหมารวมเดิม \"ทุกอย่างมีทางออกที่ดีเสมอ\"", !/ทุกอย่างมีทางออกที่ดีเสมอ/.test(JSON.stringify(heavy.reading)));

  // ผังใช่/ไม่ใช่: ใบสุดท้ายคือ "ข้อควรระวัง" ห้ามถูกเรียกว่าปลายทาง
  const yn = await collect(buildCtx({ spreadId: "yes-no", lang: "th", personaId: "warm" }));
  const ynLastPos = getSpread("yes-no")!.positions.at(-1)!;
  check(
    "ผังใช่/ไม่ใช่ ไม่เรียกช่องสุดท้าย (ข้อควรระวัง) ว่าเป็นปลายทาง",
    !new RegExp(`ปลายทางของเรื่องนี้คือ[^ ]*[^ ]*ในช่อง${ynLastPos.nameTh.replace(/^\d+\.\s*/, "").replace(/\s*\(.*\)$/, "")}`).test(yn.reading?.summary ?? ""),
    yn.reading?.summary,
  );

  // ผังใบเดียว · วงเล็บติดไทย · ฝึกสติ · ผลซ้ำได้
  for (const lang of ["th", "en"] as const) {
    const one = await collect(buildCtx({ spreadId: "daily", lang, personaId: "mystic" }));
    check(`[${lang}] ผังใบเดียวไม่ขึ้น "ทั้ง 1 ใบ" / "all 1 cards"`, !/ทั้ง 1 ใบ|all 1 cards/i.test(one.reading?.opening ?? ""), one.reading?.opening);
    for (const spreadId of ["three-card", "celtic-cross", "yes-no"]) {
      const ctx = buildCtx({ spreadId, lang, personaId: "warm" });
      const a = await collect(ctx);
      const b = await collect(ctx);
      check(`[${lang} · ${spreadId}] ไพ่ชุดเดิมได้คำอ่านเดิม (ไม่สุ่ม)`, JSON.stringify(a.reading) === JSON.stringify(b.reading));
      const last = a.reading?.advice.at(-1) ?? "";
      check(`[${lang} · ${spreadId}] ข้อสุดท้ายของคำแนะนำเป็นฝึกสติ 🧘`, last.includes("🧘"));
      const issues = checkReadingConsistency(a.reading!, ctx.cards, {
        drawnCount: ctx.drawn.length,
        yesNoMode: Boolean(ctx.spread.yesNoMode),
        pastReading: undefined,
      }).issues.map((i) => i.code);
      check(`[${lang} · ${spreadId}] ผ่านตัวตรวจความสอดคล้องไม่มีข้อเตือน`, issues.length === 0, issues.join(","));
      if (lang === "th") {
        const glued = JSON.stringify(a.reading).match(/\)[\u0E00-\u0E7F]/);
        check(`[th · ${spreadId}] ไม่มีวงเล็บติดอักษรไทย`, !glued, glued?.[0]);
      }
    }
  }

  // ── 8. ผู้ใช้ต้องรู้ว่าเป็นคำอ่านสำรอง + กดให้ AI อ่านใหม่ได้ ───────────────
  console.log("\n🪧 8. ป้ายบอกคำอ่านสำรอง (FallbackNotice)");
  const routeSrc = fs.readFileSync(path.resolve("src/app/api/reading/[id]/read/route.ts"), "utf8");
  check("route ส่ง fallback: !realReading ไปกับเฟรม done", /fallback:\s*!realReading/.test(routeSrc));
  const afterFallback = [{ type: "start" as const }, { type: "done" as const, reading: {}, fallback: true }].reduce(
    readingReducer,
    READING_INITIAL,
  );
  check("ตัวลดสถานะจำ fallback = true เมื่อเฟรม done บอกมา", afterFallback.fallback === true);
  check("กดอ่านใหม่ (start) ล้าง fallback ทิ้ง ไม่ค้างป้ายเก่า", readingReducer(afterFallback, { type: "start" }).fallback === false);
  check(
    "เฟรม done ปกติ (ไม่มี fallback) ไม่ขึ้นป้าย",
    [{ type: "start" as const }, { type: "done" as const, reading: {} }].reduce(readingReducer, READING_INITIAL).fallback === false,
  );
  for (const f of [
    "src/components/reading/StreamReader.tsx",
    "src/components/reading/QuickChatResult.tsx",
    "src/components/reading/ai/AiReadingPanel.tsx",
  ]) {
    check(`${f} แสดง FallbackNotice`, /<FallbackNotice\b/.test(fs.readFileSync(path.resolve(f), "utf8")));
  }
  const flowSrc = fs.readFileSync(path.resolve("src/components/home/TarotFlow.tsx"), "utf8");
  check("TarotFlow ส่ง isFallback ให้หน้าแสดงผลทั้งสองแบบ", (flowSrc.match(/isFallback=\{read\.fallback\}/g) ?? []).length === 2);
  check("TarotFlow อ่าน data.fallback จากเฟรม done", /type: "done", reading: data\.reading, fallback: data\.fallback === true/.test(flowSrc));
  const aiHookSrc = fs.readFileSync(path.resolve("src/lib/reading/use-ai-reading.ts"), "utf8");
  check("useAiReading อ่าน payload.fallback จากเฟรม done", /fallback: payload\.fallback === true/.test(aiHookSrc));

  // ── 9. สรุปบทเรียนประจำเดือนแบบออฟไลน์ (AI ไม่ว่าง) ─────────────────────
  console.log("\n📅 9. สรุปประจำเดือนแบบออฟไลน์");
  const mkEntry = (i: number, category: string, cards: Array<[number, boolean]>, outcome: SavedReadingItem["outcome"]): SavedReadingItem =>
    ({
      id: `j${i}`,
      date: new Date(Date.UTC(2026, 8, i + 1)).toISOString(),
      question: "คำถามทดสอบ",
      spreadId: "three-card",
      spreadName: "อดีต ปัจจุบัน อนาคต",
      category,
      personaId: "warm",
      personaName: "แม่หมอใจดี",
      cards: cards.map(([cardIndex, isReversed], order) => ({
        order,
        positionName: `ตำแหน่ง ${order + 1}`,
        cardIndex,
        cardNameTh: cardByIndex(cardIndex)?.nameTh ?? "",
        isReversed,
      })),
      summary: "สรุปทดสอบ",
      advice: [],
      outcome,
    }) as SavedReadingItem;
  const towerIdx = DECK.findIndex((c) => c.id === "major-16");
  const cups2 = DECK.findIndex((c) => c.id === "cups-02");
  const journalA = [
    mkEntry(0, "love", [[towerIdx, false], [cups2, false]], "ACCURATE"),
    mkEntry(1, "love", [[towerIdx, true], [cups2, false]], "PARTIAL"),
    mkEntry(2, "work", [[towerIdx, false], [9999, false]], "PENDING"), // ไพ่นอกสำรับ ต้องถูกข้าม
  ];
  const monthA = buildOfflineMonthlySummary(journalA);
  check("สรุปออฟไลน์ติดธง fallback ให้หน้าเว็บบอกผู้ใช้", monthA.fallback === true);
  check(
    "สรุปออฟไลน์อ้างไพ่ที่ออกซ้ำจริงพร้อมจำนวนครั้ง",
    monthA.synthesis.includes(`${DECK[towerIdx].nameTh} (3 ครั้ง)`) && monthA.recurringCards[0]?.startsWith(DECK[towerIdx].nameTh),
    monthA.synthesis,
  );
  check("สรุปออฟไลน์บอกหมวดที่ถามบ่อยจริง", monthA.synthesis.includes("หมวดความรัก (2 ครั้ง)"), monthA.synthesis);
  check("สรุปออฟไลน์นับผลจริงที่ผู้ใช้บันทึก", monthA.accurateReadings === 2 && monthA.synthesis.includes("บันทึกผลจริงไว้ 2 ครั้ง"));
  check("ไพ่นอกสำรับถูกข้าม ไม่เดาใบแทน (กฎเหล็กข้อ 14)", !JSON.stringify(monthA).includes("undefined"));
  const monthB = buildOfflineMonthlySummary([mkEntry(0, "money", [[cups2, false]], "PENDING")]);
  check("ประวัติต่างกันได้สรุปต่างกัน (ไม่ใช่ประโยคเหมารวม)", monthA.synthesis !== monthB.synthesis && monthA.title !== monthB.title);
  check("ประวัติที่ไม่มีไพ่เลยก็ไม่ล้ม", Boolean(buildOfflineMonthlySummary([mkEntry(0, "self", [], "PENDING")]).synthesis));
  const monthlySrc = fs.readFileSync(path.resolve("src/app/api/journal/monthly-summary/route.ts"), "utf8");
  check(
    "route สรุปรายเดือนไม่เหลือประโยคเหมารวมเดิม",
    !/เคลื่อนเข้าสู่จุดเปลี่ยนที่สำคัญ|ความเข้าใจตนเองคือกุญแจสู่ทุกทางออก|โชคชะตาอยู่ในมือของคุณเสมอ/.test(monthlySrc),
  );
  check(
    "route สรุปรายเดือนใช้สรุปออฟไลน์ทั้งตอนไม่มีคีย์ · งบ AI เต็ม · โมเดลล่ม · ตอบใช้ไม่ได้",
    ["no_api_key", "ai_cap", "models_down", "unusable_output"].every((r) => monthlySrc.includes(r)) &&
      !monthlySrc.includes("ทุกโมเดล Gemini เรียกไม่สำเร็จ"),
  );
  const historySrc = fs.readFileSync(path.resolve("src/components/history/ReadingHistoryModal.tsx"), "utf8");
  check("หน้าประวัติบอกผู้ใช้เมื่อสรุปรายเดือนไม่ได้มาจาก AI", /monthlySummary\.fallback &&/.test(historySrc));

  // สองภาษา — ผู้ใช้หน้าอังกฤษต้องได้สรุปอังกฤษทั้งฉบับ ไม่มีอักษรไทยหลุดมาสักตัว
  const thaiChar = /[฀-๿]/;
  const enJournals = [
    journalA,
    [mkEntry(0, "money", [[cups2, false]], "PENDING")],
    [mkEntry(0, "self", [], "PENDING")],
    // ธาตุเสมอกันสองธาตุ + ไพ่กลับหัวเยอะ + ผลยังไม่เกิดขึ้น
    [
      mkEntry(0, "general", [[towerIdx, true], [cups2, true]], "NOT_HAPPENED"),
      mkEntry(1, "decision", [[towerIdx, true], [cups2, false]], "NOT_HAPPENED"),
    ],
  ];
  const enMonths = enJournals.map((j) => buildOfflineMonthlySummary(j, "en"));
  check(
    "สรุปออฟไลน์ภาษาอังกฤษไม่มีอักษรไทยหลุดสักช่อง (ครบ 4 แบบประวัติ)",
    enMonths.every((m) => !thaiChar.test(JSON.stringify(m))),
    enMonths.map((m) => m.synthesis).find((s) => thaiChar.test(s)),
  );
  const monthAEn = enMonths[0];
  check(
    "สรุปอังกฤษอ้างไพ่ออกซ้ำด้วยชื่ออังกฤษ + คำสำคัญอังกฤษ",
    monthAEn.synthesis.includes(`${DECK[towerIdx].nameEn} (3 times)`) &&
      monthAEn.synthesis.includes(`"${DECK[towerIdx].keywordsEn!.upright[0]}"`) &&
      monthAEn.recurringCards[0] === `${DECK[towerIdx].nameEn} (3 times)`,
    monthAEn.synthesis,
  );
  check("สรุปอังกฤษบอกหมวดที่ถามบ่อย", monthAEn.synthesis.includes("was love (2 times)"), monthAEn.synthesis);
  check("สรุปอังกฤษนับผลจริง", monthAEn.synthesis.includes("Of the 2 outcomes you recorded, 2 came true"), monthAEn.synthesis);
  check("ธาตุเด่นคืนเป็นภาษาที่ขอ", monthA.dominantElement === "ไฟ" && monthAEn.dominantElement === "Fire");
  check("ธาตุเสมอ = Balanced + บอกธาตุที่เสมอตามจริง", enMonths[3].dominantElement === "Balanced" && /Fire and Water showed up equally/.test(enMonths[3].synthesis), enMonths[3].synthesis);
  check(
    'หมวดเสมอกัน/ถามครั้งเดียว ไม่เคลมว่า "บ่อยที่สุด" ทั้งสองภาษา',
    !/asked about most/.test(enMonths[3].synthesis) &&
      !/ถามบ่อยที่สุด/.test(buildOfflineMonthlySummary(enJournals[3]).synthesis) &&
      !/ถามบ่อยที่สุด/.test(monthB.synthesis),
    enMonths[3].synthesis,
  );
  check("ไม่ระบุภาษา = ไทย (ของเดิมไม่พัง)", buildOfflineMonthlySummary(journalA).synthesis === buildOfflineMonthlySummary(journalA, "th").synthesis);
  check("หน้าประวัติส่งภาษาไปกับคำขอสรุป", /monthly-summary\?lang=\$\{isEn \? "en" : "th"\}/.test(historySrc));
  check(
    "route สรุปรายเดือนรับภาษา · ส่งภาษาให้ด่านวิกฤต · สรุปออฟไลน์ตามภาษา · มี prompt อังกฤษ",
    /searchParams\.get\("lang"\) === "en"/.test(monthlySrc) &&
      /checkQuestion\([\s\S]*?, lang\)/.test(monthlySrc) &&
      /buildOfflineMonthlySummary\(journal, lang\)/.test(monthlySrc) &&
      /Reply with JSON only/.test(monthlySrc),
  );
  check("route ไม่มีข้อความ error ไทยล้วนหลุดถึงผู้ใช้หน้าอังกฤษ", !/\{ error: "[฀-๿]/.test(monthlySrc));

  // ── 10. คำตอบสำรองของแชทถามต่อ ───────────────────────────────────────
  console.log("\n💬 10. คำตอบสำรองของแชท (chat-fallback)");
  const chatDrawn = ["swords-10", "cups-02", "major-19"].map((id, order) => ({
    order,
    cardIndex: DECK.findIndex((c) => c.id === id),
    isReversed: false,
  }));
  const chatRec = { drawn: chatDrawn, spreadId: "three-card", category: "love" };
  const withResult = {
    ...chatRec,
    result: { timing: "ภายใน 1-2 สัปดาห์นี้", advice: ["ส่งข้อความสั้น ๆ ทักเขาก่อน", "อย่ารีบถามเรื่องอนาคต", "🧘 หายใจลึก ๆ"], summary: "ภาพรวมของคำอ่านจริง" },
  };
  const ask = (q: string, record: object = chatRec, lang: "th" | "en" = "th", personaId = "warm") =>
    buildOfflineChatReply({ userQuestion: q, personaId, lang, record: record as never });
  check("ไม่จับ \"ตัดสินใจ\" เป็นคำถามความรัก (บั๊กเดิม)", detectChatIntent("ตัดสินใจยังไงดี") !== "love");
  check("\"สรุปอีกทีได้ไหม\" เป็นคำขอสรุป ไม่ใช่คำถามใช่/ไม่ใช่", detectChatIntent("สรุปอีกทีได้ไหม") === "summary");
  check("ถามเวลา ➔ ใช้กรอบเวลาจากคำอ่านจริงของผู้ใช้", ask("เมื่อไหร่จะได้คุยกัน", withResult).includes("ภายใน 1-2 สัปดาห์นี้"));
  check("ถามวิธี ➔ ใช้คำแนะนำจากคำอ่านจริง (ไม่เอาข้อฝึกสติ)", ask("ควรทำยังไงดี", withResult).includes("ส่งข้อความสั้น ๆ ทักเขาก่อน") && !ask("ควรทำยังไงดี", withResult).includes("🧘"));
  check("ขอสรุป ➔ ใช้บทสรุปจากคำอ่านจริง", ask("สรุปอีกทีได้ไหม", withResult).includes("ภาพรวมของคำอ่านจริง"));
  check("ถามถึงไพ่ตามชื่อ ➔ ตอบเรื่องไพ่ใบนั้นในช่องของมัน", ask("ดวงอาทิตย์หมายถึงอะไร").includes("ดวงอาทิตย์ในช่องอนาคต"));
  check("ถามข้อควรระวัง ➔ ชี้ไพ่ที่เตือนจริง (สิบแห่งดาบ)", ask("มีอะไรต้องระวังไหม").includes("สิบแห่งดาบ"));
  check(
    "เปิดไพ่เรื่องรักแต่ถามเรื่องงาน ➔ ใช้ความหมายหมวดงาน ไม่ใช่หมวดรัก",
    ask("เรื่องงานจะเป็นยังไง").includes(DECK.find((c) => c.id === "major-19")!.meanings.work.upright.slice(0, 20)),
  );
  const chatSamples = ["เขาจะกลับมาไหม", "เมื่อไหร่จะดีขึ้น", "ควรทำยังไงดี", "มีอะไรต้องระวังไหม", "เรื่องงานจะเป็นยังไง"].map((q) => ask(q));
  check(
    "ไม่มีประโยคกุข้อมูลเดิม (สัญญาณบวกภายใน 7 วัน · ทิศทางเป็นบวก · ระวังสุขภาพ)",
    !chatSamples.some((t) => /ภายใน 7 วัน|ทิศทางโดยรวมเป็นบวก|เรื่องสุขภาพ/.test(t)),
  );
  check("ทุกคำตอบอ้างไพ่ที่เปิดจริงอย่างน้อยหนึ่งใบ", chatSamples.every((t) => chatDrawn.some((d) => t.includes(cardByIndex(d.cardIndex)!.nameTh))));
  check("ไม่มีวงเล็บติดอักษรไทยในคำตอบแชท", chatSamples.every((t) => !/\)[\u0E00-\u0E7F]/.test(t)));
  const enSamples = ["When will things improve?", "What should I do next?", "Should I quit?", "Tell me about The Sun"].map((q) => ask(q, chatRec, "en", "direct"));
  check("[en] คำตอบแชทไม่มีอักษรไทยหลุด", enSamples.every((t) => !THAI.test(t)), enSamples.find((t) => THAI.test(t)));
  check("[en] แยกประเภทคำถามได้ (ไม่ใช่ประโยคเดียวกันทุกคำถาม)", new Set(enSamples).size === enSamples.length);
  check("ไม่มีไพ่ให้อ้าง ➔ บอกให้โหลดใหม่ ไม่เดาคำตอบ (กฎเหล็กข้อ 14)", /โหลดคำอ่านใหม่/.test(ask("อะไรก็ได้", {})));
  const chatRouteSrc = fs.readFileSync(path.resolve("src/app/api/reading/[id]/chat/route.ts"), "utf8");
  check("route แชทใช้ buildOfflineChatReply และยังตรวจสัญญาณวิกฤตก่อน", /buildOfflineChatReply\(/.test(chatRouteSrc) && /checkQuestion\(userQuestion, lang\)/.test(chatRouteSrc));

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
