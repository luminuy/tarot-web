/**
 * 📋 สร้างตาราง "แผนงานทั้งหมด" ใน CLAUDE.md และ docs/INDEX.md จากหัวสถานะของไฟล์แผนแต่ละไฟล์
 * ===========================================================================
 *
 * ## ทำไมต้องมี (บทเรียน 2026-09-23 · INC-0229)
 *
 * สถานะของแผนเคยถูกเขียนมือไว้ 3 ที่ (ไฟล์แผน · แถวใน CLAUDE.md · บรรทัดใน INDEX.md)
 * ทีมทำงานเสร็จแล้วแก้แค่ที่เดียว (หรือไม่แก้เลย) — ธีมกระจกลงครบทั้งเว็บตั้งแต่ #551–#562
 * แต่ CLAUDE.md ยังเขียนว่า "รอทีมรับไปทำ" ➔ เอเจนท์อ่านแล้วรายงานเจ้าของผิดว่างานยังค้าง
 * ตรวจทั้งโฟลเดอร์พบอีก 5 แผนที่ทำเสร็จแล้วแต่เอกสารยังบอกว่า "ยังไม่ลงมือ"
 *
 * ## กติกา
 *
 * 1. **แหล่งความจริงเดียว** = บรรทัด `> **สถานะ**: <อิโมจิ> <คำ> — <สรุป> · **ตรวจล่าสุด**: YYYY-MM-DD`
 *    ใต้หัวเรื่อง `#` ของไฟล์แผน (ถัดลงมาไม่เกิน 8 บรรทัด)
 * 2. ตารางใน CLAUDE.md / INDEX.md **สร้างจากไฟล์แผนเท่านั้น** — ห้ามแก้มือ
 * 3. ด่าน `test-docs-numbers.ts` เทียบตารางกับผลของสคริปต์นี้ทุกครั้ง ไม่ตรง = CI ตก
 * 4. สรุปสถานะ ≤ 300 ตัวอักษร · "อ่านก่อนแตะ" ≤ 200 ตัวอักษร รูป `<ส่วนที่แตะ> — <อ่านอะไร>` (2026-10-26)
 *    เดิมสรุปบวมจนแถวเดียวยาวกว่า 1,500 ตัวอักษร CLAUDE.md ทั้งไฟล์ 53 KB ที่ทุกเซสชันต้องโหลด
 *    ประวัติงานอยู่ใน WORK_LOG — สรุปในหัวแผนบอกแค่ "เสร็จอะไร เหลืออะไร รอใคร"
 * 5. CLAUDE.md แสดงเฉพาะแผนที่ยังเปิด + ตาราง "อ่านก่อนแตะ" · รายชื่อเต็มทุกแผนอยู่ใน docs/INDEX.md
 *
 * ใช้งาน: `npm run docs:index` (เขียนทับตาราง) · `npm run docs:status` (รายงานงานค้าง + อายุการตรวจ)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PLANS_DIR = path.join(ROOT, "docs/plans");

export const STATUS_EMOJI = ["🚧", "⏸️", "⏳", "✅", "📚"] as const;
export type StatusEmoji = (typeof STATUS_EMOJI)[number];
export const STATUS_WORD: Record<StatusEmoji, string> = {
  "🚧": "ทำแล้วบางส่วน",
  "⏸️": "รอคนนอก/เจ้าของ",
  "⏳": "ยังไม่เริ่ม",
  "✅": "เสร็จแล้ว",
  "📚": "เอกสารอ้างอิง",
};

export interface PlanStatus {
  file: string;
  title: string;
  emoji: StatusEmoji;
  summary: string;
  checkedAt: string;
  readBefore?: string;
}

export const CLAUDE_START = "<!-- PLANS_INDEX_START · สร้างด้วย npm run docs:index — ห้ามแก้มือ -->";
export const CLAUDE_END = "<!-- PLANS_INDEX_END -->";
export const INDEX_START = "<!-- PLANS_TREE_START · สร้างด้วย npm run docs:index — ห้ามแก้มือ -->";
export const INDEX_END = "<!-- PLANS_TREE_END -->";

const STATUS_RE =
  /^>\s*\*\*สถานะ\*\*:\s*(🚧|⏸️|⏳|✅|📚)\s+(\S[^—]*?)\s+—\s+(.+?)\s+·\s+\*\*ตรวจล่าสุด\*\*:\s*(\d{4}-\d{2}-\d{2})(?:\s+·.*)?$/u;

export const SUMMARY_MAX = 300;
export const READ_BEFORE_MAX = 200;
const len = (s: string) => Array.from(s).length;

/** อ่านหัวสถานะของไฟล์แผนหนึ่งไฟล์ — คืนข้อผิดพลาดเป็นสตริงเมื่อรูปแบบไม่ถูก */
export function readPlanStatus(absFile: string): PlanStatus | string {
  const rel = path.relative(ROOT, absFile);
  const lines = fs.readFileSync(absFile, "utf8").split("\n");
  const h1 = lines.findIndex((l) => l.startsWith("# "));
  if (h1 === -1) return `${rel}: ไม่มีหัวเรื่อง # บรรทัดแรก`;
  const head = lines.slice(h1 + 1, h1 + 9);
  // นับเฉพาะส่วนหัวเอกสาร — สถานะรายข้อในเนื้อหา (เช่น "> **สถานะ**: แก้แล้ว" ของงานย่อย) ไม่นับ
  const statusLines = lines.slice(0, h1 + 20).filter((l) => /^>\s*\*\*สถานะ\*\*:/.test(l));
  if (statusLines.length !== 1) {
    return `${rel}: ต้องมีบรรทัด "> **สถานะ**:" หนึ่งเดียว (เจอ ${statusLines.length}) — สถานะเก่าให้เปลี่ยนเป็น "**สถานะตอนเขียนแผน**:"`;
  }
  const line = head.find((l) => /^>\s*\*\*สถานะ\*\*:/.test(l));
  if (!line) return `${rel}: บรรทัด "> **สถานะ**:" ต้องอยู่ภายใน 8 บรรทัดใต้หัวเรื่อง`;
  const m = STATUS_RE.exec(line);
  if (!m) {
    return `${rel}: รูปแบบหัวสถานะผิด — ต้องเป็น "> **สถานะ**: <${STATUS_EMOJI.join("|")}> <คำ> — <สรุป> · **ตรวจล่าสุด**: YYYY-MM-DD"`;
  }
  const emoji = m[1] as StatusEmoji;
  if (m[2] !== STATUS_WORD[emoji]) return `${rel}: คำสถานะของ ${emoji} ต้องเป็น "${STATUS_WORD[emoji]}" (เจอ "${m[2]}")`;
  const summary = m[3];
  if (emoji === "✅" && /ยังไม่ลงมือ|รอทีมรับไปทำ|ยังไม่เริ่ม/.test(summary)) {
    return `${rel}: สถานะ ✅ แต่สรุปยังพูดว่ายังไม่ได้ทำ — ขัดกันเอง`;
  }
  if (len(summary) > SUMMARY_MAX) {
    return `${rel}: สรุปสถานะยาว ${len(summary)} ตัวอักษร (เพดาน ${SUMMARY_MAX}) — บอกแค่เสร็จอะไร เหลืออะไร รอใคร · ประวัติไปอยู่ใน WORK_LOG`;
  }
  const readBeforeLine = head.find((l) => /^>\s*\*\*อ่านก่อนแตะ\*\*:/.test(l));
  const readBefore = readBeforeLine?.replace(/^>\s*\*\*อ่านก่อนแตะ\*\*:\s*/, "").trim();
  if (readBefore !== undefined) {
    if (len(readBefore) > READ_BEFORE_MAX) {
      return `${rel}: "อ่านก่อนแตะ" ยาว ${len(readBefore)} ตัวอักษร (เพดาน ${READ_BEFORE_MAX})`;
    }
    if (readBefore.split(" — ").length !== 2) {
      return `${rel}: "อ่านก่อนแตะ" ต้องเป็น "<ส่วนที่แตะ> — <อ่านอะไร>" มีตัวคั่น " — " ตัวเดียว`;
    }
  }
  return {
    file: path.basename(absFile),
    title: lines[h1].replace(/^#\s+/, "").trim(),
    emoji,
    summary,
    checkedAt: m[4],
    readBefore,
  };
}

export function readAllPlans(): { plans: PlanStatus[]; errors: string[] } {
  const plans: PlanStatus[] = [];
  const errors: string[] = [];
  for (const name of fs.readdirSync(PLANS_DIR).filter((n) => n.endsWith(".md")).sort()) {
    const r = readPlanStatus(path.join(PLANS_DIR, name));
    if (typeof r === "string") errors.push(r);
    else plans.push(r);
  }
  const order = (p: PlanStatus) => STATUS_EMOJI.indexOf(p.emoji);
  plans.sort((a, b) => {
    // แผนแม่บทขึ้นก่อนเสมอ — เป็นจุดเริ่มอ่าน
    if (a.file.startsWith("MASTER_PLAN")) return -1;
    if (b.file.startsWith("MASTER_PLAN")) return 1;
    return order(a) - order(b) || b.file.localeCompare(a.file);
  });
  return { plans, errors };
}

const cell = (s: string) => s.replace(/\|/g, "\\|");

const isOpen = (p: PlanStatus) => p.emoji !== "✅" && p.emoji !== "📚";

export function renderClaudeBlock(plans: PlanStatus[]): string {
  const open = plans.filter(isOpen);
  const guides = plans.filter((p) => p.readBefore);
  const done = plans.filter((p) => p.emoji === "✅").length;
  const reference = plans.filter((p) => p.emoji === "📚").length;
  const openRows = open.map(
    (p) => `| ${p.emoji} | [${cell(p.title)}](docs/plans/${p.file}) | ${cell(p.summary)} | ${p.checkedAt} |`,
  );
  const guideRows = guides.map((p) => {
    const [area, what] = (p.readBefore ?? "").split(" — ");
    return `| ${cell(area)} | ${cell(what ?? "")} | [${p.file.replace(/\.md$/, "")}](docs/plans/${p.file}) |`;
  });
  return [
    CLAUDE_START,
    "",
    "> สร้างจากบรรทัด `> **สถานะ**:` และ `> **อ่านก่อนแตะ**:` ของไฟล์แผน — แก้ที่ไฟล์แผนแล้วรัน `npm run docs:index` (ห้ามแก้ตารางนี้มือ · ด่าน CI ตรวจ)",
    "",
    `**งานที่ยังเปิด** (${open.length} แผน · ${(["🚧", "⏸️", "⏳"] as const).map((e) => `${e} ${STATUS_WORD[e]}`).join(" · ")}) — ยืนยันกับโค้ด/\`git log\` ก่อนรายงานเจ้าของเสมอ`,
    "",
    "| สถานะ | แผน | สรุป | ตรวจล่าสุด |",
    "|---|---|---|---|",
    ...openRows,
    "",
    "**อ่านก่อนแตะ** — จะแก้ส่วนไหน อ่านแผนนั้นก่อน",
    "",
    "| ส่วนที่แตะ | อ่านอะไร | แผน |",
    "|---|---|---|",
    ...guideRows,
    "",
    `แผนที่ปิดแล้ว ✅ ${done} ไฟล์ · เอกสารอ้างอิง 📚 ${reference} ไฟล์ — รายชื่อเต็มทุกแผนอยู่ใน [docs/INDEX.md](docs/INDEX.md)`,
    "",
    CLAUDE_END,
  ].join("\n");
}

export function renderIndexBlock(plans: PlanStatus[]): string {
  const width = Math.max(...plans.map((p) => p.file.length));
  const lines = plans.map((p, i) => {
    const branch = i === plans.length - 1 ? "└──" : "├──";
    return `        ${branch} ${p.file.padEnd(width)} # ${p.emoji} ${p.title}`;
  });
  return [INDEX_START, ...lines, INDEX_END].join("\n");
}

function replaceBlock(content: string, start: string, end: string, block: string, file: string): string {
  const s = content.indexOf(start);
  const e = content.indexOf(end);
  if (s === -1 || e === -1 || e < s) throw new Error(`${file}: ไม่พบตัวคั่น ${start} … ${end}`);
  return content.slice(0, s) + block + content.slice(e + end.length);
}

/** ผลลัพธ์ที่ถูกต้องของสองไฟล์ — ด่าน CI ใช้เทียบ */
export function expectedFiles(): { claude: string; index: string; errors: string[] } {
  const { plans, errors } = readAllPlans();
  const claudePath = path.join(ROOT, "CLAUDE.md");
  const indexPath = path.join(ROOT, "docs/INDEX.md");
  const claude = replaceBlock(fs.readFileSync(claudePath, "utf8"), CLAUDE_START, CLAUDE_END, renderClaudeBlock(plans), "CLAUDE.md");
  // ใน INDEX.md บล็อกอยู่ในโค้ดบล็อกแผนผัง — ตัวคั่นเป็นบรรทัดของตัวเอง
  const index = replaceBlock(fs.readFileSync(indexPath, "utf8"), INDEX_START, INDEX_END, renderIndexBlock(plans), "docs/INDEX.md");
  return { claude, index, errors };
}

function daysSince(iso: string, now = new Date()): number {
  return Math.floor((now.getTime() - new Date(`${iso}T00:00:00Z`).getTime()) / 86_400_000);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const mode = process.argv[2] ?? "write";
  if (mode === "status") {
    const { plans, errors } = readAllPlans();
    for (const e of errors) console.log(`❌ ${e}`);
    const open = plans.filter((p) => p.emoji !== "✅" && p.emoji !== "📚");
    console.log(`\n📋 งานที่ยังเปิดอยู่ตามหัวสถานะ (${open.length} แผน) — ⚠️ ตรวจกับโค้ด/git log ก่อนรายงานเจ้าของเสมอ\n`);
    for (const p of open) {
      const age = daysSince(p.checkedAt);
      console.log(`${p.emoji} ${p.file}  (ตรวจล่าสุด ${p.checkedAt} · ${age} วันก่อน${age > 14 ? " — ⚠️ เก่าแล้ว ตรวจใหม่ก่อนเชื่อ" : ""})\n   ${p.summary}\n`);
    }
    process.exit(errors.length ? 1 : 0);
  }
  const { claude, index, errors } = expectedFiles();
  if (errors.length) {
    for (const e of errors) console.error(`❌ ${e}`);
    process.exit(1);
  }
  fs.writeFileSync(path.join(ROOT, "CLAUDE.md"), claude);
  fs.writeFileSync(path.join(ROOT, "docs/INDEX.md"), index);
  console.log("✅ เขียนตารางแผนงานใน CLAUDE.md และ docs/INDEX.md ใหม่จากหัวสถานะแล้ว");
}
