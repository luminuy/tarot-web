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
9. **🖼️ กฎการแสดงภาพหน้าไพ่ (Single Card Image Pipeline)**:
   - ทุกจุดที่แสดงภาพหน้าไพ่ **ต้องใช้คอมโพเนนต์ `<CardImage />`** จาก `src/components/card/CardImage.tsx` เท่านั้น **ห้ามเขียน `<img src="/cards/..." />` เองเด็ดขาด**
   - `<CardImage />` จัดการให้ครบทั้ง 2 เรื่องในที่เดียว:
     1. **Root Path Resolution** — การันตี prefix `/cards/` เสมอ ไม่ให้ sub-route (`/cards`, `/spreads`) ดึงภาพผิดโฟลเดอร์
     2. **Responsive Downscaling** — เลือกไฟล์ WebP ย่อขนาดที่พอดีกับพื้นที่แสดงผลจริงผ่าน `<picture>` + `srcset`
   - **ต้องส่ง prop `sizes` เสมอ** โดยระบุความกว้างจริงที่ภาพถูกแสดง เช่น `sizes="60px"` หรือ `sizes="(min-width: 640px) 112px, 96px"` ถ้าไม่ส่ง ระบบจะเดาเป็น `120px` ซึ่งอาจโหลดไฟล์ใหญ่เกินจำเป็น
   - ใช้ `full` เฉพาะภาพใบใหญ่จริงๆ เท่านั้น (หน้ารายละเอียดไพ่, หน้าซูม, Export ลง Canvas) เพื่อดึงไฟล์ต้นฉบับความละเอียดเต็ม
   - ถ้าต้องการเฉพาะ path (ไม่ใช่ element) ให้ใช้ `getCardImageSrc(image, id)` จาก `src/lib/tarot/card-image.ts`
10. **📐 กฎควบคุมสัดส่วนพรีวิวผังไม่ให้ล้นขอบ (Horizontal Spread Bounds Calibration Standard)**:
   - ในคอนเทนเนอร์การ์ดผังที่มีความกว้างคอลัมน์จำกัด (~220px บน Grid 4 คอลัมน์) **ห้ามวางเรียงไพ่ 7 ใบในแถวเดียวแนวนอนเด็ดขาด** (เพราะความกว้างรวมจะทะลุกรอบออกไป)
   - ผังที่มีไพ่ 7 ใบขึ้นไป (เช่น ผัง 7 วัน และผัง 7 จักระ) **ต้องจัดวางเป็น 2 แถวสมดุล (2-Tier Balanced Formation เช่น 4 + 3 ใบ)** โดยคุมความกว้างรวมไม่เกิน **150px** เพื่อให้พอดีกับกรอบทุกขนาดหน้าจออย่างสมบูรณ์แบบ
11. **💬 กฎการใช้ภาษาที่เป็นธรรมชาติและเข้าใจง่ายเหมือนมนุษย์ (Human-First Natural Copywriting Standard)**:
   - ทุกจุดใน UI เมนู ปุ่ม และคำโปรย **ต้องใช้คำภาษาไทยที่เป็นธรรมชาติ ชัดเจน ตรงไปตรงมา และเข้าใจง่ายทันที เหมือนมนุษย์คุยกับมนุษย์**
   - **❌ ห้ามใช้ศัพท์หุ่นยนต์/ศัพท์ AI แข็งทื่อ หรือศัพท์ภาษาอังกฤษเฉพาะทางที่ไม่จำเป็น** เช่น ห้ามใช้ 'SACRED SANCTUARY', 'Major & Minor Arcana' ใน UI หลักที่คนทั่วไปอ่านยาก, ห้ามใช้ 'เมนูวิหาร' ให้ใช้ **'เมนู'**
   - **✅ ใช้คำที่กระชับและเป็นมิตร**: เช่น **'เมนู'**, **'ผังการเปิดไพ่ (20 แบบ)'**, **'ความหมายไพ่ (78 ใบ)'**, **'ประวัติการดูดวง'**, **'เริ่มดูดวงใหม่'**
12. **⚡ กฎประสิทธิภาพการโหลดภาพไพ่ (Card Image Performance Standard)**:
   - ภาพต้นฉบับ `public/cards/*.jpg` กว้าง ~820px หนักใบละ ~280KB **ห้ามโหลดมาแสดงที่ขนาดเล็ก (34-170px) โดยตรงเด็ดขาด**
   - ต้องใช้ไฟล์ WebP ย่อใน `public/cards/w256/` และ `public/cards/w512/` ผ่าน `<CardImage />` เสมอ
   - ถ้าเพิ่ม/เปลี่ยนภาพไพ่ต้นฉบับ **ต้องรัน `npm run cards:variants` ใหม่ทุกครั้ง** เพื่อสร้างไฟล์ย่อให้ครบ
   - ❌ **ห้ามใส่ `image-rendering: crisp-edges` / `pixelated` / `-webkit-optimize-contrast` กับภาพไพ่เด็ดขาด** — ค่าเหล่านี้บังคับให้เบราว์เซอร์ย่อภาพแบบ nearest-neighbour ทำให้ลายเส้นแตกเป็นเม็ดหยาบจนดูเบลอ (ต้องใช้ `image-rendering: auto` เท่านั้น)
   - `public/_headers` ตั้ง `Cache-Control: max-age=31536000, immutable` ให้ `/cards/*` ไว้แล้ว **ถ้าจำเป็นต้องเปลี่ยนไฟล์ภาพจริงๆ ต้องเปลี่ยนชื่อไฟล์หรือชื่อโฟลเดอร์ด้วยเสมอ** ไม่งั้นคนที่เคยเข้าเว็บจะยังเห็นภาพเก่าไปอีก 1 ปี
   - ℹ️ ภาพเก็บบน **Cloudflare Workers Static Assets** ซึ่งเป็น edge CDN อยู่แล้วและไม่คิดเงินต่อ request — **ไม่ต้องย้ายไป Cloudflare Images หรือ R2** (มีแต่จะเพิ่มค่าใช้จ่าย/latency) ส่วน Image Transformations (`/cdn-cgi/image/`) ใช้ได้เฉพาะเมื่อมี custom domain เท่านั้น

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
| **Card Image Pipeline** | `src/components/card/CardImage.tsx`, `src/lib/tarot/card-image.ts`, `scripts/generate-card-variants.ts`, `public/_headers` | แสดงภาพหน้าไพ่แบบ Responsive (WebP หลายขนาด) และ Resolve path จาก root | ทุกจุดที่แสดงภาพไพ่ต้องผ่าน `<CardImage />` ห้ามใช้ `<img>` ตรงๆ |
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

## 🛡️ 4. ระบบตรวจจับและป้องกันการชนกันของ AI (Multi-AI Agent Collision Guard Protocol)

เพื่อป้องกันไม่ให้ AI หลายตัว (Gemini, Claude, Antigravity, Cursor ฯลฯ) แก้ไขไฟล์เดียวกันพร้อมกันหรือทับซ้อนกัน ให้ปฏิบัติตามกฎนี้เสมอ:

1. **ก่อนเริ่มแก้งาน (Check & Lock)**:
   - ตรวจสอบว่ามี Agent ตัวอื่นล็อคไฟล์อยู่หรือไม่: `npm run agent:status`
   - ตรวจสอบความปลอดภัย: `npm run agent:check`
   - ทำการล็อคไฟล์/Domain ที่จะทำ:
     ```bash
     npm run agent:lock -- --agent <ชื่อคุณ> --domain <หมวดงาน> --files <รายชื่อไฟล์> --task "<รายละเอียดงาน>"
     # ตัวอย่าง:
     npm run agent:lock -- --agent Gemini --domain UI --files "src/components/spread/SpreadBoard.tsx" --task "ปรับปรุงเอฟเฟกต์พลิกไพ่"
     ```
2. **หลังทำงานเสร็จ (Unlock & Auto-Sync)**:
   - ปลดล็อคไฟล์เพื่อให้ Agent ตัวอื่นทำงานต่อได้ทันที:
     ```bash
     npm run agent:unlock -- --agent <ชื่อคุณ>
     ```
   - รันซิงก์สถานะงานอัตโนมัติ: `npm run log:sync`

---

## 🛠️ 5. คำสั่งตรวจสอบก่อนและหลังแก้ไขโค้ด (Mandatory Verification Protocol)

ก่อนและหลังแก้ไขโค้ดทุกครั้ง AI **ต้องรันคำสั่งเหล่านี้เพื่อตรวจสอบความถูกต้อง**:

```bash
# 1. ตรวจสอบว่าไม่มีไฟล์ชนกับ Agent ตัวอื่น
npm run agent:check

# 2. ตรวจสอบ TypeScript Typecheck (ต้องผ่าน 0 errors เสมอ)
npm run typecheck

# 3. ซิงก์สถานะและบันทึกงานอัตโนมัติลงใน docs/WORK_LOG.md (Mandatory Auto-Sync)
npm run log:sync

# 4. ตรวจสอบความถูกต้องของฐานข้อมูลไพ่ 78 ใบ
./node_modules/.bin/tsx scripts/verify-cards.ts

# 4.5 สร้างภาพไพ่ย่อ WebP ใหม่ (รันเมื่อเพิ่ม/เปลี่ยนภาพใน public/cards/ เท่านั้น)
npm run cards:variants

# 5. ตรวจสอบความสมบูรณ์ของ 20 ผังพยากรณ์
./node_modules/.bin/tsx scripts/qa/test-spreads.ts

# 6. ตรวจสอบว่า Dev Server ตอบสนอง 200 OK
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
