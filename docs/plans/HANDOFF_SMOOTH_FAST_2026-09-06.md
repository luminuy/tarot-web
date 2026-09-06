# ✦ แผนทำให้เว็บ "สมูทและไว" ระดับโลก — ทุกหน้า ทุกจังหวะ (2026-09-06)

> **สถานะ**: แผน (ยังไม่ลงมือ) · **ฐานที่วัด**: `7f2dab2` (main หลัง #327) · **ผู้ตรวจ**: Claude Opus 5
> **คำสั่งเจ้าของ**: "สมูททุกจุด ไม่ว่าจะตอนเปลี่ยนหน้า หรือหน้าไพ่ ทุก ๆ หน้า สมูทและไว ระดับโลก"
>
> **ผลวัดย่อ**: เว็บ**ไม่ช้าเพราะเซิร์ฟเวอร์** (หน้า SSG เสิร์ฟจาก edge แล้ว `x-opennext-cache: HIT`)
> แต่**ช้าเพราะ JavaScript ที่ส่งไปให้เบราว์เซอร์** — ทุกหน้าส่ง **211–452 KB (gzip)**
> ขณะที่เกณฑ์ระดับโลกคือ **≤ 170 KB** · และ**สะดุดเพราะแอนิเมชันบางจุดวาดใหม่ทั้งกล่อง**แทนที่จะ
> ให้ GPU เลื่อนอย่างเดียว

---

## 0. สรุปผู้บริหาร (อ่านแค่ตารางนี้ก็พอ)

| # | เรื่อง | ผลที่คาดว่าจะได้ | ระดับ | แรง |
| :-- | :--- | :--- | :-- | :-- |
| **F-01** | สำรับไพ่เต็ม 896 KB ยังถูกลากเข้าบันเดิลไคลเอนต์ผ่าน `cardById()` | **−100 ถึง −130 KB gzip ต่อหน้า** | 🔴 | ปานกลาง |
| **F-02** | `motion` ถูกโหลดทุกหน้ารวมหน้าที่ไม่มีแอนิเมชันเลย (`/blog`, `/privacy`) | **−30 ถึง −45 KB gzip** บนหน้าเนื้อหา | 🟠 | เล็ก |
| **F-03** | `/daily` + `/love/1-card` หนัก **448–452 KB** สูงสุดในเว็บ | −150 KB+ ต่อหน้า | 🔴 | ปานกลาง |
| **S-01** | `boxShadow` ถูกแอนิเมตตอน hover × ไพ่ 80 ใบ → paint ทั้งกล่อง ไม่ใช่ composite | ตัดการกระตุกตอนเลื่อนเมาส์/แตะ | 🟠 | เล็ก |
| **S-02** | คลาส `.content-visibility-auto` มีใน CSS แต่**ไม่มีใครใช้เลยสักที่** | หน้า `/cards` เปิดเร็วขึ้นเห็นได้ชัด | 🟠 | เล็ก |
| **S-03** | ไพ่ 80 ใบเรนเดอร์ DOM พร้อมกันหมดในหน้าเดียว | ลดงาน layout/paint รอบแรก | 🟡 | ปานกลาง |
| **N-01** | เปลี่ยนหน้าเป็น "ตัดภาพ" ไม่มี View Transition | ความรู้สึกต่อเนื่องแบบแอป | 🟠 | ปานกลาง |
| **N-02** | ลิงก์ฟุตเตอร์ตั้ง `prefetch={false}` ทุกอัน | กดแล้วรอโหลดใหม่ทุกครั้ง | 🟡 | เล็ก |
| **G-01** | ไม่มีด่านคุม "งบ JS ต่อหน้า" ให้ลดลงจริง (ด่านปัจจุบันคุมไม่ให้โตเท่านั้น) | กันถอยหลังถาวร | 🟠 | เล็ก |

**ลำดับที่แนะนำ**: F-01 → F-03 → F-02 → S-01 → S-02 → N-02 → N-01 → S-03 → G-01

---

## 1. ตัวเลขฐาน — วัดจริง ไม่ใช่ประมาณ

```bash
npm run build && npm run test:budget
```

| เส้นทาง | JS (gzip) | งบปัจจุบัน | เกณฑ์ระดับโลก | เกินอยู่ |
| :--- | ---: | ---: | ---: | ---: |
| `/cards/all` | **211 KB** | ≤ 220 | ≤ 170 | 1.2× |
| `/` | **305 KB** | ≤ 315 | ≤ 170 | 1.8× |
| `/spreads` | **313 KB** | ≤ 320 | ≤ 170 | 1.8× |
| `/cards` | **313 KB** | ≤ 320 | ≤ 170 | 1.8× |
| `/blog` | **315 KB** | ≤ 325 | ≤ 170 | 1.9× |
| `/cards/major-00` | **374 KB** | ≤ 385 | ≤ 170 | 2.2× |
| `/daily` | **448 KB** | ≤ 455 | ≤ 170 | **2.6×** |
| `/love/1-card` | **452 KB** | ≤ 460 | ≤ 170 | **2.7×** |

**chunk ที่หนักที่สุด** (`ls -S .next/static/chunks/*.js`):

| chunk | raw | gzip | มีอะไรอยู่ข้างใน |
| :--- | ---: | ---: | :--- |
| `1637-*.js` | 574 KB | **132 KB** | สำรับไพ่เต็ม (พบสตริง `The Fool`, `คนเขลา`, `upright`) + `motion` |
| `3794-*.js` | 235 KB | 64 KB | โค้ดแอปร่วม |
| `1524-*.js` | 122 KB | 39 KB | โค้ดแอปร่วม |

**ขนาดข้อมูลต้นทาง**: `src/data/cards` รวม **896 KB** · ไฟล์ใหญ่สุด `visual-lore.ts` **147 KB**

> 📌 หมายเหตุ: งบในด่านที่ 33 ตั้งไว้ "สูงกว่าของจริงนิดเดียว" ซึ่งกัน**ไม่ให้โตขึ้น**ได้
> แต่ไม่ได้บังคับให้**ลดลง** — จึงต้องมี G-01 กำกับ

---

## 2. คลื่นที่ 1 — ความไว (ตัด JavaScript ที่ไม่จำเป็นออก)

### F-01 · สำรับไพ่เต็มยังอยู่ในบันเดิลไคลเอนต์ 🔴

**ปัญหา** — [`src/components/card/TarotCard.tsx:6`](../../src/components/card/TarotCard.tsx) เป็น
client component ที่ถูกเรนเดอร์แทบทุกหน้า และเปิดหัวไฟล์ด้วย

```ts
import { cardById, cardByIndex } from "@/data/cards";
```

`@/data/cards/index.ts` สร้าง `DECK` จากไฟล์ทั้ง 5 สำรับ + `visual-lore.ts`
การ import ฟังก์ชันเดียวจึงลาก **ทั้งก้อน 896 KB** เข้าไปในบันเดิล
(webpack tree-shake ไม่ได้ เพราะ `cardById` ปิดทับ `BY_ID` map ที่สร้างจาก `DECK`)

ไฟล์ client อื่นที่ทำแบบเดียวกัน (ตรวจแล้ว **12 ไฟล์**):
`StreamReader` · `QuickChatResult` · `ShareModal` · `OneCardRitual` · `RelatedCards` ·
`TarotEncyclopediaModal` · `CardsExplorer` · `AllCardsTable` · `CardGroupView` ·
`DailyClient` · `LoveOneCardClient` · `CardDetailView`

**สิ่งที่ component พวกนี้ใช้จริง** — เกือบทั้งหมดต้องการแค่ `id`, `name`, `nameEn`, `image`,
`arcana`, `suit`, `number`, `keywords` · **ไม่ได้ใช้** `visual-lore`, ความหมาย 5 มิติเต็ม,
คำอธิบายยาว ซึ่งเป็นส่วนที่กินพื้นที่มากที่สุด

**ทางแก้** — มี `DECK_SUMMARY` (`CardSummary`) อยู่แล้วใน `index.ts:62` แต่ยังไม่มีใครใช้เป็นทางหลัก
ให้แยกไฟล์ข้อมูลเบาออกมาเป็น **module แยกที่ไม่ import `DECK`**:

```ts
// src/data/cards/summary.ts (ใหม่ — ห้าม import จาก ./index)
export interface CardSummary {
  id: string; name: string; nameEn: string; image: string;
  arcana: "major" | "minor"; suit?: string; number?: number;
  keywords: { upright: string[]; reversed: string[] };
}

// สร้างตอน build ด้วยสคริปต์ แล้ว commit ผลลัพธ์ (แพตเทิร์นเดียวกับ related.generated.ts)
export const CARD_SUMMARIES: readonly CardSummary[] = [ /* … 78 รายการ … */ ];
const BY_ID = new Map(CARD_SUMMARIES.map((c) => [c.id, c]));
export function cardSummaryById(id?: string | null) { return id ? BY_ID.get(id) : undefined; }
export function cardSummaryByIndex(i?: number | null) { … }
```

แล้วเปลี่ยน client component ทั้ง 12 ไฟล์:

```ts
// ก่อน
import { cardById, cardByIndex } from "@/data/cards";
// หลัง
import { cardSummaryById as cardById, cardSummaryByIndex as cardByIndex } from "@/data/cards/summary";
```

> ⚠️ **หน้าที่ต้องใช้ข้อมูลเต็มจริง ๆ** (`/cards/[id]` แสดงความหมาย 5 มิติ) ให้ดึงฝั่ง **เซิร์ฟเวอร์**
> ใน `page.tsx` แล้วส่งเป็น prop ลงมา — ห้าม import `@/data/cards` ในไฟล์ `"use client"` อีก

**เกณฑ์ผ่าน**
- `/cards` ≤ **200 KB gzip** · `/` ≤ **200 KB** · `/cards/major-00` ≤ **250 KB**
- `grep -c "คนเขลา" .next/static/chunks/*.js` = **0** ทุก chunk
- `npm run repo:verify` ผ่าน 34/34 (ด่านที่ 3 ยืนยันไพ่ครบ 78 ใบเหมือนเดิม)
- **กฎเหล็กข้อ 14**: `cardSummaryById()` ต้องคืน `undefined` เมื่อหาไม่เจอ **ห้าม fallback เป็นไพ่ใบใดใบหนึ่ง**

---

### F-03 · `/daily` และ `/love/1-card` หนักที่สุดในเว็บ 🔴

**ปัญหา** — 448 KB และ 452 KB gzip · ทั้งคู่ `import { DECK } from "@/data/cards"` ตรง ๆ
เพื่อใช้สุ่ม/ค้นไพ่ฝั่งไคลเอนต์

**ทางแก้** — สองหน้านี้แสดงไพ่ **ใบเดียว** ไม่จำเป็นต้องมีสำรับในเบราว์เซอร์เลย
1. ให้เซิร์ฟเวอร์ตัดสินไพ่แล้วส่งมาเป็น prop (ไพ่ประจำวันเป็น deterministic จากวันที่อยู่แล้ว
   ดู `src/lib/tarot/daily-card.ts`)
2. ถ้าจำเป็นต้องมีรายการไพ่ฝั่งไคลเอนต์จริง ให้ใช้ `CARD_SUMMARIES` จาก F-01

**เกณฑ์ผ่าน** — `/daily` ≤ **250 KB gzip** · `/love/1-card` ≤ **250 KB** · พฤติกรรมการจั่วไพ่เหมือนเดิมทุกประการ

---

### F-02 · `motion` โหลดทุกหน้าแม้หน้าที่ไม่มีแอนิเมชัน 🟠

**ปัญหา** — [`src/app/layout.tsx:216`](../../src/app/layout.tsx) ครอบทั้งเว็บด้วย `AppMotionProvider`
ซึ่ง `import { MotionConfig } from "motion/react"` → `motion` เข้าไปอยู่ใน chunk ร่วม
หน้าอย่าง `/blog`, `/privacy`, `/cards/all` ที่แทบไม่มีแอนิเมชันก็ต้องดาวน์โหลดไปด้วย
(แพ็กเกจ `motion` ใน `node_modules` = 772 KB · ใช้จริง **30 ไฟล์**)

**ทางแก้ (เลือกทางใดทางหนึ่ง)**

**ทาง ก (แนะนำ)** — ย้าย `AppMotionProvider` ลงไปครอบเฉพาะส่วนที่ใช้จริง
(`TarotFlow`, `OneCardRitual`, modal ต่าง ๆ) แทนที่จะครอบทั้ง `<body>`
ค่า `reducedMotion="user"` ยังใช้ได้เพราะ `MotionConfig` มีผลกับ subtree ที่ครอบเท่านั้น

**ทาง ข** — คงโครงเดิม แต่โหลดแบบ dynamic:

```tsx
const AppMotionProvider = dynamic(
  () => import("@/components/providers/AppMotionProvider").then((m) => m.AppMotionProvider),
  { ssr: true },
);
```

> ⚠️ ทาง ข ช่วยได้น้อยกว่า เพราะ component ลูกที่ `import { motion }` ตรง ๆ ก็ยังลาก `motion`
> เข้ามาอยู่ดี — **ต้องทำคู่กับการเลิกใช้ `motion` ในคอมโพเนนต์ที่แอนิเมชันง่าย ๆ**
> (ดู S-01) จึงจะเห็นผลเต็ม

**เกณฑ์ผ่าน** — `/blog` ≤ **220 KB gzip** · `/privacy` ≤ **200 KB** · แอนิเมชันหน้าเปิดไพ่เหมือนเดิม 100%

---

## 3. คลื่นที่ 2 — ความสมูท (ให้ GPU ทำงาน อย่าให้เบราว์เซอร์วาดใหม่)

### S-01 · `boxShadow` ถูกแอนิเมตบนไพ่ 80 ใบ 🟠

**ปัญหา** — [`TarotCard.tsx:194`](../../src/components/card/TarotCard.tsx) และ `:248`

```tsx
style={{
  boxShadow: isHighlighted || isHovered ? "var(--shadow-overlay)" : "var(--shadow-raised)",
}}
```

`box-shadow` **ไม่ใช่คุณสมบัติที่ GPU composite ได้** — ทุกครั้งที่ค่าเปลี่ยน เบราว์เซอร์ต้อง
**paint กล่องใหม่ทั้งใบ** · ในหน้า `/cards` ที่มีไพ่ 80 ใบ การเลื่อนเมาส์ผ่านแถวไพ่จะสร้าง
paint ต่อเนื่องจนเฟรมตก โดยเฉพาะมือถือรุ่นประหยัด

**ทางแก้** — วางเงาไว้เป็นชั้นซ้อนที่แอนิเมตแค่ `opacity` (composite ล้วน):

```tsx
{/* ชั้นเงา — อยู่หลังไพ่ แอนิเมตเฉพาะ opacity จึงไม่ทำให้เกิด paint */}
<div
  aria-hidden
  className="absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-200"
  style={{
    boxShadow: "var(--shadow-overlay)",
    opacity: isHighlighted || isHovered ? 1 : 0,
    willChange: "opacity",
  }}
/>
```

แล้วให้ไพ่ใบจริงถือ `boxShadow: "var(--shadow-raised)"` แบบ**คงที่** ไม่เปลี่ยนค่าอีก

> ⚠️ **กฎข้อ 55 ของคู่มือ Cloudflare + ด่านที่ 29 ใน `repo:verify`** คุม `will-change`
> ให้ใส่เฉพาะตอน active/animating — เขียน `willChange: "opacity"` ถาวรบน 80 กล่องจะทำให้
> ด่านแดงและกินหน่วยความจำ GPU · ให้ใส่แบบมีเงื่อนไข:
> `willChange: isHovered || isHighlighted ? "opacity" : undefined`

**เกณฑ์ผ่าน**
- เปิด DevTools → Rendering → เปิด **Paint flashing** แล้วเลื่อนเมาส์ผ่านไพ่ในหน้า `/cards`
  ต้อง**ไม่เห็นกรอบเขียวกะพริบ**ที่ตัวไพ่
- Performance panel: ช่วง hover ต้องไม่มี task > 50 ms
- `npm run repo:verify` ผ่านด่านที่ 29 (วินัย `will-change`)

---

### S-02 · คลาส `content-visibility-auto` มีแต่ไม่มีใครใช้ 🟠

**ปัญหา** — [`src/app/globals.css:448`](../../src/app/globals.css) นิยามคลาสไว้เรียบร้อย

```css
.content-visibility-auto { content-visibility: auto; }
```

แต่ `grep -rl "content-visibility-auto" src --include='*.tsx'` = **0 ไฟล์**
เท่ากับเขียนไว้แล้วลืมเอาไปใช้ · หน้า `/cards` จึงเรนเดอร์ไพ่ **80 ใบเต็มรูปแบบ** ตั้งแต่วินาทีแรก

**ทางแก้** — ใส่ที่กล่องไพ่แต่ละใบใน `CardsExplorer` / `CardGroupView` / `AllCardsTable`
พร้อม `contain-intrinsic-size` เพื่อไม่ให้ scrollbar กระโดด:

```tsx
<div
  className="content-visibility-auto"
  style={{ containIntrinsicSize: "auto 320px" }}
>
  <CardImage … />
</div>
```

**เกณฑ์ผ่าน**
- Performance panel ตอนโหลด `/cards`: **Layout + Paint รวมกันลดลง ≥ 40%** เทียบก่อนแก้
- เลื่อนหน้าลงเร็ว ๆ แล้วไพ่ต้องไม่กระพริบว่างเปล่า และ scrollbar ต้องไม่กระโดด
- ค้นหาไพ่ (ช่องค้นหาในหน้าเดียวกัน) ต้องยังกรองได้ครบ 78 ใบเหมือนเดิม

---

### S-03 · ไพ่ 80 ใบอยู่ใน DOM พร้อมกัน 🟡

**ปัญหา** — ยืนยันจาก production: `curl -s https://seertarot.net/cards | grep -c '<picture'` = **80**
ต่อให้ทำ S-02 แล้ว DOM node ก็ยังต้องถูกสร้างครบทุกใบ

**ทางแก้** — ทำต่อจาก S-02 เท่านั้นถ้าวัดแล้วยังไม่พอ (อย่าทำพร้อมกัน จะแยกไม่ออกว่าอะไรช่วย):
เรนเดอร์ 24 ใบแรกทันที ที่เหลือค่อยเติมด้วย `IntersectionObserver` หรือปุ่ม "ดูเพิ่ม"

> ⚠️ **ห้ามทำ virtualization แบบตัด DOM ทิ้ง** — จะทำให้ Googlebot เห็นไพ่ไม่ครบ 78 ใบ
> ซึ่งขัดกับกลยุทธ์ SEO ทั้งหมดของเว็บ (ดู `TRAFFIC_CAPTURE_PLAN`) · ให้ทุกใบอยู่ใน HTML เสมอ
> แล้วเลื่อนแค่ "เวลาที่เบราว์เซอร์ลงมือวาด" เท่านั้น

---

## 4. คลื่นที่ 3 — การเปลี่ยนหน้าให้ต่อเนื่องเหมือนแอป

### N-02 · ลิงก์ฟุตเตอร์ปิด prefetch ทุกอัน 🟡

**ปัญหา** — [`SiteFooter.tsx`](../../src/components/layout/SiteFooter.tsx) ตั้ง `prefetch={false}`
ทุกลิงก์ · กดแล้วต้องรอโหลดใหม่ทั้งหมด

**ทางแก้** — ตอนนี้เว็บเป็น SSG ทั้งหมดแล้ว (167 หน้า prerender) การ prefetch จึงถูกมาก
เพราะดึงจาก edge cache ไม่ได้ปลุก Worker · เปลี่ยนลิงก์หลัก (ไม่เกิน 6–8 เส้นทางยอดนิยม)
เป็น `prefetch={true}` แล้วคงลิงก์ปลายทางหายาก (นโยบาย, บทความเก่า) ไว้ที่ `false`

> 📌 มี Speculation Rules อยู่แล้วจาก PR #319 (`eagerness: "moderate"` = prerender ตอน hover)
> ซึ่งทำงาน**เฉพาะเบราว์เซอร์ตระกูล Chromium** · `prefetch` ของ Next ครอบ Safari/Firefox ให้ด้วย
> **ทั้งสองอย่างเสริมกัน ไม่ใช่ทางเลือกแทนกัน**

**เกณฑ์ผ่าน** — กดจากฟุตเตอร์ไป `/cards`, `/spreads`, `/blog` แล้วหน้าเปลี่ยนภายใน **< 200 ms**
บนเน็ตปกติ (วัดด้วย Performance panel ช่วง Navigation)

---

### N-01 · เพิ่ม View Transitions ให้การเปลี่ยนหน้าไม่ "ตัดภาพ" 🟠

**ปัญหา** — ตรวจแล้วไม่มี `startViewTransition` หรือ CSS `view-transition-*` ในโค้ดเลย
การเปลี่ยนหน้าจึงเป็นการสลับภาพทันที ซึ่งเป็นจุดที่ห่างจาก "ระดับโลก" มากที่สุดในเชิงความรู้สึก

**ทางแก้ — ทำเป็น 2 ขั้น**

**ขั้นที่ 1 (ปลอดภัย ได้ผลทันที)** — เปิด cross-document view transition ด้วย CSS อย่างเดียว
ไม่ต้องแตะ JavaScript สักบรรทัด:

```css
/* src/app/globals.css */
@view-transition { navigation: auto; }

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: 220ms;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  @view-transition { navigation: none; }
}
```

**ขั้นที่ 2 (ถ้าอยากได้ "ไพ่บินตาม")** — ให้ภาพไพ่ในกริดกับภาพไพ่ในหน้ารายละเอียดใช้
`view-transition-name` เดียวกัน ไพ่จะขยายต่อเนื่องจากกริดไปหน้าเต็ม:

```tsx
<CardImage … style={{ viewTransitionName: `card-${card.id}` }} />
```

> ⚠️ `view-transition-name` ต้อง **ไม่ซ้ำกันในหน้าเดียว** — ในหน้า `/cards` ที่มีไพ่ 80 ใบ
> ให้ใส่เฉพาะใบที่ผู้ใช้กด (ตั้งค่าใน `onClick` ก่อน navigate) ไม่ใช่ใส่ทุกใบพร้อมกัน
> ไม่งั้นเบราว์เซอร์จะยกเลิก transition ทั้งหมด
>
> ⚠️ Safari/Firefox บางรุ่นยังไม่รองรับ — ต้องเสื่อมสภาพอย่างนุ่มนวล (ไม่รองรับ = เปลี่ยนหน้าแบบเดิม
> ห้ามพัง)

**เกณฑ์ผ่าน**
- Chrome: กด `/cards` → `/cards/major-00` แล้วเห็นการเปลี่ยนที่ต่อเนื่อง ไม่กระตุก
- Safari: เปลี่ยนหน้าได้ปกติ ไม่มี error ใน console
- ตั้งค่า OS เป็น "ลดการเคลื่อนไหว" แล้ว transition ต้องหายไป (ไม่ใช่แค่เร็วขึ้น)

---

## 5. คลื่นที่ 4 — ด่านกันถอยหลัง

### G-01 · ทำให้งบ JS "ลดลงจริง" ไม่ใช่แค่ไม่โต 🟠

**ปัญหา** — ด่านที่ 33 (`scripts/qa/test-perf-budget.ts`) ตั้งงบไว้สูงกว่าของจริงเพียง 5–10 KB
กันไม่ให้โตได้ แต่ไม่มีแรงกดดันให้ลด · ถ้าไม่แก้ ตัวเลข 450 KB จะอยู่แบบนี้ตลอดไป

**ทางแก้** — ใส่ "เป้าหมายระยะยาว" คู่กับงบปัจจุบัน แล้วบีบลงเป็นขั้น ๆ ทุกครั้งที่ทำสำเร็จ:

```ts
const BUDGETS = [
  { route: "/cards",       js: 320, jsTarget: 170, html: 40 },
  { route: "/daily",       js: 455, jsTarget: 200, html: 25 },
  // …
];
// เตือน (ไม่ทำให้แดง) เมื่อยังห่างจากเป้า · แดงเมื่อโตเกินงบปัจจุบัน
// ทุกครั้งที่ลดสำเร็จ ให้ลด `js` ลงมาชนของจริง + 5 KB ทันที (ratchet)
```

**เกณฑ์ผ่าน** — หลังทำ F-01 ถึง F-03 เสร็จ ต้องลดค่า `js` ในไฟล์ด่านลงให้ชนของจริง
มิฉะนั้นงบที่หลวมจะเปิดช่องให้โตกลับ

---

## 6. ลำดับการลงมือที่แนะนำ

| PR | งาน | เหตุผลที่ต้องมาลำดับนี้ |
| :-- | :--- | :--- |
| 1 | **F-01** แยก `summary.ts` + เปลี่ยน client 12 ไฟล์ | ผลมากที่สุด และเป็นฐานให้ F-03 |
| 2 | **F-03** `/daily` + `/love/1-card` | ต่อยอดจาก F-01 ทันที |
| 3 | **F-02** ขอบเขต `motion` | วัดผลง่ายหลังบันเดิลเบาลงแล้ว |
| 4 | **S-01** เงาเป็นชั้น opacity | เล็ก เสี่ยงต่ำ เห็นผลกับมือถือทันที |
| 5 | **S-02** `content-visibility` | ต้องวัดหลัง S-01 จะได้รู้ว่าอะไรช่วย |
| 6 | **N-02** เปิด prefetch ลิงก์หลัก | 1 ไฟล์ |
| 7 | **N-01** View Transitions ขั้นที่ 1 (CSS ล้วน) | ปลอดภัยสุด ทำหลังบันเดิลเบาแล้วจะรู้สึกชัด |
| 8 | **S-03** ทยอยเรนเดอร์ (ถ้ายังจำเป็น) | ทำเฉพาะเมื่อวัดแล้วยังไม่พอ |
| 9 | **G-01** บีบงบลง | ปิดท้ายเพื่อล็อกผลที่ได้ |

> อย่ารวมหลายข้อใน PR เดียว — ตัวเลขจะแยกไม่ออกว่าข้อไหนช่วย และถ้าต้องถอยจะถอยยาก

---

## 7. สิ่งที่ตรวจแล้ว "ดีอยู่แล้ว" (อย่าเสียเวลาแก้)

| รายการ | สถานะ |
| :--- | :--- |
| หน้า HTML จากเซิร์ฟเวอร์ | ✅ SSG 167 หน้า · `x-opennext-cache: HIT` ทุกหน้า · ไม่ใช่คอขวด |
| ภาพไพ่ | ✅ ImageKit + `srcset` 5 ขนาด + `sizes` ครบ · ออกจาก Cloudflare 100% |
| ฟอนต์ไทย | ✅ `next/font` + `subsets: ["thai","latin"]` + `display: "swap"` + `adjustFontFallback` (กัน CLS แล้ว) |
| การพลิกไพ่ 3D | ✅ ใช้ `rotateY` + `preserve-3d` + `backfaceVisibility` ซึ่ง GPU composite ได้ (ปัญหาอยู่ที่ `boxShadow` เท่านั้น — ดู S-01) |
| Service Worker | ✅ static = cache-first · HTML = network-first · เส้นทางไดนามิก = network-only |
| Speculation Rules | ✅ มีแล้วจาก #319 และไม่กินโควตาดูดวง |
| preconnect ไป AI provider | ✅ มีแล้วจาก #319 |
| `reducedMotion` | ✅ ตั้ง `"user"` ใน `AppMotionProvider` แล้ว |

---

## 8. หมายเหตุถึงทีมที่รับไปทำ

1. **วัดก่อน–หลังทุก PR** ด้วย `npm run build && npm run test:budget` แล้วแปะตัวเลขลงใน PR
   ตัวเลขในเอกสารนี้คือฐานที่ `7f2dab2` ถ้า main ขยับไปไกลให้วัดใหม่ก่อน
2. **S-01 และ S-02 ตรวจด้วยตัวเลขบันเดิลไม่ได้** — ต้องเปิด DevTools Performance/Paint flashing
   แล้วแนบภาพลงใน PR
3. **กฎเหล็กข้อ 14 ครอบ F-01 โดยตรง** — `cardSummaryById()` ต้องคืน `undefined` เมื่อหาไม่เจอ
   ห้ามกุไพ่ใบใดใบหนึ่งมาแทนเด็ดขาด
4. เปิด PR ด้วย `npm run pr:auto` เท่านั้น (กฎข้อ 13 — push เฉย ๆ = งานค้าง ไม่มี CI/deploy)
