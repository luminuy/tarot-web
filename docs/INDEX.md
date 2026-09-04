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
│   └── WORK_LOG.md                      # บันทึกประวัติการพัฒนาและสถานะส่งต่องาน (Live Handoff)
│
├── 🏛️ สถาปัตยกรรมและคู่มือระบบ (Architecture & System Manuals)
│   ├── ARCHITECTURE.md                  # สถาปัตยกรรมระบบ Edge, Provably Fair, Data Flow, แผนที่ Env Vars
│   ├── LOCAL_SETUP.md                   # คู่มือติดตั้งและเริ่มรัน Development Server ในเครื่อง
│   ├── CLOUDFLARE_DEPLOYMENT_GUIDE.md   # คู่มือนำระบบขึ้น Cloudflare Workers & Custom Domain
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
│   └── specs/
│       ├── DESIGN_SYSTEM_V2.md          # สเปกระบบดีไซน์ V2 — พื้นหลังและพาเลตต์สี (Warm Minimal Sanctuary)
│       ├── INTERACTIVE_CARD_PICKING.md   # ระบบแผ่ไพ่ 78 ใบและการแตะเลือกไพ่ 3D
│       ├── MARKETPLACE.md               # สถาปัตยกรรมระบบ Marketplace แม่หมอตัวจริง
│       └── ENTITLEMENT_ABUSE_MODEL.md   # แบบจำลองการป้องกันการละเมิดโควตาดูดวง
│
└── 📦 แผนพัฒนาตามหมุดหมาย (Milestone Plans Archive)
    └── plans/
        ├── AI_COST_CONTROL_PLAN.md      # แผนควบคุมต้นทุน AI และ Rate Limit Bypass (PR 1-5)
        ├── EMAIL_AUTH_PLAN.md           # แผนระบบสมัครสมาชิกด้วยอีเมลและรหัสผ่าน (PR 0-5)
        ├── PROVABLY_FAIR_PLAN.md        # แผนระบบสับไพ่ที่ตรวจสอบความยุติธรรมได้ (PR 1-4)
        ├── RETENTION_PLAN.md            # แผนระบบบันทึกดวงและฐานข้อมูลผู้ใช้ D1 (PR 0-4)
        ├── UX_PERF_PLAN.md              # แผนเพิ่มความเร็ว 60fps และลดขนาดภาพไพ่ (PR 1-4)
        ├── ENTITLEMENT_PLAN.md          # แผนระบบสิทธิ์ดูดวงฟรี 1 ครั้ง และสมาชิกวันละ 3 ครั้ง
        ├── AGENTS_TASK_PLAN.md          # แผนกระจายงาน 5 AI Agents เฉพาะทาง
        ├── CLOUDFLARE_FREE_STACK.md     # แผนใช้บริการฟรี CF ต่อยอด (AI Gateway/Turnstile/KV/R2/Vectorize/DO) 4 Wave
        ├── AUDIT_2026-09-01.md          # รายงานการตรวจสุขภาพระบบประจำวันที่ 1 ก.ย. 2569
        ├── HANDOFF_2026-09-04.md        # 📦 แผนส่งต่องานค้างหลังตรวจใหญ่ (ISSUE-017 ถึง 023) — อ่านก่อนหยิบงานใหม่
        └── BACKLOG.md                   # คลังรายการงานที่ทำเสร็จแล้วย้อนหลัง
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
| `npm run repo:verify` | **ตรวจครบทั้ง 24 ด่านในคำสั่งเดียว** (Typecheck, ไพ่ 78 ใบ, ผัง 20 แบบ, Provably-Fair, D1, Failover, PDPA ฯลฯ) |
| `npm run typecheck` | ตรวจสอบความถูกต้องของ TypeScript Types (ต้องผ่าน 0 Errors) |
| `npm run agent:status` | ตรวจสอบว่ามี Agent ตัวไหนกำลังทำงานหรือล็อคไฟล์อยู่หรือไม่ |
| `npm run agent:lock` | ล็อคไฟล์ก่อนเริ่มทำงานป้องกันการชนกันของ AI หลายตัว |
| `npm run agent:unlock` | ปลดล็อคไฟล์เมื่อทำงานเสร็จสมบูรณ์ |
| `npm run pr:auto` | ตรวจครบ 24 ด่าน ➔ Push ➔ เปิด PR ➔ Auto-Merge ➔ Deploy Cloudflare Workers ในคำสั่งเดียว |
| `npm run git:tidy` | เก็บกวาดกิ่งงานที่ Merge ไปแล้วทั้งในเครื่องและบน Remote ตามกฎ Zero Leftovers |
| `npm run dev` | รันเซิร์ฟเวอร์จำลองสำหรับพัฒนา (Next.js Local Server) |
