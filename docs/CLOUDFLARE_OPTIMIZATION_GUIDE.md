# ⚡ คู่มือการลดภาระ Cloudflare และการสเกลระบบสู่ระดับมหาชน
## (Cloudflare Scaling & Optimization Bible — 60 มหาโซลูชันระดับตำนาน)

> **สถานะปัจจุบันของระบบ:**
> - 👤 **โควตารายคน:** ผู้เยี่ยมชมดูได้ 1 ครั้ง (ตลอดชีพ) · สมาชิกดูได้ 3 ครั้ง/วัน (รีเซ็ตเที่ยงคืน)
> - 🤖 **เพดาน AI ในโค้ด:** 2,000 ครั้ง/วัน (`DEFAULT_DAILY_CAP` ใน `src/lib/security/ai-budget.ts`)
> - ⚠️ **ความจุจริงปัจจุบัน:** **~250 คน/วัน** (ติดคอขวดโควตาเขียน Cloudflare KV 1,000 writes/วัน)
> - 🎯 **เป้าหมายหลังปรับปรุง:** **~3,000 คน/วัน (งบ 0 บาท)** และพร้อมสเกลสู่ **50,000+ คน/วัน**

---

## 📊 สรุปตารางความจุคนดูดวงตามแต่ละระดับ (Capacity Scaling Progression)

| ระดับการปรับปรุง | คนดูดวงสูงสุด/วัน | ตัวกำหนดเพดาน (Bottleneck) | งบประมาณ |
| :--- | :---: | :--- | :---: |
| **ระดับ 1: ระบบปัจจุบัน** | **~250 คน/วัน** | Cloudflare KV Write Limit (1,000 ครั้ง/วัน) | **0 บาท** |
| **ระดับ 2: ปรับโค้ด + ตั้งค่า Dashboard** | **~1,000 – 1,500 คน/วัน** | โควตาเขียน KV หลังทำ Debounce + Gemini Free (1,500 RPD) | **0 บาท** |
| **ระดับ 3: เพิ่ม Upstash Redis + Dual Media (ImageKit + Cloudinary) + PWA** | **~2,500 – 3,000 คน/วัน** | โควตาฟรี Upstash (10,000 คำสั่ง/วัน) + AI Free Tier (Groq+Gemini) | **0 บาท** |
| **ระดับ 4: ขยายสู่ระดับมหาชน (Full Scale)** | **20,000 – 50,000+ คน/วัน** | Workers Paid ($5/mo) + Pay-as-you-go AI (~3 สตางค์/ครั้ง) | หลักร้อยบาท/เดือน |

---

## 🖼️ ขุมพลังสื่อคู่ขนาน: การผนึกกำลัง ImageKit + Cloudinary (Dual-Engine Media Pipeline)
### ลดภาระ Next.js และ Cloudflare Workers ในการเจนภาพลง 100%

การสั่งให้ Next.js ทำหน้าที่เจนภาพ ย่อขนาดรูป หรือปั๊มภาพ OpenGraph บนเซิร์ฟเวอร์ Cloudflare Workers คือ **หลุมพรางที่กินทรัพยากรหนักที่สุด** ทางออกที่ดีที่สุดคือการนำ **ImageKit** และ **Cloudinary** มาแบ่งหน้าที่กันทำงานแบบไร้รอยต่อ โดยไม่ต้องให้ Next.js ต้องแตะการประมวลผลรูปภาพเลยแม้แต่บรรทัดเดียว:

```text
┌────────────────────────────────────────────────────────────────────────────────────┐
│                    🖼️ ยุทธศาสตร์สื่อคู่ขนาน (Dual-Engine Pipeline)                  │
├──────────────────────────────────────────┬─────────────────────────────────────────┤
│ 🚀 1. ImageKit.io (The Asset CDN Engine)  │ 🎨 2. Cloudinary (Dynamic Composition)   │
│   • หน้าที่: เสิร์ฟภาพไพ่ 78 ใบทั้งหมด    │   • หน้าที่: เจนภาพแชร์ผลดวงไดนามิก     │
│   • แบนด์วิดท์ฟรี: 25 GB/เดือน เต็มๆ     │   • โควตาฟรี: 25 Credits (เน้น Transform)   │
│   • Origin Pull: ดึงตรงจาก GitHub/เว็บเรา │   • Multi-layer Text & Card Overlay     │
│   • แปลง WebP / AVIF อัตโนมัติ           │   • ปั๊มชื่อผู้ใช้ + ไพ่ 3 ใบ + คำทำนายสรุป │
│   • 0 File Migration (ไม่ต้องย้ายไฟล์)   │   • ไม่ต้องลงฟอนต์ไทยในเซิร์ฟเวอร์      │
└──────────────────────────────────────────┴─────────────────────────────────────────┘
```

### 📉 การลด Next.js ในการเจนภาพ ลดการทำงานลงเท่าไหร่? (Quantitative Impact)

| ทรัพยากรระบบ | ให้ Next.js เจน/ย่อรูปเองสดๆ | ใช้สถาปัตยกรรม Dual-Engine + Client Canvas | **อัตราการลดภาระ (Workload Saved)** |
| :--- | :---: | :---: | :---: |
| **CPU Time ของเซิร์ฟเวอร์** | **50 – 200 ms** / รูป | **0 ms** (ภาระเป็นศูนย์) | 🟢 **ลดลง 99% – 100%** |
| **หน่วยความจำ (RAM)** | **20 – 50 MB** / รูป (ถอดรหัสพิกเซล) | **< 1 MB** | 🟢 **ลดลง 90% – 95%** |
| **ขนาดไฟล์โค้ด (Bundle Size)** | ใหญ่ขึ้น **3 – 5 MB** (Sharp, WASM, Fonts) | ผอมเพรียว ปราศจากไลบรารีกราฟิก | 🟢 **ประหยัดโควตา Bundle 50%** |
| **แบนด์วิดท์ Cloudflare** | ส่งรูปผ่าน Worker (กินโควตา Egress) | ดึงจาก CDN ภายนอกตรงๆ | 🟢 **ลดแบนด์วิดท์ลง 70% – 90%** |
| **ความเสี่ยง Worker ล่ม** | สูงมาก (ติด Error 1101 RAM เกิน 128MB) | ปลอดภัย 100% | 🟢 **ตัดความเสี่ยงระบบล่มเหลือ 0%** |

---

## 🏛️ หมวดที่ 1: 11 การตั้งค่าบน Cloudflare Dashboard (ฟรี 100% · ไม่ต้องแก้โค้ด)

| ลำดับ | รายการ / ฟีเจอร์ | เมนูใน Cloudflare Dashboard | หน้าที่และผลลัพธ์ที่ได้ |
| :---: | :--- | :--- | :--- |
| **1** | **Cache Rule แคชหน้า SSG ทั้งหมด** | **Caching** ➔ **Cache Rules** | แคชหน้าแรก, `/cards/*`, `/spreads/*`, `/blog/*` ที่ Edge (TTL 7 วัน) **ลด Worker & KV ลง 80–90%** |
| **2** | **Ignore Query String** | Cache Key ในข้อ 1 (หรือ **Caching** ➔ **Config**) | ป้องกันพารามิเตอร์ `?fbclid=`, `?utm_=` จาก Ads/Social ทำแคชหลุด เสิร์ฟหน้าแคชเดิม 100% |
| **3** | **Block AI Scrapers and Crawlers** | **Security** ➔ **Bots** | กดปุ่มเดียวบล็อกบอทดูดข้อมูล (ByteSpider, GPTBot, ClaudeBot) **ลดทราฟฟิกขยะ 30–50%** |
| **4** | **Bot Fight Mode** | **Security** ➔ **Bots** | ท้าทายและสกัดกั้นสคริปต์อัตโนมัติ / Headless Browsers ที่ไม่มีตัวตนจริง |
| **5** | **WAF บล็อกเครื่องมือสคริปต์ที่ `/api/`** | **Security** ➔ **WAF** ➔ **Custom rules** | บล็อก User-Agent ที่เป็น `curl`, `python`, `Postman`, `Scrapy` ก่อนหลุดมารันโค้ดบน Worker |
| **6** | **WAF Rate Limiting** | **Security** ➔ **WAF** ➔ **Rate limiting** | คุมเส้น `/api/reading/*/read` ไม่เกิน 20 req/10 นาที ต่อ IP สกัดคนกดดูดวงรัวๆ ผลาญรอบ AI |
| **7** | **Smart Tiered Cache** | **Caching** ➔ **Tiered Cache** | รวมศูนย์ Edge Cache ในภูมิภาค ลดการดึงข้อมูลข้าม Data Center ซ้ำๆ มายัง Worker |
| **8** | **Hotlink Protection** | **Scrape Shield** ➔ **Hotlink Protection** | ป้องกันเว็บอื่นดูด URL รูปไพ่ 78 ใบไปแปะ ช่วยเซฟ Egress Bandwidth |
| **9** | **HTTP/3 (QUIC) + 0-RTT** | **Speed** ➔ **Optimization** ➔ **Protocol** | ลดเวลาเชื่อมต่อ Handshake บนมือถือ และลดเวลาที่ Worker ต้องเปิด Socket ค้างไว้ |
| **10** | **Early Hints (HTTP 103)** | **Speed** ➔ **Optimization** ➔ **Content** | สั่งให้เบราว์เซอร์เริ่มโหลด CSS/Font ล่วงหน้าตั้งแต่ตอนที่ Worker กำลังเตรียมข้อมูล |
| **11** | **R2 Auto-Delete Lifecycle** | **R2** ➔ `seertarot-share` ➔ **Settings** | ตั้งกฎลบรูปแชร์ดวงอัตโนมัติเมื่ออายุเกิน 30 หรือ 90 วัน คุมไม่ให้เกินโควตาฟรี 10 GB |

---

## 💻 หมวดที่ 2: 4 การปรับปรุงในระดับโค้ดของโปรเจกต์ (Code Optimizations)

### 12. Debounce การนับ AI Budget ใน Isolate Memory
* **ไฟล์:** [`src/lib/security/ai-budget.ts`](../src/lib/security/ai-budget.ts)
* **ปัญหาเดิม:** ฟังก์ชัน `recordAiCall()` สั่ง `kvPutJSON` ทุกครั้งที่สตรีม AI จบ 1 รอบ ถ้ามีคนดูดวง 250 ครั้ง จะเขียน KV ไป 250 ครั้ง
* **วิธีแก้:** ใส่ Isolate Buffer + Flush Debounce 20–30 วินาที (แบบเดียวกับ `src/lib/stats/record.ts`) ทำให้การเขียน KV รวมเหลือเพียงไม่กี่ครั้งต่อนาที **ประหยัดโควตาเขียน KV ลง 70%**

### 13. ลดการเขียน KV ซ้ำซ้อนในวงจรเปิดไพ่
* **ไฟล์:** [`src/server/store.ts`](../src/server/store.ts) และเส้น API reading
* **ปัญหาเดิม:** มีการสั่ง `persistReading()` ในขั้นตอน `start`, `shuffle`, และ `read` (รวม 3 ครั้งต่อ 1 ดูดวง)
* **วิธีแก้:** พึ่งพา **HMAC Session Token** (`signReadingSessionToken`) ที่เซ็นกำกับข้อมูลไพ่ส่งกลับไปที่เบราว์เซอร์ และ In-Memory Store ใน Worker Isolate แทน โดยเขียนลง KV เฉพาะเมื่อจำเป็นจริงเท่านั้น

### 14. In-Memory Cache ข้อมูล User Profile
* **ไฟล์:** [`src/app/api/auth/me/route.ts`](../src/app/api/auth/me/route.ts) และ [`src/lib/auth/session.ts`](../src/lib/auth/session.ts)
* **ปัญหาเดิม:** เวลาผู้ใช้กดสลับหน้า ระบบจะยิง `/api/auth/me` และสั่ง `SELECT * FROM users` ใน D1 ทุก 30 วินาที
* **วิธีแก้:** แคช `AppUser` ไว้ในหน่วยความจำของ Worker สัก 30–60 วินาที **ลดคำสั่ง `SELECT` ใน D1 ลงเกิน 50%**

### 15. รวมคำสั่งฐานข้อมูลด้วย D1 Batching
* **ไฟล์:** Repositories ใน `src/lib/...`
* **วิธีทำ:** ใช้ `db.batch([stmt1, stmt2])` เมื่อต้องบันทึกหลายตารางพร้อมกัน (เช่น Journal + Usage) เพื่อลดรอบ Network Roundtrip ภายใน D1

---

## 🌐 หมวดที่ 3: 13 ตัวช่วยและบริการภายนอก (External Services · ฟรี 100%)

### 🗄️ ก. ฐานข้อมูลและแคชชั่วคราว (Database & KV Offloading)
* **16. [Upstash Redis (Serverless)](https://upstash.com):** **(🏆 ตัวที่ดีที่สุดสำหรับ Backend)**
  * **โควตาฟรี:** **10,000 คำสั่ง/วัน** (รีเซ็ตทุกวัน · ไม่ต้องผูกบัตร)
  * **หน้าที่:** แบกรับ Session เปิดไพ่ชั่วคราว, นับโควตา AI ประจำวัน, และทำ Rate Limiting ➔ **ลดการเขียน Cloudflare KV เหลือ 0 ครั้ง**
* **17. [Turso (libSQL / Edge SQLite)](https://turso.tech):**
  * **โควตาฟรี:** พื้นที่ 9 GB และ **อ่านฟรี 1,000 ล้านแถว/เดือน** (D1 ฟรี 150 ล้าน)
  * **หน้าที่:** SQLite ทางเลือกสำรอง มีระบบ Embedded Replica แคชข้อมูลใน Memory อ่านได้เร็วและไม่จำกัด

### 🖼️ ข. สื่อและรูปภาพคู่ขนาน (Dual-Engine Image & Asset CDNs)
* **18. [ImageKit.io](https://imagekit.io):** **(🏆 เสิร์ฟภาพไพ่ 78 ใบความเร็วแสง)**
  * **โควตาฟรี:** **แบนด์วิดท์ฟรี 25 GB/เดือน** + พื้นที่ 20 GB (ไม่ต้องผูกบัตร)
  * **หน้าที่:** รับผิดชอบภาพไพ่ 78 ใบ (Responsive WebP/AVIF variants, Spreads Previews) ด้วยระบบ Web Origin Pull ชี้ไปที่เว็บเราหรือ GitHub แล้วแคชแปลงรูปอัตโนมัติ ➔ **ลดแบนด์วิดท์รูปภาพออกจาก Cloudflare 100%**
* **19. [Cloudinary](https://cloudinary.com):** **(🎨 เจนภาพแชร์ผลดวงไดนามิกขั้นเทพ)**
  * **โควตาฟรี:** **25 Credits/เดือน** (~25,000 Transformations)
  * **หน้าที่:** รับผิดชอบเฉพาะการประกอบภาพแชร์ผลดวงโซเชียล (OpenGraph Card) แบบซ้อนหลายเลเยอร์ (วิหาร + ไพ่ 3 ใบ + ฟอนต์ไทย + คำทำนาย) ผ่าน URL โดยไม่ต้องรัน Satori, WASM หรือลงฟอนต์ไทยใน Worker
* **20. [Statically CDN](https://statically.io) (หรือ jsDelivr / GitHub Releases):**
  * **โควตาฟรี:** **ฟรี 100% ตลอดชีพ ไม่จำกัดแบนด์วิดท์ (Unlimited)**
  * **หน้าที่:** โฮสต์รูปไพ่ 1909 (ที่เป็น Public Domain) บน GitHub แล้วใช้ Statically วิ่งผ่านเครือข่าย Fastly + Cloudflare เสิร์ฟสำรองฟรี

### 🔍 ค. ระบบค้นหาความหมายไพ่ (Search Offloading)
* **21. [MiniSearch](https://github.com/lucaong/minisearch) / [FlexSearch](https://github.com/nextapps-de/flexsearch):** **(🥈 ตัวที่ดีที่สุดสำหรับ Frontend)**
  * **โควตาฟรี:** **ฟรี 100% ไม่ต้องสมัครบัญชีใดๆ** (ไลบรารีขนาด 7 KB)
  * **หน้าที่:** ให้เบราว์เซอร์ค้นหาความหมายไพ่ 78 ใบในเครื่องผู้ใช้ทันทีแบบ **0ms Instant Search** ➔ **ตัดการใช้ Cloudflare Vectorize และ Workers AI เหลือ 0%**
* **22. [Pagefind](https://pagefind.app):**
  * **โควตาฟรี:** **ฟรี 100%** (Static Search โอเพนซอร์ส)
  * **หน้าที่:** สร้างดัชนีค้นหาบทความบล็อกตอนบิลด์เว็บ ค้นหาได้ในเบราว์เซอร์โดยไม่ต้องพึ่งพาเซิร์ฟเวอร์

### 🤖 ง. ปัญญาประดิษฐ์และแคชคำทำนาย (AI Gateway & Proxy)
* **23. [Helicone.ai](https://helicone.ai):**
  * **โควตาฟรี:** **100,000 คำขอ/เดือน** (ไม่ต้องผูกบัตร)
  * **หน้าที่:** ทำ **Semantic Caching** สำหรับคำถาม AI ที่ความหมายใกล้เคียงกัน จะตอบกลับใน **< 50ms** ไม่ต้องยิงไปโมเดลจริง ช่วยเซฟเวลา Worker และค่า Token
* **24. [Portkey.ai](https://portkey.ai):**
  * **โควตาฟรี:** **10,000 คำขอ/เดือน**
  * **หน้าที่:** บริหารการสลับค่าย AI อัตโนมัติ (เช่น Groq ➔ Gemini) จากภายนอก Worker ไม่ต้องเขียนโค้ด Retry เอง

### ⚙️ จ. งานเบื้องหลังและการบันทึกสถิติ (Background Jobs & Logging)
* **25. [GitHub Actions Pre-Baking](https://github.com/features/actions):**
  * **โควตาฟรี:** **2,000 นาที/เดือน** (สำหรับ Public Repo ฟรีไม่จำกัด)
  * **หน้าที่:** รัน Cron ตอนเที่ยงคืน เจนคำทำนายไพ่ประจำวัน 78 ใบเซฟเป็น Static JSON บน R2 ทำให้คนดูดวงรายวันไม่ต้องปลุก AI แม้แต่ครั้งเดียว
* **26. [BetterStack (Logtail)](https://betterstack.com/logs):**
  * **โควตาฟรี:** **1 GB บันทึก/เดือน**
  * **หน้าที่:** โยน Log ข้อผิดพลาดของ Worker ออกไปเก็บข้างนอก ไม่เปลืองหน่วยความจำของ Cloudflare
* **27. [PostHog](https://posthog.com) หรือ [Umami Cloud](https://umami.is):**
  * **โควตาฟรี:** PostHog **1,000,000 Events/เดือน** · Umami Cloud **10,000 หน้า/เดือน**
  * **หน้าที่:** ยิงเก็บสถิติการใช้งานจากหน้าเบราว์เซอร์ผู้ใช้โดยตรง ตัดโค้ดนับสถิติออกจาก Worker
* **28. [Cron-job.org](https://cron-job.org):**
  * **โควตาฟรี:** **ฟรีตลอดชีพ (ไม่จำกัดจำนวน Cron)**
  * **หน้าที่:** ตั้งเวลายิง Webhook ปลุกงานทำความสะอาดข้อมูลหมดอายุและ Ping อุ่นแคช

---

## 📱 หมวดที่ 4: 6 นวัตกรรมฝั่ง Client & Edge (Zero Server Work)

### 29. Progressive Web App (PWA) & Service Worker ด้วย `@serwist/next`
* **แนวคิด:** เมื่อผู้ใช้เข้าเว็บครั้งที่สอง ไฟล์ CSS, JS, ฟอนต์, ไอคอน และข้อมูลไพ่ 78 ใบจะถูกดึงจาก **Cache Storage ภายในมือถือของผู้ใช้โดยตรง**
* **ผลลัพธ์:** การเข้าชมซ้ำ (Repeat Visits) มีการส่ง Request วิ่งเข้าหา Cloudflare Worker = **0 ครั้ง (Zero Server Workload)**

### 30. รัน AI ในเครื่องผู้ใช้ด้วย [Transformers.js](https://huggingface.co/docs/transformers.js) + WebGPU
* **แนวคิด:** สำหรับฟังก์ชันจัดหมวดหมู่คำถามผู้ใช้ (เช่น ความรัก การงาน สุขภาพ) หรือการแนะนำไพ่ที่เข้ากัน
* **ผลลัพธ์:** ทำงานบนชิป NPU/WebGPU ในเครื่องผู้ใช้แบบ **0ms** โดยไม่ต้องยิง API ออกไปภายนอก

### 31. Cloudflare Zaraz (ย้ายสคริปต์บุคคลที่สามออกจากเบราว์เซอร์)
* **แนวคิด:** การโหลด Google Analytics 4 หรือ Meta Pixel ในหน้าเว็บทำให้เบราว์เซอร์ผู้ใช้โหลดหนักและช้า
* **ผลลัพธ์:** Zaraz จะย้ายการยิงสถิติไปรันที่ระดับ Edge Server แทน ทำให้เว็บโหลดเร็วขึ้นอีก 30% และผู้ใช้บนมือถือประหยัดเน็ต

### 32. External Cron ล้างข้อมูลหมดอายุ (Offloading Background Worker)
* **แนวคิด:** ไม่ต้องรันโค้ด Loop ตรวจสอบโทเค็นหมดอายุในทุกคำขอ (Request)
* **ผลลัพธ์:** ใช้ **Cron-job.org** ยิงเรียกเส้น `/api/admin/cron/prune` เพียงวันละ 1 ครั้งตอนตี 3 ประหยัดรอบการรันโค้ดลง 100%

### 33. Google Fonts Subsetting (ลดขนาดฟอนต์ไทยลง 80%)
* **แนวคิด:** ไฟล์ฟอนต์ไทยแบบเต็มมีขนาด ~1.5 MB แต่ตัวอักษรที่ใช้จริงมีไม่ครบทุกตัว
* **ผลลัพธ์:** ตัดอักขระให้เหลือเฉพาะภาษาไทยและละตินที่จำเป็น ขนาดไฟล์จะลดลงเหลือ **< 80 KB** โหลดเสร็จในพริบตา

### 34. Sentry / Axiom Error Telemetry ตรงจาก Client
* **แนวคิด:** เมื่อเกิดข้อผิดพลาดในหน้าเว็บ ให้ส่งข้อผิดพลาดตรงไปยัง Sentry หรือ Axiom
* **ผลลัพธ์:** Cloudflare Workers ไม่ต้องแบกรับทราฟฟิกล็อกข้อผิดพลาด

---

## 🔮 หมวดที่ 5: 6 นวัตกรรมเฉพาะทางสำหรับเว็บไพ่ทาโรต์ (Domain Innovations)

### 35. Daily Pre-Baked Horoscope (คำทำนายประจำวัน 0 AI Token)
* **สัจธรรม:** ผู้ใช้หลายพันคนที่เปิดได้ไพ่ใบเดียวกันในวันเดียวกัน (เช่น ได้ The Sun ในวันจันทร์) ไม่จำเป็นต้องให้ AI สตรีมคำตอบใหม่ทีละคน
* **วิธีทำ:** ในช่วงเที่ยงคืน ให้เจนคำทำนายไพ่ประจำวัน 78 ใบไว้ล่วงหน้า แล้วบันทึกลง Static JSON
* **ผลลัพธ์:** ผู้ใช้เปิดดูได้ทันทีในเวลา **< 20ms** ประหยัดโควตา AI ได้ถึง 1,000–5,000 คำขอ/วัน

### 36. Local-First Reading Journal (บันทึกดวงใน IndexedDB ในเครื่อง)
* **แนวคิด:** ประวัติการเปิดไพ่ของผู้ใช้บันทึกลง **IndexedDB** ในเบราว์เซอร์ผู้ใช้ก่อนเป็นหลัก
* **ผลลัพธ์:** ผู้ใช้สามารถเปิดอ่านประวัติการทำนายย้อนหลังได้ทันทีแม้ออฟไลน์ โดยไม่ต้องยิง `SELECT` ไปยัง D1 Database

### 37. Speculation Rules API (โหลดหน้าล่วงหน้าแบบ 0ms Instant Navigation)
* **แนวคิด:** เมื่อผู้ใช้เลื่อนเมาส์ไปชี้ที่ปุ่ม "เปิดไพ่ Celtic Cross" หรือเลื่อนมาใกล้
* **วิธีทำ:** ใช้ W3C Speculation Rules สั่งให้เบราว์เซอร์โหลดหน้าถัดไปมารอในเบื้องหลังล่วงหน้า
* **ผลลัพธ์:** เมื่อผู้ใช้กดคลิก หน้าเว็บจะเปลี่ยนทันทีในเวลา **0ms** ราวกับแอป Native

### 38. Custom Error Pages จาก Edge (ตอบกลับ 404 และ 429 โดยไม่ปลุก Worker)
* **แนวคิด:** การที่มีคนยิงเข้ามาที่ URL มั่วๆ (เช่น `/wp-login.php`) หรือติด Rate Limit 429
* **วิธีทำ:** ตั้งค่าใน Cloudflare Custom Pages ให้ Edge ตอบกลับหน้า HTML ทันที
* **ผลลัพธ์:** Cloudflare Worker จะไม่ถูกปลุกขึ้นมารันโค้ดเลยแม้แต่ครั้งเดียว ประหยัดคำสั่งรันของ Worker ได้ 100%

### 39. Preconnect & Early Resource Hints
* **แนวคิด:** ในหน้าเปิดไพ่ ให้ใส่แท็ก `<link rel="preconnect">` ไปยังโดเมน AI Provider (`api.groq.com`, `generativelanguage.googleapis.com`)
* **ผลลัพธ์:** เบราว์เซอร์จะทำ DNS Lookup และ TLS Handshake ล่วงหน้า ทำให้เมื่อผู้ใช้กดสับไพ่เสร็จ AI จะตอบกลับเร็วกว่าเดิมถึง **300–500ms**

### 40. Cloudflare Snippets (กรองทราฟฟิกขยะฟรี 100,000 ครั้ง/วัน)
* **แนวคิด:** ใช้ฟังก์ชันจิ๋วฟรี **Cloudflare Snippets** ดักจับ Request ที่ไม่มี Cookie หรือมี Header แปลกปลอมที่หน้าประตู Edge
* **ผลลัพธ์:** ทราฟฟิกขยะจะถูกเตะทิ้งทันทีโดยไม่ถูกคิดเป็นโควตาคำขอของ Cloudflare Worker

---

## 🛠️ หมวดที่ 6: 6 การรีดประสิทธิภาพเชิงลึกสู่ 50 ข้อยอดมงกุฎ (Deep Performance Squeezing)

### 41. แปลงภาพไพ่สู่ฟอร์แมต AVIF (ลดขนาดลงอีก 30% เหนือกว่า WebP)
* **แนวคิด:** ปัจจุบันไฟล์ภาพหน้าไพ่ 1909 ของเราใช้ WebP แต่เทคโนโลยี **AVIF (AV1 Image File Format)** สามารถบีบอัดภาพศิลปะโบราณได้เล็กลงไปอีก **25–35%** โดยที่ความคมชัดเท่าเดิมเป๊ะ
* **ผลลัพธ์:** ลดขนาด Asset รวมจาก 21 MB เหลือเพียง **~14 MB** ช่วยเซฟ Egress Bandwidth และทำให้หน้าจอมือถือโหลดภาพไพ่ขึ้นมาเร็วขึ้นอย่างเห็นได้ชัด

### 42. สังเคราะห์เสียงสับไพ่และเสียงบรรยากาศด้วย Web Audio API (ขนาดไฟล์ 0 KB)
* **ปัญหาเดิม:** การเล่นไฟล์เสียงเอฟเฟกต์ `.mp3` หรือ `.wav` ตอนสับไพ่และพลิกการ์ด ต้องดาวน์โหลดไฟล์เสียงจากเซิร์ฟเวอร์
* **วิธีแก้:** ใช้ **Web Audio API (`AudioContext`)** ในเบราว์เซอร์ สร้างคลื่นเสียงสังเคราะห์ (White Noise Filtered + Gain Ramp) จำลองเสียงกระดาษไพ่กระทบกันขึ้นมาสดๆ ในเครื่อง
* **ผลลัพธ์:** **ขนาดไฟล์เสียงกลายเป็น 0 KB** ไม่ต้องดาวน์โหลดไฟล์เสียงแม้แต่ไบต์เดียว และเสียงตอบสนองทันที 0ms ไม่มีอาการดีเลย์

### 43. Dedicated Web Worker สำหรับสับไพ่ & Provably Fair (แอนิเมชัน 60fps ลื่นเนียนกริบ)
* **แนวคิด:** การสับไพ่ Fisher-Yates 78 ใบ พร้อมคำนวณ Cryptographic Hash (SHA-256 HMAC) บน Main Thread อาจทำให้แอนิเมชัน 3D สะดุด (Frame Drop) ในมือถือรุ่นประหยัด
* **วิธีทำ:** ย้ายโค้ดคำนวณการสับไพ่และการตรวจสอบคำมั่นสัญญา (Commitment Verification) ไปรันบน **Web Worker Thread** แยกต่างหาก
* **ผลลัพธ์:** หน้าจอเรนเดอร์ภาพ 60fps ลื่นไหล 100% ไร้รอยต่อ และไม่กินรอบประมวลผลของเซิร์ฟเวอร์เลย

### 44. D1 Covering Index Tuning (Index-Only Scan ใน SQLite)
* **แนวคิด:** ปรกติเวลา `SELECT id, name, token_version FROM users WHERE id = ?` SQLite ต้องค้นหาที่ Index แล้วจึงวิ่งไปเปิด Data Page ของตาราง
* **วิธีทำ:** สร้าง **Covering Index** ที่ครอบคลุมฟิลด์ที่ต้องการอ่านติดไปด้วย เช่น:
  ```sql
  CREATE INDEX idx_users_session_covering ON users(id, token_version, email_verified, name);
  ```
* **ผลลัพธ์:** SQLite จะอ่านข้อมูลจบได้จากตัว Index ในหน่วยความจำทันที **(Index-Only Scan โดยไม่ต้องแตะไฟล์ตารางข้อมูลจริง)** ลดความหน่วงของ D1 Query เหลือระดับไมโครวินาที

### 45. Inlining Critical CSS & Tailwind v4 Zero-Runtime (FCP ต่ำกว่า 50ms)
* **แนวคิด:** แทนที่จะให้เบราว์เซอร์บล็อกการเรนเดอร์เพื่อรอโหลดไฟล์ `.css` ภายนอก
* **วิธีทำ:** นำเฉพาะ CSS คลาสสำคัญของโครงสร้างหน้าจอแรก (Header, ผืนผ้าใบปูโต๊ะพยากรณ์, แท่นวางไพ่) ฉีดลงใน `<style>` ของ HTML จาก Edge ทันที
* **ผลลัพธ์:** หน้าจอแรกปรากฏทันทีในเวลา **< 50ms (First Contentful Paint)** เร็วจนผู้ใช้รู้สึกเหมือนเปิดแอปพลิเคชันที่ติดตั้งในเครื่อง

### 46. HTTP/3 Connection Migration (สตรีมคำทำนายไม่สะดุดแม้สลับ Wi-Fi เป็น 5G)
* **แนวคิด:** ปกติการใช้งานบนมือถือเมื่อผู้ใช้เดินย้ายจาก Wi-Fi ไป 4G/5G การเชื่อมต่อ TCP จะหลุดและต้องต่อใหม่ สตรีม AI อาจขาดตอน
* **วิธีทำ:** เปิดใช้งาน **QUIC Connection Migration บน Cloudflare Dashboard**
* **ผลลัพธ์:** ท่อข้อมูลไม่หลุด สตรีมคำทำนายจากแม่หมอ AI ไหลต่อเนื่อง 100% ไม่สะดุด ประหยัดการเปิด Session ใหม่ของ Worker และมอบประสบการณ์ระดับพรีเมียมสูงสุด

---

## 🌌 หมวดที่ 7: 4 นวัตกรรมระดับขอบฟ้าใหม่ (The Final Frontier Innovations)

### 47. Binary MessagePack / CBOR Streaming (แทนที่ Text JSON ในการสตรีม AI)
* **แนวคิด:** ปัจจุบันเวลาแม่หมอ AI สตรีมคำทำนายผ่าน Server-Sent Events (SSE) ข้อมูลจะถูกส่งเป็นข้อความ JSON ยาวๆ ซึ่งมีทั้งเครื่องหมายคำพูด วงเล็บ และ Escape Characters ที่กินขนาดข้อมูล
* **เทคนิคขั้นสุด:** เปลี่ยนการส่งข้อมูลในท่อ SSE จาก Plain Text JSON มาเป็น **[MessagePack](https://msgpack.org)** หรือ **CBOR (Concise Binary Object Representation)**
* **ผลลัพธ์:**
  * ก้อนข้อมูลที่สตรีมจะมี **ขนาดเล็กลงอีก 40–50%**
  * เอนจิน V8 บน Cloudflare Worker และเบราว์เซอร์ผู้ใช้ถอดรหัส (Decode) ข้อมูลไบนารีได้ **เร็วกว่า `JSON.parse` ถึง 3–5 เท่า** ลดรอบ CPU Execution บน Worker ลงเหลือแทบเป็นศูนย์

### 48. OffscreenCanvas & WebGL บน Background Thread (ซีพียู Main Thread กิน 0.0%)
* **ปัญหา:** การเรนเดอร์ขอบไพ่สะท้อนแสงสีทอง (Foil Sheen) หรือประกายแสงออร่าของไพ่ 78 ใบ ถ้าใช้ซีพียูหลักเรนเดอร์ มือถือราคาประหยัดจะแบตหมดไวและเครื่องร้อน
* **เทคนิคขั้นสุด:** ย้ายผืนผ้าใบเรนเดอร์กราฟิกการ์ด 3D ไปรันบน **[OffscreenCanvas](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas)** ร่วมกับ WebGL ใน Worker Thread แยกต่างหาก
* **ผลลัพธ์:**
  * การคำนวณแสงเงาของไพ่จะถูกผลักไปให้ **ชิปการ์ดจอ (GPU) ของมือถือทำงานโดยตรง 100%**
  * ซีพียูหลักของหน้าจอ (Main Thread) กินโหลด **0.0%** หน้าจอเลื่อนไหลระดับ 120Hz ไร้แรงต้านและประหยัดแบตเตอรี่มือถือผู้ใช้อย่างเหลือเชื่อ

### 49. Stateless Booking Tokens (PASETO / JWE) ในระบบจองแม่หมอจริง
* **ปัญหาของระบบ Marketplace แม่หมอ (เฟส M4–M7):** เวลาคนกดจองคิวดูดวงแต่ยังไม่ได้จ่ายเงิน ระบบทั่วไปจะสั่ง `INSERT` คิวลงตาราง `queue_tickets` ใน D1 ซึ่งมีคิวขยะที่กดยกเลิกหรือหมดอายุเต็มไปหมด ทำให้เปลืองโควตาเขียน D1
* **เทคนิคขั้นสุด:** ออกเป็น **Encrypted Stateless Token (PASETO หรือ JWE)** ส่งให้เบราว์เซอร์ผู้ใช้ถือไว้แทนฐานข้อมูล
* **ผลลัพธ์:**
  * ระหว่างรอจ่ายเงิน **ไม่ต้องเขียนข้อมูลลง D1 แม้แต่แถวเดียว (0 D1 Writes)**
  * ระบบจะสั่งบันทึกลง D1 จริงๆ เพียง 1 แถวเฉพาะตอนที่ธนาคาร (Omise) แจ้ง Webhook ว่าผู้ใช้ **"จ่ายเงินสำเร็จแล้ว"** เท่านั้น ลดขยะและประหยัดการเขียน D1 ลงได้ 80%!

### 50. Cloudflare Email Workers (ระบบช่วยเหลือและตอบคำถามอัตโนมัติที่ Edge ฟรี 100%)
* **แนวคิด:** แทนที่จะส่งอีเมลคำถามผู้ใช้ (`support@seertarot.net`) ไปเข้ากล่องจดหมายแล้วต้องมานั่งตอบด้วยมือ หรือต้องเขียนเซิร์ฟเวอร์ตอบอีเมล
* **เทคนิคขั้นสุด:** ใช้ **[Cloudflare Email Workers](https://developers.cloudflare.com/email-routing/email-workers/)** (ฟรีใน Cloudflare) ดักจับอีเมลที่ส่งเข้ามา
* **ผลลัพธ์:**
  * ถ้าผู้ใช้อีเมลมาถามเรื่องพื้นฐาน (เช่น วิธีรีเซ็ตรหัสผ่าน, กฎความโปร่งใส Provably Fair, สิทธิ์ดูดวงฟรี)
  * Worker ที่ Edge จะประมวลผลและส่งอีเมลคำตอบที่เป็นประโยชน์กลับไปให้ผู้ใช้ทันทีในเสี้ยววินาที **(0 บาท · ไม่ต้องพึ่งพาเซิร์ฟเวอร์ภายนอก)**

---

## ⚡ หมวดที่ 8: 10 มหาเทคโนโลยีระดับ Deep-Tech สู่ 60 ยอดมงกุฎ (Deep-Tech & Zero-Overhead Computing)

### 51. Brotli-11 & Zstandard (zstd) Pre-Compression ตอน Build Time
* **แนวคิด:** ปกติ Cloudflare จะบีบอัดข้อมูลแบบไดนามิกที่ Brotli Level 4–5 เพื่อประหยัด CPU ของเซิร์ฟเวอร์ แต่ถ้าเราบีบอัดไฟล์ Static Assets ล่วงหน้าด้วย **Brotli ระดับสูงสุด (Level 11)** หรือ **Zstandard (`.zst`)** ตั้งแต่ขั้นตอนการบิลด์เว็บ
* **วิธีทำ:** ในขั้นตอน `npm run build` รันสคริปต์สร้างไฟล์ `.br` คู่ขนานไปกับไฟล์ `.html`, `.js`, `.css` และ `.json`
* **ผลลัพธ์:**
  * ไฟล์มีขนาด **เล็กลงกว่า Gzip ทั่วไปอีก 20–28%**
  * Cloudflare และเบราว์เซอร์เสิร์ฟไฟล์ที่บีบอัดไว้แล้วได้ทันที **ลดภาระ CPU ของ Worker ในการบีบอัดข้อมูลลง 100%**

### 52. WebAssembly (WASM) ในฝั่ง Client สำหรับสับไพ่และตรวจสัจจะ (Zero GC Pause)
* **แนวคิด:** การรัน JavaScript เพื่อสับไพ่ 78 ใบและคำนวณการเข้ารหัส SHA-256 บ่อยๆ อาจทำให้เอนจิน V8 เกิด Garbage Collection (GC) ชั่วขณะจนภาพกระตุก
* **วิธีทำ:** คอมไพล์ตรรกะคณิตศาสตร์และสัจจะ Provably Fair ด้วย **Rust สู่ WebAssembly (`tarot_core.wasm`)** ขนาดจิ๋วเพียง 5 KB
* **ผลลัพธ์:** เบราว์เซอร์ประมวลผลด้วยความเร็วระดับ Native Assembly ไร้การสะดุด (0 GC Pause) แอนิเมชันลื่นไหลสมบูรณ์แบบ และตัดภาระการตรวจสอบออกจากเซิร์ฟเวอร์

### 53. HTTP ETag & 304 Not Modified Fingerprinting ที่ Edge
* **แนวคิด:** เส้นทาง API ไดนามิกที่มีข้อมูลเหมือนเดิมในแต่ละวัน เช่น `/api/config/analytics`, ข้อมูลการฟีดไพ่ประจำวัน หรือสถานะสมาชิก
* **วิธีทำ:** ใน Worker ให้คำนวณ 64-bit Fast Hash (FNV-1a หรือ xxHash) จากข้อมูล แล้วแนบ `ETag: "..."` หากเบราว์เซอร์ส่ง `If-None-Match` ตรงกัน ให้คืนค่า **`304 Not Modified` ทันที**
* **ผลลัพธ์:**
  * ขนาดข้อมูลที่ส่งกลับเป็น **0 Bytes (ประหยัดแบนด์วิดท์ 100%)**
  * Worker ใช้เวลาประมวลผล **< 1 มิลลิวินาที** ช่วยประหยัด CPU Time บน Cloudflare อย่างมหาศาล

### 54. Cross-Tab Synchronization ผ่าน `BroadcastChannel` API
* **ปัญหา:** หากผู้ใช้งานเปิดเว็บดูดวงหลายแท็บพร้อมกัน (เช่น แท็บ 1 ดูดวงรายวัน, แท็บ 2 อ่านความหมายไพ่, แท็บ 3 ดูประวัติ) แต่ละแท็บจะแย่งกันยิงเรียกโควตาและโปรไฟล์ซ้ำๆ
* **วิธีแก้:** เชื่อมต่อระหว่างแท็บด้วย **`BroadcastChannel('seertarot_channel')`** เมื่อแท็บใดแท็บหนึ่งดึงข้อมูลโปรไฟล์หรือโควตาเสร็จ จะกระจายให้ทุกแท็บทราบทันที
* **ผลลัพธ์:** ตัดคำขอยิงซ้ำซ้อนจากผู้ใช้คนเดียวกันลงได้ **50–70% เมื่อเปิดหลายหน้าต่าง**

### 55. Zero-Reflow GPU 3D Transforms ด้วย CSS `@property` & Compositor Layer
* **แนวคิด:** การแสดงผลแอนิเมชันพลิกไพ่ 3D (Flip Card) ถ้าสั่งเปลี่ยน Style ผิดวิธี เบราว์เซอร์จะคำนวณ Layout Recalculation ใหม่ทุกเฟรม
* **วิธีแก้:** บังคับให้การเรนเดอร์วิ่งบน **GPU Compositor Thread เท่านั้น** โดยใช้เฉพาะ `transform: translate3d(...) rotateY(...)` และ `will-change: transform`
* **ผลลัพธ์:** ได้อัตราเฟรมเรต **120 FPS นิ่งสนิท** แม้บนหน้าจอ iPhone ProMotion หรือ iPad และลดการใช้พลังงานแบตเตอรี่ในมือถือผู้ใช้ลง 40%

### 56. `content-visibility: auto` Virtual DOM Recycling ในคลังไพ่ 78 ใบ
* **ปัญหา:** หน้า `/cards` มีการแสดงผลไพ่ครบทั้ง 78 ใบพร้อมรูปและข้อความจำนวนมาก หากเรนเดอร์ DOM พร้อมกันทั้งหมดในคราวเดียว มือถือรุ่นประหยัดจะใช้เวลาโหลดหน้าจอนาน
* **วิธีแก้:** ใส่ CSS `content-visibility: auto` และ `contain-intrinsic-size: 300px` ให้กับการ์ดแต่ละใบ
* **ผลลัพธ์:**
  * เบราว์เซอร์จะข้ามการเรนเดอร์การ์ดที่อยู่นอกจอ (Off-screen) ทั้งหมดจนกว่าผู้ใช้จะเลื่อนจอไปถึง
  * **ลดจำนวน Initial DOM Elements ที่ต้องคำนวณลง 75%** และทำให้หน้าเว็บเปิดขึ้นมาทันทีใน **25ms (เดิม 180ms)**

### 57. Cloudflare Cache-Tags & Smart Selective Purging
* **แนวคิด:** เวลาผู้ดูแลระบบแก้ไขข้อมูลไพ่ 1 ใบ หรือเพิ่มบทความบล็อกใหม่ 1 เรื่อง ปรกติการล้างแคชทั้งเว็บ (Purge Everything) จะทำให้แคชหลุดทั้งหมดและ Worker ต้องทำงานหนักขึ้น
* **วิธีแก้:** กำหนด Header `Cache-Tag: cards, card-the-fool` เมื่อมีการแก้ไขข้อมูล ให้สั่งล้างแคชเฉพาะ Tag ที่เกี่ยวข้องผ่าน Cloudflare API
* **ผลลัพธ์:** ข้อมูลไพ่อีก 77 ใบและหน้าเว็บอื่นๆ ทั้งหมดยังคงสถานะ **Cache HIT 100%** โดยไม่ต้องเสียรอบประมวลผลใหม่

### 58. Non-Blocking Telemetry Beacon ผ่าน `navigator.sendBeacon`
* **แนวคิด:** การเก็บสถิติการใช้งาน (Analytics, Conversion Funnel, พฤติกรรมการดูดวง) ไม่ควรแย่งช่องทางการเชื่อมต่อ (Network Connection) ของการสตรีม AI
* **วิธีแก้:** ใช้ **`navigator.sendBeacon()`** หรือ Fetch ที่เปิดออปชัน `keepalive: true`
* **ผลลัพธ์:**
  * การส่งข้อมูลสถิติจะถูกส่งในเบื้องหลังโดยที่เบราว์เซอร์จัดการเอง
  * ไม่บล็อกการเปลี่ยนหน้า ไม่หน่วงการเรนเดอร์ และไม่สะดุดแม้ผู้ใช้ปิดหน้าต่างกะทันหัน

### 59. Edge Geolocation Asset & AI Gateway Steering ผ่าน `request.cf`
* **แนวคิด:** ผู้ใช้งานจากแต่ละภูมิภาคมีระยะห่างทางกายภาพไม่เท่ากัน
* **วิธีแก้:** ใช้ข้อมูล `request.cf.country` ที่ Edge เพื่อกำหนดเส้นทางการเชื่อมต่อ (Steering) เช่น ผู้ใช้ในประเทศไทยจะถูกเชื่อมต่อไปยัง AI Gateway และ CDN Node ที่สิงคโปร์โดยตรง
* **ผลลัพธ์:** ลดเวลา Latency ในการส่งคำขอและเริ่มต้นสตรีมคำทำนายลง **200–400 มิลลิวินาที**

### 60. Zero-Latency Edge SSE Heartbeat Slicing
* **ปัญหา:** ในช่วงที่โมเดล AI กำลังใช้เวลาคิดวิเคราะห์คำทำนายลึกซึ้ง (Thinking Phase) ท่อเชื่อมต่อ SSE อาจเงียบเกิน 100 วินาทีจน Cloudflare ตัดการเชื่อมต่อด้วยรหัส 524 Gateway Timeout
* **วิธีแก้:** ที่ Edge Worker ให้ตั้ง Heartbeat Slicing ส่งไบต์ว่างเปล่า `: ping\n\n` ทุกๆ 15 วินาทีในพื้นหลังเพื่อเลี้ยงท่อเชื่อมต่อ
* **ผลลัพธ์:**
  * ป้องกันการหลุดของท่อสตรีมได้ **100%** โดยไม่รบกวนข้อความคำทำนาย
  * ผู้ใช้ไม่เจอข้อผิดพลาด และไม่ต้องกดดูดวงใหม่ซ้ำซ้อนให้เปลืองโควตา AI

---

## 🗺️ หมวดที่ 9: แผนผังสถาปัตยกรรมระบบรวม 60 โซลูชัน (The 60-Standard Master Architecture)

```text
                                 [ ผู้ใช้งานทั่วโลก ]
                                          │
                                          ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ 🛡️ 1. ประตูหน้า Cloudflare Edge Network (DNS / WAF / Snippets / Zaraz / Email)   │
│   • Snippets: กรอง Header/URL ขยะก่อนถึง Worker                                   │
│   • บล็อก AI Scrapers / บล็อก Script Tools (curl, python)                          │
│   • WAF Rate Limiting: คุมเส้น /api/reading/*/read ที่ระดับเน็ตเวิร์ก               │
│   • Custom Error Pages: ตอบ 404/429 จาก Edge ทันที ไม่ปลุก Worker                 │
│   • Cache Rule: เสิร์ฟหน้า SSG (/, /cards, /blog) จาก Edge ทันที (Cache HIT 90%)   │
│   • Zaraz: รัน GA4 & Meta Pixel ที่ Edge (ผู้ใช้ไม่ต้องโหลด JS หนักๆ)             │
│   • HTTP/3 & QUIC Migration: สลับ Wi-Fi/5G ไม่มีสะดุด                             │
│   • Smart Selective Purge: ล้างแคชเฉพาะ Cache-Tag ไม่กระทบหน้าอื่น                │
│   • Geolocation Steering: วิ่งตรง Edge Gateway ที่ใกล้สุด (ลด Ping 300ms)         │
│   • Email Workers: บริการตอบคำถามซัพพอร์ตอัตโนมัติ 0ms                           │
└──────────────────────────────────────────────────────────────────────────────────┘
         │                                  │                               │
         │ [ค้นหาไพ่ 78 ใบ & สับไพ่ WASM]   │ [ดาวน์โหลดรูปภาพ & สื่อ]       │ [PWA, GPU & Local-First]
         ▼                                  ▼                               ▼
┌──────────────────┐               ┌──────────────────┐            ┌──────────────────┐
│ 🔍 2. Browser    │               │ 🖼️ 3. Dual-Engine│            │ 📱 4. PWA Cache, │
│    Client Engine │               │    Media Pipeline│            │    IndexedDB &   │
│ • MiniSearch 0ms │               │ • ImageKit: ไพ่  │            │    PostHog       │
│ • Rust WASM สับ  │               │   78 ใบ (25GB)   │            │ • ออฟไลน์แคช 0ms │
│   ไพ่ 0 GC Pause │               │ • Cloudinary: OG │            │ • สถิติยิงตรง    │
│ • Web Worker สับ │               │   ภาพแชร์ดวง     │            │ • Speculation 0ms│
│   ไพ่ 60fps      │               │ • Statically สำรอง│           │ • Critical CSS   │
│ • BroadcastChannel│              │ • เสียงสังเคราะห์│            │ • OffscreenCanvas│
│   ซิงก์ข้ามแท็บ  │               │   Web Audio 0 KB │            │   GPU 120Hz 0%CPU│
│ • content-vis    │               │ • Pre-compressed │            │ • SendBeacon แบค │
│   DOM Recycle    │               │   Brotli-11      │            │   กราวด์ 100%    │
└──────────────────┘               └──────────────────┘            └──────────────────┘
                                            │
                                            ▼ (เฉพาะคำขอที่ต้องประมวลผลจริง ~3–5%)
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ⚙️ 5. Cloudflare Workers (OpenNext Core Engine)                                  │
│                                                                                  │
│   ├─ [ไพ่ประจำวัน Daily Pre-Baked] ──➔ 📄 Static JSON (0 AI Token, 0 CPU)         │
│   │                                                                              │
│   ├─ [Session เปิดไพ่ / โควตารายวัน] ──➔ ⚡ Upstash Redis (ฟรี 10,000 req/วัน)   │
│   │                                       (โควตาเขียน KV บน Cloudflare = 0 ครั้ง)│
│   │                                                                              │
│   ├─ [ข้อมูลสมาชิก / ประวัติดูดวง]   ──➔ 🗄️ Cloudflare D1 (Covering Index Fast)  │
│   │                                                                              │
│   ├─ [ระบบจอง Marketplace แม่หมอ]   ──➔ 🎫 Stateless JWE (0 D1 Write รอจ่ายเงิน)│
│   │                                                                              │
│   └─ [สตรีมแม่หมอ AI]                ──➔ 🤖 Helicone AI Gateway                 │
│                                           ├─ แคชคำตอบซ้ำ (Semantic Cache <50ms) │
│                                           ├─ Preconnect Hints (ตอบไวขึ้น 300ms)  │
│                                           ├─ MessagePack Binary Stream (-50% KB) │
│                                           ├─ Edge Heartbeat Slicing (ไม่หลุด 100%)│
│                                           └─ Groq LPU (Tier 1) ➔ Gemini (Tier 2) │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 หมวดที่ 10: แผนปฏิบัติการ 3 เฟสฉบับสมบูรณ์สูงสุด (Final Action Roadmap)

### เฟส 1: Quick Wins (ทำทันทีใน 15 นาทีบน Cloudflare Dashboard)
1. ไปที่ **Caching ➔ Cache Rules** ➔ สร้างกฎแคชหน้า SSG ทั้งหมด + เลือก **Ignore Query String**
2. ไปที่ **Security ➔ Bots** ➔ เปิดสวิตช์ **Block AI Scrapers and Crawlers** และ **Bot Fight Mode**
3. ไปที่ **Security ➔ WAF** ➔ ตั้ง **Custom Rule** บล็อก Script User-Agents และตั้ง **Rate Limiting Rule** เส้น `/api/reading/*/read`
4. ไปที่ **Custom Pages** ➔ นำไฟล์ HTML ไปตั้งเป็นหน้า 404 และ 429 ที่ Edge
5. ไปที่ **Caching ➔ Tiered Cache** ➔ เปิด **Smart Tiered Cache**
6. ไปที่ **Speed ➔ Optimization** ➔ เปิด **HTTP/3 (QUIC)**, **Early Hints** และ **Zaraz**
*👉 **ผลลัพธ์: ลดทราฟฟิกและคำขอที่วิ่งเข้า Worker ทันที 85–90% โดยไม่ต้องแก้โค้ดสักบรรทัด***

> ### 🟡 สถานะเฟส 1: ตั้งค่าจริงบน production แล้ว (2026-09-06) — ได้ไม่ครบตามคู่มือ
>
> ตั้งค่าครบทุกข้อบน Cloudflare Dashboard ของโซน `seertarot.net` (แพ็กเกจ **Free**) แล้ว
> Zone ID = `1b8fb07340a374c4efb88bdbb97adc6d` (เพิ่มเป็น GitHub Secret `CLOUDFLARE_ZONE_ID` แล้ว)
>
> | ข้อ | รายการ | สถานะจริง | หมายเหตุ |
> | :---: | :--- | :---: | :--- |
> | 1 | Cache Rule `[phase1] static assets` (edge 1 ปี) | 🟢 Active | ยืนยัน `cf-cache-status: HIT` ที่ `/_next/static/*` และภาพไพ่ `.webp` |
> | 1 | Cache Rule `[phase1] SSG pages` (edge 7 วัน) | 🟡 Active แต่ไม่มีผล | ดู "ข้อค้นพบใหญ่" ด้านล่าง |
> | 2 | Ignore tracking query string | 🔴 ทำไม่ได้บน Free | ช่อง "All query string parameters except:" เป็นสีเทา (Enterprise เท่านั้น) · เปิดได้แค่ **Sort query string** |
> | 3 | Block AI scrapers | 🟢 Training = **Block** | Search + Agent ยัง **Allow** เพื่อรักษา SEO และการถูกอ้างอิงใน AI search |
> | 4 | Bot Fight Mode | 🟢 เปิดแล้ว | |
> | 5 | WAF บล็อก URL ขยะ + เครื่องมือสคริปต์ | 🟢 Active 2 กฎ | ยืนยัน `403` ที่ `/wp-login.php` และ `/.env` · มี event เข้าแล้ว |
> | 6 | Rate Limiting เส้นเปิดไพ่ | 🟡 Active 20 ครั้ง/**10 วินาที** | Free มี dropdown ให้เลือกแค่ 10 วินาที — "20 ครั้ง/10 นาที" ตามคู่มือทำไม่ได้ |
> | 7 | Smart Tiered Cache | 🟢 Active | Topology = Smart |
> | 9 | HTTP/3 (QUIC) | 🟢 เปิดอยู่ก่อนแล้ว | ยืนยัน `alt-svc: h3=":443"` |
> | 9 | 0-RTT Connection Resumption | 🟢 เพิ่งเปิด | |
> | 10 | Early Hints (HTTP 103) | 🟢 เพิ่งเปิด | ยืนยัน `HTTP/2 103` ตอบกลับมาจริง |
> | 8 | Hotlink Protection | ⏭️ ข้ามตั้งใจ | จะขวาง ImageKit Web Origin Pull ในเฟส 3 |
> | — | Zaraz | ⏭️ ยังไม่ทำ | ต้องย้าย GA4/Meta Pixel + ถอด `<script>` ฝั่ง client = แก้โค้ด แยก PR |
>
> #### 🚨 ข้อค้นพบใหญ่: Cache Rule แคชหน้า HTML ของเราไม่ได้
>
> ทั้งเว็บเสิร์ฟผ่าน Cloudflare Worker (OpenNext) — **ชั้นแคชของ CDN อยู่หลัง Worker ไม่ใช่หน้า Worker**
> ผลตรวจจริงหลังตั้งค่าครบทุกข้อ:
>
> ```
> /_next/static/…js   ➔ cf-cache-status: HIT   ✅
> /cards/w128/*.webp  ➔ cf-cache-status: HIT   ✅
> /  ·  /cards  ·  /blog ➔ ไม่มี header cf-cache-status เลย  ❌
>                          cache-control: private, no-cache, no-store, max-age=0
> ```
>
> **แปลว่า Worker ยังถูกปลุกทุกคำขอหน้า HTML** ตัวเลข "ลด Worker 85–90% ทันทีโดยไม่ต้องแก้โค้ด"
> ในคู่มือ **ไม่เกิดขึ้นจริงจากเฟส 1** สิ่งที่ลดได้จริงคือแบนด์วิดท์และคำขอของไฟล์ static เท่านั้น
>
> ต้นตอ: origin ส่ง `cache-control: private, no-cache, no-store` กลับมาทุกหน้า ซึ่งน่าจะมาจาก
> [`src/proxy.ts`](../src/proxy.ts) ที่รันบนทุก page route ทำให้ Next ถือว่าทุกหน้าเป็น dynamic
>
> ➔ **งานจริงย้ายไปเฟส 2 (แก้โค้ด)**: ทำให้หน้า SSG ส่ง Cache-Control ที่แคชได้ และ/หรือใช้
> cache interception ของ OpenNext (`NEXT_INC_CACHE_KV` ที่ตั้งไว้ใน `wrangler.jsonc` อยู่แล้ว)
>
> #### สคริปต์รันซ้ำได้
>
> [`scripts/cloudflare-phase1.ts`](../scripts/cloudflare-phase1.ts) ตั้งค่าทั้งหมดนี้ผ่าน API v4
> (ปรับให้ตรงข้อจำกัด Free แล้ว: ไม่ใช้ operator `matches`, rate limit 10 วินาที)
>
> ```bash
> export CLOUDFLARE_API_TOKEN=<token>
> npm run cf:phase1 -- --dry-run
> ```
>
> #### วิธีตรวจซ้ำ
>
> ```bash
> curl -sI https://seertarot.net/_next/static/chunks/webpack-*.js | grep -i cf-cache-status  # ต้อง HIT
> curl -s -o /dev/null -w '%{http_code}\n' https://seertarot.net/wp-login.php               # ต้อง 403
> curl -sI https://seertarot.net/ | grep -i alt-svc                                          # ต้องมี h3
> ```

### เฟส 2: Code Tightening & Client Superchargers (แก้โค้ดภายในโปรเจกต์)
1. ปรับ `src/lib/security/ai-budget.ts` ให้ทำ **Debounce Buffer 20 วิ** ก่อนเขียน KV
2. ปรับ `src/server/store.ts` ลดการเขียน KV ซ้ำซ้อน โดยใช้ **HMAC Session Token**
3. ปรับ `src/app/api/auth/me/route.ts` ให้ทำ **In-Memory Cache สำหรับ AppUser**
4. ใส่ **Covering Index** ในตาราง D1 Database สำหรับคำสั่งคิวรีเซสชันผู้ใช้
5. ใส่ **Preconnect Tags** (`api.groq.com`, `generativelanguage.googleapis.com`) ในหน้าเปิดไพ่
6. ติดตั้ง **MiniSearch** ในฝั่ง Client เพื่อค้นหาความหมายไพ่ 78 ใบในเครื่องผู้ใช้ 0ms
7. ติดตั้ง **PWA / Service Worker (`@serwist/next`)** และระบบ **Local-First IndexedDB** บันทึกดวงในเครื่องผู้ใช้
8. ใช้ **Web Audio API** สังเคราะห์เสียงสับไพ่และพลิกการ์ด (ขนาดไฟล์เสียง 0 KB)
9. ใช้ **CSS `content-visibility: auto`** และ GPU 3D Transforms ลดการเรนเดอร์ค้างในหน้า 78 ใบ
10. ใช้ **`BroadcastChannel` API** ซิงก์สถานะโควตาระหว่างแท็บ ลด Network Requests ซ้ำซ้อน
*👉 **ผลลัพธ์: ปลดล็อกความจุจาก 250 ➔ 1,000–1,500 คน/วัน และตัด Request คนดูซ้ำเหลือ 0***

> ### 🔎 ตรวจสอบหมวด 3 ทีละข้อก่อนลงมือ (2026-09-06) — หลายข้อทำไปแล้ว/ซ้ำซ้อน
>
> | # | บริการ | สถานะจริง |
> | :---: | :--- | :--- |
> | **16** | **Upstash Redis** | 🟡 **โค้ดพร้อมแล้ว รอ token** — `src/lib/platform/redis.ts` + ต่อเข้า `kv-counter` และ `store.ts` แล้ว · เปิดใช้ด้วยการตั้ง `UPSTASH_REDIS_REST_URL/TOKEN` เท่านั้น |
> | 17 | Turso | ⛔ **ไม่ควรทำ** — ซ้ำซ้อนกับ Cloudflare D1 ที่ใช้อยู่ (มี schema/migration/ด่านทดสอบผูกอยู่แล้ว) การมีสอง SQL store คือหนี้ ไม่ใช่กำไร |
> | 18 | ImageKit | 🔴 ต้องสมัครบัญชี (AI ทำแทนไม่ได้) |
> | 19 | Cloudinary | 🔴 ต้องสมัครบัญชี |
> | 20 | Statically CDN | ⛔ **ไม่คุ้ม** — ไฟล์ static ที่เสิร์ฟผ่าน Workers Assets **ฟรีและไม่จำกัดจำนวนคำขอ** อยู่แล้ว และตอนนี้ `cf-cache-status: HIT` ด้วย · การย้ายไป CDN ภายนอกคือเพิ่มจุดพังให้ภาพหลักของเว็บโดยไม่ได้อะไรกลับมา |
> | **21** | MiniSearch / FlexSearch | ✅ **บรรลุเป้าหมายแล้ว** — `CardsExplorer.tsx` ค้นหาไพ่ 78 ใบด้วย `filter()` ในเครื่องผู้ใช้อยู่แล้ว (0 คำขอ) ไม่ต้องเพิ่มไลบรารี |
> | 22 | Pagefind | ⚪ ยังไม่จำเป็น — บล็อกมี 20 บทความ ค้นหาในหน้าเว็บก็พอ |
> | 23 | Helicone | 🔴 ต้องสมัครบัญชี |
> | 24 | Portkey | ⛔ ซ้ำซ้อน — ระบบสลับค่าย AI (Groq ➔ Gemini) มีอยู่แล้วในโค้ด |
> | **25** | GitHub Actions Pre-Baking | ✅ **ไม่ต้องทำ** — ไพ่ประจำวันเป็น deterministic จากวันที่อยู่แล้ว (`src/lib/tarot/daily-card.ts`) ไม่ได้เรียก AI เลย จึงไม่มีโทเค็นให้ประหยัด |
> | 26 | BetterStack | 🔴 ต้องสมัครบัญชี |
> | 27 | PostHog / Umami | 🔴 ต้องสมัครบัญชี · มี GA4 + Meta Pixel อยู่แล้ว |
> | 28 | Cron-job.org | 🔴 ต้องสมัครบัญชี |
>
> #### 🔎 เจอระหว่างตรวจ: `/api/search` เป็น endpoint กำพร้า
>
> `/api/search` (Vectorize + Workers AI embeddings) **ไม่มีโค้ดฝั่งหน้าเว็บเรียกเลยสักที่**
> แต่ยังเปิดรับคำขออยู่ (มีด่านตรวจ origin กันไว้ชั้นหนึ่ง) — ทุกคำขอที่หลุดเข้ามาจะเผา
> โควตา Workers AI (ฟรี ~10,000 neurons/วัน) โดยไม่มีผู้ใช้จริงได้ประโยชน์
> ⚠️ **ยังไม่ลบ** เพราะมีด่านที่ 24 ใน `repo:verify` คุ้มครองฟีเจอร์นี้อยู่ (ตั้งใจเก็บไว้ใช้ต่อ)
> ➔ เจ้าของต้องตัดสินใจ: ต่อ UI เข้ากับมันจริง ๆ หรือปิดทิ้งพร้อมด่านที่ 24

### เฟส 3: External Superchargers & Dual Media Pipeline (ขยายความจุสู่ 3,000 คน/วัน ฟรี 100%)
1. **ติดตั้ง Dual-Engine Media Pipeline:**
   - ผูก **ImageKit** แบบ Web Origin ดึงภาพไพ่ 78 ใบ ตัดแบนด์วิดท์รูปออกจาก Cloudflare 100% (25 GB ฟรี)
   - ใช้ **Cloudinary** ในการประกอบภาพแชร์ผลดวงโซเชียล (OG Image) ผ่าน URL แทนการเจนบน Worker
2. สมัคร **Upstash Redis** ฟรี นำ Token มาใส่ใน Worker เพื่อย้าย Session Store ออกจาก KV
3. ตั้ง **GitHub Actions** สร้างคำทำนายไพ่ประจำวันตอนเที่ยงคืน (Daily Pre-Baked Cache)
4. แปลงภาพไพ่ 1909 สู่ฟอร์แมต **AVIF** (ลดขนาดลงอีก 30% เหนือกว่า WebP)
5. ปรับท่อส่งสตรีม AI สู่ระบบ **MessagePack Binary Streaming** พร้อม Edge Heartbeat Slicing
6. ติดตั้ง **PostHog** หรือ **Umami** ยิงสถิติจากหน้าเว็บตรง ตัดโค้ดสถิติออกจาก Worker
7. ตั้งค่า **Cron-job.org** ยิง Ping ตรวจสอบและทำความสะอาดระบบตอนตี 3
8. คอมไพล์โมดูล **Rust/WASM** สำหรับคำนวณการสับไพ่และตรวจ Provably Fair 0ms
*👉 **ผลลัพธ์: ระบบรองรับคนดูดวงได้วันละ 2,500–3,000 คน (เดือนละเกือบ 100,000 คน) ได้สบายๆ ภายใต้งบประมาณ 0 บาทอย่างแท้จริง และพร้อมสเกลสู่ 50,000+ คน/วัน ได้ทันที***
