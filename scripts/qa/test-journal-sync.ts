/**
 * scripts/qa/test-journal-sync.ts
 * QA Test Suite for Consumer Users & Reading Journal Server Sync (D1 / SQLite)
 */

import { upsertUserOnLogin, getUserById, setMarketingConsent, softDeleteUser } from "@/lib/users/users.repo";
import {
  insertJournal,
  listJournal,
  bulkImportJournal,
  updateJournalOutcome,
  deleteJournalItem,
  deleteAllJournal,
  countPendingOlderThan,
} from "@/lib/journal/journal.repo";
import type { SavedReadingItem } from "@/lib/utils/history";

async function runJournalSyncQATests() {
  console.log("🧪 [QA Test] เริ่มต้นตรวจสอบระบบ Users & Server Journal Sync...");

  const testUserId = `test_user_${Date.now()}`;

  // 1. Test User Upsert & Retrieval
  const user = await upsertUserOnLogin({
    id: testUserId,
    provider: "google",
    email: "test@example.com",
    name: "นักอ่านไพ่ทดสอบ",
    avatarUrl: "https://example.com/avatar.png",
  });

  if (!user || user.id !== testUserId || user.email !== "test@example.com") {
    throw new Error("❌ User upsert failed to return expected user object");
  }

  const fetchedUser = await getUserById(testUserId);
  if (!fetchedUser || fetchedUser.name !== "นักอ่านไพ่ทดสอบ") {
    throw new Error("❌ getUserById failed to retrieve upserted user");
  }

  // Test marketing consent
  await setMarketingConsent(testUserId, true);
  const consentedUser = await getUserById(testUserId);
  if (!consentedUser?.marketingConsent) {
    throw new Error("❌ setMarketingConsent failed to update consent flag");
  }

  console.log("  ✓ 1. Users Repo (Upsert, Get, Consent): ผ่าน");

  // 2. Test Single Journal Insert & Dedup with Content Hash
  const sampleReading: Omit<SavedReadingItem, "id" | "date"> = {
    question: "อนาคตการงานจะเป็นอย่างไร?",
    spreadId: "three-card",
    spreadName: "ผังไพ่ 3 ใบ",
    category: "career",
    personaId: "warm",
    personaName: "แม่หมออบอุ่น",
    cards: [
      { order: 1, positionName: "อดีต", cardIndex: 0, cardNameTh: "The Fool", cardNameEn: "The Fool", isReversed: false },
      { order: 2, positionName: "ปัจจุบัน", cardIndex: 1, cardNameTh: "The Magician", cardNameEn: "The Magician", isReversed: false },
      { order: 3, positionName: "อนาคต", cardIndex: 2, cardNameTh: "The High Priestess", cardNameEn: "The High Priestess", isReversed: true },
    ],
    summary: "มีโอกาสใหม่กำลังเข้ามา",
    outcome: "PENDING",
  };

  const inserted = await insertJournal(testUserId, sampleReading);
  if (!inserted.id || inserted.outcome !== "PENDING") {
    throw new Error("❌ insertJournal failed to return valid SavedReadingItem");
  }

  // Insert identical reading -> should be deduped via ON CONFLICT DO NOTHING
  await insertJournal(testUserId, sampleReading);
  const list1 = await listJournal(testUserId);
  if (list1.length !== 1) {
    throw new Error(`❌ Content hash dedup failed: expected 1 item, got ${list1.length}`);
  }

  console.log("  ✓ 2. Journal Insert & Deduplication: ผ่าน");

  // 3. Test Outcome & Note Update
  await updateJournalOutcome(testUserId, inserted.id, "ACCURATE", "ได้งานใหม่ตรงตามที่ไพ่บอกเป๊ะ");
  const list2 = await listJournal(testUserId);
  if (list2[0].outcome !== "ACCURATE" || list2[0].userNote !== "ได้งานใหม่ตรงตามที่ไพ่บอกเป๊ะ") {
    throw new Error("❌ updateJournalOutcome failed to update outcome or note");
  }

  console.log("  ✓ 3. Journal Outcome & Note Update: ผ่าน");

  // 4. Test Bulk Import
  const importItems: SavedReadingItem[] = [
    {
      id: "reading_local_1",
      date: new Date(Date.now() - 100000).toISOString(),
      question: "ความรักในเดือนนี้",
      spreadId: "single",
      spreadName: "ผัง 1 ใบ",
      category: "love",
      personaId: "mystic",
      personaName: "แม่หมอลึกลับ",
      cards: [{ order: 1, positionName: "ภาพรวม", cardIndex: 6, cardNameTh: "The Lovers", cardNameEn: "The Lovers", isReversed: false }],
      summary: "ความสัมพันธ์ราบรื่น",
      outcome: "PENDING",
    },
    {
      id: "reading_local_2",
      date: new Date(Date.now() - 200000).toISOString(),
      question: "การเงินสัปดาห์นี้",
      spreadId: "single",
      spreadName: "ผัง 1 ใบ",
      category: "finance",
      personaId: "practical",
      personaName: "แม่หมอตรงไปตรงมา",
      cards: [{ order: 1, positionName: "ภาพรวม", cardIndex: 10, cardNameTh: "Wheel of Fortune", cardNameEn: "Wheel of Fortune", isReversed: false }],
      summary: "มีโชคลาภ",
      outcome: "PENDING",
    },
  ];

  const importRes = await bulkImportJournal(testUserId, importItems);
  if (importRes.merged < 2) {
    throw new Error(`❌ bulkImportJournal failed: expected at least 2 merged, got ${importRes.merged}`);
  }

  const list3 = await listJournal(testUserId);
  if (list3.length !== 3) {
    throw new Error(`❌ Expected 3 total items after bulk import, got ${list3.length}`);
  }

  console.log("  ✓ 4. Journal Bulk Import: ผ่าน");

  // 5. Test countPendingOlderThan
  const pendingCount = await countPendingOlderThan(testUserId, 0);
  if (pendingCount !== 2) {
    throw new Error(`❌ countPendingOlderThan failed: expected 2 pending items, got ${pendingCount}`);
  }

  console.log("  ✓ 5. Count Pending Readings: ผ่าน");

  // 6. Test Delete Item & Delete All
  await deleteJournalItem(testUserId, list3[0].id);
  const list4 = await listJournal(testUserId);
  if (list4.length !== 2) {
    throw new Error(`❌ deleteJournalItem failed: expected 2 items remaining, got ${list4.length}`);
  }

  const deletedTotal = await deleteAllJournal(testUserId);
  if (deletedTotal !== 2) {
    throw new Error(`❌ deleteAllJournal failed: expected 2 deleted, got ${deletedTotal}`);
  }

  const list5 = await listJournal(testUserId);
  if (list5.length !== 0) {
    throw new Error(`❌ Expected 0 items after deleteAllJournal, got ${list5.length}`);
  }

  // Cleanup test user
  await softDeleteUser(testUserId);
  const deletedUser = await getUserById(testUserId);
  if (deletedUser !== null) {
    throw new Error("❌ softDeleteUser failed: user still returned from getUserById");
  }

  console.log("  ✓ 6. Journal Deletion & User Cleanup: ผ่าน");
  console.log("✨ [QA Test] ผ่านการทดสอบ Users & Server Journal Sync ครบถ้วน 100%!");
}

runJournalSyncQATests().catch((err) => {
  console.error("💥 [QA Test Error]:", err);
  process.exit(1);
});
