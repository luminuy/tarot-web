# 💸 แผนคุมต้นทุน AI + รหัสทดสอบข้าม rate limit — handoff ให้ทีม Gemini

> ปิดข้อ 4 ของ valuation: "ค่า AI ไม่มีเพดาน" · ตรวจ `origin/main` `c7a57b9` แล้ว
> **สถานะปัจจุบัน:** IP ปลอมไม่ได้แล้ว (`cf-connecting-ip` มาก่อน) ✅ · แต่ rate limit ยัง **in-memory ต่อ isolate** (`rate-limit.ts:17`, `store.ts:130`) → ไม่ hold ข้าม edge fleet · **ไม่มี global spend cap** · `/read` ไม่มี origin guard · Turnstile ถูกลบทิ้ง (ไม่มี bot challenge)
> **5 PR** · PR 1 = รหัสทดสอบ (ship ก่อน เพื่อให้เจ้าของทดสอบได้ไม่ติดลิมิตระหว่างทำ PR ที่เหลือ)

---

## 📦 PR 1 — `ratelimit-bypass` : รหัส admin/ทดสอบข้าม limit (effort S, ship ก่อนสุด)

### 1.1 secret ใหม่ `RATE_LIMIT_BYPASS_TOKEN` (แยกจาก `ADMIN_PASSWORD`)

> ทำไมไม่ reuse `ADMIN_PASSWORD`: (1) ไม่อยากให้รหัสแอดมินหลุดไปอยู่ใน curl history / CI env / โหลดเทสต์ · (2) หมุนได้อิสระ ไม่เตะ admin session · (3) scope แคบ — ยกแค่ rate limit ไม่ให้สิทธิ์ `/api/admin/*`

```bash
openssl rand -hex 32                              # สร้าง token
npx wrangler secret put RATE_LIMIT_BYPASS_TOKEN   # ตั้งบน Cloudflare
# dev: .env.local → RATE_LIMIT_BYPASS_TOKEN=<ค่าเดียวกัน หรือ 24+ ตัวอักษรใดก็ได้>
```

### 1.2 `src/lib/security/privileged.ts` (ใหม่)

```ts
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifyAdminSession } from "@/lib/auth/admin-auth";
import { recordEvent } from "@/lib/stats/record";

const MIN_BYPASS_LEN = 24;
const BYPASS_HEADER = "x-tarot-bypass";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a), bb = Buffer.from(b);
  if (ab.length !== bb.length) { timingSafeEqual(bb, bb); return false; }
  return timingSafeEqual(ab, bb);
}

export function isBypassConfigured(): boolean {
  return (process.env.RATE_LIMIT_BYPASS_TOKEN ?? "").trim().length >= MIN_BYPASS_LEN;
}

/**
 * true = "ผู้ทดสอบที่ได้รับอนุญาต" — ข้าม: rate limit ต่อ IP, concurrency, global spend cap (PR 2), origin guard
 * ไม่ข้าม: safety checkQuestion, provably-fair integrity, body-size cap, auth ของ feature อื่น
 * 2 ทางเข้า:
 *   1) cookie แอดมิน `tarot_admin` (ล็อกอินที่ /admin) — ทดสอบผ่านเบราว์เซอร์
 *   2) header `X-Tarot-Bypass: <RATE_LIMIT_BYPASS_TOKEN>` — curl / โหลดเทสต์ / CI
 * ทุกครั้งที่ใช้ → บันทึกลง stats (เห็นใน /admin) เพื่อให้ token หลุดแล้วจับได้
 */
export async function isPrivilegedTestRequest(request: Request): Promise<boolean> {
  try {
    const adminCookie = (await cookies()).get(ADMIN_COOKIE_NAME)?.value;
    if (verifyAdminSession(adminCookie)) { recordEvent("ratelimit_bypass:admin"); return true; }
  } catch { /* cookies() ใช้ไม่ได้บาง context */ }

  const provided = request.headers.get(BYPASS_HEADER) ?? "";
  const expected = (process.env.RATE_LIMIT_BYPASS_TOKEN ?? "").trim();
  if (expected.length >= MIN_BYPASS_LEN && safeEqual(provided, expected)) {
    recordEvent("ratelimit_bypass:token");
    return true;
  }
  return false;
}
```

### 1.3 wire เข้า 4 route

**`src/app/api/reading/[id]/read/route.ts`** (จุด rate limit ~บรรทัด 62):
```ts
import { isPrivilegedTestRequest } from "@/lib/security/privileged";
// ...
const privileged = await isPrivilegedTestRequest(request);

// origin guard (PR 3 จะเพิ่มถาวร — bypass ต้องผ่านด้วยเพื่อ curl ใช้ได้)
// if (!privileged && !isRequestAuthorizedOrigin(request)) return Response.json({error:"..."},{status:403});

let limit = { allowed: true, releaseConcurrency: () => {} } as ReturnType<typeof checkRateLimit>;
if (!privileged) {
  limit = checkRateLimit(`read:${clientIp}`, { maxRequests: 15, windowSeconds: 600, maxConcurrent: 1 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds, "...");
}
// ...ที่เหลือใช้ limit.releaseConcurrency() ตามเดิม (เป็น no-op ถ้า privileged)
```

**`chat/route.ts`** (`checkRateLimit(\`chat:...\`)` ~บรรทัด 166) — pattern เดียวกัน

**`start/route.ts`** + **`shuffle/route.ts`** (`checkRateLimit(\`start:...\`, 20, ...)` / `\`shuffle:...\``) — pattern เดียวกัน:
```ts
const privileged = await isPrivilegedTestRequest(request);
if (!privileged) {
  const limit = checkRateLimit(`start:${clientKeyFromRequest(request)}`, 20, 60*60*1000);
  if (!limit.allowed) return NextResponse.json({...}, { status: 429 });
}
```

### 1.4 การใช้งาน

**curl / โหลดเทสต์:**
```bash
BYPASS=<RATE_LIMIT_BYPASS_TOKEN>
curl -N -X POST "https://tarot.luminuy.com/api/reading/$ID/read" \
  -H "X-Tarot-Bypass: $BYPASS" \
  -H "Origin: https://tarot.luminuy.com" \
  -H "x-reading-token: $TOKEN"
```
**เบราว์เซอร์:** ล็อกอินที่ `https://tarot.luminuy.com/admin` ด้วย `ADMIN_PASSWORD` → cookie `tarot_admin` อายุ 8 ชม. → ใช้เว็บปกติ ทุก reading route จะข้ามลิมิตอัตโนมัติ

### 1.5 ความปลอดภัย
- ถ้า `RATE_LIMIT_BYPASS_TOKEN` ไม่ถูกตั้ง → header path ปิดสนิท (เหลือแค่ cookie แอดมิน)
- constant-time compare + length guard
- ใช้ได้ใน production (จำเป็น — ISSUE-004 ทำให้ local ทดสอบ D1/KV binding ไม่ได้) แต่ทุกครั้งถูก log → `recordEvent("ratelimit_bypass:*")` โผล่ใน `/admin` dashboard
- bypass **ไม่** ให้สิทธิ์ `/api/admin/*` (ยังต้อง `requireAdmin()` = cookie เท่านั้น)
- หมุน token: `npx wrangler secret put RATE_LIMIT_BYPASS_TOKEN` ใหม่ทับได้ทันที

### Acceptance PR 1
- [ ] ไม่ตั้ง secret → curl พร้อม header = ยังติดลิมิตปกติ (path ปิด)
- [ ] ตั้ง secret → curl + `X-Tarot-Bypass` ถูก = ยิง `/read` 50 ครั้งรวดไม่ติด 429
- [ ] `X-Tarot-Bypass` ผิด = ติดลิมิตปกติ (ไม่ leak ผ่าน error)
- [ ] ล็อกอิน `/admin` แล้วใช้เว็บ = ไม่ติดลิมิต · logout แล้ว = ติดตามเดิม
- [ ] `/admin` dashboard เห็นตัวนับ `ratelimit_bypass:admin` / `:token`
- [ ] curl `/api/admin/stats` ด้วย `X-Tarot-Bypass` (ไม่มี admin cookie) = ยัง 401 (bypass ไม่ให้สิทธิ์แอดมิน)

---

## 📦 PR 2 — `ai-spend-cap` : เพดานเรียก AI ต่อวัน (effort M) — **circuit breaker ทางการเงิน, สำคัญสุด**

### 2.1 KV counter + gate
- `src/lib/platform/kv-store.ts` `KEY` เพิ่ม: `aiCap: (day: string) => \`app:aicap:${day}\``
- `src/lib/security/ai-budget.ts` (ใหม่):
```ts
import { kvGetJSON, kvPutJSON, KEY } from "@/lib/platform/kv-store";
import { getWaitUntil } from "@/lib/platform/cf";
import { utcDay } from "@/lib/stats/record";

const DEFAULT_DAILY_CAP = 2000;                 // ปรับผ่าน env AI_DAILY_CALL_CAP
const MEMO_MS = 30_000;                         // อ่าน KV ทุก 30 วิต่อ isolate (KV eventually-consistent — ยอมรับ overshoot เล็กน้อย)
let memo: { day: string; count: number; at: number } | null = null;

function cap(): number {
  const n = Number(process.env.AI_DAILY_CALL_CAP);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_CAP;
}

/** true ถ้าวันนี้เรียก AI เกินเพดานแล้ว — เรียกก่อนเริ่ม stream Gemini */
export async function isAiCapReached(): Promise<boolean> {
  const day = utcDay();
  if (!memo || memo.day !== day || Date.now() - memo.at > MEMO_MS) {
    const raw = await kvGetJSON<{ count: number }>(KEY.aiCap(day)).catch(() => null);
    memo = { day, count: raw?.count ?? 0, at: Date.now() };
  }
  return memo.count >= cap();
}

/** เรียกหลังจุด Gemini call สำเร็จ (ใน `done` handler) — best-effort, background */
export async function recordAiCall(n = 1): Promise<void> {
  const day = utcDay();
  const waitUntil = await getWaitUntil();
  waitUntil((async () => {
    const k = KEY.aiCap(day);
    const cur = (await kvGetJSON<{ count: number }>(k).catch(() => null))?.count ?? 0;
    await kvPutJSON(k, { count: cur + n }, { expirationTtl: 60 * 60 * 48 }).catch(() => {});
    if (memo?.day === day) memo.count = cur + n;
  })());
}
```

### 2.2 gate ใน route
**`read/route.ts`** — ก่อน `updateReading(id, { status: "READING" })` / ก่อนเริ่ม `streamGeminiReading`:
```ts
import { isAiCapReached, recordAiCall } from "@/lib/security/ai-budget";
// ...
if (!privileged && !record.result && await isAiCapReached()) {
  recordEvent("ai_cap_hit");
  return Response.json(
    { error: "ระบบดูดวงมีผู้ใช้จำนวนมากในวันนี้ กรุณากลับมาใหม่พรุ่งนี้ หรือลองอีกครั้งในภายหลัง" },
    { status: 503 },
  );
}
```
- ใน `done` handler (ที่ `recordEvents(["reading_completed","ai_call:gemini",...])`) → เพิ่ม `void recordAiCall(1)`
- **`chat/route.ts`** — เช็ค `isAiCapReached()` ก่อนเรียก Gemini จริง (บรรทัด ~306); ถ้าเกิน → ตอบด้วย `generateContextualTarotChatReply` (local fallback) แทน ไม่ต้อง error (chat degrade graceful ดีกว่าปฏิเสธ)
- `record.result` มีแล้ว (อ่านซ้ำ cache) → **ไม่นับ ไม่ gate** (ฟรีอยู่แล้ว)

### 2.3 มองเห็นใน admin
- `src/lib/stats/read.ts` — เพิ่ม metric `ai_cap_hit` เข้า snapshot
- `src/components/admin/StatsDashboard.tsx` — `StatCard` ใหม่: "เรียก AI วันนี้ / เพดาน" (`view.aiCallsToday` / `AI_DAILY_CALL_CAP`) + "ถูกจำกัดเพราะเต็มโควตา" (`ai_cap_hit`)
- `src/app/api/admin/stats/route.ts` — คืน `aiCapToday: (await kvGetJSON(KEY.aiCap(utcDay())))?.count ?? 0` + `aiDailyCap: cap()`

### 2.4 env
- `.env.example` เพิ่ม `AI_DAILY_CALL_CAP=2000` (คอมเมนต์: 1 reading ≈ 2-4k token Gemini Flash ≈ $0.001 → 2000/วัน ≈ $2/วัน worst case)
- ตั้ง prod: `wrangler secret put AI_DAILY_CALL_CAP` หรือใส่ใน `wrangler.jsonc` `vars` (ไม่ลับ)

### Acceptance PR 2
- [ ] set `AI_DAILY_CALL_CAP=3` → เปิดไพ่ 3 ครั้ง (id ใหม่ทุกครั้ง) สำเร็จ · ครั้งที่ 4 = 503 graceful (ไม่ 500, ไม่ crash)
- [ ] อ่านซ้ำ id เดิม (cache) ยังได้ผลแม้ cap เต็ม
- [ ] chat หลัง cap เต็ม → ได้คำตอบ local fallback ไม่ error
- [ ] `X-Tarot-Bypass` → ข้าม cap ได้
- [ ] `/admin` เห็นตัวเลข "เรียก AI วันนี้ / เพดาน" ถูกต้อง
- [ ] วันถัดไป (เปลี่ยน `utcDay`) counter รีเซ็ต

---

## 📦 PR 3 — `read-origin-guard` + รวม limiter 2 ชุด (effort S)

- **`read/route.ts`** เพิ่ม `isRequestAuthorizedOrigin` (ตอนนี้ไม่มี — route แพงสุดกลับเปิดโล่ง):
  ```ts
  if (!privileged && !isRequestAuthorizedOrigin(request)) {
    return Response.json({ error: "ไม่อนุญาตให้เข้าถึง API จากภายนอก" }, { status: 403 });
  }
  ```
- **รวม `clientKeyFromRequest` (`store.ts:117`) ให้เหมือน `getClientIdentifier` (`rate-limit.ts:39`)** — ตอนนี้ `store.ts` fallback ใช้ `x-forwarded-for` **leftmost** (spoofable) ส่วน `rate-limit.ts` ใช้ **rightmost** · ให้ `store.ts` re-export `getClientIdentifier` จาก `rate-limit.ts` แล้วลบตัวซ้ำ (ตรวจ call site: `start`, `shuffle`, `admin/login` — เปลี่ยน import)
- **รวม `checkRateLimit` 2 signature** — `store.ts` เป็น positional `(key, limit, windowMs)`, `rate-limit.ts` เป็น options object · ย้าย `start`/`shuffle`/`admin_login` มาใช้ `rate-limit.ts` เวอร์ชันเดียว แล้วลบ `rateBuckets` + `checkRateLimit` ออกจาก `store.ts`

### Acceptance PR 3
- [ ] `curl -X POST .../read` ไม่มี `Origin`/`Referer`/bypass = 403
- [ ] flow ปกติผ่านเบราว์เซอร์ยังทำงาน (มี `Origin`)
- [ ] `store.ts` ไม่มี `checkRateLimit`/`rateBuckets`/`clientKeyFromRequest` แล้ว · typecheck ผ่าน

---

## 📦 PR 4 — `edge-ratelimit` : ลิมิตที่ hold ข้าม fleet (effort M)

> in-memory limiter ปัจจุบันเป็นแค่ "ด่านเร็ว" ต่อ isolate — เพิ่ม 2 ชั้นให้ครอบจริง

### 4.1 ชั้นนอก — Cloudflare native Rate Limiting (เจ้าของตั้ง, 0 โค้ด)
เขียนใน `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`:
- Dashboard → Security → WAF → Rate limiting rules
- rule: path เริ่มด้วย `/api/reading/` → 60 req / 1 min ต่อ IP → Block 10 min
- rule: path `/api/reading/*/read` → 20 req / 10 min ต่อ IP
- ฟรี plan ได้ 1 rule · Pro ได้มากกว่า — ถ้าฟรีให้เลือก rule `/read`

### 4.2 ชั้นกลาง — KV soft-limiter เฉพาะ `/read`
`src/lib/security/ai-budget.ts` เพิ่ม `checkPerIpReadQuota(ip)`:
- `app:ipq:read:<day>:<ipHash>` → count (TTL 24h), memo 20s ต่อ isolate
- เพดาน generous เช่น 40/วัน/IP (คนใช้จริงไม่ถึง) → เกิน = 429
- eventually-consistent → ยอม overshoot; เป้าคือกัน abuse ยืดเยื้อ ไม่ใช่ precise
- `ipHash = sha256(ip + DAY).slice(0,16)` (ไม่เก็บ IP ตรง — PDPA)

### 4.3 (optional, ถ้าโตขึ้น) Durable Object
บันทึกใน `docs/ARCHITECTURE.md` เป็น upgrade path: DO `RateLimiter` strongly-consistent · ต้องเพิ่ม binding ใน `wrangler.jsonc` (⚠️ sensitive — เคยพัง deploy #56/INC-0034 → PR แยก ทดสอบ deploy ทันที) · ทำเมื่อ native + KV soft-limit ไม่พอ

### Acceptance PR 4
- [ ] ยิง `/read` 45 ครั้งจาก IP เดียว (ผ่าน bypass ปิด) ข้าม request → ครั้งท้าย ๆ ได้ 429 แม้ isolate เปลี่ยน (ทดสอบบน production หลัง deploy — `wrangler tail` ดู)
- [ ] deployment guide มีขั้นตอน native rule ครบ

---

## 📦 PR 5 — `bot-challenge-decision` + เก็บกวาด (effort S)

- **ADR สั้น ๆ** `docs/ADR-002-bot-challenge.md`: ตัดสินใจ **ยังไม่ใส่ Turnstile กลับ** — เหตุผล: PR 2 (spend cap) ทำให้ worst case มีขอบเขต ($2-5/วัน), PR 4 กัน abuse ต่อ IP, Turnstile เพิ่ม friction กับผู้ใช้จริง · เงื่อนไขที่จะกลับมาใส่: เห็น `ai_cap_hit` บ่อย + audit log ชี้ว่าเป็น bot จริง → ใส่ Turnstile เฉพาะ `/start` (1 challenge ต่อ session ไม่ใช่ต่อ API call)
- `.env.example` — ลบ `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` (dead) · ลบ `ANTHROPIC_API_KEY` ถ้ายืนยันว่า `claude.ts` ไม่ถูกเรียก (import type อย่างเดียว)
- `docs/KNOWN_ISSUES.md` — ปิดประเด็น "rate limit in-memory" + "no spend cap" อ้าง PR 2/4 · เพิ่ม entry `RATE_LIMIT_BYPASS_TOKEN` (มีไว้ทำอะไร วิธีใช้ วิธีหมุน)
- `docs/ARCHITECTURE.md` — section "AI Cost Control" (4 ชั้น: native RL → KV per-IP → in-Worker fast check → global daily cap)
- `docs/AI_COLLABORATION_GUIDELINES.md` — เพิ่มกฎ: route ที่เรียก AI ต้องผ่าน `isAiCapReached()` + `isPrivilegedTestRequest()` เสมอ
- `docs/WORK_LOG.md` — บันทึกทุก PR

---

## 📋 ลำดับ + secret ที่ต้องตั้ง

| PR | branch | secret ใหม่ | ขึ้นกับ |
| :-- | :-- | :-- | :-- |
| 1 | `ratelimit-bypass` | `RATE_LIMIT_BYPASS_TOKEN` (`openssl rand -hex 32`) | — (ship ก่อน) |
| 2 | `ai-spend-cap` | `AI_DAILY_CALL_CAP` (var, ไม่ลับ, default 2000) | PR 1 |
| 3 | `read-origin-guard` | — | PR 1 |
| 4 | `edge-ratelimit` | — (+ เจ้าของตั้ง native RL rule) | PR 2, 3 |
| 5 | `bot-challenge-decision` | — | PR 1-4 |

**กติกา (CLAUDE.md):** `git fetch origin && git checkout -B <branch> origin/main` · 1 PR = 1 milestone · `npm run repo:verify` ก่อน `pr:auto` · commit ผ่าน `npm run commit` · ห้าม push main · ห้ามแตะ `wrangler.jsonc` เว้นแต่ PR 4 optional DO (แยก PR + ทดสอบ deploy ทันที — INC-0034)
**ทดสอบ:** ต้องทำบน production หลัง deploy (ISSUE-004 — local ไม่มี KV/D1 binding จริง) · ใช้ `RATE_LIMIT_BYPASS_TOKEN` ทดสอบ flow ปกติ + สคริปต์ยิงถี่ทดสอบลิมิต · `wrangler tail` ดู log

---

## ✅ นิยาม "เสร็จ" (ปิดข้อ 4)

1. เจ้าของทดสอบ flow เต็ม (เบราว์เซอร์ผ่าน `/admin` cookie · สคริปต์ผ่าน `X-Tarot-Bypass`) ได้ไม่ติดลิมิต — และการใช้ bypass ทุกครั้งเห็นใน `/admin`
2. มีเพดานเรียก Gemini ต่อวัน (`AI_DAILY_CALL_CAP`) — เกินแล้วตอบ 503 graceful ไม่ใช่เผา key ต่อ · worst case ต้นทุนคำนวณได้ (~$2-5/วัน)
3. `/read` มี origin guard เหมือน route อื่น
4. ลิมิตต่อ IP hold ข้าม edge fleet (Cloudflare native rule + KV soft-limiter) ไม่ใช่แค่ต่อ isolate
5. limiter เหลือ implementation เดียว · client IP identifier เหลือฟังก์ชันเดียว (ไม่มี fallback spoofable)
6. ตัดสินใจเรื่อง bot challenge ชัดเจน + เอกสารครบ · env เก่าที่ตายลบหมด
