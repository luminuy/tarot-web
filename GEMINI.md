# 🔮 คู่มือพัฒนาต่อสำหรับ Gemini & Antigravity Agents

ยินดีต้อนรับ! โปรเจกต์นี้คือ **เว็บดูดวงไพ่ทาโรต์ออนไลน์ระดับพรีเมียม (Interactive Provably-Fair Tarot Web)**
เป้าหมายสำคัญในรอบนี้คือ: **พัฒนาฟีเจอร์ให้ผู้ใช้สามารถจับไพ่ด้วยตัวเองทีละใบ (Self-Draw / Interactive Card Fan)** และต่อยอดระบบแม่หมอ AI ให้สมบูรณ์แบบ

---

## 🧭 เอกสารสำคัญในโปรเจกต์ (Documentation Index)

1. [docs/ARCHITECTURE.md](file:///Users/bank/Desktop/เว็บไพ่/docs/ARCHITECTURE.md): สถาปัตยกรรมระบบ ปรัชญาการออกแบบ กฎเหล็ก และ Data Flow
2. [docs/INTERACTIVE_CARD_PICKING.md](file:///Users/bank/Desktop/เว็บไพ่/docs/INTERACTIVE_CARD_PICKING.md): รายละเอียดระบบและ Component สำหรับการให้คนจับไพ่ด้วยตนเอง
3. [docs/AGENTS_TASK_PLAN.md](file:///Users/bank/Desktop/เว็บไพ่/docs/AGENTS_TASK_PLAN.md): แผนการกระจายงาน 5 เอเจนท์เฉพาะทาง และ Milestone การพัฒนา

---

## 🚀 สรุปสิ่งที่มีอยู่แล้ว (Current State)

- ✅ **ชุดข้อมูลไพ่ 78 ใบครบถ้วน**: `src/data/cards/` พร้อมคำแปล ความหมาย 5 หมวด และ Keywords ภาษาไทย
- ✅ **รูปแบบการวางไพ่ (Spreads)**: `src/data/spreads.ts` 8 รูปแบบ พร้อมพิกัด $x, y$ และองศาหมุน
- ✅ **เอนจินความสุ่มที่ตรวจสอบได้**: `src/lib/tarot/shuffle.ts` (Commit-Reveal SHA-256)
- ✅ **โครงสร้างและ Prompt แม่หมอ AI**: `src/lib/ai/prompt.ts`, `src/data/personas.ts`, `src/lib/schema/reading.ts`
- ✅ **API Backend**: `/api/reading/start`, `/api/reading/[id]/shuffle`, `/api/reading/[id]/read`
- ✅ **ธีมและสไตล์**: `src/app/globals.css` (Starry Sky gradient, 3D card perspective, card-back pattern)

---

## 🎯 สิ่งที่ต้องทำต่อไป (Next Steps for Agents)

1. **Backend Enhancement**: อัปเดต `src/lib/tarot/shuffle.ts` และ `src/app/api/reading/[id]/shuffle/route.ts` ให้รับ `pickedIndices` จากหน้าบ้าน
2. **Interactive UI Components**:
   - `src/components/deck/InteractiveCardFan.tsx`: พัดสำรับ 78 ใบที่เลื่อนและจิ้มเลือกได้
   - `src/components/card/TarotCard.tsx`: การ์ด 3D พร้อมเอฟเฟกต์พลิก
   - `src/components/spread/SpreadBoard.tsx`: ผังวางไพ่ตาม Spread
3. **Interactive Main Page**: ประกอบ Flow เต็มรูปแบบใน `src/app/page.tsx`
4. **Mock / Real AI Streaming**: รองรับทั้ง Local Mock Mode (สำหรับทดสอบโดยไม่ต้องใช้ API Key) และ Live Claude Streaming

---

## 🛠️ คำสั่งสำหรับทดสอบและรันระบบ

- **ตรวจความสมบูรณ์ของไพ่ 78 ใบ**: `./node_modules/.bin/tsx scripts/verify-cards.ts`
- **ตรวจ Typecheck**: `pnpm typecheck` หรือ `npx tsc --noEmit`
- **รันเซิร์ฟเวอร์สำหรับพัฒนา**: `pnpm dev`
