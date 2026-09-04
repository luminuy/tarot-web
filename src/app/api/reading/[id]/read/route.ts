import { getSpread } from "@/data/spreads";
import { getContentOverrides, resolveCardByIndex } from "@/lib/content/overrides";
import { streamGeminiReading } from "@/lib/ai/gemini";
import { AI_DISCLOSURE } from "@/lib/safety/guardrails";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { getReading, updateReading } from "@/server/store";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/utils/rate-limit";
import { recordEvents, recordEvent } from "@/lib/stats/record";

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
    return Response.json({ error: "ยังไม่ได้สับไพ่ หรือการเปิดไพ่นี้หมดอายุแล้ว" }, { status: 404 });
  }

  // Cryptographic seed & commitment integrity verification gate
  if (record.serverSeed && record.commitment) {
    const { verifyCommitment } = await import("@/lib/tarot/shuffle");
    if (!verifyCommitment(record.serverSeed, record.commitment)) {
      console.error("[PF] commitment mismatch on read route", { id });
      return Response.json({ error: "ข้อมูลความถูกต้องของไพ่ไม่ตรงกับคำมั่นเดิม" }, { status: 500 });
    }
  }

  const spread = getSpread(record.spreadId);
  if (!spread) {
    return Response.json({ error: "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  const clientIp = getClientIdentifier(request);

  // World-Class Rate Limiter & Single-Flight Concurrency Protection per IP
  let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
  if (!privileged) {
    limit = checkRateLimit(`read:${clientIp}`, {
      maxRequests: 15,
      windowSeconds: 600,
      maxConcurrent: 1,
    });

    if (!limit.allowed) {
      return createRateLimitResponse(limit.retryAfterSeconds, "คุณกำลังเปิดไพ่อยู่แล้ว หรือเปิดไพ่ถี่เกินไป กรุณารอสักครู่");
    }

    const { checkPerIpReadQuota } = await import("@/lib/security/ai-budget");
    const quota = await checkPerIpReadQuota(clientIp);
    if (!quota.allowed) {
      return createRateLimitResponse(3600, "คุณเปิดไพ่ครบโควตาสูงสุดของวันนี้แล้ว พักผ่อนแล้วกลับมาใหม่พรุ่งนี้นะ");
    }
  }

  // อ่านซ้ำให้คืนผลเดิม ไม่เรียกโมเดลใหม่ (ไม่หักสิทธิ์)
  if (record.result) {
    limit.releaseConcurrency();
    return streamCached(record.result, record);
  }

  // ── หักสิทธิ์การเปิดไพ่ (ENTITLEMENT_PLAN ข้อ 6.1) — วางหลังบล็อกอ่านซ้ำ ก่อนเช็คเพดาน AI ──
  let consumed = false;
  let capTier: "guest" | "member" = "member"; // ธงปิด → เพดานเต็ม (พฤติกรรมเดิม)
  let guestNeedsConsume = false; // ผู้เยี่ยมชมผ่าน gate → ต้องออก ticket หลังอ่านสำเร็จจริง
  let guestGid: string | null = null; // gid ของผู้เยี่ยมชม — ใช้ mark ฝั่ง server ตอนอ่านจบ
  if (!privileged) {
    const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");
    if (await isEntitlementEnabled()) {
      const { getViewer } = await import("@/lib/entitlement/viewer");
      const { consumeReading } = await import("@/lib/entitlement/entitlement");
      const viewer = await getViewer(request);
      capTier = viewer.kind;
      consumed = await consumeReading(viewer, id, record.spreadId);
      if (!consumed) {
        limit.releaseConcurrency();
        recordEvent("entitlement_blocked_read");
        return Response.json(
          { error: "สิทธิ์เปิดไพ่ของคุณหมดแล้ว", reason: viewer.kind === "guest" ? "guest_used" : "daily_exhausted" },
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
        // guest ไม่มีแถว DB ให้ refund — กันไม่ให้ finally เรียก refundReading เปล่า ๆ
        consumed = false;

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

  const refundIfConsumed = async () => {
    if (!consumed) return;
    consumed = false;
    try {
      const { refundReading } = await import("@/lib/entitlement/entitlement");
      await refundReading(id);
    } catch {
      /* best-effort */
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

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const overrideDoc = await getContentOverrides();
        const resolvedCards = record.drawn!.map((d) => resolveCardByIndex(overrideDoc, d.cardIndex));
        if (resolvedCards.some((c) => !c)) {
          send(controller, "error", {
            message: "ไม่พบข้อมูลไพ่ที่เปิด กรุณาโหลดใหม่อีกครั้ง",
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
        };

        let activeProvider = "gemini";

        async function* streamMultiProviderReading(): AsyncGenerator<
          import("@/lib/ai/claude").ReadingEvent & { provider?: "groq" | "gemini" }
        > {
          // Tier 1: Groq Qwen (High-speed LPU, deep Thai comprehension, 14.4k req/day free quota)
          if (process.env.GROQ_API_KEY) {
            try {
              const { streamGroqReading } = await import("@/lib/ai/groq");
              let gotDone = false;
              for await (const event of streamGroqReading(readingCtx)) {
                if (event.type === "done") gotDone = true;
                yield { ...event, provider: "groq" };
              }
              if (gotDone) {
                activeProvider = "groq";
                return;
              }
              recordEvent("ai_groq_failover"); // Groq ทุกโมเดลไม่จบ → ตกไป Gemini
            } catch (err) {
              recordEvent("ai_groq_failover");
              console.warn("[read/route] Groq stream encountered error, failing over to Gemini:", err);
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

            const updated = updateReading(id, { status: "COMPLETED", result: event.reading });
            if (updated) {
              const { persistReading } = await import("@/server/store");
              await persistReading(updated);
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
            // เฉลย serverSeed ตอนนี้ — ผู้ใช้ตรวจย้อนหลังได้ว่าไพ่ไม่ได้ถูกเลือกทีหลัง
            send(controller, "done", {
              reading: event.reading,
              disclosure: AI_DISCLOSURE,
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
        limit.releaseConcurrency();
        if (!isClosed) {
          try {
            controller.close();
          } catch {}
          isClosed = true;
        }
      }
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
        disclosure: AI_DISCLOSURE,
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
