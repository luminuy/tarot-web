# A4-frontend-reading

> ผู้ตรวจ: A4 (Frontend ระบบเปิดไพ่) · ฐานโค้ด 47efdef · 2026-10-18

## ความคืบหน้า

## ข้อค้นพบ

### 🟠 A4-01 · ไพ่ใบเดียว `/daily` · `/love/1-card` ยังโชว์ "ความหมายหัวตั้ง" ตายตัวในแผงคำทำนาย ทั้งที่ไพ่กลับหัว (A3-02 แก้ไม่ครบ)
- ที่: `src/components/daily/DailyClient.tsx:361,374,387,400,413` (`card.meanings.{general,work,money,love,self}.upright`) · `src/components/love/LoveOneCardClient.tsx:379-381` (`meanings(En).love.upright`) · `:103-104` (`getContextualLoveAdvice` ใช้ `card.yesNo` ของหัวตั้ง ไม่ดูทิศ)
- ปัญหา: รอบ A3-02 แก้ให้ภาพไพ่ · คีย์เวิร์ด · ประวัติ (`summary`) ใช้ทิศจากเซิร์ฟเวอร์แล้ว แต่ `renderReading(card)` ของสองหน้านี้ไม่ได้รับทิศเลย (signature ส่งแค่ `card`) จึงเขียนข้อความหัวตั้งตายตัว · เซิร์ฟเวอร์สุ่มกลับหัว 40% (`src/lib/tarot/shuffle.ts:34` `REVERSAL_RATE = 0.4`)
- ผลกระทบ/สถานการณ์พัง: เปิด `/daily` แล้วได้ไพ่กลับหัว (ราว 4 ใน 10 ครั้ง) ➔ ภาพไพ่หมุน 180° มีป้าย "กลับหัว" + คีย์เวิร์ดด้านกลับหัว + คำอ่าน AI พูดถึงพลังด้านกลับหัว แต่แผง "แสงสว่างนำทาง 5 มิติ" ข้างใต้กลับอ่านความหมายด้านบวกของหัวตั้งทั้ง 5 ด้าน (เช่น The Tower กลับหัว แต่แผงการงาน/การเงินเป็นข้อความหัวตั้ง) · `/love/1-card` แผง "สารจากไพ่ถึงดวงใจของคุณ" และคำแนะนำตามสถานะ (ใช้ yes/no ของหัวตั้ง) ขัดกับคำอ่าน AI ด้านบน — หน้าเดียวพูดสองทาง ทำลายความน่าเชื่อถือ
- หลักฐาน: ไล่โค้ด — `OneCardRitual.tsx:441` เรียก `renderReading?.(drawnCard)` ไม่มีทิศ · DailyClient ใช้ `ritual?.isReversed` ได้เฉพาะ `MorningReflection` (บรรทัด 332) ส่วนแผง 5 มิติไม่ได้ใช้
- แนวแก้: เปลี่ยน signature เป็น `renderReading(card, isReversed)` (ส่ง `drawnReversed`) แล้วเลือก `meanings.X.reversed` เมื่อกลับหัว · `getContextualLoveAdvice` ใช้ yes/no ที่คิดทิศแล้ว (ชุดเดียวกับ `CardYesNoAnswer`) · เพิ่มด่านใน `test-flow-state`/QA ให้หาคำว่า `.upright}` ใน `renderReading`
- ความมั่นใจ: ไล่โค้ดแล้ว (traced)
