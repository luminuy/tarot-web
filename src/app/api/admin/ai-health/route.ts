import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { kvGetJSON, KEY } from "@/lib/platform/kv-store";
import { utcDay } from "@/lib/stats/record";
import { getAiDailyCap } from "@/lib/security/ai-budget";
import {
  CANDIDATE_GEMINI_MODELS,
  WORKING_GEMINI_MODELS,
  GEMINI_FIRST_MODEL_TIMEOUT_MS,
  GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
  extractGeminiAnswer,
} from "@/lib/ai/gemini";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { getContentOverrides, resolvePersona, resolveSystemCore } from "@/lib/content/overrides";
import { stripThinkingTags } from "@/lib/ai/language";

export const runtime = "nodejs";

/**
 * 🩺 ตรวจสุขภาพการเชื่อมต่อ AI (แอดมินเท่านั้น)
 * ------------------------------------------------
 * ทำไมต้องมี: เวลาแม่หมอ "ตอบไม่ฉลาด" มันมีได้หลายสาเหตุที่หน้าเว็บแยกไม่ออก
 * (ไม่มีคีย์ · คีย์ผิด · โควตา Google หมด · ชนเพดานค่าใช้จ่ายรายวันของเราเอง · โมเดลถูกปลด)
 * เดิมต้องไปไล่อ่าน Worker log ซึ่งเจ้าของเว็บทำเองไม่ได้ (บทเรียน INC-0052)
 * เส้นทางนี้ยิง Gemini จริง 1 ครั้งต่อโมเดล แล้วรายงานสาเหตุตรง ๆ
 *
 * 🔒 ไม่คืนค่าคีย์เด็ดขาด — บอกแค่ว่า "ตั้งไว้ไหม / ยาวกี่ตัว / ขึ้นต้นถูกรูปแบบไหม"
 *    และ scrub ค่าคีย์ออกจากข้อความ error ก่อนส่งกลับเสมอ
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const keyFromEnv = process.env.GEMINI_API_KEY
    ? ("GEMINI_API_KEY" as const)
    : process.env.GOOGLE_API_KEY
      ? ("GOOGLE_API_KEY" as const)
      : null;
  const apiKey = keyFromEnv ? process.env[keyFromEnv] : undefined;

  const groqKey = process.env.GROQ_API_KEY;

  /** ตัดค่าคีย์ออกจากข้อความก่อนส่งกลับหน้าเว็บ ป้องกันคีย์หลุดผ่านข้อความ error */
  const scrub = (text: string) => {
    let s = text;
    if (apiKey) s = s.split(apiKey).join("***");
    if (groqKey) s = s.split(groqKey).join("***");
    return s.slice(0, 400);
  };

  const day = utcDay();
  const capDoc = await kvGetJSON<{ count: number }>(KEY.aiCap(day)).catch(() => null);
  const cap = getAiDailyCap();
  const usedToday = capDoc?.count ?? 0;

  const budget = {
    usedToday,
    dailyCap: cap,
    memberCapReached: usedToday >= cap,
    guestCapReached: usedToday >= Math.floor(cap * 0.7),
  };

  const key = {
    configured: !!apiKey || !!groqKey,
    envVar: keyFromEnv ? (groqKey ? `${keyFromEnv} + GROQ_API_KEY` : keyFromEnv) : (groqKey ? "GROQ_API_KEY" : null),
    length: (apiKey?.length ?? 0) + (groqKey ? ` (Groq: ${groqKey.length})` : ""),
    // เป็นแค่ข้อสังเกต ไม่ใช่คำตัดสิน — Google ออกคีย์หลายรูปแบบและมีคีย์ที่ไม่ขึ้นต้น AIza
    // แต่เรียกงานได้จริง · ตัวชี้ขาดคือผลยิงจริงในตาราง models ด้านล่างเท่านั้น
    startsWithAIza: !!apiKey && apiKey.startsWith("AIza"),
  };

  if (!apiKey && !groqKey) {
    return NextResponse.json({
      ok: false,
      verdict: "no_api_key",
      summary:
        "ยังไม่ได้ตั้ง GEMINI_API_KEY หรือ GROQ_API_KEY บน Worker — คำอ่านและห้องคุยจะตกไปใช้คำตอบสำเร็จรูปทั้งหมด",
      nextStep: "รัน: npx wrangler secret put GEMINI_API_KEY หรือ GROQ_API_KEY แล้ว deploy ใหม่ (ดู docs/PENDING_SETUP.md)",
      key,
      budget,
      models: [],
      checkedAt: new Date().toISOString(),
    });
  }

  // ยิงจริงทีละโมเดล ด้วย prompt สั้นที่สุดเท่าที่จะสั้นได้ (ค่าใช้จ่ายแทบเป็นศูนย์)
  const models: Array<Record<string, unknown>> = [];
  if (apiKey) {
    for (const model of CANDIDATE_GEMINI_MODELS) {
      const startedAt = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey || "" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "ตอบกลับคำเดียวว่า: พร้อม" }] }],
              generationConfig: { temperature: 0 },
            }),
          },
        );
        clearTimeout(timeoutId);

        const elapsedMs = Date.now() - startedAt;
        if (!res.ok) {
          models.push({
            model,
            ok: false,
            status: res.status,
            elapsedMs,
            error: scrub(await res.text().catch(() => "")),
          });
          continue;
        }

        const data = (await res.json()) as any;
        const answer = extractGeminiAnswer(data);
        models.push({
          model,
          ok: !!answer,
          status: 200,
          elapsedMs,
          finishReason: data?.candidates?.[0]?.finishReason ?? null,
          // จำนวน part ทั้งหมด vs part ที่เป็นความคิด — ยืนยันว่าตัวแยกคำตอบทำงานถูก
          partCount: Array.isArray(data?.candidates?.[0]?.content?.parts)
            ? data.candidates[0].content.parts.length
            : 0,
          thoughtPartCount: Array.isArray(data?.candidates?.[0]?.content?.parts)
            ? data.candidates[0].content.parts.filter((p: any) => p?.thought === true).length
            : 0,
          answerPreview: answer.slice(0, 120),
          error: answer ? null : "ตอบ 200 แต่แยกข้อความคำตอบไม่ได้",
        });
      } catch (e) {
        models.push({
          model,
          ok: false,
          status: null,
          elapsedMs: Date.now() - startedAt,
          error: scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e)),
        });
      }
    }
  }

  // ทดสอบ Groq LPU ควบคู่กัน
  if (groqKey) {
    try {
      const { probeGroqHealth } = await import("@/lib/ai/groq");
      const groqResults = await probeGroqHealth(groqKey);
      for (const gr of groqResults) {
        models.push({
          model: `groq · ${gr.model}`,
          ok: gr.ok,
          status: gr.status,
          elapsedMs: gr.elapsedMs,
          finishReason: gr.ok ? "STOP" : null,
          partCount: gr.ok ? 1 : 0,
          thoughtPartCount: gr.hasReasoning ? 1 : 0,
          answerPreview: stripThinkingTags(gr.answerPreview),
          error: gr.error ? scrub(gr.error) : null,
        });
      }
    } catch (e) {
      models.push({
        model: "groq",
        ok: false,
        status: null,
        elapsedMs: 0,
        error: scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e)),
      });
    }
  }

  const working = models.filter((m) => m.ok);
  const ok = working.length > 0;

  let verdict: string;
  let summary: string;
  let nextStep: string;
  if (ok && budget.memberCapReached) {
    verdict = "ai_daily_cap";
    summary = `AI เรียกได้ปกติ แต่วันนี้ใช้ครบเพดานแล้ว (${usedToday}/${cap} ครั้ง) ระบบจึงตัดไปใช้คำตอบสำรอง`;
    nextStep = "ขยายเพดานด้วย env AI_DAILY_CALL_CAP หรือรอรีเซ็ตเที่ยงคืน UTC";
  } else if (ok) {
    verdict = "healthy";
    const hasGroqWorking = working.some((m) => String(m.model).startsWith("groq"));
    const hasGeminiWorking = working.some((m) => !String(m.model).startsWith("groq"));
    if (hasGroqWorking && hasGeminiWorking) {
      summary = `เชื่อมต่อ AI ได้ปกติทั้ง Gemini และ Groq LPU (${working.length}/${models.length} โมเดล) — ระบบสลับอัตโนมัติพร้อมทำงาน 100%`;
    } else if (hasGroqWorking) {
      summary = `เชื่อมต่อ Groq LPU สำเร็จ (${working.length}/${models.length} โมเดล) — แม่หมอตอบด้วย AI ผ่าน Groq LPU ได้ปกติ`;
    } else {
      summary = `เชื่อมต่อ Gemini ได้ปกติ ${working.length}/${models.length} โมเดล — แม่หมอตอบด้วย AI จริงได้แล้ว`;
    }
    nextStep = "ถ้าหน้าเว็บยังขึ้นแถบคำตอบสำรองอยู่ ให้ลองรีเฟรชหน้าและถามใหม่อีกครั้ง";
  } else {
    verdict = "gemini_unavailable";
    summary = "มีคีย์อยู่ แต่เรียก AI ไม่สำเร็จสักโมเดล — ดูช่อง error ของแต่ละโมเดลด้านล่าง";
    nextStep =
      "status 400 = คีย์/พารามิเตอร์ผิด · 403 = คีย์ถูกปิดหรือไม่ได้เปิด API · 429 = โควตาหมด · 404 = ชื่อโมเดลถูกปลดแล้ว";
  }

  return NextResponse.json({
    ok,
    verdict,
    summary,
    nextStep,
    key,
    budget,
    models,
    chatProbe: await probeRealChatPayload(apiKey, groqKey, scrub),
    checkedAt: new Date().toISOString(),
  });
}

/**
 * ยิงด้วย "payload แบบเดียวกับห้องคุยจริง" — system prompt เต็ม + ไพ่ + ประวัติสนทนา
 * ------------------------------------------------------------------------------
 * ping สั้น ๆ ด้านบนผ่านไม่ได้แปลว่าห้องคุยจะผ่าน เพราะ prompt จริงหนักกว่ามาก
 * และโมเดลต้องใช้เวลาคิดนานกว่า · ช่องนี้จึงเป็นตัวชี้ขาดว่าแชทใช้งานได้จริงไหม
 */
async function probeRealChatPayload(
  apiKey: string | undefined,
  groqKey: string | undefined,
  scrub: (t: string) => string,
): Promise<Array<Record<string, unknown>>> {
  const personaId = "warm";
  let systemInstruction: string;
  try {
    const overrideDoc = await getContentOverrides();
    systemInstruction = `${buildSystemPrompt(personaId, {
      systemCore: resolveSystemCore(overrideDoc),
      persona: resolvePersona(overrideDoc, personaId),
    })}

## บริบทการสนทนาส่วนตัว (ทดสอบระบบจากแผงแอดมิน)
• คำถามตั้งต้น: "ภาพรวมชีวิต"
• ไพ่ที่หยิบได้จริงในรอบนี้: ใบที่ 1 ความตาย (Death) · ไพ่ตรง
• สรุปคำทำนายเดิม: "กำลังอยู่ในช่วงเปลี่ยนผ่านครั้งสำคัญ"

ตอบกระชับ 2-4 ประโยคตามบุคลิกแม่หมอ`;
  } catch (e) {
    return [{ model: "-", ok: false, error: `สร้าง system prompt ไม่สำเร็จ: ${String(e).slice(0, 200)}` }];
  }

  const out: Array<Record<string, unknown>> = [];
  if (apiKey) {
    for (const [idx, model] of WORKING_GEMINI_MODELS.entries()) {
      const startedAt = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          idx === 0 ? GEMINI_FIRST_MODEL_TIMEOUT_MS : GEMINI_FALLBACK_MODEL_TIMEOUT_MS,
        );
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: "POST",
            signal: controller.signal,
            headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey || "" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: "ขยายความไพ่ใบนี้ให้หน่อย" }] }],
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: { temperature: 0.7 },
            }),
          },
        );
        clearTimeout(timeoutId);
        const elapsedMs = Date.now() - startedAt;

        if (!res.ok) {
          out.push({
            model,
            ok: false,
            status: res.status,
            elapsedMs,
            error: scrub(await res.text().catch(() => "")),
          });
          continue;
        }
        const data = (await res.json()) as any;
        const answer = extractGeminiAnswer(data);
        out.push({
          model,
          ok: !!answer,
          status: 200,
          elapsedMs,
          promptChars: systemInstruction.length,
          finishReason: data?.candidates?.[0]?.finishReason ?? null,
          answerPreview: answer.slice(0, 160),
          error: answer ? null : "ตอบ 200 แต่แยกข้อความคำตอบไม่ได้",
        });
        if (answer) break; // เจอตัวที่ตอบได้แล้ว เหมือนห้องคุยจริงที่จะหยุดที่ตัวแรกที่สำเร็จ
      } catch (e) {
        out.push({
          model,
          ok: false,
          status: null,
          elapsedMs: Date.now() - startedAt,
          error: scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e)),
        });
      }
    }
  }

  // ถ้า Gemini ไม่สำเร็จ หรือมี Groq สำรองอยู่ ให้ทดสอบยิงแชทจริงผ่าน Groq ด้วย
  if (groqKey && !out.some((m) => m.ok)) {
    const startedAt = Date.now();
    try {
      const { generateGroqChatReply } = await import("@/lib/ai/groq");
      const groqRes = await generateGroqChatReply({
        systemInstruction,
        messages: [{ role: "user", content: "ขยายความไพ่ใบนี้ให้หน่อย" }],
        apiKey: groqKey,
      });
      if (groqRes && groqRes.reply) {
        const cleanReply = stripThinkingTags(groqRes.reply);
        out.push({
          model: `groq · ${groqRes.model}`,
          ok: cleanReply.length > 0,
          status: 200,
          elapsedMs: groqRes.elapsedMs,
          promptChars: systemInstruction.length,
          finishReason: "STOP",
          answerPreview: cleanReply.slice(0, 160),
          error: cleanReply.length > 0 ? null : "ตอบ 200 แต่ไม่มีข้อความคำตอบหลังตัด thinking tags",
        });
      }
    } catch (e) {
      out.push({
        model: "groq",
        ok: false,
        status: null,
        elapsedMs: Date.now() - startedAt,
        error: scrub(e instanceof Error ? `${e.name}: ${e.message}` : String(e)),
      });
    }
  }

  return out;
}
