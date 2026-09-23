# A3-frontend-reading

## ความคืบหน้า

## ข้อค้นพบ

### 🔴 A3-01 · ท่อ AI กลาง (`useAiReading`) ไม่ฟังเหตุการณ์ `error` และไม่มีด่าน "สตรีมจบแต่ไม่มี done" → ค้างสถานะ streaming ตลอดกาล
- ที่: `src/lib/reading/use-ai-reading.ts:377-420` (switch ไม่มี `case "error"` + หลัง `while` ไม่เช็กว่าได้ `done` หรือยัง)
- ปัญหา: เซิร์ฟเวอร์ `/api/reading/[id]/read` ส่ง `event: error` (route.ts:303, 471, 481 — ไพ่หาไม่เจอ / AI ล่ม / exception) แล้ว `close()` สตรีม แต่ hook ตก `default: break` แล้วออกจากลูปเงียบ ๆ ส่วน `TarotFlow.tsx:1312-1326` มีทั้ง `case error` และ guard `!streamCompleted` (P1-4) แต่ท่อกลางไม่ได้ลอกมา
- ผลกระทบ/สถานการณ์พัง: หน้า `/daily` · `/love/1-card` · `/pick-a-card` · `/cards/birth-card` เมื่อ AI ล่ม/สตรีมขาด → `state.status` ค้าง `"streaming"` ไม่มีข้อความผิดพลาด ไม่มีปุ่มโหลดใหม่ ผู้ใช้เห็นตัวโหลดหมุนไม่รู้จบ (เซิร์ฟเวอร์คืนโควตาแล้วแต่ UI ไม่รู้)
- แนวแก้: เพิ่ม `case "error": dispatch({type:"fail", message: payload.message || failMessage}); gotTerminal = true` และหลังลูป `if (!gotTerminal) dispatch({type:"fail", message: <ข้อความสตรีมขาด>})` แบบเดียวกับ TarotFlow
