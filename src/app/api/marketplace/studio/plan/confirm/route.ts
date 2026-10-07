import { z } from "zod";
import { apiFail, apiOk } from "@/lib/api/envelope";
import { retrieveGatewayCharge } from "@/lib/marketplace/payment-gateway";
import { getPaymentByOrderId, updatePaymentStatus } from "@/lib/marketplace/payments.repo";
import { readJson, studioGate } from "@/lib/studio/gate";
import { getStudioPassOrder, grantStudioPass, isStudioPassOrder, resolvePassPriceThb, studioPlanView } from "@/lib/studio/plan";
import { studioDraftsPerDay } from "@/lib/studio/quota";
import { getStudioSettings } from "@/lib/studio/studio.repo";

export const runtime = "nodejs";

const Body = z.object({ orderId: z.string().max(40), testChargeId: z.string().max(64).optional() });

/**
 * POST /api/marketplace/studio/plan/confirm — กลับจากหน้าจ่ายเงิน (เผื่อ webhook มาช้า/หาย)
 * หลักฐานการจ่ายมีทางเดียวที่นี่: ถาม Stripe เองด้วยคีย์ลับ (ยอด/สกุลเงินต้องตรงแถวของเรา)
 * ตัวจำลอง (ไม่มีคีย์ Stripe) ยืนยันได้เฉพาะนอก production · ให้วันซ้ำไม่ได้ (`grantStudioPass`)
 */
export async function POST(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const parsed = Body.safeParse(await readJson(request));
  if (!parsed.success || !isStudioPassOrder(parsed.data.orderId)) return apiFail("ไม่พบคำสั่งซื้อ", 404);
  const { orderId, testChargeId } = parsed.data;
  const order = await getStudioPassOrder(orderId);
  // คำสั่งซื้อของแม่หมอคนอื่น = ตอบเหมือนไม่มี
  if (!order || order.readerId !== gate.readerId) return apiFail("ไม่พบคำสั่งซื้อ", 404);
  const payment = await getPaymentByOrderId(orderId);
  if (!payment) return apiFail("ไม่พบคำสั่งซื้อ", 404);

  const view = async () =>
    studioPlanView((await getStudioSettings(gate.readerId)).proUntil, studioDraftsPerDay(), await resolvePassPriceThb(gate.readerId));
  if (order.grantedAt) return apiOk({ status: "granted", plan: await view() });
  if (order.revokedAt) return apiFail("คำสั่งซื้อนี้ถูกคืนเงินแล้ว", 409, "refunded");

  let paid = false;
  if (payment.provider === "stripe" && payment.providerRef) {
    const charge = await retrieveGatewayCharge(payment.providerRef);
    if (!charge) return apiFail("ยังยืนยันการชำระเงินไม่ได้ ลองใหม่อีกครั้งในอีกสักครู่", 502, "gateway_unreachable");
    paid = charge.status === "paid" && charge.amountSatang === payment.amountSatang && charge.currency === payment.currency;
    if (charge.status === "pending") return apiOk({ status: "pending", plan: await view() });
  } else if (payment.provider === "simulator") {
    paid = process.env.NODE_ENV !== "production" && Boolean(testChargeId) && testChargeId === payment.providerRef;
  }
  if (!paid) return apiFail("การชำระเงินยังไม่สำเร็จ", 402, "not_paid");

  if (payment.status !== "paid") await updatePaymentStatus(payment.id, "paid", { providerRef: payment.providerRef ?? undefined });
  const res = await grantStudioPass(orderId);
  if (res === "failed") return apiFail("บันทึกบัตรผ่านไม่สำเร็จ กรุณาลองใหม่", 500);
  return apiOk({ status: "granted", plan: await view() });
}
