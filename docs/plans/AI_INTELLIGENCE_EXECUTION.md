# 🛠️ แผนลงมือยกระดับความฉลาดแม่หมอ AI (Execution Handoff)

> **เอกสารกลยุทธ์ (ทำไม)**: [`AI_INTELLIGENCE_PLAN.md`](AI_INTELLIGENCE_PLAN.md) — อ่านก่อน
> **เอกสารนี้ (ทำยังไง)**: 8 งาน พร้อมโค้ดเป้าหมาย เกณฑ์ผ่าน และคำสั่งพิสูจน์รายข้อ
> **มติเจ้าของโปรเจกต์ 2026-09-04**: **ทำทุกข้อ**
> อ้างอิงโค้ดจริงบน `main` commit `9da19ff` — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมา
>
> ⚠️ แผงแอดมินถูก rebuild ใน PR #241 หลังเอกสารกลยุทธ์ถูกเขียน — path ในเอกสารนี้อัปเดตตามแล้ว

---

## ⛔ อ่านก่อนแตะโค้ดบรรทัดแรก

1. [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) — **INC-0074** (ช่องแจกโควตาฟรี) · **INC-0075** (hydration/โมดัล)
2. [`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0
3. [`docs/plans/AI_COST_CONTROL_PLAN.md`](AI_COST_CONTROL_PLAN.md) — ทุกการเรียก AI ที่เพิ่มเข้ามาต้องเคารพเพดานนี้

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain ai --files "<ไฟล์>" --task "<งาน>"
# ...แก้งาน...
npm run repo:verify                       # ต้องผ่าน 24/24
npm run commit -- --agent <ชื่อคุณ> --type feat --scope ai --msg "..." --files "..."
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run pr:auto -- "<title>" --body-file <path>
```

> 🚨 **merge แล้วยังไม่จบ** — ต้องดูผล CI รอบแรกบน `main` ด้วย (บทเรียน PR #234 → #235)

---

## 📌 สมมติฐานที่ตั้งไว้ให้แล้ว (เปลี่ยนได้ แต่ต้องบอกทีม)

เจ้าของสั่ง "ทำทุกข้อ" โดยยังไม่ได้ตอบ 3 คำถามท้ายเอกสารกลยุทธ์ จึงตั้งค่าเริ่มต้นที่ปลอดภัยที่สุดไว้ให้:

| คำถาม | ค่าที่ตั้งไว้ | เหตุผล |
| :--- | :--- | :--- |
| ยอมช้าลงแค่ไหน | **เวลาถึง token แรก (TTFB) ห้ามแย่ลงเกิน 300ms** · งานที่ช้ากว่านั้นต้องย้ายไปทำหลังสตรีมจบ | Groq ตอบใน 300-760ms เป็นจุดขาย ถ้าเสียไปคือเสียของดีที่มีอยู่ |
| เริ่มเก็บสถิติเลยไหม | **เริ่มทันที (งานที่ 0 ทำก่อนทุกข้อ)** | ข้อมูลสะสมย้อนหลังไม่ได้ เริ่มช้า = รอใหม่อีกรอบ |
| ความทรงจำย้อนหลังกี่ครั้ง | **3 ครั้งล่าสุด แบบย่อ** (ชื่อไพ่ใบแรก + คำถาม + outcome) ไม่ส่งคำอ่านเต็ม | ได้บริบทพอ · prompt ไม่บวม · ข้อมูลอ่อนไหวออกไปน้อยที่สุด |

---

## 🗺️ ลำดับและการแบ่ง PR

| PR | งาน | ผลกระทบ | ขนาด | ต้นทุน AI | ขึ้นกับ |
| :-: | :--- | :-- | :-- | :-- | :-- |
| **A** | 0 · เครื่องวัดคุณภาพ + Golden Set | 🔥 บังคับ | ~1 วัน | 0 | — |
| **B** | 1 · Karmic Bridge ต่อประวัติจริง | 🔥 สูงมาก | ~4 ชม. | 0 | — |
| **C** | 2 · ด่านตรวจความสอดคล้อง | สูง | ~4 ชม. | 0 | — |
| **D** | 3 · Dynamic Few-Shot | สูง | ~1 วัน | **ลดลง** | A (ใช้เคสที่ผู้ใช้กด ACCURATE) |
| **E** | 4 · Model Routing ตามขนาดผัง | กลาง | ~3 ชม. | **ลดลง** | A (ต้องวัดว่าคุณภาพไม่ตก) |
| **F** | 5 · RAG จาก Vectorize | สูง | ~1-2 วัน | เล็กน้อย | C (กันดึงเนื้อหาผิดไพ่) |
| **G** | 6 · ขัดเกลาเฉพาะบทสรุป | กลาง-สูง | ~1 วัน | +1 call | A + C |
| **H** | 7 · Adaptive Priors | สูง (ยาว) | ~2-3 วัน | 0 | A + ข้อมูล 2-3 เดือน |

> **B และ C ทำขนานกับ A ได้** (ไม่แตะไฟล์เดียวกัน) — แต่ **D E F G ต้องรอ A ให้ merge ก่อน** ไม่งั้นวัดผลไม่ได้ว่าดีขึ้นจริงไหม
> **H เริ่มไม่ได้จนกว่าจะมีข้อมูลสะสม** — เปิด issue ค้างไว้ อย่าเพิ่งจอง sprint

---

# 🅰️ PR A · งานที่ 0 — เครื่องวัดคุณภาพคำอ่าน

> **ถ้าข้ามข้อนี้ อีก 7 ข้อที่เหลือจะพิสูจน์ไม่ได้ว่าทำให้ดีขึ้นหรือแย่ลง**

## A.1 Migration `migrations/0009_reading_quality.sql`

ตาราง `reading_journal` ปัจจุบัน (ดู `src/lib/platform/db.ts`) **ไม่ได้เก็บบริบทตอนสร้างคำอ่านเลย** —
รู้แค่ว่าผู้ใช้ให้คะแนนเท่าไร แต่ไม่รู้ว่าคำอ่านนั้นมาจากโมเดลไหน prompt เวอร์ชันไหน

```sql
-- 0009: บริบทตอนสร้างคำอ่าน สำหรับวัดคุณภาพ AI (AI_INTELLIGENCE_PLAN งานที่ 0)
-- เก็บแยกตาราง ไม่ยัดเพิ่มใน reading_journal เพราะ:
--  - reading_journal คือ "ของผู้ใช้" (ต้องลบตามเมื่อขอลบบัญชี ตาม PDPA)
--  - ตารางนี้คือ "สถิติระบบ" ที่ไม่ผูกกับตัวตน เก็บต่อได้หลังผู้ใช้ลบบัญชี
--  - แยกแล้ว query สถิติไม่ไปแย่ง index ของหน้าประวัติผู้ใช้
CREATE TABLE IF NOT EXISTS reading_quality (
  reading_id      TEXT PRIMARY KEY,        -- ตรงกับ readingId ของรอบเปิดไพ่
  provider        TEXT NOT NULL,           -- 'groq' | 'gemini'
  model           TEXT NOT NULL,
  persona_id      TEXT NOT NULL,
  spread_id       TEXT NOT NULL,
  card_count      INTEGER NOT NULL,
  category        TEXT NOT NULL,
  prompt_version  TEXT NOT NULL,           -- ⚠️ หัวใจของการเทียบก่อน/หลัง
  elapsed_ms      INTEGER,
  output_tokens   INTEGER,
  had_failover    INTEGER NOT NULL DEFAULT 0,
  consistency_ok  INTEGER,                 -- เติมโดย PR C (NULL ก่อนหน้านั้น)
  outcome         TEXT,                    -- คัดลอกมาตอนผู้ใช้ให้คะแนน
  created_at      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rq_version  ON reading_quality(prompt_version, created_at);
CREATE INDEX IF NOT EXISTS idx_rq_provider ON reading_quality(provider, model);
CREATE INDEX IF NOT EXISTS idx_rq_persona  ON reading_quality(persona_id, spread_id);
```

> ⚠️ ต้องเพิ่ม DDL เดียวกันใน `createLocalSQLiteDB()` ที่ `src/lib/platform/db.ts` ด้วย
> ไม่งั้นเทสต์ในเครื่องจะพังเพราะตารางไม่มี (ดูรูปแบบที่ `reading_journal` ทำไว้)

## A.2 ค่าเวอร์ชัน prompt

ไฟล์ใหม่ `src/lib/ai/prompt-version.ts`:

```ts
/**
 * 🔖 เวอร์ชันของ prompt ที่ใช้สร้างคำอ่าน
 * ⚠️ **ต้องขึ้นเลขทุกครั้งที่แก้ `SYSTEM_CORE_KNOWLEDGE`, `buildReadingMessage()`,
 * ตัวอย่างมาตรฐาน, หรือโมดูลวิเคราะห์ 7 ตัว** — ไม่งั้นสถิติก่อน/หลังจะปนกันจนอ่านไม่ออก
 * รูปแบบ: <YYYYMMDD>-<ลำดับในวัน>
 */
export const PROMPT_VERSION = "20260904-1";
```

เพิ่มด่านตรวจใน `scripts/qa/test-ai-reading-golden.ts`: ถ้า hash ของ `SYSTEM_CORE_KNOWLEDGE`
เปลี่ยนแต่ `PROMPT_VERSION` ไม่เปลี่ยน → **ตก** (เก็บ hash ล่าสุดไว้ในไฟล์ snapshot)

## A.3 บันทึกตอนคำอ่านจบ

ที่ `src/app/api/reading/[id]/read/route.ts` — ในกิ่ง `event.type === "done"` ซึ่งรู้ `providerUsed` และ `event.usage` อยู่แล้ว
เพิ่มการเขียนลง `reading_quality` แบบ **fire-and-forget** (`.catch(() => {})`)

> ⚠️ ห้ามให้การเขียนสถิติล้มแล้วทำให้คำอ่านของผู้ใช้พัง — สถิติสำคัญน้อยกว่าคำอ่าน

## A.4 คัดลอก outcome ตอนผู้ใช้ให้คะแนน

ที่ `src/app/api/journal/[id]/route.ts` (`PATCH`) — หลัง `updateJournalOutcome()` สำเร็จ
`UPDATE reading_quality SET outcome = ? WHERE reading_id = ?`

## A.5 การ์ดใน `/admin`

เพิ่มการ์ด "คุณภาพคำอ่าน" แสดง: อัตรา `ACCURATE` แยกตาม `prompt_version` / `provider` / `persona_id` / ช่วง `card_count`
พร้อม **อัตรา `NOT_HAPPENED` เป็นสัญญาณเตือน**

> ⚠️ แผงแอดมินเพิ่งถูก rebuild เป็น executive dashboard ใน PR #241 — โครงปัจจุบันคือ
> `src/app/admin/page.tsx` (ระบบแท็บ + `dynamic import`) · `AdminOverview.tsx` (หน้าสรุปรวม)
> · `StatsDashboard.tsx` (สถิติ) · `AiHealthPanel.tsx` (สุขภาพ AI)
> **ให้ยึดรูปแบบการ์ดของ `AdminOverview.tsx` เป็นหลัก** และวางการ์ดใหม่ไว้ใต้แท็บ `ai`
> (ดูตัวจัดการแท็บที่ `admin/page.tsx:259-279`) อย่าสร้างแท็บใหม่ถ้าไม่จำเป็น

## A.6 Golden Set

ไฟล์ใหม่ `scripts/qa/fixtures/golden-readings.json` — 30-50 เคส:

```json
[{
  "id": "gold-001",
  "category": "love",
  "spreadId": "three-card",
  "question": "เขายังคิดถึงเราอยู่ไหม",
  "cardIds": ["major-06", "cups-08", "major-17"],
  "reversed": [false, true, false],
  "mustMention": ["ไพ่คู่รัก", "ถ้วย 8"],
  "mustNotMention": ["ไพ่ที่ไม่ได้เปิด"]
}]
```

สคริปต์ `scripts/qa/test-reading-quality.ts` รันชุดนี้ผ่านเส้นทางจริง (ถ้ามี API key) แล้วตรวจ:
ครบทุกตำแหน่ง · ไม่พูดถึงไพ่นอกชุด · ความยาวอยู่ในกรอบ · ภาษาไทยล้วน

> ถ้าไม่มี API key ให้ **ข้ามการยิงจริง แต่ยังตรวจโครงสร้าง fixture** (รูปแบบเดียวกับ `test-groq-failover.ts`)

## ✅ เกณฑ์ผ่าน PR A

- [ ] `npm run db:migrate` ผ่าน · ตารางเกิดทั้งบน D1 และ shim ในเครื่อง
- [ ] เปิดไพ่ 1 รอบ → มีแถวใน `reading_quality` ครบทุกคอลัมน์ (ยกเว้น `outcome`, `consistency_ok`)
- [ ] กดให้คะแนน → `outcome` ในตารางอัปเดตตาม
- [ ] แก้ `SYSTEM_CORE_KNOWLEDGE` โดยไม่ขึ้น `PROMPT_VERSION` → `repo:verify` **ตก**
- [ ] `/admin` แสดงการ์ดคุณภาพได้จริง
- [ ] `npm run repo:verify` 24/24

---

# 🅱️ PR B · งานที่ 1 — ต่อ Karmic Bridge เข้ากับประวัติจริง

## ปัญหา

`src/lib/ai/prompt.ts:167`

```ts
const karmic = analyzeKarmicBridge(cards);      // ← ไม่ส่ง pastReading
```

`src/lib/ai/karmic.ts:44`

```ts
export function analyzeKarmicBridge(
  currentCards: TarotCard[],
  pastReading?: PastReadingSnapshot
): KarmicBridgeAnalysis {
  if (!pastReading || !pastReading.primaryCardName) {
    return { hasPastContext: false };            // ← ออกตรงนี้ 100% ของทุกครั้ง
  }
```

**โมดูล 89 บรรทัดไม่เคยผลิตข้อความออกมาเลยสักครั้งตั้งแต่เขียนมา**

## B.1 ตัวอ่านประวัติแบบย่อ

ไฟล์ใหม่ `src/lib/ai/memory.ts`:

```ts
import { listJournal } from "@/lib/journal/journal.repo";
import type { PastReadingSnapshot } from "@/lib/ai/karmic";

/**
 * 🧠 ความทรงจำข้ามครั้งของแม่หมอ
 * ---------------------------------------------------------------------------
 * ส่ง **เฉพาะรูปย่อ** เข้า prompt ไม่ส่งคำอ่านเต็ม เพราะ:
 *  1. prompt ยาวขึ้น = ช้าลงและแพงขึ้นทุกครั้งที่เปิดไพ่
 *  2. ข้อมูลอ่อนไหวควรออกจากระบบเราน้อยที่สุดเท่าที่ยังได้ประโยชน์ (PDPA)
 *  3. สิ่งที่โมเดลต้องรู้จริง ๆ คือ "เคยได้ไพ่อะไร ถามอะไร แล้วจริงไหม" ไม่ใช่ข้อความทั้งก้อน
 *
 * ⚠️ ผู้เยี่ยมชม (guest) ไม่มีประวัติ → คืน undefined เงียบ ๆ ห้าม throw
 */
export async function loadKarmicMemory(
  userId: string | null | undefined,
  limit = 3,
): Promise<PastReadingSnapshot | undefined> {
  if (!userId) return undefined;
  try {
    const past = await listJournal(userId, { limit });
    const latest = past[0];
    if (!latest?.cards?.length) return undefined;

    return {
      primaryCardName: latest.cards[0].cardNameTh,
      question: latest.question,
      outcome: latest.outcome,
      daysAgo: Math.floor((Date.now() - new Date(latest.date).getTime()) / 86_400_000),
      // ไพ่ใบแรกของ 2 ครั้งก่อนหน้า ใช้ดูแนวโน้มว่าธีมซ้ำไหม
      recentPrimaryCards: past.slice(1).map((r) => r.cards[0]?.cardNameTh).filter(Boolean),
    };
  } catch (err) {
    // ประวัติอ่านไม่ได้ = คำอ่านยังต้องทำงานต่อได้ตามปกติ
    console.warn("[karmic memory] อ่านประวัติไม่สำเร็จ:", err);
    return undefined;
  }
}
```

> ⚠️ ต้องขยาย `PastReadingSnapshot` ใน `karmic.ts` ให้รับฟิลด์ใหม่ (ตอนนี้มีแค่ `primaryCardName` กับพวก)

## B.2 ส่งเข้า ReadingContext

`src/lib/ai/prompt.ts` — เพิ่ม `pastReading?: PastReadingSnapshot` ใน `interface ReadingContext`
แล้วเปลี่ยนบรรทัด 167 เป็น `analyzeKarmicBridge(cards, ctx.pastReading)`

`src/app/api/reading/[id]/read/route.ts:199` — `readingCtx` มี `viewer` อยู่แล้วจาก `getViewer(request)` ที่บรรทัด 108:

```ts
const pastReading = await loadKarmicMemory(viewer.kind === "member" ? viewer.userId : null);

const readingCtx = {
  ...
  pastReading,
};
```

> ⚠️ **เรื่องความเร็ว**: การอ่าน D1 นี้อยู่ **ก่อน** สตรีมเริ่ม → กระทบ TTFB โดยตรง
> ให้ยิงขนานกับงานเตรียมอื่น (`Promise.all` กับ `getContentOverrides()`) ไม่ใช่ต่อคิวกัน
> ถ้าเกินงบ 300ms ให้ทำเป็น fire-and-forget ที่ timeout 200ms แล้วปล่อยผ่านถ้าไม่ทัน

## B.3 ขยายตารางการเปลี่ยนผ่าน

`NOTABLE_TRANSITIONS` ใน `karmic.ts` ครอบคลุมน้อย — เพิ่มคู่ที่พบบ่อย หรือถ้าไม่มีคู่ที่ตรง
ให้ส่งข้อเท็จจริงดิบเข้า prompt แทน แล้วให้โมเดลตีความเอง:

> "ครั้งก่อน (14 วันที่แล้ว) ผู้ถามได้ไพ่ **หอคอย** กับคำถามเรื่องงาน และภายหลังให้คะแนนว่า *เกิดขึ้นจริง*"

## ✅ เกณฑ์ผ่าน PR B

- [ ] สมาชิกที่มีประวัติ ≥1 ครั้ง → prompt มีบล็อกความทรงจำจริง (ตรวจด้วย log ของ `buildReadingMessage`)
- [ ] สมาชิกใหม่ที่ยังไม่มีประวัติ / ผู้เยี่ยมชม → คำอ่านทำงานปกติ ไม่มี error
- [ ] D1 ล่ม → คำอ่านยังออกได้ (ไม่ throw)
- [ ] **TTFB ไม่แย่ลงเกิน 300ms** (วัดด้วย `elapsed_ms` ใน `reading_quality` เทียบก่อน/หลัง)
- [ ] `softDeleteUser()` ลบประวัติแล้วความทรงจำหายตาม (ตรวจ PDPA)
- [ ] เทสต์ใหม่ใน `scripts/qa/test-ai-reading-golden.ts`: `analyzeKarmicBridge()` ที่ได้ `pastReading` จริง **ต้องคืน `hasPastContext: true`**

---

# 🅲 PR C · งานที่ 2 — ด่านตรวจความสอดคล้องหลังโมเดลตอบ

## หลักการ

**ตรวจด้วยโค้ด ไม่ใช่ให้ LLM ตรวจ LLM** — ถูกกว่า เร็วกว่า ผลคงที่กว่า

## C.1 ไฟล์ใหม่ `src/lib/ai/consistency.ts`

```ts
import type { Reading } from "@/lib/schema/reading";
import type { TarotCard } from "@/data/cards/types";

export interface ConsistencyIssue {
  code:
    | "MISSING_POSITION"      // อ่านไม่ครบทุกตำแหน่ง
    | "DUPLICATE_POSITION"
    | "FOREIGN_CARD"          // พูดถึงไพ่ที่ไม่ได้เปิด ← กฎเหล็กข้อ 14
    | "YESNO_CONTRADICTION"
    | "MISSING_RITUAL"        // advice ข้อสุดท้ายไม่ได้ขึ้นต้นด้วย 🧘
    | "LENGTH_OUT_OF_RANGE";
  detail: string;
}

/**
 * ตรวจผลลัพธ์ก่อนส่งถึงผู้ใช้ — ไม่เรียกโมเดลซ้ำ ไม่มีต้นทุนเพิ่ม
 *
 * ⚠️ `FOREIGN_CARD` คือด่านที่บังคับ **กฎเหล็กข้อ 14** ในระดับข้อความ
 * ของเดิมกันการกุไพ่ได้แค่ระดับข้อมูล (index ต้องมีจริง) แต่ถ้าโมเดลเขียนใน `reading`
 * ว่า "ไพ่หอคอยที่อยู่ข้าง ๆ บอกว่า..." ทั้งที่ไม่มีหอคอยในชุด — ของเดิมจับไม่ได้เลย
 */
export function checkReadingConsistency(
  reading: Reading,
  drawnCards: TarotCard[],
  opts: { expectedPositions: number; yesNoMode?: boolean },
): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];

  // 1) ตำแหน่งครบและไม่ซ้ำ
  const positions = reading.cards.map((c) => c.position);
  const unique = new Set(positions);
  if (unique.size !== positions.length) {
    issues.push({ code: "DUPLICATE_POSITION", detail: `ตำแหน่งซ้ำ: ${positions.join(",")}` });
  }
  for (let i = 0; i < opts.expectedPositions; i++) {
    if (!unique.has(i)) {
      issues.push({ code: "MISSING_POSITION", detail: `ขาดตำแหน่งที่ ${i}` });
    }
  }

  // 2) ห้ามพูดถึงไพ่นอกชุด (กฎเหล็กข้อ 14)
  //    เทียบกับชื่อไพ่ทั้ง 78 ใบ ลบด้วยชุดที่เปิดจริง
  const drawnNames = new Set(drawnCards.flatMap((c) => [c.nameTh, c.nameEn]));
  const allText = [
    reading.opening,
    reading.connections,
    reading.summary,
    ...reading.cards.map((c) => `${c.headline} ${c.reading}`),
    ...reading.advice,
  ].join(" ");

  for (const name of FOREIGN_CARD_NAMES) {           // ชื่อไพ่ 78 ใบ ยกเว้นชุดที่เปิด
    if (drawnNames.has(name)) continue;
    if (allText.includes(name)) {
      issues.push({ code: "FOREIGN_CARD", detail: `พูดถึงไพ่ที่ไม่ได้เปิด: ${name}` });
    }
  }

  // 3) ผังใช่/ไม่ใช่ ต้องไม่ขัดกันเอง
  // 4) advice ข้อสุดท้ายต้องขึ้นต้นด้วย 🧘
  // 5) ความยาวอยู่ในกรอบ depth
  // ...

  return issues;
}
```

> ⚠️ **ระวังผลบวกลวง**: ชื่อไพ่ไทยบางใบเป็นคำทั่วไป (เช่น "ดวงอาทิตย์" "ดวงจันทร์" "ความตาย" "โลก")
> ถ้าเทียบด้วย `includes()` ตรง ๆ จะจับผิดบ่อยมาก
> **ต้องเทียบแบบมีขอบเขตคำ และเฉพาะเมื่อมีคำว่า "ไพ่" นำหน้า หรือชื่ออังกฤษในวงเล็บ**
> ให้เขียนเทสต์ครอบเคสนี้ก่อนเปิดใช้จริง — ไม่งั้นจะ failover ทั้งที่คำอ่านถูกต้อง

## C.2 จุดเสียบ

`src/lib/ai/groq.ts` — หลัง `ReadingSchema.safeParse()` สำเร็จ (ราวบรรทัด 450 ที่ตรวจ `objectHasForeignScript`)
ถ้ามี issue ระดับร้ายแรง (`FOREIGN_CARD`, `MISSING_POSITION`) → `continue` ไปโมเดลถัดไป
พร้อม `recordEvent("ai_consistency_fail:<code>")`

ทำแบบเดียวกันที่ `src/lib/ai/gemini.ts`

## ✅ เกณฑ์ผ่าน PR C

- [ ] เทสต์: ป้อนคำอ่านที่พูดถึงไพ่นอกชุด → ได้ `FOREIGN_CARD`
- [ ] **เทสต์ผลบวกลวง**: คำอ่านที่ใช้คำว่า "ดวงอาทิตย์" ในความหมายทั่วไป (ไม่ใช่ชื่อไพ่) → **ต้องไม่ตก**
- [ ] เทสต์: คำอ่านขาดตำแหน่ง → ได้ `MISSING_POSITION`
- [ ] คำอ่านที่ถูกต้องทั้ง 30-50 เคสใน Golden Set → **0 issue** (ถ้าตกแปลว่าด่านเข้มเกินไป)
- [ ] `consistency_ok` ถูกเขียนลง `reading_quality`
- [ ] เห็น `ai_consistency_fail` ใน `/admin`

---

# 🅳 PR D · งานที่ 3 — ตัวอย่างมาตรฐานแบบเลือกตามบริบท

## ปัญหา

`SYSTEM_CORE_KNOWLEDGE` ยาว **7,334 ตัวอักษร** และมีตัวอย่างคำอ่านมาตรฐาน **แค่ 1 ชิ้น**
(`prompt.ts:89` — เคส *ผัง 1 ใบ หมวดการงาน*) ซึ่งถูกใช้สอนทุกหมวดและทุกขนาดผัง

ผัง 10 ใบหมวดความรักจึงถูกสอนด้วยตัวอย่างที่หน้าตาไม่เหมือนงานที่ต้องทำเลย

## D.1 คลังตัวอย่าง

ไฟล์ใหม่ `src/data/reading-exemplars.ts` — 6-8 ชิ้น ครอบคลุม (หมวด × ขนาดผัง):

| id | หมวด | ขนาดผัง |
| :--- | :--- | :-- |
| `love-1` | ความรัก | 1 ใบ |
| `love-3` | ความรัก | 3 ใบ |
| `career-1` | การงาน | 1 ใบ (ตัวที่มีอยู่แล้ว ย้ายมา) |
| `career-3` | การงาน | 3 ใบ |
| `money-3` | การเงิน | 3 ใบ |
| `general-10` | ทั่วไป | 10 ใบ (เซลติกครอส) |
| `yesno-3` | ใช่/ไม่ใช่ | 3 ใบ |

> **ที่มาของตัวอย่าง**: คัดจากคำอ่านจริงที่ผู้ใช้กด `ACCURATE` (ต่อยอดจาก PR A)
> **ห้ามแต่งเอง** — ตัวอย่างที่แต่งเองจะสอนโทนที่ผู้ใช้จริงไม่ได้ชอบ

## D.2 ตัวเลือก

```ts
/**
 * เลือกตัวอย่างที่ใกล้เคียงงานตรงหน้าที่สุด — ฉีดแค่ 1 ชิ้น
 * ผลพลอยได้: system prompt สั้นลงต่อครั้ง = เร็วขึ้นและถูกลง
 * (ของเดิมแบกตัวอย่างเดียวติดไปทุกครั้งอยู่แล้ว จึงไม่ได้ยาวขึ้น)
 */
export function pickExemplar(category: Category, cardCount: number): ReadingExemplar {
  // จับคู่หมวดก่อน แล้วค่อยหาขนาดผังที่ใกล้ที่สุด · ไม่เจอ → fallback ตัวกลาง
}
```

`buildSystemPrompt()` รับ `category` + `cardCount` เพิ่ม แล้วต่อท้ายด้วยตัวอย่างที่เลือก

> ⚠️ `buildSystemPrompt()` ถูกออกแบบให้ **คงที่ต่อ persona เพื่อ prompt caching** (ดูคอมเมนต์ `prompt.ts:16-22`)
> การใส่ตัวอย่างที่เปลี่ยนตามบริบทจะ**ทำลาย cache hit** ถ้า provider ทำ caching อยู่จริง
> → **ต้องวัดก่อน**: ถ้า Groq ไม่ได้ทำ prefix caching อยู่แล้ว ก็ไม่เสียอะไร
> ถ้าเสีย ให้ย้ายตัวอย่างไปอยู่ฝั่ง user message แทน (`buildReadingMessage`)

## ✅ เกณฑ์ผ่าน PR D

- [ ] ผังความรัก 3 ใบ → ได้ตัวอย่าง `love-3` (ตรวจด้วยเทสต์)
- [ ] หมวดที่ไม่มีตัวอย่างตรง → fallback ได้ ไม่ throw
- [ ] system prompt ต่อครั้ง **ไม่ยาวขึ้น** กว่าเดิม
- [ ] อัตรา `ACCURATE` ใน `reading_quality` ของ `prompt_version` ใหม่ **ไม่ต่ำกว่า** เวอร์ชันเดิม หลังเก็บข้อมูล ≥1 สัปดาห์

---

# 🅴 PR E · งานที่ 4 — เลือกโมเดลตามขนาดผัง

ตอนนี้ทุกผังวิ่งผ่าน `WORKING_GROQ_MODELS` ชุดเดียวกันตามลำดับเดิมเสมอ:

```ts
export const WORKING_GROQ_MODELS = [
  "qwen/qwen3.8-27b", "qwen/qwen3.6-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b",
] as const;
```

ไพ่ประจำวัน 1 ใบ กับเซลติกครอส 10 ใบ ใช้เส้นทางเดียวกัน ต่างแค่ `max_tokens`

## แนวทาง

```ts
/**
 * ผังเล็กคือสัดส่วนการใช้งานส่วนใหญ่ (ไพ่ประจำวัน + ถามไวตอบตรง)
 * ใช้โมเดลเล็กที่ตอบไวกว่าและกินโควตาน้อยกว่า เก็บโมเดลใหญ่ไว้ให้ผังที่ต้องการเหตุผลลึกจริง ๆ
 * ⚠️ ต้องเฝ้า `reading_quality` ว่าผังเล็กคุณภาพไม่ตก ถ้าตก → ย้อนกลับทันที
 */
function modelsForSpread(cardCount: number): readonly string[] {
  if (cardCount <= 3) return ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"];
  return WORKING_GROQ_MODELS;
}
```

## ✅ เกณฑ์ผ่าน PR E

- [ ] ผัง 1-3 ใบใช้รายการโมเดลสั้น · ผัง ≥4 ใบใช้ชุดเต็ม
- [ ] `elapsed_ms` เฉลี่ยของผังเล็ก **ลดลง**
- [ ] อัตรา `ACCURATE` ของผังเล็ก **ไม่ลดลง** (เฝ้า ≥1 สัปดาห์ ถ้าลด → ย้อนกลับ)
- [ ] failover ยังทำงานครบเมื่อโมเดลแรกล้ม

---

# 🅵 PR F · งานที่ 5 — RAG จากคลัง Vectorize

## ของที่มีอยู่แล้ว

`src/lib/search/vectorize.ts`:

```ts
export async function semanticSearch(query: string, opts?: { topK?: number; type?: SearchType }): Promise<SearchResult[]>
export async function relatedTo(itemId: string, opts?: { topK?: number; type?: SearchType }): Promise<SearchResult[]>
```

index มีไพ่ 78 ใบ + บทความ 24 ชิ้น **แต่คำอ่านไม่เคยเรียกใช้เลย**

## F.1 ดึงบริบท

ไฟล์ใหม่ `src/lib/ai/retrieval.ts`:

```ts
/**
 * ดึงเนื้อหาที่เราเขียนเอง มายึดคำอ่านให้อยู่กับความจริงของเว็บเรา แทนความจำของโมเดล
 *
 * ⚠️ ดึง "บทความ" เท่านั้น ไม่ดึง "ไพ่"
 * เพราะข้อมูลไพ่ที่เปิดได้ถูกส่งเข้า prompt ครบอยู่แล้วผ่าน `formatCardLoreForPrompt()`
 * ถ้าดึงไพ่ใบอื่นเข้ามาด้วย จะกลายเป็นการยัดไพ่ที่ไม่ได้เปิดเข้าไปในบริบท
 * = เสี่ยงผิดกฎเหล็กข้อ 14 โดยตรง (PR C จะจับได้ แต่ทำให้ failover บ่อยโดยไม่จำเป็น)
 */
export async function retrieveReadingContext(
  question: string,
  category: Category,
): Promise<string> {
  const hits = await semanticSearch(`${question} ${category}`, { topK: 2, type: "article" });
  if (hits.length === 0) return "";
  return hits.map((h) => `• ${h.title}: ${h.snippet}`).join("\n");
}
```

## F.2 เรื่องความเร็ว — ข้อจำกัดที่แข็งที่สุดของ PR นี้

`semanticSearch()` ต้อง **embed คำถาม → query Vectorize** ก่อนสตรีมเริ่ม = บวก TTFB ตรง ๆ

**บังคับ**:
- ยิงขนานกับงานเตรียมอื่นด้วย `Promise.all` (`getContentOverrides()`, `loadKarmicMemory()`)
- ใส่ **timeout 250ms** — ไม่ทันก็ปล่อยผ่าน คำอ่านต้องออกตรงเวลาเสมอ
- แคชผลตามคู่ `(หมวด × คำถามที่ normalize แล้ว)` ใน KV — คำถามยอดฮิตซ้ำกันเยอะ

## ✅ เกณฑ์ผ่าน PR F

- [ ] คำอ่านอ้างอิงเนื้อหาจากบทความของเราได้จริง (ตรวจด้วยตาในเคสตัวอย่าง)
- [ ] Vectorize ล่ม / timeout → คำอ่านยังออกปกติ
- [ ] **TTFB ไม่แย่ลงเกิน 300ms** (วัดจาก `elapsed_ms`)
- [ ] อัตรา `FOREIGN_CARD` จาก PR C **ไม่เพิ่มขึ้น** (ถ้าเพิ่ม = RAG ดึงเนื้อหาที่พูดถึงไพ่อื่นเข้ามา)
- [ ] cache hit rate ของ KV วัดได้

---

# 🅶 PR G · งานที่ 6 — ขัดเกลาเฉพาะบทสรุป

## แนวคิด

หลังสตรีมคำอ่านรายใบจบแล้ว เรียกโมเดลเร็วอีก 1 ครั้ง **เฉพาะ `summary` + `advice`**
โดยให้เห็นคำอ่านทั้งชุดที่เพิ่งเขียน แล้วเขียนบทสรุปใหม่ให้คมและตอบคำถามตรงขึ้น

**ทำไมไม่ขัดทั้งชุด**: ผู้ใช้เห็นคำอ่านทีละใบแบบสตรีมอยู่แล้ว การขัดทั้งชุดทำให้รอสองรอบ
แต่ `summary` คือส่วนสุดท้ายที่อ่าน และเป็นส่วนที่ตัดสินว่า "แม่นไหม" มากที่สุด

## ⚠️ ข้อบังคับที่พลาดไม่ได้

```ts
// ทุกการเรียก AI ที่เพิ่มเข้ามาต้องผ่านเพดานค่าใช้จ่ายรายวัน
// บทเรียน: แชทถามต่อเคยไม่ถูกนับในเพดานเลยเพราะตรวจ cap หลังชั้น Groq (แก้ไปแล้วใน PR #234)
if (await isAiCapReached("member")) return original;   // ไม่ขัดเกลา คืนของเดิม
const refined = await refineSummary(...);
await recordAiCall(1);                                  // ← ห้ามลืม
```

## ข้อควรระวังอื่น

- ถ้าขัดเกลาแล้วล้ม → **คืนบทสรุปเดิม** ห้ามให้ผู้ใช้ได้หน้าจอว่าง
- ต้องผ่าน `checkReadingConsistency()` (PR C) อีกรอบ — บทสรุปใหม่ก็กุไพ่ได้เหมือนกัน
- UI ต้องรองรับการแทนที่บทสรุปหลังสตรีมจบโดยไม่กระตุก

## ✅ เกณฑ์ผ่าน PR G

- [ ] เพดาน AI เต็ม → ข้ามการขัดเกลา คำอ่านยังสมบูรณ์
- [ ] ขัดเกลาล้ม → คืนบทสรุปเดิม
- [ ] `recordAiCall()` ถูกเรียกทุกครั้งที่ขัดเกลาสำเร็จ (ตรวจใน `/admin` ว่าตัวเลขขึ้นตาม)
- [ ] อัตรา `ACCURATE` ของเวอร์ชันที่มีการขัดเกลา **สูงกว่า** เวอร์ชันก่อนหน้าอย่างมีนัย
      **ถ้าไม่สูงกว่า → ปิดฟีเจอร์นี้** เพราะจ่ายเพิ่มโดยไม่ได้อะไร

---

# 🅷 PR H · งานที่ 7 — ให้ 7 โมดูลปรับน้ำหนักตามผลจริง

> ⚠️ **เริ่มไม่ได้จนกว่าจะมีข้อมูลจาก PR A สะสมอย่างน้อย 2-3 เดือน** — เปิด issue ค้างไว้ อย่าจอง sprint

## แนวคิด

เมื่อมี `reading_quality` มากพอ ให้ทดลอง **ปิดโมดูลทีละตัว** แล้วดูว่าอัตรา `ACCURATE` เปลี่ยนไหม

คำถามที่จะตอบได้:
> *"บทสนทนาทางสายตา (gaze) ช่วยให้แม่นขึ้นจริงไหม หรือแค่ทำให้ prompt ยาวขึ้นเฉย ๆ"*

**นี่คือของที่เว็บดูดวงอื่นทำไม่ได้** เพราะไม่มีทั้งโมดูลวิเคราะห์แบบ deterministic และวงจรวัดผล

## วิธี

เพิ่ม `module_flags` ใน `reading_quality` (bitmask ว่ารอบนั้นเปิดโมดูลไหนบ้าง)
สุ่มปิดโมดูลทีละตัวกับทราฟฟิก 10% แล้วเทียบผลแบบ A/B

## ✅ เกณฑ์ผ่าน PR H

- [ ] มีรายงานว่าโมดูลไหนมีผลบวก/ลบ/ไม่มีผล พร้อมขนาดตัวอย่างที่มากพอ
- [ ] โมดูลที่พิสูจน์แล้วว่าไม่มีผล → ตัดออกจาก prompt (สั้นลง เร็วขึ้น ถูกลง)

---

## 🚧 ข้อจำกัดที่ทุก PR ต้องเคารพ

| ข้อจำกัด | ผลต่อการออกแบบ |
| :--- | :--- |
| **กฎเหล็กข้อ 14 — ห้ามกุไพ่** | PR C คือด่านบังคับข้อนี้ในระดับข้อความ · PR F ต้องไม่ดึงข้อมูลไพ่ที่ไม่ได้เปิดเข้ามา |
| **รันบน Cloudflare Workers** | มีเพดานเวลา CPU ต่อคำขอ · งานหนักต้องขนานหรือย้ายไปหลังสตรีม |
| **UX เป็น SSE สตรีมสด** | ทุกอย่างที่เพิ่ม**ก่อน** token แรก ผู้ใช้รู้สึกทันที — งบ **+300ms** เท่านั้น |
| **เพดานค่าใช้จ่าย AI รายวัน** | ทุกการเรียกโมเดลใหม่ต้องผ่าน `isAiCapReached()` และนับด้วย `recordAiCall()` |
| **PDPA** | ใช้ประวัติเจ้าตัวเพื่อตอบเจ้าตัวได้ · ห้ามนำไปเทรนโมเดล · ต้องลบตามเมื่อขอลบบัญชี |
| **โควตา Groq ฟรี 14,400 req/วัน** | PR E ยืดโควตา · PR G กินเพิ่ม → ต้องดูสมดุลรวม |
| **`noUnusedLocals` เปิดอยู่** | โค้ดที่เขียนค้างไว้ "เผื่ออนาคต" จะทำให้ `typecheck` ตก — เขียนแล้วต้องใช้จริง |

---

## 🔄 กติกาการย้อนกลับ

**แก้ prompt ครั้งไหนต้องขึ้น `PROMPT_VERSION` แล้วเทียบตัวเลขก่อน/หลังอย่างน้อย 1 สัปดาห์**

| สัญญาณ | ทำอะไร |
| :--- | :--- |
| อัตรา `ACCURATE` ลดลง | **ย้อนกลับ** ไม่ใช่แก้เพิ่มทับ |
| `NOT_HAPPENED` เพิ่มขึ้น | ย้อนกลับทันที (แย่กว่าค่า ACCURATE ลด) |
| `elapsed_ms` เพิ่มเกิน 300ms | ย้อนกลับหรือย้ายงานไปหลังสตรีม |
| `ai_consistency_fail` พุ่ง | ตรวจว่าด่านเข้มเกินไปหรือคุณภาพตกจริง **ก่อน**ปิดด่าน |
