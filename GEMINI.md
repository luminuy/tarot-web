# 🔮 คู่มือพัฒนาต่อสำหรับ Gemini & Antigravity Agents

ยินดีต้อนรับ! โปรเจกต์นี้คือ **เว็บดูดวงไพ่ทาโรต์ออนไลน์ระดับพรีเมียม (Interactive Provably-Fair Tarot Web)**

> ⚠️ **กฎเหล็กสำคัญ**: ก่อนแก้ไขโค้ดใดๆ ต้องอ่าน **[docs/AI_COLLABORATION_GUIDELINES.md](file:///Users/bank/Desktop/เว็บไพ่/docs/AI_COLLABORATION_GUIDELINES.md)** เพื่อป้องกันการชนกันของงานและรักษามาตรฐานดีไซน์ระดับ Masterpiece

---

## 🧭 เอกสารสำคัญในโปรเจกต์ (Documentation Index)

1. **[docs/WORK_LOG.md](file:///Users/bank/Desktop/เว็บไพ่/docs/WORK_LOG.md)**: **(MANDATORY WORK LOG)** บันทึกประวัติสิ่งที่ทำเสร็จแล้ว อะไรแก้ไปแล้ว และอะไรค้างอยู่ (ต้องอัปเดตทุกครั้งหลังทำงานเสร็จ)
2. **[docs/AI_COLLABORATION_GUIDELINES.md](file:///Users/bank/Desktop/เว็บไพ่/docs/AI_COLLABORATION_GUIDELINES.md)**: **(MASTER RULEBOOK)** กฎเหล็กการทำงานร่วมกันของ AI, การแบ่ง Domain, กฎดีไซน์ทองคำ
3. **[docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md](file:///Users/bank/Desktop/เว็บไพ่/docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md)**: **(DEPLOY GUIDE)** ขั้นตอนการนำเว็บขึ้น Cloudflare Workers พร้อมระบบ Secret & Custom Domain
4. [docs/ARCHITECTURE.md](file:///Users/bank/Desktop/เว็บไพ่/docs/ARCHITECTURE.md): สถาปัตยกรรมระบบ ปรัชญาการออกแบบ กฎเหล็ก และ Data Flow
5. [docs/INTERACTIVE_CARD_PICKING.md](file:///Users/bank/Desktop/เว็บไพ่/docs/INTERACTIVE_CARD_PICKING.md): รายละเอียดระบบและ Component สำหรับการให้คนจับไพ่ด้วยตนเอง
6. [docs/AGENTS_TASK_PLAN.md](file:///Users/bank/Desktop/เว็บไพ่/docs/AGENTS_TASK_PLAN.md): แผนการกระจายงาน 5 เอเจนท์เฉพาะทาง และ Milestone การพัฒนา

---

## 🏛️ สรุปกฎเหล็กหลักสำหรับ AI ทุกตัว

1. **บันทึกงานทุกครั้ง**: ทำอะไรเสร็จ แก้บั๊ก หรือเพิ่มฟีเจอร์ ต้องอัปเดต [`docs/WORK_LOG.md`](file:///Users/bank/Desktop/เว็บไพ่/docs/WORK_LOG.md) ทันที
2. **ห้ามใช้อิโมจิการ์ตูนทั่วไป**: ให้ใช้สัญลักษณ์ทองคำเปลว `✦` และ `✨` เท่านั้น
3. **Zero-Clipping Architecture**: ห้ามใส่ `overflow-hidden` หรือ `overflow-x-auto` ย่อยในแต่ละแถวของการ์ด ต้องใช้ Unified Altar Canvas
4. **Manual Self-Reveal**: ไพ่บนผังพยากรณ์เริ่มต้นในสถานะคว่ำหน้าเสมอ ผู้ใช้แตะพลิก 3D ด้วยตนเอง
5. **1909 Rider-Waite Only**: ภาพหน้าไพ่ต้องใช้ภาพดั้งเดิม 1909 จาก `/public/cards/` เท่านั้น ห้ามเปลี่ยนเป็นสไตล์อื่น
6. **Safety Guard**: บล็อกสัญญาณทำร้ายตัวเองทันที และแสดงสายด่วนสุขภาพจิต **1323**
7. **Pure 1909 Spread Artworks**: ใน `TarotArtIcons.tsx` พรีวิวผัง 20 แบบ **ต้องแสดงเฉพาะภาพหน้าไพ่ 1909 ล้วนๆ ห้ามมีกล่องดำหรือตัวหนังสือปิดทับหน้าไพ่เด็ดขาด** (ให้แสดงรายละเอียดใน Accordion ด้านล่าง)
8. **Root Image Path Resolution**: ทุกจุดที่ Render ภาพไพ่ ต้องผ่าน Helper `getImageSrc()` ที่การันตี Prefix `/cards/...` เสมอ ห้ามใส่ `src={card.image}` โดดๆ
9. **Horizontal Spread Bounds**: ผังที่มีไพ่ 7 ใบขึ้นไป (ผัง 7 วัน และ 7 จักระ) **ต้องจัดวางแบบ 2 ชั้นสมดุล (4+3 ใบ)** คุมความกว้างไม่เกิน 150px ป้องกันไพ่ล้นขอบซ้ายขวาออกนอกกรอบการ์ด
10. **Human-First Natural Copywriting**: ใช้คำภาษาไทยที่เป็นธรรมชาติ เข้าใจง่าย ตรงไปตรงมาเหมือนมนุษย์คุยกัน ห้ามใช้ศัพท์หุ่นยนต์/AI แข็งทื่อ เช่น ใช้ 'เมนู', 'ผังการเปิดไพ่ (20 แบบ)', 'ความหมายไพ่ (78 ใบ)', 'ประวัติการดูดวง' แทนศัพท์ซับซ้อน
11. **Multi-Agent Collision Guard**: ก่อนเริ่มงานให้ตรวจสอบ `npm run agent:status` และล็อคไฟล์ด้วย `npm run agent:lock` เสมอ หลังทำเสร็จให้ปลดล็อคด้วย `npm run agent:unlock` เพื่อไม่ให้ AI หลายตัวแก้งานชนกัน

---

## 🛠️ คำสั่งสำหรับทดสอบและรันระบบ

- **ตรวจความปลอดภัยไม่ให้ชนกับ Agent อื่น**: `npm run agent:check`
- **ดูสถานะ Agent ที่กำลังทำงาน**: `npm run agent:status`
- **ล็อคไฟล์ก่อนเริ่มแก้**: `npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files <ไฟล์>`
- **ปลดล็อคไฟล์เมื่อทำเสร็จ**: `npm run agent:unlock -- --agent <ชื่อ>`
- **ตรวจ Typecheck**: `npm run typecheck`
- **ซิงก์สถานะและบันทึกงานอัตโนมัติ (Mandatory)**: `npm run log:sync`
- **ตรวจความสมบูรณ์ของไพ่ 78 ใบ**: `./node_modules/.bin/tsx scripts/verify-cards.ts`
- **ตรวจความสมบูรณ์ของ 20 ผังพยากรณ์**: `./node_modules/.bin/tsx scripts/qa/test-spreads.ts`
- **รันเซิร์ฟเวอร์สำหรับพัฒนา**: `npm run dev`
