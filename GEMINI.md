# SeerTarot — คู่มือสำหรับ Gemini / Antigravity

กติกาทั้งหมดของโปรเจกต์อยู่ที่ **[CLAUDE.md](CLAUDE.md)** ไฟล์เดียว — กฎเหล็ก (ข้อ 0–14) · เอกสารที่ต้องอ่านก่อนแก้โค้ด · คำสั่งหลัก · ตารางแผนงาน
ใช้กับ AI ทุกตัว ไม่ใช่เฉพาะ Claude **อ่านไฟล์นั้นก่อนเริ่มงานทุกครั้ง แล้วทำตามทุกข้อ**

ไฟล์นี้มีไว้เพราะ Gemini CLI / Antigravity อ่าน `GEMINI.md` อัตโนมัติ แต่ไม่อ่าน `CLAUDE.md` เอง — ห้ามคัดลอกกฎมาไว้ที่นี่ (เคยคัดลอกแล้วเลขด่านกับกฎเพี้ยนจากต้นฉบับ)

## สิ่งที่ต่างจาก Claude Code

| เรื่อง | ทำอย่างไร |
| :--- | :--- |
| ชื่อในล็อกไฟล์ | `npm run agent:lock -- --agent Gemini --domain <หมวด> --files "<ไฟล์>" --task "<งาน>"` · เสร็จแล้ว `npm run agent:unlock -- --agent Gemini` |
| commit | `npm run commit -- --agent Gemini ...` (commit ประเภท `fix` ต้องมี `--symptom` `--cause` `--prevention`) — รายละเอียดใน [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0.3–0.4 |
| ผู้ช่วย `cmo` · `coo` · `cto` | เป็น subagent ของ Claude Code (`.claude/agents/`) — Gemini เรียกใช้ไม่ได้ ถ้าเจ้าของสั่งด้วยคำเหล่านี้ ให้บอกว่าต้องสั่งผ่าน Claude Code |
| เปิด PR | `npm run pr:auto` เหมือนกัน · ถ้าไม่มี `gh` ให้เปิด PR ผ่าน GitHub API แทน (CLAUDE.md กฎข้อ 13) |

## แผนที่เอกสาร

ดู [docs/INDEX.md](docs/INDEX.md) — รวมเอกสารทุกไฟล์ แบ่งตามหน้าที่ และลำดับการอ่านตามบทบาท
