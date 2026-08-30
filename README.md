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
| 🔮 **Google DeepMind Antigravity AI** | Autonomous Multi-Agent Engineering, Collision Guard & Full-Stack Development | Google DeepMind |
| ✨ **Google Gemini AI (2.5 Flash / Pro)** | Mystic Tarot Interpretation Engine & Real-Time SSE Streamer | Google AI |

---

## 🛠️ คำสั่งสำหรับพัฒนาและตรวจสอบระบบ (Development Protocol)

```bash
# ตรวจสอบความปลอดภัยไม่ให้ชนกับ Agent ตัวอื่น
npm run agent:check

# ตรวจสอบ Typecheck ทั้งระบบ (ต้องผ่าน 0 errors เสมอ)
npm run typecheck

# ตรวจสอบความสมบูรณ์ของไพ่ 78 ใบ
./node_modules/.bin/tsx scripts/verify-cards.ts

# ตรวจสอบพิกัดและสัดส่วนของ 20 ผังพยากรณ์
./node_modules/.bin/tsx scripts/qa/test-spreads.ts

# รัน Verification Suite ทั้งระบบในคำสั่งเดียว
npm run repo:verify

# ซิงก์สถานะงานอัตโนมัติลงใน docs/WORK_LOG.md
npm run log:sync

# รัน Development Server
npm run dev
```

---

## 📜 กฎเหล็กและคู่มือการพัฒนาต่อ
โปรดอ่านคู่มือ [docs/AI_COLLABORATION_GUIDELINES.md](docs/AI_COLLABORATION_GUIDELINES.md) และ [GEMINI.md](GEMINI.md) ก่อนเริ่มแก้ไขโค้ดทุกครั้ง เพื่อรักษามาตรฐานดีไซน์ระดับ Masterpiece และป้องกันการทำงานชนกันของ AI
