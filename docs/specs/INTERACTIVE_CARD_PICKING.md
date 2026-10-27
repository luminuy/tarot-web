# 🎴 ระบบ "ผู้ใช้จับไพ่ด้วยตัวเอง" (Interactive Self-Draw & Card Fan)

> **สถานะ**: ใช้งานจริง — พิธีเปิดไพ่ของหน้าแรก `/` และหน้าผัง `/read/[id]` (`/en/...` ด้วย) · สับไพ่อัตโนมัติ v2 ตั้งแต่ 2026-10-16 · **ตรวจกับโค้ดล่าสุด**: 2026-10-26
> สูตร Provably Fair ฉบับเต็มอยู่ที่ [`TAROT_CARD_FEATURES.md`](../TAROT_CARD_FEATURES.md) และ [`ARCHITECTURE.md`](../ARCHITECTURE.md) — ไฟล์นี้อธิบายเฉพาะส่วนที่ผู้ใช้เลือกไพ่เอง
> กฎเหล็กที่ผูกกับหน้านี้ (ใน [`CLAUDE.md`](../../CLAUDE.md)): ข้อ 3 Zero-Clipping · ข้อ 4 ไพ่คว่ำจนผู้ใช้พลิกเอง · ข้อ 9 ผังกว้าง · ข้อ 14 ห้ามกุไพ่

---

## 1. หัวใจของประสบการณ์

สิ่งที่ทำให้ผู้ถามรู้สึกมีส่วนร่วมไม่ใช่การกดปุ่มสุ่ม แต่คือจังหวะที่ได้ตั้งจิตแล้วแตะเลือกไพ่ทีละใบด้วยตัวเอง
ระบบนี้ให้ผู้ใช้เลือกตำแหน่งในสำรับ 78 ใบเองทั้งบนมือถือ (แตะ) และคอม (คลิก/คีย์บอร์ด) โดยที่ผลยังตรวจสอบย้อนหลังได้

---

## 2. ลำดับขั้นตอน (ของจริงตอนนี้)

ขั้นของพิธีอยู่ใน `src/components/home/ritual-step.ts`: `SPREAD_SELECT` ➔ `INTENTION_SELECT` ➔ `SHUFFLE` ➔ `PICK_CARDS` ➔ `READING` ➔ `SUMMARY`

| ขั้น | สิ่งที่เกิด |
| :-- | :-- |
| เริ่ม (`/api/reading/start`) | เซิร์ฟเวอร์สร้าง `serverSeed` + `commitment` · ไคลเอนต์สร้าง `clientSeed` ด้วย crypto (`createClientSeed` ใน `TarotFlow`) แล้วผูกกับเซสชันตั้งแต่ขั้นนี้ |
| สับไพ่ | `ShuffleRitual` สับเองอัตโนมัติ ~1.7 วินาที (0.5 วินาทีเมื่อผู้ใช้ตั้งลดการเคลื่อนไหว) บนโต๊ะเดียวกับพัด — เจ้าของสั่งตัดขั้น "แตะเพื่อสับ" 2026-10-16 · การขยับเมาส์/นิ้วระหว่างนี้เป็นเมล็ดสำรองเท่านั้น |
| เลือกไพ่ | `InteractiveCardFan` กางไพ่ 78 ใบเป็นแถวโค้ง: จอกว้าง 3 แถว × 26 ใบ · จอ < 640px 6 แถว × 13 ใบ (ใหญ่พอจิ้ม) · บอกชื่อตำแหน่งที่กำลังเลือก + ช่องวางไพ่ใต้พัด · ไพ่ที่เลือกหายจากพัดไปลงช่องตำแหน่ง · ทำซ้ำจนครบจำนวนของผัง |
| วางบนโต๊ะ | `SpreadBoard` — จอ ≥ 640px วางตามพิกัดผังจริง (`mapLayout()` ใน `src/lib/tarot/spread-map-geometry.ts`) · จอ < 640px ผัง 6 ใบขึ้นไปเป็นรางเลื่อนทีละใบ (ข้อยกเว้นกฎข้อ 3 · INC-0219) |
| พลิกไพ่ | ไพ่คว่ำทุกใบ ผู้ใช้แตะพลิกเอง (3D · `TarotCard`) หรือกด "เปิดทั้งหมด" · แผงคำอ่าน (`StreamReader`) ไม่แสดงภาพ/ชื่อ/คำอ่านของใบที่ยังคว่ำ (`revealedOrders` · แก้ใน #710) |
| คำอ่าน + ตรวจสอบ | คำอ่านสตรีมจาก `/api/reading/[id]/read` · จบแล้วเซิร์ฟเวอร์เฉลย `serverSeed` · `ProvablyFairPanel` ให้ผู้ใช้ตรวจเอง |

หน้า one-card (`OneCardRitual` · ไพ่ประจำวัน ความรัก 1 ใบ ฯลฯ) ใช้พิธีย่อ 2 จังหวะ ไม่มีพัด — ดู [`HANDOFF_THEME_THREE_PAGES_2026-09-06.md`](../plans/HANDOFF_THEME_THREE_PAGES_2026-09-06.md)

---

## 3. ความสุ่มที่ตรวจสอบได้ + การเลือกของผู้ใช้

ที่อยู่: `src/lib/tarot/shuffle.ts` (`createCommitment` · `verifyCommitment` · `drawCards`)

1. **ผูกมัดก่อน**: `serverSeed` = สุ่ม 32 ไบต์ · `commitment = SHA-256(serverSeed)` ส่งให้ไคลเอนต์ก่อนผู้ใช้แตะอะไร
2. **สับทั้งสำรับ**: สายเลขสุ่มจาก `SHA-256(serverSeed + "|" + clientSeed)` ➔ Fisher–Yates สับ 78 ใบ (rejection sampling ไม่เอนเอียง) ➔ ได้ลำดับสำรับ `deck`
3. **หยิบตามที่ผู้ใช้เลือก**: `pickedIndices` คือตำแหน่งในพัดที่ผู้ใช้แตะ ➔ ไพ่ = `deck[pickedIndices[i]]` · ไพ่กลับหัวสุ่มจากสายเดียวกัน (โอกาส 40%)
4. **เฉลย**: หลังอ่านจบเซิร์ฟเวอร์ส่ง `serverSeed` ผู้ใช้คำนวณซ้ำได้ว่าแฮชตรงและได้ไพ่ชุดเดิม

ด่านในโค้ด:
- `clientSeed` ต้องมาจากผู้ใช้เสมอ — ไม่มีเมล็ดทั้งในเซสชันและใน body = ปฏิเสธ (`CLIENT_SEED_REQUIRED`) ไม่สุ่มแทนให้ฝั่งเซิร์ฟเวอร์
- `pickedIndices` ต้องยาวเท่าจำนวนตำแหน่งของผัง ไม่ซ้ำ และอยู่ในช่วง 0–77 · ไม่ส่งมา = หยิบจากบนสุดของสำรับที่สับแล้ว
- เรียก `/shuffle` ซ้ำได้ผลเดิมเสมอ (ไพ่ถูกตรึงครั้งเดียว) — กันการรีเฟรชเพื่อสุ่มใหม่
- เซสชันที่ไพ่ "คำนวณได้" (ไพ่ประจำตัวจากวันเกิด · กอง Pick a Card ประจำวัน · `derived-draw.ts`) ไม่รับ `pickedIndices` (`DERIVED_SESSION_NO_PICK`)
- ข้อมูลไพ่หาย = ขอให้ผู้ใช้โหลดใหม่ ห้ามหยิบไพ่ใบไหนมาแทน (กฎข้อ 14 · `CARD_DATA_NOT_FOUND`)

---

## 4. คอมโพเนนต์

| คอมโพเนนต์ | ที่อยู่ | หมายเหตุ |
| :-- | :-- | :-- |
| `TarotFlow` | `src/components/home/TarotFlow.tsx` (+ `flow-*.ts`) | ตัวคุมพิธีทั้งหมด · mount ผ่าน `astro/islands/TarotFlowRoot.tsx` |
| `ShuffleRitual` | `src/components/deck/ShuffleRitual.tsx` | สับอัตโนมัติ · props `spreadName` · `onShuffleComplete(clientSeed)` |
| `InteractiveCardFan` | `src/components/deck/InteractiveCardFan.tsx` | props `pickedIndices` · `targetCount` · `currentPositionName` · `positionNames` · `onPickCard(fanIndex)` · `disabled` · Tab หยุดที่ใบเดียวแล้วใช้ลูกศรเลื่อน (roving tabindex) · เสียงแตะจาก `src/lib/utils/audio.ts` (Web Audio ไม่มีไฟล์เสียง) |
| `SpreadBoard` | `src/components/spread/SpreadBoard.tsx` | props `spread` · `drawnCards` · `revealedOrders` · `onFlipCard` · `onRevealAll` · `onZoomCard` · `onFocusCard` |
| `TarotCard` / `CardImage` | `src/components/card/` | พลิก 3D · ภาพไพ่ต้องผ่าน `CardImage` (กฎข้อ 8) |
| `StreamReader` · `ProvablyFairPanel` | `src/components/reading/` | คำอ่านตามไพ่ที่พลิกแล้ว · แผงตรวจสอบความโปร่งใส |

วินัยประสิทธิภาพ: `will-change` ใส่เฉพาะตอนกำลังขยับ (INC-0061) · ห้าม `backdrop-filter` (INC-0060)

---

## 5. API

`POST /api/reading/[id]/shuffle`

```json
{
  "clientSeed": "ใช้เฉพาะเซสชันเก่าที่ยังไม่ได้ผูกเมล็ดตอน /start",
  "pickedIndices": [12, 45, 3],
  "sessionToken": "ไม่บังคับ"
}
```

ตอบกลับ `clientSeed` · `drawn` (ลำดับ · index ไพ่ · กลับหัว) · `cards` (ข้อมูลไพ่ที่จั่วได้) · `sessionToken` · `derived` (เฉพาะเซสชันไพ่คำนวณได้) · เพดานถี่ข้าม isolate ดู [`ENTITLEMENT_ABUSE_MODEL.md`](ENTITLEMENT_ABUSE_MODEL.md) หัวข้อ 3
