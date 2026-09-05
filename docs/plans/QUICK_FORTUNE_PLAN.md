# ⚡ แผนฟีเจอร์ "ทำนายด่วน" (Quick Fortune — 1 ใบ ไม่ต้องเลือกไพ่)

> **สถานะ**: 📝 วางแผนแล้ว รอทีมพัฒนาเริ่มลงมือ (ยังไม่มีโค้ดใดถูกแก้)
> **ผู้วางแผน**: Claude (คิดโครง ให้อีกทีม/เอเจนต์ลงมือ) — 2026-09-05
> **อ้างอิงโค้ดจริงบนบรานช์นี้ ณ วันที่วางแผน** — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมาแทน

---

## 📖 สารบัญ

| ส่วน | เนื้อหา |
| :--- | :--- |
| [0](#0-โจทย์และเป้าหมาย) | โจทย์และเป้าหมาย |
| [1](#1-อ่านก่อนแตะโค้ด) | อ่านก่อนแตะโค้ด |
| [2](#2-flow-ปัจจุบัน-สิ่งที่จะถูกแทนที่) | Flow ปัจจุบัน (สิ่งที่จะถูกแทนที่) |
| [3](#3-การค้นพบสำคัญ-ทำไมงานนี้เบากว่าที่คิด) | 🔑 การค้นพบสำคัญ — ทำไมงานนี้เบากว่าที่คิด |
| [4](#4-flow-ใหม่ที่เสนอ) | Flow ใหม่ที่เสนอ |
| [5](#5-มติที่ตัดสินใจแล้ว-จากเจ้าของโปรเจกต์) | มติที่ตัดสินใจแล้ว (จากเจ้าของโปรเจกต์) |
| [6](#6-รายการงาน-แบ่งเป็นก้อนย่อย) | รายการงาน (แบ่งเป็นก้อนย่อย) |
| [7](#7-กฎเหล็กที่ต้องเคารพ) | กฎเหล็กที่ต้องเคารพ |
| [8](#8-เกณฑ์ผ่านรายข้อ-acceptance-criteria) | เกณฑ์ผ่านรายข้อ (Acceptance Criteria) |
| [9](#9-ไฟล์ที่เกี่ยวข้องทั้งหมด) | ไฟล์ที่เกี่ยวข้องทั้งหมด |
| [10](#10-ทางเลือกที่ตัดออกแล้ว-พร้อมเหตุผล) | ทางเลือกที่ตัดออกแล้ว (พร้อมเหตุผล) |

---

## 0. โจทย์และเป้าหมาย

เจ้าของโปรเจกต์ต้องการเพิ่มทางลัด **"ทำนายด่วน"** แทนที่ hero การ์ดหลัง 3D (`✦ SACRED ORACLE ✦` / `ไพ่ทาโรต์ 1909`) ที่เป็นจุดเริ่มต้นของหน้าแรกตอนนี้ โดยมีคุณสมบัติ:

1. เป็น **ไพ่ 1 ใบ** เท่านั้น
2. หัวข้อเป็น **เรื่องหลักที่คนไทยถามบ่อยที่สุด** (ยอดนิยม)
3. **ไม่มีภาพกองไพ่/พัดไพ่ให้เลือก** — กดหัวข้อแล้วเข้าทำนายได้เลย
4. หลังอ่านไพ่จบ **เข้าห้องแชทกับแม่หมอต่อได้ทันที**
5. คำทำนายที่ตอบ (สรุปท้าย) **สั้น กระชับ ได้ใจความ** ไม่ยืดยาว

---

## 1. อ่านก่อนแตะโค้ด

ตามระเบียบมาตรฐานของโปรเจกต์ (`CLAUDE.md`) ทีมที่รับงานนี้ต้องอ่านก่อนเริ่ม:

1. [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) — โดยเฉพาะบทเรียนเรื่อง entitlement/โควตาฟรี และ hydration ของโมดัล
2. [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) — เช็กว่ามีใครแตะ `TarotFlow.tsx` ค้างอยู่ไหม
3. [`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0
4. **กฎเหล็กข้อ 4, 14** ใน `CLAUDE.md` (Manual Self-Reveal + ห้ามกุไพ่ปลอม) — งานนี้เสี่ยงชนสองข้อนี้มากที่สุด

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain reading-flow --files "src/app/TarotFlow.tsx,src/data/spreads.ts" --task "quick-fortune"
# ...ลงมือ...
npm run repo:verify
npm run pr:auto -- "<title>" --body-file <path>
npm run agent:unlock -- --agent <ชื่อคุณ>
```

---

## 2. Flow ปัจจุบัน (สิ่งที่จะถูกแทนที่)

State machine ทั้งหมดอยู่ใน [`src/app/TarotFlow.tsx`](../../src/app/TarotFlow.tsx) ควบคุมด้วย `RitualStep`:

```
SPREAD_SELECT → INTENTION_SELECT → SHUFFLE → PICK_CARDS → READING → SUMMARY
```
(ประกาศชนิดที่ [`RitualStepProgress.tsx:6`](../../src/components/ui/RitualStepProgress.tsx))

| Step | ทำอะไร | ไฟล์ |
| :--- | :--- | :--- |
| `SPREAD_SELECT` | โชว์ hero กองไพ่ 3D + กริดเลือกผัง 20 แบบ | [`TarotFlow.tsx:947-1052`](../../src/app/TarotFlow.tsx), `SpreadCardSelector.tsx` |
| `INTENTION_SELECT` | กรอกชื่อเล่น + คำถาม + เลือกแม่หมอ → เรียก `POST /api/reading/start` (`handleStartSession`) | [`TarotFlow.tsx:459-538`](../../src/app/TarotFlow.tsx) |
| `SHUFFLE` | ริชวลสับไพ่ ~หลายวินาที เก็บ mouse entropy เป็น `clientSeed` | `ShuffleRitual.tsx`, `handleShuffleComplete` ที่ [`TarotFlow.tsx:541`](../../src/app/TarotFlow.tsx) |
| `PICK_CARDS` | แผ่ไพ่ 78 ใบให้แตะเลือกทีละใบ (`InteractiveCardFan`) → เรียก `POST /api/reading/[id]/shuffle` | `handlePickCard` / `handleFinalizePickedCards` ที่ [`TarotFlow.tsx:554-661`](../../src/app/TarotFlow.tsx) |
| `READING`/`SUMMARY` | โชว์ไพ่คว่ำหน้าให้แตะพลิกเอง (`SpreadBoard`) + สตรีมคำทำนาย (`StreamReader`) + การ์ด CTA แชทแม่หมอ | [`TarotFlow.tsx:1190-1306`](../../src/app/TarotFlow.tsx) |

**สิ่งที่ "ทำนายด่วน" ต้องตัดออก**: กริดเลือกผัง 20 แบบ, ขั้นกรอกคำถามเต็มรูปแบบ, ริชวลสับไพ่แบบยาว, และหน้าพัดไพ่ 78 ใบให้แตะเลือก (ข้อ 3 ในโจทย์)

---

## 3. 🔑 การค้นพบสำคัญ — ทำไมงานนี้เบากว่าที่คิด

**ไม่ต้องแก้ backend เลยแม้แต่บรรทัดเดียว** ตรวจโค้ดจริงแล้วพบว่า:

- `POST /api/reading/[id]/shuffle` รับ `pickedIndices` เป็น **optional** ([`route.ts:17`](../../src/app/api/reading/[id]/shuffle/route.ts)) — ถ้าไม่ส่งมา `drawCards()` จะจั่วให้อัตโนมัติจาก `deck.slice(0, count)` ([`shuffle.ts:148-150`](../../src/lib/tarot/shuffle.ts)) ไม่ต้องมีขั้นแตะเลือกจากพัดไพ่เลย
- `normalizeClientSeed()` ([`shuffle.ts:159-163`](../../src/lib/tarot/shuffle.ts)) ถ้าไม่ส่ง `clientSeed` มา จะ fallback เป็น `randomBytes(16)` ที่ปลอดภัยอยู่แล้ว — ไม่จำเป็นต้องมีริชวลสับไพ่ยาว ๆ เพื่อเก็บ entropy จากผู้ใช้
- ระบบ Provably-Fair (commit-reveal SHA-256) **ยังคงทำงานสมบูรณ์** แม้ข้ามสองขั้นตอนนี้ไป เพราะความยุติธรรมมาจาก `serverSeed` ที่ commit ไว้ล่วงหน้า ไม่ได้ขึ้นกับว่าผู้ใช้ "แตะเลือก" ไพ่ใบไหนในพัด
- Spread ไพ่ใบเดียวมีอยู่แล้วในระบบสิทธิ์ฟรี (`STANDARD_SPREAD_IDS` มี `"daily"`, `"quick"` — [`limits.ts:33-40`](../../src/lib/entitlement/limits.ts)) และ `credits: 0, guestAllowed: true` อยู่แล้วใน [`spreads.ts:44-62`](../../src/data/spreads.ts)
- ปุ่ม/การ์ด "แชทกับแม่หมอ" หลังอ่านไพ่จบ **มีอยู่แล้ว** ที่ [`TarotFlow.tsx:1237-1269`](../../src/app/TarotFlow.tsx) ลิงก์ตรงไป `/reading/chat` — ข้อ 4 ในโจทย์แทบไม่ต้องทำอะไรเพิ่ม แค่ทำให้เด่นขึ้นสำหรับ flow นี้

**สรุป**: งานนี้เป็น **frontend-only** — ปรับ state machine ใน `TarotFlow.tsx` ให้ข้ามขั้นตอนที่ไม่จำเป็น + เพิ่ม component คัดเลือกหัวข้อใหม่ + เพิ่มข้อมูล spread ต่อหัวข้อ

---

## 4. Flow ใหม่ที่เสนอ

```
[SPREAD_SELECT เดิม]                    [ทำนายด่วน ใหม่]
  Hero กองไพ่ 3D                          4 การ์ดหัวข้อยอดฮิต
  + กริดผัง 20 แบบ         ──แทนที่──▶     (ความรัก/งาน/เงิน/ภาพรวม)
                                          + ลิงก์เล็ก "เลือกผังแบบเต็ม 20 แบบ" (ทางเลือกรอง)
        │                                        │
        ▼                                        ▼
  INTENTION_SELECT                    (ถ้ายังไม่เคยตั้งชื่อเล่น) popover
  (กรอกคำถามเอง)                       ถามชื่อเล่นครั้งเดียวแบบเร็ว
        │                              → จำใน localStorage ไม่ถามซ้ำ
        ▼                                        │
  SHUFFLE ริชวล (หลายวินาที)                     ▼
        │                              เรียก /api/reading/start ทันที
        ▼                              (question = auto-fill ตามหัวข้อ)
  PICK_CARDS (พัด 78 ใบ)                         │
        │                                        ▼
        ▼                              เรียก /api/reading/[id]/shuffle
  READING → SUMMARY                    โดย "ไม่ส่ง" pickedIndices/clientSeed
                                        (server สุ่มให้เอง, ยังคง provably-fair)
                                                  │
                                                  ▼
                                        READING → SUMMARY (โค้ดเดิม 100%)
                                        ไพ่ยังคว่ำหน้า ผู้ใช้แตะพลิกเอง (กฎข้อ 4)
                                                  │
                                                  ▼
                                        การ์ด "แชทกับแม่หมอ" (โค้ดเดิม)
                                        → ทำให้เด่น/ขยับขึ้นบนสำหรับ flow นี้
```

หัวข้อยอดฮิต 4 อัน อิงจาก `Category` ที่มีอยู่แล้ว ([`data/cards/types.ts:13`](../../src/data/cards/types.ts)):

| หัวข้อ | `Category` | คำถาม auto-fill ตัวอย่าง |
| :--- | :--- | :--- |
| ✦ ความรัก | `love` | "ภาพรวมความรักตอนนี้เป็นอย่างไร" |
| ✦ การงาน | `work` | "งานเรื่องนี้จะราบรื่นไหม" |
| ✦ การเงิน | `money` | "การเงินช่วงนี้เป็นอย่างไร" |
| ✦ ภาพรวมดวงวันนี้ | `general` | "ภาพรวมดวงชะตาตอนนี้เป็นอย่างไร" |

---

## 5. มติที่ตัดสินใจแล้ว (จากเจ้าของโปรเจกต์)

ถามและได้คำตอบแล้วในเซสชันวางแผนนี้ — **ไม่ต้องถามซ้ำ**:

1. **หน้าเลือกผังแบบเต็ม (20 ผัง) เดิม** → **เก็บไว้เป็นทางเลือกรอง** ไม่ลบทิ้ง ใส่ลิงก์เล็ก ๆ ให้คนที่อยากพิมพ์คำถามเองหรือเปิดผังหลายใบยังเข้าถึงได้ (เช่น "เลือกผังแบบเต็ม/กำหนดเอง →")
2. **ชื่อเล่นก่อนเริ่มทำนายด่วน** → **ถามครั้งเดียวแบบเร็ว** (popover สั้น ๆ ไม่ใช่ modal เต็มจอ) แล้วจำไว้ (เช่น `localStorage`) ครั้งต่อไปกดหัวข้อแล้วเข้าทำนายได้เลยไม่ต้องถามซ้ำ

---

## 6. รายการงาน (แบ่งเป็นก้อนย่อย)

### 6.1 ข้อมูล — `src/data/spreads.ts`
- เพิ่ม spread ไพ่ 1 ใบ 4 อัน (หรือ reuse โครงจาก `"quick"`/`"daily"`) ผูก `defaultCategory` ตรงหัวข้อ + คำถาม default ต่อหัวข้อ (ดูตารางหัวข้อ 4)
- `credits: 0, guestAllowed: true` เหมือนเดิม (ฟรีไม่กินโควตา หรือให้ทีมตัดสินใจว่ากินโควตาเหมือน `"quick"` เดิมหรือไม่ — **ควรสอบถามเจ้าของโปรเจกต์อีกครั้งถ้าจะต่างจาก `"quick"` เดิม**)
- เพิ่ม id ใหม่เข้า `STANDARD_SPREAD_IDS` ที่ [`limits.ts:33`](../../src/lib/entitlement/limits.ts) ไม่งั้นจะโดนเด้งหน้าปลดล็อกสิทธิ์ (`isStandardSpread` เช็กที่ [`TarotFlow.tsx:466,1030,1042`](../../src/app/TarotFlow.tsx) และ [`api/reading/start/route.ts:121`](../../src/app/api/reading/start/route.ts))

### 6.2 Component ใหม่ — `src/components/reading/QuickFortunePicker.tsx` (ชื่อเสนอ)
- การ์ดหัวข้อ 4 ใบ **ไม่มีภาพไพ่/กองไพ่** — ใช้ไอคอน/สัญลักษณ์ `✦` `✨` เท่านั้น (กฎข้อ 2)
- กดแล้ว trigger callback เดียว `onPickTopic(category)` ให้ `TarotFlow.tsx` จัดการต่อ
- ลิงก์รอง "เลือกผังแบบเต็ม →" ให้สลับไปโชว์ hero + `SpreadCardSelector` เดิม (เก็บ state `viewMode: "quick" | "full"` ใน `TarotFlow.tsx`)

### 6.3 Popover ชื่อเล่นครั้งเดียว
- เช็ก `localStorage` key เช่น `seertarot_nickname` — ถ้ามีแล้วข้ามไปเลย
- ถ้ายังไม่มี โชว์ popover เล็ก (ไม่ใช่เปลี่ยนหน้า) ถามครั้งเดียว บันทึกแล้วใช้ต่อทุกครั้ง (ผู้ใช้แก้ชื่อเล่นทีหลังได้จากบัญชี/prompt เดิมถ้ามี)

### 6.4 State machine — `src/app/TarotFlow.tsx`
- เพิ่ม branch: เมื่อ `onPickTopic(category)` ถูกเรียก → set `selectedSpread`, `selectedCategory`, `question` (auto-fill) → เรียก `handleStartSession` แบบย่อ (ข้าม validation ที่บังคับให้ผู้ใช้พิมพ์คำถามเองที่ [`TarotFlow.tsx:479-487`](../../src/app/TarotFlow.tsx) เพราะ auto-fill ไว้แล้ว)
- หลัง `/api/reading/start` สำเร็จ → **ข้าม** `navigateStep("SHUFFLE")` เดิม แล้วเรียก `/api/reading/[id]/shuffle` ทันทีโดย **ไม่ส่ง** `pickedIndices` (ตามข้อค้นพบข้อ 3) → ได้ `drawnCards` 1 ใบ → `navigateStep("READING")` ตรง ๆ + `startAIStreaming(...)` เหมือน flow เดิม
- คง `RitualStep` type เดิมไว้ไม่ต้องเพิ่ม state ใหม่ (แค่ไม่ผ่าน `SHUFFLE`/`PICK_CARDS` ในเส้นทางนี้) — ตรวจสอบว่า `flow-persistence.ts` resume คืนค่าได้ถูกต้องถ้า user รีเฟรชกลางทาง (ต้องมี `drawnCards` อยู่แล้วก่อนเข้า `READING`)

### 6.5 CTA แชทกับแม่หมอ (ทำให้เด่นขึ้น)
- การ์ดที่ [`TarotFlow.tsx:1237-1269`](../../src/app/TarotFlow.tsx) มีอยู่แล้ว — สำหรับ flow ทำนายด่วน ให้พิจารณาขยับขึ้นเหนือ `StreamReader` หรือเพิ่มปุ่มลอย sticky บนมือถือ เพราะโจทย์เน้น "เข้าแชทได้เลยหลังอ่านไพ่เสร็จ"

### 6.6 คำทำนายสรุปท้ายให้สั้นลง (ถ้าจำเป็น)
- ถ้า prompt ปัจจุบันสำหรับ spread 1 ใบ (`daily`/`quick`) ยาวเกินไปอยู่แล้ว ให้ตรวจ `depth` ใน `src/lib/ai/prompt.ts` ว่าควบคุมความยาวตามจำนวนไพ่จริง — ถ้าพบว่ายาวเกินคาด ค่อยปรับ ไม่ต้องแก้ prompt ล่วงหน้าถ้ายังไม่เห็นปัญหาจริง

---

## 7. กฎเหล็กที่ต้องเคารพ

| กฎ (จาก `CLAUDE.md`) | ผลต่องานนี้ |
| :--- | :--- |
| ข้อ 2 — ห้ามอิโมจิการ์ตูน | การ์ดหัวข้อใช้ `✦`/`✨` เท่านั้น |
| ข้อ 4 — Manual Self-Reveal | ไพ่ 1 ใบที่จั่วมาต้อง**คว่ำหน้า**ใน `READING` เหมือนเดิม ผู้ใช้แตะพลิกเอง **ห้าม auto-flip ให้เพื่อความไว** |
| ข้อ 8 — Single Card Image Pipeline | ถ้าโชว์ภาพไพ่ที่ไหน ต้องผ่าน `<CardImage />` เท่านั้น |
| ข้อ 10 — Human-First Copywriting | ข้อความหัวข้อ/คำถาม auto-fill ต้องเป็นภาษาไทยธรรมชาติ ไม่ใช่ศัพท์ระบบ |
| ข้อ 11 — Multi-Agent Collision Guard | ต้อง `agent:lock` ไฟล์ `TarotFlow.tsx`/`spreads.ts` ก่อนแก้ (ไฟล์ hot ที่ Agent อื่นแตะบ่อย) |
| ข้อ 14 — Zero Fabricated Cards | ไพ่ที่จั่วต้องมาจาก `/api/reading/[id]/shuffle` จริงเท่านั้น ห้าม mock/hardcode ไพ่ล่วงหน้าเพื่อ demo "ทำนายด่วน" |

---

## 8. เกณฑ์ผ่านรายข้อ (Acceptance Criteria)

- [ ] กดหัวข้อใดหัวข้อหนึ่งจาก 4 หัวข้อ → เห็นไพ่คว่ำหน้า 1 ใบภายใน 1 การกดหน้าจอ (ไม่ผ่านหน้าเลือกไพ่/พัดไพ่)
- [ ] ผู้ใช้ใหม่ (ยังไม่เคยตั้งชื่อเล่น) โดนถามชื่อเล่นแค่ครั้งเดียว ครั้งถัดไปไม่ถามซ้ำ
- [ ] แตะไพ่แล้วพลิกเปิดได้เอง (ไม่ auto-reveal)
- [ ] คำทำนายสตรีมออกมา สั้น กระชับ ตรงหัวข้อที่เลือก
- [ ] อ่านจบแล้วมีปุ่ม/การ์ด "แชทกับแม่หมอ" ชัดเจน กดแล้วเข้า `/reading/chat` ได้ทันที
- [ ] ลิงก์ "เลือกผังแบบเต็ม" ยังพาไปยัง flow 20 ผังเดิมได้ครบทุกฟีเจอร์ (ไม่มีอะไรพัง)
- [ ] Provably-Fair proof (SHA-256 commit-reveal) ยังตรวจสอบได้ปกติแม้ไม่มี `pickedIndices`/`clientSeed` จากผู้ใช้
- [ ] `npm run repo:verify` ผ่านครบ 24/24 ด่าน
- [ ] รีเฟรชหน้ากลางทาง (ระหว่างสตรีมคำทำนาย) แล้ว resume กลับมาที่ `READING`/`SUMMARY` ได้ถูกต้อง (ทดสอบผ่าน `flow-persistence.ts`)

---

## 9. ไฟล์ที่เกี่ยวข้องทั้งหมด

| ไฟล์ | ทำอะไร |
| :--- | :--- |
| `src/app/TarotFlow.tsx` | state machine หลัก — จุดแก้เยอะที่สุด |
| `src/data/spreads.ts` | เพิ่ม 4 spread ใบเดียวต่อหัวข้อ |
| `src/lib/entitlement/limits.ts` | เพิ่ม id ใหม่ใน `STANDARD_SPREAD_IDS` |
| `src/components/reading/QuickFortunePicker.tsx` (ใหม่) | UI การ์ดหัวข้อ 4 ใบ |
| `src/components/spread/SpreadCardSelector.tsx` | ไม่ต้องแก้ — ใช้ต่อในโหมด "เลือกผังแบบเต็ม" |
| `src/lib/utils/flow-persistence.ts` | เช็กว่า resume ทำงานถูกต้องกับ flow ที่ข้ามขั้น |
| `src/app/api/reading/[id]/shuffle/route.ts`, `src/lib/tarot/shuffle.ts` | **ไม่ต้องแก้** — รองรับ optional params อยู่แล้ว |

---

## 10. ทางเลือกที่ตัดออกแล้ว (พร้อมเหตุผล)

- ❌ **แทนที่หน้าเลือกผัง 20 แบบทั้งหมด** — เจ้าของโปรเจกต์เลือกเก็บไว้เป็นทางเลือกรอง (ดูมติข้อ 5.1)
- ❌ **ข้าม modal ถามชื่อเล่นไปเลย ใช้ค่า default** — เจ้าของโปรเจกต์เลือกถามครั้งเดียวแบบเร็วแทน (ดูมติข้อ 5.2)
- ❌ **สร้าง API endpoint ใหม่สำหรับ "จั่วไพ่ด่วน"** — ไม่จำเป็น เพราะ endpoint เดิมรองรับ optional params อยู่แล้ว (ดูข้อค้นพบข้อ 3) การสร้างใหม่จะเพิ่มความเสี่ยง/ซ้ำซ้อนโดยไม่จำเป็น
- ❌ **Auto-flip ไพ่ให้เลยเพื่อความไวสูงสุด** — ผิดกฎเหล็กข้อ 4 (Manual Self-Reveal) ชัดเจน ไม่ทำ
