import type { NextResponse } from "next/server";
import { apiFail } from "@/lib/api/envelope";
import { requireReader } from "@/lib/auth/reader-auth";
import type { Reader } from "@/lib/marketplace/readers.repo";
import { isRequestAuthorizedOrigin } from "@/lib/security/anti-theft";
import { hasAcceptedDpa, isStudioEnabled } from "@/lib/studio/dpa";
import { getStudioSettings, type StudioSettings } from "@/lib/studio/studio.repo";

/**
 * 🚪 ด่านเดียวของทุก API ใน `/api/marketplace/studio/*` (เรียงจากถูกไปแพง)
 *  1. คำขอที่เขียนข้อมูล ➔ ต้องมาจากเว็บเรา (กัน CSRF) — Bearer ผ่านได้เพราะเบราว์เซอร์ไม่แนบให้เอง
 *  2. สตูดิโอถูกเปิดด้วย `READER_STUDIO_ENABLED=1` แล้วเท่านั้น (รอข้อตกลง PDPA ฉบับทนาย)
 *  3. แม่หมอที่อนุมัติแล้ว (`requireReader`)
 *  4. ยอมรับข้อตกลงการประมวลผลข้อมูลรุ่นปัจจุบันแล้ว — ยกเว้นเส้นที่ใช้ "ยอมรับ" เอง (`needDpa: false`)
 */
export type StudioGate =
  | { ok: true; readerId: string; reader: Reader; settings: StudioSettings }
  | { ok: false; response: NextResponse | Response };

export async function studioGate(request: Request, opts: { needDpa?: boolean } = {}): Promise<StudioGate> {
  const writes = !["GET", "HEAD"].includes(request.method.toUpperCase());
  if (writes && !isRequestAuthorizedOrigin(request)) {
    return { ok: false, response: apiFail("ไม่อนุญาตให้เข้าถึงจากภายนอก", 403) };
  }
  if (!isStudioEnabled()) {
    return { ok: false, response: apiFail("สตูดิโอแม่หมอยังไม่เปิดให้ใช้งาน", 404, "studio_disabled") };
  }
  const auth = await requireReader(request);
  if (!auth.success) return { ok: false, response: auth.response };
  const settings = await getStudioSettings(auth.readerId);
  if ((opts.needDpa ?? true) && !hasAcceptedDpa(settings.dpaVersion)) {
    return { ok: false, response: apiFail("กรุณาอ่านและยอมรับข้อตกลงการดูแลข้อมูลลูกค้าก่อนใช้สตูดิโอ", 403, "dpa_required") };
  }
  return { ok: true, readerId: auth.readerId, reader: auth.reader, settings };
}

/** อ่าน JSON แบบไม่โยน — ร่างกายเสีย = null */
export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}
