import { apiFail, apiOk } from "@/lib/api/envelope";
import { checkoutArtUrl, createGatewayCharge, isStripeTestModeOnProduction, PAYMENTS_NOT_OPEN_MESSAGE } from "@/lib/marketplace/payment-gateway";
import { createPaymentRecord } from "@/lib/marketplace/payments.repo";
import { resolveAppOrigin } from "@/lib/security/app-origin";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "@/lib/security/edge-ratelimit";
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
import { recordEvent } from "@/lib/stats/record";
import { studioGate } from "@/lib/studio/gate";
import { STUDIO_PASS_DAYS, createStudioPassOrder, newStudioPassOrderId, studioPassPriceSatang } from "@/lib/studio/plan";
import { getNotifyEmail } from "@/lib/studio/plan-email";

export const runtime = "nodejs";

/**
 * POST /api/marketplace/studio/plan/checkout — ซื้อบัตรผ่านสตูดิโอ 30 วัน (จ่ายครั้งเดียว · ไม่ตัดเงินอัตโนมัติ)
 * ราคามาจากเซิร์ฟเวอร์ (`STUDIO_PRO_PRICE_THB`) เท่านั้น · ไม่ตั้งราคา = ยังไม่เปิดขาย (503)
 * กลับจากหน้าจ่าย ➔ `/readers/studio?plan=return&order=...` (ไม่มีโทเคนแม่หมอใน URL ของ Stripe)
 */
export async function POST(request: Request) {
  const gate = await studioGate(request);
  if (!gate.ok) return gate.response;
  const price = studioPassPriceSatang();
  if (price === null) return apiFail("บัตรผ่านสตูดิโอยังไม่เปิดขาย", 503, "plan_closed");
  if (isStripeTestModeOnProduction() && !(await isPrivilegedTestRequest(request))) {
    return apiFail(PAYMENTS_NOT_OPEN_MESSAGE, 503, "payments_closed");
  }
  const limit = await consumeEdgeRateLimits([
    { key: edgeRateLimitKey("studio:plan:checkout", gate.readerId), config: { max: 6, windowSec: 600 } },
  ]);
  if (!limit.allowed) return apiFail("ทำรายการถี่เกินไป รอสักครู่แล้วลองใหม่", 429, "rate_limited");

  try {
    const origin = resolveAppOrigin(request);
    const orderId = newStudioPassOrderId();
    await createStudioPassOrder(gate.readerId, orderId);
    const email = await getNotifyEmail(gate.readerId);
    const charge = await createGatewayCharge({
      amountSatang: price,
      currency: "THB",
      description: `บัตรผ่านสตูดิโอแม่หมอ ${STUDIO_PASS_DAYS} วัน`,
      productDescription: "ร่างคำอ่านด้วย AI ได้มากขึ้นต่อวัน · จ่ายครั้งเดียว ไม่ตัดเงินอัตโนมัติ · ซื้อซ้ำก่อนหมดได้ วันต่อจากเดิม",
      imageUrl: checkoutArtUrl(origin, "consultation"),
      customerEmail: email ?? undefined,
      submitMessage: "บัตรผ่านเริ่มใช้ได้ทันทีหลังชำระเงิน",
      returnUri: `${origin}/readers/studio?plan=return&order=${orderId}`,
      cancelUri: `${origin}/readers/studio?plan=cancelled`,
      referenceId: orderId,
      locale: "th",
      metadata: { kind: "studio_pass", orderId, readerId: gate.readerId, days: String(STUDIO_PASS_DAYS) },
      idempotencyKey: orderId,
    });
    await createPaymentRecord({ orderId, userId: null, provider: charge.provider, providerRef: charge.chargeId, amountSatang: price, currency: "THB" });
    recordEvent("studio_pass_checkout");
    return apiOk({ orderId, provider: charge.provider, authorizeUri: charge.authorizeUri, isTestMode: charge.isTestMode });
  } catch (err) {
    console.error("[Studio pass checkout]", err);
    return apiFail("เริ่มการชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", 500);
  }
}
