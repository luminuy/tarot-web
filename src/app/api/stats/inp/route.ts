import { apiFail, apiOk } from "@/lib/api/envelope";
import { InpReportSchema, recordInpReport } from "@/lib/observability/inp-metrics";
import { getRumMetricsDataset } from "@/lib/platform/cf";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { checkRateLimit, getClientIdentifier } from "@/lib/utils/rate-limit";

export const runtime = "nodejs";

/**
 * POST /api/stats/inp — INP ผู้ใช้จริงพร้อมตัวการ ➔ Analytics Engine (`inp-metrics.ts`)
 *
 * ไคลเอนต์ (`inp-reporter.ts`) ส่งครั้งเดียวต่อหน้า ตอนแท็บถูกซ่อน และเฉพาะเมื่อ INP ≥ 200 ms
 * 🔒 รับเฉพาะคำขอจากเว็บเราเอง · สคีมาเข้ม (ไม่มีข้อความอิสระ) · ไม่เก็บ IP
 * เพดานถี่ใช้ตัวนับในหน่วยความจำ ไม่ใช่ D1 — สถิติไม่คุ้มกับการเขียนฐานข้อมูลทุกคำขอ
 * เกินเพดาน = ทิ้งเงียบ ๆ ตอบ 200 (beacon ไม่อ่านคำตอบอยู่แล้ว ไม่ต้องบอกผู้ยิงว่าโดนจำกัด)
 */

const LIMIT = { maxRequests: 20, windowSeconds: 600 };
const MAX_BODY_BYTES = 2048;

export async function POST(request: Request) {
  if (!isRequestAuthorizedOrigin(request)) {
    return apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403, "forbidden_origin");
  }

  const limit = checkRateLimit(`inp:${getClientIdentifier(request)}`, LIMIT);
  limit.releaseConcurrency();
  if (!limit.allowed) return apiOk();

  const text = await request.text().catch(() => "");
  if (text.length > MAX_BODY_BYTES) return apiFail("ข้อมูลใหญ่เกินไป", 413, "too_large");
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    // ตกด่านสคีมาข้างล่างเอง
  }
  const parsed = InpReportSchema.safeParse(body);
  if (!parsed.success) return apiFail("รูปแบบข้อมูลคำขอไม่ถูกต้อง", 400, "invalid_body");

  recordInpReport(await getRumMetricsDataset(), parsed.data, request.headers.get("user-agent"));
  return apiOk();
}
