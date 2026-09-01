# 🔮 คู่มือแม่บทและระเบียบวิศวกรรมระดับโลก (World-Class AI Operating Guidelines)

ยินดีต้อนรับ! โปรเจกต์นี้คือ **เว็บดูดวงไพ่ทาโรต์ออนไลน์ระดับพรีเมียม (Interactive Provably-Fair Tarot Web)**

> ⚠️ **กฎเหล็กสำคัญ**: ก่อนแก้ไขโค้ดใดๆ ต้องอ่าน 4 ไฟล์นี้เสมอ
> 1. **[docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md)** — ความผิดพลาดที่เคยเกิดขึ้นพร้อมกฎป้องกันถาวร **ทำผิดซ้ำเรื่องที่มีบันทึกแล้ว = ความบกพร่องร้ายแรงที่สุด**
> 2. **[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)** — บั๊กที่ยืนยันแล้วแต่ยังไม่ได้แก้ กันแก้ซ้ำซ้อนกับ Agent อื่น
> 3. **[docs/BACKLOG.md](docs/BACKLOG.md)** — แผนงานเดี่ยวที่ยังเหลือ + **กติกาการทำงาน** (INC-0015/0017/0020: ห้าม push ตรง main, 1 milestone = 1 PR)
> 4. **[docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md)** — คู่มือแม่บท (หัวข้อ 0 คือมาตรฐานการทำงานที่บังคับใช้เสมอ)

---

## 🧭 เอกสารสำคัญในโปรเจกต์ (Documentation Index)

0. **[docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md)**: **(บทเรียนจากความผิดพลาด — อ่านก่อนเสมอ)** ทุกความผิดพลาดที่เคยเกิดขึ้นพร้อมกฎป้องกันถาวร (INC-0001 ถึง INC-0019)
0.5 **[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)**: **(บั๊กค้างและสถานะระบบ)** ดูก่อนเริ่มงานใหม่เพื่อไม่แก้ซ้ำซ้อนกับ Agent ตัวอื่น
1. **[docs/WORK_LOG.md](docs/WORK_LOG.md)**: **(MANDATORY WORK LOG)** บันทึกประวัติสิ่งที่ทำเสร็จแล้ว อะไรแก้ไปแล้ว และอะไรค้างอยู่ (ต้องอัปเดตทุกครั้งหลังทำงานเสร็จ)
2. **[docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md)**: **(MASTER RULEBOOK)** กฎเหล็กการทำงานร่วมกันของ AI, การแบ่ง Domain, กฎดีไซน์ทองคำ
3. **[docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md](docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md)**: **(DEPLOY GUIDE)** ขั้นตอนการนำเว็บขึ้น Cloudflare Workers พร้อมระบบ Secret & Custom Domain
4. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**: สถาปัตยกรรมระดับองค์กร (Enterprise Architecture), กลไกการเข้ารหัสความโปร่งใส (Provably Fair Flow)
5. **[docs/INTERACTIVE_CARD_PICKING.md](docs/INTERACTIVE_CARD_PICKING.md)**: รายละเอียดระบบและ Component สำหรับการให้คนจับไพ่ด้วยตนเอง
6. **[docs/AGENTS_TASK_PLAN.md](docs/AGENTS_TASK_PLAN.md)**: แผนการกระจายงาน 5 เอเจนท์เฉพาะทาง และ Milestone การพัฒนา
7. **[docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md)**: แผงแอดมิน `/admin` — auth, สถิติ, แก้ prompt/ความหมายไพ่แบบ live (Phase 1 เสร็จ M0–M3)
8. **[docs/MARKETPLACE.md](docs/MARKETPLACE.md)**: **(HANDOFF Phase 2)** เอกสารส่งต่องาน Marketplace แม่หมอตัวจริง M4–M7 — SQL schema, code pattern, verification playbook, checklist ครบ
9. **[docs/ENTITLEMENT_PLAN.md](docs/ENTITLEMENT_PLAN.md)**: **(HANDOFF)** แผนลงมือระบบสมาชิกและโควตาเปิดไพ่ — ผู้เยี่ยมชมฟรี 1 ครั้ง, สมาชิก 3 ครั้ง/สัปดาห์, กั้นแชทเฉพาะสมาชิก · SQL, โค้ดจริง, จุดแทรกราย route, 6 PR

---

## 🏛️ สรุปกฎเหล็ก 13 ประการสำหรับวิศวกรและ AI ทุกตัว

0. **บันทึกบทเรียนทุกครั้งที่แก้บั๊ก (สำคัญที่สุด)**: commit ประเภท `fix` **ต้องมี `--cause` และ `--prevention`** ไม่งั้นระบบจะบล็อกให้อัตโนมัติ ระบบจะเขียนบันทึกลง `docs/INCIDENT_LOG.md` ให้เอง เพื่อไม่ให้ AI ตัวไหนทำผิดซ้ำเรื่องเดิม
1. **บันทึกงานทุกครั้ง**: ทำอะไรเสร็จ แก้บั๊ก หรือเพิ่มฟีเจอร์ ต้องอัปเดต `docs/WORK_LOG.md` ทันที
2. **ห้ามใช้อิโมจิการ์ตูนทั่วไป**: ให้ใช้สัญลักษณ์ทองคำเปลว `✦` และ `✨` เท่านั้น
3. **Zero-Clipping Architecture**: ห้ามใส่ `overflow-hidden` หรือ `overflow-x-auto` ย่อยในแต่ละแถวของการ์ด ต้องใช้ Unified Altar Canvas
4. **Manual Self-Reveal**: ไพ่บนผังพยากรณ์เริ่มต้นในสถานะคว่ำหน้าเสมอ ผู้ใช้แตะพลิก 3D ด้วยตนเอง
5. **1909 Rider-Waite Only**: ภาพหน้าไพ่ต้องใช้ภาพดั้งเดิม 1909 จาก `/public/cards/` เท่านั้น ห้ามเปลี่ยนเป็นสไตล์อื่น
6. **Safety Guard**: บล็อกสัญญาณทำร้ายตัวเองทันที และแสดงสายด่วนสุขภาพจิต **1323**
7. **Pure 1909 Spread Artworks**: ใน `TarotArtIcons.tsx` พรีวิวผัง 20 แบบ **ต้องแสดงเฉพาะภาพหน้าไพ่ 1909 ล้วนๆ ห้ามมีกล่องดำหรือตัวหนังสือปิดทับหน้าไพ่เด็ดขาด** (ให้แสดงรายละเอียดใน Accordion ด้านล่าง)
8. **Single Card Image Pipeline**: ทุกจุดที่ Render ภาพหน้าไพ่ **ต้องใช้คอมโพเนนต์ `<CardImage />`** (`src/components/card/CardImage.tsx`) พร้อมส่ง prop `sizes` ตามความกว้างจริงที่แสดง **ห้ามเขียน `<img src="/cards/..." />` เองเด็ดขาด** เพราะจะทั้ง resolve path ผิดใน sub-route และโหลดไฟล์ต้นฉบับ 280KB มาแสดงที่ 34px โดยไม่จำเป็น (ถ้าเพิ่มภาพไพ่ใหม่ ต้องรัน `npm run cards:variants` ด้วย)
9. **Horizontal Spread Bounds**: ผังที่มีไพ่ 7 ใบขึ้นไป (ผัง 7 วัน และ 7 จักระ) **ต้องจัดวางแบบ 2 ชั้นสมดุล (4+3 ใบ)** คุมความกว้างไม่เกิน 150px ป้องกันไพ่ล้นขอบซ้ายขวาออกนอกกรอบการ์ด
10. **Human-First Natural Copywriting**: ใช้คำภาษาไทยที่เป็นธรรมชาติ เข้าใจง่าย ตรงไปตรงมาเหมือนมนุษย์คุยกัน ห้ามใช้ศัพท์หุ่นยนต์/AI แข็งทื่อ เช่น ใช้ "เมนู", "ผังการเปิดไพ่ (20 แบบ)", "ความหมายไพ่ (78 ใบ)", "ประวัติการดูดวง" แทนศัพท์ซับซ้อน
11. **Multi-Agent Collision Guard**: ก่อนเริ่มงานให้ตรวจสอบ `npm run agent:status` และล็อคไฟล์ด้วย `npm run agent:lock` เสมอ หลังทำเสร็จให้ปลดล็อคด้วย `npm run agent:unlock` เพื่อไม่ให้ AI หลายตัวแก้งานชนกัน
12. **One Unified Branch per Milestone & Zero Leftovers**: ห้ามแตกกิ่งย่อยกระจัดกระจายโดยไม่เปิด PR ทันที ต้อง Rebase บน `origin/main` ล่าสุดเสมอ และเมื่อทำงานเสร็จต้องรัน `npm run pr:auto` ➔ `npm run git:tidy` ให้จบสมบูรณ์ 100% ห้ามทิ้งกิ่งค้างหรือปล่อยภาระให้ผู้อื่นตามแก้
13. **Auto-Merge Workflow Enforcement**: เมื่อเปิด PR ให้ใช้ `npm run pr:auto` เสมอ เพื่อให้ CI ตรวจ 7 ด่าน ➔ Auto-Merge (Squash) ➔ Auto-Deploy Cloudflare Workers จบในคำสั่งเดียว

---

## 🛠️ คำสั่งสำหรับทดสอบและรันระบบ

- **ตรวจความปลอดภัยไม่ให้ชนกับ Agent อื่น**: `npm run agent:check`
- **ดูสถานะ Agent ที่กำลังทำงาน**: `npm run agent:status`
- **ล็อคไฟล์ก่อนเริ่มแก้**: `npm run agent:lock -- --agent <ชื่อ> --domain <หมวด> --files <ไฟล์>`
- **ปลดล็อคไฟล์เมื่อทำเสร็จ**: `npm run agent:unlock -- --agent <ชื่อ>`
- **ตรวจครบ 7 ด่านในคำสั่งเดียว (ใช้ตัวนี้เป็นหลัก)**: `npm run repo:verify`
- **ตรวจ Typecheck อย่างเดียว**: `npm run typecheck`
- **ซิงก์สถานะและบันทึกงานอัตโนมัติ (Mandatory)**: `npm run log:sync`
- **สร้างภาพไพ่ย่อ WebP หลายขนาด (รันเมื่อเปลี่ยนภาพต้นฉบับ)**: `npm run cards:variants`
- **บันทึกความผิดพลาดด้วยมือ**: `npm run incident -- --title "..." --severity high --symptom "..." --cause "..." --fix "..." --prevention "..."`
- **ดูสถานะ repo, PR และ CI ล่าสุด**: `npx tsx scripts/github-auto.ts status`
- **ตรวจ + push + สร้าง PR**: `npm run pr:auto -- "<title>" "<body>"`
  เติม `--wait` เพื่อให้รอจน PR merge เสร็จแล้วเก็บกวาด branch ให้อัตโนมัติ
- **เก็บกวาด branch ที่ merge ไปแล้ว (ในเครื่อง + บน remote)**: `npm run git:tidy` (ใส่ `--dry-run` เพื่อดูก่อน)
- **รันเซิร์ฟเวอร์สำหรับพัฒนา**: `npm run dev`
