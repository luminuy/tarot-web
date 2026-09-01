# 📧 แผนเพิ่ม "เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน" — handoff ให้ทีมอีกทีม

> ตอนนี้ล็อกอินได้แค่ Google + LINE OAuth (`AuthModal.tsx`) · เพิ่ม email/password auth เต็มรูปแบบ: สมัคร → ยืนยันอีเมล → เข้าสู่ระบบ → ลืมรหัสผ่าน → เปลี่ยนรหัส
> ตรวจ `origin/main` `cefc64d` แล้ว — มี `users` table (D1) + `edge-auth.ts` (HMAC session 30 วัน) + `users.repo.ts` + `/api/auth/{me,logout,[provider]}` · **ยังไม่มี:** password field, email verification, email sending
> **5 PR** · depends on: RETENTION PR 1-4 (landed #72-76) · เกี่ยวกับ `PLAN_SEQUENCING.md` (แตะ `callback/route.ts`, `users.repo.ts`, `me/route.ts`, `AuthModal.tsx`, `db.ts` inline block)

---

## 🔑 การตัดสินใจเชิงเทคนิค (อ่านก่อน)

### 1. Password hashing บน Cloudflare Workers
ไม่มี Node `bcrypt` · ทางเลือก:
| วิธี | ข้อดี | ข้อเสีย |
| :-- | :-- | :-- |
| **PBKDF2 ผ่าน `crypto.subtle`** (แนะนำ) | 0 dep, native | memory-hardness ต่ำกว่า argon2 |
| `@noble/hashes` scrypt | memory-hard, pure JS ~10KB | +1 dep |
| `hash-wasm` argon2id | ดีสุด | WASM ~40KB + async init |

**เลือก PBKDF2-HMAC-SHA256** + **server-side pepper** (`PASSWORD_PEPPER` secret) ชดเชย:
- `hashInput = HMAC-SHA256(password, PASSWORD_PEPPER)` แล้วค่อย PBKDF2
- iterations: **150,000** (⚠️ Cloudflare free plan จำกัด CPU 10ms — วัดจริงหลัง deploy; ถ้าเกินให้ลด + เพิ่มพึ่ง pepper, หรือย้าย `@noble/hashes` scrypt)
- salt 16 bytes สุ่ม · เก็บเป็น phc-string: `pbkdf2$sha256$150000$<saltB64url>$<hashB64url>` (เก็บ param ไว้ migrate อัลกอริทึมภายหลังได้)
- เทียบด้วย `crypto.subtle` + constant-time

### 2. ส่งอีเมล
**Resend** (`RESEND_API_KEY`, ฟรี 3,000/เดือน, 100/วัน) — `fetch` ธรรมดา · ต้อง verify sending domain (`noreply@tarot.luminuy.com` + SPF/DKIM/DMARC)
> MailChannels เลิกฟรีแล้ว (2024) · Cloudflare Email Routing ส่ง arbitrary ไม่ได้
ถ้า `RESEND_API_KEY` ไม่ตั้ง → dev mode `console.log` ลิงก์ (ทดสอบ local ได้โดยไม่ต้องมีอีเมลจริง)

### 3. ยืนยันอีเมลก่อนเข้าใช้ไหม
**ให้เข้าได้ทันทีหลังสมัคร** (ออก session cookie เลย) แต่โชว์ป้าย "ยืนยันอีเมล" + ปุ่มส่งซ้ำ · marketing email ส่งเฉพาะ `email_verified = 1` · ดีต่อ conversion กว่าบังคับ verify ก่อน

### 4. Account linking (อีเมลเดียวกัน ทั้ง OAuth และ password)
ใช้ตาราง `oauth_identities` แยก identity ออกจาก `users` row → 1 user มีได้หลายวิธีล็อกอิน · journal/consent ผูกกับ `user.id` เดียว (PR 4)

### 5. Session invalidation ตอนรีเซ็ตรหัส
session เป็น stateless JWT → เพิกถอนตรง ๆ ไม่ได้ · ทางแก้: `users.token_version` ใน JWT payload → bump ตอน reset → `verifyUserSession` เช็คกับ DB (memo 60s, **เฉพาะ user ที่มี password_hash**) · reset token single-use + TTL 15 นาที (PR 5)

---

## 📦 PR 1 — `email-auth-schema` : ตาราง + password lib (effort M)

### 1.1 migration `migrations/0006_email_auth.sql` (ใหม่)
```sql
-- ขยาย users สำหรับ email/password (provider เพิ่มค่า 'email')
ALTER TABLE users ADD COLUMN email_lower     TEXT;      -- normalize (lowercase+trim) สำหรับ lookup
ALTER TABLE users ADD COLUMN password_hash   TEXT;      -- phc-string; NULL = OAuth-only
ALTER TABLE users ADD COLUMN email_verified  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN token_version   INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_lower ON users(email_lower) WHERE email_lower IS NOT NULL;

CREATE TABLE IF NOT EXISTS auth_tokens (
  id          TEXT PRIMARY KEY,          -- 'at_<uuid>'
  user_id     TEXT NOT NULL REFERENCES users(id),
  kind        TEXT NOT NULL,             -- 'verify' | 'reset'
  token_hash  TEXT NOT NULL,             -- sha256(rawToken) — ไม่เก็บ raw
  expires_at  INTEGER NOT NULL,
  used_at     INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_authtok_hash ON auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_authtok_user ON auth_tokens(user_id, kind);

CREATE TABLE IF NOT EXISTS oauth_identities (
  provider         TEXT NOT NULL,        -- 'google' | 'line'
  provider_user_id TEXT NOT NULL,        -- Google sub / LINE userId
  user_id          TEXT NOT NULL REFERENCES users(id),
  created_at       INTEGER NOT NULL,
  PRIMARY KEY (provider, provider_user_id)
);
CREATE INDEX IF NOT EXISTS idx_oauthid_user ON oauth_identities(user_id);
```

> ⚠️ **db.ts shim gotcha:** `src/lib/platform/db.ts` `createLocalSQLiteDB()` ใช้ `CREATE TABLE IF NOT EXISTS` เท่านั้น ไม่มี ALTER → column ใหม่ใน `users` local ไม่เข้า · เพิ่ม helper:
> ```ts
> const safeAlter = (sql: string) => { try { db.exec(sql); } catch { /* duplicate column = ok */ } };
> safeAlter(`ALTER TABLE users ADD COLUMN email_lower TEXT`);
> safeAlter(`ALTER TABLE users ADD COLUMN password_hash TEXT`);
> // ... + CREATE TABLE auth_tokens / oauth_identities ใน block เดิม
> ```
> apply prod: `npx tsx scripts/db-migrate.ts`

### 1.2 `src/lib/auth/password.ts` (ใหม่)
```ts
const ITERATIONS = 150_000;
const KEYLEN = 32;

function pepper(pw: string): Promise<ArrayBuffer> {
  const secret = process.env.PASSWORD_PEPPER;
  if (!secret || secret.length < 24) {
    if (process.env.NODE_ENV === "production") throw new Error("[Security] PASSWORD_PEPPER (≥24) ต้องตั้งใน production");
  }
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret || "dev-pepper-xxxxxxxxxxxxxxxxxxxxxxxx"),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
    .then(k => crypto.subtle.sign("HMAC", k, new TextEncoder().encode(pw)));
}

export async function hashPassword(pw: string): Promise<string> {
  const peppered = await pepper(pw);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMat = await crypto.subtle.importKey("raw", peppered, "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" }, keyMat, KEYLEN * 8);
  return `pbkdf2$sha256$${ITERATIONS}$${b64u(salt)}$${b64u(new Uint8Array(bits))}`;
}

export async function verifyPassword(pw: string, stored: string): Promise<boolean> {
  const [, , iterStr, saltB, hashB] = stored.split("$");
  if (!iterStr || !saltB || !hashB) return false;
  const peppered = await pepper(pw);
  const keyMat = await crypto.subtle.importKey("raw", peppered, "PBKDF2", false, ["deriveBits"]);
  const bits = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: unb64u(saltB), iterations: Number(iterStr), hash: "SHA-256" }, keyMat, KEYLEN * 8));
  return timingSafeEqualBytes(bits, unb64u(hashB));
}
// + b64u / unb64u / timingSafeEqualBytes helpers
```

### 1.3 `src/lib/users/users.repo.ts` — เพิ่มฟังก์ชัน
```ts
export function normalizeEmail(e: string): string { return e.trim().toLowerCase(); }

export async function getUserByEmail(emailLower: string): Promise<AppUser | null>;   // WHERE email_lower=? AND deleted_at IS NULL
export async function createEmailUser(p: { email: string; name: string; passwordHash: string }): Promise<AppUser>;
  //  id = `email_${crypto.randomUUID().replace(/-/g,"").slice(0,20)}`, provider='email', email_verified=0
export async function setPasswordHash(userId: string, hash: string): Promise<void>;  // + token_version = token_version + 1
export async function markEmailVerified(userId: string): Promise<void>;
export async function getTokenVersion(userId: string): Promise<number>;

// account linking
export async function findUserIdByOAuth(provider: "google"|"line", providerUserId: string): Promise<string | null>;
export async function linkOAuthIdentity(provider: "google"|"line", providerUserId: string, userId: string): Promise<void>;
```
- ขยาย `AppUser` / `RawUserRow` / `mapRowToUser`: `provider: "google"|"line"|"email"`, `emailVerified: boolean`, `hasPassword: boolean` (`!!row.password_hash`), `tokenVersion: number`

### 1.4 secret
```bash
openssl rand -hex 32 && npx wrangler secret put PASSWORD_PEPPER
# .env.local: PASSWORD_PEPPER=<24+ chars>
```

### Acceptance PR 1
- [ ] `npx tsx scripts/db-migrate.ts` apply สำเร็จ · `wrangler d1 execute tarot-app-db --command "PRAGMA table_info(users)"` เห็น column ใหม่
- [ ] local `npm run dev` ไม่พัง (shim safeAlter) — หรือลบ `.dev-marketplace.db` แล้ว re-migrate
- [ ] unit: `scripts/qa/test-password.ts` — `verifyPassword(pw, await hashPassword(pw)) === true` · pw ผิด = false · hash 2 ครั้งได้ค่าต่างกัน (salt) · วัดเวลา hash (< CPU budget)
- [ ] typecheck ผ่าน

---

## 📦 PR 2 — `email-auth-routes` : API + ส่งอีเมล + rate limit (effort L)

### 2.1 `src/lib/email/send.ts` (ใหม่)
```ts
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "แม่หมอลูมินัย <noreply@tarot.luminuy.com>";
  if (!key) { console.log(`[email:dev] TO ${to} | ${subject}\n${html}`); return; }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}
```
+ `src/lib/email/templates.ts` — `verifyEmailHtml(link)`, `resetPasswordHtml(link)` (ธีมทอง/มู, ภาษาไทยธรรมชาติ, มี plain fallback URL)

### 2.2 `src/lib/auth/auth-tokens.repo.ts` (ใหม่)
```ts
export async function issueToken(userId: string, kind: "verify"|"reset", ttlMs: number): Promise<string>;
  // raw = base64url(32 random bytes); เก็บ sha256(raw); คืน raw
export async function consumeToken(rawToken: string, kind: "verify"|"reset"): Promise<{ userId: string } | null>;
  // หา token_hash ตรง + kind ตรง + expires_at > now + used_at IS NULL → set used_at → คืน userId
export async function invalidateUserTokens(userId: string, kind: "verify"|"reset"): Promise<void>;
```

### 2.3 KV rate limit สำหรับ auth (`src/lib/security/auth-ratelimit.ts` ใหม่ — หรือ reuse ai-budget pattern)
- `app:authrl:<action>:<key>` sliding count ผ่าน `kvGetJSON`/`kvPutJSON`, memo 15s
- login: 8 / 15 นาที ต่อ `ipHash` **และ** 8 / 15 นาที ต่อ `emailHash`
- signup: 3 / ชม. ต่อ `ipHash`
- forgot: 3 / ชม. ต่อ (`ipHash` + `emailHash`)
- resend-verify: 3 / ชม. ต่อ user
- ทุก route เช็ค `isPrivilegedTestRequest(request)` ก่อน → ข้าม (เจ้าของทดสอบ)
- `ipHash = sha256(ip + utcDay).slice(0,16)` (ไม่เก็บ IP ตรง — PDPA)

### 2.4 Routes (ทั้งหมด `runtime="nodejs"` + `isRequestAuthorizedOrigin` guard + zod body)

| route | method | logic |
| :-- | :-- | :-- |
| `/api/auth/email/signup` | POST | `{email, password, name}` → validate (email regex, pw policy §2.5) → `getUserByEmail` มีแล้ว: **ตอบ 200 generic** + `sendEmail`("มีบัญชีนี้อยู่แล้ว ลองเข้าสู่ระบบ") → ถ้าไม่มี: `createEmailUser` + `issueToken('verify', 24h)` + `sendEmail(verify link)` → **ออก session cookie เลย** (`signUserSession`) → `{ ok: true, verified: false }` |
| `/api/auth/email/login` | POST | `{email, password}` → `getUserByEmail` → ถ้าไม่มี **หรือ** ไม่มี `password_hash` **หรือ** `verifyPassword` false → **ตอบเหมือนกันหมด** `401 {error:"อีเมลหรือรหัสผ่านไม่ถูกต้อง"}` (anti-enumeration) → สำเร็จ: `touchLastSeen` + set cookie → `{ ok: true, verified: user.emailVerified }` |
| `/api/auth/email/verify` | GET `?token=` | `consumeToken('verify')` → `markEmailVerified` → redirect `/?verified=1` (+ ออก session ถ้ายังไม่มี cookie) · token ผิด/หมดอายุ → redirect `/?verify_error=expired` |
| `/api/auth/email/resend` | POST | ต้องมี session · rate limit · `issueToken('verify')` ใหม่ + ส่ง |
| `/api/auth/email/forgot` | POST | `{email}` → **ตอบ 200 generic เสมอ** `{ ok: true }` → ถ้า user มี + เป็น email provider: `invalidateUserTokens('reset')` + `issueToken('reset', 15m)` + `sendEmail(reset link)` |
| `/api/auth/email/reset` | POST | `{token, password}` → `consumeToken('reset')` → validate pw → `setPasswordHash` (bump `token_version`) → `invalidateUserTokens(userId,'reset')` → set cookie ใหม่ → `{ ok: true }` |

### 2.5 Password policy (`src/lib/auth/password-policy.ts`)
- ยาว ≥ 10, ≤ 200
- ไม่ตรงกับ email (case-insensitive) / ไม่อยู่ใน list รหัสยอดฮิต ~100 ตัว (inline array)
- ไม่ต้องบังคับ special char (NIST 2024 แนะนำเลี่ยง composition rules) — เน้นความยาว
- คืน `{ ok: boolean; reason?: string }` ภาษาไทย

### 2.6 secret / DNS
```bash
npx wrangler secret put RESEND_API_KEY
# wrangler.jsonc vars (ไม่ลับ): EMAIL_FROM, APP_ORIGIN (มีจาก PR 0 hardening แล้ว)
# DNS: SPF, DKIM (Resend ให้ค่า), DMARC p=quarantine — เขียนใน CLOUDFLARE_DEPLOYMENT_GUIDE.md
```

### Acceptance PR 2
- [ ] signup อีเมลใหม่ → ได้ cookie + อีเมล verify (dev: console) · signup อีเมลซ้ำ → 200 generic (ไม่บอกว่ามีอยู่)
- [ ] login ถูก → cookie · login ผิด (pw ผิด / ไม่มี user / OAuth-only user) → 401 ข้อความเดียวกันหมด
- [ ] คลิก verify link → `email_verified=1` · คลิกซ้ำ → error (single-use)
- [ ] forgot → เสมอ 200 · reset link ใช้ได้ครั้งเดียว, 15 นาทีหมดอายุ
- [ ] login 9 ครั้งผิดรัว → ครั้งที่ 9 ได้ 429 · `X-Tarot-Bypass` → ไม่ติด
- [ ] `scripts/qa/test-email-auth.ts` ครอบ flow ทั้งหมด

---

## 📦 PR 3 — `email-auth-ui` : AuthModal + หน้า reset (effort M)

### 3.1 `src/components/auth/AuthModal.tsx` — rebuild
- ใช้ `<Modal>` primitive (`src/components/ui/Modal.tsx`) แทน markup เอง (focus trap / Esc / scroll lock ได้ฟรี — FDN-4)
- 3 โหมด (state `mode`): `"signin"` | `"signup"` | `"forgot"`
  - **signin:** email + password (+ 👁 toggle) + "ลืมรหัสผ่าน?" + ปุ่ม "เข้าสู่ระบบ" → `POST /api/auth/email/login` → สำเร็จ `window.location.reload()` (ให้ `me` + journal sync ทำงาน)
  - **signup:** name + email + password + password strength meter (`src/lib/auth/strength.ts` — คำนวณ client-side เบา ๆ: length + character-class variety, 0-4) → `POST /api/auth/email/signup`
  - **forgot:** email → `POST /api/auth/email/forgot` → โชว์ "ถ้ามีบัญชีนี้ เราส่งลิงก์รีเซ็ตไปที่อีเมลแล้ว" เสมอ
- ใต้เส้นแบ่ง: ปุ่ม Google + LINE เดิม ("หรือดำเนินการต่อด้วย")
- error/success ผ่าน `aria-live` · ปุ่ม submit `aria-busy` ระหว่างรอ · ทุก input มี `<label htmlFor>`, `autoComplete` (`email`, `current-password`, `new-password`, `name`), `inputMode="email"`
- copy ภาษาไทยธรรมชาติ (CLAUDE.md กฎ 10)

### 3.2 หน้า `src/app/reset-password/page.tsx` (ใหม่)
- อ่าน `?token=` · form password ใหม่ + ยืนยัน + strength meter → `POST /api/auth/email/reset` → สำเร็จ redirect `/?pw_reset=1` · token หาย/ผิด → ข้อความ + ปุ่ม "ขอลิงก์ใหม่"

### 3.3 `src/components/auth/UserProfileBadge.tsx`
- label provider: เพิ่ม `email` → "บัญชีอีเมล"
- ถ้า `user.emailVerified === false` → แถบ/จุดเตือน "ยืนยันอีเมล" + ปุ่ม "ส่งอีเมลอีกครั้ง" → `POST /api/auth/email/resend`

### 3.4 `src/app/page.tsx` — handle query params
- `?verified=1` / `?pw_reset=1` → toast สำเร็จ · `?verify_error=` → toast + ปุ่มส่งซ้ำ
- (มี `?auth_success=1` / `?auth_error=` จาก OAuth อยู่แล้ว — เพิ่มเคสใหม่)

### Acceptance PR 3
- [ ] เปิด AuthModal → สลับ signin/signup/forgot ได้ · Google/LINE ยังทำงาน
- [ ] signup ในโมดัล → reload → เห็นชื่อใน `UserProfileBadge` + ป้าย "ยืนยันอีเมล"
- [ ] คลิกลิงก์ verify (จาก console dev) → กลับมาป้ายหาย
- [ ] forgot → reset link → `/reset-password` → ตั้งรหัสใหม่ → login ด้วยรหัสใหม่ได้
- [ ] keyboard เดินครบ, screen reader อ่าน error, มือถือ input ไม่ zoom (font ≥16px)

---

## 📦 PR 4 — `oauth-account-linking` + เปลี่ยนรหัส (effort M)

### 4.1 `callback/route.ts` — ผูกบัญชีตออีเมลตรงกัน
หลังได้ `profile` จาก Google/LINE:
```ts
const providerUserId = profile.id.replace(/^(google|line)_/, "");
let userId = await findUserIdByOAuth(profile.provider, providerUserId);
if (!userId && profile.email) {
  const existing = await getUserByEmail(normalizeEmail(profile.email));
  if (existing) {                       // อีเมลนี้มีบัญชีอยู่แล้ว (email หรือ OAuth อื่น) → ผูกเข้าอันเดิม
    userId = existing.id;
    await linkOAuthIdentity(profile.provider, providerUserId, userId);
    if (!existing.emailVerified) await markEmailVerified(userId); // OAuth = อีเมล verified โดยปริยาย
  }
}
if (!userId) {                          // ผู้ใช้ใหม่จริง
  const u = await upsertUserOnLogin({ id: profile.id, ... });   // เดิม
  userId = u.id;
  await linkOAuthIdentity(profile.provider, providerUserId, userId);
}
// signUserSession ด้วย userId ที่ resolve แล้ว (ไม่ใช่ profile.id ตรง ๆ อีกต่อไป)
```
> ผลลัพธ์: สมัคร email → ต่อมากด "Google" อีเมลเดียวกัน → เข้าบัญชีเดิม journal ครบ

### 4.2 signup เจออีเมลที่เป็น OAuth-only
`/api/auth/email/signup` — ถ้า `getUserByEmail` เจอ user ที่ `!hasPassword` → ส่งอีเมล "บัญชีนี้เข้าผ่าน Google/LINE — ตั้งรหัสผ่านได้จากลิงก์นี้" (`issueToken('reset')` reuse flow) แทนที่จะสร้างซ้ำ · ยังตอบ 200 generic

### 4.3 `/api/auth/email/change-password` (ต้อง login)
`{ currentPassword, newPassword }` → ถ้า user `hasPassword`: verify current · ถ้าไม่มี (OAuth user ตั้งรหัสครั้งแรก): ข้าม current · `setPasswordHash` → set cookie ใหม่ (token_version bump) · ใน `src/app/account/page.tsx` เพิ่ม section "เปลี่ยนรหัสผ่าน" / "ตั้งรหัสผ่าน" (แล้วแต่ `hasPassword`)

### Acceptance PR 4
- [ ] email signup `x@gmail.com` → logout → "เข้าด้วย Google" `x@gmail.com` → เข้าบัญชีเดิม (journal เดิมอยู่ครบ)
- [ ] Google-only user → signup ด้วยอีเมลนั้น → ได้อีเมล "ตั้งรหัสผ่าน" ไม่ใช่บัญชีซ้ำ
- [ ] change password ใน /account → login ด้วยรหัสใหม่ได้

---

## 📦 PR 5 — `email-auth-hardening-docs` (effort M)

- **Session invalidation:** `signUserSession` payload เพิ่ม `tv` (token_version) · `verifyUserSession` — ถ้า user `hasPassword`: `getTokenVersion(id)` (memo 60s) เทียบ `payload.tv` ไม่ตรง → null · reset/change-password bump → session เก่าทุกเครื่องหลุด (ภายใน 60s)
- **Account deletion cascade** (RETENTION PR 4 `DELETE /api/account`): เพิ่มลบ `auth_tokens` + `oauth_identities` ของ user · export (`GET /api/account/export`) เพิ่ม provider/emailVerified (ไม่ export hash/token)
- **PDPA / ADR:** `docs/ADR-001-marketplace-pdpa.md` — เพิ่มว่า password hash (PBKDF2+pepper, ไม่ใช่ plaintext) + email เก็บใน D1 · retention/ลบเหมือน consumer account เดิม
- `src/app/privacy/page.tsx` — เพิ่มว่ารองรับ email login, เก็บ hash ไม่เก็บรหัสจริง
- `docs/KNOWN_ISSUES.md` — ปิด "ล็อกอิน email ไม่มี" · เพิ่ม note PBKDF2 iteration + CPU budget, Resend DNS
- `docs/ARCHITECTURE.md` — auth flow diagram (email + OAuth + linking), ตาราง `auth_tokens`/`oauth_identities`
- `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md` — ขั้นตอน Resend domain + DNS + secret list ครบ
- `.env.example` — เพิ่ม `PASSWORD_PEPPER`, `RESEND_API_KEY`, `EMAIL_FROM`
- `docs/WORK_LOG.md` — ทุก PR

### Acceptance PR 5
- [ ] reset password → session บนอีกเครื่องหลุดภายใน 60s
- [ ] ลบบัญชี → `auth_tokens` + `oauth_identities` ของ user หายหมด (`wrangler d1 execute` ตรวจ)
- [ ] `.env.example` + deployment guide มี secret ครบ · privacy page ตรงพฤติกรรมจริง

---

## 📋 ลำดับ + secret

| PR | branch | secret ใหม่ | ขึ้นกับ |
| :-- | :-- | :-- | :-- |
| 1 | `email-auth-schema` | `PASSWORD_PEPPER` | RETENTION PR 1 (users table — landed) |
| 2 | `email-auth-routes` | `RESEND_API_KEY`, `EMAIL_FROM` | PR 1 |
| 3 | `email-auth-ui` | — | PR 2 + `<Modal>` primitive (มีแล้ว) |
| 4 | `oauth-account-linking` | — | PR 1, 2 |
| 5 | `email-auth-hardening-docs` | — | PR 1-4 |

**migration:** จอง `0006_email_auth.sql` (0006 ว่าง — RETENTION email_log ไม่ได้ลง) · ถ้ามีงาน DB อื่นแทรกก่อน PR 1 → ขยับเลข
**กติกา (CLAUDE.md):** `git fetch && checkout -B <branch> origin/main` · 1 PR = 1 milestone · `npm run repo:verify` ก่อน `pr:auto` · commit ผ่าน `npm run commit` · ห้าม push main · ห้ามแตะ `wrangler.jsonc` bindings (vars เพิ่มได้)
**ทดสอบ:** hash/policy/token logic ทดสอบ local ได้ · email ส่งจริ+KV rate limit + D1 ทดสอบบน production หลัง deploy (ISSUE-004) · ใช้ `RATE_LIMIT_BYPASS_TOKEN` เลี่ยงลิมิตตอนทดสอบ
**PLAN_SEQUENCING:** แตะ `callback/route.ts` (PR 4), `users.repo.ts` (PR 1), `me/route.ts` (PR 5), `AuthModal.tsx` (PR 3), `page.tsx` (PR 3), `db.ts` inline block (PR 1), `account/page.tsx` (PR 4) — ทำเป็นบล็อกต่อจาก RETENTION ก่อน UX_PERF แตะ `AuthModal`/`page.tsx`

---

## ✅ นิยาม "เสร็จ"

1. ผู้ใช้สมัคร/เข้าสู่ระบบด้วยอีเมล+รหัสผ่านได้ครบวงจร (สมัคร → ยืนยันอีเมล → เข้า → ลืมรหัส → เปลี่ยนรหัส)
2. รหัสผ่านเก็บเป็น PBKDF2+pepper hash ไม่มี plaintext · token verify/reset เก็บแค่ hash, single-use, มี TTL
3. anti-enumeration: login/forgot/signup ตอบ generic ไม่บอกว่าอีเมลมีในระบบไหม
4. rate limit ทุก auth endpoint (KV, ข้าม fleet) + `X-Tarot-Bypass` เลี่ยงได้ตอนทดสอบ
5. อีเมลเดียวกัน OAuth + password ผูกเป็นบัญชีเดียว journal/consent ไม่แตก
6. reset รหัส → เตะ session ทุกเครื่อง · ลบบัญชี → auth data หายหมด · เอกสาร/PDPA ครบ
