import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 💳 เกตเวย์รับชำระเงิน — Stripe Checkout (หน้าจ่ายเงินของ Stripe เอง)
 * ===========================================================================
 * เราไม่เก็บข้อมูลบัตรเลย: สร้าง Checkout Session แล้วพาผู้ใช้ไปจ่ายที่ `checkout.stripe.com`
 * (บัตร · PromptPay · ช่องทางอื่นที่เปิดไว้ในแดชบอร์ด Stripe) จากนั้น Stripe ส่งกลับมาที่ `successUri`
 *
 * หลักฐานการจ่ายเงินมีได้สองทางเท่านั้น และปลอมไม่ได้ทั้งคู่:
 *   1. webhook ที่ผ่าน `verifyWebhookSignature` (ลายเซ็น `Stripe-Signature`)
 *   2. เซิร์ฟเวอร์เราถาม Stripe เองด้วยคีย์ลับ (`retrieveGatewayCharge`)
 *
 * ไม่ได้ตั้ง `STRIPE_SECRET_KEY` = ใช้ตัวจำลอง (`provider = simulator`) ซึ่งผ่านด่านยืนยัน
 * ได้เฉพาะนอก production (ดู `decidePurchaseGrant`)
 */

const STRIPE_API = "https://api.stripe.com/v1";
/** Stripe ตอบช้าเกินนี้ = ถือว่าล้ม · ห้ามให้คำขอซื้อค้างไม่มีกำหนด */
const STRIPE_TIMEOUT_MS = 10_000;

export type GatewayProvider = "stripe" | "simulator";

export interface CreateChargeInput {
  amountSatang: number;
  currency?: string;
  description: string;
  /** ปลายทางหลังจ่ายสำเร็จ (ต้องมี query string อยู่แล้ว — ตัวจำลองต่อท้ายด้วย `&`) */
  returnUri: string;
  /** ปลายทางเมื่อผู้ใช้กดยกเลิกในหน้าจ่ายเงิน */
  cancelUri: string;
  /** เลขอ้างอิงของเรา (เลขออร์เดอร์ / เลขจอง) — ส่งเป็น `client_reference_id` ให้ค้นในแดชบอร์ด Stripe ได้ */
  referenceId: string;
  locale?: "th" | "en";
  metadata?: Record<string, string>;
  /** บรรทัดรองใต้ชื่อสินค้าในหน้าจ่ายเงิน Stripe */
  productDescription?: string;
  /** รูปสินค้า (URL สาธารณะ — Stripe ดึงรูปเอง) */
  imageUrl?: string;
  /** อีเมลบัญชีที่ล็อกอินอยู่ — เติมให้ในหน้า Stripe ผู้ใช้ไม่ต้องพิมพ์ซ้ำ */
  customerEmail?: string;
  /** ข้อความเล็กใต้ปุ่มจ่ายเงิน */
  submitMessage?: string;
  /**
   * เวลาที่หน้าจ่ายเงินหมดอายุ (unix วินาที · Stripe รับ 30 นาทีถึง 24 ชม. นับจากตอนสร้าง)
   * ใช้กับการจองที่ "กันที่นั่ง" ไว้ — หน้าจ่ายต้องหมดอายุก่อนที่นั่งถูกปล่อยเสมอ
   */
  expiresAt?: number;
  /** กุญแจกันสร้างซ้ำ (`Idempotency-Key`) — กดซ้ำ/เน็ตหลุดแล้วยิงใหม่ได้ session เดิม ไม่ใช่ใบใหม่ */
  idempotencyKey?: string;
}

export interface ChargeResult {
  /** Checkout Session id (`cs_...`) หรือ id ของตัวจำลอง — เก็บลง `payments.provider_ref` */
  chargeId: string;
  amountSatang: number;
  currency: string;
  status: "pending" | "successful" | "failed";
  provider: GatewayProvider;
  /** หน้าที่ต้องพาผู้ใช้ไปจ่ายเงิน */
  authorizeUri?: string;
  isTestMode: boolean;
}

/** คีย์ลับของ Stripe ที่ใช้งานได้จริง (ค่า `mock_...` = ตั้งใจใช้ตัวจำลอง) */
function stripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY;
  return key && !key.startsWith("mock_") ? key : null;
}

/**
 * 🔒 คีย์ทดสอบ (`sk_test_` / `rk_test_`) บน production — ช่วงทดสอบบนเว็บจริงก่อนเปิดบัญชี live
 *
 * ระหว่างนี้ใครก็จ่ายด้วยบัตรทดสอบ `4242 4242 4242 4242` ได้และเว็บจะแจกเครดิตจริง
 * จุดสร้างรายการชำระเงินทุกจุดจึงต้องเรียกฟังก์ชันนี้ แล้วเปิดให้เฉพาะผู้ทดสอบ (`isPrivilegedTestRequest`)
 * พอเปลี่ยนเป็น `sk_live_` ด่านนี้คืน false เองโดยไม่ต้องแก้โค้ด
 */
export function isStripeTestModeOnProduction(): boolean {
  const key = stripeSecretKey();
  return !!key && /^(sk|rk)_test_/.test(key) && process.env.NODE_ENV === "production";
}

export const PAYMENTS_NOT_OPEN_MESSAGE = "ระบบชำระเงินยังไม่เปิดให้บริการ กรุณากลับมาใหม่เร็ว ๆ นี้";

/** แปลง object ซ้อนเป็น form body แบบที่ Stripe รับ (`a[b][0][c]=...`) */
export function toStripeForm(params: Record<string, unknown>, prefix = "", out = new URLSearchParams()): URLSearchParams {
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(value)) {
      value.forEach((item, i) => {
        if (item !== null && typeof item === "object") toStripeForm(item as Record<string, unknown>, `${name}[${i}]`, out);
        else out.append(`${name}[${i}]`, String(item));
      });
    } else if (typeof value === "object") {
      toStripeForm(value as Record<string, unknown>, name, out);
    } else {
      out.append(name, String(value));
    }
  }
  return out;
}

async function stripeRequest(
  key: string,
  method: "GET" | "POST",
  path: string,
  body?: URLSearchParams,
  idempotencyKey?: string,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { Authorization: `Bearer ${key}` };
  if (body) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const res = await fetch(`${STRIPE_API}${path}`, {
    method,
    headers,
    body: body?.toString(),
    signal: AbortSignal.timeout(STRIPE_TIMEOUT_MS),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    // ห้ามโยนข้อความดิบของ Stripe ขึ้นหน้าเว็บ (A1-08) — ผู้เรียกจับแล้วตอบข้อความคงที่เอง
    const err = (data.error ?? {}) as Record<string, unknown>;
    throw new Error(`[Stripe] ${method} ${path} → ${res.status} ${String(err.type ?? "")} ${String(err.code ?? "")}`.trim());
  }
  return data;
}

/**
 * สร้างรายการชำระเงิน (Stripe Checkout Session)
 *
 * ⚠️ มีคีย์ Stripe แล้วเรียกไม่สำเร็จ = โยน error ออกไป **ห้ามถอยไปตัวจำลองเงียบ ๆ**
 *    ของเดิม (ยุค Omise) ถอยไปตัวจำลอง ผู้ใช้บน production จึงเห็นหน้าจ่ายปลอม
 *    แล้วกดยืนยันไม่ผ่านโดยไม่มีใครรู้ว่าเกตเวย์ล่ม
 */
export async function createGatewayCharge(input: CreateChargeInput): Promise<ChargeResult> {
  const currency = (input.currency || "THB").toUpperCase();
  const key = stripeSecretKey();

  if (key) {
    const metadata = input.metadata ?? {};
    const body = toStripeForm({
      mode: "payment",
      success_url: input.returnUri,
      cancel_url: input.cancelUri,
      client_reference_id: input.referenceId,
      locale: input.locale === "en" ? "en" : "th",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: input.amountSatang,
            product_data: {
              name: input.description,
              description: input.productDescription,
              images: input.imageUrl ? [input.imageUrl] : undefined,
            },
          },
        },
      ],
      customer_email: input.customerEmail,
      submit_type: "pay",
      custom_text: input.submitMessage ? { submit: { message: input.submitMessage } } : undefined,
      metadata,
      payment_intent_data: { description: input.description, metadata },
      expires_at: input.expiresAt,
    });
    const session = await stripeRequest(key, "POST", "/checkout/sessions", body, input.idempotencyKey);
    return {
      chargeId: String(session.id),
      amountSatang: Number(session.amount_total ?? input.amountSatang),
      currency: String(session.currency ?? currency).toUpperCase(),
      status: session.payment_status === "paid" ? "successful" : "pending",
      provider: "stripe",
      authorizeUri: typeof session.url === "string" ? session.url : undefined,
      isTestMode: session.livemode !== true,
    };
  }

  // ตัวจำลองแบบกำหนดผลได้ (เครื่องพัฒนา / รอบทดสอบ / ระหว่างยังไม่ได้ใส่คีย์)
  const mockChargeId = `chrg_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  return {
    chargeId: mockChargeId,
    amountSatang: input.amountSatang,
    currency,
    status: "pending",
    provider: "simulator",
    authorizeUri: `${input.returnUri}&test_charge_id=${mockChargeId}`,
    isTestMode: true,
  };
}

export interface GatewayChargeStatus {
  status: "pending" | "paid" | "failed";
  amountSatang: number;
  currency: string;
  metadata: Record<string, string>;
}

/** ข้อมูลสถานะของ Checkout Session ไม่ว่าจะมาจาก webhook หรือจากการถาม Stripe เอง */
export function readCheckoutSession(session: Record<string, unknown>): GatewayChargeStatus {
  const metadata: Record<string, string> = {};
  const raw = session.metadata;
  if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof v === "string") metadata[k] = v;
    }
  }
  const status =
    session.payment_status === "paid" ? "paid" : session.status === "expired" ? "failed" : "pending";
  return {
    status,
    amountSatang: Number(session.amount_total ?? 0),
    currency: String(session.currency ?? "").toUpperCase(),
    metadata,
  };
}

/**
 * ถามสถานะรายการจาก Stripe โดยตรง — ใช้ตอนผู้ใช้กลับมาที่ `successUri` ก่อน webhook มาถึง
 * คืน `null` เมื่อไม่มีคีย์ (ตัวจำลอง) หรือถามไม่สำเร็จ
 */
export async function retrieveGatewayCharge(chargeId: string): Promise<GatewayChargeStatus | null> {
  const key = stripeSecretKey();
  if (!key || !/^cs_[A-Za-z0-9_]+$/.test(chargeId)) return null;
  try {
    const session = await stripeRequest(key, "GET", `/checkout/sessions/${chargeId}`);
    return readCheckoutSession(session);
  } catch (err) {
    console.warn("[Payment Gateway] ถามสถานะจาก Stripe ไม่สำเร็จ", err);
    return null;
  }
}

/**
 * ปิดหน้าจ่ายเงินที่ยังเปิดอยู่ (ลูกค้ายกเลิกการจองก่อนจ่าย) — กันจ่ายเข้ามาหลังยกเลิกแล้ว
 * พลาดได้ไม่เป็นไร: ถ้าเงินเข้ามาจริง `settleConsultationPayment` จะคืนเงินให้อัตโนมัติ
 */
export async function expireGatewayCharge(chargeId: string): Promise<void> {
  const key = stripeSecretKey();
  if (!key || !/^cs_[A-Za-z0-9_]+$/.test(chargeId)) return;
  try {
    await stripeRequest(key, "POST", `/checkout/sessions/${chargeId}/expire`);
  } catch (err) {
    // session ที่จ่ายแล้ว/หมดอายุแล้วปิดซ้ำไม่ได้ — เป็นเรื่องปกติ
    console.warn("[Payment Gateway] ปิดหน้าจ่ายเงินไม่สำเร็จ", err);
  }
}

/** ลิงก์หน้าจ่ายเงินเดิมถ้ายังเปิดอยู่ (กลับมาจ่ายต่อ) — null = หมดอายุ/จ่ายแล้ว/ไม่ใช่ Stripe */
export async function openGatewayCheckoutUrl(chargeId: string): Promise<string | null> {
  const key = stripeSecretKey();
  if (!key || !/^cs_[A-Za-z0-9_]+$/.test(chargeId)) return null;
  try {
    const session = await stripeRequest(key, "GET", `/checkout/sessions/${chargeId}`);
    return session.status === "open" && typeof session.url === "string" ? session.url : null;
  } catch {
    return null;
  }
}

export interface RefundResult {
  ok: boolean;
  refundId?: string;
}

/**
 * คืนเงินเต็มจำนวนของรายการ (Checkout Session ➔ PaymentIntent ➔ Refund)
 * - `idempotencyKey` ต้องผูกกับรายการของเรา (`refund_<paymentId>`) — เรียกซ้ำกี่ครั้งก็คืนครั้งเดียว
 * - ตัวจำลอง (ไม่มีคีย์) ถือว่าคืนสำเร็จ — ใช้เฉพาะเครื่องพัฒนา/รอบทดสอบ
 * ⚠️ ห้ามโยน error ออกไป — ผู้เรียกต้องบันทึก `refund_status = failed` ให้แอดมินตามต่อ ไม่ใช่ทำให้การยกเลิกพัง
 */
export async function refundGatewayCharge(chargeId: string, idempotencyKey: string): Promise<RefundResult> {
  const key = stripeSecretKey();
  if (!key) return { ok: true, refundId: `re_sim_${chargeId.slice(-8)}` };
  if (!/^cs_[A-Za-z0-9_]+$/.test(chargeId)) return { ok: false };
  try {
    const session = await stripeRequest(key, "GET", `/checkout/sessions/${chargeId}`);
    const intent = typeof session.payment_intent === "string" ? session.payment_intent : null;
    if (!intent) return { ok: false };
    const refund = await stripeRequest(
      key,
      "POST",
      "/refunds",
      toStripeForm({ payment_intent: intent, reason: "requested_by_customer" }),
      idempotencyKey,
    );
    return { ok: true, refundId: String(refund.id ?? "") };
  } catch (err) {
    console.error("[Payment Gateway] คืนเงินไม่สำเร็จ", err);
    return { ok: false };
  }
}

export interface WebhookOutcome {
  chargeId: string;
  outcome: "paid" | "failed" | "ignore";
  charge: GatewayChargeStatus;
}

/**
 * แปลง event ของ Stripe เป็นผลที่เราต้องทำ — บริสุทธิ์ ไม่แตะ I/O (ด่านตรวจเรียกตรงได้)
 *
 * - `checkout.session.completed` + `payment_status = paid` ➔ จ่ายแล้ว (บัตร)
 * - `checkout.session.completed` + `unpaid` ➔ ยังรอ (ช่องทางจ่ายทีหลัง เช่น PromptPay)
 * - `checkout.session.async_payment_succeeded` ➔ จ่ายแล้ว
 * - `checkout.session.async_payment_failed` / `checkout.session.expired` ➔ ไม่สำเร็จ
 */
export function parseWebhookEvent(event: Record<string, unknown>): WebhookOutcome | null {
  const type = typeof event.type === "string" ? event.type : "";
  if (!type.startsWith("checkout.session.")) return null;
  const session = ((event.data as Record<string, unknown> | undefined)?.object ?? null) as Record<
    string,
    unknown
  > | null;
  if (!session || typeof session.id !== "string") return null;

  const charge = readCheckoutSession(session);
  let outcome: WebhookOutcome["outcome"] = "ignore";
  if (type === "checkout.session.async_payment_succeeded") outcome = "paid";
  else if (type === "checkout.session.completed" && charge.status === "paid") outcome = "paid";
  else if (type === "checkout.session.async_payment_failed" || type === "checkout.session.expired") outcome = "failed";

  return { chargeId: session.id, outcome, charge };
}

/** เพดานอายุของ webhook — ตามค่าเริ่มต้นของไลบรารี Stripe (กันยิง payload เก่าซ้ำ) */
const WEBHOOK_TOLERANCE_SEC = 5 * 60;

/**
 * ตรวจลายเซ็น webhook ตามสเปก Stripe (docs.stripe.com/webhooks#verify-manually)
 * - header `Stripe-Signature: t=<unix>,v1=<hex>[,v1=<hex>...]` (หลาย `v1` ตอนหมุนคีย์)
 * - ข้อความที่เซ็น = `${t}.${rawBody}` · HMAC-SHA256 · กุญแจคือสตริง `whsec_...` ทั้งก้อน (ไม่ต้องถอด base64)
 * - `t` ห่างจากเวลาจริงเกิน 5 นาที = ปฏิเสธ
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null | undefined,
  signingSecret?: string,
  nowMs: number = Date.now(),
): boolean {
  const secret = signingSecret || process.env.STRIPE_WEBHOOK_SECRET || process.env.PAYMENT_WEBHOOK_SECRET;

  /*
   * 🔴 บทเรียน T-18: ของเดิม "ไม่มี secret + NODE_ENV ไม่ใช่ production" = ผ่านทุกคำขอ
   *
   * `NODE_ENV` ไม่ใช่ตัวบอกว่าปลายทางนี้เข้าถึงจากอินเทอร์เน็ตได้หรือไม่ —
   * preview / staging / branch deploy ทุกตัวรันด้วย `NODE_ENV !== "production"`
   * แต่มี URL สาธารณะจริง ใครก็ยิง webhook ปลอมเข้าไปแจกเครดิตฟรีได้
   *
   * ตอนนี้ไม่มี secret = ปฏิเสธเสมอ ไม่ว่าจะ environment ไหน
   * ช่องทดสอบเปิดด้วยธงที่ตั้งใจตั้งเองเท่านั้น ไม่ใช่การเดาจาก environment
   */
  if (!secret) {
    if (process.env.ALLOW_UNSIGNED_WEBHOOKS_DEV === "1" && process.env.NODE_ENV !== "production") {
      console.warn(
        "[Payment Webhook] ⚠️ รับ webhook ที่ไม่มีลายเซ็นเพราะตั้ง ALLOW_UNSIGNED_WEBHOOKS_DEV=1 — ห้ามตั้งค่านี้นอกเครื่องพัฒนา",
      );
      return true;
    }
    console.error(
      "[Payment Webhook] ไม่ได้ตั้ง STRIPE_WEBHOOK_SECRET / PAYMENT_WEBHOOK_SECRET — ปฏิเสธคำขอทั้งหมด",
    );
    return false;
  }

  if (!signatureHeader) return false;

  let timestamp = "";
  const signatures: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") timestamp = v;
    else if (k === "v1" && v) signatures.push(v);
  }
  if (!timestamp || signatures.length === 0) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(nowMs / 1000 - ts) > WEBHOOK_TOLERANCE_SEC) return false;

  try {
    const expected = Buffer.from(createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex"));
    return signatures.some((candidate) => {
      const got = Buffer.from(candidate);
      return got.length === expected.length && timingSafeEqual(got, expected);
    });
  } catch {
    return false;
  }
}
