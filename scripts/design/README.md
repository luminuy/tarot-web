# 🎨 Design System V2 Codemods

สคริปต์กวาดโค้ดให้ตรงกับ **ระบบดีไซน์ V2** (นิยาม token อยู่ใน [`src/app/globals.css`](../../src/app/globals.css))
ใช้เมื่อโค้ดเริ่มหลุดออกจากระบบอีกครั้ง — **รันซ้ำได้ ปลอดภัย (idempotent)**

## ขอบเขต

กวาดเฉพาะ **หน้าสาธารณะ** เท่านั้น
ข้าม `src/app/admin`, `src/app/tester`, `src/app/readers`, `src/components/admin` (หลังบ้านใช้ธีมมืดคนละชุด)

## กติกา 3 ข้อที่สคริปต์บังคับ

| เรื่อง | ค่าที่อนุญาต |
|---|---|
| **สี** | `#F6F1E9` canvas · `#FFFFFF` surface · `#F0E8DB` inset · `#E4D8C4` line · `#2E211A` ink · `#6F5B4A` muted · `#8F5C1A` gold · `#74490F` gold-deep · `#3A7044` ok · `#A6392C` err |
| **รัศมีขอบ** | `rounded` 4px · `rounded-lg` 8px · `rounded-full` |
| **เงา** | ไม่มีเงา (ใช้ `border` 1px แทน) · `shadow-[var(--shadow-overlay)]` เฉพาะของที่ลอยจริง (โมดัล/แถบติดขอบจอ) |

ยกเว้นได้: สีแบรนด์โซเชียล (Google/LINE/Facebook/Instagram/X), พื้นสถานะอ่อน `#EBF3ED` `#FCEEEA`,
สีงานศิลป์หลังไพ่และสแตกไพ่ 3D (`#382518` `#5A3E26` `#4A3320`)

## ลำดับการรัน

```bash
python3 scripts/design/ds-colors.py        # สี hex → 8 tokens (รู้บริบท text/bg/border/ring)
python3 scripts/design/ds-named-colors.py  # สี Tailwind ตั้งชื่อ (rose/emerald/amber/…) → tokens
python3 scripts/design/ds-hover.py         # ซ่อม hover ที่กลายเป็น no-op หลังบีบสี
python3 scripts/design/ds-radius.py        # รัศมีขอบ → 3 ระดับ
python3 scripts/design/ds-shadow.py        # เงา → 2 ระดับ
python3 scripts/design/ds-cta.py           # ปุ่มพื้นทองทึบ → ทรงแคปซูล
python3 scripts/design/ds-tidy-classes.py  # เก็บกวาดช่องว่างส่วนเกินในชุดคลาส
npx prettier@3 --write $(git diff --name-only | grep '\.tsx$')
npm run typecheck
```

> ⚠️ ทุกตัวรับ `--dry` เพื่อดูผลก่อนเขียนจริง — **ควรรัน `--dry` ก่อนเสมอ**
> ⚠️ `ds-shadow.py` แตะฟอร์แมตของ template literal ได้ ต้องรัน prettier ตามทุกครั้ง

## สิ่งที่สคริปต์ทำแทนไม่ได้ (ต้องแก้เอง)

- ตัดอนิเมชันประดับ (วงประหมุน, จานเรืองแสง, halo เต้น)
- จังหวะแนวตั้ง (ยึดชุด `8 / 16 / 24 / 40 / 64`)
- อิโมจิการ์ตูน (กฎเหล็กข้อ 2) — ใช้ไอคอนเส้นใน `src/components/ui/TarotArtIcons.tsx` หรือ `✦`
- ภาพแชร์ที่วาดด้วย canvas (`ShareModal.tsx`) และเทมเพลตอีเมล (`src/lib/email/templates.ts`)

## ⚠️ จุดบอดของ codemod (INC — บทเรียน 2026-09-03)

สคริปต์ทั้งหมดอิง**คลาส Tailwind** จึงมองไม่เห็น 2 อย่างนี้ — **ต้องตรวจด้วยมือทุกครั้ง**

```bash
# 1. เงาที่เขียนใน inline style
grep -rn "boxShadow" src --include='*.tsx' | grep -viE 'admin|tester|/readers'

# 2. สีที่เขียนเป็น rgba() (ds-colors.py จับเฉพาะ #hex)
grep -rnoE 'rgba?\([0-9 ,.]+\)' src --include='*.tsx' --include='*.ts' \
  | grep -viE 'admin|tester|/readers' \
  | grep -viE 'rgba\((46, ?33, ?26|143, ?92, ?26|255, ?255, ?255|90, ?67, ?47)'
```

เคสจริง: ภาพตัวอย่างผังทุกใบยังมี `0 3px 8px rgba(0,0,0,0.7)` (เงาดำจากธีมมืดเดิม)
ซ้อนกับ prop `glowColor` สีชมพู/ฟ้า/ม่วง/เขียว 19 จุด ทั้งที่ผ่าน codemod ครบทุกตัวแล้ว
