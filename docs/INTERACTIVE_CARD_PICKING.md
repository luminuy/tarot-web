# 🎴 การออกแบบระบบ "ผู้ใช้จับไพ่ด้วยตัวเอง" (Interactive Self-Draw & Card Fan Engine)

## 1. ที่มาและหัวใจของประสบการณ์ (UX Philosophy)
การดูดวงไพ่ทาโรต์ สิ่งที่สร้าง **พลังใจ ความเชื่อมั่น และความผูกพัน (Immersion & Agency)** สูงสุดไม่ใช่การกดปุ่มสุ่มแบบตู้สล็อต แต่คือ **"จังหวะที่ผู้ถามใช้จิตนิ่ง อธิษฐาน และยื่นมือออกไปสัมผัสเลือกไพ่ทีละใบด้วยตัวเอง"**

ระบบนี้ออกแบบมาเพื่อให้ผู้ใช้มีปฏิสัมพันธ์ (Interactivity) กับสำรับไพ่ 78 ใบอย่างแท้จริง ทั้งบนมือถือ (Touch Gestures) และคอมพิวเตอร์ (Mouse & Wheel Interaction)

---

## 2. ลำดับขั้นตอนการจับไพ่ (Step-by-Step User Flow)

```
[ ขั้นที่ 1: สับไพ่และตั้งจิต (Shuffling & Focusing) ]
   - ผู้ใช้วางนิ้ว/เมาส์เพื่อแตะสับไพ่ หรือกดปุ่ม "เริ่มสับไพ่"
   - สำรับไพ่ 78 ใบตัดสลับไปมา มีเสียงสับไพ่เบาๆ (Haptic/Audio Feedback)
   - แฮช Commitment ถูกแสดงให้เห็นอย่างสง่างาม ("ชะตาของคุณถูกปิดผนึกไว้แล้ว")

[ ขั้นที่ 2: คลี่สำรับไพ่ (The Arc / Ribbon Fan) ]
   - ไพ่ 78 ใบคลี่ออกเป็นรูปพัดโค้ง (Arc Fan) สวยงามแบบ 3D
   - ผู้ใช้สามารถเลื่อนสไลด์ (Drag / Scroll) ดูไพ่ตลอดสำรับได้แบบไร้รอยต่อ
   - เมื่อนำนิ้ว/เมาส์ไปชี้ ไพ่ใบนั้นจะลอยยกตัวขึ้นเล็กน้อย (Hover Lift & Glow)

[ ขั้นที่ 3: ผู้ใช้เลือกไพ่ทีละใบ (Self-Picking Action) ]
   - ระบบแจ้งตำแหน่งปัจจุบันที่กำลังเลือก เช่น:
     "กรุณาเลือกใบที่ 1 สำหรับ: อดีต / รากของเรื่องนี้"
   - ผู้ใช้แตะ/คลิกเลือกไพ่ใบที่รู้สึกดึงดูดใจ
   - ไพ่ที่ถูกเลือกจะลอยออกจากพัด หมุน และเคลื่อนตัวบินไปวางคว่ำหน้าลงในช่อง Spread บนกระดาน
   - ทำซ้ำจนครบตามจำนวนของ Spread (เช่น 1 ใบ, 3 ใบ, 5 ใบ หรือ 10 ใบ)

[ ขั้นที่ 4: ยืนยันการวางไพ่และเริ่มเปิดชะตา (Reveal & Reading) ]
   - สำรับไพ่ส่วนที่เหลือค่อยๆ เฟดออก
   - ผู้ใช้แตะที่หน้าไพ่บนกระดานเพื่อ "พลิกเปิดทีละใบ" (Flip 3D) 
   - หรือปล่อยให้แม่หมอ AI เริ่มร่ายคำอ่านแบบ Real-time Streaming
```

---

## 3. สถาปัตยกรรมทางเทคนิค (Technical Architecture)

### 3.1 การผสานความสุ่มที่ตรวจสอบได้ (Provably Fair + User Selection)
เพื่อให้ผู้ใช้เลือกตำแหน่งไพ่เองได้อย่างแท้จริง แต่ยังคงความโปร่งใสแบบ Provably Fair:
1. **Commitment Phase**:
   - เซิร์ฟเวอร์สร้าง `serverSeed` สุ่มลำดับสำรับ 78 ใบ (Shuffled Deck: `D = [c_0, c_1, ..., c_77]`) และ Reversal flags
   - เซิร์ฟเวอร์ส่ง `commitment = sha256(serverSeed)` ให้ Client
2. **Interactive Pick Phase**:
   - ผู้ใช้เลือก index ในพัด เช่น เลือกไพ่ใบที่ `[14, 38, 7]`
   - Client รวบรวมข้อมูล:
     - `pickedIndices`: `[14, 38, 7]`
     - `clientSeed`: ข้อมูล Gesture/Timestamp ของผู้ใช้
3. **Resolve Phase (`/api/reading/[id]/shuffle` หรือ `pick`)**:
   - Client ส่ง `pickedIndices` และ `clientSeed` กลับมาที่เซิร์ฟเวอร์
   - เซิร์ฟเวอร์หยิบไพ่จาก Shuffled Deck ตาม `pickedIndices` ที่ผู้ใช้เลือกจริง
   - บันทึก `drawnCards = [D[14], D[38], D[7]]`
4. **Reveal Phase**:
   - หลังอ่านจบ เซิร์ฟเวอร์เฉลย `serverSeed`
   - ผู้ใช้สามารถกดปุ่ม "ตรวจสอบความโปร่งใส" เพื่อดูว่า Deck เรียงอย่างไร และไพ่ที่ตำแหน่ง 14, 38, 7 คือไพ่ใบที่ตนได้จริง

---

## 4. โครงสร้าง Component หน้าบ้าน (Frontend Components Spec)

### 1. `<InteractiveCardFan />`
- **หน้าที่**: แสดงผลสำรับไพ่ 78 ใบในรูปแบบพัดโค้ง (Arc Fan / 3D Cylinder Curve)
- **Props**:
  - `totalCards`: 78
  - `pickedCount`: จำนวนที่เลือกไปแล้ว
  - `requiredCount`: จำนวนที่ Spread ต้องการ
  - `onCardPick`: `(index: number) => void`
  - `disabled`: boolean
- **Interaction**:
  - Dragging/Pannable สำรับซ้าย-ขวาบนมือถือ
  - Smooth Elastic Physics ด้วย `framer-motion` (`motion/react`)
  - Sound effect เบาๆ ตอน Hover และ Pick

### 2. `<CardSlot />` และ `<SpreadBoard />`
- **หน้าที่**: แสดงผังการวางไพ่ตามพิกัด $(x, y, rotate)$ ที่กำหนดใน `spreads.ts`
- **ความสามารถ**:
  - รองรับอนิเมชั่นไพ่บินจากพัดมาลงช่อง (`layoutId` shared transition)
  - พลิกไพ่ 3D Flip (Perspective 1400px, 3D transform preserve)
  - แสดงสถานะ: ว่าง (Empty slot) -> คว่ำหน้า (Facedown) -> กำลังพลิก (Flipping) -> เปิดหน้า (Revealed) -> ไฮไลต์ (Highlighted by AI stream)

### 3. `<ShuffleGesture />`
- **หน้าที่**: หน้าจอสร้างสมาธิและให้ผู้ใช้มีส่วนร่วมในการสับไพ่
- **ตัวเลือกปฏิสัมพันธ์**:
  - กดค้าง / ลากนิ้ววนเพื่อสับไพ่
  - ตัดไพ่ (Cut Deck) แบ่งเป็น 2-3 กองแล้วรวมใหม่
  - แสดงคลื่นพลังงาน/ละอองดาว (Golden Dust Particle Effect)

---

## 5. แผนการปรับปรุง API Endpoint

### ปรับปรุง `POST /api/reading/[id]/shuffle`
รองรับ payload:
```json
{
  "clientSeed": "a8f9c...gesture_hash",
  "pickedIndices": [12, 45, 3]  // ลำดับไพ่ที่ผู้ใช้จิ้มเลือกเองจากสำรับ 78 ใบ
}
```
หากไม่ได้ส่ง `pickedIndices` มา (เช่น fallback สำหรับโหมดด่วน) จะใช้ `[0, 1, 2, ...]` จากบนสุดของสำรับเป็นค่าเริ่มต้น
