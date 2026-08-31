# 🔮 สถาปัตยกรรมระบบเว็บดูดวงไพ่ทาโรต์ (Tarot Web Architecture)

เอกสารฉบับนี้สรุปภาพรวมทางสถาปัตยกรรม เทคโนโลยี กฎเหล็ก และสถานะปัจจุบันของระบบ เพื่อให้ทีมพัฒนาและ AI Agents (Gemini / Antigravity / Claude) สามารถทำงานต่อยอดได้อย่างไร้รอยต่อ

---

## 1. ปรัชญาและกฎเหล็กของระบบ (Core Principles)

1. **AI ไม่เคยเป็นคนจั่วไพ่ (AI Never Draws Cards)**:
   - ไพ่ต้องถูกกำหนดโดยการกระทำจริงของผู้ใช้ (สัมผัส/เลือกไพ่/สับไพ่) ร่วมกับระบบสุ่มที่ตรวจสอบได้ (Provably Fair)
   - โมเดล AI ทำหน้าที่เป็น **"ผู้อ่านและตีความ (Reader)"** ตามตำแหน่งและหน้าไพ่จริงเท่านั้น ห้ามแต่งไพ่เพิ่ม ห้ามเปลี่ยนไพ่
2. **ผู้ใช้เป็นผู้เลือกไพ่ด้วยตนเอง (Interactive Self-Drawing UX)**:
   - ผู้ใช้ต้องได้ความรู้สึกเสมือนนั่งอยู่หน้าโต๊ะแม่หมอจริง: ตั้งจิตอธิษฐาน -> สับไพ่ -> คลี่สำรับ (Card Fan) -> ใช้มือ/เคอร์เซอร์สัมผัสและดึงไพ่ทีละใบลงตำแหน่ง Spread
3. **ความโปร่งใสที่ตรวจสอบได้ (Commitment & Verification)**:
   - ใช้ระบบ **Commit–Reveal** ด้วย SHA-256: เซิร์ฟเวอร์สร้าง `serverSeed` และส่งแฮช `commitment` ให้ผู้ใช้ก่อนเริ่มแตะไพ่
   - หลังอ่านเสร็จ เซิร์ฟเวอร์เฉลย `serverSeed` ให้ผู้ใช้ตรวจคำนวณย้อนหลังได้ 100% ว่าไม่มีการสับเปลี่ยนไพ่
4. **ความปลอดภัยและจริยธรรม (Safety & Ethics)**:
   - มีระบบคัดกรองคำถามอันตราย (การแพทย์/การตาย/การพนัน/คดีความ/เรื่องผิดศีลธรรมร้ายแรง) ก่อนส่งเข้า AI
   - AI จะไม่ทำนายอนาคตแบบตายตัว แต่ให้แนวทาง มุมมอง และสิ่งที่ผู้ใช้ลงมือทำได้จริง (Actionable Advice)

---

## 2. โครงสร้าง Tech Stack

| ส่วนประกอบ | เทคโนโลยีที่ใช้ | วัตถุประสงค์ |
|---|---|---|
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript | Core Web Framework & API Routes |
| **Styling** | Tailwind CSS v4 + PostCSS | Theme: Mystical Night Sky & Old Gold |
| **Animation** | Motion (Framer Motion v13) | Interactive Card Fan, Flip 3D, Layout Transitions |
| **Database & ORM** | PostgreSQL + Prisma ORM 7 (ออกแบบ schema ไว้แล้ว ยังไม่ต่อใช้จริง — ปัจจุบันใช้ `server/store.ts` in-memory แทน) | User Data, Credits Ledger, Journal, Readings |
| **AI LLM Engine** | **Google Gemini (`gemini-3.7-flash`, หลัก)** ผ่าน raw `fetch` streaming — Claude (`lib/ai/claude.ts`) เขียนไว้ตามสถาปัตยกรรมเดียวกันแต่ปัจจุบันไม่ได้ถูกเรียกใช้จริง (เก็บไว้เป็น reference/mock fallback) | Streaming Interpretation via SSE ด้วย Structured Output |
| **Schema Validation** | Zod v4 | API Request/Response & Structured Output Schemas |

---

## 3. ผังสถานะการเปิดไพ่ (Reading Flow State Machine)

```
[1. ตั้งคำถาม/เลือกหมวด/แม่หมอ] 
              ↓
[ตรวจ Safety & สร้าง Commitment] 
              ↓
[2. ผู้ใช้สับไพ่ & สำรับคลี่ออกเป็นพัด (Interactive Fan 78 ใบ)] 
              ↓
[3. ผู้ใช้เอามือ/เมาส์สัมผัสเลือกไพ่ทีละใบด้วยตัวเอง] 
              ↓
[4. ไพ่ลอยเข้าไปจัดวางในตำแหน่งผัง Spread] 
              ↓
[5. พลิกไพ่ 3D พร้อม AI ทยอยสตรีมคำอ่านทีละใบ (SSE)] 
              ↓
[6. สรุปภาพรวม คำแนะนำ และเฉลย Server Seed ตรวจสอบความสุ่ม] 
              ↓
[7. ถามคุยต่อยอด (Follow-up) หรือบันทึกดวง (Journal)]
```

### 3.1 ผัง Engine เบื้องหลัง (Backend Pipeline)

มุมมองเดียวกับข้างบน แต่มองจากฝั่งเซิร์ฟเวอร์ว่าแต่ละ "เอนจิน" คือไฟล์ไหนจริง —
**Safety Engine ทำงาน "ก่อน" RNG Engine เสมอ** (ไม่ใช่ขนานกัน) เพราะถ้าคำถาม
ถูก block ต้องไม่เสียเวลาสร้าง commitment เลย:

```
                    TAROT ENGINE
                         │
              ┌──────────┴──────────┐
              │                     │
        Safety Engine           RNG Engine
     lib/safety/guardrails.ts  lib/tarot/shuffle.ts
              │                     │
        checkQuestion()      createCommitment()
        (ทำงานก่อนเสมอ ─────▶  (ทำงานเมื่อคำถามผ่านแล้วเท่านั้น)
         block ได้ที่ตรงนี้)         │
                                     ↓
                              Shuffled Deck
                          (drawCards, ยังไม่จั่ว
                           จนกว่าจะถึงขั้น shuffle)
                                     │
                                     ↓
                            Interactive Fan
                     components/deck/InteractiveCardFan.tsx
                                     │
                              User Pick Card
                                     │
                                     ↓
                             Pick Validation
                        drawCards({ pickedIndices })
                     กันไพ่ซ้ำ + กันจำนวนไม่ตรง spread
                                     │
                                     ↓
                              Spread Engine
                    data/spreads.ts + SpreadBoard.tsx
                       (แปะไพ่ที่จั่วได้ลงตำแหน่งจริง)
                                     │
                                     ↓
                             Reading Engine
                             lib/ai/prompt.ts
                (buildSystemPrompt + buildReadingMessage
                 ผูกไพ่ + ตำแหน่ง + บริบทคำถามเป็น prompt เดียว)
                                     │
                                     ↓
                           Gemini Stream (ปัจจุบัน)
                            lib/ai/gemini.ts
                    (โครงเดียวกับ lib/ai/claude.ts ที่เขียน
                     ไว้รองรับ แต่ยังไม่ได้ใช้งานจริง)
                                     │
                                     ↓
                          Structured Reading
                          lib/schema/reading.ts
              (ตรวจ/แปลง JSON ที่ stream มาให้ตรง ReadingSchema
               ก่อนส่งกลับ SSE ให้ frontend)
```

---

## 4. โครงสร้างฐานข้อมูลและการเงิน (Data & Credits Model)

- **User**: เก็บข้อมูลผู้ใช้, เครดิตคงเหลือ (`creditBalance`), บุคลิกแม่หมอที่ชอบ (`preferredPersona`)
- **CreditLedger**: บัญชีเดินสะพัด ป้องกันยอดเงินสูญหายและป้องกัน Race Condition ด้วย `@@unique([userId, reason, refId])`
- **Reading**: เก็บบันทึกการเปิดไพ่, `commitment`, `serverSeed`, `drawnCards`, `safetyFlag`, `result (JSON)`, และสถิติ Token
- **ChatMessage**: การสนทนาถามต่อยอด (Follow-up Question) โดยอ้างอิงเฉพาะไพ่ชุดเดิม
- **JournalEntry**: สมุดบันทึกติดตามผล (Outcome tracking) เพื่อเพิ่มความผูกพันและคุณค่าสะสมของผู้ใช้

---

## 5. แฟ้มข้อมูลหลักใน Codebase (File Directory Structure)

```text
src/
├── app/
│   ├── api/reading/
│   │   ├── start/route.ts           # เริ่มต้นรอบ ตรวจ safety และสร้าง commitment
│   │   ├── [id]/shuffle/route.ts    # สับไพ่ / รับ pickedIndices จากพัดไพ่ / ยืนยันตำแหน่งไพ่
│   │   ├── [id]/read/route.ts       # สตรีมคำอ่านผ่าน Server-Sent Events (SSE)
│   │   └── [id]/chat/route.ts       # ถามคุยต่อยอดหลังเปิดไพ่แล้ว
│   ├── privacy/page.tsx            # นโยบายความเป็นส่วนตัว (PDPA)
│   ├── page.tsx                    # หน้าหลัก — ประกอบ flow ทั้ง 5 ขั้นตอน
│   ├── globals.css                 # โทนสี starry sky, 3D card perspective, CSS card-back
│   └── layout.tsx                  # Root Layout + Thai Web Fonts
├── components/                     # (คอมโพเนนต์หลัก)
│   ├── card/                       # TarotCard 3D, CardZoomModal, CardImage (Responsive WebP)
│   ├── deck/                       # InteractiveCardFan, ShuffleRitual
│   ├── spread/                     # SpreadBoard, SpreadCardSelector
│   ├── reading/                    # StreamReader, FollowUpChat, ShareModal, PersonaCardSelector,
│   │                               #   IntentionAltarInput, AccuracyRatingWidget
│   ├── history/, journal/          # ReadingHistoryModal, JournalModal, JournalHistoryDrawer
│   ├── encyclopedia/                # TarotEncyclopediaModal (คัมภีร์ไพ่ 78 ใบ)
│   └── ui/                         # RitualStepProgress, GalaxyCanvas, MysticAltarCanvas, TarotArtIcons
├── data/
│   ├── cards/                      # ข้อมูลไพ่ 78 ใบ (Major, Cups, Swords, Wands, Pentacles)
│   ├── spreads.ts                  # ข้อมูลรูปแบบการวางไพ่ 10 แบบ
│   └── personas.ts                 # แม่หมอ 3 บุคลิก (ใจดี, พูดตรง, สายพลัง)
├── lib/
│   ├── ai/
│   │   ├── claude.ts               # Anthropic SDK Streaming Client (เขียนไว้ ยังไม่ใช้จริง)
│   │   ├── gemini.ts               # Google Gemini Streaming Client (ใช้งานจริง)
│   │   └── prompt.ts               # Structured System & User Prompts
│   ├── schema/
│   │   └── reading.ts              # Zod Schema สำหรับคำอ่านไพ่ (ReadingSchema, FollowUpSchema)
│   ├── safety/
│   │   └── guardrails.ts           # Guardrails ตรวจสอบความปลอดภัยคำถาม
│   ├── tarot/
│   │   ├── card-image.ts           # Resolver path ภาพไพ่ + srcset ภาพย่อ WebP
│   │   └── shuffle.ts              # Provably Fair RNG & Commitment Engine
│   └── utils/
│       ├── partial-json.ts         # Parser สำหรับ JSON แบบสตรีมมิ่ง
│       ├── rate-limit.ts           # จำกัดจำนวนครั้งต่อ IP
│       ├── audio.ts                # เอฟเฟกต์เสียงด้วย Web Audio API (ใช้งานจริง)
│       ├── sound.ts                # เอฟเฟกต์เสียงรุ่นก่อน (ปัจจุบันไม่มีที่ใดเรียกใช้)
│       └── history.ts              # ประวัติการดูดวงฝั่ง client
└── server/
    └── store.ts                    # In-memory Store + Rate Limiter (พร้อมเปลี่ยนเป็น Prisma)

public/cards/
├── *.jpg                           # ภาพต้นฉบับ 1909 Rider-Waite 78 ใบ (~820px, ~280KB/ใบ) — ห้ามแก้ไข
├── w256/*.webp                     # ภาพย่อกว้าง 256px สำหรับพรีวิวผัง/โลโก้/พัดไพ่ (~33KB/ใบ)
└── w512/*.webp                     # ภาพย่อกว้าง 512px สำหรับผังวางไพ่/สารานุกรม (~109KB/ใบ)
                                    # สร้างด้วย `npm run cards:variants` (scripts/generate-card-variants.ts)
```

> **หมายเหตุ**: `prisma/schema.prisma` ออกแบบไว้ครบแล้วแต่ยังไม่ได้ต่อใช้จริง — Prisma 7
> เปลี่ยน breaking change เรื่อง `datasource.url` (ต้องย้ายไป `prisma.config.ts` +
> เลือก adapter ก่อน) จึงตัด `prisma generate` ออกจาก `pnpm build` ชั่วคราว
> ใช้ `pnpm db:generate` เองเมื่อพร้อมต่อ DB จริง
