/**
 * scripts/qa/test-feature-gating.ts
 * QA — ตรวจสอบระบบล็อกฟีเจอร์พรีเมียม (Freemium Gating & Locked State)
 * รันด้วย: npx tsx scripts/qa/test-feature-gating.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPREADS } from "../../src/data/spreads";
import { PERSONAS } from "../../src/data/personas";
import {
  STANDARD_SPREAD_IDS,
  isStandardSpread,
  MASTER_PERSONA_IDS,
  isMasterPersona,
  GUEST_BLOCK_REASON,
  REQUIRE_SIGNUP_TO_READ,
} from "../../src/lib/entitlement/limits";
import { UPGRADE_COPY, UPGRADE_COPY_EN, describeEntitlement } from "../../src/lib/entitlement/copy";
import { isSignInRequired, SIGN_IN_GATE_REASON } from "../../src/lib/entitlement/signin-gate";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const readSrc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), "utf-8");

let pass = 0;
let fail = 0;

function check(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log(`✅ ${name}`);
  } else {
    fail++;
    console.log(`❌ ${name}`);
  }
}

function main() {
  console.log("🧪 [QA] ระบบล็อกฟีเจอร์พรีเมียม (ผังใหญ่ & ปรมาจารย์ลับ)\n");

  // ── 1. ผังมาตรฐาน 10 ผัง สำหรับบัญชีฟรี ──
  check("ผังมาตรฐานมีจำนวนตรงตามตารางเปรียบเทียบ (10 ผัง)", STANDARD_SPREAD_IDS.size === 10);

  // ตรวจสอบว่า STANDARD_SPREAD_IDS ตรงกับ guestAllowed ใน SPREADS เสมอ (INC-0005)
  const expectedGuestIds = SPREADS.filter((s) => s.guestAllowed).map((s) => s.id).sort().join(",");
  const actualStandardIds = [...STANDARD_SPREAD_IDS].sort().join(",");
  check("STANDARD_SPREAD_IDS ตรงกับ guestAllowed ใน SPREADS เสมอ (INC-0005)", actualStandardIds === expectedGuestIds);

  const standardExpected = [
    "daily",
    "quick",
    "yes-no",
    "three-card",
    "situation-solution",
    "mind-body-spirit",
    "how-they-feel",
    "family",
    "luck",
    "study",
  ];
  for (const id of standardExpected) {
    check(`ผังมาตรฐาน ${id} เป็น free spread`, isStandardSpread(id));
  }

  // ── 2. ผังใหญ่ 15 ผังต้องถูกล็อกสำหรับบัญชีฟรี ──
  const grandExpected = [
    "celtic-cross",
    "year-ahead",
    "chakra",
    "weekly",
    "decision",
    "soulmate",
    "career",
    "career-switch",
    "love",
    "money",
    "monthly",
    "ex-reconciliation",
    "inner-potential",
    "love-six",
    "monthly-ten",
  ];
  for (const id of grandExpected) {
    check(`ผังใหญ่ ${id} ถูกล็อกสำหรับบัญชีฟรี`, !isStandardSpread(id));
  }

  // รวมต้องครบ 25 ผังพอดี
  check("จำนวนผังทั้งหมดในระบบต้องเท่ากับ 25 ผัง", SPREADS.length === 25);
  check(
    "ผังทั้งหมดต้องถูกแบ่งเป็น Standard (10) + Grand (15) ครบ 25 ผัง",
    STANDARD_SPREAD_IDS.size + (SPREADS.length - STANDARD_SPREAD_IDS.size) === 25
  );

  // ── 3. แม่หมอพื้นฐาน 3 ท่าน vs ปรมาจารย์ลับ 2 ท่าน ──
  check("แม่หมอทั้งหมดในระบบมี 5 ท่าน", PERSONAS.length === 5);
  check("ปรมาจารย์ลับมี 2 ท่าน", MASTER_PERSONA_IDS.size === 2);
  check("master (อาจารย์สายฟันธง) เป็นปรมาจารย์ลับ", isMasterPersona("master"));
  check("mystic (แม่หมอสายพลัง) เป็นปรมาจารย์ลับ", isMasterPersona("mystic"));
  check("warm (แม่หมอใจดี) เป็นแม่หมอพื้นฐาน", !isMasterPersona("warm"));
  check("playful (แม่หมอเพื่อนซี้) เป็นแม่หมอพื้นฐาน", !isMasterPersona("playful"));
  check("direct (แม่หมอพูดตรง) เป็นแม่หมอพื้นฐาน", !isMasterPersona("direct"));

  // ── 4. Copy และ Workflow การปลดล็อกใน AccessDialog ──
  const grandCopy = UPGRADE_COPY.grand_spread;
  check("มี copy สำหรับ grand_spread", Boolean(grandCopy));
  check("grand_spread มี primaryAction เป็น credits", grandCopy?.primaryAction === "credits");
  check("grand_spread มีข้อความเริ่ม 59.-", grandCopy?.primaryLabel.includes("59.-") || grandCopy?.primaryLabel.includes("เริ่ม"));

  const masterCopy = UPGRADE_COPY.master_persona;
  check("มี copy สำหรับ master_persona", Boolean(masterCopy));
  check("master_persona มี primaryAction เป็น credits", masterCopy?.primaryAction === "credits");
  check("master_persona มีข้อความเริ่ม 59.-", masterCopy?.primaryLabel.includes("59.-") || masterCopy?.primaryLabel.includes("เริ่ม"));

  // ── 4.5 กำแพง "สมัครก่อนเล่น" ต้องพูดความจริงกับคนที่ยังไม่เคยเปิดไพ่ ──
  check("GUEST_BLOCK_REASON = signup_required เมื่อบังคับสมัครก่อนเล่น", GUEST_BLOCK_REASON === "signup_required");

  const signupCopy = UPGRADE_COPY.signup_required;
  const signupCopyEn = UPGRADE_COPY_EN.signup_required;
  check("มี copy สำหรับ signup_required ทั้งไทยและอังกฤษ", Boolean(signupCopy) && Boolean(signupCopyEn));
  check("signup_required มี primaryAction เป็น signup", signupCopy?.primaryAction === "signup");
  check(
    "signup_required ต้องไม่พูดว่า 'ใช้สิทธิ์ทดลองครบแล้ว' (คนยังไม่เคยเล่น)",
    !`${signupCopy?.title} ${signupCopy?.body}`.includes("ครบแล้ว")
  );

  // ผู้เยี่ยมชมที่เพิ่งเข้าเว็บ (server คืน remaining = 0, limit = 0) ต้องถูกกั้นด้วยเหตุผลที่ถูกต้อง
  const guestView = describeEntitlement({
    enabled: true,
    canStartReading: false,
    canChat: false,
    remaining: 0,
    limit: 0,
    weeklyRemaining: 0,
    bonusRemaining: 0,
    resetAt: null,
    kind: "guest",
  });
  check("ผู้เยี่ยมชม: blocked = true", guestView?.blocked === true);
  check("ผู้เยี่ยมชม: blockedReason = signup_required", guestView?.blockedReason === "signup_required");
  check("ผู้เยี่ยมชม: ปุ่มหลักคือชวนสมัครสมาชิก", guestView?.action === "signup");
  check("ผู้เยี่ยมชม: ไม่มีจุดไฟโควตาหลอกตา (limit = 0)", guestView?.limit === 0);
  check("REQUIRE_SIGNUP_TO_READ ตรงกับสถานะกำแพงจริง", REQUIRE_SIGNUP_TO_READ === (guestView?.blockedReason === "signup_required"));

  // ── 4.6 ด่านล็อกอินต้องอยู่ "นอก" ธงระบบสิทธิ์ (INC-0111) ──
  // ธง `entitlement.enforced` บน production เคยถูกปิดค้างไว้ ทำให้ด่านสิทธิ์ทั้งก้อนถูกข้าม
  // ใครก็เปิดไพ่ได้ไม่จำกัดโดยไม่ต้องสมัครสมาชิก · ด่านนี้กันไม่ให้ใครย้ายมันกลับเข้าไปในธงอีก
  check("isSignInRequired: ผู้เยี่ยมชม → true", isSignInRequired({ kind: "guest" }) === true);
  check("isSignInRequired: สมาชิก → false", isSignInRequired({ kind: "member" }) === false);
  check("SIGN_IN_GATE_REASON = signup_required", SIGN_IN_GATE_REASON === "signup_required");

  const GATED_ROUTES = [
    "src/app/api/reading/start/route.ts",
    "src/app/api/reading/[id]/read/route.ts",
    "src/app/api/reading/[id]/chat/route.ts",
  ];
  for (const rel of GATED_ROUTES) {
    const src = readSrc(rel);
    check(`${rel}: เรียก isSignInRequired()`, src.includes("isSignInRequired("));
    // รูปแบบเดิมที่เป็นต้นเหตุ — ครอบทุกด่านไว้ใต้ธงทั้งก้อน ห้ามกลับมาอีก
    check(
      `${rel}: ไม่ครอบด่านทั้งก้อนด้วย if (await isEntitlementEnabled())`,
      !src.includes("if (await isEntitlementEnabled())")
    );
  }

  for (const rel of GATED_ROUTES.slice(0, 2)) {
    const src = readSrc(rel);
    // ต้องเป็นเงื่อนไขเดี่ยว ๆ ห้ามมีธงมาร่วมตัดสิน (เคยพลาดมาแล้วว่าแค่ "อยู่ก่อน" ไม่พอ —
    // เขียน `if (enforced && isSignInRequired(viewer))` ก็ยังอยู่ก่อน แต่ด่านตายสนิทเมื่อธงปิด)
    check(
      `${rel}: ด่านล็อกอินเป็นเงื่อนไขเดี่ยว ไม่มีธงมาร่วม`,
      src.includes("if (isSignInRequired(viewer)) {")
    );
    check(
      `${rel}: ด่านล็อกอินอยู่ก่อนบล็อกโควตา if (enforced)`,
      src.indexOf("if (isSignInRequired(viewer)) {") < src.indexOf("if (enforced)")
    );
    check(
      `${rel}: ไม่มี enforced มาผูกกับด่านล็อกอิน`,
      !/enforced\s*&&\s*isSignInRequired/.test(src) && !/isSignInRequired\([^)]*\)\s*&&\s*enforced/.test(src)
    );
  }

  const chatSrc = readSrc("src/app/api/reading/[id]/chat/route.ts");
  check(
    "chat route: กั้นเฉพาะสมาชิกแม้ธงโควตาปิด (enforced || isSignInRequired)",
    chatSrc.includes("enforced || isSignInRequired(viewer)")
  );

  const entitlementApi = readSrc("src/app/api/entitlement/route.ts");
  check(
    "GET /api/entitlement: คืนกำแพงสมัครสมาชิกให้ผู้เยี่ยมชมแม้ธงโควตาปิด",
    entitlementApi.includes("isSignInRequired(guestViewer)")
  );

  // ── 5. ความสอดคล้องของ guestAllowed กับ isStandardSpread (ป้องกัน ISSUE-031) ──
  for (const s of SPREADS) {
    check(
      `ผัง '${s.id}': guestAllowed (${s.guestAllowed}) ต้องตรงกับ isStandardSpread (${isStandardSpread(s.id)})`,
      s.guestAllowed === isStandardSpread(s.id)
    );
  }

  console.log(`\nสรุป: ผ่าน ${pass} ข้อ, ล้มเหลว ${fail} ข้อ\n`);
  if (fail > 0) process.exit(1);
}

main();
