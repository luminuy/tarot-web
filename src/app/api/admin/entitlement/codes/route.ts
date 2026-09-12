import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  GIFT_REASON_PREFIX,
  PREMIUM_REASON_PREFIX,
  redeemKindOf,
  type RedeemKind,
} from "@/lib/entitlement/redeem";
import { getAppDB } from "@/lib/platform/db";

export const runtime = "nodejs";

/**
 * แผงออกรหัสแลกสิทธิ์ — /admin ➔ แท็บ "สิทธิ์เปิดไพ่" ➔ การ์ด "รหัสแลกสิทธิ์"
 * -----------------------------------------------------------------------
 * ทำไมต้องเป็น API ของแอดมิน ไม่ใช่สคริปต์ใน terminal: ตาราง `redeem_codes` อยู่บน
 * Cloudflare D1 ซึ่งสคริปต์ฝั่ง Node เข้าไม่ถึง (`getAppDB()` บนเครื่อง = local SQLite)
 * ถ้าไม่มีหน้าจอนี้ ทางเดียวที่จะออกรหัสแจกบน production คือ seed ลงไฟล์ migration
 * ซึ่งคือต้นเหตุของช่องโหว่รอบที่แล้ว (รหัสอยู่ในรีโป + ไม่จำกัดจำนวนคนแลก)
 *
 * GET   — รายการรหัสทั้งหมดพร้อมยอดแลก
 * POST  — ออกรหัสใหม่ (สุ่มให้เอง) เลือกชนิด gift / premium
 * PATCH — ปิดรหัส · ขยายเพดาน · เลื่อนวันหมดอายุ
 */

/** อักษรที่ใช้สุ่มรหัส — ตัด 0/O/1/I/L ออกเพราะคนอ่านผิดเวลาพิมพ์ตาม */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(kind: RedeemKind): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
  return `${kind === "premium" ? "VIP" : "GIFT"}-${body.slice(0, 4)}-${body.slice(4, 8)}`;
}

const CreateBody = z.object({
  kind: z.enum(["gift", "premium"]),
  title: z.string().trim().min(1).max(120),
  credits: z.number().int().min(1).max(100),
  /** เพดานจำนวนคนที่แลกได้รวม — บังคับใส่ ไม่มีตัวเลือก "ไม่จำกัด" โดยตั้งใจ */
  maxUses: z.number().int().min(1).max(10_000),
  /** อายุรหัสเป็นวัน — บังคับเช่นกัน รหัสที่ไม่มีวันตายคือรหัสที่หลุดแล้วหลุดเลย */
  expiresInDays: z.number().int().min(1).max(365),
});

const PatchBody = z.object({
  code: z.string().trim().min(1).max(64),
  isActive: z.boolean().optional(),
  maxUses: z.number().int().min(1).max(10_000).optional(),
  expiresInDays: z.number().int().min(1).max(365).optional(),
});

interface CodeRow {
  code: string;
  title: string;
  credits: number;
  max_uses: number;
  used_count: number;
  reason_prefix: string;
  expires_at: number | null;
  is_active: number;
  created_at: number;
}

function toView(row: CodeRow) {
  return {
    code: row.code,
    title: row.title,
    credits: Number(row.credits),
    maxUses: Number(row.max_uses),
    usedCount: Number(row.used_count),
    kind: redeemKindOf(row.reason_prefix),
    expiresAt: row.expires_at ? Number(row.expires_at) : null,
    isActive: Boolean(row.is_active),
    createdAt: Number(row.created_at),
  };
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const db = await getAppDB();
    const rows = await db
      .prepare(
        `SELECT code, title, credits, max_uses, used_count, reason_prefix, expires_at, is_active, created_at
           FROM redeem_codes
          ORDER BY created_at DESC, code ASC
          LIMIT 200`,
      )
      .all<CodeRow>();
    return NextResponse.json({ codes: (rows.results ?? []).map(toView) });
  } catch (err) {
    console.error("[admin/codes] อ่านรายการรหัสไม่สำเร็จ:", err);
    return NextResponse.json({ error: "อ่านรายการรหัสไม่สำเร็จ" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = CreateBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { kind, title, credits, maxUses, expiresInDays } = parsed.data;
  const reasonPrefix = kind === "premium" ? PREMIUM_REASON_PREFIX : GIFT_REASON_PREFIX;
  const expiresAt = Date.now() + expiresInDays * 24 * 60 * 60 * 1000;

  try {
    const db = await getAppDB();
    // สุ่มใหม่ได้ถึง 5 ครั้งเผื่อชนรหัสเดิม — `INSERT OR IGNORE` แล้วเช็ก changes
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = randomCode(kind);
      const res = await db
        .prepare(
          `INSERT OR IGNORE INTO redeem_codes
             (code, title, credits, max_uses, used_count, reason_prefix, expires_at, is_active, created_at)
           VALUES (?, ?, ?, ?, 0, ?, ?, 1, ?)`,
        )
        .bind(code, title, credits, maxUses, reasonPrefix, expiresAt, Date.now())
        .run();

      if ((res.meta?.changes ?? 0) > 0) {
        await recordAudit("redeem_code_created", `${code} · ${kind} · ${credits} รอบ · ${maxUses} สิทธิ์`);
        return NextResponse.json({
          ok: true,
          code: { code, title, credits, maxUses, usedCount: 0, kind, expiresAt, isActive: true, createdAt: Date.now() },
        });
      }
    }
    return NextResponse.json({ error: "สุ่มรหัสไม่สำเร็จ ลองอีกครั้ง" }, { status: 500 });
  } catch (err) {
    console.error("[admin/codes] สร้างรหัสไม่สำเร็จ:", err);
    return NextResponse.json({ error: "สร้างรหัสไม่สำเร็จ" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const parsed = PatchBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { code, isActive, maxUses, expiresInDays } = parsed.data;

  const sets: string[] = [];
  const values: unknown[] = [];
  if (typeof isActive === "boolean") {
    sets.push("is_active = ?");
    values.push(isActive ? 1 : 0);
  }
  if (typeof maxUses === "number") {
    sets.push("max_uses = ?");
    values.push(maxUses);
  }
  if (typeof expiresInDays === "number") {
    sets.push("expires_at = ?");
    values.push(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
  }
  if (sets.length === 0) {
    return NextResponse.json({ error: "ไม่มีอะไรให้แก้" }, { status: 400 });
  }

  try {
    const db = await getAppDB();
    const res = await db
      .prepare(`UPDATE redeem_codes SET ${sets.join(", ")} WHERE code = ?`)
      .bind(...values, code.toUpperCase())
      .run();

    if ((res.meta?.changes ?? 0) === 0) {
      return NextResponse.json({ error: "ไม่พบรหัสนี้" }, { status: 404 });
    }
    await recordAudit("redeem_code_updated", `${code.toUpperCase()} · ${sets.join(", ")}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/codes] แก้รหัสไม่สำเร็จ:", err);
    return NextResponse.json({ error: "แก้รหัสไม่สำเร็จ" }, { status: 500 });
  }
}
