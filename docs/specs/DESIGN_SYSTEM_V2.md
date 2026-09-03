# ✦ สเปกระบบดีไซน์ V2 — พื้นหลังและพาเลตต์สี (Warm Minimal Sanctuary)

> **สถานะ**: รออนุมัติเริ่มงาน · **ขอบเขต**: หน้าเว็บฝั่งผู้ใช้ทั้งหมด (ไม่รวม `/admin`)
> **ผู้รับงาน**: ทีมพัฒนา Frontend · **วันที่**: 2026-09-03
> **เอกสารที่ต้องอ่านคู่กัน**: [CLAUDE.md](../../CLAUDE.md) · [AI_COLLABORATION_GUIDELINES.md](../AI_COLLABORATION_GUIDELINES.md) · [INCIDENT_LOG.md](../INCIDENT_LOG.md)

---

## 0. สรุปสั่งงานใน 30 วินาที

1. ลบพื้นหลังแอนิเมชัน `<canvas>` ทั้งระบบ (3 ไฟล์) → แทนด้วย CSS นิ่งใน `body`
2. ยุบสีในโค้ดจาก **110 สี → 8 สี** ผ่านโทเคนกลางชุดเดียว
3. กลับด้านลำดับชั้นพื้นผิวให้ถูกหลักแสง (ของเดิมกลับด้านอยู่)
4. แก้คอนทราสต์ที่ตกมาตรฐาน WCAG **6 จุด** ให้ผ่านทั้งหมด
5. **ห้ามแตะ `/admin` และ `src/components/admin/`** — เป็นงานคนละก้อน (ดูข้อ 11)

---

## 1. ขอบเขตงาน (Scope)

### 1.1 อยู่ในขอบเขต ✅

| หมวด | เส้นทาง |
|---|---|
| หน้าเว็บ | `/` · `/tarot` · `/cards` · `/cards/[id]` · `/spreads` · `/blog` · `/blog/[slug]` · `/readers` · `/readers/[id]` · `/readers/console` · `/readers/queue/[id]` · `/account` · `/privacy` · `/reset-password` · `/tester` |
| ไฟล์ธีมกลาง | `src/app/globals.css` · `src/app/layout.tsx` · `src/app/manifest.ts` |
| คอมโพเนนต์ | `src/components/**` ทั้งหมด **ยกเว้น** `src/components/admin/**` |
| หน้า error | `src/app/error.tsx` · `src/app/global-error.tsx` |

### 1.2 อยู่นอกขอบเขต ❌ (ห้ามแตะในงานนี้)

| รายการ | เหตุผล |
|---|---|
| `src/app/admin/**` · `src/app/admin/layout.tsx` | ยังเป็นธีมมืด/ม่วง แยกเป็นงานต่างหาก มี 222 hex + สีม่วง `#9c93b8` |
| `src/components/admin/**` | เหตุผลเดียวกัน |
| `src/lib/email/templates.ts` (16 hex) | เป็น HTML อีเมล ต้องใช้ inline style และรองรับ mail client เก่า ไม่ใช้ระบบโทเคน |
| ภาพไพ่ใน `public/cards/` | ห้ามแตะเด็ดขาด (กฎเหล็กข้อ 5 — 1909 Rider-Waite เท่านั้น) |
| โลโก้แบรนด์บุคคลที่สาม | ดูข้อ 7.4 |

---

## 2. ปัญหาที่ต้องแก้ (หลักฐานจากโค้ดจริง)

| # | ปัญหา | หลักฐาน |
|---|---|---|
| P1 | **ตารางสีไม่ตรงกับที่แสดงจริง** — โทเคนใน `@theme` แทบไม่ถูกใช้ | `--color-cta-gold: #B8863B` ถูกใช้ **3 ครั้ง** ขณะที่โค้ด hardcode `#CD9F5B` **541 ครั้ง** |
| P2 | **พื้นหลังจริงไม่อยู่ในตารางเลย** | `MysticBackground` วาง `<canvas fixed inset-0>` ทับ `body` ทุกหน้า วาดด้วย `rgba(255,255,255,.8)` → `rgba(245,239,230,.98)` ซึ่งไม่ใช่ค่าใดในตาราง |
| P3 | **แอนิเมชันวิ่งตลอดเวลา** | `requestAnimationFrame` ใน `GalaxyCanvas` + `MysticAltarCanvas` ทำงานบน ~15 หน้า ไม่มีวันหยุด (85% ผู้ใช้เป็นมือถือ) |
| P4 | **ลำดับชั้นกลับด้าน** | `Inner Card #FDFBF7` **สว่างกว่า** `Canvas #FAF8F5` ทั้งที่ของที่จมลงต้องเข้มขึ้น → สมองอ่านมิติไม่ออก หน้าจึงดูแบนและเลอะ |
| P5 | **สีเยอะเกิน 110 สี** | รวม 2,550 ครั้งการใช้ · มี 8 คู่ที่ ΔE < 8 (คนละค่าในโค้ด แต่ตามองเป็นสีเดียวกัน) |
| P6 | **คอนทราสต์ตก WCAG AA 6 จุด** | ดูตาราง 2.1 |
| P7 | **ทอง 14 เฉด** | `CD9F5B · C5A059 · B8853E · B8863B · D4AF37 · FFD700 · E5C07B · D6B48D · F5DEAA · E4C09F · 8C5E28 · A27B14 · C59B27 · D4A72C` → ทุกอย่างเป็นทอง = ไม่มีอะไรเด่น |
| P8 | **PWA splash เป็นสีดำ** | `manifest.ts` ยังตั้ง `background_color: "#05040a"` จากธีมมืดเก่า ขณะที่เว็บเป็นครีม |

### 2.1 คอนทราสต์ที่ตกมาตรฐาน (ต้องได้ ≥ 4.5:1 สำหรับตัวอักษร)

| คู่สี | บริบท | ค่าปัจจุบัน | สถานะ |
|---|---|---:|---|
| `#CD9F5B` บน `#FFFFFF` | ตัวอักษรทอง (ใช้ **244 ครั้ง**) | 2.41 | ❌ ตก |
| `#FDF7F0` บน `#CD9F5B` | ตัวอักษรบนปุ่มทอง (**84 ครั้ง**) | 2.27 | ❌ ตกหนัก |
| `#FFFFFF` บน `#D4AF37` | ตัวอักษรบนไล่สีกลางปุ่ม `.btn-gold` | 2.10 | ❌ ตกหนัก |
| `#5A432F` บน `#CD9F5B` | `Button variant="gold"` | 3.82 | ❌ ตก |
| `#8C735D` บน `#FDF7F0` | ตัวอักษรรอง (**201 ครั้ง**) | 4.18 | ❌ ตก |
| `#D6B48D` บน `#FFFFFF` | เส้นขอบ (**430 ครั้ง**) | 1.95 | ⚠️ ขอบแทบหาย |

---

## 3. ระบบโทเคนใหม่ (8 สี)

### 3.1 นิยาม

| โทเคน | HEX | บทบาท | ใช้เมื่อไหร่ |
|---|---|---|---|
| `canvas` | `#F6F1E9` | พื้นหน้าเว็บ | พื้นหลังชั้นล่างสุด **ชั้นเดียวทั้งเว็บ ไม่มีข้อยกเว้น** |
| `surface` | `#FFFFFF` | พื้นผิวที่ลอยขึ้น | การ์ด · แผง · โมดัล · header |
| `inset` | `#F0E8DB` | พื้นผิวที่จมลง | โซนแท่นบูชา · ช่องกรอก · กล่องคำทำนาย · กล่องซ้อนในการ์ด |
| `line` | `#E4D8C4` | เส้นขอบและเส้นคั่น | ขอบ 1px **ระดับเดียว ไม่มี opacity modifier** |
| `ink` | `#2E211A` | ตัวอักษรหลัก | หัวข้อ + เนื้อหา + ไอคอนหลัก |
| `muted` | `#6F5B4A` | ตัวอักษรรอง | คำอธิบาย · วันที่ · placeholder · หมายเหตุ |
| `gold` | `#8F5C1A` | สีเน้นเดียวของเว็บ | ตัวอักษรทอง · ไอคอน · ปุ่มหลัก · focus ring |
| `ok` / `err` | `#3A7044` / `#A6392C` | สถานะ | สำเร็จ / ผิดพลาด |

**สถานะย่อยของ `gold`** (ไม่นับเป็นสีใหม่ — เฉดเดียวกัน คนละน้ำหนัก):

| ชื่อ | HEX | ใช้กับ |
|---|---|---|
| `gold-deep` | `#74490F` | `:hover` / `:active` ของปุ่มหลัก |
| `gold-wash` | `rgba(143,92,26,0.08)` | พื้นอ่อนของ badge/chip ทอง |

### 3.2 ค่าคอนทราสต์ที่ต้องได้หลังแก้ (ตรวจได้ทุกช่อง)

| | บน `canvas` | บน `surface` | บน `inset` |
|---|---:|---:|---:|
| `ink` | 13.85 | 15.57 | 12.81 |
| `muted` | 5.71 | 6.42 | 5.28 |
| `gold` | 5.03 | 5.65 | 4.65 |
| `ok` | 5.22 | 5.86 | 4.82 |
| `err` | 5.76 | 6.48 | 5.33 |

| คู่อื่น | ค่า |
|---|---:|
| `#FFFFFF` บน `gold` (ปุ่มหลัก) | 5.65 |
| `#FFFFFF` บน `gold-deep` (hover) | 7.77 |

> **ผ่าน WCAG AA ทุกช่อง** — ห้ามเพิ่มคู่สีใหม่ที่ไม่ได้อยู่ในตารางนี้ ถ้าจำเป็นต้องเพิ่ม ให้คำนวณคอนทราสต์แนบมาใน PR

### 3.3 ระยะห่างเชิงสายตาระหว่างชั้น (ΔE)

| คู่ | ΔE | อ่านได้ว่า |
|---|---:|---|
| `canvas` → `surface` | 6.5 | เห็นว่าเป็นการ์ดทันที (เดิม 2.9 = มองไม่ออก) |
| `canvas` → `inset` | 4.2 | เห็นว่าจมลง แต่ไม่สะดุด |
| `surface` → `inset` | 10.6 | ชัดเจน |
| `line` บน `surface` | 17.4 | ขอบเห็นได้โดยไม่ดัง (เดิม 1.95 contrast = ขอบหาย) |

---

## 4. พื้นหลังใหม่ (ส่วนที่สำคัญที่สุดของงานนี้)

### 4.1 หลักคิด

ดาวและกาแล็กซี่เป็นภาษาของ **โหราศาสตร์** (อ่านจากท้องฟ้า)
ทาโรต์อ่านจากของที่จับต้องได้: **กระดาษพิมพ์ปี 1909 · ผ้าที่ปูรองไพ่ · แสงเทียนหนึ่งดวง**

ในสำรับ Rider-Waite 78 ใบ ไม่มีภาพกาแล็กซี่แม้แต่ใบเดียว — พื้นหลังเดิมจึงไม่ใช่แค่ "ไม่มินิมอล" แต่ **ผิดระบบสัญลักษณ์** และของทั้งสามอย่างของทาโรต์เป็นของนิ่งทั้งหมด จึงเข้ากับมินิมอลโดยไม่ต้องฝืน

**กฎที่ใช้ตัดสินทุกจุด: หนึ่งโซน หนึ่งท่าที**

### 4.2 พื้นหน้าเว็บ — เขียนใน `globals.css` เท่านั้น

```css
html,
body {
  background-color: #F6F1E9;                    /* canvas */
  color: #2E211A;                               /* ink */
  font-family: var(--font-sans-th);
  line-height: 1.618;
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

/* ชั้นที่ 1 — แสงเทียนเหนือแท่นบูชา (นิ่ง ไม่ขยับ) */
body {
  background-image: radial-gradient(
    120% 75% at 50% -8%,
    #FFFDF9 0%,
    rgba(255, 253, 249, 0) 62%
  );
  background-attachment: fixed;
  background-repeat: no-repeat;
}

/* ชั้นที่ 2 — เนื้อผ้าลินิน (SVG นิ่ง ไม่มี JS ไม่มีเฟรม) */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.055;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
}

/* เนื้อหาทุกอย่างต้องอยู่เหนือชั้นลินิน */
body > * {
  position: relative;
  z-index: 1;
}
```

**ข้อกำหนดของชั้นลินิน**
- `opacity` ต้องอยู่ระหว่าง **0.045 – 0.070** เท่านั้น — เกิน 0.08 เมื่อไหร่จะกลายเป็นจอทีวีไม่มีสัญญาณ
- ห้ามเปลี่ยนเป็นไฟล์ `.png` — SVG data-URI ขนาด ~200 ไบต์ ไม่ต้องโหลดเพิ่ม 1 request
- ห้ามใส่ `animation` หรือ `transition` ให้ชั้นนี้เด็ดขาด

### 4.3 โซนแท่นบูชา (ผ้าปูไพ่) — ใช้เฉพาะที่ไพ่วางจริง

ที่ที่ต้องใช้: `SpreadBoard` · `SpreadCardSelector` · `InteractiveCardFan` · `ShuffleRitual`

```css
.altar-cloth {
  background: #F0E8DB;              /* inset — จมลง 1 ชั้น */
  border: 1px solid #E4D8C4;        /* line */
  border-radius: 8px;
}
```

> ⚠️ **ห้ามเอา `.altar-cloth` ไปปูทั้งหน้า** — ถ้าปูทั้งหน้าจะย้อนกลับไปเลอะเหมือนเดิมทันที
> มันมีหน้าที่ประกาศว่า "ตรงนี้คือโต๊ะ" เพื่อให้ไพ่มีที่ยืน ไม่ใช่เพื่อตกแต่ง

### 4.4 ลำดับชั้นพื้นผิว (Elevation) — ห้ามผิดลำดับ

```
inset   #F0E8DB   ← จมลง  (เข้มสุด)  ช่องกรอก · โซนแท่นบูชา · กล่องซ้อนใน
canvas  #F6F1E9   ← พื้น              พื้นหน้าเว็บ
surface #FFFFFF   ← ลอยขึ้น (สว่างสุด) การ์ด · โมดัล · header
```

**กฎ**: ของที่จมลงได้รับแสงน้อยกว่า จึง**ต้องเข้มกว่า**พื้นเสมอ
ของเดิมทำกลับด้าน (`Inner Card #FDFBF7` สว่างกว่า `Canvas #FAF8F5`) ซึ่งคือสาเหตุที่หน้าดูแบน

### 4.5 สิ่งที่ต้องลบทิ้ง

| ไฟล์ | ทำอะไร |
|---|---|
| `src/components/ui/GalaxyCanvas.tsx` | **ลบทั้งไฟล์** |
| `src/components/ui/MysticAltarCanvas.tsx` | **ลบทั้งไฟล์** |
| `src/components/ui/MysticBackground.tsx` | **ลบทั้งไฟล์** |

จากนั้นลบ `import` และ `<MysticBackground />` ออกจากทุกไฟล์ที่เรียกใช้:

```
src/app/page.tsx · src/app/cards/page.tsx · src/app/cards/[id]/page.tsx
src/app/spreads/page.tsx · src/app/readers/page.tsx · src/app/readers/[id]/page.tsx
src/app/readers/console/page.tsx (4 จุด) · src/app/readers/queue/[id]/page.tsx (3 จุด)
```

> ตรวจให้ครบด้วย: `grep -rn "MysticBackground\|GalaxyCanvas\|MysticAltarCanvas" src`
> ต้องไม่เหลือผลลัพธ์เลย

---

## 5. ตารางแปลงสี (Migration Map)

> **สำคัญ**: การแปลงต้องดู **บริบท** ไม่ใช่ค้นหา-แทนที่ตรง ๆ
> สีเดียวกันในบริบทต่างกันแปลงเป็นคนละค่า (เช่น `#FDF7F0` เป็นได้ทั้งพื้นและตัวอักษร)

### 5.1 สีหลัก (ครอบคลุม 2,081 จาก 2,550 ครั้ง)

| สีเดิม | บริบท | จำนวน | แปลงเป็น |
|---|---|---:|---|
| `text-[#CD9F5B]` | ตัวอักษร/ไอคอนทอง | 244 | `text-[#8F5C1A]` (gold) |
| `bg-[#CD9F5B]` | พื้นปุ่มหลัก · badge | 97 | `bg-[#8F5C1A]` (gold) |
| `border-[#CD9F5B]` | ขอบตอน hover/focus | 111 | `border-[#8F5C1A]` (gold) |
| `ring-[#CD9F5B]` | focus ring | 64 | `ring-[#8F5C1A]` (gold) |
| `from/via/to-[#CD9F5B]` | ไล่สี | 21 | **ลบไล่สี** → สีทึบ `#8F5C1A` |
| `border-[#D6B48D]` + `/20`…`/70` | ขอบทั่วไป | 430 | `border-[#E4D8C4]` (line) **ทึบ ไม่มี `/opacity`** |
| `text-[#5A432F]` | เนื้อหา/หัวข้อ | 320 | `text-[#2E211A]` (ink) |
| `bg-[#5A432F]` | scrim โมดัล | 12 | ดูข้อ 6.3 |
| `text-[#8C735D]` | คำอธิบาย | 201 | `text-[#6F5B4A]` (muted) |
| `placeholder:text-[#8C735D]/60` | placeholder | 9 | `placeholder:text-[#6F5B4A]` **ไม่มี opacity** |
| `bg-[#FDF7F0]` | พื้นหลัง | 108 | ดู 5.2 |
| `text-[#FDF7F0]` | ตัวอักษรบนปุ่มทอง | 84 | `text-white` |
| `bg-[#FCF0E6]` | พื้นหลัง | 134 | `bg-[#F6F1E9]` (canvas) |
| `bg-[#FFFFFF]` | การ์ด | 141 | คงเดิม = `surface` ✅ |

### 5.2 `#FDF7F0` — ต้องแยกตามบริบท (108 ครั้ง)

| ถ้าใช้เป็น | แปลงเป็น |
|---|---|
| พื้นหลังหน้า/section | `bg-[#F6F1E9]` (canvas) |
| พื้นการ์ดที่ลอยขึ้น | `bg-white` (surface) |
| พื้นช่องกรอก · กล่องซ้อนใน · โซนแท่นบูชา | `bg-[#F0E8DB]` (inset) |
| ตัวอักษรบนพื้นทอง | `text-white` |

### 5.3 ทองที่เหลือ — ยุบทั้งหมดเหลือเฉดเดียว

| สีเดิม | จำนวน | แปลงเป็น |
|---|---:|---|
| `#B8853E` | 52 | `bg` → `#74490F` (gold-deep, ใช้กับ hover), `text` → `#8F5C1A` |
| `#E5C07B` | 49 | `border` → `#E4D8C4`, `text/fill/stroke` → `#8F5C1A` |
| `#FFD700` | 56 | `#8F5C1A` (ทุกบริบท รวม `fill`/`stroke` ใน SVG) |
| `#E4C09F` | 34 | `bg` → `#F0E8DB` (inset) |
| `#C5A059` | 32 | `#8F5C1A` |
| `#F5DEAA` | 26 | ตัวอักษรบนพื้นทอง → `text-white`, อื่น ๆ → `#8F5C1A` |
| `#D4AF37` · `#D4A72C` · `#C59B27` · `#B8863B` · `#8C5E28` · `#A27B14` | 24 | `#8F5C1A` |
| `#7C6553` | 15 | `#6F5B4A` (muted) |
| `#231812` | 15 | `#2E211A` (ink) |
| `#FAF8F5` · `#FDFBF7` · `#F5EFEB` · `#FCEEEA` · `#F3E8D2` · `#F7E7B4` | 27 | เลือก `canvas` / `surface` / `inset` ตามบริบท |
| `#382518` | 2 | คงเดิม — เป็นสีหลังไพ่ ดูข้อ 7.3 |

### 5.4 สถานะ — เลิกใช้สี Tailwind เริ่มต้น (โทนเย็น ตัดกับธีมอุ่น)

| สีเดิม | จำนวน | แปลงเป็น |
|---|---:|---|
| `#10B981` · `#06C755`* · `#2D5A27` · `#1E7E34` | 25 | `#3A7044` (ok) |
| `#EBF3ED` · `#F0FFF4` | 4 | `rgba(58,112,68,0.08)` (พื้นอ่อนสถานะสำเร็จ) |
| `#F43F5E` · `#EF4444` · `#F0A0A0` · `#FDA4AF` · `#8C3B2D` · `#A04515` | 20 | `#A6392C` (err) |
| `#FFF8F8` | 1 | `rgba(166,57,44,0.07)` (พื้นอ่อนสถานะผิดพลาด) |
| `#EAB308` · `#F59E0B` · `#F97316` | 4 | `#8F5C1A` (gold — ใช้เป็นสีเตือน) |
| `#EC4899` · `#A855F7` · `#38BDF8` · `#F472B6` | 19 | `#8F5C1A` (gold) |

\* `#06C755` ที่เป็น **ปุ่ม LINE** ห้ามแปลง — ดูข้อ 7.4

### 5.5 ธีมมืด/ม่วงที่ค้างอยู่ — ลบทิ้ง

| สีเดิม | จำนวน | ที่พบ | ทำอะไร |
|---|---:|---|---|
| `#9C93B8` · `#C3BDD8` · `#CFC8E2` · `#C5BED8` · `#E2D9F3` | 28 | คอมโพเนนต์ที่ยังไม่ได้แปลงจากธีมเก่า | → `#6F5B4A` (muted) |
| `#05040A` · `#0C0818` · `#0B0714` · `#0D0818` · `#130D24` · `#140E26` · `#191230` · `#21163B` · `#2D1F4D` · `#4A3B82` | 25 | พื้นหลังมืด/scrim เก่า | → `canvas` / `surface` ตามบริบท · scrim ดูข้อ 6.3 |
| `#000000` | 6 | เงา/scrim | → `rgba(46,33,26,…)` |

---

## 6. ระบบคอมโพเนนต์

### 6.1 ปุ่ม — ต้องมีลำดับชั้นชัดเจน (ปัญหาเดิม: ปุ่มทุกระดับเป็นทองหมด)

แก้ที่ [`src/components/ui/Button.tsx`](../../src/components/ui/Button.tsx) ให้เป็นแหล่งความจริงเดียว

| variant | ใช้เมื่อไหร่ | สเปก |
|---|---|---|
| `gold` (Primary) | **1 ปุ่มต่อหน้าจอเท่านั้น** — "เปิดคำทำนาย", "เริ่มดูดวง" | `bg-[#8F5C1A] text-white` · hover `bg-[#74490F]` · **ไม่มีไล่สี ไม่มีเงาทอง** |
| `outline` (Secondary) | ปุ่มรอง — "สับไพ่ใหม่", "ดูไพ่ทั้งหมด" | `bg-white text-[#2E211A] border border-[#E4D8C4]` · hover `border-[#8F5C1A]` |
| `ghost` (Tertiary) | ปุ่มระดับสาม — "ยกเลิก", "ปิด" | `bg-transparent text-[#6F5B4A]` · hover `bg-[rgba(143,92,26,0.08)] text-[#2E211A]` |
| `pill` | ตัวกรอง/แท็ก | `bg-[#F0E8DB] text-[#2E211A] border border-[#E4D8C4] rounded-full` · เมื่อเลือก → `bg-[#8F5C1A] text-white` |

**ต้องลบทิ้งจาก `Button.tsx`**
- `bg-gradient-to-r from-[#CD9F5B] via-[#E4C09F] to-[#CD9F5B]` → สีทึบ
- `shadow-[0_4px_16px_rgba(205,159,91,0.28)]` และ `hover:shadow-[0_6px_22px_rgba(205,159,91,0.4)]` → เงาทองฟุ้งทำให้ดู "ทองพลาสติก"
- `text-[#5A432F]` บนพื้นทอง (คอนทราสต์ 3.82 ตก) → `text-white` (5.65 ผ่าน)

ลบคลาส `.btn-gold` ใน `globals.css` (บรรทัด ~363) ทิ้ง แล้วให้ทุกที่เรียกผ่าน `<Button>` แทน

### 6.2 Header

```
เดิม: bg-[#FFFFFF]/85 backdrop-blur-xl shadow-[0_4px_24px_rgba(90,67,47,0.04)]
      → ขาวโปร่งบนครีมเกือบขาว = มองไม่เห็นเส้นแบ่ง

ใหม่: bg-white border-b border-[#E4D8C4]
      → ทึบ + ขอบล่างชัด · ไม่ต้องใช้ backdrop-blur (ประหยัด GPU บนมือถือด้วย)
```

### 6.3 Scrim ของโมดัล

```
เดิม: bg-[#5A432F]/40 backdrop-blur-md   → น้ำตาล 40% = ขุ่น ไม่ใช่มืด
ใหม่: bg-[#2E211A]/50 backdrop-blur-[3px]
```

ที่ต้องแก้: `Modal.tsx` · `AuthModal.tsx` · `ShareModal.tsx` · `ReadingHistoryModal.tsx` · `TarotEncyclopediaModal.tsx` (2 จุด) · `CardZoomModal.tsx` · `BookQueueModal.tsx` · `BuyCreditsModal.tsx` · `AccessDialog.tsx`

### 6.4 เงา — เหลือ 2 ระดับ (ปัจจุบันมี 44 แบบไม่ซ้ำกัน)

```css
/* globals.css */
:root {
  --shadow-raised: 0 1px 2px rgba(46, 33, 26, 0.04), 0 4px 12px -2px rgba(46, 33, 26, 0.06);
  --shadow-overlay: 0 12px 40px -8px rgba(46, 33, 26, 0.18);
}
```

| ระดับ | ใช้กับ |
|---|---|
| `--shadow-raised` | การ์ด · แผง · header |
| `--shadow-overlay` | โมดัล · dropdown · popover |

**ห้ามใช้ `shadow-[...]` แบบ arbitrary ใหม่เด็ดขาด** · **ห้ามใช้เงาสีทอง** (`rgba(205,159,91,…)`) — เงาต้องเป็นสีน้ำตาลกลางเสมอ

### 6.5 มุมโค้ง — เหลือ 3 ค่า (ปัจจุบันมี 11 แบบ)

| โทเคน | ค่า | ใช้กับ |
|---|---|---|
| `rounded-md` | 8px | ช่องกรอก · ปุ่ม · chip |
| `rounded-2xl` | 16px | การ์ด · แผง · โมดัล |
| `rounded-full` | — | avatar · pill · badge วงกลม |

แปลง: `rounded-[1.618rem]` (45 ครั้ง) · `rounded-xl` (136) · `rounded-3xl` (7) · `rounded-lg` (32) · `rounded-sm` (2) → เข้า 3 ค่าข้างบน
> `rounded-full` (184 ครั้ง) คงไว้ตามเดิม

### 6.6 Focus ring

```css
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px #F6F1E9, 0 0 0 4px #8F5C1A !important;
}
```

---

## 7. เมตาดาต้าและข้อยกเว้น

### 7.1 `src/app/layout.tsx`

```diff
- themeColor: "#FCF0E6",
+ themeColor: "#F6F1E9",
```

### 7.2 `src/app/manifest.ts` — บั๊ก P8

```diff
- background_color: "#05040a",
- theme_color: "#05040a",
+ background_color: "#F6F1E9",
+ theme_color: "#F6F1E9",
```

### 7.3 หลังไพ่ — ห้ามแตะ

`.card-back-pattern` ใน `globals.css` (ช็อกโกแลต `#382518` + ทอง `#CD9F5B`) เป็น **ลวดลายบนตัวไพ่** ไม่ใช่ UI
คงไว้ตามเดิมทุกค่า — ไพ่ต้องดูเป็นวัตถุจริงที่วางอยู่บนหน้าเว็บ ไม่ใช่ส่วนหนึ่งของหน้าเว็บ

### 7.4 สีแบรนด์บุคคลที่สาม — ห้ามแปลง

| แบรนด์ | สี | ไฟล์ |
|---|---|---|
| LINE | `#06C755` · `#05B34C` | `readers/queue/[id]/page.tsx:196` · `AuthModal.tsx:538` |
| Facebook | `#1877F2` | `ShareModal.tsx:527` |
| Google | `#4285F4` · `#34A853` · `#FBBC05` · `#EA4335` | `AuthModal.tsx:514-526` |
| Instagram | `#f09433` · `#dc2743` · `#bc1888` | `ShareModal.tsx:540` |

โลโก้และปุ่มของแพลตฟอร์มต้องใช้สีทางการเท่านั้น (ข้อกำหนดแบรนด์ของแต่ละเจ้า)

---

## 8. แผนงานเป็นชุด (แบ่ง PR)

> กฎเหล็กข้อ 12: หนึ่ง milestone หนึ่ง branch · rebase บน `origin/main` เสมอ
> กฎเหล็กข้อ 13: จบงานต้องรัน `npm run pr:auto` เสมอ **push เฉย ๆ = งานยังไม่เสร็จ**
> กฎเหล็กข้อ 11: ก่อนแก้ต้อง `npm run agent:check` + `npm run agent:lock`

### PR 1 — วางระบบ (ห้ามรวมกับ PR อื่น)

| ไฟล์ | งาน |
|---|---|
| `src/app/globals.css` | โทเคน 8 สี · พื้นหลังใหม่ (4.2) · เงา 2 ระดับ · focus ring · ลบ `.btn-gold` |
| `src/app/layout.tsx` | `themeColor` |
| `src/app/manifest.ts` | `background_color` + `theme_color` |
| `src/components/ui/Button.tsx` | 4 variant ใหม่ |
| ลบ 3 ไฟล์ | `GalaxyCanvas` · `MysticAltarCanvas` · `MysticBackground` + ทุก import |

**ผลลัพธ์ที่ควรเห็นทันที**: พื้นหลังนิ่ง ไม่มีดาว ไม่มีวงหมุน · หน้าเว็บอาจดูสีเพี้ยนบางจุด (ปกติ — PR 2 จะเก็บ)

### PR 2 — คอมโพเนนต์หลัก (584 + 208 + 161 + 104 hex)

`src/components/reading/**` · `src/components/ui/**` · `src/components/spread/**` · `src/components/deck/**` · `src/components/card/**`

ไฟล์หนักสุด: `StreamReader.tsx` (127) · `IntentionAltarInput.tsx` (69) · `ProvablyFairPanel.tsx` (68) · `SpreadCardSelector.tsx` (71) · `InteractiveCardFan.tsx` (65)

### PR 3 — โมดัลและบัญชีผู้ใช้ (207 + 166 + 98 hex)

`src/components/entitlement/**` · `src/components/auth/**` · `src/components/history/**` · `src/components/account/**` · `src/components/security/**`

### PR 4 — สารานุกรมไพ่และหน้าเนื้อหา (210 + 47 + 36 hex)

`src/components/encyclopedia/**` · `src/components/marketplace/**` · `src/components/readers/**` · `src/app/blog/**` · `src/app/privacy` · `src/app/reset-password` · `src/app/error.tsx` · `src/app/global-error.tsx`

### PR 5 — หน้าเพจที่เหลือ (98 + 54 + 54 + 41 hex)

`src/app/page.tsx` · `src/app/readers/**` · `src/app/cards/**` · `src/app/spreads/**` · `src/app/account/**` · `src/app/tester/**`

---

## 9. เกณฑ์ตรวจรับ (Definition of Done)

ทุก PR ต้องผ่านครบทุกข้อ:

### 9.1 ตรวจอัตโนมัติ

```bash
npm run repo:verify     # ครบ 7 ด่าน
npm run typecheck
```

### 9.2 ตรวจด้วยคำสั่ง (แนบผลลัพธ์ใน PR)

```bash
# 1. ต้องไม่เหลือพื้นหลัง canvas
grep -rn "MysticBackground\|GalaxyCanvas\|MysticAltarCanvas" src
# คาดหวัง: ไม่มีผลลัพธ์

# 2. นับสีที่เหลือ (ไม่รวม admin)
grep -rhoE '#[0-9A-Fa-f]{6}' src --include='*.tsx' --include='*.css' --exclude-dir=admin \
  | tr 'a-f' 'A-F' | sort -u | wc -l
# คาดหวังหลัง PR 5: <= 20 (8 โทเคน + gold-deep + หลังไพ่ + สีแบรนด์ 11 ตัว)

# 3. ต้องไม่เหลือสีเดิมชุดหลัก
grep -rniE '#(CD9F5B|D6B48D|5A432F|8C735D|FDF7F0|FCF0E6|FFD700|B8853E|E5C07B|E4C09F|C5A059|F5DEAA|9C93B8|05040A)' \
  src --include='*.tsx' --exclude-dir=admin
# คาดหวังหลัง PR 5: เหลือเฉพาะ #CD9F5B ใน .card-back-pattern เท่านั้น

# 4. ต้องไม่มี opacity บนเส้นขอบ
grep -rn 'border-\[#E4D8C4\]/' src --include='*.tsx'
# คาดหวัง: ไม่มีผลลัพธ์

# 5. ต้องไม่มีเงา arbitrary ใหม่
grep -rn 'shadow-\[' src --include='*.tsx' --exclude-dir=admin | wc -l
# คาดหวังหลัง PR 5: 0
```

### 9.3 ตรวจด้วยตา (ทุก PR)

- [ ] พื้นหลังนิ่งสนิท ไม่มีอะไรขยับเมื่อไม่ได้ทำอะไร
- [ ] มองออกว่าอันไหนคือการ์ด อันไหนคือพื้น โดยไม่ต้องเพ่ง
- [ ] ช่องกรอกและโซนแท่นบูชา **เข้มกว่า** พื้นหน้า (ไม่ใช่สว่างกว่า)
- [ ] ในหนึ่งหน้าจอมีปุ่มทองทึบไม่เกิน 1 ปุ่ม
- [ ] เนื้อผ้าลินินมองเห็นเป็น "ผิวสัมผัส" ไม่ใช่ "เม็ดรบกวน"
- [ ] เปิดบนมือถือจริง กลางแดด อ่านตัวหนังสือรองออก
- [ ] **ไม่มีอิโมจิการ์ตูน** ใช้ได้แค่ `✦` และ `✨` (กฎเหล็กข้อ 2)
- [ ] ไม่มี `overflow-hidden` / `overflow-x-auto` โผล่ในแถวการ์ดย่อย (กฎเหล็กข้อ 3)
- [ ] ไพ่ยังเริ่มต้นคว่ำหน้า ผู้ใช้แตะพลิกเอง (กฎเหล็กข้อ 4)

### 9.4 ตรวจประสิทธิภาพ (เฉพาะ PR 1)

- [ ] เปิด DevTools → Performance → เลื่อนหน้าไพ่ 78 ใบ ต้องได้ **60 fps เฟรมตก 0**
- [ ] เปิด Rendering → Frame Rendering Stats: หน้าที่ไม่มีอนิเมชันต้อง **ไม่มีการวาดซ้ำเลย** (ของเดิมวาดตลอดเพราะ rAF)

### 9.5 บันทึกงาน (บังคับทุก PR)

- [ ] อัปเดต `docs/WORK_LOG.md` (กฎเหล็กข้อ 1)
- [ ] รัน `npm run log:sync`
- [ ] ถ้าเจอบั๊กระหว่างทาง → `npm run incident` พร้อม `--cause` และ `--prevention` (กฎเหล็กข้อ 0)
- [ ] `npm run agent:unlock` เมื่อจบ

---

## 10. ข้อห้ามเด็ดขาด (Guardrails)

| # | ข้อห้าม | เหตุผล |
|---|---|---|
| G1 | ห้ามเพิ่มสีที่ไม่อยู่ในตารางข้อ 3.1 | ถ้าจำเป็นจริง ต้องแนบค่าคอนทราสต์กับพื้นทั้ง 3 ชั้นมาใน PR |
| G2 | ห้ามใช้ไล่สี (`gradient`) กับปุ่ม พื้นหลัง หรือตัวอักษร | เหลือได้จุดเดียวคือแสงบน `body` ในข้อ 4.2 |
| G3 | ห้ามใส่ `/opacity` กับ `border-[#E4D8C4]` | ของเดิมมี 8 ระดับความจาง = ขอบไม่เท่ากันทั้งเว็บ |
| G4 | ห้ามใช้เงาสีทอง | เงาต้องเป็นน้ำตาลกลาง `rgba(46,33,26,…)` เสมอ |
| G5 | ห้ามเอา `.altar-cloth` ไปปูทั้งหน้า | มันคือ "โต๊ะ" ไม่ใช่ "วอลเปเปอร์" |
| G6 | ห้ามใส่ `animation` / `transition` / `will-change` ให้พื้นหลัง | เหตุผลทั้งหมดของงานนี้ |
| G7 | ห้ามเพิ่ม `content-visibility` กับกริดการ์ด | วัดแล้วช้าลง — ดูคอมเมนต์ใน `globals.css` |
| G8 | ห้ามแตะ `/admin` และ `components/admin/` | นอกขอบเขต |
| G9 | ห้ามแตะภาพใน `public/cards/` | กฎเหล็กข้อ 5 |
| G10 | ห้าม `push` แล้วจบ | ต้อง `npm run pr:auto` เสมอ (กฎเหล็กข้อ 13 · INC-0043) |

---

## 11. งานที่แยกไว้ทำทีหลัง (ไม่ใช่งานนี้)

| งาน | ขนาด | หมายเหตุ |
|---|---|---|
| แปลงธีม `/admin` | 222 hex · สีม่วง `#9c93b8` 102 ครั้ง · พื้นดำ `#05040a` | ทั้งหน้ายังเป็นธีมมืดเก่า ต้องออกแบบใหม่ทั้งชุด |
| เทมเพลตอีเมล | 16 hex ใน `src/lib/email/templates.ts` | ต้องใช้ inline style รองรับ mail client เก่า |
| ภาพ OG / social preview | — | ควรทำหลังพาเลตต์นิ่งแล้ว |

---

## 12. ภาคผนวก — ตัวเลขก่อน/หลัง

| รายการ | ก่อน | หลัง |
|---|---:|---:|
| สี hex ไม่ซ้ำ (ไม่รวม admin) | 110 | ≤ 20 |
| จำนวนครั้งที่ใช้สี hex | 2,550 | — |
| ไฟล์ที่มี hex | 70 | — |
| ลูป `requestAnimationFrame` | ~15 หน้า | 0 |
| ไฟล์พื้นหลัง | 3 | 0 |
| ไล่สี | 35 จุด | 1 |
| เงาแบบ arbitrary | 44 แบบ | 2 โทเคน |
| ค่ามุมโค้ง | 11 แบบ | 3 |
| คู่สีที่ตก WCAG AA | 6 | 0 |

---

*เอกสารนี้เป็นสเปกสั่งงาน ไม่ใช่ข้อเสนอ — ถ้าจุดใดขัดกับกฎเหล็กใน `CLAUDE.md` ให้ยึด `CLAUDE.md` เป็นหลักและแจ้งกลับ*
