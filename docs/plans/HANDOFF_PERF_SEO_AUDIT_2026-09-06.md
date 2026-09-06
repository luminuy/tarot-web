# ⚡ แผนยกเครื่องประสิทธิภาพ · โค้ดตาย · SEO — รอบตรวจใหญ่ 2026-09-06

> **สถานะ**: แผน (ยังไม่ลงมือ) · **ฐานที่วัด**: `a69293e` (main) · **ผู้ตรวจ**: Claude Opus 5
> **ผลตรวจย่อ**: TypeScript 0 error · `next build` ผ่าน · **แต่** ทุกหน้าส่ง JavaScript ให้เบราว์เซอร์
> **420–472 KB (gzip)** ซึ่งหนักเกินมาตรฐานเว็บระดับโลก (เป้าหมายที่ยอมรับได้คือ ≤ 170 KB)
> สาเหตุใหญ่ที่สุดคือ **ไฟล์เดียว 6 บรรทัด** ที่ลากสารานุกรมไพ่ทั้งสำรับเข้าไปในบันเดิลของทุกหน้า

---

## 0. สรุปผู้บริหาร (อ่านแค่ตารางนี้ก็พอ)

| # | เรื่อง | ความรุนแรง | ผลที่วัดได้ | แรงที่ใช้ |
| :-- | :--- | :-- | :--- | :-- |
| **P-01** | `nav-links.ts` ลาก `DECK` + `ARTICLES` + `SPREADS` เข้าบันเดิลทุกหน้า เพียงเพื่อนับเลข 3 ตัว | 🔴 Critical | **−156 KB ถึง −175 KB gzip ต่อหน้า** (วัดจริงแล้ว) | 6 บรรทัด |
| **P-02** | `/cards` ส่งสำรับไพ่เต็ม (ความหมาย 5 มิติ ทั้งไทย/อังกฤษ) ลง RSC payload | 🔴 Critical | HTML `/cards` **896 KB → คาด ~140 KB** · payload 148 → 8 KB gzip | 1 ไฟล์ |
| **P-03** | ภาพย่อ `w768` **หนักกว่าไฟล์ต้นฉบับ** (355 KB vs 278 KB เฉลี่ย) | 🟠 High | หน้ารายละเอียดไพ่ 78 หน้าโหลดภาพหลักหนักเกินจริง ~5 เท่า | รันสคริปต์ใหม่ |
| **S-01** | `hreflang` หายจากทุกหน้า เพราะ `alternates` ถูกเขียนทับ | 🟠 High | Google ไม่รู้ว่ามีฉบับภาษาอังกฤษเลย | 1 ไฟล์ |
| **S-02** | `?lang=en` เสิร์ฟ HTML ภาษาไทย (สลับภาษาเกิดบนไคลเอนต์ล้วน) | 🟠 High | หน้า EN มองไม่เห็นจากบอต + hydration mismatch ทุกครั้งที่ผู้ใช้ตั้ง EN | ปานกลาง |
| **D-01** | โมดูลที่ไม่มีใครเรียก 4 ไฟล์ (321 บรรทัด) + export ที่ไม่มีใครใช้ 14 ตัว | 🟡 Medium | คลังสะอาดขึ้น ลดความสับสนของ Agent ตัวถัดไป | เล็ก |
| **D-02** | `npm run lint` **พังมาตลอด** (Next 16 ถอด `next lint` ออกแล้ว) | 🟡 Medium | ไม่มี linter คุมคุณภาพเลยสักตัว | เล็ก |
| **G-01** | ไม่มีด่านตรวจ "งบน้ำหนักหน้าเว็บ" → ปัญหา P-01 จึงโตเงียบ ๆ มาถึงวันนี้ | 🟠 High | กันถอยหลังถาวร | 1 ไฟล์ทดสอบ |

---

## 1. ตัวเลขฐาน (Baseline) — วัดจริง ไม่ใช่ประมาณ

วิธีวัดซ้ำ (ทำได้ทุกเครื่อง):

```bash
npm run build && node -e '
const fs=require("fs"),zlib=require("zlib");
for(const p of ["index","cards","cards/major-00","blog","daily","love/1-card","spreads","cards/all"]){
  const f=`.next/server/app/${p}.html`; if(!fs.existsSync(f)) continue;
  const html=fs.readFileSync(f,"utf8");
  const set=new Set(html.match(/_next\/static\/chunks\/[^"]+\.js/g)||[]);
  let gz=0; for(const c of set){try{gz+=zlib.gzipSync(fs.readFileSync(".next/"+c.replace(/^_next\//,""))).length}catch{}}
  console.log(p.padEnd(16), "JS", (gz/1024).toFixed(0)+"KB", "| HTML", (zlib.gzipSync(Buffer.from(html)).length/1024).toFixed(0)+"KB");
}'
```

| หน้า | JS (gzip) วันนี้ | JS หลังทำ P-01 (วัดแล้ว) | HTML (gzip) วันนี้ |
| :--- | --: | --: | --: |
| `/` | 472 KB | **316 KB** (−33%) | 30 KB |
| `/cards` | 427 KB | **254 KB** (−41%) | **174 KB** ⚠️ |
| `/blog` | 427 KB | **252 KB** (−41%) | 54 KB |
| `/spreads` | 432 KB | **271 KB** (−37%) | 37 KB |
| `/cards/all` | 383 KB | **336 KB** | 28 KB |
| `/cards/major-00` | 420 KB | **374 KB** | 22 KB |
| `/daily` | 438 KB | **391 KB** | 18 KB |
| `/love/1-card` | 442 KB | **395 KB** | 19 KB |
| `/reading/chat` | 196 KB | — | 5 KB |

> ⚠️ **`/cards` มี HTML ดิบ 896 KB** — 61% ของไฟล์คือ RSC flight payload ที่บรรจุคำว่า `upright` ถึง 937 ครั้ง
> นี่คือสารานุกรมไพ่ทั้งสำรับถูกยัดลงหน้าเดียว ทั้งที่หน้านั้นแสดงแค่ชื่อ ภาพ ธาตุ และคีย์เวิร์ด

น้ำหนักภาพไพ่ (เฉลี่ยต่อใบ · 78 ใบ):

| ชุด | เฉลี่ย/ใบ | รวม |
| :-- | --: | --: |
| `w64` | 4 KB | 312 KB |
| `w128` | 9 KB | 772 KB |
| `w256` | 37 KB | 2.9 MB |
| `w512` | **164 KB** | 12.8 MB |
| `w768` | **355 KB** | 27.8 MB |
| ต้นฉบับ `.jpg` | 278 KB | 21.7 MB |

---

## 2. คลื่นที่ 1 — ลดน้ำหนักบันเดิล (ผลตอบแทนสูงสุด ความเสี่ยงต่ำสุด)

### P-01 · ตัดสารานุกรมออกจากบันเดิลทุกหน้า 🔴

**ปัญหา** — [`src/components/layout/nav-links.ts:1`](../../src/components/layout/nav-links.ts) เปิดหัวไฟล์ด้วย

```ts
import { DECK } from "@/data/cards";        // ~900 KB ต้นทาง
import { ARTICLES } from "@/data/articles"; // ~157 KB ต้นทาง (เนื้อบทความเต็ม 26 บท)
import { SPREADS } from "@/data/spreads";   // ~85 KB ต้นทาง

export const COUNTS = {
  cards: DECK.length,        // 78
  articles: ARTICLES.length, // 24   ← คอมเมนต์ผิด ของจริง 26
  spreads: SPREADS.length,   // 20   ← คอมเมนต์ผิด ของจริง 25
} as const;
```

ไฟล์นี้ถูก import โดย `SiteFooter` (client), `SacredNavDropdown` (client), `HomeSeoContent` (client)
ซึ่งอยู่บน **ทุกหน้าของเว็บ** → webpack จึงต้องรวมข้อมูลทั้งสามก้อนเข้าไปในบันเดิลร่วม
ผลคือ chunk `1637` ขนาด **575 KB ดิบ / 126 KB gzip** ถูกดาวน์โหลดตั้งแต่หน้าแรก
ทั้งที่โค้ดต้องการแค่ตัวเลข **3 ตัว**

**ทางแก้** — แทนที่ด้วยค่าคงที่ แล้วให้ด่านตรวจเป็นผู้ยืนยันความจริงแทน compiler:

```ts
// src/components/layout/nav-links.ts
export const COUNTS = {
  cards: 78,
  articles: 26,
  spreads: 25,
} as const;
```

แล้วเพิ่มการยืนยันใน `scripts/qa/test-docs-numbers.ts` (ฝั่งเซิร์ฟเวอร์ล้วน ไม่กระทบบันเดิล):

```ts
assert(COUNTS.cards === DECK.length && COUNTS.articles === ARTICLES.length && COUNTS.spreads === SPREADS.length);
```

**เกณฑ์ผ่าน** — `/` ≤ 320 KB gzip · `/cards` ≤ 260 KB · `/blog` ≤ 260 KB · `npm run repo:verify` ผ่านครบ
**ผลที่วัดมาแล้ว** — ทดลองแก้จริงและ build ซ้ำ: ตัวเลขในคอลัมน์ที่ 3 ของตารางข้อ 1 คือผลลัพธ์จริง
**ความเสี่ยง** — ต่ำมาก ถ้ามีด่านตรวจกำกับ (ตัวเลขเพี้ยนจะถูกจับที่ CI ไม่ใช่ที่หน้าเว็บ)

---

### P-02 · `/cards` ส่งเฉพาะข้อมูลที่หน้านั้นใช้จริง 🔴

**ปัญหา** — [`src/app/cards/page.tsx:71`](../../src/app/cards/page.tsx) ส่ง `<CardsExplorer cards={DECK} />`
React ต้อง serialize ไพ่ทั้ง 78 ใบพร้อม `meanings` (5 หมวด × หัวตั้ง/หัวกลับ) และ `meaningsEn` ลง RSC payload

แต่ `CardsExplorer` ใช้จริงแค่ 10 ฟิลด์: `id · arcana · suit · number · nameTh · nameEn · keywords · element · astrology · image`
(ตรวจแล้วด้วย `grep -o 'card\.[a-zA-Z]*' src/components/encyclopedia/CardsExplorer.tsx | sort -u`)

**ขนาดที่วัดได้**

| ส่งอะไร | JSON ดิบ | gzip |
| :--- | --: | --: |
| `DECK` เต็ม (ตอนนี้) | 595 KB | **148 KB** |
| เฉพาะ 10 ฟิลด์ที่ใช้ | 45 KB | **8 KB** |

**ทางแก้** — เพิ่ม type + ตัวแปลงใน `src/data/cards/index.ts`:

```ts
export type CardSummary = Pick<TarotCard,
  "id" | "arcana" | "suit" | "number" | "nameTh" | "nameEn" | "keywords" | "element" | "astrology" | "image">;

export const DECK_SUMMARY: readonly CardSummary[] = DECK.map(({ id, arcana, suit, number, nameTh, nameEn, keywords, element, astrology, image }) =>
  ({ id, arcana, suit, number, nameTh, nameEn, keywords, element, astrology, image }));
```

แล้วเปลี่ยน `CardsExplorerProps.cards` เป็น `readonly CardSummary[]`
ทำแบบเดียวกันกับหน้าที่มีอาการเดียวกัน:
`/cards/minor` (656 KB) · `/cards/major` (308 KB) · `/cards/all` (280 KB) · `/cards/{cups,wands,swords,pentacles}` (~220 KB ต่อหน้า)

> ⚠️ **ห้ามละเมิดกฎเหล็กข้อ 14** — การตัดฟิลด์นี้เป็นการ "ส่งน้อยลง" ไม่ใช่ "สร้างไพ่ใหม่"
> หน้ารายละเอียด `/cards/[id]` ยังต้องอ่านจาก `DECK` เต็มเหมือนเดิม และห้ามมี fallback มโนไพ่ใด ๆ

**เกณฑ์ผ่าน** — `.next/server/app/cards.html` ≤ 200 KB · หน้ายังกรองตามดอก/ค้นหาได้ครบเหมือนเดิม

---

### P-03 · ย้ายเนื้อหา SEO ออกจากบันเดิลไคลเอนต์ 🟡

`HomeSeoContent.tsx` (751 บรรทัด) และ `SiteFooter.tsx` เป็น `"use client"` เพียงเพราะเรียก `useLocale()`
ผลคือ **คำบรรยาย SEO ทั้งภาษาไทยและอังกฤษถูกส่งสองรอบ** — ครั้งหนึ่งใน HTML อีกครั้งใน JS

ทางแก้ (ทำหลัง S-02 เพราะใช้กลไกเดียวกัน): เมื่อมี locale ฝั่งเซิร์ฟเวอร์แล้ว ให้แยกเป็น
`HomeSeoContent` = Server Component ที่รับ `isEnglish` เป็น prop และตัด `"use client"` ทิ้ง

**เกณฑ์ผ่าน** — `/` ≤ 250 KB gzip หลังทำครบทั้ง P-01 + P-03

---

## 3. คลื่นที่ 2 — ท่อภาพไพ่ (Image Pipeline)

### P-04 · ภาพย่อที่หนักกว่าภาพต้นฉบับ 🟠

**หลักฐาน**

```
public/cards/w768/wands-11.webp  489,574 bytes
public/cards/wands-11.jpg        356,541 bytes   ← ต้นฉบับ เล็กกว่า 27%
```

คอมเมนต์ใน [`scripts/generate-card-variants.ts:36`](../../scripts/generate-card-variants.ts) เขียนว่า `w768 ≈ 38KB`
**ของจริงคือ 355 KB เฉลี่ย — พลาดไป 9 เท่า**

**สาเหตุ** — `runRemasterPass()` เอาภาพผ่าน Pillow unsharp mask ก่อนเข้ารหัส
การเพิ่มความคมชัดคือการเพิ่มความถี่สูงในภาพ ซึ่งเป็นสิ่งที่ WebP บีบอัดได้แย่ที่สุด
พอบวกกับ `-q 85` ที่ w768 (ซึ่งกว้างเกือบเท่าต้นฉบับ ~829px) ไฟล์จึงบวมกว่า JPEG เดิม

**ผลกระทบจริง** — [`CardDetailView.tsx:127`](../../src/components/encyclopedia/CardDetailView.tsx) ประกาศ
`sizes="(min-width: 640px) 600px, 400px"` → บนจอ 2× เบราว์เซอร์เลือก `w768`
ภาพหลัก (LCP) ของหน้าไพ่ **78 หน้า** จึงหนัก 355 KB ทั้งที่ควรอยู่ราว 60–70 KB

**ทางแก้ที่เสนอ**

1. ข้าม remaster pass สำหรับ `w512`/`w768` (ความคมมีความหมายกับภาพจิ๋วเท่านั้น)
2. ลดคุณภาพลงตามขนาด: `w512: q78`, `w768: q72` — ที่ความกว้างระดับนั้นตาแยกไม่ออก
3. ตั้งเพดานอัตโนมัติในสคริปต์: ถ้าไฟล์ `.webp` ที่ได้ **ใหญ่กว่า `.jpg` ต้นฉบับ** ให้ล้มการ build ทันที
4. รัน `npm run cards:variants -- --force` แล้ว commit ภาพชุดใหม่

> ⚠️ ห้ามแตะ `public/cards/*.jpg` (กฎเหล็กข้อ 5 · 1909 Rider-Waite Only) — แก้เฉพาะไฟล์ย่อ
> ⚠️ `public/_headers` ตั้ง `immutable` 1 ปีให้ `/cards/*` — **ต้องเปลี่ยนชื่อโฟลเดอร์** (เช่น `w768` → `w768b`)
> พร้อมกับอัปเดต `CARD_IMAGE_VARIANTS` ใน `src/lib/tarot/card-image.ts` ไม่งั้นคนเก่าจะเห็นภาพเดิมค้างทั้งปี

**เกณฑ์ผ่าน** — ทุกไฟล์ใน `w512`/`w768` เล็กกว่า `.jpg` ต้นฉบับของใบเดียวกัน · `w768` เฉลี่ย ≤ 90 KB
· `public/cards` รวมลดจาก 65 MB เหลือ ≤ 30 MB · ด่าน `test-image-paths.ts` ยังผ่าน

---

## 4. คลื่นที่ 3 — โค้ดตายและสุขอนามัยของคลัง

### D-01 · โมดูลที่ไม่มีใครเรียกเลย (321 บรรทัด)

| ไฟล์ | บรรทัด | เหตุผลที่ตาย |
| :--- | --: | :--- |
| `src/lib/audio/tts.ts` | 161 | ระบบอ่านออกเสียงถูกเขียนใหม่ใน `TTSReaderButton` + `lib/utils/audio.ts` แล้ว |
| `src/components/entitlement/QuotaMeter.tsx` | 99 | ถูกแทนที่ด้วย `QuotaPips` / `EntitlementStatusCard` |
| `src/lib/i18n/server.ts` | 38 | เขียนไว้แต่ไม่เคยต่อสาย — **เก็บไว้ก่อน**, S-02 จะเอามาใช้ |
| `src/components/layout/SiteShell.tsx` | 23 | ทุกหน้าประกอบ `SiteHeader`/`SiteFooter` เองหมดแล้ว |

วิธีตรวจซ้ำ: สคริปต์ไล่ import graph ทั้ง `src/` + `scripts/` (แนบไว้ในภาคผนวก)
**ลบได้ 3 ไฟล์ · เก็บ `i18n/server.ts` ไว้ให้ S-02**

### D-02 · export ที่ไม่มีใครเรียก 14 ตัว

`getCardKeywords` · `getPersonaName` · `getPersonaTagline` · `anthropicBaseUrl` · `OG_IMAGE_BLOCK`
· `useDictionary` · `getServerDictionary` · `getDictionary` · `setReaderStatus` · `recordAdminAudit`
· `kvIncr` · `getAiDisclosure` · `FollowUpSchema` · `QuotaMeter`

> ⚠️ ตรวจทีละตัวก่อนลบ — บางตัวเป็น API ที่ตั้งใจเผื่อไว้ (เช่น `recordAdminAudit` เกี่ยวกับ PDPA)
> ตัวไหนตั้งใจเก็บ ให้ใส่คอมเมนต์บอกเหตุผล ไม่ใช่ปล่อยให้คนถัดไปมาตรวจซ้ำ

### D-03 · `npm run lint` พังเงียบ 🟡

```
$ npm run lint
> next lint
Invalid project directory provided, no such directory: .../lint
```

Next.js 16 ถอดคำสั่ง `next lint` ออกแล้ว คำว่า `lint` จึงถูกตีความเป็น "ชื่อโฟลเดอร์โปรเจกต์"
**แปลว่าคลังนี้ไม่มี linter ทำงานอยู่เลยแม้แต่ตัวเดียว** ทั้งที่มีด่านตรวจ 33 ด่าน

ทางแก้: ติดตั้ง `eslint` + `eslint-config-next` แล้วเปลี่ยนเป็น `"lint": "eslint ."`
หรือถ้าเจ้าของโปรเจกต์ไม่ต้องการ ESLint ให้ **ลบสคริปต์ทิ้ง** ดีกว่าปล่อยให้เป็นคำสั่งลวง

### D-04 · ไฟล์ทดสอบกำพร้า

`scripts/qa/test-card-meanings-en.ts` มีอยู่จริงแต่ไม่ได้อยู่ใน `CHECKS` ของ `scripts/github-auto.ts`
→ ไม่เคยถูกรันใน CI เลย · ให้เพิ่มเข้าด่าน หรือลบทิ้ง

### D-05 · คำเตือนตอน build

```
Found 1 warning while optimizing generated CSS:
.shadow-\[var\(--shadow-\*\)\] { --tw-shadow: var(--shadow-*); Unexpected token Delim('*') }
```

เพราะ `--shadow-raised` / `--shadow-overlay` ถูกประกาศใน `:root` แทนที่จะอยู่ใน `@theme`
Tailwind v4 จึงไม่รู้จัก namespace `--shadow-*` · ทางแก้: ย้ายสองตัวนี้เข้า `@theme`
แล้วเปลี่ยน 20 จุดที่เขียน `shadow-[var(--shadow-raised)]` เป็น `shadow-raised`

---

## 5. คลื่นที่ 4 — SEO ที่ยังพังอยู่จริง

### S-01 · `hreflang` หายจากทุกหน้า 🟠

`src/app/layout.tsx:75` ประกาศ

```ts
alternates: { canonical: SITE_ORIGIN, languages: { "th-TH": ..., "en-US": ..., "x-default": ... } }
```

แต่ทุกหน้าที่ประกาศ `alternates: { canonical: ... }` ของตัวเอง **เขียนทับทั้งก้อน** `alternates`
Next.js ไม่ merge ให้ทีละคีย์ ผลคือแท็ก `hreflang` **ไม่ปรากฏในหน้าใดเลย** — ยืนยันแล้วจาก HTML ที่ build ออกมา:

```bash
$ grep -o 'hreflang="[^"]*"' .next/server/app/index.html
(ไม่มีผลลัพธ์)
```

ทางแก้: สร้าง helper `buildAlternates(path)` ใน `src/lib/config/site.ts` แล้วให้ทุกหน้าเรียกใช้แทน
การเขียน `alternates` ดิบ ๆ พร้อมด่านตรวจว่าไม่มีไฟล์ไหนเขียน `alternates: {` เองอีก

### S-02 · `?lang=en` เสิร์ฟ HTML ภาษาไทย 🟠

`LocaleProvider` เป็น client component ที่อ่านภาษาจาก query/cookie/localStorage **บนเบราว์เซอร์เท่านั้น**
และ `src/app/layout.tsx:142` เรียก `<LocaleProvider>` โดย **ไม่ส่ง `initialLocale`** เลย
(ยืนยันแล้ว: `grep -rn "initialLocale" src` ไม่มีจุดใดส่งค่านี้)

ผลที่ตามมา 3 อย่าง:

1. เซิร์ฟเวอร์เรนเดอร์ `<html lang="th">` เสมอ → บอตทุกตัวเห็นแต่ภาษาไทย
2. ผู้ใช้ที่ตั้ง EN ไว้เจอ **hydration mismatch ทุกครั้ง** (SSR ไทย → client อังกฤษ)
3. `hreflang` ที่จะแก้ใน S-01 จะชี้ไปยัง URL ที่เนื้อหาซ้ำกับภาษาไทย = Google มองว่าเป็น duplicate

ทางแก้ (`src/lib/i18n/server.ts` เขียนรอไว้แล้ว แค่ไม่เคยต่อสาย):

```tsx
// src/app/layout.tsx
const locale = await getServerLocale();          // อ่านจาก cookie ฝั่งเซิร์ฟเวอร์
<html lang={locale}>
  <LocaleProvider initialLocale={locale}>
```

และรับ `?lang=` ที่ฝั่งเซิร์ฟเวอร์ด้วย (middleware ตั้ง cookie แล้ว redirect ทิ้ง query)
เพื่อให้ URL ที่ประกาศใน `hreflang` เสิร์ฟภาษานั้นจริงตั้งแต่ไบต์แรก

**เกณฑ์ผ่าน** — `curl -H 'Cookie: locale=en' https://seertarot.net/ | grep '<html lang'` ต้องได้ `en`
· ไม่มี hydration warning ใน console เมื่อสลับภาษา

### S-03 · `/account` ขาด `robots: noindex` 🔵

ทุกหน้าส่วนตัวอื่น (`/admin` `/tester` `/reset-password` `/readers/console` `/readers/queue`)
ประกาศ `robots: { index: false }` ที่ layout ของตัวเอง พร้อมคอมเมนต์ย้ำว่า
"ต้องประกาศจริง ไม่ใช่พึ่ง robots.txt อย่างเดียว" — แต่ `src/app/account/layout.tsx` ลืมประกาศ

### S-04 · `/tarot` ใช้ redirect ตอนรันไทม์ 🔵

`src/app/tarot/page.tsx` เรียก `redirect("/")` ซึ่งได้ HTTP 307 (ชั่วคราว) และต้องปลุก Worker ทุกครั้ง
ควรย้ายไป `redirects()` ใน `next.config.ts` แบบ `permanent: true` (308) เหมือน 7 เส้นทางที่ทำไว้แล้ว

---

## 6. คลื่นที่ 5 — ด่านกันถอยหลัง (สำคัญที่สุดในระยะยาว)

บทเรียนของคลังนี้เขียนไว้ชัดใน `test-docs-numbers.ts` แล้วว่า
**"กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน"**
P-01 โตเงียบ ๆ มาถึง 126 KB ได้ก็เพราะไม่มีใครวัด

### G-01 · ด่านที่ 34 — งบน้ำหนักหน้าเว็บ (Performance Budget Gate)

สร้าง `scripts/qa/test-bundle-budget.ts` ที่:

1. อ่าน `.next/server/app/**.html` ที่ build ไว้แล้ว
2. รวมขนาด gzip ของ chunk ทุกตัวที่หน้านั้นอ้างถึง
3. ล้มทันทีถ้าเกินงบ พร้อมบอกว่า chunk ไหนโตขึ้น

| หน้า | งบ JS (gzip) | งบ HTML (gzip) |
| :--- | --: | --: |
| `/` | 250 KB | 40 KB |
| `/cards` | 220 KB | 45 KB |
| `/cards/[id]` | 220 KB | 30 KB |
| `/blog/[slug]` | 220 KB | 60 KB |
| ทุกหน้าอื่น | 260 KB | 60 KB |

> ตั้งงบเป็น **ratchet** — ปรับลงได้อย่างเดียว ห้ามปรับขึ้นโดยไม่มีเหตุผลเขียนกำกับ

### G-02 · ด่านตรวจ "ห้าม import ข้อมูลก้อนใหญ่ในโค้ดฝั่งไคลเอนต์"

ตรวจแบบสถิต: ไฟล์ที่ขึ้นต้นด้วย `"use client"` (และทุกอย่างที่มัน import ต่อ)
ห้ามแตะ `@/data/cards` `@/data/articles` `@/data/spreads` แบบ **value import**
(`import type` อนุญาต) เว้นแต่มีคอมเมนต์ `// @allow-heavy-data: <เหตุผล>` กำกับ

---

## 7. ลำดับการลงมือที่แนะนำ

| PR | เนื้อหา | ผลที่คาด | พึ่งพา |
| :-- | :--- | :--- | :--- |
| 1 | G-01 (ด่านงบน้ำหนัก) — ตั้งงบเท่าค่าปัจจุบันก่อน | มีเครื่องวัดก่อนลงมือ | — |
| 2 | P-01 + D-01 + D-03 + D-04 | −33% ถึง −41% JS ทุกหน้า | PR 1 |
| 3 | P-02 (โครงสร้าง `CardSummary`) | `/cards` เบาลง ~85% | PR 2 |
| 4 | P-04 (ภาพไพ่ชุดใหม่ + เพดานขนาด) | LCP หน้าไพ่ 78 หน้าเร็วขึ้นมาก | — |
| 5 | S-01 + S-03 + S-04 | hreflang กลับมา · หน้าส่วนตัวปิดสนิท | — |
| 6 | S-02 + P-03 (i18n ฝั่งเซิร์ฟเวอร์) | หน้า EN มีตัวตนใน Google · `/` เบาลงอีก | PR 5 |
| 7 | D-02 + D-05 + ปรับงบใน G-01 ให้แน่นขึ้น | ปิดงาน | ทุก PR ข้างบน |

ทุก PR ต้อง: `npm run agent:lock` → แก้ → `npm run repo:verify` → `npm run pr:auto` → `npm run git:tidy`
(กฎเหล็กข้อ 11 · 12 · 13) และบันทึกลง `docs/WORK_LOG.md` ทุกครั้ง (กฎข้อ 1)

---

## 8. สิ่งที่ตรวจแล้ว "ไม่พบปัญหา" (อย่าตรวจซ้ำ)

เพื่อไม่ให้ Agent ตัวถัดไปเสียเวลาไล่จุดเดิม:

- ✅ **TypeScript** — `tsc --noEmit` 0 error
- ✅ **`next build`** — สำเร็จ ไม่มี error (มีเพียงคำเตือน CSS ตาม D-05)
- ✅ **โมดูลกำพร้า** — ทั้งคลัง 362 ไฟล์ มีเพียง 4 ไฟล์ที่ไม่มีใคร import (ดู D-01)
- ✅ **`robots.ts`** — เขียนดีมาก แยกบอต AI search / AI training ชัดเจน ครอบคลุมทุก private path
- ✅ **`sitemap.ts`** — ใช้ `lastModified` คงที่ ไม่ใช่ `new Date()` (ถูกต้องแล้ว)
- ✅ **JSON-LD** — Organization/WebSite อยู่ที่ layout · FAQ/HowTo/WebApplication อยู่เฉพาะหน้าแรก · มี BreadcrumbList ครบ
- ✅ **หน่วยความจำรั่ว** — ทุก `setInterval` มี `clearInterval` · ทุก `addEventListener` มี `removeEventListener` (ยกเว้น `TurnstileWidget` ซึ่งมีขอบเขตจำกัดและปลอดภัย)
- ✅ **XSS** — `dangerouslySetInnerHTML` ทุกจุดใส่เฉพาะ `JSON.stringify` ของข้อมูลคงที่ ไม่มีข้อมูลผู้ใช้
- ✅ **Cache headers** — `public/_headers` ตั้ง `immutable` ให้ `/cards/*` และ `/_next/static/*` ถูกต้องแล้ว
- ✅ **โค้ดสกปรก** — `console.log` เหลือ 4 จุด · `TODO` 1 จุด · `as any` 17 จุด (อยู่ในเกณฑ์ปกติสำหรับโค้ด 60,644 บรรทัด)
- ✅ **Code-splitting ของ `TarotFlow`** — แยก dynamic import ไว้ 15 คอมโพเนนต์แล้ว ทำได้ดี
- ✅ **ฟอนต์** — ใช้ `next/font` โฮสต์เอง มี `display: swap` + `adjustFontFallback` รวม ~110 KB (ยอมรับได้)

---

## 9. ภาคผนวก — สคริปต์ตรวจโมดูลกำพร้า

```bash
node -e '
const fs=require("fs"),path=require("path"),root=process.cwd(),files=[];
const walk=(d,a)=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  e.isDirectory()?walk(p,a):/\.(ts|tsx)$/.test(e.name)&&!/\.d\.ts$/.test(e.name)&&a.push(p)}};
walk(path.join(root,"src"),files); walk(path.join(root,"scripts"),files);
const ref=new Set(), re=/(?:from\s+|import\s*\(\s*)["\x27]([^"\x27]+)["\x27]/g;
for(const f of files){const s=fs.readFileSync(f,"utf8");let m;
  while((m=re.exec(s))){const sp=m[1];let abs;
    if(sp.startsWith("@/"))abs=path.join(root,"src",sp.slice(2));
    else if(sp.startsWith("."))abs=path.resolve(path.dirname(f),sp); else continue;
    for(const c of [abs+".ts",abs+".tsx",path.join(abs,"index.ts"),path.join(abs,"index.tsx")])
      if(fs.existsSync(c)){ref.add(c);break}}}
const entry=/src\/app\/.*(page|layout|route|not-found|error|global-error|sitemap|robots|manifest)\.tsx?$/;
files.filter(f=>f.includes("/src/")&&!ref.has(f)&&!entry.test(f))
     .forEach(f=>console.log("ORPHAN:",path.relative(root,f)));'
```
