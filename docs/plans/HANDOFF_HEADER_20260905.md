# 🧭 แผนส่งต่องานแก้ "แถบ header ค้าง" (Header Hang — Handoff Plan)

> **ผู้ตรวจและส่งมอบ**: Claude · 2026-09-05 · branch `claude/header-hang-issue-0c30b9`
> **ผู้รับช่วง**: ทีม/เอเจนต์ตัวถัดไป
> **สถานะ**: ตรวจเสร็จ **ยังไม่ได้แก้โค้ดแม้แต่บรรทัดเดียว** — เอกสารนี้คือแผนแก้ทั้งชุด
> **โค้ดอ้างอิง**: `main` ที่ commit `ba167ee` — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมาแทน
>
> **วิธีตรวจ**: `npm run dev` รันไม่ได้ใน worktree นี้ (npm ตาย `EPERM: uv_cwd` จาก sandbox)
> จึงวัดกับ **production `https://seertarot.net` จริง** ผ่าน DevTools protocol + อ่านโค้ดควบคู่
> ทุกตัวเลขในเอกสารนี้เป็นค่าที่วัดได้จริง ไม่ใช่ค่าประมาณ

---

## ⛔ อ่านก่อนแตะโค้ดบรรทัดแรก (บังคับ)

| ลำดับ | เอกสาร | อ่านเพื่ออะไร |
| :-: | :--- | :--- |
| 1 | [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) | **INC-0067** (overflow บน ancestor ฆ่า sticky) · **INC-0081** (`body > *` ทับ z-index หัวเว็บ) · **INC-0056** (backdrop-blur + will-change ทำเฟรมตก) |
| 2 | [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md) | กันแก้ซ้ำกับเอเจนต์อื่น |
| 3 | [`docs/AI_COLLABORATION_GUIDELINES.md`](../AI_COLLABORATION_GUIDELINES.md) | หัวข้อ 0 = วิธีทำงานที่บังคับใช้ |

### ลำดับการทำงานมาตรฐาน (ห้ามข้ามขั้นไหน)

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain ui-layout \
  --files "src/app/globals.css,src/lib/i18n/context.tsx,src/components/ui/SacredNavDropdown.tsx" \
  --task "แก้ header hang ตาม HANDOFF_HEADER_2026-09-05"
# ...แก้งาน...
npm run repo:verify                       # ต้องผ่านครบทุกด่าน
npm run commit -- --agent <ชื่อคุณ> --type fix --scope ui \
  --msg "..." --symptom "..." --cause "..." --fix "..." --prevention "..." \
  --severity <ระดับ> --verify "..." --files "<ไฟล์ของคุณ>"
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run pr:auto -- "<title>" --body-file <path>
```

> 🚨 **`push` แล้วจบ = งานยังไม่เสร็จ** (กฎเหล็กข้อ 13 / INC-0043) — automation เริ่มทำงานเมื่อ PR ถูกเปิดเท่านั้น

---

## ✅ สิ่งที่ตรวจแล้วว่า **ไม่พัง** — ห้ามเสียเวลาแก้ซ้ำ

เอเจนต์รุ่นก่อนแก้ INC-0067 กับ INC-0081 ไว้ถูกต้องแล้ว **ทั้งสองยังทำงานอยู่** ยืนยันด้วยค่าจริงบน production:

| ตรวจอะไร | ผลที่วัดได้ | สรุป |
| :--- | :--- | :-: |
| `getComputedStyle(header)` | `position: "sticky"`, `zIndex: "50"`, `transform: "none"` | ✅ |
| เลื่อน y = 0 → 4000 (desktop) | `header.getBoundingClientRect().top === 0` ทุกจุด | ✅ |
| เลื่อน y = 0 → 3000 (375px) | `top === 0` ทุกจุด · `height` คงที่ 69px | ✅ |
| เลื่อน y = 0 → 1500 (`/blog`) | `top === 0` ทุกจุด | ✅ |
| ancestor chain ของ header | `main` = `overflow-x: clip` / `overflow-y: visible` — **ไม่ใช่ hidden** | ✅ ตรงกฎ INC-0067 |
| กฎ `body > *:not(...)` | `:not([data-site-header])` ยังอยู่ใน `globals.css:186` | ✅ ตรงกฎ INC-0081 |
| hit-test แผงเมนู 4 จุด (5%/30%/60%/90% ของความสูง) | `elementFromPoint` ตอบเป็น element ในแผงทั้ง 4 จุด | ✅ ไม่ถูกเนื้อหาทับ |
| จอ 320px | `document.documentElement.scrollWidth === 320` (ไม่ล้นแนวนอน) · แผงเมนูสูง 628px < จอ 700px | ✅ |
| scroll-lock ซ้อนของโมดัล | ไล่ครบทุกคู่ (AccessDialog → BuyCredits → Auth) ทุกเส้นทาง `onClose()` ก่อน แล้ว React รัน cleanup ทั้ง commit ก่อน mount → `body.overflow` **ไม่รั่ว** | ✅ |

> 📌 **บทเรียนสำหรับผู้รับช่วง**: อย่าเปิดมาแล้วรื้อ `position: sticky` หรือ z-index ทันที
> ปัญหารอบนี้ **ไม่ได้อยู่ที่เลย์เอาต์** แต่อยู่ที่ **จังหวะเวลา (timing) ของ CSS transition และ React scheduling**

---

## 🗺️ สรุปงานและลำดับความสำคัญ

| ลำดับ | # | เรื่อง | ระดับ | ขนาด | ไฟล์หลัก |
| :-: | :-- | :--- | :-- | :-- | :--- |
| 1 | **ISSUE-024** | แผงเมนูค้าง `visibility:hidden` ทั้งที่ `aria-expanded="true"` | 🔴 High | ~1 ชม. | `globals.css` |
| 2 | **ISSUE-025** | กด TH/EN แล้วหัวเว็บนิ่ง ไม่มี feedback (วัดได้ 353 ms บน desktop) | 🔴 High | ~2-3 ชม. | `i18n/context.tsx`, `LanguageSwitcher.tsx` |
| 3 | **ISSUE-026** | `LocaleProvider` ไม่ memo `value` → consumer ทั้งเว็บ re-render ทุกครั้ง | 🟠 Medium | ~30 นาที | `i18n/context.tsx` |
| 4 | **ISSUE-027** | `will-change` ค้างถาวรบนแผง dropdown ที่ปิดอยู่ (ผิดกฎที่เขียนไว้เองใน `globals.css:367`) | 🟠 Medium | ~20 นาที | `globals.css` |
| 5 | **ISSUE-028** | `window.dispatchEvent` อยู่ใน state updater ซึ่งต้องเป็น pure function | 🟠 Medium | ~40 นาที | `SacredNavDropdown.tsx`, `UserProfileBadge.tsx` |
| 6 | **ISSUE-029** | `AuthModal` ไม่ได้กันกับดักที่ `Modal.tsx` เขียนเตือนไว้ (deps มี `onClose`) | 🟠 Medium | ~30 นาที | `AuthModal.tsx` |
| 7 | **ISSUE-030** | ไม่มี `scroll-padding-top` ทั้งโปรเจกต์ ทั้งที่หัวเว็บ sticky สูง 69-81px | 🔵 Low | ~30 นาที | `globals.css` |

### แนะนำแบ่ง PR

| PR | รวมข้อ | เหตุผล |
| :-- | :-- | :--- |
| **PR-A** 🔴 | 024 + 027 | แตะ `globals.css` ไฟล์เดียว ทั้งคู่เป็นเรื่องเลเยอร์ dropdown · เป็นต้นเหตุอาการที่ผู้ใช้แจ้งโดยตรง **ทำก่อนสุด** |
| **PR-B** 🔴 | 025 + 026 | แตะ i18n context ด้วยกัน แยกไม่ได้ (026 คือตัวขยาย 025) |
| **PR-C** 🟠 | 028 + 029 | เรื่อง React correctness ทั้งคู่ ไม่กระทบภาพ |
| **PR-D** 🔵 | 030 | เอกเทศ ทำเมื่อไหร่ก็ได้ |

> ⚠️ **ห้ามรวมทั้ง 7 ข้อเป็น PR เดียว** — กฎเหล็กข้อ 0.2 (6): แก้เรื่องเดียวต่อหนึ่ง commit
> และถ้ารวมกันแล้วอาการไม่หาย จะแยกไม่ออกว่าข้อไหนคือตัวจริง

---

# 🔴 1. ISSUE-024 · แผงเมนูค้าง `visibility: hidden` ทั้งที่ React เปิดไปแล้ว

## อาการ

กดปุ่มแฮมเบอร์เกอร์ → **ไม่มีอะไรโผล่มา** → ผู้ใช้กดซ้ำ → กลายเป็นสั่งปิด → ดูเหมือน "เมนูกดไม่ติด / header ค้าง"

## หลักฐานที่วัดได้จริง (production)

เปิดเมนูแล้วรอ 1,200 ms ก่อนอ่านค่า:

```
aria-expanded    : "true"                      ← React เปิดแล้ว state ถูกต้อง
class            : "... dropdown-panel-entering"  ← คลาสสลับแล้วถูกต้อง
visibility       : "hidden"                    ← ❌ แต่มองไม่เห็น
opacity          : "0"                         ← ❌
elementFromPoint : ตอบเป็นเนื้อหาหน้า ทั้ง 4 จุด  ← ❌ กดไม่โดน
```

ทดสอบซ้ำโดยฉีด `.dropdown-panel-base { transition: none !important; }` แล้วเปิดใหม่:

```
visibility : "visible"    ✅
opacity    : "1"          ✅
elementFromPoint : ตอบเป็น element ในแผง ทั้ง 4 จุด  ✅
```

> **นี่คือการพิสูจน์แบบตัดตัวแปร**: ปิด transition แล้วหาย = **transition คือตัวปัญหา**
> ไม่ใช่ z-index ไม่ใช่ stacking context ไม่ใช่ pointer-events

## ⚠️ ข้อจำกัดของหลักฐานชุดนี้ (ต้องอ่าน — กฎ 0.2 ข้อ 5 รายงานตามจริง)

แท็บที่ใช้ทดสอบอยู่ในสถานะ `document.visibilityState === "hidden"` (browser pane ถูกซ่อน)
ซึ่งเบราว์เซอร์จะ **หยุด paint และหยุดเดิน CSS transition** → เป็นตัวเร่งให้เกิดอาการนี้

**แปลว่า**: ยืนยันได้ 100% ว่า *กลไกนี้พังจริงเมื่อเบราว์เซอร์ไม่ paint*
แต่ยังยืนยันไม่ได้ 100% ว่าอาการบนมือถือของเจ้าของโปรเจกต์มาจากสาเหตุเดียวกันเป๊ะ ๆ

**ผู้รับช่วงต้องทำ**: ทดสอบซ้ำบนมือถือจริงในสถานการณ์ที่เบราว์เซอร์หยุด paint —
สลับไปแอปอื่นแล้วสลับกลับมา / ดึงหน้ากลับจาก bfcache (กดปุ่ม Back) / เปิดเมนูตอนหน้ากำลังโหลดหนัก
ถ้าเจออาการซ้ำ = ตรงตามที่วิเคราะห์ · ถ้าไม่เจอ = ยังต้องหาสาเหตุเพิ่ม **ห้ามปิดเคสด้วยการเดา**

## สาเหตุราก

[`src/app/globals.css:484-506`](../../src/app/globals.css#L484)

```css
.dropdown-panel-base {
  transform-origin: top right;
  will-change: opacity, transform;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
              visibility 160ms;              /* ← ตัวปัญหา */
}

.dropdown-panel-entering { opacity: 1; visibility: visible;  pointer-events: auto; ... }
.dropdown-panel-exiting  { opacity: 0; visibility: hidden;   pointer-events: none; ... }
```

[`src/components/ui/SacredNavDropdown.tsx:157-165`](../../src/components/ui/SacredNavDropdown.tsx#L157) — แผงถูก render อยู่ใน DOM **ตลอดเวลา** ไม่เคย unmount:

```tsx
className={`... dropdown-panel-base ${isOpen ? "dropdown-panel-entering" : "dropdown-panel-exiting"}`}
```

**รากของปัญหา**: แผงเริ่มต้นชีวิตที่ `visibility: hidden` (จาก SSR + hydration ครั้งแรก)
และ **ทางเดียวที่มันจะกลายเป็น `visible` ได้คือ transition ต้องวิ่ง**
ถ้าเบราว์เซอร์ยังไม่ paint (แท็บพักหลังบ้าน · กลับจาก bfcache · main thread ติดยาว)
transition ไม่เริ่ม → แผงค้างที่ `hidden` ทั้งที่ React commit state `isOpen = true` ไปแล้ว

นี่คือความผิดพลาดเชิงหลักการ: **"ผู้ใช้จะเห็นเมนูหรือไม่" ไปผูกกับ "อนิเมชันวิ่งจบหรือยัง"**
ทั้งที่ทั้งสองเรื่องนี้ต้องแยกจากกันเด็ดขาด

## วิธีแก้ (แก้ที่ `globals.css` ไฟล์เดียว ไม่ต้องแตะ `.tsx`)

```css
/*
 * ⚠️ ห้ามใส่ `visibility` ลงในรายการ transition ของ .dropdown-panel-base เด็ดขาด (ISSUE-024)
 * ถ้าใส่ = แผงจะโผล่ได้ก็ต่อเมื่อ transition วิ่งจบ ซึ่งไม่เกิดขึ้นเลยตอนเบราว์เซอร์หยุด paint
 * (แท็บพักหลังบ้าน / กลับจาก bfcache / main thread ติดยาว) → กดเมนูแล้วไม่ขึ้น
 *
 * รูปแบบที่ถูกต้อง:
 *   ตอนเปิด  → visibility: visible ต้องมีผล "ทันที" ไม่ผ่าน transition
 *   ตอนปิด   → หน่วง visibility ด้วย transition-delay เท่ากับเวลา fade เพื่อให้เห็นอนิเมชันจางหาย
 */
.dropdown-panel-base {
  transform-origin: top right;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 160ms cubic-bezier(0.16, 1, 0.3, 1);
}

.dropdown-panel-entering {
  opacity: 1;
  visibility: visible;                 /* มีผลทันที ไม่ผ่าน transition */
  pointer-events: auto;
  transform: translate3d(0, 0, 0) scale(1);
  will-change: opacity, transform;     /* ← ISSUE-027: ย้ายมาไว้เฉพาะตอนเปิด */
}

.dropdown-panel-exiting {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translate3d(0, -6px, 0) scale(0.98);
  /* หน่วงเฉพาะ visibility ให้ซ่อนหลัง fade จบ — opacity/transform ยังวิ่งปกติ */
  transition: opacity 160ms cubic-bezier(0.16, 1, 0.3, 1),
              transform 160ms cubic-bezier(0.16, 1, 0.3, 1),
              visibility 0s linear 160ms;
}
```

**ทำไมวิธีนี้ถึงถูก**: `visibility: visible` ในสถานะเปิดไม่มี transition ผูกอยู่เลย
จึงมีผลทันทีที่ style ถูกคำนวณ **ไม่ว่าเบราว์เซอร์จะ paint หรือไม่**
ส่วนตอนปิดใช้ `transition-delay: 160ms` บน `visibility` ซึ่งเป็นรูปแบบมาตรฐานที่รองรับทุกเบราว์เซอร์
(ไม่ต้องพึ่ง `@starting-style` หรือ `transition-behavior: allow-discrete` ที่ยังใหม่เกินไป)

## ต้องแก้ทั้ง 2 ที่ที่ใช้คลาสชุดนี้

| ไฟล์ | บรรทัด | หมายเหตุ |
| :--- | :-- | :--- |
| [`src/components/ui/SacredNavDropdown.tsx`](../../src/components/ui/SacredNavDropdown.tsx#L162) | 162-164 | เมนูหลัก |
| [`src/components/auth/UserProfileBadge.tsx`](../../src/components/auth/UserProfileBadge.tsx#L237) | 237-239 | เมนูโปรไฟล์ |

ทั้งคู่ใช้คลาสเดียวกัน → **แก้ที่ CSS ที่เดียวได้ทั้งสองตัว ไม่ต้องแตะ `.tsx` เลย**

## เกณฑ์ผ่าน (ต้องพิสูจน์ให้ครบทุกข้อ ห้ามข้าม)

```js
// รันใน DevTools Console บนหน้า / (มือถือ 375px)
const btn = document.querySelector('button[aria-controls="sacred-nav-panel"]');
const p   = document.getElementById('sacred-nav-panel');

// 1. เปิดแล้วต้องเห็น "ทันทีในเฟรมเดียวกัน" ไม่ต้องรอ transition
btn.click();
const cs = getComputedStyle(p);
console.assert(cs.visibility === 'visible', 'FAIL: ยังค้าง hidden');
console.assert(cs.pointerEvents === 'auto', 'FAIL: กดไม่โดน');

// 2. hit-test ต้องโดนแผงทั้ง 4 จุด
const r = p.getBoundingClientRect();
[0.05, 0.3, 0.6, 0.9].forEach(f => {
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * f);
  console.assert(p.contains(el), `FAIL: จุด ${f} ถูกทับ`);
});

// 3. ปิดแล้ว fade ต้องยังเห็น (visibility ยัง visible ระหว่าง 160ms แรก)
btn.click();
setTimeout(() => console.assert(getComputedStyle(p).visibility === 'visible', 'FAIL: หายวับ ไม่มี fade'), 60);
setTimeout(() => console.assert(getComputedStyle(p).visibility === 'hidden',  'FAIL: ไม่ยอมซ่อน'), 400);
```

**บวกการทดสอบด้วยมือบนมือถือจริง (บังคับ)**:

1. เปิดหน้าเว็บ → สลับไปแอปอื่น 30 วินาที → สลับกลับมา → กดเมนู → **ต้องโผล่ทันที**
2. เข้าหน้า `/blog` → กด Back กลับหน้าแรก (bfcache) → กดเมนู → **ต้องโผล่ทันที**
3. เปิดเมนูตอนหน้ากำลังโหลดรูปไพ่อยู่ → **ต้องโผล่ทันที**
4. เปิด/ปิดเมนูรัว ๆ 10 ครั้ง → **ต้องไม่มีสถานะค้างกลางทาง**

---

# 🔴 2. ISSUE-025 · กด TH/EN แล้วหัวเว็บนิ่ง ไม่มี feedback ใด ๆ

## อาการ

กดปุ่ม TH หรือ EN → **ปุ่มยังไฮไลต์ภาษาเดิม ไม่มี spinner ไม่มีอะไรขยับ** → ผู้ใช้คิดว่าเว็บค้าง → กดซ้ำ

## หลักฐานที่วัดได้จริง

วัดเวลาตั้งแต่ `.click()` จนกว่า `aria-pressed` จะเปลี่ยน บน production หน้าแรก:

```
commit latency = 353 ms   (เครื่อง desktop, Chrome 148)
```

353 ms คือค่าบนเครื่องแรง — ต้นไม้หน้าแรกมี `DailyCardStrip` + `QuickFortunePicker` +
20 ผัง + SEO content block + `AnimatePresence` ทั้งหมด **บนมือถือกลาง ๆ ตัวเลขนี้จะพุ่งเป็นวินาที**

## สาเหตุราก

[`src/lib/i18n/context.tsx:72-93`](../../src/lib/i18n/context.tsx#L72)

```tsx
const [, startTransition] = useTransition();     // ← บรรทัด 72: ทิ้ง isPending ทั้งดุ้น

const setLocale = (nextLocale: Locale) => {
  if (!SUPPORTED_LOCALES.includes(nextLocale)) return;

  startTransition(() => {
    setLocaleState(nextLocale);                  // ← บรรทัด 77-79: งาน priority ต่ำ ขัดจังหวะได้
  });

  try {
    document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; ...`;   // ← บรรทัด 83: เขียนทันที
    localStorage.setItem(LOCALE_COOKIE_KEY, nextLocale);           // ← บรรทัด 86: เขียนทันที
    document.documentElement.lang = nextLocale;                    // ← บรรทัด 90: เขียนทันที
  } catch { /* ... */ }
};
```

พังสามชั้นซ้อนกัน:

1. **`startTransition` = งาน priority ต่ำที่ React ตั้งใจให้ขัดจังหวะได้**
   React จะ **ค้างจอเดิมไว้** จนกว่าจะ render ต้นไม้ใหม่ทั้งหน้าเสร็จ นี่คือพฤติกรรมที่ถูกต้องของ API
   แต่ใช้ผิดที่ — การกดปุ่มสลับภาษาเป็น **urgent update** ที่ผู้ใช้คาดหวังผลตอบสนองทันที

2. **`isPending` ถูกทิ้ง (`const [, startTransition]`)**
   React ยื่นสถานะ "กำลังทำงานอยู่" มาให้ฟรี ๆ แต่โค้ดโยนทิ้ง
   ผลคือ **ไม่มีทางบอกผู้ใช้ได้เลยว่าระบบรับคำสั่งไปแล้ว** — นี่คือหัวใจของอาการ "ค้าง"

3. **state ที่บันทึกกับที่เห็นบนจอไม่ตรงกัน**
   cookie / localStorage / `<html lang>` ถูกเขียน **ทันทีนอก transition**
   แต่ UI ยังเป็นภาษาเก่า → ถ้าผู้ใช้รีเฟรชระหว่างนั้นจะเด้งเป็นอีกภาษาทันทีแบบไม่มีปี่มีขลุ่ย

## วิธีแก้

### 2.1 `src/lib/i18n/context.tsx`

```tsx
interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  isThai: boolean;
  isEnglish: boolean;
  /** ภาษาที่ผู้ใช้เพิ่งกดเลือก — มีค่าทันทีที่กด ไม่ต้องรอ React render เสร็จ */
  pendingLocale: Locale | null;
  /** React กำลัง render ต้นไม้ภาษาใหม่อยู่หรือไม่ */
  isSwitchingLocale: boolean;
}
```

```tsx
export function LocaleProvider({ children, initialLocale }: {...}) {
  const [locale, setLocaleState] = useState<Locale>(() => getInitialClientLocale(initialLocale));
  const [isPending, startTransition] = useTransition();          // ← เลิกทิ้ง isPending
  const [pendingLocale, setPendingLocale] = useState<Locale | null>(null);

  const setLocale = useCallback((nextLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(nextLocale)) return;

    // ⚠️ ต้องตั้งค่านี้ "นอก" startTransition เท่านั้น (ISSUE-025)
    // นี่คือ urgent update ที่ทำให้ปุ่มไฮไลต์ทันทีในเฟรมถัดไป
    // ผู้ใช้ต้องเห็นว่าระบบรับคำสั่งแล้ว ไม่ใช่รอ 353ms+ แบบไม่มีสัญญาณอะไรเลย
    setPendingLocale(nextLocale);

    startTransition(() => {
      setLocaleState(nextLocale);
    });

    try {
      document.cookie = `${LOCALE_COOKIE_KEY}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      localStorage.setItem(LOCALE_COOKIE_KEY, nextLocale);
      document.documentElement.lang = nextLocale;
    } catch {
      // Ignore storage restrictions
    }
  }, []);

  // เคลียร์สถานะรอเมื่อ locale จริงตามมาทันแล้ว
  useEffect(() => {
    if (pendingLocale === locale) setPendingLocale(null);
  }, [pendingLocale, locale]);

  // ISSUE-026: memo ค่าใน context — ดูหัวข้อ 3
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    t: dictionaries[locale] || th,
    isThai: locale === "th",
    isEnglish: locale === "en",
    pendingLocale,
    isSwitchingLocale: isPending,
  }), [locale, setLocale, pendingLocale, isPending]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
```

> ⚠️ อย่าลืมเติม `pendingLocale: null` และ `isSwitchingLocale: false` ใน fallback object
> ของ `useLocale()` ([`context.tsx:117-124`](../../src/lib/i18n/context.tsx#L117)) ไม่งั้น type ไม่ผ่าน

### 2.2 `src/components/layout/LanguageSwitcher.tsx`

ให้ปุ่มไฮไลต์ตาม **ภาษาที่กด** ไม่ใช่ภาษาที่ render เสร็จแล้ว:

```tsx
const { locale, setLocale, pendingLocale, isSwitchingLocale } = useLocale();

// ภาษาที่ควรแสดงว่า "เลือกอยู่" — ใช้ค่าที่ผู้ใช้เพิ่งกดถ้ามี
const shownLocale = pendingLocale ?? locale;
```

แล้วเปลี่ยนทุกจุดที่เช็ก `locale === "th"` / `locale === "en"` ให้ใช้ `shownLocale` แทน
([`LanguageSwitcher.tsx:32,35,46,49`](../../src/components/layout/LanguageSwitcher.tsx#L32))
พร้อมเติมสัญญาณบอกสถานะบนกล่องครอบ:

```tsx
<div
  role="group"
  aria-label="Language selector / สลับภาษา"
  aria-busy={isSwitchingLocale}
  className={`... ${isSwitchingLocale ? "opacity-70" : ""}`}
>
```

และกัน `handleSelect` ไม่ให้ยิงซ้ำระหว่างที่ยังสลับไม่เสร็จ:

```tsx
const handleSelect = (nextLocale: "th" | "en") => {
  if (nextLocale === shownLocale) return;   // ← เทียบกับ shownLocale ไม่ใช่ locale
  try { soundManager.playMenuTapSound(); } catch {}
  setLocale(nextLocale);
};
```

> 🎨 **ข้อจำกัดดีไซน์**: `opacity-70` เท่านั้น **ห้ามใส่ spinner หรืออิโมจิการ์ตูน** (กฎเหล็กข้อ 2)
> ถ้าจะใส่สัญลักษณ์ให้ใช้ `✦` หรือ `✨` เท่านั้น

## เกณฑ์ผ่าน

```js
const en = document.querySelector('button[aria-label="Switch to American English"]');
const t0 = performance.now();
en.click();
// ต้องไฮไลต์ทันทีในเฟรมถัดไป ไม่ใช่หลัง 353ms
requestAnimationFrame(() => {
  console.log('feedback latency:', Math.round(performance.now() - t0), 'ms');
  console.assert(en.getAttribute('aria-pressed') === 'true', 'FAIL: ปุ่มยังไม่ไฮไลต์');
});
```

**เกณฑ์ตัวเลข**: feedback latency ต้อง **< 50 ms** (เดิม 353 ms)

**บวกการทดสอบด้วยมือ (บังคับ)**:
1. มือถือจริง เปิดหน้าแรก → กด EN → ปุ่ม EN ต้องไฮไลต์ **ทันที** และกลุ่มปุ่มจาง (`aria-busy`)
2. กด EN แล้วรีเฟรชทันทีระหว่างที่ยังสลับไม่เสร็จ → หน้าที่โหลดมาต้องเป็นอังกฤษ (ตรงกับ cookie)
3. กด TH/EN สลับรัว ๆ 10 ครั้ง → ต้องไม่ค้างสถานะกลางทาง และภาษาสุดท้ายต้องตรงกับปุ่มที่กดล่าสุด
4. ทดสอบทั้ง `/` (ต้นไม้ใหญ่สุด) และ `/blog` (ต้นไม้เล็ก) — ต้องเร็วเท่ากันทั้งคู่

---

# 🟠 3. ISSUE-026 · `LocaleProvider` ไม่ memo `value`

## สาเหตุราก

[`src/lib/i18n/context.tsx:104-111`](../../src/lib/i18n/context.tsx#L104)

```tsx
const value: LocaleContextValue = {     // ← สร้าง object ใหม่ทุก render
  locale,
  setLocale,                            // ← function ใหม่ทุก render ด้วย
  t: dictionaries[locale] || th,
  isThai: locale === "th",
  isEnglish: locale === "en",
};
```

`LocaleProvider` ครอบทั้งเว็บใน [`src/app/layout.tsx:158`](../../src/app/layout.tsx#L158)
→ **`value` เปลี่ยน identity ทุก render = consumer ทุกตัวทั้งเว็บ re-render ทุกครั้ง**

หัวเว็บอย่างเดียวเรียก `useLocale()` ถึง **4 จุด**:

| ไฟล์ | บรรทัด |
| :--- | :-- |
| [`SiteHeader.tsx`](../../src/components/layout/SiteHeader.tsx#L33) | 33 |
| [`SacredNavDropdown.tsx`](../../src/components/ui/SacredNavDropdown.tsx#L31) | 31 |
| [`LanguageSwitcher.tsx`](../../src/components/layout/LanguageSwitcher.tsx#L11) | 11 |
| [`UserProfileBadge.tsx`](../../src/components/auth/UserProfileBadge.tsx#L18) | 18 |

นี่คือ **ตัวขยายของ ISSUE-025 โดยตรง** — ยิ่ง consumer เยอะ transition ยิ่งนาน

## วิธีแก้

รวมอยู่ในโค้ดของหัวข้อ 2 แล้ว (`useMemo` + `useCallback`) — ทำใน PR-B เดียวกัน

## เกณฑ์ผ่าน

```js
// React DevTools Profiler: บันทึกตอนกด EN
// จำนวน component ที่ re-render ต้องลดลงอย่างมีนัยสำคัญเทียบกับก่อนแก้
// และ commit duration ต้องลดลง — บันทึกตัวเลข before/after ลง PR description
```

> 📌 **บังคับ**: ต้องแนบตัวเลข before/after จาก React DevTools Profiler ลงใน PR
> (กฎ 0.2 ข้อ 1 — วัดก่อนเดา, ข้อ 4 — พิสูจน์ว่าแก้ได้จริง)

---

# 🟠 4. ISSUE-027 · `will-change` ค้างถาวรบนแผงที่ปิดอยู่

## สาเหตุราก

[`src/app/globals.css:486`](../../src/app/globals.css#L486)

```css
.dropdown-panel-base {
  will-change: opacity, transform;   /* ← ติดอยู่ตลอด แม้ตอนแผงปิด */
}
```

`.dropdown-panel-base` ติดอยู่กับแผงทั้ง **ตอนเปิดและตอนปิด**
→ แผง dropdown 2 ตัว (เมนูหลัก + เมนูโปรไฟล์) **จอง GPU layer ถาวรตลอดทั้ง session**
แต่ละตัวมีเงาเบลอ 30px (`shadow-[0_10px_30px_rgba(42,38,31,0.12)]`)

## นี่คือการละเมิดกฎที่โปรเจกต์เขียนเตือนตัวเองไว้แล้ว

[`src/app/globals.css:367-370`](../../src/app/globals.css#L367) เขียนไว้ชัดเจน:

> ```
> ⚠️ ห้ามตั้ง `will-change: transform` ถาวรตรงนี้ (ของเดิมตั้งไว้)
> เพราะมันสร้างเลเยอร์ GPU ค้างไว้ให้ไพ่ "ทุกใบ" ตลอดเวลา แม้ตอนไม่ได้พลิก
> บนมือถือที่แสดงไพ่หลายใบพร้อมกันจะกินหน่วยความจำ GPU จนวาดภาพช้าลง
> ```

กฎเขียนไว้ที่บรรทัด 367 แต่ถูกละเมิดที่บรรทัด 486 **ในไฟล์เดียวกัน ห่างกัน 119 บรรทัด**
ตรงกับกฎ 0.2 ข้อ 8: *"กฎที่ไม่มีเครื่องตรวจ คือกฎที่จะถูกละเมิดอีกแน่นอน"*

เกี่ยวโยงกับ **INC-0056** ที่เคยวัดได้ว่า fps เด้งจาก 30 → 58 หลังถอดเลเยอร์ที่ไม่จำเป็นออก

## วิธีแก้

ย้าย `will-change` ไปไว้ที่ `.dropdown-panel-entering` เท่านั้น — รวมอยู่ในโค้ดของ ISSUE-024 แล้ว (PR-A เดียวกัน)

## 🔒 ต้องเพิ่มด่านตรวจอัตโนมัติด้วย (กฎ 0.2 ข้อ 8)

เขียน `scripts/qa/test-will-change.ts` แล้วผูกเข้า `CHECKS` ของ `repo:verify`:

- สแกน `src/**/*.css` หา `will-change` ที่อยู่ใน selector ซึ่ง **ไม่ได้สื่อถึงสถานะกำลังอนิเมต**
  (ชื่อคลาสไม่มี `-entering` / `-active` / `-animating` / `:hover` / `:focus`)
- ใช้หลัก **Ratchet**: ใส่จุดที่ละเมิดอยู่เดิม (ถ้ามี) ไว้ใน `ALLOWLIST` พร้อมเลข ISSUE
  **ห้ามทำให้ CI พังทันที** (บทเรียน INC-0007)

## เกณฑ์ผ่าน

```js
// แผงตอนปิด ต้องไม่มี will-change
const p = document.getElementById('sacred-nav-panel');
console.assert(getComputedStyle(p).willChange === 'auto', 'FAIL: ยังจอง GPU layer ตอนปิด');

// เปิดแล้วต้องมี
document.querySelector('button[aria-controls="sacred-nav-panel"]').click();
console.assert(getComputedStyle(p).willChange.includes('opacity'), 'FAIL: ไม่มี will-change ตอนเปิด');
```

**บวก**: วัด fps ด้วย `requestAnimationFrame` ตอนเลื่อนหน้าแรกบนมือถือจริง **ก่อน/หลังแก้**
(กฎป้องกันถาวรจาก INC-0056: *"ทุกครั้งที่แตะเลเยอร์ลอย ต้องวัด fps ด้วย rAF ก่อน/หลัง ไม่ใช่ดูด้วยตา"*)

---

# 🟠 5. ISSUE-028 · `window.dispatchEvent` อยู่ใน state updater

## สาเหตุราก

โค้ดชุดเดียวกันซ้ำ 2 ที่:

[`src/components/ui/SacredNavDropdown.tsx:71-80`](../../src/components/ui/SacredNavDropdown.tsx#L71)

```tsx
const toggleDropdown = () => {
  soundManager.playMenuTapSound();
  setIsOpen((prev) => {
    const next = !prev;
    if (next) {
      window.dispatchEvent(new CustomEvent("tarot:close-menus", { detail: { except: "sacred-nav" } }));
    }
    return next;                                    // ← side effect อยู่ในนี้
  });
};
```

[`src/components/auth/UserProfileBadge.tsx:80-89`](../../src/components/auth/UserProfileBadge.tsx#L80) — โครงเดียวกันเป๊ะ (`except: "user-badge"`)

**ผิดหลักการ React**: updater function ที่ส่งให้ `setState` **ต้องเป็น pure function**
React สงวนสิทธิ์เรียกซ้ำได้หลายครั้ง (replay queue ตอน re-render, StrictMode ใน dev)

ผลที่ตามมา:
1. `tarot:close-menus` ถูกยิงซ้ำโดยไม่ตั้งใจ
2. `dispatchEvent` เป็น **synchronous** → handler ของอีก component เรียก `setState` ของตัวเอง
   **ระหว่างที่ React กำลังคำนวณ state ของ component นี้อยู่** — เป็นเส้นทางไปสู่ warning
   *"Cannot update a component while rendering a different component"*
3. อาการที่ผู้ใช้เจอ: **กดเมนูแล้วเปิดไม่ติดเป็นบางครั้ง** เพราะเมนูสั่งปิดตัวเองไปพร้อมกัน

> หมายเหตุ: ผมยังไม่พบ warning นี้บน production build (React ตัด warning ออกใน production)
> แต่โครงสร้างนี้ผิดหลักการชัดเจนและอธิบายอาการ "กดติดบ้างไม่ติดบ้าง" ได้ตรงที่สุด

## วิธีแก้ — ย้าย side effect ออกมาไว้ที่ handler

```tsx
const toggleDropdown = () => {
  soundManager.playMenuTapSound();

  // ⚠️ ห้ามยิง event / side effect ใด ๆ ข้างใน setState updater (ISSUE-028)
  // updater ต้องเป็น pure function — React เรียกซ้ำได้หลายครั้ง
  // อ่านค่าปัจจุบันจาก ref แล้วตัดสินใจตรงนี้แทน
  const willOpen = !isOpenRef.current;
  if (willOpen) {
    window.dispatchEvent(new CustomEvent("tarot:close-menus", { detail: { except: "sacred-nav" } }));
  }
  setIsOpen(willOpen);
};
```

โดยเพิ่ม ref ที่ sync กับ state:

```tsx
const [isOpen, setIsOpen] = useState(false);
const isOpenRef = useRef(isOpen);
useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);
```

**ต้องแก้ทั้ง 2 ไฟล์ให้เป็นรูปแบบเดียวกัน**

## เกณฑ์ผ่าน

1. รัน `npm run dev` (โหมด dev = StrictMode เปิด) → Console **ต้องไม่มี** warning
   `Cannot update a component while rendering a different component`
2. เปิดเมนูโปรไฟล์ค้างไว้ → กดเมนูหลัก → เมนูโปรไฟล์ต้องปิด **และเมนูหลักต้องเปิด** (ทั้งคู่ในครั้งเดียว)
3. สลับกันทำข้อ 2 กลับด้าน → ผลต้องเหมือนกัน
4. กดสลับสองเมนูไปมา 20 ครั้งรัว ๆ → ต้องไม่มีครั้งไหนที่ "กดแล้วไม่เปิด"

---

# 🟠 6. ISSUE-029 · `AuthModal` ไม่ได้กันกับดักที่ `Modal.tsx` เขียนเตือนไว้

## สาเหตุราก

[`src/components/ui/Modal.tsx:33-47`](../../src/components/ui/Modal.tsx#L33) เขียนคอมเมนต์เตือนไว้ยาวเหยียด
พร้อมชื่ออาการ 3 ข้อ และแก้ด้วย `onCloseRef`:

```tsx
// เก็บ onClose ล่าสุดไว้ใน ref เพื่อไม่ต้องใส่ใน dependency ของ effect ด้านล่าง
// ผู้เรียกเกือบทุกที่ส่ง arrow function ใหม่ทุกเรนเดอร์ (`onClose={() => setOpen(false)}`)
// ถ้าใส่ไว้ใน deps → effect เปิด/ปิดใหม่ทุกครั้งที่พ่อเรนเดอร์
const onCloseRef = useRef(onClose);
useEffect(() => { onCloseRef.current = onClose; });
```

อาการทั้ง 3 ที่ `Modal.tsx:41-47` ระบุไว้:
1. หน้าเว็บเลื่อนไม่ได้ถาวรหลังปิดโมดัล
2. **โฟกัสถูกดึงกลับไปที่ปุ่มปิดทุกครั้งที่พิมพ์** (ฟอร์มพิมพ์ได้ทีละตัวอักษร)
3. `previousActiveElement` ถูกเขียนทับ คืนโฟกัสผิดที่

**แต่ [`src/components/auth/AuthModal.tsx:114`](../../src/components/auth/AuthModal.tsx#L114) ไม่เคยได้รับการแก้นี้**:

```tsx
useEffect(() => {
  if (!isOpen) return;
  restoreFocusRef.current = document.activeElement as HTMLElement | null;
  const originalOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  // ...
  return () => {
    document.body.style.overflow = originalOverflow;
    window.removeEventListener("keydown", onKeyDown);
    cancelAnimationFrame(focusTimer);
    restoreFocusRef.current?.focus?.();          // ← ดึงโฟกัสออกทุกครั้งที่ effect รันใหม่
  };
}, [isOpen, onClose]);                           // ← ❌ onClose อยู่ใน deps
```

และ [`src/app/TarotFlow.tsx:1495-1503`](../../src/app/TarotFlow.tsx#L1495) ส่ง arrow function ใหม่ทุก render:

```tsx
<AuthModal
  isOpen={isAuthOpen}
  onClose={() => {                    // ← identity เปลี่ยนทุก render ของ TarotFlow
    setIsAuthOpen(false);
    refreshEntitlement();
  }}
  ...
/>
```

**ผลลัพธ์**: `TarotFlow` re-render เมื่อไหร่ (จาก `useSessionUser`, `useEntitlement`, toast, ฯลฯ)
effect ทั้งชุดจะ cleanup แล้วรันใหม่ → `restoreFocusRef.current?.focus?.()`
**ดึงโฟกัสออกจากช่องอีเมล/รหัสผ่าน** ตรงกับอาการที่ 2 ที่ `Modal.tsx` เตือนไว้เป๊ะ ๆ

## ⚠️ สิ่งที่ตรวจแล้วว่า "ไม่ใช่ปัญหา" — อย่าไปแก้เกิน

ผมไล่เช็ค scroll-lock ซ้อนกันทุกเส้นทางแล้ว:

| เส้นทาง | ผล |
| :--- | :-: |
| `AccessDialog.handlePrimary` → `onClose()` แล้ว `onBuyCredits()` | ✅ ปิดก่อนเปิด |
| `BuyCreditsModal.handleStartCheckout` → `onClose()` แล้ว `onRequireAuth()` | ✅ ปิดก่อนเปิด |
| React commit เดียวกัน | ✅ รัน cleanup ทั้ง commit **ก่อน** mount effect ทั้งหมด |

→ **`document.body.style.overflow` ไม่รั่ว** อาการที่ 1 (เลื่อนหน้าไม่ได้ถาวร) **ไม่เกิดขึ้นในโค้ดชุดปัจจุบัน**
แต่ยังต้องแก้ deps อยู่ดี เพราะอาการที่ 2 เกิดจริง และโครงสร้างนี้เปราะมาก
วันหลังใครเพิ่มเส้นทางเปิดโมดัลซ้อนขึ้นมาอีกเส้นเดียว อาการที่ 1 จะโผล่ทันที

## วิธีแก้ — ลอกรูปแบบจาก `Modal.tsx` มาตรง ๆ

```tsx
const onCloseRef = useRef(onClose);
useEffect(() => { onCloseRef.current = onClose; });

useEffect(() => {
  if (!isOpen) return;
  // ... ทุกจุดที่เรียก onClose() ให้เปลี่ยนเป็น onCloseRef.current()
  return () => { /* ... */ };
}, [isOpen]);                       // ← deps เหลือแค่ isOpen เท่านั้น
```

จุดที่ต้องเปลี่ยนเป็น `onCloseRef.current()`: [`AuthModal.tsx:84`](../../src/components/auth/AuthModal.tsx#L84) (ใน `onKeyDown` ตอนกด Escape)

## 🔒 ต้องเพิ่มด่านตรวจอัตโนมัติ (กฎ 0.2 ข้อ 8)

กฎนี้เขียนเป็นคอมเมนต์ไว้แล้วใน `Modal.tsx` **แต่ยังถูกละเมิดใน `AuthModal.tsx`**
= พิสูจน์แล้วว่า "เขียนคอมเมนต์เตือน" อย่างเดียวไม่พอ

เขียน `scripts/qa/test-modal-effect-deps.ts`:
- สแกนไฟล์ที่มี `document.body.style.overflow = "hidden"`
- ถ้า `useEffect` ก้อนนั้นมี `onClose` (หรือ prop ที่เป็น function) อยู่ใน dependency array → **fail**
- ใช้หลัก Ratchet ตามปกติ

## เกณฑ์ผ่าน

1. เปิด AuthModal บนหน้าแรก → พิมพ์อีเมลยาว ๆ 30 ตัวอักษรรวดเดียว → **ต้องพิมพ์ได้ครบไม่หลุดโฟกัส**
2. เปิด AuthModal ค้างไว้ 60 วินาที (ให้ `useSessionUser`/`useEntitlement` re-render หลายรอบ) → โฟกัสต้องไม่กระโดด
3. ปิด AuthModal → `document.body.style.overflow` ต้องกลับเป็นค่าว่าง
4. ตรวจว่า sticky header กลับมาทำงาน: `getComputedStyle(document.querySelector('[data-site-header]')).position === 'sticky'`

---

# 🔵 7. ISSUE-030 · ไม่มี `scroll-padding-top` ทั้งโปรเจกต์

## สาเหตุราก

ค้นทั้ง `src/` แล้วพบว่า **ไม่มี `scroll-padding-top` เลยแม้แต่ที่เดียว**
ทั้งที่หัวเว็บเป็น `position: sticky; top: 0` สูง **69px (มือถือ) / 81px (desktop)** — วัดจริงมาแล้ว

ผลคือ anchor `#hash` และ `scrollIntoView({ block: 'start' })` ทุกจุด **จะไปจอดใต้หัวเว็บ**
ผู้ใช้เห็นเป็น "หัวเว็บบังเนื้อหา / ค้างทับอยู่"

**หลักฐานว่าปัญหามีจริง**: [`src/components/reading/FollowUpChat.tsx:338`](../../src/components/reading/FollowUpChat.tsx#L338)
ต้องแปะ `scroll-mt-24` แก้เฉพาะจุดเอง — คือการรักษาอาการทีละจุดแทนที่จะแก้ที่ราก

## วิธีแก้

ประกาศความสูงหัวเว็บเป็นตัวแปรกลาง แล้วให้ `html` รู้จัก:

```css
:root {
  /* ความสูงจริงของ [data-site-header] — วัดได้ 69px มือถือ / 81px เดสก์ท็อป
     เผื่อระยะหายใจอีกเล็กน้อยกันตัวอักษรชนขอบล่างของหัวเว็บ */
  --site-header-h: 76px;
}

@media (min-width: 640px) {
  :root { --site-header-h: 88px; }
}

/*
 * ⚠️ หัวเว็บเป็น sticky top-0 ทับพื้นที่บนสุดของ viewport อยู่ตลอด (ISSUE-030)
 * ถ้าไม่ตั้ง scroll-padding-top ทุก anchor #hash และ scrollIntoView({block:'start'})
 * จะไปจอด "ใต้" หัวเว็บ ผู้ใช้เห็นเป็นหัวเว็บบังเนื้อหา
 * ห้ามไล่แปะ scroll-mt-* ทีละจุดแทน — นั่นคือรักษาอาการ ไม่ใช่แก้ราก
 */
html {
  overflow-x: clip;                       /* ← ของเดิม globals.css:135 ห้ามแตะ (INC-0067) */
  scroll-padding-top: var(--site-header-h);
}
```

จากนั้นถอด `scroll-mt-24` ที่ [`FollowUpChat.tsx:338`](../../src/components/reading/FollowUpChat.tsx#L338) ออก
เพราะกฎกลางครอบให้แล้ว (ทดสอบยืนยันก่อนถอด)

> ⚠️ **ห้ามแตะบรรทัด `overflow-x: clip`** ที่ [`globals.css:135`](../../src/app/globals.css#L135)
> นั่นคือกฎป้องกันถาวรจาก INC-0067 — เปลี่ยนเป็น `hidden` เมื่อไหร่ sticky ตายทันที

## เกณฑ์ผ่าน

```js
console.assert(
  getComputedStyle(document.documentElement).scrollPaddingTop !== 'auto',
  'FAIL: ยังไม่ได้ตั้ง scroll-padding-top'
);
```

**บวกการทดสอบด้วยมือ**: เปิดหน้าที่มี anchor `#hash` → กดลิงก์ในหน้า →
หัวข้อปลายทางต้องอยู่ **ใต้หัวเว็บพอดี มองเห็นเต็ม** ไม่ถูกบัง

---

## 📋 Checklist ปิดงาน (ทำครบทุกข้อก่อนบอกว่าเสร็จ)

- [ ] `npm run repo:verify` ผ่านครบทุกด่าน
- [ ] `npm run typecheck` — 0 errors
- [ ] ทดสอบบนมือถือจริง (ไม่ใช่ DevTools emulation) ครบทุกเกณฑ์ผ่านในเอกสารนี้
- [ ] วัด fps ด้วย rAF ก่อน/หลัง สำหรับ PR-A (บังคับตาม INC-0056)
- [ ] แนบตัวเลข React DevTools Profiler before/after สำหรับ PR-B
- [ ] เพิ่มด่านตรวจอัตโนมัติ 2 ตัว (`test-will-change.ts`, `test-modal-effect-deps.ts`) พร้อม ALLOWLIST แบบ Ratchet
- [ ] บันทึก INC-00xx ลง [`docs/INCIDENT_LOG.md`](../INCIDENT_LOG.md) ครบทุก PR (commit `fix` ต้องมี `--cause` + `--prevention`)
- [ ] อัปเดต [`docs/WORK_LOG.md`](../WORK_LOG.md) (กฎเหล็กข้อ 1)
- [ ] ปิด ISSUE-024 ถึง ISSUE-030 ใน [`docs/KNOWN_ISSUES.md`](../KNOWN_ISSUES.md)
- [ ] เปิด PR ด้วย `npm run pr:auto` ทุกใบ (กฎเหล็กข้อ 13 — **push เฉย ๆ ไม่นับ**)

---

## 🔍 สิ่งที่ยังตอบไม่ได้ และผู้รับช่วงต้องหาต่อ

รายงานตามจริงตามกฎ 0.2 ข้อ 5:

1. **ยังไม่ได้ยืนยันว่าอาการที่เจ้าของโปรเจกต์เจอ คือ ISSUE-024 หรือ ISSUE-025**
   ทั้งสองข้อให้อาการ "ค้าง" เหมือนกันแต่คนละกลไก **ต้องถามเจ้าของให้ชัดก่อนว่า**:
   กดเมนูแล้วไม่ขึ้น? / กด TH-EN แล้วนิ่ง? / เลื่อนหน้าแล้วกระตุก?

2. **ยังไม่ได้ทดสอบบนอุปกรณ์จริง** — ทดสอบผ่าน DevTools protocol บนเครื่อง desktop เท่านั้น
   และแท็บที่ใช้อยู่ในสถานะ `visibilityState: "hidden"` ซึ่งเป็นตัวแปรกวน

3. **ยังไม่ได้วัด fps จริงตอนเลื่อนหน้า** — `PerformanceObserver({entryTypes:['longtask']})` คืนค่าว่าง
   แต่เชื่อถือไม่ได้เพราะแท็บไม่ได้ paint ตัวเลข fps ที่แท้จริงยังไม่มี

4. **iOS Safari + `100dvh`** — แผงเมนูใช้ `max-h-[calc(100dvh-4.5rem)]`
   บน iOS ค่า `dvh` เปลี่ยนตอนแถบ URL ยุบ/ขยาย → แผงอาจเปลี่ยนขนาดกลางคัน
   **ยังไม่ได้ทดสอบบน iOS จริง** ถ้าเจ้าของใช้ iPhone ให้ตรวจข้อนี้เพิ่ม
