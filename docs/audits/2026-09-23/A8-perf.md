# A8 · ประสิทธิภาพเว็บ (perf) — 2026-09-23

วัดจาก `npm run build:astro` (334 หน้า) · ขนาด = gzip -9 · กราฟ import สแตติกจาก `dist/_astro`

ตัวเลขฐาน JS ต่อหน้า (สแตติก, gzip): `/` 143.9 KB · `/blog` 131.2 · `/daily` 111.5 · `/pick-a-card` 100.9 · `/cards` 96.5 · `/cards/birth-card` 93.7 · `/account` 93.5 · `/reading/chat` 80.7 · บทความ 10.3 · `/spreads` 5.4

### 🔴 A8-01 · island หน้า `/blog` ลากบทความเต็มทั้ง 26 เรื่อง (ไทย+อังกฤษ) เข้าบันเดิล — 57.1 KB gzip
- ที่: `astro/islands/BlogIslands.tsx:2,15` → `src/app/_shared/pages/blog-index.tsx:3,147` → `src/data/articles.ts:7,1580` (`ARTICLES_EN` + `RAW_ARTICLES` ทั้งไฟล์)
- ปัญหา: `blogCardItems()` ตัดเหลือ 10 ฟิลด์ก็จริง แต่ตัดตอน "รันไทม์" — ตัว module `articles.ts` (1,639 บรรทัด + `articles-en.generated`) ถูกมัดทั้งก้อน ชังก์ `BlogIslands.aOBVg1bO.js` = 240 KB ดิบ / **57.1 KB gzip** มีอักษรไทย 46,648 ตัว และคีย์ `content:` 31 จุด `faq` 76 จุด (= เนื้อบทความจริง) ผิดกติกา island ข้อ 1 และขัดกับคอมเมนต์ในไฟล์ที่ว่า "เบาพอ"
- ผลกระทบ: `/blog` และ `/en/blog` โหลด JS 131.2 KB — หนักกว่า `/cards` (96.5) ทั้งที่เป็นแค่รายการการ์ด ชังก์ใหญ่อันดับ 2 ของทั้งเว็บ · บนมือถือ 3G ต้อง parse/compile 240 KB ก่อน hydrate ตัวกรองหมวด
- แนวแก้: สร้างรายการสรุปตอน build (สคริปต์ gen `articles-summary.generated.ts` มีแค่ 10 ฟิลด์) แล้วให้ island import ไฟล์นั้นแทน `@/data/articles` หรือส่ง `articles` เป็น prop (26×10 ฟิลด์ ≈ 3–5 KB gzip ใน HTML เฉพาะ 2 หน้า) · เพิ่มงบบันเดิลของ `BlogIslands` ในด่าน `test-bundle-budget.ts` ≤ 10 KB
  - หมายเหตุ: ด่าน `test-bundle-budget.ts:196` ตั้งเพดาน `/blog` ไว้ 158 KB จึงไม่ฟ้อง — ควรรัดลงหลังแก้

### 🟠 A8-02 · เส้นทางเปิดไพ่หลัก (หน้าแรก/แชท) ยังใช้ `@/data/cards` ตัวผสมอังกฤษ — ผู้ใช้ไทยโหลดคำทำนายอังกฤษเกิน 49.7 KB gzip
- ที่: `src/components/reading/StreamReader.tsx:10` · `src/components/reading/QuickChatResult.tsx:10` · `src/components/home/TarotFlow.tsx:989,1119` · `src/lib/reading/use-ai-reading.ts:300`
- ปัญหา: บ้านนี้มี `src/data/cards/deck-th.ts` + `en-enrich.ts` ไว้แล้ว (หัวไฟล์อธิบายว่ากันคำทำนายอังกฤษรั่ว) และ `RitualRoots` ใช้ถูกแล้ว แต่ 5 จุดข้างบนยัง import `@/data/cards` ซึ่งชังก์ `cards.De0C3MQV.js` import สแตติก `meanings-en` (**44.4 KB gzip**) + `keywords-en` (**5.3 KB**) ทุกครั้ง นอกเหนือจากสำรับไทย `wands.*.js` (83.0 KB)
- ผลกระทบ: ผู้ใช้ไทยที่เปิดไพ่บนหน้าแรก (`StreamReader` 29.5 KB โหลดคู่) ต้องดาวน์โหลดสำรับรวม ~133 KB gzip แทน ~83 KB — ช้าลงตรงจังหวะ "รอคำทำนาย" ที่ผู้ใช้เฝ้าจอ โดยเฉพาะ 4G อ่อน
- แนวแก้: เปลี่ยนเป็น `cardByIndex` จาก `deck-th` แล้ว `await` `en-enrich` เฉพาะ `locale === "en"` (แบบเดียวกับ `RitualRoots`) · เพิ่มด่านห้าม `src/components/**` import `@/data/cards` ตรง (ยกเว้นเซิร์ฟเวอร์/Astro page)

### 🟡 A8-03 · `/api/daily-card` แคชเบราว์เซอร์ตายตัว 1 ชม. + SWR 1 วัน — หลังเที่ยงคืนยังเห็น "ไพ่ประจำวัน" ของเมื่อวาน
- ที่: `src/app/api/daily-card/route.ts:22-24` (ผู้เรียก: `src/components/reading/DailyCardStrip.tsx:49` บนหน้าแรก)
- ปัญหา: `s-maxage` คำนวณถึงเที่ยงคืนไทยถูกแล้ว แต่ `max-age=3600` (เบราว์เซอร์) ไม่ได้ถูกจำกัดด้วย `secondsUntilMidnight` และทุก header มี `stale-while-revalidate=86400` ซึ่งอนุญาตให้เสิร์ฟของเก่าข้ามวันได้
- ผลกระทบ: เปิดหน้าแรก 23:30 → กลับมา 00:10 ได้ไพ่ของเมื่อวาน (อยู่ในแคชเบราว์เซอร์อีก 20 นาที) · หลังหมดอายุ SWR ยังส่งของเก่าให้อีกหนึ่งครั้งก่อนรีเฟรชเบื้องหลัง — ขัดกับคำว่า "ไพ่ประจำวัน"
- แนวแก้: `max-age=${Math.min(3600, secondsUntilMidnight)}` และ `stale-while-revalidate` ไม่เกินราว 60 วินาที (หรือตัดออก) ทั้ง 3 header · ทางเลือก: ใส่วันที่ไทยใน query (`?d=YYYY-MM-DD`) ให้ URL เปลี่ยนเองทุกวัน

### 🔴 A8-04 · `StreamReader` ลาก `zod` ทั้งตัว (~21 KB gzip) เข้าไคลเอนต์ เพียงเพื่ออ่านค่าคงที่ `YES_NO_DISPLAY_EN`
- ที่: `src/components/reading/StreamReader.tsx:7` → `src/lib/schema/reading.ts:1,14,59,73`
- ปัญหา: `StreamReader` import ค่า (ไม่ใช่ type) `YES_NO_DISPLAY_EN` จากไฟล์สคีมาที่ `import { z } from "zod"` และสร้าง `z.object(...)` ระดับโมดูล — rollup ตัดทิ้งไม่ได้เพราะมี side effect · ชังก์ `StreamReader.BQxTOZKZ.js` = 101.6 KB ดิบ / **29.5 KB gzip** ในนั้นเป็นโค้ด zod (ช่วงไบต์ 2,260–80,431 มีเครื่องหมาย `ZodError`/`_zod`/`processJSONSchema` 357 จุด ไม่มีอักษรไทยเลย) ≈ **78 KB ดิบ / ~21 KB gzip** · โค้ดคอมโพเนนต์จริงเหลือแค่ ~8.5 KB gzip
- ผลกระทบ: ทุกการเปิดไพ่บนหน้าแรก (TarotFlow → `StreamReader` lazy) ต้องโหลด+parse zod v4.5 (รวมตัวแปลง JSON Schema) ตรงจังหวะรอคำทำนาย — งานฝั่งเซิร์ฟเวอร์ล้วนแต่มาอยู่บนมือถือผู้ใช้
- แนวแก้: ย้าย `YES_NO_DISPLAY_EN` (และค่าคงที่ที่ UI ใช้) ไปไฟล์ไร้ zod เช่น `src/lib/schema/reading-display.ts` แล้วให้ `reading.ts` re-export · ใช้ `import type { Reading }` ที่เหลือ · เพิ่มด่าน: ห้าม chunk ใน `dist/_astro` มีสตริง `ZodError`

### 🟠 A8-05 · `/daily` · `/love/1-card` พรีโหลดสำรับไทยทั้ง 78 ใบ (83.0 KB gzip / 457 KB ดิบ) ตอน idle ทุกการเข้าชม เพื่อใช้ไพ่ใบเดียว
- ที่: `src/components/reading/one-card/OneCardRitual.tsx:101-113` (prefetch `getDeck()` ใน `requestIdleCallback`) · `:141` ใช้แค่ `DECK_TH[drawnIndex]`
- ปัญหา: ชังก์ `wands.CRFeiLZO.js` (สำรับไทยเต็ม) ถูกดึงทันทีที่หน้า idle ไม่ว่าผู้ใช้จะกดจั่วหรือไม่ — JS ที่หน้าโหลดจริงจึงเป็น 111.5 + 83.0 = **~194.5 KB gzip** · ผู้ใช้ที่มาจาก Google อ่านแล้วออก (ส่วนใหญ่ตามหัวไฟล์ `use-entitlement.ts`) จ่าย 83 KB ฟรี ๆ และมือถือต้อง parse 457 KB ในช่วง idle ต้น ๆ (ซ้อนกับ hydration ของ island `client:load`)
- ผลกระทบ: เปลืองดาต้า/แบตบนหน้าที่เข้าชมมากที่สุดหน้าหนึ่ง · TBT/INP ช่วงแรกแย่ลงบนเครื่องสเปกต่ำ
- แนวแก้: (ก) เลื่อน prefetch ไปตอน `pointerenter`/`focus` ของปุ่มจั่ว หรือหลัง `oracle.run` เริ่ม (ยิง API ขนานกับโหลดสำรับอยู่แล้ว) (ข) ระยะยาว: แยกไพ่รายใบเป็น chunk/JSON (`/card-data/<index>.json` ≈1–2 KB) — ไม่ขัดกฎข้อ 14 เพราะยังอ่านจากเลขที่เซิร์ฟเวอร์ส่งมา ไม่กุไพ่
- ข้อสังเกตร่วม (บั๊กเล็ก): `:143` `throw` ใน `void (async () => …)()` กลายเป็น unhandled rejection — `status` ค้างที่ "กำลังโหลด" ไม่ขึ้นข้อความ "โหลดใหม่อีกครั้ง" ตามกฎข้อ 14 · ควร `catch` แล้ว `setStatus("error")`

### 🟠 A8-06 · TarotFlow โหลดสำรับไพ่ "หลัง" ได้คำตอบ `/shuffle` แบบเรียงคิว — น้ำตก 3 ชั้น (start → shuffle → import 133 KB)
- ที่: `src/components/home/TarotFlow.tsx:966→989` (โหมดด่วน: `/start` → `/shuffle` → `await import("@/data/cards")`) · `:1095-1119` (โหมดเลือกเอง: `setTimeout 450ms` → `/shuffle` → `import`)
- ปัญหา: `import("@/data/cards")` (สำรับ 83.0 + คำทำนายอังกฤษ 44.4 + keywords 5.3 = **~133 KB gzip**, ดู A8-02) เริ่มก็ต่อเมื่อ `shuffleRes.json()` เสร็จแล้ว ทั้งที่ไม่ขึ้นกับผลลัพธ์เลย และไม่มีจุดไหน prefetch ไว้ก่อน (ค้น `preload|prefetch` ในไฟล์เจอแค่ AuthModal/Turnstile) · ในโหมดเลือกเอง ยังมีการรอเปล่า 450 ms ที่ใช้โหลดขนานได้
- ผลกระทบ: บน 4G (~1.5 Mbps จริง) 133 KB ≈ 0.7 วินาที + parse ต่อท้าย RTT ของ API — ผู้ใช้เห็นหน้าจอค้างหลังกดเลือกไพ่ครบ
- แนวแก้: เริ่ม `const deckP = import(...)` ก่อน `fetch` แล้ว `await Promise.all([shuffleRes, deckP])` · หรืออุ่นไว้ตอนเข้าขั้นเลือกไพ่/พิมพ์คำถาม · ทำคู่กับ A8-02 (เปลี่ยนเป็น `deck-th`) จะเหลือ ~83 KB และไม่อยู่บน critical path
PROGRESS: [x] dist/_astro (bundle graph) · astro/islands · src/components/reading · src/components/home

### 🟡 A8-07 · `/api/reading/[id]/read` (SSE คำทำนาย) อ่าน KV แบบเรียงคิวก่อนเริ่มสตรีม ทั้งที่เป็นการอ่านล้วนที่ขนานกันได้
- ที่: `src/app/api/reading/[id]/read/route.ts:106` (`consumeEdgeRateLimits`) → `:120` (`checkPerIpReadQuota` = `readCounter` อ่าน KV อย่างเดียว) → `:154` (`isEntitlementEnabled` = `kvGetJSON` + `getViewer`) → `:234` (`isAiCapReached`)
- ปัญหา: 4 round-trip ไป KV/D1 ต่อกันเป็นลำดับก่อนไบต์แรกของคำทำนาย · `checkPerIpReadQuota`, `isEntitlementEnabled`, `getViewer`, `isAiCapReached` ไม่มี side effect จึงยิงพร้อมกับ `consumeEdgeRateLimits` ได้ · และ `isAiCapReached` ถูกเช็กหลัง `consumeReading` (`:170`) ทำให้เวลาเพดานเต็มต้องเขียน consume แล้ว `refundIfConsumed()` (`:236`) เพิ่มอีก 2 write
- ผลกระทบ: TTFB ของสตรีม (จังหวะที่ผู้ใช้จ้องจอรอ) บวก ~2–3 RTT ของ KV (KV miss ข้าม region 30–100 ms ต่อครั้ง)
- แนวแก้: `const [edge, quota, enforced, viewer] = await Promise.all([...])` แล้วค่อยตัดสินตามลำดับเดิม (ลำดับการ "ตอบปฏิเสธ" ไม่เปลี่ยน) · ย้ายเช็ก `isAiCapReached(capTier)` ขึ้นไปก่อน `consumeReading` (capTier รู้แล้วหลังได้ `viewer`)

### 🟡 A8-08 · หน้าบทความ 60 หน้าที่ "ไม่มี island เลย" ยังโหลด React core 3.1 KB gzip เพราะตัวช่วย bundler ไปอยู่ใน chunk `react`
- ที่: `astro/scripts/article-share.ts:14` → `src/lib/utils/audio.ts` · ชังก์ `dist/_astro/audio.BG-uqKmu.js` ขึ้นต้นด้วย `import{r as e}from"./react.SIfiwpqq.js"`
- ปัญหา: `audio.ts` ไม่ได้ import React เลย แต่ rollup วางตัวช่วย interop/`__export` ไว้ในชังก์ `react.SIfiwpqq.js` (8.2 KB ดิบ มี `react.transitional.element`, `__CLIENT_INTERNALS`, `useState`) → สคริปต์ปุ่มแชร์บทความ (vanilla) ต้องโหลด React core ตามไปด้วย · วัดทั้ง dist: **60 หน้า**ที่ไม่มี `<astro-island>` แต่ closure มี React core
- ผลกระทบ: หน้าบทความ JS รวม 10.3 KB gzip — 3.1 KB (30%) เป็น React ที่ไม่ได้ใช้ · เสียเปล่าบนหน้าที่ทราฟฟิก SEO เข้าเยอะที่สุด
- แนวแก้: ใน `astro.config.mjs` → `vite.build.rollupOptions.output.manualChunks` แยก helper/runtime (`\0commonjsHelpers`, `rolldown:runtime`) เป็นชังก์ของตัวเอง หรือให้ `react`/`react-dom` เป็นชังก์ที่มีแต่ React · เพิ่มด่าน: หน้าที่ไม่มี island ห้ามมี React ใน closure
PROGRESS: [x] src/app/api (Cache-Control + sequential awaits) · public/_headers · public/sw.js · fonts/images
STATUS: DONE
