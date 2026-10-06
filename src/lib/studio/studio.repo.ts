import { getAppDB } from "@/lib/platform/db";

/**
 * 🗂️ Reader Studio (migrations/0027) — ทุกคำสั่งที่แม่หมอเรียกกรองด้วย reader_id เสมอ
 * แม่หมอเห็นเฉพาะลูกค้า/คำอ่าน/แม่แบบของตัวเอง · หน้าลิงก์สาธารณะอ่านผ่าน `getSharedReading` เท่านั้น
 */

export const MAX_CLIENTS_PER_READER = 2000;

export interface StudioSettings {
  readerId: string;
  brandName: string | null;
  logoUrl: string | null;
  brandColor: string | null;
  contactLine: string | null;
  showAiDisclosure: boolean;
  dpaVersion: string | null;
  dpaAcceptedAt: number | null;
}

export interface StudioClient {
  id: string;
  displayName: string;
  contact: string | null;
  note: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface StudioCard {
  order: number;
  cardIndex: number;
  isReversed: boolean;
}

export interface StudioBodyPart {
  /** "card:<order>" · "summary" · "intro" · "closing" */
  key: string;
  text: string;
  /** ที่มา — ใช้แยกสีในตัวแก้ (ไม่แสดงต่อลูกค้า) */
  origin: "reader" | "ai" | "edited";
}

export interface StudioReading {
  id: string;
  clientId: string | null;
  title: string;
  question: string | null;
  spreadId: string;
  customSpread: unknown | null;
  cardSource: "fair" | "manual" | null;
  cards: StudioCard[];
  commitment: string | null;
  /** เปิดเผยหลังจั่วแล้วเท่านั้น (ไม่มีใครเปลี่ยนไพ่ทีหลังได้) */
  serverSeed: string | null;
  clientSeed: string | null;
  notes: Record<string, string>;
  draft: { parts: StudioBodyPart[]; model?: string } | null;
  body: StudioBodyPart[] | null;
  showAiDisclosure: boolean;
  status: "draft" | "sent";
  share: { active: boolean; expiresAt: number | null; hasPassword: boolean; revokedAt: number | null; viewCount: number };
  sentAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface StudioTemplate {
  id: string;
  name: string;
  intro: string | null;
  closing: string | null;
  createdAt: number;
}

const j = <T,>(raw: string | null | undefined, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

/* ── ตั้งค่า + DPA ───────────────────────────────────────────────── */

interface SettingsRow {
  reader_id: string;
  brand_name: string | null;
  logo_url: string | null;
  brand_color: string | null;
  contact_line: string | null;
  show_ai_disclosure: number;
  dpa_version: string | null;
  dpa_accepted_at: number | null;
}

export async function getStudioSettings(readerId: string): Promise<StudioSettings> {
  const db = await getAppDB();
  const r = await db.prepare(`SELECT * FROM reader_studio_settings WHERE reader_id = ?`).bind(readerId).first<SettingsRow>();
  return {
    readerId,
    brandName: r?.brand_name ?? null,
    logoUrl: r?.logo_url ?? null,
    brandColor: r?.brand_color ?? null,
    contactLine: r?.contact_line ?? null,
    showAiDisclosure: r ? r.show_ai_disclosure === 1 : true,
    dpaVersion: r?.dpa_version ?? null,
    dpaAcceptedAt: r?.dpa_accepted_at ?? null,
  };
}

export async function saveStudioSettings(
  readerId: string,
  s: Pick<StudioSettings, "brandName" | "logoUrl" | "brandColor" | "contactLine" | "showAiDisclosure">,
): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(
      `INSERT INTO reader_studio_settings (reader_id, brand_name, logo_url, brand_color, contact_line, show_ai_disclosure, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(reader_id) DO UPDATE SET brand_name = excluded.brand_name, logo_url = excluded.logo_url,
         brand_color = excluded.brand_color, contact_line = excluded.contact_line,
         show_ai_disclosure = excluded.show_ai_disclosure, updated_at = excluded.updated_at`,
    )
    .bind(readerId, s.brandName, s.logoUrl, s.brandColor, s.contactLine, s.showAiDisclosure ? 1 : 0, Date.now())
    .run();
}

export async function acceptStudioDpa(readerId: string, version: string): Promise<void> {
  const db = await getAppDB();
  const now = Date.now();
  await db
    .prepare(
      `INSERT INTO reader_studio_settings (reader_id, dpa_version, dpa_accepted_at, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(reader_id) DO UPDATE SET dpa_version = excluded.dpa_version, dpa_accepted_at = excluded.dpa_accepted_at, updated_at = excluded.updated_at`,
    )
    .bind(readerId, version, now, now)
    .run();
}

/* ── ลูกค้า ─────────────────────────────────────────────────────── */

interface ClientRow {
  id: string;
  reader_id: string;
  display_name: string;
  contact: string | null;
  note: string | null;
  created_at: number;
  updated_at: number;
}

const mapClient = (r: ClientRow): StudioClient => ({
  id: r.id,
  displayName: r.display_name,
  contact: r.contact,
  note: r.note,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listClients(readerId: string, q?: string): Promise<StudioClient[]> {
  const db = await getAppDB();
  const like = q ? `%${q.replace(/[\\%_]/g, (m) => `\\${m}`)}%` : null;
  const { results } = like
    ? await db
        .prepare(`SELECT * FROM reader_clients WHERE reader_id = ? AND display_name LIKE ? ESCAPE '\\' ORDER BY updated_at DESC LIMIT 200`)
        .bind(readerId, like)
        .all<ClientRow>()
    : await db.prepare(`SELECT * FROM reader_clients WHERE reader_id = ? ORDER BY updated_at DESC LIMIT 200`).bind(readerId).all<ClientRow>();
  return (results || []).map(mapClient);
}

export async function getClient(readerId: string, id: string): Promise<StudioClient | null> {
  const db = await getAppDB();
  const r = await db.prepare(`SELECT * FROM reader_clients WHERE id = ? AND reader_id = ?`).bind(id, readerId).first<ClientRow>();
  return r ? mapClient(r) : null;
}

export async function createClient(readerId: string, c: { displayName: string; contact?: string | null; note?: string | null }): Promise<StudioClient | null> {
  const db = await getAppDB();
  const count = await db.prepare(`SELECT COUNT(*) AS n FROM reader_clients WHERE reader_id = ?`).bind(readerId).first<{ n: number }>();
  if ((count?.n ?? 0) >= MAX_CLIENTS_PER_READER) return null;
  const now = Date.now();
  const id = `rc_${crypto.randomUUID()}`;
  await db
    .prepare(`INSERT INTO reader_clients (id, reader_id, display_name, contact, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, readerId, c.displayName, c.contact ?? null, c.note ?? null, now, now)
    .run();
  return { id, displayName: c.displayName, contact: c.contact ?? null, note: c.note ?? null, createdAt: now, updatedAt: now };
}

export async function updateClient(readerId: string, id: string, c: { displayName: string; contact?: string | null; note?: string | null }): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE reader_clients SET display_name = ?, contact = ?, note = ?, updated_at = ? WHERE id = ? AND reader_id = ?`)
    .bind(c.displayName, c.contact ?? null, c.note ?? null, Date.now(), id, readerId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** ลบลูกค้าทั้งคน — คำอ่านและลิงก์ของลูกค้านั้นถูกลบด้วย (PDPA: แม่หมอสั่งลบได้ทันที) */
export async function deleteClient(readerId: string, id: string): Promise<{ deleted: boolean; readings: number }> {
  const db = await getAppDB();
  const r = await db.prepare(`DELETE FROM reader_readings WHERE client_id = ? AND reader_id = ?`).bind(id, readerId).run();
  const c = await db.prepare(`DELETE FROM reader_clients WHERE id = ? AND reader_id = ?`).bind(id, readerId).run();
  return { deleted: (c.meta?.changes ?? 0) > 0, readings: r.meta?.changes ?? 0 };
}

/* ── คำอ่าน ─────────────────────────────────────────────────────── */

interface ReadingRow {
  id: string;
  reader_id: string;
  client_id: string | null;
  title: string;
  question: string | null;
  spread_id: string;
  custom_spread_json: string | null;
  card_source: string | null;
  cards_json: string | null;
  commitment: string | null;
  server_seed: string | null;
  client_seed: string | null;
  notes_json: string;
  draft_json: string | null;
  body_json: string | null;
  show_ai_disclosure: number;
  status: string;
  share_token_hash: string | null;
  share_expires_at: number | null;
  share_password_hash: string | null;
  share_revoked_at: number | null;
  view_count: number;
  sent_at: number | null;
  created_at: number;
  updated_at: number;
}

const mapReading = (r: ReadingRow): StudioReading => ({
  id: r.id,
  clientId: r.client_id,
  title: r.title,
  question: r.question,
  spreadId: r.spread_id,
  customSpread: j<unknown | null>(r.custom_spread_json, null),
  cardSource: r.card_source === "fair" || r.card_source === "manual" ? r.card_source : null,
  cards: j<StudioCard[]>(r.cards_json, []),
  commitment: r.commitment,
  // ไพ่ถูกจั่วแล้ว = เปิดเผย serverSeed ได้ (ให้ลูกค้าตรวจย้อนหลังได้)
  serverSeed: r.cards_json ? r.server_seed : null,
  clientSeed: r.client_seed,
  notes: j<Record<string, string>>(r.notes_json, {}),
  draft: j<StudioReading["draft"]>(r.draft_json, null),
  body: j<StudioBodyPart[] | null>(r.body_json, null),
  showAiDisclosure: r.show_ai_disclosure === 1,
  status: r.status === "sent" ? "sent" : "draft",
  share: {
    active: Boolean(r.share_token_hash) && !r.share_revoked_at && (!r.share_expires_at || r.share_expires_at > Date.now()),
    expiresAt: r.share_expires_at,
    hasPassword: Boolean(r.share_password_hash),
    revokedAt: r.share_revoked_at,
    viewCount: r.view_count,
  },
  sentAt: r.sent_at,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

export async function listReadings(readerId: string, clientId?: string): Promise<StudioReading[]> {
  const db = await getAppDB();
  const { results } = clientId
    ? await db.prepare(`SELECT * FROM reader_readings WHERE reader_id = ? AND client_id = ? ORDER BY updated_at DESC LIMIT 200`).bind(readerId, clientId).all<ReadingRow>()
    : await db.prepare(`SELECT * FROM reader_readings WHERE reader_id = ? ORDER BY updated_at DESC LIMIT 200`).bind(readerId).all<ReadingRow>();
  return (results || []).map(mapReading);
}

export async function getReading(readerId: string, id: string): Promise<StudioReading | null> {
  const db = await getAppDB();
  const r = await db.prepare(`SELECT * FROM reader_readings WHERE id = ? AND reader_id = ?`).bind(id, readerId).first<ReadingRow>();
  return r ? mapReading(r) : null;
}

/** สำหรับตรวจ Provably Fair ฝั่งเซิร์ฟเวอร์ — คืน serverSeed แม้ยังไม่จั่ว (ห้ามส่งออกไปหาหน้าเว็บ) */
export async function getReadingSecrets(readerId: string, id: string): Promise<{ serverSeed: string | null; commitment: string | null; cards: StudioCard[] } | null> {
  const db = await getAppDB();
  const r = await db
    .prepare(`SELECT server_seed, commitment, cards_json FROM reader_readings WHERE id = ? AND reader_id = ?`)
    .bind(id, readerId)
    .first<{ server_seed: string | null; commitment: string | null; cards_json: string | null }>();
  return r ? { serverSeed: r.server_seed, commitment: r.commitment, cards: j<StudioCard[]>(r.cards_json, []) } : null;
}

export async function createReading(
  readerId: string,
  r: { clientId: string | null; title: string; question: string | null; spreadId: string; customSpread: unknown | null; showAiDisclosure: boolean },
): Promise<string> {
  const db = await getAppDB();
  const now = Date.now();
  const id = `rr_${crypto.randomUUID()}`;
  await db
    .prepare(
      `INSERT INTO reader_readings (id, reader_id, client_id, title, question, spread_id, custom_spread_json, show_ai_disclosure, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(id, readerId, r.clientId, r.title, r.question, r.spreadId, r.customSpread ? JSON.stringify(r.customSpread) : null, r.showAiDisclosure ? 1 : 0, now, now)
    .run();
  return id;
}

/** แก้เฉพาะช่องที่ส่งมา — ช่องไพ่/seed แก้ผ่าน `setReadingCards` เท่านั้น (จั่วแล้วล็อก) */
export async function patchReading(
  readerId: string,
  id: string,
  p: Partial<{ title: string; question: string | null; clientId: string | null; notes: Record<string, string>; body: StudioBodyPart[]; showAiDisclosure: boolean; draft: StudioReading["draft"] }>,
): Promise<boolean> {
  const sets: string[] = [];
  const vals: unknown[] = [];
  const add = (col: string, v: unknown) => (sets.push(`${col} = ?`), vals.push(v));
  if (p.title !== undefined) add("title", p.title);
  if (p.question !== undefined) add("question", p.question);
  if (p.clientId !== undefined) add("client_id", p.clientId);
  if (p.notes !== undefined) add("notes_json", JSON.stringify(p.notes));
  if (p.body !== undefined) add("body_json", JSON.stringify(p.body));
  if (p.draft !== undefined) add("draft_json", p.draft ? JSON.stringify(p.draft) : null);
  if (p.showAiDisclosure !== undefined) add("show_ai_disclosure", p.showAiDisclosure ? 1 : 0);
  if (!sets.length) return false;
  add("updated_at", Date.now());
  const db = await getAppDB();
  const res = await db.prepare(`UPDATE reader_readings SET ${sets.join(", ")} WHERE id = ? AND reader_id = ?`).bind(...vals, id, readerId).run();
  return (res.meta?.changes ?? 0) > 0;
}

/** เตรียม Provably Fair: ตรึงคำมั่นก่อนจั่ว (จั่วแล้ว/กรอกมือแล้ว = ทำซ้ำไม่ได้) */
export async function setReadingCommitment(readerId: string, id: string, serverSeed: string, commitment: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE reader_readings SET server_seed = ?, commitment = ?, updated_at = ? WHERE id = ? AND reader_id = ? AND cards_json IS NULL`)
    .bind(serverSeed, commitment, Date.now(), id, readerId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** บันทึกไพ่ — ครั้งเดียวเท่านั้น (เงื่อนไข cards_json IS NULL กันการจั่วใหม่จนได้ไพ่ที่อยากได้) */
export async function setReadingCards(readerId: string, id: string, source: "fair" | "manual", cards: StudioCard[], clientSeed: string | null): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE reader_readings SET card_source = ?, cards_json = ?, client_seed = ?, updated_at = ? WHERE id = ? AND reader_id = ? AND cards_json IS NULL`)
    .bind(source, JSON.stringify(cards), clientSeed, Date.now(), id, readerId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function deleteReading(readerId: string, id: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM reader_readings WHERE id = ? AND reader_id = ?`).bind(id, readerId).run();
  return (res.meta?.changes ?? 0) > 0;
}

/* ── ลิงก์ส่ง ─────────────────────────────────────────────────────── */

export async function publishReading(readerId: string, id: string, tokenHash: string, expiresAt: number, passwordHash: string | null): Promise<boolean> {
  const db = await getAppDB();
  const now = Date.now();
  const res = await db
    .prepare(
      `UPDATE reader_readings SET share_token_hash = ?, share_expires_at = ?, share_password_hash = ?, share_revoked_at = NULL,
         status = 'sent', sent_at = COALESCE(sent_at, ?), updated_at = ? WHERE id = ? AND reader_id = ? AND body_json IS NOT NULL AND cards_json IS NOT NULL`,
    )
    .bind(tokenHash, expiresAt, passwordHash, now, now, id, readerId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export async function revokeShare(readerId: string, id: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db
    .prepare(`UPDATE reader_readings SET share_revoked_at = ?, updated_at = ? WHERE id = ? AND reader_id = ? AND share_token_hash IS NOT NULL`)
    .bind(Date.now(), Date.now(), id, readerId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

export interface SharedReading {
  reading: StudioReading;
  readerId: string;
  passwordHash: string | null;
  tokenHash: string;
}

/** หน้าลิงก์สาธารณะ — คืนเฉพาะลิงก์ที่ยังใช้ได้ (ไม่หมดอายุ · ไม่ถูกเพิกถอน) */
export async function getSharedReading(tokenHash: string): Promise<SharedReading | null> {
  const db = await getAppDB();
  const r = await db.prepare(`SELECT * FROM reader_readings WHERE share_token_hash = ?`).bind(tokenHash).first<ReadingRow>();
  if (!r || r.share_revoked_at || (r.share_expires_at && r.share_expires_at <= Date.now())) return null;
  return { reading: mapReading(r), readerId: r.reader_id, passwordHash: r.share_password_hash, tokenHash };
}

export async function bumpShareView(tokenHash: string): Promise<void> {
  const db = await getAppDB();
  await db.prepare(`UPDATE reader_readings SET view_count = view_count + 1 WHERE share_token_hash = ?`).bind(tokenHash).run();
}

/* ── แม่แบบ ─────────────────────────────────────────────────────── */

export async function listTemplates(readerId: string): Promise<StudioTemplate[]> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT id, name, intro, closing, created_at FROM reader_templates WHERE reader_id = ? ORDER BY created_at DESC LIMIT 50`)
    .bind(readerId)
    .all<{ id: string; name: string; intro: string | null; closing: string | null; created_at: number }>();
  return (results || []).map((t) => ({ id: t.id, name: t.name, intro: t.intro, closing: t.closing, createdAt: t.created_at }));
}

export async function createTemplate(readerId: string, t: { name: string; intro?: string | null; closing?: string | null }): Promise<string> {
  const db = await getAppDB();
  const id = `rt_${crypto.randomUUID()}`;
  await db
    .prepare(`INSERT INTO reader_templates (id, reader_id, name, intro, closing, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(id, readerId, t.name, t.intro ?? null, t.closing ?? null, Date.now())
    .run();
  return id;
}

export async function deleteTemplate(readerId: string, id: string): Promise<boolean> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM reader_templates WHERE id = ? AND reader_id = ?`).bind(id, readerId).run();
  return (res.meta?.changes ?? 0) > 0;
}

/* ── ส่งออกรายลูกค้า (PDPA) ──────────────────────────────────────── */

export async function exportClient(readerId: string, clientId: string) {
  const client = await getClient(readerId, clientId);
  if (!client) return null;
  const readings = await listReadings(readerId, clientId);
  return {
    exportedAt: new Date().toISOString(),
    client,
    readings: readings.map(({ share, ...r }) => ({ ...r, share: { active: share.active, expiresAt: share.expiresAt } })),
  };
}
