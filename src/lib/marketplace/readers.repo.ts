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
}

export type PublicReaderProfile = Omit<Reader, "lineUrl" | "sessionSecret" | "updatedAt">;

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
        updated_at = ?
      WHERE id = ?`
    )
    .bind(displayName, bio, avatarUrl, specialtiesJson, lineUrl, status, commissionPct, now, id)
    .run();

  return getReaderById(id);
}

/**
 * ปรับเปลี่ยนสถานะแม่หมอ (เช่น approve, suspend, pending)
 */
export async function setReaderStatus(id: string, status: ReaderStatus): Promise<boolean> {
  const db = await getAppDB();
  const now = Date.now();
  const res = await db
    .prepare("UPDATE readers SET status = ?, updated_at = ? WHERE id = ?")
    .bind(status, now, id)
    .run();

  return (res.meta?.changes ?? 0) > 0;
}

/**
 * ลบแม่หมอออกจากระบบ
 */
export async function deleteReader(id: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db.prepare("DELETE FROM readers WHERE id = ?").bind(id).run();
  return (res.meta?.changes ?? 0) > 0;
}

/**
 * บันทึก Audit Log สำหรับแอดมิน
 */
export async function recordAdminAudit(actor: string, action: string, detail?: string): Promise<void> {
  try {
    const db = await getAppDB();
    await db
      .prepare("INSERT INTO admin_audit (ts, actor, action, detail) VALUES (?, ?, ?, ?)")
      .bind(Date.now(), actor, action, detail || null)
      .run();
  } catch (err) {
    console.error("[RecordAdminAudit Error]", err);
  }
}
