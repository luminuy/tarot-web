# ✦ แผนส่งต่องาน — หน้าแรก "ประตูเดียว" + ธีมกระจกอุ่น (Warm Liquid Glass)

> **ผู้จัดทำ**: Claude · 2026-09-21 · **ผู้รับช่วง**: ทีม/เอเจนต์ Frontend ตัวถัดไป
> **โค้ดอ้างอิง**: `main` = `250c41e` (PR #547) — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมา
> **ขนาดงาน**: ~4–6 ชม. · **1 PR** · แตะ **4 ไฟล์** (`globals.css` · `TarotFlow.tsx` · `SpreadCardSelector.tsx` · `QuickFortunePicker.tsx`)
> **ประเภท**: ธีม + จัดเรียง UI — **ห้ามแตะ** ตรรกะสุ่มไพ่ · `saveReading` · JSON-LD · โครงข้อมูลไพ่ · ระบบสิทธิ์

---

## 0. สิ่งที่เจ้าของเคาะแล้ว — ห้ามเปลี่ยนโดยไม่ถาม

| เรื่อง | ที่เคาะ |
| :--- | :--- |
| **ธีม** | **แบบ C · กระจกอุ่น (Warm Liquid Glass)** |
| **โครงหน้าแรก** | **แบบ 1 · ประตูเดียว (Single Door)** |
| **ข้อห้ามเด็ดขาด** | ห้ามใช้ `backdrop-filter` / `backdrop-blur` (INC-0056 · ด่านที่ 43) |

**ภาพเป้าหมายที่เจ้าของอนุมัติ** — ทำตามให้เหมือนสองหน้านี้:

- ธีม 4 แบบ (เลือกแบบ C): <https://claude.ai/artifact/XoU8rjaa1MrTBJgG9x8oQ3>
- โครงหน้าแรก 3 แบบ (เลือกแบบ 1): <https://claude.ai/artifact/29qzd2MbwCE8CxinF8zwHW>

> ⚠️ ลิงก์เป็นของส่วนตัวของเจ้าของ ถ้าเปิดไม่ได้ให้ขอไฟล์ HTML จากเจ้าของโดยตรง
> **ห้ามเดาหน้าตาเอง** — ทุกค่าที่ต้องใช้ถูกยกมาไว้ในเอกสารนี้ครบแล้วในหัวข้อ 2

---

## 1. ทำไมต้องทำ — ปัญหาที่วัดได้ ไม่ใช่ความรู้สึก

### 1.1 ทุกกล่องมีน้ำหนักสายตาเท่ากัน

`globals.css` ปัจจุบัน:

```css
.altar-panel          { background:#FFFFFF; border:1px solid #D5CEC2; box-shadow:var(--shadow-raised) }
.altar-card-porcelain { background:#FFFFFF; border:1px solid #D5CEC2; box-shadow:var(--shadow-raised) }
.altar-cloth          { background:#EAE7E0; border:1px solid #D5CEC2 }
```

สามคลาสนี้คือแผงหลัก · การ์ด · ผ้าปูไพ่ ใช้พื้น เส้น และเงา **ชุดเดียวกันทั้งหมด**
ผลคือไม่มีอะไรสำคัญกว่าอะไร ตาไม่รู้จะเกาะตรงไหนก่อน

### 1.2 เงาจางจนแทบไม่มีผล

```css
--shadow-raised: 0 1px 3px rgba(41,38,31,0.04), 0 6px 16px -2px rgba(41,38,31,0.06);
```

`0.04` / `0.06` คือเงาที่มองแทบไม่เห็นบนจอมือถือกลางแดด ทุกอย่างจึงแบนติดจอ

### 1.3 หน้าแรกมีทางเข้า 3 ทางซ้อนกัน และ `<h1>` อยู่ลำดับที่ 5

ลำดับปัจจุบันใน `TarotFlow.tsx` ขั้น `SPREAD_SELECT` (บรรทัด ~1465–1524):

```
1. <DailyCardStrip />          ← ทางเข้าที่ 1
2. <QuickFortunePicker />      ← ทางเข้าที่ 2
3. <h1> + คำโปรย + <h2>
4. <SpreadCardSelector />      ← ทางเข้าที่ 3 (ผัง 25 แบบ)
```

**หลักฐานว่านี่เป็นหนี้ที่รู้กันอยู่แล้ว** — `QuickFortunePicker.tsx:294` มีคอมเมนต์เขียนไว้ตรง ๆ ว่า:

> _"⚠️ ต้องเป็น `<p>` ไม่ใช่ `<h2>` (INC-0130) — บล็อกนี้อยู่ **เหนือ** `<h1>` ของหน้าแรก ถ้าเป็นหัวข้อจริงจะกลายเป็น…"_

แปลว่าตอนนี้เรา **ลดศักดิ์ของหัวข้อจริงลงเป็น `<p>`** เพียงเพื่อเลี่ยงด่านที่ 48 (`test-a11y-critical.ts`)
ซึ่งด่านนั้นก็เขียนไว้เองว่า _"`<h1>` ของหน้าแรกเป็นหัวข้อลำดับที่ 6 — พังทั้งโครงเอกสารของ screen reader และ outline ที่ Google อ่าน"_

**งานนี้แก้ที่ต้นเหตุ** พอ `<h1>` ขึ้นไปอยู่บนสุด ทั้งสองบล็อกจะกลับมาใช้หัวข้อจริงได้ (ดูข้อ 3.4)

---

## 2. งานที่ 1 — ธีมกระจกอุ่น (Warm Liquid Glass)

> 🔄 **อัปเดต 2026-09-21 (รอบ 115) — ค่าทั้งหมดในหัวข้อ 2.2 และ 2.4 ถูกแทนที่แล้ว**
> เจ้าของทักว่า "สียังไม่ค่อยสวย · liquid glass สวยได้กว่านี้ · หัวเว็บยังไม่สวย"
> จึงยกชุดค่าใหม่ทั้งธีม ค่าจริงที่ใช้อยู่ตอนนี้อ่านจาก `src/app/globals.css` เป็นหลัก
> (บล็อก `:root` ธีมกระจก · `body` · `.site-header-shell` · `.site-header-glass`)
> สรุปสิ่งที่เปลี่ยนและตัวเลขที่วัดใหม่อยู่ใน `docs/WORK_LOG.md` รอบ 115
> ของเดิมด้านล่างเก็บไว้เป็นประวัติว่าเริ่มจากอะไร — **อย่าคัดลอกไปใช้ซ้ำ**
>
> สามข้อที่ต้องรู้ก่อนแตะธีมนี้ต่อ:
> 1. **รัศมีแนวนอนของกลีบแสงต้องเป็น `%`** (ผ่านโทเคน `--glow-*-w`) ไม่ใช่ px — px ทำให้จอกว้างเห็นแสงเป็นหย่อมมุมเดียว
> 2. **ห้ามเขียน `max(560px, 92%)` ในตำแหน่งรัศมีของ `radial-gradient`** — Chromium ทิ้งทั้งประกาศเงียบ ๆ (`background-image: none`) พื้นหลังหายทั้งเว็บโดยไม่มี error
> 3. **หัวเว็บเป็นแถบกระจกลอย** — `<header>` ยังกางเต็มจอ (ด่านบังคับ) ส่วนที่เห็นคือ `<div class="site-header-glass">` ข้างใน · ความสูงจริงเปลี่ยนเป็น **76px มือถือ / 93px เดสก์ท็อป** ต้องวัดใหม่ทุกครั้งที่ขยับระยะ


### 2.1 หลักการ: กระจกที่ไม่ใช้ `backdrop-filter`

Liquid Glass ของจริงใช้ `backdrop-filter: blur()` ซึ่ง **บ้านนี้แบนถาวร** — วัดจริงสองรอบ:

| บทเรียน | ผลวัด |
| :--- | :--- |
| INC-0056 / INC-0060 | ถอด `backdrop-filter` ➔ fps **30 → 58** |
| รอบตรวจใหญ่ (26 จุด รวม `.altar-panel`) | CSS **135,475 → 124,134 ไบต์** · element ที่คำนวณ backdrop-filter **10 → 0** |

เราจึงสร้างลุคกระจกจาก **3 ชั้นที่ compositor วาดฟรี** แทน:

1. **พื้นโปร่ง** — สีขาวความทึบคงที่ (ไม่ใช่การเบลอ)
2. **ขอบสะท้อนแสง** — `border` ขาวโปร่ง + `inset` highlight บน/ล่าง
3. **พื้นหลังไล่สีนิ่ง** — radial-gradient ที่วาดครั้งเดียว ไม่ขยับ

### 2.2 ค่าที่ต้องใช้ — คัดลอกไปวางได้เลย ห้ามปรับเอง

เพิ่มในบล็อก `:root` ของ `src/app/globals.css` (วางถัดจากบล็อก `--shadow-*` เดิม):

```css
/* ═══ ธีมกระจกอุ่น (Warm Liquid Glass) — ค่าทั้งหมดคำนวณคอนทราสต์มาแล้ว ดูหัวข้อ 2.4 ═══
   🚨 ห้ามเติม backdrop-filter / backdrop-blur ที่ใดก็ตามในธีมนี้ (INC-0056 · ด่านที่ 43)
      ความเป็น "กระจก" มาจากความโปร่ง + ขอบสะท้อนแสง ไม่ได้มาจากการเบลอ */

/* พื้นของแผงกระจก — ค่านี้คือ "พื้นความทึบขั้นต่ำ" ห้ามลดลงต่ำกว่านี้เด็ดขาด
   เพราะคอนทราสต์ของตัวอักษรทุกตัวบนแผงคำนวณจากค่านี้ (ดู 2.4) */
--glass-fill: rgba(255, 255, 255, 0.58);

/* ประกายแสงบนผิวกระจก — เป็น background-image ทับบน --glass-fill อีกชั้น
   บวกความทึบเพิ่มเท่านั้น ไม่เคยลด จึงไม่ทำให้คอนทราสต์ตก */
--glass-sheen: linear-gradient(
  158deg,
  rgba(255, 255, 255, 0.30) 0%,
  rgba(255, 255, 255, 0) 55%,
  rgba(255, 255, 255, 0.14) 100%
);

--glass-edge: rgba(255, 255, 255, 0.78);   /* ขอบกระจกปกติ */
--glass-edge-on: #938265;                  /* ขอบตอนถูกเลือก/hover — 3.27:1 ผ่านเกณฑ์ non-text */
--glass-radius: 20px;

--glass-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset,
                0 -1px 0 rgba(46, 33, 26, 0.06) inset,
                0 18px 40px -14px rgba(78, 54, 32, 0.28);

--glass-shadow-lift: 0 1px 0 rgba(255, 255, 255, 0.95) inset,
                     0 -1px 0 rgba(46, 33, 26, 0.06) inset,
                     0 26px 54px -16px rgba(78, 54, 32, 0.38);
```

แก้โทเคนเงาเดิม (บรรทัด ~345–346) — ลึกขึ้นราว 3 เท่า:

```css
/* เดิม */
--shadow-raised: 0 1px 3px rgba(41, 38, 31, 0.04), 0 6px 16px -2px rgba(41, 38, 31, 0.06);
--shadow-overlay: 0 16px 48px -8px rgba(41, 38, 31, 0.16);

/* ใหม่ */
--shadow-raised: 0 1px 2px rgba(46, 33, 26, 0.05), 0 10px 24px -10px rgba(46, 33, 26, 0.20);
--shadow-overlay: 0 20px 52px -10px rgba(46, 33, 26, 0.26);
```

แก้โทเคนพื้นใน `@theme` (บรรทัด ~115):

```css
/* เดิม */  --color-canvas: #F3F0EA;
/* ใหม่ */  --color-canvas: #F2ECE1;   /* อุ่นขึ้นเล็กน้อย — ใช้เป็นพื้นทึบสำรองทุกจุดที่ยังเรียก bg-canvas */
```

**พื้นหลังไล่สีของทั้งเว็บ** — เพิ่มที่ `body` (ถ้ามี rule `body` อยู่แล้วให้เติมเข้าไป อย่าสร้างซ้ำ):

```css
body {
  background-color: var(--color-canvas);
  background-image:
    radial-gradient(60% 42% at 12% 6%,   rgba(255, 214, 150, 0.70) 0%, rgba(255, 214, 150, 0) 68%),
    radial-gradient(55% 38% at 92% 22%,  rgba(224, 196, 224, 0.38) 0%, rgba(224, 196, 224, 0) 66%),
    radial-gradient(70% 45% at 50% 104%, rgba(184, 210, 210, 0.42) 0%, rgba(184, 210, 210, 0) 70%),
    linear-gradient(170deg, #FBF1E2 0%, #EFE2CF 100%);
  background-repeat: no-repeat;
  /* 🚨 ห้ามใช้ background-attachment: fixed เด็ดขาด
     `fixed` บังคับให้เบราว์เซอร์วาดพื้นหลังใหม่ทุกเฟรมที่เลื่อนจอ
     ซึ่งเป็นความผิดพลาดแบบเดียวกับ backdrop-filter ใน INC-0056 เป๊ะ ๆ
     ค่าเริ่มต้น `scroll` วาดครั้งเดียวตามความสูงเอกสาร = ฟรีสำหรับ compositor */
}
```

**คลาสแผง** — แทนที่ของเดิมทั้งบล็อก (บรรทัด ~583–620):

```css
.altar-panel {
  background-color: var(--glass-fill);
  background-image: var(--glass-sheen);
  border: 1px solid var(--glass-edge);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
}

.altar-panel-active {
  background-color: var(--glass-fill);
  background-image: var(--glass-sheen);
  border: 1.5px solid var(--glass-edge-on);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
}

.altar-card-porcelain {
  background-color: var(--glass-fill);
  background-image: var(--glass-sheen);
  border: 1px solid var(--glass-edge);
  border-radius: var(--glass-radius);
  box-shadow: var(--glass-shadow);
  /* ⚠️ ห้ามเขียน `transition: all` เด็ดขาด — คงรายชื่อเดิมไว้ทั้งบรรทัด (ด่านที่ 43) */
  transition-property: border-color, box-shadow, transform;
  transition-duration: 0.2s;
  transition-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

.altar-card-porcelain:hover {
  border-color: var(--glass-edge-on);
  box-shadow: var(--glass-shadow-lift);
  transform: translateY(-2px);
}

/* ผ้าปูไพ่ — โปร่งกว่าแผง เพื่อให้ลำดับสายตาเป็น: ไพ่ > แผง > ผ้าปู */
.altar-cloth {
  background-color: rgba(255, 255, 255, 0.34);
  border: 1px solid rgba(255, 255, 255, 0.62);
  border-radius: var(--glass-radius);
}
```

**ปุ่มหลัก** — เพิ่มคลาสใหม่ (อย่าไปแก้ `bg-ink` ทั่วเว็บในรอบนี้):

```css
.btn-glass-primary {
  background-image: linear-gradient(180deg, #4A3526 0%, #33241A 100%);
  color: #FDF7EC;                 /* 13.99:1 — ผ่าน AAA */
  border-radius: 16px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.28) inset,
              0 12px 26px -10px rgba(51, 36, 26, 0.60);
}

.btn-glass-ghost {
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.80), rgba(255, 255, 255, 0.50));
  color: var(--color-ink);
  border: 1px solid var(--glass-edge);
  border-radius: 16px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.95) inset;
}
```

### 2.3 สิ่งที่ **ไม่ต้อง** แตะ

- `--color-ink` · `--color-muted` · `--color-gold-ink` — **คงเดิมทุกค่า** (ผ่านคอนทราสต์อยู่แล้ว ดู 2.4)
- `.card-back-pattern` — ลายหลังไพ่สวยอยู่แล้วและเข้ากับธีมนี้พอดี
- `.modal-scrim` — พื้นทึบล้วนตาม INC-0056 **ห้ามทำเป็นกระจก**
- ภาพไพ่ทุกจุด — **ห้ามใส่ CSS filter** กับภาพที่แสดงพร้อมกันหลายใบ

### 2.4 ตารางคอนทราสต์ที่คำนวณมาแล้ว — ใช้เป็นเกณฑ์รับงาน

คำนวณด้วยสูตร WCAG 2.1 จริง โดยไล่จุดที่ "มืดที่สุด" ของพื้นหลังไล่สีทั้งผืน (สุ่ม 51×51 จุด)

**จุดมืดที่สุดของพื้นหลัง = `#DBDCD0`** (กลีบสีเขียวอมฟ้าด้านล่างจอ)

| ตัวอักษร | บนพื้นเปล่า `#DBDCD0` | บนแผงกระจก `#F0F0EB` | เกณฑ์ |
| :--- | ---: | ---: | :--- |
| `--color-ink` `#29261F` | **10.90** ✅ | **13.23** ✅ | ≥4.5 |
| `--color-muted` `#635B4E` | **4.84** ✅ | **5.87** ✅ | ≥4.5 |
| `--color-gold-ink` `#8F5C1A` | **4.08** ❌ | **4.96** ✅ | ≥4.5 |
| `--color-gold` `#A58A5C` | 2.55 ❌ | 2.88 ❌ | ของประดับเท่านั้น |
| `--glass-edge-on` `#938265` (เส้นขอบ) | — | **3.27** ✅ | ≥3.0 |
| ปุ่มหลัก `#FDF7EC` บน `#33241A` | — | **13.99** ✅ | ≥4.5 |

> 🚨 **กฎที่เกิดจากตารางนี้** — `gold-ink` ได้แค่ 4.08 บนพื้นเปล่า
> **ตัวอักษรสีทองทุกขนาดต้องอยู่บนแผงกระจกเสมอ ห้ามวางลอยบนพื้นหลังไล่สีโดยตรง**
> (กฎเดิมที่ห้าม `text-gold` กับตัวอักษรเล็กยังบังคับใช้เหมือนเดิม — ด่าน `test-palette-drift.ts`)

### 2.5 กับดักที่ใหญ่ที่สุดของธีมนี้

**ด่าน `test-a11y-critical.ts` คำนวณคอนทราสต์จากค่าโทเคน ไม่ได้อ่านพิกเซลจริง**

แผงกระจกเป็นพื้น**โปร่ง** สีที่อยู่ใต้ตัวอักษรจริงจึงไม่ใช่ค่าโทเคนใด ๆ แต่เป็นผลของการผสม
แปลว่า **ด่านจะผ่านเขียวสนิทแม้คอนทราสต์จริงจะตก** — นี่คือความล้มเหลวแบบเงียบที่สุดของงานนี้

**วิธีกัน**: `--glass-fill` คือพื้นความทึบขั้นต่ำที่ทำให้ตารางข้างบนเป็นจริง
- ห้ามลดต่ำกว่า `0.58` ที่จุดใดของแผง
- `--glass-sheen` บวกความทึบอย่างเดียว (ทุก stop เป็นค่าบวก) ห้ามใส่ stop ที่ทำให้โปร่งกว่าพื้น
- ถ้าจะเพิ่มกลีบสีใหม่ในพื้นหลัง **ต้องคำนวณจุดมืดที่สุดใหม่** แล้วอัปเดตตาราง 2.4

---

## 3. งานที่ 2 — เรียงหน้าแรกใหม่เป็น "ประตูเดียว"

### 3.1 ลำดับใหม่

| | ก่อน | หลัง |
| ---: | :--- | :--- |
| 1 | `<DailyCardStrip />` | `<h1>` + คำโปรย |
| 2 | `<QuickFortunePicker />` | **ปุ่มเดียว "เริ่มดูดวงฟรี"** |
| 3 | `<h1>` + คำโปรย + `<h2>` | `<SpreadCardSelector variant="featured" />` (3 ผัง) |
| 4 | `<SpreadCardSelector />` (25 ผัง) | `<DailyCardStrip />` |
| 5 | — | `<QuickFortunePicker />` |
| 6 | `{seoContent}` | `{seoContent}` |

> 🔄 **ปรับอีกรอบแล้ว 2026-09-21 (รอบ 118) — ตารางข้างบนคือของ PR #556 ไม่ใช่ของจริงวันนี้**
> เจ้าของสั่งเพิ่มว่า "คนใช้เปิดด่วนเยอะกว่าผังใหญ่ อยากให้อยู่ส่วนแรก และการ์ดประจำวันอยู่ข้างบน"
> ลำดับปัจจุบันจึงเป็น: `<h1>` ➔ `<DailyCardStrip />` ➔ `<QuickFortunePicker />` ➔
> ปุ่ม "เริ่มดูดวงฟรี" ➔ `<SpreadCardSelector variant="featured" />` ➔ `{seoContent}`
> **ห้ามสลับกลับเป็นตารางข้างบนโดยไม่ถามเจ้าของ** — รายละเอียดอยู่ใน `docs/WORK_LOG.md` รอบ 118

### 3.2 ปุ่มเดียวทำอะไร

**ไม่ใช่ปุ่มเลื่อนจอ** — กดแล้วเริ่มดูดวงทันทีด้วยผังเริ่มต้น

`TarotFlow.tsx:277` ตั้งค่าเริ่มต้นไว้แล้ว:

```tsx
const [selectedSpread, setSelectedSpread] = useState<Spread>(PUBLIC_SPREADS[3]); // Default: 3-card
```

`PUBLIC_SPREADS[3]` = `three-card` (ยืนยันจาก `src/data/spreads.ts:118`)

ปุ่มจึงเรียกตรรกะชุดเดียวกับ `onProceed` ของ `SpreadCardSelector` ที่มีอยู่แล้ว **ห้ามเขียนใหม่**
ให้ยกออกมาเป็นฟังก์ชันเดียวแล้วเรียกจากทั้งสองที่:

```tsx
/**
 * เริ่มพิธีด้วยผังที่เลือกอยู่ — ใช้ร่วมกันระหว่างปุ่มหลักของ hero กับปุ่มใน SpreadCardSelector
 * ⚠️ ด่านสิทธิ์สามชั้นด้านล่างคือของเดิมทั้งหมด ห้ามตัดออกแม้แต่ชั้นเดียว
 */
const handleBeginReading = useCallback(() => {
  if (entitlementView?.blocked) {
    openAccessDialog(entitlementView.blockedReason ?? GUEST_BLOCK_REASON);
    return;
  }
  if (!isPassHolder && !isStandardSpread(selectedSpread.id)) {
    openAccessDialog("grand_spread");
    return;
  }
  soundManager.playCardSelectSound();
  scrollToSanctuaryTop();
  navigateStep("INTENTION_SELECT");
}, [entitlementView, isPassHolder, selectedSpread, openAccessDialog, navigateStep]);
```

มาร์กอัปของ hero:

```tsx
<div className="space-y-10">
  <div className="text-center space-y-2.5 sm:space-y-3 pt-2">
    <h1 className="text-2xl sm:text-4xl font-serif-th font-bold text-ink tracking-wide leading-snug sm:leading-normal pt-1 [text-wrap:balance]">
      {isEnglish ? "Interactive 1909 Rider-Waite Tarot with AI Oracle" : "ดูดวงไพ่ยิปซี ไพ่ทาโรต์ออนไลน์ ฟรี กับแม่หมอ AI"}
    </h1>
    <p className="text-xs sm:text-sm text-muted max-w-2xl mx-auto font-serif-th leading-relaxed [text-wrap:balance]">
      {/* คำโปรยเดิม — ห้ามเปลี่ยนข้อความ มีด่าน test-meta-length และ test-seo-wave* จับอยู่ */}
    </p>
  </div>

  <div className="flex flex-col items-center gap-2">
    <button
      type="button"
      onClick={handleBeginReading}
      className="btn-glass-primary tap-overlay-y w-full max-w-sm min-h-[48px] font-serif-th font-bold text-base cursor-pointer active:scale-[0.99]"
    >
      {isEnglish ? "Start Free Reading" : "เริ่มดูดวงฟรี"}
    </button>
    <span className="text-xs text-muted">
      {isEnglish ? "About 2 minutes · No sign-up needed to try" : "ใช้เวลา 2 นาที · ไม่ต้องสมัครก็ลองได้"}
    </span>
  </div>

  <SpreadCardSelector variant="featured" {...propsเดิมทั้งหมด} />
</div>
```

> ⚠️ **ปุ่มนี้ต้องเป็น `<button type="button">` เท่านั้น** ห้ามใช้ `<div onClick>`
> (ด่าน a11y และกฎของบ้านนี้: touch target ≥44px · โฟกัสด้วยคีย์บอร์ดได้)

### 3.3 ผัง 25 ➔ 3 บนหน้าแรก

เพิ่ม prop ใหม่ใน `SpreadCardSelector.tsx` (interface อยู่บรรทัด 49):

```tsx
/**
 * `"featured"` = โหมดหน้าแรก โชว์ 3 ผังที่คนเลือกบ่อย + ลิงก์ไปหน้ารวม
 * `"full"` (ค่าเริ่มต้น) = ของเดิมทุกอย่าง แท็บหมวดหมู่ครบ 5 แท็บ
 * ⚠️ ค่าเริ่มต้นต้องเป็น "full" เพื่อไม่ให้ผู้เรียกเดิมทุกจุดเปลี่ยนพฤติกรรมเอง
 */
variant?: "featured" | "full";
```

3 ผังที่เลือก และเหตุผล:

| id | ชื่อ | ทำไมอยู่ใน 3 อันนี้ |
| :--- | :--- | :--- |
| `three-card` | อดีต ปัจจุบัน อนาคต | เป็นผังเริ่มต้นของปุ่มหลักอยู่แล้ว (`PUBLIC_SPREADS[3]`) |
| `yes-no` | ใช่หรือไม่ | คำถามที่คนพิมพ์หาเยอะที่สุด — มีหน้า SEO 78 หน้ารองรับอยู่แล้ว |
| `love` | ความรัก | หมวดที่มีผังมากที่สุดในเว็บ (5 ผัง) = ความต้องการชัดที่สุด |

> ℹ️ **ไม่เอา `quick` (1 ใบ)** เพราะซ้ำหน้าที่กับ `QuickFortunePicker` ที่อยู่ล่างลงไปแล้ว
> ℹ️ **ถ้าอยากเปลี่ยน 3 ตัวนี้** มีข้อมูลจริงให้ดูแล้ว — `trackEvent("spread_select", …)` เก็บ `spread_id` ทุกครั้งที่มีคนเลือก

โหมด `featured` ต้อง:
- ซ่อนแถบแท็บหมวดหมู่ทั้งแถว (`categories`)
- แสดง 3 ผังเรียงเป็นแถวเดียว (มือถือ 3 คอลัมน์ · เดสก์ท็อป 3 คอลัมน์)
- มีลิงก์ท้ายบล็อก `<a href="/spreads">ดูผังทั้งหมด 25 แบบ</a>`
- **คงปุ่ม `onProceed` เดิมไว้** ผู้ใช้ที่เลือกผังจาก 3 อันนี้ยังกดเริ่มได้จากในบล็อก

> 🚨 **ห้ามใช้เลข 25 แบบฮาร์ดโค้ด** — ด่าน `test-docs-numbers.ts` และกฎใน `spreads-helpers.ts:68`
> บังคับให้นับจาก `PUBLIC_SPREADS.length` เสมอ

### 3.4 ของแถมที่ทำได้เพราะ `<h1>` ขึ้นบนแล้ว

พอลำดับเปลี่ยน ข้อจำกัดใน `QuickFortunePicker.tsx:294` และ `:385` ก็หมดไป:

```tsx
/* เดิม */  <p className="...">ทำนายด่วน 1 ใบ</p>     // ถูกบังคับให้เป็น <p> เพราะอยู่เหนือ h1
/* ใหม่ */  <h2 className="...">ทำนายด่วน 1 ใบ</h2>
```

**แต่ต้องทำครบ 3 อย่างพร้อมกัน ไม่งั้นพังเงียบ:**

1. เปลี่ยน `<p>` ➔ `<h2>` ที่ `QuickFortunePicker.tsx:294` และ `<p>` ➔ `<h3>` ที่ `:385`
2. **ลบคอมเมนต์ INC-0130 ทั้งสองจุดทิ้ง** แล้วเขียนใหม่ว่าทำไมตอนนี้เป็นหัวข้อจริงได้
   (ถ้าปล่อยคอมเมนต์เก่าไว้ เอเจนต์ตัวถัดไปจะอ่านแล้วแก้กลับ — บทเรียนซ้ำแบบ INC-0043)
3. ตรวจว่าไม่ข้ามลำดับ: `h1` ➔ `h2` ➔ `h3` ต้องไล่ทีละขั้น ด่านที่ 48 จับข้อนี้อยู่

> ⚠️ **ถ้าไม่มั่นใจ ให้ข้ามข้อ 3.4 ไปก่อน** — งานหลักคือข้อ 2 และ 3.1–3.3
> ปล่อยไว้เป็น `<p>` ไม่ได้ทำให้อะไรแย่ลงกว่าเดิม

---

## 4. กับดัก 7 ข้อที่เหยียบแน่ถ้าไม่อ่าน

| # | กับดัก | ทางกัน |
| :--- | :--- | :--- |
| 1 | เผลอเติม `backdrop-filter` เพราะ "มันคือ Liquid Glass" | ด่านที่ 43 บล็อกทันที · ความเป็นกระจกมาจากความโปร่ง+ขอบ ไม่ใช่การเบลอ |
| 2 | **ด่านคอนทราสต์ผ่านทั้งที่ของจริงตก** | ด่านอ่านค่าโทเคน ไม่ได้อ่านพิกเซล · ยึด `--glass-fill` เป็นพื้นขั้นต่ำเสมอ (2.5) |
| 3 | ใส่ `background-attachment: fixed` ให้พื้นหลังไล่สี | วาดใหม่ทุกเฟรมตอนเลื่อน = ความผิดพลาดเดียวกับ INC-0056 เป๊ะ |
| 4 | เขียนสีลงไปตรง ๆ แทนใช้โทเคน | ด่าน `test-palette-drift.ts` เป็น **ratchet** เพดาน 279 ห้ามเพิ่ม · เกินแล้วต้องใช้โทเคน ไม่ใช่ขยับเพดาน |
| 5 | เปลี่ยนคำโปรย/หัวข้อหน้าแรกไปด้วยตอนจัดเรียง | ด่าน `test-meta-length` · `test-seo-wave2/3/4` จับข้อความพวกนี้อยู่ · **ย้ายตำแหน่งได้ ห้ามแก้คำ** |
| 6 | ลืมว่า `.altar-*` ถูกใช้ทั้งเว็บ ไม่ใช่แค่หน้าแรก | `.altar-card-porcelain` ใช้ซ้ำ 16 จุด (หน้า `/daily` ใบเดียวมี 11 กล่อง) · ต้องไล่ดูทุกหน้าที่ใช้ |
| 7 | เปลี่ยน `<p>` เป็น `<h2>` แต่ไม่ลบคอมเมนต์เก่า | เอเจนต์ตัวถัดไปอ่านคอมเมนต์แล้วแก้กลับ · ต้องลบพร้อมกันเสมอ (3.4 ข้อ 2) |

---

## 5. เกณฑ์รับงาน — ต้องผ่านครบทุกข้อ

### ธีม
- [ ] `grep -rn "backdrop-filter\|backdrop-blur" src/` ได้ **0 จุด**
- [ ] `grep -rn "background-attachment: *fixed" src/` ได้ **0 จุด**
- [ ] `.altar-panel` · `.altar-panel-active` · `.altar-card-porcelain` · `.altar-cloth` มีหน้าตาต่างกันชัดเจน 3 ระดับ (ไม่ใช่ชุดเดียวกันเหมือนเดิม)
- [ ] `--glass-fill` ไม่ต่ำกว่า `0.58` ที่จุดใดของแผง
- [ ] ไม่มีตัวอักษร `gold-ink` / `text-gold` ลอยอยู่บนพื้นหลังไล่สีโดยไม่มีแผงรอง
- [ ] ภาพไพ่ทุกจุดยังไม่มี CSS filter

### โครงหน้าแรก
- [ ] `<h1>` เป็นหัวข้อ **แรก** ของ `<main>` (ด่านที่ 48 ตรวจ HTML ที่ build จริง)
- [ ] มี `<h1>` **หนึ่งเดียว** ในหน้า
- [ ] ปุ่ม "เริ่มดูดวงฟรี" เป็น `<button type="button">` · สูง ≥44px · โฟกัสด้วย Tab ได้ · มีวงโฟกัสที่มองเห็น
- [ ] กดปุ่มแล้วไปขั้น `INTENTION_SELECT` ด้วยผัง `three-card` ทันที
- [ ] **ด่านสิทธิ์ยังทำงานครบ 3 ชั้น** — ผู้ใช้ที่โควตาหมด/ไม่ได้ล็อกอิน/ผังใหญ่ ยังเจอหน้าต่างสิทธิ์เหมือนเดิม
- [ ] หน้าแรกโชว์ 3 ผัง + ลิงก์ไปหน้ารวม · จำนวนผังนับจาก `PUBLIC_SPREADS.length` ไม่ฮาร์ดโค้ด
- [ ] `DailyCardStrip` และ `QuickFortunePicker` ยังทำงานครบทุกฟังก์ชันหลังย้ายที่

### ด่านและตัวเลข
- [ ] `npm run typecheck` ผ่าน
- [ ] `npm run repo:verify` ผ่านครบทุกด่าน
- [ ] `test-palette-drift.ts` — จำนวนสีฮาร์ดโค้ด **ไม่เกิน 279** (ลดได้ ห้ามเพิ่ม)
- [ ] `test-motion-quality.ts` · `test-a11y-critical.ts` · `test-quick-fortune.ts` · `test-daily-card.ts` · `test-spreads.ts` ผ่านทุกด่าน
- [ ] `test-bundle-budget.ts` — **JS ต้องไม่เพิ่มขึ้นเลยสักไบต์** (งานนี้เป็นงาน CSS + สลับลำดับ ไม่ควรเพิ่ม JS)

### วัดผลจริงก่อนปิดงาน
- [ ] วัด fps ด้วย rAF บน **production build ที่ hydrate แล้ว** ก่อน–หลัง (หน้าที่ยังไม่ hydrate ให้ 60fps ปลอม)
- [ ] `npm run perf:lh` เทียบ TBT ของ `/` ก่อน–หลัง — **ห้ามแย่ลง**
- [ ] เปิดจริงบนมือถือ ตรวจว่าไม่มีข้อความทับกันและไม่มีกล่องล้นขอบ (กฎเหล็กข้อ 7 · ข้อ 9)

---

## 6. ลำดับลงมือ

```bash
npm run agent:status                                      # 1. เช็กว่าไม่ชน agent อื่น
npm run agent:lock -- --agent <ชื่อ> --domain ui \
  --files src/app/globals.css,src/components/home/TarotFlow.tsx

# 2. ทำงานที่ 1 (ธีม) ให้จบก่อน แล้ว commit แยก — จะได้ bisect ได้ถ้าหน้าตาเพี้ยน
# 3. ทำงานที่ 2 (จัดเรียง) แล้ว commit แยกอีกก้อน

npm run typecheck
npm run repo:verify
npm run agent:unlock -- --agent <ชื่อ>

npm run pr:auto -- "feat(ui): warm liquid glass theme + single-door homepage" "<รายละเอียด>"
```

> 🚨 **`push` แล้วจบ = งานยังไม่เสร็จ** (กฎเหล็กข้อ 13 · ISSUE-005)
> automation ทั้งชุดเริ่มทำงานเมื่อ **PR ถูกเปิด** เท่านั้น
> ถ้า environment ไม่มี `gh` CLI ให้เปิด PR ผ่าน GitHub API/MCP แทนให้สำเร็จ แล้วรายงานข้อจำกัดนั้นไปด้วย

**อย่าลืม**: อัปเดต `docs/WORK_LOG.md` ทุกครั้ง (กฎเหล็กข้อ 1) และถ้าแก้บั๊กระหว่างทาง
commit ต้องมี `--cause` กับ `--prevention` (กฎเหล็กข้อ 0 — ระบบบล็อกอัตโนมัติถ้าไม่มี)

---

## 7. งานที่ **ไม่อยู่** ในรอบนี้ — อย่าเผลอทำ

| เรื่อง | ทำไมถึงยังไม่ทำ |
| :--- | :--- |
| เปลี่ยนปุ่ม `bg-ink` / `bg-gold` ทั้งเว็บเป็นปุ่มกระจก | ขยายขอบเขตโดยไม่จำเป็น · รอบนี้เพิ่มแค่คลาสใหม่แล้วใช้กับ CTA หลักของหน้าแรก |
| โครงหน้าแรกแบบ 3 (ถามก่อน เลือกผังทีหลัง) | ต้องเขียนตัวจับคู่คำถาม➔ผังก่อน ซึ่งยังไม่มีในโค้ด · เจ้าของสนใจแต่ให้รอรอบถัดไป |
| ธีมมืด (แบบ A / D) | เจ้าของเลือกแบบ C แล้ว · ถ้าจะทำต้องกวาดสีฮาร์ดโค้ดที่เหลือ 279 จุดให้หมดก่อน |
| กวาดสีฮาร์ดโค้ด 279 จุดที่เหลือ | เป็นงานของตัวเอง ทำปนมาจะรีวิวไม่ไหว · ขอแค่ "ไม่เพิ่ม" ในรอบนี้ |
