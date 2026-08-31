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

## 🚀 2. ขั้นตอนการ Deploy สู่ Cloudflare Workers (Step-by-Step)

### ขั้นที่ 1: เข้าสู่ระบบ Cloudflare ผ่าน Terminal
เปิด Terminal ในโฟลเดอร์โปรเจกต์ แล้วรันคำสั่ง:
```bash
npx wrangler login
```
*(เบราว์เซอร์จะเปิดขึ้นมา ให้กดปุ่ม **Allow / Authorize** เพื่อยืนยัน)*

---

### ขั้นที่ 2: ตั้งค่า API Key, Secrets และ Cloudflare Edge Resources (สำคัญมาก ⚠️)
ตั้งค่า Key สำหรับให้ AI แม่หมอ และเตรียม Cloudflare Bindings ให้ระบบแคชระดับ Global:

```bash
# 1. ใส่ Gemini API Key & Stateless Session Secret
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put TAROT_SESSION_SECRET

# 2. สร้าง KV Namespace สำหรับ Global Incremental Static Regeneration (ISR)
npx wrangler kv namespace create tarot-inc-cache-kv
# (นำ id ที่ได้ไปใส่ใน wrangler.jsonc ที่ช่อง id ของ NEXT_INC_CACHE_KV)

# 3. สร้าง D1 Database สำหรับ Next.js On-Demand Tag Revalidation & Provably-Fair Audit
npx wrangler d1 create tarot-tag-cache-d1
# (นำ database_id ที่ได้ไปใส่ใน wrangler.jsonc ที่ช่อง database_id ของ NEXT_TAG_CACHE_D1)
```

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

## 🧪 6. Checklist ตรวจสอบความพร้อมหลัง Deploy

- [ ] หน้าแรก `/` โหลดเร็ว ไพ่ 78 ใบแสดงครบถ้วน
- [ ] หน้า `/cards` และหน้ารายใบ `/cards/major-00` แสดงผลสมบูรณ์
- [ ] หน้า `/spreads` แสดงผังทั้ง 20 รูปแบบครบถ้วน
- [ ] ทดลองเปิดไพ่และสตรีมคำทำนายจากแม่หมอ AI ไหลลื่นไม่มีสะดุด
- [ ] หน้า `/privacy` สามารถกดลบข้อมูล LocalStorage ได้ตามมาตรฐาน PDPA
