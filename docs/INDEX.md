# แผนที่เอกสาร SeerTarot

หน้านี้คือรายชื่อเอกสารทุกไฟล์ แบ่งตามหน้าที่ · กติกาการทำงานและคำสั่งหลักอยู่ที่ [CLAUDE.md](../CLAUDE.md) ที่เดียว

> **หลักของเอกสารชุดนี้**
> - เรื่องหนึ่งมีบ้านเดียว — ไฟล์อื่นลิงก์มา ไม่คัดลอก (ข้อความที่คัดลอกไปหลายที่จะเพี้ยนจากกันเสมอ)
> - เอกสารเป็นปากทาง ไม่ใช่หลักฐาน — ก่อนบอกว่างานไหนเสร็จหรือค้าง ให้ยืนยันกับโค้ดหรือ `git log` (INC-0229)
> - ตัวเลขในเอกสารแม่บท (จำนวนด่าน · ผัง · ตำแหน่ง) มีด่าน `scripts/qa/test-docs-numbers.ts` เทียบกับโค้ดทุก PR

## อ่านอะไรก่อน (ตามบทบาท)

| บทบาท | ลำดับการอ่าน |
| :--- | :--- |
| **AI ที่จะแก้โค้ด** | [CLAUDE.md](../CLAUDE.md) ➔ [INCIDENT_LOG.md](INCIDENT_LOG.md) ส่วน "กฎถาวรสรุป" ➔ [KNOWN_ISSUES.md](KNOWN_ISSUES.md) ➔ [AI_COLLABORATION_GUIDELINES.md](AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0 ➔ แผนที่ครอบงานนั้น (ดูช่อง "อ่านก่อนแตะ" ในตารางแผนของ CLAUDE.md) |
| **เจ้าของโปรเจกต์** | งานที่ยังเปิด: ตารางแผนใน [CLAUDE.md](../CLAUDE.md) หรือ `npm run docs:status` ➔ สิ่งที่รอเจ้าของตั้งค่า: [PENDING_SETUP.md](PENDING_SETUP.md) ➔ แผงแอดมิน: [ADMIN_PANEL.md](ADMIN_PANEL.md) ➔ การตัดสินใจที่ผ่านมา: [exec/DECISIONS.md](exec/DECISIONS.md) ➔ งานล่าสุด: [WORK_LOG.md](WORK_LOG.md) |
| **นักพัฒนาคนใหม่** | [README.md](../README.md) ➔ [LOCAL_SETUP.md](LOCAL_SETUP.md) ➔ [ARCHITECTURE.md](ARCHITECTURE.md) ➔ [CLOUDFLARE_DEPLOYMENT_GUIDE.md](CLOUDFLARE_DEPLOYMENT_GUIDE.md) ➔ [CLAUDE.md](../CLAUDE.md) |

## 1. เริ่มที่นี่

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [README.md](../README.md) | ภาพรวมเว็บ · เทคโนโลยี · โครงสร้างรีโป |
| [CLAUDE.md](../CLAUDE.md) | กฎเหล็ก (ข้อ 0–14) · ต้องจดอะไรที่ไหน · คำสั่งหลัก · แผนที่ยังเปิด + ตาราง "อ่านก่อนแตะ" — ใช้กับ AI ทุกตัว |
| [GEMINI.md](../GEMINI.md) · [AGENTS.md](../AGENTS.md) | ทางเข้าของ Gemini/Antigravity และเอเจนต์อื่น — ชี้กลับ CLAUDE.md พร้อมข้อต่างเฉพาะเครื่องมือ |
| [LOCAL_SETUP.md](LOCAL_SETUP.md) | ติดตั้งและรันในเครื่อง |

## 2. กติกาและมาตรฐาน

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [AI_COLLABORATION_GUIDELINES.md](AI_COLLABORATION_GUIDELINES.md) | วิธีทำงาน (หัวข้อ 0 บังคับ) · รายละเอียดและเหตุผลของกฎเหล็ก · แผนที่ไฟล์ตามหน้าที่ · ความปลอดภัย |
| [exec/DECISIONS.md](exec/DECISIONS.md) | การตัดสินใจและการทดลองของผู้บริหาร — ผู้ช่วย `cmo` · `coo` · `cto` อ่านก่อนเสนอ |
| [exec/AGENT_EVALS.md](exec/AGENT_EVALS.md) | ชุดคำถามทดสอบผู้ช่วย `cmo` · `coo` · `cto` — รันก่อนและหลังแก้ไฟล์ใน `.claude/agents/` |

## 3. บันทึกและทะเบียน

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [INCIDENT_LOG.md](INCIDENT_LOG.md) | เปิดด้วย "กฎถาวรสรุป" (อ่านส่วนนี้ก่อนเสมอ) ตามด้วยเหตุการณ์ 31 วันล่าสุด · commit ประเภท `fix` เขียนให้เอง · ของเก่าอยู่ใน [คลังเก่า](#8-คลังเก่า-docsarchive) |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | บั๊กที่ยังเปิดอยู่เท่านั้น — กันแก้ซ้ำกับเอเจนต์อื่น |
| [WORK_LOG.md](WORK_LOG.md) | งานที่ทำใน 31 วันล่าสุด — ต้องเติมทุกครั้งที่ทำงานเสร็จ |
| [SEO_INDEXING_LOG.md](SEO_INDEXING_LOG.md) | ทะเบียน URL ที่ส่งเข้า Google Search Console — จดทุกครั้งที่ส่ง กันยิงซ้ำ |

## 4. ระบบและการปฏิบัติการ

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Astro + Next บน Cloudflare Workers · เส้นทางไหนเสิร์ฟจากไหน · binding · AI · Provably Fair · ความปลอดภัย |
| [CLOUDFLARE_DEPLOYMENT_GUIDE.md](CLOUDFLARE_DEPLOYMENT_GUIDE.md) | deploy · โดเมน · CI/CD · ถอยกลับ · สำรองและกู้ D1 |
| [CLOUDFLARE_OPTIMIZATION_GUIDE.md](CLOUDFLARE_OPTIMIZATION_GUIDE.md) | การตั้งค่าขอบ Cloudflare · คุมต้นทุน · วิธีวัด |
| [PENDING_SETUP.md](PENDING_SETUP.md) | ทะเบียน secret และบริการภายนอก — อะไรตั้งแล้ว อะไรยังรอเจ้าของ |
| [ADMIN_PANEL.md](ADMIN_PANEL.md) | แผงแอดมิน `/admin` และหน้าตรวจสุขภาพระบบ |

## 5. สเปกและการตัดสินใจทางสถาปัตยกรรม

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [TAROT_CARD_FEATURES.md](TAROT_CARD_FEATURES.md) | สเปกหลักของโดเมนไพ่ — สำรับ 78 ใบ · ความหมาย 5 หมวด · ผัง · Pick a Card · การสับไพ่ |
| [specs/INTERACTIVE_CARD_PICKING.md](specs/INTERACTIVE_CARD_PICKING.md) | การให้ผู้ใช้จับไพ่เองจากพัด 78 ใบ |
| [specs/MARKETPLACE.md](specs/MARKETPLACE.md) | ระบบแม่หมอตัวจริง — โปรไฟล์ · จอง · คิว · ห้องวิดีโอ |
| [specs/ENTITLEMENT_ABUSE_MODEL.md](specs/ENTITLEMENT_ABUSE_MODEL.md) | สิทธิ์เปิดไพ่ฟรีและวิธีกันโกง (threat model) |
| [specs/DESIGN_SYSTEM_V2.md](specs/DESIGN_SYSTEM_V2.md) | **ถูกแทนแล้วด้วย UI 2.0** — ระบบดีไซน์รุ่น 2026-09-03 เก็บเป็นประวัติ · ของปัจจุบันคือ `plans/UI_2_0_PLAN_2026-10-12.md` + โทเคน `--ui2-*` ใน `src/styles/ui2-base.css` |
| [adr/ADR-001-marketplace-pdpa.md](adr/ADR-001-marketplace-pdpa.md) | ADR-001 — ข้อมูลส่วนบุคคลในระบบแม่หมอ (PDPA) |
| [adr/ADR-002-bot-challenge.md](adr/ADR-002-bot-challenge.md) | ADR-002 — กันบอทและคุมต้นทุน AI โดยไม่ใช้ captcha ระหว่างเปิดไพ่ |
| [adr/ADR-003-cutting-edge-stack-rationale.md](adr/ADR-003-cutting-edge-stack-rationale.md) | ADR-003 — เหตุผลที่ใช้ไลบรารีรุ่นใหม่และวิธีรับความเสี่ยง (เลขรุ่นในไฟล์เป็นของวันที่ 2026-09-02) |

## 6. แผนงาน (`docs/plans/`)

สถานะของแต่ละแผนอยู่ที่บรรทัด `> **สถานะ**:` ใต้หัวเรื่องของไฟล์แผนนั้นที่เดียว · รายการข้างล่างและตารางใน CLAUDE.md สร้างจากบรรทัดนั้นด้วย `npm run docs:index` (ห้ามแก้มือ — ด่าน CI เทียบทุกไบต์)
🚧 ทำแล้วบางส่วน · ⏸️ รอคนนอก/เจ้าของ · ⏳ ยังไม่เริ่ม · ✅ เสร็จแล้ว · 📚 เอกสารอ้างอิง — เนื้อหาในตัวแผนเป็นบันทึก ณ วันที่เขียน

```
docs/plans/
<!-- PLANS_TREE_START · สร้างด้วย npm run docs:index — ห้ามแก้มือ -->
        ├── MASTER_PLAN_2026-09-06.md               # 🚧 🗺️ แผนแม่บทรวม — ทุกงานที่ค้างอยู่
        ├── HANDOFF_AI_ACCURACY_THAI_2026-09-07.md  # 🚧 🧠 แผนยกระดับ "ความแม่น" ของคำอ่าน + "ภาษาไทยที่ถูกต้อง" ของแม่หมอ AI
        ├── REFLECTION_JOURNAL_PLAN_2026-10-05.md   # ⏸️ 🪞 แผนออกแบบ 14 ระบบ — จากเว็บดูดวงสู่เครื่องมือสะท้อนตัวเอง (สมุดดวง · ความเชื่อมโยงไพ่ · หลักฐานคำอ่าน · พิธีเช้าเย็น · PWA · หน้าคำถาม · Reader Studio · ความปลอดภัย AI · วัดคุณภาพ AI)
        ├── IOS_APP_PLAN_2026-09-29.md              # ⏸️ 📱 แผนออกแบบระบบ — แอป SeerTarot บน iPhone (iOS App Store)
        ├── HANDOFF_OMNI_YESNO_2026-09-06.md        # ⏸️ 🎯 แผนส่งต่องาน 3 ชิ้น — Yes/No 78 หน้า · Omnichannel · Daily Digest
        ├── HANDOFF_AI_JUDGE_BASELINE_2026-09-11.md # ⏸️ 🔑 ชีทส่งต่อ — รัน `ai:judge` เก็บ baseline `20260911-1` แล้วลุยคลื่น B ต่อ
        ├── UI_2_0_SPREADS_PLAN_2026-10-13.md       # ✅ 🃏 SeerTarot UI 2.0 — หน้าผังพยากรณ์ `/spreads` แบบ "ไพ่กระจาย 6 หมวด แตะแล้วเด้ง" (แผนส่งต่อให้ทีมลงมือ)
        ├── UI_2_0_PLAN_2026-10-12.md               # ✅ 🎨 SeerTarot UI 2.0 — หน้าแรกแบบ D+ และภาษาดีไซน์ใหม่ (แผนส่งต่อให้ทีมลงมือ)
        ├── SITE_SHELL_SEO_PLAN.md                  # ✅ 🏛️ แผนลงมือ: Site Shell กลาง + Internal Link ที่บอทมองเห็น
        ├── RETENTION_PLAN.md                       # ✅ 👤 แผนสร้าง Consumer Retention Infra — handoff ให้ทีม Gemini
        ├── QUICK_FORTUNE_PLAN.md                   # ✅ ⚡ แผนฟีเจอร์ "ทำนายด่วน" (Quick Fortune — 1 ใบ ไม่ต้องเลือกไพ่)
        ├── QUICK_CHAT_RESULT_PLAN.md               # ✅ ⚡ แผนฟีเจอร์ "หน้าผลลัพธ์ทำนายด่วน" (Quick Chat Result — แยกจากหน้าฝังใหญ่)
        ├── PROVABLY_FAIR_PLAN.md                   # ✅ 🔐 แผนปิดช่องว่าง Provably-Fair ที่เหลือ 2 จุด — handoff ให้ Gemini
        ├── HANDOFF_UX_UI_AUDIT_2026-09-11.md       # ✅ 🔍 แผนส่งต่อ — ผลตรวจ UX/UI ทั้งเว็บ (รอบ 2026-09-11)
        ├── HANDOFF_THEME_THREE_PAGES_2026-09-06.md # ✅ ✦ แผนส่งต่องาน — ตัดขั้นตอนสับ/เลือกไพ่ ให้ 3 หน้า one-card เร็วแบบ "เปิดไพ่ด่วน"
        ├── HANDOFF_SMOOTH_FAST_2026-09-06.md       # ✅ ✦ แผนทำให้เว็บ "สมูทและไว" ระดับโลก — ทุกหน้า ทุกจังหวะ (2026-09-06)
        ├── HANDOFF_SEO_WAVE2-4_2026-09-05.md       # ✅ 🌊 แผนส่งต่องาน SEO คลื่นที่ 2–4 (ยึด /cards · ลอกหมวดหมู่ MyHora · งานระยะยาว)
        ├── HANDOFF_SEO_WAVE1_2026-09-05.md         # ✅ 🌊 แผนส่งต่องาน SEO คลื่นที่ 1 — เติมคำว่า "ไพ่ยิปซี" ทั่วเว็บ
        ├── HANDOFF_SEMANTIC_SEARCH_2026-09-06.md   # ✅ 🔎 แผนต่อ UI ค้นหาเชิงความหมาย — ปลุก Vectorize + Workers AI ที่สร้างไว้แล้วให้ได้ใช้จริง (2026-09-06)
        ├── HANDOFF_ROUND2_CLOSEOUT_2026-09-17.md   # ✅ 🧾 ปิดสี่เรื่องสุดท้ายของผลตรวจรอบ 2 (ISSUE-049)
        ├── HANDOFF_QA_SPREADS_2026-09-06.md        # ✅ 🧪 แผนส่งต่องาน QA — พิสูจน์ผังใหม่ทั้ง 5 ด้วยการใช้งานจริง + ปิดช่องโหว่ `guestAllowed` ที่ไม่มีผลบังคับ
        ├── HANDOFF_PERF_SEO_AUDIT_2026-09-06.md    # ✅ ⚡ แผนยกเครื่องประสิทธิภาพ · โค้ดตาย · SEO — รอบตรวจใหญ่ 2026-09-06
        ├── HANDOFF_OG_IMAGES_2026-09-07.md         # ✅ 🖼️ แผนส่งต่อ — ยกเครื่องภาพแชร์ทั้งเว็บ 299 หน้า (OG Image Overhaul)
        ├── HANDOFF_MEDIA_FIX_2026-09-06.md         # ✅ 🖼️ แผนแก้ท่อสื่อและกับดักที่เหลือ — ตรวจหลัง PR #319–#325 (2026-09-06)
        ├── HANDOFF_HEADER_20260905.md              # ✅ 🧭 บันทึกส่งต่อและผลการแก้ไข "แถบ header ค้าง" (Header Hang — Resolved & Verified Record)
        ├── HANDOFF_GLASS_HOME_2026-09-21.md        # ✅ ✦ แผนส่งต่องาน — หน้าแรก "ประตูเดียว" + ธีมกระจกอุ่น (Warm Liquid Glass)
        ├── HANDOFF_EN_TRANSLATION_2026-09-06.md    # ✅ 🌏 แผนส่งงานแปลไทย → อังกฤษ (ขั้น C ของแผนเปิด SEO ภาษาอังกฤษ)
        ├── HANDOFF_EN_ROUTING_2026-09-06.md        # ✅ 🌐 แผนเปิด SEO ภาษาอังกฤษจริง — เส้นทางแยก `/en/...` แบบ prerender สองภาษา
        ├── HANDOFF_EN_BIRTH_CARD_2026-09-09.md     # ✅ 🎂 แผนเปิดหน้าอังกฤษ `/en/cards/birth-card` (ขั้น C ก้อนสุดท้ายของเส้นทางสองภาษา)
        ├── HANDOFF_DOCS_TRUTH_2026-09-06.md        # ✅ 🧾 แผนส่งต่องาน — ปิดหนี้ที่เหลือหลัง SEO คลื่น 2–4 (เอกสารตรงกับของจริง + บทนำถึงเกณฑ์)
        ├── HANDOFF_CARD_TILE_CV_2026-09-15.md      # ✅ 📐 คู่มือสูตรความสูงการ์ดไพ่ + วิธีวัดใหม่ (ทำวันที่ 2026-09-15)
        ├── HANDOFF_BUNDLE_DIET_2026-09-07.md       # ✅ ⚡ แผนส่งต่องาน — ลดน้ำหนัก JS รอบสุดท้ายให้เข้าเกณฑ์ระดับโลก
        ├── HANDOFF_BLOG_TBT_2026-09-12.md          # ✅ ⚡ แผนส่งต่อ — หา TBT ที่หายไปของหน้า `/blog` (ทำวันที่ 2026-09-12)
        ├── HANDOFF_ASTRO_MIGRATION_2026-09-15.md   # ✅ 🪶 แผนย้ายเว็บไปสถาปัตยกรรม Astro + React Island
        ├── HANDOFF_ADMIN_REDEEM_2026-09-12.md      # ✅ 🎟️ แผนส่งต่อ — หน้าจัดการรหัสแลกสิทธิ์ในแผงแอดมิน (Admin Redeem Code Manager)
        ├── HANDOFF_2026-09-04.md                   # ✅ 📦 แผนส่งต่องานที่ยังค้าง หลังการตรวจใหญ่ 2026-09-04 (Handoff Plan)
        ├── ENTITLEMENT_PLAN.md                     # ✅ 🎟 ระบบสมาชิกและโควตาเปิดไพ่ — แผนลงมือสำหรับทีม Antigravity
        ├── EMAIL_AUTH_PLAN.md                      # ✅ 📧 แผนเพิ่ม "เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน" — handoff ให้ทีมอีกทีม
        ├── CONSULT_FLOW_UX_PLAN_2026-10-11.md      # ✅ 🛎️ แผนยกเครื่องขั้นตอน "ปรึกษาแม่หมอ" ให้ใช้ง่ายแบบเว็บจองระดับโลก
        ├── CLOUDFLARE_FREE_STACK.md                # ✅ ☁️ แผนใช้บริการฟรีของ Cloudflare ต่อยอด SeerTarot
        ├── AUDIT_2026-10-18.md                     # ✅ 🔍 แผนตรวจใหญ่ทั้งระบบ รอบ 2026-10-18 — บั๊ก · ความปลอดภัย · โค้ดตาย · SEO · UX/UI · ประสิทธิภาพ
        ├── AI_COST_CONTROL_PLAN.md                 # ✅ 💸 แผนคุมต้นทุน AI + รหัสทดสอบข้าม rate limit — handoff ให้ทีม Gemini
        ├── HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md # 📚 🔍 ตรวจข้อเสนอ 12 ข้อ "ลด Request บน Cloudflare" (2026-09-08)
        ├── BACKLOG.md                              # 📚 📋 Backlog — งานที่ยังเหลือ (2026-09-04)
        └── AI_INTELLIGENCE_PLAN.md                 # 📚 🧠 แผนแม่บทยกระดับความฉลาดของแม่หมอ AI
<!-- PLANS_TREE_END -->
```

## 7. ผลตรวจ รีวิว กฎหมาย และงานแปล

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [audits/2026-09-23/PROGRESS.md](audits/2026-09-23/PROGRESS.md) | กระดานตรวจใหญ่รอบ 2026-09-23 (ปิดครบ) · ผลรายด้าน `A1`–`A8` อยู่โฟลเดอร์เดียวกัน |
| [audits/2026-10-18/PROGRESS.md](audits/2026-10-18/PROGRESS.md) | กระดานตรวจใหญ่รอบ 2026-10-18 · ผลรายด้านไม่อยู่ใน repo (มีรายละเอียดช่องโหว่) — ขอจากเจ้าของ · แผนคู่กันคือ `plans/AUDIT_2026-10-18.md` |
| [review/READER_REVIEW_2026-10-10.md](review/READER_REVIEW_2026-10-10.md) | ชีทแม่หมอตรวจคำแนะนำรายใบ 78 ใบ + คู่ไพ่ 65 คู่ — ตรวจแล้ว |
| [review/READER_REVIEW_2026-10-11.md](review/READER_REVIEW_2026-10-11.md) | ชีทแม่หมอตรวจมุมอ่านกลับหัวรายใบ (รอบ 4) — รอตรวจ |
| [legal/READER_STUDIO_DPA_DRAFT.md](legal/READER_STUDIO_DPA_DRAFT.md) | ร่างข้อตกลงประมวลผลข้อมูลของสตูดิโอแม่หมอ — รอทนายรับรอง |
| [legal/READER_TERMS_DRAFT.md](legal/READER_TERMS_DRAFT.md) | ร่างเงื่อนไขการใช้บริการสำหรับแม่หมอ — รอทนายรับรอง |
| `i18n/pending-en.json` | คิวข้อความที่ยังไม่มีฉบับอังกฤษ — สร้างด้วย `npm run i18n:export` นำเข้าด้วย `npm run i18n:import` |

## 8. คลังเก่า (`docs/archive/`)

ของเก่าเก็บแบบคำต่อคำ ค้นด้วย `grep -rn "<คำ>" docs/archive/` · ห้ามแก้เนื้อหาย้อนหลัง · รายละเอียดอยู่ใน [archive/README.md](archive/README.md)

| ที่เก็บ | มีอะไร | ย้ายมาอย่างไร |
| :--- | :--- | :--- |
| `archive/work-log/WORK_LOG_YYYY-MM.md` | รอบงานใน WORK_LOG ที่เก่ากว่า 31 วัน แยกตามเดือน | `npm run docs:archive` (ดูก่อนด้วย `-- --dry-run`) |
| `archive/incidents/INCIDENT_LOG_YYYY-MM.md` | เหตุการณ์ใน INCIDENT_LOG ที่เก่ากว่า 31 วัน แยกตามเดือน — เลข INC ในนี้ยังอ้างได้ (ด่านเลข INC อ่านทั้งไฟล์หลักและคลังเก่า) · บทเรียนของทุกเหตุการณ์สรุปอยู่ใน "กฎถาวรสรุป" ของ INCIDENT_LOG | `npm run docs:archive` |
| [archive/KNOWN_ISSUES_CLOSED.md](archive/KNOWN_ISSUES_CLOSED.md) | ISSUE ที่ปิดแล้ว | ย้ายด้วยมือตอนปิดบั๊ก |
| [plans/archive/](plans/archive/) | แผนที่เป็นประวัติล้วน — ไม่มีงานค้าง ไม่มีข้อห้ามที่ยังใช้ (`UX_PERF_PLAN` · `TRAFFIC_CAPTURE_PLAN_2026-09-05` · `AUDIT_2026-09-01` · `AGENTS_TASK_PLAN` · ย้าย 2026-10-27 #729) · ไม่อยู่ในตารางแผน | ย้ายด้วยมือ · แผนที่ยังมี "อ่านก่อนแตะ" ห้ามย้าย |

> ไฟล์ที่ไม่ใช่เอกสาร: `docs/WORK_LOG.status.md` (เขียนโดย `npm run log:sync`) และ `docs/AUDIT_LOG.md` (เขียนโดยเครื่องมือ commit) ถูกสร้างในเครื่องและไม่อยู่ใน git — ประวัติจริงคือ `git log` กับ INCIDENT_LOG
