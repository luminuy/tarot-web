# 🤖 แผนงานและการแบ่งหน้าที่สำหรับ AI Agents (Multi-Agent Task Orchestration)

เอกสารนี้ระบุการแบ่งงานออกเป็น **5 เอเจนท์เฉพาะทาง (Specialized Agents)** เพื่อให้ Gemini / Antigravity สามารถดึงเอเจนท์มารับผิดชอบงานในแต่ละมิติได้อย่างมีประสิทธิภาพและไม่ทับซ้อนกัน

---

## 1. แผนภาพลำดับงาน (Agent Dependency & Workflow)

```
[Agent 1: Data & Backend Engine]
   ├── ขยาย API ให้รองรับ user picked indices
   └── เตรียม Mock & Prisma connection
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
   ├── สรุปภาพรวมและหน้า Share Card สวยงาม
   └── Voice & Persona response fine-tuning
           ↓
[Agent 5: Quality Assurance & Verification]
   ├── ตรวจสอบ Typecheck, Lint, Build
   ├── ตรวจสอบ Provable Fair Commitment Math
   └── ทดสอบ Responsiveness ทุกหน้าจอมือถือ/แท็บเล็ต/เดสก์ท็อป
```

---

## 2. รายละเอียดบทบาทของแต่ละเอเจนท์ (Agent Roles & Tasks)

### 🧩 Agent 1: Backend & Provably Fair Architect
- **หน้าที่รับผิดชอบ**:
  1. ปรับปรุง `src/lib/shuffle.ts` ให้ฟังก์ชัน `drawCards` รองรับพารามิเตอร์ `pickedIndices?: number[]`
  2. อัปเดต `src/app/api/reading/[id]/shuffle/route.ts` ให้อนุญาตให้ Client ส่ง `pickedIndices`
  3. ตรวจสอบให้มั่นใจว่าการคำนวณ Hash Commit–Reveal ถูกต้องตรงกัน 100%
  4. เพิ่มฟังก์ชัน Helper สำหรับ Client ตรวจสอบ Seed ย้อนหลัง (Client Verification Tool)

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
     - Responsive ปรับอัตราส่วนอัตโนมัติบนจอมือถือและเดสก์ท็อป

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
  3. ออกแบบ Export/Share Card สวยงามสำหรับแชร์ลง Instagram Story / Twitter / Facebook
  4. สร้าง Fallback กรณี Claude API ไม่พร้อมทำงาน หรือจำลอง Local Mock Mode เพื่อให้ทดสอบ UI ได้อย่างรวดเร็ว

---

### 🧪 Agent 5: Verification, Testing & QA
- **หน้าที่รับผิดชอบ**:
  1. รัน `pnpm typecheck` และ `pnpm build` ให้ผ่านปราศจาก Error
  2. ทดสอบความถูกต้องของ Spread ครบทั้ง 8 รูปแบบ
  3. ทดสอบระบบคัดกรองความปลอดภัย (Safety Guardrails) ด้วยคำถามตัวอย่าง
  4. ทดสอบความถูกต้องทางคณิตศาสตร์ของ Seed verification
  5. ตรวจสอบ UI Accessibility และ Mobile Touch Responsiveness

---

## 3. Checklist และ Milestone ในการส่งมอบงาน

- [x] **Milestone 0**: ออกแบบฐานข้อมูล ไพ่ 78 ใบ ระบบสุ่ม Commit-Reveal และ Prompt System
- [ ] **Milestone 1**: ขยาย Backend Engine ให้รองรับ User-Picked Indices
- [ ] **Milestone 2**: สร้าง Core Components (`InteractiveCardFan`, `TarotCard`, `SpreadBoard`)
- [ ] **Milestone 3**: ประกอบหน้า Flow ตั้งแต่เลือก Spread จนถึงเปิดไพ่ด้วยตนเอง
- [ ] **Milestone 4**: เชื่อมต่อ SSE Stream Reader และหน้าสรุปผลพร้อมเฉลย Seed
- [ ] **Milestone 5**: Full Integration Testing & Polish
