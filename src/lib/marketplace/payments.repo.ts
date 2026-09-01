import { getAppDB } from "@/lib/platform/db";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PayoutStatus = "pending" | "completed" | "cancelled";

export interface PaymentRecord {
  id: string;
  bookingId: string;
  ticketId: string | null;
  provider: string;
  providerRef: string | null;
  amountSatang: number;
  currency: string;
  status: PaymentStatus;
  webhookLog: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface PayoutRecord {
  id: string;
  readerId: string;
  period: string; // YYYY-MM
  grossSatang: number;
  commissionSatang: number;
  netSatang: number;
  status: PayoutStatus;
  createdAt: number;
}

interface RawPaymentRow {
  id: string;
  booking_id: string;
  ticket_id: string | null;
  provider: string;
  provider_ref: string | null;
  amount_satang: number;
  currency: string;
  status: string;
  webhook_log: string | null;
  created_at: number;
  updated_at: number;
}

function mapRowToPayment(row: RawPaymentRow): PaymentRecord {
  return {
    id: row.id,
    bookingId: row.booking_id,
    ticketId: row.ticket_id,
    provider: row.provider,
    providerRef: row.provider_ref,
    amountSatang: row.amount_satang,
    currency: row.currency,
    status: row.status as PaymentStatus,
    webhookLog: row.webhook_log,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface CreatePaymentInput {
  bookingId: string;
  ticketId?: string;
  provider?: string;
  providerRef?: string;
  amountSatang: number;
  currency?: string;
}

/**
 * สร้างรายการชำระเงินใหม่ (สถานะเริ่มต้น: pending)
 */
export async function createPaymentRecord(input: CreatePaymentInput): Promise<PaymentRecord> {
  const db = await getAppDB();
  const id = `pay_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = Date.now();
  const provider = input.provider || "omise";
  const currency = input.currency || "THB";

  const payment: PaymentRecord = {
    id,
    bookingId: input.bookingId,
    ticketId: input.ticketId || null,
    provider,
    providerRef: input.providerRef || null,
    amountSatang: Math.round(input.amountSatang),
    currency,
    status: "pending",
    webhookLog: null,
    createdAt: now,
    updatedAt: now,
  };

  await db
    .prepare(
      `INSERT INTO payments (
        id, booking_id, ticket_id, provider, provider_ref, amount_satang, currency, status, webhook_log, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      payment.id,
      payment.bookingId,
      payment.ticketId,
      payment.provider,
      payment.providerRef,
      payment.amountSatang,
      payment.currency,
      payment.status,
      payment.webhookLog,
      payment.createdAt,
      payment.updatedAt
    )
    .run();

  return payment;
}

/**
 * ดึงข้อมูลการชำระเงินด้วย ID
 */
export async function getPaymentById(id: string): Promise<PaymentRecord | null> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM payments WHERE id = ? LIMIT 1")
    .bind(id)
    .first<RawPaymentRow>();

  return row ? mapRowToPayment(row) : null;
}

/**
 * ดึงข้อมูลการชำระเงินด้วย Ticket ID
 */
export async function getPaymentByTicketId(ticketId: string): Promise<PaymentRecord | null> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM payments WHERE ticket_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(ticketId)
    .first<RawPaymentRow>();

  return row ? mapRowToPayment(row) : null;
}

/**
 * อัปเดตสถานะการชำระเงิน (เช่น เมื่อได้รับ Webhook สำเร็จ)
 */
export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  options?: { providerRef?: string; webhookLog?: string }
): Promise<PaymentRecord | null> {
  const db = await getAppDB();
  const now = Date.now();

  const payment = await getPaymentById(id);
  if (!payment) return null;

  const newProviderRef = options?.providerRef || payment.providerRef;
  const newLog = options?.webhookLog || payment.webhookLog;

  await db
    .prepare(
      "UPDATE payments SET status = ?, provider_ref = ?, webhook_log = ?, updated_at = ? WHERE id = ?"
    )
    .bind(status, newProviderRef, newLog, now, id)
    .run();

  // If status marked as 'paid', also confirm booking
  if (status === "paid") {
    try {
      await db
        .prepare("UPDATE bookings SET status = 'paid' WHERE id = ?")
        .bind(payment.bookingId)
        .run();
    } catch {
      // ignore
    }
  }

  return getPaymentById(id);
}

/**
 * คำนวณส่วนแบ่งรายได้ของแม่หมอและแพลตฟอร์ม
 */
export async function calculateReaderEarnings(
  readerId: string,
  period?: string
): Promise<{
  readerId: string;
  period: string;
  totalBookings: number;
  grossSatang: number;
  commissionSatang: number;
  netSatang: number;
}> {
  const db = await getAppDB();
  const targetPeriod = period || new Date().toISOString().slice(0, 7); // YYYY-MM

  // Get reader commission percentage
  const readerRow = await db
    .prepare("SELECT commission_pct FROM readers WHERE id = ? LIMIT 1")
    .bind(readerId)
    .first<{ commission_pct: number }>();

  const commissionPct = readerRow?.commission_pct ?? 20;

  // Sum all paid payments for this reader
  const sumRow = await db
    .prepare(
      `SELECT COUNT(p.id) as count, COALESCE(SUM(p.amount_satang), 0) as total_satang
       FROM payments p
       JOIN bookings b ON p.booking_id = b.id
       WHERE b.reader_id = ? AND p.status = 'paid'`
    )
    .bind(readerId)
    .first<{ count: number; total_satang: number }>();

  const grossSatang = sumRow?.total_satang || 0;
  const commissionSatang = Math.round((grossSatang * commissionPct) / 100);
  const netSatang = grossSatang - commissionSatang;

  return {
    readerId,
    period: targetPeriod,
    totalBookings: sumRow?.count || 0,
    grossSatang,
    commissionSatang,
    netSatang,
  };
}

/**
 * บันทึกประวัติการจ่ายเงินรอบรายเดือน (Payout Ledger)
 */
export async function recordReaderPayout(input: {
  readerId: string;
  period: string;
  grossSatang: number;
  commissionSatang: number;
  netSatang: number;
}): Promise<PayoutRecord> {
  const db = await getAppDB();
  const id = `payout_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const now = Date.now();

  const record: PayoutRecord = {
    id,
    readerId: input.readerId,
    period: input.period,
    grossSatang: input.grossSatang,
    commissionSatang: input.commissionSatang,
    netSatang: input.netSatang,
    status: "pending",
    createdAt: now,
  };

  await db
    .prepare(
      `INSERT INTO payouts (
        id, reader_id, period, gross_satang, commission_satang, net_satang, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      record.id,
      record.readerId,
      record.period,
      record.grossSatang,
      record.commissionSatang,
      record.netSatang,
      record.status,
      record.createdAt
    )
    .run();

  return record;
}
