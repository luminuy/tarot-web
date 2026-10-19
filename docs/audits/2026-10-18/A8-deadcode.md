# A8-deadcode

> ผู้ตรวจ: A8 (โค้ดตาย · โค้ดซ้ำ · CSS/ไฟล์ตาย) · ฐาน `47efdef` · 2026-10-18
> ตรวจอย่างเดียว ไม่แก้โค้ด · ทุกข้อยืนยันด้วย `grep -rnw` ข้าม `src astro scripts mobile` + config

## ความคืบหน้า

## ข้อค้นพบ

### 🟡 A8-01 · ไฟล์กำพร้า 3 ไฟล์ + ภาพผัง SVG 26 ตัวที่ห้อยอยู่กับไฟล์กำพร้า (~800 บรรทัด) — `spread-categories.ts` ต้องเก็บ
- ที่:

| ไฟล์ | บรรทัด | ผู้ import | คำตัดสิน |
|---|---|---|---|
| `src/components/spread/spread-illustrations.tsx` (`renderSpreadIllustration`) | 95 | 0 (src/astro/scripts/mobile) | ✅ ลบได้ — แต่ลบแล้ว **ต้องลบ 26 `*SpreadArt` + แก้ด่าน** (ดูข้างล่าง) |
| `src/components/spread/SpreadPositionMap.tsx` | 60 | 0 | ✅ ลบได้ — ไม่มีด่านอ่านเป็นข้อความ · แก้คอมเมนต์ที่อ้างถึง 2 จุด: `src/lib/tarot/spread-map-geometry.ts:6` ("ตัวเลขที่ `SpreadPositionMap.tsx` ใช้วาด") และ `scripts/qa/test-spreads.ts:116` ("เรขาคณิตชุดเดียวกับที่ `SpreadPositionMap.tsx` ใช้วาดจริง") ให้ชี้ผู้ใช้จริง (`SpreadsLibrary` · `SpreadDetailClient` · `SpreadBoard` · `TopicSpreadList` · `RitualChrome` · `SpreadBuilder` + แอป `mobile/`) |
| `src/components/ui/use-rail.ts` (`useRail`) | 80 | 0 (`useRail` ใน `SpreadBoard.tsx:91` เป็นตัวแปรชื่อซ้ำ ไม่ใช่ฮุกนี้) | ✅ ลบได้ · แก้คอมเมนต์ `src/components/ui/RailArrows.tsx:4` ("สถานะมาจาก `useRail`") — ผู้ใช้ `RailArrows` ที่เหลือคนเดียว (`PickACardClient.tsx:394`) ส่ง `canPrev/canNext` จาก index เอง |
| `src/data/spread-categories.ts` | 46 | **`mobile/app/(tabs)/index.tsx:28` · `read.tsx:9`** ผ่าน `@core/*` | ❌ **เก็บไว้** — knip ไม่ไล่ `mobile/` · เคยถูกลบแล้ว CI มือถือแดงมาแล้ว (INC-0281) |

- ภาพผัง 26 ตัวที่ตายตาม: `src/components/ui/TarotArtIcons.tsx:143-760` (`DailySpreadArt` … `StudySpreadArt` · ~620 บรรทัด SVG) ผู้ import คนเดียวคือ `spread-illustrations.tsx` ที่เป็นไฟล์กำพร้า (`CelticCrossSpreadArt` ถูกเรียกใน `MonthlyTenSpreadArt:720` ซึ่งก็ตายเหมือนกัน · `DailySpreadArt` บรรทัด 203 เป็นแค่คอมเมนต์)
- ปัญหา: ไฟล์ทั้ง 3 ไม่มีผู้เรียกตั้งแต่ UI 2.0 เปลี่ยนหน้า `/spreads` ไปใช้ `mapLayout()` (แผน UI_2_0_SPREADS) และหน้าแรกเลิกใช้แถวปัด `useRail` (#629)
- ผลกระทบ: ไม่พังรันไทม์ (tree-shake ได้) แต่ ~830 บรรทัดที่ดูเหมือน "ของจริง" — คอมเมนต์ใน `spread-map-geometry.ts` ยังบอกว่าเป็น "แหล่งความจริงเดียวของตัวเลขที่ `SpreadPositionMap.tsx` ใช้วาด" ทำให้คนแก้เรขาคณิตไปตามไฟล์ที่ไม่ถูกเรนเดอร์แล้ว · ด่านกฎข้อ 7 (TarotArtIcons ต้องเป็นภาพไพ่ล้วน) ยังต้องสแกน SVG ตาย 620 บรรทัด
- 🪤 **กับดักด่าน**: `scripts/qa/test-seo-wave3.ts:66-75` assert ว่า `TarotArtIcons.tsx` ต้องมีข้อความ `export const LoveSixSpreadArt|MonthlyTenSpreadArt|FamilySpreadArt|LuckSpreadArt|StudySpreadArt` — เป็นด่านแบบ "ตรวจการมีอยู่" (บทเรียน INC-0195) ที่ปกป้องโค้ดตาย · ลบ SpreadArt แล้วด่านนี้ตกทันที ➔ ต้องแก้ด่านให้ตรวจสิ่งที่ผู้ใช้เห็นจริง (ผัง 5 ตัวมีแผนผังใน `SpreadsLibrary`/`mapLayout`) ใน PR เดียวกัน
- หลักฐาน: `grep -rn "spread-illustrations\|renderSpreadIllustration" src astro scripts mobile` = เฉพาะบรรทัดประกาศ + คอมเมนต์ใน SpreadPositionMap · `grep -rn "use-rail\|from.*use-rail" …` = 0 · `grep -rn "SpreadPositionMap" …` = ประกาศ 1 + คอมเมนต์ 2 · `grep -rhn "@core/" mobile` = `data/spreads` 8 · `data/personas` 4 · `data/cards` 4 · `spread-map-geometry` 2 · `data/spread-categories` 2
- แนวแก้: ลบ 3 ไฟล์ + 26 `*SpreadArt` (และ import ที่ค้าง) + แก้ `test-seo-wave3.ts` ข้อ 66-75 + แก้คอมเมนต์ 3 จุด · **ห้ามแตะ `spread-categories.ts`** · หลังลบรัน `npm run typecheck` ใน `mobile/` ด้วย (กฎ INC-0281)
- ความมั่นใจ: ยืนยันแล้ว
