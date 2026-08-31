# 🐛 บั๊กและงานค้างที่รู้แล้วแต่ยังไม่ได้แก้ (Known Issues Registry)

> 🎯 **สำหรับ AI Agent ทุกตัว**: นี่คือรายการปัญหาที่ **ตรวจสอบยืนยันแล้วว่ามีจริง** แต่ยังไม่ได้แก้
>
> - **ก่อนเริ่มงานใหม่** ให้ดูก่อนว่ามีงานในนี้ที่เกี่ยวข้องกับสิ่งที่กำลังจะแก้หรือไม่
> - **ก่อนลงมือ** ให้ตรวจว่ามี Agent อื่นจับงานนี้อยู่หรือยัง (`npm run agent:status`) และล็อคไฟล์ก่อนเสมอ
> - **เมื่อแก้เสร็จ** ให้ย้ายรายการนั้นออกจากไฟล์นี้ แล้วบันทึกลง [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) แทน
>
> ปัญหาที่ **แก้ไปแล้ว** อยู่ใน [`docs/INCIDENT_LOG.md`](INCIDENT_LOG.md) พร้อมกฎป้องกันถาวร — อ่านที่นั่นก่อนเริ่มงานทุกครั้ง
>
> 🔒 **หมายเหตุ**: ตั้งแต่นี้ไป `npm run repo:verify` มีด่าน **"การอ้างอิง path ภาพไพ่ถูกต้อง"** เพิ่มเข้ามา
> ซึ่งจะบล็อกทันทีถ้ามีการเขียน path ภาพไพ่เองในจุดใหม่ (บทเรียนจาก ISSUE-008 ที่ละเมิดกฎซึ่งมีเขียนไว้แล้วใน INC-0002)

---

## 🟢 ปัญหาที่แก้เสร็จสมบูรณ์แล้วใน PR ปัจจุบัน (Resolved in Current Branch)

### ISSUE-001 · ปุ่ม "ถัดไป: ตั้งคำถามและเลือกแม่หมอ" ไม่พาไปขั้นที่ 2 — แก้ไขแล้ว 100%
- **สาเหตุจริง**: `<AnimatePresence mode="wait">` ใน Framer Motion 13 + React 19.2 + Next 16 เกิด exit-transition deadlock
- **วิธีแก้**: ถอด `<AnimatePresence>` และ `<motion.div>` ทั้งหมดใน `src/app/page.tsx` ออก เปลี่ยนมาใช้ Pure CSS GPU Hardware Transitions (`.anim-page-transition`) พร้อมระบบ Multi-Frame Instant Scroll Reset
- **สถานะ**: ✅ **แก้แล้ว — ตรวจสอบและผ่านทั้ง 7 ด่าน (`npm run repo:verify`)**

### ISSUE-002 · Hydration mismatch ใน `TwelveMonthsSpreadArt`
- **วิธีแก้**: ใช้ `Number((Math.cos(rad) * radius).toFixed(2))` ปัดเศษทศนิยมพิกัดให้ SSR และ Client ตรงกัน 100%
- **สถานะ**: ✅ **แก้แล้ว**

### ISSUE-008 · `cache.ts` พรีโหลดภาพไพ่จาก path ที่ไม่มีอยู่จริง
- **วิธีแก้**: เปลี่ยนมาใช้ `getCardImageSrc()` จาก `@/lib/tarot/card-image` และลบ `ALLOWLIST` ใน `scripts/qa/test-image-paths.ts` ออก
- **สถานะ**: ✅ **แก้แล้ว**

### ISSUE-009 · `cache.ts` พรีโหลดไฟล์เสียงที่ไม่มีอยู่ในโปรเจกต์
- **วิธีแก้**: ตัด `PRELOAD_SOUNDS` ที่พยายามโหลดไฟล์ `.mp3` ซึ่งไม่มีอยู่จริงออก โดยใช้ Web Audio Synthesizer Engine ใน `src/lib/utils/audio.ts`
- **สถานะ**: ✅ **แก้แล้ว**

### ISSUE-010 · `.env.example` ขาดคีย์ที่โค้ดใช้จริง
- **วิธีแก้**: อัปเดต `.env.example` เพิ่ม `TAROT_SESSION_SECRET` และ Cloudflare Turnstile keys พร้อมตัดตัวแปรที่ไม่ได้ใช้จริงออก
- **สถานะ**: ✅ **แก้แล้ว**

### ISSUE-011 · repo ใช้ pnpm แต่ไม่มี `packageManager` field
- **วิธีแก้**: เพิ่ม `"packageManager": "pnpm@9.15.4"` ใน `package.json`
- **สถานะ**: ✅ **แก้แล้ว**

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
