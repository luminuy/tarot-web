# 🏛️ แผนลงมือ: Site Shell กลาง + Internal Link ที่บอทมองเห็น

> **เอกสารสั่งงานสำหรับทีมที่รับช่วงต่อ** — อ่านจบแล้วลงมือได้เลย ไม่ต้องกลับมาถาม
> อ้างอิงโค้ดจริงบน branch `claude/header-footer-seo-plan-860c20` (ฐาน `main` commit `e76bb34`)
> ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วย "สตริงยึด" ที่ยกมาในแต่ละหัวข้อ
>
> **ขอบเขต 3 งาน (มติเจ้าของโปรเจกต์)**
> 1. **PR-A** — Header กลาง (`SiteHeader`) ใช้ร่วมกันทั้งเว็บ
> 2. **PR-B** — `RelatedCards` เลิกเป็น client-only → เรนเดอร์ฝั่งเซิร์ฟเวอร์ (312 ลิงก์กลับมาให้บอทเห็น)
> 3. **PR-C** — Fat Footer สีเข้มแบบหน้าแรก ลงครบทุกหน้า (ตัวเลือก **ก** ที่เจ้าของเลือกแล้ว)

---

## 📖 สารบัญ

| ส่วน | เนื้อหา |
| :--- | :--- |
| [0](#0-อ่านก่อนแตะโค้ดบรรทัดแรก) | อ่านก่อนแตะโค้ดบรรทัดแรก + คำสั่งล็อกงาน |
| [1](#1-ผลวินิจฉัย-หลักฐานจากโค้ดจริง) | ผลวินิจฉัย — หลักฐานจากโค้ดจริง |
| [2](#2-สถาปัตยกรรมเป้าหมาย-site-shell) | สถาปัตยกรรมเป้าหมาย (Site Shell) |
| [3](#3-pr-a--siteheader-กลาง) | 🅰️ PR-A — `SiteHeader` กลาง |
| [4](#4-pr-b--relatedcards-ฝั่งเซิร์ฟเวอร์-312-ลิงก์) | 🅱️ PR-B — `RelatedCards` ฝั่งเซิร์ฟเวอร์ (312 ลิงก์) |
| [5](#5-pr-c--fat-footer-ทุกหน้า) | 🅲 PR-C — Fat Footer ทุกหน้า |
| [6](#6-ลำดับการส่งงานและการกันชนกัน) | ลำดับการส่งงาน + กันชน Agent |
| [7](#7-เกณฑ์ผ่านรายข้อ-definition-of-done) | เกณฑ์ผ่านรายข้อ (Definition of Done) |
| [8](#8-ความเสี่ยงกับดัก-และแผนถอย) | ความเสี่ยง กับดัก และแผนถอย |
| [9](#9-สิ่งที่-ไม่-อยู่ในขอบเขต) | สิ่งที่ **ไม่** อยู่ในขอบเขต |

---

## 0. อ่านก่อนแตะโค้ดบรรทัดแรก

1. [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) — **INC-0067** (overflow ทำ sticky header พัง) · **INC-0073** (ระยะห่าง FAQ ↔ Dark Footer) · **INC-0075** (hydration mismatch หน้าแรก)
2. [`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md) หัวข้อ 0 = มาตรฐานบังคับ
3. [`CLAUDE.md`](../../CLAUDE.md) กฎเหล็ก **ข้อ 2** (อิโมจิ ✦ ✨ เท่านั้น) · **ข้อ 8** (ต้องใช้ `<CardImage />`) · **ข้อ 10** (ภาษาไทยธรรมชาติ) · **ข้อ 13** (จบงานต้องเปิด PR ด้วย `pr:auto`) · **ข้อ 14** (ห้ามกุไพ่)

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain seo --files "<ไฟล์ที่จะแก้>" --task "PR-A site header"
# ...แก้งาน...
npm run repo:verify                       # ต้องผ่าน 24/24
npm run commit -- --agent <ชื่อคุณ> --type feat --scope seo --msg "..." --files "..."
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run pr:auto -- "<title>" --body-file <path>
```

---

## 1. ผลวินิจฉัย — หลักฐานจากโค้ดจริง

### 1.1 ไม่มีคอมโพเนนต์ Header/Footer กลางเลย — ทุกหน้าประกอบเอง

`src/components/` มี 18 โฟลเดอร์ (`account`, `admin`, `card`, `encyclopedia`, `seo`, `ui`, …) แต่ **ไม่มี `layout/` และไม่มีไฟล์ชื่อ `SiteHeader`/`SiteFooter` เลย** — ยืนยันด้วย:

```bash
find src -iname "*footer*" -o -iname "*header*"
# → เจอแค่ src/components/ui/SacredNavDropdown.tsx (เมนู hamburger) เท่านั้น
```

`src/app/layout.tsx` (root) มีแต่ font / metadata / JSON-LD / provider — **ไม่มี chrome ใด ๆ** ห่อ `{children}`

#### ตารางสำรวจ Header ที่มีอยู่จริง (5 แบบ ไม่ซ้ำกันเลย)

| หน้า | ไฟล์:บรรทัด | โลโก้ | ปุ่มซ้าย | เมนูขวา | sticky |
| :--- | :--- | :---: | :--- | :--- | :---: |
| `/` | [`TarotFlow.tsx:883`](../../src/app/TarotFlow.tsx#L883) | ✅ `/logo.webp` + ชื่อแบรนด์ + `1909 RIDER-WAITE TAROT` | โลโก้ = ลิงก์กลับ `/` | `UserProfileBadge` + `SacredNavDropdown` + ปุ่ม "เริ่มดูดวงใหม่" | ✅ `sticky top-0 z-50` |
| `/cards` | [`cards/page.tsx:73`](../../src/app/cards/page.tsx#L73) | ❌ | pill `← กลับหน้าดูดวงหลัก` | `SacredNavDropdown` | ❌ |
| `/spreads` | [`spreads/page.tsx:73`](../../src/app/spreads/page.tsx#L73) | ❌ | pill `← กลับหน้าดูดวงหลัก` | `SacredNavDropdown` | ❌ |
| `/blog` | [`blog/page.tsx:94`](../../src/app/blog/page.tsx#L94) | ❌ | pill `← กลับหน้าดูดวงหลัก` (คนละคลาสกับ 2 หน้าบน: `shadow-2xs`, hover `#8F5C1A`) | ลิงก์ลัด 2 อัน (`/spreads`, `/cards`) + `SacredNavDropdown` | ❌ |
| `/readers` | [`readers/page.tsx:62`](../../src/app/readers/page.tsx#L62) | ❌ | breadcrumb `หน้าแรก / ปรึกษาแม่หมอตัวจริง` (ไม่ใช่ pill) — เส้นขอบใช้สี `#E4D8C4` ต่างจากหน้าอื่นที่ใช้ `#D5CEC2` | `SacredNavDropdown` | ❌ |
| `/readers/[id]` | [`readers/[id]/page.tsx:60`](../../src/app/readers/[id]/page.tsx#L60) | ❌ | breadcrumb 3 ชั้น | `SacredNavDropdown` | ❌ |

#### หน้าที่ **ไม่มีเมนูหลักเลย** (คลิกเข้าจาก Google แล้วไปต่อไม่ได้)

| หน้า | จำนวน URL | ไฟล์:บรรทัด | มีแค่ |
| :--- | ---: | :--- | :--- |
| `/cards/[id]` | **78** | [`CardDetailView.tsx:83`](../../src/components/encyclopedia/CardDetailView.tsx#L83) | pill `← กลับหน้ารวมไพ่ 78 ใบ` + ตัวนับ `n/78` |
| `/blog/[slug]` | **24** | [`blog/[slug]/page.tsx:154`](../../src/app/blog/[slug]/page.tsx#L154) | breadcrumb 3 ชั้น |
| `/spreads/[id]` | **20** | [`spreads/[id]/page.tsx:166`](../../src/app/spreads/[id]/page.tsx#L166) | breadcrumb 3 ชั้น |
| `/privacy` | 1 | [`privacy/page.tsx:18`](../../src/app/privacy/page.tsx#L18) | หัวข้อกลางหน้า ไม่มีลิงก์อะไรเลยจนถึงบรรทัด 175 |
| `/account` | 1 (noindex) | [`account/page.tsx:20`](../../src/app/account/page.tsx#L20) | pill `← กลับสู่วิหารพยากรณ์` |

> **สรุป**: **123 จาก 128 หน้าที่ index ได้** ไม่มี header เดียวกับหน้าแรก และ **122 หน้า** ไม่มีโลโก้แบรนด์ให้กดกลับหน้าแรก

### 1.2 Footer — มี 2 แบบ และมีแค่บนหน้าแรกเท่านั้น

```bash
grep -rn "<footer" src --include='*.tsx'
# src/app/TarotFlow.tsx:1396                 ← footer บาง (แถบเดียว 2 ลิงก์)
# src/components/seo/HomeSeoContent.tsx:616  ← Fat Footer สีเข้ม #171512
```

- **Fat Footer** ([`HomeSeoContent.tsx:616`](../../src/components/seo/HomeSeoContent.tsx#L616)–817) — พื้น `#171512`, การ์ด AI Disclosure, กริดลิงก์ภายใน 4 คอลัมน์, แถบลิขสิทธิ์
  ➜ **แสดงเฉพาะตอน `currentStep === "SPREAD_SELECT"` บนหน้าแรกเท่านั้น** ([`TarotFlow.tsx:1393`](../../src/app/TarotFlow.tsx#L1393))
  ➜ ฝังตายอยู่กลางไฟล์ SEO 817 บรรทัด **ยกไปใช้ที่อื่นไม่ได้**
- **Footer บาง** ([`TarotFlow.tsx:1396`](../../src/app/TarotFlow.tsx#L1396)) — โผล่เฉพาะหน้าแรกตอนอยู่ขั้นที่ 2-5 ของพิธีกรรม
- **อีก 127 หน้าไม่มี `<footer>` ใด ๆ ทั้งสิ้น**

### 1.3 `RelatedCards` เป็น client-only — 312 ลิงก์หายจาก HTML

[`src/components/encyclopedia/RelatedCards.tsx`](../../src/components/encyclopedia/RelatedCards.tsx) บรรทัด 1 คือ `"use client"` แล้วยิง `fetch("/api/search?like=card:...")` ใน `useEffect`

ลูกโซ่ปัญหา:

| # | ปัญหา | หลักฐาน |
| :--- | :--- | :--- |
| 1 | ลิงก์ไม่อยู่ใน HTML ที่เซิร์ฟเวอร์ส่ง — บอทที่ไม่รัน JS มองไม่เห็น 78 × 4 = **312 ลิงก์** | `useEffect` + `setState` |
| 2 | ต่อให้ Googlebot รัน JS ก็อยู่คิว render รอบสอง ค้นพบช้าและไม่การันตี | — |
| 3 | ต้องเรียก **Workers AI embedding ทุกครั้งที่มีคนเปิดหน้าไพ่** เพราะ `relatedTo()` embed ข้อความใหม่ทุก request | [`vectorize.ts:186`](../../src/lib/search/vectorize.ts#L186) `const [embedding] = await embedTexts([doc.text])` |
| 4 | ถ้า Vectorize index ยังไม่ถูก rebuild → `getVectorizeBinding()` คืน `null` → `[]` → **ทั้ง section หายไปเงียบ ๆ** ไม่มีใครรู้ | [`vectorize.ts:180-181`](../../src/lib/search/vectorize.ts#L180) |
| 5 | index ต้องรัน `POST /api/admin/rebuild-search-index` ด้วยมือหลัง deploy — ลืมเมื่อไหร่ ลิงก์หายเมื่อนั้น | [`api/admin/rebuild-search-index/route.ts:12`](../../src/app/api/admin/rebuild-search-index/route.ts#L12) |

> **ผลกระทบ SEO มากกว่าข้อ 1 จริงตามที่วินิจฉัยไว้** — เพราะหน้าไพ่ 78 ใบคือชุดหน้าที่ใหญ่ที่สุดของเว็บ และ 312 ลิงก์นี้คือ **โครงข่ายเชื่อมโยงเชิงความหมายชั้นเดียวที่มี** ระหว่างหน้าไพ่ด้วยกัน (นอกจากปุ่ม prev/next ที่เชื่อมแบบเส้นตรงตามลำดับสำรับเท่านั้น)

---

## 2. สถาปัตยกรรมเป้าหมาย (Site Shell)

### 2.1 ไฟล์ใหม่ที่ต้องสร้าง

```
src/components/layout/
├── SiteHeader.tsx        # Server Component — โลโก้ + breadcrumb slot + toolbar slot
├── SiteFooter.tsx        # Server Component — Fat Footer สีเข้ม (ย้ายมาจาก HomeSeoContent)
├── SiteShell.tsx         # Server Component — <SiteHeader/> + {children} + <SiteFooter/>
└── nav-links.ts          # แหล่งความจริงเดียวของลิงก์ในเมนู/ฟุตเตอร์ (ไม่มี JSX)

src/data/cards/
└── related.generated.ts  # แผนที่ไพ่ใกล้เคียง 78 × 4 (สร้างจากสคริปต์ ห้ามแก้มือ)

scripts/
└── generate-related-cards.ts
```

### 2.2 นโยบายรายเส้นทาง — หน้าไหนได้ shell แบบไหน

| เส้นทาง | จำนวน | Header | Footer | วิธีติดตั้ง |
| :--- | ---: | :---: | :---: | :--- |
| `/` | 1 | `SiteHeader` (โหมด `app` — มี `UserProfileBadge` + ปุ่มรีเซ็ต) | Fat | แก้ใน `TarotFlow.tsx` โดยตรง |
| `/cards`, `/cards/[id]` | 79 | `SiteHeader` โหมด `content` | Fat | `src/app/cards/layout.tsx` (ใหม่) |
| `/blog`, `/blog/[slug]` | 25 | `SiteHeader` โหมด `content` | Fat | `src/app/blog/layout.tsx` (ใหม่) |
| `/spreads`, `/spreads/[id]` | 21 | `SiteHeader` โหมด `content` | Fat | `src/app/spreads/layout.tsx` (ใหม่) |
| `/privacy` | 1 | `SiteHeader` โหมด `content` | Fat (ดู §5.4) | `src/app/privacy/layout.tsx` (ใหม่) |
| `/readers`, `/readers/[id]` | 1+N | `SiteHeader` โหมด `content` | Fat | **ประกอบในไฟล์ page เอง** (ดูกับดัก §8.2) |
| `/account` | 1 | `SiteHeader` โหมด `content` | Fat | `src/app/account/layout.tsx` (ใหม่) |
| `/reading/**` | — | ❌ ไม่แตะ | ❌ | ห้องสนทนา noindex — ต้องไม่มีอะไรมาแย่งสมาธิ |
| `/admin/**`, `/readers/console`, `/readers/queue`, `/tester`, `/reset-password`, `/s/[id]` | — | ❌ ไม่แตะ | ❌ | หน้าเครื่องมือ/redirect ไม่ใช่หน้าเนื้อหา |

### 2.3 หลักการที่ห้ามละเมิด

1. **`SiteHeader` / `SiteFooter` / `SiteShell` เป็น Server Component** — ห้ามใส่ `"use client"` ที่ไฟล์เหล่านี้ ไม่งั้นลิงก์ในฟุตเตอร์จะกลับไปเป็นปัญหาเดียวกับ `RelatedCards`
   ส่วนที่ต้องโต้ตอบ (`SacredNavDropdown`, `UserProfileBadge`) เป็น **client island** ที่ถูก import เข้ามา — Next.js เรนเดอร์ลิงก์ข้างในเป็น HTML ให้อยู่แล้วเพราะ dropdown เรนเดอร์ DOM ตลอด (ใช้ `aria-hidden` + CSS ซ่อน ไม่ใช่ conditional unmount — ดู [`SacredNavDropdown.tsx:152-158`](../../src/components/ui/SacredNavDropdown.tsx#L152))
2. **ลิงก์ในฟุตเตอร์ต้องเป็น `<Link>` จริง** ห้าม `<button onClick={router.push}>`
3. **ห้ามใส่ `overflow-hidden` หรือ `overflow-x-hidden`** ให้ ancestor ใดของ `SiteHeader` — sticky จะพังเงียบ (**INC-0067**) ใช้ `overflow-x-clip` เท่านั้น
4. **รูปไพ่ทุกใบใน shell ต้องผ่าน `<CardImage />` พร้อม `sizes`** (กฎเหล็กข้อ 8) — Fat Footer เดิมใช้ `CardImage` อยู่แล้ว 2 จุด (`major-02.jpg`, `major-01.jpg`) แต่โลโก้ใช้ `<img src="/logo.webp">` ซึ่ง **ถูกต้องแล้ว** เพราะไม่ใช่ภาพไพ่ — ห้ามเผลอเปลี่ยนเป็น `CardImage`

---

## 3. 🅰️ PR-A — `SiteHeader` กลาง

**branch**: `feat/site-header-unify` · **domain lock**: `ui`

### 3.1 ไฟล์ที่แตะ

| ไฟล์ | การกระทำ |
| :--- | :--- |
| `src/components/layout/nav-links.ts` | สร้างใหม่ |
| `src/components/layout/SiteHeader.tsx` | สร้างใหม่ |
| `src/app/TarotFlow.tsx` | แทน `<header>` บรรทัด 883-940 ด้วย `<SiteHeader variant="app" …/>` |
| `src/app/cards/page.tsx` | ลบแถบบนบรรทัด 73-81 (layout จะจัดให้) |
| `src/app/cards/layout.tsx` | สร้างใหม่ |
| `src/app/blog/page.tsx` | ลบแถบบนบรรทัด 94-117 |
| `src/app/blog/layout.tsx` | สร้างใหม่ |
| `src/app/spreads/page.tsx` | ลบแถบบนบรรทัด 73-81 |
| `src/app/spreads/layout.tsx` | สร้างใหม่ |
| `src/app/privacy/layout.tsx`, `src/app/account/layout.tsx` | สร้างใหม่ |
| `src/app/readers/page.tsx`, `src/app/readers/[id]/page.tsx` | ใส่ `<SiteHeader>` ในไฟล์ page |
| `src/components/encyclopedia/CardDetailView.tsx` | ลบแถบบนบรรทัด 83-94 เหลือแค่ตัวนับ `n/78` |
| `src/app/blog/[slug]/page.tsx`, `src/app/spreads/[id]/page.tsx` | **คง breadcrumb เดิมไว้** แต่ย้ายมาอยู่ใต้ header (ดู §3.4) |

### 3.2 สัญญาของ `SiteHeader`

```tsx
// src/components/layout/SiteHeader.tsx — Server Component (ห้ามใส่ "use client")
import type { ReactNode } from "react";

interface SiteHeaderProps {
  /**
   * "content" = หน้าเนื้อหา (โลโก้ + breadcrumb + เมนู) — ค่าเริ่มต้น
   * "app"     = หน้าดูดวงหลัก (เพิ่มช่อง toolbar สำหรับ UserProfileBadge / ปุ่มรีเซ็ต)
   */
  variant?: "content" | "app";
  /** breadcrumb ของหน้านั้น — ส่งเป็น ReactNode เพื่อให้แต่ละหน้าคุมข้อความเอง */
  breadcrumb?: ReactNode;
  /** ปุ่มเพิ่มเติมฝั่งขวา (เฉพาะ variant="app") */
  toolbar?: ReactNode;
  /** เมนู dropdown — ส่งเข้ามาเพื่อให้หน้าแรกส่ง callback ได้ หน้าเนื้อหาส่ง <SacredNavDropdown /> เปล่า */
  nav?: ReactNode;
}
```

**เหตุผลที่ใช้ `slot props` แทน `boolean` หลายตัว**: หน้าแรกต้องส่ง callback (`onOpenHistory`, `onReset`, `canReset`) เข้า `SacredNavDropdown` ซึ่งเป็นฟังก์ชัน — ส่งจาก Server Component ไม่ได้ การรับเป็น `ReactNode` ให้ `TarotFlow` (client) ประกอบเองแล้วยัดเข้ามาจึงเป็นทางเดียวที่ทำงานได้ทั้งสองฝั่ง
**มีตัวอย่างในโปรเจกต์อยู่แล้ว**: [`src/app/page.tsx:83`](../../src/app/page.tsx#L83) `<TarotFlow seoContent={<HomeSeoContent />} />` — ส่ง Server Component เป็น prop เข้า Client Component

### 3.3 โครง DOM ที่ต้องได้ (ยึดจากหน้าแรกเป็นต้นแบบ)

```tsx
<header className="w-full border-b border-[#D5CEC2] bg-[#FFFFFF] sticky top-0 z-50 shadow-[var(--shadow-raised)]">
  <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
    <Link href="/" aria-label="SeerTarot — กลับหน้าแรก" className="…">
      <img src="/logo.webp" alt="SeerTarot" width={44} height={44}
           loading="eager" className="w-full h-full object-cover" />
      <div className="hidden min-w-0 flex-col justify-center sm:flex">
        <span className="…">ดูดวงไพ่ทาโรต์</span>
        <span className="…">1909 RIDER-WAITE TAROT</span>
      </div>
    </Link>
    <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
      {toolbar}
      {nav ?? <SacredNavDropdown />}
    </div>
  </div>
  {breadcrumb ? (
    <div className="max-w-6xl mx-auto px-4 pb-2.5 -mt-0.5">{breadcrumb}</div>
  ) : null}
</header>
```

**ข้อบังคับ**
- ต้อง `sticky top-0 z-50` ทุกหน้า (ตอนนี้มีแค่หน้าแรก) — ผู้ใช้มือถือที่อ่านหน้าไพ่ยาว ๆ ต้องกดเมนูได้โดยไม่ต้องเลื่อนขึ้นสุด
- `z-50` ต้องไม่ชนกับ `SacredNavDropdown` panel (`z-50` เหมือนกัน แต่เป็นลูกใน header จึงซ้อนถูก) และต้องต่ำกว่าโมดัลของ `AccessDialog`/`AuthModal` — **ตรวจด้วยการเปิดโมดัลแล้วเลื่อนหน้า ต้องไม่มีหัวเว็บทะลุขึ้นมาทับ**
- `<img>` โลโก้: `loading="eager"` ที่หน้าแรก, `loading="lazy"` ไม่ต้อง — เป็น LCP candidate ทุกหน้า
- **ห้ามใช้ `backdrop-blur`** บน header (INC-0063: fps ตกจาก 58 → 30)

### 3.4 breadcrumb: เก็บของเดิมไว้ทั้งหมด

หน้า `/blog/[slug]`, `/spreads/[id]`, `/readers/[id]` มี breadcrumb ที่ผูกกับ `BreadcrumbList` JSON-LD อยู่แล้ว — **ห้ามลบ** ให้ยกก้อน `<nav aria-label="Breadcrumb">` เดิมส่งเข้า prop `breadcrumb` แทน

หน้าที่ยังไม่มี breadcrumb ให้เพิ่มให้ครบ (ข้อความไทยธรรมชาติ กฎเหล็กข้อ 10):

| หน้า | breadcrumb ที่ต้องได้ |
| :--- | :--- |
| `/cards` | หน้าแรก / คัมภีร์ไพ่ 78 ใบ |
| `/cards/[id]` | หน้าแรก / คัมภีร์ไพ่ 78 ใบ / {nameTh} |
| `/spreads` | หน้าแรก / คลังผังพยากรณ์ |
| `/blog` | หน้าแรก / คัมภีร์บทความ |
| `/privacy` | หน้าแรก / นโยบายความเป็นส่วนตัว |

> `/cards/[id]` มี `BreadcrumbList` JSON-LD อยู่แล้ว ([`cards/[id]/page.tsx:88`](../../src/app/cards/[id]/page.tsx#L88)) แต่**ไม่มี breadcrumb ที่มองเห็นบนหน้าจอ** — Google ระบุว่าโครงสร้างที่มองเห็นได้ควรตรงกับ structured data การเพิ่มครั้งนี้ทำให้ทั้งสองฝั่งตรงกันครบ

### 3.5 ปุ่ม "กลับหน้าดูดวงหลัก" ที่หายไป

pill ปุ่มกลับใน `/cards`, `/spreads`, `/blog`, `/account` (4 แบบที่คลาสไม่ตรงกัน) และ pill `← กลับหน้ารวมไพ่ 78 ใบ` ใน `CardDetailView` **ให้ลบทิ้ง** เพราะ:
- โลโก้ใน header คือทางกลับหน้าแรกอยู่แล้ว (มาตรฐานสากล)
- breadcrumb คือทางกลับหน้าแม่อยู่แล้ว
- ปุ่ม CTA `✦ ไปหน้าดูดวงหลัก` ที่ [`CardDetailView.tsx:265`](../../src/components/encyclopedia/CardDetailView.tsx#L265) **ให้เก็บไว้** เพราะเป็น conversion CTA ไม่ใช่ navigation

### 3.6 เกณฑ์ผ่าน PR-A

- [ ] `grep -rn "SacredNavDropdown" src/app` เหลือการเรียกที่ `TarotFlow.tsx` และ `SiteHeader.tsx` เท่านั้น (ไม่มีในไฟล์ page อีก)
- [ ] `curl -s http://localhost:3000/cards/major-00 | grep -c 'logo.webp'` ≥ 1 (โลโก้อยู่ใน HTML ฝั่งเซิร์ฟเวอร์)
- [ ] ทดสอบ 8 หน้า (`/`, `/cards`, `/cards/major-00`, `/spreads`, `/spreads/celtic-cross`, `/blog`, `/blog/<slug>`, `/privacy`) — header หน้าตาเหมือนกันหมด, sticky ทำงานทุกหน้า
- [ ] เปิดเมนู dropdown แล้วเลื่อนหน้า — **ไม่กระพริบ** (INC-0067)
- [ ] Console 0 error / 0 hydration warning ทุกหน้า (INC-0075)
- [ ] `npm run repo:verify` ผ่าน 24/24

---

## 4. 🅱️ PR-B — `RelatedCards` ฝั่งเซิร์ฟเวอร์ (312 ลิงก์)

**branch**: `feat/related-cards-ssr` · **domain lock**: `content` · **⚠️ PR ที่ให้ผล SEO สูงสุด — ทำก่อน**

### 4.1 แนวทางที่เลือก และเหตุผลที่ไม่เลือกทางอื่น

| ทางเลือก | ผล | มติ |
| :--- | :--- | :--- |
| เรียก `relatedTo()` ใน Server Component ตรง ๆ | ลิงก์เข้า HTML ✅ แต่ยังต้อง embed ทุก request และพังถ้า index ว่าง | ❌ |
| ดึง embedding ตอน build ผ่าน Workers AI REST | ต้องมี API token ตอน build, CI พังถ้า token หมดอายุ | ❌ |
| **สร้างแผนที่ไพ่ใกล้เคียงแบบออฟไลน์ตอน build จากข้อมูลไพ่ในโค้ด** | ลิงก์เข้า HTML ✅ · ค่าใช้จ่าย runtime = 0 · ผลลัพธ์คงที่ ตรวจสอบได้ · ไม่พึ่ง network | ✅ **เลือกทางนี้** |

> Vectorize / `/api/search` **ไม่ถูกลบ** — ยังใช้กับช่องค้นหา (`?q=`) ต่อไป เปลี่ยนแค่ว่าหน้าไพ่ 78 ใบเลิกพึ่งมัน

### 4.2 สคริปต์สร้างแผนที่ — `scripts/generate-related-cards.ts`

```ts
/**
 * สร้างแผนที่ "ไพ่ที่พลังงานใกล้เคียง" แบบออฟไลน์ 100% (ไม่แตะ network)
 * ผลลัพธ์ → src/data/cards/related.generated.ts  ⚠️ ห้ามแก้ไฟล์นั้นด้วยมือ
 * รันซ้ำได้ผลเหมือนเดิมทุกครั้ง (deterministic)
 */
import { DECK } from "../src/data/cards";

const W = {
  keyword: 3.0,   // คำสำคัญร่วม (Jaccard ของ upright ∪ reversed)
  number: 1.5,    // เลขเดียวกันข้ามดอก — เอซ 4 ใบ / อัศวิน 4 ใบ เชื่อมถึงกัน
  element: 1.2,   // ธาตุเดียวกัน
  astrology: 1.0, // ดาว/ราศีเดียวกัน
  suit: 0.8,      // ดอกเดียวกัน
  yesNo: 0.3,     // แนวโน้มคำตอบเดียวกัน
  neighborPenalty: -1.2, // ใบติดกันในสำรับ (มีปุ่ม prev/next อยู่แล้ว ไม่ต้องซ้ำ)
} as const;
```

**กฎบังคับของสคริปต์**
1. คะแนนเท่ากัน → เรียงตาม `card.id` จากน้อยไปมาก (ผลลัพธ์ต้องคงที่ ไม่ขึ้นกับลำดับใน array)
2. ตัดตัวเอง และตัดใบที่ `prev`/`next` ในสำรับออกด้วย penalty (ไม่ใช่ตัดขาด — ถ้าคะแนนสูงจริงยังติดได้)
3. เอา **4 ใบต่อไพ่ 1 ใบ พอดี** — ถ้าหาไม่ครบ 4 ให้ `throw` ทันที ห้ามเติมด้วยใบมั่ว (**กฎเหล็กข้อ 14**)
4. เขียนไฟล์พร้อมหัวคอมเมนต์ `// AUTO-GENERATED — อย่าแก้ด้วยมือ · สร้างด้วย npm run cards:related`

**เพิ่มใน `package.json`**: `"cards:related": "tsx scripts/generate-related-cards.ts"`

### 4.3 รูปแบบไฟล์ที่สร้าง

```ts
// src/data/cards/related.generated.ts
// AUTO-GENERATED — อย่าแก้ด้วยมือ · สร้างด้วย `npm run cards:related`
export const RELATED_CARDS: Readonly<Record<string, readonly [string, string, string, string]>> = {
  "major-00": ["major-01", "wands-01", "major-12", "swords-08"],
  // … ครบ 78 คีย์
} as const;
```

### 4.4 ด่านตรวจกันไพ่ปลอม (กฎเหล็กข้อ 14)

เพิ่มการตรวจใน [`scripts/verify-cards.ts`](../../scripts/verify-cards.ts) ที่มีอยู่แล้ว — **ห้ามสร้าง gate ใหม่** เพื่อให้ `repo:verify` ยังเป็น 24 ด่านเท่าเดิม:

```ts
// ตรวจแผนที่ไพ่ใกล้เคียง — ทุก id ต้องมีจริงในสำรับ 78 ใบ
const ids = new Set(DECK.map((c) => c.id));
if (Object.keys(RELATED_CARDS).length !== 78) fail("RELATED_CARDS ต้องมีครบ 78 คีย์");
for (const [id, refs] of Object.entries(RELATED_CARDS)) {
  if (!ids.has(id)) fail(`RELATED_CARDS มีคีย์ที่ไม่มีในสำรับ: ${id}`);
  if (refs.length !== 4) fail(`${id} ต้องมีไพ่ใกล้เคียง 4 ใบพอดี (พบ ${refs.length})`);
  if (new Set(refs).size !== 4) fail(`${id} มีไพ่ซ้ำในรายการ`);
  if (refs.includes(id)) fail(`${id} อ้างถึงตัวเอง`);
  for (const r of refs) if (!ids.has(r)) fail(`${id} อ้างไพ่ที่ไม่มีจริง: ${r}`);
}
```

### 4.5 แก้คอมโพเนนต์

**`src/components/encyclopedia/RelatedCards.tsx`** — ลบ `"use client"`, `useState`, `useEffect`, `fetch` ทั้งหมด:

```tsx
import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { cardById } from "@/data/cards";
import { RELATED_CARDS } from "@/data/cards/related.generated";

/** ไพ่ที่พลังงานใกล้เคียง — เรนเดอร์ฝั่งเซิร์ฟเวอร์ ลิงก์อยู่ใน HTML ตั้งแต่ต้น */
export function RelatedCards({ cardId }: { cardId: string }) {
  const refs = RELATED_CARDS[cardId];
  if (!refs) return null;                       // ไม่มีข้อมูล = ไม่แสดง (ห้ามกุ)
  const cards = refs.map(cardById).filter((c) => !!c);
  if (cards.length === 0) return null;
  return ( /* …JSX เดิมทั้งหมด เปลี่ยนแค่แหล่งข้อมูล… */ );
}
```

**JSX ส่วนแสดงผลใช้ของเดิมทุกบรรทัด** — คลาส, `sizes="32px"`, `<CardImage>`, หัวข้อ `✦ ไพ่ที่พลังงานใกล้เคียง` เหมือนเดิม เพื่อให้ diff อ่านง่ายและหน้าตาไม่เปลี่ยน

### 4.6 ย้ายจุดเรนเดอร์ออกจาก Client Component

`RelatedCards` ถูกเรียกใน [`CardDetailView.tsx:276`](../../src/components/encyclopedia/CardDetailView.tsx#L276) ซึ่งเป็น `"use client"` — Server Component จะถูกเรียกจากตรงนั้นไม่ได้ ต้องส่งเป็น prop:

```tsx
// src/app/cards/[id]/page.tsx (Server Component)
<CardDetailView
  card={card}
  prevCard={prevCard}
  nextCard={nextCard}
  totalCards={DECK.length}
  currentIndex={currentIndex}
  related={<RelatedCards cardId={card.id} />}   // ← เพิ่ม prop นี้
/>
```

```tsx
// src/components/encyclopedia/CardDetailView.tsx
interface CardDetailViewProps {
  // …ของเดิม…
  /** ไพ่ที่พลังงานใกล้เคียง — Server Component ส่งเข้ามาเพื่อให้ลิงก์อยู่ใน HTML */
  related?: React.ReactNode;
}
// …แทนบรรทัด 276:
{related}
```

> รูปแบบนี้มีใช้ในโปรเจกต์อยู่แล้ว — [`src/app/page.tsx:83`](../../src/app/page.tsx#L83) ส่ง `<HomeSeoContent />` เข้า `<TarotFlow>` ด้วยเหตุผลเดียวกัน (ดูคอมเมนต์ที่ `page.tsx:24`)
> **ตำแหน่งใน DOM ต้องเหมือนเดิมเป๊ะ** — อยู่ระหว่างกริดหลักกับแถบ prev/next

### 4.7 ผลที่ต้องวัดได้

| ตัวชี้วัด | ก่อน | หลัง |
| :--- | :--- | :--- |
| ลิงก์ในเนื้อหาที่บอทเห็นบน `/cards/[id]` | 0 | **312** (78 × 4) |
| Workers AI embedding call ต่อการเปิดหน้าไพ่ 1 ครั้ง | 1 | **0** |
| section หายเมื่อ Vectorize index ว่าง | หาย | **ไม่หาย** |
| JS bundle ของหน้าไพ่ | มี `RelatedCards` + fetch | ลดลง (คอมโพเนนต์ออกจาก client bundle) |

### 4.8 เกณฑ์ผ่าน PR-B

- [ ] `npm run cards:related` แล้ว `git diff --exit-code src/data/cards/related.generated.ts` ต้องไม่มี diff เมื่อรันซ้ำ (deterministic)
- [ ] `npm run build && curl -s http://localhost:3000/cards/major-00 | grep -o 'href="/cards/[a-z0-9-]*"' | sort -u | wc -l` ≥ 6 (4 ใบใกล้เคียง + prev + next)
- [ ] `grep -n "use client" src/components/encyclopedia/RelatedCards.tsx` → ไม่เจอ
- [ ] ปิด Vectorize binding (dev) แล้วเปิดหน้าไพ่ — section **ยังแสดง** ครบ 4 ใบ
- [ ] สุ่มตรวจ 10 ใบ: ไพ่ที่แนะนำสมเหตุสมผลกับมนุษย์ (ไม่ใช่ใบที่ไม่เกี่ยวเลย)
- [ ] `npm run repo:verify` ผ่าน 24/24 (รวมด่านตรวจไพ่ปลอมใหม่)

---

## 5. 🅲 PR-C — Fat Footer ทุกหน้า

**branch**: `feat/site-footer-everywhere` · **domain lock**: `seo` · **ต้องทำหลัง PR-A**

### 5.1 ยก Fat Footer ออกมาเป็นคอมโพเนนต์เดี่ยว

ตัด [`HomeSeoContent.tsx:610`](../../src/components/seo/HomeSeoContent.tsx#L610)–817 (ตั้งแต่คอมเมนต์ `SECTION 6: FAT FOOTER` ถึงปิด `</footer>`) ไปไว้ที่ `src/components/layout/SiteFooter.tsx`

**ต้องยกไปให้ครบทุกก้อน**
1. เส้นทองบน (`absolute top-0 left-1/2 …`)
2. บล็อกแบรนด์ + โลโก้ + คำโปรย
3. การ์ด **AI Disclosure** (`major-02.jpg` ผ่าน `CardImage sizes="40px"`) — **จำเป็นตามหลักความโปร่งใส ต้องอยู่ทุกหน้า**
4. กริดลิงก์ภายใน 4 คอลัมน์
5. แถบล่าง: `major-01.jpg` + ลิขสิทธิ์ + ลิงก์ `/privacy` + สายด่วน **1323** / **1669** (กฎเหล็กข้อ 6)

**สิ่งที่ต้องแก้ตอนยก**
- `HomeSeoContent.tsx` เหลือถึง section 5 (FAQ) แล้ว **คง `pb-16 sm:pb-20` ที่ section FAQ ไว้** — ถ้าลบจะกลับไปเป็น **INC-0073** (FAQ ชนฟุตเตอร์ 0px)
- `import { CardImage }` ย้ายตาม ถ้า `HomeSeoContent` ไม่ได้ใช้แล้วให้ลบ import ที่ไม่ใช้ (ไม่งั้น lint ตก)
- `<div>` ที่ปิดท้าย `HomeSeoContent` (บรรทัดสุดท้าย) ต้องปิดให้ถูก — ตรวจด้วย `npm run typecheck`

### 5.2 `nav-links.ts` — เลิกฮาร์ดโค้ดลิงก์ 2 ที่

ลิงก์ชุดเดียวกันตอนนี้เขียนซ้ำใน `SacredNavDropdown` และ Fat Footer แล้วเลขไม่ตรงกันได้ง่าย (เช่น `24 บทความ`, `20 ผัง`, `78 ใบ` กระจายอยู่ 5 ไฟล์) ให้ย้ายมาที่เดียว:

```ts
// src/components/layout/nav-links.ts
import { DECK } from "@/data/cards";
import { ARTICLES } from "@/data/articles";
import { SPREADS } from "@/data/spreads";

export const COUNTS = {
  cards: DECK.length,        // 78
  articles: ARTICLES.length, // 24
  spreads: SPREADS.length,   // 20
} as const;

export const FOOTER_COLUMNS = [
  { title: "✦ ผังการเปิดไพ่", links: [ … ] },
  { title: "✦ ความหมายไพ่", links: [ … ] },
  { title: "✦ บทความ & คู่มือ", links: [ … ] },
  { title: "✦ ความปลอดภัย & ความโปร่งใส", links: [ … ] },
] as const;
```

ให้ `SiteFooter` และ `SacredNavDropdown` อ่านตัวเลขจาก `COUNTS` แทนการพิมพ์เลขเอง — เนื้อหาลิงก์คงชุดเดิมทั้งหมด ห้ามเพิ่ม/ลดลิงก์ในรอบนี้

### 5.3 ติดตั้งลงทุกหน้า

```tsx
// ตัวอย่าง src/app/cards/layout.tsx
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function CardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
```

**หน้าแรก**: [`TarotFlow.tsx:1393-1416`](../../src/app/TarotFlow.tsx#L1393) เปลี่ยนเป็น

```tsx
{currentStep === "SPREAD_SELECT" ? seoContent : null}
<SiteFooter />
```

➜ ผลพลอยได้: หน้าแรกตอนอยู่ขั้น 2-5 ของพิธีกรรม **ได้ Fat Footer ด้วย** และ footer บาง 20 บรรทัดถูกลบทิ้ง (เหลือ footer แบบเดียวทั้งเว็บ)

### 5.4 เรื่อง `/privacy` ที่เจ้าของทักไว้ว่า "อาจดูหนัก"

เจ้าของเลือกตัวเลือก **(ก) fat footer เหมือนหน้าแรกทุกหน้า** → **ชุดลิงก์ต้องเหมือนกันทุกหน้า ห้ามตัดคอลัมน์ทิ้ง** (ตัดเมื่อไหร่ก็เสียประโยชน์ SEO ที่เป็นเหตุผลของทั้ง PR)

วิธีลดความหนักสายตาโดยไม่แตะลิงก์แม้แต่เส้นเดียว — เพิ่ม prop เดียวที่คุม **ระยะห่างแนวตั้ง** เท่านั้น:

```tsx
interface SiteFooterProps {
  /** "default" = pt-16 sm:pt-20 (หน้าเนื้อหา) · "tight" = pt-10 sm:pt-12 (หน้ากฎหมาย/บัญชี) */
  spacing?: "default" | "tight";
}
```

- `/privacy`, `/account` → `<SiteFooter spacing="tight" />`
- ที่เหลือทั้งหมด → ค่าเริ่มต้น
- **ห้ามให้ prop นี้ไปแตะจำนวนลิงก์ สี หรือการ์ด AI Disclosure เด็ดขาด**

ถ้าทีมเห็นว่าดูโอเคอยู่แล้วโดยไม่ต้องมี prop นี้ ให้ตัด prop ทิ้งได้ — แต่ต้องส่งภาพหน้า `/privacy` ให้เจ้าของดูก่อนตัดสิน

### 5.5 ผลที่ต้องวัดได้

| ตัวชี้วัด | ก่อน | หลัง |
| :--- | :--- | :--- |
| หน้าที่มี `<footer>` | 1 (หน้าแรก ขั้น 1 เท่านั้น) | **~128 หน้า** |
| ลิงก์ภายในจากฟุตเตอร์ทั้งเว็บ | ~20 | **~20 × 128 ≈ 2,560** |
| หน้าที่แสดงคำเตือน AI Disclosure | 1 | ทุกหน้าเนื้อหา |
| หน้าที่แสดงสายด่วน 1323 / 1669 | 1 | ทุกหน้าเนื้อหา (กฎเหล็กข้อ 6 แข็งแรงขึ้น) |
| หน้าที่ลิงก์ไป `/privacy` | 3 | ทุกหน้าเนื้อหา (PDPA) |

### 5.6 เกณฑ์ผ่าน PR-C

- [ ] `curl -s http://localhost:3000/cards/major-00 | grep -c "1323"` ≥ 1 และหน้า `/spreads/celtic-cross`, `/blog/<slug>`, `/privacy` เช่นกัน
- [ ] `grep -rn "<footer" src --include='*.tsx'` เหลือที่เดียวคือ `SiteFooter.tsx`
- [ ] หน้าแรกขั้น 1: FAQ ↔ ฟุตเตอร์ ยังมีช่องไฟ 64px/80px (INC-0073)
- [ ] Lighthouse หน้า `/cards/major-00`: CLS ไม่แย่ลงเกิน 0.01 จากค่าเดิม (ฟุตเตอร์อยู่ล่างสุดจึงไม่ควรกระทบ — ถ้ากระทบแปลว่ารูปใน footer ไม่ได้กำหนดขนาด)
- [ ] มือถือ 375px: ฟุตเตอร์ไม่ล้นแนวนอน (`document.documentElement.scrollWidth === window.innerWidth`)
- [ ] `npm run repo:verify` ผ่าน 24/24

---

## 6. ลำดับการส่งงานและการกันชนกัน

```
PR-B (RelatedCards SSR)  ──┐  แตะ src/components/encyclopedia/* + src/data/cards/* + scripts/
                           │  ไม่ทับกับ PR-A/C เลย → ทำขนานได้ และควรเข้าก่อนเพราะผล SEO สูงสุด
PR-A (SiteHeader)  ────────┼──► PR-C (SiteFooter)
                              PR-C ต้องรอ PR-A เพราะทั้งคู่แก้ไฟล์ page/layout ชุดเดียวกัน
```

**ข้อบังคับตามกฎเหล็กข้อ 11/12/13**
- ล็อกก่อนแก้ทุกครั้ง: `npm run agent:lock -- --agent <ชื่อ> --domain <ui|content|seo> --files "<ไฟล์>"`
- rebase บน `origin/main` เสมอ หนึ่ง branch ต่อหนึ่ง milestone
- จบงาน = `npm run pr:auto -- "<title>" --body-file <path>` แล้วรอ CI 24 ด่าน → auto-merge → auto-deploy
  **push เฉย ๆ = งานยังไม่เสร็จ** (ISSUE-005 / INC-0043)
- ถ้า environment ไม่มี `gh` CLI ให้เปิด PR ผ่าน GitHub API/MCP ให้สำเร็จ แล้วรายงานข้อจำกัด — ห้ามใช้เป็นข้ออ้างข้ามขั้นตอน
- ทุก PR ต้องอัปเดต [`docs/WORK_LOG.md`](../WORK_LOG.md) (กฎเหล็กข้อ 1) และรัน `npm run log:sync`

---

## 7. เกณฑ์ผ่านรายข้อ (Definition of Done)

### 7.1 ตรวจอัตโนมัติ (ต้องผ่านทุกข้อก่อนเปิด PR)

```bash
npm run typecheck
npm run repo:verify              # 24/24
npm run cards:related            # PR-B: รันซ้ำต้องไม่มี diff
npm run build
```

### 7.2 ตรวจด้วย curl หลัง `npm run build && npm run start`

```bash
# header อยู่ใน HTML ฝั่งเซิร์ฟเวอร์ทุกหน้า
for u in / /cards /cards/major-00 /spreads /spreads/celtic-cross /blog /privacy; do
  printf "%-28s logo=%s footer=%s 1323=%s\n" "$u" \
    "$(curl -s localhost:3000$u | grep -c 'logo.webp')" \
    "$(curl -s localhost:3000$u | grep -c '<footer')" \
    "$(curl -s localhost:3000$u | grep -c '1323')"
done
# ต้องได้ logo≥1 footer=1 1323≥1 ทุกบรรทัด

# 312 ลิงก์ไพ่ใกล้เคียงอยู่ใน HTML จริง
curl -s localhost:3000/cards/major-00 | grep -o 'href="/cards/[a-z0-9-]*"' | sort -u
```

### 7.3 ตรวจด้วยตา (บังคับ ห้ามข้าม)

| # | สิ่งที่ต้องดู | ผ่านเมื่อ |
| :--- | :--- | :--- |
| 1 | 8 หน้าหลัก บนจอ 375px และ 1440px | header/footer เหมือนกันหมด ไม่มีอะไรล้นขอบ |
| 2 | เลื่อนหน้ายาว ๆ พร้อมเปิด dropdown | หัวเว็บติดบนตลอด เมนูไม่กระพริบ (INC-0067) |
| 3 | Console ทุกหน้า | 0 error 0 hydration warning (INC-0075) |
| 4 | หน้าไพ่ 10 ใบสุ่ม | ไพ่ใกล้เคียง 4 ใบ ตรงบริบท ไม่ใช่ใบมั่ว |
| 5 | `/privacy` | ฟุตเตอร์ไม่ทำให้หน้ากฎหมายดูอึดอัดเกินไป (ถ้าอึดอัด → ใช้ `spacing="tight"`) |
| 6 | เปิดโมดัล `AuthModal`/`AccessDialog` แล้วเลื่อน | header ไม่ทะลุขึ้นมาทับโมดัล |

---

## 8. ความเสี่ยง กับดัก และแผนถอย

### 8.1 sticky header พังเพราะ ancestor มี overflow (**INC-0067** — ความเสี่ยงสูงสุดของ PR-A)

`<main>` ของหน้าเนื้อหาหลายหน้าใช้ `overflow-hidden` เช่น [`cards/[id]/page.tsx:104`](../../src/app/cards/[id]/page.tsx#L104) `relative overflow-hidden`
**ถ้าเอา `SiteHeader` ไปวางไว้ข้างใน `<main>` นั้น sticky จะตายเงียบ**

**วิธีที่ถูก**: layout วาง `<SiteHeader />` ไว้ **นอก** `<main>` (เป็นพี่น้องกัน ไม่ใช่ลูก) — โครงจาก `layout.tsx` ทำแบบนี้อยู่แล้วตามตัวอย่าง §5.3
**เพิ่มเติม**: ไล่เปลี่ยน `overflow-hidden` → `overflow-x-clip` ในไฟล์ page ที่พบ (หน้าแรกทำแล้ว ดูคอมเมนต์ [`TarotFlow.tsx:873`](../../src/app/TarotFlow.tsx#L873))

### 8.2 `/readers` มีหน้าแอปซ่อนอยู่ข้างใน — ห้ามใช้ `readers/layout.tsx`

`src/app/readers/` มี `console/` และ `queue/` ซึ่งเป็นหน้าเครื่องมือของนักพยากรณ์ (มี layout ของตัวเองอยู่แล้ว) ถ้าสร้าง `readers/layout.tsx` **หน้าเหล่านั้นจะได้ shell ไปด้วยโดยไม่ตั้งใจ**

**เลือกทางใดทางหนึ่ง**
- **แนะนำ (ความเสี่ยงต่ำ)**: ใส่ `<SiteHeader>` / `<SiteFooter>` ในไฟล์ `readers/page.tsx` และ `readers/[id]/page.tsx` ตรง ๆ ไม่สร้าง layout
- ทางเลือก: ใช้ route group `src/app/readers/(directory)/` ครอบเฉพาะ `page.tsx` + `[id]/` (URL ไม่เปลี่ยน) — สะอาดกว่าแต่ diff ใหญ่และเสี่ยงพลาดตอนย้ายไฟล์

### 8.3 hydration mismatch (**INC-0075**)

`SiteHeader` ต้องเรนเดอร์ผลเหมือนกันทั้งฝั่งเซิร์ฟเวอร์และไคลเอนต์
- ห้ามใช้ `Date`, `Math.random`, `window`, `localStorage` ใน `SiteHeader`/`SiteFooter`
- ปี `© 2026` ใน footer ปัจจุบันเป็นสตริงคงที่ — **ห้ามเปลี่ยนเป็น `new Date().getFullYear()`**
- อนิเมชันเข้า (`motion`) ห้ามใส่ใน shell — ถ้าต้องใส่ ให้ผ่าน `useHasMounted()` เหมือนที่ [`CardDetailView.tsx`](../../src/components/encyclopedia/CardDetailView.tsx) ทำ

### 8.4 กฎเหล็กข้อ 14 กับ PR-B

จุดเดียวที่เสี่ยง = ถ้าสคริปต์หาไพ่ใกล้เคียงไม่ครบ 4 ใบแล้วมีคน "เติมให้ครบ"
**สคริปต์ต้อง `throw` และ CI ต้องตก** — ห้ามมี fallback ใด ๆ ที่หยิบไพ่ขึ้นมาเองแม้แต่ใบเดียว ด่านตรวจใน §4.4 คือกำแพงกันเรื่องนี้

### 8.5 แผนถอย

| PR | วิธีถอย | ผลข้างเคียง |
| :--- | :--- | :--- |
| A | `git revert <sha>` — header กลับไปเป็นแบบเดิม 5 แบบ | ไม่มี ทุกหน้าเป็นอิสระต่อกัน |
| B | `git revert <sha>` — กลับไป client fetch | Vectorize ต้องยัง rebuild อยู่ ไม่งั้น section หาย |
| C | `git revert <sha>` — footer กลับไปอยู่แค่หน้าแรก | ต้องตรวจว่า `HomeSeoContent` กลับมามี `</footer>` ครบ |

ทั้ง 3 PR แยก commit กันชัดเจน ถอยทีละตัวได้โดยไม่กระทบตัวอื่น

---

## 9. สิ่งที่ **ไม่** อยู่ในขอบเขต

รายการต่อไปนี้พบระหว่างวินิจฉัยแต่ **ห้ามทำในรอบนี้** — บันทึกไว้ใน [`docs/plans/BACKLOG.md`](BACKLOG.md) แทน

1. **เพิ่ม/ลด/เปลี่ยนลิงก์ในฟุตเตอร์** — รอบนี้ยกของเดิมมาทั้งชุด ห้ามแก้เนื้อหา
2. **`/s/[id]`** (หน้า redirect สำหรับลิงก์แชร์) — ตั้งใจให้ว่าง ห้ามใส่ shell
3. **ทำ `SacredNavDropdown` ให้เป็น mega-menu** — คนละงาน
4. **เขียนบทความ / เพิ่มหน้าใหม่** — ไม่เกี่ยว
5. **ลบ Vectorize / `/api/search`** — ยังใช้กับช่องค้นหา
6. **แตะ `/admin`, `/reading`, `/tester`** — คนละ domain

---

## 📌 สรุปสำหรับคนที่จะลงมือ

| PR | ชื่อ branch | ไฟล์ใหม่ | ไฟล์ที่แก้ | ผลลัพธ์วัดได้ |
| :--- | :--- | ---: | ---: | :--- |
| **B** (ทำก่อน) | `feat/related-cards-ssr` | 2 | 4 | 312 ลิงก์เข้า HTML · ตัด AI call ต่อ pageview |
| **A** | `feat/site-header-unify` | 7 | 10 | 128 หน้าใช้ header เดียวกัน มีโลโก้ + sticky ครบ |
| **C** | `feat/site-footer-everywhere` | 2 | 12 | ~2,560 ลิงก์ภายใน · AI Disclosure + สายด่วน 1323 ทุกหน้า |
