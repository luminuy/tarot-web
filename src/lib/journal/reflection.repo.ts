import { getAppDB } from "@/lib/platform/db";

/** ✦ แคชผลสะท้อนจากสมุด (migrations/0028) — อ่าน/เขียนด้วย user_id เสมอ */
export async function getReflection<T>(userId: string, key: string): Promise<T | null> {
  const db = await getAppDB();
  const row = await db
    .prepare(`SELECT result_json FROM reflection_cache WHERE cache_key = ? AND user_id = ?`)
    .bind(key, userId)
    .first<{ result_json: string }>();
  if (!row) return null;
  try {
    return JSON.parse(row.result_json) as T;
  } catch {
    return null;
  }
}

export async function putReflection(userId: string, key: string, lang: string, value: unknown): Promise<void> {
  const db = await getAppDB();
  await db
    .prepare(
      `INSERT INTO reflection_cache (cache_key, user_id, lang, result_json, created_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(cache_key) DO UPDATE SET result_json = excluded.result_json, created_at = excluded.created_at`
    )
    .bind(key, userId, lang, JSON.stringify(value), Date.now())
    .run();
  // เก็บแค่ 20 ฉบับล่าสุดต่อคน — แคช ไม่ใช่คลัง
  await db
    .prepare(
      `DELETE FROM reflection_cache WHERE user_id = ? AND cache_key NOT IN
       (SELECT cache_key FROM reflection_cache WHERE user_id = ? ORDER BY created_at DESC LIMIT 20)`
    )
    .bind(userId, userId)
    .run();
}

export async function listReflections(userId: string): Promise<Array<{ lang: string; result: unknown; createdAt: string }>> {
  const db = await getAppDB();
  const { results } = await db
    .prepare(`SELECT lang, result_json, created_at FROM reflection_cache WHERE user_id = ? ORDER BY created_at DESC`)
    .bind(userId)
    .all<{ lang: string; result_json: string; created_at: number }>();
  return (results || []).map((r) => {
    let result: unknown = null;
    try {
      result = JSON.parse(r.result_json);
    } catch {
      result = null;
    }
    return { lang: r.lang, result, createdAt: new Date(r.created_at).toISOString() };
  });
}

export async function deleteReflections(userId: string): Promise<number> {
  const db = await getAppDB();
  const res = await db.prepare(`DELETE FROM reflection_cache WHERE user_id = ?`).bind(userId).run();
  return res.meta?.changes ?? 0;
}
