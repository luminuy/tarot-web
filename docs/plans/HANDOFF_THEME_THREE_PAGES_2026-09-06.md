# ✦ แผนส่งต่องาน — ตัดขั้นตอนสับ/เลือกไพ่ ให้ 3 หน้า one-card เร็วแบบ "เปิดไพ่ด่วน"

> **ผู้จัดทำ**: Claude · 2026-09-06 (รอบ 2) · **ผู้รับช่วง**: ทีม/เอเจนต์ Frontend ตัวถัดไป
> **โค้ดอ้างอิง**: `main` หลัง merge **PR #293** (`e9aa4d2`) — ถ้าเลขบรรทัดเลื่อน ให้ค้นด้วยสตริงที่ยกมา
> **ขนาดงาน**: ~2–3 ชม. · **1 PR** · แตะ **1 ไฟล์หลัก** (`OneCardRitual.tsx`) + จูน 2 ไฟล์ client
> **ประเภท**: ตัด flow + จูน UX — **ห้ามแตะ logic สุ่มไพ่ · saveReading · JSON-LD · โครงข้อมูลไพ่**

---

## 📌 บริบท: รอบแรกทำอะไรไปแล้ว (PR #293)

รอบแรกทีม Antigravity รื้อธีมตามแผน v1 เสร็จแล้ว — **ส่วนดีไซน์เข้าที่แล้ว**:
- สร้าง `src/components/reading/one-card/OneCardRitual.tsx` + `RitualHero.tsx` + `src/components/seo/SeoArticleShell.tsx`
- ใช้ `@theme` tokens / คลาส `.altar-*` · บอดี้ Sarabun · `rounded-2xl` · เฉด `#635B4E`
- ลบป้าย mono อังกฤษ (`SACRED DAILY CHRONOMETER` ฯลฯ) · birth-card เป็น 2 ภาษาแล้ว · พื้นหลังชั้นเดียว

**แต่เจ้าของรีวิวแล้วยังไม่พอใจ** — ฟีดแบ็กรอบ 2:

> _"ปรับปรุงให้สไตล์คล้ายเปิดไพ่ด่วน ไม่ต้องมีขั้นตอนให้ยุ่งยากเยอะ ไพ่ใบเดียวแบบนี้ต้องการความเร็ว **ไม่ต้องมีขั้นตอนเลือกไพ่**"_

ปัญหาคือ `OneCardRitual` ปัจจุบันมี **5 สเตป**:
`idle` → `shuffling` (`ShuffleRitual` สับ 2.2s) → `picking` (`InteractiveCardFan` พัดไพ่ 78 ใบให้แตะเลือก) → `ready` (การ์ดอีกใบให้แตะ) → `revealed`

เจ้าของอยากได้แบบ **"เปิดไพ่ด่วน" (Quick Fortune)** — ดูโค้ดจริงที่ `TarotFlow.tsx` → `handleQuickFortuneSelect`:
เลือกหัวข้อ → จั่วไพ่ **ทันที** (ไม่มีอนิเมชันสับ ไม่มีพัดไพ่) → ไพ่คว่ำหน้า → แตะพลิก → อ่านผล

---

## 🎯 flow ใหม่ที่ต้องได้ (2 จังหวะ)

```
┌── จังหวะ 1: idle ────────────────────────────────┐
│  headerSlot (เลือกหัวข้อ/สถานะ + ช่องคำถาม)       │
│  ปุ่มเดียว: "เปิดไพ่<หัวข้อ>"                       │
│  (ไม่ต้องโชว์การ์ดคว่ำใบใหญ่ + label ที่ตัดครึ่ง)  │
└──────────────────────────────────────────────────┘
        │ กด → จั่วทันทีด้วย window.crypto (คงตรรกะเดิม)
        │ ไม่มี ShuffleRitual · ไม่มี InteractiveCardFan
        │ fade 300–400ms พอ (motion)
        ▼
┌── จังหวะ 2: revealed ────────────────────────────┐
│  <TarotCard isRevealed={flipped} onClick={flip}  │
│    positionLabel={flipped? undefined:"แตะเพื่อ    │
│    พลิกไพ่"} />   ← โผล่มาคว่ำหน้า                 │
│  แตะ 1 ที → พลิก 3D → renderReading เลื่อนเข้ามา  │
│  + action bar (แชร์/เริ่มใหม่) + recommendations  │
└──────────────────────────────────────────────────┘
```

state: `"idle" | "revealed"` + `flipped: boolean` (เดิม 5 ค่า → เหลือ 2)

> ⚠️ จังหวะ "แตะพลิกไพ่ 1 ที" **ห้ามตัด** — กฎเหล็กข้อ 4 (Manual Self-Reveal) · แค่ 1 แตะ ไม่นับว่ายุ่งยาก · ตัดได้แค่ "สับ" กับ "เลือกจากพัด"

---

## ⛔ อ่านก่อนแตะโค้ด

| # | ไฟล์ | เพื่อ |
| :-: | :--- | :--- |
| 1 | `docs/INCIDENT_LOG.md` | บทเรียน |
| 2 | `docs/KNOWN_ISSUES.md` | บั๊กค้าง |
| 3 | `docs/AI_COLLABORATION_GUIDELINES.md` | กฎเหล็ก — ข้อ 3 (Zero-Clipping), 4 (Manual Self-Reveal), 10 (Human-First), 14 (ห้ามกุไพ่) |
| 4 | `src/app/TarotFlow.tsx` → `handleQuickFortuneSelect` + `src/components/reading/QuickFortunePicker.tsx` | **ต้นแบบ flow เร็ว + สไตล์การ์ดหัวข้อ** |
| 5 | `src/components/reading/one-card/OneCardRitual.tsx` | ไฟล์ที่จะรื้อ |

```bash
npm run agent:status
npm run agent:lock -- --agent <ชื่อคุณ> --domain ui \
  --files "src/components/reading/one-card/OneCardRitual.tsx,src/app/daily/DailyClient.tsx,src/app/love/1-card/LoveOneCardClient.tsx" \
  --task "ตัดขั้นสับ/เลือกไพ่ OneCardRitual ให้เร็วแบบ quick fortune"
# ...แก้งาน...
npm run typecheck && npm run repo:verify
npm run agent:unlock -- --agent <ชื่อคุณ>
npm run pr:auto -- "<title>" --body-file <path>          # กฎข้อ 13 — push เฉย ๆ = งานไม่เสร็จ
```

---

## 📐 แผนลงมือ

### เฟส 1 — รื้อ `OneCardRitual.tsx` (ไฟล์หลัก)

**ลบ**:
- `import` + `dynamic()` ของ `ShuffleRitual` และ `InteractiveCardFan`
- บล็อก `status === "shuffling"`, `status === "picking"`, `status === "ready"` ทั้งหมด
- handler `handleStart`, `handleShuffleComplete`, `handlePickCard`

**เปลี่ยน state**: `"idle" | "shuffling" | "picking" | "ready" | "revealed"` → `"idle" | "revealed"` + เพิ่ม `const [flipped, setFlipped] = useState(false)`

**handler ใหม่ — จั่วทันที** (ยกตรรกะสุ่มเดิมจาก `handleShuffleComplete` มาไว้ที่นี่):
```ts
const handleDraw = () => {
  soundManager.playCardSelectSound();
  const buf = new Uint32Array(2);
  if (typeof window !== "undefined" && window.crypto) window.crypto.getRandomValues(buf);
  else buf[0] = Math.floor(Math.random() * 1_000_000);
  const card = DECK[buf[0] % DECK.length];
  if (!card) throw new Error("ไม่พบข้อมูลไพ่ กรุณาโหลดใหม่อีกครั้ง");   // กฎ 14
  startTransition(() => { setDrawnCard(card); setStatus("revealed"); setFlipped(false); });
};

const handleFlip = () => {
  if (!drawnCard || flipped) return;
  soundManager.playCardFlipSound();
  setFlipped(true);
  onRevealed(drawnCard);                 // saveReading ยิงตอนพลิก เหมือนเดิม
};
```

**จังหวะ idle** (`status === "idle"`):
- คง `{headerSlot}`
- **ลบการ์ดคว่ำใบใหญ่ + `positionLabel={deckLabel}`** (นี่คือ label ที่ถูกตัดครึ่งในสกรีนช็อต `"วิหาร: มหาภาพ..."` / `"สถานะ: คน..."`)
- เหลือปุ่มเดียว — รับ prop ใหม่ `ctaLabel?: string`:
  ```tsx
  <button onClick={handleDraw}
    className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#29261F] text-[#FAF7F2] font-serif-th text-sm font-bold shadow-[var(--shadow-raised)] hover:bg-[#A58A5C] active:scale-[0.98] transition-all cursor-pointer">
    {ctaLabel ?? (isEnglish ? "Draw Your Card" : "เปิดไพ่")}
  </button>
  <p className="text-xs text-[#635B4E]">
    {isEnglish ? "Cryptographic Web Crypto API randomness · Provably Fair"
              : "สุ่มด้วย Web Crypto API ปราศจากการล็อกผล 100%"}
  </p>
  ```
- ครอบด้วย `.altar-cloth p-6 sm:p-10` เหมือนเดิม แต่ไม่มีไพ่ในนั้นแล้ว → **ตัด `overflow` ใด ๆ ที่อาจครอบไพ่** (กฎ 3)

**จังหวะ revealed** (`status === "revealed" && drawnCard`):
- การ์ด vitrine: `isRevealed={true}` ตายตัว → `isRevealed={flipped}` + `onClick={handleFlip}` + `positionLabel={flipped ? undefined : (isEnglish ? "Tap to reveal" : "แตะเพื่อพลิกไพ่")}` + `cursor-pointer` ตอนยังไม่พลิก
- Dossier (ชื่อไพ่ / keywords / โหราศาสตร์ / ลิงก์คัมภีร์) + `renderReading(drawnCard)` + action bar + recommendations → **ห่อด้วย `{flipped && ( ... )}`** ให้โผล่หลังพลิกเท่านั้น (`motion` fade + y)
- `handleRestart`: `setStatus("idle"); setDrawnCard(null); setFlipped(false); ...`

**props เพิ่ม**: `ctaLabel?: string` · **props `deckLabel`**: เลิกส่งเข้า `positionLabel` (จะลบทิ้งเลยหรือคงชื่อไว้เฉย ๆ ก็ได้)
**เก็บ**: `AnimatePresence mode="wait"` + `motion.div` + `stepVariants` (เหลือ 2 key)

### เฟส 2 — จูน `DailyClient.tsx`

- `<OneCardRitual>` : เพิ่ม `ctaLabel={isEnglish ? `Draw ${currentChamber.titleEn} Card` : `เปิดไพ่${currentChamber.titleTh}`}`
- `headerSlot`:
  - `"ขั้นที่ 1: เลือกวิหารเจตจำนงของวัน"` → เอาคำว่า "ขั้นที่ 1" ออก เหลือหัวข้อไทยสั้น เช่น `"เลือกเรื่องที่อยากรู้วันนี้"` (ให้เหมือน QuickFortunePicker)
  - การ์ด 5 หัวข้อ: มือถือ **เลื่อนแนวนอน** `flex overflow-x-auto snap-x no-scrollbar -mx-4 px-4` / เดสก์ท็อป `sm:grid sm:grid-cols-2 lg:grid-cols-3` — ลอกทรงจาก `QuickFortunePicker` (ภาพไพ่ 1909 ตัวแทน + badge + tagline)
  - ภาพไพ่ตัวแทน (ผ่าน `<CardImage>` — กฎ 8): ภาพรวม `major-19.jpg` · การงาน `wands-01.jpg` · การเงิน `pentacles-01.jpg` · ความรัก `cups-02.jpg` · จิตใจ `swords-01.jpg`
  - ช่องคำถาม inline (ไม่บังคับ) — คงไว้
- `renderReading` 5 มิติ: คงทั้งหมด (โอเคแล้ว)

### เฟส 3 — จูน `LoveOneCardClient.tsx` (โครงเดียวกับ daily)

- `ctaLabel={isEnglish ? `Draw Your Card` : `เปิดไพ่${currentStatusObj?.titleTh}`}`
- `headerSlot`: การ์ด 4 สถานะ (`single/situationship/coupled/breakup`) → ทรง QuickFortunePicker (`grid-cols-2 sm:grid-cols-4` + ภาพไพ่ตัวแทน เช่น `major-06.jpg`)
- ช่องชื่อ: ยุบเหลือช่องเดียว "คนในใจ (ไม่บังคับ)" หรือคงไว้แต่สั้น
- **คง `getContextualLoveAdvice` ทั้งก้อน** ใน `renderReading`

### เฟส 4 — birth-card

**ไม่ต้องแตะ flow** (ฟอร์มคำนวณ ไม่มีสับไพ่) — #293 จูนธีม + i18n แล้ว
เช็กแค่: เปิด `/cards/birth-card` ดูว่าโทน/เรเดียส/สเปซตรงกับ `/daily` หลังงานนี้ ถ้ามีจุดหลุดค่อยเก็บ

### เฟส 5 — QA (มือถือ 390px + เดสก์ท็อป + สลับ EN)

- [ ] `/daily` + `/love/1-card`: กด "เปิดไพ่" → เห็นไพ่**คว่ำหน้า** ใน < 0.5s · **ไม่มีหน้าจอสับไพ่ ไม่มีพัดไพ่ให้เลือก**
- [ ] แตะไพ่ 1 ที → พลิก 3D → คำทำนายเลื่อนเข้ามา (กฎ 4 ครบ)
- [ ] ไม่มี label ไพ่ถูกตัดครึ่ง (`"วิหาร: มหาภาพ..."`, `"สถานะ: คน..."`)
- [ ] การ์ดเลือกหัวข้อ/สถานะ = แนวเดียวกับ "เปิดไพ่ด่วน" หน้าแรก
- [ ] ไม่มี `overflow-hidden` ในบล็อกที่มีไพ่ · การ์ดหัวข้อเลื่อนแนวนอนบนมือถือใช้ `no-scrollbar` + `-mx-4 px-4` (กฎ 3)
- [ ] `saveReading` ยังบันทึกครบ (ยิงตอน `onRevealed`/พลิก) · reset กลับ idle ได้
- [ ] `npm run repo:verify` ผ่านครบทุกด่าน (`test-will-change` / zero-clipping / emoji)
- [ ] ไม่มีอิโมจิการ์ตูน (กฎ 2) · ไม่โชว์ hash ปลอม
- [ ] `ShuffleRitual` / `InteractiveCardFan` ไม่ถูก import ใน `OneCardRitual` แล้ว

### เฟส 6 — ปิดงาน

1. `docs/WORK_LOG.md` — บันทึก
2. `npm run agent:unlock`
3. `npm run pr:auto -- "feat(ui): ตัดขั้นสับ/เลือกไพ่ 3 หน้า one-card ให้เร็วแบบเปิดไพ่ด่วน" --body-file <path>`
4. รอ CI → auto-merge → auto-deploy

---

## 🚫 ห้ามทำ

- ห้ามตัดจังหวะ "แตะพลิกไพ่ 1 ที" (กฎ 4)
- ห้ามแตะตรรกะสุ่ม (`window.crypto.getRandomValues` + `% DECK.length`) — แค่ย้ายมาไว้ที่ `handleDraw`
- ห้าม fallback กุไพ่เมื่อ `DECK` ว่าง — ต้อง throw "โหลดใหม่อีกครั้ง" (กฎ 14)
- ห้ามแตะ `saveReading` / `src/data/cards/**` / `public/cards/**` / JSON-LD ใน `page.tsx`
- ห้ามต่อสาย AI streaming / entitlement ให้ 3 หน้านี้ (คงเป็น static — เร็ว ฟรี ไม่ติดกำแพงสิทธิ์)
- ห้ามลบไฟล์ `ShuffleRitual.tsx` / `InteractiveCardFan.tsx` (หน้าแรก/ผังยังใช้อยู่) — แค่เลิก import ใน `OneCardRitual`
- ห้าม `push` เฉย ๆ แล้วจบ — ต้องเปิด PR (กฎ 13)

---

## 📁 สรุปไฟล์

| ไฟล์ | งาน |
| :--- | :--- |
| `src/components/reading/one-card/OneCardRitual.tsx` | **หลัก** — 5 สเตป → 2 จังหวะ · จั่วทันที · ลบ ShuffleRitual/InteractiveCardFan |
| `src/app/daily/DailyClient.tsx` | จูน `headerSlot` (การ์ดหัวข้อทรง quick fortune) + `ctaLabel` |
| `src/app/love/1-card/LoveOneCardClient.tsx` | จูน `headerSlot` (การ์ดสถานะ) + `ctaLabel` · คง `getContextualLoveAdvice` |
| `src/components/encyclopedia/BirthCardCalculator.tsx` | เช็กเฉย ๆ — ไม่น่าต้องแตะ |
