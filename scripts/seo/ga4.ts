/**
 * scripts/seo/ga4.ts
 *
 * ดึงข้อมูลจริงจาก Google Analytics 4 ผ่าน Analytics Data API ด้วย Service Account ตัวเดียวกับ GSC
 * — ให้ agent `cmo` และทีมอ่านพฤติกรรมผู้ใช้ได้โดยไม่ต้องเปิดหน้า GA แล้วส่งออกไฟล์มือ
 *
 * คำสั่ง:
 *   npm run seo:ga4                      ภาพรวม (ผู้ใช้ · เซสชัน · การมีส่วนร่วม) เทียบช่วงก่อนหน้า
 *   npm run seo:ga4 -- channels          ช่องทางที่พาคนมา (ค้นหา · โซเชียล · ตรง ฯลฯ)
 *   npm run seo:ga4 -- sources           แหล่ง / สื่อ แบบละเอียด (google / organic · facebook / referral)
 *   npm run seo:ga4 -- landing           หน้าแรกที่คนเข้ามาเจอ
 *   npm run seo:ga4 -- pages             หน้าที่ถูกเปิดดูมากที่สุด
 *   npm run seo:ga4 -- events            อีเวนต์ทั้งหมดที่เว็บส่ง (ดูชื่อใน src/lib/analytics.ts)
 *   npm run seo:ga4 -- funnel            ขั้นตอนเปิดไพ่ ตั้งแต่เริ่ม ➔ อ่านจบ ➔ แชร์ / ดูแพ็กเกจ / ปรึกษาแม่หมอ
 *   npm run seo:ga4 -- purchases         ผู้จ่ายเงินและรายได้แยกตามช่องทาง (อีเวนต์ purchase)
 *   npm run seo:ga4 -- devices           มือถือ · คอม · แท็บเล็ต
 *
 * ตัวเลือกร่วม: --days <n> (ค่าเริ่ม 28 · นับถึงเมื่อวาน) · --limit <n> · --json <ไฟล์> (เก็บผลดิบ)
 *
 * ต้องมี env `GA4_SERVICE_ACCOUNT_JSON` หรือ `GSC_SERVICE_ACCOUNT_JSON` (กุญแจเดียวกันได้)
 * และอีเมล Service Account ต้องถูกเพิ่มเป็น "ผู้ดู" ใน **พร็อพเพอร์ตี้** SeerTarot Web
 * (ไม่ใช่ระดับบัญชี — บัญชี Default Account for Firebase มีพร็อพเพอร์ตี้อื่นปนอยู่)
 * และต้องเปิด Google Analytics Data API ในโปรเจกต์ Cloud ของ Service Account นั้น
 * เปลี่ยนพร็อพเพอร์ตี้ได้ด้วย env `GA4_PROPERTY_ID` (เลขล้วน ไม่ใช่ G-XXXX)
 *
 * ⚠️ ข้อจำกัดที่ต้องรู้:
 * - อีเวนต์ `purchase` (เงินจริงที่ยืนยันแล้ว · แพ็กเติมรอบ + ปรึกษาแม่หมอ) เริ่มส่งตั้งแต่ 2026-10-19 — ก่อนวันนั้นไม่มี
 *   ยอดเงินที่ถูกต้องที่สุดยังเป็นของ `/admin` (D1) · GA4 ใช้ดูว่าผู้จ่ายมาจากช่องทางไหน (ตัวบล็อกโฆษณาทำให้ GA4 นับต่ำกว่าจริง)
 * - ข้อมูลวันล่าสุดยังไม่นิ่ง จึงตัดที่ "เมื่อวาน"
 * - ตัวเลขอาจถูกปัดซ่อน (thresholding) เมื่อผู้ใช้น้อย — สคริปต์จะเตือนเมื่อเกิด
 */

import { writeFileSync } from "node:fs";
import { getAccessToken, loadServiceAccount } from "./google-auth";

const PROPERTY = process.env.GA4_PROPERTY_ID || "552869134";
const TIMEOUT_MS = 30_000;

/** ลำดับขั้นเปิดไพ่ — ชื่อตรงกับ `trackEvent()` ใน src/lib/analytics.ts */
const FUNNEL_STEPS = ["tarot_session_start", "tarot_draw", "card_reveal", "reading_complete"];
/** สิ่งที่อยากให้เกิดหลังอ่านจบ — นับเทียบกับจำนวนอ่านจบ */
const FUNNEL_AFTER = ["share_click", "follow_up_ask", "upgrade_dialog_open", "reader_consult_click", "provably_fair_verify", "purchase"];

interface ReportRow {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

interface Report {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string; type: string }[];
  rows?: ReportRow[];
  rowCount?: number;
  metadata?: { subjectToThresholding?: boolean; dataLossFromOtherRow?: boolean };
}

interface Query {
  dimensions?: string[];
  metrics: string[];
  orderBy?: string;
  limit?: number;
  dateRanges?: { startDate: string; endDate: string; name?: string }[];
  eventNames?: string[];
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

const LABEL: Record<string, string> = {
  activeUsers: "ผู้ใช้",
  newUsers: "ผู้ใช้ใหม่",
  totalUsers: "ผู้ใช้",
  sessions: "เซสชัน",
  engagementRate: "อัตรามีส่วนร่วม",
  averageSessionDuration: "เวลาเฉลี่ย/เซสชัน",
  screenPageViews: "เปิดดู",
  userEngagementDuration: "เวลาใช้งานรวม",
  eventCount: "จำนวนครั้ง",
};

function fmt(metric: string, raw: string): string {
  const n = Number(raw);
  if (metric === "engagementRate") return `${(n * 100).toFixed(1)}%`;
  if (metric === "averageSessionDuration") return `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, "0")} นาที`;
  if (metric === "userEngagementDuration") return `${Math.round(n / 3600)} ชม.`;
  return Number.isInteger(n) ? n.toLocaleString("en-US") : n.toFixed(2);
}

async function runReport(token: string, q: Query, days: number): Promise<Report> {
  const body: Record<string, unknown> = {
    dateRanges: q.dateRanges ?? [{ startDate: `${days}daysAgo`, endDate: "yesterday" }],
    dimensions: (q.dimensions ?? []).map((name) => ({ name })),
    metrics: q.metrics.map((name) => ({ name })),
    limit: q.limit ?? 50,
  };
  if (q.orderBy) body.orderBys = [{ metric: { metricName: q.orderBy }, desc: true }];
  if (q.eventNames) {
    body.dimensionFilter = {
      filter: { fieldName: "eventName", inListFilter: { values: q.eventNames } },
    };
  }

  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${PROPERTY}:runReport`;
  const res = await fetch(url, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  if (!res.ok) {
    const hint =
      res.status === 403
        ? `\n   ➔ Service Account ยังไม่ได้เป็น "ผู้ดู" ในพร็อพเพอร์ตี้ ${PROPERTY} หรือยังไม่ได้เปิด Google Analytics Data API ในโปรเจกต์ Cloud`
        : "";
    throw new Error(`runReport ➔ ${res.status}: ${text.slice(0, 500)}${hint}`);
  }
  const report = JSON.parse(text) as Report;
  if (report.metadata?.subjectToThresholding) {
    console.log("⚠️ GA4 ซ่อนตัวเลขบางแถวเพราะผู้ใช้น้อย (thresholding) — ตัวเลขรวมอาจต่ำกว่าจริง\n");
  }
  return report;
}

function printTable(report: Report, title: string) {
  const dims = report.dimensionHeaders?.map((h) => h.name) ?? [];
  const mets = report.metricHeaders?.map((h) => h.name) ?? [];
  const rows = report.rows ?? [];
  console.log(`\n${title}: ${report.rowCount ?? rows.length} รายการ\n`);
  if (rows.length === 0) return;
  console.log(`| ${[...dims, ...mets.map((m) => LABEL[m] ?? m)].join(" | ")} |`);
  console.log(`|${dims.map(() => "---").concat(mets.map(() => "---:")).join("|")}|`);
  for (const r of rows) {
    const d = r.dimensionValues?.map((v) => v.value || "(ไม่ระบุ)") ?? [];
    const m = r.metricValues?.map((v, i) => fmt(mets[i], v.value)) ?? [];
    console.log(`| ${[...d, ...m].join(" | ")} |`);
  }
  if ((report.rowCount ?? 0) > rows.length) console.log(`\n… และอีก ${report.rowCount! - rows.length} รายการ (เพิ่ม --limit)`);
}

async function overview(token: string, days: number) {
  const metrics = ["activeUsers", "newUsers", "sessions", "engagementRate", "averageSessionDuration", "screenPageViews"];
  const report = await runReport(
    token,
    {
      metrics,
      dateRanges: [
        { startDate: `${days}daysAgo`, endDate: "yesterday", name: "current" },
        { startDate: `${days * 2}daysAgo`, endDate: `${days + 1}daysAgo`, name: "previous" },
      ],
    },
    days,
  );
  // หลายช่วงวัน ➔ GA4 เติมมิติ dateRange ให้เอง หนึ่งแถวต่อช่วง
  const byRange = new Map<string, string[]>();
  for (const r of report.rows ?? []) {
    byRange.set(r.dimensionValues?.[0]?.value ?? "", r.metricValues?.map((v) => v.value) ?? []);
  }
  const cur = byRange.get("current") ?? [];
  const prev = byRange.get("previous") ?? [];

  console.log(`\nภาพรวม ${days} วันล่าสุด (ถึงเมื่อวาน) เทียบ ${days} วันก่อนหน้า\n`);
  console.log("| ตัวชี้วัด | ช่วงนี้ | ช่วงก่อน | เปลี่ยน |");
  console.log("|---|---:|---:|---:|");
  metrics.forEach((m, i) => {
    const a = Number(cur[i] ?? 0);
    const b = Number(prev[i] ?? 0);
    const change = b === 0 ? "-" : `${a >= b ? "+" : ""}${(((a - b) / b) * 100).toFixed(1)}%`;
    console.log(`| ${LABEL[m] ?? m} | ${fmt(m, String(a))} | ${fmt(m, String(b))} | ${change} |`);
  });
  return report;
}

async function funnel(token: string, days: number) {
  const report = await runReport(
    token,
    {
      dimensions: ["eventName"],
      metrics: ["eventCount", "totalUsers"],
      eventNames: [...FUNNEL_STEPS, ...FUNNEL_AFTER],
      limit: 100,
    },
    days,
  );
  const users = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const r of report.rows ?? []) {
    const name = r.dimensionValues?.[0]?.value ?? "";
    counts.set(name, Number(r.metricValues?.[0]?.value ?? 0));
    users.set(name, Number(r.metricValues?.[1]?.value ?? 0));
  }

  const pct = (a: number, b: number) => (b === 0 ? "-" : `${((a / b) * 100).toFixed(1)}%`);
  const first = users.get(FUNNEL_STEPS[0]) ?? 0;
  const done = users.get("reading_complete") ?? 0;

  console.log(`\nขั้นตอนเปิดไพ่ ${days} วันล่าสุด (นับเป็นผู้ใช้ ไม่ใช่จำนวนครั้ง)\n`);
  console.log("| ขั้น | ผู้ใช้ | ครั้ง | เทียบขั้นก่อน | เทียบขั้นแรก |");
  console.log("|---|---:|---:|---:|---:|");
  FUNNEL_STEPS.forEach((s, i) => {
    const u = users.get(s) ?? 0;
    const prev = i === 0 ? u : users.get(FUNNEL_STEPS[i - 1]) ?? 0;
    console.log(`| ${s} | ${u} | ${counts.get(s) ?? 0} | ${i === 0 ? "-" : pct(u, prev)} | ${pct(u, first)} |`);
  });

  console.log(`\nหลังอ่านจบ (เทียบกับผู้ใช้ที่อ่านจบ ${done} คน)\n`);
  console.log("| อีเวนต์ | ผู้ใช้ | ครั้ง | เทียบผู้อ่านจบ |");
  console.log("|---|---:|---:|---:|");
  for (const s of FUNNEL_AFTER) {
    const u = users.get(s) ?? 0;
    console.log(`| ${s} | ${u} | ${counts.get(s) ?? 0} | ${pct(u, done)} |`);
  }
  console.log("\nหมายเหตุ: บางเส้นทางอาจข้ามบางขั้น ตัวเลขจึงเป็นทิศทาง ไม่ใช่ funnel แบบเรียงลำดับเคร่งครัด");
  console.log("purchase = เงินจริงที่ยืนยันแล้ว (เริ่มส่ง 2026-10-19) · ยอดเงินที่ถูกต้องที่สุดยังเป็นของ /admin · ดูแยกช่องทางด้วยคำสั่ง purchases");
  return report;
}

const SIMPLE: Record<string, { title: string; q: Query }> = {
  channels: {
    title: "ช่องทางที่พาคนมา",
    q: { dimensions: ["sessionDefaultChannelGroup"], metrics: ["sessions", "activeUsers", "newUsers", "engagementRate"], orderBy: "sessions" },
  },
  sources: {
    title: "แหล่ง / สื่อ",
    q: { dimensions: ["sessionSourceMedium"], metrics: ["sessions", "activeUsers", "engagementRate"], orderBy: "sessions" },
  },
  landing: {
    title: "หน้าแรกที่คนเข้ามาเจอ",
    q: { dimensions: ["landingPage"], metrics: ["sessions", "newUsers", "engagementRate"], orderBy: "sessions" },
  },
  pages: {
    title: "หน้าที่ถูกเปิดดู",
    q: { dimensions: ["pagePath"], metrics: ["screenPageViews", "activeUsers", "userEngagementDuration"], orderBy: "screenPageViews" },
  },
  events: {
    title: "อีเวนต์ทั้งหมด",
    q: { dimensions: ["eventName"], metrics: ["eventCount", "totalUsers"], orderBy: "eventCount", limit: 100 },
  },
  purchases: {
    title: "ผู้จ่ายเงินมาจากช่องทางไหน (อีเวนต์ purchase · เริ่ม 2026-10-19)",
    q: { dimensions: ["sessionDefaultChannelGroup"], metrics: ["ecommercePurchases", "purchaseRevenue", "totalPurchasers", "sessions"], orderBy: "purchaseRevenue" },
  },
  devices: {
    title: "อุปกรณ์",
    q: { dimensions: ["deviceCategory"], metrics: ["sessions", "activeUsers", "engagementRate"], orderBy: "sessions" },
  },
};

async function main() {
  const argv = process.argv.slice(2);
  const valued = new Set(["--days", "--limit", "--json"]);
  const command = argv.find((a, i) => !a.startsWith("--") && !valued.has(argv[i - 1])) ?? "overview";
  const days = Number(arg("days") ?? 28);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    console.error("❌ --days ต้องเป็นจำนวนเต็ม 1–365");
    process.exit(1);
  }
  if (command !== "overview" && command !== "funnel" && !SIMPLE[command]) {
    console.error(`❌ ไม่รู้จักคำสั่ง "${command}" — ใช้ได้: overview · ${Object.keys(SIMPLE).join(" · ")} · funnel`);
    process.exit(1);
  }

  const sa = loadServiceAccount(["GA4_SERVICE_ACCOUNT_JSON", "GSC_SERVICE_ACCOUNT_JSON"]);
  const token = await getAccessToken(sa, "https://www.googleapis.com/auth/analytics.readonly");
  console.log(`พร็อพเพอร์ตี้ GA4 ${PROPERTY} · Service Account ${sa.client_email}`);

  let output: Report;
  if (command === "overview") {
    output = await overview(token, days);
  } else if (command === "funnel") {
    output = await funnel(token, days);
  } else {
    const { title, q } = SIMPLE[command];
    const limit = arg("limit");
    output = await runReport(token, { ...q, limit: limit ? Number(limit) : q.limit }, days);
    printTable(output, `${title} ${days} วันล่าสุด`);
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
