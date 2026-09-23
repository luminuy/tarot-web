import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getEntitlement, grantBonus } from "@/lib/entitlement/entitlement";
import { getAppDB } from "@/lib/platform/db";

export const runtime = "nodejs";

/**
 * 👥 จัดการสมาชิก (แอดมินเท่านั้น)
 * ---------------------------------------------------------------------------
 * ทำไมต้องมี: เดิมแผงแอดมินมีแค่ "รายชื่อผู้ยินยอมรับข่าวสาร" — เวลาลูกค้าทักมาว่า
 * "เปิดไพ่ไม่ได้ / สิทธิ์หาย" ไม่มีทางค้นหาบัญชี ดูสิทธิ์คงเหลือ หรือชดเชยสิทธิ์ให้ได้เลย
 *
 * GET  ?q=คำค้น      ค้นจากอีเมล · ชื่อ · รหัสผู้ใช้ (ไม่ใส่ = 50 คนที่สมัครล่าสุด)
 * GET  ?id=<userId>  รายละเอียด + สิทธิ์คงเหลือ + ประวัติโบนัส
 * POST { userId, amount, note }  ให้สิทธิ์เปิดไพ่เพิ่ม (1–50 ครั้ง) · บันทึกลง audit ทุกครั้ง
 */

const LIST_LIMIT = 50;
const DAY_MS = 86_400_000;

interface MemberRow {
  id: string;
  provider: string;
  email: string | null;
  name: string;
  created_at: number;
  last_seen_at: number;
  deleted_at: number | null;
  marketing_consent: number;
  email_verified: number | null;
  readings?: number | null;
}

function toMember(r: MemberRow) {
  return {
    id: r.id,
    provider: r.provider,
    email: r.email,
    name: r.name,
    createdAt: Number(r.created_at),
    lastSeenAt: Number(r.last_seen_at),
    deletedAt: r.deleted_at == null ? null : Number(r.deleted_at),
    marketingConsent: Number(r.marketing_consent) === 1,
    emailVerified: Number(r.email_verified ?? 0) === 1,
    readings: r.readings == null ? null : Number(r.readings),
  };
}

/** กันอักขระพิเศษของ LIKE ไม่ให้กลายเป็น wildcard */
function likeArg(q: string): string {
  return `%${q.toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

const BASE_COLUMNS =
  "u.id, u.provider, u.email, u.name, u.created_at, u.last_seen_at, u.deleted_at, u.marketing_consent, u.email_verified";

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const url = new URL(request.url);
  const id = url.searchParams.get("id")?.trim();
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 100);

  let db;
  try {
    db = await getAppDB();
  } catch (err) {
    console.error("[admin/members] getAppDB failed:", err);
    return NextResponse.json({ error: "เชื่อมต่อฐานข้อมูลไม่ได้" }, { status: 503 });
  }

  // ── รายละเอียดคนเดียว ───────────────────────────────────────────────
  if (id) {
    const row = await db
      .prepare(`SELECT ${BASE_COLUMNS} FROM users u WHERE u.id = ? LIMIT 1`)
      .bind(id)
      .first<MemberRow>()
      .catch(() => null);
    if (!row) return NextResponse.json({ error: "ไม่พบสมาชิกนี้" }, { status: 404 });

    const [ent, bonuses, readings] = await Promise.all([
      getEntitlement({ kind: "member", userId: id }).catch(() => null),
      db
        .prepare(`SELECT reason, granted, granted_at FROM user_bonus WHERE user_id = ? ORDER BY granted_at DESC LIMIT 20`)
        .bind(id)
        .all<{ reason: string; granted: number; granted_at: number }>()
        .then((r) => r.results ?? [])
        .catch(() => []),
      db
        .prepare(`SELECT COUNT(*) AS n FROM reading_usage WHERE user_id = ?`)
        .bind(id)
        .first<{ n: number }>()
        .then((r) => Number(r?.n ?? 0))
        .catch(() => null),
    ]);

    return NextResponse.json({
      member: toMember({ ...row, readings }),
      entitlement: ent
        ? {
            remaining: ent.remaining,
            dailyRemaining: ent.dailyRemaining,
            bonusRemaining: ent.bonusRemaining,
            hasPaidCredits: ent.hasPaidCredits,
            dailyStreak: ent.dailyStreak,
          }
        : null,
      bonuses: bonuses.map((b) => ({ reason: b.reason, granted: Number(b.granted), grantedAt: Number(b.granted_at) })),
    });
  }

  // ── รายการ / ค้นหา ─────────────────────────────────────────────────
  const where = q ? "WHERE (LOWER(COALESCE(u.email, '')) LIKE ? ESCAPE '\\' OR LOWER(u.name) LIKE ? ESCAPE '\\' OR u.id = ?)" : "";
  const args = q ? [likeArg(q), likeArg(q), q] : [];

  const listWith = (readingsCol: string) =>
    db
      .prepare(`SELECT ${BASE_COLUMNS}${readingsCol} FROM users u ${where} ORDER BY u.created_at DESC LIMIT ${LIST_LIMIT}`)
      .bind(...args)
      .all<MemberRow>();

  let rows: MemberRow[];
  try {
    rows = (await listWith(", (SELECT COUNT(*) FROM reading_usage r WHERE r.user_id = u.id) AS readings")).results ?? [];
  } catch {
    // ตาราง reading_usage ยังไม่มี — ยังค้นสมาชิกได้ แค่ไม่มีจำนวนการเปิดไพ่
    try {
      rows = (await listWith("")).results ?? [];
    } catch (err) {
      console.error("[admin/members] list failed:", err);
      return NextResponse.json({ error: "อ่านรายชื่อสมาชิกไม่สำเร็จ" }, { status: 500 });
    }
  }

  const now = Date.now();
  const totals = await db
    .prepare(
      `SELECT
         SUM(CASE WHEN deleted_at IS NULL THEN 1 ELSE 0 END) AS total,
         SUM(CASE WHEN deleted_at IS NULL AND created_at >= ? THEN 1 ELSE 0 END) AS new7d,
         SUM(CASE WHEN deleted_at IS NULL AND last_seen_at >= ? THEN 1 ELSE 0 END) AS active7d
       FROM users`,
    )
    .bind(now - 7 * DAY_MS, now - 7 * DAY_MS)
    .first<{ total: number | null; new7d: number | null; active7d: number | null }>()
    .catch(() => null);

  return NextResponse.json({
    query: q,
    members: rows.map(toMember),
    limit: LIST_LIMIT,
    totals: {
      total: Number(totals?.total ?? 0),
      new7d: Number(totals?.new7d ?? 0),
      active7d: Number(totals?.active7d ?? 0),
    },
  });
}

const GrantBody = z.object({
  userId: z.string().min(1, "ไม่ได้ระบุสมาชิก").max(200),
  amount: z.number().int().min(1, "ให้ได้ 1–50 ครั้ง").max(50, "ให้ได้ 1–50 ครั้ง"),
  note: z.string().trim().min(3, "ระบุเหตุผลอย่างน้อย 3 ตัวอักษร").max(200),
});

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = GrantBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง (ต้องมี userId · amount 1–50 · note)" },
      { status: 400 },
    );
  }
  const { userId, amount, note } = parsed.data;

  const db = await getAppDB();
  const user = await db
    .prepare(`SELECT id, deleted_at FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ id: string; deleted_at: number | null }>()
    .catch(() => null);
  if (!user) return NextResponse.json({ error: "ไม่พบสมาชิกนี้" }, { status: 404 });
  if (user.deleted_at != null) return NextResponse.json({ error: "บัญชีนี้ถูกลบแล้ว" }, { status: 409 });

  // reason ต้องไม่ซ้ำต่อผู้ใช้ (UNIQUE(user_id, reason)) และต้องไม่ขึ้นต้นด้วย "purchase_"
  // ไม่งั้นสิทธิ์ที่แอดมินให้จะถูกนับเป็น "สิทธิ์ที่ซื้อ" และปลดล็อกผังพรีเมียมไปด้วย
  const reason = `admin_${crypto.randomUUID()}`;
  const ok = await grantBonus(userId, amount, reason);
  if (!ok) return NextResponse.json({ error: "ให้สิทธิ์ไม่สำเร็จ ลองใหม่อีกครั้ง" }, { status: 500 });

  await recordAudit("member_bonus_grant", `${userId} +${amount} · ${note}`);
  return NextResponse.json({ ok: true, granted: amount });
}
