# 🔮 เว็บดูดวงไพ่ทาโรต์ออนไลน์ระดับพรีเมียม (Interactive Provably-Fair Tarot Web)

> **เว็บดูดวงไพ่ทาโรต์ดั้งเดิม 1909 Rider-Waite-Smith ที่ผสานศาสตร์พยากรณ์โบราณเข้ากับเทคโนโลยีปัญญาประดิษฐ์ (AI) และระบบสุ่มที่พิสูจน์ความยุติธรรมได้ (Provably Fair) บน Cloudflare Edge Network**

[![Live Production](https://img.shields.io/badge/Production-Live-success?style=for-the-badge&logo=cloudflare&logoColor=white&color=F38020)](https://tarot-web.bankjack10452.workers.dev)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%200%20Errors-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Gemini%20%26%20Antigravity-purple?style=for-the-badge&logo=google)](https://deepmind.google/)

---

## 🌐 ลิงก์เข้าใช้งานจริง (Production URL)

> 🔗 **[https://tarot-web.bankjack10452.workers.dev](https://tarot-web.bankjack10452.workers.dev)**

---

## 🌟 จุดเด่นของระบบ (Core Features)

1. 🃏 **ภาพไพ่ดั้งเดิม 1909 Rider-Waite-Smith ครบ 78 ใบ**:
   - ภาพความละเอียดสูง พร้อมฐานข้อมูลความหมาย 780 ข้อความ 5 มิติ (ทั่วไป, ความรัก, การงาน, การเงิน, ไหวพริบ/คำแนะนำ)
2. 📐 **20 ผังการเปิดไพ่พยากรณ์ยอดนิยม**:
   - จัดวางด้วยสัดส่วนทองคำ (Golden Ratio) ไร้การตัดขอบ (Zero-Clipping Canvas Architecture)
3. 🎲 **ระบบสุ่มไพ่ที่ตรวจสอบความโปร่งใสได้ 100% (Provably Fair)**:
   - สับไพ่ด้วย Deterministic Fisher-Yates ควบคู่กับ SHA-256 Commit-Reveal Cryptographic Verification
4. 🤖 **แม่หมอ AI สตรีมคำทำนายสดแบบเรียลไทม์ (SSE Streaming)**:
   - วิเคราะห์ความเชื่อมโยงของไพ่ พร้อมระบบอ่านออกเสียงคำทำนายภาษาไทย (TTS Voice Engine)
5. 🛡️ **ระบบความปลอดภัยและการป้องกันข้อมูลส่วนบุคคล (PDPA & Safety)**:
   - กรองคำถามอันตราย มีสายด่วนสุขภาพจิต **1323** และจัดเก็บข้อมูลในเครื่องผู้ใช้เท่านั้น

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
# ✅ รัน Verification Suite ทั้ง 6 ด่านในคำสั่งเดียว (ใช้ตัวนี้เป็นหลัก)
#    Collision Guard · Typecheck · ไพ่ 78 ใบ · ผัง 20 แบบ · Safety Guardrails · Provably-Fair Shuffle
npm run repo:verify

# ตรวจสอบ Typecheck อย่างเดียว
npm run typecheck

# สร้างภาพไพ่ย่อ WebP หลายขนาด (รันเมื่อเพิ่ม/เปลี่ยนภาพใน public/cards/)
npm run cards:variants

# ตรวจ + push + สร้าง PR + เปิด Auto-Merge (ใส่ --dry-run เพื่อดูก่อนโดยไม่แตะ remote)
npm run pr:auto -- "<title>" "<body>"

# ซิงก์สถานะงานอัตโนมัติลงใน docs/WORK_LOG.md
npm run log:sync

# รัน Development Server
npm run dev
```

---

## 📜 กฎเหล็กและคู่มือการพัฒนาต่อ

| เอกสาร | อ่านเพื่ออะไร |
| :--- | :--- |
| **[docs/INCIDENT_LOG.md](docs/INCIDENT_LOG.md)** | 📋 ความผิดพลาดทุกครั้งที่เคยเกิดขึ้น พร้อม **กฎป้องกันถาวร** — อ่านก่อนเสมอ |
| **[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)** | 🐛 บั๊กที่ยืนยันแล้วแต่ยังไม่ได้แก้ กันแก้ซ้ำซ้อนกัน |
| **[docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md)** | 🎖️ คู่มือแม่บท — หัวข้อ 0 คือมาตรฐานการทำงานที่บังคับใช้เสมอ |
| [docs/WORK_LOG.md](docs/WORK_LOG.md) | 📖 ประวัติการพัฒนาและสถานะงานล่าสุด |
| [GEMINI.md](GEMINI.md) | 🔮 สรุปกฎเหล็กฉบับย่อสำหรับ AI Agent |

### 🎖️ มาตรฐานการทำงาน (บังคับกับ AI ทุกตัว)

1. **วัดก่อนเดา** — สรุปสาเหตุจากหลักฐานจริงเท่านั้น ไม่ใช่จากการอ่านโค้ด
2. **หาสาเหตุราก ไม่ใช่ดับอาการ** — ต้องตอบให้ได้ว่า "ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก"
3. **แก้อาการแรกแล้วต้องรันซ้ำ** — error หนึ่งมักบัง error อีกตัวไว้
4. **พิสูจน์ว่าแก้ได้จริง** — ทดสอบทั้งเส้นทางที่สำเร็จและที่ล้มเหลว
5. **รายงานตามจริง** แม้ผลจะไม่สวย
6. **แก้บั๊กแล้วต้องบันทึกบทเรียนเสมอ** — ระบบบล็อก commit ที่ไม่ระบุ `--cause` และ `--prevention`
7. **อย่าขยายขอบเขตเอง** — เจอบั๊กอื่นให้บันทึกลง `KNOWN_ISSUES.md`

```bash
# commit ประเภทแก้บั๊ก ต้องบันทึกบทเรียนเสมอ (ระบบเขียนลง INCIDENT_LOG.md ให้เอง)
npm run commit -- --agent <ชื่อ> --type fix --scope <หมวด> \
  --msg "<แก้อะไร>" --cause "<ทำไมถึงเกิด>" --prevention "<กฎกันเกิดซ้ำ>" \
  --severity high --verify "<พิสูจน์ยังไง>"

# บันทึกความผิดพลาดด้วยมือ (ยังไม่ commit)
npm run incident -- --title "..." --severity high --symptom "..." \
  --cause "..." --fix "..." --prevention "..."
```
