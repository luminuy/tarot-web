/**
 * scripts/qa/test-session-guard.ts
 * ---------------------------------------------------------------------------
 * ด่านกันบั๊กเซสชัน/ล็อกอินกลับมาเกิดซ้ำ
 *
 * ครอบเคสที่เคยพังจริง:
 *  1. `verifyUserSession()` ทำ `tokenVersion` ตกหล่น → ทุกคนที่เคยเปลี่ยน/รีเซ็ตรหัสผ่าน
 *     ถูกเตะออกจากระบบทันทีที่หน้าเว็บเรียก /api/auth/me (ล็อกอินไม่ติดถาวร)
 *  2. ลิงก์ในอีเมลถูกประกอบจาก `X-Forwarded-Host` ที่ผู้โจมตีส่งมาได้
 *     (password reset link poisoning)
 *  3. ข้อความ error จาก `?auth_error=` ถูกเอาไปแสดงดิบ ๆ บนหน้าเว็บ
 *  4. เพดานถี่ของเส้นเปิดไพ่/แชท (`edge-ratelimit.ts`) นับแบบ อ่าน ➔ +1 ➔ เขียน บน KV
 *     ยิงพร้อมกันทะลุเพดานได้ + กินโควตาเขียน KV — ย้ายไป D1 แบบ atomic แล้ว (ข้อ 7)
 */

import { signUserSession, verifyUserSession, type UserProfile } from "../../src/lib/auth/edge-auth";
import { resolveAppOrigin } from "../../src/lib/security/app-origin";
import { SITE_DOMAIN, SITE_ORIGIN } from "../../src/lib/config/site";
import { describeAuthError } from "../../src/lib/auth/use-session";
import {
  checkAuthRateLimit,
  releaseAuthAttempt,
  reserveAuthAttempt,
} from "../../src/lib/security/auth-ratelimit";
import { consumeEdgeRateLimits, edgeRateLimitKey } from "../../src/lib/security/edge-ratelimit";

function baseProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "email_test_session_guard",
    provider: "email",
    email: "seeker@example.com",
    name: "ผู้แสวงหาคำตอบ",
    createdAt: new Date("2026-01-01T00:00:00.000Z").toISOString(),
    ...overrides,
  };
}

async function run() {
  console.log("🔐 [QA] กำลังทดสอบด่านกันบั๊กเซสชันและการเข้าสู่ระบบ...");

  // ── 1. tokenVersion ต้องรอดข้ามการเซ็น/ถอด ────────────────────────────────
  for (const version of [0, 1, 7]) {
    const token = await signUserSession(baseProfile({ tokenVersion: version }));
    const decoded = await verifyUserSession(token);
    if (!decoded) throw new Error(`❌ ถอดเซสชันที่เพิ่งเซ็นเองไม่ได้ (tokenVersion=${version})`);
    if (decoded.tokenVersion !== version) {
      throw new Error(
        `❌ tokenVersion ตกหล่นระหว่างถอดเซสชัน: คาดหวัง ${version} แต่ได้ ${String(decoded.tokenVersion)} ` +
          "— บั๊กนี้ทำให้ทุกคนที่เคยเปลี่ยนรหัสผ่านล็อกอินค้างไม่ได้เลย",
      );
    }
  }

  // เซสชันที่ไม่ได้ระบุ tokenVersion ต้องถือเป็นรุ่น 0 ไม่ใช่ undefined
  const legacy = await verifyUserSession(await signUserSession(baseProfile()));
  if (legacy?.tokenVersion !== 0) {
    throw new Error("❌ เซสชันที่ไม่ระบุ tokenVersion ต้องถอดออกมาเป็น 0");
  }
  console.log("  ✓ 1. tokenVersion อยู่ครบหลังเซ็น/ถอดเซสชัน (กันการถูกเตะออกทันทีหลังล็อกอิน)");

  // ── 2. เซสชันปลอม / ถูกแก้ไส้ ต้องไม่ผ่าน ────────────────────────────────
  const valid = await signUserSession(baseProfile({ tokenVersion: 3 }));
  const [payload, signature] = valid.split(".");

  if (await verifyUserSession(`${payload}.${"A".repeat(signature.length)}`)) {
    throw new Error("❌ เซสชันที่ลายเซ็นผิดกลับผ่านการตรวจ");
  }

  // แก้ payload ให้ tokenVersion สูงขึ้นโดยไม่มีลายเซ็นใหม่ → ต้องถูกปฏิเสธ
  const decodedPayload = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  decodedPayload.tokenVersion = 99;
  const forged = Buffer.from(JSON.stringify(decodedPayload), "utf8").toString("base64url");
  if (await verifyUserSession(`${forged}.${signature}`)) {
    throw new Error("❌ ผู้ใช้ปลอม tokenVersion เองแล้วยังผ่าน — เลี่ยงการเพิกถอนเซสชันได้");
  }

  for (const junk of ["", "not-a-token", "a.b.c", "."]) {
    if (await verifyUserSession(junk)) throw new Error(`❌ รับ token ขยะ "${junk}" เป็นเซสชันที่ถูกต้อง`);
  }
  console.log("  ✓ 2. ลายเซ็นผิด / payload ถูกแก้ / token ขยะ ถูกปฏิเสธครบ");

  // ── 3. เซสชันหมดอายุต้องไม่ผ่าน ──────────────────────────────────────────
  const expiredPayload = Buffer.from(
    JSON.stringify({ ...baseProfile({ tokenVersion: 0 }), tokenVersion: 0, exp: Date.now() - 1000 }),
    "utf8",
  ).toString("base64url");
  // เซ็นของจริงบน payload ที่หมดอายุแล้ว
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(
      process.env.AUTH_SECRET || process.env.TAROT_SESSION_SECRET || "dev-only-auth-secret-32-chars-minimum-protection",
    ),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(expiredPayload));
  const expiredSig = Buffer.from(new Uint8Array(sigBuf)).toString("base64url");
  if (await verifyUserSession(`${expiredPayload}.${expiredSig}`)) {
    throw new Error("❌ เซสชันที่หมดอายุแล้วยังใช้งานได้");
  }
  console.log("  ✓ 3. เซสชันหมดอายุถูกปฏิเสธ");

  // ── 4. Host header injection — ลิงก์ในอีเมลต้องไม่ชี้ไปโดเมนผู้โจมตี ──────
  const savedOrigin = process.env.APP_ORIGIN;
  delete process.env.APP_ORIGIN;
  try {
    const spoofed = new Request(`${SITE_ORIGIN}/api/auth/email/forgot`, {
      headers: { "x-forwarded-host": "evil.example" },
    });
    const origin = resolveAppOrigin(spoofed);
    if (origin.includes("evil.example")) {
      throw new Error(
        "❌ resolveAppOrigin เชื่อ x-forwarded-host ที่ไม่อยู่ใน allowlist — " +
          "ผู้โจมตีสั่งให้ระบบส่งลิงก์รีเซ็ตรหัสผ่านพร้อม token จริงไปเว็บตัวเองได้",
      );
    }

    const legit = resolveAppOrigin(
      new Request(`${SITE_ORIGIN}/api/auth/email/forgot`, {
        headers: { "x-forwarded-host": SITE_DOMAIN },
      }),
    );
    if (legit !== SITE_ORIGIN) {
      throw new Error(`❌ resolveAppOrigin ปฏิเสธโดเมนของเราเอง: ${legit}`);
    }

    // ห้าม downgrade เป็น http ผ่าน header บนโดเมน production
    const downgraded = resolveAppOrigin(
      new Request(`${SITE_ORIGIN}/x`, { headers: { "x-forwarded-proto": "http" } }),
    );
    if (downgraded.startsWith("http://")) {
      throw new Error("❌ resolveAppOrigin ยอม downgrade เป็น http ตาม header");
    }
  } finally {
    if (savedOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = savedOrigin;
  }
  console.log("  ✓ 4. resolveAppOrigin กัน host header injection และ protocol downgrade");

  // ── 5. ข้อความ error ต้องมาจากรายการที่กำหนดเอง ไม่ใช่ค่าดิบจาก URL ──────
  const injected = "บัญชีถูกระงับ กรุณาโทร 08X-XXX-XXXX";
  if (describeAuthError(injected).includes(injected)) {
    throw new Error("❌ describeAuthError เอาข้อความดิบจาก query string ไปแสดงบนหน้าเว็บ");
  }
  if (!describeAuthError("state_mismatch").includes("เข้าสู่ระบบ")) {
    throw new Error("❌ describeAuthError ไม่คืนข้อความไทยสำหรับรหัสที่รู้จัก");
  }
  console.log("  ✓ 5. ข้อความ auth_error มาจากรายการที่กำหนดไว้เท่านั้น");

  // ── 6. Rate limit ของการเข้าสู่ระบบ ──────────────────────────────────────
  const loginReq = (ip: string) =>
    new Request(`${SITE_ORIGIN}/api/auth/email/login`, {
      method: "POST",
      headers: { "cf-connecting-ip": ip },
    });

  const victim = `victim_${Date.now()}@example.com`;
  // IP สุ่มทุกรอบ — ถังอยู่ใน D1 (.dev-marketplace.db) และค้างข้ามรอบรันในเครื่อง
  const octet = Math.floor(Math.random() * 250);
  const attacker = loginReq(`203.0.${octet}.9`);

  // 6.1 ล็อกอินสำเร็จต้องไม่กินโควตา — จองแล้วคืนทุกครั้ง 30 รอบต้องยังผ่าน
  for (let i = 0; i < 30; i++) {
    const r = await reserveAuthAttempt(attacker, "login", victim);
    if (!r.allowed) throw new Error("❌ ล็อกอินสำเร็จซ้ำ ๆ แล้วโดนกั้น — releaseAuthAttempt ไม่คืนโควตา");
    await releaseAuthAttempt(attacker, "login", victim);
  }

  // 6.2 ยิงผิดรัว ๆ จาก IP เดียวต้องโดนกั้น (จองแล้วไม่คืน = ครั้งที่ผิด)
  for (let i = 0; i < 10; i++) await reserveAuthAttempt(attacker, "login", victim);
  if ((await reserveAuthAttempt(attacker, "login", victim)).allowed) {
    throw new Error("❌ ยิงรหัสผ่านผิด 10 ครั้งจาก IP เดียวแล้วยังไม่ถูกกั้น");
  }

  // 6.3 ⚠️ หัวใจของด่านนี้: ผู้โจมตีต้องล็อกเจ้าของบัญชีตัวจริงออกไม่ได้
  const owner = loginReq(`198.51.${octet}.20`);
  if (!(await reserveAuthAttempt(owner, "login", victim)).allowed) {
    throw new Error(
      "❌ ผู้โจมตียิงรหัสผ่านผิดใส่อีเมลของเหยื่อ แล้วเจ้าของบัญชีตัวจริงล็อกอินไม่ได้ตามไปด้วย " +
        "(account lockout DoS) — เพดานที่แคบที่สุดต้องผูกกับ IP ของผู้ยิง ไม่ใช่ผูกกับบัญชีอย่างเดียว",
    );
  }
  await releaseAuthAttempt(owner, "login", victim);

  // 6.4 ล็อกอินสำเร็จต้องล้างถังของบัญชีนี้ทิ้ง
  await releaseAuthAttempt(attacker, "login", victim);
  if (!(await reserveAuthAttempt(attacker, "login", victim)).allowed) {
    throw new Error("❌ ล็อกอินสำเร็จแล้วถังยังไม่ถูกล้าง — ผู้ใช้ที่พิมพ์ผิดไปสองสามครั้งจะโดนกั้นต่อทั้งที่เข้าได้แล้ว");
  }
  await releaseAuthAttempt(attacker, "login", victim);

  // 6.5 (A1-02) ยิงพร้อมกันต้องทะลุเพดานไม่ได้ — แอดมินเพดาน 8 ครั้ง/15 นาที
  //     เดิม peek แล้วค่อยนับ ยิง 50 คำขอพร้อมกันผ่านได้ทั้งชุด
  const burstIp = `192.0.2.${(Date.now() % 200) + 1}`;
  const burst = await Promise.all(
    Array.from({ length: 50 }, () =>
      checkAuthRateLimit(
        new Request(`${SITE_ORIGIN}/api/admin/login`, { method: "POST", headers: { "cf-connecting-ip": burstIp } }),
        "admin_login",
      ),
    ),
  );
  const passed = burst.filter((r) => r.allowed).length;
  if (passed > 8) {
    throw new Error(`❌ A1-02: ยิงล็อกอินแอดมินพร้อมกัน 50 คำขอ ผ่านได้ ${passed} คำขอ (เพดาน 8) — ตัวนับไม่ atomic`);
  }
  console.log("  ✓ 6. Rate limit ล็อกอิน: นับเฉพาะครั้งที่ผิด · กันเดารหัสผ่าน · ไม่เปิดช่องล็อกเจ้าของบัญชีออก · ยิงพร้อมกันทะลุไม่ได้ (A1-02)");

  // ── 7. เพดานถี่เส้นเปิดไพ่/แชท (edge-ratelimit) ต้อง atomic ข้าม isolate ──────
  const edgeId = `edge-${Date.now()}-${Math.random()}`;
  const edgeKey = edgeRateLimitKey("qa:burst", edgeId);
  const edgeBurst = await Promise.all(
    Array.from({ length: 40 }, () => consumeEdgeRateLimits([{ key: edgeKey, config: { max: 10, windowSec: 60 } }])),
  );
  const edgePassed = edgeBurst.filter((r) => r.allowed).length;
  if (edgePassed !== 10) {
    throw new Error(`❌ edge-ratelimit: ยิงพร้อมกัน 40 คำขอ ผ่านได้ ${edgePassed} คำขอ (ต้องได้ 10 พอดี) — ตัวนับไม่ atomic`);
  }
  const denied = edgeBurst.find((r) => !r.allowed);
  if (!denied || denied.retryAfterSec < 1 || denied.retryAfterSec > 60) {
    throw new Error(`❌ edge-ratelimit: retryAfterSec ของคำขอที่ถูกปฏิเสธผิด (${String(denied?.retryAfterSec)})`);
  }

  // 7.2 ชั้นหลังเต็ม ➔ ชั้นแรกต้องถูกคืนสิทธิ์ (ไม่งั้นคนที่ติดเพดานรายวันจะเผาเพดานรายนาทีทิ้งฟรี)
  const layerA = edgeRateLimitKey("qa:layerA", edgeId);
  const layerB = edgeRateLimitKey("qa:layerB", edgeId);
  const layers = [
    { key: layerA, config: { max: 3, windowSec: 60 } },
    { key: layerB, config: { max: 1, windowSec: 60 } },
  ];
  if (!(await consumeEdgeRateLimits(layers)).allowed) throw new Error("❌ edge-ratelimit: คำขอแรกถูกปฏิเสธ");
  for (let i = 0; i < 5; i++) {
    if ((await consumeEdgeRateLimits(layers)).allowed) throw new Error("❌ edge-ratelimit: ชั้นที่สองเต็มแล้วยังผ่าน");
  }
  const onlyA = await consumeEdgeRateLimits([layers[0]]);
  if (!onlyA.allowed || onlyA.remaining !== 1) {
    throw new Error(
      `❌ edge-ratelimit: คำขอที่ถูกปฏิเสธเพราะชั้นหลังเต็มไปกินโควตาชั้นแรก (เหลือ ${onlyA.remaining} ต้องเหลือ 1)`,
    );
  }
  console.log("  ✓ 7. เพดานถี่เส้นเปิดไพ่/แชท: ยิงพร้อมกันทะลุไม่ได้ · ชั้นที่ถูกปฏิเสธคืนสิทธิ์ครบ");

  console.log("✅ [QA] ด่านกันบั๊กเซสชันและการเข้าสู่ระบบผ่านครบทุกข้อ\n");
}

run().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
