# รายงานผล LLM Judge (Golden Set)

ไฟล์ `judge-<PROMPT_VERSION>-<timestamp>.json` ในโฟลเดอร์นี้สร้างด้วย `scripts/qa/run-golden-judge.ts` (เคสทอง 30 เคสใน `scripts/qa/fixtures/golden-readings.json`):

```bash
npm run ai:judge                                  # ครบทุกเคส
npm run ai:judge -- --limit 3                     # รันเร็วตอนพัฒนา
npm run ai:judge -- --compare 20260904-1          # เทียบกับรายงานของ prompt version เดิม
npm run ai:judge -- --from-snapshots <version>    # ตัดสินซ้ำจาก snapshot คำอ่านที่เก็บไว้ ไม่เรียกโมเดลอ่านใหม่
```

**ทำไมต้อง commit รายงานเข้า repo**: ขึ้น `PROMPT_VERSION` แล้วต้องมีรายงานของเวอร์ชันนั้นอยู่ที่นี่ — ด่าน `test-judge-baseline` ใน `repo:verify` ตรวจ
ไม่มี baseline ให้เทียบ = คำว่า "ดีขึ้น" เป็นแค่ความรู้สึก (ที่มา: [`HANDOFF_AI_ACCURACY_THAI_2026-09-07.md`](../../../docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md) หัวข้อ 8)

⚠️ สคริปต์นี้ยิงโมเดลจริง — รันได้สองทางเท่านั้น:
- ในเครื่องด้วยคีย์ของนักพัฒนา (`.env.local`)
- workflow `.github/workflows/ai-judge.yml` แบบกดรันเอง (มีแค่ `workflow_dispatch` · ห้ามเพิ่ม `push` / `schedule`) ซึ่ง commit รายงานกลับเข้ากิ่งให้เอง

ห้ามผูกการยิงโมเดลเข้า `repo:verify` หรือ CI ของ PR — ด่านใน `repo:verify` ใช้โหมด `--dry-run` ที่ไม่เรียกโมเดล
คีย์ผู้ตัดสินแยกจากเว็บ (`JUDGE_GEMINI_API_KEY` / `JUDGE_GROQ_API_KEY`) และสถานะการตั้งค่าอยู่ใน [`docs/PENDING_SETUP.md`](../../../docs/PENDING_SETUP.md)
