# Design System V2 Codemods (ประวัติ · ห้ามรันโดยไม่แก้ก่อน)

> ⚠️ **ตรวจ 2026-10-26: สคริปต์ชุดนี้ล้าสมัย** — เขียนสำหรับระบบดีไซน์ V2 (2026-09-03) และไม่ได้แก้ตั้งแต่ 2026-09-21
> - พาเลตต์ที่ฝังในสคริปต์ (`TOK` ใน `ds-colors.py`) **ไม่ตรง** กับโทเคนปัจจุบันใน `src/app/globals.css` (ธีมกระจกอุ่น + UI 2.0) — รันตอนนี้จะดึงสีทั้งเว็บกลับไปเป็นสีชุดเก่า
> - กวาดเฉพาะ `src/` · ไม่แตะหน้า Astro ใน `astro/` ซึ่งเป็นหน้าสาธารณะเกือบทั้งหมดแล้ว
> - ข้อยกเว้นเส้นทาง `src/app/readers` ไม่ตรงกับที่อยู่จริง (`src/app/(th)/readers`) — หน้าแม่หมอจะถูกกวาดด้วย
>
> จะใช้อีกครั้ง: แก้ `TOK` ให้ตรง `globals.css` · เพิ่ม `astro/` · แก้ข้อยกเว้นเส้นทาง · รัน `--dry` ทุกตัวก่อน
> ด่านที่เฝ้าสีจริงตอนนี้คือ palette-drift และด่านคอนทราสต์ใน `npm run repo:verify` ไม่ใช่สคริปต์ชุดนี้

## สคริปต์

| ไฟล์ | ทำอะไร |
|---|---|
| `ds-colors.py` | สี hex ➔ โทเคน (แยกบริบท text/bg/border/ring) |
| `ds-named-colors.py` | สีตั้งชื่อของ Tailwind (rose/emerald/amber/…) ➔ โทเคน |
| `ds-hover.py` | ซ่อม hover ที่กลายเป็น no-op หลังบีบสี |
| `ds-radius.py` | รัศมีขอบ ➔ 3 ระดับ |
| `ds-shadow.py` | เงา ➔ 2 ระดับ (แตะฟอร์แมตของ template literal ได้ ต้องรัน prettier ตาม) |
| `ds-cta.py` | ปุ่มพื้นทองทึบ ➔ ทรงแคปซูล |
| `ds-tidy-classes.py` | เก็บกวาดช่องว่างส่วนเกินในชุดคลาส |

ทุกตัวรับ `--dry` เพื่อดูผลก่อนเขียนจริง · ลำดับเดิมคือตามตารางบนลงล่าง แล้ว `npx prettier@3 --write` กับไฟล์ที่เปลี่ยน และ `npm run typecheck`

## จุดบอดที่ยังเป็นจริง (ตรวจด้วยมือ)

สคริปต์อิงคลาส Tailwind จึงมองไม่เห็น:

```bash
# เงาที่เขียนใน inline style
grep -rn "boxShadow" src astro --include='*.tsx' --include='*.astro'

# สีที่เขียนเป็น rgba() (ds-colors.py จับเฉพาะ #hex)
grep -rnoE 'rgba?\([0-9 ,.]+\)' src astro --include='*.tsx' --include='*.ts' --include='*.astro'
```

และแก้เองเสมอ: ภาพแชร์ที่วาดด้วย canvas (`src/components/reading/ShareModal.tsx`) · เทมเพลตอีเมล (`src/lib/email/templates.ts`) · ไอคอนต้องใช้ `src/components/ui/LineIcons.tsx` — ห้ามอิโมจิและสัญลักษณ์ประดับทุกชนิด (กฎเหล็กข้อ 2 ใน [`CLAUDE.md`](../../CLAUDE.md))
