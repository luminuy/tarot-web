# A2-backend-reading

## ความคืบหน้า

## ข้อค้นพบ

### 🟠 A2-01 · คำอ่านสำรอง (mock, usage=0) ถูกบันทึกเป็นผลถาวร → เซสชันติดคำอ่านสำรองตลอดไป
- ที่: `src/app/api/reading/[id]/read/route.ts:412` (updateReading status COMPLETED + result ทุกกรณี) คู่กับ `:173` (`if (record.result) return streamCached`)
- ปัญหา: ตอน `done` ที่ `realReading=false` (Gemini ทุกโมเดลล่มชั่วคราว → `streamMockGeminiReading(..., "all_models_down")`) route คืนสิทธิ์ให้ แต่ยังเขียน `result=mock` + `COMPLETED` ลง memory และ `persistReading` (KV/Redis)
- ผลกระทบ/สถานการณ์พัง: AI ล่ม 1 นาที → ผู้ใช้ได้คำอ่านสำรอง กด "โหลดใหม่/ลองอีกครั้ง" หลัง AI กลับมา ก็ได้ `streamCached` คำอ่านสำรองเดิมทุกครั้ง (2 ชม.) ไม่มีทางได้คำอ่านจริงของไพ่ชุดนั้น และแชทต่อยอดก็ใช้ summary ของ mock เป็นบริบท
- แนวแก้: บันทึก `result` เฉพาะเมื่อ `realReading === true`; กรณี mock ให้ตั้ง status กลับเป็น `DRAWN/FAILED` (ไม่ persist result) เพื่อให้ยิง /read ใหม่แล้วเรียกโมเดลจริงได้
