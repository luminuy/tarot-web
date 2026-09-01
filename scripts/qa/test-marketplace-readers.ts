#!/usr/bin/env tsx
/**
 * QA Test: Marketplace Readers Repository & Data Integrity
 */

import {
  createReader,
  deleteReader,
  getPublicReaderById,
  getReaderById,
  listPublicApprovedReaders,
  listReaders,
  recordAdminAudit,
  setReaderStatus,
  updateReader,
} from "../../src/lib/marketplace/readers.repo";

async function runTest() {
  console.log("🔍 [QA] กำลังทดสอบ Marketplace Readers Repository & Security...");

  // 1. Test Create Reader
  const created = await createReader({
    displayName: "แม่หมอทดสอบระบบ",
    bio: "ผู้เชี่ยวชาญศาสตร์ทาโรต์ 10 ปี",
    avatarUrl: "https://example.com/avatar.jpg",
    specialties: ["ความรัก", "การงาน"],
    lineUrl: "https://line.me/ti/p/~testreader",
    status: "approved",
    commissionPct: 25,
  });

  if (!created.id || !created.sessionSecret) {
    throw new Error("❌ createReader failed: ID or sessionSecret is missing");
  }
  if (created.displayName !== "แม่หมอทดสอบระบบ") {
    throw new Error(`❌ createReader failed: Expected displayName 'แม่หมอทดสอบระบบ', got '${created.displayName}'`);
  }
  if (!created.specialties.includes("ความรัก") || !created.specialties.includes("การงาน")) {
    throw new Error("❌ createReader failed: Specialties not preserved");
  }
  console.log("  ✓ createReader สำเร็จ (ID:", created.id, ")");

  // 2. Test Get Reader by ID
  const fetched = await getReaderById(created.id);
  if (!fetched || fetched.id !== created.id) {
    throw new Error("❌ getReaderById failed");
  }
  console.log("  ✓ getReaderById สำเร็จ");

  // 3. Test Public Projection Security (Must NOT leak lineUrl or sessionSecret)
  const publicProfile = await getPublicReaderById(created.id);
  if (!publicProfile) {
    throw new Error("❌ getPublicReaderById failed");
  }
  if ("lineUrl" in publicProfile || "sessionSecret" in publicProfile) {
    throw new Error("❌ Security violation: Public reader profile leaks lineUrl or sessionSecret!");
  }
  console.log("  ✓ Public reader profile projection ปลอดภัย (ไม่รั่วไหล LINE หรือ Secret)");

  // 4. Test List Public Approved
  const publicList = await listPublicApprovedReaders();
  const existsInPublic = publicList.some((r) => r.id === created.id);
  if (!existsInPublic) {
    throw new Error("❌ listPublicApprovedReaders failed: created approved reader not found in list");
  }
  console.log("  ✓ listPublicApprovedReaders สำเร็จ (พบแม่หมอในลิสต์สาธารณะ)");

  // 5. Test Update Reader
  const updated = await updateReader(created.id, {
    displayName: "แม่หมอทดสอบ (แก้ไข)",
    specialties: ["ความรัก", "การงาน", "การเงิน"],
    commissionPct: 30,
  });
  if (!updated || updated.displayName !== "แม่หมอทดสอบ (แก้ไข)" || updated.commissionPct !== 30) {
    throw new Error("❌ updateReader failed");
  }
  if (updated.specialties.length !== 3) {
    throw new Error("❌ updateReader specialties update failed");
  }
  console.log("  ✓ updateReader สำเร็จ");

  // 6. Test Status Change (Suspended -> should disappear from public list)
  await setReaderStatus(created.id, "suspended");
  const publicAfterSuspended = await getPublicReaderById(created.id);
  if (publicAfterSuspended !== null) {
    throw new Error("❌ Suspended reader should NOT be accessible in public view");
  }
  console.log("  ✓ setReaderStatus('suspended') สำเร็จ (ถูกซ่อนจากหน้าสาธารณะ)");

  // 7. Test Admin Audit Trail
  await recordAdminAudit("test_actor", "test_action", "test detail");
  console.log("  ✓ recordAdminAudit สำเร็จ");

  // 8. Test Delete Reader
  const deleted = await deleteReader(created.id);
  if (!deleted) {
    throw new Error("❌ deleteReader returned false");
  }
  const checkDeleted = await getReaderById(created.id);
  if (checkDeleted !== null) {
    throw new Error("❌ deleteReader failed: reader still exists in DB");
  }
  console.log("  ✓ deleteReader สำเร็จ (ลบข้อมูลทดสอบเรียบร้อย)");

  console.log("\n✨ [QA] Marketplace Readers Test ผ่านครบทุกด่าน 100%!");
}

runTest().catch((err) => {
  console.error("\n❌ [QA Test Failed]", err);
  process.exit(1);
});
