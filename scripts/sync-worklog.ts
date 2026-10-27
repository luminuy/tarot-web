import { writeFileSync, realpathSync } from "fs";
import { execSync } from "child_process";
import { join } from "path";
import { fileURLToPath } from "url";
import { DECK } from "../src/data/cards";
import { PUBLIC_SPREADS } from "../src/data/spreads";
import { ARTICLES } from "../src/data/articles";
import { checkCollisions } from "./agent-guard";
import { CHECKS } from "./github-auto";

const ROOT_DIR = process.cwd();
// เขียนสถานะอัตโนมัติลงไฟล์แยกที่ .gitignore ไว้ — ไม่แตะ docs/WORK_LOG.md ที่ track ใน git
// (การเขียนทับบล็อกสรุปทุก commit เคยเป็นต้นเหตุ merge conflict แทบทุก PR ที่ทำขนานกัน)
const STATUS_PATH = join(ROOT_DIR, "docs", "WORK_LOG.status.md");

interface SystemAudit {
  timestamp: string;
  typecheckPassed: boolean;
  typecheckOutput: string;
  cardCount: number;
  spreadCount: number;
  positionCount: number;
  articleCount: number;
  gateCount: number;
  routes: Array<{ path: string; status: string }>;
}

async function probeUrl(url: string): Promise<number> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    return res.status;
  } catch {
    return 0;
  }
}

async function runAudit(): Promise<SystemAudit> {
  const timestamp = new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" });

  console.log("🔮 [Auto-Sync] กำลังตรวจสอบสถานะระบบอัตโนมัติ...");

  // 1. Typecheck
  let typecheckPassed = true;
  let typecheckOutput = "0 Errors";
  try {
    execSync("npm run typecheck", { stdio: "pipe" });
  } catch (error: any) {
    typecheckPassed = false;
    typecheckOutput = error.stdout ? error.stdout.toString() : "Error occurred";
  }

  // 2. ตัวเลขจากโค้ดจริงเท่านั้น — เดิมเทมเพลตฝังเลขตายตัว ("24 ด่าน" · "25 ผัง") ค้างผิดอยู่หลายสัปดาห์
  const cardCount = DECK.length;
  const spreadCount = PUBLIC_SPREADS.length;
  const positionCount = PUBLIC_SPREADS.reduce((acc, s) => acc + s.positions.length, 0);
  const articleCount = ARTICLES.length;
  const gateCount = CHECKS.length;

  // 3. ยิงดูหน้าหลักบนเซิร์ฟเวอร์พัฒนา (ถ้าเปิดอยู่)
  const routes = [];
  for (const p of ["/", "/cards", "/spreads", "/blog", "/account"]) {
    const status = await probeUrl(`http://localhost:3000${p}`);
    routes.push({ path: p, status: status > 0 ? `HTTP ${status}` : "ไม่ได้เปิด dev server" });
  }

  return {
    timestamp,
    typecheckPassed,
    typecheckOutput,
    cardCount,
    spreadCount,
    positionCount,
    articleCount,
    gateCount,
    routes,
  };
}

function updateWorkLog(audit: SystemAudit) {
  const summary = `# 📌 สถานะระบบล่าสุด (สร้างอัตโนมัติ — ไม่ track ใน git)

> สร้างใหม่ทุกครั้งที่รัน \`npm run log:sync\` / \`npm run commit\` · ประวัติงานอยู่ใน [\`WORK_LOG.md\`](WORK_LOG.md)
> งานที่ยังเปิด: \`npm run docs:status\` · แผนที่เอกสาร: [\`INDEX.md\`](INDEX.md)

- **เวลาที่สร้าง**: ${audit.timestamp}
- **เอเจนท์ทำงานชนกันไหม**: ${checkCollisions().summary}
- **TypeScript**: ${audit.typecheckPassed ? "ผ่าน 0 error" : "ไม่ผ่าน\n\n```\n" + audit.typecheckOutput.slice(0, 2000) + "\n```"}
- **ชุดตรวจ \`npm run repo:verify\`**: ${audit.gateCount} ด่าน (ไฟล์นี้ไม่ได้รันชุดตรวจ — ผลจริงดูจากการรันหรือ CI)
- **ข้อมูล**: ไพ่ ${audit.cardCount} ใบ · ผังสาธารณะ ${audit.spreadCount} ผัง (${audit.positionCount} ตำแหน่ง) · บทความ ${audit.articleCount} บท
- **dev server**: ${audit.routes.map((r) => `\`${r.path}\` ${r.status}`).join(" · ")}
`;

  writeFileSync(STATUS_PATH, summary, "utf-8");
  console.log("✨ [Auto-Sync] เขียนสถานะล่าสุดลง docs/WORK_LOG.status.md (ไม่ track ใน git)");
}

export async function syncWorkLog() {
  const audit = await runAudit();
  updateWorkLog(audit);
  console.log(`✅ [Auto-Sync เสร็จสิ้น] Typecheck: ${audit.typecheckPassed ? "ผ่าน" : "ไม่ผ่าน"} | ไพ่ ${audit.cardCount} ใบ | ผัง ${audit.spreadCount} ผัง`);
}

// รันเป็นสคริปต์โดยตรง (npm run log:sync) — เทียบ realpath ให้ทนต่อ symlink และ loader ของ tsx
function isRunDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}
if (isRunDirectly()) {
  syncWorkLog().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
