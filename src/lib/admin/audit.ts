import { KEY, kvListKeys, kvPutJSON } from "@/lib/platform/kv-store";
import { getAppKV } from "@/lib/platform/cf";

/**
 * Audit log ของการกระทำในแผงแอดมิน — append-only บน KV
 * key: app:audit:<ts>:<rand>  (เรียงตามเวลาโดยธรรมชาติเพราะ ts นำหน้า)
 *
 * ⚠️ ห้ามบันทึก PII หรือค่า secret — เก็บแค่ว่า "ใคร (admin)" ทำ "อะไร" "เมื่อไร"
 */

export interface AuditEntry {
  ts: number;
  action: string;
  detail?: string;
}

export async function recordAudit(action: string, detail?: string): Promise<void> {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 8);
  const entry: AuditEntry = { ts, action, detail: detail?.slice(0, 500) };
  try {
    await kvPutJSON(KEY.audit(ts, rand), entry, { expirationTtl: 60 * 60 * 24 * 180 });
  } catch {
    // audit ล้มเหลวไม่ควรบล็อกการทำงานหลัก
  }
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  const keys = await kvListKeys(KEY.auditPrefix(), 1000);
  // key เรียง ascending → เอาท้ายสุด (ใหม่สุด) กลับด้าน
  const recent = keys.slice(-limit).reverse();
  const kv = await getAppKV();
  // อ่านขนานกัน — ของเดิมวนอ่านทีละคีย์ สูงสุด 100 รอบต่อการเปิดแผงแอดมิน 1 ครั้ง
  const raws = await Promise.all(recent.map((k) => kv.get(k).catch(() => null)));
  const out: AuditEntry[] = [];
  for (const raw of raws) {
    if (!raw) continue;
    try {
      out.push(JSON.parse(raw) as AuditEntry);
    } catch {
      /* skip */
    }
  }
  return out;
}
