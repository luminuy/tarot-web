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
 *   6. ตัวเก็บ INP (`inp-reporter.ts`) → หน้าที่ INP < 200 ms ไม่ยิงอะไรเลย · หน้าที่ช้ายิง `/api/stats/inp` ครั้งเดียว
 *      ข้อมูลที่ส่งผ่านสคีมาฝั่งเซิร์ฟเวอร์ และแยกช่วงเวลาถูก (ไม่นับ pointerdown ที่วาดไปก่อน) · localhost/Safari ไม่ฟังเลย
 *   7. เส้น `/api/stats/inp` → origin ภายนอก / ข้อความอิสระ / INP ต่ำกว่าเกณฑ์ ถูกปฏิเสธ · เกินเพดานถี่ทิ้งเงียบ
 *   8. ตัวบทนิยาย (`loadNovelChapter` · สมาชิกเท่านั้น) → ไม่มีคุกกี้ใบ้ต้องไม่ยิงอะไรเลยและได้หน้าชวนเข้าสู่ระบบ
 *      · มีคุกกี้ใบ้ → ยิง `/api/novel/<เลขบท>` ครั้งเดียว
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

  // ── เกณฑ์ 8: ตัวบทนิยาย (สมาชิกเท่านั้น) — ผู้ชมไม่ล็อกอินต้องไม่ปลุก Worker ─────
  {
    const calls = installBrowserStubs("");
    const { loadNovelChapter } = await import("../../src/lib/novel/client");
    const anon = await loadNovelChapter(1);
    if (calls.length !== 0) errors.push(`loadNovelChapter() ของผู้ชมที่ไม่ล็อกอินยังยิง ${calls.length} คำขอ: ${calls.join(", ")}`);
    if (anon.status !== "login") errors.push(`loadNovelChapter() ของผู้ชมที่ไม่ล็อกอินต้องได้ status "login" (ได้ ${anon.status})`);
  }
  {
    const calls = installBrowserStubs(`${AUTH_HINT_COOKIE}=1`);
    const { loadNovelChapter } = await import("../../src/lib/novel/client");
    await loadNovelChapter(3);
    if (calls.length !== 1 || !calls[0].endsWith("/api/novel/3")) {
      errors.push(`สมาชิกต้องยิง /api/novel/3 พอดี 1 ครั้ง (ทั้งหมด: ${calls.join(", ") || "ไม่มี"})`);
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

  // ── เกณฑ์ 6: ตัวเก็บ INP ผู้ใช้จริง — หน้าที่เร็วไม่ยิงอะไรเลย · หน้าที่ช้ายิงครั้งเดียว (รอบ 315) ─
  {
    const beacons: string[] = [];
    const listeners = new Map<string, ((e: unknown) => void)[]>();
    const on = (name: string, fn: (e: unknown) => void) => listeners.set(name, [...(listeners.get(name) ?? []), fn]);
    const off = (name: string, fn: (e: unknown) => void) => listeners.set(name, (listeners.get(name) ?? []).filter((f) => f !== fn));
    const fire = (name: string, event: unknown = {}) => (listeners.get(name) ?? []).forEach((fn) => fn(event));
    type List = { getEntries(): unknown[] };
    const observers: { type: string; cb: (list: List) => void }[] = [];
    let supported = ["event", "long-animation-frame"];
    class FakeObserver {
      static get supportedEntryTypes() {
        return supported;
      }
      constructor(private cb: (list: List) => void) {}
      observe(opts: { type: string }) {
        observers.push({ type: opts.type, cb: this.cb });
      }
      takeRecords() {
        return [];
      }
      disconnect() {}
    }
    const doc = {
      readyState: "complete",
      visibilityState: "visible",
      documentElement: { getAttribute: () => "full" },
      addEventListener: on,
      removeEventListener: off,
    };
    const win = { location: { hostname: "seertarot.net", pathname: "/" }, addEventListener: on, removeEventListener: off };
    const g = globalThis as Record<string, unknown>;
    g.PerformanceObserver = FakeObserver;
    g.window = win;
    g.document = doc;
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        hardwareConcurrency: 8,
        sendBeacon: (url: string, body: Blob) => {
          void body.text().then((text) => beacons.push(`${url} ${text}`));
          return true;
        },
      },
    });
    const flush = () => new Promise((r) => setTimeout(r, 10));
    const emit = (type: string, entries: unknown[]) => observers.filter((o) => o.type === type).forEach((o) => o.cb({ getEntries: () => entries }));
    const hide = async () => {
      doc.visibilityState = "hidden";
      fire("visibilitychange");
      doc.visibilityState = "visible";
      await flush();
    };

    const { installInpReporter } = await import("../../src/lib/observability/inp-reporter");
    const { InpReportSchema } = await import("../../src/lib/observability/inp-metrics");
    const target = {
      tagName: "A",
      id: "",
      classList: ["px-4", "ui2-btn", "hover:bg-ink"],
      parentElement: { tagName: "SECTION", id: "", classList: ["ui2-hero"], parentElement: { tagName: "BODY" } },
    };

    // หน้าโหลดเสร็จที่ 1,100 ms — การแตะที่นิ้วลงก่อนนั้นต้องได้ beforeLoad = true (ตัวเก็บโหลดทีหลัง จึงต้องคิดจากเวลาของ entry)
    const realEntriesByType = performance.getEntriesByType.bind(performance);
    performance.getEntriesByType = ((type: string) =>
      type === "navigation" ? [{ loadEventEnd: 1100 }] : realEntriesByType(type)) as typeof performance.getEntriesByType;

    const stop = installInpReporter();
    emit("event", [{ name: "click", interactionId: 1, startTime: 100, duration: 120, processingStart: 110, processingEnd: 150, target }]);
    await hide();
    if (beacons.length !== 0) errors.push(`INP: หน้าที่เร็ว (120 ms) ต้องไม่ส่งอะไรเลย (ส่ง ${beacons.length} ครั้ง)`);

    // การแตะที่ช้า: pointerdown วาดไปก่อนแล้ว (ไม่นับ) · pointerup + click วาดเฟรมเดียวกันที่ 1520
    emit("event", [
      { name: "pointerdown", interactionId: 2, startTime: 1000, duration: 48, processingStart: 1004, processingEnd: 1010, target },
      { name: "pointerup", interactionId: 2, startTime: 1200, duration: 320, processingStart: 1210, processingEnd: 1260, target },
      { name: "click", interactionId: 2, startTime: 1201, duration: 319, processingStart: 1260, processingEnd: 1290, target },
    ]);
    emit("long-animation-frame", [
      { startTime: 900, duration: 120, renderStart: 0, styleAndLayoutStart: 0, scripts: [] },
      // เฟรมที่กำลังรันตอนนิ้วแตะ (1200) = ตัวการของ "รอคิว" — จบก่อนโค้ดจัดการเริ่ม จึงไม่ใช่เฟรมที่วาดผล
      {
        startTime: 1150,
        duration: 58,
        renderStart: 1185,
        styleAndLayoutStart: 1190,
        scripts: [{ duration: 30, invokerType: "user-callback", invoker: "FrameRequestCallback", sourceURL: "https://seertarot.net/_astro/home.js" }],
      },
      {
        startTime: 1205,
        duration: 300,
        renderStart: 1300,
        styleAndLayoutStart: 1350,
        scripts: [
          { duration: 20, invokerType: "user-callback", invoker: "FrameRequestCallback" },
          { duration: 70, invokerType: "event-listener", invoker: "A.ui2-btn.onclick", sourceURL: "https://seertarot.net/_astro/x.js?v=1" },
        ],
      },
    ]);
    await hide();
    fire("pagehide");
    await hide();
    if (beacons.length !== 1) errors.push(`INP: หน้าที่ช้าต้องส่งพอดี 1 ครั้งต่อหน้า (ส่ง ${beacons.length} ครั้ง)`);
    const [url, json] = (beacons[0] ?? " {}").split(/ (.*)/s);
    const report = InpReportSchema.safeParse(JSON.parse(json || "{}"));
    if (url !== "/api/stats/inp") errors.push(`INP: ต้องส่งไป /api/stats/inp (ได้ ${url})`);
    if (!report.success) {
      errors.push(`INP: ข้อมูลที่ส่งไม่ผ่านสคีมาฝั่งเซิร์ฟเวอร์ — ${report.error.issues.map((i) => i.path.join(".")).join(", ")}`);
    } else {
      const r = report.data;
      const expect: Partial<typeof r> = {
        route: "/",
        target: "section.ui2-hero>a.ui2-btn",
        event: "pointerup",
        fx: "full",
        duration: 320,
        inputDelay: 10,
        processing: 80,
        presentation: 230,
        loaf: "hit",
        styleLayout: 155,
        renderMain: 205,
        loafScript: "event-listener:A.ui2-btn.onclick@x.js",
        interactions: 2,
        beforeLoad: true,
        cpuCores: 8,
        blockScript: "user-callback:FrameRequestCallback@home.js",
        blockRemaining: 8,
        blockStyleLayout: 18,
      };
      for (const [k, v] of Object.entries(expect)) {
        if (r[k as keyof typeof r] !== v) errors.push(`INP: ${k} ควรเป็น ${JSON.stringify(v)} (ได้ ${JSON.stringify(r[k as keyof typeof r])})`);
      }
    }

    // กลับมาจาก bfcache = เปิดหน้าใหม่ในสายตาผู้ใช้ — เริ่มนับใหม่ ยังไม่มีการแตะก็ต้องไม่ส่ง
    fire("pageshow", { persisted: true });
    await hide();
    if (beacons.length !== 1) errors.push("INP: กลับจาก bfcache แล้วยังไม่แตะอะไร ต้องไม่ส่งซ้ำ");
    stop();
    performance.getEntriesByType = realEntriesByType;

    // นอกโดเมนจริง (dev/preview) และเบราว์เซอร์ที่ไม่มี Event Timing ต้องไม่ฟังอะไรเลย
    observers.length = 0;
    win.location.hostname = "localhost";
    installInpReporter()();
    win.location.hostname = "seertarot.net";
    supported = ["paint"];
    installInpReporter()();
    if (observers.length !== 0) errors.push(`INP: localhost / เบราว์เซอร์ที่ไม่รองรับต้องไม่สร้าง observer (สร้าง ${observers.length})`);
  }

  // ── เกณฑ์ 7: เส้นรับ INP — ด่าน origin · สคีมาเข้ม (ไม่มีข้อความอิสระ) · เพดานถี่ทิ้งเงียบ ─────────
  {
    const cf = await import("../../src/lib/platform/cf");
    const points: { indexes?: string[]; blobs?: string[]; doubles?: number[] }[] = [];
    cf.setRumMetricsForTests({ writeDataPoint: (p) => void points.push(p) });
    const route = await import("../../src/app/api/stats/inp/route");
    const good = {
      route: "/cards/major-00",
      target: "section.ui2-hero>a.ui2-btn",
      event: "click",
      fx: "lite",
      duration: 264,
      inputDelay: 12,
      processing: 40,
      presentation: 212,
      loaf: "miss",
      styleLayout: -1,
      renderMain: -1,
      loafScript: "",
      interactions: 3,
      beforeLoad: false,
      deviceMemory: 4,
      cpuCores: 8,
      blockScript: "",
      blockRemaining: -1,
      blockStyleLayout: -1,
    };
    const post =(body: unknown, headers: Record<string, string> = {}) =>
      route.POST(
        new Request("https://seertarot.net/api/stats/inp", {
          method: "POST",
          headers: {
            origin: "https://seertarot.net",
            "user-agent": "Mozilla/5.0 (Linux; Android 14) Chrome/130.0 Mobile Safari/537.36",
            "x-real-ip": "10.0.0.7",
            ...headers,
          },
          body: JSON.stringify(body),
        }),
      );

    const ok = await post(good);
    const p = points[0];
    if (ok.status !== 200 || points.length !== 1) errors.push(`/api/stats/inp: ข้อมูลถูกต้องต้องบันทึก 1 จุด (ได้ ${ok.status} · ${points.length} จุด)`);
    else if (p.indexes?.[0] !== good.route || p.blobs?.[1] !== good.target || p.blobs?.[6] !== "android-chrome" || p.doubles?.[0] !== 264 || p.doubles?.[3] !== 212 || p.doubles?.length !== 12 || p.blobs?.length !== 8) {
      errors.push(`/api/stats/inp: คอลัมน์ผิดตำแหน่ง ${JSON.stringify(p)}`);
    }
    const rejected: [string, Response][] = [
      ["origin ภายนอก", await post(good, { origin: "https://evil.example" })],
      ["ช่องข้อมูลเกิน (ข้อความอิสระ)", await post({ ...good, text: "ความรักของฉัน" })],
      ["target มีข้อความบนจอ", await post({ ...good, target: "button ดูดวงฟรี" })],
      ["INP ต่ำกว่าเกณฑ์", await post({ ...good, duration: 150 })],
      ["route มี query", await post({ ...good, route: "/read?token=abc" })],
      ["ใหญ่เกิน 2 KB", await post("x".repeat(3000))],
    ];
    for (const [label, res] of rejected) {
      if (res.status < 400) errors.push(`/api/stats/inp: ${label} ต้องถูกปฏิเสธ (ได้ ${res.status})`);
    }
    if (points.length !== 1) errors.push(`/api/stats/inp: คำขอที่ถูกปฏิเสธต้องไม่บันทึกอะไร (มี ${points.length} จุด)`);

    for (let i = 0; i < 25; i++) await post(good, { "x-real-ip": "10.0.0.8" });
    if (points.length !== 21) errors.push(`/api/stats/inp: เกินเพดาน 20 ครั้ง/10 นาทีต่อเครื่องต้องทิ้งเงียบ (บันทึก ${points.length - 1} จาก 25)`);
    cf.setRumMetricsForTests(undefined);
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
  console.log("   - ตัวเก็บ INP ยิงเฉพาะหน้าที่ช้ากว่า 200 ms ครั้งเดียวต่อหน้า · เส้นรับตรวจ origin/สคีมา/เพดานถี่");
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  void run();
}
