# ⚙️ บันทึกการตั้งค่าระบบและการเชื่อมต่อภายนอก (Production Configuration Registry)

> อัปเดตล่าสุด: **2026-09-09**  
> สถานะรวม: ✅ **บริการภายนอกที่เว็บนี้ "ใช้งานอยู่" ตั้งค่าครบและทำงานจริงทั้งหมด**

---

## ⚪ 0. เครื่องมือวัดผลที่ "ยังไม่ได้ใช้งาน" (ตั้งใจ · ไม่ใช่ของค้าง)

> ⚠️ **อย่ารายงานว่านี่คือบั๊ก** — ตรวจเจอซ้ำมาแล้วสองรอบโดยคนละคน
> `AnalyticsTracker.tsx` เขียนกำกับไว้ตั้งแต่ต้นว่า **"เว็บนี้ตั้งแค่ GA4"**

| เครื่องมือ | สถานะ | หมายเหตุ |
| :--- | :---: | :--- |
| **📊 Google Analytics 4** | ✅ **ใช้งานอยู่** | `NEXT_PUBLIC_GA_ID` ตั้งใน GitHub แล้ว · ยืนยันว่ารหัส `G-LT8YMJNT2R` **ถูกฝังในบันเดิลตอน build จริง** (พบใน `/_next/static/chunks/*.js` บน production) |
| **📘 Meta Pixel** | ⚪ **ยังไม่ได้ใช้** | ตัดสินใจโดยเจ้าของ · โค้ดรองรับไว้แล้วครบ รอวันที่จะใช้จริง |
| **🎯 Google Ads** | ⚪ **ยังไม่ได้ใช้** | เหมือนกัน |

### 📌 ถ้าวันหนึ่งจะเริ่มใช้ Meta Pixel หรือ Google Ads

**ต้องตั้งเป็น secret/variable ของ GitHub เท่านั้น** ที่ `Settings ➔ Secrets and variables ➔ Actions`
แล้ว deploy ใหม่หนึ่งรอบ (ค่า `NEXT_PUBLIC_*` ถูกฝังตอน build)

> ⛔ **ตั้งด้วย `wrangler secret` ฝั่ง Cloudflare Worker อย่างเดียว "จะไม่ทำงาน"**
> เพราะเมื่อ `NEXT_PUBLIC_GA_ID` ติดมากับ build แล้ว เงื่อนไข `if (gaId || metaPixelId || googleAdsId) return;`
> ใน `AnalyticsTracker` จะตัดตั้งแต่ต้น ➔ **ไม่ยิง `/api/config/analytics` อีกเลย**
> ทางสำรอง runtime เส้นนั้นมีไว้เผื่อกรณี "ไม่มีรหัสสักตัวติดมากับ build" เท่านั้น

จากนั้นย้ายชื่อค่าจาก `UNUSED` มาไว้ที่ `IN_USE` ในขั้น `📊 ตรวจว่าตั้งค่าวัดผลที่ใช้อยู่ครบไหม` ของ `deploy.yml`

---

## 🟢 1. บริการภายนอกที่เปิดใช้งานและทดสอบสำเร็จแล้ว (100% Active)

| บริการ / ระบบ | สถานะ | รายละเอียดและการตั้งค่าที่เสร็จสิ้น |
| :--- | :---: | :--- |
| **🌐 โดเมนจริง (`seertarot.net`)** | ✅ **พร้อมใช้งาน** | ผูก DNS Cloudflare เรียบร้อย, SSL Mode: Full, TLS 1.2+, Always Use HTTPS: ON, Route: `*seertarot.net/*` ชี้ไปที่ Worker `tarot-web` |
| **🔑 Google OAuth** | ✅ **พร้อมใช้งาน** | Authorized Origins: `https://seertarot.net`, Redirect URI: `https://seertarot.net/api/auth/google/callback`, Client ID & Secret ใส่ใน Worker แล้ว |
| **💬 LINE Login** | ✅ **พร้อมใช้งาน** | LINE Channel: `SeerTarot` (Status: Published 🟢), Channel ID: `2011389525`, Callback URL: `https://seertarot.net/api/auth/line/callback` |
| **✉️ Resend Email Service** | ✅ **พร้อมใช้งาน** | โดเมน `seertarot.net` ผ่านการ Verify DKIM/SPF ครบ 100%, ผู้ส่ง: `แม่หมอทาโรต์ <noreply@seertarot.net>`, โควตาฟรี 3,000 ฉบับ/เดือน · อีเมลระบบส่ง HTML + plain-text ควบคู่ และตั้ง `Reply-To: support@seertarot.net` (#207) |
| **📨 Cloudflare Email Routing** | ✅ **พร้อมใช้งาน** | Enabled · `support@` / `noreply@seertarot.net` → forward `bankjack10452@gmail.com` (Verified) · DNS Enabled (MX ×3 + DKIM + SPF root · ไม่ชนกับ Resend) · Catch-all = Drop · ผูกกับ Reply-To (#207) |
| **🔒 ระบบเข้ารหัสผ่าน (PBKDF2)** | ✅ **พร้อมใช้งาน** | `PASSWORD_PEPPER` ขนาด 32 ไบต์ ติดตั้งบน Worker เรียบร้อย สมัครและล็อกอินด้วยอีเมลได้สมบูรณ์ |
| **🤖 เครื่องยนต์ AI (Gemini)** | ✅ **พร้อมใช้งาน** | `GEMINI_API_KEY` ติดตั้งแล้ว สตรีมคำทำนายจริง 3 องก์ และคุยต่อเนื่องในห้องแชทได้ 100% |
| **🗄️ ฐานข้อมูล Cloudflare D1** | ✅ **พร้อมใช้งาน** | รัน Migration 0001–0006 บน Remote DB เรียบร้อย รองรับตาราง `users`, `reading_journal`, `reading_usage` |
| **⚡ Cloudflare KV Edge Cache** | ✅ **พร้อมใช้งาน** | ผูก `NEXT_INC_CACHE_KV` (prefix `app:`) สำหรับ Stat Counters, Config Overrides และ Session Backstop |
| **🏛️ แผงควบคุมแอดมิน (`/admin`)** | ✅ **พร้อมใช้งาน** | รหัสผ่าน `ADMIN_PASSWORD` ติดตั้งแล้ว พร้อมแท็บใหม่ **"✦ สถานะระบบ (Cloud Health)"** ตรวจสัญญาณสดแบบ Real-time |

---

## 📋 2. รายการ Secrets ทั้งหมดบน Cloudflare Worker (`tarot-web`)

สามารถตรวจสอบได้ด้วยคำสั่ง: `npx wrangler secret list`

ยืนยันจาก `npx wrangler secret list` (2026-09-04) — **ตั้งครบ 18 ตัว**:

```
├── ADMIN_PASSWORD            # รหัสผ่านเข้าแผงควบคุม /admin
├── APP_ORIGIN                # https://seertarot.net (Callback + ลิงก์รีเซ็ตรหัสผ่าน)
├── CF_AI_GATEWAY_ACCOUNT_ID  # Cloudflare Account ID (AI Gateway)
├── CF_AI_GATEWAY_ID          # ชื่อ gateway = seertarot-ai
├── EMAIL_FROM                # แม่หมอทาโรต์ <noreply@seertarot.net>
├── GEMINI_API_KEY            # Google Gemini — เอนจินคำอ่าน Tier 2 (fallback)
├── GOOGLE_CLIENT_ID          # Google OAuth Client ID
├── GOOGLE_CLIENT_SECRET      # Google OAuth Client Secret
├── GROQ_API_KEY              # Groq LPU — เอนจินคำอ่าน Tier 1 (Qwen3-27B · โควตาฟรี 14.4k/วัน)
├── LINE_CHANNEL_ID           # LINE Login Channel ID (2011389525)
├── LINE_CHANNEL_SECRET       # LINE Login Channel Secret
├── PASSWORD_PEPPER           # กุญแจลับ PBKDF2 Password Hashing
├── RESEND_API_KEY            # Resend API Key (re_...) ส่งอีเมล
├── TAROT_SESSION_SECRET      # กุญแจเซ็น Session Token (Provably Fair & Auth)
├── TESTER_PASSWORD           # รหัสผ่านโหมดผู้ทดสอบไม่จำกัด (/tester)
├── TURNSTILE_SECRET_KEY      # Turnstile — กันบอท signup/login/forgot
├── TURNSTILE_SITE_KEY        # Turnstile Site Key (client ดึงผ่าน /api/config/turnstile)
└── UNLIMITED_EMAILS          # allowlist อีเมลดูดวงไม่จำกัด
```

**ตัวเลือก (ยังไม่ได้ตั้ง — ไม่บังคับ):**
- `SUPPORT_EMAIL` — ทับ Reply-To ของอีเมลระบบ (ค่าเริ่มต้น `support@seertarot.net`)
- `CF_AI_GATEWAY_TOKEN` — ใส่เมื่อเปิด Authenticated Gateway

### 💳 ยังไม่ได้ตั้ง — คีย์ระบบรับชำระเงิน (T-37 · บังคับก่อนเปิดขายจริง)

> ⚠️ **บทเรียน T-37** — โค้ด production อ่านสามตัวนี้ใช้จริงมาตลอด (ถึงขั้นมี
> `console.error("Missing PAYMENT_WEBHOOK_SECRET in production!")` ใน `payment-gateway.ts`)
> แต่ grep ทั้งรีโปแล้ว **ไม่มีใน `.env.example` · `wrangler.jsonc` · เอกสารนี้เลยสักที่**
> คนที่มาตั้งค่าต่อจึงไม่มีทางรู้ว่าต้องตั้งอะไรบ้าง และโหมดล้มเหลวเป็นแค่บรรทัด log

| ชื่อ | ใช้ทำอะไร | ไม่ตั้งแล้วเกิดอะไร |
| :--- | :--- | :--- |
| `OMISE_SECRET_KEY` | คีย์ฝั่งเซิร์ฟเวอร์ของ Omise (`skey_...`) สำหรับสร้างรายการเรียกเก็บเงินจริง | ระบบใช้ "ตัวจำลอง" (`provider = simulator`) ซึ่งผ่านด่านยืนยันได้เฉพาะนอก production — บน production คือขายของไม่ได้เลย |
| `OMISE_WEBHOOK_SECRET` | ตรวจลายเซ็น HMAC-SHA256 ของ webhook ที่เกตเวย์ยิงกลับมา | **ปฏิเสธ webhook ทุกใบ** (ตั้งแต่ T-18) → จ่ายเงินสำเร็จแต่สถานะไม่เคยขึ้นเป็น `paid` |
| `PAYMENT_WEBHOOK_SECRET` | ตัวสำรองของตัวบน (ใช้เมื่อยังไม่ได้ตั้ง `OMISE_WEBHOOK_SECRET`) | เหมือนข้างบน — ต้องตั้งอย่างน้อยหนึ่งในสองตัว |

ตั้งด้วย:

```bash
npx wrangler secret put OMISE_SECRET_KEY
npx wrangler secret put OMISE_WEBHOOK_SECRET
```

> 🚫 `ALLOW_UNSIGNED_WEBHOOKS_DEV=1` เป็นธงสำหรับ **เครื่องพัฒนาเท่านั้น**
> ห้ามตั้งบน production / preview / staging เด็ดขาด — เท่ากับเปิดให้ใครก็ได้แจกเครดิตให้ตัวเอง

### 📬 รอตั้งเพิ่ม — `CRON_SECRET` (ดวงประจำวันทางอีเมล)

ระบบส่งดวงประจำวันเขียนเสร็จและ deploy ไปแล้ว แต่ **ยังส่งไม่ออกจนกว่าจะตั้งความลับนี้**
เส้น `/api/cron/daily-digest` เป็นแบบ fail-closed — ไม่มี `CRON_SECRET` = ตอบ 401 ทุกคำขอ
(ตั้งใจให้เป็นแบบนี้ เพื่อไม่ให้ใครก็ได้ยิงให้ระบบส่งอีเมลหาผู้ใช้ของเรา)

ต้องตั้ง **สองที่ ด้วยค่าเดียวกัน**:

```bash
# 1) ฝั่ง Cloudflare Worker (ตัวที่ตรวจว่าคำขอมาจากเรา)
npx wrangler secret put CRON_SECRET

# 2) ฝั่ง GitHub (ตัวจับเวลาที่ยิงเข้ามา)
#    Settings → Secrets and variables → Actions → New repository secret
#    Name: CRON_SECRET   Value: <ค่าเดียวกับข้อ 1>
```

สร้างค่าสุ่มด้วย `openssl rand -base64 32`

**ตรวจว่าใช้ได้จริง**: Actions → `📬 Daily Digest` → Run workflow → ดูผลลัพธ์
ต้องได้ HTTP 200 พร้อม JSON สรุป `{ scanned, sent, skipped, failed }`
กดซ้ำในวันเดียวกันต้องได้ `sent = 0` (กันส่งซ้ำทำงาน ไม่ใช่ระบบพัง)

**อ่านรหัสผลลัพธ์ให้ถูก** — workflow แยกให้แล้วว่าต้องแก้ตรงไหน:

| รหัส | แปลว่า | แก้ที่ไหน |
| :-- | :--- | :--- |
| `200` | สำเร็จ | — |
| `401` | ค่า `CRON_SECRET` สองฝั่งไม่ตรงกัน (หรือฝั่ง Worker ยังไม่ได้ตั้ง) | ตั้งใหม่ให้ตรงกันทั้งสองที่ |
| `403` | **คำขอถูกกฎ WAF ปัดตกที่ชั้น edge ก่อนถึง Worker** — ไม่เกี่ยวกับความลับเลย | ดูกฎ Custom Rule ของ Cloudflare |

> ⚠️ **กับดักที่เหยียบมาแล้ว 2 ชั้น — อย่าเปลี่ยน URL ใน workflow กลับเป็นโดเมนหลัก**
>
> **ชั้นที่ 1 (INC-0141)**: กฎ WAF ข้อ 5 ของโซนนี้บล็อก User-Agent ที่เป็น
> `curl` / `python` / `Postman` / `Scrapy` ที่เส้น `/api/` ➔ workflow จึงส่ง `-A "SeerTarot-Cron/1.0"`
>
> **ชั้นที่ 2 (INC-0142) — ตัวที่ร้ายกว่า**: โดเมน `seertarot.net` เปิด **Bot Fight Mode** อยู่
> ซึ่งตอบ managed challenge (หน้า `Just a moment...` ที่ต้องมี JavaScript + คุกกี้)
> ให้กับคำขอจาก IP ดาต้าเซ็นเตอร์ — IP ของ GitHub runner เข้าข่ายเต็ม ๆ
> **เปลี่ยน User-Agent ไม่ช่วยเลย** เพราะ Cloudflare ตัดสินจาก IP ไม่ใช่ชื่อ UA
>
> ✅ **ทางออกที่ใช้อยู่**: ยิงเข้า `https://tarot-web.bankjack10452.workers.dev/api/cron/daily-digest`
> ซึ่งเป็นโดเมนของ Cloudflare เอง **ไม่ได้อยู่ในโซน** `seertarot.net` การตั้งค่าระดับโซนจึงไม่มีผล
> โค้ดที่รันคือ Worker ตัวเดียวกันเป๊ะ · ลิงก์ในอีเมลยังชี้ `seertarot.net` เพราะสร้างจาก
> `SITE_ORIGIN` ในโค้ด ไม่ได้เอามาจาก host ของคำขอ · มีด่านตรวจกำกับไม่ให้เปลี่ยนกลับ
>
> 🔒 เปิด workers.dev ทิ้งไว้ไม่เสี่ยง เพราะเส้นนี้ fail-closed — ไม่มี Bearer ที่ตรงกับ
> `CRON_SECRET` ได้ 401 เปล่า ๆ เสมอ

> ⚠️ ต้องรัน `npm run db:migrate` (migration `0014_digest_prefs.sql`) ก่อน ไม่งั้นเส้นนี้จะล้มเพราะไม่มีตาราง `digest_log`
> ⚠️ เพดานส่ง 80 ฉบับ/รอบ เพราะ Resend แผนฟรีให้ 100 ฉบับ/วัน และต้องเหลือโควตาให้อีเมลยืนยันตัวตนกับรีเซ็ตรหัสผ่านด้วย

> **เอนจินคำอ่าน**: GROQ + GEMINI ตั้งครบ → Tier 1 Groq Qwen3-27B ทำงาน (`src/lib/ai/groq.ts` · fallback → Gemini `src/lib/ai/gemini.ts`) · เฝ้าเมตริก `ai_foreign_trip` / `ai_groq_failover` ใน `/admin`
> **AI Gateway / Turnstile**: ตั้งครบแล้ว ไม่ใช่รายการค้างอีกต่อไป

### ⏳ รอตั้งเพิ่ม — Vectorize / R2 (Wave 3)

**Vectorize** (binding อยู่ใน `wrangler.jsonc` แล้ว — deploy รอบถัดไปทำงานเลย):
- หลัง deploy → `/admin` → แท็บสุขภาพระบบ → การ์ด Cloudflare Free Stack → ปุ่ม **"สร้าง index ใหม่"** (รันครั้งเดียว)

**R2** (bucket `seertarot-share` + binding พร้อม — deploy รอบถัดไปทำงานเลย):
- ตั้ง lifecycle ลบภาพแชร์อัตโนมัติ ~90 วัน (PDPA):
  ```
  npx wrangler r2 bucket lifecycle add seertarot-share --prefix "" --expire-days 90
  ```
  (หรือ Dashboard → R2 → seertarot-share → Settings → Object lifecycle rules)

---

## 🧪 3. การตรวจสอบความพร้อมด้วย Live Diagnostics

แอดมินสามารถตรวจสอบสถานะการเชื่อมต่อของทุกบริการข้างต้นแบบ Real-time ได้ตลอดเวลา:
1. เข้าสู่ระบบที่ **[https://seertarot.net/admin](https://seertarot.net/admin)**
2. ไปที่แท็บ **"✦ สถานะระบบ (Cloud Health)"**
3. กดปุ่ม **"✦ ยิงตรวจสัญญาณสดทั้งหมด"** ระบบจะทดสอบและรายงานสถานะ Latency (ms) ของทุกระบบทันที
