# 📜 กฎเหล็กและคู่มือการทำงานร่วมกันสำหรับ AI ทุกตัว (Multi-AI Collaboration & Development Guidelines)

> **สำหรับ AI Assistant ทุกตัว (Gemini, Claude, Antigravity, Cursor, Copilot ฯลฯ)**  
> **โปรดอ่านเอกสารนี้ก่อนเริ่มแก้ไขโค้ดทุกครั้ง เพื่อป้องกันการทำงานชนกันหรือทำลายดีไซน์ระดับ Masterpiece ที่สร้างไว้แล้ว**

---

## 🏛️ 1. กฎเหล็กด้านการออกแบบและแบรนด์ดิ้ง (Design & Aesthetic Golden Rules)

ผู้ใช้และระบบได้ตกลงหลักการออกแบบระดับ **World-Class Mystic Sanctuary (Obsidian & Sacred Gold)** ไว้ดังนี้:

1. **❌ ห้ามใช้อิโมจิการ์ตูนทั่วไปเด็ดขาด**:
   - ห้ามใช้ `🔮`, `📸`, `📜`, `💬`, `💡`, `📖`, `🌱`, `⏳`, `💾`, `📱`, `📋`, `📲` ในส่วนประกอบ UI หลัก
   - ✅ **ให้ใช้สัญลักษณ์ศักดิ์สิทธิ์สีทองคำเปลวเท่านั้น**: เช่น `✦`, `✨`, `✓` หรือไอคอน SVG / ตราประทับ 1909
2. **❌ ห้ามใช้ลูกแก้วกลมหรือสัญลักษณ์ดาวประดับหลังไพ่**:
   - ลวดลายหลังไพ่ต้องใช้ `.card-back-pattern` (Sacred Geometry ลายตาข่ายทองคำโบราณบนพื้นกำมะหยี่ม่วงเข้ม) เท่านั้น
3. **❌ ห้ามเปลี่ยนภาพหน้าไพ่**:
   - ใช้ภาพไพ่ดั้งเดิม **1909 Rider-Waite-Smith** จาก `/public/cards/` เท่านั้น
4. **✅ สถาปัตยกรรม Canvas ไร้การตัดขอบ (Zero-Clipping Architecture)**:
   - ห้ามใส่ `overflow-hidden` หรือ `overflow-x-auto` ย่อยในแต่ละแถวของการ์ด เพราะ CSS จะตัดส่วนบนของการ์ดที่ลอยขึ้นมา (`y: -40px`)
   - การ์ดในแท่นบูชาต้องอยู่ใน **Unified Canvas** ผืนเดียวกันเสมอ พร้อมพื้นที่ด้านบน (`pt-24 sm:pt-28`) ให้การ์ดยกตัวลอยได้อย่างอิสระ
5. **✅ โฟลว์การเปิดไพ่ด้วยตนเอง (Manual Self-Reveal)**:
   - ไพ่ในหน้าผังพยากรณ์ต้องเริ่มต้นด้วยสถานะ **คว่ำหน้าเสมอ (`revealedOrders = []`)**
   - ผู้ใช้ต้องเป็นคนแตะพลิกไพ่ 3 มิติทีละใบด้วยตนเอง (หรือกดปุ่ม "พลิกดูไพ่ทั้งหมด")
6. **✅ บันทึกประวัติงานลงใน `docs/WORK_LOG.md` ทุกครั้ง (Mandatory Work Log)**:
   - ทุกครั้งที่ทำอะไรเสร็จ แก้บั๊ก หรือเพิ่มฟีเจอร์ **ต้องอัปเดตไฟล์ [`docs/WORK_LOG.md`](file:///Users/bank/Desktop/เว็บไพ่/docs/WORK_LOG.md) เสมอ**
   - ระบุสิ่งที่ทำ, ไฟล์ที่แก้, ผลการทดสอบ, และสิ่งที่ค้างอยู่ เพื่อส่งต่องานให้ AI ตัวถัดไปได้อย่างไร้รอยต่อ
7. **🚨 กฎการตรวจความสมบูรณ์ของ Typography & การจัดวาง (Zero Visual Collision & Word-Wrapping Integrity)**:
   - **ห้ามวางคอมโพเนนต์ซ้อนแถวเกินความสูงของกล่อง**: ในคอนเทนเนอร์ขนาดจำกัด เช่น การ์ดพรีวิว (`h-34`/`h-36`) ห้ามวางการ์ดย่อยหลายชั้นพร้อมป้ายข้อความใต้การ์ดจนความสูงรวมทะลุไปทับหัวข้อหรือเส้นแบ่งด้านล่าง
   - **ห้ามตัดคำภาษาไทยเสียรูป**: ตรวจสอบความยาวหัวข้อ (`nameTh`) และคำโปรยเสมอ ห้ามยาวเกินจนคำหลักถูกตัดครึ่งคำขึ้นบรรทัดใหม่ (เช่น `(จักระบำ` \n `บัด)`) ให้ใช้ชื่อที่กระชับ สละสลวย และอ่านง่าย
   - **ตรวจสอบทั้งจอ Mobile และ Desktop ทุกครั้ง**: หลังแก้ UI ต้องตรวจสอบระยะ Margin, Padding และ Bounds ไม่ให้มีข้อความหรือองค์ประกอบใดๆ ซ้อนทับกันเด็ดขาด
8. **🖼️ กฎภาพพรีวิวผังไพ่ (100% Pure Artwork & Zero Text Overlay Standard)**:
   - ในคอมโพเนนต์ `TarotArtIcons.tsx` ภาพพรีวิวผังไพ่ทั้ง 20 แบบ **ต้องแสดงเฉพาะรูปภาพหน้าไพ่ 1909 Rider-Waite ดั้งเดิมล้วนๆ อย่างคมชัดและสง่างาม**
   - **❌ ห้ามใส่กล่องสี่เหลี่ยมสีดำ, แถบข้อความ, หรือ Badge ปิดทับบดบังหน้าไพ่เด็ดขาด** เพื่อให้ผู้ใช้เห็นความงดงามและศิลปะของไพ่จริงอย่างเต็มตา
   - รายละเอียดความหมายและชื่อตำแหน่งทั้งหมด ให้แสดงใน Accordion ด้านล่าง `"✦ ดูรายละเอียดตำแหน่งไพ่"` เท่านั้น
9. **🌐 กฎ Root Image Path Resolution สำหรับ Sub-routes**:
   - การอ้างอิงภาพหน้าไพ่ทุกจุดต้องใช้ Helper `getImageSrc(card)` ที่รับประกัน Path เสมอ: `card.image?.startsWith("/") ? card.image : \`/cards/\${card.image}\`` ห้ามใช้ `src={card.image}` โดดๆ ที่ทำให้ Sub-routes ดึงภาพผิดโฟลเดอร์
10. **📐 กฎควบคุมสัดส่วนพรีวิวผังไม่ให้ล้นขอบ (Horizontal Spread Bounds Calibration Standard)**:
   - ในคอนเทนเนอร์การ์ดผังที่มีความกว้างคอลัมน์จำกัด (~220px บน Grid 4 คอลัมน์) **ห้ามวางเรียงไพ่ 7 ใบในแถวเดียวแนวนอนเด็ดขาด** (เพราะความกว้างรวมจะทะลุกรอบออกไป)
   - ผังที่มีไพ่ 7 ใบขึ้นไป (เช่น ผัง 7 วัน และผัง 7 จักระ) **ต้องจัดวางเป็น 2 แถวสมดุล (2-Tier Balanced Formation เช่น 4 + 3 ใบ)** โดยคุมความกว้างรวมไม่เกิน **150px** เพื่อให้พอดีกับกรอบทุกขนาดหน้าจออย่างสมบูรณ์แบบ

---

## 🧭 2. แผนที่โครงสร้างไฟล์และหน้าที่รับผิดชอบ (File Ownership & Architecture Map)

| เลเยอร์ / หมวดหมู่ | ไฟล์หลัก | หน้าที่และความรับผิดชอบ | ข้อควรระวังสำหรับ AI |
| :--- | :--- | :--- | :--- |
| **Main Orchestrator** | `src/app/page.tsx` | ควบคุม 5 ลำดับขั้นของพิธีกรรม (Step 1-5) และ Global State | ระวังอย่ารีเซ็ต state โดยไม่จำเป็น และตรวจสอบลำดับ Step ให้ถูกต้อง |
| **Step 1: Spread Select** | `src/components/spread/SpreadCardSelector.tsx` | ให้ผู้ใช้เลือกผังจาก 20 รูปแบบ | ไพ่ตัวอย่างด้านบนต้องเป็น 3D Floating Deck พร้อม Sacred Aura |
| **Step 2: Intention** | `src/components/reading/IntentionAltarInput.tsx` | ป้อนชื่อเล่น, คำถาม, บริบท และเลือก Persona แม่หมอ | มี Safety Pre-Check ตรวจสอบคำถามก่อนส่ง |
| **Step 3: Shuffle** | `src/components/deck/ShuffleRitual.tsx` | พิธีสับไพ่ 3D Commit-Reveal Cryptographic Shuffle | ใช้ Server Seed + Client Seed ด้วย SHA-256 |
| **Step 4: Pick (78 Cards)** | `src/components/deck/InteractiveCardFan.tsx` | โต๊ะแผ่กระจายไพ่ 78 ใบแบบ 3 ชั้นริบบิ้น พร้อม Progress Dock | **ห้ามใส่ปุ่มลูกศรข้าง** และต้องใช้ Unified Canvas |
| **Step 5: Reading Board** | `src/components/spread/SpreadBoard.tsx` | ผังวางไพ่ 3D ตามพิกัด Spread | ไพ่ต้องคว่ำหน้าเริ่มต้น และแตะพลิก 3D ทีละใบ |
| **Step 5: AI Prophet** | `src/components/reading/StreamReader.tsx` | อ่านคำทำนายแบบ Real-Time SSE Stream พร้อมเสียง TTS | มีปุ่มเปิดเสียงแม่หมอ และ A/B Accuracy Rating ท้ายคำอ่าน |
| **Services Layer** | `src/services/*.service.ts` | Business Logic: `reading`, `shuffle`, `pick`, `safety`, `interpretation` | แยก Logic จาก UI ไม่เขียน Database/Crypto ซ้ำซ้อนใน Component |
| **Server Repositories** | `src/server/repositories/` | Data Access: `reading.repository.ts` | เป็น Interface สำหรับเชื่อมต่อ DB หรือ Memory Storage |
| **Global Types** | `src/types/*.ts` | สัญญา Type ของทั้งระบบ (`reading`, `tarot`, `safety`) | ใช้ Types จากที่นี่เป็น Single Source of Truth |
| **Verification & Crypto** | `src/components/verification/`, `src/lib/crypto/` | Provably Fair SHA-256 Hash Badge & Modal | ห้ามเปลี่ยนสูตรการสับไพ่ Deterministic Fisher-Yates |
| **Pages & Routes** | `src/app/cards/`, `spreads/`, `blog/`, `account/` | หน้าเว็บเฉพาะทาง (สารานุกรม 78 ใบ, คลังผัง, บทความ, บัญชี) | ออกแบบด้วยธีม Sacred Gold และรองรับ Mobile 100% |
| **Audio & TTS Engine** | `src/lib/utils/audio.ts` | เสียงสังเคราะห์ Web Audio API (สับไพ่/พลิกไพ่) + Web Speech TTS | ปิด/เปิดเสียงผ่าน `soundManager` เท่านั้น |
| **Safety & PDPA** | `src/lib/safety/`, `src/app/privacy/page.tsx` | กรองคำถามอันตราย, สายด่วน 1323, นโยบาย PDPA, AI Disclosure | ห้ามลบ Disclaimer หรือตัวกรองความปลอดภัย |
| **Tarot Knowledge DB** | `src/data/cards/`, `src/data/spreads/` | ข้อมูลไพ่ 78 ใบครบถ้วน และผังพยากรณ์ 20 รูปแบบ | ห้ามแก้ไข structure ของไพ่ 78 ใบโดยไม่มี script ตรวจ |

---

## 🔒 3. กฎความปลอดภัยและการปฏิบัติตามกฎหมาย (Safety & Legal Rules)

1. **การกรองคำถามวิกฤต (Crisis Guard)**:
   - หากตรวจพบสัญญาณทำร้ายตัวเอง → **บล็อกทันที** และแสดงสายด่วนสุขภาพจิต **1323** และ **1669**
2. **ข้อห้ามใน System Prompt (Strict AI Boundaries)**:
   - ห้าม AI วินิจฉัยโรค ทำนายเรื่องสุขภาพ การตั้งครรภ์ หรือยา
   - ห้าม AI ให้คำแนะนำทางกฎหมาย หรือทำนายผลคดี
   - ห้าม AI ฟันธงเรื่องการลงทุน ชี้แนะหุ้น คริปโต หรือให้เลขหวย
3. **การเปิดเผยเรื่อง AI (AI Transparency)**:
   - ต้องระบุชัดเจนเสมอว่าคำทำนายสร้างโดย AI ไม่ใช่คนจริง
4. **ความเป็นส่วนตัว (PDPA)**:
   - ข้อมูลประวัติและบันทึกต้องเก็บใน `localStorage` ของผู้ใช้เท่านั้น ไม่เก็บถาวรบนเซิร์ฟเวอร์ และไม่นำไปเทรนโมเดล

---

## 🛠️ 4. คำสั่งตรวจสอบก่อนและหลังแก้ไขโค้ด (Mandatory Verification Protocol)

ก่อนและหลังแก้ไขโค้ดทุกครั้ง AI **ต้องรันคำสั่งเหล่านี้เพื่อตรวจสอบความถูกต้อง**:

```bash
# 1. ตรวจสอบ TypeScript Typecheck (ต้องผ่าน 0 errors เสมอ)
npm run typecheck

# 2. ซิงก์สถานะและบันทึกงานอัตโนมัติลงใน docs/WORK_LOG.md (Mandatory Auto-Sync)
npm run log:sync

# 3. ตรวจสอบความถูกต้องของฐานข้อมูลไพ่ 78 ใบ
./node_modules/.bin/tsx scripts/verify-cards.ts

# 4. ตรวจสอบว่า Dev Server ตอบสนอง 200 OK
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```

---

## 📝 5. บันทึกสถานะระบบและฟีเจอร์ที่เสร็จสมบูรณ์แล้ว (Live System State Registry)

| วันที่/เวลา | ฟีเจอร์ที่เสร็จสมบูรณ์ | รายละเอียด | ผู้ดำเนินการ |
| :--- | :--- | :--- | :--- |
| **2026-08-31** | **Unified Sacred Iconography** | แทนที่อิโมจิการ์ตูนทั้งหมดด้วย `✦` และ `✨` สัญลักษณ์ทองคำ | Antigravity AI |
| **2026-08-31** | **Manual Self-Reveal Flow** | ปรับให้ไพ่คว่ำหน้าเริ่มต้น ผู้ใช้แตะพลิก 3D ด้วยตนเอง | Antigravity AI |
| **2026-08-31** | **78-Card Grand Altar Overhaul** | แก้ปัญหาตัดขอบบน 100%, ริบบิ้นลดหลั่น 3 ชั้น, เอาปุ่มลูกศรออก | Antigravity AI |
| **2026-08-31** | **Step 1 3D Floating Hero Deck** | นำไพ่ลอย 3D พร้อมวงแหวน Mandala คู่จากหน้า 3 มาใส่หน้า 1 | Antigravity AI |
| **2026-08-31** | **PDPA & Safety Hardening** | หน้า `/privacy`, ระบบลบข้อมูล, สายด่วน 1323, A/B Rating Widget | Antigravity AI |
| **2026-08-31** | **TTS Thai Voice Engine** | ระบบอ่านออกเสียงคำทำนายภาษาไทยใน StreamReader | Antigravity AI |
| **2026-08-31** | **IG Story 9:16 & Post 4:5 Export** | ระบบสร้างการ์ดรูปภาพพร้อมแชร์ความละเอียดสูง | Antigravity AI |
| **2026-08-31** | **Provably-Fair Shuffle Engine** | Fisher-Yates + SHA-256 Commit-Reveal Cryptographic Verification | Antigravity AI |
