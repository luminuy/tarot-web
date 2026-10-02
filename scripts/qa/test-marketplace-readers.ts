#!/usr/bin/env tsx
/**
 * QA Test: Marketplace Readers, Queue System, Reader Auth & AI Screening (M4-M6)
 */

import {
  createReader,
  deleteReader,
  getPublicReaderById,
} from "../../src/lib/marketplace/readers.repo";

import {
  signReaderToken,
  verifyReaderToken,
} from "../../src/lib/auth/reader-auth";

import {
  performAIScreening,
} from "../../src/lib/marketplace/screening";

import {
  cancelQueueTicket,
  cleanupExpiredTickets,
  createQueueTicket,
  getReaderLiveAvailability,
  listReaderQueueTickets,
  setReaderLiveAvailability,
  updateTicketStatus,
} from "../../src/lib/marketplace/queue.repo";

async function runTest() {
  console.log("🔍 [QA] กำลังทดสอบ Marketplace Architecture (M4-M6)...");

  // ── M4: Readers Repo & Security Projection ───────────────────────────────
  const created = await createReader({
    displayName: "แม่หมอทดสอบระบบ",
    bio: "ผู้เชี่ยวชาญศาสตร์ทาโรต์ 10 ปี",
    avatarUrl: "https://example.com/avatar.jpg",
    specialties: ["ความรัก", "การงาน"],
    lineUrl: "https://line.me/ti/p/~testreader",
    status: "approved",
    commissionPct: 25,
  });

  if (!created.id || !created.sessionSecret) {
    throw new Error("❌ createReader failed: ID or sessionSecret is missing");
  }
  console.log("  ✓ 1. createReader สำเร็จ (ID:", created.id, ")");

  const publicProfile = await getPublicReaderById(created.id);
  if (!publicProfile || "lineUrl" in publicProfile || "sessionSecret" in publicProfile) {
    throw new Error("❌ Security violation: Public reader profile leaks lineUrl or sessionSecret!");
  }
  console.log("  ✓ 2. Public reader profile projection ปลอดภัย (ไม่รั่วไหล LINE หรือ Secret)");

  // ── M5: Reader Token Auth ────────────────────────────────────────────────
  const token = signReaderToken(created.id, created.sessionSecret, 24);
  const verifiedPayload = verifyReaderToken(token, created.sessionSecret);
  if (!verifiedPayload || verifiedPayload.readerId !== created.id) {
    throw new Error("❌ Reader token verification failed");
  }
  const fakeTokenCheck = verifyReaderToken(token, "wrong-secret-signature");
  if (fakeTokenCheck !== null) {
    throw new Error("❌ Reader token accepted with invalid secret!");
  }
  console.log("  ✓ 3. Reader Token Auth HMAC-SHA256 ปลอดภัย 100%");

  // ── M5: Availability Toggle ──────────────────────────────────────────────
  await setReaderLiveAvailability(created.id, true);
  const isOpen = await getReaderLiveAvailability(created.id);
  if (!isOpen) {
    throw new Error("❌ setReaderLiveAvailability failed to set true");
  }
  await setReaderLiveAvailability(created.id, false);
  const isClosed = await getReaderLiveAvailability(created.id);
  if (isClosed) {
    throw new Error("❌ setReaderLiveAvailability failed to set false");
  }
  // Re-open for queue testing
  await setReaderLiveAvailability(created.id, true);
  console.log("  ✓ 4. Reader Live Availability Toggle ทำงานถูกต้อง");

  // ── M6: AI Screening - Normal Question ───────────────────────────────────
  const normalScreening = await performAIScreening({
    question: "อยากทราบว่าแฟนเก่าที่เพิ่งเลิกกันไปจะกลับมาหาเราไหมคะ",
    drawnCardsSummary: "Three of Swords, The Lovers",
  });
  if (normalScreening.verdict !== "pass" || normalScreening.category !== "love" || !normalScreening.inScope) {
    throw new Error(`❌ Normal AI screening failed: ${JSON.stringify(normalScreening)}`);
  }
  if (!normalScreening.brief.includes("ความรักความสัมพันธ์")) {
    throw new Error("❌ AI Brief synthesis did not classify category correctly");
  }
  console.log("  ✓ 5. AI Pre-Screening: คำถามความรักผ่านการวิเคราะห์และสรุป Brief สำเร็จ");

  // ── M6: AI Screening - Safety Crisis Guardrail ───────────────────────────
  const crisisScreening = await performAIScreening({
    question: "ชีวิตนี้ไม่อยากอยู่แล้ว อยากฆ่าตัวตาย ทำยังไงดี",
  });
  if (crisisScreening.verdict !== "block" || !crisisScreening.brief.includes("1323") || crisisScreening.inScope) {
    throw new Error(`❌ Crisis safety guardrail failed to block: ${JSON.stringify(crisisScreening)}`);
  }
  console.log("  ✓ 6. AI Safety Guardrail: บล็อกคำถามวิกฤตสุขภาพจิตและแจ้งเตือน 1323 สำเร็จ");

  // ── M5: Customer Queue Flow & Position Calculation ───────────────────────
  const ticket1 = await createQueueTicket({
    readerId: created.id,
    kind: "walkup",
    customerRef: "cust_client_device_1",
    nickname: "น้องพลอย",
    question: "มีโอกาสได้เลื่อนตำแหน่งในที่ทำงานใหม่ไหมคะ",
  });
  if (ticket1.status !== "waiting" || ticket1.position !== 1) {
    throw new Error(`❌ Ticket 1 expected position 1, got ${ticket1.position}, status: ${ticket1.status}`);
  }

  const ticket2 = await createQueueTicket({
    readerId: created.id,
    kind: "walkup",
    customerRef: "cust_client_device_2",
    nickname: "บอส",
    question: "ธุรกิจที่กำลังจะเริ่มลงทุนจะไปได้ดีไหม",
  });
  if (ticket2.position !== 2) {
    throw new Error(`❌ Ticket 2 expected position 2 in queue, got ${ticket2.position}`);
  }
  console.log("  ✓ 7. Queue Tickets: คำนวณลำดับคิวและบันทึกตั๋วสำเร็จ (#1 และ #2)");

  // ── M5: Reader Queue Lifecycle ───────────────────────────────────────────
  const readerTickets = await listReaderQueueTickets(created.id);
  if (readerTickets.length < 2) {
    throw new Error(`❌ listReaderQueueTickets failed: Expected at least 2 tickets, got ${readerTickets.length}`);
  }

  // Advance ticket 1 to ready
  const readyTicket = await updateTicketStatus(ticket1.id, "ready", created.id);
  if (!readyTicket || readyTicket.status !== "ready") {
    throw new Error("❌ updateTicketStatus to 'ready' failed");
  }

  // Complete ticket 1 (handed off)
  const doneTicket = await updateTicketStatus(ticket1.id, "handed_off", created.id);
  if (!doneTicket || doneTicket.status !== "handed_off") {
    throw new Error("❌ updateTicketStatus to 'handed_off' failed");
  }
  console.log("  ✓ 8. Reader Queue Lifecycle: รอคิว ➔ เรียกคิว ➔ ส่งต่อ LINE สำเร็จครบวงจร");

  // ── M7: Payments & Webhook Verification ───────────────────────────────────
  const { createGatewayCharge, verifyWebhookSignature, parseWebhookEvent, toStripeForm, isStripeTestModeOnProduction } = await import(
    "../../src/lib/marketplace/payment-gateway"
  );
  const {
    calculateReaderEarnings,
    createPaymentRecord,
    recordReaderPayout,
    updatePaymentStatus,
  } = await import("../../src/lib/marketplace/payments.repo");

  // 1. Create simulated charge
  const charge = await createGatewayCharge({
    amountSatang: 29900,
    description: "ทดสอบการชำระเงิน 299 บาท",
    returnUri: "http://localhost:3000/readers/queue/ticket_test?paid=1",
    cancelUri: "http://localhost:3000/readers/queue/ticket_test",
    referenceId: "book_test",
  });
  if (!charge.chargeId || charge.amountSatang !== 29900 || charge.provider !== "simulator") {
    throw new Error("❌ createGatewayCharge failed to generate charge");
  }

  // 2. Create Booking First to satisfy Foreign Key
  const { getAppDB } = await import("../../src/lib/platform/db");
  const db = await getAppDB();
  const testBookingId = `book_test_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO bookings (id, ticket_id, reader_id, slot_start, slot_end, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'reserved', ?)`
    )
    .bind(testBookingId, ticket1.id, created.id, now, now + 1800000, now)
    .run();

  // 3. Create Payment Record
  const payment = await createPaymentRecord({
    bookingId: testBookingId,
    ticketId: ticket1.id,
    provider: "stripe",
    providerRef: charge.chargeId,
    amountSatang: 29900,
  });
  if (payment.status !== "pending" || payment.amountSatang !== 29900) {
    throw new Error("❌ createPaymentRecord failed");
  }

  // 3. Test Webhook Signature Verification
  const testPayload = JSON.stringify({
    type: "checkout.session.completed",
    data: { object: { id: charge.chargeId, payment_status: "paid", amount_total: 29900, currency: "thb" } },
  });
  // สเปก Stripe — `Stripe-Signature: t=..,v1=..` · เซ็น `${t}.${body}` · กุญแจคือสตริง whsec_ ทั้งก้อน
  // หลาย v1 ตอนหมุนคีย์ · เก่าเกิน 5 นาทีปฏิเสธ · เซ็นแค่ body ปฏิเสธ
  const secretKey = "whsec_test_webhook_secret_key_123";
  const { createHmac } = await import("node:crypto");
  const nowTs = String(Math.floor(Date.now() / 1000));
  const sign = (ts: string, body: string, secret: string) =>
    createHmac("sha256", secret).update(`${ts}.${body}`).digest("hex");
  const validSignature = `t=${nowTs},v1=${sign(nowTs, testPayload, secretKey)}`;
  const oldKeySig = sign(nowTs, testPayload, "whsec_rotated_old_key");

  const sigPass = verifyWebhookSignature(testPayload, validSignature, secretKey);
  const sigRotation = verifyWebhookSignature(
    testPayload,
    `t=${nowTs},v1=${oldKeySig},v1=${sign(nowTs, testPayload, secretKey)}`,
    secretKey,
  );
  const sigFail = verifyWebhookSignature(testPayload, `t=${nowTs},v1=tampered_signature_hex`, secretKey);
  const staleTs = String(Math.floor(Date.now() / 1000) - 3600);
  const sigReplay = verifyWebhookSignature(
    testPayload,
    `t=${staleTs},v1=${sign(staleTs, testPayload, secretKey)}`,
    secretKey,
  );
  const sigBodyOnly = verifyWebhookSignature(
    testPayload,
    `t=${nowTs},v1=${createHmac("sha256", secretKey).update(testPayload).digest("hex")}`,
    secretKey,
  );
  const sigNoTs = verifyWebhookSignature(testPayload, `v1=${sign(nowTs, testPayload, secretKey)}`, secretKey);
  if (!sigPass || !sigRotation || sigFail || sigReplay || sigBodyOnly || sigNoTs) {
    throw new Error(
      `❌ verifyWebhookSignature ไม่ตรงสเปก Stripe (pass=${sigPass} rotation=${sigRotation} tampered=${sigFail} replay=${sigReplay} bodyOnly=${sigBodyOnly} noTs=${sigNoTs})`,
    );
  }

  // event ของ Stripe ➔ ผลที่ต้องทำ (บัตรจ่ายทันที · PromptPay จ่ายทีหลัง · หมดอายุ · event อื่น)
  const ev = (type: string, object: Record<string, unknown>) => parseWebhookEvent({ type, data: { object } });
  const cardPaid = ev("checkout.session.completed", { id: "cs_1", payment_status: "paid", amount_total: 9900, currency: "thb" });
  const asyncPending = ev("checkout.session.completed", { id: "cs_2", payment_status: "unpaid" });
  const asyncPaid = ev("checkout.session.async_payment_succeeded", { id: "cs_2", payment_status: "paid" });
  const asyncFailed = ev("checkout.session.async_payment_failed", { id: "cs_2", payment_status: "unpaid" });
  const expired = ev("checkout.session.expired", { id: "cs_3", status: "expired", payment_status: "unpaid" });
  const other = parseWebhookEvent({ type: "customer.created", data: { object: { id: "cus_1" } } });
  if (
    cardPaid?.outcome !== "paid" || cardPaid.charge.amountSatang !== 9900 || cardPaid.charge.currency !== "THB" ||
    asyncPending?.outcome !== "ignore" ||
    asyncPaid?.outcome !== "paid" ||
    asyncFailed?.outcome !== "failed" ||
    expired?.outcome !== "failed" ||
    other !== null
  ) {
    throw new Error("❌ parseWebhookEvent แปล event ของ Stripe ผิด");
  }

  // คีย์ทดสอบบนเว็บจริงต้องถูกจับได้ (ไม่งั้นบัตร 4242 ได้เครดิตฟรี) · คีย์ live / เครื่องพัฒนา / ตัวจำลอง ต้องไม่โดน
  const envBackup = { key: process.env.STRIPE_SECRET_KEY, node: process.env.NODE_ENV };
  const modeOf = (key: string | undefined, node: string) => {
    if (key === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = key;
    (process.env as Record<string, string>).NODE_ENV = node;
    return isStripeTestModeOnProduction();
  };
  const gate = [
    modeOf("sk_test_x", "production"),
    modeOf("rk_test_x", "production"),
    modeOf("sk_live_x", "production"),
    modeOf("sk_test_x", "development"),
    modeOf("mock_x", "production"),
    modeOf(undefined, "production"),
  ];
  if (envBackup.key === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = envBackup.key;
  (process.env as Record<string, string | undefined>).NODE_ENV = envBackup.node;
  if (gate.join() !== "true,true,false,false,false,false") {
    throw new Error(`❌ isStripeTestModeOnProduction ตัดสินผิด: ${gate.join()}`);
  }

  // หน้าจ่ายเงิน Stripe: ชื่อสั้น · บรรทัดรอง · รูป · เติมอีเมล · ข้อความใต้ปุ่ม ต้องถูกส่งไปจริง
  {
    const realFetch = globalThis.fetch;
    const prevKey = process.env.STRIPE_SECRET_KEY;
    let sent = "";
    process.env.STRIPE_SECRET_KEY = "sk_test_form_check";
    globalThis.fetch = (async (_u: unknown, init?: RequestInit) => {
      sent = String(init?.body ?? "");
      return new Response(JSON.stringify({ id: "cs_test_form", url: "https://checkout.stripe.com/x", amount_total: 14900, currency: "thb" }));
    }) as typeof fetch;
    try {
      await createGatewayCharge({
        amountSatang: 14900,
        description: "เติมรอบดูดวง 10 ครั้ง",
        productDescription: "รอบไม่มีวันหมดอายุ",
        imageUrl: "https://seertarot.net/cards/pentacles-01.jpg",
        customerEmail: "a@example.com",
        submitMessage: "รอบจะเข้าบัญชีทันที",
        returnUri: "https://seertarot.net/x?y=1",
        cancelUri: "https://seertarot.net/pricing",
        referenceId: "ord_form",
      });
    } finally {
      globalThis.fetch = realFetch;
      if (prevKey === undefined) delete process.env.STRIPE_SECRET_KEY;
      else process.env.STRIPE_SECRET_KEY = prevKey;
    }
    const f = new URLSearchParams(sent);
    if (
      f.get("line_items[0][price_data][product_data][description]") !== "รอบไม่มีวันหมดอายุ" ||
      f.get("line_items[0][price_data][product_data][images][0]") !== "https://seertarot.net/cards/pentacles-01.jpg" ||
      f.get("customer_email") !== "a@example.com" ||
      f.get("custom_text[submit][message]") !== "รอบจะเข้าบัญชีทันที" ||
      f.get("submit_type") !== "pay"
    ) {
      throw new Error(`❌ createGatewayCharge ส่งรายละเอียดหน้าจ่ายเงินไม่ครบ: ${sent}`);
    }
  }

  // form body ซ้อนชั้นแบบที่ Stripe รับ
  const form = toStripeForm({ line_items: [{ price_data: { unit_amount: 9900 } }], metadata: { orderId: "ord_1" } });
  if (form.get("line_items[0][price_data][unit_amount]") !== "9900" || form.get("metadata[orderId]") !== "ord_1") {
    throw new Error(`❌ toStripeForm ประกอบ form ผิด: ${form.toString()}`);
  }

  // 4. Update Payment status to 'paid'
  const paidPayment = await updatePaymentStatus(payment.id, "paid", {
    providerRef: charge.chargeId,
    webhookLog: testPayload,
  });
  if (!paidPayment || paidPayment.status !== "paid") {
    throw new Error("❌ updatePaymentStatus failed to transition to 'paid'");
  }
  console.log("  ✓ 10. Payments & Webhook: ตรวจสอบลายเซ็นและบันทึกสถานะ 'paid' สำเร็จ");

  // 5. Test Reader Earnings Calculation & Payout Ledger
  const earnings = await calculateReaderEarnings(created.id);
  if (typeof earnings.grossSatang !== "number" || typeof earnings.commissionSatang !== "number") {
    throw new Error("❌ calculateReaderEarnings failed");
  }

  const payout = await recordReaderPayout({
    readerId: created.id,
    period: "2026-09",
    grossSatang: 29900,
    commissionSatang: 7475, // 25%
    netSatang: 22425,
  });
  if (payout.status !== "pending" || payout.netSatang !== 22425) {
    throw new Error("❌ recordReaderPayout failed");
  }
  console.log("  ✓ 11. Revenue & Commission: คำนวณส่วนแบ่งรายได้และบันทึก Payout Ledger สำเร็จ");

  // ── PDPA Cleanup ─────────────────────────────────────────────────────────
  // 12. PDPA Cookie Authentication & Zero-Leak Projection (ISSUE-018)
  const { GET: getTicketsRoute } = await import("../../src/app/api/marketplace/tickets/route");
  const { GET: getTicketByIdRoute } = await import("../../src/app/api/marketplace/tickets/[id]/route");
  const { CUSTOMER_REF_COOKIE } = await import("../../src/lib/marketplace/customer-ref");
  const { signPayload } = await import("../../src/lib/auth/edge-auth");

  // 12.1 Unauthenticated requests must fail with 401 or 404
  const unauthListReq = new Request("http://localhost:3000/api/marketplace/tickets");
  const unauthListRes = await getTicketsRoute(unauthListReq);
  if (unauthListRes.status !== 401) {
    throw new Error(`❌ Unauthenticated /tickets GET expected 401, got ${unauthListRes.status}`);
  }

  const unauthTicketReq = new Request(`http://localhost:3000/api/marketplace/tickets/${ticket1.id}`);
  const unauthTicketRes = await getTicketByIdRoute(unauthTicketReq, { params: Promise.resolve({ id: ticket1.id }) });
  if (unauthTicketRes.status !== 404) {
    throw new Error(`❌ Zero Info Leakage failed: Unauthenticated ticket GET expected 404, got ${unauthTicketRes.status}`);
  }

  // 12.2 Attacker with different customerRef must be rejected with 404 (not 403)
  const attackerToken = await signPayload({ ref: "cust_unauthorized_attacker_99" });
  const attackerReq = new Request(`http://localhost:3000/api/marketplace/tickets/${ticket1.id}`, {
    headers: { cookie: `${CUSTOMER_REF_COOKIE}=${attackerToken}` },
  });
  const attackerRes = await getTicketByIdRoute(attackerReq, { params: Promise.resolve({ id: ticket1.id }) });
  if (attackerRes.status !== 404) {
    throw new Error(`❌ Attacker accessing ticket expected 404, got ${attackerRes.status}`);
  }

  // 12.3 Legitimate owner with valid signed cookie must succeed with 200
  const ownerToken = await signPayload({ ref: "cust_client_device_1" });
  const ownerReq = new Request(`http://localhost:3000/api/marketplace/tickets/${ticket1.id}`, {
    headers: { cookie: `${CUSTOMER_REF_COOKIE}=${ownerToken}` },
  });
  const ownerRes = await getTicketByIdRoute(ownerReq, { params: Promise.resolve({ id: ticket1.id }) });
  if (ownerRes.status !== 200) {
    throw new Error(`❌ Valid ticket owner GET failed: expected 200, got ${ownerRes.status}`);
  }
  const ownerJson = await ownerRes.json() as { ticket: { id: string } };
  if (ownerJson.ticket.id !== ticket1.id) {
    throw new Error(`❌ Valid ticket owner GET returned wrong ticket ID`);
  }
  console.log("  ✓ 12. PDPA Cookie Auth: ป้องกัน URL Enumeration และยืนยันตัวตนผ่าน Signed Cookie สำเร็จ 100%");

  // 12.4 (A2-13) customerRef = ความลับแบบ bearer ห้ามหลุดออกไปใน response ใด ๆ
  //      และ POST /tickets ต้องไม่ยอมเซ็นคุกกี้ให้ ref ที่ส่งมาใน body (เดิมแลกเป็นคุกกี้ของเหยื่อได้)
  const ownerRaw = JSON.stringify(ownerJson);
  if (ownerRaw.includes("customerRef") || ownerRaw.includes("cust_client_device_1")) {
    throw new Error("❌ A2-13: GET /tickets/[id] ยังส่ง customerRef ออกไป");
  }
  const { POST: postTicketForRef } = await import("../../src/app/api/marketplace/tickets/route");
  const stealRes = await postTicketForRef(
    new Request("https://seertarot.net/api/marketplace/tickets", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://seertarot.net" },
      body: JSON.stringify({
        readerId: created.id,
        kind: "booking",
        customerRef: "cust_client_device_1",
        nickname: "ผู้บุกรุก",
        question: "ขอดูคิวของคนอื่นหน่อย",
        consent: true,
      }),
    }),
  );
  if (stealRes.status !== 200) {
    throw new Error(`❌ A2-13: POST /tickets (booking) expected 200, got ${stealRes.status}`);
  }
  const stealJson = JSON.stringify(await stealRes.json());
  if (stealJson.includes("customerRef") || stealJson.includes("cust_client_device_1")) {
    throw new Error("❌ A2-13: POST /tickets ยังส่ง customerRef ออกไปใน response");
  }
  const stolenCookie = (stealRes.headers.get("set-cookie") ?? "").match(
    new RegExp(`${CUSTOMER_REF_COOKIE}=([^;]*)`),
  )?.[1];
  const { readCustomerRefFromCookie } = await import("../../src/lib/marketplace/customer-ref");
  const issuedRef = stolenCookie
    ? await readCustomerRefFromCookie(
        new Request("https://seertarot.net/", { headers: { cookie: `${CUSTOMER_REF_COOKIE}=${stolenCookie}` } }),
      )
    : null;
  if (!issuedRef || issuedRef === "cust_client_device_1") {
    throw new Error(`❌ A2-13: POST /tickets เซ็นคุกกี้ให้ ref จาก body (ได้ ${issuedRef})`);
  }
  console.log("  ✓ 12.4 customerRef ไม่หลุดออกใน response และแลก ref จาก body เป็นคุกกี้ไม่ได้ (A2-13)");

  await cancelQueueTicket(ticket2.id);
  const purgedCount = await cleanupExpiredTickets();
  console.log(`  ✓ 13. PDPA Data Retention: Auto-cleanup expired tickets (${purgedCount} purged)`);

  // 14. Malformed JSON Body Resilience (POST /api/marketplace/tickets & POST /api/marketplace/payments)
  const { POST: postTicketRoute } = await import("../../src/app/api/marketplace/tickets/route");
  const { POST: postPaymentRoute } = await import("../../src/app/api/marketplace/payments/route");

  for (const [name, handler, url] of [
    ["tickets", postTicketRoute, "https://seertarot.net/api/marketplace/tickets"],
    ["payments", postPaymentRoute, "https://seertarot.net/api/marketplace/payments"],
  ] as const) {
    const brokenRes = await handler(
      new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net" },
        body: "invalid{json",
      })
    );
    if (brokenRes.status !== 400) {
      throw new Error(`❌ ${name} ไม่ตอบ HTTP 400 เมื่อได้รับ JSON เสีย (ตอบ ${brokenRes.status})`);
    }

    const emptyRes = await handler(
      new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net" },
        body: "",
      })
    );
    if (emptyRes.status !== 400) {
      throw new Error(`❌ ${name} ไม่ตอบ HTTP 400 เมื่อได้รับ empty body (ตอบ ${emptyRes.status})`);
    }
  }
  console.log("  ✓ 14. Malformed & Empty JSON Resilience: ตอบ HTTP 400 ป้องกัน 500 error ในคิวและการชำระเงิน");

  // ── 📹 วิดีโอคอลตัวต่อตัว (บังคับผ่าน TURN · ซ่อน IP) ─────────────────────────
  await testVideoCall(created.id, created.sessionSecret);

  // Cleanup test reader
  await deleteReader(created.id);
  console.log("  ✓ 15. ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n✨ [QA] Marketplace M4-M7 Test ผ่านครบทุกด่าน 100%!");
}

/**
 * 📹 วิดีโอคอลตัวต่อตัว ลูกค้า ↔ แม่หมอ — ด่านนี้คุม 4 สัญญาที่ห้ามหลุด
 *   1. SDP ที่ข้ามฝั่งต้องเหลือแต่เส้นทาง relay (ไม่มี IP จริงของเครื่องหลุดไปถึงอีกฝั่ง)
 *   2. รหัสผ่าน TURN ที่ให้เบราว์เซอร์ = เฉพาะ turn/turns ไม่มี stun ไม่มีพอร์ต 53
 *   3. offer เห็นได้เฉพาะแม่หมอ · answer เห็นได้เฉพาะลูกค้า · คนนอก = 404
 *   4. กล้อง/ไมค์เปิดได้เฉพาะสองหน้าของวิดีโอคอล ทั้งเว็บที่เหลือยังปิด
 */
async function testVideoCall(readerId: string, sessionSecret: string) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { sanitizeRelaySdp, joinCall, submitOffer, submitAnswer, restartCall, endCall, getCallView } = await import(
    "../../src/lib/marketplace/call.repo"
  );
  const { filterRelayIceServers } = await import("../../src/lib/marketplace/turn");
  const { GET: getCall, POST: postCall } = await import("../../src/app/api/marketplace/calls/[ticketId]/route");
  const { CUSTOMER_REF_COOKIE } = await import("../../src/lib/marketplace/customer-ref");
  const { signPayload } = await import("../../src/lib/auth/edge-auth");
  const { SECURITY_HEADERS, CALL_PAGE_SOURCES, CALL_PAGE_PERMISSIONS_POLICY } = await import(
    "../../src/lib/config/security-headers"
  );

  // ── 16.1 ล้าง SDP ──────────────────────────────────────────────────────────
  const rawSdp = [
    "v=0",
    "o=- 1 2 IN IP4 127.0.0.1",
    "s=-",
    "m=video 9 UDP/TLS/RTP/SAVPF 96",
    "c=IN IP4 104.30.1.1",
    "a=candidate:1 1 udp 2122260223 192.168.1.20 54321 typ host generation 0",
    "a=candidate:2 1 udp 1686052607 203.0.113.7 54321 typ srflx raddr 192.168.1.20 rport 54321",
    "a=candidate:3 1 udp 41885439 104.30.1.1 61000 typ relay raddr 203.0.113.7 rport 54321",
    "a=candidate:4 1 udp 41885439 104.30.1.2 61001 typ relay raddr 203.0.113.7 rport 54321 generation 0",
    "",
  ].join("\r\n");
  const cleaned = sanitizeRelaySdp(rawSdp);
  if (!cleaned.ok) throw new Error(`❌ sanitizeRelaySdp ปฏิเสธ SDP ที่มี relay: ${cleaned.reason}`);
  for (const leak of ["192.168.1.20", "203.0.113.7", "typ host", "typ srflx"]) {
    if (cleaned.sdp.includes(leak)) throw new Error(`❌ SDP หลังล้างยังมี "${leak}" — IP จริงหลุดถึงอีกฝั่ง`);
  }
  if ((cleaned.sdp.match(/typ relay/g) ?? []).length !== 2 || !cleaned.sdp.includes("raddr 0.0.0.0 rport 0")) {
    throw new Error("❌ sanitizeRelaySdp ต้องเก็บ relay ทุกเส้นและแทน raddr เป็น 0.0.0.0");
  }
  const hostOnly = sanitizeRelaySdp(rawSdp.replace(/a=candidate:[34].*\r\n/g, ""));
  if (hostOnly.ok || hostOnly.reason !== "relay_required") {
    throw new Error("❌ SDP ที่ไม่มี relay ต้องถูกปฏิเสธ (relay_required)");
  }
  if (sanitizeRelaySdp("hello").ok || sanitizeRelaySdp(`v=0\r\n${"a".repeat(40_000)}`).ok || sanitizeRelaySdp(42).ok) {
    throw new Error("❌ sanitizeRelaySdp ต้องปฏิเสธข้อมูลที่ไม่ใช่ SDP / ใหญ่เกิน");
  }
  console.log("  ✓ 16.1 ล้าง SDP: เหลือเฉพาะ relay · ไม่มี IP จริงของเครื่อง (host/srflx/raddr) หลุดข้ามฝั่ง");

  // ── 16.2 กรองรายการ TURN ──────────────────────────────────────────────────
  const ice = filterRelayIceServers([
    { urls: ["stun:stun.cloudflare.com:3478", "stun:stun.cloudflare.com:53"] },
    {
      urls: [
        "turn:turn.cloudflare.com:3478?transport=udp",
        "turn:turn.cloudflare.com:53?transport=udp",
        "turns:turn.cloudflare.com:5349?transport=tcp",
        "stun:stun.cloudflare.com:3478",
      ],
      username: "u1",
      credential: "c1",
    },
  ]);
  const urls = ice.flatMap((s) => s.urls);
  if (
    ice.length !== 1 ||
    urls.some((u) => u.startsWith("stun:") || /:53(\?|$)/.test(u)) ||
    !urls.includes("turns:turn.cloudflare.com:5349?transport=tcp")
  ) {
    throw new Error(`❌ filterRelayIceServers ต้องเหลือเฉพาะ turn/turns ที่ไม่ใช่พอร์ต 53 (ได้ ${JSON.stringify(urls)})`);
  }
  console.log("  ✓ 16.2 รหัสผ่าน TURN ที่ส่งให้เบราว์เซอร์: เฉพาะ turn/turns · ไม่มี stun · ไม่มีพอร์ต 53");

  // ── 16.3 วงจรนัดเชื่อมสายในฐานข้อมูล ──────────────────────────────────────
  const ticket = await createQueueTicket({
    readerId,
    kind: "walkup",
    customerRef: "cust_video_device_1",
    nickname: "น้องวิดีโอ",
    question: "งานใหม่ที่กำลังจะไปสัมภาษณ์จะผ่านไหมคะ",
  });
  await updateTicketStatus(ticket.id, "ready", readerId);

  const join1 = await joinCall(ticket.id, "customer", "turn_user_c1");
  if (join1.view.round !== 1 || join1.previousTurnUser !== null) throw new Error("❌ joinCall ครั้งแรกต้องได้รอบ 1");
  const join2 = await joinCall(ticket.id, "reader", "turn_user_r1");
  if (join2.view.round !== 2) throw new Error("❌ อีกฝั่งเข้าห้อง ต้องขึ้นรอบใหม่ (ล้างใบนัดเก่า)");
  if (!(await submitOffer(ticket.id, 2, cleaned.sdp))) throw new Error("❌ submitOffer รอบปัจจุบันต้องสำเร็จ");
  if (await submitOffer(ticket.id, 1, cleaned.sdp)) throw new Error("❌ submitOffer รอบเก่าต้องถูกปฏิเสธ");
  const readerView = await getCallView(ticket.id, "reader");
  const customerView = await getCallView(ticket.id, "customer");
  if (readerView.offer !== cleaned.sdp || customerView.offer !== null) {
    throw new Error("❌ offer ต้องเห็นได้เฉพาะแม่หมอ");
  }
  if (!readerView.peerPresent || !customerView.peerPresent) throw new Error("❌ สถานะ 'อยู่ในห้อง' ของสองฝั่งไม่ขึ้น");
  if (!(await submitAnswer(ticket.id, 2, cleaned.sdp))) throw new Error("❌ submitAnswer ต้องสำเร็จเมื่อมี offer แล้ว");
  if ((await getCallView(ticket.id, "reader")).answer !== null || (await getCallView(ticket.id, "customer")).answer !== cleaned.sdp) {
    throw new Error("❌ answer ต้องเห็นได้เฉพาะลูกค้า");
  }
  if (!(await restartCall(ticket.id)) || (await getCallView(ticket.id, "customer")).answer !== null) {
    throw new Error("❌ ต่อสายใหม่ต้องขึ้นรอบใหม่และล้างใบนัดเก่า");
  }
  const rejoin = await joinCall(ticket.id, "customer", "turn_user_c2");
  if (rejoin.previousTurnUser !== "turn_user_c1") throw new Error("❌ เข้าห้องซ้ำต้องคืน TURN ชุดเก่าให้เพิกถอน");
  const revoked = await endCall(ticket.id, "customer");
  if (revoked.sort().join(",") !== "turn_user_c2,turn_user_r1") throw new Error(`❌ วางสายต้องคืน TURN ทั้งสองฝั่ง (ได้ ${revoked})`);
  const endedView = await getCallView(ticket.id, "reader");
  if (!endedView.ended || endedView.endedBy !== "customer" || endedView.offer !== null) {
    throw new Error("❌ วางสายแล้วต้องจบ และล้าง SDP ทิ้งทันที");
  }
  console.log("  ✓ 16.3 วงจรนัดเชื่อมสาย: offer→แม่หมอเท่านั้น · answer→ลูกค้าเท่านั้น · รอบเก่าถูกปฏิเสธ · วางสายล้าง SDP + คืน TURN");

  // ── 16.4 API: สิทธิ์ + ปิดเมื่อยังไม่ตั้ง TURN ─────────────────────────────
  const url = `https://seertarot.net/api/marketplace/calls/${ticket.id}`;
  const ctx = { params: Promise.resolve({ ticketId: ticket.id }) };
  const owner = `${CUSTOMER_REF_COOKIE}=${await signPayload({ ref: "cust_video_device_1" })}`;
  const stranger = `${CUSTOMER_REF_COOKIE}=${await signPayload({ ref: "cust_someone_else" })}`;
  const readerBearer = `Bearer ${signReaderToken(readerId, sessionSecret, 1)}`;
  const post = (headers: Record<string, string>, body: unknown) =>
    postCall(
      new Request(url, {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://seertarot.net", ...headers },
        body: JSON.stringify(body),
      }),
      ctx,
    );

  if ((await getCall(new Request(`${url}?as=customer`), ctx)).status !== 404) throw new Error("❌ GET ไม่มีสิทธิ์ต้องได้ 404");
  if ((await getCall(new Request(`${url}?as=customer`, { headers: { cookie: stranger } }), ctx)).status !== 404) {
    throw new Error("❌ ลูกค้าคนอื่นต้องได้ 404");
  }
  if ((await getCall(new Request(`${url}?as=reader`, { headers: { cookie: owner } }), ctx)).status !== 404) {
    throw new Error("❌ ลูกค้าแอบอ้างเป็นแม่หมอต้องได้ 404 (ห้ามอ่าน offer)");
  }
  if ((await getCall(new Request(`${url}?as=reader`, { headers: { authorization: readerBearer } }), ctx)).status !== 200) {
    throw new Error("❌ แม่หมอเจ้าของคิวต้องอ่านสถานะห้องได้");
  }
  if ((await post({ cookie: owner }, { as: "customer", action: "answer", round: 1, sdp: cleaned.sdp })).status !== 400) {
    throw new Error("❌ ลูกค้าส่ง answer ต้องถูกปฏิเสธ (400)");
  }

  const savedId = process.env.CLOUDFLARE_TURN_KEY_ID;
  const savedToken = process.env.CLOUDFLARE_TURN_KEY_API_TOKEN;
  delete process.env.CLOUDFLARE_TURN_KEY_ID;
  delete process.env.CLOUDFLARE_TURN_KEY_API_TOKEN;
  const offRes = await post({ cookie: owner }, { as: "customer", action: "join" });
  if (offRes.status !== 503) throw new Error(`❌ ยังไม่ตั้ง TURN ต้องตอบ 503 (ได้ ${offRes.status})`);

  // จำลอง Cloudflare: ออก ICE ที่มี stun + พอร์ต 53 ปนมา — API ต้องกรองก่อนส่งให้เบราว์เซอร์
  process.env.CLOUDFLARE_TURN_KEY_ID = "test-key";
  process.env.CLOUDFLARE_TURN_KEY_API_TOKEN = "test-token";
  const realFetch = globalThis.fetch;
  const turnCalls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const target = String(input instanceof Request ? input.url : input);
    if (!target.startsWith("https://rtc.live.cloudflare.com/")) return realFetch(input, init);
    turnCalls.push(target);
    if (target.endsWith("/revoke")) return new Response(null, { status: 204 });
    return Response.json(
      {
        iceServers: [
          { urls: ["stun:stun.cloudflare.com:3478"] },
          {
            urls: ["turn:turn.cloudflare.com:3478?transport=udp", "turn:turn.cloudflare.com:53?transport=udp"],
            username: "turn_user_api",
            credential: "secret",
          },
        ],
      },
      { status: 201 },
    );
  }) as typeof fetch;
  try {
    const joinRes = await post({ cookie: owner }, { as: "customer", action: "join" });
    const joinJson = (await joinRes.json()) as { iceServers?: { urls: string[] }[]; call?: { round: number } };
    const given = (joinJson.iceServers ?? []).flatMap((s) => s.urls);
    if (joinRes.status !== 200 || given.join() !== "turn:turn.cloudflare.com:3478?transport=udp" || !joinJson.call) {
      throw new Error(`❌ join ต้องได้ TURN ที่กรองแล้ว (ได้ ${joinRes.status} ${JSON.stringify(given)})`);
    }
    const hostOffer = await post(
      { cookie: owner },
      { as: "customer", action: "offer", round: joinJson.call.round, sdp: rawSdp.replace(/a=candidate:[34].*\r\n/g, "") },
    );
    if (hostOffer.status !== 400) throw new Error("❌ offer ที่ไม่มี relay ต้องถูกปฏิเสธ (กัน IP จริงหลุด)");
    const goodOffer = await post({ cookie: owner }, { as: "customer", action: "offer", round: joinJson.call.round, sdp: rawSdp });
    if (goodOffer.status !== 200) throw new Error(`❌ offer ที่มี relay ต้องผ่าน (ได้ ${goodOffer.status})`);
    const readerPoll = (await (
      await getCall(new Request(`${url}?as=reader`, { headers: { authorization: readerBearer } }), ctx)
    ).json()) as { call: { offer: string | null } };
    if (!readerPoll.call.offer || readerPoll.call.offer.includes("192.168.1.20") || readerPoll.call.offer.includes("203.0.113.7")) {
      throw new Error("❌ offer ที่แม่หมอได้รับยังมี IP จริงของลูกค้า");
    }

    // แม่หมอปิดคิว ➔ สายจบ + เพิกถอน TURN
    await updateTicketStatus(ticket.id, "handed_off", readerId);
    const closed = (await (
      await getCall(new Request(`${url}?as=customer`, { headers: { cookie: owner } }), ctx)
    ).json()) as { call: { ended: boolean } };
    if (!closed.call.ended) throw new Error("❌ ปิดคิวแล้วห้องต้องจบ");
    if (!turnCalls.some((u) => u.endsWith("/turn_user_api/revoke"))) {
      throw new Error("❌ ปิดคิวแล้วต้องเพิกถอนรหัสผ่าน TURN ที่ออกไป");
    }
    if ((await post({ cookie: owner }, { as: "customer", action: "join" })).status !== 409) {
      throw new Error("❌ คิวที่ปิดแล้วต้องเข้าห้องไม่ได้ (409)");
    }
  } finally {
    globalThis.fetch = realFetch;
    if (savedId === undefined) delete process.env.CLOUDFLARE_TURN_KEY_ID;
    else process.env.CLOUDFLARE_TURN_KEY_ID = savedId;
    if (savedToken === undefined) delete process.env.CLOUDFLARE_TURN_KEY_API_TOKEN;
    else process.env.CLOUDFLARE_TURN_KEY_API_TOKEN = savedToken;
  }
  console.log("  ✓ 16.4 API ห้องวิดีโอ: คนนอก 404 · ยังไม่ตั้ง TURN = 503 · offer ไม่มี relay = 400 · ปิดคิว = จบสาย + เพิกถอน TURN");

  // ── 16.5 สิทธิ์กล้อง/ไมค์ + ล็อก relay ในเบราว์เซอร์ ────────────────────────
  const globalPolicy = SECURITY_HEADERS.find((h) => h.key === "Permissions-Policy")?.value ?? "";
  if (!globalPolicy.includes("camera=()") || !globalPolicy.includes("microphone=()")) {
    throw new Error("❌ ทั้งเว็บต้องยังปิดกล้อง/ไมค์ (camera=() microphone=())");
  }
  if (!CALL_PAGE_PERMISSIONS_POLICY.includes("camera=(self)") || !CALL_PAGE_PERMISSIONS_POLICY.includes("microphone=(self)")) {
    throw new Error("❌ หน้าวิดีโอคอลต้องเปิดกล้อง/ไมค์ให้โดเมนตัวเอง");
  }
  const nextConfig = fs.readFileSync(path.join(process.cwd(), "next.config.ts"), "utf-8");
  const globalIdx = nextConfig.indexOf("headers: SECURITY_HEADERS");
  const callIdx = nextConfig.indexOf("CALL_PAGE_SOURCES.map");
  if (globalIdx === -1 || callIdx === -1 || callIdx < globalIdx) {
    throw new Error("❌ next.config.ts ต้องใส่ Permissions-Policy ของหน้าวิดีโอคอล 'หลัง' ชุดกลาง (ค่าที่มาทีหลังชนะ)");
  }
  for (const route of CALL_PAGE_SOURCES) {
    const dir = route === "/readers/console" ? "src/app/(th)/readers/console" : "src/app/(th)/readers/queue/[id]";
    if (!fs.readFileSync(path.join(process.cwd(), dir, "page.tsx"), "utf-8").includes("VideoCallRoom")) {
      throw new Error(`❌ ${route} เปิดสิทธิ์กล้องไว้แต่ไม่ได้ใช้ VideoCallRoom — ปิดสิทธิ์กลับ หรือแก้รายการ`);
    }
  }
  const room = fs.readFileSync(path.join(process.cwd(), "src/components/marketplace/VideoCallRoom.tsx"), "utf-8");
  if (!room.includes('iceTransportPolicy: "relay"') || /iceTransportPolicy:\s*"all"/.test(room)) {
    throw new Error("❌ VideoCallRoom ต้องบังคับ iceTransportPolicy: \"relay\" (ซ่อน IP) เสมอ");
  }
  if (!/max:\s*1280/.test(room) || !/max:\s*720/.test(room) || !room.includes("MAX_VIDEO_BITRATE = 1_500_000")) {
    throw new Error("❌ VideoCallRoom ต้องล็อกภาพ 720p และเพดาน 1.5 Mbps (คุมโควตาฟรี TURN)");
  }
  console.log("  ✓ 16.5 กล้อง/ไมค์เปิดเฉพาะหน้าวิดีโอคอล · เบราว์เซอร์บังคับ relay · ล็อก 720p/1.5 Mbps");
}

runTest().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
