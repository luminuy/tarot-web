# 🐛 บั๊กและงานค้างที่รู้แล้วแต่ยังไม่ได้แก้ (Known Issues Registry)

> 🎯 **สำหรับ AI Agent ทุกตัว**: นี่คือรายการปัญหาที่ **ตรวจสอบยืนยันแล้วว่ามีจริง** แต่ยังไม่ได้แก้
>
> - **ก่อนเริ่มงานใหม่** ให้ดูก่อนว่ามีงานในนี้ที่เกี่ยวข้องกับสิ่งที่กำลังจะแก้หรือไม่
> - **ก่อนลงมือ** ให้ตรวจว่ามี Agent อื่นจับงานนี้อยู่หรือยัง (`npm run agent:status`) และล็อคไฟล์ก่อนเสมอ
> - **เมื่อแก้เสร็จ** ให้ย้ายรายการนั้นออกจากไฟล์นี้ แล้วบันทึกลง [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) แทน
>
> ปัญหาที่ **แก้ไปแล้ว** อยู่ใน [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) พร้อมกฎป้องกันถาวร — อ่านที่นั่นก่อนเริ่มงานทุกครั้ง
>
> 🔒 **หมายเหตุ**: `npm run repo:verify` มีด่าน **"การอ้างอิง path ภาพไพ่ถูกต้อง"** (ด่านที่ 7)
> ซึ่งจะบล็อกทันทีถ้ามีการเขียน path ภาพไพ่เองในจุดใหม่ (บทเรียนจาก ISSUE-008 ที่ละเมิดกฎซึ่งมีเขียนไว้แล้วใน INC-0002)

---

## 📅 การตรวจซ้ำครั้งล่าสุด (Last Full Re-Audit)

| หัวข้อ | ค่า |
| :--- | :--- |
| **วันที่** | 2026-08-31 |
| **commit ฐาน** | main + branch `claude/resilience-perf-enhancements` (perf/รูป/SEO/bug fixes) + PR #19/#20 (edge caching) |
| **วิธีตรวจ** | dev server + คลิกผ่านเบราว์เซอร์ + `curl` + `npm run repo:verify` + `opennextjs-cloudflare build` + ตรวจ production จริง |
| **ผลสรุป** | ✅ ISSUE-001/002/008/009 **แก้แล้ว** (ดู INC-0014 + ด้านล่าง) · 🟡 ISSUE-003 + ISSUE-010(ครึ่งหลัง) + ISSUE-011 ยังค้าง · 🔵 ISSUE-004/005/006/007 ยังเป็นข้อจำกัดเดิม |

### 🗂️ ดัชนีบั๊กที่ยังค้าง

| # | ระดับ | หัวข้อย่อ | ไฟล์หลัก | สถานะ |
| :-- | :-- | :--- | :--- | :-- |
| **010b** | 🟡 Medium | session-token fallback เป็นสตริงตายตัวถ้าลืมตั้ง env | `src/lib/security/session-token.ts` | 🟡 ยังค้าง (เพิ่มคีย์ใน `.env.example` แล้ว แต่ยังไม่ hard-fail) |
| **003** | 🟡 Medium | ฐานข้อมูลไพ่เอียง "ใช่" (43/18/17) | `src/data/cards/*.ts` | 🟡 ยังค้าง (เท่าเดิม) |
| **011** | 🔵 Low | repo ใช้ pnpm แต่ CI/เอกสารเป็น npm | `package.json`, `.github/workflows/*` | 🔵 ยังค้าง — เพิ่ม `browserslist` แล้ว แต่ `packageManager` field ยังไม่ใส่ (เสี่ยง CI ที่ใช้ `npm install`) ต้องแยก PR: ใส่ field + ย้าย CI ไป `pnpm` + gitignore `package-lock.json` พร้อมกัน |
| **004** | 🔵 Low | รัน `wrangler dev` บน macOS 12.6 ไม่ได้ | (สภาพแวดล้อม) | 🔵 ข้อจำกัดเครื่อง |
| **005** | 🔵 Low | GitHub auto-merge ใช้ไม่ได้ (private repo + แพลนฟรี) | (ตั้งค่า GitHub) | 🔵 ปล่อยไว้ได้ |
| **006** | 🔵 Low | GitHub Actions เตือน Node 20 deprecated | `.github/workflows/*.yml` | 🔵 ยังเป็น `@v4` ทั้ง 3 ไฟล์ |
| **007** | 🔵 Low | Prisma schema พร้อมแต่ยังไม่ต่อใช้ (ใช้ in-memory) | `src/server/store.ts` | 🔵 หนี้เทคนิค |

---

## ✅ แก้เสร็จแล้ว + verify แล้ว (branch `claude/resilience-perf-enhancements` + merge นี้)

| # | เดิม | แก้อย่างไร | verify (2026-08-31, dev :3200) |
| :-- | :--- | :--- | :--- |
| **001** 🔴 | flow ดูดวงติดตายขั้น 1 — `<AnimatePresence mode="wait">` deadlock (motion@13 + React 19.2) | ถอด `<AnimatePresence>` + `<motion.div>` ทั้งหมดใน `src/app/page.tsx` ออก ใช้ conditional render ธรรมดา + scroll reset | ✅ คลิกจริง: ขั้น 1→2→3 เดินได้ (`currentStep` เปลี่ยน, `<textarea>` โผล่, `/api/reading/start` 200, ถึงหน้าสับไพ่) |
| **002** 🟠 | Hydration mismatch — `Math.cos/sin` ทศนิยมดิบใน inline style | `Number((Math.cos(rad) * radius).toFixed(2))` ทุกจุดใน `TarotArtIcons.tsx` | ✅ `curl /spreads` → `translate()` ปัด 2 ตำแหน่ง, ทศนิยมดิบ 0 จุด |
| **008** 🟠 | `cache.ts` พรีโหลดจาก `/cards/variants/w320/` (404 × 9) | ใช้ `getCardImageSrc()` จาก `@/lib/tarot/card-image` + ลบ `ALLOWLIST` ใน `scripts/qa/test-image-paths.ts` | ✅ network log หน้าแรก: ไม่มี request ไป `/cards/variants/` แล้ว · console error 0 |
| **009** 🟠 | `cache.ts` พรีโหลด `/sounds/*.mp3` (404 × 3) | ตัด `PRELOAD_SOUNDS` ทิ้ง (ระบบเสียงใช้ Web Audio synth ใน `audio.ts` อยู่แล้ว) | ✅ network log: ไม่มี request `/sounds/` แล้ว |

**ISSUE-010** แก้ครึ่งเดียว: `.env.example` เพิ่ม `TAROT_SESSION_SECRET` + Turnstile keys แล้ว
แต่ **ครึ่งหลังยังค้าง** → ดู ISSUE-010b ในดัชนีข้างบน

**ISSUE-011** ยังค้าง: merge นี้เอา `browserslist` เข้ามา แต่ **ไม่ใส่ `packageManager`** เพราะ CI (`pr.yml`/`deploy.yml`) ยังใช้ `npm install` การใส่ field `pnpm@x` อาจทำ corepack เด้ง — ต้องแยก PR ทำพร้อมกันทั้งชุด

> ยังไม่ได้ verify: flow ขั้น 3→4→5 (สับไพ่ → เลือกไพ่ → อ่านคำทำนาย) — ต้องมี `GEMINI_API_KEY` จริง · bundle หน้าแรกยัง 498KB (code-split ช่วยแค่ ~13% — page.tsx ยังใหญ่, LazyMotion ยังไม่ทำ = แผน perf ระดับ 2.3/2.4)

---

## 🟡 ระดับ Medium — ทำงานผิดแต่ไม่บล็อกผู้ใช้

### ISSUE-010b · session-token fallback เป็นสตริงตายตัวถ้าลืมตั้ง env → Provably-Fair พังเงียบ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | [`src/lib/security/session-token.ts`](../src/lib/security/session-token.ts) — ถ้า `TAROT_SESSION_SECRET` **และ** `CF_PAGES_COMMIT_SHA` ไม่ถูกตั้ง จะ fallback ไปใช้สตริงตายตัว `"tarot-sacred-altar-secret-provably-fair-2026"` |
| **ผลกระทบ** | ถ้า deploy โดยลืมตั้ง `TAROT_SESSION_SECRET` → HMAC secret กลายเป็นค่าที่ทุกคนรู้ → การันตี "ปลอมไพ่/seed ไม่ได้" ของ Provably-Fair **หายทันที** โดยไม่มีสัญญาณเตือน |
| **แนวทางแก้** | ให้ `signReadingSessionToken` (หรือจุด boot) **throw ใน production** ถ้าไม่มี secret จริง — fail loud ไม่ fallback เงียบ · dev ใช้ default ได้ |
| **เกณฑ์ว่าแก้สำเร็จ** | ตั้ง `NODE_ENV=production` โดยไม่มี `TAROT_SESSION_SECRET` แล้ว build/boot ต้อง error ทันที |
| **หมายเหตุ** | ต้องมั่นใจว่า `TAROT_SESSION_SECRET` ถูกตั้งเป็น Cloudflare secret จริงก่อน merge (`npx wrangler secret put TAROT_SESSION_SECRET`) |

### ISSUE-003 · ฐานข้อมูลไพ่เอนเอียงด้าน "ใช่" มากเกินไป ทำให้ผังใช่/ไม่ใช่ ตอบเพี้ยน

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `npm run repo:verify` เตือนทุกครั้ง: `yesNo เอียงไปด้านเดียวมาก (ใช่ 43 / ไม่ใช่ 18 / ไม่แน่ 17)` |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `tsx scripts/verify-cards.ts` ➔ `yesNo — ใช่ 43 / ไม่ใช่ 18 / ไม่แน่ 17` (ยังเท่าเดิม) |
| **ผลกระทบ** | ผัง **"ใช่หรือไม่ (ไพ่ 3 ใบ)"** มีโอกาสตอบ "ใช่" ราว 55% ทั้งที่ควรสมดุลกว่านี้ |
| **เริ่มดูตรงไหน** | ฟิลด์ `yesNo` ใน `src/data/cards/*.ts` (78 ใบ) และ `scripts/verify-cards.ts` |
| **แนวทางแก้** | ทบทวน `yesNo` ของไพ่ที่ความหมายค่อนไปทางลบ/กลาง ให้สะท้อนตำรา 1909 Rider-Waite จริง — ไม่ใช่ปรับให้ตัวเลขสวย |
| **เกณฑ์ว่าแก้สำเร็จ** | `verify-cards.ts` ไม่ขึ้นคำเตือนนี้ และการเปลี่ยนแต่ละใบมีเหตุผลอ้างอิงความหมายไพ่กำกับ |
| **ข้อควรระวัง** | ⚠️ ห้ามแก้ `structure` ของไพ่ 78 ใบ · รัน `verify-cards.ts` ทุกครั้งหลังแก้ |

---

## 🔵 ระดับ Low — ข้อจำกัดสภาพแวดล้อม / หนี้ทางเทคนิค

### ISSUE-004 · รัน Cloudflare Workers ในเครื่อง (`preview:worker` / `wrangler dev`) ไม่ได้

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `✘ [ERROR] Unsupported macOS version: ... minimum requirement is macOS 13.5.0+` (เครื่องนี้ 12.6.0) |
| **ผลกระทบ** | ทดสอบพฤติกรรมฝั่ง Worker ในเครื่องไม่ได้ ต้องรอตรวจบน production หลัง deploy |
| **สิ่งที่ยังทำได้ปกติ** | `next dev` · `npm run build:worker` (`opennextjs-cloudflare build`) — deploy ผ่าน GitHub Actions ไม่มีปัญหา |
| **ทางแก้** | อัปเกรด macOS ≥ 13.5 หรือใช้ DevContainer (Linux glibc 2.35+) |
| **วิธีตรวจแทน** | `curl -D- https://tarot-web.bankjack10452.workers.dev/cards/major-00 \| grep x-opennext-cache` (คาดหวัง `HIT`) |
| **หมายเหตุ setup dev** | `.claude/launch.json` ตั้ง `runtimeExecutable` เป็น path relative `node_modules/.bin/next` ซึ่ง preview sandbox บางตัวรันไม่ได้ (`Operation not permitted`) — ถ้าเปิด preview ไม่ขึ้น ให้สตาร์ท `next dev` เองผ่าน terminal แล้วชี้เบราว์เซอร์ไปพอร์ตนั้น |

### ISSUE-005 · GitHub native auto-merge ใช้ไม่ได้ — repo เป็น private บนบัญชีฟรี

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | หน้า Settings ช่อง **"Allow auto-merge"** เป็นสีเทากดไม่ได้ · `gh pr merge --auto` ล้มด้วย `GraphQL: Auto merge is not allowed for this repository` |
| **สาเหตุที่แท้จริง** | `luminuy/tarot-web` เป็น repo **private** บน **บัญชีส่วนตัวแพลนฟรี** — GitHub เปิด auto-merge ให้เฉพาะ repo **public** (ทุกแพลน) หรือ repo **private** บนแพลน **Pro / Team / Enterprise**<br>ยืนยัน 2026-08-31: `PATCH ... allow_auto_merge=true` → ตอบ 200 แต่ค่ายังเป็น `false` (ปฏิเสธเงียบ) |
| **ผลกระทบ** | ไม่กระทบงานจริง — `.github/workflows/pr.yml` squash-merge ให้เองหลัง CI ผ่าน แล้วลบ branch (INC-0011) · `npm run git:tidy` เก็บกวาดต่อ<br>⚠️ **automation เริ่มทำงานเมื่อ PR ถูกเปิดเท่านั้น** — push commit เฉยๆ ไม่มี PR = ไม่มีอะไร auto ต้องรัน `npm run pr:auto` เปิด PR ก่อน (draft PR ก็ถูกข้าม `pr.yml` เพราะ `if: draft == false`) |
| **ทางแก้ (ถ้าจะเปิดจริง — AI ทำเองไม่ได้)** | 1. อัปเกรด `luminuy` เป็น **GitHub Pro** (~$4/เดือน) · 2. เปลี่ยน repo เป็น **public** |
| **สรุป** | **ปล่อยไว้แบบนี้ได้** — automation ปัจจุบันครบวงจร ไม่ต้องเสียเงิน |

### ISSUE-006 · GitHub Actions เตือน Node.js 20 กำลังเลิกรองรับ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | ทุก workflow run ขึ้น annotation: `Node.js 20 is deprecated. ... actions/checkout@v4, actions/setup-node@v4` |
| **ตรวจยืนยันล่าสุด** | 2026-08-31 — `@v4` ที่ `deploy.yml` (4 จุด), `pr.yml` (2 จุด), `auto-release.yml` (1 จุด) |
| **ผลกระทบ** | ตอนนี้ยังทำงานได้ แต่จะพังเมื่อ GitHub เลิกรองรับจริง |
| **ทางแก้** | อัปเป็น `actions/checkout@v5` + `actions/setup-node@v5` ให้ครบ **ทั้ง 3 ไฟล์** แล้วดู CI ผ่านครบ 7 ด่าน |

### ISSUE-007 · Prisma ออกแบบ schema ไว้แล้วแต่ยังไม่ได้ต่อใช้จริง

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `prisma/schema.prisma` ครบแล้ว แต่ระบบยังใช้ `src/server/store.ts` (in-memory) — ข้อมูลหายทุกครั้งที่ Worker restart |
| **สาเหตุ** | Prisma 7 มี breaking change เรื่อง `datasource.url` (ต้องย้ายไป `prisma.config.ts` + เลือก adapter ก่อน) จึงตัด `prisma generate` ออกจาก build ชั่วคราว |
| **ผลกระทบ** | ประวัติดูดวงเก็บใน `localStorage` ผู้ใช้เท่านั้นตามนโยบาย PDPA — ยังไม่กระทบการใช้งาน แต่ขยายฟีเจอร์ที่ต้องใช้ DB ไม่ได้ |
| **เริ่มดูตรงไหน** | `prisma/schema.prisma`, `src/server/repositories/reading.repository.ts`, `src/server/store.ts` |
| **ข้อควรระวัง** | ⚠️ ต้องไม่ขัดกฎ PDPA — ข้อมูลผู้ใช้ห้ามเก็บถาวรบนเซิร์ฟเวอร์และห้ามนำไปเทรนโมเดล |

---

## 📌 ช่องว่างของเอกสาร (Documentation Gaps — สิ่งที่ยัง "ขาด" และ "ควรเพิ่ม")

| ช่องว่าง | ทำไมถึงต้องมี | ที่ควรอยู่ |
| :--- | :--- | :--- |
| **คู่มือตั้งเครื่อง dev (Local Setup)** | ต้องเดาเอง: pnpm/npm, env อะไรบ้าง, พอร์ตอะไร, dev server บน macOS 12 ต้องเลี่ยงอะไร | `README.md` หรือ `docs/LOCAL_SETUP.md` ใหม่ |
| **แผนที่ env var จริง** | ควรมีตารางว่าคีย์ไหนใช้ที่ไฟล์ไหน จำเป็น/ไม่จำเป็น | `docs/ARCHITECTURE.md` |
| **บันทึกเหตุผลที่ใช้ stack ล้ำเวอร์ชัน** | `react@19.2`, `next@16.3`, `motion@13` เป็นต้นเหตุ ISSUE-001 ควรมี ADR ว่าตั้งใจและรับความเสี่ยงอะไร | `docs/ARCHITECTURE.md` หรือ ADR |
| **มาตรฐานคุณภาพ INCIDENT_LOG** | INC-0008/0009/0010/0014 ช่อง "อาการ" ก็อป "การแก้ไข" มา, "สาเหตุราก" กว้างลอย — ไม่ตรงมาตรฐานคู่มือข้อ 0.2 | เพิ่มการตรวจใน `scripts/incident-log.ts` |
| **cross-link `AGENTS_TASK_PLAN.md` ↔ KNOWN_ISSUES** | มี roadmap แยกแต่ไม่อ้างถึงกัน | หัวไฟล์ทั้งสอง |
