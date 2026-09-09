/**
 * QA — ยามเฝ้านโยบายบอตสองชั้นให้พูดตรงกัน (Bot Policy Parity Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้ — บทเรียน INC-0105
 * เว็บนี้ประกาศนโยบายบอตไว้ **สามที่** ที่ไม่รู้จักกัน:
 *   1. `src/app/robots.ts`            — ขอความร่วมมือ (บอตจะเชื่อหรือไม่ก็ได้)
 *   2. `scripts/cloudflare-phase1.ts` — บังคับจริงที่ขอบ Cloudflare (403 ทันที)
 *   3. **Cloudflare Managed Content** — Cloudflare แทรกบล็อกของตัวเองไว้ "หัวไฟล์"
 *      robots.txt บน production โดยที่ไม่มีอะไรในรีโปนี้รู้เห็นด้วยเลย
 *      (ตั้งจาก dashboard เท่านั้น · ปัจจุบันประกาศ `Content-Signal: ai-train=no`
 *      แล้วสั่ง `Disallow: /` ให้บอตเทรนโมเดล 9 ตัว ซึ่ง "บังเอิญ" ตรงกับเจตนาเรา)
 *      ⚠️ ถ้า Cloudflare (หรือเจ้าของ) เปลี่ยนนโยบายชั้นนี้เมื่อไร แล้วเผลอปิดบอต
 *      **ค้นหา** AI ที่เราตั้งใจเปิดไว้ ทราฟฟิกจะหายไปเงียบ ๆ โดยไม่มีอะไรเตือน
 *      ➔ กฎ 5 ด้านล่างจึงยิงอ่าน robots.txt ตัวจริงบน production มาตรวจซ้ำ
 *
 * Cloudflare ประกาศเลิกใช้สวิตช์ `ai_bots_protection` วันที่ 15 กันยายน 2026 — หลังจากนั้น
 * กฎ WAF ตามชื่อ user-agent จะเป็นตัวบังคับใช้เพียงตัวเดียว ถ้าสองที่นี้หลุดกันเมื่อไร
 * นโยบายที่เจ้าของตัดสินใจไว้จะหายไปเงียบ ๆ โดยไม่มีอะไรเตือน
 *
 * **บทเรียน: นโยบายที่เขียนไว้สองที่ ถ้าไม่มีเครื่องตรวจ มันจะขัดกันเองเสมอ**
 *
 * 🔬 บทเรียนซ้อน (INC-0105): เคยสรุปผิดว่าบอตค้นหา AI ถูกบล็อก เพราะยิง curl ด้วย UA ปลอม
 *    แล้วได้ 403 — ความจริงคือ Cloudflare บล็อก "คำขอที่อ้างตัวเป็นบอต AI จาก IP ที่ไม่ได้รับรอง"
 *    ส่วนบอตตัวจริงเข้าได้ปกติ (Claude-SearchBot โอน 4.22 MB · 230 คำขอสำเร็จ ใน 24 ชม.)
 *    ➔ ห้ามใช้ curl + UA ปลอมตัดสินว่าบอตถูกบล็อก · ให้ดู AI Crawl Control ➔ Security แทน
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ:
 *  1. `ai_bots_protection` ต้องเป็น `"block"` (ห้ามปิด — เป็นด่านที่กันบอตปลอมและบอตเทรนโมเดล)
 *  2. บอตเทรนโมเดลทุกตัวที่ `robots.ts` สั่ง disallow ต้องถูกบล็อกที่ WAF ด้วย
 *     (ยกเว้นโทเคนที่ใช้ได้เฉพาะใน robots.txt ซึ่งไม่มี user-agent จริงให้บล็อก)
 *  3. บอตค้นหา AI ที่เราตั้งใจเปิดให้คลาน ต้องไม่โผล่ในรายการบล็อกของ WAF
 *  4. บอตของเครื่องมือค้นหาและตัวดึงภาพพรีวิวตอนแชร์ ต้องไม่โผล่ในรายการบล็อกของ WAF
 *  5. robots.txt ตัวจริงบน production (หลัง Cloudflare แทรกบล็อกของตัวเองแล้ว)
 *     ต้องไม่สั่ง `Disallow: /` กับบอตที่เราตั้งใจเปิด และต้องยังปิดหน้าส่วนตัวไว้ครบ
 *     — ข้ามอัตโนมัติเมื่อยิงเน็ตไม่ได้ (เครื่อง dev ออฟไลน์) แต่ใน CI จะตรวจจริงเสมอ
 *
 * รันด้วย: npx tsx scripts/qa/test-bot-policy.ts
 */

import fs from "node:fs";
import path from "node:path";
import { SITE_ORIGIN } from "../../src/lib/config/site";

const ROBOTS_FILE = path.join(process.cwd(), "src/app/robots.ts");
const CF_FILE = path.join(process.cwd(), "scripts/cloudflare-phase1.ts");

/**
 * โทเคนที่ประกาศได้เฉพาะใน robots.txt — ผู้ให้บริการไม่เคยส่ง user-agent ชื่อนี้ออกมาจริง
 * จึงบล็อกที่ WAF ไม่ได้ (และไม่ต้องบล็อก)
 */
const ROBOTS_ONLY_TOKENS = ["google-extended", "applebot-extended"];

/**
 * บอตที่ห้ามบล็อกเด็ดขาด — บล็อกแล้วเสียทราฟฟิกหรือภาพแชร์พังทั้งเว็บ
 * ⚠️ `applebot` อยู่ในรายการนี้ด้วย เพราะคำว่า "applebot" เป็นสตริงย่อยของ
 *    "applebot-extended" — ถ้าเผลอบล็อกด้วยสตริงสั้น จะไปโดน Applebot ตัวธรรมดาของ Siri
 */
const MUST_NOT_BLOCK = [
  // บอตค้นหา AI ที่อ้างอิงลิงก์กลับมาหาเรา (ตัดสินใจเปิดไว้เมื่อ 2026-09-04)
  "oai-searchbot",
  "chatgpt-user",
  "claude-searchbot",
  "claude-user",
  "perplexitybot",
  // เครื่องมือค้นหา
  "googlebot",
  "bingbot",
  "applebot",
  // ตัวดึงภาพพรีวิวตอนแชร์ — บล็อกแล้วภาพแชร์กลายเป็นกล่องเปล่า
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "discordbot",
  "slackbot",
];

/** ดึงรายชื่อ user-agent ที่ robots.ts สั่ง `disallow: ["/"]` (กลุ่มบอตเทรนโมเดล) */
function readRobotsDisallowedAgents(source: string): string[] {
  // บล็อกสุดท้ายของไฟล์คือกลุ่มที่ disallow ทั้งเว็บ — ตัดเอาเฉพาะช่วง userAgent: [...] ก่อน disallow: ["/"]
  const disallowAllIdx = source.indexOf('disallow: ["/"]');
  if (disallowAllIdx === -1) {
    console.error('❌ หาบล็อก `disallow: ["/"]` ใน src/app/robots.ts ไม่พบ');
    console.error("   💡 ถ้าเปลี่ยนโครงไฟล์ robots.ts ต้องอัปเดตด่านนี้ให้อ่านได้ด้วย");
    process.exit(1);
  }

  const head = source.slice(0, disallowAllIdx);
  const listStart = head.lastIndexOf("userAgent: [");
  if (listStart === -1) {
    console.error("❌ หา `userAgent: [` ของกลุ่มบอตเทรนโมเดลใน src/app/robots.ts ไม่พบ");
    process.exit(1);
  }

  const listEnd = head.indexOf("]", listStart);
  const block = head.slice(listStart, listEnd);
  return [...block.matchAll(/"([^"]+)"/g)].map((m) => m[1].toLowerCase());
}

/** ดึงรายชื่อ user-agent ที่กฎ WAF บล็อกอยู่ */
function readWafBlockedAgents(source: string): string[] {
  const start = source.indexOf("const trainingAndScraperUa");
  if (start === -1) {
    console.error("❌ หา `trainingAndScraperUa` ใน scripts/cloudflare-phase1.ts ไม่พบ");
    console.error("   💡 กฎ WAF ที่บล็อกบอตเทรนโมเดลหายไป — robots.txt จะเหลือแค่การขอความร่วมมือ");
    process.exit(1);
  }

  const end = source.indexOf('].join(" ")', start);
  const block = source.slice(start, end);
  return [...block.matchAll(/contains "([^"]+)"/g)].map((m) => m[1].toLowerCase());
}

/**
 * แยก robots.txt ตัวจริงออกเป็น "กลุ่ม" ตาม RFC 9309
 * — บรรทัด `User-agent:` ที่ติดกันหลายบรรทัดนับเป็นกลุ่มเดียวกัน
 * — กฎ (`Allow` / `Disallow`) หลังจากนั้นเป็นของทุก user-agent ในกลุ่มนั้น
 * — บรรทัดคอมเมนต์และบรรทัดว่างไม่ตัดกลุ่ม (กลุ่มจบเมื่อเจอ `User-agent:` ตัวใหม่หลังมีกฎแล้ว)
 */
function parseRobotsGroups(text: string): { agents: string[]; disallow: string[]; allow: string[] }[] {
  const groups: { agents: string[]; disallow: string[]; allow: string[] }[] = [];
  let current: { agents: string[]; disallow: string[]; allow: string[] } | null = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const field = line.slice(0, sep).trim().toLowerCase();
    const value = line.slice(sep + 1).trim();

    if (field === "user-agent") {
      // มีกฎแล้วค่อยเจอ user-agent ใหม่ = ขึ้นกลุ่มใหม่
      if (!current || current.disallow.length > 0 || current.allow.length > 0) {
        current = { agents: [], disallow: [], allow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
    } else if (field === "disallow" && current) {
      current.disallow.push(value);
    } else if (field === "allow" && current) {
      current.allow.push(value);
    }
  }
  return groups;
}

/** ดึง robots.txt จาก production — คืน null เมื่อยิงไม่ได้ (ออฟไลน์) ไม่ใช่ความผิดของนโยบาย */
async function fetchLiveRobots(): Promise<string | null> {
  const url = `${SITE_ORIGIN}/robots.txt`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt === 2) {
        console.log(`  ⏭️  ข้ามกฎ 5: ยิง ${url} ไม่ได้ (${(e as Error).message}) — ถือว่าออฟไลน์ ไม่ใช่นโยบายผิด`);
        return null;
      }
    }
  }
  return null;
}

/**
 * กฎ 5 — ตรวจ robots.txt ตัวจริงบน production (ชั้นที่รีโปนี้มองไม่เห็น)
 * คืนรายการข้อผิดพลาด · อาร์เรย์ว่าง = ผ่าน (หรือข้ามเพราะออฟไลน์)
 */
async function checkLiveRobots(privatePathsFromCode: string[]): Promise<string[]> {
  const text = await fetchLiveRobots();
  if (text === null) return [];

  const groups = parseRobotsGroups(text);
  const errors: string[] = [];

  const blocksEverything = (g: { disallow: string[] }) => g.disallow.includes("/");

  // 5a. บอตที่เราตั้งใจเปิด ห้ามเจอ `Disallow: /` ในกลุ่มที่ระบุชื่อมันตรง ๆ
  for (const wanted of MUST_NOT_BLOCK) {
    const named = groups.filter((g) => g.agents.includes(wanted));
    if (named.some(blocksEverything)) {
      errors.push(
        `robots.txt บน production สั่ง "Disallow: /" กับ "${wanted}" ซึ่งเราตั้งใจเปิดให้คลาน\n` +
          "    ชั้นนี้ไม่ได้มาจากรีโป — มาจาก Cloudflare ➔ Manage Robots / Managed Content\n" +
          "    💡 แก้ที่ Cloudflare dashboard (หรือเอาชื่อนี้ออกจาก MUST_NOT_BLOCK ถ้าเปลี่ยนนโยบายจริง)",
      );
    }
  }

  // 5b. กลุ่ม `*` ห้ามปิดทั้งเว็บ — พลาดตรงนี้ = หายจาก Google ทั้งเว็บ
  const starGroups = groups.filter((g) => g.agents.includes("*"));
  if (starGroups.length === 0) {
    errors.push('robots.txt บน production ไม่มีกลุ่ม "User-agent: *" เลย');
  }
  if (starGroups.some(blocksEverything)) {
    errors.push(
      'robots.txt บน production สั่ง "Disallow: /" ในกลุ่ม "User-agent: *" — ทั้งเว็บจะหลุดจากทุกเครื่องมือค้นหา',
    );
  }

  // 5c. หน้าส่วนตัวต้องยังถูกปิดอยู่ (รวมทุกกลุ่ม `*` เข้าด้วยกันตามที่บอตทำจริง)
  const starDisallow = new Set(starGroups.flatMap((g) => g.disallow));
  for (const p of privatePathsFromCode) {
    if (!starDisallow.has(p)) {
      errors.push(
        `robots.txt บน production ไม่ได้ปิด "${p}" ในกลุ่ม "User-agent: *" ทั้งที่ robots.ts สั่งปิดไว้\n` +
          "    💡 อาจแปลว่า deploy ล่าสุดยังไม่ขึ้น หรือ Cloudflare เขียนทับไฟล์ทั้งก้อน",
      );
    }
  }

  // 5d. แจ้งให้รู้ (ไม่ตก): กลุ่ม `*` ซ้ำกันเกินหนึ่ง = Cloudflare แทรกของตัวเองเข้ามา
  if (starGroups.length > 1) {
    console.log(
      `  ℹ️  robots.txt บน production มีกลุ่ม "User-agent: *" ${starGroups.length} ชุด ` +
        "(ของ Cloudflare Managed Content + ของเรา) — บอตจะรวมกฎทั้งสองชุดเข้าด้วยกันตาม RFC 9309 " +
        "จึงไม่เสียหาย แต่ถ้าอยากให้ไฟล์สะอาดต้องปิด Managed Content ที่ Cloudflare",
    );
  }

  return errors;
}

/** อ่านรายการหน้าส่วนตัวจาก robots.ts เพื่อเทียบกับไฟล์จริงบน production */
function readPrivatePaths(source: string): string[] {
  const start = source.indexOf("const PRIVATE_PATHS = [");
  if (start === -1) return [];
  const end = source.indexOf("]", start);
  return [...source.slice(start, end).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

async function run(): Promise<void> {
  const robotsSource = fs.readFileSync(ROBOTS_FILE, "utf-8");
  const cfSource = fs.readFileSync(CF_FILE, "utf-8");

  const errors: string[] = [];

  // ── กฎ 1: ห้ามปิดสวิตช์กันบอต AI ของ Cloudflare ─────────────────────────
  // ตรวจเฉพาะ "โค้ดที่รันจริง" — คอมเมนต์ในไฟล์นั้นอ้างชื่อสวิตช์นี้อยู่แล้วโดยตั้งใจ
  const cfCodeOnly = cfSource
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    })
    .join("\n");

  const aiSettings = [...cfCodeOnly.matchAll(/ai_bots_protection:\s*"([^"]+)"/g)].map(
    (m) => m[1],
  );

  if (aiSettings.length === 0) {
    errors.push(
      "ไม่พบการตั้ง `ai_bots_protection` ใน scripts/cloudflare-phase1.ts\n" +
        '    💡 ต้องตั้งเป็น "block" — เป็นด่านที่กันคำขอปลอมที่อ้างตัวเป็นบอต AI',
    );
  }

  for (const value of aiSettings) {
    if (value !== "block") {
      errors.push(
        `\`ai_bots_protection\` ถูกตั้งเป็น "${value}" ใน scripts/cloudflare-phase1.ts\n` +
          "    ปิดสวิตช์นี้ = เปิดทางให้ใครก็ได้ปลอม UA เป็นบอต AI เข้ามาคลาน (INC-0105)\n" +
          '    💡 ต้องเป็น "block" — บอตตัวจริงที่ Cloudflare รับรองแล้วยังเข้าได้ตามปกติ',
      );
    }
  }

  const robotsDisallowed = readRobotsDisallowedAgents(robotsSource);
  const wafBlocked = readWafBlockedAgents(cfSource);

  // ── กฎ 2: บอตเทรนโมเดลใน robots.ts ต้องถูกบล็อกที่ WAF ด้วย ─────────────
  for (const agent of robotsDisallowed) {
    if (ROBOTS_ONLY_TOKENS.includes(agent)) continue;
    const covered = wafBlocked.some((blocked) => agent.includes(blocked));
    if (!covered) {
      errors.push(
        `robots.ts สั่งห้าม "${agent}" คลานทั้งเว็บ แต่กฎ WAF ไม่ได้บล็อกไว้\n` +
          "    💡 เติมชื่อนี้ลง `trainingAndScraperUa` ใน scripts/cloudflare-phase1.ts",
      );
    }
  }

  // ── กฎ 3 + 4: บอตที่เราต้องการ ห้ามโผล่ในรายการบล็อก ────────────────────
  for (const wanted of MUST_NOT_BLOCK) {
    const hit = wafBlocked.find((blocked) => wanted.includes(blocked));
    if (hit) {
      errors.push(
        `กฎ WAF บล็อก "${hit}" ซึ่งไปโดน "${wanted}" ที่เราต้องการเข้าด้วย\n` +
          "    💡 บอตกลุ่มนี้คือทราฟฟิกและภาพพรีวิวตอนแชร์ของเรา — เอาออกจากรายการบล็อก",
      );
    }
  }

  // ── กฎ 5: robots.txt ตัวจริงบน production (ชั้น Cloudflare Managed Content) ──
  errors.push(...(await checkLiveRobots(readPrivatePaths(robotsSource))));

  if (errors.length > 0) {
    console.error("❌ นโยบายบอตสามชั้นขัดกันเอง (robots.ts · กฎ Cloudflare · robots.txt จริงบน production):");
    for (const e of errors) console.error(`  - ${e}\n`);
    process.exit(1);
  }

  console.log(
    `✅ ผ่านทุกเกณฑ์: robots.ts (ห้าม ${robotsDisallowed.length} ตัว) กับกฎ WAF (บล็อก ${wafBlocked.length} ตัว) ` +
      "พูดตรงกัน · บอตค้นหา AI และตัวดึงภาพแชร์ยังเข้าได้ครบ (ตรวจ robots.txt จริงบน production แล้ว)\n",
  );
  process.exit(0);
}

run();
