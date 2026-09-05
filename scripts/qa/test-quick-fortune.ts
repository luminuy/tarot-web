import { QUICK_TOPICS } from "../../src/components/reading/QuickFortunePicker";
import { SPREADS } from "../../src/data/spreads";
import { STANDARD_SPREAD_IDS, isStandardSpread } from "../../src/lib/entitlement/limits";
import { checkQuestion } from "../../src/lib/safety/guardrails";
import { drawCards, createCommitment, normalizeClientSeed } from "../../src/lib/tarot/shuffle";

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean) {
  if (ok) {
    pass++;
  } else {
    fail++;
    console.error(`❌ [FAIL] ${label}`);
  }
}

console.log("⚡ [QA] ตรวจสอบความสมบูรณ์ของระบบทำนายด่วน (Quick Fortune)...");

// 1. ตรวจสอบ QUICK_TOPICS ทั้ง 4 หัวข้อ
check("มีหัวข้อทำนายด่วนครบ 4 หัวข้อ", QUICK_TOPICS.length === 4);

const expectedCategories = new Set(["love", "work", "money", "general"]);
const seenCategories = new Set<string>();

for (const topic of QUICK_TOPICS) {
  check(`หัวข้อ ${topic.title} (${topic.id}): category ถูกต้อง`, expectedCategories.has(topic.category));
  seenCategories.add(topic.category);

  check(`หัวข้อ ${topic.title}: มี title ชัดเจน`, !!topic.title && topic.title.length > 0);
  check(`หัวข้อ ${topic.title}: มี tagline ชัดเจน`, !!topic.tagline && topic.tagline.length > 0);
  check(`หัวข้อ ${topic.title}: มี defaultQuestion`, !!topic.defaultQuestion && topic.defaultQuestion.length > 5);
  check(`หัวข้อ ${topic.title}: มี badge`, !!topic.badge && topic.badge.length > 0);
  check(`หัวข้อ ${topic.title}: มี highlightText`, !!topic.highlightText && topic.highlightText.length > 0);

  // ตรวจกฎข้อ 2: ห้ามใช้อิโมจิการ์ตูนทั่วไป (อนุญาตเฉพาะ ✦ และ ✨ และ ➔)
  const hasCartoonEmoji = /[\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F900}-\u{1F9FF}]/u.test(
    `${topic.title} ${topic.tagline} ${topic.badge} ${topic.highlightText}`
  );
  check(`หัวข้อ ${topic.title}: ไร้อิโมจิการ์ตูนตามกฎข้อ 2`, !hasCartoonEmoji);

  // ตรวจความปลอดภัยของ defaultQuestion
  const safetyVerdict = checkQuestion(topic.defaultQuestion);
  check(`หัวข้อ ${topic.title}: defaultQuestion ปลอดภัย ไม่ถูกบล็อก`, !safetyVerdict.block && safetyVerdict.flag !== "crisis");
}

check("ครอบคลุมครบทั้ง 4 หมวดหลัก (love, work, money, general)", seenCategories.size === 4);

// 2. ตรวจสอบการผูกกับ Spread "quick"
const quickSpread = SPREADS.find((s) => s.id === "quick");
check("พบ Spread 'quick' ในระบบ", !!quickSpread);
if (quickSpread) {
  check("Spread 'quick' มีไพ่ 1 ใบพอดี", quickSpread.positions.length === 1);
  check("Spread 'quick' เป็นสิทธิ์ฟรี (credits: 0)", quickSpread.credits === 0);
  check("Spread 'quick' อนุญาตให้ผู้เยี่ยมชมใช้งานได้ (guestAllowed: true)", quickSpread.guestAllowed === true);
  check("Spread 'quick' อยู่ใน STANDARD_SPREAD_IDS", isStandardSpread("quick") && STANDARD_SPREAD_IDS.has("quick"));
}

// 3. ตรวจสอบ Server Draw Logic เมื่อไม่ส่ง pickedIndices
const commitment = createCommitment();
const clientSeed = normalizeClientSeed(null);
const drawnAuto = drawCards({
  serverSeed: commitment.serverSeed,
  clientSeed,
  count: 1,
});
check("drawCards จั่วไพ่ได้ 1 ใบเมื่อไม่ส่ง pickedIndices", drawnAuto.length === 1);
check("ตำแหน่ง order เป็น 0", drawnAuto[0].order === 0);
check("cardIndex อยู่ในช่วง 0-77", drawnAuto[0].cardIndex >= 0 && drawnAuto[0].cardIndex < 78);

console.log(`\n✨ ผลการตรวจ: ${pass}/${pass + fail} ผ่าน`);
if (fail > 0) {
  process.exit(1);
}
