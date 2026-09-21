/**
 * 🌐 ด่านกัน "เว็บซ้ำสองโฮสต์เงียบ ๆ" (Canonical Host Guard · INC-0203)
 * ===========================================================================
 *
 * ## ความผิดพลาดที่ด่านนี้ถูกสร้างขึ้นมากัน
 *
 * กฎ `www.seertarot.net ➔ seertarot.net` อยู่ใน `next.config.ts` ครบถ้วนถูกต้องมาตลอด
 * แต่ **ไม่ทำงาน** เพราะ `redirects()` ของ Next ถูกเรียกก็ต่อเมื่อคำขอวิ่งถึง Worker
 * ส่วนหน้าเนื้อหาที่ย้ายไป Astro ถูก Cloudflare ตอบจากชั้น assets ตั้งแต่ขอบ
 *
 *   ลำดับจริง:  WAF / Redirect Rules ➔ **assets** ➔ Worker ➔ Cache
 *                                        └─ จบตรงนี้ กฎของ Next ไม่เคยถูกเรียก
 *
 * วัดจริงบน production 2026-09-21 (ตอนที่มีแต่ชั้น Worker ชั้นเดียว):
 *
 *   https://www.seertarot.net/cards       ➔ 200 · เนื้อหาเต็ม  ❌ เว็บซ้ำสองโฮสต์
 *   https://www.seertarot.net/robots.txt  ➔ 301               ✅ (อยู่ใน run_worker_first)
 *
 * **นี่คือความผิดพลาดที่มองไม่เห็นจากโค้ด** — กฎยังอยู่ ไฟล์ยังถูก ด่านทุกด่านยังเขียว
 * เห็นได้ทางเดียวคือยิงจริงใส่โฮสต์รอง ดังนั้นสิ่งที่ต้องบังคับคือ **"กฎระดับโฮสต์
 * ต้องมีชั้นขอบเสมอ"** ไม่ใช่ "กฎต้องมีอยู่ในโค้ด"
 *
 * ## ด่านนี้ตรวจอะไร (ทั้งหมดตรวจแบบออฟไลน์ ไม่พึ่งเครือข่าย)
 *
 *   1. รายชื่อโฮสต์รองมาจากไฟล์กลางไฟล์เดียว และสมเหตุสมผล
 *   2. ชั้น Worker (`next.config.ts`) ยังสร้างกฎครบทุกโฮสต์ · 301 · ปลายทางเป็น URL เต็ม
 *      และกฎ `/` ยังอยู่ **เหนือ** `/:path*` (บั๊กเดิม 2026-09-09 ที่ `:path*` ไม่ถูกแทนค่า)
 *   3. ห้ามมีโฮสต์ฮาร์ดโค้ดใน `next.config.ts` ที่ไม่ได้มาจากไฟล์กลาง (กันสองที่หลุดจากกัน)
 *   4. **ชั้นขอบต้องมีอยู่และถูกต่อเข้ากับสายพาน deploy** — สคริปต์ · คำสั่ง npm · ขั้นใน workflow
 *   5. รูปคอนฟิกของ assets ยังเป็นแบบที่ทำให้ข้อ 4 จำเป็น (ถ้าเปลี่ยนไปจนไม่จำเป็นแล้ว ด่านจะบอก)
 *
 * ## ตรวจของจริงบน production
 *
 *   npx tsx scripts/qa/test-canonical-host.ts --live    # ยิงจริง (ใช้หลัง deploy)
 *   npm run cf:canonical-host -- --check                # เครื่องมือตัวเต็ม พร้อมวิธีแก้
 *
 * โหมด `--live` **ไม่ได้อยู่ในชุด CI** โดยตั้งใจ — ด่าน CI ต้องตัดสินจากโค้ดในคอมมิตนั้น
 * ไม่ใช่จากสถานะของ Dashboard ที่คนนอก PR ไปกดเปลี่ยนเมื่อไหร่ก็ได้
 *
 * รันเดี่ยว: npx tsx scripts/qa/test-canonical-host.ts
 */
import fs from "node:fs";
import path from "node:path";

import nextConfig from "../../next.config";
import { ALTERNATE_HOSTS, CANONICAL_HOST, CANONICAL_ORIGIN } from "../../src/lib/config/canonical-host";
import { assertNonEmptyCorpus } from "./lib/corpus";

const ROOT = path.resolve(import.meta.dirname, "../..");

/* คลายชนิดจาก literal tuple เป็น string[] — ด่านต้องเทียบค่าได้โดยไม่ให้ TS ตัดสินล่วงหน้าว่า
   "สองค่านี้ไม่มีทางเท่ากัน" (ซึ่งจริงเฉพาะกับรายชื่อชุดปัจจุบัน ไม่ใช่กับชุดที่ใครจะแก้พรุ่งนี้) */
const HOSTS: readonly string[] = ALTERNATE_HOSTS;
const LIVE = process.argv.includes("--live");

let failed = 0;
const check = (label: string, ok: boolean, detail?: string) => {
  console.log(`  ${ok ? "✅" : "❌"} ${label}`);
  if (!ok) {
    failed += 1;
    if (detail) console.log(`      ${detail}`);
  }
};

/** อ่านไฟล์ที่ "ต้องมี" — ไฟล์หาย = ตกด่าน ไม่ใช่ข้ามเงียบ */
function readRequired(rel: string): string {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) {
    check(`ต้องมีไฟล์ ${rel}`, false, "ไฟล์หาย = ชั้นป้องกันหายไปทั้งชั้น");
    return "";
  }
  return fs.readFileSync(full, "utf8");
}

console.log("\n=======================================================");
console.log("🌐 CANONICAL HOST GUARD — โฮสต์รองต้องไม่กลายเป็นเว็บซ้ำ");
console.log("=======================================================\n");

// ── 1. รายชื่อโฮสต์รอง ────────────────────────────────────────────────────
console.log("── 1. รายชื่อโฮสต์รอง (ไฟล์กลาง) ──");

assertNonEmptyCorpus(
  "โฮสต์รองที่ต้องเด้งกลับโดเมนหลัก",
  HOSTS,
  "ว่าง = ไม่มีอะไรให้ตรวจ ถ้าตั้งใจเลิกใช้ www ต้องลบด่านนี้ทิ้งพร้อมกัน"
);

for (const host of HOSTS) {
  check(`${host} ต้องไม่ใช่โฮสต์หลักเอง`, host !== CANONICAL_HOST, "เด้งหาตัวเอง = ลูปไม่รู้จบ");
  check(
    `${host} ต้องอยู่ในโซนเดียวกับ ${CANONICAL_HOST}`,
    host.endsWith(`.${CANONICAL_HOST}`),
    "โฮสต์นอกโซนตั้ง Redirect Rule ที่โซนนี้ไม่ได้ — ต้องไปตั้งที่โซนของมันเอง"
  );
}

// ── 2. ชั้น Worker — กฎที่ `next.config.ts` สร้างจริง ──────────────────────
console.log("\n── 2. ชั้นสำรอง: กฎที่ next.config.ts สร้างจริง ──");

const redirects = await nextConfig.redirects!();
const hostRules = redirects.filter((r) =>
  (r.has ?? []).some((h) => h.type === "host" && HOSTS.includes(h.value as string))
);

assertNonEmptyCorpus("กฎระดับโฮสต์ใน next.config.ts", hostRules, "`redirects()` ไม่ได้สร้างกฎโฮสต์เลยสักข้อ");

for (const host of HOSTS) {
  const forHost = redirects.filter((r) => (r.has ?? []).some((h) => h.type === "host" && h.value === host));
  const root = forHost.find((r) => r.source === "/");
  const deep = forHost.find((r) => r.source === "/:path*");

  check(
    `${host} มีกฎของหน้าแรก (source "/") แยกต่างหาก`,
    Boolean(root),
    'บั๊กเดิม 2026-09-09: `/:path*` ที่จับ "ว่างเปล่า" ไม่ถูกแทนค่า ทำให้หน้าแรกเด้งไป 404'
  );
  check(`${host} มีกฎครอบทุกเส้นทาง (source "/:path*")`, Boolean(deep));

  if (root && deep) {
    check(
      `${host}: กฎ "/" ต้องอยู่เหนือ "/:path*"`,
      redirects.indexOf(root) < redirects.indexOf(deep),
      "Next.js หยุดที่กฎแรกที่ตรง — สลับที่แล้วกฎหน้าแรกจะไม่มีวันถูกใช้"
    );
  }

  for (const rule of forHost) {
    check(
      `${host} ${rule.source} ใช้ 301 (ไม่ใช่ 302/307/308)`,
      (rule as { statusCode?: number }).statusCode === 301,
      "การย้ายโฮสต์ถาวรต้องเป็น 301 — 302/307 บอก Google ว่า 'ชั่วคราว' ดัชนีจึงไม่ถูกยุบรวม"
    );
    check(
      `${host} ${rule.source} เด้งไป ${CANONICAL_ORIGIN} (URL เต็ม)`,
      typeof rule.destination === "string" && rule.destination.startsWith(CANONICAL_ORIGIN),
      `ได้ ${rule.destination} — ปลายทางแบบ path ล้วนจะวนกลับมาที่โฮสต์เดิม`
    );
  }
}

// ── 3. ห้ามโฮสต์ฮาร์ดโค้ดหลุดจากไฟล์กลาง ─────────────────────────────────
console.log("\n── 3. ห้ามมีโฮสต์ฮาร์ดโค้ดนอกไฟล์กลาง ──");

const nextSrc = readRequired("next.config.ts");
const hardcoded = [...nextSrc.matchAll(/type:\s*"host"[^}]*value:\s*"([^"]+)"/g)].map((m) => m[1]);

check(
  "next.config.ts ต้องไม่มีชื่อโฮสต์เขียนตรง ๆ ในกฎ redirect",
  hardcoded.length === 0,
  hardcoded.length
    ? `เจอ ${hardcoded.join(" · ")} — ต้องอ่านจาก ALTERNATE_HOSTS เท่านั้น ` +
        "ไม่งั้นชั้นขอบกับชั้น Worker จะหลุดจากกันโดยไม่มีใครรู้"
    : undefined
);
check("next.config.ts ต้องนำเข้ารายชื่อโฮสต์จากไฟล์กลาง", nextSrc.includes('from "./src/lib/config/canonical-host"'));

// ── 4. ชั้นขอบต้องมีอยู่จริงและถูกต่อเข้าสายพาน deploy ────────────────────
console.log("\n── 4. ชั้นขอบ (ของจริง) ต้องมีและถูกเรียกอัตโนมัติ ──");

const edgeScript = readRequired("scripts/cloudflare-canonical-host.ts");
check(
  "สคริปต์ชั้นขอบอ่านรายชื่อโฮสต์จากไฟล์กลางเดียวกัน",
  edgeScript.includes("ALTERNATE_HOSTS"),
  "ถ้าสคริปต์มีรายชื่อของตัวเอง การเพิ่มโฮสต์ใหม่จะได้แค่ชั้นเดียวเหมือนเดิม"
);
check(
  "สคริปต์ชั้นขอบเขียนกฎในเฟส http_request_dynamic_redirect",
  edgeScript.includes("http_request_dynamic_redirect"),
  "เฟสอื่นทำงานหลังชั้น assets — เด้งไม่ทันหน้าที่เสิร์ฟจากขอบ"
);
check(
  "สคริปต์ชั้นขอบตรวจผลด้วยเส้นทางที่เสิร์ฟจากชั้น assets",
  edgeScript.includes('"/cards"'),
  "ตรวจด้วย /robots.txt อย่างเดียวจะเขียวปลอม เพราะเส้นนั้นเข้า Worker อยู่แล้ว"
);

const pkg = JSON.parse(readRequired("package.json") || "{}") as { scripts?: Record<string, string> };
check(
  "package.json มีคำสั่ง cf:canonical-host",
  Boolean(pkg.scripts?.["cf:canonical-host"]),
  "ไม่มีคำสั่ง = ไม่มีใครรันได้ตอนส่งต่องาน"
);

const deployYml = readRequired(".github/workflows/deploy.yml");
check(
  "deploy.yml เรียก cf:canonical-host หลัง deploy",
  deployYml.includes("cf:canonical-host"),
  "กฎบนขอบต้องถูกดันกลับทุกครั้งที่ปล่อยเวอร์ชัน ไม่ใช่รอให้คนจำได้"
);

// ── 5. รูปคอนฟิกที่ทำให้ชั้นขอบยังจำเป็นอยู่ ──────────────────────────────
console.log("\n── 5. ข้อสมมติของด่านนี้ยังเป็นจริงอยู่ไหม ──");

const wranglerRaw = readRequired("wrangler.jsonc").replace(/^\s*\/\/.*$/gm, "");
let assets: { run_worker_first?: unknown } = {};
try {
  assets = (JSON.parse(wranglerRaw) as { assets?: typeof assets }).assets ?? {};
} catch (e) {
  check("wrangler.jsonc ต้อง parse ได้", false, String(e));
}

const workerFirst = assets.run_worker_first;
check(
  "run_worker_first เป็นรายการเส้นทาง (แปลว่าเส้นอื่นไม่ถึง Worker ➔ ชั้นขอบจำเป็น)",
  Array.isArray(workerFirst),
  workerFirst === true
    ? "ถ้าเปลี่ยนเป็น true ทุกคำขอจะถึง Worker และกฎใน next.config.ts จะพอเอง — " +
        "แต่ต้นทุนคำขอจะพุ่งทั้งเว็บ ให้ทบทวนก่อนว่าตั้งใจจริง แล้วค่อยปรับด่านนี้"
    : `ได้ ${JSON.stringify(workerFirst)}`
);

// ── 6. โหมดยิงจริง (นอกชุด CI) ────────────────────────────────────────────
if (LIVE) {
  console.log("\n── 6. ยิงจริงบน production (--live) ──");
  for (const host of HOSTS) {
    for (const p of ["/", "/cards", "/blog"]) {
      const url = `https://${host}${p}`;
      try {
        const res = await fetch(url, { redirect: "manual" });
        const loc = res.headers.get("location") ?? "";
        check(
          `${url} ➔ 301 ${CANONICAL_ORIGIN}${p === "/" ? "/" : p}`,
          res.status === 301 && loc.startsWith(CANONICAL_ORIGIN),
          `ได้ ${res.status}${loc ? ` ➔ ${loc}` : ""} — รัน \`npm run cf:canonical-host\` เพื่อดันกฎขึ้นขอบ`
        );
      } catch (e) {
        check(`${url} ต้องยิงถึง`, false, String(e));
      }
    }
  }
}

console.log("\n=======================================================");
if (failed > 0) {
  console.log(`❌ ตกด่าน ${failed} ข้อ — เว็บเสี่ยงถูกจัดทำดัชนีสองโฮสต์`);
  console.log("=======================================================\n");
  process.exit(1);
}
console.log("✅ กฎระดับโฮสต์ครบทั้งสองชั้น (ขอบ + Worker) และผูกกับไฟล์กลางไฟล์เดียว");
console.log("=======================================================\n");
