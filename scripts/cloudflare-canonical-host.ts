#!/usr/bin/env tsx
/**
 * 🌐 ดันกฎ "โฮสต์รอง ➔ โดเมนหลัก" ขึ้นชั้นขอบของ Cloudflare (Single Redirect)
 * ===========================================================================
 *
 * ## ปัญหาที่สคริปต์นี้แก้ (INC-0203)
 *
 * กฎ www ➔ โดเมนหลัก เคยเขียนไว้ที่ `next.config.ts` ที่เดียว ซึ่ง **ทำงานเฉพาะคำขอ
 * ที่วิ่งถึง Worker** พอหน้าเนื้อหาย้ายไป Astro แล้วถูกเสิร์ฟจากชั้น assets ของ
 * Cloudflare (ก่อนถึง Worker) กฎนั้นก็เงียบไปเองโดยไม่มีอะไรฟ้อง
 *
 *   ลำดับจริงของ Cloudflare:  WAF/Redirect Rules ➔ **assets** ➔ Worker ➔ Cache
 *                              └─ กฎที่สคริปต์นี้ดันขึ้นไปอยู่ตรงนี้ จึงครอบคลุมทุกเส้นทาง
 *
 * `_redirects` ของ Workers Assets ทำแทนไม่ได้ — เอกสาร Cloudflare ระบุชัดว่า
 * "Domain-level redirects ❌" (จับได้แค่ path) จึงต้องเป็น Single Redirect ระดับโซน
 *
 * ## วิธีใช้
 *
 *   npm run cf:canonical-host -- --check      # ยิงจริงดูว่าตอนนี้เด้งหรือยัง (ไม่ต้องใช้ token)
 *   npm run cf:canonical-host -- --dry-run    # ดูกฎที่จะเขียน (ไม่เขียนจริง)
 *   npm run cf:canonical-host                 # ลงมือเขียนกฎขึ้นขอบ
 *
 * สิทธิ์ที่ API Token ต้องมี (Cloudflare ➔ My Profile ➔ API Tokens):
 *   | Zone · Zone          · Read | หา zone id จากชื่อโซน (ข้ามได้ถ้าตั้ง CLOUDFLARE_ZONE_ID) |
 *   | Zone · Transform Rules · Edit | เขียน ruleset เฟส `http_request_dynamic_redirect`        |
 *
 * ## ทำไมรันซ้ำได้ไม่จำกัด
 *
 * กฎของเราถูกตีตราด้วย marker `[canonical-host]` ในช่อง description — รอบถัดไปจะ
 * **แทนที่เฉพาะกฎที่มี marker นี้** และไม่แตะกฎอื่นในเฟสเดียวกันที่เจ้าของสร้างเอง
 */
import { ALTERNATE_HOSTS, CANONICAL_HOST, CANONICAL_ORIGIN } from "../src/lib/config/canonical-host";

const API_BASE = "https://api.cloudflare.com/client/v4";
const MARKER = "[canonical-host]";
const PHASE = "http_request_dynamic_redirect";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const CHECK_ONLY = args.includes("--check");

const TOKEN = process.env.CLOUDFLARE_API_TOKEN?.trim();
const ZONE_NAME = process.env.CF_ZONE_NAME?.trim() || CANONICAL_HOST;

interface CfResponse<T> {
  success: boolean;
  result: T;
  errors?: Array<{ code: number; message: string }>;
}

interface Rule {
  id?: string;
  description?: string;
  expression: string;
  action: string;
  action_parameters?: Record<string, unknown>;
  enabled?: boolean;
}

async function cf<T>(method: string, path: string, body?: unknown): Promise<CfResponse<T>> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return (await res.json().catch(() => ({
    success: false,
    result: null,
    errors: [{ code: res.status, message: `HTTP ${res.status} (ตอบกลับไม่ใช่ JSON)` }],
  }))) as CfResponse<T>;
}

function errText(r: CfResponse<unknown>): string {
  if (!r.errors?.length) return "ไม่ทราบสาเหตุ";
  return r.errors
    .map((e) =>
      e.code === 10000
        ? `${e.message} (code ${e.code} — API Token ขาดสิทธิ์ "Zone · Transform Rules · Edit")`
        : `${e.message} (code ${e.code})`
    )
    .join(" · ");
}

/**
 * กฎที่ต้องการให้มีอยู่บนขอบ — หนึ่งข้อต่อหนึ่งโฮสต์รอง
 *
 * `preserve_query_string: true` ทำให้ `?utm_source=...` ติดไปด้วย (ไม่งั้นแคมเปญที่ยิงมาที่
 * www จะเสียข้อมูลที่มาทั้งหมด) ส่วน target ใช้ `http.request.uri.path` ตรง ๆ
 * เพื่อให้เส้นทางลึกเด้งไปหน้าเดียวกันของโฮสต์หลัก ไม่ใช่เด้งรวมไปหน้าแรก
 * (การเด้งรวมไปหน้าแรกถูก Google นับเป็น soft 404 และทิ้ง URL นั้นออกจากดัชนี)
 */
export function desiredRules(): Rule[] {
  return ALTERNATE_HOSTS.map((host) => ({
    description: `${MARKER} ${host} ➔ ${CANONICAL_HOST} (301 · กันเนื้อหาซ้ำสองโฮสต์)`,
    expression: `(http.host eq "${host}")`,
    action: "redirect",
    enabled: true,
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: { expression: `concat("${CANONICAL_ORIGIN}", http.request.uri.path)` },
        preserve_query_string: true,
      },
    },
  }));
}

/** ยิงจริงดูว่าโฮสต์รองเด้งหรือยัง — ใช้ตรวจหลัง deploy และใช้ในด่าน CI แบบ `--live` */
async function liveCheck(): Promise<number> {
  /*
   * เลือกเส้นทางที่ **เสิร์ฟจากชั้น assets** โดยเจตนา — `/robots.txt` เด้งอยู่แล้วเพราะอยู่ใน
   * `run_worker_first` การตรวจด้วยเส้นทางนั้นจะให้ผลเขียวทั้งที่ทั้งเว็บยังซ้ำสองโฮสต์
   */
  const paths = ["/", "/cards", "/blog"];
  let bad = 0;

  for (const host of ALTERNATE_HOSTS) {
    for (const p of paths) {
      const url = `https://${host}${p}`;
      let status = 0;
      let location = "";
      try {
        const res = await fetch(url, { redirect: "manual" });
        status = res.status;
        location = res.headers.get("location") ?? "";
      } catch (e) {
        console.log(`  ⚠️  ${url} — ยิงไม่ถึง (${String(e)})`);
        bad += 1;
        continue;
      }

      const ok = status === 301 && location.startsWith(CANONICAL_ORIGIN);
      if (!ok) bad += 1;
      console.log(
        `  ${ok ? "✅" : "❌"} ${url} ➔ ${status}${location ? ` ➔ ${location}` : ""}` +
          (status === 200 ? "  ← เนื้อหาซ้ำ! กฎบนขอบยังไม่ทำงานกับเส้นทางนี้" : "")
      );
    }
  }
  return bad;
}

async function resolveZoneId(): Promise<string> {
  const fromEnv = process.env.CLOUDFLARE_ZONE_ID?.trim();
  if (fromEnv) return fromEnv;

  const r = await cf<Array<{ id: string; name: string }>>("GET", `/zones?name=${ZONE_NAME}`);
  if (!r.success || !r.result?.length) {
    throw new Error(
      `หา zone "${ZONE_NAME}" ไม่เจอ — ${errText(r)}\n` +
        `   แก้ได้ 2 ทาง: เติมสิทธิ์ "Zone · Zone · Read" ให้ token หรือกำหนด CLOUDFLARE_ZONE_ID เอง`
    );
  }
  return r.result[0].id;
}

async function main(): Promise<void> {
  console.log("\n=======================================================");
  console.log("🌐 CANONICAL HOST — โฮสต์รองต้องเด้ง 301 กลับหาโดเมนหลักทุกเส้นทาง");
  console.log("=======================================================\n");
  console.log(`โฮสต์หลัก : ${CANONICAL_HOST}`);
  console.log(`โฮสต์รอง  : ${ALTERNATE_HOSTS.join(" · ")}\n`);

  if (CHECK_ONLY) {
    console.log("── ยิงจริงบน production ──");
    const bad = await liveCheck();
    if (bad > 0) {
      console.log(
        `\n❌ ยังไม่เด้ง ${bad} เส้น — รัน \`npm run cf:canonical-host\` พร้อม CLOUDFLARE_API_TOKEN\n` +
          "   หรือกดเองที่ Dashboard ➔ Rules ➔ Redirect Rules ➔ Create rule\n" +
          `      เงื่อนไข: Hostname equals ${ALTERNATE_HOSTS[0]}\n` +
          `      ปลายทาง: Dynamic ➔ concat("${CANONICAL_ORIGIN}", http.request.uri.path)\n` +
          "      สถานะ  : 301 · ติ๊ก Preserve query string\n"
      );
      process.exit(1);
    }
    console.log("\n✨ ทุกโฮสต์รองเด้ง 301 กลับโดเมนหลักครบทุกเส้นที่ตรวจ\n");
    return;
  }

  const rules = desiredRules();

  if (DRY_RUN) {
    console.log("── กฎที่จะเขียน (โหมดซ้อมแห้ง ไม่เขียนจริง) ──\n");
    console.log(JSON.stringify(rules, null, 2));
    console.log("\n⏭️  ไม่ได้เขียนอะไรลง Cloudflare (ถอด --dry-run ออกเพื่อลงมือจริง)\n");
    return;
  }

  if (!TOKEN) {
    console.error(
      "❌ ไม่พบ CLOUDFLARE_API_TOKEN\n" +
        "   export CLOUDFLARE_API_TOKEN=<token ที่มีสิทธิ์ Zone · Transform Rules · Edit>\n" +
        "   (อยากดูว่าตอนนี้เด้งหรือยังโดยไม่ใช้ token ➔ `npm run cf:canonical-host -- --check`)\n"
    );
    process.exit(1);
  }

  const zoneId = await resolveZoneId();
  console.log(`🌐 โซน: ${ZONE_NAME} · id ${zoneId}\n`);

  /*
   * ⚠️ PUT entrypoint = "แทนที่ทั้งลิสต์" ไม่ใช่เพิ่มต่อท้าย — ถ้าอ่านของเดิมพลาดแล้วเดาว่า
   * "ยังไม่มี" เราจะ PUT ทับจนกฎเดิมของเจ้าของหายเกลี้ยง จึงแยกให้ชัดระหว่าง
   * "ยังไม่มี entrypoint จริง ๆ" กับ "อ่านไม่สำเร็จ" ด้วยการลิสต์ ruleset ทั้งโซนก่อน
   */
  const list = await cf<Array<{ id: string; phase: string; kind: string }>>("GET", `/zones/${zoneId}/rulesets`);
  if (!list.success) {
    console.error(`❌ อ่านรายการ ruleset ไม่สำเร็จ — ${errText(list)}`);
    process.exit(1);
  }

  const entry = list.result.find((r) => r.phase === PHASE && r.kind === "zone");
  let existing: Rule[] = [];

  if (entry) {
    const cur = await cf<{ rules?: Rule[] }>("GET", `/zones/${zoneId}/rulesets/${entry.id}`);
    if (!cur.success) {
      console.error(`❌ อ่านกฎเดิมในเฟส ${PHASE} ไม่สำเร็จ — ${errText(cur)}`);
      process.exit(1);
    }
    existing = cur.result.rules ?? [];
  }

  const kept = existing.filter((r) => !(r.description ?? "").startsWith(MARKER));
  const removed = existing.length - kept.length;

  // กฎของเราต้องอยู่ **บนสุด** — เฟสนี้หยุดที่กฎแรกที่ตรง
  const payload = {
    rules: [...rules, ...kept].map(({ id: _id, ...rest }) => rest),
  };

  const put = await cf<unknown>("PUT", `/zones/${zoneId}/rulesets/phases/${PHASE}/entrypoint`, payload);
  if (!put.success) {
    console.error(`❌ เขียนกฎไม่สำเร็จ — ${errText(put)}`);
    process.exit(1);
  }

  console.log(
    `✅ เขียนกฎสำเร็จ: ของเรา ${rules.length} ข้อ` +
      ` (แทนที่ของเดิม ${removed} ข้อ) · เก็บกฎของคนอื่นไว้ ${kept.length} ข้อ\n`
  );

  console.log("── ตรวจผลจริง ──");
  const bad = await liveCheck();
  if (bad > 0) {
    console.log("\n⚠️  กฎเขียนขึ้นแล้วแต่ยังเห็นผลไม่ครบ — กฎบนขอบใช้เวลาแพร่ไม่กี่วินาที ลองรัน --check ซ้ำ\n");
    process.exit(1);
  }
  console.log("\n✨ เรียบร้อย — โฮสต์รองเด้ง 301 กลับโดเมนหลักครบทุกเส้น\n");
}

main().catch((err) => {
  console.error("💥 สคริปต์ล้มกลางทาง:", err);
  process.exit(1);
});
