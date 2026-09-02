# 🔮 Marketplace แม่หมอตัวจริง — เอกสารส่งต่องาน (Phase 2 Handoff)

> **เอกสารนี้เขียนไว้ให้ AI Agent หรือนักพัฒนาคนต่อไปทำ Phase 2 ต่อได้ทันทีโดยไม่ต้องเดา**
> Phase 1 (แผงแอดมิน M0–M3) เสร็จและ merge แล้ว (PR #57, #59, #60) — ดู [`docs/ADMIN_PANEL.md`](ADMIN_PANEL.md)
> แผนภาพรวมทั้งโปรเจกต์: `~/.claude/plans/breezy-percolating-llama.md` (ถ้ายังเข้าถึงได้)

**อัปเดตล่าสุด:** 2026-09-01 · โดย Claude Sonnet 5 · หลัง merge M3

---

## 0. อ่านก่อนแตะโค้ด (บังคับ)

1. [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) — ทุกความผิดพลาดที่เคยเกิด + กฎป้องกันถาวร (INC-0001..0034)
2. [`docs/KNOWN_ISSUES.md`](KNOWN_ISSUES.md) — บั๊กค้าง + ISSUE-004 (macOS 12.6 รัน wrangler dev ไม่ได้) + ISSUE-007 (ยังไม่มี DB)
3. [`docs/BACKLOG.md`](BACKLOG.md) — กติกาการทำงาน (ห้าม push main, 1 milestone = 1 PR)
4. [`docs/ADMIN_PANEL.md`](ADMIN_PANEL.md) — ระบบที่ Phase 2 จะต่อยอด
5. [`CLAUDE.md`](../CLAUDE.md) — กฎเหล็ก 13 ข้อ

### กติกาที่ agent ก่อนหน้าทำผิดซ้ำบ่อย (INC-0015/0017/0020) — **ห้ามละเมิด**
- **ห้าม `git push origin main`** — ทุก commit ผ่าน `npm run pr:auto` เท่านั้น
- **1 milestone = 1 branch = 1 PR** — ห้ามแตกกิ่งย่อยค้าง
- ก่อนเริ่มทุกครั้ง: `git fetch origin && git checkout -B <branch> origin/main` (อย่าทำงานบน base เก่า)
- commit ผ่าน `npm run commit -- --agent "<ชื่อ>" --type feat --scope marketplace --msg "..."` (ไม่ใช่ `git commit` ตรง)
- **มี AI agent อื่นทำงานคู่ขนานใน repo นี้** (เช่น PR #58 "Round 6 ux-navigation") — เจอ rebase conflict บ่อยที่ไฟล์ tooling
  (`.ai-locks.json`, `.audit-history.json`, `docs/AUDIT_LOG.md` — พวกนี้ gitignore แล้ว, ถ้า conflict ให้ `git rm` ทิ้ง)
- จบงาน: `npm run repo:verify` (ต้องผ่านทุก gate) → `npm run pr:auto -- "<title>" "<body>"` → รอ merge → `git:tidy`

---

## 1. สถานะปัจจุบัน (Phase 1 เสร็จแล้ว — ของที่ใช้ต่อได้)

### Platform layer — `src/lib/platform/`
| ไฟล์ | export | ใช้ทำอะไร |
| :-- | :-- | :-- |
| `cf.ts` | `getAppKV()`, `getWaitUntil()` | เข้าถึง Cloudflare KV binding (`NEXT_INC_CACHE_KV`) + shim ตอน dev · `getWaitUntil` สำหรับ background task |
| `kv-store.ts` | `kvGetJSON/kvPutJSON/kvDelete/kvIncr/kvListKeys`, `KEY`, `invalidateMemo` | typed JSON + isolate memo cache · key prefix `app:` |

**⚠️ ห้ามเพิ่ม `initOpenNextCloudflareForDev()` ใน `next.config.ts`** — สตาร์ท workerd ที่พังบน macOS 12.6 (ISSUE-004)
จะทำให้ `npm run dev` ใช้ไม่ได้ทั้งหมด → verify binding จริงเฉพาะบน production หลัง deploy (curl)

### Auth — `src/lib/auth/`
| ไฟล์ | export | หมายเหตุ |
| :-- | :-- | :-- |
| `admin-auth.ts` | `signAdminSession/verifyAdminSession/verifyAdminPassword/isAdminConfigured`, `ADMIN_COOKIE_NAME` | HMAC-SHA256 `node:crypto` · cookie `tarot_admin` 8 ชม. |
| `require-admin.ts` | `requireAdmin()` (คืน `NextResponse\|null`), `isAdminRequest()` | ใช้กับทุก `/api/admin/*` |
| `edge-auth.ts` | `verifyUserSession()`, `signUserSession()`, OAuth URL helpers | ระบบ login ผู้ใช้ทั่วไป (Google/LINE) · cookie `tarot_auth_session` 30 วัน · `UserProfile` **ไม่มี field role** |

**pattern การทำ session ใหม่ (reader) ให้ลอก `admin-auth.ts`:** `createHmac("sha256", secret).update(base64url(payload)).digest("base64url")` + `timingSafeEqual`

### Stats — `src/lib/stats/`
`recordEvent(metric, amount?)` / `recordEvents([...])` — buffer ระดับ isolate + flush debounce 20 วิ ผ่าน `waitUntil`
metric marketplace ที่ควรเพิ่ม: `reader_created`, `queue_ticket_created`, `queue_handed_off`, `booking_created`, `screening_passed/blocked`, `payment_succeeded/failed`

### Admin — `src/app/api/admin/{login,logout,session,stats,content}` + `src/components/admin/{StatsDashboard,ContentEditor}.tsx` + `src/app/admin/page.tsx` (client shell, แท็บ `stats`/`content`)
**เพิ่มแท็บ marketplace:** แก้ `TABS` array ใน `src/app/admin/page.tsx` + `dynamic()` import component ใหม่

### Content overrides — `src/lib/content/overrides.ts`
`getContentOverrides()` + resolver — ไม่เกี่ยวกับ marketplace โดยตรง แต่เป็น pattern ที่ดี (KV JSON doc + memo 60 วิ + deep merge)

### UI primitives — `src/components/ui/`
`Button.tsx` (variant gold/ghost/pill/outline) · `Modal.tsx` (a11y ครบ) · `Input.tsx` (`Input`, `Textarea`) · `Field.tsx` (label wrapper) · `SacredNavDropdown.tsx` (เมนู)
**ยังไม่มี:** `Select`, `Checkbox`, table component, date picker — สร้างเพิ่มใน `src/components/ui/` ถ้าจำเป็น (match design tokens ด้านล่าง)

### Design tokens (จาก `src/app/globals.css` `@theme`)
- Tailwind v4 (CSS-first, ไม่มี `tailwind.config`) · สี hex literal ใช้ตรง ๆ เยอะกว่า token
- พื้นหลัง `#05040a` · การ์ด `.altar-panel` (obsidian+gold glass) · ทอง `#e5c07b`/`#f5deaa`/`#ffd700` · ข้อความรอง `#9c93b8` · ผิดพลาด `#f0a0a0`
- heading: `.font-mystic-gold` · **สัญลักษณ์ `✦` `✨` เท่านั้น ห้าม emoji การ์ตูน** (กฎเหล็กข้อ 2)
- font: `font-sans` (Sarabun) · `font-serif-th` (Noto Serif Thai) · `font-mono`

### Verify gates (8 ด่าน — `scripts/github-auto.ts` `CHECKS` array)
agent:check · typecheck · verify-cards · test-spreads · test-safety · test-shuffle · test-image-paths · **test-overrides-safety**
→ ถ้าเพิ่ม `scripts/qa/test-*.ts` ใหม่ **ต้องเพิ่มใน `CHECKS` array ด้วย** (INC-0005)

---

## 2. Phase 2 — ภาพรวม + สิ่งที่ยังบล็อก

**เป้าหมาย:** ให้ "แม่หมอตัวจริง" (มนุษย์) มาเปิดคิวรับดูดวง โดย **AI เป็นตัวกรอง/สรุปบรีฟลูกค้า** ก่อนส่งเข้าหาแม่หมอจริง — คุยกันต่อทาง **LINE/ช่องทางภายนอก** (ไม่มีแชทในเว็บ)

### 🚧 บล็อก 2 จุด — ต้องให้เจ้าของโปรเจกต์ทำก่อน M4

**บล็อก 1 — Provision Cloudflare D1** (AI ทำเองไม่ได้ ต้องมี `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`)
```bash
npx wrangler d1 create tarot-app-db
# คัดลอก database_id ที่ได้มาใส่ wrangler.jsonc (ดูขั้นตอนใน M4)
```

**บล็อก 2 — PDPA / ADR** (marketplace เก็บ PII ลูกค้า + ส่งต่อทาง LINE ซึ่งขัดกฎเดิม "ห้ามเก็บข้อมูลผู้ใช้ถาวรบน server")
ต้องมีก่อนเขียนโค้ด M4:
- ADR ใน `docs/` (เช่น `docs/ADR-001-marketplace-pdpa.md`) — ระบุว่าเก็บอะไร, นานเท่าไหร่, ใครเข้าถึง, ฐานทางกฎหมาย (consent)
- consent gate ในหน้าจองคิว — ผู้ใช้ต้องกดยอมรับก่อนข้อมูลถูกส่งให้แม่หมอ
- แก้ [`src/app/privacy/page.tsx`](../src/app/privacy/page.tsx) เพิ่มหัวข้อ marketplace
- **data minimization**: เก็บเฉพาะที่จำเป็น (ชื่อเล่น + คำถาม + ไพ่ที่จับ) · auto-delete ticket/booking หลัง 30–90 วัน · ห้ามนำไป train model
- **ไฟเขียวจากหัวหน้าทีม** ก่อนเริ่ม

### การตัดสินใจที่เจ้าของเคาะแล้ว
| หัวข้อ | ค่า |
| :-- | :-- |
| เปิดคิว | **ทั้ง 2 แบบ** — walk-up live queue + จอง slot ล่วงหน้า |
| คุยลูกค้า↔แม่หมอ | ส่งต่อไป **LINE/ภายนอก** (เว็บแค่จับคู่ + เผยลิงก์) |
| Payment | **milestone แยกท้ายสุด (M7)** ต้องมี แต่ทำหลังสุด |
| Storage | D1 (relational) + reuse KV (config/counter) — แยกตามความเหมาะสม |

---

## 3. สถาปัตยกรรม Storage สำหรับ Phase 2

| ชั้น | เก็บอะไร | เหตุผล |
| :-- | :-- | :-- |
| **D1** (`APP_DB`, ใหม่) | readers, reader_availability, queue_tickets, bookings, ai_screening, payments, admin_audit (ย้ายจาก KV ได้) | ต้อง query/join/consistency · transactional (คิว, การจอง, เงิน) |
| **KV** (`app:` prefix, มีแล้ว) | feature flags, stat counters, config | อ่านบ่อย เขียนน้อย · eventual-consistency รับได้ |
| in-memory `src/server/store.ts` | reading state ระหว่างขั้นตอน (เดิม) | ไม่แตะ |

### วิธีเข้าถึง D1 จากโค้ด — สร้าง `src/lib/platform/db.ts` (pattern เดียวกับ `cf.ts`)
```ts
import { getCloudflareContext } from "@opennextjs/cloudflare";

export interface AppDB {
  prepare(query: string): {
    bind(...values: unknown[]): {
      first<T = unknown>(): Promise<T | null>;
      all<T = unknown>(): Promise<{ results: T[] }>;
      run(): Promise<{ success: boolean; meta: { changes: number; last_row_id: number } }>;
    };
    first<T = unknown>(): Promise<T | null>;
    all<T = unknown>(): Promise<{ results: T[] }>;
    run(): Promise<{ success: boolean }>;
  };
  batch(statements: unknown[]): Promise<unknown[]>;
}

let cached: AppDB | null = null;

export async function getAppDB(): Promise<AppDB | null> {
  if (cached) return cached;
  try {
    const ctx = await getCloudflareContext({ async: true });
    const binding = (ctx.env as Record<string, unknown>).APP_DB;
    if (binding && typeof (binding as AppDB).prepare === "function") {
      cached = binding as AppDB;
      return cached;
    }
  } catch { /* ไม่มี context (dev) */ }
  return null; // dev: return null → route ต้องจัดการ (503 "marketplace ยังไม่พร้อมใน dev")
}
```
**dev fallback:** D1 ไม่มี in-memory shim ง่าย ๆ เหมือน KV — ทางเลือก:
1. return `null` แล้ว route คืน 503 ใน dev (ง่ายสุด, marketplace UI จะโชว์ "โหมด dev ไม่รองรับ")
2. เขียน SQLite shim ด้วย `node:sqlite` (Node 22+ มี `node:sqlite` แล้ว — เครื่องนี้ Node 24) เก็บไฟล์ `.dev-marketplace.db` (gitignore)
   → ทำถ้าต้องการ dev/verify เต็มรูปแบบ · **แนะนำตัวเลือกนี้** เพราะ verify บน production ยากมาก (deploy ทุกครั้ง)

---

## 4. M4 · D1 Foundation + Reader Profiles (เสร็จสมบูรณ์ 100% ✅)

### 4.1 Provision + binding (เจ้าของทำ / AI เขียน config)
1. `npx wrangler d1 create tarot-app-db` → ได้ `database_id`
2. เพิ่มใน `wrangler.jsonc` (**เทียบกับ `node_modules/wrangler/config-schema.json` ก่อน — INC-0034**):
   ```jsonc
   "d1_databases": [
     { "binding": "APP_DB", "database_name": "tarot-app-db", "database_id": "<ที่ได้จาก create>" }
   ]
   ```
3. อย่าแตะ `kv_namespaces` เดิม · อย่าเพิ่ม `initOpenNextCloudflareForDev`
4. **verify config parse:** `npx wrangler deploy --dry-run` (ควรผ่านขั้น config, fail แค่ entry-point) + `npx opennextjs-cloudflare build` (ต้องจบด้วย "OpenNext build complete")

### 4.2 Migrations — `migrations/0001_marketplace_init.sql` + `scripts/db-migrate.ts`
```sql
-- migrations/0001_marketplace_init.sql
CREATE TABLE readers (
  id            TEXT PRIMARY KEY,           -- nanoid/uuid
  display_name  TEXT NOT NULL,
  bio           TEXT NOT NULL DEFAULT '',
  avatar_url    TEXT,
  specialties   TEXT NOT NULL DEFAULT '[]', -- JSON array ["ความรัก","การงาน"]
  line_url      TEXT NOT NULL,              -- https://line.me/ti/p/~xxxx หรือ LINE OA
  status        TEXT NOT NULL DEFAULT 'pending', -- pending|approved|suspended
  commission_pct INTEGER NOT NULL DEFAULT 20,
  session_secret TEXT NOT NULL,             -- ต่อ reader — ใช้เซ็น reader cookie
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
);
CREATE INDEX idx_readers_status ON readers(status);

CREATE TABLE admin_audit (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ts         INTEGER NOT NULL,
  actor      TEXT NOT NULL,   -- 'admin' | reader_id
  action     TEXT NOT NULL,
  detail     TEXT
);
```
`scripts/db-migrate.ts` — ห่อ `npx wrangler d1 migrations apply tarot-app-db --remote` (+ `--local` option)
เพิ่ม npm script: `"db:migrate": "tsx scripts/db-migrate.ts"`

> **หมายเหตุ:** wrangler รองรับ `migrations/` folder + `wrangler d1 migrations` อยู่แล้ว — ใช้ convention นั้น
> ตั้ง `"migrations_dir": "migrations"` ใน d1_databases entry ถ้าจำเป็น (เช็ค schema)

### 4.3 Repository layer — `src/lib/marketplace/readers.repo.ts`
```ts
import { getAppDB } from "@/lib/platform/db";
export interface Reader { id: string; displayName: string; bio: string; avatarUrl: string | null;
  specialties: string[]; lineUrl: string; status: "pending"|"approved"|"suspended";
  commissionPct: number; createdAt: number; updatedAt: number; }
// listReaders(status?), getReader(id), createReader(input), updateReader(id, patch), setStatus(id, status)
// แปลง row.specialties (TEXT) <-> string[] ด้วย JSON.parse/stringify ตรงนี้ที่เดียว
```

### 4.4 Admin API — `src/app/api/admin/readers/route.ts` (+ `[id]/route.ts`)
- ทุก handler เริ่มด้วย `const denied = await requireAdmin(); if (denied) return denied;`
- `GET` → list · `POST` → create (Zod validate, gen `id` + `session_secret` = `crypto.randomUUID()`) · `PATCH [id]` → update/approve/suspend · `recordAudit(...)` ทุกครั้ง
- ตอน create/approve คืน **secret link** ให้ reader: `https://<domain>/readers/console?token=<signed>` (เซ็นด้วย reader.session_secret — ดู M5)

### 4.5 Admin UI — `src/components/admin/ReadersManager.tsx`
- reuse `Input`/`Textarea`/`Field`/`Button` · ตาราง reader + ปุ่ม approve/suspend + form เพิ่ม
- wire เข้า `src/app/admin/page.tsx`: เพิ่ม `{ id: "readers", label: "แม่หมอ (marketplace)" }` ใน `TABS` + `dynamic()` import

### 4.6 Public — `src/app/readers/page.tsx` + `src/app/readers/[id]/page.tsx`
- list เฉพาะ `status = 'approved'` · **ต้อง dynamic (อ่าน D1 ตอน request)** — ใส่ `export const dynamic = "force-dynamic"` หรือ `revalidate`
- reader detail: โปรไฟล์ + specialties + ปุ่ม "จองคิว" (ไป M5) · **ยังไม่มีลิงก์ LINE โชว์ตรง ๆ** (เผยหลังจับคู่เท่านั้น — กัน scrape + PDPA)
- `robots.ts`: เพิ่ม disallow `/readers/console`

### 4.7 Verify M4
- `npm run repo:verify` 8/8 · `npm run build:worker` (route `/readers`, `/api/admin/readers` ต้อง build)
- ถ้าใช้ SQLite dev shim: `npm run db:migrate -- --local` → สร้าง reader ผ่าน admin UI → เห็นใน `/readers` → suspend → หาย
- ถ้าไม่มี dev shim: verify บน production หลัง deploy (curl `/api/admin/readers` พร้อม cookie)

### 4.8 Docs M4
- อัปเดต `docs/WORK_LOG.md` (changelog entry ใหม่บนสุด, ดู format จาก entry M3)
- `docs/ARCHITECTURE.md` — เพิ่ม env var table (`APP_DB` binding)
- ไฟล์นี้ (`docs/MARKETPLACE.md`) — mark M4 ✅

---

## 5. M5 · Availability + Queue (เสร็จสมบูรณ์ 100% ✅)

### 5.1 Migrations — `migrations/0002_marketplace_queue_screening.sql`
- ตาราง `reader_availability` (สลับเปิด/ปิด Live Queue และเวลาว่างล่วงหน้า)
- ตาราง `queue_tickets` (คิวรับคำปรึกษา พร้อมคำนวณตำแหน่งคิว)
- ตาราง `bookings` (รอบนัดหมายและสถานะการจอง)
- Auto-delete PDPA retention: ลบตั๋วคิวที่หมดอายุภายใน 7 วัน

### 5.2 Reader Auth — `src/lib/auth/reader-auth.ts`
- HMAC-SHA256 Token เซ็นด้วย `session_secret` ประจำตัวแม่หมอ
- Guard `requireReader()` ตรวจสอบสิทธิ์สำหรับ API และ Console

### 5.3 Reader Console — `src/app/readers/console/page.tsx`
- สลับเปิด/ปิดรับงานสด (Live Toggle)
- รายการคิวรอรับคำปรึกษา พร้อมสรุปประเด็น AI Brief ใน 5 วินาที
- ปุ่มเรียกคิว (Ready) และปุ่มส่งต่อไปยัง LINE เมื่อสนทนาเสร็จ

### 5.4 Customer Queue Room — `src/app/readers/queue/[id]/page.tsx`
- หน้าแสดงลำดับคิวและสถานะ Real-time Polling ทุก 4 วินาที
- เผยปุ่มเปิด LINE ของแม่หมอเมื่อถึงคิว (`ready` / `handed_off`)
- บล็อกคำถามอันตราย/วิกฤต พร้อมแสดงสายด่วนสุขภาพจิต 1323

---

## 6. M6 · AI Customer Pre-Screening Filter (เสร็จสมบูรณ์ 100% ✅)

### 6.1 Migration — `migrations/0002_marketplace_queue_screening.sql`
- ตาราง `ai_screening` เก็บผลการวิเคราะห์เจตนา, ระดับความด่วน, สรุปบรีฟ และผังแนะนำ

### 6.2 Screening Engine — `src/lib/marketplace/screening.ts`
- ด่าน 1: `checkQuestion()` กรองวิกฤตทำร้ายตัวเอง (Self-harm / Crisis) ➔ บล็อกทันที
- ด่าน 2: แยกหมวดหมู่คำถาม (ความรัก, การงาน, การเงิน, จิตใจ, ทั่วไป)
- ด่าน 3: สรุปบรีฟ 2-3 บรรทัด (Synthesized Brief) และเลือกผังที่เหมาะสมให้แม่หมอ

---

## 7. M7 · Payments & Revenue Ledger (เสร็จสมบูรณ์ 100% ✅)

### 7.1 Migration — `migrations/0003_marketplace_payments.sql`
- ตาราง `payments` (บันทึก charge, สถานะ `pending` ➔ `paid`, ยอดเงินเป็นจำนวนเต็มสตางค์)
- ตาราง `payouts` (บันทึกประวัติส่วนแบ่งรายได้แม่หมอและค่าคอมมิชชั่นแพลตฟอร์ม)

### 7.2 Gateway Adapter & Test Mode — `src/lib/marketplace/payment-gateway.ts`
- รองรับ Omise Payment Gateway (PromptPay / Credit Card)
- เมื่อยังไม่ได้ใส่ Secret Key ระบบจะรันในโหมด **Deterministic Test Mode Simulator** โดยอัตโนมัติ
- ระบบตรวจสอบความถูกต้องของ Webhook Signature ป้องกันการปลอมแปลง Event

### 7.3 Repository & APIs
- `src/lib/marketplace/payments.repo.ts`: จัดการ CRUD, Transition สถานะ, คำนวณส่วนแบ่งแม่หมอ
- `/api/marketplace/payments`: สร้างรายการชำระเงิน
- `/api/marketplace/payments/webhook`: รับ Webhook ยืนยันการชำระเงิน
- `/api/admin/payouts`: แผงแอดมินดูสรุปรายได้และค่าคอมมิชชั่นแพลตฟอร์ม

---

## 8. Verification Playbook

- **ตรวจความสมบูรณ์ 9 ด่าน**: `npm run repo:verify`
- **TypeScript Typecheck**: `npm run typecheck`
- **Next.js Production Build**: `npm run build`

---

## 10. Checklist สรุปสถานะโครงการ Phase 2 (Marketplace)

```
M4 D1 + Readers Directory
  [x] D1 database tarot-app-db + binding APP_DB
  [x] migrations/0001_marketplace_init.sql
  [x] src/lib/marketplace/readers.repo.ts + security projection
  [x] /api/admin/readers + /api/readers
  [x] components/admin/ReadersManager.tsx + admin tab
  [x] /readers + /readers/[id]
  [x] ADR-001 PDPA Compliance Documentation

M5 Live Queue + Reader Console
  [x] migrations/0002_marketplace_queue_screening.sql
  [x] src/lib/auth/reader-auth.ts
  [x] /readers/console + /api/marketplace/console/queue
  [x] /readers/queue/[id] + /api/marketplace/tickets/[id]
  [x] BookQueueModal + ReaderDetailClient

M6 AI Pre-Screening Engine
  [x] src/lib/marketplace/screening.ts
  [x] Safety guardrails crisis block (1323 hotline)
  [x] Intent classification + synthesized brief in 5s
  [x] Suggested spread pairing

M7 Payments & Commission Ledger
  [x] migrations/0003_marketplace_payments.sql
  [x] src/lib/marketplace/payment-gateway.ts (Omise + Test-mode simulator)
  [x] /api/marketplace/payments + /api/marketplace/payments/webhook
  [x] /api/admin/payouts + commission calculation
  [x] QA Test Suite (13/13 passing gates)
```

---

## 11. ข้อมูลเพิ่มเติมและการติดต่อ
- repo: `luminuy/tarot-web` (private) · domain: `https://tarot.luminuy.com`
- deploy: auto ผ่าน `.github/workflows/deploy.yml` เมื่อ merge เข้า main
- CI auto-merge: `.github/workflows/pr.yml`

