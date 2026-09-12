/**
 * scripts/qa/probe-openrouter.ts
 * ---------------------------------------------------------------------------
 * 🧪 ทดสอบโมเดลฟรีบน OpenRouter ว่า "ใช้ได้จริง" ก่อนต่อเข้าโค้ด production
 *
 * ทำไมต้องมีสคริปต์นี้: บทเรียน INC-0053 — ห้ามเดาว่าโมเดลไหนใช้ได้ ต้องวัดจริง
 * (เคยเจอ gemini-3.7-flash / gemini-flash-latest อยู่ในลิสต์แต่ตายสนิท 0/3 ครั้ง)
 *
 * สคริปต์นี้:
 *   1. ดึงลิสต์โมเดลฟรีจริงจาก GET /api/v1/models (pricing.prompt === "0")
 *      — ไม่ hardcode ชื่อโมเดล เพราะ OpenRouter เพิ่ม/ถอดโมเดลฟรีบ่อยมาก
 *   2. ยิงคำถามภาษาไทยสั้น ๆ เข้าแต่ละโมเดล วัด latency + เช็กอักษรต่างด้าวหลุด
 *   3. สรุปตารางผ่าน/ไม่ผ่าน เรียงตามความเร็ว
 *
 * ⚠️ ต้นทุน: โมเดลฟรีไม่มีค่าใช้จ่าย แต่มีเพดาน rate limit ต่ำ (20 req/min)
 *    รันด้วยมือเท่านั้น ห้ามผูกเข้า CI / repo:verify
 *
 * วิธีรัน:
 *   export OPENROUTER_API_KEY=sk-or-...   # สร้างที่ https://openrouter.ai/keys (ฟรี ไม่ต้องผูกบัตร)
 *   npx tsx scripts/qa/probe-openrouter.ts
 *   npx tsx scripts/qa/probe-openrouter.ts --limit 5   # ทดสอบแค่ 5 ตัวแรก (เร็วขึ้น)
 */

import { hasForeignScript } from "../../src/lib/ai/language";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

const TEST_PROMPT =
  "ตอบเป็นภาษาไทยล้วนสั้น ๆ ไม่เกิน 2 ประโยค: ไพ่ทาโรต์ The Fool สื่อถึงอะไร";

interface OpenRouterModel {
  id: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
}

interface ProbeResult {
  model: string;
  ok: boolean;
  status: number | null;
  elapsedMs: number;
  hasForeignLeak: boolean;
  answerPreview: string;
  error: string | null;
}

async function fetchFreeModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(OPENROUTER_MODELS_URL);
  if (!res.ok) {
    throw new Error(`ดึงลิสต์โมเดลไม่สำเร็จ: HTTP ${res.status}`);
  }
  const data = (await res.json()) as { data: OpenRouterModel[] };
  return data.data.filter(
    (m) => m.pricing?.prompt === "0" && m.pricing?.completion === "0",
  );
}

async function probeModel(apiKey: string, model: string): Promise<ProbeResult> {
  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    const res = await fetch(OPENROUTER_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // OpenRouter แนะนำให้ใส่สองอันนี้ (ไม่บังคับ แต่ช่วยไม่ให้โดนจัดลำดับความสำคัญต่ำ)
        "HTTP-Referer": "https://tarot-web.local",
        "X-Title": "tarot-web free-model probe",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: TEST_PROMPT }],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    clearTimeout(timeoutId);
    const elapsedMs = Date.now() - startedAt;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        model,
        ok: false,
        status: res.status,
        elapsedMs,
        hasForeignLeak: false,
        answerPreview: "",
        error: errText.slice(0, 200),
      };
    }

    const data = (await res.json()) as any;
    const answer: string = data?.choices?.[0]?.message?.content?.trim() || "";

    return {
      model,
      ok: answer.length > 0,
      status: res.status,
      elapsedMs,
      hasForeignLeak: hasForeignScript(answer),
      answerPreview: answer.slice(0, 100),
      error: answer ? null : "200 แต่ไม่มีข้อความตอบกลับ",
    };
  } catch (err) {
    return {
      model,
      ok: false,
      status: null,
      elapsedMs: Date.now() - startedAt,
      hasForeignLeak: false,
      answerPreview: "",
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
    };
  }
}

async function main() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ ไม่พบ OPENROUTER_API_KEY");
    console.error("   สร้างคีย์ฟรีที่ https://openrouter.ai/keys แล้ว:");
    console.error("   export OPENROUTER_API_KEY=sk-or-...");
    process.exit(1);
  }

  const limitArg = process.argv.find((a) => a.startsWith("--limit"));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] || process.argv[process.argv.indexOf(limitArg) + 1], 10) : undefined;

  console.log("🔎 ดึงลิสต์โมเดลฟรีจาก OpenRouter...\n");
  const freeModels = await fetchFreeModels();
  const toTest = (limit ? freeModels.slice(0, limit) : freeModels).filter(
    // ตัดโมเดลที่ไม่ใช่ text chat ออก (เช่น lyria = สร้างเพลง)
    (m) => !m.id.includes("lyria"),
  );

  console.log(`พบโมเดลฟรีทั้งหมด ${freeModels.length} ตัว — จะทดสอบ ${toTest.length} ตัว\n`);

  const results: ProbeResult[] = [];
  for (const m of toTest) {
    process.stdout.write(`  กำลังยิง ${m.id} ... `);
    const r = await probeModel(apiKey, m.id);
    results.push(r);
    console.log(r.ok && !r.hasForeignLeak ? `✅ ${r.elapsedMs}ms` : `❌ ${r.error || "มีอักษรต่างด้าวปน"}`);
  }

  const good = results
    .filter((r) => r.ok && !r.hasForeignLeak)
    .sort((a, b) => a.elapsedMs - b.elapsedMs);
  const bad = results.filter((r) => !r.ok || r.hasForeignLeak);

  console.log("\n📊 สรุปผล — ใช้ได้จริง (เรียงตามความเร็ว):\n");
  if (good.length === 0) {
    console.log("  (ไม่มีตัวไหนผ่านเลย)");
  }
  for (const r of good) {
    console.log(`  ✅ ${r.model.padEnd(45)} ${String(r.elapsedMs).padStart(6)}ms  "${r.answerPreview}"`);
  }

  console.log("\n❌ ใช้ไม่ได้ / มีปัญหา:\n");
  for (const r of bad) {
    console.log(`  ❌ ${r.model.padEnd(45)} status=${r.status ?? "-"}  ${r.error || "มีอักษรต่างด้าวปนคำตอบ"}`);
  }
}

main().catch((err) => {
  console.error("สคริปต์ล้มเหลว:", err);
  process.exit(1);
});
