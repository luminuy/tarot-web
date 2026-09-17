import { getSpread } from "@/data/spreads";
import { getContentOverrides, resolveCardByIndex } from "@/lib/content/overrides";
import { streamGeminiReading } from "@/lib/ai/gemini";
import { AI_DISCLOSURE, AI_DISCLOSURE_EN } from "@/lib/safety/guardrails";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { getReading, updateReading } from "@/server/store";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { recordEvents, recordEvent } from "@/lib/stats/record";
import { GUEST_BLOCK_REASON, REQUIRE_SIGNUP_TO_READ } from "@/lib/entitlement/limits";
import { SIGN_IN_GATE_REASON, getSignInGateMessage, isSignInRequired } from "@/lib/entitlement/signin-gate";
import { recordCaughtError } from "@/lib/observability/caught";

export const runtime = "nodejs";
/** การอ่านไพ่ใช้เวลาหลายสิบวินาที ต้องกันไม่ให้ platform ตัดกลางคัน */
export const maxDuration = 120;

/**
 * ขั้นที่ 3 — ให้แม่หมอ Gemini AI อ่าน แล้วส่งกลับเป็น Server-Sent Events แบบ Structured Streaming
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { isPrivilegedTestRequest } = await import("@/lib/security/privileged");
  const privileged = await isPrivilegedTestRequest(request);

  if (!privileged && !isRequestAuthorizedOrigin(request)) {
    return Response.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก (Unauthorized Origin)" }, { status: 403 });
  }

  const { id } = await params;
  let record = getReading(id);

  // Durable KV failover recovery: if memory was lost on edge worker isolate
  if (!record || !record.drawn) {
    const { loadReadingFromKV, saveReading } = await import("@/server/store");
    const fromKv = await loadReadingFromKV(id);
    if (fromKv && fromKv.drawn) {
      record = fromKv;
      saveReading(record);
    }
  }

  // Stateless session-token fallback: last resort
  if (!record || !record.drawn) {
    const token = request.headers.get("x-reading-token");
    if (token) {
      const { verifyReadingSessionToken } = await import("@/lib/security/session-token");
      const recovered = verifyReadingSessionToken(token);
      if (recovered && recovered.id === id && recovered.drawn) {
        record = recovered as import("@/server/store").ReadingRecord;
        const { saveReading } = await import("@/server/store");
        saveReading(record);
      }
    }
  }

  if (!record || !record.drawn) {
    const isEn = request.headers.get("referer")?.includes("/en");
    return Response.json(
      { error: isEn ? "Cards have not been shuffled, or this reading session has expired." : "ยังไม่ได้สับไพ่ หรือการเปิดไพ่นี้หมดอายุแล้ว" },
      { status: 404 }
    );
  }

  const isEn = record.lang === "en" || request.headers.get("referer")?.includes("/en");

  // Cryptographic seed & commitment integrity verification gate
  if (record.serverSeed && record.commitment) {
    const { verifyCommitment } = await import("@/lib/tarot/shuffle");
    if (!verifyCommitment(record.serverSeed, record.commitment)) {
      console.error("[PF] commitment mismatch on read route", { id });
      return Response.json(
        { error: isEn ? "Cryptographic card verification failed (commitment mismatch)." : "ข้อมูลความถูกต้องของไพ่ไม่ตรงกับคำมั่นเดิม" },
        { status: 500 }
      );
    }
  }

  const spread = getSpread(record.spreadId);
  if (!spread) {
    return Response.json({ error: isEn ? "Spread layout not found." : "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  const clientIp = getClientIdentifier(request);

  // World-Class Rate Limiter & Single-Flight Concurrency Protection per IP
  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  if (!privileged) {
    // `checkRateLimit` เหลือหน้าที่เดียวคือกันการกดซ้ำซ้อนพร้อมกัน (maxConcurrent)
    // ซึ่งอยู่ในหน่วยความจำได้ เพราะเป็นตัวกันผู้ใช้คนเดียวกดรัว ไม่ใช่ด่านค่าใช้จ่าย
    limit = checkRateLimit(`read:${clientIp}`, {
      maxRequests: 15,
      windowSeconds: 600,
      maxConcurrent: 1,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(
        limit.retryAfterSeconds,
        isEn
          ? "A reading is already in progress or requests are too frequent. Please wait a moment."
          : "คุณกำลังเปิดไพ่อยู่แล้ว หรือเปิดไพ่ถี่เกินไป กรุณารอสักครู่"
      );
    }

    // 🚦 T-11: เพดานจริงที่บังคับได้ข้าม isolate — ของเดิมอยู่ใน `Map` ต่อ isolate
    const edge = await consumeEdgeRateLimits([
      { key: edgeRateLimitKey("read:ip", clientIp), config: { max: 15, windowSec: 600 } },
    ]);
    if (!edge.allowed) {
      limit.releaseConcurrency();
      return createRateLimitResponse(
        edge.retryAfterSec,
        isEn
          ? "You are opening readings too frequently. Please wait a moment."
          : "คุณเปิดไพ่ถี่เกินไป กรุณารอสักครู่",
      );
    }

    const { checkPerIpReadQuota } = await import("@/lib/security/ai-budget");
    const quota = await checkPerIpReadQuota(clientIp);
    if (!quota.allowed) {
      // ⚠️ ต้องคืน slot ก่อน return ทุกครั้ง — `maxConcurrent: 1` ถูกจองไปแล้วตั้งแต่ checkRateLimit
      // ถ้าไม่คืน `concurrent` จะค้างที่ 1 ตลอดอายุ isolate · พอโควตารีเซ็ตวันรุ่งขึ้น
      // ผู้ใช้คนนั้นจะโดน 429 "คุณกำลังเปิดไพ่อยู่แล้ว" ทุกครั้งจนกว่า isolate จะถูกรีไซเคิล
      // (performLazyCleanup ก็เก็บกวาดไม่ได้ เพราะเงื่อนไขต้องการ concurrent <= 0)
      limit.releaseConcurrency();
      return createRateLimitResponse(
        3600,
        isEn
          ? "You have reached your daily reading quota. Please rest and return tomorrow."
          : "คุณเปิดไพ่ครบโควตาสูงสุดของวันนี้แล้ว พักผ่อนแล้วกลับมาใหม่พรุ่งนี้นะ"
      );
    }
  }

  // อ่านซ้ำให้คืนผลเดิม ไม่เรียกโมเดลใหม่ (ไม่หักสิทธิ์)
  if (record.result) {
    limit.releaseConcurrency();
    return streamCached(record.result, record);
  }

  // ── หักสิทธิ์การเปิดไพ่ (ENTITLEMENT_PLAN ข้อ 6.1) — วางหลังบล็อกอ่านซ้ำ ก่อนเช็คเพดาน AI ──
  // 🔴 T-02: เก็บ **id ของแถวที่คำขอนี้สร้างเอง** ไม่ใช่ธง boolean ลอย ๆ
  // ธง boolean ทำให้คำขอที่ยิงซ้ำ (ซึ่ง `consumeReading` คืน "หักไปแล้ว") เข้าใจว่าตัวเอง
  // เป็นคนหัก แล้วไปลบแถวค่าใช้จ่ายของคำขอแรกทิ้งตอนสตรีมถูกตัด = เปิดไพ่ฟรีไม่จำกัด
  let consumedUsageId: string | null = null;
  let capTier: "guest" | "member" = "member"; // ธงปิด → เพดานเต็ม (พฤติกรรมเดิม)
  let guestNeedsConsume = false; // ผู้เยี่ยมชมผ่าน gate → ต้องออก ticket หลังอ่านสำเร็จจริง
  let guestGid: string | null = null; // gid ของผู้เยี่ยมชม — ใช้ mark ฝั่ง server ตอนอ่านจบ
  let memberUserId: string | null = null;
  if (!privileged) {
    const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
    const { getViewer } = await import("@/lib/entitlement/viewer");
    const [enforced, viewer] = await Promise.all([isEntitlementEnabled(), getViewer(request)]);

    // ── ด่านล็อกอิน — อยู่ "นอก" ธงระบบสิทธิ์โดยตั้งใจ (ดู lib/entitlement/signin-gate.ts) ──
    // ตาข่ายกันการยิง /read ตรงโดยข้าม /start · ธงโควตาถูกปิดค้างได้ แต่ด่านนี้ต้องไม่หาย
    if (isSignInRequired(viewer)) {
      limit.releaseConcurrency();
      recordEvent("entitlement_blocked_signin");
      return Response.json({ error: getSignInGateMessage(record.lang), reason: SIGN_IN_GATE_REASON }, { status: 403 });
    }

    if (enforced) {
      const { consumeReading } = await import("@/lib/entitlement/entitlement");
      capTier = viewer.kind;
      if (viewer.kind === "member") {
        memberUserId = viewer.userId;
      }
      const outcome = await consumeReading(viewer, id, record.spreadId);
      if (outcome.status === "inserted") consumedUsageId = outcome.usageId;
      if (outcome.status === "denied") {
        limit.releaseConcurrency();
        recordEvent("entitlement_blocked_read");
        return Response.json(
          {
            error:
              viewer.kind === "guest" && REQUIRE_SIGNUP_TO_READ
                ? (isEn ? "Sign in or create a free account to continue your reading." : "สมัครสมาชิกฟรีหรือเข้าสู่ระบบก่อน แล้วเปิดไพ่ได้เลย")
                : (isEn ? "Your reading quota has been reached." : "สิทธิ์เปิดไพ่ของคุณหมดแล้ว"),
            reason: viewer.kind === "guest" ? GUEST_BLOCK_REASON : "daily_exhausted",
          },
          { status: 403 },
        );
      }
      // ผู้เยี่ยมชม: DB ไม่มีแถว → คุกกี้เป็นตัวนับ
      // ห้าม Set-Cookie ตอนนี้ (header ส่งไปก่อน AI ทำงาน → AI ล้ม = เสียสิทธิ์ฟรีทั้งที่ยังไม่ได้อ่าน)
      // แทนด้วย: ออก signed ticket เฉพาะตอน event `done` ที่เป็นคำอ่านจริง แล้วให้ client
      // ยิงไป `POST /api/entitlement/guest-consume` เพื่อ Set-Cookie used=1 (ENTITLEMENT_PLAN ข้อ 4)
      if (viewer.kind === "guest") {
        guestNeedsConsume = true;
        guestGid = viewer.gid !== "anon" ? viewer.gid : null;
        // guest ไม่มีแถว DB ให้ refund — `consumeReading` คืน "guest-allowed" จึงไม่มี usageId อยู่แล้ว

        // เพดานเฉพาะผู้เยี่ยมชมต่อ IP/ซับเน็ต — เช็คหลัก ๆ ที่ start (UX) · ที่นี่เป็นตาข่ายกันเรียก read ตรง
        const { isGuestReadQuotaReached } = await import("@/lib/security/ai-budget");
        if (await isGuestReadQuotaReached(clientIp)) {
          limit.releaseConcurrency();
          recordEvent("entitlement_guest_ip_capped");
          return Response.json(
            {
              error: "วันนี้เปิดไพ่แบบทดลองจากเครือข่ายนี้ครบแล้ว สมัครสมาชิกเพื่อเปิดต่อได้เลย",
              reason: "guest_used",
            },
            { status: 403 },
          );
        }
      }
    }
  }

  /**
   * คืนสิทธิ์เฉพาะแถวที่ **คำขอนี้** สร้างเอง
   * 🔴 T-05: catch เดิมเป็น catch เปล่า ไม่มี event ไม่มี log ทั้งที่เส้นทางล้มอื่นทุกเส้น
   * มี `recordEvent` — ผู้ใช้เสียสิทธิ์เพราะระบบเราพังโดยไม่มีใครรู้เลยสักครั้ง
   */
  const refundIfConsumed = async () => {
    const usageId = consumedUsageId;
    if (!usageId) return;
    consumedUsageId = null;
    try {
      const { refundReading } = await import("@/lib/entitlement/entitlement");
      await refundReading(id, usageId);
    } catch (e) {
      recordEvent("entitlement_refund_failed");
      console.error("[read/route] คืนสิทธิ์ไม่สำเร็จ", { readingId: id, usageId }, e);
    }
  };

  // World-Class AI Spend Cap & Financial Circuit Breaker (เพดานสองชั้น: guest 70% / member 100%)
  const { isAiCapReached, recordAiCall, recordPerIpReadQuota } = await import("@/lib/security/ai-budget");
  if (!privileged && (await isAiCapReached(capTier))) {
    limit.releaseConcurrency();
    await refundIfConsumed();
    recordEvent("ai_cap_hit");
    return Response.json(
      { error: "ระบบดูดวงมีผู้ใช้จำนวนมากในวันนี้ กรุณากลับมาใหม่พรุ่งนี้ หรือลองอีกครั้งในภายหลัง" },
      { status: 503 },
    );
  }

  updateReading(id, { status: "READING" });

  const encoder = new TextEncoder();
  let isClosed = false;
  const send = (controller: ReadableStreamDefaultController, event: string, data: unknown) => {
    if (isClosed) return;
    try {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch {
      isClosed = true;
    }
  };

  const startedAt = Date.now();
  let completedOk = false;
  /**
   * สัญญาณ "ลูกค้าไปแล้ว" — ส่งต่อให้ Groq/Gemini เพื่อยกเลิกที่ต้นทาง (T-06)
   * ใช้ controller ของเราเองแทน `request.signal` ตรง ๆ เพราะต้องยกเลิกได้จาก `cancel()`
   * ของ ReadableStream ด้วย (บางแพลตฟอร์มไม่ abort `request.signal` ให้เมื่อผู้ใช้ปิดแท็บ)
   */
  const clientAbort = new AbortController();
  const unlinkRequestAbort = (() => {
    const sig = (request as Request & { signal?: AbortSignal }).signal;
    if (!sig) return () => {};
    if (sig.aborted) {
      clientAbort.abort();
      return () => {};
    }
    const onAbort = () => clientAbort.abort();
    sig.addEventListener("abort", onAbort, { once: true });
    return () => sig.removeEventListener("abort", onAbort);
  })();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!memberUserId) {
          try {
            const { getSessionUser } = await import("@/lib/auth/session");
            const user = await getSessionUser();
            if (user?.id) memberUserId = user.id;
          } catch (err) {
            /* 🔴 R-27: อ่านเซสชันไม่ได้ = ความทรงจำกรรมของสมาชิกหายไปจากคำอ่านรอบนี้
               ไม่ถึงกับต้องหยุดการเปิดไพ่ แต่ต้องนับไว้ ไม่ใช่กลืนเงียบ */
            recordCaughtError("read.session_lookup", err);
          }
        }

        const { loadKarmicMemory } = await import("@/lib/ai/memory");
        const [overrideDoc, pastReading] = await Promise.all([
          getContentOverrides(),
          loadKarmicMemory(memberUserId),
        ]);
        const resolvedCards = record.drawn!.map((d) => resolveCardByIndex(overrideDoc, d.cardIndex));
        if (resolvedCards.some((c) => !c)) {
          send(controller, "error", {
            message:
              record.lang === "en"
                ? "Card data not found. Please refresh and try again."
                : "ไม่พบข้อมูลไพ่ที่เปิด กรุณาโหลดใหม่อีกครั้ง",
            code: "CARD_DATA_NOT_FOUND",
          });
          controller.close();
          return;
        }

        const readingCtx = {
          personaId: record.personaId,
          spread,
          category: record.category,
          question: record.question,
          intake: record.intake,
          nickname: record.nickname,
          drawn: record.drawn!,
          cards: resolvedCards as import("@/data/cards").TarotCard[],
          safety: { flag: record.safetyFlag, block: false, promptGuard: record.safetyGuard },
          pastReading,
          lang: record.lang || "th",
          // ผู้ใช้ปิดแท็บ → ยกเลิกคำขอไปยังผู้ให้บริการทันที ไม่จ่ายค่าโทเคนให้คำอ่านที่ไม่มีใครเห็น (T-06)
          abortSignal: clientAbort.signal,
        };

        let activeProvider = "gemini";

        async function* streamMultiProviderReading(): AsyncGenerator<
          import("@/lib/ai/types").ReadingEvent & { provider?: "groq" | "gemini" }
        > {
          // Tier 1: Groq Qwen (High-speed LPU, deep Thai comprehension, 14.4k req/day free quota)
          // ⚠️ ผังที่ใหญ่เกินเพดาน TPM 8,000 (4 ใบขึ้นไป) streamGroqReading() จะข้ามเองทันที
          //    โดยไม่ยิงคำขอ ➔ ตกไป Gemini ซึ่งเป็นตัวที่รับผังใหญ่อยู่จริงในตอนนี้ (INC-0136)
          if (process.env.GROQ_API_KEY) {
            let emittedAny = false;
            try {
              const { streamGroqReading } = await import("@/lib/ai/groq");
              let gotDone = false;
              for await (const event of streamGroqReading(readingCtx)) {
                if (event.type === "done") gotDone = true;
                if (event.type !== "done") emittedAny = true;
                yield { ...event, provider: "groq" };
              }
              if (gotDone) {
                activeProvider = "groq";
                return;
              }
              recordEvent("ai_groq_failover"); // Groq ทุกโมเดลไม่จบ → ตกไป Gemini
              if (emittedAny) {
                yield { type: "reset", provider: "gemini" };
              }
            } catch (err) {
              recordEvent("ai_groq_failover");
              console.warn("[read/route] Groq stream encountered error, failing over to Gemini:", err);
              if (emittedAny) {
                yield { type: "reset", provider: "gemini" };
              }
            }
          }

          // Tier 2: Google Gemini (3.6 Flash / 3.5 Flash-Lite)
          activeProvider = "gemini";
          for await (const event of streamGeminiReading(readingCtx)) {
            yield { ...event, provider: "gemini" };
          }
        }

        for await (const event of streamMultiProviderReading()) {
          if (isClosed) break;

          if (event.type === "done") {
            const providerUsed = event.provider || activeProvider;
            // คำอ่านสำรอง/ออฟไลน์ (token = 0) ไม่ควรหักสิทธิ์ผู้ใช้ — คืนให้
            const realReading =
              (event.usage?.inputTokens ?? 0) > 0 || (event.usage?.outputTokens ?? 0) > 0;
            let guestConsumeTicket: string | null = null;
            if (realReading) {
              completedOk = true;
              // ผู้เยี่ยมชม: ออก ticket ให้ client ยิง /api/entitlement/guest-consume
              // เฉพาะตรงนี้ (คำอ่านจริง) — ทุก failure path ไม่มีทางมาถึง → ไม่มีทางเสียสิทธิ์
              if (guestNeedsConsume) {
                const { signGuestConsumeTicket, markGuestUsedOnServer } = await import(
                  "@/lib/entitlement/guest"
                );
                guestConsumeTicket = await signGuestConsumeTicket(id).catch(() => null);
                // เครื่องหมายฝั่ง server — ไม่พึ่ง client · client ที่บล็อก guest-consume ยังโดนกั้นที่ start
                if (guestGid) void markGuestUsedOnServer(guestGid);
                const { recordGuestRead } = await import("@/lib/security/ai-budget");
                void recordGuestRead(clientIp);
              }
            } else {
              await refundIfConsumed();
            }

            // เก็บผลคำทำนายให้ isolate อื่นอ่านซ้ำได้จริง
            // ---------------------------------------------------------------
            // 🔴 บทเรียน T-02 — คอมเมนต์เดิมตรงนี้เขียนว่า "ไม่มีโค้ดไหนอ่านเรกคอร์ด
            // หลังอ่านจบเลย" จึงตั้งใจไม่เขียนลงที่เก็บถาวรเพื่อประหยัดโควตา KV
            // **แต่มี** — ด่านกันอ่านซ้ำที่ต้นไฟล์ (`if (record.result) return streamCached(...)`)
            // อ่านฟิลด์นี้ตรง ๆ คำขอที่ไปตกคนละ isolate จึงเห็น `result` ว่าง
            // แล้วไหลเข้าเส้นหักสิทธิ์ + เรียกโมเดลใหม่ = เว็บจ่ายค่า AI สองรอบ
            // `persistReading()` เลือก Redis ก่อนเสมอเมื่อตั้ง Upstash ไว้ (ดู server/store.ts)
            // จึงไม่กินโควตาเขียน KV ฟรีในสภาพแวดล้อมจริง
            const completed = updateReading(id, { status: "COMPLETED", result: event.reading });
            if (completed) {
              const { persistReading } = await import("@/server/store");
              await persistReading(completed).catch(() => {
                // เขียนไม่สำเร็จ = ยิงซ้ำจะสร้างคำอ่านใหม่ ต้องเห็นได้บน /admin ไม่ใช่เงียบ
                recordEvent("reading_persist_failed");
              });
            }
            recordEvents([
              "reading_completed",
              `ai_call:${providerUsed}`,
              ["ai_latency_ms", Date.now() - startedAt],
              ["ai_tokens_in", event.usage?.inputTokens ?? 0],
              ["ai_tokens_out", event.usage?.outputTokens ?? 0],
            ]);
            void recordAiCall(1);
            void recordPerIpReadQuota(clientIp);

            // 📊 บันทึกบริบทตอนสร้างคำอ่าน สำหรับวัดคุณภาพ AI (AI_INTELLIGENCE_PLAN W1.1)
            const { recordReadingQuality } = await import("@/lib/ai/quality.repo");
            const { PROMPT_VERSION } = await import("@/lib/ai/prompt-version");
            void recordReadingQuality({
              readingId: id,
              provider: providerUsed,
              model: event.model || (providerUsed === "groq" ? "qwen3.8-27b" : "gemini-2.5-flash"),
              personaId: record.personaId || "default",
              spreadId: record.spreadId,
              cardCount: record.drawn!.length,
              category: record.category,
              promptVersion: PROMPT_VERSION,
              elapsedMs: Date.now() - startedAt,
              outputTokens: event.usage?.outputTokens ?? 0,
              hadFailover: providerUsed === "gemini" && Boolean(process.env.GROQ_API_KEY),
              consistencyOk: event.consistencyOk ?? true,
              thaiScore: event.thaiScore ?? null,
              thaiIssueCodes: event.thaiIssueCodes ?? null,
              thaiFixCount: event.thaiFixCount ?? null,
            }).catch(() => {});

            // เฉลย serverSeed ตอนนี้ — ผู้ใช้ตรวจย้อนหลังได้ว่าไพ่ไม่ได้ถูกเลือกทีหลัง
            send(controller, "done", {
              reading: event.reading,
              disclosure: record.lang === "en" ? AI_DISCLOSURE_EN : AI_DISCLOSURE,
              proof: {
                serverSeed: record.serverSeed,
                clientSeed: record.clientSeed,
                commitment: record.commitment,
                pickedIndices: record.pickedIndices,
                deckSize: 78,
              },
              usage: event.usage,
              ...(guestConsumeTicket ? { guestConsumeTicket } : {}),
            });
          } else if (event.type === "error") {
            updateReading(id, { status: "FAILED" });
            await refundIfConsumed();
            recordEvents(["reading_failed", `ai_error:${event.provider || activeProvider}`]);
            send(controller, "error", { message: event.message });
          } else {
            send(controller, event.type, event);
          }
        }
      } catch (error) {
        console.error("stream การอ่านล้มเหลว", error);
        updateReading(id, { status: "FAILED" });
        await refundIfConsumed();
        recordEvent("reading_failed");
        send(controller, "error", { message: "คำอ่านขัดข้อง ลองใหม่อีกครั้งนะ" });
      } finally {
        // สตรีมถูกตัดกลางคัน / ไม่มี done ที่สำเร็จ → คืนสิทธิ์
        if (!completedOk) await refundIfConsumed();
        unlinkRequestAbort();
        limit.releaseConcurrency();
        if (!isClosed) {
          try {
            controller.close();
          } catch {
            /* ปลายทางปิดสตรีมไปก่อนแล้ว (ผู้ใช้ปิดแท็บ) — `close()` ซ้ำโยนเสมอ
               ไม่ใช่ความล้มเหลว จึงไม่นับเป็น error (R-27) */
          }
          isClosed = true;
        }
      }
    },
    /**
     * ผู้ใช้ปิดแท็บ / กดย้อนกลับ / เน็ตหลุด → แพลตฟอร์มเรียก cancel() ตรงนี้
     * ต้องตั้ง `isClosed` ทันที เพื่อให้ลูป `for await` ข้างบน `break` ในรอบถัดไป
     * ไม่งั้นเราจะยังดูดคำตอบจากโมเดลต่อจนจบทั้งก้อน = จ่ายค่า token ให้คำอ่าน
     * ที่ไม่มีใครได้เห็น (ของเดิมรอให้ enqueue โยน error เองซึ่งช้ากว่าและไม่แน่นอน)
     */
    cancel() {
      isClosed = true;
      // ยกเลิกคำขอที่ต้นทางด้วย ไม่ใช่แค่หยุดเขียนออก — ไม่งั้นโมเดลยังผลิตต่อจนจบ
      // และเราจ่ายค่าโทเคนเต็มให้คำอ่านที่ไม่มีใครได้เห็น (T-06)
      clientAbort.abort();
      recordEvent("reading_client_cancelled");
    },
  });

  const streamHeaders = new Headers({
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // กัน proxy บางตัวหน่วง buffer จนสตรีมไม่ไหล
    "X-Accel-Buffering": "no",
  });

  return new Response(stream, { headers: streamHeaders });
}

/** ส่งผลที่เคยอ่านไว้แล้วกลับไปในรูปแบบเดียวกัน เพื่อให้ฝั่งหน้าเว็บใช้โค้ดชุดเดิม */
function streamCached(
  reading: import("@/lib/schema/reading").Reading,
  record: import("@/server/store").ReadingRecord
) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      const push = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      push("opening", { text: reading.opening });
      for (const card of reading.cards) push("card", card);
      push("connections", { text: reading.connections });
      push("summary", { text: reading.summary });
      push("done", {
        reading,
        disclosure: record.lang === "en" ? AI_DISCLOSURE_EN : AI_DISCLOSURE,
        proof: {
          serverSeed: record.serverSeed,
          clientSeed: record.clientSeed,
          commitment: record.commitment,
          pickedIndices: record.pickedIndices,
          deckSize: 78,
        },
        cached: true,
      });
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
