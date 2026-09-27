/**
 * scripts/seo/gsc.ts
 *
 * ดึงข้อมูลจริงจาก Google Search Console ผ่าน API ด้วย Service Account ของเราเอง
 * — ไม่ต้องเปิดหน้าเว็บ GSC แล้วส่งออกไฟล์มือทุกรอบ
 *
 * ใช้ได้ 4 คำสั่ง:
 *   npm run seo:gsc                      คำค้นไทยที่ติด 28 วันล่าสุด (คลิก · แสดงผล · อันดับเฉลี่ย)
 *   npm run seo:gsc -- queries --all     คำค้นทุกภาษา
 *   npm run seo:gsc -- pages             หน้าไหนได้การแสดงผลเท่าไร
 *   npm run seo:gsc -- inspect           สถานะดัชนีรายหน้า ไล่ตาม sitemap จริง (ค่าเริ่มต้น = หน้าไทย)
 *   npm run seo:gsc -- sitemaps          ดู sitemap ที่ส่งไว้ (--submit = ส่ง sitemap.xml ซ้ำ)
 *
 * ตัวเลือกร่วม: --days <n> (ค่าเริ่ม 28) · --limit <n> · --json <ไฟล์> (เก็บผลดิบ)
 *
 * ต้องมี env `GSC_SERVICE_ACCOUNT_JSON` = เนื้อหาไฟล์กุญแจ JSON ของ Service Account
 * (วางทั้งก้อน หรือเข้ารหัส base64 ก็ได้) และอีเมลของ Service Account นั้น
 * ต้องถูกเพิ่มเป็นผู้ใช้ในพร็อพเพอร์ตี้ `sc-domain:seertarot.net` แล้ว
 * เปลี่ยนพร็อพเพอร์ตี้ได้ด้วย env `GSC_SITE`
 *
 * ⚠️ ข้อจำกัดของ Google ที่ต้องรู้:
 * - ปุ่ม "ขอการจัดทำดัชนี" ไม่มีใน API — Indexing API รองรับแค่ JobPosting/BroadcastEvent
 *   สคริปต์นี้จึงบอกได้แค่ "หน้าไหนยังไม่เข้า" ส่วนการกดขอยังต้องทำมือใน GSC (ดู SEO_INDEXING_LOG.md)
 * - URL Inspection มีโควตา 2,000 ครั้ง/วัน · 600 ครั้ง/นาที ต่อพร็อพเพอร์ตี้
 * - ข้อมูลผลการค้นหาช้ากว่าจริง 2–3 วัน
 */

import { createSign } from "node:crypto";
import { writeFileSync } from "node:fs";

const SITE = process.env.GSC_SITE || "sc-domain:seertarot.net";
const SITEMAP_URL = "https://seertarot.net/sitemap.xml";
const TIMEOUT_MS = 30_000;
const THAI = /[฀-๿]/;

interface ServiceAccount {
  client_email: string;
  private_key: string;
}

interface Row {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const flag = (name: string) => process.argv.includes(`--${name}`);

function loadServiceAccount(): ServiceAccount {
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    console.error(
      "❌ ไม่พบ env GSC_SERVICE_ACCOUNT_JSON\n" +
        "   ใส่เนื้อหาไฟล์กุญแจ JSON ของ Service Account ลงใน secret ของ environment แล้วรันใหม่\n" +
        "   (ขั้นตอนเต็มอยู่ใน docs/SEO_INDEXING_LOG.md หัวข้อ \"ดึงข้อมูลผ่าน API\")",
    );
    process.exit(1);
  }
  const text = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
  const sa = JSON.parse(text) as ServiceAccount;
  if (!sa.client_email || !sa.private_key) {
    console.error("❌ GSC_SERVICE_ACCOUNT_JSON ไม่มี client_email หรือ private_key");
    process.exit(1);
  }
  return sa;
}

const b64url = (s: string | Buffer) => Buffer.from(s).toString("base64url");

async function getAccessToken(sa: ServiceAccount, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const jwt = `${header}.${claims}.${b64url(signer.sign(sa.private_key))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const body = (await res.json()) as { access_token?: string; error_description?: string };
  if (!res.ok || !body.access_token) {
    throw new Error(`ขอ token ไม่สำเร็จ (${res.status}): ${body.error_description ?? JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function api<T>(token: string, method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 403
        ? `\n   ➔ Service Account ยังไม่มีสิทธิ์ในพร็อพเพอร์ตี้ ${SITE} หรือยังไม่ได้เปิด Google Search Console API ในโปรเจกต์ Cloud`
        : "";
    throw new Error(`${method} ${url} ➔ ${res.status}: ${text.slice(0, 500)}${hint}`);
  }
  return (text ? JSON.parse(text) : {}) as T;
}

const siteBase = () =>
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}`;

function dateDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

async function searchAnalytics(token: string, dimension: "query" | "page", days: number): Promise<Row[]> {
  const rows: Row[] = [];
  // API คืนได้ครั้งละไม่เกิน 25,000 แถว — ไล่หน้าจนหมด
  for (let startRow = 0; ; startRow += 25_000) {
    const res = await api<{ rows?: Row[] }>(token, "POST", `${siteBase()}/searchAnalytics/query`, {
      startDate: dateDaysAgo(days),
      endDate: dateDaysAgo(0),
      dimensions: [dimension],
      dataState: "all",
      rowLimit: 25_000,
      startRow,
    });
    rows.push(...(res.rows ?? []));
    if (!res.rows || res.rows.length < 25_000) break;
  }
  return rows;
}

function printRows(rows: Row[], label: string, limit: number) {
  const clicks = rows.reduce((s, r) => s + r.clicks, 0);
  const impressions = rows.reduce((s, r) => s + r.impressions, 0);
  const top10 = rows.filter((r) => r.position <= 10).length;
  const top3 = rows.filter((r) => r.position <= 3).length;

  console.log(`\n${label}: ${rows.length} รายการ · คลิกรวม ${clicks} · แสดงผลรวม ${impressions}`);
  console.log(`อันดับเฉลี่ย ≤ 3: ${top3} · ≤ 10 (หน้าแรก Google): ${top10}\n`);
  if (rows.length === 0) return;

  const sorted = [...rows].sort((a, b) => b.impressions - a.impressions).slice(0, limit);
  console.log("| อันดับเฉลี่ย | แสดงผล | คลิก | CTR | รายการ |");
  console.log("|---:|---:|---:|---:|---|");
  for (const r of sorted) {
    console.log(
      `| ${r.position.toFixed(1)} | ${r.impressions} | ${r.clicks} | ${(r.ctr * 100).toFixed(1)}% | ${r.keys[0]} |`,
    );
  }
  if (rows.length > sorted.length) console.log(`\n… และอีก ${rows.length - sorted.length} รายการ (เพิ่ม --limit)`);
}

async function sitemapUrls(): Promise<string[]> {
  const res = await fetch(SITEMAP_URL, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`โหลด ${SITEMAP_URL} ไม่ได้ (${res.status})`);
  const xml = await res.text();
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g), (m) => m[1].trim());
}

interface InspectResult {
  inspectionResult?: {
    indexStatusResult?: { verdict?: string; coverageState?: string; lastCrawlTime?: string };
  };
}

async function inspect(token: string, limit: number) {
  const scope = flag("en") ? "en" : flag("all") ? "all" : "th";
  const all = await sitemapUrls();
  const urls = all
    .filter((u) => scope === "all" || (scope === "en") === new URL(u).pathname.startsWith("/en"))
    .slice(0, limit);
  console.log(`ตรวจสถานะดัชนี ${urls.length} URL (ชุด ${scope} จาก sitemap ${all.length} URL) — ใช้โควตา ${urls.length}/2,000 ของวันนี้\n`);

  const results: { url: string; verdict: string; coverage: string; lastCrawl: string }[] = [];
  const queue = [...urls];
  // ยิงพร้อมกัน 5 เส้น — ต่ำกว่าเพดาน 600 ครั้ง/นาทีมาก
  await Promise.all(
    Array.from({ length: 5 }, async () => {
      for (let url = queue.shift(); url; url = queue.shift()) {
        try {
          const r = await api<InspectResult>(token, "POST", "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
            inspectionUrl: url,
            siteUrl: SITE,
            languageCode: "th",
          });
          const s = r.inspectionResult?.indexStatusResult ?? {};
          results.push({
            url,
            verdict: s.verdict ?? "?",
            coverage: s.coverageState ?? "?",
            lastCrawl: s.lastCrawlTime?.slice(0, 10) ?? "ไม่เคย",
          });
        } catch (e) {
          results.push({ url, verdict: "ERROR", coverage: (e as Error).message.slice(0, 120), lastCrawl: "-" });
        }
      }
    }),
  );

  const byCoverage = new Map<string, number>();
  for (const r of results) byCoverage.set(r.coverage, (byCoverage.get(r.coverage) ?? 0) + 1);
  const indexed = results.filter((r) => r.verdict === "PASS").length;

  console.log(`✦ เข้าดัชนีแล้ว ${indexed} / ${results.length}\n`);
  console.log("| สถานะ | จำนวน |\n|---|---:|");
  for (const [k, v] of [...byCoverage].sort((a, b) => b[1] - a[1])) console.log(`| ${k} | ${v} |`);

  const notIndexed = results.filter((r) => r.verdict !== "PASS").sort((a, b) => a.url.localeCompare(b.url));
  if (notIndexed.length) {
    console.log("\nหน้าที่ยังไม่เข้าดัชนี:");
    for (const r of notIndexed) console.log(`- ${r.url.replace("https://seertarot.net", "") || "/"} · ${r.coverage} · คลานล่าสุด ${r.lastCrawl}`);
  }
  return results;
}

async function sitemaps(token: string) {
  if (flag("submit")) {
    await api(token, "PUT", `${siteBase()}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`);
    console.log(`✦ ส่ง ${SITEMAP_URL} ให้ Google แล้ว\n`);
  }
  const res = await api<{ sitemap?: { path: string; lastSubmitted?: string; lastDownloaded?: string; errors?: string; warnings?: string; contents?: { submitted?: string; indexed?: string }[] }[] }>(
    token,
    "GET",
    `${siteBase()}/sitemaps`,
  );
  for (const s of res.sitemap ?? []) {
    const submitted = s.contents?.reduce((n, c) => n + Number(c.submitted ?? 0), 0) ?? 0;
    console.log(
      `- ${s.path} · ส่งล่าสุด ${s.lastSubmitted?.slice(0, 10) ?? "-"} · Google โหลดล่าสุด ${s.lastDownloaded?.slice(0, 10) ?? "-"} · URL ${submitted} · error ${s.errors ?? 0} · warning ${s.warnings ?? 0}`,
    );
  }
  return res;
}

async function main() {
  const argv = process.argv.slice(2);
  const valued = new Set(["--days", "--limit", "--json"]);
  const command = argv.find((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1])) ?? "queries";
  const days = Number(arg("days") ?? 28);
  const sa = loadServiceAccount();
  const scope = command === "sitemaps" && flag("submit")
    ? "https://www.googleapis.com/auth/webmasters"
    : "https://www.googleapis.com/auth/webmasters.readonly";
  const token = await getAccessToken(sa, scope);
  console.log(`พร็อพเพอร์ตี้ ${SITE} · Service Account ${sa.client_email}`);

  let output: unknown;
  switch (command) {
    case "queries": {
      const rows = await searchAnalytics(token, "query", days);
      const picked = flag("all") ? rows : rows.filter((r) => THAI.test(r.keys[0]));
      printRows(picked, `คำค้น${flag("all") ? "ทุกภาษา" : "ไทย"} ${days} วันล่าสุด`, Number(arg("limit") ?? 50));
      output = picked;
      break;
    }
    case "pages": {
      const rows = await searchAnalytics(token, "page", days);
      printRows(rows, `หน้าที่ขึ้นในผลค้นหา ${days} วันล่าสุด`, Number(arg("limit") ?? 50));
      output = rows;
      break;
    }
    case "inspect":
      output = await inspect(token, Number(arg("limit") ?? 2000));
      break;
    case "sitemaps":
      output = await sitemaps(token);
      break;
    default:
      console.error(`❌ ไม่รู้จักคำสั่ง "${command}" — ใช้ได้: queries · pages · inspect · sitemaps`);
      process.exit(1);
  }

  const jsonPath = arg("json");
  if (jsonPath) {
    writeFileSync(jsonPath, JSON.stringify(output, null, 2));
    console.log(`\nบันทึกผลดิบไว้ที่ ${jsonPath}`);
  }
}

main().catch((e) => {
  console.error(`❌ ${(e as Error).message}`);
  process.exit(1);
});
