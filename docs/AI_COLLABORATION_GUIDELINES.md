# 📜 กฎเหล็กและคู่มือการทำงานร่วมกันสำหรับ AI ทุกตัว (Multi-AI Collaboration & Development Guidelines)

> **สำหรับ AI Assistant ทุกตัว (Gemini, Claude, Antigravity, Cursor, Copilot ฯลฯ)**  
> **โปรดอ่านเอกสารนี้ก่อนเริ่มแก้ไขโค้ดทุกครั้ง เพื่อป้องกันการทำงานชนกันหรือทำลายดีไซน์ระดับ Masterpiece ที่สร้างไว้แล้ว**

---

## 🎖️ 0. มาตรฐานการทำงานระดับวิศวกรมืออาชีพ (Engineering Discipline Protocol)

> **อ่านหัวข้อนี้ก่อนทุกหัวข้อ** — นี่คือ "วิธีทำงาน" ที่บังคับใช้กับ AI ทุกตัว
> ส่วนหัวข้อ 1-5 ด้านล่างคือ "กฎเฉพาะของโปรเจกต์นี้"

### 📖 0.1 สิ่งที่ต้องอ่านก่อนแตะโค้ดบรรทัดแรก (บังคับ)

| ลำดับ | เอกสาร | อ่านเพื่ออะไร |
| :-: | :--- | :--- |
| 1 | **[`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md)** | ความผิดพลาดทุกครั้งที่เคยเกิดขึ้น พร้อม **กฎป้องกันถาวร** |
| 2 | **[`docs/KNOWN_ISSUES.md`](KNOWN_ISSUES.md)** | บั๊กที่ยืนยันแล้วว่ามีจริงแต่ยังไม่ได้แก้ กันแก้ซ้ำซ้อนกับ Agent อื่น |
| 3 | เอกสารฉบับนี้ | กฎดีไซน์ ความปลอดภัย และการแบ่ง Domain |
| 4 | [`docs/WORK_LOG.md`](WORK_LOG.md) | สถานะงานล่าสุดและสิ่งที่ค้างอยู่ |

**การทำผิดซ้ำในสิ่งที่มีบันทึกอยู่แล้วใน `INCIDENT_LOG.md` ถือเป็นความบกพร่องร้ายแรงที่สุด** เพราะแปลว่าไม่ได้อ่าน

### 🔬 0.2 หลักการทำงาน 7 ข้อ

1. **วัดก่อนเดา (Evidence over Assumption)**
   ห้ามสรุปสาเหตุจากการอ่านโค้ดอย่างเดียว ต้องมีหลักฐานจริงประกอบเสมอ — ผลจาก `curl -sI`, ค่า `getComputedStyle`, log ของ CI, ตัวเลขที่วัดได้
   *ตัวอย่างจริง (INC-0001): ปัญหาภาพเบลอถูกยืนยันด้วยการอ่าน computed style และเทียบภาพ before/after ไม่ใช่การเดาจากชื่อ CSS*

2. **หาสาเหตุราก ไม่ใช่ดับอาการ (Root Cause, not Symptom)**
   ถามต่อจนกว่าจะตอบได้ว่า **"ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก"** ไม่ใช่แค่ "แก้ตรงไหนแล้วหาย"
   *ตัวอย่างจริง (INC-0005): เทสต์ไม่ถูกรัน — สาเหตุรากไม่ใช่ "ลืมเพิ่ม" แต่คือ "ชุดตรวจถูกเขียนซ้ำ 4 ที่" จึงแก้ที่โครงสร้าง ไม่ใช่แค่เติมบรรทัดที่ขาด*

3. **แก้อาการแรกแล้วต้องรันซ้ำดูผลจริงเสมอ (One Bug May Mask Another)**
   error หนึ่งมักบัง error อีกตัวไว้ อย่าเพิ่งสรุปว่าจบเมื่ออาการแรกหาย
   *ตัวอย่างจริง (INC-0004 → INC-0006): พอแก้ปัญหา `gh` ใน worktree เสร็จ ถึงเห็นว่า auto-merge ปิดอยู่ และพอแก้อันนั้นถึงเห็นว่า deploy ไม่เคยถูก trigger เลย*

4. **พิสูจน์ว่าแก้ได้จริง ไม่ใช่ "น่าจะหายแล้ว" (Verify, don't assume)**
   ต้องมีหลักฐานหลังแก้ทุกครั้ง และต้องทดสอบ **ทั้งเส้นทางที่สำเร็จและเส้นทางที่ล้มเหลว**
   *ตัวอย่างจริง: ทดสอบ `repo:verify` โดยแกล้งใส่ TypeScript error เพื่อยืนยันว่า exit code เป็น 1 จริง ไม่ใช่ดูแค่ว่าตอนผ่านแล้วขึ้น ✓*

5. **รายงานตามจริง แม้ผลจะไม่สวย (Report Honestly)**
   ถ้าทดสอบไม่ครบ ให้บอกว่าไม่ครบและเพราะอะไร ถ้าพลาดเองให้บอกตรง ๆ ว่าพลาด
   ห้ามพูดว่า "เสร็จแล้ว" ถ้ายังไม่ได้ยืนยันด้วยหลักฐาน

6. **แก้เรื่องเดียวต่อหนึ่ง commit และบันทึกบทเรียนเสมอ (One Fix, One Lesson)**
   commit ประเภท `fix` ต้องมี `--cause` และ `--prevention` เสมอ ไม่งั้นระบบจะบล็อกให้อัตโนมัติ

7. **อย่าขยายขอบเขตงานเอง แต่ถ้าเจอปัญหาอื่นระหว่างทางต้องบันทึกไว้ (Stay in Scope, Log the Rest)**
   เจอบั๊กที่ไม่เกี่ยวกับงานที่ทำอยู่ → บันทึกลง `docs/KNOWN_ISSUES.md` ไม่ใช่แก้พ่วงไปเงียบ ๆ หรือปล่อยผ่าน

8. **กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน (Enforce, don't just document)**
   เมื่อความผิดพลาดเดิมเกิดซ้ำทั้งที่มีกฎเขียนไว้แล้ว แปลว่า "เขียนกฎ" อย่างเดียวไม่พอ
   ต้องเปลี่ยนกฎนั้นให้เป็น **ด่านตรวจอัตโนมัติ** ใน `CHECKS` ทันที
   *ตัวอย่างจริง (ISSUE-008): กฎ "ห้ามเขียน path ภาพไพ่เอง" มีบันทึกไว้ใน INC-0002 แล้ว
   แต่ยังถูกละเมิดจนยิง 404 ขึ้น production จึงเพิ่ม `scripts/qa/test-image-paths.ts` มาบังคับ*

   ⚠️ เวลาเพิ่มด่านตรวจกับโค้ดที่ยังมีจุดละเมิดค้างอยู่ **ห้ามทำให้ CI พังทันที** (บทเรียน INC-0007)
   ให้ใช้หลัก **Ratchet**: ใส่จุดที่ละเมิดอยู่เดิมไว้ใน `ALLOWLIST` พร้อมเหตุผลและเลข ISSUE
   ด่านตรวจจะบล็อกเฉพาะการละเมิด "จุดใหม่" และเตือนให้ลบ ALLOWLIST เมื่อแก้หนี้เก่าหมดแล้ว

### 📋 0.3 ระบบบันทึกความผิดพลาดอัตโนมัติ (Mandatory Incident Logging)

**ทุกครั้งที่แก้บั๊ก ต้องบันทึกบทเรียน — ระบบบังคับให้เองอัตโนมัติ**

```bash
npm run commit -- --agent <ชื่อคุณ> --type fix --scope <หมวด> \
  --msg "<แก้อะไร>" \
  --cause "<ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก — สาเหตุราก ไม่ใช่อาการ>" \
  --prevention "<กฎถาวรที่ทำให้เกิดซ้ำไม่ได้อีก>" \
  --severity <critical|high|medium|low> \
  --verify "<พิสูจน์ยังไงว่าแก้ได้จริง>"
```

- ถ้าไม่ใส่ `--cause` หรือ `--prevention` → **`scripts/git-author-guard.ts` จะบล็อกการ commit ทันที**
- เมื่อผ่าน ระบบจะเขียนบันทึกลง [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) ให้เอง **ก่อน** `git add`
  ไฟล์บันทึกจึงถูกรวมอยู่ใน commit เดียวกันกับตัวแก้เสมอ อ่านย้อนหลังแล้วเห็นคู่กัน
- เจอปัญหาแต่ยังไม่ได้ commit ให้บันทึกด้วยมือ: `npm run incident -- --title "..." --cause "..." --prevention "..."`

### ✅ 0.4 ลำดับการทำงานมาตรฐาน (Standard Workflow)

```bash
# 1. อ่านบทเรียนและงานค้างก่อน
#    docs/INCIDENT_LOG.md → docs/KNOWN_ISSUES.md → docs/WORK_LOG.md

# 2. เช็กว่าไม่ชนกับ Agent อื่น แล้วล็อคไฟล์ที่จะแก้
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain <หมวด> --files "<ไฟล์>" --task "<งาน>"

# 3. แก้งาน — วัดก่อนเดา หาสาเหตุราก พิสูจน์ผลจริง

# 4. ตรวจครบ 7 ด่าน
npm run repo:verify

# 5. commit (ถ้าเป็น fix ต้องมี --cause และ --prevention)
npm run commit -- --agent <ชื่อคุณ> --type <feat|fix|perf|refactor|docs> --scope <หมวด> --msg "..."

# 6. ปลดล็อคและซิงก์บันทึกงาน
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run log:sync

# 7. เปิด PR (ระบบจะตรวจ 7 ด่านซ้ำ + merge + deploy ให้เอง)
#    ⚠️ ขั้นนี้ "ห้ามข้าม" — ดู INC-0015 ด้านล่าง
#    ใส่ --wait เพื่อให้รอจน merge เสร็จ แล้วสลับกลับ main + ลบ branch ให้อัตโนมัติ
npm run pr:auto -- "<title>" --body-file <path> --wait

# 8. ถ้าไม่ได้ใช้ --wait ให้เก็บกวาด branch ที่ merge แล้วเองภายหลัง
npm run git:tidy
```

> 🚨 **INC-0015 — ต้องเปิด PR เสมอ ไม่งั้นงานไม่ขึ้น production**
> การ `git push` branch ขึ้น GitHub เฉยๆ **ไม่ทำให้ `pr.yml` (merge) หรือ `deploy.yml` ทำงานเลย**
> automation ทั้งหมดเริ่มทำงาน **เมื่อมี PR เปิดอยู่เท่านั้น** (`pr.yml` trigger จาก `pull_request` event)
> ถ้าคุณ push commit แล้วจบงานโดยไม่รัน `npm run pr:auto` → งานจะค้างอยู่บน branch เฉยๆ
> AI ตัวถัดไปจะเจอ branch ที่ล้าหลัง main + ชน conflict (เคยเกิดจริงกับ `claude/resilience-perf-enhancements` — push 13 commit ทิ้งไว้ ไม่มี PR)
> `npm run git:tidy` จะเตือน "⚠️ มี N commit นำหน้า main แต่ยังไม่ได้เปิด PR" ให้เอง และ pre-push hook ก็เตือนตอน push

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
3. **⚠️ เรื่องต้องรู้เมื่อรันคำสั่ง `gh` จาก git worktree**:
   - AI Agent ทำงานใน git worktree เสมอ ซึ่ง `main` ถูก checkout ค้างไว้ที่โฟลเดอร์หลักอยู่แล้ว
   - คำสั่ง `gh pr merge` / `gh pr checkout` ที่ไม่ระบุ repo จะพยายามยุ่งกับ git ในเครื่องแล้วพังด้วย
     `fatal: 'main' is already checked out at '<path>'`
   - **แก้ด้วยการใส่ `-R <owner>/<repo>` เสมอ** เพื่อบังคับให้ `gh` ทำงานแบบ remote-only
     (`npm run pr:auto` จัดการให้อัตโนมัติแล้ว)

---

## 🛠️ 5. คำสั่งตรวจสอบก่อนและหลังแก้ไขโค้ด (Mandatory Verification Protocol)

ก่อนและหลังแก้ไขโค้ดทุกครั้ง AI **ต้องรันคำสั่งเหล่านี้เพื่อตรวจสอบความถูกต้อง**:

```bash
# ✅ คำสั่งเดียวจบ — ตรวจครบทั้ง 7 ด่านในรอบเดียว
#    (Collision Guard, Typecheck, ไพ่ 78 ใบ, ผัง 20 แบบ, Safety Guardrails, Provably-Fair Shuffle, Card Image Path Guard)
#    ถ้าไม่ผ่าน จะบอกครบทุกด่านที่พังพร้อมข้อความ error เต็ม ไม่ต้องแก้ทีละรอบ
npm run repo:verify

# ซิงก์สถานะและบันทึกงานอัตโนมัติลงใน docs/WORK_LOG.md (Mandatory Auto-Sync)
npm run log:sync

# สร้างภาพไพ่ย่อ WebP ใหม่ (รันเมื่อเพิ่ม/เปลี่ยนภาพใน public/cards/ เท่านั้น)
npm run cards:variants

# ตรวจสอบว่า Dev Server ตอบสนอง 200 OK
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
```

> 🧭 **ชุดตรวจทั้งหมดนิยามไว้ที่เดียว** คือตัวแปร `CHECKS` ใน [`scripts/github-auto.ts`](file:///Users/bank/Desktop/เว็บไพ่/scripts/github-auto.ts)
> ซึ่งถูกใช้ร่วมกันโดย `.githooks/pre-commit`, `.githooks/pre-push`, `npm run commit`, GitHub Actions ทั้ง `pr.yml` และ `deploy.yml`
> **ถ้าเพิ่มสคริปต์ทดสอบใหม่ใน `scripts/qa/` ต้องไปเพิ่มใน `CHECKS` ด้วยเสมอ** ไม่งั้นเทสต์นั้นจะไม่เคยถูกรันอัตโนมัติเลย

---

## 📝 6. บันทึกสถานะระบบและฟีเจอร์ที่เสร็จสมบูรณ์แล้ว (Live System State Registry)

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
