# 🖼️ แผนส่งต่อ — ยกเครื่องภาพแชร์ทั้งเว็บ 299 หน้า (OG Image Overhaul)

> **สถานะ**: ✅ **ปิดครบทุกข้อแล้ว** (OG-01 ถึง OG-06) — ลงมือใน PR #348 (Antigravity AI)
> และตามด้วยการกู้สายพาน deploy ที่ค้างเพราะ CI ไม่ได้ส่งตัวแปร Cloudinary ให้ด่านตรวจ
> ผลจริงหลังปิดงาน: ภาพแชร์ที่ไม่ซ้ำกัน **299 ค่า** จาก 309 หน้า · ด่านที่ 36 บังคับอยู่ถาวร
> **ฐานที่ตรวจ**: `a55825a` (main หลัง PR #345) · **ผู้ตรวจและเขียนแผน**: Claude Opus 5 · **วันที่**: 2026-09-07
> **ที่มา**: เจ้าของโปรเจกต์ถามว่า "เพิ่มขีดความสามารถเรื่องรูปได้ไหม เราเอาแอปนอกมาช่วยตั้งสองตัว"
>
> **คำตอบสั้น**: ได้ และคุ้มมาก — ตอนนี้เราจ่ายค่าบริการนอก 2 ตัว (ImageKit + Cloudinary)
> แต่ใช้ Cloudinary อยู่ **จุดเดียวในเว็บ** และเป็นแค่ตัวสำรอง ทั้งที่มันทำภาพแชร์
> ให้ครบทั้ง 299 หน้าได้ฟรีโดยไม่ต้องเพิ่มไฟล์ในรีโปสักไบต์
>
> ⚠️ **ห้ามข้าม OG-01** — ตอนนี้ตัวประกอบภาพของ Cloudinary **พังทันที (HTTP 400)**
> เมื่อหัวข้อมีเครื่องหมาย `,` หรือ `/` ซึ่งเจอบ่อยมากในชื่อบทความและชื่อไพ่
> ถ้าเอาไปใช้กับ 299 หน้าโดยไม่แก้ก่อน จะได้หน้าที่ภาพแชร์หายไปเงียบ ๆ เป็นร้อยหน้า

---

## 0. สรุปผู้บริหาร (อ่านแค่ตารางนี้ก็พอ)

| # | เรื่อง | ความรุนแรง | ผลกระทบที่วัดได้ | แรงที่ใช้ |
| :-- | :--- | :-- | :--- | :-- |
| **OG-01** | ตัวประกอบภาพ Cloudinary ตอบ **400** เมื่อหัวข้อมี `,` หรือ `/` | 🔴 Blocker | ภาพแชร์หายทั้งหน้า (ไม่มี error ให้เห็น) · ต้องแก้ก่อนทำข้ออื่นทุกข้อ | 1 ไฟล์ |
| **OG-02** | หน้าไพ่ 156 หน้า ใช้ภาพไพ่**แนวตั้ง**เป็นภาพแชร์ และประกาศขนาดผิด | 🔴 Critical | เฟซ/ไลน์ครอปกลางภาพจนเหลือแค่ท่อนตัว ไม่มีชื่อไพ่ ไม่มีแบรนด์ | 1 ไฟล์ |
| **OG-03** | 4 หน้า (`/daily`, `/love/1-card` × 2 ภาษา) ใช้ **WebP แนวตั้ง** เป็นภาพแชร์ | 🔴 Critical | ครอปเหมือน OG-02 + เสี่ยงแพลตฟอร์มไม่เรนเดอร์ WebP เลย | 2 ไฟล์ |
| **OG-04** | 139 หน้าที่เหลือใช้ `og/default.png` **ใบเดียวกันทั้งหมด** | 🟠 High | บทความ 52 หน้า · หน้าผัง 52 หน้า · หมวดไพ่ 12 หน้า แชร์แล้วหน้าตาเหมือนกันเป๊ะ CTR ตาย | 8 ไฟล์ |
| **OG-05** | ไม่มีตัวช่วยกลาง ทุกหน้าเขียน `images: [...]` ด้วยมือ | 🟠 High | ต้นเหตุของ OG-02/03 ทั้งคู่ · ไม่มีด่านตรวจ = จะเกิดซ้ำแน่นอน | ไฟล์ใหม่ + ด่านใหม่ |
| **OG-06** | ตัดหัวข้อยาวแบบดิบ ๆ ที่ 60 ตัวอักษร ไม่มี `…` | 🟡 Medium | หัวข้อขาดกลางคำ อ่านแล้วเหมือนเว็บพัง | เล็ก |

**ลำดับที่บังคับ**: OG-01 → OG-05 → OG-02 + OG-03 → OG-04 → OG-06
(OG-01 ต้องมาก่อนเพราะเป็นบั๊กที่ทำให้ทุกข้อถัดไปพังเงียบ ๆ · OG-05 ต้องมาก่อน OG-02/03/04
เพราะเป็นท่อกลางที่ทั้งสามข้อจะเรียกใช้)

---

## 1. หลักฐานที่วัดจริง (ทำซ้ำได้ทุกเครื่อง)

### 1.1 สภาพภาพแชร์ปัจจุบันของทั้งเว็บ

```bash
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/131.0 Safari/537.36'
for u in /cards/major-19 /cards/major /spreads/celtic-cross /blog/tarot-love-reading-guide /daily /; do
  echo -n "$u -> "
  curl -s "https://seertarot.net$u" -H "User-Agent: $UA" \
    | grep -oE '<meta property="og:image" content="[^"]*"' | head -1
done
```

**ผลจริงที่ได้** (2026-09-07):

| กลุ่มหน้า | จำนวน | `og:image` ที่ส่งออกจริง | สัดส่วนภาพจริง | ประกาศไว้ว่า | ผลบนฟีด |
| :--- | --: | :--- | :--- | :--- | :--- |
| หน้าไพ่ `/cards/<id>` (ไทย+อังกฤษ) | **156** | `/cards/major-19.jpg` | **825×1429** (แนวตั้ง) | `300×520` ❌ | โดนครอปกลาง |
| `/daily`, `/love/1-card` (ไทย+อังกฤษ) | **4** | `/cards/w512b/major-19.webp` | **512×881** (แนวตั้ง) | `512×878` ❌ | โดนครอป + เสี่ยง WebP |
| ทุกหน้าที่เหลือ | **139** | `/og/default.png` | 1200×630 ✅ | `1200×630` ✅ | ถูกต้อง แต่**ซ้ำกันหมด** |
| **รวมใน `sitemap.xml`** | **299** | | | | |

```bash
curl -s https://seertarot.net/sitemap.xml | grep -c "<loc>"    # 299
```

### 1.2 หน้าไพ่ 156 หน้าถูกครอปเป็นอะไร — จำลองให้เห็นกับตา

แพลตฟอร์มโซเชียลบังคับสัดส่วน 1.91:1 ภาพไพ่เป็น 1:1.73 จึงถูกครอบตัดกลางเสมอ
จำลองผลลัพธ์ที่ผู้ใช้เห็นจริงได้ด้วยคำสั่งนี้:

```bash
curl -s -o /tmp/crop-demo.jpg \
  "https://res.cloudinary.com/xtgpasdc/image/fetch/w_1200,h_630,c_fill,g_center/f_auto,q_auto/https://seertarot.net/cards/major-19.jpg"
open /tmp/crop-demo.jpg
```

**สิ่งที่ได้**: ภาพระยะประชิดของเด็กเปลือยบนหลังม้า — **ไม่มีชื่อไพ่ ไม่มีชื่อเว็บ
ไม่มีคำอธิบาย ไม่มีบริบทใด ๆ** คนเลื่อนฟีดผ่านไม่มีทางรู้ว่าเป็นลิงก์อะไร
และภาพระยะนั้นสุ่มเสี่ยงต่อการถูกแพลตฟอร์มตีความผิดโดยไม่จำเป็น

> 📌 นี่คือสิ่งที่ [`src/lib/config/site.ts:27-28`](../../src/lib/config/site.ts) **เขียนห้ามไว้ตรง ๆ อยู่แล้ว**
> ว่า "ห้ามชี้ไปที่ภาพไพ่ใน `/cards/` เด็ดขาด" แต่ [`card-detail.tsx:79`](../../src/app/_shared/pages/card-detail.tsx)
> ทำแบบนั้นอยู่ทั้ง 156 หน้า — **กฎที่ไม่มีเครื่องตรวจ คือกฎที่ถูกละเมิดแน่นอน** (หลักการข้อ 0.8)

### 1.3 ของดีที่มีอยู่แล้วแต่ไม่ได้ใช้ — Cloudinary ประกอบภาพได้สวยพร้อมใช้งาน

```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xtgpasdc npx tsx -e '
import { buildCloudinaryShareImageUrl } from "./src/lib/media/cloudinary";
console.log(buildCloudinaryShareImageUrl({
  title: "ความหมายไพ่ยิปซี ดวงอาทิตย์ (The Sun)",
  spreadName: "คัมภีร์ไพ่ทาโรต์",
  cardImageNames: ["major-19.jpg"],
}));'
# เอา URL ที่ได้ไปเปิดในเบราว์เซอร์
```

**ผลจริง**: ได้ภาพ 1200×630 พื้นไหมทอง `#FAF7F2` · หัวแบรนด์ · ชื่อหมวด ·
หัวข้อภาษาไทยสระ/วรรณยุกต์ครบ ตัดขึ้นบรรทัดใหม่เอง · ไพ่ 1909 ใบจริงชิดขวา ·
ท้ายภาพมี `PROVABLY-FAIR SHA-256 · SEERTAROT.NET` — **สวยและถูกต้อง 100% พร้อมใช้ทันที**

ยืนยันว่าบัญชี Cloudinary ยังทำงาน:
```bash
curl -s -o /dev/null -w '%{http_code} %{content_type} %{size_download}\n' \
  "https://res.cloudinary.com/xtgpasdc/image/fetch/w_1200,h_630,b_rgb:FAF7F2,c_pad,g_east/f_auto,q_auto/https://seertarot.net/cards/major-19.jpg"
# 200 image/jpeg 82131
```

### 1.4 ระเบิดเวลา — หัวข้อที่มี `,` หรือ `/` ทำให้ภาพพังทั้งใบ

```bash
BASE="https://res.cloudinary.com/xtgpasdc/image/fetch/w_1200,h_630,b_rgb:FAF7F2,c_pad,g_east"
CARD="https://seertarot.net/cards/cups-02.jpg"

# หัวข้อมีจุลภาค — encodeURIComponent ให้ %2C
curl -s -o /dev/null -w 'มีจุลภาค: %{http_code}\n' \
  "$BASE/l_text:Arial_50_bold:%E0%B9%84%E0%B8%9E%E0%B9%88%2C%E0%B8%A3%E0%B8%B1%E0%B8%81,co_rgb:29261F,g_north_west,x_80,y_190/f_auto,q_auto/$CARD"
# มีจุลภาค: 400   ← ภาพหายทั้งใบ
```

**ผลตรวจ 3 หัวข้อตัวอย่าง** (ยิงผ่านฟังก์ชัน `buildCloudinaryShareImageUrl` ของจริง):

| หัวข้อที่ทดสอบ | HTTP | ขนาดไฟล์ที่ได้ |
| :--- | :-: | --: |
| `ไพ่ทาโรต์ความรัก, อ่านยังไง?` | **400** ❌ | 0 ไบต์ |
| `50/50 ใช่หรือไม่` | **400** ❌ | 0 ไบต์ |
| `ความหมายไพ่ยิปซี 3 ดาบ (Three of Swords) หัวตั้ง-หัวกลับ ครบทุกหมวดชีวิต` | 200 ✅ | 108,978 ไบต์ |

**สาเหตุ**: Cloudinary ใช้ `,` เป็นตัวคั่นพารามิเตอร์ และ `/` เป็นตัวคั่นขั้น transformation
`encodeURIComponent` แปลงให้เป็น `%2C` / `%2F` ซึ่ง Cloudinary **ถอดรหัสกลับก่อนแยกพารามิเตอร์**
จึงเห็นเป็นตัวคั่นจริงแล้วพัง · ต้องเข้ารหัสสองชั้น (`%252C` / `%252F`) เท่านั้น

**ยืนยันว่าทางแก้ใช้ได้จริง** — เข้ารหัสสองชั้นแล้วทั้งสองหัวข้อกลับมา `200` และเรนเดอร์ถูกต้อง
(`ไพ่ทาโรต์ความรัก, อ่านยังไง?` แสดงจุลภาคและเครื่องหมายคำถามครบ)

---

## 2. OG-01 · แก้การเข้ารหัสข้อความก่อนทำอย่างอื่น 🔴 Blocker

**ไฟล์**: [`src/lib/media/cloudinary.ts`](../../src/lib/media/cloudinary.ts)

### ก่อน

```ts
const safeTitle = encodeURIComponent(title.slice(0, 60));
const safeSpread = encodeURIComponent(spreadName.slice(0, 40));
```

### หลัง

```ts
/**
 * เข้ารหัสข้อความสำหรับ `l_text:` ของ Cloudinary
 *
 * ⚠️ ต้องเข้ารหัส `,` และ `/` **สองชั้น** — Cloudinary ถอด percent-encoding
 * ชั้นแรกออกก่อนแยกพารามิเตอร์ ถ้าส่ง `%2C` ไปตรง ๆ มันจะเห็นเป็นจุลภาคจริง
 * แล้วตอบ HTTP 400 ทั้งใบโดยไม่มีข้อความบอกสาเหตุ
 * (พิสูจน์แล้ว: หัวข้อ "ไพ่ทาโรต์ความรัก, อ่านยังไง?" = 400 · หลังแก้ = 200)
 */
function encodeOverlayText(raw: string, maxChars: number): string {
  return encodeURIComponent(truncateForOverlay(raw, maxChars))
    .replace(/%2C/g, "%252C")
    .replace(/%2F/g, "%252F");
}

const safeTitle = encodeOverlayText(title, 60);
const safeSpread = encodeOverlayText(spreadName, 40);
```

### เกณฑ์ผ่าน

- เขียนสคริปต์ยิงหัวข้อจริงของ **ทุกบทความ 26 เรื่อง + ทุกไพ่ 78 ใบ + ทุกผัง 25 แบบ**
  ผ่านฟังก์ชันนี้แล้ว `curl` ทุก URL — ต้องได้ `200` ครบทุกใบ ไม่มี `400` แม้แต่ใบเดียว
- เปิดดูด้วยตาอย่างน้อย 3 ใบที่มี `,` `/` `?` `(` `)` — อักขระต้องปรากฏครบ ไม่หาย ไม่กลายเป็น `%xx`

---

## 3. OG-05 · สร้างท่อกลางท่อเดียว แล้วบังคับด้วยด่านตรวจ 🟠

> ทำก่อน OG-02/03/04 เพราะทั้งสามข้อจะเรียกใช้ตัวนี้

**ต้นเหตุที่แท้จริง** ของ OG-02 และ OG-03 คือ *ทุกหน้าเขียน `images: [{ url, width, height }]` เอง*
คนเขียนจึงพิมพ์ `300×520` (ของจริง 825×1429) และ `512×878` (ของจริง 512×881) ผิดทั้งคู่
ตราบใดที่ยังเขียนมือ ความผิดพลาดแบบนี้จะกลับมาอีกแน่นอน

### ไฟล์ใหม่ `src/lib/media/og-image.ts`

```ts
import { buildCloudinaryShareImageUrl } from "@/lib/media/cloudinary";
import { OG_IMAGE_ALT, OG_IMAGE_URL } from "@/lib/config/site";

export interface PageOgImageParams {
  /** หัวข้อหลักบนภาพ — ปกติใช้ h1 ของหน้านั้น */
  title: string;
  /** บรรทัดเล็กเหนือหัวข้อ เช่น "คัมภีร์ไพ่ทาโรต์" / "คู่มือผังพยากรณ์" */
  eyebrow?: string;
  /** ชื่อไฟล์ไพ่ที่ใช้เป็นภาพประกอบฝั่งขวา เช่น "major-19.jpg" */
  cardImage?: string;
  alt?: string;
}

/**
 * แหล่งความจริงเดียวของ `openGraph.images` ทุกหน้าในเว็บ
 *
 * ⚠️ ห้ามเขียน `images: [{ url, width, height }]` ด้วยมือที่หน้าใดอีก —
 * ความกว้าง/สูงที่พิมพ์เองเคยผิดมาแล้วทั้งหน้าไพ่ (300×520 ที่ของจริง 825×1429)
 * และหน้า one-card (512×878 ที่ของจริง 512×881) · ฟังก์ชันนี้คืน 1200×630 เสมอ
 * ไม่ว่าจะตกไปทางสำรองหรือไม่ ตัวเลขจึงโกหกไม่ได้อีก
 *
 * ถ้าไม่ได้ตั้ง NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME จะถอยไป og/default.png
 * ซึ่งเป็น 1200×630 อยู่แล้ว (Zero Breaking Change)
 */
export function buildPageOgImage(params: PageOgImageParams) {
  const composed = buildCloudinaryShareImageUrl({
    title: params.title,
    spreadName: params.eyebrow,
    cardImageNames: params.cardImage ? [params.cardImage] : [],
  });

  return [
    {
      url: composed ?? OG_IMAGE_URL,
      width: 1200,
      height: 630,
      alt: params.alt ?? OG_IMAGE_ALT,
    },
  ];
}
```

### ด่านตรวจใหม่ `scripts/qa/test-og-images.ts`

อ่าน HTML ที่ prerender ไว้จริงจาก `.next/server/app/**/*.html`
(ใช้รูปแบบเดียวกับ [`test-en-routing.ts:308-325`](../../scripts/qa/test-en-routing.ts) ที่มีอยู่แล้ว)
แล้วบังคับกฎ 4 ข้อกับทุกหน้า:

1. ทุกหน้าต้องมี `og:image` — ห้ามขาด
2. `og:image:width` ต้องเป็น `1200` และ `og:image:height` ต้องเป็น `630` เสมอ
3. `og:image` ต้อง **ไม่** ชี้เข้า `/cards/` โดยตรง (กัน OG-02 กลับมา)
4. `og:image` ต้อง **ไม่** ลงท้าย `.webp` (กัน OG-03 กลับมา)

> ⚠️ เพิ่มด่านแล้วจำนวนด่านใน `repo:verify` จะเปลี่ยน ต้องไล่แก้ตัวเลขใน `CLAUDE.md`,
> `docs/INDEX.md`, `docs/WORK_LOG.md` ให้ตรงกัน ไม่งั้นด่าน `test-docs-numbers.ts` จะล้ม
> (นี่คือกับดักที่เคยทำเอกสารเพี้ยน 6 รอบใน 6 วัน)

### เกณฑ์ผ่าน

- `npm run build && npx tsx scripts/qa/test-og-images.ts` ผ่านทุกหน้าที่ prerender
- ลองแก้หน้าใดหน้าหนึ่งให้ชี้กลับไปที่ `/cards/xxx.jpg` ชั่วคราว — **ด่านต้องล้ม** (พิสูจน์ว่าด่านจับได้จริง)

---

## 4. OG-02 · หน้าไพ่ 156 หน้า 🔴

**ไฟล์**: [`src/app/_shared/pages/card-detail.tsx:77-86`](../../src/app/_shared/pages/card-detail.tsx)

### ก่อน

```ts
images: [
  {
    url: `/cards/${card.image}`,
    width: 300,
    height: 520,
    alt: isEnglish ? `${card.nameEn} from the 1909 Rider-Waite tarot deck` : `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`,
  },
],
```

### หลัง

```ts
images: buildPageOgImage({
  title: isEnglish ? card.nameEn : `${card.nameTh} (${card.nameEn})`,
  eyebrow: isEnglish ? "TAROT CARD MEANINGS" : "คัมภีร์ไพ่ทาโรต์",
  cardImage: card.image,
  alt: isEnglish
    ? `${card.nameEn} from the 1909 Rider-Waite tarot deck`
    : `ภาพหน้าไพ่ ${card.nameTh} (${card.nameEn}) 1909 Rider-Waite`,
}),
```

> 💡 **อย่าใช้ `title` ของหน้าเป็นหัวข้อบนภาพ** — `title` ของหน้าไพ่คือ
> `"ความหมายไพ่ยิปซี ดวงอาทิตย์ (The Sun) หัวตั้ง-หัวกลับ"` ยาวเกินและซ้ำกับข้อความ
> ที่แพลตฟอร์มแสดงใต้ภาพอยู่แล้ว · ใช้ชื่อไพ่ล้วน ๆ ให้ภาพอ่านง่ายในระยะฟีด

### เกณฑ์ผ่าน

- เจนภาพของไพ่ **ทั้ง 78 ใบ** แล้ว `curl` ทุกใบ → `200` ครบ
- เปิดดูด้วยตา 6 ใบที่ชื่อยาวสุดและสั้นสุด — ชื่อไทยต้องไม่ล้นกรอบ ไม่ทับไพ่
- เอา `https://seertarot.net/cards/major-19` ไปวางใน
  [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) แล้วกด Scrape Again
  ต้องเห็นภาพแนวนอนที่มีชื่อไพ่ ไม่ใช่ภาพครอป
- ทดสอบซ้ำที่ฝั่งอังกฤษ `/en/cards/major-19` — หัวข้อต้องเป็นภาษาอังกฤษ

---

## 5. OG-03 · 4 หน้าที่ใช้ WebP แนวตั้ง 🔴

**ไฟล์**: [`src/app/(th)/daily/page.tsx:29-44`](../../src/app/(th)/daily/page.tsx) ·
[`src/app/(th)/love/1-card/page.tsx:30-44`](../../src/app/(th)/love/1-card/page.tsx)
และฝาแฝดใน `src/app/(en)/en/`

### ก่อน

```ts
images: [
  { url: `${SITE_ORIGIN}/cards/w512b/major-19.webp`, width: 512, height: 878, alt: "The Sun - ดูดวงไพ่ยิปซีรายวัน" },
],
// twitter:
images: [`${SITE_ORIGIN}/cards/w512b/major-19.webp`],
```

### หลัง

```ts
const ogImages = buildPageOgImage({
  title: "ดูดวงไพ่ยิปซีรายวัน",
  eyebrow: "ไพ่นำทางประจำวัน",
  cardImage: "major-19.jpg",
  alt: "ดูดวงไพ่ยิปซีรายวัน 1909 Rider-Waite",
});

// openGraph:
images: ogImages,
// twitter:
images: [ogImages[0].url],
```

**ปัญหาซ้อนสองชั้นที่ต้องแก้พร้อมกัน**:
1. **สัดส่วน** — 512×881 เป็นแนวตั้ง โดนครอปเหมือน OG-02
2. **ฟอร์แมต** — WebP ในช่อง `og:image` ไม่ใช่ของที่ทุกแพลตฟอร์มรับประกันว่าเรนเดอร์ได้
   (Cloudinary `f_auto` จะเสิร์ฟ JPEG/PNG ให้ crawler ที่ไม่ประกาศรับ WebP โดยอัตโนมัติ)
3. ตัวเลขที่ประกาศ (`878`) ผิดจากไฟล์จริง (`881`) อยู่แล้วด้วย

### เกณฑ์ผ่าน

- ทั้ง 4 หน้าส่ง `og:image` เป็น URL Cloudinary และประกาศ `1200×630`
- `curl -sI <og:image>` ต้องได้ `content-type: image/jpeg` หรือ `image/png` เมื่อ**ไม่ได้**ส่ง `Accept: image/webp`
- วางลิงก์ในแชท LINE จริง 1 ครั้งต่อหน้า — ต้องเห็นภาพพรีวิวแนวนอนครบ

---

## 6. OG-04 · 139 หน้าที่ใช้ภาพเดียวกันหมด 🟠

หน้าที่ต้องแก้ เรียงตามผลตอบแทน:

| กลุ่มหน้า | จำนวน | ไฟล์ที่ต้องแก้ | หัวข้อบนภาพ | ภาพไพ่ประกอบ |
| :--- | --: | :--- | :--- | :--- |
| บทความ `/blog/<slug>` | 52 | `_shared/pages/blog-detail.tsx` | `article.title` | ตามหมวดบทความ |
| คู่มือผัง `/spreads/<id>` | 50 | `_shared/pages/spread-detail.tsx` | `spread.nameTh` / `nameEn` | ตาม `defaultCategory` |
| หมวดไพ่ `/cards/<group>` | 12 | `_shared/pages/card-group.tsx` | ชื่อหมวด | ไพ่ตัวแทนของหมวด |
| ผังตามหัวข้อชีวิต `/spreads/topic/<t>` | 12 | `_shared/pages/spread-topic.tsx` | ชื่อหัวข้อ | ตามหัวข้อ |
| หน้ารวม `/cards`, `/cards/all`, `/spreads`, `/blog` | 8 | ไฟล์ `*-index.tsx`, `cards-all.tsx` | ชื่อหน้า | ไพ่ประจำหน้า |
| `/cards/birth-card`, `/readers`, `/privacy`, หน้าแรก ×2 | 5 | รายไฟล์ | ชื่อหน้า | ไพ่ประจำหน้า |

### ตารางเลือกไพ่ประกอบ (`src/lib/media/og-card-art.ts`)

```ts
/**
 * ไพ่ที่ใช้เป็น "ภาพประกอบตกแต่ง" บนภาพแชร์ของแต่ละหมวด
 *
 * ⚠️ ตามกฎเหล็กข้อ 14 (Zero Fabricated Cards) — ไพ่ในตารางนี้ **ไม่ใช่ผลการเปิดไพ่**
 * และห้ามนำไปแสดงในบริบทที่ทำให้ผู้ใช้เข้าใจว่าเป็นไพ่ที่ตัวเองเปิดได้เด็ดขาด
 * ใช้ได้เฉพาะเป็นภาพประกอบของหน้าเนื้อหาที่ไม่มีการสุ่มไพ่เท่านั้น
 */
export const OG_CARD_ART: Record<string, string> = {
  love: "cups-02.jpg",
  career: "wands-08.jpg",
  money: "pentacles-10.jpg",
  study: "pentacles-08.jpg",
  family: "cups-10.jpg",
  health: "major-14.jpg",
  spreads: "major-01.jpg",
  cards: "major-00.jpg",
  wisdom: "major-09.jpg",
};
```

> ทั้ง `Article` และ `Spread` ไม่มีฟิลด์ภาพของตัวเอง (ตรวจแล้วใน `src/data/articles.ts`
> และ `src/data/spreads.ts`) จึงต้องแมปผ่านหมวด — **ห้ามสุ่มไพ่ตอนรันไทม์**
> เพราะจะทำให้ URL ไม่คงที่ เผาโควตา Cloudinary และภาพแชร์เปลี่ยนไปมาทุก build

### เกณฑ์ผ่าน

- `npm run build` แล้วนับ `og:image` ที่ไม่ซ้ำกันใน `.next/server/app/**/*.html` — ต้องได้ **≥ 290 ค่า**
  จากเดิมที่มีแค่ 3 ค่า (default.png + ภาพไพ่ + webp)
- สุ่มเปิดดูด้วยตา 10 หน้าคละกลุ่ม — หัวข้อต้องตรงกับหน้านั้นจริง ไม่สลับกัน

---

## 7. OG-06 · ตัดหัวข้อยาวให้สุภาพ 🟡

**อาการ**: หัวข้อ `"ความหมายไพ่ยิปซี 3 ดาบ (Three of Swords) หัวตั้ง-หัวกลับ ครบทุกหมวดชีวิต"`
ถูกตัดดิบ ๆ ที่ตัวอักษรที่ 60 เหลือ `"... หัวตั้ง-หัวกลับ ครบ"` — ขาดกลางวลี ไม่มี `…`

```ts
function truncateForOverlay(raw: string, maxChars: number): string {
  const text = raw.trim();
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  // ภาษาไทยไม่เว้นวรรคระหว่างคำ — ถ้าหาช่องว่างที่เหมาะไม่เจอ ให้ตัดตรงแล้วเติม …
  const body = lastSpace > maxChars * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${body.trimEnd()}…`;
}
```

**เกณฑ์ผ่าน**: หัวข้อยาวสุดของบทความทั้ง 26 เรื่องและไพ่ทั้ง 78 ใบ ต้องจบด้วย `…`
เมื่อถูกตัด และต้องไม่ล้นกรอบ 1200×630 (ตรวจด้วยตาอย่างน้อย 5 ใบที่ยาวที่สุด)

---

## 8. กับดักที่ต้องระวัง (อ่านก่อนลงมือ)

1. **`NEXT_PUBLIC_*` ถูก inline ตอน build** — `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` ต้องตั้งที่
   GitHub → Settings → Secrets and variables → Actions เท่านั้น ตั้งเป็น Worker secret **ไม่มีผล**
   (บทเรียน INC-0092 · `.env.example` แก้คำอธิบายไปแล้วใน PR #330)

2. **ห้ามแตะ `/s/[id]`** — หน้านั้นเพิ่งแก้ไปใน PR #328 ให้ภาพไพ่จริงของผู้ใช้จาก R2
   มาก่อน Cloudinary เสมอ (M-02) · ถ้าเผลอสลับลำดับกลับ คนแชร์จะไม่เห็นไพ่ตัวเองอีก

3. **โควตา Cloudinary ฟรี 25 เครดิต/เดือน** — 299 หน้า = 299 URL ที่ไม่ซ้ำกัน
   คิดเป็นการแปลงภาพครั้งเดียวราว 0.3 เครดิต แล้วถูกแคชที่ CDN ของ Cloudinary ถาวร
   **แต่ห้ามเอาข้อความที่ผู้ใช้พิมพ์เองไปใส่ใน URL** เพราะจะได้ URL ไม่ซ้ำไม่จำกัด = เผาโควตา

4. **ตรวจด้วย HTTP 200 อย่างเดียวไม่พอ** — ภาพที่ข้อความทับกันก็ตอบ 200
   (บทเรียน M-01) · ทุกข้อในแผนนี้ต้อง **เปิดดูด้วยตา** และแนบภาพลงใน PR

5. **Facebook แคชภาพแชร์** — หลัง deploy ต้องกด Scrape Again ใน Sharing Debugger
   ถึงจะเห็นของใหม่ อย่าเพิ่งสรุปว่าแก้ไม่สำเร็จ

6. **ถ้าบัญชี Cloudinary ล่ม** ภาพแชร์ที่ถูกแคชไว้แล้วจะยังอยู่ แต่หน้าใหม่จะถอยไป
   `og/default.png` ก็ต่อเมื่อ **build ใหม่โดยไม่มีตัวแปร** — ทางถอยเร็วคือ
   ลบตัวแปรใน GitHub แล้ว deploy ซ้ำ (รูปแบบเดียวกับ ImageKit ใน M-03)

---

## 9. เกณฑ์ผ่านรวมของงานทั้งชุด

- [ ] `npm run repo:verify` ผ่านครบทุกด่าน (รวมด่านใหม่จาก OG-05)
- [ ] `npm run build` สำเร็จ · จำนวนหน้า prerender ไม่ลดลงจากเดิม
- [ ] `og:image` ทุกหน้าประกาศ `1200×630` และไม่มีหน้าใดชี้เข้า `/cards/` หรือลงท้าย `.webp`
- [ ] ยิงหัวข้อจริงของไพ่ 78 ใบ + บทความ 26 เรื่อง + ผัง 25 แบบ ผ่านตัวประกอบภาพ → `200` ครบ ไม่มี `400`
- [ ] แนบภาพที่เจนจริงอย่างน้อย 6 ใบลงใน PR (หน้าไพ่ · บทความ · คู่มือผัง · หมวดไพ่ · one-card · หัวข้อยาวสุด)
- [ ] ทดสอบจริงบน Facebook Sharing Debugger และ LINE อย่างละ 2 ลิงก์
- [ ] อัปเดต `docs/WORK_LOG.md` และปิดสถานะแผนฉบับนี้

---

## 10. ลำดับลงมือและการแบ่ง PR

| PR | ขอบเขต | ไฟล์ | ทำไมแยก |
| :-- | :--- | :--- | :--- |
| **A** | OG-01 + OG-06 + OG-05 (ท่อกลาง + ด่านตรวจ) | `cloudinary.ts`, `og-image.ts` (ใหม่), `og-card-art.ts` (ใหม่), `test-og-images.ts` (ใหม่), เอกสารตัวเลข | เป็นฐานของทุกข้อ · ยังไม่เปลี่ยนหน้าใดเลย จึงย้อนกลับง่าย |
| **B** | OG-02 + OG-03 (160 หน้าที่ภาพพังจริง) | `card-detail.tsx`, `daily/page.tsx` ×2, `love/1-card/page.tsx` ×2 | คืนคุณค่าให้ผู้ใช้ทันที · ตรวจง่ายด้วย Sharing Debugger |
| **C** | OG-04 (139 หน้าที่เหลือ) | `blog-detail.tsx`, `spread-detail.tsx`, `card-group.tsx`, `spread-topic.tsx`, `*-index.tsx`, `cards-all.tsx` | เปลี่ยนเยอะแต่ความเสี่ยงต่ำ เพราะท่อกลางถูกพิสูจน์ใน A/B แล้ว |

> ⚠️ **กฎข้อ 13** — ทุก PR ต้องเปิดด้วย `npm run pr:auto` เท่านั้น
> `push` เฉย ๆ = งานค้าง ไม่มี CI ไม่มี merge ไม่มี deploy (บทเรียน ISSUE-005 · INC-0043)

---

## 11. สิ่งที่ตรวจแล้วว่า "ปกติ" (อย่าเสียเวลาตรวจซ้ำ)

| รายการ | ผลตรวจ 2026-09-07 |
| :--- | :--- |
| บัญชี Cloudinary (`xtgpasdc`) | ใช้งานได้ · `image/fetch` ตอบ 200 · ฟอนต์ไทยเรนเดอร์ครบสระ/วรรณยุกต์ |
| ตัวประกอบภาพ `buildCloudinaryShareImageUrl` | เลย์เอาต์ถูกต้องสวยงามแล้ว (แก้ไปใน PR #328) — ข้อเดียวที่ต้องแก้คือการเข้ารหัส |
| `/s/[id]` (ภาพแชร์ผลดวงจริง) | ถูกต้อง · ภาพจาก R2 มาก่อน Cloudinary ตามที่แก้ใน M-02 |
| `og/default.png` · `og/share-base.png` | 1200×630 ทั้งคู่ ถูกต้อง ใช้เป็นทางถอยได้ |
| ImageKit / ท่อภาพไพ่ในหน้าเว็บ | ไม่เกี่ยวกับแผนนี้เลย · แผนนี้ไม่แตะ `CardImage.tsx` หรือ `card-image.ts` สักบรรทัด |
| `sitemap.xml` | 299 URL ตรงกับที่ prerender จริง |

---

## 12. งานเรื่องภาพที่ยัง**ไม่**อยู่ในแผนนี้ (เก็บไว้พิจารณาภายหลัง)

ตรวจเจอระหว่างสำรวจ แต่ตัดออกจากแผนนี้เพราะเสี่ยงกว่าและไม่ได้ผลตอบแทนเร็วเท่า:

| เรื่อง | ผลตอบแทน | ทำไมยังไม่ทำตอนนี้ |
| :--- | :--- | :--- |
| ให้ ImageKit ย่อภาพสดแทนไฟล์ที่ปั๊มไว้ล่วงหน้า | ลดไฟล์ในรีโป **22 MB** (`w64`+`w128`+`w256`+`w512b`+`w768b`) และเลิกต้องรัน `cards:variants` | ผูกกับ ImageKit แน่นขึ้น ทั้งที่ M-03 เพิ่งชี้ว่ามันเป็นจุดพังเดี่ยว · ต้องออกแบบทางถอยให้จบก่อน |
| เปิด AVIF ผ่าน ImageKit `f-auto` | เล็กกว่า WebP ราว 30% | ต้องรื้อ `<source type="image/webp">` ที่ฮาร์ดโค้ดใน `CardImage.tsx` และมีด่านตรวจ path ภาพไพ่คุ้มครองอยู่ |
| ภาพเบลอรองระหว่างโหลด (LQIP) | ความรู้สึกว่าเว็บไวขึ้น | ควรทำรวมกับแผน [`HANDOFF_SMOOTH_FAST_2026-09-06.md`](HANDOFF_SMOOTH_FAST_2026-09-06.md) ไม่ใช่แยกทำ |
| ท่ออัปโหลดรูปโปรไฟล์แม่หมอ (Marketplace) | จำเป็นตอนเปิด Marketplace | Marketplace ยังติด D1 provisioning + PDPA อยู่ ยังไม่ถึงคิว |
