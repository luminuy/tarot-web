/**
 * ☁️ Cloudflare AI Gateway — ท่อกลางสำหรับการเรียก AI ทุก provider
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี: ตอนนี้เรายิงตรงไป Gemini / Groq / Anthropic กระจายอยู่ 6 จุด
 * ไม่มีที่รวม log ค่าใช้จ่าย, latency, อัตราพลาด หรือแคชคำตอบซ้ำเลย
 *
 * AI Gateway (ฟรี) ให้ทั้งหมดนั้นโดย "เปลี่ยนแค่ base URL":
 *   - Dashboard เดียวเห็นทุก request/ราคา/ความเร็ว แยกตาม provider + model
 *   - แคช response (คุมรายเส้นด้วย `cf-aig-cache-ttl` — ดู aiGatewayHeaders)
 *     ⚠️ คำอ่านไพ่/แชท บังคับ ttl=0 เสมอ: ต้องสด + cache hit ทำให้ usage=0 → ระบบไม่หักโควตา
 *   - rate-limit / retry / fallback ระดับ gateway
 *
 * ⚙️ การตั้งค่า (ไม่บังคับ — ไม่ตั้งก็ยิงตรงเหมือนเดิม ไม่พัง):
 *   CF_AI_GATEWAY_ACCOUNT_ID = <Cloudflare account id>
 *   CF_AI_GATEWAY_ID         = <ชื่อ gateway ที่สร้างใน dashboard>
 *   CF_AI_GATEWAY_TOKEN      = <ไม่บังคับ — ใส่เมื่อเปิด "Authenticated Gateway">
 *
 * รูปแบบ URL ปลายทาง:
 *   https://gateway.ai.cloudflare.com/v1/{account}/{gateway}/{provider}/{path}
 *   provider slug: google-ai-studio | groq | anthropic
 *
 * ⚠️ ใช้ฝั่งเซิร์ฟเวอร์เท่านั้น (อ่าน env ของ Worker) — ห้าม import จาก client component
 *    ไม่ใส่ `import "server-only"` เพราะ groq.ts ถูกทดสอบผ่าน tsx (scripts/qa) ซึ่ง resolve ไม่ได้
 */

const GATEWAY_HOST = "https://gateway.ai.cloudflare.com/v1";

function gatewayBase(): string | null {
  const account = process.env.CF_AI_GATEWAY_ACCOUNT_ID?.trim();
  const gateway = process.env.CF_AI_GATEWAY_ID?.trim();
  if (!account || !gateway) return null;
  return `${GATEWAY_HOST}/${account}/${gateway}`;
}

/** เปิดใช้ AI Gateway อยู่หรือไม่ (มีทั้ง account id + gateway id) */
export function isAiGatewayEnabled(): boolean {
  return gatewayBase() !== null;
}

/**
 * Header เสริมสำหรับ AI Gateway (ผสานเข้ากับ headers เดิมของแต่ละ provider)
 * - `cf-aig-authorization` ใส่เฉพาะเมื่อเปิด Authenticated Gateway
 * - `cf-aig-cache-ttl` คุมการแคชระดับ request:
 *     0        = ห้ามแคชเด็ดขาด (ใช้กับคำอ่านไพ่ / แชท — ต้องสด + กันหักโควตาพลาด)
 *     > 0      = แคชได้ N วินาที (ใช้กับ safety classifier / สรุปรายเดือน)
 *     undefined = ตามค่า default ของ gateway
 *
 * คืน object ว่างถ้าไม่ได้เปิด gateway — spread เข้าไปได้เลยไม่ต้องเช็ค
 */
export function aiGatewayHeaders(opts: { cacheTtl?: number } = {}): Record<string, string> {
  if (!isAiGatewayEnabled()) return {};
  const headers: Record<string, string> = {};
  const token = process.env.CF_AI_GATEWAY_TOKEN?.trim();
  if (token) headers["cf-aig-authorization"] = `Bearer ${token}`;
  if (typeof opts.cacheTtl === "number" && opts.cacheTtl >= 0) {
    headers["cf-aig-cache-ttl"] = String(Math.floor(opts.cacheTtl));
  }
  return headers;
}

/**
 * Endpoint ของ Google Gemini (google-ai-studio)
 * ผ่าน gateway ถ้าตั้งค่าไว้ ไม่งั้นยิงตรง generativelanguage.googleapis.com
 * header auth ยังเป็น `x-goog-api-key` เหมือนเดิมทั้งสองทาง
 */
export function geminiEndpoint(
  model: string,
  method: "generateContent" | "streamGenerateContent",
  opts: { sse?: boolean } = {},
): string {
  const path = `/v1beta/models/${model}:${method}${opts.sse ? "?alt=sse" : ""}`;
  const base = gatewayBase();
  return base
    ? `${base}/google-ai-studio${path}`
    : `https://generativelanguage.googleapis.com${path}`;
}

/**
 * Endpoint chat completions ของ Groq (OpenAI-compatible)
 * ผ่าน gateway ถ้าตั้งค่าไว้ ไม่งั้นยิงตรง api.groq.com
 * header auth ยังเป็น `Authorization: Bearer` เหมือนเดิม
 */
export function groqChatCompletionsEndpoint(): string {
  const base = gatewayBase();
  return base
    ? `${base}/groq/chat/completions`
    : "https://api.groq.com/openai/v1/chat/completions";
}

/**
 * baseURL สำหรับ Anthropic SDK (`new Anthropic({ baseURL })`)
 * คืน `undefined` เมื่อไม่ได้เปิด gateway → SDK ใช้ค่า default (api.anthropic.com)
 */
export function anthropicBaseUrl(): string | undefined {
  const base = gatewayBase();
  return base ? `${base}/anthropic` : undefined;
}
