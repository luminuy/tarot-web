# ⚡ แผนฟีเจอร์ "หน้าผลลัพธ์ทำนายด่วน" (Quick Chat Result — แยกจากหน้าฝังใหญ่)

> **สถานะ**: 📝 วางแผนแล้ว รอทีมรับไปทำ (ยังไม่ลงมือแก้โค้ด)
> **ผู้วางแผน**: Claude — 2026-09-05
> **อ้างอิงโค้ดจริงบนบรานช์นี้ ณ วันที่วางแผน**

---

## 📖 สารบัญ

| ส่วน | เนื้อหา |
| :--- | :--- |
| [0](#0-โจทย์และเป้าหมาย) | โจทย์และเป้าหมาย |
| [1](#1-อ่านก่อนแตะโค้ด) | อ่านก่อนแตะโค้ด |
| [2](#2-ปัญหาปัจจุบัน-ทำไมหน้าทำนายด่วนถึงยาว) | ปัญหาปัจจุบัน — ทำไมหน้าทำนายด่วนถึงยาว |
| [3](#3-การค้นพบสำคัญ) | การค้นพบสำคัญ |
| [4](#4-ออกแบบใหม่ที่เสนอ) | ออกแบบใหม่ที่เสนอ |
| [5](#5-มติที่ตัดสินใจแล้วขอบเขตชัดเจน) | มติที่ตัดสินใจแล้ว/ขอบเขตชัดเจน |
| [6](#6-รายการงาน-แบ่งเป็นก้อนย่อย) | รายการงาน (แบ่งเป็นก้อนย่อย) |
| [7](#7-กฎเหล็กที่ต้องเคารพ) | กฎเหล็กที่ต้องเคารพ |
| [8](#8-เกณฑ์ผ่านรายข้อ-acceptance-criteria) | เกณฑ์ผ่านรายข้อ (Acceptance Criteria) |
| [9](#9-ไฟล์ที่เกี่ยวข้องทั้งหมด) | ไฟล์ที่เกี่ยวข้องทั้งหมด |
| [10](#10-ทางเลือกที่ตัดออกแล้ว-พร้อมเหตุผล) | ทางเลือกที่ตัดออกแล้ว (พร้อมเหตุผล) |

---

## 0. โจทย์และเป้าหมาย

เจ้าของโปรเจกต์ตรวจหน้าจอจริงของ flow **"ทำนายด่วน"** (feature ที่เพิ่งสร้างเสร็จใน [`QUICK_FORTUNE_PLAN.md`](QUICK_FORTUNE_PLAN.md)) แล้วพบว่าหลังกดหัวข้อ+เปิดไพ่ 1 ใบ **หน้าผลลัพธ์ที่โชว์ยังเป็นหน้าเดียวกับที่ใช้กับผังใหญ่ (StreamReader)** ซึ่งมีทั้งแท็บ "อ่านรายใบ/สรุปภาพรวม", บทสรุปยาว, คำแนะนำยาว ฯลฯ — **ไม่เหมาะกับคนที่ต้องการความเร็ว**

> คำสั่งต้นฉบับจากเจ้าของโปรเจกต์ (สรุปความ): *"แชทแบบเร็ว (รูปที่ 1) ห้ามใช้หน้าซ้ำกับฝังใหญ่ — ต้องสร้างขึ้นมาใหม่ เพราะคนกลุ่มนี้ต้องการเร็ว เอาสรุปสั้น คำแนะนำสั้น แล้วแชทกับแม่หมอได้เลย (รูปที่ 3-4 คือหน้าที่ตอบยาวเกินไปตอนนี้)"*

**เป้าหมาย**:
1. สร้างหน้า/component ผลลัพธ์ **ใหม่แยกต่างหาก** เฉพาะ flow ทำนายด่วน — ไม่ใช้ `StreamReader` (ตัวที่ออกแบบมาสำหรับผังใหญ่หลายใบ) ซ้ำ
2. บทสรุปคำทำนาย **สั้น กระชับ ได้ใจความ** (ไม่ใช่ 6-9 ประโยคเหมือนตอนนี้)
3. คำแนะนำ **สั้น** (ไม่เกิน 1-2 ข้อ)
4. มีทางเข้าห้อง **แชทกับแม่หมอ** ที่กดถึงได้ทันทีโดยไม่ต้องเลื่อนผ่านเนื้อหายาว
5. ของเดิมที่มีประโยชน์ (Provably-Fair, ให้คะแนนความแม่น, ปรึกษาแม่หมอตัวจริง ฯลฯ) **ไม่ถูกลบทิ้ง** แค่ไม่บังคับให้เห็นทันที

---

## 1. อ่านก่อนแตะโค้ด

ตามระเบียบมาตรฐานของโปรเจกต์ (`CLAUDE.md`) ทีมที่รับงานนี้ต้องอ่านก่อนเริ่ม:

1. [`docs/plans/QUICK_FORTUNE_PLAN.md`](QUICK_FORTUNE_PLAN.md) — **บังคับอ่านก่อน** เพราะแผนนี้คือภาคต่อโดยตรง ต่อยอดจาก flow ที่พลานนั้นสร้างไว้ (spread id `"quick"`, `handleQuickFortuneSelect`)
2. [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) — โดยเฉพาะ INC-0057 (เรื่อง fake card fallback + quick chat chips) และบทเรียนเรื่อง hydration/sizes ของการ์ด
3. [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) — เช็กว่ามีใครแตะ `TarotFlow.tsx` / `StreamReader.tsx` / `prompt.ts` ค้างอยู่ไหม
4. [`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0
5. **กฎเหล็กข้อ 2, 4, 8, 10, 14** ใน `CLAUDE.md` — งานนี้เสี่ยงชนข้อ 4 (Manual Self-Reveal) และข้อ 8 (Single Card Image Pipeline) มากที่สุด เพราะสร้าง component ใหม่ที่โชว์ภาพไพ่

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain reading-flow --files "src/app/TarotFlow.tsx,src/lib/ai/prompt.ts,src/data/spreads.ts" --task "quick-chat-result"
# ...ลงมือ...
npm run repo:verify
npm run pr:auto -- "<title>" --body-file <path>
npm run agent:unlock -- --agent <ชื่อคุณ>
```

---

## 2. ปัญหาปัจจุบัน (ทำไมหน้าทำนายด่วนถึงยาว)

Flow ทำนายด่วนปัจจุบัน (จาก `handleQuickFortuneSelect` ที่ [`TarotFlow.tsx:542`](../../src/app/TarotFlow.tsx)) เดินเข้า step `READING`/`SUMMARY` **เส้นทางเดียวกับผังใหญ่ 100%** ที่ [`TarotFlow.tsx:1310-1395`](../../src/app/TarotFlow.tsx):

```
SpreadBoard (ไพ่คว่ำหน้า แตะพลิกเอง) ─┐
                                      ├─ StreamReader (คอลัมน์ซ้าย 75%)
                                      └─ การ์ดแชทกับแม่หมอ (คอลัมน์ขวา 25%, sticky)
```

`StreamReader.tsx` ([555 บรรทัด](../../src/components/reading/StreamReader.tsx)) ถูกออกแบบมาสำหรับผังใหญ่ (Celtic Cross 10 ใบ ฯลฯ) จึงมี:
- แท็บ **"อ่านรายใบ (N/N)"** + **"สรุปภาพรวม & คำแนะนำ"** — สำหรับไพ่ 1 ใบ การมีแท็บ 2 อันคือส่วนเกินที่ไม่จำเป็น (ไม่มีอะไรให้สลับเปรียบเทียบ)
- แท็บสรุปภาพรวมมี 6 บล็อกต่อกัน: Opening → Connections ("ความเชื่อมโยงของไพ่ทั้งชุด" — ไร้ความหมายเมื่อมีใบเดียว) → Core Summary → Advice Checklist → Oracle Mantra → Elemental Balance → Provably-Fair Panel → Marketplace CTA
- **ต้นตอที่แท้จริงของความยาว**: `src/lib/ai/prompt.ts:194-199` คุมความยาวคำตอบตาม `cardCount` โดย**ผังไพ่น้อยใบกลับได้โควตาความยาวมากสุด**:
  ```ts
  const depth =
    cardCount <= 2
      ? { perCard: "5-7 ประโยค", conn: "4-6 ประโยค", summary: "6-9 ประโยค" }  // ← ทำนายด่วน (1 ใบ) ตกอยู่ตรงนี้!
      : cardCount <= 5
        ? { perCard: "3-4 ประโยค", conn: "4-5 ประโยค", summary: "5-7 ประโยค" }
        : { perCard: "2-3 ประโยค คมชัดตรงแก่น", conn: "4-5 ประโยค", summary: "5-7 ประโยค" };
  ```
  ตรรกะเดิมออกแบบมาเพื่อ "ผังน้อยใบ = อ่านลึกยาวได้เพราะมีเวลาโฟกัสใบเดียว" ซึ่ง**ใช้ได้กับผัง `daily`/`yes-no` ที่ผู้ใช้ตั้งใจมาอ่านเชิงลึก** แต่ **ผิดสมมติฐานสำหรับผู้ใช้ทำนายด่วนที่อยากได้คำตอบไวที่สุด** — นี่คือรูปที่ 3-4 ที่เจ้าของโปรเจกต์ชี้ว่ายาวเกินไป

**สรุป**: ปัญหาไม่ได้อยู่ที่ UI อย่างเดียว แต่อยู่ที่ **AI ถูกสั่งให้เขียนยาวสำหรับผัง 1 ใบโดยเจตนา** (เข้าใจผิดว่าใบเดียว = ต้องลึก) ต้องแก้ทั้ง prompt และ UI คู่กัน

---

## 3. 🔑 การค้นพบสำคัญ

- **ทำนายด่วนใช้ spread id `"quick"` ตัวเดียวทั้ง 4 หัวข้อเสมอ** ([`TarotFlow.tsx:548`](../../src/app/TarotFlow.tsx): `SPREADS.find((s) => s.id === "quick")`) — แยกหัวข้อกันด้วย `category`/`question` เท่านั้น ไม่ใช่แยกด้วย spread คนละอัน ⇒ **แก้ที่จุดเดียว (`spread.id === "quick"`) ครอบคลุมทั้ง 4 หัวข้อทันที** ไม่ต้องแก้ 4 จุด
- **`ReadingContext` ที่ส่งเข้า `buildReadingMessage()` มี `spread` เต็มอ็อบเจกต์อยู่แล้ว** ([`prompt.ts:124-135`](../../src/lib/ai/prompt.ts)) ⇒ เพิ่ม field ใหม่บน `Spread` แล้วอ่านจาก `ctx.spread` ได้เลย ไม่ต้องเพิ่ม parameter ใหม่ผ่าน chain ของฟังก์ชัน
- **`connections`/`advice` render แบบ conditional อยู่แล้ว** ใน `StreamReader.tsx` (`reading?.connections &&`, `reading?.advice && reading.advice.length > 0 &&`) ⇒ ถ้าสั่ง AI ให้คืนค่าว่างสำหรับ `connections` ตอนโหมดด่วน **ไม่ต้องแก้ component ใดเลยเพื่อซ่อนบล็อกนั้น**
- **`SpreadBoard` (กลไกพลิกไพ่คว่ำหน้าด้วยมือ) แยกเป็นคนละ component กับ `StreamReader` (กลไกโชว์ข้อความ) อยู่แล้ว** ที่ [`TarotFlow.tsx:1323`](../../src/app/TarotFlow.tsx) และ `1338` ⇒ **ไม่ต้องแตะ/สร้างใหม่กลไกพลิกไพ่เลย** (เสี่ยงชนกฎข้อ 4 น้อยที่สุดถ้าใช้ของเดิม) งานนี้แค่สลับสิ่งที่อยู่ในคอลัมน์ข้อความ (StreamReader ↔ component ใหม่) เท่านั้น
- **`CollapsibleCard`** ([`CollapsibleCard.tsx`](../../src/components/reading/CollapsibleCard.tsx)) มีอยู่แล้วและถูกใช้ใน `StreamReader.tsx:490,497` สำหรับ "ยุบส่วนรองไม่ให้หน้ายาวเกินไป" พอดีกับโจทย์นี้เป๊ะ ⇒ **reuse ได้ทันที ไม่ต้องสร้าง accordion ใหม่**
- **การ์ดสติกกี้ "แชทออนไลน์กับแม่หมอ" ฝั่งขวา** ([`TarotFlow.tsx:1358-1385`](../../src/app/TarotFlow.tsx)) เป็น markup ที่อยู่ **นอก** `StreamReader` (อยู่ใน `TarotFlow.tsx` โดยตรง คนละ column) ⇒ **ใช้ต่อได้ทั้งสอง flow โดยไม่ต้องแตะ** — งานที่ต้องเพิ่มคือแค่ปุ่มลัดตัวที่สองในคอลัมน์ซ้ายสำหรับจอมือถือ (ดูข้อ 6.6)
- **ระบบประวัติ/ให้คะแนนแม่นไหม (`saveReading`, `AccuracyRatingWidget`)** ทำงานอยู่ใน `TarotFlow.tsx` และเป็น generic ไม่ผูกกับ component แสดงผล ⇒ **สลับ StreamReader → component ใหม่ ไม่กระทบระบบนี้เลย** (ตราบใดที่ยังคง import + render `<AccuracyRatingWidget>` ในหน้าใหม่)

**สรุป**: งานนี้เป็น **frontend + prompt-only** เช่นเดียวกับแผนก่อนหน้า ไม่ต้องแตะ backend/schema การจั่วไพ่/entitlement เลย

---

## 4. ออกแบบใหม่ที่เสนอ

### 4.1 จุดตัดสินสำคัญ: "สร้างใหม่" หมายถึง component ใหม่ ไม่ใช่ route/state machine ใหม่

เจ้าของโปรเจกต์บอกว่า **"ต้องสร้างขึ้นมา"** — ตีความและเสนอว่า **สร้าง component แสดงผลใหม่ (`QuickChatResult.tsx`) มาแทนที่ `StreamReader` เฉพาะตอน `spread.id === "quick"`** โดย **ยังอยู่ใน state machine เดิมของ `TarotFlow.tsx`** (ไม่ทำ route แยก เช่น `/reading/quick-result`) เพราะ:
- Session/Entitlement/Provably-Fair/History/Chat-persistence-boundary ทั้งหมดผูกอยู่กับ state machine เดิมที่ทดสอบแล้วว่าทำงานถูกต้อง (ดูข้อค้นพบข้อ 3 ใน `QUICK_FORTUNE_PLAN.md`)
- แยก route ใหม่ = ต้อง reimplement กลไกพวกนี้ซ้ำ เสี่ยงบั๊ก/ดริฟต์สองระบบขนานกัน โดยไม่ได้ประโยชน์เพิ่มจากมุมผู้ใช้ (ผู้ใช้ไม่รู้และไม่สนว่าเบื้องหลังเป็น route เดียวกันหรือคนละ route)
- "หน้าใหม่" ในทางที่ผู้ใช้สัมผัสได้คือ **สิ่งที่เห็นบนจอเปลี่ยนไปทั้งหมด** (ไม่มีแท็บ ไม่มีบทสรุปยาว) ซึ่ง component ใหม่ทำได้ครบโดยไม่ต้องแยก route

> ถ้าทีมที่รับงานเห็นต่างและอยากแยก route จริง ๆ ให้กลับมาคุยกับเจ้าของโปรเจกต์ก่อน เพราะเปลี่ยนสมมติฐานความเสี่ยงทั้งแผน

### 4.2 โครงหน้าใหม่ `QuickChatResult`

```
┌───────────────────────────────────────────┐
│ SpreadBoard (ของเดิม ไม่แตะ) — ไพ่คว่ำหน้า/พลิกได้  │
└───────────────────────────────────────────┘
┌─────────────────────────────┐  ┌───────────┐
│ 🆕 QuickChatResult             │  │ การ์ดแชทกับ │
│  · แถบสถานะแม่หมอ (บรรทัดเดียว)   │  │ แม่หมอ (เดิม│
│  · ชื่อไพ่ + หัวข้อพาดหัวสั้น        │  │  ไม่แตะ)     │
│  · คำตอบสั้น 2-3 ประโยค (เด่นสุด) │  │  sticky      │
│  · คำแนะนำ ≤ 2 ข้อ               │  └───────────┘
│  · 🆕 ปุ่ม "คุยกับแม่หมอต่อ" (มือถือ) │
│  · AccuracyRatingWidget (เดิม)   │
│  ▸ ดูรายละเอียดเพิ่มเติม (ยุบ)     │
│     - คำคมพลังใจ (เดิม)            │
│     - สมดุล 4 ธาตุ (เดิม)          │
│     - Provably-Fair proof (เดิม)  │
│     - ปรึกษาแม่หมอตัวจริง (เดิม)     │
└─────────────────────────────┘
```

**ไม่มีแท็บ "อ่านรายใบ / สรุปภาพรวม"** — เพราะมีไพ่ใบเดียว ไม่มีอะไรให้สลับดู เนื้อหาการอ่านไพ่ใบนั้น = คำตอบหลักไปเลย

### 4.3 ปรับ prompt ให้สั้นลงจริงสำหรับโหมดด่วน (ไม่ใช่แค่ซ่อนใน UI)

เพิ่ม field ใหม่บน `Spread` (`src/data/spreads.ts`):

```ts
export interface Spread {
  // ...ของเดิมทั้งหมด...
  /** ใช้กับ UI ผลลัพธ์แบบไหน — ไม่ระบุ = "full" (StreamReader เดิม) */
  resultStyle?: "quick" | "full";
}
```

ตั้ง `resultStyle: "quick"` ให้เฉพาะ spread `id: "quick"` เท่านั้น (ไม่แตะ `daily`/อื่น ๆ — ดูเหตุผลในข้อ 5)

ใน `src/lib/ai/prompt.ts` ปรับ logic คำนวณ `depth` ให้ **เช็ก `resultStyle` ก่อนเช็ก `cardCount`**:

```ts
const depth =
  spread.resultStyle === "quick"
    ? { perCard: "2-3 ประโยคสั้น ตรงประเด็นที่สุด", conn: "ข้าม (ผังนี้มีใบเดียว ไม่ต้องมีบทสนทนาข้ามใบ)", summary: "2-3 ประโยคสั้น ชัดเจน ตอบตรงคำถามทันที" }
    : cardCount <= 2
      ? { perCard: "5-7 ประโยค", conn: "4-6 ประโยค", summary: "6-9 ประโยค" }
      : cardCount <= 5
        ? { perCard: "3-4 ประโยค", conn: "4-5 ประโยค", summary: "5-7 ประโยค" }
        : { perCard: "2-3 ประโยค คมชัดตรงแก่น", conn: "4-5 ประโยค", summary: "5-7 ประโยค" };
```

เพิ่มคำสั่งชัดเจนในบล็อก "รูปแบบผลลัพธ์" ท้าย prompt (เฉพาะตอน `resultStyle === "quick"`):
- `"connections": ""` (สตริงว่าง — ไม่ต้องเขียนบทสนทนาข้ามใบเพราะมีใบเดียว)
- `advice` จำกัด **สูงสุด 2 ข้อ** (1 micro-action + 1 กิจกรรมฝึกสติ) ไม่ใช่ 3 ข้อเหมือน default
- ย้ำ 1 บรรทัดว่า **"นี่คือโหมดทำนายด่วน ผู้ถามต้องการคำตอบไวและตรงประเด็นที่สุด ห้ามเขียนยาวเกินสเปก"**

`connections`/`advice.length <= 2` ที่ render แบบ conditional เดิมใน UI จะซ่อนบล็อกที่ไม่จำเป็นให้อัตโนมัติโดยไม่ต้องแก้เงื่อนไข render เพิ่ม

### 4.4 ปุ่มแชทกับแม่หมอ — เพิ่มจุดเข้าที่สองสำหรับมือถือ

การ์ดสติกกี้ฝั่งขวาที่มีอยู่แล้ว ([`TarotFlow.tsx:1358-1385`](../../src/app/TarotFlow.tsx)) ใช้ grid `lg:col-span-1` ⇒ **บนจอมือถือมันจะตกไปอยู่ใต้เนื้อหาทั้งหมดของคอลัมน์ซ้าย** (จอเล็ก `grid-cols-1` เรียงบนลงล่าง) ซึ่งเดิมทีคอลัมน์ซ้ายยาวมาก (StreamReader) ผู้ใช้กว่าจะเลื่อนไปเจอปุ่มแชทต้องผ่านเนื้อหายาว ๆ ก่อน — พอ `QuickChatResult` สั้นลงมากแล้ว ปัญหานี้เบาลงเองส่วนหนึ่ง แต่เพื่อให้ตรงกับโจทย์ **"แชทกับแม่หมอได้เลย"** ให้เพิ่มปุ่มลัดขนาดกะทัดรัดต่อท้ายบล็อก "คำแนะนำ" ใน `QuickChatResult` เอง (ก่อนถึง `AccuracyRatingWidget`) ลิงก์ไป `/reading/chat` เหมือนกับของเดิม — **ไม่ใช่การซ้ำซ้อนที่ไร้เหตุผล** เพราะการ์ดฝั่งขวาบนจอ desktop ก็ยังอยู่ sticky ให้เห็นตลอดอยู่ดี ปุ่มนี้เสริมเฉพาะเคสจอมือถือที่มันหลุดจอ

---

## 5. มติที่ตัดสินใจแล้ว/ขอบเขตชัดเจน

1. **ขอบเขตเฉพาะ spread id `"quick"` เท่านั้น** (4 หัวข้อทำนายด่วน) — **ไม่รวม** `"daily"` (ดวงรายวัน 1 ใบ) หรือผัง 1 ใบอื่นที่ผู้ใช้เลือกจากกริด 20 ผังแบบเต็มด้วยตัวเอง เพราะผู้ใช้ที่เข้าทางกริดเต็มตั้งใจอยากได้ประสบการณ์เชิงลึกอยู่แล้ว (เข้าทาง `INTENTION_SELECT` ปกติ พิมพ์คำถามเอง) — ถ้าอนาคตอยากขยายให้ `daily` สั้นลงด้วย ต้องเป็นงานแยกที่ถามเจ้าของโปรเจกต์ก่อน (เปลี่ยนพฤติกรรมของฟีเจอร์ที่มีผู้ใช้คุ้นเคยอยู่แล้ว)
2. **ไม่แยก route ใหม่** — ใช้ state machine เดิมของ `TarotFlow.tsx` สลับแค่ component แสดงผล (เหตุผลเต็มในข้อ 4.1)
3. **ไม่ลบฟีเจอร์รอง (Provably-Fair/Mantra/Elemental/Marketplace CTA) ทิ้งถาวร** — ย้ายไปอยู่ใน `CollapsibleCard` แบบยุบเริ่มต้น (ผู้ใช้แตะเปิดเองถ้าอยากเห็น) แทนการลบ ตรงกับคำขอ "สั้น" ไม่ใช่ "ตัดฟีเจอร์"
4. **`AccuracyRatingWidget` ต้องยังโชว์แบบไม่ยุบ** (ไม่ซ่อนใน accordion) เพราะเป็น feedback loop หลักที่ `QUICK_FORTUNE_PLAN.md` ระบุไว้เป็นเกณฑ์ผ่านแล้ว ห้ามถอยหลัง

---

## 6. รายการงาน (แบ่งเป็นก้อนย่อย)

### 6.1 ข้อมูล — `src/data/spreads.ts`
- เพิ่ม field `resultStyle?: "quick" | "full"` บน `interface Spread`
- ตั้ง `resultStyle: "quick"` ให้ spread `id: "quick"` (บรรทัด ~52-60) เท่านั้น

### 6.2 Prompt engine — `src/lib/ai/prompt.ts`
- แก้ logic คำนวณ `depth` ที่บรรทัด ~192-199 ให้เช็ก `spread.resultStyle === "quick"` ก่อน (ดูโค้ดตัวอย่างในข้อ 4.3)
- เพิ่มคำสั่งในบล็อก JSON schema ท้าย prompt ให้ `connections` เป็นค่าว่างและ `advice` ≤ 2 ข้อ เมื่อเป็นโหมดด่วน (ใช้ conditional string ต่อท้าย template เดิม ไม่ต้องเปลี่ยนโครงสร้าง JSON schema หลัก)
- **ห้ามเปลี่ยนคีย์ JSON ใด ๆ** (`opening`/`cards`/`connections`/`summary`/`advice`/`timing`/`mood`/`yesNoAnswer`) — เปลี่ยนแค่ "ความยาวที่ขอ" เพื่อไม่กระทบ parser/schema ฝั่ง backend ที่ใช้ร่วมกับผังอื่น

### 6.3 Component ใหม่ — `src/components/reading/QuickChatResult.tsx`
- Props เหมือน `StreamReaderProps` (reuse interface เดิมได้เลย หรือ subset: `reading`, `persona`, `isStreaming`, `drawnCards`, `readingId`, `proof`, `errorMsg`, `onRetry`) — **ไม่ต้องมี** `activeCardIndex`/`onSelectCardIndex` (ไม่มีหลายใบให้สลับ)
- โครงสร้างตามข้อ 4.2: แถบสถานะแม่หมอ (ย่อจาก header เดิมของ `StreamReader`) → ชื่อไพ่+หัวตั้ง/กลับ (ใช้ `<CardImage />` ถ้าโชว์ภาพซ้ำ — กฎข้อ 8) → `reading.cards[0].headline` + `reading.cards[0].reading` (ตัวใหญ่เด่นสุดของหน้า) → `reading.advice` (checklist ≤ 2 ข้อ) → ปุ่มลัดแชท (ข้อ 4.4) → `AccuracyRatingWidget` (import ตรงจาก `./AccuracyRatingWidget` เหมือนเดิม) → `CollapsibleCard` ห่อ `OracleMantraCard` + `ElementalBalanceWidget` + `ProvablyFairPanel` + Marketplace CTA (คัดลอก markup เดิมจาก `StreamReader.tsx:488-537` มาใช้ซ้ำ)
- Error banner: คัดลอก markup เดิมจาก `StreamReader.tsx:176-203` มาใช้เหมือนกัน (คงพฤติกรรม retry/reload เดิม 100% — ห้ามคิดข้อความใหม่)
- **ห้าม hardcode/mock ไพ่หรือข้อความคำทำนายใด ๆ** — ทุกอย่างอ่านจาก `reading`/`drawnCards` ที่ส่งเข้ามาเท่านั้น ถ้า `cardData` ว่าง ให้โชว์ปุ่ม "โหลดใหม่อีกครั้ง" เหมือน `StreamReader` (กฎข้อ 14)

### 6.4 Wiring — `src/app/TarotFlow.tsx`
- ที่บล็อก `STEP 5 & 6` (~[`TarotFlow.tsx:1336-1352`](../../src/app/TarotFlow.tsx)) เปลี่ยนจาก render `<StreamReader ... />` แบบตรง ๆ เป็น:
  ```tsx
  {selectedSpread.resultStyle === "quick" ? (
    <QuickChatResult {...sharedProps} />
  ) : (
    <StreamReader {...sharedProps} activeCardIndex={activeCardIndex} onSelectCardIndex={setActiveCardIndex} />
  )}
  ```
- `<SpreadBoard>` (hero row) และ `<aside>` การ์ดแชทฝั่งขวา **ไม่ต้องแก้เลย** ใช้ร่วมกันทั้งสอง flow ตามเดิม

### 6.5 QA เฉพาะกิจ (ไม่ต้องเขียนโค้ดใหม่ แค่ทดสอบ)
- ยืนยันว่า `daily`/ผัง 1 ใบอื่นที่ไม่ใช่ `"quick"` ยังเห็น `StreamReader` เดิมทุกอย่าง (regression guard ตามมติข้อ 5.1)
- ยืนยันว่ารีเฟรชหน้ากลางทาง (`flow-persistence.ts`) แล้ว resume กลับมาที่ `QuickChatResult` ถูกต้อง (ไม่ resume ไปโผล่ที่ `StreamReader`ผิดที่)
- ยืนยันว่าบันทึกเข้า "ประวัติ" (`ReadingHistoryModal`) ยังทำงานปกติ ไม่กระทบเพราะไม่ได้แตะ `saveReading()`

---

## 7. กฎเหล็กที่ต้องเคารพ

| กฎ (จาก `CLAUDE.md`) | ผลต่องานนี้ |
| :--- | :--- |
| ข้อ 2 — ห้ามอิโมจิการ์ตูน | UI ใหม่ใช้ `✦`/`✨` เท่านั้น เหมือนของเดิม |
| ข้อ 4 — Manual Self-Reveal | ไม่แตะ `SpreadBoard` เลย ไพ่ยังคว่ำหน้าให้แตะพลิกเองเหมือนเดิม 100% |
| ข้อ 8 — Single Card Image Pipeline | ภาพไพ่ใน `QuickChatResult` (ถ้ามี) ต้องผ่าน `<CardImage />` เท่านั้น |
| ข้อ 10 — Human-First Copywriting | คำตอบสั้นต้องยังเป็นภาษาไทยธรรมชาติ ไม่ใช่ตัดจนห้วนแข็งทื่อ |
| ข้อ 11 — Multi-Agent Collision Guard | ต้อง `agent:lock` ไฟล์ `TarotFlow.tsx`/`prompt.ts`/`spreads.ts` ก่อนแก้ (ไฟล์ hot) |
| ข้อ 14 — Zero Fabricated Cards | `QuickChatResult` ห้ามมี fallback ไพ่ปลอมใด ๆ — ไม่พบข้อมูลต้องขึ้น "โหลดใหม่อีกครั้ง" เท่านั้น |

---

## 8. เกณฑ์ผ่านรายข้อ (Acceptance Criteria)

- [ ] กดหัวข้อทำนายด่วน (1 ใน 4) → เปิดไพ่ → หน้าผลลัพธ์เป็น `QuickChatResult` **ไม่ใช่** `StreamReader` (ไม่มีแท็บ "อ่านรายใบ/สรุปภาพรวม")
- [ ] คำตอบหลักยาว ~2-3 ประโยค (วัดจากเอาต์พุตจริงหลายรอบ ไม่ใช่แค่ดูสเปก prompt) คำแนะนำไม่เกิน 2 ข้อ
- [ ] ไม่มีบล็อก "ความเชื่อมโยงของไพ่ทั้งชุด" โผล่มาให้เห็น (เพราะมีใบเดียว)
- [ ] มีปุ่ม/ลิงก์ "คุยกับแม่หมอต่อ" ที่กดถึงได้ **โดยไม่ต้องเลื่อนผ่านเนื้อหายาว** ทั้งบนจอมือถือและ desktop
- [ ] แตะไพ่แล้วพลิกเปิดได้เองเหมือนเดิม (ไม่ auto-reveal) — ทดสอบว่า `SpreadBoard` ไม่ถูกแก้พฤติกรรม
- [ ] เปิด "ดูรายละเอียดเพิ่มเติม" แล้วยังเห็น Provably-Fair proof / คำคมพลังใจ / สมดุล 4 ธาตุ / ปรึกษาแม่หมอตัวจริง ครบเหมือนเดิม (ยุบไว้ ไม่ได้หายไป)
- [ ] `AccuracyRatingWidget` ให้คะแนน 1-5 ยังโชว์แบบไม่ยุบ ทำงานปกติ
- [ ] อ่านทำนายด่วนจบแล้ว รายการยังปรากฏใน "ประวัติ" ครบ (คำถาม/หัวข้อ/ไพ่/บทสรุป) เหมือนก่อนแก้ (regression check กับเกณฑ์เดิมใน `QUICK_FORTUNE_PLAN.md`)
- [ ] เลือกผัง `"daily"` หรือผังอื่นจากกริดเต็ม 20 ผัง (รวมผัง 1 ใบ) → ยังเห็น `StreamReader` แบบเดิมทุกอย่าง ไม่ถูกกระทบ
- [ ] รีเฟรชหน้ากลางทางแล้ว resume ถูกต้องตรง component (`QuickChatResult` สำหรับ `"quick"`, `StreamReader` สำหรับอย่างอื่น)
- [ ] `npm run repo:verify` ผ่านครบทุกด่าน

---

## 9. ไฟล์ที่เกี่ยวข้องทั้งหมด

| ไฟล์ | ทำอะไร |
| :--- | :--- |
| `src/data/spreads.ts` | เพิ่ม field `resultStyle` บน `Spread` + ตั้งค่าให้ spread `"quick"` |
| `src/lib/ai/prompt.ts` | เพิ่ม branch ความยาวสั้นสำหรับ `resultStyle === "quick"` (บรรทัด ~192-199 และบล็อก schema ท้ายไฟล์) |
| `src/components/reading/QuickChatResult.tsx` (ใหม่) | UI ผลลัพธ์แบบสั้น เฉพาะทำนายด่วน |
| `src/app/TarotFlow.tsx` | สลับ render `StreamReader`/`QuickChatResult` ตาม `selectedSpread.resultStyle` ที่ step `READING`/`SUMMARY` |
| `src/components/reading/StreamReader.tsx` | **ไม่ต้องแก้** — ยังใช้กับผังใหญ่/ผังอื่นทุกอันเหมือนเดิม (อ้างอิง markup มา copy ใช้ใน component ใหม่เท่านั้น) |
| `src/components/reading/CollapsibleCard.tsx`, `OracleMantraCard.tsx`, `ElementalBalanceWidget.tsx`, `ProvablyFairPanel.tsx`, `AccuracyRatingWidget.tsx` | **ไม่ต้องแก้** — reuse ตรง ๆ ใน component ใหม่ |
| `src/components/reading/QuickFortunePicker.tsx`, `src/app/api/reading/*` | **ไม่ต้องแก้** — จุดเข้า flow และ backend เดิมทำงานถูกต้องอยู่แล้ว |
| `src/lib/utils/flow-persistence.ts`, `src/lib/utils/history.ts` | **ไม่ต้องแก้** — แค่ทดสอบว่า resume/บันทึกประวัติยังทำงานถูกต้องกับ component ใหม่ |

---

## 10. ทางเลือกที่ตัดออกแล้ว (พร้อมเหตุผล)

- ❌ **แยก route ใหม่ทั้งหมด** (เช่น `/reading/quick-result`) — เสี่ยงต้อง reimplement session/entitlement/provably-fair/history logic ซ้ำ เพิ่มพื้นผิวบั๊กโดยไม่ได้ประโยชน์เพิ่มจากมุมผู้ใช้ (ดูข้อ 4.1)
- ❌ **ลบ Provably-Fair panel / Elemental widget / Mantra card / Marketplace CTA ทิ้งถาวร** — เจ้าของโปรเจกต์อยากได้ "สั้นกระชับ" ไม่ใช่ "ตัดฟีเจอร์" จึงเลือกยุบเก็บใน `CollapsibleCard` แทนการลบ (ดูมติข้อ 5.3)
- ❌ **ตัดทอนข้อความยาวด้วย JavaScript ฝั่ง client (string truncate)** — เสี่ยงตัดกลางประโยคจนอ่านไม่รู้เรื่อง/ผิดความหมาย ควรคุมความยาวที่ prompt เป็นหลักเท่านั้น (ดูข้อ 4.3)
- ❌ **ขยายให้ `resultStyle: "quick"` ครอบคลุมผัง `"daily"` หรือผัง 1 ใบอื่นไปด้วยเลย** — เจ้าของโปรเจกต์ยังไม่ได้ขอ ขอบเขตนี้เจาะจงเฉพาะ 4 หัวข้อทำนายด่วนก่อน กันการเปลี่ยนพฤติกรรมของฟีเจอร์ `daily` ที่ผู้ใช้คุ้นเคยอยู่แล้วโดยไม่จำเป็น (ดูมติข้อ 5.1)
- ❌ **เปลี่ยนคีย์ JSON schema ของ AI ให้ต่างกันระหว่างโหมด** (เช่น รวม `cards[0].reading` กับ `summary` เป็นฟิลด์เดียว) — เพิ่มความเสี่ยงต่อ parser/backend ที่ใช้ schema เดียวกันร่วมกับผังอื่นทั้งหมด ได้ประโยชน์ไม่คุ้มความเสี่ยง แค่คุมความยาวก็พอ
