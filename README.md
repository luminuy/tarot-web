# 🔮 เว็บดูดวงไพ่ทาโรต์ออนไลน์ระดับพรีเมียม (Interactive Provably-Fair Tarot Web)

> **เว็บดูดวงไพ่ทาโรต์ดั้งเดิม 1909 Rider-Waite-Smith ที่ผสานศาสตร์พยากรณ์โบราณเข้ากับเทคโนโลยีปัญญาประดิษฐ์ (AI) และระบบสุ่มที่พิสูจน์ความยุติธรรมได้ (Provably Fair) บน Cloudflare Edge Network**

[![Live Production](https://img.shields.io/badge/Production-Live-success?style=for-the-badge&logo=cloudflare&logoColor=white&color=F38020)](https://tarot-web.bankjack10452.workers.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%200%20Errors-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%20%26%20Antigravity-purple?style=for-the-badge&logo=google)](https://deepmind.google/)
[![Edge Computing](https://img.shields.io/badge/Edge%20Network-Cloudflare%20Workers-orange?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)

---

## 🌐 ลิงก์เข้าใช้งานจริง (Production Live URL)

> 🔗 **[https://tarot-web.bankjack10452.workers.dev](https://tarot-web.bankjack10452.workers.dev)**

---

## 🌟 จุดเด่นของระบบ (Core Architecture & Features)

1. 🃏 **ภาพไพ่ดั้งเดิม 1909 Rider-Waite-Smith ครบ 78 ใบ (Masterpiece Remaster)**:
   - ผ่านกระบวนการ Digital Remastering คมชัดระดับ Ultra-HD พร้อมระบบ **4-Tier Asset Pipeline** (`w128`, `w256`, `w512`, `w1024` ในรูปแบบ WebP/AVIF)
   - ฐานข้อมูลความหมายลึกซึ้ง 780 ข้อความ 5 มิติ (ทั่วไป, ความรัก, การงาน, การเงิน, ไหวพริบ/คำแนะนำ)
2. 📐 **20 ผังการเปิดไพ่พยากรณ์ยอดนิยม (Golden Ratio Layout)**:
   - สถาปัตยกรรม **Zero-Clipping Unified Altar Canvas** ไร้การตัดขอบ จัดวางด้วยสัดส่วนทองคำสมดุล 100%
3. 🎲 **ระบบสุ่มไพ่ที่ตรวจสอบความโปร่งใสได้ 100% (Provably Fair Cryptography)**:
   - สับไพ่ด้วย Deterministic Fisher-Yates ควบคู่กับ **SHA-256 Commit-Reveal Cryptographic Verification** ป้องกันการสับเปลี่ยนไพ่
4. 🤖 **แม่หมอ AI 5 บุคลิก พร้อมสตรีมมิ่งคำทำนายสด (SSE Real-Time Streaming)**:
   - แม่หมอใจดี, แม่หมอเพื่อนซี้ (คุยสนุก/เม้าท์มันส์), แม่หมอพูดตรง, อาจารย์สายฟันธง (กลยุทธ์ 1-2-3), และแม่หมอสายพลัง
   - ระบบสนทนาถามต่อยอด (Contextual Follow-up Chat Engine)
5. 🛡️ **ระบบความปลอดภัยและการป้องกันข้อมูลส่วนบุคคล (PDPA & Safety Boundaries)**:
   - กรองสัญญาณความทุกข์ใจ/อันตราย พร้อมสายด่วนสุขภาพจิต **1323** และเก็บข้อมูลใน Local Storage ของผู้ใช้ 100%

---

## 👥 ทีมผู้พัฒนาและผู้มีส่วนร่วม (Core Creators & AI Contributors)

| ผู้พัฒนา / AI Contributor | บทบาทและความรับผิดชอบ | องค์กร / โมเดล |
| :--- | :--- | :--- |
| 👑 **Luminut ([@luminuy](https://github.com/luminuy))** | Lead Architect, Creator & Project Owner | Project Maintainer |
| 🏛️ **Anthropic Claude (3.5 / 3.7 Sonnet)** | Foundational Architecture, Core System Design & 1909 Tarot Engine Foundation | Anthropic |
| 🔮 **Google DeepMind Antigravity AI** | Autonomous Multi-Agent Engineering, Collision Guard & Full-Stack Development | Google DeepMind |
| ✨ **Google Gemini AI (2.5 Flash / Pro)** | Mystic Tarot Interpretation Engine & Real-Time SSE Streamer | Google AI |

---

## 🛠️ คำสั่งสำหรับพัฒนาและตรวจสอบระบบ (Development Protocol)

```bash
# ✅ รัน Verification Suite ทั้ง 7 ด่านในคำสั่งเดียว (ใช้ตัวนี้เป็นหลัก)
#    Collision Guard · Typecheck · ไพ่ 78 ใบ · ผัง 20 แบบ · Safety Guardrails · Provably-Fair Shuffle · Card Image Path Guard
npm run repo:verify

# ตรวจสอบ Typecheck อย่างเดียว (0 errors)
npm run typecheck

# สร้างภาพไพ่ย่อ WebP/AVIF หลายขนาด (รันเมื่อเพิ่ม/เปลี่ยนภาพใน public/cards/)
npm run cards:variants

# ตรวจ + push + สร้าง PR + Auto-Merge อัตโนมัติ (ใส่ --dry-run เพื่อดูก่อนโดยไม่แตะ remote)
npm run pr:auto -- "<title>" "<body>" --wait

# เก็บกวาด branch ที่ PR merge ไปแล้ว ทั้งในเครื่องและบน remote
npm run git:tidy

# ซิงก์สถานะงานอัตโนมัติลงใน docs/WORK_LOG.md
npm run log:sync

# รัน Development Server
npm run dev
```

---

## 📜 ดัชนีเอกสารวิศวกรรมแม่บท (Engineering Documentation Index)

| เอกสาร | วัตถุประสงค์หลัก |
| :--- | :--- |
| **[`docs/INCIDENT_LOG.md`](docs/INCIDENT_LOG.md)** | 📋 บทเรียนความผิดพลาดทุกครั้ง พร้อม **กฎป้องกันถาวร** (INC-0001 ถึง INC-0019) — อ่านก่อนเสมอ |
| **[`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md)** | 🐛 บั๊กที่ยืนยันแล้วและดัชนีสถานะงานค้าง ป้องกันการแก้ซ้ำซ้อน |
| **[`docs/AI_COLLABORATION_GUIDELINES.md`](docs/AI_COLLABORATION_GUIDELINES.md)** | 🎖️ คู่มือแม่บท — มาตรฐานวิศวกรรมระดับโลก, Domain Mapping, และ 10 Golden Design Rules |
| **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | 🏛️ สถาปัตยกรรมระบบ, Edge Caching, SSE Streaming Protocol และ Provably Fair Engine |
| **[`docs/WORK_LOG.md`](docs/WORK_LOG.md)** | 📖 ประวัติการพัฒนาและ Audit Trail ส่งต่องานแบบเรียลไทม์ |
| **[`GEMINI.md`](GEMINI.md) / [`CLAUDE.md`](CLAUDE.md)** | 🔮 สรุปกฎเหล็กการทำงานและ Workflow อัตโนมัติสำหรับ AI Agents |

---

### 🎖️ มาตรฐานการทำงานระดับ Senior Staff Engineer

1. **วัดก่อนเดา (Evidence over Assumption)** — สรุปสาเหตุจากหลักฐานจริงเท่านั้น ไม่ใช่จากการอ่านโค้ด
2. **หาสาเหตุราก ไม่ใช่ดับอาการ (Root Cause, not Symptom)** — ต้องตอบให้ได้ว่า "ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก"
3. **แก้อาการแรกแล้วต้องรันซ้ำ (One Bug May Mask Another)** — error หนึ่งมักบัง error อีกตัวไว้
4. **พิสูจน์ว่าแก้ได้จริง (Verify, don't assume)** — ทดสอบทั้งเส้นทางที่สำเร็จและที่ล้มเหลว (7/7 verification gates)
5. **รายงานตามจริง (Report Honestly)** แม้ผลจะไม่สวย
6. **แก้เรื่องเดียวต่อหนึ่ง commit และบันทึกบทเรียนเสมอ** — ระบบบล็อก commit ที่ไม่ระบุ `--cause` และ `--prevention`
7. **ทำงานให้สะอาดและจบสมบูรณ์ 100% (Zero Leftovers)** — ตรวจ 7 ด่าน ➔ Commit ➔ Push ➔ Auto-Merge ➔ Tidy ห้ามทิ้งภาระให้ผู้อื่นตามแก้

```bash
# commit ประเภทแก้บั๊ก ต้องบันทึกบทเรียนเสมอ (ระบบเขียนลง INCIDENT_LOG.md ให้เอง)
npm run commit -- --agent <ชื่อ> --type fix --scope <หมวด> \
  --msg "<แก้อะไร>" --cause "<ทำไมถึงเกิด>" --prevention "<กฎกันเกิดซ้ำ>" \
  --severity high --verify "<พิสูจน์ยังไง>"
```
