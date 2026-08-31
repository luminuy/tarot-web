# 🐛 บั๊กและงานค้างที่รู้แล้วแต่ยังไม่ได้แก้ (Known Issues Registry)

> 🎯 **สำหรับ AI Agent ทุกตัว**: นี่คือรายการปัญหาที่ **ตรวจสอบยืนยันแล้วว่ามีจริง** แต่ยังไม่ได้แก้
>
> - **ก่อนเริ่มงานใหม่** ให้ดูก่อนว่ามีงานในนี้ที่เกี่ยวข้องกับสิ่งที่กำลังจะแก้หรือไม่
> - **ก่อนลงมือ** ให้ตรวจว่ามี Agent อื่นจับงานนี้อยู่หรือยัง (`npm run agent:status`) และล็อคไฟล์ก่อนเสมอ
> - **เมื่อแก้เสร็จ** ให้ย้ายรายการนั้นออกจากไฟล์นี้ แล้วบันทึกลง [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) แทน
>
> ปัญหาที่ **แก้ไปแล้ว** อยู่ใน [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) พร้อมกฎป้องกันถาวร — อ่านที่นั่นก่อนเริ่มงานทุกครั้ง

---

## 🔴 ระดับ Critical — กระทบผู้ใช้จริง ต้องแก้ก่อน

### ISSUE-001 · ปุ่ม "ถัดไป: ตั้งคำถามและเลือกแม่หมอ" ไม่พาไปขั้นที่ 2 — flow ดูดวงติดตายที่ขั้น 1

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | กดปุ่ม `ถัดไป: ตั้งคำถามและเลือกแม่หมอ →` ท้ายหน้าเลือกผัง แถบลำดับขั้นเปลี่ยนเป็น `✓ เลือกผัง` และไฮไลต์ `2 ตั้งคำถาม` แต่หน้าจอยังแสดง `SpreadCardSelector` เหมือนเดิม `IntentionAltarInput` ไม่ขึ้นมาเลย กดซ้ำก็ไม่มีอะไรเกิดขึ้น |
| **ผลกระทบ** | **ผู้ใช้ดูดวงไม่ได้เลย** ทั้ง flow 5 ขั้นตอนติดตายอยู่ที่ขั้นแรก ซึ่งเป็นฟีเจอร์หลักทั้งหมดของเว็บ |
| **ตรวจสอบยืนยันแล้วว่า** | เกิดบน `main` ที่ยังไม่มีการแก้ไขใด ๆ (ทดสอบซ้ำบน dev server ของ repo หลัก commit `24dc876` ก็ติดจุดเดียวกัน) **ไม่ได้เกิดจากงานแก้ภาพไพ่ (PR #6-#10)** |
| **เริ่มดูตรงไหน** | `src/app/page.tsx` (Main Orchestrator คุม state ทั้ง 5 ขั้น) และ prop `onProceed` ใน `src/components/spread/SpreadCardSelector.tsx` |
| **สมมติฐานที่ควรไล่เช็ก** | 1) state ของ step เปลี่ยนจริงไหม<br>2) เงื่อนไขที่ render ขั้น 2 เป็น false เพราะอะไร<br>3) `/api/reading/start` ล้มเงียบหรือเปล่า (ไม่มี `GEMINI_API_KEY` ในเครื่อง?)<br>4) `src/services/turnstile.service.ts` บล็อกอยู่ไหม<br>5) มี error ถูก catch แล้วกลืนทิ้งหรือไม่ |
| **เกณฑ์ว่าแก้สำเร็จ** | กดปุ่มแล้ว `IntentionAltarInput` แสดงผลจริง และเดินต่อได้ครบถึงขั้นที่ 5 (สับไพ่ → เลือกไพ่ → อ่านคำทำนาย) |
| **สถานะ** | มี background task จับงานนี้อยู่ใน worktree `blissful-swirles-b33832` (แก้ `src/app/page.tsx` ค้างไว้ ยังไม่ commit) — **ตรวจสอบก่อนลงมือ ว่างานเสร็จหรือถูกทิ้งไปแล้ว** |

---

## 🟡 ระดับ Medium — ทำงานผิดแต่ไม่บล็อกผู้ใช้

### ISSUE-002 · Hydration mismatch ใน `TwelveMonthsSpreadArt`

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | React ขึ้น error ที่หน้า `/spreads`:<br>`transform: "translate(-21.000000000000018px, -36.37306695894641px) rotate(330deg)"` (client)<br>`transform: "translate(-21px, -36.3731px) rotate(330deg)"` (server) |
| **ผลกระทบ** | React ยอมแพ้การ patch ส่วนนั้น (`This won't be patched up`) และ console เต็มไปด้วย error บดบังปัญหาจริงอื่น ๆ |
| **สาเหตุ** | คำนวณพิกัดด้วย `Math.cos` / `Math.sin` แล้วใส่ทศนิยมดิบลง inline style ฝั่ง server กับ client serialize ตัวเลขไม่เหมือนกัน |
| **เริ่มดูตรงไหน** | `src/components/ui/TarotArtIcons.tsx` — คอมโพเนนต์ `TwelveMonthsSpreadArt` และคอมโพเนนต์ผังแบบวงกลม/รัศมีอื่น ๆ ในไฟล์เดียวกันที่ใช้เทคนิคเดียวกัน |
| **แนวทางแก้** | ปัดทศนิยมก่อนใส่ลง style เช่น `.toFixed(2)` |
| **เกณฑ์ว่าแก้สำเร็จ** | เปิด `/spreads` แล้ว console ไม่มี hydration error เหลืออยู่ |
| **ข้อควรระวัง** | ไฟล์นี้ใช้ `<CardImage />` แสดงภาพไพ่ทุกจุดแล้ว **ห้ามเปลี่ยนกลับไปเป็น `<img>` เด็ดขาด** (ดู INC-0002) |
| **สถานะ** | มี background task จับงานนี้อยู่ใน worktree `silly-cannon-2b75b4` (แก้ `TarotArtIcons.tsx` ค้างไว้ ยังไม่ commit) — **ตรวจสอบก่อนลงมือ** |

### ISSUE-003 · ฐานข้อมูลไพ่เอนเอียงด้าน "ใช่" มากเกินไป ทำให้ผังใช่/ไม่ใช่ ตอบเพี้ยน

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `npm run repo:verify` เตือนทุกครั้ง:<br>`yesNo เอียงไปด้านเดียวมาก (ใช่ 43 / ไม่ใช่ 18 / ไม่แน่ 17) — spread ใช่/ไม่ใช่ จะตอบเอียงผิดปกติ` |
| **ผลกระทบ** | ผัง **"ใช่หรือไม่ (ไพ่ 3 ใบ)"** มีโอกาสตอบ "ใช่" ราว 55% ทั้งที่ควรใกล้เคียงสมดุลกว่านี้ ทำให้คำทำนายไม่น่าเชื่อถือ |
| **เริ่มดูตรงไหน** | ฟิลด์ `yesNo` ในไฟล์ `src/data/cards/*.ts` (78 ใบ) และ `scripts/verify-cards.ts` ที่เป็นตัวเตือน |
| **แนวทางแก้** | ทบทวนค่า `yesNo` ของไพ่ที่ความหมายค่อนไปทางลบหรือกลาง ๆ ให้สะท้อนความหมายไพ่จริงตามตำรา 1909 Rider-Waite ไม่ใช่ปรับมั่วให้ตัวเลขสวย |
| **เกณฑ์ว่าแก้สำเร็จ** | `verify-cards.ts` ไม่ขึ้นคำเตือนนี้อีก และการเปลี่ยนแต่ละใบมีเหตุผลอ้างอิงความหมายไพ่กำกับ |
| **ข้อควรระวัง** | ⚠️ ห้ามแก้ `structure` ของไพ่ 78 ใบ ต้องรัน `verify-cards.ts` ทุกครั้งหลังแก้ |

---

## 🔵 ระดับ Low — ข้อจำกัดของสภาพแวดล้อม ไม่ใช่บั๊กของโค้ด

### ISSUE-004 · รัน Cloudflare Workers ในเครื่อง (`preview:worker` / `wrangler dev`) ไม่ได้

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `✘ [ERROR] Unsupported macOS version: The Cloudflare Workers runtime cannot run on the current version of macOS (12.6.0). The minimum requirement is macOS 13.5.0+` |
| **ผลกระทบ** | ทดสอบพฤติกรรมฝั่ง Worker ในเครื่องไม่ได้ (เช่น ตรวจ HTTP header ที่มาจาก `public/_headers`) ต้องรอไปตรวจบน production หลัง deploy |
| **สิ่งที่ยัง "ทำได้" ปกติ** | `npm run dev` (Next.js dev server) และ `npm run build:worker` ยังทำงานได้ปกติ — deploy ผ่าน GitHub Actions ได้ไม่มีปัญหา |
| **ทางแก้** | อัปเกรด macOS เป็น 13.5 ขึ้นไป หรือใช้ DevContainer (Linux glibc 2.35+) |
| **วิธีตรวจแทนระหว่างนี้** | ตรวจ header จริงบน production ด้วย<br>`curl -sI https://tarot-web.bankjack10452.workers.dev/cards/w256/major-00.webp` |

### ISSUE-005 · GitHub native auto-merge ปิดอยู่ในตั้งค่า repo

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `gh pr merge --auto` ล้มด้วย `GraphQL: Auto merge is not allowed for this repository (enablePullRequestAutoMerge)` ตรวจ API ได้ `allow_auto_merge: false` |
| **ผลกระทบ** | ไม่กระทบการทำงานจริง เพราะ `.github/workflows/pr.yml` merge ให้เองอยู่แล้วหลัง CI ผ่าน `scripts/github-auto.ts` ตรวจค่านี้ก่อนแล้วข้ามอย่างสุภาพ |
| **ทางแก้** | ⚠️ **AI ทำเองไม่ได้ ต้องให้เจ้าของบัญชีเปิดเอง** ที่ GitHub → repo `luminuy/tarot-web` → **Settings → General → Pull Requests → Allow auto-merge** |

### ISSUE-006 · GitHub Actions เตือนว่า Node.js 20 กำลังจะเลิกรองรับ

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | ทุก workflow run ขึ้น annotation:<br>`Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/setup-node@v4` |
| **ผลกระทบ** | ตอนนี้ยังทำงานได้ปกติ แต่จะพังในอนาคตเมื่อ GitHub เลิกรองรับจริง |
| **ทางแก้** | อัปเกรดเป็น `actions/checkout@v5` และ `actions/setup-node@v5` ใน `.github/workflows/*.yml` ทุกไฟล์ แล้วดูว่า CI ยังผ่านครบ |

### ISSUE-007 · Prisma ออกแบบ schema ไว้แล้วแต่ยังไม่ได้ต่อใช้จริง

| หัวข้อ | รายละเอียด |
| :--- | :--- |
| **อาการ** | `prisma/schema.prisma` ครบถ้วนแล้ว แต่ระบบยังใช้ `src/server/store.ts` (in-memory) อยู่ ข้อมูลหายทุกครั้งที่ Worker restart |
| **สาเหตุ** | Prisma 7 มี breaking change เรื่อง `datasource.url` (ต้องย้ายไป `prisma.config.ts` และเลือก adapter ก่อน) จึงตัด `prisma generate` ออกจาก build ชั่วคราว |
| **ผลกระทบ** | ประวัติการดูดวงเก็บใน `localStorage` ของผู้ใช้เท่านั้นตามนโยบาย PDPA — ยังไม่กระทบการใช้งาน แต่ขยายฟีเจอร์ที่ต้องใช้ DB ไม่ได้ |
| **เริ่มดูตรงไหน** | `prisma/schema.prisma`, `src/server/repositories/reading.repository.ts`, `src/server/store.ts` |
| **ข้อควรระวัง** | ⚠️ ต้องไม่ขัดกับกฎ PDPA ในคู่มือ — ข้อมูลผู้ใช้ห้ามเก็บถาวรบนเซิร์ฟเวอร์และห้ามนำไปเทรนโมเดล |
