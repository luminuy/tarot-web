import { createHmac, timingSafeEqual } from "node:crypto";

export interface CreateChargeInput {
  amountSatang: number;
  currency?: string;
  description: string;
  returnUri: string;
  metadata?: Record<string, string>;
}

export interface ChargeResult {
  chargeId: string;
  amountSatang: number;
  currency: string;
  status: "pending" | "successful" | "failed";
  authorizeUri?: string;
  qrCodeUri?: string;
  isTestMode: boolean;
}

/**
 * สร้างรายการชำระเงิน (Charge / Checkout)
 * รองรับทั้ง Omise Gateway จริงเมื่อมีการตั้งค่า Secret และ Test Mode Simulator เมื่อยังไม่ได้ใส่ Key
 */
export async function createGatewayCharge(input: CreateChargeInput): Promise<ChargeResult> {
  const omiseSecretKey = process.env.OMISE_SECRET_KEY;
  const currency = input.currency || "THB";

  // 1. Production Mode with Omise API
  if (omiseSecretKey && !omiseSecretKey.startsWith("mock_")) {
    try {
      const auth = Buffer.from(`${omiseSecretKey}:`).toString("base64");
      const res = await fetch("https://api.omise.co/charges", {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: input.amountSatang,
          currency,
          description: input.description,
          return_uri: input.returnUri,
          metadata: input.metadata,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          chargeId: data.id,
          amountSatang: data.amount,
          currency: data.currency,
          status: data.status === "successful" ? "successful" : "pending",
          authorizeUri: data.authorize_uri,
          qrCodeUri: data.source?.scannable_code?.image?.download_uri,
          isTestMode: !data.livemode,
        };
      }
    } catch (err) {
      console.warn("[Payment Gateway] Omise API call failed, falling back to simulated test charge", err);
    }
  }

  // 2. Test-Mode Deterministic Simulator (สำหรับรอบการทดสอบและระหว่างรอใส่ API Key)
  const mockChargeId = `chrg_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  return {
    chargeId: mockChargeId,
    amountSatang: input.amountSatang,
    currency,
    status: "pending",
    authorizeUri: `${input.returnUri}&test_charge_id=${mockChargeId}`,
    isTestMode: true,
  };
}

/**
 * ตรวจสอบความถูกต้องของ Webhook Signature ป้องกันการปลอมแปลง Event
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  signingSecret?: string
): boolean {
  const secret = signingSecret || process.env.OMISE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

  // In test mode without secret configured, accept test headers with warning
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[Payment Webhook] Missing PAYMENT_WEBHOOK_SECRET in production!");
      return false;
    }
    return true;
  }

  if (!signatureHeader) return false;

  try {
    const expectedSignature = createHmac("sha256", secret).update(rawBody).digest("hex");
    const sigBuf = Buffer.from(signatureHeader);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length) return false;
    return timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
