import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-admin";
import { kvGetJSON, KEY } from "@/lib/platform/kv-store";
import { utcDay } from "@/lib/stats/record";
import { getAiDailyCap } from "@/lib/security/ai-budget";
import { CANDIDATE_GEMINI_MODELS, extractGeminiAnswer } from "@/lib/ai/gemini";

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

  /** ตัดค่าคีย์ออกจากข้อความก่อนส่งกลับหน้าเว็บ ป้องกันคีย์หลุดผ่านข้อความ error */
  const scrub = (text: string) =>
    (apiKey ? text.split(apiKey).join("***") : text).slice(0, 400);

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
    configured: !!apiKey,
    envVar: keyFromEnv,
    length: apiKey?.length ?? 0,
    looksLikeGoogleKey: !!apiKey && apiKey.startsWith("AIza"),
  };

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      verdict: "no_api_key",
      summary:
        "ยังไม่ได้ตั้ง GEMINI_API_KEY (หรือ GOOGLE_API_KEY) บน Worker — คำอ่านและห้องคุยจะตกไปใช้คำตอบสำเร็จรูปทั้งหมด",
      nextStep: "รัน: npx wrangler secret put GEMINI_API_KEY แล้ว deploy ใหม่ (ดู docs/PENDING_SETUP.md)",
      key,
      budget,
      models: [],
      checkedAt: new Date().toISOString(),
    });
  }

  // ยิงจริงทีละโมเดล ด้วย prompt สั้นที่สุดเท่าที่จะสั้นได้ (ค่าใช้จ่ายแทบเป็นศูนย์)
  const models: Array<Record<string, unknown>> = [];
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
          headers: { "Content-Type": "application/json", "X-goog-api-key": apiKey },
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

  const working = models.filter((m) => m.ok);
  const ok = working.length > 0;

  let verdict: string;
  let summary: string;
  let nextStep: string;
  if (ok && budget.memberCapReached) {
    verdict = "ai_daily_cap";
    summary = `Gemini เรียกได้ปกติ แต่วันนี้ใช้ครบเพดานแล้ว (${usedToday}/${cap} ครั้ง) ระบบจึงตัดไปใช้คำตอบสำรอง`;
    nextStep = "ขยายเพดานด้วย env AI_DAILY_CALL_CAP หรือรอรีเซ็ตเที่ยงคืน UTC";
  } else if (ok) {
    verdict = "healthy";
    summary = `เชื่อมต่อ Gemini ได้ปกติ ${working.length}/${models.length} โมเดล — แม่หมอตอบด้วย AI จริงได้แล้ว`;
    nextStep = "ถ้าหน้าเว็บยังขึ้นแถบคำตอบสำรองอยู่ ให้ลองรีเฟรชหน้าและถามใหม่อีกครั้ง";
  } else {
    verdict = "gemini_unavailable";
    summary = "มีคีย์อยู่ แต่เรียก Gemini ไม่สำเร็จสักโมเดล — ดูช่อง error ของแต่ละโมเดลด้านล่าง";
    nextStep =
      "status 400 = คีย์/พารามิเตอร์ผิด · 403 = คีย์ถูกปิดหรือไม่ได้เปิด Generative Language API · 429 = โควตา Google หมด · 404 = ชื่อโมเดลถูกปลดแล้ว";
  }

  return NextResponse.json({
    ok,
    verdict,
    summary,
    nextStep,
    key,
    budget,
    models,
    checkedAt: new Date().toISOString(),
  });
}
