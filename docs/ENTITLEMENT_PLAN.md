# 🎟 ระบบสมาชิกและโควตาเปิดไพ่ — แผนลงมือสำหรับทีม Antigravity

> **สถานะ:** PR A เสร็จ (Claude Sonnet 5 · 2026-09-01) · PR B–F ยังไม่เริ่ม
> **ฐานอ้างอิง:** commit `2de3e8d` (PR A rebase บน main หลัง #86)
> **ขนาดงาน:** 6 PR
> **ธงเปิดใช้:** `entitlement.enabled` (KV) — ยังปิด

เอกสารนี้คือแผนลงมือแบบละเอียด — มี SQL, โค้ดจริงที่เข้ากับ API ของโปรเจกต์,
จุดแทรกในแต่ละ route และเช็กลิสต์ราย PR

> ⚠️ ก่อนเริ่มให้อ่าน [`docs/BACKLOG.md`](BACKLOG.md) หัวข้อกติกาการทำงาน และ
> [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) ตามกฎโปรเจกต์ · commit ผ่าน `npm run commit` เท่านั้น

---

## 1. ข้อสรุปที่ตัดสินแล้ว

แปดข้อนี้คือคำตอบสุดท้าย ทำตามนี้ได้เลย

| # | คำถาม | ข้อสรุป |
| :-- | :--- | :--- |
| 1 | ล็อกตรงไหน | **ขั้น 1 ก่อนเริ่ม** ไม่ใช่ขั้น 5 |
| 2 | นับสัปดาห์ | **สัปดาห์ปฏิทิน เริ่มจันทร์ 00:00 เวลาไทย** |
| 3 | นับสิทธิ์ผู้เยี่ยมชม | **คุกกี้ httpOnly เซ็นด้วย `AUTH_SECRET` + โควตาต่อ IP เป็นตาข่ายรอง** |
| 4 | การคุยต่อกับแม่หมอ | **สมาชิกเท่านั้น และไม่กินโควตาเปิดไพ่** |
| 5 | 3 ครั้งน้อยไปวันแรก | **แถมโบนัสสมัครใหม่ 3 ครั้ง ไม่มีวันหมดอายุ** |
| 6 | ชนเพดานค่า AI รายวัน | **เพดานสองชั้น — ผู้เยี่ยมชมตัดที่ 70% สมาชิกใช้ได้ถึง 100%** |
| 7 | ผู้ใช้เดิมที่เคยใช้ไม่จำกัด | **โบนัสเปลี่ยนผ่าน 10 ครั้ง + ประกาศล่วงหน้า 7 วัน** |
| 8 | วิธีเปิดใช้ | **ซ่อนหลังธง `entitlement.enabled` บน KV เปิดปิดได้โดยไม่ต้อง deploy** |

### เหตุผลของข้อที่อาจถูกตั้งคำถาม

**ข้อ 1 — ทำไมล็อกขั้น 1 ไม่ใช่ขั้น 5**
โจทย์เดิมบอกว่า "ปิดฟังก์ชันหน้าที่ 5" ซึ่งแปลว่าปล่อยให้ผู้ใช้เดินครบขั้น 1–4
(เลือกผัง ตั้งจิต สับไพ่ จับไพ่ทีละใบ) แล้วค่อยบล็อกตอนจะอ่านคำทำนาย
การปล่อยให้คนลงแรงจับไพ่ 3–10 ใบแล้วเจอกำแพงตอนท้ายคือประสบการณ์ที่แย่ที่สุดแบบหนึ่ง
คนจะรู้สึกโดนหลอกให้เสียเวลา และมักตอบสนองด้วยการปิดเว็บ ไม่ใช่การสมัคร
**ผู้เยี่ยมชมยังได้เปิดไพ่ครบทั้ง 5 ขั้นจริง 1 ครั้ง รวมถึงอ่านคำทำนายเต็ม** ตามเจตนาเดิม
แค่ครั้งที่ 2 เป็นต้นไปจึงกั้นตั้งแต่หน้าเลือกผัง

**ข้อ 2 — ทำไมไม่ใช้เลขสัปดาห์ ISO**
`2026-W01` มีกับดักคาบปี — สัปดาห์แรกของปีอาจเริ่มในเดือนธันวาคมของปีก่อน
และไลบรารีแต่ละตัวคำนวณไม่ตรงกัน การเก็บเป็นวันที่ของวันจันทร์ตรง ๆ
ให้ผลเหมือนกันทุกที่และมนุษย์อ่านออกทันทีตอนดีบัก

**ข้อ 3 — ยอมรับว่ากันไม่ได้ 100%**
ล้างคุกกี้หรือเปิดหน้าต่างไม่ระบุตัวตนก็ได้สิทธิ์ใหม่ **ไม่ต้องไล่อุด**
เป้าหมายของสิทธิ์ฟรีคือทำให้คนได้ลองแล้วอยากสมัคร ไม่ใช่ระบบป้องกันการโกง
การไล่อุดทุกช่องจะพาไปสู่ fingerprint ซึ่งขัดกับ PDPA และนโยบายที่ประกาศไว้แล้ว

**ข้อ 4 — ทำไมแชทไม่กินโควตา**
การคุยต่อคือสิ่งที่ทำให้สมาชิกรู้สึกคุ้มและกลับมาใช้
ถ้าให้มันกินโควตาเดียวกัน คนจะไม่กล้าถามต่อ ซึ่งฆ่าคุณค่าหลักของการเป็นสมาชิกทิ้ง
คุมด้วย rate limit ต่อข้อความที่มีอยู่แล้วก็พอ

---

## 2. ตารางสิทธิ์

นี่คือสเปกหลัก ทุกอย่างที่เหลือในเอกสารนี้มีไว้ทำให้ตารางนี้เป็นจริง

| สถานะผู้ใช้ | เปิดไพ่ | คำทำนาย | คุยกับแม่หมอ | บันทึกดวง | ข้ามเครื่อง |
| :--- | :-- | :-- | :-- | :-- | :-- |
| ผู้เยี่ยมชม · ยังไม่เคยใช้ | 1 ครั้ง | ✅ เต็มรูปแบบ | ❌ ต้องสมัคร | ⚠️ เครื่องนี้ | ❌ |
| ผู้เยี่ยมชม · ใช้หมดแล้ว | ❌ 0 | ⚠️ ดูของเดิม | ❌ ต้องสมัคร | ⚠️ เครื่องนี้ | ❌ |
| สมาชิกใหม่ · สัปดาห์แรก | 3 + โบนัส 3 | ✅ เต็มรูปแบบ | ✅ | ✅ | ✅ |
| สมาชิก · โควตาเหลือ | 3 ต่อสัปดาห์ | ✅ เต็มรูปแบบ | ✅ | ✅ | ✅ |
| สมาชิก · โควตาหมด | ❌ รอวันจันทร์ | ⚠️ ดูของเดิมทั้งหมด | ✅ กับดวงเดิม | ✅ | ✅ |

**ใช้ได้เสมอโดยไม่กินโควตาและไม่ต้องล็อกอิน:** สารานุกรมไพ่ 78 ใบ · คลังผัง 20 แบบ ·
หน้าเนื้อหา · นโยบายความเป็นส่วนตัว

---

## 3. ของที่มีอยู่แล้ว — อย่าสร้างซ้ำ

ระบบล็อกอินและฐานข้อมูลผู้ใช้ทำเสร็จไปแล้วใน PR #73–#80
**งานที่เหลือคือชั้น "สิทธิ์การใช้งาน" ล้วน ๆ**

| ส่วนประกอบ | สถานะ | อยู่ที่ไหน |
| :--- | :-- | :--- |
| ล็อกอิน Google + LINE | ✅ มีแล้ว | `src/app/api/auth/[provider]/` |
| เซสชันผู้ใช้ (คุกกี้เซ็น HMAC 30 วัน) | ✅ มีแล้ว | `src/lib/auth/edge-auth.ts` → `verifyUserSession()` |
| ตารางผู้ใช้บน D1 | ✅ มีแล้ว | `migrations/0004_users.sql` · `users.repo.ts` |
| หน้าต่างล็อกอิน + ป้ายโปรไฟล์ | ✅ มีแล้ว | `components/auth/AuthModal.tsx` |
| บันทึกดวงบนเซิร์ฟเวอร์ (ข้ามเครื่อง) | ✅ มีแล้ว | `migrations/0005_reading_journal.sql` |
| จำกัดอัตราต่อ IP + เพดานค่า AI รายวัน | ✅ มีแล้ว | `lib/security/ai-budget.ts` · `lib/utils/rate-limit.ts` |
| **สิทธิ์การใช้งานระดับผลิตภัณฑ์** | ⬜ ต้องสร้าง | — |
| **โควตารายสัปดาห์ของสมาชิก** | ⬜ ต้องสร้าง | — |
| **สิทธิ์ฟรีของผู้เยี่ยมชม** | ⬜ ต้องสร้าง | — |
| **หน้าชวนสมัครหลังอ่านจบ** | ⬜ ต้องสร้าง | — |

### ⚠️ อย่าสับสนระหว่างสองเรื่องนี้

`checkPerIpReadQuota()` ที่มีอยู่คือ **การกันสแปมและกันบิลบานปลาย** — ค่าประมาณเพียงพอ เก็บบน KV ได้

โควตาสมาชิกที่จะสร้างใหม่คือ **สิทธิ์ที่ผู้ใช้สมัครเพื่อให้ได้มา** — ต้องแม่นยำ ตรวจสอบย้อนหลังได้
และคืนได้เมื่อระบบพัง **ทั้งสองตัวต้องอยู่คู่กัน ห้ามยุบรวม**

---

## 4. ฐานข้อมูล

เก็บบน **D1 ไม่ใช่ KV** — KV เป็น eventually consistent ข้าม POP ทำให้ผู้ใช้ที่ยิงคำขอพร้อมกัน
จากคนละภูมิภาคอ่านค่าตัวนับเก่าได้ทั้งคู่ แล้วใช้โควตาซ้ำซ้อน (ปัญหาเดียวกับ double-spend)
D1 มี unique constraint จริงจึงบังคับ "หนึ่งการเปิดไพ่ = หักหนึ่งครั้ง" ได้ที่ระดับฐานข้อมูล

**`migrations/0006_reading_entitlement.sql`**

```sql
-- 0006: สิทธิ์การเปิดไพ่รายสัปดาห์ + โบนัส

-- หนึ่งแถว = หนึ่งการเปิดไพ่ที่หักสิทธิ์แล้ว
-- เก็บเป็นแถวต่อครั้งแทนตัวเลขนับ เพราะได้ของแถมที่จำเป็นจริง:
-- ตรวจย้อนหลังได้ว่าใครใช้อะไรเมื่อไหร่ · คืนสิทธิ์ได้ตรงรายการ · ทำสถิติได้โดยไม่ต้องเพิ่มตาราง
CREATE TABLE IF NOT EXISTS reading_usage (
  id          TEXT PRIMARY KEY,          -- 'ru_<uuid>'
  user_id     TEXT NOT NULL REFERENCES users(id),
  reading_id  TEXT NOT NULL,
  week_key    TEXT NOT NULL,             -- '2026-08-31' = วันจันทร์ต้นสัปดาห์ เวลาไทย
  source      TEXT NOT NULL,             -- 'weekly' | 'bonus'
  consumed_at INTEGER NOT NULL
);

-- หัวใจของความถูกต้อง: กดรัว รีทราย หรือเปิดสองแท็บ ก็หักได้ครั้งเดียว
CREATE UNIQUE INDEX IF NOT EXISTS idx_ru_reading ON reading_usage(reading_id);
CREATE INDEX IF NOT EXISTS idx_ru_user_week ON reading_usage(user_id, week_key, source);

-- โบนัสที่ให้เป็นก้อน ไม่ผูกกับสัปดาห์ ไม่หมดอายุ
CREATE TABLE IF NOT EXISTS user_bonus (
  user_id    TEXT PRIMARY KEY REFERENCES users(id),
  granted    INTEGER NOT NULL DEFAULT 0,
  reason     TEXT NOT NULL,              -- 'signup' | 'grandfather' | 'support'
  granted_at INTEGER NOT NULL
);
```

> 🔒 **PDPA:** ทั้งสองตารางผูกกับ `users(id)` ต้องเพิ่มการลบใน `softDeleteUser()` ที่มีอยู่แล้ว
> ไม่งั้นการลบบัญชีจะทิ้งข้อมูลค้าง — อยู่ในเช็กลิสต์ PR A

---

## 5. แกนสิทธิ์

โมดูลใหม่ `src/lib/entitlement/` เป็น **แหล่งความจริงเดียว** ห้ามคำนวณสิทธิ์ที่อื่น

### 5.1 กุญแจสัปดาห์

**`src/lib/entitlement/week.ts`**

```ts
/** ไทยเป็น UTC+7 คงที่ ไม่มี DST จึงบวกออฟเซ็ตตรง ๆ ได้อย่างปลอดภัย */
const BKK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** คืนวันที่ของวันจันทร์ต้นสัปดาห์ตามเวลาไทย เช่น '2026-08-31' */
export function weekKey(now: Date = new Date()): string {
  const bkk = new Date(now.getTime() + BKK_OFFSET_MS);
  const daysSinceMonday = (bkk.getUTCDay() + 6) % 7;  // อาทิตย์=0 → 6, จันทร์=1 → 0
  bkk.setUTCDate(bkk.getUTCDate() - daysSinceMonday);
  bkk.setUTCHours(0, 0, 0, 0);
  return bkk.toISOString().slice(0, 10);
}

/** เวลาที่โควตาจะรีเซ็ต = จันทร์ถัดไป 00:00 ไทย (ส่งให้ UI แสดง) */
export function nextResetAt(now: Date = new Date()): string {
  const monday = new Date(weekKey(now) + "T00:00:00Z");
  monday.setUTCDate(monday.getUTCDate() + 7);
  return new Date(monday.getTime() - BKK_OFFSET_MS).toISOString();
}
```

### 5.2 สัญญาของโมดูล

**`src/lib/entitlement/entitlement.ts`**

```ts
export const WEEKLY_LIMIT = 3;
export const GUEST_LIMIT = 1;
export const SIGNUP_BONUS = 3;
export const GRANDFATHER_BONUS = 10;

export type Viewer =
  | { kind: "guest"; gid: string; guestUsed: number }
  | { kind: "member"; userId: string };

export interface Entitlement {
  canStartReading: boolean;
  canChat: boolean;
  remaining: number;
  limit: number;
  weeklyRemaining: number;   // สมาชิกเท่านั้น
  bonusRemaining: number;    // สมาชิกเท่านั้น
  resetAt: string | null;
  reason?: "guest_used" | "weekly_exhausted" | "members_only";
}

export async function getEntitlement(v: Viewer): Promise<Entitlement>;

/** หักสิทธิ์ · คืน false ถ้าหักไม่ได้ (สิทธิ์หมด) */
export async function consumeReading(v: Viewer, readingId: string): Promise<boolean>;

/** คืนสิทธิ์เมื่อ AI ล้มเหลว — ต้องเรียกทุกเส้นทางที่ error */
export async function refundReading(readingId: string): Promise<void>;

export async function grantBonus(userId: string, n: number, reason: string): Promise<void>;
```

### 5.3 การหักสิทธิ์ที่กันหักซ้ำได้จริง

```ts
export async function consumeReading(v: Viewer, readingId: string) {
  if (v.kind === "guest") return v.guestUsed < GUEST_LIMIT;  // คุกกี้จัดการเอง

  const db = await getAppDB();
  const ent = await getEntitlement(v);
  if (!ent.canStartReading) return false;

  // ใช้โควตารายสัปดาห์ก่อน เก็บโบนัสไว้ให้นานที่สุด
  const source = ent.weeklyRemaining > 0 ? "weekly" : "bonus";

  try {
    await db.prepare(
      `INSERT INTO reading_usage (id, user_id, reading_id, week_key, source, consumed_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(`ru_${crypto.randomUUID()}`, v.userId, readingId, weekKey(), source, Date.now()).run();
    return true;
  } catch {
    // ชน UNIQUE(reading_id) = เคยหักไปแล้ว ถือว่าผ่าน ไม่หักซ้ำ
    return true;
  }
}
```

> ❌ **ห้ามใช้ SELECT-แล้ว-INSERT เพื่อกันหักซ้ำ** เพราะมีช่องว่างระหว่างสองคำสั่ง
> ที่คำขอพร้อมกันแทรกได้ **ต้องพึ่ง unique constraint แล้วดักที่ `catch` เท่านั้น**

---

## 6. จุดที่ต้องแก้ในแต่ละเส้นทาง

| เส้นทาง | แทรกตรงไหน | ทำอะไร |
| :--- | :--- | :--- |
| `GET /api/entitlement` 🆕 | — | คืน `Entitlement` ให้ UI ใช้แสดงผล |
| `POST /api/reading/start` | หลังตรวจ safety ก่อนสร้าง commitment | ตรวจสิทธิ์ ไม่พอตอบ `403` + `reason` · **ยังไม่หัก** |
| `POST /api/reading/[id]/read` | หลังบล็อก `record.result` ก่อน `isAiCapReached()` | **หักสิทธิ์** · คืนเมื่อ stream ล้มเหลว |
| `POST /api/reading/[id]/chat` | ต้นฟังก์ชัน หลัง origin guard | ไม่ใช่สมาชิก ตอบ `403 members_only` |
| `lib/security/ai-budget.ts` | `isAiCapReached()` | รับพารามิเตอร์ระดับผู้ใช้ ทำเพดานสองชั้น |

### 6.1 จุดแทรกใน read route

ไฟล์ `src/app/api/reading/[id]/read/route.ts` — วาง **หลัง** บรรทัดที่คืนผลเดิม
(`if (record.result) { ... return streamCached(...) }`) เพราะการอ่านซ้ำต้องไม่หักสิทธิ์

```ts
const { getViewer } = await import("@/lib/entitlement/viewer");
const { consumeReading, refundReading } = await import("@/lib/entitlement/entitlement");
const { isEntitlementEnabled } = await import("@/lib/entitlement/flag");

let consumed = false;
const viewer = await getViewer(request);

if (!privileged && (await isEntitlementEnabled())) {
  consumed = await consumeReading(viewer, id);
  if (!consumed) {
    limit.releaseConcurrency();
    recordEvent("entitlement_blocked_read");
    return Response.json(
      { error: "สิทธิ์เปิดไพ่ของคุณหมดแล้ว", reason: "weekly_exhausted" },
      { status: 403 },
    );
  }
}

// จากนั้นในทุก catch / error path ของ stream ต้องเรียกคืนสิทธิ์:
//   if (consumed) await refundReading(id);
```

> ⚠️ **เส้นทางคืนสิทธิ์ต้องครบทุกทาง** — `read/route.ts` ปัจจุบันมีจุดจบหลายทาง
> (AI error, refusal, schema ไม่ตรง, stream ถูกตัด) ถ้าพลาดทางใดทางหนึ่ง
> ผู้ใช้จะเสียสิทธิ์ฟรี ๆ **ให้ไล่ทุก branch แล้วเขียนเทสต์ครอบทุกกรณีก่อน merge**

### 6.2 เพดาน AI สองชั้น

```ts
// src/lib/security/ai-budget.ts — แก้ signature เดิม
const GUEST_CAP_RATIO = 0.7;

export async function isAiCapReached(tier: "guest" | "member" = "guest"): Promise<boolean> {
  const cap = getAiDailyCap();
  const effective = tier === "member" ? cap : Math.floor(cap * GUEST_CAP_RATIO);
  // ...อ่านตัวนับเดิมจาก KV แล้วเทียบกับ effective แทน cap
  return memo.count >= effective;
}
```

ค่าเริ่มต้น `AI_DAILY_CALL_CAP` คือ 2000 ต่อวัน แปลว่าผู้เยี่ยมชมตัดที่ 1400
เหลือ 600 กันไว้ให้สมาชิก **ก่อนเปิดใช้จริงให้คำนวณใหม่จากจำนวนสมาชิกคูณ 3 ครั้งต่อสัปดาห์**
แล้วปรับผ่าน environment variable ไม่ต้องแก้โค้ด

---

## 7. หน้าจอ

ทุกสถานะอ่านจาก `GET /api/entitlement` — **ห้ามคำนวณสิทธิ์เองฝั่งเบราว์เซอร์
การซ่อนปุ่มไม่ใช่การบังคับสิทธิ์**

| คอมโพเนนต์ | ที่อยู่ | หน้าที่ |
| :--- | :--- | :--- |
| `QuotaBadge` 🆕 | ข้าง `UserProfileBadge` บนแถบหัว | สมาชิก "เปิดได้อีก 2 ครั้ง · รีเซ็ตวันจันทร์" · ผู้เยี่ยมชม "ทดลองฟรี 1 ครั้ง" |
| `EntitlementGate` 🆕 | แทนที่ขั้น `SPREAD_SELECT` | สิทธิ์หมด — ผู้เยี่ยมชมเห็นปุ่มสมัคร สมาชิกเห็นวันรีเซ็ต |
| `PostReadingSignup` 🆕 | ท้ายขั้น `READING` | โผล่หลังสตรีมจบ **ปิดได้ ไม่ใช่ป๊อปอัปทับ** |
| `FollowUpChat` ✏️ แก้ | `components/reading/` | ผู้เยี่ยมชมเห็นช่องคุยแบบล็อก กดแล้วเปิด `AuthModal` |

### เนื้อความ

**ห้ามใช้ "คุณใช้สิทธิ์หมดแล้ว"** ซึ่งฟังเหมือนถูกลงโทษ ให้ใช้น้ำเสียงเดียวกับแม่หมอในเว็บ:

- สมาชิกโควตาหมด — *"ไพ่สำหรับสัปดาห์นี้ปิดวงแล้ว กลับมาเปิดใหม่ได้วันจันทร์"*
- ผู้เยี่ยมชมสิทธิ์หมด — *"ครั้งแรกจบแล้ว สมัครสมาชิกเพื่อเปิดไพ่ต่อสัปดาห์ละ 3 ครั้ง"*
- ช่องคุยที่ล็อก — *"สมัครสมาชิกเพื่อถามแม่หมอต่อ และเก็บดวงไว้ดูย้อนหลังได้ทุกเครื่อง"*

---

## 8. ลำดับ PR

เรียงตามลำดับพึ่งพาจริง ข้ามลำดับจะติดเพราะของยังไม่มี
หนึ่ง PR หนึ่ง branch และ `git fetch origin && git checkout -B <branch> origin/main` ก่อนเริ่มทุกครั้ง

### PR A · แกนสิทธิ์ + ตารางฐานข้อมูล ✅ เสร็จ (2026-09-01)
**ไม่ขึ้นกับใคร**

- [x] `migrations/0007_reading_entitlement.sql` ตามข้อ 4 *(เลื่อนจาก 0006 เพราะชนกับ email_auth)*
- [x] เพิ่มสองตารางเข้า local SQLite shim ใน `src/lib/platform/db.ts` *(gotcha เฉพาะ repo นี้ — dev ใช้ node:sqlite)*
- [x] `src/lib/entitlement/week.ts` — `weekKey()`, `nextResetAt()`
- [x] `src/lib/entitlement/entitlement.ts` — `getEntitlement/consumeReading/refundReading/grantBonus` + `grantSignupBonus/purgeEntitlementData`
- [x] `src/lib/entitlement/flag.ts` — `isEntitlementEnabled()` อ่านจาก `KEY.flag("entitlement.enabled")`
- [x] เพิ่มการลบ `reading_usage` + `user_bonus` ใน `softDeleteUser()`
- [x] ให้โบนัสสมัครใหม่ — แทรกใน OAuth callback (branch new-user 3,4) + email signup route *(ไม่ใช่ใน `upsertUserOnLogin` เพราะ upsert แยก insert/update ไม่ได้)*
- [x] `scripts/qa/test-entitlement.ts` (30 เคส) + register ใน CHECKS → gate ที่ 14
- [x] `npm run repo:verify` 14/14 ผ่าน

> ยังไม่ต่อกับเส้นทางใด **พฤติกรรมเว็บไม่เปลี่ยนเลยหลัง merge** *(ยกเว้น: signup เริ่มบันทึกแถวโบนัสไว้ล่วงหน้า — ไม่มีผลจนธงเปิด)*
>
> **หมายเหตุปรับจากแผน:** `user_bonus` ใช้หลายแถว + `UNIQUE(user_id, reason)` แทน 1 แถว/user
> เพื่อให้ `grantBonus` idempotent ต่อเหตุผล (signup/grandfather/support) และ audit ได้

### PR B · บังคับสิทธิ์ที่ API ✅ เสร็จ (2026-09-01)
**ต้องมี A**

- [x] `src/lib/entitlement/viewer.ts` — `getViewer(request)` อ่านเซสชันจาก `verifyUserSession()` (guest ยัง used=0 จนถึง PR C)
- [x] `app/api/entitlement/route.ts` ใหม่ — flag off → คืนสิทธิ์ "ไม่จำกัด" ให้ UI ไม่แสดง gate
- [x] `start` — เช็คสิทธิ์หลัง safety ก่อน commitment → 403 + reason (ยังไม่หัก)
- [x] `read` — หักสิทธิ์หลังบล็อกอ่านซ้ำ ก่อนเช็คเพดาน · คืนสิทธิ์ทุก failure path (error event / catch / stream cut / done ที่ token=0)
- [x] `chat` — guest + flag on → 403 `members_only`
- [x] เพดาน AI สองชั้นใน `ai-budget.ts` — `isAiCapReached(tier)` guest 70% / member 100% (default guest · call site ระบุ tier เอง · flag off = member = พฤติกรรมเดิม)
- [x] `app/api/admin/entitlement/route.ts` — GET/PUT ธง (จำเป็นสำหรับ PR F) + audit
- [x] curl: flag off = ปกติ · flag on + guest → chat 403 members_only · start 200 · GET /api/entitlement สะท้อนธง
- [x] gate 14: +2 เคส (เพดาน AI สองชั้น) → 32/32 · repo:verify 14/14 · build:worker ✓

> ธงยังปิดอยู่ตลอด PR นี้ พฤติกรรมจริงยังไม่เปลี่ยน (verify: flag off = readings/chat ปกติ)
>
> **ยังไม่ครบ e2e**: member-path (หัก/คืนจริง, สิทธิ์รายสัปดาห์หมด) พิสูจน์ด้วย unit test 32/32 —
> ต้องทดสอบ member จริงด้วย OAuth session ตอน PR D หรือบน production

### PR C · สิทธิ์ฟรีของผู้เยี่ยมชม ✅ เสร็จ (2026-09-01)
**ต้องมี A, B**

- [x] `src/lib/auth/edge-auth.ts` — เพิ่ม `signPayload()` / `verifyPayload()` (กลไก HMAC-SHA256 + secret เดิม · ไม่ได้เขียนใหม่)
- [x] `src/lib/entitlement/guest.ts` — คุกกี้ `tarot_guest` (`{ gid, used }`) · httpOnly · SameSite=Lax · Secure prod · 1 ปี
- [x] `getViewer()` อ่านคุกกี้ → `kind: "guest"` + `guestUsed`
- [x] `read` route: guest ผ่าน gate → set คุกกี้ `used=1` ใน SSE response headers (**ไม่มี refund สำหรับ guest** — best-effort ตามข้อ 3)
- [x] `app/privacy/page.tsx` — เพิ่มบรรทัดประกาศคุกกี้ `tarot_guest` (first-party, ไม่มี PII, ไม่ติดตามข้ามเว็บ)
- [x] curl e2e (flag on): fresh guest remaining=1 → reading flow → คุกกี้ set → remaining=0 reason=guest_used → start ครั้งที่ 2 = 403
- [x] gate 14 → 35/35 (+ sign/verify คุกกี้) · repo:verify 14/14 · build:worker ✓

### PR D · สถานะบนหน้าเว็บ ✅ เสร็จ (2026-09-01)
**ต้องมี B, C**

- [x] `src/components/entitlement/QuotaBadge.tsx` — ป้ายข้าง UserProfileBadge (ธงปิด → ไม่แสดง)
- [x] `src/components/entitlement/EntitlementGate.tsx` — wrap เนื้อหาขั้น SPREAD_SELECT (ธงปิด/มีสิทธิ์ → render children ปกติ)
- [x] `FollowUpChat` — ช่องแชทแบบล็อกเมื่อ `!canChat` (guest) → ปุ่มเปิด AuthModal ผ่าน event `tarot:open-auth`
- [x] `src/lib/entitlement/use-entitlement.ts` — hook + module cache (ดึง `/api/entitlement` ครั้งเดียว, `refreshEntitlement()` bust cache) *(แทน "ส่ง prop จาก page.tsx" เพื่อลดการแก้ไฟล์ page.tsx ที่เปราะ — spirit เดียวกัน: ยิงครั้งเดียว)*
- [x] `page.tsx` — `refreshEntitlement()` หลังอ่านจบ (`done`) + หลังล็อกอิน (`auth_success`) · listener `tarot:open-auth`
- [x] curl + browser (flag on): guest ใหม่ badge "ทดลองฟรี 1 ครั้ง" → ทำ reading → reload → badge "ทดลองฟรีครบแล้ว" + gate "ครั้งแรกจบแล้ว" แทนหน้าเลือกผัง · flag off → badge/gate หาย, หน้าเลือกผังปกติ (เหมือนก่อน PR D 100%)
- [x] repo:verify 14/14 · build:worker ✓ · hydration warning เดิม (motion SSR) — **มีอยู่ก่อน PR D** (ยืนยันโดย stash)

### PR E · การ์ดชวนสมัครหลังอ่านจบ ✅ เสร็จ (2026-09-01)
**ต้องมี D**

- [x] `src/components/entitlement/PostReadingSignup.tsx` — โผล่ท้ายขั้น SUMMARY (`!isStreaming`) เฉพาะ guest + ธงเปิด · ปิดได้ (localStorage 7 วัน ไม่ตื๊อ)
- [x] `POST /api/stats/event` — endpoint ให้ UI ยิง event ผ่าน **allowlist** (`signup_card_shown/clicked/dismissed`) → `recordEvent()`
- [x] ผูกดวงหลังสมัคร — ใช้กลไกเดิม `syncAnonymousHistoryToServer()` ที่ page.tsx เรียกอยู่แล้วหลัง `auth_success` (ไม่ต้องทำใหม่)
- [x] repo:verify 14/14 · build:worker ✓ · curl: allowlist metric → 200 · metric อื่น → 400
- [~] การ์ดที่ SUMMARY (visual): verify ด้วย logic + track endpoint — ไม่ได้เห็นในเบราว์เซอร์เพราะ test cookie เป็น guest ที่ใช้สิทธิ์หมดแล้ว (เริ่ม reading ใหม่ไม่ได้) · ตรวจซ้ำตอน production หรือด้วยเบราว์เซอร์คุกกี้สะอาด

### PR F · เปิดใช้งานจริง
**ต้องมี A–E · ทำหลังทดสอบบน production แล้ว**

- [ ] สคริปต์ให้โบนัสเปลี่ยนผ่าน 10 ครั้ง แก่ผู้ใช้ที่ `created_at` ก่อนวันเปิดใช้
- [ ] ประกาศบนเว็บล่วงหน้าอย่างน้อย 7 วันก่อนเปิดธง
- [ ] เปิด `entitlement.enabled` ผ่านแผงแอดมิน
- [ ] เฝ้าดู `entitlement_blocked_read` และ `ai_cap_hit` ใน 48 ชั่วโมงแรก

---

## 9. เกณฑ์ผ่าน

ทุกข้อพิสูจน์บั๊กที่เกิดขึ้นจริงได้ ไม่ใช่ทดสอบพอเป็นพิธี

| # | เกณฑ์ | วิธีทดสอบ |
| :-- | :--- | :--- |
| 1 | เลี่ยง UI ไม่ได้ | `curl` ตรงไปที่ `/read` ตอนสิทธิ์หมด ต้องได้ `403` |
| 2 | หักซ้ำไม่ได้ | ยิง `/read` ด้วย `readingId` เดิมพร้อมกัน 10 คำขอ → มีแถวใน `reading_usage` แถวเดียว |
| 3 | คืนสิทธิ์ครบทุกทาง | จำลอง AI ล้ม 4 แบบ (error, refusal, schema ผิด, stream ถูกตัด) สิทธิ์ต้องกลับมาเท่าเดิมทุกแบบ |
| 4 | สัปดาห์เปลี่ยนถูก | อาทิตย์ 23:59 กับจันทร์ 00:01 เวลาไทย → `weekKey` คนละค่า |
| 5 | ลำดับการหัก | สมาชิกใหม่ใช้ 4 ครั้ง → เห็น `weekly` 3 แถว แล้ว `bonus` 1 แถว |
| 6 | ผู้เยี่ยมชมได้ลองจริง | เบราว์เซอร์สะอาดเปิดไพ่จบครบ 5 ขั้นได้ 1 ครั้งโดยไม่ล็อกอิน |
| 7 | ธงปิดแล้วเหมือนเดิม | ปิด `entitlement.enabled` → ทุกคนใช้ได้ไม่จำกัดเหมือนก่อนมีระบบนี้ |
| 8 | PDPA | ลบบัญชี → แถวใน `reading_usage` และ `user_bonus` หายตาม |

---

## 10. ข้อควรระวังก่อนเปิดใช้

**ระบบนี้คือการลดสิทธิ์ผู้ใช้เดิม**
ตอนนี้ทุกคนเปิดไพ่ได้ไม่จำกัด การปล่อยระบบนี้ขึ้นโดยไม่ประกาศล่วงหน้า
จะกลายเป็นเรื่องร้องเรียนในวันเปิดใช้ — ต้องมีประกาศบนเว็บและโบนัสเปลี่ยนผ่านรองรับ (PR F)

**คุกกี้ผู้เยี่ยมชมต้องประกาศในนโยบายความเป็นส่วนตัว**
คุกกี้ที่ใช้ระบุตัวผู้เยี่ยมชมข้ามครั้งเข้าข่ายต้องแจ้งตาม PDPA แม้จะไม่เก็บข้อมูลส่วนบุคคล
ทำใน PR C พร้อมกันเลย

**เพดาน AI ต้องคำนวณใหม่ก่อนเปิด**
`AI_DAILY_CALL_CAP` ค่าเริ่มต้น 2000 อาจไม่พอเมื่อมีสมาชิกจริง
คำนวณจากจำนวนสมาชิก × 3 ครั้ง/สัปดาห์ ÷ 7 แล้วเผื่อ headroom
