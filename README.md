# 🔮 SeerTarot (วิหารพยากรณ์ไพ่ทาโรต์ออนไลน์ระดับพรีเมียม)
### World-Class Interactive Provably-Fair Tarot Web Architecture

> **เว็บดูดวงไพ่ทาโรต์ดั้งเดิม 1909 Rider-Waite-Smith ที่ผสานศาสตร์พยากรณ์โบราณเข้ากับเทคโนโลยีปัญญาประดิษฐ์ (AI) และระบบสุ่มที่พิสูจน์ความยุติธรรมได้ (Provably Fair) บน Cloudflare Edge Network ระดับโลก**

[![Production Live](https://img.shields.io/badge/Production-Live-success?style=for-the-badge&logo=cloudflare&logoColor=white&color=F38020)](https://seertarot.net)
[![Astro](https://img.shields.io/badge/Astro-7.3-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%200%20Errors-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![AI Engine](https://img.shields.io/badge/AI-Groq%20Qwen%20%2B%20Gemini%20%2B%20Claude-purple?style=for-the-badge)](https://groq.com/)
[![CI Quality Gates](https://img.shields.io/badge/CI%20Quality%20Gates-62%2F62%20Passed-brightgreen?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/luminuy/tarot-web/actions)
[![Edge Network](https://img.shields.io/badge/Edge%20Network-Cloudflare%20Workers-orange?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![License](https://img.shields.io/badge/License-PolyForm%20Noncommercial%201.0.0-lightgrey?style=for-the-badge)](LICENSE)

---

## 📑 สารบัญ (Table of Contents)

- [🌐 ลิงก์เข้าใช้งานจริง (Production Live URL)](#-ลิงก์เข้าใช้งานจริง-production-live-url)
- [🌟 จุดเด่นและสถาปัตยกรรมหลัก (Core Architecture & Features)](#-จุดเด่นและสถาปัตยกรรมหลัก-core-architecture--features)
- [💻 โครงสร้างเทคโนโลยี (Technology Stack)](#-โครงสร้างเทคโนโลยี-technology-stack)
- [👥 ทีมผู้พัฒนาและผู้มีส่วนร่วม (Core Creators & AI Contributors)](#-ทีมผู้พัฒนาและผู้มีส่วนร่วม-core-creators--ai-contributors)
- [🛠️ คำสั่งสำหรับพัฒนาและตรวจสอบระบบ (Development Protocol)](#️-คำสั่งสำหรับพัฒนาและตรวจสอบระบบ-development-protocol)
- [📜 ดัชนีเอกสารวิศวกรรมแม่บท (Engineering Documentation Index)](#-ดัชนีเอกสารวิศวกรรมแม่บท-engineering-documentation-index)
- [🎖️ มาตรฐานวิศวกรรมระดับโลก (Senior Staff Engineering Discipline)](#️-มาตรฐานวิศวกรรมระดับโลก-senior-staff-engineering-discipline)
- [🛡️ สัญญาอนุญาตและทรัพย์สินทางปัญญา (License & Intellectual Property)](#️-สัญญาอนุญาตและทรัพย์สินทางปัญญา-license--intellectual-property)

---

## 🌐 ลิงก์เข้าใช้งานจริง (Production Live URL)

> 🔗 **[https://seertarot.net](https://seertarot.net)** (หรือ `https://www.seertarot.net`)
> 
> *เสิร์ฟผ่านเครือข่าย Cloudflare Global Edge (<50ms ในไทย) พร้อมระบบความปลอดภัยระดับองค์กรและการป้องกัน DDoS อัตโนมัติ*

---

## 🌟 จุดเด่นและสถาปัตยกรรมหลัก (Core Architecture & Features)

### 1. 🃏 ภาพไพ่ดั้งเดิม 1909 Rider-Waite-Smith ครบ 78 ใบ (Masterpiece Remaster)
- ผ่านกระบวนการ Digital Remastering คมชัดระดับ Ultra-HD สีสันและรายละเอียดลายเส้นสมบูรณ์ 100%
- สถาปัตยกรรม **4-Tier Asset Pipeline** (`w128`, `w256`, `w512`, `w1024` ในรูปแบบ WebP/AVIF) ลดขนาดภาพลง 85% โดยคงความคมชัดสูงสุดบนจอ Retina
- คลังความหมายศาสตร์พยากรณ์ลึกซึ้ง 780 ข้อความ ครอบคลุม 5 มิติ (ทั่วไป, ความรัก, การงาน, การเงิน, ไหวพริบ/คำแนะนำ) พร้อมการถอดรหัสโหราศาสตร์และเลขศาสตร์ประจำใบ

### 2. 📐 25 ผังการเปิดไพ่พยากรณ์ยอดนิยม (Golden Ratio Altar Canvas)
- สถาปัตยกรรม **Zero-Clipping Unified Altar Canvas** ไร้การตัดขอบ จัดวางตำแหน่งการ์ดลอย 3D ด้วยสัดส่วนทองคำสมดุล 100%
- รองรับผังพยากรณ์ 25 แบบ (124 ตำแหน่งพยากรณ์) ตั้งแต่ผัง 1 ใบด่วน (Daily Card, Yes/No), ผัง 3 ใบ (อดีต-ปัจจุบัน-อนาคต, จิตใจ-ร่างกาย-วิญญาณ) ไปจนถึงผังมหาศักดิ์สิทธิ์ Celtic Cross 10 ใบ และ Tree of Life
- ผังที่มีไพ่ 7 ใบขึ้นไป (ผัง 7 วัน และ 7 จักระ) จัดวางแบบ 2 ชั้นสมดุล (4+3 ใบ) คุมความกว้างไม่เกิน 150px ป้องกันการล้นขอบจอทุกขนาด

### 3. 🎲 ระบบสุ่มไพ่ที่ตรวจสอบความโปร่งใสได้ 100% (Provably Fair Cryptography)
- สับไพ่ด้วย Deterministic Fisher-Yates ควบคู่กับ **SHA-256 Commit-Reveal Cryptographic Verification**
- เซิร์ฟเวอร์สร้างและส่ง Hash Commitment ให้เบราว์เซอร์ก่อนเริ่มแตะไพ่ และเฉลย Server Seed ให้ผู้ใช้ตรวจคำนวณย้อนหลังผ่าน Client Web Crypto API ได้ 100%
- **Zero Fabricated Cards Policy**: ข้อมูลไพ่ทุกใบมาจากระบบสุ่มจริง ห้ามโค้ด fallback มโนหรือกุไพ่ใบใดขึ้นมาเองเด็ดขาด หากข้อมูลไม่สมบูรณ์ระบบจะแจ้งให้โหลดใหม่ทันทีเพื่อรักษาความโปร่งใสสูงสุด

### 4. 🤖 แม่หมอ AI สองประสาน (Dual-Engine AI) 5 บุคลิก พร้อมสตรีมมิ่งสด (SSE)
- **เครื่องยนต์สองประสาน (Multi-Provider Failover)**: Groq Cloud LPU (Qwen 2.5 72B/32B Tier 1, ความเร็ว ~400ms) สลับอัตโนมัติสู่ Google Gemini (3.7 / 2.5 Flash Tier 2) ผ่าน Cloudflare AI Gateway
- แม่หมอ 5 บุคลิกสมจริง: **แม่หมอใจดี** (อบอุ่น), **แม่หมอเพื่อนซี้** (คุยสนุก/เม้าท์มันส์), **แม่หมอพูดตรง** (กระชับเด็ดขาด), **อาจารย์สายฟันธง** (กลยุทธ์ 1-2-3), และ**แม่หมอสายพลัง** (จักรวาล/จิตวิญญาณ)
- สตรีมคำทำนายสดแบบ Server-Sent Events (SSE) ไหลลื่นไม่มีสะดุด พร้อมระบบสนทนาถามต่อยอด (Contextual Follow-up Chat Engine)

### 5. 🪶 สถาปัตยกรรมไฮบริด Astro 7 + React 19 Islands + Next.js 16.3
- **Zero-Runtime Edge Delivery**: หน้าเนื้อหาสาธารณะ 305 หน้า (`/cards/**`, `/spreads/**`, `/blog/**`, `/about`, `/privacy`, `/contact` ฯลฯ) คอมไพล์ด้วย Astro SSG เป็น Zero-Runtime HTML ใน `.open-next/assets` ตอบตรงจาก Cloudflare Edge Assets โดยไม่ปลุก Worker ประหยัดต้นทุนและลดน้ำหนัก JS ลง 36–53%
- **Dynamic App & APIs**: หน้าที่ต้องการสถานะเซสชัน/ระบบสมาชิก/แผงควบคุมหลังบ้าน (`/account`, `/admin`, `/readers`, `/api/*`) ทำงานบน Next.js 16.3 App Router (OpenNext on Cloudflare Workers)
- **Universal Component Compatibility**: มีชั้นแปลงปลั๊ก Shims (`next/link`, `next/navigation`) ทำให้คอมโพเนนต์ React ทั้ง 90 ตัวทำงานร่วมกันได้ทั้งบน Astro และ Next.js โดยไม่ต้องแก้โค้ดซ้ำซ้อน

### 6. ⚡ Mobile Performance & Ultra-Fast Edge Caching
- **แคชฟอนต์ 1 ปีเต็ม**: ไฟล์ฟอนต์ไทยทั้งหมด (`Noto Serif Thai`, `Sarabun`) ใน `public/_headers` ได้รับ `Cache-Control: public, max-age=31536000` ลดการโหลดซ้ำบนมือถือ
- **ตัดวงจร Critical Request Chaining**: แยกสแตติกโครมออกจากไคลเอนต์โครม และเลื่อนการเรียก API ไพ่ประจำวันด้วย `requestIdleCallback`
- **ขจัด Forced Reflow 100%**: กำจัด Layout Thrashing ในคอมโพเนนต์เลือกไพ่ด่วน ทำให้คะแนน Lighthouse Mobile และ Total Blocking Time (TBT) ดีเยี่ยม (14–42 ms)

### 7. 🛡️ ความปลอดภัยและการป้องกันข้อมูลส่วนบุคคล (PDPA, Security & Safety Boundaries)
- **Safety Guardrails**: ตรวจจับสัญญาณความทุกข์ใจ/อันตราย/การทำร้ายตัวเองทันที พร้อมระงับการทำนายและแสดงสายด่วนสุขภาพจิต **1323** ชัดเจน
- **PDPA & Privacy by Design**: ข้อมูลการเปิดไพ่เก็บใน Local Storage ของผู้ใช้เป็นหลัก และรองรับการดาวน์โหลดสำเนา JSON หรือสั่งลบข้อมูลถาวรได้ทันที
- **Enterprise Bot & Abuse Defense**: ผสาน Cloudflare Turnstile, Native WAF Rate Limiting, Origin Anti-Theft Guard, และ PBKDF2-HMAC-SHA256 Password Hashing

---

## 💻 โครงสร้างเทคโนโลยี (Technology Stack)

| เลเยอร์สถาปัตยกรรม (Layer) | เทคโนโลยีหลัก (Technologies) | หน้าที่และจุดเด่น (Purpose & Highlights) |
| :--- | :--- | :--- |
| **Static SSG & Edge Assets** | **Astro 7.3 + React 19.2 Islands** | เรนเดอร์ 305 หน้าสาธารณะเป็น Zero-Runtime HTML บน Cloudflare Assets ลดน้ำหนัก JS 36–53% |
| **Dynamic App & APIs** | **Next.js 16.3 (App Router)** | รองรับเส้นทาง Dynamic (`/account`, `/admin`, `/readers`, `/api/*`) และ SSE Streaming |
| **Edge Compute & Serverless** | **Cloudflare Workers (OpenNext v1.20)** | V8 Isolate Serverless ตอบสนอง <50ms ทั่วโลก ไร้ Cold-Start |
| **Database & Cache** | **Cloudflare D1 (`APP_DB`) + KV (`NEXT_INC_CACHE_KV`)** | Relational Database (ผู้ใช้, บันทึกดวง, สิทธิ์) + Key-Value Edge Cache |
| **Media Storage & Search** | **Cloudflare R2 (`SHARE_BUCKET`) + Vectorize** | จัดเก็บภาพการ์ดแชร์ 90 วัน + เอนจินค้นหาความหมายไพ่เชิงความหมาย 1024 มิติ |
| **AI LLM Dual-Engine** | **Groq LPU (Qwen 2.5) + Google Gemini (3.7/2.5)** | สตรีมคำทำนายสองประสานความเร็วสูง พร้อม Failover อัตโนมัติผ่าน Cloudflare AI Gateway |
| **Styling & Motion** | **Tailwind CSS v4 + Motion 13** | Obsidian & Gold Luxury Editorial Design System พร้อม Hardware GPU Acceleration |
| **Quality & Type Safety** | **TypeScript 7 (Strict) + Zod v4** | ความปลอดภัย Type-Safe 100% 0 Errors พร้อม Schema Validation ครบวงจร |

---

## 👥 ทีมผู้พัฒนาและผู้มีส่วนร่วม (Core Creators & AI Contributors)

| ผู้พัฒนา / AI Contributor | บทบาทและความรับผิดชอบ | องค์กร / โมเดล |
| :--- | :--- | :--- |
| 👑 **SEERTAROT ([@luminuy](https://github.com/luminuy))** | **Creator, Oracle Diviner & Project Owner (ผู้สร้าง, ผู้พยากรณ์ และเจ้าของโครงการ)** — ผู้เชี่ยวชาญศาสตร์พยากรณ์และทาโรต์, รีวิวและตัดสินใจสถาปัตยกรรมขั้นสุดท้าย, กำหนดทิศทางผลิตภัณฑ์และดีไซน์, เป็นเจ้าของโครงสร้างพื้นฐาน (Cloudflare / GitHub / โดเมน / Secrets), ทดสอบบนอุปกรณ์จริง (Chrome/Safari, มือถือ) และกำกับงาน AI ทุกตัว | Project Maintainer & Oracle |
| 🏛️ **Anthropic Claude (Sonnet 5 / Opus 5)** | **Lead Engineering & System Review** — ตรวจสอบและวางสถาปัตยกรรม, หาสาเหตุรากของบั๊ก (root-cause debugging), วางระเบียบวิศวกรรม (Incident Log, ด่านตรวจอัตโนมัติ, กติกา PR), ระบบ Edge Caching (OpenNext + KV), Provably-Fair Shuffle และ Code Review ทุก PR ก่อน merge | Anthropic |
| 🔮 **Google DeepMind Antigravity AI** | **Full-Stack Implementation & Optimization** — พัฒนาระบบ Full-Stack, สถาปัตยกรรม Astro Hybrid, งาน UI/Motion, ปรับแต่งประสิทธิภาพ Lighthouse Mobile, SEO และ Multi-Agent Collision Guard | Google DeepMind |
| ⚡ **Groq Cloud LPU (Qwen 2.5 72B/32B)** | **Primary Ultra-Fast Reading Engine (Tier 1)** — เครื่องยนต์คำอ่านปฐมภูมิความเร็วสูงพิเศษ (~400ms) พร้อมเกราะป้องกันภาษาและระบบสลับอัตโนมัติ | Groq & Alibaba Cloud |
| ✨ **Google Gemini AI (3.7 / 2.5 Flash)** | **Failover & Secondary Interpretation Engine (Tier 2)** — เครื่องอ่านคำทำนายไพ่ทาโรต์สำรองความแม่นยำสูงและสตรีมคำอ่านแบบเรียลไทม์ (SSE) | Google AI |

---

## 🛠️ คำสั่งสำหรับพัฒนาและตรวจสอบระบบ (Development Protocol)

```bash
# ✅ รัน Verification Suite ทั้ง 69 ด่านในคำสั่งเดียว (ใช้ตัวนี้เป็นหลัก)
#    Collision Guard · Typecheck · ไพ่ 78 ใบ · ผัง 25 แบบ · Safety Guardrails · Provably Fair · D1 Sync · Entitlement · Failover ฯลฯ
npm run repo:verify

# ตรวจสอบ TypeScript Typecheck อย่างเดียว (0 errors)
npm run typecheck

# บิลด์หน้าสแตติก Astro 305 หน้า (cards, spreads, blog, about, privacy, contact)
npm run build:astro

# บิลด์ระบบทั้งหมดรวมกัน (Astro + OpenNext Worker) พร้อมรวม Assets เตรียม Deploy
npm run build:worker

# พรีวิวสภาพแวดล้อม Worker จำลอง (.open-next)
npm run preview:worker

# สร้างภาพไพ่ย่อ WebP/AVIF หลายขนาด (รันเมื่อเพิ่ม/เปลี่ยนภาพใน public/cards/)
npm run cards:variants

# ตรวจ + push + สร้าง PR + Auto-Merge อัตโนมัติ (ใส่ --dry-run เพื่อดูก่อนโดยไม่แตะ remote)
npm run pr:auto -- "<title>" "<body>" --wait

# เก็บกวาด branch ที่ PR merge ไปแล้ว ทั้งในเครื่องและบน remote
npm run git:tidy

# ซิงก์สถานะงานอัตโนมัติลงใน docs/WORK_LOG.md
npm run log:sync

# รัน Development Server สำหรับพัฒนาในเครื่อง
npm run dev
```

---

## 📜 ดัชนีเอกสารวิศวกรรมแม่บท (Engineering Documentation Index)

| หมวดหมู่ (Category) | เอกสาร (Document) | วัตถุประสงค์หลัก (Core Purpose) |
| :--- | :--- | :--- |
| **🧭 การนำทาง & เริ่มต้น** | **[`docs/INDEX.md`](docs/INDEX.md)** | 🌟 **สารบรรณและแผนที่นำทางเอกสารทั้งหมด (Documentation Sitemap)** — แผนผังภาพรวมและคำแนะนำการอ่านตามบทบาท |
| | **[`docs/LOCAL_SETUP.md`](docs/LOCAL_SETUP.md)** | 💻 **คู่มือการติดตั้งและรันในเครื่อง (Local Setup)** — Node/npm, พอร์ต, .env.local และข้อควรระวังบน macOS |
| **🛡️ ระเบียบวิศวกรรม & ความปลอดภัย** | **[`docs/INCIDENT_LOG.md`](docs/INCIDENT_LOG.md)** | 📋 บทเรียนความผิดพลาดทุกครั้ง พร้อม **กฎป้องกันถาวร** (INC-0001 เป็นต้นไป) — อ่านก่อนเสมอ |
| | **[`docs/KNOWN_ISSUES.md`](docs/KNOWN_ISSUES.md)** | 🐛 บั๊กที่ยืนยันแล้วและดัชนีสถานะงานค้าง ป้องกันการแก้ซ้ำซ้อน |
| | **[`docs/AI_COLLABORATION_GUIDELINES.md`](docs/AI_COLLABORATION_GUIDELINES.md)** | 🎖️ คู่มือแม่บท — มาตรฐานวิศวกรรมระดับโลก, Domain Mapping, และ 14 Golden Design Rules |
| | **[`GEMINI.md`](GEMINI.md) / [`CLAUDE.md`](CLAUDE.md)** | 🔮 สรุปกฎเหล็กการทำงานและ Workflow อัตโนมัติสำหรับ AI Agents |
| **🏛️ สถาปัตยกรรม & คลาวด์** | **[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)** | 🏛️ สถาปัตยกรรมระบบ, Edge Caching, SSE Streaming Protocol และ Provably Fair Engine |
| | **[`docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`](docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md)** | ⚡ คู่มือการนำเว็บขึ้น Cloudflare Workers & Custom Domain พร้อมระบบ Secret |
| | **[`docs/ADMIN_PANEL.md`](docs/ADMIN_PANEL.md)** | 📊 คู่มือและสถาปัตยกรรมแผงควบคุมผู้ดูแลระบบ (Admin Panel & Cloud Health) |
| | **[`docs/WORK_LOG.md`](docs/WORK_LOG.md)** | 📖 ประวัติการพัฒนาและ Audit Trail ส่งต่องานแบบเรียลไทม์ |
| **🪶 สถาปัตยกรรม Astro & ประสิทธิภาพ** | **[`docs/plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md`](docs/plans/HANDOFF_ASTRO_MIGRATION_2026-09-15.md)** | 🪶 แผนย้ายเว็บไปสถาปัตยกรรม Astro 7 + React 19 Islands (305 หน้า SSG Zero-Runtime ตอบจาก Edge) |
| | **[`docs/plans/HANDOFF_CARD_TILE_CV_2026-09-15.md`](docs/plans/HANDOFF_CARD_TILE_CV_2026-09-15.md)** | 📐 สูตรความสูงการ์ดไพ่และกฎ content-visibility ต่อ breakpoint (ด่านที่ 62) |

---

## 🎖️ มาตรฐานวิศวกรรมระดับโลก (Senior Staff Engineering Discipline)

1. **วัดก่อนเดา (Evidence over Assumption)** — สรุปสาเหตุจากหลักฐานจริงเท่านั้น ไม่ใช่จากการอ่านโค้ด
2. **หาสาเหตุราก ไม่ใช่ดับอาการ (Root Cause, not Symptom)** — ต้องตอบให้ได้ว่า "ทำไมถึงเกิดขึ้นได้ตั้งแต่แรก"
3. **แก้อาการแรกแล้วต้องรันซ้ำ (One Bug May Mask Another)** — error หนึ่งมักบัง error อีกตัวไว้
4. **พิสูจน์ว่าแก้ได้จริง (Verify, don't assume)** — ทดสอบทั้งเส้นทางที่สำเร็จและที่ล้มเหลว (69/69 verification gates)
5. **รายงานตามจริง (Report Honestly)** — แม้ผลจะไม่สวย หากติดปัญหาให้แจ้งตรงไปตรงมา
6. **แก้เรื่องเดียวต่อหนึ่ง commit และบันทึกบทเรียนเสมอ** — ระบบบล็อก commit ที่ไม่ระบุ `--cause` และ `--prevention`
7. **ทำงานให้สะอาดและจบสมบูรณ์ 100% (Zero Leftovers)** — ตรวจ 69 ด่าน ➔ Commit ➔ Push ➔ Auto-Merge ➔ Tidy ห้ามทิ้งภาระให้ผู้อื่นตามแก้

```bash
# commit ประเภทแก้บั๊ก ต้องบันทึกบทเรียนเสมอ (ระบบเขียนลง INCIDENT_LOG.md ให้เอง)
npm run commit -- --agent <ชื่อ> --type fix --scope <หมวด> \
  --msg "<แก้อะไร>" --cause "<ทำไมถึงเกิด>" --prevention "<กฎกันเกิดซ้ำ>" \
  --severity high --verify "<พิสูจน์ยังไง>"
```

---

## 🛡️ สัญญาอนุญาตและทรัพย์สินทางปัญญา (License & Intellectual Property)

- ซอร์สโค้ดและงานออกแบบทั้งหมดอยู่ภายใต้ **[Protective Non-Commercial Source License (PolyForm Noncommercial 1.0.0)](LICENSE)**
- **สงวนลิขสิทธิ์ (c) 2026 SeerTarot** — อนุญาตให้ใช้เพื่อการศึกษา วิจัย และทดสอบส่วนบุคคลเท่านั้น
- ❌ **ห้ามนำไปใช้ในเชิงพาณิชย์ แสวงหากำไร ขายต่อ หรือคัดลอกเพื่อสวมสิทธิ์โดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร**


