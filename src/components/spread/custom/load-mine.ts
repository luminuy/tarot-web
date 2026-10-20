/**
 * ✦ โหลด "ผังของฉัน" พร้อมย้ายผังที่เก็บในเครื่องขึ้นบัญชีหลังล็อกอิน (A4-06)
 * ---------------------------------------------------------------------------
 * ผู้เยี่ยมชมบันทึกผังไว้ในเครื่อง พร้อมข้อความ "เข้าสู่ระบบเพื่อใช้ข้ามเครื่อง" — พอล็อกอินแล้ว
 * `loadMySpreads` คืนแต่ผังในบัญชี ผังในเครื่องจึงหายจากรายการทั้งที่ยังค้างใน localStorage (เก็บเต็ม 10 ผัง ลบไม่ได้)
 *
 * ตัวนี้อัปโหลดผังในเครื่องขึ้นบัญชีทีละผัง (เซิร์ฟเวอร์ตรวจ/จำกัดจำนวนเหมือนบันทึกปกติ) แล้วล้างออกจากเครื่องเฉพาะผังที่ขึ้นสำเร็จ
 * ผังที่ขึ้นไม่ได้ (บัญชีเต็ม · ผังไม่ผ่านด่านตรวจ) ไม่ถูกลบ — แสดงต่อท้ายรายการให้เห็นและลบเองได้
 * ⚠️ ไฟล์นี้ใช้ใน island — ห้าม import สำรับ/สารานุกรม
 */
import {
  deleteLocalSpread,
  listLocalSpreads,
  loadMySpreads,
  saveSpreadRemote,
  type MyCustomSpread,
} from "@/lib/tarot/custom-spread-client";

/** รอบย้ายที่กำลังวิ่ง — เรียกซ้อน (StrictMode · สองคอมโพเนนต์) ใช้รอบเดียวกัน ไม่อัปโหลดซ้ำจนผังซ้ำในบัญชี */
let migrating: Promise<void> | null = null;
/** ผังในเครื่องที่ขึ้นบัญชีไม่ได้ในหน้านี้ — ไม่ยิงซ้ำทุกครั้งที่รีเฟรชรายการ (กันชนเพดานถี่ของเซิร์ฟเวอร์) */
const failedLocalIds = new Set<string>();

async function migrateLocalToAccount(lang: "th" | "en"): Promise<void> {
  for (const local of listLocalSpreads()) {
    if (failedLocalIds.has(local.id)) continue;
    const r = await saveSpreadRemote(local, lang);
    if (r.unauthorized) return; // เซสชันหลุดกลางทาง — ของที่เหลือรอรอบหน้า
    if (r.spread) deleteLocalSpread(local.id);
    else failedLocalIds.add(local.id);
  }
}

export async function loadMyAndMigrate(lang: "th" | "en"): Promise<{ spreads: MyCustomSpread[]; member: boolean }> {
  let result = await loadMySpreads();
  if (!result.member || listLocalSpreads().length === 0) return result;

  if (!migrating) {
    migrating = migrateLocalToAccount(lang)
      .catch(() => undefined)
      .finally(() => {
        migrating = null;
      });
  }
  await migrating;

  // อ่านรายการในบัญชีใหม่หลังย้าย แล้วต่อท้ายด้วยผังที่ยังค้างในเครื่อง (ถ้ามี)
  result = await loadMySpreads();
  return { spreads: [...result.spreads, ...listLocalSpreads()], member: true };
}
