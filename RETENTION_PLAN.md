# 👤 แผนสร้าง Consumer Retention Infra — handoff ให้ทีม Gemini

> ปิดช่องว่างข้อ 2 ของ valuation: "ไม่มี retention infra" — login ตอนนี้ cosmetic (ไม่มี user record), journal ยัง localStorage อย่างเดียว, ไม่มี email list, reading flow ไม่รู้จัก auth
> ตรวจโค้ด `origin/main` `856d093` แล้ว — มี D1 (`APP_DB`) + edge OAuth (Google/LINE) + `UserProfileBadge`/`AuthModal` wire เข้า `page.tsx` แล้ว แต่ยังไม่มี **users table** และ callback ไม่เคย `INSERT` user
> **5 PR** · PR 0 เป็น hotfix ความปลอดภัย (ทำก่อนด่วน)

---

## 🔴 บั๊กที่เจอระหว่างตรวจ (PR 0 — hotfix ก่อนทุกอย่าง, effort S)

### PF0-1 · `edge-auth.ts` มี hardcoded secret + ไม่ throw ใน prod — คลาสเดียวกับ INC ที่เพิ่งแก้
`src/lib/auth/edge-auth.ts:11-15`
```ts
const FALLBACK_SECRET = "tarot-sacred-auth-sanctuary-secret-2026";
function getAuthSecret() {
  return process.env.TAROT_SESSION_SECRET || process.env.AUTH_SECRET || FALLBACK_SECRET;
}
```
ใครรู้ string นี้ → ปลอม `signUserSession` ได้ = auth cookie อายุ 30 วันของ user ไหนก็ได้ (ตั้ง `email`/`name`/`id` เองได้ → ปลอมเป็นคนอื่น, และถ้าต่อ PR 2 แล้ว = เข้าถึง journal คนอื่น)
**แก้:** mirror `src/lib/security/session-token.ts:22-41` เป๊ะ —
```ts
export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.TAROT_SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!secret || secret.trim().length < 32) {
      throw new Error("[Security Guard] AUTH_SECRET (≥32 chars) ต้องตั้งใน production");
    }
    return secret;
  }
  return secret || "dev-only-auth-secret-32-chars-minimum-xxxxx";
}
```
+ ตั้ง secret จริงบน Cloudflare: `npx wrangler secret put AUTH_SECRET`

### PF0-2 · OAuth `state` ไม่ถูกตรวจ — login-CSRF
`[provider]/route.ts:22` ตั้ง cookie `tarot_oauth_state` แต่ `callback/route.ts:13` อ่าน `state` จาก query แล้ว**ไม่เคยเทียบกับ cookie** → attacker ยัด code ของตัวเองให้เหยื่อล็อกอินเป็น account attacker
**แก้ใน `callback/route.ts`** (หลังบรรทัด 13):
```ts
const cookieStore = await cookies();
const expectedState = cookieStore.get("tarot_oauth_state")?.value;
if (!state || !expectedState || state !== expectedState) {
  return NextResponse.redirect(`${origin}/?auth_error=${encodeURIComponent("คำขอล็อกอินไม่ถูกต้อง (state mismatch)")}`);
}
// ...หลัง exchange สำเร็จ: response.cookies.delete("tarot_oauth_state")
```
+ `[provider]/route.ts:16` เปลี่ยน `Math.random().toString(36).slice(2,12)` → `crypto.randomUUID()`

### PF0-3 · trust `x-forwarded-host` — host header injection ใส่ `redirectUri` + redirect หลัง login
`callback/route.ts:16-18` + `[provider]/route.ts:12-14` สร้าง `origin` จาก header ที่ client ส่งได้
**แก้:** ใช้ env `APP_ORIGIN` (เช่น `https://tarot.luminuy.com`) เป็นหลัก; fallback เป็น `url.origin` เฉพาะเมื่อ host อยู่ใน allowlist (`tarot.luminuy.com`, `*.workers.dev` ของโปรเจกต์, `localhost:3000`)
```ts
const ALLOWED_HOSTS = new Set(["tarot.luminuy.com", "localhost:3000"]);
const rawHost = request.headers.get("x-forwarded-host") || new URL(request.url).host;
const host = ALLOWED_HOSTS.has(rawHost) || rawHost.endsWith(".workers.dev") ? rawHost : "tarot.luminuy.com";
const origin = process.env.APP_ORIGIN || `https://${host}`;
```

**Acceptance PR 0:** deploy → prod ไม่มี `AUTH_SECRET` = 500 loud (ไม่ใช่ silent) · login ปกติผ่าน · state mismatch = ถูก reject · `curl` ด้วย `X-Forwarded-Host: evil.com` → redirectUri ยังชี้ luminuy

---

## 📦 PR 1 — `users-table` : เก็บ identity ลง D1 ตอน login (effort M)

### 1.1 migration `migrations/0004_users.sql` (ใหม่)
```sql
CREATE TABLE IF NOT EXISTS users (
  id                TEXT PRIMARY KEY,          -- 'google_<sub>' | 'line_<userId>' (รูปแบบเดิมจาก callback)
  provider          TEXT NOT NULL,             -- 'google' | 'line'
  email             TEXT,
  name              TEXT NOT NULL,
  avatar_url        TEXT,
  locale            TEXT NOT NULL DEFAULT 'th',
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  consent_at        INTEGER,
  created_at        INTEGER NOT NULL,
  last_seen_at      INTEGER NOT NULL,
  deleted_at        INTEGER
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_consent ON users(marketing_consent, deleted_at);
```
> ⚠️ **gotcha:** `src/lib/platform/db.ts` มี inline `db.exec()` auto-migrate สำหรับ local (ดู `createLocalSQLiteDB()` ~บรรทัด 55-170) — **ต้องเพิ่ม `CREATE TABLE users ...` เดิมลงในบล็อกนั้นด้วย** ไม่งั้น local dev/test พัง
> apply prod: `npx tsx scripts/db-migrate.ts` (รัน `wrangler d1 migrations apply tarot-app-db`)

### 1.2 `src/lib/users/users.repo.ts` (ใหม่ — ตามแพทเทิร์น `src/lib/marketplace/readers.repo.ts`)
```ts
export interface AppUser {
  id: string; provider: "google" | "line"; email?: string | null;
  name: string; avatarUrl?: string | null; locale: string;
  marketingConsent: boolean; consentAt?: number | null;
  createdAt: number; lastSeenAt: number; deletedAt?: number | null;
}
export async function upsertUserOnLogin(p: {
  id: string; provider: "google"|"line"; email?: string; name: string; avatarUrl?: string;
}): Promise<AppUser>;              // INSERT ... ON CONFLICT(id) DO UPDATE SET name, avatar_url, email, last_seen_at
export async function getUserById(id: string): Promise<AppUser | null>;   // WHERE deleted_at IS NULL
export async function setMarketingConsent(id: string, consent: boolean): Promise<void>;
export async function softDeleteUser(id: string): Promise<void>;         // deleted_at = now (journal ลบใน PR 4)
export async function listConsentedUsersWithEmail(): Promise<AppUser[]>;  // สำหรับ digest (PR 3)
```

### 1.3 wire เข้า `callback/route.ts`
หลังสร้าง `profile` (บรรทัด ~101) ก่อน `signUserSession`:
```ts
await upsertUserOnLogin({
  id: profile.id, provider: profile.provider, email: profile.email, name: profile.name, avatarUrl: profile.avatar,
});
```
> ครอบ try/catch แยก — ถ้า D1 ล่ม ยังให้ login ผ่าน (session cookie ยังทำงานได้ แค่ retention feature degrade)

### 1.4 `me/route.ts` — เสริมข้อมูลจาก DB (optional, ไม่บังคับ)
คง cookie เป็น source of truth ของ identity (edge-fast) แต่เติม `marketingConsent` จาก `getUserById` เพื่อให้ UI รู้ว่าต้องขอ consent ไหม

**Acceptance PR 1:** login Google/LINE → มี row ใน `users` (ตรวจ `wrangler d1 execute tarot-app-db --command "SELECT * FROM users"`) · login ซ้ำ → `last_seen_at` อัปเดต ไม่สร้าง row ซ้ำ · local dev `npm run dev` ไม่พัง (shim migrate) · typecheck ผ่าน

---

## 📦 PR 2 — `server-journal` : ประวัติดูดวงผูกบัญชี + sync anon→account (effort L)

### 2.1 migration `migrations/0005_reading_journal.sql` (+ mirror ใน db.ts shim)
```sql
CREATE TABLE IF NOT EXISTS reading_journal (
  id                 TEXT PRIMARY KEY,          -- 'rj_<uuid>'
  user_id            TEXT NOT NULL REFERENCES users(id),
  content_hash       TEXT NOT NULL,             -- sha256(question|sorted(cardIndex:rev)) — กัน dup
  question           TEXT NOT NULL,
  nickname           TEXT,
  spread_id          TEXT NOT NULL,
  spread_name        TEXT NOT NULL,
  category           TEXT NOT NULL,
  persona_id         TEXT NOT NULL,
  persona_name       TEXT NOT NULL,
  cards_json         TEXT NOT NULL,             -- SavedCardDetail[]
  summary            TEXT NOT NULL DEFAULT '',
  advice_json        TEXT NOT NULL DEFAULT '[]',
  timing             TEXT,
  outcome            TEXT NOT NULL DEFAULT 'PENDING',
  user_note          TEXT,
  outcome_updated_at INTEGER,
  created_at         INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_rj_user_hash ON reading_journal(user_id, content_hash);
CREATE INDEX IF NOT EXISTS idx_rj_user_created ON reading_journal(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rj_pending ON reading_journal(user_id, outcome, created_at);
```

### 2.2 `src/lib/journal/journal.repo.ts` (ใหม่)
```ts
export async function listJournal(userId: string, opts?: {limit?: number; before?: number}): Promise<SavedReadingItem[]>; // cap 200
export async function insertJournal(userId: string, item: Omit<SavedReadingItem,"id"|"date">): Promise<SavedReadingItem>; // ON CONFLICT(user_id,content_hash) DO NOTHING
export async function bulkImportJournal(userId: string, items: SavedReadingItem[]): Promise<{ merged: number; skipped: number }>;
export async function updateJournalOutcome(userId: string, id: string, outcome: ReadingOutcome, note?: string): Promise<void>;
export async function deleteJournalItem(userId: string, id: string): Promise<void>;
export async function deleteAllJournal(userId: string): Promise<number>;
export async function countPendingOlderThan(userId: string, days: number): Promise<number>;
```
> `content_hash` ใช้สูตรเดียวกับ dedup เดิมใน `history.ts:61` — `sha256(question + "|" + cards.map(c=>`${c.cardIndex}:${c.isReversed?"rev":"up"}`).sort().join(","))`

### 2.3 API routes (ทั้งหมด `runtime = "nodejs"`, guard ด้วย `verifyUserSession` จาก cookie)
| route | method | ทำ |
| :-- | :-- | :-- |
| `/api/journal` | `GET` | คืน journal ของ user ปัจจุบัน · **401 ถ้า anon** (client fallback localStorage) |
| `/api/journal` | `POST` | บันทึก 1 รายการ (body = SavedReadingItem ไม่รวม id/date) · rate limit |
| `/api/journal/[id]` | `PATCH` | `{ outcome, userNote }` |
| `/api/journal/[id]` | `DELETE` | ลบรายการ |
| `/api/journal/import` | `POST` | `{ items: SavedReadingItem[] }` → `bulkImportJournal` → `{ merged, skipped }` · cap body 200 รายการ (`z.array(...).max(200)`) |
| `/api/journal` | `DELETE` | ลบทั้งหมดของ user (ใช้ใน PR 4) |
> route เดิม `/api/journal/monthly-summary` (POST รับ readings จาก client) — คงไว้ ใช้ได้ทั้ง anon/auth ไม่ต้องแตะ

### 2.4 refactor `src/lib/utils/history.ts` → dual-mode
เป้าหมาย: **ไม่เปลี่ยน signature ที่ `page.tsx:435` เรียก** (`saveReading` ยัง fire-and-forget) แต่เพิ่ม server sync เมื่อ login

- เก็บ localStorage ไว้เหมือนเดิม เป็นทั้ง (ก) store ของ anon (ข) offline cache ของ user ที่ login
- เพิ่ม module-level `let authState: "anon" | "user" | "unknown" = "unknown"` + `let cachedUserId: string | null`
  - `initJournalSync()` เรียกครั้งเดียวตอน app mount (ใน `page.tsx` useEffect) → `fetch("/api/auth/me")` → set `authState`
- `saveReading(item)`:
  1. เขียน localStorage ทันที (เดิม — sync, กัน `page.tsx` ต้อง await)
  2. ถ้า `authState === "user"` → `void fetch("/api/journal", {method:"POST", body: JSON.stringify(item)})` (fire-and-forget, retry 1 ครั้ง)
- `getReadings()` → เป็น `async getReadings()`:
  - `authState === "user"` → `GET /api/journal` (ถ้า fail → คืน localStorage cache)
  - อื่น ๆ → localStorage
  - ปรับ `ReadingHistoryModal` + `JournalHistoryDrawer` ให้ handle async + loading state
- `updateReadingOutcome` / `deleteReading` → เขียน localStorage + `PATCH`/`DELETE` server ถ้า login
- **on login merge:** เมื่อ `page.tsx` เห็น `?auth_success=1` (หรือ `me` เปลี่ยนจาก null → user):
  ```ts
  const local = getReadingsLocalRaw();          // อ่าน localStorage ตรง ๆ
  if (local.length) {
    const { merged } = await fetch("/api/journal/import", {method:"POST", body: JSON.stringify({items: local})}).then(r=>r.json());
    toast(`ซิงก์ประวัติ ${merged} รายการเข้าบัญชีแล้ว`);
  }
  // จากนั้น localStorage กลายเป็น cache — sync ทับด้วยผล GET /api/journal
  ```
- `clearAllReadings()` → ถ้า login เรียก `DELETE /api/journal` ด้วย

### 2.5 UI
- `AuthModal.tsx:52-54` โฆษณาไว้ว่า *"บันทึกประวัติการดูดวง ซิงก์ข้ามอุปกรณ์"* — PR นี้ทำให้เป็นจริง
- `ReadingHistoryModal` — badge "☁ ซิงก์แล้ว" เมื่อ login / "บันทึกในเครื่องนี้เท่านั้น — เข้าสู่ระบบเพื่อซิงก์" เมื่อ anon
- หลัง SUMMARY: การ์ดเล็ก ๆ "บันทึกไว้ในบัญชีแล้ว ✦" (login) / "เข้าสู่ระบบเพื่อไม่ให้ประวัติหาย" (anon) — nudge

**Acceptance PR 2:**
- [ ] anon เปิดไพ่ → localStorage เท่านั้น (ไม่มี network ไป `/api/journal`)
- [ ] login → เปิดไพ่ → มี row ใน `reading_journal` · เปิดอีกเครื่อง/ลบ localStorage → `GET /api/journal` คืนครบ
- [ ] anon มี 5 รายการ → login → toast "ซิงก์ 5 รายการ" · login ซ้ำ → merge 0 (dedup ด้วย content_hash)
- [ ] outcome/note อัปเดตข้ามอุปกรณ์ได้
- [ ] `scripts/qa/test-journal-sync.ts` (ตามแพทเทิร์น `scripts/qa/test-marketplace-readers.ts`) — insert/dedup/import/delete
- [ ] typecheck + `repo:verify` ผ่าน

---

## 📦 PR 3 — `retention-loop` : email list + เตือนติดตามผล (effort M)

### 3.1 Marketing consent
- **หลัง login ครั้งแรก** (ไม่ใช่ในระหว่าง OAuth redirect — ทำใน UI ง่ายกว่า): ถ้า `me.marketingConsent === false` และยังไม่เคยถาม → การ์ด one-time
  *"อยากให้เราส่งการเตือนติดตามผลคำทำนาย + บทความไพ่รายเดือนทางอีเมลไหม?"* → `[รับ] [ไม่รับ]`
- `POST /api/account/consent { marketing: boolean }` → `setMarketingConsent(userId, v)` + `consent_at`
- เก็บ flag ใน localStorage `tarot_consent_asked` กันถามซ้ำ

### 3.2 In-app re-engagement (ทำก่อน — ไม่ต้องมี email infra)
- `GET /api/journal/pending-count` → `{ count }` (`countPendingOlderThan(userId, 7)`)
- `UserProfileBadge` / `ReadingHistoryModal` — badge "ไพ่ N ใบรอคุณอัปเดตผล ✦" → เปิด modal กรองเฉพาะ `outcome === "PENDING"`
- ทำให้ loop "ดูดวง → 1 สัปดาห์ผ่านไป → กลับมาบอกว่าแม่นไหม → ดูดวงเรื่องใหม่" เห็นได้ในแอป

### 3.3 Email digest (phase 3b — ต้องมี email sending)
- เลือก provider: **MailChannels** (ฟรีบน Cloudflare Workers, ไม่ต้อง API key ถ้าตั้ง SPF/DKIM) หรือ Resend (API key, ง่ายกว่า)
- migration `0006_email_log.sql`: `email_log(id, user_id, kind, sent_at, status)` + `users` เพิ่ม `unsub_token TEXT`
- Cloudflare **Cron Trigger** (`wrangler.jsonc` `triggers.crons`) → route `/api/cron/journal-digest` (guard ด้วย secret header):
  - `listConsentedUsersWithEmail()` → filter `countPendingOlderThan(u.id, 7) > 0` และไม่ได้ส่งใน 14 วัน
  - ส่งอีเมล *"3 คำทำนายของคุณครบกำหนดติดตามผลแล้ว — มาดูกันว่าแม่นไหม"* + deep link + ลิงก์ unsubscribe (`/api/account/unsub?token=`)
- **PDPA:** ส่งเฉพาะ `marketing_consent = 1` · ทุกอีเมลมี unsubscribe 1-click · log การส่ง

**Acceptance PR 3:** consent card โผล่ครั้งเดียว · badge pending count ถูกต้อง · (3b) cron ส่ง digest ให้เฉพาะ consented + มี pending · unsubscribe ทำงาน

---

## 📦 PR 4 — `account-pdpa` : ลบบัญชี + export + เอกสาร (effort M)

### 4.1 Account management API (`runtime = "nodejs"`, guard user cookie)
| route | ทำ |
| :-- | :-- |
| `DELETE /api/account` | `deleteAllJournal(userId)` → `softDeleteUser(userId)` → clear cookie · คืน 200 |
| `GET /api/account/export` | `{ user, journal }` เป็น JSON download (PDPA data portability) |

### 4.2 UI
- `src/app/account/page.tsx` — เพิ่ม section "จัดการบัญชี" (เฉพาะ login): ปุ่ม "ดาวน์โหลดข้อมูลของฉัน" + "ลบบัญชีและข้อมูลทั้งหมด" (confirm dialog 2 ชั้น)
- `src/components/ui/DeleteAllDataButton.tsx:14` — ตอนนี้แค่ `localStorage.clear()` · ถ้า login → เรียก `DELETE /api/account` ด้วย แล้วค่อย clear + reload

### 4.3 เอกสาร
- `docs/ADR-001-marketplace-pdpa.md` — เพิ่มหัวข้อ **"3. Consumer Account & Journal (เพิ่ม 2026-09)"**:
  - เก็บอะไร: `users` (id, email, name, avatar, consent), `reading_journal` (คำถาม + ไพ่ + คำทำนาย + note)
  - ฐานทางกฎหมาย: journal = สัญญา/ประโยชน์อันชอบธรรม (ผู้ใช้ขอให้เก็บ) · email marketing = **ความยินยอม** เท่านั้น
  - Retention: journal เก็บจนผู้ใช้ลบเอง หรือบัญชีไม่ใช้งาน 24 เดือน → cron purge · consent ถอนได้ทุกเมื่อ
  - สิทธิ์เจ้าของข้อมูล: export (`/api/account/export`), ลบ (`/api/account`)
- `src/app/privacy/page.tsx` — อัปเดต: "ผู้ใช้ที่เข้าสู่ระบบ ประวัติจะถูกเก็บบนเซิร์ฟเวอร์เพื่อซิงก์ข้ามอุปกรณ์ ลบได้ตลอดเวลา" (เดิมบอก "เก็บในเครื่องเท่านั้น")
- `docs/KNOWN_ISSUES.md` — ISSUE-007 (ไม่มี DB) ปิดได้สำหรับ scope นี้ · เพิ่ม entry auth hotfix (PR 0)
- `docs/ARCHITECTURE.md` — data model + auth flow diagram
- `docs/WORK_LOG.md` — บันทึกทุก PR

**Acceptance PR 4:** ลบบัญชี → `users.deleted_at` set + `reading_journal` ว่าง + cookie หาย + `me` คืน null · export ได้ JSON ครบ · privacy page ตรงกับพฤติกรรมจริง

---

## 📋 ลำดับ + dependency

| PR | branch | ขึ้นกับ | effort |
| :-- | :-- | :-- | :-- |
| 0 | `auth-hardening` | — (ship ก่อนด่วน) | S |
| 1 | `users-table` | PR 0 | M |
| 2 | `server-journal` | PR 1 | L |
| 3 | `retention-loop` | PR 1 + 2 | M (3b optional) |
| 4 | `account-pdpa` | PR 1 + 2 | M |

**กติกา (CLAUDE.md):** `git fetch origin && git checkout -B <branch> origin/main` → แก้ → `npm run repo:verify` → `npm run pr:auto -- "<title>" "<body>"` → รอ merge → `git:tidy` · commit ผ่าน `npm run commit` · 1 PR = 1 milestone · ห้าม push main
**D1 gotcha ทุก PR ที่เพิ่มตาราง:** เพิ่ม SQL ทั้งใน `migrations/000X_*.sql` **และ** inline block ใน `src/lib/platform/db.ts` `createLocalSQLiteDB()` · apply prod ด้วย `npx tsx scripts/db-migrate.ts`
**secret ใหม่:** `AUTH_SECRET` (PR 0), `CRON_SECRET` + email provider key (PR 3b) → `npx wrangler secret put`
**ทดสอบ:** flow 5 ขั้น (anon + login) หลังทุก PR · `wrangler d1 execute tarot-app-db --command "..."` ตรวจ row จริง · ISSUE-004 — D1 binding จริงทดสอบได้แค่หลัง deploy (local ใช้ node:sqlite shim)

---

## ✅ นิยาม "เสร็จ" (ปิดข้อ 2 ของ valuation)

1. login แล้วมี user record จริงใน D1 — ระบบรู้จักผู้ใช้ข้าม session
2. ประวัติดูดวงของผู้ใช้ที่ login เก็บบนเซิร์ฟเวอร์ ซิงก์ข้ามอุปกรณ์ — ล้าง browser ไม่หาย (ตรงกับที่ `AuthModal` โฆษณา)
3. anon ที่ดูดวงไว้ → login → ประวัติเก่า merge เข้าบัญชีอัตโนมัติ
4. มี email list (consented) + loop เตือนติดตามผล → เหตุผลให้ผู้ใช้กลับมา
5. ผู้ใช้ลบบัญชี/ดาวน์โหลดข้อมูลได้เอง · เอกสาร PDPA ครอบคลุม consumer account
6. ช่องโหว่ auth (hardcoded secret, OAuth CSRF, host injection) ปิดหมด
