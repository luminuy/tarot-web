import { getAppDB } from "@/lib/platform/db";

/** อีเมลรับแจ้งเตือนของแม่หมอ (migrations/0021) — เติมให้ในหน้าจ่าย Stripe เมื่อมี · รูปแบบผิด = ไม่ส่ง */
export async function getNotifyEmail(readerId: string): Promise<string | null> {
  try {
    const db = await getAppDB();
    const r = await db.prepare(`SELECT notify_email FROM readers WHERE id = ?`).bind(readerId).first<{ notify_email: string | null }>();
    const e = r?.notify_email?.trim() ?? "";
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
  } catch {
    return null;
  }
}
