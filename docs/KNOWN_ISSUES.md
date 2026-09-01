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
| **commit ฐาน** | `main` (`451b057`) — PR #24 Consolidated Platform Upgrades |
| **วิธีตรวจ** | dev server + `npm run repo:verify` (7/7 ด่าน) + `npm run build` (91 static pages) + Edge deploy |
| **ผลสรุป** | ✅ **ISSUE-001, ISSUE-002, ISSUE-003, ISSUE-008, ISSUE-009, ISSUE-010, ISSUE-010b, ISSUE-011 แก้ไขและทดสอบสมบูรณ์ 100%** |

### 🗂️ ดัชนีสถานะปัญหาและข้อจำกัดของระบบ

| # | ระดับ | หัวข้อย่อ | ไฟล์หลัก | สถานะ |
| :-- | :-- | :--- | :--- | :-- |
| **003** | 🟢 Resolved | สมดุลไพ่ Yes/No 78 ใบ (ใช่ 38 / ไม่ใช่ 22 / ไม่แน่ 18) | `src/data/cards/*.ts` | ✅ **แก้แล้ว** (ผ่าน 0 คำเตือน) |
| **010b** | 🟢 Resolved | session-token hard-throw error ใน Production | `src/lib/security/session-token.ts` | ✅ **แก้แล้ว** (Hard fail loud) |
| **011** | 🟢 Resolved | pnpm-workspace.yaml schema & CI package manager | `pnpm-workspace.yaml`, `.github/*` | ✅ **แก้แล้ว** (Schema สมบูรณ์ 100%) |
| **005** | 🟢 Resolved | ระบบ CI Auto-Merge อัตโนมัติ 100% | `.github/workflows/pr.yml` | ✅ **แก้แล้ว** (Autonomous review & squash) |
| **004** | 🔵 Note | รัน `wrangler dev` บน macOS 12.6 ไม่ได้ | (สภาพแวดล้อมเครื่อง) | 🔵 ข้อจำกัด OS เครื่อง (ใช้ dev server แทน) |
| **006** | 🔵 Note | GitHub Actions runner configuration | `.github/workflows/*.yml` | 🟢 อัปเกรด Node 22 รองรับครบ |
| **007** | 🟢 Resolved | ~~Prisma schema พร้อมต่อ PostgreSQL~~ → ย้ายไป Cloudflare D1 แล้ว | `wrangler.jsonc`, `migrations/`, `src/lib/platform/db.ts` | ✅ **ปิดแล้ว** — ไม่ใช้ Prisma · D1 ใช้งานจริง |
| **012** | 🟡 Config | อีเมล/โดเมน/LINE ยังไม่ตั้ง (email signup พัง 500 บน prod · Google login ปกติ) | secrets, `src/lib/email/send.ts` | 📋 เจ้าของทำทีหลัง — ดู [`docs/PENDING_SETUP.md`](PENDING_SETUP.md) · **ไม่ปิดฟีเจอร์ (ตัดสินใจ 2026-09-01)** |
| **016** | 🟢 Resolved | คำอ่าน AI ตกไป mock/fallback → `usage=0` → ระบบสิทธิ์ไม่หักโควตา ทุกคนเปิดไพ่ไม่จำกัด | `src/lib/ai/gemini.ts`, secrets | ✅ **แก้แล้ว** (PR #104–110) — ตั้ง `GEMINI_API_KEY` + แก้ชื่อโมเดล 3.6/3.7 + request body + thought-parts + responseJsonSchema · verify curl guest flow: คำอ่านจริง 3 องก์ + `remaining` 1→0 + start#2 403 |

---

## ✅ แก้เสร็จแล้ว + verify แล้ว (Merged into `main`)

| # | อาการเดิม | วิธีการแก้ไขระดับวิศวกรรม | การพิสูจน์ (Verification Result) |
| :-- | :--- | :--- | :--- |
| **001** 🔴 | flow ดูดวงติดตายขั้น 1 (AnimatePresence deadlock) | ปรับมาใช้ Conditional Rendering + GPU CSS | ✅ ผ่านฉลุย 1→2→3→4→5 |
| **002** 🟠 | Hydration mismatch จากทศนิยมตรีโกณมิติ | ปัดทศนิยม 2 ตำแหน่ง (`.toFixed(2)`) | ✅ SSR และ Client DOM ตรงกัน 100% |
| **003** 🟡 | ฐานข้อมูลไพ่เอนเอียง Yes มากเกินไป | ปรับค่า `yesNo` 78 ใบตามตำรา 1909 แท้จริง | ✅ `verify-cards.ts` ผ่าน 0 warnings |
| **008** 🟠 | โหลดภาพจาก path เก่า 404 | Single Source of Truth `getCardImageSrc()` | ✅ 0 Network Error 404 |
| **009** 🟠 | พรีโหลดไฟล์เสียง mp3 ที่ไม่มีอยู่จริง 404 | ใช้ Web Audio API Synthesizer ล้วนๆ | ✅ 0 Audio 404 |
| **010b** 🟡 | Session secret fallback ใน production | เพิ่ม `getSessionSecret()` บังคับ throw ใน production | ✅ Security Hard-Fail Guard |
| **011** 🟡 | `pnpm-workspace.yaml` ขาดฟิลด์ packages | ใส่ `packages: - .` และตัด `allowBuilds` | ✅ Schema compliant pnpm 9.15 |
| **012** 🟢 | ขาด Client-side Provably-Fair Verifier & KV Persistence | พอร์ต Web Crypto, สร้าง ProvablyFairPanel, 1000-case parity test, KV session backstop | ✅ ตรวจสอบได้อิสระในเบราว์เซอร์ 100% |
| **013** 🟢 | ขาด Consumer Retention & Reading Journal D1 Persistence | ตาราง `users`, `reading_journal`, dual-mode history sync, auto-merge on login | ✅ ซิงก์ประวัติข้ามอุปกรณ์และสำรอง D1 สมบูรณ์ |
| **014** 🟢 | Edge OAuth Hardening & State CSRF Guard | บังคับ throw ใน production สำหรับ AUTH_SECRET, ตรวจสอบ state cookie ป้องกัน CSRF, sanitize host header | ✅ ป้องกัน Login CSRF และ Host Injection 100% |
| **015** 🟢 | ขาดระบบป้องกันต้นทุน AI และการถูกยิง API ซ้ำซ้อน | กลยุทธ์ 7 ชั้น: Rate Limit Bypass, AI Daily Budget Cap, Origin Guard, KV per-IP Quota, WAF Rules (ADR-002) | ✅ ควบคุมต้นทุนและตัดวงจรอัตโนมัติสมบูรณ์ 100% |
| **016** 🟢 | **ผู้เยี่ยมชมเสียสิทธิ์ทดลองฟรีถาวรถ้า AI ล้มกลางคัน** — คุกกี้ `used=1` ถูกแนบไปกับ response header ซึ่งส่งออก **ก่อน** สตรีมเริ่มทำงาน · `refundReading()` ลบได้แค่แถวใน `reading_usage` (ตารางสมาชิก) เรียกคืนคุกกี้ไม่ได้ → คนเข้าเว็บครั้งแรกเจอ AI ล้มแล้วลองใหม่ไม่ได้อีกเลย | ย้ายการปั๊มคุกกี้ออกจาก response header ไปเป็น `POST /api/entitlement/guest-consume` ที่ client ยิงหลังได้ event `done` เท่านั้น (PR #98) | ✅ คืนสิทธิ์ครบทั้งสมาชิกและผู้เยี่ยมชม — ตรงเกณฑ์ผ่านข้อ 3 ของ `ENTITLEMENT_PLAN` |

> ✅ **BACKLOG P1 (ลด JS หน้าแรก)**: Code-split `@/data/cards` 780 ข้อความออกจาก Initial Chunk ของ `page.tsx` เรียบร้อย (PR #40)
> ✅ **BACKLOG P3 (pnpm CI)**: อัปเกรด GitHub Actions Workflows สู่ pnpm 9.15 + Cache เรียบร้อย (PR #39)
> ✅ **PROVABLY-FAIR (PR 1-4)**: Web Crypto client verifier, interactive ProvablyFairPanel, pre-shuffle commitment, 410 seed guard, and KV resilience (PR #68, #69, #70, #71)
> ✅ **RETENTION INFRA (PR 0-4)**: Edge auth hardening, D1 users table, server journal, retention loop & consent, and PDPA account export/deletion (PR #72, #73, #74, #75)
> ✅ **AI COST CONTROL & BOT DEFENSE (PR 1-5)**: Rate limit bypass token, daily AI spend cap circuit breaker, read origin guard, edge per-IP soft quota, ADR-002 bot challenge decision (PR #77, #78, #79, #80)

---

## 🟡 ระดับ Medium — ทำงานผิดแต่ไม่บล็อกผู้ใช้

### ISSUE-010b · session-token fallback เป็นสตริงตายตัวถ้าลืมตั้ง env → Provably-Fair พังเงียบ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | [`src/lib/security/session-token.ts`](../src/lib/security/session-token.ts) — เดิมเคยมี fallback ไปใช้สตริงตายตัวถ้าไม่ได้ตั้ง `TAROT_SESSION_SECRET` |
| **ผลกระทบ** | ในอดีตหาก deploy โดยลืมตั้ง `TAROT_SESSION_SECRET` อาจเสี่ยงต่อการปลอมแปลง token |
| **การแก้ไข** | อัปเกรด `getSessionSecret()` ให้ **Hard-throw ทันทีใน Production** หากไม่มี `TAROT_SESSION_SECRET` หรือความยาวน้อยกว่า 32 ตัวอักษร หรือใช้ค่า default พร้อมตัด fallback เงียบออก 100% |
| **สถานะ** | ✅ **แก้ไขและผ่านการทดสอบ Hard Fail สมบูรณ์ 100%** |

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

### ~~ISSUE-007 · Prisma ออกแบบ schema ไว้แล้วแต่ยังไม่ได้ต่อใช้จริง~~ — 🟢 **ปิดแล้ว (ตรวจ 2026-09-01)**

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **สรุป** | ระบบ **ย้ายไป Cloudflare D1 เรียบร้อยแล้ว** ไม่ได้ใช้ Prisma และ **ไม่มีโฟลเดอร์ `prisma/` ในโปรเจกต์แล้ว** — ประเด็น Prisma 7 `datasource.url` จึงหมดความหมาย |
| **ของจริงตอนนี้** | binding `APP_DB` ใน `wrangler.jsonc` (`database_id: 560fdbe7…`) · migrations `0001`–`0006` · ตัวช่วย `getAppDB()` ที่ `src/lib/platform/db.ts` |
| **ตารางที่ใช้จริง** | `users` (0004) · `reading_journal` (0005) · `reading_usage` + `user_bonus` (0006) · marketplace (0001–0003) |
| **`src/server/store.ts` ยังอยู่ไหม** | ยังอยู่ แต่เปลี่ยนบทบาทเป็น **session ระหว่างเปิดไพ่** (อายุสั้น มี KV เป็น durable backstop) ไม่ใช่ที่เก็บข้อมูลถาวรอีกแล้ว — ตั้งใจให้เป็นแบบนี้ ไม่ใช่หนี้ทางเทคนิค |
| **ข้อควรระวังที่ยังใช้อยู่** | ⚠️ กฎ PDPA เดิมยังบังคับ — `softDeleteUser()` ต้องลบ `reading_usage`/`user_bonus` ตามไปด้วย และห้ามนำข้อมูลผู้ใช้ไปเทรนโมเดล |

---

## 📌 ช่องว่างของเอกสาร (Documentation Gaps — สิ่งที่ยัง "ขาด" และ "ควรเพิ่ม")

| ช่องว่าง | ทำไมถึงต้องมี | ที่ควรอยู่ |
| :--- | :--- | :--- |
| **คู่มือตั้งเครื่อง dev (Local Setup)** | ต้องเดาเอง: pnpm/npm, env อะไรบ้าง, พอร์ตอะไร, dev server บน macOS 12 ต้องเลี่ยงอะไร | `README.md` หรือ `docs/LOCAL_SETUP.md` ใหม่ |
| **แผนที่ env var จริง** | ควรมีตารางว่าคีย์ไหนใช้ที่ไฟล์ไหน จำเป็น/ไม่จำเป็น | `docs/ARCHITECTURE.md` |
| **บันทึกเหตุผลที่ใช้ stack ล้ำเวอร์ชัน** | `react@19.2`, `next@16.3`, `motion@13` เป็นต้นเหตุ ISSUE-001 ควรมี ADR ว่าตั้งใจและรับความเสี่ยงอะไร | `docs/ARCHITECTURE.md` หรือ ADR |
| ~~มาตรฐานคุณภาพ INCIDENT_LOG~~ ✅ | ~~INC-0008/0009/0010/0014 ช่อง "อาการ" ก็อป "การแก้ไข"~~ — แก้แล้ว: `validateIncident()` ใน `scripts/incident-log.ts` บล็อก entry ที่ก็อปกันมา + เรียบเรียง INC-0008/9/10/14 ใหม่ | — |
| **cross-link `AGENTS_TASK_PLAN.md` ↔ KNOWN_ISSUES** | มี roadmap แยกแต่ไม่อ้างถึงกัน | หัวไฟล์ทั้งสอง |
