# 🎯 แผนยกเครื่อง UX · ความไว · ความสมูท — 2026-09-01

> สแกนโดย 3 เอเจนต์ขนาน: **Runtime perf** (profile บน dev server จริง) · **UX/interaction** (Web Interface Guidelines) · **Motion/animation**
> ฐานโค้ด `origin/main` @ `8ac58b0` · รายงานดิบเต็มที่ `scratchpad/uxperf-{runtime,ux,motion}.md`
> **handoff ให้ Gemini** — จัดเป็น "งานฐานราก" (ทำก่อน แก้ทีเดียวได้หลายสิบจุด) แล้วตามด้วย P0–P3
> เกี่ยวเนื่องกับ `docs/AUDIT_2026-09-01.md` (perf bundle-size + security) — ข้อที่ทับกันจะอ้างอิงไม่เขียนซ้ำ

**ตัวเลข:** runtime 17 findings (1 crit) · UX 78 findings (21 high, 34 a11y) · motion ~70 findings (3 บั๊กตรง ๆ)

---

## 🧱 งานฐานราก (FOUNDATION) — ทำ 5 อย่างนี้ก่อน แก้ปัญหาปลายทางเป็นสิบ

### FDN-1 · `<MotionConfig reducedMotion="user">` ครอบทั้งแอป — **payoff สูงสุด, effort S**
- **ไฟล์:** `src/app/layout.tsx` (body)
- **ตอนนี้:** `globals.css:136-144` กด CSS animation ได้ แต่ **Framer Motion ทุกตัว (JS-driven transform) ไม่สนใจ `prefers-reduced-motion` เลย** — card flip, fan, shuffle, modal, step transition, `whileHover/whileTap`, badge pulse ยังวิ่งเต็มแรง
- **แก้:**
  ```tsx
  import { MotionConfig } from "motion/react";
  <body>
    <MotionConfig reducedMotion="user" transition={{ duration: 0.24, ease: [0.4,0,0.2,1] }}>
      <AntiTheftShield /><AssetWarmup />{children}
    </MotionConfig>
  </body>
  ```
- ปิดจ็อบ: runtime F6 · ux "prefers-reduced-motion (high)" · motion §6 — flagged โดยทั้ง 3 เอเจนต์

### FDN-2 · Motion token system — `globals.css` vars + `src/lib/motion.ts` ใหม่
- **ตอนนี้:** ทุก component ประดิษฐ์ duration เอง (0.18/0.2/0.22/0.25/0.35/0.4/0.7s), easing เอง, spring hand-tune 5 แบบ, ครึ่งหนึ่งไม่มี duration/easing เลย
- **สร้าง `src/app/globals.css`** (ใน `@theme`):
  ```css
  --dur-instant: 80ms;  --dur-fast: 140ms;  --dur-base: 240ms;
  --dur-slow: 420ms;    --dur-page: 360ms;  --dur-ritual: 520ms;
  --ease-standard: cubic-bezier(0.4,0,0.2,1);
  --ease-out:      cubic-bezier(0.22,1,0.36,1);
  --ease-in:       cubic-bezier(0.4,0,1,1);
  --ease-emphasis: cubic-bezier(0.2,0,0,1);
  ```
- **สร้าง `src/lib/motion.ts`** (spec เต็มใน `scratchpad/uxperf-motion.md` §9):
  - `DUR`, `EASE`, `SPRING` (4 ตัว: `card {260,30,m.9}` · `modal {300,30}` · `snappy {420,32}` · `follow {280,26}` — ลบ spring hand-tune ทั้งหมด)
  - `TWEEN` presets, `STAGGER` (`tight .03 / base .05 / loose .08 / fanStep .012`)
  - variants: `fadeUp`, `staggerContainer()`, `stepVariants` (directional), `useMotionSafe()` hook
- **แล้ว migrate** ~20 ไฟล์มาใช้ token (cheat-sheet ใน motion §9) — effort L แต่ mechanical ทำเป็น PR สุดท้าย

### FDN-3 · แก้/ลบ CSS class ที่อ้างอิงแต่ไม่มีอยู่จริง — **บั๊ก, effort S**
- **ไฟล์:** `src/app/page.tsx`, `src/components/reading/StreamReader.tsx`
- **`anim-page-transition`, `anim-tarot-idle`, `gpu-layer`** — ถูกอ้างใน className แต่ **ไม่มีใน CSS ไฟล์ไหนเลย และไม่อยู่ใน built CSS** → step transition ทุกครั้ง + "floating deck" ขั้น 1 = hard cut เงียบ ๆ
- **แก้:** นิยาม 3 class นี้ใน `globals.css` (โค้ดพร้อมใช้ใน motion §9) **หรือ** ลบ className ทิ้งแล้วทำ transition จริงผ่าน `AnimatePresence` (ดู P1-M1)

### FDN-4 · Shared `<Modal>` primitive — แก้ทีเดียว fix ~15 findings
- **ตอนนี้:** 7 modal (`CardZoomModal`, `TarotEncyclopediaModal`, `ReadingHistoryModal`, `ShareModal`, `JournalModal`, `JournalHistoryDrawer`, + nested encyclopedia) — **ไม่มีตัวไหน**: trap focus, ย้าย focus เข้า dialog, คืน focus ตอนปิด, ปิดด้วย `Esc`, `role="dialog"` + `aria-modal`, lock body scroll, `overscroll-behavior:contain`
- **บั๊ก motion:** `if(!isOpen) return null` อยู่**เหนือ** `<AnimatePresence>` → exit animation ตายหมด, ปิด = pop ทันที; scrim ไม่ fade; spring config ต่างกัน 5 แบบ
- **สร้าง `src/components/ui/Modal.tsx`:** headless dialog เดียว (focus-trap hook หรือ Radix/React-Aria) + `AnimatePresence` ที่ถูกต้อง (`isOpen &&` อยู่**ใน** AP, motion children มี key) + scrim fade 200ms + `SPRING.modal` + `Esc` + focus return + scroll lock + reduced-motion → opacity เท่านั้น
- refactor ทั้ง 7 ให้ผ่าน shell นี้
- ปิดจ็อบ: motion §2g/§5 · ux §4 "modal infrastructure (high)" ทั้งบล็อก

### FDN-5 · Shared `<Button>` + `.focus-visible` utility — fix button drift + a11y ทั้งไซต์
- **ตอนนี้:** gold primary button = class string ~15 ตัว copy-paste 20+ ที่ padding/radius/shadow เพี้ยนกันหมด; gradient 2 ทิศทาง; **แทบไม่มี element ไหนมี `:focus-visible` style**
- **สร้าง `src/components/ui/Button.tsx`** `variant="gold|ghost|pill" size` + `.btn-gold` class เดียวใน `globals.css`
- **เพิ่ม utility:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd700] focus-visible:ring-offset-2 focus-visible:ring-offset-[#05040a]` ใช้ทุกที่
- เพิ่ม `active:scale-[0.97] transition-transform duration-[var(--dur-fast)]` เป็นมาตรฐาน + `touch-action:manipulation` (กัน 300ms tap delay มือถือ)
- ปิดจ็อบ: ux §8 "no button component (high)" · §2 "focus states (high)" · motion §8 "buttons press feedback"

---

## 🔴 P0 — CRITICAL (ทำทันที)

### P0-1 · Card-fan "จับไพ่" — long task 127–143ms ต่อการแตะ 1 ครั้ง (มือถือ ~350–600ms INP)
- **ไฟล์:** `src/components/deck/InteractiveCardFan.tsx:118-190` · state `hoveredIdx:27`
- **วัดได้:** long-task 127/137/143ms 3 ครั้งติด (M-series desktop, JS ล้วน) · `getBoundingClientRect()` ×78 = 28.9ms
- **3 สาเหตุซ้อนกัน:**
  1. `layout` prop บนการ์ด 78 ใบ → Framer ทำ FLIP measure sync (อ่าน rect ทุกใบ → เขียน transform) ทุกครั้งที่ subtree เปลี่ยน **รวมถึง hover**
  2. `hoveredIdx` อยู่ที่ root + ไม่มีการ์ดไหน `React.memo` → hover 1 ครั้ง re-render ทั้ง 78
  3. `<AnimatePresence>` ห่อ **ต่อใบ** (`:140`) แทนที่จะห่อรอบ list เดียว → 78 presence controller
- **แก้ (effort M):**
  - แยก `const FanCard = React.memo(...)` key ด้วย `cardIdx`, ส่ง `isHovered`/`isPicked` เป็น boolean → hover re-render แค่ 2 ใบ
  - ย้าย hover ไป CSS ล้วน (`.group:hover`) — ลบ `hoveredIdx` state ทิ้ง
  - **ลบ `layout` prop** — ถ้าอยากได้ effect "ไพ่เลื่อนมาแทน" ให้ animate แค่ `exit` ของใบที่เลือก + CSS `transition: transform` ที่แถว
  - `<AnimatePresence>` เดียวรอบ `tierCards.map`
- ทับกับ motion §2c (fan geometry ก็ควรแก้ไปด้วย — ดู P1-M4)

### (P0 อื่น ๆ ที่เป็น dead-end — อยู่ใน AUDIT_2026-09-01.md แล้ว, ย้ำเพราะเป็น UX ล้วน)
- **stream ขั้น 5 หลุด → UI ค้าง ไม่มีปุ่มลองใหม่** = `AUDIT_2026-09-01` P1-4 · `page.tsx:353` เพิ่ม `setErrorMsg()` ใน catch → banner Retry ที่มีอยู่แล้วจะโผล่ (effort S)
- **pick ผิดพลาด → card fan ค้างตลอดกาล** = `AUDIT_2026-09-01` P2-5 · `page.tsx:185` roll back index สุดท้าย (`setPickedIndices(p => p.slice(0,-1))`) + inline retry (effort M)

---

## 🟠 P1 — HIGH

### กลุ่ม Perf runtime

| # | ไฟล์:บรรทัด | อาการ (วัดได้) | แก้ | effort |
|---|---|---|---|---|
| P1-P1 | `src/lib/utils/cache.ts:10-46` · `AssetWarmup.tsx` · `layout.tsx:119` | preload JPEG **เต็มความละเอียด 9 ไฟล์** ~2.9MB net / ~42MB decoded (waterfall ยืนยัน) แทนที่จะใช้ WebP variant `w128/w256/w512` — ผิด Golden Rule 8 หน้าแรกโชว์ที่ 24–64px | **ลบ `warmupTarotAssets` ทิ้ง** (fan/board lazy-load เองอยู่แล้ว) หรือถ้าเก็บ → ชี้ `/cards/w256/*.webp` + เลิก `img.decode()` | S |
| P1-P2 | `CardsExplorer.tsx:150` · `SpreadCardSelector.tsx:208` | `key={filter+query}` ใต้ `<AnimatePresence mode="wait">` → grid 78 ใบ unmount+remount **ทุกตัวอักษรที่พิมพ์** → รูป re-decode, relayout ทั้ง grid, search รู้สึกพัง | เอา `searchQuery` ออกจาก `key` ให้ React reconcile ด้วย `card.id`; `useDeferredValue` debounce; transition เฉพาะตอน `activeFilter` เปลี่ยน | S |
| P1-P3 | `TarotEncyclopediaModal.tsx:123` | mount **78 `<TarotCard>` 3D rig เต็ม** (312 idle springs + 78 mousemove handler) เพื่อโชว์ thumbnail นิ่ง ๆ ไม่มี virtualization | grid ใช้ `<CardImage>` ธรรมดาใน wrapper `rotate-180`-ได้; เก็บ `<TarotCard>` ไว้แค่ layer รายละเอียด; `content-visibility:auto; contain-intrinsic-size:0 140px` | M |
| P1-P4 | `page.tsx:70-72` → `IntentionAltarInput.tsx:140,158,202` | `question`/`nickname`/`situation` เป็น root state → ทุก keystroke re-render ทั้งแอป (5 persona card + 4 seal card + 5 modal wrapper) ไม่มีอะไร memo → est. 60–180ms INP ต่อ keystroke | ย้าย 3 ค่านี้เป็น **local state ใน `IntentionAltarInput`** lift ขึ้น parent แค่ตอน `onBlur`/กดปุ่ม; หรือ `React.memo` ลูกทั้งหมด + `useDeferredValue` | M |
| P1-P5 | `TarotCard.tsx:254` + 8 จุด (`InteractiveCardFan:205`, `StreamReader:100,228`, `IntentionAltarInput:110,255`, `CardsExplorer:173`, `page.tsx:400`) | runtime `filter: contrast(1.08) saturate(1.08) brightness(1.03)` บนทุก card `<img>` ที่อยู่ใน `rotateY()` 3D → re-raster **ทุกเฟรมของ flip** + ต้นเหตุ INC-0016 (Chrome vs Safari ไม่คม) | bake contrast/saturate/brightness เข้า **WebP variant ตอน generate** (`scripts/generate-card-variants.ts` — sharp `.modulate()/.linear()`) แล้วลบ class `filter` ออกหมด → source เดียว, 0 runtime cost, เท่ากันทุก browser | M |

### กลุ่ม Motion — signature moments (เกรดปัจจุบัน)

| # | moment | เกรด | ปัญหา | แก้ | effort |
|---|---|---|---|---|---|
| P1-M1 | Step-to-step transition | **F** | ไม่มี `AnimatePresence`/`motion` เลย + class `anim-page-transition` ไม่มีจริง → hard cut; ทุกขั้นเหมือนกันหมด ไม่มีทิศทาง | wrap step switch ใน `<AnimatePresence mode="wait" custom={direction}>` key ด้วย `currentStep` + `stepVariants` (forward = slide left, back = slide right; `RitualStepProgress` รู้ passed/active อยู่แล้ว); scroll reset ย้ายไป `onExitComplete` ครั้งเดียว | M |
| P1-M2 | 3D card flip (self-reveal) | **D** | `style={{rotateY: isRevealed?180:mv}}` **ทับ** `animate={{rotateY}}` → spring ไม่เคยทำงาน มัน snap 0→180; perspective ขัดกัน 4 ค่า (1200/1400/1600/1800); backface 2 กลไกตีกัน (opacity crossfade + `backface-visibility`) | perspective เดียว `--card-perspective:1400px` บน `.card-scene` ลบ inline ทั้งหมด; flip ขับจากค่าเดียว `animate={{rotateY}}` + `SPRING.card`; parallax ย้ายไป child wrapper (±8°) ไม่ชนแกน flip; เพิ่ม mid-flip lift (`z:[0,60,0] scale:[1,1.06,1]`); backface ใช้ `backface-visibility:hidden` อย่างเดียว; reduced-motion → opacity crossfade 120ms | M |
| P1-M3 | AI reading stream-in | **C−** | ไม่มี per-word/line animation — เปลี่ยนทั้ง paragraph ต่อ SSE chunk → layout กระโดดใต้สายตาคนอ่าน; active-card panel ใช้ dead class | สะสม text แล้ว render ทีละคำ (`<motion.span>` fade 180ms, track `revealedCount` ให้เฉพาะคำใหม่ animate); `<p>` มี `min-height` หรือ `layout` container ให้โตนุ่ม; card event merge fields ไม่ใช่ replace+resort; reduced-motion → โชว์ทั้งก้อนทันที | M |
| P1-M4 | Card fan spread | **C** | `%9` sawtooth rotation ไม่ใช่ arc; ไม่มี entrance stagger (78 ใบ blink พร้อมกัน); `whileHover` ตีกับ `animate` hover branch | arc จริง `rotate = (i - (len-1)/2) * 2.2°` ต่อเนื่อง + `y = |offset|² * k` ให้ปลายทั้ง 2 ข้างตก; entrance cascade `delay: i*0.012` จากกลางออก (cap ~900ms); ลบ `layout` + `whileHover` (เหลือ `animate` branch เดียว) | M (รวมกับ P0-1) |
| P1-M5 | Shuffle ritual | **C+** | cascade card วน infinite 0.25s linear = ดูเหมือน glitch; progress bar step 2% ทีละ jump (`setInterval` + inline `width`); entropy-gathering มองไม่เห็น | progress → `useMotionValue` + `animate(mv,100,{duration:2.4})` render `scaleX`; cascade → 6–8 ใบ staggered keyframe ครั้งเดียวต่อ phase ไม่วน; entropy feedback → gold particle + counter "% พลังงานสะสม" ตอน pointermove; ใช้ rAF แทน `setInterval` | M |

### กลุ่ม UX — navigation & a11y (high)

| # | ไฟล์:บรรทัด | อาการ | แก้ | effort |
|---|---|---|---|---|
| P1-U1 | `page.tsx:586-609` | ขั้น SHUFFLE + PICK **ไม่มีปุ่มย้อนกลับเลย** ทางออกเดียวคือ "เริ่มดูดวงใหม่" ที่ล้าง spread/persona/คำถาม/ชื่อเล่น/ไพ่ที่เลือกทั้งหมด | เพิ่ม "← ย้อนกลับ" บน SHUFFLE (→ INTENTION เก็บ input) และ PICK (→ SHUFFLE เคลียร์แค่ `pickedIndices`/`drawnCards`) | M |
| P1-U2 | `page.tsx:367-377,391` | `handleReset` (destructive) ผูกกับ 4 trigger รวมถึง `<div onClick>` โลโก้แบรนด์ ไม่มี confirm; โลโก้ไม่ focusable ไม่มี role/aria-label | โลโก้ → `<Link href="/">`; `handleReset` → `window.confirm` เมื่อ `currentStep !== "SPREAD_SELECT"` และยังไม่เซฟ | S |
| P1-U3 | `RitualStepProgress.tsx:55-63` | stepper คลิกได้จริงแค่ระหว่างขั้น 1↔2 แต่ node ที่ผ่านแล้วทุกขั้น**หน้าตาเหมือนกดได้** (gold ✓, hover-scale); เป็น `<div onClick>` ไม่มี `role`/`tabIndex`/keyboard/`aria-current` | ทำ "ย้อนไปขั้นก่อนที่ยัง valid" ให้ใช้ได้จริง **หรือ** ตัด affordance (`cursor-default` ไม่มี hover); render `<ol>/<li>`, active = `aria-current="step"`, node ที่กดได้ = `<button>` | M |
| P1-U4 | `page.tsx:57-91` | state ทั้ง flow เป็น `useState` ไม่ persist ไม่สะท้อน URL → refresh / back / tab crash กลางทาง = กลับขั้น 1 ทั้งที่ server session อยู่ 60 นาที | persist `{currentStep, readingId, sessionToken, selections, pickedIndices, drawnCards}` ลง `sessionStorage`; rehydrate ตอน mount; "กลับไปที่คำทำนายค้างไว้" | L |
| P1-U5 | `SpreadsLibrary.tsx:183` | ปุ่ม "เริ่มดูดวงด้วยผังนี้" 20 อัน link ไป `/?spread=${id}` แต่ `page.tsx` ไม่เคยอ่าน `searchParams` → ผู้ใช้ได้ผัง 3 ใบ default เสมอ | อ่าน `?spread=` ตอน mount → `setSelectedSpread` | S |
| P1-U6 | `InteractiveCardFan.tsx:140-183` · `SpreadBoard.tsx:101` · `PersonaCardSelector.tsx:104` · `SpreadCardSelector.tsx:224` | การ์ด fan 78 ใบ / board / persona / spread เป็น `motion.div onClick` — **คีย์บอร์ดใช้ไม่ได้เลย = ผู้ใช้คีย์บอร์ด/switch ดูดวงไม่ได้** | ทำเป็น `<button>` จริง + roving tabindex + arrow keys + `aria-label`; อย่างน้อยมีปุ่ม "สุ่มเลือกให้ฉัน" fallback | L |
| P1-U7 | `StreamReader.tsx:190-349` · `page.tsx:451` | streaming reading + error banner ไม่มี `aria-live` → screen reader ไม่รู้ว่าคำทำนายมาถึง/จบ; error เป็น `<div>` เปล่าไม่มี `role="alert"` | ห่อ active-card body + summary ด้วย `aria-live="polite"`; error banner `role="alert" aria-live="assertive"` | S |
| P1-U8 | `IntentionAltarInput.tsx:96,137-150,207` | `<label>` ไม่ผูกกับ input (ไม่มี `htmlFor`/`id`); validation แดง **ตั้งแต่ render แรก** ก่อนผู้ใช้แตะ → ฟอร์มดู error ตลอด | เพิ่ม `id`+`htmlFor`; track `touched`/`submitted` validate ตอน blur/submit; focus ช่อง invalid แรกตอน submit; error inline ไม่ใช่ banner ไกล ๆ | M |
| P1-U9 | modal ทั้งหมด `✕` | ปุ่มปิดทุก modal เป็น glyph `✕` เปล่า ไม่มี `aria-label="ปิด"`; 32px < 44px | `aria-label` + `w-11 h-11` (แก้รวมใน FDN-4) | S |
| P1-U10 | `IntentionAltarInput.tsx:145` etc. | `placeholder-[#9c93b8]/40` ≈ 2:1 contrast — placeholder แทบมองไม่เห็น; disabled button `text-[#9c93b8]/60` อ่านไม่ออก | placeholder → `/70` ขั้นต่ำ; disabled state ปรับ contrast | S |

---

## 🟡 P2 — MEDIUM

### Perf / compositing
- `RitualStepProgress.tsx:42` · `ShuffleRitual.tsx:189` · `InteractiveCardFan.tsx:229` · `ElementalBalanceWidget.tsx:54,70,86,102` · `ReadingHistoryModal.tsx:193` · `SpreadsLibrary.tsx:155` — animate `width`/`height` (paint/reflow ทุกเฟรม) → เปลี่ยนเป็น `transform: scaleX/scaleY` + `transform-origin` (motion §7)
- `globals.css:164-170` — `will-change: transform` ถาวรบนทุก `.card-scene`/`.card-inner` → 10-card spread = 20 compositor layer ค้าง → ใส่ผ่าน state class `[data-animating]` เท่านั้น (runtime F8)
- `page.tsx:388` — sticky header `backdrop-filter: blur(24px)` re-blur ทุก scroll frame; mobile override ไม่ครอบ header → มือถือใช้ `blur(8px)` max หรือ `bg-[#07040f]/95` เลิก backdrop-filter (runtime F12)
- `ShuffleRitual.tsx:24-28` — `pointermove` → `setEntropyList` spread array 60–120×/s ระหว่าง shuffle → ใช้ `useRef<number[]>` ไม่ setState (runtime F9 · = `AUDIT_2026-09-01` P2-2 stale closure ด้วย)
- `layout.tsx:7-21` — preload 6+ woff2 ที่ไม่ได้ใช้ (console warning ทุกโหลด); preload Latin subset บนเว็บภาษาไทย → ตัด `"latin"` จาก `subsets`, เหลือ weight ที่ใช้ above-fold (runtime F10 · = `AUDIT_2026-09-01` P3 fonts)
- `page.tsx:94-113` — `scrollToSanctuaryTop` = 3× `scrollTo` + rAF + `setTimeout(40)` ต่อ step change, **ดึงคนที่กำลังอ่าน stream กลับขึ้นบน** → `useLayoutEffect` `scrollTo(0,0)` ครั้งเดียว, เฉพาะ forward step, skip ถ้า reader อยู่ใน view (runtime F11 · motion §3 · ux §7)
- `MysticBackground.tsx:12-24` — SSR mount `MysticAltarCanvas` แล้ว effect swap เป็น `GalaxyCanvas` ทุก navigation (อยู่ใน tree ทุกหน้า ไม่ใช่ layout) → ย้าย `MysticBackground` เข้า `layout.tsx` ให้ persist; resolve media query แบบ CSS-only / `useSyncExternalStore` (ux §7 · runtime)
- `GalaxyCanvas.tsx:123-142` — `createRadialGradient()` ×4 ทุกเฟรม (desktop only, มือถือใช้ AltarCanvas ที่ cache แล้ว) → cache 3 nebula gradient รื้อเฉพาะ `handleResize` (runtime F13 · = `AUDIT_2026-09-01` P2-11)
- `page.tsx:612-651` — `SpreadBoard`/`StreamReader`/`MysticBackground` ไม่ `React.memo` → re-render ทุก SSE event (ไม่มี long-task แต่เปล่าประโยชน์) → `React.memo` (runtime F14)
- dynamic step components ไม่มี `loading:` fallback → พื้นที่ว่างตอน chunk โหลด → เพิ่ม `<AltarSkeleton/>` (ux §2 · §7)

### Motion — modals / widgets / micro-interactions
- **Modal exit ตายทั้ง 5** + scrim ไม่ fade + spring ต่างกัน 5 แบบ → แก้รวมใน **FDN-4**
- `AnimatePresence` bugs: `CardZoomModal:28`, `JournalModal:48`, `ReadingHistoryModal:54` (expanded row `height:0→auto` ไม่มี exit → collapse ทันที), `TarotEncyclopediaModal:53` (nested modal ไม่มี AP), `ShareModal:312` (AP child เป็น scrim keyless), `SpreadCardSelector:208` (motion.div ที่ remount = scroll container reset ทุกครั้ง) — motion §5
- `ElementalBalanceWidget` — bars animate `width`, `%` snap, ไม่มี entrance stagger → `scaleX` + count-up (`useMotionValue`+`useTransform`) + stagger 80ms (fire→water→air→earth) + `earth %` คำนวณจาก `counts.earth` ตรง ๆ (= `AUDIT_2026-09-01` P2-13) — motion §2f
- `OracleMantraCard` — ไม่มี motion เลย → `initial={{opacity:0,scale:.96}}` 320ms + `AnimatePresence` cross-fade ตอน `copied` — motion §2f
- Tab bars (StreamReader `:129`, encyclopedia suit tabs, SpreadsLibrary `:69`) — active state jump-cut → shared `layoutId="tabPill"` `motion.div` sliding (`SPRING.snappy`) — motion §8
- Number counters (elemental %, `{picked}/{target}` `InteractiveCardFan:223`, "N ใบ") — ทั้งหมด snap → count-up — motion §8
- `AccuracyRatingWidget:90` — submit → widget swap เป็น thank-you **ไม่มี transition** → `AnimatePresence mode="wait"` cross-fade + emoji `scale:[1,1.3,1]` pop — motion §8
- Over-animation: 8 infinite spin rings (40–160s) 2–3 ต่อจอ → เหลือ 1/view, `.mandala-ring` utility เดียว, `animation-play-state:paused` ใต้ reduced-motion; `TarotCard:202` badge "แตะเพื่อเปิด" วน 2 ชั้น (scale pulse + `animate-ping`) บนการ์ดสูงสุด 10 ใบ → pulse เดียว ช้าลง หยุดหลัง flip แรก — motion §3
- Stagger หายไปเกือบทุก list (spreads, personas, encyclopedia, advice checklist) → `staggerContainer` variant เดียว reuse; `SpreadBoard:105` เป็น example ที่ดีอยู่แล้ว — motion §4
- Card-flip haptic — `SpreadBoard:46`/`TarotCard` มีแค่เสียง ไม่มี `navigator.vibrate(15)` (shuffle/fan มีแล้ว) — motion §8

### UX — feedback / forms / mobile / content
- `page.tsx:116-162` — ปุ่ม "ต่อไป: สับไพ่" มีแค่ `disabled` + เปลี่ยน label ไม่มี spinner/skeleton → ดูค้าง 1–3s บนเน็ตช้า (ux §2)
- `CardImage.tsx:55-68` — ไม่มี placeholder/blur-up ระหว่างโหลด; ไม่มี `onError` UI → รูป fail = กล่องว่าง (ux §2)
- `ShareModal.tsx:55` — `alert("คัดลอกข้อความสำเร็จ!")` อยู่ใน **catch** ของ copy (ขึ้นตอน fail ด้วยข้อความ success — บั๊ก) → `aria-live` toast สะท้อนผลจริง (ux §2 · §5)
- `IntentionAltarInput` — ไม่มี char counter/`maxLength` บนคำถาม (ส่งตรงเข้า LLM), nickname, situation → เพิ่ม counter + `maxLength` (nickname ~24, question ~300) (ux §3 · = `AUDIT_2026-09-01` P2-8 body limit)
- `IntentionAltarInput:174-193` — คลิก situation chip เขียนทับที่พิมพ์ไว้ไม่มี undo; `:224` `question.includes(seal.title)` ไม่มีวันตรงเพราะ `handleSelectSeal` เซ็ต `promptSeed` → selected card ไม่เคยโชว์ active (feedback พัง) (ux §3)
- `PersonaCardSelector:143` — ปุ่ม 🔊 เป็น `<button>` ซ้อนใน card `<div>` clickable (nested interactive) ใช้ `stopPropagation` แก้ — เปราะ (ux §3)
- Category filter tabs — เป็น `<button>` แต่ไม่มี `role="tablist"/"tab"/aria-selected` + ไม่มี arrow-key nav (`SpreadCardSelector`, `SpreadsLibrary`, `CardsExplorer`, `StreamReader` chamber tabs) (ux §3)
- Mobile: ไม่มี `env(safe-area-inset-*)` เลย → header/modal ชน notch/home indicator; เพิ่ม + `viewport-fit=cover` (ux §6, high)
- Mobile: `touch-action` ไม่ได้ตั้ง → 300ms double-tap-zoom delay บนปุ่มเล็กเยอะ ๆ → `touch-action:manipulation` (แก้รวมใน FDN-5)
- Mobile: `InteractiveCardFan` fan strip กว้าง ~900–1100px บน 375px ไม่มี edge-fade/scroll hint; `overscroll-behavior-x` ไม่ตั้ง (swipe เลยขอบ = browser back) (ux §6)
- Content: `หมวด{item.category}` → "หมวดgeneral" (raw enum) ที่ `ReadingHistoryModal:145` + `SpreadsLibrary:120` → TH label map (ux §4)
- Content: emoji การ์ตูนผิด CLAUDE.md กฎ 2 — `IntentionAltarInput` (👤📜🕯️), `RitualStepProgress` (🎴✍️🔮), `AccuracyRatingWidget` (😕🤔😊😮🤩), modal headers (📖📜📸), `ReadingHistoryModal` (🔥🌊🌪️🌿) → ตัดสินนโยบาย + บังคับ (ux §8)
- Content: `...` → `…` ทั้งไซต์; `"กำลังโหลด.."` → `"กำลังโหลด…"`; `"ลองอ่านใหม่อีกครั้ง (Retry)"` ตัด "(Retry)"; terminology "ผังการเปิดไพ่/ผังพยากรณ์/ผังการวางไพ่" เลือกอันเดียว (ux §5)
- `AntiTheftShield:34` — watermark clipboard ใส่ URL `tarot-web.bankjack10452.workers.dev` ทั้งที่ canonical = `tarot.luminuy.com` (ux §5 · = `AUDIT_2026-09-01` P2-12 ควรลบ clipboard rewrite)
- `color-scheme: dark` ไม่ได้ตั้งบน `:root` → scrollbar/autofill/native control อาจ render light (ux §4)
- skip-link ไม่มี → `<a href="#main" class="sr-only focus:not-sr-only">ข้ามไปเนื้อหา</a>` (ux §4)

---

## 🟢 P3 — LOW / POLISH

- Empty state: `TarotEncyclopediaModal` search 0 ผล = grid ว่างเปล่า → เพิ่ม empty state (ux §5)
- `ReadingHistoryModal:31` — delete ทันทีไม่มี undo (localStorage กู้ไม่ได้) → snackbar "เลิกทำ" 5 วิ (ux §2)
- `FollowUpChat:52` — ส่ง fail → error โผล่เป็น bubble "bot" แทนที่จะ mark user message failed + "ลองส่งใหม่" (ux §2)
- `error.tsx:26` / `global-error.tsx:17` — error copy ไม่มี next step / บอกว่าจะ auto-refresh ทั้งที่ปุ่ม manual → reword ให้ actionable (ux §5)
- heading hierarchy: footer `<h4>` ไม่มี `<h3>` เหนือ; StreamReader `<h4>/<h5>` ซ้อนไม่มี `<h3>` (ux §4)
- `translate="no"` บน brand token ("Rider-Waite", "Provably-Fair", "SHA-256") (ux §4)
- touch targets < 44px: StreamReader tab `~30px`, card pills `~28px`, fan target badges, persona/spread dot indicators `6px`, 🔊 button `~24px` — bump (ux §4)
- `SpreadBoard.tsx:103` — entrance stagger อาจ replay ตอน card-flip re-render → `initial={false}` หลัง mount แรก หรือ `hasEntered` ref (motion §3)
- `MysticAltarCanvas:176` — `p.opacity += sin(Date.now()*x)*0.01` drift unbounded → phase accumulator (motion §3)
- `SpreadCardSelector`/`PersonaCardSelector` — double hover transform (Framer `whileHover` + Tailwind `hover:-translate-y-1`) → เลือกอันเดียว (motion §3)
- `/blog`, `/account` orphan routes ไม่มี link ที่ไหน + `/blog` article ไม่ใช่ link → surface หรือลบ (ux §1 · ทับ `AUDIT_2026-09-01` P3)
- orphan components `JournalModal`, `JournalHistoryDrawer`, `ProvablyFairBadge` → wire feature หรือลบ (ux §8 · ทับ `AUDIT_2026-09-01` P3 Category A)
- `RitualStepProgress:13-19` — 5 node สำหรับ 6 state (READING + SUMMARY ใช้ node 5 ร่วมกัน) → label เปลี่ยน "กำลังทำนาย" → "คำทำนาย" (ux §1)
- `StreamReader:216` — `key={activeCardIndex}` remount เต็มตอนคลิก card pill → crossfade แทน (ux §7 · motion §2e)
- `MysticBackground` persist + skeleton fallbacks, border-radius scale (6 ระดับ → 3), 2 gold palette unify, close-button style unify (ux §8)

---

## 📋 ลำดับการแก้สำหรับ Gemini

| รอบ | PR | เนื้อหา |
|---|---|---|
| 1 | **foundation-motion** | FDN-1 (MotionConfig) + FDN-2 (token system: globals.css vars + `src/lib/motion.ts`) + FDN-3 (นิยาม/ลบ 3 phantom class) |
| 2 | **foundation-primitives** | FDN-4 (`<Modal>` + focus trap + a11y) + FDN-5 (`<Button>` + `.focus-visible` + `touch-action`) — refactor call sites |
| 3 | **perf-runtime-1** | P0-1 (fan memoize/drop layout) + P1-P1 (AssetWarmup) + P1-P2 (search key) + P1-P4 (form local state) |
| 4 | **perf-runtime-2** | P1-P3 (encyclopedia grid) + P1-P5 (bake image filter → ปิด INC-0016) + P2 compositing batch (`width→scaleX`, `will-change`, header blur, fonts, scroll) |
| 5 | **motion-signature** | P1-M1 (step transitions) + P1-M2 (card flip) + P1-M3 (stream per-word) + P1-M4 (fan arc) + P1-M5 (shuffle) |
| 6 | **ux-navigation** | P1-U1..U5 (back buttons, reset confirm, stepper, sessionStorage resume, `?spread=`) + dead-end fixes |
| 7 | **ux-a11y** | P1-U6 (keyboard cards) + P1-U7 (aria-live) + P1-U8 (form labels/validation) + P1-U9/U10 + P2 a11y batch |
| 8 | **polish** | P2 motion widgets + P2 content/copy + P3 ทั้งหมด + adopt token repo-wide (FDN-2 migration) |

> ทุก PR: rebase `origin/main`, `npm run repo:verify`, commit ผ่าน `npm run commit`, 1 milestone = 1 PR (INC-0017)
> ทดสอบ flow 5 ขั้นด้วยการคลิกจริงบนเบราว์เซอร์หลังทุก PR (ไพ่คว่ำหน้าเริ่มต้น = Golden Rule 5); ทดสอบ `prefers-reduced-motion` + viewport มือถือ 375px
> dev server รันค้างที่ port 3000 อยู่แล้ว (`npm run dev`)
