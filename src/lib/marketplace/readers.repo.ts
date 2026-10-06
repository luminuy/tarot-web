import { getAppDB } from "@/lib/platform/db";

export type ReaderStatus = "pending" | "approved" | "suspended";

export interface Reader {
  id: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  lineUrl: string;
  status: ReaderStatus;
  commissionPct: number;
  sessionSecret: string;
  createdAt: number;
  updatedAt: number;
  /** อีเมลรับแจ้งเตือนนัดใหม่/ยกเลิก (migrations/0021) — ข้อมูลส่วนตัว ห้ามออกหน้าสาธารณะ */
  notifyEmail: string | null;
  /** ค่าปรึกษาต่อครั้ง (บาท) — null = ราคากลาง `CONSULTATION_PRICE_THB` · ตั้งโดยแอดมินเท่านั้น */
  priceThb: number | null;
  /** เวลาพักระหว่างนัด (นาที) */
  bufferMin: number;
  /** เพดานนัดต่อวัน — null = ไม่จำกัด */
  dailyCap: number | null;
}

export type PublicReaderProfile = Omit<
  Reader,
  "lineUrl" | "sessionSecret" | "updatedAt" | "notifyEmail" | "bufferMin" | "dailyCap"
>;

interface RawReaderRow {
  id: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  specialties: string;
  line_url: string;
  status: string;
  commission_pct: number;
  session_secret: string;
  created_at: number;
  updated_at: number;
  notify_email?: string | null;
  price_thb?: number | null;
  buffer_min?: number | null;
  daily_cap?: number | null;
}

function parseSpecialties(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    // ignore
  }
  return [];
}

function mapRowToReader(row: RawReaderRow): Reader {
  return {
    id: row.id,
    displayName: row.display_name,
    bio: row.bio || "",
    avatarUrl: row.avatar_url || null,
    specialties: parseSpecialties(row.specialties),
    lineUrl: row.line_url,
    status: (row.status as ReaderStatus) || "pending",
    commissionPct: typeof row.commission_pct === "number" ? row.commission_pct : 20,
    sessionSecret: row.session_secret,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    notifyEmail: row.notify_email || null,
    priceThb: typeof row.price_thb === "number" && row.price_thb > 0 ? row.price_thb : null,
    bufferMin: Number(row.buffer_min ?? 0) || 0,
    dailyCap: typeof row.daily_cap === "number" && row.daily_cap > 0 ? row.daily_cap : null,
  };
}

export function toPublicReaderProfile(reader: Reader): PublicReaderProfile {
  return {
    id: reader.id,
    displayName: reader.displayName,
    bio: reader.bio,
    avatarUrl: reader.avatarUrl,
    specialties: reader.specialties,
    status: reader.status,
    commissionPct: reader.commissionPct,
    createdAt: reader.createdAt,
    priceThb: reader.priceThb,
  };
}

export interface CreateReaderInput {
  displayName: string;
  bio?: string;
  avatarUrl?: string | null;
  specialties: string[];
  lineUrl: string;
  status?: ReaderStatus;
  commissionPct?: number;
}

export interface UpdateReaderInput {
  displayName?: string;
  bio?: string;
  avatarUrl?: string | null;
  specialties?: string[];
  lineUrl?: string;
  status?: ReaderStatus;
  commissionPct?: number;
  /** ราคาต่อครั้ง (บาท) — null = กลับไปใช้ราคากลาง */
  priceThb?: number | null;
}

/** ตั้งค่าการรับนัดที่แม่หมอแก้เองได้จากแผงแม่หมอ */
export interface ReaderBookingSettings {
  notifyEmail: string | null;
  bufferMin: number;
  dailyCap: number | null;
}

export async function updateReaderBookingSettings(id: string, input: ReaderBookingSettings): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare("UPDATE readers SET notify_email = ?, buffer_min = ?, daily_cap = ?, updated_at = ? WHERE id = ?")
    .bind(input.notifyEmail, input.bufferMin, input.dailyCap, Date.now(), id)
    .run();
}

/**
 * ดึงรายการแม่หมอทั้งหมด (สำหรับ Admin)
 */
export async function listReaders(options?: { status?: ReaderStatus }): Promise<Reader[]> {
  const db = await getAppDB();
  let query = "SELECT * FROM readers";
  const params: unknown[] = [];

  if (options?.status) {
    query += " WHERE status = ?";
    params.push(options.status);
  }

  query += " ORDER BY created_at DESC";

  const { results } = await db.prepare(query).bind(...params).all<RawReaderRow>();
  return (results || []).map(mapRowToReader);
}

/**
 * ดึงรายการแม่หมอที่ Approved สำหรับแสดงบนหน้าเว็บสาธารณะ (/readers)
 */
export async function listPublicApprovedReaders(): Promise<PublicReaderProfile[]> {
  const readers = await listReaders({ status: "approved" });
  return readers.map(toPublicReaderProfile);
}

/**
 * ดึงข้อมูลแม่หมอรายบุคคลด้วย ID (Admin / Internal)
 */
export async function getReaderById(id: string): Promise<Reader | null> {
  const db = await getAppDB();
  const row = await db
    .prepare("SELECT * FROM readers WHERE id = ? LIMIT 1")
    .bind(id)
    .first<RawReaderRow>();

  if (!row) return null;
  return mapRowToReader(row);
}

/**
 * ดึงข้อมูลแม่หมอสำหรับหน้าสาธารณะ (/readers/[id])
 */
export async function getPublicReaderById(id: string): Promise<PublicReaderProfile | null> {
  const reader = await getReaderById(id);
  if (!reader || reader.status !== "approved") return null;
  return toPublicReaderProfile(reader);
}

/**
 * สร้างแม่หมอคนใหม่
 */
export async function createReader(input: CreateReaderInput): Promise<Reader> {
  const db = await getAppDB();
  const now = Date.now();
  const id = `reader_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const sessionSecret = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

  const specialtiesJson = JSON.stringify(input.specialties || []);
  const status = input.status || "pending";
  const commissionPct = typeof input.commissionPct === "number" ? input.commissionPct : 20;

  await db
    .prepare(
      `INSERT INTO readers (
        id, display_name, bio, avatar_url, specialties, line_url,
        status, commission_pct, session_secret, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      input.displayName.trim(),
      input.bio?.trim() || "",
      input.avatarUrl || null,
      specialtiesJson,
      input.lineUrl.trim(),
      status,
      commissionPct,
      sessionSecret,
      now,
      now
    )
    .run();

  const created = await getReaderById(id);
  if (!created) {
    throw new Error("Failed to retrieve created reader");
  }
  return created;
}

/**
 * อัปเดตข้อมูลแม่หมอ
 */
export async function updateReader(id: string, input: UpdateReaderInput): Promise<Reader | null> {
  const existing = await getReaderById(id);
  if (!existing) return null;

  const db = await getAppDB();
  const now = Date.now();

  const displayName = input.displayName !== undefined ? input.displayName.trim() : existing.displayName;
  const bio = input.bio !== undefined ? input.bio.trim() : existing.bio;
  const avatarUrl = input.avatarUrl !== undefined ? input.avatarUrl : existing.avatarUrl;
  const specialtiesJson =
    input.specialties !== undefined ? JSON.stringify(input.specialties) : JSON.stringify(existing.specialties);
  const lineUrl = input.lineUrl !== undefined ? input.lineUrl.trim() : existing.lineUrl;
  const status = input.status !== undefined ? input.status : existing.status;
  const commissionPct =
    typeof input.commissionPct === "number" ? input.commissionPct : existing.commissionPct;
  const priceThb = input.priceThb !== undefined ? input.priceThb : existing.priceThb;

  await db
    .prepare(
      `UPDATE readers SET
        display_name = ?,
        bio = ?,
        avatar_url = ?,
        specialties = ?,
        line_url = ?,
        status = ?,
        commission_pct = ?,
        price_thb = ?,
        updated_at = ?
      WHERE id = ?`
    )
    .bind(displayName, bio, avatarUrl, specialtiesJson, lineUrl, status, commissionPct, priceThb, now, id)
    .run();

  return getReaderById(id);
}

/**
 * ลบแม่หมอออกจากระบบ พร้อมเก็บกวาดข้อมูลคิวและการเงินที่เกี่ยวข้อง
 */
export async function deleteReader(id: string): Promise<boolean> {
  const db = await getAppDB();
  // 📹 ห้องวิดีโอคอล (migrations/0019) อ้าง FK ถึงตั๋ว — ต้องลบก่อนตั๋ว · แยก try ไว้
  // เพราะถ้าฐานข้อมูลเก่ายังไม่มีตารางนี้ ต้องไม่ทำให้การลบที่เหลือข้างล่างถูกข้ามไปทั้งชุด
  try {
    await db
      .prepare("DELETE FROM call_sessions WHERE ticket_id IN (SELECT id FROM queue_tickets WHERE reader_id = ?)")
      .bind(id)
      .run();
  } catch {
    // ignore if table not yet created
  }
  try {
    await db.prepare("DELETE FROM payments WHERE booking_id IN (SELECT id FROM bookings WHERE reader_id = ?)").bind(id).run();
    await db.prepare("DELETE FROM payouts WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM bookings WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM queue_tickets WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM reader_availability WHERE reader_id = ?").bind(id).run();
  } catch {
    // ignore if tables not yet created in older migrations
  }
  // ตาราง migrations/0021 — แยก try เหมือนห้องวิดีโอ: ฐานข้อมูลเก่าที่ยังไม่มีตารางต้องไม่ทำให้การลบแม่หมอล้ม
  try {
    await db.prepare("DELETE FROM reader_blocked_dates WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM reader_reviews WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM booking_waitlist WHERE reader_id = ?").bind(id).run();
  } catch {
    // ignore if tables not yet created in older migrations
  }
  // Reader Studio (migrations/0027) — ข้อมูลลูกค้าของแม่หมอ (แม่หมอเป็นผู้ควบคุมข้อมูล) ต้องหายไปพร้อมบัญชี
  // ลิงก์คำอ่านที่ส่งไปแล้วจึงเปิดไม่ได้ทันที · แยก try เพราะฐานข้อมูลเก่ายังไม่มีตาราง
  try {
    await db.prepare("DELETE FROM reader_readings WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM reader_clients WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM reader_templates WHERE reader_id = ?").bind(id).run();
    await db.prepare("DELETE FROM reader_studio_settings WHERE reader_id = ?").bind(id).run();
  } catch {
    // ignore if tables not yet created in older migrations
  }

  const res = await db.prepare("DELETE FROM readers WHERE id = ?").bind(id).run();
  return (res.meta?.changes ?? 0) > 0;
}

