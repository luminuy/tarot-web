# ทะเบียนการตั้งค่าและ Secrets บน Production

> รายชื่อตรวจกับโค้ดล่าสุด: 2026-10-26 (`process.env.*` ใน `src/` · `wrangler.jsonc` · `secrets.*` ใน `.github/workflows/`)
> ⛔ ห้ามเขียนค่าของ secret ลงไฟล์นี้ ลงไฟล์อื่นในรีโป หรือในแชท
>
> **วิธีอ่านคอลัมน์สถานะ** — repo ตรวจค่า secret ไม่ได้ สถานะจึงมี 3 แบบ:
> - **ยืนยันจาก Actions (วันที่)** = มีการรัน workflow ที่สำเร็จได้ก็ต่อเมื่อค่านั้นตั้งไว้ (ดูได้ที่แท็บ Actions)
> - **บันทึกว่าตั้งแล้ว (วันที่)** = มีคนตรวจแล้วจดไว้ — ตรวจจาก repo ไม่ได้ ต้องเช็กใน Cloudflare/GitHub
> - **ไม่ตั้ง (ตั้งใจ)** / **รอเจ้าของ** = ตามที่เขียน
>
> ดูของจริง: `npx wrangler secret list` (Worker) · GitHub ➔ Settings ➔ Secrets and variables ➔ Actions · `/admin` ➔ สุขภาพระบบ
> วิธี deploy / ถอยกลับ / สิทธิ์ของ API token ➔ [`CLOUDFLARE_DEPLOYMENT_GUIDE.md`](CLOUDFLARE_DEPLOYMENT_GUIDE.md)

---

## 0. งานที่ยังรอเจ้าของ

| งาน | หัวข้อ | ไม่ทำแล้วเป็นอย่างไร |
| :--- | :--- | :--- |
| ตั้ง TURN ของ Cloudflare Realtime (วิดีโอคอลแม่หมอ) | 6 | ปุ่มวิดีโอคอลไม่โผล่ · ลูกค้ายังคุยทาง LINE ได้ — บันทึก 2026-10-02 ว่ายังไม่ตั้ง · ตรวจจาก repo ไม่ได้ |
| ตั้งแจ้งเตือนค่าใช้จ่าย Cloudflare | 7 | ไม่รู้ตัวเมื่อบิลพุ่ง (เคยเกิดกับ KV Storage · INC-0287) — บันทึก 2026-10-19 ว่ายังไม่ตั้ง · ตรวจจาก repo ไม่ได้ |
| เพิ่ม event `charge.refunded` ใน Stripe webhook | 3 | คืนเงินในแดชบอร์ด Stripe แล้วเว็บไม่หักรอบ/ยกเลิกนัดให้เอง — ตรวจจาก repo ไม่ได้ |
| ตั้ง spend limit $40 ใน Claude Console (คีย์ `ANTHROPIC_API_KEY` ตั้งแล้ว 2026-10-28) · กดตรวจที่ `/admin` แท็บสุขภาพ AI ว่าแถว claude ผ่าน | 1.3 | ไม่ตั้ง limit = ใช้เกินเครดิตฟรีแล้วอาจโดนเก็บเงิน · แถว claude ไม่ผ่าน = ทุกเส้นไหลไป Groq/Gemini |
| คีย์ผู้ตัดสิน AI แยก (`JUDGE_GEMINI_API_KEY` / `JUDGE_GROQ_API_KEY`) ใน GitHub | 2.4 | `ai:judge` ใช้คีย์ของเว็บและแย่งโควตากับผู้ใช้ |
| เปิด Reader Studio | 5 | สตูดิโอแม่หมอและลิงก์ `/r/*` ตอบ 404 (ตั้งใจ จนกว่าทนายรับรอง) |
| ย้าย `routes` เข้า `wrangler.jsonc` | 8 | ย้ายบัญชี/สร้าง Worker ใหม่แล้วต้องจำเองว่าผูกโดเมนอะไร |

---

## 1. Secrets ของ Worker `tarot-web`

ตั้งด้วย `npx wrangler secret put <ชื่อ>` (ยกเว้นที่ระบุว่าส่งผ่าน `deploy.yml`) · ไม่ตั้ง = ค่าเริ่มต้นหรือฟีเจอร์ปิด ตามคอลัมน์ "ไม่ตั้งแล้ว"

### 1.1 แกนระบบและการเข้าสู่ระบบ

| ชื่อ | ใช้ทำอะไร | ไม่ตั้งแล้ว | สถานะ |
| :--- | :--- | :--- | :--- |
| `TAROT_SESSION_SECRET` | เซ็น session และโทเคน Provably Fair (`openssl rand -hex 32`) | production ใช้ไม่ได้ | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `AUTH_SECRET` | กุญแจของ `src/lib/auth/edge-auth.ts` | ใช้ `TAROT_SESSION_SECRET` แทน | ไม่บังคับ |
| `PASSWORD_PEPPER` | กุญแจลับของการแฮชรหัสผ่าน (PBKDF2) | สมัคร/ล็อกอินด้วยอีเมลไม่ได้ | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `APP_ORIGIN` | โดเมนจริงสำหรับ callback และลิงก์ในอีเมล | ใช้ `SITE_ORIGIN` ในโค้ด | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` | Google OAuth (callback `/api/auth/google/callback`) | ปุ่ม Google ใช้ไม่ได้ | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `LINE_CHANNEL_ID` · `LINE_CHANNEL_SECRET` | LINE Login (callback `/api/auth/line/callback`) | ปุ่ม LINE ใช้ไม่ได้ | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `TURNSTILE_SITE_KEY` · `TURNSTILE_SECRET_KEY` | กันบอทตอนสมัคร/ล็อกอิน/ลืมรหัส | ไม่มีด่าน Turnstile | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `ADMIN_PASSWORD` | รหัสเข้า `/admin` (อย่างน้อย 12 ตัว · เปลี่ยน = ทุก session แอดมินหลุด) | เข้าแอดมินไม่ได้ | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `ADMIN_REPORT_TOKEN` | รหัสอ่านรายงานผู้บริหาร (หัวข้อ 4) | `npm run exec:report` ใช้ไม่ได้ | ยืนยันจากเว็บจริง (2026-10-20) |
| `TESTER_PASSWORD` | รหัสโหมดผู้ทดสอบ `/tester` | โหมดผู้ทดสอบปิด | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `UNLIMITED_EMAILS` | อีเมลที่เปิดไพ่ได้ไม่จำกัด (คั่นด้วย comma) | ไม่มีใครได้สิทธิ์นี้ | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `RATE_LIMIT_BYPASS_TOKEN` | header `X-Tarot-Bypass` สำหรับโหลดเทสต์ (`src/lib/security/privileged.ts`) | ไม่มีทางข้ามเพดานถี่ | ไม่บังคับ |

### 1.2 อีเมล

| ชื่อ | ใช้ทำอะไร | ไม่ตั้งแล้ว | สถานะ |
| :--- | :--- | :--- | :--- |
| `RESEND_API_KEY` | ส่งอีเมลผ่าน Resend (โดเมน `seertarot.net` verify DKIM/SPF แล้ว) | ไม่ส่งอีเมลเลย | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `EMAIL_FROM` | ชื่อและที่อยู่ผู้ส่ง | ใช้ `DEFAULT_EMAIL_FROM` ใน `src/lib/config/site.ts` | บันทึกว่าตั้งแล้ว (2026-09-04) |
| `SUPPORT_EMAIL` | ทับ Reply-To ของอีเมลระบบ | `support@seertarot.net` | ไม่ตั้ง (ตั้งใจ) |

> โควตา Resend แผนฟรีใช้ร่วมกันทุกงาน — เพดานในโค้ด: ดวงประจำวัน 80 ฉบับ/วัน · เตือนนัด 40 ฉบับ/รอบ และ 60 ฉบับ/วัน (รายชื่อรอเวลาว่างไม่เกิน 20) · เช็กอิน 15 ฉบับ/วัน (ค่าอยู่หัวไฟล์ `src/app/api/cron/*/route.ts`)

### 1.3 AI

| ชื่อ | ใช้ทำอะไร | ไม่ตั้งแล้ว | สถานะ |
| :--- | :--- | :--- | :--- |
| `ANTHROPIC_API_KEY` | ตัวหลักของทุกเส้น AI ยกเว้นถามกลับก่อนสับไพ่และ Reader Studio (ตารางรุ่นต่อเส้นอยู่หัวไฟล์ `src/lib/ai/claude.ts`) · คำอ่าน/แชท/อ่านอีกมุม: 1-3 ใบ `claude-haiku-5-5` · 4 ใบขึ้นไป `claude-sonnet-5-5` · ผังดวงและสมุดดวง: `claude-sonnet-5-5` — ตั้งใน **GitHub secrets** แล้ว `deploy.yml` ส่งเข้า Worker · ใช้เครดิต API ที่มากับ Team plan เดือนละ $40 ควรตั้ง spend limit ใน Console | ข้ามไป Groq | ตั้งใน GitHub แล้ว (เจ้าของยืนยัน 2026-10-28) · ตรวจว่าใช้ได้ที่ `/admin` แท็บสุขภาพ AI |
| `GROQ_API_KEY` | คำอ่านชั้นสอง (รายชื่อโมเดลใน `WORKING_GROQ_MODELS` ของ `src/lib/ai/groq.ts`) | ข้ามไป Gemini | ส่งผ่าน `deploy.yml` · ตรวจจาก repo ไม่ได้ — ดูหมายเหตุ |
| `GEMINI_API_KEY` (หรือ `GOOGLE_API_KEY`) | คำอ่านชั้นสาม · สรุปรายเดือน | ข้ามไป OpenRouter | ส่งผ่าน `deploy.yml` · ตรวจจาก repo ไม่ได้ — ดูหมายเหตุ |
| `OPENROUTER_API_KEY` | คำอ่านชั้นสี่ — **ใช้เฉพาะโมเดล `:free`** ห้ามเติมเครดิต | ข้ามไปคำอ่านสำรองออฟไลน์ | ส่งผ่าน `deploy.yml` · บันทึกว่าตั้งใน GitHub แล้ว (2026-09-23) |
| `CF_AI_GATEWAY_ACCOUNT_ID` · `CF_AI_GATEWAY_ID` | ส่งทุกการเรียก AI ผ่าน AI Gateway (log ค่าใช้จ่าย/latency) | ยิงตรงไปผู้ให้บริการ | บันทึกว่าตั้งแล้ว (2026-09-03) |
| `CF_AI_GATEWAY_TOKEN` | ใช้เมื่อเปิด Authenticated Gateway | — | ไม่ตั้ง (ตั้งใจ · gateway เป็นแบบไม่ยืนยันตัว) |
| `STUDIO_AI_PAID_TIER` | `1` = ยืนยันว่า Gemini เป็นแบบเสียเงิน (เปิดตัวช่วย AI ในสตูดิโอ) | ตัวช่วยประกอบร่างจากโน้ตแม่หมอโดยไม่ส่ง AI | รอเจ้าของ (หัวข้อ 5) |
| `RELATIONS_IN_PROMPT` | `1` = ส่งความสัมพันธ์ระหว่างไพ่เข้า prompt | ไม่ส่ง | ไม่ตั้ง (รอผล `ai:judge`) |

> คีย์ AI ทั้งสี่ตัวถูกส่งเข้า Worker ในขั้น `npm run deploy` ของ `deploy.yml` ทีละชื่อ — เพิ่มผู้ให้บริการใหม่ต้องเติมชื่อในขั้นนั้นด้วย (INC-0152)
> การ deploy ผ่าน (2026-10-25) ไม่ได้พิสูจน์ว่าคีย์ AI มีค่า เพราะขั้นนั้นไม่ล้มเมื่อคีย์ว่าง — ดูสถานะจริงที่ `/admin` ➔ สุขภาพระบบ ➔ AI

### 1.4 เพดานการใช้งาน (มีค่าเริ่มต้นในโค้ด · ตั้งเมื่ออยากปรับเท่านั้น)

| ชื่อ | ค่าเริ่มต้น | ใช้กับ |
| :--- | :--- | :--- |
| `AI_DAILY_CALL_CAP` | 2000 | เพดานเรียก AI รวมทั้งระบบต่อวัน (`src/lib/security/ai-budget.ts`) |
| `GUEST_IP_DAILY_READS` · `GUEST_SUBNET_DAILY_READS` | 5 · 20 | ผู้เยี่ยมชมต่อ IP / ซับเน็ต |
| `AI_GUEST_DAILY_TOKENS` · `AI_MEMBER_DAILY_TOKENS` · `AI_PAID_DAILY_TOKENS` · `AI_READER_DAILY_TOKENS` | 60000 · 300000 · 1500000 · 800000 | โทเคน AI ต่อคนต่อวัน (`src/lib/security/cost-ledger.ts`) |
| `SEARCH_DAILY_CAP` | 1500 | ค้นหาเชิงความหมายรวมต่อวัน (`/api/search`) |
| `STUDIO_DRAFTS_PER_DAY` · `STUDIO_PRO_DRAFTS_PER_DAY` | 40 · 300 | ร่างคำอ่านด้วย AI ของแม่หมอต่อวัน (ปกติ · ผู้ถือแพ็กเกจ) |

### 1.5 การจ่ายเงิน (Stripe)

| ชื่อ | ใช้ทำอะไร | ไม่ตั้งแล้ว | สถานะ |
| :--- | :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | สร้างหน้าจ่ายเงิน Stripe Checkout (`sk_live_` · `sk_test_` · `rk_`) | ใช้ตัวจำลองที่ผ่านได้เฉพาะนอก production = ขายไม่ได้ | ยืนยันจาก Actions (deploy 2026-10-25 ดันเข้า Worker แล้ว) |
| `STRIPE_WEBHOOK_SECRET` | ตรวจลายเซ็น webhook (`whsec_`) | ปฏิเสธ webhook ทุกใบ = จ่ายแล้วสถานะไม่ขึ้น `paid` | ยืนยันจาก Actions (deploy 2026-10-25) |
| `PAYMENT_WEBHOOK_SECRET` | ตัวสำรองของ `STRIPE_WEBHOOK_SECRET` | — | ไม่ตั้ง (ตั้งใจ) |
| `ALLOW_UNSIGNED_WEBHOOKS_DEV` | รับ webhook ไม่เซ็น — **เครื่องพัฒนาเท่านั้น** | — | ⛔ ห้ามตั้งบน production / preview |

ทั้งสองตัวแรกเก็บที่ GitHub Secrets แล้ว `deploy.yml` ดันเข้า Worker ทุกรอบ (ไม่ได้ตั้งที่ GitHub = ข้าม ไม่แตะค่าใน Cloudflare) · คีย์เป็นโหมดทดสอบหรือจริงดูได้จากป้ายบนหัวแผงแอดมิน — วิธีตั้งฝั่ง Stripe อยู่หัวข้อ 3

### 1.6 งานตั้งเวลา · Web Push · วิดีโอคอล · สตูดิโอ · อื่น ๆ

| ชื่อ | ใช้ทำอะไร | ไม่ตั้งแล้ว | สถานะ |
| :--- | :--- | :--- | :--- |
| `CRON_SECRET` | Bearer ของ `/api/cron/*` — ต้องตั้ง **ค่าเดียวกัน** ทั้งบน Worker และ GitHub | ทุกเส้น cron ตอบ 401 (fail-closed) | ยืนยันจาก Actions (Daily Digest สำเร็จ 2026-10-26) |
| `VAPID_PUBLIC_KEY` · `VAPID_PRIVATE_KEY` · `VAPID_SUBJECT` | Web Push | ปุ่ม "เปิดการเตือน" ถูกซ่อน (`/api/push/public-key` ตอบ `enabled: false`) | ยืนยันจาก Actions (`setup-vapid.yml` 2026-10-07) |
| `CLOUDFLARE_TURN_KEY_ID` · `CLOUDFLARE_TURN_KEY_API_TOKEN` | วิดีโอคอลแม่หมอ | ไม่มีปุ่มวิดีโอคอล | รอเจ้าของ (หัวข้อ 6) |
| `READER_STUDIO_ENABLED` · `STUDIO_VIEW_SECRET` | เปิดสตูดิโอแม่หมอ · กุญแจลิงก์ `/r/*` | สตูดิโอและ `/r/*` ตอบ 404 · ใช้ `TAROT_SESSION_SECRET` แทน | ไม่ตั้ง (ตั้งใจ · หัวข้อ 5) |
| `UPSTASH_REDIS_REST_URL` · `UPSTASH_REDIS_REST_TOKEN` | ตัวนับ/เซสชันเปิดไพ่แบบ atomic (`src/lib/platform/redis.ts`) | ใช้ KV แทน | ตรวจจาก repo ไม่ได้ — ดู `/admin` ➔ สุขภาพระบบ |
| `APP_MIN_VERSION` · `APP_LATEST_VERSION` | เวอร์ชันแอปมือถือที่ `/api/config/app` บอก | ค่าว่าง | ไม่ตั้ง (แอปยังไม่ขึ้นสโตร์) |
| `GA_MEASUREMENT_ID` / `GA_ID` · `META_PIXEL_ID` · `GOOGLE_ADS_ID` / `AW_CONVERSION_ID` | ทางสำรองตอนรันของ `/api/config/analytics` | — | ไม่ใช้ (ดูหัวข้อ 2.2) |

### 1.7 `vars` ใน `wrangler.jsonc` (ไม่ใช่ความลับ · ห้ามตั้งชื่อซ้ำเป็น secret — ชื่อชนกันแล้ว deploy ล้ม)

`NODE_ENV` · `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` · `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` · `STUDIO_PRO_PRICE_THB` (ราคาตั้งต้นแพ็กเกจ AI ช่วยเขียน 30 วัน — ปกติแก้ที่แผงแอดมิน แท็บ "แม่หมอพาร์ทเนอร์" ➔ ราคา AI ช่วยเขียน)

ค่าสำหรับเครื่องพัฒนาเท่านั้น: `AUTH_SECRET_DEV` · `TAROT_SESSION_SECRET_DEV` (ดู [`LOCAL_SETUP.md`](LOCAL_SETUP.md))

---

## 2. Secrets / Variables ของ GitHub Actions

### 2.1 Cloudflare และ deploy

| ชื่อ | ใช้ใน | สถานะ |
| :--- | :--- | :--- |
| `CLOUDFLARE_API_TOKEN` · `CLOUDFLARE_ACCOUNT_ID` | `deploy.yml` · `rollback.yml` · `preview.yml` · `preview-down.yml` · `d1-backup.yml` · `setup-vapid.yml` | ยืนยันจาก Actions (deploy 2026-10-25 · สำรอง D1 2026-10-24) |
| `CLOUDFLARE_ZONE_ID` | ล้างแคชขอบ · กฎ www ใน `deploy.yml` | ยืนยันจาก Actions (deploy 2026-10-25 ล้างแคชสำเร็จ) |

สิทธิ์ที่ token ต้องมี ➔ [`CLOUDFLARE_DEPLOYMENT_GUIDE.md`](CLOUDFLARE_DEPLOYMENT_GUIDE.md) หัวข้อ 9 · log deploy 2026-10-25 ยืนยันว่ามีสิทธิ์ล้างแคชและเขียนกฎ redirect แล้ว

### 2.2 ค่าวัดผล (ฝังตอน build)

| ชื่อ | สถานะ |
| :--- | :--- |
| `NEXT_PUBLIC_GA_ID` (secret หรือ variable) | ยืนยันจาก Actions (deploy 2026-10-25: "ค่าวัดผลที่ใช้อยู่ตั้งครบแล้ว") |
| `NEXT_PUBLIC_META_PIXEL_ID` · `NEXT_PUBLIC_GOOGLE_ADS_ID` · `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | ไม่ใช้ (ตั้งใจ · เจ้าของตัดสินใจ) — **อย่ารายงานว่าเป็นบั๊ก** |
| `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` · `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ไม่บังคับ — ค่าจริงอยู่ใน `vars` ของ `wrangler.jsonc` แล้ว |

เริ่มใช้ Meta Pixel / Google Ads วันไหน:
1. ตั้งเป็น secret/variable ของ **GitHub** (ค่า `NEXT_PUBLIC_*` ฝังตอน build) แล้ว deploy ใหม่
2. ย้ายชื่อจาก `UNUSED` ไป `IN_USE` ในขั้น "📊 ตรวจว่าตั้งค่าวัดผลที่ใช้อยู่ครบไหม" ของ `deploy.yml`

> ⛔ ตั้งด้วย `wrangler secret` อย่างเดียว **ไม่ทำงาน** — เมื่อ `NEXT_PUBLIC_GA_ID` ติดมากับ build แล้ว `AnalyticsTracker` จะไม่เรียก `/api/config/analytics` อีกเลย

### 2.3 งานตั้งเวลาและรายงาน

| ชื่อ | ใช้ใน | สถานะ |
| :--- | :--- | :--- |
| `CRON_SECRET` | `daily-digest.yml` · `booking-reminders.yml` · `push-reminders.yml` | ยืนยันจาก Actions (2026-10-26) |
| `GSC_SERVICE_ACCOUNT_JSON` | `seo-gsc.yml` · `seo-ga4.yml` | ยืนยันจาก Actions (SEO GSC 2026-10-26) |
| `GEMINI_API_KEY` · `GROQ_API_KEY` · `OPENROUTER_API_KEY` | `deploy.yml` · `ai-judge.yml` · `ai-probe-openrouter.yml` | ตรวจจาก repo ไม่ได้ — ต้องเช็กใน GitHub |
| `STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` | `deploy.yml` | ยืนยันจาก Actions (2026-10-25) |

### 2.4 ผู้ตัดสินคุณภาพ AI (`ai:judge`) — ไม่ต้องตั้งบน Worker

| ชื่อ | สถานะ |
| :--- | :--- |
| `JUDGE_GEMINI_API_KEY` · `JUDGE_GROQ_API_KEY` | รอเจ้าของ (บันทึก 2026-10-07 ว่ายังไม่มี) — ไม่ตั้ง = ใช้คีย์ของเว็บ และสลับผู้ตัดสินเองเมื่อโดน 429/5xx |

`ai-judge.yml` รับชื่อสำรองอีกหลายแบบ (เช่น `GEMINI_JUDGE_API_KEY` · `JUDGE_API_KEY` · `GEMINI_API_KEY_2`) ทั้งแบบ secret และ variable — ใช้ชื่อในตารางเป็นหลัก · รันในเครื่องใส่ใน `.env.local`

### 2.5 environment ของ Claude Code บนเว็บ (ไม่ใช่ GitHub)

`ADMIN_REPORT_TOKEN` (ค่าเดียวกับบน Worker) ให้ผู้ช่วย `cmo` · `coo` · `cto` เรียก `npm run exec:report` · `EXEC_REPORT_BASE_URL` (ไม่บังคับ · ค่าเริ่ม `https://seertarot.net`)

---

## 3. Stripe — ตั้งฝั่ง Stripe Dashboard (ครั้งเดียว)

1. Settings ➔ Payment methods: เปิด Cards + PromptPay
2. Developers ➔ Webhooks ➔ endpoint `https://seertarot.net/api/marketplace/payments/webhook` เลือก event:
   `checkout.session.completed` · `checkout.session.async_payment_succeeded` · `checkout.session.async_payment_failed` · `checkout.session.expired` · **`charge.refunded`**
   (คืนเงินก่อนเพิ่ม `charge.refunded` ➔ แผงแอดมิน "การจองและการเงิน" ➔ ตรวจรายการคืนเงินจาก Stripe)
3. Settings ➔ Customer emails ➔ เปิด "Successful payments" (ใบเสร็จ)
4. ทดสอบด้วย `sk_test_` + บัตร `4242 4242 4242 4242` ก่อนสลับเป็น `sk_live_`
   - ระหว่างที่ production ยังใช้คีย์ทดสอบ เฉพาะผู้ทดสอบซื้อได้ (คุกกี้ `/tester` หรืออีเมลใน `UNLIMITED_EMAILS`) คนอื่นได้ 503 (`isStripeTestModeOnProduction()`)
5. ก่อนเปิดขายจริง ทดสอบ 1 รอบเต็ม: จอง ➔ จ่าย ➔ อีเมลยืนยัน ➔ ยกเลิกก่อน 24 ชม. ➔ Stripe คืนเงินจริง ➔ อีเมลแจ้งคืนเงิน

---

## 4. รหัสอ่านรายงานผู้บริหาร (`ADMIN_REPORT_TOKEN`)

ให้ผู้ช่วยผู้บริหารและรายงานเช้าวันจันทร์ดึงตัวเลขจริงด้วย `npm run exec:report` · ไม่ตั้ง = ช่องนี้ปิด (หน้าแอดมินใช้ได้ปกติ)

- อ่านได้แค่ `GET /api/admin/executive` และ `GET /api/admin/nav-badges` — ตัวเลขรวม ไม่มีอีเมล/ชื่อ/รหัสผู้ใช้ · เขียนอะไรไม่ได้ (ด่าน `test-admin-stats-keys` กันไม่ให้รหัสนี้เปิด route อื่น)
- ยาวอย่างน้อย 32 ตัว · ไม่เกี่ยวกับรหัสผ่านแอดมิน · เปลี่ยนค่า = รหัสเก่าใช้ไม่ได้ทันที

ตั้งสองที่ด้วยค่าเดียวกัน:

```bash
openssl rand -hex 32                      # สร้างค่า
npx wrangler secret put ADMIN_REPORT_TOKEN  # 1) Worker
# 2) environment ของ Claude Code บนเว็บ: เมนู cloud environment ➔ Edit ➔ ตัวแปร ADMIN_REPORT_TOKEN (เซสชันใหม่จึงเห็นค่า)
```

ตรวจ: เซสชันใหม่รัน `npm run exec:report -- --days 7`

| ผล | แปลว่า |
| :--- | :--- |
| ได้รายงานภาษาไทย | ใช้ได้ |
| `401 รหัสอ่านรายงานไม่ถูกต้อง` | ค่าสองฝั่งไม่ตรงกัน |
| `401 ยังไม่ได้ตั้งรหัสอ่านรายงาน` | ฝั่ง Worker ยังไม่ตั้ง (หรือสั้นกว่า 32 ตัว) |
| `ยังไม่มี ADMIN_REPORT_TOKEN` (ก่อนยิง) | ฝั่ง environment ยังไม่ตั้ง |

---

## 5. Reader Studio — ปิดไว้จนกว่าทนายรับรอง

ไม่ตั้ง `READER_STUDIO_ENABLED` = สตูดิโอแม่หมอและลิงก์ `/r/*` ตอบ 404 (ตั้งใจ)

ลำดับก่อนเปิด:
1. ทนายความไทยรับรอง [`legal/READER_STUDIO_DPA_DRAFT.md`](legal/READER_STUDIO_DPA_DRAFT.md) และ [`legal/READER_TERMS_DRAFT.md`](legal/READER_TERMS_DRAFT.md) (รุ่นร่างดูที่หัวแต่ละไฟล์) ➔ ตัดคำว่า `draft-` ออกจาก `STUDIO_DPA_VERSION` ใน `src/lib/studio/dpa.ts` (ด่านตรวจว่า `STUDIO_DPA_POINTS_TH` ตรงกับภาคผนวก)
2. เติมตัวตนผู้ให้บริการ (ชื่อ · ที่อยู่ · เลขผู้เสียภาษี) ในสัญญาทั้งสองฉบับและประกาศความเป็นส่วนตัว — ต้องทำก่อนรับแม่หมอภายนอกคนแรก
3. ทำหน้าอ่านข้อตกลงฉบับเต็มจากหน้ายอมรับ (B-7) และหน้ายอมรับเงื่อนไขในแผงแม่หมอ
4. เปิดยืนยันตัวตนสองขั้นในบัญชี Cloudflare · GitHub · Google AI Studio · Stripe
5. DPA กับ Cloudflare: ข้อกำหนด Self-Serve ครอบเฉพาะข้อมูล EU/UK และ CCPA — ขอทำ DPA ตาม https://www.cloudflare.com/cloudflare-customer-dpa/ แล้วจดวันที่ในภาคผนวก 3 ของร่าง DPA
6. (ถ้าจะเปิดตัวช่วย AI) ผูกบัญชีเรียกเก็บเงินกับโปรเจกต์ Google Cloud ที่ออก `GEMINI_API_KEY` ให้เป็น Active แล้วตั้ง `STUDIO_AI_PAID_TIER=1` — Gemini แบบฟรีนำข้อมูลไปใช้พัฒนาผลิตภัณฑ์ ขัดข้อตกลงข้อ 7
7. ตั้ง secret:
   ```bash
   npx wrangler secret put STUDIO_VIEW_SECRET     # openssl rand -base64 48
   npx wrangler secret put READER_STUDIO_ENABLED  # 1
   ```

แพ็กเกจ AI ช่วยเขียน 30 วัน (จ่ายครั้งเดียว): ราคาเฉพาะแม่หมอ ➔ ราคากลางที่แอดมินตั้ง ➔ `STUDIO_PRO_PRICE_THB` ใน `wrangler.jsonc` · ใช้ webhook Stripe เส้นเดิม · ปุ่มซื้อโผล่เมื่อสตูดิโอเปิดเท่านั้น

---

## 6. วิดีโอคอลแม่หมอ — Cloudflare Realtime TURN

1. Cloudflare Dashboard ➔ Realtime ➔ TURN Server ➔ Create
2. คัดลอก Turn Token ID และ API Token (API Token เห็นครั้งเดียว)
3. `npx wrangler secret put CLOUDFLARE_TURN_KEY_ID` และ `npx wrangler secret put CLOUDFLARE_TURN_KEY_API_TOKEN`
4. ตรวจ: เรียกคิวในแผงแม่หมอ ➔ ต้องเห็นปุ่ม "เข้าห้องวิดีโอ" และหน้าคิวลูกค้าต้องเห็นกล่องวิดีโอคอล

ค่าใช้จ่าย: ฟรี 1,000 GB/เดือน (TURN + SFU รวมกัน) เกินคิด $0.05/GB · สถิติคุณภาพสาย: `npm run cf:call-stats` (token แยกที่มีสิทธิ์ Account · Account Analytics · Read)

---

## 7. แจ้งเตือนค่าใช้จ่าย Cloudflare (Dashboard เท่านั้น · ฟรี)

1. Manage Account ➔ Notifications ➔ Add ➔ **Usage Based Billing**
2. ทำทีละบริการ: Workers KV Storage · Workers Standard Requests · Workers CPU ms · Realtime (TURN) · Workers Logs
3. เกณฑ์ = ใกล้เพดานโควตาฟรีของแต่ละตัว (เช่น KV Storage 0.8 GB · Realtime 800 GB) ➔ อีเมลเจ้าของ
4. ยอดรายวันดูได้ที่ Billing ➔ Billable Usage

---

## 8. ค่าที่อยู่บน Dashboard เท่านั้น — `wrangler deploy` ไม่ตั้งให้

ย้ายบัญชี Cloudflare · สร้าง Worker ใหม่ · กู้จากศูนย์ ➔ ต้องตั้งรายการนี้เอง

| สิ่งที่ต้องตั้ง | ตั้งที่ไหน | ค่าที่ใช้อยู่ |
| :--- | :--- | :--- |
| Custom Domain | Workers & Pages ➔ `tarot-web` ➔ Settings ➔ Domains & Routes | `seertarot.net` และ `www.seertarot.net` (www ถูกเด้ง 301 ไปโดเมนหลักด้วยกฎที่ `deploy.yml` ดันขึ้นทุกรอบ) |
| DNS ของโซน | DNS ➔ Records | Cloudflare สร้างเองตอนผูก Custom Domain · MX/DKIM/SPF ของ Email Routing และ Resend |
| SSL/TLS | SSL/TLS ➔ Overview | Full (Strict) |
| WAF · rate limit · บอต · Cache Rules · Tiered Cache · HTTP/3 | Security / Caching / Speed | ตั้งด้วย `npm run cf:phase1` — รายการและเหตุผลใน [`CLOUDFLARE_OPTIMIZATION_GUIDE.md`](CLOUDFLARE_OPTIMIZATION_GUIDE.md) (Bot Fight Mode **ปิด** โดยตั้งใจ · INC-0177) |
| AI Gateway | AI ➔ AI Gateway | gateway แบบไม่ยืนยันตัว · ชื่อ gateway อยู่ใน secret `CF_AI_GATEWAY_ID` |
| Email Routing | Email ➔ Email Routing | `support@` / `noreply@seertarot.net` ส่งต่อเข้าอีเมลเจ้าของ · Catch-all = Drop |
| Vectorize index | Vectorize | `card-meanings` 1024 มิติ cosine · แก้ข้อมูลไพ่/บทความแล้วกด "สร้าง index ใหม่" ที่ `/admin` ➔ สุขภาพระบบ |
| TURN · แจ้งเตือนค่าใช้จ่าย | ดูหัวข้อ 6 · 7 | |

ตั้งอัตโนมัติแล้ว ไม่ต้องทำมือ: migration ของ D1 (`deploy.yml`) · bucket R2 ทุกตัวใน `wrangler.jsonc` (`npm run cf:r2-buckets`) · กฎลบการ์ดแชร์ 90 วันทั้ง bucket `seertarot-share` (`npm run cf:r2-lifecycle` · โลโก้แม่หมอแยกไป `seertarot-studio` แล้ว ⛔ ห้ามตั้งกฎลบใน bucket นั้น) · bucket `seertarot-d1-backups` และกฎลบ 35 วัน (`d1-backup.yml`)

**ปิดหนี้ข้อนี้ถาวร** — ประกาศโดเมนใน `wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "seertarot.net", "custom_domain": true },
  { "pattern": "www.seertarot.net", "custom_domain": true }
]
```

⚠️ ทดสอบกับ Worker ชื่ออื่นก่อนเสมอ — ประกาศ route ผิดแล้ว deploy ทับได้ทั้งโซน

---

## 9. งานตั้งเวลา — อ่านรหัสผลลัพธ์

ตารางเวลาของทุก workflow ➔ [`CLOUDFLARE_DEPLOYMENT_GUIDE.md`](CLOUDFLARE_DEPLOYMENT_GUIDE.md) หัวข้อ 8

| รหัส | แปลว่า | แก้ที่ไหน |
| :-- | :--- | :--- |
| `200` | สำเร็จ (กดซ้ำในวันเดียวกันได้ `sent = 0` = กันส่งซ้ำทำงาน) | — |
| `401` | `CRON_SECRET` สองฝั่งไม่ตรงกัน หรือฝั่ง Worker ยังไม่ตั้ง | ตั้งใหม่ให้ตรงกันทั้งสองที่ |
| `403` | ถูกกฎที่ขอบปัดตกก่อนถึง Worker — ไม่เกี่ยวกับความลับ | ตรวจว่า URL ยังเป็น `*.workers.dev` และ User-Agent ยังตั้งเอง (INC-0141 · INC-0142) |

> ⚠️ อย่าเปลี่ยน URL ใน workflow กลับเป็นโดเมนหลัก · บนโฮสต์ `*.workers.dev` เปิดตรงแค่ `/api/cron/*` (`/api/*` อื่นถูกส่งกลับโดเมนหลัก) · เส้น cron ใหม่ต้องตรวจ `CRON_SECRET` เองทุกเส้น
