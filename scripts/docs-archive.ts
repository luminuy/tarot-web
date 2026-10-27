/**
 * 🗄️ ย้ายบันทึกเก่าออกจาก WORK_LOG.md / INCIDENT_LOG.md ไปเก็บรายเดือนใน docs/archive/
 * ===========================================================================
 *
 * ## ทำไมต้องมี (2026-10-26)
 *
 * `docs/WORK_LOG.md` โตถึง 2.7 MB (663 รอบ) และ `docs/INCIDENT_LOG.md` 1 MB (300+ เหตุการณ์)
 * ขณะที่ CLAUDE.md สั่งให้เอเจนท์ "อ่านก่อนแก้โค้ดทุกครั้ง" — อ่านจริงไม่ได้ กฎจึงกลายเป็นพิธี
 * ไฟล์หลักจึงเก็บเฉพาะของล่าสุด ส่วนของเก่าย้ายไปเก็บรายเดือนแบบคำต่อคำ (ค้นด้วย grep ได้เหมือนเดิม)
 *
 * ## กติกา
 *
 * 1. รายการที่ลงวันที่เก่ากว่า `--days` วัน (ค่าเริ่มต้น 31 · นับตามเวลาไทย) ย้ายไป
 *    `docs/archive/work-log/WORK_LOG_YYYY-MM.md` · `docs/archive/incidents/INCIDENT_LOG_YYYY-MM.md`
 * 2. เนื้อหาไม่ถูกแก้ ยกเว้นลิงก์สัมพัทธ์ที่ต้องปรับตามโฟลเดอร์ใหม่ (ไม่งั้นลิงก์พังทั้งก้อน)
 * 3. ในไฟล์เก็บถาวร ใหม่สุดอยู่บนสุดเหมือนไฟล์หลัก · รันซ้ำได้ ไม่ย้ายซ้ำ
 * 4. ด่าน `test-docs-numbers` อ่านเลข INC จากไฟล์หลักและไฟล์เก็บถาวรรวมกัน — เลขที่ย้ายไปยังอ้างได้
 *
 * ใช้งาน: `npm run docs:archive` · `npm run docs:archive -- --dry-run` · `-- --days 45`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

interface LogSpec {
  /** ไฟล์หลัก (สัมพัทธ์กับรากรีโป) */
  file: string;
  /** โฟลเดอร์เก็บถาวร (สัมพัทธ์กับรากรีโป) */
  archiveDir: string;
  /** คำนำหน้าชื่อไฟล์เก็บถาวร */
  prefix: string;
  /** บรรทัดที่เริ่มรายการใหม่ */
  entryStart: RegExp;
  /** ดึงวันที่ YYYY-MM-DD จากบรรทัดหัวรายการ */
  entryDate: RegExp;
  /** หัวไฟล์จบที่ไหน — คืน index ของบรรทัดแรกที่เป็นรายการ */
  headerEnd: (lines: string[]) => number;
  /** ส่วนท้ายที่ต้องคงไว้ในไฟล์หลัก (เช่นแม่แบบ) — คืน index บรรทัดแรกของส่วนท้าย หรือ lines.length */
  footerStart: (lines: string[]) => number;
  title: string;
}

const firstMatch = (lines: string[], re: RegExp, from = 0) => {
  for (let i = from; i < lines.length; i++) if (re.test(lines[i])) return i;
  return -1;
};

const LOGS: LogSpec[] = [
  {
    file: "docs/WORK_LOG.md",
    archiveDir: "docs/archive/work-log",
    prefix: "WORK_LOG",
    entryStart: /^### 🗓️ /,
    entryDate: /^### 🗓️ \[?(\d{4}-\d{2}-\d{2})/,
    headerEnd: (lines) => {
      const i = firstMatch(lines, /^### 🗓️ /);
      return i === -1 ? lines.length : i;
    },
    footerStart: (lines) => {
      const i = firstMatch(lines, /^## 📝 /);
      if (i === -1) return lines.length;
      // ดึงเส้นคั่น --- และบรรทัดว่างก่อนหัวแม่แบบไปอยู่กับส่วนท้าย
      let j = i;
      while (j > 0 && (lines[j - 1].trim() === "" || lines[j - 1].trim() === "---")) j--;
      return j;
    },
    title: "บันทึกงานเก่า",
  },
  {
    file: "docs/INCIDENT_LOG.md",
    archiveDir: "docs/archive/incidents",
    prefix: "INCIDENT_LOG",
    entryStart: /^### INC-\d{4}[a-z]? /,
    entryDate: /^### INC-\d{4}[a-z]? · (\d{4}-\d{2}-\d{2})/,
    headerEnd: (lines) => {
      const i = firstMatch(lines, /^### INC-\d{4}[a-z]? /);
      return i === -1 ? lines.length : i;
    },
    footerStart: (lines) => lines.length,
    title: "บันทึกเหตุการณ์เก่า",
  },
];

interface Entry {
  date: string | null;
  lines: string[];
}

/** แยกส่วนหัว · รายการ · ส่วนท้าย */
function splitLog(text: string, spec: LogSpec): { header: string[]; entries: Entry[]; footer: string[] } {
  const lines = text.split("\n");
  // แม่แบบท้ายไฟล์มีหัวรายการตัวอย่าง — หาหัวไฟล์จบเฉพาะก่อนส่วนท้าย (กันกรณีรายการถูกย้ายออกหมด)
  const f = spec.footerStart(lines);
  const h = Math.min(spec.headerEnd(lines), f);
  const header = lines.slice(0, h);
  const body = lines.slice(h, f);
  const footer = lines.slice(f);
  const entries: Entry[] = [];
  for (const line of body) {
    if (spec.entryStart.test(line) || entries.length === 0) {
      entries.push({ date: spec.entryDate.exec(line)?.[1] ?? null, lines: [line] });
    } else {
      entries[entries.length - 1].lines.push(line);
    }
  }
  // รายการที่ไม่มีวันที่ (เช่นเลขที่ถูกยกเลิก) ใช้วันที่ของรายการก่อนหน้า (ใหม่กว่า) ที่ติดกัน
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].date === null && i > 0) entries[i].date = entries[i - 1].date;
  }
  return { header, entries, footer };
}

/** ปรับลิงก์สัมพัทธ์ให้ชี้ไฟล์เดิมได้จากโฟลเดอร์ใหม่ (ข้ามโค้ดบล็อก) */
function rebaseLinks(lines: string[], fromDir: string, toDir: string): string[] {
  let inFence = false;
  return lines.map((line) => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return line;
    }
    if (inFence) return line;
    return line.replace(/\]\(([^)\s]+)\)/g, (whole, target: string) => {
      if (/^(?:[a-z]+:|#|\/)/i.test(target)) return whole;
      const [p, hash] = target.split("#");
      if (!p) return whole;
      const abs = path.resolve(ROOT, fromDir, p);
      const rel = path.relative(path.resolve(ROOT, toDir), abs).split(path.sep).join("/");
      return `](${rel}${hash !== undefined ? `#${hash}` : ""})`;
    });
  });
}

function archiveHeader(spec: LogSpec, month: string): string[] {
  const back = path.relative(path.resolve(ROOT, spec.archiveDir), path.resolve(ROOT, spec.file)).split(path.sep).join("/");
  return [
    `# 🗄️ ${spec.title} — ${month}`,
    "",
    `> ย้ายมาจาก [\`${spec.file}\`](${back}) ด้วย \`npm run docs:archive\` — เป็นบันทึก ณ วันนั้น ห้ามแก้ย้อนหลัง (แก้ได้แค่ลิงก์ที่พัง)`,
    "> ใหม่สุดอยู่บนสุด",
    "",
    "---",
    "",
  ];
}

function bangkokToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}

function shiftDate(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function archiveLog(spec: LogSpec, cutoff: string, dryRun: boolean): { moved: number; months: string[] } {
  const mainPath = path.join(ROOT, spec.file);
  const { header, entries, footer } = splitLog(fs.readFileSync(mainPath, "utf8"), spec);
  const keep: Entry[] = [];
  const byMonth = new Map<string, Entry[]>();
  for (const e of entries) {
    if (e.date !== null && e.date < cutoff) {
      const month = e.date.slice(0, 7);
      if (!byMonth.has(month)) byMonth.set(month, []);
      byMonth.get(month)!.push({ date: e.date, lines: rebaseLinks(e.lines, path.dirname(spec.file), spec.archiveDir) });
    } else {
      keep.push(e);
    }
  }
  const moved = [...byMonth.values()].reduce((s, list) => s + list.length, 0);
  if (dryRun || moved === 0) return { moved, months: [...byMonth.keys()].sort() };

  fs.mkdirSync(path.join(ROOT, spec.archiveDir), { recursive: true });
  for (const [month, list] of byMonth) {
    const file = path.join(ROOT, spec.archiveDir, `${spec.prefix}_${month}.md`);
    let existing: Entry[] = [];
    let head = archiveHeader(spec, month);
    if (fs.existsSync(file)) {
      const parsed = splitLog(fs.readFileSync(file, "utf8"), { ...spec, footerStart: (l) => l.length });
      existing = parsed.entries;
      head = parsed.header;
    }
    // ใหม่สุดอยู่บน · วันเดียวกันคงลำดับเดิม (sort ของ JS เสถียร)
    const merged = [...list, ...existing].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    const out = [...head, ...merged.flatMap((e) => e.lines)].join("\n").replace(/\n*$/, "\n");
    fs.writeFileSync(file, out);
  }
  const main = [...header, ...keep.flatMap((e) => e.lines), ...footer].join("\n");
  fs.writeFileSync(mainPath, main);
  return { moved, months: [...byMonth.keys()].sort() };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const daysArg = args.indexOf("--days");
  const days = daysArg !== -1 ? Number(args[daysArg + 1]) : 31;
  if (!Number.isInteger(days) || days < 7) {
    console.error("❌ --days ต้องเป็นจำนวนเต็มตั้งแต่ 7 ขึ้นไป");
    process.exit(1);
  }
  const cutoff = shiftDate(bangkokToday(), days);
  console.log(`🗄️ ย้ายรายการที่ลงวันที่ก่อน ${cutoff} (${days} วัน)${dryRun ? " — ทดลอง ไม่เขียนไฟล์" : ""}`);
  for (const spec of LOGS) {
    const { moved, months } = archiveLog(spec, cutoff, dryRun);
    console.log(`  ${spec.file}: ${moved} รายการ${months.length ? ` ➔ ${spec.archiveDir}/ (${months.join(", ")})` : ""}`);
  }
}
