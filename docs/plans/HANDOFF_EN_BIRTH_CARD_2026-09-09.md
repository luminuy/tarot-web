# 🎂 แผนเปิดหน้าอังกฤษ `/en/cards/birth-card` (ขั้น C ก้อนสุดท้ายของเส้นทางสองภาษา)

> **สถานะ**: ⏳ ยังไม่ลงมือ — เอกสารนี้เขียนไว้กันลืมตามคำสั่งเจ้าของ (2026-09-09)
> **ขนาดงาน**: 1 PR · แตะ 4 ไฟล์ · งานจริง 90% คือ **เขียนบทความอังกฤษ 600–800 คำ**
> **ที่มา**: ตอนตรวจคิวส่ง GSC (PR #364) พบว่า `/en/cards/birth-card` คืน HTTP 404
> เจ้าของถามว่า _"คืออะไร ต้องแก้ไง"_ → ตรวจโค้ดแล้วสรุปเป็นแผนฉบับนี้

---

## 1. สรุปสั้นที่สุด

| คำถาม | คำตอบ |
| :--- | :--- |
| หน้านี้คืออะไร | เครื่องคำนวณ **ไพ่ประจำตัวจากวันเดือนปีเกิด** (Birth Card / Soul Card) ฉบับไทยอยู่ที่ `/cards/birth-card` |
| ฉบับไทยมีไหม | ✅ มี · อยู่ใน `sitemap.xml` · **ถูกจัดทำดัชนีแล้ว** (ยืนยันตอนส่ง GSC รอบ 2026-09-07) |
| ฉบับอังกฤษ 404 เพราะ | **ตั้งใจปิด ไม่ใช่บั๊ก** — ตัดออกตั้งแต่ตอนทำเส้นทางสองภาษา (#340) |
| เหตุผลที่ตัดออก | บทความประกอบยาว 800+ คำเป็นไทยล้วน · เปิดหน้าอังกฤษที่มีแต่โครงแต่เนื้อเป็นไทย = **thin content ซึ่งแย่กว่าไม่มีหน้าเลย** |
| ทำไมถึงคุ้มที่จะเปิดตอนนี้ | เป็น **หน้าเครื่องมือ (tool page)** ไม่ใช่บทความเฉย ๆ — ประเภทที่ดึงลิงก์และทราฟฟิกซ้ำได้ดีกว่าหน้าเนื้อหาล้วน และตัวเครื่องคำนวณ**พร้อมอังกฤษอยู่แล้ว 100%** |

---

## 2. ข่าวดีที่สุด — ตัวเครื่องคำนวณไม่ต้องแตะเลยสักบรรทัด

[`src/components/encyclopedia/BirthCardCalculator.tsx`](../../src/components/encyclopedia/BirthCardCalculator.tsx)
(480 บรรทัด) **รองรับสองภาษาครบแล้ว** — เรียก `useLocale()` แล้วแตกกิ่งด้วย `isEnglish`
ทั้งชื่อเดือน (`nameTh`/`nameEn`) · ข้อความผลลัพธ์ · ข้อความแชร์

และต้นไม้ `/en` **ตรึงภาษาไว้ตั้งแต่ระดับ layout แล้ว**:
[`src/app/(en)/layout.tsx:88`](../../src/app/\(en\)/layout.tsx) เรียก `<RootHtml locale="en" pinLocale>`
ซึ่งส่งต่อเป็น `<LocaleProvider forcedLocale="en">`
➔ **คอมโพเนนต์ใดก็ตามที่วางใต้ `/en` จะได้ `isEnglish === true` ทันทีตั้งแต่ HTML ดิบ**

**แปลว่างานนี้เหลือแค่ "เปลือกหน้าเพจ" (metadata + บทความ + JSON-LD) เท่านั้น**

---

## 3. จุดที่ล็อกไว้ — 2 แห่ง ต้องปลดทั้งคู่ ไม่งั้น CI ตก

### 🔒 ล็อกที่ 1 — แหล่งความจริงเดียวของ "หน้าไหนมีฝาแฝดอังกฤษ"

[`src/lib/i18n/paths.ts:43`](../../src/lib/i18n/paths.ts)

```ts
const EN_TWIN_EXCEPTIONS: string[] = ["/cards/birth-card"];
```

ตัวนี้คือแหล่งความจริงเดียวที่ **`sitemap.ts` · `hreflang` · `LanguageSwitcher` เชื่อทั้งหมด**
ตราบใดที่ `/cards/birth-card` ยังอยู่ในลิสต์นี้:
- `sitemap.xml` จะไม่มี `/en/cards/birth-card`
- หน้าไทยจะไม่ประกาศ `hreflang` ชี้ไปอังกฤษ
- ปุ่มสลับภาษาบนหน้านั้นจะไม่พาไปไหน

### 🔒 ล็อกที่ 2 — ด่านตรวจที่บังคับว่า "ห้ามมีไฟล์"

[`scripts/qa/test-en-routing.ts:108`](../../scripts/qa/test-en-routing.ts)

```ts
for (const withoutTwin of ["/privacy", "/cards/birth-card", "/account"]) {
  check(`${withoutTwin} ต้องไม่ประกาศว่ามีฝาแฝดอังกฤษ`, !hasEnglishTwin(withoutTwin));
  check(`ลิงก์ ${withoutTwin} ในหน้าอังกฤษต้องไม่ถูกเติม /en`, localeHref(withoutTwin, "en") === withoutTwin);
  check(`ต้องไม่มีไฟล์หน้าอังกฤษของ ${withoutTwin} หลงเหลืออยู่`, !fs.existsSync(...));
}
```

⚠️ **ถ้าสร้างไฟล์ `page.tsx` อย่างเดียวโดยไม่แก้ด่านนี้ CI จะตกทันที** — ด่านนี้เขียนขึ้นมาเพื่อ
ไม่ให้ใครแอบเปิดหน้าอังกฤษที่เนื้อยังเป็นไทย มันทำงานถูกต้องแล้ว **ห้ามลบด่าน ให้ย้ายรายการแทน**

---

## 4. งานที่ต้องทำ — 4 ข้อ เรียงตามลำดับลงมือ

### ✍️ งานที่ 1 (ใหญ่สุด — 90% ของงาน) เขียนเนื้อหาอังกฤษ

**ห้ามแปลตรงตัวจากฉบับไทย** — ทำตามที่ `/en/daily` วางบรรทัดฐานไว้
(ดูคอมเมนต์หัวไฟล์ [`src/app/(en)/en/daily/page.tsx`](../../src/app/\(en\)/en/daily/page.tsx)):
_"เนื้อบทความ SEO ของหน้านี้เขียนขึ้นใหม่เป็นภาษาอังกฤษโดยตรง เพราะกลุ่มคำค้นและวิธีเล่าเรื่องของสองภาษาต่างกัน"_

ต้องมี:

| ชิ้นส่วน | เกณฑ์ |
| :--- | :--- |
| `TITLE` | ตั้งรอบคำค้นหลัก `tarot birth card calculator` · **ห้ามมี `,` หรือ `/`** (ดูกับดักข้อ 6) |
| `DESCRIPTION` | 150–160 ตัวอักษร บอกให้ชัดว่าฟรีและคำนวณจากวันเกิด |
| `keywords` | เช่น `tarot birth card`, `birth card calculator`, `soul card tarot`, `personality card tarot`, `what is my tarot card`, `tarot numerology` |
| บทความในตัว `SeoArticleShell` | **600–800 คำที่มองเห็นจริง** (ฉบับไทยยาว 800+ คำ อย่าให้ฉบับอังกฤษบางกว่านี้มาก) |
| FAQ | **4 ข้อ** อิงหัวข้อเดียวกับฉบับไทยแต่เขียนใหม่: Birth Card คืออะไร · Personality vs Soul Card ต่างกันยังไง · ได้ไพ่ใบเดียวแปลว่าอะไร · เปลี่ยนตามปีไหม |
| ตารางคู่ไพ่ | ฉบับไทยมี 12 คู่ (Wheel+Magician … World+Empress) — ฉบับอังกฤษควรมีครบเช่นกัน เพราะเป็นเนื้อที่ดึงคำค้นหางยาว |

**ประเด็นที่ควรอยู่ในบทความ** (ฉบับไทยมีครบแล้ว ใช้เป็นโครง ไม่ใช่ต้นฉบับให้แปล):
Mary K. Greer (_Who Are You in the Tarot?_) · Angeles Arrien · Carl Jung archetypes ·
วิธีคำนวณแบบ digit reduction จาก **ค.ศ.** · Personality Card (10–21) vs Soul Card (1–9) ·
Light aspect / Shadow aspect · วิธีเอาไปใช้ใคร่ครวญตนเอง

### 🧱 งานที่ 2 สร้างไฟล์ `src/app/(en)/en/cards/birth-card/page.tsx`

ลอกโครงจาก [`src/app/(en)/en/daily/page.tsx`](../../src/app/\(en\)/en/daily/page.tsx) (179 บรรทัด — ตรงแบบที่สุด) โดย:

```ts
const PATH = "/cards/birth-card";

// metadata
alternates: buildAlternates(PATH, { locale: "en", englishTwin: true }),
openGraph: { ...buildOpenGraph("en", { title: TITLE, description: DESCRIPTION, path: PATH, images: ogImages }) },

// JSON-LD (3 ก้อน เหมือนฉบับไทย แต่ inLanguage: "en")
//  1. WebApplication  2. BreadcrumbList  3. FAQPage
const breadcrumbJsonLd = buildBreadcrumbJsonLd("en", [
  homeCrumb("en"),
  { name: "78 Card Encyclopedia", path: "/cards" },
  { name: "Birth Card Calculator", path: PATH },
]);
```

จากนั้นวาง `<BirthCardCalculator majorCards={MAJOR_CARDS} />` แล้วตามด้วย `<SeoArticleShell>`

⚠️ **คัดลอกบล็อก `MAJOR_CARDS` มาจากฉบับไทยแบบตรงตัว** พร้อมคอมเมนต์เตือนของมัน —
ต้องส่งเฉพาะฟิลด์ที่คอมโพเนนต์ใช้จริง **ห้ามใส่ `keywords`/`keywordsEn` กลับเข้าไป**
(12 KB ดิบ เคยทำให้หน้าไทยทะลุงบ HTML จน deploy ค้าง · INC-0103 · แก้แล้วใน PR #354)

⚠️ **ห้ามเรียก dynamic API ใด ๆ** (`headers()` / `cookies()` / `getServerLocale()`) — หน้านี้ต้อง prerender ได้ (INC-0091)

### 🔓 งานที่ 3 ปลดล็อกใน `src/lib/i18n/paths.ts`

```ts
// เดิม
const EN_TWIN_EXCEPTIONS: string[] = ["/cards/birth-card"];
// ใหม่
const EN_TWIN_EXCEPTIONS: string[] = [];
```

พร้อมลบบล็อกคอมเมนต์เหนือมันที่อธิบายว่าทำไม `/cards/birth-card` ถึงถูกยกเว้น

> 🧹 **เก็บกวาดพ่วง (เจอตอนตรวจ 2026-09-09)**: คอมเมนต์หัว `EN_TWIN_ROUTES` ในไฟล์เดียวกัน
> ยังเขียนว่า _"หน้าที่ยังไม่มีฝาแฝดโดยตั้งใจ: `/blog` (เนื้อบทความยังไม่มีฉบับอังกฤษ)"_
> ซึ่ง **ไม่จริงแล้ว** — `/blog` อยู่ในลิสต์ `EN_TWIN_ROUTES` เรียบร้อย และ `/en/blog/*` เปิดครบ 26 หน้า
> แก้คอมเมนต์บรรทัดนั้นไปพร้อมกันเลย

### ✅ งานที่ 4 ย้ายรายการในด่านตรวจ `scripts/qa/test-en-routing.ts`

```ts
// ลิสต์ withoutTwin: ตัด "/cards/birth-card" ออก เหลือ
for (const withoutTwin of ["/privacy", "/account"]) {

// ลิสต์ withTwin: เติมเข้าไป
for (const withTwin of ["/blog", "/blog/how-to-ask-tarot-questions", "/spreads/topic/love", "/cards/birth-card"]) {
```

---

## 5. เกณฑ์รับงาน (ผ่านครบทุกข้อถึงเรียกว่าเสร็จ)

- [ ] `npm run repo:verify` ผ่านครบ **38/38 ด่าน**
- [ ] `https://seertarot.net/en/cards/birth-card` คืน **HTTP 200** หลัง deploy
- [ ] เนื้อหาที่มองเห็นจริง (ตัด `<script>`/`<style>` แล้วนับ) **≥ 600 คำ**
- [ ] **ไม่มีอักขระไทยหลุดในเนื้อหาที่มองเห็น** ยกเว้นชื่อไพ่ภาษาไทยที่ตั้งใจให้มี
- [ ] `<html lang="en">` · `canonical` ชี้ตัวเอง · `hreflang` ครบ 3 รายการ (`th-TH` / `en-US` / `x-default`)
- [ ] หน้าไทย `/cards/birth-card` **ประกาศ `hreflang` ชี้กลับมาหาอังกฤษด้วย** (สองทาง ไม่ใช่ทางเดียว)
- [ ] `sitemap.xml` เพิ่มจาก **299 → 300 URL** และมีเส้น `/en/cards/birth-card`
- [ ] ปุ่มสลับภาษาบนหน้าไทยพาไป `/en/cards/birth-card` ได้จริง (ไม่ใช่ 404)
- [ ] ภาพแชร์ OG โหลดขึ้นจริง (HTTP 200 ไม่ใช่ 400 — ดูข้อ 6)
- [ ] จดลง [`docs/WORK_LOG.md`](../WORK_LOG.md) และเพิ่ม `/en/cards/birth-card` เข้าคิวใน [`docs/SEO_INDEXING_LOG.md`](../SEO_INDEXING_LOG.md)

---

## 6. กับดักที่ต้องระวัง (ทุกข้อเคยทำพังมาแล้วจริง)

| # | กับดัก | วิธีเลี่ยง |
| :---: | :--- | :--- |
| 1 | **หัวข้อมี `,` หรือ `/` ทำภาพแชร์พัง HTTP 400** | Cloudinary ถอด percent-encoding ชั้นแรกก่อนแยกพารามิเตอร์ · `encodeOverlayText` เข้ารหัสสองชั้นให้แล้ว **แต่ทางที่ปลอดภัยกว่าคืออย่าตั้ง `TITLE` ที่มี `,` หรือ `/` ตั้งแต่แรก** (พิสูจน์แล้ว: หัวข้อที่มี `,` = 400 · หลังแก้ = 200) |
| 2 | **งบ HTML ทะลุจน deploy ค้าง** | หน้าไทยคู่แฝดวัดได้ 26 KB ชนเพดาน 29 KB · flight payload ของ `MAJOR_CARDS` กินไปเยอะ ➔ **ห้ามเพิ่มฟิลด์ที่คอมโพเนนต์ไม่ได้เรียกใช้** (INC-0103) |
| 3 | **หน้า `/en` ยังไม่อยู่ในด่านงบน้ำหนักเลยสักหน้า** | `scripts/qa/test-bundle-budget.ts` คุมเฉพาะเส้นทางไทย ➔ หน้าอังกฤษใหม่จะ **ไม่มีตาข่ายรับ** แนะนำเพิ่ม `/en/cards/birth-card` เข้าลิสต์ด้วยเพดานเดียวกับฉบับไทย (`maxJsGzipKb: 190` · `maxHtmlGzipKb: 29`) ในงานเดียวกันนี้ |
| 4 | **`hreflang` ที่โกหก** | ถ้าประกาศ twin แต่ลืมสร้างไฟล์ (หรือกลับกัน) Google จะ**ทิ้งคำประกาศทั้งชุดทั้งเว็บ** ไม่ใช่แค่หน้านี้ ➔ ด่านข้อ 4 มีไว้จับเรื่องนี้ ห้ามข้าม |
| 5 | **แปลตรงตัวจากไทย** | คำค้นอังกฤษคนละกลุ่มกับไทย · ประโยคที่แปลตรงตัวอ่านแล้วรู้ทันที ➔ เขียนใหม่เป็นอังกฤษโดยตรง (กฎเหล็กข้อ 10 ใช้กับภาษาอังกฤษด้วย) |
| 6 | **ลืมส่งเข้า GSC หลัง deploy** | หน้าใหม่ที่ไม่มีใครลิงก์หาจะรอ Google มาเจอเองนาน ➔ ส่ง URL Inspection ทันทีที่ deploy เสร็จ แล้วจดลง `SEO_INDEXING_LOG.md` |

---

## 7. ทำไมงานนี้ถึงอยู่ในคิว ไม่ใช่ทำทันที

- ไม่ใช่บั๊ก · ไม่มีผู้ใช้เจอหน้าพัง (404 ไม่ถูกลิงก์จากที่ไหนเลย และไม่อยู่ใน sitemap)
- ได้หน้าอังกฤษเพิ่ม **1 หน้า** จาก 116 หน้า — ผลต่อทราฟฟิกรวมน้อยเมื่อเทียบกับ
  การไล่ส่ง 119 URL ที่เปิดอยู่แล้วเข้า GSC (คิวใน [`SEO_INDEXING_LOG.md`](../SEO_INDEXING_LOG.md))
- แต่**ต้นทุนต่ำและจบในตัว** ➔ เหมาะหยิบทำตอนมีคนว่างหนึ่งรอบ หรือรวมไปกับงานเนื้อหาอังกฤษก้อนถัดไป

**ลำดับที่แนะนำ**: ไล่ส่ง GSC ให้ครบ 4 ชุดก่อน → แล้วค่อยหยิบงานนี้

---

## 8. ไฟล์ที่เกี่ยวข้องทั้งหมด (พร้อมบรรทัด)

| ไฟล์ | บทบาท | ต้องแก้ไหม |
| :--- | :--- | :---: |
| `src/app/(th)/cards/birth-card/page.tsx` (291 บรรทัด) | ต้นแบบฉบับไทย | ❌ ไม่แตะ |
| `src/components/encyclopedia/BirthCardCalculator.tsx` (480 บรรทัด) | เครื่องคำนวณ — รองรับอังกฤษแล้ว | ❌ ไม่แตะ |
| `src/app/(en)/en/daily/page.tsx` (179 บรรทัด) | **แม่แบบที่ควรลอกโครง** | ❌ ไม่แตะ |
| `src/app/(en)/en/cards/birth-card/page.tsx` | หน้าใหม่ | ✅ **สร้าง** |
| `src/lib/i18n/paths.ts` (บรรทัด 43) | แหล่งความจริงเดียวของฝาแฝด | ✅ แก้ |
| `scripts/qa/test-en-routing.ts` (บรรทัด 108 · 119) | ด่านตรวจ | ✅ แก้ |
| `scripts/qa/test-bundle-budget.ts` | ด่านงบน้ำหนัก | 🟡 แนะนำเพิ่ม |
