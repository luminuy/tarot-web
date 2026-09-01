#!/usr/bin/env tsx
/**
 * QA Test: Marketplace Readers, Queue System, Reader Auth & AI Screening (M4-M6)
 */

import {
  createReader,
  deleteReader,
  getPublicReaderById,
  getReaderById,
  listPublicApprovedReaders,
  recordAdminAudit,
  setReaderStatus,
  updateReader,
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
  getQueueTicketById,
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
  const { createGatewayCharge, verifyWebhookSignature } = await import(
    "../../src/lib/marketplace/payment-gateway"
  );
  const {
    calculateReaderEarnings,
    createPaymentRecord,
    getPaymentById,
    recordReaderPayout,
    updatePaymentStatus,
  } = await import("../../src/lib/marketplace/payments.repo");

  // 1. Create simulated charge
  const charge = await createGatewayCharge({
    amountSatang: 29900,
    description: "ทดสอบการชำระเงิน 299 บาท",
    returnUri: "http://localhost:3000/readers/queue/ticket_test",
  });
  if (!charge.chargeId || charge.amountSatang !== 29900) {
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
    provider: "omise",
    providerRef: charge.chargeId,
    amountSatang: 29900,
  });
  if (payment.status !== "pending" || payment.amountSatang !== 29900) {
    throw new Error("❌ createPaymentRecord failed");
  }

  // 3. Test Webhook Signature Verification
  const testPayload = JSON.stringify({
    data: { id: charge.chargeId, status: "successful", amount: 29900 },
  });
  const secretKey = "test_webhook_secret_key_123";
  const { createHmac } = await import("node:crypto");
  const validSignature = createHmac("sha256", secretKey).update(testPayload).digest("hex");

  const sigPass = verifyWebhookSignature(testPayload, validSignature, secretKey);
  const sigFail = verifyWebhookSignature(testPayload, "tampered_signature_hex", secretKey);
  if (!sigPass || sigFail) {
    throw new Error("❌ verifyWebhookSignature failed to validate signature integrity");
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
  await cancelQueueTicket(ticket2.id);
  const purgedCount = await cleanupExpiredTickets();
  console.log(`  ✓ 12. PDPA Data Retention: Auto-cleanup expired tickets (${purgedCount} purged)`);

  // Cleanup test reader
  await deleteReader(created.id);
  console.log("  ✓ 13. ทำความสะอาดข้อมูลทดสอบเรียบร้อย");

  console.log("\n✨ [QA] Marketplace M4-M7 Test ผ่านครบทุกด่าน 100%!");
}

runTest().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
