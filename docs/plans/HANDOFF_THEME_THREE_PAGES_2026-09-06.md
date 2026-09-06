# ✦ แผนส่งต่องาน — รื้อดีไซน์ 3 หน้าให้กลับเข้าธีมเว็บ

> **ผู้จัดทำ**: Claude · 2026-09-06 · **ผู้รับช่วง**: ทีม/เอเจนต์ Frontend ตัวถัดไป
> **ที่มา**: เจ้าของโปรเจกต์รีวิว 3 หน้าที่สร้างใน PR #284–285 แล้วบอกว่า _"ไม่สวยเลยทั้งสามหน้า ไม่เข้ากับธีมที่เราทำมาเลย ไม่เหมือนที่เราทำมาก่อนหน้านี้ในเว็บเลย"_
> **โค้ดอ้างอิง**: `main` ที่ commit `17a4937` — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมาแทน
> **ขนาดงาน**: ~6–8 ชม. · **1 PR หลัก** (birth-card i18n อาจแยก PR 2 ถ้าบานปลาย) · แตะ 6 ไฟล์เดิม + สร้างใหม่ 3 ไฟล์
> **ประเภท**: ดีไซน์/มาร์กอัปล้วน — **ห้ามแตะ logic การสุ่มไพ่ · การบันทึกประวัติ · โครงสร้างข้อมูลไพ่**

---

## ⛔ อ่านก่อนแตะโค้ดบรรทัดแรก

| ลำดับ | เอกสาร | อ่านเพื่ออะไร |
| :-: | :--- | :--- |
| 1 | [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) | บทเรียนความผิดพลาด — โดยเฉพาะเรื่อง header sticky / overflow / will-change |
| 2 | [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) | บั๊กค้าง อย่าแก้ทับ |
| 3 | [`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md) | กฎเหล็ก 14 ข้อ — ข้อ 2 (อิโมจิ), 3 (Zero-Clipping), 4 (Manual Self-Reveal), 10 (Human-First), 14 (ห้ามกุไพ่) |
| 4 | [`docs/specs/DESIGN_SYSTEM_V2.md`](../specs/DESIGN_SYSTEM_V2.md) | พาเลตต์ 8 สี + ระบบชั้นพื้นผิว |
| 5 | `src/app/globals.css` | **แหล่งความจริงของโทเคนสีจริง** (`@theme` + คลาส `.altar-*`) |

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain ui \
  --files "src/app/daily/DailyClient.tsx,src/app/daily/page.tsx,src/app/love/1-card/LoveOneCardClient.tsx,src/app/love/1-card/page.tsx,src/components/encyclopedia/BirthCardCalculator.tsx,src/app/cards/birth-card/page.tsx" \
  --task "รื้อธีม 3 หน้า one-card + birth-card"
# ...แก้งาน...
npm run typecheck
npm run repo:verify                       # ต้องผ่านครบ 24 ด่าน
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run pr:auto -- "<title>" --body-file <path>
```

> 🚨 **`push` แล้วจบ = งานยังไม่เสร็จ** (กฎเหล็กข้อ 13) — ต้องเปิด PR ให้ CI 24 ด่าน → auto-merge → auto-deploy เสมอ

---

## 🎯 หน้าที่ต้องแก้ (3 หน้า)

| Route | ไฟล์ client | ไฟล์ page (SEO + JSON-LD) |
| :--- | :--- | :--- |
| `/daily` | `src/app/daily/DailyClient.tsx` (662 บรรทัด) | `src/app/daily/page.tsx` |
| `/love/1-card` | `src/app/love/1-card/LoveOneCardClient.tsx` (682 บรรทัด) | `src/app/love/1-card/page.tsx` |
| `/cards/birth-card` | `src/components/encyclopedia/BirthCardCalculator.tsx` (442 บรรทัด) | `src/app/cards/birth-card/page.tsx` |

> หน้า `layout.tsx` ของ `/daily` และ `/love` มีแค่ `<SiteHeader/> {children} <SiteFooter/>` — **ไม่ต้องแตะ**

---

## 🔍 ปัญหาที่วัดจากโค้ดจริง (ไม่ใช่ความเห็น)

### P1 — ไม่ใช้โทเคน/คลาสของระบบเลย ฮาร์ดโค้ด hex ทุกจุด + สร้างเฉดใหม่ที่ไม่มีในพาเลตต์

`globals.css` มี `@theme` tokens (`--color-canvas/surface/inset/line/ink/muted/gold` …) และคลาสสำเร็จ `.altar-panel` `.altar-cloth` `.altar-card-porcelain` `.altar-panel-active` — **3 หน้านี้ไม่แตะเลย**

เฉดที่ประดิษฐ์ขึ้นเองและ**ไม่มีในเว็บส่วนอื่นก่อนคลื่น SEO 2–4**:

| hex ที่หลุด | ใช้ใน 3 หน้านี้ | ควรเป็น |
| :--- | :-: | :--- |
| `#7A6F5D` | 6 ไฟล์ | `#635B4E` (muted — ใช้จริง 83 ไฟล์) |
| `#4A4338` | 5 ไฟล์ | `#635B4E` หรือ `#29261F` |
| `#5E5240` | 5 ไฟล์ | `#635B4E` |
| `#EAE7E0` เขียนเป็น utility ซ้ำกับคลาส | หลายจุด | ใช้คลาส `.altar-cloth` ที่ตั้ง bg ให้แล้ว |
| `#FAF8F5` | 3 ไฟล์ | `#FAF7F2` (wash ที่ระบบใช้ 30 ไฟล์) |

hex ที่ **ถือว่าถูก** อยู่แล้ว ไม่ต้องไล่แก้: `#29261F` (ink) · `#635B4E` (muted) · `#D5CEC2` / `#D9C8AC` (line — ทั้งคู่ใช้ในระบบ) · `#8F5C1A` (gold เข้ม สำหรับลิงก์/ป้าย) · `#A58A5C` (gold accent) · `#FAF7F2` / `#FBF8F3` (wash) · `#171512` (dark)

> ℹ️ เฉดที่หลุดชุดเดียวกันนี้โผล่ในหน้าพี่น้องคลื่น 2–4 ด้วย (`spreads/topic/[category]`, `SpreadDetailClient`, `TopicSpreadList`) — **งานนี้ขอโฟกัสแค่ 3 หน้าที่เจ้าของ flag ก่อน** ที่เหลือเปิด KNOWN_ISSUES ไว้

### P2 — เรเดียส / สเปซ / ไทโปเกินสเกลระบบ

| จุด | ตอนนี้ | มาตรฐานระบบ (ดู `QuickFortunePicker`, `/love` ฮีโร่, spread detail) |
| :--- | :--- | :--- |
| Panel หลัก | `rounded-3xl` + `p-6 sm:p-10/12` + `space-y-10` | `rounded-2xl` + `p-5 sm:p-8` + `space-y-8` |
| การ์ดย่อย | ปน `rounded-2xl` / `rounded-xl` | `rounded-xl` (การ์ด), `rounded-full` (pill/CTA) |
| H1 ฮีโร่ | `text-3xl sm:text-5xl` (daily, birth-card) | `text-2xl sm:text-4xl` |
| เนื้อความ | `font-serif-th` แทบทุก element รวมบอดี้ | หัวข้อ/ตัวเลข = `font-serif-th` · **บอดี้ = Sarabun (ดีฟอลต์)** เทียบ `StreamReader` |
| ปุ่ม CTA | `rounded-xl` (daily) | `rounded-full` |

### P3 — คำ/เสียงผิดคาแรกเตอร์ (ผิดกฎเหล็กข้อ 10 Human-First)

ป้าย mono อังกฤษยัดทั่วทั้ง 3 หน้า:

```
SACRED DAILY CHRONOMETER            STAGE I: CHOOSE YOUR ELEMENTAL CHAMBER
STAGE II: INTUITIVE CARD SELECTION  STAGE III: THE GRAND REVELATION
THE FIVE PILLARS OF DAILY ILLUMINATION   PILLAR I · CORE DAILY ENERGY
RECOMMENDED SACRED JOURNEYS         NATAL CHRONOMETER & NUMEROLOGY CODEX
SACRED ESSENCE & PSYCHOLOGICAL ARCHETYPES   RECOMMENDED TAROT EXPEDITIONS
THE PHILOSOPHY OF DAILY TAROT & SYNCHRONICITY
```

ระบบเดิมใช้คำไทยนุ่ม ๆ เป็น "เฟส" (`ปฐมบท / สงบจิต / สับไพ่ / เลือกไพ่ / เปิดเผย` — ดู `HomeSeoContent.tsx` `RITUAL_STEPS_TH`) หรือ badge ไทยสั้น ๆ · treatment `font-mono uppercase tracking-widest` แทบไม่ใช้ที่อื่น

**สิ่งที่ต้องทำ**: ลบป้าย mono อังกฤษทั้งหมด → แทนด้วยป้ายไทยสั้นสีทอง (`text-[11px] font-serif-th font-semibold text-[#8F5C1A]`) หรือตัดทิ้ง ถ้าไม่จำเป็น

### P4 — UI จับไพ่เป็นของปลอม ไม่ใช่คอมโพเนนต์ระบบ

`DailyClient.tsx` และ `LoveOneCardClient.tsx`:

- ขั้น "เลือกไพ่" = `Array.from({ length: 9 })` / `[0,1,2,3,4,5,6]` เรนเดอร์เป็น `<button>` เปล่า ลาย `card-back-pattern` + เลข `#N` — **แตะใบไหนก็ได้ผลเดียวกัน** (ไพ่ถูกสุ่มไปแล้วก่อนหน้า)
- ขั้น "สับไพ่" = `setTimeout(() => …, 1100)` + กล่อง `animate-pulse` เขียน `SHUFFLING`
- โชว์ `fairnessHash` เป็นสตริงที่ **hash ตัวเองแบบมั่ว** (`daily-${Date.now()}-${rand}-${card.id}` แล้ว hex-encode) ไม่ใช่ commit-reveal จริง — เข้าข่ายหลอกตา (ไม่ผิดกฎ 14 เพราะไม่ได้กุไพ่ แต่โชว์ "SHA-256 PROOF" ที่ไม่มีความหมาย)

ระบบมีของจริงที่หน้าแรกใช้อยู่:

| คอมโพเนนต์ | ไฟล์ | props |
| :--- | :--- | :--- |
| `ShuffleRitual` | `src/components/deck/ShuffleRitual.tsx` | `commitment`, `spreadName`, `onShuffleComplete(clientSeed)` — สับ 2.2s เก็บ entropy จากนิ้ว + progress bar rAF |
| `InteractiveCardFan` | `src/components/deck/InteractiveCardFan.tsx` | `totalCards?`, `pickedIndices`, `targetCount`, `onPickCard(fanIndex)`, `disabled?` — พัดไพ่ arc geometry + `motion` |
| `TarotCard` | `src/components/card/TarotCard.tsx` | `card`, `isRevealed`, `size`, `imageFull` — 3D flip scene |

ทั้งสองตัว lazy โหลดผ่าน `next/dynamic({ ssr:false })` (ดูวิธีใน `src/app/TarotFlow.tsx` บรรทัดต้น ๆ)

### P5 — ไม่มี `motion/react` เลย → ทรานซิชันระหว่างสเตปกระตุก

หน้าแรก/ผัง ใช้ `motion` + `stepVariants` + `SPRING` (`@/lib/motion`) ทั้งหมด · 3 หน้านี้ใช้แค่ Tailwind `animate-in fade-in` กับ CSS `animate-pulse`

### P6 — โครงหน้าไม่เป็นระบบเดียว พื้นหลังซ้อน 2 ชั้น

`daily/page.tsx` และ `love/1-card/page.tsx`:

```tsx
<DailyClient />                                    {/* มี min-h-screen + bg-[#F3F0EA] ในตัว */}
<div className="bg-[#F3F0EA] pb-16 px-4 sm:px-6">  {/* ← ก้อนพื้นหลังที่สอง */}
  <div className="max-w-4xl mx-auto">
    <article className="rounded-3xl border …">      {/* บทความ SEO */}
```

→ พื้นหลังทาสองรอบ + `min-h-screen` ดันบทความลงไปไกลจากริทวล · ส่วน `birth-card/page.tsx` ยัดทุกอย่างใน `<main>` เดียว = คนละทรงกับอีกสองหน้า

### P7 — `overflow` เสี่ยงผิดกฎเหล็กข้อ 3 (Zero-Clipping)

- `DailyClient.tsx` `<section aria-label="Altar card picking area" className="… overflow-hidden">` — มีไพ่อยู่ข้างใน
- ribbon ไพ่ปลอมใช้ `overflow-x-auto` — กฎข้อ 3 ห้าม `overflow-x-auto` ในแถวการ์ดย่อย (พอเปลี่ยนไปใช้ `InteractiveCardFan` ปัญหานี้หายเอง เพราะมันจัด arc ไม่ scroll)

### P8 — i18n ไม่ครบ

`/daily` + `/love/1-card` สองภาษา (มี `useLocale` / `isEnglish`) แต่ **`BirthCardCalculator.tsx` + `cards/birth-card/page.tsx` เป็นไทยล้วน** ทั้งที่ header มีปุ่มสลับ TH/EN ทุกหน้า

### P9 — เฉพาะ `/daily`: กริด 5 ห้องธาตุพัง

`grid grid-cols-1 sm:grid-cols-5` — บนแท็บเล็ตแต่ละปุ่มกว้าง ~90px ข้อความไทยตัดคำพัง (สกรีนช็อตเจ้าของ: _"การเงิน & โชค / ลาภ"_, _"ความรัก & / สัมพันธภาพ"_)

---

## 🏛️ หน้าอ้างอิงที่ "ถือว่าถูกธีม" — ลอกทรงจากตรงนี้

| ต้องการอะไร | ดูจาก |
| :--- | :--- |
| ฮีโร่ (breadcrumb + badge + h1 + tagline) | `LoveOneCardClient.tsx` บล็อก `{/* Hero Header */}` ปัจจุบัน — หลุดน้อยสุด ปรับนิดเดียว |
| การ์ดหัวข้อ (border/gradient/badge tokens) | `src/components/reading/QuickFortunePicker.tsx` — `QUICK_TOPICS[].themeColors` |
| เฟสพิธีกรรม + ชื่อขั้นภาษาไทย | `src/components/seo/HomeSeoContent.tsx` `RITUAL_STEPS_TH` |
| ริทวลสับ/เลือก/เปิดไพ่จริง | `src/app/TarotFlow.tsx` (วิธี lazy-load + ผูก `ShuffleRitual` → `InteractiveCardFan` → flip) |
| บทความ SEO + FAQ + internal links | `SpreadDetailClient.tsx` (โครง how-to / faq) |
| การ์ดผลลัพธ์เนื้อ Sarabun | `src/components/reading/StreamReader.tsx` |

---

## 📐 แผนลงมือ (เป็นเฟส)

### เฟส 1 — สร้าง primitive ที่ใช้ร่วม (กันหลุดธีมซ้ำในอนาคต)

`/daily` กับ `/love/1-card` โครงเดียวกัน ~90% (state `idle→shuffling→picking→ready→revealed`, handler เดียวกัน, hash ปลอมเหมือนกัน)

**สร้าง `src/components/reading/one-card/OneCardRitual.tsx`**

```tsx
interface OneCardRitualProps {
  spreadId: string;                 // "daily-one" | "love-one"
  spreadName: string;               // ตาม isEnglish
  /** ป้ายบริบทบนหลังไพ่ตอน idle เช่น "พลังงานวันนี้" หรือ "ดวงใจ: คนโสด" */
  deckLabel: string;
  /** คำถาม/เจตจำนงที่ผู้ใช้กรอก (ไปลง saveReading + commitment ของ ShuffleRitual) */
  intention: string;
  /** callback ตอนเปิดไพ่เสร็จ — ให้ page เป็นคนเรียก saveReading เอง (รู้ category/persona) */
  onRevealed: (card: TarotCardType) => void;
  /** เนื้อหาคำทำนายหลังเปิดไพ่ — page ส่ง JSX เข้ามา (5 มิติ / ตามสถานะรัก / ฯลฯ) */
  renderReading: (card: TarotCardType) => React.ReactNode;
  /** การ์ดแนะนำท้ายหน้า */
  recommendations: React.ReactNode;
  onReset: () => void;
}
```

ข้างใน:
1. `idle` → `.altar-cloth` + `<TarotCard size="lg" isRevealed={false} isHighlighted positionLabel={deckLabel} />` + ปุ่ม CTA `rounded-full bg-[#29261F] hover:bg-[#A58A5C]`
2. `shuffling` → `<ShuffleRitual commitment={intention || spreadName} spreadName={spreadName} onShuffleComplete={handleSeed} />`
   - ใน `handleSeed(clientSeed)`: สุ่มไพ่ด้วย `window.crypto` (คงตรรกะเดิมจาก `handleStartDraw`) — **ห้าม fallback กุไพ่ ถ้า `DECK` ว่างให้ throw / คืน error “โหลดใหม่อีกครั้ง”** (กฎ 14)
3. `picking` → `<InteractiveCardFan totalCards={78} pickedIndices={[]} targetCount={1} onPickCard={() => setStatus("ready")} />`
4. `ready` → `<TarotCard isRevealed={false} onClick={reveal} positionLabel="แตะเพื่อพลิกไพ่" />`
5. `revealed` → `<TarotCard isRevealed card={card} imageFull />` + `renderReading(card)` + แถบปุ่ม (แชร์/เปิดใหม่) + `recommendations`

ใช้ `motion` + `AnimatePresence` ครอบการสลับ status ด้วย `stepVariants` จาก `@/lib/motion`

**สร้าง `src/components/reading/one-card/RitualHero.tsx`** — ฮีโร่มาตรฐาน รับ `breadcrumb`, `badgeText`, `title`, `tagline` · ยกคลาสจากฮีโร่ `/love` ปัจจุบัน (h1 = `text-2xl sm:text-4xl font-serif-th font-bold text-[#29261F]`)

**สร้าง `src/components/seo/SeoArticleShell.tsx`** — เปลือกบทความ + FAQ + internal links (3 หน้าเขียนซ้ำ pattern เดียวกัน)

```tsx
interface SeoArticleShellProps {
  eyebrow: string;                  // ไทยสั้น ๆ ไม่ใช่ mono อังกฤษ
  title: string;
  children: React.ReactNode;        // <p>/<h3>/<ul> เนื้อบทความ — บอดี้ Sarabun
  faqs: { q: string; a: string }[];
  links: { href: string; label: string }[];
}
```

- `<section className="altar-panel rounded-2xl p-5 sm:p-8 space-y-6">` (ไม่ใช่ `rounded-3xl`)
- เนื้อความ: `text-sm text-[#29261F] leading-relaxed space-y-4` (Sarabun) · หัวข้อย่อย `font-serif-th font-bold`
- FAQ: `divide-y divide-[#D5CEC2]`

### เฟส 2 — `/daily`

**`DailyClient.tsx`**
- ตัด `min-h-screen`, `overflow-x-clip`, `bg-[#F3F0EA]` ที่ root — ให้ page คุมพื้นหลัง · ตัด `overflow-hidden` ที่ `<section>`
- ฮีโร่ → `<RitualHero>` · badge = `วันอาทิตย์ที่ 6 กันยายน 2569` (คง `Intl.DateTimeFormat` เดิม) ลบ `SACRED DAILY CHRONOMETER`
- 5 ห้องธาตุ → การ์ดเลื่อนแนวนอนบนมือถือ / กริด `sm:grid-cols-2 lg:grid-cols-3` (ไม่ใช่ `sm:grid-cols-5`) · สไตล์การ์ดยืม `QuickFortunePicker` (`themeColors` ต่อธาตุ: ไฟ→work, ดิน→money, น้ำ→love, ลม→general, ภาพรวม→general) · เอา label `chamber.elementTh.split(" ")[0]` ที่ครึ่ง ๆ กลาง ๆ ออก
- ช่องกรอกเจตจำนง → คงไว้ ใช้ `bg-[#FAF7F2] border-[#D5CEC2] focus:ring-[#A58A5C]`
- ลบบล็อก `status === "shuffling" | "picking" | "ready"` ที่เขียนเอง → ส่ง `intention` + config เข้า `<OneCardRitual>`
- ผลลัพธ์ 5 มิติ: **เก็บเนื้อหา `drawnCard.meanings.*.upright` ทั้งหมด** เปลี่ยนแค่เปลือก:
  - `PILLAR I · CORE DAILY ENERGY` → `พลังงานหลักวันนี้`
  - `PILLAR II · CAREER & PURPOSE` → `การงาน`
  - `PILLAR III · WEALTH & ABUNDANCE` → `การเงิน`
  - `PILLAR IV · HEART & BOND` → `ความรัก`
  - `PILLAR V · MINDFUL REFLECTION` → `ข้อคิดเตือนใจ`
  - การ์ด `.altar-card-porcelain rounded-xl p-5` · หัวข้อ `font-serif-th` · เนื้อ Sarabun `text-sm`
- การ์ดแนะนำ → tokens ตรง `QuickFortunePicker` เป๊ะ (ลบ `RECOMMENDED SACRED JOURNEYS`)

**`daily/page.tsx`**
- คง `<link rel="preload">` + JSON-LD 3 ก้อน (ห้ามแตะ)
- ลบ `<div className="bg-[#F3F0EA] pb-16">` ก้อนที่สอง → ห่อทั้งหน้าด้วย `<main className="bg-[#F3F0EA] …">` ก้อนเดียว: `<DailyClient />` แล้วต่อด้วย `<SeoArticleShell …>` (เนื้อหาบทความเดิมย้ายมาเป็น children)
- eyebrow `THE PHILOSOPHY OF DAILY TAROT & SYNCHRONICITY` → `ทำความเข้าใจไพ่ยิปซีรายวัน`

### เฟส 3 — `/love/1-card`

**`LoveOneCardClient.tsx`** (ใกล้เคียงระบบสุดแล้ว)
- ฮีโร่ → `<RitualHero>` (badge คงข้อความ `เปิดไพ่ทาโรต์ความรักฟรี · สำรับ 1909 แท้ 78 ใบ`)
- ลบบล็อก shuffling/picking/ready เขียนเอง → `<OneCardRitual>` ส่ง `deckLabel={`ดวงใจ: ${currentStatusObj?.titleTh}`}`
- radio 4 สถานะ: ลบวงกลม custom (`<span className="w-3.5 h-3.5 rounded-full border …">`) → ใช้แค่ border + bg เปลี่ยนตอน selected เหมือน `QuickFortunePicker`
- **คงฟังก์ชัน `getContextualLoveAdvice` ทั้งก้อน** (จุดแข็ง) — ย้ายไปเป็นส่วนหนึ่งของ `renderReading`
- กวาด hex: `#7A6F5D → #635B4E`, `#D9C8AC` เก็บได้, `#FAF8F5 → #FAF7F2`
- ป้าย `Step 1/2/3` อังกฤษ uppercase → `ขั้นที่ 1 …` (มีไทยอยู่แล้วบางจุด ทำให้ครบ)

**`love/1-card/page.tsx`** — เหมือนเฟส 2: รวมพื้นหลังชั้นเดียว + `<SeoArticleShell>` · eyebrow `THE PSYCHOLOGY OF TAROT IN LOVE & RELATIONSHIPS` → `ทำความเข้าใจการดูดวงความรัก 1 ใบ`

### เฟส 4 — `/cards/birth-card`

**`BirthCardCalculator.tsx`**
- เพิ่ม `const { isEnglish } = useLocale();` + แปลสตริงทั้งหมดเป็น bilingual (ตาม pattern `isEnglish ? "…" : "…"`) — ถ้าใหญ่เกิน แยกเป็น PR 2 แต่ **ต้องทำภาพก่อนใน PR นี้**
- `rounded-3xl → rounded-2xl` · `p-6 sm:p-10/12 → p-5 sm:p-8` · `space-y-10 → space-y-8`
- `NATAL CHRONOMETER & NUMEROLOGY CODEX` → `เลขศาสตร์ไพ่ทาโรต์` · `SACRED ESSENCE & PSYCHOLOGICAL ARCHETYPES` → ลบ
- ฟอร์ม `<select>/<input>`: `bg-[#FAF8F5] → bg-[#FAF7F2]` · `focus:ring-[#8F5C1A] → focus:ring-[#A58A5C]` · `rounded-2xl → rounded-xl`
- ปุ่ม submit `rounded-2xl → rounded-full`
- การ์ดผลคู่ (Personality / Soul): ใช้ `.altar-card-porcelain` · เนื้อ `numerology` เป็น Sarabun `text-sm`
- แท็กร่องรอยเลขศาสตร์ (`ผลรวมเลขศาสตร์: … → ไพ่หมายเลข …`) — **เก็บไว้** (โปร่งใสดี) แค่ปรับเป็น `bg-[#FAF7F2] border-[#D5CEC2]`
- การ์ดแนะนำ → tokens `QuickFortunePicker`

**`cards/birth-card/page.tsx`**
- เพิ่ม i18n (หรือ PR 2) · h1 `text-3xl sm:text-5xl → text-2xl sm:text-4xl`
- โครง `<main>` → `<BirthCardCalculator/>` → `<SeoArticleShell>` (บทความ + FAQ เดิมย้ายมา) · `rounded-3xl → rounded-2xl`, `p-6 sm:p-12 → p-5 sm:p-8`
- คง JSON-LD 3 ก้อน (WebApplication / Breadcrumb / FAQ)

### เฟส 5 — QA

```bash
npm run typecheck
npm run repo:verify        # 24 ด่าน: emoji-guard, test-will-change, zero-clipping, i18n-parity ฯลฯ
npm run dev                # เช็กด้วยตา
```

เช็กด้วยตา (มือถือ 390px + เดสก์ท็อป + สลับ EN):
- [ ] `/daily` `/love/1-card` `/cards/birth-card` — ฮีโร่/พาเนล/การ์ด โทนเดียวกับ `/` และ `/spreads/celtic-cross`
- [ ] ไพ่เริ่มต้น**คว่ำหน้า** ผู้ใช้แตะพลิกเอง (กฎ 4)
- [ ] ริทวลสับใช้ `ShuffleRitual` จริง · เลือกไพ่ใช้ `InteractiveCardFan` จริง
- [ ] ไม่มี `overflow-hidden` / `overflow-x-auto` ในบล็อกที่มีไพ่ (กฎ 3)
- [ ] ไม่มีอิโมจิการ์ตูน มีแค่ `✦` `✨` ถ้าจำเป็น (กฎ 2)
- [ ] ไม่มีป้าย mono อังกฤษ `STAGE / PILLAR / CHRONOMETER / CODEX` หลงเหลือ
- [ ] birth-card สลับ EN แล้วไม่มีไทยค้าง (ถ้าทำ i18n ใน PR นี้)
- [ ] เนื้อคำทำนาย/บทความเป็น Sarabun ไม่ใช่ serif หนา
- [ ] header sticky ไม่เด้ง, ไม่มี long task ตอนสับไพ่ (เทียบ `/`)
- [ ] `saveReading` ยังบันทึกลงสมุดดูดวงได้ครบ (spreadId / cards / summary)

### เฟส 6 — ปิดงาน

1. `docs/WORK_LOG.md` — บันทึกงาน + ผลลัพธ์
2. ถ้าเลื่อน birth-card i18n เป็น PR 2 → เปิด `KNOWN_ISSUES.md` ไว้
3. `npm run agent:unlock`
4. `npm run pr:auto -- "feat(ui): รื้อดีไซน์ 3 หน้า one-card + birth-card ให้กลับเข้าธีม Editorial Quiet Luxury" --body-file <path>`
5. รอ CI 24 ด่าน → auto-merge → auto-deploy

---

## 🚫 ห้ามทำ

- ห้ามแตะ logic สุ่มไพ่ (`window.crypto.getRandomValues` + `% DECK.length`) — แค่ย้ายที่อยู่
- ห้ามเขียน fallback กุไพ่เมื่อ `DECK`/ข้อมูลไพ่หาย — ต้อง throw หรือคืน error "โหลดใหม่อีกครั้ง" (กฎ 14)
- ห้ามแตะ `saveReading` schema / `src/data/cards/**` / `public/cards/**`
- ห้ามแตะ JSON-LD ใน `page.tsx` (คง SEO)
- ห้ามแก้เฉดที่หลุดในหน้าพี่น้องคลื่น 2–4 ที่ไม่ได้อยู่ใน 3 หน้านี้ (คนละงาน)
- ห้ามใส่ `will-change` ถาวร / `overflow-x: hidden` ที่ `body` (INC-0060 / INC-0067)
- ห้าม `push` เฉย ๆ แล้วจบ — ต้องเปิด PR (กฎ 13)

---

## 📁 สรุปไฟล์

| ไฟล์ | งาน |
| :--- | :--- |
| `src/components/reading/one-card/OneCardRitual.tsx` | **สร้างใหม่** — ริทวล 1 ใบร่วม (daily + love) |
| `src/components/reading/one-card/RitualHero.tsx` | **สร้างใหม่** |
| `src/components/seo/SeoArticleShell.tsx` | **สร้างใหม่** — เปลือกบทความ + FAQ + links |
| `src/app/daily/DailyClient.tsx` | รื้อใหญ่ |
| `src/app/daily/page.tsx` | รวมพื้นหลัง + SeoArticleShell |
| `src/app/love/1-card/LoveOneCardClient.tsx` | รื้อกลาง (คง `getContextualLoveAdvice`) |
| `src/app/love/1-card/page.tsx` | รวมพื้นหลัง + SeoArticleShell |
| `src/components/encyclopedia/BirthCardCalculator.tsx` | รื้อกลาง + i18n |
| `src/app/cards/birth-card/page.tsx` | รวมพื้นหลัง + SeoArticleShell + i18n |
