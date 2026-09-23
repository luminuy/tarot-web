# 🧭 แผนที่นำทางเอกสารแม่บท (Engineering Documentation Index & Sitemap)

ยินดีต้อนรับสู่ศูนย์รวมเอกสารวิศวกรรมแม่บทของ **SeerTarot (วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ระดับพรีเมียม · seertarot.net)**  
เอกสารทั้งหมดถูกจัดระเบียบตามมาตรฐานวิศวกรรมระดับโลก เพื่อให้ทั้งนักพัฒนาที่เป็นมนุษย์ (Human Engineers) และปัญญาประดิษฐ์ (AI Agents) สามารถค้นหา บริบท ทำความเข้าใจ และส่งต่องานกันได้อย่างแม่นยำ ไร้รอยต่อ 100%

---

## 🏛️ โครงสร้างสารบบเอกสาร (Documentation Tree)

```
docs/
├── 🛡️ ระเบียบปฏิบัติการและกฎแม่บท (Core Operating Protocols)
│   ├── AI_COLLABORATION_GUIDELINES.md   # กฎเหล็ก AI, การแบ่ง Domain, 14 Golden Design Rules
│   ├── INCIDENT_LOG.md                  # บันทึกบทเรียนความผิดพลาด (Blameless Post-Mortem)
│   ├── KNOWN_ISSUES.md                  # ดัชนีสถานะบั๊กค้างและข้อจำกัดระบบ
│   ├── SEO_INDEXING_LOG.md              # ทะเบียนส่ง URL เข้า Google Search Console (กันส่งซ้ำ/เปลืองโควตา)
│   └── WORK_LOG.md                      # บันทึกประวัติการพัฒนาและสถานะส่งต่องาน (Live Handoff)
│
├── 🏛️ สถาปัตยกรรมและคู่มือระบบ (Architecture & System Manuals)
│   ├── ARCHITECTURE.md                  # สถาปัตยกรรมระบบ Edge, Provably Fair, Data Flow, แผนที่ Env Vars
│   ├── LOCAL_SETUP.md                   # คู่มือติดตั้งและเริ่มรัน Development Server ในเครื่อง
│   ├── CLOUDFLARE_DEPLOYMENT_GUIDE.md   # คู่มือนำระบบขึ้น Cloudflare Workers & Custom Domain
│   ├── CLOUDFLARE_OPTIMIZATION_GUIDE.md # คู่มือแม่บทลดภาระ Cloudflare และสเกลระบบสู่ระดับมหาชน (60 มหาโซลูชันระดับตำนาน)
│   ├── ADMIN_PANEL.md                   # คู่มือแผงควบคุมแอดมินและการมอนิเตอร์สถานะระบบ
│   ├── PENDING_SETUP.md                 # เช็กลิสต์ความพร้อมบริการภายนอก (เสร็จสมบูรณ์ 100%)
│   └── AUDIT_LOG.md                     # บันทึกประวัติกิจกรรมและ Audit Trail
│
├── ⚖️ บันทึกการตัดสินใจทางสถาปัตยกรรม (Architecture Decision Records)
│   └── adr/
│       ├── ADR-001-marketplace-pdpa.md # ข้อตกลงความยินยอมข้อมูลส่วนบุคคล (PDPA Consent)
│       ├── ADR-002-bot-challenge.md     # กลยุทธ์ป้องกันบอทและควบคุมต้นทุน AI
│       └── ADR-003-cutting-edge-stack-rationale.md # เหตุผลการใช้ React 19.2 + Next 16.3 + Motion 13
│
├── 📐 ข้อกำหนดเชิงฟังก์ชัน (Functional Specifications)
│   ├── TAROT_CARD_FEATURES.md           # สเปกระบบและสารบบไพ่ทาโรต์ 78 ใบ, 5 มิติ, ผัง 25 แบบ, Pick A Card 8 หัวข้อ
│   └── specs/
│       ├── DESIGN_SYSTEM_V2.md          # สเปกระบบดีไซน์ V2 — พื้นหลังและพาเลตต์สี (Warm Minimal Sanctuary)
│       ├── INTERACTIVE_CARD_PICKING.md   # ระบบแผ่ไพ่ 78 ใบและการแตะเลือกไพ่ 3D
│       ├── MARKETPLACE.md               # สถาปัตยกรรมระบบ Marketplace แม่หมอตัวจริง
│       └── ENTITLEMENT_ABUSE_MODEL.md   # แบบจำลองการป้องกันการละเมิดโควตาดูดวง
│
└── 📦 แผนพัฒนาตามหมุดหมาย (Milestone Plans Archive)
    └── plans/
<!-- PLANS_TREE_START · สร้างด้วย npm run docs:index — ห้ามแก้มือ -->
        ├── MASTER_PLAN_2026-09-06.md               # 🚧 🗺️ แผนแม่บทรวม — ทุกงานที่ค้างอยู่
        ├── HANDOFF_SMOOTH_FAST_2026-09-06.md       # 🚧 ✦ แผนทำให้เว็บ "สมูทและไว" ระดับโลก — ทุกหน้า ทุกจังหวะ (2026-09-06)
        ├── HANDOFF_OMNI_YESNO_2026-09-06.md        # 🚧 🎯 แผนส่งต่องาน 3 ชิ้น — Yes/No 78 หน้า · Omnichannel · Daily Digest
        ├── HANDOFF_BUNDLE_DIET_2026-09-07.md       # 🚧 ⚡ แผนส่งต่องาน — ลดน้ำหนัก JS รอบสุดท้ายให้เข้าเกณฑ์ระดับโลก
        ├── HANDOFF_AI_ACCURACY_THAI_2026-09-07.md  # 🚧 🧠 แผนยกระดับ "ความแม่น" ของคำอ่าน + "ภาษาไทยที่ถูกต้อง" ของแม่หมอ AI
        ├── AI_INTELLIGENCE_PLAN.md                 # 🚧 🧠 แผนแม่บทยกระดับความฉลาดของแม่หมอ AI
        ├── AI_COST_CONTROL_PLAN.md                 # 🚧 💸 แผนคุมต้นทุน AI + รหัสทดสอบข้าม rate limit — handoff ให้ทีม Gemini
        ├── HANDOFF_AI_JUDGE_BASELINE_2026-09-11.md # ⏸️ 🔑 ชีทส่งต่อ — รัน `ai:judge` เก็บ baseline `20260911-1` แล้วลุยคลื่น B ต่อ
        ├── SITE_SHELL_SEO_PLAN.md                  # ✅ 🏛️ แผนลงมือ: Site Shell กลาง + Internal Link ที่บอทมองเห็น
        ├── RETENTION_PLAN.md                       # ✅ 👤 แผนสร้าง Consumer Retention Infra — handoff ให้ทีม Gemini
        ├── QUICK_FORTUNE_PLAN.md                   # ✅ ⚡ แผนฟีเจอร์ "ทำนายด่วน" (Quick Fortune — 1 ใบ ไม่ต้องเลือกไพ่)
        ├── QUICK_CHAT_RESULT_PLAN.md               # ✅ ⚡ แผนฟีเจอร์ "หน้าผลลัพธ์ทำนายด่วน" (Quick Chat Result — แยกจากหน้าฝังใหญ่)
        ├── PROVABLY_FAIR_PLAN.md                   # ✅ 🔐 แผนปิดช่องว่าง Provably-Fair ที่เหลือ 2 จุด — handoff ให้ Gemini
        ├── HANDOFF_UX_UI_AUDIT_2026-09-11.md       # ✅ 🔍 แผนส่งต่อ — ผลตรวจ UX/UI ทั้งเว็บ (รอบ 2026-09-11)
        ├── HANDOFF_THEME_THREE_PAGES_2026-09-06.md # ✅ ✦ แผนส่งต่องาน — ตัดขั้นตอนสับ/เลือกไพ่ ให้ 3 หน้า one-card เร็วแบบ "เปิดไพ่ด่วน"
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
        ├── HANDOFF_BLOG_TBT_2026-09-12.md          # ✅ ⚡ แผนส่งต่อ — หา TBT ที่หายไปของหน้า `/blog` (ทำวันที่ 2026-09-12)
        ├── HANDOFF_ASTRO_MIGRATION_2026-09-15.md   # ✅ 🪶 แผนย้ายเว็บไปสถาปัตยกรรม Astro + React Island
        ├── HANDOFF_ADMIN_REDEEM_2026-09-12.md      # ✅ 🎟️ แผนส่งต่อ — หน้าจัดการรหัสแลกสิทธิ์ในแผงแอดมิน (Admin Redeem Code Manager)
        ├── HANDOFF_2026-09-04.md                   # ✅ 📦 แผนส่งต่องานที่ยังค้าง หลังการตรวจใหญ่ 2026-09-04 (Handoff Plan)
        ├── ENTITLEMENT_PLAN.md                     # ✅ 🎟 ระบบสมาชิกและโควตาเปิดไพ่ — แผนลงมือสำหรับทีม Antigravity
        ├── EMAIL_AUTH_PLAN.md                      # ✅ 📧 แผนเพิ่ม "เข้าสู่ระบบด้วยอีเมล + รหัสผ่าน" — handoff ให้ทีมอีกทีม
        ├── CLOUDFLARE_FREE_STACK.md                # ✅ ☁️ แผนใช้บริการฟรีของ Cloudflare ต่อยอด SeerTarot
        ├── UX_PERF_PLAN.md                         # 📚 🎯 แผนยกเครื่อง UX · ความไว · ความสมูท — 2026-09-01
        ├── TRAFFIC_CAPTURE_PLAN_2026-09-05.md      # 📚 🎯 แผนแย่งทราฟฟิกจาก MyHora และเจ้าตลาดดูดวงไทย (Traffic Capture Plan)
        ├── HANDOFF_CF_REQUEST_REVIEW_2026-09-08.md # 📚 🔍 ตรวจข้อเสนอ 12 ข้อ "ลด Request บน Cloudflare" (2026-09-08)
        ├── BACKLOG.md                              # 📚 📋 Backlog — งานที่ยังเหลือ (2026-09-04)
        ├── AUDIT_2026-09-01.md                     # 📚 🔍 รายงานตรวจสอบเต็มรูปแบบ (Full Audit) — 2026-09-01
        └── AGENTS_TASK_PLAN.md                     # 📚 🤖 แผนงานและการแบ่งหน้าที่สำหรับ AI Agents (Multi-Agent Task Orchestration)
<!-- PLANS_TREE_END -->
```

---

## 🎯 คำแนะนำการอ่านตามบทบาท (Role-Based Reading Guide)

### 🤖 สำหรับ AI Agent (Gemini / Claude / Cursor / Copilot)
> ⚠️ **ก่อนแก้ไขโค้ดใดๆ ต้องอ่าน 3 ไฟล์นี้ตามลำดับเสมอ**:
1. **[`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md)**: **(สำคัญที่สุด)** ทุกบทเรียนความผิดพลาดที่เคยเกิดขึ้นพร้อมกฎป้องกันถาวร (ทำผิดซ้ำเรื่องเดิม = ข้อบกพร่องร้ายแรง)
2. **[`docs/KNOWN_ISSUES.md`](KNOWN_ISSUES.md)**: ดูก่อนเริ่มงานใหม่เพื่อไม่แก้ซ้ำซ้อนกับ Agent ตัวอื่น
3. **[`docs/AI_COLLABORATION_GUIDELINES.md`](AI_COLLABORATION_GUIDELINES.md)**: คู่มือแม่บทระเบียบวิศวกรรม, กฎดีไซน์ 14 ข้อ, และระบบ Agent Lock

---

### 👑 สำหรับเจ้าของโปรเจกต์ (Product Owner / Creator)
* **[`docs/WORK_LOG.md`](WORK_LOG.md)**: ดูสถานะงานล่าสุดว่าฟีเจอร์ไหนเสร็จแล้ว อะไรกำลังพัฒนาอยู่
* **[`docs/PENDING_SETUP.md`](PENDING_SETUP.md)**: ตรวจสอบความพร้อมของบริการภายนอก (โดเมน, OAuth, อีเมล, Secrets)
* **[`docs/ADMIN_PANEL.md`](ADMIN_PANEL.md)**: วิธีการเข้าใช้งานแผงควบคุมแอดมินที่ `/admin` เพื่อดูสถิติและตรวจสุขภาพระบบ

---

### 🚀 สำหรับทีม DevOps และ Infrastructure
* **[`docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`](CLOUDFLARE_DEPLOYMENT_GUIDE.md)**: การตั้งค่า Cloudflare Workers, Custom Domain (`seertarot.net`), D1 Database, KV Bindings และ SSL
* **[`docs/ARCHITECTURE.md`](ARCHITECTURE.md)**: โครงสร้าง Network Edge, OpenNext Cache, และ Provably Fair Flow

---

## 🛠️ สรุปคำสั่งสำคัญสำหรับวิศวกร (Standard Command Cheat Sheet)

| คำสั่ง | หน้าที่และวัตถุประสงค์ |
| :--- | :--- |
| `npm run repo:verify` | **ตรวจครบทั้ง 81 ด่านในคำสั่งเดียว** (Typecheck, ไพ่ 78 ใบ, ผัง 25 แบบ, Provably-Fair, D1, Failover, PDPA ฯลฯ) |
| `npm run typecheck` | ตรวจสอบความถูกต้องของ TypeScript Types (ต้องผ่าน 0 Errors) |
| `npm run agent:status` | ตรวจสอบว่ามี Agent ตัวไหนกำลังทำงานหรือล็อคไฟล์อยู่หรือไม่ |
| `npm run agent:lock` | ล็อคไฟล์ก่อนเริ่มทำงานป้องกันการชนกันของ AI หลายตัว |
| `npm run agent:unlock` | ปลดล็อคไฟล์เมื่อทำงานเสร็จสมบูรณ์ |
| `npm run pr:auto` | ตรวจครบ 81 ด่าน ➔ Push ➔ เปิด PR ➔ Auto-Merge ➔ Deploy Cloudflare Workers ในคำสั่งเดียว |
| `npm run git:tidy` | เก็บกวาดกิ่งงานที่ Merge ไปแล้วทั้งในเครื่องและบน Remote ตามกฎ Zero Leftovers |
| `npm run dev` | รันเซิร์ฟเวอร์จำลองสำหรับพัฒนา (Next.js Local Server) |
