# ⚡ คู่มือการนำเว็บขึ้น Cloudflare Workers (Cloudflare Deployment Guide)

เอกสารนี้ระบุขั้นตอนการ Deploy เว็บดูดวงไพ่ทาโรต์ (**Interactive Provably-Fair Tarot Web**) ขึ้นบน **Cloudflare Workers / OpenNext** เพื่อประสิทธิภาพความเร็วระดับ Edge Network (<50ms ในไทย), ระบบความปลอดภัยป้องกัน DDoS, และ Zero Cold-Start

---

## 🌟 จุดเด่นเมื่อรันบน Cloudflare Workers
- 🚀 **Ultra-Fast Global Edge**: โค้ดทำงานบน Serverless V8 Isolate กระจายทั่ว 300+ เมืองทั่วโลก (รวมถึงศูนย์ข้อมูล BKK ในประเทศไทย)
- 🔒 **Enterprise-Grade Security**: ระบบป้องกันการยิง Bot / DDoS และ SSL อัตโนมัติฟรีตลอดชีพ
- ⚡ **Real-Time Streaming Ready**: รองรับ Server-Sent Events (SSE) สำหรับการสตรีมคำทำนาย AI แบบเรียลไทม์ไม่มีสะดุด
- 💰 **คุ้มค่าสูง**: มีแพ็กเกจฟรี 100,000 requests/วัน

---

## 📋 1. สิ่งที่ต้องเตรียมก่อน Deploy (Prerequisites)

1. บัญชี [Cloudflare Dashboard](https://dash.cloudflare.com/) (สมัครฟรี)
2. Gemini API Key หรือ Google AI API Key
3. ติดตั้ง Node.js 20+ บนเครื่อง

---

## 🧊 1.5 สถาปัตยกรรม Edge Caching (OpenNext) — ตั้งครั้งเดียว

เว็บนี้เป็น **SSG ล้วน** (ทุกหน้า prerender ตอน build · ไม่มี `export const revalidate` · ไม่มี `revalidateTag()` / `revalidatePath()` ที่ไหนเลย) จึงใช้ OpenNext edge caching แบบ **มินิมอล** — แคชหน้าอยู่ใน Workers Static Assets (`static-assets-incremental-cache` · INC-0287) ไม่ใช้ KV

| Binding | ประเภท | หน้าที่ |
| :--- | :--- | :--- |
| `APP_KV` | KV Namespace | (เดิมชื่อ `NEXT_INC_CACHE_KV` · namespace เดิม) Stat Counters, Content Overrides, Session Backstop (คีย์ `app:*`) — แคช HTML/RSC ของหน้า SSG ย้ายไป static assets แล้ว (2026-10-19 · ห้ามกลับมาใช้ KV เพราะ seed ทุก deploy ไม่เคยลบ) |
| `ASSETS` | Static Assets | ภาพไพ่ 1909, `_next/static` |
| `APP_DB` | D1 Database | เก็บข้อมูล users, reading_journal, reading_usage, user_bonus, marketplace |
| `AI` | Workers AI | ตัวคัดกรองความปลอดภัยฉุกเฉินชั้น 3 |
| `VECTORIZE` | Vectorize Index | ค้นหาความหมายไพ่และบทความเชิงความหมาย (`card-meanings` 1024d) |
| `SHARE_BUCKET` | R2 Bucket | จัดเก็บภาพการ์ดแชร์ที่ผู้ใช้สร้างเอง (`seertarot-share` · ลบเองทั้ง bucket เมื่อครบ 90 วัน · ห้ามเก็บของถาวรในนี้) |
| `STUDIO_BUCKET` | R2 Bucket | โลโก้สตูดิโอแม่หมอ (`seertarot-studio` · ส่วนตัว · เก็บถาวร ห้ามมีกฎลบ · deploy สร้าง bucket ให้เองด้วย `npm run cf:r2-buckets`) |
| *(ไม่ผูกกับ Worker)* | R2 Bucket | `seertarot-d1-backups` — ไฟล์สำรองฐาน D1 รายสัปดาห์ (ส่วนตัว · ลบเองเมื่อครบ 35 วัน · ดูหัวข้อ 8.5) |

config อยู่ใน [`wrangler.jsonc`](../wrangler.jsonc) + [`open-next.config.ts`](../open-next.config.ts)
`enableCacheInterception` ต้องเป็น `false` เสมอ (INC-0106 · เปิดแล้ว segment prefetch ของ Next 16 วนยิงไม่รู้จบ)

### สิทธิ์ของ API Token (CI)

`CLOUDFLARE_API_TOKEN` ใน GitHub Secrets สำหรับ deploy อัตโนมัติ:
- **Account › Workers Scripts › Edit**
- **Account › Workers KV Storage › Edit**
- **Account › Workers R2 Storage › Edit** (binding R2 · สร้าง bucket สำรอง · ตั้งกฎลบไฟล์อัตโนมัติ)
- **Account › D1 › Edit** (รัน migration ก่อน deploy · export ไฟล์สำรอง)

---

## 🚀 2. ขั้นตอนการ Deploy สู่ Cloudflare Workers (Step-by-Step)

### ขั้นที่ 1: เข้าสู่ระบบ Cloudflare ผ่าน Terminal
เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
```bash
npx wrangler login
```
*(เบราว์เซอร์จะเปิดขึ้นมา ให้กดปุ่ม **Allow / Authorize** เพื่อยืนยัน)*

---

### ขั้นที่ 2: ตั้งค่า Secrets (สำคัญมาก ⚠️)

สามารถตั้งค่า Secrets ครบทั้ง 18 ตัว (ดูรายละเอียดเต็มใน [`docs/PENDING_SETUP.md`](PENDING_SETUP.md)):

```bash
# เอนจิน AI สองประสาน
npx wrangler secret put GROQ_API_KEY            # Groq LPU (Tier 1)
npx wrangler secret put GEMINI_API_KEY          # Google Gemini (Tier 2 Failover)

# ความปลอดภัยและระบบสิทธิ์
npx wrangler secret put TAROT_SESSION_SECRET    # openssl rand -hex 32 (Provably Fair)
npx wrangler secret put PASSWORD_PEPPER         # openssl rand -hex 32 (PBKDF2 Pepper)
npx wrangler secret put ADMIN_PASSWORD          # รหัสผ่านเข้าสู่ระบบ /admin

# การสื่อสารและอีเมล
npx wrangler secret put RESEND_API_KEY          # API Key จาก Resend.com
npx wrangler secret put EMAIL_FROM              # แม่หมอทาโรต์ <noreply@seertarot.net>
npx wrangler secret put APP_ORIGIN              # https://seertarot.net

# OAuth, Bot Defense, AI Gateway, Tester
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put LINE_CHANNEL_ID
npx wrangler secret put LINE_CHANNEL_SECRET
npx wrangler secret put TURNSTILE_SITE_KEY
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put CF_AI_GATEWAY_ACCOUNT_ID
npx wrangler secret put CF_AI_GATEWAY_ID
npx wrangler secret put TESTER_PASSWORD
npx wrangler secret put UNLIMITED_EMAILS
```

> ส่วน KV namespace สำหรับ edge cache สร้างครั้งเดียวแล้ว (ดูหัวข้อ **1.5** ด้านบน) — ไม่ต้องสร้างใหม่ทุกครั้ง

---

### ขั้นที่ 3: ทดสอบรันบนเครื่องจำลอง Worker (Local Preview)
ก่อนขึ้นระบบจริง สามารถทดสอบรันบน Cloudflare Worker Simulator ในเครื่องของคุณ:
```bash
npm run preview:worker
```
- ระบบจะคอมไพล์ Next.js เข้าสู่ `.open-next/` และเปิดเซิร์ฟเวอร์จำลองที่ `http://localhost:8787`

---

### ขั้นที่ 4: สั่ง Deploy ขึ้น Cloudflare Workers (Production)
เมื่อพร้อมแล้ว ให้รันคำสั่งเดียว:
```bash
npm run deploy
```

> `npm run deploy` = `tsx scripts/bump-sw-version.ts && npm run build:astro && opennextjs-cloudflare build && tsx scripts/merge-astro-assets.ts && opennextjs-cloudflare deploy`
> กระบวนการ Deploy จะ:
> 1. อัปเดตเวอร์ชัน Service Worker (`bump-sw-version.ts`)
> 2. บิลด์หน้าสแตติก Astro 305 หน้า (`build:astro`)
> 3. บิลด์ Next.js OpenNext Worker (`opennextjs-cloudflare build`)
> 4. รวมไฟล์ HTML สแตติกของ Astro ทับลง `.open-next/assets` (`merge-astro-assets.ts`)
> 5. Seed หน้า SSG และ deploy Worker ขึ้น Edge (ปกติทำผ่าน GitHub Actions CI/CD อัตโนมัติอยู่แล้ว)

เมื่อระบบ Deploy เสร็จ จะแสดง URL ของเว็บคุณทันที เช่น:
```
✨ Successfully published your Worker to https://tarot-web.<your-subdomain>.workers.dev
```

---

## 🌐 3. การผูกชื่อโดเมนของตนเอง (Custom Domain)

หากต้องการใช้ชื่อเว็บของตัวเอง (เช่น `tarot.yourdomain.com` หรือ `tarot-thai.com`):

1. ไปที่ **Cloudflare Dashboard** ➔ **Workers & Pages** ➔ เลือก **`tarot-web`**
2. ไปที่แท็บ **Settings** ➔ **Domains & Routes** ➔ กด **Add Custom Domain**
3. พิมพ์ชื่อโดเมนของคุณ (เช่น `tarot.yourdomain.com`) ➔ กด **Add Domain**
4. Cloudflare จะออก SSL Certificate และผูก DNS ให้อัตโนมัติภายใน 1-2 นาที

---

## 🤖 4. การตั้งค่า CI/CD Deploy อัตโนมัติเมื่อ Push โค้ด (GitHub Actions)

หากโปรเจกต์ของคุณอยู่บน GitHub สามารถตั้งค่าให้ Deploy อัตโนมัติทุกครั้งที่ `git push` เข้ากิ่ง `main`:

สร้างไฟล์ `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Build and Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: run deploy
```

---

## 🛠️ 5. คำสั่งและเครื่องมือสำหรับผู้ดูแลระบบ (Ops & Debugging)

- **ดู Live Logs คำขอที่เข้ามาแบบ Real-Time**:
  ```bash
  npx wrangler tail
  ```
- **ตรวจสอบรายชื่อ Secrets ทั้งหมด**:
  ```bash
  npx wrangler secret list
  ```
- **ลบ Secret เดิมออก**:
  ```bash
  npx wrangler secret delete GEMINI_API_KEY
  ```

---

---

## 🛡️ 6. การตั้งค่า Cloudflare Native WAF Rate Limiting (AI Abuse & Cost Protection)

เพื่อป้องกันการยิงเรียก AI ซ้ำซ้อนจากระดับเครือข่ายก่อนถึง Worker:

1. ไปที่ **Cloudflare Dashboard** › เลือกโดเมนของคุณ › **Security** › **WAF** › **Rate limiting rules**
2. กด **Create rule**:
   - **Rule Name**: `Tarot Reading Rate Limit`
   - **When incoming requests match**:
     - `URI Path` contains `/api/reading/`
   - **Rate limit criteria**:
     - **Requests**: `60` requests
     - **Period**: `1 minute`
     - **Characteristics**: `IP`
   - **Action**: `Block` (Duration: `10 minutes`)
3. สำหรับเส้นทางประมวลผลโมเดล AI (`/api/reading/*/read`):
   - **Requests**: `20` requests ต่อ `10 minutes` ต่อ IP

---

## 🧪 7. Checklist ตรวจสอบความพร้อมหลัง Deploy

- [ ] หน้าแรก `/` โหลดเร็ว ไพ่ 78 ใบแสดงครบถ้วน
- [ ] หน้า `/cards` และหน้ารายใบ `/cards/major-00` แสดงผลสมบูรณ์
- [ ] หน้า `/spreads` แสดงผังทั้ง 25 รูปแบบครบถ้วน
- [ ] ทดลองเปิดไพ่และสตรีมคำทำนายจากแม่หมอ AI ไหลลื่นไม่มีสะดุด
- [ ] หน้า `/privacy` สามารถดาวน์โหลดสำเนา JSON และสั่งลบข้อมูลได้ตามมาตรฐาน PDPA
- [ ] แผงแอดมิน `/admin` แสดงตัวเลขโควตา AI ประจำวันและสถานะ Rate Limit Bypass

---

## ⏪ 8. เมื่อ deploy พังต้องทำอย่างไร (Rollback Playbook)

> 🔴 **R-14** — ระบบ deploy อัตโนมัติทุกครั้งที่ merge เข้า `main` แต่เดิม **ไม่มีขั้นตอนถอยกลับ
> เขียนไว้ที่ไหนเลย** ทั้งใน workflow และในเอกสาร หัวข้อนี้คือปุ่มถอยที่หายไป

### 8.1 ถอยกลับด้วยปุ่มเดียว (ทางหลัก · ใช้เวลาไม่ถึงนาที)

1. ไปที่ **Actions** ➔ workflow **"⏪ Rollback — ถอย Worker กลับเวอร์ชันก่อนหน้า"**
2. กด **Run workflow**
   - `version_id` — เว้นว่างไว้ = ถอยไปเวอร์ชันก่อนหน้าเวอร์ชันที่ใช้อยู่
     (ถ้าต้องถอยไกลกว่านั้น ดูรายการเวอร์ชันได้จากสรุปของการรันครั้งก่อน หรือ `npx wrangler versions list`)
   - `reason` — **บังคับกรอก** เพราะต้องเอาไปบันทึกลง `docs/INCIDENT_LOG.md` ต่อ
3. workflow จะสั่ง `wrangler rollback` แล้ววนเช็กหน้าแรกจน HTTP 200 (สูงสุด 5 ครั้ง ห่างกัน 10 วินาที)
   ถ้ายังไม่ 200 จะจบด้วยสถานะล้ม พร้อมบอกให้เข้า Dashboard ทันที

### 8.2 ถอยกลับด้วยมือ (เมื่อ GitHub Actions เองใช้ไม่ได้)

```bash
npx wrangler versions list          # ดูว่ามีเวอร์ชันอะไรบ้าง
npx wrangler rollback               # ถอยไปเวอร์ชันก่อนหน้า
npx wrangler rollback <version_id>  # ถอยไปเวอร์ชันที่ระบุ
```

หรือที่ **Cloudflare Dashboard** ➔ **Workers & Pages** ➔ `tarot-web` ➔ **Deployments** ➔
เลือกเวอร์ชันที่ต้องการ ➔ **Rollback**

### 8.3 ⚠️ สิ่งที่การถอยกลับ **ไม่** ย้อนให้

| สิ่งที่ไม่ย้อน | ผลที่ตามมา | ต้องทำอะไร |
| :--- | :--- | :--- |
| **migration ของ D1** | โค้ดเก่าเจอสคีมาใหม่ | เขียน migration ย้อนกลับเองก่อนถอย (เพิ่มคอลัมน์แบบ nullable เสมอ จะไม่เจอปัญหานี้) |
| **ข้อมูลใน KV / R2** | คีย์ที่เขียนไปแล้วยังอยู่ | ลบ/แก้ด้วย `wrangler kv key delete` ถ้าจำเป็น |
| **secret ของ Worker** | ค่าล่าสุดยังอยู่ | ตั้งใหม่ด้วย `wrangler secret put` |

### 8.4 หลังถอยกลับเสร็จ — บังคับทำทุกครั้ง

```bash
npm run incident -- --title "..." --severity high \
  --symptom "..." --cause "..." --fix "..." --prevention "..."
```

กฎเหล็กข้อ 0 ของโปรเจกต์นี้: **ถอยกลับโดยไม่บันทึกบทเรียน = รอบหน้าจะพังแบบเดิมอีก**

### 8.5 สำรองและกู้คืน D1

**สำรอง:** `.github/workflows/d1-backup.yml` สำรองฐาน `tarot-app-db` ทั้งฐานทุกวันอาทิตย์ 03:17 น. (เวลาไทย)
ลง R2 bucket ส่วนตัว `seertarot-d1-backups` ที่ `d1/tarot-app-db/<ปี>/<เดือน>/tarot-app-db-<เวลา UTC>Z.sql.gz`
ทุกรอบโหลดไฟล์ลองกู้ + `integrity_check` ก่อนอัปโหลด แล้วดาวน์โหลดกลับเทียบ SHA-256 · ไฟล์อายุเกิน 35 วัน R2 ลบเอง
ล้มเมื่อไหร่เปิด issue `[สำรองข้อมูลล้ม]` · ก่อนรัน migration ที่เสี่ยงให้กดสำรองเองที่ Actions ➔ D1 Backup ➔ Run workflow

> ⚠️ ระหว่าง export ฐานจะไม่รับคำขออื่นชั่วครู่ (ข้อจำกัดของ D1) — อย่ากดสำรองเองช่วงคนใช้เยอะ
> ⚠️ ไฟล์สำรองมีข้อมูลส่วนบุคคล — ห้ามเปิดลิงก์สาธารณะของ bucket นี้ (สคริปต์ตรวจและไม่ยอมอัปโหลดถ้าเปิด) และห้ามแนบเป็น artifact ของ GitHub

**กู้คืน** — เลือกทางตามสถานการณ์:

| สถานการณ์ | ทางที่ใช้ |
| :--- | :--- |
| ฐานยังอยู่ แค่ข้อมูลเสีย/ลบผิด ภายใน 30 วัน | **Time Travel** (ละเอียดระดับนาที): `npx wrangler d1 time-travel restore tarot-app-db --timestamp=<ISO เวลา UTC ก่อนเกิดเหตุ>` |
| ฐานถูกลบ · เกิน 30 วัน · Time Travel ใช้ไม่ได้ | กู้จากไฟล์สำรองตามขั้นด้านล่าง |

```bash
# 1. หาไฟล์ล่าสุดที่ Dashboard ➔ R2 ➔ seertarot-d1-backups ➔ d1/tarot-app-db/ แล้วดาวน์โหลด
npx wrangler r2 object get seertarot-d1-backups/d1/tarot-app-db/<ปี>/<เดือน>/<ไฟล์>.sql.gz --remote --file backup.sql.gz
gunzip backup.sql.gz

# 2. กู้ลงฐาน "ใหม่" เสมอ — ห้ามรันทับฐาน production ที่ยังมีข้อมูลอยู่
npx wrangler d1 create tarot-app-db-restore
npx wrangler d1 execute tarot-app-db-restore --remote --file backup.sql

# 3. เทียบจำนวนแถวกับตารางใน step summary ของรอบสำรองนั้น
npx wrangler d1 execute tarot-app-db-restore --remote --command "SELECT count(*) FROM users"
```

4. เปลี่ยน `database_id` ของ `APP_DB` ใน `wrangler.jsonc` เป็นฐานใหม่แล้วเปิด PR ตามปกติ
   (ไฟล์สำรองมีตาราง `d1_migrations` ติดมา `db:migrate` ตอน deploy จึงรันเฉพาะ migration ที่ใหม่กว่าไฟล์สำรอง)
5. ข้อมูลหลังเวลาสำรองหายไป — เทียบรายการจ่ายเงินกับ Stripe / Omise ช่วงนั้นด้วยมือ แล้วบันทึก incident ตามข้อ 8.4
6. ⚠️ บัญชีที่ผู้ใช้สั่งลบ**หลัง**เวลาสำรองจะกลับมาในฐานที่กู้ — ระบบยังไม่มีบันทึกการลบให้ลบซ้ำอัตโนมัติ
   หน้านโยบายความเป็นส่วนตัวข้อ 3 สัญญาว่าใช้สำเนาเพื่อกู้ระบบเท่านั้นและสำเนาหมดอายุใน 35 วัน — ถ้ากู้จริงต้องไล่ลบคำขอลบช่วงนั้นซ้ำ

---

## 🗺️ 9. สิ่งที่ตั้งไว้บน Dashboard และไม่ได้อยู่ในไฟล์ config (R-18)

`wrangler.jsonc` ไม่ได้ประกาศ `routes` หรือ `custom_domain` ไว้เลย — สองอย่างนี้ถูกตั้งด้วยมือ
บน Cloudflare Dashboard ตอนผูกโดเมน ถ้าย้ายบัญชีหรือสร้าง Worker ใหม่ **จะไม่มีอะไรบอกว่าต้องตั้งอะไรบ้าง**
รายการที่ต้องตั้งซ้ำอยู่ที่ [`docs/PENDING_SETUP.md`](PENDING_SETUP.md) หัวข้อ "ค่าที่อยู่บน Dashboard เท่านั้น"
