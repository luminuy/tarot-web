/**
 * 📋 Incident Log Engine — ระบบบันทึกความผิดพลาดอัตโนมัติ (Blameless Post-Mortem)
 *
 * ปรัชญา: **ความผิดพลาดทุกครั้งคือบทเรียนที่ต้องถูกบันทึก ไม่ใช่เรื่องที่ต้องปกปิด**
 * แต่ความผิดพลาดเดิมที่เกิดซ้ำเป็นครั้งที่สอง = ระบบบันทึกล้มเหลว
 *
 * ทุกครั้งที่ commit ด้วย type `fix` / `hotfix` / `revert`
 * `scripts/git-author-guard.ts` จะเรียกฟังก์ชันนี้ให้อัตโนมัติ
 * และจะ **บล็อกการ commit** ถ้าไม่ได้ระบุ `--cause` และ `--prevention`
 * เพราะการแก้บั๊กโดยไม่บอกว่า "ทำไมถึงเกิด" และ "จะกันไม่ให้เกิดอีกยังไง"
 * คือการแก้ที่ไม่จบ และเปิดทางให้เกิดซ้ำ
 *
 * เรียกใช้ด้วยมือได้ด้วย:
 *   npm run incident -- --title "..." --severity high --symptom "..." \
 *     --impact "..." --cause "..." --fix "..." --prevention "..." --verify "..."
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const LOG_PATH = path.join(process.cwd(), "docs", "INCIDENT_LOG.md");
const ENTRIES_MARKER = "<!-- INCIDENT_ENTRIES_START -->";

export type Severity = "critical" | "high" | "medium" | "low";

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "🔴 Critical — กระทบผู้ใช้จริงบน production หรือทำข้อมูลเสียหาย",
  high: "🟠 High — ทำให้ pipeline/deploy พัง หรือฟีเจอร์หลักใช้ไม่ได้",
  medium: "🟡 Medium — ทำงานผิดแต่มีทางเลี่ยง หรือกระทบเฉพาะบางหน้า",
  low: "🔵 Low — ความไม่เรียบร้อยเล็กน้อย ไม่กระทบการใช้งาน",
};

export interface Incident {
  /** หัวข้อสั้น ๆ ที่อ่านแล้วรู้ทันทีว่าเรื่องอะไร */
  title: string;
  severity: Severity;
  /** อาการที่สังเกตเห็น — เขียนแบบที่คนเจอครั้งแรกจะเห็น ไม่ใช่แบบที่รู้คำตอบแล้ว */
  symptom: string;
  /** ใครหรืออะไรได้รับผลกระทบ และแค่ไหน */
  impact?: string;
  /** สาเหตุรากที่แท้จริง — ไม่ใช่แค่อาการ ต้องตอบให้ได้ว่า "ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก" */
  rootCause: string;
  /** หลักฐานจริง เช่น คำสั่งที่รันและผลลัพธ์ที่ได้ */
  evidence?: string;
  /** แก้อย่างไร */
  fix: string;
  /** ⭐ สำคัญที่สุด: กฎถาวรที่ทำให้ความผิดพลาดนี้เกิดซ้ำไม่ได้อีก */
  prevention: string;
  /** พิสูจน์ได้อย่างไรว่าแก้ได้จริง (ไม่ใช่แค่ "น่าจะหายแล้ว") */
  verification?: string;
  agent?: string;
}

function gitOrNull(args: string[]): string | null {
  try {
    return execFileSync("git", args, { encoding: "utf-8", stdio: "pipe" }).trim();
  } catch {
    return null;
  }
}

/** วันเวลาไทย รูปแบบ YYYY-MM-DD HH:mm */
function bangkokTimestamp(): string {
  const d = new Date();
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Bangkok",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function nextIncidentId(content: string): string {
  const ids = [...content.matchAll(/### INC-(\d{4})/g)].map((m) => Number(m[1]));
  const next = ids.length ? Math.max(...ids) + 1 : 1;
  return `INC-${String(next).padStart(4, "0")}`;
}

function ensureLogFile(): string {
  if (fs.existsSync(LOG_PATH)) return fs.readFileSync(LOG_PATH, "utf-8");
  const header = `# 📋 บันทึกความผิดพลาดและบทเรียน (Incident Log & Blameless Post-Mortem)

> 🎯 **เอกสารนี้สำคัญที่สุดสำหรับ AI Agent ทุกตัว — ต้องอ่านก่อนเริ่มงานทุกครั้ง**
>
> ทุกความผิดพลาดที่เคยเกิดขึ้นถูกบันทึกไว้ที่นี่พร้อม **กฎป้องกันถาวร**
> การทำผิดซ้ำในสิ่งที่มีบันทึกอยู่แล้ว ถือเป็นความบกพร่องร้ายแรงที่สุด

---

## 🧭 วิธีใช้เอกสารนี้

1. **ก่อนเริ่มงาน**: อ่านหัวข้อทั้งหมด (แค่ชื่อเรื่องก็พอ) เพื่อรู้ว่ามีกับดักอะไรบ้างในโปรเจกต์นี้
2. **ก่อนแก้บั๊ก**: ค้นหาว่าเคยมีเคสคล้ายกันไหม อาจมีคำตอบอยู่แล้ว
3. **หลังแก้บั๊ก**: บันทึกทันที — ระบบจะบังคับให้ทำเองอัตโนมัติเมื่อ commit ด้วย type \`fix\`

## 📐 มาตรฐานการบันทึก

ทุกครั้งที่ commit ด้วย \`--type fix\` / \`hotfix\` / \`revert\`
\`scripts/git-author-guard.ts\` จะบันทึกลงไฟล์นี้ให้อัตโนมัติ และ **จะบล็อกการ commit ถ้าไม่ระบุ \`--cause\` กับ \`--prevention\`**

\`\`\`bash
npm run commit -- --agent <ชื่อคุณ> --type fix --scope <หมวด> \\
  --msg "<แก้อะไร>" \\
  --cause "<ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก>" \\
  --prevention "<กฎถาวรที่ทำให้ไม่เกิดซ้ำ>" \\
  --severity high \\
  --verify "<พิสูจน์อย่างไรว่าแก้ได้จริง>"
\`\`\`

บันทึกด้วยมือ (กรณีเจอปัญหาแต่ยังไม่ได้ commit):

\`\`\`bash
npm run incident -- --title "..." --severity high --symptom "..." \\
  --cause "..." --fix "..." --prevention "..."
\`\`\`

## 🚦 ระดับความรุนแรง

| ระดับ | ความหมาย |
| :--- | :--- |
| 🔴 **Critical** | กระทบผู้ใช้จริงบน production หรือทำข้อมูลเสียหาย |
| 🟠 **High** | ทำให้ pipeline/deploy พัง หรือฟีเจอร์หลักใช้ไม่ได้ |
| 🟡 **Medium** | ทำงานผิดแต่มีทางเลี่ยง หรือกระทบเฉพาะบางหน้า |
| 🔵 **Low** | ความไม่เรียบร้อยเล็กน้อย ไม่กระทบการใช้งาน |

---

## 📜 รายการเหตุการณ์ (ใหม่สุดอยู่บนสุด)

${ENTRIES_MARKER}
`;
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.writeFileSync(LOG_PATH, header, "utf-8");
  return header;
}

/** เขียนบันทึกเหตุการณ์ลง docs/INCIDENT_LOG.md แล้วคืนรหัสเหตุการณ์ */
export function recordIncident(incident: Incident): string {
  const content = ensureLogFile();
  const id = nextIncidentId(content);
  const branch = gitOrNull(["branch", "--show-current"]) ?? "(ไม่ทราบ)";
  const commit = gitOrNull(["rev-parse", "--short", "HEAD"]) ?? "(ยังไม่มี commit)";

  const row = (label: string, value?: string) =>
    value ? `| **${label}** | ${value.replace(/\n/g, "<br>")} |\n` : "";

  let entry = `\n### ${id} · ${bangkokTimestamp()} · ${SEVERITY_LABEL[incident.severity].split(" — ")[0]} · ${incident.title}\n\n`;
  entry += `| หัวข้อ | รายละเอียด |\n| :--- | :--- |\n`;
  entry += row("อาการที่พบ", incident.symptom);
  entry += row("ผลกระทบ", incident.impact);
  entry += row("สาเหตุราก", incident.rootCause);
  entry += row("หลักฐาน", incident.evidence);
  entry += row("การแก้ไข", incident.fix);
  entry += row("🛡️ กฎป้องกันถาวร", `**${incident.prevention}**`);
  entry += row("การพิสูจน์ว่าแก้ได้จริง", incident.verification);
  entry += row("บันทึกโดย", `${incident.agent ?? "ไม่ระบุ"} · branch \`${branch}\` · commit \`${commit}\``);
  entry += "\n";

  fs.writeFileSync(LOG_PATH, content.replace(ENTRIES_MARKER, ENTRIES_MARKER + entry), "utf-8");
  return id;
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(args: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) continue;
    const key = args[i].slice(2);
    parsed[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
  }
  return parsed;
}

const isDirectRun = process.argv[1]?.endsWith("incident-log.ts");
if (isDirectRun) {
  const a = parseArgs(process.argv.slice(2));
  const missing = ["title", "symptom", "cause", "fix", "prevention"].filter((k) => !a[k]);

  if (missing.length) {
    console.error(`\n❌ ขาดข้อมูลที่จำเป็น: ${missing.map((m) => `--${m}`).join(", ")}\n`);
    console.error("ตัวอย่าง:");
    console.error(`  npm run incident -- --title "ชื่อเหตุการณ์" --severity high \\`);
    console.error(`    --symptom "อาการที่เห็น" --cause "สาเหตุรากที่แท้จริง" \\`);
    console.error(`    --fix "แก้อย่างไร" --prevention "กฎถาวรกันเกิดซ้ำ" \\`);
    console.error(`    --impact "ผลกระทบ" --verify "พิสูจน์ยังไงว่าแก้ได้จริง"\n`);
    process.exit(1);
  }

  const severity = (a.severity || "medium") as Severity;
  if (!SEVERITY_LABEL[severity]) {
    console.error(`❌ --severity ต้องเป็นหนึ่งใน: critical, high, medium, low (ได้: ${severity})`);
    process.exit(1);
  }

  const id = recordIncident({
    title: a.title,
    severity,
    symptom: a.symptom,
    impact: a.impact,
    rootCause: a.cause,
    evidence: a.evidence,
    fix: a.fix,
    prevention: a.prevention,
    verification: a.verify,
    agent: a.agent,
  });

  console.log(`\n📋 บันทึกเหตุการณ์ ${id} ลง docs/INCIDENT_LOG.md เรียบร้อย`);
  console.log(`   กฎป้องกันถาวร: ${a.prevention}\n`);
}
