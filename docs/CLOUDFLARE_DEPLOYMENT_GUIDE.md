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

เว็บนี้เป็น **SSG ล้วน** (ทุกหน้า prerender ตอน build · ไม่มี `export const revalidate` · ไม่มี `revalidateTag()` / `revalidatePath()` ที่ไหนเลย) จึงใช้ OpenNext edge caching แบบ **มินิมอล** — แค่ KV + cache interception พอ

| Binding | ประเภท | หน้าที่ |
| :--- | :--- | :--- |
| `NEXT_INC_CACHE_KV` | KV Namespace | เก็บ HTML/RSC ของหน้า SSG ทั้งหมด (seed ตอน deploy) |
| `ASSETS` | Static Assets | ภาพไพ่ 1909, `_next/static` |

config อยู่ใน [`wrangler.jsonc`](../wrangler.jsonc) + [`open-next.config.ts`](../open-next.config.ts)
`enableCacheInterception: true` ทำให้หน้า SSG ตอบจาก KV ที่ edge โดยไม่ boot Next runtime (ยืนยันด้วย header `x-opennext-cache: HIT`)

> 💡 **ถ้าวันหน้าเพิ่ม ISR / on-demand revalidation** ต้องเติม `d1TagCache` + `doQueue` ใน `open-next.config.ts`
> พร้อม binding `NEXT_TAG_CACHE_D1` (D1) + `NEXT_CACHE_DO_QUEUE` (Durable Object) + `WORKER_SELF_REFERENCE` ใน `wrangler.jsonc`
> — ดูตัวอย่างเต็มใน git history PR #19

### สร้าง resource ครั้งแรก (ทำครั้งเดียวต่อบัญชี)

> ⚠️ **binding เพิ่มผ่านหน้า dashboard ไม่ติด** — `wrangler deploy` เขียนทับ config ของ Worker
> ด้วย `wrangler.jsonc` ทุกครั้ง ต้องแก้ที่ไฟล์เท่านั้น

```bash
# KV — เอา id ที่ได้ไปใส่ wrangler.jsonc > kv_namespaces[0].id
npx wrangler kv namespace create NEXT_INC_CACHE_KV
```

> ✅ resource ปัจจุบัน (บัญชี `bankjack10452@gmail.com`): KV `3b06e256c46948949fc17ac6641cafa3`

### สิทธิ์ของ API Token (CI)

`CLOUDFLARE_API_TOKEN` ใน GitHub Secrets ต้องมี **2 อย่าง** (เดิมมีแค่ตัวแรก):

- **Account › Workers Scripts › Edit**
- **Account › Workers KV Storage › Edit**  ← เพิ่มใหม่ (จำเป็นตอน populateCache seed หน้าลง KV)

ถ้าขาด ขั้น `opennextjs-cloudflare deploy` จะ fail แบบระบุชัดว่าขาดสิทธิ์อะไร

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

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put TAROT_SESSION_SECRET   # openssl rand -hex 32 — จำเป็น! ไม่งั้น Provably-Fair ใช้ค่า default ที่ทุกคนรู้
npx wrangler secret put AUTH_SECRET            # openssl rand -hex 32 — สำหรับเข้ารหัส JWT Session ของผู้ใช้
npx wrangler secret put PASSWORD_PEPPER        # openssl rand -hex 32 — สำหรับ Server-side Pepper แฮชรหัสผ่าน
npx wrangler secret put RESEND_API_KEY         # API Key จาก Resend.com สำหรับส่งอีเมลยืนยันตัวตนและรีเซ็ตรหัสผ่าน
npx wrangler secret put EMAIL_FROM             # แม่หมอลูมินัย <noreply@tarot.luminuy.com>
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

> `npm run deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`
> ขั้น `deploy` จะ **populateCache** ก่อน: seed หน้า SSG ทั้งหมดลง KV
> แล้วจึง `wrangler deploy` (ปกติทำผ่าน GitHub Actions อยู่แล้ว)

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
- [ ] หน้า `/spreads` แสดงผังทั้ง 20 รูปแบบครบถ้วน
- [ ] ทดลองเปิดไพ่และสตรีมคำทำนายจากแม่หมอ AI ไหลลื่นไม่มีสะดุด
- [ ] หน้า `/privacy` สามารถดาวน์โหลดสำเนา JSON และสั่งลบข้อมูลได้ตามมาตรฐาน PDPA
- [ ] แผงแอดมิน `/admin` แสดงตัวเลขโควตา AI ประจำวันและสถานะ Rate Limit Bypass

