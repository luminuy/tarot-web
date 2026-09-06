# 🖼️ แผนแก้ท่อสื่อและกับดักที่เหลือ — ตรวจหลัง PR #319–#325 (2026-09-06)

> **สถานะ**: แผน (ยังไม่ลงมือ) · **ฐานที่ตรวจ**: `a72968b` (main หลัง #325) · **ผู้ตรวจ**: Claude Opus 5
> **ผลตรวจย่อ**: `repo:verify` 34/34 ผ่าน · build prerender 167 routes · เฟส 1 Cloudflare ทำงานครบ ·
> **ImageKit ถูกต้อง 100%** · **แต่เจอบั๊กที่ผู้ใช้เห็นจริง 1 ตัวในท่อภาพแชร์ Cloudinary**
>
> เอกสารนี้เขียนขึ้นเพื่อส่งต่อให้ทีมถัดไปลงมือ — ทุกหัวข้อมีหลักฐานที่วัดจริง คำสั่งทำซ้ำได้
> โค้ด before/after และเกณฑ์ผ่านรายข้อ

---

## 0. สรุปผู้บริหาร (อ่านแค่ตารางนี้ก็พอ)

| # | เรื่อง | ความรุนแรง | ผลกระทบที่วัดได้ | แรงที่ใช้ |
| :-- | :--- | :-- | :--- | :-- |
| **M-01** | ภาพแชร์ Cloudinary ปั๊มตัวหนังสือ**ทับข้อความที่มีอยู่แล้ว**ใน `og/default.png` | 🔴 Critical | ทุกลิงก์แชร์อ่านไม่ออก (เห็นจริงในภาพที่เจนออกมา) | 1 ไฟล์ |
| **M-02** | Cloudinary **แทนที่** ภาพไพ่จริงของผู้ใช้ (`/api/share/image/<id>`) | 🔴 Critical | คนแชร์ไม่เห็นไพ่ที่ตัวเองเปิดได้อีกแล้ว ทุกคนได้ภาพเดียวกันหมด | 1 บรรทัด |
| **M-03** | ImageKit เป็น **จุดพังเดี่ยว** ไม่มีทางถอยกลับ origin | 🟠 High | โควตาฟรีหมด/บัญชีมีปัญหา = ภาพไพ่ทั้งเว็บหายพร้อมกัน | ปานกลาง |
| **M-04** | `.env.example` สอนวิธีตั้งค่า `NEXT_PUBLIC_*` **ผิด** | 🟡 Medium | คนต่อไปตั้งค่าตามแล้วไม่มีผล เสียเวลาไล่หา (เกิดแล้วกับ INC-0092) | 6 บรรทัด |
| **M-05** | `CACHE_VERSION` ใน `sw.js` ฮาร์ดโค้ด `v1.0.0` | 🟡 Medium | ไฟล์ที่ไม่มี hash (ไอคอน/ฟอนต์/`offline.html`) ค้างในเครื่องผู้ใช้ถาวร | เล็ก |
| **M-06** | `/api/search` เป็น endpoint กำพร้าที่ยังเปิดรับคำขอ | 🔵 Low | เผาโควตา Workers AI โดยไม่มีผู้ใช้จริงได้ประโยชน์ | ต้องตัดสินใจก่อน |

**ลำดับที่แนะนำ**: M-02 → M-01 (PR เดียวกันได้) → M-04 → M-03 → M-05 → M-06

---

## 1. หลักฐานที่วัดจริง (ทำซ้ำได้ทุกเครื่อง)

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/131.0 Safari/537.36'

# ImageKit — ถูกต้อง ไม่ต้องแก้
curl -s https://seertarot.net/cards -H "User-Agent: $UA" | grep -c 'ik\.imagekit\.io'   # 480
curl -s https://seertarot.net/cards -H "User-Agent: $UA" | grep -cE 'src="/cards/'       # 0

# หน้า SSG — ถูกต้อง ไม่ต้องแก้
curl -sI https://seertarot.net/cards -H "User-Agent: $UA" | grep -i x-opennext-cache      # HIT

# เฟส 1 Cloudflare — ถูกต้อง ไม่ต้องแก้
curl -s -o /dev/null -w '%{http_code}\n' https://seertarot.net/wp-login.php -H "User-Agent: $UA"  # 403
```

**ตัวเลขที่ยืนยันแล้วว่า "ปกติ"** (อย่าเสียเวลาตรวจซ้ำ):

| รายการ | ผล |
| :--- | :--- |
| `npm run repo:verify` | 34/34 ผ่าน |
| `npm run build` → prerender | 167 routes · หน้าเว็บ dynamic เหลือ 5 (`/readers`, `/readers/[id]`, `/readers/queue/[id]`, `/s/[id]`, `/_not-found`) |
| middleware | ไม่มี (ถูกต้อง — ดู INC-0091) |
| `<picture>` ในหน้า `/cards` | 80 ตัว มี `srcset` ครบ 5 ขนาด + `sizes` |
| ImageKit ทุก variant | `w64` 2,392B · `w128` 8,060B · `w256` 32,764B · `w512b` 85,392B · `w768b` 134,606B (ตอบ 200 ทั้งหมด) |
| ImageKit format negotiation | ส่ง `Accept: image/webp` ได้ webp · ไม่ส่งได้ jpeg (ถูกต้อง) |
| Service Worker | `/api/`, `/admin`, `/account`, console, queue = network-only · HTML = network-first |
| Speculation Rules | ไม่กินโควตา (`/daily` ไม่มี auto-fetch · `/api/reading/start` ถูกเรียกจาก `TarotFlow` ที่ผู้ใช้กดเท่านั้น) |

---

## 2. M-01 · ภาพแชร์ Cloudinary ตัวหนังสือทับกัน 🔴

### ปัญหา

[`src/lib/media/cloudinary.ts`](../../src/lib/media/cloudinary.ts) ประกอบภาพโดยใช้
`https://seertarot.net/og/default.png` เป็น**พื้นหลัง** แล้วปั๊มข้อความทับลงไป:

```ts
const transforms = [
  "w_1200,h_630,c_fill,b_rgb:FAF7F2",
  `l_text:Arial_28_bold:${safeSpread},co_rgb:8F5C1A,g_north_west,x_80,y_80`,   // ← ทับ
  `l_text:Arial_42_bold:${safeTitle},co_rgb:29261F,g_north_west,x_80,y_130`,   // ← ทับ
  "f_auto,q_auto",
];
```

แต่ `og/default.png` (1200×630) **มีข้อความของตัวเองอยู่แล้ว** — โลโก้ "SeerTarot",
บรรทัด "ดูดวงไพ่ทาโรต์ 1909 Rider-Waite" และสโลแกน — วางอยู่ในโซนซ้ายบนพอดีกับ
`x_80,y_80` และ `x_80,y_130` ที่โค้ดปั๊มลงไป

**ผลจริงที่เจนออกมา** (ยิง URL ที่โค้ด production สร้าง แล้วเปิดดูภาพ):
บรรทัด `คำทำนายไพ่ยิปซี ความรัก` ที่ปั๊มลงไป **ซ้อนทับกับ** ข้อความเดิมของภาพพื้นหลัง
จนอ่านไม่ออกทั้งสองชั้น

> ✅ ข่าวดี: **ฟอนต์ไทยเรนเดอร์ได้** — Cloudinary หาฟอนต์แทน `Arial` ที่มีอักขระไทยให้เอง
> ปัญหาคือ**ตำแหน่ง** ล้วน ๆ ไม่ใช่เรื่องฟอนต์

### วิธีทำซ้ำ

```bash
npx tsx -e '
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "xtgpasdc";
import("./src/lib/media/cloudinary").then(m =>
  console.log(m.buildCloudinaryShareImageUrl({ title: "คำทำนายไพ่ยิปซี ความรัก", spreadName: "ผัง 3 ใบ" }))
);'
# เอา URL ที่ได้ไปเปิดในเบราว์เซอร์ — จะเห็นข้อความซ้อนกัน
```

### ทางแก้ (เลือกทางใดทางหนึ่ง)

**ทาง ก (แนะนำ) — ใช้พื้นหลังเปล่า ไม่ใช้ `og/default.png`**

`og/default.png` ถูกออกแบบมาให้เป็นภาพสำเร็จรูปอยู่แล้ว ไม่ได้ออกแบบมาเป็นผืนผ้าใบเปล่า
ให้เปลี่ยนไปสร้างพื้นหลังจาก Cloudinary เองแล้ววางไพ่ + ข้อความในโซนที่ว่างจริง:

```ts
// สร้างผืนผ้าใบเปล่าสีไหมทอง แล้วปั๊มทุกอย่างเอง (ไม่ต้องมีภาพตั้งต้น)
const transforms = [
  "w_1200,h_630,c_pad,b_rgb:FAF7F2",
  `l_text:Arial_30_bold:${safeSpread},co_rgb:8F5C1A,g_north_west,x_80,y_90`,
  `l_text:Arial_54_bold:${safeTitle},co_rgb:29261F,g_north_west,x_80,y_150,w_720,c_fit`,
  "l_text:Arial_26:seertarot.net,co_rgb:8F5C1A,g_south_west,x_80,y_70",
  "f_auto,q_auto",
];
return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join("/")}/sample`;
```

⚠️ ต้องเปลี่ยน delivery type จาก `image/fetch/.../<url>` เป็น `image/upload/.../<public_id>`
และเตรียม public_id พื้นหลังไว้ในบัญชี Cloudinary (หรือใช้ `c_pad` บนภาพ 1×1 ก็ได้)

**ทาง ข — คงพื้นหลังเดิม แต่ย้ายข้อความลงโซนว่าง**

ถ้าอยากคงแบรนด์ในภาพเดิมไว้ ให้ปั๊มข้อความในครึ่งล่างที่ยังว่าง:

```ts
`l_text:Arial_40_bold:${safeTitle},co_rgb:29261F,g_south_west,x_80,y_120,w_620,c_fit`,
`l_text:Arial_26:${safeSpread},co_rgb:8F5C1A,g_south_west,x_80,y_80`,
```

⚠️ ต้องเปิดภาพที่เจนออกมา**ดูด้วยตาจริงทุกครั้ง** — เกณฑ์ผ่านข้อนี้ตรวจด้วย HTTP 200 ไม่ได้
(ของเดิมก็ตอบ 200 ทั้งที่ภาพพัง)

### เกณฑ์ผ่าน

- เจนภาพจาก 3 กรณี: หัวข้อสั้น (10 ตัวอักษร) · หัวข้อยาวเต็ม 60 ตัวอักษร · ไม่มี `meta` (ใช้ค่า default)
- **เปิดดูด้วยตาทั้ง 3 ภาพ** — ต้องไม่มีข้อความซ้อนทับกัน และตัวอักษรไทยต้องมีสระ/วรรณยุกต์ครบ
- ข้อความยาวต้องตัดบรรทัดหรือย่อ ไม่ล้นออกนอกเฟรม 1200×630
- แนบภาพที่เจนได้ลงใน PR เพื่อให้ผู้รีวิวเห็น

---

## 3. M-02 · Cloudinary แย่งที่ภาพไพ่จริงของผู้ใช้ 🔴

### ปัญหา

[`src/app/s/[id]/page.tsx:41`](../../src/app/s/[id]/page.tsx)

```ts
const imageUrl = cloudinaryUrl || (ID_RE.test(id) ? `${SITE_ORIGIN}/api/share/image/${id}` : `${SITE_ORIGIN}/cards/major-01.jpg`);
```

`cloudinaryUrl` มาก่อน แปลว่าเมื่อตั้ง `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` แล้ว
**ภาพไพ่จริงที่ผู้ใช้เปิดได้จะไม่ถูกใช้อีกเลย**

ของเดิม [`/api/share/image/<id>`](../../src/app/api/share/image/[id]/route.ts) เสิร์ฟภาพที่
client canvas ประกอบไว้แล้วเก็บใน R2 — เป็นภาพ**ไพ่ของคนคนนั้นจริง ๆ** ซึ่งเป็นเหตุผลทั้งหมด
ที่คนอยากแชร์ · ตอนนี้ทุกคนได้ภาพพื้นหลังเดียวกันหมด คุณค่าของการแชร์หายไป

### ทางแก้

สลับลำดับ — ให้ภาพจริงมาก่อน แล้วใช้ Cloudinary เป็นทางถอยเมื่อ**ไม่มีภาพจริง**:

```ts
// ก่อน
const imageUrl = cloudinaryUrl || (ID_RE.test(id) ? `${SITE_ORIGIN}/api/share/image/${id}` : `${SITE_ORIGIN}/cards/major-01.jpg`);

// หลัง
const hasRealShareImage = ID_RE.test(id) && Boolean(meta);
const imageUrl = hasRealShareImage
  ? `${SITE_ORIGIN}/api/share/image/${id}`
  : (cloudinaryUrl ?? `${SITE_ORIGIN}/og/default.png`);
```

พร้อมแก้ `width`/`height` ให้ตรงกับภาพที่เลือกจริง (ของเดิมผูกกับ `cloudinaryUrl` อยู่):

```ts
width: hasRealShareImage ? 1080 : 1200,
height: hasRealShareImage ? 1350 : 630,
```

> 💡 `meta` ถูกอ่านมาแล้วในบรรทัดที่ 32 (`readMeta(id)`) ซึ่งอ่านจาก R2 คีย์ `${id}.json`
> ถ้ามี meta แปลว่ามีภาพจริงคู่กันอยู่ใน bucket จึงใช้เป็นตัวชี้วัดได้เลย ไม่ต้องยิงเช็กเพิ่ม

### เกณฑ์ผ่าน

- เปิดไพ่จริง 1 ครั้ง → กดแชร์ → เอา URL `/s/<id>` ไปวางใน
  [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) และ LINE
- ต้องเห็น **ไพ่ที่เปิดได้จริง** ไม่ใช่ภาพพื้นหลังกลาง
- เปิด `/s/<id ที่ไม่มีอยู่จริง>` → ต้องได้ภาพ Cloudinary หรือ `og/default.png` โดยไม่ error

---

## 4. M-03 · ImageKit เป็นจุดพังเดี่ยว 🟠

### ปัญหา

[`.github/workflows/deploy.yml:95`](../../.github/workflows/deploy.yml)

```yaml
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: ${{ secrets.… || vars.… || 'https://ik.imagekit.io/seertarotweb' }}
```

ค่า default ถูกฮาร์ดโค้ดไว้ แปลว่า**ทุก build จะชี้ไป ImageKit เสมอ** แม้ไม่มี secret
และ [`src/lib/tarot/card-image.ts`](../../src/lib/tarot/card-image.ts) ไม่มีทางถอยกลับ origin

ImageKit ฟรี = แบนด์วิดท์ **25 GB/เดือน** · ถ้าเต็มหรือบัญชีมีปัญหา
**ภาพไพ่ทั้งเว็บหายพร้อมกันทุกหน้า** โดยไม่มีอะไรรองรับ

### ทางแก้ (2 ชั้น ทำได้ทั้งคู่)

**ชั้นที่ 1 — ให้ปิดสวิตช์ได้เร็ว**

ถอดค่า default ที่ฮาร์ดโค้ดออกจาก `deploy.yml` ให้เหลือ `|| ''`
เวลาเกิดปัญหาจะ**ลบตัวแปรแล้ว deploy ใหม่** ก็กลับมาเสิร์ฟจาก origin ทันที
(โค้ดใน `getCardImageSrc()` รองรับกรณี endpoint ว่างอยู่แล้ว)

**ชั้นที่ 2 — ทางถอยฝั่งเบราว์เซอร์**

[`src/components/card/CardImage.tsx`](../../src/components/card/CardImage.tsx) มี prop `onError`
อยู่แล้วแต่ไม่ได้ใช้กับกรณีนี้ · เพิ่มให้ `<img>` ถอยไป path ใน origin เมื่อ ImageKit ล้ม:

```tsx
onError={(e) => {
  const el = e.currentTarget;
  if (el.dataset.fellBack) return;      // กัน loop
  el.dataset.fellBack = "1";
  el.src = getCardImageSrc(image, cardId, { forceLocal: true })!;
  onError?.();
}}
```

⚠️ `<source srcSet>` ใน `<picture>` **ไม่ยิง `onError`** — ถ้า webp จาก ImageKit ล้ม
เบราว์เซอร์จะถอยมาที่ `<img src>` เอง ซึ่งก็ยังชี้ ImageKit อยู่ จึงต้องแก้ที่ `<img>` เป็นหลัก

### เกณฑ์ผ่าน

- บล็อก `ik.imagekit.io` ใน DevTools (Network → Block request domain) แล้วรีเฟรช `/cards`
- ภาพไพ่ต้องยังขึ้นครบ 78 ใบ (จาก origin) ไม่มีกรอบว่าง
- `npm run repo:verify` ผ่าน (ด่านที่ 7 ตรวจ path ภาพไพ่)

---

## 5. M-04 · `.env.example` สอนวิธีตั้ง `NEXT_PUBLIC_*` ผิด 🟡

### ปัญหา

[`.env.example:95,101`](../../.env.example)

```
#    - Production: npx wrangler secret put NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
#    - Production: npx wrangler secret put NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```

**ผิด** — ตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_` ถูก **inline ตอน build** ไม่ได้อ่านตอนรันไทม์
ตั้งเป็น Worker secret ไปก็ไม่มีผลใด ๆ ทั้งสิ้น ต้องตั้งที่ **GitHub Secrets/Variables**
เพื่อให้ค่าเข้าไปตอน `pnpm run deploy` ใน CI เท่านั้น

นี่คือกับดักเดียวกับที่ทำให้เสียเวลาไล่หาใน **INC-0092** (ตั้ง secret แล้วไม่มีผล
เพราะเข้าใจกลไกผิด) จึงต้องแก้เอกสารไม่ให้คนต่อไปเดินซ้ำรอย

### ทางแก้

```
# ⚠️ NEXT_PUBLIC_* ถูก inline ตอน build — ตั้งเป็น Worker secret ไม่มีผล
#    Production: GitHub → Settings → Secrets and variables → Actions
#    (deploy.yml อ่านค่าไปใส่ตอน build ให้เอง)
```

**เกณฑ์ผ่าน**: ไล่ทุกบรรทัดใน `.env.example` ที่ขึ้นต้น `NEXT_PUBLIC_` แล้วแก้คำอธิบายให้ตรงกันหมด

---

## 6. M-05 · `CACHE_VERSION` ใน `sw.js` ฮาร์ดโค้ด 🟡

### ปัญหา

[`public/sw.js:11`](../../public/sw.js)

```js
const CACHE_VERSION = "v1.0.0";
```

static asset ใช้กลยุทธ์ **cache-first แบบไม่มีวันหมดอายุ** — ถ้าไม่บัมป์เวอร์ชัน
ไฟล์เก่าจะอยู่ในเครื่องผู้ใช้ตลอดไป

- ✅ `/_next/static/*` ปลอดภัย เพราะชื่อไฟล์มี hash เปลี่ยนทุก build
- ❌ `/icons/*`, `/offline.html`, ฟอนต์, `manifest.webmanifest` **ไม่มี hash**
  → แก้ไฟล์พวกนี้แล้วผู้ใช้เดิมจะไม่เห็นของใหม่เลยจนกว่าจะบัมป์เวอร์ชันด้วยมือ

### ทางแก้

ให้เวอร์ชันผูกกับ build อัตโนมัติ แทนการพึ่งวินัยคน — ทางที่ง่ายที่สุดคือให้ขั้น build
เขียนทับค่าในไฟล์ (เพิ่มใน `package.json` ก่อน `opennextjs-cloudflare build`):

```bash
node -e "const f='public/sw.js',fs=require('fs');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/CACHE_VERSION = \"[^\"]*\"/, 'CACHE_VERSION = \"'+Date.now()+'\"'))"
```

หรือถ้าไม่อยากแตะ build pipeline: เพิ่มด่านตรวจที่เตือนเมื่อไฟล์ใน `public/icons/`
หรือ `public/offline.html` เปลี่ยนแต่ `CACHE_VERSION` ไม่เปลี่ยนใน commit เดียวกัน

**เกณฑ์ผ่าน**: แก้ `public/offline.html` แล้ว deploy → เปิดเว็บด้วยเบราว์เซอร์ที่เคยเข้ามาก่อน
(ไม่ล้างแคช) ต้องเห็นเนื้อหาใหม่

---

## 7. M-06 · `/api/search` เป็น endpoint กำพร้า 🔵

### สภาพปัจจุบัน

[`src/app/api/search/route.ts`](../../src/app/api/search/route.ts) เรียก Vectorize + Workers AI
embeddings แต่ **ไม่มีโค้ดฝั่งหน้าเว็บเรียกเลยสักที่**

```bash
grep -rn "api/search" src/ --include='*.tsx'   # ไม่มีผลลัพธ์
```

สาเหตุ: PR #248 ย้าย `RelatedCards` ไปเรนเดอร์ฝั่งเซิร์ฟเวอร์แล้ว (ตาม `SITE_SHELL_SEO_PLAN.md`)
แต่ไม่ได้ปิด endpoint เดิม · ตอนนี้มีแค่ด่านตรวจ origin กันไว้ชั้นเดียว
ทุกคำขอที่หลุดเข้ามาจะเผาโควตา Workers AI (ฟรี ~10,000 neurons/วัน)

### ต้องตัดสินใจก่อนลงมือ

| ทางเลือก | ทำอะไร | ผลข้างเคียง |
| :--- | :--- | :--- |
| **ก. ปิดทิ้ง** | ลบ route + `src/lib/search/vectorize.ts` + ด่านที่ 24 ใน `repo:verify` + binding `vectorize` ใน `wrangler.jsonc` | เสียความสามารถค้นหาเชิงความหมายถ้าวันหน้าอยากใช้ |
| **ข. ต่อ UI จริง** | ทำช่องค้นหาเชิงความหมายในหน้า `/cards` หรือ `/blog` ให้เรียกมันจริง | เพิ่มการใช้ Workers AI ต่อ pageview |
| **ค. คงไว้เฉย ๆ** | ไม่ทำอะไร | โค้ดตายสะสม + Agent ตัวถัดไปสับสนว่าใช้ทำอะไร |

> ⚠️ **ห้ามลบโดยพลการ** — ด่านที่ 24 (`🔎 corpus ค้นหาเชิงความหมาย`) ใน `repo:verify`
> คุ้มครองฟีเจอร์นี้อยู่ แปลว่ามีคนตั้งใจเก็บไว้ · ต้องได้คำตอบจากเจ้าของโปรเจกต์ก่อน

---

## 8. สิ่งที่ตรวจแล้ว "ไม่พบปัญหา" (อย่าเสียเวลาตรวจซ้ำ)

| รายการ | ผลตรวจ |
| :--- | :--- |
| ImageKit `srcset`/`sizes` | ถูกต้องตามกฎข้อ 8 · 80 `<picture>` ครบ 5 variant |
| ImageKit ทุกไฟล์ variant | ตอบ 200 ทั้ง `w64`/`w128`/`w256`/`w512b`/`w768b` |
| `content-type: image/jpeg` ตอนไม่ส่ง `Accept` | **ไม่ใช่บั๊ก** — เป็น format negotiation ปกติของ ImageKit |
| ภาพไพ่ยังอยู่บน Cloudflare ไหม | ไม่มีแล้ว (ชี้ ImageKit 480 ครั้ง · origin 0 ครั้ง) |
| Service Worker แคชสถานะล็อกอิน/โควตา | ไม่แคช (`/api/`, `/admin`, `/account`, console, queue = network-only) |
| Service Worker เสิร์ฟ HTML ค้าง | ไม่ — เป็น network-first (คอมเมนต์เขียนว่า SWR แต่โค้ดจริงปลอดภัยกว่านั้น) |
| Speculation Rules กินโควตาดูดวง | ไม่ — `/daily` ไม่มี auto-fetch · `/api/reading/start` เรียกจาก `TarotFlow` ที่ผู้ใช้กดเท่านั้น |
| งาน SSG / Upstash ถูกแตะไหม | ไม่ — `redis.ts`, `kv-counter.ts`, `store.ts`, `ai-budget.ts`, `i18n/*` ไม่ถูกแก้เลยหลัง #317 |
| `proxy.ts` / `getServerLocale` กลับมาไหม | ไม่ (ด่านที่กลับด้านไว้ตาม INC-0091 ยังคุมอยู่) |
| เฟส 1 Cloudflare | WAF 403 ครบ · `cf-cache-status: HIT` · `h3=":443"` · `x-opennext-cache: HIT` ทุกหน้า |

---

## 9. หมายเหตุถึงทีมที่รับไปทำ

1. **M-01 ตรวจด้วย HTTP status ไม่ได้** — ภาพที่พังก็ตอบ 200 ต้องเปิดดูด้วยตาเสมอ
   และแนบภาพลงใน PR
2. **ทำ M-02 ก่อน M-01 ได้** — M-02 แก้บรรทัดเดียวและคืนคุณค่าให้ผู้ใช้ทันที
   ส่วน M-01 ต้องลองเจนภาพหลายรอบ
3. อย่าลืมกฎข้อ 13 — เปิด PR ด้วย `npm run pr:auto` เท่านั้น (push เฉย ๆ = งานค้าง ไม่มี CI/deploy)
4. ทุกข้อในเอกสารนี้ทดสอบบน `main` ที่ `a72968b` ถ้า main ขยับไปไกลแล้วให้วัดฐานใหม่ก่อน
