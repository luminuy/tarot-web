/**
 * ⚡ ด่านงบคำขอต่อการเปิดหน้า (Per-Pageview Request Budget)
 * ---------------------------------------------------------------------------
 * ที่มา: ตรวจ production 2026-09-09 พบว่าการเปิดหน้าหนึ่งครั้งปลุก Worker ถึง **3 คำขอ**
 * (HTML + `/api/auth/me` + `/api/entitlement`) ทั้งที่เอกสารเขียนไว้ว่า 2 และเขียนว่า
 * "ผู้ชมที่ไม่ล็อกอินต้องเห็น /api/* 0 เส้น" ซึ่งจริงเฉพาะหน้าที่สองเป็นต้นไปเท่านั้น
 *
 * ด่านนี้ตรึงพฤติกรรมใหม่ไว้ด้วยการ **รันโค้ดจริง** พร้อมของปลอมของ `document.cookie`
 * และ `fetch` แล้วนับว่ายิงไปกี่เส้น — ไม่ใช่การสแกนซอร์สด้วย regex (บทเรียน INC-0114)
 *
 * เกณฑ์:
 *   1. ไม่มีคุกกี้ใบ้ (ผู้ชมจาก Google) → `fetchSessionUser()` ต้องไม่ยิงอะไรเลย
 *   2. มีคุกกี้ใบ้ (ล็อกอินอยู่)        → ยิง `/api/auth/me` ครั้งเดียว
 *   3. `ensureEntitlement()`            → ยิง `/api/bootstrap` เส้นเดียว (ไม่ใช่สองเส้น)
 *      และต้องเติมผู้ใช้เข้าแคชเซสชันให้ด้วย เพื่อไม่ให้มีใครไปยิง `/api/auth/me` ซ้ำ
 */
import { fileURLToPath } from "node:url";

const AUTH_HINT_COOKIE = "tarot_has_session";

/** ของปลอมฝั่งเบราว์เซอร์ — ต้องตั้งก่อน import โมดูลที่อ่าน `window`/`document` */
function installBrowserStubs(cookie: string) {
  const calls: string[] = [];
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };

  (globalThis as Record<string, unknown>).window = {
    sessionStorage: storage,
    localStorage: storage,
    location: { href: "https://seertarot.net/" },
  };
  (globalThis as Record<string, unknown>).document = { cookie };

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    const body =
      url.includes("/api/bootstrap")
        ? { user: { id: "u1", name: "Alex", provider: "email", createdAt: "" }, entitlement: { enabled: true, canStartReading: true, canChat: true, remaining: 3, limit: 3, weeklyRemaining: 3, bonusRemaining: 0, resetAt: null } }
        : { user: null };
    return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  }) as typeof fetch;

  return calls;
}

async function run() {
  console.log("🧪 ตรวจงบคำขอต่อการเปิดหน้า (รันโค้ดจริง ไม่ใช่สแกนซอร์ส)...");
  const errors: string[] = [];

  // ── เกณฑ์ 1: ผู้ชมที่ไม่มีคุกกี้ใบ้ ต้องไม่ยิงอะไรเลย ─────────────────────
  {
    const calls = installBrowserStubs("");
    const { fetchSessionUser, invalidateSessionCache } = await import("../../src/lib/auth/use-session");
    invalidateSessionCache();
    const user = await fetchSessionUser();
    if (calls.length !== 0) {
      errors.push(`ผู้ชมที่ไม่ล็อกอินยังยิง ${calls.length} คำขอตอนเปิดหน้า: ${calls.join(", ")}`);
    }
    if (user !== null) errors.push(`ผู้ชมที่ไม่ล็อกอินต้องได้ user = null (ได้ ${JSON.stringify(user)})`);
  }

  // ── เกณฑ์ 2: มีคุกกี้ใบ้ → ยิง /api/auth/me ครั้งเดียว ────────────────────
  {
    const calls = installBrowserStubs(`${AUTH_HINT_COOKIE}=1`);
    const { fetchSessionUser, invalidateSessionCache } = await import("../../src/lib/auth/use-session");
    invalidateSessionCache();
    await fetchSessionUser();
    const meCalls = calls.filter((c) => c.includes("/api/auth/me"));
    if (meCalls.length !== 1) {
      errors.push(`ผู้ใช้ที่ล็อกอินอยู่ต้องยิง /api/auth/me พอดี 1 ครั้ง (ยิงจริง ${meCalls.length} · ทั้งหมด: ${calls.join(", ") || "ไม่มี"})`);
    }
  }

  // ── เกณฑ์ 3: ensureEntitlement ใช้ /api/bootstrap เส้นเดียว + เติมแคชผู้ใช้ ─
  {
    const calls = installBrowserStubs("");
    const { ensureEntitlement } = await import("../../src/lib/entitlement/use-entitlement");
    const { fetchSessionUser, invalidateSessionCache } = await import("../../src/lib/auth/use-session");
    invalidateSessionCache();

    const ent = await ensureEntitlement();
    if (!ent) errors.push("ensureEntitlement() คืน null ทั้งที่เซิร์ฟเวอร์ตอบสิทธิ์มาแล้ว");

    if (calls.length !== 1 || !calls[0].includes("/api/bootstrap")) {
      errors.push(`ensureEntitlement() ต้องยิง /api/bootstrap เส้นเดียว (ยิงจริง: ${calls.join(", ") || "ไม่มี"})`);
    }

    // ต้องเติมผู้ใช้เข้าแคชแล้ว — ขอซ้ำต้องไม่มีคำขอใหม่เพิ่ม
    const before = calls.length;
    await fetchSessionUser();
    if (calls.length !== before) {
      errors.push(`หลัง /api/bootstrap แล้วยังมีคนไปยิง /api/auth/me ซ้ำอีก: ${calls.slice(before).join(", ")}`);
    }
  }

  if (errors.length > 0) {
    console.error(`❌ QA FAILED — งบคำขอเกินที่ตั้งไว้ ${errors.length} ข้อ:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("✅ ผ่าน — ผู้ชมที่ไม่ล็อกอินเปิดหน้าโดยไม่ยิง /api/* เลยสักเส้น");
  console.log("   - ผู้ใช้ที่ล็อกอินอยู่ใช้ /api/bootstrap เส้นเดียวแทนสองเส้นเดิม");
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void run();
}
