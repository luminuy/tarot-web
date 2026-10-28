# 🔮 คู่มือทำงานของ AI — SeerTarot

เว็บดูดวงไพ่ทาโรต์ [seertarot.net](https://seertarot.net) · หน้าเว็บ Astro + React island · API และหน้าไดนามิกเป็น Next บน Cloudflare Workers (D1 · KV · R2) · ภาพรวมระบบ: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

> 💬 **ตอบเจ้าของสั้น กระชับ ได้ใจความ** ไม่ต้องอธิบายยืดยาว (คำสั่งเจ้าของ)

## ✅ ก่อนแก้โค้ด

1. [docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md) หัวข้อ **"กฎถาวรสรุป"** — บทเรียนทุกเหตุการณ์รวมไว้ที่เดียว **ทำผิดซ้ำ = บกพร่องร้ายแรงที่สุด** · หาเคสคล้ายให้ค้นทั้งไฟล์นั้นและ `docs/archive/incidents/`
2. [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — บั๊กที่ยังเปิด กันแก้ซ้ำกับเอเจนท์อื่น
3. ตาราง **"อ่านก่อนแตะ"** ด้านล่าง — จะแก้ส่วนไหน อ่านแผนของส่วนนั้นก่อน
4. [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0 — มาตรฐานบังคับ

แผนที่เอกสารทั้งหมด: [docs/INDEX.md](docs/INDEX.md)

> 🔎 **ก่อนบอกเจ้าของว่างานไหน "ค้าง" หรือ "เสร็จ"** — รัน `npm run docs:status` แล้วยืนยันกับโค้ดจริง/`git log` ทุกครั้ง
> เอกสารเป็นแค่ปากทาง ไม่ใช่หลักฐาน (INC-0229: งานลงครบทั้งเว็บแล้วแต่ดัชนียังเขียนว่ารอทีม ➔ รายงานเจ้าของผิด)

## 📝 ทำเสร็จแล้วต้องจดที่ไหน

| เมื่อ | จดที่ |
|---|---|
| ทำงานเสร็จทุกครั้ง | [docs/WORK_LOG.md](docs/WORK_LOG.md) — รอบใหม่อยู่บนสุด |
| แก้บั๊ก | `npm run commit -- --type fix … --symptom --cause --prevention` บันทึกลง INCIDENT_LOG ให้เอง · commit ด้วย `git` ตรง ๆ ต้องรัน `npm run incident` เอง |
| งานอยู่ในแผนไหน | แก้บรรทัด `> **สถานะ**:` ของแผนนั้น + `npm run docs:index` ใน PR เดียวกัน (ด่าน CI ตรวจ) |
| เจอบั๊กที่ยังไม่แก้ / ปิดบั๊ก | [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) — ปิดแล้วย้ายไป `docs/archive/KNOWN_ISSUES_CLOSED.md` |
| ส่ง URL เข้า Google Search Console | [docs/SEO_INDEXING_LOG.md](docs/SEO_INDEXING_LOG.md) — ไม่จด = รอบหน้ายิงซ้ำเปลืองโควตา |
| เพิ่ม/เปลี่ยน secret หรือการตั้งค่า | [docs/PENDING_SETUP.md](docs/PENDING_SETUP.md) |
| บันทึกเกิน 31 วัน | `npm run docs:archive` ย้ายของเก่าไป `docs/archive/` รายเดือน |

## 📋 แผนงาน

<!-- PLANS_INDEX_START · สร้างด้วย npm run docs:index — ห้ามแก้มือ -->

> สร้างจากบรรทัด `> **สถานะ**:` และ `> **อ่านก่อนแตะ**:` ของไฟล์แผน — แก้ที่ไฟล์แผนแล้วรัน `npm run docs:index` (ห้ามแก้ตารางนี้มือ · ด่าน CI ตรวจ)

**งานที่ยังเปิด** (7 แผน · 🚧 ทำแล้วบางส่วน · ⏸️ รอคนนอก/เจ้าของ · ⏳ ยังไม่เริ่ม) — ยืนยันกับโค้ด/`git log` ก่อนรายงานเจ้าของเสมอ

| สถานะ | แผน | สรุป | ตรวจล่าสุด |
|---|---|---|---|
| 🚧 | [🗺️ แผนแม่บทรวม — ทุกงานที่ค้างอยู่](docs/plans/MASTER_PLAN_2026-09-06.md) | เปิดอยู่ 8 เรื่องในตารางข้อ 1 · Claude ทุกเส้น AI ขึ้นแล้ว (#754) · คำอ่าน Claude โหมดคิด + ความเชื่อมโยงไพ่รอขึ้นใน PR draft · INP รอข้อมูล (ISSUE-061) · ที่เหลือรอเจ้าของหรือคนนอก: แม่หมอตรวจเนื้อหา · ทนายรับรอง Reader Studio · บัญชีโซเชียล · บัญชี Apple · เคาะ SEO อังกฤษ | 2026-10-28 |
| 🚧 | [🪐 ผังดวงกำเนิด `/natal-chart` — โหราสากลแบบละเอียด + ไพ่ทาโรต์ประจำทุกตำแหน่ง](docs/plans/NATAL_CHART_PLAN_2026-10-27.md) | งานเทียบคู่แข่ง 2 ระลอก + ระลอกความแม่น (เรื่องเด่น · เวลาเกิดคลาด · ภาพรวม AI · #754) ลงโค้ดครบ (หัวข้อ 3) · ออกแบบหน้าและผลผังใหม่ทุกแท็บ รอเจ้าของตรวจใน PR draft · รอเจ้าของลอง AI และรายงานบนเว็บจริง · รอแม่หมอตรวจเนื้อหา | 2026-10-28 |
| 🚧 | [🧠 แผนยกระดับ "ความแม่น" ของคำอ่าน + "ภาษาไทยที่ถูกต้อง" ของแม่หมอ AI](docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md) | คลื่น A และคลื่น B ลงโค้ดแล้ว · prompt รุ่น `20261011-1` · เจ้าของสั่งใช้ Claude เป็นแกนหลักโดยไม่รอผลวัด: คำอ่านเปิดโหมดคิด · ถามกลับใช้ Haiku · เปิด `RELATIONS_IN_PROMPT` (รอขึ้นใน PR draft) · คลื่น C ยังไม่เริ่ม | 2026-10-28 |
| ⏸️ | [🪞 แผนออกแบบ 14 ระบบ — จากเว็บดูดวงสู่เครื่องมือสะท้อนตัวเอง (สมุดดวง · ความเชื่อมโยงไพ่ · หลักฐานคำอ่าน · พิธีเช้าเย็น · PWA · หน้าคำถาม · Reader Studio · ความปลอดภัย AI · วัดคุณภาพ AI)](docs/plans/REFLECTION_JOURNAL_PLAN_2026-10-05.md) | โค้ดครบ 14 ระบบขึ้น production แล้ว (สมุดดวง · ความเชื่อมโยงไพ่ · หน้าคำถาม · PWA · ความปลอดภัย AI ฯลฯ) · เจ้าของสั่งเปิด `RELATIONS_IN_PROMPT` 2026-10-28 (รอขึ้นใน PR draft) · รอคนนอก: แม่หมอตรวจมุมอ่านกลับหัว 78 ใบและแก่นเรื่อง · ทนายรับรอง DPA + เจ้าของเปิด billing/2FA ก่อนเปิด Reader Studio | 2026-10-28 |
| ⏸️ | [📱 แผนออกแบบระบบ — แอป SeerTarot บน iPhone (iOS App Store)](docs/plans/IOS_APP_PLAN_2026-09-29.md) | หลังบ้านสำหรับแอป (Bearer token · `/api/config/app`) และแอป Expo MVP ใน `mobile/` เสร็จ ผ่าน typecheck และ jest · ยังไม่ลองบน iPhone จริง · งานถัดไป (Sign in with Apple · App Attest · IAP · Push · Widget · TestFlight) รอเจ้าของเปิดบัญชี Apple Developer | 2026-10-26 |
| ⏸️ | [🎯 แผนส่งต่องาน 3 ชิ้น — Yes/No 78 หน้า · Omnichannel · Daily Digest](docs/plans/HANDOFF_OMNI_YESNO_2026-09-06.md) | เซกชัน "ใช่หรือไม่" ในหน้าไพ่ 78 ใบ และ Daily Digest ใช้งานจริง · Omnichannel ได้ 3 จาก 6 ช่องทาง (TikTok · Facebook · LINE OA ใน `BRAND_SOCIAL_PROFILES`) · IG · Threads · X รอเจ้าของเปิดบัญชีแล้วส่งลิงก์ | 2026-10-26 |
| ⏸️ | [🔑 ชีทส่งต่อ — รัน `ai:judge` เก็บ baseline `20260911-1` แล้วลุยคลื่น B ต่อ](docs/plans/HANDOFF_AI_JUDGE_BASELINE_2026-09-11.md) | เครื่องมืออยู่บน main ครบ (ผู้ตัดสินสลับโมเดลเมื่อโดน 429 · ตัดสินซ้ำจาก snapshot · ชุด 100 เคส · workflow `ai-judge.yml`) · รันจริงล่าสุด 2026-10-11 รุ่น `20261011-1` ได้ 4.51/5 ต่างจากรุ่นก่อนแค่ระดับแกว่ง · รอเจ้าของตั้ง secret `JUDGE_GEMINI_API_KEY` / `JUDGE_GROQ_API_KEY` แล้วรันซ้ำ | 2026-10-26 |

**อ่านก่อนแตะ** — จะแก้ส่วนไหน อ่านแผนนั้นก่อน

| ส่วนที่แตะ | อ่านอะไร | แผน |
|---|---|---|
| ภาพรวมงานค้างทั้งเว็บ | เริ่มที่ตารางข้อ 1 (งานที่เปิดจริง ณ วันตรวจ) แล้วค่อยเปิดแผนย่อยที่ลิงก์ไว้ | [MASTER_PLAN_2026-09-06](docs/plans/MASTER_PLAN_2026-09-06.md) |
| หน้า `/natal-chart` · `src/lib/astro/*` · `src/components/natal/*` | หลัก 5 ข้อ (หัวข้อ 2) + กับดัก (หัวข้อ 6) · ตัวคำนวณห้ามติดบันเดิลแรก | [NATAL_CHART_PLAN_2026-10-27](docs/plans/NATAL_CHART_PLAN_2026-10-27.md) |
| prompt และภาษาไทยของแม่หมอ AI | กติกาภาษาไทยฉบับบ้านนี้ (ภาคผนวก A) + rubric ของ LLM Judge (ภาคผนวก B) | [HANDOFF_AI_ACCURACY_THAI_2026-09-07](docs/plans/HANDOFF_AI_ACCURACY_THAI_2026-09-07.md) |
| สมุดบันทึก / ความทรงจำแม่หมอ / ข้อมูลที่ส่งเข้า prompt | กติกาความเป็นส่วนตัว 6 ข้อ (หัวข้อ 3) + กฎ "ไม่ใช้ AI ในที่ที่คำนวณได้" | [REFLECTION_JOURNAL_PLAN_2026-10-05](docs/plans/REFLECTION_JOURNAL_PLAN_2026-10-05.md) |
| แอปมือถือ `mobile/` และ API ที่แอปเรียก | Bearer token กับด่าน Origin (หัวข้อ 4.1) + กฎ App Store ที่ทำให้โดนปฏิเสธ (หัวข้อ 5) | [IOS_APP_PLAN_2026-09-29](docs/plans/IOS_APP_PLAN_2026-09-29.md) |
| หน้า `/spreads` · `/en/spreads` · `SpreadsLibrary` · `spreads-index.tsx` | การแบ่ง 6 หมวด (หัวข้อ 2) + ไพ่เด้ง (หัวข้อ 5) + ด่าน CI ที่ผูกหน้านี้อยู่ (หัวข้อ 8) | [UI_2_0_SPREADS_PLAN_2026-10-13](docs/plans/UI_2_0_SPREADS_PLAN_2026-10-13.md) |
| หน้าแรก / หัวเว็บ / ท้ายเว็บ / โทเคนสี-ฟอนต์ของ UI 2.0 | ระดับเอฟเฟกต์ 3 ชั้น (หัวข้อ 3) + กติกามือถือ (หัวข้อ 5) + ส่วนทดลองแตะไพ่ห้ามกุไพ่ฝั่งเบราว์เซอร์ (หัวข้อ 6.3) | [UI_2_0_PLAN_2026-10-12](docs/plans/UI_2_0_PLAN_2026-10-12.md) |
| สี/คอนทราสต์/ปุ่ม | วิธีตรวจ + หนี้ที่ตั้งใจเหลือไว้ 3 ข้อ | [HANDOFF_UX_UI_AUDIT_2026-09-11](docs/plans/HANDOFF_UX_UI_AUDIT_2026-09-11.md) |
| สีและพื้นผิวกระจก | กับดัก 7 ข้อ: ห้าม `backdrop-filter` นอกไฟล์เอฟเฟกต์ full ของ UI 2.0 (INC-0060) · ด่าน a11y อ่านโทเคนไม่ใช่พิกเซล | [HANDOFF_GLASS_HOME_2026-09-21](docs/plans/HANDOFF_GLASS_HOME_2026-09-21.md) |
| งานแปลไทย ➔ อังกฤษ | อภิธานศัพท์บังคับ + เพดานความยาว | [HANDOFF_EN_TRANSLATION_2026-09-06](docs/plans/HANDOFF_EN_TRANSLATION_2026-09-06.md) |
| การ์ดไพ่ในกริด | สูตรความสูงและกับดัก "หัก 26px" (ด่าน `test-card-tile-height` เฝ้าอยู่) | [HANDOFF_CARD_TILE_CV_2026-09-15](docs/plans/HANDOFF_CARD_TILE_CV_2026-09-15.md) |
| การวัดประสิทธิภาพ | วิธีวัดโดยไม่พึ่งโควตา PSI + กับดักการวัด 4 ข้อ | [HANDOFF_BLOG_TBT_2026-09-12](docs/plans/HANDOFF_BLOG_TBT_2026-09-12.md) |
| หน้า `.astro` และ island | กติกา island 5 ข้อ + กับดัก 7 ข้อ (import ข้อมูลใน island = บันเดิลพุ่ง) | [HANDOFF_ASTRO_MIGRATION_2026-09-15](docs/plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md) |
| ระบบปรึกษาแม่หมอ (โปรไฟล์ · จอง · คิว · แผงแม่หมอ · ห้องวิดีโอ) | หลักออกแบบ 7 ข้อ (หัวข้อ 2) · กับดักหัวข้อ 7 (ลิงก์คิวเปิดได้เบราว์เซอร์เดียว · `sessionSecret` ห้ามออกนอกเซิร์ฟเวอร์) | [CONSULT_FLOW_UX_PLAN_2026-10-11](docs/plans/CONSULT_FLOW_UX_PLAN_2026-10-11.md) |
| งานจากรอบตรวจใหญ่ 2026-10-18 | ผลรายด้านอยู่นอก repo (ขอจากเจ้าของ) · กติกาและสถานะรวมอยู่ในกระดาน `docs/audits/2026-10-18/PROGRESS.md` | [AUDIT_2026-10-18](docs/plans/AUDIT_2026-10-18.md) |
| การตั้งค่า Cloudflare | ข้อเสนอที่ห้ามทำ 5 ข้อ (เช่น Block AI Scrapers) | [HANDOFF_CF_REQUEST_REVIEW_2026-09-08](docs/plans/HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md) |

แผนที่ปิดแล้ว ✅ 36 ไฟล์ · เอกสารอ้างอิง 📚 3 ไฟล์ — รายชื่อเต็มทุกแผนอยู่ใน [docs/INDEX.md](docs/INDEX.md)

<!-- PLANS_INDEX_END -->

---

## 🏛️ กฎเหล็ก (ข้อ 0–14)

0. **แก้บั๊กต้องบันทึกบทเรียน**: commit ประเภท `fix` ต้องมี `--symptom` `--cause` `--prevention` (ระบบบล็อกถ้าขาด) แล้วบันทึกลง `docs/INCIDENT_LOG.md` ให้เอง
1. **บันทึกงานทุกครั้ง**: ลง `docs/WORK_LOG.md` ทันทีที่ทำเสร็จ · งานอยู่ในแผนไหนต้องแก้บรรทัดสถานะของแผนนั้นด้วย (ตารางแผนสร้างอัตโนมัติ ห้ามแก้มือ)
2. **ห้ามอิโมจิและสัญลักษณ์ทุกรูปแบบบนหน้าเว็บ** (เจ้าของสั่ง 2026-10-07 · ขยาย 2026-10-16 "เอาออกทั้งหมดในเว็บ"): ห้ามทั้งตัวอักษร (✦ ✨ → ← ➔ ✓ ✕ ★ ▼ • ฯลฯ) **และรูปทรงตกแต่งที่วาดด้วย CSS/SVG** (เพชร · ดาว · ประกาย · จุดเรืองแสง · ลูกศรประดับปุ่ม) · `GoldMark` ถูกถอดแล้ว ห้ามสร้างกลับ · ปุ่มที่ต้องมีไอคอนจริงใช้ `src/components/ui/LineIcons.tsx` · คะแนนรีวิวเขียนเป็นตัวเลข "4.8/5" · รายการใช้เส้นซ้ายแทนจุดนำ · ข้อความจาก AI ผ่าน `stripEmoji()` ก่อนถึงจอ · ด่าน A5-03/A5-03c ใน `test-code-debt` เฝ้าอยู่ (ยกเว้น © เท่านั้น) — กฎนี้ใช้กับหน้าเว็บ ไม่ใช่เอกสาร
3. **Zero-Clipping**: ห้าม `overflow-hidden`/`overflow-x-auto` ในแถวการ์ดย่อย ใช้ Unified Altar Canvas · **ข้อยกเว้นที่เจ้าของอนุมัติ** (INC-0219): รางเลื่อนทีละใบของ `SpreadBoard` บนจอ < 640px ใช้ `overflow-x-auto` ได้ ต้องคง `pt-8` กันไพ่ยกถูกตัด (ด่าน `test-invisible-element` เฝ้าอยู่) — ห้าม "แก้กลับ"
4. **Manual Self-Reveal**: ไพ่เริ่มต้นคว่ำหน้าเสมอ ผู้ใช้แตะพลิกเอง ห้ามเฉลยหน้าไพ่/ชื่อไพ่ที่ไหนก่อนผู้ใช้พลิก
5. **1909 Rider-Waite เท่านั้น**: ภาพไพ่ดั้งเดิมจาก `/public/cards/`
6. **Safety Guard**: เจอสัญญาณทำร้ายตัวเองให้บล็อกทันทีและแสดงสายด่วน **1323**
7. **ภาพผังไพ่ล้วน**: `TarotArtIcons.tsx` โชว์เฉพาะภาพหน้าไพ่ ห้ามมีกล่อง/ตัวหนังสือทับ (รายละเอียดใส่ Accordion)
8. **ท่อภาพไพ่ท่อเดียว**: ใช้ `<CardImage />` (`src/components/card/CardImage.tsx`) พร้อม `sizes` เสมอ ห้ามเขียน `<img src="/cards/...">` เอง · เพิ่มภาพใหม่ต้องรัน `npm run cards:variants`
9. **ผังใหญ่ห้ามล้นกรอบ**: ผัง ≥ 7 ใบ จอ ≥ 640px วางตามพิกัดผังจริง (`mapLayout`) · จอ < 640px เป็นรางเลื่อนทีละใบ (INC-0219) — แบบ 2 ชั้น (4+3) กว้าง 150px เป็นกติการุ่นเก่า ห้ามย้อนกลับ
10. **ภาษาคน**: ภาษาไทยธรรมชาติ เข้าใจง่าย ห้ามศัพท์หุ่นยนต์แข็งทื่อ
11. **กันเอเจนท์ชนกัน**: เช็ก `npm run agent:status` แล้วล็อกด้วย `agent:lock` ก่อนแก้ ปลดด้วย `agent:unlock` เมื่อเสร็จ (ล็อกอยู่ในเครื่อง — เอเจนท์คนละเครื่องมองไม่เห็นกัน ให้ดู PR ที่เปิดอยู่ด้วย)
12. **หนึ่งงานหนึ่งกิ่ง**: ห้ามแตกกิ่งค้าง · อัปเดตกิ่งจาก `origin/main` ก่อนเปิด PR · จบงานรัน `pr:auto` ➔ `git:tidy`
    - **งานหลายรอบในคำสั่งเดียว = กิ่งเดียว PR เดียว** (เจ้าของสั่ง 2026-10-28: "ทำให้เสร็จที่เดียว ค่อยเอาขึ้นที่เดียว ตรวจรอบเดียวก่อนเอาขึ้น") — ห้ามแตก PR ทีละรอบแล้วขึ้นเว็บหลายครั้ง · ทำครบทุกชิ้นก่อน ➔ `repo:verify` + ดูหน้าจริงรอบเดียว ➔ เปิด PR เดียว
13. **จบงาน = เปิด PR ด้วย `npm run pr:auto`** ➔ CI ตรวจ 96 ด่าน ➔ auto-merge (squash) ➔ deploy Cloudflare Workers อัตโนมัติ
    - **push เฉย ๆ = งานยังไม่เสร็จ** — CI/merge/deploy เริ่มเมื่อเปิด PR เท่านั้น · ห้ามอ้างว่า "ผู้ใช้ไม่ได้สั่งให้เปิด PR" แล้วหยุดแค่ push (INC-0043) — เป็นคำสั่งยืนของเจ้าของ
    - **ยกเว้นเจ้าของสั่ง "อย่าพึ่งขึ้น"**: push กิ่งได้ แต่ห้ามเปิด PR ที่ไม่ใช่ draft (PR ที่ไม่ใช่ draft = merge + deploy อัตโนมัติ) · รายงานเจ้าของว่างานรออยู่บนกิ่งไหน
    - ไม่มี `gh` (เช่น Claude Code บนเว็บ) ➔ เปิด PR ผ่าน GitHub API/MCP แทน แล้วแจ้งข้อจำกัด
    - `main` มี branch protection: ด่าน `🧪 Automated Verification & Quality Audit` ต้องผ่านก่อน merge (INC-0103) · PR ที่เป็น draft ไม่รันด่านนี้ ➔ merge ไม่ได้จนกว่าจะกด Ready for review
14. **ห้ามกุไพ่ (Zero Fabricated Cards)**: ทุกขั้น (สับ · เลือก · กู้คืนเซสชัน · สตรีมคำทำนาย · แชท) ห้ามมีโค้ด fallback ที่สร้างไพ่ใบใดขึ้นมาเอง ข้อมูลไพ่หายหรือไม่ครบให้คืน `undefined`/error แล้วบอกผู้ใช้ให้ **"โหลดใหม่อีกครั้ง"** — รักษา Provably Fair

---

## 🤝 ผู้ช่วยผู้บริหาร (เรียกด้วยคำเดียว)

ข้อความของเจ้าของที่ขึ้นต้นด้วย `cmo` `coo` หรือ `cto` (ไม่สนตัวพิมพ์) ให้ส่งส่วนที่เหลือไปยัง subagent ชื่อเดียวกันใน `.claude/agents/` ด้วยเครื่องมือ Agent (`subagent_type` = ชื่อนั้น) แล้วส่งผลกลับให้เจ้าของ
- `cmo` = การตลาดและการเติบโต · `coo` = การดำเนินงาน ต้นทุน สถานะงาน · `cto` = เทคโนโลยี ความปลอดภัย ระบบ
- ไม่มีข้อความตามหลัง ให้ถามว่าต้องการอะไร

## 🛠️ คำสั่งหลัก

| คำสั่ง | ใช้ทำอะไร |
|---|---|
| `npm run dev` | เซิร์ฟเวอร์พัฒนา (ขั้นตอนเต็ม: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)) |
| `npm run typecheck` | typecheck อย่างเดียว |
| `npm run repo:verify` | ชุดตรวจหลักครบ 96 ด่าน (ด่านเดียวกับ CI) |
| `npm run commit -- --agent <ชื่อ> --type <ชนิด> --msg "…"` | commit พร้อมตรวจ + บันทึก incident เมื่อเป็น `fix` |
| `npm run pr:auto -- "<title>" "<body>"` | ตรวจ + push + เปิด PR (`--wait` รอ merge แล้วเก็บกวาดกิ่ง) |
| `npm run git:tidy` | เก็บกวาดกิ่งที่ merge แล้ว (`--dry-run` ดูก่อน) |
| `npx tsx scripts/github-auto.ts status` | สถานะ repo/PR/CI ล่าสุด |
| `npm run agent:status` · `agent:check` · `agent:lock` · `agent:unlock` | กันเอเจนท์ชนกัน (กฎข้อ 11) |
| `npm run docs:status` | แผนที่ยังเปิด + อายุการตรวจ (รันก่อนรายงานงานค้างทุกครั้ง) |
| `npm run docs:index` | สร้างตารางแผนใน CLAUDE.md / docs/INDEX.md ใหม่จากหัวสถานะของไฟล์แผน |
| `npm run docs:archive` | ย้ายรายการเกิน 31 วันใน WORK_LOG / INCIDENT_LOG ไป `docs/archive/` (`-- --dry-run` ดูก่อน) |
| `npm run incident -- --title "…" --severity high --symptom "…" --cause "…" --fix "…" --prevention "…"` | บันทึก incident ด้วยมือ |
| `npm run log:sync` | เขียนสถานะระบบลง `docs/WORK_LOG.status.md` (ไม่ track ใน git) |
| `npm run exec:report` | รายงานผู้บริหารจากข้อมูลจริง แบบอ่านอย่างเดียว (`-- --days 7\|28\|90` · ต้องมี `ADMIN_REPORT_TOKEN` · ดู docs/PENDING_SETUP.md) |
| `npm run cards:variants` | สร้างภาพไพ่ WebP หลายขนาด (เมื่อเปลี่ยนภาพต้นฉบับ) |
| `npm run cf:canonical-host -- --check` | เช็กว่าโฮสต์ `www` เด้ง 301 กลับโดเมนหลัก (ถอด `--check` = ดันกฎขึ้นขอบ · ต้องมี `CLOUDFLARE_API_TOKEN` สิทธิ์ `Zone · Single Redirect · Edit`) |
