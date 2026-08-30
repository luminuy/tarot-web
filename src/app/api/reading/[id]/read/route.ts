import { cardByIndex } from "@/data/cards";
import { getSpread } from "@/data/spreads";
import { streamGeminiReading } from "@/lib/gemini";
import { AI_DISCLOSURE } from "@/lib/safety";
import { getReading, updateReading } from "@/server/store";
import { checkRateLimit, getClientIdentifier, createRateLimitResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";
/** การอ่านไพ่ใช้เวลาหลายสิบวินาที ต้องกันไม่ให้ platform ตัดกลางคัน */
export const maxDuration = 120;

/**
 * ขั้นที่ 3 — ให้แม่หมอ Gemini AI อ่าน แล้วส่งกลับเป็น Server-Sent Events แบบ Structured Streaming
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const record = getReading(id);

  if (!record || !record.drawn) {
    return Response.json({ error: "ยังไม่ได้สับไพ่ หรือการเปิดไพ่นี้หมดอายุแล้ว" }, { status: 404 });
  }

  const spread = getSpread(record.spreadId);
  if (!spread) {
    return Response.json({ error: "ไม่พบรูปแบบการวางไพ่นี้" }, { status: 404 });
  }

  // World-Class Rate Limiter & Single-Flight Concurrency Protection per IP
  const clientIp = getClientIdentifier(request);
  const limit = checkRateLimit(`read:${clientIp}`, {
    maxRequests: 15,
    windowSeconds: 600,
    maxConcurrent: 1,
  });

  if (!limit.allowed) {
    return createRateLimitResponse(limit.retryAfterSeconds, "คุณกำลังเปิดไพ่อยู่แล้ว หรือเปิดไพ่ถี่เกินไป กรุณารอสักครู่");
  }

  // อ่านซ้ำให้คืนผลเดิม ไม่เรียกโมเดลใหม่
  if (record.result) {
    limit.releaseConcurrency();
    return streamCached(record.result, record.serverSeed);
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

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const readingCtx = {
          personaId: record.personaId,
          spread,
          category: record.category,
          question: record.question,
          intake: record.intake,
          nickname: record.nickname,
          drawn: record.drawn!,
          cards: record.drawn!.map((d) => cardByIndex(d.cardIndex)),
          safety: { flag: record.safetyFlag, block: false, promptGuard: record.safetyGuard },
        };

        const generator = streamGeminiReading(readingCtx);

        for await (const event of generator) {
          if (isClosed) break;

          if (event.type === "done") {
            updateReading(id, { status: "COMPLETED", result: event.reading });
            // เฉลย serverSeed ตอนนี้ — ผู้ใช้ตรวจย้อนหลังได้ว่าไพ่ไม่ได้ถูกเลือกทีหลัง
            send(controller, "done", {
              reading: event.reading,
              disclosure: AI_DISCLOSURE,
              proof: { serverSeed: record.serverSeed, clientSeed: record.clientSeed, commitment: record.commitment },
              usage: event.usage,
            });
          } else if (event.type === "error") {
            updateReading(id, { status: "FAILED" });
            send(controller, "error", { message: event.message });
          } else {
            send(controller, event.type, event);
          }
        }
      } catch (error) {
        console.error("stream การอ่านล้มเหลว", error);
        updateReading(id, { status: "FAILED" });
        send(controller, "error", { message: "คำอ่านขัดข้อง ลองใหม่อีกครั้งนะ" });
      } finally {
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

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // กัน proxy บางตัวหน่วง buffer จนสตรีมไม่ไหล
      "X-Accel-Buffering": "no",
    },
  });
}

/** ส่งผลที่เคยอ่านไว้แล้วกลับไปในรูปแบบเดียวกัน เพื่อให้ฝั่งหน้าเว็บใช้โค้ดชุดเดิม */
function streamCached(reading: import("@/lib/reading-schema").Reading, serverSeed: string) {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      const push = (event: string, data: unknown) =>
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));

      push("opening", { text: reading.opening });
      for (const card of reading.cards) push("card", card);
      push("connections", { text: reading.connections });
      push("summary", { text: reading.summary });
      push("done", { reading, disclosure: AI_DISCLOSURE, proof: { serverSeed }, cached: true });
      controller.close();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
