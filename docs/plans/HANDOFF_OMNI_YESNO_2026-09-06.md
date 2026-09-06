# 🎯 แผนส่งต่องาน 3 ชิ้น — Yes/No 78 หน้า · Omnichannel · Daily Digest

> **ผู้จัดทำ**: Claude · 2026-09-06 · **ผู้รับช่วง**: ทีม/เอเจนต์ตัวถัดไป
> **ที่มา**: กลั่นจากเอกสารวิเคราะห์คู่แข่งของทีมภายนอก — **เก็บมาเฉพาะ 3 ข้อที่ยังไม่มีในเว็บจริง**
> ส่วนที่เหลือของเอกสารนั้น (`/daily`, `/love/1-card`, FAQPage, Social Export, Provably Fair, Journal)
> **ทำเสร็จไปแล้วใน PR #284–#288** — อย่าทำซ้ำ
> **โค้ดอ้างอิง**: `main` ที่ commit `17a4937` — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมาแทน
> **ขนาดงานรวม**: ~13–16 ชม. · **3 PR แยกกัน** · ห้ามรวมเป็น PR เดียว

---

## ⛔ อ่านก่อนแตะโค้ดบรรทัดแรก

| ลำดับ | เอกสาร | อ่านเพื่ออะไร |
| :-: | :--- | :--- |
| 1 | [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) | บทเรียนความผิดพลาด — ทำผิดซ้ำ = บกพร่องร้ายแรงสุด |
| 2 | [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) | **ISSUE-003** (ยิปซี yesNo เอนเอียง) เกี่ยวตรงกับงาน A |
| 3 | [`docs/plans/TRAFFIC_CAPTURE_PLAN_2026-09-05.md`](TRAFFIC_CAPTURE_PLAN_2026-09-05.md) | หลักฐาน SERP จริงที่เป็นเหตุผลของงาน A |
| 4 | [`docs/PENDING_SETUP.md`](../PENDING_SETUP.md) | ทะเบียน secrets — งาน B และ C ต้องเพิ่มรายการ |

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain <a|b|c> --files "<ไฟล์>" --task "<งาน>"
# ...แก้งาน...
npm run verify:cards            # เฉพาะงาน A
npm run repo:verify             # ต้องผ่านครบทุกด่าน ทุกงาน
npm run log:sync
npm run commit -- --agent <ชื่อคุณ> --type feat --scope <scope> --msg "..." --files "..."
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run pr:auto -- "<title>" --body-file <path>
```

> 🚨 **`push` แล้วจบ = งานยังไม่เสร็จ** (กฎเหล็กข้อ 13) — ต้องเปิด PR ให้ CI ครบทุกด่าน + Auto-Merge + Auto-Deploy ทำงาน

---

## 📋 สรุป 3 งาน และลำดับที่ต้องทำ

| # | งาน | ทำไม | เวลา | ความเสี่ยง | ขึ้นกับใคร |
| :-: | :--- | :--- | :-: | :-: | :--- |
| **A** | เซกชัน "ใช่หรือไม่" ใน 78 หน้าไพ่ | ข้อมูล `yesNo` **มีครบทั้ง 78 ใบอยู่แล้ว** แต่ไม่เคยโผล่บน UI สักที่ — ได้ 78 หน้า × คีย์เวิร์ดใหม่ โดยไม่ต้องเขียนเนื้อหาใหม่ | 4 ชม. | 🟢 ต่ำ | ไม่มี — **ทำก่อนได้เลย** |
| **B** | Omnichannel 6 ช่อง (TikTok · FB · IG · LINE OA · Threads · X) | ปุ่มแชร์ออก **มีอยู่แล้ว 5 ช่อง** แต่ทุกโพสต์เป็นทางตัน — ไม่มีบัญชีให้ตาม ไม่มี handle ในแคปชัน ไม่มี UTM ให้วัด | 3–4 ชม. (โค้ด) | 🟡 กลาง | **เจ้าของต้องเปิด 6 บัญชีก่อน** |
| **C** | Daily Digest (อีเมล + LINE Push) | Retention loop ที่หายไป · `marketing_consent` + Resend + LINE user id **มีพร้อมแล้ว** ขาดแค่ตัวจับเวลา | 6–8 ชม. | 🔴 สูง (PDPA + ส่งออกนอก) | ต้องจบงาน B ก่อน (ใช้ LINE token ร่วมกัน) |

---
---

# 🅰️ งาน A — เซกชัน "ใช่หรือไม่" ใน 78 หน้าไพ่

**PR เดียว · 4 ไฟล์แก้ + 2 ไฟล์ใหม่ · ไม่แตะ logic การสับไพ่ ไม่แตะฐานข้อมูลไพ่**

## A.0 หลักฐานว่าทำไมคุ้มที่สุดใน 3 งาน

**ดีมานด์**: Google Autocomplete `hl=th&gl=th` — ตระกูลคำ "ไพ่ [ชื่อ] ใช่หรือไม่ / yes or no" เป็นหางยาวที่ไม่มีพอร์ทัลใหญ่จับ MyHora ไม่มีหน้าไพ่รายใบสักใบ (0 จาก 9 หน้า)

**ของที่มีอยู่แล้วแต่ไม่ได้ใช้** — นี่คือหัวใจของงานนี้:

```ts
// src/data/cards/types.ts:53
/** แนวโน้มคำตอบสำหรับ spread Yes/No */
yesNo: YesNo;          // "yes" | "no" | "maybe" — ครบทั้ง 78 ใบ
```

การกระจายจริง (นับจากไฟล์ข้อมูล ณ `17a4937`): **ใช่ 38 · ไม่ใช่ 22 · ไม่แน่ 18** ตรงกับที่ `verify:cards` ยืนยันตอนปิด ISSUE-003

**แต่ค้นทั้งเรโปแล้ว `yesNo` ถูกใช้แค่ 2 ที่**:

| ไฟล์ | ใช้ทำอะไร |
| :--- | :--- |
| [`src/app/love/1-card/LoveOneCardClient.tsx:167`](../../src/app/love/1-card/LoveOneCardClient.tsx) | แสดงผลตอนเปิดไพ่ความรัก |
| [`src/app/api/admin/content/route.ts:74`](../../src/app/api/admin/content/route.ts) | ให้แอดมิน override |

→ **หน้าสารานุกรม 78 ใบไม่เคยแสดงค่านี้เลย** ทั้งที่เป็นหน้าที่ Google เก็บดัชนีจริง

## A.1 กฎการออกแบบที่ห้ามละเมิด (อ่านให้จบก่อนเขียนโค้ด)

### ① ไพ่หัวกลับ **ห้ามกลับคำตอบเอง**

`card.yesNo` มีค่าเดียวต่อใบ และเป็นค่าของ **หัวตั้ง** เท่านั้น

- ❌ **ห้าม** เขียน `isUpright ? card.yesNo : flip(card.yesNo)` — นั่นคือการ**กุคำตอบที่ไม่มีในฐานข้อมูล** = ละเมิดกฎเหล็กข้อ 14 (Zero Fabricated Cards Policy) โดยตรง
- ✅ **ให้ทำ**: เมื่อหัวกลับ ให้แสดงคำตอบเดิม + อธิบายว่า "แนวโน้มนี้อ่อนกำลังลง / มีอุปสรรคขวาง" โดยอ้างจาก `card.meanings.general.reversed` ที่มีอยู่จริง
- ถ้าอนาคตต้องการค่าหัวกลับแยก ต้องเพิ่มฟิลด์ `yesNoReversed` ลง `types.ts` แล้วกรอกครบ 78 ใบ + รัน `verify:cards` — **ไม่ใช่งานของ PR นี้**

### ② เนื้อหาต้องต่างกันจริงทั้ง 78 หน้า

ห้ามใช้ประโยคสำเร็จรูป 3 แบบวนซ้ำ 78 หน้า (= duplicate content แบบเดียวกับที่เราโจมตี MyHora อยู่)
ให้ประกอบประโยคจากข้อมูลเฉพาะใบ: `card.nameTh` · `card.keywords.upright/reversed` · `card.meanings.general` · `card.element` · `card.astrology`

### ③ กฎเหล็กข้อ 2 และข้อ 10

- ห้ามอิโมจิการ์ตูน — ใช้ได้แค่ `✦` `✨` (ห้าม ✅ ❌ ❤️ ⚠️ ในโค้ด UI)
- ภาษาไทยธรรมชาติแบบแม่หมอ ไม่ใช่ศัพท์ระบบ ("ไพ่ใบนี้เอนไปทางใช่" ไม่ใช่ "ค่า yesNo = yes")

## A.2 ไฟล์ที่ต้องแก้ทีละบรรทัด

### 🆕 ไฟล์ใหม่ 1 — `src/data/cards/yes-no.ts`

```ts
import type { TarotCard, YesNo } from "./types";

/** โทนของคำตอบแต่ละแบบ — ใช้กับหัวข้อและสีในเซกชัน "ใช่หรือไม่" */
export const YES_NO_TONE: Record<YesNo, {
  labelTh: string; labelEn: string; leadTh: string; leadEn: string; accent: string;
}> = {
  yes:   { labelTh: "เอนไปทางใช่",    labelEn: "Leaning Yes",   leadTh: "…", leadEn: "…", accent: "#5C7A5C" },
  no:    { labelTh: "เอนไปทางไม่ใช่", labelEn: "Leaning No",    leadTh: "…", leadEn: "…", accent: "#8A5C5C" },
  maybe: { labelTh: "ยังไม่ชี้ขาด",   labelEn: "Undecided",     leadTh: "…", leadEn: "…", accent: "#A58A5C" },
};

export interface YesNoAnswer {
  verdict: YesNo;
  headline: string;   // "ไพ่ คนเขลา ใช่หรือไม่ — เอนไปทางใช่"
  body: string;       // ประโยคที่ประกอบจากคีย์เวิร์ดเฉพาะใบ
  condition: string;  // เงื่อนไข/ข้อควรระวัง ดึงจาก meanings.general
}

/**
 * ประกอบคำตอบ Yes/No จากข้อมูลที่มีอยู่จริงในสำรับเท่านั้น
 * ⚠️ ห้ามคืนค่าที่ไม่ได้มาจาก card.* — ดูกฎเหล็กข้อ 14
 * ⚠️ isUpright=false ไม่กลับ verdict แต่เปลี่ยน body/condition เป็นเวอร์ชันหัวกลับ
 */
export function buildYesNoAnswer(card: TarotCard, isUpright: boolean, isEnglish: boolean): YesNoAnswer
```

**ข้อกำหนดของ `buildYesNoAnswer`**
- `verdict` = `card.yesNo` เสมอ ทั้งหัวตั้งและหัวกลับ
- `body` ต้องหยิบ `card.keywords.upright.slice(0,3)` (หรือ `.reversed` เมื่อหัวกลับ) มาต่อในประโยค → ได้ข้อความไม่ซ้ำกัน 78 แบบอัตโนมัติ
- `condition` เมื่อหัวตั้ง = ประโยคแรกของ `card.meanings.general.upright` · เมื่อหัวกลับ = ของ `.reversed`
- โหมด EN ใช้ `card.keywordsEn` / `card.meaningsEn` และ **ต้อง fallback เป็นภาษาไทยเมื่อฟิลด์ EN ไม่มี** (ไพ่บางใบยังไม่มี `meaningsEn`)
- ฟังก์ชันบริสุทธิ์ ไม่มี `Math.random()` ไม่มี `Date` — หน้านี้เป็น SSG ต้องได้ HTML เดิมทุกครั้ง (ไม่งั้นเกิด hydration mismatch แบบ ISSUE-008 / INC-0075)

### 🆕 ไฟล์ใหม่ 2 — `src/components/encyclopedia/CardYesNoAnswer.tsx`

```tsx
"use client";
interface Props { card: TarotCard; isUpright: boolean; isEnglish: boolean; }
```

**ข้อกำหนดการแสดงผล**
- `<h2>` ต้องมีคำค้นตรงตัว: `ไพ่ {card.nameTh} ใช่หรือไม่ (Yes / No)` — คีย์เวิร์ดอยู่ใน heading จริง ไม่ใช่แค่ meta
- โครงกล่องลอกจาก "5 Categorized Meanings" ที่ [`CardDetailView.tsx:250`](../../src/components/encyclopedia/CardDetailView.tsx) เพื่อให้ดีไซน์เป็นชุดเดียวกัน:
  `rounded-xl border border-[#D5CEC2] bg-[#FFFFFF] p-4 sm:p-5 shadow-xs`
- ป้ายคำตอบใช้ `YES_NO_TONE[...].accent` เป็นสีขอบ/ตัวอักษร **ห้ามใช้สีแดง-เขียวจัด** จะหลุดจากพาเลต Quiet Luxury
- ต้องมีบรรทัดกำกับความหมายเสมอ (กันคนเข้าใจว่าเป็นคำพยากรณ์ชี้ขาด):
  `"เป็นแนวโน้มของไพ่ใบนี้ตามตำรา 1909 ไม่ใช่คำตอบสำเร็จรูปของคำถามคุณ — เปิดไพ่จริงเพื่อดูบริบทของคุณเอง"`
- ปิดท้ายด้วยลิงก์ภายใน 2 เส้น (ผัง Yes/No มีอยู่แล้วที่ [`spreads.ts:110`](../../src/data/spreads.ts)):
  - `/spreads/yes-no` — "เปิดไพ่ยิปซี ใช่หรือไม่ 3 ใบ ฟรี"
  - `/` — "ถามแม่หมอ AI ด้วยคำถามของคุณเอง"
- `AnimatePresence` ต้องใช้ `initial={false}` เหมือนบล็อก 5 มิติ — เนื้อหานี้ต้องอยู่ใน HTML ที่บอตเห็นทันที

### ✏️ แก้ไฟล์ 1 — `src/components/encyclopedia/CardDetailView.tsx`

แทรกคอมโพเนนต์ใหม่ **หลังบล็อก Keywords Ribbon จบ** และ **ก่อน `{/* 5 Categorized Meanings List */}`** (ราวบรรทัด 230)

เหตุผลของตำแหน่ง: คำตอบ Yes/No คือสิ่งที่คนค้นคำนี้ต้องการเห็นเร็วที่สุด ถ้าไปวางท้ายหน้าจะเสีย engagement และ Google อาจไม่ยกเป็น snippet

```tsx
        {/* คำตอบ ใช่/ไม่ใช่ — ข้อมูลจาก card.yesNo ที่มีครบทั้ง 78 ใบ */}
        <CardYesNoAnswer card={card} isUpright={isUpright} isEnglish={isEnglish} />
```

### ✏️ แก้ไฟล์ 2 — `src/app/cards/[id]/page.tsx`

**2.1 `description` (บรรทัด 32)**

```
ก่อน : ...โหราศาสตร์ ${card.astrology} ธาตุ${card.element} ภาพดั้งเดิม 1909
หลัง : ...โหราศาสตร์ ${card.astrology} ธาตุ${card.element} พร้อมคำตอบ ใช่หรือไม่ (Yes/No) ภาพดั้งเดิม 1909
```

**2.2 `keywords` (บรรทัด 40–47)** — เติม 3 รายการ ต่อจาก `` `${card.nameTh} กลับหัว` ``

```ts
      `${card.nameTh} ใช่หรือไม่`,
      `ไพ่ ${card.nameTh} yes or no`,
      `ดูดวงไพ่ยิปซี ${card.nameTh}`,
```

**2.3 เพิ่ม FAQPage JSON-LD** — หน้าไพ่ยังไม่มี (มีแค่ `DefinedTerm` + `BreadcrumbList`)

```ts
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question",
        name: `ไพ่ ${card.nameTh} ใช่หรือไม่?`,
        acceptedAnswer: { "@type": "Answer", text: /* buildYesNoAnswer(card, true, false) → headline + body */ } },
      { "@type": "Question",
        name: `ไพ่ ${card.nameTh} กลับหัว แปลว่าอะไร?`,
        acceptedAnswer: { "@type": "Answer", text: card.meanings.general.reversed } },
      { "@type": "Question",
        name: `ไพ่ ${card.nameTh} ด้านความรักหมายถึงอะไร?`,
        acceptedAnswer: { "@type": "Answer", text: card.meanings.love.upright } },
    ],
  };
```

แล้วเรนเดอร์ `<script type="application/ld+json">` เพิ่มอีก 1 ตัว ต่อจาก `breadcrumbJsonLd` (บรรทัด ~152)

> ⚠️ **ข้อความใน FAQPage ต้องตรงกับที่แสดงบนหน้าจริง** ไม่งั้นเป็น structured data spam โดนลดอันดับ — นี่คือเหตุผลที่ต้องเรียก `buildYesNoAnswer` ตัวเดียวกันทั้ง JSON-LD และ UI

### ✏️ แก้ไฟล์ 3 — `src/components/encyclopedia/CardSpreadLinks.tsx`

เพิ่มผัง `yes-no` เข้าไปในรายการผังแนะนำของทุกใบ (ตอนนี้แนะนำตามหมวด ทำให้ผัง Yes/No แทบไม่มีลิงก์ขาเข้า)

## A.3 เกณฑ์ผ่านงาน A

```bash
npm run verify:cards      # ต้องยังตอบ ใช่ 38 / ไม่ใช่ 22 / ไม่แน่ 18 และไม่ขึ้นคำเตือน
npm run repo:verify       # ต้องผ่านครบทุกด่าน
npm run build             # SSG ต้องสร้างครบ 78 หน้า ไม่มี hydration warning
```

- [ ] เปิด `/cards/major-00` `/cards/cups-07` `/cards/swords-10` → เห็นเซกชันใช่หรือไม่ **เหนือ** บล็อก 5 มิติ
- [ ] กดสลับหัวตั้ง/หัวกลับ → **คำตอบ (ใช่/ไม่ใช่/ไม่แน่) ต้องไม่เปลี่ยน** เปลี่ยนแค่คำอธิบาย
- [ ] `curl -s https://seertarot.net/cards/major-00 | grep -c "ใช่หรือไม่"` ≥ 3 (heading + FAQ + ลิงก์ผัง)
- [ ] วางซอร์สลง [Rich Results Test](https://search.google.com/test/rich-results) → พบ **FAQPage + BreadcrumbList** ไม่มี error
- [ ] สุ่มเทียบ 5 ใบ → ข้อความในเซกชัน **ต้องไม่ซ้ำกันคำต่อคำ**
- [ ] `grep -rn "✅\|❌\|❤️\|⚠️" src/components/encyclopedia/CardYesNoAnswer.tsx` → **ต้องได้ 0 บรรทัด**

---
---

# 🅱️ งาน B — Omnichannel 6 ช่องทาง (TikTok · Facebook · Instagram · LINE OA · Threads · X)

**PR เดียว · 6 ไฟล์ · โค้ดล้วน ไม่มี migration**

## B.0 สภาพปัจจุบัน — ครึ่งหนึ่งทำไว้แล้ว อีกครึ่งหายไปทั้งดุ้น

### ✅ ฝั่ง "ผู้ใช้แชร์ออก" เสร็จแล้ว 5 จาก 6 ช่อง

[`ShareModal.tsx:322`](../../src/components/reading/ShareModal.tsx) มีปุ่มแชร์ครบ **facebook · instagram · tiktok · twitter (X) · threads**
พร้อมภาพ 9:16 (1080×1920) สำหรับ Story/TikTok, ภาพ 4:5 (1080×1350) สำหรับฟีด, R2 `SHARE_BUCKET` + หน้า `/s/[id]` ที่มี OG image
และ `trackEvent("share_click", { platform })` ยิงเข้า GA4 อยู่แล้ว

**ขาดช่องเดียว: LINE** — ทั้งที่เป็นแอปแชตที่คนไทยใช้มากที่สุด และเป็นช่องที่คนส่งดวงให้เพื่อนกันจริง ๆ

### ❌ ฝั่ง "บัญชีแบรนด์" ยังไม่มีอะไรเลยสักอย่าง

```ts
// src/app/layout.tsx:128
sameAs: ["https://github.com/luminuy/tarot-web"],
```

| สิ่งที่ตรวจ | ผล |
| :--- | :--- |
| ลิงก์โซเชียลที่ผู้ใช้กดได้ทั้งเว็บ | **0 จุด** ([`SiteFooter.tsx`](../../src/components/layout/SiteFooter.tsx) มีแต่ลิงก์ภายใน) |
| `sameAs` ใน Organization JSON-LD | มีแต่ลิงก์ GitHub — Google ผูก Knowledge Panel กับบัญชีเราไม่ได้ |
| `twitter.site` / `twitter.creator` | **ไม่มี** ([`layout.tsx:100`](../../src/app/layout.tsx) มีแต่ card/title/description) |
| UTM ในลิงก์ที่แชร์ออก | `grep -rn "utm_" src/` → **0 บรรทัด** — วัดไม่ได้เลยว่าคนกลับมาจากช่องไหน |
| @handle ในแคปชันที่ระบบเขียนให้ | **ไม่มี** — คนเห็นโพสต์แล้วตามบัญชีเราต่อไม่ได้ |

> 🔑 **ข้อสรุปที่เปลี่ยนขอบเขตงานนี้**
> เราสร้างเครื่องมือให้ผู้ใช้ยิงคอนเทนต์ออกไป 5 แพลตฟอร์มเรียบร้อยแล้ว
> **แต่ทุกโพสต์เป็นทางตัน** — ไม่มีบัญชีให้ตาม ไม่มี handle ในแคปชัน ไม่มี UTM ให้วัด
> งาน B คือ **ปิดวงจรที่สร้างค้างไว้** ไม่ใช่เริ่มจากศูนย์

## B.1 ⚠️ สิ่งที่ AI ทำแทนไม่ได้ — เจ้าของต้องทำเอง

**เปิด 6 บัญชีนี้ก่อน ไม่งั้นงานโค้ดจะได้ลิงก์ตาย** (ช่องไหนยังไม่พร้อม ปล่อยว่างไว้ได้ ระบบซ่อนให้เอง)

| # | ช่องทาง | เปิดที่ไหน | ได้อะไรมา | บทบาทในแผน |
| :-: | :--- | :--- | :--- | :--- |
| 1 | **TikTok** | tiktok.com/business | `@handle` | 🔴 **ตัวดึงคนใหม่หลัก** — คอนเทนต์ดูดวงคลิปสั้นคือสนามที่คนไทยดูมากที่สุด และภาพ 9:16 เราทำได้อยู่แล้ว |
| 2 | **Facebook Page** | facebook.com/pages/create | Page URL | ฐานผู้ใช้อายุ 30+ ที่ยังเป็นกลุ่มจ่ายเงินดูดวง · ปุ่มแชร์ FB มีอยู่แล้ว |
| 3 | **Instagram** | บัญชี Professional ผูกกับ Page | `@handle` | รับต่อจากภาพ Story 9:16 ที่ระบบสร้างให้อยู่แล้ว |
| 4 | **LINE Official Account** | [manager.line.biz](https://manager.line.biz) | Basic ID `@xxxxxxx` | 🔴 **ตัวเก็บคนกลับ** — เป็นทางเดียวที่ push หาผู้ใช้ได้โดยไม่ผ่านอัลกอริทึม · ป้อนงาน C ต่อ |
| 5 | **Threads** | threads.net (ผูกกับ IG) | `@handle` | ปุ่มแชร์มีอยู่แล้ว · คอนเทนต์ข้อความสั้นต้นทุนต่ำสุด |
| 6 | **X** | x.com | `@handle` | ปุ่มแชร์มีอยู่แล้ว · ต้องใช้ handle เติม `twitter.site` ให้การ์ดพรีวิวสมบูรณ์ |

**เพิ่มอีก 1 อย่างสำหรับงาน C**: ใน LINE Developers Console สร้าง channel แบบ **Messaging API แยกต่างหาก** → ได้ `LINE_MESSAGING_TOKEN`

> 🔴 **ห้ามใช้ `LINE_CHANNEL_ID` / `LINE_CHANNEL_SECRET` เดิมซ้ำ** — คู่นั้นเป็น **LINE Login** ([`wrangler.jsonc`](../../wrangler.jsonc) ระบุไว้) คนละ channel type กับ Messaging API เอามาใช้ปนกันจะพัง auth ที่ใช้งานอยู่จริง

## B.2 ไฟล์ที่ต้องแก้

### 🆕 ไฟล์ใหม่ — `src/lib/config/social.ts`

```ts
/**
 * ช่องทางโซเชียลของแบรนด์ — แหล่งความจริงเดียวของทั้งระบบ
 * ทุกที่ที่ต้องใช้ลิงก์/handle (footer, JSON-LD sameAs, twitter card, แคปชันแชร์)
 * ต้องอ่านจากที่นี่ ห้าม hardcode ซ้ำที่อื่น
 * ⚠️ ช่องที่ยังไม่เปิดบัญชี ปล่อย env ว่างไว้ → ระบบซ่อนให้เอง ไม่เรนเดอร์ลิงก์ตาย
 */
export const SOCIAL_CHANNELS = [
  { key: "tiktok",    labelTh: "ติ๊กต็อก",       labelEn: "TikTok",    url: process.env.NEXT_PUBLIC_TIKTOK_URL    ?? "", handle: process.env.NEXT_PUBLIC_TIKTOK_HANDLE    ?? "" },
  { key: "facebook",  labelTh: "เฟซบุ๊กเพจ",     labelEn: "Facebook",  url: process.env.NEXT_PUBLIC_FB_PAGE_URL   ?? "", handle: "" },
  { key: "instagram", labelTh: "อินสตาแกรม",     labelEn: "Instagram", url: process.env.NEXT_PUBLIC_IG_URL        ?? "", handle: process.env.NEXT_PUBLIC_IG_HANDLE        ?? "" },
  { key: "line",      labelTh: "LINE Official",  labelEn: "LINE",      url: process.env.NEXT_PUBLIC_LINE_OA_URL   ?? "", handle: process.env.NEXT_PUBLIC_LINE_OA_ID       ?? "" },
  { key: "threads",   labelTh: "เธรดส์",         labelEn: "Threads",   url: process.env.NEXT_PUBLIC_THREADS_URL   ?? "", handle: process.env.NEXT_PUBLIC_THREADS_HANDLE   ?? "" },
  { key: "x",         labelTh: "X",              labelEn: "X",         url: process.env.NEXT_PUBLIC_X_URL         ?? "", handle: process.env.NEXT_PUBLIC_X_HANDLE         ?? "" },
] as const;

export type SocialKey = (typeof SOCIAL_CHANNELS)[number]["key"];

export const ACTIVE_SOCIAL = SOCIAL_CHANNELS.filter((c) => c.url.length > 0);

/** หา handle ของช่องหนึ่งเพื่อเอาไปต่อท้ายแคปชัน — ไม่มีบัญชีก็คืนค่าว่าง */
export function socialHandle(key: SocialKey): string {
  return SOCIAL_CHANNELS.find((c) => c.key === key)?.handle ?? "";
}

/** ต่อ UTM ให้ลิงก์ที่แชร์ออก เพื่อให้ GA4 แยกได้ว่าคนกลับมาจากช่องไหน */
export function withUtm(url: string, source: SocialKey | "digest", medium = "social"): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", source);
    u.searchParams.set("utm_medium", medium);
    u.searchParams.set("utm_campaign", "user_share");
    return u.toString();
  } catch {
    return url;   // ลิงก์ไม่ถูกรูป → คืนของเดิม ห้ามพัง flow แชร์
  }
}
```

### ✏️ `src/app/layout.tsx` — 2 จุด

**จุดที่ 1 · บรรทัด 128 (`sameAs`)**

```
ก่อน : sameAs: ["https://github.com/luminuy/tarot-web"],
หลัง : sameAs: [...ACTIVE_SOCIAL.map((c) => c.url), "https://github.com/luminuy/tarot-web"],
```

เหตุผล: `sameAs` คือช่องที่ Google ใช้ผูก Knowledge Panel เข้ากับบัญชีโซเชียล — เป็นสัญญาณ E-E-A-T ที่คู่แข่งทุกเจ้าใน SERP มี แต่เราไม่มี

**จุดที่ 2 · บล็อก `twitter:` บรรทัด 100–105**

```ts
  twitter: {
    card: "summary_large_image",
    site: socialHandle("x") || undefined,      // ← เพิ่ม
    creator: socialHandle("x") || undefined,   // ← เพิ่ม
    title: "...",   // คงเดิม
    ...
  },
```

`|| undefined` สำคัญ — ถ้ายังไม่มีบัญชี ต้องไม่ปล่อย `<meta name="twitter:site" content="">` ออกไป

### ✏️ `src/components/layout/SiteFooter.tsx`

แทรกแถวช่องทาง **ระหว่าง** บล็อก "Brand & Mission" (จบราวบรรทัด 58) กับ "AI Disclosure Card"

- ต้องครอบด้วย `{ACTIVE_SOCIAL.length > 0 && (...)}` — ไม่มีบัญชีสักช่อง = ไม่เรนเดอร์อะไรเลย
- `<a target="_blank" rel="noopener noreferrer">` + `aria-label` ทุกเส้น
- **ห้ามใช้อิโมจิเป็นไอคอน** (กฎเหล็กข้อ 2) → ใช้ inline SVG โมโนโครมสีเดียว `fill="currentColor"` คุมด้วย `text-[#D5CEC2]/70 hover:text-[#FAF7F2]` ให้กลมกลืนกับพาเลต Quiet Luxury
- 6 ไอคอนในแถวเดียว มือถือต้อง `flex-wrap` ไม่ล้นขอบ (กฎเหล็กข้อ 3 · Zero-Clipping)

### ✏️ `src/components/layout/nav-links.ts`

เพิ่มลิงก์ LINE OA ในคอลัมน์ "ปลอดภัย & โปร่งใส" (บรรทัด ~59) ด้วยคำว่า **"ทักแม่หมอทาง LINE"**
จุดนี้อยู่ทุกหน้าของเว็บ = ตัวดัน follower ที่ต้นทุนศูนย์

### ✏️ `src/components/reading/ShareModal.tsx` — 3 จุด (จุดสำคัญที่สุดของงาน B)

**จุดที่ 1 · เพิ่ม LINE เป็นปุ่มแชร์ที่ 6**

```ts
// ขยาย union ที่บรรทัด 322
const handleShareToBrand = async (brand: "facebook" | "instagram" | "tiktok" | "twitter" | "threads" | "line")
```

LINE ใช้ **intent URL แบบ sync ล้วน** ไม่ต้องรอ `await` ก่อนเปิดหน้าต่าง จึงไปอยู่กลุ่มเดียวกับ `needsPopup`:

```ts
if (brand === "line") {
  openOrRedirect(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(lineText)}`);
  return;
}
```

> ⚠️ อ่านคอมเมนต์ที่บรรทัด 325 ให้จบก่อนแก้ — **ต้องเปิดแท็บเปล่าแบบ sync ก่อน `await` ใด ๆ** ไม่งั้นเบราว์เซอร์บล็อกป็อปอัป นี่เป็นบทเรียนที่แก้มาแล้ว อย่าทำพัง

ปุ่มที่ 6 ใน UI (ต่อจากบรรทัด 681) ต้องเรนเดอร์เฉพาะเมื่อ **ไม่ใช่มือถือที่รองรับ native share** เหมือนปุ่มอื่น และ layout ปุ่มต้องยังไม่ล้นกรอบบนจอ 375px

**จุดที่ 2 · ใส่ @handle ลงในแคปชันทุกช่อง**

ตอนนี้แคปชันจบด้วยแฮชแท็กเฉย ๆ (`#ไพ่ทาโรต์ #ดูดวง #SeerTarot`) คนอ่านตามบัญชีเราต่อไม่ได้
→ ต่อท้ายด้วย `socialHandle(brand)` เมื่อมีค่า เช่น `\n\nดูดวงเพิ่มที่ @seertarot`
**ห้ามใส่ข้อความค้างไว้เมื่อยังไม่มีบัญชี** — `socialHandle()` คืนค่าว่างแล้วต้องไม่เหลือช่องว่างหรือ `@` โดด ๆ

**จุดที่ 3 · ห่อลิงก์แชร์ด้วย UTM**

`buildShareLink()` (บรรทัด 296) คืน URL ดิบ → ให้ผู้เรียกห่อด้วย `withUtm(url, brand)` ก่อนส่งเข้า intent
ผลลัพธ์: GA4 → Traffic acquisition แยกได้ว่าคนกลับมาจาก TikTok หรือ LINE กี่คน **ซึ่งตอนนี้วัดไม่ได้เลย**

### ✏️ `docs/PENDING_SETUP.md`

เติมตาราง env ใหม่ 11 ตัว (ทั้งหมดเป็น public ยกเว้นตัวสุดท้าย):

`NEXT_PUBLIC_TIKTOK_URL` · `NEXT_PUBLIC_TIKTOK_HANDLE` · `NEXT_PUBLIC_FB_PAGE_URL` · `NEXT_PUBLIC_IG_URL` · `NEXT_PUBLIC_IG_HANDLE` · `NEXT_PUBLIC_LINE_OA_URL` · `NEXT_PUBLIC_LINE_OA_ID` · `NEXT_PUBLIC_THREADS_URL` · `NEXT_PUBLIC_THREADS_HANDLE` · `NEXT_PUBLIC_X_URL` · `NEXT_PUBLIC_X_HANDLE`

➕ `LINE_MESSAGING_TOKEN` — **secret ห้ามขึ้นต้น `NEXT_PUBLIC_`** (ใช้ในงาน C)

## B.3 เกณฑ์ผ่านงาน B

- [ ] **ไม่ตั้ง env เลย** → build ผ่าน · footer ไม่มีแถวช่องทาง · `sameAs` เหลือ GitHub ตัวเดียว · ไม่มี `<meta name="twitter:site" content="">` · **ไม่มี error**
- [ ] ตั้งครบ 6 ช่อง → footer โผล่ 6 ลิงก์ · `view-source` เห็น URL ทั้ง 6 ใน `sameAs`
- [ ] ปุ่มแชร์ LINE เปิด `social-plugins.line.me` ได้จริง **ไม่โดนเบราว์เซอร์บล็อกป็อปอัป** (ทดสอบทั้ง Safari iOS และ Chrome desktop)
- [ ] ลิงก์ที่แชร์ออกทุกช่องมี `utm_source` ตรงกับช่องนั้น
- [ ] แชร์ตอนยังไม่ตั้ง handle → แคปชัน**ไม่มี** `@` โดด ๆ หรือบรรทัดว่างค้าง
- [ ] จอ 375px → แถวปุ่มแชร์ 6 ปุ่มและแถวไอคอน footer 6 อัน **ไม่ล้นกรอบ ไม่มีสกรอลล์แนวนอน** (กฎเหล็กข้อ 3)
- [ ] `grep -rn "✅\|❌\|❤️" src/lib/config/social.ts src/components/layout/SiteFooter.tsx` → **0 บรรทัด**
- [ ] `npm run repo:verify` ผ่านครบทุกด่าน
- [ ] Lighthouse Accessibility ไม่ตก (ลิงก์ไอคอนล้วนต้องมี `aria-label`)

---
---

# 🅲 งาน C — Daily Digest (อีเมล + LINE Push)

**PR เดียว · 1 migration + 5 ไฟล์ · 🔴 งานที่เสี่ยงที่สุดใน 3 ชิ้น — อ่าน C.1 ให้จบก่อน**

## C.0 ของที่มีอยู่แล้ว (ไม่ต้องสร้างใหม่)

| ชิ้นส่วน | ที่อยู่ | สภาพ |
| :--- | :--- | :--- |
| ส่งอีเมล (Resend + dev fallback) | [`src/lib/email/send.ts:26`](../../src/lib/email/send.ts) | ✅ ใช้ได้เลย |
| เทมเพลตอีเมล | [`src/lib/email/templates.ts`](../../src/lib/email/templates.ts) | ✅ มี 3 ชุด ทำตามแพตเทิร์นเดิม |
| ความยินยอมการตลาด | `users.marketing_consent` + `consent_at` + `idx_users_consent` ([`0004_users.sql`](../../migrations/0004_users.sql)) | ✅ **มี index พร้อม query แล้ว** |
| LINE user id | `users.id` รูปแบบ `line_<userId>` | ✅ คือ id ที่ Messaging API ใช้ push ตรง |
| บันทึกดวง | [`src/lib/journal/journal.repo.ts`](../../src/lib/journal/journal.repo.ts) | ✅ ใช้ทำเนื้อหา digest ได้ |

**ที่ขาดคือตัวจับเวลาอย่างเดียว** — `wrangler.jsonc` ไม่มี `triggers.crons` และไม่มี workflow แบบ `schedule:` ใน `.github/workflows/`

## C.1 ⚠️ ข้อตัดสินใจสถาปัตยกรรม — ห้ามเลือกทางที่ผิด

### ตัวจับเวลา: ใช้ GitHub Actions **ไม่ใช่** Cloudflare Cron Trigger

`wrangler.jsonc` ชี้ `main` ไปที่ `.open-next/worker.js` ซึ่งเป็นไฟล์ที่ OpenNext **สร้างใหม่ทุกครั้งที่ build** และ export แค่ `fetch` การจะใส่ `scheduled` handler ต้องเขียน wrapper ครอบ worker ที่ generate มา = แตะจุดที่ deploy pipeline ทั้งสายพึ่งอยู่ **ความเสี่ยงไม่คุ้ม**

✅ **ให้ทำแบบนี้แทน**: `.github/workflows/daily-digest.yml` ยิง `POST /api/cron/daily-digest` พร้อม `Authorization: Bearer ${{ secrets.CRON_SECRET }}`

```yaml
on:
  schedule:
    - cron: "0 1 * * *"   # 01:00 UTC = 08:00 น. ไทย — GitHub cron เป็น UTC เสมอ
  workflow_dispatch:       # ให้กดยิงมือได้ตอนทดสอบ
```

> GitHub cron ดีเลย์ได้ 5–15 นาทีในช่วงพีค — ยอมรับได้สำหรับ digest รายวัน ห้ามใช้กับงานที่ต้องตรงเป๊ะ

### การเลือกไพ่ประจำวัน: **ห้ามสุ่มใหม่ในงาน cron**

🔴 นี่คือจุดที่ละเมิด **กฎเหล็กข้อ 14** ได้ง่ายที่สุดในทั้งแผน

- ❌ **ห้าม** `DECK[Math.floor(Math.random() * 78)]` ใน cron
- ❌ **ห้าม** ใส่ไพ่ default เมื่อดึงข้อมูลไม่ได้ (ไม่ว่า The Fool หรือใบไหน)
- ✅ **ให้ทำ**: อ่านไพ่ประจำวันจากไปป์ไลน์ `/daily` ที่มีอยู่แล้ว (commitment hash + Fisher-Yates เดิม) ถ้าดึงไม่ได้ → **ข้ามคนนั้น ไม่ส่ง** และบันทึก log พร้อมเหตุผล
- อีเมลต้องพา commitment hash ไปด้วย และลิงก์กลับหน้า `/daily` ที่ตรวจสอบได้ — จุดขายของเราคือ Provably Fair จะกลืนน้ำลายตัวเองในอีเมลไม่ได้

### PDPA: opt-in อย่างเดียว

- ส่งได้เฉพาะ `marketing_consent = 1 AND deleted_at IS NULL AND digest_email = 1` — **สามเงื่อนไขครบ**
- ทุกฉบับต้องมีลิงก์ยกเลิก `/api/digest/unsubscribe?t=<HMAC token>` — token ลงนามด้วย `TAROT_SESSION_SECRET`, ผูก user id, **ไม่ต้อง login ก็กดได้**
- ห้ามใส่ email หรือ user id ดิบใน URL (ดูข้อผิดพลาดแบบ ISSUE-018 ที่ปล่อย `customerRef` ไปใน query string)

### โควตา Resend

แผนฟรี = **100 ฉบับ/วัน** ต้องมี `MAX_DIGEST_PER_RUN` (ตั้ง 80) และคิวต่อวันถัดไป **ห้ามยิงรวดจนโดน rate limit แล้วบัญชีโดนระงับ**

## C.2 ไฟล์ที่ต้องสร้าง/แก้

### 🆕 `migrations/0011_digest_prefs.sql`

```sql
-- 0011_digest_prefs.sql: ความสมัครใจรับดวงประจำวัน (opt-in เท่านั้น · PDPA)
ALTER TABLE users ADD COLUMN digest_email        INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN digest_line         INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN digest_last_sent_at INTEGER;

-- กันส่งซ้ำเมื่อ cron ทำงานซ้อน (GitHub Actions ยิงซ้ำได้ถ้า retry)
CREATE TABLE IF NOT EXISTS digest_log (
  user_id    TEXT NOT NULL,
  send_date  TEXT NOT NULL,            -- 'YYYY-MM-DD' โซนเวลาไทย
  channel    TEXT NOT NULL,            -- 'email' | 'line'
  status     TEXT NOT NULL,            -- 'sent' | 'skipped' | 'failed'
  reason     TEXT,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, send_date, channel)
);
```

`PRIMARY KEY` สามช่องคือกลไกกันส่งซ้ำ — insert ชนแล้วข้าม ห้ามใช้ `INSERT OR REPLACE`

### 🆕 `src/app/api/cron/daily-digest/route.ts`

- ตรวจ `Authorization: Bearer <CRON_SECRET>` ก่อนอย่างอื่นทั้งหมด · ไม่ตรง → `401` เปล่า ๆ ไม่บอกเหตุผล
- ตอบกลับสรุปตัวเลข: `{ scanned, sent, skipped, failed }` เพื่อให้ดูจาก Actions log ได้
- `export const runtime = "edge"` ให้เหมือน route อื่นในเรโป

### 🆕 `.github/workflows/daily-digest.yml`

> ⚠️ **ห้ามใส่ `cache:` ใน `actions/setup-node`** — `setup-node@v5` จะ auto-detect pnpm แล้วพังเพราะเรโปนี้ไม่มี `pnpm-lock.yaml` (บทเรียนที่บันทึกไว้แล้ว) จริง ๆ workflow นี้ไม่ต้อง setup-node เลย ใช้ `curl` พอ

### ✏️ `src/lib/email/templates.ts`

เพิ่ม `dailyDigestHtml(name, card, hash, unsubUrl)` + `dailyDigestText(...)` ตามคู่ที่มีอยู่ (บรรทัด 110–198) — ต้องเขียนเวอร์ชัน text ด้วยมือ อย่าปล่อยให้ `htmlToText` เดาเอง

### ✏️ `src/app/account/page.tsx`

สวิตช์เปิด/ปิด 2 ตัว (อีเมล / LINE) **ค่าเริ่มต้นปิดทั้งคู่** พร้อมข้อความบอกชัดว่าจะส่งอะไร ตอนไหน และยกเลิกได้ทุกเมื่อ

### ✏️ `docs/PENDING_SETUP.md` + `docs/ADMIN_PANEL.md`

เติม `CRON_SECRET` และเพิ่มการ์ดสถานะ digest ล่าสุดในหน้า `/admin` (ต่อยอดจาก `SystemHealthPanel`)

## C.3 เกณฑ์ผ่านงาน C

```bash
npm run db:migrate            # 0011 ผ่านทั้ง local และ remote
npm run repo:verify           # ต้องผ่านครบทุกด่าน
```

- [ ] ไม่ตั้ง `RESEND_API_KEY` → ขึ้น dev log ครบ ไม่มี error (พฤติกรรมเดิมของ `send.ts`)
- [ ] ยิง `/api/cron/daily-digest` โดยไม่มี header → `401`
- [ ] ยิงซ้ำ 2 ครั้งในวันเดียว → ครั้งที่สอง `sent = 0`, `skipped = n` (กันซ้ำทำงาน)
- [ ] ผู้ใช้ที่ `marketing_consent = 0` → **ไม่ถูกนับใน scanned ด้วยซ้ำ**
- [ ] กดลิงก์ยกเลิกในอีเมลโดยไม่ล็อกอิน → `digest_email` กลายเป็น 0 · token ที่ถูกแก้มือ → ปฏิเสธ
- [ ] จำลอง error ตอนดึงไพ่ → บันทึก `status='skipped'` **ไม่มีอีเมลที่มีไพ่ที่ระบบกุขึ้นเองหลุดออกไปแม้แต่ฉบับเดียว**
- [ ] อีเมลที่ส่งจริงมี commitment hash + ลิงก์ตรวจสอบ

---
---

## 🚫 สิ่งที่ **ห้ามทำ** ในทั้ง 3 งาน

| ห้าม | เพราะ |
| :--- | :--- |
| รวม A+B+C เป็น PR เดียว | คนละ domain คนละความเสี่ยง — C พังต้อง revert ได้โดยไม่ลาก A ไปด้วย |
| แก้ `structure` ของไพ่ 78 ใบ หรือค่า `yesNo` | ISSUE-003 เพิ่งปิด การกระจาย 38/22/18 ผ่านการตรวจแล้ว |
| กลับค่า `yesNo` เองตอนไพ่หัวกลับ | กฎเหล็กข้อ 14 — เป็นการกุข้อมูลที่ไม่มีในสำรับ |
| ใส่อิโมจิการ์ตูนใน UI | กฎเหล็กข้อ 2 — ใช้ได้แค่ `✦` `✨` |
| ใช้ `LINE_CHANNEL_SECRET` เดิมกับ Messaging API | คนละ channel type จะพัง LINE Login ที่ใช้งานอยู่ |
| `await` ก่อนเปิดแท็บในปุ่มแชร์ LINE | เบราว์เซอร์บล็อกป็อปอัป — แพตเทิร์นนี้แก้มาแล้วใน `ShareModal.tsx:325` |
| ปล่อย `@` โดด ๆ ในแคปชันเมื่อยังไม่มีบัญชี | ผู้ใช้แชร์ออกไปแล้วดูไม่มืออาชีพ · `socialHandle()` คืนค่าว่างต้องตัดทั้งบรรทัด |
| เขียน `<img src="/cards/...">` เอง | กฎเหล็กข้อ 8 — ต้องผ่าน `<CardImage />` |
| ใส่ `cache:` ใน `actions/setup-node` | auto-detect pnpm แล้ว CI พังทั้งเรโป |
| `push` แล้วจบ | กฎเหล็กข้อ 13 — ไม่เปิด PR = ไม่มี CI ไม่มี deploy |

---

## 📊 วิธีวัดว่าได้ผลจริง (ตั้งเบสไลน์ก่อนเริ่ม)

เอกสารของทีมภายนอกไม่มีส่วนนี้เลย ซึ่งเป็นข้อบกพร่องที่ใหญ่ที่สุดของมัน — **บันทึกตัวเลขวันเริ่มงานลง [`docs/WORK_LOG.md`](../WORK_LOG.md) ก่อนแก้โค้ดบรรทัดแรก**

| งาน | ตัวชี้วัด | แหล่ง | อ่านผลเมื่อไร |
| :--- | :--- | :--- | :--- |
| A | impressions + ตำแหน่งเฉลี่ยของ query ที่มีคำว่า "ใช่หรือไม่" / "yes or no" | GSC → Performance → Query filter | +14 และ +28 วัน |
| A | จำนวนหน้า `/cards/*` ที่ถูก index | GSC → Pages | +28 วัน |
| B | ผู้ใช้ที่กลับมาจากแต่ละช่อง แยกด้วย `utm_source` (tiktok / facebook / instagram / line / threads / x) | GA4 → Traffic acquisition | +30 วัน |
| B | จำนวนครั้งที่กดปุ่มแชร์แยกรายช่อง (เทียบก่อน/หลังเพิ่ม LINE) | GA4 → event `share_click` (มีอยู่แล้ว) | +14 วัน |
| C | อัตราเปิดอีเมล · จำนวนคนกดยกเลิก · ผู้ใช้ที่กลับมาเปิดไพ่ภายใน 24 ชม. หลังได้ digest | Resend dashboard + `digest_log` | +30 วัน |

> เกณฑ์ที่ถือว่า "ล้มเหลว ให้ถอย": งาน C ถ้าอัตรายกเลิก > 5% ใน 30 วันแรก ให้ปิดฟีเจอร์แล้วทบทวนเนื้อหาอีเมลใหม่ อย่าดันต่อ
