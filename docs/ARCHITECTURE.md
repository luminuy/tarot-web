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
| **Database & ORM** | PostgreSQL + Prisma ORM 7 | User Data, Credits Ledger, Journal, Readings |
| **AI LLM Engine** | Claude 3.5 Sonnet / Opus / Gemini API with Structured Output | Streaming Interpretation via SSE |
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
│   │   ├── start/route.ts          # เริ่มต้นรอบ ตรวจ safety และสร้าง commitment
│   │   ├── [id]/shuffle/route.ts    # บันทึก seed / สับไพ่ / ยืนยันตำแหน่งไพ่ที่เลือก
│   │   └── [id]/read/route.ts       # สตรีมคำอ่านผ่าน Server-Sent Events (SSE)
│   ├── globals.css                 # โทนสี starry sky, 3D card perspective, CSS card-back
│   └── layout.tsx                  # Root Layout + Thai Web Fonts
├── components/                     # (คอมโพเนนต์หลัก)
│   ├── card/                       # TarotCard 3D, CardBack, CardFace
│   ├── deck/                       # InteractiveCardFan, ShuffleGesture, CardPicker
│   ├── spread/                     # SpreadBoard, PositionSlot, SpreadLayout
│   ├── reading/                    # StreamReader, PersonaAvatar, AdviceList
│   └── ui/                         # Modal, Button, Drawer, Sparkles
├── data/
│   ├── cards/                      # ข้อมูลไพ่ 78 ใบ (Major, Cups, Swords, Wands, Pentacles)
│   └── spreads.ts                  # ข้อมูลรูปแบบการวางไพ่ 8 แบบ
├── lib/
│   ├── claude.ts                   # Anthropic SDK Streaming Client
│   ├── partial-json.ts             # Parser สำหรับ JSON แบบสตรีมมิ่ง
│   ├── personas.ts                 # แม่หมอ 3 บุคลิก (ใจดี, พูดตรง, สายพลัง)
│   ├── prompt.ts                   # Structured System & User Prompts
│   ├── reading-schema.ts           # Zod Schema สำหรับคำอ่านไพ่
│   ├── safety.ts                   # Guardrails ตรวจสอบความปลอดภัยคำถาม
│   └── shuffle.ts                  # Provably Fair RNG & Commitment Engine
└── server/
    └── store.ts                    # In-memory Store (พร้อมเปลี่ยนเป็น Prisma)
```
