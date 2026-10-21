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
 *   4. `loadMySpreads()` (แถว "ผังของฉัน" ในหน้าแรก) → ไม่มีคุกกี้ใบ้ต้องไม่ยิงอะไรเลย
 *      และต้องได้ผังในเครื่องแทน · มีคุกกี้ใบ้ → ยิง `/api/spreads/custom` ครั้งเดียว (A9-01)
 *   5. แคชที่ขอบของ GET สาธารณะ (`withEdgeCache` · A9-02) → คำขอซ้ำไม่สร้างคำตอบใหม่
 *      (ไม่แตะ D1/KV) · เก็บเฉพาะคำขอไม่มีคุกกี้ · `Authorization` ไม่แตะแคช · ไม่เก็บ 503/no-store/Set-Cookie
 *      · เสิร์ฟจากแคชคืน Cache-Control เดิม + หัว `Age` และ `/api/daily-card` ต่อ query ยังใช้คีย์เดียวกัน
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

  // ── เกณฑ์ 4: แถว "ผังของฉัน" ของหน้าแรก — ผู้ชมไม่ล็อกอินต้องไม่ปลุก Worker (A9-01) ─
  {
    const calls = installBrowserStubs("");
    const { loadMySpreads } = await import("../../src/lib/tarot/custom-spread-client");
    const anon = await loadMySpreads();
    if (calls.length !== 0) {
      errors.push(`loadMySpreads() ของผู้ชมที่ไม่ล็อกอินยังยิง ${calls.length} คำขอ: ${calls.join(", ")}`);
    }
    if (anon.member !== false) errors.push("loadMySpreads() ของผู้ชมที่ไม่ล็อกอินต้องคืน member = false (ใช้ผังในเครื่อง)");
  }
  {
    const calls = installBrowserStubs(`${AUTH_HINT_COOKIE}=1`);
    const { loadMySpreads } = await import("../../src/lib/tarot/custom-spread-client");
    await loadMySpreads();
    const spreadCalls = calls.filter((c) => c.includes("/api/spreads/custom"));
    if (spreadCalls.length !== 1) {
      errors.push(`ผู้ใช้ที่ล็อกอินอยู่ต้องยิง /api/spreads/custom พอดี 1 ครั้ง (ยิงจริง ${spreadCalls.length} · ทั้งหมด: ${calls.join(", ") || "ไม่มี"})`);
    }
  }

  // ── เกณฑ์ 5: แคชที่ขอบของ GET สาธารณะ (A9-02) ─────────────────────────
  {
    const edge = await import("../../src/lib/platform/edge-cache");
    const stored = new Map<string, { body: string; status: number; headers: [string, string][] }>();
    edge.setEdgeCacheStoreForTests({
      async match(req) {
        const hit = stored.get(req.url);
        return hit ? new Response(hit.body, { status: hit.status, headers: hit.headers }) : undefined;
      },
      async put(req, res) {
        stored.set(req.url, { body: await res.text(), status: res.status, headers: [...res.headers.entries()] });
      },
    });
    const flush = () => new Promise((r) => setTimeout(r, 10));
    let produced = 0;
    const make = (cc: string, extra: Record<string, string> = {}, status = 200) => async () => {
      produced++;
      return new Response(JSON.stringify({ n: produced }), { status, headers: { "Cache-Control": cc, ...extra } });
    };
    const CC = "public, max-age=600, s-maxage=3600, stale-while-revalidate=600";
    const get = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

    const first = await edge.withEdgeCache(get("https://seertarot.net/api/stats/public"), make(CC));
    await flush();
    const second = await edge.withEdgeCache(get("https://seertarot.net/api/stats/public"), make(CC));
    if (produced !== 1) errors.push(`withEdgeCache: คำขอซ้ำยังสร้างคำตอบใหม่ (สร้าง ${produced} ครั้ง ควรเป็น 1)`);
    if (first.headers.get(edge.EDGE_CACHE_STATUS_HEADER) !== "MISS" || second.headers.get(edge.EDGE_CACHE_STATUS_HEADER) !== "HIT") {
      errors.push("withEdgeCache: หัว x-edge-cache ต้องเป็น MISS แล้ว HIT");
    }
    if (second.headers.get("Cache-Control") !== CC) errors.push(`withEdgeCache: เสิร์ฟจากแคชต้องคืน Cache-Control เดิม (ได้ ${second.headers.get("Cache-Control")})`);
    if (second.headers.get("Age") === null) errors.push("withEdgeCache: เสิร์ฟจากแคชต้องมีหัว Age");
    if ([...second.headers.keys()].some((k) => k.startsWith("x-edge-") && k !== edge.EDGE_CACHE_STATUS_HEADER)) {
      errors.push("withEdgeCache: หัวภายในของแคชหลุดออกไปถึงผู้เรียก");
    }
    if ((await second.json()).n !== 1) errors.push("withEdgeCache: เนื้อหาจากแคชไม่ตรงกับที่เก็บไว้");

    // คำขอที่มีคุกกี้ได้คำตอบจากแคชได้ แต่ห้ามเป็นคนเก็บลงแคช
    produced = 0;
    await edge.withEdgeCache(get("https://seertarot.net/api/x-cookie", { cookie: "a=1" }), make(CC));
    await flush();
    await edge.withEdgeCache(get("https://seertarot.net/api/x-cookie"), make(CC));
    if (produced !== 2) errors.push("withEdgeCache: คำขอที่มีคุกกี้ต้องไม่ถูกเก็บลงแคช");
    produced = 0;
    const cookieHit = await edge.withEdgeCache(get("https://seertarot.net/api/stats/public", { cookie: "a=1" }), make(CC));
    if (produced !== 0 || cookieHit.headers.get(edge.EDGE_CACHE_STATUS_HEADER) !== "HIT") {
      errors.push("withEdgeCache: คำขอที่มีคุกกี้ควรได้คำตอบสาธารณะจากแคชที่มีอยู่แล้ว");
    }

    // Authorization ไม่แตะแคช · คำตอบที่ห้ามเก็บต้องไม่ถูกเก็บ
    produced = 0;
    await edge.withEdgeCache(get("https://seertarot.net/api/stats/public", { authorization: "Bearer t" }), make(CC));
    if (produced !== 1) errors.push("withEdgeCache: คำขอที่มี Authorization ต้องไม่ได้คำตอบจากแคช");
    for (const [label, producer] of [
      ["503", make(CC, {}, 503)],
      ["no-store", make("no-store")],
      ["private", make("private, max-age=60")],
      ["Set-Cookie", make(CC, { "Set-Cookie": "s=1" })],
    ] as const) {
      const url = `https://seertarot.net/api/x-${label}`;
      await edge.withEdgeCache(get(url), producer);
      await flush();
      if (stored.has(url)) errors.push(`withEdgeCache: คำตอบแบบ ${label} ต้องไม่ถูกเก็บลงแคช`);
    }
    if (edge.edgeTtlSeconds("public, max-age=60, s-maxage=120") !== 120) errors.push("edgeTtlSeconds ต้องใช้ s-maxage ก่อน max-age");

    // เส้นจริง: /api/daily-card คีย์ผูกวันไทย ไม่รวม query — ?d= ของไคลเอนต์ยังได้จากแคชเดียวกัน
    const route = await import("../../src/app/api/daily-card/route");
    const a = await route.GET(get("https://seertarot.net/api/daily-card"));
    await flush();
    const b = await route.GET(get("https://seertarot.net/api/daily-card?d=2099-01-01"));
    if (a.status !== 200 || b.headers.get(edge.EDGE_CACHE_STATUS_HEADER) !== "HIT") {
      errors.push(`/api/daily-card ต้องตอบคำขอที่สองจากแคชที่ขอบ (ได้ ${a.status} · ${b.headers.get(edge.EDGE_CACHE_STATUS_HEADER)})`);
    }
    edge.setEdgeCacheStoreForTests(undefined);
  }

  if (errors.length > 0) {
    console.error(`❌ QA FAILED — งบคำขอเกินที่ตั้งไว้ ${errors.length} ข้อ:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log("✅ ผ่าน — ผู้ชมที่ไม่ล็อกอินเปิดหน้าโดยไม่ยิง /api/* เลยสักเส้น");
  console.log("   - ผู้ใช้ที่ล็อกอินอยู่ใช้ /api/bootstrap เส้นเดียวแทนสองเส้นเดิม");
  console.log("   - แถว \"ผังของฉัน\" ของผู้ชมที่ไม่ล็อกอินไม่ยิง /api/spreads/custom");
  console.log("   - GET สาธารณะตอบซ้ำจากแคชที่ขอบ (ไม่เก็บคำขอที่มีคุกกี้/Authorization)");
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void run();
}
