/**
 * QA — ยามเฝ้านโยบายบอตสองชั้นให้พูดตรงกัน (Bot Policy Parity Guard)
 *
 * ⚠️ ทำไมต้องมีไฟล์นี้ — บทเรียน INC-0105
 * เว็บนี้ประกาศนโยบายบอตไว้ **สองที่** ที่ไม่รู้จักกัน:
 *   1. `src/app/robots.ts`            — ขอความร่วมมือ (บอตจะเชื่อหรือไม่ก็ได้)
 *   2. `scripts/cloudflare-phase1.ts` — บังคับจริงที่ขอบ Cloudflare (403 ทันที)
 *
 * ตรวจ production เมื่อ 2026-09-08 พบว่าสองที่นี้ขัดกันเงียบ ๆ มาหลายวัน:
 * `robots.ts` เชิญ `OAI-SearchBot` · `Claude-SearchBot` · `PerplexityBot` เข้ามาคลาน
 * (การตัดสินใจของเจ้าของโปรเจกต์ 2026-09-04 — ยอมให้คลานเพื่อแลกทราฟฟิกจาก AI search)
 * แต่ `cf:phase1` เปิดสวิตช์เหมาโหล `ai_bots_protection: "block"` ของ Cloudflare
 * ซึ่งบล็อกบอต AI ทั้งก้อนโดยไม่แยกบอตค้นหาออกจากบอตเทรนโมเดล ➔ ทั้งสามตัวได้ 403
 *
 * **บทเรียน: นโยบายที่เขียนไว้สองที่ ถ้าไม่มีเครื่องตรวจ มันจะขัดกันเองเสมอ**
 *
 * ────────────────────────────────────────────────────────────────
 * กฎที่ตรวจ:
 *  1. ห้ามมี `ai_bots_protection: "block"` ในสคริปต์ตั้งค่า Cloudflare (สวิตช์เหมาโหล)
 *  2. บอตเทรนโมเดลทุกตัวที่ `robots.ts` สั่ง disallow ต้องถูกบล็อกที่ WAF ด้วย
 *     (ยกเว้นโทเคนที่ใช้ได้เฉพาะใน robots.txt ซึ่งไม่มี user-agent จริงให้บล็อก)
 *  3. บอตค้นหา AI ที่เราตั้งใจเปิดให้คลาน ต้องไม่โผล่ในรายการบล็อกของ WAF
 *  4. บอตของเครื่องมือค้นหาและตัวดึงภาพพรีวิวตอนแชร์ ต้องไม่โผล่ในรายการบล็อกของ WAF
 *
 * รันด้วย: npx tsx scripts/qa/test-bot-policy.ts
 */

import fs from "node:fs";
import path from "node:path";

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

function run(): void {
  const robotsSource = fs.readFileSync(ROBOTS_FILE, "utf-8");
  const cfSource = fs.readFileSync(CF_FILE, "utf-8");

  const errors: string[] = [];

  // ── กฎ 1: ห้ามใช้สวิตช์เหมาโหลของ Cloudflare ────────────────────────────
  // ตรวจเฉพาะ "โค้ดที่รันจริง" — คอมเมนต์เตือนในไฟล์นั้นอ้างชื่อสวิตช์นี้อยู่แล้วโดยตั้งใจ
  const cfCodeOnly = cfSource
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
    })
    .join("\n");

  if (/ai_bots_protection:\s*"block"/.test(cfCodeOnly)) {
    errors.push(
      'พบ `ai_bots_protection: "block"` ใน scripts/cloudflare-phase1.ts\n' +
        "    สวิตช์นี้บล็อกบอต AI ทั้งก้อน รวมบอตค้นหาที่เราตั้งใจเปิดให้คลาน (INC-0105)\n" +
        '    💡 ใช้ "disabled" แล้วบล็อกบอตเทรนโมเดลด้วยชื่อ user-agent ในกฎ WAF แทน',
    );
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

  if (errors.length > 0) {
    console.error("❌ นโยบายบอตสองชั้นขัดกันเอง (robots.ts กับกฎ Cloudflare พูดคนละอย่าง):");
    for (const e of errors) console.error(`  - ${e}\n`);
    process.exit(1);
  }

  console.log(
    `✅ ผ่านทุกเกณฑ์: robots.ts (ห้าม ${robotsDisallowed.length} ตัว) กับกฎ WAF (บล็อก ${wafBlocked.length} ตัว) ` +
      "พูดตรงกัน · บอตค้นหา AI และตัวดึงภาพแชร์ยังเข้าได้ครบ\n",
  );
  process.exit(0);
}

run();
