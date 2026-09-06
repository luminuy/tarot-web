#!/usr/bin/env tsx
/**
 * ⚡ Cloudflare Phase 1 — Edge Hardening & Cache Offload (เฟส 1 จาก CLOUDFLARE_OPTIMIZATION_GUIDE.md)
 *
 * สคริปต์นี้ตั้งค่า Cloudflare ทั้ง 6 ข้อของเฟส 1 ผ่าน Cloudflare API v4 แทนการกดเองใน Dashboard
 * — รันซ้ำได้ไม่จำกัด (idempotent) เพราะทุกกฎถูกตีตราด้วย marker `[phase1]` ในช่อง description
 *   รอบถัดไปจะ "แทนที่" กฎเดิมของเราเสมอ และไม่แตะกฎที่คนอื่นสร้างไว้
 *
 * วิธีใช้:
 *   export CLOUDFLARE_API_TOKEN=<token ที่มีสิทธิ์ตามตารางด้านล่าง>
 *   npm run cf:phase1 -- --dry-run     # ดูว่าจะเปลี่ยนอะไรบ้าง (ไม่เขียนจริง)
 *   npm run cf:phase1                  # ลงมือตั้งค่าจริง
 *
 * สิทธิ์ที่ API Token ต้องมี (Cloudflare Dashboard ➔ My Profile ➔ API Tokens):
 *   | Zone · Zone            · Read  | อ่านรายการโซนเพื่อหา zone id                |
 *   | Zone · Zone Settings   · Edit  | HTTP/3, 0-RTT, Early Hints                  |
 *   | Zone · Cache Rules     · Edit  | Cache Rules (ข้อ 1–2)                        |
 *   | Zone · Cache Settings  · Edit  | Tiered Cache (ข้อ 7)                         |
 *   | Zone · Firewall Services · Edit| WAF Custom rules + Rate limiting (ข้อ 5–6)   |
 *   | Zone · Bot Management  · Edit  | Block AI Scrapers + Bot Fight Mode (ข้อ 3–4) |
 *   | Zone · Cache Purge     · Purge | ใช้ในขั้น deploy (ล้างแคชหลังปล่อยเวอร์ชันใหม่) |
 *
 * ⚠️ ข้อควรรู้ก่อนรัน — เหตุผลที่กฎแคชในสคริปต์นี้ "ไม่เหมือน" ในคู่มือเป๊ะ ๆ:
 *   1) หน้าเว็บของเราเปลี่ยนภาษาตาม Cookie (`src/proxy.ts` อ่าน `seertarot_lang`/`locale`
 *      แล้วฉีด header `x-locale` ให้ Server Components) ถ้าแคชหน้า HTML แบบไม่สนใจ Cookie
 *      ผู้ใช้ที่เลือกภาษาอังกฤษจะได้หน้าไทยจากแคช (และกลับกัน)
 *      ➔ กฎหน้า HTML จึงแคชเฉพาะคำขอที่ "ยังไม่มี Cookie ภาษา" ซึ่งคือทราฟฟิกจาก Google
 *        เกือบทั้งหมด (ผู้เข้าชมครั้งแรก) — ส่วนคนที่เลือกภาษาไว้แล้วยังวิ่งผ่าน Worker ตามปกติ
 *   2) `?lang=th|en` ต้อง "คงอยู่" ใน cache key ไม่งั้นสองภาษาจะปนกัน
 *      ➔ เราตัดเฉพาะพารามิเตอร์โฆษณา/โซเชียล (utm_*, fbclid, gclid, ...) ตามเจตนาข้อ 2 ในคู่มือ
 *   3) Edge TTL 7 วัน = หลัง deploy เวอร์ชันใหม่ ผู้ใช้จะยังเห็นของเก่าจนกว่าแคชจะหมดอายุ
 *      ➔ ต้องมีขั้น purge cache ใน `.github/workflows/deploy.yml` (เพิ่มมาพร้อมกันใน PR นี้)
 */

const API_BASE = "https://api.cloudflare.com/client/v4";
const MARKER = "[phase1]";
const DEFAULT_ZONE_NAME = "seertarot.net";

/** พารามิเตอร์โฆษณา/โซเชียลที่ต้องไม่ทำให้แคชหลุด (ข้อ 2 ในคู่มือ) */
const TRACKING_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "dclid",
  "msclkid",
  "ttclid",
  "twclid",
  "igshid",
  "yclid",
  "mc_cid",
  "mc_eid",
  "_gl",
  "ref",
  "referrer",
  "source",
];

type TaskStatus = "OK" | "SKIP" | "FAIL";

interface TaskResult {
  no: string;
  title: string;
  status: TaskStatus;
  detail: string;
}

interface CfResponse<T> {
  success: boolean;
  result: T;
  errors: Array<{ code: number; message: string }>;
  messages: Array<{ code: number; message: string }>;
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const WITH_HOTLINK = args.includes("--hotlink");
const EDGE_TTL = Number(
  args.find((a) => a.startsWith("--edge-ttl="))?.split("=")[1] ?? 604800,
);

const TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const ZONE_NAME = process.env.CF_ZONE_NAME?.trim() || DEFAULT_ZONE_NAME;

const results: TaskResult[] = [];

function record(no: string, title: string, status: TaskStatus, detail: string) {
  const icon = status === "OK" ? "✅" : status === "SKIP" ? "⏭️ " : "❌";
  console.log(`${icon} ${no}. ${title}\n     ${detail}\n`);
  results.push({ no, title, status, detail });
}

/** เรียก Cloudflare API พร้อมแปลง error ให้อ่านออกว่าขาดสิทธิ์อะไร */
async function cf<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<CfResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const json = (await res.json().catch(() => ({
    success: false,
    result: null,
    errors: [{ code: res.status, message: `HTTP ${res.status} (ตอบกลับไม่ใช่ JSON)` }],
    messages: [],
  }))) as CfResponse<T>;

  return json;
}

function errText(r: CfResponse<unknown>): string {
  if (!r.errors?.length) return "ไม่ทราบสาเหตุ";
  return r.errors
    .map((e) => {
      if (e.code === 10000) {
        return `${e.message} (code ${e.code} — API Token ขาดสิทธิ์สำหรับขั้นนี้)`;
      }
      return `${e.message} (code ${e.code})`;
    })
    .join(" · ");
}

// ─────────────────────────────────────────────────────────────────────────────
// เครื่องมือจัดการ Ruleset (Cache Rules / WAF / Rate limiting ใช้ร่วมกัน)
// ─────────────────────────────────────────────────────────────────────────────

interface Rule {
  id?: string;
  description?: string;
  expression: string;
  action: string;
  action_parameters?: Record<string, unknown>;
  ratelimit?: Record<string, unknown>;
  enabled?: boolean;
}

/**
 * แทนที่กฎที่ขึ้นต้นด้วย MARKER ใน entrypoint ruleset ของ phase ที่ระบุ
 * โดยเก็บกฎของคนอื่นไว้เหมือนเดิม (ของเราวางไว้บนสุดเสมอเพื่อให้ชนก่อน)
 */
async function upsertRuleset(
  phase: string,
  ourRules: Rule[],
): Promise<{ ok: boolean; detail: string }> {
  const zoneId = ZONE_ID;

  // ⚠️ PUT entrypoint = "แทนที่ทั้งลิสต์" ไม่ใช่การเพิ่มต่อท้าย
  //    ถ้าอ่านของเดิมพลาดแล้วเดาว่า "ยังไม่มี" เราจะ PUT ทับจนกฎ WAF เดิมของเจ้าของหายเกลี้ยง
  //    จึงต้องแยกให้ชัดระหว่าง "ยังไม่มี entrypoint จริง ๆ" กับ "อ่านไม่สำเร็จ"
  //    ➔ ใช้ GET /rulesets (ลิสต์ทั้งโซน) ซึ่งสำเร็จเสมอไม่ว่าจะมี entrypoint ของ phase นั้นหรือไม่
  //      แล้วดูจาก "ข้อมูล" ว่ามี entrypoint ของ phase นี้อยู่ไหม แทนการเดาจาก error code
  const list = await cf<Array<{ id: string; phase: string; kind: string }>>(
    "GET",
    `/zones/${zoneId}/rulesets`,
  );

  if (!list.success) {
    return { ok: false, detail: `อ่านรายการ ruleset ไม่ได้ — ${errText(list)}` };
  }

  const entrypoint = (list.result ?? []).find(
    (rs) => rs.phase === phase && rs.kind === "zone",
  );

  let existing: Rule[] = [];
  if (entrypoint) {
    const current = await cf<{ rules?: Rule[] }>(
      "GET",
      `/zones/${zoneId}/rulesets/${entrypoint.id}`,
    );
    if (!current.success) {
      return { ok: false, detail: `อ่าน ruleset ไม่ได้ — ${errText(current)}` };
    }
    existing = current.result?.rules ?? [];
  }

  const foreign = existing.filter((r) => !r.description?.startsWith(MARKER));
  const kept = foreign.length;

  const merged = [...ourRules, ...foreign].map((r) => ({
    description: r.description,
    expression: r.expression,
    action: r.action,
    ...(r.action_parameters ? { action_parameters: r.action_parameters } : {}),
    ...(r.ratelimit ? { ratelimit: r.ratelimit } : {}),
    enabled: r.enabled ?? true,
  }));

  if (DRY_RUN) {
    return {
      ok: true,
      detail: `[dry-run] จะเขียน ${ourRules.length} กฎของเรา + คงกฎเดิมของคนอื่น ${kept} กฎ`,
    };
  }

  const put = await cf(
    "PUT",
    `/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`,
    { rules: merged },
  );

  if (!put.success) return { ok: false, detail: errText(put) };
  return {
    ok: true,
    detail: `เขียน ${ourRules.length} กฎสำเร็จ (คงกฎเดิมของคนอื่นไว้ ${kept} กฎ)`,
  };
}

/** PATCH /zones/{id}/settings/{name} — ใช้กับสวิตช์ on/off ใน Dashboard */
async function setZoneSetting(
  name: string,
  value: string,
): Promise<{ ok: boolean; detail: string }> {
  if (DRY_RUN) return { ok: true, detail: `[dry-run] จะตั้ง ${name} = ${value}` };
  const r = await cf("PATCH", `/zones/${ZONE_ID}/settings/${name}`, { value });
  return r.success
    ? { ok: true, detail: `${name} = ${value}` }
    : { ok: false, detail: `${name} — ${errText(r)}` };
}

// ─────────────────────────────────────────────────────────────────────────────

let ZONE_ID = "";

async function resolveZone(): Promise<boolean> {
  if (process.env.CLOUDFLARE_ZONE_ID?.trim()) {
    ZONE_ID = process.env.CLOUDFLARE_ZONE_ID.trim();
    console.log(`🌐 ใช้ zone id จาก env: ${ZONE_ID}\n`);
    return true;
  }

  const r = await cf<Array<{ id: string; name: string; plan?: { name: string } }>>(
    "GET",
    `/zones?name=${encodeURIComponent(ZONE_NAME)}`,
  );

  if (!r.success || !r.result?.length) {
    console.error(
      `❌ หาโซน "${ZONE_NAME}" ไม่เจอ — ${errText(r)}\n` +
        `   แก้ได้ 2 ทาง: เติมสิทธิ์ "Zone · Zone · Read" ให้ token หรือกำหนด CLOUDFLARE_ZONE_ID เอง\n`,
    );
    return false;
  }

  ZONE_ID = r.result[0].id;
  console.log(
    `🌐 โซน: ${r.result[0].name} · id ${ZONE_ID} · แพ็กเกจ ${r.result[0].plan?.name ?? "ไม่ทราบ"}\n`,
  );
  return true;
}

// ── ข้อ 1 + 2: Cache Rules + ตัดพารามิเตอร์โฆษณาออกจาก cache key ──────────────
async function taskCacheRules() {
  const assetsExpr = [
    '(http.request.method eq "GET")',
    "and (",
    'starts_with(http.request.uri.path, "/_next/static/")',
    'or starts_with(http.request.uri.path, "/og/")',
    'or starts_with(http.request.uri.path, "/fonts/")',
    'or http.request.uri.path matches "\\\\.(webp|avif|png|jpg|jpeg|svg|ico|woff2|css|js)$"',
    ")",
  ].join(" ");

  // หน้า HTML: แคชเฉพาะคำขอที่ยังไม่มี Cookie ภาษา (ดูหมายเหตุหัวไฟล์ ข้อ 1)
  const pagesExpr = [
    '(http.request.method eq "GET")',
    "and (",
    'http.request.uri.path eq "/"',
    'or starts_with(http.request.uri.path, "/cards")',
    'or starts_with(http.request.uri.path, "/spreads")',
    'or starts_with(http.request.uri.path, "/blog")',
    'or http.request.uri.path eq "/privacy"',
    ")",
    'and not http.cookie contains "seertarot_lang"',
    'and not http.cookie contains "locale="',
  ].join(" ");

  const cacheKey = {
    ignore_query_strings_order: true,
    custom_key: {
      query_string: { exclude: { list: TRACKING_PARAMS } },
    },
  };

  const rules: Rule[] = [
    {
      description: `${MARKER} static assets — แคชยาว 1 ปี (ภาพไพ่ 1909 / _next/static / ฟอนต์)`,
      expression: assetsExpr,
      action: "set_cache_settings",
      action_parameters: {
        cache: true,
        edge_ttl: { mode: "override_origin", default: 31536000 },
        browser_ttl: { mode: "override_origin", default: 31536000 },
        cache_key: { ignore_query_strings_order: true },
      },
    },
    {
      description: `${MARKER} หน้า SSG (/, /cards, /spreads, /blog) — edge TTL ${EDGE_TTL}s · ตัด utm/fbclid ออกจาก cache key`,
      expression: pagesExpr,
      action: "set_cache_settings",
      action_parameters: {
        cache: true,
        edge_ttl: { mode: "override_origin", default: EDGE_TTL },
        browser_ttl: { mode: "respect_origin" },
        cache_key: cacheKey,
      },
    },
  ];

  let r = await upsertRuleset("http_request_cache_settings", rules);

  // สำรอง: บางแพ็กเกจไม่รองรับ custom cache key แบบลิสต์ → ถอยไปใช้แค่จัดเรียง query string
  if (!r.ok && /cache_key|custom_key|query_string/i.test(r.detail)) {
    rules[1].action_parameters!.cache_key = { ignore_query_strings_order: true };
    r = await upsertRuleset("http_request_cache_settings", rules);
    if (r.ok) r.detail += " ⚠️ แพ็กเกจนี้ไม่รองรับ custom cache key — utm/fbclid จะยังทำให้แคชหลุด";
  }

  record(
    "1+2",
    "Cache Rules แคชหน้า SSG + Ignore tracking query strings",
    r.ok ? "OK" : "FAIL",
    r.detail,
  );
}

// ── ข้อ 3 + 4: Block AI Scrapers + Bot Fight Mode ───────────────────────────
async function taskBots() {
  if (DRY_RUN) {
    record("3+4", "Block AI Scrapers + Bot Fight Mode", "OK", "[dry-run] จะเปิดทั้งสองสวิตช์");
    return;
  }

  const r = await cf("PUT", `/zones/${ZONE_ID}/bot_management`, {
    ai_bots_protection: "block",
    crawler_protection: "enabled",
    fight_mode: true,
  });

  if (r.success) {
    record(
      "3+4",
      "Block AI Scrapers + Bot Fight Mode",
      "OK",
      "ai_bots_protection=block · crawler_protection=enabled · fight_mode=on",
    );
    return;
  }

  // บางบัญชีต้องส่งทีละฟิลด์ — ลองแยกยิงเพื่อให้ได้อย่างน้อยหนึ่งอย่าง
  const ai = await cf("PUT", `/zones/${ZONE_ID}/bot_management`, {
    ai_bots_protection: "block",
  });
  const fight = await cf("PUT", `/zones/${ZONE_ID}/bot_management`, {
    fight_mode: true,
  });

  const parts = [
    ai.success ? "Block AI Scrapers ✔" : `Block AI Scrapers ✘ (${errText(ai)})`,
    fight.success ? "Bot Fight Mode ✔" : `Bot Fight Mode ✘ (${errText(fight)})`,
  ];

  record(
    "3+4",
    "Block AI Scrapers + Bot Fight Mode",
    ai.success || fight.success ? "OK" : "FAIL",
    parts.join(" · "),
  );
}

// ── ข้อ 5 + "ข้อ 4 ของ roadmap": WAF บล็อกสคริปต์และ URL ขยะก่อนถึง Worker ───
async function taskWaf() {
  // หมายเหตุ: roadmap ข้อ 4 บอกให้ตั้ง Custom Error Page 404/429 ที่ Edge
  // แต่ Cloudflare Custom Pages บนแพ็กเกจ Free ไม่ครอบคลุม 404 ของ origin
  // (ครอบคลุมเฉพาะหน้า WAF block / 5xx / IP block) — เป้าหมายจริงคือ
  // "อย่าปลุก Worker เพราะ URL มั่ว" จึงทำด้วย WAF block ซึ่งได้ผลตรงกว่าและฟรี
  const junkPaths = [
    'http.request.uri.path contains "wp-login"',
    'or http.request.uri.path contains "/wp-admin"',
    'or http.request.uri.path contains "/wp-content"',
    'or http.request.uri.path contains "/wp-includes"',
    'or http.request.uri.path contains "xmlrpc.php"',
    'or ends_with(http.request.uri.path, ".php")',
    'or ends_with(http.request.uri.path, ".asp")',
    'or ends_with(http.request.uri.path, ".aspx")',
    'or ends_with(http.request.uri.path, ".jsp")',
    'or http.request.uri.path contains "/.env"',
    'or http.request.uri.path contains "/.git"',
    'or http.request.uri.path contains "phpmyadmin"',
    'or http.request.uri.path contains "/vendor/"',
    'or http.request.uri.path contains "/.aws"',
  ].join(" ");

  // เครื่องมือสคริปต์ที่ยิงเข้า /api/ — ยกเว้น webhook รับเงิน (Omise ยิงแบบ server-to-server)
  const scriptUa = [
    'lower(http.user_agent) contains "curl/"',
    'or lower(http.user_agent) contains "wget"',
    'or lower(http.user_agent) contains "python-requests"',
    'or lower(http.user_agent) contains "python-urllib"',
    'or lower(http.user_agent) contains "scrapy"',
    'or lower(http.user_agent) contains "postmanruntime"',
    'or lower(http.user_agent) contains "insomnia"',
    'or lower(http.user_agent) contains "httpie"',
    'or lower(http.user_agent) contains "libwww-perl"',
    'or lower(http.user_agent) contains "http_request2"',
    'or http.user_agent eq ""',
  ].join(" ");

  const rules: Rule[] = [
    {
      description: `${MARKER} บล็อก URL ขยะ/สแกนช่องโหว่ (wp-*, .php, .env) ก่อนปลุก Worker`,
      expression: `(${junkPaths})`,
      action: "block",
    },
    {
      description: `${MARKER} บล็อกเครื่องมือสคริปต์ที่ /api/ (ยกเว้น webhook รับเงิน)`,
      expression:
        `(starts_with(http.request.uri.path, "/api/") ` +
        `and not starts_with(http.request.uri.path, "/api/marketplace/payments/webhook") ` +
        `and (${scriptUa}))`,
      action: "block",
    },
  ];

  const r = await upsertRuleset("http_request_firewall_custom", rules);
  record("5", "WAF บล็อก URL ขยะ + เครื่องมือสคริปต์ที่ /api/", r.ok ? "OK" : "FAIL", r.detail);
}

// ── ข้อ 6: Rate Limiting เส้นเปิดไพ่ ────────────────────────────────────────
async function taskRateLimit() {
  const expression =
    `(http.request.uri.path matches "^/api/reading/[^/]+/(read|chat)$") ` +
    `or (http.request.uri.path eq "/api/reading/start")`;

  // แพ็กเกจ Free จำกัดทั้งจำนวนกฎ (1 กฎ) และค่า period/mitigation_timeout ที่ใช้ได้
  // จึงไล่ลองจากค่าที่ตรงคู่มือที่สุดลงไปจนกว่าจะมีชุดที่ API ยอมรับ
  const ladder = [
    { period: 600, requests_per_period: 20, mitigation_timeout: 600 },
    { period: 60, requests_per_period: 20, mitigation_timeout: 600 },
    { period: 60, requests_per_period: 20, mitigation_timeout: 60 },
    { period: 10, requests_per_period: 5, mitigation_timeout: 10 },
  ];

  let last = "";
  for (const cfg of ladder) {
    const rule: Rule = {
      description: `${MARKER} จำกัด ${cfg.requests_per_period} ครั้ง/${cfg.period}s ต่อ IP บนเส้นเปิดไพ่`,
      expression,
      action: "block",
      ratelimit: {
        characteristics: ["ip.src", "cf.colo.id"],
        period: cfg.period,
        requests_per_period: cfg.requests_per_period,
        mitigation_timeout: cfg.mitigation_timeout,
        counting_expression: "",
      },
    };

    const r = await upsertRuleset("http_ratelimit", [rule]);
    if (r.ok) {
      record(
        "6",
        "WAF Rate Limiting เส้น /api/reading/*/read",
        "OK",
        `${cfg.requests_per_period} req / ${cfg.period}s ต่อ IP · บล็อก ${cfg.mitigation_timeout}s — ${r.detail}`,
      );
      return;
    }
    last = r.detail;
    if (DRY_RUN) break;
  }

  record("6", "WAF Rate Limiting เส้น /api/reading/*/read", "FAIL", last);
}

// ── ข้อ 7: Smart Tiered Cache ───────────────────────────────────────────────
async function taskTieredCache() {
  if (DRY_RUN) {
    record("7", "Smart Tiered Cache", "OK", "[dry-run] จะเปิด tiered caching + smart topology");
    return;
  }

  const tiered = await cf("PATCH", `/zones/${ZONE_ID}/argo/tiered_caching`, {
    value: "on",
  });
  const smart = await cf(
    "PATCH",
    `/zones/${ZONE_ID}/cache/tiered_cache_smart_topology_enable`,
    { value: "on" },
  );

  const parts = [
    tiered.success ? "Tiered Cache ✔" : `Tiered Cache ✘ (${errText(tiered)})`,
    smart.success ? "Smart Topology ✔" : `Smart Topology ✘ (${errText(smart)})`,
  ];

  record(
    "7",
    "Smart Tiered Cache",
    tiered.success || smart.success ? "OK" : "FAIL",
    parts.join(" · "),
  );
}

// ── ข้อ 9 + 10: HTTP/3, 0-RTT, Early Hints ─────────────────────────────────
async function taskSpeedSettings() {
  const wanted: Array<[string, string, string]> = [
    ["http3", "on", "HTTP/3 (QUIC)"],
    ["0rtt", "on", "0-RTT Connection Resumption"],
    ["early_hints", "on", "Early Hints (HTTP 103)"],
  ];

  const parts: string[] = [];
  let anyOk = false;

  for (const [key, value, label] of wanted) {
    const r = await setZoneSetting(key, value);
    parts.push(r.ok ? `${label} ✔` : `${label} ✘ (${r.detail})`);
    anyOk ||= r.ok;
  }

  record("9+10", "HTTP/3 · 0-RTT · Early Hints", anyOk ? "OK" : "FAIL", parts.join(" · "));
}

// ── ข้อ 8 (ตัวเลือกเสริม): Hotlink Protection ───────────────────────────────
async function taskHotlink() {
  if (!WITH_HOTLINK) {
    record(
      "8",
      "Hotlink Protection",
      "SKIP",
      "ข้ามไว้ตั้งใจ — จะไปขวาง ImageKit Web Origin Pull ในเฟส 3 (เติม --hotlink ถ้าต้องการเปิดเลย)",
    );
    return;
  }
  const r = await setZoneSetting("hotlink_protection", "on");
  record("8", "Hotlink Protection", r.ok ? "OK" : "FAIL", r.detail);
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("⚡ Cloudflare Phase 1 — Edge Hardening & Cache Offload");
  console.log(`   โหมด: ${DRY_RUN ? "DRY RUN (ไม่เขียนจริง)" : "APPLY (เขียนจริง)"}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  if (!TOKEN) {
    console.error(
      "❌ ไม่พบ CLOUDFLARE_API_TOKEN\n\n" +
        "   สร้าง token ที่ https://dash.cloudflare.com/profile/api-tokens (Custom token)\n" +
        "   แล้วให้สิทธิ์ตามตารางในหัวไฟล์ scripts/cloudflare-phase1.ts\n\n" +
        "   จากนั้น:  export CLOUDFLARE_API_TOKEN=<token>  &&  npm run cf:phase1\n",
    );
    process.exit(1);
  }

  if (!(await resolveZone())) process.exit(1);

  await taskCacheRules();
  await taskBots();
  await taskWaf();
  await taskRateLimit();
  await taskTieredCache();
  await taskSpeedSettings();
  await taskHotlink();

  const ok = results.filter((r) => r.status === "OK").length;
  const skip = results.filter((r) => r.status === "SKIP").length;
  const fail = results.filter((r) => r.status === "FAIL").length;

  console.log("═══════════════════════════════════════════════════════════");
  console.log(`สรุป: ✅ สำเร็จ ${ok} · ⏭️  ข้าม ${skip} · ❌ ล้มเหลว ${fail}`);
  console.log("═══════════════════════════════════════════════════════════");

  if (fail > 0) {
    console.log("\nรายการที่ล้มเหลว (ส่วนใหญ่คือ token ขาดสิทธิ์ — เติมแล้วรันซ้ำได้เลย):");
    for (const r of results.filter((x) => x.status === "FAIL")) {
      console.log(`  • ข้อ ${r.no} ${r.title}\n    ${r.detail}`);
    }
  }

  if (!DRY_RUN && ok > 0) {
    console.log(
      "\n📌 ขั้นที่ยังต้องกดเองใน Dashboard (API ทำแทนไม่ได้):\n" +
        "   • Zaraz (roadmap ข้อ 6): Cloudflare ➔ Zaraz ➔ ย้าย GA4 / Meta Pixel เข้า Zaraz\n" +
        "     แล้วค่อยถอด <script> ฝั่ง client ออกในเฟส 2 (แตะโค้ด analytics ต้องทำแยก PR)\n" +
        "   • ตรวจผลจริง: curl -sI https://seertarot.net/cards | grep -i cf-cache-status\n",
    );
  }

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("💥 สคริปต์ล้มกลางทาง:", err);
  process.exit(1);
});

// ทำให้ไฟล์นี้เป็น ES module — กัน `main()` ชนกับสคริปต์ตัวอื่นที่อยู่ใน global scope เดียวกัน
// (tsconfig รวมทุกไฟล์ใน scripts/ ไฟล์ที่ไม่มี import/export จะแชร์ scope กันจน TS2393)
export {};
