# 📋 Backlog — งานที่ยังเหลือ (2026-09-04)

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

## 🔮 P0 · Marketplace แม่หมอตัวจริง (Phase 2) — ดูเอกสารแยก

งาน M4–M7 (D1 + reader profiles → คิว → AI screening → payments) มีเอกสารส่งต่อละเอียดที่
**[`docs/MARKETPLACE.md`](MARKETPLACE.md)** — SQL schema, code pattern, verification playbook, checklist ครบ

**ติดอยู่ 1 จุด (ต้องให้เจ้าของทำก่อน):**
1. ~~`npx wrangler d1 create tarot-app-db` → ส่ง `database_id` กลับมา~~
   ✅ **ทำแล้ว** — `database_id: 560fdbe7-e1f5-46e1-bad6-c8c387dcfcb5` อยู่ใน `wrangler.jsonc` (binding `APP_DB`)
2. ⬜ ADR + PDPA sign-off (marketplace เก็บ PII ลูกค้า + ส่ง LINE — ขัดกฎเดิม)

Phase 1 (แผงแอดมิน M0–M3) เสร็จแล้ว: PR #57 (auth+platform), #59 (stats), #60 (live content overrides)
→ ดู [`docs/ADMIN_PANEL.md`](ADMIN_PANEL.md) · เจ้าของต้อง `wrangler secret put ADMIN_PASSWORD` ให้ `/admin` ใช้งานได้บน prod

---

## ~~🎟 P1 · ระบบสมาชิกและโควตาเปิดไพ่ — 6 PR (A–F)~~ — ✅ **เสร็จสมบูรณ์แล้ว (2026-09-02)**

ผู้เยี่ยมชมทดลองฟรี 1 ครั้งไม่ต้องสมัคร · สมาชิก 3 ครั้ง/สัปดาห์ รีเซ็ตวันจันทร์ ·
คุยกับแม่หมอเฉพาะสมาชิก · ซ่อนหลังธง `entitlement.enabled` เปิดปิดได้โดยไม่ต้อง deploy
- ✅ Migration 0007 (`migrations/0007_reading_entitlement.sql`) ใช้งานบน Cloudflare D1
- ✅ `src/lib/entitlement/` + `src/components/entitlement/` + `src/app/api/entitlement/`
- ✅ ชุดทดสอบอัตโนมัติ `scripts/qa/test-entitlement.ts` ผ่าน 100%

---

## ~~P1 · ลด JS หน้าแรก (perf)~~ — ✅ **บรรลุเป้าแล้ว (วัดซ้ำ 2026-09-01)**

**เดิม** `app/page.js` ~498KB · **เกณฑ์ผ่าน** ≤ ~300KB · **ตอนนี้ 81KB** — ผ่านเป้าไปมาก
(ผลจาก dynamic import คอมโพเนนต์หนัก 10 ตัวใน `page.tsx` ที่ทำระหว่าง PR ชุด auth/entitlement)

วัดซ้ำ: `npm run build` แล้ว
`ls -la .next/static/chunks/app/page*.js | awk '{printf "%.0f KB\n", $5/1024}'`

**เหลือแค่ optional ไม่เร่ง:**

| งาน | รายละเอียด |
| :-- | :-- |
| `LazyMotion` + `m` API | เปลี่ยน `import { motion } from "motion/react"` เป็น `LazyMotion` + `domAnimation` + `m.*` ในทุก component (22 ไฟล์) — โหลด motion feature เท่าที่ใช้ (~-60% vendor chunk) |
| ตรวจ `@anthropic-ai/sdk` | ยืนยันว่าไม่ถูก bundle ฝั่ง client (ต้องอยู่แค่ `src/lib/ai/claude.ts` server) |

**เกณฑ์ผ่าน:**
- ✅ `next build` → `app/page.js` ≤ ~300KB — **ผ่าน (81KB)**
- ✅ flow 5 ขั้นเดินได้ครบ
- ✅ ไพ่ยังคว่ำหน้าเริ่มต้น (Golden Rule 5)

---

## P2 · เก็บกวาดเล็กๆ — เสร็จสมบูรณ์แล้วใน PR นี้ ✅

| # | งาน | ไฟล์ | เกณฑ์ผ่าน | สถานะ |
| :-- | :-- | :-- | :-- | :-- |
| ISSUE-006 | ตรวจสอบ Node.js 22 บน GitHub Actions | `pr.yml`, `deploy.yml`, `auto-release.yml` | CI ผ่านครบ · ใช้ Node 22 | ✅ เสร็จ |
| cache-control ซ้ำ | ถอด `headers()` ใน `next.config.ts` ให้ `public/_headers` คุมตรงที่ edge | `next.config.ts`, `public/_headers` | `next build` 0 warnings · edge cache ตรง | ✅ เสร็จ |
| INC-0022 - INC-0026 | เรียบเรียงเนื้อหาเป็นไทยสมบูรณ์ มีเนื้อหาและบทเรียนแท้จริง | `docs/INCIDENT_LOG.md` | อ่านเข้าใจง่าย มี root cause และ prevention ครบ | ✅ เสร็จ |
| validateIncident | เพิ่มเช็ก `fix` และ `prevention` ต้องไม่ใช่ copy ของ `title` หรือ `fix` | `scripts/incident-log.ts` | บล็อก entry ที่ก็อปหัวข้อมาใส่ | ✅ เสร็จ |
| INC cross-ref | เติมเลขอ้างอิง `INC-0014` ใน INC-0008 | `docs/INCIDENT_LOG.md` | ครอสเช็กสมบูรณ์ | ✅ เสร็จ |

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

**เกณฑ์ผ่าน:** CI (pr.yml + deploy.yml) รันครบ ผ่าน 24 ด่าน · deploy รอบถัดไป success · `git ls-files | grep lock` เห็นแค่ `pnpm-lock.yaml`

---

## P4 · เสริมวินัย (optional แต่แนะนำ)

| งาน | รายละเอียด |
| :-- | :-- |
| `guard-main.yml` | workflow ใหม่ รันตอน `push: main` — เช็คว่า `github.event.head_commit` มาจาก merged PR (`gh pr list --search <sha> --state merged`) ถ้าไม่ → `core.setFailed` + comment บน commit เตือนว่า push ตรง main โดยไม่ผ่าน PR · กันไม่ได้ 100% แต่ทำให้ทุกการละเมิด "เห็นเป็นสีแดง" |
| ~~ISSUE-007 Prisma~~ | 🟢 **ปิดแล้ว (ตรวจ 2026-09-01)** — ระบบย้ายไป Cloudflare D1 (`APP_DB`) ถาวรแล้ว ไม่ได้ใช้ Prisma |

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
