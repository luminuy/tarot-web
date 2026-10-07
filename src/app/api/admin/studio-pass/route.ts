import { z } from "zod";

import { apiFail, apiOk } from "@/lib/api/envelope";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getReaderById, listReaders } from "@/lib/marketplace/readers.repo";
import {
  STUDIO_PASS_DAYS,
  STUDIO_PASS_PRICE_MAX_THB,
  STUDIO_PASS_PRICE_MIN_THB,
  envPassPriceThb,
  getAdminDefaultPassPriceThb,
  listReaderPassAdminRows,
  setAdminDefaultPassPriceThb,
  setReaderPassPriceThb,
} from "@/lib/studio/plan";

export const runtime = "nodejs";

/**
 * ราคาบัตรผ่านสตูดิโอแม่หมอ 30 วัน — แอดมินตั้งเองได้ไม่ต้อง deploy (แท็บ "หมอดูพาร์ทเนอร์")
 *  GET   ราคากลาง + ราคาเฉพาะคนของแม่หมอทุกคน + วันหมดบัตรผ่าน
 *  PUT   { defaultPriceThb: number | null }            ราคากลาง (null = กลับไปใช้ค่าตั้งต้นใน wrangler.jsonc)
 *  PATCH { readerId, priceThb: number | null }         ราคาเฉพาะแม่หมอคนนั้น (null = ใช้ราคากลาง)
 * ราคาใหม่มีผลกับการกดซื้อครั้งถัดไปเท่านั้น — คำสั่งซื้อที่เริ่มแล้วถูกตรวจยอดกับแถว payments ของมันเอง
 */

const Price = z.number().int().min(STUDIO_PASS_PRICE_MIN_THB).max(STUDIO_PASS_PRICE_MAX_THB).nullable();
const PutBody = z.object({ defaultPriceThb: Price });
const PatchBody = z.object({ readerId: z.string().trim().min(1).max(80), priceThb: Price });

const PRICE_ERROR = `ราคาต้องเป็นบาทเต็ม ${STUDIO_PASS_PRICE_MIN_THB}–${STUDIO_PASS_PRICE_MAX_THB.toLocaleString("th-TH")} บาท (เว้นว่าง = ใช้ราคากลาง)`;

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const [adminDefault, readers, rows] = await Promise.all([
      getAdminDefaultPassPriceThb(),
      listReaders(),
      listReaderPassAdminRows(),
    ]);
    const envDefault = envPassPriceThb();
    const byReader = new Map(rows.map((r) => [r.readerId, r]));
    const now = Date.now();
    return apiOk({
      days: STUDIO_PASS_DAYS,
      minThb: STUDIO_PASS_PRICE_MIN_THB,
      maxThb: STUDIO_PASS_PRICE_MAX_THB,
      adminDefaultThb: adminDefault,
      envDefaultThb: envDefault,
      effectiveDefaultThb: adminDefault ?? envDefault,
      readers: readers.map((r) => {
        const row = byReader.get(r.id);
        const proUntil = row?.proUntil && row.proUntil > now ? row.proUntil : null;
        return { id: r.id, displayName: r.displayName, status: r.status, priceThb: row?.priceThb ?? null, proUntil };
      }),
    });
  } catch (err) {
    console.error("[API Admin Studio Pass GET]", err);
    return apiFail("โหลดราคาบัตรผ่านไม่สำเร็จ", 500);
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = PutBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiFail(PRICE_ERROR, 400);
  try {
    const before = await getAdminDefaultPassPriceThb();
    await setAdminDefaultPassPriceThb(parsed.data.defaultPriceThb);
    await recordAudit(
      "studio_pass_default_price",
      `ราคากลางบัตรผ่านสตูดิโอ ${before ?? "ค่าตั้งต้น"} ➔ ${parsed.data.defaultPriceThb ?? `ค่าตั้งต้น (${envPassPriceThb() ?? "ไม่เปิดขาย"})`} บาท`,
    );
    return apiOk({ adminDefaultThb: parsed.data.defaultPriceThb });
  } catch (err) {
    console.error("[API Admin Studio Pass PUT]", err);
    return apiFail("บันทึกราคากลางไม่สำเร็จ", 500);
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const parsed = PatchBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiFail(PRICE_ERROR, 400);
  const { readerId, priceThb } = parsed.data;
  try {
    const reader = await getReaderById(readerId);
    if (!reader) return apiFail("ไม่พบแม่หมอที่ระบุ", 404);
    await setReaderPassPriceThb(readerId, priceThb);
    await recordAudit(
      "studio_pass_reader_price",
      `ราคาบัตรผ่านสตูดิโอของ ${reader.displayName} (${readerId}) ➔ ${priceThb ?? "ราคากลาง"}${priceThb ? " บาท" : ""}`,
    );
    return apiOk({ readerId, priceThb });
  } catch (err) {
    console.error("[API Admin Studio Pass PATCH]", err);
    return apiFail("บันทึกราคาของแม่หมอไม่สำเร็จ", 500);
  }
}
