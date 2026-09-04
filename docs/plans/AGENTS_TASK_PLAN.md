# 🤖 แผนงานและการแบ่งหน้าที่สำหรับ AI Agents (Multi-Agent Task Orchestration)

> ⚠️ **เอกสารเชื่อมโยงที่ต้องอ่านควบคู่กัน**:
> * **[`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md)** — ทะเบียนบั๊กค้างและข้อจำกัดของระบบที่ยืนยันแล้ว (ต้องตรวจก่อนเริ่มงานเพื่อไม่ให้แก้ชนกัน)
> * **[`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md)** — กฎเหล็ก AI การแบ่ง Domain และกฎดีไซน์ทองคำ
> * **[`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md)** — บันทึกบทเรียนความผิดพลาดและกฎป้องกันถาวร

เอกสารนี้ระบุการแบ่งงานออกเป็น **5 เอเจนท์เฉพาะทาง (Specialized Agents)** เพื่อให้ Gemini / Antigravity สามารถดึงเอเจนท์มารับผิดชอบงานในแต่ละมิติได้อย่างมีประสิทธิภาพและไม่ทับซ้อนกัน

---

## 1. แผนภาพลำดับงาน (Agent Dependency & Workflow)

```
[Agent 1: Data & Backend Engine]
   ├── ขยาย API ให้รองรับ user picked indices
   └── In-Memory Store & Cloudflare D1 (`APP_DB`) connection
           ↓
[Agent 2: Interactive Motion & UI]
   ├── สร้าง InteractiveCardFan (78 cards arc/ribbon)
   ├── สร้าง SpreadBoard 3D & CardSlot
   └── ผสาน Gesture & Framer Motion
           ↓
[Agent 3: Reading Flow & Page Assembler]
   ├── สร้างหน้า Landing & Question Intake Step
   ├── สร้างหน้า Interactive Drawing Room
   └── เชื่อมต่อ SSE Streaming Reader
           ↓
[Agent 4: Audio, Aesthetics & Persona Polisher]
   ├── ระบบแสง แสงเทียน อารมณ์ (Mood theme styling)
   ├── สรุปภาพรวมและหน้า Share Card สวยงาม (9:16 IG Story)
   └── Voice & Persona response fine-tuning (SoundManager Web Audio API)
           ↓
[Agent 5: Quality Assurance & Verification]
   ├── ตรวจสอบ Typecheck, Lint, Build (24 ด่าน)
   ├── ตรวจสอบ Provable Fair Commitment Math
   └── ทดสอบ Responsiveness ทุกหน้าจอมือถือ/แท็บเล็ต/เดสก์ท็อป
```

---

## 2. รายละเอียดบทบาทของแต่ละเอเจนท์ (Agent Roles & Tasks)

### 🧩 Agent 1: Backend & Provably Fair Architect
- **หน้าที่รับผิดชอบ**:
  1. ปรับปรุง `src/lib/tarot/shuffle.ts` ให้ฟังก์ชัน `drawCards` รองรับพารามิเตอร์ `pickedIndices?: number[]`
  2. อัปเดต `src/app/api/reading/[id]/shuffle/route.ts` ให้อนุญาตให้ Client ส่ง `pickedIndices`
  3. ตรวจสอบให้มั่นใจว่าการคำนวณ Hash Commit–Reveal ถูกต้องตรงกัน 100%
  4. เพิ่มฟังก์ชัน Helper สำหรับ Client ตรวจสอบ Seed ย้อนหลัง (Client Verification Tool)
  5. พัฒนาการเชื่อมต่อ Cloudflare D1 (`APP_DB`), KV Cache, และ AI Gateway

---

### 🎨 Agent 2: Motion & Interactive Deck Specialist
- **หน้าที่รับผิดชอบ**:
  1. สร้าง `src/components/deck/InteractiveCardFan.tsx`:
     - พัดคลี่ไพ่ 78 ใบแบบ 3D Arc / Scrollable Ribbon
     - รองรับ Touch Dragging และ Wheel Scrolling
     - อนิเมชั่น Hover ยกไพ่ขึ้น + แสงเรืองรอง
     - เลือกไพ่แล้วมีอนิเมชั่นบินออกจากสำรับ
  2. สร้าง `src/components/card/TarotCard.tsx`:
     - พลิกไพ่ 3D (3D Flip Animation with backface-visibility)
     - แสดงภาพหน้าไพ่ / ลวดลายหลังไพ่ทองโบราณ
     - สัญลักษณ์หัวกลับ (Reversed indicator)
  3. สร้าง `src/components/spread/SpreadBoard.tsx`:
     - แสดงตำแหน่งไพ่ตามพิกัด $(x, y, \text{rotate})$ ใน `spreads.ts`
     - จัดการทั้ง 20 ผังพยากรณ์ พร้อมสมดุล 2 ชั้นสำหรับผัง 7 ใบขึ้นไป

---

### 🔮 Agent 3: Reading Flow & Frontend Page Assembler
- **หน้าที่รับผิดชอบ**:
  1. สร้างหน้าหลัก `src/app/page.tsx` หรือหน้า Flow:
     - **Step 1: Intake** (เลือก Spread, เลือก Persona แม่หมอ, พิมพ์คำถาม, บริบทเพิ่มเติม)
     - **Step 2: Ritual / Shuffling** (ผู้ใช้สัมผัสสับไพ่, แสดง Server Commitment)
     - **Step 3: Self-Draw** (ผู้ใช้เลื่อนพัดเลือกไพ่ทีละใบลงผัง Spread)
     - **Step 4: Reading / SSE** (พลิกไพ่ทีละใบ พร้อมอ่านสตรีมมิ่งคำทำนายแบบ Real-time)
     - **Step 5: Summary & Reflection** (สรุปคำแนะนำ สิ่งที่ควรทำในสัปดาห์นี้, เฉลย Seed, แชร์ผล)
  2. จัดการ State Management ทั้งหมด (ReadingSessionProvider หรือ React State Machine)

---

### ✨ Agent 4: Aesthetics, Theme & Persona Polisher
- **หน้าที่รับผิดชอบ**:
  1. ตกแต่งบรรยากาศตามอารมณ์คำอ่าน (`mood`: สดใส, อบอุ่น, สงบ, ครุ่นคิด, ท้าทาย)
  2. สร้าง Component สำหรับแสดงบทสนทนาถามต่อยอด (Follow-up Chat)
  3. ออกแบบ Export/Share Card สวยงามสำหรับแชร์ลง Instagram Story (9:16)
  4. สร้าง Multi-Provider AI Fallback Engine (Groq LPU Qwen 2.5 Tier 1 ➔ Google Gemini Tier 2 Failover) พร้อม Mock Mode ใน Local

---

### 🧪 Agent 5: Verification, Testing & QA
- **หน้าที่รับผิดชอบ**:
  1. รัน `npm run typecheck` และ `npm run repo:verify` (24 ด่าน) ให้ผ่านปราศจาก Error
  2. ทดสอบความถูกต้องของ Spread ครบทั้ง 20 ผังพยากรณ์ (95 ตำแหน่ง)
  3. ทดสอบระบบคัดกรองความปลอดภัย (Safety Guardrails) ด้วยคำถามตัวอย่าง และสายด่วน 1323
  4. ทดสอบความถูกต้องทางคณิตศาสตร์ของ Seed verification
  5. ตรวจสอบ UI Accessibility และ Mobile Touch Responsiveness

---

## 3. Checklist และ Milestone ในการส่งมอบงาน

- [x] **Milestone 0**: ออกแบบฐานข้อมูล ไพ่ 78 ใบ ระบบสุ่ม Commit-Reveal และ Prompt System (เสร็จสมบูรณ์)
- [x] **Milestone 1**: ขยาย Backend Engine ให้รองรับ User-Picked Indices + Rate Limiting (เสร็จสมบูรณ์)
- [x] **Milestone 2**: สร้าง Core Components (`InteractiveCardFan`, `TarotCard`, `SpreadBoard`, `ShuffleRitual`) (เสร็จสมบูรณ์)
- [x] **Milestone 3**: ประกอบหน้า Flow 5 ขั้นตอน พร้อม 3D Floating Hero Deck และ Manual Self-Reveal (เสร็จสมบูรณ์)
- [x] **Milestone 4**: เชื่อมต่อ SSE Stream Reader, Thai TTS Voice Engine, IG Story 9:16 Export (เสร็จสมบูรณ์)
- [x] **Milestone 5**: Safety Rails (สายด่วน 1323), PDPA Privacy Page, AI Collaboration Guidelines, A/B Rating (เสร็จสมบูรณ์)
- [x] **Milestone 6**: Clean Architecture Scaffolding (`src/types/`, `src/lib/platform/db.ts`, `src/server/store.ts`) & Multi-Page Expansion Matrix (`/cards`, `/spreads`, `/blog`, `/account`) (เสร็จสมบูรณ์)
- [x] **Milestone 7**: Multi-Provider AI Engine (Groq Qwen 2.5 + Gemini Failover), Cloudflare D1/KV/R2/Vectorize, Design System V2 & 24 Automated Quality Gates (เสร็จสมบูรณ์)

### 🏆 สถานะระบบปัจจุบัน (Production Ready):
- `npm run typecheck`: **ผ่าน 0 errors**
- `npm run repo:verify`: **ผ่านครบทั้ง 24/24 ด่านสมบูรณ์ 100%**
- `npx tsx scripts/verify-cards.ts`: **ไพ่ 78 ใบ 780 ข้อความสมบูรณ์ 100%**
- `npx tsx scripts/qa/test-spreads.ts`: **20 ผังพยากรณ์ 95 ตำแหน่ง ผ่าน 541/541 checks**
- `http://localhost:3000`: **HTTP 200 OK**
- `http://localhost:3000/cards`: **HTTP 200 OK**
- `http://localhost:3000/spreads`: **HTTP 200 OK**
- `http://localhost:3000/blog`: **HTTP 200 OK**
- `http://localhost:3000/account`: **HTTP 200 OK**
- `http://localhost:3000/privacy`: **HTTP 200 OK**

---

## 4. แผนงานฟีเจอร์ระดับโลกและสถานะการพัฒนา (Global Feature Status & Roadmap)

รวบรวมและบันทึกจากการศึกษาวิจัยฟีเจอร์ของแพลตฟอร์มดูดวงไพ่ทาโรต์ชั้นนำระดับโลก (*Labyrinthos, Golden Thread Tarot, Sanctuary, Biddy Tarot, CHANI*):

1. **🔊 Mystic Ambient Audio & Shuffling SFX (ระบบเสียงบรรยากาศศักดิ์สิทธิ์)**: ✅ **เสร็จสิ้น**
   - พัฒนาด้วย `SoundManager` (`src/lib/audio/sound.ts`) ผ่าน Web Audio API จำลองเสียงสับไพ่, คลิกเมนู, เสียงกระดิ่งกังวาน, และสลับเปิด/ปิดเสียงได้จาก Navigation Bar
2. **📸 Aesthetic Story Card Export (การ์ดทองคำหรูหรา 9:16 พร้อมแชร์ลง IG / TikTok)**: ✅ **เสร็จสิ้น**
   - คอมโพเนนต์ `ShareCardModal` พร้อม Canvas Renderer สร้างรูปภาพแนวตั้ง 9:16 รวมภาพหน้าไพ่ 1909 + ตราประทับทองคำ + คำทำนายหลัก พร้อมบันทึกภาพลงเครื่อง
3. **🧘 Intention Breathing Focus Circle (วงแหวนสมาธิก่อนสับไพ่)**: 🟡 **Backlog Roadmap**
   - ในขั้นตอนก่อนสับไพ่ มีวงแหวนแสงทองคำกำหนดลมหายใจเข้า-ออก 3 วินาที เพื่อปรับคลื่นสมอง (Alpha State) ให้สงบนิ่งก่อนตั้งจิตอธิษฐาน
4. **☀️ Daily Energy & Reflection Prompts (ไพ่พลังงานประจำวัน)**: ✅ **เสร็จสิ้น**
   - พัฒนาระบบ `DailyCardStrip` (`src/components/reading/DailyCardStrip.tsx`) และ API `/api/daily-card` สำหรับสุ่มไพ่ 1 ใบประจำวันตามวันที่ พร้อมคำแนะนำ
5. **🪐 Astrological & Numerological Badges (ดาวเคราะห์และเลขศาสตร์ประจำไพ่)**: ✅ **เสร็จสิ้น**
   - แสดงสัญลักษณ์ดาวเคราะห์, ธาตุประจำไพ่, และเลขศาสตร์ในหน้ารายละเอียดไพ่ `/cards/[id]` ครบทั้ง 78 ใบ



