# 📋 Backlog — งานที่ยังเหลือ (2026-08-31)

> เอกสารนี้คือ **แผนงานเดี่ยว** สำหรับ Agent ที่จะทำงานต่อ — อ่านให้จบก่อนแตะโค้ด
> อัปเดตทุกครั้งที่ปิดงาน: ย้ายรายการที่เสร็จไป [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) (ถ้าเป็น fix) หรือขีดฆ่าทิ้ง

---

## 🚨 กติกาการทำงาน (บทเรียน INC-0015 / INC-0017 / INC-0020 — ห้ามละเมิด)

1. **ห้าม `git push origin main` เด็ดขาด** — ทุก commit ต้องผ่าน PR (`npm run pr:auto`) ที่ CI รันจริง
   `main` ตั้ง branch protection ไม่ได้ (private + free plan) จึงต้องมีวินัยเอง
2. **1 milestone = 1 branch = 1 PR** — ห้ามแตกกิ่งย่อยกระจัดกระจาย (INC-0017: เคยแตก 7 กิ่ง conflict กันเอง)
3. `git fetch origin && git checkout -B <branch> origin/main` **ก่อนเริ่มทุกครั้ง** — อย่าทำงานบน base เก่า
4. commit ผ่าน `npm run commit` เท่านั้น (ไม่ใช่ `git commit` ตรง) — เพื่อให้ audit/incident/worklog ครบ
5. `--type fix` ต้องมี `--symptom` + `--cause` + `--prevention` ที่ **ไม่ก็อป `--msg` มา** (`validateIncident()` จะบล็อก)
6. `.github/workflows/*` แก้ได้เฉพาะใน PR ที่ CI รันไฟล์นั้นจริง — อย่าเดา

---

## P1 · ลด JS หน้าแรก (perf — งานใหญ่สุดที่เหลือ) — 1 PR

**ปัญหา:** `app/page.js` ยังใหญ่ ~498KB (ลดจาก 572KB ตอน PR #21 แค่ ~13%)

| งาน | รายละเอียด |
| :-- | :-- |
| แตก `src/app/page.tsx` | ตอนนี้ ~790 บรรทัด client เดียว คุม state 30+ ตัว · แยกแต่ละ step เป็น component + ดันส่วน static ขึ้น Server Component |
| `LazyMotion` + `m` API | เปลี่ยน `import { motion } from "motion/react"` เป็น `LazyMotion` + `domAnimation` + `m.*` ในทุก component (22 ไฟล์) — โหลด motion feature เท่าที่ใช้ (~-60% vendor chunk) |
| ตรวจ `@anthropic-ai/sdk` | ยืนยันว่าไม่ถูก bundle ฝั่ง client (ต้องอยู่แค่ `src/lib/ai/claude.ts` server) |

**เกณฑ์ผ่าน:** `next build` → `app/page.js` ≤ ~300KB · flow 5 ขั้นยังเดินได้ครบ (คลิกจริงผ่านเบราว์เซอร์) · ไพ่ยังคว่ำหน้าเริ่มต้น (Golden Rule 5)

---

## P2 · เก็บกวาดเล็กๆ — 1 PR รวมกันได้

| # | งาน | ไฟล์ | เกณฑ์ผ่าน |
| :-- | :-- | :-- | :-- |
| ISSUE-006 | บั๊มพ์ `actions/checkout@v4→v5` + `actions/setup-node@v4→v5` | `pr.yml`, `deploy.yml`, `auto-release.yml` (7 จุด) | CI ผ่านครบ · ไม่มี annotation "Node.js 20 deprecated" |
| cache-control ซ้ำ | `Cache-Control` เขียนซ้ำทั้งใน `next.config.ts` (3) และ `public/_headers` (3) — เลือกที่เดียว | `next.config.ts` **หรือ** `_headers` (แนะนำเก็บ `_headers` เพราะ Cloudflare อ่านตรง · ลบ `headers()` ใน next.config ทิ้ง) | `curl -sI` production path ยังได้ header เดียวไม่ซ้ำ (บทเรียน INC-0003) |
| INC-0022 | เนื้อหาเป็นอังกฤษ + `การแก้ไข`=`หัวข้อ` — เรียบเรียงใหม่เป็นไทยมีเนื้อจริง | `docs/INCIDENT_LOG.md` | — |
| validateIncident | เพิ่มเช็ก `fix` ต้องไม่ใช่ exact-copy ของ `title` (INC-0022 หลุดมาได้) | `scripts/incident-log.ts` | `tsx -e` ทดสอบ entry ที่ `fix`==`title` ถูก reject |
| INC cross-ref | INC-0008 มี `(ดูรวมใน INC-... )` ที่ยังไม่เติมเลข | `docs/INCIDENT_LOG.md` | — |

---

## P3 · ทำ pnpm CI migration ให้ถูก (ISSUE-011) — 1 PR แยก ทำครบชุดในรอบเดียว

> ⚠️ เคยลองแล้วพัง 2 รอบ (INC-0018, INC-0020) — ครั้งนี้ต้องทำครบทุกจุดพร้อมกัน + ทดสอบก่อน push

1. `package.json` — เพิ่ม `"packageManager": "pnpm@<เวอร์ชันที่ commit lock>"`
2. `pnpm-lock.yaml` — รัน `pnpm install` ให้ lockfile sync กับ `package.json` แล้ว **commit เข้าไป**
3. `.gitignore` — เพิ่ม `package-lock.json`, `yarn.lock`
4. `pr.yml` + `deploy.yml` — `pnpm/action-setup@v4` (version ตรง packageManager) + `setup-node` `cache: "pnpm"` + `run: pnpm install --frozen-lockfile` + `pnpm run ...`
5. `pnpm-workspace.yaml` — มี `packages: - .` แล้ว (INC-0018) อย่าลบ
6. `scripts/github-auto.ts` CHECKS + hooks — ถ้ามีที่ไหนเรียก `npm` แข็งๆ ให้เป็น `pnpm`
7. **ทดสอบก่อน push:** `rm -rf node_modules && pnpm install --frozen-lockfile && npm run repo:verify` (ต้องผ่าน) · `pnpm store path` ต้องไม่ error

**เกณฑ์ผ่าน:** CI (pr.yml + deploy.yml) รันครบ ผ่าน 7 ด่าน · deploy รอบถัดไป success · `git ls-files | grep lock` เห็นแค่ `pnpm-lock.yaml`

---

## P4 · เสริมวินัย (optional แต่แนะนำ)

| งาน | รายละเอียด |
| :-- | :-- |
| `guard-main.yml` | workflow ใหม่ รันตอน `push: main` — เช็คว่า `github.event.head_commit` มาจาก merged PR (`gh pr list --search <sha> --state merged`) ถ้าไม่ → `core.setFailed` + comment บน commit เตือนว่า push ตรง main โดยไม่ผ่าน PR · กันไม่ได้ 100% แต่ทำให้ทุกการละเมิด "เห็นเป็นสีแดง" |
| ISSUE-007 Prisma | ต่อ Prisma 7 (ต้อง `prisma.config.ts` + adapter) แทน `src/server/store.ts` in-memory · **ต้องไม่ขัด PDPA** — ข้อมูลผู้ใช้ห้ามเก็บถาวรบนเซิร์ฟเวอร์ · เลื่อนได้ ยังไม่กระทบผู้ใช้ |

---

## 🔍 หนี้การตรวจสอบ (verification debt — ทำเมื่อมี env จริง)

| รายการ | วิธีตรวจ |
| :-- | :-- |
| flow ขั้น 3→4→5 (สับไพ่ → เลือกไพ่ → อ่านคำทำนาย) | ต้องมี `GEMINI_API_KEY` ในเครื่อง/preview · คลิกจริงจนจบขั้น 5 เห็นคำทำนาย stream ออกมา (PR #21/#23 verify แค่ถึงขั้น 3) |
| Chrome รูปไพ่คมเท่า Safari (ต่อจาก INC-0016) | เปิด production บน **Chrome จอ Retina** เทียบกับ Safari · ถ้ายังนิ่ม → ตามด้วย PR ถอด CSS `filter contrast/saturate/brightness` ออกจากการ์ด 33 จุด (enhancement ถูก bake ใน WebP โดย `remaster-cards.py` อยู่แล้ว — CSS filter เป็นการทำซ้ำ + บังคับ Chrome สร้าง compositing layer) |
| ISSUE-003 ปิดจริง | `verify-cards.ts` ผ่านแล้ว (`38/22/18`) แต่การเปลี่ยน `yesNo` แต่ละใบมีเหตุผลอ้างอิงความหมายไพ่กำกับไหม — รีวิว diff PR #24 |

---

## ✅ ปิดไปแล้วใน session นี้ (PR #17–#26) — อ้างอิง

ISSUE-001 (flow deadlock) · ISSUE-002 (hydration) · ISSUE-005 (auto-merge สาเหตุจริง) · ISSUE-008/009 (404 preload) · ISSUE-010 + 010b (env + session secret hard-fail) · OpenNext edge caching (KV) · AVIF · code-splitting step/modal · fonts→next/font · ตัด translateZ ออกจาก `<img>` · backdrop-filter 10px · `sizes` prop จูนต่อจุด · SEO (sitemap/robots/manifest) · INC-0015 pre-push+git:tidy warning · INCIDENT_LOG validateIncident · CI hotfix (cache:npm)
