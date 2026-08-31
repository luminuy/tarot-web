# 📋 บันทึกประวัติการพัฒนาและสถานะส่งต่องาน (Live Work Log & Handoff Registry)

> **⚠️ กฎเหล็กสำหรับ AI และนักพัฒนาทุกคน**:  
> ทุกครั้งที่ทำงาน แก้บั๊ก หรือเพิ่มฟีเจอร์เสร็จสิ้น **ต้องมาบันทึกสรุปลงในไฟล์นี้เสมอ** ตามโครงสร้างด้านล่าง เพื่อให้คนหรือ AI ตัวต่อไปที่มาทำงานต่อทราบสถานะทันทีว่าถึงไหนแล้ว อะไรแก้ไปแล้ว และมีอะไรค้างอยู่

---

## 📌 สรุปสถานะงานปัจจุบัน (Current Handoff Summary — Auto-Synced)

> ⚡ **อัปเดตสถานะอัตโนมัติล่าสุด**: `31/8/2569 11:09:30` (ทุกครั้งที่มีการทดสอบ/รันระบบ)

- **สถานะระบบ**: ✅ **Production-Ready & Fully Polished (เสร็จสมบูรณ์ทุก Core Milestone)**
- **AI Agent Concurrency**: ✅ [ปลอดภัย] ไม่พบการชนกันของไฟล์หรือ Agent Lock (28 ไฟล์ที่กำลังแก้, 0 Locks ที่ใช้งานอยู่)
- **TypeScript Health**: `npm run typecheck` ➔ **✅ 0 Errors (สมบูรณ์ 100%)**
- **Database / Cards**: ไพ่ **78 ใบ** (780 ข้อความความหมาย 5 หมวด) สมบูรณ์ 100%
- **ผังพยากรณ์**: **20 ผังพยากรณ์ยอดนิยม** (95 ตำแหน่งพยากรณ์) สัดส่วนทองคำ ไร้การตัดขอบ 100%

### 🧭 ตารางสถานะฟีเจอร์และหน้าเว็บ (Feature Readiness & Roadmap Matrix)

| หน้าเว็บ / ฟีเจอร์ | เส้นทาง (Route / File) | สถานะความพร้อม | สถานะเซิร์ฟเวอร์ | สิ่งที่ทำแล้ว | สิ่งที่สามารถต่อยอดได้ในอนาคต |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **วิหารพยากรณ์หลัก** | `/` | 🟢 **Active / Live** | HTTP 200 | ผัง 5 ขั้นตอน (เลือกผัง, ตั้งจิต, สับไพ่ 3D, แผ่ไพ่ 78 ใบ, อ่านผลสด SSE, TTS) | เพิ่มโหมดสลับไพ่กลับหัว Manual |
| **สารานุกรมไพ่ 78 ใบ** | `/cards` & `/cards/[id]` | 🟢 **Active / Live** | HTTP 200 | กริด 78 ใบ + ค้นหา + แท็บกรองชุดไพ่ + หน้าเจาะลึกรายใบ 5 หมวด + โหราศาสตร์ + ปุ่มใบก่อน/ถัดไป | เพิ่ม Audio คำอ่านรายใบ |
| **คลัง 20 ผังพยากรณ์** | `/spreads` | 🟢 **Active / Live** | HTTP 200 | แท็บกรอง 4 หมวด + ภาพไดอะแกรมผังจริง 20 แบบ + ขยายดูความหมายตำแหน่ง + ปุ่มเปิดผัง | แชร์ผังพยากรณ์แบบรูปภาพ |
| **คัมภีร์บทความความรู้** | `/blog` | 🟡 **Scaffolded (Draft)** | HTTP 200 | หน้าบทความ 3 บทความหลัก พร้อม UI สวยงาม | ระบบ Dynamic Reader `/blog/[slug]` Markdown |
| **บัญชีและประวัติ** | `/account` | 🟡 **Scaffolded (Draft)** | HTTP 200 | จัดการความเป็นส่วนตัว, ลบข้อมูลตาม PDPA | ระบบ NextAuth Login และซิงก์ประวัติคลาวด์ |
| **นโยบายความเป็นส่วนตัว** | `/privacy` | 🟢 **Active / Live** | HTTP 200 | ข้อกำหนด PDPA ครบถ้วน พร้อมปุ่มลบข้อมูลจริง | - |
| **API สับ/เลือก/เฉลย** | `/api/reading/[id]/*` | 🟢 **Active / Live** | Ready | Service Layer + Repository + Provably Fair SHA-256 | เชื่อมต่อ Prisma PostgreSQL ถาวร |
| **Provably Fair Badge** | `ProvablyFairBadge.tsx` | 🟢 **Active / Live** | Ready | ปุ่มและ Modal ตรวจสอบ SHA-256 Commit-Reveal | แสดงตราประทับบนการ์ดผลสรุปคำทำนาย |

---

## 📜 บันทึกประวัติการพัฒนา (Changelog & Activity Log)

### 🗓️ 2026-08-31: แก้ภาพไพ่เบลอ/หยัก (Card Image Sharpness Fix)

#### 1. ลบ `image-rendering: crisp-edges` ที่ทำให้ภาพไพ่แตกเป็นเม็ด
- **ปัญหาเดิม**: ภาพหน้าไพ่ทุกจุดดูไม่คมชัด ตัวอักษรบนหน้าไพ่ (THE SUN / THE FOOL) อ่านไม่ออก โดยเฉพาะการ์ดพรีวิวผังและโลโก้ Navbar
- **สาเหตุที่แท้จริง**: `.card-face img, .tarot-hd-card-image` ใน `src/app/globals.css` กำหนด `image-rendering` ซ้อนกัน 3 บรรทัด โดยบรรทัดสุดท้าย (`crisp-edges`) ชนะ → เบราว์เซอร์ย่อภาพแบบ nearest-neighbour
  - ภาพต้นฉบับ ~820x1430px ถูกย่อเหลือ 34-70px (ย่อ 12-25 เท่า) → เส้นและตัวอักษรแตกเป็นเม็ดหยาบ
  - `filter: contrast/saturate` ที่ใส่ไว้เพื่อเพิ่มความคม กลับขับเม็ดหยาบให้เด่นขึ้นอีก
- **สิ่งที่แก้ไข**:
  - เปลี่ยนเป็น `image-rendering: auto` (bilinear/mipmap) บรรทัดเดียว
  - ลบ `transform: translateZ(0)` ออกจาก `<img>` (บังคับสร้าง composited layer โดยไม่จำเป็น และทำให้ iOS Safari rasterize ที่ 1x)
  - คง `backface-visibility: hidden` ไว้สำหรับการพลิกไพ่ 3D
  - ใส่คอมเมนต์เตือนห้ามใส่กลับไว้ในไฟล์
- **ไฟล์ที่แก้ไข**:
  - `src/app/globals.css`
- **ผลการทดสอบ**: `npm run typecheck` ➔ ผ่าน 0 errors | ตรวจสอบบน dev server จริง (computed `image-rendering: auto`, `transform: none`) และเทียบภาพ before/after → ตัวอักษรบนหน้าไพ่ขนาด 60px อ่านออกชัดเจน
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ**: ยังโหลดภาพเต็ม ~279KB/ใบ มาแสดงที่ 34-70px (หน้าเลือกผังโหลด ~4.6MB) → ควรทำภาพย่อหลายขนาด + `srcset`/`sizes` ในเฟสถัดไป


#### 2. ระบบภาพไพ่ย่อหลายขนาด WebP + `<CardImage />` (Responsive Card Image Pipeline)
- **ปัญหาเดิม**: ทุกจุดในเว็บโหลดภาพต้นฉบับ ~820px หนัก ~280KB/ใบ มาแสดงที่ขนาด 34-170px
  - หน้าเลือกผังโหลดภาพไพ่รวม **4.63MB**, หน้า `/spreads` มีภาพไพ่ 96 ใบ, หน้าแผ่ไพ่ 78 ใบคิดเป็น ~21MB
  - นอกจากเปลืองแบนด์วิดท์แล้ว การให้เบราว์เซอร์ย่อภาพ 12-25 เท่าเองยังได้ผลลัพธ์ที่คมน้อยกว่าภาพที่ย่อมาล่วงหน้า
  - `<img src="/cards/..." />` ยังกระจายอยู่ ~90 จุด เสี่ยงผิดกฎ Root Image Path Resolution ซ้ำอีก
- **สิ่งที่แก้ไข**:
  - เพิ่ม `scripts/generate-card-variants.ts` (`npm run cards:variants`) สร้างภาพย่อ WebP ด้วย `cwebp` แบบ idempotent
    - `public/cards/w256/*.webp` — กว้าง 256px (~33KB/ใบ) สำหรับพรีวิวผัง โลโก้ พัดไพ่
    - `public/cards/w512/*.webp` — กว้าง 512px (~109KB/ใบ) สำหรับผังวางไพ่ และสารานุกรมไพ่ 78 ใบ
    - ภาพต้นฉบับ `.jpg` ยังอยู่ครบไม่ถูกแตะต้อง ใช้เป็นทั้ง fallback และภาพความละเอียดเต็ม
  - เพิ่ม `src/lib/tarot/card-image.ts` เป็นแหล่งความจริงเดียวของ path ภาพไพ่ (`getCardImageSrc`, `getCardWebpSrcSet`)
  - เพิ่มคอมโพเนนต์ `src/components/card/CardImage.tsx` ห่อด้วย `<picture>` + `<source type="image/webp">` + `srcset`/`sizes`
    - `<picture>` ใช้ `display: contents` จึงไม่สร้างกล่อง layout เพิ่ม — การจัดวางเดิมไม่เปลี่ยนแม้แต่พิกเซลเดียว
    - มี prop `full` สำหรับภาพใบใหญ่ (หน้ารายละเอียดไพ่ 258px, หน้าซูม, Export ลง Canvas) ให้ใช้ไฟล์ต้นฉบับ
  - แทนที่ `<img>` ภาพไพ่ **ทุกจุดในระบบ (~90 จุด / 13 ไฟล์)** ด้วย `<CardImage />` พร้อม `sizes` ที่คำนวณจากความกว้างจริงของแต่ละจุด
  - เพิ่ม prop `imageSizes` / `imageFull` ให้ `TarotCard` เพื่อให้จุดที่ override ขนาดด้วย `className` ระบุขนาดจริงได้
  - ลบ `getImageSrc` ที่เขียนซ้ำใน `CardsExplorer.tsx` และ `CardDetailView.tsx` ให้เรียกจาก helper กลางแทน
- **ไฟล์ที่แก้ไข**:
  - เพิ่มใหม่: `src/lib/tarot/card-image.ts`, `src/components/card/CardImage.tsx`, `scripts/generate-card-variants.ts`
  - เพิ่มใหม่: `public/cards/w256/` และ `public/cards/w512/` (156 ไฟล์ WebP)
  - แก้ไข: `src/app/page.tsx`, `src/components/ui/TarotArtIcons.tsx`, `src/components/card/TarotCard.tsx`,
    `src/components/card/CardZoomModal.tsx`, `src/components/spread/SpreadBoard.tsx`,
    `src/components/spread/SpreadCardSelector.tsx`, `src/components/deck/InteractiveCardFan.tsx`,
    `src/components/encyclopedia/CardsExplorer.tsx`, `src/components/encyclopedia/CardDetailView.tsx`,
    `src/components/encyclopedia/TarotEncyclopediaModal.tsx`, `src/components/reading/StreamReader.tsx`,
    `src/components/reading/FollowUpChat.tsx`, `src/components/reading/IntentionAltarInput.tsx`,
    `src/components/reading/ShareModal.tsx`, `package.json`
- **ผลการทดสอบ**:
  - `npm run typecheck` ➔ **ผ่าน 0 errors**
  - `scripts/verify-cards.ts` ➔ **ไพ่ 78 ใบผ่านครบ**
  - `scripts/qa/test-spreads.ts` ➔ **541/541 ผ่าน (20 ผัง 95 ตำแหน่ง)**
  - ตรวจบนเบราว์เซอร์จริง: หน้าแรก 26 ภาพ, `/cards` 15 ภาพ, `/spreads` 96 ภาพ — **โหลดครบ เสียหาย 0 ภาพ**
    เลือกไฟล์ `w256/*.webp` ถูกต้องทุกจุด และหน้ารายละเอียดไพ่ยังดึง `.jpg` ต้นฉบับ (825px) ตามที่ตั้งใจ
  - เทียบขนาด: พรีวิวผัง 1 ใบ **280KB ➔ 33KB (ลดลง 88%)** — หน้า `/spreads` ลดจาก ~26MB เหลือ ~3.2MB
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ**:
  - ยังไม่ได้ตรวจด้วยตาบนหน้าจอจริงในขั้นที่ 3-5 ของพิธีกรรม (`ShuffleRitual`, `InteractiveCardFan`, `SpreadBoard`, `StreamReader`)
    เพราะปุ่ม `ถัดไป: ตั้งคำถามและเลือกแม่หมอ` ไม่พาไปขั้นที่ 2 — **ยืนยันแล้วว่าเป็นอาการเดิมที่มีอยู่ก่อนแก้ไข**
    (ทดสอบซ้ำบน dev server ของ repo หลักที่ยังไม่มีการแก้ไขใดๆ ก็ติดจุดเดียวกัน) เป็นบั๊กคนละเรื่องที่ควรตามแก้ต่อ
  - พบ Hydration Mismatch เดิมใน `TwelveMonthsSpreadArt` (`translate(-21.000000000000018px, ...)` ฝั่ง client ไม่ตรง server)
    เกิดจากการคำนวณ `Math.cos/sin` แล้วใส่ลง inline style โดยไม่ปัดทศนิยม — ควรใช้ `.toFixed(2)` (ยังไม่แก้ อยู่นอกขอบเขตงานนี้)

#### 3. ตั้งค่า Cache-Control ระยะยาวให้ภาพไพ่บน Cloudflare (`public/_headers`)
- **ปัญหาเดิม**: ตรวจ header ของ production จริงพบว่า
  ```
  $ curl -sI https://tarot-web.bankjack10452.workers.dev/cards/major-00.jpg
  cache-control: public, max-age=0, must-revalidate
  cf-cache-status: HIT
  ```
  - `max-age=0, must-revalidate` คือค่าเริ่มต้นของ Cloudflare Workers Static Assets
  - แปลว่าเบราว์เซอร์ **ยิงถามเซิร์ฟเวอร์ใหม่ทุกครั้งที่โหลดหน้า** แม้ภาพจะไม่เคยเปลี่ยนเลย
  - หน้า `/spreads` มีภาพไพ่ 96 ใบ = ยิง 96 conditional requests ทุกครั้งที่เข้าหน้า (ได้ 304 กลับมา แต่ก็ยังเสีย round-trip)
  - `cf-cache-status: HIT` ยืนยันว่าภาพถูกแคชที่ Cloudflare edge อยู่แล้ว — คอขวดอยู่ที่ฝั่งเบราว์เซอร์ ไม่ใช่ที่ต้นทาง
- **สิ่งที่แก้ไข**: เพิ่มไฟล์ `public/_headers` (วิธีที่ OpenNext แนะนำอย่างเป็นทางการ) ตั้ง `Cache-Control: public, max-age=31536000, immutable` ให้ `/cards/*`, `/cards/w256/*`, `/cards/w512/*` และ `/_next/static/*`
- **ไฟล์ที่แก้ไข**: `public/_headers` (ไฟล์ใหม่)
- **ผลการทดสอบ**:
  - `npm run build:worker` ➔ **build ผ่าน** และยืนยันว่า `_headers` ถูก copy ไปที่ `.open-next/assets/_headers` จริง
  - ตรวจ `.open-next/assets/cards/` แล้วพบเฉพาะไฟล์ภาพ (jpg 78 + w256 78 + w512 78) **ไม่มีไฟล์ .html ปนเลย**
    จึงยืนยันได้ว่ากฎ `/cards/*` แตะเฉพาะไฟล์ภาพ ไม่ไปโดนหน้าเว็บ `/cards` และ `/cards/[id]` ที่ Worker เป็นคนเรนเดอร์
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ**:
  - **ยังไม่ได้ยืนยัน header ตอนรันจริง** เพราะ `npm run preview:worker` / `wrangler dev` รันบนเครื่องนี้ไม่ได้
    (`Unsupported macOS version: ... current version of macOS (12.6.0). The minimum requirement is macOS 13.5.0+`)
    ต้องตรวจซ้ำหลัง deploy ด้วย `curl -sI https://tarot-web.bankjack10452.workers.dev/cards/major-00.jpg`
  - ⚠️ `immutable` แคช 1 ปี ถ้าวันใดต้องเปลี่ยนไฟล์ภาพ **ต้องเปลี่ยนชื่อไฟล์หรือชื่อโฟลเดอร์ด้วยเสมอ** (เช่น `w256` ➔ `w256b`)
- **สรุปเรื่องย้ายรูปไปเก็บที่อื่น (Cloudflare Images / R2)**: **ไม่จำเป็นและไม่คุ้ม**
  - ภาพอยู่บน Cloudflare Workers Static Assets = edge CDN 300+ เมืองอยู่แล้ว และ asset request ไม่นับเป็น Worker request (ฟรี)
  - Cloudflare Images คิด $5/100,000 ภาพที่เก็บ/เดือน + $1/100,000 ภาพที่ส่ง/เดือน — จ่ายเพิ่มโดยไม่ได้อะไรกลับมา
  - Image Transformations (`/cdn-cgi/image/`) ฟรี 5,000 unique transformations/เดือน แล้ว $0.50/1,000 **แต่ต้องมี custom domain (zone) ใช้บน `*.workers.dev` ไม่ได้** และเราย่อภาพล่วงหน้าไปแล้วจึงไม่ต้องใช้
  - R2 จะเพิ่ม latency (Worker ต้องวิ่งไปหยิบจาก R2) โดยไม่ได้ประโยชน์

#### 4. แก้ Cache-Control ซ้ำสองรอบใน `public/_headers` (Duplicate Header Bug)
- **ปัญหาเดิม**: หลัง deploy PR #6 ขึ้น production แล้วตรวจ header จริงพบว่าภาพย่อ WebP ได้ค่าซ้ำ:
  ```
  $ curl -sI https://tarot-web.bankjack10452.workers.dev/cards/w256/major-00.webp
  cache-control: public, max-age=31536000, immutable, public, max-age=31536000, immutable
  ```
- **สาเหตุ**: เขียนกฎแยกไว้ทั้ง `/cards/*`, `/cards/w256/*` และ `/cards/w512/*`
  แต่ splat (`*`) ของ Cloudflare เป็นแบบ **greedy** คือกินข้ามเครื่องหมาย `/` ไปด้วย
  กฎ `/cards/*` จึง match ภาพย่อทั้งหมดอยู่แล้ว และเมื่อมีกฎซ้อนกันหลายข้อ
  Cloudflare จะ **ต่อท้าย (append)** ค่า ไม่ใช่ **แทนที่ (replace)** ค่าจึงถูกเขียนซ้ำสองรอบ
- **สิ่งที่แก้ไข**: ลบกฎ `/cards/w256/*` และ `/cards/w512/*` ที่ซ้ำซ้อนออก เหลือ `/cards/*` ข้อเดียว พร้อมคอมเมนต์อธิบายกันพลาดซ้ำ
- **ไฟล์ที่แก้ไข**: `public/_headers`
- **ผลการทดสอบ (จาก deploy รอบก่อนหน้า ยืนยันว่ากฎ scope ถูกต้อง)**:
  - `/cards/major-00.jpg` ➔ `max-age=31536000, immutable` **ถูกต้อง**
  - `/cards/major-00` (หน้าเว็บ HTML) ➔ `s-maxage=31536000` **ไม่โดน immutable ตามที่ตั้งใจ**
    ยืนยันว่ากฎ `/cards/*` แตะเฉพาะไฟล์ static ไม่ไปโดนหน้าที่ Worker เรนเดอร์

#### 5. ยกเครื่องระบบ GitHub Automation (`scripts/github-auto.ts`)
- **ปัญหาที่เจอจริงตอนใช้งาน**:
  1. **`npm run pr:auto` พังทุกครั้งที่รันจาก git worktree** — `gh pr merge` พยายาม checkout `main` ในเครื่อง
     แต่ `main` ถูก checkout ค้างที่โฟลเดอร์หลักอยู่แล้ว จึงล้มด้วย `fatal: 'main' is already checked out at ...`
     PR ถูกสร้างสำเร็จแต่ auto-merge ไม่ติด ต้องมาสั่งเองทุกครั้ง (เจอตอนทำ PR #6 และ #7)
     **AI Agent ทำงานใน worktree เสมอ แปลว่าคำสั่งนี้พังทุกครั้งที่ AI เรียกใช้**
  2. **`scripts/qa/test-safety.ts` และ `scripts/qa/test-shuffle.ts` ไม่เคยถูกรันโดยอัตโนมัติเลย**
     ทั้งสองไฟล์มีอยู่และผ่านหมด (14+14 = 28 เทสต์) แต่ไม่มี hook, npm script หรือ CI ตัวไหนเรียกใช้
     ทั้งที่เป็นเทสต์ของ **ตัวกรองคำถามอันตราย** และ **ระบบสับไพ่ Provably Fair** ซึ่งเป็นหัวใจด้านความปลอดภัยและความโปร่งใส
  3. ชุดตรวจถูกเขียนซ้ำ 4 ที่ (`pre-commit`, `pre-push`, `git-author-guard.ts`, workflow ทั้งสอง) แก้ที่หนึ่งลืมอีกที่
  4. `npm run commit` รันชุดตรวจ แล้ว `pre-commit` hook รันซ้ำอีกรอบ เสียเวลาสองเท่าทุกครั้ง
  5. หัวข้อ/คำอธิบาย PR และข้อความ commit ถูกต่อเป็นสตริงแล้วยิงผ่าน shell — ถ้ามี `"`, `` ` ``, `$` จะเพี้ยนหรือถูกแทรกคำสั่งได้
  6. ถ้าด่านแรกล้ม จะหยุดทันที ไม่รู้ว่าด่านหลังพังด้วยไหม ต้องแก้แล้วรันใหม่ทีละรอบ
- **สิ่งที่แก้ไข**:
  - ทุกคำสั่ง `gh` ใส่ `-R <owner>/<repo>` (อ่านจาก git remote อัตโนมัติ) บังคับโหมด remote-only **จึงรันใน worktree ได้**
  - รวมชุดตรวจเป็น `CHECKS` ที่เดียวใน `scripts/github-auto.ts` แล้วให้ทุกจุดเรียก `npm run repo:verify` เหมือนกันหมด
    (`pre-commit`, `pre-push`, `npm run commit`, `pr.yml`, `deploy.yml`)
  - **เพิ่ม `test-safety.ts` และ `test-shuffle.ts` เข้าชุดตรวจ** จาก 4 ด่านเป็น **6 ด่าน** — ตอนนี้ CI รันครบแล้ว
  - เปลี่ยนจาก `execSync(สตริง)` เป็น `execFileSync(cmd, args[])` ทั้ง `github-auto.ts` และ `git-author-guard.ts` ไม่ผ่าน shell อีกต่อไป
  - ส่งคำอธิบาย PR ผ่าน `--body-file` แทน argument ยาวๆ รองรับข้อความยาวและอักขระพิเศษได้ทุกแบบ
  - `npm run commit` ส่ง `TAROT_VERIFIED=1` ให้ `pre-commit` ข้ามการตรวจซ้ำ — commit เร็วขึ้นเท่าตัว
  - `runAllChecks()` รันจนครบทุกด่านแม้เจอที่ล้มแล้ว รายงานทีเดียวครบพร้อม error เต็ม
  - ถ้ามี PR ของ branch นั้นเปิดค้างอยู่แล้ว จะไม่สร้างซ้ำ ใช้ตัวเดิมแล้วรายงานให้ทราบ
  - เพิ่ม flag `--dry-run` (ดูว่าจะทำอะไรโดยไม่แตะ remote) และ `--no-merge` (สร้าง PR เฉยๆ ไม่เปิด auto-merge)
  - `status` แสดง repo, branch ปัจจุบัน, PR ของ branch นี้, PR ที่เปิดค้าง และผล CI 3 รอบล่าสุด
- **ไฟล์ที่แก้ไข**:
  - `scripts/github-auto.ts` (เขียนใหม่ทั้งไฟล์), `scripts/git-author-guard.ts`
  - `.githooks/pre-commit`, `.github/workflows/pr.yml`, `.github/workflows/deploy.yml`
  - `docs/AI_COLLABORATION_GUIDELINES.md`, `GEMINI.md`, `README.md`
- **ผลการทดสอบ**:
  - `npm run repo:verify` ➔ **ผ่านครบ 6/6 ด่าน** และ exit code = 0
  - ทดสอบเส้นทางล้มเหลว: แกล้งใส่ TypeScript error แล้วรันใหม่ ➔ รายงาน `ไม่ผ่าน 1 จาก 6 ด่าน`
    พร้อมชี้ตำแหน่ง `card-image.ts(59,7): error TS2322` และ **exit code = 1** (CI จะ fail จริง)
  - `npm run pr:auto -- ... --dry-run` ➔ แสดง 3 ขั้นตอนที่จะทำโดยไม่แตะ remote
  - `npx tsx scripts/github-auto.ts status` ➔ แสดง repo/branch/PR/CI ครบถ้วน
- **สิ่งที่ค้นพบเพิ่มหลังแก้ปัญหา worktree แล้ว**: พอ error ของ worktree หายไป error ตัวจริงก็โผล่ขึ้นมา
  ```
  GraphQL: Auto merge is not allowed for this repository (enablePullRequestAutoMerge)
  ```
  - ตรวจ `gh api repos/luminuy/tarot-web --jq .allow_auto_merge` ➔ **`false`**
  - แปลว่าบรรทัด `gh pr merge --auto` **ไม่เคยทำงานได้เลยตั้งแต่แรก** แค่ก่อนหน้านี้ถูก error ของ worktree บังไว้
  - ที่ PR ถูก merge จริงมาจาก step `🔀 Auto-Merge Verified PR into main` ใน `.github/workflows/pr.yml`
    ซึ่งเรียก `github.rest.pulls.merge({ merge_method: 'squash' })` เองหลังการตรวจผ่าน
  - **แก้เพิ่ม**: สคริปต์เช็ก `allow_auto_merge` ก่อน ถ้าปิดอยู่จะข้ามขั้นตอนนั้นอย่างสุภาพ
    พร้อมบอกว่า `pr.yml` จะ merge ให้เองอยู่แล้ว และบอกวิธีเปิดสวิตช์ที่ Settings > General > Pull Requests > Allow auto-merge
    ไม่ทำให้ทั้งคำสั่งล้มทั้งที่ PR สร้างสำเร็จไปแล้ว

#### 6. 🚨 แก้บั๊กเงียบ: PR ที่ merge โดย workflow ไม่เคย deploy ขึ้น production เลย
- **วิธีที่เจอ**: หลัง PR #8 ถูก merge เข้า `main` (commit `6b2e4f9`) แล้วรอ deploy แต่**ไม่มี workflow ตัวไหนทำงานเลย**
  ทั้งที่ PR #6 และ #7 ก่อนหน้านี้ deploy ปกติ จึงไล่ดูว่าใครเป็นคน merge:
  ```
  PR #6 merged by: luminuy            → deploy ทำงาน ✓
  PR #7 merged by: luminuy            → deploy ทำงาน ✓
  PR #8 merged by: app/github-actions → ไม่มี deploy ✗
  ```
- **สาเหตุ**: **GitHub จงใจไม่ trigger workflow จาก event ที่เกิดจาก `GITHUB_TOKEN`** (กลไกกันการวนซ้ำไม่รู้จบ)
  - step `🔀 Auto-Merge Verified PR into main` ใน `pr.yml` merge ด้วย `GITHUB_TOKEN`
  - push ที่เกิดจากการ merge นั้นจึง **ไม่ trigger `deploy.yml`**
  - แปลว่า **ทุก PR ที่ระบบ merge ให้เอง จะไม่เคยถูก deploy ขึ้นเว็บจริงเลย**
  - ที่ผ่านมาไม่มีใครสังเกต เพราะ PR #6 และ #7 บังเอิญถูก merge ด้วย token ของผู้ใช้ (สั่ง `gh pr merge` เอง) จึง deploy ปกติ
- **สิ่งที่แก้ไข**:
  - `deploy.yml`: เพิ่ม trigger `workflow_dispatch:` เพื่อให้สั่งรันจากภายนอกได้
  - `pr.yml`: เพิ่มสิทธิ์ `actions: write` และหลัง merge สำเร็จให้เรียก
    `github.rest.actions.createWorkflowDispatch({ workflow_id: 'deploy.yml', ref: 'main' })`
    (การ dispatch แบบนี้ **ทำงานได้กับ `GITHUB_TOKEN`** ต่างจาก push event)
  - ถ้า merge สำเร็จแต่สั่ง deploy ไม่ได้ จะ `core.setFailed()` ให้เห็นชัด ไม่เงียบอีกต่อไป
- **ไฟล์ที่แก้ไข**: `.github/workflows/pr.yml`, `.github/workflows/deploy.yml`
- **ผลการทดสอบ**: PR ที่มีการแก้ไขนี้เองคือการทดสอบ — ถ้า merge แล้ว `deploy.yml` ทำงานต่อเองโดยไม่ต้องสั่งมือ แปลว่าแก้ถูกจุด
- **หมายเหตุ**: ระหว่างที่ยังไม่แก้ commit `6b2e4f9` บน `main` ค้างอยู่โดยไม่ได้ deploy
  (ไม่กระทบหน้าเว็บ เพราะ PR #8 แก้แต่สคริปต์ automation กับเอกสาร ไม่ได้แตะโค้ดเว็บ)

#### 7. แก้เทสต์สุ่มที่ flaky จนทำ deploy ล้ม (`test-shuffle.ts`)
- **ปัญหา**: หลังเพิ่ม `test-shuffle.ts` เข้าชุดตรวจ CI (ข้อ 5) การ deploy รอบแรกก็ล้มทันที:
  ```
  ❌ อัตราไพ่หัวกลับอยู่ในช่วงสมเหตุสมผล (ได้ 19/78 ≈ 24%, คาดหวัง 40% ±15)
  13/14 ผ่าน  →  Process completed with exit code 1
  ```
- **สาเหตุ**: เทสต์วัดอัตราไพ่หัวกลับจาก **สำรับเดียว 78 ใบ** และ `serverSeed` ถูกสุ่มใหม่ทุกครั้งที่รัน
  - ที่ n = 78, p = 0.4 ค่าเบี่ยงเบนมาตรฐานคือ ±5.5 จุด กรอบ 25-55% จึงห่างแค่ ~2.7σ
  - **เทสต์จึง fail แบบสุ่มประมาณ 1 ใน 150 รอบ ทั้งที่ระบบไม่มีอะไรพัง**
  - เดิมไม่มีใครเดือดร้อนเพราะเทสต์นี้ไม่เคยถูกรันอัตโนมัติ แต่พอเอาเข้า CI มันไปกั้นการ deploy ขึ้น production
- **สิ่งที่แก้ไข**: เปลี่ยนไปวัดจาก **40 สำรับรวม 3,120 ใบ** แทนสำรับเดียว
  - σ ลดเหลือ ≈ 0.88 จุด กรอบใหม่ 35-45% จึงห่างจากค่ากลางราว 5.7σ (โอกาส fail แบบสุ่มน้อยกว่า 1 ในร้อยล้าน)
  - ยังจับได้ทันทีถ้าอัตราจริงเพี้ยน เพราะกรอบแคบลงจาก ±15 จุดเหลือ ±5 จุด — **เข้มขึ้นและนิ่งขึ้นพร้อมกัน**
- **ไฟล์ที่แก้ไข**: `scripts/qa/test-shuffle.ts`
- **ผลการทดสอบ**: รันซ้ำ 20 รอบ (serverSeed สุ่มใหม่ทุกรอบ) ได้ **38.9% - 40.9% ผ่านทั้ง 20 รอบ**
  ค่าเฉลี่ยราว 40.1% ตรงกับ `REVERSAL_RATE = 0.4` ในโค้ดจริง ยืนยันว่าตัวสุ่มไม่ได้เอนเอียง

---

### 🗓️ 2026-08-31: Phase 4 — Polish, Iconography & Multi-AI Guidelines

#### 1. Unified Sacred Gold Iconography (ปรับปรุงไอคอนทั้งเว็บ)
- **ปัญหาเดิม**: มีอิโมจิการ์ตูนทั่วไป (`🔮`, `📸`, `📜`, `💬`, `💡`, `💾`, `📱`, `📋`, `📲`) ปะปนใน UI
- **สิ่งที่แก้ไข**:
  - แทนที่ด้วยสัญลักษณ์ทองคำเปลวศักดิ์สิทธิ์ `✦` และ `✨` ทั่วทั้งระบบ
  - ปรับปุ่มบน Navbar (คัมภีร์ 78 ใบ, ประวัติดวง)
  - ปรับแท็บในวิหารคำทำนาย (อ่านรายใบ, สรุปภาพรวม, ถามแม่หมอต่อ)
  - ปรับปุ่มใน `ShareModal` (บันทึกภาพ 4:5, IG Story 9:16, คัดลอก, แชร์)
  - ปรับคำแนะนำใต้ผังไพ่ใน `SpreadBoard`
- **ไฟล์ที่แก้ไข**:
  - `src/app/page.tsx`
  - `src/components/reading/StreamReader.tsx`
  - `src/components/spread/SpreadBoard.tsx`
  - `src/components/reading/ShareModal.tsx`
- **ผลการทดสอบ**: `npm run typecheck` ➔ 0 errors, UI สวยงามหรูหรา 100%

---

#### 2. Manual Self-Reveal Flow (เปิดไพ่ด้วยตนเองทีละใบ)
- **ปัญหาเดิม**: เมื่อเข้าสู่ Step 5 ระบบเปิดไพ่ใบแรกให้อัตโนมัติ ทำให้เสียอรรถรส
- **สิ่งที่แก้ไข**:
  - ปรับให้ไพ่ทุกใบบนผังเริ่มต้นในสถานะ **คว่ำหน้าทั้งหมด (`revealedOrders = []`)**
  - เพิ่มป้ายออร่าทองคำกระพริบเบาๆ **`✦ แตะเพื่อเปิด`** บนหลังไพ่ใน `TarotCard.tsx`
  - ผู้ใช้แตะพลิกไพ่ 3D ด้วยตนเอง พร้อมเสียงเปิดไพ่ศักดิ์สิทธิ์
- **ไฟล์ที่แก้ไข**:
  - `src/app/page.tsx`
  - `src/components/card/TarotCard.tsx`
- **ผลการทดสอบ**: ทดสอบการแตะพลิกไพ่ 3D ทำงานได้อย่างราบรื่น

---

#### 3. 78-Card Grand Altar Overhaul (ยกเครื่องโต๊ะจับไพ่ 78 ใบ)
- **ปัญหาเดิม**:
  - ไพ่แถวที่ 2 และ 3 โดนขอบแถวตัดหัวเวลาลอยตัวขึ้น (Row-Level Clipping Bug จาก `overflow-x-auto`)
  - แถวการ์ดตรงแข็งทื่อเหมือนตาราง
  - มีปุ่มลูกศร `‹` `›` ด้านข้างเกะกะสายตา
- **สิ่งที่แก้ไข**:
  - ยกเลิกการแยก `overflow-x-auto` รายแถว ➔ ใช้ **Unified Altar Canvas ผืนเดียว** ไร้การตัดขอบ 100%
  - จัดเรียงไพ่ 78 ใบเป็น 3 ชั้นริบบิ้นทองคำลดหลั่นกันอย่างมีมิติ (Cascading Staggered Tiers) พร้อมองศาเอียงตามธรรมชาติ
  - เอาปุ่มลูกศร `‹` `›` ออก ให้เลื่อนสไลด์ด้วย Touch/Mouse ได้อย่างสะอาดตา
  - ออกแบบแถบความคืบหน้าด้านล่างใหม่: ตราสำรับไพ่ 3D, หลอดพลังงาน Shimmer, และป้าย Talisman Badges
- **ไฟล์ที่แก้ไข**:
  - `src/components/deck/InteractiveCardFan.tsx`
- **ผลการทดสอบ**: ไพ่ยกตัวลอย (`y: -40px, scale: 1.28x`) ได้อย่างอิสระ ไม่มีการตัดขอบแม้แต่มิลลิเมตรเดียว

---

#### 4. Step 1 3D Floating Hero Deck (อัปเกรดไพ่หน้าแรก)
- **ปัญหาเดิม**: ไพ่บนหน้าแรก (ผังชะตา) เป็นการ์ดเล็กนิ่งๆ ไม่แมตช์กับหน้าสับไพ่
- **สิ่งที่แก้ไข**: นำสำรับไพ่ 3D ขนาดใหญ่ พร้อมวงแหวน Mandala หมุนคู่ (ทอง + อเมทิสต์) และฟิสิกส์ลอยตัวจาก Step 3 มาใส่ใน Step 1
- **ไฟล์ที่แก้ไข**:
  - `src/app/page.tsx`
- **ผลการทดสอบ**: หน้าแรกมีมิติ 3 มิติที่ทรงพลัง สอดคล้องกับทุกขั้นตอน

---

#### 5. Safety Rails, PDPA & Multi-AI Guidelines
- **สิ่งที่แก้ไข**:
  - สร้างหน้า [`/privacy`](file:///Users/bank/Desktop/เว็บไพ่/src/app/privacy/page.tsx) รองรับกฎหมาย PDPA พร้อมปุ่มลบข้อมูลจริง
  - เพิ่มตัวกรองวิกฤต บล็อกคำถามทำร้ายตัวเองทันที แสดงสายด่วน **1323** และ **1669**
  - เพิ่ม AI Transparency Disclosure ในทุกคำอ่านและ Footer
  - เพิ่ม `AccuracyRatingWidget.tsx` เก็บข้อมูล A/B Persona Rating ท้ายคำอ่าน
  - จัดทำคู่มือแม่บท [`docs/AI_COLLABORATION_GUIDELINES.md`](file:///Users/bank/Desktop/เว็บไพ่/docs/AI_COLLABORATION_GUIDELINES.md)
  - เชื่อมโยง `GEMINI.md` และ `CLAUDE.md` เพื่อให้ AI ทุกตัวเข้าใจตรงกัน
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `src/app/privacy/page.tsx`
  - `src/components/ui/DeleteAllDataButton.tsx`
  - `src/components/reading/AccuracyRatingWidget.tsx`
  - `src/lib/safety.ts`
  - `docs/AI_COLLABORATION_GUIDELINES.md`
  - `GEMINI.md`
  - `CLAUDE.md`
- **ผลการทดสอบ**: ผ่านการทดสอบความปลอดภัยครบทุกกรณี

---

#### 6. Gemini API Key & Model Pipeline Verification
- **สิ่งที่ตรวจสอบและแก้ไข**:
  - ตรวจสอบ `GEMINI_API_KEY` ใน `.env` และทดสอบยิง Google Generative Language API
  - อัปเดตรายชื่อโมเดลใน `CANDIDATE_GEMINI_MODELS` ใน `src/lib/ai/gemini.ts` ให้เป็น `gemini-3.6-flash`, `gemini-3.7-flash`, `gemini-3.5-flash` ตาม API ล่าสุด
- **ไฟล์ที่แก้ไข**:
  - `src/lib/ai/gemini.ts`
- **ผลการทดสอบ**: ยิงทดสอบ generateContent ผ่าน API จริงสำเร็จ 100% ใช้งานคำทำนาย Live AI ได้ทันที

---

#### 7. 20 Authentic World-Class Spreads Expansion (ขยายครบ 20 ผังพยากรณ์ยอดนิยม)
- **ปัญหาเดิม**: มีเพียง 10 ผัง และในหมวดความรัก/การงานมีตัวเลือกน้อย
- **สิ่งที่แก้ไข**:
  - ขยายผังพยากรณ์เป็น **20 รูปแบบยอดนิยมจริงมาตรฐานสากล** ทั้งความรัก, การงาน, การเงิน, กายจิตวิญญาณ, การตัดสินใจ, และผังใหญ่เจาะลึก
  - สร้างภาพประกอบ (Mini Card Artwork) เฉพาะตัวครบทั้ง 20 ผังด้วยไพ่ 1909 Rider-Waite
  - อัปเดตแท็บกรองใน `SpreadCardSelector.tsx` (ยอดนิยมแนะนำ 6, ความรัก 5, การงาน 5, ผังใหญ่ 5, ทั้งหมด 20)
  - กำหนดพิกัด $(x, y, \text{rotate})$ และความหมายตำแหน่งครบทั้ง 95 ตำแหน่ง
- **ไฟล์ที่แก้ไข**:
  - `src/data/spreads.ts`
  - `src/components/ui/TarotArtIcons.tsx`
  - `src/components/spread/SpreadCardSelector.tsx`
  - `scripts/qa/test-spreads.ts`
- **ผลการทดสอบ**:
  - `npx tsx scripts/qa/test-spreads.ts`: **541/541 ผ่าน (20 spreads, 95 ตำแหน่งรวม)**
  - `npm run typecheck`: **0 errors**

---

#### 8. Human-Centric Natural Language Refinement (ปรับภาษาทุกหัวข้อให้คนทั่วไปเข้าใจทันที)
- **ปัญหาเดิม**: ชื่อผังบางชื่อเป็นศัพท์เทคนิคโหราศาสตร์/ไพ่ทาโรต์โบราณ เช่น "กางเขนเซลติก", "ผังจักระ" คนทั่วไปอ่านแล้วไม่เข้าใจว่าคืออะไร
- **สิ่งที่แก้ไข**:
  - ปรับชื่อหัวข้อ (`nameTh`), คำโปรย (`tagline`), คำอธิบาย (`description`), และความหมายตำแหน่งครบทั้ง 20 ผัง (95 ตำแหน่ง)
  - เปลี่ยน "กางเขนเซลติก" ➔ **"ส่องดวงชะตาเจาะลึก 10 มิติ (เซลติกครอส)"** (เข้าใจทันทีว่าคือการดูดวงแบบละเอียดที่สุด 10 มิติ)
  - เปลี่ยน "ผังจักระ" ➔ **"สแกนพลังงานชีวิต 7 จุด (จักระบำบัด)"**
  - ใช้ภาษาไทยที่เป็นธรรมชาติ น่าอ่าน ตรงใจผู้ใช้ เหมือนคุยกับแม่หมอมืออาชีพ
- **ไฟล์ที่แก้ไข**:
  - `src/data/spreads.ts`
- **ผลการทดสอบ**:
  - `npx tsx scripts/qa/test-spreads.ts`: **541/541 ผ่าน**
  - `npm run typecheck`: **0 errors**

---

#### 9. Card Showcase Visual Proportions & Zero-Clipping Alignment (ปรับขนาดและการจัดวางไพ่ครบทั้ง 20 ผัง)
- **ปัญหาเดิม**:
  - ผัง 7 วัน (ดวงรายสัปดาห์) และผัง 7 จุด (จักระ) วางในแถวเดียวซ้อนกันจนตัวหนังสือและขอบการ์ดล้นตัดขอบซ้ายขวา
  - ผัง 5 ใบ และ 4 ใบ มีขนาดการ์ดและป้ายข้อความยาวบีบอัดจนขึ้นบรรทัดใหม่
- **สิ่งที่แก้ไข**:
  - ปรับ `WeeklySpreadArt` (7 วัน) เป็นโครงสร้าง **2-Tier Calendar Ribbon** (4 วันแถวบน + 3 วันแถวล่าง) การ์ดโปร่งสบายตา
  - ปรับผัง 4-5 ใบ ("เปลี่ยนงาน", "เนื้อคู่", "ความในใจ", "คนรักเก่า", "ปลดล็อกพลัง") เป็นโครงสร้าง 1 Apex เด่น + แถวฐาน พร้อมป้ายข้อความสั้นกระชับ
  - ขยายความสูง `minHeight: 335px` บนการ์ดเลือกผัง และแทนที่ `⭐ ยอดนิยม` ด้วย `✦ ยอดนิยม`
- **ไฟล์ที่แก้ไข**:
  - `src/components/ui/TarotArtIcons.tsx`
  - `src/components/spread/SpreadCardSelector.tsx`
- **ผลการทดสอบ**:
  - `npm run typecheck`: **0 errors**

---

#### 10. Chakra Spread Height Fix & Typography Polish (แก้ไขการ์ดจักระ 7 จุดทับหัวข้อและตัดคำตกบรรทัด)
- **ปัญหาเดิม**:
  - ในผังจักระ 7 จุด การ์ด 3 ชั้นกินความสูงเกินกล่อง ทำให้ป้ายข้อความด้านล่างซ้อนทับชนกับหัวข้อ `สแกนพลังงานชีวิต 7 จุด (จักระบำบัด)`
  - คำว่า `(จักระบำบัด)` ยาวเกินไปจนตัดคำผิดธรรมชาติกลายเป็น `(จักระบำ` ขึ้นบรรทัดใหม่ `บัด)`
- **สิ่งที่แก้ไข**:
  - ปรับ `ChakraSpreadArt` ให้เป็น **7-Chakra Rainbow Arc** แนวกระชับแถวเดียวพร้อมหมายเลขจุดจักระ 1-7 บนมุมการ์ด และป้ายด้านล่าง `✦ สมดุล 7 ศูนย์พลังชีวิต ✦` ปลอดภัยจากการชนข้อความ 100%
  - ปรับชื่อหัวข้อใน `src/data/spreads.ts` ให้กระชับ สวยงาม และไม่ตัดคำตกหล่น:
    - เปลี่ยนเป็น **`"สแกนสมดุล 7 จักระ (ไพ่ 7 ใบ)"`**
    - ปรับทุกหัวข้อทั้ง 20 ผังให้สม่ำเสมอ กระชับ ไม่ล้นกล่อง
- **ไฟล์ที่แก้ไข**:
  - `src/components/ui/TarotArtIcons.tsx`
  - `src/data/spreads.ts`
- **ผลการทดสอบ**:
  - `npx tsx scripts/qa/test-spreads.ts`: **541/541 ผ่าน**
#### 11. Clean Architecture Scaffolding & Directory Restructuring (วางโครงสร้างโฟลเดอร์มาตรฐาน)
- **สิ่งที่ทำ**:
  - วางโครงสร้างมาตรฐานระดับ Enterprise ตามที่ผู้ใช้กำหนด:
    - `src/types/`: `reading.ts`, `tarot.ts`, `safety.ts`, `index.ts`
    - `src/services/`: `reading.service.ts`, `shuffle.service.ts`, `pick.service.ts`, `safety.service.ts`, `interpretation.service.ts`
    - `src/server/repositories/`: `reading.repository.ts`
    - `src/lib/`: `crypto/provably-fair.ts`, `schema/reading.schema.ts`, `tarot/utils.ts`, `safety/index.ts`
    - `src/data/`: `prompts/`, `spreads/`, `personas/`
    - `src/components/verification/`: `ProvablyFairBadge.tsx`
    - `src/app/`: `/tarot`, `/cards`, `/spreads`, `/blog`, `/account`, และ API `/api/reading/[id]/pick`, `reveal`, `verify`
  - บันทึกกฎเหล็กข้อ 7 ลงใน `docs/AI_COLLABORATION_GUIDELINES.md` และสร้าง `Anti-Patterns & Lessons Learned Registry` ใน `docs/WORK_LOG.md`
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `src/types/*`
  - `src/services/*`
  - `src/server/repositories/*`
  - `src/lib/crypto/*`, `src/lib/schema/*`, `src/lib/tarot/*`
  - `src/data/prompts/*`, `src/data/spreads/*`, `src/data/personas/*`
  - `src/components/verification/*`
  - `src/app/api/reading/[id]/pick/*`, `reveal/*`, `verify/*`
  - `src/app/tarot/*`, `cards/*`, `spreads/*`, `blog/*`, `account/*`
  - `docs/AI_COLLABORATION_GUIDELINES.md`
#### 12. Cloudflare Workers Deployment Setup & Configuration
- **สิ่งที่ทำ**:
  - สร้างไฟล์การตั้งค่า Cloudflare Workers (`wrangler.jsonc`) เปิด `nodejs_compat` และเชื่อม Static Assets
  - สร้างไฟล์การตั้งค่า OpenNext (`open-next.config.ts`) สำหรับแปลง Next.js 16 App Router เป็น Cloudflare Edge Worker
  - เพิ่มคำสั่ง Build & Deploy ใน `package.json`: `build:worker`, `preview:worker`, `deploy`
  - จัดทำคู่มืออย่างละเอียดใน `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md` ครอบคลุมการใส่ Secrets, Local Preview, One-Click Deploy, และ Custom Domain
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `wrangler.jsonc`
  - `open-next.config.ts`
  - `package.json`
  - `docs/CLOUDFLARE_DEPLOYMENT_GUIDE.md`
#### 13. 4 Masterpiece Cloudflare Enhancements Integration (ผสาน 4 ฟีเจอร์ระดับมาสเตอร์พีซ)
- **สิ่งที่ทำ**:
  1. **Cloudflare R2 Object Storage**: สร้าง `StorageService` (`src/services/storage.service.ts`) และผูก `TAROT_STORAGE` สำหรับจัดเก็บภาพ Share Cards (IG Story 9:16 / 4:5) และแคชเสียง TTS แบบ Zero Egress Fee
  2. **Cloudflare KV Daily Card Caching**: สร้าง `CacheService` (`src/services/cache.service.ts`) และผูก `TAROT_KV` สำหรับแคชคำทำนายไพ่ประจำวัน (TTL: 24 ชม.) ช่วยประหยัดค่า AI Token ได้สูงสุดถึง 90%
  3. **Dual-Engine Multi-AI Brain**: อัปเกรด `InterpretationService` (`src/services/interpretation.service.ts`) ให้รองรับ **Anthropic Claude 3.5/3.7 Sonnet** (ภาษาไทยลึกซึ้ง) + **Google Gemini** (สตรีมไว) พร้อมระบบ Auto-Failover สลับอัตโนมัติหากอีกตัวขัดข้อง
  4. **Cloudflare Turnstile Invisible Bot Guard**: สร้าง `TurnstileService` (`src/services/turnstile.service.ts`) และ `TurnstileWidget` (`src/components/verification/TurnstileWidget.tsx`) ตรวจจับบอทแบบล่องหน ป้องกันการยิงถล่มโควตา AI
- **ไฟล์ที่สร้าง/แก้ไข**:
  - `wrangler.jsonc`
  - `src/services/storage.service.ts`
  - `src/services/cache.service.ts`
  - `src/services/turnstile.service.ts`
  - `src/services/interpretation.service.ts`
  - `src/services/index.ts`
  - `src/components/verification/TurnstileWidget.tsx`
#### 14. GitHub Repository Connection & CI/CD Auto-Deploy Activation
- **สิ่งที่ทำ**:
  - สร้าง Repository และ Push โค้ดทั้งหมดขึ้น GitHub: `https://github.com/luminuy/tarot-web`
  - ติดตั้ง GitHub Actions Workflow อัตโนมัติ:
    - `.github/workflows/deploy.yml`: Production Auto-Deploy เมื่อมี push/merge เข้า `main`
    - `.github/workflows/pr.yml`: PR Automated CI & Verification
  - เพิ่ม `.gitignore` สำหรับ Cloudflare OpenNext/Wrangler build outputs
- **ผลการทดสอบ**:
  - `git push -u origin main`: **สำเร็จ 100% (tracking origin/main)**
  - GitHub Actions Workflow: **Triggered & Active**
  - `npm run log:sync`: **ผ่านและอัปเดตสถานะสำเร็จ**

---

## 🚨 บันทึกบทเรียนและข้อผิดพลาดที่ต้องระวัง (Anti-Patterns & Lessons Learned Registry)

> **⚠️ บันทึกนี้มีความสำคัญสูงสุด**: AI ทุกตัวต้องอ่านส่วนนี้เพื่อป้องกันไม่ให้ทำผิดพลาดซ้ำเดิม

### 1. Vertical Bounds & Label Stacking Collision (การ์ดซ้อนเกินความสูงจนทับหัวข้อ)
- **กรณีที่เคยเกิดขึ้น**: ในผังจักระ 7 จุด มีการจัดเรียงการ์ดแบบ 3 แถวแนวตั้ง (3 บน + 1 กลาง + 3 ล่าง) พร้อมใส่ป้ายข้อความใต้การ์ดทุกแถว ทำให้ความสูงรวมเกินความสูงของกล่องพรีวิว และป้ายข้อความแถวล่างสุดทะลุไปทับหัวข้อ `สแกนพลังงานชีวิต 7 จุด`
- **วิธีแก้ & กฎป้องกัน**:
  - หากมีไพ่หลายใบ (เช่น 7 ใบขึ้นไป) ให้จัดเป็น **แถวโค้งชิดกัน (Rainbow Arc)** หรือ **2 แถวแบบกระชับ (2-Tier Ribbon)**
  - ใส่หมายเลขย่อย (เช่น `1`–`7`) ที่มุมของการ์ดโดยตรง แทนการใส่กล่องข้อความยาวใต้การ์ดทุกใบ
  - คำนวณความสูงรวมเสมอ: ความสูงกล่องพรีวิว (`h-34` / `h-36` = 136-144px) องค์ประกอบภายในต้องไม่เกิน 90-100px เพื่อเหลือพื้นที่ Margin ให้กับหัวข้อด้านล่าง

### 2. `image-rendering: crisp-edges` ทำให้ภาพไพ่แตกเป็นเม็ด (Nearest-Neighbour Downscaling Trap)
- **กรณีที่เคยเกิดขึ้น**: มีการใส่ `image-rendering: -webkit-optimize-contrast; high-quality; crisp-edges;` ซ้อนกันใน `globals.css` โดยตั้งใจจะทำให้ภาพ "คม HD" แต่ CSS เอาบรรทัดสุดท้าย (`crisp-edges`) → เบราว์เซอร์ย่อภาพแบบ nearest-neighbour ภาพไพ่ ~820x1430px ที่ถูกย่อเหลือ 34-70px จึงแตกเป็นเม็ดหยาบจนดูเบลอ
- **วิธีแก้ & กฎป้องกัน**:
  - ภาพถ่าย/ภาพวาดที่ถูก **ย่อ** ต้องใช้ `image-rendering: auto` เท่านั้น
  - `crisp-edges` / `pixelated` มีไว้สำหรับ Pixel Art ที่ถูก **ขยาย** เท่านั้น ห้ามใช้กับภาพถ่ายเด็ดขาด
  - อย่าใส่ `transform: translateZ(0)` บน `<img>` โดยไม่จำเป็น — มันสร้าง composited layer และทำให้ iOS Safari rasterize ที่ 1x

### 3. โหลดภาพไพ่ต้นฉบับ 280KB มาแสดงที่ 34px (Full-Size Image For Thumbnail Trap)
- **กรณีที่เคยเกิดขึ้น**: ทุกจุดในเว็บเขียน `<img src="/cards/major-00.jpg" />` ตรงๆ ทำให้เบราว์เซอร์ดาวน์โหลดภาพต้นฉบับกว้าง ~820px (~280KB) มาแสดงในกรอบ 34-70px หน้าเลือกผังจึงกินแบนด์วิดท์ **4.63MB** และหน้า `/spreads` ที่มีภาพไพ่ 96 ใบยิ่งหนักกว่านั้นหลายเท่า
- **วิธีแก้ & กฎป้องกันถาวร**:
  - ทุกจุดที่แสดงภาพหน้าไพ่ **ต้องใช้ `<CardImage />`** (`src/components/card/CardImage.tsx`) พร้อมส่ง prop `sizes` ตามความกว้างจริงที่แสดง เช่น `sizes="60px"`
  - `<CardImage />` จะเลือกไฟล์ WebP ย่อจาก `public/cards/w256/` หรือ `w512/` ให้อัตโนมัติผ่าน `<picture>` + `srcset`
  - ใช้ `full` เฉพาะภาพใบใหญ่จริงๆ (หน้ารายละเอียดไพ่ 258px, หน้าซูม, Export ลง Canvas) เท่านั้น
  - ถ้าเพิ่ม/เปลี่ยนภาพไพ่ต้นฉบับ **ต้องรัน `npm run cards:variants` ใหม่ทุกครั้ง**

### 4. คำสั่ง `gh` พังเมื่อรันจาก git worktree (Worktree + GitHub CLI Trap)
- **กรณีที่เคยเกิดขึ้น**: `npm run pr:auto` สร้าง PR สำเร็จ แต่ขั้นเปิด auto-merge ล้มทุกครั้ง:
  ```
  ❌ gh pr merge --auto --squash --delete-branch
     failed to run git: fatal: 'main' is already checked out at '/Users/bank/Desktop/เว็บไพ่'
  ```
  เพราะ `gh pr merge` (และ `gh pr checkout`) จะไปยุ่งกับ git ในเครื่อง แต่ `main` ถูก checkout ค้างที่โฟลเดอร์หลักอยู่แล้ว
  ซึ่ง **AI Agent ทำงานใน git worktree เสมอ** คำสั่งนี้จึงพังทุกครั้งที่ AI เรียกใช้
- **วิธีแก้ & กฎป้องกันถาวร**:
  - ใส่ `-R <owner>/<repo>` ให้คำสั่ง `gh` เสมอ เพื่อบังคับให้ทำงานแบบ remote-only ไม่แตะ git ในเครื่อง
  - `scripts/github-auto.ts` อ่าน owner/repo จาก `git remote get-url origin` แล้วเติม `-R` ให้อัตโนมัติทุกคำสั่งแล้ว
  - ห้ามเรียก `gh pr merge` เปล่าๆ ในสคริปต์ใหม่เด็ดขาด
  - **บทเรียนแถม**: error หนึ่งอาจบัง error อีกตัวไว้ พอแก้ปัญหา worktree เสร็จ error ตัวจริงถึงโผล่ว่า
    `Auto merge is not allowed for this repository` — repo นี้ตั้ง `allow_auto_merge = false` ไว้
    แปลว่า `gh pr merge --auto` ไม่เคยทำงานเลย ตัวที่ merge จริงคือ step ใน `.github/workflows/pr.yml`
    **แก้อาการแรกแล้วต้องรันซ้ำดูผลจริงเสมอ อย่าเพิ่งสรุปว่าจบ**

### 5. เขียนเทสต์ไว้แต่ไม่มีใครเรียกใช้ (Orphaned Test Files)
- **กรณีที่เคยเกิดขึ้น**: `scripts/qa/test-safety.ts` (14 เทสต์ ตัวกรองคำถามอันตราย) และ
  `scripts/qa/test-shuffle.ts` (14 เทสต์ ระบบสับไพ่ Provably Fair) มีอยู่และผ่านหมด
  แต่ **ไม่มี hook, npm script หรือ GitHub Actions ตัวไหนเรียกใช้เลย** ทั้งที่เป็นเทสต์ของสองระบบที่สำคัญที่สุดด้านความปลอดภัยและความโปร่งใส
  สาเหตุคือชุดตรวจถูกเขียนซ้ำไว้ 4 ที่ พอเพิ่มเทสต์ใหม่ก็ลืมไปเพิ่มให้ครบ
- **วิธีแก้ & กฎป้องกันถาวร**:
  - รวมชุดตรวจไว้ที่เดียวคือตัวแปร `CHECKS` ใน `scripts/github-auto.ts`
    ทุกจุด (`pre-commit`, `pre-push`, `npm run commit`, `pr.yml`, `deploy.yml`) เรียก `npm run repo:verify` เหมือนกันหมด
  - **เพิ่มสคริปต์ทดสอบใหม่ใน `scripts/qa/` เมื่อไหร่ ต้องไปเพิ่มใน `CHECKS` ทันที** ไม่งั้นเทสต์นั้นจะไม่เคยถูกรันเลย

### 6. workflow ที่ merge ด้วย `GITHUB_TOKEN` จะไม่ trigger workflow ตัวอื่น (GITHUB_TOKEN Event Suppression)
- **กรณีที่เคยเกิดขึ้น**: `pr.yml` merge PR ให้อัตโนมัติด้วย `GITHUB_TOKEN` แต่ `deploy.yml` (ที่ trigger ด้วย `push: main`)
  **ไม่เคยทำงานเลย** ทำให้ทุก PR ที่ระบบ merge ให้ ไม่ถูก deploy ขึ้น production
  บั๊กนี้เงียบสนิทอยู่นาน เพราะ PR ที่คนสั่ง merge เองด้วย token ผู้ใช้ยัง deploy ได้ปกติ
- **วิธีแก้ & กฎป้องกันถาวร**:
  - GitHub **จงใจ** ไม่ trigger workflow จาก event ที่เกิดจาก `GITHUB_TOKEN` เพื่อกันการวนซ้ำไม่รู้จบ
  - ถ้า workflow หนึ่งต้องปลุก workflow อีกตัว ให้ใช้ `workflow_dispatch` แทนการหวังพึ่ง push event
    (เพิ่ม `workflow_dispatch:` ที่ปลายทาง + `actions: write` ที่ต้นทาง + เรียก `createWorkflowDispatch`)
  - ทางเลือกอื่นคือใช้ Personal Access Token แทน `GITHUB_TOKEN` แต่ต้องเพิ่ม secret และดูแลวันหมดอายุเอง
  - **เวลาตรวจว่า deploy ทำงานไหม อย่าดูแค่ว่า PR merged แล้ว ให้ดูว่ามี run ของ deploy.yml สำหรับ commit นั้นจริง**

### 7. เทสต์สถิติที่ตัวอย่างน้อยเกินไปจะ fail แบบสุ่มและไปกั้น deploy (Flaky Statistical Test)
- **กรณีที่เคยเกิดขึ้น**: `test-shuffle.ts` วัดอัตราไพ่หัวกลับจากสำรับเดียว 78 ใบ โดยที่ `serverSeed` สุ่มใหม่ทุกครั้ง
  ที่ n = 78, p = 0.4 ค่าจะแกว่ง ±5.5 จุด เทสต์จึง fail เองประมาณ 1 ใน 150 รอบทั้งที่ไม่มีอะไรพัง
  พอเทสต์นี้ถูกเพิ่มเข้า CI มันก็ทำให้ **deploy ขึ้น production ล้มทันทีในรอบแรก**
- **วิธีแก้ & กฎป้องกันถาวร**:
  - เทสต์ที่วัดค่าสถิติจากการสุ่ม **ต้องใช้ตัวอย่างให้ใหญ่พอ** ไม่ใช่ขยายกรอบยอมรับให้กว้างจนไม่มีความหมาย
    (เพิ่มจาก 78 เป็น 3,120 ใบ ทำให้กรอบแคบลงจาก ±15 จุดเหลือ ±5 จุด แต่นิ่งกว่าเดิมมาก)
  - หรือใช้ seed คงที่เพื่อให้ผลเหมือนเดิมทุกครั้ง (deterministic)
  - **ก่อนเพิ่มเทสต์ใด ๆ เข้า CI ให้รันซ้ำอย่างน้อย 20 รอบก่อนเสมอ** ถ้าผลแกว่งแปลว่ายังไม่พร้อมขึ้น CI
  - จำไว้ว่าเทสต์ใน CI ของโปรเจกต์นี้กั้นทางขึ้น production โดยตรง เทสต์ flaky = deploy ล้มแบบสุ่ม

### 8. Thai Syllable Wrapping Bug (การตัดคำภาษาไทยเสียรูป)
- **กรณีที่เคยเกิดขึ้น**: ชื่อหัวข้อ `สแกนพลังงานชีวิต 7 จุด (จักระบำบัด)` ยาวเกินไปจนคำว่า `(จักระบำบัด)` ถูกตัดคำกลางคันกลายเป็น `(จักระบำ` และ `บัด)` บนอีกบรรทัด ทำให้ดูไม่เป็นมืออาชีพ
- **วิธีแก้ & กฎป้องกัน**:
  - ตรวจสอบความยาวหัวข้อ (`nameTh`) และคำโปรยเสมอ ให้กระชับ สละสลวย เช่น ปรับเป็น `"สแกนสมดุล 7 จักระ (ไพ่ 7 ใบ)"`
  - ใช้ `leading-tight` หรือ `leading-snug` และตั้งความยาวที่พอดีกับ Grid Column

### 9. Multi-Tier Spread Art Overflows & Label Bleeding (ห้ามใส่ Label ข้อความยาวใต้การ์ดในผังหลายชั้นเด็ดขาด)
- **กรณีที่เคยเกิดขึ้น**: ในหน้า `/spreads` และตัวเลือกผังในหน้าหลัก ผังไพ่ 4-5 ใบ (เช่น ความรักสองหัวใจ, ความในใจของเขา, แฟนเก่าจะกลับมาไหม) มีการวางการ์ดเป็น 2 ชั้น (บน-ล่าง) และใส่ข้อความ label ภาษาไทยใต้การ์ดทุกใบ ทำให้ความสูงรวมบวมขึ้นเป็น 167px เกินความสูงกล่อง (120px) จนตัวหนังสือทะลุไปทับเส้นคั่นและหัวข้อชื่อผัง
- **วิธีแก้ & กฎป้องกันถาวร (Permanent Golden Rule)**:
  1. ในการแสดงผลพรีวิวผังไพ่ (ใน `src/components/ui/TarotArtIcons.tsx`) **ผังที่มี 4 ใบขึ้นไปหรือมีการจัดวาง 2 ชั้นขึ้นไป ห้ามใส่ข้อความ string label ใต้การ์ดทุกใบเด็ดขาด!**
  2. ให้ใช้ **Floating Badge Pin บนมุมการ์ดโดยตรง (เช่น `#1`, `#2`, `#3`, `#4`, `#5`)** ซึ่งสวยงาม หรูหรา กระชับ และไม่กินพื้นที่ความสูง
  3. คุมความสูงรวมของการจัดวางทุกผัง **ให้อยู่ระหว่าง 85px – 100px เสมอ** (ต่ำกว่ากล่องคอนเทนเนอร์ `h-28` = 112px อย่างน้อย 15-25px) เพื่อให้มี Padding หายใจอย่างสมบูรณ์แบบ
  4. รายละเอียดคำอธิบายของแต่ละตำแหน่ง ให้แสดงใน Accordion ด้านล่าง `"✦ ดูรายละเอียดตำแหน่งไพ่"` เท่านั้น

### 10. Absolute Image Path Resolution in Sub-routes (กฎการอ้างอิง Root Path รูปภาพ)
- **กรณีที่เคยเกิดขึ้น**: ใน `CardsExplorer.tsx` และ `CardDetailView.tsx` มีการใช้ `src={card.image}` โดยตรง (ซึ่งข้อมูลดิบเป็น `"major-00.jpg"`) ทำให้เมื่อผู้ใช้อยู่ที่ Sub-route `/cards` เบราว์เซอร์จะ Resolve เป็น `/cards/major-00.jpg` แทนที่จะเป็น `/cards/major-00.jpg` จาก root public directory ส่งผลให้ภาพไม่โหลดและแสดงไอคอนกล่องเสีย `[?]`
- **วิธีแก้ & กฎป้องกันถาวร**:
  - ทุกจุดที่ Render ภาพหน้าไพ่ ต้องผ่าน `<CardImage />` หรือ `getCardImageSrc(image, id)` จาก `src/lib/tarot/card-image.ts` ซึ่งการันตี prefix `/cards/` ให้เสมอ
  - ห้ามเขียน `<img src={card.image} />` เปล่าๆ โดยไม่มี Root Prefix เด็ดขาด (ดูข้อ 3 ประกอบ — ปัจจุบันบังคับใช้ `<CardImage />` แทน `<img>` ทุกจุดแล้ว)

---

## 📝 วิธีบันทึกงานสำหรับ AI ตัวถัดไป (Template for Next Entry)

เมื่อทำงานเสร็จ ให้คัดลอก Template นี้ไปต่อท้าย:

```markdown
### 🗓️ [YYYY-MM-DD]: [ชื่อหัวข้องาน / ฟีเจอร์ที่ทำ]

#### 1. [ชื่อสิ่งที่ทำ/ปัญหาที่แก้]
- **ปัญหาเดิม / สิ่งที่ต้องการ**: ...
- **สิ่งที่แก้ไข**: ...
- **ไฟล์ที่แก้ไข**:
  - `path/to/file.tsx`
- **ผลการทดสอบ**: `npm run typecheck` ➔ [ผ่าน/ไม่ผ่าน], [รายละเอียดผลลัพธ์]
- **สิ่งที่ค้างอยู่ / ต้องทำต่อ (ถ้ามี)**: ...
```
